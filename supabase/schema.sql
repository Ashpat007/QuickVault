-- QuickVault Master PostgreSQL Schema & Security Hardening Migrations

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

-- 5. RLS Policies for Sets
DROP POLICY IF EXISTS "Users can view their own sets" ON sets;
CREATE POLICY "Users can view their own sets" ON sets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public sets are viewable by public slug" ON sets;
CREATE POLICY "Public sets are viewable by public slug" ON sets
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own sets" ON sets;
CREATE POLICY "Users can insert their own sets" ON sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sets" ON sets;
CREATE POLICY "Users can update their own sets" ON sets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sets" ON sets;
CREATE POLICY "Users can delete their own sets" ON sets
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Hardened RLS Policies for Entries (Fixing Cross-Owner Injection)
DROP POLICY IF EXISTS "Users can manage their own entries" ON entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert entries into their own sets" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

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

DROP POLICY IF EXISTS "Public non-private entries viewable for public sets" ON entries;
CREATE POLICY "Public non-private entries viewable for public sets" ON entries
    FOR SELECT USING (
        is_private = false AND 
        EXISTS (
            SELECT 1 FROM sets 
            WHERE sets.id = entries.set_id 
            AND sets.is_public = true
        )
    );
