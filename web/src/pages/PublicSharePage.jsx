import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';
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
  CheckCircle2,
  Info,
  QrCode
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
  const [qrDataUrl, setQrDataUrl] = useState('');
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

  const loadPublicData = async () => {
    try {
      const publicCard = await supabase.sets.fetchSetBySlug(slug);
      
      if (!publicCard) {
        setSet(null);
        setEntries([]);
        return;
      }

      setSet(publicCard);
      setEntries(publicCard.entries || []);

      if (publicCard.id) {
        supabase.analytics.incrementSetViews(publicCard.id);
      }

      // Generate large QR code for public contact card
      const shareUrl = window.location.href;
      QRCode.toDataURL(shareUrl, { width: 220, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(() => {});

    } catch (err) {
      console.error('Error fetching public set', err);
      setSet(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Window Focus Refresh instead of 3s polling
  useEffect(() => {
    loadPublicData();

    const handleFocus = () => loadPublicData();
    const handleStorage = () => loadPublicData();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [slug]);

  const handleCopy = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopiedId(entry.id);
      setToastMessage(`Copied "${entry.label}" to clipboard!`);
      supabase.analytics.incrementEntryCopies(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

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
        {/* Digital Business Card Hero */}
        <div className="profile-header-card" style={{ marginBottom: '1.5rem', padding: '1.6rem 1.8rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.2rem' }}>
            <div className="profile-info">
              <div className="profile-avatar-icon" style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#D94A00', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                {set.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h1 className="profile-name-title" style={{ fontSize: '1.65rem' }}>
                    {set.name} Card
                  </h1>
                  <span className="profile-public-badge" style={{ fontSize: '0.74rem', background: 'rgba(32, 191, 107, 0.14)', color: '#20BF6B' }}>
                    <Globe size={13} /> Verified Contact Card
                  </span>
                </div>
                <p className="profile-subtitle" style={{ fontSize: '0.92rem', marginTop: '0.3rem' }}>
                  Official Digital Business Card & 1-Tap Copyable Links
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            {qrDataUrl && (
              <div style={{
                background: '#FFFFFF',
                padding: '0.6rem',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}>
                <img src={qrDataUrl} alt="QuickVault Card QR Code" style={{ width: '95px', height: '95px', display: 'block', borderRadius: '8px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Public Items List */}
        {entries.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <Info size={28} color="#D94A00" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              No public entries shared yet
            </h4>
            <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
              Add links or handles to your QuickVault to display them on this digital card.
            </p>
          </div>
        ) : (
          <div>
            {entries.map((entry) => {
              const isCopied = copiedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="vault-entry-card-3d"
                  onClick={() => handleCopy(entry)}
                  title="Click anywhere on card to 1-tap copy"
                  style={{
                    marginBottom: '0.85rem',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '0.95rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
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
                    onClick={(e) => { e.stopPropagation(); handleCopy(entry); }}
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
            background: '#D94A00',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 16px rgba(217, 74, 0, 0.35)'
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

      {/* Floating Toast */}
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
