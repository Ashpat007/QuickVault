import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  ChevronDown, 
  Database, 
  Lock, 
  HelpCircle, 
  LogOut,
  Sparkles
} from 'lucide-react';

export function UserMenu({ 
  session, 
  onOpenBackup, 
  onOpenPasswordReset, 
  onOpenGuide, 
  onSignOut 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const email = session?.user?.email || 'Vault User';
  const displayEmail = email.length > 22 ? `${email.substring(0, 19)}...` : email;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="nav-btn-icon"
        style={{
          background: isOpen ? 'var(--surface-elevated)' : 'transparent',
          border: '1px solid var(--border-subtle)',
          padding: '0.4rem 0.75rem',
          borderRadius: '10px'
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: '#D94A00',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.75rem'
        }}>
          {email.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {displayEmail}
        </span>
        <ChevronDown size={14} color="var(--text-light)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '210px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          padding: '0.4rem',
          zIndex: 1000
        }}>
          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenBackup(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.8rem',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Database size={15} color="var(--coral-accent)" />
            <span>Backup & Restore</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenPasswordReset(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.8rem',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Lock size={15} color="var(--coral-accent)" />
            <span>Update Password</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenGuide(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.8rem',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <HelpCircle size={15} color="var(--coral-accent)" />
            <span>User Guide</span>
          </button>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

          <button
            type="button"
            onClick={() => { setIsOpen(false); onSignOut(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.8rem',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#EB3B5A',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
