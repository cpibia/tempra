import type { Experience, Goal, MovementPattern, MuscleGroup, SplitId } from '../domain/types';

/**
 * Struttura delle sedute. Ogni seduta e' una sequenza di "slot": una posizione
 * nella scheda con un ruolo e un bersaglio, che il selettore riempie con
 * l'esercizio migliore disponibile per quell'utente.
 * Riferimento: docs/research/01-scienza-allenamento.md, sezioni 5.2-5.4 e 14.3.
 */

export type SlotRole = 'primary' | 'secondary' | 'accessory' | 'isolation' | 'core';

export interface Slot {
  role: SlotRole;
  /** Pattern preferiti, in ordine di preferenza. */
  patterns?: MovementPattern[];
  /** Gruppi muscolari bersaglio dello slot. */
  groups: MuscleGroup[];
  /** Gli slot opzionali sono i primi a cadere quando il tempo non basta. */
  optional?: boolean;
}

export interface SessionBlueprint {
  key: string;
  name: string;
  focus: MuscleGroup[];
  slots: Slot[];
}

const CORE_SLOT: Slot = { role: 'core', patterns: ['core'], groups: ['core'] };

export const SESSION_BLUEPRINTS: Record<string, SessionBlueprint> = {
  FB_A: {
    key: 'FB_A', name: 'Total body A', focus: ['quads', 'chest', 'back', 'shoulders', 'core'],
    slots: [
      { role: 'primary', patterns: ['squat'], groups: ['quads', 'glutes'] },
      { role: 'primary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'primary', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'secondary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'isolation', groups: ['shoulders'], optional: true },
      CORE_SLOT,
      { role: 'isolation', groups: ['triceps'], optional: true },
    ],
  },
  FB_B: {
    key: 'FB_B', name: 'Total body B', focus: ['hamstrings', 'shoulders', 'back', 'biceps', 'core'],
    slots: [
      { role: 'primary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'primary', patterns: ['vertical_pull'], groups: ['back'] },
      { role: 'primary', patterns: ['vertical_push'], groups: ['shoulders'] },
      { role: 'secondary', patterns: ['lunge', 'squat'], groups: ['quads', 'glutes'] },
      { role: 'isolation', groups: ['biceps'], optional: true },
      CORE_SLOT,
      { role: 'isolation', groups: ['calves'], optional: true },
    ],
  },
  FB_C: {
    key: 'FB_C', name: 'Total body C', focus: ['quads', 'chest', 'back', 'core'],
    slots: [
      { role: 'primary', patterns: ['squat', 'lunge'], groups: ['quads', 'glutes'] },
      { role: 'primary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'primary', patterns: ['horizontal_pull', 'vertical_pull'], groups: ['back'] },
      { role: 'isolation', groups: ['hamstrings'] },
      { role: 'isolation', groups: ['shoulders'], optional: true },
      CORE_SLOT,
    ],
  },
  UPPER_A: {
    key: 'UPPER_A', name: 'Parte alta A', focus: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    slots: [
      { role: 'primary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'primary', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'secondary', patterns: ['vertical_push'], groups: ['shoulders'] },
      { role: 'secondary', patterns: ['vertical_pull'], groups: ['back'] },
      { role: 'isolation', groups: ['shoulders'] },
      { role: 'isolation', groups: ['biceps'] },
      { role: 'isolation', groups: ['triceps'] },
    ],
  },
  UPPER_B: {
    key: 'UPPER_B', name: 'Parte alta B', focus: ['shoulders', 'back', 'chest', 'biceps', 'triceps'],
    slots: [
      { role: 'primary', patterns: ['vertical_push'], groups: ['shoulders'] },
      { role: 'primary', patterns: ['vertical_pull'], groups: ['back'] },
      { role: 'secondary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'secondary', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'isolation', groups: ['chest'], optional: true },
      { role: 'isolation', groups: ['triceps'] },
      { role: 'isolation', groups: ['biceps'] },
    ],
  },
  LOWER_A: {
    key: 'LOWER_A', name: 'Parte bassa A', focus: ['quads', 'glutes', 'hamstrings', 'calves', 'core'],
    slots: [
      { role: 'primary', patterns: ['squat'], groups: ['quads', 'glutes'] },
      { role: 'secondary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'accessory', patterns: ['lunge', 'squat'], groups: ['quads', 'glutes'] },
      { role: 'isolation', groups: ['hamstrings'] },
      { role: 'isolation', groups: ['calves'] },
      CORE_SLOT,
    ],
  },
  LOWER_B: {
    key: 'LOWER_B', name: 'Parte bassa B', focus: ['hamstrings', 'glutes', 'quads', 'calves', 'core'],
    slots: [
      { role: 'primary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'secondary', patterns: ['squat', 'lunge'], groups: ['quads', 'glutes'] },
      { role: 'accessory', groups: ['glutes'] },
      { role: 'isolation', groups: ['quads'] },
      { role: 'isolation', groups: ['calves'] },
      CORE_SLOT,
    ],
  },
  PUSH_A: {
    key: 'PUSH_A', name: 'Spinta A', focus: ['chest', 'shoulders', 'triceps'],
    slots: [
      { role: 'primary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'secondary', patterns: ['vertical_push'], groups: ['shoulders'] },
      { role: 'accessory', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'isolation', groups: ['shoulders'] },
      { role: 'isolation', groups: ['triceps'] },
      { role: 'isolation', groups: ['triceps'], optional: true },
    ],
  },
  PUSH_B: {
    key: 'PUSH_B', name: 'Spinta B', focus: ['shoulders', 'chest', 'triceps'],
    slots: [
      { role: 'primary', patterns: ['vertical_push'], groups: ['shoulders'] },
      { role: 'secondary', patterns: ['horizontal_push'], groups: ['chest'] },
      { role: 'accessory', groups: ['chest'] },
      { role: 'isolation', groups: ['shoulders'] },
      { role: 'isolation', groups: ['triceps'] },
      CORE_SLOT,
    ],
  },
  PULL_A: {
    key: 'PULL_A', name: 'Trazione A', focus: ['back', 'biceps', 'shoulders'],
    slots: [
      { role: 'primary', patterns: ['vertical_pull'], groups: ['back'] },
      { role: 'secondary', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'accessory', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'isolation', groups: ['shoulders'] },
      { role: 'isolation', groups: ['biceps'] },
      { role: 'isolation', groups: ['biceps'], optional: true },
    ],
  },
  PULL_B: {
    key: 'PULL_B', name: 'Trazione B', focus: ['back', 'biceps', 'core'],
    slots: [
      { role: 'primary', patterns: ['horizontal_pull'], groups: ['back'] },
      { role: 'secondary', patterns: ['vertical_pull'], groups: ['back'] },
      { role: 'accessory', patterns: ['hinge'], groups: ['hamstrings'] },
      { role: 'isolation', groups: ['shoulders'] },
      { role: 'isolation', groups: ['biceps'] },
      CORE_SLOT,
    ],
  },
  LEGS_A: {
    key: 'LEGS_A', name: 'Gambe A', focus: ['quads', 'glutes', 'hamstrings', 'calves'],
    slots: [
      { role: 'primary', patterns: ['squat'], groups: ['quads', 'glutes'] },
      { role: 'secondary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'accessory', patterns: ['lunge'], groups: ['quads', 'glutes'] },
      { role: 'isolation', groups: ['quads'] },
      { role: 'isolation', groups: ['calves'] },
      CORE_SLOT,
    ],
  },
  LEGS_B: {
    key: 'LEGS_B', name: 'Gambe B', focus: ['hamstrings', 'glutes', 'quads', 'calves'],
    slots: [
      { role: 'primary', patterns: ['hinge'], groups: ['hamstrings', 'glutes'] },
      { role: 'secondary', patterns: ['squat'], groups: ['quads'] },
      { role: 'accessory', groups: ['glutes'] },
      { role: 'isolation', groups: ['hamstrings'] },
      { role: 'isolation', groups: ['calves'] },
      CORE_SLOT,
    ],
  },
};

export interface SplitTemplate {
  id: SplitId;
  name: string;
  description: string;
  days: number;
  sessions: string[];
  /** Giorni della settimana suggeriti, 1 = lunedi. */
  weekdays: number[];
  levels: Experience[];
  goals: Goal[] | '*';
  optIn?: boolean;
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    id: 'full_body', name: 'Total body', days: 2, sessions: ['FB_A', 'FB_B'],
    weekdays: [1, 4], levels: ['beginner', 'intermediate'], goals: '*',
    description: 'Ogni seduta allena tutto il corpo. Con due allenamenti a settimana e la scelta che rende di piu.',
  },
  {
    id: 'full_body', name: 'Total body', days: 3, sessions: ['FB_A', 'FB_B', 'FB_C'],
    weekdays: [1, 3, 5], levels: ['beginner', 'intermediate'], goals: '*',
    description: 'Tre sedute complete a settimana: frequenza alta su ogni muscolo, ideale per imparare i movimenti.',
  },
  {
    id: 'upper_lower', name: 'Parte alta e parte bassa', days: 4,
    sessions: ['UPPER_A', 'LOWER_A', 'UPPER_B', 'LOWER_B'],
    weekdays: [1, 2, 4, 5], levels: ['beginner', 'intermediate', 'advanced'],
    goals: ['muscle', 'strength', 'recomp', 'fat_loss', 'health'],
    description: 'Il miglior compromesso tra frequenza e volume per seduta. Ogni muscolo due volte a settimana.',
  },
  {
    id: 'push_pull_legs_upper_lower', name: 'Spinta, trazione, gambe piu parte alta e bassa', days: 5,
    sessions: ['PUSH_A', 'PULL_A', 'LEGS_A', 'UPPER_B', 'LOWER_B'],
    weekdays: [1, 2, 3, 5, 6], levels: ['intermediate', 'advanced'],
    goals: ['muscle', 'recomp'],
    description: 'Cinque sedute con volume alto e frequenza doppia su tutti i distretti.',
  },
  {
    id: 'push_pull_legs', name: 'Spinta, trazione, gambe', days: 6,
    sessions: ['PUSH_A', 'PULL_A', 'LEGS_A', 'PUSH_B', 'PULL_B', 'LEGS_B'],
    weekdays: [1, 2, 3, 5, 6, 7], levels: ['intermediate', 'advanced'],
    goals: ['muscle', 'recomp', 'strength'],
    description: 'Sei sedute: il massimo volume gestibile con frequenza due volte a settimana per muscolo.',
  },
  {
    id: 'push_pull_legs', name: 'Spinta, trazione, gambe', days: 3,
    sessions: ['PUSH_A', 'PULL_A', 'LEGS_A'],
    weekdays: [1, 3, 5], levels: ['intermediate', 'advanced'], goals: ['muscle'],
    description: 'Tre sedute con volume alto per distretto, ma frequenza una volta a settimana.',
    optIn: true,
  },
];

/**
 * Sceglie lo split piu' adatto. La preferenza esplicita dell'utente vince,
 * purche' sia compatibile con i giorni disponibili.
 */
export function selectSplit(
  daysPerWeek: number,
  experience: Experience,
  goal: Goal,
  preferred?: SplitId,
): SplitTemplate {
  const byDays = SPLIT_TEMPLATES.filter((s) => s.days === daysPerWeek);
  if (preferred) {
    const match = byDays.find((s) => s.id === preferred);
    if (match) return match;
  }
  const fits = byDays.filter(
    (s) => !s.optIn && s.levels.includes(experience) && (s.goals === '*' || s.goals.includes(goal)),
  );
  if (fits.length) return fits[0]!;

  const anyForDays = byDays.find((s) => !s.optIn);
  if (anyForDays) return anyForDays;

  // Nessun template per quel numero di giorni: si ripiega sul piu' vicino.
  const sorted = [...SPLIT_TEMPLATES].filter((s) => !s.optIn)
    .sort((a, b) => Math.abs(a.days - daysPerWeek) - Math.abs(b.days - daysPerWeek));
  return sorted[0]!;
}

/** Frequenza settimanale effettiva con cui un gruppo viene allenato in uno split. */
export function groupFrequency(split: SplitTemplate, group: MuscleGroup): number {
  return split.sessions.reduce((count, key) => {
    const blueprint = SESSION_BLUEPRINTS[key];
    if (!blueprint) return count;
    return blueprint.slots.some((s) => s.groups.includes(group)) ? count + 1 : count;
  }, 0);
}
