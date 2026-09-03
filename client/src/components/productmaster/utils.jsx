import React from 'react';
import { Package, Calculator, Upload } from 'lucide-react';
import { UNIFIED_PRODUCTS } from '../../lib/productsData';

/* Build a unified map for quick lookup */
const UNIFIED_MAP = new Map(UNIFIED_PRODUCTS.map(p => [p.sku, p]));

export const INITIAL_PRODUCTS = UNIFIED_PRODUCTS.map((p) => {
  const sp = Number(p.sellingPrice ?? p.selling_price ?? 0);
  const lc = Number(p.landedCost ?? p.costPrice ?? p.landed_cost ?? 0);
  const mrp = Number(p.mrp ?? (sp > 0 ? Math.round(sp * 1.4) : 0));
  const stock = Number(p.physical ?? p.stock ?? 0);
  const autoContribution = sp > 0 ? Number((((sp - lc) / sp) * 100).toFixed(1)) : 0;

  return {
    id: p.sku || p.id,
    name: p.name || 'Unnamed Product',
    category: p.category || 'General',
    mrp: mrp > 0 ? mrp : sp,
    gst: p.gst ?? 18,
    weight: p.weight ?? 0.8,
    dimensions: p.dimensions || '25 × 20 × 15 cm',
    sellingPrice: sp,
    landedCost: lc,
    contributionPct: autoContribution,
    stock,
  };
});

export const PRODUCT_MASTER_TABS = [
  { id: 'list',   label: 'Product List',   icon: Package },
  { id: 'cost',   label: 'Cost Breakdown', icon: Calculator },
  { id: 'import', label: 'Bulk Import',    icon: Upload },
];

export const CATEGORIES = [
  'Casserole', 'Bowl', 'Pet Accessories', 'Storage', 'Tableware',
  'Drinkware', 'Cookware', 'Appliances', 'Kitchenware', 'Cutlery',
  'Utensils', 'Bakeware', 'Serveware', 'Dining', 'Barware',
  'Cleaning', 'Food Prep', 'Tea & Coffee', 'Textiles', 'Kitchen Prep',
  'Accessories', 'Baking', 'Dining Accessories', 'Waste Management'
];

export const TEMPLATE_HEADERS = ['sku','name','category','mrp','gst','weight','dimensions','selling_price','landed_cost','stock'];
export const TEMPLATE_SAMPLE  = ['GF-CAS-006','Casserole Set D (4pc)','Casserole','1499','18','1.4','"32 x 22 x 16 cm"','1099','650','200'];

export const EMPTY_PRODUCT_FORM = { id: '', name: '', category: 'Casserole', mrp: '', gst: '', weight: '', dimensions: '' };

