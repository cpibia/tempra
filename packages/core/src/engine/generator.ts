import type {
  Equipment, Exercise, Experience, Goal, MuscleGroup, Plan, PlanDay, PlanItem, Profile,
} from '../domain/types';
import { createId, nowIso } from '../utils/id';
import { EXERCISES, getExercise } from './catalog';
import { SESSION_BLUEPRINTS, selectSplit, groupFrequency, type SessionBlueprint, type Slot, type SplitTemplate } from './splits';
import { planWeeklyVolume, MAX_SETS_PER_MUSCLE_PER_SESSION, type WeeklyVolumePlan } from './volume';
import { buildPlannedSets, defaultSetCount } from './prescription';
import { EQUIPMENT_BY_PLACE } from './equipment';
import { EXPERIENCE_LABELS, GOAL_LABELS } from '../domain/labels';
import { screenExercise, adaptPrescription, type HealthScreening } from '../health/screening';

export const ENGINE_VERSION = '1.0.0';

/** Tempo medio di esecuzione di una serie, usato per stimare la durata della seduta. */
const SECONDS_PER_SET_WORK = 40;
const WARMUP_MINUTES = 8;

export interface GenerateOptions {
  profile: Profile;
  /** Gruppi su cui l'utente vuole enfasi. */
  priorityGroups?: MuscleGroup[];
  /** Split imposto dall'utente invece di quello suggerito. */
  preferredSplit?: Plan['split'];
  /** Durata del mesociclo, scarico incluso. */
  weeks?: number;
  /** Seme per rendere deterministica la scelta fra esercizi equivalenti. */
  seed?: number;
}

export interface GenerationResult {
  plan: Plan;
  rationale: string[];
  excluded: { exerciseId: string; exerciseName: string; reason: string }[];
}

// ---------------------------------------------------------------------------
// Generatore casuale deterministico (mulberry32)
// ---------------------------------------------------------------------------

function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Pool di esercizi ammessi
// ---------------------------------------------------------------------------

export interface EligiblePool {
  exercises: Exercise[];
  excluded: { exerciseId: string; exerciseName: string; reason: string }[];
}

/**
 * Restringe il catalogo a cio' che l'utente puo' realmente eseguire:
 * attrezzatura disponibile, esclusioni manuali e vincoli sanitari dichiarati.
 */
export function buildEligiblePool(profile: Profile, screening: HealthScreening): EligiblePool {
  const placeEquipment = EQUIPMENT_BY_PLACE[profile.place];
  const userEquipment = profile.equipment.length ? profile.equipment : null;
  const manualExclusions = new Set(profile.excludedExerciseIds);

  const exercises: Exercise[] = [];
  const excluded: EligiblePool['excluded'] = [];

  for (const exercise of EXERCISES) {
    if (manualExclusions.has(exercise.id)) continue;

    // Gli esercizi di mobilita' restano sempre disponibili: servono al riscaldamento.
    const needsEquipment = exercise.equipment !== null && exercise.equipment !== 'body only';
    if (needsEquipment) {
      const allowedByPlace = placeEquipment.includes(exercise.equipment as Equipment | null);
      const allowedByUser = !userEquipment || userEquipment.includes(exercise.equipment as Equipment);
      if (!allowedByPlace || !allowedByUser) continue;
    }

    const verdict = screenExercise(exercise, screening);
    if (verdict.blocked) {
      excluded.push({ exerciseId: exercise.id, exerciseName: exercise.name, reason: verdict.reason ?? '' });
      continue;
    }
    exercises.push(exercise);
  }

  return { exercises, excluded };
}

// ---------------------------------------------------------------------------
// Selezione dell'esercizio per uno slot
// ---------------------------------------------------------------------------

interface SelectionContext {
  pool: Exercise[];
  used: Set<string>;
  usedInSession: Set<string>;
  experience: Experience;
  goal: Goal;
  /** L'utente ha attrezzatura con cui caricare un peso misurabile. */
  hasLoadableEquipment: boolean;
  random: () => number;
}

