import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

// Page-level components
import StockOverview from '../components/inventory/StockOverview';
import ReorderRecommendations from '../components/inventory/ReorderRecommendations';
import InTransitTracking from '../components/inventory/InTransitTracking';
import DeadStockReport from '../components/inventory/DeadStockReport';

// Shared helpers & data
import {
  INVENTORY_TABS,
  MOCK_STOCK,
  MOCK_REORDER,
  MOCK_IN_TRANSIT,
  MOCK_DEAD_STOCK,
} from '../components/inventory/utils';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Inventory</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Inventory</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {INVENTORY_TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'stock'   && <StockOverview rows={MOCK_STOCK} />}
      {activeTab === 'reorder' && <ReorderRecommendations rows={MOCK_REORDER} />}
      {activeTab === 'transit' && <InTransitTracking rows={MOCK_IN_TRANSIT} />}
      {activeTab === 'dead'    && <DeadStockReport rows={MOCK_DEAD_STOCK} />}
    </div>
  );
}