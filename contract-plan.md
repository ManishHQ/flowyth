# Crypto Fantasy League - Smart Contract Plan

## 🎯 Concept Overview

A football-style fantasy league where cryptocurrencies are players! Users form squads with different crypto types in specific positions and compete in tournaments based on real price performance.

## ⚽ Game Mechanics

### Squad Formation (6 Players Total)
```
Formation: 1-2-2-1 (Football Style)

🥅 Goalkeeper (1): Stablecoin
   - USDC, USDT, DAI, etc.
   - Low volatility, defensive play

🛡️ Defenders (2): Blue Chip Cryptos
   - BTC, ETH
   - Established, reliable performance

⚽ Midfielders (2): Altcoins
   - SOL, ADA, DOT, LINK, etc.
   - Medium risk/reward

🎯 Striker (1): Meme Coins
   - DOGE, SHIB, PEPE, etc.
   - High risk/high reward
```

### Tournament Structure
- **Registration Period**: Users pay entrance fee and submit squads
- **Tournament Duration**: Flexible (1 day, 1 week, etc.)
- **Price Snapshots**: Start timestamp and end timestamp for verification
- **Data Source**: Pyth Network via Hermes client

## 🏗️ Technical Architecture

### On-Chain Components (Smart Contract)
```solidity
contract CryptoFantasyLeague {
    // Tournament management
    struct Tournament {
        uint256 id;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        address[] participants;
        bool isActive;
        mapping(address => bool) hasRegistered;
    }

    // Squad data stored off-chain (IPFS hash)
    mapping(address => mapping(uint256 => string)) userSquads; // user -> tournamentId -> squadHash

    // Price snapshots for verification
    mapping(uint256 => PriceSnapshot) startPrices;
    mapping(uint256 => PriceSnapshot) endPrices;
}
```

### Off-Chain Components
- **Squad Formation**: Frontend interface for team selection
- **Price Data**: Hermes client fetching from Pyth Network
- **Squad Storage**: IPFS or simple JSON storage
- **Scoring Calculation**: Backend service computing tournament results

### Scoring System
```
Position Multipliers:
🥅 Goalkeeper (Stablecoin): 10x (stability bonus)
🛡️ Defender (Blue Chip): 5x
⚽ Midfielder (Altcoin): 3x
🎯 Striker (Meme Coin): 1x (but highest potential)

Total Score = Sum of (Position Multiplier × Price Change %)
```

## 🛠️ Implementation Plan

### Phase 1: Core Smart Contract
- Tournament creation and registration
- Entry fee collection and prize pool management
- Price snapshot recording (start/end times)
- Winner determination and payout

### Phase 2: Off-Chain Integration
- Squad formation UI
- Pyth price feed integration
- Scoring calculation service
- Tournament lifecycle management

### Phase 3: Advanced Features
- Multiple tournament types
- Leaderboards and statistics
- Tournament history
- Advanced scoring formulas

## 🎯 MVP Specification

### Tournament Structure
- **Entry Fee**: 0.05 FLOW
- **Duration**: 24 hours (daily tournaments)
- **Max Participants**: 20 players
- **Squad Requirements**: Exactly 1 of each position type (6 total)

### Available Cryptocurrencies
```
🥅 Goalkeepers: USDC, USDT, DAI
🛡️ Defenders: BTC, ETH
⚽ Midfielders: SOL, ADA, LINK, DOT, MATIC, AVAX
🎯 Strikers: DOGE, SHIB, PEPE, FLOKI
```

### Prize Distribution
- 1st Place: 60% of prize pool
- 2nd Place: 25% of prize pool
- 3rd Place: 10% of prize pool
- Creator Fee: 5% of prize pool

## 🔄 Tournament Flow

1. **Tournament Creation**: Admin creates tournament with parameters
2. **Registration Period**: Users pay entry fee and submit squad (off-chain)
3. **Tournament Start**: Record price snapshot timestamp
4. **Tournament Duration**: Monitor prices via Pyth feeds
5. **Tournament End**: Record final price snapshot
6. **Scoring**: Calculate results based on price changes and position multipliers
7. **Payout**: Distribute prizes to winners

Does this capture your vision correctly? Should we start building the core smart contract?