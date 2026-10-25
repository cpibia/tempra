# Tempra: stato reale del deploy su Coolify

Registro di cosa esiste davvero sul server. Se diverge da `docs/deploy/coolify.md`,
sui fatti vince questo file.

Ultima verifica: 25 ottobre 2026.

## Identificativi

| Voce | Valore reale |
| --- | --- |
| Istanza Coolify | 4.3.18, server `localhost` (VPS OVH, 51.38.112.106) |
| Progetto | Produzione, ambiente `production` |
| Applicazione | `tempra`, uuid `kkhjrm3pd5wllnodthtzutvv` |
| Sorgente | Public Repository, `https://github.com/cpibia/tempra`, branch `main` |
| Build pack | `dockercompose`, `docker_compose_location` = `/docker-compose.coolify.yml` |
| Commit deployato | `60b43e7ece0a0b281e06a9b8b074914cf827f5c2` |
| Ultimo deployment | `vtkzwex3kqw2zpwhue5gmbbf`, 25 ottobre 2026, `finished` in circa 70 secondi |

Nessuna deploy key: il repository e' pubblico, quindi e' stata usata la sorgente
*Public Repository* (`POST /applications/public`). Piu' semplice e senza la
limitazione di GitHub che rifiuta la stessa chiave su due repository.

## Container, volume e rete

| Oggetto | Nome reale |
| --- | --- |
| Container web | `web-kkhjrm3pd5wllnodthtzutvv-20261025T065448` |
| Container api | `api-kkhjrm3pd5wllnodthtzutvv-20261025T065447` |
| Container db | `db-kkhjrm3pd5wllnodthtzutvv-20261025T065447` |
| Volume Postgres | `kkhjrm3pd5wllnodthtzutvv_db-data` |
| Rete Docker | `kkhjrm3pd5wllnodthtzutvv` (bridge) |

I suffissi cambiano a ogni deploy (dal deploy del 25 ottobre 2026 sono un
timestamp, prima erano numerici): per gli script usare i filtri
`--filter "name=web-kkhjrm3pd5wllnodthtzutvv"` e simili.

## Domini

| Servizio | Dominio | Porta interna |
| --- | --- | --- |
| web | `https://tempra.nereidi.app` | 8080 |
| api | `https://api.tempra.nereidi.app` | 3000 |
| db | nessuno | 5432, solo `expose` |

