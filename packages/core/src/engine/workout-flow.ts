import type { LoggedSet, Session, SessionEntry } from '../domain/types';
import { supersetPositions } from './supersets';

/**
 * Logica dell'allenamento guidato: un esercizio alla volta, una serie alla
 * volta. Tutto e' derivato dai dati della sessione, nessuno stato nascosto:
 * dopo un ricaricamento o un'app sospesa si riparte esattamente da dove si era.
 */

export type SetPhase = 'pending' | 'running' | 'logging' | 'done';

export function setPhase(set: LoggedSet): SetPhase {
  if (set.completed) return 'done';
  if (set.durationSec !== undefined) return 'logging';
  if (set.startedAt) return 'running';
  return 'pending';
}

/** Prima serie non completata dell'esercizio, -1 se sono tutte fatte. */
export function currentSetIndex(entry: SessionEntry): number {
  return entry.sets.findIndex((set) => !set.completed);
}

const hasWorkLeft = (entry: SessionEntry | undefined): boolean =>
  Boolean(entry && entry.sets.some((set) => !set.completed));

/** Il prossimo esercizio con serie da fare, cercando in avanti e poi dall'inizio. */
export function nextEntryWithWork(entries: SessionEntry[], fromIndex: number): number {
  for (let step = 1; step <= entries.length; step += 1) {
    const index = (fromIndex + step) % entries.length;
    if (index !== fromIndex && hasWorkLeft(entries[index])) return index;
  }
  return -1;
}

export type AfterSet =
  /** In superset: si passa subito al prossimo esercizio del giro, senza recupero. */
  | { kind: 'superset-next'; entryIndex: number }
  /** Recupero, poi si resta (o si torna) sull'esercizio indicato. */
  | { kind: 'rest'; entryIndex: number }
  /** Esercizio finito: recupero e passaggio al successivo, se c'e'. */
  | { kind: 'exercise-done'; nextEntryIndex: number }
  | { kind: 'workout-done' };

/** Cosa succede dopo aver completato una serie dell'esercizio in posizione `entryIndex`. */
export function afterSetCompleted(entries: SessionEntry[], entryIndex: number): AfterSet {
  const position = supersetPositions(entries)[entryIndex];

  if (position) {
    const start = entryIndex - position.index;
    const members = Array.from({ length: position.size }, (_, i) => start + i);
    const laterInRound = members.slice(position.index + 1).find((i) => hasWorkLeft(entries[i]));
    if (laterInRound !== undefined) return { kind: 'superset-next', entryIndex: laterInRound };
    const nextRound = members.find((i) => hasWorkLeft(entries[i]));
    if (nextRound !== undefined) return { kind: 'rest', entryIndex: nextRound };
  } else if (hasWorkLeft(entries[entryIndex])) {
    return { kind: 'rest', entryIndex };
  }

  const next = nextEntryWithWork(entries, entryIndex);
  return next === -1 ? { kind: 'workout-done' } : { kind: 'exercise-done', nextEntryIndex: next };
}

/**
 * Calorie stimate con il Compendium of Physical Activities 2024, codice 02054
 * (resistance training, piu' esercizi, 8-15 ripetizioni): 3,5 MET sull'intera
 * durata. kcal = MET x kg x ore. Anche i dispositivi da polso sbagliano di
 * almeno il 20-30%: il valore si arrotonda alla decina e si presenta come stima.
 */
export const RESISTANCE_TRAINING_MET = 3.5;

export function estimateCalories(durationSec: number, bodyWeightKg: number | undefined): number | null {
  if (!bodyWeightKg || bodyWeightKg <= 0 || durationSec <= 0) return null;
  const kcal = RESISTANCE_TRAINING_MET * bodyWeightKg * (durationSec / 3600);
  return Math.round(kcal / 10) * 10;
}

export interface SessionStats {
  sets: number;
  reps: number;
  volumeKg: number;
  /** Somma delle durate delle serie cronometrate. */
  timedSec: number;
  perExercise: { exerciseId: string; sets: number; reps: number; volumeKg: number }[];
}

export function sessionStats(session: Pick<Session, 'entries'>): SessionStats {
  const stats: SessionStats = { sets: 0, reps: 0, volumeKg: 0, timedSec: 0, perExercise: [] };
  for (const entry of session.entries) {
    const row = { exerciseId: entry.exerciseId, sets: 0, reps: 0, volumeKg: 0 };
    for (const set of entry.sets) {
      if (!set.completed) continue;
      row.sets += 1;
      row.reps += set.reps ?? 0;
      row.volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
      stats.timedSec += set.durationSec ?? 0;
    }
    stats.sets += row.sets;
    stats.reps += row.reps;
    stats.volumeKg += row.volumeKg;
    if (row.sets) stats.perExercise.push({ ...row, volumeKg: Math.round(row.volumeKg) });
  }
  stats.volumeKg = Math.round(stats.volumeKg);
  return stats;
}
