# ADR 0002: Architettura local-first

- **Stato**: accettata
- **Data**: 12 settembre 2026

## Contesto

Durante un allenamento l'utente scrive di continuo: pesi, ripetizioni, spunte di
completamento. Ogni scrittura e' piccola, frequente e va conservata subito.
Il contesto d'uso e' ostile: una mano occupata, sudore sullo schermo, telefono
che si blocca, connessione assente, applicazione che passa in secondo piano.

Nelle recensioni delle app concorrenti la perdita di dati a meta' allenamento
compare con una frequenza allarmante, fino a un utente che dichiara di perdere
"il cinquanta per cento degli allenamenti".

## Decisione

**IndexedDB e' la fonte di verita'.** Non una cache, non una copia: l'originale.
Il server, quando c'e', contiene una copia.

Regole che ne discendono, applicate in tutto il codice:

1. **Nessun pulsante Salva.** Ogni modifica viene scritta immediatamente
   (`saveSession` viene invocata a ogni carattere digitato e a ogni spunta).
   Un pulsante Salva e' un invito a perdere dati.

2. **La sessione in corso viene ripresa.** All'avvio, se esiste una sessione con
   stato `active`, la home la propone e l'app la ricarica esattamente com'era.

3. **Il timer di recupero non dipende dai tick.** Il tempo residuo si calcola
   sempre come differenza fra l'istante di fine e l'orologio di sistema. Un
   timer costruito accumulando `setInterval` si ferma quando il browser sospende
   la scheda, ed e' la seconda lamentela piu' frequente nelle recensioni. Lo
   stato del timer viene inoltre salvato in `sessionStorage`, cosi' un
   ricaricamento accidentale non azzera il recupero.

4. **Lo schermo resta acceso.** Wake Lock API durante l'allenamento, riacquisita
   automaticamente quando l'app torna in primo piano, perche' il sistema la
   rilascia ogni volta che si passa in secondo piano.

5. **Precompilazione dai dati precedenti.** All'avvio di una sessione ogni serie
   arriva gia' compilata con il carico dell'ultima volta. Ripetere la stessa
   serie costa un solo tocco.

## Conseguenze

- Il modello di dominio vive nel client (`packages/core`), non nel database del server.
- Il server non ha bisogno di conoscere la forma dei documenti (vedi ADR 0005).
- I dati di salute dichiarati nell'onboarding non lasciano il dispositivo se l'utente non attiva esplicitamente la sincronizzazione. Non e' un effetto collaterale: e' una conseguenza voluta dell'architettura, e semplifica molto la posizione rispetto all'articolo 9 del GDPR.
- Serve una via di uscita: esportazione e importazione in JSON sono funzioni di prima classe nelle impostazioni, non un ripensamento.