Impostati con `PATCH /applications/{uuid}` e campo `docker_compose_domains`,
**dopo** il primo deploy, seguito da un secondo deploy. Certificati Let's Encrypt
emessi il 12 settembre 2026, scadenza 11 dicembre 2026 (emittenti `YR2` per il web
e `YR1` per l'API). `http://` redirige a `https://` con 307 su entrambi.

## Variabili d'ambiente

Create tutte prima del primo deploy. Valori reali solo su Coolify, mai nel repo.

| Chiave | Runtime | Buildtime | Valore |
| --- | --- | --- | --- |
| `POSTGRES_USER` | si | no | `tempra` |
| `POSTGRES_DB` | si | no | `tempra` |
| `POSTGRES_PASSWORD` | si | no | generata con `openssl rand -hex 24` |
| `JWT_SECRET` | si | no | generata con `openssl rand -hex 48` |
| `ALLOWED_ORIGINS` | si | no | `https://tempra.nereidi.app` |
| `REGISTRATION_OPEN` | si | no | `true` |
| `TRUSTED_PROXY_HOPS` | si | no | `1` |
| `MAX_CONCURRENT_HASHES` | si | no | `2` |
| `VITE_API_URL` | si | **si** | `https://api.tempra.nereidi.app` |

`JWT_SECRET` e' stato generato in esadecimale e non in base64 come proponeva la
guida: non finisce in nessuna URL, quindi entrambe le forme vanno bene, e
l'esadecimale evita del tutto il problema dei caratteri `/`, `+` e `$`.

`API_ORIGIN` non e' stata creata a mano: il compose la deriva da `VITE_API_URL` e
il container `web` la riceve correttamente a runtime (verificato con `printenv`).

## Verifica del 25 ottobre 2026 (commit `60b43e7`)

Rilascio con codice di sincronizzazione al posto di email e password, data di
build nella PWA e sezione aggiornamenti.

```
https://tempra.nereidi.app/                       200, <title>Tempra</title>
https://api.tempra.nereidi.app/health             200, {"status":"ok","database":true}
POST /api/auth/register                           404 (rotta rimossa)
POST /api/auth/login                              404 (rotta rimossa)
OPTIONS /api/auth/sync-code (Origin tempra)       204, access-control-allow-origin: https://tempra.nereidi.app
POST /api/auth/sync-code                          201, chiavi code, accessToken, refreshToken, expiresIn
POST /api/auth/sync-code/join (minuscolo, col trattino, es. abcd-efgh)
                                                  200, chiavi accessToken, refreshToken, expiresIn
POST /api/auth/sync-code/join con codice inesistente  404
GET  /api/auth/me con il token del join           200
DELETE /api/auth/me                               200, {"ok":true}
GET  /api/auth/me con il token della creazione    401 (account cancellato)
```

Il codice restituito dalla creazione e' di 8 caratteri maiuscoli senza trattino;
il join lo accetta anche in minuscolo e spezzato con il trattino. Dopo la prova
la tabella `users` e' tornata a `0` righe.

Log di avvio dell'API, righe reali:

```
Applico le migrazioni del database...
Migrazioni applicate.
Avvio del servizio.
API Tempra in ascolto sulla porta 3000 (production)
```

Migrazioni registrate in `drizzle.__drizzle_migrations`: 2 (`0000` e
`0001_sync_codes`). Effetto della `0001_sync_codes` su `users`, verificato con
`\d users`: `email` e `password_hash` ora nullable, nuova colonna
`sync_code_hash text` con indice unico `users_sync_code_hash_unique`. Nessuna
tabella nuova: restano `documents`, `rate_limits`, `refresh_tokens`, `users`.

`VITE_API_URL` e' nel bundle, ma in questo rilascio sta nel chunk di ingresso
`/assets/index-Cg9vQVEO.js` (`const Tt="https://api.tempra.nereidi.app"`) e non
piu' nel chunk differito `SettingsPage`, che ora non contiene il dominio. Per
verificarla vanno quindi cercati tutti i chunk, ingresso compreso. La data di
build `2026-10-25T06:55:17.315Z` e' nello stesso chunk di ingresso; la sezione
aggiornamenti ("Hai gia l ultima versione, del ...") e' in
`/assets/SettingsPage-Drxidwm_.js`. CSP invariata:
`connect-src 'self' https://api.tempra.nereidi.app`.

Container tutti `healthy`, nessuna porta pubblicata sull'host (`3000/tcp`,
`5432/tcp`, `80/tcp, 8080/tcp`).

## Verifica del primo deploy (12 settembre 2026, commit `3cf805e`)

```
https://tempra.nereidi.app/                200, <title>Tempra</title>
https://tempra.nereidi.app/health          200, corpo "ok"
https://tempra.nereidi.app/esercizi        200 (fallback SPA)
/img/ex/Battling_Ropes/0.webp              200, content-type: image/webp,
                                           cache-control: public, max-age=15552000
/sw.js                                     200, cache-control: no-cache, must-revalidate,
                                           service-worker-allowed: /
/manifest.webmanifest                      200, content-type: application/manifest+json
/assets/SettingsPage-Y74_XArr.js           200, cache-control: public, max-age=31536000, immutable
https://api.tempra.nereidi.app/health      200, {"status":"ok","database":true}
```

Content-Security-Policy della home, parte che conta:

```
connect-src 'self' https://api.tempra.nereidi.app;
```

Preflight CORS su `POST /api/auth/login` con origine `https://tempra.nereidi.app`:
`204` con `access-control-allow-origin: https://tempra.nereidi.app`.

