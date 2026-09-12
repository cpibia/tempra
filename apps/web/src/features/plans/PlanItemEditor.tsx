import { useMemo } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import {
  createId, formatDuration, recommendedRest, roundTo15, defaultHoldDuration,
  type Exercise, type Experience, type Goal, type PlanItem, type PlannedSet, type SetTechnique,
} from '@tempra/core';
import { NumberStepper } from '../../components/ui/NumberStepper';

interface PlanItemEditorProps {
  exercise: Exercise;
  item: PlanItem;
  goal: Goal;
  experience: Experience;
  onChange: (item: PlanItem) => void;
}

const TECHNIQUES: { value: SetTechnique; label: string; hint: string }[] = [
  { value: 'straight', label: 'Serie normali', hint: 'Stesso carico su tutte le serie.' },
  { value: 'pyramid_up', label: 'Piramidale crescente', hint: 'Il carico sale, le ripetizioni scendono.' },
  { value: 'pyramid_down', label: 'Piramidale decrescente', hint: 'Si parte pesanti e si scarica serie dopo serie.' },
  { value: 'drop', label: 'Stripping', hint: 'Sull ultima serie si scala il carico e si continua.' },
  { value: 'rest_pause', label: 'Rest pause', hint: 'Ultima serie spezzata da micro pause di 20 secondi.' },
];

/**
 * Editor dei parametri di un esercizio nella scheda.
 *
 * I campi mostrati dipendono dal tipo di carico: un plank chiede i secondi,
 * un curl chiede carico e ripetizioni, le trazioni chiedono le ripetizioni e
 * un eventuale peso di zavorra. La pausa arriva gia' calcolata, ma resta
 * sempre modificabile: il valore proposto e' un consiglio, non un vincolo.
 */
export function PlanItemEditor({ exercise, item, goal, experience, onChange }: PlanItemEditorProps) {
  const isTimed = exercise.loadType === 'time';
  const showWeight = exercise.loadType === 'weight' || exercise.loadType === 'bodyweight_loadable';

  const first = item.sets[0];
  const repsRange: [number, number] = Array.isArray(first?.reps)
    ? first.reps
    : [first?.reps ?? 8, first?.reps ?? 12];

  const suggestedRest = useMemo(() => recommendedRest({
    exercise, goal, experience,
    reps: Math.round((repsRange[0] + repsRange[1]) / 2),
    rir: first?.rir,
  }), [exercise, goal, experience, repsRange[0], repsRange[1], first?.rir]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchSets = (patch: Partial<PlannedSet>) =>
    onChange({ ...item, sets: item.sets.map((s) => ({ ...s, ...patch })) });

  const setCount = (count: number) => {
    const target = Math.max(1, Math.min(10, count));
    if (target === item.sets.length) return;
    if (target < item.sets.length) {
      onChange({ ...item, sets: item.sets.slice(0, target) });
      return;
    }
    const template = item.sets[item.sets.length - 1] ?? {
      id: '', kind: 'working' as const, restSec: item.restSec,
    };
    const added = Array.from({ length: target - item.sets.length }, () => ({
      ...template, id: createId('set'),
    }));
    onChange({ ...item, sets: [...item.sets, ...added] });
  };

  return (
    <div className="item-editor">
      <div className="item-editor__grid">
        <NumberStepper
          label="Serie" value={item.sets.length} onChange={(v) => setCount(v ?? 1)}
          min={1} max={10} compact
        />

        {isTimed ? (
          <NumberStepper
            label="Durata" unit="secondi"
            value={first?.timeSec ?? defaultHoldDuration(exercise)}
            onChange={(v) => patchSets({ timeSec: v ?? 30 })}
            step={5} min={5} max={600} compact
          />
        ) : (
          <>
            <NumberStepper
              label="Ripetizioni da" value={repsRange[0]}
              onChange={(v) => patchSets({ reps: [v ?? 1, Math.max(v ?? 1, repsRange[1])] })}
              min={1} max={50} compact
            />
            <NumberStepper
              label="Ripetizioni a" value={repsRange[1]}
              onChange={(v) => patchSets({ reps: [Math.min(repsRange[0], v ?? 1), v ?? 1] })}
              min={1} max={50} compact
            />
          </>
        )}

        {showWeight && (
          <NumberStepper
            label="Carico" unit="kg"
            value={first?.weightKg}
            onChange={(v) => patchSets({ weightKg: v })}
            step={2.5} min={0} max={500} decimals compact
            placeholder="da definire"
          />
        )}
      </div>

      <div className="item-editor__rest">
        <NumberStepper
          label="Pausa" unit="secondi"
          value={item.restSec}
          onChange={(v) => {
            const rest = roundTo15(v ?? suggestedRest);
            onChange({ ...item, restSec: rest, sets: item.sets.map((s) => ({ ...s, restSec: rest })) });
          }}
          step={15} min={0} max={600} compact
        />
        <p className="tiny muted" style={{ margin: 0 }}>
          <Info size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />
          {' '}Consigliata {formatDuration(suggestedRest)} per questo esercizio con il tuo obiettivo.
          {item.restSec !== suggestedRest && (
            <>
              {' '}
              <button
                type="button"
                className="link-button"
                onClick={() => onChange({
                  ...item,
                  restSec: suggestedRest,
                  sets: item.sets.map((s) => ({ ...s, restSec: suggestedRest })),
                })}
              >
                <RotateCcw size={12} aria-hidden="true" /> usa la consigliata
              </button>
            </>
          )}
        </p>
      </div>

      {!isTimed && (
        <div className="field">
          <label className="field__label" htmlFor={`tech-${item.id}`}>Modalita delle serie</label>
          <select
            id={`tech-${item.id}`}
            className="input"
            value={item.technique}
            onChange={(e) => onChange({ ...item, technique: e.target.value as SetTechnique })}
          >
            {TECHNIQUES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p className="field__hint">
            {TECHNIQUES.find((t) => t.value === item.technique)?.hint}
          </p>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor={`note-${item.id}`}>Nota (facoltativa)</label>
        <input
          id={`note-${item.id}`}
          className="input"
          type="text"
          placeholder="Es. presa larga, tempo 3 secondi in discesa"
          value={item.notes ?? ''}
          onChange={(e) => onChange({ ...item, notes: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
