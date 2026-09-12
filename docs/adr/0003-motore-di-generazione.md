# ADR 0003: Come funziona il motore di generazione delle schede

- **Stato**: accettata
- **Data**: 12 settembre 2026

## Contesto

L'applicazione deve produrre una scheda credibile a partire da poche risposte:
obiettivo, luogo, attrezzatura, giorni disponibili, durata della seduta, livello,
condizioni di salute. "Credibile" significa che un istruttore, guardandola, non
deve storcere il naso.

La ricerca alla base e' in `docs/research/01-scienza-allenamento.md`: linee guida
ACSM e NSCA, meta analisi su volume, prossimita' al cedimento e tempi di recupero,
modello dei landmark di volume MEV, MAV e MRV.

## Decisione

Il motore e' **deterministico e spiegabile**. Nessun modello statistico, nessuna
chiamata a servizi esterni: una catena di regole numeriche, ognuna con una fonte,
che produce anche il proprio elenco di motivazioni in italiano, mostrato
all'utente prima che accetti la scheda.

### La catena

1. **Scelta dello split** in funzione dei giorni disponibili, del livello e
   dell'obiettivo. Due giorni: total body A e B. Tre: total body A, B e C.
   Quattro: parte alta e parte bassa. Cinque e sei: spinta, trazione, gambe.
   Il "bro split" esiste ma non viene mai proposto da solo: a parita' di volume
   non e' superiore e concentra troppo lavoro in una sola seduta.

2. **Volume settimanale per gruppo muscolare**, partendo dal limite basso della
   zona MAV, moltiplicato per un coefficiente legato all'obiettivo (ipertrofia
   1,00; forza 0,80; salute 0,55; resistenza 1,15) e per un fattore di recupero
   che tiene conto di eta' e condizioni dichiarate.

3. **Riempimento degli slot.** Ogni seduta e' una sequenza di posizioni con un
   ruolo (fondamentale, secondario, complementare, isolamento, core) e un
   bersaglio. Un punteggio sceglie l'esercizio migliore fra quelli ammessi,
   tenendo conto di pattern di movimento, attrezzatura, livello, disponibilita'
   di immagini e di quanto e' gia' stato usato altrove nella scheda.

4. **Ripartizione delle serie**: il volume settimanale del gruppo diviso per la
   frequenza con cui quel gruppo compare nello split, distribuito fra gli
   esercizi in proporzione al ruolo, con un tetto per seduta (6 serie per un
   principiante, 9 per un intermedio, 12 per un avanzato).

5. **Prescrizione**: intervallo di ripetizioni e ripetizioni di riserva dalla
   matrice obiettivo per ruolo; pausa calcolata con una formula deterministica.

6. **Adattamento sanitario**: i vincoli delle condizioni dichiarate allungano le
   pause, alzano le ripetizioni minime e allontanano il lavoro dal cedimento.

7. **Adattamento al tempo disponibile**, in tre passi progressivi: prima si
   accorciano le pause degli esercizi complementari, poi si tolgono serie
   partendo dal fondo, infine si rimuovono esercizi. I fondamentali cedono per
   ultimi.

### La formula della pausa

```
pausa = BASE[obiettivo] x K_esercizio x K_intensita x K_sforzo x K_livello
```

arrotondata a multipli di quindici secondi e limitata fra un minimo e un massimo
per obiettivo. `K_esercizio` vale 1,40 per un multiarticolare con carico assiale
(squat, stacco), 1,20 per un multiarticolare libero, 1,00 su macchina, 0,75 per
un isolamento, 0,60 per il core.

Il valore prodotto e' **sempre e solo una proposta**: la interfaccia lo presenta
come modificabile, con un collegamento per tornare al valore consigliato. Il
requisito iniziale chiedeva esattamente questo: proporre la pausa in base a
carico e tempo, poi lasciar scegliere.

## Perche' deterministico

- **Si puo' testare.** La suite copre 360 combinazioni di obiettivo, luogo, livello e giorni, e verifica invarianti reali: nessun esercizio ripetuto nella stessa seduta, attrezzatura sempre disponibile, durata entro il tempo dichiarato, volume sopra il minimo efficace sui grandi distretti.
- **Si puo' spiegare.** Ogni scheda porta con se' l'elenco delle scelte fatte e degli esercizi esclusi, con il motivo.
- **Si puo' correggere.** Quando una regola sbaglia, si cambia un numero in una tabella e si vede subito l'effetto.
- **Non richiede rete.** Coerente con l'ADR 0002.

## Conseguenze

- Le schede sono buone e prudenti, non geniali. Per un utente amatoriale e' il compromesso giusto.
- La varieta' arriva da un generatore pseudocasuale con seme: a parita' di seme la scheda e' identica, e il pulsante "un'altra proposta" cambia seme.
- Il motore vive in `packages/core`, senza alcuna dipendenza dalla interfaccia: e' testabile da riga di comando e riutilizzabile.
