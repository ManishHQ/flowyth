// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PvPBattle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PvPBattleFactory
 * @dev Factory contract to deploy individual PvP battle contracts per room
 */
contract PvPBattleFactory is Ownable {
    // State variables
    address public immutable usdcToken;
    address public priceOracle;

    // Mapping from room ID to battle contract address
    mapping(string => address) public roomToBattleContract;
    mapping(address => string) public battleContractToRoom;

    // Array to track all deployed contracts
    address[] public deployedContracts;

    // Events
    event BattleContractDeployed(
        string indexed roomId,
        address indexed battleContract,
        address indexed creator
    );

    event PriceOracleUpdated(address indexed newOracle);

    // Constructor
    constructor(address _usdcToken, address _priceOracle) {
        usdcToken = _usdcToken;
        priceOracle = _priceOracle;
    }

    /**
     * @dev Deploy a new battle contract for a room
     * @param roomId Unique room identifier
     * @return battleContract Address of the deployed battle contract
     */
    function deployBattleContract(string calldata roomId) external returns (address) {
        require(bytes(roomId).length > 0, "Room ID cannot be empty");
        require(roomToBattleContract[roomId] == address(0), "Battle contract already exists for this room");

        // Deploy new PvP Battle contract
        PvPBattle battleContract = new PvPBattle(
            usdcToken,
            priceOracle,
            roomId
        );

        address battleAddress = address(battleContract);

        // Store mappings
        roomToBattleContract[roomId] = battleAddress;
        battleContractToRoom[battleAddress] = roomId;
        deployedContracts.push(battleAddress);

        emit BattleContractDeployed(roomId, battleAddress, msg.sender);

        return battleAddress;
    }

    /**
     * @dev Get battle contract address for a room
     * @param roomId Room identifier
     * @return Battle contract address (zero address if doesn't exist)
     */
    function getBattleContract(string calldata roomId) external view returns (address) {
        return roomToBattleContract[roomId];
    }

    /**
     * @dev Get room ID for a battle contract
     * @param battleContract Battle contract address
     * @return Room ID (empty string if doesn't exist)
     */
    function getRoomId(address battleContract) external view returns (string memory) {
        return battleContractToRoom[battleContract];
    }

    /**
     * @dev Get total number of deployed contracts
     * @return Number of deployed battle contracts
     */
    function getDeployedContractsCount() external view returns (uint256) {
        return deployedContracts.length;
    }

    /**
     * @dev Get deployed contract address by index
     * @param index Index in the deployedContracts array
     * @return Battle contract address
     */
    function getDeployedContract(uint256 index) external view returns (address) {
        require(index < deployedContracts.length, "Index out of bounds");
        return deployedContracts[index];
    }

    /**
     * @dev Check if a battle contract exists for a room
     * @param roomId Room identifier
     * @return True if battle contract exists
     */
    function battleContractExists(string calldata roomId) external view returns (bool) {
        return roomToBattleContract[roomId] != address(0);
    }

    // Admin functions

    /**
     * @dev Update the price oracle address
     * @param _priceOracle New price oracle address
     */
    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Invalid oracle address");
        priceOracle = _priceOracle;
        emit PriceOracleUpdated(_priceOracle);
    }

    /**
     * @dev Update price oracle for a specific battle contract
     * @param roomId Room identifier
     * @param _priceOracle New price oracle address
     */
    function updateBattleContractOracle(string calldata roomId, address _priceOracle) external onlyOwner {
        address battleContract = roomToBattleContract[roomId];
        require(battleContract != address(0), "Battle contract does not exist");
        require(_priceOracle != address(0), "Invalid oracle address");

        PvPBattle(battleContract).setPriceOracle(_priceOracle);
    }

    /**
     * @dev Emergency function to withdraw from a specific battle contract
     * @param roomId Room identifier
     */
    function emergencyWithdrawFromBattle(string calldata roomId) external onlyOwner {
        address battleContract = roomToBattleContract[roomId];
        require(battleContract != address(0), "Battle contract does not exist");

        PvPBattle(battleContract).emergencyWithdraw();
    }
}