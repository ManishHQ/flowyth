import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TournamentFactoryModule = buildModule("TournamentFactoryModule", (m) => {
  // Pyth Entropy contract address on Flow EVM Testnet (placeholder - needs actual address)
  const entropyAddress = m.getParameter("entropyAddress", "0x0000000000000000000000000000000000000000");

  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy TournamentFactory with Entropy and USDC addresses
  const tournamentFactory = m.contract("TournamentFactory", [entropyAddress, mockUSDC]);

  return { mockUSDC, tournamentFactory };
});

export default TournamentFactoryModule;