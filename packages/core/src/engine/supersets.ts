import { createId } from '../utils/id';

/**
 * Superserie.
 *
 * Un superset e' una sequenza di esercizi CONSECUTIVI con lo stesso
 * `supersetGroup`: si esegue una serie del primo, una del secondo e cosi' via,
 * e il recupero arriva solo dopo l'ultimo. Le funzioni lavorano sia sulle righe
 * di scheda sia sulle voci di una sessione, che condividono il campo.
 *
 * Dopo ogni modifica la lista passa da `normalizeSupersets`: un gruppo con un
 * solo esercizio non e' un superset, e un gruppo spezzato da uno spostamento
 * diventa due gruppi distinti invece di restare collegato "a distanza".
 */

interface Groupable {
  supersetGroup?: string;
}

export function normalizeSupersets<T extends Groupable>(items: T[]): T[] {
  const result = items.map((item) => ({ ...item }));
  const seen = new Set<string>();
  let index = 0;

  while (index < result.length) {
    const group = result[index]!.supersetGroup;
    let end = index + 1;
    if (group) {
      while (end < result.length && result[end]!.supersetGroup === group) end += 1;
    }

    if (group) {
      if (end - index < 2) {
        delete result[index]!.supersetGroup;
      } else if (seen.has(group)) {
        const fresh = createId('ss');
        for (let i = index; i < end; i += 1) result[i]!.supersetGroup = fresh;
      }
      seen.add(group);
    }
    index = end;
  }

  return result;
}

export function isLinkedWithNext<T extends Groupable>(items: T[], index: number): boolean {
  const group = items[index]?.supersetGroup;
  return Boolean(group) && items[index + 1]?.supersetGroup === group;
}

/** Collega l'elemento al successivo, unendo i rispettivi gruppi se ne hanno gia' uno. */
export function linkWithNext<T extends Groupable>(items: T[], index: number): T[] {
  const current = items[index];
  const next = items[index + 1];
  if (!current || !next) return items;

  const group = current.supersetGroup ?? next.supersetGroup ?? createId('ss');
  const absorbed = next.supersetGroup && next.supersetGroup !== group ? next.supersetGroup : null;

  return normalizeSupersets(items.map((item, i) => {
    if (i === index || i === index + 1) return { ...item, supersetGroup: group };
    if (absorbed && i > index && item.supersetGroup === absorbed) return { ...item, supersetGroup: group };
    return item;
  }));
}

/** Separa l'elemento dal successivo: il gruppo si spezza in due in quel punto. */
export function unlinkFromNext<T extends Groupable>(items: T[], index: number): T[] {
  if (!isLinkedWithNext(items, index)) return items;
  const group = items[index]!.supersetGroup;
  const fresh = createId('ss');

  return normalizeSupersets(items.map((item, i) => (
    i > index && item.supersetGroup === group ? { ...item, supersetGroup: fresh } : item
  )));
}

export interface SupersetPosition {
  /** Posizione nel superset, da 0. */
  index: number;
  size: number;
  /** Lettera progressiva del superset nella giornata: A, B, C... */
  letter: string;
}

/** Posizione di ogni elemento nel proprio superset, null per gli esercizi singoli. */
export function supersetPositions<T extends Groupable>(items: T[]): (SupersetPosition | null)[] {
  const positions: (SupersetPosition | null)[] = items.map(() => null);
  let letterIndex = 0;
  let start = 0;

  while (start < items.length) {
    const group = items[start]!.supersetGroup;
    let end = start + 1;
    if (group) {
      while (end < items.length && items[end]!.supersetGroup === group) end += 1;
    }
    if (group && end - start > 1) {
      const letter = String.fromCharCode(65 + (letterIndex % 26));
      letterIndex += 1;
      for (let i = start; i < end; i += 1) {
        positions[i] = { index: i - start, size: end - start, letter };
      }
    }
    start = end;
  }

  return positions;
}
