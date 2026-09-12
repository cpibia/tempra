/**
 * Trasforma le regole cliniche di docs/research/03-regole-condizioni.json
 * nel formato usato dal motore, risolvendo OGNI criterio in una lista esplicita
 * di identificativi di esercizio.
 *
 * Il motivo e' la precisione: a runtime non si applicano piu' espressioni regolari
 * sui nomi, che sono la fonte principale di falsi positivi (la parola "dead"
 * colpisce "Dead Bug", "row" colpisce "Seated Cable Rows"). Qui la corrispondenza
 * si fa una volta sola, si applicano le eccezioni dichiarate nella ricerca, e il
 * risultato e' verificabile leggendo l'elenco prodotto.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RULES = JSON.parse(readFileSync(join(ROOT, 'docs/research/03-regole-condizioni.json'), 'utf8'));
const CATALOG = JSON.parse(readFileSync(join(ROOT, 'packages/core/src/data/exercises.json'), 'utf8'));
const OUT = join(ROOT, 'packages/core/src/health/conditions.json');

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const HAYSTACK = new Map(CATALOG.map((e) => [e.id, norm(e.nameEn)]));

function matchesKeywords(id, keywords = [], excludeKeywords = []) {
  const hay = HAYSTACK.get(id);
  if (!hay) return false;
  if (excludeKeywords.some((k) => hay.includes(norm(k)))) return false;
  return keywords.some((k) => hay.includes(norm(k)));
}

/** Espande i pattern di movimento della ricerca in identificativi di esercizio. */
function idsForMovementPattern(patternId) {
  const pattern = RULES.movement_patterns[patternId];
  if (!pattern) return [];
  return CATALOG
    .filter((e) => matchesKeywords(e.id, pattern.name_keywords, pattern.name_keywords_exclude))
    .map((e) => e.id);
}

const PATTERN_CACHE = new Map();
const cachedPattern = (id) => {
  if (!PATTERN_CACHE.has(id)) PATTERN_CACHE.set(id, idsForMovementPattern(id));
  return PATTERN_CACHE.get(id);
};

/** Risolve un blocco exclude o warn nella lista di esercizi che colpisce. */
function resolveBlock(block) {
  if (!block) return [];
  const ids = new Set();

  for (const exercise of CATALOG) {
    const byCategory = block.categories?.includes(exercise.category);
    const byEquipment = block.equipment?.includes(exercise.equipment);
    const byMuscle = block.primary_muscles?.some((m) => exercise.primaryMuscles.includes(m));
    const byKeyword = block.name_keywords?.length
      ? matchesKeywords(exercise.id, block.name_keywords, block.name_keywords_exclude)
      : false;
    if (byCategory || byEquipment || byMuscle || byKeyword) ids.add(exercise.id);
  }

  for (const patternId of block.movement_patterns ?? []) {
    for (const id of cachedPattern(patternId)) ids.add(id);
  }

  // La blacklist esplicita vince sempre: e' l'ultima parola della ricerca clinica.
  for (const id of block.exercise_ids ?? []) {
    if (HAYSTACK.has(id)) ids.add(id);
  }

  return [...ids].sort();
}

const GROUP_MAP = {
  musculoskeletal: 'musculoskeletal',
  cardiometabolic: 'cardiometabolic',
  special_population: 'life_stage',
  accessibility: 'accessibility',
};

/**
 * Traduce i parametri clinici in vincoli che il motore sa applicare.
 * Il criterio e' sempre il piu' restrittivo, come prescrive la sezione
 * "resolution" della ricerca.
 */
function toAdapt(condition) {
  const p = condition.parameters ?? {};
  const adapt = {};

  if (Array.isArray(p.rep_range)) adapt.minReps = p.rep_range[0];
  if (Array.isArray(p.rest_sec)) adapt.minRestSec = p.rest_sec[0];
  if (Array.isArray(p.load_pct_1rm)) {
    const cap = p.load_pct_1rm[1];
    adapt.maxPercent1rm = cap;
    // Meno carico ammesso significa stare piu' lontani dal cedimento.
    adapt.minRir = cap <= 60 ? 4 : cap <= 75 ? 3 : 2;
  } else {
    adapt.minRir = 2;
  }

  // Dove serve il parere di un medico si sta comunque lontani dal cedimento,
  // qualunque sia il tetto di carico indicato.
  if (condition.requires_medical_clearance) adapt.minRir = Math.max(adapt.minRir ?? 0, 3);
  if (condition.prefer?.equipment?.includes('machine')) adapt.preferMachines = true;
  if (condition.exclude?.movement_patterns?.includes('valsalva_maximal')) adapt.avoidValsalva = true;
  if (condition.warn?.movement_patterns?.includes('valsalva_maximal')) adapt.avoidValsalva = true;
  if (condition.default_severity === 'hard_block' || condition.requires_medical_clearance) {
    adapt.reduceVolume = true;
  }
  return adapt;
}

function severityOf(condition) {
  if (condition.requires_medical_clearance) return 'medical_clearance';
  if (condition.default_severity === 'hard_block') return 'block';
  return 'caution';
}

