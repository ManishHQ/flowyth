-- Create squad and tournament tables for Rocq.fun fantasy crypto game
-- Using Dynamic.xyz auth, so security is handled at application level

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entry_fee_usdc DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    max_participants INTEGER NOT NULL DEFAULT 5000,
    current_participants INTEGER NOT NULL DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled')),
    prize_pool_usdc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    winner_wallet_address TEXT, -- Winner's wallet address
    settlement_tx_hash TEXT, -- Blockchain transaction hash for prize distribution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT tournament_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
    CONSTRAINT entry_fee_positive CHECK (entry_fee_usdc > 0),
    CONSTRAINT max_participants_positive CHECK (max_participants > 0),
    CONSTRAINT current_participants_valid CHECK (current_participants >= 0 AND current_participants <= max_participants),
    CONSTRAINT end_after_start CHECK (end_time > start_time),
    CONSTRAINT registration_before_start CHECK (registration_deadline <= start_time),
    CONSTRAINT winner_wallet_format CHECK (winner_wallet_address IS NULL OR winner_wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Squads table
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_wallet_address TEXT NOT NULL,
    squad_name TEXT NOT NULL,
    
    -- Squad composition (6 tokens total: 2 strikers, 2 midfielders, 2 defenders)
    striker_1_symbol TEXT NOT NULL,
    striker_1_price_at_start DECIMAL(20, 8),
    striker_1_price_at_end DECIMAL(20, 8),
    
    striker_2_symbol TEXT NOT NULL,
    striker_2_price_at_start DECIMAL(20, 8),
    striker_2_price_at_end DECIMAL(20, 8),
    
    midfielder_1_symbol TEXT NOT NULL,
    midfielder_1_price_at_start DECIMAL(20, 8),
    midfielder_1_price_at_end DECIMAL(20, 8),
    
    midfielder_2_symbol TEXT NOT NULL,
    midfielder_2_price_at_start DECIMAL(20, 8),
    midfielder_2_price_at_end DECIMAL(20, 8),
    
    defender_1_symbol TEXT NOT NULL,
    defender_1_price_at_start DECIMAL(20, 8),
    defender_1_price_at_end DECIMAL(20, 8),
    
    defender_2_symbol TEXT NOT NULL,
    defender_2_price_at_start DECIMAL(20, 8),
    defender_2_price_at_end DECIMAL(20, 8),
    
    -- Scoring
    total_score DECIMAL(10, 4) DEFAULT 0.00,
    rank_in_tournament INTEGER,
    
    -- Payment tracking
    entry_fee_paid BOOLEAN DEFAULT FALSE,
    payment_tx_hash TEXT, -- Blockchain transaction hash for entry fee
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT squad_name_length CHECK (char_length(squad_name) >= 3 AND char_length(squad_name) <= 50),
    CONSTRAINT user_wallet_format CHECK (user_wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT token_symbols_not_empty CHECK (
        char_length(striker_1_symbol) > 0 AND
        char_length(striker_2_symbol) > 0 AND
        char_length(midfielder_1_symbol) > 0 AND
        char_length(midfielder_2_symbol) > 0 AND
        char_length(defender_1_symbol) > 0 AND
        char_length(defender_2_symbol) > 0
    ),
    CONSTRAINT prices_positive CHECK (
        (striker_1_price_at_start IS NULL OR striker_1_price_at_start > 0) AND
        (striker_2_price_at_start IS NULL OR striker_2_price_at_start > 0) AND
        (midfielder_1_price_at_start IS NULL OR midfielder_1_price_at_start > 0) AND
        (midfielder_2_price_at_start IS NULL OR midfielder_2_price_at_start > 0) AND
        (defender_1_price_at_start IS NULL OR defender_1_price_at_start > 0) AND
        (defender_2_price_at_start IS NULL OR defender_2_price_at_start > 0) AND
        (striker_1_price_at_end IS NULL OR striker_1_price_at_end > 0) AND
        (striker_2_price_at_end IS NULL OR striker_2_price_at_end > 0) AND
        (midfielder_1_price_at_end IS NULL OR midfielder_1_price_at_end > 0) AND
        (midfielder_2_price_at_end IS NULL OR midfielder_2_price_at_end > 0) AND
        (defender_1_price_at_end IS NULL OR defender_1_price_at_end > 0) AND
        (defender_2_price_at_end IS NULL OR defender_2_price_at_end > 0)
    ),
    CONSTRAINT rank_positive CHECK (rank_in_tournament IS NULL OR rank_in_tournament > 0),
    
    -- Unique constraint: one squad per user per tournament
    UNIQUE(tournament_id, user_wallet_address)
);

-- Token price history table (for tracking price movements during tournaments)
CREATE TABLE IF NOT EXISTS token_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    token_symbol TEXT NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    confidence_interval DECIMAL(5, 4), -- Pyth confidence interval (0.0000 to 1.0000)
    pyth_price_id TEXT, -- Pyth Network price feed ID
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT token_symbol_not_empty CHECK (char_length(token_symbol) > 0),
    CONSTRAINT price_positive CHECK (price > 0),
    CONSTRAINT confidence_valid CHECK (confidence_interval IS NULL OR (confidence_interval >= 0 AND confidence_interval <= 1))
);

