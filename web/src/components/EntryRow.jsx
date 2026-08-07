import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ChevronUp, 
  ChevronDown, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  FileText,
  Lock,
  FolderInput,
  MessageSquare
} from 'lucide-react';

function GithubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function EntryRow({ 
  entry, 
  onCopy, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  index = 0,
  availableSets = [],
  currentSetId,
  onMoveToSet
}) {
  const [copied, setCopied] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const cardRef = useRef(null);
  const moveMenuRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target)) {
        setIsMoveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    cardRef.current.style.setProperty('--spotlight-x', `${x}px`);
    cardRef.current.style.setProperty('--spotlight-y', `${y}px`);
    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.015)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle('');
  };

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopied(true);
      if (onCopy) onCopy(entry);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const getEntryIcon = (type) => {
    switch (type) {
      case 'github': return <GithubIcon size={20} />;
      case 'linkedin': return <LinkedinIcon size={20} />;
      case 'email': return <Mail size={20} />;
      case 'phone': return <Phone size={20} />;
      case 'link': return <LinkIcon size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const otherSets = availableSets.filter(s => s.id !== currentSetId);

  return (
    <div
      ref={cardRef}
      className="vault-entry-card-3d"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        animationDelay: `${index * 0.05}s`
      }}
    >
      {/* Reorder Arrows */}
      <div className="reorder-handle-box">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className="reorder-arrow-btn"
          title="Move Up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className="reorder-arrow-btn"
          title="Move Down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Entry Type Icon Badge */}
      <div className="entry-icon-badge">
        {getEntryIcon(entry.entry_type)}
      </div>

      {/* Entry Metadata & Monospace Preview */}
      <div className="entry-info-container">
        <div className="entry-title-row">
          <span className="entry-label-text">{entry.label}</span>
          <span className="entry-type-tag">{entry.entry_type}</span>
          {entry.is_private && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#EB3B5A',
              background: '#FFEBEB',
              border: '1px solid #FFC2C2',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Lock size={10} /> Private Only
            </span>
          )}
        </div>

        <div className="entry-value-preview" title={entry.value}>
          {entry.value}
        </div>

        {/* Optional Note / Message */}
        {entry.note && (
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-light)',
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontWeight: 500
          }}>
            <MessageSquare size={12} color="var(--coral-accent)" />
            <span>{entry.note}</span>
          </div>
        )}
      </div>

      {/* Right Side Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          type="button"
          onClick={handleCopyClick}
          className={`btn-copy-action ${copied ? 'copied' : ''}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <div className="row-actions-group">
          {/* Move to Set Action Dropdown */}
          {otherSets.length > 0 && (
            <div style={{ position: 'relative' }} ref={moveMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
                className="icon-action-button"
                title="Move to another profile"
              >
                <FolderInput size={17} />
              </button>

              {isMoveMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--surface-elevated)',
                  border: '1.5px solid var(--border-strong)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  zIndex: 100,
                  padding: '0.35rem',
                  minWidth: '140px'
                }}>
                  <div style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Move to Profile
                  </div>
                  {otherSets.map(set => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => {
                        setIsMoveMenuOpen(false);
                        if (onMoveToSet) onMoveToSet(entry.id, set.id);
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
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {set.name} Profile
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="icon-action-button"
            title="Edit Entry"
          >
            <Edit3 size={17} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="icon-action-button danger"
            title="Delete Entry"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
