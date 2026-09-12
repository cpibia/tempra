# Architettura

## Mappa del repository

```
tempra/
  apps/
    web/                 PWA React, l'applicazione vera e propria
      src/
        components/      componenti riusabili (ui/, layout/)
        db/              Dexie: schema e repository
        features/        una cartella per area funzionale
        lib/             timer, suono, tema, annunci, wake lock, sincronizzazione
        styles/          token del design system e livello componenti
        sw.ts            service worker
      e2e/               test Playwright, inclusa la verifica WCAG con axe
      public/img/ex/     1.746 immagini WebP degli esercizi, 26 MB
    api/                 API di sincronizzazione (facoltativa)
      src/
        routes/          auth, sync
        db/              schema Drizzle e migrazioni
        lib/             crittografia, token, limitazione richieste
  packages/
    core/                dominio condiviso, nessun I/O
      src/
        domain/          tipi ed etichette
        engine/          catalogo, volume, pause, split, prescrizione, generatore
        health/          screening sanitario
        data/            catalogo esercizi generato
  tools/                 pipeline dati (immagini, catalogo, regole sanitarie)
  docs/                  ricerca, decisioni, deploy, questo documento
```

## Il flusso principale

```
  Onboarding                Generatore                  Allenamento
  ----------                ----------                  -----------
  obiettivo          →      split                 →     sessione precompilata
  luogo e attrezzi   →      volume settimanale     →    riga serie: peso, reps,
  giorni e durata    →      selezione esercizi     →    tempo, spunta
  livello            →      serie e ripetizioni    →    timer di recupero
  condizioni salute  →      pause consigliate      →    salvataggio continuo
                            adattamento sanitario  →    record personali
                            adattamento al tempo   →    riepilogo
```

## Le tre regole che spiegano quasi tutto il codice

**1. IndexedDB e' l'originale, non una copia.**
Ogni modifica viene scritta subito. Non esiste un pulsante Salva. La sessione in
corso viene ripresa dopo un blocco dell'applicazione. Vedi ADR 0002.

**2. Il tempo si legge dall'orologio, non si accumula.**
Il timer di recupero calcola sempre la differenza fra l'istante di fine e
`Date.now()`. Un timer basato sull'accumulo di `setInterval` si ferma quando il
browser sospende la scheda.

**3. Il colore non porta mai da solo un'informazione.**
Serie completata: spunta, colore e stato annunciato. Record personale: icona,
etichetta testuale e colore. Grafici: forma del marcatore e tabella dati
equivalente. Vedi `docs/research/04-accessibilita-wcag.md`.

## La pipeline dei dati

Il catalogo non e' scritto a mano: si genera dal dataset pubblico
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).

```
db-exercise/                        sorgente, 876 esercizi, 101 MB di JPEG
    │
    ├── tools/build-images.sh       → WebP 440px e miniature 160px, 26 MB
    │
    ├── data/translations/*.json    → traduzioni italiane (nomi, alias, istruzioni)
    │
    ├── tools/build-catalog.mjs     → packages/core/src/data/exercises.json   (547 KB)
    │                                  packages/core/src/data/instructions.json (611 KB)
    │
    └── tools/build-conditions.mjs  → packages/core/src/health/conditions.json (81 KB)
```

`build-catalog.mjs` non si limita a tradurre: **deriva** i campi che il motore usa
e che il dataset originale non ha.

| Campo derivato | A cosa serve |
|---|---|
| `pattern` | squat, hinge, spinta orizzontale, trazione verticale e cosi' via: e' la base con cui il generatore riempie gli slot di una seduta |
| `loadType` | decide quali campi mostrare durante l'allenamento: peso e ripetizioni, sole ripetizioni, ripetizioni piu' zavorra, oppure secondi |
| `unilateral` | esercizi da eseguire per lato |
| `impact` | impatto articolare, usato dai filtri sanitari |
| `axialLoad` | carico di compressione sulla colonna: rilevante per ernie, lombalgia, osteoporosi |
| `homeFriendly` | eseguibile senza attrezzatura da palestra |
| `priority` | punteggio interno: il generatore preferisce i fondamentali riconoscibili alle varianti esotiche |
| `defaultRestSec` | pausa di partenza, prima dei coefficienti legati all'obiettivo |

Le istruzioni di esecuzione stanno in un file separato, caricato solo quando si
apre la scheda di un esercizio: pesano quanto tutto il resto del catalogo e non
servono per generare o per allenarsi.

## Scelte di prestazione

| Cosa | Come | Risultato |
|---|---|---|
| Immagini | conversione in WebP a 440px, miniature a 160px | da 101 MB a 26 MB |
| Catalogo | chunk separato con nome stabile | 54 KB compressi, in cache a lungo |
| Istruzioni | modulo caricato a richiesta | 140 KB che non pesano sull'avvio |
| Regole sanitarie | indici numerici invece di identificativi testuali | da 224 KB a 81 KB |
| Font | Inter variabile servito dal proprio dominio | 133 KB, nessuna richiesta a terzi |
| Rotte | caricamento differito per pagina | il guscio resta sotto i 140 KB compressi |
| Immagini esercizi | cache del service worker a richiesta, non precaricate | la prima installazione non scarica 26 MB |

## Cosa e' stato lasciato fuori, e perche'

- **Esercizi olimpici per non avanzati**: strappo e slancio richiedono una tecnica che un'applicazione non puo' insegnare. Restano nel catalogo, cercabili, ma il generatore non li propone.
- **Serie a piramide come impostazione predefinita**: disponibili nell'editor manuale, non nella generazione automatica. Il sovraccarico progressivo su serie normali basta e avanza per chi non e' avanzato.
- **Conteggio delle calorie**: sarebbe una stima con un margine di errore che la rende inutile, presentata con la precisione di un dato vero.
- **Striscia di giorni consecutivi**: e' l'indicatore sbagliato per un programma di forza, dove i giorni di riposo sono parte del programma. Al suo posto c'e' l'aderenza settimanale.
