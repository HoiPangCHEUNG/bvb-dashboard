"use client";

import React, { useState } from "react";
import {
  FundingRateEntry,
  HistoricalDataEntry,
} from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OIConcentrationRiskProps {
  currentRates: HistoricalDataEntry;
}

export default function OIConcentrationRisk({
  currentRates,
}: OIConcentrationRiskProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
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

  const analyzeData = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse("");
    setShowAnalysis(true);

    try {
      const res = await fetch("/api/analyze-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: concentrationData,
          question,
          dataType: "concentration",
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze");

      const reader = res.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      setResponse("Error analyzing data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          OI Concentration Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
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

      <div className="mb-4 border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the concentration data..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && analyzeData()}
          />
          <button
            onClick={analyzeData}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Analyzing..." : "Ask AI"}
          </button>
        </div>

        {showAnalysis && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">AI Analysis</h4>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {response || (isLoading && "Analyzing your data...")}
              {isLoading && <span className="animate-pulse">▋</span>}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 relative">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Market
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Concentration
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                OI Distribution
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                <div className="flex items-start">
                  <span>Funding</span>
                  <div className="relative group ml-1">
                    <span className="text-xs text-muted-foreground cursor-help">ⓘ</span>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 normal-case">
                      ⚠️ indicates funding direction opposes OI dominance
                    </div>
                  </div>
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {concentrationData.map((data) => {
              const risk = getRiskLabel(data!.riskScore);
              return (
                <tr key={data!.market} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    {data!.market.replace("perps/", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className="font-semibold mr-2 text-muted-foreground">
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
                      <span className="text-xs text-muted-foreground">
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

      <div className="text-xs text-muted-foreground">
        <p>
          ⓘ Markets with high OI concentration are prone to violent moves when
          positions unwind
        </p>
      </div>
      </CardContent>
    </Card>
  );
}
