"use client";

import React, { useState } from "react";
import { TimeFrame } from "../../services/bvb";
import TimeFrameSelector from "./TimeFrameSelector";
import FundingRateChart from "./FundingRateChart";
import OpenInterestChart from "./OpenInterestChart";
import PriceChart from "./PriceChart";
import FundingRateAlerts from "./FundingRateAlerts";
import { HistoricalDataEntry } from "../types/dashboardClient";

interface DashboardClientProps {
  historicalData15min: HistoricalDataEntry[];
  historicalData1hour: HistoricalDataEntry[];
  historicalData4hour: HistoricalDataEntry[];
  currentRates: HistoricalDataEntry;
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
    useState<TimeFrame>("1 hour");

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
        return historicalData1hour;
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

      {/* First Row: Alerts and Funding Rate Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 lg:items-stretch">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Funding Rate Alerts ({selectedTimeFrame})
          </h2>
          <FundingRateAlerts
            historicalData={currentHistoricalData}
            currentRates={currentRates}
            selectedTimeFrame={selectedTimeFrame}
          />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Funding Rate Trends ({selectedTimeFrame})
          </h2>
          <div className="flex-1">
            <FundingRateChart
              historicalData={currentHistoricalData}
              initialSelectedMarkets={defaultChartMarkets}
            />
          </div>
        </div>
      </div>

      {/* Second Row: Open Interest and Price Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Open Interest Comparison ({selectedTimeFrame})
          </h2>
          <div className="flex-1">
            <OpenInterestChart
              historicalData={currentHistoricalData}
              initialSelectedMarket={defaultOIMarket}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Price Movement ({selectedTimeFrame})
          </h2>
          <div className="flex-1">
            <PriceChart
              historicalData={currentHistoricalData}
              initialSelectedMarkets={defaultChartMarkets}
            />
          </div>
        </div>
      </div>
    </>
  );
}
