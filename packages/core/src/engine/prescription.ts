import type { Exercise, Experience, Goal, PlannedSet, SetTechnique } from '../domain/types';
import type { SlotRole } from './splits';
import { createId } from '../utils/id';
import { recommendedRest, defaultHoldDuration } from './rest';
import { percentForRepsAtRir } from './strength-math';

/**
 * Traduce obiettivo, ruolo dell'esercizio e livello in una prescrizione concreta:
 * intervallo di ripetizioni, ripetizioni di riserva, pausa.
 * Riferimento: docs/research/01-scienza-allenamento.md, sezioni 3.1, 3.3 e 14.1.
 */

export interface RepPrescription {
  reps: [number, number];
  rir: number;
}

type RoleClass = 'compound' | 'isolation' | 'core';

function roleClass(exercise: Exercise, role: SlotRole): RoleClass {
  if (role === 'core' || exercise.pattern === 'core') return 'core';
  if (role === 'isolation' || exercise.mechanic === 'isolation') return 'isolation';
  return 'compound';
}

const REP_MATRIX: Record<Goal, Record<RoleClass, RepPrescription>> = {
  strength: {
    compound: { reps: [3, 6], rir: 2 },
    isolation: { reps: [6, 10], rir: 1 },
    core: { reps: [8, 12], rir: 2 },
  },
  muscle: {
    compound: { reps: [6, 10], rir: 2 },
    isolation: { reps: [10, 15], rir: 1 },
    core: { reps: [10, 20], rir: 1 },
  },
  recomp: {
    compound: { reps: [6, 12], rir: 2 },
    isolation: { reps: [10, 15], rir: 1 },
    core: { reps: [12, 20], rir: 1 },
  },
  fat_loss: {
    compound: { reps: [8, 12], rir: 2 },
    isolation: { reps: [12, 15], rir: 1 },
    core: { reps: [12, 20], rir: 1 },
  },
  endurance: {
    compound: { reps: [15, 20], rir: 1 },
    isolation: { reps: [15, 25], rir: 1 },
    core: { reps: [15, 30], rir: 1 },
  },
  health: {
    compound: { reps: [8, 12], rir: 3 },
    isolation: { reps: [10, 15], rir: 3 },
    core: { reps: [10, 15], rir: 3 },
  },
};

/**
 * I principianti non vanno mai vicino al cedimento nelle prime settimane:
 * la tecnica peggiora prima che lo stimolo aumenti.
 */
function adjustRirForLevel(rir: number, experience: Experience): number {
  if (experience === 'beginner') return Math.min(4, rir + 2);
  if (experience === 'advanced') return Math.max(0, rir - 1);
  return rir;
}

export function prescribeReps(exercise: Exercise, role: SlotRole, goal: Goal, experience: Experience): RepPrescription {
  const cls = roleClass(exercise, role);
  const base = REP_MATRIX[goal][cls];
  let reps: [number, number] = [...base.reps];

  // Gli esercizi a corpo libero difficilmente stanno in range bassi senza zavorra.
  if (exercise.loadType === 'bodyweight' && reps[1] < 10) reps = [8, 15];
  // Sui movimenti esplosivi non si programma mai vicino al cedimento.
  if (exercise.pattern === 'olympic' || exercise.impact === 'high') reps = [3, 6];

  return { reps, rir: adjustRirForLevel(base.rir, experience) };
}

/** Numero di serie per esercizio in base al ruolo, prima della ripartizione del volume. */
export function defaultSetCount(role: SlotRole, goal: Goal): number {
  if (goal === 'strength') return role === 'primary' ? 5 : role === 'secondary' ? 4 : 3;
  if (goal === 'health') return role === 'primary' ? 3 : 2;
  return role === 'primary' ? 4 : role === 'secondary' ? 3 : 3;
}

export interface BuildSetsInput {
  exercise: Exercise;
  role: SlotRole;
  goal: Goal;
  experience: Experience;
  setCount: number;
  technique?: SetTechnique;
  /** Massimale stimato noto, se disponibile: consente di proporre un carico concreto. */
  oneRmKg?: number;
}

/**
 * Costruisce le serie pianificate di un esercizio.
 * Per gli esercizi a tempo la prescrizione e' in secondi, non in ripetizioni.
 */
