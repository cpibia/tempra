# Salute, sicurezza e controindicazioni

**Documento operativo per il motore di generazione schede**
Versione 1.0 · 12 settembre 2026 · Research Lead "Salute, sicurezza e controindicazioni"

> **Avvertenza sull'uso di questo documento.** È un documento di progettazione tecnica, non un documento clinico. Le regole qui descritte servono a impostare un filtro prudenziale di sicurezza in un'app di fitness e benessere; non costituiscono protocolli riabilitativi né sostituiscono la valutazione di un medico. Il documento va riletto e validato da un medico dello sport e da un legale prima del rilascio.

> **Principio guida del prodotto.** L'app non cura, non riabilita, non previene patologie. L'app **esclude o adatta esercizi in via prudenziale** e, quando serve, **rinvia al medico**. Questa distinzione non è cosmetica: è la linea che separa una app di benessere da un dispositivo medico ai sensi del Regolamento (UE) 2017/745 (vedi sezione 2).

> **Secondo principio: niente nocebo.** Le linee guida moderne su lombalgia (JOSPT 2021, NICE NG59) e artrosi (ACR/AF 2019, OARSI 2019) sono esplicite nel segnalare il danno del messaggio di fragilità. Il copy corretto in app è "adattiamo questo esercizio", non "questo esercizio è pericoloso per te".

---

## Indice

