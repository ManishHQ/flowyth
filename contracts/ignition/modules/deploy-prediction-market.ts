import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PredictionMarketModule = buildModule("PredictionMarketModule", (m) => {
  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC", [], {
    id: "MockUSDC",
  });

  // Deploy the PredictionMarket contract with MockUSDC address
  const predictionMarket = m.contract("PredictionMarket", [mockUSDC], {
    id: "PredictionMarket",
  });

  return { predictionMarket, mockUSDC };
});

export default PredictionMarketModule;