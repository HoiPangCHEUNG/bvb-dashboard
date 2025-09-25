"use client";

import React from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { processMarketSentiment } from "../../utils/dataProcessors";

interface MarketSentimentProps {
  currentRates: HistoricalDataEntry;
}

export default function MarketSentiment({
  currentRates,
}: MarketSentimentProps) {
  // Use the shared data processor with destructuring
  const {
    totalMarkets,
    positiveFunding,
    negativeFunding,
    neutralFunding,
    weightedSentiment,
    sentimentLabel,
    sentimentColor,
    extremePositive,
    extremeNegative,
    totalOI,
    positiveFundingPercentage,
    negativeFundingPercentage,
    neutralFundingPercentage,
  } = processMarketSentiment(currentRates);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Sentiment Header Card */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
          <div className="text-left">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Overall Market Sentiment
            </h4>
            <p className={`text-3xl font-bold ${sentimentColor} mb-1`}>
              {sentimentLabel}
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
                    {positiveFundingPercentage.toFixed(1)}%
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
                    {negativeFundingPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center h-20">
                <span className="text-sm font-medium text-gray-700">
                  Neutral
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-600">
                    {neutralFunding}
                  </div>
                  <div className="text-xs text-gray-500">
                    {neutralFundingPercentage.toFixed(1)}%
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
      </CardContent>
    </Card>
  );
}
