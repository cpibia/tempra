import { useEffect } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';
import { useAnnounce } from '../lib/announce';
import { installUpdateNow, startServiceWorker, usePwaState } from '../lib/pwa';

/**
 * Avviso di aggiornamento. Compare solo quando una versione nuova arriva
 * durante un allenamento: negli altri casi si installa da sola (vedi lib/pwa).
 */
export function UpdatePrompt() {
  const announce = useAnnounce();
  const { needsRefresh, offlineReady } = usePwaState();

  useEffect(() => { startServiceWorker(); }, []);

  useEffect(() => {
    if (needsRefresh) announce('E disponibile una nuova versione di Tempra.');
  }, [needsRefresh, announce]);

  useEffect(() => {
    if (!offlineReady) return;
    const timeout = window.setTimeout(() => usePwaState.setState({ offlineReady: false }), 6000);
    return () => window.clearTimeout(timeout);
  }, [offlineReady]);

  if (!needsRefresh && !offlineReady) return null;

  return (
    <div className="update-prompt" role="status">
      {needsRefresh ? (
        <>
          <Download size={20} aria-hidden="true" />
          <span>Nuova versione pronta.</span>
          <Button size="sm" onClick={() => void installUpdateNow()}>Aggiorna</Button>
          <Button size="sm" variant="ghost" onClick={() => usePwaState.setState({ needsRefresh: false })}>Dopo</Button>
        </>
      ) : (
        <>
          <WifiOff size={20} aria-hidden="true" />
          <span>Tempra ora funziona anche senza connessione.</span>
        </>
      )}
    </div>
  );
}
