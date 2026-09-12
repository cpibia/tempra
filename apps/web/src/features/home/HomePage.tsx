import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, Sparkles, Plus, ChevronRight, Flame, CalendarCheck } from 'lucide-react';
import { formatDuration, getExercise, MUSCLE_GROUP_LABELS } from '@tempra/core';
import { getProfile } from '../../db/db';
import { getActivePlan, getActiveSession, listSessions, startSessionFromDay, startEmptySession } from '../../db/repo';
import { Button } from '../../components/ui/Button';
import { useAnnounce } from '../../lib/announce';

/** Numero di sessioni della settimana corrente, usato per l'aderenza. */
function sessionsThisWeek(dates: string[]): number {
  const now = new Date();
  const monday = new Date(now);
  const weekday = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - weekday);
  monday.setHours(0, 0, 0, 0);
  return dates.filter((d) => new Date(d) >= monday).length;
}

export default function HomePage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const profile = useLiveQuery(() => getProfile(), [], undefined);
  const plan = useLiveQuery(() => getActivePlan(), [], undefined);
  const active = useLiveQuery(() => getActiveSession(), [], undefined);
  const history = useLiveQuery(() => listSessions(30), [], undefined);

  const done = history ? sessionsThisWeek(history.map((s) => s.endedAt ?? s.startedAt)) : 0;
  const target = profile?.daysPerWeek ?? 3;

  // Il prossimo giorno proposto e' quello meno recente fra quelli della scheda:
  // cosi' la rotazione resta corretta anche saltando una seduta.
  const lastDayIds = new Set((history ?? []).slice(0, plan?.days.length ?? 0).map((s) => s.planDayId));
  const nextDay = plan?.days.find((d) => !lastDayIds.has(d.id)) ?? plan?.days[0];

  const start = async () => {
    if (!plan || !nextDay) return;
    const session = await startSessionFromDay(plan, nextDay);
    announce(`Allenamento ${session.name} avviato.`);
    navigate('/allenamento');
  };

  return (
    <>
      <header className="app-header">
        <h1 className="app-header__title">Oggi</h1>
        <a className="icon-btn" href="/impostazioni" aria-label="Impostazioni">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.14.63.42.75.76H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </a>
      </header>

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>

        {active && (
          <section className="card" style={{ padding: 'calc(var(--spacing) * 4)', borderColor: 'var(--color-brand-solid)' }}>
            <span className="label-caps">Allenamento in corso</span>
            <h2 className="section-title" style={{ marginBlock: 'calc(var(--spacing) * 1) calc(var(--spacing) * 3)' }}>
              {active.name}
            </h2>
            <Button block size="lg" onClick={() => navigate('/allenamento')}>
              <Play size={20} aria-hidden="true" /> Riprendi
            </Button>
          </section>
        )}

        <section aria-labelledby="week-title">
          <h2 id="week-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
            Questa settimana
          </h2>
          <div className="card adherence">
            <div className="adherence__figure">
              <span className="adherence__value num">{done}</span>
              <span className="adherence__total num">/ {target}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
                {done >= target ? 'Obiettivo raggiunto' : `${target - done} ${target - done === 1 ? 'seduta' : 'sedute'} al traguardo`}
              </p>
              <p className="tiny muted" style={{ margin: '2px 0 0' }}>
                Conta la settimana, non la striscia di giorni consecutivi.
              </p>
              <div className="adherence__bar" aria-hidden="true">
                {Array.from({ length: target }, (_, i) => (
                  <span key={i} data-done={i < done ? '' : undefined} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {!active && plan && nextDay && (
          <section aria-labelledby="next-title">
            <h2 id="next-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
              Prossimo allenamento
            </h2>
            <div className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
              <p className="tiny muted" style={{ margin: 0 }}>{plan.name}</p>
              <h3 className="section-title" style={{ marginBlock: '2px calc(var(--spacing) * 1)' }}>{nextDay.name}</h3>
              <p className="tiny muted" style={{ marginBlock: '0 calc(var(--spacing) * 3)' }}>
                <CalendarCheck size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />
                {' '}{nextDay.items.length} esercizi, circa {nextDay.estimatedMinutes} minuti
                {nextDay.focus.length > 0 && ` - ${nextDay.focus.map((f) => MUSCLE_GROUP_LABELS[f]).join(', ')}`}
              </p>

              <ol className="preview-list">
                {nextDay.items.slice(0, 4).map((item) => {
                  const exercise = getExercise(item.exerciseId);
                  return (
                    <li key={item.id}>
                      <span>{exercise?.name ?? item.exerciseId}</span>
                      <span className="tiny muted num">{item.sets.length} serie</span>
                    </li>
                  );
                })}
                {nextDay.items.length > 4 && (
                  <li className="tiny muted">e altri {nextDay.items.length - 4} esercizi</li>
                )}
              </ol>

              <Button block size="lg" onClick={() => void start()} style={{ marginBlockStart: 'calc(var(--spacing) * 4)' }}>
                <Play size={20} aria-hidden="true" /> Inizia
              </Button>
            </div>
          </section>
        )}

        {!plan && (
          <section className="card" style={{ padding: 'calc(var(--spacing) * 5)' }}>
            <Flame size={28} aria-hidden="true" style={{ color: 'var(--color-brand-text)' }} />
            <h2 className="section-title" style={{ marginBlock: 'calc(var(--spacing) * 2) calc(var(--spacing) * 1)' }}>
              Non hai ancora una scheda
            </h2>
            <p className="muted tiny" style={{ marginBlock: '0 calc(var(--spacing) * 4)' }}>
              Falla costruire a noi in base ai tuoi obiettivi, oppure componila esercizio per esercizio.
            </p>
            <div className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }}>
              <Button block onClick={() => navigate('/schede/genera')}>
                <Sparkles size={18} aria-hidden="true" /> Generala per me
              </Button>
              <Button block variant="secondary" onClick={() => navigate('/schede')}>
                <Plus size={18} aria-hidden="true" /> La faccio io
              </Button>
            </div>
          </section>
        )}

        {!active && (
          <Button
            variant="ghost" block
            onClick={async () => { await startEmptySession(); navigate('/allenamento'); }}
          >
            Allenamento libero, senza scheda
          </Button>
        )}

        {history && history.length > 0 && (
          <section aria-labelledby="recent-title">
            <div className="row" style={{ justifyContent: 'space-between', marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
              <h2 id="recent-title" className="label-caps">Ultimi allenamenti</h2>
              <a className="tiny" href="/storico" style={{ color: 'var(--color-text-link)' }}>Vedi tutti</a>
            </div>
            <ul className="exercise-list">
              {history.slice(0, 3).map((session) => (
                <li key={session.id}>
                  <a className="exercise-item" href="/storico">
                    <span className="exercise-item__text">
                      <span className="exercise-item__name">{session.name}</span>
                      <span className="tiny muted num">
                        {new Date(session.endedAt ?? session.startedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        {' - '}{formatDuration(session.durationSec)}
                        {' - '}{session.totalSets} serie
                      </span>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
