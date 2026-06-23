import { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

/** The Brew Lab — head-office admin shell. Screens are §5.3 placeholders. */
const screens: Array<{ path: string; label: string; note: string }> = [
  { path: '/org', label: 'Org & Stores', note: 'Regions, stores, store config, hours, menu/price overrides — multi-region from day one.' },
  { path: '/catalog', label: 'Catalog & Recipes', note: 'Products, modifiers, recipes/BOM, GST/HSN, pricing strategies.' },
  { path: '/rbac', label: 'Roles & Permissions', note: 'Create roles, assign granular permissions scoped to org/region/store.' },
  { path: '/loyalty', label: 'Loyalty', note: '5 tiers (thresholds, multipliers, benefits), points earn/expiry, rewards catalog; per-region overrides.' },
  { path: '/procurement', label: 'Procurement', note: 'Suppliers, central purchasing, approvals, inter-store transfers.' },
  { path: '/reporting', label: 'Reporting & Analytics', note: 'Org-wide sales/profit/unit-economics with drill-down to store/item/staff/time.' },
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

function Placeholder({ label, note }: { label: string; note: string }) {
  return (
    <section style={{ padding: 24 }}>
      <h2>{label}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 560 }}>{note}</p>
      <p style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        Placeholder — consumes <code>@brew/contracts</code> SDK.
      </p>
    </section>
  );
}

export function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 230, borderRight: '1px solid var(--border)', padding: 16, background: 'var(--surface)' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>The Brew Lab</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Global Admin
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.2, margin: 0 }}>
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
          <Route path="/" element={<Navigate to="/org" replace />} />
          {screens.map((s) => (
            <Route key={s.path} path={s.path} element={<Placeholder label={s.label} note={s.note} />} />
          ))}
        </Routes>
      </main>
    </div>
  );
}
