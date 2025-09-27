import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleTournamentModule = buildModule("SimpleTournamentModule", (m) => {
  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy a single Tournament contract for testing
  const tournament = m.contract("Tournament", [
    "Test Tournament",                    // title
    m.getParameter("entryFee", "10000000"), // 10 USDC (6 decimals)
    m.getParameter("duration", "86400"),    // 24 hours
    m.getParameter("registrationPeriod", "3600"), // 1 hour
    m.getParameter("maxParticipants", "100"),     // 100 max participants
    mockUSDC,                            // USDC address
    m.getParameter("owner", "0x0000000000000000000000000000000000000000") // owner address
  ]);

  return { mockUSDC, tournament };
});

export default SimpleTournamentModule;