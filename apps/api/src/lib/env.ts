/**
 * Configurazione applicativa.
 * Il processo si rifiuta di partire se manca un segreto: meglio un errore
 * chiaro all'avvio che un'applicazione che gira con una chiave prevedibile.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile d'ambiente mancante: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '3000')),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  /** Origini ammesse per la PWA, separate da virgola. */
  allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  accessTokenTtlSec: Number(optional('ACCESS_TOKEN_TTL_SEC', '900')),
  refreshTokenTtlSec: Number(optional('REFRESH_TOKEN_TTL_SEC', String(60 * 60 * 24 * 60))),
  /** Disattiva la registrazione di nuovi account: utile su istanze personali. */
  registrationOpen: optional('REGISTRATION_OPEN', 'true') === 'true',
};

export const isProduction = env.nodeEnv === 'production';
