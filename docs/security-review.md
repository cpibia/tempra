# Tempra: revisione di sicurezza white-box

Data: 12 settembre 2026
Ambito: monorepo `Gym` (apps/web, apps/api, packages/core, Docker, nginx)
Metodo: lettura integrale del sorgente, tracciamento dati da sorgente a sink, `npm audit` reale, verifica del comportamento delle librerie installate (Hono 4.13.7, jose 6.2.12, Workbox 7.4.1, Drizzle 0.44.7).
Nessun file del progetto e' stato modificato.

---

## 1. Sintesi esecutiva

**Livello di rischio complessivo: MEDIO-ALTO.**

La base tecnica e' buona e sopra la media di quello che si vede in progetti self-hosted. Le cose difficili sono fatte bene: nessuna SQL injection (tutti i frammenti `sql` di Drizzle usano bind parameter veri, verificato riga per riga), isolamento dei dati fra utenti corretto e non aggirabile, hash delle password con parametri scrypt adeguati e confronto a tempo costante, niente `dangerouslySetInnerHTML` in tutta la PWA, container non-root, database non esposto.

**Non ci sono rilievi di gravita' critica**: nessuna esecuzione di codice, nessun bypass di autenticazione, nessun IDOR.

I problemi reali sono di altra natura e sono tre:

1. **La promessa sui dati sanitari non e' mantenuta.** L'interfaccia dice, in due punti distinti, che le condizioni di salute "restano su questo dispositivo e non vengono inviate da nessuna parte". Il codice di sincronizzazione le invia al server dentro il documento `profile`. Chi crea un account per sincronizzare le schede sta caricando sul server dati di categoria particolare ex art. 9 GDPR mentre l'app gli dice il contrario. E' il rilievo piu' importante di tutta la revisione, e non e' un bug tecnico: e' una dichiarazione falsa resa all'interessato.

