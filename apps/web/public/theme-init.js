// Applica il tema salvato prima del primo disegno, per evitare il lampo di
// tema sbagliato. Vive in un file a parte, e non in linea nella pagina, cosi'
// la Content-Security-Policy puo' limitarsi a "script-src 'self'" senza dover
// mantenere l'hash di uno script incorporato a ogni modifica.
(function () {
  try {
    var choice = localStorage.getItem('tempra.theme') || 'dark';
    document.documentElement.dataset.theme = choice === 'system'
      ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : choice;
  } catch (error) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
