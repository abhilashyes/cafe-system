import type { ReactNode } from 'react';

export function Screen({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <section style={{ padding: 24, maxWidth: 960 }}>
      {kicker && <div className="mono" style={{ color: 'var(--accent)', fontSize: 12 }}>// {kicker}</div>}
      <h2 style={{ marginTop: 4 }}>{title}</h2>
      {children}
    </section>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  );
}

export function Grid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, marginTop: 4 }}>{value}</div>
    </Card>
  );
}

export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--surface)', textAlign: 'left' }}>
            {head.map((h, i) => (
              <th key={i} style={{ padding: '10px 14px', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: '10px 14px' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
