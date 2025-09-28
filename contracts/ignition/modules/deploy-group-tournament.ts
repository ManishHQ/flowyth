import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GroupTournamentModule = buildModule("GroupTournamentModule", (m) => {
  // Pyth contract address on Flow EVM Testnet
  // Using Pyth mainnet address as placeholder - update with Flow testnet address when available
  const pythAddress = m.getParameter("pythAddress", "0x4305FB66699C3B2702D4d05CF36551390A4c69C6");

  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy GroupTournament contract
  const groupTournament = m.contract("GroupTournament", [pythAddress]);

  return { mockUSDC, groupTournament };
});

export default GroupTournamentModule;
