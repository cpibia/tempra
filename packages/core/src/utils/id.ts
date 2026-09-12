/** Identificativi ordinabili nel tempo: utile per la sincronizzazione e per lo storico. */
export function createId(prefix = ''): string {
  const time = Date.now().toString(36).padStart(9, '0');
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const random = Array.from(rand, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  return `${prefix}${prefix ? '_' : ''}${time}${random}`;
}

export const nowIso = (): string => new Date().toISOString();
