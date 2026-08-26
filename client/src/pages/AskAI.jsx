import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeftClose, PanelLeft, Trash2, Download, CheckCircle2,
  Database, Sparkles, ArrowLeft, Sun, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

// Components
import ChatSidebar from '../components/ai/ChatSidebar';
import ChatMessage from '../components/ai/ChatMessage';
import ChatComposer from '../components/ai/ChatComposer';
import PromptCards from '../components/ai/PromptCards';

// Fallback logic
import { generateAiResponse } from '../components/ai/mockAiResponses';

const STORAGE_KEY = 'greenfibre_ai_real_conversations_v4';

export default function AskAI() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Clean state: start with empty list or load from localStorage / DB
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [activeConvId, setActiveConvId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed[0]?.id ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  // Default sidebar state: false on mobile (<768px), true on desktop
  const [sidebarOpen, setSidebarOpen]   = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  const [isStreaming, setIsStreaming]   = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const messagesEndRef                  = useRef(null);

  // Sync sessions from PostgreSQL on mount
  useEffect(() => {
    api.getAiSessions()
      .then((dbSessions) => {
        if (Array.isArray(dbSessions) && dbSessions.length > 0) {
          setConversations((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const map = new Map(safePrev.map((c) => [c.id, c]));
            dbSessions.forEach((ds) => {
              if (ds && ds.sessionId && !map.has(ds.sessionId)) {
                map.set(ds.sessionId, {
                  id: ds.sessionId,
                  title: ds.title || 'Inquiry',
                  date: 'Today',
                  pinned: ds.pinned === 'true',
                  messages: [],
                });
              }
            });
            const list = Array.from(map.values());
            if (!activeConvId && list.length > 0) {
              setActiveConvId(list[0].id);
            }
            return list;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Persist conversations safely in localStorage
  useEffect(() => {
    try {
      if (Array.isArray(conversations)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      }
    } catch {}
  }, [conversations]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isStreaming]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const activeConv = safeConversations.find((c) => c?.id === activeConvId) || {
    id: activeConvId || 'new',
    title: 'New Inquiry',
    messages: [],
  };
  const activeMessages = Array.isArray(activeConv?.messages) ? activeConv.messages : [];

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Start a new chat session
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Inquiry',
      date: 'Today',
      messages: [],
    };
    setConversations((prev) => [newSession, ...(Array.isArray(prev) ? prev : [])]);
    setActiveConvId(newId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectConv = (id) => {
    setActiveConvId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // Delete conversation & question history from DB
  const handleDeleteConversation = async (id) => {
    setConversations((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const remaining = safePrev.filter((c) => c?.id !== id);
      if (activeConvId === id) {
        setActiveConvId(remaining[0]?.id || null);
      }
      return remaining;
    });

    try {
      await api.deleteAiSession(id);
    } catch (_) {}

    showToast('Conversation deleted.');
  };

  // Pin/unpin conversation
  const handleTogglePin = (id) => {
    setConversations((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((c) => (c?.id === id ? { ...c, pinned: !c.pinned } : c));
    });
  };

  // Clear current active chat
  const handleClearCurrentChat = () => {
    if (!activeConvId) return;
    setConversations((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((c) => (c?.id === activeConvId ? { ...c, messages: [] } : c));
    });
    showToast('Chat messages cleared.');
  };

  // Export chat transcript to markdown
  const handleExportChat = () => {
    if (!activeMessages || activeMessages.length === 0) return;
    const text = activeMessages
      .map((m) => `### ${m?.sender === 'user' ? 'User' : 'GreenFibre Intelligence'} (${m?.timestamp || ''})\n\n${m?.content || ''}\n`)
      .join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeConv.title || 'chat').toLowerCase().replace(/[^a-z0-9]/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported as Markdown file.');
  };

  // Send message and save user question & file to PostgreSQL
  const handleSendMessage = async (userPrompt, options = {}) => {
    const promptText = userPrompt || (options?.attachment ? `Please analyze the uploaded file: ${options.attachment.name}` : '');
    if (!promptText || !promptText.trim() || isStreaming) return;

    let currentSessionId = activeConvId;
    if (!currentSessionId || currentSessionId === 'new') {
      currentSessionId = `conv-${Date.now()}`;
      setActiveConvId(currentSessionId);
    }

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      content: promptText,
      attachment: options?.attachment || null,
    };

    const isFirstMessage = activeMessages.length === 0;
    const computedTitle = isFirstMessage
      ? promptText.slice(0, 38) + (promptText.length > 38 ? '…' : '')
      : activeConv.title || 'Supply Chain Inquiry';

    const tempAiMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      modelName: 'GreenFibre Intelligence Enterprise',
      thinkingDuration: 'Thinking…',
      thoughts: [
        'Connecting to PostgreSQL database...',
        'Logging user inquiry to question history memory...',
        'Synthesizing supply chain parameters with live ERP data...',
      ],
      content: '',
      isStreaming: true,
    };

    // Optimistically update UI
    setConversations((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some((c) => c?.id === currentSessionId);
      if (!exists) {
        return [
          {
            id: currentSessionId,
            title: computedTitle,
            date: 'Today',
            messages: [userMessage, tempAiMessage],
          },
          ...safePrev,
        ];
      }
      return safePrev.map((c) => {
        if (c?.id === currentSessionId) {
          return {
            ...c,
            title: computedTitle,
            messages: [...(Array.isArray(c.messages) ? c.messages : []), userMessage, tempAiMessage],
          };
        }
        return c;
      });
    });

    setIsStreaming(true);

    try {
      const res = await api.sendAiQuery({
        sessionId: currentSessionId,
        title: computedTitle,
        queryText: promptText,
        file: options?.attachment
          ? {
              name: options.attachment.name,
              size: options.attachment.size,
              type: options.attachment.type,
              contentSummary: options.attachment.contentSummary,
            }
          : null,
      });

      const aiResponse = res?.aiResponse || generateAiResponse(promptText);

      setConversations((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map((c) => {
          if (c?.id === currentSessionId) {
            const currentMsgs = Array.isArray(c.messages) ? c.messages : [];
            const updated = currentMsgs.map((m) => {
              if (m?.id === tempAiMessage.id) {
                return {
                  ...m,
                  thinkingDuration: aiResponse?.thinkingDuration || '1.6s',
                  thoughts: Array.isArray(aiResponse?.thoughts) ? aiResponse.thoughts : [],
                  content: aiResponse?.content || 'Analysis complete.',
                  actionChips: Array.isArray(aiResponse?.actionChips) ? aiResponse.actionChips : [],
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...c, messages: updated };
          }
          return c;
        });
      });
    } catch (err) {
      console.warn('[AskAI] API note:', err.message);

      const fallback = generateAiResponse(promptText);
      setConversations((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map((c) => {
          if (c?.id === currentSessionId) {
            const currentMsgs = Array.isArray(c.messages) ? c.messages : [];
            const updated = currentMsgs.map((m) => {
              if (m?.id === tempAiMessage.id) {
                return {
                  ...m,
                  thinkingDuration: fallback?.thinkingDuration || '1.5s',
                  thoughts: fallback?.thoughts || [],
                  content: fallback?.content || 'Analysis complete.',
                  actionChips: fallback?.actionChips || [],
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...c, messages: updated };
          }
          return c;
        });
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Quick Action Chips handler
  const handleActionChipClick = (chipText) => {
    if (!chipText) return;
    if (chipText.includes('Purchase Order') || chipText.includes('PO')) {
      showToast('Opening Purchase Orders workspace...');
      setTimeout(() => navigate('/purchase'), 600);
      return;
    }
    if (chipText.includes('Inventory') || chipText.includes('Stock')) {
      showToast('Opening Inventory Management...');
      setTimeout(() => navigate('/inventory'), 600);
      return;
    }
    if (chipText.includes('Pricing') || chipText.includes('Discount')) {
      showToast('Opening Pricing & Discounts...');
      setTimeout(() => navigate('/pricing'), 600);
      return;
    }

    handleSendMessage(chipText);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg relative">
      {/* ── Left Responsive Chat Sidebar (Drawer on mobile, split-panel on desktop) ── */}
      {sidebarOpen && (
        <div className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex">
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/50 md:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full">
            <ChatSidebar
              conversations={safeConversations}
              activeConversationId={activeConvId}
              onSelectConversation={handleSelectConv}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              onTogglePin={handleTogglePin}
            />
          </div>
        </div>
      )}

      {/* ── Main Chat Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border bg-surface px-3 sm:px-4 flex items-center justify-between shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back to Dashboard button on mobile */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
              title={sidebarOpen ? 'Collapse history' : 'Open history'}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>

            {/* Single Official Enterprise Model Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-xl border border-primary/25 bg-primary-soft/40 shadow-2xs select-none min-w-0">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles size={12} />
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-[11px] sm:text-xs font-display font-bold text-ink leading-tight flex items-center gap-1">
                  <span className="truncate">GreenFibre Intelligence</span>
                  <span className="text-[8px] sm:text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-600 text-white uppercase shrink-0">
                    v2.4
                  </span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-ink-muted hidden sm:flex items-center gap-1 truncate">
                  <Database size={9} className="text-primary" /> Neon DB Grounded
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {toastMessage && (
              <span className="text-xs text-primary font-medium bg-primary-soft px-2.5 py-1 rounded-lg animate-enter hidden sm:flex items-center gap-1.5 border border-primary/20">
                <CheckCircle2 size={13} /> {toastMessage}
              </span>
            )}

            {/* Dark Mode Toggle in AI Top Header */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleExportChat}
              disabled={activeMessages.length === 0}
              className="btn-ghost !p-2 text-ink-muted hover:text-ink disabled:opacity-40"
              title="Export Conversation to Markdown"
            >
              <Download size={15} />
            </button>

            <button
              type="button"
              onClick={handleClearCurrentChat}
              disabled={activeMessages.length === 0}
              className="btn-ghost !p-2 text-ink-muted hover:text-red disabled:opacity-40"
              title="Clear Current Chat"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </header>

        {/* Chat Messages / Hero Canvas */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {activeMessages.length === 0 ? (
            <PromptCards onSelectPrompt={handleSendMessage} />
          ) : (
            <div className="py-4 flex flex-col gap-1">
              {activeMessages.map((msg, index) => (
                <ChatMessage
                  key={msg?.id || index}
                  message={msg || {}}
                  isLatest={index === activeMessages.length - 1}
                  onActionChipClick={handleActionChipClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Floating Glassmorphism Composer */}
        <ChatComposer
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={() => setIsStreaming(false)}
        />
      </div>
    </div>
  );
}
