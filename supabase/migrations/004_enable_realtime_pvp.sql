-- Enable real-time for pvp_matches table
ALTER PUBLICATION supabase_realtime ADD TABLE pvp_matches;

-- Create RLS policies for pvp_matches to allow real-time updates
-- Enable RLS on pvp_matches if not already enabled
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pvp_matches (for real-time subscriptions)
-- In production, you might want to restrict this further
CREATE POLICY "Allow read access to pvp_matches" ON pvp_matches
FOR SELECT USING (true);

-- Allow creators and opponents to update their matches
CREATE POLICY "Allow participants to update pvp_matches" ON pvp_matches
FOR UPDATE USING (
  creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR opponent_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- Allow anyone to create matches (for now - you might want to restrict this)
CREATE POLICY "Allow anyone to create pvp_matches" ON pvp_matches
FOR INSERT WITH CHECK (true);

-- Enable real-time for available_tokens table as well
ALTER PUBLICATION supabase_realtime ADD TABLE available_tokens;

-- Create policies for available_tokens
ALTER TABLE available_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to available_tokens" ON available_tokens
FOR SELECT USING (true);

-- Note: For Dynamic.xyz integration, you'll need to set the JWT claims properly
-- This is a simplified version - in production you should implement proper auth checks