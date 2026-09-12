import { describe, it, expect } from 'vitest';
import {
  generatePlan, buildScreening, EMPTY_SCREENING, getExercise, estimateSessionMinutes,
  EQUIPMENT_BY_PLACE, actualWeeklySets, VOLUME_LANDMARKS,
} from '../src/index';
import type { Goal, Profile, TrainingPlace, Experience } from '../src/index';

const profile = (patch: Partial<Profile> = {}): Profile => ({
  id: 'me', sex: 'male', birthYear: 1990, heightCm: 178, weightKg: 80,
  goal: 'muscle', place: 'gym', equipment: [], daysPerWeek: 4, sessionMinutes: 60,
  experience: 'intermediate', conditions: [], excludedExerciseIds: [],
  units: 'kg', restPreference: 'standard',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...patch,
});

const generate = (patch: Partial<Profile> = {}, seed = 7) => {
  const p = profile(patch);
  return generatePlan({ profile: p, seed }, p.conditions.length ? buildScreening(p.conditions) : EMPTY_SCREENING);
};

describe('generatore di schede', () => {
  it('produce un giorno per ogni allenamento previsto', () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const { plan } = generate({ daysPerWeek: days });
      expect(plan.days.length).toBe(days);
    }
  });

  it('e deterministico a parita di seme', () => {
    const a = generate({}, 42).plan;
    const b = generate({}, 42).plan;
    expect(a.days.map((d) => d.items.map((i) => i.exerciseId)))
      .toEqual(b.days.map((d) => d.items.map((i) => i.exerciseId)));
  });

  it('propone schede diverse con semi diversi', () => {
    const a = generate({}, 1).plan;
    const b = generate({}, 999).plan;
    const flat = (p: typeof a) => p.days.flatMap((d) => d.items.map((i) => i.exerciseId)).join('|');
    expect(flat(a)).not.toBe(flat(b));
  });

  it('non ripete lo stesso esercizio nella stessa seduta', () => {
    const { plan } = generate();
    for (const day of plan.days) {
      const ids = day.items.map((i) => i.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('non propone mai esercizi di stretching come lavoro di forza', () => {
    const { plan } = generate();
    for (const day of plan.days) {
      for (const item of day.items) {
        const exercise = getExercise(item.exerciseId)!;
        expect(exercise.category).not.toBe('stretching');
        expect(exercise.pattern).not.toBe('mobility');
      }
    }
  });

  it('ogni esercizio ha almeno due serie e una pausa sensata', () => {
    const { plan } = generate();
    for (const day of plan.days) {
      for (const item of day.items) {
        expect(item.sets.length).toBeGreaterThanOrEqual(2);
        expect(item.restSec).toBeGreaterThanOrEqual(15);
        expect(item.restSec).toBeLessThanOrEqual(300);
        expect(item.restSec % 15).toBe(0);
      }
    }
  });

  it('gli esercizi a tempo ricevono secondi, gli altri ripetizioni', () => {
    const { plan } = generate();
    for (const day of plan.days) {
      for (const item of day.items) {
        const exercise = getExercise(item.exerciseId)!;
        for (const set of item.sets) {
          if (exercise.loadType === 'time') expect(set.timeSec).toBeGreaterThan(0);
          else expect(set.reps).toBeDefined();
        }
      }
    }
  });

  it('rispetta il tempo dichiarato per la seduta, con un margine del dieci per cento', () => {
    for (const minutes of [30, 45, 60, 90]) {
      const { plan } = generate({ sessionMinutes: minutes });
      for (const day of plan.days) {
        expect(estimateSessionMinutes(day.items)).toBeLessThanOrEqual(minutes * 1.1);
      }
    }
  });

  it('usa solo attrezzatura disponibile nel luogo scelto', () => {
    const places: TrainingPlace[] = ['gym', 'home_basic', 'home_bodyweight', 'outdoor'];
    for (const place of places) {
      const { plan } = generate({ place });
      const allowed = EQUIPMENT_BY_PLACE[place];
      for (const day of plan.days) {
        for (const item of day.items) {
          const exercise = getExercise(item.exerciseId)!;
          if (exercise.equipment === null || exercise.equipment === 'body only') continue;
          expect(allowed).toContain(exercise.equipment);
        }
      }
    }
  });

  it('a corpo libero non prescrive mai un carico da caricare', () => {
    const { plan } = generate({ place: 'home_bodyweight' });
    for (const day of plan.days) {
      for (const item of day.items) {
        const exercise = getExercise(item.exerciseId)!;
        expect(['body only', null]).toContain(exercise.equipment);
      }
    }
  });

  it('non propone esercizi avanzati a un principiante', () => {
    const { plan } = generate({ experience: 'beginner' });
    for (const day of plan.days) {
      for (const item of day.items) {
        expect(getExercise(item.exerciseId)!.level).not.toBe('expert');
      }
    }
  });

  it('rispetta le esclusioni manuali dell utente', () => {
    const first = generate().plan.days[0]!.items[0]!.exerciseId;
    const { plan } = generate({ excludedExerciseIds: [first] });
    const used = plan.days.flatMap((d) => d.items.map((i) => i.exerciseId));
    expect(used).not.toContain(first);
  });

  it('copre i grandi distretti almeno al volume minimo efficace', () => {
    const { plan } = generate();
    const volume = actualWeeklySets(plan.days);
    for (const group of ['chest', 'back', 'quads'] as const) {
      const mev = VOLUME_LANDMARKS[group].intermediate.mev;
      expect(volume[group] ?? 0).toBeGreaterThanOrEqual(mev * 0.7);
    }
  });

  it('adatta ripetizioni e pause all obiettivo', () => {
    const strength = generate({ goal: 'strength', sessionMinutes: 90 }).plan;
    const endurance = generate({ goal: 'endurance' }).plan;

    const avgRest = (plan: typeof strength) => {
      const rests = plan.days.flatMap((d) => d.items.map((i) => i.restSec));
      return rests.reduce((s, r) => s + r, 0) / rests.length;
    };
    expect(avgRest(strength)).toBeGreaterThan(avgRest(endurance));
  });

  it('spiega sempre le scelte fatte', () => {
    const { plan, rationale } = generate();
    expect(rationale.length).toBeGreaterThan(0);
    expect(plan.generation?.engineVersion).toBeTruthy();
    expect(plan.generation?.weeklySetsByGroup).toBeTruthy();
  });
});

describe('vincoli sanitari nella generazione', () => {
  it('non inserisce esercizi esclusi dalle condizioni dichiarate', () => {
    const conditions = ['lumbar_disc_herniation'];
    const screening = buildScreening(conditions);
    const p = profile({ conditions });
    const { plan, excluded } = generatePlan({ profile: p, seed: 3 }, screening);

    expect(excluded.length).toBeGreaterThan(50);
    const blockedIds = new Set(excluded.map((e) => e.exerciseId));
    for (const day of plan.days) {
      for (const item of day.items) {
        expect(blockedIds.has(item.exerciseId)).toBe(false);
      }
    }
  });

  it('con l ernia lombare non propone stacchi ne flessioni del tronco caricate', () => {
    const conditions = ['lumbar_disc_herniation'];
    const p = profile({ conditions });
    const { plan } = generatePlan({ profile: p, seed: 3 }, buildScreening(conditions));
    const names = plan.days.flatMap((d) => d.items.map((i) => getExercise(i.exerciseId)!.nameEn.toLowerCase()));
    for (const forbidden of ['deadlift', 'good morning', 'sit-up', 'russian twist']) {
      expect(names.some((n) => n.includes(forbidden))).toBe(false);
    }
  });

  it('con la cardiopatia allontana il lavoro dal cedimento', () => {
    const conditions = ['cardiac_disease_post_mi'];
    const p = profile({ conditions });
    const { plan } = generatePlan({ profile: p, seed: 3 }, buildScreening(conditions));
    const rirs = plan.days.flatMap((d) => d.items.flatMap((i) => i.sets.map((s) => s.rir)))
      .filter((r): r is number => r !== undefined);
    expect(Math.min(...rirs)).toBeGreaterThanOrEqual(3);
  });

  it('riduce il volume quando il recupero e compromesso', () => {
    const healthy = generate().plan;
    const conditions = ['older_adult_sarcopenia'];
    const p = profile({ conditions, birthYear: 1955 });
    const { plan: careful } = generatePlan({ profile: p, seed: 7 }, buildScreening(conditions));

    const sets = (plan: typeof healthy) =>
      plan.days.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.sets.length, 0), 0);
    expect(sets(careful)).toBeLessThan(sets(healthy));
  });

  it('senza condizioni non esclude nulla', () => {
    const { excluded } = generate();
    expect(excluded).toHaveLength(0);
  });
});

describe('robustezza su tutte le combinazioni di profilo', () => {
  const goals: Goal[] = ['muscle', 'fat_loss', 'strength', 'recomp', 'endurance', 'health'];
  const places: TrainingPlace[] = ['gym', 'home_basic', 'home_bodyweight', 'outdoor'];
  const levels: Experience[] = ['beginner', 'intermediate', 'advanced'];

  it('genera sempre una scheda non vuota e coerente', () => {
    for (const goal of goals) {
      for (const place of places) {
        for (const experience of levels) {
          for (const daysPerWeek of [2, 3, 4, 5, 6]) {
            const { plan } = generate({ goal, place, experience, daysPerWeek }, 11);
            const context = `${goal}/${place}/${experience}/${daysPerWeek}`;
            expect(plan.days.length, context).toBe(daysPerWeek);
            for (const day of plan.days) {
              expect(day.items.length, `${context} ${day.name}`).toBeGreaterThanOrEqual(3);
            }
          }
        }
      }
    }
  });
});
