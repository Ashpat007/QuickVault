-- QuickVault Master PostgreSQL Schema & Hardened Security RPCs

-- 1. Create Sets (Profiles) Table
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    public_slug TEXT UNIQUE,
    view_count INTEGER DEFAULT 0, -- Public Card View Analytics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Entries Table with P0 Security Default: is_private = true
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    note TEXT,
    entry_type TEXT DEFAULT 'text',
    is_private BOOLEAN DEFAULT true, -- P0 Security Default: Secured by default
    sort_order INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0, -- Public & Private Copy Tap Analytics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Migrations for existing deployments
ALTER TABLE sets ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES sets(id) ON DELETE CASCADE;
ALTER TABLE entries ALTER COLUMN is_private SET DEFAULT true;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 5. Strict Owner-Only RLS Policies for Sets (Prevents Public Table Enumeration)
DROP POLICY IF EXISTS "Users can view their own sets" ON sets;
CREATE POLICY "Users can view their own sets" ON sets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public sets are viewable by public slug" ON sets;
-- Intentionally REMOVED generic SELECT policy on sets table to prevent slug enumeration.
-- Public cards must be fetched strictly via the get_public_vault_card() RPC below.

DROP POLICY IF EXISTS "Users can insert their own sets" ON sets;
CREATE POLICY "Users can insert their own sets" ON sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sets" ON sets;
CREATE POLICY "Users can update their own sets" ON sets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sets" ON sets;
CREATE POLICY "Users can delete their own sets" ON sets
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Hardened Owner-Only RLS Policies for Entries (Fixing Cross-Owner Injection)
DROP POLICY IF EXISTS "Users can manage their own entries" ON entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert entries into their own sets" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries in their own sets" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;
DROP POLICY IF EXISTS "Public non-private entries viewable for public sets" ON entries;

CREATE POLICY "Users can view their own entries" ON entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert entries into their own sets" ON entries
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (
            set_id IS NULL OR
            EXISTS (
                SELECT 1 FROM sets 
                WHERE sets.id = entries.set_id 
                AND sets.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own entries in their own sets" ON entries
    FOR UPDATE USING (
        auth.uid() = user_id AND
        (
            set_id IS NULL OR
            EXISTS (
                SELECT 1 FROM sets 
                WHERE sets.id = entries.set_id 
                AND sets.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own entries" ON entries
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Security Definer RPC for Public Cards (Prevents Slug Enumeration)
CREATE OR REPLACE FUNCTION get_public_vault_card(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_set RECORD;
    public_entries JSONB;
BEGIN
    SELECT * INTO target_set
    FROM sets
    WHERE public_slug = p_slug AND is_public = true;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'label', e.label,
            'value', e.value,
            'note', e.note,
            'entry_type', e.entry_type,
            'sort_order', e.sort_order
        ) ORDER BY e.sort_order ASC
    ) INTO public_entries
    FROM entries e
    WHERE e.set_id = target_set.id AND e.is_private = false;

    RETURN jsonb_build_object(
        'id', target_set.id,
        'name', target_set.name,
        'public_slug', target_set.public_slug,
        'view_count', target_set.view_count,
        'entries', COALESCE(public_entries, '[]'::jsonb)
    );
END;
$$;

-- 8. Analytics Security Definer RPCs
CREATE OR REPLACE FUNCTION increment_set_view(set_row_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE sets 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = set_row_id AND is_public = true;
END;
$$;

CREATE OR REPLACE FUNCTION increment_entry_copy(entry_row_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE entries 
    SET copy_count = COALESCE(copy_count, 0) + 1 
    WHERE id = entry_row_id;
END;
$$;
