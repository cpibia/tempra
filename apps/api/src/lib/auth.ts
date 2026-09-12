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

/**
 * Indirizzo del chiamante.
 *
 * X-Forwarded-For e' un'intestazione che chiunque puo' scrivere: prendere il
 * primo valore significa lasciare che sia il client a dichiarare il proprio
 * indirizzo, e quindi rendere aggirabile qualunque limite basato su di esso.
 * Ogni proxy AGGIUNGE in coda l'indirizzo da cui ha ricevuto la connessione,
 * quindi con N proxy fidati il valore attendibile e' l'N-esimo da destra.
 */
export function clientIp(c: Context): string {
  const hops = env.trustedProxyHops;

  if (hops > 0) {
    const forwarded = c.req.header('x-forwarded-for');
    if (forwarded) {
      const chain = forwarded.split(',').map((value) => value.trim()).filter(Boolean);
      const candidate = chain[chain.length - hops];
      if (candidate) return normalizeIp(candidate);
    }
  }

  const socket = (c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined)
    ?.incoming?.socket?.remoteAddress;
  return normalizeIp(socket ?? 'unknown');
}

/** Taglia il valore a una lunghezza ragionevole: e' pur sempre input esterno. */
function normalizeIp(value: string): string {
  return value.slice(0, 45);
}
