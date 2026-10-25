import { describe, it, expect } from 'vitest';
import {
  afterSetCompleted, currentSetIndex, estimateCalories, nextEntryWithWork, sessionStats, setPhase,
} from '../src/index';
import type { LoggedSet, SessionEntry } from '../src/index';

const set = (patch: Partial<LoggedSet> = {}): LoggedSet => ({
  id: Math.random().toString(36), kind: 'working', restSec: 90, completed: false, ...patch,
});

const entry = (done: number, total: number, supersetGroup?: string): SessionEntry => ({
  id: Math.random().toString(36),
  exerciseId: 'Squat',
  order: 0,
  technique: 'straight',
  supersetGroup,
  sets: Array.from({ length: total }, (_, i) => set({ completed: i < done })),
});

describe('fasi di una serie', () => {
  it('distingue da fare, in corso, da registrare e fatta', () => {
    expect(setPhase(set())).toBe('pending');
    expect(setPhase(set({ startedAt: '2026-10-25T10:00:00Z' }))).toBe('running');
    expect(setPhase(set({ startedAt: '2026-10-25T10:00:00Z', durationSec: 40 }))).toBe('logging');
    expect(setPhase(set({ durationSec: 0 }))).toBe('logging');
    expect(setPhase(set({ completed: true }))).toBe('done');
  });

  it('trova la prima serie non completata', () => {
    expect(currentSetIndex(entry(2, 4))).toBe(2);
    expect(currentSetIndex(entry(3, 3))).toBe(-1);
  });
});

describe('passaggio fra esercizi', () => {
  it('resta sull esercizio finche ci sono serie, con recupero', () => {
    expect(afterSetCompleted([entry(1, 3), entry(0, 3)], 0)).toEqual({ kind: 'rest', entryIndex: 0 });
  });

  it('a esercizio finito propone il successivo con serie da fare', () => {
    expect(afterSetCompleted([entry(3, 3), entry(3, 3), entry(0, 2)], 0))
      .toEqual({ kind: 'exercise-done', nextEntryIndex: 2 });
  });

  it('torna indietro a un esercizio saltato', () => {
    expect(nextEntryWithWork([entry(0, 3), entry(3, 3), entry(3, 3)], 2)).toBe(0);
  });

  it('chiude quando non resta nulla', () => {
    expect(afterSetCompleted([entry(3, 3), entry(2, 2)], 1)).toEqual({ kind: 'workout-done' });
  });

  it('in superset alterna senza recupero e riposa a fine giro', () => {
    const afterA = [entry(1, 3, 'g'), entry(0, 3, 'g'), entry(0, 3)];
    expect(afterSetCompleted(afterA, 0)).toEqual({ kind: 'superset-next', entryIndex: 1 });
    const afterB = [entry(1, 3, 'g'), entry(1, 3, 'g'), entry(0, 3)];
    expect(afterSetCompleted(afterB, 1)).toEqual({ kind: 'rest', entryIndex: 0 });
  });

  it('in superset continua con chi ha ancora serie se gli altri hanno finito', () => {
    const uneven = [entry(2, 2, 'g'), entry(2, 4, 'g')];
    expect(afterSetCompleted(uneven, 1)).toEqual({ kind: 'rest', entryIndex: 1 });
  });

  it('a superset finito passa all esercizio dopo', () => {
    const done = [entry(3, 3, 'g'), entry(3, 3, 'g'), entry(0, 3)];
    expect(afterSetCompleted(done, 1)).toEqual({ kind: 'exercise-done', nextEntryIndex: 2 });
  });
});

describe('statistiche della seduta', () => {
  it('stima le calorie con 3,5 MET arrotondando alla decina', () => {
    // 3,5 x 80 kg x 1 h = 280 kcal
    expect(estimateCalories(3600, 80)).toBe(280);
    expect(estimateCalories(3600, undefined)).toBeNull();
  });

  it('conta solo le serie completate', () => {
    const stats = sessionStats({
      entries: [{
        ...entry(0, 0),
        sets: [
          set({ completed: true, reps: 10, weightKg: 50, durationSec: 40 }),
          set({ completed: true, reps: 8, weightKg: 50, durationSec: 35 }),
          set({ completed: false, reps: 8, weightKg: 50 }),
        ],
      }],
    });
    expect(stats).toMatchObject({ sets: 2, reps: 18, volumeKg: 900, timedSec: 75 });
    expect(stats.perExercise).toHaveLength(1);
  });
});
