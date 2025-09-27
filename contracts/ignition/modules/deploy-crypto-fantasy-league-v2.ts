import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CryptoFantasyLeagueV2Module = buildModule("CryptoFantasyLeagueV2Module", (m) => {
  // Pyth contract address on Flow EVM Testnet
  const pythAddress = m.getParameter("pythAddress", "0x2880aB155794e7179c9eE2e38200202908C17B43");

  const cryptoFantasyLeagueV2 = m.contract("CryptoFantasyLeagueV2", [pythAddress]);

  return { cryptoFantasyLeagueV2 };
});

export default CryptoFantasyLeagueV2Module;