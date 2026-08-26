import React, { useState } from 'react';
import { Loader2, Check, Pencil, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { EMPTY_FORM, ErrorBanner } from './utils';
import VendorCodeCombobox from './VendorCodeCombobox';

/* ══════════════════════════════════════════════════════════════
   ADD / EDIT VENDOR FORM
   – Vendor Code field is now a smart combobox
   – Selecting an existing code switches to Edit mode
   – Selecting "Add New Vendor" resets to Create mode
══════════════════════════════════════════════════════════════ */
export default function VendorForm({ vendor: initialVendor, onSaved, onCancel }) {
  const [editingVendor, setEditingVendor] = useState(initialVendor || null);
  const isEdit = Boolean(editingVendor?.id);

  const [form, setForm] = useState(
    initialVendor
      ? {
        vendorCode: initialVendor.vendorCode || '',
        name: initialVendor.name || '',
        contact: initialVendor.contact || '',
        email: initialVendor.email || '',
        gstin: initialVendor.gstin || '',
        leadTimeDays: initialVendor.leadTimeDays || '',
        creditDays: initialVendor.creditDays || '',
        address: initialVendor.address || '',
      }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSelectExisting(vendor) {
    setEditingVendor(vendor);
    setForm({
      vendorCode: vendor.vendorCode || '',
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      gstin: vendor.gstin || '',
      leadTimeDays: vendor.leadTimeDays || '',
      creditDays: vendor.creditDays || '',
      address: vendor.address || '',
    });
    setError(null);
    setSuccess(null);
  }

  function handleAddNew() {
    setEditingVendor(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        creditDays: form.creditDays ? Number(form.creditDays) : undefined,
      };
      if (isEdit) {
        await api.updateVendor(editingVendor.id, payload);
        setSuccess(`${form.name} updated successfully!`);
      } else {
        const created = await api.createVendor(payload);
        setSuccess(`${created.name} (${created.vendorCode}) created!`);
        setForm({ ...EMPTY_FORM });
        setEditingVendor(null);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 max-w-2xl animate-enter">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold text-lg">
          {isEdit ? `Edit — ${editingVendor.name}` : 'Add New Vendor'}
        </h3>
        {isEdit && (
          <span className="badge-ok flex items-center gap-1">
            <Pencil size={11} /> Edit Mode
          </span>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-5">
        {isEdit
          ? 'Editing existing vendor master data. Select a different code or "Add New Vendor" to switch.'
          : 'Select an existing vendor code to edit it, or type a new code to create one.'}
      </p>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary-strong)' }}>
          <Check size={15} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">

          {/* Vendor Code — Smart Combobox */}
          <div>
            <label className="label">
              Vendor Code <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <VendorCodeCombobox
              value={form.vendorCode}
              onChange={(val) => setForm((f) => ({ ...f, vendorCode: val }))}
              onSelectExisting={handleSelectExisting}
              onAddNew={handleAddNew}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                Code is locked in edit mode. Pick a different code above to switch vendors.
              </p>
            )}
          </div>

          {/* Vendor Name */}
          <div>
            <label className="label">
              Vendor Name <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input className="input" placeholder="Shreeji Plastics" value={form.name} onChange={update('name')} required />
          </div>

          {/* Contact */}
          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="+91 98200 11223" value={form.contact} onChange={update('contact')} />
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="orders@vendor.com" value={form.email} onChange={update('email')} />
          </div>

          {/* GSTIN */}
          <div>
            <label className="label">GSTIN</label>
            <input className="input" placeholder="27ABCDE1234F1Z5" value={form.gstin} onChange={update('gstin')} />
          </div>

          {/* Lead Time */}
          <div>
            <label className="label">Standard Lead Time (days)</label>
            <input className="input" type="number" placeholder="10" value={form.leadTimeDays} onChange={update('leadTimeDays')} />
          </div>

          {/* Credit Days */}
          <div>
            <label className="label">Credit Days</label>
            <input className="input" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="textarea" rows={3} placeholder="Factory / warehouse address" value={form.address} onChange={update('address')} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : isEdit ? 'Update Vendor' : 'Create Vendor'}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
          {isEdit && (
            <button type="button" className="btn-ghost" onClick={handleAddNew}
              style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>
              <Plus size={14} /> Add New Instead
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
