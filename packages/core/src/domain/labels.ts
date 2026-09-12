import type {
  ExerciseCategory, Experience, Force, Goal, LoadType, Mechanic,
  MovementPattern, Muscle, MuscleGroup, RestPreference, TrainingPlace,
} from './types';

/** Etichette italiane dei valori del dominio, usate ovunque nella interfaccia. */

export const MUSCLE_LABELS: Record<Muscle, string> = {
  abdominals: 'Addominali',
  abductors: 'Abduttori',
  adductors: 'Adduttori',
  biceps: 'Bicipiti',
  calves: 'Polpacci',
  chest: 'Petto',
  forearms: 'Avambracci',
  glutes: 'Glutei',
  hamstrings: 'Femorali',
  lats: 'Dorsali',
  'lower back': 'Lombari',
  'middle back': 'Dorso medio',
  neck: 'Collo',
  quadriceps: 'Quadricipiti',
  shoulders: 'Spalle',
  traps: 'Trapezi',
  triceps: 'Tricipiti',
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Petto',
  back: 'Schiena',
  shoulders: 'Spalle',
  biceps: 'Bicipiti',
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  glutes: 'Glutei',
  calves: 'Polpacci',
  core: 'Core',
  neck: 'Collo',
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Forza',
  stretching: 'Stretching',
  cardio: 'Cardio',
  plyometrics: 'Pliometria',
  powerlifting: 'Powerlifting',
  'olympic weightlifting': 'Weightlifting olimpico',
  strongman: 'Strongman',
};

export const LEVEL_LABELS: Record<'beginner' | 'intermediate' | 'expert', string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Avanzato',
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzato',
};

export const FORCE_LABELS: Record<Force, string> = {
  push: 'Spinta',
  pull: 'Trazione',
  static: 'Isometrico',
};

export const MECHANIC_LABELS: Record<Mechanic, string> = {
  compound: 'Multiarticolare',
  isolation: 'Isolamento',
};

export const PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Accosciata',
  hinge: 'Piegamento dell anca',
  lunge: 'Affondo',
  horizontal_push: 'Spinta orizzontale',
  vertical_push: 'Spinta verticale',
  horizontal_pull: 'Trazione orizzontale',
  vertical_pull: 'Trazione verticale',
  carry: 'Trasporto',
  core: 'Core',
  isolation: 'Isolamento',
  cardio: 'Cardio',
  mobility: 'Mobilita',
  olympic: 'Alzata olimpica',
};

export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  weight: 'Con sovraccarico',
  bodyweight: 'A corpo libero',
  bodyweight_loadable: 'A corpo libero, zavorrabile',
  bands: 'Con elastici',
  time: 'A tempo',
};

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: 'Dimagrimento',
  muscle: 'Massa muscolare',
  strength: 'Forza',
  endurance: 'Resistenza',
  health: 'Salute e benessere',
  recomp: 'Ricomposizione',
};

export const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  fat_loss: 'Perdere grasso mantenendo il muscolo che hai.',
  muscle: 'Aumentare la massa muscolare con volume e progressione.',
  strength: 'Alzare piu carico sui movimenti fondamentali.',
  endurance: 'Reggere piu a lungo: serie lunghe e recuperi brevi.',
  health: 'Stare bene, muoverti meglio, senza esagerare.',
  recomp: 'Perdere grasso e guadagnare muscolo insieme.',
};

export const PLACE_DESCRIPTIONS: Record<TrainingPlace, string> = {
  gym: 'Bilancieri, manubri, macchine e cavi.',
  home_basic: 'Manubri, elastici, kettlebell, tappetino.',
  home_bodyweight: 'Solo il tuo corpo e poco spazio.',
  outdoor: 'Parco, calisthenics, elastici portatili.',
};

export const REST_PREFERENCE_LABELS: Record<RestPreference, string> = {
  short: 'Corti, alleniamoci in fretta',
  standard: 'Quelli consigliati',
  long: 'Lunghi, voglio recuperare bene',
};
