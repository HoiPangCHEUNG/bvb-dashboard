"use client";

import React from "react";
import {
  FundingRateEntry,
  HistoricalDataEntry,
} from "../types/dashboardClient";

interface RiskDashboardProps {
  currentRates: HistoricalDataEntry;
  historicalData: HistoricalDataEntry[];
}

export default function RiskDashboard({
  currentRates,
  historicalData,
}: RiskDashboardProps) {
  // Calculate various risk metrics
  const calculateRiskMetrics = () => {
    const markets = Object.entries(currentRates.data);

    // Overall market metrics
    let totalLongOI = 0;
    let totalShortOI = 0;
    let extremeFundingCount = 0;
    let imbalancedMarkets = 0;
    let volatilityScore = 0;

    markets.forEach(([_, rate]) => {
      console.log(rate);
      const longOI = parseFloat(rate.longOI) / 1e6;
      const shortOI = parseFloat(rate.shortOI) / 1e6;

      totalLongOI += longOI;
      totalShortOI += shortOI;

      // Count extreme funding
      if (Math.abs(rate.fundingRate) > 100) extremeFundingCount++;

      // Count imbalanced markets
      const ratio =
        longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
      if (ratio > 5) imbalancedMarkets++;
    });

    // Calculate funding rate volatility
    if (historicalData.length > 1) {
      const recentData = historicalData.slice(-10);
      const fundingChanges = recentData.slice(1).map((entry, idx) => {
        const prevEntry = recentData[idx];
        let totalChange = 0;
        let count = 0;

        Object.keys(entry.data).forEach((market) => {
          if (prevEntry.data[market]) {
            const change = Math.abs(
              entry.data[market].fundingRate -
                prevEntry.data[market].fundingRate
            );
            totalChange += change;
            count++;
          }
        });

        return count > 0 ? totalChange / count : 0;
      });

      volatilityScore =
        fundingChanges.reduce((a, b) => a + b, 0) / fundingChanges.length;
    }

    // Calculate overall risk score (0-100)
    let overallRisk = 0;

    // Factor 1: OI Imbalance (0-25 points)
    const oiImbalance =
      Math.abs(totalLongOI - totalShortOI) / (totalLongOI + totalShortOI);
    overallRisk += oiImbalance * 25;

    // Factor 2: Extreme funding markets (0-25 points)
    const extremeRatio = extremeFundingCount / markets.length;
    overallRisk += extremeRatio * 25;

    // Factor 3: Market concentration (0-25 points)
    const concentrationRatio = imbalancedMarkets / markets.length;
    overallRisk += concentrationRatio * 25;

    // Factor 4: Volatility (0-25 points)
    overallRisk += Math.min(volatilityScore, 25);

    return {
      overallRisk: Math.min(100, overallRisk),
      totalLongOI,
      totalShortOI,
      extremeFundingCount,
      imbalancedMarkets,
      volatilityScore,
      oiImbalance: oiImbalance * 100,
    };
  };

  const metrics = calculateRiskMetrics();

  const getRiskLevel = (score: number) => {
    if (score >= 75)
      return {
        label: "Critical",
        color: "bg-red-500",
        textColor: "text-red-500",
      };
    if (score >= 50)
      return {
        label: "High",
        color: "bg-orange-500",
        textColor: "text-orange-500",
      };
    if (score >= 25)
      return {
        label: "Medium",
        color: "bg-yellow-500",
        textColor: "text-yellow-500",
      };
    return { label: "Low", color: "bg-green-500", textColor: "text-green-500" };
  };

  const riskLevel = getRiskLevel(metrics.overallRisk);

  // Find highest risk markets
  const marketRisks = Object.entries(currentRates.data)
    .map(([market, rate]) => {
      const longOI = parseFloat(rate.longOI) / 1e6;
      const shortOI = parseFloat(rate.shortOI) / 1e6;
      const totalOI = longOI + shortOI;

      if (totalOI === 0) return null;

      const ratio =
        longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
      const fundingExtreme = Math.abs(rate.fundingRate);

      // Market-specific risk score
      let risk = 0;
      if (ratio > 10) risk += 40;
      else if (ratio > 5) risk += 25;
      else if (ratio > 3) risk += 15;

      if (fundingExtreme > 200) risk += 40;
      else if (fundingExtreme > 100) risk += 25;
      else if (fundingExtreme > 50) risk += 15;

      // Misalignment bonus
      if (
        (longOI > shortOI && rate.fundingRate < 0) ||
        (shortOI > longOI && rate.fundingRate > 0)
      ) {
        risk += 20;
      }

      return { market, risk: Math.min(100, risk), totalOI };
    })
    .filter((d) => d !== null && d.risk > 30)
    .sort((a, b) => b!.risk - a!.risk)
    .slice(0, 5);

  const longOIPercent = (
    (metrics.totalLongOI / (metrics.totalLongOI + metrics.totalShortOI)) *
    100
  ).toFixed(2);
  const shortOIPercent = (
    (metrics.totalShortOI / (metrics.totalLongOI + metrics.totalShortOI)) *
    100
  ).toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Risk Dashboard
      </h3>

      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 italic">
            Overall Market Risk
          </h4>
          <span className={`text-lg font-bold ${riskLevel.textColor}`}>
            {riskLevel.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-5">
          <div
            className={`h-5 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${riskLevel.color}`}
            style={{ width: `${metrics.overallRisk}%` }}
          >
            {metrics.overallRisk.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start mb-1">
            <div className="relative group ml-1">
              <p className="text-xs text-gray-600 cursor-help">
                OI Imbalance ⓘ
              </p>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                |Long OI - Short OI| / Total OI x 100%
              </div>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {metrics.oiImbalance.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start mb-1">
            <div className="relative group ml-1">
              <p className="text-xs text-gray-600 cursor-help">
                Extreme Funding ⓘ
              </p>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Markets with funding rates &gt; 100% or &lt; -100%
              </div>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {metrics.extremeFundingCount} markets
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start mb-1">
            <div className="relative group ml-1">
              <p className="text-xs text-gray-600 cursor-help">
                Imbalanced OI ⓘ
              </p>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Markets with OI ratio &gt; 5:1 (long:short or short:long)
              </div>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {metrics.imbalancedMarkets} markets
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start mb-1">
            <div className="relative group ml-1">
              <p className="text-xs text-gray-600 cursor-help">
                Volatility Score ⓘ
              </p>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Average funding rate change over last 10 periods
              </div>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {metrics.volatilityScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Total OI Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2 italic">
          Total Open Interest Distribution
        </h4>
        <div className="flex items-center space-x-2">
          {/* <span className="text-xs text-gray-500">Long</span> */}
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-5 flex">
              <div
                className="bg-green-500 h-full rounded-l-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${
                    (metrics.totalLongOI /
                      (metrics.totalLongOI + metrics.totalShortOI)) *
                    100
                  }%`,
                }}
              >
                ${(metrics.totalLongOI / 1000).toFixed(0)}k (${longOIPercent}%)
              </div>
              <div
                className="bg-red-500 h-full rounded-r-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${
                    (metrics.totalShortOI /
                      (metrics.totalLongOI + metrics.totalShortOI)) *
                    100
                  }%`,
                }}
              >
                ${(metrics.totalShortOI / 1000).toFixed(0)}k ({shortOIPercent}%)
              </div>
            </div>
          </div>
          {/* <span className="text-xs text-gray-500">Short</span> */}
        </div>
      </div>

      {/* Highest Risk Markets */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 italic">
          Highest Risk Markets
        </h4>
        <div className="space-y-2">
          {marketRisks.map((item) => (
            <div
              key={item!.market}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm font-bold text-gray-900">
                {item!.market.replace("perps/", "").toUpperCase()}
              </span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className={`h-2 rounded-full ${
                      item!.risk >= 75
                        ? "bg-red-500"
                        : item!.risk >= 50
                        ? "bg-orange-500"
                        : item!.risk >= 25
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${item!.risk}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{item!.risk}%</span>
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
    </div>
  );
}
