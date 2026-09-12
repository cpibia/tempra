import type { ConditionRule } from './types';
import rawConditions from './conditions.json' with { type: 'json' };

/**
 * Regole sanitarie applicate dal motore.
 *
 * I criteri clinici (categorie, attrezzi, pattern di movimento, parole chiave)
 * sono gia' stati risolti in liste esplicite di esercizi durante la build, con
 * tools/build-conditions.mjs. A runtime non si valuta nessuna espressione regolare
 * sui nomi: era la fonte principale di errori, perche' "dead" colpisce "Dead Bug"
 * e "row" colpisce "Seated Cable Rows".
 *
 * Fonte clinica e razionale: docs/research/03-salute-sicurezza.md.
 * Tempra non e' un dispositivo medico: questi filtri sono una precauzione,
 * non una prescrizione.
 */
export const CONDITIONS = rawConditions as unknown as ConditionRule[];

const BY_ID = new Map(CONDITIONS.map((c) => [c.id, c]));

export const getCondition = (id: string): ConditionRule | undefined => BY_ID.get(id);

/** Condizioni raggruppate per area, nell'ordine in cui appaiono nell'onboarding. */
export function conditionsByGroup(): [ConditionRule['group'], ConditionRule[]][] {
  const order: ConditionRule['group'][] = ['musculoskeletal', 'cardiometabolic', 'life_stage', 'accessibility', 'other'];
  return order
    .map((group) => [group, CONDITIONS.filter((c) => c.group === group)] as [ConditionRule['group'], ConditionRule[]])
    .filter(([, list]) => list.length > 0);
}
