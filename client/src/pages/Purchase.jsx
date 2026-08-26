import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

// Page-level components
import CreatePO from '../components/purchase/CreatePO';
import POList from '../components/purchase/POList';
import ApprovalQueue from '../components/purchase/ApprovalQueue';
import NegotiationAssistant from '../components/purchase/NegotiationAssistant';

// Shared helpers & data
import {
  FALLBACK_POS,
  FALLBACK_APPROVAL_QUEUE,
  PURCHASE_TABS,
} from '../components/purchase/utils';

// Re-export helper used by DeliveryArrivalModal (external reference kept)
export { calculateDeliveryDays } from '../components/purchase/utils';

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT (WITH DATABASE FETCH & CRON RUNNER)
══════════════════════════════════════════════════════════════ */
export default function PurchaseOrders() {
  const [activeTab, setActiveTab]         = useState('create');
  const [pos, setPos]                     = useState(FALLBACK_POS);
  const [approvalQueue, setApprovalQueue] = useState(FALLBACK_APPROVAL_QUEUE);
  const [cronLoading, setCronLoading]     = useState(false);
  const [cronResult, setCronResult]       = useState(null);

  // Load live POs and Approval Queue from DB
  const loadData = () => {
    api.getPurchaseOrders()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPos(data);
        }
      })
      .catch(() => {});

    api.getApprovalQueue()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApprovalQueue(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // When email is sent to vendor(s), add them to approval queue & pos
  const handleOrdersCreated = (newOrders) => {
    setApprovalQueue((prev) => [...newOrders, ...prev]);
    setPos((prev) => [...newOrders, ...prev]);
  };

  // When user approves an order in Approval Queue pop-up
  const handleApproveOrder = (approvedPo) => {
    setApprovalQueue((prev) => prev.filter((p) => p.id !== approvedPo.id));
    setPos((prev) => {
      const exists = prev.some((p) => p.id === approvedPo.id);
      if (exists) {
        return prev.map((p) => p.id === approvedPo.id ? approvedPo : p);
      }
      return [approvedPo, ...prev];
    });
  };

  // When user rejects an order in Approval Queue
  const handleRejectOrder = (poId, reason, rejectedPo) => {
    setApprovalQueue((prev) => prev.filter((p) => p.id !== poId));
    setPos((prev) =>
      prev.map((p) =>
        p.id === poId
          ? { ...(rejectedPo || p), status: 'rejected', rejectionReason: reason }
          : p
      )
    );
  };

  // Trigger dynamic daily cron check manually from UI
  const handleTriggerCron = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const res = await api.runFollowUpCron();
      setCronResult(res);
      loadData();
    } catch (err) {
      setCronResult({ message: `Cron Error: ${err.message}` });
    } finally {
      setCronLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Purchase Orders</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Purchase Orders & Approvals</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {PURCHASE_TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          const isQueueTab = tab.id === 'approval';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active
                ? { borderBottom: '2px solid var(--color-primary)' }
                : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
              {isQueueTab && approvalQueue.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-xs">
                  {approvalQueue.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'create' && (
        <CreatePO onOrdersCreated={handleOrdersCreated} />
      )}
      {activeTab === 'list' && (
        <POList
          pos={pos}
          onTriggerCron={handleTriggerCron}
          cronLoading={cronLoading}
          cronResult={cronResult}
        />
      )}
      {activeTab === 'approval' && (
        <ApprovalQueue
          queue={approvalQueue}
          onApproveOrder={handleApproveOrder}
          onRejectOrder={handleRejectOrder}
          onGoToPOList={() => setActiveTab('list')}
        />
      )}
      {activeTab === 'negotiation' && (
        <NegotiationAssistant pos={pos} />
      )}
    </div>
  );
}