import FundingRateChart from "../components/FundingRateChart";
import OpenInterestChart from "../components/OpenInterestChart";
import MarketSentiment from "../components/MarketSentiment";
import SqueezePotential from "../components/SqueezePotential";
import OIConcentrationRisk from "../components/OIConcentrationRisk";
import RiskDashboard from "../components/RiskDashboard";
import FundingRateAlerts from "../components/FundingRateAlerts";
import TopFundingRatesTable from "../components/TopFundingRatesTable";
import {
  getMarkets,
  getHistoricalFundingRates,
  getCurrentFundingRates,
} from "../utils/bvb";
import DashboardClient from "../components/DashboardClient";
import GitHubButton from "../components/GitHubButton";

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

export default async function DashboardPage() {
  // Only read the cached data, don't fetch new data
  // The cron job will handle fetching new data every 15 minutes

  const markets = await getMarkets();

  // Get historical data for different timeframes (last 10 hours for demo)
  const historicalData15min = getHistoricalFundingRates(12, "15min");
  const historicalData1hour = getHistoricalFundingRates(24, "1hour");
  const historicalData4hour = getHistoricalFundingRates(48, "4hour");

  // Get current rates from the latest hourly file
  const currentRates = getCurrentFundingRates();

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            BVB Data Dashboard
          </h1>
          <GitHubButton url="https://github.com/HoiPangCHEUNG/bvb-dashboard" />
        </div>

        {/* Risk Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <MarketSentiment currentRates={currentRates} />
          <RiskDashboard
            currentRates={currentRates}
            historicalData={historicalData15min}
          />
        </div>

        {/* Alerts Section */}
        <div className="mb-8">
          <FundingRateAlerts
            historicalData={historicalData15min}
            currentRates={currentRates}
          />
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SqueezePotential currentRates={currentRates} />
          <OIConcentrationRisk currentRates={currentRates} />
        </div>

        {/* TimeFrame Selector and Charts */}
        <DashboardClient
          historicalData15min={historicalData15min}
          historicalData1hour={historicalData1hour}
          historicalData4hour={historicalData4hour}
          currentRates={currentRates}
          defaultChartMarkets={defaultChartMarkets}
          defaultOIMarket={defaultOIMarket}
        />

        {/* Top Funding Rates Table */}
        <div className="mt-8">
          <TopFundingRatesTable currentRates={currentRates} />
        </div>
      </div>
    </div>
  );
}
