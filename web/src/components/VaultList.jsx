import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { EntryRow } from './EntryRow';
import { AddEntryModal } from './AddEntryModal';
import { EmptyState } from './EmptyState';
import { Plus, Search, CheckCircle2, ShieldAlert, X, Sparkles, Command } from 'lucide-react';

export function VaultList({ session, currentSet, availableSets = [], onOpenCommandPalette, onMoveEntryToSet }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const userId = session?.user?.id;

  const loadEntries = async (showLoading = false) => {
    if (!currentSet?.id || !userId) return;
    if (showLoading) setLoading(true);
    setErrorMessage(null);
    try {
      const data = await supabase.entries.fetchEntries(currentSet.id, userId);
      setEntries(data || []);
    } catch (err) {
      setErrorMessage('Failed to load vault entries: ' + err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const isFirstTime = entries.length === 0;
    loadEntries(isFirstTime);
  }, [currentSet?.id, userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      if (entryData.id) {
        await supabase.entries.updateEntry(entryData.id, userId, {
          label: entryData.label,
          value: entryData.value,
          note: entryData.note,
          entry_type: entryData.entry_type,
          is_private: entryData.is_private
        });
        showToast('Entry updated successfully');
      } else {
        const nextOrder = entries.length;
        await supabase.entries.createEntry({
          userId,
          setId: currentSet.id,
          label: entryData.label,
          value: entryData.value,
          note: entryData.note,
          entryType: entryData.entry_type,
          isPrivate: entryData.is_private,
          sortOrder: nextOrder
        });
        showToast('New entry added');
      }
      await loadEntries(false);
    } catch (err) {
      setErrorMessage('Failed to save entry: ' + err.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await supabase.entries.deleteEntry(entryId, userId);
      showToast('Entry deleted');
      await loadEntries(false);
    } catch (err) {
      setErrorMessage('Failed to delete entry: ' + err.message);
    }
  };

  const handleMoveToAnotherSet = async (entryId, targetSetId) => {
    try {
      await supabase.entries.moveEntryToSet(entryId, userId, targetSetId);
      const targetSet = availableSets.find(s => s.id === targetSetId);
      showToast(`Moved entry to "${targetSet?.name || 'Target'}" profile`);
      await loadEntries(false);
    } catch (err) {
      setErrorMessage('Failed to move entry: ' + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const newEntries = [...entries];
    const [moved] = newEntries.splice(index, 1);
    newEntries.splice(targetIndex, 0, moved);

    setEntries(newEntries);
    try {
      await supabase.entries.updateSortOrders(userId, newEntries);
    } catch (err) {
      console.error('Failed to save reordered items', err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.entry_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Top Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '0.85rem',
        marginBottom: '1.4rem',
        flexWrap: 'wrap'
      }}>
        {/* Search Bar with Ctrl+K Button */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} 
          />
          <input
            type="text"
            className="modern-input"
            style={{ paddingLeft: '2.75rem', paddingRight: '5.5rem' }}
            placeholder="Search entries or press Ctrl + K..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <button
            type="button"
            onClick={onOpenCommandPalette}
            style={{
              position: 'absolute',
              right: searchQuery ? '32px' : '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--coral-light)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--coral-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
            title="Open Command Palette (Ctrl + K)"
          >
            <Command size={12} />
            <span>K</span>
          </button>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Item Counter Badge */}
        {entries.length > 0 && (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '0.65rem 1rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <Sparkles size={15} color="var(--coral-accent)" />
            <span>
              {searchQuery ? `${filteredEntries.length} of ${entries.length}` : `${entries.length} Items`}
            </span>
          </div>
        )}

        {/* Hero Add Entry Button */}
        <button
          type="button"
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="btn-primary-action"
        >
          <Plus size={18} />
          <span>Add Entry</span>
        </button>
      </div>

      {errorMessage && (
        <div style={{
          background: '#FFEBEB',
          color: '#D63031',
          padding: '0.9rem 1.1rem',
          borderRadius: '16px',
          fontSize: '0.88rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldAlert size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          Loading your vault...
        </div>
      ) : entries.length === 0 ? (
        <EmptyState onAddFirstEntry={() => {
          setEditingEntry(null);
          setIsModalOpen(true);
        }} />
      ) : filteredEntries.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          No entries matched your search "{searchQuery}".
        </div>
      ) : (
        <div>
          {filteredEntries.map((entry, idx) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={idx}
              availableSets={availableSets}
              currentSetId={currentSet?.id}
              onMoveToSet={handleMoveToAnotherSet}
              onCopy={(item) => showToast(`Copied "${item.label}" to clipboard!`)}
              onEdit={(item) => {
                setEditingEntry(item);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteEntry}
              onMoveUp={() => handleMove(idx, -1)}
              onMoveDown={() => handleMove(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === filteredEntries.length - 1}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Entry Modal */}
      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-floating-container">
          <div className="toast-pill-box">
            <CheckCircle2 size={18} color="var(--coral-accent)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
