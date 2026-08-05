import React, { useEffect } from 'react';
import { X, Copy, Sparkles, QrCode, ShieldCheck, MousePointer, HelpCircle } from 'lucide-react';

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
    <div className="modal-overlay-blur">
      <div className="modal-dialog-box">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.4rem 2rem 1.2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--coral-light)',
              color: 'var(--coral-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                How QuickVault Works
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                Complete User & Security Guide
              </span>
            </div>
          </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Section 1 */}
            <div style={{ background: 'var(--coral-light)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', color: 'var(--coral-text)', fontWeight: 700, fontSize: '0.98rem' }}>
                <Copy size={18} />
                <span>1. One-Tap Copy UX</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                QuickVault is built to eliminate the friction of hunting down your GitHub link, portfolio, LinkedIn handle, email, or bio snippet. Clicking <strong>Copy</strong> instantly copies the exact value to your clipboard without opening extra menus.
              </p>
            </div>

            {/* Section 2 */}
            <div style={{ background: 'var(--coral-light)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', color: 'var(--coral-text)', fontWeight: 700, fontSize: '0.98rem' }}>
                <Sparkles size={18} />
                <span>2. Smart Entry Typing</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                When you paste any URL or text snippet, QuickVault automatically recognizes patterns:
              </p>
              <ul style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginLeft: '1.25rem', marginTop: '0.4rem', lineHeight: 1.6 }}>
                <li><strong>GitHub</strong>: <code>github.com/username</code> → auto-labeled & matched to GitHub icon.</li>
                <li><strong>LinkedIn</strong>: <code>linkedin.com/in/username</code> → auto-labeled & matched to LinkedIn icon.</li>
                <li><strong>Email & Phone</strong>: Standard syntax auto-matches Email and Phone icons.</li>
                <li><strong>Web Links</strong>: URL domains are automatically extracted and capitalized.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div style={{ background: 'var(--coral-light)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', color: 'var(--coral-text)', fontWeight: 700, fontSize: '0.98rem' }}>
                <QrCode size={18} />
                <span>3. QR & Public Share Mode (Digital Business Card)</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Click <strong>Share & QR Code</strong> on any set to enable a public link and QR code. You can download the QR code as a <code>.PNG</code> image.
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                • <strong>Privacy Control</strong>: You can check <code>🔒 Keep Private</code> on individual items so they stay hidden even when the set is public.<br />
                • <strong>Instant Revocation</strong>: Click <strong>Stop Sharing</strong> anytime to immediately break the link and return a 404.
              </div>
            </div>

            {/* Section 4 */}
            <div style={{ background: 'var(--coral-light)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', color: 'var(--coral-text)', fontWeight: 700, fontSize: '0.98rem' }}>
                <MousePointer size={18} />
                <span>4. Browser Extension Integration</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                With the QuickVault browser extension installed, you can <strong>right-click any input field on any website</strong> to paste your saved links directly without opening the web app tab!
              </p>
            </div>

            {/* Section 5 */}
            <div style={{ background: '#FFEBEB', border: '1px solid #FFC2C2', borderLeft: '4px solid #EB3B5A', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', color: '#EB3B5A', fontWeight: 700, fontSize: '0.98rem' }}>
                <ShieldCheck size={18} />
                <span>5. Non-Password Policy & Security</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#842029', lineHeight: 1.45 }}>
                QuickVault is explicitly designed for non-sensitive links, handles, and text snippets. <strong>Never store account passwords, bank credentials, or API secret keys in QuickVault.</strong>
              </p>
            </div>

          </div>

          <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary-action"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
