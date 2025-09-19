"use client";

import React from "react";
import {
  FundingRateEntry,
  HistoricalDataEntry,
} from "../types/dashboardClient";

interface OIConcentrationRiskProps {
  currentRates: HistoricalDataEntry;
}

export default function OIConcentrationRisk({
  currentRates,
}: OIConcentrationRiskProps) {
  // Calculate OI concentration for each market
  const calculateConcentration = (market: string, rate: FundingRateEntry) => {
    const longOI = parseFloat(rate.longOI) / 1e6;
    const shortOI = parseFloat(rate.shortOI) / 1e6;
    const totalOI = longOI + shortOI;

    if (totalOI === 0) return null;

    const longPercent = (longOI / totalOI) * 100;
    const shortPercent = (shortOI / totalOI) * 100;
    const concentration = Math.max(longPercent, shortPercent);
    const dominantSide = longPercent > shortPercent ? "long" : "short";
    const ratio =
      longOI > shortOI
        ? longOI / (shortOI || 0.001)
        : shortOI / (longOI || 0.001);

    // Risk score based on concentration and funding alignment
    let riskScore = 0;
    if (concentration > 90) riskScore = 100;
    else if (concentration > 80) riskScore = 80;
    else if (concentration > 70) riskScore = 60;
    else if (concentration > 60) riskScore = 40;
    else riskScore = 20;

    // Adjust risk based on funding direction
    const fundingAligned =
      (dominantSide === "long" && rate.fundingRate > 0) ||
      (dominantSide === "short" && rate.fundingRate < 0);

    if (!fundingAligned) {
      riskScore *= 1.5; // Higher risk when funding opposes concentration
    }

    return {
      market,
      longOI,
      shortOI,
      totalOI,
      concentration,
      dominantSide,
      ratio,
      fundingRate: rate.fundingRate,
      fundingAligned,
      riskScore: Math.min(100, riskScore),
    };
  };

  const concentrationData = Object.entries(currentRates.data)
    .map(([market, rate]) => calculateConcentration(market, rate))
    .filter((data) => data !== null && data.totalOI > 0)
    .sort((a, b) => b!.concentration - a!.concentration)
    .slice(0, 15);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return { label: "Critical", color: "text-red-600" };
    if (score >= 60) return { label: "High", color: "text-orange-600" };
    if (score >= 40) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Low", color: "text-green-600" };
  };

  // Summary statistics
  const criticalRisk = concentrationData.filter(
    (d) => d!.riskScore >= 80
  ).length;
  const highRisk = concentrationData.filter(
    (d) => d!.riskScore >= 60 && d!.riskScore < 80
  ).length;
  const extremeConcentration = concentrationData.filter(
    (d) => d!.concentration > 90
  ).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        OI Concentration Risk Analysis
      </h3>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-red-600">{criticalRisk}</p>
          <p className="text-xs text-red-700">Critical Risk Markets</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-orange-600">{highRisk}</p>
          <p className="text-xs text-orange-700">High Risk Markets</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-purple-600">
            {extremeConcentration}
          </p>
          <p className="text-xs text-purple-700">&gt;90% Concentration</p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 relative">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Market
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Concentration
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                OI Distribution
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-start">
                  <span>Funding</span>
                  <div className="relative group ml-1">
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 normal-case">
                      ⚠️ indicates funding direction opposes OI dominance
                    </div>
                  </div>
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {concentrationData.map((data) => {
              const risk = getRiskLabel(data!.riskScore);
              return (
                <tr key={data!.market} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {data!.market.replace("perps/", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className="font-semibold mr-2 text-gray-400">
                        {data!.concentration.toFixed(1)}%
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          data!.dominantSide === "long"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {data!.dominantSide}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4 flex">
                          <div
                            className="bg-green-500 h-full rounded-l-full"
                            style={{
                              width: `${(data!.longOI / data!.totalOI) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-red-500 h-full rounded-r-full"
                            style={{
                              width: `${
                                (data!.shortOI / data!.totalOI) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {data!.ratio > 1000
                          ? "∞"
                          : `${data!.ratio.toFixed(1)}x`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span
                        className={`font-medium ${
                          data!.fundingRate > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {data!.fundingRate > 0 ? "+" : ""}
                        {data!.fundingRate.toFixed(1)}%
                      </span>
                      {!data!.fundingAligned && (
                        <span className="ml-1 text-xs text-orange-600">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${getRiskColor(
                            data!.riskScore
                          )}`}
                          style={{ width: `${data!.riskScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${risk.color}`}>
                        {risk.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          ⓘ Markets with high OI concentration are prone to violent moves when
          positions unwind
        </p>
      </div>
    </div>
  );
}
