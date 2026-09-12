import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import {
  CONDITIONS, CONDITION_GROUP_LABELS, conditionsByGroup, EQUIPMENT_LABELS,
  GOAL_DESCRIPTIONS, GOAL_LABELS, PLACE_DESCRIPTIONS, PLACE_LABELS, EXPERIENCE_LABELS,
  buildScreening, generatePlan, nowIso,
  type Equipment, type Goal, type Experience, type Profile, type TrainingPlace,
} from '@tempra/core';
import { saveProfile, savePlan, setActivePlan } from '../../db/repo';
import { PROFILE_ID } from '../../db/db';
import { Button } from '../../components/ui/Button';
import { useAnnounce } from '../../lib/announce';

type Draft = Pick<Profile,
  'goal' | 'place' | 'equipment' | 'daysPerWeek' | 'sessionMinutes' | 'experience' |
  'conditions' | 'sex' | 'birthYear' | 'heightCm' | 'weightKg'>;

const INITIAL: Draft = {
  goal: 'muscle',
  place: 'gym',
  equipment: [],
  daysPerWeek: 3,
  sessionMinutes: 60,
  experience: 'beginner',
  conditions: [],
  sex: 'unspecified',
};

const GOALS: Goal[] = ['muscle', 'fat_loss', 'strength', 'recomp', 'endurance', 'health'];
const PLACES: TrainingPlace[] = ['gym', 'home_basic', 'home_bodyweight', 'outdoor'];
const EXPERIENCES: Experience[] = ['beginner', 'intermediate', 'advanced'];

const EXPERIENCE_DESCRIPTIONS: Record<Experience, string> = {
  beginner: 'Meno di sei mesi di allenamento costante, oppure riparti da zero.',
  intermediate: 'Da sei mesi a due anni. Conosci i movimenti principali.',
  advanced: 'Oltre due anni di allenamento serio e continuativo.',
};

const HOME_EQUIPMENT: Equipment[] = [
  'dumbbell', 'bands', 'kettlebells', 'exercise ball', 'medicine ball', 'foam roll', 'barbell',
];

