import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  FileText, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Lock
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
  isLast 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopied(true);
      if (onCopy) onCopy(entry);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const getEntryIcon = (type) => {
    switch (type) {
      case 'github':
        return <GithubIcon size={20} />;
      case 'linkedin':
        return <LinkedinIcon size={20} />;
      case 'email':
        return <Mail size={20} />;
      case 'phone':
        return <Phone size={20} />;
      case 'link':
        return <LinkIcon size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div className="vault-entry-card">
      {/* Reorder Buttons */}
      <div className="reorder-handle-box">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className="reorder-arrow-btn"
          title="Move up"
          style={{ opacity: isFirst ? 0.2 : 1 }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className="reorder-arrow-btn"
          title="Move down"
          style={{ opacity: isLast ? 0.2 : 1 }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Entry Icon */}
      <div className="entry-icon-badge">
        {getEntryIcon(entry.entry_type)}
      </div>

      {/* Label and Value */}
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
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <Lock size={10} /> Private Only
            </span>
          )}
        </div>
        <div className="entry-value-preview" title={entry.value}>
          {entry.value}
        </div>
      </div>

      {/* Primary Action: Single-tap Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`btn-copy-action ${copied ? 'copied' : ''}`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span>{copied ? 'Copied!' : 'Copy'}</span>
      </button>

      {/* Edit / Delete Actions */}
      <div className="row-actions-group">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="icon-action-button"
          title="Edit entry"
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="icon-action-button danger"
          title="Delete entry"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
