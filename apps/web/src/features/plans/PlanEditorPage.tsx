import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Play, Settings2, Check, CalendarPlus,
} from 'lucide-react';
import {
  getExercise, GOAL_LABELS, MUSCLE_GROUP_LABELS,
  type Exercise, type Goal, type Plan, type PlanDay, type PlanItem,
} from '@tempra/core';
import { getProfile } from '../../db/db';
import { db } from '../../db/db';
import {
  createEmptyDay, createPlanItem, savePlan, setActivePlan, startSessionFromDay,
} from '../../db/repo';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { ExercisePicker } from '../catalog/ExercisePicker';
import { ExerciseImage } from '../../components/ExerciseImage';
import { PlanItemEditor } from './PlanItemEditor';
import { useAnnounce } from '../../lib/announce';

const GOALS: Goal[] = ['muscle', 'fat_loss', 'strength', 'recomp', 'endurance', 'health'];

export default function PlanEditorPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const announce = useAnnounce();

  const stored = useLiveQuery(() => (planId ? db.plans.get(planId) : undefined), [planId], undefined);
  const profile = useLiveQuery(() => getProfile(), [], undefined);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const hydrated = useRef(false);
  const moveButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (stored && !hydrated.current) {
      hydrated.current = true;
      setPlan(stored);
    }
  }, [stored]);

  if (!plan) {
    return (
      <>
        <PageHeader title="Scheda" back="/schede" />
        <p className="muted">Caricamento...</p>
      </>
    );
  }

  const day = plan.days[Math.min(dayIndex, plan.days.length - 1)];

  const persist = (next: Plan) => {
    setPlan(next);
    void savePlan(next);
  };

  const updateDay = (patch: Partial<PlanDay>) => {
    if (!day) return;
    persist({
      ...plan,
      days: plan.days.map((d) => (d.id === day.id ? { ...d, ...patch } : d)),
    });
  };

  const updateItem = (item: PlanItem) => {
    if (!day) return;
    updateDay({ items: day.items.map((i) => (i.id === item.id ? item : i)) });
  };

  const addExercise = (exercise: Exercise) => {
    if (!day) return;
    const item = createPlanItem(exercise, plan, profile, day.items.length);
    updateDay({
      items: [...day.items, item],
      focus: [...new Set([...day.focus, ...exercise.muscleGroups])],
    });
    setPickerOpen(false);
    setExpanded(item.id);
    announce(`${exercise.name} aggiunto a ${day.name}.`);
  };

  const removeItem = (itemId: string) => {
    if (!day) return;
    const exercise = getExercise(day.items.find((i) => i.id === itemId)?.exerciseId ?? '');
    updateDay({ items: day.items.filter((i) => i.id !== itemId).map((i, order) => ({ ...i, order })) });
    announce(`${exercise?.name ?? 'Esercizio'} rimosso.`);
  };

  /**
   * Riordino da tastiera e da screen reader.
   * Il trascinamento non e' l'unico modo per spostare un esercizio: sarebbe
   * inaccessibile. Qui ogni riga ha due pulsanti, il focus resta sul pulsante
   * premuto e la nuova posizione viene annunciata.
   */
  const moveItem = (itemId: string, direction: -1 | 1) => {
    if (!day) return;
    const index = day.items.findIndex((i) => i.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= day.items.length) return;

    const items = [...day.items];
    const [moved] = items.splice(index, 1);
    items.splice(target, 0, moved!);
    updateDay({ items: items.map((item, order) => ({ ...item, order })) });

    const exercise = getExercise(moved!.exerciseId);
    announce(`${exercise?.name ?? 'Esercizio'} spostato alla posizione ${target + 1} di ${items.length}.`);
    requestAnimationFrame(() => moveButtonRefs.current[`${itemId}-${direction}`]?.focus());
  };

  const addDay = () => {
    const next = createEmptyDay(`Giorno ${plan.days.length + 1}`, plan.days.length);
    persist({ ...plan, days: [...plan.days, next], daysPerWeek: plan.days.length + 1 });
    setDayIndex(plan.days.length);
    announce(`${next.name} aggiunto.`);
  };

  const totalSets = day?.items.reduce((sum, item) => sum + item.sets.length, 0) ?? 0;

  return (
    <>
      <PageHeader
        title={plan.name}
        back="/schede"
        actions={
          !plan.isActive ? (
            <Button size="sm" variant="ghost" onClick={async () => {
              await setActivePlan(plan.id);
              announce('Scheda resa attiva.');
            }}>
              Rendi attiva
            </Button>
          ) : (
            <span className="badge badge--info"><Check size={12} aria-hidden="true" /> Attiva</span>
          )
        }
      />

      <div
        className="stack"
        style={{
          gap: 'calc(var(--spacing) * 4)',
          paddingBlockStart: 'calc(var(--spacing) * 4)',
          paddingBlockEnd: 'calc(var(--spacing) * 20)',
        }}
      >

        <details className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'var(--font-weight-semibold)' }}>
            <Settings2 size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> Dettagli della scheda
          </summary>
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)', marginBlockStart: 'calc(var(--spacing) * 4)' }}>
            <div className="field">
              <label className="field__label" htmlFor="plan-name">Nome</label>
              <input
                id="plan-name" className="input" type="text" value={plan.name}
                onChange={(e) => persist({ ...plan, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="plan-goal">Obiettivo</label>
              <select
                id="plan-goal" className="input" value={plan.goal}
                onChange={(e) => persist({ ...plan, goal: e.target.value as Goal })}
              >
                {GOALS.map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
              </select>
              <p className="field__hint">Determina le pause e le ripetizioni consigliate.</p>
            </div>
            {plan.generation && (
              <div className="callout callout--info">
                <div>
                  <strong>Scheda generata</strong>
                  <ul style={{ margin: '6px 0 0', paddingInlineStart: '1.1em' }}>
                    {plan.generation.rationale.map((line, i) => <li key={i} className="tiny">{line}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </details>

        <div className="chip-row" role="tablist" aria-label="Giorni della scheda">
          {plan.days.map((d, index) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              className="chip"
              aria-selected={index === dayIndex}
              data-selected={index === dayIndex ? 'true' : undefined}
              onClick={() => setDayIndex(index)}
            >
              {d.name}
            </button>
          ))}
          <button type="button" className="chip" onClick={addDay}>
            <CalendarPlus size={15} aria-hidden="true" /> Giorno
          </button>
        </div>

        {day && (
          <section aria-label={`Esercizi di ${day.name}`} className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
            <div className="field">
              <label className="field__label" htmlFor="day-name">Nome del giorno</label>
              <input
                id="day-name" className="input" type="text" value={day.name}
                onChange={(e) => updateDay({ name: e.target.value })}
              />
            </div>

            <p className="tiny muted" role="status">
              {day.items.length} esercizi, {totalSets} serie in totale
              {day.focus.length > 0 && ` - ${day.focus.map((f) => MUSCLE_GROUP_LABELS[f]).join(', ')}`}
            </p>

            {day.items.length === 0 && (
              <div className="empty-state">
                <p>Questo giorno e vuoto.</p>
                <p className="tiny">Aggiungi il primo esercizio: puoi cercarlo per nome o filtrarlo per muscolo.</p>
              </div>
            )}

            <ol className="exercise-list">
              {day.items.map((item, index) => {
                const exercise = getExercise(item.exerciseId);
                if (!exercise) return null;
                const isOpen = expanded === item.id;
                const first = item.sets[0];
                const target = first?.timeSec
                  ? `${first.timeSec} s`
                  : Array.isArray(first?.reps) ? `${first.reps[0]}-${first.reps[1]}` : String(first?.reps ?? '');

                return (
                  <li key={item.id} className="card" style={{ padding: 'calc(var(--spacing) * 3)' }}>
                    <div className="row" style={{ gap: 'calc(var(--spacing) * 3)' }}>
                      <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                      <button
                        type="button"
                        className="plan-item__toggle"
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? null : item.id)}
                      >
                        <span className="exercise-item__name">{exercise.name}</span>
                        <span className="tiny muted num">
                          {item.sets.length} x {target}
                          {first?.weightKg ? ` - ${first.weightKg} kg` : ''}
                          {` - pausa ${item.restSec} s`}
                        </span>
                      </button>
                      <div className="plan-item__move">
                        <button
                          type="button" className="icon-btn"
                          ref={(el) => { moveButtonRefs.current[`${item.id}--1`] = el; }}
                          onClick={() => moveItem(item.id, -1)}
                          disabled={index === 0}
                          aria-label={`Sposta ${exercise.name} in alto`}
                        >
                          <ChevronUp size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button" className="icon-btn"
                          ref={(el) => { moveButtonRefs.current[`${item.id}-1`] = el; }}
                          onClick={() => moveItem(item.id, 1)}
                          disabled={index === day.items.length - 1}
                          aria-label={`Sposta ${exercise.name} in basso`}
                        >
                          <ChevronDown size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <>
                        <PlanItemEditor
                          exercise={exercise}
                          item={item}
                          goal={plan.goal}
                          experience={profile?.experience ?? 'beginner'}
                          onChange={updateItem}
                        />
                        <div className="row" style={{ justifyContent: 'space-between', marginBlockStart: 'calc(var(--spacing) * 3)' }}>
                          <a className="btn btn--sm btn--ghost" href={`/esercizi/${exercise.slug}`}>Come si esegue</a>
                          <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}
                            style={{ color: 'var(--color-danger-text)' }}>
                            <Trash2 size={16} aria-hidden="true" /> Rimuovi
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>

            <Button block variant="secondary" onClick={() => setPickerOpen(true)}>
              <Plus size={18} aria-hidden="true" /> Aggiungi esercizio
            </Button>

            {plan.days.length > 1 && (
              <Button block variant="ghost" onClick={() => setConfirmDeleteDay(true)}
                style={{ color: 'var(--color-danger-text)' }}>
                Elimina {day.name}
              </Button>
            )}
          </section>
        )}
      </div>

      {day && day.items.length > 0 && (
        <BottomActionBar>
          <Button
            block size="lg"
            onClick={async () => {
              const session = await startSessionFromDay(plan, day);
              announce(`Allenamento ${session.name} avviato.`);
              navigate('/allenamento');
            }}
          >
            <Play size={20} aria-hidden="true" /> Allenati con questo giorno
          </Button>
        </BottomActionBar>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        alreadyAdded={day?.items.map((i) => i.exerciseId) ?? []}
      />

      <ConfirmDialog
        open={confirmDeleteDay}
        title="Eliminare il giorno?"
        message={`${day?.name ?? 'Il giorno'} e tutti i suoi esercizi verranno rimossi dalla scheda.`}
        confirmLabel="Elimina"
        destructive
        onCancel={() => setConfirmDeleteDay(false)}
        onConfirm={() => {
          if (!day) return;
          const days = plan.days.filter((d) => d.id !== day.id).map((d, order) => ({ ...d, order }));
          persist({ ...plan, days, daysPerWeek: days.length });
          setDayIndex(0);
          setConfirmDeleteDay(false);
          announce('Giorno eliminato.');
        }}
      />
    </>
  );
}
