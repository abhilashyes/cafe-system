import { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { OrderEntry } from './screens/OrderEntry';
import { Kds } from './screens/Kds';

/**
 * The Brew Lab — POS + store ops + KDS shell. Order Entry and KDS are live
 * (wired to the backend via @brew/contracts + the /kds WebSocket); the rest are
 * §5.2 placeholders.
 */
const live: Array<{ path: string; label: string }> = [
  { path: '/order', label: 'Order Entry' },
  { path: '/kds', label: 'KDS' },
];

const screens: Array<{ path: string; label: string; note: string }> = [
  { path: '/payments', label: 'Payments', note: 'UPI QR / UPI collect, Razorpay card terminal, cash. Manager-approved refunds.' },
  { path: '/fulfilment', label: 'Fulfilment', note: 'Order queue + bump bar; triggers KOT prints to stations.' },
  { path: '/store-ops', label: 'Store Ops', note: 'Open/close store, 86 items, cash drawer, end-of-day Z-report.' },
  { path: '/inventory', label: 'Inventory', note: 'On-hand stock, wastage, transfers, receiving, store POs.' },
  { path: '/reports', label: 'Reports', note: "Day's sales, top items, staff sales — scoped to this store." },
];

function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'dark');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('brew.theme', next);
    setTheme(next);
  };
  return (
    <button className="btn-tonal" onClick={toggle} title="Toggle theme" style={{ width: '100%' }}>
      {theme === 'dark' ? '☾ Dark' : '☀ Light'}
    </button>
  );
}

function Placeholder({ label, note }: { label: string; note: string }) {
  return (
    <section style={{ padding: 24 }}>
      <h2>{label}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 540 }}>{note}</p>
      <p style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        Placeholder — consumes <code>@brew/contracts</code> SDK.
      </p>
    </section>
  );
}

function Brand() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
        <span className="mono" style={{ color: 'var(--accent)' }}>{'{ }'}</span> The Brew Lab
      </div>
      <div
        className="mono"
        style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}
      >
        // POS &amp; KDS
      </div>
    </div>
  );
}

export function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 210, borderRight: '1px solid var(--border)', padding: 16, background: 'var(--surface)' }}>
        <Brand />
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.2, margin: 0 }}>
          {live.map((s) => (
            <li key={s.path}>
              <Link to={s.path}>{s.label} <span style={{ color: 'var(--accent-alt)', fontSize: 11 }}>● live</span></Link>
            </li>
          ))}
          {screens.map((s) => (
            <li key={s.path}>
              <Link to={s.path}>{s.label}</Link>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 24 }}>
          <ThemeToggle />
        </div>
      </nav>
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/order" replace />} />
          <Route path="/order" element={<OrderEntry />} />
          <Route path="/kds" element={<Kds />} />
          {screens.map((s) => (
            <Route key={s.path} path={s.path} element={<Placeholder label={s.label} note={s.note} />} />
          ))}
        </Routes>
      </main>
    </div>
  );
}
