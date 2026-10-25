import { Link2, Unlink2 } from 'lucide-react';
import type { SupersetPosition } from '@tempra/core';

interface SupersetLinkProps {
  linked: boolean;
  currentName: string;
  nextName: string;
  onToggle: () => void;
}

/** Pulsante fra due esercizi consecutivi: li collega in superset o li separa. */
export function SupersetLink({ linked, currentName, nextName, onToggle }: SupersetLinkProps) {
  return (
    <div className="superset-link" data-linked={linked || undefined}>
      <button type="button" className="superset-link__btn" onClick={onToggle}>
        {linked
          ? <><Unlink2 size={15} aria-hidden="true" /> Scollega</>
          : <><Link2 size={15} aria-hidden="true" /> Superset</>}
        <span className="visually-hidden"> {currentName} con {nextName}</span>
      </button>
    </div>
  );
}

export function SupersetTag({ position }: { position: SupersetPosition }) {
  return (
    <p className="superset-tag">
      <Link2 size={13} aria-hidden="true" />
      Superset {position.letter}, {position.index + 1} di {position.size}
    </p>
  );
}

export function supersetEdge(position: SupersetPosition | null): 'first' | 'middle' | 'last' | undefined {
  if (!position) return undefined;
  if (position.index === 0) return 'first';
  return position.index === position.size - 1 ? 'last' : 'middle';
}
