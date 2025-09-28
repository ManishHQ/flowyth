# 🏆 flowyth

## *The First Cross-Chain Crypto Fantasy League*

**flowyth** = **Flow** blockchain + **Pyth** oracles

> **Fantasy sports meets crypto trading.** Build your squad of cryptocurrencies and compete for real prizes based on market performance.

---

## 🎯 **What is flowyth?**

flowyth transforms crypto portfolio management into competitive entertainment. Players draft teams of cryptocurrencies like fantasy football players, then compete based on real market performance over 24-hour tournaments.

### **Core Concept**
- **Draft Strategy**: Pick 6 crypto assets across different "positions"
- **Cross-Chain Competition**: Select from Ethereum, Solana, BSC, and 40+ chains  
- **Real Stakes**: $5 USDC entry fees with prize pools up to $25,000
- **Fair Settlement**: Institutional-grade Pyth oracles determine winners

### **Game Modes**
1. **🏆 Tournament Mode**: 5,000-player competitions with group brackets
2. **🎯 Solo Mode**: AMM-based prediction markets with continuous trading  
3. **⚔️ P2P Mode**: Direct challenges between friends

---

## 🔧 **Technology Stack**

### **Blockchain Infrastructure**
- **Flow EVM**: Consumer-friendly blockchain with 3-second finality
- **Smart Contracts**: Solidity contracts for all game logic
- **Pyth Network**: Dual integration for price feeds + entropy

### **Frontend**
- **Framework**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS + Framer Motion animations
- **Wallet**: Dynamic.xyz for seamless user onboarding
- **Real-time**: WebSocket connections for live updates

### **Backend**
- **Database**: Supabase (PostgreSQL) for user data
- **Real-time**: Supabase Realtime for live leaderboards
- **File Storage**: IPFS for tournament metadata

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart          │    │   Oracles       │
│   (Next.js)     │◄──►│   Contracts      │◄──►│   (Pyth)        │
│                 │    │   (Flow EVM)     │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Squad Builder │    │ • Tournament     │    │ • Price Feeds   │
│ • Live Tracker  │    │   Management     │    │ • Random        │
│ • Leaderboards  │    │ • Prize Pools    │    │   Entropy       │
│ • Social Feed   │    │ • Settlement     │    │ • 40+ Chains    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌──────────────────┐
                       │   Supabase       │
                       │   (Database)     │
                       │                  │
                       │ • User Profiles  │
                       │ • Match History  │
                       │ • Real-time Data │
                       └──────────────────┘
```

---

## 🚀 **Key Innovations**

### **1. Dual Pyth Integration**
```solidity
// Price Feeds for Settlement
function settleTournament(bytes[] calldata priceUpdateData) external payable {
    uint fee = pyth.getUpdateFee(priceUpdateData);
    pyth.updatePriceFeeds{value: fee}(priceUpdateData);
    
    // Calculate performance based on real market data
    int256 performance = calculateSquadPerformance(squad);
}

// Entropy for Fair Randomness  
function assignRandomGroups(uint256 tournamentId, bytes32 randomSeed) external {
    // Provably fair group assignment using Pyth entropy
    uint256 groupId = (uint256(keccak256(abi.encodePacked(randomSeed, i))) % totalGroups) + 1;
}
```

### **2. Position-Based Strategy**
- **Strikers** (Memecoins): 1.5x multiplier - High risk, high reward
- **Midfielders** (Altcoins): 1.0x multiplier - Balanced performance  
- **Defenders** (BTC/ETH): 0.75x multiplier - Stability anchor

### **3. Cross-Chain Asset Selection**
Users can pick tokens from any of Pyth's 40+ supported blockchains in a single tournament.

---

## 🎮 **How It Works**

### **Tournament Flow Example**

#### **Registration Phase (2 hours)**
```javascript
// User builds squad via frontend
const squad = {
  strikers: ["DOGE", "PEPE"],     // High-risk memecoins
  midfielders: ["SOL", "ADA"],    // Balanced altcoins  
  defenders: ["BTC", "ETH"]       // Stable assets
}

