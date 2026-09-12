import type { Plan, Session, PersonalRecord, BodyMeasurement, Profile, Settings } from '@tempra/core';
import { db, getSettings, saveSettings } from '../db/db';
import { isSignedIn, isSyncConfigured, pull, push, type DocumentKind, type SyncDocument } from './api';

/**
 * Sincronizzazione bidirezionale.
 *
 * Ordine delle operazioni: prima si invia, poi si scarica. Cosi' una modifica
 * appena fatta sul dispositivo non viene sovrascritta da una copia del server
 * piu' vecchia, e il confronto per data di modifica lavora sempre su dati freschi.
 */

const CURSOR_KEY = 'tempra.syncCursor';

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
  } catch {
    // Senza cursore la prossima sincronizzazione scarica tutto: e' solo piu' lenta.
  }
};

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
    add('record', record.id, record, record.achievedAt);
  }
  for (const measurement of await db.measurements.toArray()) {
    add('measurement', measurement.id, measurement, measurement.date);
  }
  for (const settings of await db.settings.toArray()) {
    add('settings', settings.id, settings, new Date().toISOString());
  }

  return documents;
}

async function applyRemoteDocuments(documents: SyncDocument[]): Promise<number> {
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
        if (!local || local.updatedAt < remote.updatedAt) {
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
        if (!local || local.updatedAt < remote.updatedAt) {
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
        if (!(await db.records.get(remote.id))) {
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

export async function runSync(): Promise<SyncReport | null> {
  if (!isSyncConfigured() || !isSignedIn()) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  // La sincronizzazione va attivata esplicitamente: senza questo controllo
  // basterebbe una sessione ancora valida per far partire un invio non voluto.
  const current = await getSettings();
  if (!current.syncEnabled) return null;

  const local = await collectLocalDocuments();
  let pushed = 0;
  let skipped = 0;

  // Si invia a blocchi: un utente di lungo corso puo' avere centinaia di sessioni.
  for (let i = 0; i < local.length; i += 200) {
    const result = await push(local.slice(i, i + 200));
    pushed += result.applied;
    skipped += result.skipped.length;
  }

  let pulled = 0;
  let cursor = readCursor();
  let hasMore = true;

  while (hasMore) {
    const result = await pull(cursor);
    pulled += await applyRemoteDocuments(result.documents);
    cursor = result.cursor ?? cursor;
    hasMore = result.hasMore;
    writeCursor(result.cursor);
  }

  const at = new Date().toISOString();
  await saveSettings({ lastSyncAt: at });

  return { pushed, pulled, skipped, at };
}

/** Sincronizza quando la connessione torna e quando l'app torna in primo piano. */
export function installSyncTriggers(onReport?: (report: SyncReport) => void): () => void {
  const attempt = () => {
    void runSync().then((report) => { if (report && onReport) onReport(report); }).catch(() => undefined);
  };

  const onVisibility = () => { if (document.visibilityState === 'visible') attempt(); };
  window.addEventListener('online', attempt);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.removeEventListener('online', attempt);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
