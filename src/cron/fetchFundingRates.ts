import * as dotenv from "dotenv";

// Load environment variables BEFORE importing other modules
dotenv.config();

import {
  getFundingRates,
  getMarkets,
  getReadOnlyClient,
} from "../services/bvb";
import { getClient } from "@/services/mongodb";

async function fetchAndStoreFundingRates(retries = 3, retryDelay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries}: Fetching funding rates...`);

      // Initialize client with override RPC
      const overrideRPC = process.env.NEUTRON_RPC_URL;
      if (overrideRPC) {
        await getReadOnlyClient(overrideRPC);
      }

      // Fetch markets
      await getClient(process.env.MONGODB_URI);
      await getMarkets();

      // Fetch and store funding rates
      const rates = await getFundingRates();

      console.log(
        `Successfully fetched and stored funding rates on attempt ${attempt}`
      );
      return rates;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error);

      if (attempt < retries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.error("All retry attempts failed");
        throw error;
      }
    }
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
