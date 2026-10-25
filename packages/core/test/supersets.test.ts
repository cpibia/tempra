import { describe, it, expect } from 'vitest';
import {
  isLinkedWithNext, linkWithNext, normalizeSupersets, supersetPositions, unlinkFromNext,
} from '../src/index';

const items = (...groups: (string | undefined)[]) =>
  groups.map((supersetGroup, i) => ({ id: `e${i}`, supersetGroup }));

const groupsOf = (list: { supersetGroup?: string }[]) => list.map((i) => i.supersetGroup);

describe('superserie', () => {
  it('collega due esercizi singoli con un gruppo nuovo', () => {
    const linked = linkWithNext(items(undefined, undefined, undefined), 0);
    expect(linked[0]!.supersetGroup).toBeDefined();
    expect(linked[1]!.supersetGroup).toBe(linked[0]!.supersetGroup);
    expect(linked[2]!.supersetGroup).toBeUndefined();
  });

  it('allunga un superset esistente fino a farlo diventare un circuito', () => {
    const linked = linkWithNext(items('a', 'a', undefined), 1);
    expect(groupsOf(linked)).toEqual(['a', 'a', 'a']);
  });

  it('unisce due superset adiacenti quando si collegano', () => {
    const linked = linkWithNext(items('a', 'a', 'b', 'b'), 1);
    expect(groupsOf(linked)).toEqual(['a', 'a', 'a', 'a']);
  });

  it('scollegando al centro spezza il gruppo in due superset', () => {
    const split = unlinkFromNext(items('a', 'a', 'a', 'a'), 1);
    expect(split[0]!.supersetGroup).toBe('a');
    expect(split[1]!.supersetGroup).toBe('a');
    expect(split[2]!.supersetGroup).toBeDefined();
    expect(split[2]!.supersetGroup).not.toBe('a');
    expect(split[3]!.supersetGroup).toBe(split[2]!.supersetGroup);
  });

  it('scollegando una coppia non lascia gruppi da un solo esercizio', () => {
    expect(groupsOf(unlinkFromNext(items('a', 'a'), 0))).toEqual([undefined, undefined]);
  });

  it('dopo uno spostamento un gruppo non contiguo diventa due gruppi', () => {
    const normalized = normalizeSupersets(items('a', 'a', undefined, 'a', 'a'));
    expect(normalized[0]!.supersetGroup).toBe('a');
    expect(normalized[3]!.supersetGroup).not.toBe('a');
    expect(normalized[3]!.supersetGroup).toBe(normalized[4]!.supersetGroup);
  });

  it('non modifica la lista originale', () => {
    const original = items(undefined, undefined);
    linkWithNext(original, 0);
    expect(groupsOf(original)).toEqual([undefined, undefined]);
  });

  it('assegna lettere e posizioni solo agli esercizi in superset', () => {
    const list = items('a', 'a', undefined, 'b', 'b', 'b');
    expect(isLinkedWithNext(list, 1)).toBe(false);
    expect(supersetPositions(list)).toEqual([
      { index: 0, size: 2, letter: 'A' },
      { index: 1, size: 2, letter: 'A' },
      null,
      { index: 0, size: 3, letter: 'B' },
      { index: 1, size: 3, letter: 'B' },
      { index: 2, size: 3, letter: 'B' },
    ]);
  });
});
