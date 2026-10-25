import { NavLink } from 'react-router-dom';
import { CalendarDays, Dumbbell, LineChart, ListChecks, Settings } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Oggi', Icon: CalendarDays, end: true },
  { to: '/schede', label: 'Schede', Icon: ListChecks, end: false },
  { to: '/esercizi', label: 'Esercizi', Icon: Dumbbell, end: false },
  { to: '/statistiche', label: 'Statistiche', Icon: LineChart, end: false },
];

/**
 * Sul telefono e' la barra in basso; da 600px diventa una barra laterale, che
 * da 1200px mostra le etichette accanto alle icone. Le impostazioni compaiono
 * solo nella barra laterale: sul telefono si aprono dall'ingranaggio di Oggi.
 */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Sezioni principali">
      <span className="tabbar__brand" aria-hidden="true">
        <img src="/icons/favicon.svg" alt="" width="28" height="28" />
        <span className="tabbar__brand-name">Tempra</span>
      </span>
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__item">
          <Icon size={22} aria-hidden="true" strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
      <NavLink to="/impostazioni" className="tabbar__item tabbar__item--settings">
        <Settings size={22} aria-hidden="true" strokeWidth={2} />
        <span>Impostazioni</span>
      </NavLink>
    </nav>
  );
}
