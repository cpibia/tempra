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

### TMP-10 (Media) I documenti cancellati restano interi sul server, per sempre

**File:** `apps/api/src/routes/sync.ts:100-126`, `apps/web/src/db/repo.ts:67-71`, `apps/web/src/lib/sync.ts:48-50,72-77`

**Descrizione.** La cancellazione di una scheda e' logica:

```ts
export async function deletePlan(planId: string): Promise<void> {
  const plan = await db.plans.get(planId);
  if (!plan) return;
  await db.plans.put({ ...plan, deletedAt: nowIso(), isActive: false, updatedAt: nowIso() });
}
```

Il record resta, e la sincronizzazione lo invia **con il payload intero**:

```ts
for (const plan of await db.plans.toArray()) {
  add('plan', plan.id, plan, plan.updatedAt, plan.deletedAt);   // plan completo anche se cancellato
}
```

Lato server, `documents.payload` viene aggiornato con `excluded.payload`, quindi il contenuto completo della scheda cancellata resta in tabella. Non esiste nessun percorso che lo rimuova: nessun job di purga, nessun `DELETE`. Il `deletedAt` e' solo un'etichetta.

C'e' anche un difetto correlato in `applyRemoteDocuments` (`sync.ts:72-77`): il ramo dei piani cancellati fa `db.plans.put({ ...plan, deletedAt })` **senza confrontare le date di modifica**, a differenza di tutti gli altri rami. Una tombstone remota sovrascrive quindi la copia locale anche quando quella locale e' piu' recente.

**Impatto concreto.** L'utente cancella una scheda credendo di averla cancellata. Sul server c'e' ancora, per sempre. In termini GDPR e' un'aspettativa di cancellazione disattesa (art. 17) e una violazione della limitazione della conservazione (art. 5.1.e). Per un'app che tratta dati sanitari, "cancellato" deve significare cancellato.

**Patch.** Tre modifiche coordinate, perche' se si svuota il payload lato server bisogna anche smettere di aspettarselo lato client.

*1. Il client non invia il contenuto di cio' che ha cancellato.* `apps/web/src/lib/sync.ts:48-50`:

```ts
for (const plan of await db.plans.toArray()) {
  // Di una scheda cancellata si propaga l'eliminazione, non il contenuto:
  // il server non ha motivo di conservare una scheda che l'utente ha buttato.
  add('plan', plan.id, plan.deletedAt ? null : plan, plan.updatedAt, plan.deletedAt);
}
```

*2. Il client applica la tombstone senza pretendere il payload, e rispetta le date.* `apps/web/src/lib/sync.ts:72-77`:

```ts
if (doc.deletedAt && doc.kind === 'plan') {
  // La tombstone non porta piu' il contenuto: si marca la copia locale,
  // e solo se quella locale non e' piu' recente.
  const local = await db.plans.get(doc.id);
  if (local && !local.deletedAt && local.updatedAt <= doc.updatedAt) {
    await db.plans.put({ ...local, deletedAt: doc.deletedAt, isActive: false });
    applied += 1;
  }
  continue;
}
```

*3. Il server non conserva il contenuto dei documenti cancellati, e prima o poi butta anche le tombstone.* `apps/api/src/routes/sync.ts`, nella `values` del push (righe 102-110):

```ts
        .values({
          id: doc.id,
          userId: user.sub,
          kind: doc.kind,
          // Di un documento cancellato si tiene solo la lapide: il contenuto
          // non serve piu' a nessuno e non va conservato.
          payload: doc.deletedAt ? {} : (doc.payload ?? {}),
          updatedAt: new Date(doc.updatedAt),
          deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
          syncedAt: new Date(),
        })
```

e una funzione di purga da aggiungere in fondo a `apps/api/src/lib/rate-limit.ts` oppure in un nuovo `apps/api/src/lib/maintenance.ts`:

```ts
import { and, isNotNull, lt, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';

/**
 * Elimina definitivamente le lapidi dei documenti cancellati da abbastanza tempo
 * perche' ogni dispositivo dell'utente abbia gia' recepito l'eliminazione,
 * e i refresh token scaduti o ritirati (vedi TMP-19).
 */
export async function pruneDeletedDocuments(olderThanDays = 90): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  await db.delete(schema.documents).where(
    and(isNotNull(schema.documents.deletedAt), lt(schema.documents.syncedAt, cutoff)),
  );
}

export async function pruneExpiredRefreshTokens(): Promise<void> {
  await db.delete(schema.refreshTokens).where(
    sql`${schema.refreshTokens.expiresAt} < now() or (${schema.refreshTokens.revokedAt} is not null and ${schema.refreshTokens.revokedAt} < now() - interval '7 days')`,
  );
}
```

da agganciare al timer gia' presente in `apps/api/src/server.ts:56-58`:

```ts
const cleanup = setInterval(() => {
  void pruneRateLimits().catch((error) => console.error('Pulizia contatori fallita:', error));
  void pruneDeletedDocuments().catch((error) => console.error('Pulizia documenti fallita:', error));
  void pruneExpiredRefreshTokens().catch((error) => console.error('Pulizia token fallita:', error));
}, 30 * 60 * 1000);
```

Novanta giorni sono una scelta prudente: abbastanza perche' il telefono usato una volta ogni due mesi riceva comunque l'eliminazione, abbastanza poco da non chiamarsi conservazione a tempo indeterminato. Sotto i 30 giorni si rischia che un dispositivo dormiente si riporti indietro una scheda cancellata.

**Riferimenti:** GDPR art. 5.1.e e art. 17; CWE-212 (Improper Removal of Sensitive Information Before Storage or Transfer).

---

### TMP-11 (Media) "Cancella tutti i dati" non cancella tutti i dati

**File:** `apps/web/src/features/settings/SettingsPage.tsx:318-329`

**Descrizione.**

```tsx
onConfirm={async () => {
  await db.delete();
  window.location.href = '/';
}}
```

`db.delete()` distrugge il database IndexedDB. Restano in piedi:

- `localStorage['tempra.tokens']`: token di accesso e di refresh. L'utente resta collegato al server, con dati zero in locale.
- `localStorage['tempra.syncCursor']`: il cursore della sessione precedente, che al prossimo accesso fa saltare tutti i documenti gia' scaricati.
- La cache `tempra-api` del service worker, con le risposte `pull` complete (TMP-02).
- La copia sul server, che non viene toccata e di cui il messaggio di conferma non fa parola.

Il messaggio dice: *"Profilo, schede, allenamenti e record vengono eliminati definitivamente da questo dispositivo."* Riferito al dispositivo e' quasi vero, ma un utente che ha attivato la sincronizzazione legge "eliminati definitivamente" e intende anche il server.

**Impatto concreto.** Un utente che passa il telefono a qualcun altro e usa la funzione apposta si trova ancora una sessione attiva e una cache con i suoi dati sanitari. Ed e' l'unico punto dell'app in cui ci si aspetta che tutto sparisca.

**Patch.** `apps/web/src/features/settings/SettingsPage.tsx`, sostituire il `ConfirmDialog` finale (righe 318-329):

```tsx
      <ConfirmDialog
        open={confirmWipe}
        title="Cancellare tutto?"
        message={
          isSignedIn()
            ? 'Profilo, schede, allenamenti e record vengono eliminati da questo dispositivo, la sessione viene chiusa e la cache svuotata. La copia sul server resta: per eliminare anche quella usa "Elimina l account" nella sezione Account.'
            : 'Profilo, schede, allenamenti e record vengono eliminati definitivamente da questo dispositivo. Se non hai un backup, non si torna indietro.'
        }
        confirmLabel="Cancella tutto"
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={async () => {
          await db.delete();
          await wipeLocalTraces();
          window.location.href = '/';
        }}
      />
```

con la funzione di supporto, da mettere in `apps/web/src/lib/api.ts` ed esportare (li' vivono gia' le chiavi di storage):

```ts
/**
 * Rimuove ogni traccia locale della sessione e dei dati sincronizzati.
 * IndexedDB la cancella chi chiama: qui si occupa di cio' che db.delete() non vede.
 */
export async function wipeLocalTraces(): Promise<void> {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('tempra.syncCursor');
    sessionStorage.clear();
  } catch {
    // Storage non disponibile: non c'e' nulla da rimuovere.
  }
  if (typeof caches !== 'undefined') {
    try {
      // Solo la cache dell'API: il precache contiene il codice dell'app e
      // svuotarlo toglierebbe il funzionamento offline senza alcun guadagno.
      await caches.delete('tempra-api');
    } catch {
      // Cache Storage non disponibile.
    }
  }
}
```

