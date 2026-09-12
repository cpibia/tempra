import {
  createId, nowIso, summarizeSession, candidatesFromSets, detectNewRecords,
  type Plan, type PlanDay, type PlanItem, type Profile, type Session, type SessionEntry,
  type PersonalRecord, type BodyMeasurement, type Exercise, type LoggedSet,
  buildPlannedSets, getExercise,
} from '@tempra/core';
import { db, PROFILE_ID, markProfileExists } from './db';

/** Accesso ai dati locali. Ogni scrittura aggiorna updatedAt per la sincronizzazione. */

// --- Profilo ---------------------------------------------------------------

export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const existing = await db.profiles.get(PROFILE_ID);
  const profile: Profile = {
    id: PROFILE_ID,
    sex: 'unspecified',
    goal: 'health',
    place: 'gym',
    equipment: [],
    daysPerWeek: 3,
    sessionMinutes: 60,
    experience: 'beginner',
    conditions: [],
    excludedExerciseIds: [],
    units: 'kg',
    restPreference: 'standard',
    createdAt: nowIso(),
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };
  await db.profiles.put(profile);
  markProfileExists();
  return profile;
}

// --- Schede ----------------------------------------------------------------

export async function listPlans(): Promise<Plan[]> {
  const plans = await db.plans.filter((p) => !p.deletedAt).toArray();
  return plans.sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.updatedAt.localeCompare(a.updatedAt));
}

export async function getActivePlan(): Promise<Plan | undefined> {
  const plans = await db.plans.filter((p) => p.isActive && !p.deletedAt).toArray();
  return plans[0];
}

export async function savePlan(plan: Plan): Promise<void> {
  await db.plans.put({ ...plan, updatedAt: nowIso() });
}

export async function setActivePlan(planId: string): Promise<void> {
  await db.transaction('rw', db.plans, async () => {
    const all = await db.plans.toArray();
    for (const plan of all) {
      const shouldBeActive = plan.id === planId;
      if (plan.isActive !== shouldBeActive) {
        await db.plans.put({ ...plan, isActive: shouldBeActive, updatedAt: nowIso() });
      }
    }
  });
}

/** Cancellazione logica: il record resta per poter propagare l'eliminazione in sincronizzazione. */
export async function deletePlan(planId: string): Promise<void> {
  const plan = await db.plans.get(planId);
  if (!plan) return;
  await db.plans.put({ ...plan, deletedAt: nowIso(), isActive: false, updatedAt: nowIso() });
}

export async function duplicatePlan(planId: string): Promise<Plan | undefined> {
  const plan = await db.plans.get(planId);
  if (!plan) return undefined;
  const copy: Plan = {
    ...plan,
    id: createId('plan'),
    name: `${plan.name} (copia)`,
    source: 'duplicated',
    isActive: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: undefined,
    days: plan.days.map((day) => ({
      ...day,
      id: createId('day'),
      items: day.items.map((item) => ({
        ...item,
        id: createId('item'),
        sets: item.sets.map((set) => ({ ...set, id: createId('set') })),
      })),
    })),
  };
  await db.plans.put(copy);
  return copy;
}

