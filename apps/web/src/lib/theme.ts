export type ThemeChoice = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'tempra.theme';

/** Risolve la scelta dell'utente nel tema effettivo da applicare al documento. */
export function resolveTheme(choice: ThemeChoice): 'dark' | 'light' {
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(choice: ThemeChoice): void {
  const resolved = resolveTheme(choice);
  document.documentElement.dataset.theme = resolved;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Modalita' privata o storage pieno: il tema resta valido per questa sessione.
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (meta) meta.content = resolved === 'dark' ? '#070A10' : '#F4F5F7';
}

export function readStoredTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'dark' || value === 'light' || value === 'system') return value;
  } catch {
    // ignorato di proposito
  }
  return 'dark';
}

/** Tiene allineato il tema quando l'utente cambia le preferenze di sistema. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: light)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
