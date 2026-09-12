# Accessibilità WCAG 2.1 AA (+ 2.2 AA) per la PWA fitness

Guida operativa per il team di sviluppo. Target di conformità: **WCAG 2.1 livello AA**, con adozione dei criteri aggiuntivi di **WCAG 2.2 livello AA** dove tecnicamente possibile.

Contesto: PWA mobile-first in React/TypeScript, lingua italiana, uso prevalente da smartphone in palestra (mano sudata, una mano sola, schermo piccolo, spesso con auricolari e VoiceOver/TalkBack attivi).

Nota su WCAG 2.2: aggiunge 9 criteri (2 di livello A, 4 AA, 3 AAA) e rende obsoleto il 4.1.1 Parsing, che non va più verificato. I criteri 2.2 di livello AA rilevanti qui sono: 2.4.11 Focus Not Obscured (Minimum), 2.5.8 Target Size (Minimum), 3.3.8 Accessible Authentication (Minimum). 2.5.7 Dragging Movements e 3.3.7 Redundant Entry sono livello **A** (quindi obbligatori a maggior ragione), 3.2.6 Consistent Help è livello A.

---

## Indice

1. [Mappa criteri WCAG per componente](#1-mappa-criteri-wcag-per-componente)
2. [Contrasto colori](#2-contrasto-colori)
3. [Target size e spaziatura dei tocchi](#3-target-size-e-spaziatura-dei-tocchi)
4. [Live region e annunci: timer, countdown, toast](#4-live-region-e-annunci-timer-countdown-toast)
5. [Drag and drop accessibile (editor scheda)](#5-drag-and-drop-accessibile-editor-scheda)
6. [Form accessibili (onboarding, input allenamento)](#6-form-accessibili-onboarding-input-allenamento)
7. [Checkbox custom e toggle di completamento serie](#7-checkbox-custom-e-toggle-di-completamento-serie)
8. [Modali e bottom sheet](#8-modali-e-bottom-sheet)
9. [Immagini degli esercizi e animazione a 2 frame](#9-immagini-degli-esercizi-e-animazione-a-2-frame)
10. [Grafici dei progressi](#10-grafici-dei-progressi)
11. [Motion e animazioni](#11-motion-e-animazioni)
12. [Navigazione, landmark e focus nella SPA](#12-navigazione-landmark-e-focus-nella-spa)
13. [Lingua, zoom, reflow e spaziatura testo](#13-lingua-zoom-reflow-e-spaziatura-testo)
14. [Checklist finale di rilascio e strumenti di test](#14-checklist-finale-di-rilascio-e-strumenti-di-test)
15. [Testing automatico in CI](#15-testing-automatico-in-ci)
16. [Fonti](#16-fonti)

---

## 1. Mappa criteri WCAG per componente

Per ogni schermata: criterio (numero + nome), livello, e cosa significa concretamente **in questa app**.

### 1.1 Onboarding multi-step (card radio/checkbox, slider, input numerici)

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 1.3.1 Info and Relationships | A | Le card "Obiettivo: massa / dimagrimento / forza" sono un gruppo di radio: `fieldset` + `legend` (o `role="radiogroup"` + `aria-labelledby`), non `div` cliccabili. La domanda dello step è la `legend`, non un `<p>` slegato. |
| 1.3.5 Identify Input Purpose | AA | Campi con significato noto (nome, email, data di nascita, peso corporeo non è in lista ma nome/email sì) devono avere `autocomplete` corretto: `autocomplete="given-name"`, `"email"`, `"bday"`. |
| 2.4.3 Focus Order | A | Dopo il click su "Avanti" il focus va spostato sul titolo del nuovo step, non resta sul bottone ora smontato (altrimenti il focus torna a `<body>` e lo screen reader perde il contesto). |
| 2.4.6 Headings and Labels | AA | Ogni step ha un `<h1>`/`<h2>` che descrive lo step ("Qual è il tuo obiettivo?"), non "Step 2". |
| 2.5.3 Label in Name | A | Se la card mostra "Dimagrimento", l'accessible name deve contenere "Dimagrimento" (chi usa comandi vocali dice "clicca Dimagrimento"). Vietato `aria-label="goal-cut"`. |
| 3.3.1 Error Identification | A | Errori di validazione descritti a testo, non solo bordo rosso. |
| 3.3.2 Labels or Instructions | A | Unità di misura visibili ("kg", "cm"), range accettati indicati prima dell'errore. |
| 3.3.3 Error Suggestion | AA | "Inserisci un peso tra 30 e 300 kg", non "Valore non valido". |
| 3.3.4 Error Prevention | AA | Prima di concludere l'onboarding, schermata di riepilogo modificabile. |
| 3.3.7 Redundant Entry | **A (2.2)** | Se altezza/peso sono già stati chiesti allo step 2, non richiederli allo step 5; se l'utente torna indietro i valori devono essere ancora lì. Lo stato dell'onboarding va persistito (store + `localStorage`) e ripristinato. |
| 2.5.7 Dragging Movements | **A (2.2)** | Lo slider (es. "giorni a settimana", "livello di esperienza") non può funzionare solo trascinando: serve tap sulla traccia, frecce da tastiera e/o pulsanti +/-. |
| 4.1.2 Name, Role, Value | A | Slider custom: `role="slider"` con `aria-valuemin/max/now/valuetext`, oppure (preferito) `<input type="range">` nativo. |

### 1.2 Lista esercizi con ricerca e filtri a chip

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 1.3.1 Info and Relationships | A | La lista è `<ul>/<li>`. I filtri sono un gruppo etichettato ("Filtra per gruppo muscolare"). |
| 2.4.6 Headings and Labels | AA | Il campo ricerca ha una label programmatica sempre presente (anche se visivamente è solo un'icona lente: allora `<label class="visually-hidden">Cerca esercizio</label>`, mai solo `placeholder`). |
| 4.1.2 Name, Role, Value | A | I chip filtro sono **toggle button**: `<button aria-pressed="true|false">`, oppure checkbox in un `fieldset`. Mai `div` con classe `.active`. |
| 4.1.3 Status Messages | AA | "24 esercizi trovati" in una live region `role="status"`: il conteggio risultati va annunciato senza spostare il focus. |
| 2.5.8 Target Size (Minimum) | **AA (2.2)** | Chip filtro e la "x" per rimuovere il filtro: almeno 24x24 px CSS, best practice 44x44. |
| 1.4.11 Non-text Contrast | AA | Il bordo del chip non selezionato deve avere 3:1 con lo sfondo, altrimenti il controllo non si distingue. |
| 2.4.7 Focus Visible | AA | Nelle liste virtualizzate il focus non deve sparire durante lo scroll. |

### 1.3 Scheda esercizio (2 frame animati + istruzioni)

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 1.1.1 Non-text Content | A | L'animazione a 2 frame ha un `alt` unico e descrittivo sul contenitore, o `role="img"` + `aria-label`, non due `alt` separati. |
| 2.2.2 Pause, Stop, Hide | A | L'animazione parte in automatico e dura più di 5 secondi: **obbligatorio** un controllo di pausa/riproduzione. |
| 2.3.1 Three Flashes | A | 2 frame che si alternano: mai sotto i 333 ms di periodo (max 3 lampeggi al secondo). Tenere >= 500 ms per frame. |
| 1.3.1 / 1.3.2 Meaningful Sequence | A | Le istruzioni passo-passo sono un `<ol>`, non paragrafi con "1." scritto a mano. |
| 1.4.5 Images of Text | AA | Le istruzioni non possono essere dentro l'immagine. |
| 2.3.3 Animation from Interactions | AAA (ma da rispettare) | Rispettare `prefers-reduced-motion`: con reduced motion l'animazione parte in pausa sul primo frame. |

### 1.4 Editor scheda (drag and drop, aggiunta/rimozione)

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 2.5.7 Dragging Movements | **A (2.2)** | Obbligatoria un'alternativa senza trascinamento: pulsanti "Sposta su"/"Sposta giù" (o menu "Sposta a posizione..."). |
| 2.1.1 Keyboard | A | Tutto l'editor usabile da tastiera esterna / switch control. |
| 2.1.2 No Keyboard Trap | A | Le librerie DnD non devono catturare il focus. |
| 4.1.3 Status Messages | AA | Ogni riordino annunciato: "Panca piana spostata alla posizione 2 di 6". |
| 3.3.4 Error Prevention | AA | La rimozione di un esercizio deve essere annullabile (toast con "Annulla") o confermata. |
| 2.5.8 Target Size | **AA (2.2)** | Le maniglie di drag e i pulsanti su/giù sono bersagli minuscoli per default: dimensionarli. |

### 1.5 Allenamento in corso (serie, checkbox, input, timer di recupero)

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 1.3.1 Info and Relationships | A | La tabella serie/peso/ripetizioni: se è una tabella usare `<table>` con `<th scope="col">`; se è una lista di card, ogni card ha un accessible name ("Serie 3 di 4"). |
| 2.2.1 Timing Adjustable | A | Il timer di recupero non deve far scadere nulla; deve essere pausabile, azzerabile ed estendibile (+30 s). Un countdown che chiude o avanza automaticamente lo stato senza possibilità di estensione viola il criterio. |
| 2.2.2 Pause, Stop, Hide | A | Il countdown aggiorna contenuto in automatico: deve esserci Pausa. |
| 4.1.3 Status Messages | AA | Fine recupero, serie completata, salvataggio: annunciati via live region. |
| 1.4.2 Audio Control | A | Il beep di fine recupero: se dura più di 3 secondi serve un controllo; in ogni caso mute/volume nelle impostazioni e mai audio come **unico** canale (serve anche testo + vibrazione). |
| 1.1.1 / 1.4.1 Use of Color | A | Serie completata non può essere indicata solo dal verde: serve checkbox con stato o icona + testo. |
| 3.3.2 Labels or Instructions | A | Ogni input peso/reps ha label propria, anche se ripetuta: `<label>Peso serie 2 (kg)</label>` (visivamente nascosta se serve). |
| 2.4.11 Focus Not Obscured | **AA (2.2)** | Con la bottom nav e la barra timer sticky, un input in fondo alla lista che riceve focus non deve finire sotto la barra. |
| 2.5.8 Target Size | **AA (2.2)** | Checkbox di completamento e pulsanti +/- peso: minimo 24x24, target 48x48. |

### 1.6 Timer/cronometro live

Vedi sezione 4. Criteri chiave: 2.2.1, 2.2.2, 4.1.3, 1.4.2, più `role="timer"` gestito correttamente (di per sé **non** annuncia nulla).

### 1.7 Grafici dei progressi

1.1.1 (alternativa testuale), 1.4.1 Use of Color (A), 1.4.11 Non-text Contrast (AA, 3:1 per linee e punti significativi), 1.3.1 (tabella dati associata), 1.4.10 Reflow (AA), 2.1.1 (se interattivo, navigabile da tastiera).

### 1.8 Bottom navigation

| Criterio | Livello | Cosa significa qui |
|---|---|---|
| 1.3.1 / 4.1.2 | A | `<nav aria-label="Navigazione principale">` con `<ul>`; voce attiva con `aria-current="page"`, non solo colore. |
| 2.4.8 Location | AAA (consigliato) | `aria-current` copre di fatto l'esigenza. |
| 3.2.3 Consistent Navigation | AA | Stesso ordine delle voci in tutte le schermate. |
| 2.4.11 Focus Not Obscured | **AA (2.2)** | La bottom nav fixed copre l'ultimo elemento a fuoco: risolvere con `scroll-padding-bottom` e `padding-bottom` sul contenitore. |
| 2.5.8 Target Size | **AA (2.2)** | Ogni voce almeno 48x48 px. |
| 1.4.1 Use of Color | A | Icona attiva distinta anche da forma/riempimento/etichetta, non solo dalla tinta. |

### 1.9 Modali, bottom sheet, toast

2.1.2 No Keyboard Trap (A), 2.4.3 Focus Order (A), 2.4.11 Focus Not Obscured (AA 2.2), 4.1.2 (`role="dialog"` + `aria-modal="true"` + `aria-labelledby`), 4.1.3 Status Messages (AA) per i toast, 2.2.1 (toast che sparisce da solo: il contenuto non deve essere l'unico canale informativo).

### 1.10 Tema chiaro/scuro

1.4.3 Contrast (Minimum) e 1.4.11 vanno verificati **in entrambi i temi**: una palette che passa in light può fallire in dark. 1.4.12 Text Spacing e 1.4.10 Reflow idem. Se il tema segue il sistema, supportare `prefers-color-scheme` e offrire comunque un override manuale.

### 1.11 Login / autenticazione

3.3.8 Accessible Authentication (Minimum), **AA 2.2**: nessun test di funzione cognitiva senza alternativa. In pratica: `autocomplete="username"` / `"current-password"` / `"one-time-code"`, **incolla sempre permesso**, niente OTP spezzato in 6 input separati senza supporto a incolla, niente captcha testuali o puzzle senza alternativa, niente "inserisci il 3° e 7° carattere della password".

---

## 2. Contrasto colori

### 2.1 Le soglie esatte

| Cosa | Soglia | Criterio |
|---|---|---|
| Testo normale (< 24 px regular, o < 18.66 px bold) | **4.5:1** | 1.4.3 Contrast (Minimum), AA |
| Testo grande (>= 24 px regular oppure >= 18.66 px bold) | **3:1** | 1.4.3, AA |
| Componenti UI: bordi di input, checkbox, toggle, icone-bottone, indicatore di focus, stato selezionato | **3:1** | 1.4.11 Non-text Contrast, AA |
| Oggetti grafici necessari alla comprensione: linee di un grafico, punti dati, icone informative | **3:1** | 1.4.11, AA |
| Logotipo | esente | 1.4.11 |
| Componenti disabilitati/inattivi | esenti | 1.4.11 e 1.4.3 (nota sotto) |

Il valore calcolato **non si arrotonda**: 2.99:1 non passa.

Per "testo grande" WCAG parla di 18pt / 14pt bold, che in CSS a 96 dpi valgono **24 px** e **18.66 px**. Il body di un'app mobile sta a 16 px: quindi quasi tutto il testo dell'app ricade nel 4.5:1.

### 2.2 Casi specifici di questa app

**Testo secondario e metadati.** "3 serie x 12 rip", "ultimo allenamento 4 giorni fa", le unità "kg": sono testo a tutti gli effetti e richiedono 4.5:1. Il grigio tenue tipico delle app fitness (`#9a9a9a` su bianco = 2.8:1) **non passa**. Minimo utilizzabile su `#FFFFFF` è circa `#767676` (4.54:1); su `#121212` circa `#8E8E8E`.

**Placeholder.** Il placeholder è testo e deve rispettare 4.5:1. Ma il vero problema è che il placeholder **non è una label**: va usato solo come suggerimento di formato ("es. 82,5"), mai al posto della label (3.3.2). Regola operativa: label sempre visibile, placeholder opzionale e comunque leggibile.

**Stati disabled.** Formalmente esenti da 1.4.3 e 1.4.11. Ma un bottone "Salva" disabilitato che nessuno riesce a leggere è un problema di usabilità reale: tenere almeno 3:1 sul testo disabled e, soprattutto, **non comunicare il disabled solo col colore** (aggiungere `aria-disabled` e un testo che spiega perché). Preferire `aria-disabled="true"` + bottone focusabile che, se premuto, annuncia il motivo, invece di `disabled` che rende il controllo invisibile alla navigazione.

**Testo sopra le immagini degli esercizi.** Le foto/illustrazioni hanno luminanza variabile: il nome dell'esercizio in overlay su una foto non ha contrasto garantito. Soluzioni, in ordine di preferenza:
1. testo fuori dall'immagine (scelta migliore);
2. barra piena semi-opaca dietro al testo con opacità sufficiente a garantire 4.5:1 nel caso peggiore;
3. gradiente scuro sul fondo dell'immagine, con verifica sul frame più chiaro dell'animazione.
Il `text-shadow` da solo non è un rimedio accettabile perché non si misura in modo affidabile.

**Tema scuro.** Sul dark theme non usare nero puro `#000` con bianco puro `#FFF` (21:1, affatica e provoca halation). Base consigliata: superficie `#121212`, testo primario `#E6E6E6` (circa 14:1), testo secondario `#A8A8A8` (circa 7:1), bordi `#3A3A3A` verificati contro la superficie a 3:1 quando identificano un controllo.

**Focus indicator.** Deve avere 3:1 con lo sfondo adiacente (1.4.11). Su tema scuro un outline blu di sistema può scendere sotto soglia: definire un token dedicato.

### 2.3 Token e CSS di riferimento

```css
:root {
  color-scheme: light dark;

  --c-bg: #ffffff;
  --c-surface: #f5f5f7;
  --c-text: #1a1a1a;          /* 16.9:1 su bg */
  --c-text-muted: #5f6368;    /* 6.9:1 su bg  */
  --c-border: #8a8f98;        /* 3.1:1 su bg  -> ok per 1.4.11 */
  --c-accent: #0a5ad6;        /* 6.3:1 su bg  */
  --c-accent-on: #ffffff;
  --c-danger: #b3261e;        /* 6.4:1 su bg  */
  --c-success: #1b6b33;        /* 4.9:1 su bg  */
  --c-focus: #0a5ad6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --c-bg: #121212;
    --c-surface: #1e1e1e;
    --c-text: #e6e6e6;
    --c-text-muted: #a8a8a8;
    --c-border: #6b7079;
    --c-accent: #7fb2ff;       /* accent schiarito per il dark */
    --c-accent-on: #0b1220;
    --c-danger: #ff8a80;
    --c-focus: #7fb2ff;
  }
}

/* Indicatore di focus unico, visibile su qualsiasi sfondo */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--c-focus);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Modalità contrasto forzato (Windows High Contrast / forced-colors) */
@media (forced-colors: active) {
  :where(button, .chip, .card-option) {
    border: 1px solid ButtonBorder;
    forced-color-adjust: none;
  }
  :focus-visible { outline: 3px solid Highlight; }
}
```

> Attenzione: i rapporti in commento vanno ricalcolati a ogni modifica della palette; ogni token colore deve essere coperto da un test automatico (vedi sezione 15), non da una verifica a occhio.

### 2.4 Come verificare

- **In design**: plugin Figma "Contrast" / "Stark"; verificare light **e** dark.
- **In browser**: DevTools > Elements > pannello colore mostra il rapporto e la soglia AA/AAA; Chrome DevTools ha anche l'emulazione di deuteranopia/protanopia/acromatopsia.
- **Automatico**: axe DevTools e Lighthouse rilevano solo il contrasto calcolabile (testo su sfondo tinta unita). **Non** rilevano testo su immagine, testo su gradiente, SVG di grafici: quelli vanno controllati a mano.
- **Test di regressione**: unit test sui token con una funzione `contrastRatio()` (esempio in sezione 15) che fallisce la build se un token scende sotto soglia.

---

## 3. Target size e spaziatura dei tocchi

### 3.1 Le regole

- **WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA**: ogni bersaglio per input di puntamento deve essere almeno **24 x 24 px CSS** (un quadrato pieno 24x24 deve entrare nel bersaglio).
- **Eccezione spaziatura**: un bersaglio più piccolo passa comunque se, disegnando un cerchio di **24 px di diametro centrato sul bounding box** di ogni bersaglio sottodimensionato, i cerchi non intersecano altri bersagli né i cerchi di altri bersagli sottodimensionati. In pratica: bersagli piccoli sono ammessi solo se ben distanziati.
- Altre eccezioni: link inline dentro una frase; controlli renderizzati dallo user agent e non modificati; esistenza di un comando equivalente conforme nella stessa pagina; presentazione essenziale.
- **Best practice (oltre WCAG)**: Apple HIG 44x44 pt, Material Design 48x48 dp. WCAG 2.2 AAA (2.5.5 Target Size Enhanced) chiede 44x44.

**Regola per questa app**: **44 px minimo per qualsiasi controllo primario, 48 px per la bottom nav e per i controlli usati durante l'allenamento** (mani sudate, telefono appoggiato, uso con una mano). I 24 px sono il pavimento legale, non l'obiettivo.

### 3.2 Implicazioni concrete

**Bottom navigation.** 5 voci su 360 px danno 72 px di larghezza per voce: larghezza non è il problema, l'altezza sì. Altezza minima dell'area toccabile 48 px, più la safe area iOS:

```css
.bottom-nav {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  min-height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
}
.bottom-nav a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 48px;
  font-size: 0.75rem;   /* etichetta SEMPRE presente, non solo icona */
  text-decoration: none;
}
/* Il contenuto non deve finire sotto la nav, e il focus nemmeno */
body { padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px)); }
html { scroll-padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
```

`scroll-padding-bottom` è la tecnica raccomandata per **2.4.11 Focus Not Obscured**: quando il browser porta in vista l'elemento che riceve focus, si ferma sopra la barra fissa. Va applicato anche `scroll-padding-top` se esiste un header sticky.

**Pulsanti +/- del peso.** Sono il caso peggiore: piccoli, ripetuti, adiacenti, usati sotto sforzo. Regola: 48x48 px di area toccabile ciascuno, con almeno 8 px di gap dal valore centrale, e comunque l'input numerico deve restare digitabile direttamente (così chi non riesce a colpire i +/- ha l'alternativa "equivalente").

```css
.stepper { display: flex; align-items: center; gap: 8px; }
.stepper button {
  inline-size: 48px;
  block-size: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: var(--c-surface);
  font-size: 1.25rem;
}
.stepper input {
  inline-size: 5.5rem;
  block-size: 48px;
  text-align: center;
  font-size: 1.125rem;
}
```

**Trucco per ingrandire un bersaglio senza cambiare la grafica** (icona 24 px che resta visivamente 24 px ma è toccabile 44 px):

```css
.icon-btn {
  position: relative;
  inline-size: 24px;
  block-size: 24px;
}
.icon-btn::after {          /* area toccabile estesa */
  content: "";
  position: absolute;
  inset: -10px;             /* 24 + 20 = 44 */
}
```

Attenzione: l'estensione con `::after` funziona per il puntatore, ma i cerchi da 24 px dell'eccezione spaziatura si calcolano sul bounding box reale del bersaglio, quindi due icone così estese non devono sovrapporsi.

**Checkbox di completamento serie.** Il quadratino visivo può restare 24 px, ma **l'area cliccabile deve essere l'intera riga della serie** (label che avvolge tutto), così il bersaglio reale è largo quanto lo schermo e alto almeno 48 px.

**Chip filtro.** `min-height: 40px; padding: 8px 14px;` e `gap: 8px` nel contenitore, in modo che i cerchi da 24 px non si intersechino.

### 3.3 Come verificare

- Chrome DevTools > device toolbar > ispeziona il box model: verificare che larghezza e altezza dichiarate includano il padding.
- axe DevTools ha una regola `target-size` (verifica 24x24 e la spaziatura).
- Test manuale: usare il telefono col pollice della mano non dominante, in piedi.

---

## 4. Live region e annunci: timer, countdown, toast

### 4.1 Regole non negoziabili sulle live region

1. **La live region deve esistere nel DOM al caricamento della pagina**, vuota. Se la si crea nel momento in cui serve, nella maggior parte delle combinazioni browser/screen reader non annuncia nulla. Va montata una volta sola, nel layout radice.
2. **Mai nasconderla** con `display:none`, `hidden` o `aria-hidden`: in quel caso non annuncia. Usare una classe `.visually-hidden` (clip).
3. **Una sola region `polite` e una sola `assertive` per l'intera app**, gestite da un servizio centrale con coda. Decine di live region sparse producono annunci sovrapposti e persi.
4. **`polite` è il default**. `assertive` interrompe quello che lo screen reader sta dicendo: usarlo solo per cose che non possono aspettare (fine del recupero, errore che blocca il salvataggio). Nota: su VoiceOver iOS le region polite vengono spesso trattate come assertive in braille, quindi non abusarne comunque.
5. **`role="timer"` NON annuncia**: ha `aria-live="off"` implicito. Serve solo a dichiarare semanticamente che quel nodo è un contatore. Il countdown che si aggiorna ogni secondo dentro un `role="timer"` è, correttamente, silenzioso.
6. **Mai mettere `aria-live` sul nodo che cambia ogni secondo.** Un countdown con `aria-live="polite"` produce 60 annunci al minuto: lo screen reader diventa inutilizzabile. Questo è l'errore più comune e più grave in un'app di allenamento.
7. Inserire il messaggio **in un'unica scrittura** (stringa già composta), non a pezzi.
8. Svuotare la region dopo 400-500 ms per evitare doppi annunci sullo stesso testo e per impedire che il testo resti navigabile.
9. Per ripetere lo stesso identico messaggio (es. "10 secondi" due volte) serve un trucco: aggiungere un carattere invisibile alternato oppure svuotare e reinserire con un tick di ritardo, altrimenti alcuni screen reader non rilevano la mutazione.

### 4.2 Servizio di annuncio centralizzato

```tsx
// src/a11y/LiveAnnouncer.tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Politeness = 'polite' | 'assertive';
type AnnounceFn = (message: string, politeness?: Politeness) => void;

const AnnouncerContext = createContext<AnnounceFn>(() => {});
export const useAnnounce = () => useContext(AnnouncerContext);

export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const timers = useRef<number[]>([]);

  const announce = useCallback<AnnounceFn>((message, politeness = 'polite') => {
    if (!message) return;
    const set = politeness === 'assertive' ? setAssertive : setPolite;
    // svuota e reinserisci: garantisce la mutazione anche per messaggi identici
    set('');
    const t1 = window.setTimeout(() => set(message), 60);
    const t2 = window.setTimeout(() => set(''), 60 + 500);
    timers.current.push(t1, t2);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      {/* Montate una sola volta, sempre presenti, mai nascoste con display:none */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}
```

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

### 4.3 Timer di recupero: pattern completo

Strategia: il display visivo si aggiorna ogni secondo dentro un `role="timer"` silenzioso; gli annunci vocali avvengono **solo a soglie** (60 s, 30 s, 10 s, 5 s, fine), più su azione esplicita dell'utente (pausa, +30 s, reset). L'utente può anche interrogare il tempo residuo con un pulsante "Tempo rimanente", che annuncia on demand.

```tsx
// src/features/workout/RestTimer.tsx
import { useEffect, useRef, useState } from 'react';
import { useAnnounce } from '../../a11y/LiveAnnouncer';

const SOGLIE_ANNUNCIO = [60, 30, 10, 5];

function formatta(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}`;
}

function formattaVocale(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} second${s === 1 ? 'o' : 'i'}`;
  if (s === 0) return `${m} minut${m === 1 ? 'o' : 'i'}`;
  return `${m} minut${m === 1 ? 'o' : 'i'} e ${s} secondi`;
}

export function RestTimer({ durata, onFine }: { durata: number; onFine: () => void }) {
  const [residuo, setResiduo] = useState(durata);
  const [inPausa, setInPausa] = useState(false);
  const annunciate = useRef<Set<number>>(new Set());
  const announce = useAnnounce();

  useEffect(() => {
    if (inPausa || residuo <= 0) return;
    const id = window.setInterval(() => setResiduo((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [inPausa, residuo]);

  useEffect(() => {
    if (residuo <= 0) {
      announce('Recupero terminato. Inizia la serie successiva.', 'assertive');
      onFine();
      return;
    }
    if (SOGLIE_ANNUNCIO.includes(residuo) && !annunciate.current.has(residuo)) {
      annunciate.current.add(residuo);
      announce(`${formattaVocale(residuo)} al termine del recupero.`, 'polite');
    }
  }, [residuo, announce, onFine]);

  const aggiungi30 = () => {
    setResiduo((r) => r + 30);
    annunciate.current.clear();
    announce('Aggiunti 30 secondi. Recupero esteso.', 'polite');
  };

  const togglePausa = () => {
    setInPausa((p) => {
      announce(p ? 'Timer ripreso.' : 'Timer in pausa.', 'polite');
      return !p;
    });
  };

  return (
    <section aria-labelledby="rest-title">
      <h2 id="rest-title">Recupero</h2>

      {/* role=timer: semantico, NON annuncia (aria-live off implicito). 
          aria-hidden sul numero evita che il SR lo legga durante l'esplorazione continua. */}
      <output role="timer" className="timer-display" aria-label="Tempo di recupero rimanente">
        <span aria-hidden="true">{formatta(residuo)}</span>
        <span className="visually-hidden">{formattaVocale(residuo)} rimanenti</span>
      </output>

      <div className="timer-controls">
        <button type="button" onClick={togglePausa} aria-pressed={inPausa}>
          {inPausa ? 'Riprendi timer' : 'Metti in pausa il timer'}
        </button>
        <button type="button" onClick={aggiungi30}>Aggiungi 30 secondi</button>
        <button type="button" onClick={() => { setResiduo(0); }}>Salta il recupero</button>
        <button
          type="button"
          onClick={() => announce(`${formattaVocale(residuo)} rimanenti.`, 'polite')}
        >
          Leggi tempo rimanente
        </button>
      </div>
    </section>
  );
}
```

Punti chiave del pattern:

- La `<output role="timer">` cambia ogni secondo ma **non è una live region**, quindi non genera rumore. Il testo nascosto dentro serve a chi ci arriva navigando, non a chi ascolta passivamente.
- Gli annunci a soglia usano `polite`; solo la fine del recupero usa `assertive` perché è il momento in cui l'utente deve agire.
- `annunciate.current` impedisce doppi annunci se il componente ri-renderizza.
- "Aggiungi 30 secondi", "Pausa", "Salta" coprono **2.2.1 Timing Adjustable**.
- Il beep di fine recupero va **sempre accompagnato** da annuncio testuale e, se disponibile, da `navigator.vibrate([200, 100, 200])`: l'audio non può essere l'unico canale (1.4.1, 1.1.1). Il suono deve essere disattivabile dalle impostazioni e non partire mai senza un gesto utente precedente (policy autoplay dei browser, oltre a 1.4.2).

### 4.4 Cronometro in salita (durata allenamento)

Stesso principio, ancora più severo: un cronometro che sale non ha soglie naturali. Annunciare **solo** su richiesta e agli eventi significativi (start, stop, cambio esercizio). Il display resta `role="timer"` silenzioso.

### 4.5 Toast di conferma

```tsx
// Il toast VISIVO è separato dall'annuncio. Non mettere aria-live sul toast stesso.
function salvaSerie() {
  persist();
  mostraToast('Serie salvata');          // solo visivo, aria-hidden="true"
  announce('Serie 2 salvata: 80 chili per 10 ripetizioni.', 'polite');
}
```

Regole: il toast non deve contenere elementi interattivi essenziali (un "Annulla" dentro un toast che sparisce in 4 secondi è irraggiungibile da tastiera e da screen reader). Se serve "Annulla", o il toast è persistente e focusabile, oppure l'azione è ripetibile da un altro punto dell'interfaccia. Durata minima consigliata: 6 secondi, e comunque la stessa informazione deve essere recuperabile altrove.

---

## 5. Drag and drop accessibile (editor scheda)

### 5.1 Cosa impone WCAG 2.2

**SC 2.5.7 Dragging Movements (livello A)**: ogni funzionalità che si ottiene trascinando deve essere ottenibile **con un singolo puntatore senza trascinare**, salvo che il trascinamento sia essenziale o sia gestito dallo user agent. Riordinare una lista di esercizi non è "essenziale": l'alternativa è obbligatoria.

L'esempio citato esplicitamente dalla documentazione W3C è proprio il nostro caso: una lista ordinabile che, dopo il tap su un elemento, espone controlli adiacenti per spostarlo su o giù con un semplice tap.

Attenzione: 2.5.7 riguarda il **puntatore**, non la tastiera. La navigazione da tastiera è già obbligatoria da **2.1.1 Keyboard (A)**. Servono entrambe. E i pulsanti su/giù risolvono le due cose insieme, motivo per cui sono il pattern consigliato: più robusti di una "modalità drag da tastiera" custom, che va spiegata, ricordata e spesso non viene annunciata bene.

### 5.2 Pattern consigliato

Per ogni riga: pulsante "Sposta su", pulsante "Sposta giù", entrambi veri `<button>`, entrambi con accessible name che include il nome dell'esercizio, disabilitati (via `aria-disabled`, non `disabled`) agli estremi, con annuncio live dopo ogni spostamento e **conservazione del focus sul pulsante premuto**.

```tsx
// src/features/plan-editor/ExerciseList.tsx
import { useRef } from 'react';
import { useAnnounce } from '../../a11y/LiveAnnouncer';

type Esercizio = { id: string; nome: string };

export function ExerciseList({
  esercizi,
  onReorder,
  onRemove,
}: {
  esercizi: Esercizio[];
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}) {
  const announce = useAnnounce();
  const listRef = useRef<HTMLOListElement>(null);

  const sposta = (from: number, direzione: -1 | 1) => {
    const to = from + direzione;
    if (to < 0 || to >= esercizi.length) return;
    const nome = esercizi[from].nome;
    onReorder(from, to);
    announce(`${nome} spostato alla posizione ${to + 1} di ${esercizi.length}.`, 'polite');

    // Il DOM si riordina: rimettere il focus sullo stesso pulsante, ora in nuova posizione
    requestAnimationFrame(() => {
      const selettore = `[data-move="${direzione === -1 ? 'up' : 'down'}"][data-index="${to}"]`;
      listRef.current?.querySelector<HTMLButtonElement>(selettore)?.focus();
    });
  };

  return (
    <ol ref={listRef} className="exercise-list">
      {esercizi.map((es, i) => {
        const primo = i === 0;
        const ultimo = i === esercizi.length - 1;
        return (
          <li key={es.id} className="exercise-row">
            <span className="exercise-row__pos" aria-hidden="true">{i + 1}</span>
            <span className="exercise-row__name" id={`ex-name-${es.id}`}>{es.nome}</span>

            <div className="exercise-row__actions">
              <button
                type="button"
                data-move="up"
                data-index={i}
                aria-disabled={primo}
                onClick={() => (primo
                  ? announce(`${es.nome} è già il primo esercizio.`, 'polite')
                  : sposta(i, -1))}
              >
                <span aria-hidden="true">↑</span>
                <span className="visually-hidden">Sposta {es.nome} in su</span>
              </button>

              <button
                type="button"
                data-move="down"
                data-index={i}
                aria-disabled={ultimo}
                onClick={() => (ultimo
                  ? announce(`${es.nome} è già l'ultimo esercizio.`, 'polite')
                  : sposta(i, 1))}
              >
                <span aria-hidden="true">↓</span>
                <span className="visually-hidden">Sposta {es.nome} in giù</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onRemove(es.id);
                  announce(`${es.nome} rimosso dalla scheda. Usa Annulla per ripristinare.`, 'polite');
                }}
              >
                <span aria-hidden="true">✕</span>
                <span className="visually-hidden">Rimuovi {es.nome} dalla scheda</span>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

```css
.exercise-row__actions button {
  inline-size: 44px;
  block-size: 44px;
  display: grid;
  place-items: center;
}
.exercise-row__actions button[aria-disabled="true"] {
  opacity: 0.45;   /* resta focusabile e attivabile: spiega perché non si può */
}
```

### 5.3 Convivenza con la libreria di drag and drop

Se si usa `dnd-kit` o `@hello-pangea/dnd` per il drag col dito, il drag resta come **scorciatoia**, non come unico modo. Regole:

- La maniglia di drag deve essere `aria-hidden="true"` **oppure** un vero bottone con `aria-describedby` che spiega le istruzioni: mai un `div` con `tabIndex={0}` e nessun ruolo.
- Se si usano le istruzioni della libreria (`dnd-kit` espone `screenReaderInstructions` e `announcements`), tradurle in italiano e verificare che non entrino in conflitto con il nostro `LiveAnnouncer`: una sola fonte di annunci per volta.
- `touch-action: none` sulla maniglia serve al drag ma disabilita lo scroll: applicarlo **solo** alla maniglia, mai alla riga intera, o la lista non scrolla più su mobile.
- Verificare `2.1.2 No Keyboard Trap`: con la libreria attiva, `Tab` deve continuare a uscire dalla lista.

### 5.4 Alternativa al drag anche altrove

Ovunque ci sia un gesto di trascinamento serve l'alternativa a tap singolo:

- **Slider** (durata recupero, intensità): `<input type="range">` nativo è già conforme (tap sulla traccia + frecce), oppure affiancare pulsanti +/-.
- **Swipe per eliminare** una serie o un esercizio: serve sempre anche un pulsante "Elimina" visibile o raggiungibile da un menu (questo ricade anche in **2.5.1 Pointer Gestures**, livello A: niente gesti path-based come unica via).
- **Pull to refresh**: gestito dallo user agent è esente, ma se è custom serve un pulsante "Aggiorna".

---

## 6. Form accessibili (onboarding, input allenamento)

### 6.1 Label

- **Label sempre visibile**, associata via `htmlFor`/`id` o annidando l'input dentro la `<label>`. Il placeholder non è una label: sparisce alla digitazione, ha contrasto basso e non viene letto da tutti gli screen reader in modo affidabile.
- Il **floating label** è accettabile solo se in stato riposo resta leggibile con 4.5:1 e non viene coperto dal valore.
- Se l'etichetta visiva deve essere corta per ragioni di spazio (es. solo "kg"), l'accessible name deve comunque essere completo: `aria-label="Peso serie 2 in chilogrammi"` **includendo** il testo visibile (SC 2.5.3 Label in Name).

### 6.2 Input numerici (peso, ripetizioni, tempo)

Evitare `<input type="number">` per i pesi decimali: su iOS la tastiera numerica non mostra la virgola in tutte le locale, le frecce spinner sono bersagli minuscoli, e `type="number"` accetta notazione scientifica. Pattern consigliato:

```tsx
<div className="field">
  <label htmlFor="peso-s2">Peso serie 2 (kg)</label>
  <input
    id="peso-s2"
    name="peso-s2"
    type="text"
    inputMode="decimal"
    enterKeyHint="next"
    autoComplete="off"
    pattern="[0-9]+([.,][0-9]{1,2})?"
    aria-describedby="peso-s2-hint peso-s2-err"
    aria-invalid={!!errore}
    value={valore}
    onChange={(e) => setValore(e.target.value)}
  />
  <p id="peso-s2-hint" className="field__hint">Usa la virgola per i decimali, es. 82,5</p>
  {errore && (
    <p id="peso-s2-err" className="field__error">
      <span aria-hidden="true">⚠ </span>{errore}
    </p>
  )}
</div>
```

- **Ripetizioni**: `inputMode="numeric"` + `pattern="[0-9]*"`.
- **Tempo (mm:ss)**: due campi separati con label esplicite ("minuti", "secondi") oppure un solo campo con formato spiegato nell'hint; mai un campo mascherato che riscrive i caratteri mentre si digita senza annunciarlo.
- **`enterKeyHint`** migliora concretamente il flusso su mobile durante l'allenamento: `"next"` tra serie, `"done"` sull'ultimo.
- Non usare `autofocus` sugli input della schermata di allenamento: apre la tastiera e copre metà schermo.

### 6.3 Errori

Tre cose insieme, sempre:

1. `aria-invalid="true"` sull'input;
2. messaggio testuale collegato con `aria-describedby` (l'id del messaggio va **sempre** nella lista `aria-describedby`, anche quando il messaggio non è visibile: così l'associazione esiste già quando appare);
3. icona o testo, mai solo il colore rosso (1.4.1).

Alla submit con errori: spostare il focus sul **primo campo non valido** (non su un riepilogo generico, che costringe a due passaggi), e annunciare il totale via `polite`:

```tsx
const onSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const errori = valida(valori);
  if (Object.keys(errori).length > 0) {
    setErrori(errori);
    const primoId = Object.keys(errori)[0];
    document.getElementById(primoId)?.focus();
    announce(`${Object.keys(errori).length} campi da correggere. ${errori[primoId]}`, 'assertive');
    return;
  }
  salva(valori);
};
```

Non validare "live" a ogni tasto: produce errori mentre l'utente sta ancora scrivendo e, con `aria-live`, spamma. Validare su `blur` e su submit.

### 6.4 Card di scelta dell'onboarding: fieldset + legend

Le card selezionabili devono essere **input nativi** stilizzati, non `div` con `onClick`. Così si ottengono gratis: gestione tastiera (frecce nei radiogroup), stato annunciato, supporto ai comandi vocali, form submit.

```tsx
<fieldset className="choice-group">
  <legend className="choice-group__legend">Qual è il tuo obiettivo principale?</legend>

  {OBIETTIVI.map((o) => (
    <label key={o.id} className="choice-card">
      <input
        type="radio"
        name="obiettivo"
        value={o.id}
        checked={valore === o.id}
        onChange={() => setValore(o.id)}
        className="choice-card__input"
      />
      <span className="choice-card__body">
        <span className="choice-card__title">{o.titolo}</span>
        <span className="choice-card__desc">{o.descrizione}</span>
      </span>
    </label>
  ))}
</fieldset>
```

```css
/* L'input resta nel flusso e focusabile: NON usare display:none */
.choice-card__input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.choice-card {
  display: block;
  min-height: 64px;
  padding: 16px;
  border: 2px solid var(--c-border);
  border-radius: 12px;
  cursor: pointer;
}
.choice-card:has(.choice-card__input:checked) {
  border-color: var(--c-accent);
  background: color-mix(in srgb, var(--c-accent) 10%, var(--c-bg));
}
/* Lo stato selezionato NON è solo colore: aggiunge un segno di spunta */
.choice-card:has(.choice-card__input:checked) .choice-card__title::after {
  content: " ✓";
}
.choice-card:has(.choice-card__input:focus-visible) {
  outline: 3px solid var(--c-focus);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .choice-card:has(.choice-card__input:checked) { border: 3px solid Highlight; }
}
```

Per scelte multiple usare `type="checkbox"` nello stesso `fieldset` (cambiando la legend in "Seleziona tutti i gruppi muscolari che vuoi allenare"). Se il gruppo è lungo e lo screen reader deve sapere quanti sono: `aria-describedby` sulla legend con "8 opzioni disponibili".

### 6.5 Indicatore di step

```tsx
<nav aria-label="Avanzamento configurazione">
  <ol className="stepper-nav">
    {STEPS.map((s, i) => (
      <li key={s.id}>
        <span
          aria-current={i === stepCorrente ? 'step' : undefined}
          className={i === stepCorrente ? 'is-current' : undefined}
        >
          <span className="visually-hidden">
            Passo {i + 1} di {STEPS.length}:{' '}
          </span>
          {s.label}
          {i < stepCorrente && <span className="visually-hidden"> (completato)</span>}
        </span>
      </li>
    ))}
  </ol>
</nav>
```

`aria-current="step"` è il valore corretto per un wizard (`"page"` è per la navigazione di pagina). Se la barra di avanzamento è puramente decorativa, aggiungere comunque un `<h1>` testuale "Passo 3 di 5: le tue misure".

### 6.6 Gestione del focus al cambio step

Il pattern corretto in una SPA: dopo il cambio step, spostare il focus sull'intestazione del nuovo step, resa programmaticamente focusabile con `tabIndex={-1}`, e **non** lasciare l'outline permanente.

```tsx
function OnboardingStep({ step, titolo, children }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  return (
    <section aria-labelledby={`step-${step}-title`}>
      <h1 id={`step-${step}-title`} ref={headingRef} tabIndex={-1} className="focus-target">
        {titolo}
      </h1>
      {children}
    </section>
  );
}
```

```css
/* Niente outline sul titolo focalizzato programmaticamente: il focus-visible resta per la tastiera */
.focus-target:focus { outline: none; }
.focus-target:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 4px; }
```

Alternativa: non spostare il focus e annunciare via `polite` "Passo 3 di 5, le tue misure". Il pattern con focus sul titolo è preferibile perché riposiziona anche il punto di lettura, non solo l'annuncio.

### 6.7 Redundant Entry (3.3.7) e autenticazione (3.3.8)

- I dati già inseriti in un flusso (onboarding, creazione scheda) vanno **precompilati** quando ricompaiono, o proposti come scelta. Tornando indietro nel wizard i valori devono essere intatti.
- Login: `autocomplete="username"`, `autocomplete="current-password"`, `autocomplete="one-time-code"` sull'OTP, incolla **sempre** abilitato, nessun campo OTP spezzato in 6 box separati senza gestione dell'incolla, nessun blocco dei password manager (`autocomplete="off"` sulle password è una violazione pratica).

---

## 7. Checkbox custom e toggle di completamento serie

### 7.1 Regola base

Usare `<input type="checkbox">` nativo, nascosto visivamente ma **presente e focusabile**, con la grafica costruita in CSS. Non ricostruire `role="checkbox"` a mano se non è strettamente necessario: con il nativo si ottengono `Space` per attivare, lo stato annunciato ("selezionato"/"non selezionato"), il supporto ai comandi vocali e la modalità contrasto forzato.

### 7.2 Componente serie

```tsx
// src/features/workout/SetRow.tsx
export function SetRow({ serie, indice, totale, onToggle }: Props) {
  const id = `serie-${serie.id}`;
  return (
    <li className="set-row">
      <label className="set-row__check" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={serie.completata}
          onChange={(e) => onToggle(e.target.checked)}
          aria-describedby={`${id}-dettagli`}
        />
        <span className="set-row__box" aria-hidden="true" />
        <span className="set-row__label">
          Serie {indice + 1} di {totale}
        </span>
      </label>

      <span id={`${id}-dettagli`} className="set-row__meta">
        {serie.peso} kg <span aria-hidden="true">×</span>
        <span className="visually-hidden">per</span> {serie.reps} ripetizioni
      </span>
    </li>
  );
}
```

VoiceOver leggerà: "Serie 2 di 4, casella di controllo, non selezionata, 80 kg per 10 ripetizioni". Dopo il tap: "selezionata".

### 7.3 CSS

```css
.set-row__check {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;      /* l'intera riga è il bersaglio: target size risolto */
  padding: 8px 12px;
  cursor: pointer;
}
.set-row__check input {
  position: absolute;
  opacity: 0;            /* mai display:none: perderebbe focus e semantica */
  inline-size: 1px;
  block-size: 1px;
}
.set-row__box {
  inline-size: 28px;
  block-size: 28px;
  flex: 0 0 auto;
  border: 2px solid var(--c-border);   /* 3:1 richiesto da 1.4.11 */
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.set-row__check input:checked + .set-row__box {
  background: var(--c-accent);
  border-color: var(--c-accent);
}
.set-row__check input:checked + .set-row__box::after {
  content: "";
  inline-size: 10px;
  block-size: 16px;
  border: solid var(--c-accent-on);
  border-width: 0 3px 3px 0;
  transform: translateY(-2px) rotate(45deg);   /* il segno di spunta: forma, non solo colore */
}
.set-row__check input:focus-visible + .set-row__box {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}
@media (forced-colors: active) {
  .set-row__check input:checked + .set-row__box { background: Highlight; }
}
```

### 7.4 Cosa NON fare

- `role="switch"` per il completamento di una serie: uno switch significa "acceso/spento" di un'impostazione persistente; una serie si "completa", quindi è una checkbox. Lo switch va bene per "Suono timer attivo".
- Togliere la riga dalla lista appena viene spuntata: il focus cade su `body`. Se si deve rimuovere, spostare prima il focus sull'elemento successivo e annunciare.
- Cambiare solo lo sfondo verde: viola 1.4.1 Use of Color.

---

## 8. Modali e bottom sheet

Modale e bottom sheet sono **lo stesso pattern** dal punto di vista dell'accessibilità: cambia solo l'animazione di ingresso.

### 8.1 Requisiti

1. `role="dialog"` + `aria-modal="true"` + `aria-labelledby` che punta al titolo (o `aria-label`).
2. Focus **spostato dentro** al dialog all'apertura: sul primo elemento interattivo, oppure sul titolo con `tabIndex={-1}` se il primo elemento è distruttivo.
3. **Focus trap**: `Tab` e `Shift+Tab` ciclano dentro al dialog.
4. `Escape` chiude (e sul bottom sheet anche lo swipe verso il basso, ma lo swipe non può essere l'unico modo: serve il pulsante Chiudi, per 2.5.1 e 2.5.7).
5. Focus **restituito** all'elemento che ha aperto il dialog alla chiusura.
6. Resto della pagina reso inaccessibile con **`inert`** (attributo nativo, supportato da tutti i browser moderni), che copre insieme focus, puntatore e albero di accessibilità. `aria-hidden` da solo non impedisce il focus.
7. Scroll di fondo bloccato, senza perdere la posizione.

### 8.2 Implementazione consigliata: `<dialog>` nativo

L'elemento `<dialog>` con `showModal()` fornisce nativamente: focus trap, `Escape`, top layer, `::backdrop`, inertizzazione del resto del documento. È la soluzione più robusta e va preferita a un focus trap scritto a mano.

```tsx
// src/ui/Sheet.tsx
import { useEffect, useRef } from 'react';

export function Sheet({
  open,
  onClose,
  titolo,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titolo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const apertoDa = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      apertoDa.current = document.activeElement as HTMLElement;
      d.showModal();                       // focus trap + Escape + inert nativi
      document.body.style.overflow = 'hidden';
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const handleClose = () => {
    document.body.style.overflow = '';
    apertoDa.current?.focus();             // restituzione del focus
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={handleClose}
      onClick={(e) => { if (e.target === ref.current) handleClose(); }}  // click sul backdrop
    >
      <div className="sheet__panel">
        <div className="sheet__grabber" aria-hidden="true" />
        <h2 id="sheet-title" className="sheet__title">{titolo}</h2>
        <button type="button" className="sheet__close" onClick={handleClose}>
          <span aria-hidden="true">✕</span>
          <span className="visually-hidden">Chiudi {titolo}</span>
        </button>
        <div className="sheet__content">{children}</div>
      </div>
    </dialog>
  );
}
```

```css
.sheet {
  border: 0;
  padding: 0;
  background: transparent;
  max-inline-size: 100%;
  inline-size: 100%;
  margin: 0;
  margin-block-start: auto;    /* ancorato in basso: bottom sheet */
}
.sheet::backdrop { background: rgb(0 0 0 / 0.5); }
.sheet__panel {
  background: var(--c-bg);
  color: var(--c-text);
  border-radius: 20px 20px 0 0;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  max-block-size: 85dvh;
  overflow-y: auto;
  overscroll-behavior: contain;   /* niente scroll chaining sul body */
}
.sheet__close { position: absolute; inset-block-start: 12px; inset-inline-end: 12px;
  inline-size: 44px; block-size: 44px; }

@media (prefers-reduced-motion: no-preference) {
  .sheet[open] .sheet__panel { animation: sheet-in 220ms ease-out; }
  @keyframes sheet-in { from { transform: translateY(100%); } to { transform: none; } }
}
```

### 8.3 Se non si usa `<dialog>`

Se il design impone un contenitore custom, allora servono a mano: `inert` su tutti i fratelli del dialog, gestione `keydown` per `Tab`/`Escape`, e salvataggio/ripristino del focus.

```tsx
useEffect(() => {
  if (!open) return;
  const root = document.getElementById('app-root');
  root?.setAttribute('inert', '');
  return () => root?.removeAttribute('inert');
}, [open]);
```

### 8.4 Blocco dello scroll di fondo su iOS

`overflow: hidden` sul body non basta su iOS Safari. Pattern robusto:

```ts
function bloccaScroll() {
  const y = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${y}px`;
  document.body.style.inlineSize = '100%';
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, y);   // ripristina la posizione: senza questo l'utente si perde
  };
}
```

### 8.5 2.4.11 nei bottom sheet

Un bottom sheet parziale (peek) che resta visibile sopra il contenuto può coprire l'elemento a fuoco: o è modale (e allora il resto è `inert`, nessun problema), o è non modale e allora va aggiunto `scroll-padding-bottom` pari alla sua altezza.

---

## 9. Immagini degli esercizi e animazione a 2 frame

### 9.1 Decorativa o informativa?

| Caso | Trattamento |
|---|---|
| Thumbnail nella lista esercizi, accanto al nome già scritto | **Decorativa**: `alt=""` (attributo presente e vuoto). Ripetere il nome sarebbe rumore. |
| Immagine/animazione nella scheda esercizio, che mostra l'esecuzione | **Informativa**: alt descrittivo dell'esecuzione. |
| Icone dentro pulsanti con testo visibile | `aria-hidden="true"` sull'icona. |
| Icone dentro pulsanti senza testo | Testo alternativo sul **bottone** (`.visually-hidden`), icona `aria-hidden="true"`. |
| Grafica di sfondo, pattern, gradiente | CSS `background-image`, non `<img>`. |

### 9.2 Alt text per l'animazione a 2 frame

L'errore tipico è mettere due `<img>` con due `alt` e alternarle: lo screen reader può leggere due descrizioni, o cambiarle sotto al dito. Corretto: **un solo contenitore con un solo nome accessibile**, e i due frame nascosti all'accessibilità.

L'alt deve descrivere il movimento, non la foto: non "uomo con bilanciere", ma "Panca piana con bilanciere: dalla posizione con le braccia distese, il bilanciere scende controllato fino a sfiorare il petto e risale". Le istruzioni dettagliate restano comunque nel testo `<ol>` sotto, che è la vera alternativa testuale (1.1.1 è soddisfatto anche da testo adiacente).

```tsx
// src/features/exercise/ExerciseAnimation.tsx
import { useEffect, useRef, useState } from 'react';

export function ExerciseAnimation({
  frames,
  descrizione,
  nome,
}: { frames: [string, string]; descrizione: string; nome: string }) {
  const reduced = usePrefersReducedMotion();
  const [inRiproduzione, setInRiproduzione] = useState(!reduced);
  const [frame, setFrame] = useState(0);
  const idRef = useRef<number>();

  useEffect(() => {
    if (!inRiproduzione) return;
    idRef.current = window.setInterval(() => setFrame((f) => (f + 1) % 2), 700); // >= 500ms
    return () => clearInterval(idRef.current);
  }, [inRiproduzione]);

  return (
    <figure className="exercise-anim">
      {/* Un solo nome accessibile per l'intero blocco animato */}
      <div className="exercise-anim__stage" role="img" aria-label={descrizione}>
        {frames.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="exercise-anim__frame"
            data-active={i === frame}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {/* 2.2.2 Pause, Stop, Hide: obbligatorio, l'animazione dura piu' di 5 secondi */}
      <button
        type="button"
        className="exercise-anim__toggle"
        aria-pressed={inRiproduzione}
        onClick={() => setInRiproduzione((p) => !p)}
      >
        {inRiproduzione ? `Metti in pausa l'animazione di ${nome}` : `Riproduci l'animazione di ${nome}`}
      </button>

      <figcaption className="visually-hidden">{descrizione}</figcaption>
    </figure>
  );
}
```

```css
.exercise-anim__stage { position: relative; aspect-ratio: 4 / 3; max-inline-size: 100%; }
.exercise-anim__frame {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
  opacity: 0;
}
.exercise-anim__frame[data-active="true"] { opacity: 1; }
.exercise-anim__toggle { min-block-size: 44px; }
```

### 9.3 Frequenza dei frame e 2.3.1

**SC 2.3.1 Three Flashes or Below Threshold (A)**: niente contenuto che lampeggia più di 3 volte al secondo. Due frame che si alternano ogni 700 ms fanno circa 0,7 lampeggi/secondo: sicuro. **Non scendere mai sotto 400 ms per frame** e non implementare "velocità animazione" con valori più rapidi. Se i due frame hanno luminanza molto diversa (es. sfondo bianco e sfondo scuro), il rischio percettivo cresce: uniformare gli sfondi in fase di produzione degli asset.

### 9.4 prefers-reduced-motion

Con reduced motion attivo l'animazione **parte in pausa** sul primo frame, e resta disponibile il pulsante per avviarla. Non è accettabile che parta comunque.

```tsx
// src/a11y/usePrefersReducedMotion.ts
import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
```

Aggiungere anche un'impostazione in-app "Riduci animazioni", perché non tutti gli utenti sanno di poterla attivare a livello di sistema; l'impostazione in-app deve poter **sovrascrivere** il default di sistema in entrambe le direzioni.

### 9.5 Altre note sulle immagini

- Se l'immagine non carica, l'`alt` deve restare significativo: evitare contenitori con `background-image` per le immagini informative.
- Le immagini degli esercizi devono avere `width`/`height` o `aspect-ratio` per evitare layout shift (non è WCAG, ma un layout che salta sotto il dito è un problema motorio reale).
- Nessun testo dentro l'immagine (1.4.5 Images of Text): serie, ripetizioni e note vanno in HTML.

---

## 10. Grafici dei progressi

### 10.1 Il principio

Un grafico è un'immagine complessa: **l'alternativa testuale non è l'alt, è la combinazione di (a) un riassunto in linguaggio naturale e (b) i dati completi in tabella**.

### 10.2 Pattern consigliato

```tsx
// src/features/progress/ProgressChart.tsx
import { useId, useState } from 'react';

type Punto = { data: string; valore: number };

export function ProgressChart({ titolo, unita, punti }: { titolo: string; unita: string; punti: Punto[] }) {
  const [tabellaVisibile, setTabellaVisibile] = useState(false);
  const tableId = useId();

  const primo = punti[0], ultimo = punti[punti.length - 1];
  const delta = ultimo.valore - primo.valore;
  const max = punti.reduce((a, b) => (b.valore > a.valore ? b : a));
  const riassunto =
    `${titolo}: da ${primo.valore} ${unita} il ${primo.data} a ${ultimo.valore} ${unita} il ${ultimo.data}, ` +
    `variazione di ${delta >= 0 ? '+' : ''}${delta} ${unita}. Massimo ${max.valore} ${unita} il ${max.data}. ` +
    `${punti.length} rilevazioni totali.`;

  return (
    <figure className="chart">
      <figcaption id={`${tableId}-cap`}>{titolo}</figcaption>

      {/* L'SVG e' decorativo per l'AT: l'informazione sta nel riassunto e nella tabella */}
      <svg
        role="img"
        aria-labelledby={`${tableId}-cap ${tableId}-desc`}
        viewBox="0 0 320 180"
        className="chart__svg"
      >
        <desc id={`${tableId}-desc`}>{riassunto}</desc>
        {/* serie: colore + tratteggio + marcatore, mai solo colore */}
        <polyline className="chart__line chart__line--1" points={buildPoints(punti)} />
        {punti.map((p) => (
          <circle key={p.data} className="chart__dot" cx={x(p)} cy={y(p)} r="4" />
        ))}
      </svg>

      <p className="chart__summary">{riassunto}</p>

      <button
        type="button"
        aria-expanded={tabellaVisibile}
        aria-controls={tableId}
        onClick={() => setTabellaVisibile((v) => !v)}
      >
        {tabellaVisibile ? 'Nascondi i dati in tabella' : 'Mostra i dati in tabella'}
      </button>

      <div id={tableId} hidden={!tabellaVisibile}>
        <table className="chart__table">
          <caption className="visually-hidden">Dati di {titolo}</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">{titolo} ({unita})</th>
            </tr>
          </thead>
          <tbody>
            {punti.map((p) => (
              <tr key={p.data}>
                <th scope="row">{p.data}</th>
                <td>{p.valore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
```

### 10.3 Non solo colore (1.4.1) e contrasto (1.4.11)

- Ogni serie deve avere **due canali**: colore + pattern di tratteggio (`stroke-dasharray`) + marcatore di forma diversa (cerchio, quadrato, triangolo).
- **Etichette dirette** sulle serie invece della sola legenda: elimina il problema alla radice.
- Linee e punti significativi: **3:1** contro lo sfondo del grafico (1.4.11). Le griglie di riferimento sono esenti se non portano informazione.
- Spessore minimo delle linee: 2 px; i punti dati almeno 4 px di raggio.
- Non affidarsi a rosso/verde per "migliorato/peggiorato": aggiungere freccia su/giù e segno.

```css
.chart__line { fill: none; stroke-width: 2.5; }
.chart__line--1 { stroke: var(--c-series-1); }
.chart__line--2 { stroke: var(--c-series-2); stroke-dasharray: 6 4; }
.chart__line--3 { stroke: var(--c-series-3); stroke-dasharray: 2 3; }
.chart__table { inline-size: 100%; border-collapse: collapse; }
.chart__table th, .chart__table td { padding: 8px; border-bottom: 1px solid var(--c-border); text-align: start; }
```

### 10.4 Tooltip e interattività

Se il grafico ha tooltip al passaggio/tap, devono essere raggiungibili da tastiera: ogni punto dati è un elemento focusabile (`tabindex="0"` su `<circle>` con `role="img"` e `aria-label="12 marzo, 82,5 chili"`), oppure, più semplice per mobile, **si rinuncia ai tooltip** e si rimanda alla tabella. Il tooltip deve rispettare **1.4.13 Content on Hover or Focus (AA)**: dismissibile con `Escape`, hoverable, persistente finché non si sposta il focus.

### 10.5 Reflow

A 320 px il grafico deve restare leggibile: `viewBox` + `width: 100%`, etichette dell'asse X ruotate o diradate, e in ogni caso la tabella come fallback. Un grafico dentro un contenitore con `overflow-x: auto` è ammesso (1.4.10 ha un'eccezione per le immagini che richiedono layout bidimensionale), ma il contenitore deve essere focusabile e avere `tabindex="0"` + `role="region"` + `aria-label` per essere scrollabile da tastiera.

---

## 11. Motion e animazioni

### 11.1 Criteri

- **2.3.1 Three Flashes or Below Threshold (A)**: massimo 3 lampeggi al secondo. Riguarda l'animazione dell'esercizio, i loader pulsanti, il flash di conferma sulla serie completata.
- **2.2.2 Pause, Stop, Hide (A)**: ogni contenuto in movimento/lampeggio/scorrimento che parte in automatico e dura più di 5 secondi deve essere pausabile. Riguarda: animazione esercizio, eventuali caroselli, skeleton loader animati all'infinito, timer.
- **2.3.3 Animation from Interactions (AAA, da adottare comunque)**: le animazioni di transizione innescate dall'interazione devono poter essere disattivate.

### 11.2 Baseline CSS

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Questa regola è la rete di sicurezza, non la soluzione: azzerare le durate può rompere le animazioni che hanno callback su `animationend`. La soluzione corretta è invertire la logica e **aggiungere** il movimento solo quando è permesso:

```css
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform 180ms ease-out; }
  .card:active { transform: scale(0.98); }
}
```

### 11.3 Cosa evitare in questa app

- Parallax e movimento legato allo scroll (causa vertigini vestibolari).
- Transizioni di pagina che traslano l'intera schermata: sostituirle con un cross-fade breve, o niente, con reduced motion.
- Skeleton loader con shimmer infinito: con reduced motion diventa statico.
- Confetti/celebrazioni a fine allenamento: gradevoli, ma da disattivare con reduced motion e comunque sotto i 3 lampeggi al secondo.
- Countdown "3, 2, 1" a schermo pieno con flash: alto rischio 2.3.1.

### 11.4 Durate consigliate

Micro-interazioni 120-200 ms, ingresso di pannelli 200-260 ms, niente sopra i 400 ms. Animazioni lunghe su mobile rallentano l'uso reale tra una serie e l'altra.

---

## 12. Navigazione, landmark e focus nella SPA

### 12.1 Struttura di pagina

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#contenuto-principale">Vai al contenuto principale</a>

      <header>
        <h1 className="visually-hidden">Nome app</h1>
        {/* titolo di schermata, azioni */}
      </header>

      <main id="contenuto-principale" tabIndex={-1}>
        {children}
      </main>

      <nav aria-label="Navigazione principale" className="bottom-nav">
        {/* voci */}
      </nav>
    </>
  );
}
```

```css
.skip-link {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform: translateY(-120%);
  padding: 12px 16px;
  background: var(--c-bg);
  color: var(--c-text);
  z-index: 100;
}
.skip-link:focus-visible { transform: none; }
```

Il skip link ha senso anche in mobile-first: gli utenti di tastiera esterna e switch control esistono, e in una lista esercizi lunga la bottom nav è dopo centinaia di elementi.

### 12.2 Landmark

- Un solo `<main>` per schermata.
- `<nav aria-label="...">` distinto per ogni nav presente (principale, avanzamento onboarding, filtri se sono link).
- `<header>`/`<footer>` diretti figli del body sono `banner`/`contentinfo`; dentro un `<article>` non lo sono.
- La lista esercizi lunga: `<section aria-labelledby="...">` per i raggruppamenti.
- Niente `role="application"`: spegne la navigazione per elementi degli screen reader.

### 12.3 Gerarchia degli heading

- Un solo `<h1>` per schermata, che descrive la schermata ("Panca piana", "Allenamento di oggi", "I tuoi progressi"). Se il logo è l'h1 globale, allora il titolo di schermata è h2, ma è preferibile che l'h1 sia il titolo di schermata.
- Nessun salto di livello (h2 seguito da h4).
- Ogni card esercizio nella lista ha un `<h3>` col nome: permette la navigazione rapida per intestazioni, che è il modo in cui un utente screen reader scorre una lista lunga.
- Non usare gli heading per il peso visivo: usare CSS.

### 12.4 Cambio rotta nella SPA

Al cambio rotta il browser non fa nulla: niente annuncio, focus che resta dove era o cade su `body`. Pattern combinato: aggiornare `document.title` **e** spostare il focus sul titolo della nuova schermata.

```tsx
// src/a11y/useRouteAnnounce.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnounce } from './LiveAnnouncer';

export function useRouteAnnounce(titoloPagina: string) {
  const { pathname } = useLocation();
  const announce = useAnnounce();
  const primoRender = useRef(true);

  useEffect(() => {
    document.title = `${titoloPagina} · NomeApp`;
    if (primoRender.current) {          // al primo caricamento ci pensa il browser
      primoRender.current = false;
      return;
    }
    const main = document.getElementById('contenuto-principale');
    main?.focus();                      // main ha tabIndex={-1}
    announce(`${titoloPagina}, pagina caricata.`, 'polite');
  }, [pathname, titoloPagina, announce]);
}
```

Scegliere **una** delle due tecniche come primaria per evitare il doppio annuncio: se si sposta il focus sul titolo, spesso l'annuncio live è superfluo. La combinazione mostrata sopra sposta il focus sul `main` (che è silenzioso) e affida il nome all'annuncio: è il compromesso più prevedibile su VoiceOver iOS.

### 12.5 Ordine di lettura

L'ordine del DOM deve corrispondere all'ordine visivo (1.3.2 Meaningful Sequence, 2.4.3 Focus Order). Attenzione a `order`, `row-reverse` e `grid-area` in flex/grid: spostano visivamente senza spostare il DOM. Nella schermata di allenamento, se il timer è visivamente in alto ma nel DOM è in fondo, l'ordine di tabulazione diventa incomprensibile.

### 12.6 2.4.11 Focus Not Obscured in pratica

```css
html {
  scroll-padding-block-start: 64px;                                  /* header sticky */
  scroll-padding-block-end: calc(72px + env(safe-area-inset-bottom, 0px)); /* bottom nav */
}
```

Verifica manuale: con la tastiera, `Tab` fino in fondo a ogni schermata lunga e controllare che l'elemento a fuoco non finisca mai sotto barre fisse, toast o sheet.

---

## 13. Lingua, zoom, reflow e spaziatura testo

### 13.1 Lingua (3.1.1 A, 3.1.2 AA)

```html
<html lang="it">
```

Nella PWA, `lang` va anche nel `manifest.json` (`"lang": "it"`, `"dir": "ltr"`). Termini in altra lingua vanno marcati: `<span lang="en">deadlift</span>`, `<abbr title="ripetizioni">rip</abbr>`. Utile in un'app fitness, piena di anglicismi: senza `lang="en"` la sintesi vocale italiana legge "lat machine" in modo incomprensibile. Regola pratica: marcare i nomi di esercizio in inglese presenti nel database.

### 13.2 Resize text 200% (1.4.4 AA) e Reflow 320 px (1.4.10 AA)

- **1.4.4**: il testo deve poter essere ingrandito fino al 200% senza perdita di contenuto o funzionalità.
- **1.4.10**: il contenuto deve funzionare a **320 px CSS di larghezza** (equivalente a 1280 px al 400% di zoom) **senza scroll in due dimensioni**.

Conseguenze pratiche:

- **`user-scalable=no` e `maximum-scale=1` sono vietati** nel meta viewport. Corretto: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Usare unità relative: `rem` per i font, mai `px` fissi sul testo; evitare altezze fisse sui contenitori di testo (`height` -> `min-height`).
- Le righe della schermata allenamento (serie / peso / reps / check) a 320 px con testo al 200% devono **andare a capo**, non tagliare: usare `flex-wrap: wrap` o passare a un layout a due righe sotto una certa soglia.
- La bottom nav con 5 etichette a 320 px: verificare che le etichette non vengano troncate; se necessario ridurre a 4 voci invece di nascondere le etichette.
- Testare anche l'ingrandimento **solo del testo** (Impostazioni iOS > Dimensione testo, Android > Dimensioni carattere): la PWA deve reggere `font-size` di sistema fino al 200%.

### 13.3 Text Spacing (1.4.12 AA)

Il contenuto deve restare integro quando l'utente applica:

- `line-height` (interlinea) **almeno 1,5 volte** la dimensione del font;
- spaziatura dopo i paragrafi **almeno 2 volte** la dimensione del font;
- `letter-spacing` **almeno 0,12 volte** la dimensione del font;
- `word-spacing` **almeno 0,16 volte** la dimensione del font.

Test rapido: incollare questo in console e verificare che nulla si sovrapponga o venga tagliato.

```js
const s = document.createElement('style');
s.textContent = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;
document.head.appendChild(s);
```

Conseguenza progettuale: niente `height` fisse su bottoni e chip (usare `min-height` + `padding`), niente `white-space: nowrap` su testi lunghi, niente troncamenti con `overflow: hidden` senza tooltip/testo completo.

### 13.4 Testo e leggibilità

- Dimensione base 16 px (`1rem`); mai testo interattivo sotto 14 px.
- Lunghezza riga massima circa 70 caratteri sulle istruzioni (`max-inline-size: 65ch`).
- Non giustificare il testo (`text-align: justify` crea i "fiumi" bianchi, problematici per la dislessia).
- Numeri tabulari per timer e pesi: `font-variant-numeric: tabular-nums`, così le cifre non "ballano" durante il countdown.

---

## 14. Checklist finale di rilascio e strumenti di test

### 14.1 Checklist trasversale (ogni PR che tocca la UI)

- [ ] Ogni controllo interattivo è un `<button>`, `<a href>`, `<input>` o `<select>` nativo; nessun `div`/`span` con `onClick`.
- [ ] Ogni controllo ha un accessible name che **contiene il testo visibile** (2.5.3).
- [ ] Nessuna icona senza testo alternativo; nessuna icona decorativa senza `aria-hidden="true"`.
- [ ] Tutta la UI è raggiungibile e azionabile con la sola tastiera; `Tab` non resta mai intrappolato.
- [ ] L'indicatore di focus è visibile su **tutti** gli sfondi e in **entrambi** i temi, con 3:1.
- [ ] Nessun `outline: none` senza un sostituto conforme.
- [ ] Nessun `tabindex` positivo.
- [ ] Nessun contenuto veicolato dal solo colore.
- [ ] Contrasto verificato in light e dark: 4.5:1 testo, 3:1 componenti e grafica.
- [ ] Ogni bersaglio di tocco >= 24x24 px CSS (obiettivo interno 44x44; 48x48 per bottom nav e schermata allenamento).
- [ ] Ogni immagine ha `alt` (vuoto se decorativa).
- [ ] Ogni campo ha una label visibile associata; il placeholder non sostituisce mai la label.
- [ ] Errori: `aria-invalid` + messaggio testuale collegato con `aria-describedby` + icona/testo.
- [ ] Nessuna live region nuova: si usa il `LiveAnnouncer` centrale.
- [ ] Nessun `aria-live` su un contenuto che cambia più spesso di ogni 3-5 secondi.
- [ ] Gerarchia heading senza salti, un solo `h1`.
- [ ] Ordine DOM = ordine visivo.
- [ ] Animazioni: rispettano `prefers-reduced-motion` e restano sotto i 3 lampeggi al secondo.
- [ ] Ogni gesto di trascinamento o swipe ha un'alternativa a tap singolo.
- [ ] Layout integro a 320 px di larghezza e con testo al 200%.
- [ ] Test di text spacing superato.
- [ ] `axe` non segnala nuove violazioni (CI verde).

### 14.2 Checklist per schermata

**Onboarding**
- [ ] Gruppi di card in `fieldset`/`legend`; radio o checkbox nativi sotto la grafica.
- [ ] Focus spostato sul titolo a ogni cambio step.
- [ ] `aria-current="step"` sull'indicatore.
- [ ] Tornando indietro tutti i valori sono conservati (3.3.7).
- [ ] Slider usabile senza trascinare e con frecce.
- [ ] Riepilogo modificabile prima della conferma.

**Lista esercizi**
- [ ] Campo ricerca con label programmatica.
- [ ] Conteggio risultati annunciato via `role="status"`.
- [ ] Chip filtro come `button aria-pressed` o checkbox, con bordo a 3:1.
- [ ] Stato "nessun risultato" testuale e annunciato.
- [ ] La lista virtualizzata non perde il focus durante lo scroll.

**Scheda esercizio**
- [ ] Animazione con un solo accessible name; frame `aria-hidden`.
- [ ] Pulsante Pausa/Riproduci presente e funzionante.
- [ ] Con reduced motion l'animazione parte in pausa.
- [ ] Istruzioni in `<ol>`.
- [ ] Periodo dei frame >= 400 ms.

**Editor scheda**
- [ ] Pulsanti "Sposta su"/"Sposta giù" presenti su ogni riga, 44 px.
- [ ] Nome dell'esercizio incluso nell'accessible name dei pulsanti.
- [ ] Annuncio "X spostato alla posizione N di M" dopo ogni spostamento.
- [ ] Focus conservato sul pulsante premuto dopo il riordino.
- [ ] Rimozione annullabile e annunciata.

**Allenamento in corso**
- [ ] Checkbox nativa per il completamento serie, intera riga cliccabile, >= 48 px.
- [ ] Input peso/reps con label, `inputMode`, `enterKeyHint`.
- [ ] Pulsanti +/- da 48 px, valore digitabile a mano.
- [ ] Nessun focus automatico che apre la tastiera all'ingresso nella schermata.
- [ ] Con bottom nav e barra timer attive, nessun elemento a fuoco finisce coperto.

**Timer**
- [ ] Il countdown è dentro `role="timer"` **senza** `aria-live`.
- [ ] Annunci solo a 60/30/10/5 secondi e a fine recupero.
- [ ] Pausa, +30 s, Salta, "Leggi tempo rimanente" presenti.
- [ ] Il suono è disattivabile e accompagnato da testo e vibrazione.
- [ ] Cifre con `tabular-nums`.

**Grafici**
- [ ] Riassunto testuale visibile.
- [ ] Tabella dati disponibile (toggle con `aria-expanded`/`aria-controls`).
- [ ] Serie distinte da almeno due canali visivi.
- [ ] Linee a 3:1 e spessore >= 2 px.

**Modali / bottom sheet**
- [ ] `role="dialog"` + `aria-modal` + `aria-labelledby` (o `<dialog>` nativo).
- [ ] Focus entra, cicla dentro, torna al trigger alla chiusura.
- [ ] `Escape` chiude; esiste un pulsante Chiudi da 44 px.
- [ ] Resto della pagina `inert`.
- [ ] Scroll di fondo bloccato e posizione ripristinata alla chiusura.

**Toast**
- [ ] Il toast visivo è `aria-hidden`; l'annuncio passa dal `LiveAnnouncer`.
- [ ] Nessuna azione critica disponibile solo nel toast.
- [ ] Durata >= 6 secondi.

**Temi**
- [ ] Tutta la checklist contrasto ripetuta in dark.
- [ ] `forced-colors` verificato almeno sulle schermate principali.

### 14.3 Strumenti

| Strumento | A cosa serve | Copertura |
|---|---|---|
| **axe DevTools** (estensione browser) | Scansione manuale per pagina/stato, con regole WCAG 2.2 incluse `target-size` | Rileva circa il 30-40% dei problemi |
| **Lighthouse** (Chrome DevTools, categoria Accessibility) | Smoke test rapido, integrabile in CI | Sottoinsieme di axe |
| **axe-core + Playwright / vitest-axe** | Regressioni in CI su ogni stato dell'app | Vedi sezione 15 |
| **Navigazione da sola tastiera** | Focus order, trap, focus visible, dialog | Insostituibile |
| **VoiceOver iOS** (Impostazioni > Accessibilità > VoiceOver, tripla pressione del tasto laterale) | Test reale del target principale della PWA | Insostituibile |
| **TalkBack Android** | Secondo target | Insostituibile |
| **VoiceOver macOS + Safari** / **NVDA + Firefox** | Test desktop rapido durante lo sviluppo | Utile |
| **Chrome DevTools > Rendering** | Emulazione `prefers-reduced-motion`, `prefers-color-scheme`, `forced-colors`, deficit di visione dei colori | Rapido |
| **Chrome DevTools > Elements > Accessibility pane** | Ispezione dell'albero di accessibilità e dell'accessible name calcolato | Diagnostico |
| **Zoom browser al 400% a 1280 px** | Verifica 1.4.10 Reflow | Rapido |
| **Bookmarklet text spacing** | Verifica 1.4.12 | Rapido |
| **WebAIM Contrast Checker / Figma Stark** | Verifica contrasto in design | Preventivo |

### 14.4 Gesti essenziali degli screen reader da conoscere

- **VoiceOver iOS**: swipe destro/sinistro = elemento successivo/precedente; doppio tap = attiva; rotore (rotazione con due dita) = navigazione per intestazioni/link/controlli form; swipe a due dita verso l'alto = leggi tutto dall'inizio. Test chiave: navigare la lista esercizi **per intestazioni** dal rotore, e spuntare una serie con doppio tap.
- **TalkBack**: swipe destro/sinistro; doppio tap; swipe su/giù per cambiare granularità di navigazione.

Test di accettazione minimo su dispositivo reale, da fare prima di ogni release: completare un allenamento intero (apertura scheda, avvio, spunta di 3 serie, uso del timer di recupero, chiusura) usando **solo** VoiceOver con lo schermo oscurato (Screen Curtain, tripla pressione con tre dita).

---

## 15. Testing automatico in CI

Gli strumenti automatici intercettano una minoranza dei problemi, ma sono l'unico modo per impedire le **regressioni**. Due livelli: unit/component test con `vitest-axe` e test end-to-end con `@axe-core/playwright`.

### 15.1 Setup component test (Vitest + Testing Library + axe)

```bash
npm i -D vitest @vitest/browser jsdom @testing-library/react @testing-library/user-event vitest-axe axe-core
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(matchers);
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
```

```tsx
// src/features/workout/SetRow.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { SetRow } from './SetRow';

const serie = { id: 's1', peso: 80, reps: 10, completata: false };

describe('SetRow', () => {
  it('non ha violazioni axe', async () => {
    const { container } = render(
      <ul><SetRow serie={serie} indice={1} totale={4} onToggle={vi.fn()} /></ul>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('espone una checkbox con nome accessibile completo', () => {
    render(<ul><SetRow serie={serie} indice={1} totale={4} onToggle={vi.fn()} /></ul>);
    const cb = screen.getByRole('checkbox', { name: /serie 2 di 4/i });
    expect(cb).not.toBeChecked();
  });

  it('è azionabile da tastiera con Spazio', async () => {
    const onToggle = vi.fn();
    render(<ul><SetRow serie={serie} indice={1} totale={4} onToggle={onToggle} /></ul>);
    await userEvent.tab();
    await userEvent.keyboard('{ }');
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
```

Test dedicato al pattern di riordino:

```tsx
// src/features/plan-editor/ExerciseList.a11y.test.tsx
it('offre un alternativa al drag per riordinare (WCAG 2.5.7)', async () => {
  render(<ExerciseList esercizi={esercizi} onReorder={onReorder} onRemove={vi.fn()} />);
  const su = screen.getByRole('button', { name: /sposta squat in su/i });
  await userEvent.click(su);
  expect(onReorder).toHaveBeenCalledWith(1, 0);
});

it('non mette aria-live sul display del timer', () => {
  const { container } = render(<RestTimer durata={90} onFine={vi.fn()} />);
  const timer = container.querySelector('[role="timer"]')!;
  expect(timer.getAttribute('aria-live')).toBeNull();
});
```

### 15.2 Test dei token di contrasto

```ts
// src/design/contrast.test.ts
import { describe, expect, it } from 'vitest';

function luminanza(hex: string) {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const LIGHT = { bg: '#ffffff', text: '#1a1a1a', muted: '#5f6368', border: '#8a8f98', accent: '#0a5ad6' };
const DARK  = { bg: '#121212', text: '#e6e6e6', muted: '#a8a8a8', border: '#6b7079', accent: '#7fb2ff' };

describe.each([['light', LIGHT], ['dark', DARK]])('palette %s', (_nome, p) => {
  it('testo primario >= 4.5:1', () => expect(contrastRatio(p.text, p.bg)).toBeGreaterThanOrEqual(4.5));
  it('testo secondario >= 4.5:1', () => expect(contrastRatio(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5));
  it('bordi componenti >= 3:1', () => expect(contrastRatio(p.border, p.bg)).toBeGreaterThanOrEqual(3));
  it('accent >= 3:1 (componenti)', () => expect(contrastRatio(p.accent, p.bg)).toBeGreaterThanOrEqual(3));
});
```

### 15.3 End-to-end con Playwright + axe

```bash
npm i -D @playwright/test @axe-core/playwright
```

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

const ROTTE = [
  { path: '/onboarding', nome: 'Onboarding' },
  { path: '/esercizi', nome: 'Lista esercizi' },
  { path: '/esercizi/panca-piana', nome: 'Scheda esercizio' },
  { path: '/schede/1/modifica', nome: 'Editor scheda' },
  { path: '/allenamento/attivo', nome: 'Allenamento in corso' },
  { path: '/progressi', nome: 'Progressi' },
];

for (const rotta of ROTTE) {
  for (const tema of ['light', 'dark'] as const) {
    test(`${rotta.nome} (${tema}) senza violazioni a11y`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema });
      await page.goto(rotta.path);
      const r = await scan(page);
      expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]);
    });
  }
}

test('bottom sheet: focus trap, Escape e restituzione del focus', async ({ page }) => {
  await page.goto('/allenamento/attivo');
  const trigger = page.getByRole('button', { name: /aggiungi esercizio/i });
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await scan(page).then((r) => r.violations)).toEqual([]);

  // il focus e' dentro al dialog
  await expect(dialog).toContainText(/aggiungi esercizio/i);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('reflow a 320px senza scroll orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/allenamento/attivo');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});

test('il timer non e una live region', async ({ page }) => {
  await page.goto('/allenamento/attivo');
  await page.getByRole('button', { name: /avvia recupero/i }).click();
  const timer = page.getByRole('timer');
  await expect(timer).not.toHaveAttribute('aria-live', /polite|assertive/);
});

test('tutti i bersagli interattivi rispettano 24x24 (2.5.8)', async ({ page }) => {
  await page.goto('/allenamento/attivo');
  const piccoli = await page.evaluate(() => {
    const sel = 'a[href], button, input, select, [role="button"], [role="checkbox"]';
    return [...document.querySelectorAll(sel)]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.width < 24 || r.height < 24);
      })
      .map((el) => el.outerHTML.slice(0, 120));
  });
  expect(piccoli).toEqual([]);
});
```

### 15.4 Gate in CI (GitHub Actions)

```yaml
# .github/workflows/a11y.yml
name: Accessibilità
on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test -- --run          # vitest + vitest-axe + test contrasto
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test e2e/a11y.spec.ts
      - name: Lighthouse a11y budget
        run: |
          npm i -g @lhci/cli
          lhci autorun --collect.staticDistDir=dist \
            --assert.assertions.categories:accessibility=">=0.95"
```

### 15.5 Limiti da tenere presenti

axe non rileva: alt text sbagliato ma presente, ordine di lettura illogico, focus che non si sposta, annunci live troppo frequenti, contrasto di testo su immagini, target size con overlay `::after`, comprensibilità dei messaggi di errore. **La CI verde non è conformità**: serve la sessione manuale con tastiera e screen reader prima di ogni release.

---

## 16. Fonti

- [WCAG 2.2 (W3C Recommendation)](https://www.w3.org/TR/WCAG22/) e [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/)
- [Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Understanding SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [Understanding SC 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [Understanding SC 3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)
- [Understanding SC 3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)
- [Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Understanding SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) e [pattern Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- [Adrian Roselli, Live Region Support](https://adrianroselli.com/2026/01/live-region-support.html)
- [Adrian Roselli, Defining "Toast" Messages](https://adrianroselli.com/2020/01/defining-toast-messages.html)
- [Adrian Roselli, Exposing Field Errors](https://adrianroselli.com/2023/04/exposing-field-errors.html)
- [Sara Soueidan, Accessible notifications with ARIA Live Regions (Part 1)](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/) e [(Part 2)](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/)
- [Adobe React Spectrum, Taming the dragon: Accessible drag and drop](https://react-spectrum.adobe.com/blog/drag-and-drop.html)
- [discord/react-dnd-accessible-backend](https://github.com/discord/react-dnd-accessible-backend)
- [TetraLogical, What's new in WCAG 2.2](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2/)
- [Deque University, WCAG 2.2 Updates](https://dequeuniversity.com/resources/wcag-2.2/)
- [Vispero, Understanding the Removal of 4.1.1 Parsing in WCAG 2.2](https://vispero.com/resources/understanding-the-removal-of-4-1-1-parsing-in-wcag-2-2/)
- [The A11Y Collective, The Ultimate Checklist for Accessible Data Visualisations](https://www.a11y-collective.com/blog/accessible-charts/)
- [The A11Y Collective, The Complete Guide to ARIA Live Regions](https://www.a11y-collective.com/blog/aria-live/)
- [Inclusive Components (Heydon Pickering)](https://inclusive-components.design/)
- [W3C WAI, WCAG 2 FAQ](https://www.w3.org/WAI/standards-guidelines/wcag/faq)
