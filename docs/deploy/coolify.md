# Deploy di Tempra su Coolify

Guida operativa per portare Tempra online su una istanza Coolify (VPS con Docker
e proxy Traefik gestito da Coolify).

Tempra e' un monorepo npm workspaces con tre pezzi:

| Pezzo | Cartella | Cosa e' |
| --- | --- | --- |
| `@tempra/web` | `apps/web` | La PWA: build Vite servita da nginx sulla porta **8080** |
| `@tempra/api` | `apps/api` | API Hono su Node 22, porta **3000**, migrazioni Drizzle all'avvio |
| `@tempra/core` | `packages/core` | Libreria condivisa, consumata come sorgente TypeScript |

**Il punto piu' importante da capire prima di iniziare:** la PWA funziona
completamente offline e senza backend. Il database e l'API servono solo alla
sincronizzazione opzionale fra dispositivi. Esistono quindi due scenari di
deploy, e lo scenario A (solo PWA) e' molto piu' semplice.

---

## Indice

1. [Prerequisiti](#1-prerequisiti)
2. [Scegliere lo scenario](#2-scegliere-lo-scenario)
3. [Scenario A: solo PWA](#3-scenario-a-solo-pwa)
4. [Scenario B: stack completo con sincronizzazione](#4-scenario-b-stack-completo-con-sincronizzazione)
5. [Generare i segreti](#5-generare-i-segreti)
6. [Tabella delle variabili d'ambiente](#6-tabella-delle-variabili-dambiente)
7. [Domini e certificati](#7-domini-e-certificati)
8. [Il service worker e il proxy](#8-il-service-worker-e-il-proxy)
9. [Healthcheck e verifiche dopo il primo deploy](#9-healthcheck-e-verifiche-dopo-il-primo-deploy)
10. [Aggiornare il deploy](#10-aggiornare-il-deploy)
11. [Backup e ripristino del database](#11-backup-e-ripristino-del-database)
12. [Modifiche necessarie ai file esistenti](#12-modifiche-necessarie-ai-file-esistenti)
13. [Troubleshooting](#13-troubleshooting)
14. [Checklist finale post-deploy](#14-checklist-finale-post-deploy)

---

## 1. Prerequisiti

### Sul proprio computer

- `git`, `gh` (GitHub CLI) autenticato, `openssl`, `docker` con Buildx.
- Node 22 (`.nvmrc` dice `22`) se si vuole provare il build in locale.

### Il repository

**Aggiornamento: il repository esiste ed e' pubblico**, su
`https://github.com/cpibia/tempra`, branch di deploy `main`. I passi di
inizializzazione qui sotto restano validi solo per una copia nuova del progetto.
Essendo il repository pubblico, su Coolify si sceglie la sorgente
*Public Repository* e non serve nessuna deploy key.

Prima di tutto, verificare che non ci siano segreti da tracciare:

```bash
cd /percorso/del/progetto
git init
git add -A
git ls-files | grep -iE "\.env$|\.env\.|secret|credential|\.pem$|\.key$"
```

Il comando non deve restituire nulla. `.gitignore` esclude gia' `.env`,
`node_modules/`, `dist/`, `db-exercise/` e `data/source-batches/`.

Poi:

```bash
git commit -m "Primo import di Tempra"
git branch -M main
gh repo create cpibia/tempra --private --source=. --remote=origin --push
```

Il branch di deploy e' `main`. Se in futuro si passa a GitFlow, ricordare che
Coolify deploya il branch configurato e non `develop`: un commit su `develop`
non produce nessun deploy.

### Sul server Coolify

- Coolify installato e funzionante, con il proxy Traefik attivo.
- Un record DNS `A` (o `AAAA`) che punta all'IP del server, per ogni dominio che
  si intende usare.
- La porta 80 e la 443 aperte in ingresso: servono a Let's Encrypt per la
  validazione HTTP-01.
- RAM libera: il build della PWA e' la parte piu' pesante. Con 7,6 GB di RAM
  totali non ci sono problemi se non si lanciano deploy in parallelo.

### Peso del build

Il contesto di build effettivo, dopo `.dockerignore`, e' di circa **29 MB**, di
cui 26 MB sono le 2.619 immagini degli esercizi in `apps/web/public/img/ex/`.
Non serve nessun volume: le immagini sono dentro l'immagine Docker e vengono
servite da nginx come file statici.

---

## 2. Scegliere lo scenario

| | Scenario A | Scenario B |
| --- | --- | --- |
| Cosa gira | solo `web` | `web` + `api` + `db` |
| Domini necessari | 1 | 2 (consigliato) |
| Build pack Coolify | **Dockerfile** | **Docker Compose** |
| File di deploy | `apps/web/Dockerfile` | `docker-compose.coolify.yml` |
| Segreti da gestire | nessuno | `POSTGRES_PASSWORD`, `JWT_SECRET` |
| Backup da fare | nessuno | sì, il volume Postgres |
| Dati dell'utente | solo su IndexedDB del dispositivo | anche sul server |

Si puo' partire dallo scenario A e passare al B in seguito: i dati gia' presenti
sul dispositivo non si perdono, ma **il passaggio richiede un nuovo build della
PWA**, perche' `VITE_API_URL` entra nel bundle JavaScript in fase di build.

---

## 3. Scenario A: solo PWA

Nessun database, nessuna API, nessun segreto. Un solo container nginx.

### A.1 Creare l'applicazione

Su Coolify: **Project > Environment > + New > Public Repository** (o *Private
Repository (with deploy key)* se il repo e' privato).

Configurazione:

| Campo | Valore |
| --- | --- |
| Repository | `https://github.com/cpibia/tempra` (o la forma SSH per repo privati) |
| Branch | `main` |
| Build Pack | `Dockerfile` |
| Base Directory | `/` |
| Dockerfile Location | `/apps/web/Dockerfile` |
| Ports Exposes | `8080` |
| Domains | `https://tempra.dominio.it` |

**Base Directory deve restare `/`.** Il Dockerfile della PWA si aspetta il
contesto alla radice del monorepo, perche' copia sia `packages/core` sia
`apps/web`. Se si imposta `/apps/web` come base directory il build fallisce
subito con `COPY package.json: not found`.

### A.2 Repository privato: deploy key

GitHub non accetta la stessa chiave su due repository, quindi serve una coppia
di chiavi dedicata a questo repo:

```bash
ssh-keygen -t ed25519 -N "" -f /tmp/tempra_deploy -C "coolify tempra"
gh api repos/cpibia/tempra/keys -X POST \
  -f title="Coolify deploy" \
  -f key="$(cat /tmp/tempra_deploy.pub)" \
  -F read_only=true
```

La chiave privata (`/tmp/tempra_deploy`) va incollata in Coolify sotto
**Keys & Tokens > Private Keys**, poi selezionata nella configurazione
dell'applicazione. Cancellare i file temporanei subito dopo.

### A.3 Variabile di build

Nello scenario A `VITE_API_URL` **deve restare vuota**. Non e' necessario
crearla: il `Dockerfile` ha gia' `ARG VITE_API_URL=""` e il client
(`apps/web/src/lib/api.ts`) disattiva tutta la parte di sincronizzazione quando
la stringa e' vuota:

```ts
export const isSyncConfigured = (): boolean => BASE_URL.length > 0;
```

Se si crea la variabile per errore con un valore qualunque, l'interfaccia mostra
una schermata di login verso un server che non esiste.

### A.4 Deploy

Premere **Deploy**. Il primo build richiede indicativamente 4-8 minuti sul VPS
(npm ci della PWA, build Vite, copia dei 26 MB di immagini).

### A.5 Verifica

```bash
curl -sI https://tempra.dominio.it/health
curl -s https://tempra.dominio.it/ | grep -o '<title>[^<]*</title>'
curl -sI https://tempra.dominio.it/sw.js | grep -i cache-control
curl -sI https://tempra.dominio.it/manifest.webmanifest | grep -i content-type
```

Attesi: `200` su `/health` con corpo `ok`, `<title>Tempra</title>`,
`Cache-Control: no-cache, must-revalidate` su `/sw.js`, content type
`application/manifest+json` sul manifest.

---

## 4. Scenario B: stack completo con sincronizzazione

Tre servizi: `db` (Postgres 17), `api` (Hono), `web` (nginx). Si usa il build
pack **Docker Compose** con il file `docker-compose.coolify.yml` fornito insieme
a questa guida.

### 4.1 Perche' serve un compose diverso da quello locale

Il `docker-compose.yml` della radice **non e' adatto a Coolify** perche'
pubblica due porte sull'host:

```yaml
api:
  ports:
    - '${API_PORT:-3000}:3000'
web:
  ports:
    - '${WEB_PORT:-8080}:8080'
```

Le porte pubblicate scavalcano il firewall del sistema operativo e riespongono
API e PWA in chiaro su internet, oltre a poter collidere con la porta 8080 usata
da Traefik. Su Coolify il traffico deve entrare solo dal proxy.

`docker-compose.coolify.yml` e' identico nella sostanza, ma:

- usa `expose` al posto di `ports` su tutti e tre i servizi;
- non definisce reti custom (le crea Coolify);
- non contiene `env_file` (Coolify inietta da solo `env_file: ['.env']` in ogni
  servizio);
- non contiene label Traefik scritte a mano (le genera Coolify dai domini
  configurati; scriverle a mano le farebbe entrare in conflitto).

Il `docker-compose.yml` originale **resta valido per lo sviluppo locale** e non
va modificato.

### 4.2 Creare l'applicazione

**Project > Environment > + New > Private Repository (with deploy key)** oppure
*Public Repository*.

| Campo | Valore |
| --- | --- |
| Repository | `https://github.com/cpibia/tempra` |
| Branch | `main` |
| Build Pack | `Docker Compose` |
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose.coolify.yml` |

Via API la stessa cosa si ottiene con `POST /applications/private-deploy-key`
passando `project_uuid`, `server_uuid`, `environment_name`, `environment_uuid`,
`private_key_uuid`, `git_repository`, `git_branch`,
`build_pack: "dockercompose"` e `docker_compose_location`.

### 4.3 Impostare le variabili PRIMA del primo deploy

Coolify legge il compose e propone da solo le variabili che trova interpolate.
Vanno riempite tutte, altrimenti il primo deploy parte con un database senza
password (che Postgres rifiuta di inizializzare) o con un'API che va in crash
all'avvio.

Nella scheda **Environment Variables**:

| Variabile | Build Variable? | Valore |
| --- | --- | --- |
| `POSTGRES_USER` | no | `tempra` |
| `POSTGRES_DB` | no | `tempra` |
| `POSTGRES_PASSWORD` | no | generato, vedi sezione 5 |
| `JWT_SECRET` | no | generato, vedi sezione 5 |
| `ALLOWED_ORIGINS` | no | `https://tempra.dominio.it` |
| `REGISTRATION_OPEN` | no | `true` per il primo accesso, poi `false` |
| `TRUSTED_PROXY_HOPS` | no | `1` dietro Coolify, che mette Traefik davanti |
| `MAX_CONCURRENT_HASHES` | no | `2`, da alzare solo con molta memoria disponibile |
| `API_ORIGIN` | no, derivata da `VITE_API_URL` nel compose | `https://api.tempra.dominio.it` |
| `VITE_API_URL` | **sì, spuntare "Build Variable"** | `https://api.tempra.dominio.it` |

#### La trappola numero uno: VITE_API_URL

`VITE_API_URL` **non e' una variabile di runtime**. Vite la legge durante il
build e ne sostituisce il valore dentro il bundle JavaScript
(`import.meta.env.VITE_API_URL` diventa una stringa letterale). Il container
`web` e' un nginx che serve file gia' compilati: cambiare la variabile e
riavviare il container **non ha alcun effetto**.

Conseguenze pratiche:

1. Su Coolify la variabile va marcata come **Build Variable** (nell'API il campo
   si chiama `is_buildtime`, non `is_build_time`). Conviene lasciare spuntata
   anche la parte runtime: per nginx e' innocua e in questo modo la variabile e'
   sicuramente presente nel file `.env` che Coolify usa per interpolare
   `build.args` nel compose.
2. Ogni volta che si cambia il dominio dell'API serve un **rebuild completo**,
   non un restart. Su Coolify: **Deploy** con l'opzione *Force rebuild*
   (equivalente a `POST /deploy?uuid=<uuid>&force=true`).
3. Il valore va scritto senza barra finale. Il client la rimuove comunque
   (`.replace(/\/$/, '')`), ma meglio non affidarsi a quello.
4. Per verificare che sia davvero entrata nel bundle, dopo il deploy:

```bash
curl -s https://tempra.dominio.it/ \
  | grep -o '/assets/[^"]*\.js' | head -5 \
  | while read -r a; do curl -s "https://tempra.dominio.it$a" \
      | grep -o 'https://api\.tempra\.dominio\.it' | head -1; done
```

Se non compare nulla, il bundle e' stato compilato senza la variabile.

### 4.4 Primo deploy

Premere **Deploy**. Il primo build compila due immagini (api e web) piu' il pull
di `postgres:17-alpine`: mettere in conto 8-12 minuti.

L'ordine di avvio e' garantito dal compose: `api` aspetta che `db` sia
`healthy`, poi l'entrypoint applica le migrazioni Drizzle e solo dopo avvia il
server.

### 4.5 Impostare i domini (solo dopo il primo deploy)

**Questo passaggio funziona solo dopo che il primo deploy e' andato a termine**,
perche' Coolify deve aver letto il compose dal repository e conoscere l'elenco
dei servizi. Sequenza obbligata: **crea, deploya, imposta i domini, rideploya**.

Nella scheda **Configuration > Domains** compare un campo per ogni servizio:

| Servizio | Dominio |
| --- | --- |
| `web` | `https://tempra.dominio.it` |
| `api` | `https://api.tempra.dominio.it` |
| `db` | **lasciare vuoto** |

Se un servizio espone piu' di una porta, si puo' specificare quale usare con la
sintassi `https://tempra.dominio.it:8080`. Qui non serve: ogni servizio espone
una sola porta.

Via API il campo si chiama `docker_compose_domains` ed e' un array di oggetti
`{name, domain}` dove `name` e' il **nome del servizio** nel compose:

```json
[
  { "name": "web", "domain": "https://tempra.dominio.it" },
  { "name": "api", "domain": "https://api.tempra.dominio.it" }
]
```

Il campo `domains` (quello delle applicazioni a singolo container) viene
**rifiutato** per gli stack compose.

**Lasciare `db` senza dominio e senza porte pubblicate e' l'unica cosa che
serve** per tenere il database fuori da internet: il servizio ha solo
`expose: 5432`, quindi e' raggiungibile esclusivamente dagli altri container
della rete dello stack.

### 4.6 Secondo deploy

Dopo aver impostato i domini, rifare **Deploy**. Ora Traefik genera i router e
richiede i certificati.

### 4.7 Chiudere le registrazioni

Appena creato il proprio account:

1. Cambiare `REGISTRATION_OPEN` a `false`.
2. Riavviare (basta un **Restart**, e' una variabile di runtime letta da
   `apps/api/src/lib/env.ts`).
3. Verificare che la registrazione sia effettivamente chiusa:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST https://api.tempra.dominio.it/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"prova@example.com","password":"passwordlunga123"}'
```

Deve rispondere con un codice di errore, non con `200` o `201`.

---

## 5. Generare i segreti

```bash
# POSTGRES_PASSWORD
openssl rand -hex 24

# JWT_SECRET
openssl rand -base64 48 | tr -d '\n'
```

**Usare `-hex` per la password del database, non `-base64`.** La password
finisce dentro `DATABASE_URL`:

```
postgres://tempra:LA_PASSWORD@db:5432/tempra
```

e in una URL la parte di autorita' termina alla prima barra. Una password
generata con `openssl rand -base64 24` contiene quasi sempre `/` o `+`, e una
barra spezza l'URL producendo errori di connessione incomprensibili. Il simbolo
`$` crea invece un secondo problema: docker compose lo interpreta come inizio di
una interpolazione. `openssl rand -hex 24` produce 48 caratteri esadecimali,
192 bit di entropia, nessun carattere problematico.

`JWT_SECRET` non finisce in nessuna URL, quindi `base64` va benissimo.

**I segreti non vanno mai committati.** Si inseriscono solo nell'interfaccia di
Coolify (o via `POST /applications/{uuid}/envs`). Il file `.env` locale e'
gia' escluso sia da `.gitignore` sia da `.dockerignore`.

Se si vuole importare un `.env` gia' esistente via API, leggerlo sul server e
ciclare le chiavi senza mai stamparne i valori a terminale.

---

## 6. Tabella delle variabili d'ambiente

Legenda della colonna *Quando*:

- **Build**: serve durante la costruzione dell'immagine, finisce dentro
  l'artefatto. Cambiarla richiede un rebuild.
- **Runtime**: letta dal processo all'avvio. Cambiarla richiede solo un restart.
- **Interpolazione**: usata da docker compose per comporre un'altra variabile,
  quindi deve essere presente nell'ambiente del deploy.

| Nome | Quando | Servizio | Obbligatoria | Esempio | Note |
| --- | --- | --- | --- | --- | --- |
| `VITE_API_URL` | **Build** | `web` | No (scenario A: vuota) | `https://api.tempra.dominio.it` | Entra nel bundle JS. Vuota disattiva del tutto la sincronizzazione. Richiede rebuild, non restart |
| `POSTGRES_USER` | Runtime + Interpolazione | `db`, `api` | No, default `tempra` | `tempra` | Usato anche nell'healthcheck `pg_isready` e in `DATABASE_URL` |
| `POSTGRES_DB` | Runtime + Interpolazione | `db`, `api` | No, default `tempra` | `tempra` | |
| `POSTGRES_PASSWORD` | Runtime + Interpolazione | `db`, `api` | **Sì** (scenario B) | `openssl rand -hex 24` | Solo esadecimale, vedi sezione 5. Cambiarla dopo il primo avvio non cambia la password dentro Postgres |
| `DATABASE_URL` | Runtime | `api` | Composta dal compose | `postgres://tempra:xxx@db:5432/tempra` | **Non impostarla a mano** nello scenario B: il compose la costruisce |
| `JWT_SECRET` | Runtime | `api` | **Sì** (scenario B) | `openssl rand -base64 48` | Cambiarla invalida tutte le sessioni attive |
| `ALLOWED_ORIGINS` | Runtime | `api` | **Sì** in pratica | `https://tempra.dominio.it` | Lista separata da virgole, senza barra finale. Il default del codice e' `http://localhost:5173`, inutile in produzione |
| `REGISTRATION_OPEN` | Runtime | `api` | No, default `true` | `false` | Mettere `false` dopo aver creato il proprio account. Solo la stringa esatta `true` apre le registrazioni |
| `TRUSTED_PROXY_HOPS` | Runtime | `api` | No, default `1` | `1` | Quanti proxy fidati stanno davanti. Su Coolify c'e' Traefik, quindi `1`. Un valore troppo alto permette a un client di dichiarare un indirizzo falso e aggirare i limiti sulle richieste; `0` ignora del tutto `X-Forwarded-For` |
| `MAX_CONCURRENT_HASHES` | Runtime | `api` | No, default `2` | `2` | Calcoli di hash password in parallelo. Ognuno occupa 64 MiB: alzarlo solo se il server ha memoria da spendere |
| `API_ORIGIN` | Runtime | `web` | No | `https://api.tempra.dominio.it` | Origine ammessa da `connect-src` nella Content-Security-Policy servita da nginx. Nel compose viene derivata da `VITE_API_URL`: va impostata a mano solo se si esegue l'immagine senza compose. Senza di essa il browser blocca le chiamate all'API |
| `NODE_ENV` | Runtime | `api` | Impostata dal compose | `production` | Alza il pool di connessioni da 3 a 10 e nasconde i dettagli degli errori |
| `PORT` | Runtime | `api` | Impostata dal compose | `3000` | Se si cambia, cambiare anche `expose` e l'healthcheck |
| `ACCESS_TOKEN_TTL_SEC` | Runtime | `api` | No, default `900` | `900` | Durata del token di accesso, in secondi |
| `REFRESH_TOKEN_TTL_SEC` | Runtime | `api` | No, default `5184000` | `5184000` | 60 giorni |
| `TZ` | Runtime | `db` | Impostata dal compose | `UTC` | Le date sono sempre UTC, la conversione e' compito del client |
| `WEB_PORT` | Solo locale | - | No | `8080` | Usata solo dal `docker-compose.yml` di sviluppo, **non serve su Coolify** |
| `API_PORT` | Solo locale | - | No | `3000` | Come sopra |

### Insieme minimo per lo scenario A

Nessuna variabile. Si puo' deployare senza toccare la scheda Environment
Variables.

### Insieme minimo per lo scenario B

```
POSTGRES_PASSWORD   (hex, generata)
JWT_SECRET          (base64, generata)
ALLOWED_ORIGINS     https://tempra.dominio.it
VITE_API_URL        https://api.tempra.dominio.it   <- Build Variable
REGISTRATION_OPEN   true, poi false
```

---

## 7. Domini e certificati

### Consiglio: due sottodomini, non un dominio con path

| Dominio | Punta a | Perche' |
| --- | --- | --- |
| `tempra.dominio.it` | servizio `web`, porta 8080 | La PWA |
| `api.tempra.dominio.it` | servizio `api`, porta 3000 | L'API di sincronizzazione |

Motivi per preferire i due sottodomini a una configurazione tipo
`tempra.dominio.it/api`:

1. **Lo scope del service worker.** Il service worker e' registrato su `/` e il
   suo manifest di precache e' generato con `globPatterns` su tutti i file del
   bundle. Mettere l'API sotto lo stesso origin significa che ogni richiesta a
   `/api/...` attraversa il service worker: basta una regola di routing
   imprecisa perche' una risposta dell'API finisca in cache, o perche' una
   chiamata fallisca offline restituendo il guscio HTML invece di un errore
   gestito.
2. **Il routing lato client.** nginx ha `try_files $uri $uri/ /index.html`: ogni
   percorso sconosciuto restituisce la PWA. Un `/api` servito dallo stesso host
   richiederebbe una `location` dedicata con `proxy_pass`, cioe' modificare
   la configurazione di nginx e introdurre un secondo punto in cui il routing puo' rompersi.
3. **Il codice e' gia' scritto cosi'.** Il client compone `BASE_URL + path` dove
   i path iniziano con `/api/auth/...` e `/api/sync/...`. Con
   `VITE_API_URL=https://api.tempra.dominio.it` le chiamate diventano
   `https://api.tempra.dominio.it/api/auth/login`, e l'API espone esattamente
   quelle rotte.
4. **Scalabilita' e separazione dei fallimenti.** Se l'API cade, la PWA continua
   a funzionare offline sul suo dominio: e' esattamente il comportamento
   desiderato per questa applicazione.

Il prezzo da pagare e' il CORS, che pero' e' gia' implementato e configurabile.

### CORS: come impostare ALLOWED_ORIGINS

`apps/api/src/server.ts` applica il middleware CORS solo su `/api/*`:

```ts
app.use('/api/*', cors({
  origin: env.allowedOrigins,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86_400,
  credentials: false,
}));
```

`ALLOWED_ORIGINS` e' la lista delle origini della PWA, separata da virgole e
ripulita degli spazi. Regole:

- **Origine, non URL.** Solo schema + host (+ porta se non standard). Niente
  path, niente barra finale. `https://tempra.dominio.it` va bene,
  `https://tempra.dominio.it/` no.
- **Lo schema conta.** `http://` e `https://` sono due origini diverse.
- Il dominio dell'API **non** va messo in `ALLOWED_ORIGINS`: si mette il dominio
  da cui parte la richiesta, cioe' quello della PWA.
- Piu' origini: `https://tempra.dominio.it,https://tempra-stage.dominio.it`.
- `/health` e' fuori da `/api/*`, quindi resta accessibile senza CORS: e' voluto,
  serve a Traefik e ai monitoraggi esterni.

Verifica pratica del preflight:

```bash
curl -si -X OPTIONS https://api.tempra.dominio.it/api/auth/login \
  -H 'Origin: https://tempra.dominio.it' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  | grep -i 'access-control'
```

Deve comparire `Access-Control-Allow-Origin: https://tempra.dominio.it`. Se la
riga manca del tutto, `ALLOWED_ORIGINS` e' sbagliata o non e' arrivata al
container.

### Certificati

Coolify richiede i certificati a Let's Encrypt tramite Traefik, con challenge
HTTP-01. Perche' funzioni:

- il record DNS deve gia' risolvere verso l'IP del server **prima** di impostare
  il dominio in Coolify;
- la porta 80 deve essere raggiungibile dall'esterno (la redirezione a HTTPS la
  fa Traefik dopo, ma la validazione passa dalla 80);
- ogni dominio va richiesto separatamente: due sottodomini, due certificati.
  Non serve un wildcard.

Se si usa un DNS con proxy (per esempio Cloudflare in modalita' proxied), la
challenge HTTP-01 puo' fallire. Le opzioni sono: mettere il record in
DNS-only durante il primo rilascio, oppure usare i certificati di Cloudflare.

Verifica:

```bash
echo | openssl s_client -connect tempra.dominio.it:443 -servername tempra.dominio.it 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

---

## 8. Il service worker e il proxy

**Domanda: serve qualche accorgimento su Traefik perche' `/sw.js` non venga
messo in cache? Risposta: no.**

Traefik non e' un proxy di caching e Coolify non gli aggiunge nessun middleware
di cache: applica solo redirezione a HTTPS e compressione. Una risposta che
attraversa Traefik non viene memorizzata da nessuna parte.

La parte importante e' gia' risolta lato applicazione, in `apps/web/templates/tempra.conf.template`:

```nginx
location = /sw.js {
    add_header Cache-Control "no-cache, must-revalidate";
    add_header Service-Worker-Allowed "/";
    try_files $uri =404;
}

location = /index.html {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

`no-cache` non significa "non memorizzare": significa "memorizza pure, ma
rivalida sempre con il server prima di usare la copia". E' esattamente il
comportamento corretto per un service worker, e i browser lo applicano gia' per
conto loro (limite di 24 ore sulla cache di `sw.js`), ma averlo esplicito evita
sorprese con proxy intermedi.

Gli asset con l'impronta del contenuto nel nome (`/assets/`, `/fonts/`) hanno
invece `immutable` e un anno di validita', che e' corretto perche' il nome
cambia a ogni build.

### L'unico caso in cui serve un intervento: una CDN davanti

Se in futuro si mette Cloudflare (o un'altra CDN) davanti al dominio della PWA,
la CDN **puo'** ignorare gli header di origine e servire una versione vecchia
del service worker. In quel caso servono due regole:

- bypass della cache per `/sw.js`, `/index.html`, `/manifest.webmanifest`;
- cache aggressiva per `/assets/*`, `/fonts/*`, `/img/ex/*`.

Con il solo Traefik di Coolify non serve nulla.

### Verifica pratica

```bash
curl -sI https://tempra.dominio.it/sw.js | grep -iE 'cache-control|service-worker-allowed|content-type'
curl -sI https://tempra.dominio.it/assets/ | head -1
```

---

## 9. Healthcheck e verifiche dopo il primo deploy

### Come sono fatti

Gli healthcheck sono definiti nei `Dockerfile`, non nel compose, quindi valgono
in entrambi gli scenari.

**Web** (`apps/web/Dockerfile`):

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1
```

Due dettagli fatti bene, da non rompere in futuro:

- usa `127.0.0.1` e non `localhost`. Dentro un container `localhost` puo'
  risolvere su `::1` mentre il servizio ascolta solo su IPv4: l'healthcheck
  fallirebbe con "Connection refused" pur essendo il container perfettamente
  raggiungibile;
- punta a `/health`, che nginx serve con `return 200`. `wget --spider` considera
  fallimento **qualunque** risposta che non sia 2xx, quindi puntarlo su una
  rotta che redirige (302) renderebbe il container permanentemente unhealthy.

**API** (`apps/api/Dockerfile`): usa `fetch` di Node su `/health`, che a sua
volta fa una `select 1` sul database e restituisce `503` se il database non
risponde. Quindi **se Postgres e' giu', l'API risulta unhealthy e Traefik smette
di instradarla**: comportamento voluto, ma va tenuto a mente quando si diagnostica
un 503.

**DB**: `pg_isready` con `start_period: 20s`.

### Perche' contano

Traefik **ignora i container unhealthy**. Se un dominio risponde 503 e nel proxy
non esiste nessun router per quel dominio, nel 90% dei casi e' un healthcheck che
fallisce, non una configurazione sbagliata: il 503 arriva dal catch-all di
default di Traefik.

### Cosa controllare, in ordine

```bash
# 1. Stato dei container (sul server)
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i tempra

# 2. Log dell'API: migrazioni applicate e porta in ascolto
docker logs --tail 50 <container-api>
# atteso: "Applico le migrazioni del database...", "Migrazioni applicate.",
#         "API Tempra in ascolto sulla porta 3000 (production)"

# 3. Healthcheck dall'interno della rete
docker exec <container-api> node -e "fetch('http://127.0.0.1:3000/health').then(r=>r.text()).then(console.log)"

# 4. Dall'esterno: PWA
curl -s -o /dev/null -w 'web  %{http_code} in %{time_total}s\n' https://tempra.dominio.it/
curl -s https://tempra.dominio.it/ | grep -o '<title>[^<]*</title>'

# 5. Dall'esterno: API
curl -s https://api.tempra.dominio.it/health
# atteso: {"status":"ok","database":true}

# 6. Il database NON deve essere raggiungibile da fuori
nc -z -w 3 <ip-del-server> 5432 && echo "ESPOSTO, problema" || echo "chiuso, ok"
```

**Un deploy con stato `finished` non significa che il sito funzioni.** Il
controllo che conta e' il punto 4 e 5: codice HTTP e contenuto reale.

### Verifica funzionale della PWA

Dal browser, su `https://tempra.dominio.it`:

1. DevTools > Application > Service Workers: stato `activated and is running`.
2. DevTools > Application > Manifest: nessun errore, icone caricate.
3. DevTools > Network, spuntare *Offline*, ricaricare: la PWA deve continuare a
   funzionare.
4. Scenario B: la schermata di sincronizzazione deve mostrare i controlli di
   accesso, non il messaggio "Sincronizzazione non configurata".

---

## 10. Aggiornare il deploy

### Automatico su push

In Coolify, nella scheda dell'applicazione, attivare **Auto Deploy** e
configurare il webhook su GitHub:

1. Copiare la *Webhook URL* dalla scheda **Webhooks** dell'applicazione.
2. Su GitHub: **Settings > Webhooks > Add webhook**, content type
   `application/json`, evento *Just the push event*.

Da quel momento ogni push su `main` fa partire un deploy.

```bash
git add -A
git commit -m "Descrizione della modifica"
git push origin main
```

### Manuale

Dalla interfaccia: pulsante **Deploy**. Via API:

```
POST /deploy?uuid=<uuid-applicazione>&force=true
```

poi polling su `GET /deployments/<deployment_uuid>` finche' lo stato non e'
`finished`, `failed` o `cancelled`.

### Quando serve un rebuild e quando basta un restart

| Modifica | Azione |
| --- | --- |
| Codice della PWA o di `packages/core` | Deploy (rebuild) |
| Codice dell'API | Deploy (rebuild) |
| `VITE_API_URL` | **Deploy con Force rebuild**, il restart non basta |
| `ALLOWED_ORIGINS`, `REGISTRATION_OPEN`, `JWT_SECRET`, i TTL dei token | Restart |
| Nuova migrazione Drizzle in `apps/api/drizzle/` | Deploy: l'entrypoint la applica da solo all'avvio |
| Dominio della PWA | Restart, piu' aggiornare `ALLOWED_ORIGINS` |
| Dominio dell'API | **Deploy con Force rebuild** (cambia `VITE_API_URL`) |

### Attenzione al branch

Coolify deploya il branch configurato, di norma `main`. Se in futuro si adotta
GitFlow e si lavora su `develop`, un commit su `develop` non produce nessun
deploy. Per portare in produzione un singolo file (per esempio una correzione al
compose) senza trascinare tutto `develop`:

```bash
git checkout develop
git commit -am "Correzione al compose di Coolify"
git push origin develop
git checkout main
git cherry-pick <sha>
git push origin main
```

### Dopo ogni aggiornamento della PWA

Il service worker e' registrato con `registerType: 'prompt'`: l'utente riceve una
richiesta di conferma e la nuova versione entra in funzione solo dopo che
accetta o riapre l'applicazione. Non e' un bug, e' la configurazione scelta in
`vite.config.ts`. Se durante un test si vede ancora la versione vecchia, vedere
il punto 3 del troubleshooting.

---

## 11. Backup e ripristino del database

Riguarda solo lo scenario B. Nello scenario A non ci sono dati sul server: tutto
vive nell'IndexedDB del dispositivo.

### Trovare i nomi reali

Coolify prefissa volumi e container con l'identificativo della risorsa, quindi i
nomi non sono `gym_db-data` ma qualcosa come `<uuid>_db-data`:

```bash
# Sul server
docker volume ls | grep db-data
docker ps --filter 'name=db' --format '{{.Names}}\t{{.Image}}'
```

Annotare i nomi reali in `DEPLOYED.md`.

### Backup logico (consigliato)

Un dump SQL e' piu' piccolo, portabile fra versioni di Postgres e ripristinabile
selettivamente.

```bash
CONTAINER=<nome-container-db>
docker exec -t "$CONTAINER" pg_dump -U tempra -d tempra \
  --no-owner --no-acl --format=custom \
  > "tempra-$(date +%F-%H%M).dump"
```

Verificare subito che il file non sia vuoto e sia leggibile:

```bash
ls -lh tempra-*.dump
pg_restore --list tempra-*.dump | head
```

### Backup automatico giornaliero

Sul server, come utente con accesso a docker:

```bash
sudo mkdir -p /var/backups/tempra
sudo tee /usr/local/bin/tempra-backup.sh >/dev/null <<'EOS'
#!/bin/bash
set -euo pipefail
CONTAINER="$(docker ps --filter 'name=db' --filter 'status=running' --format '{{.Names}}' | grep -i tempra | head -1)"
[ -n "$CONTAINER" ] || { echo "container del database non trovato"; exit 1; }
DEST="/var/backups/tempra/tempra-$(date +%F-%H%M).dump"
docker exec -t "$CONTAINER" pg_dump -U tempra -d tempra --no-owner --no-acl --format=custom > "$DEST"
# Un dump valido non e' mai sotto i 2 KB.
[ "$(stat -c%s "$DEST")" -gt 2048 ] || { echo "dump sospetto, troppo piccolo"; exit 1; }
find /var/backups/tempra -name 'tempra-*.dump' -mtime +14 -delete
EOS
sudo chmod +x /usr/local/bin/tempra-backup.sh
```

Pianificazione alle 3 del mattino:

```bash
sudo crontab -l 2>/dev/null | { cat; echo "0 3 * * * /usr/local/bin/tempra-backup.sh >> /var/log/tempra-backup.log 2>&1"; } | sudo crontab -
```

I dump restano sul server, quindi **non proteggono dalla perdita del server**.
Copiarli altrove, per esempio con `rclone` verso un object storage, oppure
tirarli giu' periodicamente:

```bash
# Dal proprio computer
rsync -avz --remove-source-files -e 'ssh -p 4022' \
  ubuntu@<ip-server>:/var/backups/tempra/ ~/Backup/tempra/
```

### Backup del volume (snapshot completo)

Utile prima di un aggiornamento maggiore di Postgres o prima di un'operazione
distruttiva. Va fatto a container fermo, altrimenti si copia uno stato
incoerente.

```bash
docker stop <nome-container-db>
docker run --rm \
  -v <nome-volume>:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/tempra-volume-$(date +%F).tgz -C /data .
docker start <nome-container-db>
```

### Ripristino da dump

**Operazione distruttiva: fare prima un dump dello stato attuale.**

```bash
CONTAINER=<nome-container-db>

# 0. Rete di sicurezza
docker exec -t "$CONTAINER" pg_dump -U tempra -d tempra --format=custom > pre-restore.dump

# 1. Fermare l'API, per non avere scritture durante il ripristino
docker stop <nome-container-api>

# 2. Ripristinare
docker exec -i "$CONTAINER" pg_restore -U tempra -d tempra \
  --clean --if-exists --no-owner --no-acl < tempra-2026-09-12-0300.dump

# 3. Riavviare l'API
docker start <nome-container-api>

# 4. Verificare
curl -s https://api.tempra.dominio.it/health
```

L'entrypoint riapplica le migrazioni all'avvio, ma e' idempotente: Drizzle tiene
traccia di cosa e' gia' stato applicato nella sua tabella interna, che viene
ripristinata insieme al resto del dump.

### Ripristino da snapshot del volume

```bash
docker stop <api> <db>
docker run --rm -v <nome-volume>:/data -v "$PWD":/backup alpine \
  sh -c 'rm -rf /data/* /data/..?* 2>/dev/null; tar xzf /backup/tempra-volume-2026-09-12.tgz -C /data'
docker start <db> && sleep 10 && docker start <api>
```

### Alternativa: Postgres come risorsa Coolify

Coolify offre backup programmati con upload su S3, ma **solo per i database
creati come risorsa dedicata** (*+ New > Database > PostgreSQL*), non per un
servizio dentro uno stack compose. Se si vuole quella comodita':

1. creare il Postgres come risorsa Coolify, con i backup S3 configurati;
2. togliere il servizio `db` dal compose;
3. impostare `DATABASE_URL` a mano puntando all'host interno del database;
4. collegare l'applicazione alla rete del database (*Connect To Predefined
   Network*), altrimenti i due container non si vedono.

E' piu' comodo per i backup, ma aggiunge un pezzo di configurazione che non
vive nel repository. Per una istanza personale la variante con `cron` e'
sufficiente e resta autodescritta.

---

## 12. Modifiche necessarie ai file esistenti

> **Stato: tutte applicate.**
>
> Questa sezione e' stata scritta durante l'analisi, quando le modifiche non
> erano ancora state fatte. Sono state applicate tutte, insieme a quelle emerse
> dalla revisione di sicurezza (vedi `docs/security-review.md`). Resta qui
> perche' spiega il **perche'** di scelte che nel codice finito sembrerebbero
> arbitrarie.
>
> Una differenza rispetto a quanto proposto sotto: la configurazione di nginx
> non si chiama piu' `apps/web/nginx.conf` ma
> **`apps/web/templates/tempra.conf.template`**, e viene elaborata all'avvio del
> container dal meccanismo dei template dell'immagine ufficiale. Serve a
> iniettare l'origine dell'API dentro la direttiva `connect-src` della
> Content-Security-Policy, che cambia da installazione a installazione. Il
> problema degli `add_header` nelle `location` e' stato risolto in modo diverso
> da quanto proposto al punto 12.5: invece di includere un file di intestazioni
> in ogni blocco, il valore di `Cache-Control` si decide con una `map` e le
> intestazioni restano dichiarate una volta sola a livello di `server`.
>
> Alla lista delle variabili va aggiunta **`API_ORIGIN`**, di runtime sul
> servizio `web`, che deve valere quanto `VITE_API_URL` (senza barra finale);
> nel compose viene gia' derivata automaticamente.

Nessuna di queste modifiche e' stata applicata: sono da valutare e applicare a
mano.

### 12.1 Bloccante solo per lo scenario B: le porte pubblicate

**File:** `docker-compose.yml`
**Problema:** i servizi `api` e `web` usano `ports:`, che pubblica le porte
sull'host scavalcando il firewall e potendo collidere con la 8080 di Traefik.

**Risoluzione adottata:** non si tocca `docker-compose.yml` (resta il file per lo
sviluppo locale, dove pubblicare le porte e' esattamente cio' che serve) e su
Coolify si usa `docker-compose.coolify.yml`, fornito insieme a questa guida, che
usa `expose`.

Se si preferisse un file unico, la patch sarebbe:

```diff
   api:
-    ports:
-      - '${API_PORT:-3000}:3000'
+    expose:
+      - '3000'

   web:
-    ports:
-      - '${WEB_PORT:-8080}:8080'
+    expose:
+      - '8080'
```

Non e' consigliato: renderebbe scomodo lo sviluppo locale.

### 12.2 Consigliata: la password del database non deve essere base64

**File:** `.env.example`
**Problema:** la riga suggerisce `openssl rand -base64 24` per
`POSTGRES_PASSWORD`, ma quella password finisce dentro `DATABASE_URL`. Base64
produce `/` e `+`: una barra spezza l'URL e `postgres` fallisce la connessione
con un errore che non nomina mai la password. Il simbolo `$`, se presente, viene
inoltre interpretato da docker compose come interpolazione.

**Patch:**

```diff
 # --- Database ---------------------------------------------------------------
 POSTGRES_USER=tempra
 POSTGRES_DB=tempra
-# Generare con: openssl rand -base64 24
+# Generare con: openssl rand -hex 24
+# Solo esadecimale: la password finisce dentro DATABASE_URL, e i caratteri
+# '/', '+' e '$' prodotti da base64 rompono rispettivamente l'URL e
+# l'interpolazione di docker compose.
 POSTGRES_PASSWORD=
```

### 12.3 Consigliata: 26 MB duplicati nell'immagine web

**File:** `apps/web/Dockerfile`
**Problema:** i file statici vengono copiati e poi passati a `chown -R`. Ogni
`RUN` crea un layer nuovo, e un `chown` ricorsivo su 26 MB di immagini
**riscrive tutti quei file in un secondo layer**: l'immagine finale pesa circa
26 MB in piu' del necessario, con push, pull e avvio piu' lenti. Inoltre nginx
deve solo **leggere** quei file, non possederli.

**Patch:**

```diff
 RUN rm /etc/nginx/conf.d/default.conf
 COPY apps/web/nginx.conf /etc/nginx/conf.d/tempra.conf
-COPY --from=build /app/apps/web/dist /usr/share/nginx/html
+COPY --chown=nginx:nginx --from=build /app/apps/web/dist /usr/share/nginx/html

 # Nginx gira come utente non privilegiato: la porta 8080 non richiede root.
 RUN touch /var/run/nginx.pid \
-    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html
+    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx
```

### 12.4 Consigliata: sorgenti pubblicati in produzione

**File:** `apps/web/vite.config.ts`
**Problema:** `build.sourcemap: true` genera le sourcemap anche per la build di
produzione. Vengono pubblicate su internet (`sw.js.map` da solo pesa 212 KB) e
allungano il build. Utile in stage, superfluo in produzione.

**Patch possibile:**

```diff
   build: {
     target: 'es2022',
-    sourcemap: true,
+    // Le sourcemap si generano solo dove servono davvero: in produzione
+    // pubblicherebbero i sorgenti e allungherebbero il build.
+    sourcemap: process.env.SOURCEMAP === 'true',
```

In quel caso `SOURCEMAP` diventa una nuova variabile **di build**. Se si
preferisce non introdurre variabili, si puo' semplicemente mettere `false`.

### 12.5 Da tenere d'occhio: `listen [::]:8080` e IPv6

**File:** `apps/web/nginx.conf`
**Situazione:** la direttiva `listen [::]:8080;` funziona sulla maggior parte dei
kernel anche senza indirizzi IPv6 configurati, perche' il socket si apre lo
stesso. Fallisce pero' con `socket() [::]:8080 failed (97: Address family not
supported by protocol)` se sull'host IPv6 e' stato disabilitato a livello di
kernel (`ipv6.disable=1`) oppure se il daemon Docker e' configurato senza IPv6
in modo restrittivo. In quel caso nginx non parte affatto.

**Da applicare solo se l'errore compare nei log:**

```diff
 server {
     listen 8080;
-    listen [::]:8080;
     server_name _;
```

### 12.6 Da tenere d'occhio: gli `add_header` dentro le `location`

**File:** `apps/web/nginx.conf`
**Situazione:** in nginx `add_header` non si eredita: se un blocco `location` ne
dichiara anche uno solo, **tutti** gli `add_header` del blocco `server` padre
smettono di valere per quella location. Quindi `/assets/`, `/fonts/`,
`/img/ex/`, `/sw.js`, `/manifest.webmanifest`, `/index.html` e `/health`
**non ricevono** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
e `Permissions-Policy`.

Non impedisce il deploy e per file statici l'impatto e' modesto, ma se si vuole
coerenza la soluzione pulita e' spostare i quattro header in un file incluso in
ogni location:

```nginx
# apps/web/security-headers.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
```

e aggiungere `include /etc/nginx/conf.d/security-headers.conf;` in ogni `location`
che gia' usa `add_header`.

### 12.7 Trappola latente: `@tempra/core` e l'immagine dell'API

**File:** `apps/api/Dockerfile`
**Situazione:** oggi non e' un problema, ma diventera' un guasto improvviso se
qualcuno lo dimentica.

Lo stage di runtime copia `packages/core/package.json` ma **non** copia
`packages/core/src`. Funziona perche' nessun file sotto `apps/api/src` importa
`@tempra/core` (verificato). Il build dell'API usa pero' esbuild con
`--packages=external`, quindi gli import di pacchetti **non vengono inlinati nel
bundle**: il giorno in cui l'API importera' qualcosa da `@tempra/core`,
l'immagine si costruira' senza errori e il container andra' in crash all'avvio
con `ERR_MODULE_NOT_FOUND`.

**Patch da applicare quando servira'** (o subito, come rete di sicurezza):

```diff
 COPY --from=build /app/apps/api/dist apps/api/dist
+COPY packages/core packages/core
 COPY apps/api/drizzle apps/api/drizzle
```

In alternativa, togliere `--packages=external` dal comando esbuild in
`apps/api/package.json` per includere `@tempra/core` nel bundle.

### 12.8 Nota di verifica: `npm ci` e i binari nativi

Una trappola classica di questo stack e' che `npm ci` non installi le dipendenze
opzionali native quando il lockfile e' stato generato su macOS ARM e il build
gira su `linux/amd64` con musl (alpine).

**Verificato: qui non serve nessun intervento.** Il `package-lock.json` contiene
gia' le varianti `linux-x64-musl` di tutti i pacchetti nativi coinvolti:
`@tailwindcss/oxide-linux-x64-musl`, `lightningcss-linux-x64-musl`,
`@rollup/rollup-linux-x64-musl`, `@esbuild/linux-x64`.

Se in futuro, dopo un aggiornamento delle dipendenze, il build dovesse fallire
con `Cannot find module '@tailwindcss/oxide-linux-x64-musl'` o simili, la
soluzione e' in fondo al troubleshooting (punto 9).

---

## 13. Troubleshooting

### 1. Il build va in timeout o e' lentissimo

**Sintomi:** il deployment resta in `in_progress` per decine di minuti, oppure
finisce in `failed` senza un errore applicativo chiaro.

**Cause e rimedi, in ordine:**

- **Deploy in parallelo.** Con 4 vCPU, due build Vite contemporanei si rubano la
  CPU a vicenda. Lanciare un deploy alla volta.
- **Il build non usa la cache.** Il `Dockerfile` copia prima i soli
  `package.json` e poi esegue `npm ci`: finche' i manifest non cambiano, lo
  strato delle dipendenze resta in cache. Se ogni build reinstalla tutto,
  probabilmente la cache di Docker e' stata ripulita, oppure e' attiva l'opzione
  *Force rebuild* (che la ignora di proposito). Usare *Force rebuild* solo
  quando serve davvero.
- **Il timeout e' basso.** In Coolify, nelle impostazioni del server o
  dell'applicazione, alzare il valore di *Build timeout* a 1800-3600 secondi.
- **Il contesto e' grosso.** Sono 29 MB, non un problema, ma verificare che
  `.dockerignore` non sia stato alterato: se `node_modules` o `db-exercise`
  rientrassero nel contesto, si passerebbe a oltre 500 MB.

**Verifica della durata reale:**

```bash
docker system df
docker builder du
```

Se lo spazio per la cache di build e' pieno, `docker builder prune --keep-storage 10GB`.

### 2. Errore CORS nella console del browser

**Sintomo:** `Access to fetch at 'https://api.tempra.dominio.it/api/auth/login'
from origin 'https://tempra.dominio.it' has been blocked by CORS policy`.

**Diagnosi:**

```bash
curl -si -X OPTIONS https://api.tempra.dominio.it/api/auth/login \
  -H 'Origin: https://tempra.dominio.it' \
  -H 'Access-Control-Request-Method: POST' \
  | grep -i access-control
```

**Cause, dalla piu' frequente:**

| Causa | Rimedio |
| --- | --- |
| Barra finale in `ALLOWED_ORIGINS` | `https://tempra.dominio.it`, non `.../` |
| Schema sbagliato (`http` invece di `https`) | Le origini sono distinte, usare `https` |
| Inserito il dominio dell'API invece di quello della PWA | Va messa l'origine **da cui parte** la richiesta |
| Variabile impostata ma container non riavviato | Restart del servizio `api` |
| Spazi attorno alle virgole | Il codice fa `.trim()`, quindi tollerati, ma meglio evitarli |
| L'API risponde 502/503 | Non e' un problema di CORS: il browser lo segnala cosi' perche' la risposta di errore del proxy non ha gli header. Vedere il punto 5 |

**Conferma di cosa vede il container:**

```bash
docker exec <container-api> printenv ALLOWED_ORIGINS
```

### 3. Il service worker serve ancora la versione vecchia

**Sintomo:** dopo un deploy il browser mostra la PWA precedente.

**Prima di tutto: e' quasi sempre il comportamento previsto.**
`vite.config.ts` usa `registerType: 'prompt'`: la nuova versione viene scaricata
ma entra in funzione solo quando l'utente accetta l'aggiornamento o riapre
l'applicazione dopo aver chiuso tutte le schede. Non e' un guasto.

**Diagnosi vera e propria:**

```bash
# L'header di rivalidazione c'e'?
curl -sI https://tempra.dominio.it/sw.js | grep -i cache-control
# atteso: Cache-Control: no-cache, must-revalidate

# Il file servito e' davvero quello nuovo?
curl -s https://tempra.dominio.it/sw.js | grep -o 'revision":"[a-f0-9]\{8\}' | head -3
```

**Rimedi:**

- Forzare l'aggiornamento nel browser: DevTools > Application > Service Workers >
  *Update*, oppure *Unregister* e ricaricare.
- Verificare che `index.html` non sia in cache:
  `curl -sI https://tempra.dominio.it/ | grep -i cache-control` deve dare
  `no-cache, must-revalidate`. Se `index.html` viene messo in cache, il browser
  continua a chiedere i vecchi bundle con l'hash vecchio, che dopo il deploy non
  esistono piu': si vedono 404 sugli `/assets/`.
- Se davanti c'e' una CDN, e' lei: vedere la sezione 8.
- Traefik non c'entra: non fa caching.

### 4. Le migrazioni falliscono e l'API non parte

**Sintomo:** nei log dell'API compare `Migrazioni fallite:` seguito da un errore
e il container entra in loop di riavvio.

L'entrypoint e' `docker/api-entrypoint.sh`, che ha `set -e`: se la migrazione
fallisce, il processo esce con codice diverso da zero e il container riparte.

```bash
docker logs --tail 100 <container-api>
```

| Errore nei log | Causa | Rimedio |
| --- | --- | --- |
| `Variabile d'ambiente mancante: DATABASE_URL` | Nello scenario B la costruisce il compose; se e' vuota, manca `POSTGRES_PASSWORD` o la si e' sovrascritta a mano | Impostare `POSTGRES_PASSWORD` e **non** definire `DATABASE_URL` manualmente |
| `password authentication failed for user "tempra"` | La password e' stata cambiata **dopo** il primo avvio: Postgres la fissa solo alla prima inizializzazione del volume | Cambiarla dentro il database (`ALTER USER tempra WITH PASSWORD '...'`) e allineare la variabile, oppure ripartire da un volume vuoto (perdendo i dati) |
| `getaddrinfo ENOTFOUND db` o `ECONNREFUSED` | L'API e' partita prima del database | Il compose ha gia' `depends_on: condition: service_healthy`; se manca, il servizio e' stato modificato |
| `invalid connection string` / errori di parsing | La password contiene `/`, `+` o `$` | Vedere la sezione 12.2: rigenerare la password con `openssl rand -hex 24` |
| `relation "..." already exists` | Il volume contiene uno schema creato fuori dal controllo di Drizzle | Fare un dump, ripartire da un volume pulito, ripristinare i soli dati |
| `no pg_hba.conf entry for host "10.0.x.x"` | Si sta puntando a un Postgres installato sull'host, non al container | Aggiungere una riga per `10.0.0.0/16` in `pg_hba.conf` e `systemctl reload postgresql` |

**Applicare le migrazioni a mano, per capire meglio:**

```bash
docker exec -it <container-api> node --experimental-strip-types apps/api/src/db/migrate.ts
```

### 5. 502 o 503 dal proxy

Sono due errori diversi e vanno distinti.

**503 Service Unavailable:** Traefik non ha nessun backend sano per quel
dominio. Nella grandissima maggioranza dei casi **il container e' unhealthy**,
perche' Traefik ignora i container non sani e la risposta arriva dal catch-all di
default, non da un router rotto.

```bash
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i tempra
docker inspect --format '{{json .State.Health}}' <container> | head -c 800
```

Se lo stato e' `unhealthy`, il problema e' l'healthcheck: punto 8.

Se lo stato e' `healthy` ma il 503 persiste, il proxy potrebbe aver perso
l'aggancio alla rete dell'applicazione (succede se `coolify-proxy` e' stato
ricreato a mano):

```bash
docker network ls | grep -i <uuid-applicazione>
docker network connect <rete-applicazione> coolify-proxy
```

**Non ricreare mai `coolify-proxy` con `docker compose up -d --force-recreate`:**
perde l'aggancio alle reti di tutte le applicazioni e ogni sito va in 503.

**502 Bad Gateway:** il backend esiste ma non risponde, oppure risponde su una
porta diversa da quella che Traefik sta contattando. Vedere il punto 6.

**Per capire cosa pensa davvero Traefik**, si puo' abilitare temporaneamente la
sua API mettendo `--api.insecure=true` in
`/data/coolify/proxy/docker-compose.yml`, poi dal server:

```bash
curl -s http://127.0.0.1:8080/api/http/routers | jq '.[] | select(.rule|test("tempra")) | {name,rule,service,status}'
curl -s http://127.0.0.1:8080/api/http/services | jq '.[] | select(.name|test("tempra")) | {name, serverStatus}'
```

**Rimettere subito `false` quando si ha finito**, e ricollegare il proxy alle
reti delle applicazioni, perche' la ricreazione le perde.

### 6. Porta sbagliata

**Sintomo:** 502 costante, oppure la pagina di benvenuto di nginx al posto della
PWA.

Le porte corrette sono:

| Servizio | Porta interna | Dove e' scritta |
| --- | --- | --- |
| `web` | **8080** | `EXPOSE 8080` nel Dockerfile, `listen 8080` nel template di nginx, `expose` nel compose |
| `api` | **3000** | `EXPOSE 3000`, `PORT: 3000`, `expose` nel compose |
| `db` | 5432 | solo `expose`, nessun dominio |

**Attenzione: la porta della PWA e' 8080, non 80.** nginx gira come utente non
privilegiato (`USER nginx`) e un utente non root non puo' aprire una porta sotto
la 1024. Se in Coolify, scenario A, si e' lasciato *Ports Exposes* a `80`, il
risultato e' un 502 immediato.

Nello scenario B, se un servizio esponesse piu' porte, si specifica quale usare
nel dominio: `https://tempra.dominio.it:8080`.

**Verifica dall'interno:**

```bash
docker exec <container-web> wget -qO- http://127.0.0.1:8080/health
docker exec <container-api> node -e "fetch('http://127.0.0.1:3000/health').then(r=>r.text()).then(console.log)"
```

Se questi comandi funzionano ma dall'esterno no, il problema e' nel proxy, non
nell'applicazione.

### 7. VITE_API_URL non applicata

**Sintomi:** la PWA dice "Sincronizzazione non configurata", oppure chiama
`localhost` o il dominio vecchio.

**Diagnosi decisiva:** cercare il dominio dentro il bundle servito.

```bash
for a in $(curl -s https://tempra.dominio.it/ | grep -o '/assets/[^"]*\.js'); do
  echo "== $a"
  curl -s "https://tempra.dominio.it$a" | grep -o 'https://[a-z0-9.-]*tempra[a-z0-9.-]*' | sort -u | head -3
done
```

**Cause, in ordine di frequenza:**

1. **La variabile non e' marcata come Build Variable.** E' la causa numero uno.
   Su Coolify va spuntata la casella *Build Variable* (`is_buildtime` via API).
   Senza quella, la variabile esiste nel container ma non esisteva durante il
   build, e nginx non puo' farci nulla.
2. **E' stato fatto un restart invece di un deploy.** Il bundle e' un artefatto:
   va ricostruito. Serve **Deploy** con *Force rebuild*.
3. **Il layer di build era in cache.** Se Docker riusa uno strato precedente, la
   `ARG` non cambia. *Force rebuild* risolve.
4. **Nome sbagliato.** Vite espone al client **solo** le variabili con prefisso
   `VITE_`. `API_URL` verrebbe ignorata in silenzio.
5. **Scenario B, primo deploy:** al primo deploy i domini non sono ancora
   impostati, quindi si e' probabilmente costruito con la variabile vuota. Dopo
   aver impostato i domini serve un rebuild, non un semplice redeploy.

**Controprova rapida in locale:**

```bash
docker build -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=https://api.tempra.dominio.it \
  -t tempra-web-test .
docker run --rm -p 8081:8080 tempra-web-test
# poi: curl -s http://127.0.0.1:8081/ | grep -o '/assets/[^"]*\.js'
```

### 8. L'healthcheck fallisce

**Sintomo:** `docker ps` mostra `(unhealthy)`, il sito risponde 503.

```bash
docker inspect --format '{{range .State.Health.Log}}{{.End}} exit={{.ExitCode}} {{.Output}}{{end}}' <container> | tail -5
```

| Output | Causa | Rimedio |
| --- | --- | --- |
| `Connection refused` sul servizio web | nginx non e' partito | `docker logs <container-web>`: se c'e' `socket() [::]:8080 failed`, vedere 12.5 |
| `wget: server returned error: HTTP/1.1 302` | L'healthcheck punta a una rotta che redirige. `wget --spider` considera fallimento tutto cio' che non e' 2xx | Puntare a `/health`, che risponde 200 |
| `{"status":"degraded","database":false}` sull'API | Il database non risponde: l'API e' viva ma si dichiara degradata e restituisce 503 | Guardare il container `db`, punto 4 |
| L'healthcheck fallisce solo nei primi secondi | `start_period` troppo corto. L'API applica le migrazioni prima di ascoltare, e con molte migrazioni i 15 secondi possono non bastare | Alzare `--start-period` nel `Dockerfile` dell'API a `40s` |
| `Connection refused` pur essendo il servizio attivo | `localhost` risolto su `::1` mentre il servizio ascolta solo IPv4 | Gli healthcheck attuali usano gia' `127.0.0.1`: se qualcuno li modifica, non tornare a `localhost` |

### 9. Memoria insufficiente durante il build

**Sintomi:** il build muore senza messaggio, oppure con
`JavaScript heap out of memory`, `Killed`, o codice di uscita `137`.

```bash
# Sul server, durante il build
free -m
dmesg -T | grep -i 'killed process' | tail -5
```

`exit code 137` e `Killed` in `dmesg` significano che e' intervenuto l'OOM killer
del kernel.

**Rimedi, in ordine:**

1. **Un deploy alla volta.** Due build Vite paralleli su 7,6 GB con Postgres e le
   altre applicazioni gia' in memoria sono al limite.
2. **Alzare il limite dell'heap di Node** come variabile di build in Coolify:
   `NODE_OPTIONS=--max-old-space-size=3072`.
3. **Disattivare le sourcemap** (sezione 12.4): sono la voce piu' pesante del
   build della PWA, per via del catalogo esercizi da 1 MB e del chunk
   separato `catalog`.
4. **Aggiungere swap**, se non c'e':

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

5. **Costruire altrove.** Se il problema diventa cronico, costruire le immagini
   in GitHub Actions, pubblicarle su `ghcr.io` e far consumare a Coolify
   l'immagine gia' pronta. In quel caso serve `docker login ghcr.io` **come
   root** sul server, perche' Coolify esegue docker come root: un token in
   `/home/<utente>/.docker/config.json` non viene visto.

**Nota collegata:** se il fallimento e' invece
`Cannot find module '@tailwindcss/oxide-linux-x64-musl'` (o `lightningcss-...`,
o `@rollup/rollup-linux-x64-musl`), non e' memoria: e' `npm ci` che non ha
installato una dipendenza opzionale nativa. Il lockfile attuale contiene tutte le
varianti musl necessarie, ma dopo un aggiornamento delle dipendenze potrebbe non
essere piu' vero. Rimedio, nel `Dockerfile` della PWA:

```diff
-RUN npm ci --workspace=@tempra/web --workspace=@tempra/core --include-workspace-root
+RUN npm install --no-audit --no-fund --workspace=@tempra/web --workspace=@tempra/core --include-workspace-root
```

oppure rigenerare `package-lock.json` da dentro un container linux.

### 10. Permessi del volume

**Sintomo:** il container `db` non parte e nei log compare
`initdb: error: could not change permissions of directory
"/var/lib/postgresql/data": Operation not permitted`, oppure
`data directory "/var/lib/postgresql/data" has wrong ownership`.

**Casi possibili:**

- **Volume Docker nominato (la configurazione corretta).** Il compose usa
  `db-data:/var/lib/postgresql/data`, un volume gestito da Docker: i permessi li
  imposta l'immagine di Postgres al primo avvio e il problema non si presenta.
  Se si presenta lo stesso, il volume contiene residui di un'altra installazione.

```bash
docker volume inspect <nome-volume>
docker run --rm -v <nome-volume>:/data alpine ls -la /data | head
```

- **Bind mount su una cartella dell'host.** E' il caso che genera davvero
  l'errore. Postgres gira come UID 999 e la cartella dell'host appartiene a
  `root` o a `ubuntu`. Rimedio:

```bash
sudo chown -R 999:999 /percorso/della/cartella
sudo chmod 700 /percorso/della/cartella
```

**Non convertire il volume nominato in bind mount** senza motivo: si perde la
gestione automatica dei permessi e i backup diventano piu' delicati.

**Per il servizio web** il caso equivalente e' `nginx: [emerg] open()
"/var/run/nginx.pid" failed (13: Permission denied)`, che significa che il
`chown` dell'ultimo stage del Dockerfile e' stato rimosso o modificato: nginx
gira come `USER nginx` e ha bisogno di poter scrivere `/var/run/nginx.pid` e
`/var/cache/nginx`.

**Prima di cancellare un volume, sempre un backup** (sezione 11), e comunicarlo
prima di procedere.

---

## 14. Checklist finale post-deploy

### Comune a entrambi gli scenari

- [ ] Il repository e' su GitHub, il branch deployato e' `main` e l'ultimo commit
      su GitHub coincide con quello dell'ultimo deploy riuscito.
- [ ] `git ls-files | grep -iE "\.env|secret|credential|\.pem$|\.key$"` non
      restituisce nulla.
- [ ] Lo stato del deployment e' `finished`.
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://tempra.dominio.it/`
      restituisce `200`.
- [ ] `curl -s https://tempra.dominio.it/ | grep -o '<title>[^<]*</title>'`
      restituisce `<title>Tempra</title>`.
- [ ] `https://tempra.dominio.it/health` risponde `ok`.
- [ ] Il certificato e' valido e non scade entro 30 giorni
      (`openssl s_client ... | openssl x509 -noout -dates`).
- [ ] `http://tempra.dominio.it` redirige a `https://`.
- [ ] `curl -sI https://tempra.dominio.it/sw.js` mostra
      `Cache-Control: no-cache, must-revalidate`.
- [ ] `curl -sI https://tempra.dominio.it/manifest.webmanifest` mostra
      `application/manifest+json`.
- [ ] Un asset con hash risponde 200 e ha `Cache-Control: public, immutable`.
- [ ] Una immagine di esercizio risponde 200
      (`curl -sI https://tempra.dominio.it/img/ex/<nome>.webp`).
- [ ] Un percorso inesistente (`/percorso/inventato`) restituisce la PWA e non un
      404 di nginx.
- [ ] Nel browser: service worker `activated`, manifest senza errori,
      installazione della PWA proposta.
- [ ] Con la rete disattivata la PWA continua a funzionare.
- [ ] `docker ps` mostra tutti i container `(healthy)`.
- [ ] I log non contengono errori ripetuti
      (`docker logs --since 10m <container>`).
- [ ] `DEPLOYED.md` aggiornato con uuid dell'applicazione, nomi reali dei
      container e dei volumi, domini e righe di log della verifica.

### Solo scenario B

- [ ] `https://api.tempra.dominio.it/health` risponde
      `{"status":"ok","database":true}`.
- [ ] Il bundle JavaScript contiene il dominio dell'API (comando al punto 7 del
      troubleshooting).
- [ ] Il preflight CORS restituisce `Access-Control-Allow-Origin` con il dominio
      della PWA.
- [ ] Nei log dell'API compaiono `Migrazioni applicate.` e
      `API Tempra in ascolto sulla porta 3000 (production)`.
- [ ] Registrazione, accesso e una sincronizzazione completa funzionano da
      browser.
- [ ] La sincronizzazione e' verificata **fra due dispositivi** diversi.
- [ ] `REGISTRATION_OPEN` e' a `false` e la registrazione e' effettivamente
      chiusa (comando alla sezione 4.7).
- [ ] La porta 5432 **non** e' raggiungibile dall'esterno
      (`nc -z -w 3 <ip> 5432` deve fallire).
- [ ] Il servizio `db` non ha nessun dominio assegnato in Coolify.
- [ ] `POSTGRES_PASSWORD` e `JWT_SECRET` sono generati, non sono valori di
      esempio, e non compaiono in nessun file del repository.
- [ ] Il primo backup e' stato eseguito, il file non e' vuoto e
      `pg_restore --list` lo legge senza errori.
- [ ] Il cron di backup e' attivo (`sudo crontab -l`) e la rotazione a 14 giorni
      funziona.
- [ ] Il ripristino e' stato provato almeno una volta, non solo il backup.
- [ ] I backup vengono copiati fuori dal server.