/**
 * Alcune condizioni ereditano da un'altra e ne ridefiniscono solo alcuni blocchi
 * (il diabete di tipo 2 dal tipo 1, il terzo trimestre dal secondo). L'ereditarieta'
 * va risolta prima di espandere le regole, altrimenti quelle condizioni resterebbero vuote.
 */
function resolveInheritance(id, seen = new Set()) {
  const condition = RULES.conditions[id];
  if (!condition) return null;
  if (!condition.inherits_from || seen.has(id)) return condition;
  seen.add(id);

  const parent = resolveInheritance(condition.inherits_from, seen);
  if (!parent) return condition;

  const overrides = condition.overrides ?? {};
  return {
    ...parent,
    ...condition,
    exclude: overrides.exclude ?? parent.exclude,
    warn: overrides.warn ?? parent.warn,
    prefer: overrides.prefer ?? parent.prefer,
    parameters: { ...parent.parameters, ...(overrides.parameters ?? {}) },
    adaptation_notes_it: [
      ...(overrides.note_it ? [overrides.note_it] : []),
      ...(condition.adaptation_notes_it ?? parent.adaptation_notes_it ?? []),
    ],
    red_flags_it: condition.red_flags_it ?? parent.red_flags_it ?? [],
  };
}

const out = [];
for (const [id, raw] of Object.entries(RULES.conditions)) {
  const condition = resolveInheritance(id);
  const blocked = resolveBlock(condition.exclude);
  const warned = resolveBlock(condition.warn).filter((x) => !blocked.includes(x));

  out.push({
    id,
    label: raw.label_it,
    shortLabel: '',
    aliases: raw.aliases_it ?? [],
    group: GROUP_MAP[raw.group] ?? 'other',
    severity: severityOf(condition),
    requiresMedicalClearance: Boolean(condition.requires_medical_clearance),
    summary: (raw.onboarding_questions_it ?? [])[0] ?? '',
    notes: condition.adaptation_notes_it ?? [],
    redFlags: condition.red_flags_it ?? [],
    blockedExerciseIds: blocked,
    warnExerciseIds: warned,
    adapt: toAdapt(condition),
    sources: (condition.sources ?? []).slice(0, 4),
  });
}

/**
 * Etichette brevi per i chip di selezione.
 *
 * Le etichette cliniche sono descrittive ("Spalla: cuffia dei rotatori e
 * impingement subacromiale"). Tagliare ai due punti le accorcia, ma tre
 * condizioni del ginocchio diventerebbero tre chip identici: inutilizzabile.
 * Quindi il taglio si accorcia solo finche' resta distinguibile.
 */
function assignShortLabels(conditions) {
  const prefixOf = (label) => {
    const beforeColon = label.split(/[:(]/)[0].trim();
    // Si taglia alla virgola solo se l'etichetta e' troppo lunga per un chip:
    // "Artrosi di anca, ginocchio e mano" ci sta, e amputarla la renderebbe
    // meno precisa senza guadagnare nulla.
    if (beforeColon.length <= 34) return beforeColon;
    return beforeColon.split(',')[0].trim();
  };
  const counts = new Map();
  for (const c of conditions) {
    const prefix = prefixOf(c.label);
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }

  for (const c of conditions) {
    const prefix = prefixOf(c.label);
    if (counts.get(prefix) === 1) {
      c.shortLabel = prefix;
      continue;
    }
    // Prefisso ambiguo: si tiene anche la parte che distingue, ridotta
    // alle prime parole significative.
    const rest = c.label.slice(prefix.length).replace(/^[:,(\s]+/, '');
    const words = rest.split(/\s+/).filter((w) => !/^(e|di|del|della|dei|delle|da|il|la|lo)$/i.test(w));
    c.shortLabel = `${prefix}: ${words.slice(0, 2).join(' ')}`.replace(/[),.]+$/, '');
  }
}

assignShortLabels(out);
out.sort((a, b) => a.label.localeCompare(b.label, 'it'));

// Gli identificativi diventano indici nel catalogo ordinato: stessa informazione,
// un quinto dello spazio nel pacchetto scaricato dall'utente.
const INDEX_OF = new Map(CATALOG.map((e, i) => [e.id, i]));
const toIndices = (ids) => ids.map((id) => INDEX_OF.get(id)).filter((i) => i !== undefined).sort((a, b) => a - b);

const packed = out.map((c) => ({
  ...c,
  blockedExerciseIds: undefined,
  warnExerciseIds: undefined,
  blocked: toIndices(c.blockedExerciseIds),
  warn: toIndices(c.warnExerciseIds),
}));

writeFileSync(OUT, JSON.stringify(packed, (key, value) => (value === undefined ? undefined : value)));

const size = Math.round(readFileSync(OUT, 'utf8').length / 1024);
console.log(`Condizioni: ${out.length}, file ${size} KB`);
for (const c of out) {
  const flag = c.severity === 'medical_clearance' ? '[medico]' : c.severity === 'block' ? '[blocco] ' : '[avviso] ';
  console.log(`  ${flag} ${c.label.padEnd(38)} esclusi ${String(c.blockedExerciseIds.length).padStart(3)}  avvisi ${String(c.warnExerciseIds.length).padStart(3)}`);
}