function scoreForSlot(exercise: Exercise, slot: Slot, ctx: SelectionContext): number {
  // Mobilita' e stretching servono al riscaldamento, non agli slot di lavoro.
  if (exercise.category === 'stretching' || exercise.pattern === 'mobility') return -Infinity;
  // Le alzate olimpiche richiedono una tecnica che il motore non puo' insegnare.
  if (exercise.pattern === 'olympic' && ctx.experience !== 'advanced') return -Infinity;

  let score = exercise.priority;

  const hitsGroup = exercise.muscleGroups.some((g) => slot.groups.includes(g));
  if (!hitsGroup) {
    const secondary = exercise.secondaryGroups.some((g) => slot.groups.includes(g));
    if (!secondary) return -Infinity;
    score -= 25;
  }

  if (slot.patterns?.length) {
    const index = slot.patterns.indexOf(exercise.pattern);
    if (index === -1) {
      // Un pattern diverso e' ammesso solo negli slot di isolamento e accessori.
      if (slot.role === 'primary' || slot.role === 'secondary') return -Infinity;
      score -= 20;
    } else {
      score += 30 - index * 8;
    }
  }

  if (slot.role === 'primary' || slot.role === 'secondary') {
    score += exercise.mechanic === 'compound' ? 25 : -40;
  }
  if (slot.role === 'isolation') {
    score += exercise.mechanic === 'isolation' ? 20 : -45;
  }
  if (slot.role === 'core') {
    score += exercise.pattern === 'core' ? 25 : -30;
  }

  // Il livello dell'esercizio deve stare al passo con l'utente.
  if (ctx.experience === 'beginner') {
    if (exercise.level === 'expert') return -Infinity;
    if (exercise.level === 'intermediate') score -= 15;
    if (exercise.equipment === 'machine') score += 10;
  }
  if (ctx.experience === 'advanced' && exercise.level === 'beginner') score -= 5;

  // In palestra un esercizio a corpo libero non deve prendere il posto di un
  // fondamentale con sovraccarico negli slot principali.
  const loadable = exercise.loadType === 'weight' || exercise.loadType === 'bodyweight_loadable';
  if (ctx.hasLoadableEquipment && !loadable && slot.role !== 'core') {
    score -= slot.role === 'primary' || slot.role === 'secondary' ? 45 : 20;
  }

  // Per il dimagrimento e la resistenza si privilegiano i movimenti globali.
  if ((ctx.goal === 'fat_loss' || ctx.goal === 'endurance') && exercise.mechanic === 'compound') score += 8;
  if (ctx.goal === 'strength' && (exercise.equipment === 'barbell')) score += 12;

  if (!exercise.frameCount) score -= 30;
  if (ctx.used.has(exercise.id)) score -= 120;
  if (ctx.usedInSession.has(exercise.id)) return -Infinity;

  // Piccola componente casuale per dare varieta' fra generazioni diverse.
  score += ctx.random() * 6;
  return score;
}

function pickForSlot(slot: Slot, ctx: SelectionContext): Exercise | null {
  let best: Exercise | null = null;
  let bestScore = -Infinity;
  for (const exercise of ctx.pool) {
    const score = scoreForSlot(exercise, slot, ctx);
    if (score > bestScore) {
      bestScore = score;
      best = exercise;
    }
  }
  return bestScore === -Infinity ? null : best;
}

// ---------------------------------------------------------------------------
// Ripartizione del volume settimanale sulle sedute
// ---------------------------------------------------------------------------

interface SlotAssignment {
  slot: Slot;
  exercise: Exercise;
}

/**
 * Assegna a ciascun esercizio il numero di serie, partendo dal volume settimanale
 * del gruppo muscolare diviso per la frequenza con cui quel gruppo compare nello split.
 */
