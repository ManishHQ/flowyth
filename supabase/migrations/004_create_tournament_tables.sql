-- Create tournament squads table
CREATE TABLE tournament_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_address TEXT NOT NULL,
  player_address TEXT NOT NULL,
  tokens JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one squad per player per tournament
  UNIQUE(tournament_address, player_address)
);

-- Create indexes
CREATE INDEX idx_tournament_squads_tournament ON tournament_squads(tournament_address);
CREATE INDEX idx_tournament_squads_player ON tournament_squads(player_address);
CREATE INDEX idx_tournament_squads_created_at ON tournament_squads(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournament_squads_updated_at 
    BEFORE UPDATE ON tournament_squads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create tournament results table (for future use)
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_address TEXT NOT NULL,
  player_address TEXT NOT NULL,
  squad_id UUID REFERENCES tournament_squads(id),
  final_score DECIMAL(18,8),
  rank INTEGER,
  prize_amount DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for results
CREATE INDEX idx_tournament_results_tournament ON tournament_results(tournament_address);
CREATE INDEX idx_tournament_results_player ON tournament_results(player_address);
CREATE INDEX idx_tournament_results_rank ON tournament_results(rank);

-- Create tournament metadata table (for caching contract data)
CREATE TABLE tournament_metadata (
  address TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Registration', 'Live', 'Finished')),
  prize_pool DECIMAL(18,8) DEFAULT 0,
  entry_fee DECIMAL(18,8) NOT NULL,
  participants INTEGER DEFAULT 0,
  max_participants INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for metadata
CREATE INDEX idx_tournament_metadata_status ON tournament_metadata(status);
CREATE INDEX idx_tournament_metadata_start_time ON tournament_metadata(start_time);
CREATE INDEX idx_tournament_metadata_created_at ON tournament_metadata(created_at);

-- Add updated_at trigger for metadata
CREATE TRIGGER update_tournament_metadata_updated_at 
    BEFORE UPDATE ON tournament_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
