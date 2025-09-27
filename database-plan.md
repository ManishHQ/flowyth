# Database Plan - Crypto Fantasy League

## 📊 Supabase Database Schema

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. tournaments
```sql
CREATE TABLE tournaments (
  id BIGSERIAL PRIMARY KEY,
  contract_tournament_id BIGINT UNIQUE, -- Links to smart contract
  name TEXT NOT NULL,
  entry_fee DECIMAL(18,8) NOT NULL, -- FLOW amount
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 20,
  prize_pool DECIMAL(18,8) DEFAULT 0,
  status TEXT DEFAULT 'upcoming', -- upcoming, active, finished
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. cryptocurrencies
```sql
CREATE TABLE cryptocurrencies (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL, -- BTC, ETH, DOGE, etc.
  name TEXT NOT NULL, -- Bitcoin, Ethereum, etc.
  position_type TEXT NOT NULL, -- goalkeeper, defender, midfielder, striker
  pyth_price_id TEXT, -- Pyth Network price feed ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. squads
```sql
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  tournament_id BIGINT REFERENCES tournaments(id) NOT NULL,
  goalkeeper_id BIGINT REFERENCES cryptocurrencies(id),
  defender1_id BIGINT REFERENCES cryptocurrencies(id),
  defender2_id BIGINT REFERENCES cryptocurrencies(id),
  midfielder1_id BIGINT REFERENCES cryptocurrencies(id),
  midfielder2_id BIGINT REFERENCES cryptocurrencies(id),
  striker_id BIGINT REFERENCES cryptocurrencies(id),
  squad_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);
```

#### 5. tournament_registrations
```sql
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  tournament_id BIGINT REFERENCES tournaments(id) NOT NULL,
  transaction_hash TEXT, -- Registration transaction hash
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);
```

#### 6. price_snapshots
```sql
CREATE TABLE price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id BIGINT REFERENCES tournaments(id) NOT NULL,
  crypto_id BIGINT REFERENCES cryptocurrencies(id) NOT NULL,
  price DECIMAL(18,8) NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'start' or 'end'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  pyth_data JSONB, -- Raw Pyth data for verification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. tournament_results
```sql
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id BIGINT REFERENCES tournaments(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  squad_id UUID REFERENCES squads(id) NOT NULL,
  total_score DECIMAL(10,4) NOT NULL,
  position INTEGER, -- 1st, 2nd, 3rd place
  prize_amount DECIMAL(18,8) DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Data Flow & Relationships

### Tournament Lifecycle
1. **Tournament Creation** → tournaments table
2. **User Registration** → tournament_registrations + squads
3. **Tournament Start** → price_snapshots (start)
4. **Tournament End** → price_snapshots (end)
5. **Score Calculation** → tournament_results

### Squad Management
- Users create squads for specific tournaments
- Squad validation (1 of each position type)
- Squad linked to tournament registration

### Scoring System
- Price snapshots capture start/end prices
- Score calculation happens off-chain
- Results stored in tournament_results

## 📋 Key Data Operations

### User Registration Flow
```
1. User connects wallet → check/create user record
2. User joins tournament → tournament_registrations
3. User creates squad → squads table
4. Validation: squad completeness, position rules
```

### Tournament Management
```
1. Admin creates tournament → tournaments table
2. Tournament starts → price_snapshots (start)
3. Tournament ends → price_snapshots (end)
4. Calculate scores → tournament_results
5. Update tournament status
```

### Live Scoring
```
1. Fetch current prices from Pyth
2. Compare with start prices
3. Calculate live scores
4. Display leaderboard (cached)
```

## 🛠️ Technical Considerations

### Indexes Needed
- tournaments: status, start_time, end_time
- squads: user_id, tournament_id
- price_snapshots: tournament_id, crypto_id, timestamp
- tournament_results: tournament_id, total_score

### Data Validation
- Squad must have exactly 6 cryptos (1 of each position)
- Position types must match crypto categories
- Registration before tournament start
- Price snapshots at exact start/end times

### Performance
- Cache live leaderboards
- Batch price updates
- Index on frequently queried fields

## 🎯 Initial Seed Data

### Cryptocurrencies by Position
```sql
-- Goalkeepers (Stablecoins)
INSERT INTO cryptocurrencies (symbol, name, position_type) VALUES
('USDC', 'USD Coin', 'goalkeeper'),
('USDT', 'Tether', 'goalkeeper'),
('DAI', 'Dai Stablecoin', 'goalkeeper');

-- Defenders (Blue Chips)
INSERT INTO cryptocurrencies (symbol, name, position_type) VALUES
('BTC', 'Bitcoin', 'defender'),
('ETH', 'Ethereum', 'defender');

-- Midfielders (Altcoins)
INSERT INTO cryptocurrencies (symbol, name, position_type) VALUES
('SOL', 'Solana', 'midfielder'),
('ADA', 'Cardano', 'midfielder'),
('LINK', 'Chainlink', 'midfielder'),
('DOT', 'Polkadot', 'midfielder'),
('MATIC', 'Polygon', 'midfielder'),
('AVAX', 'Avalanche', 'midfielder');

-- Strikers (Meme Coins)
INSERT INTO cryptocurrencies (symbol, name, position_type) VALUES
('DOGE', 'Dogecoin', 'striker'),
('SHIB', 'Shiba Inu', 'striker'),
('PEPE', 'Pepe', 'striker'),
('FLOKI', 'Floki Inu', 'striker');
```

What do you think of this database structure? Should we modify anything before we start implementing?