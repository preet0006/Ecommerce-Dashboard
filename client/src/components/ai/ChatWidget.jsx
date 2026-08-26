import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw,
  ChevronDown, Minimize2, Maximize2, Database, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

const STARTER_PROMPTS = [
  'What vendors are in our PostgreSQL database?',
  'Show recent purchase orders and approval status',
  'What are the recent channel sales on Amazon/Flipkart?',
  'Which supplier has the highest on-time SLA rate?',
];

export default function ChatWidget() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen]           = useState(false);
  const [isExpanded, setIsExpanded]   = useState(false);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const messagesEndRef                = useRef(null);
  const inputRef                      = useRef(null);

  // Session conversation history
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('greenfibre_widget_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome-1',
        sender: 'ai',
        content: '👋 Hello! I am the **GreenFibre Groq AI Assistant**.\n\nI have real-time access to your **PostgreSQL database** (Products, Vendors, Purchase Orders, Channel Sales). How can I assist your operations today?',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        model: 'Groq + PostgreSQL',
      },
    ];
  });

  // Save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('greenfibre_widget_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    setError(null);
    setInput('');

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Call POST /api/ai/chat
      const res = await api.sendAiChat({
        message: messageText,
        history: messages.map((m) => ({ sender: m.sender, content: m.content })),
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: res.answer || 'No response generated.',
        model: res.model || 'Groq AI',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.warn('[ChatWidget] Error:', err.message);
      setError(err.message || 'Failed to connect to AI server. Please try again.');
      
      const fallbackAiMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        content: '⚠️ I encountered an error retrieving data from the server. Please ensure the backend is running.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    const welcome = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      content: 'Chat session reset. Ask me anything about your products, vendors, purchase orders, or sales channels.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      model: 'Groq + PostgreSQL',
    };
    setMessages([welcome]);
    setError(null);
  };

  return (
    <>
      {/* ── Floating Trigger Button (Bottom-Right) ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-primary text-white shadow-xl hover:bg-primary-strong transition-all duration-200 hover:scale-105 active:scale-95 group select-none"
          style={{
            boxShadow: '0 8px 24px rgba(31, 110, 76, 0.35)',
          }}
          aria-label="Open Groq AI Chat Assistant"
        >
          <div className="relative">
            <Sparkles size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            Ask Groq AI
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
            PostgreSQL Grounded
          </span>
        </button>
      )}

      {/* ── Floating Chat Popover Window ── */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-enter ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-10 max-w-4xl max-h-[90vh] mx-auto'
              : 'bottom-20 lg:bottom-6 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[560px] max-h-[82vh]'
          }`}
          style={{
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--color-border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/70 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
                <Bot size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xs sm:text-sm text-ink truncate">
                    GreenFibre AI Assistant
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white uppercase shrink-0">
                    Groq
                  </span>
                </div>
                <span className="text-[10px] text-ink-muted flex items-center gap-1">
                  <Database size={9} className="text-primary" /> Live PostgreSQL Grounded
                </span>
              </div>
            </div>

            {/* Header Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/ai"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-ink-muted hover:text-primary hover:bg-surface transition-colors text-[10px] font-medium flex items-center gap-0.5 px-1.5"
                title="Open Fullscreen Ask AI Workspace"
              >
                <span>Full Page</span>
                <ArrowUpRight size={12} />
              </Link>

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                title="Reset Chat Session"
              >
                <RefreshCw size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors hidden sm:block"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-ink-muted hover:text-red hover:bg-surface transition-colors"
                title="Close chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 flex flex-col gap-3.5 text-xs bg-bg/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-enter`}
                >
                  {!isUser && (
                    <div className="h-6 w-6 rounded-md bg-primary-soft text-primary-strong flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <Sparkles size={12} />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-primary text-white rounded-br-xs shadow-xs font-normal'
                          : 'bg-surface border border-border text-ink rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words font-sans">
                        {msg.content}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-ink-muted">
                      <span>{msg.timestamp}</span>
                      {msg.model && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{msg.model}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-semibold text-[10px]">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {loading && (
              <div className="flex gap-2.5 justify-start animate-enter">
                <div className="h-6 w-6 rounded-md bg-primary-soft text-primary-strong flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                  <Bot size={12} />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-surface border border-border text-ink shadow-2xs flex items-center gap-2">
                  <span className="text-xs text-ink-muted">Groq is querying PostgreSQL…</span>
                  <span className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {/* Error notice banner */}
            {error && (
              <div className="p-2.5 rounded-xl border border-red-300 bg-red-500/10 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick starter chips */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-surface-raised/40 border-t border-border flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] uppercase font-bold text-ink-muted shrink-0 mr-1">
                Suggested:
              </span>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-surface border border-border text-ink-muted hover:text-primary hover:border-primary/40 whitespace-nowrap transition-colors shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Composer */}
          <div className="p-3 border-t border-border bg-surface shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about vendors, POs, items, stock…"
                disabled={loading}
                className="input text-xs py-2 px-3 flex-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary !p-2 shrink-0 rounded-lg disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
