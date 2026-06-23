import { useState } from 'react';
import { Screen, Table, Card } from '../ui';

interface Stock {
  ingredient: string;
  unit: string;
  onHand: number;
  par: number;
}

const initial: Stock[] = [
  { ingredient: 'Espresso beans', unit: 'g', onHand: 48200, par: 5000 },
  { ingredient: 'Milk', unit: 'ml', onHand: 3600, par: 4000 },
  { ingredient: 'Croissant (raw)', unit: 'unit', onHand: 12, par: 20 },
  { ingredient: 'Mango base', unit: 'ml', onHand: 9000, par: 2000 },
];

export function Inventory() {
  const [stock, setStock] = useState(initial);

  const waste = (i: number) =>
    setStock((s) => s.map((row, j) => (j === i ? { ...row, onHand: Math.max(0, row.onHand - row.par) } : row)));
  const receive = (i: number) =>
    setStock((s) => s.map((row, j) => (j === i ? { ...row, onHand: row.onHand + row.par } : row)));

  return (
    <Screen title="Inventory" kicker="store on-hand · par levels">
      <Table
        head={['Ingredient', 'On hand', 'Par', 'Status', '']}
        rows={stock.map((row, i) => {
          const low = row.onHand <= row.par;
          return [
            row.ingredient,
            <span className="mono">{row.onHand.toLocaleString('en-IN')} {row.unit}</span>,
            <span className="mono" style={{ color: 'var(--text-muted)' }}>{row.par.toLocaleString('en-IN')}</span>,
            <span style={{ color: low ? 'var(--rose)' : 'var(--accent-alt)', fontSize: 13 }}>
              {low ? '● low — reorder' : '● ok'}
            </span>,
            <span style={{ display: 'flex', gap: 8 }}>
              <button className="btn-tonal" onClick={() => receive(i)}>Receive</button>
              <button className="btn-tonal" onClick={() => waste(i)}>Waste</button>
            </span>,
          ];
        })}
      />
      <Card style={{ marginTop: 12, color: 'var(--text-muted)' }}>
        Low-stock ingredients feed menu availability (86) and trigger reorder suggestions in
        head-office procurement.
      </Card>
    </Screen>
  );
}
