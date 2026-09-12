import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env, isProduction } from '../lib/env';
import * as schema from './schema';

const client = postgres(env.databaseUrl, {
  max: isProduction ? 10 : 3,
  idle_timeout: 30,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });
export { schema };

export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}

export async function pingDb(): Promise<boolean> {
  try {
    await client`select 1`;
    return true;
  } catch {
    return false;
  }
}
