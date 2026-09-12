// Costruisce il catalogo esercizi normalizzato a partire da free-exercise-db.
// Aggiunge i campi derivati usati dal motore di generazione e dai filtri sanitari,
// e applica le traduzioni italiane se presenti in data/translations/*.json.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  derivePattern, deriveLoadType, deriveUnilateral, deriveImpact,
  deriveAxialLoad, derivePriority, deriveDefaultRest, deriveHomeFriendly,
} from './lib/derive.mjs';
import { MUSCLE_GROUP } from './lib/taxonomy.mjs';

const ROOT = process.cwd();
const SRC = join(ROOT, 'db-exercise/dist/exercises.json');
const IMG_DIR = join(ROOT, 'apps/web/public/img/ex');
const TRANS_DIR = join(ROOT, 'data/translations');
const OUT_DIR = join(ROOT, 'packages/core/src/data');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function loadTranslations() {
  const map = {};
  if (!existsSync(TRANS_DIR)) return map;
  for (const f of readdirSync(TRANS_DIR).filter((f) => f.endsWith('.json'))) {
    try {
      Object.assign(map, JSON.parse(readFileSync(join(TRANS_DIR, f), 'utf8')));
    } catch (error) {
      // Un file ancora in scrittura o malformato non deve bloccare la build:
      // quegli esercizi restano in inglese e si rigenera quando e' pronto.
      console.warn(`ATTENZIONE: ${f} non e' JSON valido, ignorato (${error.message})`);
    }
  }
  return map;
}

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const translations = loadTranslations();
let translated = 0;

const catalog = raw.map((ex) => {
  const t = translations[ex.id];
  if (t?.name) translated++;
  const hasImages = existsSync(join(IMG_DIR, ex.id, '0.webp'));
  const frames = hasImages
    ? (ex.images || []).filter((_, i) => existsSync(join(IMG_DIR, ex.id, `${i}.webp`)))
    : [];

  const primaryMuscles = ex.primaryMuscles || [];
  const secondaryMuscles = ex.secondaryMuscles || [];

  return {
    id: ex.id,
    slug: slugify(t?.name || ex.name),
    name: t?.name || ex.name,
    nameEn: ex.name,
    aliases: t?.aliases || [],
    force: ex.force ?? null,
    level: ex.level,
    mechanic: ex.mechanic ?? null,
    equipment: ex.equipment ?? null,
    category: ex.category,
    primaryMuscles,
    secondaryMuscles,
    muscleGroups: [...new Set(primaryMuscles.map((m) => MUSCLE_GROUP[m]).filter(Boolean))],
    secondaryGroups: [...new Set(secondaryMuscles.map((m) => MUSCLE_GROUP[m]).filter(Boolean))],
    pattern: derivePattern(ex),
    loadType: deriveLoadType(ex),
    unilateral: deriveUnilateral(ex),
    impact: deriveImpact(ex),
    axialLoad: deriveAxialLoad(ex),
    homeFriendly: deriveHomeFriendly(ex),
    priority: derivePriority(ex),
    defaultRestSec: deriveDefaultRest(ex),
    frameCount: frames.length,
    translated: Boolean(t?.name),
  };
});

catalog.sort((a, b) => a.name.localeCompare(b.name, 'it'));

// Le istruzioni pesano quanto tutto il resto del catalogo messo insieme e servono
// soltanto nella pagina di dettaglio: vanno in un file a parte, caricato a richiesta.
const instructions = {};
for (const ex of raw) {
  const t = translations[ex.id];
  instructions[ex.id] = t?.instructions?.length ? t.instructions : ex.instructions || [];
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'exercises.json'), JSON.stringify(catalog));
writeFileSync(join(OUT_DIR, 'instructions.json'), JSON.stringify(instructions));

const stats = (key) =>
  Object.entries(catalog.reduce((acc, e) => {
    const v = Array.isArray(e[key]) ? e[key].join('|') : String(e[key]);
    acc[v] = (acc[v] || 0) + 1; return acc;
  }, {})).sort((a, b) => b[1] - a[1]);

const kb = (f) => Math.round(readFileSync(join(OUT_DIR, f), 'utf8').length / 1024);
console.log(`Catalogo: ${catalog.length} esercizi, ${translated} tradotti, ${catalog.filter((e) => e.frameCount).length} con immagini`);
console.log(`Peso: exercises.json ${kb('exercises.json')} KB, instructions.json ${kb('instructions.json')} KB`);
console.log('loadType  :', stats('loadType').map(([k, v]) => `${k}=${v}`).join('  '));
console.log('pattern   :', stats('pattern').map(([k, v]) => `${k}=${v}`).join('  '));
console.log('impact    :', stats('impact').map(([k, v]) => `${k}=${v}`).join('  '));
console.log('axialLoad :', stats('axialLoad').map(([k, v]) => `${k}=${v}`).join('  '));
console.log('home      :', stats('homeFriendly').map(([k, v]) => `${k}=${v}`).join('  '));
