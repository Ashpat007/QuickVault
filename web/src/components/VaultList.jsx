import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { EntryRow } from './EntryRow';
import { AddEntryModal } from './AddEntryModal';
import { EmptyState } from './EmptyState';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export function VaultList({ 
  session, 
  currentSet, 
  availableSets = [], 
  searchQuery = '',
  onOpenCommandPalette, 
  isModalOpen,
  setIsModalOpen,
  editingEntry,
  setEditingEntry,
  onEntriesLoaded 
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const userId = session?.user?.id;

  const loadEntries = async (showLoading = false) => {
    const activeSetId = currentSet?.id || (availableSets && availableSets[0]?.id);
    if (!activeSetId || !userId) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setErrorMessage(null);
    try {
      const data = await supabase.entries.fetchEntries(activeSetId, userId);
      const safeData = data || [];
      setEntries(safeData);
      if (onEntriesLoaded) {
        onEntriesLoaded(safeData);
      }
    } catch (err) {
      setErrorMessage('Failed to load vault entries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(false);
  }, [currentSet?.id, userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      setErrorMessage(null);
      let targetSetId = currentSet?.id || (availableSets && availableSets[0]?.id);
      
      if (!targetSetId && userId) {
        let defSet = await supabase.sets.createDefaultSet(userId);
        if (!defSet) {
          defSet = await supabase.sets.createSet(userId, 'Personal');
        }
        targetSetId = defSet?.id;
      }

      if (!targetSetId) {
        targetSetId = `set-${Date.now()}`;
      }

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
    const [movedItem] = newEntries.splice(index, 1);
    newEntries.splice(targetIndex, 0, movedItem);

    setEntries(newEntries);
    if (onEntriesLoaded) onEntriesLoaded(newEntries);
    try {
      await supabase.entries.reorderEntries(userId, newEntries);
    } catch (err) {
      console.error('Failed to reorder entries', err);
      loadEntries(false);
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

      {/* Loading vs Empty vs Entries list */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          Loading your vault...
        </div>
      ) : entries.length === 0 ? (
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
