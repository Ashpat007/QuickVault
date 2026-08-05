import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

// Real Supabase client instance (used when .env credentials exist)
export const realSupabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// LocalStorage Mock fallback for out-of-the-box local testing & validation
const LOCAL_STORAGE_KEY_SESSION = 'quickvault_demo_session';
const LOCAL_STORAGE_KEY_SETS = 'quickvault_demo_sets';
const LOCAL_STORAGE_KEY_ENTRIES = 'quickvault_demo_entries';

const getLocalSession = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setLocalSession = (session) => {
  if (session) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
  }
};

const getLocalSets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalSets = (sets) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETS, JSON.stringify(sets));
};

const getLocalEntries = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalEntries = (entries) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_ENTRIES, JSON.stringify(entries));
};

function generateSlug(prefix = 'vault') {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${randomStr}`;
}

export const supabase = {
  isLocalDemo: !isConfigured,

  auth: {
    async getSession() {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.getSession();
        if (error) throw error;
        return { data };
      }
      const session = getLocalSession();
      return { data: { session } };
    },

    onAuthStateChange(callback) {
      if (isConfigured) {
        return realSupabase.auth.onAuthStateChange(callback);
      }
      const handler = () => {
        const session = getLocalSession();
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      };
      window.addEventListener('quickvault-auth-change', handler);
      return {
        data: {
          subscription: {
            unsubscribe: () => window.removeEventListener('quickvault-auth-change', handler)
          }
        }
      };
    },

    async signUp({ email, password }) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.signUp({ email, password });
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

    async signOut() {
      if (isConfigured) {
        const { error } = await realSupabase.auth.signOut();
        if (error) throw error;
        return { error: null };
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
        return data;
      }
      const sets = getLocalSets().filter(s => s.user_id === userId);
      return sets;
    },

    async createDefaultSet(userId) {
      const defaultSet = {
        user_id: userId,
        name: 'Personal',
        is_public: false,
        public_slug: null
      };

      if (isConfigured) {
        const { data: existing } = await realSupabase
          .from('sets')
          .select('*')
          .eq('user_id', userId)
          .eq('name', 'Personal');

        if (existing && existing.length > 0) return existing[0];

        const { data, error } = await realSupabase
          .from('sets')
          .insert([defaultSet])
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      const existing = sets.find(s => s.user_id === userId && s.name === 'Personal');
      if (existing) return existing;

      const newSet = { ...defaultSet, id: `set-${Date.now()}`, created_at: new Date().toISOString() };
      sets.push(newSet);
      saveLocalSets(sets);
      return newSet;
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
      if (index === -1) throw new Error('Set not found or permission denied');

      sets[index].is_public = makePublic;
      sets[index].public_slug = newSlug;
      saveLocalSets(sets);
      return sets[index];
    },

    async fetchPublicSetBySlug(slug) {
      if (!slug) return null;

      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('sets')
          .select('*')
          .eq('public_slug', slug)
          .eq('is_public', true)
          .maybeSingle();
        if (error || !data) return null;
        return data;
      }

      const sets = getLocalSets();
      const found = sets.find(s => s.public_slug === slug && s.is_public === true);
      return found || null;
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
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });
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
          .or('is_private.is.null,is_private.eq.false')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries()
        .filter(e => e.set_id === setId && !e.is_private)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return entries;
    },

    async createEntry({ userId, setId, label, value, entryType, isPrivate = false, sortOrder = 0 }) {
      const payload = {
        user_id: userId,
        set_id: setId,
        label,
        value,
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
        if (error) throw error;
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

    async updateEntry(id, userId, updates) {
      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries();
      const index = entries.findIndex(e => e.id === id && e.user_id === userId);
      if (index === -1) throw new Error('Entry not found or access denied');

      entries[index] = { ...entries[index], ...updates };
      saveLocalEntries(entries);
      return entries[index];
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
    },

    async updateSortOrders(userId, orderedEntries) {
      if (isConfigured) {
        for (let i = 0; i < orderedEntries.length; i++) {
          const item = orderedEntries[i];
          await realSupabase
            .from('entries')
            .update({ sort_order: i })
            .eq('id', item.id)
            .eq('user_id', userId);
        }
        return true;
      }

      const entries = getLocalEntries();
      orderedEntries.forEach((item, index) => {
        const found = entries.find(e => e.id === item.id && e.user_id === userId);
        if (found) {
          found.sort_order = index;
        }
      });
      saveLocalEntries(entries);
      return true;
    }
  }
};
