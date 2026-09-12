import { pgTable, text, timestamp, jsonb, uniqueIndex, index, integer } from 'drizzle-orm/pg-core';

/**
 * Modello dati della sincronizzazione.
 *
 * Il server non conosce la forma dei documenti dell'applicazione: li tratta come
 * contenuti opachi con un identificativo, un tipo e una data di modifica.
 * La scelta e' deliberata. Tempra e' local-first: la fonte di verita' e' il
 * dispositivo, il server e' una copia di sicurezza opzionale. Tenere lo schema
 * di dominio fuori dal database significa che una nuova versione del client puo'
 * cambiare la struttura di una scheda senza una migrazione lato server.
 */

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email),
]);

export const documents = pgTable('documents', {
  /** Identificativo generato dal client: consente di riconciliare senza chiedere al server. */
  id: text('id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  payload: jsonb('payload').notNull(),
  /** Data di modifica dichiarata dal client, usata per risolvere i conflitti. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  /** Data di scrittura sul server, usata per la sincronizzazione incrementale. */
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('documents_user_id_unique').on(table.userId, table.id),
  index('documents_sync_idx').on(table.userId, table.syncedAt),
]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('refresh_tokens_user_idx').on(table.userId),
]);

/** Limitazione delle richieste per indirizzo, tenuta in database per reggere piu' istanze. */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});
