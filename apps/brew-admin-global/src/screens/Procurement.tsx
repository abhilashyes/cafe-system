import { Page, Table } from '../components';
import { suppliers, purchaseOrders, transfers } from '../data';

function statusChip(status: string) {
  const color =
    status === 'RECEIVED' || status === 'COMPLETED'
      ? 'var(--accent-alt)'
      : status === 'APPROVED' || status === 'IN TRANSIT'
        ? 'var(--champagne)'
        : 'var(--text-muted)';
  return <span className="mono" style={{ color, fontSize: 12 }}>{status}</span>;
}

export function Procurement() {
  return (
    <Page title="Procurement" kicker="suppliers · purchase orders · transfers">
      <h3>Purchase orders</h3>
      <Table
        head={['PO', 'Supplier', 'Store', 'Lines', 'Status']}
        rows={purchaseOrders.map((p) => [
          <span className="mono" style={{ color: 'var(--accent)' }}>{p.id}</span>,
          p.supplier,
          p.store,
          <span style={{ color: 'var(--text-muted)' }}>{p.lines}</span>,
          statusChip(p.status),
        ])}
      />

      <h3 style={{ marginTop: 24 }}>Suppliers</h3>
      <Table
        head={['Supplier', 'Supplies', 'Lead time']}
        rows={suppliers.map((s) => [<strong>{s.name}</strong>, s.supplies, <span className="mono">{s.lead}</span>])}
      />

      <h3 style={{ marginTop: 24 }}>Inter-store transfers</h3>
      <Table
        head={['Transfer', 'From', 'To', 'Item', 'Status']}
        rows={transfers.map((t) => [
          <span className="mono" style={{ color: 'var(--accent)' }}>{t.id}</span>,
          t.from,
          t.to,
          t.item,
          statusChip(t.status),
        ])}
      />
    </Page>
  );
}
