import { create } from 'zustand';
import { nowIso, type Plan, type Session, type PersonalRecord, type BodyMeasurement, type Profile, type Settings } from '@tempra/core';
import { db, getSettings, saveSettings } from '../db/db';
import {
  ApiError, createSyncCode, isSignedIn, isSyncConfigured, joinSyncCode, logout, pull, push,
  type DocumentKind, type SyncDocument,
} from './api';

/**
 * Sincronizzazione bidirezionale.
 *
 * Ordine delle operazioni: prima si invia, poi si scarica. Cosi' una modifica
 * appena fatta sul dispositivo non viene sovrascritta da una copia del server
 * piu' vecchia, e il confronto per data di modifica lavora sempre su dati freschi.
 */

const CURSOR_KEY = 'tempra.syncCursor';

/** Attesa dopo l'ultima modifica locale prima di inviare: raggruppa le scritture ravvicinate. */
const PUSH_DELAY_MS = 4000;

/**
 * Il cursore e' l'orologio del server al momento della scrittura, ma una
 * transazione ancora aperta su un altro dispositivo puo' committare documenti
 * con un istante precedente all'ultimo letto. Si riparte quindi un minuto
 * prima: riapplicare un documento gia' visto non costa nulla, perderlo si'.
 */
const CURSOR_OVERLAP_MS = 60_000;

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'error';
  error: string | null;
}

export const useSyncStatus = create<SyncStatus>(() => ({ state: 'idle', error: null }));

/**
 * Le condizioni di salute sono dati di categoria particolare ex articolo 9 del
 * GDPR, e l'interfaccia promette che restano sul dispositivo. La promessa si
 * mantiene togliendole dal documento prima di inviarlo, non fidandosi del fatto
 * che nessuno le guardi.
 *
 * Il costo e' che su un secondo dispositivo vanno reinserite. E' un prezzo
 * accettabile: la scheda gia' generata le riflette comunque, perche' gli
 * esercizi esclusi non ci sono.
 */
function redactHealthData(profile: Profile): Profile {
  return { ...profile, conditions: [] };
}