const STEPS = [
  'Come funziona',
  'Obiettivo',
  'Dove ti alleni',
  'Quanto tempo hai',
  'Esperienza',
  'Qualche dato su di te',
  'Salute',
  'Ci siamo',
] as const;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [working, setWorking] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isFirst = useRef(true);

  // Il focus va sul titolo del passo: senza, chi naviga da tastiera o con
  // screen reader resterebbe sul pulsante "Avanti" della schermata precedente.
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    titleRef.current?.focus();
  }, [step]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleCondition = (id: string) =>
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.includes(id)
        ? d.conditions.filter((c) => c !== id)
        : [...d.conditions, id],
    }));

  const toggleEquipment = (item: Equipment) =>
    setDraft((d) => ({
      ...d,
      equipment: d.equipment.includes(item)
        ? d.equipment.filter((e) => e !== item)
        : [...d.equipment, item],
    }));

  const finish = async (generate: boolean) => {
    setWorking(true);
    const profile = await saveProfile({
      ...draft,
      onboardingCompletedAt: nowIso(),
      disclaimerAcceptedAt: nowIso(),
    });

    if (generate) {
      const screening = buildScreening(profile.conditions);
      const { plan } = generatePlan({ profile }, screening);
      await savePlan(plan);
      await setActivePlan(plan.id);
      announce('Scheda creata.');
      navigate(`/schede/${plan.id}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const skipAll = async () => {
    await saveProfile({ ...INITIAL, id: PROFILE_ID, onboardingCompletedAt: nowIso() });
    navigate('/', { replace: true });
  };

  const selectedConditions = CONDITIONS.filter((c) => draft.conditions.includes(c.id));
  const needsClearance = selectedConditions.some((c) => c.severity === 'medical_clearance');

  const grouped = conditionsByGroup();

  return (
    <div className="onboarding">
      <div className="onboarding__progress">
        <ol className="steps" aria-label="Avanzamento della configurazione">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className="steps__dot"
              data-state={index < step ? 'done' : index === step ? 'current' : 'todo'}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="visually-hidden">
                Passo {index + 1} di {STEPS.length}: {label}
                {index < step ? ', completato' : index === step ? ', in corso' : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <h1 ref={titleRef} tabIndex={-1} className="page-title" style={{ outline: 'none' }}>
        {STEPS[step]}
      </h1>

      <div className="onboarding__body">
        {step === 0 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
            <p className="muted">
              Tempra ti costruisce una scheda su misura, oppure ti lascia comporla a mano
              scegliendo fra 876 esercizi. Poi ti segue serie per serie, anche senza connessione.
            </p>
            <p className="muted">
              Rispondi a sei domande: ci vuole un minuto. Puoi cambiare tutto in seguito
              dalle impostazioni.
            </p>
            <div className="callout callout--warn">
              <ShieldAlert size={20} aria-hidden="true" />
              <div>
                <strong>Una premessa seria.</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Tempra non e un dispositivo medico e non sostituisce il parere di un medico,
                  di un fisioterapista o di un istruttore. Se hai patologie, dolori in corso,
                  o non ti alleni da molto tempo, parlane con un professionista sanitario
                  prima di iniziare. Se durante l allenamento senti dolore al petto, capogiri
                  o mancanza di fiato, fermati.
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={skipAll}>Salta la configurazione</Button>
          </div>
        )}

        {step === 1 && (
          <fieldset className="fieldset">
            <legend className="field__label">Qual e il tuo obiettivo principale?</legend>
            <div className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }}>
              {GOALS.map((goal) => (
                <label key={goal} className="choice">
                  <input
                    className="choice__input" type="radio" name="goal" value={goal}
                    checked={draft.goal === goal}
                    onChange={() => update('goal', goal)}
                  />
                  <span className="choice__mark" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>
                  <span>
                    <span className="choice__title">{GOAL_LABELS[goal]}</span>
                    <span className="choice__desc">{GOAL_DESCRIPTIONS[goal]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)' }}>
            <fieldset className="fieldset">
              <legend className="field__label">Dove ti alleni di solito?</legend>
              <div className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }}>
                {PLACES.map((place) => (
                  <label key={place} className="choice">
                    <input
                      className="choice__input" type="radio" name="place" value={place}
                      checked={draft.place === place}
                      onChange={() => update('place', place)}
                    />
                    <span className="choice__mark" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>
                    <span>
                      <span className="choice__title">{PLACE_LABELS[place]}</span>
                      <span className="choice__desc">{PLACE_DESCRIPTIONS[place]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.place !== 'gym' && (
              <fieldset className="fieldset">
                <legend className="field__label">Che attrezzatura hai davvero?</legend>
                <p className="field__hint">
                  Seleziona solo quello che possiedi. Se non selezioni nulla, usiamo il corpo libero.
                </p>
                <div className="chip-wrap">
                  {HOME_EQUIPMENT.map((item) => (
                    <button
                      key={item} type="button" className="chip"
                      aria-pressed={draft.equipment.includes(item)}
                      onClick={() => toggleEquipment(item)}
                    >
                      {draft.equipment.includes(item) && <Check size={14} aria-hidden="true" />}
                      {EQUIPMENT_LABELS[item]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)' }}>
            <fieldset className="fieldset">
              <legend className="field__label">Quanti giorni a settimana puoi allenarti?</legend>
              <p className="field__hint">
                Meglio tre giorni rispettati che sei promessi. Potrai cambiare quando vuoi.
              </p>
              <div className="chip-wrap">
                {[2, 3, 4, 5, 6].map((days) => (
                  <label key={days} className="pill-choice">
                    <input
                      type="radio" name="days" value={days}
                      checked={draft.daysPerWeek === days}
                      onChange={() => update('daysPerWeek', days)}
                    />
                    <span><span className="num">{days}</span> giorni</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="field__label">Quanto dura una seduta?</legend>
              <div className="chip-wrap">
                {[30, 45, 60, 75, 90].map((minutes) => (
                  <label key={minutes} className="pill-choice">
                    <input
                      type="radio" name="minutes" value={minutes}
                      checked={draft.sessionMinutes === minutes}
                      onChange={() => update('sessionMinutes', minutes)}
                    />
                    <span><span className="num">{minutes}</span> min</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <fieldset className="fieldset">
            <legend className="field__label">Da quanto ti alleni?</legend>
            <div className="stack" style={{ gap: 'calc(var(--spacing) * 2)' }}>
              {EXPERIENCES.map((level) => (
                <label key={level} className="choice">
                  <input
                    className="choice__input" type="radio" name="experience" value={level}
                    checked={draft.experience === level}
                    onChange={() => update('experience', level)}
                  />
                  <span className="choice__mark" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>
                  <span>
                    <span className="choice__title">{EXPERIENCE_LABELS[level]}</span>
                    <span className="choice__desc">{EXPERIENCE_DESCRIPTIONS[level]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 5 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
            <p className="field__hint">
              Tutto facoltativo. Servono solo a proporti carichi di partenza piu sensati
              e a mostrarti i progressi. Restano sul tuo telefono.
            </p>

            <fieldset className="fieldset">
              <legend className="field__label">Sesso biologico</legend>
              <div className="chip-wrap">
                {([
                  ['male', 'Uomo'], ['female', 'Donna'], ['unspecified', 'Preferisco non dirlo'],
                ] as const).map(([value, label]) => (
                  <label key={value} className="pill-choice">
                    <input
                      type="radio" name="sex" value={value}
                      checked={draft.sex === value}
                      onChange={() => update('sex', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor="birth">Anno di nascita</label>
                <input
                  id="birth" className="input num" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder="1990" autoComplete="bday-year"
                  value={draft.birthYear ?? ''}
                  onChange={(e) => update('birthYear', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="height">Altezza (cm)</label>
                <input
                  id="height" className="input num" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder="175"
                  value={draft.heightCm ?? ''}
                  onChange={(e) => update('heightCm', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="weight">Peso (kg)</label>
              <input
                id="weight" className="input num" type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                placeholder="75"
                value={draft.weightKg ?? ''}
                onChange={(e) => update('weightKg', e.target.value ? Number(e.target.value.replace(',', '.')) : undefined)}
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
            <p className="field__hint">
              Se hai una di queste condizioni, togliamo dalla scheda generata gli esercizi
              che di solito sono sconsigliati e rendiamo i parametri piu prudenti.
              Puoi comunque cercare e aggiungere a mano qualunque esercizio.
              Queste informazioni restano solo sul tuo dispositivo.
            </p>

            {grouped.map(([group, conditions]) => (
              <fieldset key={group} className="fieldset">
                <legend className="label-caps">{CONDITION_GROUP_LABELS[group]}</legend>
                <div className="chip-wrap">
                  {conditions.map((condition) => (
                    <button
                      key={condition.id}
                      type="button"
                      className="chip"
                      aria-pressed={draft.conditions.includes(condition.id)}
                      onClick={() => toggleCondition(condition.id)}
                    >
                      {draft.conditions.includes(condition.id) && <Check size={14} aria-hidden="true" />}
                      {condition.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            {selectedConditions.length > 0 && (
              <div className="callout callout--info" role="status">
                <div>
                  <strong>Cosa cambiera nella tua scheda</strong>
                  <ul style={{ margin: '6px 0 0', paddingInlineStart: '1.1em' }}>
                    {selectedConditions.map((c) => (
                      <li key={c.id} className="tiny">
                        {c.label}: togliamo dalla scheda {c.blocked.length} esercizi e ne segnaliamo
                        altri {c.warn.length} da fare con cautela.
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {needsClearance && (
              <div className="callout callout--warn" role="alert">
                <ShieldAlert size={20} aria-hidden="true" />
                <div>
                  <strong>Parlane prima con un medico</strong>
                  <p style={{ margin: '4px 0 0' }}>
                    Per almeno una delle condizioni che hai indicato serve il via libera di un
                    professionista sanitario prima di cominciare. La scheda che creiamo e
                    volutamente conservativa, ma non sostituisce quella valutazione.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
            <div className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
              <dl className="summary">
                <dt>Obiettivo</dt><dd>{GOAL_LABELS[draft.goal]}</dd>
                <dt>Dove</dt><dd>{PLACE_LABELS[draft.place]}</dd>
                <dt>Frequenza</dt><dd className="num">{draft.daysPerWeek} giorni a settimana</dd>
                <dt>Durata</dt><dd className="num">{draft.sessionMinutes} minuti</dd>
                <dt>Livello</dt><dd>{EXPERIENCE_LABELS[draft.experience]}</dd>
                <dt>Condizioni</dt>
                <dd>{selectedConditions.length ? selectedConditions.map((c) => c.label).join(', ') : 'Nessuna indicata'}</dd>
              </dl>
            </div>

            <Button size="lg" block disabled={working} onClick={() => void finish(true)}>
              <Sparkles size={20} aria-hidden="true" />
              {working ? 'Sto creando la scheda...' : 'Crea la mia scheda'}
            </Button>
            <Button variant="ghost" block disabled={working} onClick={() => void finish(false)}>
              No grazie, la costruisco da solo
            </Button>
          </div>
        )}
      </div>

      <div className="onboarding__nav">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft size={18} aria-hidden="true" /> Indietro
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Avanti <ChevronRight size={18} aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
