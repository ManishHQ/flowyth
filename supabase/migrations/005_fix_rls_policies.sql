-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow read access to pvp_matches" ON pvp_matches;
DROP POLICY IF EXISTS "Allow participants to update pvp_matches" ON pvp_matches;
DROP POLICY IF EXISTS "Allow anyone to create pvp_matches" ON pvp_matches;

-- Temporarily disable RLS to test (we'll re-enable with better policies)
ALTER TABLE pvp_matches DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simpler policies
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pvp_matches (for development - restrict in production)
CREATE POLICY "Enable read access for all users" ON pvp_matches
FOR SELECT USING (true);

-- Allow anyone to insert pvp_matches (for development)
CREATE POLICY "Enable insert access for all users" ON pvp_matches
FOR INSERT WITH CHECK (true);

-- Allow anyone to update pvp_matches (for development)
CREATE POLICY "Enable update access for all users" ON pvp_matches
FOR UPDATE USING (true);

-- Allow anyone to delete pvp_matches (for development)
CREATE POLICY "Enable delete access for all users" ON pvp_matches
FOR DELETE USING (true);

-- Note: These are permissive policies for development
-- In production, you should restrict based on auth.uid() or wallet addresses
