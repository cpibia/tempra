# Tempra: stato reale del deploy su Coolify

Registro di cosa esiste davvero sul server. Se diverge da `docs/deploy/coolify.md`,
sui fatti vince questo file.

Ultima verifica: 12 settembre 2026.

## Identificativi

| Voce | Valore reale |
| --- | --- |
| Istanza Coolify | 4.3.18, server `localhost` (VPS OVH, 51.38.112.106) |
| Progetto | Produzione, ambiente `production` |
| Applicazione | `tempra`, uuid `kkhjrm3pd5wllnodthtzutvv` |
| Sorgente | Public Repository, `https://github.com/cpibia/tempra`, branch `main` |
| Build pack | `dockercompose`, `docker_compose_location` = `/docker-compose.coolify.yml` |
| Commit deployato | `3cf805e2d11579ccb71f58ffd99fe1b9f1daece9` |

Nessuna deploy key: il repository e' pubblico, quindi e' stata usata la sorgente
*Public Repository* (`POST /applications/public`). Piu' semplice e senza la
limitazione di GitHub che rifiuta la stessa chiave su due repository.

## Container, volume e rete

| Oggetto | Nome reale |
| --- | --- |
| Container web | `web-kkhjrm3pd5wllnodthtzutvv-201613870014` |
| Container api | `api-kkhjrm3pd5wllnodthtzutvv-201613858872` |
| Container db | `db-kkhjrm3pd5wllnodthtzutvv-201613846330` |
| Volume Postgres | `kkhjrm3pd5wllnodthtzutvv_db-data` |
| Rete Docker | `kkhjrm3pd5wllnodthtzutvv` (bridge) |

I suffissi numerici cambiano a ogni deploy: per gli script usare i filtri
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

## Verifica eseguita dall'esterno

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

- [ ] Creare il proprio account, poi mettere `REGISTRATION_OPEN=false` e
      riavviare il servizio `api` (e' una variabile di runtime, non serve
      un rebuild).
- [ ] Backup del volume Postgres: non e' ancora configurato nulla. La procedura
      con `pg_dump` e il cron giornaliero sono nella sezione 11 della guida.
- [ ] Auto Deploy da webhook GitHub: non attivato, i deploy sono manuali.
- [ ] Verifica della sincronizzazione fra due dispositivi reali da browser.
