import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GroupTournamentModule = buildModule("GroupTournamentModule", (m) => {
  // Pyth contract address on Flow EVM Testnet
  // You'll need to update this with the actual Pyth contract address
  const pythAddress = m.getParameter("pythAddress", "0x0000000000000000000000000000000000000000");

  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy GroupTournament contract
  const groupTournament = m.contract("GroupTournament", [pythAddress]);

  return { mockUSDC, groupTournament };
});

export default GroupTournamentModule;
