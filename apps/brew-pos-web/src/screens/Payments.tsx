import { useState } from 'react';
import { Screen, Card, Table } from '../ui';

const recent = [
  { id: 'pay_8841', order: 'A7Q2', method: 'UPI', amount: '₹525', status: 'CAPTURED' },
  { id: 'pay_8840', order: 'K3M9', method: 'Card', amount: '₹310', status: 'CAPTURED' },
  { id: 'pay_8839', order: 'P1X4', method: 'Cash', amount: '₹180', status: 'CAPTURED' },
  { id: 'pay_8838', order: 'B6T7', method: 'UPI', amount: '₹260', status: 'REFUNDED' },
];

export function Payments() {
  const [amount, setAmount] = useState('250');
  const upi = `upi://pay?pa=brewlab@upi&am=${amount}&tn=COUNTER`;

  return (
    <Screen title="Payments" kicker="UPI QR · card terminal · cash">
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Dynamic UPI QR</h3>
          <label className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount (₹)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            style={{ display: 'block', width: 120, margin: '6px 0 12px', padding: 8 }}
          />
          <div
            style={{
              background: '#fff',
              color: '#000',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: 12,
              borderRadius: 8,
              wordBreak: 'break-all',
            }}
          >
            ▢▣▢▣ QR ▣▢▣▢<br />
            {upi}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Customer scans with any UPI app; capture confirms via Razorpay webhook.
          </p>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Tenders</h3>
          <p style={{ color: 'var(--text-muted)' }}>Card terminal (Razorpay), UPI collect, and cash are reconciled at end-of-day.</p>
          <button className="btn" style={{ marginRight: 8 }}>Charge card</button>
          <button className="btn-tonal">Cash</button>
        </Card>
      </div>

      <h3 style={{ marginTop: 24 }}>Recent payments</h3>
      <Table
        head={['Payment', 'Order', 'Method', 'Amount', 'Status', '']}
        rows={recent.map((p) => [
          <span className="mono" style={{ color: 'var(--text-muted)' }}>{p.id}</span>,
          <span className="mono">{p.order}</span>,
          p.method,
          <span className="price">{p.amount}</span>,
          <span style={{ color: p.status === 'REFUNDED' ? 'var(--rose)' : 'var(--accent-alt)', fontSize: 13 }}>{p.status}</span>,
          p.status === 'CAPTURED' ? <button className="btn-tonal">Refund</button> : '',
        ])}
      />
    </Screen>
  );
}
