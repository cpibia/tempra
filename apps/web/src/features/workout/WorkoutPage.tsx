import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronLeft, ChevronRight, Flag, ListOrdered, Minus, Play, Plus, Square, Timer, Trash2, X, Check, Info,
} from 'lucide-react';
import {
  afterSetCompleted, createId, currentSetIndex, formatDuration, formatReps, getExercise,
  isLinkedWithNext, linkWithNext, nextEntryWithWork, normalizeSupersets, recommendedRest,
  setPhase, supersetPositions, unlinkFromNext,
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
import { SupersetTag } from '../../components/SupersetLink';
import { ExercisePicker } from '../catalog/ExercisePicker';
import { RestTimerBar } from './RestTimerBar';
import { SetStopwatch } from './SetStopwatch';
import { SetLogPanel, type SetValues } from './SetLogPanel';
import { WorkoutPreview } from './WorkoutPreview';
import { ExerciseListSheet } from './ExerciseListSheet';

const ADVANCE_DELAY_SEC = 5;

type PreviousSets = Record<string, { weightKg?: number; reps?: number; timeSec?: number }[]>;

const secondsSince = (iso: string): number =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));

/**
 * Allenamento guidato: un esercizio alla volta, una serie alla volta.
 *
 * Avvia serie -> cronometro -> Fine -> parte il recupero e intanto si
 * registrano ripetizioni e carico -> di nuovo Avvia. Finito l'esercizio si
 * passa al successivo dopo un breve conto alla rovescia, sempre annullabile.
 * Le frecce e l'elenco permettono di cambiare ordine in qualsiasi momento.
 *
 * Ogni passaggio scrive subito su IndexedDB e lo stato della serie vive nei
 * dati (inizio e durata), non nel componente: un ricaricamento o un telefono
 * che sospende la pagina riprendono esattamente dallo stesso punto.
 */
