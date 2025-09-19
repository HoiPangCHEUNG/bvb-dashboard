"use client";

import React from "react";
import {
  FundingRateEntry,
  HistoricalDataEntry,
} from "../types/dashboardClient";

interface SqueezePotentialProps {
  currentRates: HistoricalDataEntry;
}

export default function SqueezePotential({
  currentRates,
}: SqueezePotentialProps) {
  // Calculate squeeze potential for each market
  const calculateSqueezePotential = (
    market: string,
    rate: FundingRateEntry
  ) => {
    const longOI = parseFloat(rate.longOI) / 1e6;
    const shortOI = parseFloat(rate.shortOI) / 1e6;
    const totalOI = longOI + shortOI;

    if (totalOI === 0) return null;

    const oiRatio =
      longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
    const dominantSide = longOI > shortOI ? "long" : "short";
    const imbalance = Math.abs(longOI - shortOI) / totalOI;

    // Short squeeze: High short OI with positive funding
    const shortSqueezeScore =
      dominantSide === "short" && rate.fundingRate > 0
        ? imbalance * 100 + Math.abs(rate.fundingRate) / 10
        : 0;

    // Long squeeze: High long OI with expensive funding
    const longSqueezeScore =
      dominantSide === "long" && rate.fundingRate > 100
        ? imbalance * 50 + rate.fundingRate / 20
        : 0;

    return {
      market,
      longOI,
      shortOI,
      oiRatio,
      dominantSide,
      imbalance: imbalance * 100,
      fundingRate: rate.fundingRate,
      shortSqueezeScore,
      longSqueezeScore,
      maxScore: Math.max(shortSqueezeScore, longSqueezeScore),
      type: shortSqueezeScore > longSqueezeScore ? "short" : "long",
    };
  };

  const squeezeData = Object.entries(currentRates.data)
    .map(([market, rate]) => calculateSqueezePotential(market, rate))
    .filter((data) => data !== null && data.maxScore > 0)
    .sort((a, b) => b!.maxScore - a!.maxScore)
    .slice(0, 10);

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-red-600 font-bold";
    if (score > 60) return "text-orange-600 font-semibold";
    if (score > 40) return "text-yellow-600 font-medium";
    return "text-gray-600";
  };

  const getSqueezeLabel = (score: number) => {
    if (score > 80) return "🔥 Extreme";
    if (score > 60) return "⚠️ High";
    if (score > 40) return "📊 Moderate";
    if (score > 20) return "📈 Low";
    return "➖ Minimal";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Squeeze Potential Analysis
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              Short Squeeze Candidates
            </h4>
            <p className="text-xs text-red-700">
              Heavy shorts with positive funding - potential upward explosion
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Long Squeeze Candidates
            </h4>
            <p className="text-xs text-blue-700">
              Expensive longs with high funding - potential downward pressure
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Market
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  OI Ratio
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Funding
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {squeezeData.map((data) => (
                <tr key={data!.market} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {data!.market.replace("perps/", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        data!.type === "short"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {data!.type === "short" ? "Short 🔺" : "Long 🔻"}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm ${getScoreColor(
                      data!.maxScore
                    )}`}
                  >
                    {data!.maxScore.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {data!.oiRatio.toFixed(1)}x {data!.dominantSide}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                      data!.fundingRate > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data!.fundingRate > 0 ? "+" : ""}
                    {data!.fundingRate.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-400">
                    {getSqueezeLabel(data!.maxScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {squeezeData.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No significant squeeze potential detected
          </p>
        )}
      </div>
    </div>
  );
}
