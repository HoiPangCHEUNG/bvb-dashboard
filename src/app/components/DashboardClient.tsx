"use client";

import React, { useState, useMemo } from "react";
import { TimeFrame } from "../../services/bvb";
import ControlsSelector from "./ControlsSelector";
import FundingRateChart from "./FundingRateChart";
import OpenInterestChart from "./OpenInterestChart";
import PriceChart from "./PriceChart";
import FundingRateAlerts from "./FundingRateAlerts";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { createSelectOptions } from "./shared/chartUtils";

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

  // Unified single market selection state
  const [selectedMarket, setSelectedMarket] = useState<string>(
    defaultOIMarket ||
      (defaultChartMarkets && defaultChartMarkets.length > 0
        ? defaultChartMarkets[0]
        : "")
  );

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

  // Get all unique markets for market selector
  const allMarkets = useMemo(() => {
    return Array.from(
      new Set(
        currentHistoricalData && currentHistoricalData.length > 0
          ? currentHistoricalData.flatMap((entry) => Object.keys(entry.data))
          : []
      )
    ).sort();
  }, [currentHistoricalData]);

  // Market selector options and handlers
  const marketOptions = useMemo(() => {
    return createSelectOptions(allMarkets);
  }, [allMarkets]);

  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
  };

  return (
    <>
      <ControlsSelector
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={setSelectedTimeFrame}
        selectedMarket={selectedMarket}
        onMarketChange={handleMarketChange}
        marketOptions={marketOptions}
      />

      {/* First Row: Alerts and Funding Rate Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 lg:items-stretch">
        <div className="flex flex-col">
          <FundingRateAlerts
            historicalData={currentHistoricalData}
            currentRates={currentRates}
            selectedTimeFrame={selectedTimeFrame}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex-1">
            <OpenInterestChart
              historicalData={currentHistoricalData}
              selectedMarket={selectedMarket}
            />
          </div>
        </div>
      </div>

      {/* Second Row: Open Interest and Price Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch">
        <div className="flex flex-col">
          <div className="flex-1">
            <FundingRateChart
              historicalData={currentHistoricalData}
              selectedMarket={selectedMarket}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex-1">
            <PriceChart
              historicalData={currentHistoricalData}
              selectedMarket={selectedMarket}
            />
          </div>
        </div>
      </div>
    </>
  );
}
