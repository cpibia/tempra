/**
 * Mantiene lo schermo acceso durante l'allenamento.
 * E' la lamentela numero due nelle recensioni delle app concorrenti: il timer
 * che muore a schermo spento. Supportato su Android Chrome e su iOS 18.4+
 * nelle web app installate; dove manca, si degrada in silenzio.
 */

let sentinel: WakeLockSentinel | null = null;
let requested = false;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;
  requested = true;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  requested = false;
  try {
    await sentinel?.release();
  } catch {
    // Il blocco puo' essere gia' stato rilasciato dal sistema.
  }
  sentinel = null;
}

/**
 * iOS e Android rilasciano il blocco quando la scheda torna in background.
 * Va riacquisito al rientro, altrimenti lo schermo si spegne a meta' allenamento.
 */
export function installWakeLockRecovery(): () => void {
  const onVisibility = () => {
    if (document.visibilityState === 'visible' && requested && !sentinel) {
      void requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
