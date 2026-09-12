import { useEffect, useRef } from 'react';
import { Pause, Play, Plus, Minus, SkipForward, Volume2 } from 'lucide-react';
import { formatDuration, formatDurationSpoken } from '@tempra/core';
import { useRestTimer, thresholdToAnnounce } from '../../lib/rest-timer';
import { useAnnounce } from '../../lib/announce';

interface RestTimerBarProps {
  /** Versione ridotta, agganciata sopra la barra di navigazione. */
  compact?: boolean;
}

/**
 * Barra del recupero.
 *
 * Il numero visibile sta in un role="timer", che per definizione non viene
 * riletto a ogni secondo. Gli annunci avvengono solo a soglie precise
 * (60, 30, 10, 5 secondi e fine), altrimenti uno screen reader parlerebbe
 * ininterrottamente per tutta la pausa rendendo l'app inutilizzabile.
 */
export function RestTimerBar({ compact = false }: RestTimerBarProps) {
  const announce = useAnnounce();
  const {
    active, paused, remainingSec, totalSec, overtimeSec, label, finishedAt,
    tick, adjust, pause, resume, stop,
  } = useRestTimer();
  const lastThreshold = useRef<number | null>(null);
  const announcedEnd = useRef(false);

  useEffect(() => {
    if (!active) return;
    // 250 ms: il numero resta reattivo anche quando il sistema comprime i timer.
    const id = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(id);
  }, [active, tick]);

  useEffect(() => {
    if (!active) {
      lastThreshold.current = null;
      announcedEnd.current = false;
      return;
    }
    if (finishedAt && !announcedEnd.current) {
      announcedEnd.current = true;
      announce('Recupero finito. Puoi iniziare la serie.', 'assertive');
      return;
    }
    const threshold = thresholdToAnnounce(remainingSec, lastThreshold.current);
    if (threshold !== null) {
      lastThreshold.current = threshold;
      announce(`${formatDurationSpoken(threshold)} al termine del recupero.`);
    }
  }, [active, remainingSec, finishedAt, announce]);

  if (!active) return null;

  const finished = remainingSec === 0;
  const progress = totalSec > 0 ? Math.min(1, (totalSec - remainingSec) / totalSec) : 1;
  const state = finished ? 'finished' : remainingSec <= 10 ? 'urgent' : 'running';

  return (
    <section
      className={compact ? 'rest-bar rest-bar--compact' : 'rest-bar'}
      data-state={state}
      aria-label="Recupero in corso"
    >
      <div className="rest-bar__progress" style={{ inlineSize: `${progress * 100}%` }} aria-hidden="true" />

      <div className="rest-bar__content">
        <p className="rest-bar__label label-caps">
          {finished ? 'Recupero finito' : label ? `Recupero: ${label}` : 'Recupero'}
        </p>

        <div className="rest-bar__row">
          <output className="rest-bar__time num" role="timer" aria-atomic="true">
            {finished ? `+${formatDuration(overtimeSec)}` : formatDuration(remainingSec)}
          </output>

          <div className="rest-bar__actions">
            <button type="button" className="icon-btn" onClick={() => adjust(-15)}
              aria-label="Togli 15 secondi al recupero" disabled={finished}>
              <Minus size={20} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => adjust(15)}
              aria-label="Aggiungi 15 secondi al recupero">
              <Plus size={20} aria-hidden="true" />
            </button>
            {!finished && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => (paused ? resume() : pause())}
                aria-label={paused ? 'Riprendi il recupero' : 'Metti in pausa il recupero'}
              >
                {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => announce(
                finished
                  ? `Recupero terminato da ${formatDurationSpoken(overtimeSec)}.`
                  : `Mancano ${formatDurationSpoken(remainingSec)} alla fine del recupero.`,
                'assertive',
              )}
              aria-label="Leggi il tempo rimanente"
            >
              <Volume2 size={20} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn--sm btn--secondary" onClick={stop}>
              <SkipForward size={16} aria-hidden="true" />
              {finished ? 'Chiudi' : 'Salta'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
