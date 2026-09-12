# Benchmark app fitness: prodotto e UX

**Ricerca per una PWA fitness italiana mobile-first**
Data: settembre 2026. Tutte le affermazioni fattuali sono corredate di URL. I prezzi e i limiti dei piani cambiano spesso: vanno riverificati prima di usarli in materiale pubblico.

---

## Indice

1. [Feature matrix: le top 6 app a confronto](#1-feature-matrix-le-top-6-app-a-confronto)
2. [Le 20 feature che rendono eccellente un'app fitness](#2-le-20-feature-che-rendono-eccellente-unapp-fitness)
3. [Anti-pattern e lamentele ricorrenti degli utenti](#3-anti-pattern-e-lamentele-ricorrenti-degli-utenti)
4. [UX del logging durante l'allenamento](#4-ux-del-logging-durante-lallenamento)
5. [Timer di recupero: comportamento atteso e vincoli tecnici su PWA](#5-timer-di-recupero-comportamento-atteso-e-vincoli-tecnici-su-pwa)
6. [Onboarding](#6-onboarding)
7. [Progressi e motivazione](#7-progressi-e-motivazione)
8. [Feature PWA-specifiche: cosa funziona davvero oggi](#8-feature-pwa-specifiche-cosa-funziona-davvero-oggi)
9. [Monetizzazione e struttura dati](#9-monetizzazione-e-struttura-dati)
10. [Raccomandazione finale: MVP vs V2](#10-raccomandazione-finale-mvp-vs-v2)
11. [Nota metodologica e fonti](#11-nota-metodologica-e-fonti)

---

## 1. Feature matrix: le top 6 app a confronto

### 1.1 Chi sono le "top 6" e perché

Il mercato non è omogeneo: mettere Hevy e Peloton nella stessa tabella non ha senso, perché risolvono problemi diversi. La distinzione operativa è:

- **Logger di forza** (registrano serie, ripetizioni e carico): Hevy, Strong, Fitbod, JEFIT, Boostcamp, Alpha Progression, FitNotes, Caliber, Setgraph, Liftin'.
- **Librerie video follow-along** (non loggano peso x reps set per set): Nike Training Club, Freeletics, Centr, Peloton (con l'eccezione parziale di Strength+), Gymshark Training, Workout Planner / Muscle Booster.

Poiché il progetto è un tracker, la matrice principale confronta le sei app rilevanti: **Hevy, Strong, Fitbod, JEFIT, Boostcamp, Alpha Progression**. Le altre sono trattate in sintesi al punto 1.6.

Tutti i dati sono stati verificati il **12 settembre 2026** su App Store, Google Play, pagine di pricing ufficiali e help center dei vendor.

### 1.2 Prezzi e limiti del piano gratuito

| App | Free tier | Mensile | Annuale | Lifetime | Trial | Cosa limita il free |
|---|---|---|---|---|---|---|
| **Hevy** | Sì, permanente | 2,99 $ | **23,99 $** | **74,99 $** | no | 4 routine, 7 esercizi custom, 3 mesi di storico grafici; **logging illimitato e niente ads** ([help center](https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include)) |
| **Strong** | Sì, permanente | 4,99 $ | 23,99-29,99 $ | 79,99-99,99 $ | no | **3 routine custom**; grafici e calcolatori bloccati in PRO ([App Store](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577)) |
| **Fitbod** | **No** | 15,99 $ (legacy 12,99) | 95,99 $ (legacy 79,99) | no | 7 gg | Solo 3 workout di prova, poi paywall totale |
| **JEFIT** | Sì, **con pubblicità** | 12,99 $ | **69,99 $** | no | no | Ads, niente piani expert, smartwatch limitato |
| **Boostcamp** | Sì, molto generoso | 14,99 $ | **59,99 $** | no | 7 gg | Nessun cap su tracking e program builder; Pro aggiunge Strength Score, heatmap volume, analytics ([boostcamp.app/premium](https://www.boostcamp.app/premium)) |
| **Alpha Progression** | Sì, limitato | 12,99 $ | **79,99 $** | no | 14 gg | Generatore di piano, RIR, plate/warmup calculator sono Pro |

### 1.3 Logging in sessione

| | Hevy | Strong | Fitbod | JEFIT | Boostcamp | Alpha Progression |
|---|---|---|---|---|---|---|
| Rest timer automatico | Sì, + **Live Activity** | Sì | Sì | Sì + cronometro | Sì | Sì, + Live Activity / Dynamic Island |
| Plate calculator | Sì | Sì (PRO) | n.d. | n.d. | **Sì** | Sì (Pro) |
| Warm-up calculator | Sì (Pro) | Sì (PRO) | Sì | n.d. | Sì (template) | Sì (Pro) |
| Superset / circuiti | Sì | Sì | Sì (auto-tag) | Sì | Sì | Sì |
| Drop set | Sì | n.d. | n.d. | n.d. | **Sì** | Sì |
| RPE / RIR | RPE opzionale | Sì | **RiR** | n.d. | **Sì, anche nel free** | **RIR (Pro)** |
| Note per serie | Sì | Sì | Sì | Sì | Sì | Sì |

### 1.4 Programmazione e progressione

| | Hevy | Strong | Fitbod | JEFIT | Boostcamp | Alpha Progression |
|---|---|---|---|---|---|---|
| Generatore automatico | No (Hevy Trainer in Pro) | **No** | **Sì, è il prodotto** | Sì, "4 AI engine" | Sì (AI coach) | **Sì (Pro)** |
| Programmi pre-fatti | ~25 routine | **No** | Sì | Sì (Elite) | **11.000+, di cui 130+ di coach** (Helms, Wendler, nSuns) | Sì |
| Progressione automatica | No | No | **Sì**, con recupero muscolare | Sì + mesocicli | **Sì**, training-max wave | **Sì, per ogni serie** |
| Editor routine custom | **Sì, il migliore** | Sì | Limitato | Sì | **Sì, illimitato anche free** | Sì (free) |

### 1.5 Database, analytics, integrazioni, dati

| | Hevy | Strong | Fitbod | JEFIT | Boostcamp | Alpha Progression |
|---|---|---|---|---|---|---|
| Esercizi | 400+ | ~450 | **1.000+** | **1.400+** | ampio + 30 guide | 795 |
| Esercizi custom | 7 free / illim. Pro | Sì | Sì | Sì | Sì (free) | Sì |
| Video / istruzioni | Sì, HD | Sì | Sì, HD | Sì (Elite) | Sì, form video | Sì, video reali |
| Volume / tonnellaggio | Sì | Sì (PRO) | Sì | Sì | Sì | Sì |
| 1RM stimato | Sì | Sì (PRO) | Sì | Sì, automatico | **Sì, curva e1RM** | 10RM |
| PR | Sì | Sì | Sì | Sì | Sì | Sì |
| **Heatmap muscolare** | Sì (Pro) | Sì (PRO) | Sì, recovery heatmap | Sì, recovery chart | Sì (Pro) | n.d. |
| Apple Watch | Sì + complication | **Sì, completa** | Sì | Sì | Sì (HealthKit HR) | n.d. |
| Wear OS | **Sì** | No | **Sì** | **Sì** | No | No |
| Apple Health / Health Connect | Sì / **Sì** | Sì / n.d. | Sì / n.d. | Sì / n.d. | Sì / n.d. | Sì / n.d. |
| Strava | **Sì** | No | **Sì** | **Sì** | n.d. | No |
| Export CSV | Sì | Sì (il migliore della categoria) | Sì | n.d. | n.d. | **Sì** |
| **API pubblica** | **Sì, REST documentata (solo Pro)** | No | No | No | No | No |
| Offline | Sì | Sì | Parziale | Problematico | **Sì** | **Sì** |
| Web app | **Sì (hevy.com)** | No | No | **Sì** | No | No |

Hevy è l'unica del gruppo con una **API REST pubblica documentata** ([api.hevyapp.com/docs](https://api.hevyapp.com/docs/)): chiave generabile dalle impostazioni web, endpoint GET/POST su workout, routine ed exercise template, riservata agli utenti Pro. È un dato rilevante se si vuole offrire import da Hevy.

### 1.6 Scala e gradimento (verificati il 12 settembre 2026)

| App | App Store | Rating iOS (n) | Google Play | Review Play | Download Play |
|---|---|---|---|---|---|
| **Hevy** | **4.92** | 91.973 | **4.9** | 264K | **5M+** |
| Strong | 4.86 | 108.517 | **4.3** | 42,7K | 1M+ |
| Fitbod | 4.81 | 284.139 | 4.5 | 31,1K | 1M+ |
| JEFIT | 4.76 | 46.879 | 4.4 | 89,8K | 5M+ |
| Boostcamp | 4.85 | 10.068 | 4.7 | 13,1K | 500K+ |
| Alpha Progression | **4.92** | 2.154 | 4.8 | 21K | 1M+ |
| FitNotes (solo Android) | n/a | - | 4.8 | 31,4K | 1M+ |
| Nike Training Club | 4.85 | 281.428 | 4.3 | 373K | 10M+ |
| Freeletics | 4.64 | 22.249 | **4.2** | 260K | 10M+ |

**Il dato più istruttivo è il gap iOS/Android**: Strong crolla da 4.86 a 4.3, Fitbod da 4.81 a 4.5, Freeletics da 4.64 a 4.2. Hevy è l'unica che tiene 4.9 su entrambe le piattaforme. Il messaggio per noi: la qualità su Android è il differenziale più trascurato del settore, e una PWA parte avvantaggiata perché ha un solo codebase.

### 1.7 Le altre app citate, in breve

- **FitNotes** (solo Android, [FAQ ufficiale](https://www.fitnotesapp.com/faq/)): tutto gratis, zero pubblicità, 100% locale, backup su Drive/Dropbox, rest timer per esercizio, plate calculator. Amatissimo per velocità e privacy, non ha cloud né iOS. È il riferimento di minimalismo da studiare.
- **Caliber**: free tier ad-free con tracking illimitato e 800+ esercizi, ma **superset ed esercizi custom sono a pagamento**; il vero prodotto è il coaching umano (pacchetti da 600 a 1.400 $ per 3 mesi).
- **Gymshark Training**: **da escludere dai confronti, è dismessa**. Gymshark ha dichiarato che l'app non riceverà più fix né nuove feature, è stata rimossa da Google Play nel marzo 2025 e l'ultimo aggiornamento iOS è del giugno 2025 ([Gymshark Support](https://support.gymshark.com/en-US/article/the-gymshark-training-app)).
- **Nike Training Club**: gratis al 100%, nessun acquisto in-app, nessuna pubblicità. Libreria video, non un logger. Ha perso il download offline dei workout, e le recensioni lo rinfacciano.
- **Freeletics**, **Centr**, **Peloton**, **Workout Planner / Muscle Booster**: modello a contenuto, hard paywall, nessun logging di forza serio. Peloton ha chiuso il free tier nell'aprile 2024 ([CNBC](https://www.cnbc.com/2024/04/15/peloton-removes-free-app-membership.html)) e ha alzato i prezzi nell'ottobre 2025; l'unico pezzo rilevante per noi è **Strength+**, che logga peso e reps con rest timer.
- **Stronger by the Day**: programma di forza femminile in abbonamento (16,99 $/mese), niente free tier.
- **Setgraph** e **Liftin'**: tracker recenti, design-forward, free tier simbolico (rispettivamente 5 workout totali e 5 workout al mese). Setgraph dichiara il target "loggare una serie in meno di 3 secondi" con pre-fill della sessione precedente e frecce verdi sui miglioramenti ([Setgraph](https://setgraph.app/ai-blog/app-to-track-my-workouts)); Liftin' fa progressione automatica a regole. Entrambi hanno copertura editoriale indipendente quasi nulla.

### 1.8 Cosa manca a tutti

1. **Nessuna app mainstream è veramente in italiano** con database esercizi tradotto e curato.
2. **Il free tier utile è raro**: Hevy e Boostcamp sono le eccezioni; tutti gli altri castrano o chiudono.
3. **Nessuna è una PWA**: per usarle serve passare dallo store, con relative commissioni e attriti di installazione.
4. **Nessuna unisce bene le due metà**: chi programma bene (Fitbod, Alpha Progression) logga in modo mediocre; chi logga benissimo (Strong, Hevy) non programma.
5. **L'affidabilità del rest timer e del comportamento in background è un problema irrisolto praticamente ovunque** (vedi sezione 3).

---

## 2. Le 20 feature che rendono eccellente un'app fitness

Ordinate per impatto sull'esperienza d'uso, non per "quanto fa figo nella demo". La complessità è valutata per una PWA costruita da zero.

| # | Feature | Cosa fa | Perché conta | Complessità |
|---|---|---|---|---|
| 1 | **Pre-fill dei valori della sessione precedente** | Ogni serie nasce già compilata con peso e reps dell'ultima volta | Trasforma il logging da 5-6 tap a 1 tap. È la singola feature con il miglior rapporto impatto/costo di tutto il prodotto | **Bassa** |
| 2 | **Offline totale** | L'app funziona al 100% senza rete, dati locali | Le palestre nei seminterrati non hanno segnale. Senza offline l'app è inutilizzabile proprio quando serve | **Media** |
| 3 | **Autosalvataggio e recupero della sessione** | Ogni modifica persistita subito, allenamento ripristinabile dopo crash o chiusura | Perdere un allenamento a metà è il danno di fiducia più grave documentato nelle recensioni | **Bassa** |
| 4 | **Rest timer automatico e affidabile** | Parte al completamento della serie, sopravvive al background, avvisa a zero | Scandisce l'intera sessione. Se è rotto, l'app è rotta | **Media** (alta se si vuole la notifica a schermo spento) |
| 5 | **Riga "precedente" visibile nel punto di input** | `80 kg x 8` accanto ai campi da compilare | È l'informazione su cui si decide il carico. Nasconderla dietro un tap è l'errore più costoso | **Bassa** |
| 6 | **Wake lock** | Lo schermo resta acceso durante l'allenamento | Senza, si sblocca il telefono 25 volte a sessione con le mani sudate | **Bassa** |
| 7 | **Editor di routine e programmi** | Creare, riordinare, duplicare schede, supersets inclusi | È il contenitore di tutto: senza routine il logging è manuale ogni volta | **Media** |
| 8 | **Database esercizi con filtro per attrezzatura** | Ricerca rapida, filtri per muscolo e attrezzo, esercizi custom | Determina se il piano è eseguibile nella palestra reale dell'utente | **Bassa** (dataset già disponibile) |
| 9 | **Sostituzione esercizio in un tap** | Alternative sensate per lo stesso pattern, con l'attrezzatura disponibile | La macchina è occupata: succede ogni allenamento. Metterlo dietro paywall è un anti-pattern documentato | **Media** |
| 10 | **Storico e progressione per esercizio** | Grafico e tabella di tutte le prestazioni passate su quell'esercizio | È la metrica che l'utente controlla direttamente, la più motivante di tutte | **Bassa** |
| 11 | **Rilevamento e celebrazione dei PR** | Badge inline durante la serie + riepilogo a fine allenamento | Il feedback è l'elemento con il peso maggiore nelle meta-analisi sulla gamification | **Bassa** |
| 12 | **Tastierino numerico custom con +/- a step configurabile** | Input dedicato, step 2.5 kg / 1 rep, senza tastiera di sistema | La tastiera nativa copre lo schermo e rallenta tutto | **Media** |
| 13 | **Progressione automatica suggerita** | Propone il carico della prossima sessione in base a quanto fatto e al RIR | Elimina il calcolo mentale; è la vera differenza tra un quaderno e un'app | **Media/Alta** |
| 14 | **Volume per gruppo muscolare vs target settimanale** | Serie settimanali per muscolo confrontate con una banda 10-20 | Collega il log alla programmazione: è l'analytics più azionabile | **Media** |
| 15 | **Export dei dati (CSV/JSON)** | Scarico completo e corretto, sempre gratuito | Antidoto al lock-in e rete di sicurezza contro la perdita dati | **Bassa** |
| 16 | **Installabilità e comportamento da app** | Icona in home screen, standalone, safe area, avvio istantaneo | Su iOS abilita push, badge e wake lock: senza installazione la PWA è monca | **Bassa** |
| 17 | **Heatmap muscolare del corpo** | Silhouette colorata per muscoli allenati negli ultimi 7 giorni | Massimo gradimento per unità di sforzo: comunica squilibri a colpo d'occhio | **Media** |
| 18 | **Generatore di piano da onboarding** | Split e volume costruiti su giorni, tempo, attrezzatura, esperienza, infortuni | È la ragione per cui un principiante sceglie un'app invece di un foglio Excel | **Media/Alta** |
| 19 | **Plate calculator** | Mostra i dischi da caricare per il peso target | Feature minuscola, gradimento sproporzionato | **Bassa** |
| 20 | **Aderenza settimanale e riepilogo** | "3 allenamenti su 3 questa settimana" invece dello streak giornaliero | Motivazione sostenibile, senza l'ansia da streak rotto documentata in letteratura | **Bassa** |

**Fuori lista, deliberatamente.** Feed social e follower (Hevy li ha e funzionano, ma richiedono massa critica che un'app nuova non ha), classifiche di forza, readiness score da wearable, integrazione nutrizionale, video demo proprietari, coaching umano. Sono tutte cose da V2 o da mai.

---

## 3. Anti-pattern e lamentele ricorrenti degli utenti

### 3.1 Metodo

Reddit blocca l'accesso automatizzato, quindi la base empirica principale di questa sezione è un dataset costruito scaricando le recensioni negative reali: **2.629 recensioni 1-2 stelle su App Store** (US + UK, 15 app, feed RSS ufficiale Apple) e **1.750 recensioni 1-2 stelle su Google Play** (9 app), classificate per tema. A questo si aggiungono Trustpilot, le pagine di supporto ufficiali e le sintesi dei thread Reddit disponibili in forma secondaria ([setgraph.app](https://setgraph.app/ai-blog/best-workout-tracker-app-reddit), [Cora](https://www.corahealth.app/blog/best-workout-tracker-reddit)).

I numeri tra parentesi sono occorrenze nel dataset, non percentuali: servono a ordinare per frequenza.

### 3.2 Classifica degli anti-pattern

**1. Paywall aggressivo, bait-and-switch e disdetta ostile (1.012 occorrenze: il problema numero uno, con enorme distacco)**
Il caso più citato è Fitbod, che nel 2026 ha **rimosso il free tier a utenti già attivi senza preavviso**, prendendo in ostaggio anche lo storico: "This was a good app until you locked me out of my account behind a paywall... i can't pull my previous results from it without paying. and i only found out about this before a workout so it was either pay or lose my logged data" (1 stella, [Fitbod App Store](https://apps.apple.com/us/app/id1041517543)). Varianti: abbonamento che non compare tra le subscription di sistema e quindi non è disdicibile, addebiti dopo la cancellazione ([Trustpilot Centr, 1.6/5](https://www.trustpilot.com/review/centr.com): "After cancelling this app in 2024, they have continued to charge me year after year"), trial che si trasforma in addebito immediato. La FTC ha documentato che i dark pattern negli abbonamenti sono la norma, non l'eccezione ([TechCrunch sullo studio FTC](https://techcrunch.com/2024/07/10/ftc-study-finds-dark-patterns-used-by-a-majority-of-subscription-apps-and-websites)).
**Regola:** mai togliere retroattivamente ciò che era gratis; i dati storici dell'utente non si mettono mai dietro un paywall.

**2. Regressioni da aggiornamento: crash, lentezza, feature spostate (581)**
"used to be" e "the latest update ruined" compaiono in centinaia di recensioni (Strong 6.0 nel 2025, JEFIT 2024-2026, Nike Training Club 2022). Perfino Hevy: "Keeps crashing on me! Anytime I try to edit a routine... the app crashes and I have to start over" ([Google Play Hevy](https://play.google.com/store/apps/details?id=com.hevy)).
**Regola:** spostare o rimuovere una feature costa più rabbia di quanta gratitudine porti aggiungerne una.

**3. Notifiche, nag e gamification invasivi (324)**
Richieste di recensione durante l'allenamento, ads nel mezzo della sessione, feed social nella home di un'app di logging: "Bought the pro version to get rid of ads, but now they're back nagging about an elite version! Also, the main page of the app shouldn't be a news feed! It's a fitness app not Facebook" (JEFIT). Sul lato streak, l'ansia è documentata: "Just noticed that perfect week streak has dropped to 0... it's pity to loose a record progress of nearly 40 weeks streak" (Freeletics). E i badge rotti demotivano: "Everyday the app gives me a 'first workout in the bag' badge, because it doesn't remember what I did the day before" (Nike Training Club).

**4. Onboarding lungo con paywall prima di vedere l'app (185)**
Il copione: "Get all the way to the end of the sign ups after going through a long process of height, weight, goals, available equipment, making an account, how many days a week to work out **just to get hit with an $8 a month subscription to even see the app**" (Fitbod, 2026). E l'account obbligatorio: "All I want to do is log workouts, needing to sign up just to get going? Nah" (Strong); "You cannot use it offline/standalone - forces you to make an account to sell your data. Uninstalled" (Hevy, Android).

**5. Perdita dati e sync fallito (122, gravità massima)**
"The amount of times the app will crash mid workout and I will loose all my tracked data is insane. **It happens 50% of my workouts**" (Strong). "They lost 9 years of my data... they said it was corrupted data... Now they are ghosting me. They don't back up" (JEFIT). "Been using the app for years... decided to use the AI recommendation once just for a change, it DELETED all my workouts, YEARS of progress" (JEFIT). Il caso architetturalmente più grave: "if data is not exported to their server it is not saved locally which is nonsensical" (JEFIT). Strong ha perfino una pagina di supporto dedicata ([Lost Data](https://help.strongapp.io/article/217-lost-data)).
Bug di conferma killer: "When you click finish workout, it pops up saying 'do you want to cancel the workout?'... but lost my workout by clicking finish" (Strong).

**6. Rest timer che non suona, non parte, muore in background (68, il peggior rapporto danno/frequenza)**
- "The timer doesn't work right, doesn't keep running when app is in background" (Strong)
- "it does not count down properly and I will get an app push notification that the timer is up and then when I go to the app it shows the timer is still running" (Strong)
- "**The screen has to be awake for the rest timer to work**" (JEFIT)
- "Rest timers are hopelessly unreliable and it's obnoxious. So great at so many things, how can you not get something so basic right" (Fitbod, Android)
- "The timer for rest time stops when your phone lock screen goes on or when you switch apps to check something. Absurd design" (Centr)
Anti-pattern gemello, il timer **imposto**: "They implemented a rest timer between each set that can't be turned off. You have to turn it off every workout" (JEFIT). E il timer che occupa mezzo schermo: "Why does the timer have to take half the screen after logging a set... I'd prefer to log the set and the timer be subtle in the corner" (JEFIT).

**7. Attrito nel logging: troppi tap, storico nascosto (60)**
- "UI is less intuitive and **more click heavy**" (JEFIT)
- "We don't have time to navigate confusing UI's between sets at the gym" (JEFIT)
- "The recent update that dropped the tab now makes it very clunky to see your history while logging. I want to be able to see history... as a goal for my current set" (JEFIT): **lo storico della serie precedente deve stare dove si digita, non a due tap di distanza**
- "adding/editing workout sets is so tedious" (Strong)
Lo standard atteso dalla community è **2-3 tap massimo per serie** ([sintesi Reddit](https://setgraph.app/ai-blog/best-workout-tracker-app-reddit)).

**8. Nessun offline: app inutile in palestra senza segnale (57)**
- "My gym is in a basement and doesn't receive cell service. The fact that this app can't be used without a connection is a joke" (Freeletics)
- "It's 2026 and this app will not load my workouts because... it's got some issue with its connection to the internet? C'mon what's wrong with working offline and only connecting when needed?" (JEFIT)
- "Bugs me to authenticate every single time (let me just use it offline!), **now my pro membership wont work without authenticating**. I'm gone" (Strong): anche la validazione della licenza online è un difetto funzionale
- Regressione deliberata di Nike: "You can no longer download workouts for offline use" ricorre dal 2022 al 2026.

**9. Lock-in ed export bloccato o inaffidabile (47)**
"I'm seriously considering switching apps at this point, but **I feel locked in because all my old workout history is stored here**" (Boostcamp). "our exported data (CSV) always lists weight in Kilograms, even though the unit set in the app is configurable to lbs" (Strong).

**10. Generatore AI senza logica di progressione (40)**
- "the algorithm that doesn't adjust when weight is too heavy. It keeps the weight the same. Any lifter familiar with 5x5 understands what to do if you fail multiple times. This app doesn't" (Freeletics)
- "The workouts never really adjust, and it will just throw the same exercise at you after you said it was too hard" (Freeletics)
- "why can't it tell me the last weight I used when I repeat the same exercise the week after? I input the information but really it's a waste of time" (Fitbod): **nessun feedback loop tra log e prescrizione**
- Qualità del database: "You often have duplicates of the same exercise with different names, you have descriptions that don't match the illustrations" (JEFIT)

**11. Sostituzione esercizi difficile o a pagamento (9, ma gravità alta)**
- "it'll list a machine that my gym doesn't have week after week, even after I delete it and substitute something else" (JEFIT)
- "**cant replace exercise without pay prompt appearing**" (JEFIT, Android): paywall nel momento peggiore possibile, davanti alla macchina occupata
- "when I change an exercise with another with 'swap exercises' button, the following week would change back to the original exercise" (Boostcamp)
- "There is no option for substitute if you can not do workouts bc of knee problem" (Freeletics)

**12. UI a due mani, target piccoli, testo minuscolo (7 esplicite, ma diagnosticamente decisive)**
La citazione più utile di tutto il dataset: "Inline timer, **hard to reach +- and they removed the total rest time**. Also ui lags. **Yall should have tested this for left hand single hand use**. It looks better, but functions worse. Cancelled my subscription" (Strong, 2025). E il tema accessibilità: "Not for aging eyes: the font is too small for me to be able to use app. I don't wear reading glasses at gym and the font cannot be adjusted" (JEFIT).

**13. Schermo che si spegne durante l'allenamento (sottostimato nelle recensioni perché si manifesta come "timer rotto")**
"it consistently crashes if the screen locks while doing reps" (FitNotes); "malfunctioning timers that quit after locking your phone" (Fitbod).

**14. Grafici inutili e vanity metrics (bassa frequenza, segnale netto)**
- "1 rep max figures are completely useless on this app, they are used on the app to compare users but don't actually reflect the strength of a user if you do more than 5 reps" (Hevy, 2026): un 1RM stimato su serie lunghe è rumore, e l'utente esperto se ne accorge
- "charts only update after you finish a workout, but you can only view them from within a workout. So if you want to know how you're doing mid workout you can't" (Strong)
- "I'm sick to death of apps that are nothing more than databases with a coat of paint charging a monthly subscription... Pay us to graph some numbers that are already on the device?" (Strong)

### 3.3 I cinque meta-pattern da tenere sul muro

1. **Ogni dipendenza dalla rete in palestra è un difetto funzionale**, non una scelta architetturale: vale per auth, licenza, caricamento template e timer.
2. **Il timer è infrastruttura, non feature**: deve sopravvivere a background, schermo bloccato, cambio app, chiamata in arrivo; deve essere configurabile e disattivabile in modo persistente.
3. **Il log deve essere usabile con il pollice di una sola mano**, con lo storico della serie precedente visibile nel punto di input.
4. **I dati dell'utente non si prendono mai in ostaggio**: export sempre disponibile, gratis, corretto nelle unità di misura.
5. **La regressione è più costosa dell'innovazione**: non spostare, non togliere, non cambiare le abitudini motorie consolidate.

---

## 4. UX del logging durante l'allenamento

Questa è la sezione più importante del documento. In palestra l'utente è in piedi, sudato, con una mano occupata, sotto pressione di tempo, con 60-120 secondi di recupero da gestire. Ogni tap superfluo viene pagato decine di volte per sessione: una seduta tipo ha 20-30 serie, quindi **un tap risparmiato per serie equivale a 20-30 tap risparmiati per allenamento, circa 2.500 all'anno**.

### 4.1 Il principio: il lavoro va spostato fuori dalla sessione

Il pattern condiviso da tutte le app veloci è lo stesso: fare più lavoro prima e dopo la sessione, così che durante la sessione il lifter debba pensare e toccare il meno possibile ([Push/Pull](https://push-pull.app/blog/workout-log-track-sets-reps-weight)). Concretamente significa: la routine è già definita, i valori sono già precompilati, la serie si conferma e basta.

Setgraph dichiara esplicitamente il target: **loggare una serie in meno di 3 secondi**, con precompilazione di peso e reps della sessione precedente, frecce verdi sui miglioramenti e uno storico continuo per esercizio indipendente dalla routine da cui è stato aperto ([Setgraph](https://setgraph.app/ai-blog/app-to-track-my-workouts)).

### 4.2 I sei pattern di interazione che fanno la differenza

**1. Pre-fill dai dati della sessione precedente (impatto massimo)**
Il default di peso e reps della nuova serie è quello della serie corrispondente dell'ultima volta che quell'esercizio è stato eseguito. Se non è cambiato nulla l'utente fa **un solo tap**: conferma. È la singola ottimizzazione con il rapporto impatto/complessità migliore in assoluto ([Push/Pull](https://push-pull.app/blog/workout-log-track-sets-reps-weight), [Setgraph](https://setgraph.app/ai-blog/app-to-track-my-workouts)).
Attenzione al dettaglio: il pre-fill deve essere una **ghost value** (testo grigio, placeholder) e non un valore già scritto, altrimenti chi non tocca il campo logga per sbaglio dati che non ha fatto. Il compromesso migliore: valore pre-compilato ma la riga resta "non completata" finché non si conferma esplicitamente.

**2. La riga "Previous" sempre visibile**
Accanto a ogni serie deve esserci, senza tap aggiuntivi, quello che si è fatto la volta scorsa (`80 kg x 8`). È l'informazione che determina la decisione di carico, e nasconderla dietro un tap è l'errore di UX più costoso: obbliga a navigare mentre si è sotto il bilanciere.

**3. Conferma della serie con un solo gesto, in zona pollice**
Le app veloci mettono a destra di ogni riga un check grande (minimo 44x44 pt, meglio 48x48) che completa la serie, avvia il timer e passa alla successiva. Lo swipe orizzontale sulla riga è un'alternativa valida ma va sempre affiancato al tap: gli swipe non sono scopribili e con le mani sudate falliscono.
La ricerca di Steven Hoober su oltre 1.300 osservazioni sul campo mostra che il **49% degli utenti tiene il telefono con una mano e naviga solo col pollice** e che circa il **75% dei tocchi avviene col pollice**; il terzo inferiore dello schermo è comodamente raggiungibile, il terzo superiore richiede di cambiare presa ([Parachute Design](https://parachutedesign.ca/blog/thumb-zone-ux/), [Inkbot Design](https://inkbotdesign.com/mobile-ux/)). Tutto ciò che si usa durante la serie va nel terzo basso.

**4. Input numerico: tastierino custom, non la tastiera di sistema**
La tastiera nativa iOS/Android copre metà schermo, nasconde proprio la riga che si sta modificando e ha tasti pensati per scrivere testo. Le app di logging migliori usano un **tastierino numerico custom** ancorato in basso, con:
- cifre grandi, più `.` e `5` (mezzo disco/manubrio) come tasti dedicati;
- tasti **+/- con step configurabile** per unità (di default 2.5 kg per bilanciere, 1-2 kg per manubri, 1 rep per le ripetizioni);
- tasto "next" che salta al campo successivo senza chiudere il tastierino;
- eventuale riga di "valori suggeriti" (il carico precedente, il precedente +2.5, il precedente -2.5).

Se si resta su input HTML nativi (scelta legittima per un MVP), le regole non negoziabili sul web sono: `inputmode="decimal"` per il peso e `inputmode="numeric" pattern="[0-9]*"` per le reps, `enterkeyhint="next"`, e **font-size di almeno 16px** perché sotto quella soglia iOS Safari zooma automaticamente sul focus e distrugge il layout ([CSS-Tricks](https://css-tricks.com/finger-friendly-numerical-inputs-with-inputmode/), [David Luhr](https://luhr.co/blog/2025/07/01/a-deep-dive-on-the-ux-of-number-inputs/)).

**5. Autosalvataggio continuo, nessun pulsante "salva"**
Ogni modifica va persistita immediatamente in locale. L'allenamento in corso è una bozza sempre recuperabile: se l'app viene chiusa, il browser scarica la tab, il telefono si riavvia, alla riapertura si torna esattamente dove si era. Nessuna app seria chiede "vuoi salvare?" a metà seduta.

**6. Timer automatico legato al completamento**
Il rest timer parte da solo quando la serie viene segnata come completata, senza un tap dedicato (vedi sezione 5).

### 4.3 Conteggio dei tap: obiettivo realistico

| Scenario | Tap ideali | Note |
|---|---|---|
| Serie identica alla precedente | **1** | tap sul check |
| Stesso peso, reps diverse | **2-3** | +/- reps, poi check |
| Peso aumentato di uno step | **2-3** | + peso, poi check |
| Valore completamente nuovo | **4-6** | tastierino, due campi, check |
| Aggiungere una serie extra | **1-2** | il bottone "aggiungi serie" eredita i valori dell'ultima |

Regola di progetto: **il caso più frequente (serie uguale o quasi alla precedente) deve costare 1 tap**. Tutto il resto è secondario.

### 4.4 Il flusso ideale, schermata per schermata

**Schermata 0: Home / Oggi**
Un solo bottone primario grande in basso: "Inizia allenamento" con il nome della seduta prevista (es. "Push A"). Sotto, in secondo piano: ultima seduta fatta, streak settimanale, prossimo allenamento. Nessun carosello, nessun feed che rallenti l'accesso.

**Schermata 1: Allenamento attivo (la schermata dove si passa il 95% del tempo)**
Struttura verticale, dall'alto in basso:
1. **Header compatto e sticky**: nome seduta, cronometro totale, volume cumulato, bottone "Fine". Altezza massima ~56px, non deve rubare spazio.
2. **Barra timer di recupero** (compare solo quando attivo): countdown grande, `-15s`, `+15s`, `Salta`. Sticky sotto l'header oppure in fondo, sopra la zona pollice.
3. **Lista esercizi**, ognuno una card:
   - titolo esercizio + menu `...` (sostituisci, note, cronologia, rimuovi, superset);
   - intestazione colonne: `SERIE | PRECEDENTE | KG | REPS | ✓`;
   - una riga per serie, altezza minima 48px, con la serie corrente evidenziata;
   - riga "+ Aggiungi serie" che eredita i valori dell'ultima.
4. **Tastierino custom** che appare in overlay in basso quando un campo è in focus, senza far scrollare la lista.

Micro-interazioni: al completamento della serie, la riga diventa verde, feedback aptico breve, il timer parte, lo scroll avanza automaticamente alla serie successiva. Se la prestazione supera il record, appare un badge PR inline (non un modale che blocca).

**Schermata 2: Selettore esercizi (quando si aggiunge o si sostituisce)**
Ricerca in cima con focus automatico, filtri rapidi per gruppo muscolare e attrezzatura, sezione "recenti" e "nella tua routine" in testa. Tap singolo per aggiungere, niente conferme multiple. La sostituzione deve proporre alternative sensate per lo stesso pattern di movimento e con l'attrezzatura disponibile: è una delle richieste più frequenti degli utenti.

**Schermata 3: Fine allenamento**
Riepilogo in una schermata: durata, volume totale, numero di serie, **elenco dei record battuti**, muscoli allenati. Un bottone "Salva". Il riepilogo dei PR è il momento di rinforzo positivo più efficace di tutta l'app (vedi sezione 7).

### 4.5 Dettagli che gli utenti esperti notano subito

- **Warm-up set**: marcabili come tali e esclusi dal calcolo di volume e PR.
- **Superset**: esercizi raggruppati visivamente, il timer parte solo alla fine del giro.
- **Drop set / rest-pause / myo-reps**: almeno come tipo di serie etichettabile.
- **RIR/RPE per serie**: opzionale, in un campo laterale; serve per la progressione automatica.
- **Note per serie e per esercizio**: "presa più stretta", "fastidio spalla".
- **Plate calculator**: mostra quali dischi caricare per il peso target, dato il bilanciere e i dischi disponibili. Feature a bassissimo costo e altissimo gradimento.
- **Unità kg/lb** e passo di incremento configurabili per esercizio.
- **Modifica retroattiva**: poter correggere una serie già chiusa senza riaprire tutto l'allenamento.

---

## 5. Timer di recupero: comportamento atteso e vincoli tecnici su PWA

Il rest timer è, insieme al pre-fill, la feature che separa un'app usabile da una che viene disinstallata. È anche il punto in cui una PWA rischia di fare una figura peggiore di un'app nativa, quindi va progettato con i vincoli in testa fin dall'inizio.

### 5.1 Comportamento di riferimento (quello che fanno le app native)

Lo standard di mercato è definito da Hevy, che dal 2024 usa le Live Activity di iOS: il timer di recupero compare su lock screen e Dynamic Island con esercizio corrente, serie successiva e countdown; da lì si può **aggiungere o togliere 15 secondi, saltare il recupero e persino marcare la serie come completata senza sbloccare il telefono**; a zero l'app manda una notifica ([Hevy](https://www.hevyapp.com/features/live-activity/)).

Checklist funzionale completa:

| Comportamento | Priorità | Note |
|---|---|---|
| Auto-start al completamento della serie | Must | zero tap dedicati |
| Durata di default per esercizio (e per tipo di serie) | Must | 90s compound, 60s isolamento, 180s+ forza |
| Countdown grande e leggibile a distanza di braccio | Must | il telefono è sulla panca |
| `+15s` / `-15s` / `Salta` | Must | tap target grandi, zona pollice |
| Suono di fine | Must | con volume e scelta suono |
| Vibrazione | Should | fondamentale in palestra rumorosa |
| Notifica di sistema a timer scaduto | Must | l'utente guarda Instagram durante il recupero |
| Countdown visibile fuori dalla schermata dell'allenamento | Should | barra persistente in app, notifica/badge fuori |
| Schermo che resta acceso durante la sessione | Must | wake lock |
| Timer che continua correttamente se l'app va in background | Must | ricalcolo da timestamp, non da tick |
| Modifica della durata al volo, memorizzata per quell'esercizio | Should | |
| Auto-skip/auto-start della serie successiva | Nice | opzionale, divide gli utenti |

### 5.2 La regola tecnica numero uno: il timer non è un contatore, è una differenza di timestamp

Non implementare mai il timer come `setInterval` che decrementa una variabile. In background i timer JavaScript vengono throttlati o congelati, e il countdown "si ferma": è una delle lamentele più diffuse su tutte le piattaforme.

Implementazione corretta:
1. al completamento della serie si salva `restStartedAt = Date.now()` e `restDuration` in memoria e in IndexedDB;
2. il rendering calcola sempre `rimanente = restDuration - (Date.now() - restStartedAt)`;
3. su `visibilitychange` (ritorno in foreground) si ricalcola e si riallinea;
4. se al ritorno il tempo è già scaduto, si mostra lo stato "recupero finito da Xs" invece di un countdown sbagliato.

Così il timer è corretto anche se il browser ha congelato tutto per due minuti.

### 5.3 Vincoli reali su PWA (iOS e Android) e workaround

**Wake lock (schermo acceso).** Buona notizia: la Screen Wake Lock API funziona anche nelle home screen web app su iOS e iPadOS **dal 18.4** ([WebKit](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)); su Android Chrome è supportata da tempo. Da chiamare all'avvio dell'allenamento e da **ri-acquisire su `visibilitychange`**, perché il lock viene rilasciato automaticamente quando la pagina passa in background. Da rilasciare a fine seduta per non bruciare batteria.
Nota storica: prima del 18.4 la wake lock non funzionava nelle PWA installate su iOS ([riferimento](https://x.com/dannymoerkerke/status/1803055577100091874)), e il workaround era un video silenzioso in loop; oggi non serve più.

**Notifiche locali programmate: NON esistono sul web.** La Notification Triggers API, che avrebbe permesso di schedulare una notifica locale senza rete, è stata abbandonata da Google e non è mai stata standardizzata ([Chrome for Developers](https://developer.chrome.com/docs/web-platform/notification-triggers)). Conseguenza diretta: **una PWA non può garantire una notifica a timer scaduto quando l'app è chiusa o in background profondo**. Questo va accettato e progettato intorno, non nascosto.

Le tre strade praticabili, in ordine di robustezza:
1. **App in foreground con wake lock attivo** (scenario di gran lunga più comune se lo schermo resta acceso): il timer suona con Web Audio, vibra su Android, mostra una `Notification` locale dal service worker. Funziona bene ovunque.
2. **Web Push dal server** con notifica schedulata all'orario di fine recupero. Su iOS richiede la PWA installata in home screen (iOS 16.4+), e da Safari 18.4 esiste il **Declarative Web Push** che non richiede nemmeno un service worker ([WebKit](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/), [WebKit Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). Costo: serve backend e connettività, quindi è incompatibile con l'offline-first puro. Ha senso come *fallback opzionale*, non come meccanismo primario.
3. **Audio in riproduzione continua** (traccia silenziosa che tiene viva la sessione audio e poi riproduce il beep). È l'hack storico: sconsigliato perché interrompe la musica dell'utente (che in palestra è esattamente ciò che non si deve fare), consuma batteria, e su iOS l'audio dalla lockscreen smette di funzionare dopo circa 30 secondi di pausa ([Apple Developer Forums](https://developer.apple.com/forums/thread/762582)).

**Suono.** Web Audio richiede uno "sblocco" da gesto utente: va inizializzato l'`AudioContext` al primo tap dell'utente (per esempio sul bottone "Inizia allenamento") e tenuto vivo, altrimenti il beep di fine timer non parte. Il suono delle notifiche push su iOS per PWA non è controllabile dallo sviluppatore ([Progressier](https://intercom.help/progressier/en/articles/6753668-is-it-possible-for-a-pwa-to-play-a-sound-upon-receiving-a-push-notification)).

**Vibrazione.** `navigator.vibrate()` funziona su Android Chrome, **non è supportata ufficialmente da WebKit su iOS**; esistono hack basati su elementi UI nativi che generano feedback aptico, ma sono fragili e cambiano da una versione iOS all'altra ([caniuse](https://caniuse.com/mdn-api_navigator_vibrate), [ios-vibrator-pro-max](https://github.com/samdenty/ios-vibrator-pro-max)). Progettare assumendo che su iPhone la vibrazione non ci sia.

**Live Activity / Dynamic Island**: non disponibili al web. Su Android si può ottenere qualcosa di simile con una notifica persistente aggiornata dal service worker, ma solo mentre la pagina è viva.

### 5.4 Comportamento consigliato per la nostra PWA

- Wake lock attivo per tutta la durata della seduta, con badge discreto "schermo attivo" e possibilità di disattivarlo.
- Timer calcolato da timestamp, persistito, resiliente a chiusura e riapertura.
- Beep + `Notification` locale quando la pagina è visibile o comunque viva.
- Su Android anche vibrazione.
- Messaggio onesto nelle impostazioni: "per ricevere l'avviso di fine recupero tieni l'app aperta; su iPhone le notifiche a schermo spento richiedono la connessione e l'app installata".
- Nessun hack con audio silenzioso di default; eventualmente opzione avanzata attivabile.

---

## 6. Onboarding

### 6.1 Cosa fanno davvero le migliori app

| App | Lunghezza onboarding | Filosofia |
|---|---|---|
| **Hevy** | Quasi nullo, dal download al primo set in meno di 90 secondi, nessun paywall iniziale, nessun quiz | Il valore è lo strumento, non il piano: non serve profilare ([RepReturn](https://repreturn.com/hevy-app-review/)) |
| **Strong** | Nessun quiz (nessun generatore di piani) | "Fai tu il lavoro, l'app ti aiuta a pianificare, eseguire e vedere i progressi" |
| **Fitbod** | **20 schermate** | La prima domanda non è demografica ma motivazionale; attrezzatura e dettagli arrivano dopo il primo workout suggerito; tutorial progressivi; permesso notifiche con framing concreto ([teardown App Fuel](https://www.theappfuel.com/examples/fitbod_onboarding), [Page Flows](https://pageflows.com/post/ios/onboarding/fitbod/)) |
| **Freeletics** | **15 schermate** | Quiz-heavy: altezza, peso, età, obiettivi prima di mostrare qualsiasi cosa, poi animazione "stiamo costruendo il tuo piano" ([App Fuel](https://theappfuel.com/examples/freeletics_onboarding)) |
| **Ladder** | Quiz medio | Chiede anche **quali esercizi NON piacciono** e il tempo realmente disponibile ([Garage Gym Reviews](https://www.garagegymreviews.com/ladder-app-review)) |
| **Juggernaut AI** | Questionario lungo | Giustificato: ogni risposta entra davvero nell'algoritmo di periodizzazione ([review](https://healthynexercise.com/ai-workouts/juggernautai-review/)) |
| **Alpha Progression** | Medio | Profili palestra riusabili: l'app riadatta il piano all'attrezzatura effettivamente presente ([review](https://fitnessdrum.com/alpha-progression-app-review/)) |
| **Nike Training Club** | Minimale | Account, personalizzazione annunci, poi subito il contenuto ([Mobbin](https://mobbin.com/explore/flows/e48bb710-4ac2-4d31-948e-3f6b703f5edb)) |

All'estremo opposto ci sono flussi da growth aggressivo: app fitness con 96 e persino 177 schermate tra onboarding e paywall ([ScreensDesign](https://screensdesign.com/articles/fitness-app-onboarding-examples/)). Sono macchine da conversione, non modelli di UX.

### 6.2 I numeri dell'abbandono

**Retention della categoria health & fitness, peggiore della media:** circa 20% a D1, 7-8.5% a D7, **3-4% a D30** contro una media cross-industry del 5-7% ([UXCam](https://uxcam.com/blog/mobile-app-retention-benchmarks/), [RetentionCheck](https://retentioncheck.com/churn-benchmarks/fitness-apps), [Business of Apps](https://www.businessofapps.com/data/health-fitness-app-benchmarks/)). Un'analisi riporta che il 70% degli utenti abbandona entro i primi 100 giorni, con la curva più ripida nelle prime due settimane ([Sahha](https://sahha.ai/blog/health-app-churn-retention/)).

**Drop-off per stadio di onboarding** ([SEMNexus](https://semnexus.com/app-onboarding-flow-benchmarks-where-users-drop-off-2026)):

| Stadio | Drop-off | Causa |
|---|---|---|
| Apertura app | 5-15% | splash lento o confuso |
| Richiesta permessi | 20-40% | chiesti troppo presto |
| Creazione account | 25-45% | troppi campi obbligatori |
| Profile setup | 15-30% | step obbligatori prima del valore |
| **Paywall** | **30-60%** | mostrato prima del valore core |
| Feature tour | 10-25% | tutorial che copre la UI |
| Prima azione (aha moment) | 15-35% | troppo in fondo al flusso |

Le app fitness hanno il calo più ripido proprio allo **stadio 4, il profile setup**. Un completion rate sano è 60-80% per flussi di 3-5 step; sotto il 40% per flussi lunghi con paywall anticipato. Richiedere il signup prima dell'esperienza aumenta l'abbandono del **56%** ([Descope](https://www.descope.com/learn/post/progressive-profiling)).

**Causa strutturale:** nel fitness il valore è differito. Un'app bancaria è utile al primo tap; un'app di allenamento richiede settimane prima che l'utente veda risultati. Tutto il design dell'onboarding deve compensare questo ritardo con valore immediato e percepibile.

### 6.3 Paywall: quando e come

Dati RevenueCat e Adapty ([State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps), [Adapty health & fitness benchmarks](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/)):
- Health & Fitness guida la conversione download-to-paid, mediana **2.9%**, top quartile oltre 6.2%, top performer oltre 23%.
- Trial-to-paid mediano nella categoria: **39.9%**, top decile 68.3%.
- **86.1% delle conversioni da trial avviene nella prima sessione** (day 0).
- Il paywall di onboarding con trial è il piazzamento più performante in assoluto: **1.78% install-to-paid**.
- Health & Fitness è la categoria con la maggiore adozione di piani annuali: **68%**.
- Hard paywall: 12.11% di conversione mediana contro 2.18% del freemium, e +21% di LTV.

Contro-evidenza importante: le app che mostrano il paywall dopo un "value moment" misurabile hanno un trial start rate **2.1x** più alto e un trial-to-paid 1.5-2x superiore rispetto all'hard paywall immediato ([RocketShip HQ](https://www.rocketshiphq.com/paywall-optimization-fitness-apps/)).

**Traduzione pratica:** l'hard paywall conviene quando il prodotto è il contenuto (programmi, video, coaching). Il freemium limitato conviene quando il prodotto è un habit loop, cioè un tracker. Per un'app di logging il modello Hevy (log gratis e illimitato, analytics avanzate a pagamento) è quello coerente con i dati.

### 6.4 Domande utili vs domande fuffa

**La regola anti-fuffa più netta emersa dalla ricerca:** se le risposte "perdere peso", "ridurre lo stress" e "divertirsi" producono le stesse identiche schermate successive, la domanda crea **falsa personalizzazione**. O ogni risposta si collega a un cambiamento visibile nel piano, o la domanda va tolta ([ScreensDesign](https://screensdesign.com/articles/fitness-app-onboarding-examples/)).

**Utili, perché entrano matematicamente nella generazione del piano:**
1. **Giorni a settimana** e **minuti per sessione**: il vincolo più duro, determina split e volume allocabile.
2. **Luogo e attrezzatura disponibile**: filtra il database esercizi. Da modellare come **profilo palestra riusabile** (casa / palestra / hotel), non come domanda una tantum.
3. **Esperienza**: determina volume iniziale, velocità di progressione, complessità degli esercizi.
4. **Obiettivo** (forza / ipertrofia / ricomposizione / resistenza): determina rep range, intensità, recuperi.
5. **Infortuni e limitazioni**: esclusione di esercizi. È anche una questione di sicurezza e di churn (un esercizio che fa male fa disinstallare).
6. **Esercizi sgraditi** (pattern Ladder): non è cortesia, è aderenza. Un piano non eseguito vale zero.

Il riferimento scientifico per il volume: la meta-regressione dose-response più aggiornata mostra rendimenti decrescenti oltre un certo volume, con un range operativo di circa **12-20 serie settimanali per gruppo muscolare** e una soglia minima sensata intorno alle 10 ([Pelland et al., SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460), [PubMed](https://pubmed.ncbi.nlm.nih.gov/35291645/)).

**Fuffa (o al più commitment device, mai input dell'algoritmo):**
- **Somatotipo** (ectomorfo / mesomorfo / endomorfo): costrutto senza validità predittiva per la programmazione.
- **Quiz motivazionali** ("quanto sei determinato da 1 a 10"): non entrano nel piano. Hanno una funzione reale, aumentare il commitment percepito, ed è onesto usarli sapendolo, ma non vanno spacciati per personalizzazione.
- **Peso, altezza ed età chiesti per primi**: servono per stime caloriche, non per un piano di forza. Fitbod li ha deliberatamente spostati dopo.
- **Assessment lungo sul livello di fitness**: la prima sessione reale misura la capacità meglio di qualsiasi questionario ([UXmatters](https://www.uxmatters.com/mt/archives/2025/07/designing-a-fitness-platform-ux-design-challenges-and-solutions.php)).

### 6.5 Flusso di onboarding proposto

Obiettivo: **dal primo avvio al piano generato in meno di 90 secondi, senza account e senza paywall**.

| # | Schermata | Contenuto | Note |
|---|---|---|---|
| 0 | Welcome | Una frase sul valore + "Crea il mio piano" | Nessun account, nessuna email |
| 1 | Obiettivo | Forza / Massa / Ricomposizione / Rimettersi in forma | 4 card grandi, tap singolo |
| 2 | Esperienza | Principiante / Intermedio / Avanzato, con una riga di autodescrizione ciascuna | Evita "da 1 a 10" |
| 3 | Disponibilità | Giorni a settimana (2-6) + minuti per sessione (30/45/60/90) | Due selettori, una schermata |
| 4 | Luogo e attrezzatura | Palestra completa / Home gym / Solo corpo libero, poi checklist attrezzi se "home" | Salvato come profilo riusabile |
| 5 | Limitazioni | Chip selezionabili: spalla, schiena, ginocchio, polso, nessuna | Opzionale ma ben visibile |
| 6 | **Piano generato** | Split, esercizi della settimana 1, volume per gruppo muscolare | **Il momento del valore. Modificabile qui, prima di qualsiasi richiesta** |
| 7 | Inizia | "Inizia il primo allenamento" | Dati antropometrici, account e notifiche NON richiesti ancora |

Poi, in **progressive profiling**:
- **Peso corporeo**: chiesto alla prima apertura della sezione progressi, non prima.
- **Notifiche**: chieste alla seconda o terza sessione, non durante l'onboarding. Per app con time-to-value lungo il ritorno è già di per sé un segnale di intenzione ([Digia](https://www.digia.tech/post/permission-requests-loading-states-mobile-onboarding/)).
- **Account**: proposto dopo il primo allenamento completato, con la motivazione giusta ("salva i tuoi dati su tutti i dispositivi"), mai come cancello d'ingresso.
- **Installazione PWA**: proposta dopo la prima sessione conclusa, quando l'utente ha capito cosa sta installando.

Personalizzare visibilmente in base alle risposte vale, nei dati disponibili, +8.5% di trial start, +17% di conversione e circa +35% di retention al primo utilizzo ([fonte](https://vp0.com/blogs/app-onboarding-screen-template)). La condizione è che la personalizzazione sia reale.

---

## 7. Progressi e motivazione

### 7.1 Cosa mostrano le app di riferimento

**Hevy** ha il set più completo tra i tracker mainstream ([Hevy gym performance](https://www.hevyapp.com/features/gym-performance/), [Hevy training chart](https://www.hevyapp.com/features/training-chart/)):
- body graph degli ultimi 7 giorni (quali muscoli sono stati allenati);
- conteggio serie per gruppo muscolare su finestre 30 giorni / 3 mesi / anno / all-time;
- muscle distribution: frequenza, durata, volume load, numero di serie per gruppo;
- per esercizio: peso massimo, 1RM proiettato, best set, volume di sessione, reps massime, PR a rep target specifici;
- Strength Level: confronto con pari per età, peso e sesso su squat, panca e stacco;
- heatmap muscolare, warm-up calculator e storico completo sono dietro Pro; il free tier limita lo storico dei grafici a 3 mesi.

**Alpha Progression**: dopo ogni allenamento mostra ogni record battuto (peso, reps, volume, 1RM e 10RM stimati, best per gruppo muscolare), grafici per forza, volume, serie per muscolo, allenamenti per settimana, peso e misure, **confronto del volume settimanale contro target ipertrofici evidence-based**, gestione della fatica cumulativa e deload ([review](https://fitnessdrum.com/alpha-progression-app-review/)).

**Boostcamp**: heatmap del volume per muscolo e Strength Score nel tier Pro.

### 7.2 Gerarchia delle metriche: cosa motiva e cosa è vanity

I dati mostrati dai fitness tracker sono spesso più vanity che insight: i passi sono un buon proxy di "quanto ti muovi" e un pessimo proxy di "quanto sei in forma" ([analisi](https://www.linkedin.com/pulse/vanity-metrics-best-we-can-do-fitness-trackers-piers-scott)). Nel contesto della sala pesi la gerarchia che regge è questa:

| # | Metrica | Perché | Giudizio |
|---|---|---|---|
| 1 | **Progressione per esercizio** (peso x reps nel tempo) | È l'unica cosa che l'utente controlla direttamente | La migliore in assoluto |
| 2 | **Record battuti nella sessione** | Feedback immediato, alta densità di rinforzo | Essenziale |
| 3 | **Aderenza** (sessioni fatte / pianificate) | Predittiva del risultato, non punitiva se ben disegnata | Essenziale |
| 4 | **Volume per gruppo muscolare vs target** | Azionabile, collega il log alla programmazione | Alto valore |
| 5 | **1RM stimato** | Mostra progressi anche a parità di carico | Valido solo su serie 2-10 reps |
| 6 | **Heatmap muscolare** | Immediata, comunica squilibri | Utile e molto amata, ma decorativa |
| 7 | **Volume totale / tonnellaggio** | Utile come trend | **Vanity metric interna alla sala pesi**: si gonfia facendo più reps leggere |
| 8 | **Streak giornaliero** | Motivante a breve, pericoloso a lungo | Da riprogettare (vedi sotto) |
| 9 | **Readiness score** da wearable | Costrutto di marketing | Da evitare |

**1RM stimato, nota tecnica che gli utenti esperti verificano.** L'accuratezza è buona (circa ±5%) nel range 2-10 reps e degrada a ±15-20% oltre le 10; Epley funziona meglio su 6-10 reps, Brzycki su 1-6, e sotto le 5 concordano entro il 2-3% ([Arvo](https://arvo.guru/resources/one-rep-max-formulas), [studio comparativo a 7 equazioni](https://www.tandfonline.com/doi/abs/10.1207/S15327841MPEE0602_1)). Mostrare un 1RM calcolato su una serie da 15 reps significa mostrare rumore, e infatti c'è chi lo scrive nelle recensioni: "1 rep max figures are completely useless on this app... but don't actually reflect the strength of a user if you do more than 5 reps" (Hevy, 2026).
**Regola:** calcolare l'e1RM solo su serie da 1 a 10 reps, dichiarare la formula usata, non usarlo per classifiche.

**Readiness / recovery score: da evitare.** Marco Altini, uno dei riferimenti sull'HRV applicato, è esplicito nel dire che la readiness è un costrutto inventato dalle app e non può essere accurato perché troppi fattori di recupero non sono misurabili da un wearable ([Altini](https://medium.com/@altini_marco/on-heart-rate-variability-hrv-and-readiness-394a499ed05b)). Per un'app di sala pesi **RIR/RPE per serie e volume per gruppo muscolare sono indicatori di fatica molto più difendibili**.

### 7.3 Gamification: cosa dice l'evidenza

**Funziona, ma con effect size piccoli e fortemente dipendenti dal design.**

- **STEP UP (JAMA Internal Medicine, 2019)**, 602 adulti, 4 bracci. Incremento medio di passi giornalieri contro controllo nelle 24 settimane: supporto sociale +689, collaborazione +637, competizione +920 (tutti significativi). **Nel follow-up a 12 settimane dopo la fine dell'intervento solo supporto (+428) e competizione (+569) restano significativi; la collaborazione crolla a +126 non significativo** ([JAMA](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761)).
- **Meta-analisi JMIR Serious Games 2025**, 16 RCT, 7.472 partecipanti: effetto piccolo ma significativo sull'attività moderata-vigorosa (SMD 0.15), non significativo su passi e sedentarietà. Moderatori decisivi: interventi basati sulla self-determination theory SMD 0.39 contro 0.01 per le sole behavior change techniques; **reward e feedback SMD 0.19 contro interazione sociale da sola SMD -0.07**; durata oltre 12 settimane SMD 0.14 contro 0.02 per periodi più brevi ([JMIR](https://games.jmir.org/2025/1/e68151)).
- **Meta-analisi su pazienti cardiovascolari (JMIR 2025)**: effetto a breve g=0.32, a follow-up g=0.20; nella meta-regressione **il "feedback" è il predittore più importante (0.71)**, l'avatar il secondo ([JMIR](https://games.jmir.org/2025/1/e64410)).
- **Ricchezza di feature a S invertita**: l'intenzione di aderire cresce da bassa a moderata ricchezza di gamification e **peggiora quando le feature diventano eccessive** ([Frontiers in Psychology, 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1671543/full)).

**Sintesi:** l'ingrediente che pesa di più non sono i badge, è il **feedback**. La competizione regge meglio nel tempo della collaborazione. Gli effetti richiedono più di 12 settimane per emergere, quindi la gamification non salva la D7.

### 7.4 Cosa è controproducente

Lo studio più rilevante sui danni: UCL, Loughborough e University of Westminster hanno analizzato circa 60.000 post su X relativi a cinque app fitness, di cui circa 13.000 negativi. Emergono senso di colpa e vergogna, target irrealistici generati senza verifica di fattibilità, esercizio compulsivo guidato dalle notifiche invece che dal piacere, utenti che "gamano" il sistema smettendo di loggare e poi si sentono in colpa ([sintesi](https://refractor.io/health-wellbeing/popular-fitness-apps-may-demotivate-users/)).

**Streak: il meccanismo e il suo rovescio.** Funzionano per loss aversion, ma più lungo è lo streak più violenta è la rottura: chi perde 7 giorni ricomincia, chi perde 365 può abbandonare del tutto; gli streak sopra i 90 giorni hanno il rischio di abbandono più alto ([Trophy](https://trophy.so/blog/what-happens-when-users-lose-streaks)). Nel dataset delle recensioni questo è documentato: "it's pity to loose a record progress of nearly 40 weeks streak" (Freeletics).

**Errore concettuale specifico per un'app di sala pesi:** un programma di forza non è giornaliero, quindi **uno streak daily è sbagliato per costruzione**. Va usato uno **streak settimanale sull'aderenza** ("3 allenamenti su 3 questa settimana"), con giorni di riposo legittimi e recupero non umiliante dopo un'interruzione.

**Overjustification.** Introdurre ricompense esterne per un comportamento già intrinsecamente motivato può ridurne la motivazione ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10807424/)). E il piacere delle feature gamificate cala con l'uso, anche quando la compliance resta alta ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5684077/)).

### 7.5 Raccomandazione operativa

**Da fare:**
- schermata di fine allenamento con **l'elenco dei record battuti**: è il momento di rinforzo più efficace dell'intera app e costa poco;
- frecce e delta inline durante il logging ("+2.5 kg rispetto alla scorsa volta");
- grafico di progressione per esercizio come vista principale della sezione progressi;
- volume settimanale per gruppo muscolare confrontato con una banda target (10-20 serie);
- heatmap del corpo per gli ultimi 7 giorni: alto gradimento, complessità media, ottimo rapporto qualità/prezzo percepito;
- aderenza settimanale al posto dello streak giornaliero.

**Da non fare:**
- notifiche di rimprovero ("non ti alleni da 5 giorni") e richieste di recensione durante la sessione;
- leaderboard pubbliche di forza assoluta (comparison anxiety, e i numeri sono anche facilmente falsificabili);
- badge generati da logica sbagliata (il caso Nike del badge "primo allenamento" ogni giorno distrugge la credibilità dell'intero sistema);
- readiness score;
- classifiche basate su 1RM stimati.

---

## 8. Feature PWA-specifiche: cosa funziona davvero oggi

Dati verificati a settembre 2026. Riferimenti primari: WebKit blog, Chrome for Developers, MDN, caniuse.

### 8.1 Tabella di supporto

| Capability | iOS Safari / Home Screen Web App | Android Chrome | Note operative |
|---|---|---|---|
| Service worker + Cache API | Sì (da iOS 11.3) | Sì | base dell'offline |
| IndexedDB | Sì | Sì | database locale |
| Installabilità / Add to Home Screen | Sì, e da **iOS 26 ogni sito può essere aggiunto come web app senza requisiti di "installability"** ([WebKit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)) | Sì, con prompt | su iOS **non esiste `beforeinstallprompt`**: serve istruire l'utente ("Condividi > Aggiungi alla schermata Home") |
| Web App Manifest | Sì (icone, nome, theme color, display standalone) | Sì | su iOS 26 il manifest resta utile ma non è più obbligatorio |
| Push notifications | Sì, **solo se installata in home screen**, da iOS 16.4; da Safari 18.4 anche **Declarative Web Push senza service worker** ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [WebKit 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)) | Sì, anche da browser | su iOS il suono della notifica non è controllabile |
| Notification API locale (mentre la pagina è viva) | Sì (web app installata) | Sì | |
| **Notifiche locali programmate** (Notification Triggers) | **No** | **No** (abbandonata da Google, [fonte](https://developer.chrome.com/docs/web-platform/notification-triggers)) | impatto diretto sul rest timer |
| Screen Wake Lock | **Sì da iOS/iPadOS 18.4 nelle home screen web app** ([WebKit](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)) | Sì | va ri-acquisita al ritorno in foreground |
| Badging API (`setAppBadge`) | Sì da iOS 16.4 (web app installata) | Sì | utile per "allenamento in corso" o promemoria |
| Background Sync API | **No** | Sì | su iOS serve sync opportunistico al foreground |
| Periodic Background Sync | **No** | Sì (con engagement, solo PWA installata) | |
| Background Fetch | **No** | Sì | |
| Web Share API (`navigator.share`) | Sì | Sì | ottima per condividere un riepilogo |
| **Web Share Target** (ricevere condivisioni) | **No** (bug WebKit [194593](https://bugs.webkit.org/show_bug.cgi?id=194593) aperto) | Sì | |
| Vibration API | **No** (WebKit non l'ha mai spedita, [caniuse](https://caniuse.com/mdn-api_navigator_vibrate)) | Sì | |
| Web Audio | Sì, ma richiede sblocco da gesto utente | Sì | |
| File System Access / Contact Picker | No | Parziale | export via download/Blob funziona ovunque |
| Bluetooth / NFC | No | Sì (Chrome) | rilevante solo per cardiofrequenzimetri |
| Blocco orientamento schermo | No | Sì | |

### 8.2 Storage e persistenza: il rischio più sottovalutato

- Il famigerato limite dei **7 giorni** di WebKit (cancellazione di IndexedDB, Cache API e service worker per origini senza interazione) **si applica alla navigazione in Safari, non alle web app aggiunte alla schermata Home**, che hanno un contatore di utilizzo proprio e vengono considerate "usate" quando le si apre ([WebKit, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- La quota per origine in Safari moderno è legata allo spazio disco (ordine di grandezza: percentuale rilevante del disco), non più il vecchio tetto di 50 MB che gira ancora in molti articoli divulgativi; per un'app di logging testuale il problema non si pone (un anno di allenamenti sta in pochi MB).
- **Rimane però vero che i dati locali sono cancellabili**: pulizia dati Safari, spazio esaurito, disinstallazione dalla home screen. Un'app che tiene i dati **solo** in locale prima o poi perde i dati di qualcuno. Servono: export manuale sempre disponibile, e/o backup cloud opzionale.
- Chiamare `navigator.storage.persist()` su Android aumenta la resistenza all'eviction; su iOS l'API è di fatto non concessiva ma non fa danno.

### 8.3 Implicazioni di architettura

1. **Offline-first non è una feature, è il vincolo progettuale.** In palestra, specie nei seminterrati, non c'è segnale. L'app deve funzionare al 100% senza rete: local database come sorgente di verità, UI guidata dallo stato locale, rete come ottimizzazione ([Local-first PWA architecture](https://blog.openreplay.com/local-first-pwa-architecture/), [LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)).
2. **Niente Background Sync su iOS**: la coda di sincronizzazione va svuotata a ogni ritorno in foreground e a ogni evento `online`. Semplice e sufficiente.
3. **Service worker con precache dell'app shell** e strategia stale-while-revalidate per gli asset; le immagini degli esercizi sono l'unico asset pesante e vanno cacheate su richiesta, non tutte in anticipo.
4. **Aggiornamenti**: WebKit è aggressivo nel caching; prevedere un banner "nuova versione disponibile, ricarica" gestito da `updatefound` / `skipWaiting`.
5. **Safe area insets** (`env(safe-area-inset-bottom)`) obbligatori: in standalone su iPhone la barra inferiore va sopra la home indicator, altrimenti i bottoni più usati finiscono sotto il dito sbagliato.
6. **Onboarding all'installazione**: poiché su iOS non c'è prompt automatico, serve una schermata che spieghi come installare, mostrata solo agli utenti Safari non ancora in standalone (rilevabile con `window.navigator.standalone` o `display-mode: standalone`). Senza installazione si perdono push, badge e wake lock.

---

## 9. Monetizzazione e struttura dati

### 9.1 I tre modelli di monetizzazione in uso

| Modello | Chi lo usa | Come funziona | Quando ha senso |
|---|---|---|---|
| **Freemium con log illimitato** | Hevy, FitNotes (gratis puro), Boostcamp | Logging e routine gratis, a pagamento vanno analytics avanzate, storico lungo, heatmap, esercizi custom illimitati | Prodotto = habit loop. È il modello coerente per un tracker |
| **Free tier castrato** | Strong (3 routine, grafici Pro), JEFIT (con ads) | Il gratuito è una demo permanente | Genera attrito e recensioni negative, ma converte |
| **Hard paywall / trial obbligatorio** | Fitbod, Freeletics, Centr, Peloton, Alpha Progression | Nessun uso reale senza abbonamento | Prodotto = contenuto e programmazione |

Ordini di grandezza dei prezzi verificati nel 2026: Hevy Pro circa 2,99 $/mese, 23,99 $/anno, 74,99 $ lifetime; Strong PRO 4,99 $/mese, 29,99 $/anno; Boostcamp Pro 14,99 $/mese, 59,99 $/anno; JEFIT Elite 12,99 $/mese, 69,99 $/anno; Alpha Progression 12,99 $/mese, 79,99 $/anno; Fitbod 15,99 $/mese, 95,99 $/anno dopo l'aumento del 2026 ([confronto prezzi](https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison), [Boostcamp](https://www.boostcamp.app/alternatives/fitbod), [Alpha Progression](https://push-pull.app/blog/push-pull-vs-alpha-progression)).

Il dato strategico: nella categoria health & fitness i **piani annuali valgono il 61-68% del fatturato** e l'LTV per install (1,21 $) è il più alto dell'App Store ([Adapty](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/), [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)). Una PWA, non passando dagli store, evita la commissione del 15-30%, il che cambia radicalmente i conti: si può essere competitivi a metà prezzo con lo stesso margine. In compenso si perde la fiducia del billing di sistema, quindi la disdetta deve essere **visibile e in un tap**, altrimenti si finisce nella categoria di anti-pattern numero uno.

### 9.2 Cosa tengono in locale e cosa in cloud

- **Hevy**: cloud sync in tutti i piani, incluso il free; logging offline con sincronizzazione al ritorno online; export CSV di allenamenti e misure ([help center](https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy)).
- **Strong**: storicamente più orientato al backup locale, con export CSV considerato il migliore della categoria. Ma la validazione online dell'abbonamento ha generato lamentele in palestra.
- **JEFIT**: nel caso peggiore descritto dagli utenti, dati **non** persistiti localmente se non sincronizzati ("if data is not exported to their server it is not saved locally which is nonsensical"): esattamente ciò che non va fatto.
- **FitNotes**: puramente locale, con backup manuale. Amatissimo per privacy e velocità, criticato per assenza di sync.

### 9.3 Architettura dati consigliata per la nostra PWA

**Sorgente di verità: il dispositivo.** IndexedDB (via Dexie o simile) come database locale, UI guidata dallo stato locale, rete come ottimizzazione ([local-first PWA](https://blog.openreplay.com/local-first-pwa-architecture/), [LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)).

Modello dati minimo:

```
exercises        id, nome, muscoli primari/secondari, attrezzatura, categoria, istruzioni, immagini
                 (seed statico dal dataset, + esercizi custom dell'utente)
routines         id, nome, note, ordine
routine_items    routine_id, exercise_id, ordine, serie previste, rep range, rest_sec, superset_group
workouts         id, routine_id, started_at, ended_at, note
sets             id, workout_id, exercise_id, indice, kg, reps, rir, tipo (work/warmup/drop), completed_at, is_pr
body_metrics     data, peso, misure
settings         unita, step incremento per attrezzo, rest default, suoni, wake lock
sync_queue       operazioni pendenti con timestamp e stato (solo se si aggiunge il cloud)
```

Tre scelte che pagano:
1. **Denormalizzare lo storico per esercizio**: la query "ultima prestazione su questo esercizio" viene eseguita a ogni riga di ogni serie, deve essere istantanea. Indice su `(exercise_id, completed_at desc)` oppure una tabella `exercise_last` mantenuta aggiornata.
2. **Log append-only con id generati dal client** (UUID o ULID): rende la sincronizzazione futura banale e idempotente, e permette di non perdere nulla in caso di conflitto.
3. **Export sempre disponibile e gratuito**: CSV e JSON, con le unità di misura corrette (l'errore di Strong sull'export sempre in kg è citato nelle recensioni). È anche la migliore difesa contro l'accusa di lock-in.

Per il sync cloud, se e quando arriverà: last-write-wins per riga con timestamp è sufficiente in un'app mono-utente (gli allenamenti sono per definizione eventi non concorrenti), ma vanno gestiti i casi di due dispositivi offline sullo stesso allenamento. Per l'MVP la scelta corretta è **nessun backend**, con export manuale come rete di sicurezza.

**Il database esercizi.** Il progetto ha già in casa [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (cartella `db-exercise`): **876 esercizi** di pubblico dominio in JSON, con muscoli primari e secondari, attrezzatura, livello, meccanica (composto/isolamento), istruzioni e immagini. Distribuzione per attrezzatura: 170 bilanciere, 123 manubri, 122 "other", 111 corpo libero, 81 cavi, 67 macchine, 56 kettlebell. È esattamente ciò che serve per filtrare per attrezzatura disponibile e per costruire la heatmap muscolare, senza dover licenziare nulla. Da fare: traduzione italiana dei nomi (i 200-300 esercizi realmente usati coprono il 95% dei casi) e deduplica.

---

## 10. Raccomandazione finale: MVP vs V2

### 10.1 Il posizionamento da scegliere

Il mercato è diviso in due: i **tracker** (Hevy, Strong, FitNotes, Setgraph, Liftin) e i **programmatori** (Fitbod, Freeletics, Alpha Progression, Juggernaut). I tracker vincono sulla velocità di logging e sul free tier; i programmatori vincono su chi non sa cosa fare in palestra e monetizzano molto di più.

Per un'app italiana mobile-first costruita da zero in poche ore, la posizione difendibile è: **tracker velocissimo, in italiano, che genera un piano di partenza decente**. Non si compete con l'algoritmo di Fitbod; si compete sul fatto che tutte le app veloci sono in inglese e che il free tier di Strong è castrato.

Vantaggi strutturali da sfruttare: PWA (niente store, niente commissione, aggiornamento istantaneo, un solo codebase), lingua italiana, dataset esercizi già in casa, nessun backend necessario.

### 10.2 MVP: cosa deve esserci il primo giorno

Criterio di inclusione: **serve per completare un allenamento**, oppure **la sua assenza fa disinstallare l'app**.

| Priorità | Feature | Motivo |
|---|---|---|
| P0 | Allenamento attivo con lista esercizi, serie, kg, reps, check di completamento | È il prodotto |
| P0 | **Pre-fill dalla sessione precedente + riga "precedente" visibile** | 1 tap per serie: è il motivo per cui uno sceglie questa app |
| P0 | **Autosalvataggio continuo in IndexedDB e ripristino sessione** | Perdere un allenamento è fatale |
| P0 | **Offline al 100%, nessun account, nessuna rete richiesta** | Vincolo di contesto (palestra), non feature |
| P0 | **Rest timer**: auto-start, countdown da timestamp, +15/-15, skip, beep | Senza, l'app non si usa |
| P0 | **Wake lock** durante la sessione | Senza, l'app si odia |
| P0 | Editor routine: crea, ordina, duplica, riusa | Contenitore di tutto |
| P0 | Database esercizi con ricerca e filtro attrezzatura (dai 876 esercizi già presenti, nomi tradotti) | Base di tutto il resto |
| P0 | Installabilità PWA: manifest, service worker, icone, safe area, istruzioni iOS | Abilita wake lock, badge, avvio rapido |
| P1 | Storico e grafico per esercizio | La metrica che motiva davvero |
| P1 | Rilevamento PR + riepilogo di fine allenamento con i record battuti | Miglior rinforzo per unità di lavoro |
| P1 | Tastierino numerico custom con +/- e step configurabile | Velocità di input |
| P1 | Onboarding 6 schermate che genera il piano, senza account e senza paywall | Time-to-value sotto i 90 secondi |
| P1 | Export CSV/JSON | Rete di sicurezza sui dati + anti lock-in |
| P1 | Serie di riscaldamento, note per serie, unità kg/lb | Igiene di base per l'utente esperto |

Se il tempo stringe, l'ordine di taglio è: prima si taglia l'onboarding generativo (si può partire da 3 routine preconfezionate: full body, upper/lower, push-pull-legs), poi i grafici, poi il tastierino custom. **Non si tagliano mai** pre-fill, offline, autosalvataggio, timer e wake lock.

### 10.3 V2: nice to have, in ordine di priorità

1. **Volume settimanale per gruppo muscolare vs target** (10-20 serie): l'analytics più azionabile.
2. **Progressione automatica suggerita** (doppia progressione su rep range + RIR: quando una serie tocca il massimo del range al RIR target, si aumenta il carico su quella serie la volta dopo). È il pattern usato da Boostcamp e Alpha Progression ed è implementabile senza AI.
3. **Sostituzione esercizio intelligente** per pattern di movimento e attrezzatura disponibile.
4. **Heatmap muscolare** degli ultimi 7 giorni.
5. **Plate calculator**.
6. **Superset, drop set, rest-pause** come tipi di serie.
7. **Aderenza settimanale** e riepilogo mensile.
8. **Backup cloud opzionale** con account facoltativo (mai obbligatorio) e sync last-write-wins.
9. **1RM stimato** mostrato solo su serie 2-10 reps, con formula dichiarata.
10. **Web Push per il fine recupero** come fallback su dispositivi installati e online.
11. **Misure corporee e peso**, con grafici.
12. **Programmi predefiniti** (5/3/1, PPL, Starting Strength) in italiano.

### 10.4 Cosa NON costruire, mai o quasi

- Feed social e follower: richiede massa critica che non c'è.
- Classifiche di forza pubbliche: comparison anxiety e dati falsificabili.
- Readiness score da wearable: non difendibile scientificamente.
- Streak giornaliero: concettualmente sbagliato per un programma di forza.
- Account obbligatorio o paywall in onboarding: i due acceleratori di disinstallazione più documentati.
- Tracking nutrizionale: è un altro prodotto.

### 10.5 Le cinque regole di progetto da appendere al muro

1. La serie identica alla precedente si logga in **un tap**.
2. L'app **funziona in aereo**, sempre, per tutte le funzioni core.
3. Nulla di ciò che l'utente ha scritto **si perde mai**, e può sempre portarselo via.
4. Il timer **non si ferma** quando lo schermo si spegne o si cambia app.
5. Tutto ciò che si tocca durante l'allenamento sta nel **terzo inferiore dello schermo** ed è grande almeno 48x48 px.

---

## 11. Nota metodologica e fonti

### 11.1 Attendibilità delle fonti

Una avvertenza importante per chiunque rifaccia questa ricerca: **gran parte dei risultati per "best workout tracker 2026" è content marketing prodotto da app concorrenti** (sensai.fit, repreturn.com, push-pull.app, setgraph.app, arvo.guru, prpath.app, corahealth.app, gymnoteplus.com e simili). Sono utili come indizio, non come prova, e i prezzi che riportano sono spesso sbagliati: Garage Gym Reviews pubblica tre cifre diverse per l'abbonamento annuale di Boostcamp in tre articoli distinti, e RepReturn riporta per Strong prezzi doppi rispetto al listing reale.

**Regola applicata in questo documento**: prezzi e limiti dei piani provengono dai listing App Store / Google Play letti in diretta e dalle pagine ufficiali dei vendor; le lamentele provengono dalle recensioni reali scaricate dagli store; i dati tecnici sul web provengono da WebKit, Chrome for Developers e MDN; i dati comportamentali da studi peer-reviewed e report di piattaforma (RevenueCat, Adapty).

Le uniche testate indipendenti realmente aggiornate sulla categoria sono **Garage Gym Reviews** e **BarBend**. Reddit blocca l'accesso automatizzato, quindi i suoi contenuti compaiono qui solo in forma secondaria e segnalata come tale.

### 11.2 Fonti principali

**Confronti e recensioni indipendenti**
- Garage Gym Reviews, [Best Weightlifting Apps](https://www.garagegymreviews.com/best-weightlifting-app), [Best Workout Apps](https://www.garagegymreviews.com/best-workout-apps), [Best Free Workout Apps](https://www.garagegymreviews.com/best-free-workout-apps), [Boostcamp Review](https://www.garagegymreviews.com/boostcamp-review), [Ladder Review](https://www.garagegymreviews.com/ladder-app-review)
- BarBend, [Best Weightlifting Apps](https://barbend.com/best-weightlifting-apps/), [Boostcamp Review](https://barbend.com/boostcamp-review/)
- Tom's Guide, [Gymshark Training app review](https://tomsguide.com/wellness/fitness/gymshark-training-app-review-effective-workouts-for-free)

**Pagine ufficiali dei vendor**
- [Hevy](https://www.hevyapp.com/), [Hevy Pro](https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include), [Live Activity](https://www.hevyapp.com/features/live-activity/), [Gym Performance](https://www.hevyapp.com/features/gym-performance/), [API](https://api.hevyapp.com/docs/), [export/import](https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy)
- [Strong](https://www.strong.app/), [Strong Lost Data](https://help.strongapp.io/article/217-lost-data)
- [Boostcamp Premium](https://www.boostcamp.app/premium), [Boostcamp free app](https://www.boostcamp.app/free-workout-app)
- [Fitbod RiR](https://help.fitbod.me/hc/en-us/articles/360033133174-Reps-in-Reserve-RiR-Formerly-Exertion-Rating-RPE), [Fitbod subscriptions](https://help.fitbod.me/hc/en-us/sections/1500000506081-Subscriptions)
- [FitNotes workout tools](https://www.fitnotesapp.com/workout_tools/), [FitNotes FAQ](https://www.fitnotesapp.com/faq/)
- [Alpha Progression](https://alphaprogression.com/en)
- [Gymshark Support: The Gymshark Training App](https://support.gymshark.com/en-US/article/the-gymshark-training-app)

**Recensioni utenti**
- App Store: [Fitbod](https://apps.apple.com/us/app/id1041517543), [Strong](https://apps.apple.com/us/app/id464254577), [JEFIT](https://apps.apple.com/us/app/id449810000), [Hevy](https://apps.apple.com/us/app/id1458862350), [Freeletics](https://apps.apple.com/us/app/id654810212), [Nike Training Club](https://apps.apple.com/us/app/id301521403), [Peloton](https://apps.apple.com/us/app/id792750948), [Centr](https://apps.apple.com/us/app/id1382530817), [Boostcamp](https://apps.apple.com/us/app/id1529354455)
- Google Play: [Fitbod](https://play.google.com/store/apps/details?id=com.fitbod.fitbod), [Strong](https://play.google.com/store/apps/details?id=io.strongapp.strong), [Hevy](https://play.google.com/store/apps/details?id=com.hevy), [JEFIT](https://play.google.com/store/apps/details?id=je.fit), [FitNotes](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes)
- Trustpilot: [Centr](https://www.trustpilot.com/review/centr.com), [Freeletics](https://www.trustpilot.com/review/www.freeletics.com), [Fitbod](https://www.trustpilot.com/review/fitbod.me)
- [FTC: dark pattern negli abbonamenti](https://techcrunch.com/2024/07/10/ftc-study-finds-dark-patterns-used-by-a-majority-of-subscription-apps-and-websites)

**Piattaforma web e PWA**
- [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/), [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [Web Push for Web Apps on iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Chrome for Developers: Notification Triggers (abbandonata)](https://developer.chrome.com/docs/web-platform/notification-triggers)
- MDN: [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [share_target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [caniuse: navigator.vibrate](https://caniuse.com/mdn-api_navigator_vibrate), [WebKit bug 194593 Web Share Target](https://bugs.webkit.org/show_bug.cgi?id=194593)
- [LogRocket: offline-first 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/), [Local-first PWA architecture](https://blog.openreplay.com/local-first-pwa-architecture/)
- [CSS-Tricks: inputmode](https://css-tricks.com/finger-friendly-numerical-inputs-with-inputmode/), [David Luhr: UX of number inputs](https://luhr.co/blog/2025/07/01/a-deep-dive-on-the-ux-of-number-inputs/)

**Onboarding, monetizzazione, retention**
- [RevenueCat, State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps)
- [Adapty, Health & Fitness subscription benchmarks](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/)
- [SEMNexus, onboarding drop-off benchmarks 2026](https://semnexus.com/app-onboarding-flow-benchmarks-where-users-drop-off-2026)
- [UXCam, mobile app retention benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/), [RetentionCheck fitness](https://retentioncheck.com/churn-benchmarks/fitness-apps), [Business of Apps](https://www.businessofapps.com/data/health-fitness-app-benchmarks/), [Sahha](https://sahha.ai/blog/health-app-churn-retention/)
- [Descope, progressive profiling](https://www.descope.com/learn/post/progressive-profiling)
- Teardown onboarding: [Fitbod (App Fuel)](https://www.theappfuel.com/examples/fitbod_onboarding), [Freeletics (App Fuel)](https://theappfuel.com/examples/freeletics_onboarding), [ScreensDesign](https://screensdesign.com/articles/fitness-app-onboarding-examples/)

**Scienza dell'allenamento e della motivazione**
- [Pelland et al., dose-response volume (SportRxiv)](https://sportrxiv.org/index.php/server/preprint/view/460), [PubMed](https://pubmed.ncbi.nlm.nih.gov/35291645/)
- [Arvo, formule 1RM](https://arvo.guru/resources/one-rep-max-formulas), [studio comparativo a 7 equazioni](https://www.tandfonline.com/doi/abs/10.1207/S15327841MPEE0602_1)
- [STEP UP, JAMA Internal Medicine 2019](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761)
- [Meta-analisi gamification, JMIR Serious Games 2025](https://games.jmir.org/2025/1/e68151), [JMIR cardiovascolare 2025](https://games.jmir.org/2025/1/e64410)
- [Frontiers in Psychology 2025, ricchezza di gamification a S](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1671543/full)
- [Studio UCL/Loughborough/Westminster sui danni delle app fitness](https://refractor.io/health-wellbeing/popular-fitness-apps-may-demotivate-users/)
- [Marco Altini su HRV e readiness](https://medium.com/@altini_marco/on-heart-rate-variability-hrv-and-readiness-394a499ed05b)
- [Trophy, cosa succede quando si perde uno streak](https://trophy.so/blog/what-happens-when-users-lose-streaks)
- [Hoober / thumb zone](https://parachutedesign.ca/blog/thumb-zone-ux/)

**Dataset esercizi**
- [free-exercise-db (Unlicense, 876 esercizi)](https://github.com/yuhonas/free-exercise-db), già presente nel repository in `db-exercise/`
