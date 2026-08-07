import React, { useEffect } from 'react';
import { X, Copy, Sparkles, QrCode, ShieldCheck, MousePointer, HelpCircle, CheckCircle2 } from 'lucide-react';

export function UserGuideModal({ isOpen, onClose }) {
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur" onClick={onClose}>
      <div 
        className="modal-dialog-box" 
        style={{ maxWidth: '640px', borderRadius: '22px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                How QuickVault Works
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                Complete User & Security Guide
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

        {/* Scrollable Body */}
        <div style={{ padding: '1.4rem 1.6rem', maxHeight: '72vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Section 1 */}
            <div style={{ 
              background: 'var(--surface-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '14px', 
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem', color: '#FF5900', fontWeight: 800, fontSize: '0.95rem' }}>
                <Copy size={16} />
                <span>1. One-Tap Copy UX</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                QuickVault is built to eliminate the friction of hunting down your GitHub link, portfolio, LinkedIn handle, email, or bio snippet. Clicking <strong>Copy</strong> instantly copies the exact value to your clipboard without opening extra menus.
              </p>
            </div>

            {/* Section 2 */}
            <div style={{ 
              background: 'var(--surface-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '14px', 
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem', color: '#FF5900', fontWeight: 800, fontSize: '0.95rem' }}>
                <Sparkles size={16} />
                <span>2. Smart Entry Typing</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                When you paste any URL or text snippet, QuickVault automatically recognizes patterns:
              </p>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '1.2rem', marginTop: '0.35rem', lineHeight: 1.6 }}>
                <li><strong>GitHub</strong>: <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>github.com/username</code> → auto-labeled & matched to GitHub icon.</li>
                <li><strong>LinkedIn</strong>: <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>linkedin.com/in/username</code> → auto-labeled & matched to LinkedIn icon.</li>
                <li><strong>Email & Phone</strong>: Standard syntax auto-matches Email and Phone icons.</li>
                <li><strong>Web Links</strong>: URL domains are automatically extracted and capitalized.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div style={{ 
              background: 'var(--surface-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '14px', 
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem', color: '#FF5900', fontWeight: 800, fontSize: '0.95rem' }}>
                <QrCode size={16} />
                <span>3. QR & Public Share Mode (Digital Business Card)</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Click <strong>Make Shareable</strong> on any profile set to generate a public link and QR code. You can download the QR code as a high-res image.
              </p>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                • <strong>Privacy Control</strong>: Check <code style={{ background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>🔒 Keep Private</code> on individual items so they stay hidden even when the profile is public.<br />
                • <strong>Instant Revocation</strong>: Click <strong>Stop Sharing</strong> anytime to immediately break the link and return a revoked screen.
              </div>
            </div>

            {/* Section 4 */}
            <div style={{ 
              background: 'var(--surface-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '14px', 
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem', color: '#FF5900', fontWeight: 800, fontSize: '0.95rem' }}>
                <MousePointer size={16} />
                <span>4. Browser Extension Integration</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                With the QuickVault browser extension installed, you can <strong>right-click any input field on any website</strong> or click the toolbar extension icon to paste your saved links directly without opening the web app tab!
              </p>
            </div>

            {/* Section 5 */}
            <div style={{ 
              background: '#FFF5F5', 
              border: '1px solid #FED7D7', 
              borderLeft: '4px solid #EB3B5A', 
              borderRadius: '14px', 
              padding: '1rem 1.25rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem', color: '#C53030', fontWeight: 800, fontSize: '0.95rem' }}>
                <ShieldCheck size={16} />
                <span>5. Non-Password Policy & Security</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#9B2C2C', lineHeight: 1.5 }}>
                QuickVault is explicitly designed for non-sensitive links, handles, and text snippets. <strong>Never store account passwords, bank credentials, or API secret keys in QuickVault.</strong>
              </p>
            </div>

          </div>

          <div style={{ marginTop: '1.4rem', textAlign: 'right' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary-action"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
            >
              <CheckCircle2 size={16} />
              <span>Got It!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
