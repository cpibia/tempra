import { useDeferredValue, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  EQUIPMENT_LABELS, LEVEL_LABELS, MUSCLE_GROUP_LABELS, EXERCISES,
  filterExercises, sortByRelevance,
  type Equipment, type Level, type MuscleGroup,
} from '@tempra/core';
import { PageHeader } from '../../components/ui/PageHeader';
import { ExerciseImage } from '../../components/ExerciseImage';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';

const GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

const EQUIPMENT: Equipment[] = [
  'barbell', 'dumbbell', 'machine', 'cable', 'body only', 'bands',
  'kettlebells', 'e-z curl bar', 'exercise ball', 'medicine ball', 'foam roll', 'other',
];

const LEVELS: Level[] = ['beginner', 'intermediate', 'expert'];

const PAGE_SIZE = 40;

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const list = filterExercises({
      query: deferredQuery.trim() || undefined,
      muscleGroups: groups.length ? groups : undefined,
      equipment: equipment.length ? equipment : undefined,
      levels: levels.length ? levels : undefined,
    });
    return sortByRelevance(list);
  }, [deferredQuery, groups, equipment, levels]);

  const activeFilters = groups.length + equipment.length + levels.length;

  const toggle = <T,>(list: T[], setList: (v: T[]) => void, value: T) => {
    setVisible(PAGE_SIZE);
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <>
      <PageHeader title="Esercizi" />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>
        <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
          <div className="search-field" style={{ flex: 1 }}>
            <Search size={18} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="catalog-search">Cerca fra gli esercizi</label>
            <input
              id="catalog-search"
              className="input"
              type="search"
              autoComplete="off"
              placeholder={`Cerca fra ${EXERCISES.length} esercizi`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
            />
          </div>
          <Button
            variant={activeFilters ? 'primary' : 'secondary'}
            onClick={() => setFiltersOpen(true)}
            aria-label={`Filtri${activeFilters ? `, ${activeFilters} attivi` : ''}`}
            style={{ flex: 'none', paddingInline: 'calc(var(--spacing) * 3)' }}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {activeFilters > 0 && <span className="num">{activeFilters}</span>}
          </Button>
        </div>

        <div className="chip-row" role="group" aria-label="Filtro rapido per gruppo muscolare">
          {GROUPS.map((group) => (
            <button
              key={group} type="button" className="chip"
              aria-pressed={groups.includes(group)}
              onClick={() => toggle(groups, setGroups, group)}
            >
              {MUSCLE_GROUP_LABELS[group]}
            </button>
          ))}
        </div>

        <p className="tiny muted" role="status" aria-live="polite">
          {results.length === 0
            ? 'Nessun esercizio corrisponde ai filtri scelti.'
            : `${results.length} esercizi`}
        </p>

        <ul className="exercise-list">
          {results.slice(0, visible).map((exercise) => (
            <li key={exercise.id}>
              <a className="exercise-item" href={`/esercizi/${exercise.slug}`}>
                <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                <span className="exercise-item__text">
                  <span className="exercise-item__name">{exercise.name}</span>
                  <span className="tiny muted">
                    {exercise.muscleGroups.map((g) => MUSCLE_GROUP_LABELS[g]).join(', ')}
                    {exercise.equipment ? ` - ${EQUIPMENT_LABELS[exercise.equipment]}` : ''}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {visible < results.length && (
          <Button variant="secondary" block onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Mostra altri {Math.min(PAGE_SIZE, results.length - visible)}
          </Button>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtri">
        <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)' }}>
          <fieldset className="fieldset">
            <legend className="field__label">Attrezzatura</legend>
            <div className="chip-wrap">
              {EQUIPMENT.map((item) => (
                <button
                  key={item} type="button" className="chip"
                  aria-pressed={equipment.includes(item)}
                  onClick={() => toggle(equipment, setEquipment, item)}
                >
                  {EQUIPMENT_LABELS[item]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="field__label">Livello</legend>
            <div className="chip-wrap">
              {LEVELS.map((level) => (
                <button
                  key={level} type="button" className="chip"
                  aria-pressed={levels.includes(level)}
                  onClick={() => toggle(levels, setLevels, level)}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
            <Button
              block variant="secondary"
              onClick={() => { setGroups([]); setEquipment([]); setLevels([]); setVisible(PAGE_SIZE); }}
            >
              <X size={16} aria-hidden="true" /> Azzera
            </Button>
            <Button block onClick={() => setFiltersOpen(false)}>
              Mostra {results.length} esercizi
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
