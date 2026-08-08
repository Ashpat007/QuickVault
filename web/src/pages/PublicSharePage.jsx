import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Sparkles, 
  Sun, 
  Moon, 
  Mail, 
  Phone, 
  Globe, 
  FileText,
  Lock,
  ArrowRight,
  HelpCircle,
  X,
  CheckCircle2
} from 'lucide-react';

function getIconForType(type) {
  switch (type) {
    case 'github':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
          <path d="M9 18c-4.51 2-5-2-7-2"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      );
    case 'email': return <Mail size={20} />;
    case 'phone': return <Phone size={20} />;
    case 'link': return <Globe size={20} />;
    default: return <FileText size={20} />;
  }
}

export function PublicSharePage({ slug }) {
  const [set, setSet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isPublicGuideOpen, setIsPublicGuideOpen] = useState(false);

  // 100% Isolated Theme for Public Viewers
  const [publicTheme, setPublicTheme] = useState(() => {
    return localStorage.getItem('quickvault_public_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', publicTheme);
    localStorage.setItem('quickvault_public_theme', publicTheme);
  }, [publicTheme]);

  const togglePublicTheme = () => {
    setPublicTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loadPublicData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const publicSet = await supabase.sets.fetchSetBySlug(slug);
      if (!publicSet || !publicSet.is_public) {
        setSet(null);
        setEntries([]);
        return;
      }
      setSet(publicSet);
      const publicEntries = await supabase.entries.fetchPublicEntries(publicSet.id);
      setEntries(publicEntries || []);
    } catch (err) {
      console.error('Error fetching public set', err);
      setSet(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData(true);

    const interval = setInterval(() => loadPublicData(false), 3000);
    const handleStorage = () => loadPublicData(false);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [slug]);

  const handleCopy = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopiedId(entry.id);
      setToastMessage(`Copied "${entry.label}" to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Opens Sign Up / Create Vault in a fresh new browser tab!
  const handleCreateOwnVault = () => {
    window.open('/', '_blank');
  };

  if (loading) {
    return (
      <div className="main-wrapper" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="glass-card" style={{ padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          Loading public QuickVault profile...
        </div>
      </div>
    );
  }

  // Revoked / Invalid Link State
  if (!set) {
    return (
      <div>
        <nav className="navbar-sticky">
          <div className="nav-container">
            <div className="brand-logo-btn" onClick={() => window.location.href = '/'}>
              <div className="brand-icon-box">
                <KeyRound size={22} />
              </div>
              <span className="brand-title">QuickVault</span>
            </div>

            <div className="nav-actions">
              <button
                type="button"
                onClick={togglePublicTheme}
                className="theme-toggle-btn"
                title={publicTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {publicTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>
        </nav>

        <div className="main-wrapper" style={{ maxWidth: '540px', marginTop: '4rem' }}>
          <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FFEBEB',
              color: '#EB3B5A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.4rem'
            }}>
              <Lock size={32} />
            </div>

            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Public Access Revoked
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '2rem' }}>
              The owner of this vault has turned off public sharing or revoked this link. No entries are visible.
            </p>

            <button
              type="button"
              onClick={handleCreateOwnVault}
              className="btn-primary-action"
            >
              <span>Create Your Own QuickVault</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Navbar */}
      <nav className="navbar-sticky">
        <div className="nav-container">
          <div className="brand-logo-btn" onClick={() => window.open('/', '_blank')}>
            <div className="brand-icon-box">
              <KeyRound size={22} />
            </div>
            <span className="brand-title">QuickVault</span>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={() => setIsPublicGuideOpen(true)}
              className="nav-btn-icon"
              title="How This Card Works"
            >
              <HelpCircle size={16} color="var(--coral-accent)" />
              <span>How It Works</span>
            </button>

            <button
              type="button"
              onClick={togglePublicTheme}
              className="theme-toggle-btn"
              title={publicTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {publicTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              onClick={handleCreateOwnVault}
              className="btn-primary-action"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              <span>Create Free Vault</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Public Profile Container */}
      <main className="main-wrapper" style={{ maxWidth: '680px' }}>
        {/* Profile Identity Card */}
        <div className="profile-header-card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.6rem' }}>
          <div className="profile-info">
            <div className="profile-avatar-icon" style={{ width: '48px', height: '48px', borderRadius: '16px' }}>
              <KeyRound size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 className="profile-title" style={{ fontSize: '1.4rem' }}>
                  {set.name} Digital Card
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#20BF6B',
                  background: 'rgba(32, 191, 107, 0.14)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ● Verified Active
                </span>
              </div>
              <p className="profile-subtitle" style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                Public Contact Card & Quick-Copy Links
              </p>
            </div>
          </div>
        </div>

        {/* Public Items List */}
        {entries.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            No public entries are currently shared in this profile.
          </div>
        ) : (
          <div>
            {entries.map((entry) => {
              const isCopied = copiedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="vault-entry-card-3d"
                  style={{
                    marginBottom: '0.85rem',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '0.95rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div className="entry-icon-badge">
                    {getIconForType(entry.entry_type)}
                  </div>

                  <div className="entry-info-container">
                    <div className="entry-title-row">
                      <span className="entry-label-text">{entry.label}</span>
                      <span className="entry-type-tag">{entry.entry_type || 'link'}</span>
                    </div>

                    <div className="entry-value-preview" title={entry.value}>
                      {entry.value}
                    </div>

                    {entry.note && (
                      <div style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-light)',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span>💬</span>
                        <span>{entry.note}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    className={`btn-copy-action ${isCopied ? 'copied' : ''}`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Viral Growth CTA Banner: Create Your Own Vault */}
        <div className="glass-card" style={{ 
          marginTop: '2.5rem', 
          padding: '2rem 1.8rem', 
          textAlign: 'center',
          background: 'var(--surface-elevated)',
          border: '1.5px solid var(--border-strong)',
          boxShadow: 'var(--shadow-hover)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: '#FF5900',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 16px rgba(255, 89, 0, 0.35)'
          }}>
            <Sparkles size={24} />
          </div>

          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
            Create Your Own Digital Contact Card & Vault
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
            Store your recurring links, GitHub, LinkedIn, portfolio, emails, and snippets for 1-tap copying & shareable QR business cards.
          </p>

          <button
            type="button"
            onClick={handleCreateOwnVault}
            className="btn-primary-action"
            style={{ padding: '0.85rem 1.8rem', fontSize: '0.98rem' }}
          >
            <span>Create Your Free QuickVault</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      {/* Public "How It Works" Modal */}
      {isPublicGuideOpen && (
        <div className="modal-overlay-blur" onClick={() => setIsPublicGuideOpen(false)}>
          <div 
            className="modal-dialog-box" 
            style={{ maxWidth: '500px', borderRadius: '22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '1.2rem 1.6rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--surface-elevated)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <HelpCircle size={20} color="var(--coral-accent)" />
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  How This Card Works
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublicGuideOpen(false)}
                className="icon-action-button"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1rem' }}>
                  <strong style={{ color: 'var(--coral-accent)', display: 'block', marginBottom: '0.25rem' }}>📋 1. Instant 1-Tap Copying</strong>
                  Click the <strong>Copy</strong> button on any item to immediately copy GitHub URLs, LinkedIn handles, work emails, or portfolio links to your clipboard.
                </div>

                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1rem' }}>
                  <strong style={{ color: 'var(--coral-accent)', display: 'block', marginBottom: '0.25rem' }}>✨ 2. Create Your Own Card</strong>
                  You can build your own digital contact card and QR code in under 30 seconds for free by clicking <strong>Create Your Free QuickVault</strong> below.
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setIsPublicGuideOpen(false)}
                  className="btn-primary-action"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-floating-container">
          <div className="toast-pill-box">
            <CheckCircle2 size={18} color="var(--coral-accent)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
