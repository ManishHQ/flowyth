import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UpdatedCryptoFantasyLeagueModule = buildModule("UpdatedCryptoFantasyLeagueModule", (m) => {
  // Pyth contract address on Flow EVM Testnet
  const pythAddress = m.getParameter("pythAddress", "0x2880aB155794e7179c9eE2e38200202908C17B43");

  const cryptoFantasyLeague = m.contract("CryptoFantasyLeague", [pythAddress]);

  return { cryptoFantasyLeague };
});

export default UpdatedCryptoFantasyLeagueModule;