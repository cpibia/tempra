import { describe, it, expect } from 'vitest';
import {
  estimateOneRm, estimateOneRmFromRpe, percentForReps, percentForRepsAtRir,
  repsForPercent, workingWeightFor, oneRmConfidence, rpeToRir, rirToRpe,
  roundToPlate, formatDuration, formatDurationSpoken, formatWeight,
} from '../src/index';

describe('stima del massimale', () => {
  it('con una ripetizione restituisce il carico stesso', () => {
    expect(estimateOneRm(100, 1)).toBe(100);
  });

  it('cresce al crescere delle ripetizioni a parita di carico', () => {
    const five = estimateOneRm(100, 5);
    const ten = estimateOneRm(100, 10);
    expect(ten).toBeGreaterThan(five);
    expect(five).toBeGreaterThan(100);
  });

  it('resta nell intorno atteso dalle tabelle di riferimento', () => {
    // 100 kg per 5 ripetizioni corrispondono a circa l 87 per cento del massimale.
    expect(estimateOneRm(100, 5)).toBeGreaterThan(110);
    expect(estimateOneRm(100, 5)).toBeLessThan(120);
  });

  it('non esplode sulle serie lunghe, dove Brzycki divergerebbe', () => {
    const value = estimateOneRm(50, 25);
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeLessThan(120);
  });

  it('rifiuta valori non sensati', () => {
    expect(estimateOneRm(0, 5)).toBe(0);
    expect(estimateOneRm(100, 0)).toBe(0);
  });

  it('tiene conto delle ripetizioni di riserva dichiarate', () => {
    // Otto ripetizioni con due in riserva equivalgono a un massimale da dieci.
    expect(estimateOneRmFromRpe(100, 8, 8)).toBeCloseTo(estimateOneRm(100, 10), 5);
  });

  it('dichiara quanto e affidabile la stima', () => {
    expect(oneRmConfidence(3)).toBe('high');
    expect(oneRmConfidence(8)).toBe('medium');
    expect(oneRmConfidence(20)).toBe('low');
  });
});

describe('relazione fra ripetizioni e percentuale di massimale', () => {
  it('e monotona decrescente', () => {
    for (let reps = 1; reps < 20; reps++) {
      expect(percentForReps(reps)).toBeGreaterThanOrEqual(percentForReps(reps + 1));
    }
  });

  it('rispetta i valori di riferimento', () => {
    expect(percentForReps(1)).toBe(100);
    expect(percentForReps(5)).toBe(87);
    expect(percentForReps(10)).toBe(75);
  });

  it('interpola i valori non presenti in tabella', () => {
    const value = percentForReps(22);
    expect(value).toBeLessThan(percentForReps(20));
    expect(value).toBeGreaterThan(percentForReps(25));
  });

  it('si inverte in modo coerente', () => {
    expect(repsForPercent(100)).toBe(1);
    expect(repsForPercent(75)).toBe(10);
  });

  it('abbassa la percentuale quando si lascia margine al cedimento', () => {
    expect(percentForRepsAtRir(8, 0)).toBe(percentForReps(8));
    expect(percentForRepsAtRir(8, 2)).toBeLessThan(percentForReps(8));
  });

  it('calcola il carico di lavoro dal massimale', () => {
    expect(workingWeightFor(100, 10)).toBeCloseTo(75, 5);
  });
});

describe('conversione fra sforzo percepito e ripetizioni di riserva', () => {
  it('e simmetrica', () => {
    for (let rpe = 5; rpe <= 10; rpe++) {
      expect(rirToRpe(rpeToRir(rpe))).toBe(rpe);
    }
  });

  it('associa il cedimento allo sforzo massimo', () => {
    expect(rpeToRir(10)).toBe(0);
  });
});

describe('formattazione', () => {
  it('arrotonda i carichi a quanto si puo davvero caricare', () => {
    expect(roundToPlate(61.3)).toBe(62.5);
    expect(roundToPlate(0)).toBe(0);
    expect(roundToPlate(1)).toBe(2.5);
  });

  it('scrive le durate in minuti e secondi', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('scrive le durate in forma leggibile da uno screen reader', () => {
    expect(formatDurationSpoken(90)).toBe('1 minuto e 30 secondi');
    expect(formatDurationSpoken(60)).toBe('1 minuto');
    expect(formatDurationSpoken(1)).toBe('1 secondo');
  });

  it('converte i pesi nell unita scelta', () => {
    expect(formatWeight(100, 'kg')).toBe('100 kg');
    expect(formatWeight(undefined, 'kg')).toBe('-');
    expect(formatWeight(100, 'lb')).toMatch(/lb$/);
  });
});
