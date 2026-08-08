import React, { useState, useEffect, useRef } from 'react';
import { supabase, realSupabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { VaultList } from './components/VaultList';
import { SetSwitcher } from './components/SetSwitcher';
import { ShareModal } from './components/ShareModal';
import { BackupModal } from './components/BackupModal';
import { UserGuideModal } from './components/UserGuideModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PublicSharePage } from './pages/PublicSharePage';
import { 
  KeyRound, 
  LogOut, 
  User, 
  FolderHeart, 
  QrCode, 
  Globe, 
  HelpCircle, 
  ShieldOff, 
  Sun, 
  Moon, 
  Command, 
  CheckCircle2, 
  Lock, 
  Save, 
  X,
  Eye,
  EyeOff,
  Database,
  BarChart2,
  Plus,
  Search,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [userSets, setUserSets] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_sets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [currentSet, setCurrentSet] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_sets');
      const sets = raw ? JSON.parse(raw) : [];
      return sets && sets.length > 0 ? sets[0] : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const currentSetRef = useRef(currentSet);
  currentSetRef.current = currentSet;

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  // Extension sync bridge
  const syncWithExtension = (sets, items) => {
    try {
      const setsData = sets || [];
      const entriesData = items || [];

      window.postMessage({
        type: 'QUICKVAULT_EXTENSION_SYNC',
        sets: setsData,
        entries: entriesData
      }, '*');

      let bridge = document.getElementById('__quickvault_bridge');
      if (!bridge) {
        bridge = document.createElement('div');
        bridge.id = '__quickvault_bridge';
        bridge.style.display = 'none';
        document.body.appendChild(bridge);
      }
      bridge.setAttribute('data-sets', JSON.stringify(setsData));
      bridge.setAttribute('data-entries', JSON.stringify(entriesData));

      localStorage.setItem('quickvault_ext_sets', JSON.stringify(setsData));
      localStorage.setItem('quickvault_ext_entries', JSON.stringify(entriesData));
    } catch {
      // safe fallback
    }
  };

  // Theme state
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

  // ⚡ Global Alt + 1..3 & Ctrl + K hotkeys
  useEffect(() => {
    const handleKeyDown = async (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || activeEl?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && !isTyping && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const hotkeyIndex = parseInt(e.key, 10) - 1;
        const currentEntries = entriesRef.current;
        if (currentEntries && currentEntries[hotkeyIndex]) {
          const target = currentEntries[hotkeyIndex];
          try {
            await navigator.clipboard.writeText(target.value);
            setToastMessage(`⚡ Copied "${target.label}" via Alt + ${e.key}!`);
            setTimeout(() => setToastMessage(null), 2500);
          } catch (err) {
            console.error('Failed hotkey copy', err);
          }
        }
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
        initSetsAndData(currentSession.user.id, false);
      } else {
        setLoading(false);
      }
    });

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
        initSetsAndData(newSession.user.id, false);
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
      const defaultSet = await supabase.sets.createDefaultSet(userId);
      const sets = await supabase.sets.fetchUserSets(userId);
      const safeSets = sets && sets.length > 0 ? sets : (defaultSet ? [defaultSet] : []);
      setUserSets(safeSets);

      const activeSet = currentSetRef.current && safeSets.some(s => s.id === currentSetRef.current.id)
        ? safeSets.find(s => s.id === currentSetRef.current.id)
        : (safeSets[0] || defaultSet || null);

      setCurrentSet(activeSet);

      if (activeSet) {
        const data = await supabase.entries.fetchEntries(activeSet.id, userId);
        setEntries(data || []);
        syncWithExtension(safeSets, data || []);
      }
    } catch (err) {
      console.error('Failed to initialize sets and data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSet = async (set) => {
    setCurrentSet(set);
    if (session && set?.id) {
      try {
        const data = await supabase.entries.fetchEntries(set.id, session.user.id);
        setEntries(data || []);
        syncWithExtension(userSets, data || []);
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
      setShowPassword(false);
      setToastMessage('🎉 Password updated successfully! Use it on your next login.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert('Failed to update password: ' + err.message);
    }
  };

  const totalCopies = entries.reduce((acc, curr) => acc + (curr.copy_count || 0), 0);

  if (publicSlug) {
    return <PublicSharePage slug={publicSlug} />;
  }

  return (
    <div>
      {/* Top Navbar */}
      <nav className="navbar-sticky">
        <div className="nav-container">
          <div 
            className="brand-logo-btn" 
            onClick={() => {
              if (window.location.pathname !== '/') {
                window.location.href = '/';
              }
            }}
          >
            <div className="brand-icon-box">
              <KeyRound size={20} />
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
                <Command size={14} color="var(--coral-accent)" />
                <span><kbd className="kbd-badge">Ctrl K</kbd></span>
              </button>
            )}

            {/* Backup & Restore Trigger */}
            {session && (
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="nav-btn-icon"
                title="Vault Backup & Restore (JSON / CSV)"
              >
                <Database size={14} color="var(--coral-accent)" />
                <span>Backup</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="nav-btn-icon"
            >
              <HelpCircle size={15} color="var(--coral-accent)" />
              <span>Guide</span>
            </button>

            {session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="nav-btn-icon"
                  title="Update Password"
                >
                  <Lock size={13} color="var(--coral-accent)" />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="nav-btn-icon"
                  title="Log Out"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
              </div>
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
            {/* UNIFIED COMMAND DECK: Profiles + Quick Actions + Search in One Clean Card */}
            <div className="command-deck-container">
              {/* Row 1: Profile Selector Tabs (Left) & Quick Action Buttons (Right) */}
              <div className="deck-top-row">
                <SetSwitcher
                  sets={userSets}
                  currentSet={currentSet}
                  onSelectSet={handleSelectSet}
                  onCreateSet={handleCreateSet}
                  onRenameSet={handleRenameSet}
                  onDeleteSet={handleDeleteSet}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn-secondary-action"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
                  >
                    <QrCode size={16} color="var(--coral-accent)" />
                    <span>{currentSet?.is_public ? 'QR & Share' : 'Make Shareable'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(null);
                      setIsModalOpen(true);
                    }}
                    className="btn-primary-action"
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} />
                    <span>Add Entry</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Active Profile Meta, Status Pill, and Analytics Metrics */}
              <div className="deck-meta-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {currentSet?.name || 'Personal'} Vault
                  </strong>

                  {/* Public Status Pill */}
                  {currentSet?.is_public ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
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
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Stop public sharing immediately"
                      >
                        <ShieldOff size={11} />
                        <span>Stop</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-light)',
                      background: 'var(--surface-elevated)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      🔒 Private Profile
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Live Analytics Pill */}
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }} title="Total public views and link copies">
                    <BarChart2 size={13} color="var(--coral-accent)" />
                    <span>{currentSet?.view_count || 0} Views · {totalCopies} Copies</span>
                  </span>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 }}>
                    <kbd className="kbd-badge" style={{ fontSize: '0.65rem' }}>Alt 1..3</kbd> copies top links
                  </span>
                </div>
              </div>

              {/* Row 3: Integrated Search Bar */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search 
                  size={16} 
                  color="var(--text-light)" 
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
                />
                <input
                  type="text"
                  className="modern-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '5rem', height: '42px', fontSize: '0.88rem' }}
                  placeholder="Search your links, handles, or press Ctrl + K..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Clear Search & Counter badge */}
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontWeight: 700 }}>
                    {entries.length} Items
                  </span>
                </div>
              </div>
            </div>

            {/* Vault List for current set with breathing room */}
            <VaultList 
              session={session} 
              currentSet={currentSet} 
              availableSets={userSets}
              searchQuery={searchQuery}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              editingEntry={editingEntry}
              setEditingEntry={setEditingEntry}
              onEntriesLoaded={(loadedEntries) => {
                setEntries(loadedEntries || []);
                syncWithExtension(userSets, loadedEntries || []);
              }}
            />

            {/* Share / QR Modal */}
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              set={currentSet}
              onToggleShare={handleToggleShare}
            />

            {/* Backup & Restore Modal */}
            <BackupModal
              isOpen={isBackupModalOpen}
              onClose={() => setIsBackupModalOpen(false)}
              userId={session?.user?.id}
              onBackupRestored={() => initSetsAndData(session?.user?.id, false)}
            />

            {/* Command Palette Spotlight Modal */}
            <CommandPaletteModal
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              entries={entries}
              onCopyItem={handleCommandPaletteCopy}
            />

            {/* Set New Password Modal */}
            {isResetPasswordModalOpen && (
              <div className="modal-overlay-blur" onClick={() => setIsResetPasswordModalOpen(false)}>
                <div 
                  className="modal-dialog-box" 
                  style={{ maxWidth: '440px', borderRadius: '22px' }}
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
                        <Lock size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                          Set New Password
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                          Update your login password
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsResetPasswordModalOpen(false)}
                      className="icon-action-button"
                      style={{ padding: '0.4rem' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNewPassword} style={{ padding: '1.4rem 1.6rem' }}>
                    <div style={{ marginBottom: '1.35rem' }}>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                        Enter New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoFocus
                          className="modern-input"
                          style={{ paddingRight: '2.5rem' }}
                          placeholder="At least 6 characters"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-light)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                          }}
                          title={showPassword ? 'Password is visible (click to hide)' : 'Password is hidden (click to show)'}
                        >
                          {showPassword ? <Eye size={16} color="var(--coral-accent)" /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setIsResetPasswordModalOpen(false)}
                        className="btn-secondary-action"
                        style={{ padding: '0.6rem 1.1rem', fontSize: '0.86rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-action"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem' }}
                      >
                        <Save size={15} />
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
