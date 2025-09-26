// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockUSDC} from "./MockUSDC.sol";
import {Test} from "forge-std/Test.sol";

contract MockUSDCTest is Test {
    MockUSDC mockUSDC;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        mockUSDC = new MockUSDC();
    }

    function test_InitialState() public view {
        assertEq(mockUSDC.name(), "Mock USDC");
        assertEq(mockUSDC.symbol(), "mUSDC");
        assertEq(mockUSDC.decimals(), 6);
        assertEq(mockUSDC.totalSupply(), 1_000_000 * 10**6);
        assertEq(mockUSDC.balanceOf(address(this)), 1_000_000 * 10**6);
    }

    function test_Transfer() public {
        uint256 amount = 1000 * 10**6;

        bool success = mockUSDC.transfer(alice, amount);
        assertTrue(success);

        assertEq(mockUSDC.balanceOf(alice), amount);
        assertEq(mockUSDC.balanceOf(address(this)), 1_000_000 * 10**6 - amount);
    }

    function test_TransferInsufficientBalance() public {
        uint256 amount = 2_000_000 * 10**6; // More than total supply

        vm.expectRevert("Insufficient balance");
        mockUSDC.transfer(alice, amount);
    }

    function test_Approve() public {
        uint256 amount = 1000 * 10**6;

        bool success = mockUSDC.approve(alice, amount);
        assertTrue(success);

        assertEq(mockUSDC.allowance(address(this), alice), amount);
    }

    function test_TransferFrom() public {
        uint256 amount = 1000 * 10**6;

        // First approve
        mockUSDC.approve(alice, amount);

        // Transfer from this contract to bob via alice
        vm.prank(alice);
        bool success = mockUSDC.transferFrom(address(this), bob, amount);
        assertTrue(success);

        assertEq(mockUSDC.balanceOf(bob), amount);
        assertEq(mockUSDC.balanceOf(address(this)), 1_000_000 * 10**6 - amount);
        assertEq(mockUSDC.allowance(address(this), alice), 0);
    }

    function test_TransferFromInsufficientBalance() public {
        uint256 amount = 2_000_000 * 10**6;

        mockUSDC.approve(alice, amount);

        vm.prank(alice);
        vm.expectRevert("Insufficient balance");
        mockUSDC.transferFrom(address(this), bob, amount);
    }

    function test_TransferFromInsufficientAllowance() public {
        uint256 amount = 1000 * 10**6;

        // Don't approve enough
        mockUSDC.approve(alice, amount / 2);

        vm.prank(alice);
        vm.expectRevert("Insufficient allowance");
        mockUSDC.transferFrom(address(this), bob, amount);
    }

    function test_Mint() public {
        uint256 amount = 5000 * 10**6;
        uint256 initialSupply = mockUSDC.totalSupply();

        mockUSDC.mint(alice, amount);

        assertEq(mockUSDC.balanceOf(alice), amount);
        assertEq(mockUSDC.totalSupply(), initialSupply + amount);
    }

    function test_Faucet() public {
        uint256 faucetAmount = 1000 * 10**6;
        uint256 initialSupply = mockUSDC.totalSupply();

        vm.prank(alice);
        mockUSDC.faucet();

        assertEq(mockUSDC.balanceOf(alice), faucetAmount);
        assertEq(mockUSDC.totalSupply(), initialSupply + faucetAmount);
    }

    function test_MultipleFaucetCalls() public {
        uint256 faucetAmount = 1000 * 10**6;
        uint256 initialSupply = mockUSDC.totalSupply();

        vm.startPrank(alice);
        mockUSDC.faucet();
        mockUSDC.faucet();
        vm.stopPrank();

        assertEq(mockUSDC.balanceOf(alice), faucetAmount * 2);
        assertEq(mockUSDC.totalSupply(), initialSupply + faucetAmount * 2);
    }

    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 0, mockUSDC.balanceOf(address(this)));

        bool success = mockUSDC.transfer(alice, amount);
        assertTrue(success);

        assertEq(mockUSDC.balanceOf(alice), amount);
    }

    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        amount = bound(amount, 0, type(uint256).max - mockUSDC.totalSupply());

        uint256 initialBalance = mockUSDC.balanceOf(to);
        uint256 initialSupply = mockUSDC.totalSupply();

        mockUSDC.mint(to, amount);

        assertEq(mockUSDC.balanceOf(to), initialBalance + amount);
        assertEq(mockUSDC.totalSupply(), initialSupply + amount);
    }
}