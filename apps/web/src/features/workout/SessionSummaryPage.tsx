import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Zap, Timer, Layers, Weight, Home, Repeat, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import {
  estimateCalories, formatDuration, getExercise, MUSCLE_GROUP_LABELS, sessionStats,
  type MuscleGroup, type PersonalRecord, type Session,
} from '@tempra/core';
import { db, getProfile, getSettings } from '../../db/db';
import { Chart } from '../../components/Chart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { deleteCompletedSession } from '../../db/repo';
import { useAnnounce } from '../../lib/announce';

export default function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const session = useLiveQuery(() => (sessionId ? db.sessions.get(sessionId) : undefined), [sessionId], undefined);
  const records = useLiveQuery(
    () => (sessionId
      ? db.records.filter((r) => r.sessionId === sessionId && !r.deletedAt).toArray()
      : Promise.resolve([] as PersonalRecord[])),
    [sessionId],
    [] as PersonalRecord[],
  );
  useLiveQuery(() => getSettings(), [], undefined);
  const profile = useLiveQuery(() => getProfile(), [], undefined);
  const previous = useLiveQuery(async (): Promise<Session | null> => {
    if (!session?.planDayId) return null;
    const candidates = await db.sessions
      .where('status').equals('completed')
      .filter((s) => s.planDayId === session.planDayId && s.id !== session.id && s.startedAt < session.startedAt)
      .toArray();
    return candidates.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
  }, [session?.id], null);

  useEffect(() => {
    if (!session) return;
    announce(
      records.length > 0
        ? `Allenamento completato. Hai battuto ${records.length} record personali.`
        : 'Allenamento completato.',
      'assertive',
    );
  }, [session?.id, records.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <p className="muted">Caricamento...</p>;

  const groups = [...new Set(
    session.entries.flatMap((e) => getExercise(e.exerciseId)?.muscleGroups ?? []),
  )];
  const stats = sessionStats(session);
  const calories = estimateCalories(session.durationSec, profile?.weightKg);
  const volumeChange = previous && previous.totalVolumeKg > 0
    ? Math.round(((session.totalVolumeKg - previous.totalVolumeKg) / previous.totalVolumeKg) * 100)
    : null;

  const shortName = (id: string) => {
    const name = getExercise(id)?.name ?? id;
    return name.length > 12 ? `${name.slice(0, 11)}.` : name;
  };
  const useVolume = stats.perExercise.some((row) => row.volumeKg > 0);
  const perExercisePoints = stats.perExercise.map((row) => ({
    label: shortName(row.exerciseId),
    value: useVolume ? row.volumeKg : row.reps,
  }));

  const setsByGroup: Partial<Record<MuscleGroup, number>> = {};
  for (const row of stats.perExercise) {
    for (const group of getExercise(row.exerciseId)?.muscleGroups ?? []) {
      setsByGroup[group] = (setsByGroup[group] ?? 0) + row.sets;
    }
  }
  const groupRows = Object.entries(setsByGroup)
    .map(([group, sets]) => ({ group: group as MuscleGroup, sets: sets ?? 0 }))
    .sort((a, b) => b.sets - a.sets);
  const maxGroupSets = groupRows[0]?.sets ?? 1;

  return (
    <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)', paddingBlockStart: 'calc(var(--layout-safe-top) + var(--spacing) * 8)' }}>
      <div style={{ textAlign: 'center' }}>
        <p className="label-caps">Allenamento completato</p>
        <h1 className="page-title" style={{ marginBlockStart: 'calc(var(--spacing) * 1)' }}>{session.name}</h1>
        <p className="muted tiny">
          {new Date(session.endedAt ?? session.startedAt).toLocaleDateString('it-IT', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      <div className="stat-grid">
        <div className="card stat-tile">
          <Timer size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{formatDuration(session.durationSec)}</span>
          <span className="tiny muted">durata</span>
        </div>
        <div className="card stat-tile">
          <Layers size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{session.totalSets}</span>
          <span className="tiny muted">serie</span>
        </div>
        <div className="card stat-tile">
          <Weight size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{session.totalVolumeKg.toLocaleString('it-IT')}</span>
          <span className="tiny muted">kg sollevati</span>
        </div>
        <div className="card stat-tile">
          <Repeat size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{stats.reps}</span>
          <span className="tiny muted">ripetizioni</span>
        </div>
        <div className="card stat-tile">
          <Flame size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{calories === null ? '-' : `~${calories}`}</span>
          <span className="tiny muted">kcal stimate</span>
        </div>
        <div className="card stat-tile">
          <Zap size={18} aria-hidden="true" />
          <span className="stat-tile__value num">{records.length}</span>
          <span className="tiny muted">record</span>
        </div>
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        {calories === null
          ? 'Per stimare le calorie serve il tuo peso: aggiungilo in Impostazioni, nel profilo.'
          : 'Calorie stimate con 3,5 MET (Compendium of Physical Activities 2024) sulla durata della seduta: e un ordine di grandezza, non una misura.'}
      </p>

      {previous && (
        <section className="card" style={{ padding: 'calc(var(--spacing) * 4)' }} aria-labelledby="compare-title">
          <h2 id="compare-title" className="label-caps" style={{ margin: 0 }}>Rispetto alla volta scorsa</h2>
          <p style={{ margin: 'calc(var(--spacing) * 2) 0 0' }} className="num">
            {volumeChange !== null && (
              <>
                {volumeChange >= 0
                  ? <TrendingUp size={16} aria-hidden="true" style={{ verticalAlign: '-3px', color: 'var(--color-success-text)' }} />
                  : <TrendingDown size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} />}
                {' '}Volume {volumeChange >= 0 ? `+${volumeChange}` : volumeChange}%
                {' '}({previous.totalVolumeKg.toLocaleString('it-IT')} kg il{' '}
                {new Date(previous.startedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}).{' '}
              </>
            )}
            Durata {formatDuration(previous.durationSec)} allora, {formatDuration(session.durationSec)} oggi.
          </p>
        </section>
      )}

      {perExercisePoints.length > 1 && (
        <section className="card" style={{ padding: 'calc(var(--spacing) * 4)' }} aria-labelledby="per-exercise-title">
          <h2 id="per-exercise-title" className="label-caps" style={{ marginBlock: '0 calc(var(--spacing) * 2)' }}>
            {useVolume ? 'Volume per esercizio' : 'Ripetizioni per esercizio'}
          </h2>
          <Chart
            title={useVolume ? 'Volume per esercizio' : 'Ripetizioni per esercizio'}
            type="bar"
            unit={useVolume ? 'kg' : 'rip'}
            points={perExercisePoints}
            summary={`${perExercisePoints.length} esercizi. Il piu impegnativo: ${
              [...perExercisePoints].sort((a, b) => b.value - a.value)[0]!.label}.`}
          />
        </section>
      )}

      {groupRows.length > 0 && (
        <section className="card" style={{ padding: 'calc(var(--spacing) * 4)' }} aria-labelledby="groups-title">
          <h2 id="groups-title" className="label-caps" style={{ marginBlock: '0 calc(var(--spacing) * 3)' }}>
            Serie per distretto
          </h2>
          <ul className="muscle-bars">
            {groupRows.map(({ group, sets }) => (
              <li key={group}>
                <span className="muscle-bars__label">{MUSCLE_GROUP_LABELS[group]}</span>
                <span className="muscle-bars__track" aria-hidden="true">
                  <span style={{ inlineSize: `${(sets / maxGroupSets) * 100}%` }} />
                </span>
                <span className="muscle-bars__value num">{sets}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {records.length > 0 && (
        <section className="callout callout--success" aria-labelledby="pr-title">
          <Zap size={20} aria-hidden="true" />
          <div>
            <strong id="pr-title">
              {records.length === 1 ? 'Un nuovo record personale' : `${records.length} nuovi record personali`}
            </strong>
            <ul style={{ margin: '6px 0 0', paddingInlineStart: '1.1em' }}>
              {records.map((record) => (
                <li key={record.id} className="tiny">
                  {getExercise(record.exerciseId)?.name}:{' '}
                  {record.type === 'weight' && <>nuovo carico massimo <span className="num">{record.value} kg</span></>}
                  {record.type === 'reps' && <>nuovo primato di <span className="num">{record.value}</span> ripetizioni</>}
                  {record.type === 'volume' && <>miglior serie da <span className="num">{Math.round(record.value)} kg</span> di volume</>}
                  {record.type === 'e1rm' && <>massimale stimato a <span className="num">{Math.round(record.value)} kg</span></>}
                  {record.type === 'time' && <>nuovo tempo massimo di <span className="num">{record.value} s</span></>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="detail-title">
        <h2 id="detail-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
          Cosa hai fatto
        </h2>
        {groups.length > 0 && (
          <p className="tiny muted" style={{ marginBlockStart: 0 }}>
            Distretti allenati: {groups.map((g) => MUSCLE_GROUP_LABELS[g]).join(', ')}.
          </p>
        )}
        <ul className="exercise-list">
          {session.entries.map((entry) => {
            const exercise = getExercise(entry.exerciseId);
            return (
              <li key={entry.id} className="card" style={{ padding: 'calc(var(--spacing) * 3)' }}>
                <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>{exercise?.name}</p>
                <p className="tiny muted num" style={{ margin: '2px 0 0' }}>
                  {entry.sets.map((set, i) => (
                    <span key={set.id}>
                      {i > 0 && '  -  '}
                      {set.timeSec
                        ? `${set.timeSec}s`
                        : `${set.weightKg ? `${set.weightKg} kg x ` : ''}${set.reps ?? 0}`}
                      {set.prType ? ' *' : ''}
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <Button size="lg" block onClick={() => navigate('/', { replace: true })}>
        <Home size={20} aria-hidden="true" /> Torna alla home
      </Button>

      <Button variant="ghost" block style={{ color: 'var(--color-danger-text)' }} onClick={() => setConfirmDelete(true)}>
        Era una prova: elimina questo allenamento
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminare l allenamento?"
        message="Sparisce dallo storico e dalle statistiche, insieme ai record di questa seduta, anche sugli altri dispositivi collegati. Non si puo annullare."
        confirmLabel="Elimina"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await deleteCompletedSession(session.id);
          announce('Allenamento eliminato.');
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}
