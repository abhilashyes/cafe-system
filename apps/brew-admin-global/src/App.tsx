import { Link, Navigate, Route, Routes } from 'react-router-dom';

/** Head-office admin shell. Screens are Phase 0 placeholders (§5.3). */
const screens: Array<{ path: string; label: string; note: string }> = [
  { path: '/org', label: 'Org & Stores', note: 'Regions, stores, store config, hours, menu/price overrides — multi-region from day one.' },
  { path: '/catalog', label: 'Catalog & Recipes', note: 'Products, modifiers, recipes/BOM, GST/HSN, pricing strategies.' },
  { path: '/rbac', label: 'Roles & Permissions', note: 'Create roles, assign granular permissions scoped to org/region/store.' },
  { path: '/loyalty', label: 'Loyalty', note: '5 tiers (thresholds, multipliers, benefits), points earn/expiry, rewards catalog; per-region overrides.' },
  { path: '/procurement', label: 'Procurement', note: 'Suppliers, central purchasing, approvals, inter-store transfers.' },
  { path: '/reporting', label: 'Reporting & Analytics', note: 'Org-wide sales/profit/unit-economics with drill-down to store/item/staff/time.' },
  { path: '/privacy', label: 'Privacy Admin', note: 'DSR handling, consent ledger, retention config, access audit (Privacy Officer).' },
];

function Placeholder({ label, note }: { label: string; note: string }) {
  return (
    <section style={{ padding: 24 }}>
      <h2>{label}</h2>
      <p style={{ color: '#666', maxWidth: 560 }}>{note}</p>
      <p style={{ color: '#aaa' }}>Phase 0 placeholder — consumes <code>@brew/contracts</code> SDK.</p>
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: 'system-ui', display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, borderRight: '1px solid #eee', padding: 16 }}>
        <h1 style={{ fontSize: 18 }}>Brew Admin</h1>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
          {screens.map((s) => (
            <li key={s.path}>
              <Link to={s.path}>{s.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1 }}>
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
