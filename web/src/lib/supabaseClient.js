import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

export const realSupabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// LocalStorage helpers for offline-first fallback
const STORAGE_KEYS = {
  SESSION: 'quickvault_local_session',
  SETS: 'quickvault_local_sets',
  ENTRIES: 'quickvault_local_entries'
};

function getLocalSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalSession(session) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch {
    // ignore
  }
}

function getLocalSets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSets(sets) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
  } catch {
    // ignore
  }
}

function getLocalEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

// Cryptographically secure 21-character nanoid generator for non-enumerable slugs
function generateSlug(prefix = 'share') {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randStr = '';
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || window.msCrypto) : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomBytes = new Uint8Array(21);
    cryptoObj.getRandomValues(randomBytes);
    for (let i = 0; i < 21; i++) {
      randStr += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 21; i++) {
      randStr += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${prefix}-${randStr}`;
}

export const supabase = {
  auth: {
    async getSession() {
      if (isConfigured) {
        return realSupabase.auth.getSession();
      }
      return { data: { session: getLocalSession() }, error: null };
    },

    onAuthStateChange(callback) {
      if (isConfigured) {
        return realSupabase.auth.onAuthStateChange(callback);
      }
      const listener = () => {
        callback('SIGNED_IN', getLocalSession());
      };
      window.addEventListener('quickvault-auth-change', listener);
      return {
        data: {
          subscription: {
            unsubscribe: () => window.removeEventListener('quickvault-auth-change', listener)
          }
        }
      };
    },

    async signUp({ email, password }) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) return { data: null, error };
        return { data, error: null };
      }

      if (!email || !password || password.length < 6) {
        return { data: null, error: new Error('Password must be at least 6 characters.') };
      }

      const mockUserId = `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const session = {
        user: { id: mockUserId, email },
        access_token: `demo-token-${Date.now()}`
      };
      setLocalSession(session);

      const sets = getLocalSets();
      if (!sets.some(s => s.user_id === mockUserId && s.name === 'Personal')) {
        const personalSet = {
          id: `set-${Date.now()}`,
          user_id: mockUserId,
          name: 'Personal',
          is_public: false,
          public_slug: null,
          created_at: new Date().toISOString()
        };
        sets.push(personalSet);
        saveLocalSets(sets);
      }

      window.dispatchEvent(new Event('quickvault-auth-change'));
      return { data: { session, user: session.user }, error: null };
    },

    async signInWithPassword({ email, password }) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.signInWithPassword({ email, password });
        if (error) return { data: null, error };
        return { data, error: null };
      }

      if (!email || !password) {
        return { data: null, error: new Error('Please enter both email and password.') };
      }

      const mockUserId = `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const session = {
        user: { id: mockUserId, email },
        access_token: `demo-token-${Date.now()}`
      };
      setLocalSession(session);

      const sets = getLocalSets();
      if (!sets.some(s => s.user_id === mockUserId && s.name === 'Personal')) {
        sets.push({
          id: `set-${Date.now()}`,
          user_id: mockUserId,
          name: 'Personal',
          is_public: false,
          public_slug: null,
          created_at: new Date().toISOString()
        });
        saveLocalSets(sets);
      }

      window.dispatchEvent(new Event('quickvault-auth-change'));
      return { data: { session, user: session.user }, error: null };
    },

    async resetPasswordForEmail(email, { redirectTo } = {}) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.resetPasswordForEmail(email, { 
          redirectTo: redirectTo || window.location.origin 
        });
        if (error) return { data: null, error };
        return { data, error: null };
      }
      return { data: {}, error: null };
    },

    async signOut() {
      if (isConfigured) {
        await realSupabase.auth.signOut();
      }
      setLocalSession(null);
      window.dispatchEvent(new Event('quickvault-auth-change'));
      return { error: null };
    }
  },

  sets: {
    async fetchUserSets(userId) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('sets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        
        // Deduplicate sets by case-insensitive name
        const seenNames = new Set();
        const deduplicated = (data || []).filter(set => {
          const lower = set.name.toLowerCase();
          if (seenNames.has(lower)) return false;
          seenNames.add(lower);
          return true;
        });

        return deduplicated;
      }

      const sets = getLocalSets().filter(s => s.user_id === userId);
      const seenNames = new Set();
      return sets.filter(set => {
        const lower = set.name.toLowerCase();
        if (seenNames.has(lower)) return false;
        seenNames.add(lower);
        return true;
      });
    },

    async createDefaultSet(userId) {
      if (isConfigured) {
        const { data: existing } = await realSupabase
          .from('sets')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', 'Personal');

        if (existing && existing.length > 0) {
          return existing[0];
        }

        const { data, error } = await realSupabase
          .from('sets')
          .insert([{
            user_id: userId,
            name: 'Personal',
            is_public: false,
            public_slug: null
          }])
          .select()
          .single();

        if (error) {
          console.warn('Default set check', error.message);
          return null;
        }
        return data;
      }

      const sets = getLocalSets();
      let personal = sets.find(s => s.user_id === userId && s.name.toLowerCase() === 'personal');
      if (!personal) {
        personal = {
          id: `set-${Date.now()}`,
          user_id: userId,
          name: 'Personal',
          is_public: false,
          public_slug: null,
          created_at: new Date().toISOString()
        };
        sets.push(personal);
        saveLocalSets(sets);
      }
      return personal;
    },

    async createSet(userId, name) {
      const trimmedName = name.trim();
      const payload = {
        user_id: userId,
        name: trimmedName,
        is_public: false,
        public_slug: null
      };

      if (isConfigured) {
        const { data: existing } = await realSupabase
          .from('sets')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', trimmedName);

        if (existing && existing.length > 0) {
          return existing[0];
        }

        const { data, error } = await realSupabase
          .from('sets')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      const existing = sets.find(s => s.user_id === userId && s.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) return existing;

      const newSet = { ...payload, id: `set-${Date.now()}`, created_at: new Date().toISOString() };
      sets.push(newSet);
      saveLocalSets(sets);
      return newSet;
    },

    async renameSet(setId, userId, newName) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('sets')
          .update({ name: newName.trim() })
          .eq('id', setId)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      const index = sets.findIndex(s => s.id === setId && s.user_id === userId);
      if (index === -1) throw new Error('Set not found');
      sets[index].name = newName.trim();
      saveLocalSets(sets);
      return sets[index];
    },

    async deleteSet(setId, userId) {
      if (isConfigured) {
        const { error } = await realSupabase
          .from('sets')
          .delete()
          .eq('id', setId)
          .eq('user_id', userId);
        if (error) throw error;
        return true;
      }

      let sets = getLocalSets();
      sets = sets.filter(s => !(s.id === setId && s.user_id === userId));
      saveLocalSets(sets);

      let entries = getLocalEntries();
      entries = entries.filter(e => e.set_id !== setId);
      saveLocalEntries(entries);

      return true;
    },

    async toggleShareMode(setId, userId, makePublic) {
      const newSlug = makePublic ? generateSlug('share') : null;

      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('sets')
          .update({
            is_public: makePublic,
            public_slug: newSlug
          })
          .eq('id', setId)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      const index = sets.findIndex(s => s.id === setId && s.user_id === userId);
      if (index === -1) throw new Error('Set not found');

      sets[index].is_public = makePublic;
      sets[index].public_slug = newSlug;
      saveLocalSets(sets);
      return sets[index];
    },

    async fetchSetBySlug(slug) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('sets')
          .select('*')
          .eq('public_slug', slug)
          .eq('is_public', true)
          .maybeSingle();

        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      return sets.find(s => s.public_slug === slug && s.is_public) || null;
    }
  },

  entries: {
    async fetchEntries(setId, userId) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .select('*')
          .eq('set_id', setId)
          .eq('user_id', userId)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries()
        .filter(e => e.set_id === setId && e.user_id === userId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return entries;
    },

    async fetchPublicEntries(setId) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .select('*')
          .eq('set_id', setId)
          .eq('is_private', false)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries()
        .filter(e => e.set_id === setId && !e.is_private)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return entries;
    },

    // P0 Security Fix: Default isPrivate to true on every new entry
    async createEntry({ userId, setId, label, value, note = '', entryType, isPrivate = true, sortOrder = 0 }) {
      const payload = {
        user_id: userId,
        set_id: setId,
        label,
        value,
        note: note ? note.trim() : null,
        entry_type: entryType,
        is_private: isPrivate,
        sort_order: sortOrder
      };

      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .insert([payload])
          .select()
          .single();

        if (error) {
          // Explicit warning on missing remote schema column instead of silent data loss
          if (error.message && error.message.includes("Could not find the 'note' column")) {
            console.warn('[QuickVault Schema Warning] Remote Supabase database is missing the "note" column. Please execute schema migration.');
            window.dispatchEvent(new CustomEvent('quickvault-note-sync-warning', {
              detail: 'Notice: Entry saved, but your remote database schema is missing the "note" column. Please run schema.sql migration.'
            }));

            delete payload.note;
            const { data: retryData, error: retryError } = await realSupabase
              .from('entries')
              .insert([payload])
              .select()
              .single();
            if (retryError) throw retryError;
            return retryData;
          }
          throw error;
        }
        return data;
      }

      const entries = getLocalEntries();
      const newEntry = {
        ...payload,
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString()
      };
      entries.push(newEntry);
      saveLocalEntries(entries);
      return newEntry;
    },

    async updateEntry({ id, userId, label, value, note = '', entryType, isPrivate = true }) {
      const payload = {
        label,
        value,
        note: note ? note.trim() : null,
        entry_type: entryType,
        is_private: isPrivate
      };

      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          if (error.message && error.message.includes("Could not find the 'note' column")) {
            console.warn('[QuickVault Schema Warning] Remote Supabase database is missing the "note" column.');
            delete payload.note;
            const { data: retryData, error: retryError } = await realSupabase
              .from('entries')
              .update(payload)
              .eq('id', id)
              .eq('user_id', userId)
              .select()
              .single();
            if (retryError) throw retryError;
            return retryData;
          }
          throw error;
        }
        return data;
      }

      const entries = getLocalEntries();
      const index = entries.findIndex(e => e.id === id && e.user_id === userId);
      if (index === -1) throw new Error('Entry not found');

      entries[index] = { ...entries[index], ...payload };
      saveLocalEntries(entries);
      return entries[index];
    },

    async moveEntryToSet(entryId, userId, targetSetId) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .update({ set_id: targetSetId })
          .eq('id', entryId)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries();
      const index = entries.findIndex(e => e.id === entryId && e.user_id === userId);
      if (index === -1) throw new Error('Entry not found');
      entries[index].set_id = targetSetId;
      saveLocalEntries(entries);
      return entries[index];
    },

    async reorderEntries(userId, reorderedEntries) {
      if (isConfigured) {
        const updates = reorderedEntries.map((entry, index) => ({
          id: entry.id,
          user_id: userId,
          set_id: entry.set_id,
          label: entry.label,
          value: entry.value,
          note: entry.note || null,
          entry_type: entry.entry_type,
          is_private: entry.is_private,
          sort_order: index
        }));

        const { error } = await realSupabase
          .from('entries')
          .upsert(updates, { onConflict: 'id' });
        if (error) throw error;
        return true;
      }

      const localEntries = getLocalEntries();
      reorderedEntries.forEach((reordered, index) => {
        const found = localEntries.find(e => e.id === reordered.id);
        if (found) {
          found.sort_order = index;
        }
      });
      saveLocalEntries(localEntries);
      return true;
    },

    async deleteEntry(id, userId) {
      if (isConfigured) {
        const { error } = await realSupabase
          .from('entries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return true;
      }

      let entries = getLocalEntries();
      entries = entries.filter(e => !(e.id === id && e.user_id === userId));
      saveLocalEntries(entries);
      return true;
    }
  }
};
