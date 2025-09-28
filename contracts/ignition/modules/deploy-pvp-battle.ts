import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PvPBattleModule = buildModule("PvPBattleModule", (m) => {
  // Use existing MockUSDC or deploy new one if needed
  const mockUSDC = m.contract("MockUSDC");

  // For now, use deployer as price oracle (in production, this would be a backend service)
  const priceOracle = m.getAccount(0);

  // Deploy PvP Battle Factory contract
  const pvpBattleFactory = m.contract("PvPBattleFactory", [mockUSDC, priceOracle]);

  return {
    mockUSDC,
    pvpBattleFactory,
    priceOracle
  };
});

export default PvPBattleModule;