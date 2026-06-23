import type { ReactNode } from 'react';

/** Page shell with a heading + optional kicker (// mono label). */
export function Page({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <section style={{ padding: 28, maxWidth: 1100 }}>
      {kicker && (
        <div className="mono" style={{ color: 'var(--accent)', fontSize: 12, marginBottom: 4 }}>
          // {kicker}
        </div>
      )}
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, delta, up }: { label: string; value: string; delta?: string; up?: boolean }) {
  return (
    <Card>
      <div className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 4, fontSize: 13, color: up ? 'var(--accent-alt)' : 'var(--rose)' }}>
          {up ? '▲' : '▼'} {delta}
        </div>
      )}
    </Card>
  );
}

export function Grid({ children, min = 220 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

/** Horizontal proportional bar. */
export function Bar({ label, pct, value, color = 'var(--accent)' }: { label: string; pct: number; value?: string; color?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span className="mono" style={{ color: 'var(--text-muted)' }}>{value ?? `${pct}%`}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
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
