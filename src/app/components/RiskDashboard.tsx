"use client";

import React from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processRiskDashboard } from "../../utils/dataProcessors";

interface RiskDashboardProps {
  currentRates: HistoricalDataEntry;
  historicalData: HistoricalDataEntry[];
}

export default function RiskDashboard({
  currentRates,
  historicalData,
}: RiskDashboardProps) {
  // Use the shared data processor with destructuring
  const {
    overallRisk,
    totalLongOI,
    totalShortOI,
    extremeFundingCount,
    imbalancedMarkets,
    volatilityScore,
    oiImbalance,
    longOIPercent,
    shortOIPercent,
    riskLevel,
    marketRisks,
  } = processRiskDashboard(currentRates, historicalData);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Risk Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground italic">
              Overall Market Risk
            </h4>
            <span className={`text-lg font-bold ${riskLevel.textColor}`}>
              {riskLevel.label}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              className={`h-5 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${riskLevel.color}`}
              style={{ width: `${overallRisk}%` }}
            >
              {overallRisk.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start mb-1">
              <div className="relative group ml-1">
                <p className="text-xs text-muted-foreground cursor-help">
                  OI Imbalance ⓘ
                </p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  |Long OI - Short OI| / Total OI x 100%
                </div>
              </div>
            </div>
            <p className="text-lg font-bold">
              {oiImbalance.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start mb-1">
              <div className="relative group ml-1">
                <p className="text-xs text-muted-foreground cursor-help">
                  Extreme Funding ⓘ
                </p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Markets with funding rates &gt; 100% or &lt; -100%
                </div>
              </div>
            </div>
            <p className="text-lg font-bold">
              {extremeFundingCount} markets
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start mb-1">
              <div className="relative group ml-1">
                <p className="text-xs text-muted-foreground cursor-help">
                  Imbalanced OI ⓘ
                </p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Markets with OI ratio &gt; 5:1 (long:short or short:long)
                </div>
              </div>
            </div>
            <p className="text-lg font-bold">
              {imbalancedMarkets} markets
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start mb-1">
              <div className="relative group ml-1">
                <p className="text-xs text-muted-foreground cursor-help">
                  Volatility Score ⓘ
                </p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Average funding rate change over last 10 periods
                </div>
              </div>
            </div>
            <p className="text-lg font-bold">
              {volatilityScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Total OI Distribution */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 italic">
            Total Open Interest Distribution
          </h4>
          <div className="flex items-center space-x-2">
            {/* <span className="text-xs text-gray-500">Long</span> */}
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-5 flex">
                <div
                  className="bg-green-500 h-full rounded-l-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    width: `${longOIPercent}%`,
                  }}
                >
                  ${(totalLongOI / 1000).toFixed(0)}k ({longOIPercent.toFixed(2)}%)
                </div>
                <div
                  className="bg-red-500 h-full rounded-r-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    width: `${shortOIPercent}%`,
                  }}
                >
                  ${(totalShortOI / 1000).toFixed(0)}k ({shortOIPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            {/* <span className="text-xs text-gray-500">Short</span> */}
          </div>
        </div>

        {/* Highest Risk Markets */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 italic">
            Highest Risk Markets
          </h4>
          <div className="space-y-2">
            {marketRisks.map((item) => (
              <div
                key={item.market}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm font-bold">
                  {item.market.replace("perps/", "").toUpperCase()}
                </span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.risk >= 75
                          ? "bg-red-500"
                          : item.risk >= 50
                          ? "bg-orange-500"
                          : item.risk >= 25
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${item.risk}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.risk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ Overall Risk Score (0-100) = OI Imbalance (25%) + Extreme Funding
            Markets (25%) + Imbalanced Markets (25%) + Volatility (25%). Higher
            scores indicate increased probability of violent market moves.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
