import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Regione live unica per tutta l'applicazione.
 * Montarne una sola al boot e non nasconderla mai con display:none e' l'unico
 * modo affidabile perche' VoiceOver e TalkBack annuncino i cambiamenti.
 * Vedi docs/research/04-accessibilita-wcag.md, regola 2.
 */

type Politeness = 'polite' | 'assertive';

interface AnnounceApi {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnounceContext = createContext<AnnounceApi | null>(null);

export function AnnounceProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const lastRef = useRef<{ message: string; at: number }>({ message: '', at: 0 });

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const now = Date.now();
    // Ripetere lo stesso testo non produce un nuovo annuncio: si aggiunge uno
    // spazio invisibile per forzare il cambiamento del nodo di testo.
    const text = lastRef.current.message === message && now - lastRef.current.at < 4000
      ? `${message} `
      : message;
    lastRef.current = { message, at: now };
    if (politeness === 'assertive') setAssertive(text);
    else setPolite(text);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">{polite}</div>
      <div className="visually-hidden" aria-live="assertive" aria-atomic="true">{assertive}</div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce(): AnnounceApi['announce'] {
  const ctx = useContext(AnnounceContext);
  if (!ctx) throw new Error('useAnnounce richiede AnnounceProvider');
  return ctx.announce;
}
