import { HermesClient } from "@pythnetwork/hermes-client";

// Define types for the return data
interface PythPriceData {
  priceFeeds: any;
  priceUpdates: any;
}

async function fetchPythPrices(): Promise<PythPriceData> {
  try {
    const connection = new HermesClient("https://hermes.pyth.network", {});
    
    const priceIds = [
      // You can find the ids of prices at https://docs.pyth.network/price-feeds/price-feeds
      "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD price id
      "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD price id
    ];
    
    // Get price feeds
    // You can also fetch price feeds for other assets by specifying options
    const priceFeeds = await connection.getPriceFeeds({
      query: "eth/usd",
      assetType: "crypto"
    });
    console.log("Price Feeds:", JSON.stringify(priceFeeds));
    
    // Latest price updates
    const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
    console.log("Price Updates:", JSON.stringify(priceUpdates));
    
    return { priceFeeds, priceUpdates };
  } catch (error) {
    console.error("Error fetching Pyth prices:", error);
    throw error;
  }
}

// Export the function and types for use in other modules
export { fetchPythPrices };
export type { PythPriceData };

// Example usage:
// fetchPythPrices()
//   .then(data => {
//     console.log('Successfully fetched Pyth price data:', data);
//   })
//   .catch(error => {
//     console.error('Failed to fetch Pyth price data:', error);
//   });

// Uncomment the line below if you want to run this immediately
fetchPythPrices();