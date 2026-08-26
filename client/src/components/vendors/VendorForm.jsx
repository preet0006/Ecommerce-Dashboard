import React, { useState, useEffect } from 'react';
import { Loader2, Check, Pencil, Plus, AlertCircle, Building2, Sparkles, List } from 'lucide-react';
import { api } from '../../lib/api';
import { EMPTY_FORM, ErrorBanner } from './utils';

export default function VendorForm({ vendor: initialVendor, onSaved, onCancel }) {
  const [editingVendor, setEditingVendor] = useState(initialVendor || null);
  const isEdit = Boolean(editingVendor?.id);

  const [existingVendors, setExistingVendors] = useState([]);
  const [showExistingPicker, setShowExistingPicker] = useState(false);

  const [form, setForm] = useState(
    initialVendor
      ? {
          vendorCode: initialVendor.vendorCode || '',
          name: initialVendor.name || '',
          contact: initialVendor.contact || '',
          email: initialVendor.email || '',
          gstin: initialVendor.gstin || '',
          leadTimeDays: initialVendor.leadTimeDays || '7',
          creditDays: initialVendor.creditDays || '30',
          address: initialVendor.address || '',
        }
      : { ...EMPTY_FORM, leadTimeDays: '7', creditDays: '30' }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing vendor list for reference / quick auto-generate
  useEffect(() => {
    api.getVendors()
      .then((data) => {
        if (Array.isArray(data)) setExistingVendors(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialVendor) {
      setEditingVendor(initialVendor);
      setForm({
        vendorCode: initialVendor.vendorCode || '',
        name: initialVendor.name || '',
        contact: initialVendor.contact || '',
        email: initialVendor.email || '',
        gstin: initialVendor.gstin || '',
        leadTimeDays: initialVendor.leadTimeDays || '7',
        creditDays: initialVendor.creditDays || '30',
        address: initialVendor.address || '',
      });
    } else {
      setEditingVendor(null);
      setForm({ ...EMPTY_FORM, leadTimeDays: '7', creditDays: '30' });
    }
  }, [initialVendor]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Auto-generate the next sequential vendor code (e.g. V-003)
  const handleAutoGenerateCode = () => {
    const nextNum = existingVendors.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newCode = `V-${padded}`;
    setForm((f) => ({ ...f, vendorCode: newCode }));
    setEditingVendor(null);
  };

  const handleSelectExisting = (v) => {
    setEditingVendor(v);
    setForm({
      vendorCode: v.vendorCode || '',
      name: v.name || '',
      contact: v.contact || '',
      email: v.email || '',
      gstin: v.gstin || '',
      leadTimeDays: v.leadTimeDays || '7',
      creditDays: v.creditDays || '30',
      address: v.address || '',
    });
    setShowExistingPicker(false);
    setError(null);
    setSuccess(null);
  };

  const handleSwitchToNew = () => {
    setEditingVendor(null);
    setForm({ ...EMPTY_FORM, leadTimeDays: '7', creditDays: '30' });
    setShowExistingPicker(false);
    setError(null);
    setSuccess(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCode = form.vendorCode?.trim().toUpperCase();
    const cleanName = form.name?.trim();

    if (!cleanCode) {
      setError('Please enter a Vendor Code (e.g. V-003, V-004)');
      return;
    }
    if (!cleanName) {
      setError('Please enter the Vendor Name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vendorCode: cleanCode,
        name: cleanName,
        contact: form.contact?.trim() || null,
        email: form.email?.trim() || null,
        gstin: form.gstin?.trim() || null,
        address: form.address?.trim() || null,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : 7,
        creditDays: form.creditDays ? Number(form.creditDays) : 30,
      };

      if (isEdit && editingVendor?.id) {
        await api.updateVendor(editingVendor.id, payload);
        setSuccess(`Vendor "${cleanName}" (${cleanCode}) updated successfully!`);
      } else {
        const created = await api.createVendor(payload);
        setSuccess(`Vendor "${created.name}" (${created.vendorCode}) created in database!`);
        setForm({ ...EMPTY_FORM, leadTimeDays: '7', creditDays: '30' });
        setEditingVendor(null);
      }

      setTimeout(() => {
        onSaved?.();
      }, 900);
    } catch (err) {
      console.error('[VendorForm.handleSubmit]', err);
      setError(err.message || 'Failed to save vendor. Please check connection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5 sm:p-6 max-w-2xl animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
              {isEdit ? `Edit Vendor — ${editingVendor.name}` : 'Register New Vendor Partner'}
            </h3>
            <p className="text-xs text-ink-muted">
              {isEdit
                ? `Editing data for vendor ${form.vendorCode}.`
                : 'Enter your new vendor code and company details below to save into PostgreSQL.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleSwitchToNew}
              className="btn-ghost !text-xs text-primary font-semibold flex items-center gap-1 border border-primary/20 bg-primary-soft/50"
            >
              <Plus size={13} /> Switch to Add New
            </button>
          ) : (
            <span className="badge font-bold bg-primary-soft text-primary text-xs">
              <Plus size={11} className="inline mr-0.5" /> New Vendor
            </span>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-enter">
          <Check size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Direct Vendor Code Input */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="label !mb-0 font-bold">
                Vendor Code <span className="text-red-500 font-bold">*</span>
              </label>

              {!isEdit && (
                <button
                  type="button"
                  onClick={handleAutoGenerateCode}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} /> Auto-Generate (V-{String(existingVendors.length + 1).padStart(3, '0')})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                className="input font-mono font-bold text-sm tracking-wider uppercase text-ink flex-1"
                placeholder="e.g. V-003, V-004, APEX-01"
                value={form.vendorCode}
                onChange={(e) => setForm((f) => ({ ...f, vendorCode: e.target.value.toUpperCase() }))}
                required
                autoFocus={!isEdit}
              />

              {existingVendors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExistingPicker(!showExistingPicker)}
                  className="btn-outline !text-xs whitespace-nowrap px-3"
                  title="Pick an existing vendor from database"
                >
                  <List size={13} /> {showExistingPicker ? 'Hide List' : 'Pick Existing'}
                </button>
              )}
            </div>

            {/* Optional Existing Vendor Picker Dropdown */}
            {showExistingPicker && (
              <div className="mt-2 p-2 rounded-xl border border-border bg-surface-raised shadow-lg divide-y divide-border/60 max-h-48 overflow-y-auto animate-enter">
                <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider pb-1 px-2">
                  Existing Vendors in Database:
                </div>
                {existingVendors.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectExisting(v)}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between hover:bg-primary-soft/50 rounded-lg transition-colors"
                  >
                    <span className="font-mono font-bold text-ink">{v.vendorCode} — {v.name}</span>
                    <span className="text-[10px] text-primary font-semibold">Click to Load</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Vendor Name */}
          <div className="sm:col-span-2">
            <label className="label font-bold">
              Vendor / Company Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              className="input text-sm"
              placeholder="e.g. Apex Polymer Industries Ltd"
              value={form.name}
              onChange={update('name')}
              required
            />
          </div>

          {/* 3. Contact Number */}
          <div>
            <label className="label">Contact Phone</label>
            <input
              className="input"
              placeholder="e.g. +91 98200 11223"
              value={form.contact}
              onChange={update('contact')}
            />
          </div>

          {/* 4. Official Email */}
          <div>
            <label className="label">Official Email</label>
            <input
              className="input"
              type="email"
              placeholder="e.g. orders@apexpolymer.com"
              value={form.email}
              onChange={update('email')}
            />
          </div>

          {/* 5. GSTIN */}
          <div>
            <label className="label">GSTIN Number</label>
            <input
              className="input font-mono uppercase"
              placeholder="e.g. 24AABCG1234F1Z8"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
            />
          </div>

          {/* 6. Lead Time */}
          <div>
            <label className="label">Standard Lead Time (Days)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="180"
              placeholder="7"
              value={form.leadTimeDays}
              onChange={update('leadTimeDays')}
            />
          </div>

          {/* 7. Credit Days */}
          <div>
            <label className="label">Credit Payment Terms (Days)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="180"
              placeholder="30"
              value={form.creditDays}
              onChange={update('creditDays')}
            />
          </div>

          {/* 8. Address */}
          <div className="sm:col-span-2">
            <label className="label">Factory / Warehouse Address</label>
            <textarea
              className="textarea text-xs"
              rows={2}
              placeholder="e.g. Plot 42, GIDC Industrial Estate, Umbergaon, Gujarat — 396171"
              value={form.address}
              onChange={update('address')}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary !text-xs font-semibold px-4" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving to Database…
                </>
              ) : isEdit ? (
                'Update Vendor'
              ) : (
                'Save New Vendor'
              )}
            </button>
            <button type="button" className="btn-outline !text-xs" onClick={onCancel}>
              Cancel
            </button>
          </div>

          {!isEdit && form.vendorCode && (
            <span className="text-xs font-mono text-ink-muted">
              Creating Code: <strong className="text-primary font-bold">{form.vendorCode}</strong>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