`VITE_API_URL` e' entrata nel bundle: il dominio dell'API compare in
`/assets/SettingsPage-Y74_XArr.js`. **Non** compare negli asset referenziati
direttamente da `index.html`, perche' la pagina impostazioni e' un chunk caricato
in modo differito: cercare il dominio solo nei bundle di ingresso porta a
concludere per errore che la variabile non e' stata applicata.

Registrazione di prova: `POST /api/auth/register` ha risposto `201` con
`accessToken`, `refreshToken` ed `expiresIn`; `DELETE /api/auth/me` ha risposto
`{"ok":true}` e la tabella `users` e' tornata a `0` righe.

Log di avvio dell'API, righe reali:

```
Applico le migrazioni del database...
Migrazioni applicate.
Avvio del servizio.
API Tempra in ascolto sulla porta 3000 (production)
```

Tabelle create dalle migrazioni Drizzle: `documents`, `rate_limits`,
`refresh_tokens`, `users`.

Nessuna porta pubblicata sull'host: `docker ps` mostra `3000/tcp`, `5432/tcp`,
`80/tcp, 8080/tcp` senza nessuna mappatura `0.0.0.0`. La 5432 non risponde
dall'esterno. La `80/tcp` sul container web e' solo la `EXPOSE` ereditata
dall'immagine `nginx:alpine`: nginx ascolta esclusivamente sulla 8080.

## Scostamenti rispetto a `docs/deploy/coolify.md`

1. Il repository esiste gia' ed e' **pubblico**: niente deploy key, sorgente
   *Public Repository*. La guida e' stata corretta.
2. `docker_compose_domains` va passato come **array JSON nativo**. Passarlo come
   stringa JSON produce `422 The docker compose domains field must be an array`.
3. Nella creazione di una variabile d'ambiente il campo e' `is_buildtime`.
   Inviare anche `is_build_time` fa fallire la chiamata con
   `422 This field is not allowed`.
4. Alla creazione dell'applicazione Coolify precrea da solo le chiavi interpolate
   dal compose, con valore vuoto. Vanno riempite o rimosse e ricreate.
5. `GET /applications/{uuid}/envs` restituisce ogni variabile **due volte**, con
   uuid diversi ma stesso valore. Bug di presentazione di questa versione: il
   `.env` generato in `/data/coolify/applications/<uuid>/.env` contiene ogni
   chiave una volta sola.
6. Il build e' molto piu' veloce del previsto: circa **50-60 secondi** contro gli
   8-12 minuti stimati dalla guida. Non e' servito alzare il build timeout ne'
   aggiungere swap (il server ne ha gia' 2 GB e circa 6 GB di RAM libera).

## Cose note, non bloccanti

- ~~`GET /api/auth/me` rispondeva `200` con il token di un utente cancellato~~
  **corretto**: l'endpoint verifica ora che l'account esista ancora e
  restituisce `401` altrimenti. Verificato in locale: stesso token, `200`
  prima della cancellazione e `401` dopo.
- ~~Nessuna intestazione `Strict-Transport-Security`~~ **corretto** sul
  servizio web: `max-age=15552000; includeSubDomains`, senza `preload`.
  L'API la serviva gia' tramite `secureHeaders` di Hono.
- Nei log dell'API si vedono gia' 404 da scanner automatici (`/.env`,
  `/.vscode/sftp.json`, `/?rest_route=...`): normale per un host pubblico.

## Cosa manca

- [ ] Chiudere eventualmente le creazioni di nuovi codici con
      `REGISTRATION_OPEN=false` dopo aver creato il proprio codice (variabile di
      runtime: basta riavviare il servizio `api`, non serve un rebuild).
- [ ] Backup del volume Postgres: non e' ancora configurato nulla. La procedura
      con `pg_dump` e il cron giornaliero sono nella sezione 11 della guida.
- [ ] Auto Deploy da webhook GitHub: non attivato, i deploy sono manuali.
- [ ] Verifica della sincronizzazione fra due dispositivi reali da browser.
