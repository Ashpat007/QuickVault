import React, { useEffect } from 'react';
import { isConfigured } from '../lib/supabaseClient';
import { X, Copy, Sparkles, QrCode, ShieldCheck, MousePointer, HelpCircle, CheckCircle2, Database, Cloud } from 'lucide-react';

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
                Complete User, Privacy & Security Guide
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
            
            {/* Storage Status Pill */}
            <div style={{
              background: isConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 130, 55, 0.12)',
              border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 130, 55, 0.3)'}`,
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isConfigured ? <Cloud size={16} color="#10B981" /> : <Database size={16} color="#FF8237" />}
                <strong style={{ fontSize: '0.84rem', color: isConfigured ? '#059669' : '#C2410C' }}>
                  {isConfigured ? 'Cloud Sync Mode (Supabase Connected)' : 'Local Storage Mode (Browser Sandbox)'}
                </strong>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isConfigured ? 'Multi-device cloud synced' : 'Saved locally in this browser'}
              </span>
            </div>

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
                <span>1. One-Tap Copy & Hotkeys</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Clicking <strong>Copy</strong> on any item copies it instantly without opening submenus. You can also press <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>Alt + 1</code>, <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>Alt + 2</code>, or <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>Alt + 3</code> anywhere to copy your top primary links without touching your mouse.
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
                <span>2. Smart Pattern Auto-Detection</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Pasting any link automatically extracts the type and suggested label:
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
                Click <strong>Make Shareable</strong> on any profile set to generate a public link and QR code.
              </p>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                • <strong>P0 Security Default</strong>: Every new item defaults to <code style={{ background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>🔒 Keep Private</code>. You must explicitly opt-in each link you want public.<br />
                • <strong>Cryptographic Non-Enumerable Slugs</strong>: Share URLs use 21-character cryptographically random slugs (over 10<sup>37</sup> combinations) that cannot be guessed or scanned.<br />
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
                <span>4. Browser Extension & Context Menus</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                With the QuickVault Chrome extension, you can search and 1-tap copy all your vault links right from your browser toolbar or right-click any webpage input to paste links without switching tabs.
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
                QuickVault is explicitly designed for public & semi-public links, handles, and text snippets. <strong>Never store account passwords, bank credentials, or API secret keys in QuickVault.</strong>
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
