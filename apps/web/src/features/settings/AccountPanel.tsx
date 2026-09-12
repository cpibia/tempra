import { useEffect, useState, type FormEvent } from 'react';
import { CloudOff, Cloud, RefreshCw, LogOut } from 'lucide-react';
import { ApiError, currentAccount, isSignedIn, isSyncConfigured, login, logout, register } from '../../lib/api';
import { runSync, type SyncReport } from '../../lib/sync';
import { saveSettings } from '../../db/db';
import { Button } from '../../components/ui/Button';
import { useAnnounce } from '../../lib/announce';

/**
 * Account e sincronizzazione, entrambi facoltativi.
 * Senza server configurato la sezione spiega la situazione e si ferma li':
 * l'applicazione resta pienamente utilizzabile.
 */
export function AccountPanel() {
  const announce = useAnnounce();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const [report, setReport] = useState<SyncReport | null>(null);

  useEffect(() => {
    if (!isSyncConfigured() || !isSignedIn()) return;
    void currentAccount().then(setAccount).catch(() => setAccount(null));
  }, []);

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(email, password);
      else await login(email, password);
      await saveSettings({ syncEnabled: true });
      setAccount({ email });
      announce('Accesso effettuato. Sincronizzazione attiva.');
      const result = await runSync();
      if (result) setReport(result);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Non riesco a contattare il server');
    } finally {
      setBusy(false);
    }
  };

  if (account) {
    return (
      <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
        <div className="callout callout--success">
          <Cloud size={20} aria-hidden="true" />
          <div>
            <strong>Sincronizzazione attiva</strong>
            <p style={{ margin: '4px 0 0' }}>Collegato come {account.email}.</p>
            {report && (
              <p className="tiny" style={{ margin: '4px 0 0' }}>
                Ultima sincronizzazione: {report.pushed} documenti inviati, {report.pulled} ricevuti.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="secondary" block disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await runSync();
              if (result) {
                setReport(result);
                announce('Sincronizzazione completata.');
              }
            } catch {
              setError('Sincronizzazione non riuscita. Riprova quando hai connessione.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={18} aria-hidden="true" /> Sincronizza adesso
        </Button>

        <Button
          variant="ghost" block
          onClick={async () => {
            await logout();
            await saveSettings({ syncEnabled: false });
            setAccount(null);
            announce('Disconnesso. I dati restano su questo dispositivo.');
          }}
        >
          <LogOut size={18} aria-hidden="true" /> Esci
        </Button>

        {error && <p className="field__error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <form className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }} onSubmit={submit}>
      <p className="tiny muted" style={{ margin: 0 }}>
        Con un account i tuoi allenamenti vengono salvati anche sul server e li ritrovi
        su un altro dispositivo. Non e obbligatorio: senza account l app funziona uguale.
      </p>

      <div className="field">
        <label className="field__label" htmlFor="account-email">Email</label>
        <input
          id="account-email" className="input" type="email" autoComplete="email"
          required value={email} onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="account-password">Password</label>
        <input
          id="account-password" className="input" type="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-hint"
          aria-invalid={error ? true : undefined}
        />
        <p className="field__hint" id="password-hint">Almeno 10 caratteri.</p>
      </div>

      {error && <p className="field__error" role="alert">{error}</p>}

      <Button type="submit" block disabled={busy}>
        {busy ? 'Un momento...' : mode === 'register' ? 'Crea account' : 'Accedi'}
      </Button>

      <Button
        type="button" variant="ghost" block
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
      >
        {mode === 'login' ? 'Non hai un account? Creane uno' : 'Hai gia un account? Accedi'}
      </Button>
    </form>
  );
}
