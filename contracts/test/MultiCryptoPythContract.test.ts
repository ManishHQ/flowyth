import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("MultiCryptoPythContract", function () {
  async function deployMultiCryptoPythContractFixture() {
    const [owner, addr1] = await hre.viem.getWalletClients();

    // For testing purposes, we'll use a mock Pyth address
    // In a real test, you'd deploy a mock Pyth contract
    const mockPythAddress = "0x2880aB155794e7179c9eE2e38200202908C17B43";

    const contract = await hre.viem.deployContract("MultiCryptoPythContract", [
      getAddress(mockPythAddress),
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      contract,
      owner,
      addr1,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct Pyth address", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      const pythAddress = await contract.read.pyth();
      expect(pythAddress.toLowerCase()).to.equal(
        "0x2880aB155794e7179c9eE2e38200202908C17B43".toLowerCase()
      );
    });

    it("Should have correct price IDs", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      const btcPriceId = await contract.read.BTC_USD_PRICE_ID();
      const ethPriceId = await contract.read.ETH_USD_PRICE_ID();
      const solPriceId = await contract.read.SOL_USD_PRICE_ID();

      expect(btcPriceId).to.equal(
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
      );
      expect(ethPriceId).to.equal(
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
      );
      expect(solPriceId).to.equal(
        "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
      );
    });
  });

  describe("Price ID Functions", function () {
    it("Should return correct price ID for BTC", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      const btcPriceId = await contract.read.getPriceId([0]); // CryptoType.BTC = 0
      expect(btcPriceId).to.equal(
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
      );
    });

    it("Should return correct price ID for ETH", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      const ethPriceId = await contract.read.getPriceId([1]); // CryptoType.ETH = 1
      expect(ethPriceId).to.equal(
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
      );
    });

    it("Should return correct price ID for SOL", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      const solPriceId = await contract.read.getPriceId([2]); // CryptoType.SOL = 2
      expect(solPriceId).to.equal(
        "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
      );
    });

    it("Should revert for unsupported crypto type", async function () {
      const { contract } = await loadFixture(deployMultiCryptoPythContractFixture);

      await expect(contract.read.getPriceId([3])).to.be.rejectedWith("UnsupportedCrypto");
    });
  });

  describe("Withdraw", function () {
    it("Should allow withdrawal by owner", async function () {
      const { contract, owner, publicClient } = await loadFixture(
        deployMultiCryptoPythContractFixture
      );

      // Send some ETH to the contract
      await owner.sendTransaction({
        to: contract.address,
        value: hre.viem.parseEther("1"),
      });

      const initialBalance = await publicClient.getBalance({
        address: owner.account.address,
      });

      // Withdraw
      await contract.write.withdraw();

      const finalBalance = await publicClient.getBalance({
        address: owner.account.address,
      });

      // Balance should have increased (minus gas fees)
      expect(finalBalance > initialBalance).to.be.true;
    });
  });
});