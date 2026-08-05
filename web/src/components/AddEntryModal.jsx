import React, { useState, useEffect } from 'react';
import { detectEntryType, detectPasswordRisk } from '../lib/typeDetector';
import { X, Sparkles, AlertOctagon, Save, Plus, Lock } from 'lucide-react';

export function AddEntryModal({ isOpen, onClose, onSave, editingEntry = null }) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [entryType, setEntryType] = useState('text');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState(null);
  const [userOverrodeLabel, setUserOverrodeLabel] = useState(false);

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
      setEntryType(editingEntry.entry_type || 'text');
      setIsPrivate(Boolean(editingEntry.is_private));
      setPasswordWarning(detectPasswordRisk(editingEntry.value));
      setUserOverrodeLabel(true);
    } else {
      setValue('');
      setLabel('');
      setEntryType('text');
      setIsPrivate(false);
      setAutoDetected(false);
      setPasswordWarning(null);
      setUserOverrodeLabel(false);
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

    if (!userOverrodeLabel || !label) {
      const { entryType: detectedType, suggestedLabel } = detectEntryType(val);
      setEntryType(detectedType);
      if (suggestedLabel) {
        setLabel(suggestedLabel);
        setAutoDetected(true);
      } else {
        setAutoDetected(false);
      }
    } else {
      const { entryType: detectedType } = detectEntryType(val);
      setEntryType(detectedType);
    }
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
      entry_type: entryType,
      is_private: isPrivate
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur">
      <div className="modal-dialog-box">
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.4rem 2rem 1.2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {editingEntry ? 'Edit Vault Entry' : 'Add New Vault Entry'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-scrollable-body">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Value Input */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Paste Link / Handle / Snippet
              </label>
              <textarea
                rows={3}
                required
                className="modern-input"
                style={{ 
                  resize: 'none', 
                  fontFamily: 'JetBrains Mono, monospace',
                  borderColor: passwordWarning ? '#EB3B5A' : undefined
                }}
                placeholder="e.g. github.com/username, user@email.com, or portfolio.dev"
                value={value}
                onChange={handleValueChange}
              />

              {autoDetected && !editingEntry && !passwordWarning && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: 'var(--coral-text)',
                  fontWeight: 700,
                  marginTop: '0.45rem'
                }}>
                  <Sparkles size={15} />
                  <span>Auto-detected as <strong>{entryType}</strong> (label pre-filled)</span>
                </div>
              )}

              {passwordWarning && (
                <div style={{
                  background: '#FFEBEB',
                  border: '1.5px solid #FFC2C2',
                  borderLeft: '5px solid #EB3B5A',
                  color: '#C0392B',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '14px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  lineHeight: 1.45,
                  boxShadow: '0 4px 14px rgba(235, 59, 90, 0.12)'
                }}>
                  <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#EB3B5A' }} />
                  <div>{passwordWarning}</div>
                </div>
              )}
            </div>

            {/* Step 2: Label Name */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Label Name
              </label>
              <input
                type="text"
                required
                className="modern-input"
                placeholder="e.g. GitHub Profile, Work Email, Portfolio"
                value={label}
                onChange={handleLabelChange}
              />
            </div>

            {/* Step 3: Type Selection */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Type Icon
              </label>
              <select
                className="modern-input"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
              >
                <option value="github">GitHub Profile</option>
                <option value="linkedin">LinkedIn Handle</option>
                <option value="email">Email Address</option>
                <option value="phone">Phone Number</option>
                <option value="link">Web Link</option>
                <option value="text">Text Snippet</option>
              </select>
            </div>

            {/* Granular Privacy */}
            <div style={{
              background: 'var(--coral-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '0.85rem 1.1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <input
                type="checkbox"
                id="isPrivateCheck"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--coral-accent)', cursor: 'pointer' }}
              />
              <label htmlFor="isPrivateCheck" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={15} color="var(--coral-text)" />
                <span>Keep Private (Hide from public QR / Share link)</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-action"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-action"
              >
                {editingEntry ? <Save size={18} /> : <Plus size={18} />}
                <span>{editingEntry ? 'Save Changes' : 'Add Entry'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
