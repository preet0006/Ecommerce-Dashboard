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
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={13} /> <span className="text-ink font-medium">Inventory</span>
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">Inventory Management</h1>

      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto pb-0.5">
        {INVENTORY_TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'
              }`}
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