import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useRestTimer, thresholdToAnnounce } from './rest-timer';

// Il suono non serve in prova, e in jsdom non esiste il contesto audio.
vi.mock('./sound', () => ({
  playRestFinished: vi.fn(),
  playCountdownTick: vi.fn(),
  vibrate: vi.fn(),
}));

describe('timer di recupero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    useRestTimer.getState().stop();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parte con il tempo richiesto', () => {
    useRestTimer.getState().start(90, 'Panca piana');
    const state = useRestTimer.getState();
    expect(state.active).toBe(true);
    expect(state.remainingSec).toBe(90);
    expect(state.label).toBe('Panca piana');
  });

  /**
   * Il punto piu' importante: il tempo residuo si ricava dall'orologio, non
   * dal numero di tick ricevuti. Se cosi' non fosse, il conto si fermerebbe
   * quando il browser sospende la scheda in secondo piano.
   */
  it('calcola il residuo dall orologio, non dai tick', () => {
    useRestTimer.getState().start(60);
    // Nessun tick eseguito, ma sono passati trenta secondi reali.
    vi.setSystemTime(new Date('2026-01-01T10:00:30.000Z'));
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(30);
  });

  it('segna la fine e poi conta il tempo in eccesso', () => {
    useRestTimer.getState().start(30);
    vi.setSystemTime(new Date('2026-01-01T10:00:30.000Z'));
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(0);
    expect(useRestTimer.getState().finishedAt).not.toBeNull();

    vi.setSystemTime(new Date('2026-01-01T10:00:45.000Z'));
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().overtimeSec).toBe(15);
  });

  it('aggiunge e toglie tempo', () => {
    useRestTimer.getState().start(60);
    useRestTimer.getState().adjust(15);
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(75);

    useRestTimer.getState().adjust(-30);
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(45);
  });

  it('in pausa il tempo non scorre', () => {
    useRestTimer.getState().start(60);
    vi.setSystemTime(new Date('2026-01-01T10:00:10.000Z'));
    useRestTimer.getState().tick();
    useRestTimer.getState().pause();
    expect(useRestTimer.getState().remainingSec).toBe(50);

    vi.setSystemTime(new Date('2026-01-01T10:01:00.000Z'));
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(50);

    useRestTimer.getState().resume();
    vi.setSystemTime(new Date('2026-01-01T10:01:20.000Z'));
    useRestTimer.getState().tick();
    expect(useRestTimer.getState().remainingSec).toBe(30);
  });

  it('si ferma e azzera', () => {
    useRestTimer.getState().start(60);
    useRestTimer.getState().stop();
    expect(useRestTimer.getState().active).toBe(false);
    expect(useRestTimer.getState().remainingSec).toBe(0);
  });

  it('sopravvive a un ricaricamento della pagina', () => {
    useRestTimer.getState().start(120, 'Squat');
    vi.setSystemTime(new Date('2026-01-01T10:00:40.000Z'));

    // Si simula il rimontaggio dell'applicazione.
    useRestTimer.setState({ active: false, remainingSec: 0, label: '' });
    useRestTimer.getState().restore();

    expect(useRestTimer.getState().active).toBe(true);
    expect(useRestTimer.getState().label).toBe('Squat');
    expect(useRestTimer.getState().remainingSec).toBe(80);
  });

  it('non ripristina un recupero finito da troppo tempo', () => {
    useRestTimer.getState().start(30);
    vi.setSystemTime(new Date('2026-01-01T10:05:00.000Z'));
    useRestTimer.setState({ active: false });
    useRestTimer.getState().restore();
    expect(useRestTimer.getState().active).toBe(false);
  });
});

describe('soglie di annuncio', () => {
  it('annuncia solo alle soglie previste', () => {
    expect(thresholdToAnnounce(60, null)).toBe(60);
    expect(thresholdToAnnounce(30, 60)).toBe(30);
    expect(thresholdToAnnounce(10, 30)).toBe(10);
    expect(thresholdToAnnounce(5, 10)).toBe(5);
  });

  it('non annuncia a ogni secondo', () => {
    for (const seconds of [59, 45, 31, 29, 11, 9, 4, 2]) {
      expect(thresholdToAnnounce(seconds, null)).toBeNull();
    }
  });

  it('non ripete la stessa soglia', () => {
    expect(thresholdToAnnounce(30, 30)).toBeNull();
  });
});
