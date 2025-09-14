import { getClient, getFundingRates, getMarkets } from "../app/utils/bvb";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fetchAndStoreFundingRates() {
  console.log(`[${new Date().toISOString()}] Starting funding rate fetch...`);

  try {
    // Initialize client
    const seed = process.env.SEED;
    await getClient(seed);
    console.log("Client initialized");

    // Fetch markets
    await getMarkets();
    console.log("Markets fetched");

    // Fetch and store funding rates
    const rates = await getFundingRates();
    console.log(
      `Funding rates fetched and stored. Found ${
        Object.keys(rates).length
      } markets`
    );

    console.log(
      `[${new Date().toISOString()}] Funding rate fetch completed successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching funding rates:`,
      error
    );
  }
}

// Run the fetch function
if (require.main === module) {
  fetchAndStoreFundingRates()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { fetchAndStoreFundingRates };