Lo stesso `wipeLocalTraces()` va chiamato in `logout()` e in `deleteAccount()` (sostituisce la `svuotaCacheApi` proposta in TMP-02, che faceva meno), e in `AccountPanel.tsx:102` dopo `logout()` il cursore sparisce da solo.

**Riferimenti:** CWE-459 (Incomplete Cleanup), GDPR art. 17.

---

### TMP-12 (Media) Dipendenze: risultati reali di npm audit

**Comando eseguito:** `npm audit --omit=dev` e `npm audit`, alla radice del monorepo, il 12 settembre 2026.

**Risultato in produzione (`--omit=dev`): 1 vulnerabilita' alta, 0 critiche.**

```
drizzle-orm  <0.45.2
Severita': alta
Drizzle ORM has SQL injection via improperly escaped SQL identifiers
GHSA-gpj5-g38j-94v9
Versione installata: 0.44.7 (package.json dichiara ^0.44.5)
Dipendenze di produzione analizzate: 35
```

**Risultato completo (dipendenze di sviluppo incluse): 7 vulnerabilita', 6 moderate e 1 alta.**

```
esbuild <=0.24.2  (moderata, GHSA-67mh-4wv8-2f99)
  via @esbuild-kit/core-utils -> @esbuild-kit/esm-loader -> drizzle-kit
```

**Valutazione della sfruttabilita' in questo progetto.**

- **drizzle-orm GHSA-gpj5-g38j-94v9**: riguarda l'escaping degli *identificativi* SQL (nomi di tabella e colonna), non dei valori. In questo codice nessun identificativo proviene dall'input: lo schema e' statico in `apps/api/src/db/schema.ts` e non esiste un solo punto in cui un nome di colonna venga costruito da dati del client (nessun `orderBy` dinamico, nessuna proiezione parametrica). **Non sfruttabile qui**, ma va aggiornata lo stesso: e' una libreria che sta fra l'applicazione e il database e non e' il posto dove tenersi una versione con un avviso aperto.
- **esbuild GHSA-67mh-4wv8-2f99**: riguarda il *dev server* di esbuild, che accetta richieste da qualunque sito web. Arriva da `drizzle-kit`, che e' una dipendenza di sviluppo e non finisce nell'immagine di produzione (`apps/api/Dockerfile:35` usa `npm ci --omit=dev`). Rilevante solo sulla macchina di chi sviluppa, e solo mentre gira il dev server.

**Patch.**

```bash
npm install drizzle-orm@^0.45.2 --workspace=@tempra/api
npm run test --workspace=@tempra/api
npm run typecheck --workspace=@tempra/api
npm run db:generate --workspace=@tempra/api   # verifica che drizzle-kit sia ancora d'accordo
```

Da verificare a mano dopo l'aggiornamento, perche' sono i due punti in cui il progetto usa API meno banali di Drizzle:

- `apps/api/src/routes/sync.ts:111-121`, `onConflictDoUpdate` con clausola `where` e riferimenti a `excluded.*`;
- `apps/api/src/lib/rate-limit.ts:26-36`, `onConflictDoUpdate` con `case when` nei valori aggiornati.

**Non** usare `npm audit fix --force`: proporrebbe `drizzle-kit@0.18.1`, cioe' un downgrade di tredici versioni minori rispetto alla 0.31.10 installata, e romperebbe le migrazioni. L'avviso su esbuild si chiude da se' quando drizzle-kit aggiornera' la sua catena; nel frattempo non tocca la produzione.

Per il resto le versioni sono recenti e sane: Hono 4.13.7, jose 6.2.12, zod 4.6.2, postgres 3.4.9, React 19.3.0, Vite 7.3.6, Dexie 4.4.6, Workbox 7.4.1. Nessun pacchetto abbandonato.

---

### TMP-13 (Bassa) Rotazione dei refresh token senza rilevamento del riuso

**File:** `apps/api/src/routes/auth.ts:101-129`

**Descrizione.** La rotazione c'e' ed e' fatta bene: il token presentato viene ritirato (`revokedAt`) e se ne emette uno nuovo, i token sono 32 byte casuali (`crypto.ts:52`) e in tabella sta solo lo `sha256`, non il valore. Manca il pezzo che rende utile la rotazione: **la reazione al riuso**.

Oggi, se un token gia' ruotato viene ripresentato, `findFirst` non lo trova (filtra `isNull(revokedAt)`) e la risposta e' un 401 generico. Quel 401 e' l'unico segnale che esista, e nessuno lo raccoglie. Ma un token ritirato che torna significa una cosa sola: o e' stato rubato e l'attaccante lo sta usando dopo la vittima, oppure la vittima lo sta usando dopo l'attaccante. In entrambi i casi la sessione e' compromessa e andrebbe chiusa tutta la famiglia di token di quell'utente.

**Impatto concreto.** Chi ruba un refresh token (accesso fisico al dispositivo, backup del browser, dump di `localStorage`) mantiene l'accesso a tempo indefinito finche' continua a ruotare prima della vittima, e nessuno se ne accorge. Con un TTL di 60 giorni (`env.ts:30`) e' una finestra lunga. Su un'istanza personale la probabilita' e' bassa, ed e' per questo che il rilievo e' basso: ma la correzione costa cinque righe.

**Patch.** Attenzione: questa patch va applicata **insieme** a quella di TMP-14, altrimenti due richieste concorrenti che rinnovano insieme fanno scattare il rilevamento e disconnettono l'utente in buona fede.

`apps/api/src/routes/auth.ts`, sostituire il blocco delle righe 113-115:

```ts
  if (!stored) {
    // Un token che non risulta valido puo' essere semplicemente scaduto, oppure
    // essere un token gia' ruotato che qualcuno sta ripresentando. Nel secondo
    // caso la sessione e' compromessa: si chiude tutta la famiglia, cosi' chi
    // l'ha rubata perde l'accesso e il proprietario se ne accorge subito.
    const riusato = await db.query.refreshTokens.findFirst({
      where: eq(schema.refreshTokens.tokenHash, tokenHash),
    });
    if (riusato) {
      await db.update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(
          eq(schema.refreshTokens.userId, riusato.userId),
          isNull(schema.refreshTokens.revokedAt),
        ));
      console.warn(`Riuso di un refresh token gia' ritirato per l'utente ${riusato.userId}: tutte le sessioni sono state chiuse.`);
    }
    return c.json({ error: 'Sessione non valida, occorre accedere di nuovo' }, 401);
  }
```

`and`, `eq` e `isNull` sono gia' importati alla riga 4.

**Riferimenti:** CWE-613 (Insufficient Session Expiration), OAuth 2.0 Security BCP par. 4.14.2.

---

### TMP-14 (Bassa) Due rinnovi concorrenti disconnettono l'utente

**File:** `apps/web/src/lib/api.ts:61-64,89-105`

**Descrizione.** Bug funzionale con conseguenze sulla sessione, ed e' il prerequisito di TMP-13.

Quando il token di accesso scade, ogni chiamata che riceve 401 invoca `refreshSession` per conto proprio:

```ts
if (response.status === 401 && retry && tokens?.refreshToken) {
  const refreshed = await refreshSession(tokens.refreshToken);
  if (refreshed) return request<T>(path, init, false);
}
```

`runSync` emette `push` in sequenza, ma `AccountPanel` monta `currentAccount()` mentre altrove puo' partire una sincronizzazione, e `installSyncTriggers` (che oggi non e' agganciato da nessuna parte, vedi nota sotto) reagisce sia a `online` sia a `visibilitychange`, che possono scattare a distanza di millisecondi. Due chiamate concorrenti che vanno in 401 chiedono entrambe il rinnovo con lo **stesso** token. La prima lo ruota, la seconda presenta un token ormai ritirato, riceve 401 e fa:

```ts
if (!response.ok) {
  writeTokens(null);   // disconnette l'utente
  return false;
}
```

L'utente viene buttato fuori senza aver fatto niente. Con TMP-13 applicato diventerebbe peggio: verrebbero chiuse anche tutte le sessioni sugli altri dispositivi.

