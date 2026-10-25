import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { formatDuration, type Exercise, type LoggedSet } from '@tempra/core';
import { NumberStepper } from '../../components/ui/NumberStepper';
import { Button } from '../../components/ui/Button';

export interface SetValues {
  reps?: number;
  weightKg?: number;
  timeSec?: number;
}

interface SetLogPanelProps {
  exercise: Exercise;
  set: LoggedSet;
  setNumber: number;
  weightStep: number;
  editing?: boolean;
  onSave: (values: SetValues) => void;
  onCancel?: () => void;
}

/** Valori proposti: quello gia' scritto, altrimenti il massimo dell'obiettivo. */
function initialValues(set: LoggedSet): SetValues {
  const targetReps = Array.isArray(set.targetReps) ? set.targetReps[1] : set.targetReps;
  return {
    reps: set.reps ?? targetReps,
    weightKg: set.weightKg ?? set.targetWeightKg,
    timeSec: set.completed ? set.timeSec : (set.durationSec || set.timeSec || set.targetTimeSec),
  };
}

/**
 * Registrazione della serie appena finita. Compare mentre il recupero e'
 * gia' partito: il primo secondo di pausa non si perde a compilare un modulo.
 * I valori arrivano precompilati, quindi nel caso comune basta un tocco.
 */
export function SetLogPanel({
  exercise, set, setNumber, weightStep, editing = false, onSave, onCancel,
}: SetLogPanelProps) {
  const [values, setValues] = useState<SetValues>(() => initialValues(set));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isTimed = exercise.loadType === 'time' || Boolean(set.targetTimeSec);
  const showWeight = exercise.loadType === 'weight' || exercise.loadType === 'bodyweight_loadable';

  useEffect(() => { titleRef.current?.focus(); }, []);

  return (
    <section className="log-panel" aria-labelledby="log-title">
      <h3 id="log-title" ref={titleRef} tabIndex={-1} className="section-title" style={{ outline: 'none' }}>
        {editing ? `Correggi la serie ${setNumber}` : `Com e andata la serie ${setNumber}?`}
      </h3>
      {!editing && set.durationSec ? (
        <p className="tiny muted" style={{ margin: 0 }}>Durata {formatDuration(set.durationSec)}.</p>
      ) : null}

      <div className="log-panel__fields">
        {isTimed ? (
          <NumberStepper
            label="Secondi tenuti" value={values.timeSec}
            onChange={(timeSec) => setValues((v) => ({ ...v, timeSec }))}
            step={5} min={0} max={900}
          />
        ) : (
          <NumberStepper
            label="Ripetizioni" value={values.reps}
            onChange={(reps) => setValues((v) => ({ ...v, reps }))}
            min={0} max={100}
          />
        )}
        {showWeight && (
          <NumberStepper
            label={exercise.loadType === 'bodyweight_loadable' ? 'Zavorra' : 'Carico'} unit="kg"
            value={values.weightKg}
            onChange={(weightKg) => setValues((v) => ({ ...v, weightKg }))}
            step={weightStep} min={0} max={500} decimals
          />
        )}
      </div>

      <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>Annulla</Button>
        )}
        <Button
          block size="lg" variant="success"
          onClick={() => onSave({
            reps: isTimed ? undefined : values.reps,
            timeSec: isTimed ? values.timeSec : undefined,
            weightKg: showWeight ? values.weightKg : undefined,
          })}
        >
          <Check size={20} aria-hidden="true" /> {editing ? 'Salva le correzioni' : 'Salva la serie'}
        </Button>
      </div>
    </section>
  );
}
