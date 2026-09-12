# ADR 0001: Scelta dello stack tecnologico

- **Stato**: accettata
- **Data**: 12 settembre 2026

## Contesto

Va costruita da zero una PWA per allenarsi in palestra e a casa: catalogo di 876
esercizi con immagini, generazione automatica di schede, composizione manuale,
registrazione delle serie durante l'allenamento. Requisiti dichiarati: mobile
first, accessibilita' WCAG 2.1 AA, distribuzione con Docker e Coolify.

Il vincolo che pesa piu' di ogni altro non e' tecnico ma ambientale: **in palestra
spesso non c'e' campo**. L'analisi di 4.379 recensioni negative delle app
concorrenti (vedi `docs/research/02-benchmark-app-ux.md`) mette al primo posto
esattamente questo: applicazioni che chiedono la rete per fare cose che
potrebbero fare in locale, e che quindi diventano inutilizzabili proprio nel
momento in cui servono.

## Decisione

**Frontend**: React 19 con Vite 7, TypeScript in modalita' `strict`,
Tailwind CSS v4 usato come sistema di token piu' che come libreria di utility.

**Persistenza**: IndexedDB tramite Dexie 4, con `dexie-react-hooks` per le query
reattive. Nessuna richiesta di rete e' necessaria per usare l'applicazione.

**Service worker**: Workbox tramite `vite-plugin-pwa` in modalita' `injectManifest`,
cosi' la strategia di cache resta scritta a mano e leggibile.

**Backend** (facoltativo): Hono su Node 22 con Postgres e Drizzle ORM.

**Stato transitorio**: Zustand, usato solo per il timer di recupero.

## Alternative considerate

**Next.js.** Scartato. Il rendering lato server non porta nulla a una
applicazione che dopo l'installazione deve funzionare senza rete, mentre
complica il service worker e la gestione della cache. Il vantaggio tipico di
Next (SEO, primo caricamento) e' irrilevante per una app installata.

**Backend come requisito, con account obbligatorio.** Scartato. E' l'anti pattern
numero uno nelle recensioni: dati storici tenuti in ostaggio dietro un account.
Qui l'account esiste, ma serve solo a sincronizzare fra dispositivi, e si puo'
ignorare per sempre senza perdere una sola funzione.

**Libreria di componenti pronta** (MUI, Chakra, shadcn). Scartata. Il componente
piu' usato dell'applicazione, la riga di una serie, non esiste in nessuna
libreria e va comunque disegnato da zero. Il resto e' un numero contenuto di
componenti semplici. In cambio si evitano centinaia di kilobyte e si mantiene il
controllo totale su accessibilita' e dimensioni dei bersagli di tocco.

**Libreria per i grafici** (Recharts, Chart.js). Scartata. I grafici sono tre,
semplici, e le librerie sbagliano quasi sempre le tre cose che qui contano:
alternativa testuale, tabella dati equivalente, distinzione delle serie senza
affidarsi al solo colore. Sono scritti a mano in SVG, in circa 150 righe.

## Conseguenze

**Positive**

- L'applicazione si apre e funziona in aereo, in cantina, con lo zero di segnale.
- Il guscio pesa circa 130 KB compressi, il catalogo altri 54 KB, entrambi in cache dopo la prima visita.
- Nessun costo di infrastruttura per chi non vuole la sincronizzazione: bastano dei file statici.
- Zero dipendenze per la interfaccia significa zero regressioni di accessibilita' introdotte da un aggiornamento altrui.

**Negative**

- I componenti vanno scritti e mantenuti: e' un costo iniziale reale, ripagato dal controllo.
- Senza un server che arbitri, la coerenza fra dispositivi si basa sulla regola "vince la scrittura piu' recente" (vedi ADR 0005).
- I dati stanno in IndexedDB: se l'utente cancella i dati del sito senza backup, non si recupera nulla. Per questo il backup e' in evidenza nelle impostazioni.
