import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '@tempra/core';
import { playRestFinished, vibrate } from '../../lib/sound';

interface SetStopwatchProps {
  startedAt: string;
  /** Per gli esercizi a tempo: secondi da raggiungere, mostrati come conto alla rovescia. */
  targetSec?: number;
  sound: boolean;
  vibration: boolean;
}

/**
 * Cronometro della serie in corso. Come il recupero, legge l'orologio invece
 * di contare i tick: se il telefono sospende la pagina il tempo resta giusto.
 */
export function SetStopwatch({ startedAt, targetSec, sound, vibration }: SetStopwatchProps) {
  const [elapsed, setElapsed] = useState(0);
  const signalled = useRef(false);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (!targetSec || signalled.current || elapsed < targetSec) return;
    signalled.current = true;
    if (sound) playRestFinished();
    if (vibration) vibrate([120, 80, 220]);
  }, [elapsed, targetSec, sound, vibration]);

  const remaining = targetSec ? targetSec - elapsed : null;
  const progress = targetSec ? Math.min(1, elapsed / targetSec) : null;

  return (
    <div className="stopwatch" data-reached={remaining !== null && remaining <= 0 ? '' : undefined}>
      <p className="label-caps" style={{ margin: 0 }}>
        {remaining === null ? 'Serie in corso' : remaining > 0 ? 'Tieni la posizione' : 'Tempo raggiunto'}
      </p>
      <output className="stopwatch__time num" role="timer" aria-atomic="true">
        {remaining !== null && remaining > 0 ? formatDuration(remaining) : formatDuration(elapsed)}
      </output>
      {progress !== null && (
        <div className="stopwatch__track" aria-hidden="true">
          <span style={{ inlineSize: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
