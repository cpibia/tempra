import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { requireAuth, type AuthedContext } from '../lib/auth';

/**
 * Sincronizzazione.
 *
 * Il modello e' volutamente semplice: ogni documento porta con se' la data di
 * modifica decisa dal client, e in caso di conflitto vince la scrittura piu'
 * recente. Per dati di allenamento e' la scelta corretta: i documenti sono
 * piccoli, appartengono a una sola persona e vengono modificati da un
 * dispositivo alla volta. Una fusione a tre vie costerebbe molta complessita'
 * per risolvere un conflitto che in pratica non si verifica.
 *
 * Il client resta la fonte di verita': il server non convalida il contenuto dei
 * documenti oltre alla dimensione, e non li interpreta mai.
 */

const KINDS = ['profile', 'plan', 'session', 'record', 'measurement', 'settings'] as const;

const documentSchema = z.object({
  id: z.string().min(1).max(128),
  kind: z.enum(KINDS),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullish(),
  payload: z.unknown(),
});

const pushSchema = z.object({
  documents: z.array(documentSchema).max(500),
});

const MAX_PAYLOAD_BYTES = 512 * 1024;

export const syncRoutes = new Hono<AuthedContext>();

syncRoutes.use('*', requireAuth);

/**
 * Scarica tutto cio' che e' cambiato sul server dopo un certo istante.
 * Il cursore e' la data di scrittura lato server, non quella del client:
 * usare l'orologio del dispositivo farebbe perdere modifiche a chi ha
 * l'ora sbagliata.
 */
syncRoutes.get('/pull', zValidator('query', z.object({
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
})), async (c) => {
  const user = c.get('user');
  const { since, limit = 500 } = c.req.valid('query');

  const conditions = [eq(schema.documents.userId, user.sub)];
  if (since) conditions.push(gt(schema.documents.syncedAt, new Date(since)));

  const rows = await db
    .select()
    .from(schema.documents)
    .where(and(...conditions))
    .orderBy(schema.documents.syncedAt)
    .limit(limit);

  const cursor = rows.length ? rows[rows.length - 1]!.syncedAt.toISOString() : since ?? null;

  return c.json({
    documents: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      payload: row.payload,
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
    })),
    cursor,
    hasMore: rows.length === limit,
    serverTime: new Date().toISOString(),
  });
});

/**
 * Invia le modifiche locali. Una scrittura viene applicata solo se e' piu'
 * recente di quella gia' presente: cosi' un client rimasto indietro non
 * sovrascrive il lavoro fatto altrove quando torna online.
 */
syncRoutes.post('/push', zValidator('json', pushSchema), async (c) => {
  const user = c.get('user');
  const { documents } = c.req.valid('json');

  const tooBig = documents.find((d) => JSON.stringify(d.payload ?? null).length > MAX_PAYLOAD_BYTES);
  if (tooBig) {
    return c.json({ error: `Documento troppo grande: ${tooBig.id}` }, 413);
  }

  let applied = 0;
  const skipped: string[] = [];

  await db.transaction(async (tx) => {
    for (const doc of documents) {
      const result = await tx
        .insert(schema.documents)
        .values({
          id: doc.id,
          userId: user.sub,
          kind: doc.kind,
          payload: doc.payload ?? {},
          updatedAt: new Date(doc.updatedAt),
          deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.documents.userId, schema.documents.id],
          set: {
            payload: sql`excluded.payload`,
            kind: sql`excluded.kind`,
            updatedAt: sql`excluded.updated_at`,
            deletedAt: sql`excluded.deleted_at`,
            syncedAt: sql`excluded.synced_at`,
          },
          where: sql`${schema.documents.updatedAt} < excluded.updated_at`,
        })
        .returning({ id: schema.documents.id });

      if (result.length) applied += 1;
      else skipped.push(doc.id);
    }
  });

  return c.json({
    applied,
    // I documenti saltati sono piu' vecchi della copia sul server: il client
    // li aggiornera' al prossimo pull invece di insistere.
    skipped,
    serverTime: new Date().toISOString(),
  });
});

/** Quanto occupa l'account, utile per mostrarlo nelle impostazioni. */
syncRoutes.get('/status', async (c) => {
  const user = c.get('user');
  const [stats] = await db
    .select({
      documents: sql<number>`count(*)::int`,
      lastSync: sql<string | null>`max(${schema.documents.syncedAt})`,
      bytes: sql<number>`coalesce(sum(pg_column_size(${schema.documents.payload})), 0)::int`,
    })
    .from(schema.documents)
    .where(eq(schema.documents.userId, user.sub));

  return c.json({
    documents: stats?.documents ?? 0,
    lastSync: stats?.lastSync ?? null,
    approximateBytes: stats?.bytes ?? 0,
  });
});
