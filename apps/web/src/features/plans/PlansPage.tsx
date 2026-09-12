import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, Plus, Copy, Trash2, Check, ChevronRight } from 'lucide-react';
import { GOAL_LABELS } from '@tempra/core';
import { createEmptyPlan, deletePlan, duplicatePlan, listPlans, savePlan, setActivePlan } from '../../db/repo';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAnnounce } from '../../lib/announce';

export default function PlansPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const plans = useLiveQuery(() => listPlans(), [], undefined);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const createManual = async () => {
    const plan = createEmptyPlan();
    await savePlan(plan);
    navigate(`/schede/${plan.id}`);
  };

  return (
    <>
      <PageHeader title="Schede" />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>
        <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
          <Button block onClick={() => navigate('/schede/genera')}>
            <Sparkles size={18} aria-hidden="true" /> Genera
          </Button>
          <Button block variant="secondary" onClick={() => void createManual()}>
            <Plus size={18} aria-hidden="true" /> Nuova
          </Button>
        </div>

        {plans && plans.length === 0 && (
          <div className="empty-state">
            <p>Nessuna scheda, per ora.</p>
            <p className="tiny">
              Genera un piano su misura in base al tuo profilo, oppure parti da una scheda
              vuota e aggiungi gli esercizi che preferisci.
            </p>
          </div>
        )}

        <ul className="exercise-list">
          {plans?.map((plan) => (
            <li key={plan.id}>
              <div className="plan-card card">
                <a className="plan-card__main" href={`/schede/${plan.id}`}>
                  <span className="exercise-item__text">
                    <span className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
                      <span className="exercise-item__name">{plan.name}</span>
                      {plan.isActive && (
                        <span className="badge badge--info"><Check size={12} aria-hidden="true" /> Attiva</span>
                      )}
                    </span>
                    <span className="tiny muted num">
                      {plan.days.length} {plan.days.length === 1 ? 'giorno' : 'giorni'}
                      {' - '}{GOAL_LABELS[plan.goal]}
                      {plan.source === 'generated' && ' - generata'}
                    </span>
                  </span>
                  <ChevronRight size={20} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)', flex: 'none' }} />
                </a>
                <div className="plan-card__actions">
                  {!plan.isActive && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={async () => {
                        await setActivePlan(plan.id);
                        announce(`${plan.name} e ora la scheda attiva.`);
                      }}
                    >
                      Rendi attiva
                    </Button>
                  )}
                  <IconButton
                    label={`Duplica ${plan.name}`}
                    onClick={async () => { await duplicatePlan(plan.id); announce('Scheda duplicata.'); }}
                  >
                    <Copy size={18} aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`Elimina ${plan.name}`} onClick={() => setToDelete(plan.id)}>
                    <Trash2 size={18} aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminare la scheda?"
        message="Gli allenamenti gia registrati restano nello storico. La scheda invece viene rimossa."
        confirmLabel="Elimina"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deletePlan(toDelete);
          setToDelete(null);
          announce('Scheda eliminata.');
        }}
      />
    </>
  );
}
