import { Page, Card, Grid, StatCard } from '../components';
import { regions } from '../data';

export function Org() {
  const storeCount = regions.reduce((n, r) => n + r.stores.length, 0);
  const open = regions.reduce((n, r) => n + r.stores.filter((s) => s.open).length, 0);

  return (
    <Page title="Org & Stores" kicker="multi-region · live from day one">
      <Grid min={200}>
        <StatCard label="Regions" value={`${regions.length}`} />
        <StatCard label="Stores" value={`${storeCount}`} />
        <StatCard label="Open now" value={`${open}/${storeCount}`} />
        <StatCard label="Currency / TZ" value="INR · IST" />
      </Grid>

      {regions.map((r) => (
        <div key={r.name} style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 10 }}>
            {r.name} <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {r.stores.length} stores</span>
          </h3>
          <Grid min={260}>
            {r.stores.map((s) => (
              <Card key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontFamily: 'var(--font-heading)' }}>{s.name}</strong>
                  <span style={{ fontSize: 12, color: s.open ? 'var(--accent-alt)' : 'var(--text-muted)' }}>
                    {s.open ? '● open' : '○ closed'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{s.city}</div>
                <div className="mono" style={{ fontSize: 12, marginTop: 8 }}>GSTIN {s.gstin}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hours {s.hours}</div>
              </Card>
            ))}
          </Grid>
        </div>
      ))}
    </Page>
  );
}
