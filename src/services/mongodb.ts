import { MongoClient, Db } from "mongodb";

let client: MongoClient;

const checkConnection = async () => {
  if (!client) return false;

  try {
    await client.connect();
    return true;
  } catch (err) {
    await client.close();
    return false;
  }
};

export const getClient = async (uri?: string): Promise<MongoClient> => {
  if (await checkConnection()) return client;

  const finalUri = uri || process.env.MONGODB_URI;
  if (!finalUri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  client = new MongoClient(finalUri);
  await client.connect();

  return client;
};

export async function getDatabase(): Promise<Db> {
  const client = await getClient();
  return client.db("dashboard");
}

interface Market {
  denom: string;
  display: string;
}

export interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  price?: string;
  timestamp: number;
}

export interface FundingRateDocument {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
  createdAt?: Date;
}

export async function upsertMarkets(data: Market[]): Promise<void> {
  const db = await getDatabase();
  const marketsCollection = db.collection<Market>("markets");

  const bulkOps = data.map((market) => ({
    updateOne: {
      filter: { denom: market.denom },
      update: {
        $set: {
          display: market.display,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await marketsCollection.bulkWrite(bulkOps);
  }
}

export async function insertFundingRate(
  data: Record<string, FundingRateEntry>
): Promise<void> {
  const db = await getDatabase();
  const fundingRatesCollection =
    db.collection<FundingRateDocument>("funding_rates");

  const timestamp = Date.now();
  const document: FundingRateDocument = {
    timestamp,
    data,
    createdAt: new Date(timestamp),
  };

  await fundingRatesCollection.insertOne(document);

  // Create indexes if they don't exist (this is idempotent)
  await fundingRatesCollection.createIndex({ timestamp: -1 });
  await fundingRatesCollection.createIndex({ createdAt: -1 });
}

export async function getFundingRatesInRange(
  startTime: number,
  endTime?: number
): Promise<FundingRateDocument[]> {
  const db = await getDatabase();
  const fundingRatesCollection =
    db.collection<FundingRateDocument>("funding_rates");

  const query: { timestamp: { $gte: number; $lte?: number } } = {
    timestamp: { $gte: startTime },
  };
  if (endTime) {
    query.timestamp.$lte = endTime;
  }

  const rates = await fundingRatesCollection
    .find(query)
    .sort({ timestamp: 1 })
    .toArray();

  return rates;
}

export async function getLatestFundingRateWithCache(
  cacheTimeMs: number
): Promise<{
  data: Record<string, FundingRateEntry> | null;
  fromCache: boolean;
}> {
  const db = await getDatabase();
  const fundingRatesCollection =
    db.collection<FundingRateDocument>("funding_rates");

  const latest = await fundingRatesCollection.findOne(
    {},
    { sort: { timestamp: -1 } }
  );

  if (!latest) {
    return { data: null, fromCache: false };
  }

  const now = Date.now();
  const isFromCache = now - latest.timestamp < cacheTimeMs;

  return {
    data: latest.data,
    fromCache: isFromCache,
  };
}
