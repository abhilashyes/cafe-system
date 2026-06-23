import { useState } from 'react';
import { Screen, Card, Grid, Stat } from '../ui';

const menu = ['Caffè Latte', 'Cappuccino', 'Cold Brew', 'Mango Refresher', 'Butter Croissant'];

export function StoreOps() {
  const [open, setOpen] = useState(true);
  const [eightySixed, setEightySixed] = useState<string[]>(['Mango Refresher']);

  const toggle86 = (item: string) =>
    setEightySixed((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));

  return (
    <Screen title="Store operations" kicker="MG Road">
      <Grid>
        <Stat label="Status" value={open ? 'Open' : 'Closed'} />
        <Stat label="Cash drawer" value="₹6,400" />
        <Stat label="86'd items" value={`${eightySixed.length}`} />
      </Grid>

      <Card style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{open ? 'Store is open' : 'Store is closed'}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Controls whether the app accepts orders.</div>
        </div>
        <button className="btn" onClick={() => setOpen((o) => !o)}>{open ? 'Close store' : 'Open store'}</button>
      </Card>

      <h3 style={{ marginTop: 24 }}>86 / availability</h3>
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {menu.map((item) => {
            const off = eightySixed.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggle86(item)}
                className="btn-tonal"
                style={off ? { opacity: 0.55, textDecoration: 'line-through' } : undefined}
              >
                {item} {off ? '· 86' : ''}
              </button>
            );
          })}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
          Tap to toggle. 86'd items disappear from the customer app &amp; POS instantly.
        </div>
      </Card>
    </Screen>
  );
}
