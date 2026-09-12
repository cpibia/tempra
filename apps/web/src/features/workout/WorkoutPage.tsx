import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Minus, Trash2, Timer, Flag, X, ChevronRight } from 'lucide-react';
import {
  createId, formatDuration, getExercise, recommendedRest,
  type Exercise, type LoggedSet, type Session, type SessionEntry,
} from '@tempra/core';
import { getSettings, getProfile } from '../../db/db';
import { completeSession, discardSession, getActiveSession, getLastPerformance, saveSession } from '../../db/repo';
import { useRestTimer } from '../../lib/rest-timer';
import { useAnnounce } from '../../lib/announce';
import { playSetCompleted, vibrate } from '../../lib/sound';
import { requestWakeLock, releaseWakeLock } from '../../lib/wake-lock';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { ExerciseImage } from '../../components/ExerciseImage';
import { ExercisePicker } from '../catalog/ExercisePicker';
import { SetRow } from './SetRow';
import { RestTimerBar } from './RestTimerBar';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const startRest = useRestTimer((s) => s.start);

  const stored = useLiveQuery(() => getActiveSession(), [], undefined);
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const profile = useLiveQuery(() => getProfile(), [], undefined);

  const [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<Record<string, { weightKg?: number; reps?: number; timeSec?: number }[]>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const hydrated = useRef(false);

  // La sessione viene copiata in memoria una sola volta: da li' in poi la
  // fonte di verita' e' lo stato locale, che viene riversato su IndexedDB a
  // ogni modifica. Cosi' la digitazione resta fluida e non si perde nulla.
  useEffect(() => {
    if (stored && !hydrated.current) {
      hydrated.current = true;
      setSession(stored);
    }
    if (stored === undefined && hydrated.current) {
      setSession(null);
    }
  }, [stored]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const map: Record<string, { weightKg?: number; reps?: number; timeSec?: number }[]> = {};
      for (const entry of session.entries) {
        if (map[entry.exerciseId]) continue;
        const performance = await getLastPerformance(entry.exerciseId);
        if (performance) {
          map[entry.exerciseId] = performance.sets.map((s) => ({
            weightKg: s.weightKg, reps: s.reps, timeSec: s.timeSec,
          }));
        }
      }
      setPrevious(map);
    };
    void load();
    // Si ricalcola solo quando cambia l'insieme degli esercizi, non a ogni tasto.
  }, [session?.entries.map((e) => e.exerciseId).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    const compute = () => setElapsed(
      Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)),
    );
    compute();
    const id = window.setInterval(compute, 1000);
    return () => window.clearInterval(id);
  }, [session?.startedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session || !settings?.keepAwake) return;
    void requestWakeLock();
    return () => { void releaseWakeLock(); };
  }, [session?.id, settings?.keepAwake]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Ogni modifica scrive subito su IndexedDB: nessun pulsante "salva", nessun dato perso. */
  const persist = useCallback((next: Session) => {
    setSession(next);
    void saveSession(next);
  }, []);

  const updateSet = useCallback((entryId: string, setId: string, patch: Partial<LoggedSet>) => {
    setSession((current) => {
      if (!current) return current;
      const next: Session = {
        ...current,
        entries: current.entries.map((entry) => entry.id !== entryId ? entry : {
          ...entry,
          sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
        }),
      };
      void saveSession(next);
      return next;
    });
  }, []);

  const toggleComplete = useCallback((entry: SessionEntry, set: LoggedSet, exercise: Exercise) => {
    const willComplete = !set.completed;

    // Completare una serie senza valori non registra niente: si usa il target.
    const patch: Partial<LoggedSet> = {
      completed: willComplete,
      completedAt: willComplete ? new Date().toISOString() : undefined,
    };
    if (willComplete && set.reps === undefined && set.targetReps !== undefined) {
      patch.reps = Array.isArray(set.targetReps) ? set.targetReps[1] : set.targetReps;
    }
    if (willComplete && set.timeSec === undefined && set.targetTimeSec !== undefined) {
      patch.timeSec = set.targetTimeSec;
    }
    updateSet(entry.id, set.id, patch);

    if (!willComplete) return;

    if (settings?.restTimerSound !== false) playSetCompleted();
    if (settings?.restTimerVibration !== false) vibrate(30);

    const restSec = set.restSec || recommendedRest({
      exercise,
      goal: profile?.goal ?? 'muscle',
      experience: profile?.experience ?? 'beginner',
      reps: patch.reps ?? set.reps,
    });

    if (settings?.restTimerAutoStart !== false) {
      startRest(restSec, exercise.name);
      announce(`Serie registrata. Recupero di ${formatDuration(restSec)} avviato.`);
    } else {
      announce('Serie registrata.');
    }
  }, [updateSet, settings, profile, startRest, announce]);

  const addSet = useCallback((entry: SessionEntry) => {
    const last = entry.sets[entry.sets.length - 1];
    const fresh: LoggedSet = {
      id: createId('set'),
      kind: 'working',
      targetReps: last?.targetReps,
      targetTimeSec: last?.targetTimeSec,
      weightKg: last?.weightKg,
      timeSec: last?.targetTimeSec,
      restSec: last?.restSec ?? 90,
      completed: false,
    };
    setSession((current) => {
      if (!current) return current;
      const next: Session = {
        ...current,
        entries: current.entries.map((e) => (e.id === entry.id ? { ...e, sets: [...e.sets, fresh] } : e)),
      };
      void saveSession(next);
      return next;
    });
    announce('Serie aggiunta.');
  }, [announce]);

  const removeSet = useCallback((entryId: string, setId: string) => {
    setSession((current) => {
      if (!current) return current;
      const next: Session = {
        ...current,
        entries: current.entries.map((e) => (
          e.id === entryId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
        )),
      };
      void saveSession(next);
      return next;
    });
    announce('Serie rimossa.');
  }, [announce]);

  const addExercise = useCallback((exercise: Exercise) => {
    if (!session) return;
    const restSec = recommendedRest({
      exercise,
      goal: profile?.goal ?? 'muscle',
      experience: profile?.experience ?? 'beginner',
      reps: 10,
    });
    const entry: SessionEntry = {
      id: createId('entry'),
      exerciseId: exercise.id,
      order: session.entries.length,
      technique: 'straight',
      sets: Array.from({ length: 3 }, () => ({
        id: createId('set'),
        kind: 'working' as const,
        targetReps: exercise.loadType === 'time' ? undefined : ([8, 12] as [number, number]),
        targetTimeSec: exercise.loadType === 'time' ? 40 : undefined,
        timeSec: exercise.loadType === 'time' ? 40 : undefined,
        restSec,
        completed: false,
      })),
    };
    persist({ ...session, entries: [...session.entries, entry] });
    setPickerOpen(false);
    announce(`${exercise.name} aggiunto all'allenamento.`);
  }, [session, profile, persist, announce]);

  const removeEntry = useCallback((entryId: string) => {
    if (!session) return;
    persist({ ...session, entries: session.entries.filter((e) => e.id !== entryId) });
    announce('Esercizio rimosso.');
  }, [session, persist, announce]);

  const totals = useMemo(() => {
    if (!session) return { done: 0, total: 0, volume: 0 };
    let done = 0; let total = 0; let volume = 0;
    for (const entry of session.entries) {
      for (const set of entry.sets) {
        total += 1;
        if (set.completed) {
          done += 1;
          if (set.weightKg && set.reps) volume += set.weightKg * set.reps;
        }
      }
    }
    return { done, total, volume: Math.round(volume) };
  }, [session]);

  if (stored === undefined && !session) {
    return (
      <div className="empty-state">
        <p>Non c e nessun allenamento in corso.</p>
        <Button onClick={() => navigate('/')}>Torna alla home</Button>
      </div>
    );
  }

  if (!session) return <p className="muted">Caricamento...</p>;

  return (
    <>
      <header className="app-header">
        <IconButton label="Chiudi senza terminare" onClick={() => navigate('/')}>
          <X size={22} aria-hidden="true" />
        </IconButton>
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <h1 className="app-header__title" style={{ fontSize: 'var(--text-title-sm)' }}>{session.name}</h1>
          <p className="tiny muted num" style={{ margin: 0 }}>
            <Timer size={12} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {formatDuration(elapsed)}
            {' - '}{totals.done}/{totals.total} serie
            {totals.volume > 0 && <> {' - '}{totals.volume.toLocaleString('it-IT')} kg</>}
          </p>
        </div>
        <Button size="sm" variant="success" onClick={() => setConfirmFinish(true)}>
          <Flag size={16} aria-hidden="true" /> Fine
        </Button>
      </header>

      <div className="workout" style={{ paddingBlockEnd: 'calc(var(--layout-restbar-h) + var(--spacing) * 10)' }}>
        {session.entries.length === 0 && (
          <div className="empty-state">
            <p>Allenamento vuoto. Aggiungi il primo esercizio per iniziare.</p>
          </div>
        )}

        {session.entries.map((entry) => {
          const exercise = getExercise(entry.exerciseId);
          if (!exercise) return null;
          const previousSets = previous[entry.exerciseId];
          const doneCount = entry.sets.filter((s) => s.completed).length;

          return (
            <section key={entry.id} className="card workout-exercise" aria-labelledby={`ex-${entry.id}`}>
              <div className="workout-exercise__head">
                <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                <div style={{ flex: 1, minInlineSize: 0 }}>
                  <h2 id={`ex-${entry.id}`} className="section-title">{exercise.name}</h2>
                  <p className="tiny muted" style={{ margin: 0 }}>
                    {doneCount} di {entry.sets.length} serie completate
                  </p>
                </div>
                <IconButton label={`Rimuovi ${exercise.name} dall'allenamento`} onClick={() => removeEntry(entry.id)}>
                  <Trash2 size={18} aria-hidden="true" />
                </IconButton>
              </div>

              <ul className="set-list">
                {entry.sets.map((set, index) => (
                  <SetRow
                    key={set.id}
                    exercise={exercise}
                    set={set}
                    index={index}
                    units={settings?.units ?? 'kg'}
                    previous={previousSets?.[index]}
                    onChange={(patch) => updateSet(entry.id, set.id, patch)}
                    onToggleComplete={() => toggleComplete(entry, set, exercise)}
                  />
                ))}
              </ul>

              <div className="set-actions">
                <Button size="sm" variant="ghost" onClick={() => addSet(entry)}>
                  <Plus size={16} aria-hidden="true" /> Serie
                </Button>
                {entry.sets.length > 1 && (
                  <IconButton
                    label={`Togli l'ultima serie di ${exercise.name}`}
                    onClick={() => removeSet(entry.id, entry.sets[entry.sets.length - 1]!.id)}
                  >
                    <Minus size={18} aria-hidden="true" />
                  </IconButton>
                )}
                <a className="btn btn--sm btn--ghost" href={`/esercizi/${exercise.slug}`}>
                  Come si fa <ChevronRight size={16} aria-hidden="true" />
                </a>
              </div>
            </section>
          );
        })}

        <Button block variant="secondary" onClick={() => setPickerOpen(true)}>
          <Plus size={18} aria-hidden="true" /> Aggiungi esercizio
        </Button>

        <Button
          block variant="ghost" onClick={() => setConfirmDiscard(true)}
          style={{ marginBlockStart: 'calc(var(--spacing) * 4)', color: 'var(--color-danger-text)' }}
        >
          Annulla questo allenamento
        </Button>
      </div>

      <RestTimerBar />

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        alreadyAdded={session.entries.map((e) => e.exerciseId)}
      />

      <ConfirmDialog
        open={confirmFinish}
        title="Chiudere l allenamento?"
        message={totals.done === 0
          ? 'Non hai completato nessuna serie: verra salvato come allenamento vuoto.'
          : `Salviamo ${totals.done} serie completate. Le serie non spuntate non vengono registrate.`}
        confirmLabel="Termina"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={async () => {
          setConfirmFinish(false);
          const { session: finished } = await completeSession(session);
          void releaseWakeLock();
          navigate(`/allenamento/${finished.id}/riepilogo`, { replace: true });
        }}
      />

      <ConfirmDialog
        open={confirmDiscard}
        title="Annullare l allenamento?"
        message="Tutto quello che hai registrato in questa sessione viene perso. L azione non si puo annullare."
        confirmLabel="Annulla allenamento"
        destructive
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={async () => {
          setConfirmDiscard(false);
          await discardSession(session.id);
          void releaseWakeLock();
          navigate('/', { replace: true });
        }}
      />
    </>
  );
}
