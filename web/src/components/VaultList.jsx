import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { EntryRow } from './EntryRow';
import { AddEntryModal } from './AddEntryModal';
import { EmptyState } from './EmptyState';
import { ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export function VaultList({ 
  session, 
  currentSet, 
  availableSets = [], 
  entries = [],
  searchQuery = '',
  onOpenCommandPalette, 
  isModalOpen,
  setIsModalOpen,
  editingEntry,
  setEditingEntry,
  onRefreshEntries 
}) {
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const userId = session?.user?.id || 'local-user';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      setErrorMessage(null);
      let targetSetId = currentSet?.id || (availableSets && availableSets[0]?.id) || 'set-personal';

      if (entryData.id) {
        await supabase.entries.updateEntry({
          id: entryData.id,
          userId,
          label: entryData.label,
          value: entryData.value,
          note: entryData.note,
          entryType: entryData.entry_type,
          isPrivate: entryData.is_private
        });
        showToast('Entry updated successfully');
      } else {
        const nextOrder = entries.length;
        await supabase.entries.createEntry({
          userId,
          setId: targetSetId,
          label: entryData.label,
          value: entryData.value,
          note: entryData.note,
          entryType: entryData.entry_type,
          isPrivate: entryData.is_private,
          sortOrder: nextOrder
        });
        showToast('New entry added to vault');
      }
      if (onRefreshEntries) {
        await onRefreshEntries();
      }
    } catch (err) {
      setErrorMessage('Failed to save entry: ' + err.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await supabase.entries.deleteEntry(entryId, userId);
      showToast('Entry deleted');
      if (onRefreshEntries) {
        await onRefreshEntries();
      }
    } catch (err) {
      setErrorMessage('Failed to delete entry: ' + err.message);
    }
  };

  const handleMoveToAnotherSet = async (entryId, targetSetId) => {
    try {
      await supabase.entries.moveEntryToSet(entryId, userId, targetSetId);
      const targetSet = availableSets.find(s => s.id === targetSetId);
      showToast(`Moved entry to "${targetSet?.name || 'Target'}" profile`);
      if (onRefreshEntries) {
        await onRefreshEntries();
      }
    } catch (err) {
      setErrorMessage('Failed to move entry: ' + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const newEntries = [...entries];
    const [movedItem] = newEntries.splice(index, 1);
    newEntries.splice(targetIndex, 0, movedItem);

    try {
      await supabase.entries.reorderEntries(userId, newEntries);
      if (onRefreshEntries) {
        await onRefreshEntries();
      }
    } catch (err) {
      console.error('Failed to reorder entries', err);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.label && e.label.toLowerCase().includes(q)) ||
      (e.value && e.value.toLowerCase().includes(q)) ||
      (e.entry_type && e.entry_type.toLowerCase().includes(q)) ||
      (e.note && e.note.toLowerCase().includes(q))
    );
  });

  const allArePrivate = entries.length > 0 && entries.every(e => e.is_private);

  return (
    <div style={{ marginTop: '0.5rem' }}>
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

      {/* Helpful Hint if Profile is Public but All Entries are Private */}
      {currentSet?.is_public && allArePrivate && (
        <div style={{
          background: 'rgba(255, 130, 55, 0.12)',
          border: '1px solid rgba(255, 130, 55, 0.3)',
          color: 'var(--text-main)',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
          fontSize: '0.84rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Info size={16} color="#FF5900" style={{ flexShrink: 0 }} />
          <span>
            <strong>Note for Public Share:</strong> All {entries.length} items below are currently marked <code>Private Only</code>. Edit an item and uncheck <strong>Keep Private</strong> to make it visible on your digital share link!
          </span>
        </div>
      )}

      {/* Empty vs Entries List */}
      {entries.length === 0 ? (
        <EmptyState onAddFirstEntry={() => {
          if (setEditingEntry) setEditingEntry(null);
          if (setIsModalOpen) setIsModalOpen(true);
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
                if (setEditingEntry) setEditingEntry(item);
                if (setIsModalOpen) setIsModalOpen(true);
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
      {isModalOpen && (
        <AddEntryModal
          isOpen={isModalOpen}
          onClose={() => {
            if (setIsModalOpen) setIsModalOpen(false);
            if (setEditingEntry) setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
          editingEntry={editingEntry}
        />
      )}

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
