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

export const getMarkets = async () => {
  const marketCachePath = path.join(CACHE_DIR, "markets.json");

  const fetchMarkets = async () => {
    const client = await getReadOnlyClient();
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

interface HourlyFundingData {
  entries: HistoricalDataEntry[];
  hourStart: number;
}

const getHourlyFilePath = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  return path.join("./data", `${year}-${month}-${day}-${hour}.json`);
};

const getHourStart = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
};

export const getFundingRates = async () => {
  const dataDir = "./data";

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const now = Date.now();
  const currentHourlyFile = getHourlyFilePath(now);
  const hourStart = getHourStart(now);

  try {
    // Read existing hourly data if file exists
    let hourlyData: HourlyFundingData = {
      entries: [],
      hourStart: hourStart
    };

    if (fs.existsSync(currentHourlyFile)) {
      try {
        const fileContent = fs.readFileSync(currentHourlyFile, "utf8");
        hourlyData = JSON.parse(fileContent);
      } catch (err) {
        console.log("Error reading existing hourly data, starting fresh:", err);
      }
    }

    // Check if we need to fetch new data (15 minute cache)
    const lastEntry = hourlyData.entries[hourlyData.entries.length - 1];
    if (lastEntry && now - lastEntry.timestamp < FUNDING_RATE_CACHE_TIME) {
      console.log("Using cached funding rates");
      return lastEntry.data;
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

    // Add new entry to hourly data
    hourlyData.entries.push({
      timestamp: now,
      data: fundingData,
    });

    // Write updated hourly data back to file
    fs.writeFileSync(currentHourlyFile, JSON.stringify(hourlyData, null, 2));

    return fundingData;
  } catch (err) {
    console.error("Error fetching funding rates:", err);

    // Try to return latest cached data from current hour file
    if (fs.existsSync(currentHourlyFile)) {
      try {
        const fileContent = fs.readFileSync(currentHourlyFile, "utf8");
        const cachedData: HourlyFundingData = JSON.parse(fileContent);
        const lastEntry = cachedData.entries[cachedData.entries.length - 1];
        return lastEntry?.data || {};
      } catch (cacheErr) {
        console.error("Error reading cache:", cacheErr);
      }
    }

    return {};
  }
};

export type TimeFrame = '15min' | '1hour' | '4hour';

export const getHistoricalFundingRates = (
  hoursBack: number = 24,
  timeFrame: TimeFrame = '15min'
): HistoricalDataEntry[] => {
  const now = Date.now();
  const allEntries: HistoricalDataEntry[] = [];

  // Get data from the last N hours
  for (let i = 0; i < hoursBack; i++) {
    const hourTimestamp = now - (i * 60 * 60 * 1000); // Go back i hours
    const filePath = getHourlyFilePath(hourTimestamp);

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const hourlyData: HourlyFundingData = JSON.parse(fileContent);
        allEntries.push(...hourlyData.entries);
      } catch (err) {
        console.log(`Error reading hourly file ${filePath}:`, err);
      }
    }
  }

  // Sort by timestamp (oldest first)
  const sortedEntries = allEntries.sort((a, b) => a.timestamp - b.timestamp);

  // Apply timeframe filtering
  return filterByTimeFrame(sortedEntries, timeFrame);
};

const filterByTimeFrame = (entries: HistoricalDataEntry[], timeFrame: TimeFrame): HistoricalDataEntry[] => {
  if (entries.length === 0) return [];

  switch (timeFrame) {
    case '15min':
      // Show all entries (every 15 minutes)
      return entries;

    case '1hour':
      // Show first entry of each hour
      const hourlyEntries: HistoricalDataEntry[] = [];
      const seenHours = new Set<string>();

      entries.forEach(entry => {
        const hourKey = new Date(entry.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        if (!seenHours.has(hourKey)) {
          seenHours.add(hourKey);
          hourlyEntries.push(entry);
        }
      });

      return hourlyEntries;

    case '4hour':
      // Show first entry every 4 hours
      const fourHourlyEntries: HistoricalDataEntry[] = [];
      const seenFourHourBlocks = new Set<string>();

      entries.forEach(entry => {
        const date = new Date(entry.timestamp);
        const fourHourBlock = Math.floor(date.getHours() / 4);
        const blockKey = `${date.toISOString().slice(0, 10)}-${fourHourBlock}`; // YYYY-MM-DD-0/1/2/3/4/5

        if (!seenFourHourBlocks.has(blockKey)) {
          seenFourHourBlocks.add(blockKey);
          fourHourlyEntries.push(entry);
        }
      });

      return fourHourlyEntries;

    default:
      return entries;
  }
};

export const getCurrentFundingRates = (): Record<string, FundingRateEntry> => {
  const now = Date.now();
  const currentHourlyFile = getHourlyFilePath(now);

  if (fs.existsSync(currentHourlyFile)) {
    try {
      const fileContent = fs.readFileSync(currentHourlyFile, "utf8");
      const hourlyData: HourlyFundingData = JSON.parse(fileContent);
      const lastEntry = hourlyData.entries[hourlyData.entries.length - 1];
      return lastEntry?.data || {};
    } catch (err) {
      console.error("Error reading current rates:", err);
    }
  }

  return {};
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
