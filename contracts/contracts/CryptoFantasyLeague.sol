// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract CryptoFantasyLeague {
    IPyth public immutable pyth;

    // Position types for squad formation
    enum Position {
        GOALKEEPER,    // Stablecoin (10x multiplier)
        DEFENDER,      // Blue chip (5x multiplier)
        MIDFIELDER,    // Altcoin (3x multiplier)
        STRIKER        // Meme coin (1x multiplier)
    }

    // Squad formation structure
    struct Squad {
        bytes32[6] cryptoIds; // 1 GK, 2 DEF, 2 MID, 1 STR
        address owner;
        bool isValid;
    }

    // Tournament structure
    struct Tournament {
        uint256 id;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        address[] participants;
        bool isActive;
        bool isFinalized;
        mapping(address => bool) hasRegistered;
        mapping(address => Squad) squads;
        mapping(bytes32 => int64) startPrices;
        mapping(bytes32 => int64) endPrices;
    }

    // Price snapshot for verification
    struct PriceSnapshot {
        bytes32 cryptoId;
        int64 price;
        uint64 conf;
        int32 expo;
        uint publishTime;
    }

    // Crypto metadata
    struct CryptoAsset {
        bytes32 pythId;
        string symbol;
        Position position;
        uint256 multiplier; // in basis points (10000 = 100%)
        bool isActive;
    }

    // State variables
    uint256 public tournamentCounter;
    uint256 public constant MAX_PARTICIPANTS = 20;
    uint256 public constant CREATOR_FEE_BPS = 500; // 5%
    address public owner;

    mapping(uint256 => Tournament) public tournaments;
    mapping(bytes32 => CryptoAsset) public cryptoAssets;
    mapping(Position => bytes32[]) public assetsByPosition;

    // Events
    event TournamentCreated(uint256 indexed tournamentId, uint256 entryFee, uint256 startTime, uint256 endTime);
    event PlayerRegistered(uint256 indexed tournamentId, address indexed player, bytes32[6] squad);
    event TournamentStarted(uint256 indexed tournamentId, uint256 timestamp);
    event TournamentFinalized(uint256 indexed tournamentId, address[3] winners, uint256[3] prizes);
    event PriceSnapshotRecorded(uint256 indexed tournamentId, bytes32 indexed cryptoId, int64 price, uint256 timestamp);

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
        _initializeCryptoAssets();
    }

    function _initializeCryptoAssets() private {
        // Goalkeepers (Stablecoins) - 10x multiplier
        _addCryptoAsset(0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, "USDC", Position.GOALKEEPER, 100000);
        _addCryptoAsset(0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b, "USDT", Position.GOALKEEPER, 100000);
        _addCryptoAsset(0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd, "DAI", Position.GOALKEEPER, 100000);

        // Defenders (Blue Chips) - 5x multiplier
        _addCryptoAsset(0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43, "BTC", Position.DEFENDER, 50000);
        _addCryptoAsset(0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, "ETH", Position.DEFENDER, 50000);

        // Midfielders (Altcoins) - 3x multiplier
        _addCryptoAsset(0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d, "SOL", Position.MIDFIELDER, 30000);
        _addCryptoAsset(0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f, "ADA", Position.MIDFIELDER, 30000);
        _addCryptoAsset(0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221, "LINK", Position.MIDFIELDER, 30000);
        _addCryptoAsset(0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6, "DOT", Position.MIDFIELDER, 30000);
        _addCryptoAsset(0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52, "MATIC", Position.MIDFIELDER, 30000);
        _addCryptoAsset(0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7, "AVAX", Position.MIDFIELDER, 30000);

        // Strikers (Meme Coins) - 1x multiplier
        _addCryptoAsset(0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c, "DOGE", Position.STRIKER, 10000);
        _addCryptoAsset(0xf0d57deca57b3da2fe63a493f4c25925fdfd8edf834b20f93e1f84dbd1504d4a, "SHIB", Position.STRIKER, 10000);
        _addCryptoAsset(0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4, "PEPE", Position.STRIKER, 10000);
    }

    function _addCryptoAsset(bytes32 pythId, string memory symbol, Position position, uint256 multiplier) private {
        cryptoAssets[pythId] = CryptoAsset({
            pythId: pythId,
            symbol: symbol,
            position: position,
            multiplier: multiplier,
            isActive: true
        });
        assetsByPosition[position].push(pythId);
    }

    function createTournament(uint256 entryFee, uint256 duration) external returns (uint256) {
        uint256 tournamentId = tournamentCounter++;
        Tournament storage tournament = tournaments[tournamentId];

        tournament.id = tournamentId;
        tournament.entryFee = entryFee;
        tournament.startTime = block.timestamp + 1 hours; // 1 hour registration period
        tournament.endTime = tournament.startTime + duration;
        tournament.isActive = true;
        tournament.isFinalized = false;

        emit TournamentCreated(tournamentId, entryFee, tournament.startTime, tournament.endTime);
        return tournamentId;
    }

    function registerForTournament(uint256 tournamentId, bytes32[6] calldata squadCryptoIds)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp < tournament.startTime, "Registration closed");
        require(!tournament.hasRegistered[msg.sender], "Already registered");
        require(tournament.participants.length < MAX_PARTICIPANTS, "Tournament full");
        require(msg.value == tournament.entryFee, "Incorrect entry fee");
        require(_isValidSquad(squadCryptoIds), "Invalid squad formation");

        tournament.hasRegistered[msg.sender] = true;
        tournament.participants.push(msg.sender);
        tournament.prizePool += msg.value;

        tournament.squads[msg.sender] = Squad({
            cryptoIds: squadCryptoIds,
            owner: msg.sender,
            isValid: true
        });

        emit PlayerRegistered(tournamentId, msg.sender, squadCryptoIds);
    }

    function _isValidSquad(bytes32[6] calldata cryptoIds) private view returns (bool) {
        // Check squad formation: 1 GK, 2 DEF, 2 MID, 1 STR
        uint256[4] memory positionCounts;

        for (uint256 i = 0; i < 6; i++) {
            CryptoAsset memory asset = cryptoAssets[cryptoIds[i]];
            if (!asset.isActive) return false;
            positionCounts[uint256(asset.position)]++;
        }

        return positionCounts[0] == 1 && // 1 Goalkeeper
               positionCounts[1] == 2 && // 2 Defenders
               positionCounts[2] == 2 && // 2 Midfielders
               positionCounts[3] == 1;   // 1 Striker
    }

    function startTournament(uint256 tournamentId, bytes[] calldata priceUpdateData)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp >= tournament.startTime, "Too early to start");
        require(tournament.participants.length > 0, "No participants");

        // Update price feeds
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee for price update");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record start prices for all unique cryptos in tournament
        _recordPriceSnapshot(tournamentId, true);

        emit TournamentStarted(tournamentId, block.timestamp);
    }

    function finalizeTournament(uint256 tournamentId, bytes[] calldata priceUpdateData)
        external
        payable
        validTournament(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp >= tournament.endTime, "Tournament not ended");
        require(!tournament.isFinalized, "Already finalized");

        // Update price feeds
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee for price update");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record end prices
        _recordPriceSnapshot(tournamentId, false);

        // Calculate scores and determine winners
        (address[3] memory winners, uint256[3] memory prizes) = _calculateWinners(tournamentId);

        // Distribute prizes
        _distributePrizes(tournamentId, winners, prizes);

        tournament.isFinalized = true;
        tournament.isActive = false;

        emit TournamentFinalized(tournamentId, winners, prizes);
    }

    function _recordPriceSnapshot(uint256 tournamentId, bool isStart) private {
        Tournament storage tournament = tournaments[tournamentId];

        // Get all unique crypto IDs from all squads
        bytes32[] memory uniqueCryptos = _getUniqueCryptosInTournament(tournamentId);

        for (uint256 i = 0; i < uniqueCryptos.length; i++) {
            bytes32 cryptoId = uniqueCryptos[i];
            PythStructs.Price memory price = pyth.getPriceNoOlderThan(cryptoId, 60); // Max 60 seconds old

            if (isStart) {
                tournament.startPrices[cryptoId] = price.price;
            } else {
                tournament.endPrices[cryptoId] = price.price;
            }

            emit PriceSnapshotRecorded(tournamentId, cryptoId, price.price, block.timestamp);
        }
    }

    function _getUniqueCryptosInTournament(uint256 tournamentId) private view returns (bytes32[] memory) {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory temp = new bytes32[](tournament.participants.length * 6);
        uint256 count = 0;

        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            Squad memory squad = tournament.squads[participant];

            for (uint256 j = 0; j < 6; j++) {
                bytes32 cryptoId = squad.cryptoIds[j];
                bool exists = false;

                for (uint256 k = 0; k < count; k++) {
                    if (temp[k] == cryptoId) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    temp[count] = cryptoId;
                    count++;
                }
            }
        }

        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }

        return result;
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

        winners[0] = participants[topIndices[0]];
        winners[1] = participants[topIndices[1]];
        winners[2] = participants[topIndices[2]];

        // Calculate prize distribution
        uint256 totalPrize = tournament.prizePool;
        uint256 creatorFee = (totalPrize * CREATOR_FEE_BPS) / 10000;
        uint256 playerPrize = totalPrize - creatorFee;

        prizes[0] = (playerPrize * 6000) / 10000; // 60%
        prizes[1] = (playerPrize * 2500) / 10000; // 25%
        prizes[2] = (playerPrize * 1000) / 10000; // 10%
        // 5% remaining goes to creator

        return (winners, prizes);
    }

    function _calculateSquadScore(uint256 tournamentId, address participant) private view returns (int256) {
        Tournament storage tournament = tournaments[tournamentId];
        Squad memory squad = tournament.squads[participant];
        int256 totalScore = 0;

        for (uint256 i = 0; i < 6; i++) {
            bytes32 cryptoId = squad.cryptoIds[i];
            CryptoAsset memory asset = cryptoAssets[cryptoId];

            int64 startPrice = tournament.startPrices[cryptoId];
            int64 endPrice = tournament.endPrices[cryptoId];

            if (startPrice != 0 && endPrice != 0) {
                // Calculate percentage change (in basis points)
                int256 priceChange = ((int256(endPrice) - int256(startPrice)) * 10000) / int256(startPrice);

                // Apply position multiplier
                int256 positionScore = (priceChange * int256(asset.multiplier)) / 10000;
                totalScore += positionScore;
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

        // Pay creator fee
        uint256 creatorFee = (tournament.prizePool * CREATOR_FEE_BPS) / 10000;
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
        uint256 prizePool,
        uint256 participantCount,
        bool isActive,
        bool isFinalized
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.id,
            tournament.entryFee,
            tournament.startTime,
            tournament.endTime,
            tournament.prizePool,
            tournament.participants.length,
            tournament.isActive,
            tournament.isFinalized
        );
    }

    function getSquad(uint256 tournamentId, address participant) external view validTournament(tournamentId) returns (bytes32[6] memory) {
        return tournaments[tournamentId].squads[participant].cryptoIds;
    }

    function getCryptoAssetsByPosition(Position position) external view returns (bytes32[] memory) {
        return assetsByPosition[position];
    }

    function getCurrentPrice(bytes32 cryptoId) external view returns (PythStructs.Price memory) {
        return pyth.getPriceNoOlderThan(cryptoId, 60);
    }
}