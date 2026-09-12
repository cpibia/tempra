/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

/**
 * Strategia di cache.
 *
 * Il guscio dell'applicazione e il catalogo esercizi entrano nel precache:
 * dopo la prima visita l'app si apre senza rete, che e' il requisito numero uno
 * di una app da palestra (spesso interrato, spesso senza segnale).
 *
 * Le immagini degli esercizi pesano 26 MB in totale: precaricarle tutte
 * sarebbe uno spreco. Vengono messe in cache mano a mano che si incontrano,
 * quindi dopo il primo allenamento gli esercizi della propria scheda sono
 * disponibili offline.
 */

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Navigazione: si serve sempre il guscio, il routing e' lato client.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.pathname.startsWith('/img/ex/'),
  new CacheFirst({
    cacheName: 'tempra-exercise-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 900, maxAgeSeconds: 60 * 60 * 24 * 180, purgeOnQuotaError: true }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'tempra-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

/**
 * Le risposte dell'API non vengono mai messe in cache.
 *
 * Sembrerebbe un'ottimizzazione gratuita, ed e' invece un problema serio:
 * /api/sync/pull restituisce tutti i documenti dell'utente, condizioni di
 * salute comprese, e Cache Storage li conserverebbe in chiaro, indicizzati per
 * URL, senza svuotarsi al logout. Su un dispositivo condiviso il secondo
 * account vedrebbe i dati del primo.
 *
 * Non serve nemmeno: l'applicazione legge da IndexedDB, non dalla rete.
 */

// L'aggiornamento non e' mai forzato a meta' allenamento: si applica su richiesta.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