export function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* Tokenise one CSV line respecting RFC-4180 quoted fields and multiple delimiters */
export function splitCSVLine(line, delimiter = ',') {
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
      else if (ch === delimiter) { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/* Normalise a header string */
export function normHeader(h) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* Strip ₹, commas, %, spaces */
export function parseNum(v) {
  if (v == null || v === '') return 0;
  const cleaned = String(v).replace(/[₹,%\s]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/* Try to resolve a normalised header to our internal field name */
export function resolveHeader(raw) {
  const n = normHeader(raw);
  const MAP = {
    sku: 'sku', skucode: 'sku', skuid: 'sku', id: 'sku', itemcode: 'sku', item: 'sku',
    name: 'name', productname: 'name', product: 'name', title: 'name', itemname: 'name', description: 'name',
    category: 'category', cat: 'category', categoryname: 'category', department: 'category',
    mrp: 'mrp', maximumretailprice: 'mrp', listprice: 'mrp', mrpinr: 'mrp', mrprs: 'mrp', retailprice: 'mrp',
    gst: 'gst', gstpercent: 'gst', gstp: 'gst', tax: 'gst', taxrate: 'gst',
    weight: 'weight', weightkg: 'weight', wt: 'weight', weightg: 'weight',
    dimensions: 'dimensions', cartondimensions: 'dimensions', size: 'dimensions', dimension: 'dimensions',
    sellingprice: 'selling_price', saleprice: 'selling_price', price: 'selling_price', sp: 'selling_price', sellingpriceinr: 'selling_price', sellingpricers: 'selling_price',
    landedcost: 'landed_cost', cost: 'landed_cost', landedcostprice: 'landed_cost', lc: 'landed_cost', costprice: 'landed_cost', cp: 'landed_cost', landedcostinr: 'landed_cost',
    stock: 'stock', quantity: 'stock', qty: 'stock', inventory: 'stock', physical: 'stock', currentstock: 'stock', physicalstock: 'stock',
    contributionpct: 'contributionpct', margin: 'contributionpct', marginpct: 'contributionpct',
    contribution: 'contributionpct', contributionpercent: 'contributionpct',
    contributionmargin: 'contributionpct',
    sellingpr: 'selling_price', sellingp: 'selling_price', sellingpri: 'selling_price',
    landedco: 'landed_cost', landedc: 'landed_cost', landedcos: 'landed_cost',
    contribut: 'contributionpct', contributi: 'contributionpct',
  };
  return MAP[n] || n;
}

export function parseCSV(text) {
  if (!text) return [];
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = lines[0];
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
  else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = '\t';

  const rawHeaders = splitCSVLine(lines[0], delimiter);
  const headers    = rawHeaders.map(resolveHeader);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i], delimiter);
    if (vals.every(v => v === '')) continue;

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });

    const sku = (obj.sku || '').trim();
    if (!sku) continue;

    const baseKnown = UNIFIED_MAP.get(sku);

    let sp = parseNum(obj.selling_price);
    let lc = parseNum(obj.landed_cost);
    let mrp = parseNum(obj.mrp);
    let stock = parseNum(obj.stock);
    let gst = parseNum(obj.gst);
    let weight = parseNum(obj.weight);
    let dimensions = (obj.dimensions || '').trim();
    let name = (obj.name || '').trim();
    let category = (obj.category || '').trim();

    // Fallback from known unified database if CSV values are zero / empty / uncategorised
    if (baseKnown) {
      if (!name) name = baseKnown.name;
      if (!category || category.toLowerCase().startsWith('uncategori')) category = baseKnown.category || 'General';
      if (sp === 0) sp = Number(baseKnown.sellingPrice || baseKnown.costPrice || 0);
      if (lc === 0) lc = Number(baseKnown.landedCost || baseKnown.costPrice || 0);
      if (mrp === 0) mrp = Number(baseKnown.mrp || Math.round(sp * 1.4));
      if (stock === 0) stock = Number(baseKnown.physical || baseKnown.stock || 0);
      if (gst === 0) gst = Number(baseKnown.gst || 18);
      if (weight === 0) weight = Number(baseKnown.weight || 0.8);
      if (!dimensions) dimensions = baseKnown.dimensions || '25 × 20 × 15 cm';
    }

    if (!category || category.toLowerCase().startsWith('uncategori')) category = 'General';
    if (mrp === 0 && sp > 0) mrp = Math.round(sp * 1.4);

    const autoContribution = sp > 0 ? ((sp - lc) / sp) * 100 : (parseNum(obj.contributionpct) || 0);

    rows.push({
      id:              sku,
      name:            name || sku,
      category,
      mrp,
      gst:             gst || 18,
      weight:          weight || 0.8,
      dimensions:      dimensions || '25 × 20 × 15 cm',
      sellingPrice:    sp,
      landedCost:      lc,
      contributionPct: autoContribution,
      stock,
    });
  }

  return rows.filter(p => p.id);
}

export function downloadProductsCSV(products) {
  const list = (products && products.length > 0) ? products : INITIAL_PRODUCTS;
  const headers = ['sku','name','category','mrp','gst','weight','dimensions','selling_price','landed_cost','stock'];
  const rows = list.map(p => {
    const sp = Number(p.sellingPrice ?? p.selling_price ?? 0);
    const lc = Number(p.landedCost ?? p.costPrice ?? p.landed_cost ?? 0);
    const mrp = Number(p.mrp ?? (sp > 0 ? Math.round(sp * 1.4) : 0));
    const stock = Number(p.stock ?? p.physical ?? 0);
    const gst = p.gst != null && p.gst !== '' ? p.gst : 18;
    const weight = p.weight != null && p.weight !== '' ? p.weight : 0.8;
    const dimensions = p.dimensions || '25 × 20 × 15 cm';

    return [
      p.id || p.sku,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      mrp,
      gst,
      weight,
      `"${dimensions.replace(/"/g, '""')}"`,
      sp,
      lc,
      stock,
    ].join(',');
  });

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'greenfibre_products.csv';
  a.click();
  URL.revokeObjectURL(url);
}
