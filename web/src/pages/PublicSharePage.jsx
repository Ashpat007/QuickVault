import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2,
  Lock,
  RefreshCw,
  LogOut,
  FolderHeart,
  Globe
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

export function PublicSharePage({ slug }) {
  const [set, setSet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadPublicData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const publicSet = await supabase.sets.fetchPublicSetBySlug(slug);
      if (!publicSet) {
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
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="btn-primary-action"
              style={{ width: '100%', padding: '0.88rem' }}
            >
              <LogOut size={18} />
              <span>Go to Sign In / Sign Up Page</span>
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
          <div className="brand-logo-btn" onClick={() => window.location.href = '/'}>
            <div className="brand-icon-box">
              <KeyRound size={22} />
            </div>
            <span className="brand-title">QuickVault</span>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={() => loadPublicData(true)}
              className="nav-btn-icon"
              title="Refresh public entries"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            <div className="user-badge-pill" style={{ background: 'var(--coral-light)', color: 'var(--coral-text)', borderColor: 'var(--border-strong)' }}>
              <Globe size={14} color="var(--coral-accent)" />
              <span>Public Contact Card</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Profile Header Bar */}
        <div className="profile-header-card">
          <div className="profile-info">
            <div className="profile-avatar-icon">
              <FolderHeart size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="profile-title">
                  {set.name} Profile
                </h3>
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
                  <Globe size={12} /> PUBLIC SHARE ACTIVE
                </span>
              </div>
              <p className="profile-subtitle">
                Tap any item below to copy it to your clipboard
              </p>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div>
          {entries.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              This public vault currently has no active items.
            </div>
          ) : (
            <div>
              {entries.map((entry) => (
                <div key={entry.id} className="vault-entry-card">
                  {/* Icon Badge */}
                  <div className="entry-icon-badge">
                    {getEntryIcon(entry.entry_type)}
                  </div>

                  {/* Label & Value Preview */}
                  <div className="entry-info-container">
                    <div className="entry-title-row">
                      <span className="entry-label-text">{entry.label}</span>
                      <span className="entry-type-tag">{entry.entry_type}</span>
                    </div>
                    <div className="entry-value-preview" title={entry.value}>
                      {entry.value}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    className={`btn-copy-action ${copiedId === entry.id ? 'copied' : ''}`}
                  >
                    {copiedId === entry.id ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedId === entry.id ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
