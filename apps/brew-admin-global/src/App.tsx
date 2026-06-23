import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Reporting } from './screens/Reporting';
import { LoyaltyConfig } from './screens/LoyaltyConfig';
import { Catalog } from './screens/Catalog';
import { Rbac } from './screens/Rbac';
import { Org } from './screens/Org';
import { Procurement } from './screens/Procurement';

/** The Brew Lab — head-office admin shell. */
const nav: Array<{ path: string; label: string; note?: string }> = [
  { path: '/reporting', label: 'Reporting & Analytics' },
  { path: '/loyalty', label: 'Loyalty' },
  { path: '/catalog', label: 'Catalog & Recipes' },
  { path: '/rbac', label: 'Roles & Permissions' },
  { path: '/org', label: 'Org & Stores', note: 'Regions, stores, store config, hours, menu/price overrides — multi-region from day one.' },
  { path: '/procurement', label: 'Procurement', note: 'Suppliers, central purchasing, approvals, inter-store transfers.' },
  { path: '/privacy', label: 'Privacy Admin', note: 'DSR handling, consent ledger, retention config, access audit (Privacy Officer).' },
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

function Placeholder({ label, note }: { label: string; note?: string }) {
  return (
    <section style={{ padding: 28 }}>
      <h2>{label}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 560 }}>{note}</p>
      <p style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        Placeholder — consumes <code>@brew/contracts</code> SDK.
      </p>
    </section>
  );
}

function NavLinks() {
  const { pathname } = useLocation();
  return (
    <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.4, margin: 0 }}>
      {nav.map((s) => {
        const active = pathname === s.path;
        return (
          <li key={s.path}>
            <Link
              to={s.path}
              style={{
                color: active ? 'var(--accent)' : 'var(--text)',
                fontWeight: active ? 700 : 400,
                textDecoration: 'none',
              }}
            >
              {s.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 230, borderRight: '1px solid var(--border)', padding: 16, background: 'var(--surface)' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
            <span className="mono" style={{ color: 'var(--accent)' }}>{'{ }'}</span> The Brew Lab
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}
          >
            // Global Admin
          </div>
        </div>
        <NavLinks />
        <div style={{ marginTop: 24 }}>
          <ThemeToggle />
        </div>
      </nav>
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/reporting" replace />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/loyalty" element={<LoyaltyConfig />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/rbac" element={<Rbac />} />
          <Route path="/org" element={<Org />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/privacy" element={<Placeholder label="Privacy Admin" note={nav[6].note} />} />
        </Routes>
      </main>
    </div>
  );
}
