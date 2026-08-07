import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderHeart, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Globe,
  Briefcase,
  GraduationCap,
  Folder,
  Sparkles
} from 'lucide-react';

function getSetIcon(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('work') || lower.includes('job') || lower.includes('career')) return <Briefcase size={16} />;
  if (lower.includes('college') || lower.includes('school') || lower.includes('study')) return <GraduationCap size={16} />;
  if (lower.includes('personal') || lower.includes('home')) return <FolderHeart size={16} />;
  return <Folder size={16} />;
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
    <div style={{ marginBottom: '1rem' }}>
      {/* Horizontal Segmented Set Selector Dock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.35rem',
        background: 'var(--surface-elevated)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: '18px',
        scrollbarWidth: 'none'
      }}>
        {sets.map((set) => {
          const isSelected = currentSet?.id === set.id;
          const isEditing = editingSetId === set.id;
          const isDefault = set.name === 'Personal';

          if (isEditing) {
            return (
              <div 
                key={set.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'var(--surface-card)',
                  border: '1.5px solid var(--coral-accent)',
                  borderRadius: '12px',
                  padding: '0.35rem 0.6rem'
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'none',
                    outline: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    width: '100px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(set.id);
                    if (e.key === 'Escape') setEditingSetId(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRenameSubmit(set.id)}
                  className="icon-action-button"
                  style={{ padding: '0.2rem' }}
                >
                  <Check size={14} color="#20BF6B" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSetId(null)}
                  className="icon-action-button"
                  style={{ padding: '0.2rem' }}
                >
                  <X size={14} color="#EB3B5A" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={set.id}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => onSelectSet(set)}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, #FF9A86 0%, #F87D65 100%)' 
                    : 'transparent',
                  border: isSelected 
                    ? '1.5px solid #F87D65' 
                    : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.86rem',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 4px 14px rgba(248, 125, 101, 0.35)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <span style={{ color: isSelected ? '#FFFFFF' : 'var(--text-light)' }}>
                  {getSetIcon(set.name)}
                </span>
                <span>{set.name} Profile</span>

                {isSelected && (
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem',
                    textTransform: 'uppercase'
                  }}>
                    Active
                  </span>
                )}

                {set.is_public && !isSelected && (
                  <span 
                    title="Public Share Active"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#20BF6B',
                      boxShadow: '0 0 8px #20BF6B'
                    }} 
                  />
                )}

                {!isDefault && isSelected && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === set.id ? null : set.id);
                    }}
                    style={{
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: 0.9,
                      marginLeft: '0.2rem',
                      color: '#FFFFFF'
                    }}
                  >
                    <MoreVertical size={14} />
                  </span>
                )}
              </button>

              {/* Set Options Dropdown Menu */}
              {activeMenuId === set.id && (
                <div
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    background: 'var(--surface-elevated)',
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    zIndex: 100,
                    padding: '0.3rem',
                    minWidth: '130px'
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
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Rename Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      if (window.confirm(`Are you sure you want to delete "${set.name}" profile? All entries inside will be deleted.`)) {
                        onDeleteSet(set.id);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#FFEBEB',
                      color: '#EB3B5A',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '2px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Profile</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Profile Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-secondary-action"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', borderRadius: '12px', flexShrink: 0, borderStyle: 'dashed' }}
          title="Create New Profile / Set"
        >
          <Plus size={15} color="var(--coral-accent)" />
          <span>New Profile</span>
        </button>
      </div>

      {/* Create New Profile Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay-blur" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="modal-dialog-box" 
            style={{ maxWidth: '420px' }}
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
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Create New Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="icon-action-button"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.4rem 1.6rem' }}>
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="modern-input"
                  placeholder="e.g. College, Work, Job Hunting"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary-action"
                  style={{ padding: '0.6rem 1.1rem', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem' }}
                >
                  <Plus size={16} />
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