// Smart contract registration
await contract.registerSquad(tournamentId, tokenIds, positions, { value: entryFee })
```

#### **Tournament Active (24 hours)**
```javascript
// Real-time performance tracking
const livePerformance = tokens.map(token => {
  const startPrice = tournamentStartPrices[token]
  const currentPrice = await pyth.getPrice(token)
  const change = ((currentPrice - startPrice) / startPrice) * 100
  return change * positionMultiplier[token]
})
```

#### **Settlement**
```javascript
// Automated settlement via Pyth oracles
await contract.settleGroup(tournamentId, groupId, groupPlayers)
// Prize distribution to top 20% of each group
```

---

## 📱 **Demo Screenshots**

### Squad Building Interface
```
🏆 Tournament #42 - "Crypto Winter Survivor"  
💰 Prize Pool: $24,235 | 👥 4,847 Players

┌─────────────────────────────────────────┐
│ BUILD YOUR SQUAD (6/6)                  │
├─────────────────────────────────────────┤
│ 🔥 STRIKERS (2/2)                      │
│ [DOGE] Dogecoin        +2.3% ⚡ Confident│
│ [PEPE] Pepe           -1.7% ⚠️ Volatile  │
│                                         │
│ ⚖️ MIDFIELDERS (2/2)                   │  
│ [SOL] Solana          +0.8% ✅ Stable   │
│ [ADA] Cardano         +1.2% ✅ Stable   │
│                                         │
│ 🛡️ DEFENDERS (2/2)                     │
│ [BTC] Bitcoin         +0.3% 💎 Rock     │
│ [ETH] Ethereum        +0.5% 💎 Solid    │
└─────────────────────────────────────────┘
```

### Live Tournament Tracking
```
⏰ 14:32:07 remaining

YOUR SQUAD PERFORMANCE: +47.3 points (Rank: 3/20)
┌─────────────────────────────────────────┐
│ 🔥 DOGE: +23% × 1.5 = +34.5 pts ↗️     │
│ 🔥 PEPE: +8% × 1.5 = +12.0 pts ↗️      │
│ ⚖️ SOL: +3% × 1.0 = +3.0 pts ↗️        │
│ ⚖️ ADA: -2% × 1.0 = -2.0 pts ↘️        │
│ 🛡️ BTC: +0.8% × 0.75 = +0.6 pts ↗️     │
│ 🛡️ ETH: +1.2% × 0.75 = +0.9 pts ↗️     │
└─────────────────────────────────────────┘

GROUP LEADERBOARD:
1. alice.eth     +52.1 pts  🥇
2. crypto_king   +48.7 pts  🥈  
3. YOU           +47.3 pts  🥉
4. degen_dave    +45.2 pts
5. moon_boy      +43.8 pts
```

---

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- Flow CLI
- MetaMask or compatible wallet
- Dynamic Auth API keys

### **Clone & Install**
```bash
git clone https://github.com/your-team/flowyth
cd flowyth
npm install
```

### **Environment Variables**
```bash
cp .env.example .env.local
```

```env
# Flow Network
NEXT_PUBLIC_FLOW_RPC_URL=https://testnet.evm.nodes.onflow.org
NEXT_PUBLIC_FLOW_CHAIN_ID=545

# Contracts
NEXT_PUBLIC_FANTASY_CONTRACT=0x...
NEXT_PUBLIC_PREDICTION_CONTRACT=0x...

# Pyth Network  
NEXT_PUBLIC_PYTH_CONTRACT=0x2880aB155794e7179c9eE2e38200202908C17B43
NEXT_PUBLIC_HERMES_URL=https://hermes.pyth.network

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Dynamic Wallet
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-id
```

### **Deploy Contracts**
```bash
# Compile contracts
npx hardhat compile

# Deploy to Flow Testnet
npx hardhat run scripts/deploy.js --network flow-testnet

