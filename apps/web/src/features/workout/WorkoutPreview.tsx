import { Play, Clock, Layers } from 'lucide-react';
import { formatReps, getExercise, supersetPositions, type Session } from '@tempra/core';
import { ExerciseImage } from '../../components/ExerciseImage';
import { SupersetTag } from '../../components/SupersetLink';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';

/** Stima grossolana: 40 secondi di lavoro per serie piu' la pausa prevista. */
function estimateMinutes(session: Session): number {
  const seconds = session.entries.reduce(
    (sum, entry) => sum + entry.sets.reduce((s, set) => s + 40 + set.restSec, 0),
    0,
  );
  return Math.max(5, Math.round(seconds / 300) * 5);
}

interface WorkoutPreviewProps {
  session: Session;
  onBegin: () => void;
  onDiscard: () => void;
}

/** Anteprima dell'allenamento: cosa ti aspetta, prima di premere "Inizia". */
export function WorkoutPreview({ session, onBegin, onDiscard }: WorkoutPreviewProps) {
  const positions = supersetPositions(session.entries);
  const totalSets = session.entries.reduce((sum, entry) => sum + entry.sets.length, 0);

  return (
    <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)', paddingBlock: 'calc(var(--spacing) * 4) calc(var(--spacing) * 24)' }}>
      <div className="row" style={{ gap: 'calc(var(--spacing) * 4)' }}>
        <span className="tiny muted num"><Layers size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {session.entries.length} esercizi, {totalSets} serie</span>
        <span className="tiny muted num"><Clock size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> circa {estimateMinutes(session)} minuti</span>
      </div>

      {session.entries.length === 0 ? (
        <div className="empty-state">
          <p>Allenamento libero: aggiungi gli esercizi mentre ti alleni.</p>
        </div>
      ) : (
        <ol className="exercise-list">
          {session.entries.map((entry, index) => {
            const exercise = getExercise(entry.exerciseId);
            if (!exercise) return null;
            const first = entry.sets[0];
            const position = positions[index] ?? null;
            return (
              <li key={entry.id} className="card" data-superset={position ? '' : undefined} style={{ padding: 'calc(var(--spacing) * 3)' }}>
                {position && <SupersetTag position={position} />}
                <div className="row" style={{ gap: 'calc(var(--spacing) * 3)' }}>
                  <ExerciseImage exercise={exercise} size="thumb" className="exercise-thumb" />
                  <div style={{ flex: 1, minInlineSize: 0 }}>
                    <p className="exercise-item__name" style={{ margin: 0 }}>{exercise.name}</p>
                    <p className="tiny muted num" style={{ margin: '2px 0 0' }}>
                      {entry.sets.length} serie x {first?.targetTimeSec ? `${first.targetTimeSec} s` : formatReps(first?.targetReps)}
                      {first?.weightKg ? ` - ${String(first.weightKg).replace('.', ',')} kg` : ''}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Button variant="ghost" block onClick={onDiscard} style={{ color: 'var(--color-danger-text)' }}>
        Annulla questo allenamento
      </Button>

      <BottomActionBar>
        <Button block size="lg" onClick={onBegin}>
          <Play size={20} aria-hidden="true" /> Inizia
        </Button>
      </BottomActionBar>
    </div>
  );
}
