import { useLiveQuery } from 'dexie-react-hooks';
import { Timer, Layers, Weight } from 'lucide-react';
import { formatDuration, getExercise } from '@tempra/core';
import { listSessions } from '../../db/repo';
import { PageHeader } from '../../components/ui/PageHeader';

export default function HistoryPage() {
  const sessions = useLiveQuery(() => listSessions(200), [], undefined);

  return (
    <>
      <PageHeader title="Storico" back="/progressi" />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 3)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>
        {sessions && sessions.length === 0 && (
          <div className="empty-state">
            <p>Nessun allenamento registrato, per ora.</p>
          </div>
        )}

        {sessions?.map((session) => (
          <details key={session.id} className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
            <summary style={{ cursor: 'pointer' }}>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{session.name}</span>
              <span className="tiny muted num" style={{ display: 'block', marginBlockStart: '2px' }}>
                {new Date(session.endedAt ?? session.startedAt).toLocaleDateString('it-IT', {
                  weekday: 'short', day: 'numeric', month: 'short', year: '2-digit',
                })}
                {' - '}<Timer size={11} aria-hidden="true" /> {formatDuration(session.durationSec)}
                {' - '}<Layers size={11} aria-hidden="true" /> {session.totalSets}
                {session.totalVolumeKg > 0 && <> {' - '}<Weight size={11} aria-hidden="true" /> {session.totalVolumeKg.toLocaleString('it-IT')} kg</>}
              </span>
            </summary>

            <ul className="exercise-list" style={{ marginBlockStart: 'calc(var(--spacing) * 3)' }}>
              {session.entries.map((entry) => (
                <li key={entry.id} style={{ padding: 'calc(var(--spacing) * 2) 0', borderBlockEnd: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    {getExercise(entry.exerciseId)?.name ?? entry.exerciseId}
                  </p>
                  <p className="tiny muted num" style={{ margin: 0 }}>
                    {entry.sets.map((set, i) => (
                      <span key={set.id}>
                        {i > 0 && '  -  '}
                        {set.timeSec
                          ? `${set.timeSec}s`
                          : `${set.weightKg ? `${set.weightKg} kg x ` : ''}${set.reps ?? 0}`}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </>
  );
}
