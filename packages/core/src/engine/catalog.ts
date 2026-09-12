import type {
  Exercise, Equipment, Level, MuscleGroup, MovementPattern, ExerciseCategory,
} from '../domain/types';
import rawCatalog from '../data/exercises.json' with { type: 'json' };

export const EXERCISES = rawCatalog as unknown as Exercise[];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
const BY_SLUG = new Map(EXERCISES.map((e) => [e.slug, e]));

export const getExercise = (id: string): Exercise | undefined => BY_ID.get(id);
export const getExerciseBySlug = (slug: string): Exercise | undefined => BY_SLUG.get(slug);

export function getExercises(ids: string[]): Exercise[] {
  return ids.map((id) => BY_ID.get(id)).filter((e): e is Exercise => Boolean(e));
}

// ---------------------------------------------------------------------------
// Ricerca
// ---------------------------------------------------------------------------

/** Normalizza per la ricerca: minuscolo, senza accenti e senza punteggiatura. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEARCH_INDEX: { id: string; haystack: string; name: string; priority: number }[] =
  EXERCISES.map((e) => ({
    id: e.id,
    name: normalize(e.name),
    haystack: normalize([e.name, e.nameEn, ...e.aliases, ...e.primaryMuscles, e.equipment ?? ''].join(' ')),
    priority: e.priority,
  }));

/**
 * Ricerca testuale tollerante: tutti i termini devono comparire, ma in qualsiasi ordine.
 * Il punteggio premia le corrispondenze a inizio nome e i fondamentali.
 */
export function searchExercises(query: string, limit = 60): Exercise[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(' ').filter(Boolean);

  const scored: { id: string; score: number }[] = [];
  for (const item of SEARCH_INDEX) {
    if (!terms.every((t) => item.haystack.includes(t))) continue;
    let score = item.priority / 10;
    if (item.name.startsWith(q)) score += 100;
    else if (item.name.includes(q)) score += 50;
    if (terms.every((t) => item.name.includes(t))) score += 25;
    scored.push({ id: item.id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ id }) => BY_ID.get(id)!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Filtri
// ---------------------------------------------------------------------------

export interface CatalogFilter {
  query?: string;
  muscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  levels?: Level[];
  categories?: ExerciseCategory[];
  patterns?: MovementPattern[];
  /** Esclude gli esercizi che richiedono attrezzatura non disponibile. */
  availableEquipment?: (Equipment | null)[];
  homeOnly?: boolean;
  excludeIds?: string[];
  maxImpact?: 'low' | 'medium' | 'high';
  excludeAxialLoad?: boolean;
}

const IMPACT_RANK = { low: 0, medium: 1, high: 2 } as const;

export function filterExercises(filter: CatalogFilter): Exercise[] {
  const base = filter.query ? searchExercises(filter.query, 500) : EXERCISES;
  const excluded = new Set(filter.excludeIds ?? []);

  return base.filter((e) => {
    if (excluded.has(e.id)) return false;
    if (filter.muscleGroups?.length && !e.muscleGroups.some((g) => filter.muscleGroups!.includes(g))) return false;
    if (filter.equipment?.length && !(e.equipment && filter.equipment.includes(e.equipment))) return false;
    if (filter.levels?.length && !filter.levels.includes(e.level)) return false;
    if (filter.categories?.length && !filter.categories.includes(e.category)) return false;
    if (filter.patterns?.length && !filter.patterns.includes(e.pattern)) return false;
    if (filter.availableEquipment && !filter.availableEquipment.includes(e.equipment)) return false;
    if (filter.homeOnly && !e.homeFriendly) return false;
    if (filter.maxImpact && IMPACT_RANK[e.impact] > IMPACT_RANK[filter.maxImpact]) return false;
    if (filter.excludeAxialLoad && e.axialLoad) return false;
    return true;
  });
}

/** Ordinamento predefinito delle liste: prima i fondamentali, poi alfabetico. */
export function sortByRelevance(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name, 'it'));
}

// ---------------------------------------------------------------------------
// Aggregazioni utili alla UI
// ---------------------------------------------------------------------------

export function countByMuscleGroup(list: Exercise[] = EXERCISES): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of list) for (const g of e.muscleGroups) counts[g] = (counts[g] ?? 0) + 1;
  return counts;
}

export function availableEquipmentList(): Equipment[] {
  return [...new Set(EXERCISES.map((e) => e.equipment).filter((e): e is Equipment => Boolean(e)))].sort();
}

// ---------------------------------------------------------------------------
// Istruzioni di esecuzione
// ---------------------------------------------------------------------------

let instructionsCache: Record<string, string[]> | null = null;

/**
 * Le istruzioni pesano circa 900 KB e servono solo nella pagina di dettaglio.
 * Restano in un modulo separato, caricato al primo esercizio aperto e poi
 * tenuto in memoria. Cosi' l'avvio dell'app non paga quel costo.
 */
export async function loadInstructions(exerciseId: string): Promise<string[]> {
  if (!instructionsCache) {
    const module = await import('../data/instructions.json', { with: { type: 'json' } });
    instructionsCache = (module.default ?? module) as unknown as Record<string, string[]>;
  }
  return instructionsCache[exerciseId] ?? [];
}
