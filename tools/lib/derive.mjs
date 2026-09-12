// Classificazione derivata degli esercizi a partire da nome + campi del dataset.
// Serve al motore di generazione delle schede e ai filtri di sicurezza.

const has = (name, ...words) => words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(name));
const hasRaw = (name, ...words) => words.some((w) => new RegExp(w, 'i').test(name));

export function derivePattern(ex) {
  const n = ex.name;
  const pm = ex.primaryMuscles || [];

  if (ex.category === 'stretching') return 'mobility';
  if (ex.category === 'cardio') return 'cardio';
  if (ex.category === 'olympic weightlifting' || has(n, 'snatch', 'clean', 'jerk')) return 'olympic';

  if (hasRaw(n, "farmer'?s walk|suitcase carry|waiter walk|overhead carry|yoke walk|sandbag carry")) return 'carry';
  if (has(n, 'squat', 'leg press', 'hack', 'sissy', 'wall sit')) return 'squat';
  if (hasRaw(n, 'deadlift|good ?morning|hip thrust|glute bridge|romanian|rdl|swing|back extension|hyperextension|pull ?through')) return 'hinge';
  if (has(n, 'lunge', 'step up', 'step-up', 'split squat', 'bulgarian')) return 'lunge';
  if (hasRaw(n, 'overhead press|shoulder press|military press|push press|arnold press|handstand|pike push')) return 'vertical_push';
  if (hasRaw(n, 'bench press|chest press|push ?up|dip|fly|flye|pec deck|floor press|crossover')) return 'horizontal_push';
  if (hasRaw(n, 'pull ?up|chin ?up|pulldown|pull ?down|lat pull')) return 'vertical_pull';
  if (hasRaw(n, ' row|^row|inverted row|face pull|rear delt|shrug')) return 'horizontal_pull';

  if (pm.includes('abdominals') || pm.includes('lower back')) return 'core';
  return 'isolation';
}

const TIME_WORDS = ['plank', 'wall sit', 'l-sit', 'dead hang', 'isometric', 'hold', 'bridge hold', 'superman'];

export function deriveLoadType(ex) {
  const n = ex.name;
  const eq = ex.equipment;

  if (ex.category === 'stretching') return 'time';
  if (ex.category === 'cardio') return 'time';
  if (ex.force === 'static' || has(n, ...TIME_WORDS)) return 'time';

  const weighted = ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebells', 'e-z curl bar', 'medicine ball'];
  if (weighted.includes(eq)) return 'weight';
  // Corpo libero ma zavorrabile: trazioni, dip, push up, squat a corpo libero.
  if (hasRaw(n, 'pull ?up|chin ?up|dip|push ?up|muscle ?up|pistol')) return 'bodyweight_loadable';
  if (eq === 'bands') return 'bands';
  return 'bodyweight';
}

export function deriveUnilateral(ex) {
  return hasRaw(ex.name,
    'one ?arm|single ?arm|one ?leg|single ?leg|alternat|unilateral|split squat|bulgarian|lunge|step ?up|pistol|suitcase');
}

export function deriveImpact(ex) {
  if (ex.category === 'plyometrics') return 'high';
  // I confini di parola sono obbligatori: senza, "Crunch" contiene "run" e
  // l'esercizio verrebbe classificato ad alto impatto.
  if (hasRaw(ex.name, '\\b(jump|hop|bound|box|burpee|skip|sprint|run|depth|leap|jerk)\\w*\\b')) return 'high';
  if (ex.category === 'olympic weightlifting' || ex.category === 'strongman') return 'medium';
  if (ex.category === 'cardio') return 'medium';
  return 'low';
}

// Carico assiale sulla colonna: rilevante per ernie, lombalgia, osteoporosi.
export function deriveAxialLoad(ex) {
  const n = ex.name;
  if (hasRaw(n, 'back squat|front squat|overhead squat|^squat|barbell squat|zercher')) return true;
  if (hasRaw(n, 'deadlift|good ?morning|clean|snatch|jerk|standing.*(press|overhead)|military press')) return true;
  if (ex.equipment === 'barbell' && hasRaw(n, 'squat|press|row|lunge|shrug')) return true;
  return false;
}

// Punteggio di priorità: il generatore preferisce i fondamentali riconoscibili
// rispetto alle varianti esotiche del dataset.
const CORE_LIFTS = [
  'Barbell Squat', 'Barbell Bench Press - Medium Grip', 'Barbell Deadlift', 'Romanian Deadlift',
  'Pullups', 'Chin-Up', 'Dumbbell Bench Press', 'Barbell Incline Bench Press - Medium Grip',
  'Standing Military Press', 'Bent Over Barbell Row', 'Seated Cable Rows', 'Wide-Grip Lat Pulldown',
  'Leg Press', 'Lying Leg Curls', 'Leg Extensions', 'Standing Calf Raises',
  'Dumbbell Lunges', 'Dips - Triceps Version', 'Pushups', 'Plank', 'Hanging Leg Raise',
  'Dumbbell Bicep Curl', 'Triceps Pushdown', 'Side Lateral Raise', 'Face Pull',
  'Barbell Hip Thrust', 'Front Barbell Squat', 'Goblet Squat', 'Kettlebell Swing', 'Bodyweight Squat',
  'Barbell Shoulder Press', 'Dumbbell Shoulder Press', 'Incline Dumbbell Press',
  'Cable Crossover', 'Dumbbell Flyes', 'Seated Leg Curl', 'Machine Bench Press',
  'Reverse Crunch', 'Russian Twist', 'Bench Press - Powerlifting',
];

export function derivePriority(ex) {
  let score = 50;
  if (CORE_LIFTS.some((l) => l.toLowerCase() === ex.name.toLowerCase())) score += 40;
  if (['barbell', 'e-z curl bar'].includes(ex.equipment)) score += 4;
  if (ex.mechanic === 'compound') score += 12;
  if (ex.level === 'beginner') score += 8;
  if (ex.level === 'expert') score -= 12;
  if (['barbell', 'dumbbell', 'body only', 'cable', 'machine'].includes(ex.equipment)) score += 6;
  if (ex.category === 'strongman') score -= 20;
  if (ex.category === 'olympic weightlifting') score -= 10;
  if (hasRaw(ex.name, 'smith machine')) score -= 6;
  if ((ex.images || []).length >= 2) score += 4;
  return score;
}

// Pausa consigliata di default in secondi, poi modificabile dall'utente.
export function deriveDefaultRest(ex) {
  const pattern = derivePattern(ex);
  if (ex.category === 'stretching') return 20;
  if (ex.category === 'cardio') return 60;
  if (['squat', 'hinge', 'olympic'].includes(pattern)) return 180;
  if (ex.mechanic === 'compound') return 120;
  if (pattern === 'core') return 60;
  return 75;
}

export function deriveHomeFriendly(ex) {
  return ['body only', 'bands', 'dumbbell', 'kettlebells', 'exercise ball', 'foam roll', 'medicine ball', null]
    .includes(ex.equipment);
}
