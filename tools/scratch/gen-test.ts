import { generatePlan, buildScreening, getExercise, actualWeeklySets, estimateSessionMinutes, EMPTY_SCREENING } from '../../packages/core/src/index.ts';
import type { Profile } from '../../packages/core/src/index.ts';

const base: Profile = {
  id: 'me', sex: 'male', birthYear: 1990, heightCm: 178, weightKg: 80,
  goal: 'muscle', place: 'gym', equipment: [], daysPerWeek: 4, sessionMinutes: 60,
  experience: 'intermediate', conditions: [], excludedExerciseIds: [],
  units: 'kg', restPreference: 'standard',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

function show(label: string, profile: Profile, conditions: string[] = []) {
  const screening = conditions.length ? buildScreening(conditions) : EMPTY_SCREENING;
  const { plan, excluded } = generatePlan({ profile: { ...profile, conditions }, seed: 42 }, screening);
  console.log(`\n=== ${label} ===`);
  console.log(`Scheda: ${plan.name} | split=${plan.split} | giorni=${plan.days.length}`);
  for (const d of plan.days) {
    console.log(`  ${d.name} (${d.estimatedMinutes} min, ${d.items.length} esercizi)`);
    for (const it of d.items) {
      const ex = getExercise(it.exerciseId)!;
      const s = it.sets[0]!;
      const target = s.timeSec ? `${s.timeSec}s` : Array.isArray(s.reps) ? `${s.reps[0]}-${s.reps[1]}` : String(s.reps);
      console.log(`    - ${ex.nameEn} [${ex.loadType}] ${it.sets.length}x${target} rec ${s.restSec}s`);
    }
  }
  const vol = actualWeeklySets(plan.days);
  console.log('  Volume settimanale:', Object.entries(vol).map(([k,v])=>`${k}=${v}`).join(' '));
  if (excluded.length) console.log(`  Esclusi per salute: ${excluded.length} (es. ${excluded.slice(0,3).map(e=>e.exerciseName).join(', ')})`);
}

show('Intermedio, palestra, massa, 4gg, 60min', base);
show('Principiante, casa corpo libero, dimagrimento, 3gg, 45min',
  { ...base, experience: 'beginner', place: 'home_bodyweight', goal: 'fat_loss', daysPerWeek: 3, sessionMinutes: 45 });
show('Avanzato, palestra, forza, 4gg, 90min',
  { ...base, experience: 'advanced', goal: 'strength', daysPerWeek: 4, sessionMinutes: 90 });
show('Over 65 con ipertensione ed ernia lombare, casa attrezzata, salute, 3gg, 40min',
  { ...base, birthYear: 1955, experience: 'beginner', place: 'home_basic', goal: 'health', daysPerWeek: 3, sessionMinutes: 40 },
  ['older_adult_sarcopenia', 'hypertension', 'lumbar_disc_herniation']);
