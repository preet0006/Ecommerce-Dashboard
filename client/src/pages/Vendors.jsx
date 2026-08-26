import React, { useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

// Page-level components
import VendorList from '../components/vendors/VendorList';
import VendorForm from '../components/vendors/VendorForm';
import QuotationHistory from '../components/vendors/QuotationHistory';
import PerformanceScorecard from '../components/vendors/PerformanceScorecard';

// Shared helpers & data
import { MOCK_QUOTES, VENDOR_TABS } from '../components/vendors/utils';

export default function VendorMaster() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const goEdit = (vendor) => {
    setSelectedVendor(vendor);
    setActiveTab('edit');
  };

  const goAdd = () => {
    setSelectedVendor(null);
    setActiveTab('edit');
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
    setSelectedVendor(null);
    setActiveTab('list');
    showToast('Vendor master database updated successfully.');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-surface border border-primary/30 shadow-2xl text-primary font-semibold text-xs flex items-center gap-2 animate-enter">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={13} /> <span className="text-ink font-medium">Vendor Master</span>
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">Vendor Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto pb-0.5">
        {VENDOR_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'edit') setSelectedVendor(null);
              }}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none font-bold' : 'sidebar-link !rounded-b-none'
              }`}
              style={
                active
                  ? { borderBottom: '2px solid var(--color-primary)' }
                  : { borderBottom: '2px solid transparent' }
              }
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list' && (
        <VendorList
          key={refreshKey}
          onSelect={goEdit}
          onAdd={goAdd}
          onDeleted={() => {
            setRefreshKey((k) => k + 1);
            showToast('Vendor deleted.');
          }}
        />
      )}
      {activeTab === 'edit' && (
        <VendorForm
          vendor={selectedVendor}
          onSaved={handleSaved}
          onCancel={() => {
            setActiveTab('list');
            setSelectedVendor(null);
          }}
        />
      )}
      {activeTab === 'history' && <QuotationHistory quotes={MOCK_QUOTES} />}
      {activeTab === 'scorecard' && <PerformanceScorecard />}
    </div>
  );
}