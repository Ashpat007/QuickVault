import React, { useState, useEffect } from 'react';
import { detectEntryType, detectPasswordRisk } from '../lib/typeDetector';
import { X, Sparkles, AlertOctagon, Save, Plus, Lock, Mail, Phone, Link as LinkIcon, FileText, AlignLeft } from 'lucide-react';

function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const TYPE_DOCK_OPTIONS = [
  { id: 'github', label: 'GitHub Profile', icon: GithubIcon },
  { id: 'linkedin', label: 'LinkedIn Handle', icon: LinkedinIcon },
  { id: 'email', label: 'Email Address', icon: Mail },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'link', label: 'Web Link', icon: LinkIcon },
  { id: 'text', label: 'Text Snippet', icon: FileText }
];

export function AddEntryModal({ isOpen, onClose, onSave, editingEntry = null }) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [entryType, setEntryType] = useState('text');
  const [detectedTypeName, setDetectedTypeName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState(null);
  const [userOverrodeLabel, setUserOverrodeLabel] = useState(false);
  const [userOverrodeType, setUserOverrodeType] = useState(false);

  // Lock background body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open-lock');
    } else {
      document.body.classList.remove('modal-open-lock');
    }
    return () => {
      document.body.classList.remove('modal-open-lock');
    };
  }, [isOpen]);

  useEffect(() => {
    if (editingEntry) {
      setValue(editingEntry.value || '');
      setLabel(editingEntry.label || '');
      setNote(editingEntry.note || '');
      setEntryType(editingEntry.entry_type || 'text');
      setDetectedTypeName('');
      setIsPrivate(Boolean(editingEntry.is_private));
      setPasswordWarning(detectPasswordRisk(editingEntry.value));
      setUserOverrodeLabel(true);
      setUserOverrodeType(true);
    } else {
      setValue('');
      setLabel('');
      setNote('');
      setEntryType('text');
      setDetectedTypeName('');
      setIsPrivate(false);
      setAutoDetected(false);
      setPasswordWarning(null);
      setUserOverrodeLabel(false);
      setUserOverrodeType(false);
    }
  }, [editingEntry, isOpen]);

  const handleValueChange = (e) => {
    const val = e.target.value;
    setValue(val);

    const warning = detectPasswordRisk(val);
    setPasswordWarning(warning);

    if (warning) {
      if (!userOverrodeLabel) {
        setLabel('');
      }
      setAutoDetected(false);
      return;
    }

    const { entryType: detectedType, suggestedLabel } = detectEntryType(val);
    const matchedOpt = TYPE_DOCK_OPTIONS.find(o => o.id === detectedType);
    setDetectedTypeName(matchedOpt ? matchedOpt.label : detectedType);

    if (!userOverrodeType) {
      setEntryType(detectedType);
    }

    if (!userOverrodeLabel || !label) {
      if (suggestedLabel) {
        setLabel(suggestedLabel);
        setAutoDetected(true);
      } else {
        setAutoDetected(false);
      }
    }
  };

  const handleTypeSelect = (typeId) => {
    setEntryType(typeId);
    setUserOverrodeType(true);
    setAutoDetected(false);
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    setUserOverrodeLabel(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || !label.trim()) return;

    onSave({
      id: editingEntry?.id,
      label: label.trim(),
      value: value.trim(),
      note: note.trim(),
      entry_type: entryType,
      is_private: isPrivate
    });
    onClose();
  };

  const selectedOption = TYPE_DOCK_OPTIONS.find(opt => opt.id === entryType) || TYPE_DOCK_OPTIONS[5];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur">
      <div className="modal-dialog-box" style={{ maxWidth: '520px', borderRadius: '22px' }}>
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.2rem 1.75rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {editingEntry ? 'Edit Vault Entry' : 'Add New Vault Entry'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.4rem 1.75rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Value Input */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Paste Link / Handle / Snippet
              </label>
              <textarea
                rows={2}
                required
                className="modern-input"
                style={{ 
                  resize: 'none', 
                  padding: '0.7rem 0.9rem',
                  fontSize: '0.88rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  borderColor: passwordWarning ? '#EB3B5A' : undefined
                }}
                placeholder="e.g. github.com/username, user@email.com, or portfolio.dev"
                value={value}
                onChange={handleValueChange}
              />

              {autoDetected && !editingEntry && !passwordWarning && !userOverrodeType && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  color: 'var(--coral-text)',
                  fontWeight: 700,
                  marginTop: '0.3rem'
                }}>
                  <Sparkles size={14} />
                  <span>Auto-detected as <strong>{detectedTypeName}</strong></span>
                </div>
              )}

              {passwordWarning && (
                <div style={{
                  background: '#FFEBEB',
                  border: '1.5px solid #FFC2C2',
                  borderLeft: '4px solid #EB3B5A',
                  color: '#C0392B',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.55rem',
                  lineHeight: 1.45
                }}>
                  <AlertOctagon size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#EB3B5A' }} />
                  <div>{passwordWarning}</div>
                </div>
              )}
            </div>

            {/* Step 2: Label Name & Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Label Name
                </label>
                <input
                  type="text"
                  required
                  className="modern-input"
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
                  placeholder="e.g. GitHub Profile"
                  value={label}
                  onChange={handleLabelChange}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Note / Message <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  className="modern-input"
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
                  placeholder="e.g. My primary open-source repo"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* Step 3: Interactive Floating Symbol Dock Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Type Symbol
                </label>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--coral-text)' }}>
                  {selectedOption.label} {userOverrodeType ? '(Custom)' : ''}
                </span>
              </div>

              {/* Floating Dock Bar Container */}
              <div style={{
                background: 'var(--tab-bar-bg)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4px'
              }}>
                {TYPE_DOCK_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = entryType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeSelect(opt.id)}
                      title={opt.label}
                      style={{
                        flex: 1,
                        height: '40px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isSelected ? 'var(--surface-elevated)' : 'transparent',
                        color: isSelected ? 'var(--coral-accent)' : 'var(--text-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                        transform: isSelected ? 'scale(1.06)' : 'scale(1)'
                      }}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Privacy Checkbox */}
            <div style={{
              background: 'var(--coral-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '0.7rem 1rem',
              marginBottom: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <input
                type="checkbox"
                id="isPrivateCheck"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: 'var(--coral-accent)', cursor: 'pointer' }}
              />
              <label htmlFor="isPrivateCheck" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} color="var(--coral-text)" />
                <span>Keep Private (Hide from public QR / Share link)</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-action"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.86rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-action"
                style={{ padding: '0.6rem 1.35rem', fontSize: '0.86rem' }}
              >
                {editingEntry ? <Save size={16} /> : <Plus size={16} />}
                <span>{editingEntry ? 'Save Changes' : 'Add Entry'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
