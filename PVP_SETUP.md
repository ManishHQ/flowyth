# PvP Crypto Duel Setup Instructions

## Database Setup

You need to run the database migration to create the PvP tables in your Supabase database.

### Option 1: Using Supabase CLI
```bash
supabase migration up
```

### Option 2: Manual SQL Execution
Run the SQL from `/supabase/migrations/003_create_pvp_tables.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/003_create_pvp_tables.sql`
4. Click "Run"

## Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### 1. Match Creation Flow
- User creates a match with a duration (30s, 1min, 2min, or 5min)
- System generates a 6-character invite code
- Match status: `waiting_for_opponent`

### 2. Joining Flow
- Another player enters the invite code
- Match status changes to: `selecting_coins`
- Both players can now select their cryptocurrency

### 3. Coin Selection
- Players choose from available cryptocurrencies (BTC, ETH, SOL, LINK, DOGE, ADA, MATIC, AVAX)
- Each coin has a Pyth price feed ID for real-time data

### 4. Match Start
- Once both players select coins, either can start the match
- System records starting prices from Pyth Network
- Match status: `in_progress`
- Timer starts counting down

### 5. Real-time Updates
- Supabase real-time subscriptions keep both players synchronized
- Price changes are streamed from Pyth Network
- Percentage gains/losses calculated in real-time

### 6. Match End
- Timer reaches zero OR manual finish
- System calculates final percentage changes
- Winner determined by highest percentage gain
- Match status: `finished`

## Features

✅ **Real-time match synchronization** - Both players see updates instantly
✅ **Invite code system** - Easy way to invite friends
✅ **Multiple cryptocurrencies** - 8 different coins to choose from
✅ **Flexible durations** - 30 seconds to 5 minutes
✅ **Live price streaming** - Real-time data from Pyth Network
✅ **Automatic match resolution** - Timer-based or manual finish
✅ **Mobile responsive** - Works on all devices

## Database Tables

### `pvp_matches`
- Stores match information, player wallets, coin selections, prices, and results

### `available_tokens` (reused from existing system)
- Stores available cryptocurrencies with Pyth price feed IDs and emojis
- Only tokens with `pyth_price_id` set can be used in PvP matches

## Security Notes

- No RLS (Row Level Security) as per project requirements
- All data is openly readable
- Authentication handled by Dynamic.xyz
- No sensitive data stored (only wallet addresses and game state)

## Future Enhancements

- [ ] Match history and statistics
- [ ] Leaderboards
- [ ] Tournament brackets
- [ ] Betting/wagering system
- [ ] More sophisticated chart visualization
- [ ] Push notifications for match updates
