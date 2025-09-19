"use client";

import React, { useState } from "react";
import { TimeFrame } from "../../services/bvb";
import TimeFrameSelector from "./TimeFrameSelector";
import FundingRateChart from "./FundingRateChart";
import OpenInterestChart from "./OpenInterestChart";
import FundingRateAlerts from "./FundingRateAlerts";

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

interface DashboardClientProps {
  historicalData15min: HistoricalDataEntry[];
  historicalData1hour: HistoricalDataEntry[];
  historicalData4hour: HistoricalDataEntry[];
  currentRates: Record<string, FundingRateEntry>;
  defaultChartMarkets: string[];
  defaultOIMarket: string;
}

export default function DashboardClient({
  historicalData15min,
  historicalData1hour,
  historicalData4hour,
  currentRates,
  defaultChartMarkets,
  defaultOIMarket,
}: DashboardClientProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("15 min");

  // Get the appropriate historical data based on selected timeframe
  const getHistoricalDataForTimeFrame = (
    timeFrame: TimeFrame
  ): HistoricalDataEntry[] => {
    switch (timeFrame) {
      case "15 min":
        return historicalData15min;
      case "1 hour":
        return historicalData1hour;
      case "4 hour":
        return historicalData4hour;
      default:
        return historicalData15min;
    }
  };

  const currentHistoricalData =
    getHistoricalDataForTimeFrame(selectedTimeFrame);

  return (
    <>
      <TimeFrameSelector
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={setSelectedTimeFrame}
      />

      {/* Alerts Section */}
      <div className="mb-8">
        <FundingRateAlerts
          historicalData={currentHistoricalData}
          currentRates={currentRates}
          selectedTimeFrame={selectedTimeFrame}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Funding Rate Trends ({selectedTimeFrame})
          </h2>
          <FundingRateChart
            historicalData={currentHistoricalData}
            initialSelectedMarkets={defaultChartMarkets}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Open Interest Analysis ({selectedTimeFrame})
          </h2>
          <OpenInterestChart
            historicalData={currentHistoricalData}
            initialSelectedMarket={defaultOIMarket}
          />
        </div>
      </div>
    </>
  );
}
