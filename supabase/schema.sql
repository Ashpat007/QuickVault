-- QuickVault Master PostgreSQL Schema & Migrations

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
CREATE POLICY "Users can view their own sets" ON sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public sets are viewable by public slug" ON sets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own sets" ON sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets" ON sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets" ON sets
    FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for Entries
CREATE POLICY "Users can manage their own entries" ON entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public non-private entries viewable for public sets" ON entries
    FOR SELECT USING (
        is_private = false AND 
        EXISTS (
            SELECT 1 FROM sets 
            WHERE sets.id = entries.set_id 
            AND sets.is_public = true
        )
    );
