-- Create users table for Dynamic.xyz authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    photo_url TEXT, -- URL to Supabase storage
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100), -- reasonable name length
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'), -- alphanumeric and underscore only
    CONSTRAINT wallet_address_format CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'), -- valid Ethereum address
    CONSTRAINT email_length CHECK (char_length(email) >= 5 AND char_length(email) <= 254), -- RFC 5321 email length limits
    CONSTRAINT email_format CHECK (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') -- valid email address
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing and recreate to avoid conflicts)
-- Since we're using Dynamic.xyz auth, we'll handle access control in our application layer
-- For now, we'll allow basic operations and control access through our API

DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert profiles" ON users;
DROP POLICY IF EXISTS "Users can update profiles" ON users;

-- Users can read all profiles (for leaderboards, etc.)
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Allow inserts (we'll validate wallet ownership in our app)
CREATE POLICY "Users can insert profiles" ON users
    FOR INSERT WITH CHECK (true);

-- Allow updates (we'll validate wallet ownership in our app)
CREATE POLICY "Users can update profiles" ON users
    FOR UPDATE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user photos (without Supabase auth)
-- Note: Since we're using Dynamic.xyz auth, we'll handle photo access through our application logic
-- For now, we'll allow public access and control uploads via our API

DROP POLICY IF EXISTS "Anyone can upload user photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update user photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete user photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;

CREATE POLICY "Anyone can upload user photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Anyone can update user photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'user-photos');

CREATE POLICY "Anyone can delete user photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'user-photos');

CREATE POLICY "Anyone can view user photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-photos');