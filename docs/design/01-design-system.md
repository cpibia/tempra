# TEMPRA - Design System

Sistema visivo completo della PWA di allenamento. Documento di consegna per il team di sviluppo: ogni token ha il suo valore esatto, ogni coppia testo/sfondo ha il rapporto di contrasto calcolato.

- **Token CSS pronti all'uso**: [`tokens.css`](./tokens.css)
- **Token in JSON (formato DTCG)**: [`tokens.json`](./tokens.json)
- **Riferimento normativo di dettaglio**: [`../research/04-accessibilita-wcag.md`](../research/04-accessibilita-wcag.md)

Target: WCAG 2.1 AA, con i criteri AA di WCAG 2.2 dove applicabili. Viewport di progetto 390px, funzionante da 320px. Stack: React/TypeScript, Tailwind CSS v4, CSS custom properties. Nessuna libreria di componenti.

---

## Indice

1. [Nome del prodotto](#1-nome-del-prodotto)
2. [Direzione visiva](#2-direzione-visiva)
3. [Colore](#3-colore)
   - 3.1 [Struttura della palette](#31-struttura-della-palette)
   - 3.2 [Scale primitive](#32-scale-primitive)
   - 3.3 [Token semantici e contrasti verificati: tema scuro](#33-token-semantici-e-contrasti-verificati-tema-scuro)
   - 3.4 [Token semantici e contrasti verificati: tema chiaro](#34-token-semantici-e-contrasti-verificati-tema-chiaro)
   - 3.5 [Colori funzionali di dominio](#35-colori-funzionali-di-dominio)
   - 3.6 [Heatmap muscolare](#36-heatmap-muscolare)
   - 3.7 [Palette dei grafici e verifica daltonismo](#37-palette-dei-grafici-e-verifica-daltonismo)
   - 3.8 [Regole d'uso del colore](#38-regole-duso-del-colore)
4. [Tipografia](#4-tipografia)
5. [Spaziatura, raggi, bordi, ombre, elevazione](#5-spaziatura-raggi-bordi-ombre-elevazione)
6. [Griglia e layout](#6-griglia-e-layout)
7. [Inventario componenti](#7-inventario-componenti)
8. [Il componente Riga serie](#8-il-componente-riga-serie)
9. [La schermata Allenamento in corso](#9-la-schermata-allenamento-in-corso)
10. [Motion](#10-motion)
11. [Iconografia](#11-iconografia)
12. [Illustrazioni, empty state, tono di voce](#12-illustrazioni-empty-state-tono-di-voce)
13. [Checklist di consegna](#13-checklist-di-consegna)

---

## 1. Nome del prodotto

### 1.1 Valutazione di "Forgia"

Funziona, ma è il nome più prevedibile del suo campo semantico.

| Aspetto | Giudizio |
|---|---|
| Significato | Solido: fucina, costruzione, trasformazione del metallo. La metafora regge. |
| Distintività | Bassa. Forge, Forged, IronForge, Forge Fitness esistono già in abbondanza; in Italia è meno saturo, ma il concetto non appartiene a nessuno. |
| Grammatica | Problematico: "forgia" è anche voce del verbo forgiare. In un microcopy tipo "Forgia la tua scheda" il nome del prodotto sparisce dentro la frase, e non si capisce mai se è marchio o imperativo. |
| Fonetica | Tre sillabe con affricata centrale: non scorre, non si accorcia bene. |
| Perimetro | Solo costruzione e sforzo. L'app gestisce anche salute, infortuni, riabilitazione, over 50: la fucina è un immaginario troppo stretto e troppo maschile. |

### 1.2 Tre alternative

**TEMPRA** (la scelta consigliata)
La tempra è il trattamento termico che segue la forgiatura: raffredda rapidamente l'acciaio e lo rende duro e resistente. È letteralmente il passo successivo a "forgia", e in italiano significa anche carattere, fibra morale, capacità di resistere. Due sillabe, accento sulla prima, si pronuncia uguale in tutte le lingue latine ed è comprensibile in inglese (temper, tempering). Il doppio significato copre sia la forza sia la costanza: regge tanto il powerlifter quanto chi si allena per stare bene. Il campo semantico caldo/freddo che porta con sé diventa poi la logica della palette: si lavora nel caldo, si recupera nel freddo.

**FIBRA**
Fibra muscolare e "avere fibra" (essere tenaci). Corto, caldo, inclusivo, funziona anche per il pubblico salute e riabilitazione. Meno metallico e meno gergale di Tempra, ma anche meno caratterizzato: rischia di sembrare un'app di nutrizione.

**GHISA**
Il gergo reale delle palestre italiane ("tirare ghisa"). Cortissimo, memorabile, immediatamente riconoscibile da chi si allena. Rischio opposto a Fibra: è un nome da insider, respinge il principiante e non ha senso per chi si allena a corpo libero in casa.

Scartata anche una quarta ipotesi molto tentante, **CARICO**, per una ragione pratica: collide con "caricamento" in ogni stato di attesa dell'interfaccia ("Carico in corso" diventa ambiguo per sempre).

### 1.3 Decisione

Il sistema è progettato su **TEMPRA**.

Firma verbale: **Tempra.** usato con il punto nei contesti di marca. Claim di lavoro: *La forza si costruisce, la costanza si tempra.*

---

## 2. Direzione visiva

### 2.1 Il territorio che non facciamo

**"Nera con il verde fluo".** Fondo nero, accento lime o verde acido, glow, gradienti. Lo escludiamo per tre motivi concreti, non per gusto:

1. **Il verde ci serve altrove.** Il segnale più frequente di tutta l'app è "serie completata", e la convenzione universale per "fatto" è verde. Se il verde è anche il colore del marchio, il segnale si annega nell'interfaccia: ogni bottone, ogni icona attiva, ogni bordo diventano verdi e la spunta smette di saltare all'occhio.
2. **Non distingue.** È la firma condivisa da mezza categoria. Un'app riconoscibile a colpo d'occhio nella schermata home vale più di un colore alla moda.
3. **Si comporta male in daltonismo.** Il lime, simulato in deuteranopia e protanopia, collassa su un giallo indistinguibile dall'oro che serve per i record personali.

### 2.2 Tre territori proposti

**Territorio A - Strumento**
Riferimento: strumenti di misura professionali. Cronografi da officina, oscilloscopi, Braun di Rams, Teenage Engineering, i display delle bilance da laboratorio. Neutrali freddi quasi monocromi, un solo colore segnale, filetti da 1px invece di ombre, cifre tabulari enormi, densità informativa alta. La gerarchia nasce dal peso tipografico e dalla dimensione del numero, mai dal colore. Zero gradienti, zero vetro, zero glow.
Pro: è l'unica grammatica che regge la lettura di sfuggita, a 70 cm, in penombra. Invecchia benissimo.
Contro: da solo è anonimo. Senza una firma cromatica sembra un template di dashboard.

**Territorio B - Brace**
Acciaio freddo più un'unica sorgente di calore. Il colore ha un significato termodinamico esplicito: il caldo è lo sforzo, il freddo è il recupero. Materia opaca, bordi netti, una sola fonte di calore per schermata, che si sposta dove sta l'azione. La brace non è decorazione: è lo stato del corpo.
Pro: identità immediata, e il colore porta informazione invece di consumarla.
Contro: da solo rischia il cliché "app da palestra aggressiva" se applicato a superfici larghe.

**Territorio C - Quaderno**
Il diario di allenamento cartaceo. Carta avorio, grafite, un serif da testata per i titoli, tabelle da registro, tono da sala pesi anni Settanta. Caldo, umano, poco tecnologico.
Pro: molto distintivo, empatico, ottimo per il pubblico salute.
Contro: non sopravvive al contesto d'uso. Superfici chiare e serif significano abbagliamento in palestra la sera, contrasto peggiore e affaticamento; e la densità numerica di una scheda non entra in una grammatica editoriale.

### 2.3 La scelta: "Strumento caldo" (A + B)

Prendiamo **la struttura dal territorio A e la logica cromatica dal territorio B**.

Dal territorio Strumento: neutrali freddi, superfici piatte separate per luminosità e non per ombra, filetti da 1px, tipografia unica, numeri tabulari sovradimensionati, nessun effetto.
Dal territorio Brace: un solo accento caldo, la brace (arancio `#F5691A` / `#FF864E`), e una regola semantica di temperatura che governa tutta l'app.

**La regola di temperatura**, che è il cuore del sistema:

| Stato | Temperatura | Colore |
|---|---|---|
| Stai lavorando (serie attiva, CTA, marchio) | caldo | Brace, arancio |
| Stai recuperando (timer, pausa, info) | freddo | Cobalto, azzurro |
| Fatto (serie completata) | verde | Verde |
| Record personale | oro | Oro |

È una regola che un utente impara senza che gliela si spieghi, e che dà un motivo non arbitrario a ogni scelta di colore dell'interfaccia.

### 2.4 I sei principi operativi

1. **Il numero è l'interfaccia.** Peso, ripetizioni e secondi hanno sempre la dimensione maggiore del loro contenitore. Tutto il resto è etichetta.
2. **Il colore ha una temperatura, non un gusto.** Se un colore non porta informazione, si toglie.
3. **Un solo accento per schermata.** Se tutto è caldo, niente è caldo.
4. **Niente gradienti, glow, vetro, ombre morbide.** La separazione tra superfici si ottiene con un salto di luminosità e un filetto da 1px. In tema scuro le ombre non si vedono comunque.
5. **Gerarchia binaria.** O è grande (numero) o è piccolo (etichetta). Le taglie intermedie diluiscono la leggibilità a distanza.
6. **Il terzo inferiore dello schermo appartiene al pollice.** Sopra ci va l'informazione, sotto ci va l'azione. Nessuna eccezione durante l'allenamento.

---

## 3. Colore

### 3.1 Struttura della palette

Tre livelli, come nel file `tokens.css`:

1. **Primitive**: le scale grezze (`--color-neutral-500`, `--color-ember-400`). Non si usano mai direttamente in un componente.
2. **Semantici**: il livello che i componenti consumano (`--color-text-primary`, `--color-brand-solid`). Cambiano con il tema.
3. **Funzionali di dominio**: i colori che esistono solo in questa app (`--color-set-done-icon`, `--color-pr-text`, `--color-rest-ring`, `--color-muscle-3`).

Le scale sono generate in **OKLCH** con riduzione di croma per rientrare nel gamut sRGB, così i passi sono percettivamente regolari e il verde non risulta più chiaro del blu a parità di step. I valori esadecimali del documento sono il risultato di quella conversione: sono definitivi e vanno usati letteralmente.

**Come funziona il cambio tema.** Il tema scuro è il default di prodotto: senza attributo sul documento si sta al buio. I token semantici usano la funzione CSS `light-dark(<chiaro>, <scuro>)`, che risolve in base a `color-scheme`.

```html
<html>                      <!-- scuro, default -->
<html data-theme="light">   <!-- chiaro forzato -->
<html data-theme="dark">    <!-- scuro forzato -->
<html data-theme="auto">    <!-- segue prefers-color-scheme -->
```

Nelle impostazioni le tre opzioni vanno esposte in questo ordine: Scuro (predefinito), Chiaro, Automatico.

### 3.2 Scale primitive

**Neutrali "Acciaio"** (OKLCH hue 258, croma da 0 a 0.015: freddi ma quasi acromatici). 20 passi, perché il tema scuro ha bisogno di molti gradini ravvicinati nella parte bassa.

| Token | Hex | Uso tipico |
|---|---|---|
| `neutral-0` | `#FFFFFF` | superficie tema chiaro |
| `neutral-25` | `#F9FAFB` | |
| `neutral-50` | `#F4F5F7` | canvas tema chiaro, testo primario tema scuro |
| `neutral-100` | `#EBEDF0` | inset tema chiaro, skeleton |
| `neutral-200` | `#DBDEE2` | bordo default tema chiaro, traccia timer |
| `neutral-300` | `#C7CBCF` | |
| `neutral-400` | `#ACB0B5` | testo secondario tema scuro, testo disabilitato tema chiaro |
| `neutral-500` | `#90949A` | testo terziario tema scuro |
| `neutral-550` | `#83878D` | |
| `neutral-600` | `#767B81` | **bordo forte, entrambi i temi** |
| `neutral-650` | `#6A6E75` | |
| `neutral-700` | `#5E6269` | testo terziario tema chiaro, testo disabilitato tema scuro |
| `neutral-750` | `#51565C` | testo secondario tema chiaro |
| `neutral-800` | `#454950` | bordi inset tema scuro |
| `neutral-850` | `#34383F` | bordo default tema scuro, traccia timer scuro |
| `neutral-900` | `#23272E` | superficie overlay tema scuro, griglia grafici, skeleton |
| `neutral-950` | `#151920` | superficie elevata tema scuro, testo primario tema chiaro |
| `neutral-975` | `#0D1118` | superficie tema scuro |
| `neutral-1000` | `#070A10` | canvas tema scuro |
| `neutral-1100` | `#03060A` | inset tema scuro, testo su brand |

**Brace / ember** (brand, hue 44), **Cobalto** (recupero e info, hue 236), **Verde** (successo, hue 152), **Ambra** (avviso, hue 68), **Rosso** (errore, hue 24), **Oro** (record, hue 95). Dodici passi ciascuna, stessi valori di lightness in tutte le famiglie.

| Step | Brace | Cobalto | Verde | Ambra | Rosso | Oro |
|---|---|---|---|---|---|---|
| 50 | `#FFF0EA` | `#E8F6FF` | `#E7F9EB` | `#FFF1E2` | `#FFEFEE` | `#F8F4E2` |
| 100 | `#FFE1D4` | `#D0EDFF` | `#D0F2D8` | `#FEE3C6` | `#FFDFDC` | `#F1E8C7` |
| 200 | `#FFCAB4` | `#ADDFFF` | `#AFE8BD` | `#FBCE9F` | `#FFC8C3` | `#E7D89F` |
| 300 | `#FFA983` | `#81CBF7` | `#83D79B` | `#F2B36C` | `#FFA59F` | `#D7C06C` |
| 400 | `#FF864E` | `#55B8EF` | `#57C77C` | `#E79935` | `#FF817C` | `#C7AB35` |
| 500 | `#F5691A` | `#2BA5E1` | `#2CB664` | `#D58500` | `#FF5758` | `#B59800` |
| 600 | `#D85600` | `#008FC9` | `#009F50` | `#B97200` | `#E44044` | `#9D8300` |
| 700 | `#B54700` | `#0078A9` | `#008542` | `#9B5F00` | `#C32F35` | `#836D00` |
| 800 | `#903700` | `#005E85` | `#006933` | `#7A4A00` | `#9C2026` | `#675500` |
| 900 | `#6C2700` | `#004564` | `#004E24` | `#5B3600` | `#75171B` | `#4C3F00` |
| 950 | `#4C1900` | `#002F46` | `#003617` | `#402400` | `#520E11` | `#352B00` |
| 1000 | `#350F00` | `#002031` | `#00250D` | `#2C1700` | `#3A0709` | `#241C00` |

**Superfici tinte** (fondi delle callout, dei badge e delle righe di stato):

| Famiglia | Fondo scuro | Bordo scuro | Fondo chiaro | Bordo chiaro |
|---|---|---|---|---|
| Brace | `#351B10` | `#5E321F` | `#FFEEE7` | `#FBCCB8` |
| Cobalto | `#092635` | `#114560` | `#E4F5FF` | `#B2DEFA` |
| Verde | `#102918` | `#1F4A2D` | `#E5F8E9` | `#BBE4C4` |
| Ambra | `#311E08` | `#583810` | `#FFEFDE` | `#F3D1AE` |
| Rosso | `#361A18` | `#60302D` | `#FFEDEB` | `#FDC9C4` |
| Oro | `#2A2206` | `#4B3F0A` | `#F7F2DD` | `#E4D8AB` |

### 3.3 Token semantici e contrasti verificati: tema scuro

Superfici: canvas `#070A10`, surface `#0D1118`, raised `#151920`, overlay `#23272E`, inset `#03060A`.

Ogni riga riporta il rapporto di contrasto **calcolato** (formula WCAG 2.x sulla luminanza relativa), non stimato.

| Token | Hex | Su | Contrasto | Soglia | Esito |
|---|---|---|---|---|---|
| `text-primary` | `#F4F5F7` | canvas `#070A10` | **18.16:1** | 4.5 | AAA |
| `text-primary` | `#F4F5F7` | surface `#0D1118` | **17.34:1** | 4.5 | AAA |
| `text-primary` | `#F4F5F7` | raised `#151920` | **16.15:1** | 4.5 | AAA |
| `text-primary` | `#F4F5F7` | overlay `#23272E` | **13.74:1** | 4.5 | AAA |
| `text-secondary` | `#ACB0B5` | canvas | **9.09:1** | 4.5 | AAA |
| `text-secondary` | `#ACB0B5` | surface | **8.67:1** | 4.5 | AAA |
| `text-secondary` | `#ACB0B5` | raised | **8.08:1** | 4.5 | AAA |
| `text-tertiary` | `#90949A` | canvas | **6.50:1** | 4.5 | AA |
| `text-tertiary` | `#90949A` | raised | **5.78:1** | 4.5 | AA |
| `text-disabled` | `#5E6269` | canvas | 3.23:1 | esente (1.4.3 componenti inattivi) | vedi 3.8 |
| `border-strong` | `#767B81` | canvas | **4.64:1** | 3.0 | AA |
| `border-strong` | `#767B81` | raised | **4.13:1** | 3.0 | AA |
| `border-strong` | `#767B81` | overlay | **3.51:1** | 3.0 | AA |
| `border-default` | `#34383F` | canvas | 1.68:1 | solo decorativo | ok |
| `brand-text` | `#FF864E` | canvas | **8.28:1** | 4.5 | AAA |
| `brand-text` | `#FF864E` | surface | **7.90:1** | 4.5 | AAA |
| `brand-text` | `#FF864E` | raised | **7.36:1** | 4.5 | AAA |
| `brand-solid` (riempimento) | `#F5691A` | canvas | **6.53:1** | 3.0 | AA |
| `text-on-brand` | `#03060A` | brand-solid `#F5691A` | **6.69:1** | 4.5 | AA |
| `success-text` | `#57C77C` | canvas | **9.31:1** | 4.5 | AAA |
| `success-text` | `#57C77C` | raised | **8.28:1** | 4.5 | AAA |
| `success-text` | `#57C77C` | success-surface `#102918` | **7.29:1** | 4.5 | AAA |
| `success-on-solid` | `#03060A` | success-solid `#2CB664` | **7.72:1** | 4.5 | AAA |
| `warning-text` | `#E79935` | canvas | **8.50:1** | 4.5 | AAA |
| `warning-text` | `#E79935` | warning-surface `#311E08` | **6.82:1** | 4.5 | AAA |
| `danger-text` | `#FF817C` | canvas | **8.19:1** | 4.5 | AAA |
| `danger-text` | `#FF817C` | danger-surface `#361A18` | **6.59:1** | 4.5 | AAA |
| `danger-on-solid` | `#FFFFFF` | danger-solid `#C32F35` | **5.56:1** | 4.5 | AA |
| `danger-solid` (riempimento) | `#C32F35` | canvas | **3.56:1** | 3.0 | AA |
| `info-text` / `rest-text` | `#55B8EF` | canvas | **8.95:1** | 4.5 | AAA |
| `info-text` | `#55B8EF` | info-surface `#092635` | **7.08:1** | 4.5 | AAA |
| `pr-text` | `#D7C06C` | canvas | **10.99:1** | 4.5 | AAA |
| `pr-text` | `#D7C06C` | pr-surface `#2A2206` | **8.76:1** | 4.5 | AAA |
| `pr-on-solid` | `#03060A` | pr-solid `#C7AB35` | **9.00:1** | 4.5 | AAA |
| `brand-text` | `#FF864E` | brand-surface `#351B10` | **6.67:1** | 4.5 | AAA |
| `border-focus` | `#D0EDFF` | canvas | **16.26:1** | 3.0 | AA |
| `rest-ring` | `#55B8EF` | rest-track `#34383F` | **5.32:1** | 3.0 | AA |
| `rest-urgent` | `#E79935` | rest-track `#34383F` | **5.05:1** | 3.0 | AA |
| tab attiva | `#FF864E` | surface | **7.90:1** | 4.5 | AAA |
| tab inattiva | `#ACB0B5` | surface | **8.67:1** | 4.5 | AAA |
| numero serie | `#90949A` | raised | **5.78:1** | 4.5 | AA |

### 3.4 Token semantici e contrasti verificati: tema chiaro

Superfici: canvas `#F4F5F7`, surface/raised/overlay `#FFFFFF`, inset `#EBEDF0`.

| Token | Hex | Su | Contrasto | Soglia | Esito |
|---|---|---|---|---|---|
| `text-primary` | `#151920` | surface `#FFFFFF` | **17.62:1** | 4.5 | AAA |
| `text-primary` | `#151920` | canvas `#F4F5F7` | **16.15:1** | 4.5 | AAA |
| `text-secondary` | `#51565C` | surface | **7.41:1** | 4.5 | AAA |
| `text-secondary` | `#51565C` | canvas | **6.79:1** | 4.5 | AAA |
| `text-tertiary` | `#5E6269` | surface | **6.13:1** | 4.5 | AAA |
| `text-tertiary` | `#5E6269` | canvas | **5.62:1** | 4.5 | AA |
| `text-disabled` | `#ACB0B5` | surface | 2.18:1 | esente (1.4.3 componenti inattivi) | vedi 3.8 |
| `border-strong` | `#767B81` | surface | **4.27:1** | 3.0 | AA |
| `border-strong` | `#767B81` | canvas | **3.91:1** | 3.0 | AA |
| `border-default` | `#DBDEE2` | surface | 1.35:1 | solo decorativo | ok |
| `brand-text` | `#B54700` | surface | **5.43:1** | 4.5 | AA |
| `brand-text` | `#B54700` | canvas | **4.98:1** | 4.5 | AA |
| `brand-solid` (riempimento) | `#D85600` | canvas | **3.67:1** | 3.0 | AA |
| `text-on-brand` | `#03060A` | brand-solid `#D85600` | **5.08:1** | 4.5 | AA |
| `success-text` | `#008542` | surface | **4.74:1** | 4.5 | AA |
| `success-strong` | `#006933` | success-surface `#E5F8E9` | **6.17:1** | 4.5 | AAA |
| `success-on-solid` | `#03060A` | success-solid `#009F50` | **5.87:1** | 4.5 | AA |
| `warning-text` | `#9B5F00` | surface | **5.21:1** | 4.5 | AA |
| `warning-strong` | `#7A4A00` | warning-surface `#FFEFDE` | **6.65:1** | 4.5 | AAA |
| `danger-text` | `#C32F35` | surface | **5.56:1** | 4.5 | AA |
| `danger-strong` | `#9C2026` | danger-surface `#FFEDEB` | **7.01:1** | 4.5 | AAA |
| `danger-on-solid` | `#FFFFFF` | danger-solid `#C32F35` | **5.56:1** | 4.5 | AA |
| `danger-solid` (riempimento) | `#C32F35` | canvas | **5.09:1** | 3.0 | AA |
| `info-text` / `rest-text` | `#0078A9` | surface | **4.93:1** | 4.5 | AA |
| `info-strong` | `#005E85` | info-surface `#E4F5FF` | **6.40:1** | 4.5 | AAA |
| `pr-text` | `#836D00` | surface | **5.06:1** | 4.5 | AA |
| `pr-strong` | `#675500` | pr-surface `#F7F2DD` | **6.50:1** | 4.5 | AAA |
| `pr-on-solid` | `#03060A` | pr-solid `#B59800` | **7.21:1** | 4.5 | AAA |
| `brand-strong` | `#903700` | brand-surface `#FFEEE7` | **6.82:1** | 4.5 | AAA |
| `border-focus` | `#0078A9` | canvas | **4.52:1** | 3.0 | AA |
| anello focus su brand | `#FFFFFF` | brand-solid `#D85600` | **4.00:1** | 3.0 | AA |
| `rest-ring` | `#0078A9` | rest-track `#DBDEE2` | **3.65:1** | 3.0 | AA |
| tab attiva | `#B54700` | surface | **5.43:1** | 4.5 | AA |
| tab inattiva | `#5E6269` | surface | **6.13:1** | 4.5 | AAA |

**Nota sul bottone primario.** In entrambi i temi il testo sul riempimento brace è **quasi nero** (`#03060A`), non bianco. Il bianco su arancio non supera mai 4.5:1 senza spegnere l'arancio fino a farlo diventare marrone: `#FFFFFF` su `#D85600` dà 4.00:1, insufficiente per testo normale. Il quasi nero su brace dà 6.69:1 in scuro e 5.08:1 in chiaro, e mantiene l'arancio vivo. È una scelta deliberata, non un refuso.

**Nota sull'anello di focus.** L'anello si disegna a 2px con `outline-offset: 2px`: lo stacco fa sì che il colore adiacente all'anello sia sempre la superficie della pagina, mai il riempimento del bottone. Così il requisito 3:1 di 1.4.11 si verifica contro `#070A10` (16.26:1 in scuro) e contro `#F4F5F7` (4.52:1 in chiaro), e non contro l'arancio.

### 3.5 Colori funzionali di dominio

| Concetto | Token | Scuro | Chiaro | Segnale ridondante obbligatorio |
|---|---|---|---|---|
| Serie completata | `set-done-icon` / `set-done-surface` | `#57C77C` / `#102918` | `#009F50` / `#E5F8E9` | spunta piena nella checkbox + riga con fondo verde + valori in peso semibold |
| Record personale | `pr-text` / `pr-solid` / `pr-surface` | `#D7C06C` / `#C7AB35` / `#2A2206` | `#836D00` / `#B59800` / `#F7F2DD` | badge con **icona fulmine** + testo "PR" + bordo `pr-border` |
| Recupero in corso | `rest-ring` / `rest-surface` | `#55B8EF` / `#092635` | `#0078A9` / `#E4F5FF` | conto alla rovescia numerico + arco che si svuota + `role="timer"` |
| Recupero, ultimi 10s | `rest-urgent` | `#E79935` | `#9B5F00` | i numeri passano a `num-hero` + pulsazione dell'arco |
| Recupero superato | `rest-overtime` | `#FF817C` | `#C32F35` | il numero conta in positivo con prefisso `+` |
| Serie di riscaldamento | `warmup-text` / `warmup-border` | `#90949A` / `#767B81` | `#5E6269` / `#767B81` | **bordo sinistro tratteggiato 3px** + etichetta "Ris." al posto del numero serie |
| Muscolo primario | `muscle-primary` | `#FFA37C` | `#D85600` | riempimento pieno + etichetta |
| Muscolo secondario | `muscle-secondary` | `#C75D29` | `#F3A07D` | **tratteggio a 45 gradi** + etichetta |

**Perché il riscaldamento non è colorato.** Ogni tinta calda disponibile (ambra, brace, oro) è già impegnata da avviso, marchio o record. Colorare la serie di riscaldamento avrebbe introdotto una quinta tinta calda indistinguibile dalle altre in daltonismo. La serie di riscaldamento va **de-enfatizzata**, non segnalata: resta neutra, con bordo tratteggiato ed etichetta testuale. Il tratteggio è anche l'unico segnale che sopravvive a qualunque simulazione di daltonismo e alla stampa in bianco e nero.

### 3.6 Heatmap muscolare

Scala sequenziale a 5 livelli sul volume settimanale per gruppo muscolare.

| Livello | Significato | Scuro | Contrasto su surface | Chiaro | Contrasto su surface |
|---|---|---|---|---|---|
| 0 | nessuna serie | `#2B2E33` | 1.39:1 | `#DBDEE2` | 1.35:1 |
| 1 | 1-5 serie | `#964C2A` | **3.03:1** | `#F2C4B0` | 1.58:1 |
| 2 | 6-10 serie | `#C75D29` | **4.53:1** | `#F3A07D` | 2.07:1 |
| 3 | 11-16 serie | `#F6712F` | **6.59:1** | `#F0773E` | 2.83:1 |
| 4 | 17+ serie | `#FFA37C` | **9.71:1** | `#D85600` | 4.00:1 |

In tema scuro l'intensità cresce con la luminosità; in tema chiaro decresce. È la direzione percettivamente corretta in entrambi i casi: "più allenato" = più lontano dal fondo.

**I livelli 1-3 in tema chiaro non raggiungono 3:1 contro il fondo, e non possono per costruzione**: l'estremo basso di una scala sequenziale deve somigliare al fondo, altrimenti non è una scala sequenziale. Rientrano nell'eccezione di WCAG 1.4.11 per gli oggetti grafici la cui specifica presentazione è essenziale a veicolare l'informazione. Mitigazioni obbligatorie, tutte e quattro:

1. ogni regione muscolare ha un **contorno** da 1.5px in `--color-muscle-stroke` `#767B81` (3.19:1 sul livello 0 in scuro, 3.16:1 in chiaro);
2. ogni regione è **focalizzabile e premibile**, e mostra "Petto: 14 serie negli ultimi 7 giorni, livello alto";
3. sotto la figura c'è una **legenda numerica** con gli intervalli, non solo i campioni di colore;
4. esiste sempre una **tabella dati equivalente** apribile con "Vedi i dati", che è anche l'alternativa testuale per screen reader.

### 3.7 Palette dei grafici e verifica daltonismo

Sei serie categoriche, ottimizzate per essere distinguibili in **deuteranopia** e **protanopia**. Non scelte a occhio: generate massimizzando la distanza percettiva minima in Oklab dopo simulazione Viénot-Brettel-Mollon, sotto il vincolo di contrasto minimo 3:1 contro la superficie del grafico.

**Tema scuro** (su surface `#0D1118`):

| Serie | Hex | Contrasto | Simulata deuteranopia | Simulata protanopia |
|---|---|---|---|---|
| 1 | `#FF864E` | **7.90:1** | `#B5B545` | `#9A9A50` |
| 2 | `#C9EAFF` | **15.04:1** | `#E1E1FF` | `#E7E7FF` |
| 3 | `#F8DD78` | **14.05:1** | `#E5E577` | `#E0E078` |
| 4 | `#9664C9` | **4.47:1** | `#7575C8` | `#6B6BC9` |
| 5 | `#44C4C0` | **8.92:1** | `#ABABC2` | `#BBBBC0` |
| 6 | `#007B3D` | **3.51:1** | `#696940` | `#74743C` |

Distanza minima simulata: **ΔE Oklab 0.126** (coppia critica: serie 1 contro serie 6, in protanopia).

**Tema chiaro** (su surface `#FFFFFF`):

| Serie | Hex | Contrasto | Simulata deuteranopia | Simulata protanopia |
|---|---|---|---|---|
| 1 | `#D55A14` | **3.96:1** | `#8D8D00` | `#717118` |
| 2 | `#007BAD` | **4.73:1** | `#6969AE` | `#7474AD` |
| 3 | `#6A3798` | **8.04:1** | `#4A4A97` | `#3F3F98` |
| 4 | `#009793` | **3.59:1** | `#818195` | `#8F8F93` |
| 5 | `#005729` | **8.77:1** | `#49492B` | `#525229` |
| 6 | `#A62857` | **6.86:1** | `#646453` | `#464658` |

Distanza minima simulata: **ΔE Oklab 0.094** (coppia critica: serie 5 contro serie 6, in protanopia).

**Benchmark.** La palette Okabe-Ito, lo standard di riferimento per il daltonismo, misurata con lo stesso metodo su sei serie, dà ΔE minimo **0.080**, e il suo giallo `#F0E442` ha 1.32:1 su bianco, cioè inutilizzabile su fondo chiaro. Le nostre due palette sono quindi più separate di quella di riferimento, e in più rispettano il contrasto.

**Perché in tema chiaro il giallo sparisce.** Su bianco nessun giallo raggiunge 3:1 senza smettere di essere giallo. La terza serie chiara è un viola, e il rosso-vino prende il sesto posto. Le due palette non sono la stessa palette schiarita e scurita: sono due palette progettate separatamente per il proprio fondo.

**Regole obbligatorie per i grafici** (il colore non basta mai):

- ogni serie ha anche un **tratteggio proprio** (`solid`, `8 4`, `2 3`, `12 3 2 3`, `4 4`, `1 4`) e un **marcatore proprio** (cerchio, quadrato, triangolo, rombo, croce, triangolo rovesciato);
- **etichette dirette** in testa alla linea quando le serie sono 3 o meno: meglio della legenda;
- i **record personali** sono marcati con un rombo pieno in `--color-chart-marker-pr` più una piccola etichetta "PR", mai solo con il colore;
- ogni grafico ha un pulsante **"Vedi i dati"** che apre la tabella equivalente, ed è quella tabella l'alternativa testuale dichiarata;
- la **griglia** è `--color-chart-grid` e non deve mai superare il contrasto della serie più debole.

### 3.8 Regole d'uso del colore

1. **Nessun colore da solo.** Ogni stato veicolato dal colore ha sempre almeno un secondo canale: icona, forma, tratteggio, posizione o testo. La lista completa è nella tabella 3.5.
2. **Le tinte calde sono tre e si somigliano in daltonismo.** Brace (marchio), ambra (avviso) e oro (record) collassano tutte verso il giallo-bruno in deuteranopia. Quindi: l'avviso ha **sempre** l'icona triangolo, il record ha **sempre** icona fulmine e le lettere "PR", il marchio non compare mai in un contesto dove potrebbe essere letto come stato.
3. **Disabilitato.** `text-disabled` non raggiunge 4.5:1 in nessuno dei due temi. È consentito da 1.4.3, che esclude i componenti inattivi, ma lo stato disabilitato deve essere comunicato anche da `aria-disabled="true"` e dall'assenza di affordance. **Vietato disabilitare un bottone senza spiegare perché**: accanto va sempre il motivo a testo (vedi microcopy in sezione 12).
4. **Gli overlay di stato si sommano, non sostituiscono.** `--color-state-hover` e `--color-state-pressed` sono livelli semitrasparenti da stendere sopra la superficie. Non esistono varianti "surface-hover" precalcolate.
5. **Contrasto aumentato.** Con `prefers-contrast: more` i bordi passano a 2px e `border-default` diventa `#767B81`. È già in `tokens.css`.
6. **Mai usare la scala primitiva in un componente.** Se serve un colore che i token semantici non coprono, il token va aggiunto al sistema, non preso a mano dalla scala.

---

## 4. Tipografia

### 4.1 Scelta del font

**Una sola famiglia: Inter (variabile), self-hosted.**

L'app è, per la maggior parte del tempo che l'utente ci passa dentro, un display di numeri. La scelta del font si decide quindi su tre criteri, in questo ordine: qualità delle cifre, disambiguazione dei caratteri, costo in byte.

**Perché Inter e non altro**

| Criterio | Verifica |
|---|---|
| Cifre tabulari | Inter ha `tnum` completo: tutte le cifre hanno la stessa larghezza. Indispensabile qui, perché il timer che passa da 1:11 a 1:00 non deve muovere la riga di un pixel, e la colonna dei pesi deve restare allineata sotto. |
| Zero sbarrato | `zero` disponibile: 0 e O non si confondono mai nel campo peso. |
| Disambiguazione | `ss02` (set di disambiguazione) risolve le coppie critiche 1/l/I e rende le cifre più aperte. Importante in condizioni di lettura pessime. |
| Asse ottico | Inter v4 ha l'asse `opsz` (14-32): alle dimensioni display i tratti si assottigliano e la spaziatura si stringe da sola. È esattamente quello che serve a un timer da 96px. |
| Peso | Un solo file variabile, sottoinsieme latin + latin-ext, assi `wght` e `opsz`: **budget massimo 100KB**. Due famiglie ne costerebbero almeno il doppio. |
| Altezza x | Alta: massimizza la leggibilità a parità di corpo, che è il vero vincolo a 70 cm di distanza. |
| Licenza | SIL Open Font License, self-hosting e subsetting consentiti. |

**Perché non una seconda famiglia display.** Un font da titolo aggiungerebbe carattere di marca, ma costerebbe un secondo file su una connessione da spogliatoio, e in questa app il carattere lo fanno il numero e il colore, non il titolo. Il sistema prevede comunque lo slot `--font-display`, oggi aliasato su `--font-sans`: il giorno che il brand vuole montare una display face si cambia una riga e nessun componente si tocca.

**Perché non i font di sistema.** SF Pro e Roboto sono ottimi e gratis, ma non danno lo stesso disegno su iOS, Android e desktop: una PWA che deve mostrare tabelle di numeri allineate e un timer a corpo 96 non può permettersi tre metriche diverse. Restano però il fallback, con metriche corrette.

### 4.2 Caricamento e anti-CLS

```css
@font-face {
  font-family: "Inter var";
  src: url("/fonts/inter-var-latin.woff2") format("woff2-variations");
  font-weight: 400 800;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F,
                 U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215;
}

/* Fallback con metriche allineate: evita lo scatto di layout allo swap.
   Valori generati con capsize/fontaine sulla coppia Inter -> Arial.
   Rigenerare se si cambia versione di Inter. */
@font-face {
  font-family: "Inter fallback";
  src: local("Arial");
  ascent-override: 90.0%;
  descent-override: 22.43%;
  line-gap-override: 0%;
  size-adjust: 107.64%;
}
```

Lo stack in `--font-sans` va quindi letto come: `"Inter var"`, poi `"Inter fallback"`, poi i font di sistema. Precaricare **solo** il file variabile latin con `<link rel="preload" as="font" type="font/woff2" crossorigin>`: è nel percorso critico del Largest Contentful Paint della schermata di allenamento.

### 4.3 Feature OpenType

```css
/* testo */
font-feature-settings: "cv05" 1, "cv08" 1, "ss02" 1, "calt" 1;

/* numeri (classe .num o attributo data-num) */
font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1, "ss02" 1, "calt" 0;
font-variant-numeric: tabular-nums lining-nums slashed-zero;
```

`calt` viene disattivato sui numeri: nessuna sostituzione contestuale deve toccare una cifra. `cv05` (l con coda) e `cv08` (I maiuscola con grazie) sono le due varianti che tolgono l'ambiguità nel testo italiano; se la versione di Inter che si adotta rinomina gli indici `cvXX`, `ss02` da solo copre comunque l'intero set di disambiguazione ed è il fallback sicuro.

**Regola assoluta**: qualunque cifra che rappresenti un dato di allenamento (peso, ripetizioni, serie, secondi, percentuali, date) è dentro un elemento con classe `.num`. Nessuna eccezione. Un peso scritto con cifre proporzionali fa ballare la colonna e si nota.

### 4.4 Scala di testo

Corpo base 17px. Non 16: a 17px con interlinea 26px il testo resta comodo anche letto in piedi e in movimento, e il costo in righe è trascurabile a 390px. Nessun testo dell'interfaccia scende sotto i 12px, e sotto i 13px si va solo per etichette maiuscole brevi.

| Token | px | rem | Interlinea | Spaziatura | Peso | Uso |
|---|---|---|---|---|---|---|
| `text-label-xs` | 12 | 0.75 | 1.3333 (16px) | +0.04em | 700 | overline, badge maiuscoli, unità di misura |
| `text-label-sm` | 13 | 0.8125 | 1.3846 (18px) | +0.01em | 600 | etichette di campo, metadati card |
| `text-body-sm` | 15 | 0.9375 | 1.4667 (22px) | 0 | 400 | testo secondario, descrizioni brevi |
| `text-body-md` | 17 | 1.0625 | 1.5294 (26px) | 0 | 400 | **default**: istruzioni esercizio, paragrafi |
| `text-body-lg` | 19 | 1.1875 | 1.4737 (28px) | -0.003em | 400 | testo introduttivo, onboarding |
| `text-title-sm` | 17 | 1.0625 | 1.2941 (22px) | -0.006em | 600 | titolo di riga, nome esercizio in lista |
| `text-title-md` | 20 | 1.25 | 1.30 (26px) | -0.011em | 600 | titolo di card, titolo bottom sheet |
| `text-title-lg` | 24 | 1.5 | 1.25 (30px) | -0.015em | 600 | titolo di sezione, nome esercizio in allenamento |
| `text-heading-sm` | 28 | 1.75 | 1.2143 (34px) | -0.018em | 700 | titolo di schermata |
| `text-heading-md` | 34 | 2.125 | 1.1765 (40px) | -0.021em | 700 | titolo di step onboarding |
| `text-heading-lg` | 40 | 2.5 | 1.10 (44px) | -0.024em | 700 | schermata di fine allenamento |

La spaziatura negativa cresce con il corpo: è il comportamento tipografico corretto, e in assenza dell'asse `opsz` sarebbe obbligatorio farlo a mano.

### 4.5 Scala numerica display

Scala dedicata, sempre con `--font-feature-num`. Serve a due cose: la lettura del timer a distanza e il colpo d'occhio sui carichi.

| Token | px | rem | Interlinea | Spaziatura | Peso | Uso |
|---|---|---|---|---|---|---|
| `text-num-sm` | 17 | 1.0625 | 1.1765 | 0 | 600 | ripetizioni in linea, contatori piccoli |
| `text-num-md` | 22 | 1.375 | 1.0909 | -0.01em | 600 | **peso e ripetizioni nella riga serie** |
| `text-num-lg` | 32 | 2 | 1.0625 | -0.018em | 700 | stat card, numeri dei progressi |
| `text-num-xl` | 48 | 3 | 1.00 | -0.024em | 700 | 1RM stimato, volume totale, riepiloghi |
| `text-num-2xl` | 64 | 4 | 0.9688 | -0.03em | 700 | timer nella barra compatta |
| `text-num-timer` | 96 | 6 | 0.9167 | -0.035em | 700 | **timer di recupero a schermo intero** |
| `text-num-hero` | 120 | 7.5 | 0.90 | -0.04em | 800 | conto alla rovescia finale 3-2-1 |

**Verifica di ingombro del timer.** Le cifre tabulari di Inter hanno avanzamento di circa 0.60em. A 96px: `01:30` sono 4 cifre da circa 57.6px più i due punti (circa 26px), meno la spaziatura negativa di 0.035em su 5 caratteri (circa 17px). Totale circa **239px**. Su un viewport da 390px con margini da 20px restano 350px utili: ci sta con oltre 100px di margine, e ci sta anche a 320px (280px utili). Il `text-num-hero` da 120px misura circa 299px: rientra a 390px, e a 320px si scala a 96px con una container query.

Non si usa mai `vw` per dimensionare il timer: a 320px un `vw` lo rimpicciolirebbe proprio sul dispositivo dove serve di più. Si usa una taglia fissa con una sola soglia di riduzione.

### 4.6 Regole tipografiche

1. **Misura di riga**: massimo 66 caratteri. A 390px con corpo 17px la colonna del testo va contenuta entro `--layout-content-max` (520px) anche su schermi più larghi.
2. **Mai testo giustificato.** In italiano, con parole lunghe e colonna stretta, produce fiumi bianchi.
3. **Le unità di misura sono sempre `text-label-xs` accanto al numero**, mai dentro il numero: `85` in `num-md` e `kg` in `label-xs`, così l'occhio legge prima la quantità.
4. **Lo zoom deve funzionare fino al 200%** senza scroll orizzontale (1.4.10) e con la spaziatura testo di 1.4.12 applicata: tutti i contenitori di testo usano altezza automatica, mai `height` fissa.
5. **Niente testo dentro le immagini** (1.4.5). Le istruzioni dell'esercizio sono un `<ol>`, non un'illustrazione.

---

## 5. Spaziatura, raggi, bordi, ombre, elevazione

### 5.1 Spaziatura

Base 4px (`--spacing: 0.25rem`, che in Tailwind v4 genera l'intera scala dinamica).

| Passo | px | Uso |
|---|---|---|
| 1 | 4 | distanza icona-etichetta, padding interno badge |
| 2 | 8 | **distanza minima fra due elementi interattivi** (2.5.8) |
| 3 | 12 | padding orizzontale chip, spazio fra campi in linea |
| 4 | 16 | **gutter di pagina**, padding card, distanza fra righe serie |
| 5 | 20 | gutter di pagina da 430px in su |
| 6 | 24 | padding verticale di sezione, distanza fra card |
| 8 | 32 | distanza fra blocchi, padding bottom sheet |
| 10 | 40 | separazione fra gruppi di sezione |
| 12 | 48 | distacco prima di un'azione primaria |
| 16 | 64 | spazio sopra e sotto lo stato vuoto |
| 20 | 80 | respiro delle schermate di celebrazione |
| 24 | 96 | margine superiore delle schermate a fuoco singolo |

Regola di ritmo: **gli spazi verticali dentro un componente sono multipli di 4, quelli fra componenti sono multipli di 8**. Se serve un 6px o un 14px, quasi sempre il problema è altrove.

### 5.2 Raggi

| Token | px | Uso |
|---|---|---|
| `radius-xs` | 4 | badge, tag piccoli, indicatori |
| `radius-sm` | 6 | anello di focus, chip compatti |
| `radius-md` | 10 | input, select, bottoni small e medium |
| `radius-lg` | 14 | **card, riga serie, bottone large** |
| `radius-xl` | 20 | card grandi, contenitori di sezione |
| `radius-2xl` | 28 | **bottom sheet (solo i due angoli superiori)**, modali |
| `radius-full` | 9999 | chip filtro, avatar, FAB, pill del timer |

Il raggio non è decorativo: distingue le famiglie. Rettangoli di dati (card, righe) usano `lg`; controlli di selezione e di azione tondi (chip, FAB) usano `full`. Non si mescolano.

### 5.3 Bordi

| Token | Valore | Uso |
|---|---|---|
| `border-width-hairline` | 1px | separatori, bordi di card |
| `border-width-default` | 1px | bordi di controllo a riposo (2px con `prefers-contrast: more`) |
| `border-width-strong` | 2px | controllo selezionato, campo in errore, riga serie attiva |
| `border-width-focus` | 2px | anello di focus, sempre con `outline-offset: 2px` |

Il **bordo sinistro** è una risorsa semantica riservata: 3px pieno in `brand-solid` indica la riga attiva, 3px tratteggiato in `warmup-border` indica il riscaldamento. Non usarlo per altro.

### 5.4 Ombre ed elevazione

In tema scuro l'ombra praticamente non si vede: la separazione la fa il **salto di luminosità** della superficie più un filetto. In tema chiaro succede il contrario. Il modello di elevazione tiene conto di entrambi.

| Livello | Tema scuro | Tema chiaro | Ombra | Uso |
|---|---|---|---|---|
| **e0** | canvas `#070A10` | canvas `#F4F5F7` | nessuna | fondo pagina |
| **e1** | surface `#0D1118` + `border-subtle` | `#FFFFFF` + `border-subtle` | `shadow-xs` | card in lista, riga serie |
| **e2** | raised `#151920` + `border-default` | `#FFFFFF` + `border-default` | `shadow-sm` | card sollevata, header sticky, barra timer |
| **e3** | overlay `#23272E` + `shadow-edge` | `#FFFFFF` | `shadow-lg` | bottom sheet, menu contestuale |
| **e4** | overlay `#23272E` + `shadow-edge` | `#FFFFFF` | `shadow-xl` | modale, toast, FAB |

`--shadow-edge` è l'unica "ombra" che conta davvero in tema scuro: una linea di luce interna al bordo superiore (`inset 0 1px 0 rgb(255 255 255 / 0.05)`) che stacca la superficie senza usare il nero. In tema chiaro vale zero, e va bene così.

`--shadow-glow-pr` è l'unica eccezione al divieto di glow, riservata al badge di record personale e alla card di celebrazione. Vive solo lì.

### 5.5 Scrim e sovrapposizioni

| Token | Scuro | Chiaro |
|---|---|---|
| `bg-scrim` | `rgb(3 6 10 / 0.72)` | `rgb(21 25 32 / 0.48)` |
| `state-hover` | `rgb(255 255 255 / 0.06)` | `rgb(21 25 32 / 0.05)` |
| `state-pressed` | `rgb(255 255 255 / 0.11)` | `rgb(21 25 32 / 0.10)` |

Lo scrim scuro a 0.72 porta il testo primario a 18.59:1 sopra qualunque contenuto sottostante: nessuna sorpresa quando una modale si apre sopra una foto di esercizio.

---

## 6. Griglia e layout

### 6.1 Impianto

- **Viewport di progetto**: 390px (iPhone 14/15/16 base). Verifica obbligatoria anche a 320px e a 430px.
- **Gutter**: 16px fino a 429px, 20px da 430px in su.
- **Colonna di contenuto**: larghezza piena fino a 560px; oltre, `max-inline-size: 520px` centrata. L'app non diventa mai una dashboard desktop: su schermo largo resta una colonna, perché la gerarchia progettata per il pollice non si traduce su tre colonne.
- **Griglia interna**: 4 colonne con gutter 16px a 390px (colonna da 69.5px). Serve per la lista esercizi a 2 colonne e per la griglia di scelta in onboarding.
- **Ritmo verticale**: 4px.

### 6.2 Safe area iOS

```css
:root {
  --layout-safe-top:    env(safe-area-inset-top, 0px);
  --layout-safe-bottom: env(safe-area-inset-bottom, 0px);
  --layout-safe-left:   env(safe-area-inset-left, 0px);
  --layout-safe-right:  env(safe-area-inset-right, 0px);
}
```

Nel manifest e nel meta viewport serve `viewport-fit=cover`, altrimenti `env()` restituisce sempre 0:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Valori tipici: 47-59px in alto su iPhone con Dynamic Island, 34px in basso (home indicator), 0 su Android. **Nessun elemento premibile entra nei 34px inferiori della safe area**: è la zona dove il gesto di sistema vince sempre sul tocco dell'app.

Usare `100dvh`, mai `100vh`: con la barra di Safari che si ritrae, `vh` lascia il timer tagliato.

### 6.3 Header

- Altezza contenuto: **56px**, più `--layout-safe-top`.
- Struttura: `[indietro 44x44] [titolo, flex:1] [azione 44x44]`.
- Padding orizzontale: gutter di pagina.
- Titolo: `text-title-md`, troncato a una riga con ellissi.
- Sticky con `position: sticky; top: 0; z-index: var(--z-sticky)`; fondo `bg-raised` più `border-default` sul bordo inferiore, che compare **solo dopo 8px di scroll** (classe `is-scrolled`). A riposo l'header è indistinguibile dal contenuto: meno rumore.
- Durante l'allenamento l'header si riduce a 48px e mostra il cronometro totale della sessione a destra.

### 6.4 Bottom navigation

- Altezza contenuto: **56px**, più `--layout-safe-bottom`. Totale tipico su iPhone: 90px.
- 4 voci, larghezza uguale (a 390px: 97.5px ciascuna), area tocco piena 97.5 x 56px, ben oltre il minimo.
- Voci: **Oggi**, **Schede**, **Esercizi**, **Progressi**.
- Composizione voce: icona 24px sopra, etichetta `text-label-xs` sotto, gap 4px. **L'etichetta c'è sempre**: nessuna icona senza testo.
- Voce attiva: icona in variante piena (non solo colore), etichetta in peso 700, colore `brand-text`, più `aria-current="page"`. Sono tre canali oltre al colore.
- Fondo `bg-surface`, bordo superiore `border-default`. Nessuna sfocatura: costa GPU e peggiora il contrasto.
- Il contenuto scrollabile riceve `padding-block-end: calc(var(--layout-tabbar-total) + var(--spacing) * 4)` e l'html `scroll-padding-bottom` dello stesso valore, perché un input a fuoco in fondo alla lista non finisca sotto la barra (2.4.11).
- **La tab bar sparisce durante l'allenamento in corso.** Quel contesto è a fuoco singolo; si esce solo da un'azione esplicita.

### 6.5 Contenuto scrollabile

```css
.screen-scroll {
  padding-inline: var(--layout-gutter);
  padding-block-start: var(--spacing);
  padding-block-end: calc(var(--layout-tabbar-total) + var(--spacing) * 4);
  overscroll-behavior-y: contain;   /* niente pull-to-refresh accidentale */
  scrollbar-gutter: stable;
}
```

Liste lunghe (876 esercizi) virtualizzate, con altezza di riga **fissa a 72px** perché la virtualizzazione non abbia bisogno di misurare. Le intestazioni di gruppo alfabetico sono sticky a 32px.

### 6.6 FAB

- **56 x 56px**, `radius-full`, riempimento `brand-solid`, icona 24px in `text-on-brand`, `shadow-xl`.
- Posizione: `inset-inline-end: var(--layout-gutter)`, `inset-block-end: calc(var(--layout-tabbar-total) + var(--spacing) * 4)`, cioè 16px sopra la tab bar.
- Nell'angolo destro perché la maggioranza usa il pollice destro; è comunque raggiungibile in zona comoda a 390px.
- Un solo FAB per schermata. In "Schede" apre "Nuova scheda", in "Esercizi" apre "Aggiungi al giorno corrente".
- Il FAB non copre mai l'ultimo elemento della lista: ci pensa il padding inferiore del contenitore.

### 6.7 Bottom sheet

- Larghezza piena, angoli superiori `radius-2xl` (28px).
- **Maniglia**: 36 x 4px, `radius-full`, `border-strong`, centrata, 12px dal bordo superiore. Decorativa: il gesto non è mai l'unico modo di chiudere.
- Altezze: `auto` fino a un massimo di **92dvh**. Oltre il 60% di altezza il contenuto interno diventa scrollabile con l'intestazione del foglio bloccata.
- Padding: 20px orizzontali, 8px superiori (sotto la maniglia), `calc(24px + var(--layout-safe-bottom))` inferiori.
- Titolo `text-title-md`, allineato a sinistra, con un pulsante "Chiudi" 44x44 a destra. **Il bottone di chiusura c'è sempre**, anche quando si può trascinare (2.5.7 vieta il trascinamento come unico modo).
- Scrim `bg-scrim`, chiusura anche con tocco sullo scrim ed `Escape`.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sul titolo, focus trap, focus di ritorno all'elemento che lo ha aperto.
- Le azioni primarie stanno in fondo al foglio, non in alto: è dove arriva il pollice.

### 6.8 Zone del pollice a 390 x 844

```
 0px  ┌──────────────────────────┐
      │  ZONA SCOMODA            │  lettura: titoli, numeri grandi,
      │  (0-280px)               │  grafici, foto esercizio
 280  ├──────────────────────────┤
      │  ZONA RAGGIUNGIBILE      │  contenuto scorrevole, controlli
      │  (280-560px)             │  secondari
 560  ├──────────────────────────┤
      │  ZONA COMODA             │  azioni primarie, checkbox serie,
      │  (560-844px)             │  stepper, timer, tab bar
 844  └──────────────────────────┘
```

Regola non negoziabile: **ogni azione primaria di una schermata sta sotto i 560px**. Vale in particolare per la schermata di allenamento, dove nulla di premibile sta nella metà alta dello schermo.

### 6.9 Breakpoint

| Nome | Da | Cosa cambia |
|---|---|---|
| base | 320px | una colonna, gutter 16, timer 96px ridotto a 72px sotto i 360px |
| `sm` | 390px | progetto di riferimento |
| `md` | 430px | gutter 20px, griglia esercizi a 2 colonne |
| `lg` | 768px | colonna centrata a 520px, tab bar resta in basso |
| `xl` | 1024px | tab bar opzionale a lato, colonna centrata, nessuna riorganizzazione del contenuto |

Dove possibile si usano **container query** invece dei breakpoint di viewport: la card esercizio e la riga serie devono adattarsi al loro contenitore (lista piena, colonna stretta, bottom sheet), non alla larghezza della finestra.

---

## 7. Inventario componenti

### 7.0 Convenzioni valide per tutti

**Stati.** Ogni componente interattivo implementa questi stati. Dove la tabella del componente non dice diversamente, valgono i default qui sotto.

| Stato | Resa di default |
|---|---|
| `default` | come da specifica del componente |
| `hover` | overlay `state-hover` sopra la superficie. **Solo entro `@media (hover: hover)`**: su touch l'hover non esiste e se lo si applica resta appiccicato dopo il tocco |
| `focus-visible` | `outline: 2px solid var(--color-border-focus); outline-offset: 2px` |
| `active` (premuto) | overlay `state-pressed` + `transform: scale(0.97)` in `--duration-1` con `--ease-out` |
| `disabled` | `color: var(--color-text-disabled)`, bordi in `border-default`, `cursor: not-allowed`, `aria-disabled="true"`, nessun overlay. **Accanto va sempre il motivo a testo** |
| `loading` | contenuto sostituito da spinner 18px, larghezza del componente bloccata, `aria-busy="true"`, etichetta invariata per screen reader |
| `error` | bordo 2px `danger-solid` + icona triangolo + messaggio in `danger-text` collegato con `aria-describedby` |
| `selected` | superficie `state-selected`, bordo 2px `brand-solid`, più un segno di forma (spunta, icona piena, pallino) |

**Transizioni.** `background-color`, `border-color`, `color`, `box-shadow`, `transform` in `--duration-2` con `--ease-standard`. Mai transizione su `width`, `height` o `top/left`.

**Regola dei target.** Minimo assoluto 44x44px. Se l'elemento visibile è più piccolo (checkbox, maniglia, "x" di un chip) l'area si estende con uno pseudo-elemento `::before` trasparente, senza cambiare il disegno.

---

### 7.1 Button

**Anatomia**: `[icona sinistra 20px] [etichetta] [icona destra 20px]`, gap 8px, contenuto centrato.

| Taglia | Altezza | Padding orizz. | Tipo | Raggio | Icona |
|---|---|---|---|---|---|
| `sm` | 36px | 12px | `text-label-sm` | `radius-md` | 16px |
| `md` | 48px | 16px | `text-title-sm` | `radius-md` | 20px |
| `lg` | 56px | 20px | `text-title-md` | `radius-lg` | 24px |

La taglia `sm` è alta 36px: sotto il minimo di 44px. È ammessa **solo** dentro contenitori dove l'area di tocco è estesa dal genitore (ad esempio dentro un toast o accanto a un input, con `::before` a 44px). Fuori da quei casi si usa `md`.

| Variante | Fondo | Testo | Bordo |
|---|---|---|---|
| `primary` | `brand-solid` | `text-on-brand` | nessuno |
| `secondary` | trasparente | `text-primary` | 1px `border-strong` |
| `ghost` | trasparente | `brand-text` | nessuno |
| `danger` | `danger-solid` | `text-on-danger` | nessuno |

Stati specifici: `primary` in hover passa a `brand-solid-hover`, in active a `brand-solid-active`; `secondary` in hover aggiunge `state-hover` e porta il bordo a `brand-solid`; `ghost` in hover prende `brand-surface` come fondo.

Bottone a piena larghezza (`is-block`) per tutte le azioni primarie mobile: `inline-size: 100%`, taglia `lg`.

### 7.2 IconButton

Quadrato **44x44** (`md`) o **56x56** (`lg`, usato solo in allenamento). Icona 22px/26px centrata. Raggio `radius-md` o `radius-full` a seconda del contesto. Varianti `ghost` (default), `filled`, `danger`.
Obbligatorio `aria-label` con lo stesso testo che l'utente direbbe ad alta voce (2.5.3): "Aggiungi serie", non "add-set". Se accanto esiste un'etichetta visibile, l'accessible name deve contenerla.

### 7.3 Input testo

**Anatomia**: etichetta sopra (`text-label-sm`, `text-secondary`, sempre visibile, mai solo placeholder) / campo / testo di aiuto o errore sotto (`text-body-sm`).

- Altezza campo **52px**, padding orizzontale 14px, `radius-md`, testo `text-body-md`.
- Fondo `bg-inset`, bordo 1px `border-strong`.
- Placeholder in `text-tertiary`: è un esempio, mai un'istruzione.
- Focus: bordo 2px `brand-solid` più l'anello di focus standard.
- Errore: bordo 2px `danger-solid`, icona triangolo dentro il campo a destra, messaggio sotto in `danger-text`, `aria-invalid="true"`, `aria-describedby` verso il messaggio.
- Con testo inserito compare una "x" per svuotare, 44x44.
- `autocomplete` corretto sui campi noti (3.3.7 e 1.3.5), **incolla sempre consentito** (3.3.8).

### 7.4 Input numerico con stepper

Il componente più delicato dell'app: si usa con una mano sudata, al buio, tra una serie e l'altra.

```
┌──────────┬─────────────────┬──────────┐
│    −     │      82.5       │    +     │   altezza 56px
│  56x56   │  num-lg, centro │  56x56   │
└──────────┴─────────────────┴──────────┘
             kg  (label-xs, sotto)
```

- Contenitore 56px di altezza, `radius-md`, fondo `bg-inset`, bordo 1px `border-strong`.
- I due pulsanti `−` e `+` sono **56x56**, separati dal campo da un filetto verticale `border-default`.
- Il campo centrale è un vero `<input type="text" inputmode="decimal">` (non `type="number"`: su iOS perde i decimali con la virgola e mostra le frecce di sistema). Selezione automatica del contenuto al focus, così si sovrascrive con un tocco.
- **Incremento intelligente**: pesi a passo 1.25kg sotto i 20kg, 2.5kg sopra; ripetizioni a passo 1; tempo a passo 5s. Il passo è una prop, non una costante globale.
- Pressione prolungata: ripetizione dopo 400ms, accelerazione a 8 passi al secondo dopo 1.2s.
- Tastiera: frecce su/giù cambiano il valore, `Shift` moltiplica il passo per 4.
- `role="spinbutton"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` ("82,5 chilogrammi").
- L'ultimo valore usato per quell'esercizio è precompilato in grigio come suggerimento accettabile con un tocco: si riduce la digitazione a zero nella maggior parte dei casi.

### 7.5 Select

Su mobile non si usa un menu custom: si apre un **bottom sheet con lista di opzioni**. Il controllo visibile ha l'aspetto dell'input (52px, `radius-md`) con una chevron 20px a destra. L'opzione selezionata nel foglio ha una spunta a sinistra e superficie `state-selected`. Nessuna dipendenza dal trascinamento.

### 7.6 Chip / Filter

- Altezza **40px**, area di tocco estesa a 44px, padding 14px, `radius-full`, `text-label-sm`.
- Non selezionato: fondo trasparente, bordo 1px `border-strong` (3:1 garantito, 1.4.11), testo `text-secondary`.
- Selezionato: fondo `brand-surface`, bordo 2px `brand-solid`, testo `brand-text`, **più una spunta 16px a sinistra**.
- Con contatore: numero in coda in `text-tertiary` (`Petto 42`).
- Chip rimovibile: "x" 20px a destra con area 44x44.
- Implementazione: `<button aria-pressed>` dentro un gruppo etichettato, mai `div` con classe attiva.
- La riga di chip scorre orizzontalmente con `scroll-snap-type: x proximity` e 16px di padding laterale; il primo chip è sempre "Tutti".

### 7.7 Card esercizio

Altezza fissa **72px** (per la virtualizzazione della lista da 876 elementi).

```
┌────────────────────────────────────────────────┐
│ ┌────┐  Panca piana con bilanciere        ›    │
│ │foto│  Petto · Bilanciere · Intermedio        │  72px
│ └────┘                                         │
└────────────────────────────────────────────────┘
  56x56   title-sm / label-sm text-tertiary
```

- Miniatura 56x56, `radius-md`, `aspect-ratio` dichiarato per non generare layout shift, `loading="lazy"`, placeholder skeleton.
- Titolo `text-title-sm` su una riga con ellissi; metadati `text-label-sm` in `text-tertiary` separati da `·`.
- In modalità selezione (editor scheda) la chevron diventa una checkbox 24px e la card selezionata prende `state-selected`.
- Stati: hover overlay, pressed scale 0.99 (una card intera non si schiaccia come un bottone), focus con anello a 2px offset 2px che non viene tagliato dal contenitore della lista.

### 7.8 Card scheda

```
┌────────────────────────────────────────────────┐
│ FORZA · 4 GIORNI                        ⋯      │  label-xs, brand-text
│ Spinta e trazione                              │  title-lg
│ 6 settimane · 24 esercizi                      │  body-sm, secondary
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  12 di 24 sessioni        │  progress + label-sm
│ ┌──────────────────────────────────────────┐   │
│ │            Continua                       │   │  button primary lg
│ └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

Padding 20px, `radius-xl`, superficie e1. Il menu `⋯` (44x44) apre un bottom sheet con Duplica, Rinomina, Archivia, Elimina. La scheda attiva ha bordo sinistro 3px `brand-solid`.

### 7.9 Riga serie

Vedi la sezione 8, dedicata.

### 7.10 Checkbox di completamento

Due varianti.

**Standard** (form, filtri): 24x24 visibili, area 44x44, `radius-xs`, bordo 2px `border-strong`. Selezionata: fondo `brand-solid`, spunta 16px in `text-on-brand`, animazione del tratto in 140ms.

**Completamento serie** (solo in allenamento): **44x44 visibili**, `radius-md`, bordo 2px `border-strong`. Completata: fondo `success-solid`, spunta 24px in `success-on-solid`. È volutamente più grande di qualunque altro controllo dell'app, perché è quello che si preme cento volte per sessione con il pollice.

### 7.11 Slider

Traccia 6px `radius-full` in `bg-inset`, parte attiva in `brand-solid`, pollice **28px** con area 44x44, bordo 2px `bg-surface` per staccarlo dalla traccia.
Obbligatorio, per 2.5.7 (livello A): il valore si cambia **anche** toccando la traccia, con le frecce da tastiera e con due pulsanti `−` e `+` affiancati. Il trascinamento non è mai l'unico modo. Il valore corrente è sempre scritto a numero sopra lo slider, in `num-md`.
Implementazione preferita: `<input type="range">` nativo ridisegnato.

### 7.12 Segmented control

Altezza **44px**, `radius-md`, fondo `bg-inset`, 2-4 segmenti a larghezza uguale. Il segmento attivo ha fondo `bg-raised`, `shadow-xs`, testo in peso 600; gli altri `text-secondary`. Indicatore che scorre in `--duration-3` con `--ease-standard`, e che con `prefers-reduced-motion` appare senza scorrere.
Ruolo `tablist`/`tab` se cambia vista, `radiogroup` se cambia valore. La differenza conta per gli screen reader.

### 7.13 Bottom sheet

Specifiche complete in 6.7.

### 7.14 Modal

Si usa **solo** per le conferme distruttive e per gli errori bloccanti. Tutto il resto è bottom sheet.
Larghezza `calc(100% - 32px)` fino a 400px, centrata, `radius-xl`, padding 24px, superficie e4.
Struttura: titolo `text-title-lg`, corpo `text-body-md`, due bottoni **impilati in verticale** (primario sopra, secondario sotto), entrambi `lg` a piena larghezza. Impilati e non affiancati: a 390px due bottoni affiancati sono entrambi scomodi e uno dei due viene premuto per sbaglio.
Nelle conferme distruttive il bottone pericoloso **non è quello preselezionato** e il focus iniziale va su "Annulla".

### 7.15 Toast

Larghezza `calc(100% - 32px)`, ancorato in basso a `calc(var(--layout-tabbar-total) + 16px)`, `radius-lg`, superficie e4, padding 16px.
Struttura: `[icona 20px] [messaggio body-sm] [azione ghost sm]`. L'azione tipica è **Annulla**, ed è obbligatoria dopo ogni eliminazione (3.3.4).
Durata 6 secondi, 10 se contiene un'azione. Si mette in pausa al passaggio del dito e al focus. `role="status"` per le conferme, `role="alert"` per gli errori.
Massimo un toast alla volta: il nuovo sostituisce il precedente.

### 7.16 Tab bar

Specifiche complete in 6.4.

### 7.17 Progress bar

Altezza 8px (`radius-full`), traccia `bg-inset`, riempimento `brand-solid`. Indeterminata: barra al 30% che scorre in 1.2s con `--ease-in-out`, sostituita da un'opacità pulsante con `prefers-reduced-motion`.
Sempre accompagnata da un'etichetta testuale con i valori assoluti ("12 di 24 sessioni"), mai solo dalla barra. `role="progressbar"` con `aria-valuenow/min/max` e `aria-valuetext`.

### 7.18 Skeleton

Fondo `neutral-900` (scuro) / `neutral-100` (chiaro), `radius-md`, stessa geometria del contenuto che sostituirà, così non c'è layout shift all'arrivo dei dati.
Animazione: opacità da 0.6 a 1 e ritorno in 1.4s, `--ease-in-out`. Con `prefers-reduced-motion` resta statica.
Il contenitore ha `aria-busy="true"`; i singoli skeleton sono `aria-hidden`. Mai più di 6 righe skeleton contemporaneamente.

### 7.19 Empty state

Struttura verticale centrata, padding 64px verticali:
`[illustrazione 120x120] [titolo title-md] [testo body-sm, max 2 righe] [bottone primary lg]`.
L'illustrazione è decorativa (`aria-hidden`), il significato sta tutto nel testo. Testi in sezione 12.

### 7.20 Badge

| Tipo | Altezza | Resa |
|---|---|---|
| `neutral` | 22px | fondo `bg-inset`, testo `text-secondary`, `label-xs` |
| `brand` | 22px | fondo `brand-surface`, bordo `brand-border`, testo `brand-text` |
| `pr` | 24px | fondo `pr-solid`, testo `pr-on-solid`, **icona fulmine 14px + "PR"**, `shadow-glow-pr` |
| `numerico` | 20px min | `radius-full`, fondo `danger-solid`, testo bianco, minimo 20px anche a una cifra |

Il badge PR è l'unico elemento dell'app con un bagliore, ed è l'unico punto in cui si può usare l'oro come riempimento.

### 7.21 Timer circolare

```
        ╭───────────────╮
      ╱                   ╲
     │        1:30         │     arco 12px, traccia rest-track
     │      RECUPERO       │     numero: num-timer
      ╲                   ╱      etichetta: label-xs
        ╰───────────────╯
```

- Diametro **240px** a 390px (200px sotto i 360px), spessore arco 12px, `stroke-linecap: round`.
- Traccia `rest-track`, arco `rest-ring`, che **si svuota** in senso orario (parte pieno, finisce vuoto): è la metafora corretta di un tempo che si consuma.
- Ultimi 10 secondi: arco e numero passano a `rest-urgent` e il numero sale a `num-hero`. **Il cambio di dimensione è il vero segnale**, il colore lo accompagna.
- Tempo superato: conteggio in positivo con prefisso `+` in `rest-overtime`.
- Accessibilità: `role="timer"` non annuncia da solo. Serve una live region `aria-live="polite"` separata che annunci soltanto a 60s, 30s, 10s e 0s, mai ogni secondo. Alla fine: suono, vibrazione **e** testo, mai uno solo dei tre (1.4.2).
- Controlli obbligatori sotto il cerchio (2.2.1 e 2.2.2): `−15s`, `Pausa/Riprendi`, `+15s`, più `Salta`. Il timer non deve mai far scadere o avanzare niente da solo.

### 7.22 Grafico

- Altezza 220px, larghezza piena, padding interno 16px, superficie e1.
- Assi: solo linea di base orizzontale in `chart-axis`; griglia orizzontale in `chart-grid`, massimo 4 linee; nessuna griglia verticale.
- Etichette assi `text-label-xs` in `text-tertiary`, con unità dichiarata una volta in testa ("kg", "serie").
- Linee: spessore 2.5px, `stroke-linejoin: round`. Punti dati solo dove c'è una sessione reale, raggio 4px, 7px sul punto selezionato.
- Marcatore PR: rombo pieno 10px in `chart-marker-pr` più etichetta "PR".
- Area sotto la linea: riempimento `chart-band`, mai un gradiente colorato.
- Interazione: tocco su una banda verticale, non sul singolo punto (a 390px il punto è troppo piccolo). Tooltip come pannello ancorato sotto il grafico, non come popup fluttuante, così non finisce fuori schermo.
- Da tastiera: frecce per muoversi fra i punti, con annuncio in live region.
- Ogni grafico ha il pulsante **"Vedi i dati"** che apre la tabella equivalente.

---

## 8. Il componente "Riga serie"

È l'elemento più usato dell'app: un utente ne tocca fra 20 e 40 per sessione, con la mano sudata, spesso senza guardare bene. Ha tre requisiti in conflitto: deve contenere quattro dati, deve essere premibile col pollice e deve essere leggibile di sfuggita. Si risolvono togliendo le etichette dalle righe e mettendole una volta sola in testa al blocco.

### 8.1 Griglia a 390px

Viewport 390px, gutter 16px, card esercizio con padding orizzontale 12px: larghezza interna utile **338px**.

```
│←16→│←12→│                    338 px                     │←12→│←16→│

 ┌────┬──────┬──────────┬────┬─────────┬──────────┬──────┐
 │ 28 │  10  │   100    │ 22 │   76    │    58    │  44  │
 └────┴──────┴──────────┴────┴─────────┴──────────┴──────┘
  serie  gap    peso     "×"   ripet.    spazio PR   check
```

| Colonna | Larghezza | Contenuto | Tipo |
|---|---|---|---|
| Serie | 28px | numero progressivo | `num-sm` 17px, `text-tertiary`, centrato |
| Peso | 100px | campo modificabile, altezza 48px | `num-md` 22px, `text-primary`, centrato |
| Separatore | 22px | `×` | `text-body-sm`, `text-tertiary` |
| Ripetizioni | 76px | campo modificabile, altezza 48px | `num-md` 22px, `text-primary`, centrato |
| Spazio PR | 58px flessibile | badge PR quando serve, altrimenti vuoto | |
| Completamento | 44px | checkbox | 44x44 |

**Altezza riga: 64px** (campo 48px + 8px sopra + 8px sotto). Nessuna spaziatura verticale fra righe: le separa un filetto `border-subtle` da 1px, così ne entrano di più nella zona comoda del pollice. La distanza fra due target adiacenti resta comunque superiore a 8px perché ogni riga ha un solo target primario (la checkbox) e i campi sono separati da 22px.

### 8.2 Intestazione di colonna

Una sola volta per esercizio, 20px di altezza, `text-label-xs` maiuscolo in `text-tertiary`, allineata alla stessa griglia:

```
 ┌──────────────────────────────────────────────────────┐
 │  SERIE      KG              RIP                      │   20px
 ├──────────────────────────────────────────────────────┤
```

Le unità sparite dalle righe restano nei nomi accessibili dei campi: `<label>Peso serie 2, chilogrammi</label>`, `<label>Ripetizioni serie 2</label>`. Visivamente nascoste, sempre presenti.

### 8.3 Varianti

**A. Esercizio a carico, serie da fare**

```
 ┌──────────────────────────────────────────────────────┐
 │   2     ┌─────────┐   ×   ┌───────┐          ┌────┐  │
 │         │  82,5   │       │   8   │          │    │  │   64px
 │         └─────────┘       └───────┘          └────┘  │
 └──────────────────────────────────────────────────────┘
```
Fondo `bg-surface`. Campi con fondo `bg-inset` e bordo 1px `border-strong`. Checkbox vuota, bordo 2px `border-strong`.

**B. Serie attiva (quella che stai facendo ora)**

```
 ┏┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃│  3     ┌─────────┐   ×   ┌───────┐          ┌────┐  ┃
 ┃│        │  82,5   │       │   8   │          │    │  ┃   64px
 ┃│        └─────────┘       └───────┘          └────┘  ┃
 ┗┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ↑ bordo sinistro 3px brand-solid
```
Fondo `bg-raised`, bordo sinistro 3px `brand-solid`, numero serie in `brand-text` e peso 700. È l'unico elemento caldo della schermata: la brace segna dove sei.

**C. Esercizio a corpo libero**

```
 ┌──────────────────────────────────────────────────────┐
 │   2      corpo libero     ×   ┌───────┐      ┌────┐  │
 │          + zavorra            │  12   │      │    │  │   64px
 │                               └───────┘      └────┘  │
 └──────────────────────────────────────────────────────┘
```
La colonna peso diventa testo: `corpo libero` in `text-body-sm` `text-tertiary`, con sotto un pulsante ghost `+ zavorra` in `text-label-xs` che, se toccato, trasforma la colonna in un campo peso normale. Nessuna casella vuota da guardare: se non c'è carico, non c'è campo.

**D. Esercizio a tempo (isometrico)**

```
 ┌──────────────────────────────────────────────────────┐
 │   2     ┌─────────┐       ┌───────┐          ┌────┐  │
 │         │  ⏱ 45"  │       │   ·   │          │    │  │   64px
 │         └─────────┘       └───────┘          └────┘  │
 └──────────────────────────────────────────────────────┘
```
L'intestazione della colonna diventa `SEC` al posto di `RIP`, e il campo tempo occupa la colonna peso con un'icona cronometro 16px prefissa. La colonna ripetizioni mostra un punto mediano non premibile (`·`, `aria-hidden`). Il campo tempo apre un selettore rapido con 15/30/45/60/90 secondi oltre all'input libero.
Per l'isometrico zavorrato le colonne si invertono: peso a sinistra, secondi a destra, e l'intestazione lo dichiara.

**E. Serie di riscaldamento**

```
 ┌╌─────────────────────────────────────────────────────┐
 ╎│ Ris.    ┌─────────┐   ×   ┌───────┐          ┌────┐ │
 ╎│         │   40    │       │  10   │          │    │ │   64px
 ╎│         └─────────┘       └───────┘          └────┘ │
 └╌─────────────────────────────────────────────────────┘
  ↑ bordo sinistro 3px tratteggiato, warmup-border
```
Nessun colore. Al posto del numero c'è l'etichetta `Ris.` in `text-label-xs` `warmup-text`, e il bordo sinistro è tratteggiato. Le serie di riscaldamento **non entrano nel conteggio del volume** e non generano record: la riga lo dichiara con il testo, non con la tinta.

**F. Serie completata**

```
 ┌──────────────────────────────────────────────────────┐
 │   2        82,5        ×      8              ┌────┐  │
 │                                              │ ✓  │  │   64px
 │                                              └────┘  │
 └──────────────────────────────────────────────────────┘
   fondo set-done-surface · checkbox piena success-solid
```
I campi perdono bordo e fondo e diventano testo statico (restano modificabili con un tocco, ma smettono di sembrare caselle da riempire: l'occhio deve scorrere via). Fondo riga `set-done-surface`, checkbox piena `success-solid` con spunta in `success-on-solid`. Tre canali oltre al colore: la spunta, la sparizione delle caselle, il fondo.

**G. Record personale battuto**

```
 ┌──────────────────────────────────────────────────────┐
 │   3        90,0        ×      8      ┌──────┐┌────┐  │
 │                                      │ ⚡ PR ││ ✓  │  │   64px
 │                                      └──────┘└────┘  │
 └──────────────────────────────────────────────────────┘
   fondo pr-surface · bordo 1px pr-border · shadow-glow-pr
```
Il badge PR occupa lo spazio flessibile: altezza 24px, fondo `pr-solid`, testo `pr-on-solid` (9.00:1 in scuro, 7.21:1 in chiaro), icona fulmine 14px più le lettere "PR". Il bagliore `shadow-glow-pr` vive solo qui.
Il badge è premibile (area estesa a 44px) e apre un foglio con "Nuovo record: 90 kg x 8. Il precedente era 87,5 kg x 8 del 3 marzo".
Se la riga è sia PR sia completata, vince il trattamento PR e la checkbox resta verde piena.

### 8.4 Interazione

| Gesto | Effetto |
|---|---|
| Tocco sulla checkbox | completa la serie, avvia il timer di recupero, sposta lo stato attivo alla riga successiva |
| Tocco su un campo | seleziona tutto il contenuto, apre la tastiera numerica |
| Tocco lungo sulla riga | apre il foglio azioni: Duplica serie, Converti in riscaldamento, Note, Elimina |
| Scorrimento verso sinistra | elimina, con conferma nel toast ("Annulla") |
| Doppio tocco sul peso | ripete il valore della serie precedente |

**Lo scorrimento non è mai l'unico modo** (2.5.7): tutto quello che si fa con un gesto si fa anche dal foglio azioni del tocco lungo, che a sua volta è raggiungibile da tastiera con un pulsante `⋯` che compare al focus.

### 8.5 Semantica

La lista di serie di un esercizio è una `<table>` con `<th scope="col">` per Serie, Kg e Rip. È una tabella di dati a tutti gli effetti, e gli screen reader sanno leggerla per righe e colonne meglio di qualunque struttura custom.

```html
<table>
  <caption class="sr-only">Serie di Panca piana con bilanciere</caption>
  <thead>
    <tr><th scope="col">Serie</th><th scope="col">Kg</th>
        <th scope="col">Rip</th><th scope="col">Completata</th></tr>
  </thead>
  <tbody>
    <tr aria-current="true">
      <th scope="row">3</th>
      <td><label class="sr-only" for="w3">Peso serie 3, chilogrammi</label>
          <input id="w3" inputmode="decimal" value="82,5"></td>
      <td><label class="sr-only" for="r3">Ripetizioni serie 3</label>
          <input id="r3" inputmode="numeric" value="8"></td>
      <td><input type="checkbox" id="d3">
          <label class="sr-only" for="d3">Segna serie 3 come completata</label></td>
    </tr>
  </tbody>
</table>
```

Al completamento, una live region `role="status"` annuncia: *"Serie 3 completata. 82,5 chili per 8 ripetizioni. Recupero 90 secondi."* Se è un record: *"Record personale."* in testa alla frase.

### 8.6 Comportamento a 320px

La larghezza interna scende a 268px. Le colonne diventano: serie 24, peso 88, separatore 18, ripetizioni 68, PR 26, checkbox 44. Il badge PR perde le lettere e resta solo il fulmine, con `aria-label="Record personale"`. Sotto i 320px non si scende.

---

## 9. La schermata "Allenamento in corso"

È la schermata che giustifica tutto il resto del sistema. Tre vincoli la governano: una mano sola, lettura di sfuggita, e un telefono che a volte è in mano e a volte è appoggiato su una panca a 70 cm di distanza. Per questo esistono **due modalità**, non una.

### 9.1 Modalità normale, wireframe a 390 x 844

```
       0 ┌───────────────────────────────────────────────┐
         │              safe-area-inset-top (47)          │
      47 ├───────────────────────────────────────────────┤
         │  ✕      Spinta A            0:24:13       ⋯   │  48  header
      95 ├───────────────────────────────────────────────┤
         │  ●●○○○○          Esercizio 2 di 6              │  36  avanzamento
     131 ├───────────────────────────────────────────────┤
         │                                               │
         │  Panca piana con bilanciere            [▶]    │  title-lg
         │  Obiettivo 4 × 8 a 82,5 kg                    │  body-sm
         │                                               │  72
     203 ├───────────────────────────────────────────────┤
         │  SERIE     KG              RIP                │  20
     223 ├───────────────────────────────────────────────┤
         │   1        82,5      ×      8          [ ✓ ]  │  64  completata
     287 ├───────────────────────────────────────────────┤
         │   2        82,5      ×      8          [ ✓ ]  │  64  completata
     351 ├───────────────────────────────────────────────┤
         │▌  3      [ 82,5 ]    ×    [ 8 ]        [   ]  │  64  ATTIVA
     415 ├───────────────────────────────────────────────┤
         │   4      [ 82,5 ]    ×    [ 8 ]        [   ]  │  64
     479 ├───────────────────────────────────────────────┤
         │   +  Aggiungi serie                           │  48
     527 ├───────────────────────────────────────────────┤
         │   Note dell'esercizio                    ›    │  48
     575 │   Sostituisci esercizio                  ›    │  48
     623 ├───────────────────────────────────────────────┤
         │   (l'esercizio successivo continua a scorrere)│
         │                                               │
     ╌╌╌ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
     754 ├───────────────────────────────────────────────┤
         │  ⏱  1:24   RECUPERO      −15   ‖   +15        │  72  barra timer
     826 ├───────────────────────────────────────────────┤
         │  ┌─────────────────────────────────────────┐  │
         │  │         Esercizio successivo            │  │  56  azione
         │  └─────────────────────────────────────────┘  │
     ╌╌╌ ├───────────────────────────────────────────────┤
         │            safe-area-inset-bottom (34)         │
         └───────────────────────────────────────────────┘
```

**Gerarchia visiva, dall'alto al basso**

| Zona | Altezza | Peso visivo | Contenuto |
|---|---|---|---|
| Header | 48 + safe-top | basso | uscita, nome scheda, cronometro sessione in `num-sm`, menu |
| Avanzamento | 36 | basso | pallini di esercizio, testo di posizione |
| Testata esercizio | 72 | **alto** | nome in `text-title-lg`, obiettivo in `text-body-sm`, pulsante `▶` che apre le foto in loop e le istruzioni |
| Tabella serie | 20 + n x 64 | **massimo** | la riga attiva è l'unico elemento caldo della schermata |
| Azioni di esercizio | 48 x 3 | basso | aggiungi serie, note, sostituisci |
| Barra timer | 72 | **alto quando attiva** | compare solo durante il recupero |
| Azione primaria | 56 | alto | avanza al prossimo esercizio, oppure "Termina allenamento" sull'ultimo |

La tab bar dell'app **non c'è**: qui si è in contesto a fuoco singolo. L'uscita passa dalla `✕` in alto, con conferma.

**Le tre cose calde della schermata sono tre**, e mai di più: il bordo sinistro della riga attiva, il bottone primario in basso, il pallino di avanzamento corrente. Tutto il resto è acciaio.

### 9.2 Il pannello di recupero

Alla spunta di una serie il pannello di recupero sale dal basso e occupa **320px + safe-bottom**, cioè il terzo inferiore dello schermo, lasciando visibili l'esercizio e la serie successiva.

```
     490 ┌───────────────────────────────────────────────┐
         │                  ▂▂▂▂▂                        │  16  maniglia
         │  RECUPERO                    Prossima: 4 di 4 │  20  label-xs
         │                                               │  12
         │                                               │
         │                  1:24                         │  88  num-timer 96px
         │                                               │
         │                                               │  12
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░  │   8  barra lineare
         │                                               │  16
         │  ┌─────────┐  ┌─────────────┐  ┌─────────┐   │
         │  │  −15 s  │  │    Pausa    │  │  +15 s  │   │  56
         │  └─────────┘  └─────────────┘  └─────────┘   │
         │                                               │  12
         │  ┌─────────────────────────────────────────┐  │
         │  │          Salta il recupero              │  │  56
         │  └─────────────────────────────────────────┘  │
     810 ├───────────────────────────────────────────────┤
         │            safe-area-inset-bottom              │
         └───────────────────────────────────────────────┘
```

Misure dei controlli: `−15 s` e `+15 s` larghi 96px, `Pausa` 130px, gap 8px, tutti alti 56px. Totale 326px su 358 disponibili. Sono tutti nella zona comoda del pollice.

### 9.3 Modalità panca (telefono appoggiato)

Un tocco sul numero del timer, oppure l'impostazione "timer a schermo intero" attiva, porta alla modalità panca: schermo pieno, nessuna lista, solo il tempo.

```
       0 ┌───────────────────────────────────────────────┐
         │  ✕                                            │  48
         │                                               │
         │                  RECUPERO                     │  label-xs
         │                                               │
         │             ╭───────────────╮                 │
         │           ╱                   ╲               │
         │          │                     │              │  arco 240px
         │          │       1:24          │              │  num-hero 120px
         │          │                     │              │
         │           ╲                   ╱               │
         │             ╰───────────────╯                 │
         │                                               │
         │        Prossima: serie 4 · 82,5 kg × 8        │  title-md
         │                                               │
         │  ┌─────────┐  ┌─────────────┐  ┌─────────┐   │  64
         │  │  −15 s  │  │    Pausa    │  │  +15 s  │   │
         │  └─────────┘  └─────────────┘  └─────────┘   │
         │  ┌─────────────────────────────────────────┐  │  64
         │  │             Ho finito                   │  │
         │  └─────────────────────────────────────────┘  │
         └───────────────────────────────────────────────┘
```

Qui i controlli salgono a 64px e la luminosità dello schermo viene forzata al massimo per la durata del recupero (Screen Wake Lock API), perché la lettura a distanza dipende più dalla luminanza che dalla dimensione.

**Verifica di leggibilità a distanza.** Su un telefono da 390pt di larghezza logica e circa 71,5 mm di larghezza fisica, 1 px CSS vale circa 0,183 mm. L'altezza delle cifre di Inter è circa 0,727em.

| Corpo | Altezza cifra | Angolo visivo a 70 cm |
|---|---|---|
| `num-timer` 96px | circa 12,8 mm | circa **63 minuti d'arco** |
| `num-hero` 120px | circa 16,0 mm | circa **79 minuti d'arco** |

La soglia di lettura comoda per un'acuità normale è intorno ai 20-25 minuti d'arco. Entrambe le taglie stanno due volte e mezza sopra la soglia: leggibili anche con vista ridotta, di sfuggita, con il sudore negli occhi.

### 9.4 Comportamento del timer

| Fase | Numero | Arco / barra | Altro |
|---|---|---|---|
| Avvio | `num-timer`, `text-primary` | pieno, `rest-ring` | annuncio "Recupero 90 secondi" |
| In corso | si svuota linearmente | | annunci solo a 60, 30, 10 e 0 secondi |
| Ultimi 10 s | passa a `num-hero` e a `rest-urgent` | `rest-urgent` | il **cambio di dimensione** è il segnale primario |
| 3, 2, 1 | ogni cifra entra con scala 1,08 in 200ms | | vibrazione breve a ogni secondo, se attiva |
| Fine | `+0:00` poi conteggio in positivo | `rest-overtime` | suono + vibrazione + testo "Recupero finito" |
| Superato | `+0:42`, `rest-overtime` | | nessuna azione automatica |

**Regole non negoziabili** (2.2.1, 2.2.2, 1.4.2):

- il timer **non chiude niente e non avanza niente da solo**: allo zero resta lì e conta in positivo;
- si può sempre mettere in pausa, azzerare, estendere di 15 secondi e saltare;
- il suono di fine non è mai l'unico canale: c'è anche la vibrazione e c'è il testo, e il volume si regola nelle impostazioni;
- il timer continua a contare correttamente in background e a schermo bloccato: il conteggio si basa su un timestamp di partenza salvato, non su un accumulatore di `setInterval`, e viene ricalcolato al rientro in primo piano;
- se il conteggio è già finito mentre l'app era in background, al rientro si mostra "Recupero finito da 2:15", non zero.

### 9.5 Durata di default del recupero

Suggerita dal sistema in base all'obiettivo dell'esercizio, e sempre modificabile dall'utente, che è l'unico a sapere come si sente.

| Obiettivo | Default |
|---|---|
| Forza (1-5 rip) | 180 s |
| Ipertrofia (6-12 rip) | 90 s |
| Resistenza (13+ rip) | 45 s |
| Isolamento / complementari | 60 s |

### 9.6 Fine allenamento

Il bottone primario sull'ultimo esercizio diventa "Termina allenamento" in variante `primary`. Porta a una schermata di riepilogo con: durata, volume totale in `num-xl`, serie completate, record battuti (uno per riga con badge PR), e confronto con la stessa sessione precedente. In fondo, un solo bottone "Salva e chiudi" e un campo note facoltativo.
Se restano serie non completate, prima appare un foglio: "Hai 2 serie non completate. Le segno come saltate?" con le opzioni "Sì, chiudi" e "Torna indietro".

---

## 10. Motion

### 10.1 Principio

Il movimento qui ha un solo compito: **dire da dove arriva una cosa e dove è finita**. Non c'è nessun momento, in un'app che si usa fra una serie e l'altra, in cui valga la pena far aspettare l'utente per guardare un'animazione. Budget: nessuna transizione di interfaccia sopra i 280ms, tranne le due celebrazioni della sezione 10.3.

### 10.2 Token e abbinamenti

| Token | Durata | Uso |
|---|---|---|
| `duration-1` | 90ms | pressione, cambio colore, schiacciamento del bottone |
| `duration-2` | 140ms | hover, focus, spunta della checkbox |
| `duration-3` | 200ms | tooltip, chip, indicatore del segmented control |
| `duration-4` | 280ms | bottom sheet, pannello di recupero, transizione di pagina |
| `duration-5` | 400ms | modale, riordino della lista |
| `duration-6` | 640ms | celebrazione PR, riepilogo di fine allenamento |

| Easing | Curva | Uso |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default per tutto |
| `ease-out` | `cubic-bezier(0, 0, 0, 1)` | elementi che entrano |
| `ease-in` | `cubic-bezier(0.3, 0, 1, 1)` | elementi che escono |
| `ease-in-out` | `cubic-bezier(0.5, 0, 0.1, 1)` | cicli continui (skeleton, barra indeterminata) |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | **solo** spunta di completamento e badge PR |

Si animano solo `transform`, `opacity`, `color`, `background-color`, `border-color`, `box-shadow`. Mai `width`, `height`, `top`, `left`, `margin`: costano layout a ogni fotogramma e a 60 fps non ce lo possiamo permettere su un telefono di quattro anni fa.

### 10.3 Le micro-interazioni che valgono la pena

Sono tre. Tutto il resto è transizione di stato senza scenografia.

**1. Completamento serie** (la più importante, si vede 30 volte a sessione)
- checkbox: scala 1 → 0,88 → 1,06 → 1 in 260ms con `ease-spring`;
- tratto della spunta: `stroke-dashoffset` da 100% a 0 in 180ms con `ease-out`, in ritardo di 60ms;
- fondo riga: da `bg-surface` a `set-done-surface` in 200ms;
- i campi perdono bordo e fondo in 200ms e diventano testo;
- vibrazione di 10ms;
- lo stato attivo scivola alla riga successiva in 200ms.
Costo totale: 260ms, e il timer parte al millisecondo zero, non alla fine dell'animazione.

**2. Record personale**
- il badge PR entra con scala da 0,6 a 1 e rotazione da -8 a 0 gradi in 420ms con `ease-spring`;
- `shadow-glow-pr` passa da 0 a pieno e poi si assesta al 60% in 640ms;
- un pulviscolo di 6 particelle in `pr-solid` che salgono e svaniscono in 640ms, e **solo per i record**, mai per un completamento normale;
- vibrazione doppia (10ms, pausa 60ms, 20ms);
- annuncio in live region: "Record personale".
Se l'utente batte tre record di fila, la celebrazione si riduce al badge e alla vibrazione dopo il primo: la festa ripetuta diventa rumore.

**3. Fine del timer di recupero**
- negli ultimi 10 secondi il numero passa a `num-hero` con una transizione di 200ms, e ogni cifra che cambia entra con scala 1,08 → 1 in 200ms;
- allo zero il pannello ha un solo impulso: bordo che lampeggia una volta in `rest-overtime` in 300ms;
- **nessun lampeggio ripetuto**: mai più di un impulso, e mai più di 3 volte al secondo in nessun caso (2.3.1).

### 10.4 Transizioni di navigazione

| Transizione | Movimento | Durata |
|---|---|---|
| Push (dettaglio) | entra da destra, 24px di scorrimento più opacità | 280ms `ease-standard` |
| Pop (indietro) | esce a destra | 240ms `ease-in` |
| Cambio tab | solo dissolvenza, nessuno scorrimento | 140ms |
| Bottom sheet | risale, con overscroll di 8px | 280ms `ease-standard` |
| Pannello recupero | risale senza overscroll | 280ms `ease-standard` |
| Modale | scala da 0,96 a 1 più opacità | 200ms `ease-out` |
| Toast | entra dal basso di 16px | 200ms `ease-out`, esce in 140ms |

Dove disponibile si usa la View Transitions API, con fallback alle transizioni CSS.

### 10.5 prefers-reduced-motion

La regola è già in `tokens.css`: tutte le durate scendono a 1ms e `ease-spring` diventa lineare. Ma la riduzione non è una soppressione: **quello che il movimento comunicava deve restare**.

| Animazione | Con motion ridotto |
|---|---|
| Spunta di completamento | appare istantanea, il fondo verde cambia comunque |
| Celebrazione PR | badge presente, nessuna particella, nessuna rotazione, vibrazione mantenuta |
| Ultimi 10 secondi del timer | il numero cambia comunque dimensione e colore, senza transizione |
| Bottom sheet e pannello | compaiono senza scorrimento, lo scrim resta |
| Skeleton | statico, senza pulsazione |
| Barra indeterminata | opacità fissa, testo "Caricamento" visibile |
| Loop a 2 frame della scheda esercizio | fermo sul primo fotogramma, con un pulsante esplicito per avviarlo |

**Il loop a 2 frame degli esercizi** merita una regola a parte: dura più di 5 secondi e parte da solo, quindi per 2.2.2 serve comunque un controllo di pausa anche senza `prefers-reduced-motion`. Periodo minimo per fotogramma **700ms** (2.3.1 impone di stare sotto i 3 lampeggi al secondo; 700ms dà un margine ampio). Con motion ridotto parte in pausa.

---

## 11. Iconografia

### 11.1 Set scelto: Lucide

**Lucide** (`lucide-react`), licenza ISC, fork mantenuto di Feather.

| Criterio | Verifica |
|---|---|
| Peso | Ogni icona è un componente SVG a sé: con il tree-shaking arriva nel bundle solo quello che si usa, circa 0,4-1 KB per icona. Nessun font di icone, nessuno sprite da 200 KB. |
| Copertura | Oltre 1500 icone, incluse quasi tutte quelle di dominio: `dumbbell`, `timer`, `flame`, `trophy`, `zap`, `activity`, `trending-up`, `calendar`, `heart-pulse`. |
| Coerenza | Griglia 24px, tratto 2px, terminazioni e giunzioni tonde, disegno geometrico ma non rigido. Si sposa con un grottesco neutro come Inter. |
| Adattabilità | `stroke="currentColor"`: le icone seguono il colore del testo e quindi i temi funzionano gratis. |
| Accessibilità | SVG inline, quindi sempre `aria-hidden="true"` quando c'è testo accanto, `role="img"` con `aria-label` quando è sola. |

Alternative valutate e scartate: Phosphor (bellissimo, ma 6 pesi e un bundle molto più grosso), Material Symbols (font variabile da caricare, e un linguaggio visivo che è di un'altra marca), Heroicons (copertura di dominio troppo scarsa: manca il manubrio).

### 11.2 Regole d'uso

1. **Dimensioni**: 18px (`size-icon-sm`, dentro chip e badge), 22px (`md`, default), 26px (`lg`, azioni primarie e header), 32px (`xl`, stati vuoti piccoli). Il tratto resta 2px a tutte le taglie tranne 18px, dove scende a 1,75px per non impastare.
2. **Mai un'icona da sola in navigazione.** La tab bar ha sempre l'etichetta. Un'icona senza testo è ammessa solo per azioni universalmente note (chiudi, indietro, più, menu), e comunque con `aria-label`.
3. **Il colore dell'icona segue il testo** con cui sta. Un'icona colorata diversamente dal testo accanto significa che sta portando un'informazione propria, e allora deve averne una.
4. **Stato attivo con la forma, non solo con la tinta.** Nella tab bar l'icona attiva è la variante piena; se Lucide non la fornisce, si aggiunge `fill="currentColor"` con opacità 0.2 sul corpo dell'icona.
5. **Niente icone decorative.** Se un'icona non aggiunge riconoscimento o non risparmia una parola, si toglie.
6. **Allineamento ottico**: le icone si allineano al centro ottico del testo, non alla sua altezza x. Con Inter significa un `translateY(-0.5px)` sulle icone accanto al testo di corpo.
7. **Icone custom**: stessa griglia 24px, stesso tratto 2px, stesse terminazioni tonde, stessa area di sicurezza di 1px sul bordo. Le uniche che probabilmente servirà disegnare sono le sagome dei gruppi muscolari per la heatmap e alcuni attrezzi (kettlebell in vista laterale, cavi, panca inclinata).

### 11.3 Dizionario delle icone dell'app

| Concetto | Icona Lucide |
|---|---|
| Oggi / allenamento | `flame` |
| Schede | `clipboard-list` |
| Catalogo esercizi | `dumbbell` |
| Progressi | `trending-up` |
| Timer di recupero | `timer` |
| Record personale | `zap` |
| Serie completata | `check` |
| Aggiungi | `plus` |
| Rimuovi / elimina | `trash-2` |
| Riordina | `grip-vertical` (con i pulsanti su/giù accanto) |
| Filtri | `sliders-horizontal` |
| Ricerca | `search` |
| Note | `pencil-line` |
| Sostituisci esercizio | `repeat-2` |
| Riproduci il loop | `play` / `pause` |
| Infortunio / cautela | `shield-alert` |
| Livello | `bar-chart-3` |
| Attrezzo | `wrench` |
| Muscolo primario | `target` |

---

## 12. Illustrazioni, empty state, tono di voce

### 12.1 Stile delle illustrazioni

Monolineari, coerenti con le icone ma a un livello di dettaglio superiore: griglia 120px, tratto 2,5px, terminazioni tonde, **due colori soltanto** (`text-tertiary` per la struttura, `brand-text` per un singolo dettaglio d'accento). Nessun riempimento pieno, nessun gradiente, nessuna ombra.

Si illustrano **oggetti, non persone**: un bilanciere appoggiato, un cronometro, un taccuino aperto, una rastrelliera vuota, un nastro metrico. Motivo pratico e non ideologico: qualunque corpo disegnato esclude qualcuno, e questa app la usano tanto il powerlifter quanto chi torna da un'ernia. L'oggetto è di tutti.

Formato: SVG inline con `stroke="currentColor"`, così le illustrazioni cambiano tema da sole. Peso massimo 4 KB ciascuna. Sono sempre `aria-hidden="true"`: il significato sta nel testo.

### 12.2 Tono di voce

**Si dà del tu.** Sempre, in tutta l'app, senza eccezioni, anche negli errori e nelle email. È il registro di chi si allena, e il "lei" in un'app di allenamento suona come un modulo da compilare.

**Il registro è quello di un compagno di allenamento competente**: qualcuno che sa le cose, te le dice in due parole e non ti fa la predica. Non è un coach motivazionale americano e non è un manuale.

Regole:

1. **Frasi brevi.** Un concetto per frase. Nei toast, massimo 60 caratteri.
2. **Il merito è dell'utente, non dell'app.** "Hai battuto il tuo record", mai "Complimenti da parte nostra".
3. **Niente motivazionalese.** Vietati: "Sei un guerriero", "Nessuna scusa", "No pain no gain", "Spacca tutto". Sono il modo più veloce per far chiudere l'app a chi si allena per la schiena.
4. **Zero colpevolizzazione.** Se qualcuno non si allena da tre settimane, l'app non lo nota ad alta voce. Si riparte, punto.
5. **Punti esclamativi**: al massimo uno per schermata, e solo per i record. Il resto va in tono piano.
6. **Imperativo solo nei bottoni.** Nei testi si descrive, non si ordina.
7. **Numeri sempre a cifre**, mai a lettere: "3 serie", non "tre serie".
8. **I decimali con la virgola**, i pesi senza zeri inutili: "82,5 kg" e "80 kg", mai "80,0 kg".
9. **Gli errori dicono cosa fare**, non cosa è successo. "Riprova" prima di "Errore 500".
10. **Niente inglese dove esiste l'italiano.** Restano: set (no, si dice serie), rep (no, ripetizioni), PR (sì, è gergo reale e sta in un badge da 24px), warm-up (no, riscaldamento), workout (no, allenamento).

### 12.3 Microcopy

**Catalogo esercizi, nessun risultato di ricerca**

> **Nessun esercizio per "panka"**
> Controlla come l'hai scritto, oppure togli qualche filtro: ne hai attivi 3.
>
> `[ Azzera i filtri ]`  `[ Sfoglia tutti gli 876 esercizi ]`

Nota: il termine cercato va ripetuto fra virgolette, il numero di filtri attivi va detto, e va sempre offerta una via d'uscita che non sia "riprova".

**Catalogo esercizi, filtro senza risultati ma ricerca vuota**

> **Nessun esercizio con questa combinazione**
> Non ci sono esercizi per bicipiti a corpo libero di livello avanzato. Prova a togliere il livello.
>
> `[ Togli il filtro livello ]`

**Nessuna scheda**

> **Non hai ancora una scheda**
> Puoi fartene generare una in un minuto rispondendo a qualche domanda, oppure costruirla esercizio per esercizio.
>
> `[ Genera una scheda ]`
> `[ Costruiscila da solo ]`

**Nessuno storico nei progressi**

> **Qui non c'è ancora niente da vedere**
> I grafici compaiono dopo il secondo allenamento: servono almeno due punti per tracciare una linea.

**Fine allenamento**

> **Fatto.**
> 52 minuti · 18 serie · 4.820 kg sollevati
> Sono 340 kg in più della stessa sessione di settimana scorsa.
>
> `[ Salva e chiudi ]`

Se non ci sono confronti disponibili, la terza riga sparisce e non viene sostituita da un incoraggiamento generico.

**Fine allenamento con serie non completate**

> **Hai 2 serie non completate**
> Le segno come saltate e chiudo l'allenamento?
>
> `[ Sì, chiudi ]`  `[ Torna indietro ]`

**Record personale (toast)**

> ⚡ **Record personale**
> Panca piana: 90 kg × 8. Il precedente era 87,5 kg × 8.

**Record personale (riepilogo di fine sessione)**

> **2 record oggi**
> Panca piana 90 kg × 8 (prima 87,5 × 8)
> Stacco 140 kg × 5 (prima 135 × 5)

**Errore di rete, con dati locali disponibili**

> **Sei offline**
> L'allenamento continua: i dati restano sul telefono e si sincronizzano appena torna la connessione.

**Errore di rete, azione bloccata**

> **Non riesco a salvare adesso**
> La connessione non risponde. L'allenamento è al sicuro sul telefono, riprovo da solo fra poco.
>
> `[ Riprova ora ]`

**Errore di rete, caricamento catalogo**

> **Non riesco a caricare gli esercizi**
> Controlla la connessione e riprova.
>
> `[ Riprova ]`

**Conferma di eliminazione, scheda**

> **Elimino "Spinta e trazione"?**
> Sparisce la scheda, ma gli allenamenti che hai già fatto restano nello storico.
>
> `[ Elimina la scheda ]`  `[ Annulla ]`

Il bottone distruttivo dice **cosa** elimina, non "OK". Il focus iniziale sta su "Annulla". Il bottone distruttivo è in variante `danger` ma non è preselezionato.

**Conferma di eliminazione, serie (con annullamento)**

Nessun dialogo: si elimina subito e si mostra un toast.

> Serie 3 eliminata. `[ Annulla ]`

Regola: si chiede conferma solo quando l'azione **non** è annullabile. Per tutto il resto si fa e si offre "Annulla" per 10 secondi (3.3.4).

**Uscita dall'allenamento in corso**

> **Esci dall'allenamento?**
> Le serie che hai già completato restano salvate. Puoi riprendere da dove sei rimasto.
>
> `[ Esci ]`  `[ Continua ad allenarti ]`

**Bottone disabilitato**

Mai un bottone spento e basta. Accanto, in `text-body-sm` e `text-tertiary`:

> `[ Genera la scheda ]` (disabilitato)
> Manca un dato: quanti giorni a settimana puoi allenarti.

**Campo in errore**

> Inserisci un peso fra 0 e 500 kg.

Non "Valore non valido". Si dice il limite (3.3.3).

---

## 13. Checklist di consegna

Da spuntare prima di considerare una schermata finita.

**Colore**
- [ ] Ogni coppia testo/sfondo verificata a 4.5:1 (o 3:1 per testo grande e componenti), in **entrambi** i temi
- [ ] Nessuna informazione veicolata dal solo colore: c'è sempre icona, forma, tratteggio o testo
- [ ] Nessun valore esadecimale scritto a mano nel codice: solo token semantici
- [ ] Grafici verificati con simulazione deuteranopia e protanopia
- [ ] Tema chiaro provato davvero, non solo generato

**Tipografia**
- [ ] Nessun testo sotto i 12px, corpo base 17px
- [ ] Ogni cifra di dato dentro `.num`
- [ ] Zoom al 200% senza scroll orizzontale
- [ ] Criterio 1.4.12 Text Spacing verificato

**Tocco e layout**
- [ ] Ogni target almeno 44x44, con 8px fra target adiacenti
- [ ] Tutte le azioni primarie sotto i 560px dal bordo superiore
- [ ] Nessun elemento premibile dentro la safe area inferiore
- [ ] Provato a 320px, 390px e 430px
- [ ] Nessun elemento a fuoco finisce sotto la tab bar o sotto il pannello di recupero (2.4.11)

**Interazione**
- [ ] Tutto raggiungibile da tastiera, con focus visibile e ordine corretto
- [ ] Nessuna funzione disponibile solo tramite trascinamento (2.5.7)
- [ ] Nessuna funzione disponibile solo tramite hover
- [ ] Ogni azione distruttiva è annullabile oppure confermata
- [ ] Il timer è pausabile, estendibile e non scade niente da solo (2.2.1)

**Motion**
- [ ] Nessuna transizione oltre 280ms fuori dalle due celebrazioni
- [ ] `prefers-reduced-motion` provato, e l'informazione resta
- [ ] Nessun lampeggio oltre 3 volte al secondo
- [ ] Si animano solo `transform` e `opacity` (più i colori)

**Testi**
- [ ] Si dà del tu, niente motivazionalese, niente colpevolizzazione
- [ ] Ogni errore dice cosa fare
- [ ] Ogni bottone disabilitato ha accanto il motivo
- [ ] Ogni stato vuoto ha almeno un'uscita

**Prestazioni**
- [ ] Font totali sotto i 100 KB
- [ ] Immagini degli esercizi in WebP/AVIF con `aspect-ratio` dichiarato
- [ ] Lista da 876 esercizi virtualizzata, righe ad altezza fissa
- [ ] Nessun layout shift misurabile all'arrivo dei dati
