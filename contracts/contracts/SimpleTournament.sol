// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Tournament {
    // Core tournament data
    string public title;
    uint256 public entryFee;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public registrationEndTime;
    uint256 public maxParticipants;
    address public owner;

    // USDC token contract
    IERC20 public usdc;

    // Participants
    address[] public participants;
    mapping(address => bool) public hasRegistered;

    // Groups
    struct Group {
        uint8 groupId;
        address[] participants;
        uint256 prizePool;
        address[3] winners; // 1st, 2nd, 3rd place
        bool prizesDistributed;
        bool isActive;
    }

    mapping(uint8 => Group) public groups;
    uint8 public totalGroups;
    bool public groupsCreated;

    // Tournament status
    enum TournamentStatus { Registration, Live, Finished, Cancelled }
    TournamentStatus public status;

    // Events
    event ParticipantRegistered(address participant);
    event GroupsCreated(uint8 totalGroups);
    event TournamentStarted();
    event TournamentEnded();
    event PrizesDistributed(uint8 groupId, address[3] winners, uint256[3] amounts);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier registrationOpen() {
        require(status == TournamentStatus.Registration, "Registration not open");
        require(block.timestamp < registrationEndTime, "Registration closed");
        require(participants.length < maxParticipants, "Tournament full");
        _;
    }

    constructor(
        string memory _title,
        uint256 _entryFee,
        uint256 _duration,
        uint256 _registrationPeriod,
        uint256 _maxParticipants,
        address _usdcAddress,
        address _owner
    ) {
        title = _title;
        entryFee = _entryFee;
        maxParticipants = _maxParticipants;
        owner = _owner;

        // Set times
        registrationEndTime = block.timestamp + _registrationPeriod;
        startTime = registrationEndTime + 30 minutes; // 30 min buffer for setup
        endTime = startTime + _duration;

        // Set USDC contract
        usdc = IERC20(_usdcAddress);

        // Start in registration mode
        status = TournamentStatus.Registration;
    }

    // Register for tournament
    function register() external registrationOpen {
        require(!hasRegistered[msg.sender], "Already registered");

        // Transfer entry fee
        require(
            usdc.transferFrom(msg.sender, address(this), entryFee),
            "USDC transfer failed"
        );

        participants.push(msg.sender);
        hasRegistered[msg.sender] = true;

        emit ParticipantRegistered(msg.sender);
    }

    // Create groups (simple pseudo-random assignment)
    function createGroups() external onlyOwner {
        require(participants.length >= 10, "Minimum 10 participants required");
        require(!groupsCreated, "Groups already created");
        require(block.timestamp >= registrationEndTime, "Registration still open");

        // Calculate group sizes
        uint256[] memory groupSizes = calculateGroupSizes(participants.length);
        totalGroups = uint8(groupSizes.length);

        // Simple shuffling using block hash (not secure but sufficient for testing)
        address[] memory shuffled = shuffleParticipants(participants);

        // Create groups
        uint256 currentIndex = 0;
        uint256 totalPrizePool = usdc.balanceOf(address(this));
        uint256 prizePerGroup = totalPrizePool / totalGroups;

        for (uint8 i = 0; i < totalGroups; i++) {
            Group storage group = groups[i];
            group.groupId = i;
            group.prizePool = prizePerGroup;
            group.isActive = true;

            // Assign participants to this group
            for (uint256 j = 0; j < groupSizes[i]; j++) {
                group.participants.push(shuffled[currentIndex]);
                currentIndex++;
            }
        }

        groupsCreated = true;
        emit GroupsCreated(totalGroups);
    }

    // Start tournament
    function startTournament() external onlyOwner {
        require(groupsCreated, "Groups not created");
        require(block.timestamp >= startTime, "Start time not reached");
        require(status == TournamentStatus.Registration, "Tournament already started");

        status = TournamentStatus.Live;
        emit TournamentStarted();
    }

    // End tournament
    function endTournament() external onlyOwner {
        require(status == TournamentStatus.Live, "Tournament not live");
        require(block.timestamp >= endTime, "End time not reached");

        status = TournamentStatus.Finished;
        emit TournamentEnded();
    }

    // Set winners for a group (called by owner after calculating results off-chain)
    function setGroupWinners(
        uint8 groupId,
        address[3] memory winners
    ) external onlyOwner {
        require(status == TournamentStatus.Finished, "Tournament not finished");
        require(groupId < totalGroups, "Invalid group");
        require(groups[groupId].isActive, "Group not active");
        require(!groups[groupId].prizesDistributed, "Prizes already distributed");

        groups[groupId].winners = winners;
    }

    // Distribute prizes for a group
    function distributePrizes(uint8 groupId) external onlyOwner {
        Group storage group = groups[groupId];
        require(group.isActive, "Group not active");
        require(!group.prizesDistributed, "Already distributed");
        require(group.winners[0] != address(0), "Winners not set");

        uint256 groupPrize = group.prizePool;

        // Prize distribution: 60%, 25%, 15%
        uint256[3] memory prizeAmounts = [
            (groupPrize * 60) / 100,  // 1st place
            (groupPrize * 25) / 100,  // 2nd place
            (groupPrize * 15) / 100   // 3rd place
        ];

        // Transfer prizes
        for (uint8 i = 0; i < 3; i++) {
            if (group.winners[i] != address(0)) {
                usdc.transfer(group.winners[i], prizeAmounts[i]);
            }
        }

        group.prizesDistributed = true;
        emit PrizesDistributed(groupId, group.winners, prizeAmounts);
    }

    // Simple pseudo-random shuffle (not cryptographically secure)
    function shuffleParticipants(
        address[] memory array
    ) internal view returns (address[] memory) {
        address[] memory shuffled = new address[](array.length);
        for (uint256 i = 0; i < array.length; i++) {
            shuffled[i] = array[i];
        }

        // Fisher-Yates shuffle with block hash as entropy
        for (uint256 i = shuffled.length - 1; i > 0; i--) {
            uint256 randomHash = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                i,
                msg.sender
            )));
            uint256 j = randomHash % (i + 1);

            // Swap
            address temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }

        return shuffled;
    }

    // Calculate optimal group sizes
    function calculateGroupSizes(uint256 totalParticipants)
        internal
        pure
        returns (uint256[] memory)
    {
        require(totalParticipants >= 10, "Minimum 10 participants");

        uint256 targetGroupSize = 20;
        uint256 numGroups = (totalParticipants + targetGroupSize - 1) / targetGroupSize;

        uint256[] memory groupSizes = new uint256[](numGroups);
        uint256 baseSize = totalParticipants / numGroups;
        uint256 remainder = totalParticipants % numGroups;

        for (uint256 i = 0; i < numGroups; i++) {
            groupSizes[i] = baseSize + (i < remainder ? 1 : 0);
        }

        return groupSizes;
    }

    // Emergency functions
    function cancelTournament() external onlyOwner {
        require(status == TournamentStatus.Registration, "Can only cancel during registration");

        status = TournamentStatus.Cancelled;

        // Refund all participants
        uint256 refundAmount = entryFee;
        for (uint256 i = 0; i < participants.length; i++) {
            usdc.transfer(participants[i], refundAmount);
        }
    }

    // View functions
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getGroupParticipants(uint8 groupId) external view returns (address[] memory) {
        require(groupId < totalGroups, "Invalid group");
        return groups[groupId].participants;
    }

    function getTournamentInfo() external view returns (
        string memory,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        TournamentStatus,
        bool
    ) {
        return (
            title,
            entryFee,
            startTime,
            endTime,
            participants.length,
            maxParticipants,
            status,
            groupsCreated
        );
    }

    function canCreateGroups() external view returns (bool) {
        return participants.length >= 10 &&
               !groupsCreated &&
               block.timestamp >= registrationEndTime;
    }

    function getGroupInfo(uint8 groupId) external view returns (
        address[] memory,
        uint256,
        address[3] memory,
        bool
    ) {
        require(groupId < totalGroups, "Invalid group");
        Group storage group = groups[groupId];
        return (
            group.participants,
            group.prizePool,
            group.winners,
            group.prizesDistributed
        );
    }
}

contract TournamentFactory {
    address public owner;
    IERC20 public usdc;

    address[] public tournaments;
    mapping(address => bool) public isTournament;

    event TournamentCreated(address tournament, string title, address creator);

    constructor(address _usdcAddress) {
        owner = msg.sender;
        usdc = IERC20(_usdcAddress);
    }

    function createTournament(
        string memory title,
        uint256 entryFee,
        uint256 duration,
        uint256 registrationPeriod,
        uint256 maxParticipants
    ) external returns (address) {
        Tournament newTournament = new Tournament(
            title,
            entryFee,
            duration,
            registrationPeriod,
            maxParticipants,
            address(usdc),
            msg.sender  // Tournament creator becomes owner
        );

        address tournamentAddress = address(newTournament);
        tournaments.push(tournamentAddress);
        isTournament[tournamentAddress] = true;

        emit TournamentCreated(tournamentAddress, title, msg.sender);

        return tournamentAddress;
    }

    function getAllTournaments() external view returns (address[] memory) {
        return tournaments;
    }

    function getTournamentCount() external view returns (uint256) {
        return tournaments.length;
    }
}