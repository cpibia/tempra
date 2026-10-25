import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, Cloud, RefreshCw, Unlink, Copy, Check, Smartphone } from 'lucide-react';
import { ApiError, deleteAccount, formatSyncCode, getSyncCode, isSignedIn, isSyncConfigured } from '../../lib/api';
import { joinExistingCode, leaveSync, runSync, startSyncWithNewCode, useSyncStatus } from '../../lib/sync';
import { getSettings } from '../../db/db';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { useAnnounce } from '../../lib/announce';

const errorMessage = (cause: unknown): string =>
  cause instanceof ApiError && cause.status !== 0
    ? cause.message
    : 'Non riesco a contattare il server. Controlla la connessione e riprova.';

const formatSyncTime = (iso: string): string => {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `oggi alle ${time}` : `${date.toLocaleDateString('it-IT')} alle ${time}`;
};

/**
 * Sincronizzazione fra dispositivi con un codice, senza email ne' password.
 * Il primo dispositivo crea il codice, gli altri lo inseriscono e ritrovano
 * schede, allenamenti e record. Senza server configurato la sezione lo dice
 * e si ferma li': l'applicazione resta pienamente utilizzabile.
 */
export function SyncPanel({ compact = false, onLinked }: { compact?: boolean; onLinked?: () => void }) {
  const announce = useAnnounce();
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const status = useSyncStatus();
  const [code, setCode] = useState<string | null>(() => (isSignedIn() ? getSyncCode() : null));
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isSyncConfigured()) {
    return (
      <div className="callout">
        <CloudOff size={20} aria-hidden="true" />
        <div>
          <strong>Sincronizzazione non attiva</strong>
          <p style={{ margin: '4px 0 0' }}>
            Questa installazione non ha un server collegato: i tuoi dati restano solo
            su questo dispositivo. Usa il backup manuale per non perderli.
          </p>
        </div>
      </div>
    );
  }

  const attempt = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const create = () => attempt(async () => {
    const created = await startSyncWithNewCode();
    setCode(created);
    announce(`Codice creato: ${formatSyncCode(created).split('').join(' ')}. Inseriscilo sugli altri dispositivi.`);
    onLinked?.();
  });

  const join = (event: FormEvent) => {
    event.preventDefault();
    void attempt(async () => {
      const joined = await joinExistingCode(input);
      setCode(joined);
      setInput('');
      announce('Dispositivo collegato. Dati sincronizzati.');
      onLinked?.();
    });
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(formatSyncCode(code));
      setCopied(true);
      announce('Codice copiato.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copia non riuscita: trascrivi il codice a mano.');
    }
  };

  if (code && settings?.syncEnabled) {
    return (
      <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
        <div className="sync-code-card">
          <p className="field__label" id="sync-code-label" style={{ margin: 0 }}>Il tuo codice di sincronizzazione</p>
          <div className="row" style={{ gap: 'calc(var(--spacing) * 2)', justifyContent: 'space-between' }}>
            <span className="sync-code num" aria-labelledby="sync-code-label">{formatSyncCode(code)}</span>
            <Button size="sm" variant="secondary" onClick={() => void copy()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? 'Copiato' : 'Copia'}
            </Button>
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>
            Inseriscilo in Tempra sugli altri dispositivi, in Impostazioni oppure alla prima
            apertura: ritroverai schede, allenamenti e record. Tienilo per te, vale come una password.
          </p>
        </div>

        <p className="tiny muted" role="status" style={{ margin: 0 }}>
          <Cloud size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
          {status.state === 'syncing'
            ? 'Sincronizzo...'
            : status.state === 'error'
              ? status.error
              : settings.lastSyncAt
                ? `Sincronizzato ${formatSyncTime(settings.lastSyncAt)}. Si aggiorna da solo a ogni modifica.`
                : 'Si aggiorna da solo a ogni modifica.'}
        </p>

        <Button
          variant="secondary" block disabled={busy || status.state === 'syncing'}
          onClick={() => void attempt(async () => {
            await runSync();
            announce('Sincronizzazione completata.');
          })}
        >
          <RefreshCw size={18} aria-hidden="true" /> Sincronizza adesso
        </Button>

        <Button
          variant="ghost" block disabled={busy}
          onClick={() => void attempt(async () => {
            await leaveSync();
            setCode(null);
            announce('Dispositivo scollegato. I dati restano qui.');
          })}
        >
          <Unlink size={18} aria-hidden="true" /> Scollega questo dispositivo
        </Button>

        <Button
          variant="ghost" block disabled={busy}
          style={{ color: 'var(--color-danger-text)' }}
          onClick={() => setConfirmDelete(true)}
        >
          Elimina i dati dal server
        </Button>

        {error && <p className="field__error" role="alert">{error}</p>}

        <ConfirmDialog
          open={confirmDelete}
          title="Eliminare i dati dal server?"
          message="Il codice smette di funzionare su tutti i dispositivi e la copia sul server viene cancellata. Su ogni dispositivo i dati locali restano."
          confirmLabel="Elimina dal server"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void attempt(async () => {
              await deleteAccount();
              await leaveSync();
              setCode(null);
              announce('Dati eliminati dal server.');
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
      {!compact && (
        <p className="tiny muted" style={{ margin: 0 }}>
          Usi Tempra su piu dispositivi? Crea un codice qui e inseriscilo sugli altri:
          restano allineati da soli. Niente email, niente password.
        </p>
      )}

      <form className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }} onSubmit={join}>
        <div className="field">
          <label className="field__label" htmlFor="sync-code-input">
            <Smartphone size={15} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Hai gia un codice?
          </label>
          <input
            id="sync-code-input"
            className="input sync-code-input num"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD-2345"
            maxLength={12}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby="sync-code-hint"
            aria-invalid={error ? true : undefined}
          />
          <p className="field__hint" id="sync-code-hint">8 caratteri, lo trovi nelle impostazioni dell altro dispositivo.</p>
        </div>
        <Button type="submit" block disabled={busy || input.replace(/[^a-z0-9]/gi, '').length !== 8}>
          {busy ? 'Un momento...' : 'Collega questo dispositivo'}
        </Button>
      </form>

      {!compact && (
        <Button variant="secondary" block disabled={busy} onClick={() => void create()}>
          Crea un codice per questo dispositivo
        </Button>
      )}

      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}

