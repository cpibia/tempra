import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Applica le migrazioni all'avvio del container.
 * Si usa una connessione singola e dedicata: le migrazioni prendono lock sulle
 * tabelle e non devono competere con il pool applicativo.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Variabile d'ambiente mancante: DATABASE_URL");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(here, '../../drizzle');

const client = postgres(url, { max: 1, onnotice: () => {} });

try {
  await migrate(drizzle(client), { migrationsFolder });
  console.log('Migrazioni applicate.');
} catch (error) {
  console.error('Migrazioni fallite:', error);
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
