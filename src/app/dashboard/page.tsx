import MarketSentiment from "../components/MarketSentiment";
import SqueezePotential from "../components/SqueezePotential";
import OIConcentrationRisk from "../components/OIConcentrationRisk";
import RiskDashboard from "../components/RiskDashboard";
import TopFundingRatesTable from "../components/TopFundingRatesTable";
import { getHistoricalFundingRates } from "../../services/bvb";
import DashboardClient from "../components/DashboardClient";
import GitHubButton from "../components/GitHubButton";

export default async function DashboardPage() {
  // Fetch all raw data once for 48 hours to reduce DB calls
  const allHistoricalData = await getHistoricalFundingRates(48, "15 min");

  // Filter locally to create different timeframe views
  const historicalData15min = allHistoricalData.slice(-48); // Last 12 hours (12 * 4 = 48 entries at 15-min intervals)

  // Create 1-hour data by taking every 4th entry from the end (15min * 4 = 1 hour)
  const historicalData1hour = allHistoricalData
    .slice()
    .reverse()
    .filter((_, index) => index % 4 === 0)
    .slice(0, 24)
    .reverse();

  // Create 4-hour data by taking every 16th entry from the end (15min * 16 = 4 hours)
  const historicalData4hour = allHistoricalData
    .slice()
    .reverse()
    .filter((_, index) => index % 16 === 0)
    .slice(0, 48)
    .reverse();

  const currentRates = historicalData15min[historicalData15min.length - 1];

  // Default selected markets for the funding rate chart
  const defaultChartMarkets = [
    "perps/ulink",
    "perps/uakt",
    "perps/uinj",
    "perps/ubtc",
    "perps/ueth",
  ].filter((market) => currentRates.data[market]); // Only include if they exist

  // Default market for OI analysis
  const defaultOIMarket = "perps/ulink";

  return (
    <div className="min-h-screen bg-background p-8 bg-neutral-200">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">BVB Data Dashboard</h1>
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

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SqueezePotential currentRates={currentRates} />
          <OIConcentrationRisk currentRates={currentRates} />
        </div>

        {/* TimeFrame Selector, Alerts and Charts */}
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
          <TopFundingRatesTable currentRates={currentRates.data} />
        </div>
      </div>
    </div>
  );
}
