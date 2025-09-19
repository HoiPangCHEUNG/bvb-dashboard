export interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  timestamp: number;
}

export interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}
