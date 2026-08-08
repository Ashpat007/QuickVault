import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderHeart, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Briefcase, 
  GraduationCap, 
  Folder 
} from 'lucide-react';

function getSetIcon(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('work') || lower.includes('job') || lower.includes('career')) return <Briefcase size={15} />;
  if (lower.includes('college') || lower.includes('school') || lower.includes('study')) return <GraduationCap size={15} />;
  if (lower.includes('personal') || lower.includes('home')) return <FolderHeart size={15} />;
  return <Folder size={15} />;
}

export function SetSwitcher({
  sets = [],
  currentSet,
  onSelectSet,
  onCreateSet,
  onRenameSet,
  onDeleteSet
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [editingSetId, setEditingSetId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    onCreateSet(newSetName.trim());
    setNewSetName('');
    setIsCreateModalOpen(false);
  };

  const handleRenameSubmit = (setId) => {
    if (!editingName.trim()) return;
    onRenameSet(setId, editingName.trim());
    setEditingSetId(null);
    setEditingName('');
  };

  return (
    <div className="deck-profile-tabs">
      {sets.map((set) => {
        const isSelected = currentSet?.id === set.id;
        const isEditing = editingSetId === set.id;
        const isDefault = set.name === 'Personal';

        if (isEditing) {
          return (
            <div 
              key={set.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'var(--surface-card)',
                border: '1.5px solid #FF5900',
                borderRadius: '12px',
                padding: '0.35rem 0.6rem'
              }}
            >
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(set.id);
                  if (e.key === 'Escape') setEditingSetId(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  outline: 'none',
                  width: '90px'
                }}
              />
              <button
                type="button"
                onClick={() => handleRenameSubmit(set.id)}
                style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', padding: '2px' }}
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => setEditingSetId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        }

        return (
          <div key={set.id} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              onClick={() => onSelectSet(set)}
              className={`profile-tab-pill ${isSelected ? 'active' : ''}`}
            >
              {getSetIcon(set.name)}
              <span>{set.name}</span>

              {/* Set Menu Trigger */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === set.id ? null : set.id);
                }}
                style={{
                  marginLeft: '0.2rem',
                  opacity: isSelected ? 0.9 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '4px'
                }}
              >
                <MoreVertical size={13} />
              </span>
            </button>

            {/* Profile Dropdown Actions */}
            {activeMenuId === set.id && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  background: 'var(--surface-elevated)',
                  border: '1.5px solid var(--border-strong)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  zIndex: 100,
                  padding: '0.35rem',
                  minWidth: '120px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setEditingSetId(set.id);
                    setEditingName(set.name);
                    setActiveMenuId(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textAlign: 'left'
                  }}
                >
                  <Edit2 size={13} />
                  <span>Rename</span>
                </button>

                {!isDefault && sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      if (window.confirm(`Delete profile "${set.name}" and all its entries?`)) {
                        onDeleteSet(set.id);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      color: '#EF4444',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textAlign: 'left'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add New Profile Pill */}
      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="profile-tab-pill"
        style={{ borderStyle: 'dashed' }}
        title="Create new profile set (e.g. Work, College, Portfolio)"
      >
        <Plus size={14} color="var(--coral-accent)" />
        <span>New Profile</span>
      </button>

      {/* Create Set Modal Dialog */}
      {isCreateModalOpen && (
        <div className="modal-overlay-blur" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="modal-dialog-box" 
            style={{ maxWidth: '420px', borderRadius: '22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.2rem 1.6rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--surface-elevated)'
            }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Create New Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="icon-action-button"
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.4rem 1.6rem' }}>
              <div style={{ marginBottom: '1.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="modern-input"
                  placeholder="e.g. Work, College, Freelance, Socials"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary-action"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                >
                  <Plus size={15} />
                  <span>Create Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
