// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Tournament is IEntropyConsumer {

    // Required by IEntropyConsumer - returns the Entropy contract address
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }
    // Core tournament data
    string public title;
    uint256 public entryFee;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public registrationEndTime;
    uint256 public maxParticipants;
    address public owner;

    // Contracts
    IEntropy public entropy;
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

    // Entropy state
    uint64 public entropySequenceNumber;
    bool public entropyRequested;
    bool public groupsCreated;

    // Events
    event ParticipantRegistered(address participant);
    event EntropyRequested(uint64 sequenceNumber);
    event GroupsCreated(uint8 totalGroups, bytes32 randomNumber);
    event TournamentStarted();
    event TournamentEnded();
    event PrizesDistributed(uint8 groupId, address[3] winners, uint256[3] amounts);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier registrationOpen() {
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
        address _entropyAddress,
        address _usdcAddress,
        address _owner
    ) {
        title = _title;
        entryFee = _entryFee;
        maxParticipants = _maxParticipants;
        owner = _owner;

        // Set times
        registrationEndTime = block.timestamp + _registrationPeriod;
        startTime = registrationEndTime + 1 hours; // 1 hour buffer for group creation
        endTime = startTime + _duration;

        // Set contracts
        entropy = IEntropy(_entropyAddress);
        usdc = IERC20(_usdcAddress);
    }

    // Registration function
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

    // Note: Lineup submission is handled off-chain
    // Users submit their crypto selections through the frontend
    // Only wallet addresses are stored on-chain for group assignment

    // Step 1: Request entropy for group creation
    function requestGroupCreation() external payable onlyOwner {
        require(participants.length >= 10, "Minimum 10 participants required");
        require(!entropyRequested, "Entropy already requested");
        require(block.timestamp >= registrationEndTime, "Registration still open");

        // Generate commitment
        bytes32 userCommitment = keccak256(abi.encodePacked(
            address(this),
            block.timestamp,
            participants.length
        ));

        // Request entropy
        uint128 fee = entropy.getFee(address(this));
        require(msg.value >= fee, "Insufficient fee");

        entropySequenceNumber = entropy.requestWithCallback{value: fee}(
            address(this),
            userCommitment
        );

        entropyRequested = true;
        emit EntropyRequested(entropySequenceNumber);
    }

    // Step 2: Callback from Pyth Entropy (internal - called by _entropyCallback)
    function entropyCallback(
        uint64 sequenceNumber,
        address, // provider - unused but required by interface
        bytes32 randomNumber
    ) internal override {
        require(sequenceNumber == entropySequenceNumber, "Invalid sequence");
        require(!groupsCreated, "Groups already created");

        createGroupsWithEntropy(randomNumber);

        groupsCreated = true;
        emit GroupsCreated(totalGroups, randomNumber);
        emit TournamentStarted();
    }

    // Step 3: Create groups using entropy
    function createGroupsWithEntropy(bytes32 randomNumber) internal {
        // Calculate group sizes
        uint256[] memory groupSizes = calculateGroupSizes(participants.length);
        totalGroups = uint8(groupSizes.length);

        // Shuffle participants
        address[] memory shuffled = shuffleParticipants(participants, randomNumber);

        // Create groups
        uint256 currentIndex = 0;
        uint256 totalPrizePool = usdc.balanceOf(address(this));
        uint256 prizePerGroup = totalPrizePool / totalGroups;

        for (uint8 i = 0; i < totalGroups; i++) {
            Group storage group = groups[i];
            group.groupId = i;
            group.prizePool = prizePerGroup;
            group.isActive = true;

            // Assign participants
            for (uint256 j = 0; j < groupSizes[i]; j++) {
                group.participants.push(shuffled[currentIndex]);
                currentIndex++;
            }
        }
    }

    // Fisher-Yates shuffle with entropy
    function shuffleParticipants(
        address[] memory array,
        bytes32 randomSeed
    ) internal pure returns (address[] memory) {
        for (uint256 i = array.length - 1; i > 0; i--) {
            bytes32 randomHash = keccak256(abi.encodePacked(randomSeed, i));
            uint256 j = uint256(randomHash) % (i + 1);

            // Swap
            address temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
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

    // Finalize tournament and set winners (called by owner after tournament ends)
    function setGroupWinners(
        uint8 groupId,
        address[3] memory winners
    ) external onlyOwner {
        require(block.timestamp >= endTime, "Tournament not ended");
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

    // Emergency refund function
    function emergencyRefund() external onlyOwner {
        require(!groupsCreated, "Groups already created");
        require(block.timestamp > startTime + 24 hours, "Wait 24h after start");

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

    function canCreateGroups() external view returns (bool) {
        return participants.length >= 10 &&
               !entropyRequested &&
               block.timestamp >= registrationEndTime;
    }

    function getTournamentInfo() external view returns (
        string memory,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        bool,
        bool
    ) {
        return (
            title,
            entryFee,
            startTime,
            endTime,
            participants.length,
            maxParticipants,
            groupsCreated,
            block.timestamp >= endTime
        );
    }
}

contract TournamentFactory {
    address public owner;
    IEntropy public entropy;
    IERC20 public usdc;

    address[] public tournaments;
    mapping(address => bool) public isTournament;

    event TournamentCreated(address tournament, string title, address creator);

    constructor(address _entropyAddress, address _usdcAddress) {
        owner = msg.sender;
        entropy = IEntropy(_entropyAddress);
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
            address(entropy),
            address(usdc),
            msg.sender
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