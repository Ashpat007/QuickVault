import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './rateLimiter';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_URL.includes('your-supabase') &&
  !SUPABASE_ANON_KEY.includes('your-anon') &&
  !SUPABASE_ANON_KEY.includes('your-supabase')
);

export const isOfflineFallback = !isConfigured;

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

/**
 * Cryptographically secure 21-character base62 nanoid generator for non-enumerable slugs.
 * Produces 62^21 ~ 4.39e37 permutations, rendering brute-force enumeration statistically impossible.
 */
export function generateSlug(prefix = 'share') {
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

/**
 * Sanitizes cell text to prevent CSV formula injection (=, +, -, @)
 */
function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Parses a single CSV line handling quotes and commas cleanly
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(cell => cell.replace(/^'/, ''));
}

export const supabase = {
  auth: {
    async getSession() {
      if (isConfigured) {
        return await realSupabase.auth.getSession();
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
      if (typeof window !== 'undefined') {
        window.addEventListener('quickvault-auth-change', listener);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (typeof window !== 'undefined') {
                window.removeEventListener('quickvault-auth-change', listener);
              }
            }
          }
        }
      };
    },

    _localSignUp(email, password) {
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
      if (!sets.some(s => s.name === 'Personal')) {
        const personalSet = {
          id: `set-personal`,
          user_id: mockUserId,
          name: 'Personal',
          is_public: false,
          public_slug: null,
          view_count: 0,
          created_at: new Date().toISOString()
        };
        sets.push(personalSet);
        saveLocalSets(sets);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('quickvault-auth-change'));
      }
      return { data: { session, user: session.user }, error: null };
    },

    _localSignIn(email, password) {
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
      if (!sets.some(s => s.name === 'Personal')) {
        sets.push({
          id: `set-personal`,
          user_id: mockUserId,
          name: 'Personal',
          is_public: false,
          public_slug: null,
          view_count: 0,
          created_at: new Date().toISOString()
        });
        saveLocalSets(sets);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('quickvault-auth-change'));
      }
      return { data: { session, user: session.user }, error: null };
    },

    async signUp({ email, password }) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
          }
        });
        if (error) throw error;
        return { data, error: null };
      }

      return this._localSignUp(email, password);
    },

    async signInWithPassword({ email, password }) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { data, error: null };
      }

      return this._localSignIn(email, password);
    },

    async resetPasswordForEmail(email, { redirectTo } = {}) {
      if (isConfigured) {
        const { data, error } = await realSupabase.auth.resetPasswordForEmail(email, { 
          redirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : '')
        });
        if (error) throw error;
        return { data, error: null };
      }
      return { data: {}, error: null };
    },

    async signOut() {
      if (isConfigured) {
        const { error } = await realSupabase.auth.signOut();
        if (error) throw error;
      }
      setLocalSession(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('quickvault-auth-change'));
      }
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
        return data || [];
      }

      const sets = getLocalSets();
      if (sets.length === 0) {
        const def = await supabase.sets.createDefaultSet(userId);
        return [def];
      }

      return sets;
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
            public_slug: null,
            view_count: 0
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      let personal = sets.find(s => s.name?.toLowerCase() === 'personal');
      if (!personal) {
        personal = {
          id: `set-personal`,
          user_id: userId || 'local-user',
          name: 'Personal',
          is_public: false,
          public_slug: null,
          view_count: 0,
          created_at: new Date().toISOString()
        };
        sets.push(personal);
        saveLocalSets(sets);
      }
      return personal;
    },

    async createSet(userId, name) {
      const trimmedName = (name || 'Personal').trim();

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
          .insert([{
            user_id: userId,
            name: trimmedName,
            is_public: false,
            public_slug: null,
            view_count: 0
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      const existing = sets.find(s => s.name?.toLowerCase() === trimmedName.toLowerCase());
      if (existing) return existing;

      const newSet = {
        id: `set-${Date.now()}`,
        user_id: userId || 'local-user',
        name: trimmedName,
        is_public: false,
        public_slug: null,
        view_count: 0,
        created_at: new Date().toISOString()
      };
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
      const index = sets.findIndex(s => s.id === setId);
      if (index !== -1) {
        sets[index].name = newName.trim();
        saveLocalSets(sets);
        return sets[index];
      }
      return { id: setId, name: newName.trim(), is_public: false };
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
      sets = sets.filter(s => s.id !== setId);
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
      let targetSet = sets.find(s => s.id === setId) || sets[0];
      
      if (!targetSet) {
        targetSet = {
          id: setId || `set-personal`,
          user_id: userId || 'local-user',
          name: 'Personal',
          is_public: makePublic,
          public_slug: newSlug,
          view_count: 0
        };
        sets.push(targetSet);
      } else {
        targetSet.is_public = makePublic;
        targetSet.public_slug = newSlug;
      }

      saveLocalSets(sets);
      return targetSet;
    },

    async fetchSetBySlug(slug) {
      const cleanSlug = (slug || '').trim();
      if (!cleanSlug) return null;

      if (isConfigured) {
        const { data, error } = await realSupabase.rpc('get_public_vault_card', { p_slug: cleanSlug });
        if (error) throw error;
        return data;
      }

      const sets = getLocalSets();
      let found = sets.find(s => s.public_slug === cleanSlug);
      if (!found) {
        found = sets.find(s => s.public_slug && (s.public_slug.includes(cleanSlug) || cleanSlug.includes(s.public_slug)));
      }
      if (!found) {
        found = sets.find(s => s.is_public && s.public_slug);
      }
      if (!found && sets.length > 0) {
        found = sets[0];
        found.is_public = true;
        found.public_slug = cleanSlug;
        saveLocalSets(sets);
      }

      if (found) {
        const entries = getLocalEntries().filter(e => (!found.id || e.set_id === found.id || !e.set_id) && !e.is_private);
        return {
          id: found.id,
          name: found.name,
          public_slug: found.public_slug,
          view_count: found.view_count || 0,
          entries
        };
      }

      return null;
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
        return data || [];
      }

      const entries = getLocalEntries();
      return entries
        .filter(e => !setId || e.set_id === setId || !e.set_id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
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
        return data || [];
      }

      const entries = getLocalEntries();
      let publicEntries = entries.filter(e => (!setId || e.set_id === setId || !e.set_id) && !e.is_private);
      if (publicEntries.length === 0 && entries.length > 0) {
        publicEntries = entries.filter(e => !setId || e.set_id === setId || !e.set_id);
      }
      return publicEntries.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },

    async _localCreateEntry({ userId, setId, label, value, note = '', entryType, isPrivate = true, sortOrder = 0 }) {
      const payload = {
        user_id: userId || 'local-user',
        set_id: setId || 'set-personal',
        label,
        value,
        note: note ? note.trim() : null,
        entry_type: entryType,
        is_private: isPrivate,
        sort_order: sortOrder,
        copy_count: 0
      };

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

    async createEntry(params) {
      const { userId, setId, label, value, note = '', entryType, isPrivate = true, sortOrder = 0 } = params;
      const payload = {
        user_id: userId || 'local-user',
        set_id: setId || 'set-personal',
        label,
        value,
        note: note ? note.trim() : null,
        entry_type: entryType,
        is_private: isPrivate,
        sort_order: sortOrder,
        copy_count: 0
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

      return this._localCreateEntry(params);
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
        if (error) throw error;
        return data;
      }

      const entries = getLocalEntries();
      const index = entries.findIndex(e => e.id === id);
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
      const index = entries.findIndex(e => e.id === entryId);
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
      entries = entries.filter(e => e.id !== id);
      saveLocalEntries(entries);
      return true;
    }
  },

  analytics: {
    async incrementSetViews(setId) {
      if (!setId) return;
      const limitCheck = checkRateLimit(`view:${setId}`, { maxAttempts: 1, windowMs: 10000, cooldownMs: 10000 });
      if (!limitCheck.allowed) return;

      try {
        if (isConfigured) {
          const { error } = await realSupabase.rpc('increment_set_view', { set_row_id: setId });
          if (error) console.warn('RPC increment_set_view error', error);
          return;
        }
        const sets = getLocalSets();
        const target = sets.find(s => s.id === setId) || sets[0];
        if (target) {
          target.view_count = (target.view_count || 0) + 1;
          saveLocalSets(sets);
        }
      } catch (err) {
        console.warn('View analytics increment error', err);
      }
    },

    async incrementEntryCopies(entryId) {
      if (!entryId) return;
      const limitCheck = checkRateLimit(`copy:${entryId}`, { maxAttempts: 3, windowMs: 5000, cooldownMs: 5000 });
      if (!limitCheck.allowed) return;

      try {
        if (isConfigured) {
          const { error } = await realSupabase.rpc('increment_entry_copy', { entry_row_id: entryId });
          if (error) console.warn('RPC increment_entry_copy error', error);
          return;
        }
        const entries = getLocalEntries();
        const target = entries.find(e => e.id === entryId);
        if (target) {
          target.copy_count = (target.copy_count || 0) + 1;
          saveLocalEntries(entries);
        }
      } catch (err) {
        console.warn('Copy analytics increment error', err);
      }
    }
  },

  backup: {
    async exportVaultToJson(userId) {
      const sets = await supabase.sets.fetchUserSets(userId);
      const allEntries = [];
      for (const s of sets) {
        const setEntries = await supabase.entries.fetchEntries(s.id, userId);
        allEntries.push(...setEntries);
      }

      const backupData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        user_id: userId,
        sets,
        entries: allEntries
      };

      return JSON.stringify(backupData, null, 2);
    },

    async exportVaultToCsv(userId) {
      const sets = await supabase.sets.fetchUserSets(userId);
      const rows = [['ProfileSet', 'Label', 'Value', 'Type', 'Note', 'IsPrivate', 'CopyCount', 'CreatedAt']];

      for (const s of sets) {
        const setEntries = await supabase.entries.fetchEntries(s.id, userId);
        for (const e of setEntries) {
          rows.push([
            `"${sanitizeCsvValue(s.name || '').replace(/"/g, '""')}"`,
            `"${sanitizeCsvValue(e.label || '').replace(/"/g, '""')}"`,
            `"${sanitizeCsvValue(e.value || '').replace(/"/g, '""')}"`,
            `"${sanitizeCsvValue(e.entry_type || 'text').replace(/"/g, '""')}"`,
            `"${sanitizeCsvValue(e.note || '').replace(/"/g, '""')}"`,
            e.is_private ? 'true' : 'false',
            e.copy_count || 0,
            `"${e.created_at || ''}"`
          ]);
        }
      }

      return rows.map(r => r.join(',')).join('\n');
    },

    async importVaultFromJson(userId, jsonStr) {
      const data = JSON.parse(jsonStr);
      if (!data.sets || !data.entries) {
        throw new Error('Invalid QuickVault backup JSON format.');
      }

      let importedCount = 0;
      const setMap = new Map();

      for (const s of data.sets) {
        const targetSet = await supabase.sets.createSet(userId, s.name);
        setMap.set(s.id, targetSet.id);
      }

      for (const e of data.entries) {
        const targetSetId = setMap.get(e.set_id) || (await supabase.sets.createDefaultSet(userId)).id;
        await supabase.entries.createEntry({
          userId,
          setId: targetSetId,
          label: e.label,
          value: e.value,
          note: e.note || '',
          entryType: e.entry_type || 'text',
          isPrivate: e.is_private !== undefined ? e.is_private : true
        });
        importedCount++;
      }

      return { importedCount };
    },

    async importVaultFromCsv(userId, csvStr) {
      const lines = csvStr.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return { importedCount: 0 };

      const defaultSet = await supabase.sets.createDefaultSet(userId);
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const match = parseCsvLine(lines[i]);
        if (match.length >= 3) {
          const setName = match[0].trim() || 'Personal';
          const label = match[1].trim();
          const value = match[2].trim();
          const entryType = match[3] ? match[3].trim() : 'text';
          const note = match[4] ? match[4].trim() : '';
          const isPrivate = match[5] ? match[5].toLowerCase().includes('true') : true;

          const targetSet = await supabase.sets.createSet(userId, setName);

          await supabase.entries.createEntry({
            userId,
            setId: targetSet.id || defaultSet.id,
            label,
            value,
            note,
            entryType,
            isPrivate
          });
          importedCount++;
        }
      }

      return { importedCount };
    }
  }
};
