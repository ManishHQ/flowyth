-- Create PvP matches table
CREATE TABLE pvp_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  creator_wallet TEXT NOT NULL,
  opponent_wallet TEXT,
  creator_coin TEXT,
  opponent_coin TEXT,
  creator_coin_start_price DECIMAL(18,8),
  opponent_coin_start_price DECIMAL(18,8),
  creator_coin_end_price DECIMAL(18,8),
  opponent_coin_end_price DECIMAL(18,8),
  winner_wallet TEXT,
  status TEXT NOT NULL DEFAULT 'waiting_for_opponent' CHECK (status IN ('waiting_for_opponent', 'selecting_coins', 'in_progress', 'finished')),
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pvp_matches_invite_code ON pvp_matches(invite_code);
CREATE INDEX idx_pvp_matches_status ON pvp_matches(status);
CREATE INDEX idx_pvp_matches_creator_wallet ON pvp_matches(creator_wallet);
CREATE INDEX idx_pvp_matches_opponent_wallet ON pvp_matches(opponent_wallet);

-- Update existing available_tokens table with Pyth price IDs for PvP-compatible tokens
-- Only update tokens that don't already have pyth_price_id set
UPDATE available_tokens 
SET pyth_price_id = CASE 
  WHEN symbol = 'BTC' THEN 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
  WHEN symbol = 'ETH' THEN 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
  WHEN symbol = 'LINK' THEN '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221'
  WHEN symbol = 'DOGE' THEN 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c'
  ELSE pyth_price_id
END
WHERE symbol IN ('BTC', 'ETH', 'LINK', 'DOGE') AND pyth_price_id IS NULL;

-- Insert additional tokens needed for PvP that might not exist
INSERT INTO available_tokens (symbol, name, category, multiplier, pyth_price_id, logo_emoji, is_active) VALUES
('SOL', 'Solana', 'midfielder', 1.00, 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', '◎', true),
('ADA', 'Cardano', 'midfielder', 1.00, '2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d', '🔵', true),
('MATIC', 'Polygon', 'midfielder', 1.00, '5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52', '🟣', true),
('AVAX', 'Avalanche', 'midfielder', 1.00, '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', '🔺', true)
ON CONFLICT (symbol) DO UPDATE SET
  pyth_price_id = EXCLUDED.pyth_price_id,
  logo_emoji = EXCLUDED.logo_emoji
WHERE available_tokens.pyth_price_id IS NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pvp_matches updated_at
CREATE TRIGGER update_pvp_matches_updated_at 
    BEFORE UPDATE ON pvp_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
