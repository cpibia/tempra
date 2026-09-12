import Dexie, { type EntityTable } from 'dexie';
import type {
  Profile, Plan, Session, PersonalRecord, BodyMeasurement, Settings,
} from '@tempra/core';

/**
 * Tempra e' local-first: IndexedDB e' la fonte di verita'.
 * L'app funziona completamente offline; la sincronizzazione con il server,
 * quando attiva, e' un livello aggiuntivo e opzionale.
 */

export interface SyncOutboxEntry {
  id: string;
  table: 'profiles' | 'plans' | 'sessions' | 'records' | 'measurements' | 'settings';
  recordId: string;
  op: 'upsert' | 'delete';
  payload: unknown;
  queuedAt: string;
  attempts: number;
}

export class TempraDb extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  plans!: EntityTable<Plan, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  records!: EntityTable<PersonalRecord, 'id'>;
  measurements!: EntityTable<BodyMeasurement, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  outbox!: EntityTable<SyncOutboxEntry, 'id'>;

  constructor() {
    super('tempra');
    this.version(1).stores({
      profiles: 'id, updatedAt',
      plans: 'id, isActive, updatedAt, deletedAt',
      sessions: 'id, planId, status, startedAt, updatedAt',
      records: 'id, exerciseId, type, achievedAt, [exerciseId+type]',
      measurements: 'id, date',
      settings: 'id',
      outbox: 'id, table, queuedAt',
    });
  }
}

export const db = new TempraDb();

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  theme: 'dark',
  units: 'kg',
  weightStepKg: 2.5,
  restTimerAutoStart: true,
  restTimerSound: true,
  restTimerVibration: true,
  keepAwake: true,
  reduceMotion: false,
  speakRestCountdown: false,
  firstDayOfWeek: 1,
  syncEnabled: false,
};

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('settings');
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: 'settings' });
}

export const PROFILE_ID = 'me';

/**
 * Le query reattive di Dexie notificano in modo asincrono: fra il salvataggio del
 * profilo e la propagazione passa un tick, e in quel tick una guardia di rotta
 * vedrebbe ancora "nessun profilo". Questo segnale sincrono evita che chi ha appena
 * completato l'onboarding ci venga rispedito dentro.
 */
let profileExists = false;

export const isProfileKnownToExist = (): boolean => profileExists;
export const markProfileExists = (): void => { profileExists = true; };

export async function getProfile(): Promise<Profile | undefined> {
  const profile = await db.profiles.get(PROFILE_ID);
  if (profile) profileExists = true;
  return profile;
}