export function buildPlannedSets(input: BuildSetsInput): { sets: PlannedSet[]; restSec: number } {
  const { exercise, role, goal, experience, setCount, technique = 'straight', oneRmKg } = input;

  if (exercise.loadType === 'time') {
    const duration = timedDuration(exercise, goal, experience);
    const restSec = recommendedRest({ exercise, goal, experience });
    const sets: PlannedSet[] = Array.from({ length: setCount }, () => ({
      id: createId('set'),
      kind: 'working' as const,
      timeSec: duration,
      restSec,
    }));
    return { sets, restSec };
  }

  const { reps, rir } = prescribeReps(exercise, role, goal, experience);
  const midReps = Math.round((reps[0] + reps[1]) / 2);
  const percent1rm = percentForRepsAtRir(midReps, rir);
  const restSec = recommendedRest({ exercise, goal, experience, reps: midReps, rir });

  const sets: PlannedSet[] = [];
  for (let i = 0; i < setCount; i++) {
    const set: PlannedSet = {
      id: createId('set'),
      kind: 'working',
      reps,
      rir,
      restSec,
    };
    if (exercise.loadType === 'weight' || exercise.loadType === 'bodyweight_loadable') {
      set.percent1rm = Math.round(percent1rm);
      if (oneRmKg) set.weightKg = Math.round(((oneRmKg * percent1rm) / 100) * 2) / 2;
    }
    sets.push(applyTechniqueToSet(set, technique, i, setCount, reps));
  }
  return { sets, restSec };
}

/**
 * Applica la tecnica scelta alla singola serie.
 * Il piramidale modifica ripetizioni e percentuale serie per serie;
 * le tecniche a serie aggiuntiva (drop, rest-pause) marcano l'ultima serie.
 */
function applyTechniqueToSet(
  set: PlannedSet,
  technique: SetTechnique,
  index: number,
  total: number,
  range: [number, number],
): PlannedSet {
  if (technique === 'pyramid_up') {
    const step = (range[1] - range[0]) / Math.max(1, total - 1);
    const reps = Math.round(range[1] - step * index);
    return { ...set, reps, percent1rm: set.percent1rm ? Math.round(set.percent1rm + index * 4) : undefined };
  }
  if (technique === 'pyramid_down') {
    const step = (range[1] - range[0]) / Math.max(1, total - 1);
    const reps = Math.round(range[0] + step * index);
    return { ...set, reps, percent1rm: set.percent1rm ? Math.round(set.percent1rm - index * 4) : undefined };
  }
  if (technique === 'drop' && index === total - 1) {
    return { ...set, kind: 'failure', rir: 0 };
  }
  if (technique === 'rest_pause' && index === total - 1) {
    return { ...set, kind: 'failure', rir: 0, restSec: 20 };
  }
  return set;
}

/** Durata di una serie a tempo, in secondi, in funzione di obiettivo e livello. */
export function timedDuration(exercise: Exercise, goal: Goal, experience: Experience): number {
  let base = defaultHoldDuration(exercise);
  if (experience === 'beginner') base *= 0.7;
  if (experience === 'advanced') base *= 1.25;
  if (goal === 'endurance') base *= 1.3;
  if (goal === 'strength') base *= 0.8;
  return Math.max(15, Math.round(base / 5) * 5);
}

/**
 * Serie di riscaldamento specifiche sul primo esercizio pesante di ogni pattern.
 * Non contano nel volume settimanale: si eseguono con almeno 5 ripetizioni di riserva.
 * Riferimento: sezione 10.2.
 */
export function buildWarmupSets(workingWeightKg: number, isBarbell: boolean, intensityPct: number): PlannedSet[] {
  const mk = (factor: number, reps: number, rest: number): PlannedSet => ({
    id: createId('set'),
    kind: 'warmup',
    reps,
    weightKg: Math.max(0, Math.round(workingWeightKg * factor * 2) / 2),
    restSec: rest,
  });

  let sets: PlannedSet[];
  if (intensityPct < 55) sets = [mk(0.5, 10, 45)];
  else if (intensityPct < 70) sets = [mk(0.4, 10, 45), mk(0.7, 6, 60)];
  else if (intensityPct < 85) sets = [mk(0.4, 8, 45), mk(0.6, 5, 60), mk(0.8, 3, 90)];
  else sets = [mk(0.4, 8, 45), mk(0.6, 5, 60), mk(0.75, 3, 90), mk(0.88, 1, 120)];

  if (isBarbell) {
    sets.unshift({ id: createId('set'), kind: 'warmup', reps: 10, weightKg: 20, restSec: 30 });
  }
  return sets;
}
