/** Quanto pesa la condizione sulla generazione della scheda. */
export type ConditionSeverity =
  /** Serve il via libera di un professionista sanitario prima di iniziare. */
  | 'medical_clearance'
  /** Gli esercizi sconsigliati vengono esclusi d'ufficio dalla scheda generata. */
  | 'block'
  /** Esclusioni piu' contenute, parametri prudenti e un avviso in chiaro. */
  | 'caution';

export type ConditionGroup =
  | 'musculoskeletal' | 'cardiometabolic' | 'life_stage' | 'accessibility' | 'other';

export interface AdaptRules {
  /** Ripetizioni di riserva minime: non si va mai piu' vicino al cedimento di cosi'. */
  minRir?: number;
  /** Ripetizioni minime: evita il lavoro molto pesante a poche ripetizioni. */
  minReps?: number;
  /** Pausa minima in secondi. */
  minRestSec?: number;
  /** Tetto di intensita' come percentuale del massimale stimato. */
  maxPercent1rm?: number;
  /** Riduce il volume settimanale complessivo. */
  reduceVolume?: boolean;
  /** Sconsiglia la manovra di Valsalva: rilevante per pressione e cardiopatie. */
  avoidValsalva?: boolean;
  /** Preferisce movimenti guidati su macchina a quelli liberi. */
  preferMachines?: boolean;
}

export interface ConditionRule {
  id: string;
  label: string;
  aliases: string[];
  group: ConditionGroup;
  severity: ConditionSeverity;
  requiresMedicalClearance: boolean;
  /** Domanda di approfondimento mostrata nell'onboarding. */
  summary: string;
  /** Note di adattamento, in italiano, scritte per l'utente. */
  notes: string[];
  /** Segnali per cui fermarsi e rivolgersi a un medico. */
  redFlags: string[];
  /** Indici nel catalogo degli esercizi esclusi dalla scheda generata. */
  blocked: number[];
  /** Indici degli esercizi ammessi ma da eseguire con cautela. */
  warn: number[];
  adapt: AdaptRules;
  sources: string[];
}

export const CONDITION_GROUP_LABELS: Record<ConditionGroup, string> = {
  musculoskeletal: 'Ossa, articolazioni e schiena',
  cardiometabolic: 'Cuore, pressione e metabolismo',
  life_stage: 'Fasi della vita',
  accessibility: 'Mobilita',
  other: 'Altro',
};
