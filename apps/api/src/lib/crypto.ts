import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

interface ScryptOptions { N: number; r: number; p: number; maxmem: number }

const scryptAsync = promisify(scrypt) as (
  password: string, salt: Buffer, keylen: number, options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Hash delle password con scrypt, che fa parte della libreria standard di Node.
 * Nessuna dipendenza nativa da compilare nell'immagine, nessun modulo da
 * aggiornare quando cambia la versione di Node.
 *
 * Parametri: N = 2^16, r = 8, p = 2. E' una delle configurazioni raccomandate
 * da OWASP e costa circa 64 MB per calcolo, contro i 128 MB della variante
 * N = 2^17: su un piccolo server la differenza conta quando arrivano piu'
 * accessi insieme.
 *
 * maxmem va sempre indicato: il limite predefinito di Node e' 32 MB e
 * qualunque parametro serio lo supera, facendo fallire l'hash a runtime.
 */
const PARAMS = { N: 65_536, r: 8, p: 2 };
const KEY_LENGTH = 64;
const MAX_MEM = 256 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM });
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, 'base64');
  const expected = Buffer.from(hashB64!, 'base64');

  const derived = await scryptAsync(password, salt, expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEM,
  });

  // Confronto a tempo costante: la durata della verifica non deve dire nulla.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const randomToken = (): string => randomBytes(32).toString('base64url');

export const newId = (prefix: string): string =>
  `${prefix}_${randomBytes(12).toString('base64url')}`;
