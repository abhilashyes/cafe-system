// Demo data powering the Global Admin screens (clickable without a backend).
// Shapes mirror the brew-contracts / backend APIs (reports, loyalty, catalog, RBAC).

export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export const kpis = [
  { label: 'Revenue (30d)', value: '₹18,42,500', delta: '+12.4%', up: true },
  { label: 'Orders', value: '7,318', delta: '+8.1%', up: true },
  { label: 'Avg order value', value: '₹251', delta: '+3.9%', up: true },
  { label: 'Gross margin', value: '63.2%', delta: '-1.2%', up: false },
];

export const revenueByDay = [
  { day: 'Mon', value: 58 },
  { day: 'Tue', value: 62 },
  { day: 'Wed', value: 71 },
  { day: 'Thu', value: 66 },
  { day: 'Fri', value: 88 },
  { day: 'Sat', value: 100 },
  { day: 'Sun', value: 84 },
];

export const salesByChannel = [
  { label: 'Mobile pre-order', pct: 58, color: 'var(--accent)' },
  { label: 'Walk-in', pct: 42, color: 'var(--accent-alt)' },
];

export const salesByPayment = [
  { label: 'UPI', pct: 71, color: 'var(--accent)' },
  { label: 'Card', pct: 21, color: 'var(--accent-alt)' },
  { label: 'Cash', pct: 8, color: 'var(--champagne)' },
];

export const itemProfitability = [
  { name: 'Caffè Latte', units: 1820, marginPct: 71, profitPaise: 25800000 },
  { name: 'Cold Brew', units: 1190, marginPct: 76, profitPaise: 22100000 },
  { name: 'Protein Latte', units: 540, marginPct: 68, profitPaise: 11600000 },
  { name: 'Butter Croissant', units: 1610, marginPct: 58, profitPaise: 9800000 },
  { name: 'Mango Refresher', units: 880, marginPct: 64, profitPaise: 8700000 },
  { name: 'Choco Muffin', units: 430, marginPct: 41, profitPaise: 2100000 },
];

export const insights = [
  'Butter Croissant: high volume but below-median margin — review supplier cost or price.',
  'Cold Brew: high margin and rising volume — feature it on the app home.',
  'Choco Muffin: low volume and low margin — candidate to retire or rework.',
];

export const tierDistribution = [
  { tier: 'Welcome', pct: 46 },
  { tier: 'Green', pct: 28 },
  { tier: 'Gold', pct: 16 },
  { tier: 'Platinum', pct: 8 },
  { tier: 'Black', pct: 2 },
];

export const tiers = [
  { id: 't1', name: 'Welcome', rank: 1, threshold: '₹0', multiplier: '1.0×', benefits: 'Member pricing' },
  { id: 't2', name: 'Green', rank: 2, threshold: '₹5,000', multiplier: '1.25×', benefits: 'Birthday treat' },
  { id: 't3', name: 'Gold', rank: 3, threshold: '₹15,000', multiplier: '1.5×', benefits: 'Free refills' },
  { id: 't4', name: 'Platinum', rank: 4, threshold: '₹40,000', multiplier: '1.75×', benefits: 'Priority pickup' },
  { id: 't5', name: 'Black', rank: 5, threshold: '₹1,00,000', multiplier: '2.0×', benefits: 'Concierge' },
];

export const rewards = [
  { id: 'rw_free_coffee', name: 'Free brewed coffee', costStars: 150, discount: '₹150', active: true },
  { id: 'rw_free_pastry', name: 'Free pastry', costStars: 200, discount: '₹180', active: true },
  { id: 'rw_double_stars', name: 'Double stars day', costStars: 0, discount: '—', active: false },
];

export const products = [
  { name: 'Caffè Latte', sku: 'BEV-LAT', category: 'Hot Coffee', price: '₹250', hsn: '2106', gst: '5%', recipe: 'Espresso 18g · Milk 200ml' },
  { name: 'Cappuccino', sku: 'BEV-CAP', category: 'Hot Coffee', price: '₹240', hsn: '2106', gst: '5%', recipe: 'Espresso 18g · Milk 150ml' },
  { name: 'Cold Brew', sku: 'BEV-CB', category: 'Cold Coffee', price: '₹280', hsn: '2106', gst: '5%', recipe: 'Coffee 30g · Water 250ml' },
  { name: 'Mango Refresher', sku: 'REF-MNG', category: 'Refreshers', price: '₹290', hsn: '2202', gst: '12%', recipe: 'Mango base 60ml · Water 200ml' },
  { name: 'Protein Latte', sku: 'BEV-PRO', category: 'Protein Beverages', price: '₹320', hsn: '2106', gst: '5%', recipe: 'Espresso 18g · Protein milk 220ml' },
  { name: 'Butter Croissant', sku: 'BAK-CRO', category: 'Bakery', price: '₹180', hsn: '1905', gst: '5%', recipe: 'Croissant 1 unit' },
];

export const permissions = ['order', 'payment', 'refund', 'inventory', 'reports', 'loyalty', 'privacy'];

export const roles = [
  { key: 'Cashier', allow: ['order', 'payment'] },
  { key: 'Barista', allow: ['order'] },
  { key: 'Shift Supervisor', allow: ['order', 'payment', 'refund', 'inventory'] },
  { key: 'Store Manager', allow: ['order', 'payment', 'refund', 'inventory', 'reports'] },
  { key: 'Regional Manager', allow: ['reports', 'inventory'] },
  { key: 'Finance Analyst', allow: ['reports'] },
  { key: 'Privacy Officer', allow: ['privacy'] },
  { key: 'Super Admin', allow: ['order', 'payment', 'refund', 'inventory', 'reports', 'loyalty', 'privacy'] },
];
