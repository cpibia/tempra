import { sql, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';

/**
 * Limitazione delle richieste tenuta in database invece che in memoria:
 * su Coolify il servizio puo' essere riavviato o replicato, e un contatore
 * in memoria si azzererebbe a ogni deploy, proprio quando serve di piu'.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSec * 1000);

  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`case when ${schema.rateLimits.windowStart} < ${windowStart.toISOString()}
                        then 1
                        else ${schema.rateLimits.count} + 1 end`,
        windowStart: sql`case when ${schema.rateLimits.windowStart} < ${windowStart.toISOString()}
                              then ${now.toISOString()}
                              else ${schema.rateLimits.windowStart} end`,
      },
    })
    .returning();

  const count = row?.count ?? 1;
  const start = row?.windowStart ?? now;
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, windowSec - elapsed),
  };
}

/** Rimuove i contatori scaduti: senza, la tabella crescerebbe senza limite. */
export async function pruneRateLimits(olderThanSec = 3600): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanSec * 1000);
  await db.delete(schema.rateLimits).where(sql`${schema.rateLimits.windowStart} < ${cutoff.toISOString()}`);
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, key));
}
