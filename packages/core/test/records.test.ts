import { describe, it, expect } from 'vitest';
import { candidatesFromSets, detectNewRecords, summarizeSession } from '../src/index';
import type { LoggedSet, PersonalRecord, Session } from '../src/index';

const set = (patch: Partial<LoggedSet>): LoggedSet => ({
  id: Math.random().toString(36),
  kind: 'working',
  restSec: 90,
  completed: true,
  ...patch,
});

describe('rilevamento dei record personali', () => {
  it('ignora le serie non completate e il riscaldamento', () => {
    const candidates = candidatesFromSets('Squat', [
      set({ weightKg: 100, reps: 5, completed: false }),
      set({ weightKg: 60, reps: 10, kind: 'warmup' }),
    ]);
    expect(candidates).toHaveLength(0);
  });

  it('produce carico, volume e massimale stimato per una serie con sovraccarico', () => {
    const types = candidatesFromSets('Squat', [set({ weightKg: 100, reps: 5 })]).map((c) => c.type);
    expect(types).toEqual(['weight', 'volume', 'e1rm']);
  });

  it('per il corpo libero registra le ripetizioni', () => {
    const candidates = candidatesFromSets('Pullups', [set({ reps: 12 })]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.type).toBe('reps');
    expect(candidates[0]!.value).toBe(12);
  });

  it('per gli esercizi a tempo registra la durata', () => {
    const candidates = candidatesFromSets('Plank', [set({ timeSec: 75 })]);
    expect(candidates[0]).toMatchObject({ type: 'time', value: 75 });
  });

  it('riconosce solo i valori migliori dei primati esistenti', () => {
    const existing: PersonalRecord[] = [{
      id: 'r1', exerciseId: 'Squat', type: 'weight', value: 120,
      sessionId: 's0', achievedAt: new Date().toISOString(),
    }];
    const candidates = candidatesFromSets('Squat', [set({ weightKg: 110, reps: 5 })]);
    const records = detectNewRecords(candidates, existing);
    expect(records.map((r) => r.type)).not.toContain('weight');
  });

  it('tiene una sola vittoria per tipo anche con piu serie migliori', () => {
    const candidates = candidatesFromSets('Squat', [
      set({ weightKg: 100, reps: 5 }),
      set({ weightKg: 105, reps: 5 }),
    ]);
    const records = detectNewRecords(candidates, []);
    const weights = records.filter((r) => r.type === 'weight');
    expect(weights).toHaveLength(1);
    expect(weights[0]!.value).toBe(105);
  });
});

describe('riepilogo della sessione', () => {
  it('somma solo le serie di lavoro completate', () => {
    const session: Session = {
      id: 's1', name: 'Test', status: 'completed',
      startedAt: new Date().toISOString(), durationSec: 0,
      totalVolumeKg: 0, totalSets: 0, updatedAt: new Date().toISOString(),
      entries: [{
        id: 'e1', exerciseId: 'Squat', order: 0, technique: 'straight',
        sets: [
          set({ weightKg: 100, reps: 5 }),
          set({ weightKg: 100, reps: 5 }),
          set({ weightKg: 60, reps: 10, kind: 'warmup' }),
          set({ weightKg: 100, reps: 5, completed: false }),
        ],
      }],
    };
    expect(summarizeSession(session)).toEqual({ totalVolumeKg: 1000, totalSets: 2, totalReps: 10 });
  });
});
