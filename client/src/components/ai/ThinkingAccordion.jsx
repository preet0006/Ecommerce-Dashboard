import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

export default function ThinkingAccordion({ thoughts = [], duration = '1.2s', isStreaming = false }) {
  // Open while thinking / streaming, automatically collapse once answer is ready
  const [isOpen, setIsOpen] = useState(isStreaming);

  // Auto-collapse when streaming finishes
  useEffect(() => {
    if (!isStreaming) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!thoughts || thoughts.length === 0) return null;

  return (
    <div className="mb-3 transition-all duration-300">
      {/* Sleek Toggle Button / Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs select-none transition-all duration-200 cursor-pointer ${
          isStreaming
            ? 'bg-primary-soft text-primary-strong border border-primary/30 shadow-2xs font-semibold'
            : 'bg-surface border border-border/80 text-ink-muted hover:text-ink hover:bg-surface-raised/70 shadow-2xs'
        }`}
        title={isOpen ? 'Hide reasoning process' : 'Show reasoning process'}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles
            size={12}
            className={isStreaming ? 'text-primary animate-spin' : 'text-primary/70'}
          />
          <span className="font-mono text-[11px] font-medium">
            {isStreaming ? 'Thinking & querying database…' : `Thought for ${duration || '1.2s'}`}
          </span>
        </div>

        <ChevronDown
          size={12}
          className={`transition-transform duration-200 opacity-70 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable Reasoning Trace */}
      {isOpen && (
        <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-surface/80 border border-border text-xs space-y-1.5 font-mono shadow-2xs animate-enter">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted pb-1 border-b border-border/60">
            Internal Reasoning Steps:
          </div>
          {thoughts.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
              <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-primary opacity-90" />
              <span className="text-ink/90">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
