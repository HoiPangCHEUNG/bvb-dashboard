import * as dotenv from "dotenv";

// Load environment variables BEFORE importing other modules
dotenv.config();

import {
  getFundingRates,
  getMarkets,
  getReadOnlyClient,
} from "../app/utils/bvb";
import { getClient } from "@/app/utils/mongodb";

async function fetchAndStoreFundingRates() {
  try {
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
  } catch (error) {}
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
