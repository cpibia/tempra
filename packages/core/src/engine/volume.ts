import type { Experience, Goal, MuscleGroup } from '../domain/types';

/**
 * Landmark di volume settimanale in serie allenanti per gruppo muscolare.
 * Modello MEV / MAV / MRV (Israetel, Renaissance Periodization), con la dose-risposta
 * di Schoenfeld 2017 come riferimento sul limite inferiore.
 * Fonti e tabella completa in docs/research/01-scienza-allenamento.md, sezione 2.2.
 *
 * Nota sulle spalle: la tabella originale separa deltoide anteriore, laterale e posteriore.
 * Il dataset degli esercizi non distingue i tre capi, quindi i valori sono aggregati
 * al netto del lavoro indiretto gia' coperto dalle spinte.
 */
export interface VolumeLandmark {
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrv: number;
}

export const VOLUME_LANDMARKS: Record<MuscleGroup, Record<Experience, VolumeLandmark>> = {
  chest: {
    beginner: { mev: 8, mavLow: 10, mavHigh: 14, mrv: 16 },
    intermediate: { mev: 10, mavLow: 12, mavHigh: 20, mrv: 22 },
    advanced: { mev: 12, mavLow: 16, mavHigh: 22, mrv: 26 },
  },
  back: {
    beginner: { mev: 10, mavLow: 12, mavHigh: 16, mrv: 18 },
    intermediate: { mev: 12, mavLow: 14, mavHigh: 22, mrv: 25 },
    advanced: { mev: 14, mavLow: 18, mavHigh: 25, mrv: 30 },
  },
  shoulders: {
    beginner: { mev: 8, mavLow: 10, mavHigh: 14, mrv: 16 },
    intermediate: { mev: 10, mavLow: 12, mavHigh: 18, mrv: 20 },
    advanced: { mev: 12, mavLow: 16, mavHigh: 22, mrv: 26 },
  },
  biceps: {
    beginner: { mev: 6, mavLow: 8, mavHigh: 12, mrv: 14 },
    intermediate: { mev: 8, mavLow: 10, mavHigh: 18, mrv: 20 },
    advanced: { mev: 8, mavLow: 14, mavHigh: 20, mrv: 26 },
  },
  triceps: {
    beginner: { mev: 6, mavLow: 8, mavHigh: 12, mrv: 14 },
    intermediate: { mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
    advanced: { mev: 8, mavLow: 12, mavHigh: 18, mrv: 22 },
  },
  quads: {
    beginner: { mev: 8, mavLow: 10, mavHigh: 14, mrv: 16 },
    intermediate: { mev: 8, mavLow: 12, mavHigh: 18, mrv: 20 },
    advanced: { mev: 10, mavLow: 14, mavHigh: 20, mrv: 24 },
  },
  hamstrings: {
    beginner: { mev: 6, mavLow: 8, mavHigh: 12, mrv: 14 },
    intermediate: { mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
    advanced: { mev: 8, mavLow: 12, mavHigh: 18, mrv: 20 },
  },
  glutes: {
    beginner: { mev: 4, mavLow: 6, mavHigh: 12, mrv: 14 },
    intermediate: { mev: 4, mavLow: 8, mavHigh: 16, mrv: 18 },
    advanced: { mev: 6, mavLow: 12, mavHigh: 18, mrv: 20 },
  },
  calves: {
    beginner: { mev: 6, mavLow: 8, mavHigh: 14, mrv: 16 },
    intermediate: { mev: 8, mavLow: 12, mavHigh: 16, mrv: 20 },
    advanced: { mev: 8, mavLow: 14, mavHigh: 20, mrv: 25 },
  },
  core: {
    beginner: { mev: 0, mavLow: 6, mavHigh: 12, mrv: 16 },
    intermediate: { mev: 0, mavLow: 8, mavHigh: 16, mrv: 20 },
    advanced: { mev: 0, mavLow: 10, mavHigh: 20, mrv: 25 },
  },
  forearms: {
    beginner: { mev: 0, mavLow: 2, mavHigh: 6, mrv: 8 },
    intermediate: { mev: 0, mavLow: 4, mavHigh: 8, mrv: 10 },
    advanced: { mev: 0, mavLow: 6, mavHigh: 12, mrv: 15 },
  },
  neck: {
    beginner: { mev: 0, mavLow: 0, mavHigh: 4, mrv: 6 },
    intermediate: { mev: 0, mavLow: 0, mavHigh: 6, mrv: 8 },
    advanced: { mev: 0, mavLow: 0, mavHigh: 8, mrv: 10 },
  },
};

/** Coefficiente moltiplicativo sul volume MAV in funzione dell'obiettivo (sezione 2.3). */
export const GOAL_VOLUME_COEFF: Record<Goal, number> = {
  muscle: 1.0,
  recomp: 1.0,
  fat_loss: 0.95,
  strength: 0.8,
  endurance: 1.15,
  health: 0.55,
};

/**
 * Tetto di serie dirette per gruppo muscolare in una singola seduta.
 * Oltre questa soglia il ritorno marginale crolla: meglio alzare la frequenza.
 */
export const MAX_SETS_PER_MUSCLE_PER_SESSION: Record<Experience, number> = {
  beginner: 6,
  intermediate: 9,
  advanced: 12,
};

/** Gruppi che il motore alimenta solo con il lavoro indiretto, salvo richiesta esplicita. */
export const INDIRECT_ONLY_GROUPS: MuscleGroup[] = ['forearms', 'neck'];

export interface VolumePlanInput {
  experience: Experience;
  goal: Goal;
  /** Gruppi su cui l'utente vuole enfasi: ricevono il 20% di volume in piu'. */
  priorityGroups?: MuscleGroup[];
  /** Riduce il volume quando il recupero e' compromesso (eta' avanzata, patologie, poco sonno). */
  recoveryFactor?: number;
}

export type WeeklyVolumePlan = Partial<Record<MuscleGroup, number>>;

/**
 * Volume settimanale di partenza (settimana 1 del mesociclo).
 * Si parte dal limite basso della zona MAV e si sale nelle settimane successive.
 */
export function planWeeklyVolume(input: VolumePlanInput): WeeklyVolumePlan {
  const { experience, goal, priorityGroups = [], recoveryFactor = 1 } = input;
  const plan: WeeklyVolumePlan = {};

  for (const group of Object.keys(VOLUME_LANDMARKS) as MuscleGroup[]) {
    const landmark = VOLUME_LANDMARKS[group][experience];
    if (INDIRECT_ONLY_GROUPS.includes(group) && !priorityGroups.includes(group)) {
      plan[group] = 0;
      continue;
    }
    let sets = landmark.mavLow * GOAL_VOLUME_COEFF[goal] * recoveryFactor;
    if (priorityGroups.includes(group)) sets *= 1.2;
    plan[group] = Math.round(Math.min(Math.max(sets, landmark.mev), landmark.mrv));
  }
  return plan;
}

/**
 * Progressione del volume settimana per settimana all'interno del mesociclo.
 * Aggiunge circa una serie a settimana sui gruppi grandi, senza mai superare il MRV,
 * e crolla al volume di mantenimento nella settimana di scarico.
 */
export function volumeForWeek(
  base: WeeklyVolumePlan,
  week: number,
  totalWeeks: number,
  experience: Experience,
): WeeklyVolumePlan {
  const isDeload = week === totalWeeks;
  const out: WeeklyVolumePlan = {};
  for (const [group, sets] of Object.entries(base) as [MuscleGroup, number][]) {
    if (!sets) { out[group] = 0; continue; }
    if (isDeload) {
      out[group] = Math.max(2, Math.round(sets * 0.5));
      continue;
    }
    const landmark = VOLUME_LANDMARKS[group][experience];
    out[group] = Math.min(landmark.mrv, sets + (week - 1));
  }
  return out;
}

/** Frequenza minima necessaria per distribuire il volume senza sforare il tetto per seduta. */
export function requiredFrequency(weeklySets: number, experience: Experience): number {
  return Math.max(1, Math.ceil(weeklySets / MAX_SETS_PER_MUSCLE_PER_SESSION[experience]));
}
