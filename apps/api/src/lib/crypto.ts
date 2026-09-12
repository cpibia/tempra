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

/**
 * Semaforo sui calcoli di hash.
 *
 * Ogni scrypt con questi parametri occupa 64 MiB e un thread del pool di Node.
 * Senza limite, poche decine di richieste di accesso in parallelo esauriscono
 * la memoria di un VPS piccolo: le richieste in eccesso si mettono in coda
 * invece di far cadere il servizio.
 */
// Letto direttamente dall'ambiente e non dal modulo di configurazione:
// questo file non deve dipendere dalla presenza di un database.
const MAX_CONCURRENT = Math.max(1, Number(process.env.MAX_CONCURRENT_HASHES ?? '2'));

let running = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await withSlot(() =>
    scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM }));
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, 'base64');
  const expected = Buffer.from(hashB64!, 'base64');

  // Parametri fuori scala nell'hash memorizzato significano dato corrotto:
  // eseguirli comunque sarebbe un modo per far esaurire la memoria al server.
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(params.N) || params.N > 262_144
      || !Number.isInteger(params.r) || params.r > 16
      || !Number.isInteger(params.p) || params.p > 8) {
    return false;
  }

  const derived = await withSlot(() =>
    scryptAsync(password, salt, expected.length, { ...params, maxmem: MAX_MEM }));

  // Confronto a tempo costante: la durata della verifica non deve dire nulla.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const randomToken = (): string => randomBytes(32).toString('base64url');

export const newId = (prefix: string): string =>
  `${prefix}_${randomBytes(12).toString('base64url')}`;