const readCursor = (): string | undefined => {
  try {
    return localStorage.getItem(CURSOR_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeCursor = (cursor: string | null): void => {
  try {
    if (cursor) localStorage.setItem(CURSOR_KEY, cursor);
    else localStorage.removeItem(CURSOR_KEY);
  } catch {
    // Senza cursore la prossima sincronizzazione scarica tutto: e' solo piu' lenta.
  }
};

const withOverlap = (cursor: string | undefined): string | undefined =>
  cursor ? new Date(new Date(cursor).getTime() - CURSOR_OVERLAP_MS).toISOString() : undefined;

/** Vero mentre si scrivono in locale i documenti ricevuti: non vanno reinviati. */
let applyingRemote = false;

export interface SyncReport {
  pushed: number;
  pulled: number;
  skipped: number;
  at: string;
}

async function collectLocalDocuments(): Promise<SyncDocument[]> {
  const documents: SyncDocument[] = [];

  const add = (kind: DocumentKind, id: string, payload: unknown, updatedAt: string, deletedAt?: string) => {
    documents.push({ id, kind, payload, updatedAt, deletedAt: deletedAt ?? null });
  };

  for (const profile of await db.profiles.toArray()) {
    add('profile', profile.id, redactHealthData(profile), profile.updatedAt);
  }
  for (const plan of await db.plans.toArray()) {
    add('plan', plan.id, plan, plan.updatedAt, plan.deletedAt);
  }
  for (const session of await db.sessions.toArray()) {
    if (session.status === 'active') continue; // una sessione in corso non si sincronizza
    add('session', session.id, session, session.updatedAt);
  }
  for (const record of await db.records.toArray()) {
    add('record', record.id, record, record.deletedAt ?? record.achievedAt, record.deletedAt);
  }
  for (const measurement of await db.measurements.toArray()) {
    add('measurement', measurement.id, measurement, measurement.date);
  }
  for (const settings of await db.settings.toArray()) {
    add('settings', settings.id, settings, new Date().toISOString());
  }

  return documents;
}

/**
 * Con `preferRemote` vince la copia del server anche se piu' vecchia: serve
 * quando un dispositivo si collega a un codice esistente, perche' un profilo
 * appena compilato sul telefono non deve sostituire quello di sempre.
 */
async function applyRemoteDocuments(documents: SyncDocument[], preferRemote = false): Promise<number> {
  let applied = 0;

  for (const doc of documents) {
    if (doc.deletedAt && doc.kind === 'plan') {
      const plan = doc.payload as Plan;
      await db.plans.put({ ...plan, deletedAt: doc.deletedAt });
      applied += 1;
      continue;
    }

    switch (doc.kind) {
      case 'profile': {
        const remote = doc.payload as Profile;
        const local = await db.profiles.get(remote.id);
        if (!local || preferRemote || local.updatedAt < remote.updatedAt) {
          // Le condizioni locali non vengono mai sovrascritte da quelle remote,
          // che per costruzione sono vuote: cancellarle sarebbe una perdita di dati.
          await db.profiles.put({ ...remote, conditions: local?.conditions ?? [] });
          applied += 1;
        }
        break;
      }
      case 'plan': {
        const remote = doc.payload as Plan;
        const local = await db.plans.get(remote.id);
        if (!local || preferRemote || local.updatedAt < remote.updatedAt) {
          await db.plans.put(remote);
          applied += 1;
        }
        break;
      }
      case 'session': {
        const remote = doc.payload as Session;
        const local = await db.sessions.get(remote.id);
        if (!local || local.updatedAt < remote.updatedAt) {
          await db.sessions.put(remote);
          applied += 1;
        }
        break;
      }
      case 'record': {
        const remote = doc.payload as PersonalRecord;
        // Un record non cambia mai, tranne quando il suo allenamento viene eliminato.
        const local = await db.records.get(remote.id);
        if (!local || (remote.deletedAt && !local.deletedAt)) {
          await db.records.put(remote);
          applied += 1;
        }
        break;
      }
      case 'measurement': {
        const remote = doc.payload as BodyMeasurement;
        await db.measurements.put(remote);
        applied += 1;
        break;
      }
      case 'settings': {
        // Le impostazioni sono per dispositivo: si accetta solo cio' che manca
        // in locale, per non ribaltare il tema o le unita' su questo telefono.
        const remote = doc.payload as Settings;
        const local = await db.settings.get('settings');
        if (!local) {
          await db.settings.put(remote);
          applied += 1;
        }
        break;
      }
    }
  }

  return applied;
}

async function pullAll(preferRemote = false): Promise<number> {
  let pulled = 0;
  let cursor = withOverlap(readCursor());
  let hasMore = true;

  applyingRemote = true;
  try {
    while (hasMore) {
      const result = await pull(cursor);
      pulled += await applyRemoteDocuments(result.documents, preferRemote);
      cursor = result.cursor ?? cursor;
      hasMore = result.hasMore;
      writeCursor(result.cursor ?? readCursor() ?? null);
    }
  } finally {
    applyingRemote = false;
  }
  return pulled;
}

async function pushAll(): Promise<{ pushed: number; skipped: number }> {
  const local = await collectLocalDocuments();
  let pushed = 0;
  let skipped = 0;

  // Si invia a blocchi: un utente di lungo corso puo' avere centinaia di sessioni.
  for (let i = 0; i < local.length; i += 200) {
    const result = await push(local.slice(i, i + 200));
    pushed += result.applied;
    skipped += result.skipped.length;
  }
  return { pushed, skipped };
}

let running: Promise<SyncReport | null> | null = null;

async function performSync(): Promise<SyncReport | null> {
  if (!isSyncConfigured() || !isSignedIn()) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  // La sincronizzazione va attivata esplicitamente: senza questo controllo
  // basterebbe una sessione ancora valida per far partire un invio non voluto.
  const current = await getSettings();
  if (!current.syncEnabled) return null;

  const { pushed, skipped } = await pushAll();
  const pulled = await pullAll();

  const at = nowIso();
  await saveSettings({ lastSyncAt: at });
  return { pushed, pulled, skipped, at };
}

/** Invia e poi scarica. Chiamate sovrapposte condividono la stessa esecuzione. */
export function runSync(): Promise<SyncReport | null> {
  if (running) return running;
  clearTimeout(pushTimer);
  pushPending = false;
  useSyncStatus.setState({ state: 'syncing', error: null });

  running = performSync()
    .then((report) => {
      useSyncStatus.setState({ state: 'idle', error: null });
      return report;
    })
    .catch((cause: unknown) => {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      useSyncStatus.setState({
        state: 'error',
        error: offline
          ? 'Sei offline: sincronizzo appena torna la connessione.'
          : cause instanceof ApiError && cause.status !== 0
            ? cause.message
            : 'Server non raggiungibile, riprovo piu tardi.',
      });
      throw cause;
    })
    .finally(() => {
      running = null;
    });
  return running;
}

/** Primo dispositivo: crea il codice e carica sul server tutto quello che c'e' qui. */
export async function startSyncWithNewCode(): Promise<string> {
  const code = await createSyncCode();
  writeCursor(null);
  await saveSettings({ syncEnabled: true });
  await runSync();
  return code;
}

/**
 * Dispositivo aggiuntivo: prima si scarica, con precedenza ai dati del server,
 * poi si invia quello che c'era solo qui. Se entrambi avevano una scheda
 * attiva, resta attiva quella che arriva dal codice.
 */
export async function joinExistingCode(input: string): Promise<string> {
  const code = await joinSyncCode(input);
  writeCursor(null);
  await saveSettings({ syncEnabled: true });
  useSyncStatus.setState({ state: 'syncing', error: null });

  const remoteActive = new Set<string>();
  const before = new Set((await db.plans.toArray()).filter((p) => p.isActive).map((p) => p.id));
  await pullAll(true);
  for (const plan of await db.plans.toArray()) {
    if (plan.isActive && !plan.deletedAt && !before.has(plan.id)) remoteActive.add(plan.id);
  }
  if (remoteActive.size) {
    for (const id of before) {
      if (remoteActive.has(id)) continue;
      const plan = await db.plans.get(id);
      if (plan?.isActive) await db.plans.put({ ...plan, isActive: false, updatedAt: nowIso() });
    }
  }

  await runSync();
  return code;
}

/** Scollega il dispositivo: i dati locali restano, il server non viene toccato. */
export async function leaveSync(): Promise<void> {
  clearTimeout(pushTimer);
  pushPending = false;
  await logout();
  writeCursor(null);
  await saveSettings({ syncEnabled: false, lastSyncAt: undefined });
  useSyncStatus.setState({ state: 'idle', error: null });
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushPending = false;

function scheduleSync(): void {
  if (applyingRemote || !isSignedIn()) return;
  clearTimeout(pushTimer);
  pushPending = true;
  pushTimer = setTimeout(() => void runSync().catch(() => undefined), PUSH_DELAY_MS);
}

/**
 * Osserva le scritture locali con gli hook di Dexie, cosi' nessuna schermata
 * deve ricordarsi di chiedere una sincronizzazione. La sessione in corso cambia
 * a ogni tocco e non si sincronizza: la si ignora finche' resta aperta.
 * Le impostazioni sono escluse perche' restano per dispositivo.
 */
function watchLocalChanges(): () => void {
  const tables = [db.profiles, db.plans, db.records, db.measurements] as const;
  const onWrite = () => { scheduleSync(); };
  const onSessionCreate = (_key: unknown, session: Session) => {
    if (session.status !== 'active') scheduleSync();
  };
  const onSessionUpdate = (mods: Partial<Session>, _key: unknown, session: Session) => {
    const status = 'status' in mods ? mods.status : session.status;
    if (status !== 'active') scheduleSync();
  };

  for (const table of tables) {
    table.hook('creating', onWrite);
    table.hook('updating', onWrite);
    table.hook('deleting', onWrite);
  }
  db.sessions.hook('creating', onSessionCreate);
  db.sessions.hook('updating', onSessionUpdate);

  return () => {
    for (const table of tables) {
      table.hook('creating').unsubscribe(onWrite);
      table.hook('updating').unsubscribe(onWrite);
      table.hook('deleting').unsubscribe(onWrite);
    }
    db.sessions.hook('creating').unsubscribe(onSessionCreate);
    db.sessions.hook('updating').unsubscribe(onSessionUpdate);
  };
}

/**
 * Sincronizza all'avvio, dopo ogni modifica locale, quando la connessione
 * torna e quando l'app torna in primo piano. Uscire dall'app con un invio in
 * attesa lo esegue subito: un telefono potrebbe non tornare in tempo a farlo.
 */
export function installSyncTriggers(): () => void {
  const attempt = () => { void runSync().catch(() => undefined); };

  const onVisibility = () => {
    if (document.visibilityState === 'visible' || pushPending) attempt();
  };
  const stopWatching = watchLocalChanges();
  window.addEventListener('online', attempt);
  window.addEventListener('focus', attempt);
  document.addEventListener('visibilitychange', onVisibility);
  attempt();

  return () => {
    stopWatching();
    clearTimeout(pushTimer);
    window.removeEventListener('online', attempt);
    window.removeEventListener('focus', attempt);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
