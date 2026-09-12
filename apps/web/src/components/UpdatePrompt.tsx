import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Download, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';
import { useAnnounce } from '../lib/announce';

/**
 * Registrazione del service worker e avviso di aggiornamento.
 *
 * L'aggiornamento non viene mai applicato da solo: ricaricare la pagina mentre
 * qualcuno sta registrando una serie e' il modo piu' rapido per fargli perdere
 * fiducia nell'app. Si chiede, e si ricarica solo su richiesta.
 */
export function UpdatePrompt() {
  const announce = useAnnounce();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedsRefresh(true);
        announce('E disponibile una nuova versione di Tempra.');
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setUpdate(() => () => updateSW(true));
  }, [announce]);

  useEffect(() => {
    if (!offlineReady) return;
    const timeout = window.setTimeout(() => setOfflineReady(false), 6000);
    return () => window.clearTimeout(timeout);
  }, [offlineReady]);

  if (!needsRefresh && !offlineReady) return null;

  return (
    <div className="update-prompt" role="status">
      {needsRefresh ? (
        <>
          <Download size={20} aria-hidden="true" />
          <span>Nuova versione pronta.</span>
          <Button size="sm" onClick={() => void update?.()}>Aggiorna</Button>
          <Button size="sm" variant="ghost" onClick={() => setNeedsRefresh(false)}>Dopo</Button>
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