# Verify deployment
npx hardhat verify --network flow-testnet DEPLOYED_ADDRESS
```

### **Start Development Server**
```bash
npm run dev
# Visit http://localhost:3000
```

---

## 🧪 **Testing & Demo**

### **Quick Demo**
1. **Connect Wallet**: Use Dynamic.xyz integration
2. **Join Tournament**: $5 USDC entry fee (testnet)
3. **Build Squad**: Select 6 tokens across positions
4. **Watch Live**: Real-time price tracking
5. **Settlement**: Automated prize distribution

### **Test Data**
```javascript
// Sample tournament data for demo
const mockTournament = {
  id: 42,
  name: "Crypto Winter Survivor",
  entryFee: "5000000", // 5 USDC  
  participants: 4847,
  prizePool: "24235000000", // $24,235
  duration: 86400, // 24 hours
  startTime: Date.now() + 1800000 // Starts in 30 minutes
}
```

### **Smart Contract Tests**
```bash
# Run contract tests
npx hardhat test

# Test Pyth integration
npx hardhat test test/pyth-integration.test.js

# Test tournament lifecycle
npx hardhat test test/tournament.test.js
```

---

## 📊 **Project Metrics**

### **Smart Contract Stats**
- **Gas Optimized**: Registration ~85K gas, Settlement ~120K gas
- **Tournament Capacity**: 5,000 players per tournament
- **Cross-Chain Assets**: 40+ blockchains supported via Pyth
- **Settlement Speed**: Sub-3 second finality on Flow

### **Performance Benchmarks**
```
Registration Transaction: ~$0.02 (Flow gas fees)
Price Feed Update: ~$0.01 (Pyth fees)  
Settlement Transaction: ~$0.03 (Flow gas fees)
Frontend Load Time: <2 seconds
Real-time Updates: <500ms latency
```

---

## 🏆 **Hackathon Tracks**

### **🎯 Pyth Network Track**
**Perfect Integration:**
- ✅ **Price Feeds**: Core settlement mechanism uses Pyth price data
- ✅ **Entropy**: Random group assignments using Pyth randomness  
- ✅ **Cross-Chain**: Leveraging Pyth's 40+ blockchain coverage
- ✅ **Innovation**: Confidence intervals for light gamification features

**Why We Win:**
- **Dual Service Usage**: Both Price Feeds AND Entropy integration
- **Consumer Application**: Brings oracles to mainstream gaming audience  
- **Educational Value**: Teaches users about price confidence and market data

### **🌊 Flow Track** 
**Perfect Integration:**
- ✅ **Consumer Focus**: Fantasy sports is exactly Flow's target market
- ✅ **EVM Compatibility**: Solidity contracts work seamlessly
- ✅ **Gaming Heritage**: Leverages Flow's consumer app ecosystem
- ✅ **User Experience**: Account abstraction for seamless onboarding

**Why We Win:**
- **Mainstream Appeal**: Familiar fantasy sports mechanics
- **Technical Excellence**: Showcases Flow EVM capabilities  
- **Network Effects**: Viral potential drives Flow adoption

---

## 🔮 **Future Roadmap**

### **Phase 1: Core Platform** (Hackathon)
- [x] Tournament mode with cross-chain assets
- [x] Pyth oracle integration for settlement
- [x] Flow EVM deployment
- [x] Real-time price tracking

### **Phase 2: Advanced Features** (Post-Hackathon)
- [x] Solo prediction markets with AMM trading
- [x] P2P challenge mode
- [ ] Corporate tournament packages  
- [ ] Achievement NFTs and social features

### **Phase 3: Scale & Expand**
- [ ] Move to the cadence
- [ ] Mobile app (React Native)
- [ ] Institutional partnerships
- [ ] Advanced analytics and AI insights

---

## 🤝 **Team**

**Built for ETHGlobal New Delhi 2025**

- **Frontend**: Next.js + TailwindCSS + Dynamic.xyz
- **Smart Contracts**: Solidity on Flow EVM  
- **Oracles**: Pyth Network (Price Feeds + Entropy)
- **Database**: Supabase with real-time subscriptions

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE) for details

---

## 🔗 **Links**

- **Live Demo**: [https://flowyth-app.vercel.app](https://flowyth-app.vercel.app)

---

**🎯 Ready to compete? Build your squad and join the revolution!**

*flowyth - Where crypto meets competition*
