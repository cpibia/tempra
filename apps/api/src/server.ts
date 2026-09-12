import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { HTTPException } from 'hono/http-exception';
import { env, isProduction } from './lib/env';
import { closeDb, pingDb } from './db/client';
import { pruneRateLimits } from './lib/rate-limit';
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';

const app = new Hono();

app.use('*', logger());
// L'API restituisce soltanto JSON: nessuna risorsa deve poter essere caricata
// a partire dalle sue risposte, e nessuna pagina deve poterla incorniciare.
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
  },
  crossOriginResourcePolicy: 'same-site',
  referrerPolicy: 'no-referrer',
}));
app.use('*', compress());

app.use('/api/*', cors({
  origin: env.allowedOrigins,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86_400,
  credentials: false,
}));

/** Sonda di stato per Coolify e per i controlli del container. */
app.get('/health', async (c) => {
  const database = await pingDb();
  return c.json({ status: database ? 'ok' : 'degraded', database }, database ? 200 : 503);
});

app.route('/api/auth', authRoutes);
app.route('/api/sync', syncRoutes);

app.notFound((c) => c.json({ error: 'Risorsa non trovata' }, 404));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  // In produzione non si espone il dettaglio interno al chiamante.
  console.error('Errore non gestito:', error);
  return c.json(
    { error: isProduction ? 'Errore interno del server' : String(error) },
    500,
  );
});

const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`API Tempra in ascolto sulla porta ${info.port} (${env.nodeEnv})`);
});

// Pulizia periodica dei contatori scaduti della limitazione richieste.
const cleanup = setInterval(() => {
  void pruneRateLimits().catch((error) => console.error('Pulizia fallita:', error));
}, 30 * 60 * 1000);

async function shutdown(signal: string): Promise<void> {
  console.log(`Ricevuto ${signal}, chiusura in corso`);
  clearInterval(cleanup);
  server.close();
  await closeDb();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app };
