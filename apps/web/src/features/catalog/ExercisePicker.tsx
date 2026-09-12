import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import {
  filterExercises, sortByRelevance, MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS,
  type Exercise, type MuscleGroup,
} from '@tempra/core';
import { Sheet } from '../../components/ui/Sheet';
import { ExerciseImage } from '../../components/ExerciseImage';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  /** Esercizi gia' presenti, mostrati come gia' aggiunti. */
  alreadyAdded?: string[];
  title?: string;
}

const GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

export function ExercisePicker({
  open, onClose, onPick, alreadyAdded = [], title = 'Aggiungi esercizio',
}: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);

  const results = useMemo(() => {
    const list = filterExercises({
      query: query.trim() || undefined,
      muscleGroups: group ? [group] : undefined,
    });
    return sortByRelevance(list).slice(0, 120);
  }, [query, group]);

  const added = new Set(alreadyAdded);

  return (
    <Sheet open={open} onClose={onClose} title={title} full>
      <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="picker-search">Cerca un esercizio</label>
          <input
            id="picker-search"
            className="input"
            type="search"
            autoComplete="off"
            placeholder="Cerca: panca, squat, curl..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chip-row" role="group" aria-label="Filtra per gruppo muscolare">
          <button
            type="button" className="chip" aria-pressed={group === null}
            onClick={() => setGroup(null)}
          >
            Tutti
          </button>
          {GROUPS.map((g) => (
            <button
              key={g} type="button" className="chip" aria-pressed={group === g}
              onClick={() => setGroup(group === g ? null : g)}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        <p className="tiny muted" role="status">
          {results.length === 0
            ? 'Nessun esercizio trovato con questi filtri.'
            : `${results.length} esercizi disponibili`}
        </p>

        <ul className="picker-list">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="picker-item"
                onClick={() => onPick(exercise)}
              >
                <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                <span className="picker-item__text">
                  <span className="picker-item__name">{exercise.name}</span>
                  <span className="tiny muted">
                    {exercise.muscleGroups.map((g) => MUSCLE_GROUP_LABELS[g]).join(', ')}
                    {exercise.equipment ? ` - ${EQUIPMENT_LABELS[exercise.equipment]}` : ''}
                  </span>
                </span>
                {added.has(exercise.id)
                  ? <span className="badge">Gia aggiunto</span>
                  : <Plus size={22} aria-hidden="true" style={{ flex: 'none', color: 'var(--color-brand-text)' }} />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
