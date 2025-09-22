"use client";

import React, { useState } from "react";
import Select from "react-select";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

interface OpenInterestChartProps {
  historicalData: HistoricalDataEntry[];
  initialSelectedMarket?: string;
}

export default function OpenInterestChart({
  historicalData,
  initialSelectedMarket,
}: OpenInterestChartProps) {
  // Get all unique markets (safe even if historicalData is empty)
  const allMarkets = Array.from(
    new Set(
      historicalData && historicalData.length > 0
        ? historicalData.flatMap((entry) => Object.keys(entry.data))
        : []
    )
  ).sort();

  // Prepare options for React Select
  const marketOptions = allMarkets.map((market) => ({
    value: market,
    label: market.replace("perps/", "").toUpperCase(),
  }));

  // State for selected market - must be before any returns
  const [selectedMarket, setSelectedMarket] = useState<{
    value: string;
    label: string;
  } | null>(() => {
    // Use a function to ensure consistent initial state
    if (marketOptions.length === 0) return null;
    return (
      marketOptions.find((opt) => opt.value === initialSelectedMarket) ||
      marketOptions[0] ||
      null
    );
  });

  // Early return after hooks
  if (!historicalData || historicalData.length === 0) {
    return <div>No open interest data available</div>;
  }

  const marketToShow = selectedMarket?.value || allMarkets[0];

  // Prepare chart data
  const chartData = historicalData.map((entry) => {
    const longOI = entry.data[marketToShow]?.longOI || "0";
    const shortOI = entry.data[marketToShow]?.shortOI || "0";

    return {
      time: new Date(entry.timestamp).toLocaleTimeString(),
      longOI: parseFloat(longOI) / 1e6, // Convert from smallest unit (6 decimals) to USD
      shortOI: parseFloat(shortOI) / 1e6, // Convert from smallest unit (6 decimals) to USD
    };
  });

  const chartConfig = {
    shortOI: {
      label: "Long OI",
      color: "oklch(0.809 0.105 251.813)",
    },
    longOI: {
      label: "Short OI",
      color: "oklch(0.623 0.214 259.815)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mb-4">
          <label
            htmlFor="market-select"
            className="block text-base font-semibold text-gray-900 mb-2"
          >
            Select Market:
          </label>
          <Select
            id="market-select"
            instanceId="market-select"
            value={selectedMarket}
            onChange={(newValue) => setSelectedMarket(newValue)}
            options={marketOptions}
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder="Select a market..."
            isClearable={false}
            isSearchable={true}
            styles={{
              control: (provided) => ({
                ...provided,
                fontSize: "16px",
                fontWeight: "500",
                minHeight: "42px",
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: "16px",
                fontWeight: "500",
                color: state.isSelected ? provided.color : "#111827",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "#111827",
                fontSize: "16px",
                fontWeight: "500",
              }),
            }}
          />
        </div>
        <CardTitle>
          Open Interest - {marketToShow.replace("perps/", "").toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => {
                const numValue = Number(value);
                if (numValue >= 1000000) {
                  return "$" + (numValue / 1000000).toFixed(1) + "M";
                } else if (numValue >= 1000) {
                  return "$" + (numValue / 1000).toFixed(0) + "K";
                } else {
                  return "$" + numValue.toFixed(0);
                }
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const numValue = Number(value);
                    const formattedValue =
                      numValue >= 1000000
                        ? `$${(numValue / 1000000).toFixed(2)}M `
                        : numValue >= 1000
                        ? `$${(numValue / 1000).toFixed(2)}K `
                        : `$${numValue.toFixed(2)} `;
                    return [formattedValue, name];
                  }}
                />
              }
            />
            <Bar dataKey="longOI" fill="var(--color-longOI)" radius={4} />
            <Bar dataKey="shortOI" fill="var(--color-shortOI)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
