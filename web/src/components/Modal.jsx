import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = '500px',
  icon: Icon
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement;

    // Focus first focusable element inside modal on open
    setTimeout(() => {
      if (dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.classList.add('modal-open-lock');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open-lock');
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay-blur" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
    >
      <div 
        ref={dialogRef}
        className="modal-dialog-box" 
        style={{ maxWidth, borderRadius: '22px' }}
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
            {Icon && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--coral-accent)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h3 
                id="modal-dialog-title"
                style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  fontSize: '1.3rem', 
                  fontWeight: 800, 
                  color: 'var(--text-main)', 
                  letterSpacing: '-0.03em' 
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.4rem' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.4rem 1.6rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
