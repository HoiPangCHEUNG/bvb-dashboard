"use client";

import React from "react";

interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  timestamp: number;
}

interface MarketSentimentProps {
  currentRates: Record<string, FundingRateEntry>;
}

export default function MarketSentiment({
  currentRates,
}: MarketSentimentProps) {
  // Calculate sentiment metrics
  const markets = Object.entries(currentRates);
  const totalMarkets = markets.length;

  // Count positive vs negative funding
  const positiveFunding = markets.filter(
    ([_, rate]) => rate.fundingRate > 0
  ).length;
  const negativeFunding = markets.filter(
    ([_, rate]) => rate.fundingRate < 0
  ).length;
  const neutralFunding = markets.filter(
    ([_, rate]) => rate.fundingRate === 0
  ).length;

  // Calculate OI-weighted sentiment
  let totalWeightedFunding = 0;
  let totalOI = 0;

  markets.forEach(([_, rate]) => {
    const marketOI = (parseFloat(rate.longOI) + parseFloat(rate.shortOI)) / 1e6;
    totalWeightedFunding += rate.fundingRate * marketOI;
    totalOI += marketOI;
  });

  const weightedSentiment = totalOI > 0 ? totalWeightedFunding / totalOI : 0;

  // Calculate extreme rates
  const extremePositive = markets.filter(
    ([_, rate]) => rate.fundingRate > 100
  ).length;
  const extremeNegative = markets.filter(
    ([_, rate]) => rate.fundingRate < -100
  ).length;

  // Determine overall market sentiment
  const getSentimentLabel = () => {
    if (weightedSentiment > 50)
      return { label: "Extremely Bullish", color: "text-green-500" };
    if (weightedSentiment > 20)
      return { label: "Bullish", color: "text-green-500" };
    if (weightedSentiment > 5)
      return { label: "Slightly Bullish", color: "text-green-400" };
    if (weightedSentiment < -50)
      return { label: "Extremely Bearish", color: "text-red-500" };
    if (weightedSentiment < -20)
      return { label: "Bearish", color: "text-red-500" };
    if (weightedSentiment < -5)
      return { label: "Slightly Bearish", color: "text-red-400" };
    return { label: "Neutral", color: "text-gray-600" };
  };

  const sentiment = getSentimentLabel();

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Market Sentiment Analysis
      </h3>

      {/* Overall Sentiment Header Card */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
        <div className="text-left">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Overall Market Sentiment
          </h4>
          <p className={`text-3xl font-bold ${sentiment.color} mb-1`}>
            {sentiment.label}
          </p>
          <p className="text-sm text-gray-600 bg-gray-200 rounded-full px-3 py-1 inline-block">
            Weighted Rate: {weightedSentiment.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Distribution */}
        <div className="space-y-4 h-full flex flex-col">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Funding Distribution
          </h4>

          <div className="space-y-3 flex-1">
            <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center h-20">
              <span className="text-sm font-medium text-gray-700">
                Positive Funding
              </span>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {positiveFunding}
                </div>
                <div className="text-xs text-gray-500">
                  {((positiveFunding / totalMarkets) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 flex justify-between items-center h-20">
              <span className="text-sm font-medium text-gray-700">
                Negative Funding
              </span>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  {negativeFunding}
                </div>
                <div className="text-xs text-gray-500">
                  {((negativeFunding / totalMarkets) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center h-20">
              <span className="text-sm font-medium text-gray-700">Neutral</span>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-600">
                  {neutralFunding}
                </div>
                <div className="text-xs text-gray-500">
                  {((neutralFunding / totalMarkets) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Additional Market Stats */}
          <div className="bg-indigo-50 rounded-lg p-4 mt-auto">
            <h5 className="text-sm font-semibold text-indigo-800 mb-2">
              Market Stats
            </h5>
            <div className="space-y-1 text-xs text-indigo-700">
              <div>Total Markets: {totalMarkets}</div>
            </div>
          </div>
        </div>

        {/* Extreme Markets */}
        <div className="space-y-4 h-full flex flex-col">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Extreme Market Count
          </h4>

          <div className="space-y-3 flex-1">
            <div className="border border-green-200 rounded-lg p-4 h-20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Extreme Bullish
                  </div>
                  <div className="text-xs text-gray-500">
                    Funding Rate &gt; 100%
                  </div>
                </div>
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-700">
                    {extremePositive}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-red-200 rounded-lg p-4 h-20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Extreme Bearish
                  </div>
                  <div className="text-xs text-gray-500">
                    Funding Rate &lt; -100%
                  </div>
                </div>
                <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-700">
                    {extremeNegative}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-blue-800 mb-2">
              Summary
            </h5>
            <div className="space-y-1 text-xs text-blue-700">
              <div>Total OI: ${(totalOI / 1000).toFixed(1)}k</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
