import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Dumbbell } from 'lucide-react';
import type { Exercise } from '@tempra/core';

const IMG_BASE = '/img/ex/';

interface ExerciseImageProps {
  exercise: Exercise;
  /** Anima i due fotogrammi in sequenza. Nelle liste conviene tenerla ferma. */
  animated?: boolean;
  size?: 'thumb' | 'full';
  className?: string;
}

/** Intervallo fra un fotogramma e l'altro. Sotto i 400 ms si rischia il lampeggio. */
const FRAME_MS = 900;

/**
 * Le due foto del dataset sono la posizione iniziale e quella finale.
 * Alternandole si ottiene la dimostrazione del movimento senza il peso di un video.
 *
 * Vincoli di accessibilita': l'animazione e' un unico role="img" con etichetta
 * (i singoli fotogrammi sono nascosti), parte ferma se l'utente ha chiesto meno
 * animazioni, ed e' sempre interrompibile con un comando esplicito.
 */
export function ExerciseImage({ exercise, animated = false, size = 'full', className }: ExerciseImageProps) {
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [playing, setPlaying] = useState(animated && !prefersReduced.current);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  const hasMultipleFrames = exercise.frameCount > 1;

  useEffect(() => {
    if (!playing || !hasMultipleFrames) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % exercise.frameCount), FRAME_MS);
    return () => window.clearInterval(id);
  }, [playing, hasMultipleFrames, exercise.frameCount]);

  if (!exercise.frameCount || failed) {
    return (
      <div className={`exercise-image exercise-image--empty ${className ?? ''}`} role="img"
        aria-label={`Nessuna immagine disponibile per ${exercise.name}`}>
        <Dumbbell size={size === 'thumb' ? 22 : 40} aria-hidden="true" />
      </div>
    );
  }

  const src = size === 'thumb'
    ? `${exercise.id}/thumb.webp`
    : `${exercise.id}/${Math.min(frame, exercise.frameCount - 1)}.webp`;

  const label = hasMultipleFrames
    ? `${exercise.name}: dimostrazione in due fotogrammi, posizione iniziale e posizione finale`
    : exercise.name;

  return (
    <div className={`exercise-image ${className ?? ''}`} role="img" aria-label={label}>
      <img
        src={IMG_BASE + src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        data-exercise-loop={playing ? '' : undefined}
      />
      {animated && hasMultipleFrames && (
        <>
          <button
            type="button"
            className="exercise-image__toggle"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
          >
            {playing
              ? <><Pause size={16} aria-hidden="true" /> Ferma</>
              : <><Play size={16} aria-hidden="true" /> Riproduci</>}
          </button>
          <span className="visually-hidden" aria-live="off">
            Fotogramma {frame + 1} di {exercise.frameCount}
          </span>
        </>
      )}
    </div>
  );
}
