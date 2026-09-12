# ADR 0004: Filtri sanitari risolti a tempo di build

- **Stato**: accettata
- **Data**: 12 settembre 2026

## Contesto

L'onboarding chiede all'utente se ha condizioni di salute rilevanti, e il motore
deve escludere gli esercizi comunemente sconsigliati. La ricerca clinica in
`docs/research/03-salute-sicurezza.md` copre 32 condizioni, dall'ernia del disco
alla gravidanza per trimestre, e fornisce le regole in
`docs/research/03-regole-condizioni.json`.

Le regole sono espresse in modo eterogeneo: categorie di esercizio, attrezzi,
muscoli primari, pattern di movimento, parole chiave nel nome e liste esplicite
di identificativi.

## Il problema delle parole chiave

La prima versione applicava espressioni regolari sui nomi a runtime. Sbagliava,
e in modo non evidente. Un esempio trovato dai test: la parola `run` usata per
individuare gli esercizi ad alto impatto colpisce anche **C-r-u-n-ch**, quindi il
crunch inverso risultava ad alto impatto e veniva prescritto con tre ripetizioni.

La ricerca clinica documenta la stessa classe di errori in una sezione dedicata:
`dead` colpisce "Dead Bug", `bridge` colpisce "Glute Bridge", `row` colpisce
"Seated Cable Rows", `press` colpisce "Leg Press", `raise` colpisce "Calf Raise".

## Decisione

**Le regole vengono risolte in liste esplicite di esercizi durante la build**,
con `tools/build-conditions.mjs`, non a runtime.

Lo script legge le regole cliniche e il catalogo, applica i criteri (categorie,
attrezzi, muscoli, pattern, parole chiave con le rispettive eccezioni, blacklist
esplicite), risolve l'ereditarieta' fra condizioni (il diabete di tipo 2 eredita
dal tipo 1, il terzo trimestre dal secondo) e produce per ogni condizione due
liste: esercizi esclusi ed esercizi da eseguire con cautela.

Gli identificativi vengono memorizzati come **indici nel catalogo ordinato**:
stessa informazione in un quinto dello spazio (81 KB invece di 224 KB).

A runtime lo screening e' una ricerca in un insieme di numeri interi.

## Conseguenze

**Positive**

- Nessun falso positivo a runtime: cio' che viene escluso e' stato deciso una volta e si puo' leggere.
- Verificabile: lo script stampa quanti esercizi esclude ogni condizione, e un numero fuori scala salta all'occhio subito.
- Veloce: nessuna espressione regolare valutata mentre l'utente scorre il catalogo.
- Testabile: la suite verifica che con l'ernia lombare non compaiano stacchi, good morning, sit-up o russian twist.

**Negative**

- Aggiungere un esercizio al catalogo richiede di rigenerare le regole. E' un comando solo, ed e' parte di `npm run data:all`.
- Le liste sono opache: per capire perche' un esercizio e' escluso bisogna leggere la ricerca. Per questo ogni esclusione porta con se' il nome della condizione, mostrato all'utente.

## Nota importante sul perimetro

L'esempio MDCG 2019-11 rev.1 qualifica come dispositivo medico un software che
raccomanda esercizi personalizzati **per alleviare il dolore** di una patologia
muscoloscheletrica. Tempra resta deliberatamente fuori da quel perimetro:

- non promette benefici terapeutici e non nomina la cura di alcuna patologia;
- usa le condizioni dichiarate solo per **togliere** esercizi, mai per proporne come rimedio;
- ripete in modo esplicito, nell'onboarding e nelle impostazioni, di non essere un dispositivo medico e di non sostituire il parere di un professionista sanitario;
- quando una condizione lo richiede, dice chiaramente di sentire prima un medico.

Questo vincolo si riflette anche nel testo dell'interfaccia: si scrive
"adattiamo la scheda", mai "questo esercizio ti fa male" o "questo ti cura".
