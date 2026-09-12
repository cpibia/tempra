// Tassonomie e dizionari di traduzione IT per il dataset free-exercise-db.

export const MUSCLE_IT = {
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

// Raggruppamento per la pianificazione del volume settimanale.
export const MUSCLE_GROUP = {
  abdominals: 'core',
  'lower back': 'core',
  abductors: 'glutes',
  adductors: 'glutes',
  glutes: 'glutes',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
  chest: 'chest',
  lats: 'back',
  'middle back': 'back',
  traps: 'back',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  neck: 'neck',
};

export const MUSCLE_GROUP_IT = {
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
  legs: 'Gambe',
  core: 'Core',
  neck: 'Collo',
};

export const EQUIPMENT_IT = {
  barbell: 'Bilanciere',
  dumbbell: 'Manubri',
  'body only': 'Corpo libero',
  bands: 'Elastici',
  kettlebells: 'Kettlebell',
  'foam roll': 'Foam roller',
  cable: 'Cavi',
  machine: 'Macchina',
  'medicine ball': 'Palla medica',
  'exercise ball': 'Fitball',
  'e-z curl bar': 'Bilanciere EZ',
  other: 'Altro',
  null: 'Non specificato',
};

export const CATEGORY_IT = {
  strength: 'Forza',
  stretching: 'Stretching',
  cardio: 'Cardio',
  plyometrics: 'Pliometria',
  powerlifting: 'Powerlifting',
  'olympic weightlifting': 'Weightlifting olimpico',
  strongman: 'Strongman',
};

export const LEVEL_IT = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Avanzato',
};

export const FORCE_IT = {
  push: 'Spinta',
  pull: 'Trazione',
  static: 'Isometrico',
  null: 'Non specificato',
};

export const MECHANIC_IT = {
  compound: 'Multiarticolare',
  isolation: 'Isolamento',
  null: 'Non specificato',
};

export const PATTERN_IT = {
  squat: 'Accosciata',
  hinge: 'Anca (hinge)',
  lunge: 'Affondo',
  horizontal_push: 'Spinta orizzontale',
  vertical_push: 'Spinta verticale',
  horizontal_pull: 'Trazione orizzontale',
  vertical_pull: 'Trazione verticale',
  carry: 'Trasporto',
  core: 'Core',
  isolation: 'Isolamento',
  cardio: 'Cardio',
  mobility: 'Mobilità',
  olympic: 'Alzata olimpica',
};

// Attrezzatura disponibile per luogo di allenamento.
export const EQUIPMENT_BY_PLACE = {
  home_bodyweight: ['body only', null],
  home_basic: ['body only', null, 'dumbbell', 'bands', 'exercise ball', 'foam roll', 'medicine ball', 'kettlebells'],
  gym: ['body only', null, 'dumbbell', 'bands', 'exercise ball', 'foam roll', 'medicine ball',
        'kettlebells', 'barbell', 'cable', 'machine', 'e-z curl bar', 'other'],
  outdoor: ['body only', null, 'bands', 'medicine ball', 'kettlebells'],
};
