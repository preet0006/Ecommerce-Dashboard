import React, { useState } from 'react';
import {
  Plus, MessageSquare, Search, Trash2, Pin, PinOff,
  Sparkles, X
} from 'lucide-react';

export default function ChatSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePin,
}) {
  const [search, setSearch]       = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const safeList = Array.isArray(conversations) ? conversations : [];

  const filtered = safeList.filter((c) =>
    (c?.title || 'New Inquiry').toLowerCase().includes((search || '').toLowerCase())
  );

  // Safe Grouping by Date categories
  const grouped = {
    Pinned: filtered.filter((c) => Boolean(c?.pinned)),
    Today: filtered.filter((c) => !c?.pinned && (c?.date === 'Today' || !c?.date)),
    Yesterday: filtered.filter((c) => !c?.pinned && c?.date === 'Yesterday'),
    'Previous 7 Days': filtered.filter((c) => !c?.pinned && c?.date === 'Previous 7 Days'),
    Older: filtered.filter((c) => !c?.pinned && c?.date && c?.date !== 'Today' && c?.date !== 'Yesterday' && c?.date !== 'Previous 7 Days'),
  };

  const hasAnyItems = filtered.length > 0;

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-surface flex flex-col h-full select-none sticky top-0 overflow-hidden">
      {/* Top Header & New Chat Button */}
      <div className="p-3.5 border-b border-border/80 flex flex-col gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-strong shadow-sm shadow-emerald-950/15 transition-all duration-150 active:scale-98 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus size={15} strokeWidth={2.5} />
            <span>New Intelligence Chat</span>
          </span>
          <span className="text-[10px] font-mono opacity-80 bg-white/15 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </button>

        {/* Search input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface-raised focus:bg-surface focus:border-primary outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-4">
        {hasAnyItems ? (
          Object.entries(grouped).map(([groupTitle, items]) => {
            if (!items || items.length === 0) return null;

            return (
              <div key={groupTitle} className="flex flex-col gap-1">
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {groupTitle}
                </span>

                {items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isHovered = hoveredId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                        isActive
                          ? 'bg-primary-soft text-primary-strong font-semibold shadow-2xs'
                          : 'text-ink hover:bg-surface-raised'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare
                          size={14}
                          className={`shrink-0 ${isActive ? 'text-primary' : 'text-ink-muted'}`}
                        />
                        <span className="truncate text-xs">{conv.title || 'New Inquiry'}</span>
                      </div>

                      {/* Action buttons on hover */}
                      {(isHovered || conv.pinned) && (
                        <div className="flex items-center gap-1 shrink-0 ml-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onTogglePin && onTogglePin(conv.id)}
                            className={`p-1 rounded hover:bg-surface text-ink-muted hover:text-primary transition-colors ${
                              conv.pinned ? 'text-primary' : ''
                            }`}
                            title={conv.pinned ? 'Unpin' : 'Pin to top'}
                          >
                            {conv.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteConversation && onDeleteConversation(conv.id)}
                            className="p-1 rounded hover:bg-surface text-ink-muted hover:text-red transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 px-4 text-xs text-ink-muted flex flex-col items-center gap-2">
            <Sparkles size={20} className="text-primary/40" />
            <p>{search ? `No chats found matching "${search}".` : 'No past conversations. Click "New Intelligence Chat" or type below to start.'}</p>
          </div>
        )}
      </div>

      {/* Footer / Context indicator */}
      <div className="p-3 border-t border-border bg-surface-raised/40 text-[11px] text-ink-muted flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-ink">Postgres ERP Grounded</span>
        </div>
        <span className="font-mono text-[10px] text-primary font-bold">128k ctx</span>
      </div>
    </aside>
  );
}
