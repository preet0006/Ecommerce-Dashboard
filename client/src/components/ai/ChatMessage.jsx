import React, { useState } from 'react';
import {
  Sparkles, User, Copy, Check, ThumbsUp, ThumbsDown,
  Volume2, VolumeX, ArrowRight, FileText, CornerDownRight
} from 'lucide-react';
import ThinkingAccordion from './ThinkingAccordion';

export default function ChatMessage({ message, isLatest, onActionChipClick }) {
  const [copied, setCopied]       = useState(false);
  const [liked, setLiked]         = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakToggle = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = message.content.replace(/[#*`_>-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const renderFormattedContent = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;

    const flushTable = (key) => {
      if (tableRows.length === 0) return;
      const headers = tableRows[0];
      const dataRows = tableRows.slice(2);

      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
          <table className="table-clean text-xs">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="font-semibold text-ink uppercase tracking-wider text-[10px]">
                    {h.replace(/[*_`]/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="font-mono text-xs">
                      {cell.replace(/[*_`]/g, '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cols = trimmed.slice(1, -1).split('|').map(c => c.trim());
        tableRows.push(cols);
        return;
      } else if (inTable) {
        flushTable(index);
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="font-display font-bold text-base text-ink mt-3 mb-1 flex items-center gap-1.5">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="font-display font-semibold text-sm text-ink mt-2.5 mb-1 text-primary">
            {trimmed.replace('#### ', '')}
          </h4>
        );
        return;
      }

      if (trimmed === '---') {
        elements.push(<hr key={index} className="my-3 border-border" />);
        return;
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={index} className="border-l-3 border-primary/60 pl-3 my-1 text-xs text-ink bg-primary-soft/20 py-1.5 pr-2 rounded-r-lg font-sans">
            {trimmed.replace('> ', '')}
          </div>
        );
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-•]\s*/, '');
        elements.push(
          <div key={index} className="flex items-start gap-2 text-xs text-ink my-1 pl-1 leading-relaxed">
            <span className="text-primary font-bold mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
          </div>
        );
        return;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <div key={index} className="flex items-start gap-2 text-xs text-ink my-1 pl-1 leading-relaxed">
            <span className="font-mono text-primary font-bold text-[11px] mt-0.5">
              {trimmed.match(/^\d+\./)[0]}
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^\d+\.\s*/, '')) }} />
          </div>
        );
        return;
      }

      if (trimmed) {
        elements.push(
          <p key={index} className="text-xs text-ink my-1.5 leading-relaxed"
             dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        );
      }
    });

    if (inTable) {
      flushTable('end');
    }

    return elements;
  };

  const formatInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-surface-raised px-1.5 py-0.5 rounded font-mono text-[11px] border text-primary font-semibold">$1</code>');
  };

  return (
    <div className={`w-full py-4 px-4 md:px-8 transition-colors ${
      isUser ? 'bg-transparent' : 'bg-surface/50 border-y border-border/40'
    }`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <div className="h-8 w-8 rounded-full bg-ink text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              <User size={15} />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-800 to-primary text-white flex items-center justify-center shadow-md shadow-emerald-950/10">
              <Sparkles size={15} />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-xs text-ink">
                {isUser ? 'You (Procurement Lead)' : 'GreenFibre Intelligence Enterprise'}
              </span>
              <span className="text-[10px] text-ink-muted">{message.timestamp}</span>
            </div>

            {!isUser && (
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? <VolumeX size={13} className="text-primary" /> : <Volume2 size={13} />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>

          {/* Attached File Pill (if any) */}
          {message.attachment && (
            <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono shadow-2xs">
              <FileText size={14} className="text-primary" />
              <span className="font-bold text-ink">{message.attachment.name}</span>
              <span className="text-[10px] text-ink-muted">({message.attachment.size})</span>
            </div>
          )}

          {/* AI Chain of Thought / Reasoning Accordion */}
          {!isUser && message.thoughts && (
            <ThinkingAccordion
              thoughts={message.thoughts}
              duration={message.thinkingDuration}
              isStreaming={message.isStreaming}
            />
          )}

          {/* Formatted Text Content */}
          <div className="text-xs text-ink leading-relaxed">
            {renderFormattedContent(message.content)}
          </div>

          {/* Action Chips for AI Suggestions */}
          {!isUser && message.actionChips && message.actionChips.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1 mr-1">
                <CornerDownRight size={11} className="text-primary" /> Quick Actions:
              </span>
              {message.actionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onActionChipClick && onActionChipClick(chip)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-soft text-primary-strong hover:bg-primary hover:text-white transition-all duration-150 flex items-center gap-1 border border-primary/20 hover:shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{chip}</span>
                  <ArrowRight size={11} />
                </button>
              ))}
            </div>
          )}

          {/* Bottom Feedback Bar */}
          {!isUser && !message.isStreaming && (
            <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-muted">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`p-1 rounded-md transition-colors ${
                    liked === true ? 'text-primary bg-primary-soft' : 'hover:bg-surface-raised'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`p-1 rounded-md transition-colors ${
                    liked === false ? 'text-red bg-red-50' : 'hover:bg-surface-raised'
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>

              <span>·</span>
              <span className="text-[10px] text-ink-muted">Grounded with Neon DB & User Question Memory</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
