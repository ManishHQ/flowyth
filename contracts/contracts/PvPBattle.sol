// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PvPBattle
 * @dev A decentralized PvP battle contract where players bet USDC on crypto price movements
 */
contract PvPBattle is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // State variables
    IERC20 public immutable usdcToken;
    Counters.Counter private _battleIdCounter;

    // Constants
    uint256 public constant BET_AMOUNT = 5 * 10**6; // Fixed $5 USDC (6 decimals)
    uint256 public constant TOTAL_PRIZE = 10 * 10**6; // $10 USDC total prize (6 decimals)
    uint256 public constant MIN_BATTLE_DURATION = 30; // 30 seconds
    uint256 public constant MAX_BATTLE_DURATION = 300; // 5 minutes

    // Enums
    enum BattleStatus {
        Created,        // Creator has created and deposited
        WaitingOpponent, // Waiting for opponent to join
        Active,         // Both players joined, battle is active
        Finished,       // Battle finished, winner determined
        Cancelled,      // Battle cancelled, funds returned
        Claimed         // Winner has claimed the prize
    }

    // Structs
    struct Battle {
        uint256 id;
        address creator;
        address opponent;
        uint256 betAmount;          // Amount each player bets (in USDC) - fixed $5
        uint256 totalPrizePool;     // Total prize pool - fixed $10
        uint256 duration;           // Battle duration in seconds
        string creatorCoin;         // Creator's chosen coin symbol
        string opponentCoin;        // Opponent's chosen coin symbol
        uint256 createdAt;
        uint256 startedAt;          // When both players joined
        uint256 finishedAt;         // When battle finished
        BattleStatus status;
        address winner;             // Winner address (zero address if tie)
        string inviteCode;          // 6-character invite code

        // Price tracking (set by oracle/backend)
        uint256 creatorStartPrice;  // Creator's coin start price (scaled by 1e8)
        uint256 creatorEndPrice;    // Creator's coin end price (scaled by 1e8)
        uint256 opponentStartPrice; // Opponent's coin start price (scaled by 1e8)
        uint256 opponentEndPrice;   // Opponent's coin end price (scaled by 1e8)

        bool creatorClaimed;        // Has creator claimed their funds
        bool opponentClaimed;       // Has opponent claimed their funds
    }

    // Storage
    mapping(uint256 => Battle) public battles;
    mapping(string => uint256) public inviteCodeToBattleId;
    mapping(address => uint256[]) public userBattles;

    // Oracle/Backend address that can set prices
    address public priceOracle;

    // Room info
    string public roomId;
    bool public battleCreated;

    // Events
    event BattleCreated(
        uint256 indexed battleId,
        address indexed creator,
        uint256 betAmount,
        uint256 duration,
        string inviteCode
    );

    event BattleJoined(
        uint256 indexed battleId,
        address indexed opponent,
        uint256 startTime
    );

    event BattleStarted(
        uint256 indexed battleId,
        string creatorCoin,
        string opponentCoin,
        uint256 creatorStartPrice,
        uint256 opponentStartPrice
    );

    event BattleFinished(
        uint256 indexed battleId,
        address indexed winner,
        uint256 creatorEndPrice,
        uint256 opponentEndPrice,
        uint256 finishedAt
    );

    event BattleCancelled(uint256 indexed battleId);

    event PrizeClaimed(
        uint256 indexed battleId,
        address indexed winner,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed battleId,
        address indexed player,
        uint256 amount
    );

    // Modifiers
    modifier onlyPriceOracle() {
        require(msg.sender == priceOracle, "Only price oracle can call this");
        _;
    }

    modifier battleExists(uint256 battleId) {
        require(battles[battleId].id == battleId, "Battle does not exist");
        _;
    }

    // Constructor
    constructor(address _usdcToken, address _priceOracle, string memory _roomId) {
        usdcToken = IERC20(_usdcToken);
        priceOracle = _priceOracle;
        roomId = _roomId;
        battleCreated = false;
        _battleIdCounter.increment(); // Start from ID 1
    }

    /**
     * @dev Create a new PvP battle with fixed $5 bet
     * @param duration Battle duration in seconds
     * @param inviteCode 6-character invite code
     */
    function createBattle(
        uint256 duration,
        string calldata inviteCode
    ) external nonReentrant returns (uint256) {
        require(!battleCreated, "Battle already created for this room");
        require(duration >= MIN_BATTLE_DURATION, "Duration too short");
        require(duration <= MAX_BATTLE_DURATION, "Duration too long");
        require(bytes(inviteCode).length == 6, "Invite code must be 6 characters");
        require(inviteCodeToBattleId[inviteCode] == 0, "Invite code already used");

        uint256 battleId = _battleIdCounter.current();
        _battleIdCounter.increment();

        // Transfer fixed $5 USDC from creator
        require(
            usdcToken.transferFrom(msg.sender, address(this), BET_AMOUNT),
            "USDC transfer failed"
        );

        battles[battleId] = Battle({
            id: battleId,
            creator: msg.sender,
            opponent: address(0),
            betAmount: BET_AMOUNT,
            totalPrizePool: TOTAL_PRIZE,
            duration: duration,
            creatorCoin: "",
            opponentCoin: "",
            createdAt: block.timestamp,
            startedAt: 0,
            finishedAt: 0,
            status: BattleStatus.Created,
            winner: address(0),
            inviteCode: inviteCode,
            creatorStartPrice: 0,
            creatorEndPrice: 0,
            opponentStartPrice: 0,
            opponentEndPrice: 0,
            creatorClaimed: false,
            opponentClaimed: false
        });

        inviteCodeToBattleId[inviteCode] = battleId;
        userBattles[msg.sender].push(battleId);
        battleCreated = true;

        battles[battleId].status = BattleStatus.WaitingOpponent;

        emit BattleCreated(battleId, msg.sender, BET_AMOUNT, duration, inviteCode);

        return battleId;
    }

    /**
     * @dev Join an existing battle using invite code
     * @param inviteCode 6-character invite code
     */
    function joinBattle(string calldata inviteCode) external nonReentrant returns (uint256) {
        uint256 battleId = inviteCodeToBattleId[inviteCode];
        require(battleId != 0, "Invalid invite code");

        Battle storage battle = battles[battleId];
        require(battle.status == BattleStatus.WaitingOpponent, "Battle not available");
        require(battle.creator != msg.sender, "Cannot join your own battle");

        // Transfer fixed $5 USDC from opponent
        require(
            usdcToken.transferFrom(msg.sender, address(this), BET_AMOUNT),
            "USDC transfer failed"
        );

        battle.opponent = msg.sender;
        battle.startedAt = block.timestamp;
        battle.status = BattleStatus.Active;

        userBattles[msg.sender].push(battleId);

        emit BattleJoined(battleId, msg.sender, block.timestamp);

        return battleId;
    }

    /**
     * @dev Set coin selections and start prices (called by oracle)
     * @param battleId Battle ID
     * @param creatorCoin Creator's coin symbol
     * @param opponentCoin Opponent's coin symbol
     * @param creatorStartPrice Creator's coin start price
     * @param opponentStartPrice Opponent's coin start price
     */
    function startBattle(
        uint256 battleId,
        string calldata creatorCoin,
        string calldata opponentCoin,
        uint256 creatorStartPrice,
        uint256 opponentStartPrice
    ) external onlyPriceOracle battleExists(battleId) {
        Battle storage battle = battles[battleId];
        require(battle.status == BattleStatus.Active, "Battle not active");
        require(creatorStartPrice > 0, "Invalid creator start price");
        require(opponentStartPrice > 0, "Invalid opponent start price");

        battle.creatorCoin = creatorCoin;
        battle.opponentCoin = opponentCoin;
        battle.creatorStartPrice = creatorStartPrice;
        battle.opponentStartPrice = opponentStartPrice;

        emit BattleStarted(
            battleId,
            creatorCoin,
            opponentCoin,
            creatorStartPrice,
            opponentStartPrice
        );
    }

    /**
     * @dev Finish battle and determine winner (called by oracle)
     * @param battleId Battle ID
     * @param creatorEndPrice Creator's coin end price
     * @param opponentEndPrice Opponent's coin end price
     */
    function finishBattle(
        uint256 battleId,
        uint256 creatorEndPrice,
        uint256 opponentEndPrice
    ) external onlyPriceOracle battleExists(battleId) {
        Battle storage battle = battles[battleId];
        require(battle.status == BattleStatus.Active, "Battle not active");
        require(creatorEndPrice > 0, "Invalid creator end price");
        require(opponentEndPrice > 0, "Invalid opponent end price");

        battle.creatorEndPrice = creatorEndPrice;
        battle.opponentEndPrice = opponentEndPrice;
        battle.finishedAt = block.timestamp;
        battle.status = BattleStatus.Finished;

        // Calculate percentage changes
        int256 creatorChange = (int256(creatorEndPrice) - int256(battle.creatorStartPrice)) * 10000 / int256(battle.creatorStartPrice);
        int256 opponentChange = (int256(opponentEndPrice) - int256(battle.opponentStartPrice)) * 10000 / int256(battle.opponentStartPrice);

        // Determine winner (creator wins on tie)
        if (creatorChange >= opponentChange) {
            battle.winner = battle.creator;
        } else {
            battle.winner = battle.opponent;
        }

        emit BattleFinished(
            battleId,
            battle.winner,
            creatorEndPrice,
            opponentEndPrice,
            block.timestamp
        );
    }

    /**
     * @dev Claim prize (winner takes all)
     * @param battleId Battle ID
     */
    function claimPrize(uint256 battleId) external nonReentrant battleExists(battleId) {
        Battle storage battle = battles[battleId];
        require(battle.status == BattleStatus.Finished, "Battle not finished");
        require(battle.winner == msg.sender, "Only winner can claim");
        require(!battle.creatorClaimed && !battle.opponentClaimed, "Already claimed");

        if (msg.sender == battle.creator) {
            battle.creatorClaimed = true;
        } else {
            battle.opponentClaimed = true;
        }

        battle.status = BattleStatus.Claimed;

        require(
            usdcToken.transfer(msg.sender, TOTAL_PRIZE),
            "Prize transfer failed"
        );

        emit PrizeClaimed(battleId, msg.sender, TOTAL_PRIZE);
    }

    /**
     * @dev Cancel battle (only if no opponent joined)
     * @param battleId Battle ID
     */
    function cancelBattle(uint256 battleId) external nonReentrant battleExists(battleId) {
        Battle storage battle = battles[battleId];
        require(battle.creator == msg.sender, "Only creator can cancel");
        require(battle.status == BattleStatus.WaitingOpponent, "Cannot cancel after opponent joined");

        battle.status = BattleStatus.Cancelled;

        require(
            usdcToken.transfer(msg.sender, BET_AMOUNT),
            "Refund transfer failed"
        );

        emit BattleCancelled(battleId);
        emit RefundClaimed(battleId, msg.sender, BET_AMOUNT);
    }

    // View functions
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }

    function getBattleByInviteCode(string calldata inviteCode) external view returns (Battle memory) {
        uint256 battleId = inviteCodeToBattleId[inviteCode];
        require(battleId != 0, "Invalid invite code");
        return battles[battleId];
    }

    function getUserBattles(address user) external view returns (uint256[] memory) {
        return userBattles[user];
    }

    function getCurrentBattleId() external view returns (uint256) {
        return _battleIdCounter.current();
    }

    // Admin functions
    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = _priceOracle;
    }

    function getRoomId() external view returns (string memory) {
        return roomId;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(
            usdcToken.transfer(msg.sender, balance),
            "Emergency withdrawal failed"
        );
    }
}