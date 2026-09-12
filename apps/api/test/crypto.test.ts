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