export default function WorkoutPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const startRest = useRestTimer((s) => s.start);
  const stopRest = useRestTimer((s) => s.stop);

  const stored = useLiveQuery(() => getActiveSession(), [], undefined);
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const profile = useLiveQuery(() => getProfile(), [], undefined);

  const [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<PreviousSets>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [advance, setAdvance] = useState<{ index: number; endsAt: number } | null>(null);
  const [advanceLeft, setAdvanceLeft] = useState(ADVANCE_DELAY_SEC);
  const [elapsed, setElapsed] = useState(0);
  const hydrated = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stored && !hydrated.current) {
      hydrated.current = true;
      setSession(stored);
    }
    if (stored === undefined && hydrated.current) setSession(null);
  }, [stored]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const map: PreviousSets = {};
      for (const entry of session.entries) {
        if (map[entry.exerciseId]) continue;
        const performance = await getLastPerformance(entry.exerciseId);
        if (performance) {
          map[entry.exerciseId] = performance.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, timeSec: s.timeSec }));
        }
      }
      setPrevious(map);
    };
    void load();
    // Si ricalcola solo quando cambia l'insieme degli esercizi, non a ogni tocco.
  }, [session?.entries.map((e) => e.exerciseId).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const begun = Boolean(session && (session.begunAt || session.entries.some((e) => e.sets.some((s) => s.completed))));
  const clockStart = session?.begunAt ?? session?.startedAt;

  useEffect(() => {
    if (!clockStart || !begun) return;
    const compute = () => setElapsed(secondsSince(clockStart));
    compute();
    const id = window.setInterval(compute, 1000);
    return () => window.clearInterval(id);
  }, [clockStart, begun]);

  useEffect(() => {
    if (!session || !begun || !settings?.keepAwake) return;
    void requestWakeLock();
    return () => { void releaseWakeLock(); };
  }, [session?.id, begun, settings?.keepAwake]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Ogni modifica scrive subito su IndexedDB: nessun pulsante "salva", nessun dato perso. */
  const mutate = useCallback((change: (current: Session) => Session) => {
    setSession((current) => {
      if (!current) return current;
      const next = change(current);
      void saveSession(next);
      return next;
    });
  }, []);

  const patchSet = useCallback((entryId: string, setId: string, patch: Partial<LoggedSet>) => {
    mutate((current) => ({
      ...current,
      entries: current.entries.map((entry) => entry.id !== entryId ? entry : {
        ...entry,
        sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
      }),
    }));
  }, [mutate]);

  const entries = session?.entries ?? [];
  const storedIndex = entries.findIndex((e) => e.id === session?.currentEntryId);
  const currentIndex = storedIndex >= 0
    ? storedIndex
    : Math.max(0, entries.findIndex((e) => e.sets.some((s) => !s.completed)));
  const entry = entries[currentIndex];
  const exercise = entry ? getExercise(entry.exerciseId) : undefined;

  const goTo = useCallback((index: number, reason?: string) => {
    setAdvance(null);
    setEditingSetId(null);
    mutate((current) => {
      const target = current.entries[index];
      return target ? { ...current, currentEntryId: target.id } : current;
    });
    const target = session?.entries[index];
    const name = target ? getExercise(target.exerciseId)?.name : undefined;
    if (name) announce(reason ? `${reason} ${name}.` : name);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
    });
  }, [mutate, session?.entries, announce]);

  // Conto alla rovescia verso l'esercizio successivo: si annulla con un tocco
  // e si disattiva dalle impostazioni, perche' un limite di tempo imposto non
  // e' accettabile per chi ha bisogno di piu' calma (WCAG 2.2.1).
  useEffect(() => {
    if (!advance) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((advance.endsAt - Date.now()) / 1000));
      setAdvanceLeft(left);
      if (left === 0) goTo(advance.index, 'Prossimo esercizio:');
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [advance, goTo]);

  const restFor = (set: LoggedSet, ex: Exercise): number => set.restSec || recommendedRest({
    exercise: ex,
    goal: profile?.goal ?? 'muscle',
    experience: profile?.experience ?? 'beginner',
    reps: set.reps,
  });

  /** Fine della serie: il recupero parte subito, poi si registrano i valori. */
  const finishSet = (target: SessionEntry, set: LoggedSet, ex: Exercise, timed: boolean) => {
    const durationSec = timed && set.startedAt ? secondsSince(set.startedAt) : 0;
    patchSet(target.id, set.id, { durationSec });

    const hypothetical = entries.map((e) => e.id !== target.id ? e : {
      ...e, sets: e.sets.map((s) => (s.id === set.id ? { ...s, completed: true } : s)),
    });
    const outcome = afterSetCompleted(hypothetical, currentIndex);
    const position = supersetPositions(entries)[currentIndex];

    if (outcome.kind !== 'superset-next' && outcome.kind !== 'workout-done' && settings?.restTimerAutoStart !== false) {
      const seconds = restFor(set, ex);
      startRest(seconds, position ? `Superset ${position.letter}` : ex.name);
      announce(`Serie finita. Recupero di ${formatDuration(seconds)} avviato. Inserisci ripetizioni e carico.`);
    } else {
      announce('Serie finita. Inserisci ripetizioni e carico.');
    }
  };

  const saveSet = (target: SessionEntry, set: LoggedSet, values: SetValues) => {
    const editing = set.completed;
    patchSet(target.id, set.id, {
      ...values,
      completed: true,
      completedAt: set.completedAt ?? new Date().toISOString(),
      durationSec: set.durationSec || undefined,
    });
    setEditingSetId(null);
    if (editing) {
      announce('Serie corretta.');
      return;
    }
    if (settings?.restTimerSound !== false) playSetCompleted();
    if (settings?.restTimerVibration !== false) vibrate(30);

    const updated = entries.map((e) => e.id !== target.id ? e : {
      ...e, sets: e.sets.map((s) => (s.id === set.id ? { ...s, completed: true } : s)),
    });
    const outcome = afterSetCompleted(updated, currentIndex);

    switch (outcome.kind) {
      case 'superset-next':
        goTo(outcome.entryIndex, 'Serie salvata. Superset, ora senza pausa:');
        break;
      case 'rest':
        if (outcome.entryIndex !== currentIndex) goTo(outcome.entryIndex, 'Serie salvata. Fine giro, durante il recupero si torna a');
        else announce('Serie salvata.');
        break;
      case 'exercise-done': {
        const next = updated[outcome.nextEntryIndex];
        const name = next ? getExercise(next.exerciseId)?.name : '';
        if (settings?.autoAdvance !== false) {
          setAdvance({ index: outcome.nextEntryIndex, endsAt: Date.now() + ADVANCE_DELAY_SEC * 1000 });
          announce(`Esercizio completato. Fra ${ADVANCE_DELAY_SEC} secondi: ${name}.`);
        } else {
          setAdvance(null);
          announce(`Esercizio completato. Il prossimo e ${name}.`);
        }
        break;
      }
      case 'workout-done':
        stopRest();
        announce('Hai completato tutte le serie. Premi Fine per vedere com e andata.', 'assertive');
        break;
    }
  };

  const addSet = (target: SessionEntry) => {
    const last = target.sets[target.sets.length - 1];
    const fresh: LoggedSet = {
      id: createId('set'),
      kind: 'working',
      targetReps: last?.targetReps,
      targetTimeSec: last?.targetTimeSec,
      targetWeightKg: last?.targetWeightKg,
      weightKg: last?.weightKg,
      restSec: last?.restSec ?? 90,
      completed: false,
    };
    mutate((current) => ({
      ...current,
      entries: current.entries.map((e) => (e.id === target.id ? { ...e, sets: [...e.sets, fresh] } : e)),
    }));
    setAdvance(null);
    announce('Serie aggiunta.');
  };

  const removeLastSet = (target: SessionEntry) => {
    const last = target.sets[target.sets.length - 1];
    if (!last || last.completed || target.sets.length < 2) return;
    mutate((current) => ({
      ...current,
      entries: current.entries.map((e) => (e.id === target.id ? { ...e, sets: e.sets.slice(0, -1) } : e)),
    }));
    announce('Serie tolta.');
  };

  const addExercise = (picked: Exercise) => {
    if (!session) return;
    const restSec = recommendedRest({
      exercise: picked, goal: profile?.goal ?? 'muscle', experience: profile?.experience ?? 'beginner', reps: 10,
    });
    const timed = picked.loadType === 'time';
    const added: SessionEntry = {
      id: createId('entry'),
      exerciseId: picked.id,
      order: session.entries.length,
      technique: 'straight',
      sets: Array.from({ length: 3 }, () => ({
        id: createId('set'),
        kind: 'working' as const,
        targetReps: timed ? undefined : ([8, 12] as [number, number]),
        targetTimeSec: timed ? 40 : undefined,
        restSec,
        completed: false,
      })),
    };
    mutate((current) => ({ ...current, entries: [...current.entries, added], currentEntryId: added.id }));
    setPickerOpen(false);
    setListOpen(false);
    announce(`${picked.name} aggiunto all allenamento.`);
  };

  const removeEntry = (target: SessionEntry) => {
    mutate((current) => {
      const remaining = normalizeSupersets(current.entries.filter((e) => e.id !== target.id));
      const index = current.entries.findIndex((e) => e.id === target.id);
      const fallback = remaining[Math.min(index, remaining.length - 1)];
      return { ...current, entries: remaining, currentEntryId: fallback?.id };
    });
    announce('Esercizio rimosso.');
  };

  const toggleSuperset = (index: number) => {
    const linked = isLinkedWithNext(entries, index);
    mutate((current) => ({
      ...current,
      entries: linked ? unlinkFromNext(current.entries, index) : linkWithNext(current.entries, index),
    }));
    announce(linked ? 'Esercizi separati.' : 'Esercizi in superset: si alternano senza pausa.');
  };

  if (stored === undefined && !session) {
    return (
      <div className="empty-state">
        <p>Non c e nessun allenamento in corso.</p>
        <Button onClick={() => navigate('/')}>Torna alla home</Button>
      </div>
    );
  }

  if (!session) return <p className="muted">Caricamento...</p>;

  const totalSets = entries.reduce((sum, e) => sum + e.sets.length, 0);
  const doneSets = entries.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0);
  const allDone = totalSets > 0 && doneSets === totalSets;

  const header = (
    <header className="app-header">
      <IconButton label="Chiudi senza terminare" onClick={() => navigate('/')}>
        <X size={22} aria-hidden="true" />
      </IconButton>
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <h1 className="app-header__title" style={{ fontSize: 'var(--text-title-sm)' }}>{session.name}</h1>
        <p className="tiny muted num workout-meta">
          {begun
            ? <><Timer size={13} aria-hidden="true" /> {formatDuration(elapsed)}<span aria-hidden="true">·</span>{doneSets}/{totalSets}<span className="workout-meta__unit"> serie</span></>
            : 'Anteprima'}
        </p>
      </div>
      {begun && (
        <Button size="sm" variant="success" onClick={() => setConfirmFinish(true)}>
          <Flag size={16} aria-hidden="true" /> Fine
        </Button>
      )}
    </header>
  );

  const dialogs = (
    <>
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        alreadyAdded={entries.map((e) => e.exerciseId)}
      />
      <ConfirmDialog
        open={confirmFinish}
        title="Chiudere l allenamento?"
        message={doneSets === 0
          ? 'Non hai completato nessuna serie: verra salvato come allenamento vuoto.'
          : allDone
            ? `Ottimo lavoro: ${doneSets} serie completate.`
            : `Salviamo ${doneSets} serie completate. Le altre non vengono registrate.`}
        confirmLabel="Termina"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={async () => {
          setConfirmFinish(false);
          stopRest();
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
          stopRest();
          await discardSession(session.id);
          void releaseWakeLock();
          navigate('/', { replace: true });
        }}
      />
    </>
  );

  if (!begun) {
    return (
      <>
        {header}
        <WorkoutPreview
          session={session}
          onDiscard={() => setConfirmDiscard(true)}
          onBegin={() => {
            const now = new Date().toISOString();
            const first = entries.find((e) => e.sets.some((s) => !s.completed));
            mutate((current) => ({ ...current, begunAt: now, startedAt: now, currentEntryId: first?.id }));
            announce('Allenamento iniziato.');
            requestAnimationFrame(() => headingRef.current?.focus());
          }}
        />
        {dialogs}
      </>
    );
  }

  if (!entry || !exercise) {
    return (
      <>
        {header}
        <div className="workout">
          <div className="empty-state">
            <p>Allenamento vuoto. Aggiungi il primo esercizio per iniziare.</p>
          </div>
          <Button block variant="secondary" onClick={() => setPickerOpen(true)}>
            <Plus size={18} aria-hidden="true" /> Aggiungi esercizio
          </Button>
        </div>
        {dialogs}
      </>
    );
  }

  const position = supersetPositions(entries)[currentIndex] ?? null;
  const setIndex = currentSetIndex(entry);
  const set = setIndex >= 0 ? entry.sets[setIndex] : undefined;
  const phase = set ? setPhase(set) : 'done';
  const editingSet = editingSetId ? entry.sets.find((s) => s.id === editingSetId) : undefined;
  const isTimed = exercise.loadType === 'time' || Boolean(set?.targetTimeSec);
  const timeSets = settings?.timeSets !== false;
  const weightStep = settings?.weightStepKg ?? 2.5;
  const prior = set ? previous[entry.exerciseId]?.[setIndex] : undefined;
  const nextWithWork = nextEntryWithWork(entries, currentIndex);
  const nextExercise = nextWithWork >= 0 ? getExercise(entries[nextWithWork]!.exerciseId) : undefined;

  const targetLabel = set
    ? isTimed ? `${set.targetTimeSec ?? 0} secondi` : `${formatReps(set.targetReps)} ripetizioni`
    : '';
  const weightLabel = set?.weightKg ? `${String(set.weightKg).replace('.', ',')} kg` : null;

  return (
    <>
      {header}

      <div className="workout guided" style={{ paddingBlockEnd: 'calc(var(--layout-restbar-h) + var(--spacing) * 10)' }}>
        <nav className="guided-nav" aria-label="Esercizi">
          <IconButton
            label="Esercizio precedente" disabled={currentIndex === 0}
            onClick={() => goTo(currentIndex - 1)}
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </IconButton>
          <button type="button" className="guided-nav__list" onClick={() => setListOpen(true)}>
            <ListOrdered size={16} aria-hidden="true" />
            <span className="num">Esercizio {currentIndex + 1} di {entries.length}</span>
          </button>
          <IconButton
            label="Esercizio successivo" disabled={currentIndex === entries.length - 1}
            onClick={() => goTo(currentIndex + 1)}
          >
            <ChevronRight size={24} aria-hidden="true" />
          </IconButton>
        </nav>

        <section
          key={entry.id}
          className="card guided-stage"
          data-superset={position ? '' : undefined}
          data-focus={editingSet || phase === 'running' || phase === 'logging' ? '' : undefined}
          aria-labelledby="guided-title"
        >
          {position && <SupersetTag position={position} />}
          <div className="guided-stage__media">
            <ExerciseImage key={exercise.id} exercise={exercise} animated size="full" className="guided-stage__image" />
          </div>
          <h2 id="guided-title" ref={headingRef} tabIndex={-1} className="page-title guided-stage__title">
            {exercise.name}
          </h2>
          {entry.notes && (
            <p className="callout callout--info guided-stage__note">
              <Info size={18} aria-hidden="true" /> <span>{entry.notes}</span>
            </p>
          )}

          <ol className="set-dots" aria-label="Serie dell esercizio">
            {entry.sets.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="set-dot"
                  data-state={s.completed ? 'done' : i === setIndex ? 'current' : 'todo'}
                  disabled={!s.completed}
                  onClick={() => { setAdvance(null); setEditingSetId(s.id); }}
                  aria-label={s.completed
                    ? `Serie ${i + 1}: ${s.timeSec && isTimed ? `${s.timeSec} secondi` : `${s.reps ?? 0} ripetizioni`}${s.weightKg ? ` con ${s.weightKg} kg` : ''}. Tocca per correggere`
                    : `Serie ${i + 1}${i === setIndex ? ', la prossima' : ''}`}
                >
                  {s.completed
                    ? <span className="num">{isTimed ? `${s.timeSec ?? 0}s` : `${s.weightKg ? `${s.weightKg}x` : ''}${s.reps ?? 0}`}</span>
                    : <span className="num">{i + 1}</span>}
                </button>
              </li>
            ))}
          </ol>

          {editingSet ? (
            <SetLogPanel
              key={editingSet.id}
              exercise={exercise}
              set={editingSet}
              setNumber={entry.sets.indexOf(editingSet) + 1}
              weightStep={weightStep}
              editing
              onCancel={() => setEditingSetId(null)}
              onSave={(values) => saveSet(entry, editingSet, values)}
            />
          ) : set ? (
            <>
              <div className="guided-target">
                <p className="guided-target__count" style={{ margin: 0 }}>Serie {setIndex + 1} di {entry.sets.length}</p>
                <p className="guided-target__value num">
                  {targetLabel}{weightLabel && <> <span aria-hidden="true">-</span> {weightLabel}</>}
                </p>
                {prior && (
                  <p className="tiny muted num" style={{ margin: 0 }}>
                    L ultima volta {prior.timeSec && isTimed ? `${prior.timeSec} s` : `${prior.weightKg ? `${prior.weightKg} kg x ` : ''}${prior.reps ?? '-'}`}
                  </p>
                )}
              </div>

              {phase === 'pending' && (
                <div className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }}>
                  {timeSets ? (
                    <>
                      <Button block size="lg" onClick={() => {
                        stopRest();
                        setAdvance(null);
                        patchSet(entry.id, set.id, { startedAt: new Date().toISOString() });
                        announce(`Serie ${setIndex + 1} avviata.`);
                      }}>
                        <Play size={20} aria-hidden="true" /> Avvia serie {setIndex + 1}
                      </Button>
                      <Button block variant="ghost" onClick={() => finishSet(entry, set, exercise, false)}>
                        Registra senza cronometro
                      </Button>
                    </>
                  ) : (
                    <Button block size="lg" onClick={() => finishSet(entry, set, exercise, false)}>
                      <Check size={20} aria-hidden="true" /> Serie {setIndex + 1} fatta
                    </Button>
                  )}
                </div>
              )}

              {phase === 'running' && set.startedAt && (
                <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
                  <SetStopwatch
                    startedAt={set.startedAt}
                    targetSec={isTimed ? set.targetTimeSec : undefined}
                    sound={settings?.restTimerSound !== false}
                    vibration={settings?.restTimerVibration !== false}
                  />
                  <Button block size="lg" variant="success" onClick={() => finishSet(entry, set, exercise, true)}>
                    <Square size={18} aria-hidden="true" /> Fine serie
                  </Button>
                  <Button block variant="ghost" onClick={() => {
                    patchSet(entry.id, set.id, { startedAt: undefined });
                    announce('Serie annullata.');
                  }}>
                    Annulla la serie
                  </Button>
                </div>
              )}

              {phase === 'logging' && (
                <SetLogPanel
                  key={set.id}
                  exercise={exercise}
                  set={set}
                  setNumber={setIndex + 1}
                  weightStep={weightStep}
                  onSave={(values) => saveSet(entry, set, values)}
                />
              )}
            </>
          ) : (
            <div className="guided-done" role="status">
              <p className="section-title guided-done__title">
                <Check size={18} aria-hidden="true" /> Esercizio completato
              </p>
              {advance && nextExercise ? (
                <>
                  <p className="guided-done__countdown">
                    Prossimo: <strong>{nextExercise.name}</strong>
                    <span className="num" aria-hidden="true"> fra {advanceLeft}</span>
                  </p>
                  <div className="guided-done__track" aria-hidden="true">
                    <span style={{ animationDuration: `${ADVANCE_DELAY_SEC}s` }} />
                  </div>
                  <div className="grid-2">
                    <Button variant="ghost" onClick={() => { setAdvance(null); announce('Passaggio automatico annullato.'); }}>
                      Resta qui
                    </Button>
                    <Button onClick={() => goTo(advance.index)}>Vai ora</Button>
                  </div>
                </>
              ) : nextExercise ? (
                <Button block size="lg" onClick={() => goTo(nextWithWork)}>
                  Prossimo: {nextExercise.name} <ChevronRight size={18} aria-hidden="true" />
                </Button>
              ) : (
                <Button block size="lg" variant="success" onClick={() => setConfirmFinish(true)}>
                  <Flag size={18} aria-hidden="true" /> Termina e guarda le statistiche
                </Button>
              )}
            </div>
          )}
        </section>

        <div className="set-actions" style={{ flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => addSet(entry)}>
            <Plus size={16} aria-hidden="true" /> Serie
          </Button>
          {entry.sets.length > 1 && !entry.sets[entry.sets.length - 1]!.completed && (
            <IconButton label={`Togli l ultima serie di ${exercise.name}`} onClick={() => removeLastSet(entry)}>
              <Minus size={18} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton label={`Rimuovi ${exercise.name} dall allenamento`} onClick={() => removeEntry(entry)}>
            <Trash2 size={18} aria-hidden="true" />
          </IconButton>
          <a className="btn btn--sm btn--ghost" href={`/esercizi/${exercise.slug}`}>
            Come si fa <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>

      <RestTimerBar />

      <ExerciseListSheet
        open={listOpen}
        session={session}
        currentIndex={currentIndex}
        onClose={() => setListOpen(false)}
        onSelect={(index) => { setListOpen(false); goTo(index); }}
        onToggleSuperset={toggleSuperset}
        onAddExercise={() => setPickerOpen(true)}
      />
      {dialogs}
    </>
  );
}
