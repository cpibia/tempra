import type { Exercise } from '../domain/types';
import type { AdaptRules, ConditionRule } from './types';
import { CONDITIONS, getCondition } from './conditions';
import { EXERCISES } from '../engine/catalog';

/**
 * Screening sanitario: traduce le condizioni dichiarate nell'onboarding
 * in filtri sul catalogo e in parametri piu' prudenti.
 *
 * Criterio di risoluzione dei conflitti, come da ricerca clinica: vince sempre
 * il vincolo piu' restrittivo, e la lista esplicita di esercizi ha l'ultima parola.
 */

/** Posizione di ogni esercizio nel catalogo: le regole sono compilate su questi indici. */
const INDEX_BY_ID = new Map(EXERCISES.map((e, i) => [e.id, i]));

export interface HealthScreening {
  conditions: ConditionRule[];
  requiresMedicalClearance: boolean;
  /** Indici degli esercizi da non proporre. */
  blocked: Set<number>;
  /** Indici degli esercizi da proporre con un avviso. */
  warned: Set<number>;
  reduceVolume: boolean;
  minRir?: number;
  minReps?: number;
  minRestSec?: number;
  maxPercent1rm?: number;
  avoidValsalva: boolean;
  preferMachines: boolean;
}

export const EMPTY_SCREENING: HealthScreening = {
  conditions: [],
  requiresMedicalClearance: false,
  blocked: new Set(),
  warned: new Set(),
  reduceVolume: false,
  avoidValsalva: false,
  preferMachines: false,
};

/** Compila una volta sola le regole delle condizioni selezionate. */
export function buildScreening(conditionIds: string[]): HealthScreening {
  const conditions = conditionIds
    .map(getCondition)
    .filter((c): c is ConditionRule => Boolean(c));

  if (!conditions.length) return EMPTY_SCREENING;

  const blocked = new Set<number>();
  const warned = new Set<number>();
  const adapt: AdaptRules = {};

  for (const condition of conditions) {
    for (const index of condition.blocked) blocked.add(index);
    for (const index of condition.warn) warned.add(index);

    const a = condition.adapt;
    if (a.minRir !== undefined) adapt.minRir = Math.max(adapt.minRir ?? 0, a.minRir);
    if (a.minReps !== undefined) adapt.minReps = Math.max(adapt.minReps ?? 0, a.minReps);
    if (a.minRestSec !== undefined) adapt.minRestSec = Math.max(adapt.minRestSec ?? 0, a.minRestSec);
    if (a.maxPercent1rm !== undefined) {
      adapt.maxPercent1rm = Math.min(adapt.maxPercent1rm ?? 100, a.maxPercent1rm);
    }
    adapt.reduceVolume = adapt.reduceVolume || Boolean(a.reduceVolume);
    adapt.avoidValsalva = adapt.avoidValsalva || Boolean(a.avoidValsalva);
    adapt.preferMachines = adapt.preferMachines || Boolean(a.preferMachines);
  }

  // Un esercizio escluso non ha bisogno anche dell'avviso.
  for (const index of blocked) warned.delete(index);

  return {
    conditions,
    requiresMedicalClearance: conditions.some((c) => c.requiresMedicalClearance),
    blocked,
    warned,
    reduceVolume: Boolean(adapt.reduceVolume),
    minRir: adapt.minRir,
    minReps: adapt.minReps,
    minRestSec: adapt.minRestSec,
    maxPercent1rm: adapt.maxPercent1rm,
    avoidValsalva: Boolean(adapt.avoidValsalva),
    preferMachines: Boolean(adapt.preferMachines),
  };
}

export interface ScreeningVerdict {
  blocked: boolean;
  warned: boolean;
  /** Condizioni che hanno motivato l'esclusione o l'avviso, in italiano. */
  reason?: string;
  conditionIds: string[];
}

const SAFE: ScreeningVerdict = { blocked: false, warned: false, conditionIds: [] };

/**
 * Verifica un esercizio contro le condizioni dichiarate.
 * Il motivo viene riportato all'utente, cosi' sa perche' quell'esercizio
 * non compare nella sua scheda invece di sospettare un errore.
 */
export function screenExercise(exercise: Exercise, screening: HealthScreening): ScreeningVerdict {
  if (!screening.conditions.length) return SAFE;
  const index = INDEX_BY_ID.get(exercise.id);
  if (index === undefined) return SAFE;

  const isBlocked = screening.blocked.has(index);
  const isWarned = !isBlocked && screening.warned.has(index);
  if (!isBlocked && !isWarned) return SAFE;

  const culprits = screening.conditions.filter((c) =>
    (isBlocked ? c.blocked : c.warn).includes(index));
  const labels = culprits.map((c) => c.label);

  return {
    blocked: isBlocked,
    warned: isWarned,
    conditionIds: culprits.map((c) => c.id),
    reason: isBlocked
      ? `Non lo inseriamo per: ${labels.join(', ')}.`
      : `Da eseguire con cautela per: ${labels.join(', ')}.`,
  };
}

/** Applica i vincoli sanitari a una prescrizione gia' calcolata. */
export function adaptPrescription(
  prescription: { reps?: [number, number]; rir?: number; restSec: number; percent1rm?: number },
  screening: HealthScreening,
): { reps?: [number, number]; rir?: number; restSec: number; percent1rm?: number } {
  const out = { ...prescription };
  if (screening.minRir !== undefined && out.rir !== undefined) {
    out.rir = Math.max(out.rir, screening.minRir);
  }
  if (screening.minReps !== undefined && out.reps) {
    const min = Math.max(out.reps[0], screening.minReps);
    out.reps = [min, Math.max(min + 2, out.reps[1])];
  }
  if (screening.maxPercent1rm !== undefined && out.percent1rm !== undefined) {
    out.percent1rm = Math.min(out.percent1rm, screening.maxPercent1rm);
  }
  const rest = Math.max(out.restSec, screening.minRestSec ?? 0);
  out.restSec = Math.round(rest / 15) * 15;
  return out;
}

export { CONDITIONS };
