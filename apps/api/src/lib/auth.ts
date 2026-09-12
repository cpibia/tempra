import { SignJWT, jwtVerify } from 'jose';
import type { Context, MiddlewareHandler } from 'hono';
import { env } from './env';

const secret = new TextEncoder().encode(env.jwtSecret);

export interface TokenPayload {
  sub: string;
  email: string;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('tempra')
    .setAudience('tempra-app')
    .setExpirationTime(`${env.accessTokenTtlSec}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'tempra',
      audience: 'tempra-app',
    });
    if (!payload.sub) return null;
    return { sub: payload.sub, email: String(payload.email ?? '') };
  } catch {
    return null;
  }
}

export type AuthedContext = { Variables: { user: TokenPayload } };

/** Protegge le rotte che toccano i dati di un utente. */
export const requireAuth: MiddlewareHandler<AuthedContext> = async (c, next) => {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return c.json({ error: 'Autenticazione richiesta' }, 401);
  }
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return c.json({ error: 'Sessione scaduta o non valida' }, 401);
  }
  c.set('user', payload);
  await next();
  return undefined;
};

/** Indirizzo del chiamante, tenendo conto del proxy che sta davanti al servizio. */
export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'unknown';
}
