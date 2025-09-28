import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FLOW_TESTNET_PYTH_ADDRESS = "0x2880aB155794e7179c9eE2e38200202908C17B43";

const MultiCryptoPythContractModule = buildModule("MultiCryptoPythContractModule", (m) => {
  const pythAddress = m.getParameter("pythAddress", FLOW_TESTNET_PYTH_ADDRESS);

  const multiCryptoPythContract = m.contract("MultiCryptoPythContract", [pythAddress]);

  return { multiCryptoPythContract };
});

export default MultiCryptoPythContractModule;