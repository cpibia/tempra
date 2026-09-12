import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';

interface AppShellProps {
  children: ReactNode;
  /** Nasconde la barra di navigazione: onboarding e allenamento occupano tutto lo schermo. */
  hideTabBar?: boolean;
}

/**
 * In una applicazione a pagina singola il cambio rotta non sposta il focus
 * ne' annuncia nulla. Qui il focus viene portato sul contenitore principale
 * a ogni navigazione, cosi' chi usa screen reader o tastiera riparte dall'inizio
 * della pagina invece che dal punto in cui si trovava prima.
 */
export function AppShell({ children, hideTabBar = false }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenuto">Vai al contenuto</a>
      <main id="contenuto" ref={mainRef} tabIndex={-1} className="app-main" style={{ outline: 'none' }}>
        {children}
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  );
}
