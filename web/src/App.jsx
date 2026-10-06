import React, { useState, useEffect, useRef } from 'react';
import { supabase, realSupabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { VaultList } from './components/VaultList';
import { SetSwitcher } from './components/SetSwitcher';
import { ShareModal } from './components/ShareModal';
import { BackupModal } from './components/BackupModal';
import { UserGuideModal } from './components/UserGuideModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { SmartAutofillModal } from './components/SmartAutofillModal';
import { UserMenu } from './components/UserMenu';
import { Modal } from './components/Modal';
import { PublicSharePage } from './pages/PublicSharePage';
import { 
  KeyRound, 
  QrCode, 
  Globe, 
  ShieldOff, 
  Sun, 
  Moon, 
  Command, 
  CheckCircle2, 
  Lock, 
  Save, 
  BarChart2,
  Plus,
  Search,
  Sparkles
} from 'lucide-react';

export default function App() {
  // 1. Session state with guaranteed localStorage persistence
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem('quickvault_local_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('quickvault_local_session');
      }
    } catch {
      // ignore
    }
  }, [session]);

  // 2. Profile Sets state with guaranteed localStorage persistence
  const [userSets, setUserSets] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_sets');
      return raw ? JSON.parse(raw) : [{ id: 'set-personal', name: 'Personal', is_public: false, public_slug: null, view_count: 0 }];
    } catch {
      return [{ id: 'set-personal', name: 'Personal', is_public: false, public_slug: null, view_count: 0 }];
    }
  });

  const [currentSet, setCurrentSet] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_sets');
      const sets = raw ? JSON.parse(raw) : [];
      return sets && sets.length > 0 ? sets[0] : { id: 'set-personal', name: 'Personal', is_public: false, public_slug: null, view_count: 0 };
    } catch {
      return { id: 'set-personal', name: 'Personal', is_public: false, public_slug: null, view_count: 0 };
    }
  });

  // 3. Vault Entries (Single Source of Truth)
  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem('quickvault_local_entries');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSmartAutofillModalOpen, setIsSmartAutofillModalOpen] = useState(false);
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

  // Global Alt + 1..3 & Ctrl + K & Ctrl + Shift + A hotkeys
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

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsSmartAutofillModalOpen(prev => !prev);
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

  const refreshVaultData = async (activeSet = currentSet, user = session?.user) => {
    const uid = user?.id || 'local-user';
    const setId = activeSet?.id || 'set-personal';
    try {
      const data = await supabase.entries.fetchEntries(setId, uid);
      setEntries(data || []);
      syncWithExtension(userSets, data || []);
    } catch (err) {
      console.warn('Refresh vault data error', err);
    }
  };

  useEffect(() => {
    if (publicSlug) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isSubscribed) return;
      const currentSession = data?.session || session;
      if (currentSession) {
        setSession(currentSession);
        initSetsAndData(currentSession.user.id, false);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Auth session check error', err);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isSubscribed) return;
      if (newSession) {
        setSession(newSession);
        initSetsAndData(newSession.user.id, false);
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
    const uid = session?.user?.id || 'local-user';
    if (set?.id) {
      try {
        const data = await supabase.entries.fetchEntries(set.id, uid);
        setEntries(data || []);
        syncWithExtension(userSets, data || []);
      } catch (err) {
        console.error('Failed to fetch set entries', err);
      }
    }
  };

  const handleCreateSet = async (name) => {
    const uid = session?.user?.id || 'local-user';
    try {
      const newSet = await supabase.sets.createSet(uid, name);
      const updatedSets = await supabase.sets.fetchUserSets(uid);
      setUserSets(updatedSets);
      handleSelectSet(newSet);
      setToastMessage(`Created new profile "${newSet.name}"`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to create set', err);
    }
  };

  const handleRenameSet = async (setId, newName) => {
    const uid = session?.user?.id || 'local-user';
    try {
      const updatedSet = await supabase.sets.renameSet(setId, uid, newName);
      const updatedSets = await supabase.sets.fetchUserSets(uid);
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
    const uid = session?.user?.id || 'local-user';
    try {
      await supabase.sets.deleteSet(setId, uid);
      const updatedSets = await supabase.sets.fetchUserSets(uid);
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
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setSession(null);
    localStorage.removeItem('quickvault_local_session');
  };

  const handleToggleShare = async (makePublic) => {
    if (!currentSet) return;
    const uid = session?.user?.id || 'local-user';
    const updatedSet = await supabase.sets.toggleShareMode(currentSet.id, uid, makePublic);
    setCurrentSet(updatedSet);
    const updatedSets = await supabase.sets.fetchUserSets(uid);
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
            {/* Smart Autofill Trigger */}
            {session && (
              <button
                type="button"
                onClick={() => setIsSmartAutofillModalOpen(true)}
                className="nav-btn-icon"
                title="Smart Form Autofill Assistant (Ctrl + Shift + A)"
                style={{ background: 'rgba(217, 74, 0, 0.12)', border: '1px solid rgba(217, 74, 0, 0.3)' }}
              >
                <Sparkles size={14} color="#D94A00" />
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Smart Autofill</span>
              </button>
            )}

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

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Streamlined User Profile Menu */}
            {session && (
              <UserMenu
                session={session}
                onOpenBackup={() => setIsBackupModalOpen(true)}
                onOpenPasswordReset={() => setIsResetPasswordModalOpen(true)}
                onOpenGuide={() => setIsGuideModalOpen(true)}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            Initializing QuickVault...
          </div>
        ) : !session ? (
          <Auth onAuthSuccess={(newSession) => {
            setSession(newSession);
            localStorage.setItem('quickvault_local_session', JSON.stringify(newSession));
            initSetsAndData(newSession?.user?.id || 'local-user', false);
          }} />
        ) : (
          <div>
            {/* UNIFIED COMMAND DECK */}
            <div className="command-deck-container">
              {/* Row 1: Profile Selector Tabs & Main Actions */}
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

              {/* Row 2: Integrated Search Bar */}
              <div style={{ position: 'relative', width: '100%', marginTop: '0.5rem' }}>
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

              {/* Footer Meta Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentSet?.name || 'Personal'} Vault
                  </span>
                  {currentSet?.is_public ? (
                    <span 
                      onClick={() => setIsShareModalOpen(true)}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#20BF6B',
                        background: 'rgba(32, 191, 107, 0.14)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                    >
                      <Globe size={11} /> PUBLIC
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>
                      🔒 Private
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.74rem', color: 'var(--text-light)' }}>
                  <BarChart2 size={13} color="var(--coral-accent)" />
                  <span>{currentSet?.view_count || 0} Views · {totalCopies} Copies</span>
                </div>
              </div>
            </div>

            {/* Vault List */}
            <VaultList 
              session={session} 
              currentSet={currentSet} 
              availableSets={userSets}
              entries={entries}
              searchQuery={searchQuery}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              editingEntry={editingEntry}
              setEditingEntry={setEditingEntry}
              onRefreshEntries={() => refreshVaultData(currentSet, session?.user)}
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

            {/* Smart Form Autofill Studio Modal */}
            <SmartAutofillModal
              isOpen={isSmartAutofillModalOpen}
              onClose={() => setIsSmartAutofillModalOpen(false)}
              entries={entries}
              currentSetName={currentSet?.name || 'Personal'}
              onOpenAddEntry={() => {
                setEditingEntry(null);
                setIsModalOpen(true);
              }}
            />

            {/* Set New Password Modal */}
            {isResetPasswordModalOpen && (
              <Modal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                title="Set New Password"
                subtitle="Update your login password"
                maxWidth="440px"
              >
                <form onSubmit={handleSaveNewPassword}>
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
              </Modal>
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
