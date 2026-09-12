import { create } from 'zustand';
import { playCountdownTick, playRestFinished, vibrate } from './sound';

/**
 * Timer di recupero.
 *
 * Regola di progetto: il tempo residuo si calcola SEMPRE dalla differenza fra
 * l'istante di fine e l'orologio di sistema, mai accumulando i tick. I timer
 * basati su setInterval si fermano o rallentano quando la scheda va in
 * background, ed e' il difetto piu' segnalato nelle recensioni delle app
 * concorrenti. Qui l'intervallo serve solo a ridisegnare il numero.
 *
 * Lo stato viene anche persistito in sessionStorage, cosi' un ricaricamento
 * accidentale a meta' recupero non azzera il conto.
 */

const STORAGE_KEY = 'tempra.rest';

/** Soglie in secondi a cui si annuncia il tempo residuo a uno screen reader. */
const ANNOUNCE_THRESHOLDS = [60, 30, 10, 5];

interface PersistedState {
  endsAt: number;
  totalSec: number;
  label: string;
  pausedRemaining?: number;
}

export interface RestTimerState {
  active: boolean;
  paused: boolean;
  /** Istante di fine in millisecondi epoch. */
  endsAt: number;
  totalSec: number;
  remainingSec: number;
  /** Secondi trascorsi oltre la fine del recupero. */
  overtimeSec: number;
  label: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lastAnnouncedThreshold: number | null;
  finishedAt: number | null;

  start: (seconds: number, label?: string) => void;
  adjust: (deltaSeconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  restore: () => void;
  setPreferences: (prefs: { sound?: boolean; vibration?: boolean }) => void;
}

function persist(state: PersistedState | null): void {
  try {
    if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage non disponibile: il timer resta valido finche' la pagina vive.
  }
}

export const useRestTimer = create<RestTimerState>((set, get) => ({
  active: false,
  paused: false,
  endsAt: 0,
  totalSec: 0,
  remainingSec: 0,
  overtimeSec: 0,
  label: '',
  soundEnabled: true,
  vibrationEnabled: true,
  lastAnnouncedThreshold: null,
  finishedAt: null,

  start: (seconds, label = '') => {
    const endsAt = Date.now() + seconds * 1000;
    persist({ endsAt, totalSec: seconds, label });
    set({
      active: true, paused: false, endsAt, totalSec: seconds,
      remainingSec: seconds, overtimeSec: 0, label,
      lastAnnouncedThreshold: null, finishedAt: null,
    });
  },

  adjust: (delta) => {
    const state = get();
    if (!state.active) return;
    if (state.paused) {
      const remaining = Math.max(0, state.remainingSec + delta);
      persist({ endsAt: Date.now() + remaining * 1000, totalSec: state.totalSec, label: state.label, pausedRemaining: remaining });
      set({ remainingSec: remaining });
      return;
    }
    const endsAt = Math.max(Date.now(), state.endsAt + delta * 1000);
    const totalSec = Math.max(5, state.totalSec + delta);
    persist({ endsAt, totalSec, label: state.label });
    set({
      endsAt,
      totalSec,
      remainingSec: Math.max(0, Math.round((endsAt - Date.now()) / 1000)),
      finishedAt: null,
      overtimeSec: 0,
    });
  },

  pause: () => {
    const state = get();
    if (!state.active || state.paused) return;
    const remaining = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
    persist({ endsAt: state.endsAt, totalSec: state.totalSec, label: state.label, pausedRemaining: remaining });
    set({ paused: true, remainingSec: remaining });
  },

  resume: () => {
    const state = get();
    if (!state.active || !state.paused) return;
    const endsAt = Date.now() + state.remainingSec * 1000;
    persist({ endsAt, totalSec: state.totalSec, label: state.label });
    set({ paused: false, endsAt });
  },

  stop: () => {
    persist(null);
    set({
      active: false, paused: false, endsAt: 0, totalSec: 0,
      remainingSec: 0, overtimeSec: 0, label: '',
      lastAnnouncedThreshold: null, finishedAt: null,
    });
  },

  tick: () => {
    const state = get();
    if (!state.active || state.paused) return;

    const deltaMs = state.endsAt - Date.now();
    const remaining = Math.max(0, Math.ceil(deltaMs / 1000));

    if (remaining === 0 && state.finishedAt === null) {
      if (state.soundEnabled) playRestFinished();
      if (state.vibrationEnabled) vibrate([120, 80, 120, 80, 220]);
      set({ remainingSec: 0, finishedAt: Date.now(), overtimeSec: 0 });
      return;
    }

    if (remaining === 0) {
      set({ remainingSec: 0, overtimeSec: Math.floor(-deltaMs / 1000) });
      return;
    }

    if (remaining !== state.remainingSec) {
      if (remaining <= 3 && state.soundEnabled) playCountdownTick();
      set({ remainingSec: remaining });
    }
  },

  restore: () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as PersistedState;
      if (saved.pausedRemaining !== undefined) {
        set({
          active: true, paused: true, endsAt: saved.endsAt, totalSec: saved.totalSec,
          remainingSec: saved.pausedRemaining, label: saved.label, overtimeSec: 0, finishedAt: null,
        });
        return;
      }
      const remaining = Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000));
      // Un recupero finito da piu' di due minuti non interessa piu' a nessuno.
      if (remaining === 0 && Date.now() - saved.endsAt > 120_000) {
        persist(null);
        return;
      }
      set({
        active: true, paused: false, endsAt: saved.endsAt, totalSec: saved.totalSec,
        remainingSec: remaining, label: saved.label,
        overtimeSec: remaining === 0 ? Math.floor((Date.now() - saved.endsAt) / 1000) : 0,
        finishedAt: remaining === 0 ? saved.endsAt : null,
      });
    } catch {
      persist(null);
    }
  },

  setPreferences: ({ sound, vibration }) => {
    set((s) => ({
      soundEnabled: sound ?? s.soundEnabled,
      vibrationEnabled: vibration ?? s.vibrationEnabled,
    }));
  },
}));

/** Soglia di annuncio da leggere a voce, oppure null se non si e' superata nessuna soglia. */
export function thresholdToAnnounce(remaining: number, last: number | null): number | null {
  for (const threshold of ANNOUNCE_THRESHOLDS) {
    if (remaining === threshold && last !== threshold) return threshold;
  }
  return null;
}
