import { Page, Table } from '../components';
import { products } from '../data';

export function Catalog() {
  return (
    <Page title="Catalog & Recipes" kicker="products · BOM · GST">
      <Table
        head={['Product', 'SKU', 'Category', 'Price', 'HSN/SAC', 'GST', 'Recipe (BOM)']}
        rows={products.map((p) => [
          <strong>{p.name}</strong>,
          <span className="mono" style={{ color: 'var(--text-muted)' }}>{p.sku}</span>,
          p.category,
          <span className="price">{p.price}</span>,
          <span className="mono">{p.hsn}</span>,
          <span className="mono">{p.gst}</span>,
          <span style={{ color: 'var(--text-muted)' }}>{p.recipe}</span>,
        ])}
      />
      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>
        Recipes (bill of materials) drive both inventory deduction and COGS for the profit
        figures in Reporting.
      </p>
    </Page>
  );
}
