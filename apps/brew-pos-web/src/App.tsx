import { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { OrderEntry } from './screens/OrderEntry';
import { Kds } from './screens/Kds';
import { Payments } from './screens/Payments';
import { StoreOps } from './screens/StoreOps';
import { Inventory } from './screens/Inventory';
import { Reports } from './screens/Reports';

/**
 * The Brew Lab — POS + store ops + KDS shell. Order Entry and KDS are live
 * (wired to the backend via @brew/contracts + the /kds WebSocket); the rest are
 * §5.2 placeholders.
 */
const live: Array<{ path: string; label: string }> = [
  { path: '/order', label: 'Order Entry' },
  { path: '/kds', label: 'KDS' },
];

const screens: Array<{ path: string; label: string }> = [
  { path: '/payments', label: 'Payments' },
  { path: '/store-ops', label: 'Store Ops' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/reports', label: 'Reports' },
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
          <Route path="/payments" element={<Payments />} />
          <Route path="/store-ops" element={<StoreOps />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
