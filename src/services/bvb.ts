import {
  BVBCONTRACT,
  MARKET_CACHE_TIME,
  OVERRIDE_RPC,
  MARS,
  FUNDING_RATE_CACHE_TIME,
} from "../app/constant/const";
import { chains } from "chain-registry";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  getDatabase,
  upsertMarkets,
  insertFundingRate,
  getLatestFundingRateWithCache,
  getFundingRatesInRange,
  FundingRateEntry,
} from "./mongodb";

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

  if (!useRPC) {
    throw new Error("No RPC endpoint available for Neutron");
  }

  readOnlyClient = await CosmWasmClient.connect(useRPC);
  return readOnlyClient;
};

export const getMarkets = async () => {
  try {
    const db = await getDatabase();
    const marketsCollection = db.collection("markets");

    const lastMarket = await marketsCollection.findOne(
      {},
      { sort: { updatedAt: -1 } }
    );

    const now = Date.now();
    const shouldFetchFresh =
      !lastMarket || now - lastMarket.updatedAt.getTime() > MARKET_CACHE_TIME;

    if (!shouldFetchFresh) {
      const cachedMarkets = await marketsCollection
        .find({}, { projection: { denom: 1, display: 1, _id: 0 } })
        .toArray();
      return cachedMarkets;
    }

    const client = await getReadOnlyClient();
    const markets: { denom: string; display: string; enabled: boolean }[] =
      await client.queryContractSmart(BVBCONTRACT, {
        markets: {},
      });

    const enabledMarkets = markets
      .filter((market) => market.enabled)
      .map((market) => ({
        denom: market.denom,
        display: market.display,
      }));

    // Update MongoDB with fresh data
    await upsertMarkets(enabledMarkets);

    return enabledMarkets;
  } catch (err) {
    // Fallback to any cached data in MongoDB
    try {
      const db = await getDatabase();
      const marketsCollection = db.collection("markets");
      const cachedMarkets = await marketsCollection
        .find({}, { projection: { denom: 1, display: 1, _id: 0 } })
        .toArray();

      return cachedMarkets;
    } catch (cacheErr) {
      return [];
    }
  }
};

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

// the current funding rates method is not optimized
// will fix it in the next pull request
export const getFundingRates = async () => {
  try {
    // Check if we need to fetch new data (15 minute cache)
    const cachedResult = await getLatestFundingRateWithCache(
      FUNDING_RATE_CACHE_TIME
    );

    if (cachedResult.fromCache && cachedResult.data) {
      return cachedResult.data;
    }

    // Fetch fresh funding rates
    const client = await getReadOnlyClient();
    const rates = await client.queryContractSmart(MARS.PERPS, {
      markets: {
        limit: 50,
      },
    });

    const now = Date.now();
    const fundingData: Record<string, FundingRateEntry> = {};

    for (const rate of rates.data) {
      fundingData[rate.denom] = {
        fundingRate: parseFloat(rate.current_funding_rate || 0) * 365 * 100,
        longOI: rate.long_oi_value,
        shortOI: rate.short_oi_value,
        timestamp: now,
      };
    }

    // Store in MongoDB
    await insertFundingRate(fundingData);

    return fundingData;
  } catch (err) {
    // Try to return latest cached data from MongoDB
    try {
      const cachedResult = await getLatestFundingRateWithCache(Infinity);
      if (cachedResult.data) {
        return cachedResult.data;
      }
    } catch (cacheErr) {}

    return {};
  }
};

export type TimeFrame = "15 min" | "1 hour" | "4 hour";

export const getHistoricalFundingRates = async (
  hoursBack: number = 24,
  timeFrame: TimeFrame = "15 min"
): Promise<HistoricalDataEntry[]> => {
  const now = Date.now();
  const startTime = now - hoursBack * 60 * 60 * 1000;

  try {
    // Get data from MongoDB
    const fundingRateDocs = await getFundingRatesInRange(startTime, now);

    // Convert to HistoricalDataEntry format
    const allEntries: HistoricalDataEntry[] = fundingRateDocs.map((doc) => ({
      timestamp: doc.timestamp,
      data: doc.data,
    }));

    // Apply timeframe filtering
    return filterByTimeFrame(allEntries, timeFrame);
  } catch (err) {
    return [];
  }
};

const filterByTimeFrame = (
  entries: HistoricalDataEntry[],
  timeFrame: TimeFrame
): HistoricalDataEntry[] => {
  if (entries.length === 0) return [];

  switch (timeFrame) {
    case "15 min":
      // Show all entries (every 15 minutes)
      return entries;

    case "1 hour":
      // Show first entry of each hour
      const hourlyEntries: HistoricalDataEntry[] = [];
      const seenHours = new Set<string>();

      entries.forEach((entry) => {
        const hourKey = new Date(entry.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        if (!seenHours.has(hourKey)) {
          seenHours.add(hourKey);
          hourlyEntries.push(entry);
        }
      });

      return hourlyEntries;

    case "4 hour":
      // Show first entry every 4 hours
      const fourHourlyEntries: HistoricalDataEntry[] = [];
      const seenFourHourBlocks = new Set<string>();

      entries.forEach((entry) => {
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

export const getCurrentFundingRates = async (): Promise<
  Record<string, FundingRateEntry>
> => {
  try {
    const cachedResult = await getLatestFundingRateWithCache(Infinity);
    return cachedResult.data || {};
  } catch (err) {
    return {};
  }
};
