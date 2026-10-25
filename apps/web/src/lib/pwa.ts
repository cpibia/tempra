import { create } from 'zustand';
import { registerSW } from 'virtual:pwa-register';
import { getActiveSession } from '../db/repo';

/**
 * Service worker e aggiornamenti.
 *
 * Una versione nuova si installa da sola, tranne durante un allenamento:
 * ricaricare la pagina mentre qualcuno registra una serie e' il modo piu'
 * rapido per fargli perdere fiducia nell'app. In quel caso compare l'avviso
 * e si aggiorna su richiesta.
 */

export const BUILD_TIME: string = __APP_BUILD__;

interface PwaState {
  needsRefresh: boolean;
  offlineReady: boolean;
}

export const usePwaState = create<PwaState>(() => ({ needsRefresh: false, offlineReady: false }));

let registration: ServiceWorkerRegistration | undefined;
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;
let started = false;

export function startServiceWorker(): void {
  if (started) return;
  started = true;
  applyUpdate = registerSW({
    immediate: true,
    onRegisteredSW(_url, swRegistration) {
      registration = swRegistration;
      // A ogni apertura o ricaricamento si chiede subito al server se c'e' una
      // versione nuova, senza aspettare il controllo periodico del browser.
      void swRegistration?.update().catch(() => undefined);
    },
    async onNeedRefresh() {
      if (await getActiveSession()) {
        usePwaState.setState({ needsRefresh: true });
        return;
      }
      void applyUpdate?.(true);
    },
    onOfflineReady() {
      usePwaState.setState({ offlineReady: true });
    },
  });

  // Un'app sulla schermata home puo' restare aperta per giorni: si controlla
  // ogni volta che torna in primo piano.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void registration?.update().catch(() => undefined);
  });
}

export function installUpdateNow(): Promise<void> {
  return applyUpdate?.(true) ?? Promise.resolve();
}

export type UpdateCheck = 'updating' | 'current' | 'unavailable';

/** Cerca subito una versione nuova e, se c'e', la installa ricaricando la pagina. */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!registration) return 'unavailable';
  await registration.update();
  const pending = registration.installing ?? registration.waiting;
  if (!pending) return 'current';

  if (pending.state === 'installed') {
    void installUpdateNow();
  } else {
    pending.addEventListener('statechange', () => {
      if (pending.state === 'installed') void installUpdateNow();
    });
  }
  return 'updating';
}

/**
 * Elimina service worker e cache, poi ricarica dalla rete.
 * IndexedDB non viene toccato: schede, allenamenti e record restano.
 */
export async function reloadFromNetwork(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((item) => item.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } finally {
    window.location.reload();
  }
}

/** "23/10/2026 alle 11:47", nel fuso di chi guarda. */
export function formatBuildTime(iso = BUILD_TIME): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return `${day} alle ${time}`;
}
