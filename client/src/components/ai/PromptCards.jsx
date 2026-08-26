import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { SUGGESTED_PROMPTS } from './mockAiResponses';

export default function PromptCards({ onSelectPrompt }) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center my-auto py-8 animate-enter">
      {/* Hero Emblem & Title */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-800 via-primary to-emerald-400 p-[1px] shadow-lg shadow-emerald-900/10 flex items-center justify-center">
            <div className="h-full w-full rounded-[15px] bg-surface flex items-center justify-center">
              <Sparkles size={28} className="text-primary" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white"></span>
          </span>
        </div>

        <h2 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">
          GreenFibre Supply Chain Intelligence
        </h2>
        <p className="text-sm text-ink-muted mt-2 max-w-md">
          Connected to live PostgreSQL ERP, real-time inventory telemetry, vendor SLA history, and multichannel analytics.
        </p>
      </div>

      {/* Suggested Quick-Action Prompt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full px-4">
        {SUGGESTED_PROMPTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group relative p-4 rounded-2xl border bg-surface/80 hover:bg-surface transition-all duration-200 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="text-base">{item.icon}</span>
                <span>{item.category}</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-raised border text-ink-muted group-hover:text-primary group-hover:border-primary/30 transition-colors">
                {item.tag}
              </span>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm text-ink group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-ink-muted line-clamp-2 mt-1 leading-relaxed">
                "{item.prompt}"
              </p>
            </div>

            <div className="flex items-center justify-end text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Ask AI</span>
              <ArrowUpRight size={13} className="ml-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
