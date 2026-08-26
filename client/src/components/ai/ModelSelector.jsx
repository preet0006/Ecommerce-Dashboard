import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Cpu, Sparkles } from 'lucide-react';
import { AI_MODELS } from './mockAiResponses';

export default function ModelSelector({ selectedModelId, onSelectModel }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold shadow-xs select-none hover:border-primary"
        style={{
          background: 'var(--color-surface)',
          borderColor: open ? 'var(--color-primary)' : 'var(--color-border)',
        }}
      >
        <span className="text-sm">{currentModel.icon}</span>
        <div className="flex flex-col text-left">
          <span className="text-ink font-display font-semibold flex items-center gap-1.5">
            {currentModel.name}
            {currentModel.tag && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary uppercase">
                {currentModel.tag}
              </span>
            )}
          </span>
        </div>
        <ChevronDown size={14} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl p-2 z-50 animate-enter bg-surface"
          style={{
            borderColor: 'var(--color-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted border-b border-border mb-1 flex items-center justify-between">
            <span>Select Specialized Agent Model</span>
            <span className="text-primary font-mono">v2.4 Active</span>
          </div>

          <div className="flex flex-col gap-1">
            {AI_MODELS.map((model) => {
              const isSelected = model.id === currentModel.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-all ${
                    isSelected ? 'bg-primary-soft/60 border border-primary/30' : 'hover:bg-surface-raised border border-transparent'
                  }`}
                >
                  <span className="text-lg mt-0.5">{model.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-xs text-ink">{model.name}</span>
                      {isSelected && <Check size={14} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-2">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-ink-muted">
                      <span className="badge !text-[9px] !py-0 !px-1.5">{model.badge}</span>
                      <span>·</span>
                      <span>{model.speed}</span>
                      <span>·</span>
                      <span>{model.contextWindow} context</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
