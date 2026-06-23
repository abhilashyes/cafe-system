import { Page, Card, StatCard, Grid, Bar, Table } from '../components';
import { kpis, revenueByDay, salesByChannel, salesByPayment, itemProfitability, insights, rupees } from '../data';

export function Reporting() {
  const maxDay = Math.max(...revenueByDay.map((d) => d.value));
  const ranked = [...itemProfitability].sort((a, b) => b.profitPaise - a.profitPaise);

  return (
    <Page title="Reporting & Analytics" kicker="org-wide · last 30 days">
      <Grid min={200}>
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} delta={k.delta} up={k.up} />
        ))}
      </Grid>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr', marginTop: 16 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Revenue by day</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
            {revenueByDay.map((d) => (
              <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: `${(d.value / maxDay) * 130}px`,
                    background: 'linear-gradient(var(--accent), var(--accent-alt))',
                    borderRadius: 6,
                  }}
                />
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{d.day}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Channel mix</h3>
          {salesByChannel.map((c) => (
            <Bar key={c.label} label={c.label} pct={c.pct} color={c.color} />
          ))}
          <h3>Payment mix</h3>
          {salesByPayment.map((c) => (
            <Bar key={c.label} label={c.label} pct={c.pct} color={c.color} />
          ))}
        </Card>
      </div>

      <h3 style={{ marginTop: 24 }}>Item profitability</h3>
      <Table
        head={['Item', 'Units', 'Margin', 'Profit']}
        rows={ranked.map((i) => [
          i.name,
          <span className="mono">{i.units.toLocaleString('en-IN')}</span>,
          <span style={{ color: i.marginPct >= 60 ? 'var(--accent-alt)' : 'var(--champagne)' }}>{i.marginPct}%</span>,
          <span className="price">{rupees(i.profitPaise)}</span>,
        ])}
      />

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Insights</h3>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: 'var(--text-muted)' }}>
          {insights.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
