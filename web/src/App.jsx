import React, { useState, useEffect, useRef } from 'react';
import { supabase, realSupabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { VaultList } from './components/VaultList';
import { SetSwitcher } from './components/SetSwitcher';
import { ShareModal } from './components/ShareModal';
import { UserGuideModal } from './components/UserGuideModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PublicSharePage } from './pages/PublicSharePage';
import { KeyRound, LogOut, User, FolderHeart, QrCode, Globe, HelpCircle, ShieldOff, Sun, Moon, Command, CheckCircle2, Lock, Save, X } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  // Global Ctrl + K / Cmd + K Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathname = window.location.pathname;
  const shareMatch = pathname.match(/^\/share\/([\w-]+)/);
  const publicSlug = shareMatch ? shareMatch[1] : null;

  useEffect(() => {
    if (publicSlug) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    const hasAuthToken = window.location.hash.includes('access_token') || window.location.search.includes('code');
    const isRecoveryFlow = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');

    // 1. Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!isSubscribed) return;
      const currentSession = data?.session || null;
      setSession(currentSession);
      if (currentSession) {
        if (isRecoveryFlow) {
          setIsResetPasswordModalOpen(true);
          setToastMessage('🔑 Password recovery verified. Choose a new password below!');
        } else if (hasAuthToken) {
          setToastMessage('🎉 Email verified successfully! Welcome to QuickVault.');
        }
        if (hasAuthToken || isRecoveryFlow) {
          setTimeout(() => setToastMessage(null), 3500);
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
        initSetsAndData(currentSession.user.id, true);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isSubscribed) return;
      setSession(newSession);

      if (newSession) {
        if (event === 'PASSWORD_RECOVERY' || isRecoveryFlow) {
          setIsResetPasswordModalOpen(true);
          setToastMessage('🔑 Password recovery verified. Choose a new password below!');
          setTimeout(() => setToastMessage(null), 3500);
        } else if (event === 'SIGNED_IN' && hasAuthToken) {
          setToastMessage('🎉 Logged into QuickVault.');
          setTimeout(() => setToastMessage(null), 3500);
        }
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        const isFirstLoad = !currentSetRef.current;
        initSetsAndData(newSession.user.id, isFirstLoad);
      } else {
        setCurrentSet(null);
        setUserSets([]);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [publicSlug]);

  const initSetsAndData = async (userId, showLoading = false) => {
    if (showLoading && !currentSetRef.current) setLoading(true);
    try {
      await supabase.sets.createDefaultSet(userId);
      const sets = await supabase.sets.fetchUserSets(userId);
      setUserSets(sets || []);

      const activeSet = currentSetRef.current && sets.some(s => s.id === currentSetRef.current.id)
        ? sets.find(s => s.id === currentSetRef.current.id)
        : (sets[0] || null);

      setCurrentSet(activeSet);

      if (activeSet) {
        const data = await supabase.entries.fetchEntries(activeSet.id, userId);
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Failed to initialize sets and data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSet = async (set) => {
    setCurrentSet(set);
    if (session) {
      try {
        const data = await supabase.entries.fetchEntries(set.id, session.user.id);
        setEntries(data || []);
      } catch (err) {
        console.error('Failed to fetch set entries', err);
      }
    }
  };

  const handleCreateSet = async (name) => {
    if (!session) return;
    try {
      const newSet = await supabase.sets.createSet(session.user.id, name);
      const updatedSets = await supabase.sets.fetchUserSets(session.user.id);
      setUserSets(updatedSets);
      handleSelectSet(newSet);
      setToastMessage(`Created new profile "${newSet.name}"`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to create set', err);
    }
  };

  const handleRenameSet = async (setId, newName) => {
    if (!session) return;
    try {
      const updatedSet = await supabase.sets.renameSet(setId, session.user.id, newName);
      const updatedSets = await supabase.sets.fetchUserSets(session.user.id);
      setUserSets(updatedSets);
      if (currentSet?.id === setId) {
        setCurrentSet(updatedSet);
      }
      setToastMessage(`Profile renamed to "${newName}"`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to rename set', err);
    }
  };

  const handleDeleteSet = async (setId) => {
    if (!session) return;
    try {
      await supabase.sets.deleteSet(setId, session.user.id);
      const updatedSets = await supabase.sets.fetchUserSets(session.user.id);
      setUserSets(updatedSets);
      if (updatedSets.length > 0) {
        handleSelectSet(updatedSets[0]);
      }
      setToastMessage('Profile deleted');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to delete set', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleToggleShare = async (makePublic) => {
    if (!currentSet || !session) return;
    const updatedSet = await supabase.sets.toggleShareMode(currentSet.id, session.user.id, makePublic);
    setCurrentSet(updatedSet);
    const updatedSets = await supabase.sets.fetchUserSets(session.user.id);
    setUserSets(updatedSets);
  };

  const handleCommandPaletteCopy = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.value);
      setToastMessage(`Copied "${entry.label}" to clipboard!`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) return;
    try {
      if (realSupabase) {
        const { error } = await realSupabase.auth.updateUser({ password: newPasswordInput });
        if (error) throw error;
      }
      setIsResetPasswordModalOpen(false);
      setNewPasswordInput('');
      setToastMessage('🎉 Password updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Failed to update password: ' + err.message);
    }
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
            {/* Command Palette Trigger */}
            {session && (
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="nav-btn-icon"
                title="Search Command Palette (Ctrl + K)"
              >
                <Command size={15} color="var(--coral-accent)" />
                <span><kbd className="kbd-badge">Ctrl K</kbd></span>
              </button>
            )}

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
            {/* Multiple Profiles / Sets Switcher Bar */}
            <SetSwitcher
              sets={userSets}
              currentSet={currentSet}
              onSelectSet={handleSelectSet}
              onCreateSet={handleCreateSet}
              onRenameSet={handleRenameSet}
              onDeleteSet={handleDeleteSet}
            />

            {/* Active Vault Set Header */}
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
                            border: '1.5px solid #FFC2C2',
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
                    Active Profile Set ({userSets.length} Total Profiles)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="btn-secondary-action"
                  title="Update Password"
                >
                  <Lock size={16} color="var(--coral-accent)" />
                  <span>Update Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="btn-secondary-action"
                >
                  <QrCode size={18} color="var(--coral-accent)" />
                  <span>{currentSet?.is_public ? 'QR & Share Details' : 'Make Shareable'}</span>
                </button>
              </div>
            </div>

            {/* Vault List for current set */}
            <VaultList 
              session={session} 
              currentSet={currentSet} 
              availableSets={userSets}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />

            {/* Share / QR Modal */}
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              set={currentSet}
              onToggleShare={handleToggleShare}
            />

            {/* Command Palette Spotlight Modal */}
            <CommandPaletteModal
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              entries={entries}
              onCopyItem={handleCommandPaletteCopy}
            />

            {/* Set New Password Modal (Password Recovery) */}
            {isResetPasswordModalOpen && (
              <div className="modal-overlay-blur" onClick={() => setIsResetPasswordModalOpen(false)}>
                <div 
                  className="modal-dialog-box" 
                  style={{ maxWidth: '440px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--surface-elevated)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <Lock size={20} color="var(--coral-accent)" />
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Set New Password
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsResetPasswordModalOpen(false)}
                      className="icon-action-button"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNewPassword} style={{ padding: '1.5rem 1.75rem' }}>
                    <div style={{ marginBottom: '1.4rem' }}>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                        Enter New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoFocus
                        className="modern-input"
                        placeholder="At least 6 characters"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setIsResetPasswordModalOpen(false)}
                        className="btn-secondary-action"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-action"
                      >
                        <Save size={16} />
                        <span>Update Password</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

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
