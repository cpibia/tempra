import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Unita' mostrata accanto al campo, per esempio kg o reps. */
  unit?: string;
  /** Valore suggerito, mostrato come segnaposto e come testo di aiuto. */
  placeholder?: string;
  decimals?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Campo numerico con pulsanti piu' e meno.
 *
 * Si usa type="text" con inputMode: su iOS il type="number" mostra una tastiera
 * con i simboli matematici invece del tastierino, accetta la notazione
 * esponenziale e perde il valore quando l'input non e' valido. La validazione
 * sta nel pattern e nel parsing, non nel tipo del campo.
 */
export function NumberStepper({
  label, value, onChange, step = 1, min = 0, max = 9999,
  unit, placeholder, decimals = false, disabled = false, compact = false,
}: NumberStepperProps) {
  const inputId = useId();

  const parse = (raw: string): number | undefined => {
    const normalized = raw.replace(',', '.').trim();
    if (normalized === '') return undefined;
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return undefined;
    return Math.min(max, Math.max(min, parsed));
  };

  const bump = (delta: number) => {
    const base = value ?? 0;
    const next = Math.min(max, Math.max(min, Math.round((base + delta) * 100) / 100));
    onChange(next);
  };

  const display = value === undefined ? '' : decimals ? String(value).replace('.', ',') : String(value);

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}{unit ? ` (${unit})` : ''}
      </label>
      <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => bump(-step)}
          disabled={disabled || (value !== undefined && value <= min)}
          aria-label={`Riduci ${label.toLowerCase()} di ${step}`}
          style={{ border: '1px solid var(--color-border-strong)', flex: 'none' }}
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <input
          id={inputId}
          className="input num"
          type="text"
          inputMode={decimals ? 'decimal' : 'numeric'}
          pattern={decimals ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
          autoComplete="off"
          enterKeyHint="done"
          value={display}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(parse(e.target.value))}
          style={{
            textAlign: 'center',
            fontSize: compact ? 'var(--text-num-sm)' : 'var(--text-num-md)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        />
        <button
          type="button"
          className="icon-btn"
          onClick={() => bump(step)}
          disabled={disabled || (value !== undefined && value >= max)}
          aria-label={`Aumenta ${label.toLowerCase()} di ${step}`}
          style={{ border: '1px solid var(--color-border-strong)', flex: 'none' }}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
