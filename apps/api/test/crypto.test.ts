import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, sha256, randomToken, newId } from '../src/lib/crypto';

describe('hash delle password', () => {
  it('produce un hash verificabile', async () => {
    const hash = await hashPassword('passwordlunga123');
    expect(await verifyPassword('passwordlunga123', hash)).toBe(true);
  });

  it('rifiuta la password sbagliata', async () => {
    const hash = await hashPassword('passwordlunga123');
    expect(await verifyPassword('passwordsbagliata', hash)).toBe(false);
  });

  it('usa un sale diverso ogni volta', async () => {
    const a = await hashPassword('stessapassword123');
    const b = await hashPassword('stessapassword123');
    expect(a).not.toBe(b);
  });

  it('resta entro il limite di memoria di Node', async () => {
    // Senza maxmem esplicito scrypt fallisce con ERR_CRYPTO_INVALID_SCRYPT_PARAMS:
    // il limite predefinito e' 32 MB e qualunque parametro serio lo supera.
    await expect(hashPassword('unapasswordqualsiasi')).resolves.toMatch(/^scrypt\$/);
  });

  it('verifica anche l hash fittizio usato per gli utenti inesistenti', async () => {
    const dummy = 'scrypt$65536$8$2$AAAAAAAAAAAAAAAAAAAAAA==$'
      + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    await expect(verifyPassword('qualsiasi', dummy)).resolves.toBe(false);
  });

  it('rifiuta hash malformati senza sollevare eccezioni', async () => {
    expect(await verifyPassword('x', 'non-un-hash')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$1$2$3$4$5')).toBe(false);
  });
});

describe('identificativi e token', () => {
  it('genera token diversi', () => {
    expect(randomToken()).not.toBe(randomToken());
  });

  it('genera identificativi con il prefisso richiesto', () => {
    expect(newId('usr')).toMatch(/^usr_[\w-]+$/);
  });

  it('calcola un hash stabile', () => {
    expect(sha256('tempra')).toBe(sha256('tempra'));
    expect(sha256('tempra')).toHaveLength(64);
  });
});

describe('limite di calcoli in parallelo', () => {
  it('serve tutte le richieste anche quando arrivano insieme', async () => {
    // Senza il semaforo dieci accessi contemporanei occuperebbero 640 MiB.
    // Con il semaforo si accodano: devono comunque completare tutti.
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) => hashPassword(`password-numero-${i}`)),
    );
    expect(new Set(results).size).toBe(6);
    expect(results.every((hash) => hash.startsWith('scrypt$'))).toBe(true);
  });

  it('rifiuta hash con parametri fuori scala senza calcolarli', async () => {
    // Un hash manomesso con N enorme sarebbe un modo per esaurire la memoria.
    const malicious = 'scrypt$1073741824$8$2$AAAAAAAAAAAAAAAAAAAAAA==$AAAA';
    const start = Date.now();
    expect(await verifyPassword('qualsiasi', malicious)).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