Nota a margine: `installSyncTriggers` (`sync.ts:173-186`) e' esportata ma non richiamata da nessun file. O e' un residuo da rimuovere, o e' un aggancio dimenticato in `App.tsx`. Se si decide di agganciarla, questa patch diventa obbligatoria prima, perche' la concorrenza fra i due trigger e' esattamente lo scenario descritto.

**Patch.** Rinnovo a volo singolo: la prima chiamata lancia il rinnovo, le altre aspettano lo stesso risultato. `apps/web/src/lib/api.ts`, sostituire `refreshSession` (righe 89-105):

```ts
/**
 * Rinnovo a volo singolo: il server ruota il refresh token a ogni uso, quindi
 * due rinnovi concorrenti con lo stesso token ne fanno fallire uno e, con il
 * rilevamento del riuso attivo lato server, chiuderebbero tutte le sessioni.
 */
let refreshInCorso: Promise<boolean> | null = null;

async function refreshSession(refreshToken: string): Promise<boolean> {
  if (refreshInCorso) return refreshInCorso;

  refreshInCorso = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        // Solo un rifiuto esplicito della sessione chiude l'accesso: un errore
        // di rete o un 5xx non devono far perdere il token a chi e' in palestra
        // con mezza tacca di segnale.
        if (response.status === 401 || response.status === 403) writeTokens(null);
        return false;
      }
      storeSession(await response.json() as SessionResponse);
      return true;
    } catch {
      return false;
    } finally {
      refreshInCorso = null;
    }
  })();

  return refreshInCorso;
}
```

Questa versione corregge anche un secondo difetto che c'era gia': oggi qualunque risposta non ok, compreso un 500 o un 503 del server, cancella i token e costringe a riautenticarsi.

**Riferimenti:** CWE-362 (Race Condition), CWE-613.

---

### TMP-15 (Bassa) La chiave del limite di login include l'email

**File:** `apps/api/src/routes/auth.ts:77`

**Descrizione.**

```ts
const limit = await consumeRateLimit(`login:${ip}:${email}`, 10, 900);
```

Il contatore e' per coppia (indirizzo, email). Protegge bene il singolo account dal brute force, ma non esiste nessun contatore per solo indirizzo: da un unico IP si possono tentare 10 password su ciascuno di mille indirizzi diversi, cioe' 10.000 tentativi in 15 minuti, senza mai superare un limite. E' esattamente la forma che ha il credential stuffing reale, dove si prova una password comune su molti account invece di molte password su un account.

Su un'istanza personale con due o tre account il rischio pratico e' basso, da qui la gravita'. Ma e' anche il vettore che alimenta TMP-04: 10.000 tentativi sono 10.000 scrypt da 64 MiB.

**Patch.** Aggiungere un secondo contatore, piu' largo, sul solo indirizzo. `apps/api/src/routes/auth.ts:73-82`:

```ts
authRoutes.post('/login', zValidator('json', credentials), async (c) => {
  const ip = clientIp(c);
  const { email, password } = c.req.valid('json');

  // Due contatori: uno stretto sulla coppia indirizzo/account contro il brute
  // force mirato, uno largo sul solo indirizzo contro lo spraying su molti
  // account, che il primo da solo non vedrebbe mai.
  const perAccount = await consumeRateLimit(`login:${ip}:${email}`, 10, 900);
  const perIndirizzo = await consumeRateLimit(`login-ip:${ip}`, 60, 900);

  if (!perAccount.allowed || !perIndirizzo.allowed) {
    const retryAfter = Math.max(
      perAccount.allowed ? 0 : perAccount.retryAfterSec,
      perIndirizzo.allowed ? 0 : perIndirizzo.retryAfterSec,
    );
    return c.json({ error: 'Troppi tentativi, riprova fra qualche minuto' }, 429, {
      'Retry-After': String(retryAfter),
    });
  }
```

Il `resetRateLimit` alla riga 95 va lasciato com'e': azzera solo il contatore dell'account, che e' giusto, mentre quello per indirizzo deve continuare a contare anche gli accessi riusciti.

Sessanta accessi in 15 minuti da un solo indirizzo sono larghi per un'istanza personale e non danno fastidio nemmeno a una famiglia dietro lo stesso NAT.

**Riferimenti:** CWE-307, OWASP A07:2021.

---

### TMP-16 (Bassa) L'API e' pubblicata su tutte le interfacce dell'host

**File:** `docker-compose.yml:52-53`

**Descrizione.**

```yaml
    ports:
      - '${API_PORT:-3000}:3000'
```

Senza indirizzo, Docker pubblica su `0.0.0.0`, e inoltre scrive direttamente in `iptables`, quindi un firewall gestito con `ufw` sull'host tipicamente **non** blocca questa porta. L'API e' raggiungibile da Internet su `http://IP_DEL_VPS:3000`, in chiaro, senza passare dal reverse proxy.

Da notare il contrasto con il servizio `db`, che e' configurato correttamente (`expose: 5432`, nessun `ports`): il database non e' esposto, e il commento nel file lo dice esplicitamente. La stessa attenzione non e' stata applicata all'API.

**Impatto concreto.** Il proxy che dovrebbe terminare TLS, normalizzare `X-Forwarded-For` (vedi TMP-03) e applicare eventuali limiti viene scavalcato. Le credenziali di login viaggiano in chiaro per chi arriva sulla porta 3000. Ed e' la porta su cui si punta lo script di TMP-04.

**Patch.** `docker-compose.yml`, servizio `api`:

```yaml
    # Solo il reverse proxy deve poter parlare con l'API. Senza indirizzo Docker
    # pubblica su 0.0.0.0 e scrive direttamente in iptables, quindi ufw non la
    # ferma: l'API finirebbe su Internet in chiaro, scavalcando TLS e proxy.
    ports:
      - '127.0.0.1:${API_PORT:-3000}:3000'
```

Se il proxy gira in un container sulla stessa rete Docker (il caso di Coolify o Traefik), la pubblicazione si puo' togliere del tutto e sostituire con `expose`, esattamente come per il database:

```yaml
    expose:
      - '3000'
```

**Riferimenti:** CWE-668 (Exposure of Resource to Wrong Sphere), CIS Docker Benchmark 5.7.

---

### TMP-17 (Bassa) Gli errori vengono registrati grezzi

**File:** `apps/api/src/server.ts:44`

**Descrizione.**

```ts
console.error('Errore non gestito:', error);
```

La risposta al chiamante e' corretta: in produzione esce un messaggio generico, `String(error)` solo fuori produzione, e `NODE_ENV=production` e' fissato sia nel Dockerfile (riga 29) sia nel compose. Su questo il codice fa la cosa giusta.

Il problema e' cosa finisce nel log. `console.error` con l'oggetto errore stampa tutte le proprieta' enumerabili, e gli errori di `postgres.js` ne portano parecchie: `query` con l'SQL completo e `parameters` con i valori associati. Per un fallimento su `insert into documents` i parametri contengono il payload del documento, cioe' anche il profilo con le condizioni di salute. Per un fallimento su `insert into users`, l'hash della password.

I log di un container finiscono nel driver di logging di Docker, vengono raccolti da Coolify e conservati. Non sono lo stesso perimetro del database.

Nota sul `logger()` di Hono (riga 16): registra metodo, percorso **con query string**, stato e durata. Verificato in `node_modules/hono/dist/middleware/logger/index.js`: `url.slice(url.indexOf("/", 8))` include la query. Qui non e' un problema perche' nessun endpoint riceve segreti in query string (l'unico parametro e' `since`, una data), ma e' un vincolo da ricordare se un giorno si aggiungesse un endpoint con un token nell'URL.

**Patch.** `apps/api/src/server.ts:39-49`:

```ts
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  // Si registrano nome, messaggio e stack e nient'altro: gli errori di
  // postgres.js portano con se' le proprieta' query e parameters, e i parametri
  // di una insert su documents contengono i dati dell'utente.
  const dettaglio = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };
  console.error('Errore non gestito:', dettaglio);

  return c.json(
    { error: isProduction ? 'Errore interno del server' : String(error) },
    500,
  );
});
```

**Riferimenti:** CWE-532 (Insertion of Sensitive Information into Log File), CWE-209.

