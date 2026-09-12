import { NavLink } from 'react-router-dom';
import { CalendarDays, Dumbbell, LineChart, ListChecks } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Oggi', Icon: CalendarDays, end: true },
  { to: '/schede', label: 'Schede', Icon: ListChecks, end: false },
  { to: '/esercizi', label: 'Esercizi', Icon: Dumbbell, end: false },
  { to: '/progressi', label: 'Progressi', Icon: LineChart, end: false },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Sezioni principali">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__item">
          <Icon size={22} aria-hidden="true" strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
