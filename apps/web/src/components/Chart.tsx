import { useId, useState } from 'react';
import { Table2 } from 'lucide-react';

export interface ChartPoint {
  label: string;
  value: number;
  /** Evidenzia il punto come record personale. */
  highlight?: boolean;
}

interface ChartProps {
  title: string;
  points: ChartPoint[];
  unit?: string;
  /** Riassunto testuale letto da chi non vede il grafico. */
  summary: string;
  type?: 'line' | 'bar';
}

/**
 * Grafico accessibile costruito a mano in SVG.
 *
 * Niente libreria: serve controllo totale su tre cose che le librerie
 * sbagliano quasi sempre. Primo, il grafico non e' l'unica rappresentazione
 * del dato: sotto c'e' sempre la tabella equivalente, apribile. Secondo, il
 * colore non e' l'unico veicolo: i punti hanno forma e i record un contorno.
 * Terzo, l'SVG e' marcato come immagine con una descrizione testuale, quindi
 * uno screen reader legge il senso invece di enumerare i nodi.
 */
export function Chart({ title, points, unit = '', summary, type = 'line' }: ChartProps) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  if (points.length === 0) {
    return <p className="muted tiny">Non ci sono ancora dati sufficienti per {title.toLowerCase()}.</p>;
  }

  const width = 320;
  const height = 140;
  const padding = { top: 12, right: 8, bottom: 22, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const x = (i: number) => padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padding.top + innerH - ((v - min) / span) * innerH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const gridLines = [0, 0.5, 1].map((ratio) => padding.top + innerH * ratio);

  const format = (v: number) => `${v.toLocaleString('it-IT', { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`;

  return (
    <figure className="chart" style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. ${summary}`}
        style={{ inlineSize: '100%', blockSize: 'auto', display: 'block' }}
      >
        {gridLines.map((gy, i) => (
          <line
            key={i} x1={padding.left} x2={width - padding.right} y1={gy} y2={gy}
            stroke="var(--color-chart-grid)" strokeWidth="1"
          />
        ))}
        <text x="2" y={padding.top + 4} fontSize="9" fill="var(--color-chart-axis)">{format(max)}</text>
        <text x="2" y={padding.top + innerH + 4} fontSize="9" fill="var(--color-chart-axis)">{format(min)}</text>

        {type === 'line' ? (
          <>
            <path d={path} fill="none" stroke="var(--color-chart-1)" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {points.map((point, i) => (
              point.highlight ? (
                <rect
                  key={i} x={x(i) - 4} y={y(point.value) - 4} width="8" height="8"
                  transform={`rotate(45 ${x(i)} ${y(point.value)})`}
                  fill="var(--color-chart-marker-pr)" stroke="var(--color-bg-surface)" strokeWidth="1.5"
                />
              ) : (
                <circle key={i} cx={x(i)} cy={y(point.value)} r="3"
                  fill="var(--color-chart-1)" stroke="var(--color-bg-surface)" strokeWidth="1.5" />
              )
            ))}
          </>
        ) : (
          points.map((point, i) => {
            const barW = Math.max(6, innerW / points.length - 6);
            return (
              <rect
                key={i}
                x={x(i) - barW / 2}
                y={y(point.value)}
                width={barW}
                height={Math.max(1, padding.top + innerH - y(point.value))}
                rx="2"
                fill={point.highlight ? 'var(--color-chart-marker-pr)' : 'var(--color-chart-1)'}
              />
            );
          })
        )}

        <text x={padding.left} y={height - 6} fontSize="9" fill="var(--color-chart-axis)">
          {points[0]!.label}
        </text>
        {points.length > 1 && (
          <text x={width - padding.right} y={height - 6} fontSize="9" textAnchor="end" fill="var(--color-chart-axis)">
            {points[points.length - 1]!.label}
          </text>
        )}
      </svg>

      <figcaption className="chart__caption">
        <span className="tiny muted">{summary}</span>
        <button
          type="button"
          className="link-button tiny"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((v) => !v)}
        >
          <Table2 size={13} aria-hidden="true" />
          {showTable ? 'Nascondi i dati' : 'Mostra i dati'}
        </button>
      </figcaption>

      <div id={tableId} hidden={!showTable}>
        <table className="data-table">
          <caption className="visually-hidden">{title}</caption>
          <thead>
            <tr><th scope="col">Data</th><th scope="col">Valore</th></tr>
          </thead>
          <tbody>
            {points.map((point, i) => (
              <tr key={i}>
                <th scope="row">{point.label}</th>
                <td className="num">{format(point.value)}{point.highlight ? ' (record)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
