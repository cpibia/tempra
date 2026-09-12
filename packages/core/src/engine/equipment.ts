import type { Equipment, TrainingPlace } from '../domain/types';

/** Attrezzatura tipicamente disponibile per luogo di allenamento. */
export const EQUIPMENT_BY_PLACE: Record<TrainingPlace, (Equipment | null)[]> = {
  home_bodyweight: ['body only', null],
  home_basic: ['body only', null, 'dumbbell', 'bands', 'exercise ball', 'foam roll', 'medicine ball', 'kettlebells'],
  gym: ['body only', null, 'dumbbell', 'bands', 'exercise ball', 'foam roll', 'medicine ball',
    'kettlebells', 'barbell', 'cable', 'machine', 'e-z curl bar', 'other'],
  outdoor: ['body only', null, 'bands', 'medicine ball', 'kettlebells', 'other'],
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Bilanciere',
  dumbbell: 'Manubri',
  'body only': 'Corpo libero',
  bands: 'Elastici',
  kettlebells: 'Kettlebell',
  'foam roll': 'Foam roller',
  cable: 'Cavi',
  machine: 'Macchine',
  'medicine ball': 'Palla medica',
  'exercise ball': 'Fitball',
  'e-z curl bar': 'Bilanciere EZ',
  other: 'Altro',
};

export const PLACE_LABELS: Record<TrainingPlace, string> = {
  gym: 'Palestra attrezzata',
  home_basic: 'Casa con attrezzi',
  home_bodyweight: 'Casa a corpo libero',
  outdoor: 'All aperto',
};

/** Incremento minimo di carico realmente caricabile, per attrezzo. */
export const MIN_INCREMENT_KG: Record<Equipment, number> = {
  barbell: 2.5,
  'e-z curl bar': 2.5,
  dumbbell: 2,
  kettlebells: 4,
  machine: 5,
  cable: 2.5,
  'medicine ball': 1,
  'exercise ball': 1,
  'body only': 1,
  bands: 1,
  'foam roll': 1,
  other: 2.5,
};

export function minIncrementFor(equipment: Equipment | null): number {
  return equipment ? MIN_INCREMENT_KG[equipment] : 2.5;
}