export function createEmptyPlan(name = 'Nuova scheda'): Plan {
  return {
    id: createId('plan'),
    name,
    source: 'manual',
    goal: 'muscle',
    split: 'custom',
    daysPerWeek: 1,
    weeks: 4,
    days: [createEmptyDay('Giorno 1', 0)],
    isActive: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function createEmptyDay(name: string, order: number): PlanDay {
  return { id: createId('day'), name, order, focus: [], items: [], estimatedMinutes: 0 };
}

/** Crea la riga di scheda per un esercizio, con serie e pause gia' proposte. */
export function createPlanItem(exercise: Exercise, plan: Plan, profile: Profile | undefined, order: number): PlanItem {
  const { sets, restSec } = buildPlannedSets({
    exercise,
    role: exercise.mechanic === 'compound' ? 'primary' : 'isolation',
    goal: plan.goal,
    experience: profile?.experience ?? 'beginner',
    setCount: 3,
  });
  return { id: createId('item'), exerciseId: exercise.id, order, technique: 'straight', sets, restSec };
}

// --- Sessioni --------------------------------------------------------------

export async function getActiveSession(): Promise<Session | undefined> {
  const sessions = await db.sessions.where('status').equals('active').toArray();
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

export async function listSessions(limit = 50): Promise<Session[]> {
  const sessions = await db.sessions.where('status').equals('completed').toArray();
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
}

/**
 * Avvia una sessione a partire da un giorno di scheda.
 * I valori di peso e ripetizioni vengono precompilati con quelli dell'ultima
 * volta che l'esercizio e' stato eseguito: e' la singola scelta che riduce
 * di piu' il numero di tocchi durante l'allenamento.
 */
export async function startSessionFromDay(plan: Plan, day: PlanDay): Promise<Session> {
  const entries: SessionEntry[] = [];

  for (const item of day.items) {
    const previous = await getLastPerformance(item.exerciseId);
    entries.push({
      id: createId('entry'),
      exerciseId: item.exerciseId,
      order: item.order,
      supersetGroup: item.supersetGroup,
      technique: item.technique,
      sets: item.sets.map((set, index) => {
        const prior = previous?.sets[index];
        return {
          id: createId('set'),
          kind: set.kind,
          targetReps: set.reps,
          targetTimeSec: set.timeSec,
          targetWeightKg: set.weightKg,
          weightKg: prior?.weightKg ?? set.weightKg,
          reps: undefined,
          timeSec: set.timeSec,
          restSec: set.restSec,
          completed: false,
        } satisfies LoggedSet;
      }),
    });
  }

  const session: Session = {
    id: createId('sess'),
    planId: plan.id,
    planDayId: day.id,
    name: day.name,
    status: 'active',
    startedAt: nowIso(),
    durationSec: 0,
    entries,
    totalVolumeKg: 0,
    totalSets: 0,
    updatedAt: nowIso(),
  };
  await db.sessions.put(session);
  return session;
}

export async function startEmptySession(name = 'Allenamento libero'): Promise<Session> {
  const session: Session = {
    id: createId('sess'),
    name,
    status: 'active',
    startedAt: nowIso(),
    durationSec: 0,
    entries: [],
    totalVolumeKg: 0,
    totalSets: 0,
    updatedAt: nowIso(),
  };
  await db.sessions.put(session);
  return session;
}

/** Salvataggio continuo: chiamato a ogni modifica, senza alcun pulsante "salva". */
export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put({ ...session, updatedAt: nowIso() });
}

export async function discardSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  await db.sessions.put({ ...session, status: 'discarded', endedAt: nowIso(), updatedAt: nowIso() });
}

export interface CompletionSummary {
  session: Session;
  newRecords: PersonalRecord[];
}

/** Chiude la sessione, calcola i totali e registra i nuovi record personali. */
export async function completeSession(session: Session): Promise<CompletionSummary> {
  const cleaned: Session = {
    ...session,
    entries: session.entries
      .map((entry) => ({ ...entry, sets: entry.sets.filter((s) => s.completed) }))
      .filter((entry) => entry.sets.length > 0),
  };

  const totals = summarizeSession(cleaned);
  const endedAt = nowIso();
  const durationSec = Math.max(
    0,
    Math.round((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000),
  );

  const newRecords: PersonalRecord[] = [];
  for (const entry of cleaned.entries) {
    const existing = await db.records.where('exerciseId').equals(entry.exerciseId).toArray();
    const winners = detectNewRecords(candidatesFromSets(entry.exerciseId, entry.sets), existing);
    for (const winner of winners) {
      const record: PersonalRecord = {
        id: createId('pr'),
        exerciseId: winner.exerciseId,
        type: winner.type,
        value: winner.value,
        reps: winner.reps,
        weightKg: winner.weightKg,
        sessionId: session.id,
        achievedAt: endedAt,
      };
      newRecords.push(record);
      const set = entry.sets.find((s) => s.id === winner.setId);
      if (set) set.prType = winner.type;
    }
  }

  const finished: Session = {
    ...cleaned,
    status: 'completed',
    endedAt,
    durationSec,
    totalVolumeKg: totals.totalVolumeKg,
    totalSets: totals.totalSets,
    updatedAt: endedAt,
  };

  await db.transaction('rw', db.sessions, db.records, async () => {
    await db.sessions.put(finished);
    if (newRecords.length) await db.records.bulkPut(newRecords);
  });

  return { session: finished, newRecords };
}

// --- Storico per esercizio -------------------------------------------------

export interface Performance {
  sessionId: string;
  date: string;
  sets: LoggedSet[];
}

/** Ultima esecuzione registrata di un esercizio, usata per precompilare i campi. */
export async function getLastPerformance(exerciseId: string): Promise<Performance | undefined> {
  const history = await getExerciseHistory(exerciseId, 1);
  return history[0];
}

export async function getExerciseHistory(exerciseId: string, limit = 30): Promise<Performance[]> {
  const sessions = await db.sessions.where('status').equals('completed').toArray();
  const out: Performance[] = [];
  for (const session of sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const sets = entry.sets.filter((s) => s.completed && s.kind !== 'warmup');
    if (!sets.length) continue;
    out.push({ sessionId: session.id, date: session.endedAt ?? session.startedAt, sets });
    if (out.length >= limit) break;
  }
  return out;
}

export async function listRecords(): Promise<PersonalRecord[]> {
  const records = await db.records.toArray();
  const best = new Map<string, PersonalRecord>();
  for (const record of records) {
    const key = `${record.exerciseId}::${record.type}`;
    const current = best.get(key);
    if (!current || record.value > current.value) best.set(key, record);
  }
  return [...best.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}

export function recordExerciseName(record: PersonalRecord): string {
  return getExercise(record.exerciseId)?.name ?? record.exerciseId;
}

// --- Misure ----------------------------------------------------------------

export async function saveMeasurement(measurement: Omit<BodyMeasurement, 'id'> & { id?: string }): Promise<void> {
  await db.measurements.put({ ...measurement, id: measurement.id ?? createId('bm') });
}

export async function listMeasurements(): Promise<BodyMeasurement[]> {
  const list = await db.measurements.toArray();
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
