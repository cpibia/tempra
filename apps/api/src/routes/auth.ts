import { randomInt } from 'node:crypto';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { newId, randomToken, sha256 } from '../lib/crypto';
import { signAccessToken, requireAuth, clientIp, type AuthedContext } from '../lib/auth';
import { consumeRateLimit } from '../lib/rate-limit';
import { env } from '../lib/env';

/**
 * Codice di sincronizzazione: otto caratteri scritti a mano su un telefono,
 * quindi senza 0/O e 1/I/L. Con 31 simboli fanno circa 8,5 * 10^11 combinazioni:
 * insieme al limite di tentativi per indirizzo, indovinarne uno non e' praticabile.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

const codeSchema = z.object({
  code: z.string()
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .pipe(z.string().length(CODE_LENGTH, 'Il codice ha 8 caratteri')),
});

function generateCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

export const authRoutes = new Hono<AuthedContext>();

async function issueSession(userId: string, email: string | null) {
  const accessToken = await signAccessToken({ sub: userId, email: email ?? '' });
  const refreshToken = randomToken();

  await db.insert(schema.refreshTokens).values({
    id: newId('rt'),
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshTokenTtlSec * 1000),
  });

  return { accessToken, refreshToken, expiresIn: env.accessTokenTtlSec };
}

/** Crea un nuovo spazio dati e restituisce il codice per collegarci altri dispositivi. */
authRoutes.post('/sync-code', async (c) => {
  if (!env.registrationOpen) {
    return c.json({ error: 'La creazione di nuovi codici e chiusa su questa istanza' }, 403);
  }

  const limit = await consumeRateLimit(`sync-code:${clientIp(c)}`, 5, 3600);
  if (!limit.allowed) {
    return c.json({ error: 'Troppi tentativi, riprova piu tardi' }, 429, {
      'Retry-After': String(limit.retryAfterSec),
    });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const userId = newId('usr');
    const inserted = await db.insert(schema.users)
      .values({ id: userId, syncCodeHash: sha256(code) })
      .onConflictDoNothing()
      .returning({ id: schema.users.id });
    if (inserted.length) {
      return c.json({ code, ...(await issueSession(userId, null)) }, 201);
    }
  }

  return c.json({ error: 'Nessun codice libero, riprova' }, 503);
});

/** Collega questo dispositivo ai dati di un codice esistente. */
authRoutes.post('/sync-code/join', zValidator('json', codeSchema), async (c) => {
  const ip = clientIp(c);
  const limit = await consumeRateLimit(`sync-join:${ip}`, 10, 900);
  if (!limit.allowed) {
    return c.json({ error: 'Troppi tentativi, riprova fra qualche minuto' }, 429, {
      'Retry-After': String(limit.retryAfterSec),
    });
  }

  const { code } = c.req.valid('json');
  const user = await db.query.users.findFirst({ where: eq(schema.users.syncCodeHash, sha256(code)) });
  if (!user) {
    return c.json({ error: 'Codice non trovato. Controlla di averlo scritto bene.' }, 404);
  }

  await db.update(schema.users).set({ lastSeenAt: new Date() }).where(eq(schema.users.id, user.id));
  return c.json(await issueSession(user.id, user.email));
});

authRoutes.post('/refresh', zValidator('json', z.object({ refreshToken: z.string().min(10) })), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const tokenHash = sha256(refreshToken);

  const stored = await db.query.refreshTokens.findFirst({
    where: and(
      eq(schema.refreshTokens.tokenHash, tokenHash),
      isNull(schema.refreshTokens.revokedAt),
      gt(schema.refreshTokens.expiresAt, new Date()),
    ),
  });

  if (!stored) {
    return c.json({ error: 'Sessione non valida, occorre accedere di nuovo' }, 401);
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, stored.userId) });
  if (!user) {
    return c.json({ error: 'Sessione non valida, occorre accedere di nuovo' }, 401);
  }

  // Rotazione: il token usato viene ritirato e se ne emette uno nuovo,
  // cosi' un token rubato ha una finestra d'uso molto stretta.
  await db.update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, stored.id));

  return c.json(await issueSession(user.id, user.email));
});

authRoutes.post('/logout', zValidator('json', z.object({ refreshToken: z.string().optional() })), async (c) => {
  const { refreshToken } = c.req.valid('json');
  if (refreshToken) {
    await db.update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.tokenHash, sha256(refreshToken)));
  }
  return c.json({ ok: true });
});

/**
 * Il token e' firmato e valido fino alla scadenza, ma questo non basta:
 * un account cancellato deve risultare inesistente subito, non entro i
 * quindici minuti di vita del token. Qui la verifica sul database si paga
 * volentieri, perche' l'endpoint viene chiamato di rado.
 */
authRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.id, user.sub),
    columns: { id: true, email: true, createdAt: true },
  });

  if (!existing) {
    return c.json({ error: 'Account non piu esistente' }, 401);
  }

  return c.json({ id: existing.id, email: existing.email, createdAt: existing.createdAt });
});

authRoutes.delete('/me', requireAuth, async (c) => {
  const user = c.get('user');
  // La cancellazione a cascata porta via documenti e sessioni: nessun residuo.
  await db.delete(schema.users).where(eq(schema.users.id, user.sub));
  return c.json({ ok: true });
});
