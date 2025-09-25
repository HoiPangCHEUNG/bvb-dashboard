"use client";

import React, { useState } from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  processOIConcentration,
  getRiskColor,
  getRiskLabel,
} from "../../utils/dataProcessors";

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

  // Use the shared data processor
  const concentrationData = processOIConcentration(currentRates);

  // Summary statistics
  const criticalRisk = concentrationData.filter(
    (d) => d.riskScore >= 80
  ).length;
  const highRisk = concentrationData.filter(
    (d) => d.riskScore >= 60 && d.riskScore < 80
  ).length;
  const extremeConcentration = concentrationData.filter(
    (d) => d.concentration > 90
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
                      <span className="text-xs text-muted-foreground cursor-help">
                        ⓘ
                      </span>
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
                const risk = getRiskLabel(data.riskScore);
                return (
                  <tr key={data.market} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      {data.market.replace("perps/", "").toUpperCase()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="font-semibold mr-2 text-muted-foreground">
                          {data.concentration.toFixed(1)}%
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            data.dominantSide === "long"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {data.dominantSide}
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
                                width: `${(data.longOI / data.totalOI) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-red-500 h-full rounded-r-full"
                              style={{
                                width: `${
                                  (data.shortOI / data.totalOI) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {data.ratio > 1000
                            ? "∞"
                            : `${data.ratio.toFixed(1)}x`}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${
                            data.fundingRate > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {data.fundingRate > 0 ? "+" : ""}
                          {data.fundingRate.toFixed(1)}%
                        </span>
                        {!data.fundingAligned && (
                          <span className="ml-1 text-xs text-orange-600">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${getRiskColor(
                              data.riskScore
                            )}`}
                            style={{ width: `${data.riskScore}%` }}
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
