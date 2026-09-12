import type { Units } from '../domain/types';

const KG_PER_LB = 0.45359237;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;

/** Converte un peso memorizzato in kg nell'unita' scelta dall'utente. */
export function toDisplayWeight(kg: number, units: Units): number {
  return units === 'lb' ? round(kgToLb(kg), 1) : round(kg, 2);
}

export function fromDisplayWeight(value: number, units: Units): number {
  return units === 'lb' ? lbToKg(value) : value;
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Arrotonda un carico all'incremento realmente caricabile in palestra.
 * Con il bilanciere il passo minimo e' 2,5 kg (dischi da 1,25 per lato).
 */
export function roundToPlate(kg: number, stepKg = 2.5): number {
  if (kg <= 0) return 0;
  return Math.max(stepKg, Math.round(kg / stepKg) * stepKg);
}

/** Formatta una durata in secondi come mm:ss, oppure h:mm:ss oltre l'ora. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Durata leggibile da uno screen reader: "2 minuti e 30 secondi". */
export function formatDurationSpoken(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`);
  if (seconds > 0 || minutes === 0) parts.push(`${seconds} ${seconds === 1 ? 'secondo' : 'secondi'}`);
  return parts.join(' e ');
}

export function formatWeight(kg: number | undefined, units: Units): string {
  if (kg === undefined || kg === null) return '-';
  const v = toDisplayWeight(kg, units);
  const text = Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
  return `${text} ${units}`;
}

/** Formatta un intervallo di ripetizioni: 8 oppure "8-12". */
export function formatReps(reps: number | [number, number] | undefined): string {
  if (reps === undefined) return '-';
  return Array.isArray(reps) ? `${reps[0]}-${reps[1]}` : String(reps);
}

export function repsTarget(reps: number | [number, number] | undefined): number | undefined {
  if (reps === undefined) return undefined;
  return Array.isArray(reps) ? reps[1] : reps;
}
