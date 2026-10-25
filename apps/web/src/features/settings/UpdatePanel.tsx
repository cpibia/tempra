import { useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { checkForUpdate, formatBuildTime, reloadFromNetwork } from '../../lib/pwa';

const RESULT_MESSAGES = {
  updating: 'Nuova versione trovata: la pagina si ricarica tra un attimo.',
  current: `Hai gia l ultima versione, del ${formatBuildTime()}.`,
  unavailable: 'Aggiornamento automatico non disponibile in questo browser: usa "Ricarica da zero".',
} as const;

export function UpdatePanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
      <p style={{ margin: 0 }}>
        <strong>Versione installata:</strong> <span className="num">{formatBuildTime()}</span>
      </p>
      <p className="tiny muted" style={{ margin: 0 }}>
        Le novita arrivano da sole quando riapri l app; durante un allenamento aspettano
        che tu finisca. Per controllare subito usa "Cerca aggiornamenti".
      </p>

      <div className="grid-2">
        <Button
          variant="secondary" disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage('Cerco aggiornamenti...');
            try {
              setMessage(RESULT_MESSAGES[await checkForUpdate()]);
            } catch {
              setMessage('Controllo non riuscito: verifica la connessione.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={18} aria-hidden="true" /> Cerca aggiornamenti
        </Button>
        <Button
          variant="secondary" disabled={busy}
          onClick={() => {
            setBusy(true);
            setMessage('Svuoto la cache e ricarico...');
            void reloadFromNetwork();
          }}
        >
          <RotateCcw size={18} aria-hidden="true" /> Ricarica da zero
        </Button>
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        "Ricarica da zero" svuota la cache dell app ma non tocca schede, allenamenti e progressi.
      </p>
      {message && <p className="tiny" role="status" style={{ margin: 0 }}>{message}</p>}
    </div>
  );
}
