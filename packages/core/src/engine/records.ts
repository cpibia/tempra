import type { LoggedSet, PersonalRecord, Session } from '../domain/types';
import { estimateOneRm } from './strength-math';

/**
 * Rilevamento dei record personali.
 * Si tengono quattro primati per esercizio, perche' migliorare non significa
 * solo alzare piu' peso: contano anche le ripetizioni a parita' di carico,
 * il volume di una singola serie e il massimale stimato.
 */

export type PrType = PersonalRecord['type'];

export interface PrCandidate {
  exerciseId: string;
  type: PrType;
  value: number;
  reps?: number;
  weightKg?: number;
  setId: string;
}

/** Estrae dalle serie completate i valori candidati a record. */
export function candidatesFromSets(exerciseId: string, sets: LoggedSet[]): PrCandidate[] {
  const out: PrCandidate[] = [];
  for (const set of sets) {
    if (!set.completed || set.kind === 'warmup') continue;

    if (set.timeSec && set.timeSec > 0 && !set.reps) {
      out.push({ exerciseId, type: 'time', value: set.timeSec, setId: set.id });
      continue;
    }
    const reps = set.reps ?? 0;
    const weight = set.weightKg ?? 0;
    if (reps <= 0) continue;

    if (weight > 0) {
      out.push({ exerciseId, type: 'weight', value: weight, reps, weightKg: weight, setId: set.id });
      out.push({ exerciseId, type: 'volume', value: weight * reps, reps, weightKg: weight, setId: set.id });
      out.push({
        exerciseId, type: 'e1rm',
        value: Math.round(estimateOneRm(weight, reps) * 10) / 10,
        reps, weightKg: weight, setId: set.id,
      });
    } else {
      out.push({ exerciseId, type: 'reps', value: reps, reps, setId: set.id });
    }
  }
  return out;
}

/**
 * Confronta i candidati con i primati esistenti e restituisce i nuovi record.
 * Il record di carico vale solo se il peso e' maggiore, a parita' di ripetizioni o piu':
 * alzare piu' peso per meno ripetizioni e' comunque un primato di carico.
 */
export function detectNewRecords(
  candidates: PrCandidate[],
  existing: PersonalRecord[],
): PrCandidate[] {
  const best = new Map<string, number>();
  for (const pr of existing) {
    const key = `${pr.exerciseId}::${pr.type}`;
    best.set(key, Math.max(best.get(key) ?? 0, pr.value));
  }

  const winners = new Map<string, PrCandidate>();
  for (const c of candidates) {
    const key = `${c.exerciseId}::${c.type}`;
    const previous = best.get(key) ?? 0;
    const currentBestInSession = winners.get(key);
    if (c.value > previous && (!currentBestInSession || c.value > currentBestInSession.value)) {
      winners.set(key, c);
    }
  }
  return [...winners.values()];
}

/** Statistiche aggregate di una sessione, calcolate alla chiusura. */
export function summarizeSession(session: Session): { totalVolumeKg: number; totalSets: number; totalReps: number } {
  let totalVolumeKg = 0;
  let totalSets = 0;
  let totalReps = 0;
  for (const entry of session.entries) {
    for (const set of entry.sets) {
      if (!set.completed || set.kind === 'warmup') continue;
      totalSets += 1;
      totalReps += set.reps ?? 0;
      if (set.weightKg && set.reps) totalVolumeKg += set.weightKg * set.reps;
    }
  }
  return { totalVolumeKg: Math.round(totalVolumeKg), totalSets, totalReps };
}
