import { Page, Card, Grid, Bar, Table, StatCard } from '../components';
import { tiers, rewards, tierDistribution } from '../data';

export function LoyaltyConfig() {
  return (
    <Page title="Loyalty" kicker="program configuration">
      <Grid min={200}>
        <StatCard label="Earn rate" value="1★ / ₹10" />
        <StatCard label="Membership tiers" value="5" />
        <StatCard label="Points expiry" value="12 months" />
        <StatCard label="Active rewards" value={`${rewards.filter((r) => r.active).length}`} />
      </Grid>

      <h3 style={{ marginTop: 24 }}>Membership tiers</h3>
      <Table
        head={['Tier', 'Qualifying spend', 'Accrual', 'Benefits']}
        rows={tiers.map((t) => [
          <strong style={{ color: 'var(--accent)' }}>{t.name}</strong>,
          <span className="mono">{t.threshold}</span>,
          <span className="mono">{t.multiplier}</span>,
          t.benefits,
        ])}
      />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 24 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Tier distribution</h3>
          {tierDistribution.map((t) => (
            <Bar key={t.tier} label={t.tier} pct={t.pct} />
          ))}
        </Card>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 18, paddingBottom: 0 }}><h3 style={{ margin: 0 }}>Rewards catalog</h3></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 12 }}>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 18px' }}>{r.name}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: 'var(--champagne)' }}>★ {r.costStars}</td>
                  <td className="mono" style={{ padding: '10px 14px' }}>{r.discount}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: r.active ? 'var(--accent-alt)' : 'var(--text-muted)' }}>
                      {r.active ? '● active' : '○ off'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Page>
  );
}
