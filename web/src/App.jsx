import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { VaultList } from './components/VaultList';
import { ShareModal } from './components/ShareModal';
import { UserGuideModal } from './components/UserGuideModal';
import { PublicSharePage } from './pages/PublicSharePage';
import { KeyRound, LogOut, User, FolderHeart, QrCode, Globe, HelpCircle, ShieldOff, Sun, Moon } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const currentSetRef = useRef(currentSet);
  currentSetRef.current = currentSet;

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quickvault_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quickvault_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const pathname = window.location.pathname;
  const shareMatch = pathname.match(/^\/share\/([\w-]+)/);
  const publicSlug = shareMatch ? shareMatch[1] : null;

  useEffect(() => {
    if (publicSlug) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!isSubscribed) return;
      setSession(data?.session || null);
      if (data?.session) {
        initDefaultSet(data.session.user.id, true);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth state changes (Quiet background updates on tab focus)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isSubscribed) return;
      setSession(newSession);
      if (newSession) {
        // Only trigger visible loading if currentSet is genuinely null
        const isFirstLoad = !currentSetRef.current;
        initDefaultSet(newSession.user.id, isFirstLoad);
      } else {
        setCurrentSet(null);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [publicSlug]);

  const initDefaultSet = async (userId, showLoading = false) => {
    if (showLoading && !currentSetRef.current) setLoading(true);
    try {
      const personalSet = await supabase.sets.createDefaultSet(userId);
      setCurrentSet(personalSet);
    } catch (err) {
      console.error('Failed to initialize default set', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleToggleShare = async (makePublic) => {
    if (!currentSet || !session) return;
    const updatedSet = await supabase.sets.toggleShareMode(currentSet.id, session.user.id, makePublic);
    setCurrentSet(updatedSet);
  };

  if (publicSlug) {
    return <PublicSharePage slug={publicSlug} />;
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
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="nav-btn-icon"
            >
              <HelpCircle size={16} color="var(--coral-accent)" />
              <span>Guide</span>
            </button>

            {session && (
              <>
                <div className="user-badge-pill">
                  <User size={14} color="var(--coral-accent)" />
                  <span>{session.user.email}</span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="nav-btn-icon"
                  title="Log Out"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {!session && !loading && (
          <div className="hero-header-box">
            <h1 className="hero-title">
              Your Personal Quick-Copy Vault
            </h1>
            <p className="hero-subtitle">
              Instantly copy recurring links, handles, emails, and snippets with a single tap.
            </p>
          </div>
        )}

        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            Initializing QuickVault...
          </div>
        ) : !session ? (
          <Auth onAuthSuccess={(newSession) => setSession(newSession)} />
        ) : (
          <div>
            {/* Active Vault Set Bar */}
            <div className="profile-header-card">
              <div className="profile-info">
                <div className="profile-avatar-icon">
                  <FolderHeart size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h3 className="profile-title">
                      {currentSet?.name || 'Personal'} Vault
                    </h3>
                    {currentSet?.is_public && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span 
                          onClick={() => setIsShareModalOpen(true)}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#20BF6B',
                            background: 'rgba(32, 191, 107, 0.14)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer'
                          }}
                          title="Click to view QR & Share details"
                        >
                          <Globe size={12} /> PUBLIC SHARE ACTIVE
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleShare(false)}
                          style={{
                            background: '#FFEBEB',
                            color: '#EB3B5A',
                            border: '1px solid #FFC2C2',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Stop public sharing immediately"
                        >
                          <ShieldOff size={11} />
                          <span>Stop Sharing</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="profile-subtitle">
                    Default Active Profile
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="btn-secondary-action"
              >
                <QrCode size={18} color="var(--coral-accent)" />
                <span>{currentSet?.is_public ? 'QR & Share Details' : 'Make Shareable'}</span>
              </button>
            </div>

            {/* Vault List for current set */}
            <VaultList session={session} currentSet={currentSet} />

            {/* Share / QR Modal */}
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              set={currentSet}
              onToggleShare={handleToggleShare}
            />
          </div>
        )}
      </main>

      {/* Interactive User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
