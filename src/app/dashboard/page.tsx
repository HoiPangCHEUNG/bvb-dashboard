import FundingRateChart from "../components/FundingRateChart";
import OpenInterestChart from "../components/OpenInterestChart";
import MarketSentiment from "../components/MarketSentiment";
import SqueezePotential from "../components/SqueezePotential";
import OIConcentrationRisk from "../components/OIConcentrationRisk";
import RiskDashboard from "../components/RiskDashboard";
import FundingRateAlerts from "../components/FundingRateAlerts";
import TopFundingRatesTable from "../components/TopFundingRatesTable";
import fs from "fs";
import path from "path";
import { getClient } from "../utils/bvb";

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

export default async function DashboardPage() {
  // Only read the cached data, don't fetch new data
  // The cron job will handle fetching new data every 15 minutes

  // Read the funding rate data file
  const dataDir = "./data";
  const fundingRateFile = path.join(dataDir, "funding-rates.json");

  let fundingData: FundingRateData = {};
  if (fs.existsSync(fundingRateFile)) {
    try {
      const fileContent = fs.readFileSync(fundingRateFile, "utf8");
      fundingData = JSON.parse(fileContent);
    } catch (err) {
      console.error("Error reading funding rate data:", err);
    }
  }

  const historicalData = fundingData.historicalData || [];
  const currentRates = fundingData.currentRates || {};

  // Default selected markets for the funding rate chart
  const defaultChartMarkets = [
    "perps/ulink",
    "perps/uakt",
    "perps/uinj",
    "perps/ubtc",
    "perps/ueth",
  ].filter((market) => currentRates[market]); // Only include if they exist

  // Default market for OI analysis
  const defaultOIMarket = "perps/ulink";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          BVB Data Dashboard
        </h1>

        {/* Risk Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <MarketSentiment currentRates={currentRates} />
          <RiskDashboard
            currentRates={currentRates}
            historicalData={historicalData}
          />
        </div>

        {/* Alerts Section */}
        <div className="mb-8">
          <FundingRateAlerts
            historicalData={historicalData}
            currentRates={currentRates}
          />
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SqueezePotential currentRates={currentRates} />
          <OIConcentrationRisk currentRates={currentRates} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Funding Rate Trends
            </h2>
            <FundingRateChart
              historicalData={historicalData}
              initialSelectedMarkets={defaultChartMarkets}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Open Interest Analysis
            </h2>
            <OpenInterestChart
              historicalData={historicalData}
              initialSelectedMarket={defaultOIMarket}
            />
          </div>
        </div>

        {/* Top Funding Rates Table */}
        <div className="mt-8">
          <TopFundingRatesTable currentRates={currentRates} />
        </div>
      </div>
    </div>
  );
}