2. **Il service worker mette in cache le risposte dell'API.** La regola `StaleWhileRevalidate` su `/api/` intercetta anche le chiamate al sottodominio dell'API, quindi `GET /api/sync/pull` (che contiene tutti i documenti dell'utente, condizioni di salute comprese) finisce in chiaro nella Cache Storage del browser. Quella cache non viene mai svuotata: ne' al logout, ne' alla cancellazione dell'account, ne' con "Cancella tutti i dati". Inoltre la chiave di cache e' il solo URL, quindi su un dispositivo condiviso un secondo account puo' ricevere dalla cache i documenti del primo.

3. **La limitazione delle richieste si aggira con un header.** La chiave si basa sul primo valore di `X-Forwarded-For`, che il client sceglie liberamente. Il risultato non e' solo brute force libero sul login: ogni tentativo costa 64 MiB di memoria e un thread del pool libuv per lo scrypt, quindi poche decine di richieste al secondo mettono in ginocchio un VPS piccolo.

Le raccomandazioni sono calibrate su un'installazione personale su VPS. Dove una misura da SaaS sarebbe sovradimensionata lo dico esplicitamente, e la sezione 4 elenca le cose che sembrano vulnerabilita' ma nel contesto non lo sono, per non far perdere tempo.

**Conteggio dei rilievi:** 0 critici, 4 alti, 8 medi, 6 bassi, 4 informativi.

---

## 2. Tabella dei rilievi

| ID | Gravita' | Componente | File e riga | Descrizione |
|----|----------|------------|-------------|-------------|
| TMP-01 | **Alta** | PWA / privacy | `apps/web/src/lib/sync.ts:45-47`; testo in `OnboardingPage.tsx:364` e `SettingsPage.tsx:232` | Le condizioni di salute vengono caricate sul server dentro il documento `profile` mentre l'interfaccia dichiara che non lasciano il dispositivo. |
| TMP-02 | **Alta** | Service worker | `apps/web/src/sw.ts:52-55` | Le risposte autenticate dell'API, dati sanitari compresi, finiscono in Cache Storage in chiaro e non vengono mai cancellate, nemmeno al logout. |
| TMP-03 | **Alta** | API / rate limit | `apps/api/src/lib/auth.ts:55-59` | La chiave della limitazione usa il primo valore di `X-Forwarded-For`, forgiabile dal client: la limitazione su login e registrazione si aggira con un header. |
| TMP-04 | **Alta** | API / disponibilita' | `apps/api/src/routes/auth.ts:73-99`, `crypto.ts:23-25` | Ogni login non autenticato costa 64 MiB e un thread del pool: con TMP-03 aperto bastano poche decine di richieste per saturare un VPS piccolo. |
| TMP-05 | Media | API / disponibilita' | `apps/api/src/server.ts:14-26`, `routes/sync.ts:90-93` | Nessun limite sulla dimensione del corpo: il controllo dei 512 KB avviene dopo aver letto e deserializzato l'intera richiesta. |
| TMP-06 | Media | Web / nginx | `apps/web/nginx.conf:19-22` vs `25-67` | `add_header` dentro un `location` azzera le intestazioni del blocco `server`: `index.html`, `sw.js` e gli asset escono senza `nosniff` ne' `X-Frame-Options`. |
| TMP-07 | Media | Web / nginx | `apps/web/nginx.conf` | Nessuna Content-Security-Policy. |
| TMP-08 | Media | API / auth | `apps/api/src/lib/env.ts:7-13,23` | `JWT_SECRET` accettato di qualunque lunghezza: un segreto corto e' forzabile offline. |
| TMP-09 | Media | API / auth | `apps/api/src/routes/auth.ts:56-61` | Enumerazione degli account: `/register` risponde 409 su email gia' registrata e 201 altrimenti. |
| TMP-10 | Media | GDPR / sync | `apps/api/src/routes/sync.ts:100-126`, `apps/web/src/db/repo.ts:67-71` | Cancellazione solo logica: il contenuto completo di una scheda eliminata resta sul server a tempo indefinito. |
| TMP-11 | Media | Web / privacy | `apps/web/src/features/settings/SettingsPage.tsx:325-328` | "Cancella tutti i dati" svuota IndexedDB ma lascia token di sessione, cursore di sync e cache dell'API. |
| TMP-12 | Media | Dipendenze | `package-lock.json` | `drizzle-orm@0.44.7`, avviso GHSA-gpj5-g38j-94v9 (alta). Non sfruttabile in questo codice, ma va aggiornato. |
| TMP-13 | Bassa | API / auth | `apps/api/src/routes/auth.ts:101-129` | Rotazione dei refresh token senza rilevamento del riuso: un token rubato e gia' ruotato non fa scattare nulla. |
| TMP-14 | Bassa | Web / auth | `apps/web/src/lib/api.ts:61-64,89-105` | Due richieste che vanno in 401 insieme lanciano due refresh concorrenti: una rotazione invalida l'altra e l'utente viene disconnesso. |
| TMP-15 | Bassa | API / auth | `apps/api/src/routes/auth.ts:77` | La chiave del limite di login include l'email: lo spraying su molti account da un solo indirizzo non e' limitato. |
| TMP-16 | Bassa | Docker | `docker-compose.yml:52-53` | L'API e' pubblicata su tutte le interfacce dell'host: raggiungibile in chiaro senza passare dal reverse proxy. |
| TMP-17 | Bassa | API / log | `apps/api/src/server.ts:44` | `console.error` dell'oggetto errore grezzo: gli errori di postgres.js portano con se' query e parametri. |
| TMP-18 | Bassa | Web / robustezza | `apps/web/src/features/settings/SettingsPage.tsx:53-66` | `importData` scrive in IndexedDB senza validare la forma e senza gestire l'errore: un backup malformato blocca l'app senza messaggio. |
| TMP-19 | Informativa | API / manutenzione | `apps/api/src/lib/rate-limit.ts`, `schema.ts:40-49` | I refresh token scaduti non vengono mai eliminati; le chiavi del rate limit contengono l'email in chiaro. |
| TMP-20 | Informativa | Web / build | `apps/web/vite.config.ts:44` | Le source map vengono generate e servite in produzione. |
| TMP-21 | Informativa | API | `apps/api/src/routes/auth.ts:146-151` | Dopo `DELETE /me` il token di accesso resta valido fino a 15 minuti; una push in quella finestra restituisce 500 per violazione di chiave esterna. |
| TMP-22 | Informativa | GDPR | `apps/web/src/features/settings/SettingsPage.tsx:32-51` | Il backup JSON contiene le condizioni di salute in chiaro senza alcun avviso all'utente. |

---

## 3. Rilievi in dettaglio

### TMP-01 (Alta) Le condizioni di salute vengono sincronizzate mentre l'app dichiara il contrario

**File:** `apps/web/src/lib/sync.ts:45-47`, `apps/web/src/features/onboarding/OnboardingPage.tsx:364`, `apps/web/src/features/settings/SettingsPage.tsx:229-233`

**Descrizione.** `Profile.conditions` (`packages/core/src/domain/types.ts:107`) contiene gli identificativi delle condizioni dichiarate: ernia del disco, cardiopatia, gravidanza, ipertensione e le altre voci di `packages/core/src/health/conditions.json`. Sono dati relativi alla salute ai sensi dell'art. 9 GDPR.

`collectLocalDocuments` invia il profilo intero:

```ts
for (const profile of await db.profiles.toArray()) {
  add('profile', profile.id, profile, profile.updatedAt);   // profile include conditions
}
```

Il documento finisce in `POST /api/sync/push` e viene salvato in `documents.payload` come JSONB in chiaro su Postgres.

Nel frattempo l'interfaccia dice due volte il contrario. Onboarding, passo 6: *"Queste informazioni restano solo sul tuo dispositivo."* Impostazioni, sezione Salute: *"Restano su questo dispositivo e non vengono inviate da nessuna parte."* Nessuna delle due frasi e' condizionata allo stato della sincronizzazione.

C'e' anche un problema di controllo: `runSync()` (riga 138) verifica `isSyncConfigured()` e `isSignedIn()`, ma **non** `settings.syncEnabled`. Lo legge solo alla riga 166-167, e soltanto per decidere se scrivere `lastSyncAt`. Oggi il disallineamento non si manifesta perche' l'unico modo per avere `syncEnabled: false` con una sessione attiva e' un fallimento parziale del logout, ma e' un controllo che non c'e' dove servirebbe.

**Impatto concreto.** L'utente prende una decisione informata sbagliata: dichiara una cardiopatia o una gravidanza convinto che il dato non esca dal telefono, e il dato viene scritto su un database Postgres. Se l'istanza e' condivisa fra amici o familiari, l'amministratore del VPS (che e' una persona fisica diversa dall'interessato) legge quelle condizioni con un `select payload from documents where kind = 'profile'`. In termini GDPR e' un trattamento di dati ex art. 9 privo di trasparenza (art. 5.1.a e art. 13) e senza la base giuridica che l'interessato crede di aver negato. Per un'app che non e' un dispositivo medico ma raccoglie anamnesi, e' il rischio piu' serio del progetto.

**Come si verifica.** Creare un account dal pannello Impostazioni, selezionare una condizione, premere "Sincronizza adesso", poi sul server:

```sql
select payload->'conditions' from documents where kind = 'profile';
```

Le condizioni sono li'.

**Patch.** Due livelli. Il primo e' obbligatorio, il secondo e' la scelta che mantiene davvero la promessa del progetto.

*Livello 1: le condizioni non lasciano il dispositivo (mantiene la promessa cosi' com'e' scritta).*

`apps/web/src/lib/sync.ts`, sostituire la raccolta del profilo e l'applicazione del profilo remoto:

```ts
// --- sostituisce la riga 45-47 ---
for (const profile of await db.profiles.toArray()) {
  // Le condizioni di salute sono dati ex art. 9 GDPR e l'interfaccia promette
  // che restano sul dispositivo: vengono rimosse prima dell'invio, non basta
  // fidarsi del fatto che il server non le legga.
  const { conditions: _healthData, ...shareable } = profile;
  add('profile', profile.id, { ...shareable, conditions: [] }, profile.updatedAt);
}
```

```ts
// --- sostituisce il case 'profile' alle righe 80-88 ---
case 'profile': {
  const remote = doc.payload as Profile;
  const local = await db.profiles.get(remote.id);
  if (!local || local.updatedAt < remote.updatedAt) {
    // Il server non ha mai le condizioni: quelle locali non vanno mai sovrascritte.
    await db.profiles.put({ ...remote, conditions: local?.conditions ?? [] });
    applied += 1;
  }
  break;
}
```

E il controllo mancante, in testa a `runSync` (riga 138-140):

```ts
export async function runSync(): Promise<SyncReport | null> {
  if (!isSyncConfigured() || !isSignedIn()) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  // La sincronizzazione parte solo se l'utente l'ha chiesta, non solo perche'
  // esiste una sessione valida nel dispositivo.
  if (!(await getSettings()).syncEnabled) return null;
  ...
```

(`getSettings` e' gia' importato alla riga 2, e alla riga 166 la chiamata duplicata si puo' riusare.)

Con questa patch il testo dell'interfaccia diventa vero e non serve toccarlo. Il costo e' che chi cambia telefono deve ridichiarare le condizioni: e' esattamente il compromesso che il progetto ha scelto quando ha deciso di essere local-first.

*Livello 2 (alternativa, se si vuole sincronizzarle davvero).* Se l'autore preferisce che le condizioni viaggino, allora serve un consenso separato ed esplicito e i testi vanno corretti. Aggiungere a `packages/core/src/domain/types.ts:313`:

```ts
  syncEnabled: boolean;
  /** Consenso separato per i dati sanitari: art. 9 GDPR, non copre il consenso generale. */
  syncHealthData: boolean;
  lastSyncAt?: string;
```

con `syncHealthData: false` in `DEFAULT_SETTINGS` (`apps/web/src/db/db.ts:59`), una casella dedicata nel pannello account, e questi testi:

```tsx
// apps/web/src/features/settings/SettingsPage.tsx:231-233
<p className="tiny muted" style={{ margin: 0 }}>
  Restano su questo dispositivo. Vengono inviate al server solo se attivi
  l'apposita opzione nella sezione Account e sincronizzazione.
</p>
```

```tsx
// apps/web/src/features/onboarding/OnboardingPage.tsx:364
Queste informazioni restano sul tuo dispositivo. Non vengono inviate da
nessuna parte finche' non crei un account e attivi la sincronizzazione dei
dati di salute.
```

Il livello 1 e' quello che consiglio: meno codice, meno superficie legale, e coerente con l'architettura dichiarata negli ADR.

**Riferimenti:** GDPR art. 5.1.a, art. 9, art. 13; CWE-359 (Exposure of Private Personal Information to an Unauthorized Actor).

---

### TMP-02 (Alta) Il service worker mette in cache le risposte autenticate dell'API

**File:** `apps/web/src/sw.ts:52-55`

**Descrizione.**

```ts
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'tempra-api' }),
);
```

Tre problemi sovrapposti.

*Primo: la regola cattura anche il sottodominio dell'API.* Il matcher guarda solo `url.pathname`, non l'origine. Un service worker intercetta tutte le fetch della pagina, comprese quelle cross-origin: `https://api.tempra.example/api/sync/pull` ha pathname `/api/sync/pull` e la regola scatta. Le risposte sono risposte CORS complete (non opache, perche' `server.ts:20-26` configura CORS correttamente), quindi Workbox le puo' leggere e le scrive in cache senza problemi.

*Secondo: il contenuto e' esattamente il piu' sensibile che l'app abbia.* `GET /api/sync/pull` restituisce tutti i documenti dell'utente: schede, sessioni, misure corporee e il profilo con le condizioni di salute. Finiscono nella Cache Storage del browser, in chiaro, su disco, senza scadenza (nessun `ExpirationPlugin` su questa regola) e senza limite di voci.

*Terzo: la cache non viene mai svuotata e la chiave e' il solo URL.* `logout()` (`api.ts:121-131`) cancella i token, `deleteAccount()` (riga 137-140) cancella l'account sul server, `db.delete()` (`SettingsPage.tsx:326`) svuota IndexedDB: nessuna delle tre tocca `caches`. E poiche' il server non manda `Vary: Authorization`, la chiave di cache e' il solo URL: una richiesta fatta con il token di Tizio e una fatta con il token di Caio colpiscono la stessa voce.

**Impatto concreto.**

1. *Persistenza dopo la disconnessione.* Un utente esce dall'account, magari perche' presta il telefono o restituisce un dispositivo aziendale. I suoi dati sanitari sono ancora nella Cache Storage e li legge chiunque apra la console su quell'origine: `caches.open('tempra-api').then(c => c.keys()).then(...)`.
2. *Fuga fra account sullo stesso dispositivo.* Due persone usano la stessa installazione (uno scenario realistico proprio per un'istanza self-hosted familiare). Il secondo che accede riceve, alla prima `pull`, la risposta in cache del primo: `StaleWhileRevalidate` serve subito la copia vecchia e solo dopo aggiorna. `applyRemoteDocuments` la scrive in IndexedDB. Le schede e le condizioni di salute del primo utente compaiono nell'app del secondo.
3. *Correttezza della sincronizzazione.* Anche senza malizia, servire una `pull` obsoleta significa applicare documenti vecchi e avanzare il cursore su una risposta che non e' quella del server.

**Come si sfrutta.** Accedere, sincronizzare, uscire con "Esci", quindi in console sulla stessa origine:

```js
const c = await caches.open('tempra-api');
for (const r of await c.keys()) console.log(r.url, await (await c.match(r)).json());
```

Le risposte con i documenti sono ancora li'.

**Patch.** Le risposte dell'API non devono entrare in cache, punto: l'app e' local-first, la copia offline e' gia' IndexedDB, la cache HTTP non aggiunge nulla e toglie molto.

`apps/web/src/sw.ts`:

```ts
// riga 4: aggiungere NetworkOnly agli import
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
```

```ts
// --- sostituisce le righe 52-55 ---
/**
 * Le risposte dell'API contengono documenti personali e, nel profilo, condizioni
 * di salute. Non entrano mai in cache: la copia offline e' IndexedDB, non la
 * Cache Storage, che nessuno svuota al logout.
 */
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
);

/** Cache di versioni precedenti che potrebbero contenere risposte dell'API. */
const CACHE_DA_RIMUOVERE = ['tempra-api'];

// --- sostituisce le righe 62-64 ---
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all(CACHE_DA_RIMUOVERE.map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
```

In piu', pulizia esplicita quando l'utente esce o cancella l'account. `apps/web/src/lib/api.ts`:

```ts
// da aggiungere sopra logout()
/** Rimuove ogni risposta dell'API rimasta in cache da versioni precedenti del service worker. */
async function svuotaCacheApi(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    await caches.delete('tempra-api');
  } catch {
    // Cache Storage non disponibile: niente da fare.
  }
}

export async function logout(): Promise<void> {
  const tokens = readTokens();
  writeTokens(null);
  await svuotaCacheApi();
  if (tokens) {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => undefined);
  }
}

export async function deleteAccount(): Promise<void> {
  await request('/api/auth/me', { method: 'DELETE' });
  writeTokens(null);
  await svuotaCacheApi();
}
```

Serve anche azzerare il cursore al logout, altrimenti al prossimo accesso la `pull` riparte da un cursore che appartiene a un'altra sessione. Vedi TMP-11 per la patch unificata.

Nota su cosa **non** va toccato: le due regole `CacheFirst` su `/img/ex/` e sui font sono corrette. Sono risorse statiche, pubbliche e immutabili, con impronta nel nome o percorso stabile, e sono il motivo per cui l'app funziona in un seminterrato senza segnale. Lasciarle com'e'.

**Riferimenti:** CWE-524 (Use of Cache Containing Sensitive Information), CWE-525 (Use of Web Browser Cache Containing Sensitive Information), OWASP ASVS 8.2.

---

### TMP-03 (Alta) La limitazione delle richieste si aggira con un header

**File:** `apps/api/src/lib/auth.ts:55-59`, usato in `apps/api/src/routes/auth.ts:48,74,77,95`

**Descrizione.**

```ts
export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'unknown';
}
```

`X-Forwarded-For` e' un header che il client scrive. Un proxy onesto lo **aggiunge in coda**, quindi il primo valore della lista e' sempre e solo quello che ha mandato il client. Prendere `split(',')[0]` significa prendere, per costruzione, il valore scelto dall'attaccante. Lo stesso vale per `cf-connecting-ip` e `x-real-ip`, che qui non sono validati in alcun modo.

Questo rende inefficaci tutte le limitazioni del progetto:

- `register:${clientIp(c)}` con 5 tentativi all'ora (`auth.ts:48`);
- `login:${ip}:${email}` con 10 tentativi in 15 minuti (`auth.ts:77`).

Va aggiunto che `docker-compose.yml:52-53` pubblica l'API su `0.0.0.0:3000`, quindi in molte installazioni non c'e' nemmeno un proxy da aggirare: si parla direttamente al servizio (vedi TMP-16).

Effetto collaterale: la chiave della tabella `rate_limits` e' `text` con indice btree e viene costruita concatenando un valore lungo a piacere. Postgres rifiuta le chiavi di indice oltre circa 2704 byte, quindi un `X-Forwarded-For` di qualche kilobyte fa fallire l'insert e trasforma il login in un 500. E anche sotto quella soglia, ogni indirizzo inventato crea una riga nuova: la tabella cresce a piacere dell'attaccante fra un `pruneRateLimits` e l'altro (che gira ogni 30 minuti, `server.ts:56-58`).

**Impatto concreto.** Brute force e credential stuffing senza alcun freno, enumerazione degli account senza freno (vedi TMP-09), e soprattutto l'amplificazione descritta in TMP-04: il rate limit era l'unica cosa che impediva a un estraneo di far girare scrypt a comando sul server.

**Come si sfrutta.**

```bash
for i in $(seq 1 5000); do
  curl -s -X POST https://api.tempra.example/api/auth/login \
    -H 'Content-Type: application/json' \
    -H "X-Forwarded-For: 10.0.$((i/256)).$((i%256))" \
    -d '{"email":"vittima@example.com","password":"tentativo'"$i"'"}' > /dev/null
done
```

Nessun 429: ogni richiesta crea una chiave diversa nella tabella.

**Patch.** L'API deve fidarsi dell'indirizzo del socket, e usare `X-Forwarded-For` solo se sa quanti proxy fidati ha davanti. Con un numero noto di proxy (per una installazione dietro Coolify o Traefik: uno) si prende il valore in posizione N dalla fine, l'unico che il client non puo' falsificare.

`apps/api/src/lib/env.ts`, aggiungere alla fine dell'oggetto `env`:

```ts
  /**
   * Quanti reverse proxy fidati stanno davanti all'API.
   * 0 = nessuno: si usa solo l'indirizzo del socket e X-Forwarded-For viene ignorato.
   * 1 = un proxy (Coolify, Traefik, nginx): si prende il penultimo valore della catena,
   *     cioe' l'ultimo che il client non ha potuto scrivere.
   */
  trustedProxyCount: Math.max(0, Number(optional('TRUSTED_PROXY_COUNT', '0'))),
```

`apps/api/src/lib/auth.ts`, sostituire integralmente `clientIp` (righe 54-59):

```ts
import { getConnInfo } from '@hono/node-server/conninfo';

/**
 * Indirizzo del chiamante.
 *
 * X-Forwarded-For viene scritto dal client e i proxy si limitano ad accodare:
 * il primo valore della lista e' sempre quello che ha scelto chi chiama, quindi
 * non va mai usato. Con TRUSTED_PROXY_COUNT proxy fidati davanti, l'ultimo
 * valore non falsificabile e' quello in posizione TRUSTED_PROXY_COUNT dalla fine.
 */
export function clientIp(c: Context): string {
  const socketIp = getConnInfo(c).remote.address ?? 'unknown';
  if (env.trustedProxyCount === 0) return socketIp;

  const chain = (c.req.header('x-forwarded-for') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const index = chain.length - env.trustedProxyCount;
  return index >= 0 && index < chain.length ? chain[index]! : socketIp;
}
```

`.env.example`, nella sezione API:

```
# Quanti reverse proxy fidati stanno davanti all'API.
# 0 se l'API e' raggiunta direttamente, 1 dietro Coolify/Traefik/nginx.
# Sbagliare questo numero significa disattivare la limitazione delle richieste.
TRUSTED_PROXY_COUNT=1
```

`docker-compose.yml`, nel blocco `environment` del servizio `api`:

```yaml
      TRUSTED_PROXY_COUNT: ${TRUSTED_PROXY_COUNT:-0}
```

Difesa aggiuntiva a costo zero, per non farsi comunque riempire la tabella: tagliare la chiave prima di scriverla. `apps/api/src/lib/rate-limit.ts`, in testa a `consumeRateLimit`:

```ts
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  // La chiave finisce in un indice btree: oltre ~2700 byte Postgres rifiuta la riga.
  const safeKey = key.length > 200 ? key.slice(0, 200) : key;
  const now = new Date();
  ...
```

e usare `safeKey` al posto di `key` nella `insert` e in `resetRateLimit`.

**Riferimenti:** CWE-290 (Authentication Bypass by Spoofing), CWE-307 (Improper Restriction of Excessive Authentication Attempts), OWASP A07:2021.

---

### TMP-04 (Alta) Il login non autenticato costa 64 MiB e un thread: amplificazione di denial of service

**File:** `apps/api/src/lib/crypto.ts:23-25`, `apps/api/src/routes/auth.ts:73-99`

**Descrizione.** I parametri scrypt sono corretti per la loro funzione: `N = 2^16, r = 8, p = 2`, 64 byte di chiave derivata, `maxmem` a 256 MiB perche' il default di Node a 32 MiB non basterebbe. Il commento nel file e' preciso e il ragionamento sulla scelta di N e' giusto. Il problema non e' la robustezza dell'hash: e' che il costo lo paga il server su richiesta di chiunque.

Ogni chiamata consuma `128 * N * r` = 64 MiB di memoria e occupa un thread del pool libuv (di default 4 thread) per la durata del calcolo. La riga 88-89 di `auth.ts` fa girare scrypt **anche quando l'utente non esiste**, usando `DUMMY_HASH`, che e' la scelta corretta contro il timing (vedi sezione 4) ma raddoppia la superficie: non serve conoscere un'email valida per far lavorare il server.

Quattro calcoli concorrenti sono 256 MiB di picco e l'intero pool libuv occupato, il che blocca anche tutto il resto che passa per quel pool. Su un VPS da 1 o 2 GB con Postgres sulla stessa macchina si arriva all'OOM killer o allo stallo prima di quanto si pensi. Il rate limit era la protezione, e TMP-03 la rende inefficace.

**Impatto concreto.** Un estraneo spegne l'istanza con uno script di tre righe e una connessione domestica. Per un'app che non e' un servizio critico l'impatto e' contenuto, ma e' comunque un servizio che chiunque puo' rendere indisponibile a costo quasi nullo, e la vittima e' il proprietario del VPS.

**Come si sfrutta.**

```bash
seq 1 200 | xargs -P 50 -I{} curl -s -o /dev/null -X POST \
  https://api.tempra.example/api/auth/login \
  -H 'Content-Type: application/json' -H 'X-Forwarded-For: 10.{}.0.1' \
  -d '{"email":"inesistente{}@example.com","password":"unapasswordqualsiasi"}'
```

**Patch.** Correggere TMP-03 e' la meta' del lavoro; l'altra meta' e' mettere un tetto alla concorrenza dello scrypt, in modo che nemmeno un picco legittimo o un attaccante distribuito possa far allocare 20 volte 64 MiB insieme. Un semaforo in memoria e' sufficiente e non introduce dipendenze.

`apps/api/src/lib/crypto.ts`, da aggiungere dopo `const MAX_MEM` (riga 25):

```ts
/**
 * Un solo hash costa 128 * N * r = 64 MiB e occupa un thread del pool libuv.
 * Senza tetto, un picco di accessi (o qualcuno che ci prova) alloca centinaia
 * di MiB insieme e blocca il pool per tutto il resto. Due calcoli alla volta
 * su una istanza personale sono piu' che sufficienti; oltre la coda si risponde
 * 503 invece di accumulare lavoro che nessuno aspettera'.
 */
const MAX_HASH_CONCORRENTI = 2;
const MAX_HASH_IN_CODA = 20;

let inCorso = 0;
const inAttesa: Array<() => void> = [];

export class ServizioSovraccaricoError extends Error {
  constructor() {
    super('Troppe richieste di autenticazione in corso');
    this.name = 'ServizioSovraccaricoError';
  }
}

async function conSlot<T>(lavoro: () => Promise<T>): Promise<T> {
  while (inCorso >= MAX_HASH_CONCORRENTI) {
    if (inAttesa.length >= MAX_HASH_IN_CODA) throw new ServizioSovraccaricoError();
    await new Promise<void>((resolve) => inAttesa.push(resolve));
  }
  inCorso += 1;
  try {
    return await lavoro();
  } finally {
    inCorso -= 1;
    inAttesa.shift()?.();
  }
}
```

e avvolgere le due funzioni esistenti:

```ts
export async function hashPassword(password: string): Promise<string> {
  return conSlot(async () => {
    const salt = randomBytes(16);
    const derived = await scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM });
    return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, 'base64');
  const expected = Buffer.from(hashB64!, 'base64');

  const derived = await conSlot(() => scryptAsync(password, salt, expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEM,
  }));

  // Confronto a tempo costante: la durata della verifica non deve dire nulla.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
```

E la traduzione in risposta HTTP, in `apps/api/src/server.ts` dentro `app.onError` (riga 39), prima del ramo generico:

```ts
import { ServizioSovraccaricoError } from './lib/crypto';

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  if (error instanceof ServizioSovraccaricoError) {
    return c.json({ error: 'Servizio momentaneamente occupato, riprova fra poco' }, 503, {
      'Retry-After': '5',
    });
  }
  ...
```

Nota su cosa non fare: **non** abbassare N per risparmiare. I parametri attuali sono quelli giusti e il commento che li motiva e' corretto. Il problema e' la concorrenza, non il costo unitario.

**Riferimenti:** CWE-400 (Uncontrolled Resource Consumption), CWE-770 (Allocation of Resources Without Limits or Throttling).

---

### TMP-05 (Media) Nessun limite alla dimensione del corpo della richiesta

**File:** `apps/api/src/server.ts:14-26`, `apps/api/src/routes/sync.ts:86-93`

**Descrizione.** Ne' `@hono/node-server` ne' Hono impongono un limite predefinito alla dimensione del corpo. `zValidator('json', ...)` legge e deserializza **tutto** prima di qualunque controllo. Il controllo che esiste arriva dopo:

```ts
const tooBig = documents.find((d) => JSON.stringify(d.payload ?? null).length > MAX_PAYLOAD_BYTES);
if (tooBig) return c.json({ error: `Documento troppo grande: ${tooBig.id}` }, 413);
```

A quel punto il JSON e' gia' in memoria, ed e' stato anche ri-serializzato per misurarlo. Anche rispettando lo schema, 500 documenti da 512 KB sono 256 MB perfettamente legittimi. Fuori schema, una singola richiesta da 1 GB viene bufferizzata comunque prima che zod si accorga che non va bene, e questo vale anche per `/api/auth/login`, che non richiede autenticazione.

**Impatto concreto.** Esaurimento della memoria del container da parte di chiunque, senza credenziali. Piu' semplice e piu' efficace di TMP-04.

**Come si sfrutta.**

```bash
head -c 500000000 /dev/zero | tr '\0' 'a' > /tmp/grosso
curl -X POST https://api.tempra.example/api/auth/login \
  -H 'Content-Type: application/json' --data-binary @/tmp/grosso
```

**Patch.** Hono ha il middleware apposta. `apps/api/src/server.ts`:

```ts
import { bodyLimit } from 'hono/body-limit';
```

```ts
// da inserire dopo app.use('*', compress()) e prima del cors
/**
 * Tetto alla dimensione del corpo prima che qualcuno lo deserializzi.
 * I controlli di zValidator e MAX_PAYLOAD_BYTES arrivano dopo aver letto tutto:
 * servono, ma non proteggono la memoria del processo.
 */
app.use('/api/auth/*', bodyLimit({
  maxSize: 16 * 1024,
  onError: (c) => c.json({ error: 'Richiesta troppo grande' }, 413),
}));

app.use('/api/sync/*', bodyLimit({
  // 500 documenti da 512 KB sono il massimo che lo schema ammette, ma nessun
  // client reale ci arriva: 8 MB coprono con ampio margine una sincronizzazione
  // completa e tengono il picco di memoria sotto controllo.
  maxSize: 8 * 1024 * 1024,
  onError: (c) => c.json({ error: 'Richiesta troppo grande' }, 413),
}));
```

Coerentemente conviene abbassare il tetto dei documenti per richiesta in `apps/api/src/routes/sync.ts:32-34`, visto che il client ne manda gia' 200 alla volta (`sync.ts:147`):

```ts
const pushSchema = z.object({
  documents: z.array(documentSchema).max(250),
});
```

**Riferimenti:** CWE-770, OWASP API4:2023 (Unrestricted Resource Consumption).

---

### TMP-06 (Media) nginx perde le intestazioni di sicurezza nei blocchi location

**File:** `apps/web/nginx.conf:19-22` rispetto a `25-67`

**Descrizione.** In nginx `add_header` non e' cumulativo fra livelli: le direttive di un blocco `location` **sostituiscono** quelle ereditate dal blocco `server`, non si aggiungono. Basta un `add_header` in un `location` per perdere tutti quelli di sopra.

Qui le quattro intestazioni di sicurezza stanno nel blocco `server` (righe 19-22), e sei blocchi `location` su sette hanno un `add_header` proprio: `/assets/`, `/fonts/`, `/img/ex/`, `= /sw.js`, `= /manifest.webmanifest`, `= /index.html`, `= /health`. Tutti questi servono contenuto **senza** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.

Il caso peggiore e' `location = /index.html`. Il `try_files $uri $uri/ /index.html` del blocco `location /` fa una redirezione interna verso `/index.html`, che rientra nel matching e finisce nel blocco esatto: quindi **il guscio dell'applicazione, cioe' l'unica pagina HTML del progetto, esce senza protezione dal clickjacking e senza nosniff**. Le intestazioni configurate proteggono, di fatto, solo le richieste che finiscono in `location /` senza passare per `/index.html`, che sono poche.

**Impatto concreto.** La PWA e' incorniciabile in un iframe da un sito terzo (clickjacking: un overlay invisibile sopra "Cancella tutti i dati" o sopra il pulsante di logout). Con `nosniff` assente, un file servito con tipo ambiguo puo' essere interpretato dal browser in modo diverso da quello dichiarato. Su un'istanza personale l'impatto reale e' moderato, ma la correzione costa dieci minuti ed e' una configurazione che oggi non fa quello che chi l'ha scritta credeva facesse.

**Come si verifica.**

```bash
curl -sI https://tempra.example/ | grep -i "x-frame\|nosniff"        # presenti? no
curl -sI https://tempra.example/assets/index-gH0CXsrZ.js | grep -i nosniff   # assente
```

**Patch.** Portare le intestazioni in un file incluso in ogni `location`. Serve anche una riga nel Dockerfile per copiarlo.

Nuovo file `apps/web/security-headers.conf`:

```nginx
# In nginx add_header non si eredita: un solo add_header dentro un location
# azzera tutti quelli del blocco server. Queste direttive vanno quindi incluse
# in ogni location che ne abbia uno proprio.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
add_header Content-Security-Policy "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'sha256-i/1R4B22SrmTFib/4GjxP00QLYbbrdgGa0xgueUpp6A='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.tempra.example; worker-src 'self'; manifest-src 'self'; upgrade-insecure-requests" always;
```

(la CSP e' spiegata per intero nella sezione 5; l'hash e' quello dello script inline di `index.html` e va ricalcolato se quello script cambia)

`apps/web/nginx.conf` riscritto:

```nginx
server {
    listen 8080;
    listen [::]:8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compressione: il catalogo esercizi passa da 547 KB a circa 55 KB.
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain text/css text/javascript
        application/javascript application/json application/manifest+json
        image/svg+xml font/woff2;

    server_tokens off;

    include /etc/nginx/snippets/security-headers.conf;

    # Gli asset hanno l'impronta del contenuto nel nome: si possono tenere per sempre.
    location /assets/ {
        include /etc/nginx/snippets/security-headers.conf;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location /fonts/ {
        include /etc/nginx/snippets/security-headers.conf;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Le immagini degli esercizi non cambiano mai: le tiene il service worker,
    # ma anche il browser puo' fidarsi.
    location /img/ex/ {
        include /etc/nginx/snippets/security-headers.conf;
        expires 180d;
        add_header Cache-Control "public, max-age=15552000";
        try_files $uri =404;
    }

    # Il service worker deve essere sempre riconvalidato, altrimenti un browser
    # con la vecchia copia non scoprirebbe mai che esiste una versione nuova.
    location = /sw.js {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Service-Worker-Allowed "/";
        try_files $uri =404;
    }

    location = /manifest.webmanifest {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "no-cache";
        types { } default_type application/manifest+json;
        try_files $uri =404;
    }

    location = /index.html {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Le source map non vanno servite in produzione (vedi TMP-20).
    location ~ \.map$ {
        return 404;
    }

    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
    }

    # Il routing e' lato client: qualunque percorso sconosciuto serve il guscio.
    location / {
        include /etc/nginx/snippets/security-headers.conf;
        try_files $uri $uri/ /index.html;
    }
}
```

`apps/web/Dockerfile`, righe 36-40 della fase `runtime`:

```dockerfile
RUN rm /etc/nginx/conf.d/default.conf && mkdir -p /etc/nginx/snippets
COPY apps/web/nginx.conf /etc/nginx/conf.d/tempra.conf
COPY apps/web/security-headers.conf /etc/nginx/snippets/security-headers.conf
# La proprieta' si imposta durante la copia: un chown ricorsivo successivo
# duplicherebbe in un secondo livello i 26 MB di immagini degli esercizi.
COPY --chown=nginx:nginx --from=build /app/apps/web/dist /usr/share/nginx/html
```

Verifica dopo il deploy:

```bash
for p in / /index.html /sw.js /manifest.webmanifest /assets/ ; do
  echo "== $p"; curl -sI "https://tempra.example$p" | grep -iE "content-security-policy|x-frame|nosniff"
done
```

**Riferimenti:** CWE-1021 (Improper Restriction of Rendered UI Layers), CWE-693 (Protection Mechanism Failure), documentazione nginx `ngx_http_headers_module`.

---

### TMP-07 (Media) Nessuna Content-Security-Policy

**File:** `apps/web/nginx.conf`

**Descrizione.** Nessuna CSP viene emessa. `secureHeaders()` lato API non ne aggiunge una (verificato: `contentSecurityPolicy` non e' fra le opzioni attive per default in Hono 4.13.7), e nginx non ne dichiara nessuna.

Oggi non c'e' un punto di iniezione noto nella PWA: nessun `dangerouslySetInnerHTML`, nessun `innerHTML`, nessun `eval`, nessuno script di terze parti, nessun contenuto generato da altri utenti. Quindi il rilievo e' difensivo, non lo sfruttamento di un buco esistente. Ma e' proprio l'app in cui vale la pena averla: tiene in `localStorage` un token di sessione (vedi sezione 4) e nella cache del browser dati sanitari. La CSP e' la cosa che trasforma un futuro XSS da "esfiltrazione dei dati di salute e furto della sessione" a "un errore in console".

La proposta completa, con la motivazione di ogni direttiva, e' nella sezione 5. La patch e' la riga `add_header Content-Security-Policy ...` gia' inclusa nel file `security-headers.conf` di TMP-06.

Conviene aggiungerne una anche all'API, dove costa una riga ed e' banale perche' l'API restituisce solo JSON. `apps/api/src/server.ts:17`:

```ts
app.use('*', secureHeaders({
  // L'API risponde solo JSON: nessuna risorsa deve essere caricata da queste risposte.
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
  },
}));
```

**Riferimenti:** CWE-1021, OWASP Secure Headers Project.

---

### TMP-08 (Media) JWT_SECRET accettato di qualunque lunghezza

**File:** `apps/api/src/lib/env.ts:7-13,23`

**Descrizione.** `required('JWT_SECRET')` verifica solo che la variabile non sia vuota. `JWT_SECRET=x` fa partire il servizio senza un fiato, e con quel segreto HS256 si forza offline in pochi secondi partendo da un qualsiasi token valido (basta registrare un account sulla propria istanza per averne uno).

Il commento in testa al file dice la cosa giusta: *"Il processo si rifiuta di partire se manca un segreto: meglio un errore chiaro all'avvio che un'applicazione che gira con una chiave prevedibile."* Il controllo pero' si ferma alla presenza, non alla qualita'.

**Impatto concreto.** Con il segreto recuperato si firmano token per un `sub` arbitrario. Attenuante reale: `sub` e' `usr_` piu' 12 byte casuali in base64url (`crypto.ts:54-55`), quindi per impersonare qualcuno bisogna comunque conoscerne l'identificativo, che non e' esposto da nessun endpoint pubblico. Non e' quindi un bypass immediato dell'autenticazione, ma resta un segreto di firma che un'installazione frettolosa puo' impostare a `changeme` e che nessuno le impedira' di usare.

`.env.example` suggerisce correttamente `openssl rand -base64 48`: il controllo serve a rendere quel suggerimento vincolante.

**Patch.** `apps/api/src/lib/env.ts`:

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile d'ambiente mancante: ${name}`);
  }
  return value;
}

/**
 * Un segreto HS256 corto si forza offline partendo da un solo token valido,
 * e un token valido lo ottiene chiunque possa registrarsi. 32 byte sono il
 * minimo indicato dalla RFC 7518 per HMAC-SHA256.
 */
function requiredSecret(name: string, minBytes = 32): string {
  const value = required(name);
  if (Buffer.byteLength(value, 'utf8') < minBytes) {
    throw new Error(
      `${name} e' troppo corto: servono almeno ${minBytes} byte. Generane uno con: openssl rand -base64 48`,
    );
  }
  return value;
}
```

e alla riga 23:

```ts
  jwtSecret: requiredSecret('JWT_SECRET'),
```

Nota: questo fa fallire l'avvio a chi oggi ha un segreto corto. E' il comportamento voluto, ma va scritto nelle note di rilascio, altrimenti si trasforma in un deploy fallito senza spiegazione.

**Riferimenti:** CWE-326 (Inadequate Encryption Strength), CWE-521 (Weak Password Requirements), RFC 7518 par. 3.2.

---

### TMP-09 (Media) Enumerazione degli account tramite la registrazione

**File:** `apps/api/src/routes/auth.ts:56-61`

**Descrizione.**

```ts
const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
if (existing) {
  // Il messaggio e' volutamente identico a quello di successo lato client:
  // non si conferma a un estraneo se un indirizzo e' registrato.
  return c.json({ error: 'Registrazione non riuscita' }, 409);
}
```

Il commento descrive un'intenzione che il codice non realizza: il messaggio sara' anche neutro, ma lo **stato HTTP no**. 409 significa "questa email esiste", 201 significa "non esisteva". Non serve leggere il corpo della risposta.

Il login, va detto, e' fatto bene: stesso messaggio, stesso stato 401, e soprattutto `DUMMY_HASH` con gli stessi parametri scrypt, quindi anche i tempi coincidono. L'enumerazione passa solo da `/register`, e solo mentre `REGISTRATION_OPEN` e' `true`.

**Impatto concreto.** Chiunque verifica se un dato indirizzo ha un account su questa istanza. Per un'app di allenamento che raccoglie anamnesi, sapere che `nome.cognome@azienda.it` e' registrato e' gia' di per se' un'informazione personale. Con TMP-03 aperto, il limite di 5 all'ora non esiste e si puo' testare una lista intera.

**Patch.** Due strade, a seconda di come si usa l'istanza.

*Se l'istanza e' personale (il caso normale di questo progetto), la correzione giusta e' la piu' semplice: chiudere le registrazioni dopo aver creato il proprio account.* Il meccanismo c'e' gia' e funziona: con `REGISTRATION_OPEN=false` l'endpoint risponde 403 prima di toccare il database (riga 44-46) e l'enumerazione sparisce del tutto. Va solo cambiato il valore predefinito, che oggi e' il piu' permissivo.

`.env.example`:

```
# Registrazione di nuovi account. Tenerla chiusa e aprirla solo il tempo di
# creare i propri account: finche' e' aperta chiunque puo' verificare se un
# indirizzo email ha un account su questa istanza.
REGISTRATION_OPEN=false
```

`docker-compose.yml`, nel servizio `api`:

```yaml
      REGISTRATION_OPEN: ${REGISTRATION_OPEN:-false}
```

*Se invece le registrazioni devono restare aperte*, allora la risposta va resa indistinguibile. Il prezzo e' che la PWA non puo' piu' ricevere una sessione immediata alla registrazione e serve una conferma via email, che per un progetto self-hosted senza SMTP configurato e' sproporzionato. In quel caso la soluzione proporzionata e' tenere l'esito uguale e rimandare al login:

```ts
  const userId = newId('usr');
  const passwordHash = await hashPassword(password);

  // Insert idempotente: se l'email esiste la riga non viene toccata, e la
  // risposta e' la stessa in entrambi i casi. Chi si registra due volte riceve
  // lo stesso invito ad accedere di chi ha davvero creato l'account adesso.
  await db.insert(schema.users)
    .values({ id: userId, email, passwordHash })
    .onConflictDoNothing({ target: schema.users.email });

  return c.json({ ok: true, message: 'Se l indirizzo e disponibile, l account e stato creato. Ora puoi accedere.' }, 202);
```

con l'adeguamento di `apps/web/src/lib/api.ts:107-112` e di `AccountPanel.tsx:49-51`, dove dopo `register` si chiama `login` con le stesse credenziali.

Consiglio la prima strada: e' coerente con "auto-ospitato da singoli", non aggiunge codice e chiude il problema alla radice.

**Riferimenti:** CWE-204 (Observable Response Discrepancy), OWASP WSTG-IDNT-04.

---
