"use client";

import React from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processSqueezePotential, getSqueezeScoreColor, getSqueezeLabel } from "../../utils/dataProcessors";

interface SqueezePotentialProps {
  currentRates: HistoricalDataEntry;
}

export default function SqueezePotential({
  currentRates,
}: SqueezePotentialProps) {
  // Use the shared data processor
  const squeezeData = processSqueezePotential(currentRates);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Squeeze Potential Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  Market
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  Score
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  OI Ratio
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  Funding
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {squeezeData.map((data) => (
                <tr key={data.market} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    {data.market.replace("perps/", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        data.type === "short"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {data.type === "short" ? "Short 🔺" : "Long 🔻"}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm ${getSqueezeScoreColor(
                      data.maxScore
                    )}`}
                  >
                    {data.maxScore.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                    {data.oiRatio.toFixed(1)}x {data.dominantSide}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                      data.fundingRate > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data.fundingRate > 0 ? "+" : ""}
                    {data.fundingRate.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                    {getSqueezeLabel(data.maxScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {squeezeData.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No significant squeeze potential detected
          </p>
        )}
      </CardContent>
    </Card>
  );
}
