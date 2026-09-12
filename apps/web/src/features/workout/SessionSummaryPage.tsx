import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Zap, Timer, Layers, Weight, Home } from 'lucide-react';
import { formatDuration, getExercise, MUSCLE_GROUP_LABELS, type PersonalRecord } from '@tempra/core';
import { db, getSettings } from '../../db/db';
import { Button } from '../../components/ui/Button';
import { useAnnounce } from '../../lib/announce';

export default function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const announce = useAnnounce();

  const session = useLiveQuery(() => (sessionId ? db.sessions.get(sessionId) : undefined), [sessionId], undefined);
  const records = useLiveQuery(
    () => (sessionId
      ? db.records.filter((r) => r.sessionId === sessionId).toArray()
      : Promise.resolve([] as PersonalRecord[])),
    [sessionId],
    [] as PersonalRecord[],
  );
  useLiveQuery(() => getSettings(), [], undefined);

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
      </div>

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
    </div>
  );
}
