# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Per ora un solo utente: il proprietario del progetto, che si allena in palestra. Altri utenti
potrebbero arrivare in futuro, ma non sono un requisito attuale.

- Sul telefono, in palestra: una mano, tra una serie e l'altra, spesso senza rete. È l'uso principale.
- Su desktop e tablet: costruisce e modifica le schede e guarda le statistiche. Non si allena da
  desktop e non usa il desktop per consultare il catalogo.

## Product Purpose

Tempra genera o lascia comporre schede di allenamento su un catalogo di 876 esercizi in italiano,
guida la seduta un esercizio e una serie alla volta (cronometro, recupero, superset) e mostra i
progressi. Successo: allenarsi senza attrito dal telefono e ritrovare tutto allineato su ogni
dispositivo.

## Positioning

Local-first e senza account: i dati vivono sul dispositivo, la sincronizzazione fra dispositivi è
facoltativa e usa un codice condiviso. Le condizioni di salute non lasciano mai il dispositivo.

## Operating Context

Palestra con luce variabile, telefono in mano o appoggiato a circa un metro, connessione assente o
scarsa. PWA installata nella schermata home su più dispositivi; desktop usato per pianificare.

## Capabilities and Constraints

- PWA React + Vite, IndexedDB come fonte di verità, funzionamento completo offline.
- Timer basati sull'orologio, mai sui tick; lo stato dell'allenamento vive nei dati della sessione.
- Filtri sanitari risolti a build time.
- Interfaccia e testi in italiano. Mai il trattino lungo em-dash in nessun testo.
- Aggiornamenti automatici della PWA, mai durante un allenamento in corso.

## Brand Commitments

Nome Tempra. Identità esistente da evolvere, non da sostituire: tema scuro predefinito con tema
chiaro, accento arancione, Inter. Confermato dall'utente il 25 ottobre 2026.

## Evidence on Hand

Catalogo esercizi da free-exercise-db (pubblico dominio) con due foto per esercizio in
`apps/web/public/img/ex/`. Ricerche in `docs/research/`. Nessuna testimonianza o dato d'uso: non
vanno inventati.

## Product Principles

1. In palestra conta il prossimo tocco: numeri grandi, comandi primari a portata di pollice, niente
   da leggere che non serva in quel momento.
2. Nessun dato perso: ogni azione si salva subito e sopravvive a ricaricamenti e app sospese.
3. Lo schermo grande serve a pianificare: più informazione a colpo d'occhio, non lo stesso telefono
   ingrandito.
4. Onestà sui numeri: stime (calorie, massimale) dichiarate come stime.

## Accessibility & Inclusion

WCAG 2.1 AA verificato in CI con axe su tutte le schermate, in entrambi i temi e a due larghezze.
Il colore non porta mai da solo un'informazione. Rispetto di `prefers-reduced-motion`.