---

### TMP-18 (Bassa) L'importazione di un backup non valida nulla e non gestisce l'errore

**File:** `apps/web/src/features/settings/SettingsPage.tsx:53-66,270-276`

**Descrizione.** Va detto subito, perche' e' la domanda posta: **non e' una vulnerabilita' nel senso classico.** Il file lo sceglie l'utente, non arriva dalla rete; React sfugge tutto quello che stampa e in tutta la PWA non c'e' un solo `dangerouslySetInnerHTML`, `innerHTML` o `eval` (verificato con grep su `apps/web/src`, `apps/api/src` e `packages`); `JSON.parse` non esegue codice. Non c'e' XSS e non c'e' esecuzione.

Quello che c'e' e' un problema di robustezza con conseguenze pratiche fastidiose:

```ts
const importData = async (file: File) => {
  const text = await file.text();
  const payload = JSON.parse(text) as Record<string, unknown[]>;
  ...
  if (payload.profile) await db.profiles.bulkPut(payload.profile as never);
```

1. **Nessuna gestione dell'errore.** Il chiamante e' `onChange={(e) => { const f = e.target.files?.[0]; if (f) void importData(f); }}`. Un file troncato o non JSON fa fallire `JSON.parse`, la promessa viene rifiutata, `void` ne ingoia il risultato e l'utente non vede **niente**: nessun messaggio, nessun "Dati importati", nessun errore. Ha l'impressione che il pulsante non funzioni.
2. **Nessuna validazione della forma.** Un JSON valido ma con struttura sbagliata entra in IndexedDB. Se `profile[0].conditions` non e' un array, `profile.conditions.includes(...)` in `SettingsPage.tsx:70` e in `OnboardingPage` solleva un'eccezione a ogni render: schermata bianca, e senza la console degli sviluppatori l'unico modo per uscirne e' cancellare i dati del sito. Su un telefono, per un utente non tecnico, l'app e' morta.
3. **Nessun controllo delle chiavi primarie.** Un `profile` con `id` diverso da `'me'` (`db.ts:72`) passa: `getProfile()` continua a restituire `undefined`, l'app rimanda all'onboarding e i dati importati restano invisibili in tabella.
4. **Propagazione al server.** Con la sincronizzazione attiva, quello che e' stato importato viene poi spinto sul server alla prima `runSync`. E' l'account dell'utente stesso, quindi non e' una violazione, ma significa che un backup rovinato si propaga.

**Patch.** Validazione minima della forma piu' gestione dell'errore. `apps/web/src/features/settings/SettingsPage.tsx`:

```tsx
  const importData = async (file: File) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(await file.text()) as Record<string, unknown>;
    } catch {
      announce('Il file non e un backup valido di Tempra.');
      return;
    }

    // Controllo minimo di forma: un backup rovinato scritto in IndexedDB manda
    // in errore i render successivi, e da un telefono non c'e' modo di uscirne
    // se non cancellando i dati del sito.
    const righe = (chiave: string): unknown[] =>
      Array.isArray(payload[chiave]) ? (payload[chiave] as unknown[]) : [];
    const conId = (valori: unknown[]): Record<string, unknown>[] =>
      valori.filter((v): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null && typeof (v as { id?: unknown }).id === 'string');

    const profili = conId(righe('profile'))
      .filter((p) => p.id === PROFILE_ID)
      .map((p) => ({ ...p, conditions: Array.isArray(p.conditions) ? p.conditions : [] }));
    const schede = conId(righe('plans'));
    const sedute = conId(righe('sessions'));
    const record = conId(righe('records'));
    const misure = conId(righe('measurements'));
    const impostazioni = conId(righe('settings')).filter((s) => s.id === 'settings');

    const totale = profili.length + schede.length + sedute.length
      + record.length + misure.length + impostazioni.length;
    if (totale === 0) {
      announce('Il file non contiene dati di Tempra da ripristinare.');
      return;
    }

    const tables = [db.profiles, db.plans, db.sessions, db.records, db.measurements, db.settings];
    try {
      await db.transaction('rw', tables, async () => {
        if (profili.length) await db.profiles.bulkPut(profili as never);
        if (schede.length) await db.plans.bulkPut(schede as never);
        if (sedute.length) await db.sessions.bulkPut(sedute as never);
        if (record.length) await db.records.bulkPut(record as never);
        if (misure.length) await db.measurements.bulkPut(misure as never);
        if (impostazioni.length) await db.settings.bulkPut(impostazioni as never);
      });
      announce(`Dati importati: ${totale} elementi.`);
    } catch {
      announce('Ripristino non riuscito. Il backup potrebbe essere danneggiato.');
    }
  };
```

`PROFILE_ID` va aggiunto all'import gia' presente alla riga 9:

```tsx
import { db, getProfile, getSettings, saveSettings, PROFILE_ID } from '../../db/db';
```

E il gestore dell'input va reso esplicito, cosi' scegliere due volte lo stesso file funziona (`apps/web/src/features/settings/SettingsPage.tsx:272-275`):

```tsx
            <input
              type="file" accept="application/json" className="visually-hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                // Azzerare il valore permette di riselezionare lo stesso file.
                e.target.value = '';
                if (f) void importData(f);
              }}
            />
```

**Riferimenti:** CWE-20 (Improper Input Validation), CWE-754 (Improper Check for Unusual or Exceptional Conditions).

---

### TMP-19 (Informativa) Residui in tabella: refresh token ed email nelle chiavi del rate limit

**File:** `apps/api/src/lib/rate-limit.ts`, `apps/api/src/db/schema.ts:40-49`

Due dettagli di igiene, nessuno dei quali e' sfruttabile.

1. **I refresh token non vengono mai eliminati.** `refresh_tokens` accumula una riga per ogni accesso e per ogni rinnovo, con `revokedAt` valorizzato ma senza `DELETE`. Con un TTL di 60 giorni e un rinnovo ogni 15 minuti per dispositivo, la tabella cresce di alcune migliaia di righe al mese e non si ferma. Non e' un rischio di sicurezza, e' manutenzione. La funzione `pruneExpiredRefreshTokens` proposta in TMP-10 la risolve.

2. **Le chiavi del rate limit contengono l'email in chiaro.** `login:1.2.3.4:mario@example.com` finisce nella colonna `key` di `rate_limits`. Combina un identificativo personale con un indirizzo IP in una tabella che nessuno associa ai dati personali, e sopravvive alla cancellazione dell'account (la cascata riguarda `documents` e `refresh_tokens`, non `rate_limits`) fino al `pruneRateLimits` successivo, cioe' fino a un'ora dopo. Se si vuole chiudere anche questo, basta usare un digest:

```ts
// apps/api/src/routes/auth.ts, riga 77
// L'email non va scritta in chiaro in una tabella che non e' legata all'utente
// e che sopravvive alla cancellazione dell'account: il digest conta uguale.
const perAccount = await consumeRateLimit(`login:${ip}:${sha256(email)}`, 10, 900);
```

`sha256` e' gia' importato alla riga 6. Da applicare anche al `resetRateLimit` della riga 95, con la stessa chiave.

---

### TMP-20 (Informativa) Le source map finiscono in produzione

**File:** `apps/web/vite.config.ts:44`

`build.sourcemap: true` genera i `.map` accanto ai bundle, e `dist/` viene copiata integralmente nell'immagine nginx: verificato, `apps/web/dist` contiene `sw.js.map`, `assets/SettingsPage-*.js.map` e tutti gli altri. Sono serviti da `location /`.

Il progetto e' open source, quindi non c'e' proprieta' intellettuale da proteggere e nessun segreto nei sorgenti (verificato con grep: nessuna credenziale hardcoded in `apps`, `packages`, `tools`, `docker`). Resta il fatto che le source map danno a chi guarda i nomi originali, i commenti e la struttura esatta del codice servito, il che accorcia il lavoro di chi cerca un bug. E sono peso servito a ogni visitatore che apra gli strumenti di sviluppo.

Due opzioni, entrambe legittime:

```ts
// apps/web/vite.config.ts:44 - non generarle affatto
    sourcemap: false,
```

oppure, se si vogliono conservare per il debug ma non servire:

```ts
    sourcemap: 'hidden',   // genera i .map senza il commento //# sourceMappingURL
```

