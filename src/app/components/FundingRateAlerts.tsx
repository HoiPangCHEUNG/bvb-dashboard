"use client";

import { TimeFrame } from "@/services/bvb";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  timestamp: number;
}

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

interface AlertItem {
  type: string;
  severity: "high" | "medium";
}

interface Alert {
  market: string;
  previousRate: number;
  currentRate: number;
  change: number;
  changePercent: number;
  alerts: AlertItem[];
  severity: "high" | "medium";
}

interface FundingRateAlertsProps {
  historicalData: HistoricalDataEntry[];
  currentRates: HistoricalDataEntry;
  selectedTimeFrame: TimeFrame;
}

const SEVERITY = {
  HIGH: "high" as const,
  MEDIUM: "medium" as const,
};

export default function FundingRateAlerts({
  historicalData,
  currentRates,
  selectedTimeFrame,
}: FundingRateAlertsProps) {
  if (historicalData.length < 2) {
    return (
      <Card className="h-full flex flex-col">
        {/* <CardHeader>
          <CardTitle className="text-lg">
            Funding Rate Alerts ({selectedTimeFrame})
          </CardTitle>
        </CardHeader> */}
        <CardContent className="flex-1 flex flex-col justify-center">
          <p className="text-muted-foreground text-center">
            Not enough historical data for alerts
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get previous data point for comparison
  const previousData = historicalData[historicalData.length - 2]?.data || {};
  const previousTimestamp =
    historicalData[historicalData.length - 2]?.timestamp || 0;

  // Calculate changes and identify alerts
  const alerts: Alert[] = [];

  Object.keys(currentRates.data).forEach((market) => {
    if (!previousData[market]) return;

    const current = currentRates.data[market];
    const previous = previousData[market];
    const change = current.fundingRate - previous.fundingRate;
    const changePercent =
      previous.fundingRate !== 0
        ? (change / Math.abs(previous.fundingRate)) * 100
        : 0;

    // Alert conditions
    const alerts_temp = [];

    // Large absolute change
    if (Math.abs(change) > 20) {
      alerts_temp.push({
        type: "large_change",
        severity: Math.abs(change) > 50 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      });
    }

    // Sign flip
    if (
      previous.fundingRate * current.fundingRate < 0 &&
      previous.fundingRate !== 0
    ) {
      alerts_temp.push({
        type: "sign_flip",
        severity: SEVERITY.HIGH,
      });
    }

    // Rapid increase
    if (changePercent > 50 && change > 5) {
      alerts_temp.push({
        type: "rapid_increase",
        severity: changePercent > 100 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      });
    }

    // Rapid decrease
    if (changePercent < -50 && change < -5) {
      alerts_temp.push({
        type: "rapid_decrease",
        severity: changePercent < -75 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      });
    }

    // Breaking extreme levels
    if (
      Math.abs(current.fundingRate) > 200 &&
      Math.abs(previous.fundingRate) <= 200
    ) {
      alerts_temp.push({
        type: "extreme_level",
        severity: SEVERITY.HIGH,
      });
    }

    if (alerts_temp.length > 0) {
      alerts.push({
        market,
        previousRate: previous.fundingRate,
        currentRate: current.fundingRate,
        change,
        changePercent,
        alerts: alerts_temp,
        severity: alerts_temp.some((a) => a.severity === "high")
          ? SEVERITY.HIGH
          : SEVERITY.MEDIUM,
      });
    }
  });

  // Sort by severity and change magnitude
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "high" ? -1 : 1;
    }
    return Math.abs(b.change) - Math.abs(a.change);
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "sign_flip":
        return "🔄";
      case "large_change":
        return "📊";
      case "rapid_increase":
        return "🚀";
      case "rapid_decrease":
        return "📉";
      case "extreme_level":
        return "⚠️";
      default:
        return "📌";
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case "sign_flip":
        return "Sign Flip";
      case "large_change":
        return "Large Change";
      case "rapid_increase":
        return "Rapid Increase";
      case "rapid_decrease":
        return "Rapid Decrease";
      case "extreme_level":
        return "Extreme Level";
      default:
        return "Alert";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardDescription>
          Alerts for significant funding rate changes
          {alerts.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {alerts.length} Active
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-1 space-y-4">
          {alerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">
                No significant funding rate changes detected
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {alerts.slice(0, 10).map((alert, idx) => (
                <div
                  key={`${alert.market}-${idx}`}
                  className={`border rounded-lg p-3 ${
                    alert.severity === "high"
                      ? "border-red-300 bg-red-50"
                      : "border-yellow-300 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-semibold mr-2">
                          {alert.market.replace("perps/", "").toUpperCase()}
                        </span>
                        <div className="flex gap-1">
                          {alert.alerts.map((a: AlertItem, i: number) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                a.severity === "high"
                                  ? "bg-red-200 text-red-800"
                                  : "bg-yellow-200 text-yellow-800"
                              }`}
                            >
                              {getAlertIcon(a.type)} {getAlertLabel(a.type)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <span
                            className={`font-medium ${
                              alert.previousRate > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {alert.previousRate.toFixed(2)}%
                          </span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span
                            className={`font-medium ${
                              alert.currentRate > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {alert.currentRate.toFixed(2)}%
                          </span>
                          <span
                            className={`ml-3 font-semibold ${
                              alert.change > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {alert.change > 0 ? "+" : ""}
                            {alert.change.toFixed(2)}%
                            {alert.changePercent !== 0 &&
                              !isNaN(alert.changePercent) &&
                              isFinite(alert.changePercent) && (
                                <span className="text-xs ml-1">
                                  ({alert.changePercent > 0 ? "+" : ""}
                                  {alert.changePercent.toFixed(0)}%)
                                </span>
                              )}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Duration:{" "}
                          {new Date(previousTimestamp).toLocaleTimeString(
                            undefined,
                            { hour12: false }
                          )}{" "}
                          →{" "}
                          {new Date(currentRates.timestamp).toLocaleTimeString(
                            undefined,
                            { hour12: false }
                          )}
                          {new Date(previousTimestamp).toDateString() !==
                            new Date(currentRates.timestamp).toDateString() && (
                            <span className="ml-1">
                              (
                              {new Date(previousTimestamp).toLocaleDateString(
                                "en-CA"
                              )}{" "}
                              →{" "}
                              {new Date(
                                currentRates.timestamp
                              ).toLocaleDateString("en-CA")}
                              )
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {alerts.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {alerts.length - 10} more alerts
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg mt-4">
          <p className="text-xs text-blue-800">
            💡 Alerts trigger on: Sign flips, changes &gt;20%, rapid moves
            &gt;50%, or crossing extreme levels
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
