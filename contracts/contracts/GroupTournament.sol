// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract GroupTournament {
    IPyth public immutable pyth;

    enum TournamentState {
        REGISTRATION,
        ACTIVE,
        FINISHED,
        FINALIZED
    }

    struct Group {
        uint256 id;
        address[] participants;
        mapping(address => bool) hasParticipant;
        mapping(address => Squad) squads;
        mapping(address => int256) finalScores;
        address[3] winners; // Top 3 winners
        uint256[3] prizes;  // Prize amounts for top 3
        bool isFinalized;
    }

    struct Squad {
        bytes32[6] cryptoIds;
        address owner;
        uint256 registrationTime;
        bool isActive;
    }

    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 registrationStart;
        uint256 registrationEnd;
        uint256 startTime;
        uint256 endTime;
        uint256 duration;
        uint256 maxParticipants;
        uint256 minParticipantsPerGroup;
        TournamentState state;

        address[] allParticipants;
        mapping(address => bool) hasRegistered;
        mapping(address => uint256) participantToGroup;

        uint256 groupCount;
        mapping(uint256 => Group) groups;

        // Price tracking
        mapping(bytes32 => int64) startPrices;
        mapping(bytes32 => int64) endPrices;
        uint256 startPriceTimestamp;
        uint256 endPriceTimestamp;

        // Prize pool
        uint256 totalPrizePool;
        uint256 prizePerGroup;
    }

    struct CryptoAsset {
        bytes32 pythId;
        string symbol;
        string name;
        bool isActive;
    }

    // State variables
    uint256 public tournamentCounter;
    uint256 public constant CREATOR_FEE_BPS = 500; // 5%
    address public owner;

    mapping(uint256 => Tournament) public tournaments;
    mapping(bytes32 => CryptoAsset) public cryptoAssets;
    bytes32[] public supportedCryptos;

    // Events
    event TournamentCreated(
        uint256 indexed tournamentId,
        string name,
        uint256 entryFee,
        uint256 registrationStart,
        uint256 registrationEnd,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants
    );

    event PlayerRegistered(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 groupId,
        bytes32[6] squad
    );

    event TournamentStarted(
        uint256 indexed tournamentId,
        uint256 timestamp,
        uint256 totalParticipants,
        uint256 groupCount
    );

    event TournamentFinished(
        uint256 indexed tournamentId,
        uint256 timestamp
    );

    event GroupFinalized(
        uint256 indexed tournamentId,
        uint256 indexed groupId,
        address[3] winners,
        uint256[3] prizes
    );

    event TournamentFinalized(
        uint256 indexed tournamentId,
        uint256 totalPayout
    );

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
        // Major cryptocurrencies with real Pyth price feed IDs
        _addCryptoAsset(0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43, "BTC", "Bitcoin");
        _addCryptoAsset(0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, "ETH", "Ethereum");
        _addCryptoAsset(0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d, "SOL", "Solana");
        _addCryptoAsset(0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221, "LINK", "Chainlink");
        _addCryptoAsset(0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f, "ADA", "Cardano");
        _addCryptoAsset(0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6, "DOT", "Polkadot");
        _addCryptoAsset(0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52, "MATIC", "Polygon");
        _addCryptoAsset(0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7, "AVAX", "Avalanche");
        _addCryptoAsset(0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c, "DOGE", "Dogecoin");
        _addCryptoAsset(0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b, "USDT", "Tether");
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

    function createTournament(
        string memory name,
        uint256 entryFee,
        uint256 registrationDuration,
        uint256 tournamentDuration,
        uint256 maxParticipants,
        uint256 minParticipantsPerGroup
    ) external onlyOwner returns (uint256) {
        require(minParticipantsPerGroup >= 5, "Min 5 participants per group required");
        require(maxParticipants >= minParticipantsPerGroup, "Invalid participant limits");

        uint256 tournamentId = tournamentCounter++;
        Tournament storage tournament = tournaments[tournamentId];

        tournament.id = tournamentId;
        tournament.name = name;
        tournament.entryFee = entryFee;
        tournament.registrationStart = block.timestamp;
        tournament.registrationEnd = block.timestamp + registrationDuration;
        tournament.startTime = tournament.registrationEnd;
        tournament.endTime = tournament.startTime + tournamentDuration;
        tournament.duration = tournamentDuration;
        tournament.maxParticipants = maxParticipants;
        tournament.minParticipantsPerGroup = minParticipantsPerGroup;
        tournament.state = TournamentState.REGISTRATION;

        emit TournamentCreated(
            tournamentId,
            name,
            entryFee,
            tournament.registrationStart,
            tournament.registrationEnd,
            tournament.startTime,
            tournament.endTime,
            maxParticipants
        );

        return tournamentId;
    }

    function registerForTournament(
        uint256 tournamentId,
        bytes32[6] calldata squadCryptoIds
    ) external payable validTournament(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.state == TournamentState.REGISTRATION, "Registration closed");
        require(block.timestamp < tournament.registrationEnd, "Registration period ended");
        require(!tournament.hasRegistered[msg.sender], "Already registered");
        require(tournament.allParticipants.length < tournament.maxParticipants, "Tournament full");
        require(msg.value == tournament.entryFee, "Incorrect entry fee");
        require(_isValidSquad(squadCryptoIds), "Invalid squad");

        // Add to tournament
        tournament.hasRegistered[msg.sender] = true;
        tournament.allParticipants.push(msg.sender);
        tournament.totalPrizePool += msg.value;

        // Assign to group (round-robin style)
        uint256 groupId = _assignToGroup(tournamentId, msg.sender);

        // Add squad to group
        Group storage group = tournament.groups[groupId];
        group.squads[msg.sender] = Squad({
            cryptoIds: squadCryptoIds,
            owner: msg.sender,
            registrationTime: block.timestamp,
            isActive: true
        });

        emit PlayerRegistered(tournamentId, msg.sender, groupId, squadCryptoIds);
    }

    function _assignToGroup(uint256 tournamentId, address participant) private returns (uint256) {
        Tournament storage tournament = tournaments[tournamentId];

        // Find a group with space or create new one
        for (uint256 i = 0; i < tournament.groupCount; i++) {
            Group storage group = tournament.groups[i];
            if (group.participants.length < tournament.minParticipantsPerGroup) {
                group.participants.push(participant);
                group.hasParticipant[participant] = true;
                tournament.participantToGroup[participant] = i;
                return i;
            }
        }

        // Create new group
        uint256 newGroupId = tournament.groupCount++;
        Group storage newGroup = tournament.groups[newGroupId];
        newGroup.id = newGroupId;
        newGroup.participants.push(participant);
        newGroup.hasParticipant[participant] = true;
        tournament.participantToGroup[participant] = newGroupId;

        return newGroupId;
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

    function startTournament(
        uint256 tournamentId,
        bytes[] calldata priceUpdateData
    ) external payable validTournament(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.state == TournamentState.REGISTRATION, "Tournament not in registration");
        require(block.timestamp >= tournament.startTime, "Too early to start");
        require(tournament.allParticipants.length >= tournament.minParticipantsPerGroup, "Not enough participants");

        // Update Pyth prices
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient update fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record start prices
        _recordStartPrices(tournamentId);

        // Calculate prize distribution
        uint256 creatorFee = (tournament.totalPrizePool * CREATOR_FEE_BPS) / 10000;
        uint256 playerPrize = tournament.totalPrizePool - creatorFee;
        tournament.prizePerGroup = playerPrize / tournament.groupCount;

        tournament.state = TournamentState.ACTIVE;
        tournament.startPriceTimestamp = block.timestamp;

        emit TournamentStarted(
            tournamentId,
            block.timestamp,
            tournament.allParticipants.length,
            tournament.groupCount
        );
    }

    function finishTournament(
        uint256 tournamentId,
        bytes[] calldata priceUpdateData
    ) external payable validTournament(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.state == TournamentState.ACTIVE, "Tournament not active");
        require(block.timestamp >= tournament.endTime, "Tournament not ended");

        // Update Pyth prices
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient update fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Record end prices
        _recordEndPrices(tournamentId);

        tournament.state = TournamentState.FINISHED;
        tournament.endPriceTimestamp = block.timestamp;

        emit TournamentFinished(tournamentId, block.timestamp);
    }

    function finalizeGroup(uint256 tournamentId, uint256 groupId) external validTournament(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.state == TournamentState.FINISHED, "Tournament not finished");

        Group storage group = tournament.groups[groupId];
        require(!group.isFinalized, "Group already finalized");
        require(group.participants.length >= 3, "Need at least 3 participants for top 3");

        // Calculate scores for all participants in this group
        address[] memory participants = group.participants;
        int256[] memory scores = new int256[](participants.length);

        for (uint256 i = 0; i < participants.length; i++) {
            scores[i] = _calculateSquadScore(tournamentId, groupId, participants[i]);
            group.finalScores[participants[i]] = scores[i];
        }

        // Find top 3 winners
        (address[3] memory winners, uint256[3] memory prizes) = _calculateGroupWinners(
            tournamentId,
            groupId,
            participants,
            scores
        );

        group.winners = winners;
        group.prizes = prizes;
        group.isFinalized = true;

        // Distribute prizes
        _distributeGroupPrizes(winners, prizes);

        emit GroupFinalized(tournamentId, groupId, winners, prizes);
    }

    function finalizeTournament(uint256 tournamentId) external validTournament(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.state == TournamentState.FINISHED, "Tournament not finished");

        // Check all groups are finalized
        for (uint256 i = 0; i < tournament.groupCount; i++) {
            require(tournament.groups[i].isFinalized, "All groups must be finalized first");
        }

        tournament.state = TournamentState.FINALIZED;

        // Pay creator fee
        uint256 creatorFee = (tournament.totalPrizePool * CREATOR_FEE_BPS) / 10000;
        if (creatorFee > 0) {
            payable(owner).transfer(creatorFee);
        }

        emit TournamentFinalized(tournamentId, tournament.totalPrizePool);
    }

    function _recordStartPrices(uint256 tournamentId) private {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory tournamentCryptos = _getTournamentCryptos(tournamentId);

        for (uint256 i = 0; i < tournamentCryptos.length; i++) {
            bytes32 cryptoId = tournamentCryptos[i];
            PythStructs.Price memory price = pyth.getPriceNoOlderThan(cryptoId, 300);
            tournament.startPrices[cryptoId] = price.price;
        }
    }

    function _recordEndPrices(uint256 tournamentId) private {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory tournamentCryptos = _getTournamentCryptos(tournamentId);

        for (uint256 i = 0; i < tournamentCryptos.length; i++) {
            bytes32 cryptoId = tournamentCryptos[i];
            PythStructs.Price memory price = pyth.getPriceNoOlderThan(cryptoId, 300);
            tournament.endPrices[cryptoId] = price.price;
        }
    }

    function _getTournamentCryptos(uint256 tournamentId) private view returns (bytes32[] memory) {
        Tournament storage tournament = tournaments[tournamentId];
        bytes32[] memory temp = new bytes32[](tournament.allParticipants.length * 6);
        uint256 count = 0;

        for (uint256 i = 0; i < tournament.allParticipants.length; i++) {
            address participant = tournament.allParticipants[i];
            uint256 groupId = tournament.participantToGroup[participant];
            Squad memory squad = tournament.groups[groupId].squads[participant];

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

    function _calculateSquadScore(
        uint256 tournamentId,
        uint256 groupId,
        address participant
    ) private view returns (int256) {
        Tournament storage tournament = tournaments[tournamentId];
        Squad memory squad = tournament.groups[groupId].squads[participant];
        int256 totalScore = 0;

        for (uint256 i = 0; i < 6; i++) {
            bytes32 cryptoId = squad.cryptoIds[i];
            int64 startPrice = tournament.startPrices[cryptoId];
            int64 endPrice = tournament.endPrices[cryptoId];

            if (startPrice != 0 && endPrice != 0) {
                // Calculate percentage change (in basis points)
                int256 priceChange = ((int256(endPrice) - int256(startPrice)) * 10000) / int256(startPrice);
                totalScore += priceChange;
            }
        }

        return totalScore;
    }

    function _calculateGroupWinners(
        uint256 tournamentId,
        uint256 groupId,
        address[] memory participants,
        int256[] memory scores
    ) private view returns (address[3] memory winners, uint256[3] memory prizes) {
        Tournament storage tournament = tournaments[tournamentId];

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
        uint256 groupPrize = tournament.prizePerGroup;
        prizes[0] = groupPrize * 50 / 100;  // 1st place: 50%
        prizes[1] = groupPrize * 30 / 100;  // 2nd place: 30%
        prizes[2] = groupPrize * 20 / 100;  // 3rd place: 20%
    }

    function _distributeGroupPrizes(address[3] memory winners, uint256[3] memory prizes) private {
        for (uint256 i = 0; i < 3; i++) {
            if (winners[i] != address(0) && prizes[i] > 0) {
                payable(winners[i]).transfer(prizes[i]);
            }
        }
    }

    // View functions
    function getTournamentInfo(uint256 tournamentId) external view validTournament(tournamentId) returns (
        uint256 id,
        string memory name,
        uint256 entryFee,
        uint256 registrationStart,
        uint256 registrationEnd,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants,
        uint256 totalParticipants,
        uint256 groupCount,
        TournamentState state,
        uint256 totalPrizePool
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.id,
            tournament.name,
            tournament.entryFee,
            tournament.registrationStart,
            tournament.registrationEnd,
            tournament.startTime,
            tournament.endTime,
            tournament.maxParticipants,
            tournament.allParticipants.length,
            tournament.groupCount,
            tournament.state,
            tournament.totalPrizePool
        );
    }

    function getGroupInfo(uint256 tournamentId, uint256 groupId) external view validTournament(tournamentId) returns (
        uint256 id,
        address[] memory participants,
        address[3] memory winners,
        uint256[3] memory prizes,
        bool isFinalized
    ) {
        Group storage group = tournaments[tournamentId].groups[groupId];
        return (
            group.id,
            group.participants,
            group.winners,
            group.prizes,
            group.isFinalized
        );
    }

    function getParticipantGroup(uint256 tournamentId, address participant) external view validTournament(tournamentId) returns (uint256) {
        return tournaments[tournamentId].participantToGroup[participant];
    }

    function getSquad(uint256 tournamentId, uint256 groupId, address participant) external view validTournament(tournamentId) returns (bytes32[6] memory) {
        return tournaments[tournamentId].groups[groupId].squads[participant].cryptoIds;
    }

    function getParticipantScore(uint256 tournamentId, address participant) external view validTournament(tournamentId) returns (int256) {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 groupId = tournament.participantToGroup[participant];

        if (tournament.state == TournamentState.FINISHED || tournament.state == TournamentState.FINALIZED) {
            return tournament.groups[groupId].finalScores[participant];
        } else if (tournament.state == TournamentState.ACTIVE) {
            return _calculateSquadScore(tournamentId, groupId, participant);
        }

        return 0;
    }

    function getSupportedCryptos() external view returns (bytes32[] memory) {
        return supportedCryptos;
    }

    function getCryptoAsset(bytes32 pythId) external view returns (CryptoAsset memory) {
        return cryptoAssets[pythId];
    }

    function getCurrentPrice(bytes32 pythId) external view returns (PythStructs.Price memory) {
        return pyth.getPriceNoOlderThan(pythId, 60);
    }
}