function allocateSets(
  assignments: SlotAssignment[],
  weekly: WeeklyVolumePlan,
  split: SplitTemplate,
  experience: Experience,
  goal: Goal,
): Map<string, number> {
  const result = new Map<string, number>();
  const cap = MAX_SETS_PER_MUSCLE_PER_SESSION[experience];

  // Serie di partenza dal ruolo, poi corrette sul budget di volume del gruppo.
  for (const a of assignments) {
    result.set(a.slot.role + ':' + a.exercise.id, defaultSetCount(a.slot.role, goal));
  }

  const groups = new Set<MuscleGroup>(assignments.flatMap((a) => a.slot.groups));
  for (const group of groups) {
    const frequency = Math.max(1, groupFrequency(split, group));
    const weeklySets = weekly[group] ?? 0;
    if (weeklySets === 0) continue;

    const budget = Math.min(cap, Math.round(weeklySets / frequency));
    const members = assignments.filter((a) => a.slot.groups.includes(group));
    if (!members.length) continue;

    // I multiarticolari prendono piu' serie degli isolamenti.
    const weights = members.map((a) =>
      a.slot.role === 'primary' ? 3 : a.slot.role === 'secondary' ? 2.5 : a.slot.role === 'accessory' ? 2 : 1.5);
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    members.forEach((a, i) => {
      const key = a.slot.role + ':' + a.exercise.id;
      const share = Math.round((budget * weights[i]!) / totalWeight);
      const sets = Math.max(2, Math.min(5, share));
      // Un esercizio che serve piu' gruppi tiene il valore piu' alto richiesto.
      result.set(key, Math.max(result.get(key) ?? 0, sets));
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stima della durata e adattamento al tempo disponibile
// ---------------------------------------------------------------------------

export function estimateSessionMinutes(items: PlanItem[]): number {
  let seconds = WARMUP_MINUTES * 60;
  for (const item of items) {
    for (const set of item.sets) {
      seconds += (set.timeSec ?? SECONDS_PER_SET_WORK) + set.restSec;
    }
  }
  return Math.round(seconds / 60);
}

/**
 * Riduce la seduta al tempo disponibile, in tre passaggi progressivi:
 * prima si tagliano gli slot opzionali, poi si accorciano le pause degli isolamenti,
 * infine si toglie una serie agli esercizi meno importanti. I multiarticolari
 * principali non vengono mai toccati.
 */
function fitToTimeBudget(items: PlanItem[], budgetMinutes: number): { items: PlanItem[]; notes: string[] } {
  const notes: string[] = [];
  let current = items.map((i) => ({ ...i, sets: [...i.sets] }));
  const over = () => estimateSessionMinutes(current) > budgetMinutes;

  if (!over()) return { items: current, notes };

  // Passo 1: accorcia le pause degli esercizi complementari, mai sotto i 45 secondi.
  current = current.map((item, index) => {
    if (index < 2) return item;
    const sets = item.sets.map((s) => ({ ...s, restSec: Math.max(45, Math.round((s.restSec * 0.7) / 15) * 15) }));
    return { ...item, sets, restSec: sets[0]?.restSec ?? item.restSec };
  });
  if (!over()) {
    notes.push('Pause accorciate sugli esercizi complementari per stare nel tempo scelto.');
    return { items: current, notes };
  }
  notes.push('Pause accorciate sugli esercizi complementari per stare nel tempo scelto.');

  // Passo 2: togli una serie per volta partendo dal fondo. I fondamentali cedono
  // per ultimi, ma se il tempo e' davvero poco scendono anche loro a due serie.
  let removedSets = 0;
  let guard = 0;
  for (const floorForLeaders of [3, 2]) {
    while (over() && guard++ < 120) {
      let changed = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const item = current[i]!;
        const floor = i < 2 ? floorForLeaders : 2;
        if (item.sets.length > floor) {
          current[i] = { ...item, sets: item.sets.slice(0, -1) };
          removedSets++;
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
  }
  if (removedSets) notes.push(`Ridotte ${removedSets} serie complessive per rispettare la durata.`);

  // Passo 3: ultima risorsa, si tolgono gli esercizi opzionali e poi quelli finali.
  guard = 0;
  while (over() && current.length > 3 && guard++ < 30) {
    const optionalIndex = current.map((i, idx) => (i.notes === 'optional' ? idx : -1))
      .filter((idx) => idx >= 0).pop();
    const removeIndex = optionalIndex ?? current.length - 1;
    current.splice(removeIndex, 1);
    notes.push('Rimosso un esercizio accessorio: non entrava nella durata scelta.');
  }

  return { items: current, notes: [...new Set(notes)] };
}

// ---------------------------------------------------------------------------
// Generazione
// ---------------------------------------------------------------------------

function buildDay(
  blueprint: SessionBlueprint,
  order: number,
  ctx: SelectionContext,
  weekly: WeeklyVolumePlan,
  split: SplitTemplate,
  profile: Profile,
  screening: HealthScreening,
): { day: PlanDay; notes: string[] } {
  ctx.usedInSession = new Set();
  const assignments: SlotAssignment[] = [];

  for (const slot of blueprint.slots) {
    const exercise = pickForSlot(slot, ctx);
    if (!exercise) continue;
    ctx.usedInSession.add(exercise.id);
    ctx.used.add(exercise.id);
    assignments.push({ slot, exercise });
  }

  const setCounts = allocateSets(assignments, weekly, split, profile.experience, profile.goal);

  let items: PlanItem[] = assignments.map(({ slot, exercise }, index) => {
    const setCount = setCounts.get(slot.role + ':' + exercise.id) ?? defaultSetCount(slot.role, profile.goal);
    const { sets, restSec } = buildPlannedSets({
      exercise,
      role: slot.role,
      goal: profile.goal,
      experience: profile.experience,
      setCount,
    });

    // I vincoli sanitari non si limitano a togliere esercizi: cambiano anche
    // come si eseguono quelli che restano (piu' ripetizioni, meno intensita',
    // pause piu' lunghe, mai vicino al cedimento).
    const adapted = sets.map((set) => {
      const result = adaptPrescription(
        {
          reps: Array.isArray(set.reps) ? set.reps : undefined,
          rir: set.rir,
          restSec: set.restSec,
          percent1rm: set.percent1rm,
        },
        screening,
      );
      return {
        ...set,
        ...(result.reps ? { reps: result.reps } : {}),
        ...(result.rir !== undefined ? { rir: result.rir } : {}),
        ...(result.percent1rm !== undefined ? { percent1rm: result.percent1rm } : {}),
        restSec: result.restSec,
      };
    });

    return {
      id: createId('item'),
      exerciseId: exercise.id,
      order: index,
      technique: 'straight',
      sets: adapted,
      restSec: adapted[0]?.restSec ?? restSec,
      ...(slot.optional ? { notes: 'optional' } : {}),
    };
  });

  const fitted = fitToTimeBudget(items, profile.sessionMinutes);
  items = fitted.items.map((item, index) => ({
    ...item,
    order: index,
    notes: item.notes === 'optional' ? undefined : item.notes,
  }));

  return {
    day: {
      id: createId('day'),
      name: blueprint.name,
      order,
      focus: blueprint.focus,
      items,
      estimatedMinutes: estimateSessionMinutes(items),
    },
    notes: fitted.notes,
  };
}

export function generatePlan(options: GenerateOptions, screening: HealthScreening): GenerationResult {
  const { profile, priorityGroups = [], preferredSplit, weeks = 5, seed = Date.now() } = options;

  const split = selectSplit(profile.daysPerWeek, profile.experience, profile.goal, preferredSplit);
  const recoveryFactor = computeRecoveryFactor(profile, screening);
  const weekly = planWeeklyVolume({
    experience: profile.experience,
    goal: profile.goal,
    priorityGroups,
    recoveryFactor,
  });

  const { exercises: pool, excluded } = buildEligiblePool(profile, screening);
  const ctx: SelectionContext = {
    pool,
    used: new Set(),
    usedInSession: new Set(),
    experience: profile.experience,
    goal: profile.goal,
    hasLoadableEquipment: pool.some((e) => e.loadType === 'weight'),
    random: makeRandom(seed),
  };

  const rationale: string[] = [];
  const days: PlanDay[] = [];

  split.sessions.forEach((key, index) => {
    const blueprint = SESSION_BLUEPRINTS[key];
    if (!blueprint) return;
    const { day, notes } = buildDay(blueprint, index, ctx, weekly, split, profile, screening);
    days.push(day);
    rationale.push(...notes);
  });

  rationale.unshift(
    `Split scelto: ${split.name} su ${split.days} giorni. ${split.description}`,
    `Volume di partenza calcolato sul livello ${levelLabel(profile.experience)} e sull'obiettivo ${goalLabel(profile.goal)}.`,
  );
  if (recoveryFactor < 1) {
    rationale.push('Volume ridotto in via prudenziale per le condizioni di salute dichiarate.');
  }
  if (excluded.length) {
    rationale.push(`${excluded.length} esercizi sono stati esclusi per le condizioni di salute che hai indicato.`);
  }

  const plan: Plan = {
    id: createId('plan'),
    name: `${split.name} ${goalLabel(profile.goal).toLowerCase()}`,
    description: split.description,
    source: 'generated',
    goal: profile.goal,
    split: split.id,
    daysPerWeek: split.days,
    weeks,
    days,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    generation: {
      profileSnapshot: {
        goal: profile.goal,
        place: profile.place,
        equipment: profile.equipment,
        daysPerWeek: profile.daysPerWeek,
        sessionMinutes: profile.sessionMinutes,
        experience: profile.experience,
        conditions: profile.conditions,
      },
      rationale: [...new Set(rationale)],
      excludedForHealth: excluded,
      weeklySetsByGroup: actualWeeklySets(days),
      engineVersion: ENGINE_VERSION,
      generatedAt: nowIso(),
    },
  };

  return { plan, rationale: plan.generation!.rationale, excluded };
}

/** Volume effettivamente prodotto dalla scheda, per verificarlo contro i target. */
export function actualWeeklySets(days: PlanDay[]): Partial<Record<MuscleGroup, number>> {
  const counts: Partial<Record<MuscleGroup, number>> = {};
  for (const day of days) {
    for (const item of day.items) {
      const exercise = getExercise(item.exerciseId);
      if (!exercise) continue;
      const working = item.sets.filter((s) => s.kind !== 'warmup').length;
      for (const group of exercise.muscleGroups) {
        counts[group] = (counts[group] ?? 0) + working;
      }
      // Il lavoro indiretto conta la meta'.
      for (const group of exercise.secondaryGroups) {
        counts[group] = (counts[group] ?? 0) + working * 0.5;
      }
    }
  }
  for (const key of Object.keys(counts) as MuscleGroup[]) {
    counts[key] = Math.round((counts[key] ?? 0) * 10) / 10;
  }
  return counts;
}

/**
 * Quanto il volume va ridotto rispetto al riferimento.
 * Pesano l'eta', le condizioni che impongono carichi contenuti e, in misura
 * minore, il numero di condizioni dichiarate: piu' vincoli ci sono, piu' e'
 * probabile che il recupero sia il fattore limitante.
 */
function computeRecoveryFactor(profile: Profile, screening: HealthScreening): number {
  let factor = 1;
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : undefined;
  if (age !== undefined && age >= 60) factor -= 0.15;
  else if (age !== undefined && age >= 50) factor -= 0.08;
  if (screening.reduceVolume) factor -= 0.15;
  if (screening.maxPercent1rm !== undefined && screening.maxPercent1rm < 80) factor -= 0.1;
  factor -= Math.min(0.15, screening.conditions.length * 0.05);
  return Math.max(0.5, factor);
}

export const levelLabel = (l: Experience): string => EXPERIENCE_LABELS[l];
export const goalLabel = (g: Goal): string => GOAL_LABELS[g];
