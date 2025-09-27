// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CryptoFantasyLeague} from "./CryptoFantasyLeague.sol";
import {Test} from "forge-std/Test.sol";
import "@pythnetwork/pyth-sdk-solidity/MockPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract CryptoFantasyLeagueTest is Test {
    CryptoFantasyLeague league;
    MockPyth mockPyth;

    address owner = address(0x1);
    address player1 = address(0x2);
    address player2 = address(0x3);
    address player3 = address(0x4);

    // Test crypto IDs (using real Pyth price feed IDs)
    bytes32 constant USDC_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 constant BTC_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 constant ETH_ID = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 constant SOL_ID = 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d;
    bytes32 constant ADA_ID = 0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f;
    bytes32 constant DOGE_ID = 0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c;

    uint256 constant ENTRY_FEE = 0.05 ether;
    uint256 constant TOURNAMENT_DURATION = 24 hours;

    function setUp() public {
        // Deploy MockPyth
        mockPyth = new MockPyth(60, 1);

        // Deploy CryptoFantasyLeague as owner
        vm.prank(owner);
        league = new CryptoFantasyLeague(address(mockPyth));

        // Setup initial prices for all cryptos
        _setupInitialPrices();

        // Fund test accounts
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
        vm.deal(owner, 10 ether);
        vm.deal(address(this), 10 ether);
    }

    function _setupInitialPrices() private {
        // Set initial prices for all crypto assets
        bytes[] memory updateData = _createPriceUpdateData();
        uint256 fee = mockPyth.getUpdateFee(updateData);
        mockPyth.updatePriceFeeds{value: fee}(updateData);
    }

    function _createPriceUpdateData() private view returns (bytes[] memory) {
        bytes[] memory updateData = new bytes[](6);

        updateData[0] = mockPyth.createPriceFeedUpdateData(
            USDC_ID,
            1 * 1e8,      // $1.00 (8 decimals)
            10 * 1e6,     // $0.10 confidence
            -8,           // exponent
            1 * 1e8,      // ema price
            10 * 1e6,     // ema confidence
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[1] = mockPyth.createPriceFeedUpdateData(
            BTC_ID,
            50000 * 1e8, // $50,000
            100 * 1e8,   // $100 confidence
            -8,
            50000 * 1e8,
            100 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[2] = mockPyth.createPriceFeedUpdateData(
            ETH_ID,
            3000 * 1e8,  // $3,000
            30 * 1e8,    // $30 confidence
            -8,
            3000 * 1e8,
            30 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[3] = mockPyth.createPriceFeedUpdateData(
            SOL_ID,
            100 * 1e8,   // $100
            1 * 1e8,     // $1 confidence
            -8,
            100 * 1e8,
            1 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[4] = mockPyth.createPriceFeedUpdateData(
            ADA_ID,
            50 * 1e6,    // $0.50 (6 decimals for smaller price)
            1 * 1e6,     // $0.001 confidence
            -6,
            50 * 1e6,
            1 * 1e6,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[5] = mockPyth.createPriceFeedUpdateData(
            DOGE_ID,
            8 * 1e6,     // $0.08
            1 * 1e5,     // $0.0001 confidence
            -6,
            8 * 1e6,
            1 * 1e5,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        return updateData;
    }

    function _createValidSquad() private pure returns (bytes32[6] memory) {
        bytes32[6] memory squad;
        squad[0] = USDC_ID;  // Goalkeeper
        squad[1] = BTC_ID;   // Defender 1
        squad[2] = ETH_ID;   // Defender 2
        squad[3] = SOL_ID;   // Midfielder 1
        squad[4] = ADA_ID;   // Midfielder 2
        squad[5] = DOGE_ID;  // Striker
        return squad;
    }

    function test_InitialState() public view {
        assertEq(league.tournamentCounter(), 0);
        assertEq(league.MAX_PARTICIPANTS(), 20);
        assertEq(league.CREATOR_FEE_BPS(), 500);
        assertEq(league.owner(), owner);
    }

    function test_CreateTournament() public {
        // Anyone can create tournaments now (no owner restriction)
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        assertEq(tournamentId, 0);
        assertEq(league.tournamentCounter(), 1);

        (
            uint256 id,
            uint256 entryFee,
            uint256 startTime,
            uint256 endTime,
            uint256 prizePool,
            uint256 participantCount,
            bool isActive,
            bool isFinalized
        ) = league.getTournamentInfo(tournamentId);

        assertEq(id, 0);
        assertEq(entryFee, ENTRY_FEE);
        assertEq(startTime, block.timestamp + 1 hours);
        assertEq(endTime, startTime + TOURNAMENT_DURATION);
        assertEq(prizePool, 0);
        assertEq(participantCount, 0);
        assertTrue(isActive);
        assertFalse(isFinalized);
    }

    function test_RegisterForTournament() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();

        vm.prank(player1);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);

        (,,,, uint256 prizePool, uint256 participantCount,,) = league.getTournamentInfo(tournamentId);
        assertEq(prizePool, ENTRY_FEE);
        assertEq(participantCount, 1);

        bytes32[6] memory retrievedSquad = league.getSquad(tournamentId, player1);
        for (uint256 i = 0; i < 6; i++) {
            assertEq(retrievedSquad[i], squad[i]);
        }
    }

    function test_RegisterForTournament_InvalidSquad() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        // Invalid squad: 2 goalkeepers, 0 defenders
        bytes32[6] memory invalidSquad;
        invalidSquad[0] = USDC_ID;  // Goalkeeper
        invalidSquad[1] = USDC_ID;  // Goalkeeper (invalid)
        invalidSquad[2] = SOL_ID;   // Midfielder
        invalidSquad[3] = ADA_ID;   // Midfielder
        invalidSquad[4] = SOL_ID;   // Midfielder
        invalidSquad[5] = DOGE_ID;  // Striker

        vm.prank(player1);
        vm.expectRevert("Invalid squad formation");
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, invalidSquad);
    }

    function test_RegisterForTournament_DuplicateSquad() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        // Valid formation but with duplicates: SOL used twice
        bytes32[6] memory duplicateSquad;
        duplicateSquad[0] = USDC_ID;  // Goalkeeper
        duplicateSquad[1] = BTC_ID;   // Defender 1
        duplicateSquad[2] = ETH_ID;   // Defender 2
        duplicateSquad[3] = SOL_ID;   // Midfielder 1
        duplicateSquad[4] = SOL_ID;   // Midfielder 2 (DUPLICATE!)
        duplicateSquad[5] = DOGE_ID;  // Striker

        vm.prank(player2);
        vm.expectRevert("Invalid squad formation");
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, duplicateSquad);
    }

    function test_RegisterForTournament_IncorrectFee() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();

        vm.prank(player1);
        vm.expectRevert("Incorrect entry fee");
        league.registerForTournament{value: ENTRY_FEE / 2}(tournamentId, squad);
    }

    function test_RegisterForTournament_AlreadyRegistered() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();

        vm.prank(player1);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);

        vm.prank(player1);
        vm.expectRevert("Already registered");
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);
    }

    function test_StartTournament() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();
        vm.prank(player1);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);

        // Fast forward to start time
        vm.warp(block.timestamp + 1 hours);

        bytes[] memory priceUpdateData = _createPriceUpdateData();
        uint256 updateFee = mockPyth.getUpdateFee(priceUpdateData);

        vm.prank(owner);
        league.startTournament{value: updateFee}(tournamentId, priceUpdateData);
    }

    function test_StartTournament_TooEarly() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();
        vm.prank(player1);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);

        bytes[] memory priceUpdateData = _createPriceUpdateData();
        uint256 updateFee = mockPyth.getUpdateFee(priceUpdateData);

        vm.prank(player1);
        vm.expectRevert("Too early to start");
        league.startTournament{value: updateFee}(tournamentId, priceUpdateData);
    }

    function test_FinalizeTournament() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        // Register multiple players
        bytes32[6] memory squad1 = _createValidSquad();
        bytes32[6] memory squad2 = _createValidSquad();
        bytes32[6] memory squad3 = _createValidSquad();

        vm.prank(player1);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad1);

        vm.prank(player2);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad2);

        vm.prank(player3);
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad3);

        // Start tournament
        vm.warp(block.timestamp + 1 hours);
        bytes[] memory priceUpdateData = _createPriceUpdateData();
        uint256 updateFee = mockPyth.getUpdateFee(priceUpdateData);

        vm.prank(owner);
        league.startTournament{value: updateFee}(tournamentId, priceUpdateData);

        // Fast forward to end time
        vm.warp(block.timestamp + TOURNAMENT_DURATION);

        // Update prices with some changes
        bytes[] memory endPriceData = _createEndPriceUpdateData();
        uint256 endUpdateFee = mockPyth.getUpdateFee(endPriceData);

        uint256 ownerBalanceBefore = owner.balance;
        uint256 player1BalanceBefore = player1.balance;

        vm.prank(owner);
        league.finalizeTournament{value: endUpdateFee}(tournamentId, endPriceData);

        // Check that tournament is finalized
        (,,,,,, bool isActive, bool isFinalized) = league.getTournamentInfo(tournamentId);
        assertFalse(isActive);
        assertTrue(isFinalized);

        // Check that prizes were distributed
        assertTrue(player1.balance > player1BalanceBefore);
        assertTrue(owner.balance > ownerBalanceBefore);
    }

    function _createEndPriceUpdateData() private view returns (bytes[] memory) {
        bytes[] memory updateData = new bytes[](6);

        // Same prices but with some changes to simulate market movement
        updateData[0] = mockPyth.createPriceFeedUpdateData(
            USDC_ID,
            1 * 1e8,      // USDC stays stable
            10 * 1e6,
            -8,
            1 * 1e8,
            10 * 1e6,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[1] = mockPyth.createPriceFeedUpdateData(
            BTC_ID,
            52000 * 1e8, // BTC up 4%
            100 * 1e8,
            -8,
            52000 * 1e8,
            100 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[2] = mockPyth.createPriceFeedUpdateData(
            ETH_ID,
            3150 * 1e8,  // ETH up 5%
            30 * 1e8,
            -8,
            3150 * 1e8,
            30 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[3] = mockPyth.createPriceFeedUpdateData(
            SOL_ID,
            110 * 1e8,   // SOL up 10%
            1 * 1e8,
            -8,
            110 * 1e8,
            1 * 1e8,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[4] = mockPyth.createPriceFeedUpdateData(
            ADA_ID,
            55 * 1e6,    // ADA up 10%
            1 * 1e6,
            -6,
            55 * 1e6,
            1 * 1e6,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        updateData[5] = mockPyth.createPriceFeedUpdateData(
            DOGE_ID,
            12 * 1e6,    // DOGE up 50%
            1 * 1e5,
            -6,
            12 * 1e6,
            1 * 1e5,
            uint64(block.timestamp),
            uint64(block.timestamp - 1)
        );

        return updateData;
    }

    function test_GetCryptoAssetsByPosition() public view {
        bytes32[] memory goalkeepers = league.getCryptoAssetsByPosition(CryptoFantasyLeague.Position.GOALKEEPER);
        bytes32[] memory defenders = league.getCryptoAssetsByPosition(CryptoFantasyLeague.Position.DEFENDER);
        bytes32[] memory midfielders = league.getCryptoAssetsByPosition(CryptoFantasyLeague.Position.MIDFIELDER);
        bytes32[] memory strikers = league.getCryptoAssetsByPosition(CryptoFantasyLeague.Position.STRIKER);

        assertEq(goalkeepers.length, 3);   // USDC, USDT, DAI
        assertEq(defenders.length, 2);     // BTC, ETH
        assertEq(midfielders.length, 6);   // SOL, ADA, LINK, DOT, MATIC, AVAX
        assertEq(strikers.length, 3);      // DOGE, SHIB, PEPE
    }

    function test_getCurrentPrice() public {
        PythStructs.Price memory price = league.getCurrentPrice(USDC_ID);
        assertEq(price.price, 1 * 1e8);
        assertEq(price.conf, 10 * 1e6);
        assertEq(price.expo, -8);
    }



    function test_MaxParticipants() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        bytes32[6] memory squad = _createValidSquad();

        // Register 20 players (max limit)
        for (uint256 i = 0; i < 20; i++) {
            address player = address(uint160(i + 100));
            vm.deal(player, 1 ether);
            vm.prank(player);
            league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);
        }

        // Try to register 21st player
        address extraPlayer = address(uint160(200));
        vm.deal(extraPlayer, 1 ether);
        vm.prank(extraPlayer);
        vm.expectRevert("Tournament full");
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);
    }

    function test_RegistrationClosed() public {
        vm.prank(player1);
        uint256 tournamentId = league.createTournament(ENTRY_FEE, TOURNAMENT_DURATION);

        // Fast forward past registration period
        vm.warp(block.timestamp + 2 hours);

        bytes32[6] memory squad = _createValidSquad();

        vm.prank(player1);
        vm.expectRevert("Registration closed");
        league.registerForTournament{value: ENTRY_FEE}(tournamentId, squad);
    }
}