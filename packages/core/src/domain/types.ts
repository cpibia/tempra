/**
 * Modello di dominio di Tempra.
 * Questi tipi sono il contratto condiviso fra PWA, motore di generazione e API di sincronizzazione.
 */

// ---------------------------------------------------------------------------
// Catalogo esercizi
// ---------------------------------------------------------------------------

export type Muscle =
  | 'abdominals' | 'abductors' | 'adductors' | 'biceps' | 'calves' | 'chest'
  | 'forearms' | 'glutes' | 'hamstrings' | 'lats' | 'lower back' | 'middle back'
  | 'neck' | 'quadriceps' | 'shoulders' | 'traps' | 'triceps';

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'neck';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'body only' | 'bands' | 'kettlebells' | 'foam roll'
  | 'cable' | 'machine' | 'medicine ball' | 'exercise ball' | 'e-z curl bar' | 'other';

export type ExerciseCategory =
  | 'strength' | 'stretching' | 'cardio' | 'plyometrics'
  | 'powerlifting' | 'olympic weightlifting' | 'strongman';

export type Level = 'beginner' | 'intermediate' | 'expert';
export type Force = 'push' | 'pull' | 'static';
export type Mechanic = 'compound' | 'isolation';

export type MovementPattern =
  | 'squat' | 'hinge' | 'lunge' | 'horizontal_push' | 'vertical_push'
  | 'horizontal_pull' | 'vertical_pull' | 'carry' | 'core'
  | 'isolation' | 'cardio' | 'mobility' | 'olympic';

/**
 * Determina quali campi di input mostrare durante l'allenamento:
 * - weight              : peso + ripetizioni
 * - bodyweight          : solo ripetizioni
 * - bodyweight_loadable : ripetizioni + peso aggiuntivo opzionale (zavorra)
 * - bands               : ripetizioni + livello elastico
 * - time                : durata in secondi (isometrici, stretching, cardio)
 */
export type LoadType = 'weight' | 'bodyweight' | 'bodyweight_loadable' | 'bands' | 'time';

export type Impact = 'low' | 'medium' | 'high';

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  aliases: string[];
  force: Force | null;
  level: Level;
  mechanic: Mechanic | null;
  equipment: Equipment | null;
  category: ExerciseCategory;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  muscleGroups: MuscleGroup[];
  secondaryGroups: MuscleGroup[];
  pattern: MovementPattern;
  loadType: LoadType;
  unilateral: boolean;
  impact: Impact;
  /** Carico di compressione sulla colonna: rilevante per ernie, lombalgia, osteoporosi. */
  axialLoad: boolean;
  homeFriendly: boolean;
  /** Punteggio interno: il generatore preferisce i fondamentali alle varianti esotiche. */
  priority: number;
  defaultRestSec: number;
  /**
   * Numero di fotogrammi WebP disponibili. I percorsi si ricavano dall'id:
   * `<id>/0.webp`, `<id>/1.webp` e la miniatura `<id>/thumb.webp`.
   */
  frameCount: number;
  translated: boolean;
}

// ---------------------------------------------------------------------------
// Profilo utente
// ---------------------------------------------------------------------------

export type Goal = 'fat_loss' | 'muscle' | 'strength' | 'endurance' | 'health' | 'recomp';
export type TrainingPlace = 'gym' | 'home_basic' | 'home_bodyweight' | 'outdoor';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Sex = 'male' | 'female' | 'unspecified';
export type Units = 'kg' | 'lb';
export type RestPreference = 'short' | 'standard' | 'long';

