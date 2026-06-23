import { Screen, Grid, Stat, Table, Card } from '../ui';

const topItems = [
  { name: 'Caffè Latte', qty: 84, sales: '₹21,000' },
  { name: 'Cold Brew', qty: 52, sales: '₹14,560' },
  { name: 'Butter Croissant', qty: 47, sales: '₹8,460' },
  { name: 'Mango Refresher', qty: 31, sales: '₹8,990' },
];

const tenders = [
  { method: 'UPI', amount: '₹38,420' },
  { method: 'Card', amount: '₹11,250' },
  { method: 'Cash', amount: '₹4,600' },
];

/** Store-scoped day report (Z-report style). */
export function Reports() {
  return (
    <Screen title="Today's report" kicker="store: MG Road · scoped to this store">
      <Grid>
        <Stat label="Gross sales" value="₹54,270" />
        <Stat label="Orders" value="214" />
        <Stat label="Avg order" value="₹253" />
        <Stat label="Refunds" value="₹420" />
      </Grid>

      <h3 style={{ marginTop: 24 }}>Top items</h3>
      <Table
        head={['Item', 'Qty', 'Sales']}
        rows={topItems.map((i) => [i.name, <span className="mono">{i.qty}</span>, <span className="price">{i.sales}</span>])}
      />

      <h3 style={{ marginTop: 24 }}>Tenders (end-of-day)</h3>
      <Table
        head={['Method', 'Amount']}
        rows={tenders.map((t) => [t.method, <span className="price">{t.amount}</span>])}
      />
      <Card style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Reconcile drawer &amp; close the day.</span>
        <button className="btn">Run Z-report</button>
      </Card>
    </Screen>
  );
}
