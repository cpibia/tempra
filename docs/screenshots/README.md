# Schermate

Catturate automaticamente con Playwright sulla build di produzione, a 412 pixel
di larghezza. Per rigenerarle:

```bash
cd apps/web
npx playwright test e2e/screenshots.spec.ts --project=mobile --workers=1
```

| File | Cosa mostra |
|---|---|
| `00-home.png` | Home in tema scuro: aderenza settimanale e prossimo allenamento |
| `01-onboarding.png` | Prima schermata, con il disclaimer sanitario |
| `02-obiettivo.png` | Scelta dell'obiettivo |
| `03-salute.png` | Selezione delle condizioni di salute |
| `04-scheda.png` | Scheda generata, con i giorni e gli esercizi |
| `05-allenamento.png` | Allenamento in corso: righe delle serie e timer di recupero |
| `06-catalogo.png` | Catalogo con ricerca e filtri |
| `07-esercizio.png` | Dettaglio esercizio: immagini animate, scheda tecnica, istruzioni |
| `08-home-chiaro.png` | La stessa home in tema chiaro |
| `09-editor.png` | Editor dei parametri di un esercizio a carico |
| `10-editor-tempo.png` | Editor di un esercizio a tempo: durata e pausa, nessun carico |
