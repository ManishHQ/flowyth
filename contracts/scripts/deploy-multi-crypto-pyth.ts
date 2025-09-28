import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  const network = hre.network.name;
  console.log(`Deploying MultiCryptoPythContract to ${network}...`);

  // Flow testnet Pyth contract address
  const FLOW_TESTNET_PYTH_ADDRESS = "0x2880aB155794e7179c9eE2e38200202908C17B43";

  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deploying with account: ${deployer.account.address}`);

  const balance = await hre.viem.getPublicClient().getBalance({
    address: deployer.account.address,
  });
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  const contract = await hre.viem.deployContract("MultiCryptoPythContract", [
    getAddress(FLOW_TESTNET_PYTH_ADDRESS),
  ]);

  console.log(`MultiCryptoPythContract deployed to: ${contract.address}`);
  console.log(`Transaction hash: ${contract.deploymentTransaction?.hash}`);

  // Verify the deployment by reading some contract data
  const btcPriceId = await contract.read.BTC_USD_PRICE_ID();
  const ethPriceId = await contract.read.ETH_USD_PRICE_ID();
  const solPriceId = await contract.read.SOL_USD_PRICE_ID();

  console.log(`\nContract verification:`);
  console.log(`BTC Price ID: ${btcPriceId}`);
  console.log(`ETH Price ID: ${ethPriceId}`);
  console.log(`SOL Price ID: ${solPriceId}`);

  return {
    contractAddress: contract.address,
    transactionHash: contract.deploymentTransaction?.hash,
  };
}

main()
  .then((result) => {
    console.log("\nDeployment completed successfully!");
    console.log(`Contract Address: ${result.contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });