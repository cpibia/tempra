import { Check, Plus } from 'lucide-react';
import { getExercise, isLinkedWithNext, supersetPositions, type Session } from '@tempra/core';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { ExerciseImage } from '../../components/ExerciseImage';
import { SupersetLink, SupersetTag } from '../../components/SupersetLink';

interface ExerciseListSheetProps {
  open: boolean;
  session: Session;
  currentIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onToggleSuperset: (index: number) => void;
  onAddExercise: () => void;
}

/** Tutti gli esercizi della seduta: per saltare a uno qualsiasi e per collegarli in superset. */
export function ExerciseListSheet({
  open, session, currentIndex, onClose, onSelect, onToggleSuperset, onAddExercise,
}: ExerciseListSheetProps) {
  const positions = supersetPositions(session.entries);

  return (
    <Sheet open={open} onClose={onClose} title="Esercizi dell allenamento">
      <ol className="exercise-list" style={{ gap: 0 }}>
        {session.entries.map((entry, index) => {
          const exercise = getExercise(entry.exerciseId);
          if (!exercise) return null;
          const done = entry.sets.filter((s) => s.completed).length;
          const finished = done === entry.sets.length && done > 0;
          const next = session.entries[index + 1];
          const nextExercise = next ? getExercise(next.exerciseId) : undefined;
          const position = positions[index] ?? null;

          return (
            <li key={entry.id} className="plan-entry">
              <button
                type="button"
                className="exercise-item"
                data-superset={position ? '' : undefined}
                aria-current={index === currentIndex ? 'step' : undefined}
                onClick={() => onSelect(index)}
              >
                <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                <span className="exercise-item__text">
                  {position && <SupersetTag position={position} />}
                  <span className="exercise-item__name">{exercise.name}</span>
                  <span className="tiny muted num">
                    {finished ? <><Check size={13} aria-hidden="true" /> completato</> : `${done} di ${entry.sets.length} serie`}
                    {index === currentIndex && ' - in corso'}
                  </span>
                </span>
              </button>
              {nextExercise && (
                <SupersetLink
                  linked={isLinkedWithNext(session.entries, index)}
                  currentName={exercise.name}
                  nextName={nextExercise.name}
                  onToggle={() => onToggleSuperset(index)}
                />
              )}
            </li>
          );
        })}
      </ol>
      <Button block variant="secondary" onClick={onAddExercise} style={{ marginBlockStart: 'calc(var(--spacing) * 4)' }}>
        <Plus size={18} aria-hidden="true" /> Aggiungi esercizio
      </Button>
    </Sheet>
  );
}
