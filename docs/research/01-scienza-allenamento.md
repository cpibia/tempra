# Scienza dell'allenamento: specifiche operative per il motore di generazione schede

> Documento tecnico di riferimento per la PWA fitness.
> Obiettivo: trasformare la letteratura scientifica (ACSM, NSCA, meta-analisi Schoenfeld / Grgic / Helms / Pelland, modello RP di Israetel) in **numeri, tabelle e pseudocodice** direttamente implementabili.
> Versione 1.0, settembre 2026.

---

## Indice

1. [Premessa e modello dati di base](#1-premessa-e-modello-dati-di-base)
2. [Volume di allenamento (MV, MEV, MAV, MRV)](#2-volume-di-allenamento-mv-mev-mav-mrv)
3. [Intensità e range di ripetizioni](#3-intensita-e-range-di-ripetizioni)
4. [Recupero tra le serie](#4-recupero-tra-le-serie)
5. [Frequenza e split settimanali](#5-frequenza-e-split-settimanali)
6. [Tecniche avanzate di intensificazione](#6-tecniche-avanzate-di-intensificazione)
7. [Progressione del carico (progressive overload)](#7-progressione-del-carico-progressive-overload)
8. [RPE e RIR](#8-rpe-e-rir)
9. [Stima dell'1RM e calcolo del carico di lavoro](#9-stima-dell1rm-e-calcolo-del-carico-di-lavoro)
10. [Warm-up e cool-down](#10-warm-up-e-cool-down)
11. [Periodizzazione](#11-periodizzazione)
12. [Allenamento a casa, corpo libero, bande elastiche](#12-allenamento-a-casa-corpo-libero-bande-elastiche)
13. [Cardio e interferenza](#13-cardio-e-interferenza)
14. [Adattamento della scheda per obiettivo](#14-adattamento-della-scheda-per-obiettivo)
15. [Popolazioni speciali](#15-popolazioni-speciali)
16. [Appendice A: schema JSON completo del motore](#appendice-a-schema-json-completo-del-motore)
17. [Appendice B: pseudocodice del generatore](#appendice-b-pseudocodice-del-generatore)
18. [Bibliografia e fonti](#bibliografia-e-fonti)

---

## 1. Premessa e modello dati di base

### 1.1 Gerarchia delle variabili

L'evidenza attuale indica una gerarchia chiara di importanza delle variabili. Il motore deve rispettarla: se due regole entrano in conflitto, vince quella più in alto.

| Priorità | Variabile | Peso decisionale |
|---|---|---|
| 1 | Aderenza e sostenibilità (giorni disponibili, durata sessione, attrezzatura) | vincolo hard |
| 2 | Volume settimanale per gruppo muscolare (serie allenanti) | driver primario ipertrofia |
| 3 | Prossimità al cedimento (RIR) | driver primario dello stimolo per serie |
| 4 | Intensità di carico (%1RM) | driver primario forza |
| 5 | Progressione nel tempo (overload) | driver del risultato a medio termine |
| 6 | Frequenza | distributore di volume, effetto diretto piccolo |
| 7 | Selezione esercizi e ROM | modulatore |
| 8 | Recupero tra le serie | modulatore (impatta il volume realizzabile) |
| 9 | Tempo / TUT, tecniche avanzate | rifinitura, effetto piccolo |

Riferimenti chiave: la meta-regressione di Pelland et al. (2025, *Sports Medicine*) su 67 studi e 2058 soggetti mostra che il volume guida sia ipertrofia sia forza con **rendimenti decrescenti**, mentre la frequenza, a volume equiparato, ha effetto sostanzialmente nullo sull'ipertrofia e positivo ma piccolo sulla forza ([Sports Medicine](https://link.springer.com/10.1007/s40279-025-02344-w), [PubMed 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/), [SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460)).

### 1.2 Definizioni normalizzate (da usare nel codice)

```json
{
  "serie_allenante": "set portato a RIR <= 4 su un muscolo target; conta 1.0 se il muscolo e' primario (diretto), 0.5 se secondario (indiretto)",
  "volume_settimanale": "somma delle serie allenanti frazionarie per muscolo su 7 giorni",
  "intensita_di_carico": "%1RM",
  "intensita_di_sforzo": "RIR / RPE",
  "1RM": "carico massimale per 1 ripetizione, misurato o stimato",
  "e1RM": "1RM stimato dall'ultima serie registrata (carico + reps + RIR)",
  "mesociclo": "blocco di 3-6 settimane di accumulo + 1 settimana di scarico",
  "macrociclo": "3-4 mesocicli (12-24 settimane)"
}
```

Il conteggio **frazionario** (1.0 diretto, 0.5 indiretto) non è un dettaglio estetico: Pelland et al. hanno mostrato che distinguere serie dirette e indirette è essenziale per una previsione dose-risposta corretta. Esempio: 3 serie di panca piana contano 3.0 per il petto, 1.5 per i tricipiti e 1.5 per il deltoide anteriore.

### 1.3 Classificazione del livello utente

Il motore deve classificare l'utente in modo deterministico, non chiedendogli "sei principiante?".

| Livello | Criteri (tutti o quasi) | Note |
|---|---|---|
| `beginner` | < 6 mesi di allenamento continuativo, oppure stop > 12 mesi; squat < 1.0x peso corporeo; panca < 0.75x | Progressione lineare seduta-per-seduta ancora possibile |
| `intermediate` | 6-24 mesi continuativi; squat 1.0-1.5x BW; panca 0.75-1.1x BW | Progressione settimanale / double progression |
| `advanced` | > 24 mesi continuativi e costanti; squat > 1.5x BW; panca > 1.1x BW | Progressione per mesociclo, periodizzazione necessaria |

```pseudocode
function classifyLevel(user):
    months = user.continuousTrainingMonths
    ratioSq = user.e1RM.squat / user.bodyweight     // null se assente
    ratioBp = user.e1RM.benchPress / user.bodyweight

    if months < 6 or user.monthsSinceLastTraining > 12: return "beginner"
    if months > 24 and (ratioSq == null or ratioSq >= 1.5) and (ratioBp == null or ratioBp >= 1.1):
        return "advanced"
    return "intermediate"
```

---

## 2. Volume di allenamento (MV, MEV, MAV, MRV)

### 2.1 I quattro landmark

Modello di Renaissance Periodization / Israetel, misurato in **serie allenanti settimanali per gruppo muscolare** ([RP Strength](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)):

| Sigla | Nome | Significato operativo |
|---|---|---|
| **MV** | Maintenance Volume | Minimo per NON perdere massa. Circa 6 serie/settimana per muscolo, allenando il muscolo almeno 2 volte/settimana. Usato nelle settimane di scarico, in vacanza, nelle fasi di deficit estremo |
| **MEV** | Minimum Effective Volume | Volume minimo che produce crescita. Punto di partenza del mesociclo |
| **MAV** | Maximum Adaptive Volume | Zona (non un numero) tra MEV e MRV dove la crescita è più rapida. È la zona in cui si progredisce durante il blocco |
| **MRV** | Maximum Recoverable Volume | Tetto oltre il quale il recupero fallisce. Superato cronicamente, la performance cala |

La dose-risposta di Schoenfeld, Ogborn e Krieger (2017) mostra crescita crescente fino a **10+ serie settimanali per gruppo muscolare** ([PubMed 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/)). La meta-regressione 2025 stima circa **+0.24% di ipertrofia per serie aggiuntiva** attorno al volume medio di 12.25 serie frazionarie settimanali, con curva in appiattimento ([SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460)).

### 2.2 Tabella operativa: serie settimanali per gruppo muscolare

Valori in serie allenanti frazionarie/settimana. Colonne `MEV / MAV / MRV`.

| Gruppo muscolare | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Petto | 8 / 10-14 / 16 | 10 / 12-20 / 22 | 12 / 16-22 / 26 |
| Dorso (grandi dorsali + trapezio medio/romboidi) | 10 / 12-16 / 18 | 12 / 14-22 / 25 | 14 / 18-25 / 30 |
| Deltoide anteriore | 0-4 / 4-8 / 10 | 0-6 / 6-10 / 12 | 0-6 / 6-12 / 14 |
| Deltoide laterale | 6 / 8-14 / 16 | 8 / 12-20 / 22 | 10 / 16-24 / 26 |
| Deltoide posteriore | 6 / 6-12 / 14 | 6 / 10-18 / 20 | 8 / 12-20 / 24 |
| Bicipiti | 6 / 8-12 / 14 | 8 / 10-18 / 20 | 8 / 14-20 / 26 |
| Tricipiti | 6 / 8-12 / 14 | 6 / 10-16 / 18 | 8 / 12-18 / 22 |
| Quadricipiti | 8 / 10-14 / 16 | 8 / 12-18 / 20 | 10 / 14-20 / 24 |
| Femorali | 6 / 8-12 / 14 | 6 / 10-16 / 18 | 8 / 12-18 / 20 |
| Glutei | 4 / 6-12 / 14 | 4 / 8-16 / 18 | 6 / 12-18 / 20 |
| Polpacci | 6 / 8-14 / 16 | 8 / 12-16 / 20 | 8 / 14-20 / 25 |
| Addome / core | 0 / 6-12 / 16 | 0 / 8-16 / 20 | 0 / 10-20 / 25 |
| Avambracci | 0 / 2-6 / 8 | 0 / 4-8 / 10 | 0 / 6-12 / 15 |
| Trapezio superiore | 0 / 2-6 / 8 | 0 / 4-10 / 12 | 0 / 6-12 / 16 |

Regole di lettura per il motore:

- Il MEV del deltoide anteriore, dell'addome e degli avambracci è **0** perché il lavoro indiretto (spinte, trazioni, squat, stacchi) lo copre già.
- Per un principiante il MEV effettivo è vicino al MV: partire basso è quasi sempre corretto, perché la risposta è alta e il recupero è il fattore limitante.
- Il **MRV non è un obiettivo**: si allena in MAV e si tocca il MRV solo nell'ultima settimana del mesociclo.

### 2.3 Modificatori del volume per obiettivo

Coefficiente moltiplicativo da applicare ai valori MAV della tabella 2.2.

| Obiettivo | Coefficiente volume | Note |
|---|---|---|
| `ipertrofia` | 1.00 | Riferimento |
| `forza` | 0.70-0.80 sui muscoli non coinvolti nei big lift; 0.90-1.00 sui prime mover | Volume spostato verso serie a bassa rep e alta intensità |
| `dimagrimento` | 0.90-1.00 | Non ridurre il volume in deficit: mantenerlo o aumentarlo protegge la massa magra |
| `resistenza_muscolare` | 1.10-1.30 in serie, ma con carichi bassi | Serie più numerose e più lunghe |
| `salute_generale` | 0.50-0.60 (target 6-10 serie/muscolo) | Sufficiente per benefici di salute |
| `ricomposizione` | 1.00 | Come ipertrofia |
| `tonificazione` | 0.80-1.00 | Sinonimo commerciale di ipertrofia a volume moderato |
| `riabilitazione_leggera` | 0.40-0.60 | Con vincoli di carico e ROM |

Sul dimagrimento: studi su atleti in restrizione calorica mostrano che i programmi con **≥ 10 serie settimanali per muscolo** hanno perdita di massa magra minima o nulla, e che aumentare il volume durante il deficit protegge meglio che ridurlo ([PMC9012799](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9012799/)).

### 2.4 Vincolo per sessione

Il volume per sessione ha rendimenti decrescenti: oltre circa **8-10 serie dirette per gruppo muscolare in una singola seduta** il ritorno marginale è basso. Regola dura per il motore:

```pseudocode
MAX_SETS_PER_MUSCLE_PER_SESSION = {
  beginner: 6,
  intermediate: 9,
  advanced: 12          // solo su muscoli prioritari
}

// Se weeklySets / frequency > MAX_SETS_PER_MUSCLE_PER_SESSION
// -> aumentare la frequenza, oppure tagliare il volume settimanale al massimo distribuibile
requiredFrequency = ceil(weeklySets / MAX_SETS_PER_MUSCLE_PER_SESSION)
```

### 2.5 Algoritmo di allocazione del volume

```pseudocode
function allocateWeeklyVolume(user, goal, daysPerWeek, priorityMuscles):
    level = classifyLevel(user)
    plan = {}

    for muscle in ALL_MUSCLES:
        L = VOLUME_LANDMARKS[muscle][level]         // {mev, mavLow, mavHigh, mrv}
        base = L.mavLow                              // punto di partenza settimana 1
        base = base * GOAL_VOLUME_COEFF[goal]

        if muscle in priorityMuscles: base = base * 1.20
        if user.recoveryScore == "low":  base = base * 0.85     // sonno < 6h, stress alto, eta' > 55
        if user.recoveryScore == "high": base = base * 1.10

        // Vincolo tempo: ogni serie costa ~ (rest + 40s di lavoro)
        base = clamp(base, L.mev, L.mrv)
        plan[muscle] = round(base)

    // Vincolo tempo sessione
    plan = fitToTimeBudget(plan, daysPerWeek, user.minutesPerSession)
    return plan
```

`fitToTimeBudget` taglia in ordine inverso di priorità: prima gli isolamenti dei muscoli piccoli non prioritari (avambracci, trapezio superiore, polpacci), poi i deltoidi posteriori, mai sotto il MEV dei gruppi grandi.

---

## 3. Intensità e range di ripetizioni

### 3.1 Il continuum ripetizioni-adattamento (versione aggiornata)

Il modello classico (1-5 forza, 6-12 ipertrofia, 15+ resistenza) è ancora valido per **forza** e **resistenza**, ma è stato ridimensionato per l'**ipertrofia**: l'ipertrofia è simile su un ampio spettro di carichi **≥ ~30% 1RM**, a patto che le serie leggere siano portate vicino al cedimento ([Schoenfeld & Grgic, Sports 2021, PMC7927075](https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/); [meta-analisi high vs low load, PubMed 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)).

| Obiettivo | %1RM | Ripetizioni | RIR target | Serie per esercizio | Note |
|---|---|---|---|---|---|
| **Forza massimale** | 80-95% (picchi 95-100% in peaking) | 1-6 | 1-3 | 3-6 | Esercizi multiarticolari, tecnica prioritaria |
| **Ipertrofia (core range)** | 65-80% | 6-12 | 0-3 | 3-5 | Zona più efficiente tempo/stimolo |
| **Ipertrofia (range esteso basso)** | 80-85% | 4-6 | 1-2 | 3-5 | Utile su multiarticolari, meno fatica metabolica |
| **Ipertrofia (range esteso alto)** | 30-60% | 15-30 | 0-1 obbligatorio | 2-4 | Utile su isolamenti, articolazioni sensibili, casa |
| **Resistenza muscolare** | 40-60% | 15-30+ | 1-3 | 2-4 | Recuperi brevi |
| **Potenza (movimenti balistici)** | 30-60% | 3-6 | 3-5 (mai cedimento) | 3-6 | Salti, lanci, spinte esplosive |
| **Potenza (derivati olimpici)** | 70-85% | 1-5 | 3-5 | 3-6 | Velocità di esecuzione massima |
| **Salute generale** | 50-70% | 8-15 | 2-4 | 1-3 | ACSM: 8-10 esercizi multiarticolari |

Nota per principianti: l'ACSM raccomanda per il novizio carichi corrispondenti a **8-12 RM**, e per intermedio/avanzato un range più ampio 1-12 RM periodizzato con enfasi sul carico pesante 1-6 RM ([ACSM Position Stand, PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/)). Per l'incremento di forza massimale servono 45-60% 1RM nei non allenati, ma 80-85% 1RM negli esperti.

### 3.2 Tabella rep-%1RM (serie portata a cedimento, RPE 10)

Base: NSCA Training Load Chart ([PDF NSCA](https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf)), con estensione oltre le 12 reps.

| Reps max (RM) | %1RM | Reps max (RM) | %1RM |
|---|---|---|---|
| 1 | 100% | 11 | 72% |
| 2 | 95% | 12 | 70% |
| 3 | 93% | 13 | 68% |
| 4 | 90% | 14 | 66% |
| 5 | 87% | 15 | 65% |
| 6 | 85% | 16 | 63% |
| 7 | 83% | 18 | 60% |
| 8 | 80% | 20 | 58% |
| 9 | 77% | 25 | 53% |
| 10 | 75% | 30 | 48% |

**Avvertenze obbligatorie per il motore:**

1. La tabella vale per serie portate a **cedimento tecnico**. Se si programma con RIR, sottrarre circa **3-4% per ogni RIR** (vedi sezione 8).
2. La relazione è **esercizio-dipendente**: sugli esercizi per gli arti inferiori (squat, leg press) e sugli isolamenti si fanno in media più ripetizioni alla stessa percentuale rispetto alla panca. Applicare un correttivo:

```pseudocode
REP_CAPACITY_MODIFIER = {
  "bench_press": 1.00, "overhead_press": 0.95, "barbell_row": 1.05,
  "back_squat": 1.15, "leg_press": 1.35, "leg_extension": 1.25,
  "deadlift": 0.85, "isolation_upper": 1.15
}
// reps_effettive ~= reps_tabella * modifier
```

3. Sotto il 50% 1RM la tabella diventa inaffidabile: usare direttamente il target RIR.

### 3.3 Prossimità al cedimento: quanto spingere

Meta-regressione di Robinson et al. (2024): l'ipertrofia aumenta avvicinandosi al cedimento ma la curva **si appiattisce oltre i 2 RIR**, mentre i guadagni di forza sono sostanzialmente indipendenti dalla prossimità al cedimento ([PubMed 38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/)).

Regola operativa:

| Contesto | RIR prescritto |
|---|---|
| Multiarticolare pesante, forza | 2-3 |
| Multiarticolare, ipertrofia | 1-2 |
| Isolamento, ipertrofia | 0-1 |
| Serie a carico leggero (< 60% 1RM) | 0 (cedimento obbligatorio) |
| Prima settimana di mesociclo | +1 rispetto al target |
| Ultima settimana di mesociclo (pre-deload) | 0-1 |
| Principiante assoluto (prime 4 settimane) | 3-4 (mai cedimento) |
| Over 60, ipertensione, riabilitazione | 2-4 (mai cedimento, mai Valsalva prolungata) |

---

## 4. Recupero tra le serie

### 4.1 Evidenza

- NSCA (raccomandazioni classiche per obiettivo): forza e potenza **2-5 minuti**, ipertrofia **30-90 secondi**, resistenza muscolare **≤ 30 secondi** ([NSCA Strength & Conditioning Journal](https://journals.lww.com/nsca-scj/Fulltext/2008/06000/A_Brief_Review__How_Much_Rest_between_Sets_.9.aspx)).
- L'evidenza più recente corregge la parte ipertrofia verso l'alto: una meta-analisi bayesiana mostra un beneficio ipertrofico per recuperi **> 60 secondi**, con effetti poco chiari oltre i 90 secondi ([PMC11349676](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11349676/)). Recuperi molto lunghi migliorano modestamente la forza e non danneggiano l'ipertrofia.
- Motivo pratico: il recupero breve riduce le ripetizioni eseguibili nelle serie successive, quindi riduce il volume effettivo. Su multiarticolari pesanti il costo è alto, sugli isolamenti è basso.
- ACSM: 3-5 min per il lavoro pesante 1-6 RM, 1-2 min per la zona 6-12 RM ([ACSM Position Stand](https://pubmed.ncbi.nlm.nih.gov/19204579/)).

### 4.2 Formula deterministica per il recupero consigliato

Il motore calcola un valore in secondi, poi lo arrotonda a step di 15 s e lo espone come **modificabile dall'utente**.

```
rest_s = clamp( round15( BASE[goal] * K_exercise * K_intensity * K_effort * K_level * K_technique ), MIN[goal], MAX[goal] )
```

**BASE per obiettivo (secondi):**

| Obiettivo | BASE | MIN | MAX |
|---|---|---|---|
| `forza` | 210 | 150 | 300 |
| `potenza` | 180 | 120 | 300 |
| `ipertrofia` | 120 | 60 | 240 |
| `ricomposizione` / `tonificazione` | 105 | 45 | 180 |
| `dimagrimento` | 75 | 30 | 150 |
| `resistenza_muscolare` | 45 | 20 | 90 |
| `salute_generale` | 90 | 45 | 150 |
| `riabilitazione_leggera` | 90 | 60 | 180 |

**Coefficienti moltiplicativi:**

| Fattore | Valore | Condizione |
|---|---|---|
| `K_exercise` | 1.40 | Multiarticolare pesante assiale (squat, stacco, front squat, good morning) |
| | 1.20 | Multiarticolare (panca, military press, trazioni, rematore, affondi, dip) |
| | 1.00 | Multiarticolare su macchina (leg press, chest press, lat machine, pulley) |
| | 0.75 | Isolamento monoarticolare (curl, alzate laterali, leg extension, leg curl, croci) |
| | 0.60 | Core / addome, esercizi a corpo libero leggeri |
| `K_intensity` | 1.30 | ≥ 90% 1RM oppure ≤ 3 reps |
| | 1.15 | 80-89% 1RM oppure 4-6 reps |
| | 1.00 | 65-79% 1RM oppure 7-12 reps |
| | 0.85 | 50-64% 1RM oppure 13-20 reps |
| | 0.70 | < 50% 1RM oppure > 20 reps |
| `K_effort` | 1.15 | RIR 0 (cedimento) |
| | 1.05 | RIR 1 |
| | 1.00 | RIR 2-3 |
| | 0.90 | RIR ≥ 4 |
| `K_level` | 1.10 | `advanced` (carichi assoluti più alti, fatica sistemica maggiore) |
| | 1.00 | `intermediate` |
| | 0.90 | `beginner` |
| `K_technique` | vedi sezione 6 | Drop set, rest-pause, superserie, cluster hanno pause interne dedicate |

**Cap di sicurezza sul tempo totale:** se la somma stimata della sessione supera `user.minutesPerSession`, il motore riduce progressivamente le pause degli **isolamenti** (mai sotto il MIN) e solo dopo converte coppie di esercizi antagonisti in superserie; come ultima risorsa taglia serie partendo dai muscoli non prioritari.

### 4.3 Esercizi a tempo (plank, hollow hold, wall sit, isometrie)

Per gli esercizi misurati in secondi la pausa si calcola sul rapporto lavoro/recupero:

| Tipo | Durata serie | Rapporto lavoro:recupero | Pausa risultante |
|---|---|---|---|
| Isometria core breve intensa (hollow hold, plank su un braccio) | 15-30 s | 1 : 2 | 30-60 s |
| Plank / core standard | 30-60 s | 1 : 1 | 30-60 s |
| Isometria di resistenza (wall sit, dead hang) | 45-90 s | 1 : 1.5 | 70-135 s |
| Isometria massimale (overcoming isometrics, 80-100% sforzo) | 6-10 s | 1 : 12 | 90-120 s |
| Stazione di circuito (metcon) | 30-45 s | 1 : 0.5 / 1 : 1 | 15-45 s |

```pseudocode
function restForTimedExercise(durationSeconds, category, goal):
    ratio = { "core_intense": 2.0, "core_standard": 1.0, "endurance_iso": 1.5,
              "max_iso": 12.0, "circuit_station": 0.75 }[category]
    rest = durationSeconds * ratio
    if goal in ["dimagrimento", "resistenza_muscolare"]: rest = rest * 0.7
    return clamp(round15(rest), 15, 180)
```

### 4.4 Esempi di output

| Esercizio | Obiettivo | Reps | RIR | Calcolo | Pausa proposta |
|---|---|---|---|---|---|
| Squat bilanciere | forza | 4 | 2 | 210 x 1.40 x 1.15 x 1.00 x 1.00 | 300 s (cap) |
| Panca piana | ipertrofia | 8 | 1 | 120 x 1.20 x 1.00 x 1.05 x 1.00 | 150 s |
| Curl manubri | ipertrofia | 12 | 0 | 120 x 0.75 x 1.00 x 1.15 x 1.00 | 105 s |
| Alzate laterali | dimagrimento | 15 | 1 | 75 x 0.75 x 0.85 x 1.05 x 1.00 | 45 s |
| Leg press | resistenza | 20 | 2 | 45 x 1.00 x 0.85 x 1.00 x 1.00 | 45 s (arrotondato al MIN utile) |
| Plank 45 s | salute | - | - | 45 x 1.0 | 45 s |

---

## 5. Frequenza e split settimanali

### 5.1 Evidenza sulla frequenza

- Schoenfeld, Grgic & Krieger (2019): allenare un muscolo **almeno 2 volte a settimana** è superiore a 1 volta quando il volume non è equiparato; a volume equiparato la differenza si annulla ([PubMed 30558493](https://pubmed.ncbi.nlm.nih.gov/30558493/)).
- Pelland et al. (2025): a volume equiparato la frequenza ha effetto trascurabile sull'ipertrofia, mentre mostra un effetto positivo con rendimenti decrescenti sulla **forza** ([SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460)).
- ACSM: 2-3 giorni/settimana per il novizio, 3-4 per l'intermedio, 4-5 (fino a 6) per l'avanzato ([ACSM Position Stand](https://pubmed.ncbi.nlm.nih.gov/19204579/)).

**Conclusione per il motore:** la frequenza è una **variabile derivata**, non una scelta estetica. Si sceglie il volume, poi si calcola la frequenza minima necessaria per distribuirlo rispettando il cap per sessione.

| Obiettivo | Frequenza per muscolo | Razionale |
|---|---|---|
| Ipertrofia | 2x (3x se volume alto) | Distribuzione volume |
| Forza | 2-3x sul pattern (squat/panca/stacco) | Pratica tecnica, effetto frequenza su forza |
| Dimagrimento | 2-3x | Massimizza dispendio e mantiene massa |
| Resistenza muscolare | 2-4x | Recupero rapido a carichi bassi |
| Salute generale | 2x | Minimo raccomandato OMS/ACSM |

### 5.2 Split per giorni disponibili

| Giorni | Split consigliato | Alternative | Frequenza per muscolo |
|---|---|---|---|
| 2 | **Full body A/B** | Upper/Lower | 2x |
| 3 | **Full body A/B/C** (beginner) | Upper/Lower/Full, Push/Pull/Legs (1x) | 2-3x |
| 4 | **Upper/Lower x2** | Full body x4 (volume basso per sessione), PPL+Upper | 2x |
| 5 | **Upper/Lower/PPL** oppure PPL + Upper/Lower | Full body x5, Arnold split | 2-2.5x |
| 6 | **PPL x2** | Upper/Lower x3, Arnold split x2 | 2x |

### 5.3 Scheda comparativa degli split

#### Full Body
- **Cos'è:** ogni seduta allena tutti i principali gruppi muscolari, 1-2 esercizi ciascuno.
- **Pro:** frequenza massima per muscolo con pochi giorni; ottimo per principianti (pratica tecnica ripetuta); se si salta una seduta si perde poco; efficiente per il dimagrimento (alto dispendio per sessione).
- **Contro:** volume per muscolo per sessione limitato; sedute lunghe se si vuole volume alto; fatica sistemica accumulata alta con carichi pesanti.
- **A chi:** principianti, 2-3 giorni/settimana, obiettivo salute o dimagrimento, utenti con agenda irregolare.

#### Upper / Lower
- **Cos'è:** alternanza parte superiore e parte inferiore.
- **Pro:** compromesso migliore tra frequenza (2x) e volume per sessione; scala bene da 4 a 6 giorni; recupero locale adeguato.
- **Contro:** le sedute Lower sono impegnative e mal tollerate da chi è poco allenato; con 4 giorni il volume sulle braccia è spesso solo indiretto.
- **A chi:** intermedi, 4 giorni/settimana. È lo split di default consigliato per la maggior parte degli utenti che possono allenarsi 4 volte.

#### Push / Pull / Legs (PPL)
- **Cos'è:** spinta (petto, deltoide anteriore/laterale, tricipiti), tirata (dorso, deltoide posteriore, bicipiti), gambe.
- **Pro:** raggruppamento funzionale ottimo (i sinergici lavorano insieme, meno interferenza); permette volume alto per gruppo; a 6 giorni dà frequenza 2x.
- **Contro:** a 3 giorni la frequenza scende a 1x (subottimale salvo volume molto alto per sessione); richiede costanza su 6 giorni.
- **A chi:** intermedi e avanzati con 5-6 giorni disponibili, obiettivo ipertrofia.

#### Bro Split (un gruppo al giorno)
- **Cos'è:** lunedì petto, martedì dorso, ecc.
- **Pro:** volume molto alto per gruppo in una sessione; sedute corte e focalizzate; psicologicamente gratificante.
- **Contro:** frequenza 1x per muscolo; a volume equiparato non è superiore, ma richiede di comprimere 15-20 serie in una sessione, dove il rendimento marginale crolla; se si salta un giorno, quel muscolo salta la settimana.
- **A chi:** avanzati con volume molto alto e 5-6 giorni; **non** è la scelta di default del motore. Va proposto solo se richiesto esplicitamente dall'utente.

### 5.4 Template di split (dati per il motore)

```json
{
  "splits": [
    { "id": "full_body_2", "days": 2, "sessions": ["FB_A", "FB_B"], "freqPerMuscle": 2,
      "levels": ["beginner","intermediate"], "goals": ["salute_generale","dimagrimento","ipertrofia","forza"] },
    { "id": "full_body_3", "days": 3, "sessions": ["FB_A","FB_B","FB_C"], "freqPerMuscle": 3,
      "levels": ["beginner","intermediate"], "goals": ["*"] },
    { "id": "upper_lower_4", "days": 4, "sessions": ["UPPER_A","LOWER_A","UPPER_B","LOWER_B"], "freqPerMuscle": 2,
      "levels": ["intermediate","advanced"], "goals": ["ipertrofia","forza","ricomposizione"] },
    { "id": "ppl_ul_5", "days": 5, "sessions": ["PUSH","PULL","LEGS","UPPER","LOWER"], "freqPerMuscle": 2,
      "levels": ["intermediate","advanced"], "goals": ["ipertrofia"] },
    { "id": "ppl_6", "days": 6, "sessions": ["PUSH_A","PULL_A","LEGS_A","PUSH_B","PULL_B","LEGS_B"], "freqPerMuscle": 2,
      "levels": ["intermediate","advanced"], "goals": ["ipertrofia","ricomposizione"] },
    { "id": "bro_split_5", "days": 5, "sessions": ["CHEST","BACK","SHOULDERS","ARMS","LEGS"], "freqPerMuscle": 1,
      "levels": ["advanced"], "goals": ["ipertrofia"], "optIn": true }
  ]
}
```

```pseudocode
function selectSplit(daysPerWeek, level, goal, weeklyVolumePlan, userPreference):
    if userPreference and isCompatible(userPreference, daysPerWeek): return userPreference

    candidates = SPLITS.filter(s => s.days == daysPerWeek
                                 && level in s.levels
                                 && (goal in s.goals or "*" in s.goals)
                                 && not s.optIn)
    // Scarta gli split che non riescono a distribuire il volume sotto il cap per sessione
    valid = candidates.filter(s => maxSetsPerSession(weeklyVolumePlan, s) <= MAX_SETS_PER_MUSCLE_PER_SESSION[level])
    return valid.first() or candidates.first()
```

### 5.5 Distribuzione dei giorni nella settimana

```pseudocode
DAY_PATTERNS = {
  2: ["Lun","Gio"],
  3: ["Lun","Mer","Ven"],
  4: ["Lun","Mar","Gio","Ven"],
  5: ["Lun","Mar","Mer","Ven","Sab"],
  6: ["Lun","Mar","Mer","Ven","Sab","Dom"]
}
// Regola: mai due sedute che colpiscono lo stesso muscolo con < 48h di distanza
// se il volume per sessione su quel muscolo supera 6 serie.
```

---

## 6. Tecniche avanzate di intensificazione

### 6.1 Cosa dice l'evidenza, in una riga

Una meta-analisi su soggetti allenati ricreativamente mostra che i metodi avanzati (drop set, rest-pause, cluster, tempo) producono un beneficio **moderato e significativo sulla forza**, mentre sull'ipertrofia l'effetto è **piccolo e non significativo** rispetto alle serie tradizionali a volume ed effort equiparati ([PMC12922048](https://pmc.ncbi.nlm.nih.gov/articles/PMC12922048/)). Rest-pause e drop set producono adattamenti simili alle serie tradizionali ma in **meno tempo** ([PubMed 34260860](https://pubmed.ncbi.nlm.nih.gov/34260860/)).

**Regola di prodotto:** le tecniche avanzate sono strumenti di **efficienza temporale e di varietà**, non moltiplicatori di risultato. Il motore le propone quando il tempo è il vincolo, o come stimolo di novità nelle ultime settimane del mesociclo, mai a un principiante nelle prime 8-12 settimane.

### 6.2 Matrice di ammissibilità

| Tecnica | Beginner | Intermediate | Advanced | Multiartic. pesante | Isolamento | Costo fatica |
|---|---|---|---|---|---|---|
| Piramidale crescente | sì | sì | sì | sì | sì | basso |
| Piramidale decrescente | no | sì | sì | sì | sì | medio |
| Piramidale doppia | no | sì | sì | sì | sì | medio-alto |
| Drop set / stripping | no | sì | sì | sconsigliato | sì | alto (locale) |
| Superserie antagoniste | sì | sì | sì | sì | sì | medio |
| Superserie agoniste | no | sì | sì | no | sì | alto |
| Giant set | no | limitato | sì | no | sì | molto alto |
| Rest-pause | no | sì | sì | solo su macchina | sì | alto |
| Myo-reps | no | sì | sì | no | sì | alto |
| Cluster set | no | sì | sì | sì | raro | basso-medio |
| EMOM | sì (leggero) | sì | sì | sì (tecnico) | sì | variabile |
| AMRAP | no | sì | sì | no | sì | alto |
| Circuit training | sì | sì | sì | limitato | sì | medio |
| Tempo / TUT | sì | sì | sì | sì | sì | medio |

### 6.3 Specifiche parametriche per ciascuna tecnica

#### 6.3.1 Piramidale crescente (ascending pyramid)

- **Cos'è:** il carico sale e le ripetizioni scendono di serie in serie.
- **Quando:** esercizio principale della seduta, obiettivo forza o ipertrofia pesante; funge anche da riscaldamento progressivo integrato.
- **Per chi:** tutti, anche principianti (versione a 3 serie).
- **Parametrizzazione:**

```json
{
  "type": "pyramid_ascending",
  "sets": 4,
  "repsSchedule": [12, 10, 8, 6],
  "loadSchedule": ["70%", "75%", "80%", "85%"],
  "rirSchedule": [3, 2, 1, 1],
  "restSchedule": [90, 120, 150, 180],
  "countedSets": 4,
  "note": "la prima serie puo' essere conteggiata 0.5 se RIR >= 4"
}
```
  Regola generatrice: `load[i] = load[0] + i * step` con `step = 5%` sugli arti superiori e `7%` sugli inferiori; `reps[i] = reps[0] - i * 2`.

#### 6.3.2 Piramidale decrescente (reverse pyramid)

- **Cos'è:** si parte dalla serie più pesante (dopo riscaldamento) e si scende di carico aumentando le reps.
- **Quando:** obiettivo forza-ipertrofia, quando si vuole la massima qualità sulla serie top (energia fresca).
- **Per chi:** intermedi e avanzati. Richiede riscaldamento accurato (rischio infortunio se si va pesanti a freddo).
- **Parametrizzazione:**

```json
{
  "type": "pyramid_descending",
  "sets": 3,
  "repsSchedule": [5, 7, 10],
  "loadSchedule": ["85%", "80%", "72%"],
  "rirSchedule": [1, 1, 0],
  "restSchedule": [180, 150, 120],
  "warmupRequired": true
}
```
  Regola: `load[i+1] = load[i] * (1 - dropPct)` con `dropPct` 0.06-0.10.

#### 6.3.3 Piramidale doppia (piramide + piramide inversa)

- **Cos'è:** si sale fino alla serie più pesante, poi si ridiscende.
- **Quando:** sedute a volume alto su un singolo esercizio principale; utile in blocchi di ipertrofia.
- **Per chi:** intermedi/avanzati con tempo a disposizione (5-7 serie su un esercizio).
- **Parametrizzazione:** `reps: [12, 10, 6, 10, 12]`, `load: [70%, 75%, 85%, 75%, 70%]`, `rest: [90, 120, 180, 120, 90]`.

#### 6.3.4 Drop set / stripping

- **Cos'è:** raggiunto il cedimento (o RIR 0-1), si riduce subito il carico e si continua senza pausa reale.
- **Quando:** ultima serie di un esercizio di isolamento, per estendere lo stimolo in poco tempo. Massimo 1-2 esercizi per seduta.
- **Per chi:** intermedi/avanzati. Da evitare su squat, stacco, panca libera per ragioni di sicurezza.
- **Parametrizzazione:**

```json
{
  "type": "drop_set",
  "topSet": { "reps": 10, "load": "75%", "rir": 0 },
  "drops": 2,
  "loadReductionPct": 20,
  "repsPerDrop": "a cedimento (attese 6-10, poi 4-8)",
  "intraDropRest": 10,
  "restAfter": 180,
  "countedSets": 1.5,
  "maxPerSession": 2
}
```
  Regola: `drops` 1-3; riduzione 15-25% per drop (sulle macchine con pila: 2 placche). Costo tempo: circa 25-40 s in più per serie.

#### 6.3.5 Superserie (antagoniste e agoniste)

- **Cos'è:** due esercizi consecutivi senza pausa (o con pausa minima).
- **Evidenza:** riducono la durata della sessione di circa il **36%** senza compromettere volume, ipertrofia, forza massimale o attivazione; ma aumentano carico interno percepito, danno muscolare e RPE, quindi richiedono più recupero tra le sedute ([Sports Medicine 2025, PMC12011898](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12011898/)).
- **Antagoniste** (es. panca + rematore, curl + push-down): permettono anche **più ripetizioni totali** grazie al preloading dell'antagonista. Sono la variante di default.
- **Agoniste** (es. croci + panca): molto affaticanti, solo per isolamenti.
- **Parametrizzazione:**

```json
{
  "type": "superset",
  "variant": "antagonist",
  "exercises": ["bench_press", "barbell_row"],
  "sets": 3,
  "reps": [10, 10],
  "intraPairRest": 20,
  "restBetweenRounds": 120,
  "countedSets": { "bench_press": 3, "barbell_row": 3 },
  "timeSavingPct": 35
}
```
  Regola per il motore: attivare le superserie quando `stimaDurata > minutesPerSession` oppure quando `goal in ["dimagrimento","resistenza_muscolare"]`. Abbinare solo esercizi con **pattern opposti** (push/pull, quad/hamstring) o **distretti distanti** (gambe/braccia).

#### 6.3.6 Giant set

- **Cos'è:** 3-5 esercizi consecutivi sullo stesso distretto, pausa minima.
- **Quando:** finisher su un gruppo muscolare piccolo (deltoidi, braccia, polpacci) o fase di dimagrimento.
- **Per chi:** avanzati. Molto esigente sul condizionamento.
- **Parametrizzazione:** 3-4 esercizi, 8-15 reps ciascuno, 10-20 s tra esercizi, 150-240 s tra i giri, 2-4 giri, RIR 1-2 sui primi esercizi e 0 sull'ultimo. Conteggio volume: 1.0 per serie ma applicare un fattore 0.8 sull'efficacia delle ultime stazioni per fatica periferica.

#### 6.3.7 Rest-pause

- **Cos'è:** una serie portata vicino al cedimento, poi micro-pause di 15-30 s e mini-serie aggiuntive con lo stesso carico.
- **Evidenza:** produce adattamenti simili alle serie tradizionali in minor tempo, con un modesto vantaggio ipertrofico in alcune analisi ([PubMed 34260860](https://pubmed.ncbi.nlm.nih.gov/34260860/)).
- **Per chi:** intermedi/avanzati; preferibile su macchine e manubri.
- **Parametrizzazione:**

```json
{
  "type": "rest_pause",
  "load": "70-80% 1RM",
  "activationSet": { "reps": "8-12", "rir": 0 },
  "miniSets": 3,
  "intraRest": 20,
  "miniSetReps": "a cedimento (attese 3-5, 2-4, 1-3)",
  "restAfter": 180,
  "countedSets": 2.0
}
```

#### 6.3.8 Myo-reps

- **Cos'è:** variante strutturata del rest-pause: una serie di attivazione a RIR 0-1, poi cluster da 3-5 reps separati da 20-30 s (o 5 respiri profondi), finché non si scende sotto il target di reps.
- **Quando:** massimizzare le "ripetizioni efficaci" in tempo minimo; ideale su isolamenti e macchine.
- **Per chi:** intermedi/avanzati, buona percezione dello sforzo.
- **Parametrizzazione:**

```json
{
  "type": "myo_reps",
  "load": "60-75% 1RM (12-20 RM)",
  "activationSet": { "reps": "12-20", "rir": 0 },
  "clusterReps": 4,
  "intraRest": 25,
  "maxClusters": 5,
  "stopRule": "interrompi quando non riesci a completare clusterReps - 1",
  "restAfter": 180,
  "countedSets": 2.5
}
```

#### 6.3.9 Cluster set

- **Cos'è:** la serie è spezzata in mini-blocchi con pause intra-serie brevi, per mantenere alta la qualità della ripetizione e la velocità della barra.
- **Quando:** forza e potenza; permette più volume ad alta intensità con meno decadimento.
- **Per chi:** intermedi/avanzati, su multiarticolari.
- **Parametrizzazione:**

```json
{
  "type": "cluster_set",
  "load": "85-90% 1RM",
  "structure": "3 cluster x 2 reps",
  "intraClusterRest": 20,
  "setsTotal": 4,
  "restBetweenSets": 240,
  "countedSets": 4,
  "note": "il carico e' 5-10% piu' alto di quello usabile per 6 reps continue"
}
```

#### 6.3.10 EMOM (Every Minute On the Minute)

- **Cos'è:** a ogni minuto si esegue un numero fissato di ripetizioni; il tempo residuo è recupero.
- **Quando:** pratica tecnica ad alto volume (forza), condizionamento, allenamenti a casa, densità.
- **Per chi:** tutti, se il carico e le reps sono tarati bassi.
- **Parametrizzazione:**

```json
{
  "type": "emom",
  "durationMinutes": 10,
  "repsPerMinute": 3,
  "load": "70-80% 1RM",
  "targetWorkTimePerMinute": "<= 30s",
  "rirPerMinute": ">= 4",
  "countedSets": 10 * 0.5,
  "note": "reps per minuto <= 40-50% delle reps massime a quel carico"
}
```

#### 6.3.11 AMRAP (As Many Reps/Rounds As Possible)

- **Cos'è:** massime ripetizioni in una serie, oppure massimi giri di un circuito in un tempo dato.
- **Quando:** test di progressione (AMRAP finale a carico fisso è il modo migliore per misurare l'overload senza test 1RM), condizionamento metabolico.
- **Per chi:** intermedi/avanzati per l'AMRAP su bilanciere; tutti per l'AMRAP a corpo libero.
- **Parametrizzazione:**

```json
{
  "type": "amrap",
  "variant": "set_amrap",
  "load": "fisso (es. 75% 1RM)",
  "position": "ultima serie dell'esercizio",
  "usedFor": "progression_trigger",
  "rule": "se reps >= target_max -> aumenta il carico la sessione successiva"
}
```

#### 6.3.12 Circuit training

- **Cos'è:** stazioni consecutive su distretti diversi, pausa minima, più giri.
- **Quando:** dimagrimento, salute generale, tempo limitato, allenamento a casa, principianti che devono costruire condizionamento.
- **Parametrizzazione:** 5-10 stazioni, 30-45 s di lavoro (o 12-20 reps), 15-30 s tra stazioni, 90-180 s tra i giri, 2-4 giri, carico 40-60% 1RM, RIR 2-3. Rapporti lavoro/recupero efficaci documentati: da 15/45 a 35/25 secondi.

#### 6.3.13 Tempo / TUT

- **Cos'è:** notazione a 4 cifre `eccentrica-pausa_bassa-concentrica-pausa_alta` (es. `3-1-1-0`).
- **Evidenza:** durate della ripetizione tra **0.5 e 8 secondi** producono ipertrofia simile; oltre i 10 s per ripetizione l'effetto è inferiore ([Schoenfeld et al. 2015, PubMed 25601394](https://pubmed.ncbi.nlm.nih.gov/25601394/)). Meta-analisi 2025 confermano effetti banali tra tempi rapidi e lenti.
- **Uso corretto nel motore:** il tempo è uno strumento di **controllo tecnico e di progressione senza carico** (fondamentale a casa e a corpo libero), non un moltiplicatore ipertrofico.
- **Preset:**

| Preset | Notazione | Uso |
|---|---|---|
| `standard` | 2-0-1-0 | Default per tutti gli esercizi con carico |
| `controlled` | 3-1-1-0 | Principianti, apprendimento tecnico, riabilitazione |
| `explosive` | 2-0-X-0 | Forza e potenza (X = massima velocità intenzionale) |
| `tut_hypertrophy` | 3-1-2-1 | Isolamenti, allenamento a casa, carichi bassi |
| `iso_hold` | 3-3-1-0 | Progressione a corpo libero, punti deboli |

Vincolo: `durataRipetizione = e + pb + c + pa` deve restare **≤ 8 s**. Se il preset scelto porta la serie oltre i 60-70 s di TUT con carico ≥ 70% 1RM, ridurre le reps.

### 6.4 Regole di inserimento automatico delle tecniche

```pseudocode
function applyAdvancedTechniques(session, user, week, mesocycleLength):
    if user.level == "beginner" and user.weeksTrained < 12: return session   // nessuna tecnica

    // 1. Vincolo tempo -> superserie antagoniste
    if estimateDuration(session) > user.minutesPerSession * 1.05:
        session = pairAntagonists(session, maxPairs = 3)

    // 2. Intensificazione nelle ultime settimane del mesociclo
    if week >= mesocycleLength - 1:
        candidates = session.exercises.filter(e => e.isIsolation and e.isLastSetOfExercise)
        for e in candidates.take(2):
            e.lastSet.technique = pick(["drop_set", "myo_reps", "rest_pause"], user.preferences)

    // 3. Obiettivo dimagrimento / resistenza -> circuito o superserie
    if user.goal in ["dimagrimento", "resistenza_muscolare"]:
        session = convertToCircuit(session, rounds = 3, workSeconds = 40, transitionSeconds = 20)

    // 4. Obiettivo forza -> cluster sull'esercizio principale, settimane ad alta intensita'
    if user.goal == "forza" and week >= 3:
        session.mainLift.technique = "cluster_set"

    return session
```

---

## 7. Progressione del carico (progressive overload)

### 7.1 Le sei leve di progressione, in ordine di preferenza

| # | Leva | Quando usarla |
|---|---|---|
| 1 | Aumentare le **ripetizioni** a carico fisso | Sempre la prima scelta (double progression) |
| 2 | Aumentare il **carico** | Quando il tetto del rep range è raggiunto su tutte le serie |
| 3 | Aggiungere **serie** | Tra una settimana e l'altra del mesociclo, fino al MRV |
| 4 | Ridurre il **RIR** | Nelle settimane finali del mesociclo |
| 5 | Migliorare **ROM / tecnica / tempo** | A casa, a corpo libero, in riabilitazione |
| 6 | Ridurre le **pause** | Solo per obiettivi di resistenza/densità, mai come default |

Evidenza: progredire per carico o per ripetizioni produce adattamenti equivalenti, purché ci sia sovraccarico progressivo ([PMC9528903](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9528903/)).

### 7.2 Incrementi di carico

ACSM: quando l'utente esegue il carico attuale per **1-2 ripetizioni oltre il target**, incrementare il carico del **2-10%** ([ACSM Position Stand](https://pubmed.ncbi.nlm.nih.gov/19204579/)).

Tabella operativa (incremento consigliato al trigger):

| Distretto / esercizio | Beginner | Intermediate | Advanced | Incremento minimo pratico |
|---|---|---|---|---|
| Arti inferiori multiarticolari (squat, stacco, leg press, hip thrust) | 5-10% (2.5-5 kg) | 2.5-5% (2.5 kg) | 1-2.5% (1.25-2.5 kg) | 2.5 kg (bilanciere), 1 placca (macchina) |
| Arti superiori multiarticolari (panca, military, rematore, trazioni zavorrate) | 2.5-5% (2.5 kg) | 2-2.5% (1.25-2.5 kg) | 1-2% (0.5-1.25 kg) | 1.25 kg (micro-carichi consigliati) |
| Isolamenti superiori (curl, alzate, push-down) | 5-10% (1-2 kg) | 2.5-5% (1-2 kg) | 2.5% (0.5-1 kg) | 0.5-1 kg / 1 placca |
| Isolamenti inferiori (leg curl, leg extension, calf) | 5-10% | 2.5-5% | 2.5% | 1 placca |
| Manubri | step disponibile | step disponibile | step disponibile | 2 kg per coppia (1 kg per manubrio) |

```pseudocode
function loadIncrement(exercise, level, currentLoad, availableIncrements):
    pct = INCREMENT_PCT[exercise.category][level]      // es. 0.025
    raw = currentLoad * pct
    return snapToAvailable(max(raw, MIN_INCREMENT[exercise.equipment]), availableIncrements)
    // availableIncrements dipende dall'attrezzatura: bilanciere (dischi disponibili),
    // manubri (rack a step di 2 kg), macchina a pila (placche), elastici (livelli)
```

### 7.3 Double progression (modello di default)

```
Range prescritto: [repMin, repMax]  (es. 8-12)
1. Esegui tutte le serie al carico corrente.
2. Se TUTTE le serie raggiungono repMax al RIR target -> aumenta il carico e torna a repMin.
3. Altrimenti, obiettivo della sessione successiva: +1 rep su ogni serie che non e' al massimo.
```

Variante **triple progression** (per avanzati): la terza variabile è il numero di serie. Ordine: reps -> carico -> serie.

### 7.4 Linear progression (principianti)

Applicabile solo ai principianti, sui multiarticolari, tipicamente per 8-16 settimane.

```
Ogni sessione: se tutte le serie/reps prescritte sono state completate, aumenta il carico.
Incremento: 2.5 kg upper, 5 kg lower (o 2.5 kg lower dopo le prime 6-8 settimane).
Dopo 2 sessioni fallite consecutive sullo stesso esercizio: deload del 10% e ripartenza.
Dopo 3 deload sullo stesso esercizio: passa a double progression / livello intermedio.
```

### 7.5 Autoregolazione RPE/RIR

Il carico viene aggiustato seduta per seduta in base alla condizione del giorno.

```pseudocode
function autoregulateLoad(prescribedLoad, lastSetRIR, targetRIR):
    delta = lastSetRIR - targetRIR                // >0 = troppo leggero
    if abs(delta) < 1: return prescribedLoad
    adjustPct = clamp(delta * 0.03, -0.12, 0.12)  // ~3% per RIR di scostamento
    return round(prescribedLoad * (1 + adjustPct))
```

Da abbinare al concetto di **RPE stop**: se la prima serie di lavoro arriva a RPE ≥ 9.5 con il carico previsto, ridurre il carico del 5-10% per le serie successive invece di ridurre le reps.

### 7.6 Algoritmo di progressione completo (input: storico, output: prescrizione)

Questo è il cuore del motore. Input: le ultime 1-3 sessioni per quell'esercizio.

```pseudocode
// SessionLog = { date, exerciseId, sets: [{load, reps, rir, completed}], bodyweight }

function nextPrescription(history, prescription, user, context):
    last = history.mostRecent(prescription.exerciseId)
    if last == null:
        return seedPrescription(prescription, user)      // vedi 7.7

    R = prescription.repRange            // [min, max]
    T = prescription.targetRIR
    setsDone = last.sets.filter(s => s.completed)

    // --- Caso 0: dati incompleti o sessione saltata
    if setsDone.length < prescription.sets * 0.6:
        return repeat(prescription, note: "sessione incompleta, ripeti")

    // --- Caso 1: regressione / segnale di fatica
    if allSets(setsDone, s => s.reps < R.min) or last.avgRIR < T - 1.5:
        if context.consecutiveFailures >= 2:
            return { load: prescription.load * 0.90, reps: R.min, note: "deload tecnico -10%" }
        return repeat(prescription, note: "ripeti stesso carico")

    // --- Caso 2: tetto raggiunto su tutte le serie -> aumenta carico
    if allSets(setsDone, s => s.reps >= R.max and s.rir <= T):
        inc = loadIncrement(prescription.exercise, user.level, prescription.load, context.availableIncrements)
        return { load: prescription.load + inc, reps: R.min, targetRIR: T,
                 note: "carico aumentato di " + inc + " kg" }

    // --- Caso 3: molto sotto lo sforzo target -> salto doppio
    if avgRIR(setsDone) >= T + 2 and allSets(setsDone, s => s.reps >= R.max):
        inc = loadIncrement(...) * 2
        return { load: prescription.load + inc, reps: R.min, targetRIR: T,
                 note: "carico troppo leggero, incremento doppio" }

    // --- Caso 4: default -> aggiungi ripetizioni
    targetReps = setsDone.map(s => min(s.reps + 1, R.max))
    return { load: prescription.load, reps: targetReps, targetRIR: T,
             note: "obiettivo: +1 ripetizione per serie" }
```

**Progressione di volume tra le settimane del mesociclo** (livello scheda, non esercizio):

```pseudocode
function weeklyVolumeProgression(muscle, week, landmarks, feedback):
    // feedback: { soreness: 0-3, pump: 0-3, perfDrop: bool, jointPain: bool }
    if week == 1: return landmarks.mavLow
    prev = plan[muscle][week - 1]

    if feedback.perfDrop or feedback.jointPain: return max(prev - 2, landmarks.mev)
    if feedback.soreness >= 3:                  return prev                  // mantieni
    if feedback.soreness <= 1 and feedback.pump <= 1: return min(prev + 2, landmarks.mrv)
    return min(prev + 1, landmarks.mrv)
```

### 7.7 Carico iniziale quando non si conosce l'1RM

```pseudocode
function seedPrescription(exercise, user):
    if user.e1RM[exercise.id] exists:
        return loadFromE1RM(user.e1RM[exercise.id], repRange.mid, targetRIR)

    if exercise.isBodyweightScalable:
        return { variant: easiestVariantFor(user), reps: repRange }

    // Stima da rapporti antropometrici (solo primo giorno, poi si autoregola)
    bw = user.bodyweight
    base = BODYWEIGHT_RATIO[exercise.id][user.level][user.sex] * bw
    return { load: round(base * 0.65), reps: repRange.max, targetRIR: 3,
             mode: "calibration", note: "serie di calibrazione, registra il RIR reale" }
```

Rapporti indicativi di partenza (1RM stimato / peso corporeo), utili come seed prudente:

| Esercizio | Uomo beginner | Uomo intermediate | Donna beginner | Donna intermediate |
|---|---|---|---|---|
| Back squat | 0.75x | 1.25x | 0.50x | 0.90x |
| Panca piana | 0.55x | 0.95x | 0.35x | 0.60x |
| Stacco da terra | 1.00x | 1.50x | 0.60x | 1.10x |
| Military press | 0.40x | 0.65x | 0.25x | 0.40x |
| Rematore bilanciere | 0.55x | 0.90x | 0.35x | 0.60x |

Il motore **non** deve mai prescrivere un carico seed superiore al 65% del valore stimato: il primo micro-ciclo serve a raccogliere dati reali.

### 7.8 Deload

- Gli atleti di forza e fisico inseriscono deload ogni **5.6 ± 2.3 settimane**, di durata **6.4 ± 1.7 giorni** ([Sports Medicine Open, PMC10948666](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10948666/)).
- Approccio consigliato: **ibrido**, cioè deload pianificato ogni 4-8 settimane più deload reattivo al presentarsi dei segnali.

| Livello / obiettivo | Deload pianificato |
|---|---|
| Beginner | ogni 8-12 settimane (spesso non necessario prima) |
| Intermediate, ipertrofia | ogni 5-6 settimane (fine mesociclo) |
| Advanced, ipertrofia | ogni 4-5 settimane |
| Forza, alta intensità | ogni 3-4 settimane |
| Over 60 / recupero limitato | ogni 4 settimane |

**Come si struttura la settimana di scarico:**

| Variante | Volume | Intensità (carico) | RIR | Quando |
|---|---|---|---|---|
| `volume_deload` (default) | 40-60% del volume dell'ultima settimana, ovvero circa MV (6 serie/muscolo) | invariata o -5% | 3-4 | Ipertrofia |
| `intensity_deload` | 60-70% | -20% del carico | 4-5 | Forza, dolori articolari |
| `full_deload` | 50% | -10% | 4-5 | Fatica sistemica alta, sonno scarso |
| `rest_week` | 0-30% | - | - | Solo se segnali di overreaching marcato |

**Trigger reattivo di deload:**

```pseudocode
function needsReactiveDeload(user, last2Weeks):
    score = 0
    if last2Weeks.performanceDropSessions >= 2: score += 2      // calo reps/carico a parita' di RIR
    if user.avgSleepHours < 6:                   score += 1
    if user.jointPainReports >= 2:               score += 2
    if user.persistentSorenessDays >= 4:         score += 1
    if user.motivationScore <= 2:                score += 1
    if user.restingHRDelta >= 7:                 score += 1      // se disponibile da wearable
    return score >= 4
```

---

## 8. RPE e RIR

### 8.1 La scala

Scala RPE specifica per i pesi basata sulle ripetizioni in riserva (Zourdos et al., *NSCA Strength & Conditioning Journal*, 2016 - [PMC4961270](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/)).

| RPE | RIR | Descrizione da mostrare in app |
|---|---|---|
| 10 | 0 | Sforzo massimale, nessuna ripetizione in più possibile |
| 9.5 | 0-1 | Nessuna rep in più, forse un aumento minimo di carico |
| 9 | 1 | Potevo farne ancora una |
| 8.5 | 1-2 | Sicuramente una, forse due |
| 8 | 2 | Potevo farne ancora due |
| 7.5 | 2-3 | Sicuramente due, forse tre |
| 7 | 3 | Potevo farne ancora tre |
| 5-6 | 4-6 | Sforzo moderato, molte ripetizioni in riserva |
| 3-4 | 7+ | Sforzo leggero (riscaldamento) |
| 1-2 | - | Sforzo minimo o nullo |

### 8.2 Mappatura RPE/RIR -> %1RM

Formula operativa (approssimazione lineare, valida per 1-12 reps):

```
repsEquivalenti = repsEseguite + RIR
%1RM = REP_PCT_TABLE[repsEquivalenti]
```

Equivalente rapido: **ogni RIR vale circa 3-4% di 1RM** (usare 3.5% come default nel codice), e circa **1 ripetizione**.

Tabella %1RM per reps x RPE (derivata dalla tabella 3.2, arrotondata all'intero):

| Reps \ RPE | 10 (0 RIR) | 9 (1 RIR) | 8 (2 RIR) | 7 (3 RIR) | 6 (4 RIR) |
|---|---|---|---|---|---|
| 1 | 100 | 96 | 92 | 89 | 86 |
| 2 | 95 | 92 | 89 | 86 | 84 |
| 3 | 93 | 89 | 86 | 84 | 81 |
| 4 | 90 | 86 | 84 | 81 | 79 |
| 5 | 87 | 84 | 81 | 79 | 76 |
| 6 | 85 | 81 | 79 | 76 | 74 |
| 7 | 83 | 79 | 76 | 74 | 71 |
| 8 | 80 | 76 | 74 | 71 | 69 |
| 9 | 77 | 74 | 71 | 69 | 67 |
| 10 | 75 | 71 | 69 | 67 | 65 |
| 12 | 70 | 68 | 66 | 64 | 62 |

```pseudocode
function pctFrom(reps, rir):
    eff = reps + rir
    if eff <= 12: return REP_PCT_TABLE[eff]
    return REP_PCT_TABLE[12] - (eff - 12) * 1.5      // decadimento lineare oltre le 12
```

### 8.3 Come usare RPE/RIR nella UI

1. **Non chiedere RPE ai principianti nelle prime 8-12 settimane**: la stima è inaffidabile finché non si è mai raggiunto il cedimento. Usare invece la domanda binaria "hai completato tutte le ripetizioni con buona tecnica?".
2. Chiedere il RIR **solo sull'ultima serie** di ogni esercizio: riduce l'attrito e basta per l'autoregolazione.
3. Mostrare la scala come **selettore a 5 voci** con etichette in italiano, non come numero:
   `Facile (3+ in riserva)` / `Impegnativa (2)` / `Dura (1)` / `Al limite (0)` / `Non completata`.
4. Registrare sempre carico, reps e RIR: la tripla è ciò che alimenta e1RM e l'algoritmo di progressione.

---

## 9. Stima dell'1RM e calcolo del carico di lavoro

### 9.1 Le formule

`w` = carico sollevato, `r` = ripetizioni eseguite **a cedimento** (se c'è RIR, usare `r_eff = r + RIR`).

| Formula | Equazione | Range di validità | Comportamento |
|---|---|---|---|
| **Epley** | `1RM = w * (1 + r / 30)` | 1-10 reps | Default nella maggior parte dei calcolatori; leggermente più generosa di Brzycki tra 3 e 10 reps |
| **Brzycki** | `1RM = w * 36 / (37 - r)` | 1-10 reps | La più citata nella ricerca; degrada bruscamente sopra le 10 reps (denominatore -> 0 verso r=37) |
| **Lombardi** | `1RM = w * r^0.10` | 1-5 reps (usabile fino a 10) | Stime alte nel range 1-5 |
| **Lander** | `1RM = 100 * w / (101.3 - 2.67123 * r)` | 1-10 reps | Molto vicina a Brzycki |
| **O'Conner** | `1RM = w * (1 + 0.025 * r)` | 1-5 reps | La più conservativa |
| **Wathen** | `1RM = 100 * w / (48.8 + 53.8 * e^(-0.075 * r))` | 1-10 reps | Buon comportamento non lineare |

Confronto: nessuna formula è universalmente più accurata; l'errore tipico è **2-10%** rispetto all'1RM testato e cresce sensibilmente sopra le 10 ripetizioni. La stima più affidabile si ottiene da serie di **1-5 ripetizioni** ([confronto formule](https://arvo.guru/resources/one-rep-max-formulas), [maxcalculator](https://maxcalculator.com/guides/1rm-formulas), [NORMA](https://www.norma-athletics.at/guides/1rm-formulas-explained/)).

### 9.2 Strategia consigliata per il motore: media pesata per range di reps

```pseudocode
function estimate1RM(load, reps, rir = 0):
    r = reps + rir
    if r <= 0: return load
    if r == 1: return load
    if r > 15: r = 15                      // oltre, la stima non e' affidabile: cappiamo

    epley    = load * (1 + r / 30)
    brzycki  = load * 36 / (37 - r)
    lombardi = load * pow(r, 0.10)
    lander   = 100 * load / (101.3 - 2.67123 * r)
    oconner  = load * (1 + 0.025 * r)
    wathen   = 100 * load / (48.8 + 53.8 * exp(-0.075 * r))

    if r <= 5:
        // range piu' affidabile: media di Epley, Brzycki, Lander, Wathen
        est = mean([epley, brzycki, lander, wathen])
        confidence = "alta"
    else if r <= 10:
        est = mean([epley, brzycki, wathen])
        confidence = "media"
    else:
        est = epley                        // Brzycki diventa instabile, Epley regge meglio
        confidence = "bassa"

    return { value: round(est, 0.5), confidence: confidence, repsUsed: r }
```

**Regole aggiuntive:**

- Non aggiornare l'e1RM verso il basso a causa di una singola sessione scarsa: usare il **massimo degli ultimi 21 giorni**, o una media mobile esponenziale con alpha 0.3.
- Ricalcolare l'e1RM solo da serie con `RIR <= 3`; serie facili non informano.
- Esporre sempre l'e1RM come **stima**, non come massimale reale, e non spingere l'utente a testare l'1RM (rischio/beneficio sfavorevole per un utente amatoriale).

### 9.3 Formula inversa: dal 1RM al carico di lavoro

```pseudocode
// Epley invertita (default per il calcolo del carico)
function loadFor(e1RM, targetReps, targetRIR = 0):
    r = targetReps + targetRIR
    load = e1RM / (1 + r / 30)
    return roundToEquipment(load, equipmentIncrement)

// Brzycki invertita (alternativa, piu' conservativa sopra le 8 reps)
function loadForBrzycki(e1RM, targetReps, targetRIR = 0):
    r = targetReps + targetRIR
    return e1RM * (37 - r) / 36
```

Arrotondamento all'attrezzatura disponibile:

```pseudocode
function roundToEquipment(load, equipment):
    switch equipment:
        case "barbell":       return roundToNearest(load, 2.5, minimum = barWeight)  // dischi 1.25 kg/lato
        case "barbell_micro": return roundToNearest(load, 1.0, minimum = barWeight)
        case "dumbbell_pair": return roundToNearest(load, 2.0)     // step 1 kg per manubrio
        case "machine_stack": return roundDownToNearest(load, stackIncrement)   // mai arrotondare in su
        case "plate_loaded":  return roundToNearest(load, 2.5)
        case "kettlebell":    return snapTo(load, [8,12,16,20,24,28,32])
        case "band":          return snapToBandLevel(load)
```

Regola di sicurezza: sulle macchine a pila si arrotonda sempre **per difetto**; su bilanciere si arrotonda per difetto se `targetRIR <= 1`.

### 9.4 Calcolo del volume-carico (per statistiche e grafici)

```
tonnellaggio_serie = carico * ripetizioni
tonnellaggio_sessione = somma dei tonnellaggi delle serie
volume_relativo = somma( ripetizioni * %1RM ) -> preferibile per confrontare fasi diverse
```

Per gli esercizi a corpo libero, il carico da usare nel tonnellaggio è la **frazione di peso corporeo mobilizzata**:

| Esercizio | Frazione del peso corporeo |
|---|---|
| Push-up standard | 0.64 |
| Push-up mani rialzate (30 cm) | 0.55 |
| Push-up piedi rialzati | 0.74 |
| Trazione / chin-up | 1.00 |
| Dip alle parallele | 1.00 |
| Squat a corpo libero | 0.70 |
| Affondo / split squat | 0.85 (gamba anteriore) |
| Bulgarian split squat | 0.90 |
| Hip thrust a corpo libero | 0.45 |
| Nordic curl (eccentrica) | 0.60 |

---

## 10. Warm-up e cool-down

### 10.1 Struttura del riscaldamento

| Fase | Durata | Contenuto | Obbligatoria |
|---|---|---|---|
| 1. Generale (RAMP: Raise) | 5-8 min | Cardio leggero (cyclette, tapis, corda, camminata veloce) a 50-60% HRmax fino a leggera sudorazione | sì |
| 2. Mobilità / attivazione | 3-6 min | Stretching **dinamico** e attivazione specifica dei distretti coinvolti (band pull-apart, glute bridge, cat-cow, rotazioni anche/spalle) | sì |
| 3. Specifica (ramp sets) | 4-10 min | Serie di avvicinamento sul primo esercizio pesante di ogni pattern | sì se carico ≥ 70% 1RM |
| 4. Potenziamento (opzionale) | 1-2 min | 2-3 salti o lanci leggeri prima del lavoro di forza/potenza | no |

### 10.2 Serie di riscaldamento specifiche: protocollo deterministico

```pseudocode
function warmupSets(workingLoad, e1RM, exercise, user):
    pct = workingLoad / e1RM
    barOnly = exercise.equipment == "barbell"
    sets = []

    if pct < 0.55:                                    // carico leggero
        sets = [ {load: 0.50 * workingLoad, reps: 10, rest: 45} ]
    else if pct < 0.70:
        sets = [ {load: 0.40 * workingLoad, reps: 10, rest: 45},
                 {load: 0.70 * workingLoad, reps: 6,  rest: 60} ]
    else if pct < 0.85:
        sets = [ {load: 0.40 * workingLoad, reps: 8, rest: 45},
                 {load: 0.60 * workingLoad, reps: 5, rest: 60},
                 {load: 0.80 * workingLoad, reps: 3, rest: 90} ]
    else:                                             // carico pesante
        sets = [ {load: 0.40 * workingLoad, reps: 8, rest: 45},
                 {load: 0.60 * workingLoad, reps: 5, rest: 60},
                 {load: 0.75 * workingLoad, reps: 3, rest: 90},
                 {load: 0.88 * workingLoad, reps: 1, rest: 120} ]

    if barOnly: sets.prepend({load: barWeight, reps: 10, rest: 30})
    // Solo il PRIMO esercizio di ogni pattern di movimento ha il warm-up completo:
    // gli esercizi successivi sullo stesso pattern usano 0-1 serie di avvicinamento.
    if not exercise.isFirstOfPattern: sets = sets.takeLast(1)
    return sets
```

**Le serie di riscaldamento NON contano nel volume settimanale** (RIR ≥ 5).

### 10.3 Stretching statico: quando sì e quando no

- Meta-analisi su 104 studi: lo stretching statico **prima** dell'allenamento riduce la forza massimale di circa **5.4%** e la potenza di circa **1.9%**, indipendentemente da età, sesso e livello ([Simic et al., meta-analisi](https://www.researchgate.net/publication/221816221_Does_pre-exercise_static_stretching_inhibit_maximal_muscular_performance_A_meta-analytical_review); vedi anche [PMC6895680](https://pmc.ncbi.nlm.nih.gov/articles/PMC6895680/)).
- Il decremento è però legato a durate **lunghe** (> 60 s per muscolo). Durate brevi (< 30-45 s) inserite in un riscaldamento che prosegue con lavoro dinamico hanno effetto trascurabile.

| Momento | Tipo | Durata | Regola per il motore |
|---|---|---|---|
| Pre-allenamento | Dinamico | 5-10 ripetizioni per movimento, 5-8 min | Default sempre |
| Pre-allenamento | Statico | solo se serve un ROM specifico, ≤ 30 s per muscolo, seguito da attivazione dinamica | Solo su flag `mobilityLimitation` |
| Post-allenamento | Statico | 20-30 s per muscolo, 2-3 serie, 5-10 min totali | Opzionale, proposto di default |
| Post-allenamento | Cardio leggero | 3-5 min a 50-60% HRmax | Opzionale |

### 10.4 Cool-down

```json
{
  "cooldown": {
    "durationMinutes": 5-10,
    "blocks": [
      { "type": "aerobic_lowintensity", "minutes": 3, "intensity": "50-60% HRmax", "optional": true },
      { "type": "static_stretch", "holdSeconds": 30, "setsPerMuscle": 2,
        "muscles": "derivati dai gruppi allenati nella sessione" },
      { "type": "breathing", "minutes": 2, "pattern": "4-6 (inspira 4s, espira 6s)", "optional": true }
    ],
    "note": "il cool-down non riduce il DOMS in modo clinicamente rilevante; va proposto per mobilita' e per il rituale di chiusura, non promesso come rimedio ai dolori"
  }
}
```

---

## 11. Periodizzazione

### 11.1 Cosa dice l'evidenza

- Programmi periodizzati battono programmi non periodizzati, ma **lineare e ondulatoria (DUP) sono sostanzialmente equivalenti**: la meta-analisi su ipertrofia riporta una differenza standardizzata di **-0.02** tra i due modelli, cioè nulla ([PeerJ 3695](https://peerj.com/articles/3695/), [PubMed 28848690](https://pubmed.ncbi.nlm.nih.gov/28848690/)).
- Harries et al.: nessuna differenza su forza degli arti superiori o inferiori tra lineare e ondulatoria in allenati e non allenati.
- Anche soggetti allenati ottengono buoni risultati con approccio non periodizzato **se c'è sovraccarico progressivo adeguato** ([PMC6351492](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6351492/)).

**Conseguenza per il prodotto:** la periodizzazione serve soprattutto a (a) gestire la fatica, (b) garantire varietà, (c) dare una struttura narrativa comprensibile all'utente. Non serve complicarla.

### 11.2 I tre modelli

| Modello | Struttura | Pro | Contro | A chi |
|---|---|---|---|---|
| **Lineare** | Volume decrescente e intensità crescente nel corso di 8-12 settimane (es. 4x12 -> 4x10 -> 4x8 -> 4x6 -> 5x4) | Semplicissimo da capire e da implementare; ottimo per preparare un test | Poca varietà; le qualità non allenate regrediscono; poco adatto oltre le 12 settimane | Principianti, obiettivo forza con scadenza |
| **Ondulatoria giornaliera (DUP)** | Ogni seduta della settimana ha un profilo diverso (es. Lun pesante 5x5 @85%, Mer medio 4x8 @75%, Ven leggero 3x12 @65%) | Allena tutte le qualità in parallelo; varietà alta; ottima aderenza | Richiede più esercizi e più gestione dei carichi; meno intuitiva | Intermedi e avanzati, obiettivo misto forza/ipertrofia |
| **A blocchi** | Blocchi consecutivi specializzati: accumulo (volume alto, 65-75%) -> trasmutazione/intensificazione (75-87%) -> realizzazione/peaking (85-95%, volume basso) | Massima specializzazione; ideale per arrivare in picco a una data | Richiede 12+ settimane e disciplina; sovra-ingegnerizzato per l'amatore | Avanzati, atleti con gara |

### 11.3 Mesociclo standard per utente amatoriale (default del motore)

Struttura **4+1** o **5+1** (accumulo + scarico):

| Settimana | Volume (serie/muscolo) | RIR target | Intensità | Note |
|---|---|---|---|---|
| 1 | MEV (es. 12) | 3 | riferimento | Settimana di "inserimento", tecnica |
| 2 | +2 (14) | 2 | +2.5% | |
| 3 | +2 (16) | 1-2 | +2.5% | |
| 4 | +2 (18) | 1 | +2.5% | Vicino a MRV |
| 5 | +2 (20) | 0-1 | invariata | Solo per `advanced`; qui si inseriscono le tecniche di intensificazione |
| 6 (deload) | ~6 (MV) | 4 | -10% | Reset fatica |

Il progetto RP documenta esattamente questa progressione esempio: 12 -> 14 -> 16 -> 18 -> 20 serie, poi 6 in deload ([RP Strength](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)).

### 11.4 Macrociclo 12 settimane (esempio generabile)

| Blocco | Settimane | Focus | Rep range prevalente | %1RM | Volume |
|---|---|---|---|---|---|
| Mesociclo 1 - Accumulo | 1-5 (+1 deload) | Ipertrofia, base | 8-15 | 65-75% | alto |
| Mesociclo 2 - Intensificazione | 7-11 (+1 deload) | Forza-ipertrofia | 5-10 | 75-85% | medio |
| Mesociclo 3 - Realizzazione | 13-16 | Forza / test | 3-6 | 82-92% | basso |

Se l'obiettivo è puramente ipertrofia, il motore ripete mesocicli di accumulo cambiando **esercizi** (varianti dello stesso pattern) invece di cambiare range di ripetizioni: la novità dell'esercizio è uno stimolo efficace e mantiene alta l'aderenza.

### 11.5 Modello DUP: matrice settimanale

```json
{
  "dup_3day": {
    "Lun": { "focus": "forza",      "sets": 5, "reps": [3,5],   "pctRange": [82,88], "rir": 2, "rest": 210 },
    "Mer": { "focus": "ipertrofia", "sets": 4, "reps": [8,10],  "pctRange": [72,78], "rir": 1, "rest": 120 },
    "Ven": { "focus": "metabolico", "sets": 3, "reps": [12,15], "pctRange": [62,68], "rir": 0, "rest": 75 }
  },
  "dup_4day_upperlower": {
    "Lun": { "session": "UPPER", "focus": "forza" },
    "Mar": { "session": "LOWER", "focus": "forza" },
    "Gio": { "session": "UPPER", "focus": "ipertrofia" },
    "Ven": { "session": "LOWER", "focus": "ipertrofia" }
  }
}
```

### 11.6 Pseudocodice del pianificatore di mesociclo

```pseudocode
function buildMesocycle(user, goal, weeks = 5, deloadWeek = true):
    landmarks = VOLUME_LANDMARKS[user.level]
    plan = []
    for w in 1..weeks:
        volumeFactor = 1 + (w - 1) * 0.12                 // ~ +2 serie/settimana
        rirTarget    = max(3 - (w - 1) * 0.75, 0)         // 3 -> 0
        loadFactor   = 1 + (w - 1) * 0.025                // +2.5% a settimana
        plan.push(buildWeek(user, goal, volumeFactor, rirTarget, loadFactor, w))
    if deloadWeek:
        plan.push(buildDeloadWeek(user, variant = selectDeloadVariant(user)))
    return plan
```

---

## 12. Allenamento a casa, corpo libero, bande elastiche

### 12.1 Il problema e la soluzione

Senza carico misurabile non si può applicare la double progression classica. La soluzione è sostituire la variabile "carico" con una **scala ordinale di difficoltà dell'esercizio** (livelli di leva) e usare reps, tempo e stabilità come variabili continue.

I principi restano identici: mechanical tension + prossimità al cedimento. La ricerca su calisthenics mostra ipertrofia e forza comparabili quando volume e intensità di sforzo sono equiparati; la differenza è la difficoltà a mantenere il sovraccarico progressivo sul lungo periodo, soprattutto sugli arti inferiori ([PMC9528903](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9528903/)).

### 12.2 Le otto leve di progressione senza pesi, in ordine

| # | Leva | Come si quantifica | Incremento tipico |
|---|---|---|---|
| 1 | Ripetizioni | numero | +1-2 per serie |
| 2 | Serie | numero | +1 serie/settimana |
| 3 | Tempo / TUT | notazione tempo | 2-0-1-0 -> 3-1-2-0 -> 4-2-2-1 |
| 4 | ROM | cm / angolo | push-up su rialzo -> a terra -> su maniglie (ROM esteso) |
| 5 | Leva (posizione del corpo) | livello di difficoltà | salto di livello nella scala |
| 6 | Unilateralità | bilaterale -> assistito -> unilaterale | -50% di base assistita a ogni step |
| 7 | Pause isometriche | secondi | +1-2 s nel punto difficile |
| 8 | Carico esterno | zaino, gilet, elastici | +1-2.5 kg |

**Regola di transizione di livello:** si sale di livello quando si eseguono **3 serie da `repMax` con RIR ≤ 1 e tecnica pulita in 2 sessioni consecutive**. Scendendo di livello, si riparte da `repMin`.

### 12.3 Scale di progressione (dati per il motore)

```json
{
  "progressions": {
    "horizontal_push": [
      { "lvl": 1, "id": "wall_pushup",             "reps": [12,20] },
      { "lvl": 2, "id": "incline_pushup_high",     "reps": [10,20] },
      { "lvl": 3, "id": "incline_pushup_low",      "reps": [10,18] },
      { "lvl": 4, "id": "knee_pushup",             "reps": [10,18] },
      { "lvl": 5, "id": "pushup",                  "reps": [8,15]  },
      { "lvl": 6, "id": "diamond_pushup",          "reps": [8,15]  },
      { "lvl": 7, "id": "decline_pushup",          "reps": [8,15]  },
      { "lvl": 8, "id": "archer_pushup",           "reps": [5,12]  },
      { "lvl": 9, "id": "pseudo_planche_pushup",   "reps": [5,12]  },
      { "lvl": 10,"id": "one_arm_pushup_assisted", "reps": [3,8]   },
      { "lvl": 11,"id": "one_arm_pushup",          "reps": [3,8]   }
    ],
    "vertical_pull": [
      { "lvl": 1, "id": "band_lat_pulldown",   "reps": [12,20] },
      { "lvl": 2, "id": "australian_row_high", "reps": [10,20] },
      { "lvl": 3, "id": "australian_row_low",  "reps": [8,15]  },
      { "lvl": 4, "id": "negative_pullup",     "reps": [4,8], "tempo": "5-0-X-0" },
      { "lvl": 5, "id": "band_assisted_pullup","reps": [6,12] },
      { "lvl": 6, "id": "pullup",              "reps": [5,12] },
      { "lvl": 7, "id": "weighted_pullup",     "reps": [5,10] },
      { "lvl": 8, "id": "archer_pullup",       "reps": [3,8]  },
      { "lvl": 9, "id": "one_arm_pullup_assisted","reps": [2,6] }
    ],
    "squat_pattern": [
      { "lvl": 1, "id": "box_squat_high",      "reps": [12,20] },
      { "lvl": 2, "id": "bodyweight_squat",    "reps": [15,25] },
      { "lvl": 3, "id": "split_squat",         "reps": [10,20] },
      { "lvl": 4, "id": "bulgarian_split_squat","reps": [8,15] },
      { "lvl": 5, "id": "step_up_high",        "reps": [8,15]  },
      { "lvl": 6, "id": "assisted_pistol_squat","reps": [5,12] },
      { "lvl": 7, "id": "shrimp_squat",        "reps": [4,10]  },
      { "lvl": 8, "id": "pistol_squat",        "reps": [3,10]  }
    ],
    "hip_hinge": [
      { "lvl": 1, "id": "glute_bridge",        "reps": [15,25] },
      { "lvl": 2, "id": "single_leg_glute_bridge", "reps": [10,20] },
      { "lvl": 3, "id": "hip_thrust_bench",    "reps": [12,20] },
      { "lvl": 4, "id": "single_leg_rdl_bw",   "reps": [10,15] },
      { "lvl": 5, "id": "band_rdl",            "reps": [10,20] },
      { "lvl": 6, "id": "nordic_curl_assisted","reps": [4,10], "tempo": "5-0-X-0" },
      { "lvl": 7, "id": "nordic_curl",         "reps": [3,8]   }
    ],
    "vertical_push": [
      { "lvl": 1, "id": "band_overhead_press", "reps": [12,20] },
      { "lvl": 2, "id": "pike_pushup_elevated_feet_low", "reps": [8,15] },
      { "lvl": 3, "id": "pike_pushup",         "reps": [8,15]  },
      { "lvl": 4, "id": "elevated_pike_pushup","reps": [6,12]  },
      { "lvl": 5, "id": "wall_handstand_pushup_partial", "reps": [4,10] },
      { "lvl": 6, "id": "wall_handstand_pushup","reps": [3,10] }
    ],
    "core_antiextension": [
      { "lvl": 1, "id": "dead_bug",            "reps": [8,15]  },
      { "lvl": 2, "id": "plank",               "seconds": [20,60] },
      { "lvl": 3, "id": "plank_reach",         "seconds": [20,45] },
      { "lvl": 4, "id": "hollow_hold",         "seconds": [15,45] },
      { "lvl": 5, "id": "ab_wheel_kneeling",   "reps": [5,15]  },
      { "lvl": 6, "id": "ab_wheel_standing",   "reps": [3,10]  }
    ]
  }
}
```

### 12.4 Volume a corpo libero

Poiché la resistenza per ripetizione è più bassa, per pareggiare lo stimolo servono:

- **Reps più alte:** target 8-25 per serie, con obbligo di **RIR 0-1** (sotto il 60% 1RM equivalente il cedimento è necessario per l'ipertrofia).
- **Serie leggermente più numerose:** +10-20% rispetto al volume della tabella 2.2 sui muscoli dove non si riesce a raggiungere una leva sufficientemente difficile (tipicamente quadricipiti, femorali, dorso nella fase iniziale).
- **Pause più brevi** (45-90 s) perché la fatica sistemica è minore.

### 12.5 Bande elastiche

- La banda fornisce **resistenza ascendente** (massima nel punto di massimo allungamento, cioè spesso nel punto meccanicamente più forte): abbina bene con esercizi dove la curva di forza è ascendente (spinte, estensioni), male dove è discendente.
- Quantificazione della resistenza: assegnare a ogni banda un **valore nominale in kg a un allungamento standard (100% e 200% della lunghezza a riposo)**, e trattare il cambio di banda come uno step di carico.

```json
{
  "bands": [
    { "id": "XS", "color": "giallo", "kgAt100": 2,  "kgAt200": 5  },
    { "id": "S",  "color": "rosso",  "kgAt100": 5,  "kgAt200": 11 },
    { "id": "M",  "color": "nero",   "kgAt100": 9,  "kgAt200": 20 },
    { "id": "L",  "color": "viola",  "kgAt100": 16, "kgAt200": 32 },
    { "id": "XL", "color": "verde",  "kgAt100": 23, "kgAt200": 45 }
  ],
  "progressionOrder": ["reps", "tempo", "band_step_position", "band_double", "band_next_level"],
  "note": "band_step_position = accorciare la banda salendoci sopra con i piedi o avvolgendola; equivale a +15-30% di tensione"
}
```

### 12.6 Regole di progressione senza carico misurabile

```pseudocode
function progressBodyweight(history, prescription):
    last = history.mostRecent(prescription.exerciseId)
    lvlScale = PROGRESSIONS[prescription.pattern]
    cur = lvlScale.find(prescription.level)

    allSetsAtMax = last.sets.every(s => s.reps >= cur.reps.max and s.rir <= 1)

    if allSetsAtMax and history.consecutiveMaxSessions >= 2:
        next = lvlScale.next(cur)
        if next: return { level: next.lvl, exerciseId: next.id, reps: next.reps.min, note: "livello aumentato" }
        // nessun livello superiore: passa a carico esterno o a tempo
        return { exerciseId: cur.id, addedLoadKg: prescription.addedLoadKg + 2.5,
                 reps: cur.reps.min, note: "aggiunto carico esterno" }

    if last.sets.every(s => s.reps < cur.reps.min):
        prev = lvlScale.previous(cur)
        if prev: return { level: prev.lvl, exerciseId: prev.id, reps: prev.reps.max, note: "livello ridotto" }
        return { tempoPreset: "controlled", reps: cur.reps.min, note: "usa tempo controllato e ROM ridotto" }

    return { exerciseId: cur.id, reps: last.sets.map(s => min(s.reps + 1, cur.reps.max)) }
```

---

## 13. Cardio e interferenza

### 13.1 Volumi di riferimento

Linee guida ACSM / OMS per adulti sani: **150-300 minuti/settimana** di attività aerobica a intensità moderata, **oppure 75-150 minuti** a intensità vigorosa, oppure una combinazione equivalente, più 2 sedute settimanali di rinforzo muscolare ([ACSM Physical Activity Guidelines](https://acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines/)).

### 13.2 Frequenza cardiaca massima e zone

**Stima di HRmax** (il motore deve usare Tanaka, più accurata della formula 220-età soprattutto sopra i 40 anni):

```
HRmax (Tanaka) = 208 - 0.7 * eta
HRmax (Fox, legacy) = 220 - eta
HRR (riserva) = HRmax - HRrest
FC target (Karvonen) = HRrest + intensita% * (HRmax - HRrest)
```

**Zone (percentuale di HRmax e di HRR):**

| Zona | %HRmax | %HRR | RPE 1-10 | Substrato / effetto | Uso |
|---|---|---|---|---|---|
| Z1 Recupero | 50-60% | 30-40% | 2-3 | Recupero attivo, ricircolo | Cool-down, giorni off |
| Z2 Fondo / LISS | 60-70% | 40-55% | 3-4 | Ossidazione lipidica massima, base aerobica | Dimagrimento, salute, volume alto |
| Z3 Aerobico moderato | 70-80% | 55-70% | 5-6 | Soglia aerobica | Condizionamento generale |
| Z4 Soglia | 80-90% | 70-85% | 7-8 | Soglia lattacida | Performance, HIIT moderato |
| Z5 VO2max | 90-100% | 85-100% | 9-10 | Potenza aerobica | Intervalli brevi HIIT |

Nota: l'ACSM considera "vigorosa" un'intensità ≥ 77% HRmax (≥ 60% HRR); "moderata" 64-76% HRmax (40-59% HRR). Per soggetti decondizionati miglioramenti si ottengono già a **40-49% HRR / 55-64% HRmax**.

### 13.3 Protocolli

| Protocollo | Struttura | Durata totale | Zona | Frequenza | Note |
|---|---|---|---|---|---|
| **LISS** | Continuo, costante | 30-60 min | Z2 | 2-5x/sett | Bassissimo impatto sul recupero dai pesi; cyclette e camminata in pendenza sono le modalità meno interferenti |
| **MISS** | Continuo moderato | 25-40 min | Z3 | 2-3x/sett | |
| **HIIT lungo (Norvegese 4x4)** | 4 x 4 min in Z4-Z5, 3 min recupero attivo Z1-Z2 | ~35 min | Z4-Z5 | 1-2x/sett | Massimo effetto su VO2max |
| **HIIT medio** | 8-12 x 1 min Z5, 1 min recupero | 20-25 min | Z5 | 1-2x/sett | |
| **SIT (sprint interval)** | 4-8 x 20-30 s all-out, 2-4 min recupero | 15-20 min | max | 1x/sett | Alto costo di recupero, interferisce con le gambe |
| **Tabata** | 8 x 20 s lavoro / 10 s recupero | 4 min + warm-up | Z5 | 1x/sett | Solo come finisher, mai su gambe il giorno prima di squat |

### 13.4 Effetto interferenza: regole operative

Evidenza sintetica:
- L'interferenza è significativa quando forza e aerobico sono nella **stessa sessione a meno di 20 minuti di distanza**, e non è significativa quando le due sedute sono separate da **almeno 3 ore** ([PMC5752732](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5752732/)).
- La meta-analisi di Wilson et al. (2012) indica che l'interferenza cresce con **frequenza, durata e modalità** dell'endurance, ed è massima con la corsa ([PubMed 22002517](https://pubmed.ncbi.nlm.nih.gov/22002517/)).
- Le analisi più recenti ridimensionano il fenomeno: nessuna interferenza rilevante su forza nei non allenati, né negli allenati che separano le sedute.

**Regole hard per il motore:**

```pseudocode
CARDIO_RULES = {
  separationHoursIdeal: 6,
  separationHoursMin: 3,
  orderIfSameSession: "resistance_first"  // se l'obiettivo primario e' forza/ipertrofia
                                          // "cardio_first" solo se l'obiettivo primario e' la performance aerobica
  modalityPreference: ["cycling", "incline_walk", "elliptical", "rowing", "running"],
  avoidBefore: { "leg_day": ["running", "SIT", "HIIT_lower"], hours: 24 }
}

function cardioBudget(goal, level, daysAvailable):
    switch goal:
        case "dimagrimento":        return { minWeekly: 150, maxWeekly: 300, hiitSessions: 1-2, lissSessions: 2-4 }
        case "salute_generale":     return { minWeekly: 150, maxWeekly: 300, hiitSessions: 0-1, lissSessions: 2-4 }
        case "resistenza":          return { minWeekly: 180, maxWeekly: 420, hiitSessions: 2,   lissSessions: 3-5 }
        case "ipertrofia":          return { minWeekly: 60,  maxWeekly: 150, hiitSessions: 0-1, lissSessions: 2-3 }
        case "forza":               return { minWeekly: 45,  maxWeekly: 120, hiitSessions: 0,   lissSessions: 2 }
        case "ricomposizione":      return { minWeekly: 90,  maxWeekly: 200, hiitSessions: 1,   lissSessions: 2-3 }
```

**Vincoli aggiuntivi quando l'obiettivo primario è ipertrofia o forza:**

1. Mai più di **2 sessioni HIIT/settimana**.
2. Mai cardio ad alta intensità sugli arti inferiori nelle **24 h precedenti** una seduta gambe pesante.
3. Preferire modalità a basso impatto eccentrico (bici, ellittica, camminata in pendenza) rispetto alla corsa.
4. Se il cardio deve stare nella stessa sessione dei pesi, **i pesi vanno prima** (salvo obiettivo aerobico prioritario), e il cardio va limitato a 15-25 minuti in Z2.
5. Un riscaldamento aerobico di 5-10 minuti in Z1-Z2 non conta come cardio e non interferisce.

### 13.5 Conteggio energetico indicativo (per la UI, non per promesse)

| Attività | kcal/min a 70 kg (indicativo) |
|---|---|
| Camminata 5 km/h | 4.0 |
| Camminata in pendenza 10% a 5 km/h | 7.5 |
| Bici moderata | 7.0 |
| Corsa 10 km/h | 11.5 |
| Vogatore moderato | 8.5 |
| Circuito con pesi | 7.0 |
| Allenamento con pesi tradizionale | 4.5 |

Il motore deve dichiarare esplicitamente che si tratta di stime con errore ampio (±20-30%).

---

## 14. Adattamento della scheda per obiettivo

### 14.1 Matrice riassuntiva

| Obiettivo | Volume (vs MAV) | Rep range prevalente | %1RM | RIR | Pause | Cardio/sett | Frequenza/muscolo | Tecniche |
|---|---|---|---|---|---|---|---|---|
| **Perdita peso** | 0.90-1.00 | 8-15 | 60-75% | 1-2 | 45-90 s | 150-300 min | 2-3x | Superserie, circuiti |
| **Massa muscolare** | 1.00 | 6-15 (core 8-12) | 65-80% | 0-2 | 90-180 s | 60-150 min | 2x | Drop set, myo-reps in W4-5 |
| **Forza** | 0.75-0.90 | 3-6 | 80-90% | 1-3 | 180-300 s | 45-120 min | 2-3x sul pattern | Cluster set |
| **Ricomposizione** | 1.00 | 6-12 | 65-80% | 0-2 | 90-150 s | 90-200 min | 2-3x | Superserie antagoniste |
| **Tonificazione** | 0.80-1.00 | 10-15 | 60-72% | 1-2 | 60-120 s | 100-200 min | 2-3x | Superserie |
| **Resistenza muscolare** | 1.10-1.30 | 15-30 | 40-60% | 0-2 | 20-60 s | 180-420 min | 2-4x | Circuiti, EMOM, AMRAP |
| **Salute / longevità** | 0.50-0.60 | 8-15 | 50-70% | 2-4 | 60-120 s | 150-300 min | 2x | Nessuna |
| **Riabilitazione leggera** | 0.40-0.60 | 10-20 | 30-60% | 3-5 | 60-180 s | secondo tolleranza | 2-3x | Nessuna, tempo controllato |

### 14.2 Note per obiettivo

**Perdita peso.** Il dimagrimento è determinato dalla dieta; il ruolo dell'allenamento con i pesi è **proteggere la massa magra**. Regole numeriche: deficit calorico ≤ 500 kcal/die, perdita di peso **0.5-1% del peso corporeo a settimana**, proteine **1.6-2.4 g/kg** (fino a 2.7 g/kg in deficit aggressivo o con bassa percentuale di grasso), volume di allenamento mantenuto o aumentato, **≥ 10 serie settimanali per muscolo** ([PMC9012799](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9012799/), [Examine](https://examine.com/guides/protein-intake/)). Il motore non deve ridurre i carichi "perché si è a dieta": si mantiene l'intensità e semmai si riduce leggermente il numero di serie se il recupero peggiora.

**Massa muscolare.** Surplus calorico contenuto (+5-15%, circa 0.25-0.5% di peso corporeo a settimana per un intermedio), proteine 1.6-2.2 g/kg, volume in MAV, progressione settimanale documentata.

**Forza.** Specificità: gli esercizi testati vanno allenati 2-3 volte a settimana con carichi ≥ 80%. Il volume totale è inferiore, ma il volume **ad alta intensità** è superiore. Accessori mantenuti a MEV per non rubare recupero.

**Ricomposizione.** Realistica in principianti, in chi rientra dopo uno stop e in soggetti con sovrappeso. Calorie a mantenimento o deficit lieve (-10%), proteine 1.8-2.4 g/kg, allenamento identico a un programma di ipertrofia. Aspettative da comunicare: variazioni lente, misurabili in mesi.

**Tonificazione.** Non esiste come adattamento fisiologico distinto: è ipertrofia moderata più riduzione del grasso sottocutaneo. Il motore deve tradurre internamente `tonificazione -> ipertrofia a volume moderato + deficit calorico lieve`, e comunicarlo all'utente in modo non tecnico.

**Salute e longevità.** Il segnale più forte in letteratura è dose-risposta con un plateau basso: già 30-60 minuti settimanali di rinforzo muscolare più 150 minuti di aerobico coprono la maggior parte del beneficio di mortalità. Prescrivere 2 sedute full body da 6-8 esercizi, 1-3 serie, 8-15 reps, RIR 2-4, più camminata quotidiana.

**Riabilitazione leggera.** Solo con autorizzazione di un professionista sanitario. Il motore deve: mantenere il ROM entro la soglia di dolore (regola del ≤ 3/10 di dolore che si normalizza entro 24 h), preferire macchine e movimenti guidati, tempo controllato, mai cedimento, mai Valsalva prolungata, progressione lenta (+5% ogni 2 settimane). Disclaimer obbligatorio in app.

### 14.3 Selezione automatica degli esercizi

```pseudocode
EXERCISE_SELECTION_RULES = {
  compoundRatio: { forza: 0.80, ipertrofia: 0.60, dimagrimento: 0.70,
                   resistenza: 0.60, salute_generale: 0.75, riabilitazione: 0.40 },
  patternsPerSession: ["squat","hinge","horizontal_push","vertical_push",
                       "horizontal_pull","vertical_pull","carry_or_core"],
  rules: [
    "ogni sessione full body copre almeno: 1 squat/hinge, 1 push, 1 pull, 1 core",
    "il primo esercizio della sessione e' sempre il piu' tecnico e pesante",
    "isolamenti sempre dopo i multiarticolari dello stesso distretto",
    "non piu' di 2 esercizi consecutivi sullo stesso muscolo primario",
    "varia gli esercizi tra i mesocicli, non all'interno dello stesso mesociclo",
    "rispetta i vincoli di attrezzatura e le controindicazioni dichiarate dall'utente"
  ]
}
```

---

## 15. Popolazioni speciali

> Avvertenza di prodotto: per tutte queste popolazioni la app deve mostrare un disclaimer chiaro e raccomandare il parere medico prima di iniziare. Il motore genera una proposta conservativa, non una prescrizione clinica.

### 15.1 Over 60

Riferimenti: NSCA Position Statement "Resistance Training for Older Adults" (2019) ([NSCA PDF](https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf)), linee guida ACSM e revisioni su sarcopenia ([Age and Ageing](https://academic.oup.com/ageing/article/51/2/afac003/6527381)).

| Parametro | Valore |
|---|---|
| Frequenza | 2-3 giorni/settimana (fino a 4) |
| Esercizi | 8-10, multiarticolari e su macchina, priorità agli arti inferiori |
| Serie | 1-3 per esercizio all'inizio, fino a 3-4 dopo 8-12 settimane |
| Ripetizioni | 8-15 |
| Intensità iniziale | 40-50% 1RM (anche solo peso corporeo se molto decondizionati o sarcopenici: 30-60% 1RM) |
| Intensità target | 70-85% 1RM progressivamente |
| RIR | 2-4, mai cedimento |
| Lavoro di potenza | 1-2 esercizi, 40-60% 1RM, 6-10 reps, fase concentrica **veloce e intenzionale**: è la qualità più correlata all'autonomia funzionale e alla prevenzione delle cadute |
| Recupero tra le serie | 60-120 s (fino a 180 s sui multiarticolari) |
| Progressione | +2.5-5% ogni 2 settimane |
| Deload | ogni 4 settimane |
| Complementi | equilibrio (2-3x/sett), mobilità, proteine 1.2-1.6 g/kg, vitamina D su indicazione medica |

Regole hard: nessuna manovra di Valsalva prolungata in caso di ipertensione; evitare esercizi che richiedano di scendere e salire da terra se c'è rischio di caduta; preferire panche e macchine con appoggio dorsale.

### 15.2 Principianti assoluti

| Parametro | Valore |
|---|---|
| Prime 2-4 settimane | 2-3 sedute full body, 1-2 serie per esercizio, 10-15 reps, RIR 3-4 |
| Settimane 5-12 | 3 sedute full body, 2-3 serie, 8-12 reps, RIR 2-3 |
| Esercizi | 5-8 per sessione, macchine e movimenti guidati prima dei liberi |
| Progressione | lineare, ogni sessione se completate tutte le reps |
| Cedimento | mai nelle prime 8-12 settimane |
| Focus | apprendimento tecnico, costanza, tolleranza al DOMS |
| Aspettative da comunicare | i primi guadagni (4-8 settimane) sono in larga parte neurali; l'ipertrofia visibile arriva dopo 8-12 settimane |

Il motore deve inserire nella prima settimana una **sessione di calibrazione** dove i carichi sono deliberatamente bassi e l'obiettivo dichiarato è raccogliere dati.

### 15.3 Adolescenti

Riferimenti: NSCA Youth Resistance Training Position Statement ([NSCA PDF](https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf)), AAP ([Pediatrics](https://publications.aap.org/pediatrics/article/121/4/835/70927/Strength-Training-by-Children-and-Adolescents)).

| Parametro | Valore |
|---|---|
| Età minima | quando il ragazzo è in grado di seguire istruzioni e mantenere l'attenzione (indicativamente 7-8 anni per attività generali; i programmi in palestra tipicamente dai 12-13 anni) |
| Supervisione | **obbligatoria** e qualificata |
| Frequenza | 2-3 giorni non consecutivi/settimana |
| Esercizi | 6-12, multiarticolari e a corpo libero |
| Serie x reps | 1-3 x 6-15, iniziando da 1-2 serie x 10-15 reps con carico leggero |
| Intensità | inizialmente carico che consente 12-15 reps con tecnica perfetta |
| Progressione | +5-10% di carico quando si eseguono comodamente le reps target |
| Massimali | **niente 1RM testato** e niente sollevamenti massimali non supervisionati |
| Note | la tecnica precede sempre il carico; l'allenamento con i pesi non danneggia le cartilagini di accrescimento se eseguito correttamente e supervisionato |

Regola di prodotto: se l'utente dichiara età < 16 anni, il motore genera solo programmi a corpo libero o carico leggero e mostra un avviso sulla necessità di supervisione.

### 15.4 Gravidanza e post-partum (cenni, con cautela)

Riferimento: ACOG Committee Opinion 804 ([ACOG](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period), [PubMed 32217980](https://pubmed.ncbi.nlm.nih.gov/32217980/)).

**Raccomandazione generale:** in assenza di complicanze ostetriche o controindicazioni mediche, l'attività fisica in gravidanza è sicura e desiderabile: almeno **150 minuti settimanali** di attività aerobica moderata, distribuiti in sessioni di 20-30 minuti nella maggior parte dei giorni, più attività di rinforzo muscolare.

| Parametro | Indicazione |
|---|---|
| Intensità | moderata; usare **talk test** e Borg 13-14 su scala 6-20 (non usare la FC come unico riferimento) |
| Carichi | moderati, RIR ≥ 3, nessun cedimento, nessuna Valsalva |
| Da evitare | posizione **supina prolungata** dopo il primo trimestre; sport da contatto; rischio di caduta (sci, equitazione, MTB); immersioni subacquee; attività ad altitudine > 2500 m se non acclimatate; surriscaldamento |
| Core | evitare crunch/sit-up intensi nel secondo e terzo trimestre; preferire lavoro di respirazione, anti-estensione leggero, pavimento pelvico |
| Post-partum | ripresa graduale appena ci si sente pronte e con il via libera del medico (controllo tipicamente a 6 settimane, prima in caso di parto senza complicanze); valutare diastasi addominale e continenza prima di tornare a carichi alti e impatto |
| Red flag da mostrare in app | sanguinamento vaginale, contrazioni dolorose regolari, perdita di liquido amniotico, dispnea prima dello sforzo, capogiri, cefalea, dolore toracico, debolezza muscolare che compromette l'equilibrio, dolore o gonfiore al polpaccio: **interrompere e contattare il medico** |

**Regola di prodotto obbligatoria:** se l'utente dichiara gravidanza o post-partum, l'app deve (a) richiedere conferma di autorizzazione medica, (b) disabilitare gli obiettivi `forza` e `dimagrimento` aggressivo, (c) generare solo programmi a intensità moderata, (d) mostrare sempre la lista dei red flag.

### 15.5 Tabella di sicurezza trasversale

```json
{
  "safetyFlags": {
    "hypertension":       { "avoid": ["valsalva","isometric_max","inverted_positions"], "maxRIR": 2, "note": "RIR minimo 2, respirazione continua" },
    "knee_pain":          { "avoid": ["deep_squat_loaded","leg_extension_heavy","jumping"], "prefer": ["box_squat","leg_press_partial","hip_thrust"] },
    "lower_back_pain":    { "avoid": ["conventional_deadlift","good_morning","bent_over_row_heavy"], "prefer": ["trap_bar","chest_supported_row","hip_thrust","bird_dog"] },
    "shoulder_impingement":{ "avoid": ["behind_neck_press","upright_row","wide_dip"], "prefer": ["neutral_grip_press","landmine_press","scapular_work"] },
    "pregnancy":          { "avoid": ["supine_after_t1","contact","fall_risk","valsalva","crunch"], "maxRPE": 14, "borgScale": "6-20" },
    "age_over_65":        { "maxRIR": 2, "prefer": ["machines","supported_positions","power_work_light"] },
    "age_under_16":       { "maxLoad": "12-15RM", "require": "supervision", "avoid": ["1rm_test","max_lifts"] },
    "obesity_bmi_35":     { "prefer": ["low_impact_cardio","seated_machines"], "avoid": ["running","jumping"] }
  }
}
```

---

## Appendice A: schema JSON completo del motore

### A.1 Input utente

```json
{
  "user": {
    "id": "uuid",
    "sex": "M | F",
    "birthDate": "1990-04-12",
    "bodyweightKg": 78.5,
    "heightCm": 178,
    "level": "beginner | intermediate | advanced",
    "continuousTrainingMonths": 14,
    "monthsSinceLastTraining": 0,
    "goal": "ipertrofia | forza | dimagrimento | ricomposizione | tonificazione | resistenza_muscolare | salute_generale | riabilitazione_leggera",
    "priorityMuscles": ["dorso", "deltoide_laterale"],
    "daysPerWeek": 4,
    "minutesPerSession": 60,
    "preferredDays": ["Lun","Mar","Gio","Ven"],
    "environment": "gym_full | gym_basic | home_bodyweight | home_bands | home_dumbbells",
    "equipment": ["barbell","dumbbells_2_40","machine_stack","pullup_bar","bands_S_M_L","bench"],
    "availableIncrementsKg": { "barbell": 2.5, "dumbbell_pair": 2.0, "machine_stack": 5.0 },
    "safetyFlags": ["knee_pain"],
    "recoveryScore": "low | normal | high",
    "avgSleepHours": 7.0,
    "e1RM": { "back_squat": 120, "bench_press": 85, "deadlift": 150 },
    "preferences": { "allowAdvancedTechniques": true, "dislikedExercises": ["burpee"], "cardioModality": "cycling" }
  }
}
```

### A.2 Output scheda

```json
{
  "program": {
    "id": "uuid",
    "createdAt": "2026-09-12",
    "goal": "ipertrofia",
    "splitId": "upper_lower_4",
    "mesocycleWeeks": 5,
    "deloadWeek": 6,
    "weeklyVolumeTargets": { "petto": 14, "dorso": 16, "quadricipiti": 14, "femorali": 10, "...": 0 },
    "cardioPlan": { "lissSessions": 2, "lissMinutes": 35, "hiitSessions": 1, "hiitProtocol": "8x1min_Z5" },
    "weeks": [
      {
        "week": 1,
        "sessions": [
          {
            "day": "Lun",
            "name": "UPPER A",
            "estimatedMinutes": 58,
            "warmup": {
              "general": { "modality": "cycling", "minutes": 6, "zone": "Z1-Z2" },
              "mobility": ["band_pull_apart 2x15", "cat_cow 1x10", "shoulder_dislocate 1x10"],
              "specificSets": "generati da warmupSets() sul primo esercizio di ogni pattern"
            },
            "exercises": [
              {
                "order": 1,
                "exerciseId": "bench_press",
                "pattern": "horizontal_push",
                "primaryMuscles": ["petto"],
                "secondaryMuscles": ["tricipiti","deltoide_anteriore"],
                "sets": 4,
                "repRange": [6, 8],
                "targetLoadKg": 67.5,
                "loadPct1RM": 79,
                "targetRIR": 2,
                "tempo": "2-0-1-0",
                "restSeconds": 150,
                "restSecondsUserOverride": null,
                "technique": null,
                "warmupSets": [
                  { "loadKg": 20, "reps": 10, "restSeconds": 30 },
                  { "loadKg": 40, "reps": 8,  "restSeconds": 45 },
                  { "loadKg": 52.5, "reps": 5, "restSeconds": 60 },
                  { "loadKg": 60, "reps": 3,  "restSeconds": 90 }
                ],
                "volumeContribution": { "petto": 4.0, "tricipiti": 2.0, "deltoide_anteriore": 2.0 },
                "progressionRule": "double_progression",
                "notes": "scapole retratte, gomiti a 45-60 gradi"
              }
            ],
            "cooldown": { "staticStretch": ["pettorali 2x30s","dorsali 2x30s"], "minutes": 5 }
          }
        ]
      }
    ]
  }
}
```

### A.3 Log di una sessione (input per la progressione)

```json
{
  "sessionLog": {
    "programId": "uuid",
    "week": 1,
    "day": "Lun",
    "date": "2026-09-14T18:20:00+02:00",
    "bodyweightKg": 78.3,
    "durationMinutes": 61,
    "perceivedSessionRPE": 7,
    "entries": [
      {
        "exerciseId": "bench_press",
        "sets": [
          { "index": 1, "loadKg": 67.5, "reps": 8, "rir": 2, "completed": true, "restTakenSeconds": 155 },
          { "index": 2, "loadKg": 67.5, "reps": 8, "rir": 1, "completed": true, "restTakenSeconds": 160 },
          { "index": 3, "loadKg": 67.5, "reps": 8, "rir": 1, "completed": true, "restTakenSeconds": 170 },
          { "index": 4, "loadKg": 67.5, "reps": 7, "rir": 0, "completed": true, "restTakenSeconds": 0 }
        ]
      }
    ],
    "feedback": { "soreness": 2, "pump": 2, "jointPain": false, "energy": 3 }
  }
}
```

### A.4 Tabelle costanti da seedare nel database

```json
{
  "REP_PCT_TABLE": { "1":100,"2":95,"3":93,"4":90,"5":87,"6":85,"7":83,"8":80,"9":77,"10":75,
                     "11":72,"12":70,"13":68,"14":66,"15":65,"16":63,"18":60,"20":58,"25":53,"30":48 },
  "RIR_PCT_PENALTY": 3.5,
  "REST_BASE": { "forza":210,"potenza":180,"ipertrofia":120,"ricomposizione":105,"tonificazione":105,
                 "dimagrimento":75,"resistenza_muscolare":45,"salute_generale":90,"riabilitazione_leggera":90 },
  "REST_BOUNDS": { "forza":[150,300],"potenza":[120,300],"ipertrofia":[60,240],"ricomposizione":[45,180],
                   "tonificazione":[45,180],"dimagrimento":[30,150],"resistenza_muscolare":[20,90],
                   "salute_generale":[45,150],"riabilitazione_leggera":[60,180] },
  "K_EXERCISE": { "compound_axial":1.40,"compound":1.20,"compound_machine":1.00,"isolation":0.75,"core":0.60 },
  "K_INTENSITY": { "ge90":1.30,"p80_89":1.15,"p65_79":1.00,"p50_64":0.85,"lt50":0.70 },
  "K_EFFORT": { "rir0":1.15,"rir1":1.05,"rir2_3":1.00,"rir4plus":0.90 },
  "K_LEVEL": { "beginner":0.90,"intermediate":1.00,"advanced":1.10 },
  "MAX_SETS_PER_MUSCLE_PER_SESSION": { "beginner":6,"intermediate":9,"advanced":12 },
  "DELOAD_EVERY_WEEKS": { "beginner":10,"intermediate":6,"advanced":5,"forza":4,"over60":4 },
  "SET_DURATION_ESTIMATE_SECONDS": 40,
  "TRANSITION_BETWEEN_EXERCISES_SECONDS": 60
}
```

---

## Appendice B: pseudocodice del generatore

```pseudocode
function generateProgram(user):
    // ---------- 1. Classificazione e vincoli
    level  = classifyLevel(user)
    goal   = normalizeGoal(user.goal)          // tonificazione -> ipertrofia_moderata, ecc.
    flags  = user.safetyFlags
    days   = clamp(user.daysPerWeek, 1, 6)

    // ---------- 2. Volume settimanale target
    volumePlan = allocateWeeklyVolume(user, goal, days, user.priorityMuscles)

    // ---------- 3. Split
    split = selectSplit(days, level, goal, volumePlan, user.preferences.split)

    // ---------- 4. Distribuzione del volume nelle sessioni
    sessionVolumes = distribute(volumePlan, split)        // rispetta MAX_SETS_PER_MUSCLE_PER_SESSION

    // ---------- 5. Selezione esercizi
    for session in split.sessions:
        pool = EXERCISE_DB.filter(e =>
                    e.equipment subsetOf user.equipment
                    and e.id not in user.preferences.dislikedExercises
                    and not violatesSafety(e, flags))
        session.exercises = pickExercises(pool, sessionVolumes[session], goal, level)
        session.exercises = orderExercises(session.exercises)   // compound tecnici -> compound -> isolamenti

    // ---------- 6. Prescrizione di serie, reps, carico, RIR, pause
    for session in split.sessions:
        for ex in session.exercises:
            ex.repRange   = repRangeFor(goal, ex.category, level)
            ex.targetRIR  = rirFor(goal, ex.category, level, week = 1)
            ex.loadPct    = pctFrom(ex.repRange.mid, ex.targetRIR)
            ex.targetLoad = user.e1RM[ex.id]
                              ? roundToEquipment(user.e1RM[ex.id] * ex.loadPct / 100, ex.equipment)
                              : seedPrescription(ex, user).load
            ex.tempo      = tempoPresetFor(goal, level, ex.category)
            ex.rest       = restSeconds(goal, ex, ex.loadPct, ex.targetRIR, level)
            ex.warmupSets = ex.isFirstOfPattern ? warmupSets(ex.targetLoad, user.e1RM[ex.id], ex, user) : []

    // ---------- 7. Vincolo tempo
    for session in split.sessions:
        while estimateDuration(session) > user.minutesPerSession:
            session = reduceDuration(session)
            // ordine: 1) pause isolamenti verso il MIN, 2) superserie antagoniste,
            //         3) taglia 1 serie dal muscolo meno prioritario (mai sotto MEV),
            //         4) rimuovi l'ultimo isolamento non prioritario

    // ---------- 8. Mesociclo e deload
    program = buildMesocycle(user, goal,
                             weeks = DELOAD_EVERY_WEEKS[level] - 1,
                             deloadWeek = true)

    // ---------- 9. Cardio
    program.cardioPlan = buildCardioPlan(cardioBudget(goal, level, days), user.preferences.cardioModality, split)

    // ---------- 10. Validazione finale
    assert(every muscle: MEV <= weeklySets <= MRV)
    assert(every session: estimatedMinutes <= user.minutesPerSession * 1.1)
    assert(every muscle: frequency >= 2 or volume <= MAX_SETS_PER_MUSCLE_PER_SESSION[level])
    assert(no exercise violates safetyFlags)

    return program
```

**Loop di aggiornamento post-sessione:**

```pseudocode
function onSessionCompleted(log, program, user):
    for entry in log.entries:
        user.e1RM[entry.exerciseId] = updateE1RM(user.e1RM[entry.exerciseId], entry)
        nextWeek = program.findNextOccurrence(entry.exerciseId)
        nextWeek.prescription = nextPrescription(history(entry.exerciseId), nextWeek.prescription, user, context)

    if needsReactiveDeload(user, lastTwoWeeks(user)):
        program.insertDeloadWeek(afterCurrentWeek = true)
        notifyUser("Inserita una settimana di scarico: i segnali di fatica lo consigliano.")

    updateWeeklyVolume(program, feedbackFrom(log))
```

**Validatore di coerenza (test automatici consigliati):**

| Test | Asserzione |
|---|---|
| `volume_within_landmarks` | per ogni muscolo, MEV ≤ serie settimanali ≤ MRV del livello |
| `session_cap` | per ogni muscolo e sessione, serie dirette ≤ cap del livello |
| `frequency_min` | ogni muscolo con volume > cap per sessione è allenato ≥ 2 volte |
| `time_budget` | durata stimata ≤ minuti dichiarati + 10% |
| `rest_bounds` | ogni pausa proposta è dentro i bound dell'obiettivo |
| `load_bounds` | ogni carico è tra il 30% e il 100% dell'e1RM |
| `equipment_available` | nessun esercizio richiede attrezzatura non dichiarata |
| `safety_flags` | nessun esercizio è nella blacklist dei flag attivi |
| `beginner_no_failure` | nessun RIR 0 prescritto a un beginner con < 12 settimane |
| `deload_present` | ogni mesociclo ha una settimana di scarico entro i limiti del livello |
| `progression_monotonic` | il carico prescritto non cala di oltre il 15% tra settimane consecutive, salvo deload |

---

## Bibliografia e fonti

### Volume
- Pelland J. et al. (2025). *The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains*. Sports Medicine. https://link.springer.com/10.1007/s40279-025-02344-w | https://pubmed.ncbi.nlm.nih.gov/41343037/ | preprint https://sportrxiv.org/index.php/server/preprint/view/460
- Schoenfeld B., Ogborn D., Krieger J. (2017). *Dose-response relationship between weekly resistance training volume and increases in muscle mass*. J Sports Sci. https://pubmed.ncbi.nlm.nih.gov/27433992/
- Renaissance Periodization. *Training Volume Landmarks for Muscle Growth*. https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth
- Roth C. et al. (2022-2023). *Lean mass sparing in resistance-trained athletes during caloric restriction: the role of resistance training volume*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9012799/

### Intensità, carichi, prossimità al cedimento
- ACSM (2009). *Position Stand: Progression Models in Resistance Training for Healthy Adults*. https://pubmed.ncbi.nlm.nih.gov/19204579/ | PDF https://tourniquets.org/wp-content/uploads/PDFs/ACSM-Progression-models-in-resistance-training-for-healthy-adults-2009.pdf
- Schoenfeld B., Grgic J. et al. (2021). *Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum*. Sports. https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/
- Schoenfeld B. et al. (2017). *Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis*. https://pubmed.ncbi.nlm.nih.gov/28834797/
- Robinson Z. et al. (2024). *Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy*. Sports Medicine. https://pubmed.ncbi.nlm.nih.gov/38970765/
- NSCA. *Training Load Chart*. https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf

### Recupero tra le serie
- NSCA Strength & Conditioning Journal. *A Brief Review: How Much Rest between Sets?* https://journals.lww.com/nsca-scj/Fulltext/2008/06000/A_Brief_Review__How_Much_Rest_between_Sets_.9.aspx
- Singer A. et al. (2024). *Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11349676/
- de Salles B. et al. (2009). *Rest interval between sets in strength training*. Sports Med. https://pubmed.ncbi.nlm.nih.gov/19691365/

### Frequenza e split
- Schoenfeld B., Grgic J., Krieger J. (2019). *How many times per week should a muscle be trained to maximize muscle hypertrophy?* J Sports Sci. https://pubmed.ncbi.nlm.nih.gov/30558493/
- Stronger by Science. *Training Frequency for Muscle Growth: What the Data Say*. https://www.strongerbyscience.com/frequency-muscle/

### Tecniche avanzate
- (2025). *Effects of Advanced Resistance Training Systems on Muscle Hypertrophy and Strength in Recreationally Trained Adults: A Systematic Review and Meta-Analysis*. https://pmc.ncbi.nlm.nih.gov/articles/PMC12922048/
- Prestes J. et al. (2021). *Rest-pause and drop-set training elicit similar strength and hypertrophy adaptations compared with traditional sets*. https://pubmed.ncbi.nlm.nih.gov/34260860/
- Iversen V. et al. / (2025). *Superset Versus Traditional Resistance Training Prescriptions: A Systematic Review and Meta-analysis*. Sports Medicine. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12011898/ | https://pubmed.ncbi.nlm.nih.gov/39903375/
- Schoenfeld B., Ogborn D., Krieger J. (2015). *Effect of repetition duration during resistance training on muscle hypertrophy*. Sports Med. https://pubmed.ncbi.nlm.nih.gov/25601394/

### Progressione e deload
- Plotkin D. et al. (2022). *Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations*. PeerJ. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9528903/
- Bell L. et al. (2024). *Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey*. Sports Med Open. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10948666/
- Coleman M. et al. (2024). *Gaining more from doing less? The effects of a one-week deload period during supervised resistance training*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10809978/

### RPE / RIR e stima 1RM
- Zourdos M. et al. (2016). *Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training*. NSCA SCJ. https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/
- Helms E. et al. (2018). *RPE vs. Percentage 1RM Loading in Periodized Programs Matched for Sets and Repetitions*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5877330/
- Confronto formule 1RM: https://arvo.guru/resources/one-rep-max-formulas | https://maxcalculator.com/guides/1rm-formulas | https://www.norma-athletics.at/guides/1rm-formulas-explained/

### Warm-up e stretching
- Simic L., Sarabon N., Markovic G. (2013). *Does pre-exercise static stretching inhibit maximal muscular performance? A meta-analytical review*. Scand J Med Sci Sports. https://www.researchgate.net/publication/221816221_Does_pre-exercise_static_stretching_inhibit_maximal_muscular_performance_A_meta-analytical_review
- Behm D. et al. (2019). *Acute Effects of Static Stretching on Muscle Strength and Power: An Attempt to Clarify Previous Caveats*. https://pmc.ncbi.nlm.nih.gov/articles/PMC6895680/

### Periodizzazione
- Grgic J. et al. (2017). *Effects of linear and daily undulating periodized resistance training programs on measures of muscle hypertrophy: a systematic review and meta-analysis*. PeerJ. https://peerj.com/articles/3695/ | https://pubmed.ncbi.nlm.nih.gov/28848690/
- Evans J. (2019). *Periodized Resistance Training for Enhancing Skeletal Muscle Hypertrophy and Strength: A Mini-Review*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6351492/
- Moesgaard L. et al. (2022). *Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs*. Sports Med. https://pubmed.ncbi.nlm.nih.gov/35044672/

### Cardio e interferenza
- ACSM. *Physical Activity Guidelines*. https://acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines/ | *Monitoring Aerobic Exercise Intensity* https://acsm.org/monitoring-aerobic-exercise-intensity/
- Wilson J. et al. (2012). *Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises*. JSCR. https://pubmed.ncbi.nlm.nih.gov/22002517/
- Eddens L. et al. (2018). *The Role of Intra-Session Exercise Sequence in the Interference Effect: A Systematic Review with Meta-Analysis*. Sports Med. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5752732/
- Stronger by Science. *Research Spotlight: The interference effect is getting less scary by the day*. https://www.strongerbyscience.com/research-spotlight-interference-effect/

### Popolazioni speciali
- Fragala M. et al. (2019). *Resistance Training for Older Adults: Position Statement From the NSCA*. JSCR. https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf
- Lim S. et al. (2022). *Resistance exercise as a treatment for sarcopenia: prescription and delivery*. Age and Ageing. https://academic.oup.com/ageing/article/51/2/afac003/6527381
- Faigenbaum A. et al. (2009). *Youth Resistance Training: Updated Position Statement Paper From the NSCA*. https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf
- American Academy of Pediatrics (2008). *Strength Training by Children and Adolescents*. https://publications.aap.org/pediatrics/article/121/4/835/70927/Strength-Training-by-Children-and-Adolescents
- ACOG (2020). *Committee Opinion 804: Physical Activity and Exercise During Pregnancy and the Postpartum Period*. https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period | https://pubmed.ncbi.nlm.nih.gov/32217980/

### Nutrizione di supporto (per completezza)
- Examine.com. *Optimal Protein Intake Guide*. https://examine.com/guides/protein-intake/
- Helms E. et al. (2014). *Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation*. JISSN. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/

---

### Nota finale sui limiti

1. Tutti i numeri di questo documento sono **medie di popolazione**: la variabilità interindividuale nella risposta al volume è ampia. L'autoregolazione basata sul feedback dell'utente (sezione 7.6) conta più della tabella di partenza.
2. Le tabelle MEV/MAV/MRV del modello RP non sono validate sperimentalmente in modo diretto: sono un'euristica di programmazione coerente con la dose-risposta osservata. Vanno usate come punto di partenza e corrette con i dati reali dell'utente.
3. Il motore non fa diagnosi e non sostituisce un professionista. Ogni output su popolazioni speciali, dolore o patologia deve essere accompagnato da un invito esplicito al consulto medico.
