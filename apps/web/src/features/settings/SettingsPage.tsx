import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Upload, Trash2, ShieldAlert, Info } from 'lucide-react';
import {
  CONDITION_GROUP_LABELS, conditionsByGroup, EQUIPMENT_LABELS, EXPERIENCE_LABELS,
  GOAL_LABELS, PLACE_LABELS, type Equipment, type Experience, type Goal, type TrainingPlace,
} from '@tempra/core';
import { db, getProfile, getSettings, saveSettings } from '../../db/db';
import { saveProfile } from '../../db/repo';
import { applyTheme, type ThemeChoice } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { useAnnounce } from '../../lib/announce';
import { AccountPanel } from './AccountPanel';

const GOALS: Goal[] = ['muscle', 'fat_loss', 'strength', 'recomp', 'endurance', 'health'];
const PLACES: TrainingPlace[] = ['gym', 'home_basic', 'home_bodyweight', 'outdoor'];
const EXPERIENCES: Experience[] = ['beginner', 'intermediate', 'advanced'];
const HOME_EQUIPMENT: Equipment[] = ['dumbbell', 'bands', 'kettlebells', 'exercise ball', 'medicine ball', 'foam roll', 'barbell'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const profile = useLiveQuery(() => getProfile(), [], undefined);
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!settings) return <p className="muted">Caricamento...</p>;

  const exportData = async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: await db.profiles.toArray(),
      plans: await db.plans.toArray(),
      sessions: await db.sessions.toArray(),
      records: await db.records.toArray(),
      measurements: await db.measurements.toArray(),
      settings: await db.settings.toArray(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tempra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    announce('Backup scaricato.');
  };

  const importData = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text) as Record<string, unknown[]>;
    const tables = [db.profiles, db.plans, db.sessions, db.records, db.measurements, db.settings];
    await db.transaction('rw', tables, async () => {
      if (payload.profile) await db.profiles.bulkPut(payload.profile as never);
      if (payload.plans) await db.plans.bulkPut(payload.plans as never);
      if (payload.sessions) await db.sessions.bulkPut(payload.sessions as never);
      if (payload.records) await db.records.bulkPut(payload.records as never);
      if (payload.measurements) await db.measurements.bulkPut(payload.measurements as never);
      if (payload.settings) await db.settings.bulkPut(payload.settings as never);
    });
    announce('Dati importati.');
  };

  const toggleCondition = (id: string) => {
    if (!profile) return;
    const conditions = profile.conditions.includes(id)
      ? profile.conditions.filter((c) => c !== id)
      : [...profile.conditions, id];
    void saveProfile({ conditions });
  };

  const grouped = conditionsByGroup();

  return (
    <>
      <PageHeader title="Impostazioni" back="/" />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 6)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>

        <section aria-labelledby="app-title" className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
          <h2 id="app-title" className="section-title">Applicazione</h2>

          <div className="field">
            <label className="field__label" htmlFor="theme">Tema</label>
            <select
              id="theme" className="input" value={settings.theme}
              onChange={(e) => {
                const theme = e.target.value as ThemeChoice;
                void saveSettings({ theme: theme === 'system' ? 'system' : theme });
                applyTheme(theme);
              }}
            >
              <option value="dark">Scuro</option>
              <option value="light">Chiaro</option>
              <option value="system">Come il sistema</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="units">Unita di misura</label>
            <select
              id="units" className="input" value={settings.units}
              onChange={(e) => void saveSettings({ units: e.target.value as 'kg' | 'lb' })}
            >
              <option value="kg">Chilogrammi</option>
              <option value="lb">Libbre</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="step">Incremento dei pulsanti del peso</label>
            <select
              id="step" className="input" value={settings.weightStepKg}
              onChange={(e) => void saveSettings({ weightStepKg: Number(e.target.value) })}
            >
              {[0.5, 1, 1.25, 2, 2.5, 5].map((v) => (
                <option key={v} value={v}>{String(v).replace('.', ',')} kg</option>
              ))}
            </select>
          </div>

          <fieldset className="fieldset">
            <legend className="field__label">Durante l allenamento</legend>
            {([
              ['restTimerAutoStart', 'Avvia il recupero quando spunto una serie'],
              ['restTimerSound', 'Suono a fine recupero'],
              ['restTimerVibration', 'Vibrazione a fine recupero'],
              ['keepAwake', 'Tieni lo schermo acceso'],
            ] as const).map(([key, label]) => (
              <label key={key} className="switch-row">
                <input
                  type="checkbox"
                  checked={settings[key] as boolean}
                  onChange={(e) => void saveSettings({ [key]: e.target.checked })}
                />
                <span className="switch-row__box" aria-hidden="true" />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </section>

        {profile && (
          <>
            <section aria-labelledby="profile-title" className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
              <h2 id="profile-title" className="section-title">Il tuo profilo</h2>
              <p className="tiny muted" style={{ margin: 0 }}>
                Cambiare questi valori non modifica le schede gia create: usali e poi genera
                una scheda nuova se vuoi che se ne tenga conto.
              </p>

              <div className="field">
                <label className="field__label" htmlFor="goal">Obiettivo</label>
                <select
                  id="goal" className="input" value={profile.goal}
                  onChange={(e) => void saveProfile({ goal: e.target.value as Goal })}
                >
                  {GOALS.map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="place">Dove ti alleni</label>
                <select
                  id="place" className="input" value={profile.place}
                  onChange={(e) => void saveProfile({ place: e.target.value as TrainingPlace })}
                >
                  {PLACES.map((p) => <option key={p} value={p}>{PLACE_LABELS[p]}</option>)}
                </select>
              </div>

              {profile.place !== 'gym' && (
                <fieldset className="fieldset">
                  <legend className="field__label">Attrezzatura disponibile</legend>
                  <div className="chip-wrap">
                    {HOME_EQUIPMENT.map((item) => (
                      <button
                        key={item} type="button" className="chip"
                        aria-pressed={profile.equipment.includes(item)}
                        onClick={() => void saveProfile({
                          equipment: profile.equipment.includes(item)
                            ? profile.equipment.filter((e) => e !== item)
                            : [...profile.equipment, item],
                        })}
                      >
                        {EQUIPMENT_LABELS[item]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="days">Giorni a settimana</label>
                  <select
                    id="days" className="input" value={profile.daysPerWeek}
                    onChange={(e) => void saveProfile({ daysPerWeek: Number(e.target.value) })}
                  >
                    {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="minutes">Minuti a seduta</label>
                  <select
                    id="minutes" className="input" value={profile.sessionMinutes}
                    onChange={(e) => void saveProfile({ sessionMinutes: Number(e.target.value) })}
                  >
                    {[30, 45, 60, 75, 90].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="experience">Livello</label>
                <select
                  id="experience" className="input" value={profile.experience}
                  onChange={(e) => void saveProfile({ experience: e.target.value as Experience })}
                >
                  {EXPERIENCES.map((x) => <option key={x} value={x}>{EXPERIENCE_LABELS[x]}</option>)}
                </select>
              </div>
            </section>

            <section aria-labelledby="health-title" className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
              <h2 id="health-title" className="section-title">Salute</h2>
              <p className="tiny muted" style={{ margin: 0 }}>
                Restano su questo dispositivo e non vengono inviate da nessuna parte.
              </p>
              {grouped.map(([group, conditions]) => (
                <fieldset key={group} className="fieldset">
                  <legend className="label-caps">{CONDITION_GROUP_LABELS[group]}</legend>
                  <div className="chip-wrap">
                    {conditions.map((condition) => (
                      <button
                        key={condition.id} type="button" className="chip"
                        aria-pressed={profile.conditions.includes(condition.id)}
                        onClick={() => toggleCondition(condition.id)}
                      >
                        {condition.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </section>
          </>
        )}

        <section aria-labelledby="account-title" className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
          <h2 id="account-title" className="section-title">Account e sincronizzazione</h2>
          <AccountPanel />
        </section>

        <section aria-labelledby="data-title" className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
          <h2 id="data-title" className="section-title">I tuoi dati</h2>
          <p className="tiny muted" style={{ margin: 0 }}>
            Tempra tiene tutto sul tuo dispositivo. Scarica un backup ogni tanto: se cancelli
            i dati del browser o cambi telefono, senza backup non si recupera nulla.
          </p>

          <Button variant="secondary" block onClick={() => void exportData()}>
            <Download size={18} aria-hidden="true" /> Scarica un backup
          </Button>

          <label className="btn btn--secondary btn--block" style={{ cursor: 'pointer' }}>
            <Upload size={18} aria-hidden="true" /> Ripristina da backup
            <input
              type="file" accept="application/json" className="visually-hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importData(f); }}
            />
          </label>

          <Button variant="ghost" block onClick={() => setConfirmWipe(true)} style={{ color: 'var(--color-danger-text)' }}>
            <Trash2 size={18} aria-hidden="true" /> Cancella tutti i dati
          </Button>
        </section>

        <section aria-labelledby="about-title" className="stack" style={{ gap: 'calc(var(--spacing) * 3)' }}>
          <h2 id="about-title" className="section-title">Informazioni</h2>

          <div className="callout callout--warn">
            <ShieldAlert size={20} aria-hidden="true" />
            <div>
              <strong>Tempra non e un dispositivo medico</strong>
              <p style={{ margin: '4px 0 0' }}>
                Quello che trovi qui e materiale informativo, non una prescrizione. Non
                sostituisce il parere di un medico, di un fisioterapista o di un istruttore
                qualificato. Se hai patologie, dolori in corso o dubbi, parlane con un
                professionista sanitario prima di allenarti. Interrompi subito l allenamento
                in caso di dolore al petto, capogiri, mancanza di fiato o dolore acuto.
              </p>
            </div>
          </div>

          <div className="callout callout--info">
            <Info size={20} aria-hidden="true" />
            <div>
              <strong>Da dove arrivano gli esercizi</strong>
              <p style={{ margin: '4px 0 0' }}>
                Il catalogo di 876 esercizi, immagini comprese, proviene dal progetto open
                source free-exercise-db, rilasciato in pubblico dominio con licenza Unlicense.
                Nomi e istruzioni sono stati tradotti in italiano.
              </p>
            </div>
          </div>

          <Button variant="ghost" block onClick={() => navigate('/onboarding')}>
            Rifai la configurazione iniziale
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmWipe}
        title="Cancellare tutto?"
        message="Profilo, schede, allenamenti e record vengono eliminati definitivamente da questo dispositivo. Se non hai un backup, non si torna indietro."
        confirmLabel="Cancella tutto"
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={async () => {
          await db.delete();
          window.location.href = '/';
        }}
      />
    </>
  );
}
