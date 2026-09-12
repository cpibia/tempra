import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { IconButton } from './Button';

interface PageHeaderProps {
  title: string;
  /** Mostra il pulsante indietro. Se e' una stringa, e' la rotta di destinazione. */
  back?: boolean | string;
  actions?: ReactNode;
}

export function PageHeader({ title, back, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      {back && (
        <IconButton
          label="Torna indietro"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          style={{ marginInlineStart: 'calc(var(--spacing) * -2)' }}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </IconButton>
      )}
      <h1 className="app-header__title">{title}</h1>
      {actions}
    </header>
  );
}
