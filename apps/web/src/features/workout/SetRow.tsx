import { useId } from 'react';
import { Check, Zap, Timer } from 'lucide-react';
import {
  formatReps, formatWeight, formatDuration,
  type Exercise, type LoggedSet, type Units,
} from '@tempra/core';

interface SetRowProps {
  exercise: Exercise;
  set: LoggedSet;
  index: number;
  units: Units;
  /** Valori della stessa serie nell'ultima esecuzione, per il confronto. */
  previous?: { weightKg?: number; reps?: number; timeSec?: number };
  onChange: (patch: Partial<LoggedSet>) => void;
  onToggleComplete: () => void;
}

const KIND_LABEL: Record<string, string> = {
  warmup: 'Ris.',
  working: '',
  drop: 'Drop',
  backoff: 'Back',
  failure: 'Ced.',
};

/**
 * La riga serie e' il componente piu' toccato dell'app: durante un allenamento
 * viene usato decine di volte, spesso con una mano sola e senza guardare.
 *
 * Scelte che ne derivano:
 * - i valori arrivano gia' precompilati con quelli dell'ultima volta, cosi'
 *   ripetere la stessa serie costa un solo tocco sulla spunta;
 * - la spunta e' un checkbox nativo dentro una label, quindi il bersaglio
 *   utile e' l'intero riquadro di destra, non la sola icona;
 * - lo stato completato non e' solo verde: c'e' la spunta, il bordo cambia
 *   e la riga viene annunciata come selezionata.
 */
export function SetRow({
  exercise, set, index, units, previous, onChange, onToggleComplete,
}: SetRowProps) {
  const rowId = useId();
  const isTimed = Boolean(set.targetTimeSec) || exercise.loadType === 'time';
  const showWeight = exercise.loadType === 'weight'
    || exercise.loadType === 'bodyweight_loadable'
    || (set.weightKg !== undefined && set.weightKg > 0);

  const parseNumber = (raw: string): number | undefined => {
    const normalized = raw.replace(',', '.').trim();
    if (normalized === '') return undefined;
    const value = Number(normalized);
    return Number.isNaN(value) ? undefined : Math.max(0, value);
  };

  const previousLabel = previous
    ? isTimed
      ? formatDuration(previous.timeSec ?? 0)
      : `${previous.weightKg ? formatWeight(previous.weightKg, units) : 'corpo libero'} x ${previous.reps ?? '-'}`
    : null;

  const targetLabel = isTimed
    ? `${set.targetTimeSec ?? 0} s`
    : formatReps(set.targetReps);

  return (
    <li
      className="set-row"
      data-completed={set.completed || undefined}
      data-kind={set.kind}
      data-pr={set.prType ? '' : undefined}
    >
      <span className="set-row__index num" aria-hidden="true">
        {set.kind === 'warmup' ? KIND_LABEL.warmup : index + 1}
      </span>

      <div className="set-row__meta">
        <span className="set-row__target">
          {isTimed && <Timer size={13} aria-hidden="true" />}
          obiettivo {targetLabel}
        </span>
        {previousLabel && <span className="set-row__prev">precedente {previousLabel}</span>}
        {set.prType && (
          <span className="badge badge--pr">
            <Zap size={12} aria-hidden="true" /> Record
          </span>
        )}
      </div>

      {showWeight && !isTimed && (
        <div className="set-row__field">
          <label className="visually-hidden" htmlFor={`${rowId}-w`}>
            Peso della serie {index + 1} di {exercise.name}, in {units}
          </label>
          <input
            id={`${rowId}-w`}
            className="set-row__input num"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            autoComplete="off"
            enterKeyHint="next"
            value={set.weightKg === undefined ? '' : String(set.weightKg).replace('.', ',')}
            onChange={(e) => onChange({ weightKg: parseNumber(e.target.value) })}
          />
          <span className="set-row__unit" aria-hidden="true">{units}</span>
        </div>
      )}

      {isTimed ? (
        <div className="set-row__field">
          <label className="visually-hidden" htmlFor={`${rowId}-t`}>
            Durata della serie {index + 1} di {exercise.name}, in secondi
          </label>
          <input
            id={`${rowId}-t`}
            className="set-row__input num"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            value={set.timeSec === undefined ? '' : String(set.timeSec)}
            onChange={(e) => onChange({ timeSec: parseNumber(e.target.value) })}
          />
          <span className="set-row__unit" aria-hidden="true">s</span>
        </div>
      ) : (
        <div className="set-row__field">
          <label className="visually-hidden" htmlFor={`${rowId}-r`}>
            Ripetizioni della serie {index + 1} di {exercise.name}
          </label>
          <input
            id={`${rowId}-r`}
            className="set-row__input num"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            value={set.reps === undefined ? '' : String(set.reps)}
            onChange={(e) => onChange({ reps: parseNumber(e.target.value) })}
          />
          <span className="set-row__unit" aria-hidden="true">rip</span>
        </div>
      )}

      <label className="set-row__check">
        <input
          type="checkbox"
          checked={set.completed}
          onChange={onToggleComplete}
        />
        <span className="set-row__check-box" aria-hidden="true"><Check size={22} /></span>
        <span className="visually-hidden">
          Segna come completata la serie {index + 1} di {exercise.name}
        </span>
      </label>
    </li>
  );
}