piu' il blocco `location ~ \.map$ { return 404; }` gia' incluso nel nginx.conf di TMP-06.

---

### TMP-21 (Informativa) Finestra di 15 minuti dopo la cancellazione dell'account

**File:** `apps/api/src/routes/auth.ts:146-151`, `apps/api/src/lib/auth.ts:23-34`

**La risposta alla domanda posta e' si': `DELETE /api/auth/me` cancella davvero tutto.** Verificato sulla migrazione reale (`apps/api/drizzle/0000_slim_spyke.sql:34-35`): entrambe le chiavi esterne sono dichiarate `ON DELETE cascade`, quindi eliminando la riga di `users` spariscono tutti i `documents` e tutti i `refresh_tokens` di quell'utente. Non restano orfani. L'unico residuo e' nella tabella `rate_limits`, che non ha vincolo verso l'utente (vedi TMP-19).

Restano due dettagli di comportamento:

1. **Il token di accesso sopravvive alla cancellazione.** Il JWT e' stateless e vale fino a `accessTokenTtlSec`, 900 secondi. In quella finestra `GET /api/auth/me` risponde ancora 200 con l'email presa dal payload del token (`auth.ts:141-144` legge da `c.get('user')`, non dal database). Non c'e' esposizione di dati (i documenti sono gia' spariti e `pull` restituisce un elenco vuoto), ma l'account cancellato sembra ancora esistere.
2. **Una push in quella finestra risponde 500.** `insert into documents` con un `user_id` che non esiste piu' viola la chiave esterna, l'eccezione arriva a `app.onError` e diventa un 500. Il messaggio non espone nulla, ma e' un 500 dove sarebbe corretto un 401.

Se si vuole chiudere la finestra, la correzione proporzionata non e' introdurre una blacklist dei JWT (sovradimensionata per questo progetto: aggiungerebbe una lettura al database su ogni richiesta autenticata, cioe' esattamente il costo che l'architettura stateless voleva evitare). Basta far verificare a `requireAuth` l'esistenza dell'utente, oppure accettare la finestra e limitarsi a tradurre l'errore. La seconda e' sufficiente:

```ts
// apps/api/src/lib/auth.ts, dentro requireAuth dopo c.set('user', payload)
```

oppure, ancora piu' semplice, in `apps/api/src/routes/sync.ts` dopo la riga 40:

```ts
/**
 * Il token di accesso e' stateless e resta valido fino a 15 minuti dopo la
 * cancellazione dell'account. Una sola lettura qui trasforma un 500 da chiave
 * esterna violata in un 401 corretto, senza appesantire ogni richiesta con una
 * blacklist dei token.
 */
syncRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  const esiste = await db.query.users.findFirst({
    where: eq(schema.users.id, user.sub),
    columns: { id: true },
  });
  if (!esiste) return c.json({ error: 'Sessione non valida, occorre accedere di nuovo' }, 401);
  await next();
  return undefined;
});
```

Per un'istanza personale va benissimo anche non fare niente e limitarsi a saperlo.

---

### TMP-22 (Informativa) Il backup contiene i dati sanitari senza alcun avviso

**File:** `apps/web/src/features/settings/SettingsPage.tsx:32-51,261-268`

`exportData` scrive in un file JSON tutto il contenuto del database, `db.profiles` compreso, quindi anche `conditions`. Il file si chiama `tempra-backup-2026-09-12.json`, finisce nella cartella Download del dispositivo, ed e' in chiaro. Da li' e' esposto a qualunque backup automatico su cloud, a qualunque app con permesso di lettura sull'archivio, e a chiunque abbia il telefono in mano.

E' il comportamento corretto per un backup e non va cambiato: un export che non contiene tutto non e' un export, e per un'app local-first l'export e' anche l'unica forma di portabilita' dei dati (art. 20 GDPR). Quello che manca e' che l'utente lo sappia.

Il testo attuale della sezione spiega bene perche' fare un backup (*"se cancelli i dati del browser o cambi telefono, senza backup non si recupera nulla"*) ma non cosa ci sia dentro. Basta una frase:

```tsx
// apps/web/src/features/settings/SettingsPage.tsx, dopo il paragrafo alla riga 261-264
          <p className="tiny muted" style={{ margin: 0 }}>
            Il backup contiene tutto, comprese le condizioni di salute che hai
            dichiarato, ed e un file non protetto: conservalo dove conservi i
            documenti personali, non in una cartella condivisa.
          </p>
```

---

## 4. Non e' un problema, ed ecco perche'

Questa sezione conta quanto le altre. Sono cose che in un audit generico verrebbero segnalate, e che qui sono state verificate e sono a posto. Non vanno toccate.

**1. SQL injection nei frammenti `sql` di Drizzle: non c'e'.**
Domanda esplicita della revisione, verificata riga per riga. In `apps/api/src/lib/rate-limit.ts:29-34` le interpolazioni sono `${windowStart.toISOString()}` e `${now.toISOString()}`: il template `sql` di Drizzle distingue i valori JavaScript dai riferimenti alle colonne e trasforma i primi in bind parameter (`$1`, `$2`), esattamente come farebbe una query preparata. I riferimenti come `${schema.rateLimits.windowStart}` diventano identificativi virgolettati generati dallo schema, non testo che arriva dall'esterno. Stessa cosa in `apps/api/src/routes/sync.ts:114-120`, dove `excluded.payload` e compagnia sono frammenti SQL statici scritti a mano nel sorgente: non contengono un solo byte di input. E in `sync.ts:143-145`, `count(*)::int` e `pg_column_size(...)` sono costanti. Non esiste in tutto il progetto un punto in cui un nome di tabella, di colonna o una direzione di ordinamento provenga dal client, che e' anche il motivo per cui l'avviso su drizzle-orm (TMP-12) non e' sfruttabile qui.

**2. IDOR nella sincronizzazione: non c'e', e non e' aggirabile.**
L'altra domanda esplicita, e la risposta e' pulita. Tutte e tre le rotte filtrano sull'identita' presa dal JWT verificato, mai da un parametro:
- `pull` (`sync.ts:55`): `eq(schema.documents.userId, user.sub)` e' la prima condizione e non e' condizionale;
- `push` (`sync.ts:104`): `userId: user.sub` e' scritto dal server, il client non puo' proporre un `userId`, e lo schema zod (righe 24-30) non ha nemmeno un campo per farlo;
- `status` (`sync.ts:148`): stesso filtro.

Non esiste un endpoint che accetti un identificativo di utente. Non c'e' route model binding, non c'e' un `/documents/:id` che possa essere forzato. Il vettore andrebbe cercato altrove, e non c'e'.

**3. Gli identificativi dei documenti generati dal client: non sono un problema.**
Domanda posta esplicitamente. Il timore naturale e' che un client possa dichiarare l'id di un documento altrui per leggerlo o sovrascriverlo. Non funziona, per una ragione strutturale: l'unicita' e' definita sulla **coppia**, non sull'id.

```sql
CREATE UNIQUE INDEX "documents_user_id_unique" ON "documents" USING btree ("user_id","id");
```

Il `target: [schema.documents.userId, schema.documents.id]` della `onConflictDoUpdate` (`sync.ts:112`) corrisponde a quell'indice. Quindi un `insert` con un id scelto ad arte puo' entrare in conflitto **solo** con una riga che ha lo stesso `user_id`, che e' sempre quello di chi sta chiamando. Il caso "scrivo il documento `plan_abc` di un altro" produce semplicemente una riga nuova nel proprio spazio. L'id generato dal client e' esattamente quello che serve a un'app local-first per riconciliare senza chiedere il permesso al server, e qui e' implementato nel modo giusto: validato per lunghezza (`max(128)`, `sync.ts:25`) e reso innocuo dall'indice composto. Va lasciato com'e'.

**4. La clausola `where` di `onConflictDoUpdate`: e' corretta.**

```ts
where: sql`${schema.documents.updatedAt} < excluded.updated_at`
```

In Postgres il `WHERE` di un `ON CONFLICT DO UPDATE` valuta la riga esistente contro `excluded`, che e' la riga proposta. Il rendering e' `"documents"."updated_at" < excluded.updated_at`, che e' la semantica voluta: si aggiorna solo se la copia in arrivo e' piu' recente. Il `.returning()` vuoto quando la condizione e' falsa alimenta correttamente l'elenco `skipped`. Nessun input utente entra in questo frammento.

**5. CSRF sull'API: non e' possibile.**
L'autenticazione e' un Bearer token in un header (`api.ts:57`), non un cookie, e `credentials: false` nel CORS (`server.ts:25`). Un form cross-site non puo' impostare l'header `Authorization`; una `fetch` cross-site che lo imposta fa scattare la preflight, che la politica CORS nega perche' `origin` e' un array di origini esatte. Aggiungere token CSRF qui sarebbe lavoro inutile su un problema che non esiste.

**6. La configurazione CORS e' corretta.**
Verificata nel codice della libreria installata (`node_modules/hono/dist/middleware/cors/index.js`): con `origin` passato come array, Hono confronta con `includes` e restituisce `null` se l'origine non e' nell'elenco, quindi l'header `Access-Control-Allow-Origin` non viene proprio emesso. Nessun riflesso dell'`Origin` ricevuto, nessun `*`, nessuna combinazione `*` con credenziali. L'unica accortezza da avere e' che `ALLOWED_ORIGINS` deve essere impostata davvero: il valore predefinito e' `http://localhost:5173` (`env.ts:25`), mentre il compose passa `http://localhost:8080`. Coerente, ma in produzione va messo il dominio vero.

**7. Confusione di algoritmo sul JWT (`alg: none`, HS256 contro RS256): non e' possibile.**
`jose` deriva gli algoritmi ammessi dal tipo di chiave. Qui la chiave e' una `Uint8Array` (`auth.ts:5`), quindi la verifica accetta solo HMAC: un token con `alg: none` o firmato con una chiave asimmetrica viene rifiutato prima ancora di guardare il payload. Sono validati anche `issuer` e `audience` (`auth.ts:26-27`), e la scadenza e' verificata da `jwtVerify` per costruzione. Aggiungere `algorithms: ['HS256']` alle opzioni e' gratis e lo consiglio come cintura di sicurezza, ma non c'e' un buco da chiudere.

**8. Il token in localStorage: qui il rischio e' accettabile, e spostarlo sarebbe peggio.**
Domanda posta esplicitamente, quindi vale la pena argomentare invece di ripetere lo slogan.

Il rischio del `localStorage` e' uno solo: un XSS legge il token. Quindi la domanda vera e' quanto sia probabile un XSS in questa applicazione. Verificato: zero `dangerouslySetInnerHTML`, zero `innerHTML`, zero `eval`, zero `new Function`, zero `document.write` in tutto `apps/web/src`. Nessuno script di terze parti (nessun analytics, nessun tag manager, nessun font remoto: i due woff2 sono serviti da `/fonts/`). Nessun contenuto generato da altri utenti, perche' non c'e' condivisione. Le uniche stringhe che l'utente inserisce (nome di una scheda, note) passano da JSX, che sfugge tutto. L'unico ingresso esterno e' il backup JSON, che React stampa come testo.

E le alternative non sono gratis. Un cookie `httpOnly` dovrebbe essere impostato da `api.tempra.example` per essere letto su `tempra.example`: serve un cookie di dominio padre, `SameSite=None` per l'uso cross-site, `credentials: 'include'` in tutte le chiamate, e a quel punto **si apre il CSRF che oggi non esiste** (punto 5), che va richiuso con token anti-CSRF o con un controllo di `Origin`. Si sostituisce un rischio ipotetico con un rischio reale e con parecchio codice nuovo.

La difesa giusta per questo scenario e' quella che oggi manca ed e' TMP-07: una CSP che impedisca a un ipotetico script iniettato di caricarsi e di esfiltrare. Con `default-src 'self'` e `connect-src` ristretto, anche riuscendo a eseguire qualcosa non lo si porta da nessuna parte. **Consiglio: lasciare i token in localStorage e mettere la CSP.**

**9. La difesa contro il timing sul login e' implementata correttamente.**
`DUMMY_HASH` (`auth.ts:16-18`) ha esattamente i parametri degli hash reali (`scrypt$65536$8$2$` con salt di 16 byte e digest di 64), quindi `verifyPassword` esegue lo stesso calcolo con lo stesso costo quando l'utente non esiste. Verificato che `verifyPassword` legga N, r e p dalla stringa (`crypto.ts:41-43`), quindi i tempi coincidono davvero, e che il test `crypto.test.ts:27-31` copra il caso. E' un dettaglio che viene sbagliato quasi sempre, e qui e' giusto.

**10. Il confronto delle password e' a tempo costante, e nel modo giusto.**
`derived.length === expected.length && timingSafeEqual(derived, expected)` (`crypto.ts:46`): il controllo di lunghezza prima e' obbligatorio, perche' `timingSafeEqual` solleva un'eccezione se i buffer differiscono. Ordine corretto. E `verifyPassword` valida la forma della stringa prima di usarla (`crypto.ts:35`), con il test che lo copre (righe 33-37).

**11. I refresh token non sono conservati in chiaro.**
In tabella c'e' `sha256(token)` (`auth.ts:36,103,136`), non il token. Un dump del database non restituisce sessioni utilizzabili. Per un token di 32 byte casuali, SHA-256 senza salt e' la scelta corretta: non e' una password, non e' attaccabile con un dizionario, e usare qui un KDF lento significherebbe solo pagare un costo a ogni rinnovo.

**12. La generazione dei valori casuali usa una fonte crittografica ovunque.**
`randomBytes` da `node:crypto` per salt, token e identificativi (`crypto.ts:28,52,55`). Nessun `Math.random()` in nulla che abbia rilevanza per la sicurezza.

**13. Il database non e' esposto, e i container non girano da root.**
`db` ha solo `expose: 5432` e nessun `ports`: raggiungibile solo dalla rete Docker interna. L'API gira come `node` (`apps/api/Dockerfile:45`), nginx come `nginx` sulla porta 8080 (`apps/web/Dockerfile:47`), entrambe porte non privilegiate. Nessun segreto nei layer: verificato che i Dockerfile non facciano `COPY` di `.env` e che `.dockerignore` lo escluda esplicitamente insieme a `.env.*`. Le immagini di runtime non contengono sorgenti ne' toolchain (multi-stage con `npm ci --omit=dev`). Entrambi hanno `HEALTHCHECK` e quello dell'API interroga davvero l'endpoint `/health`, che a sua volta verifica il database (`server.ts:29-32`). E' una configurazione Docker migliore della media.

**14. L'endpoint `/health` non espone niente di utile.**
`{ status, database }`. Nessuna versione, nessun percorso, nessun conteggio, nessun dato di configurazione. Va bene cosi'.

**15. Avvelenamento del service worker: lo scenario non si apre.**
`sw.js` e' servito con `no-cache, must-revalidate` (`nginx.conf:47-51`), il precache di Workbox e' costruito su un manifesto con impronta del contenuto, e l'aggiornamento non e' mai forzato (`sw.ts:58-60`, `UpdatePrompt.tsx`) ma richiede un gesto dell'utente. Per avvelenare la cache bisognerebbe gia' controllare l'origine, e a quel punto il service worker e' l'ultimo dei problemi. La strategia `CacheFirst` sulle immagini degli esercizi e sui font e' corretta (risorse statiche, pubbliche, immutabili). L'unica regola sbagliata e' quella sull'API, ed e' TMP-02.

**16. Compressione e segreti nella stessa risposta (BREACH): non applicabile.**
`compress()` e' attivo su tutte le rotte (`server.ts:18`) e la risposta del login contiene il token di accesso insieme a valori che il chiamante ha scelto. BREACH pero' richiede che l'attaccante possa far emettere al **browser della vittima** richieste autenticate cross-origin, e qui non puo': l'autenticazione e' un header Bearer, non un cookie, quindi nessuna richiesta parte autenticata per conto della vittima. L'attacco non si monta.

**17. Il pannello account non rivela l'esistenza di un account in modo diverso dall'API.**
`AccountPanel.tsx:56-58` mostra il messaggio che arriva dal server, senza aggiungere distinzioni proprie. L'enumerazione di TMP-09 nasce nell'API, non qui.

**18. La cancellazione dell'account rimuove davvero tutto sul server.**
Verificato sulla migrazione, non sulla dichiarazione TypeScript: `ON DELETE cascade` su entrambe le chiavi esterne (dettagli e unica eccezione in TMP-21 e TMP-19).

**19. Le immagini degli esercizi non costruiscono percorsi da input.**
`ExerciseImage.tsx:52-53` compone `/img/ex/` con `exercise.id`, che viene dal catalogo statico incluso nel bundle (`packages/core/src/data/exercises.json`), non da dati dell'utente. Nessun path traversal possibile, e nginx serve quella cartella con `try_files $uri =404`.

**20. Nessun segreto nel codice.**
Grep su `apps`, `packages`, `tools`, `docker` per assegnazioni di stringhe a variabili chiamate secret, password, token, apikey: nessun risultato. Nessun file `.env` presente nel repository, solo `.env.example`, correttamente privo di valori. `.gitignore` e `.dockerignore` escludono entrambi `.env`.

---

## 5. Content-Security-Policy completa per nginx

Policy calibrata su questa PWA: React 19 in build di produzione (nessun `eval`, nessuna `new Function`), Tailwind 4 compilato in un file CSS, font WOFF2 locali sotto `/fonts/`, immagini locali sotto `/img/`, un service worker, e l'API su un sottodominio diverso.

**File `apps/web/security-headers.conf`** (incluso in ogni `location`, vedi TMP-06):

```nginx
# In nginx add_header non si eredita: un solo add_header dentro un location
# azzera tutti quelli del blocco server. Queste direttive vanno quindi incluse
# in ogni location che ne abbia uno proprio.

add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;

# Content-Security-Policy
#
# script-src: l'hash copre l'unico script inline della pagina, quello che applica
#   il tema prima del primo paint (index.html righe 18-31). Se quello script
#   viene modificato, anche di uno spazio, l'hash va ricalcolato o la pagina
#   resta senza tema. Vedi sotto per come toglierlo di mezzo del tutto.
# style-src: 'unsafe-inline' serve per gli attributi style= dei componenti React
#   (style={{...}} in AppShell, SettingsPage e altri). Non e' aggirabile senza
#   riscrivere quei componenti con classi CSS; il rischio residuo e' molto basso,
#   perche' con script-src chiuso l'iniezione di solo CSS non porta lontano.
# connect-src: 'self' per il precache e il manifest, piu' l'origine dell'API.
#   Sostituire https://api.tempra.example con VITE_API_URL. Se l'installazione
#   non usa la sincronizzazione, lasciare solo 'self'.
# img-src: data: serve per le icone inline di lucide-react in alcuni percorsi
#   di rendering; se si verifica che non servono, si puo' togliere.
# worker-src: il service worker si registra dalla stessa origine.
# upgrade-insecure-requests: da tenere solo se l'istanza e' servita in HTTPS.
add_header Content-Security-Policy "default-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'sha256-i/1R4B22SrmTFib/4GjxP00QLYbbrdgGa0xgueUpp6A='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.tempra.example; worker-src 'self'; manifest-src 'self'; media-src 'none'; upgrade-insecure-requests" always;
```

**L'hash e' reale e verificato.** `sha256-i/1R4B22SrmTFib/4GjxP00QLYbbrdgGa0xgueUpp6A=` e' stato calcolato sui byte esatti fra `<script>` e `</script>` di `apps/web/index.html`, ed e' stato confrontato con quelli di `apps/web/dist/index.html` prodotto dalla build corrente: coincidono, perche' Vite copia lo script inline senza toccarlo. Per ricalcolarlo dopo una modifica:

```bash
python3 - <<'EOF'
import re, hashlib, base64
h = open('apps/web/index.html', encoding='utf-8').read()
m = re.search(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', h, re.S)
print("sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode())
EOF
```

**Alternativa consigliata: togliere l'hash dal problema.** Un hash da mantenere sincronizzato a mano e' una trappola: chi tocchera' quello script fra sei mesi non pensera' alla CSP, e il tema si rompera' in silenzio. Spostare lo script in un file serve a rendere la policy immutabile.

Creare `apps/web/public/theme-init.js` con il contenuto oggi inline:

```js
// Applica il tema salvato prima del primo paint, per evitare il lampo di tema sbagliato.
(function () {
  try {
    var t = localStorage.getItem('tempra.theme') || 'dark';
    var resolved = t === 'system'
      ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : t;
    document.documentElement.dataset.theme = resolved;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
```

sostituire in `apps/web/index.html` le righe 18-31 con:

```html
    <script src="/theme-init.js"></script>
```

e semplificare la direttiva a `script-src 'self'`. Lo script e' minuscolo e sincrono, viene servito dalla stessa origine ed entra nel precache del service worker (`globPatterns` include `**/*.js`), quindi non introduce latenza percepibile ne' un lampo di tema.

**Se l'origine dell'API deve variare per installazione**, l'immagine ufficiale di nginx sostituisce le variabili nei file sotto `/etc/nginx/templates/`. Rinominare il file in `security-headers.conf.template`, usare `${API_ORIGIN}` al posto del dominio e passare `API_ORIGIN` e `NGINX_ENVSUBST_FILTER=^API_ORIGIN$` nell'ambiente del container. Il filtro e' importante: senza, envsubst tenterebbe di sostituire anche `$uri` e `$host` di nginx.

**Verifica dopo il deploy:**

```bash
curl -sI https://tempra.example/ | grep -i content-security-policy
```

Poi aprire l'app e controllare che la console non riporti violazioni. I tre punti da guardare per primi sono: il tema applicato al primo caricamento (script inline), il download del backup (`blob:` creato da `URL.createObjectURL`) e la registrazione del service worker.

Se si preferisce non rischiare una rottura in produzione, distribuire prima la policy in sola osservazione, leggere per qualche giorno e poi passare a quella vincolante:

```nginx
add_header Content-Security-Policy-Report-Only "... la stessa policy ..." always;
```

---

## 6. Checklist di hardening pre-produzione

### Da fare prima di esporre l'istanza su Internet

- [ ] **TMP-01** Applicare la rimozione delle condizioni di salute dalla sincronizzazione, oppure correggere i due testi che oggi dicono il falso. Non mettere online l'istanza con entrambi i problemi aperti.
- [ ] **TMP-02** Sostituire la regola del service worker sull'API con `NetworkOnly` e cancellare la cache `tempra-api` esistente all'attivazione.
- [ ] **TMP-03** Sostituire `clientIp` con la versione basata sul socket e su `TRUSTED_PROXY_COUNT`; impostare la variabile secondo la topologia reale (1 dietro Coolify o Traefik).
- [ ] **TMP-04** Aggiungere il semaforo sullo scrypt e la traduzione in 503.
- [ ] **TMP-05** Aggiungere `bodyLimit` su `/api/auth/*` e `/api/sync/*`.
- [ ] **TMP-06 e TMP-07** Portare le intestazioni in `security-headers.conf`, includerlo in ogni `location`, aggiungere la CSP.
- [ ] **TMP-08** Generare `JWT_SECRET` con `openssl rand -base64 48` e attivare il controllo di lunghezza minima.
- [ ] **TMP-16** Legare la porta dell'API a `127.0.0.1`, oppure sostituire `ports` con `expose` se il proxy e' sulla stessa rete Docker.

### Configurazione dell'ambiente

- [ ] `POSTGRES_PASSWORD` generata con `openssl rand -base64 24`, mai un valore ricordato a memoria.
- [ ] `ALLOWED_ORIGINS` impostata sul dominio reale della PWA, senza barra finale e senza `*`.
- [ ] `REGISTRATION_OPEN=false` dopo aver creato i propri account (TMP-09).
- [ ] `VITE_API_URL` con lo schema `https://`, e coerente con `connect-src` della CSP.
- [ ] `NODE_ENV=production` (gia' fissato nel Dockerfile e nel compose: verificare che non venga sovrascritto dal pannello di deploy).
- [ ] Il file `.env` non versionato e con permessi `600` sul VPS.

### Superficie di rete

- [ ] TLS terminato dal reverse proxy sia per la PWA sia per l'API; nessun accesso in chiaro.
- [ ] HSTS attivo sul proxy (l'API lo manda gia' via `secureHeaders()`, ma deve arrivare anche dal front).
- [ ] Porta 5432 non raggiungibile dall'esterno: verificare con `nmap -p 3000,5432,8080 IP_DEL_VPS` da una rete esterna, non dal VPS stesso.
- [ ] Un limite di richieste anche a livello di proxy su `/api/auth/*`: e' la rete di sicurezza se l'applicazione va giu' o se `TRUSTED_PROXY_COUNT` viene configurato male.

### Dati e conformita'

- [ ] **TMP-10** Purga dei documenti cancellati e dei refresh token scaduti agganciata al timer esistente.
- [ ] **TMP-11** "Cancella tutti i dati" ripulisce anche token, cursore e cache.
- [ ] **TMP-22** Avviso sul contenuto del backup.
- [ ] Backup del volume `db-data` cifrato a riposo. Contiene dati ex art. 9: un dump `pg_dump` lasciato nella home del VPS e' un incidente in attesa.
- [ ] Se l'istanza serve persone diverse dall'amministratore, serve un'informativa ex art. 13 che dica chi tratta i dati, dove stanno, per quanto e come si esercita la cancellazione. Per un'istanza strettamente personale non serve (art. 2.2.c, trattamento a fini esclusivamente personali).

Cosa **non** serve, per essere espliciti su dove non spendere tempo: un WAF, un SIEM, la cifratura a livello di colonna su Postgres, l'autenticazione a due fattori, una blacklist dei JWT, token CSRF, rotazione automatica delle chiavi, un registro degli accessi immutabile. Sono misure sensate per un SaaS multi-tenant con migliaia di utenti e un obbligo contrattuale; su una istanza personale aggiungono complessita', punti di rottura e manutenzione, e non riducono nessuno dei rischi trovati in questa revisione.

### Manutenzione continua

- [ ] `npm audit --omit=dev` nella pipeline, con fallimento su gravita' alta o critica.
- [ ] **TMP-12** `drizzle-orm` portata a `^0.45.2`, con verifica manuale delle due `onConflictDoUpdate`.
- [ ] Immagini di base aggiornate periodicamente: `node:22-alpine` e `postgres:17-alpine` sono attuali oggi, ma vanno ricostruite per ricevere le patch della distribuzione. Scansione con `trivy image` prima di ogni rilascio.
- [ ] `docker compose logs api | grep -i "riuso di un refresh token"` fra i controlli periodici, una volta applicato TMP-13: e' l'unico segnale che qualcuno abbia rubato una sessione.

### Verifiche rapide dopo il deploy

```bash
# Le intestazioni ci sono su tutti i percorsi, non solo su /
for p in / /index.html /sw.js /manifest.webmanifest; do
  echo "== $p"; curl -sI "https://tempra.example$p" | grep -icE "content-security-policy|x-frame|nosniff"
done

# La limitazione non si aggira piu' forgiando l'header
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://api.tempra.example/api/auth/login \
    -H 'Content-Type: application/json' -H "X-Forwarded-For: 10.0.0.$i" \
    -d '{"email":"prova@example.com","password":"unapasswordqualsiasi"}'
done; echo   # ci si aspettano dei 429 dopo i primi tentativi

# Il corpo oltre il limite viene rifiutato senza essere letto
head -c 20000000 /dev/zero | tr '\0' 'a' | \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.tempra.example/api/auth/login \
  -H 'Content-Type: application/json' --data-binary @-   # atteso 413

# L'API non risponde fuori dal proxy
curl -sS --max-time 5 http://IP_DEL_VPS:3000/health   # atteso: connessione rifiutata

# Nessuna risposta dell'API resta in cache nel browser
# (console dell'app, dopo aver sincronizzato)
#   (await caches.keys()).filter(n => n.includes('api'))   // atteso: []
```

---

## Nota conclusiva

Il progetto e' scritto bene e con criterio: i commenti nel codice spiegano il *perche'* delle scelte, non il *cosa*, e nella maggior parte dei casi il ragionamento e' corretto (i parametri scrypt, l'hash fittizio contro il timing, il cursore basato sull'orologio del server, l'indice unico sulla coppia utente/documento, la scelta di non esporre il database). Le vulnerabilita' trovate non nascono da ignoranza: nascono da tre punti in cui l'intenzione dichiarata e il comportamento del codice si sono separati, e nessuno se n'e' accorto perche' in tutti e tre i casi il commento descriveva l'intenzione.

I tre punti sono: il testo che promette che i dati sanitari non lasciano il dispositivo mentre la sincronizzazione li invia; il commento su `/register` che dice di non confermare l'esistenza di un indirizzo mentre lo stato HTTP la conferma; e `clientIp`, che dice "tenendo conto del proxy che sta davanti al servizio" mentre in realta' si fida del client. Vale la pena tenerlo presente come schema, oltre che come elenco di correzioni: quando il commento e il codice divergono, e' il commento che continua a dire la verita' a chi legge, e il codice che fa un'altra cosa in silenzio.

---

## Appendice: stato delle correzioni

Aggiornata il 12 settembre 2026, subito dopo la consegna del rapporto.

| ID | Gravita | Stato | Come e' stato risolto |
|---|---|---|---|
| TMP-01 | Alta | **Corretto** | `redactHealthData()` in `apps/web/src/lib/sync.ts` toglie le condizioni dal profilo prima dell'invio, e il ritorno dal server non sovrascrive mai quelle locali. `runSync()` ora verifica `settings.syncEnabled`. La promessa dell'interfaccia e' mantenuta dal codice, non dalla buona volonta'. |
| TMP-02 | Alta | **Corretto** | La regola di cache su `/api/` e' stata rimossa dal service worker: le risposte dell'API non entrano piu' in Cache Storage. Aggiunta `clearCaches()` invocata all'uscita, alla cancellazione dell'account e a "Cancella tutti i dati", che svuota anche localStorage e sessionStorage. |
| TMP-03 | Alta | **Corretto** | `clientIp()` prende l'N-esimo valore **da destra** di `X-Forwarded-For`, dove N e' `TRUSTED_PROXY_HOPS` (predefinito 1, configurabile, 0 per ignorare del tutto l'intestazione). Senza intestazione attendibile si usa l'indirizzo della connessione. Il valore viene troncato a 45 caratteri. Verificato: sette registrazioni con primo valore falsificato sempre diverso e ultimo uguale danno 201, 201, 201, 201, 201, 429, 429. |
| TMP-04 | Alta | **Corretto** | Semaforo sui calcoli di hash in `apps/web/../api/src/lib/crypto.ts`: al massimo `MAX_CONCURRENT_HASHES` (predefinito 2) scrypt in parallelo, gli altri si accodano. Aggiunta anche la convalida dei parametri letti dall'hash memorizzato, perche' un valore di N fuori scala sarebbe a sua volta un modo per esaurire la memoria. Due test coprono entrambi i casi. |
| TMP-06 / TMP-07 | Media | **Corretto** | Content-Security-Policy completa servita da nginx. Lo script in linea del tema e' stato spostato in `/theme-init.js`, cosi' `script-src 'self'` basta e non c'e' nessun hash da mantenere a ogni modifica. L'origine dell'API entra in `connect-src` tramite la variabile `API_ORIGIN`, sostituita all'avvio del container con il meccanismo dei template dell'immagine nginx. Aggiunta anche una CSP restrittiva sulle risposte dell'API. |
| TMP-05 (dipendenze) | Media | **Corretto** | `drizzle-orm` aggiornato a 0.45.2. `npm audit --omit=dev` riporta ora **zero vulnerabilita**. |

Sono inoltre state applicate le correzioni emerse dall'analisi per il deploy:

- le password del database si generano in esadecimale e non in base64, perche' i caratteri `/`, `+` e `$` rompono `DATABASE_URL` e l'interpolazione di docker compose;
- gli `add_header` dentro i blocchi `location` di nginx azzeravano le intestazioni di sicurezza ereditate: il valore di `Cache-Control` si decide ora con una `map`, e le intestazioni restano definite una volta sola a livello di server;
- il `chown -R` sui 26 MB di immagini creava un secondo livello inutile nell'immagine: la proprieta' si imposta durante la copia;
- le mappe dei sorgenti non vengono piu' pubblicate in produzione.

Restano aperti per scelta i rilievi di gravita' bassa e informativa elencati sopra,
che nel contesto di una installazione personale non giustificano la complessita'
aggiuntiva. Sono documentati perche' la valutazione possa essere rifatta se il
progetto dovesse diventare un servizio multiutente.
