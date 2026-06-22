import { Link, Navigate, Route, Routes } from 'react-router-dom';

/**
 * POS + store ops + KDS shell. Screens are placeholders (Phase 0) — each is a
 * stub for the flows in §5.2 / §5.5 of the build brief.
 */
const screens: Array<{ path: string; label: string; note: string }> = [
  { path: '/order', label: 'Order Entry', note: 'Counter order entry, modifiers, dine-in/takeaway + table no., hold/recall, link app pre-orders.' },
  { path: '/payments', label: 'Payments', note: 'UPI QR / UPI collect, Razorpay card terminal, cash. Manager-approved refunds.' },
  { path: '/fulfilment', label: 'Fulfilment', note: 'Order queue + bump bar; triggers KOT prints to stations.' },
  { path: '/kds', label: 'KDS', note: 'Wall-mounted kitchen display — station lanes, SLA color cues, all-day counts.' },
  { path: '/store-ops', label: 'Store Ops', note: 'Open/close store, 86 items, cash drawer, end-of-day Z-report.' },
  { path: '/inventory', label: 'Inventory', note: 'On-hand stock, wastage, transfers, receiving, store POs.' },
  { path: '/reports', label: 'Reports', note: "Day's sales, top items, staff sales — scoped to this store." },
];

function Placeholder({ label, note }: { label: string; note: string }) {
  return (
    <section style={{ padding: 24 }}>
      <h2>{label}</h2>
      <p style={{ color: '#666', maxWidth: 540 }}>{note}</p>
      <p style={{ color: '#aaa' }}>Phase 0 placeholder — consumes <code>@brew/contracts</code> SDK.</p>
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: 'system-ui', display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 200, borderRight: '1px solid #eee', padding: 16 }}>
        <h1 style={{ fontSize: 18 }}>Brew POS</h1>
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
          <Route path="/" element={<Navigate to="/order" replace />} />
          {screens.map((s) => (
            <Route key={s.path} path={s.path} element={<Placeholder label={s.label} note={s.note} />} />
          ))}
        </Routes>
      </main>
    </div>
  );
}
