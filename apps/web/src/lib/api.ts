/**
 * Client dell'API di sincronizzazione.
 *
 * Tutto qui dentro e' opzionale: se il server non e' configurato, o non
 * risponde, l'applicazione continua a funzionare esattamente come prima.
 * La sincronizzazione e' una copia di sicurezza, non un requisito.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const isSyncConfigured = (): boolean => BASE_URL.length > 0;

const TOKEN_KEY = 'tempra.tokens';
const CODE_KEY = 'tempra.syncCode';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  /** Istante di scadenza in millisecondi epoch. */
  expiresAt: number;
}

function readTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function writeTokens(tokens: Tokens | null): void {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Senza storage la sessione vale solo per questa scheda: accettabile.
  }
}

export const isSignedIn = (): boolean => readTokens() !== null;

export function getSyncCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

function writeSyncCode(code: string | null): void {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {
    // Senza storage il codice vale solo per questa visita.
  }
}

/** Maiuscole e solo lettere e cifre: trattini e spazi servono solo a leggerlo. */
export const normalizeSyncCode = (input: string): string =>
  input.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** "ABCD2345" diventa "ABCD-2345", piu' facile da dettare e ricopiare. */
export const formatSyncCode = (code: string): string =>
  code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!isSyncConfigured()) {
    throw new ApiError('Sincronizzazione non configurata su questa installazione', 0);
  }

  const tokens = readTokens();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (tokens) headers.set('Authorization', `Bearer ${tokens.accessToken}`);

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && retry && tokens?.refreshToken) {
    const refreshed = await refreshSession(tokens.refreshToken);
    if (refreshed) return request<T>(path, init, false);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError((body as { error?: string }).error ?? 'Richiesta non riuscita', response.status);
  }

  return response.json() as Promise<T>;
}

interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function storeSession(session: SessionResponse): void {
  writeTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    // Si rinnova con un minuto di anticipo, per non farsi cogliere a meta' richiesta.
    expiresAt: Date.now() + (session.expiresIn - 60) * 1000,
  });
}

/**
 * Rinnova la sessione. Se anche il token di rinnovo e' scaduto (un dispositivo
 * rimasto chiuso per mesi) si rientra con il codice salvato: e' la stessa
 * credenziale che l'utente ha gia' inserito, chiederla di nuovo non aggiunge
 * sicurezza e interromperebbe la sincronizzazione in silenzio.
 */
async function refreshSession(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.ok) {
      storeSession(await response.json() as SessionResponse);
      return true;
    }
    writeTokens(null);
    const code = getSyncCode();
    if (!code) return false;
    const rejoin = await fetch(`${BASE_URL}/api/auth/sync-code/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!rejoin.ok) return false;
    storeSession(await rejoin.json() as SessionResponse);
    return true;
  } catch {
    return false;
  }
}

/** Crea un nuovo codice: i dati di questo dispositivo diventano la base comune. */
export async function createSyncCode(): Promise<string> {
  const session = await request<SessionResponse & { code: string }>('/api/auth/sync-code', { method: 'POST' });
  storeSession(session);
  writeSyncCode(session.code);
  return session.code;
}

/** Collega questo dispositivo a un codice creato altrove. */
export async function joinSyncCode(input: string): Promise<string> {
  const code = normalizeSyncCode(input);
  if (code.length !== 8) throw new ApiError('Il codice ha 8 caratteri, lettere e numeri', 400);
  storeSession(await request<SessionResponse>('/api/auth/sync-code/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }));
  writeSyncCode(code);
  return code;
}

/**
 * Svuota tutte le cache del service worker.
 * Serve all'uscita e alla cancellazione dei dati: qualunque cosa sia rimasta
 * in Cache Storage non deve sopravvivere alla fine della sessione.
 */
export async function clearCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } catch {
    // Se il browser nega l'accesso alle cache non c'e' nulla da ripulire.
  }
}

export async function logout(): Promise<void> {
  const tokens = readTokens();
  writeTokens(null);
  writeSyncCode(null);
  await clearCaches();
  if (tokens) {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => undefined);
  }
}

export async function currentAccount(): Promise<{ id: string; email: string }> {
  return request('/api/auth/me');
}

export async function deleteAccount(): Promise<void> {
  await request('/api/auth/me', { method: 'DELETE' });
  writeTokens(null);
  writeSyncCode(null);
  await clearCaches();
}

// --- Sincronizzazione -------------------------------------------------------

export type DocumentKind = 'profile' | 'plan' | 'session' | 'record' | 'measurement' | 'settings';

export interface SyncDocument {
  id: string;
  kind: DocumentKind;
  payload: unknown;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PullResult {
  documents: SyncDocument[];
  cursor: string | null;
  hasMore: boolean;
  serverTime: string;
}

export async function pull(since?: string): Promise<PullResult> {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  return request<PullResult>(`/api/sync/pull${query}`);
}

export async function push(documents: SyncDocument[]): Promise<{ applied: number; skipped: string[] }> {
  return request('/api/sync/push', { method: 'POST', body: JSON.stringify({ documents }) });
}

export async function syncStatus(): Promise<{ documents: number; lastSync: string | null; approximateBytes: number }> {
  return request('/api/sync/status');
}
