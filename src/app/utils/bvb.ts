import path from "path";
import fs from "fs";
import {
  BVBCONTRACT,
  CACHE_DIR,
  MARKET_CACHE_TIME,
  OVERRIDE_RPC,
  USDC_DENOM,
  MARS,
  FUNDING_RATE_CACHE_TIME,
} from "../constant/bvb";
import { chains } from "chain-registry";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

let readOnlyClient: CosmWasmClient;
const chain = chains.find((chain) => chain.chain_name === "neutron");

export const getReadOnlyClient = async (overrideRPC?: string) => {
  if (readOnlyClient) {
    return readOnlyClient;
  }

  if (!chain) {
    throw new Error("Neutron chain not found in chain registry");
  }

  let useRPC;

  if (overrideRPC) {
    useRPC = overrideRPC;
  } else if (OVERRIDE_RPC) {
    useRPC = OVERRIDE_RPC;
  } else {
    useRPC =
      chain.apis?.rpc?.[Math.floor(Math.random() * chain.apis.rpc.length)]
        .address;
  }
  console.log("Using RPC:", useRPC);
  if (!useRPC) {
    throw new Error("No RPC endpoint available for Neutron");
  }

  readOnlyClient = await CosmWasmClient.connect(useRPC);
  return readOnlyClient;
};

export const getMarkets = async (overrideRPC?: string) => {
  const marketCachePath = path.join(CACHE_DIR, "markets.json");

  const fetchMarkets = async () => {
    const client = await getReadOnlyClient(overrideRPC);
    const markets: { denom: string; display: unknown; enabled: boolean }[] =
      await client.queryContractSmart(BVBCONTRACT, {
        markets: {},
      });

    return markets
      .filter((market) => market.enabled)
      .map((market) => ({
        denom: market.denom,
        display: market.display,
      }));
  };

  const result = await saveData(
    marketCachePath,
    MARKET_CACHE_TIME,
    fetchMarkets
  );
  return result.data || [];
};

interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  timestamp: number;
}

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

interface FundingRateData {
  historicalData?: HistoricalDataEntry[];
  lastUpdated?: number;
  currentRates?: Record<string, FundingRateEntry>;
}

export const getFundingRates = async () => {
  const dataDir = "./data";
  const fundingRateFile = path.join(dataDir, "funding-rates.json");

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // Read existing data if file exists
    let existingData: FundingRateData = {};
    if (fs.existsSync(fundingRateFile)) {
      try {
        const fileContent = fs.readFileSync(fundingRateFile, "utf8");
        existingData = JSON.parse(fileContent);
      } catch (err) {
        console.log(
          "Error reading existing funding rates, starting fresh:",
          err
        );
        existingData = {};
      }
    }

    // Check if we need to fetch new data based on cache time
    const now = Date.now();
    if (
      existingData.lastUpdated &&
      now - existingData.lastUpdated < FUNDING_RATE_CACHE_TIME
    ) {
      console.log("Using cached funding rates");
      return existingData.currentRates || {};
    }

    // Fetch fresh funding rates
    const client = await getReadOnlyClient();
    const rates = await client.queryContractSmart(MARS.PERPS, {
      markets: {
        limit: 50,
      },
    });

    const fundingData: Record<string, FundingRateEntry> = {};

    for (const rate of rates.data) {
      fundingData[rate.denom] = {
        fundingRate: parseFloat(rate.current_funding_rate || 0) * 365 * 100,
        longOI: rate.long_oi_value,
        shortOI: rate.short_oi_value,
        timestamp: now,
      };
    }

    // Prepare the updated data structure
    // Initialize with existing data or create new structure
    if (!existingData.historicalData) {
      existingData.historicalData = [];
    }

    // Add new funding rates as a new entry in historical data
    existingData.historicalData.push({
      timestamp: now,
      data: fundingData,
    });

    // Keep only last 100 entries to prevent file from growing too large
    if (existingData.historicalData.length > 100) {
      existingData.historicalData = existingData.historicalData.slice(-100);
    }

    // Update the existing data with new funding rates
    const updatedData: FundingRateData = {
      ...existingData,
      lastUpdated: now,
      currentRates: fundingData, // Keep current rates for quick access
    };

    // Write updated data back to file
    fs.writeFileSync(fundingRateFile, JSON.stringify(updatedData, null, 2));

    return fundingData;
  } catch (err) {
    console.error("Error fetching funding rates:", err);

    // Try to return cached data if available
    if (fs.existsSync(fundingRateFile)) {
      try {
        const fileContent = fs.readFileSync(fundingRateFile, "utf8");
        const cachedData = JSON.parse(fileContent);
        return cachedData.fundingRates || {};
      } catch (cacheErr) {
        console.error("Error reading cache:", cacheErr);
      }
    }

    return {};
  }
};

export const saveData = async (
  cachePath: string,
  cacheTime: number,
  fetchDataFn: () => Promise<unknown>
) => {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
      console.log("Created cache directory");
    }

    if (fs.existsSync(cachePath)) {
      const cachedData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      const now = Date.now();

      if (cachedData.lastUpdated && now - cachedData.lastUpdated < cacheTime) {
        return { fromCache: true, data: cachedData.data };
      }
    }

    const freshData = await fetchDataFn();
    const cacheData = {
      lastUpdated: Date.now(),
      data: freshData,
    };
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));

    return { fromCache: false, data: freshData };
  } catch (err) {
    if (fs.existsSync(cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
        console.log(
          `Returning expired cached data from ${cachePath} due to fetch error`
        );
        return { fromCache: true, expired: true, data: cachedData.data };
      } catch (cacheErr) {
        console.log(`Error reading cache from ${cachePath}:`, cacheErr);
      }
    }
    return { fromCache: false, error: true, data: null };
  }
};
