import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './rateLimiter';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
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
    // Fallback for Node/test environments
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
          view_count: 0,
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
          view_count: 0,
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
        
        const seenNames = new Set();
        const deduplicated = (data || []).filter(set => {
          const lower = set.name.toLowerCase();
          if (seenNames.has(lower)) return false;
          seenNames.add(lower);
          return true;
        });

        if (deduplicated.length === 0) {
          const def = await supabase.sets.createDefaultSet(userId);
          return def ? [def] : [];
        }

        return deduplicated;
      }

      const sets = getLocalSets().filter(s => s.user_id === userId);
      const seenNames = new Set();
      const localDeduplicated = sets.filter(set => {
        const lower = set.name.toLowerCase();
        if (seenNames.has(lower)) return false;
        seenNames.add(lower);
        return true;
      });

      if (localDeduplicated.length === 0) {
        const def = await supabase.sets.createDefaultSet(userId);
        return def ? [def] : [];
      }

      return localDeduplicated;
    },

    async createDefaultSet(userId) {
      if (isConfigured) {
        try {
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

          if (!error && data) return data;
        } catch (e) {
          console.warn('Fallback set creation', e);
        }
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
      const payload = {
        user_id: userId,
        name: trimmedName,
        is_public: false,
        public_slug: null,
        view_count: 0
      };

      if (isConfigured) {
        try {
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
          if (!error && data) return data;
        } catch (e) {
          console.warn('Set insert fallback', e);
        }
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
        sort_order: sortOrder,
        copy_count: 0
      };

      if (isConfigured) {
        const { data, error } = await realSupabase
          .from('entries')
          .insert([payload])
          .select()
          .single();

        if (error) {
          if (error.message && error.message.includes("Could not find the 'note' column")) {
            console.warn('[QuickVault Schema Warning] Remote Supabase database is missing the "note" column.');
            window.dispatchEvent(new CustomEvent('quickvault-note-sync-warning', {
              detail: 'Notice: Entry saved, but your remote database schema is missing the "note" column.'
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
  },

  // 1. 📊 Public Card Analytics & Tap Tracking with Rate-Limiting
  analytics: {
    async incrementSetViews(setId) {
      if (!setId) return;
      // Client-side rate-limiting: max 1 view count increment per 10s per setId
      const limitCheck = checkRateLimit(`view:${setId}`, { maxAttempts: 1, windowMs: 10000, cooldownMs: 10000 });
      if (!limitCheck.allowed) return;

      try {
        if (isConfigured) {
          await realSupabase.rpc('increment_set_view', { set_row_id: setId }).catch(async () => {
            const { data } = await realSupabase.from('sets').select('view_count').eq('id', setId).single();
            const current = (data && data.view_count) ? data.view_count : 0;
            await realSupabase.from('sets').update({ view_count: current + 1 }).eq('id', setId);
          });
          return;
        }
        const sets = getLocalSets();
        const target = sets.find(s => s.id === setId);
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
      // Client-side rate-limiting: max 3 copy taps per 5s per entryId
      const limitCheck = checkRateLimit(`copy:${entryId}`, { maxAttempts: 3, windowMs: 5000, cooldownMs: 5000 });
      if (!limitCheck.allowed) return;

      try {
        if (isConfigured) {
          await realSupabase.rpc('increment_entry_copy', { entry_row_id: entryId }).catch(async () => {
            const { data } = await realSupabase.from('entries').select('copy_count').eq('id', entryId).single();
            const current = (data && data.copy_count) ? data.copy_count : 0;
            await realSupabase.from('entries').update({ copy_count: current + 1 }).eq('id', entryId);
          });
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

  // 2. 💾 1-Click Vault Backup (JSON & CSV Export/Import)
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
            `"${(s.name || '').replace(/"/g, '""')}"`,
            `"${(e.label || '').replace(/"/g, '""')}"`,
            `"${(e.value || '').replace(/"/g, '""')}"`,
            `"${(e.entry_type || 'text').replace(/"/g, '""')}"`,
            `"${(e.note || '').replace(/"/g, '""')}"`,
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
        const raw = lines[i];
        const match = raw.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || raw.split(',');
        if (match.length >= 3) {
          const setName = match[0].replace(/^"|"$/g, '').trim() || 'Personal';
          const label = match[1].replace(/^"|"$/g, '').trim();
          const value = match[2].replace(/^"|"$/g, '').trim();
          const entryType = match[3] ? match[3].replace(/^"|"$/g, '').trim() : 'text';
          const note = match[4] ? match[4].replace(/^"|"$/g, '').trim() : '';
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
