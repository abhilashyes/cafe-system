import { useEffect, useState } from 'react';
import type { MenuItem, Order } from '@brew/contracts';
import { api, STORE_ID } from '../api';
import { demo, demoMode } from '../demo';

interface CartLine {
  productId: string;
  name: string;
  pricePaise: number;
  quantity: number;
}

const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

/** Counter order entry: menu → cart → dine-in/takeaway → place order → take payment. */
export function OrderEntry() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfilment, setFulfilment] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (demoMode) {
      setMenu(demo.menu());
      return;
    }
    api.listStoreMenu(STORE_ID).then(setMenu).catch((e) => setError(String(e)));
  }, []);

  const add = (item: MenuItem) =>
    setCart((c) => {
      const existing = c.find((l) => l.productId === item.id);
      if (existing) return c.map((l) => (l.productId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { productId: item.id, name: item.name, pricePaise: item.pricePaise, quantity: 1 }];
    });

  const subtotal = cart.reduce((s, l) => s + l.pricePaise * l.quantity, 0);

  async function placeAndPay() {
    setBusy(true);
    setError(null);
    try {
      const table = fulfilment === 'DINE_IN' ? tableNumber || undefined : undefined;
      if (demoMode) {
        // Fully client-side: create the order + KDS ticket in the demo store.
        setPlaced(demo.placeOrder(cart, fulfilment, table));
        setCart([]);
        return;
      }
      const order = await api.createOrder({
        storeId: STORE_ID,
        channel: 'WALK_IN',
        fulfilment,
        tableNumber: table,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      // Cash is captured immediately at the counter (emits PaymentCaptured).
      await api.createPayment({
        orderId: order.id,
        storeId: STORE_ID,
        method: 'CASH',
        amountPaise: order.totals.grandTotalPaise,
      });
      setPlaced(order);
      setCart([]);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ padding: 24, display: 'flex', gap: 32 }}>
      <div style={{ flex: 1 }}>
        <h2>Menu</h2>
        {error && <p style={{ color: 'var(--rose)' }}>{error}</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menu.map((m) => (
            <li key={m.id} style={{ marginBottom: 8 }}>
              <button className="btn-tonal" disabled={!m.available} onClick={() => add(m)}>
                {m.name} — <span className="price">{rupees(m.pricePaise)}</span>{' '}
                {m.available ? '' : <span style={{ color: 'var(--text-muted)' }}>(86)</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          width: 320,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          alignSelf: 'flex-start',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Order</h2>
        <div style={{ marginBottom: 8 }}>
          <label>
            <input
              type="radio"
              checked={fulfilment === 'TAKEAWAY'}
              onChange={() => setFulfilment('TAKEAWAY')}
            />{' '}
            Takeaway
          </label>{' '}
          <label>
            <input
              type="radio"
              checked={fulfilment === 'DINE_IN'}
              onChange={() => setFulfilment('DINE_IN')}
            />{' '}
            Dine-in
          </label>
          {fulfilment === 'DINE_IN' && (
            <input
              placeholder="Table #"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={{ marginLeft: 8, width: 70 }}
            />
          )}
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {cart.map((l) => (
            <li key={l.productId}>
              {l.quantity}× {l.name} — <span className="price">{rupees(l.pricePaise * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <p>
          <strong>Subtotal (ex-GST): <span className="price">{rupees(subtotal)}</span></strong>
        </p>
        <button className="btn" disabled={cart.length === 0 || busy} onClick={placeAndPay}>
          {busy ? 'Processing…' : 'Place & take cash'}
        </button>

        {placed && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            <strong style={{ color: 'var(--accent-alt)' }}>Order placed ✓</strong>
            <div>Pickup code: <strong style={{ color: 'var(--accent)' }}>{placed.pickupCode}</strong></div>
            <div>Total: <span className="price">{rupees(placed.totals.grandTotalPaise)}</span></div>
            <div style={{ color: 'var(--text-muted)' }}>Tickets sent to the KDS &amp; printers.</div>
          </div>
        )}
      </div>
    </section>
  );
}
