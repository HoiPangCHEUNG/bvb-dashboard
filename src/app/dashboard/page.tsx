import MarketSentiment from "../components/MarketSentiment";
import SqueezePotential from "../components/SqueezePotential";
import OIConcentrationRisk from "../components/OIConcentrationRisk";
import RiskDashboard from "../components/RiskDashboard";
import TopFundingRatesTable from "../components/TopFundingRatesTable";
import {
  getHistoricalFundingRates,
  getCurrentFundingRates,
} from "../../services/bvb";
import DashboardClient from "../components/DashboardClient";
import GitHubButton from "../components/GitHubButton";

export default async function DashboardPage() {
  // Get historical data for different timeframes
  const historicalData15min = await getHistoricalFundingRates(12, "15 min");
  const historicalData1hour = await getHistoricalFundingRates(24, "1 hour");
  const historicalData4hour = await getHistoricalFundingRates(48, "4 hour");

  // Get current rates from MongoDB
  const currentRates = await getCurrentFundingRates();

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
          <TopFundingRatesTable currentRates={currentRates} />
        </div>
      </div>
    </div>
  );
}
