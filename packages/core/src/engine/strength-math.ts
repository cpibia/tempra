/**
 * Matematica della forza: stima del massimale, carichi di lavoro, volume.
 * Le formule sono valide in modo affidabile fino a circa 10-12 ripetizioni;
 * oltre quella soglia la stima diverge e l'app la presenta come indicativa.
 */

export type OneRmFormula = 'epley' | 'brzycki' | 'lombardi' | 'lander' | 'oconner' | 'wathan' | 'blend';

export const ONE_RM_FORMULAS: Record<Exclude<OneRmFormula, 'blend'>, (w: number, r: number) => number> = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => (w * 36) / (37 - r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  lander: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
  oconner: (w, r) => w * (1 + r / 40),
  wathan: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
};

/**
 * Massimale stimato (e1RM).
 * Il metodo predefinito "blend" media piu' formule in funzione del numero di ripetizioni:
 * i loro errori hanno segno opposto, quindi la media e' piu' stabile della singola formula.
 * Sulle serie lunghe Brzycki diverge (il denominatore tende a zero) e viene esclusa.
 * Riferimento: docs/research/01-scienza-allenamento.md, sezione 9.2.
 */
export function estimateOneRm(weightKg: number, reps: number, formula: OneRmFormula = 'blend'): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;

  if (formula === 'blend') {
    const f = ONE_RM_FORMULAS;
    if (reps <= 5) {
      return (f.epley(weightKg, reps) + f.brzycki(weightKg, reps)
        + f.lander(weightKg, reps) + f.wathan(weightKg, reps)) / 4;
    }
    if (reps <= 10) {
      return (f.epley(weightKg, reps) + f.brzycki(weightKg, reps) + f.wathan(weightKg, reps)) / 3;
    }
    return f.epley(weightKg, reps);
  }
  if (formula === 'brzycki' && reps >= 37) return ONE_RM_FORMULAS.epley(weightKg, reps);
  return ONE_RM_FORMULAS[formula](weightKg, reps);
}

/** Quanto e' affidabile la stima: cala rapidamente oltre le 10 ripetizioni. */
export function oneRmConfidence(reps: number): 'high' | 'medium' | 'low' {
  if (reps <= 5) return 'high';
  if (reps <= 10) return 'medium';
  return 'low';
}

/**
 * Percentuale del massimale sostenibile per un dato numero di ripetizioni.
 * Tabella di riferimento classica (NSCA), interpolata linearmente fra i valori noti.
 */
const REP_PERCENT_TABLE: Record<number, number> = {
  1: 100, 2: 95, 3: 93, 4: 90, 5: 87, 6: 85, 7: 83, 8: 80,
  9: 77, 10: 75, 11: 72, 12: 70, 13: 68, 14: 66, 15: 65,
  16: 63, 17: 62, 18: 60, 19: 59, 20: 58, 25: 53, 30: 50,
};

export function percentForReps(reps: number): number {
  if (reps <= 1) return 100;
  if (REP_PERCENT_TABLE[reps] !== undefined) return REP_PERCENT_TABLE[reps]!;
  const keys = Object.keys(REP_PERCENT_TABLE).map(Number).sort((a, b) => a - b);
  if (reps > keys[keys.length - 1]!) return 45;
  let lower = keys[0]!;
  let upper = keys[keys.length - 1]!;
  for (const k of keys) {
    if (k <= reps) lower = k;
    if (k >= reps) { upper = k; break; }
  }
  if (lower === upper) return REP_PERCENT_TABLE[lower]!;
  const ratio = (reps - lower) / (upper - lower);
  return REP_PERCENT_TABLE[lower]! + ratio * (REP_PERCENT_TABLE[upper]! - REP_PERCENT_TABLE[lower]!);
}

/** Ripetizioni attese a una data percentuale del massimale: inversa di percentForReps. */
export function repsForPercent(percent: number): number {
  for (let r = 1; r <= 30; r++) {
    if (percentForReps(r) <= percent) return r;
  }
  return 30;
}

/** Carico di lavoro da usare per centrare un numero di ripetizioni target. */
export function workingWeightFor(oneRmKg: number, targetReps: number): number {
  return (oneRmKg * percentForReps(targetReps)) / 100;
}

/**
 * Conversione RPE -> RIR (ripetizioni di riserva) e viceversa.
 * Scala RPE di Zourdos: RPE 10 = cedimento, RPE 8 = due ripetizioni in riserva.
 */
export const rpeToRir = (rpe: number): number => Math.max(0, 10 - rpe);
export const rirToRpe = (rir: number): number => Math.min(10, 10 - rir);

/** Una ripetizione di riserva vale circa il 3,5% del massimale. */
export const PERCENT_PER_RIR = 3.5;

/** Percentuale di massimale da usare per un target di ripetizioni a un dato RIR. */
export function percentForRepsAtRir(reps: number, rir: number): number {
  return Math.max(20, percentForReps(reps) - rir * PERCENT_PER_RIR);
}

/**
 * Massimale stimato tenendo conto delle ripetizioni di riserva dichiarate:
 * una serie da 8 ripetizioni con 2 in riserva equivale a un massimale da 10 ripetizioni.
 */
export function estimateOneRmFromRpe(weightKg: number, reps: number, rpe: number): number {
  return estimateOneRm(weightKg, reps + rpeToRir(rpe));
}

/** Tonnellaggio di una serie: peso per ripetizioni. Gli esercizi a tempo non contribuiscono. */
export function setVolume(weightKg: number | undefined, reps: number | undefined): number {
  if (!weightKg || !reps) return 0;
  return weightKg * reps;
}

/**
 * Indice di intensita' relativa di una sessione, usato per il grafico dei carichi.
 * Media pesata sul volume delle percentuali di massimale stimate.
 */
export function averageIntensity(sets: { weightKg?: number; reps?: number; e1rm?: number }[]): number {
  let weighted = 0;
  let total = 0;
  for (const s of sets) {
    if (!s.weightKg || !s.reps || !s.e1rm) continue;
    const vol = s.weightKg * s.reps;
    weighted += (s.weightKg / s.e1rm) * 100 * vol;
    total += vol;
  }
  return total > 0 ? weighted / total : 0;
}
