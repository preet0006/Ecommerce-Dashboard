import React from 'react';
import { Package, Calculator, Upload } from 'lucide-react';

export const INITIAL_PRODUCTS = [
  { id: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole',      mrp: 1299, gst: 18, weight: 1.2, dimensions: '30 × 20 × 15 cm', sellingPrice: 899,  landedCost: 585,  contributionPct: 34.9, stock: 650 },
  { id: 'GF-BWL-014', name: 'Bowl Set B (6pc)',       category: 'Bowl',           mrp: 799,  gst: 12, weight: 0.8, dimensions: '25 × 18 × 12 cm', sellingPrice: 549,  landedCost: 410,  contributionPct: 25.3, stock: 180 },
  { id: 'GF-PET-002', name: 'Pet Bowl Steel',         category: 'Pet Accessories',mrp: 349,  gst: 12, weight: 0.4, dimensions: '20 × 20 × 8 cm',  sellingPrice: 249,  landedCost: 140,  contributionPct: 43.8, stock: 900 },
  { id: 'GF-CAS-005', name: 'Casserole Set C (5pc)',  category: 'Casserole',      mrp: 1899, gst: 18, weight: 2.1, dimensions: '40 × 28 × 18 cm', sellingPrice: 1399, landedCost: 1120, contributionPct: 19.9, stock: 90  },
];

export const PRODUCT_MASTER_TABS = [
  { id: 'list',   label: 'Product List',   icon: Package },
  { id: 'cost',   label: 'Cost Breakdown', icon: Calculator },
  { id: 'import', label: 'Bulk Import',    icon: Upload },
];

export const CATEGORIES = ['Casserole', 'Bowl', 'Pet Accessories', 'Storage'];

export const TEMPLATE_HEADERS = ['sku','name','category','mrp','gst','weight','dimensions','selling_price','landed_cost','stock'];
export const TEMPLATE_SAMPLE  = ['GF-CAS-006','Casserole Set D (4pc)','Casserole','1499','18','1.4','"32 x 22 x 16 cm"','1099','650','200'];

export const EMPTY_PRODUCT_FORM = { id: '', name: '', category: 'Casserole', mrp: '', gst: '', weight: '', dimensions: '' };

export function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* Tokenise one CSV line respecting RFC-4180 quoted fields */
export function splitCSVLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/* Normalise a header string */
export function normHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* Strip ₹, commas, %, spaces */
export function parseNum(v) {
  if (v == null) return 0;
  const cleaned = String(v).replace(/[₹,%\s]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/* Try to resolve a normalised header to our internal field name */
export function resolveHeader(raw) {
  const n = normHeader(raw);
  const MAP = {
    sku: 'sku', skucode: 'sku', skuid: 'sku', id: 'sku',
    name: 'name', productname: 'name', product: 'name', title: 'name',
    category: 'category', cat: 'category',
    mrp: 'mrp', maximumretailprice: 'mrp', listprice: 'mrp',
    gst: 'gst', gstpercent: 'gst', gstp: 'gst', tax: 'gst',
    weight: 'weight', weightkg: 'weight', wt: 'weight',
    dimensions: 'dimensions', cartondimensions: 'dimensions', size: 'dimensions',
    sellingprice: 'selling_price', saleprice: 'selling_price', price: 'selling_price', sp: 'selling_price',
    landedcost: 'landed_cost', cost: 'landed_cost', landedcostprice: 'landed_cost', lc: 'landed_cost',
    stock: 'stock', quantity: 'stock', qty: 'stock', inventory: 'stock',
    contributionpct: 'contributionpct', margin: 'contributionpct',
    contribution: 'contributionpct', contributionpercent: 'contributionpct',
    contributionmargin: 'contributionpct',
    sellingpr: 'selling_price', sellingp: 'selling_price', sellingpri: 'selling_price',
    landedco: 'landed_cost', landedc: 'landed_cost', landedcos: 'landed_cost',
    contribut: 'contributionpct', contributi: 'contributionpct',
  };
  return MAP[n] || n;
}

export function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const rawHeaders = splitCSVLine(lines[0]);
  const headers    = rawHeaders.map(resolveHeader);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    if (vals.every(v => v === '')) continue;

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });

    const sp = parseNum(obj.selling_price);
    const lc = parseNum(obj.landed_cost);

    rows.push({
      id:              (obj.sku || '').trim(),
      name:            (obj.name || '').trim(),
      category:        (obj.category || 'Uncategorised').trim(),
      mrp:             parseNum(obj.mrp),
      gst:             parseNum(obj.gst),
      weight:          parseNum(obj.weight),
      dimensions:      (obj.dimensions || '').trim(),
      sellingPrice:    sp,
      landedCost:      lc,
      contributionPct: sp > 0 ? ((sp - lc) / sp) * 100 : parseNum(obj.contributionpct),
      stock:           parseNum(obj.stock),
    });
  }

  return rows.filter(p => p.id);
}

export function downloadProductsCSV(products) {
  const headers = ['sku','name','category','mrp','gst','weight','dimensions','selling_price','landed_cost','stock'];
  const rows = products.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.category,
    p.mrp,
    p.gst ?? '',
    p.weight ?? '',
    `"${(p.dimensions || '').replace(/"/g, '""')}"`,
    p.sellingPrice,
    p.landedCost,
    p.stock,
  ].join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'greenfibre_products.csv';
  a.click();
  URL.revokeObjectURL(url);
}
