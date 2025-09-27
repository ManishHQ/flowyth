// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract CryptoFantasyLeagueV2 {
    IPyth public immutable pyth;

    // Squad structure - simplified, no positions
    struct Squad {
        bytes32[6] cryptoIds; // Any 6 cryptos from supported list
        address owner;
        uint256 registrationTime;
    }

    // Tournament structure
    struct Tournament {
        uint256 id;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 registrationDeadline;
        uint256 prizePool;
        address[] participants;
        bool isActive;
        bool isFinalized;
        bool hasStarted;
        mapping(address => bool) hasRegistered;
        mapping(address => Squad) squads;
        mapping(bytes32 => int64) startPrices;
        mapping(bytes32 => int64) endPrices;
        uint256 startPriceTimestamp;
        uint256 endPriceTimestamp;
    }

    // Crypto asset structure - simplified
    struct CryptoAsset {
        bytes32 pythId;
        string symbol;
        string name;
        bool isActive;
    }

    // State variables
    uint256 public tournamentCounter;
    uint256 public constant MAX_PARTICIPANTS = 20;
    uint256 public constant TOURNAMENT_DURATION = 15 minutes;
    uint256 public constant REGISTRATION_PERIOD = 30 minutes;
    uint256 public constant AUTO_CREATE_INTERVAL = 2 hours;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant CREATOR_FEE_BPS = 500; // 5%

    address public owner;
    uint256 public lastAutoTournamentTime;

    mapping(uint256 => Tournament) public tournaments;
    mapping(bytes32 => CryptoAsset) public cryptoAssets;
    bytes32[] public supportedCryptos;

    // Events
    event TournamentAutoCreated(uint256 indexed tournamentId, uint256 startTime, uint256 endTime);
    event PlayerRegistered(uint256 indexed tournamentId, address indexed player, bytes32[6] squad);
    event TournamentStarted(uint256 indexed tournamentId, uint256 timestamp, uint256 participantCount);
    event TournamentFinalized(uint256 indexed tournamentId, address[3] winners, uint256[3] prizes);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier validTournament(uint256 tournamentId) {
        require(tournamentId < tournamentCounter, "Invalid tournament");
        _;
    }

    constructor(address _pyth) {
        pyth = IPyth(_pyth);
        owner = msg.sender;
        lastAutoTournamentTime = block.timestamp;
        _initializeCryptoAssets();

        // Create first auto tournament
        _createAutoTournament();
    }

    function _initializeCryptoAssets() private {
        // Major cryptocurrencies with real Pyth price feed IDs
        _addCryptoAsset(0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43, "BTC", "Bitcoin");
        _addCryptoAsset(0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, "ETH", "Ethereum");
        _addCryptoAsset(0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d, "SOL", "Solana");
        _addCryptoAsset(0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f, "ADA", "Cardano");
        _addCryptoAsset(0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221, "LINK", "Chainlink");
        _addCryptoAsset(0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6, "DOT", "Polkadot");
        _addCryptoAsset(0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52, "MATIC", "Polygon");
        _addCryptoAsset(0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7, "AVAX", "Avalanche");
        _addCryptoAsset(0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c, "DOGE", "Dogecoin");
        _addCryptoAsset(0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, "USDC", "USD Coin");

        // Add more cryptos up to 50 - using placeholder IDs for now
        for (uint256 i = 10; i < 50; i++) {
            bytes32 placeholderId = bytes32(i);
            _addCryptoAsset(placeholderId, string(abi.encodePacked("CRYPTO", i)), string(abi.encodePacked("Crypto Asset ", i)));
        }
    }

    function _addCryptoAsset(bytes32 pythId, string memory symbol, string memory name) private {
        cryptoAssets[pythId] = CryptoAsset({
            pythId: pythId,
            symbol: symbol,
            name: name,
            isActive: true
        });
        supportedCryptos.push(pythId);
    }

    // Auto-create tournaments every 2 hours
    function createAutoTournament() external {
        require(block.timestamp >= lastAutoTournamentTime + AUTO_CREATE_INTERVAL, "Too early for auto tournament");
        _createAutoTournament();
    }

    function _createAutoTournament() private {
        uint256 tournamentId = tournamentCounter++;
        Tournament storage tournament = tournaments[tournamentId];

        tournament.id = tournamentId;
        tournament.entryFee = ENTRY_FEE;
        tournament.registrationDeadline = block.timestamp + REGISTRATION_PERIOD;
        tournament.startTime = tournament.registrationDeadline;
        tournament.endTime = tournament.startTime + TOURNAMENT_DURATION;
        tournament.isActive = true;
        tournament.isFinalized = false;
        tournament.hasStarted = false;

        lastAutoTournamentTime = block.timestamp;

        emit TournamentAutoCreated(tournamentId, tournament.startTime, tournament.endTime);
    }

    function registerForTournament(uint256 tournamentId, bytes32[6] calldata squadCryptoIds)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp < tournament.registrationDeadline, "Registration closed");
        require(!tournament.hasRegistered[msg.sender], "Already registered");
        require(tournament.participants.length < MAX_PARTICIPANTS, "Tournament full");
        require(msg.value == tournament.entryFee, "Incorrect entry fee");
        require(_isValidSquad(squadCryptoIds), "Invalid squad");

        tournament.hasRegistered[msg.sender] = true;
        tournament.participants.push(msg.sender);
        tournament.prizePool += msg.value;

        tournament.squads[msg.sender] = Squad({
            cryptoIds: squadCryptoIds,
            owner: msg.sender,
            registrationTime: block.timestamp
        });

        emit PlayerRegistered(tournamentId, msg.sender, squadCryptoIds);
    }

    function _isValidSquad(bytes32[6] calldata cryptoIds) private view returns (bool) {
        // Check for duplicates
        for (uint256 i = 0; i < 6; i++) {
            for (uint256 j = i + 1; j < 6; j++) {
                if (cryptoIds[i] == cryptoIds[j]) return false;
            }
        }

        // Check all cryptos are supported and active
        for (uint256 i = 0; i < 6; i++) {
            if (!cryptoAssets[cryptoIds[i]].isActive) return false;
        }

        return true;
    }

    function startTournament(uint256 tournamentId, bytes[] calldata priceUpdateData)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp >= tournament.startTime, "Too early to start");
        require(!tournament.hasStarted, "Already started");
        require(tournament.participants.length >= 2, "Need at least 2 participants");

        // Update Pyth prices
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient update fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record start prices for all cryptos used in tournament
        _recordStartPrices(tournamentId);

        tournament.hasStarted = true;
        tournament.startPriceTimestamp = block.timestamp;

        emit TournamentStarted(tournamentId, block.timestamp, tournament.participants.length);
    }

    function finalizeTournament(uint256 tournamentId, bytes[] calldata priceUpdateData)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.hasStarted, "Tournament not started");
        require(block.timestamp >= tournament.endTime, "Tournament not ended");
        require(!tournament.isFinalized, "Already finalized");

        // Update Pyth prices
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient update fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record end prices
        _recordEndPrices(tournamentId);
        tournament.endPriceTimestamp = block.timestamp;

        // Calculate winners and distribute prizes
        (address[3] memory winners, uint256[3] memory prizes) = _calculateWinners(tournamentId);
        _distributePrizes(tournamentId, winners, prizes);

        tournament.isFinalized = true;
        tournament.isActive = false;

        emit TournamentFinalized(tournamentId, winners, prizes);
    }

    function _recordStartPrices(uint256 tournamentId) private {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory tournamentCryptos = _getTournamentCryptos(tournamentId);

        for (uint256 i = 0; i < tournamentCryptos.length; i++) {
            bytes32 cryptoId = tournamentCryptos[i];
            PythStructs.Price memory price = pyth.getPriceNoOlderThan(cryptoId, 300); // Max 5 minutes old
            tournament.startPrices[cryptoId] = price.price;
        }
    }

    function _recordEndPrices(uint256 tournamentId) private {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory tournamentCryptos = _getTournamentCryptos(tournamentId);

        for (uint256 i = 0; i < tournamentCryptos.length; i++) {
            bytes32 cryptoId = tournamentCryptos[i];
            PythStructs.Price memory price = pyth.getPriceNoOlderThan(cryptoId, 300); // Max 5 minutes old
            tournament.endPrices[cryptoId] = price.price;
        }
    }

    function _getTournamentCryptos(uint256 tournamentId) private view returns (bytes32[] memory) {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 participantCount = tournament.participants.length;

        // Collect all unique cryptos used in this tournament
        bytes32[] memory tempCryptos = new bytes32[](participantCount * 6);
        uint256 uniqueCount = 0;

        for (uint256 i = 0; i < participantCount; i++) {
            Squad memory squad = tournament.squads[tournament.participants[i]];
            for (uint256 j = 0; j < 6; j++) {
                bytes32 cryptoId = squad.cryptoIds[j];

                // Check if already added
                bool isUnique = true;
                for (uint256 k = 0; k < uniqueCount; k++) {
                    if (tempCryptos[k] == cryptoId) {
                        isUnique = false;
                        break;
                    }
                }

                if (isUnique) {
                    tempCryptos[uniqueCount] = cryptoId;
                    uniqueCount++;
                }
            }
        }

        // Create final array with correct size
        bytes32[] memory uniqueCryptos = new bytes32[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            uniqueCryptos[i] = tempCryptos[i];
        }

        return uniqueCryptos;
    }

    function _calculateWinners(uint256 tournamentId) private view returns (address[3] memory winners, uint256[3] memory prizes) {
        Tournament storage tournament = tournaments[tournamentId];
        address[] memory participants = tournament.participants;
        int256[] memory scores = new int256[](participants.length);

        // Calculate scores for all participants
        for (uint256 i = 0; i < participants.length; i++) {
            scores[i] = _calculateSquadScore(tournamentId, participants[i]);
        }

        // Find top 3 scores
        uint256[3] memory topIndices;
        int256[3] memory topScores = [int256(-2**255), int256(-2**255), int256(-2**255)];

        for (uint256 i = 0; i < participants.length; i++) {
            if (scores[i] > topScores[0]) {
                topScores[2] = topScores[1];
                topScores[1] = topScores[0];
                topScores[0] = scores[i];
                topIndices[2] = topIndices[1];
                topIndices[1] = topIndices[0];
                topIndices[0] = i;
            } else if (scores[i] > topScores[1]) {
                topScores[2] = topScores[1];
                topScores[1] = scores[i];
                topIndices[2] = topIndices[1];
                topIndices[1] = i;
            } else if (scores[i] > topScores[2]) {
                topScores[2] = scores[i];
                topIndices[2] = i;
            }
        }

        // Assign winners
        for (uint256 i = 0; i < 3; i++) {
            if (topIndices[i] < participants.length) {
                winners[i] = participants[topIndices[i]];
            }
        }

        // Calculate prize distribution: 50%, 30%, 20%
        uint256 totalPrize = tournament.prizePool * (10000 - CREATOR_FEE_BPS) / 10000;
        prizes[0] = totalPrize * 50 / 100;  // 1st place: 50%
        prizes[1] = totalPrize * 30 / 100;  // 2nd place: 30%
        prizes[2] = totalPrize * 20 / 100;  // 3rd place: 20%
    }

    function _calculateSquadScore(uint256 tournamentId, address participant) private view returns (int256) {
        Tournament storage tournament = tournaments[tournamentId];
        Squad memory squad = tournament.squads[participant];
        int256 totalScore = 0;

        for (uint256 i = 0; i < 6; i++) {
            bytes32 cryptoId = squad.cryptoIds[i];
            int64 startPrice = tournament.startPrices[cryptoId];
            int64 endPrice = tournament.endPrices[cryptoId];

            if (startPrice != 0 && endPrice != 0) {
                // Calculate percentage change (in basis points)
                // No multipliers - pure price performance
                int256 priceChange = ((int256(endPrice) - int256(startPrice)) * 10000) / int256(startPrice);
                totalScore += priceChange;
            }
        }

        return totalScore;
    }

    function _distributePrizes(uint256 tournamentId, address[3] memory winners, uint256[3] memory prizes) private {
        Tournament storage tournament = tournaments[tournamentId];

        // Pay winners
        for (uint256 i = 0; i < 3; i++) {
            if (winners[i] != address(0) && prizes[i] > 0) {
                payable(winners[i]).transfer(prizes[i]);
            }
        }

        // Pay creator fee to owner
        uint256 creatorFee = tournament.prizePool * CREATOR_FEE_BPS / 10000;
        if (creatorFee > 0) {
            payable(owner).transfer(creatorFee);
        }
    }

    // View functions
    function getTournamentInfo(uint256 tournamentId) external view validTournament(tournamentId) returns (
        uint256 id,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime,
        uint256 registrationDeadline,
        uint256 prizePool,
        uint256 participantCount,
        bool isActive,
        bool isFinalized,
        bool hasStarted
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.id,
            tournament.entryFee,
            tournament.startTime,
            tournament.endTime,
            tournament.registrationDeadline,
            tournament.prizePool,
            tournament.participants.length,
            tournament.isActive,
            tournament.isFinalized,
            tournament.hasStarted
        );
    }

    function getSquad(uint256 tournamentId, address participant) external view validTournament(tournamentId) returns (bytes32[6] memory) {
        return tournaments[tournamentId].squads[participant].cryptoIds;
    }

    function getSupportedCryptos() external view returns (bytes32[] memory) {
        return supportedCryptos;
    }

    function getCryptoAsset(bytes32 pythId) external view returns (CryptoAsset memory) {
        return cryptoAssets[pythId];
    }

    function getActiveSquadScore(uint256 tournamentId, address participant) external view returns (int256) {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.hasStarted, "Tournament not started");
        return _calculateSquadScore(tournamentId, participant);
    }

    function getCurrentPrice(bytes32 pythId) external view returns (PythStructs.Price memory) {
        return pyth.getPriceNoOlderThan(pythId, 60);
    }

    function timeUntilNextAutoTournament() external view returns (uint256) {
        uint256 nextTime = lastAutoTournamentTime + AUTO_CREATE_INTERVAL;
        if (block.timestamp >= nextTime) {
            return 0;
        }
        return nextTime - block.timestamp;
    }
}