export interface Profile {
  id: string;
  displayName?: string;
  sex: Sex;
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  goal: Goal;
  place: TrainingPlace;
  /** Attrezzatura realmente disponibile: restringe ulteriormente il luogo scelto. */
  equipment: Equipment[];
  daysPerWeek: number;
  sessionMinutes: number;
  experience: Experience;
  /** Identificativi delle condizioni di salute dichiarate (vedi health/conditions). */
  conditions: string[];
  /** Esercizi esclusi manualmente dall'utente. */
  excludedExerciseIds: string[];
  units: Units;
  restPreference: RestPreference;
  /** L'utente ha accettato il disclaimer sanitario. */
  disclaimerAcceptedAt?: string;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Schede di allenamento
// ---------------------------------------------------------------------------

export type SplitId =
  | 'full_body' | 'upper_lower' | 'push_pull_legs' | 'push_pull_legs_upper_lower'
  | 'arnold' | 'bro_split' | 'custom';

export type SetTechnique =
  | 'straight'      // serie normali a carico costante
  | 'pyramid_up'    // piramidale crescente: carico su, ripetizioni giu
  | 'pyramid_down'  // piramidale decrescente (inversa)
  | 'pyramid_full'  // doppia piramide
  | 'drop'          // stripping
  | 'rest_pause'
  | 'cluster'
  | 'superset'
  | 'emom'
  | 'amrap'
  | 'circuit';

export type SetKind = 'warmup' | 'working' | 'drop' | 'backoff' | 'failure';

export interface PlannedSet {
  id: string;
  kind: SetKind;
  /** Ripetizioni target: numero fisso oppure intervallo [min, max]. */
  reps?: number | [number, number];
  /** Durata target in secondi, per esercizi isometrici, stretching e cardio. */
  timeSec?: number;
  /** Carico target in kg, se noto o calcolabile. */
  weightKg?: number;
  /** Percentuale del massimale stimato, usata dal generatore. */
  percent1rm?: number;
  rpe?: number;
  rir?: number;
  restSec: number;
  /** Tempo di esecuzione in notazione a 4 cifre, es. "3010". */
  tempo?: string;
}

export interface PlanItem {
  id: string;
  exerciseId: string;
  order: number;
  /** Gli item con lo stesso gruppo si eseguono in superserie o circuito. */
  supersetGroup?: string;
  technique: SetTechnique;
  sets: PlannedSet[];
  restSec: number;
  notes?: string;
}

export interface PlanDay {
  id: string;
  name: string;
  order: number;
  focus: MuscleGroup[];
  items: PlanItem[];
  notes?: string;
  estimatedMinutes: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  source: 'generated' | 'manual' | 'duplicated';
  goal: Goal;
  split: SplitId;
  daysPerWeek: number;
  /** Durata del mesociclo in settimane, per la progressione e lo scarico. */
  weeks: number;
  days: PlanDay[];
  /** Parametri di generazione, per poter rigenerare o spiegare le scelte. */
  generation?: PlanGenerationMeta;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PlanGenerationMeta {
  profileSnapshot: Pick<Profile,
    'goal' | 'place' | 'equipment' | 'daysPerWeek' | 'sessionMinutes' | 'experience' | 'conditions'>;
  /** Spiegazioni leggibili delle scelte fatte dal motore. */
  rationale: string[];
  /** Esercizi scartati per motivi di salute, con la ragione. */
  excludedForHealth: { exerciseId: string; exerciseName: string; reason: string }[];
  weeklySetsByGroup: Partial<Record<MuscleGroup, number>>;
  engineVersion: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Sessioni svolte
// ---------------------------------------------------------------------------

export interface LoggedSet {
  id: string;
  kind: SetKind;
  targetReps?: number | [number, number];
  targetTimeSec?: number;
  targetWeightKg?: number;
  reps?: number;
  timeSec?: number;
  weightKg?: number;
  rpe?: number;
  restSec: number;
  completed: boolean;
  completedAt?: string;
  /** Impostato dal motore dei record quando la serie supera il precedente primato. */
  prType?: 'weight' | 'reps' | 'volume' | 'e1rm' | 'time';
}

export interface SessionEntry {
  id: string;
  exerciseId: string;
  order: number;
  supersetGroup?: string;
  technique: SetTechnique;
  sets: LoggedSet[];
  notes?: string;
}

export type SessionStatus = 'active' | 'completed' | 'discarded';

export interface Session {
  id: string;
  planId?: string;
  planDayId?: string;
  name: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  /** Durata effettiva al netto delle pause dell'app, in secondi. */
  durationSec: number;
  entries: SessionEntry[];
  notes?: string;
  /** Sensazione a fine allenamento, da 1 (male) a 5 (ottimo). */
  feeling?: number;
  totalVolumeKg: number;
  totalSets: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Record personali e misure
// ---------------------------------------------------------------------------

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: 'weight' | 'reps' | 'volume' | 'e1rm' | 'time';
  value: number;
  /** Ripetizioni con cui il record e' stato ottenuto, per i record di carico. */
  reps?: number;
  weightKg?: number;
  sessionId: string;
  achievedAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Impostazioni applicative
// ---------------------------------------------------------------------------

export interface Settings {
  id: 'settings';
  theme: 'dark' | 'light' | 'system';
  units: Units;
  /** Incremento dei pulsanti +/- sul peso, in kg. */
  weightStepKg: number;
  restTimerAutoStart: boolean;
  restTimerSound: boolean;
  restTimerVibration: boolean;
  /** Tiene lo schermo acceso durante l'allenamento. */
  keepAwake: boolean;
  reduceMotion: boolean;
  /** Annuncia i tempi di recupero a voce tramite sintesi vocale. */
  speakRestCountdown: boolean;
  firstDayOfWeek: 0 | 1;
  syncEnabled: boolean;
  lastSyncAt?: string;
}
