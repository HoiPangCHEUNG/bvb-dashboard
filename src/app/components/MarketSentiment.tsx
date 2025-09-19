"use client";

import React from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketSentimentProps {
  currentRates: HistoricalDataEntry;
}

export default function MarketSentiment({
  currentRates,
}: MarketSentimentProps) {
  // Calculate sentiment metrics
  const markets = Object.entries(currentRates.data);
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
    <Card>
      <CardHeader>
        <CardTitle>Market Sentiment Analysis</CardTitle>
        <div className="bg-gradient-to-r from-muted/50 to-muted rounded-lg p-4">
          <div className="text-left">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Overall Market Sentiment
            </h4>
            <p className={`text-3xl font-bold ${sentiment.color} mb-1`}>
              {sentiment.label}
            </p>
            <Badge variant="secondary">
              Weighted Rate: {weightedSentiment.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funding Distribution */}
          <div className="flex flex-col h-full">
            <h4 className="text-lg font-semibold mb-3">
              Funding Distribution
            </h4>

            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-3 flex-1">
                <Card className="bg-green-50 border-green-200 h-[72px]">
                  <CardContent className="p-4 flex justify-between items-center h-full">
                    <span className="text-sm font-medium">
                      Positive Funding
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {positiveFunding}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((positiveFunding / totalMarkets) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200 h-[72px]">
                  <CardContent className="p-4 flex justify-between items-center h-full">
                    <span className="text-sm font-medium">
                      Negative Funding
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {negativeFunding}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((negativeFunding / totalMarkets) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50 h-[72px]">
                  <CardContent className="p-4 flex justify-between items-center h-full">
                    <span className="text-sm font-medium">Neutral</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-muted-foreground">
                        {neutralFunding}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((neutralFunding / totalMarkets) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2">
                    Market Stats
                  </h5>
                  <div className="text-xs text-blue-700">
                    Total Markets: {totalMarkets}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Extreme Markets */}
          <div className="flex flex-col h-full">
            <h4 className="text-lg font-semibold mb-3">
              Extreme Market Count
            </h4>

            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-3 flex-1">
                <Card className="border-green-200 h-[72px]">
                  <CardContent className="p-4 h-full">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <div className="text-sm font-medium">
                          Extreme Bullish
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Funding Rate &gt; 100%
                        </div>
                      </div>
                      <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-700">
                          {extremePositive}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 h-[72px]">
                  <CardContent className="p-4 h-full">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <div className="text-sm font-medium">
                          Extreme Bearish
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Funding Rate &lt; -100%
                        </div>
                      </div>
                      <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-lg font-bold text-red-700">
                          {extremeNegative}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2">
                    Summary
                  </h5>
                  <div className="text-xs text-blue-700">
                    Total OI: ${(totalOI / 1000).toFixed(1)}k
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
