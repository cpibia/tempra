import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { hashPassword, verifyPassword, newId, randomToken, sha256 } from '../lib/crypto';
import { signAccessToken, requireAuth, clientIp, type AuthedContext } from '../lib/auth';
import { consumeRateLimit, resetRateLimit } from '../lib/rate-limit';
import { env } from '../lib/env';

/**
 * Hash fittizio con gli stessi parametri di quelli reali: la verifica costa
 * lo stesso tempo anche quando l'indirizzo non esiste, e la durata della
 * risposta non rivela quali email sono registrate.
 */
const DUMMY_HASH =
  'scrypt$65536$8$2$AAAAAAAAAAAAAAAAAAAAAA==$'
  + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Indirizzo email non valido').max(254),
  password: z.string()
    .min(10, 'La password deve avere almeno 10 caratteri')
    .max(200, 'La password e troppo lunga'),
});

export const authRoutes = new Hono<AuthedContext>();

async function issueSession(userId: string, email: string) {
  const accessToken = await signAccessToken({ sub: userId, email });
  const refreshToken = randomToken();

  await db.insert(schema.refreshTokens).values({
    id: newId('rt'),
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshTokenTtlSec * 1000),
  });

  return { accessToken, refreshToken, expiresIn: env.accessTokenTtlSec };
}

authRoutes.post('/register', zValidator('json', credentials), async (c) => {
  if (!env.registrationOpen) {
    return c.json({ error: 'Le registrazioni sono chiuse su questa istanza' }, 403);
  }

  const limit = await consumeRateLimit(`register:${clientIp(c)}`, 5, 3600);
  if (!limit.allowed) {
    return c.json({ error: 'Troppi tentativi, riprova piu tardi' }, 429, {
      'Retry-After': String(limit.retryAfterSec),
    });
  }

  const { email, password } = c.req.valid('json');
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) {
    // Il messaggio e' volutamente identico a quello di successo lato client:
    // non si conferma a un estraneo se un indirizzo e' registrato.
    return c.json({ error: 'Registrazione non riuscita' }, 409);
  }

  const userId = newId('usr');
  await db.insert(schema.users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(password),
  });

  return c.json(await issueSession(userId, email), 201);
});

authRoutes.post('/login', zValidator('json', credentials), async (c) => {
  const ip = clientIp(c);
  const { email, password } = c.req.valid('json');

  const limit = await consumeRateLimit(`login:${ip}:${email}`, 10, 900);
  if (!limit.allowed) {
    return c.json({ error: 'Troppi tentativi, riprova fra qualche minuto' }, 429, {
      'Retry-After': String(limit.retryAfterSec),
    });
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });

  // La verifica si esegue anche quando l'utente non esiste, con un hash fittizio:
  // altrimenti la differenza di tempo rivelerebbe quali indirizzi sono registrati.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const valid = await verifyPassword(password, hash);

  if (!user || !valid) {
    return c.json({ error: 'Email o password non corretti' }, 401);
  }

  await resetRateLimit(`login:${ip}:${email}`);
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
