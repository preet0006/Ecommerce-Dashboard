import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import { parseCSV, downloadProductsCSV } from './utils';

export default function BulkImport({ onImport, existingProducts }) {
  const [fileName,    setFileName]    = useState(null);
  const [preview,     setPreview]     = useState([]);
  const [importResult,setImportResult]= useState(null);
  const [error,       setError]       = useState('');
  const [dragging,    setDragging]    = useState(false);
  const inputRef = useRef(null);

  /* Categorise each CSV row vs existing catalogue */
  const categorised = useMemo(() => {
    const existingIds = new Set(existingProducts.map(p => p.id));
    return preview.map(r => ({
      ...r,
      _status: existingIds.has(r.id) ? 'update' : 'new',
    }));
  }, [preview, existingProducts]);

  const newCount     = categorised.filter(r => r._status === 'new').length;
  const updateCount  = categorised.filter(r => r._status === 'update').length;
  const keptCount    = existingProducts.filter(p => !preview.some(r => r.id === p.id)).length;

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (rows.length === 0) {
        setError('No valid rows found. Make sure the CSV has the correct headers and at least one data row.');
        setPreview([]);
      } else {
        setPreview(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleFile = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    setImportResult({ added: newCount, updated: updateCount, kept: keptCount });
    setPreview([]);
    setFileName(null);
  };

  const reset = () => {
    setFileName(null);
    setPreview([]);
    setImportResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="card p-6 max-w-3xl animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-semibold text-lg mb-1">Bulk Import Products</h3>
          <p className="text-sm text-ink-muted">
            Upload a CSV with your product catalogue. Missing values will be auto-completed from known items.
          </p>
        </div>
        <button
          type="button"
          className="btn-outline text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          onClick={() => downloadProductsCSV(existingProducts)}
          title="Download the full product catalogue CSV template"
        >
          <Download size={14} /> Download Sample CSV
        </button>
      </div>

      <p className="text-xs font-mono text-ink-muted mb-3 bg-surface-raised p-2 rounded border border-border">
        Expected Headers: sku, name, category, mrp, gst, weight, dimensions, selling_price, landed_cost, stock
      </p>

      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-md py-10 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? 'var(--color-primary)' : 'var(--color-border)',
          background:  dragging ? 'var(--color-primary-soft)' : '',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <FileSpreadsheet size={28} className="text-ink-muted" />
        <span className="text-sm text-ink-muted">
          {fileName
            ? <span className="font-medium" style={{ color: 'var(--color-ink)' }}>{fileName}</span>
            : 'Click to select a CSV file, or drag it here'}
        </span>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </label>

      {error && (
        <div className="flex items-center gap-2 mt-4 text-sm rounded-md px-3 py-2" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {preview.length > 0 && !importResult && (
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="badge" style={{ background: '#e7f2ec', color: '#14513a' }}>
            ✦ {newCount} new product{newCount !== 1 ? 's' : ''} will be added
          </span>
          <span className="badge" style={{ background: '#e8f0fe', color: '#1a56db' }}>
            ↺ {updateCount} existing SKU{updateCount !== 1 ? 's' : ''} will be updated
          </span>
          <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' }}>
            🔒 {keptCount} product{keptCount !== 1 ? 's' : ''} unchanged
          </span>
        </div>
      )}

      {preview.length > 0 && !importResult && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">
            Preview — {preview.length} row{preview.length > 1 ? 's' : ''} detected
          </p>
          <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <table className="table-clean text-xs" style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                <tr>
                  <th style={{ paddingLeft: 10 }}>Status</th>
                  <th>SKU</th><th>Name</th><th>Category</th>
                  <th>MRP</th><th>Selling Price</th><th>Landed Cost</th><th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {categorised.map((p, i) => (
                  <tr key={i} style={{
                    background: p._status === 'new'
                      ? 'rgba(231,242,236,0.5)'
                      : 'rgba(232,240,254,0.4)',
                  }}>
                    <td style={{ paddingLeft: 10 }}>
                      {p._status === 'new'
                        ? <span className="badge" style={{ background: '#e7f2ec', color: '#14513a', fontSize: 10 }}>✦ New</span>
                        : <span className="badge" style={{ background: '#e8f0fe', color: '#1a56db', fontSize: 10 }}>↺ Update</span>}
                    </td>
                    <td className="font-mono">{p.id}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category}</td>
                    <td>₹{Number(p.mrp || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(p.sellingPrice || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(p.landedCost || 0).toLocaleString('en-IN')}</td>
                    <td>{Number(p.stock || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="mt-5 rounded-lg p-4" style={{ background: 'var(--color-primary-soft)' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary-strong)' }}>
            <CheckCircle2 size={18} />
            <span className="font-semibold text-sm">Import Complete — catalogue is safe & up to date</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md p-3 text-center" style={{ background: '#fff' }}>
              <div className="font-mono text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{importResult.added}</div>
              <div className="text-xs text-ink-muted mt-0.5">Products Added</div>
            </div>
            <div className="rounded-md p-3 text-center" style={{ background: '#fff' }}>
              <div className="font-mono text-xl font-bold" style={{ color: '#1a56db' }}>{importResult.updated}</div>
              <div className="text-xs text-ink-muted mt-0.5">SKUs Updated</div>
            </div>
            <div className="rounded-md p-3 text-center" style={{ background: '#fff' }}>
              <div className="font-mono text-xl font-bold" style={{ color: 'var(--color-ink-muted)' }}>{importResult.kept}</div>
              <div className="text-xs text-ink-muted mt-0.5">Products Kept 🔒</div>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-primary-strong)' }}>
            ✅ All {importResult.kept} existing products that were not in this CSV remain untouched in the catalogue.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-5">
        {!importResult ? (
          <>
            <button
              className="btn-primary"
              disabled={preview.length === 0}
              onClick={handleImport}
            >
              <Upload size={16} /> Import {preview.length > 0 ? `${preview.length} Products` : 'Products'}
            </button>

            {fileName && (
              <button className="btn-ghost" onClick={reset}>
                <X size={14} /> Clear
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn-primary" onClick={reset}>
              <Upload size={16} /> Import Another File
            </button>
          </>
        )}
      </div>
    </div>
  );
}