1. [Screening pre-esercizio](#1-screening-pre-esercizio)
   - 1.1 Perché serve uno screening e cosa NON è
   - 1.2 PAR-Q+ 2024: le 7 domande generali (traduzione italiana operativa)
   - 1.3 PAR-Q+ 2024: domande di approfondimento
   - 1.4 Algoritmo ACSM di pre-participation screening
   - 1.5 Segni e sintomi maggiori ACSM
   - 1.6 Red flag assolute
   - 1.7 Traduzione in stati applicativi
2. [Disclaimer legale, MDR e GDPR](#2-disclaimer-legale-mdr-e-gdpr)
   - 2.1 Quando un software diventa dispositivo medico
   - 2.2 Cosa l'app NON deve dire per restare "wellness"
   - 2.3 GDPR: dati sanitari, art. 9 e consenso esplicito
   - 2.4 On-device vs server
   - 2.5 DPIA e minori
   - 2.6 Normativa italiana e professioni sanitarie
   - 2.7 Disclaimer pronto all'uso (versione lunga)
   - 2.8 Disclaimer pronto all'uso (versione breve di onboarding)
   - 2.9 Microcopy in-app
   - 2.10 Limiti giuridici del disclaimer
3. [Mappatura condizione, restrizioni e adattamenti](#3-mappatura-condizione-restrizioni-e-adattamenti)
   - 3.1 Ernia del disco lombare e lombalgia cronica
   - 3.2 Ernia inguinale e addominale
   - 3.3 Problemi cervicali
   - 3.4 Spalla: cuffia dei rotatori e impingement
   - 3.5 Spalla: lussazione pregressa e instabilità
   - 3.6 Ginocchio: dolore femoro-rotuleo
   - 3.7 Ginocchio: lesione meniscale
   - 3.8 Ginocchio: ricostruzione LCA
   - 3.9 Gomito: epicondilite ed epitrocleite
   - 3.10 Polso e mano: tunnel carpale
   - 3.11 Caviglia: instabilità cronica
   - 3.12 Ipertensione arteriosa
   - 3.13 Cardiopatia e post-infarto
   - 3.14 Diabete tipo 1 e tipo 2
   - 3.15 Obesità grave
   - 3.16 Osteoporosi e osteopenia
   - 3.17 Artrosi e artrite reumatoide
   - 3.18 Asma da sforzo
   - 3.19 Gravidanza per trimestre
   - 3.20 Post-partum e diastasi dei retti
   - 3.21 Varici e insufficienza venosa
   - 3.22 Epilessia
   - 3.23 Scoliosi
   - 3.24 Over 65 e sarcopenia
   - 3.25 Matrice sinottica categoria per condizione
4. [Traduzione in regole di filtro](#4-traduzione-in-regole-di-filtro)
   - 4.1 Il dataset di partenza
   - 4.2 Schema dati JSON
   - 4.3 Pattern di movimento e keyword verificate sul dataset
   - 4.4 Motore di risoluzione e conflitti tra condizioni
   - 4.5 Falsi positivi noti e come evitarli
   - 4.6 Attributi mancanti da aggiungere al dataset
5. [Sicurezza generale durante l'allenamento](#5-sicurezza-generale-durante-lallenamento)
6. [Accessibilità motoria](#6-accessibilità-motoria)
7. [Bibliografia e fonti](#7-bibliografia-e-fonti)

---
## 1. Screening pre-esercizio

### 1.1 Perché serve uno screening e cosa NON è

Lo screening pre-esercizio ha un solo obiettivo clinico documentato: identificare le persone a rischio elevato di evento cardiaco acuto durante l'attività fisica, senza creare barriere inutili all'inizio dell'attività. L'aggiornamento ACSM del 2015 (poi recepito nella 10ª e 11ª edizione delle *Guidelines for Exercise Testing and Prescription*) ha esplicitamente abbandonato il vecchio conteggio dei fattori di rischio cardiovascolare perché generava troppi rinvii al medico, con effetto paradosso di scoraggiare l'attività fisica.

Fonti:
- Riebe D. et al., *Updating ACSM's Recommendations for Exercise Preparticipation Health Screening*, Med Sci Sports Exerc 2015: https://pubmed.ncbi.nlm.nih.gov/26473759/
- ACSM's Guidelines for Exercise Testing and Prescription: https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription/
- ACE, *New Preparticipation Guidelines Remove Barriers to Exercise*: https://www.acefitness.org/continuing-education/certified/february-2018/6898/new-preparticipation-guidelines-remove-barriers-to-exercise/

### 1.2 PAR-Q+ 2024: le 7 domande generali (traduzione italiana operativa)

Il PAR-Q+ (Physical Activity Readiness Questionnaire for Everyone) è lo standard internazionale di pre-participation screening, aggiornato al 2024 dalla PAR-Q+ Collaboration. Versione ufficiale: https://eparmedx.com/wp-content/uploads/2023/12/PARQPlus2024Fillable.pdf ; pagina di riferimento: https://eparmedx.com/par-q/

Testo introduttivo da mostrare in app:

> I benefici per la salute di un'attività fisica regolare sono chiari e la maggior parte delle persone può praticarla in tutta sicurezza. Questo questionario serve a capire se prima di aumentare il tuo livello di attività fisica è opportuno che tu ti rivolga al tuo medico o a un professionista dell'esercizio qualificato.

Le 7 domande (risposta SÌ / NO):

1. **Il tuo medico ti ha mai detto che hai una patologia cardiaca OPPURE la pressione alta?**
2. **Avverti dolore al petto a riposo, durante le normali attività quotidiane OPPURE quando svolgi attività fisica?**
3. **Perdi l'equilibrio a causa di capogiri OPPURE hai perso conoscenza negli ultimi 12 mesi?**
   *(Rispondi NO se il capogiro era legato a iperventilazione, anche durante esercizio intenso.)*
4. **Ti è mai stata diagnosticata un'altra patologia cronica (diversa da cardiopatia o ipertensione)?**
   *(In caso affermativo, elenca la/le condizione/i.)*
5. **Stai attualmente assumendo farmaci prescritti per una patologia cronica?**
   *(In caso affermativo, elenca condizioni e farmaci.)*
6. **Hai attualmente (o hai avuto negli ultimi 12 mesi) un problema osseo, articolare o dei tessuti molli (muscolo, legamento o tendine) che potrebbe peggiorare aumentando l'attività fisica?**
   *(Rispondi NO se il problema è passato e non limita la tua attuale capacità di essere attivo.)*
7. **Il tuo medico ti ha mai detto che dovresti svolgere attività fisica solo sotto supervisione medica?**

**Esito se tutte le risposte sono NO**: l'utente è idoneo all'attività fisica. Messaggio da mostrare:

> Puoi diventare molto più attivo: inizia gradualmente e aumenta con calma. Segui le raccomandazioni OMS sull'attività fisica adatte alla tua età. Puoi sottoporti a una valutazione di salute e fitness. Se hai più di 45 anni e NON sei abituato a un esercizio da intenso a massimale, consulta un professionista dell'esercizio qualificato prima di allenarti a questa intensità.

**Esito se almeno una risposta è SÌ**: vanno somministrate le domande di approfondimento (sezione 1.3) oppure, in mancanza, si applica il rinvio a valutazione professionale/medica.

**Rimandare comunque l'aumento di attività se** (testo PAR-Q+ da riportare tale e quale):
- l'utente ha una malattia temporanea in corso (raffreddore, febbre): meglio aspettare di stare meglio;
- l'utente è in **gravidanza**: parlarne con il proprio professionista sanitario e/o completare l'ePARmed-X+ (https://eparmedx.com/) prima di aumentare l'attività;
- lo stato di salute è cambiato rispetto alla compilazione precedente.

**Validità**: il PAR-Q+ dichiara esplicitamente che la clearance vale al massimo **12 mesi** e decade se le condizioni di salute cambiano. L'app deve quindi ri-somministrare lo screening ogni 12 mesi e a ogni modifica del profilo sanitario.

### 1.3 PAR-Q+ 2024: domande di approfondimento (aree cliniche)

Se l'utente risponde SÌ a una delle 7 domande, il PAR-Q+ apre 10 blocchi di approfondimento. Questa è la struttura che conviene replicare nell'onboarding perché mappa quasi uno a uno le condizioni gestite dal motore di generazione schede.

1. **Artrite, osteoporosi o problemi alla schiena**
   - 1a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte dal medico?
   - 1b. Hai problemi articolari che causano dolore, una frattura recente o una frattura causata da osteoporosi o tumore, una vertebra dislocata (es. spondilolistesi) e/o spondilolisi / difetto dell'istmo?
   - 1c. Hai fatto infiltrazioni di cortisone o assunto cortisone in compresse regolarmente per più di 3 mesi?
2. **Tumore di qualsiasi tipo**
   - 2a. La diagnosi comprende tumore polmonare/broncogeno, mieloma multiplo, tumore della testa e/o del collo?
   - 2b. Stai attualmente ricevendo terapia oncologica (chemioterapia o radioterapia)?
3. **Patologia cardiaca o cardiovascolare** (coronaropatia, scompenso cardiaco, aritmia diagnosticata)
   - 3a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 3b. Hai un battito irregolare che richiede gestione medica (es. fibrillazione atriale, extrasistoli ventricolari)?
   - 3c. Hai uno scompenso cardiaco cronico?
   - 3d. Hai una coronaropatia diagnosticata e NON hai svolto attività fisica regolare negli ultimi 2 mesi?
4. **Pressione alta**
   - 4a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 4b. Hai una pressione a riposo uguale o superiore a **160/90 mmHg**, con o senza farmaci? *(Rispondi SÌ se non conosci la tua pressione a riposo.)*
5. **Condizioni metaboliche** (diabete tipo 1, diabete tipo 2, pre-diabete)
   - 5a. Hai spesso difficoltà a controllare la glicemia con alimentazione, farmaci o altre terapie prescritte?
   - 5b. Hai spesso segni e sintomi di ipoglicemia dopo l'esercizio e/o durante le attività quotidiane? *(tremore, nervosismo, irritabilità insolita, sudorazione anomala, capogiro, confusione mentale, difficoltà a parlare, debolezza, sonnolenza)*
   - 5c. Hai segni o sintomi di complicanze del diabete, come malattia cardiaca o vascolare, e/o complicanze a occhi, reni o alla sensibilità di piedi e dita?
   - 5d. Hai altre condizioni metaboliche (diabete gestazionale in corso, malattia renale cronica, problemi epatici)?
   - 5e. Hai intenzione di svolgere, nel prossimo futuro, un esercizio per te insolitamente intenso?
6. **Problemi di salute mentale o difficoltà di apprendimento** (Alzheimer, demenza, depressione, disturbo d'ansia, disturbo alimentare, disturbo psicotico, disabilità intellettiva, sindrome di Down)
   - 6a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 6b. Hai la sindrome di Down E problemi alla schiena che interessano nervi o muscoli?
7. **Malattie respiratorie** (BPCO, asma, ipertensione polmonare)
   - 7a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 7b. Il medico ti ha detto che il tuo livello di ossigeno nel sangue è basso a riposo o sotto sforzo, e/o che ti serve ossigenoterapia?
   - 7c. Se sei asmatico, hai attualmente sintomi di costrizione toracica, respiro sibilante, respiro affannoso, tosse persistente (più di 2 giorni a settimana), oppure hai usato il farmaco di emergenza più di due volte nell'ultima settimana?
   - 7d. Il medico ti ha mai detto che hai la pressione alta nei vasi sanguigni dei polmoni?
8. **Lesione del midollo spinale** (tetraplegia e paraplegia)
   - 8a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 8b. Hai comunemente una pressione a riposo così bassa da provocare capogiri, sensazione di testa leggera e/o svenimento?
   - 8c. Il medico ti ha detto che presenti episodi improvvisi di pressione molto alta (disreflessia autonomica)?
9. **Ictus** (incluso TIA o evento cerebrovascolare)
   - 9a. Hai difficoltà a controllare la condizione con farmaci o terapie prescritte?
   - 9b. Hai qualche limitazione nel cammino o nella mobilità?
   - 9c. Hai avuto un ictus o un danno a nervi o muscoli negli ultimi 6 mesi?
10. **Altra condizione medica non elencata, oppure due o più condizioni**
   - 10a. Hai avuto un blackout, uno svenimento o una perdita di coscienza in seguito a un trauma cranico negli ultimi 12 mesi, OPPURE hai avuto una commozione cerebrale diagnosticata negli ultimi 12 mesi?
   - 10b. Hai una condizione medica non elencata (per esempio epilessia, condizioni neurologiche, problemi renali)?
   - 10c. Convivi attualmente con due o più condizioni mediche?

**Regola di esito**: se anche UNA sola risposta di approfondimento è SÌ, il PAR-Q+ prescrive di **non procedere in autonomia** e di completare l'ePARmed-X+ (https://eparmedx.com/) e/o rivolgersi a un professionista dell'esercizio qualificato. Nella nostra app questo si traduce nello stato `MEDICAL_CLEARANCE_REQUIRED`.

Se tutte le risposte di approfondimento sono NO, il PAR-Q+ raccomanda comunque di iniziare con 20-60 minuti di esercizio da leggero a moderato, 3-5 giorni a settimana, combinando aerobico e rinforzo muscolare, per poi progredire verso i 150+ minuti settimanali di attività moderata.

### 1.4 Algoritmo ACSM di pre-participation screening

L'algoritmo ACSM si basa su tre variabili e non più sul conteggio dei fattori di rischio:

1. **Livello attuale di attività fisica**: si considera "attivo" chi svolge esercizio strutturato almeno 30 minuti a intensità moderata, almeno 3 giorni a settimana, da almeno 3 mesi.
2. **Presenza di malattia cardiovascolare, metabolica o renale nota, oppure di segni/sintomi suggestivi**.
3. **Intensità dell'esercizio desiderata** (leggera, moderata, vigorosa).

Schema decisionale semplificato (da implementare come macchina a stati):

| Situazione | Esito |
|---|---|
| Non attivo, nessuna malattia nota, nessun sintomo | Nessuna clearance medica necessaria per intensità leggera-moderata. Progressione graduale verso la vigorosa |
| Non attivo, malattia CV/metabolica/renale nota, asintomatico | **Clearance medica raccomandata** prima di iniziare a qualunque intensità |
| Attivo, malattia nota, asintomatico | Nessuna clearance per intensità moderata; **clearance raccomandata** (valida 12 mesi in assenza di variazioni) prima di passare a intensità vigorosa |
| Attivo o non attivo, **con segni o sintomi** suggestivi di malattia CV/metabolica/renale | **Sospendere l'esercizio e ottenere clearance medica** prima di riprendere a qualunque intensità |

Fonti: https://pubmed.ncbi.nlm.nih.gov/26473759/ ; https://acsm.org/EIM ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7059860/

### 1.5 Segni e sintomi maggiori suggestivi di malattia cardiovascolare, metabolica o renale (ACSM)

Domande da porre in onboarding, ciascuna con esito diretto su `MEDICAL_CLEARANCE_REQUIRED`:

1. Dolore, fastidio o oppressione a torace, collo, mandibola, braccia o altre aree, compatibile con ischemia.
2. Mancanza di respiro a riposo o dopo sforzo lieve.
3. Capogiri o svenimento (sincope).
4. Ortopnea (difficoltà a respirare da sdraiati) o dispnea parossistica notturna.
5. Gonfiore alle caviglie (edema).
6. Cardiopalmo o tachicardia.
7. Claudicatio intermittens (dolore crampiforme alle gambe camminando, che si risolve fermandosi).
8. Soffio cardiaco noto.
9. Affaticamento insolito o affanno con le normali attività quotidiane.

Fonti: https://acsm.org/EIM ; https://nfpt.com/assessing-cardiovascular-risk-with-fitness-clients/

### 1.6 Red flag assolute: quando l'app DEVE dire "consulta un medico prima di iniziare"

Queste condizioni devono generare uno **stato bloccante** (`hard_block`) che impedisce la generazione della scheda finché l'utente non dichiara di aver ottenuto il nulla osta medico. Non è una raccomandazione grafica: è un gate funzionale.

**Cardiovascolari**
- Dolore toracico a riposo o sotto sforzo, attuale o negli ultimi 30 giorni.
- Sincope o presincope negli ultimi 12 mesi non spiegata.
- Infarto miocardico, angioplastica, bypass o intervento cardiochirurgico negli ultimi 6 mesi.
- Angina instabile, scompenso cardiaco sintomatico, miocardite o pericardite in atto, sospetta dissecazione aortica, stenosi aortica severa sintomatica.
- Aritmia non controllata, portatore di defibrillatore impiantabile senza indicazioni sportive del cardiologo.
- Pressione arteriosa a riposo **≥ 180/110 mmHg**.
- Embolia polmonare o trombosi venosa profonda recenti.

**Metaboliche**
- Diabete con glicemia non controllata, chetoni positivi, ipoglicemie ricorrenti o mancata percezione dell'ipoglicemia.
- Retinopatia diabetica proliferativa o ulcera del piede in atto.

**Respiratorie**
- Asma non controllata (uso del broncodilatatore di emergenza più volte a settimana, sintomi notturni, riacutizzazione nelle ultime 48 ore).
- Ossigenoterapia, ipertensione polmonare.

**Neurologiche**
- Trauma cranico o commozione cerebrale negli ultimi 12 mesi con perdita di coscienza.
- Crisi epilettica nelle ultime 48 ore o modifica recente della terapia antiepilettica.
- Ictus o TIA negli ultimi 6 mesi.

**Muscoloscheletriche: red flag del rachide**
- Perdita del controllo di vescica o intestino, anestesia a sella (perineo, zona interna cosce), deficit motorio bilaterale progressivo agli arti inferiori: **sospetta sindrome della cauda equina, emergenza chirurgica**, indirizzare al pronto soccorso, non "al medico di base".
- Deficit neurologico progressivo (ipostenia, piede cadente), dolore notturno non posizionale, febbre con dolore vertebrale, calo ponderale inspiegato, storia oncologica, trauma significativo recente, uso prolungato di corticosteroidi.

Fonti: https://www.consultant360.com/peer-reviewed/revisiting-red-flags-acute-low-back-pain ; https://www.acep.org/sportsmedicine/newsroom/newsroom-articles/august2022/re-evaluating-red-flags-for-back-pain

**Generali**
- Gravidanza con controindicazioni assolute dichiarate dal ginecologo (vedi sezione 3.16).
- Febbre o malattia acuta in corso.
- Frattura recente non consolidata, intervento chirurgico negli ultimi 3 mesi senza indicazione riabilitativa.
- Dolore muscoloscheletrico acuto, notturno o con gonfiore articolare significativo.
- Età inferiore a quella minima dichiarata nei termini d'uso.

### 1.7 Traduzione in stati applicativi

| Stato | Significato | Comportamento del motore |
|---|---|---|
| `CLEARED` | PAR-Q+ tutto NO | Genera la scheda con regole standard |
| `CLEARED_WITH_ADAPTATIONS` | Condizioni note ma stabili e controllate | Genera la scheda applicando i filtri della condizione |
| `MEDICAL_CLEARANCE_REQUIRED` | Almeno un SÌ alle domande di approfondimento, o segni/sintomi ACSM | Nessuna scheda finché l'utente non conferma il nulla osta; è ammessa la sola visualizzazione di contenuti informativi |
| `HARD_BLOCK` | Red flag assoluta della sezione 1.6 | Nessuna scheda, messaggio di rinvio al medico o al pronto soccorso a seconda della red flag |
| `EXPIRED` | Screening più vecchio di 12 mesi o profilo sanitario modificato | Ri-somministrazione obbligatoria del questionario |
## 2. Disclaimer legale, MDR e GDPR

> Sintesi in una riga: sul **MDR** l'app resta fuori solo se la destinazione d'uso dichiarata e comunicata è "fitness e benessere", e se i dati su patologie servono a **escludere** esercizi per prudenza, non a "trattare" o "riabilitare". Sul **GDPR** invece l'app è dentro in pieno: patologie e infortuni sono dati sanitari ex art. 9, anche se restano sul dispositivo.

### 2.1 Quando un software diventa dispositivo medico

**Art. 2, punto 1, Reg. (UE) 2017/745 (MDR)**: è dispositivo medico anche il **software** destinato dal fabbricante a diagnosi, prevenzione, monitoraggio, previsione, prognosi, trattamento o attenuazione di **malattie**, oppure a diagnosi, monitoraggio, trattamento, attenuazione o compensazione di una **lesione** o **disabilità**.
Testo ufficiale: https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32017R0745

**Considerando 19 MDR**: il software "destinato a finalità generali, anche se utilizzato in un contesto sanitario, o il software per fini associati allo stile di vita e al benessere **non è un dispositivo medico**". La stessa norma precisa che la qualifica è **indipendente dall'ubicazione del software**: girare come PWA on-device non cambia nulla.

**MDCG 2019-11 rev. 1 (giugno 2025)**, guida ufficiale sulla qualifica del software: https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
Punti chiave:
- il software deve avere **una finalità medica propria**; la **destinazione d'uso descritta dal fabbricante** è l'elemento determinante;
- "wellness or fitness apps **do not qualify** as MDSW";
- il **rischio di danno** non è un criterio di qualifica: il fatto che un allenamento sbagliato possa far male non rende l'app un dispositivo medico;
- ogni claim medico deve essere sostenuto da evidenza clinica adeguata (art. 7 MDR), altrimenti **non può essere presentato**.

**L'esempio della MDCG che riguarda direttamente questa app (allarme rosso)**: è qualificato come dispositivo medico
> un software che usa i dati di un paziente con una **patologia muscoloscheletrica specifica** ed è destinato ad **alleviare il dolore** associato a quella patologia **raccomandando esercizi riabilitativi personalizzati**.

Il pattern pericoloso è: patologia identificata + contenuto personalizzato su quella patologia + finalità di attenuare i sintomi. L'app deve rompere almeno un anello, e il più solido da rompere è **la finalità dichiarata e comunicata**.

**Regola 11, Allegato VIII MDR**: il software che fornisce informazioni usate per decisioni diagnostiche o terapeutiche è **classe IIa** (classe IIb o III se le decisioni possono causare grave deterioramento o decesso). MDCG precisa che un dispositivo destinato a **prevenire il rischio di patologie analizzando parametri fisiologici** (per esempio "analisi posturale") è classe IIa. Conseguenza pratica: una feature di "screening posturale" o di "prevenzione della lombalgia" porta in classe IIa, cioè organismo notificato, ISO 13485, IEC 62304, valutazione clinica, EUDAMED, PRRC, sorveglianza post-market: 12-24 mesi e costi a sei cifre.

**Giurisprudenza italiana**: TAR Lombardia Milano, sent. n. 452/2022, un software è dispositivo medico solo se svolge analisi ed elaborazione dei dati **a fini medici**; archiviazione, conversione o classificazione non bastano, anche in contesto sanitario.

**Destinazione d'uso (art. 2, punto 12, MDR)**: comprende non solo le istruzioni d'uso, ma **il materiale o le dichiarazioni di promozione o vendita**. Una pagina Termini d'uso impeccabile viene neutralizzata da una singola inserzione che promette "addio mal di schiena". L'art. 7 MDR vieta espressamente, anche nella **pubblicità**, testi e immagini che creino impressioni errate su trattamento o diagnosi.

**Sanzioni se l'app dichiara di trattare o riabilitare senza marcatura CE** (d.lgs. 5 agosto 2022, n. 137): sanzione amministrativa da **24.200 a 145.000 euro** per immissione in commercio di dispositivo non conforme; da **26.000 a 120.000 euro** se l'offerta avviene tramite servizi della società dell'informazione (cioè online). A questo si aggiungono i poteri di ritiro e divieto di commercializzazione del Ministero della Salute, l'intervento AGCM per pratica commerciale ingannevole (artt. 20-23 Codice del consumo), il profilo penale ex art. 348 c.p. se compare un output diagnostico o prescrittivo, la possibile scopertura assicurativa e la rimozione dagli store.

### 2.2 Cosa l'app NON deve dire per restare "wellness"

Vale per UI, copy in-app, store listing, sito, social, ads, email e output di eventuali modelli generativi.

| Vietato (fa scattare la qualifica MDR) | Ammesso (resta wellness) |
|---|---|
| "programma **terapeutico**", "protocollo **riabilitativo**", "**cura**", "**tratta**", "**allevia il dolore**", "**recupero funzionale** post infortunio" | "programma di allenamento", "percorso di fitness", "scheda per la sala pesi" |
| "**previene** la lombalgia / l'artrosi / il diabete" | "favorisce il benessere generale", "supporta uno stile di vita attivo" |
| "esercizi **specifici per la tua ernia discale**" | "abbiamo **escluso** alcuni esercizi in base a quanto hai dichiarato, per prudenza" |
| "**valutazione** del tuo stato di salute", "**screening** posturale" | "questionario di **idoneità all'attività fisica** il cui unico esito è: puoi procedere oppure **rivolgiti a un medico**" |
| "**monitora** la frequenza cardiaca e ti avvisa se anomala" | "registra i tuoi allenamenti, serie e ripetizioni" |
| "sostituisce il fisioterapista", "un medico dello sport in tasca" | "non sostituisce il parere di un medico o di un professionista qualificato" |
| "clinicamente **validato** per ridurre il dolore" | "basato su linee guida di allenamento riconosciute (ACSM, NSCA, OMS)" |
| "**diagnosi**", "**prognosi**", "**sintomi**", "**paziente**", "**anamnesi**", "**terapia**" | "utente", "obiettivo", "preferenze", "limitazioni dichiarate" |

**Regola d'oro del flusso di onboarding**: le informazioni su patologie e infortuni devono avere funzione di **filtro negativo** e di **rinvio al medico**, mai di input per una personalizzazione terapeutica. Output ammesso: "non ti proponiamo lo squat con bilanciere" oppure "prima di iniziare, fatti valutare da un medico". Output vietato: "ecco il protocollo in 3 fasi per la tua lombalgia".

**Contromisure operative consigliate**:
1. glossario interno di parole vietate (cura, terapia, riabilitazione, protocollo, paziente, diagnosi, guarigione, prevenzione di patologie, dolore, sintomo) applicato a codice, copy, marketing e prompt;
2. guardrail e test automatici sull'output generativo che fanno fallire la build se compaiono i termini vietati;
3. review legale obbligatoria su ogni feature che tocchi salute, dolore o infortuni;
4. versionamento e archiviazione di Termini, disclaimer e informativa con prova di accettazione per utente;
5. registro dei trattamenti, DPIA e analisi dei rischi aggiornati a ogni cambio di architettura.

**Nota AI Act (Reg. UE 2024/1689)**: un sistema fitness non medico non è "ad alto rischio". Restano gli obblighi di trasparenza dell'art. 50 se c'è un chatbot: va reso chiaro che si interagisce con un sistema di IA.

### 2.3 GDPR: dati sanitari, art. 9 e consenso esplicito

**Art. 4, punto 15**: sono dati relativi alla salute i dati personali attinenti alla salute fisica o mentale che rivelano informazioni sullo stato di salute.
**Considerando 35**: vi rientrano tutti i dati che rivelino informazioni sullo stato di salute **passata, presente o futura**, incluse "una malattia, una disabilità, il rischio di malattie, l'anamnesi medica", **indipendentemente dalla fonte**.
Testo ufficiale: https://eur-lex.europa.eu/legal-content/IT/TXT/PDF/?uri=CELEX:32016R0679

Conclusione non negoziabile: **una patologia pregressa dichiarata in un form è dato ex art. 9**, anche senza referti e senza medici coinvolti. L'art. 9 par. 1 pone un divieto generale di trattamento, derogabile solo nei casi del par. 2.

**Il criterio WP29 per app di lifestyle e benessere** (Allegato alla lettera del 5 febbraio 2015): sono dati sanitari quelli intrinsecamente medici, i dati grezzi da cui si può dedurre lo stato di salute, e le conclusioni tratte sullo stato di salute. Il WP29 cita proprio le app che tracciano dieta ed esercizio e conclude che serve una deroga, "the most likely derogation is **explicit consent**".
https://ec.europa.eu/justice/article-29/documentation/other-document/files/2015/20150205_letter_art29wp_ec_health_data_after_plenary_annex_en.pdf

**Posizione del Garante italiano** (Provvedimento n. 55 del 7 marzo 2019, doc. web 9091942): richiedono **consenso esplicito ex art. 9.2.a** i trattamenti connessi all'uso di app attraverso cui autonomi titolari raccolgono dati anche sanitari per finalità diverse dalla telemedicina, oppure quando ai dati possono accedere soggetti diversi dai professionisti sanitari. Un'app fitness gestita da una società non sanitaria ricade esattamente qui: **niente art. 9.2.h (cura), serve art. 9.2.a**.
https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9091942

Il Garante ha inoltre pubblicato un vademecum specifico su **fitness tracker e app sportive**: https://www.garanteprivacy.it/fitness-tracker

**Doppio binario obbligatorio (art. 6 + art. 9)**

| Trattamento | Base art. 6 | Deroga art. 9 |
|---|---|---|
| Account, erogazione del servizio base | art. 6.1.b (contratto) | non serve |
| Patologie, infortuni, limitazioni | art. 6.1.a o 6.1.b | **art. 9.2.a, consenso esplicito** |
| Analytics | art. 6.1.a, o 6.1.f con bilanciamento robusto | vietato usare dati di salute |
| Marketing | art. 6.1.a | mai su dati di salute |

**Errore da evitare in modo assoluto**: profilare l'utente o fare marketing usando le patologie dichiarate.

**Requisiti del consenso esplicito** (art. 4(11), art. 7, EDPB Guidelines 05/2020):
1. **checkbox dedicata e separata**, non preflaggata, con testo che nomina espressamente i dati sanitari;
2. **granularità**: un consenso per finalità; almeno tre spunte distinte (Termini e disclaimer, dati di salute, marketing);
3. **libertà**: il consenso è libero solo se **l'app funziona anche senza i dati sanitari**. Il flusso deve produrre comunque una scheda generica con avvertenze standard se l'utente rifiuta (altrimenti si apre il tema art. 7.4 e il consenso può risultare invalido);
4. **revocabilità** semplice quanto la prestazione (art. 7.3), con cancellazione effettiva e rigenerazione della scheda in modalità generica;
5. **prova** (art. 7.1): conservare timestamp, versione del testo accettato, modalità;
6. informativa **prima** del consenso.

**Minimizzazione (art. 5.1.c) e privacy by design (art. 25): decisioni di prodotto concrete**
- **Non raccogliere diagnosi in campo libero.** Usare una **lista chiusa di limitazioni funzionali** ("limitazione a spalla", "impossibilità di caricare la colonna"), non di diagnosi ("ernia L5-S1", "sindrome da conflitto subacromiale").
- **Memorizzare il derivato, non il dato grezzo.** Idealmente l'input clinico viene trasformato in flag di esclusione (`avoid: ["axial_load","overhead_press"]`) e il dato originario viene scartato: il contenuto informativo sanitario crolla.
- Default privacy-friendly: nessun invio al server salvo azione esplicita, niente analytics di terze parti sulle schermate sanitarie, **niente session replay** su un form sanitario.
- Retention definita e cancellazione automatica alla revoca del consenso o dopo N mesi di inattività.
- Cifratura in transito e, dove possibile, a riposo anche on-device.

### 2.4 On-device (localStorage / IndexedDB) vs server

**L'esenzione domestica copre l'utente, non il fornitore.** Il WP29 è esplicito: se il trattamento avviene solo sul dispositivo e nessun dato esce, la normativa non si applica **all'utente** per uso personale; ma questo "**does not exempt the data controller from his responsibilities**" per i trattamenti che esso svolge per le proprie finalità.

**Quando il fornitore non è titolare per quei dati**: solo se ricorrono **tutte** queste condizioni
- i dati sanitari sono scritti esclusivamente in localStorage/IndexedDB del browser;
- non esiste alcun endpoint che li riceva, neppure per backup, sync, supporto o debug;
- nessun log lato server, nessun SDK di analytics o crash reporting che li catturi;
- l'elaborazione della scheda avviene interamente client-side.

Il fornitore resta comunque titolare per account, email, IP, log del web server, metriche, pagamenti e push.

**Il GDPR e l'ePrivacy si applicano comunque, su altri fronti**
1. **Art. 122 Codice privacy** (attuazione art. 5(3) ePrivacy): lo storage sul terminale richiede consenso previa informativa, **salvo** quello strettamente necessario a erogare il servizio esplicitamente richiesto. Il localStorage che contiene la scheda richiesta dall'utente rientra nell'eccezione tecnica: nessun banner. Qualunque storage per analytics, A/B test, profilazione o terze parti richiede invece consenso preventivo (Linee guida cookie del Garante, 10 giugno 2021, doc. web 9677876).
2. **Informativa art. 13** va comunque resa e deve dichiarare espressamente che i dati sanitari restano sul dispositivo, chi può accedervi e cosa succede se l'utente cancella i dati del browser.
3. **Sicurezza art. 32**: il localStorage è leggibile da qualunque JS in pagina. Una singola XSS o una libreria compromessa espone i dati sanitari. Servono CSP rigorosa, controllo delle dipendenze, Subresource Integrity, nessun `innerHTML` su input utente.
4. **Dispositivo condiviso**: prevedere "non ricordare i miei dati su questo dispositivo" e un "cancella tutto" ben visibile.
5. **Trasparenza sul rischio di perdita**: cache pulita, incognito o cambio device significano dati persi. Va detto.

**Dove l'architettura on-device si rompe senza che nessuno se ne accorga**: funzione "esporta o condividi la scheda" che passa da un server; generazione della scheda tramite chiamata a un LLM in cloud (in quel caso i dati sanitari **escono**, serve un responsabile ex art. 28 e si aprono i trasferimenti extra-UE artt. 44-49); Sentry o Crashlytics che catturano lo stato dell'app; backup su account cloud; form di supporto dove l'utente incolla la scheda.

**Da valorizzare**: l'architettura on-device è la migliore dimostrazione possibile di privacy by design e by default ex art. 25, riduce il perimetro di rischio, elimina il trasferimento extra-UE e semplifica la DPIA. Va documentata formalmente nel registro dei trattamenti, perché è anche un argomento difensivo.

### 2.5 DPIA e minori

**Art. 35 GDPR**: DPIA obbligatoria in caso di rischio elevato, e in particolare per il trattamento su **larga scala di categorie particolari ex art. 9**.
**Provvedimento del Garante n. 467 dell'11 ottobre 2018** (doc. web 9058979, G.U. n. 269 del 19 novembre 2018), elenco dei trattamenti soggetti a DPIA; rilevanti per questa app: trattamenti valutativi o di scoring su larga scala con attività predittive sulla salute; monitoraggio sistematico anche tramite **app**; trattamenti su larga scala di dati estremamente personali; dati riferiti a **soggetti vulnerabili** (minori); **tecnologie innovative** (IA, dispositivi indossabili); dati ex art. 9 interconnessi con dati raccolti per altre finalità.
https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9058979

| Scenario | DPIA |
|---|---|
| Dati di salute solo on-device, nessun server, poche migliaia di utenti | Non obbligatoria in senso stretto, ma va conservata una **valutazione preliminare di soglia** che lo motivi (accountability, art. 5.2) |
| Dati di salute su server, personalizzazione algoritmica, base utenti significativa | **Obbligatoria** |
| Uso di IA o LLM per generare schede a partire dalle patologie | **Obbligatoria**, con capitolo su logica del modello, dati inviati al fornitore, allucinazioni e output pericolosi |
| Utenti minorenni ammessi | Fortemente raccomandata o obbligatoria |

**Minori**: art. 8 GDPR fissa la soglia a 16 anni, con facoltà per gli Stati di abbassarla; l'**art. 2-quinquies d.lgs. 196/2003** la porta in Italia a **14 anni**. Per questa app la raccomandazione è comunque **età minima 18 anni nei Termini d'uso**, per tre ragioni convergenti: capacità di agire e validità del contratto (artt. 2 e 1425 c.c.), profilo di rischio dell'allenamento con sovraccarichi in età evolutiva, e raccomandazione dello stesso Garante nel vademecum fitness tracker.

### 2.6 Normativa italiana e professioni sanitarie

**Art. 348 c.p.** (esercizio abusivo di una professione, come modificato dalla l. 3/2018): reclusione da sei mesi a tre anni e multa da 10.000 a 50.000 euro, con pubblicazione della sentenza e confisca. Aggravante (reclusione da uno a cinque anni, multa da 15.000 a 75.000 euro) per il **professionista che determini altri a commettere il reato o ne diriga l'attività**: è il comma che colpisce il medico o il fisioterapista che "presta il nome" all'app.

La giurisprudenza distingue il trattamento a fini di **benessere** (lecito) da quello a **finalità curative** (riservato): la stessa logica del MDR. La soglia penale per un software si avvicina quando il sistema **diagnostica** o **prescrive un trattamento** per una patologia.

**Chi è chi**
- **Laureato in scienze motorie / chinesiologo**: **non è una professione sanitaria**. L'art. 41 del d.lgs. 36/2021 riconosce chinesiologo di base (L-22), delle attività motorie preventive e adattate (LM-67) e sportivo (LM-68). Non diagnostica e non prescrive terapie.
- **Fisioterapista**: professione sanitaria (d.m. 741/1994, albo ex l. 3/2018), riabilita di norma su indicazione medica.
- **Medico**: unico titolare di diagnosi e prescrizione terapeutica.

**Cosa l'app può fare**: proporre programmi per forma fisica, forza, ipertrofia, resistenza, dimagrimento generico e benessere; descrivere tecnica, volumi, carichi e progressioni; filtrare o escludere esercizi in base a limitazioni dichiarate, presentandolo come **cautela**; rinviare a medico, fisioterapista o chinesiologo; richiamare linee guida riconosciute come riferimenti generali di allenamento.

**Cosa l'app non può fare**: formulare o suggerire una diagnosi; proporre piani riabilitativi o "protocolli" per una patologia; dichiarare finalità terapeutiche, antalgiche o preventive di malattie; suggerire di sospendere, sostituire o modificare terapie e farmaci; fornire prescrizioni dietetiche per patologie; usare titoli o suggestioni sanitarie ingannevoli (camice, croce, "team medico" inesistente).

Altri profili da presidiare: Codice del consumo artt. 20-23 (pratiche commerciali ingannevoli, competenza AGCM); Reg. (CE) 1924/2006 se compaiono consigli alimentari o integratori; art. 1, commi 525-536, l. 145/2018 sulla pubblicità sanitaria se compaiono professionisti sanitari partner.

### 2.7 Disclaimer pronto all'uso, versione lunga

Da pubblicare come pagina dedicata o sezione dei Termini d'uso. Sostituire i segnaposto tra parentesi quadre.

---

**AVVERTENZE IMPORTANTI E LIMITAZIONE DI RESPONSABILITÀ**

*Ultimo aggiornamento: [data] · Versione: [x.y]*

**1. Natura del servizio.** [NOME APP] è un'applicazione dedicata al **fitness e al benessere**. Il servizio consiste nella generazione automatizzata di proposte di allenamento personalizzate sulla base delle informazioni che l'Utente sceglie di fornire (obiettivi, esperienza, attrezzatura disponibile, tempo a disposizione, eventuali limitazioni dichiarate) e nella registrazione dei propri allenamenti.

**2. [NOME APP] non è un dispositivo medico.** [NOME APP] non è un dispositivo medico ai sensi del Regolamento (UE) 2017/745 e non è destinata dal fabbricante ad alcuna finalità medica di diagnosi, prevenzione, monitoraggio, previsione, prognosi, trattamento o attenuazione di malattie, né alla diagnosi, al monitoraggio, al trattamento, all'attenuazione o alla compensazione di lesioni o disabilità. L'applicazione non è soggetta a marcatura CE come dispositivo medico e non deve essere utilizzata per finalità mediche.

**3. I contenuti non costituiscono consulenza medica.** Tutti i contenuti presenti in [NOME APP] (schede, esercizi, testi esplicativi, video, parametri di allenamento, suggerimenti) hanno finalità esclusivamente informative, educative e di allenamento generale. Essi non costituiscono e non sostituiscono in alcun caso: una diagnosi, un parere, una prescrizione o una terapia medica; un programma di fisioterapia o di riabilitazione; una valutazione funzionale o clinica effettuata da un professionista; un piano alimentare o dietoterapico. L'utilizzo dell'applicazione non instaura alcun rapporto professionale sanitario tra l'Utente e [TITOLARE], né tra l'Utente e i soggetti che hanno contribuito alla realizzazione dei contenuti.

**4. Obbligo di valutazione medica preventiva.** Prima di iniziare qualsiasi programma di attività fisica, l'Utente è tenuto a consultare un medico e a ottenere il suo parere favorevole, in particolare se ricorre anche una sola delle seguenti condizioni: è sedentario da lungo tempo o non si allena abitualmente; ha più di 35 anni e non ha effettuato controlli medici recenti; soffre o ha sofferto di patologie cardiache, ipertensione, patologie respiratorie, metaboliche (incluso il diabete), neurologiche, osteoarticolari o muscolo-tendinee; avverte dolore toracico a riposo o durante l'attività, capogiri, perdite di equilibrio o di coscienza; assume farmaci a titolo continuativo; ha subito interventi chirurgici, traumi o infortuni, anche pregressi; è in stato di gravidanza, nel post partum o allatta; è un soggetto minorenne o di età avanzata. In Italia, per l'attività sportiva svolta presso impianti e associazioni sportive, può essere richiesta una certificazione medica di idoneità all'attività sportiva non agonistica o agonistica: è responsabilità dell'Utente verificarne la necessità e procurarsela.

**5. Informazioni fornite dall'Utente e loro utilizzo.** In fase di registrazione l'Utente può indicare, su base facoltativa, eventuali patologie pregresse, infortuni o limitazioni funzionali. Tali informazioni sono utilizzate esclusivamente per **escludere o limitare in via prudenziale** determinati esercizi dalle proposte generate. Questa funzione non ha alcuna finalità clinica: non costituisce una valutazione del quadro di salute dell'Utente, non è idonea a individuare controindicazioni all'esercizio fisico e non garantisce che gli esercizi proposti siano adatti alla sua specifica condizione. La valutazione di idoneità compete unicamente a un medico. L'Utente è responsabile della veridicità, completezza e aggiornamento delle informazioni fornite: informazioni inesatte, incomplete o non aggiornate possono determinare la proposta di esercizi non adatti.

**6. Assunzione consapevole del rischio.** L'Utente riconosce e accetta che l'attività fisica comporta rischi intrinseci, tra cui, a titolo esemplificativo: affaticamento, indolenzimento muscolare, stiramenti, strappi, distorsioni, lesioni muscolari, tendinee, legamentose, articolari e ossee, traumi da caduta o da manipolazione di carichi, disidratazione, colpo di calore, malori, eventi cardiovascolari acuti e, in casi estremi, eventi con esito infausto. L'Utente dichiara di utilizzare [NOME APP] volontariamente, a proprio esclusivo rischio, e di assumersi la piena responsabilità della scelta di svolgere gli allenamenti proposti, della loro esecuzione, dell'intensità e dei carichi adottati, nonché dell'idoneità dell'ambiente e delle attrezzature utilizzate.

**7. Interruzione immediata in caso di sintomi.** L'Utente si impegna a interrompere immediatamente l'allenamento e a contattare un medico o i servizi di emergenza (112) in presenza di: dolore toracico, oppressione o senso di peso al petto, dolore irradiato a braccio, collo o mandibola, affanno sproporzionato allo sforzo, palpitazioni o battito irregolare, capogiri, vertigini, sensazione di svenimento, nausea, confusione, disturbi della vista, sudorazione fredda, dolore articolare o muscolare acuto o improvviso, formicolii, perdita di forza o di sensibilità. **Il dolore non è un obiettivo dell'allenamento.** In presenza di dolore l'Utente deve fermarsi, non "spingere oltre".

**8. Limiti dell'algoritmo e dei contenuti.** Le proposte di allenamento sono generate in modo automatizzato sulla base di regole generali di programmazione dell'allenamento e delle informazioni fornite dall'Utente. Esse non sono verificate caso per caso da un professionista prima di essere mostrate, possono contenere errori, imprecisioni od omissioni, e non tengono conto di elementi non dichiarati o non conoscibili dall'applicazione. Le proposte costituiscono un suggerimento: l'Utente è libero di non seguirle, di modificarle o di sottoporle a un professionista qualificato. Nessuna decisione rilevante per la salute deve essere assunta sulla sola base dell'applicazione.

**9. Uso corretto e supervisione.** Si raccomanda di: apprendere la tecnica di esecuzione degli esercizi da un professionista qualificato prima di eseguirli con carichi significativi; utilizzare attrezzature integre e adeguate; allenarsi in ambiente sicuro; utilizzare fermi, collari e dispositivi di sicurezza; ricorrere a uno spotter negli esercizi che lo richiedono; non allenarsi in caso di febbre, malessere, privazione di sonno o sotto l'effetto di alcol, sostanze o farmaci che alterino vigilanza e coordinazione.

**10. Età minima.** L'utilizzo di [NOME APP] è riservato a soggetti che abbiano compiuto 18 anni. Con la registrazione l'Utente dichiara di aver compiuto 18 anni. [TITOLARE] si riserva di sospendere o chiudere gli account per i quali risulti il mancato rispetto del requisito di età.

**11. Limitazione di responsabilità.** Nei limiti massimi consentiti dalla legge applicabile, [TITOLARE] non risponde di danni derivanti da: utilizzo dell'applicazione per finalità mediche, diagnostiche, terapeutiche o riabilitative; inosservanza delle presenti avvertenze; informazioni inesatte, incomplete o non aggiornate fornite dall'Utente; errata esecuzione degli esercizi; utilizzo di attrezzature inadeguate o non sicure; mancata consultazione preventiva di un medico; prosecuzione dell'attività in presenza di sintomi; indisponibilità, malfunzionamenti o interruzioni del servizio o perdita dei dati salvati localmente sul dispositivo. **Nulla nelle presenti avvertenze esclude o limita la responsabilità di [TITOLARE] per dolo o colpa grave, per i danni derivanti da morte o lesioni personali cagionati da un fatto o un'omissione di [TITOLARE], né i diritti inderogabili riconosciuti al consumatore dalla normativa applicabile.**

**12. Dati personali.** Il trattamento dei dati personali è descritto nell'Informativa privacy [link]. Le informazioni relative a patologie pregresse e infortuni costituiscono dati relativi alla salute ai sensi dell'art. 4, punto 15, e dell'art. 9 del Regolamento (UE) 2016/679 e sono trattate esclusivamente previo consenso esplicito dell'Utente, revocabile in qualsiasi momento. *[Se applicabile:]* Tali informazioni sono conservate esclusivamente sul dispositivo dell'Utente e non vengono trasmesse ai nostri server.

**13. Modifiche.** [TITOLARE] può aggiornare le presenti avvertenze. Le modifiche sostanziali saranno comunicate all'interno dell'applicazione e potrà essere richiesta una nuova accettazione.

**14. Legge applicabile e foro.** Le presenti avvertenze sono regolate dalla legge italiana. Per i consumatori resta ferma la competenza del foro di residenza o domicilio elettivo del consumatore ai sensi dell'art. 66-bis del Codice del consumo.

*Contatti: [email] · [TITOLARE, forma giuridica, sede, P.IVA]*

---

### 2.8 Disclaimer pronto all'uso, versione breve di onboarding

Modale da accettare prima di generare la prima scheda.

---

**PRIMA DI INIZIARE, LEGGI CON ATTENZIONE**

**[NOME APP] è un'app di fitness e benessere. Non è un dispositivo medico e non fornisce consulenza medica.**

- **Consulta un medico prima di iniziare**, soprattutto se sei sedentario, hai più di 35 anni, sei in gravidanza, assumi farmaci o hai (o hai avuto) problemi cardiaci, respiratori, metabolici, articolari o muscolari.
- **Le schede non sono terapie.** Non curano, non riabilitano e non trattano patologie o infortuni. Non sostituiscono la diagnosi, la terapia o la riabilitazione prescritte da un professionista.
- **Le limitazioni che dichiari servono solo a escludere alcuni esercizi in via prudenziale.** Non sono una valutazione della tua salute e non garantiscono che gli esercizi proposti siano adatti a te.
- **Fermati subito** se avverti dolore al petto, affanno anomalo, capogiri, palpitazioni, nausea, dolore acuto o improvviso. Contatta un medico o chiama il **112**.
- **Ti alleni a tuo rischio.** L'attività fisica comporta rischi di infortunio. Sei responsabile della scelta di allenarti, della tecnica e dei carichi che usi.
- **Riservata ai maggiori di 18 anni.**

☐ Ho letto e accetto le **Avvertenze e Condizioni d'uso** e l'**Informativa privacy**. Dichiaro di avere almeno 18 anni e di allenarmi sotto la mia esclusiva responsabilità.

☐ Acconsento espressamente al trattamento dei dati relativi alla mia salute (patologie pregresse, infortuni, limitazioni) al solo fine di escludere esercizi dalle schede generate, ai sensi dell'art. 9, par. 2, lett. a) del GDPR. *Facoltativo: senza questo consenso puoi comunque usare l'app e ricevere schede generiche. Puoi revocarlo in ogni momento dalle Impostazioni.*

[ Continua ]

---

**Regole di implementazione della modale, da rispettare per non vanificarla**: due checkbox distinte e non preflaggate; il secondo consenso deve essere realmente opzionale e il flusso deve proseguire anche senza; pulsante attivo solo dopo la prima spunta; salvare `accepted_at`, `document_version`, `consent_health`, `consent_at`; ripresentare la modale al cambio di versione sostanziale; rendere il testo accessibile in ogni momento dal menu.

### 2.9 Microcopy in-app

- **In testa a ogni scheda generata**: "Proposta generata automaticamente. Non è una prescrizione medica né un programma riabilitativo. In caso di dolore, fermati."
- **Nel form patologie e infortuni**: "Queste informazioni sono facoltative e servono solo a escludere alcuni esercizi in via prudenziale. Non sono una valutazione medica. Restano salvate solo su questo dispositivo."
- **Su esercizio tecnicamente impegnativo** (stacco, squat, military press, distensioni pesanti): "Esercizio tecnicamente impegnativo. Fatti seguire da un professionista qualificato per l'apprendimento della tecnica prima di usare carichi elevati."
- **Se l'utente dichiara un infortunio recente**: "Hai indicato un infortunio. Ti consigliamo di non iniziare e di rivolgerti prima a un medico o a un fisioterapista. [Ho il via libera del medico] [Interrompi]"
- **Gravidanza dichiarata**: "Per la tua sicurezza non generiamo schede in gravidanza o post partum senza il parere del tuo medico."
- **Footer app e sito**: "[NOME APP] è un'app di fitness e benessere. Non è un dispositivo medico ai sensi del Reg. (UE) 2017/745 e non fornisce consulenza medica."

### 2.10 Limiti giuridici del disclaimer

Il disclaimer non è uno scudo totale e non va venduto internamente come tale.

- **Art. 1229 c.c.**: è **nullo** ogni patto che escluda o limiti preventivamente la responsabilità per **dolo o colpa grave**.
- **Art. 33, comma 2, lett. a), Codice del consumo**: si presumono **vessatorie** le clausole che escludono o limitano la responsabilità del professionista in caso di **morte o danno alla persona** del consumatore. L'art. 36 prevede per queste la **nullità di protezione** (elenco nero): non sanabili nemmeno con doppia sottoscrizione.
- **Art. 1341, comma 2, c.c.**: nei contratti per adesione B2B le clausole di limitazione richiedono specifica approvazione scritta; nei contratti con consumatori la doppia spunta non salva comunque le clausole dell'elenco nero.

Da qui la formulazione del punto 11 della versione lunga, che limita "nei limiti massimi consentiti dalla legge" e fa **salva espressamente** la responsabilità per dolo, colpa grave, morte e lesioni personali. Una clausola che dicesse "[TITOLARE] non risponde in nessun caso di lesioni" sarebbe nulla e, peggio, indizio di scorrettezza professionale.

Il valore reale del disclaimer è: definire e documentare la destinazione d'uso non medica, assolvere l'obbligo di informazione e avvertimento del rischio, documentare l'assunzione del rischio da parte dell'utente e la diligenza del fornitore. Va affiancato da una **polizza RC prodotto e servizi** adeguata, che è il vero strumento di gestione del rischio residuo.

> **Nota**: questa sezione è una ricognizione tecnico-normativa, non un parere legale reso da un professionista abilitato. Prima della pubblicazione, far validare i testi contrattuali e la DPIA da un avvocato e da un DPO.

---
## 3. Mappatura condizione, restrizioni e adattamenti

**Legenda severità** (enum usato anche nel JSON):

| Livello | Codice | Comportamento in app |
|---|---|---|
| Blocco duro | `hard_block` | Esercizio escluso dalla generazione e non selezionabile manualmente. Sbloccabile solo tramite flag di nulla osta professionale con audit trail |
| Avviso | `warning` | Mostrato con modale di conferma esplicita e alternativa suggerita |
| Consiglio | `advice` | Mostrato normalmente, con badge informativo sui parametri da modificare |
| Stop medico | `medical_stop` | Interrompe la sessione, blocca la generazione, rinvia a valutazione medica o al 112 |

**Nota trasversale sui nomi degli esercizi.** Le blacklist qui sotto sono state verificate sul dataset del progetto (`db-exercise/dist/exercises.json`, 876 esercizi, schema con `force`, `level`, `mechanic`, `equipment`, `primaryMuscles`, `secondaryMuscles`, `category`). Dove indicato "match reali", il numero è il conteggio effettivo sul dataset.

---

### 3.1 Ernia del disco lombare e lombalgia cronica

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Flessione lombare massimale sotto carico esterno (schiena "a gancio") | Pressione intradiscale in vivo 2,3 MPa sollevando 20 kg a schiena flessa contro 1,1 MPa tenendo il carico vicino al corpo, 0,5 MPa in piedi rilassato (Wilke, Spine 1999) | `hard_block` in fase acuta o radicolare, `warning` in cronico |
| Flessione + rotazione lombare combinate sotto carico | Meccanismo classico di lesione anulare ed erniazione | `hard_block` |
| Flessione lombare ripetuta a end-range in carico assiale | Creep dei tessuti posteriori, migrazione nucleare posteriore | `hard_block` |
| Iperestensione lombare balistica sotto carico | Compressione delle faccette, peggiora se stenosi o spondilolistesi | `warning` |
| Compressione assiale massimale con Valsalva prolungata | Picco di pressione intradiscale e intra-addominale | `warning` |
| Impatto ripetuto ad alta frequenza in fase acuta | Carichi compressivi ciclici | `warning` |

**Blacklist ed esempi reali dal dataset**
`Good Morning` e le 7 varianti (`Band Good Morning`, `Seated Good Mornings`, `Stiff Leg Barbell Good Morning`, `Hanging Bar Good Morning`, `Good Morning off Pins`); `Barbell Deadlift`, `Sumo Deadlift`, `Romanian Deadlift`, `Stiff-Legged Barbell Deadlift`, `Deficit Deadlift`, `Snatch Deadlift` (24 match su `deadlift`); `Bent Over Barbell Row`, `Pendlay Row`, `T-Bar Row`; `Sit-Up`, `3/4 Sit-Up`, `Janda Sit-Up`, `Jackknife Sit-Up`, `Weighted Sit-Ups - With Bands`, `Press Sit-Up`, `Frog Sit-Ups`; tutte le 23 varianti di `Crunch`; `Russian Twist`, `Cable Russian Twists`, `Seated Barbell Twist`, `Plate Twist`, `Standing Cable Wood Chop`; `Hanging Leg Raise`, `Hanging Pike`; `Toe Touchers`, `Standing Toe Touches`; `Barbell Rollout from Bench`, `Ab Roller`; `Clean and Jerk`, `Power Clean`, `Snatch` e le 41 voci olimpiche; `Atlas Stones`, `Tire Flip`, `Yoke Walk`, `Rickshaw Carry` e le 15 voci strongman; i 42 esercizi di salto.

**Keyword di filtro**: `good morning, deadlift, dead lift, sumo, romanian, stiff-legged, stiff leg, rack pull, bent over, bent-over, pendlay, t-bar, back squat, front squat, zercher, hack squat, sit-up, situp, crunch, russian twist, wood chop, woodchop, rollout, roll-out, leg raise, knee raise, toe touch, jefferson, clean, snatch, jerk, atlas stone, tire flip, yoke, keg, box jump, depth jump, broad jump, plow, hyperextension`

**Attrezzi**: preferire `machine` con supporto lombare, `cable` chest-supported, `body only`, `bands`, `exercise ball` a basso carico, `dumbbell` con appoggio toracico. Sconsigliare `barbell` su hinge e squat pesanti in fase sintomatica, `kettlebells` su swing balistici, `medicine ball` su lanci rotatori.

**Categorie da escludere**: `powerlifting`, `olympic weightlifting`, `strongman`, `plyometrics` in fase acuta. Filtrare `strength` e `stretching` sui pattern di flessione. Mantenere `cardio` a basso impatto.

**Esercizi raccomandati**: "Big Three" di McGill (`Curl-Up` di McGill, non sit-up; `Side Bridge`; `Bird Dog`), `Dead Bug`, `Plank`, `Pallof Press`, `Glute Bridge`, `Hip Thrust` in neutro, `Prone Press-Up` se il soggetto è estensione-responsivo, `Leg Press` a ROM parziale con bacino stabile, `Goblet Squat` a box, `Split Squat`, `Step-Up`. Aerobico: camminata progressiva, nuoto, cyclette.

**Parametri**: carico 0-30% 1RM in fase acuta, 40-60% subacuta, fino a 70-85% in cronico asintomatico su pattern controllati; ROM con hinge fermato prima della perdita di neutralità e Leg Press a 90° di flessione d'anca senza retroversione; 8-15 ripetizioni, core endurance in isometria 10 x 10 secondi; tempo 2-1-2 senza rimbalzo; pause 60-120 secondi; core quotidiano, forza 2-3 volte a settimana. Evitare flessione lombare caricata nella prima ora dal risveglio (maggiore idratazione discale).

**Red flag → `medical_stop`**: anestesia a sella, ritenzione o incontinenza urinaria o fecale, deficit motorio bilaterale progressivo (sospetta **sindrome della cauda equina**, emergenza chirurgica, indirizzare al pronto soccorso); deficit motorio progressivo monolaterale (piede cadente); dolore notturno non posizionale, febbre, calo ponderale inspiegato, storia oncologica, trauma maggiore, uso cronico di corticosteroidi; periferalizzazione del dolore durante l'esercizio (stop immediato di quell'esercizio).

**Fonti**: JOSPT Low Back Pain CPG Revision 2021 https://www.jospt.org/doi/10.2519/jospt.2021.0304 · NICE NG59 https://www.nice.org.uk/guidance/ng59/chapter/recommendations · Wilke et al. Spine 1999 https://pubmed.ncbi.nlm.nih.gov/10222525/ · Red flag https://www.consultant360.com/peer-reviewed/revisiting-red-flags-acute-low-back-pain

---

### 3.2 Ernia inguinale e addominale

**Onestà sull'evidenza**: non esistono RCT che dimostrino che il sollevamento pesi causi o peggiori un'ernia già presente. Il razionale è fisiopatologico (pressione intra-addominale). Il messaggio corretto in app è "riduci i picchi di pressione e respira", non "smetti di allenarti".

**Pattern da evitare (fase pre-operatoria, ernia nota non operata)**

| Pattern | Motivazione | Severità |
|---|---|---|
| Valsalva prolungata sotto carico massimale | Picco di pressione intra-addominale attraverso il difetto | `hard_block` su massimali, `warning` su sub-massimali |
| Flessione ripetuta del tronco con contrazione addominale intensa | Contrazione ripetuta della parete contro il difetto | `warning` |
| Sollevamento pesante dal suolo | Combinazione di IAP massima e contrazione della parete | `warning` o `hard_block` se sintomatica |
| Torsioni caricate del tronco | Stress obliquo sul difetto fasciale | `advice` |

**Blacklist**: tutte le varianti di `Sit-Up` e `Crunch`, `Russian Twist`, `Standing Cable Wood Chop`, `Hanging Leg Raise`, `Barbell Rollout from Bench`, `Ab Roller`, `Barbell Deadlift` e varianti, tutta la categoria `olympic weightlifting`, tutta la categoria `strongman`, `Barbell Squat` massimale.
**Keyword**: `sit-up, situp, crunch, russian twist, wood chop, leg raise, rollout, dragon flag, deadlift, clean, snatch, jerk, thruster, atlas stone, tire flip, keg, yoke, log lift, rickshaw, 1rm, max effort`

**Post-operatoria**

| Fase | Tecnica open | Tecnica laparoscopica (TEP/TAPP) |
|---|---|---|
| Camminata leggera | Dalle prime ore, incoraggiata | Dalle prime ore |
| Limite di sollevamento | Non oltre circa 9 kg per **6 settimane** | Non oltre circa 9 kg per **2 settimane** |
| Rientro in palestra progressivo | 6-8 settimane | 3-4 settimane |
| Carichi pesanti e massimali | 2-3 mesi, previo via libera chirurgico | 2-3 mesi |

Nelle prime 6 settimane (open) o 2-4 settimane (laparoscopica) aggiungere in `hard_block`: `Plank`, `Push-Up`, `Pull-Up`, `Chin-Up`, `Dips` e varianti, `Leg Press` pesante, `Barbell Squat`, `Hip Thrust` pesante, `Burpee`, `Mountain Climber`, `Rope Jumping`, `Box Jump`, `Kettlebell Swing`, `Kettlebell Turkish Get-Up`.
**Keyword aggiuntive**: `pull-up, pullup, chin-up, chinup, dip, push-up, pushup, burpee, mountain climber, jump rope, rope jumping, kettlebell swing, turkish`

> **Regola di prodotto**: le linee guida attuali affermano che la restrizione prolungata dell'attività **non è giustificata** dai dati sulle recidive, ma la pratica chirurgica reale resta conservativa e varia molto. L'app deve chiedere data dell'intervento, tecnica e **limite indicato dal chirurgo**, e usare quest'ultimo come override.

**Attrezzi**: preferire `machine`, `cable`, `bands`, `body only` a basso carico. Sconsigliare `barbell` su massimali, `kettlebells` su swing e snatch, `medicine ball` su slam.
**Raccomandati**: `Plank` progressivo, `Dead Bug`, `Bird Dog`, `Pallof Press`, `Side Bridge`, attivazione del trasverso con **respirazione continua e nessuna apnea**; cardio a basso impatto; forza su macchine con schienale.
**Parametri**: carico ≤ 60-70% 1RM, mai test 1RM; 10-20 ripetizioni con espirazione nella fase concentrica (regola operativa: "espira, mai apnea"); pause 90-120 secondi. Se compare bulge visibile o dolore durante l'esercizio, stop di quell'esercizio.

**Red flag → `medical_stop`**: ernia strozzata o incarcerata (dolore addominale improvviso e severo, bulge non riducibile, duro, arrossato o violaceo, nausea o vomito, blocco dell'alveo) → **pronto soccorso**. Post-operatorio: febbre, arrossamento o secrezione della ferita, dolore ingravescente, ricomparsa di bulge, ematoma scrotale importante.

**Fonti**: EHS expert survey https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9200870/ · AFP 2020 https://www.aafp.org/pubs/afp/issues/2020/1015/p487.html · watchful waiting https://www.oaepublish.com/articles/2574-1225.2021.08

---

### 3.3 Problemi cervicali (cervicalgia, ernia cervicale, radicolopatia)

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Carico assiale diretto sul rachide cervicale (bilanciere dietro il collo) | Compressione dei segmenti cervicali e forzatura in estensione | `hard_block` |
| Estensione + rotazione + compressione (posizione di Spurling) | Riduce il forame di coniugazione e comprime la radice | `hard_block` in radicolopatia |
| Abduzione + extrarotazione di spalla con capo in estensione | Combina compressione cervicale e stress gleno-omerale | `hard_block` |
| Flessione cervicale a end-range mantenuta sotto carico | Pressione discale cervicale, tensione neurale | `warning` |
| Iperestensione attiva su macchina o ponti sul capo | Carico diretto in estensione | `hard_block` in ernia o radicolopatia |
| Auto-manipolazione o trazione cervicale ad alta velocità | Rischio neurovascolare | `hard_block`, mai in app |

**Blacklist reale dal dataset**: `Push Press - Behind the Neck`, `Standing Barbell Press Behind Neck`, `Wide-Grip Pulldown Behind The Neck`, `Neck Press`, `Seated Head Harness Neck Resistance`, `Lying Face Down Plate Neck Resistance`, `Lying Face Up Plate Neck Resistance`, `Low Pulley Row To Neck`, `Isometric Neck Exercise - Front And Back`, `Isometric Neck Exercise - Sides`; `Standing Military Press`, `Seated Barbell Military Press`, `Push Press`, `Overhead Squat`, `Clean and Jerk`, `Power Jerk`, `Split Jerk`, `Squat Jerk`; le 5 varianti di `Upright Row`; `Handstand Push-Ups`; `Wide-Grip Rear Pull-Up`.

**Keyword**: `behind the neck, behind neck, neck press, neck pulldown, neck resistance, head harness, rear pull-up, overhead press, military press, push press, push jerk, thruster, arnold press, snatch, jerk, upright row, neck extension, neck flexion, wrestler, headstand, handstand, shoulder stand, plow`

> **Falso positivo da gestire**: la keyword `bridge` intercetterebbe `Glute Bridge` e `Side Bridge`, che sono invece raccomandati. Usare `wrestler's bridge`, `neck bridge`, `wheel pose`, mai `bridge` generico. Anche `shrug` va limitato alla fase acuta e alle varianti pesanti.

**Attrezzi**: preferire `machine` con schienale e supporto toracico, `cable` seduto a busto sostenuto, `bands`, `body only`. Sconsigliare `barbell` overhead e `kettlebells` overhead.
**Gruppi muscolari**: lavorare trapezio medio e inferiore, dentato anteriore, flessori profondi del collo; ridurre inizialmente il carico sul trapezio superiore in dominanza. Bloccare di default `primaryMuscles: ["neck"]` nelle fasi sintomatiche (12 match nel dataset).
**Categorie**: escludere `olympic weightlifting` e `strongman`; escludere `plyometrics` in fase acuta; nel `powerlifting` escludere back squat con bilanciere in fase acuta (la bench press è generalmente tollerata se la testa resta appoggiata); in `stretching` escludere allunghi aggressivi in rotazione ed estensione.

**Raccomandati**: `Craniocervical Flexion / Chin Tuck` con biofeedback pressorio (evidenza di riduzione del dolore da moderata a elevata su meta-analisi di 25 RCT), endurance dei flessori profondi 10 x 10 secondi su 4-6 settimane, `Scapular Retraction`, `Prone Y-T-W-I Raise` a basso carico, `Face Pull` con presa neutra, `Chest Supported Row`, `Wall Slide`, `Serratus Punch`, mobilità toracica (`Thoracic Extension over Foam Roller`, open book).

**Parametri**: carico 0-40% 1RM in fase acuta, 50-70% subacuta, fino a 80% in cronico su esercizi che non caricano l'asse cervicale; elevazione limitata a 90° in fase acuta; 10-15 ripetizioni per la forza generale e 10 x 10 secondi isometrici per i flessori profondi; tempo 2-1-2 senza movimenti balistici del capo; pause 60-90 secondi; flessori profondi quotidiani, rinforzo scapolare 3-5 volte a settimana, forza generale 2-3 volte.

**Red flag → `medical_stop`**: deficit motorio progressivo all'arto superiore, ipostenia ingravescente, atrofia; segni di mielopatia (disturbi dell'andatura, goffaggine delle mani, segno di Lhermitte, iperreflessia, disfunzione sfinterica); "5 D e 3 N" dell'insufficienza vertebro-basilare (vertigini, diplopia, disartria, disfagia, drop attack, nistagmo, nausea, intorpidimento periorale); cefalea a esordio esplosivo, trauma recente, febbre, calo ponderale, storia oncologica. In presenza di **artrite reumatoide**, vedi la controindicazione atlanto-assiale in 3.17.

**Fonti**: JOSPT Neck Pain CPG Revision 2017 https://www.jospt.org/doi/10.2519/jospt.2017.0302 · deep cervical flexor training https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6263552/ · cervical radiculopathy RCT https://www.jospt.org/doi/10.2519/jospt.2014.5065

---

### 3.4 Spalla: cuffia dei rotatori e impingement subacromiale

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Abduzione oltre 90° con intrarotazione ("empty can", pollice in basso) | La grande tuberosità ruota sotto l'arco coraco-acromiale; documentato come più doloroso e biomeccanicamente sfavorevole rispetto al "full can" a parità di attivazione EMG del sovraspinato | `hard_block` |
| Elevazione con gomiti sopra la linea della spalla (upright row) | Il gomito sopra la spalla comprime il sovraspinato sotto l'acromion; la presa stretta amplifica il problema | `hard_block` con presa stretta, `advice` sotto la linea della spalla |
| Carico ripetuto nell'arco doloroso 60-120° | Arco doloroso tipico | `warning` |
| Estensione orizzontale profonda in carico (dip profondi, bench press molto larga, flye a end-range) | Stress anteriore e compressione subacromiale | `warning` |
| Movimenti overhead ripetuti ad alta frequenza in fase irritabile | Sovraccarico cumulativo del tendine | `warning` |

**Blacklist reale**: le 5 varianti di `Upright Row`; `Push Press - Behind the Neck`, `Standing Barbell Press Behind Neck`, `Wide-Grip Pulldown Behind The Neck`, `Wide-Grip Rear Pull-Up`; le 8 varianti di `Dip` (`Dips - Chest Version`, `Dips - Triceps Version`, `Parallel Bar Dip`, `Ring Dips`, `Bench Dips`, `Weighted Bench Dip`, `Dip Machine`); `Wide-Grip Barbell Bench Press`, `Barbell Guillotine Bench Press`; `Butterfly`, `Pec Deck`, le 20 varianti di `Flyes` a end-range profondo; `Standing Military Press`, `Push Press`, `Handstand Push-Ups`; `Overhead Slam`, `Standing Two-Arm Overhead Throw`.

**Keyword**: `upright row, behind the neck, behind neck, rear pull-up, empty can, dip, dips, wide-grip bench, guillotine, pec deck, butterfly, fly, flye, overhead press, military press, push press, arnold, snatch, jerk, overhead squat, muscle-up, kipping, handstand`

**Attrezzi**: preferire `bands` e `cable` (resistenza costante sotto i 90°), `dumbbell` (permette piano scapolare e presa neutra), `machine` a traiettoria controllata, `body only`. Sconsigliare `barbell` overhead e bench press larga, `kettlebells` overhead, `medicine ball` in lanci overhead.
**Categorie**: escludere `olympic weightlifting`, `strongman`, `plyometrics` per l'arto superiore; nel `powerlifting` ammettere la bench press solo con presa non superiore a 1,5 volte la distanza biacromiale e ROM controllato.

**Raccomandati, progressione per irritabilità**: isometrici 30-45 secondi sotto soglia di dolore → isotonici concentrici lenti → eccentrici → heavy slow resistance → funzionale e overhead. Esercizi: `Full Can Raise` (scaption con pollice in alto, sotto 90°), `External Rotation with Band` a 0° di abduzione, `Side-Lying External Rotation`, `Prone Horizontal Abduction`, `Low Row`, `Face Pull` con gomiti sotto la linea della spalla, `Serratus Wall Slide`, `Push-Up Plus`. Il rinforzo del grande pettorale associato a quello di cuffia ha evidenza a supporto.

**Parametri**: isometrici 40-70% MVC; isotonici 30-50% 1RM iniziali con progressione a 70-80%; elevazione limitata a 60-90° in fase irritabile, poi 120°, poi completa; isometria 5 x 30-45 secondi, isotonico 3 x 10-15, heavy slow resistance 3-4 x 6-8 con tempo 3-0-3; pause 60-120 secondi; 3-5 volte a settimana per la cuffia, 2-3 per la forza generale.

**Post-riparazione di cuffia** (sempre subordinato al protocollo del chirurgo): 0-6 settimane tutore in abduzione, solo ROM passivo e pendolare, **nessuna elevazione attiva, nessun carico** (`hard_block` su tutta la forza dell'arto superiore); 6-12 settimane ROM attivo assistito poi attivo, nessun rinforzo resistito; 12-16 settimane inizio rinforzo con bande e manubri leggeri; oltre 16-24 settimane progressione, overhead solo con via libera clinica. Default di prodotto: `hard_block` con richiesta di inserimento del protocollo del chirurgo.

**Red flag → `medical_stop`**: perdita improvvisa di forza in extrarotazione o elevazione (sospetta rottura massiva), dolore notturno severo e ingravescente, blocco articolare, deformità visibile, deficit neurologico.

**Fonti**: Upright Row e impingement, NSCA SCJ 2011 https://journals.lww.com/nsca-scj/fulltext/2011/10000/the_upright_row__implications_for_preventing.2.aspx · empty can vs full can, JSES https://www.jshoulderelbow.org/article/S1058-2746(15)00483-8/abstract · JOSPT 2015 https://www.jospt.org/doi/10.2519/jospt.2015.5941 · programma progressivo criteria-based https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12286389/

---

### 3.5 Spalla: lussazione pregressa e instabilità anteriore

> Profilo **distinto** dal precedente: le blacklist sono in parte opposte. Va gestito come condizione separata nel database.

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| **Abduzione ≥90° + extrarotazione** (posizione di apprensione) | Posizione di lussazione anteriore, stress diretto su capsula e labbro | `hard_block` nei primi 4-6 mesi, `warning` a vita sulle versioni caricate |
| Abduzione + extrarotazione + estensione orizzontale (bench press larga, flye profondo, dip profondo) | Posizione "at-risk" documentata del gleno-omerale | `hard_block` nelle prime fasi, poi `warning` |
| Behind the neck press e pulldown dietro la nuca | Richiedono extrarotazione estrema e stirano la capsula anteriore | `hard_block` permanente |
| Trazione in sospensione a braccio esteso e abdotto (kipping, muscle-up, anelli) | Distrazione della capsula sotto carico | `hard_block` |
| Movimenti balistici overhead (snatch, jerk, lanci) | Perdita di controllo in posizione vulnerabile | `hard_block` |
| Stretching passivo forzato in extrarotazione | Aumenta la lassità anteriore già patologica | `hard_block` |

Indicazione temporale documentata: nessuna extrarotazione oltre il neutro e nessuna abduzione oltre 90° nelle **prime 4-6 settimane**.

**Blacklist reale**: `Standing Barbell Press Behind Neck`, `Push Press - Behind the Neck`, `Wide-Grip Pulldown Behind The Neck`, `Wide-Grip Rear Pull-Up`, `Wide-Grip Barbell Bench Press`, `Wide-Grip Decline Barbell Pullover`, `Butterfly`, `Dumbbell Flyes` e varianti a end-range, `Ring Dips`, `Parallel Bar Dip`, `Standing Military Press`, `Power Jerk`, `Split Jerk`, `Snatch` e varianti, `Overhead Squat`, `Kettlebell Turkish Get-Up` (fasi overhead), `Standing Two-Arm Overhead Throw`, `Supine Two-Arm Overhead Throw`.

**Keyword**: `behind the neck, behind neck, rear pull-up, wide-grip bench, fly, flye, butterfly, pec deck, crossover, dip, dips, overhead press, military press, push press, jerk, snatch, overhead squat, muscle-up, kipping, cuban, dislocate, chest stretch, behind head, get-up, throw`

**Attrezzi**: preferire `machine` a traiettoria vincolata, `cable` con gomito vicino al corpo, `bands`, `dumbbell` in presa neutra; panca piana e declinata limitano l'extrarotazione rispetto all'inclinata larga. Sconsigliare anelli, sbarra in sospensione libera, `barbell` e `kettlebells` overhead, `medicine ball` in lanci.
**Categorie**: `hard_block` su `olympic weightlifting`; escludere `strongman`, `plyometrics` dell'arto superiore e `stretching` del comparto anteriore di spalla.

**Raccomandati**: isometrici di cuffia a 0° di abduzione, poi dinamici con gomito al fianco, poi progressione dell'abduzione solo con controllo verificato. `Internal Rotation with Band`, `External Rotation with Band`, `Scapular Retraction`, `Low Row`, `Prone Rows`, `Push-Up Plus` (catena chiusa, alta co-contrazione), `Bear Crawl`. Enfasi su sottoscapolare (stabilizzatore anteriore primario) e controllo scapolare.
**Parametri**: hard cap software su abduzione 90° ed extrarotazione oltre il neutro per i primi 3 mesi; carico 30-50% 1RM iniziale, mai massimali overhead; 12-20 ripetizioni per l'endurance dei rotatori, 8-12 per la forza generale; 3-5 volte a settimana per la cuffia. La riabilitazione completa può richiedere fino a 12 mesi.
**Red flag → `medical_stop`**: nuovo episodio di lussazione o sublussazione, sensazione di "uscita" della spalla, deficit del nervo ascellare (ipoestesia del deltoide laterale, deficit di abduzione).

**Fonti**: Current Concepts in Rehabilitation for Traumatic Anterior Shoulder Instability https://pmc.ncbi.nlm.nih.gov/articles/PMC5685970/ · protocollo conservativo https://www.renoortho.com/wp-content/uploads/2023/03/UPPAL-Non-Operative-Shoulder-Instability-1.pdf

---

### 3.6 Ginocchio: dolore femoro-rotuleo (condropatia rotulea)

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Squat profondo (oltre 90-100° di flessione) sotto carico | Lo stress femoro-rotuleo cresce con l'angolo di flessione in catena chiusa | `hard_block` in fase iniziale, poi `warning` |
| Leg extension a catena aperta nell'arco 0-30° con carico elevato | Massima forza di reazione femoro-rotulea con minima area di contatto | `warning` |
| Discese e affondi profondi ripetuti, step-down da altezza elevata | Carico eccentrico ripetuto sul comparto | `advice` |
| Valgo dinamico in appoggio monopodalico | Aumenta lo stress laterale sulla rotula | `advice` con cue correttivo |
| Salti e atterraggi ripetuti in fase dolorosa | Carico d'impatto ciclico | `warning` |

**ROM di sicurezza documentato**: lo squat 0-45° è il più protettivo; si progredisce a 90° se il movimento non riproduce il dolore.

**Blacklist reale**: `Barbell Full Squat`, `Weighted Sissy Squat`, `Hack Squat`, `Barbell Hack Squat`, `Narrow Stance Hack Squats`, `Kettlebell Pistol Squat`, `Smith Machine Pistol Squat`, `Leg Press` profondo, `Freehand Jump Squat`, `Weighted Jump Squat`, `Kneeling Jump Squat`, i 42 esercizi di salto, `Barbell Walking Lunge`, `Dumbbell Lunges` profondi, `Split Squat with Dumbbells` profondi.
**Keyword**: `sissy squat, hack squat, full squat, deep squat, pistol, shrimp, jump squat, box jump, depth jump, broad jump, tuck jump, burpee, leg extension, lunge, split squat, step-down, wall sit, stair`

> **Attenzione**: `squat` generico **non va bloccato**, lo squat parziale è raccomandato. Il filtro deve agire sulla profondità (attributo da aggiungere al dataset, vedi 4.6) o sulle varianti note profonde.

**Attrezzi**: preferire `machine` (leg press a ROM parziale), `cable`, `bands` per abduttori ed extrarotatori d'anca, `body only`, `exercise ball` per wall squat. Sconsigliare `barbell` su squat profondo e `medicine ball` su drop e jump.
**Categorie**: escludere `plyometrics` in fase sintomatica, `olympic weightlifting` (ricezione profonda), `strongman`.
**Raccomandati (JOSPT PFP CPG 2019, livello A)**: **combinazione di esercizio per l'anca posteriore e per il quadricipite**, con effetti mantenuti fino a 5 anni; nessuna superiorità tra catena aperta e chiusa. `Hip Abduction`, `Side-Lying Clamshell`, `Monster Walk`, `Hip Thrust`, `Glute Bridge`, `Terminal Knee Extension with Band`, `Wall Squat 0-45°`, `Mini Squat`, `Lateral Step-Up`, `Forward Step-Up` basso. Taping rotuleo in combinazione all'esercizio per la riduzione immediata del dolore e nel breve termine.
**Parametri**: carico 40-60% 1RM iniziale poi 70-80%; **vincolo primario ROM: flessione di ginocchio 0-45° iniziale, poi 60°, poi 90°**; 3 x 10-15; tempo 2-1-3 con enfasi eccentrica; pause 60-90 secondi; 3 volte a settimana per almeno 6-12 settimane; dolore ≤3/10 durante l'esercizio e non peggiorato a 24 ore.
**Red flag**: blocco articolare vero, versamento importante e ricorrente, cedimento ripetuto, dolore notturno, dolore riferito all'anca in adolescente (escludere epifisiolisi), trauma acuto con incapacità di carico.

**Fonti**: JOSPT Patellofemoral Pain CPG 2019 https://www.jospt.org/doi/10.2519/jospt.2019.0302

---

### 3.7 Ginocchio: lesione meniscale

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Flessione profonda + rotazione sotto carico | Meccanismo lesivo classico: compressione più torsione | `hard_block` |
| Cambi di direzione, pivot, taglio in fase precoce | Carico rotazionale sul menisco | `hard_block` in fase precoce |
| Accovacciamento massimale nelle prime 4-12 settimane post-sutura | Compressione del corno posteriore sul sito di sutura | `hard_block` post-riparazione |
| Estensione forzata contro blocco articolare | Rischio di aggravare un manico di secchio | `hard_block` |

> **Differenza cruciale post-chirurgica**: dopo **meniscectomia** le restrizioni sono brevi (carico precoce, ROM libero). Dopo **sutura o trapianto** sono lunghe: flessione limitata a 90° e carico limitato nelle prime 4-6 settimane, nessuna flessione profonda in carico per 4 mesi, nessun pivot o cutting per 4-6 mesi. L'app deve chiedere **quale** intervento è stato eseguito.

**Blacklist reale**: `Barbell Full Squat`, `Hack Squat`, `Weighted Sissy Squat`, `Kettlebell Pistol Squat`, `Leg Press` profondo, `Lateral Bound`, `Alternate Leg Diagonal Bound`, `Side Hop-Sprint`, `Single-Leg Lateral Hop`, `Side to Side Box Shuffle`, `Box Jump (Multiple Response)`, `Depth Jump Leap`, `Clean`, `Snatch`, `Overhead Squat`, `Crossover Reverse Lunge`, `Kneeling Squat`.
**Keyword**: `deep squat, full squat, sissy, pistol, shrimp, hack squat, cossack, curtsy, lateral bound, skater, cutting, agility, box jump, depth jump, tuck jump, jump squat, broad jump, clean, snatch, overhead squat, duck walk, kneeling`

**Raccomandati**: il consenso ESSKA-AOSSM-AASPT 2024 stabilisce che il trattamento non operatorio con fisioterapia è la **prima linea per le lesioni degenerative**; un programma neuromuscolare supervisionato di **12 settimane** ha esiti simili alla chirurgia nelle lesioni traumatiche. `Leg Press` a ROM parziale, `Wall Squat 0-60°`, `Step-Up`, `Terminal Knee Extension`, `Glute Bridge`, `Hip Abduction`, `Single Leg Balance`, `Nordic Hamstring` progressivo, `Calf Raise`, cyclette.
**Parametri**: hard cap a 90° di flessione nelle prime fasi post-riparazione; carico progressivo 50-80% 1RM in fase avanzata; 3 x 10-15; 2-3 volte a settimana per almeno 12 settimane; nessun pivot o cutting fino a criteri funzionali soddisfatti.
**Red flag**: blocco articolare in flessione (manico di secchio incarcerato), versamento acuto ingravescente, incapacità di estendere completamente, cedimenti ripetuti.

**Fonti**: ESSKA-AOSSM-AASPT Meniscus Rehabilitation Consensus 2024 Part I https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12310086/ · Part II https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12310080/

---

### 3.8 Ginocchio: ricostruzione LCA

**Vincoli temporali**

| Fase | Vincolo | Severità |
|---|---|---|
| 0-4 settimane | Nessuna estensione di ginocchio resistita a catena aperta | `hard_block` |
| 4-12 settimane | Catena aperta **solo nell'arco 90°-45°**, progressione circa 10° a settimana; niente resistenze elevate nei primi 3 mesi per non allungare il graft | `warning` con vincolo ROM |
| Fasi iniziali | **Carichi elevati nell'arco 40°-0° a catena aperta**: massima traslazione anteriore tibiale | `hard_block` |
| Fino a criteri soddisfatti | Pivot, cutting, decelerazioni, salti monopodalici, sport di contatto | `hard_block` |
| Graft da semitendinoso/gracile | Cautela sui carichi massimali degli ischiocrurali nelle prime 6-12 settimane | `warning` |
| Graft da tendine rotuleo (BTB) | Cautela su carico femoro-rotuleo, deep squat, leg extension terminale | `warning` |

**Blacklist reale (fase 0-4 mesi)**: `Leg Extension`, `Barbell Squat` pesante, `Barbell Full Squat`, tutti i 42 esercizi di salto, `Lunge Sprint`, `Side Hop-Sprint`, `Clean`, `Snatch`, `Power Jerk`, `Overhead Squat`, `Kettlebell Pistol Squat`, `Running, Treadmill` fino a circa 12 settimane, `Lying Leg Curls` pesanti se graft da hamstring.
**Keyword**: `leg extension, jump, plyo, bound, skater, agility, cutting, shuttle, sprint, run, jog, clean, snatch, jerk, overhead squat, pistol, deep squat, full squat`

**Raccomandati per fase**: precoce `Quad Set`, `Straight Leg Raise`, `Heel Slide`, `Calf Raise`, `Glute Bridge`, `Mini Squat 0-60°`, `Leg Press` a ROM limitato, cyclette; intermedia `Split Squat`, `Step-Up`, `Nordic Hamstring`, `Romanian Deadlift`, `Single Leg Press`, propriocezione; avanzata forza pesante bilaterale e monopodalica, pliometria progressiva (doppio → singolo arto), cambio di direzione.
**Criteri di ritorno allo sport documentati**: LSI (Limb Symmetry Index) superiore al 90% su forza isocinetica di quadricipiti e ischiocrurali **e** su tutti e 4 gli hop test. Chi non soddisfa i criteri ha un tasso di re-infortunio significativamente più alto. In uno studio prospettico, a 9 mesi dalla ricostruzione solo l'11,3% dei pazienti soddisfaceva tutti i criteri: **non usare mai il solo criterio temporale**.
**Parametri**: fase 1 peso corporeo, fase 2 50-70% 1RM, fase 3 80-90% su catena chiusa; catena aperta vincolata 90-45° dalla quarta settimana con +10° a settimana; 3-4 x 8-15, forza pesante 4 x 5-8 in fase avanzata; pause 90-180 secondi; 3-5 volte a settimana, minimo 9 mesi prima del ritorno a sport di pivot.
**Red flag**: versamento ricorrente dopo le sedute, cedimento, perdita dell'estensione completa, dolore anteriore severo, blocco articolare, sensazione di instabilità.

**Fonti**: OKC knee extension after ACLR, IJSPT https://ijspt.scholasticahq.com/article/18983-considerations-with-open-kinetic-chain-knee-extension-exercise-following-acl-reconstruction · UDPT ACL Rehab Guideline https://bpb-us-w2.wpmucdn.com/sites.udel.edu/dist/c/3448/files/2016/01/UDPT-ACL-Rehab-Guideline-REVISED.pdf · RTS criteria https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6267144/

---

### 3.9 Gomito: epicondilite laterale ed epitrocleite mediale

**Pattern da evitare**

| Pattern | Condizione | Motivazione | Severità |
|---|---|---|---|
| Presa forte con polso in estensione e gomito esteso | Epicondilite laterale | Massima sollecitazione dell'ECRB, è la posizione del test provocativo | `warning` |
| Estensione di polso resistita ad alto carico in fase reattiva | Epicondilite laterale | Sovraccarico del tendine irritabile | `warning` |
| Supinazione resistita a gomito esteso | Epicondilite laterale | Coinvolge supinatore ed ECRB | `advice` |
| Flessione di polso resistita ad alto carico | Epitrocleite | Carico diretto sui flessori | `warning` |
| Pronazione resistita ripetuta | Epitrocleite | Pronatore rotondo | `warning` |
| Presa massimale e prolungata (dead hang, farmer's walk pesante) | Entrambe | Carico cumulativo sull'origine comune | `warning` |
| Movimenti balistici con presa (swing, snatch, slam) | Entrambe | Picchi di carico incontrollati | `warning` |

**Blacklist reale**: le 12 varianti di `Wrist Curl` (`Cable Wrist Curl`, `Palms-Down Wrist Curl Over A Bench`, `Seated Palm-Up Barbell Wrist Curl`, `Standing Palms-Up Barbell Behind The Back Wrist Curl`, ecc.) in fase reattiva, `Wrist Roller`, `Wrist Circles` sotto carico, `Side Wrist Pull`, `Farmer's Walk`, `Rickshaw Carry`, `Yoke Walk`, `Atlas Stones`, `Tire Flip`, `Sledgehammer Swings`, `Battling Ropes`, `Mixed Grip Chin`, `Pull-Ups` zavorrati, tutta la categoria `olympic weightlifting` e `strongman`.
**Keyword**: `wrist curl, wrist roller, wrist extension, reverse curl, hammer curl (fase reattiva), farmer, rickshaw, yoke, atlas, tire flip, sledgehammer, battling ropes, grip, dead hang, kettlebell swing, snatch, clean, muscle-up, kipping`

**Attrezzi**: preferire `bands` e `cable` a carico basso e costante, `dumbbell` leggeri per il lavoro eccentrico controllato, `machine` che riduce la richiesta di presa; utili le fasce da polso o gli straps per scaricare la presa negli esercizi di tirata. Sconsigliare `barbell` pesante in presa pronata e `kettlebells` balistici.
**Categorie**: escludere `strongman` e `olympic weightlifting`; filtrare `strength` sulle varianti che caricano la presa massimale.
**Raccomandati (JOSPT Lateral Elbow Pain CPG 2022)**: esercizio terapeutico progressivo come intervento centrale. Progressione **isometrici → eccentrici lenti → heavy slow resistance → funzionale**: `Isometric Wrist Extension` (5 x 45 secondi, sotto soglia di dolore), `Eccentric Wrist Extension` con manubrio leggero o FlexBar, `Tyler Twist` (eccentrico con barra flessibile, evidenza specifica per l'epicondilite laterale), `Reverse Tyler Twist` per l'epitrocleite, rinforzo di cuffia e stabilizzatori scapolari (il deficit prossimale è un fattore contribuente documentato). L'evidenza recente indica di **non usare gli eccentrici come gold standard isolato**: la progressione combinata è superiore.
**Parametri**: isometrici 5 x 45 secondi al 40-70% MVC, 1-2 volte al giorno in fase reattiva; eccentrici 3 x 15 a tempo 3-4 secondi, una volta al giorno; carichi bassi (1-3 kg) all'inizio; pause 60 secondi; 12 settimane di programma come orizzonte realistico; regola del dolore fino a 5/10 con ritorno al basale la mattina dopo.
**Red flag**: deficit neurologico distale (sospetta compressione del nervo interosseo posteriore o del nervo ulnare al gomito), instabilità del gomito, dolore notturno costante, gonfiore articolare, blocco articolare, storia di infiltrazioni multiple con peggioramento.

**Fonti**: JOSPT Lateral Elbow Pain CPG 2022 https://www.jospt.org/doi/10.2519/jospt.2022.0302 · evidence to practice 2023 https://www.jospt.org/doi/10.2519/jospt.2023.0501 · programma completo IJSPT https://pmc.ncbi.nlm.nih.gov/articles/PMC6769266/ · isometrici https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9820871/

---

### 3.10 Polso e mano: sindrome del tunnel carpale

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Estensione di polso a 90° in carico (push-up a mani piatte, plank sui palmi, front rack) | La pressione nel tunnel carpale aumenta marcatamente agli estremi di flessione ed estensione del polso | `warning` |
| Flessione di polso a end-range mantenuta (posizione di Phalen) | Stessa motivazione; è la posizione del test provocativo | `warning` |
| Presa forte e ripetuta, uso di attrezzi vibranti | Aumento della pressione e del carico tendineo nel tunnel | `warning` |
| Appoggio diretto e prolungato sul palmo (handstand, bear crawl, burpee ripetuti) | Compressione diretta del tunnel | `warning` |
| Movimenti ripetitivi ad alta frequenza di flesso-estensione sotto carico | Carico cumulativo | `advice` |

**Blacklist reale**: `Push-Up` a mani piatte e varianti, `Plank`, `Bear Crawl Sled Drags`, `Handstand Push-Ups`, `Front Squat (Clean Grip)` e `Frankenstein Squat` (front rack con polso in estensione estrema), `Clean` e derivati, le 12 varianti di `Wrist Curl`, `Wrist Roller`, `Wrist Rotations with Straight Bar`, `Wrist Circles`, `Battling Ropes`, `Sledgehammer Swings`, `Farmer's Walk`, `Mixed Grip Chin`.
**Keyword**: `wrist curl, wrist roller, wrist rotation, wrist circle, push-up, pushup, plank, handstand, bear crawl, front squat, clean grip, frankenstein, battling ropes, sledgehammer, farmer, grip, burpee, mountain climber`

**Attrezzi**: preferire `machine` con impugnature neutre, `cable` con maniglie, `dumbbell` in presa neutra, `bands`; utili push-up su manubri o su parallele per mantenere il polso neutro, e straps per ridurre la richiesta di presa. Sconsigliare `barbell` in front rack, attrezzi che obbligano a estensione di polso, `kettlebells` in rack position con polso esteso.
**Raccomandati (JOSPT Carpal Tunnel Syndrome CPG 2019 e revisione 2026)**: esercizi di **scorrimento neurale e tendineo** (nerve gliding e tendon gliding) come componente del trattamento conservativo; splint notturno in posizione neutra (raccomandazione forte); modifica ergonomica dell'attività; mobilizzazione del polso e della colonna cervicale; rinforzo generale mantenendo il polso in posizione neutra.
**Parametri**: nessun limite specifico di carico purché il polso resti neutro; sostituzione sistematica degli appoggi palmari con appoggi su pugno chiuso, manubri o parallele; 10-15 ripetizioni; nerve gliding 3-5 serie da 5-10 ripetizioni, 2-3 volte al giorno, senza provocare parestesie intense.
**Red flag → `medical_stop`**: atrofia dell'eminenza tenar, deficit motorio dell'abduttore breve del pollice, perdita di sensibilità permanente nel territorio del mediano, sintomi notturni severi non responsivi, sintomi bilaterali di nuova insorgenza con sospetto di causa sistemica.

**Fonti**: JOSPT Carpal Tunnel Syndrome CPG 2019 https://www.jospt.org/doi/10.2519/jospt.2019.0301 · revisione 2026 https://www.jospt.org/doi/10.2519/jospt.2026.0301

---

### 3.11 Caviglia: instabilità cronica e distorsioni recidivanti

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| Inversione forzata sotto carico, appoggi su superfici irregolari non controllate | Meccanismo lesivo del compartimento laterale | `hard_block` in fase acuta, `warning` in cronico |
| Atterraggi da salto e cambi di direzione in fase acuta o subacuta | Carico sul legamento peroneo-astragalico anteriore in via di guarigione | `hard_block` in fase acuta |
| Stretching passivo in inversione | Stress diretto sui legamenti laterali già lassi | `hard_block` |
| Corsa su terreno irregolare o trail in fase di recupero | Rischio di recidiva | `warning` |
| Progressione pliometrica troppo rapida | Recidiva | `advice` |

**Blacklist reale (fase acuta e subacuta)**: i 42 esercizi di salto (`Box Jump (Multiple Response)`, `Depth Jump Leap`, `Lateral Bound`, `Hurdle Hops`, `Lateral Cone Hops`, `Single-Leg Lateral Hop`, `Single-Leg Hop Progression`, `Rope Jumping`, `Star Jump`, ecc.), `Side Hop-Sprint`, `Lunge Sprint`, `Side to Side Box Shuffle`, `Bear Crawl Sled Drags`, `Standing Calf Raises` monopodalici pesanti in fase acuta, `Running, Treadmill` su pendenza.
**Keyword**: `jump, hop, bound, leap, plyo, box jump, depth, agility, cone, hurdle, shuffle, skater, sprint, cutting, trail, uneven, inversion, single-leg` (l'ultimo solo in fase acuta)

**Attrezzi**: preferire `bands` (eversione e dorsiflessione resistite), `body only` (calf raise, equilibrio monopodalico), `machine` (leg press, calf machine), `cable`, cyclette. Sconsigliare superfici instabili avanzate (bosu, tavolette) nelle prime fasi e senza supporto.
**Categorie**: escludere `plyometrics` in fase acuta e subacuta, reintrodurre gradualmente in fase avanzata (evidenza RCT a supporto del training pliometrico + equilibrio nella instabilità funzionale); escludere `strongman`; in `stretching` escludere le posizioni in inversione.
**Raccomandati (JOSPT Lateral Ankle Ligament Sprains CPG Revision 2021)**: training di **equilibrio e controllo posturale** come intervento di riferimento, mobilizzazione articolare per recuperare la dorsiflessione, rinforzo dei peronei, esercizio terapeutico progressivo, bendaggio o cavigliera nelle attività a rischio. Esercizi: `Single Leg Balance` con progressione occhi aperti → chiusi e superficie stabile → morbida, `Ankle Eversion with Band`, `Ankle Dorsiflexion with Band`, `Calf Raise` bipodalico poi monopodalico, `Star Excursion / Y-Balance`, `Heel-to-Toe Walk`, progressione pliometrica finale.
**Parametri**: recuperare la dorsiflessione (deficit comune nella instabilità cronica, misurabile con il weight-bearing lunge test); equilibrio 3-5 x 30 secondi per lato, 5 volte a settimana o quotidiano per almeno 4-6 settimane; eversione con banda 3 x 15-20; pliometria 3-5 x 5-10 contatti di qualità, 2-3 volte a settimana, solo in fase avanzata; pause 30-60 secondi per l'equilibrio e 60-120 per la pliometria.
**Red flag → `medical_stop`**: criteri di Ottawa positivi dopo trauma acuto (dolore alla palpazione del margine posteriore dei malleoli, base del quinto metatarso o navicolare; incapacità di caricare per quattro passi) → radiografia; instabilità grossolana o cedimenti ripetuti nonostante 6 mesi di riabilitazione strutturata; blocco articolare o dolore profondo persistente in tibio-tarsica (sospetta lesione osteocondrale dell'astragalo); gonfiore persistente oltre 6-8 settimane.

**Fonti**: JOSPT Lateral Ankle Ligament Sprains CPG Revision 2021 https://www.jospt.org/doi/10.2519/jospt.2021.0302 · pliometria e equilibrio nella instabilità funzionale, RCT https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8156931/

---
### 3.12 Ipertensione arteriosa

**Soglie numeriche di blocco**

| Valore a riposo | Azione | Severità |
|---|---|---|
| PA ≥ 180/110 mmHg (anche uno solo dei due valori) | Non allenare, rinvio al medico | `hard_block` |
| PA ≥ 160/105 mmHg | Ipertensione non controllata: criterio di esclusione nei programmi di riabilitazione cardiologica. Solo aerobico leggero, nessun carico pesante | `warning` bloccante |
| PA 140-159 / 90-104 mmHg | Consentito con priorità aerobica, niente massimali né Valsalva | `warning` |
| PA ≥ 130/80 mmHg | Soglia diagnostica ACC/AHA 2017: attivare il protocollo "esercizio come terapia" | `advice` |
| Durante sforzo: > 250 sistolica o > 115 diastolica | Stop immediato | `medical_stop` |

**Pattern da evitare**: manovra di **Valsalva** (è il singolo fattore che spinge la pressione oltre le soglie di controindicazione; la tecnica corretta è espirazione nella fase concentrica); carichi massimali e test 1RM; isometrie prolungate ad alta percentuale di MVC su grandi masse muscolari; esercizi overhead pesanti con carico assiale; posizioni con testa sotto il livello del cuore; serie a cedimento con Valsalva riflessa; presa sostenuta molto intensa in apnea; sforzi esplosivi a freddo.

**Blacklist reale**: i 24 `Deadlift`, `Barbell Squat` e `Front Barbell Squat` massimali, i 41 esercizi olimpici (`Clean and Jerk`, `Power Clean`, `Snatch`, `Push Press`, `Split Jerk`), `Handstand Push-Ups`, i 15 esercizi strongman (`Atlas Stones`, `Tire Flip`, `Farmer's Walk`, `Yoke Walk`, `Log Lift`, `Rickshaw Deadlift`), `Leg Press` massimale, hold isometrici prolungati.
**Keyword**: `1rm, one rep max, max effort, maximal, heavy, deadlift, clean and jerk, power clean, hang clean, snatch, jerk, push press, handstand, inverted, inversion, headstand, atlas stone, tire flip, keg, log lift, yoke, farmer, rickshaw, strongman, powerlift, wall sit, isometric hold`

**Attrezzi**: preferire `machine`, `cable`, `bands`, `body only`, `dumbbell` a carico moderato, cicloergometro e tapis roulant. Cautela con `barbell` (solo carichi moderati e con spotter) e `kettlebells` (lo swing produce picchi pressori e apnea riflessa).
**Categorie**: escludere sempre `powerlifting`, `olympic weightlifting`, `strongman`; escludere `plyometrics` se la pressione non è controllata; `strength` consentita con vincolo di intensità; `cardio` e `stretching` consentiti.

**Protocollo raccomandato**
- **Aerobico** (cardine): quasi tutti i giorni, 40-60% HRR o Borg 11-13, 20-30 minuti per sessione, 90-150+ minuti a settimana (cammino, cyclette, ellittica, nuoto).
- **Forza dinamica** (oggi equiparata all'aerobico come terapia antipertensiva): 2-3 giorni non consecutivi, 60-70% 1RM, mai a cedimento tecnico completo, 1-3 serie x 8-12 su 8-10 esercizi multiarticolari, pause 60-90 secondi con respirazione continua e udibile. Progressione: prima le ripetizioni, poi le serie, poi il carico (+2-5% quando si completano tutte le serie al top del range per due sessioni).
- **Isometrico a bassa intensità** (opzione con effetto antipertensivo documentato): handgrip 4 x 2 minuti al 30% MVC, recupero 1-4 minuti, 3 giorni a settimana; riduzione attesa della sistolica di circa 7 mmHg dopo 8 settimane. Vincolo: respirazione normale, mai apnea.
- Riduzione attesa complessiva: 5-8 mmHg.

**Farmaci da segnalare in anamnesi**: beta-bloccanti (la FC non è utilizzabile come indicatore di intensità, usare Borg), diuretici (disidratazione e ipotensione), alfa-litici e calcio-antagonisti (ipotensione post-esercizio marcata, allungare il cool-down, che deve essere attivo per almeno 5 minuti, mai stop brusco).

**Segnali di allarme**: cefalea gravativa occipitale, epistassi, ronzii auricolari, visione offuscata o scotomi, dispnea, dolore toracico, sensazione di testa pulsante, vertigini, ipotensione post-esercizio sintomatica nel cool-down.

**Fonti**: ACSM Exercise and Hypertension https://acsm.org/exercise-hypertension/ · https://acsm.org/hot-topic-exercise-hypertension-identification/ · isometric handgrip https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5207598/ · AHA Resistance Exercise Statement 2023 https://www.ahajournals.org/doi/10.1161/CIR.0000000000001189

---

### 3.13 Cardiopatia, post-infarto e riabilitazione cardiologica

**`hard_block` assoluto, nessun allenamento erogabile e rinvio immediato**: infarto miocardico acuto nei 3-5 giorni precedenti; angina instabile o a riposo; aritmie non controllate con sintomi o compromissione emodinamica; stenosi aortica severa sintomatica; scompenso cardiaco sintomatico o scompensato; embolia polmonare, infarto polmonare acuto o trombosi venosa profonda; miocardite, pericardite, endocardite acute; sospetta dissecazione aortica; edema polmonare, insufficienza respiratoria, SpO2 a riposo ≤ 85%; ipertensione non controllata (≥160 e/o ≥105 mmHg); FC a riposo superiore a 100-120 bpm non spiegata o nuova fibrillazione atriale ad alta risposta; **aumento di peso superiore a 1,8 kg in 1-3 giorni** (segno di ritenzione e scompenso).

**Finestre temporali post-evento** (l'app deve richiedere la data dell'evento e il tipo di intervento):
- test da sforzo sintomo-limitato raccomandato a 14 giorni dall'infarto acuto;
- resistance training: almeno 5 settimane dopo infarto o bypass, almeno 2-3 settimane dopo angioplastica, e solo dopo 4 settimane di aerobico supervisionato;
- **post-sternotomia: nessun carico overhead, nessuna trazione, nessuna spinta oltre 5-8 kg per 8-12 settimane**.

**Pattern da evitare**: isometrie intense e sostenute (aumento brusco del postcarico); Valsalva; esercizi sopra la testa con carico; massimali e test 1RM; grandi masse muscolari in apnea; avvio a freddo e stop brusco (obbligatori warm-up e cool-down di 5-10 minuti); temperature estreme, alta umidità, altitudine; attività a grado statico elevato secondo la classificazione dinamico/statico ESC.

**Blacklist reale**: tutti i `Deadlift`, tutti gli esercizi `olympic weightlifting` e `strongman`, `Handstand Push-Ups`, `Barbell Squat` pesante, i 42 esercizi di salto, `Lunge Sprint`, `Side Hop-Sprint`, `Battling Ropes` ad alta intensità, `Wall Sit` e plank oltre 30 secondi, ogni test massimale.
**Keyword**: `1rm, max, maximal, heavy, deadlift, snatch, clean, jerk, push press, behind the neck, handstand, inverted, strongman, atlas, tire flip, yoke, farmer, sprint, box jump, depth jump, burpee, plyo, jump, wall sit, isometric hold`

**Attrezzi**: preferire `machine` (soprattutto nelle prime 8-12 settimane: postura controllata, carico prevedibile, arresto facile), `cable`, `bands`, `body only`, cicloergometro, `dumbbell` leggeri. Sconsigliare `barbell` pesante, `kettlebells` (swing e snatch), `medicine ball` in lanci esplosivi, attrezzi strongman.
**Categorie**: escludere `powerlifting`, `olympic weightlifting`, `strongman`, `plyometrics`; `strength` solo entro i parametri sotto; `cardio` cardine; `stretching` consentito escludendo le posizioni invertite.

**Protocollo raccomandato**
- **Aerobico**: 40-60% HRR o VO2R nelle fasi iniziali, fino a 50-85% HRR nei pazienti stabili a basso rischio; Borg 11-13 nelle prime sessioni, poi 12-15 (con beta-bloccanti Borg diventa l'indicatore primario); alternativa pratica in fase precoce: FC a riposo + 20 bpm. **Regola della soglia ischemica, la più importante da implementare come cap sul target di FC: la FC target deve restare almeno 10 bpm sotto la FC alla quale sono comparsi sintomi ischemici o alterazioni ECG nel test da sforzo.** Durata 20-60 minuti continui, 3-5 giorni a settimana; progressione prima della durata, poi della frequenza, poi dell'intensità.
- **Forza**: 2-3 volte a settimana, circa 30-40% 1RM per l'arto superiore e 50-60% per l'inferiore (nei protocolli di rehab 40-50%), 1-2 serie x 10-15 su 8-10 esercizi, RPE 11-13, nessun cedimento, respirazione continua.
- **MET**: fino a 3 MET nelle primissime fasi, 3-5 in fase intermedia, oltre 6 solo in pazienti a basso rischio con test negativo. La capacità funzionale in MET dal test da sforzo va usata come filtro sul catalogo esercizi.
- **HIIT** (4 x 4 minuti all'85-95% della FC di picco con recupero attivo di 3 minuti): ammesso solo in coronaropatia stabile e in programmi medicalmente supervisionati. Nella PWA va trattato come `hard_block` salvo sblocco esplicito del centro di riabilitazione.

**Segnali di allarme**: angina o equivalente anginoso (dispnea sproporzionata, dolore mandibolare o epigastrico), palpitazioni, sudorazione fredda, nausea, presincope, claudicatio, dispnea severa, sensazione di morte imminente. Soglie oggettive di stop: sistolica oltre 240 mmHg, diastolica oltre 110 mmHg, aumento delle aritmie, angina che non recede con riposo o nitroglicerina, calo della sistolica superiore a 10 mmHg con carico crescente.

**Fonti**: ACSM Guidelines https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription/ · 2020 ESC Guidelines on sports cardiology https://academic.oup.com/eurheartj/article/42/1/17/5898937 · prescrizione in coronaropatia https://pmc.ncbi.nlm.nih.gov/articles/PMC6124989/ · CSANZ Position Statement 2023 https://www.heartlungcirc.org/article/S1443-9506(23)04214-2/fulltext

---

### 3.14 Diabete mellito tipo 1 e tipo 2

#### Tipo 1: soglie glicemiche pre-allenamento

L'app deve chiedere la glicemia capillare o il valore CGM prima di ogni sessione.

| Glicemia pre-esercizio | Azione | Severità |
|---|---|---|
| < 90 mg/dL (< 5,0 mmol/L) | 10-20 g di glucidi rapidi, ricontrollo a 15 minuti; non iniziare finché non si supera 90 | `hard_block` temporaneo |
| 90-124 mg/dL | Circa 10 g di carboidrati prima di iniziare | `warning` |
| 126-180 mg/dL | **Range target ideale**, via libera | ok |
| 180-270 mg/dL | Consentito; se aerobico prolungato, nessun carboidrato aggiuntivo iniziale | `advice` |
| > 270 mg/dL (> 15,0 mmol/L) | Misurare i chetoni prima di procedere | `warning` bloccante |
| Iperglicemia + chetoni ≥ 1,5 mmol/L o chetonuria moderata/elevata | **Non allenarsi**, rischio di chetoacidosi, rinvio al medico | `hard_block` |
| Ipoglicemia in atto (< 70 mg/dL) o episodio severo nelle 24 ore precedenti | Nessun allenamento | `hard_block` |
| Mancata percezione dell'ipoglicemia (hypoglycemia unawareness) | Solo esercizio supervisionato | `hard_block` in modalità autonoma |

**Gestione operativa tipo 1**
- **Regola dei 15**: se glicemia sotto 70 mg/dL, 15 g di carboidrati rapidi, ricontrollo dopo 15 minuti, ripetere finché non si supera 70-90. Zuccheri rapidi sempre a portata di mano durante la seduta.
- Esercizio a digiuno di 30-60 minuti: circa 10-15 g di carboidrati. Esercizio dopo bolo insulinico: 30-60 g/ora oppure riduzione del bolo del 25-75% secondo schema medico.
- **Ordine degli esercizi**: eseguire la parte di forza **prima** dell'aerobica migliora la stabilità glicemica.
- L'esercizio molto intenso (HIIT, sprint, forza massimale) tende a **far salire** la glicemia per risposta catecolaminica: non correggere aggressivamente subito dopo.
- **Ipoglicemia tardiva**: rischio elevato nelle 6-15 ore successive, con coda fino a 48 ore; rilevante soprattutto per sessioni serali. L'app deve inviare un reminder di controllo notturno dopo sessioni intense o serali.
- Non iniettare insulina in un distretto muscolare che verrà sollecitato.

#### Tipo 2
Soglie meno stringenti: il rischio di ipoglicemia riguarda soprattutto chi è in terapia insulinica o con sulfoniluree e glinidi. Resta valido il `hard_block` se iperglicemia oltre 300 mg/dL con sintomi (poliuria, sete intensa, disidratazione) o chetonuria. Secondo la posizione ADA non serve clearance medica per soggetti asintomatici sedentari che iniziano attività a intensità non superiore alla camminata veloce.

#### Restrizioni per complicanze (tipo 1 e tipo 2)

| Complicanza | Restrizione | Severità |
|---|---|---|
| Retinopatia proliferativa o non proliferativa severa | Aerobico e resistance training vigorosi **controindicati** (rischio di emorragia vitreale e distacco di retina). Vietati Valsalva, sforzi esplosivi, scuotimenti, posizioni a testa in giù, powerlifting | `hard_block` per alta intensità e per tutte le inversioni |
| Neuropatia periferica con ulcera o lesione al piede in atto | Vietata ogni attività in carico | `hard_block` |
| Neuropatia periferica senza lesioni | Camminata moderata consentita (l'evidenza recente non mostra aumento del rischio di ulcera); ispezione quotidiana dei piedi, calzature adeguate, progressione lenta | `warning` |
| Neuropatia autonomica severa | Risposte cronotropa e pressoria alterate: usare Borg, non la FC. Evitare cambi di direzione rapidi, passaggi posturali bruschi, caldo e umidità | `warning` |
| Nefropatia | Evitare sforzi massimali e aumenti pressori estremi | `warning` |

**Blacklist reale (profilo retinopatia o diabete complicato)**: i 24 `Deadlift`, `Barbell Squat` pesante, i 41 esercizi olimpici, `Handstand Push-Ups`, `Decline Barbell Bench Press` e le 15 varianti `decline`, `Hanging Leg Raise`, `Hanging Pike`, i 42 esercizi di salto, `Rope Jumping`, `Running, Treadmill` e sprint (se neuropatia o ulcera), `Burpee`.
**Keyword**: `inverted, inversion, headstand, handstand, shoulder stand, plow, decline, hanging, deadlift, snatch, clean, jerk, 1rm, max, powerlift, strongman, jump, plyo, box jump, depth, sprint, burpee, jump rope, rope jumping, running, high impact`

**Attrezzi**: preferire `machine`, `cable`, `bands`, `body only`, `dumbbell`, cicloergometro (zero carico sul piede), nuoto se non ci sono lesioni cutanee, ellittica. Sconsigliare `barbell` a carichi elevati, tutto ciò che richiede apnea, attrezzi che generano attrito ripetuto sul piede in caso di neuropatia.
**Protocollo raccomandato**: aerobico almeno 150 minuti a settimana a intensità moderata-vigorosa su almeno 3 giorni, **mai più di 2 giorni consecutivi di inattività** (l'effetto sulla sensibilità insulinica dura 24-72 ore); forza 2-3 sessioni in giorni non consecutivi, 8-10 esercizi, 1-3 serie x 10-15, progressione prima delle ripetizioni poi delle serie poi della frequenza; interrompere la sedentarietà ogni 30 minuti con 3 minuti di attività leggera.

**Segnali di allarme**: ipoglicemia (tremore, sudorazione fredda, fame improvvisa, tachicardia, irritabilità, confusione, visione doppia, difficoltà di coordinazione) → stop immediato e regola dei 15; iperglicemia e chetosi (sete intensa, poliuria, nausea, vomito, alito acetonico, respiro di Kussmaul, dolore addominale) → stop e contatto medico; retinopatia (mosche volanti, tende scure, flash luminosi, calo visivo improvviso) → stop e valutazione oculistica urgente.

**Fonti**: Riddell et al., Lancet Diabetes Endocrinol 2017 https://www.thelancet.com/article/S2213-8587(17)30014-1/fulltext · ADA Standards of Care https://diabetesjournals.org/care/article/49/Supplement_1/S50/163924/3-Prevention-or-Delay-of-Diabetes-and-Associated · ADA Position Statement 2016 https://diabetesjournals.org/care/article/39/11/2065/37249/Physical-Activity-Exercise-and-Diabetes-A-Position

---

### 3.15 Obesità grave (BMI > 35)

**Soglie e criteri**: BMI ≥ 35 attiva di default il profilo "low impact" con esclusione automatica di pliometria e corsa (`warning`); BMI ≥ 40 impone come prima scelta le modalità a scarico articolare (acqua, cyclette reclinata, ergometro per arti superiori); dolore articolare superiore a 5/10 durante o dopo l'esercizio, o che persiste oltre 2 ore dalla fine, impone riduzione del carico e passaggio a modalità non in carico; post chirurgia bariatrica nessun carico addominale e nessun sollevamento oltre 5-10 kg per 4-6 settimane (`hard_block` nella finestra post-operatoria).

**Impatto articolare**: le forze di reazione al suolo nella corsa raggiungono 2,5-3 volte il peso corporeo, e le forze compressive sul ginocchio sono un multiplo ulteriore. Con 110-130 kg di massa il carico è insostenibile per cartilagine e menischi.

**Pattern da evitare**: corsa, salti, pliometria, cambi di direzione rapidi, deep squat (oltre 90-100° di flessione), affondi profondi, step-up alti, movimenti che generano valgismo o varismo dinamico, sport con racchetta ad alta intensità. Attenzione anche alla posizione prona prolungata (difficoltà respiratoria), alla supina prolungata nei BMI molto elevati (preferire inclinato o seduto) e agli esercizi a terra quando l'alzata autonoma è difficoltosa.

**Blacklist reale**: tutti i 42 esercizi di salto, `Rope Jumping`, `Burpee`, `Lunge Sprint`, `Side Hop-Sprint`, `Plyo Push-up`, `Plyo Kettlebell Pushups`, `Running, Treadmill`, `Barbell Full Squat`, `Barbell Walking Lunge`, `Bodyweight Walking Lunge`.
**Keyword**: `jump, jumping, plyo, plyometric, hop, bound, leap, box jump, depth, burpee, sprint, run, running, jog, jumping jack, jump rope, rope jumping, skipping, skater, tuck, clap, high knee, butt kick, mountain climber, deep squat, walking lunge, agility, shuttle`
**Regola strutturale**: `category = "plyometrics"` esclusione totale; `category = "cardio"` filtrata per impatto, mantenendo cyclette, ellittica, vogatore, camminata, nuoto e acqua.

**Attrezzi**: preferire `machine` (supporto del tronco, sedute ampie; verificare i limiti di portata dichiarati dal produttore), `cable`, `bands`, `body only` in versioni assistite, `exercise ball` per il core in appoggio, cicloergometro reclinato, ellittica, vogatore, ergometro per arti superiori, esercizio in acqua (il galleggiamento riduce il carico del 50-70%). Sconsigliare `medicine ball` in lanci e slam, `kettlebells` in swing veloci, esercizi a corpo libero in cui il peso corporeo è il fattore limitante (push-up a terra, pull-up).
**Categorie**: escludere `plyometrics`, `olympic weightlifting`, `strongman`; `powerlifting` in avviso; `strength` e `stretching` statico ammessi.

**Protocollo raccomandato**
- Aerobico: intensità moderata (64-76% FCmax, 3-5,9 MET, Borg 12-13), 5-7 giorni a settimana, partendo da 150 minuti a settimana e progredendo verso 225-300 minuti per il calo ponderale e il mantenimento (target circa 2000 kcal a settimana). Ellittica come opzione più protettiva per il ginocchio, poi cyclette, nuoto e acquagym, cammino, vogatore. Frazionabile in blocchi da 10 minuti per l'aderenza.
- Forza: 2-3 giorni, 8-10 esercizi, 1-3 serie x 10-15 al 60-70% 1RM, priorità a catena cinetica chiusa e range parziali (mini squat, leg press a ROM controllato, glute bridge, elastici, seated row, chest press). Rinforzo di quadricipiti e ischiocrurali per ridurre lo squilibrio agonisti/antagonisti nel ginocchio artrosico.
- Flessibilità: stretching statico 20-30 secondi, 2-4 ripetizioni per gruppo.

**Segnali di allarme**: dolore articolare acuto, gonfiore articolare post-esercizio, dispnea sproporzionata, dolore toracico, vertigini, ipoglicemia se diabetico, lesioni cutanee da sfregamento nelle pieghe, capogiro nel passaggio da seduto a in piedi.

**Fonti**: esercizio in obesità con limitazioni fisiche https://pmc.ncbi.nlm.nih.gov/articles/PMC13261380/ · ACSM Position Stand https://www.ncbi.nlm.nih.gov/books/NBK565813/ · obesità e rischio di artrosi https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6925458/

---

### 3.16 Osteoporosi e osteopenia

> Questa è la condizione con l'evidenza più netta, sia sui divieti sia sui benefici del carico pesante. **Va bloccata la flessione spinale, non il carico.**

**Pattern da evitare**

| Pattern | Motivazione | Severità |
|---|---|---|
| **Flessione spinale a end-range, specialmente sotto carico** | Sinaki e Mikkelsen 1984: nelle donne con osteoporosi spinale post-menopausale il gruppo che eseguiva esercizi in flessione ha avuto un tasso di **nuove fratture vertebrali dell'89%**, contro il 16% del gruppo in estensione, il 53% del misto e il 67% del gruppo senza esercizio (p<0,001) | `hard_block` |
| Flessione + rotazione spinale combinate sotto carico | Movimento maggiormente associato alla frattura da compressione vertebrale | `hard_block` |
| Torsione forzata del tronco a end-range | Stress torsionale sul corpo vertebrale | `hard_block` |
| Flessione in avanti trasportando un carico | Frattura da compressione anteriore del rachide toracico | `hard_block` |
| Backbend profondi | Sconsigliati in chi è ad alto rischio di frattura | `warning` |
| Impatto elevato con **frattura vertebrale pregressa** o fratture multiple da trauma minore | Il consenso UK indica per questi soggetti impatto non superiore a quello della camminata veloce | `hard_block` sull'impatto elevato |
| Attività con rischio di caduta non controllato | La frattura nasce dalla caduta | `warning` |

**Blacklist reale**: tutte le 30 varianti di `Sit-Up` e `Crunch` (`3/4 Sit-Up`, `Janda Sit-Up`, `Jackknife Sit-Up`, `Decline Crunch`, `Cable Crunch`, `Weighted Crunches`, ecc.), `Russian Twist`, `Cable Russian Twists`, `Seated Barbell Twist`, `Plate Twist`, `Torso Rotation`, `Standing Cable Wood Chop`, `Toe Touchers`, `Standing Toe Touches`, `Barbell Rollout from Bench`, `Ab Roller`, `Hanging Leg Raise`, tutti i 7 `Good Morning`, `Bent Over Barbell Row` a schiena flessa.
**Keyword**: `sit-up, situp, crunch, russian twist, seated twist, torso rotation, oblique, wood chop, toe touch, forward bend, forward fold, jefferson, rollout, dragon flag, leg raise, good morning, bent over, plow, halasana, shoulder stand, wheel pose, camel pose, golf swing`

> **Falsi positivi**: `twist` intercetterebbe `Incline Dumbbell Flyes - With A Twist` (supinazione del polso, innocuo) e `Wrist Rotations with Straight Bar`. Usare `russian twist`, `seated twist`, `torso rotation`, `plate twist`.

**Attrezzi**: preferire `barbell` e `machine` per il rinforzo pesante **in postura neutra**, `dumbbell`, `cable`, `bands` per gli estensori spinali. Sconsigliare `exercise ball` per i crunch, `medicine ball` per le torsioni, il vogatore se la tecnica non è pulita.
**Categorie**: in `stretching` escludere tutti i pattern di flessione spinale a end-range; escludere `plyometrics` in presenza di frattura vertebrale o fratture multiple (consentire impatto moderato negli altri); escludere `strongman` e `olympic weightlifting`; **non escludere a priori `powerlifting`**, ma solo con supervisione e tecnica verificata; promuovere `strength` e `cardio`.

**Raccomandati (evidenza forte)**: il trial **LIFTMOR** ha dimostrato che 8 mesi di high-intensity resistance and impact training (2 sedute a settimana da 30 minuti, **5 serie x 5 ripetizioni a oltre l'85% 1RM** su deadlift, back squat e overhead press, più impatto controllato) in donne post-menopausali con bassa massa ossea è **sicuro ed efficace**, migliora BMD, funzione fisica e postura. Aggiungere: impatto (camminata veloce, saltelli, salti, scale) se non c'è frattura vertebrale, tipicamente 50 salti al giorno nei protocolli osteogenici; estensione spinale (`Prone Back Extension` a basso range, `Superman` controllato, `Bird Dog`, `Prone Y-T-W`, `Wall Angel`); **equilibrio quotidiano** per tutti (`Tandem Stance`, `Single Leg Stance`, Tai Chi, `Heel-to-Toe Walk`, `Sit-to-Stand`); istruzioni di tecnica "spine sparing" (hip hinge, log roll per alzarsi dal letto, squat per raccogliere oggetti da terra).

**Parametri**: senza frattura e con supervisione 70-85% 1RM (LIFTMOR oltre l'85%, 5x5); non supervisionato o con frattura pregressa 50-70% 1RM; **vincolo primario ROM: nessuna flessione spinale oltre il neutro**; 5-8 ripetizioni per l'effetto osteogenico, 8-12 per forza e ipertrofia; pause 120-180 secondi sui carichi alti; forza 2-3 volte a settimana, equilibrio quotidiano, endurance degli estensori spinali quotidiana; progressione lenta e supervisionata nelle prime 4-8 settimane.

**Red flag → `medical_stop`**: dolore dorsale o lombare acuto a esordio improvviso dopo un movimento banale (sollevare un oggetto, uno starnuto, un colpo di tosse) → sospetta **frattura vertebrale da fragilità**, stop immediato e imaging; perdita di statura superiore a 4 cm, aumento della cifosi, comparsa di gibbo; dolore costale acuto dopo un colpo di tosse; dolore inguinale o all'anca dopo caduta con incapacità di carico; sintomi neurologici agli arti inferiori dopo un episodio doloroso.

**Fonti**: Sinaki e Mikkelsen 1984 https://read.qxmd.com/read/6487063/postmenopausal-spinal-osteoporosis-flexion-versus-extension-exercises · Strong, Steady and Straight, BJSM 2022 https://pubmed.ncbi.nlm.nih.gov/35577538/ · Too Fit To Fracture https://link.springer.com/10.1007/s00198-014-2881-4 · LIFTMOR RCT https://pubmed.ncbi.nlm.nih.gov/28975661/

---

### 3.17 Artrosi e artrite reumatoide

#### Artrosi (anca, ginocchio, mano)

**Premessa**: l'esercizio è raccomandazione **forte** nelle linee guida ACR/Arthritis Foundation 2019 e trattamento **core** nelle OARSI 2019. **Non esistono controindicazioni assolute all'esercizio nell'artrosi**: le limitazioni riguardano il dosaggio, non l'esclusione. Un'app che "blocca" esercizi per artrosi fa un danno: deve **adattare**.

**Pattern da modificare (non vietare)**: flessione profonda di ginocchio sotto carico nella gonartrosi femoro-rotulea (`warning`); impatto elevato ripetuto in riacutizzazione infiammatoria (`warning`); carico monopodalico con valgo dinamico (`advice`); presa forte e pinch ripetuti nella rizoartrosi (`warning`); flessione d'anca profonda con adduzione e intrarotazione nella coxartrosi (`warning`); progressioni di carico troppo rapide (`advice`).

**Blacklist (relativa, quasi mai assoluta)**: `Barbell Full Squat`, `Weighted Sissy Squat`, `Hack Squat`, `Kettlebell Pistol Squat`, `Leg Press` profondo, gli esercizi di salto in fase di riacutizzazione, `Lunge Sprint`, `Cossack`/affondi profondi nella coxartrosi, `Farmer's Walk` e lavoro di presa pesante nella rizoartrosi.
**Keyword**: `deep squat, full squat, sissy, pistol, shrimp, hack squat, cossack, plyo, jump, depth, sprint, plate pinch, grip crusher, farmer, knuckle`

**Raccomandati**: ACR/AF 2019 raccomanda con forza esercizio, perdita di peso e programmi di self-management per anca e ginocchio, senza gerarchia tra camminata, rinforzo, esercizio neuromuscolare ed esercizio acquatico; **Tai Chi fortemente raccomandato**. OARSI 2019 indica come core l'educazione più programmi strutturati di esercizio terrestre. L'esercizio **supervisionato** dà esiti migliori. Dosaggio di riferimento **GLA:D**: 12 sessioni supervisionate in 6 settimane, sedute di 60 minuti, esercizio neuromuscolare più educazione; la soglia di almeno 12 sessioni deriva da una revisione Cochrane che mostra un sollievo dal dolore circa doppio rispetto a meno di 12. Esercizi tipici: `Leg Press`, `Knee Extension` a ROM controllato, `Leg Curl`, `Hip Abduction`, `Step-Up`, `Sit-to-Stand`, `Wall Squat`, `Glute Bridge`, `Single Leg Balance`, cyclette, camminata, nuoto. Per la mano: mobilità delle dita, rinforzo di presa progressivo, ortesi per la prima carpo-metacarpale.
**Parametri**: 40-60% 1RM iniziale poi 70-80%; ROM adattato alla tolleranza senza end-range doloroso forzato; 8-15 ripetizioni, 2-3 serie; pause 60-120 secondi; 2-3 volte a settimana, minimo 12 sedute in 6 settimane, poi mantenimento indefinito; **regola del dolore: fino a 5/10 durante l'esercizio, ritorno al basale entro 24 ore, nessun incremento di settimana in settimana**.

#### Artrite reumatoide: la controindicazione atlanto-assiale

Questa è la controindicazione più importante e più spesso ignorata nelle app fitness.

| Elemento | Evidenza |
|---|---|
| Prevalenza | L'instabilità atlanto-assiale ha una prevalenza del **40-85%** nei pazienti con artrite reumatoide |
| Asintomaticità | Fino al **50%** dei pazienti con sublussazione atlanto-assiale anteriore **non ne è consapevole** |
| Controindicazioni | Le mobilizzazioni cervicali non vanno eseguite per il rischio di aumentare la sublussazione C1-C2; **protrazione e retrazione cervicale sono associate all'esacerbazione della sublussazione cervicale alta**; il posizionamento prolungato in flessione ha causato il decesso di un individuo con sublussazione atlanto-assiale anteriore |
| Carico degli estensori | Il carico sub-massimale degli estensori del collo **anche in posizione neutra** riduce l'ampiezza del canale cervicale e **non è raccomandato** in caso di sublussazione instabile |

**Implicazione per la PWA**: per ogni utente che dichiara artrite reumatoide, i seguenti esercizi vanno in `hard_block` fino a certificazione medica di assenza di instabilità cervicale: `Seated Head Harness Neck Resistance`, `Lying Face Down Plate Neck Resistance`, `Lying Face Up Plate Neck Resistance`, `Neck Press`, `Isometric Neck Exercise - Front And Back`, `Isometric Neck Exercise - Sides`, `Low Pulley Row To Neck`, `Standing Barbell Press Behind Neck`, `Push Press - Behind the Neck`, `Wide-Grip Pulldown Behind The Neck`, `Barbell Squat` e `Front Barbell Squat` (bilanciere su C7-T1), `Handstand Push-Ups`, `Barbell Shrug` pesante.
**Keyword**: `neck extension, neck flexion, neck resistance, neck press, head harness, neck bridge, wrestler, behind the neck, behind neck, headstand, handstand, shoulder stand, plow, wheel pose, back squat, front squat, shrug`

**Altri pattern nell'AR**: esercizio intenso su articolazione in **flare attivo** (calda, gonfia, dolente) → passare a ROM dolce e isometrici (`warning`); presa massimale e deviazione ulnare sotto carico nella mano reumatoide (`warning`); alto impatto con erosioni avanzate, protesi o osteoporosi da corticosteroidi (`warning`).
**Raccomandati**: EULAR 2018 (aggiornamento 2025) afferma che le raccomandazioni di salute pubblica sull'attività fisica **sono applicabili** alle persone con artrite infiammatoria e artrosi. Per la mano reumatoide, il programma **SARAH** (7 esercizi di flessibilità e 4 di forza, 12 settimane, 5 sedute supervisionate più esercizio domiciliare) è clinicamente ed economicamente efficace, senza eventi avversi. Durante il flare: ROM passivo o attivo assistito, isometrici a bassa intensità, riposo relativo dell'articolazione coinvolta, mantenimento dell'attività sulle altre.
**Parametri AR**: 50-80% 1RM in remissione, 30-40% o isometrici durante flare; 8-15 ripetizioni; aerobico 150 minuti a settimana a intensità moderata, forza 2-3 volte a settimana, esercizi per la mano quotidiani. **Regola pratica**: se un'articolazione è calda e gonfia, quella articolazione passa a ROM e isometrici, il resto del corpo continua.

**Red flag → `medical_stop`**: articolazione calda, molto gonfia, arrossata con febbre (escludere artrite settica, emergenza); versamento acuto senza trauma; dolore notturno costante, calo ponderale, febbre. Specifici AR: **segni di mielopatia cervicale** (disturbi dell'andatura, goffaggine delle mani, parestesie diffuse, segno di Lhermitte, disfunzione sfinterica, iperreflessia) → sospetta instabilità atlanto-assiale con compressione midollare, emergenza; dolore occipitale, sensazione di "testa che cade in avanti", scatti cervicali durante il movimento.

**Fonti**: 2019 ACR/Arthritis Foundation Guideline https://pubmed.ncbi.nlm.nih.gov/31908149/ · OARSI 2019 https://www.oarsijournal.com/article/S1063-4584(19)31116-1/fulltext · EULAR 2018 https://ard.eular.org/article/S0003-4967(24)02411-7/abstract · GLA:D https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5297181/ · SARAH trial, Lancet 2015 https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(14)60998-3/fulltext · instabilità atlanto-assiale in AR https://pmc.ncbi.nlm.nih.gov/articles/PMC8081325/ · isometrici del collo in AR https://pubmed.ncbi.nlm.nih.gov/18609259/

---

### 3.18 Asma da sforzo (broncocostrizione indotta da esercizio)

**Criteri di blocco**: asma non controllata (sintomi diurni frequenti, risvegli notturni, uso del broncodilatatore di emergenza più volte a settimana, PEF sotto l'80% del personal best) → `hard_block` per l'alta intensità; PEF sotto l'80% a inizio seduta → solo attività leggera (`warning`); PEF sotto il 60% → nessun allenamento (`hard_block`); esacerbazione in corso o nelle 48 ore precedenti, o infezione respiratoria acuta → nessun allenamento intenso; **broncodilatatore di emergenza non disponibile → `hard_block`**, regola operativa non negoziabile. Diagnosi: caduta del FEV1 di almeno il 10% dopo sforzo (alcuni centri usano il 15% come soglia più specifica).

**Pattern e contesti da evitare**: esercizio continuo ad alta ventilazione **senza riscaldamento** (il trigger principale è la perdita di acqua e calore dalle vie aeree); sforzo massimale improvviso a freddo; esercizio prolungato ad alta intensità in aria fredda e secca; respirazione esclusivamente orale. **Ambienti da evitare**: aria fredda e secca, aree poco ventilate, piscine coperte ad alta concentrazione di cloro, giornate ad alto ozono e particolato, alta concentrazione pollinica, ambienti polverosi. Sport a rischio più alto: corsa di fondo, nuoto agonistico, sci di fondo, ciclismo su strada. Sport a rischio più basso: attività intermittenti (tennis, sollevamento pesi, sport di squadra con pause).

**Blacklist (profilo non controllato)**: `Running, Treadmill` prolungato, `Lunge Sprint` e sprint ripetuti senza pause, `Rowing, Stationary` ad alta intensità continua, `Burpee` in circuito senza recupero, `Rope Jumping` prolungato, `Battling Ropes` ad alta densità, qualunque formato HIIT, Tabata, AMRAP, EMOM o metcon.
**Keyword**: `sprint, running, run, jog, endurance, continuous, hiit, tabata, amrap, emom, metcon, circuit, conditioning, burpee, jump rope, rope jumping, airbike, high intensity, interval`

> Qui **non si blocca per attrezzo ma per densità e durata**: il filtro utile è sulla struttura della sessione (rapporto lavoro/recupero) più che sul nome del singolo esercizio.

**Attrezzi**: preferire `machine`, `dumbbell`, `bands`, `cable`, `body only` in formati a serie e pause; cicloergometro e attrezzi indoor in ambiente climatizzato. Cautela con il nuoto in piscine molto clorate e con la corsa outdoor in inverno (maschera scaldaumidificante o sciarpa).
**Categorie**: nessuna da escludere in blocco; limitare la `cardio` continua ad alta intensità in fase non controllata; `strength` e `stretching` pienamente compatibili e preferibili come punto di partenza.

**Protocollo raccomandato**
- **Warm-up (raccomandazione forte ATS)**: riscaldamento a intervalli o combinato **per tutti** i soggetti con broncocostrizione indotta da esercizio. Protocollo pratico: 10-15 minuti con 6-8 accelerazioni di circa 30 secondi all'80-90% dell'intensità intervallate da recuperi, oppure 15 minuti a intensità crescente. Induce un **periodo refrattario di 1-3 ore** durante il quale l'attività non scatena broncocostrizione.
- **Promemoria farmacologico** (non prescrizione): broncodilatatore a breve durata 15-30 minuti prima dell'esercizio, secondo prescrizione medica.
- **Misure ambientali**: dispositivo scambiatore di calore e umidità in clima freddo, respirazione nasale nelle fasi leggere, controllo di ozono, particolato e pollini prima delle sessioni outdoor.
- **Cool-down graduale**: il picco di broncocostrizione arriva **10-15 minuti dopo la fine** dello sforzo, quindi il monitoraggio va prolungato oltre la sessione.

**Segnali di allarme**: sibili, tosse secca insistente, costrizione toracica, dispnea, incapacità di parlare in frasi complete, uso dei muscoli accessori, cianosi periorale, calo di prestazione improvviso. Stop immediato, broncodilatatore, posizione seduta; se non migliora entro 10-15 minuti o servono più somministrazioni, emergenza medica.

**Fonti**: ATS Clinical Practice Guideline on EIB https://academic.oup.com/ajrccm/article/187/9/1016/8510121 · StatPearls https://www.ncbi.nlm.nih.gov/books/NBK557554/

---

### 3.19 Gravidanza per trimestre

> **Regola di prodotto**: in presenza di gravidanza dichiarata, il PAR-Q+ stesso prescrive di **rimandare l'aumento di attività** e parlarne con il professionista sanitario. La posizione più prudente e coerente con il quadro legale è: nessuna generazione automatica di schede senza conferma esplicita del nulla osta ginecologico.

**Parametri validi in tutti i trimestri**: almeno 150 minuti a settimana di intensità moderata distribuiti su almeno 3 giorni, meglio tutti i giorni; combinare aerobico e forza; intensità **RPE 13-14 su scala Borg 6-20** ("somewhat hard"), 3-6 MET secondo il Ministero della Salute; **talk test**: deve poter parlare ma non cantare. Zone di FC specifiche per la gravidanza (linea guida canadese 2019): sotto i 29 anni moderata 125-146 bpm, vigorosa 147-169; dai 30 anni moderata 121-141, vigorosa 142-162. Esercizi per il pavimento pelvico quotidiani (riduzione del 50% dell'incontinenza prenatale e del 35% di quella postnatale).

**Primo trimestre (settimane 0-13)**: si può iniziare o continuare; nessuna restrizione posturale specifica. Punto critico: **ipertermia**, da evitare specialmente nel primo trimestre (niente hot yoga, sauna, bagno turco, ambienti caldo-umidi). Nausea e fatica giustificano riduzioni temporanee del volume.

**Secondo trimestre (settimane 14-27)**: **posizione supina** da gestire come warning, non come blocco clinico. OMS e ACOG indicano di evitare le attività in supino dopo il primo trimestre; la linea guida canadese 2019 (raccomandazione debole, evidenza molto bassa) dice di modificare la posizione **solo se compaiono** stordimento, nausea o malessere. La compressione aorto-cavale può comparire **già dalla 16ª settimana**, tipicamente dopo la 20ª, con caduta della gittata cardiaca del 25-30%. **Regola consigliata per l'app: dalla 16ª settimana warning su tutti gli esercizi supini**, con sostituzione suggerita (panca inclinata 30-45°, in piedi, seduti, decubito laterale) e limite di permanenza di 2-3 minuti. Da evitare anche la stazione eretta immobile prolungata e tutto ciò che comporta rischio di caduta (bicicletta su strada, sci, pattinaggio, equitazione, cambi di direzione bruschi, saltelli).

**Terzo trimestre (settimane 28-termine)**: baricentro spostato e lassità legamentosa da relaxina aumentano il rischio di lesione e di caduta (warm-up e cool-down sono raccomandati proprio per questo). Preferire camminata su percorsi pianeggianti, cyclette reclinata, acqua, mobilità, esercizi di respirazione e rilassamento (il Ministero della Salute li indica utili dall'ottavo mese). Ridurre carichi, range e complessità, aumentare i recuperi. Nessuna evidenza impone di smettere in assenza di controindicazioni.

**Regole trasversali**: evitare ambienti eccessivamente caldi e umidi; bere prima, durante e dopo; evitare l'alta quota (soglie variabili per fonte: oltre 2500 m per la linea guida canadese, 1500-2000 m per allenamento intenso in non acclimatate, circa 1830 m per ACOG); **immersioni subacquee: controindicazione assoluta**; **Valsalva**: il Ministero della Salute italiano indica esplicitamente di evitare gli esercizi con espirazione forzata a glottide chiusa; va però detto che è expert opinion (uno studio 2025 su 48 atlete gravide tra la 26ª e la 35ª settimana con 3x8 al 76% 1RM su sumo deadlift e bench press non ha rilevato alterazioni patologiche del battito fetale né dell'indice di pulsatilità ombelicale). Per una app consumer: **avviso**, non blocco, con istruzione "espira nella fase concentrica". **Overhead**: non compare nelle linee guida ufficiali come divieto; la raccomandazione di evitarlo dopo il primo trimestre deriva dalla letteratura di strength and conditioning (iperlordosi compensatoria). Trattare come `advice` o `warning`, preferendo press seduti con schienale o con bande. **Sollevamento olimpico**: sconsigliato esplicitamente dalla linea guida canadese.

**Controindicazioni ASSOLUTE** (ACOG e linea guida canadese, unione): rottura delle membrane; travaglio prematuro; sanguinamento vaginale persistente inspiegato; placenta previa dopo la 26ª-28ª settimana; preeclampsia o ipertensione indotta dalla gravidanza; incompetenza cervicale o cerchiaggio; restrizione di crescita intrauterina; gravidanza multipla ad alto ordine o a rischio di parto pretermine; diabete tipo 1 non controllato; ipertensione non controllata; patologia tiroidea non controllata; cardiopatia emodinamicamente significativa; pneumopatia restrittiva; anemia severa. In presenza di una di queste, l'utente può proseguire le normali attività quotidiane ma **non deve partecipare ad attività più intense**: `hard_block` sull'intera sezione allenamento.

**Controindicazioni RELATIVE**: anemia, aritmia materna non valutata, bronchite cronica, diabete tipo 1 mal controllato, obesità patologica estrema, sottopeso estremo (BMI sotto 12), stile di vita estremamente sedentario, IUGR nella gravidanza in corso, ipertensione mal controllata, limitazioni ortopediche, epilessia mal controllata, ipertiroidismo mal controllato, forte fumatrice, perdite gravidiche ricorrenti, storia di parto pretermine spontaneo, disturbo del comportamento alimentare, gravidanza gemellare dopo la 28ª settimana. In questi casi va discusso con il curante il rapporto rischi-benefici **prima** di svolgere attività moderata-vigorosa: `warning` bloccante.

**Red flag → `medical_stop`, schermata bloccante e non nota a piè di pagina**: sanguinamento vaginale; perdita di liquido amniotico o sospetta rottura delle membrane; contrazioni uterine regolari e dolorose; dolore toracico; **dispnea prima dello sforzo** o dispnea eccessiva che non si risolve col riposo; capogiro o svenimento persistente che non si risolve col riposo; cefalea; dolore o gonfiore al polpaccio (sospetta trombosi venosa profonda); debolezza muscolare che compromette l'equilibrio; riduzione dei movimenti fetali; riduzione del liquido amniotico.

**Blacklist reale, livello 1, blocco in tutta la gravidanza**: `category IN ("olympic weightlifting","plyometrics","strongman")` (rispettivamente 41, 42 e 15 voci nel dataset); più `Bicycling` non stazionaria, `Skating`, `Trail Running/Walking`, `Rope Jumping` (rischio di caduta; mantenere invece `Bicycling, Stationary` e `Recumbent Bike`).
**Keyword livello 1**: `snatch, clean, jerk, push press, overhead squat, muscle up, kipping, atlas stone, tire flip, yoke, keg, log lift, sandbag, rickshaw, sled, prowler, bear crawl, farmer, depth jump, box jump, hurdle, cone hop, bound, tuck jump, rocket jump, star jump, scissors jump, split jump, long jump, butt kick, skipping, sprint, plyo, burpee, slam, sledgehammer, battling ropes, medicine ball, throw, handstand, turkish get-up, bosu, rope jumping, skating, trail running, bicycling`

**Blacklist livello 2, blocco dal secondo trimestre (settimane 14-16), avviso nel primo**
- Supino: `lying, supine, decline, floor press, flat bench, bench press, hip thrust, glute bridge, bridge, leg-over, leg pull-in` (30 match su `lying`, 4 su `supine`, 15 su `decline`, 21 su `bench press`, 8 su `floor press`). **Eccezioni da whitelistare**: `side lying`, `side-lying`, `incline`.
- Flessione spinale: `crunch, sit-up, situp, jackknife, v-up, leg raise, leg lift, flutter kick, scissor kick, hanging leg, hanging pike, rollout, ab roller, ab crunch machine, mountain climber, seated leg tucks`.
- Plank, rotazioni e prono: `plank, side bridge, russian twist, wood chop, torso rotation, windmill, side bend, prone, superman, hyperextension, glute ham raise, lying face down`.

**Blacklist livello 3, avviso con nota e alternativa**: `deadlift, good morning, squat, lunge, step-up, overhead, military, shoulder press, behind the neck, upright row, dip, pull-up, chin-up, rowing stationary, stairmaster, step mill, kettlebell swing, swing`, con messaggi come "evita la manovra di Valsalva, espira nella fase di spinta", "dal secondo trimestre preferisci la versione seduta con schienale o con bande", "dal terzo trimestre riduci il range e usa un appoggio".

**Attrezzi**: `bands` è l'attrezzo di elezione (carico controllabile, nessun rischio di schiacciamento, facile in piedi o seduti); preferire anche `dumbbell`, `cable`, `machine`. `barbell` in avviso. `kettlebells` da escludere nelle varianti balistiche. `exercise ball` preferibile ma escludendo le varianti prone e supine. `medicine ball` da escludere (quasi tutte sono lanci pliometrici).

**Fonti**: ACOG Committee Opinion 804 https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period · 2019 Canadian Guideline, BJSM https://bjsm.bmj.com/content/52/21/1339 · Ministero della Salute, Linee di indirizzo https://www.salute.gov.it/new/it/tema/attivita-fisica/linee-di-indirizzo-sullattivita-fisica/ · sindrome da compressione aorto-cavale https://www.ncbi.nlm.nih.gov/books/NBK430759/ · resistance training pesante in gravidanza, 2025 https://pmc.ncbi.nlm.nih.gov/articles/PMC12406897/

---

### 3.20 Post-partum e diastasi dei retti

**Tempistiche generali**: la ripresa è graduale e "appena medicalmente sicuro", in funzione del tipo di parto e delle complicanze. Gli **esercizi del pavimento pelvico possono iniziare nell'immediato post-partum**. L'OMS raccomanda di riprendere gradualmente e in consultazione con un professionista sanitario nel caso di parto cesareo.

**Perché il cesareo richiede più tempo**: la fascia addominale recupera solo il **51-59% della resistenza tensile originaria a 6 settimane** e il **73-93% a 6-7 mesi**. Lo spessore della cicatrice uterina è ancora alterato a 6 settimane. Mobilizzazione della cicatrice (cesareo o perineale) indicativamente dalle settimane 6-8.

**Parto vaginale e pavimento pelvico**: il recupero del levatore dell'ano e delle strutture connettivali e nervose associate è massimizzato tra i **4 e i 6 mesi**. Ogni donna, indipendentemente dal tipo di parto, dovrebbe poter accedere a una valutazione pelvica specialistica a partire dalla **sesta settimana**.

**Timeline operativa 0-3 mesi**
- Settimane 0-2: esercizi del pavimento pelvico, core di base (pelvic tilt, bent knee drop out, abduzione in decubito laterale), camminata.
- Settimane 2-4: progressione di camminata, pavimento pelvico e core; introduzione di squat, affondi e ponte coerenti con le richieste funzionali quotidiane.
- Settimane 4-6: attività a basso impatto (cyclette, cross-trainer), tenendo conto del trauma perineale e della tollerabilità della sella.
- Settimane 6-8: mobilizzazione della cicatrice, power walking, aumento di durata e intensità del basso impatto, tecnica di stacco con carichi leggeri (non oltre il peso del bambino nell'ovetto, circa 15 kg), lavoro con resistenze su core e arti inferiori.
- Settimane 8-12: nuoto se le lochiazioni sono cessate e le ferite guarite; spinning se la sella è tollerata.

**Ritorno alla corsa e all'alto impatto**: non è consigliabile **prima di 3 mesi** post-partum, né oltre questa soglia se ci sono sintomi di disfunzione del pavimento pelvico. Finestra realistica 3-6 mesi. Test di load e impact management da superare **senza dolore, pesantezza, trascinamento o perdite**: camminata 30 minuti; appoggio monopodalico 10 secondi; single leg squat 10 ripetizioni per lato; corsa sul posto 1 minuto; balzi in avanti x10; hop sul posto 10 per gamba; "running man" monopodalico 10 per lato. Test di forza (ripetizioni fino ad affaticamento, target 20): calf raise monopodalico, ponte monopodalico, sit-to-stand monopodalico, abduzione in decubito laterale.
**Fattori di rischio**: meno di 3 mesi post-partum, ipermobilità, allattamento, disfunzione pelvica o lombopelvica preesistente, obesità (BMI oltre 30), cicatrice da cesareo o perineale, RED-S.
**Red flag che impongono invio al fisioterapista pelvico**: pesantezza o trascinamento pelvico, incontinenza urinaria o fecale, addome pendulo o gap sulla linea alba, dolore pelvico o lombare, sanguinamento persistente o aumentato oltre l'ottava settimana non legato al ciclo.
**Allattamento**: allattare prima dell'allenamento (comfort e acidità del latte dopo sforzo massimale, indicazione del Ministero della Salute); reggiseno sportivo con supporto, non solo compressione.

**Diastasi dei retti addominali**
- **Soglia** comunemente usata: distanza inter-retti superiore a 2 cm (o due dita) sopra e sotto l'ombelico.
- **Test dita per auto-screening**: supina, ginocchia flesse, dita perpendicolari alla linea alba a livello ombelicale e 2-3 cm sopra e sotto; sollevare la testa di 2-3 cm fino a sentire i ventri muscolari stringere le dita; registrare **larghezza e profondità/tensione** della linea alba. Attendibilità: buona riproducibilità test-retest (Kappa ponderato 0,73-0,77) ma accordo solo moderato tra operatori e validità concorrente scarsa rispetto all'ecografia.
- **Il segno funzionale che conta più del numero è il doming o coning** (cupola sulla linea mediana), l'affossamento, lo shift laterale del tronco o il flaring costale durante i test di trasferimento di carico.
- **Onestà sull'evidenza**: la revisione di Gluppe, Engh e Bø 2021 riporta evidenza di **bassa qualità** che l'allenamento del trasverso e i curl-up siano più efficaci dell'intervento minimo, ed evidenza da bassa a molto bassa che il solo allenamento del pavimento pelvico sia superiore. Le revisioni successive confermano effetti modesti degli interventi conservativi sulla distanza inter-retti. La blacklist della diastasi è quindi **prudenziale e sintomo-guidata**: il criterio di esclusione corretto è "compare doming, dolore o perdite", non il nome dell'esercizio.

**Blacklist diastasi**: `crunch, sit-up, situp, jackknife, v-up, leg raise, leg lift, flutter kick, scissor kick, hanging, rollout, ab roller, ab crunch machine, plank, mountain climber, russian twist, wood chop, dragon flag, hollow`
**Avviso diastasi**: `push-up, pushup, dip, pull-up, chin-up, overhead, deadlift, front squat, side bend`
**Raccomandati**: respirazione diaframmatica, attivazione coordinata di trasverso e pavimento pelvico sull'espirazione, heel slides, `Dead Bug` e progressioni, `Bird Dog`, `Glute Bridge` e `Barbell Glute Bridge`, `Side Bridge` progressivo dalle ginocchia, `Pallof Press` (anti-rotazione), lavoro in piedi con cavi e bande, `Bodyweight Squat` e `Chair Squat`, `Seated Cable Rows`, `Band Pull Apart`, `Face Pull`, carry leggeri con bracing corretto.

**Fonti**: ACOG 804 https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period · Goom, Donnelly, Brockwell 2019 https://absolute.physio/wp-content/uploads/2019/09/returning-to-running-postnatal-guidelines.pdf · Gluppe, Engh, Bø 2021 https://pubmed.ncbi.nlm.nih.gov/34391661/ · clinimetria della diastasi https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10624799/

---

### 3.21 Varici e insufficienza venosa cronica

**Criteri di blocco**: trombosi venosa profonda sospetta o accertata in fase acuta (dolore, gonfiore monolaterale, calore, rossore del polpaccio) → `medical_stop`, emergenza; ulcera venosa aperta (CEAP C6) → esercizio in carico solo su indicazione specialistica (`warning` bloccante); tromboflebite superficiale acuta → sospendere il carico sull'arto (`hard_block` temporaneo); post-scleroterapia o post-chirurgia venosa → nessun sollevamento pesante per 1-2 settimane secondo indicazione (`warning`).

**Pattern da evitare**: **Valsalva** (il sollevamento pesante innesca apnea riflessa che fa impennare la pressione venosa e peggiora il reflusso); carichi massimali e sollevamenti pesanti ripetuti (l'incidenza di varici aumenta con il sollevamento pesi pesante); stazione eretta statica prolungata (isometrie in piedi, wall sit lungo); seduta statica prolungata senza mobilizzazione della caviglia; blocchi continui e lunghi di sollevamento pesante o di cardio senza alternanza; squat e leg press molto pesanti con apnea; ambienti molto caldi (sauna, bagno turco, hot yoga).

**Blacklist reale**: i 24 `Deadlift` pesanti, `Barbell Squat` e `Leg Press` massimali, i 41 esercizi olimpici, i 15 strongman (`Farmer's Walk`, `Yoke Walk`, `Atlas Stones`, `Tire Flip`), `Standing Military Press` pesante, `Standing Calf Raises` con carico massimale, hold isometrici in piedi prolungati, ogni test 1RM.
**Keyword**: `1rm, max, maximal, heavy, deadlift, snatch, clean, jerk, powerlift, strongman, atlas, yoke, farmer, rickshaw, tire flip, keg, wall sit, isometric hold, standing hold`

**Attrezzi**: preferire `machine` in posizione seduta o supina (leg press leggero, seated calf raise, leg curl), `bands` per dorsiflessione e plantarflessione, `body only` (calf raise, pompaggi di caviglia), cicloergometro soprattutto reclinato, nuoto e attività in acqua (la pressione idrostatica agisce come compressione naturale), ellittica. Sconsigliare `barbell` a carichi elevati in piedi, attrezzi strongman, ogni esercizio in stazione eretta immobile sotto carico.
**Categorie**: escludere `powerlifting`, `strongman`, `olympic weightlifting`; `strength` ammessa con carichi moderati e alte ripetizioni; `cardio` e `stretching` raccomandati; `plyometrics` in avviso.

**Protocollo raccomandato**: il razionale terapeutico è la **pompa muscolare del polpaccio**.
- `Calf Raise`: 3 x 15-20, 3-5 volte a settimana, progressione da bipodalico a monopodalico.
- **Mobilità della caviglia**: dorsiflessione e plantarflessione attive 2-3 x 20-30, più volte al giorno; il range di movimento della caviglia è il determinante principale dell'efficienza della pompa.
- Aerobico: cammino 30 minuti la maggior parte dei giorni, ciclismo, nuoto.
- Forza generale: 2-3 volte a settimana, 50-65% 1RM con 12-20 ripetizioni, respirazione continua, preferendo varianti sedute o sdraiate.
- Posizione anti-declive: gambe sollevate sopra il livello del cuore per 10-15 minuti a fine seduta.
- Calze a compressione graduata secondo prescrizione; micro-pause di movimento almeno una o due volte all'ora nelle giornate in stazione eretta.

**Segnali di allarme**: dolore acuto monolaterale al polpaccio, gonfiore improvviso asimmetrico, calore e arrossamento localizzato, cordone venoso duro e dolente, dispnea improvvisa con dolore toracico (sospetta embolia polmonare, emergenza). Sanguinamento da varice: compressione diretta, gamba sollevata, emergenza medica.

**Fonti**: pompa del polpaccio nella IVC https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8147883/ · RCT esercizio strutturato https://www.sciencedirect.com/science/article/pii/S0741521403014125 · tricipite surale e funzione di pompa https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8372291/

---

### 3.22 Epilessia

**Principio generale**: l'esercizio non è controindicato e riduce la frequenza delle crisi. Il problema **non è lo sforzo in sé, ma la conseguenza di una crisi in quel contesto**. Il filtro va costruito sul rischio traumatico e di annegamento, non sull'intensità.

**Classificazione ILAE del rischio sportivo**
- **Gruppo 1, nessun rischio aggiuntivo**: atletica, bowling, judo, lotta, sci, danza, sport con racchetta, sport di squadra di contatto.
- **Gruppo 2, rischio moderato (danno al soggetto)**: tiro con l'arco, triathlon, canoa, boxe, karate, ciclismo, scherma, ginnastica artistica, equitazione, skateboard, nuoto, snowboard.
- **Gruppo 3, rischio maggiore (pericolo di vita)**: aviazione, arrampicata, tuffi, corse di cavalli, sport motoristici, paracadutismo, immersioni subacquee, salto con gli sci, surf.

**Criteri di blocco**: attività del **Gruppo 3** → `hard_block` in ogni caso di epilessia attiva (per le immersioni il criterio è essere liberi da crisi in veglia e senza farmaci antiepilettici da 5 anni); crisi nelle ultime 24-48 ore o cambio recente di terapia → `hard_block` temporaneo; crisi non controllate o frequenti → nessuna attività di Gruppo 2 o 3 senza supervisione diretta; privazione di sonno, febbre, disidratazione o digiuno prolungato prima della seduta → `warning`; **allenamento in solitaria con attrezzi pesanti sopra il corpo → `hard_block`** (serve uno spotter).

**Pattern e situazioni da evitare**
- **Carico libero sopra la testa o sopra il corpo senza spotter**: è il rischio numero uno in palestra. Se una crisi avviene durante una bench press o un overhead press, il bilanciere cade sul torace o sul collo.
- **Altezza**: qualunque esercizio in quota, su attrezzi sopraelevati, arrampicata, salto con appoggi elevati.
- **Acqua**: nuoto solo in piscina (non acque libere), con supervisione diretta continua, senza tuffi né apnea, con costume o cuffia che rendano il soggetto riconoscibile.
- **Iperventilazione volontaria**: trigger noto di crisi. Evitare esercizi di respirazione forzata e iperpnea deliberata, e attenzione ai warm-up basati su iperventilazione.
- **Apnea** e trattenimento del respiro.
- Ipoglicemia da alimentazione inadeguata, iponatriemia da sovraidratazione in attività di lunga durata, ipossia in alta quota, ipertermia e disidratazione: tutti fattori che abbassano la soglia convulsiva.
- **Stimolazione luminosa intermittente** in soggetti fotosensibili (luci stroboscopiche nelle sale fitness, schermi ad alto flicker, riflessi sull'acqua).

**Blacklist reale**: `Barbell Bench Press - Medium Grip` e le 21 varianti di bench press senza spotter, `Standing Military Press`, `Seated Barbell Military Press`, `Push Press`, `Power Jerk`, `Split Jerk`, `Clean and Jerk`, `Snatch` e varianti, `Overhead Squat`, `Barbell Squat` (bilanciere sul collo senza safety), `Pull-Ups`, `Wide-Grip Rear Pull-Up`, `Handstand Push-Ups`, `Ring Dips`, `Box Jump` alto, `Hanging Leg Raise`, `Kettlebell Swing` e `One-Arm Kettlebell Snatch`, `Battling Ropes`, `Running, Treadmill` ad alta velocità.
**Keyword**: `overhead, bench press, military press, push press, jerk, snatch, clean, handstand, rope climb, climbing, muscle up, ring, pull-up, chin-up, hanging, inversion, box jump, high box, swimming, dive, diving, treadmill, hyperventilation, breath hold, apnea, breathing drill, kettlebell swing, kettlebell snatch, balance beam, vault, high bar`

**Attrezzi**: preferire `machine` (la macchina guidata è strutturalmente la scelta più sicura: il carico non può cadere sul corpo, si esce in sicurezza, la posizione è vincolata), `cable` a carichi moderati, `bands`, `body only` a terra, cicloergometro reclinato o stazionario. Sconsigliare `barbell` libero sopra il corpo o sul collo, `kettlebells` (traiettoria balistica non controllabile), `medicine ball` in lanci overhead, anelli, sbarra alta, tapis roulant ad alta velocità (preferire la cyclette: in caso di crisi non c'è proiezione). Se si usa il tapis roulant, chiave di sicurezza magnetica sempre agganciata.
**Categorie**: escludere `olympic weightlifting` e `strongman`; escludere `powerlifting` in modalità autonoma (bench press e squat con bilanciere libero); `plyometrics` in avviso per box alti e atterraggi; raccomandare `strength` su macchine, `cardio` indoor a basso rischio, `stretching`.

**Protocollo raccomandato**: aerobico 150 minuti a settimana a intensità moderata su cicloergometro, ellittica o cammino; forza 2-3 volte a settimana su macchine guidate, 2-3 x 10-15 al 60-70% 1RM con respirazione continua; idratazione regolare ma non eccessiva (attenzione all'iponatriemia nelle sessioni lunghe); pasto adeguato 1,5-2 ore prima; **sonno adeguato la notte precedente** (la privazione di sonno è il trigger più consistente); allenarsi in presenza di almeno un'altra persona informata su come gestire una crisi.

**Segnali di allarme durante l'allenamento**: aura (odori o sapori anomali, déjà vu, sensazione epigastrica ascendente, formicolii), assenza o sguardo fisso, automatismi (masticazione, movimenti ripetitivi delle mani), confusione improvvisa, mioclonie, perdita di risposta agli stimoli. Azione: stop immediato, allontanare l'utente dagli attrezzi, sdraiarlo su un fianco in posizione laterale di sicurezza, **non inserire nulla in bocca**, cronometrare la crisi. Chiamare i soccorsi se la crisi dura oltre 5 minuti, se si ripete senza recupero di coscienza (stato di male), se è la prima crisi in assoluto, o se si verifica in acqua.

**Fonti**: ILAE Task Force on Sports and Epilepsy https://pubmed.ncbi.nlm.nih.gov/26662920/ · Archives of Epilepsy 2023 https://archepilepsy.org/articles/participation-in-sports-activities-in-people-with-epilepsy/doi/ArchEpilepsy.2023.23076 · Epilepsy Foundation https://www.epilepsy.com/preparedness-safety/staying-safe/exercise-sports

---

### 3.23 Scoliosi

**Quello che le linee guida NON dicono**: le linee guida SOSORT 2016 contengono 68 raccomandazioni, di cui 6 sulle attività sportive generali (forza di raccomandazione B per tre, C per tre: nessuna con evidenza massima). Il messaggio operativo è:
- **nessuno sport è controindicato in senso assoluto** nella scoliosi idiopatica;
- **lo sport da solo non è un trattamento** per la scoliosi, e le linee guida sconsigliano esplicitamente di usarlo come strategia di gestione specifica;
- il trattamento efficace è **PSSE (Physiotherapic Scoliosis-Specific Exercises) più corsetto** quando indicato; SOSORT raccomanda che i pazienti in trattamento conservativo pratichino sport **in associazione** alle PSSE.

**Pattern da evitare o modulare**: carico assiale pesante con bilanciere in adolescente in crescita rapida con curva progressiva (`warning`); iperestensione ripetuta e forzata (ginnastica artistica, ponte, backbend) (`warning`); volume di allenamento molto elevato in sport asimmetrici durante il picco di crescita (nelle ginnaste, quelle con scoliosi si allenavano circa 26 ore a settimana contro meno di 22) (`advice` o `warning`); flessione laterale unilaterale sistematica che asseconda la curva (`advice`); flessione + rotazione lombare sotto carico (`warning`); sospensione prolungata nella convinzione che "allunghi la colonna" (nessuna evidenza di effetto correttivo) (`advice`).

**Sul nuoto e sulla danza**: il nuoto **non migliora né stabilizza** la deformità sul piano frontale a un anno di follow-up e non modifica i parametri sagittali; è una buona attività fisica generale ma non un trattamento. Danza e ginnastica artistica sono associate a **maggiore prevalenza** di scoliosi (ballerine circa 35%, ginnaste circa 12%), verosimilmente per l'associazione tra iperlassità, maturazione ritardata e carico spinale asimmetrico. L'iperlassità è presente nel 51,4% dei soggetti con scoliosi idiopatica contro il 19% dei controlli.

**Blacklist**: `Barbell Squat` e `Front Barbell Squat` pesanti, `Overhead Squat`, `Barbell Deadlift` pesante, tutti gli esercizi olimpici, `Standing Barbell Press Behind Neck`, `Seated Barbell Twist`, `Plate Twist`, `Russian Twist` pesante, `Standing Cable Wood Chop` unilaterale non bilanciato, `Hyperextensions (Back Extensions)` in iperestensione, `Handstand Push-Ups`, carry unilaterali non bilanciati.
**Keyword**: `back squat, front squat, overhead squat, deadlift, clean, snatch, jerk, push press, behind the neck, wheel pose, camel pose, backbend, side bend, russian twist, wood chop, back extension, handstand, headstand, tumbling, walkover, suitcase carry`

> **Nota critica sul filtro**: la scoliosi è la condizione dove una blacklist automatica rischia più di fare danno che bene. **Raccomandazione di prodotto: usare prevalentemente `advice` e `warning`, non `hard_block`**, con un messaggio che invita a esercizi bilaterali e simmetrici e a un percorso PSSE con fisioterapista certificato (Schroth, SEAS, BSPTS, Lyon, DoboMed).

**Attrezzi**: preferire `body only`, `bands`, `cable`, `machine` con carico simmetrico, `exercise ball` per il lavoro posturale. Gli esercizi unilaterali con `dumbbell` e `kettlebells` non vanno vietati ma bilanciati (stesso volume sui due lati); in un percorso PSSE possono essere deliberatamente asimmetrici **solo se prescritti da un fisioterapista** in funzione del pattern di curva.
**Categorie**: escludere `olympic weightlifting`, `strongman` e `powerlifting` nell'adolescente in crescita con curva progressiva (valutabili nell'adulto con curva stabile); `plyometrics` consentita con `advice`; mantenere `strength`, `cardio` e `stretching` con preferenza per pattern simmetrici.
**Raccomandati**: PSSE come raccomandazione centrale SOSORT; esercizi respiratori (3 raccomandazioni specifiche nelle linee guida: espansione toracica, respirazione rotazionale angolare del metodo Schroth); rinforzo simmetrico generale (`Plank`, `Side Bridge` con possibile enfasi sul lato convesso su indicazione PSSE, `Bird Dog`, `Dead Bug`, `Glute Bridge`, `Prone Y-T-W`, `Wall Angel`, carry bilanciati); attività aerobica generale e sport ricreativo incoraggiati per salute generale, qualità di vita e aderenza. Principio cardine delle PSSE: auto-correzione attiva in tre dimensioni più stabilizzazione nella posizione corretta.
**Parametri**: adolescente in crescita 50-70% 1RM con priorità alla qualità di esecuzione, adulto con curva stabile nessun limite specifico oltre la tecnica; simmetria del ROM tra i due lati; 10-20 ripetizioni per il lavoro posturale e 8-12 per la forza; tenute correttive PSSE di 5-20 secondi; PSSE 3-5 volte a settimana (spesso quotidiane), forza 2-3 volte; monitoraggio clinico ogni 4-6 mesi durante la crescita.

**Red flag → valutazione specialistica**: progressione della curva superiore a 5° Cobb tra due controlli; scoliosi a esordio precoce (prima dei 10 anni) o curve oltre 45-50° Cobb; **scoliosi atipica** (curva toracica sinistro-convessa, cifosi toracica accentuata, dolore notturno, rigidità marcata) → sospetta scoliosi secondaria, richiede risonanza per escludere siringomielia, Chiari, tumore midollare, malformazioni vertebrali; segni neurologici (asimmetria dei riflessi, riflessi addominali cutanei asimmetrici, deficit sensitivi o motori, alterazione dell'andatura); dispnea o ridotta capacità vitale nelle curve toraciche severe; dolore rachideo significativo e persistente (la scoliosi idiopatica dell'adolescente è tipicamente poco dolorosa).

**Fonti**: 2016 SOSORT guidelines https://link.springer.com/article/10.1186/s13013-017-0145-8 · sport e PSSE https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3675362/ · prevalenza negli atleti https://pmc.ncbi.nlm.nih.gov/articles/PMC9362835/ · iperlassità nelle ginnaste https://www.nature.com/articles/s41598-025-05895-0 · nuoto e scoliosi https://en.isico.it/2020/03/04/scoliosis-dance-and-swimming-yes-or-no/

---

### 3.24 Over 65 e sarcopenia

**Criteri di blocco e di rinvio**: caduta con trauma nelle 48 ore precedenti, o due o più cadute nell'ultimo anno senza valutazione → rinvio a valutazione multidimensionale del rischio di caduta (`warning` bloccante); ipotensione ortostatica sintomatica (calo di almeno 20 mmHg di sistolica o 10 di diastolica nel passaggio in piedi con sintomi) → attività da seduti e passaggi posturali lenti (`warning`); dolore articolare acuto, frattura recente o protesi recente → rispettare i protocolli ortopedici (`hard_block` sugli esercizi coinvolti); osteoporosi severa o fratture vertebrali → vietata flessione spinale caricata, flessione con rotazione e carico assiale massimale (`hard_block` su quei pattern, vedi 3.16); decadimento cognitivo che impedisce di comprendere le istruzioni di sicurezza → solo esercizio supervisionato (`hard_block` in modalità autonoma); malnutrizione o perdita di peso involontaria superiore al 5% in 6 mesi → la sola forza senza apporto proteico adeguato è inefficace (`warning` con rinvio nutrizionale); vertigini o disturbi vestibolari non compensati → nessun esercizio di equilibrio non assistito.

**Pattern da evitare o adattare**: passaggi posturali rapidi da supino a in piedi (inserire fasi intermedie); flessione spinale caricata e crunch ripetuti in presenza di osteoporosi; esercizi di equilibrio senza appoggio disponibile; Valsalva e apnea (ipertensione concomitante frequente); massimali e cedimento completo nelle prime 8-12 settimane; superfici instabili avanzate (bosu, tavolette) senza progressione graduale e senza supporto; salti e atterraggi in presenza di osteoartrosi o osteoporosi; tapis roulant senza corrimano in caso di deficit di equilibrio.

**Blacklist reale**: `Barbell Deadlift` massimale, `Barbell Squat` massimale, i 41 esercizi olimpici, `Standing Barbell Press Behind Neck`, le 5 varianti di `Upright Row`, `Handstand Push-Ups`, i 42 esercizi di salto, `Burpee`, `Plyo Push-up`, `Rope Jumping`, `Kettlebell Pistol Squat`, `Lunge Sprint`.
**Keyword**: `1rm, max, maximal, deadlift, snatch, clean, jerk, behind the neck, handstand, headstand, inversion, box jump, depth jump, plyo, burpee, jump, hop, sprint, pistol, bosu, unstable`
**Keyword condizionali, da attivare SOLO con flag osteoporosi** (altrimenti eccesso di falsi positivi): `sit-up, crunch, toe touch, good morning, russian twist, roman chair`

**Attrezzi**: preferire `machine` (ingresso e uscita sicuri, carico dosabile, nessun rischio di caduta del peso), `bands` (ottime per la fase iniziale e per l'home training), `cable`, `dumbbell` leggeri o moderati, `body only` (sit-to-stand, calf raise, step), cicloergometro; sedia robusta come supporto per l'equilibrio. Introdurre con cautela e solo in progressione `barbell` (ottimo per la forza ma richiede tecnica e supervisione), `kettlebells`, `exercise ball`, `medicine ball` leggera.
**Categorie**: escludere `olympic weightlifting`, `strongman` e il `powerlifting` massimale; escludere o mettere in forte avviso `plyometrics` (esistono protocolli di power training a basso impatto, ma non vanno erogati automaticamente); `strength` è il cardine del programma; `cardio` e `stretching` raccomandati.

**Protocollo raccomandato**
- **Linee guida OMS 2020 e Linee di indirizzo del Ministero della Salute 2021** (identiche nei numeri): 150-300 minuti a settimana di attività aerobica moderata (o 75-150 vigorosa, o combinazione); rafforzamento muscolare a intensità moderata o superiore su tutti i principali gruppi muscolari **2 o più giorni a settimana**; **attività multicomponente varia che enfatizza equilibrio funzionale e forza, a intensità moderata o superiore, 3 o più giorni a settimana**, per migliorare la capacità funzionale e prevenire le cadute; limitare il tempo sedentario.
- **Forza (ACSM, NSCA)**: 2-3 volte a settimana in giorni non consecutivi, 8-10 esercizi; partire da 40-50% 1RM per 8-12 settimane di adattamento, progredire a 60-80% e fino a 70-85% in soggetti allenati e clinicamente stabili; 8-12 ripetizioni in fase di forza e ipertrofia, 10-15 in fase iniziale o nei molto anziani; 1-3 serie in avvio, 2-4 in mantenimento; pause 1-3 minuti; doppia progressione (prima le ripetizioni al top del range, poi +5-10% di carico).
- **Power training** (il determinante funzionale più importante, cala prima della forza massima): stessi esercizi con fase concentrica **il più veloce possibile** ed eccentrica controllata in 2-3 secondi, carichi 40-60% 1RM, 1-3 serie x 6-10. Esercizi tipici: leg press veloce, chest press veloce, seated row, sit-to-stand rapido, step-up.
- **Equilibrio e prevenzione cadute**: 3 o più giorni a settimana, con un minimo di circa 3 ore settimanali totali di esercizio per ottenere una riduzione significativa delle cadute. Progressione: base di appoggio da larga a stretta (piedi uniti, semi-tandem, tandem, monopodalico), riduzione progressiva dell'appoggio delle mani, occhi aperti poi chiusi, superficie stabile poi morbida. Programma di riferimento **Otago**: 17 esercizi di forza ed equilibrio più camminata fino a 30 minuti, 3 volte a settimana, con riduzione delle cadute del 35-40% negli anziani fragili.
- **Apporto proteico** (cardine non negoziabile: senza proteine il resistance training nell'anziano rende molto meno): anziani sani **almeno 1,0-1,2 g/kg al giorno**; anziani malnutriti o con malattia acuta o cronica **1,2-1,5 g/kg**; distribuzione di circa **25-30 g per pasto** con 2,5-2,8 g di leucina; post-esercizio la risposta anabolica nell'anziano richiede 20-40 g contro i 20 g del giovane. Vitamina D da valutare sui livelli sierici. *(Nota di prodotto: questi sono contenuti informativi generali, non una prescrizione dietetica; se l'app li mostra, vanno accompagnati dal rinvio al medico o al nutrizionista.)*

**Segnali di allarme**: perdita di equilibrio, vertigine, capogiro nel passaggio posturale, dolore toracico, dispnea, confusione improvvisa, dolore articolare acuto, dolore muscolare sproporzionato o dolorabilità oltre 48-72 ore, gonfiore articolare, urine scure (sospetta rabdomiolisi dopo carichi eccentrici non abituali).

**Fonti**: WHO 2020 Guidelines https://www.ncbi.nlm.nih.gov/books/NBK566046/ e https://pubmed.ncbi.nlm.nih.gov/33239350/ · Ministero della Salute, Linee di indirizzo 2021 https://www.salute.gov.it/new/it/tema/attivita-fisica/linee-di-indirizzo-sullattivita-fisica/ (PDF https://www.aiom.it/wp-content/uploads/2022/01/2021_MinSal_LineeIndirAttFis.pdf) · NSCA Position Statement https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf · ESPEN https://www.espen.org/files/PIIS0261561414001113.pdf · Otago https://www.med.unc.edu/aging/cgwep/courses/otago-exercise-program/

---

### 3.25 Matrice sinottica categoria per condizione

Legenda: **X** = escludere, **F** = filtrare per esercizio, **!** = avviso, **ok** = consentito, **+** = promuovere attivamente.

| Condizione | strength | stretching | cardio | plyometrics | powerlifting | olympic w. | strongman |
|---|---|---|---|---|---|---|---|
| Ernia lombare / lombalgia | F | F (flessione) | ok (basso impatto) | X | X | X | X |
| Ernia inguinale / addominale | F | ok | ok | ! | X | X | X |
| Cervicale | F | F (end-range) | ok (basso impatto) | X | F | X | X |
| Cuffia / impingement | F | ok | ok | X (upper) | F | X | X |
| Instabilità di spalla | F | F (anteriore) | ok | X (upper) | F | X | X |
| Dolore femoro-rotuleo | F | ok | ok (basso impatto) | X | F | X | X |
| Lesione meniscale | F | ok | ok (basso impatto) | X | F | X | X |
| Ricostruzione LCA | F | ok | ok (basso impatto) | X fino a fase 3 | F | X | X |
| Epicondilite / epitrocleite | F (presa) | ok | ok | X (upper) | F | X | X |
| Tunnel carpale | F (polso) | F (polso) | ok (no appoggio palmare) | X (mani) | F | X | X |
| Instabilità di caviglia | ok | F (inversione) | ok (basso impatto) | X poi reintrodurre | ok | X | X |
| Ipertensione controllata | ok (≤70% 1RM) | ok | ok | ! | X | X | X |
| Ipertensione non controllata | ! | ok | ok | X | X | X | X |
| Cardiopatia / post-infarto | ok (≤60% 1RM) | ok (no inversioni) | ok (cap FC) | X | X | X | X |
| Diabete non complicato | ok | ok | ok | ok | ! | ! | ! |
| Retinopatia proliferativa | ! (bassa intensità) | ok (no inversioni) | ok (moderata) | X | X | X | X |
| Obesità BMI > 35 | ok | ok | ok (basso impatto) | X | ! | X | X |
| Osteoporosi / osteopenia | **+** | F (flessione) | **+** impatto se no fratture | X se frattura | ok supervisionato | X | X |
| Artrosi | **+** | ok | ok | ! | valutare | X | X |
| Artrite reumatoide | **+** | ok | ok | ! | F (no carico cervicale) | X | X |
| Asma da sforzo | ok | ok | ! (continua ad alta intensità) | ! | ok | ! | ! |
| Gravidanza (tutti i trimestri) | F | F (posizione) | ok (no rischio caduta) | X | ! | X | X |
| Post-partum / diastasi | F | ok | ok (basso impatto fino a 12 sett.) | X fino a 12 sett. | ! | X | X |
| Varici / insufficienza venosa | ok (alte rip.) | ok | ok | ! | X | X | X |
| Epilessia | ok (solo machine) | ok | ok (indoor) | ! | X | X | X |
| Scoliosi | ok | F (asimmetrico) | ok | ok | F in crescita | X | X |
| Over 65 / sarcopenia | **+** | ok | ok | X o ! | X | X | X |
| Seduto / carrozzina | F | F | F (arm crank) | X | X | X | X |
| Mobilità ridotta | F | ok | F (basso impatto) | X | ! | X | X |

---
## 4. Traduzione in regole di filtro

### 4.1 Il dataset di partenza

Il dataset del progetto è in `db-exercise/dist/exercises.json`: **876 esercizi**, schema in `db-exercise/schema.json`.

| Campo | Valori | Uso nel filtro |
|---|---|---|
| `id` | slug univoco (es. `Barbell_Deadlift`) | chiave per le blacklist esplicite |
| `name` | stringa | match su keyword (filtro **secondario**) |
| `force` | `push`, `pull`, `static`, `null` | usato marginalmente (es. `static` per isometrie prolungate) |
| `level` | `beginner`, `intermediate`, `expert` | cap di complessità per principianti e condizioni instabili |
| `mechanic` | `compound`, `isolation`, `null` | preferire `isolation` in fase di irritabilità tendinea |
| `equipment` | `barbell`, `dumbbell`, `body only`, `bands`, `kettlebells`, `foam roll`, `cable`, `machine`, `medicine ball`, `exercise ball`, `e-z curl bar`, `other`, `null` | filtro **primario** |
| `primaryMuscles`, `secondaryMuscles` | 17 valori (`abdominals`, `abductors`, `adductors`, `biceps`, `calves`, `chest`, `forearms`, `glutes`, `hamstrings`, `lats`, `lower back`, `middle back`, `neck`, `quadriceps`, `shoulders`, `traps`, `triceps`) | filtro **primario** |
| `category` | `strength`, `stretching`, `cardio`, `plyometrics`, `powerlifting`, `olympic weightlifting`, `strongman` | filtro **primario** |

**Ordine di applicazione dei filtri, dal più affidabile al meno affidabile**
1. `category` (dato strutturato, sempre presente)
2. `equipment` (dato strutturato)
3. `primaryMuscles` / `secondaryMuscles` (dato strutturato)
4. `movement_patterns` (derivati, vedi 4.3)
5. `name_keywords` (match su stringa, **ultimo**, soggetto a falsi positivi)
6. `exercise_ids` (blacklist esplicita, sempre vincente)

### 4.2 Schema dati JSON

Il file completo è in `docs/research/03-regole-condizioni.json`. Struttura:

```jsonc
{
  "schema_version": "1.0.0",
  "dataset": { "path": "db-exercise/dist/exercises.json", "exercise_count": 876 },
  "enums": {
    "severity": ["hard_block", "warning", "advice", "medical_stop"],
    "equipment": [...],            // i 12 valori del dataset + null
    "muscles": [...],              // i 17 valori del dataset
    "categories": [...],           // i 7 valori del dataset
    "phase": ["acute", "subacute", "chronic", "post_op", "stable"]
  },
  "global": {
    "stop_signals": [...],         // segnali di stop universali (sezione 5)
    "medical_clearance_triggers": [...],
    "hard_block_red_flags": [...],
    "pain_rule": {...}             // regola del dolore Silbernagel
  },
  "movement_patterns": {
    "<pattern_id>": {
      "label_it": "...",
      "name_keywords": ["..."],
      "name_keywords_exclude": ["..."],   // whitelist anti falso positivo
      "exercise_ids": ["..."],
      "categories": ["..."],
      "equipment": ["..."]
    }
  },
  "conditions": {
    "<condition_id>": {                  // snake_case inglese
      "label_it": "...",
      "aliases_it": ["..."],
      "group": "musculoskeletal | cardiometabolic | special_population | accessibility",
      "default_severity": "hard_block | warning | advice",
      "requires_medical_clearance": true | false,
      "onboarding_questions_it": ["..."],
      "numeric_gates": [                  // soglie oggettive
        { "field": "resting_sbp", "op": ">=", "value": 180, "severity": "hard_block",
          "message_it": "..." }
      ],
      "exclude": {
        "categories": ["..."],
        "equipment": ["..."],
        "primary_muscles": ["..."],
        "movement_patterns": ["..."],
        "name_keywords": ["..."],
        "exercise_ids": ["..."],
        "level_above": "intermediate"
      },
      "warn": { ... stessa forma di exclude ... },
      "prefer": {
        "categories": ["..."], "equipment": ["..."],
        "name_keywords": ["..."], "exercise_ids": ["..."]
      },
      "parameters": {
        "load_pct_1rm": [min, max],
        "rom_note_it": "...",
        "rep_range": [min, max],
        "tempo": "...",
        "rest_sec": [min, max],
        "frequency_per_week": [min, max],
        "progression_note_it": "..."
      },
      "adaptation_notes_it": ["..."],
      "red_flags_it": ["..."],
      "sources": ["https://..."]
    }
  }
}
```

Ogni condizione può avere `phases` che sovrascrivono `exclude`, `warn` e `parameters` in funzione della fase dichiarata (acuta, subacuta, cronica, post-operatoria).

### 4.3 Pattern di movimento e keyword verificate sul dataset

I `movement_patterns` sono il livello intermedio tra la clinica e i campi del dataset: una condizione non dichiara 200 keyword, dichiara 3-5 pattern.

| Pattern id | Cosa cattura | Keyword principali | Match reali sul dataset |
|---|---|---|---|
| `spinal_flexion_loaded` | flessione lombare caricata | `sit-up, situp, crunch, jackknife, toe touch, rollout, ab roller, jefferson, good morning, hanging leg raise` | 30 sit-up/crunch + 7 good morning + 3 rollout |
| `spinal_rotation_loaded` | torsione caricata | `russian twist, seated twist, torso rotation, plate twist, wood chop, windmill` | 8 |
| `spinal_hyperextension` | iperestensione lombare | `hyperextension, back extension, superman, reverse hyper` | 5 |
| `axial_load_spine` | carico assiale sul rachide | `back squat, front squat, barbell squat, overhead squat, zercher, jefferson squat` | 56 match su `squat`, da filtrare per bilanciere |
| `hip_hinge_loaded` | hinge caricato | `deadlift, good morning, romanian, stiff-legged, rack pull, bent over, pendlay` | 24 deadlift + 7 good morning |
| `overhead_press` | spinta sopra la testa | `overhead, military press, shoulder press, push press, jerk, thruster, handstand` | 41 |
| `behind_neck` | carico dietro la nuca | `behind the neck, behind neck` | 3 (`Push Press - Behind the Neck`, `Standing Barbell Press Behind Neck`, `Wide-Grip Pulldown Behind The Neck`) |
| `upright_row` | gomiti sopra la spalla in elevazione | `upright row` | 5 |
| `shoulder_abduction_external_rotation` | posizione di apprensione | `behind the neck, wide-grip bench, fly, flye, butterfly, pec deck, dip, cuban, dislocate, overhead throw` | 20 flye + 8 dip |
| `deep_knee_flexion` | flessione profonda di ginocchio | `full squat, deep squat, sissy, hack squat, pistol, shrimp, cossack, deep lunge` | 8 |
| `open_chain_knee_extension` | catena aperta di ginocchio | `leg extension, knee extension` | 2 |
| `impact_jumping` | impatto e salti | `jump, hop, bound, leap, plyo, box, depth, burpee, sprint, skipping, rope jumping` | 42 |
| `valsalva_maximal` | carichi massimali con apnea | `1rm, max effort, maximal, heavy` + `category` powerlifting/strongman/olympic | 38 + 21 + 41 per categoria |
| `inverted_head_below_heart` | testa sotto il cuore | `handstand, headstand, inversion, inverted, shoulder stand, plow, decline, hanging` | 1 handstand + 15 decline + 3 hanging |
| `wrist_extension_loaded` | polso in estensione sotto carico | `wrist curl, wrist roller, wrist rotation, push-up, plank, front squat, clean grip, frankenstein, bear crawl` | 12 wrist + 2 front rack |
| `grip_intensive` | presa massimale sostenuta | `farmer, rickshaw, yoke, atlas, grip, dead hang, mixed grip, sledgehammer, battling ropes` | 15 |
| `supine_position` | decubito supino | `lying, supine, floor press, flat bench, bench press, decline, hip thrust, glute bridge` (escludere `side lying`, `side-lying`, `incline`) | 30 + 21 + 8 |
| `prone_position` | decubito prono | `prone, lying face down, superman, hyperextension, glute ham raise` | 4 |
| `neck_loading` | carico diretto sul rachide cervicale | `neck press, neck resistance, head harness, neck extension, neck flexion, neck bridge, wrestler` + `primaryMuscles: ["neck"]` | 12 |
| `overhead_free_weight_unspotted` | carico libero sopra il corpo | `bench press, military press, overhead press, push press, jerk, snatch` con `equipment: barbell` | 21 + 41 |
| `single_leg_unstable` | monopodalico instabile | `single-leg, single leg, one leg, pistol, bosu, balance board` | 9 |
| `ballistic_kettlebell` | balistico con kettlebell | `swing, kettlebell snatch, kettlebell clean, kettlebell jerk` con `equipment: kettlebells` | 14 |
| `high_ventilation_continuous` | alta ventilazione continua | `sprint, running, run, jog, hiit, tabata, amrap, emom, metcon, circuit, interval, airbike` | struttura di sessione, non nome esercizio |

### 4.4 Motore di risoluzione e conflitti tra condizioni

```
per ogni esercizio E del dataset:
  verdetto = "allow"
  note = []
  per ogni condizione C attiva nel profilo utente:
     se E matcha C.exclude  -> verdetto = max(verdetto, C.severity_exclude)
     se E matcha C.warn     -> verdetto = max(verdetto, "warning")
     se E in C.prefer       -> boost del punteggio di selezione
  applica i parametri: carico = min(tutti i cap), ROM = min(tutti i cap),
                       rep_range = intersezione, frequenza = min
```

**Regole di risoluzione**
1. **La severità massima vince**: `hard_block` batte `warning` batte `advice`.
2. **Il parametro più restrittivo vince**: carico, ROM, rep range e frequenza si risolvono prendendo il minimo.
3. **La fase acuta batte tutto**: il conflitto classico è osteoporosi (che richiede carico pesante) più ernia lombare acuta (che richiede scarico). Vince la condizione acuta finché non si risolve.
4. **Blacklist esplicita per `exercise_ids` sempre vincente**: è l'override manuale per i casi che nessun filtro strutturale cattura.
5. **Sostituzione, non buco**: se un esercizio viene bloccato, il motore deve proporre un sostituto con gli stessi `primaryMuscles`, preferendo `equipment` in `["machine","bands","cable"]` e `category: "strength"`. Una scheda con dei buchi è peggio di una scheda adattata.
6. **Override clinico**: ogni `hard_block` deve poter essere sbloccato da un flag inserito dopo valutazione professionale, con audit trail (chi, quando, quale condizione). Senza questo, l'app diventa inutilizzabile per chi è già in follow-up riabilitativo.
7. **Cap globali indipendenti dalle condizioni**: `level: "expert"` va escluso per i principianti; `category` in `["olympic weightlifting","strongman"]` non va mai proposta in autonomia a un utente senza esperienza dichiarata.

### 4.5 Falsi positivi noti e come evitarli

Il match su stringa è il livello più fragile. Questi sono i casi verificati sul dataset del progetto.

| Keyword ingenua | Cosa rompe | Usare invece |
|---|---|---|
| `dead` | blocca `Dead Bug`, che è **raccomandato** nella lombalgia | `deadlift` |
| `bridge` | blocca `Glute Bridge` e `Side Bridge`, **raccomandati** | `neck bridge`, `wrestler's bridge`, `wheel pose` |
| `twist` | blocca `Incline Dumbbell Flyes - With A Twist` (supinazione del polso) e `Wrist Rotations with Straight Bar` | `russian twist`, `seated barbell twist`, `plate twist`, `torso rotation` |
| `row` | blocca `Seated Cable Rows` e `Chest Supported Row`, accettabili quasi sempre | `upright row`, `bent over`, `pendlay`, `t-bar` |
| `press` | blocca `Leg Press` e `Chest Press`, spesso raccomandati | `overhead press`, `military press`, `behind the neck`, `push press` |
| `raise` | blocca `Lateral Raise` e `Calf Raise` | `leg raise`, `hanging leg raise` |
| `curl` | blocca `Barbell Curl` e `Leg Curl` | `wrist curl`, `jefferson curl` |
| `lying` | blocca `Side-Lying Floor Stretch` e `Side Lying Groin Stretch`, consentiti in gravidanza (decubito laterale) | `lying` con esclusione di `side lying` e `side-lying` |
| `bench press` | blocca anche `Barbell Incline Bench Press`, che in gravidanza è **avviso**, non blocco | declassare a `warning` se il nome contiene `incline` |
| `squat` | blocca lo squat parziale, **raccomandato** nel dolore femoro-rotuleo e nell'artrosi | `full squat`, `deep squat`, `sissy`, `hack squat`, `pistol` |
| `neck` | intercetta correttamente i 12 esercizi per il collo, ma anche `Side Neck Stretch`, spesso utile | separare `neck resistance`, `neck press`, `head harness` dallo stretching |

**Normalizzazione obbligatoria prima del match**: lowercase, rimozione di trattini e underscore, collasso degli spazi multipli, rimozione della punteggiatura. I nomi nei database di esercizi sono notoriamente inconsistenti ("Barbell Deadlift", "Deadlift", "Dead Lift", "Conventional Deadlift").

### 4.6 Attributi mancanti da aggiungere al dataset

Molte regole cliniche dipendono da informazioni che il dataset pubblico non contiene. Senza questi attributi, il filtro produce falsi positivi e falsi negativi. Vanno aggiunti come campi custom in un file di arricchimento affiancato (per non toccare il dataset upstream).

| Attributo proposto | Valori | Serve per |
|---|---|---|
| `rom_depth` | `partial`, `full`, `deep` | dolore femoro-rotuleo, menisco, artrosi, LCA |
| `spine_position` | `neutral`, `flexed`, `extended`, `rotated` | osteoporosi, ernia lombare, scoliosi |
| `axial_spine_load` | `none`, `low`, `high` | osteoporosi, cervicale, artrite reumatoide, scoliosi |
| `shoulder_elevation_max` | gradi (0, 90, 120, 180) | cuffia, impingement, instabilità |
| `grip_type` | `neutral`, `pronated`, `supinated`, `none` | epicondilite, tunnel carpale |
| `wrist_position` | `neutral`, `extended`, `flexed` | tunnel carpale |
| `body_position` | `standing`, `seated`, `supine`, `prone`, `side_lying`, `quadruped`, `hanging` | gravidanza, accessibilità, varici |
| `valsalva_demand` | `none`, `low`, `high` | ipertensione, cardiopatia, ernia, varici, gravidanza |
| `impact_level` | `none`, `low`, `moderate`, `high` | obesità, osteoporosi, caviglia, post-partum |
| `fall_risk` | `low`, `moderate`, `high` | over 65, gravidanza, epilessia, mobilità ridotta |
| `load_over_body` | `true`, `false` | epilessia (rischio di caduta del bilanciere sul corpo) |
| `seated_executable` | `true`, `false` | accessibilità, allenamento da seduti |
| `met_estimate` | numero | cardiopatia (filtro sulla capacità funzionale in MET) |

Finché questi attributi non esistono, le regole che ne dipendono vanno espresse come `warning` con nota testuale, non come `hard_block` silenzioso.

---

## 5. Sicurezza generale durante l'allenamento

### 5.1 Segnali di allarme: quando fermarsi

Lista da rendere **raggiungibile in un tap durante la sessione**, non sepolta nei termini d'uso.

**Stop immediato e chiamata al 112**
- Dolore, oppressione, peso o bruciore toracico, irradiato a braccio sinistro, mandibola o dorso, specialmente se accompagnato da nausea, vomito, sudorazione fredda profusa o dispnea sproporzionata. L'American Heart Association indica di non attendere più di cinque minuti prima di chiamare i soccorsi.
- Perdita di coscienza, sincope, confusione improvvisa, difficoltà a parlare, asimmetria del volto, perdita di forza a un lato del corpo.
- Crisi epilettica (posizione laterale di sicurezza, nulla in bocca, cronometrare, soccorsi se oltre 5 minuti).
- Dispnea improvvisa con dolore toracico dopo un periodo di immobilità o con gonfiore di un polpaccio (sospetta embolia polmonare).

**Stop della sessione e valutazione medica**
- Capogiro, vertigine, sensazione di svenimento: non si deve mai avere un capogiro durante l'esercizio.
- Palpitazioni, battito irregolare, sensazione di battiti saltati, tachicardia sproporzionata.
- Nausea o vomito da sforzo, sudorazione fredda.
- Dispnea che non recede entro pochi minuti dallo stop, sibili, tosse persistente, incapacità di parlare in frasi complete.
- Dolore articolare o muscolare acuto e improvviso, sensazione di strappo o schiocco, gonfiore articolare rapido.
- Formicolii, perdita di forza o di sensibilità a un arto.
- Disturbi della vista (mosche volanti, tende scure, flash, calo visivo improvviso).
- Cefalea intensa a esordio improvviso.
- Urine scure dopo carichi eccentrici non abituali (sospetta rabdomiolisi).

**Soglie oggettive** (se misurate): pressione durante sforzo sopra 250 mmHg di sistolica o 115 di diastolica; calo della sistolica superiore a 10 mmHg nonostante l'aumento del carico; glicemia sotto 70 mg/dL o sopra 270 mg/dL con chetoni; SpO2 in calo significativo.

**Non allenarsi affatto se**: febbre o malattia acuta in corso (indicazione esplicita del PAR-Q+); privazione di sonno severa; disidratazione; sotto effetto di alcol o di farmaci che alterano vigilanza e coordinazione; dolore non spiegato non ancora valutato.

### 5.2 Respirazione e manovra di Valsalva

La manovra di Valsalva (inspirare e trattenere il respiro a glottide chiusa durante lo sforzo) produce **la risposta pressoria più alta** tra le tecniche respiratorie durante il resistance training, con picchi che possono superare abbondantemente le soglie di controindicazione, oltre a capogiri e sincope.

**Tecnica da insegnare in app**: **espirare durante la fase di sforzo** (concentrica) e **inspirare durante il ritorno** (eccentrica). La respirazione deve essere continua e udibile. Nessuna apnea.

**Quando la Valsalva va evitata in modo assoluto**: ipertensione (specialmente non controllata), cardiopatia e post-infarto, aneurismi noti, retinopatia diabetica proliferativa, glaucoma, ernia inguinale o addominale, varici e insufficienza venosa, gravidanza (indicazione esplicita del Ministero della Salute), post-operatorio addominale, over 65 con comorbilità cardiovascolari.

**Nota di onestà**: nel powerlifting agonistico e supervisionato una Valsalva breve ha un ruolo di stabilizzazione del tronco riconosciuto. Questo non riguarda l'utenza di una app consumer non supervisionata, dove la regola deve restare "espira sullo sforzo".

Fonti: AHA, Resistance Exercise in Individuals With and Without Cardiovascular Disease https://www.ahajournals.org/doi/10.1161/01.cir.101.7.828 · effetto delle tecniche respiratorie sulla pressione https://pmc.ncbi.nlm.nih.gov/articles/PMC1478931/

### 5.3 Idratazione

- **Prima**: circa 500 ml di liquidi 2 ore prima dell'esercizio, per favorire l'idratazione e lasciare il tempo di eliminare l'eccesso.
- **Durante**: iniziare a bere presto e a intervalli regolari, con l'obiettivo di reintegrare i liquidi persi con la sudorazione, o il massimo tollerato. Temperatura consigliata dei liquidi 15-22 °C.
- **Sodio**: nelle attività oltre l'ora, l'aggiunta di sodio (circa 0,5-0,7 g/l) migliora la palatabilità e favorisce la ritenzione dei liquidi.
- **Individualizzazione**: pesarsi prima e dopo l'allenamento è il metodo pratico per stimare il proprio tasso di sudorazione.
- **Attenzione all'eccesso**: nelle sessioni molto lunghe la sovraidratazione con sola acqua espone a iponatriemia, rilevante in particolare nell'epilessia (abbassa la soglia convulsiva).
- **Casi speciali**: diuretici (rischio di disidratazione), diabete con neuropatia autonomica (termoregolazione alterata), lesione midollare sopra T6 (termoregolazione compromessa), gravidanza (evitare ipertermia).

Fonte: ACSM Position Stand, Exercise and Fluid Replacement https://pubmed.ncbi.nlm.nih.gov/9303999/

### 5.4 DOMS contro dolore da infortunio

| Caratteristica | DOMS (indolenzimento) | Dolore da infortunio |
|---|---|---|
| Quando compare | Gradualmente, 8-12 ore dopo l'esercizio, picco a 24-48 ore | Durante l'esercizio, spesso improvviso |
| Qualità | Dolore sordo, diffuso, con rigidità e dolorabilità alla palpazione | Acuto, puntorio, localizzato; talvolta schiocco udibile |
| Localizzazione | Sul ventre muscolare, bilaterale e simmetrico | Spesso articolare o su un punto preciso, tipicamente monolaterale |
| Evoluzione | Diminuisce progressivamente in pochi giorni | Resta uguale o peggiora nel tempo |
| Durata | Si risolve in 2-5 giorni; oltre una settimana è sospetto | Persiste oltre una settimana |
| Effetto del riscaldamento | Migliora con il movimento leggero | Non migliora o peggiora |
| Segni associati | Nessuno | Gonfiore, versamento, ematoma, blocco articolare, cedimento, deficit di forza o di sensibilità |

**Messaggio in app**: "L'indolenzimento è normale dopo un allenamento nuovo o più intenso. Il dolore acuto durante l'esercizio non lo è. Se il dolore compare all'improvviso, è localizzato su un'articolazione, ti impedisce di muoverti normalmente o dura più di una settimana, fermati e parlane con un medico."

Fonte: Cleveland Clinic https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness · Cedars-Sinai https://www.cedars-sinai.org/stories-and-insights/healthy-living/what-is-delayed-onset-muscle-soreness

### 5.5 La regola del dolore (modello di monitoraggio)

Regola universale, derivata dal pain-monitoring model di Silbernagel e adottata anche nelle linee guida sull'artrosi e sulle tendinopatie. È applicabile a quasi tutte le condizioni muscoloscheletriche.

1. Dolore **fino a 5/10 durante** l'esercizio: accettabile.
2. Il dolore **non deve aumentare significativamente dopo** l'esercizio.
3. Il dolore **deve essere tornato al livello basale la mattina dopo**.
4. Dolore e rigidità **non devono crescere di settimana in settimana**.

Se anche uno solo di questi criteri fallisce, ridurre carico o volume del 20-50% e rivalutare. Per il dolore femoro-rotuleo la soglia consigliata è più conservativa (3/10).

**Regola del "non far male" da esporre in UI**: nessun esercizio deve essere eseguito attraverso un dolore acuto, un dolore articolare che peggiora durante la serie, o una sensazione di instabilità o di cedimento. Il dolore non è un obiettivo dell'allenamento. In presenza di dolore ci si ferma, non si "spinge oltre".

Fonte: Silbernagel et al., Am J Sports Med 2007 https://journals.sagepub.com/doi/abs/10.1177/0363546506298279

### 5.6 Progressione prudente per principianti

- **Punto di partenza**: 20-60 minuti di esercizio da leggero a moderato, 3-5 giorni a settimana, combinando aerobico e rinforzo muscolare (indicazione esplicita del PAR-Q+ per chi ha condizioni cliniche controllate).
- **Obiettivo a regime**: 150-300 minuti a settimana di attività aerobica moderata (o 75-150 vigorosa) più rinforzo muscolare su tutti i principali gruppi almeno 2 giorni a settimana (OMS 2020, recepito dalle Linee di indirizzo del Ministero della Salute 2021).
- **Ordine di progressione**: prima la **frequenza**, poi la **durata**, poi l'**intensità**, infine il **carico**. Mai due variabili insieme.
- **Doppia progressione sul carico**: si aumenta il peso del 2-10% solo quando si completano tutte le serie al limite superiore del rep range per due sessioni consecutive.
- **Regola del 10%**: incrementi settimanali di volume non superiori al 10% circa.
- **Prime 4-8 settimane**: nessun cedimento muscolare, nessun test massimale, carichi 40-60% 1RM, tecnica prima del carico.
- **Riscaldamento e defaticamento**: 5-10 minuti ciascuno, obbligatori in tutte le condizioni cardiovascolari e in gravidanza; il defaticamento attivo previene l'ipotensione post-esercizio.
- **Riprese dopo interruzione**: dopo più di 2 settimane di stop, ripartire da circa il 70% del carico precedente.
- **Oltre i 45 anni** senza abitudine all'esercizio intenso: consultare un professionista qualificato prima di passare a intensità vigorosa (indicazione PAR-Q+).

### 5.7 Checklist di sicurezza ambientale e tecnica

- Attrezzature integre, collari e fermi sempre montati, rack con safety regolate all'altezza corretta.
- Spotter obbligatorio per bench press e squat con bilanciere libero a carichi significativi (per l'epilessia è un `hard_block` in assenza di spotter).
- Spazio libero attorno all'area di lavoro; superficie non scivolosa; calzature adeguate.
- Non allenarsi da soli nelle prime sessioni in caso di condizioni cliniche dichiarate.
- Tapis roulant: chiave di sicurezza magnetica sempre agganciata.
- Verificare i limiti di portata dichiarati dal produttore delle macchine in caso di obesità grave.
- Telefono raggiungibile e numero di emergenza noto.
- Ambiente termo-neutro, ventilato; evitare caldo e umidità elevati in gravidanza, cardiopatia, diabete con neuropatia autonomica, lesione midollare, sclerosi e asma.

---

## 6. Accessibilità motoria

### 6.1 Dosaggi raccomandati

**OMS 2020**: gli adulti **con disabilità** seguono le stesse raccomandazioni degli adulti in generale, cioè 150-300 minuti a settimana di attività aerobica moderata (o 75-150 vigorosa) più rinforzo muscolare su tutti i principali gruppi almeno 2 giorni a settimana; gli anziani con disabilità aggiungono attività multicomponente su equilibrio funzionale e forza almeno 3 giorni a settimana. L'OMS afferma esplicitamente che "l'attività fisica è sicura e benefica per le persone con disabilità in assenza di controindicazioni" e che "some physical activity is better than none". Riconosce inoltre che chi usa la carrozzina o ha bassa mobilità può ridurre il tempo sedentario restando seduto e muovendosi.

**Linee guida internazionali per lesione midollare (Martin Ginis et al. 2018)**: per benefici di fitness, almeno **20 minuti di aerobico moderato-vigoroso 2 volte a settimana** più **3 serie** per ciascun gruppo muscolare funzionante a intensità moderata-vigorosa 2 volte a settimana; per benefici cardiometabolici, almeno **30 minuti di aerobico moderato-vigoroso 3 volte a settimana**.

**Ministero della Salute**: per chi ha problemi di mobilità o disabilità raccomanda esplicitamente nuoto, esercizi in acqua o attività da seduti.

### 6.2 Allenamento da seduti (sedia o carrozzina)

**Cosa è eseguibile**: spinta orizzontale (chest press con bande o cavi, push seduto su macchina con schienale); trazione orizzontale e verticale (seated cable row, lat pulldown frontale, band pull apart, face pull, retrazione scapolare); spalla (alzate laterali e frontali con manubri leggeri o bande, extrarotazione con banda o cavo, shoulder press **solo se indolore e senza intrarotazione sopra la spalla**); braccia (curl, estensioni tricipiti, lavoro di polso e presa); core disponibile (anti-rotazione seduta con `Pallof Press`, inclinazione laterale controllata, respirazione, estensione toracica); arti inferiori se c'è funzione residua (leg extension e curl con bande, sollevamenti del ginocchio, spinte con banda sotto il piede); cardio (ergometro a manovella, handbike, rullo per carrozzina, circuiti a bande a ritmo continuo).

**Attrezzi, in ordine di priorità**
1. **`bands`**: resistenza graduabile, ancorabili alla carrozzina o al muro, nessun rischio di caduta del carico su gambe insensibili. Nel dataset sono 20 esercizi, quasi tutti eseguibili seduti.
2. **`dumbbell`** leggeri, con fasce di ancoraggio al polso nelle tetraplegie.
3. **`cable`**: traiettoria costante, altezza regolabile.
4. **`machine`** con schienale, verificando trasferibilità e spazio per la carrozzina.
Da evitare come default: `barbell`, `kettlebells` balistici, `medicine ball`, `exercise ball`, `foam roll` a terra (richiede trasferimento a terra).

**Volumi**: riferimento PVA per lesione midollare, 1 serie di 8-10 esercizi per i principali gruppi muscolari, 8-12 ripetizioni, 2-3 giorni a settimana, con progressione graduale (poi 3 serie secondo Martin Ginis 2018 per chi punta al fitness). Flessibilità almeno 2-3 volte a settimana, con attenzione a **extrarotazione dell'omero** e **retrazione e rotazione superiore della scapola**, e stretching mirato su pettorali e spalla anteriore.

**Precauzioni, in ordine di gravità**

1. **Spalla sovraccaricata** (`warning` forte, `hard_block` su alcune voci). Nell'utente di carrozzina la gleno-omerale è l'articolazione portante per locomozione, trasferimenti e attività quotidiane. Le linee guida PVA raccomandano di: minimizzare frequenza, durata e forza dei compiti ripetitivi dell'arto superiore; evitare le posizioni estreme, inclusa la **mano sopra la spalla** e le rotazioni estreme; **evitare l'intrarotazione quando si lavora sopra il livello della spalla**; enfatizzare i **depressori della spalla** e gli **stabilizzatori della scapola**; **non eseguire esercizi di rinforzo se dolorosi o se il ROM è significativamente ridotto**; ridurre l'intensità se l'affaticamento post-allenamento impedisce le attività quotidiane. Traduzione operativa: rapporto **tirare/spingere almeno 2:1**, `hard_block` su upright row e su qualunque variante dietro la nuca, `warning` su overhead press e dip.
2. **Disreflessia autonomica, lesioni a livello T6 o superiore** (`hard_block` con red flag). Fino al 90% delle persone con lesione cervicale o toracica alta è suscettibile. Innesco più frequente (circa 85% dei casi) di origine urologica: vescica distesa, catetere ostruito, infezione; poi fecaloma e lesioni da pressione. Segni: **rapido aumento della pressione arteriosa, cefalea pulsante, rossore e sudorazione sopra il livello di lesione, bradicardia, congestione nasale, visione offuscata, brividi**. Azione: **interrompere immediatamente**, mettere in posizione seduta, allentare indumenti e cinghie, controllare catetere e vescica, contattare assistenza medica. È un'emergenza. Prevenzione: svuotare vescica e intestino prima dell'allenamento.
3. **Termoregolazione compromessa** (`warning` forte). Perdita di sudorazione e del controllo vasomotorio sotto il livello di lesione, proporzionale al livello: nella tetraplegia la temperatura centrale sale molto più rapidamente e il rischio di colpo di calore è superiore rispetto alla paraplegia a parità di intensità. Azioni: ambiente fresco e ventilato, strategie di raffreddamento pre e durante, pause più frequenti, idratazione programmata.
4. **Lesioni da pressione** (`advice`): pressure relief ogni 15-30 minuti nelle sessioni lunghe da seduti, controllo della cute dopo l'allenamento, attenzione agli sfregamenti causati da bande o cinghie.
5. **Ipotensione ortostatica e risposta cardiovascolare attenuata** (`warning`): nelle lesioni alte la FC massima può essere limitata (fino a circa 120 bpm nelle tetraplegie), quindi **la FC non è un indicatore affidabile di intensità**: usare Borg e il talk test.
6. **Monitoraggio pre-programma** (`advice`): istruire a monitorare temperatura e pressione arteriosa e a riconoscere i sintomi di disreflessia autonomica.

**Filtro per il profilo "seduto o carrozzina"**
- Escludere `category` in `["plyometrics","strongman","olympic weightlifting","powerlifting"]`.
- Escludere per posizione: `standing, walking, running, treadmill, jogging, squat, lunge, step-up, step mill, stairmaster, elliptical, calf raise, jump, hop, bound, sprint, skating, bicycling, plank, bear crawl, sled, farmer, yoke, kneeling, lying, prone, supine, floor, bench press, deadlift, good morning, hyperextension, leg press, leg curl, leg extension`.
- Escludere per rischio di spalla: `behind neck, behind the neck, upright row, dip, dips, pull-up, chin-up, handstand, muscle up, snatch, jerk, clean`.
- Avvisare su: `overhead, military, shoulder press, arnold, lateral raise, front raise, shrug, pullover, internal rotation`.
- Preferire `equipment` in `["bands","cable","dumbbell","machine"]` e keyword: `seated, cable row, band pull apart, face pull, external rotation, pallof press, reverse flye, rear delt, lat pulldown, scapular, curl, triceps, wrist, chest press`.

> **Nota di implementazione importante**: il filtro per esclusione è insufficiente. Nel dataset `seated` compare in 42 nomi, ma molti altri esercizi sono eseguibili da seduti pur non avendo la parola nel nome (`Cable Rows`, `Lateral Raise - With Bands`). La soluzione corretta è una **whitelist positiva** costruita su `prefer_keywords` più `prefer_equipment`, marcando il resto come "non verificato". Il vero rimedio strutturale è l'attributo `seated_executable` (vedi 4.6). Prevedere inoltre un sottoprofilo "seduto con funzione parziale agli arti inferiori", per non escludere `Hip Flexion with Band` e `Hip Extension with Bands`, che possono essere utili.

### 6.3 Mobilità ridotta, deambulatore o bastone

**Principi**: esercizi in piedi **con appoggio** (sedia robusta, piano di lavoro, spalliera, muro). L'appoggio è una progressione, non una rinuncia: si passa da due mani, a una mano, a un dito, a nessun appoggio. Il **sit-to-stand** è il gesto cardine: sostituisce lo squat, è funzionale e misurabile (ripetizioni in 30 secondi).

**Programma di riferimento: Otago Exercise Programme**. 17 esercizi di forza ed equilibrio più un programma di camminata fino a 30 minuti, **3 volte a settimana**, con riduzione delle cadute del **35-40%** negli anziani fragili. Componente di equilibrio: tandem stance e tandem walking, appoggio monopodalico, camminata laterale e all'indietro, salita e discesa da un gradino, con progressione graduale della sfida posturale.

**Regole per l'app**: bloccare tutto ciò che è pliometrico, esplosivo, su superfici instabili (bosu, tavolette) o che richiede di scendere a terra e rialzarsi senza supporto; avvisare su esercizi monopodalici, affondi camminati e qualunque esercizio a occhi chiusi; consigliare calzature adeguate, spazio libero, sedia sempre a portata di mano e presenza di un'altra persona nelle prime sessioni.

**Filtro per il profilo "mobilità ridotta"**
- Escludere `category` in `["plyometrics","olympic weightlifting","strongman"]`.
- Escludere: `jump, hop, bound, sprint, burpee, plyo, depth, box jump, skating, bicycling, trail running, rope jumping, bosu, balance board, exercise ball, single-leg, single leg, one leg, pistol, muscle up, handstand, snatch, clean, jerk, turkish get-up, kneeling, prone, lying, floor`.
- Avvisare su: `lunge, step-up, deadlift, squat, calf raise, walking lunge, overhead`.
- Flag `require_support`: `squat, lunge, calf raise, step-up, hip extension, hip flexion, monster walk` non vanno esclusi, ma accompagnati dalla nota "esegui con appoggio a una sedia stabile o al piano di lavoro" e dalla progressione due mani → una mano → nessun appoggio.
- Preferire: `Chair Squat`, `Walking, Treadmill`, `Bicycling, Stationary`, `Elliptical Trainer`, `Seated Cable Rows`, `Shoulder Press - With Bands`, `Calf Raises - With Bands`, `Band Pull Apart`, `Face Pull`, `Chair Lower Back Stretch`, `Chair Upper Body Stretch`, `Chair Leg Extended Stretch`, `Standing Pelvic Tilt`, `Monster Walk`, `Hip Extension with Bands`, `Hip Flexion with Band`, `Band Hip Adductions`.

### 6.4 Sostituzioni esercizio per esercizio

Criterio: mantenere il **pattern di movimento** e il **gruppo muscolare**, cambiando posizione, base d'appoggio, attrezzo e range.

| Esercizio originale | Da seduti (sedia o carrozzina) | Con mobilità ridotta in piedi |
|---|---|---|
| Barbell Squat / Bodyweight Squat | Leg extension seduta con banda; spinta bilaterale con banda sotto i piedi | **Chair Squat / sit-to-stand** con o senza appoggio |
| Deadlift | Seated row con banda o cavo (l'hip hinge non è applicabile) | Hip hinge parziale con appoggio al piano; stacco leggero da rialzo |
| Lunge | Non applicabile: sostituire con lavoro unilaterale di braccia o leg press assistita | Split stance statico con appoggio alla sedia; step laterale con appoggio |
| Overhead Press / Military Press | **Seated press con bande** a resistenza bassa, presa neutra, senza intrarotazione sopra la spalla; se doloroso, alzata frontale fino a 90° | Shoulder press seduto con schienale |
| Bench Press | Chest press con banda ancorata dietro lo schienale; cable chest press seduto | Incline chest press o push-up al muro |
| Push-up a terra | Push-up al piano o alla parete, o push sui braccioli | `Incline Push-Up`, progressivamente più basso |
| Pull-up | Lat pulldown con cavo o banda ancorata in alto; seated row | Banded pulldown in piedi con appoggio |
| Plank | Anti-rotazione seduta (`Pallof Press`), respirazione con attivazione del trasverso | Plank al muro o su piano inclinato |
| Running / Rope Jumping | Arm crank, handbike, circuiti a bande a ritmo continuo | Camminata, marcia sul posto con appoggio, cyclette, recumbent bike |
| Calf raise | Non applicabile: sostituire con lavoro di presa e avambraccio | Calf raise con due mani sull'appoggio |
| Farmer's Walk | Hold isometrico seduto con manubri, presa e stabilità scapolare | Carry brevi con appoggio, o statico |
| Russian Twist | Anti-rotazione statica con banda | Anti-rotazione in piedi con appoggio |

### 6.5 Due regole di runtime che valgono più di qualunque blacklist

1. **Schermata red flag sempre raggiungibile in un tap** durante la sessione, con i segnali di stop della sezione 5.1, i red flag della gravidanza (3.19) e i segni di disreflessia autonomica per le lesioni midollari sopra T6.
2. **Criterio sintomo-guidato**: qualunque esercizio, anche in whitelist, si interrompe se compaiono doming sulla linea mediana, pesantezza o bulging vaginale, perdite di urina, dolore acuto, capogiro o instabilità. È il criterio realmente usato in clinica e rende il sistema robusto anche dove il filtro su stringa fallisce.

**Fonti accessibilità**: WHO 2020 Guidelines https://www.ncbi.nlm.nih.gov/books/NBK566046/ · Martin Ginis et al., Spinal Cord 2018 https://www.nature.com/articles/s41393-017-0017-3 · PVA, Preservation of Upper Limb Function Following SCI https://pva.org/wp-content/uploads/2021/09/cpg_upperlimb.pdf · StatPearls, Autonomic Dysreflexia https://www.ncbi.nlm.nih.gov/books/NBK482434/ · termoregolazione nella lesione midollare https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8049141/ · Otago Exercise Programme https://www.med.unc.edu/aging/cgwep/courses/otago-exercise-program/ · ACSM/NCHPAD Inclusive Fitness Specialist https://acsm.org/certification/specialized/inclusive-fitness-specialist-certificate/ · NCHPAD, Upper Body Workout for Wheelchair Users https://www.nchpad.org/resources/upper-body-workout-for-wheelchair-users-seated-strength-training/

---

## 7. Bibliografia e fonti

### Screening ed epidemiologia dell'attività fisica
- PAR-Q+ 2024, PAR-Q+ Collaboration: https://eparmedx.com/wp-content/uploads/2023/12/PARQPlus2024Fillable.pdf · https://eparmedx.com/par-q/
- ePARmed-X+: https://eparmedx.com/
- Riebe D. et al., *Updating ACSM's Recommendations for Exercise Preparticipation Health Screening*, Med Sci Sports Exerc 2015: https://pubmed.ncbi.nlm.nih.gov/26473759/
- ACSM's Guidelines for Exercise Testing and Prescription: https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription/
- ACSM / Exercise is Medicine: https://acsm.org/EIM
- Applying the ACSM Preparticipation Screening Algorithm to U.S. adults (NHANES): https://pmc.ncbi.nlm.nih.gov/articles/PMC7059860/
- WHO 2020 Guidelines on Physical Activity and Sedentary Behaviour: https://www.ncbi.nlm.nih.gov/books/NBK566046/ · https://pubmed.ncbi.nlm.nih.gov/33239350/ · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7719906/
- Ministero della Salute, Linee di indirizzo sull'attività fisica 2021: https://www.salute.gov.it/new/it/tema/attivita-fisica/linee-di-indirizzo-sullattivita-fisica/ · PDF: https://www.aiom.it/wp-content/uploads/2022/01/2021_MinSal_LineeIndirAttFis.pdf · EpiCentro ISS: https://www.epicentro.iss.it/attivita_fisica/linee-indirizzo-2021

### Quadro normativo
- Regolamento (UE) 2017/745 (MDR), testo IT: https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32017R0745
- MDCG 2019-11 rev. 1 (giugno 2025), qualifica e classificazione del software: https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
- Manual on borderline and classification under MDR/IVDR: https://health.ec.europa.eu/system/files/2023-09/md_borderline_manual_en.pdf
- D.lgs. 5 agosto 2022, n. 137 (sanzioni MDR): https://www.certifico.com/marcatura-ce/direttive-nuovo-approccio/regolamento-dispositivi-medici/decreto-legislativo-5-agosto-2022-n-137
- Regolamento (UE) 2016/679 (GDPR), testo IT: https://eur-lex.europa.eu/legal-content/IT/TXT/PDF/?uri=CELEX:32016R0679
- WP29, health data in apps and devices (Allegato, 5 febbraio 2015): https://ec.europa.eu/justice/article-29/documentation/other-document/files/2015/20150205_letter_art29wp_ec_health_data_after_plenary_annex_en.pdf
- EDPB, Guidelines 05/2020 on consent: https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf
- Garante privacy, Provv. n. 55 del 7 marzo 2019 (doc. web 9091942): https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9091942
- Garante privacy, Provv. n. 467 dell'11 ottobre 2018, elenco DPIA (doc. web 9058979): https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9058979
- Garante privacy, Linee guida cookie 2021 (doc. web 9677876): https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876
- Garante privacy, Fitness Tracker: https://www.garanteprivacy.it/fitness-tracker
- Art. 348 c.p.: https://www.brocardi.it/codice-penale/libro-secondo/titolo-ii/capo-ii/art348.html
- D.lgs. 36/2021, art. 41 (chinesiologo): https://www.poliziadistato.it/statics/25/d.lgs.-28-febbraio-2021--n.-36.pdf
- Art. 33 Codice del consumo (clausole vessatorie): https://www.brocardi.it/codice-del-consumo/parte-iii/titolo-i/art33.html

### Rachide
- JOSPT, Low Back Pain CPG Revision 2021: https://www.jospt.org/doi/10.2519/jospt.2021.0304
- NICE NG59: https://www.nice.org.uk/guidance/ng59/chapter/recommendations
- Wilke et al., pressioni intradiscali in vivo, Spine 1999: https://pubmed.ncbi.nlm.nih.gov/10222525/
- JOSPT, Neck Pain CPG Revision 2017: https://www.jospt.org/doi/10.2519/jospt.2017.0302
- Deep cervical flexor training, systematic review: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6263552/
- 2016 SOSORT guidelines (scoliosi): https://link.springer.com/article/10.1186/s13013-017-0145-8
- Red flag lombari: https://www.consultant360.com/peer-reviewed/revisiting-red-flags-acute-low-back-pain · https://www.acep.org/sportsmedicine/newsroom/newsroom-articles/august2022/re-evaluating-red-flags-for-back-pain

### Arto superiore
- Upright Row e impingement subacromiale, NSCA SCJ 2011: https://journals.lww.com/nsca-scj/fulltext/2011/10000/the_upright_row__implications_for_preventing.2.aspx
- Empty can contro full can, JSES: https://www.jshoulderelbow.org/article/S1058-2746(15)00483-8/abstract
- Rotator Cuff Tendinopathy, JOSPT 2015: https://www.jospt.org/doi/10.2519/jospt.2015.5941
- Traumatic Anterior Shoulder Instability, rehabilitation: https://pmc.ncbi.nlm.nih.gov/articles/PMC5685970/
- JOSPT, Lateral Elbow Pain CPG 2022: https://www.jospt.org/doi/10.2519/jospt.2022.0302
- JOSPT, Carpal Tunnel Syndrome CPG 2019: https://www.jospt.org/doi/10.2519/jospt.2019.0301 · Revision 2026: https://www.jospt.org/doi/10.2519/jospt.2026.0301

### Arto inferiore
- JOSPT, Patellofemoral Pain CPG 2019: https://www.jospt.org/doi/10.2519/jospt.2019.0302
- ESSKA-AOSSM-AASPT Meniscus Rehabilitation Consensus 2024: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12310086/ · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12310080/
- Catena aperta dopo ricostruzione LCA, IJSPT: https://ijspt.scholasticahq.com/article/18983-considerations-with-open-kinetic-chain-knee-extension-exercise-following-acl-reconstruction
- Criteri di ritorno allo sport dopo LCA: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6267144/
- JOSPT, Lateral Ankle Ligament Sprains CPG Revision 2021: https://www.jospt.org/doi/10.2519/jospt.2021.0302

### Cardiometabolico e respiratorio
- AHA, Resistance Exercise in Individuals With and Without Cardiovascular Disease: https://www.ahajournals.org/doi/10.1161/01.cir.101.7.828 · 2023 Update: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001189
- ACSM, Exercise and Hypertension: https://acsm.org/exercise-hypertension/ · https://acsm.org/hot-topic-exercise-hypertension-identification/
- Isometric handgrip training e pressione: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5207598/
- 2020 ESC Guidelines on sports cardiology: https://academic.oup.com/eurheartj/article/42/1/17/5898937
- Prescrizione dell'esercizio in coronaropatia: https://pmc.ncbi.nlm.nih.gov/articles/PMC6124989/
- ADA, Physical Activity/Exercise and Diabetes Position Statement: https://diabetesjournals.org/care/article/39/11/2065/37249/Physical-Activity-Exercise-and-Diabetes-A-Position
- ADA, Standards of Care: https://diabetesjournals.org/care/article/49/Supplement_1/S50/163924/3-Prevention-or-Delay-of-Diabetes-and-Associated
- Riddell et al., exercise management in type 1 diabetes, Lancet Diabetes Endocrinol 2017: https://www.thelancet.com/article/S2213-8587(17)30014-1/fulltext
- ATS Clinical Practice Guideline, Exercise-induced Bronchoconstriction: https://academic.oup.com/ajrccm/article/187/9/1016/8510121
- ACSM Position Stand, Exercise and Fluid Replacement: https://pubmed.ncbi.nlm.nih.gov/9303999/
- Tecniche respiratorie e risposta pressoria: https://pmc.ncbi.nlm.nih.gov/articles/PMC1478931/
- Esercizio e obesità con limitazioni fisiche: https://pmc.ncbi.nlm.nih.gov/articles/PMC13261380/
- Insufficienza venosa cronica e pompa del polpaccio: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8147883/
- ILAE Task Force on Sports and Epilepsy: https://pubmed.ncbi.nlm.nih.gov/26662920/

### Osso, articolazione, popolazioni speciali
- Sinaki e Mikkelsen 1984, flessione contro estensione nell'osteoporosi spinale: https://read.qxmd.com/read/6487063/postmenopausal-spinal-osteoporosis-flexion-versus-extension-exercises
- Strong, Steady and Straight, UK consensus, BJSM 2022: https://pubmed.ncbi.nlm.nih.gov/35577538/
- Too Fit To Fracture, Osteoporos Int 2014: https://link.springer.com/10.1007/s00198-014-2881-4
- LIFTMOR RCT, J Bone Miner Res 2018: https://pubmed.ncbi.nlm.nih.gov/28975661/
- 2019 ACR / Arthritis Foundation Guideline: https://pubmed.ncbi.nlm.nih.gov/31908149/
- OARSI 2019: https://www.oarsijournal.com/article/S1063-4584(19)31116-1/fulltext
- EULAR, physical activity in inflammatory arthritis and osteoarthritis 2018: https://ard.eular.org/article/S0003-4967(24)02411-7/abstract · 2025 update: https://ard.eular.org/article/S0003-4967(26)00150-0/fulltext
- GLA:D: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5297181/
- SARAH trial (mano reumatoide), Lancet 2015: https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(14)60998-3/fulltext
- Instabilità atlanto-assiale in artrite reumatoide: https://pmc.ncbi.nlm.nih.gov/articles/PMC8081325/ · isometrici del collo: https://pubmed.ncbi.nlm.nih.gov/18609259/
- ACOG Committee Opinion 804: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period
- 2019 Canadian Guideline for Physical Activity throughout Pregnancy, BJSM: https://bjsm.bmj.com/content/52/21/1339
- Aortocaval Compression Syndrome, StatPearls: https://www.ncbi.nlm.nih.gov/books/NBK430759/
- Goom, Donnelly, Brockwell 2019, Returning to running postnatal: https://absolute.physio/wp-content/uploads/2019/09/returning-to-running-postnatal-guidelines.pdf
- Gluppe, Engh, Bø 2021, diastasi dei retti: https://pubmed.ncbi.nlm.nih.gov/34391661/
- NSCA, Resistance Training for Older Adults Position Statement: https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf
- ESPEN, apporto proteico ed esercizio nell'anziano: https://www.espen.org/files/PIIS0261561414001113.pdf
- Silbernagel et al., pain-monitoring model, Am J Sports Med 2007: https://journals.sagepub.com/doi/abs/10.1177/0363546506298279
- DOMS, Cleveland Clinic: https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness

### Accessibilità
- Martin Ginis et al., exercise guidelines for adults with spinal cord injury, Spinal Cord 2018: https://www.nature.com/articles/s41393-017-0017-3
- PVA, Preservation of Upper Limb Function Following SCI: https://pva.org/wp-content/uploads/2021/09/cpg_upperlimb.pdf
- StatPearls, Autonomic Dysreflexia: https://www.ncbi.nlm.nih.gov/books/NBK482434/
- Termoregolazione e strategie di raffreddamento nella lesione midollare: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8049141/
- Otago Exercise Programme: https://www.med.unc.edu/aging/cgwep/courses/otago-exercise-program/
- CDC STEADI: https://www.cdc.gov/steadi/
- ACSM/NCHPAD Inclusive Fitness Specialist: https://acsm.org/certification/specialized/inclusive-fitness-specialist-certificate/

---

*Documento redatto come base di progettazione tecnica. Non sostituisce la valutazione medica individuale né un parere legale. Da validare con un medico dello sport e con un avvocato prima del rilascio in produzione.*
