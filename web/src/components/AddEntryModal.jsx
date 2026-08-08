import React, { useState, useEffect } from 'react';
import { detectEntryType, detectPasswordRisk } from '../lib/typeDetector';
import { X, Sparkles, AlertOctagon, Save, Plus, Lock, Mail, Phone, Link as LinkIcon, FileText } from 'lucide-react';

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
  const [isPrivate, setIsPrivate] = useState(true);
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
      setIsPrivate(editingEntry.is_private !== undefined ? editingEntry.is_private : true);
      setUserOverrodeLabel(true);
      setUserOverrodeType(true);
      setAutoDetected(false);
    } else {
      setValue('');
      setLabel('');
      setNote('');
      setEntryType('text');
      setDetectedTypeName('');
      setIsPrivate(true);
      setAutoDetected(false);
      setPasswordWarning(null);
      setUserOverrodeLabel(false);
      setUserOverrodeType(false);
    }
  }, [editingEntry, isOpen]);

  const handleValueChange = (e) => {
    const rawVal = e.target.value;
    setValue(rawVal);

    const warning = detectPasswordRisk(rawVal);
    setPasswordWarning(warning);

    if (rawVal.trim() && !userOverrodeType) {
      const detection = detectEntryType(rawVal);
      const matchedType = detection.entryType || 'text';
      const matchedLabel = detection.suggestedLabel || '';

      if (matchedType !== 'text' && matchedLabel) {
        setEntryType(matchedType);
        setDetectedTypeName(matchedLabel);
        setAutoDetected(true);

        if (!userOverrodeLabel || !label || label.startsWith('GitHub') || label.startsWith('LinkedIn') || label.startsWith('Email') || label.startsWith('Phone') || label.startsWith('Web Link')) {
          setLabel(matchedLabel);
        }
      } else {
        setDetectedTypeName('');
        setAutoDetected(false);
        if (!userOverrodeType) {
          setEntryType('text');
        }
      }
    } else if (!rawVal.trim()) {
      if (!userOverrodeType) {
        setEntryType('text');
        setDetectedTypeName('');
        setAutoDetected(false);
      }
    }
  };

  const handleSelectDockType = (typeId) => {
    setEntryType(typeId);
    setUserOverrodeType(true);
    setAutoDetected(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || !label.trim()) return;

    onSave({
      id: editingEntry?.id,
      value: value.trim(),
      label: label.trim(),
      note: note.trim() || null,
      entry_type: entryType,
      is_private: isPrivate
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur" onClick={onClose}>
      <div 
        className="modal-dialog-box" 
        style={{ maxWidth: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.2rem 1.6rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FF5900',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {editingEntry ? <Save size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                {editingEntry ? 'Edit Vault Entry' : 'Add New Quick-Copy Entry'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                {editingEntry ? 'Update existing item properties' : 'Auto-detected & optimized for 1-tap clipboard copying'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.4rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.35rem 1.6rem' }}>
          
          {/* Password Security Warning Box */}
          {passwordWarning && (
            <div style={{
              background: '#FFF5F5',
              border: '1.5px solid #FEB2B2',
              borderRadius: '12px',
              padding: '0.75rem 0.95rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}>
              <AlertOctagon size={18} color="#E53E3E" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.82rem', color: '#9B2C2C', fontWeight: 800, marginBottom: '2px' }}>
                  {passwordWarning.title}
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#C53030', lineHeight: 1.4 }}>
                  {passwordWarning.message}
                </p>
              </div>
            </div>
          )}

          {/* Value / Link Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Paste Value / URL / Snippet <span style={{ color: '#FF5900' }}>*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              className="modern-input"
              placeholder="e.g. github.com/username, https://portfolio.dev, user@example.com"
              value={value}
              onChange={handleValueChange}
            />
          </div>

          {/* Segmented Floating Icon Dock Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Type Symbol
              </label>
              {autoDetected && detectedTypeName && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#FF5900',
                  background: '#FFF0E6',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Sparkles size={11} /> Auto-Detected
                </span>
              )}
              {userOverrodeType && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  (Custom Selection)
                </span>
              )}
            </div>

            {/* Single-row Segmented Floating Dock Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.35rem',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '0.3rem',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              {TYPE_DOCK_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = entryType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDockType(opt.id)}
                    title={opt.label}
                    style={{
                      flex: 1,
                      minWidth: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      padding: '0.45rem 0.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSelected ? '#FF5900' : 'transparent',
                      color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: isSelected ? 800 : 600,
                      boxShadow: isSelected ? '0 2px 8px rgba(255, 89, 0, 0.25)' : 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '0.66rem', whiteSpace: 'nowrap' }}>
                      {opt.id === 'github' ? 'GitHub' :
                       opt.id === 'linkedin' ? 'LinkedIn' :
                       opt.id === 'email' ? 'Email' :
                       opt.id === 'phone' ? 'Phone' :
                       opt.id === 'link' ? 'Web Link' : 'Snippet'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Display Label <span style={{ color: '#FF5900' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="modern-input"
              placeholder="e.g. GitHub Profile, Resume PDF, Work Contact"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setUserOverrodeLabel(true);
              }}
            />
          </div>

          {/* Optional Note / Message Field */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Optional Note / Description <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontWeight: 500 }}>(e.g. "College handle", "Personal contact")</span>
            </label>
            <input
              type="text"
              className="modern-input"
              placeholder="Add optional context or subtitle..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Privacy Toggle — P0 Security Default: is_private: true */}
          <div style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '0.75rem 0.95rem',
            marginBottom: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: isPrivate ? '#FFF0E6' : 'var(--surface-card)',
                color: isPrivate ? '#FF5900' : 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock size={15} />
              </div>
              <div>
                <strong style={{ fontSize: '0.84rem', display: 'block', color: 'var(--text-main)' }}>
                  Keep Private <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>(Default Secured)</span>
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {isPrivate ? 'Hidden from public QR & shared link cards' : 'Visible on public QR & shared link cards'}
                </span>
              </div>
            </div>

            <input
              type="checkbox"
              id="isPrivateCheckbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#FF5900', cursor: 'pointer' }}
            />
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
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
              <Save size={15} />
              <span>{editingEntry ? 'Update Entry' : 'Save to QuickVault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
