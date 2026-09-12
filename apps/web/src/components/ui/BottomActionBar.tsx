import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Barra dell azione primaria, ancorata sopra la navigazione.
 *
 * Viene montata in fondo al body invece che dentro il contenuto scorrevole:
 * un elemento a posizione fissa annidato in un contenitore con padding e
 * larghezza massima si comporta male quando il browser deve portarlo in vista,
 * e il bersaglio del tocco finisce per non coincidere con quello che si vede.
 */
export function BottomActionBar({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.className = 'action-bar';
    document.body.appendChild(node);
    setHost(node);
    return () => { node.remove(); };
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
