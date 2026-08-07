import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Check, Copy, X, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';

export function CommandPaletteModal({ isOpen, onClose, entries = [], onCopyItem }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredEntries = entries.filter(e => 
    e.label.toLowerCase().includes(query.toLowerCase()) ||
    e.value.toLowerCase().includes(query.toLowerCase()) ||
    e.entry_type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.classList.add('modal-open-lock');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.classList.remove('modal-open-lock');
    }
    return () => document.body.classList.remove('modal-open-lock');
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredEntries.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredEntries.length) % (filteredEntries.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEntries[selectedIndex]) {
        onCopyItem(filteredEntries[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur" onClick={onClose}>
      <div 
        className="modal-dialog-box" 
        style={{ maxWidth: '620px', borderRadius: '22px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <Command size={22} color="var(--coral-accent)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="modern-input"
            style={{
              border: 'none',
              background: 'none',
              boxShadow: 'none',
              fontSize: '1.15rem',
              padding: 0
            }}
            placeholder="Type to search and quick-copy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
          {filteredEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              No vault items match "{query}".
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    onCopyItem(entry);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '14px',
                    background: isSelected ? 'var(--coral-light)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--border-strong)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        {entry.label}
                      </span>
                      <span className="entry-type-tag" style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}>
                        {entry.entry_type}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.value}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--coral-text)', fontSize: '0.78rem', fontWeight: 700 }}>
                      <span>Press</span>
                      <CornerDownLeft size={14} />
                      <span>to Copy</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          padding: '0.75rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
          fontSize: '0.78rem',
          color: 'var(--text-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="kbd-badge">↑</span> <span className="kbd-badge">↓</span> navigate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="kbd-badge">↵</span> copy to clipboard
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="kbd-badge">esc</span> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
