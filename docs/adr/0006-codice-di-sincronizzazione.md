# ADR 0006: Codice di sincronizzazione al posto di email e password

- **Stato**: accettata, modifica l'ADR 0005 solo per l'accesso
- **Data**: 25 ottobre 2026

## Contesto

La sincronizzazione dell'ADR 0005 richiedeva un account con email e password.
L'email non veniva mai usata: niente verifica, niente recupero della password,
nessun invio. Era un nome utente da ricordare, con una password da inventare,
per un'app che una persona usa da sola su due o tre dispositivi. Nella pratica
la sincronizzazione restava spenta.

## Decisione

Il primo dispositivo crea un **codice di otto caratteri**; gli altri lo
inseriscono e ricevono gli stessi dati.

- Alfabeto senza 0/O e 1/I/L, perche' il codice si ricopia a mano su un
  telefono. Con 31 simboli e 8 posizioni le combinazioni sono circa 8,5 * 10^11.
- Il server conserva solo l'impronta SHA-256 del codice. Insieme al limite di 10
  tentativi ogni 15 minuti per indirizzo, indovinare un codice non e' praticabile.
- La creazione di nuovi codici e' limitata a 5 all'ora per indirizzo e si chiude
  con `REGISTRATION_OPEN=false`; i codici esistenti continuano a funzionare.
- Il codice resta nel dispositivo. Se il token di rinnovo scade (un dispositivo
  rimasto spento per mesi) il client rientra da solo con il codice, invece di
  interrompere la sincronizzazione in silenzio.
- Chi si collega a un codice esistente scarica prima, con precedenza ai dati del
  server, poi invia quello che aveva solo in locale: un profilo appena compilato
  sul telefono non sostituisce quello di sempre.
- La sincronizzazione parte da sola: all'avvio, dopo ogni modifica locale (con
  quattro secondi di attesa per raggruppare le scritture), al ritorno in primo
  piano e al ritorno della rete.

Le colonne `email` e `password_hash` restano nella tabella `users`, facoltative,
per non dover riscrivere righe gia' presenti. Le rotte di registrazione e accesso
con email sono state rimosse.

## Conseguenze

- Chi conosce il codice vede i dati: va trattato come una password, e
  l'interfaccia lo dice.
- Le condizioni di salute continuano a non lasciare il dispositivo.
- "Elimina i dati dal server" cancella l'utente e quindi invalida il codice su
  tutti i dispositivi; i dati locali restano.
