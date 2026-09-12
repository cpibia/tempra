# ADR 0005: Sincronizzazione opzionale, documenti opachi, vince l'ultima scrittura

- **Stato**: accettata
- **Data**: 12 settembre 2026

## Contesto

L'applicazione e' local-first (ADR 0002), ma due esigenze reali restano scoperte:
un backup che sopravviva alla cancellazione dei dati del browser, e ritrovare i
propri allenamenti su un secondo dispositivo.

## Decisione

### La sincronizzazione e' facoltativa

Senza `VITE_API_URL` configurata, l'interfaccia dice chiaramente che la
sincronizzazione non e' attiva e propone il backup manuale. Nessuna funzione
dell'applicazione viene meno.

### Il server non conosce il dominio

Una sola tabella `documents`: identificativo generato dal client, tipo, contenuto
JSON opaco, data di modifica, data di cancellazione, data di scrittura sul server.

Il server non convalida la forma di una scheda, non sa cosa sia una serie, non
interpreta mai il contenuto. Il vantaggio: una nuova versione del client puo'
cambiare la struttura dei dati senza una migrazione lato server. In una
applicazione local-first e' il client a possedere lo schema.

### Vince la scrittura piu' recente

In caso di conflitto vince il documento con `updatedAt` piu' recente. La
condizione e' applicata nel `where` della `onConflictDoUpdate`, quindi la
decisione la prende il database in modo atomico, non il codice applicativo.

E' la scelta corretta per questo dominio: i documenti sono piccoli, appartengono
a una sola persona, e vengono modificati da un dispositivo alla volta. Una fusione
a tre vie o le strutture CRDT costerebbero molta complessita' per risolvere un
conflitto che in pratica non si verifica: nessuno si allena su due telefoni
contemporaneamente.

### Ordine: prima si invia, poi si scarica

Cosi' una modifica appena fatta sul dispositivo non viene sovrascritta da una
copia del server piu' vecchia.

### Il cursore e' l'orologio del server

La sincronizzazione incrementale usa `syncedAt`, assegnato dal server, non
`updatedAt`, dichiarato dal client. Usare l'orologio del dispositivo farebbe
perdere modifiche a chi ha l'ora sbagliata, e capita piu' spesso di quanto sembri.

## Eccezioni deliberate

- **La sessione in corso non si sincronizza.** Un allenamento aperto e' un oggetto in mutazione continua: si invia solo quando e' chiuso.
- **Le impostazioni vengono accettate dal server solo se in locale non esistono.** Tema e unita' di misura sono preferenze del dispositivo: sincronizzarle significherebbe ribaltare il tema di un telefono perche' sul tablet e' diverso.
- **I record personali non vengono mai sovrascritti**, solo aggiunti: un primato e' un fatto avvenuto, non uno stato.

## Conseguenze

- Il server e' piccolo e non ha quasi nulla da mantenere: due tabelle di dati e due di supporto.
- Chi si autoospita puo' chiudere le registrazioni dopo aver creato il proprio account, con `REGISTRATION_OPEN=false`.
- I dati di salute finiscono sul server solo se l'utente crea un account: e' una scelta consapevole, non un valore predefinito.
