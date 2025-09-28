// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PredictionMarket
 * @dev A decentralized prediction market for solo gameplay where users can bet on binary outcomes
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // State variables
    IERC20 public immutable usdcToken;
    Counters.Counter private _marketIdCounter;

    // Constants
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
    uint256 public constant PERCENTAGE_DIVISOR = 10000;
    uint256 public constant MIN_BET_AMOUNT = 1; // 0.5 USDC (6 decimals)
    uint256 public constant MAX_BET_AMOUNT = 50000; // 50 USDC (6 decimals)

    // Structs
    struct Market {
        uint256 id;
        string question;
        string description;
        string imageUrl;
        uint256 endTime;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        uint256 totalVolume;
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        address creator;
        uint256 createdAt;
        bool active;
    }

    struct Bet {
        uint256 marketId;
        address bettor;
        bool prediction; // true = YES, false = NO
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        uint256 potentialPayout;
    }

    // Mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet[]) public marketBets;
    mapping(address => Bet[]) public userBets;
    mapping(uint256 => mapping(address => uint256[])) public userMarketBets; // marketId => user => bet indices

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        string question,
        address indexed creator,
        uint256 endTime
    );

    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        bool prediction,
        uint256 amount,
        uint256 potentialPayout
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool outcome,
        uint256 totalVolume
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed winner,
        uint256 payout
    );

    event MarketStatusChanged(
        uint256 indexed marketId,
        bool active
    );

    // Constructor
    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    // Modifiers
    modifier validMarket(uint256 _marketId) {
        require(_marketId < _marketIdCounter.current(), "Market does not exist");
        require(markets[_marketId].active, "Market is not active");
        _;
    }

    modifier marketNotEnded(uint256 _marketId) {
        require(block.timestamp < markets[_marketId].endTime, "Market has ended");
        _;
    }

    modifier marketEnded(uint256 _marketId) {
        require(block.timestamp >= markets[_marketId].endTime, "Market has not ended");
        _;
    }

    modifier marketNotResolved(uint256 _marketId) {
        require(!markets[_marketId].resolved, "Market already resolved");
        _;
    }

    modifier marketResolved(uint256 _marketId) {
        require(markets[_marketId].resolved, "Market not resolved");
        _;
    }

    // Create a new prediction market
    function createMarket(
        string memory _question,
        string memory _description,
        string memory _imageUrl,
        uint256 _durationDays
    ) external onlyOwner returns (uint256) {
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");

        uint256 marketId = _marketIdCounter.current();
        uint256 endTime = block.timestamp + (_durationDays * 1 days);

        markets[marketId] = Market({
            id: marketId,
            question: _question,
            description: _description,
            imageUrl: _imageUrl,
            endTime: endTime,
            totalYesAmount: 0,
            totalNoAmount: 0,
            totalVolume: 0,
            resolved: false,
            outcome: false,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        _marketIdCounter.increment();

        emit MarketCreated(marketId, _question, msg.sender, endTime);
        return marketId;
    }

    // Place a bet on a market
    function placeBet(
        uint256 _marketId,
        bool _prediction,
        uint256 _amount
    ) external validMarket(_marketId) marketNotEnded(_marketId) marketNotResolved(_marketId) nonReentrant {
        require(_amount >= MIN_BET_AMOUNT && _amount <= MAX_BET_AMOUNT, "Invalid bet amount");
        require(usdcToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        Market storage market = markets[_marketId];

        // Calculate potential payout based on current odds
        uint256 potentialPayout = calculatePayout(_marketId, _prediction, _amount);

        // Create bet
        Bet memory newBet = Bet({
            marketId: _marketId,
            bettor: msg.sender,
            prediction: _prediction,
            amount: _amount,
            timestamp: block.timestamp,
            claimed: false,
            potentialPayout: potentialPayout
        });

        // Update market totals
        if (_prediction) {
            market.totalYesAmount += _amount;
        } else {
            market.totalNoAmount += _amount;
        }
        market.totalVolume += _amount;

        // Store bet
        marketBets[_marketId].push(newBet);
        userBets[msg.sender].push(newBet);
        userMarketBets[_marketId][msg.sender].push(marketBets[_marketId].length - 1);

        emit BetPlaced(_marketId, msg.sender, _prediction, _amount, potentialPayout);
    }

    // Calculate potential payout for a bet
    function calculatePayout(
        uint256 _marketId,
        bool _prediction,
        uint256 _amount
    ) public view returns (uint256) {
        Market memory market = markets[_marketId];

        uint256 totalPool = market.totalYesAmount + market.totalNoAmount;
        if (totalPool == 0) {
            // If no bets yet, return 2x payout (50/50 odds)
            return _amount * 2;
        }

        uint256 favoredSide = _prediction ? market.totalYesAmount : market.totalNoAmount;
        uint256 opposingSide = _prediction ? market.totalNoAmount : market.totalYesAmount;

        if (opposingSide == 0) {
            // If no opposing bets, return minimum payout
            return (_amount * 105) / 100; // 1.05x
        }

        // Calculate odds-based payout: (total pool - platform fee) * (bet amount / favored side)
        uint256 platformFee = (totalPool * PLATFORM_FEE_PERCENTAGE) / PERCENTAGE_DIVISOR;
        uint256 netPool = totalPool - platformFee;
        uint256 payout = (netPool * _amount) / (favoredSide + _amount);

        return payout;
    }

    // Resolve a market (only owner)
    function resolveMarket(
        uint256 _marketId,
        bool _outcome
    ) external onlyOwner validMarket(_marketId) marketEnded(_marketId) marketNotResolved(_marketId) {
        markets[_marketId].resolved = true;
        markets[_marketId].outcome = _outcome;

        emit MarketResolved(_marketId, _outcome, markets[_marketId].totalVolume);
    }

    // Claim winnings for a specific bet
    function claimWinnings(uint256 _marketId, uint256 _betIndex)
        external validMarket(_marketId) marketResolved(_marketId) nonReentrant {

        Bet[] storage bets = marketBets[_marketId];
        require(_betIndex < bets.length, "Invalid bet index");

        Bet storage bet = bets[_betIndex];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        require(bet.prediction == markets[_marketId].outcome, "Bet did not win");

        bet.claimed = true;
        uint256 payout = bet.potentialPayout;

        require(usdcToken.transfer(msg.sender, payout), "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, payout);
    }

    // Claim all winnings for a user in a market
    function claimAllWinnings(uint256 _marketId) external validMarket(_marketId) marketResolved(_marketId) nonReentrant {
        uint256[] storage userBetIndices = userMarketBets[_marketId][msg.sender];
        require(userBetIndices.length > 0, "No bets found");

        uint256 totalPayout = 0;
        bool outcome = markets[_marketId].outcome;

        for (uint256 i = 0; i < userBetIndices.length; i++) {
            uint256 betIndex = userBetIndices[i];
            Bet storage bet = marketBets[_marketId][betIndex];

            if (!bet.claimed && bet.prediction == outcome) {
                bet.claimed = true;
                totalPayout += bet.potentialPayout;
            }
        }

        require(totalPayout > 0, "No winnings to claim");
        require(usdcToken.transfer(msg.sender, totalPayout), "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, totalPayout);
    }

    // Get market information
    function getMarket(uint256 _marketId) external view returns (Market memory) {
        require(_marketId < _marketIdCounter.current(), "Market does not exist");
        return markets[_marketId];
    }

    // Get market odds (yes price, no price)
    function getMarketOdds(uint256 _marketId) external view returns (uint256 yesPrice, uint256 noPrice) {
        Market memory market = markets[_marketId];
        uint256 totalPool = market.totalYesAmount + market.totalNoAmount;

        if (totalPool == 0) {
            return (50, 50); // 50/50 odds if no bets
        }

        yesPrice = (market.totalYesAmount * 100) / totalPool;
        noPrice = (market.totalNoAmount * 100) / totalPool;
    }

    // Get user's bets for a specific market
    function getUserMarketBets(uint256 _marketId, address _user) external view returns (Bet[] memory) {
        uint256[] memory userBetIndices = userMarketBets[_marketId][_user];
        Bet[] memory userBetsInMarket = new Bet[](userBetIndices.length);

        for (uint256 i = 0; i < userBetIndices.length; i++) {
            userBetsInMarket[i] = marketBets[_marketId][userBetIndices[i]];
        }

        return userBetsInMarket;
    }

    // Get all active markets
    function getActiveMarkets() external view returns (Market[] memory) {
        uint256 activeCount = 0;
        uint256 totalMarkets = _marketIdCounter.current();

        // Count active markets
        for (uint256 i = 0; i < totalMarkets; i++) {
            if (markets[i].active && !markets[i].resolved && block.timestamp < markets[i].endTime) {
                activeCount++;
            }
        }

        // Build array of active markets
        Market[] memory activeMarkets = new Market[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalMarkets; i++) {
            if (markets[i].active && !markets[i].resolved && block.timestamp < markets[i].endTime) {
                activeMarkets[index] = markets[i];
                index++;
            }
        }

        return activeMarkets;
    }

    // Admin function to toggle market status
    function toggleMarketStatus(uint256 _marketId) external onlyOwner {
        require(_marketId < _marketIdCounter.current(), "Market does not exist");
        markets[_marketId].active = !markets[_marketId].active;
        emit MarketStatusChanged(_marketId, markets[_marketId].active);
    }

    // Admin function to withdraw platform fees
    function withdrawFees() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(usdcToken.transfer(owner(), balance), "Transfer failed");
    }

    // Get total number of markets
    function getTotalMarkets() external view returns (uint256) {
        return _marketIdCounter.current();
    }
}