-- Available tokens table (curated list for MVP)
CREATE TABLE IF NOT EXISTS available_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('striker', 'midfielder', 'defender')),
    multiplier DECIMAL(3, 2) NOT NULL,
    pyth_price_id TEXT, -- Pyth Network price feed ID
    logo_emoji TEXT DEFAULT '🪙',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT token_symbol_length CHECK (char_length(symbol) >= 2 AND char_length(symbol) <= 10),
    CONSTRAINT token_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    CONSTRAINT multiplier_positive CHECK (multiplier > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_squads_tournament_id ON squads(tournament_id);
CREATE INDEX IF NOT EXISTS idx_squads_user_wallet ON squads(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_squads_rank ON squads(tournament_id, rank_in_tournament);
CREATE INDEX IF NOT EXISTS idx_token_price_history_tournament ON token_price_history(tournament_id, token_symbol);
CREATE INDEX IF NOT EXISTS idx_token_price_history_recorded_at ON token_price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_available_tokens_category ON available_tokens(category, is_active);

-- Create updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON squads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Since we're using Dynamic.xyz auth, we'll handle security at app level
-- But we'll enable RLS for extra protection
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive since app handles auth)
-- Tournaments: Everyone can read, but modifications handled by app
CREATE POLICY "Allow public read on tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on tournaments" ON tournaments FOR UPDATE USING (true);

-- Squads: Users can read all squads but only modify their own (verified by app)
CREATE POLICY "Allow public read on squads" ON squads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on squads" ON squads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on squads" ON squads FOR UPDATE USING (true);

-- Token price history: Read-only for public, insert/update for app
CREATE POLICY "Allow public read on token_price_history" ON token_price_history FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on token_price_history" ON token_price_history FOR INSERT WITH CHECK (true);

-- Available tokens: Read-only for public
CREATE POLICY "Allow public read on available_tokens" ON available_tokens FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on available_tokens" ON available_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on available_tokens" ON available_tokens FOR UPDATE USING (true);

-- Insert initial token data (MVP curated list)
INSERT INTO available_tokens (symbol, name, category, multiplier, logo_emoji) VALUES
-- Strikers (High-risk memecoins/altcoins) - 1.5x multiplier
('SHIB', 'Shiba Inu', 'striker', 1.50, '🐕'),
('PEPE', 'Pepe', 'striker', 1.50, '🐸'),
('DOGE', 'Dogecoin', 'striker', 1.50, '🐶'),
('FLOKI', 'Floki Inu', 'striker', 1.50, '🚀'),
('BONK', 'Bonk', 'striker', 1.50, '💥'),
('WIF', 'dogwifhat', 'striker', 1.50, '🧢'),
('MOG', 'Mog Coin', 'striker', 1.50, '😸'),
('BRETT', 'Brett', 'striker', 1.50, '🎭'),

-- Midfielders (Mid-cap altcoins) - 1.0x multiplier
('LINK', 'Chainlink', 'midfielder', 1.00, '🔗'),
('UNI', 'Uniswap', 'midfielder', 1.00, '🦄'),
('AAVE', 'Aave', 'midfielder', 1.00, '👻'),
('MKR', 'Maker', 'midfielder', 1.00, '🏛️'),
('COMP', 'Compound', 'midfielder', 1.00, '🏦'),
('CRV', 'Curve DAO', 'midfielder', 1.00, '📈'),
('LDO', 'Lido DAO', 'midfielder', 1.00, '🌊'),
('SNX', 'Synthetix', 'midfielder', 1.00, '⚡'),
('1INCH', '1inch', 'midfielder', 1.00, '🔄'),
('ENS', 'Ethereum Name Service', 'midfielder', 1.00, '🏷️'),

-- Defenders (BTC/ETH/Stablecoins) - 0.75x multiplier
('BTC', 'Bitcoin', 'defender', 0.75, '₿'),
('ETH', 'Ethereum', 'defender', 0.75, 'Ξ'),
('USDC', 'USD Coin', 'defender', 0.75, '💵'),
('USDT', 'Tether', 'defender', 0.75, '🏦'),
('DAI', 'Dai', 'defender', 0.75, '🔶'),
('WBTC', 'Wrapped Bitcoin', 'defender', 0.75, '🔗₿')
ON CONFLICT (symbol) DO NOTHING;

-- Create a demo tournament for testing
INSERT INTO tournaments (name, entry_fee_usdc, max_participants, start_time, end_time, registration_deadline, status)
VALUES (
    'Demo Tournament - 24h Crypto Fantasy',
    5.00,
    100,
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '25 hours',
    NOW() + INTERVAL '30 minutes',
    'registration_open'
) ON CONFLICT DO NOTHING;
