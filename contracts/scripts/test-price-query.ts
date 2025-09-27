import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  // Connect to deployed contract
  const contractAddress = "0x2D01EC2eAA57e798559defba249bEc989Dc8d70F";
  const contract = await ethers.getContractAt("CryptoFantasyLeagueV2", contractAddress);

  // BTC Pyth price feed ID
  const BTC_ID = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

  try {
    console.log("🔍 Querying BTC price from Pyth...");

    // Get current price
    const price = await contract.getCurrentPrice(BTC_ID);

    console.log("📊 BTC Price Data:");
    console.log(`- Price: ${price.price}`);
    console.log(`- Confidence: ${price.conf}`);
    console.log(`- Exponent: ${price.expo}`);
    console.log(`- Publish Time: ${price.publishTime}`);

    // Convert to human-readable price
    const humanPrice = Number(price.price) / Math.pow(10, Math.abs(Number(price.expo)));
    console.log(`💰 BTC Price: $${humanPrice.toLocaleString()}`);

    // Test with multiple cryptos
    const cryptos = [
      { id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", symbol: "BTC" },
      { id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", symbol: "ETH" },
      { id: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", symbol: "SOL" }
    ];

    console.log("\n🚀 Testing multiple crypto prices:");
    for (const crypto of cryptos) {
      try {
        const cryptoPrice = await contract.getCurrentPrice(crypto.id);
        const humanCryptoPrice = Number(cryptoPrice.price) / Math.pow(10, Math.abs(Number(cryptoPrice.expo)));
        console.log(`${crypto.symbol}: $${humanCryptoPrice.toLocaleString()}`);
      } catch (error) {
        console.log(`❌ ${crypto.symbol}: Price not available - ${error}`);
      }
    }

    // Check supported cryptos
    console.log("\n📋 Getting supported cryptos...");
    const supportedCryptos = await contract.getSupportedCryptos();
    console.log(`Total supported cryptos: ${supportedCryptos.length}`);

    // Get tournament info
    console.log("\n🏆 Checking current tournament...");
    try {
      const tournamentInfo = await contract.getTournamentInfo(0);
      console.log("Tournament 0 Info:");
      console.log(`- Entry Fee: ${ethers.formatEther(tournamentInfo.entryFee)} ETH`);
      console.log(`- Start Time: ${new Date(Number(tournamentInfo.startTime) * 1000).toLocaleString()}`);
      console.log(`- End Time: ${new Date(Number(tournamentInfo.endTime) * 1000).toLocaleString()}`);
      console.log(`- Participants: ${tournamentInfo.participantCount}`);
      console.log(`- Is Active: ${tournamentInfo.isActive}`);
      console.log(`- Has Started: ${tournamentInfo.hasStarted}`);
    } catch (error) {
      console.log("No tournaments created yet");
    }

    // Check time until next auto tournament
    const timeUntilNext = await contract.timeUntilNextAutoTournament();
    console.log(`⏰ Time until next auto tournament: ${timeUntilNext} seconds`);

  } catch (error) {
    console.error("❌ Error querying price:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});