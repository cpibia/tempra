import type { Exercise, Experience, Goal } from '../domain/types';

/**
 * Calcolo deterministico della pausa consigliata fra le serie.
 * Il valore prodotto e' sempre e solo una PROPOSTA: la UI lo mostra come modificabile.
 * Formula e coefficienti in docs/research/01-scienza-allenamento.md, sezione 4.2.
 */

interface RestBase { base: number; min: number; max: number }

const REST_BASE: Record<Goal, RestBase> = {
  strength: { base: 210, min: 150, max: 300 },
  muscle: { base: 120, min: 60, max: 240 },
  recomp: { base: 105, min: 45, max: 180 },
  fat_loss: { base: 75, min: 30, max: 150 },
  endurance: { base: 45, min: 20, max: 90 },
  health: { base: 90, min: 45, max: 150 },
};

const K_LEVEL: Record<Experience, number> = {
  beginner: 0.9,
  intermediate: 1.0,
  advanced: 1.1,
};

/** Peso dell'esercizio sul sistema: piu' e' globale e assiale, piu' recupero serve. */
export function exerciseRestFactor(exercise: Exercise): number {
  if (exercise.axialLoad && exercise.mechanic === 'compound') return 1.4;
  if (exercise.pattern === 'olympic') return 1.4;
  if (exercise.mechanic === 'compound') {
    const guided = exercise.equipment === 'machine' || exercise.equipment === 'cable';
    return guided ? 1.0 : 1.2;
  }
  if (exercise.pattern === 'core' || exercise.pattern === 'mobility') return 0.6;
  return 0.75;
}

function intensityFactor(reps: number | undefined, percent1rm: number | undefined): number {
  const pct = percent1rm ?? (reps !== undefined ? undefined : 70);
  if (pct !== undefined) {
    if (pct >= 90) return 1.3;
    if (pct >= 80) return 1.15;
    if (pct >= 65) return 1.0;
    if (pct >= 50) return 0.85;
    return 0.7;
  }
  const r = reps ?? 10;
  if (r <= 3) return 1.3;
  if (r <= 6) return 1.15;
  if (r <= 12) return 1.0;
  if (r <= 20) return 0.85;
  return 0.7;
}

function effortFactor(rir: number | undefined): number {
  if (rir === undefined) return 1.0;
  if (rir <= 0) return 1.15;
  if (rir === 1) return 1.05;
  if (rir <= 3) return 1.0;
  return 0.9;
}

export const roundTo15 = (seconds: number): number => Math.round(seconds / 15) * 15;

export interface RestInput {
  exercise: Exercise;
  goal: Goal;
  experience: Experience;
  reps?: number;
  percent1rm?: number;
  rir?: number;
  /** Fattore aggiuntivo delle tecniche speciali (superserie, drop set, cluster). */
  techniqueFactor?: number;
}

export function recommendedRest(input: RestInput): number {
  const { exercise, goal, experience, reps, percent1rm, rir, techniqueFactor = 1 } = input;

  if (exercise.loadType === 'time') {
    return restForTimedExercise(exercise, goal);
  }

  const cfg = REST_BASE[goal];
  const raw = cfg.base
    * exerciseRestFactor(exercise)
    * intensityFactor(reps, percent1rm)
    * effortFactor(rir)
    * K_LEVEL[experience]
    * techniqueFactor;

  return Math.min(cfg.max, Math.max(cfg.min, roundTo15(raw)));
}

/**
 * Esercizi misurati in secondi: la pausa si ricava dal rapporto lavoro/recupero
 * invece che dall'intensita' del carico (sezione 4.3).
 */
export function restForTimedExercise(exercise: Exercise, goal: Goal, durationSec?: number): number {
  const duration = durationSec ?? defaultHoldDuration(exercise);
  let ratio = 1.0;
  if (exercise.category === 'stretching') ratio = 0.35;
  else if (exercise.pattern === 'core') ratio = duration <= 30 ? 2.0 : 1.0;
  else if (exercise.category === 'cardio') ratio = 0.75;
  else ratio = 1.5;

  let rest = duration * ratio;
  if (goal === 'fat_loss' || goal === 'endurance') rest *= 0.7;
  return Math.min(180, Math.max(15, roundTo15(rest)));
}

/** Durata predefinita di una serie isometrica, in secondi. */
export function defaultHoldDuration(exercise: Exercise): number {
  if (exercise.category === 'stretching') return 30;
  if (exercise.category === 'cardio') return 300;
  if (exercise.pattern === 'core') return 45;
  return 40;
}
