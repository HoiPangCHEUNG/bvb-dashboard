"use client";

import React, { useState, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
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
  price?: string;
  timestamp: number;
}

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

interface PriceChartProps {
  historicalData: HistoricalDataEntry[];
  initialSelectedMarkets?: string[];
}

export default function PriceChart({
  historicalData,
  initialSelectedMarkets,
}: PriceChartProps) {
  // Get all unique markets (safe even if historicalData is empty)
  const allMarkets = Array.from(
    new Set(
      historicalData && historicalData.length > 0
        ? historicalData.flatMap((entry) => Object.keys(entry.data))
        : []
    )
  ).sort();

  // State for selected markets - must be before any returns
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
    initialSelectedMarkets && initialSelectedMarkets.length > 0
      ? initialSelectedMarkets
      : allMarkets.slice(0, 5)
  );

  // Transform data for recharts - move before early return
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    return historicalData.map((entry) => {
      const dataPoint: Record<string, unknown> = {
        time: new Date(entry.timestamp).toLocaleTimeString(),
        timestamp: entry.timestamp,
      };

      selectedMarkets.forEach((market) => {
        const price = entry.data[market]?.price;
        dataPoint[market] = price ? parseFloat(price) : 0;
      });

      return dataPoint;
    });
  }, [historicalData, selectedMarkets]);

  // Generate chart config - move before early return
  const chartConfig = useMemo(() => {
    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "hsl(12, 76%, 61%)",
      "hsl(173, 58%, 39%)",
      "hsl(197, 37%, 24%)",
      "hsl(43, 74%, 66%)",
      "hsl(27, 87%, 67%)",
    ];

    const config: ChartConfig = {};
    selectedMarkets.forEach((market, index) => {
      config[market] = {
        label: market.replace("perps/", "").toUpperCase(),
        color: colors[index % colors.length],
      };
    });

    return config;
  }, [selectedMarkets]);

  // Early return after hooks
  if (!historicalData || historicalData.length === 0) {
    return <div>No price data available</div>;
  }

  // Handle market selection
  const handleMarketToggle = (market: string) => {
    setSelectedMarkets((prev) => {
      if (prev.includes(market)) {
        return prev.filter((m) => m !== market);
      } else {
        return [...prev, market];
      }
    });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardDescription>
          Price data for selected perpetual futures markets.
        </CardDescription>
        <div className="mt-4">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-900 mb-2 text-base">
              Select Markets ({selectedMarkets.length} selected)
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2 p-2 border rounded">
              {allMarkets.map((market) => (
                <label
                  key={market}
                  className="flex items-center space-x-1 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedMarkets.includes(market)}
                    onChange={() => handleMarketToggle(market)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate text-gray-900 font-medium">
                    {market.replace("perps/", "").toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </details>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value, name) => [
                    `$${Number(value).toFixed(2)}`,
                    chartConfig[name as keyof typeof chartConfig]?.label ||
                      name,
                  ]}
                />
              }
            />
            {selectedMarkets.map((market) => (
              <Line
                key={market}
                dataKey={market}
                type="monotone"
                stroke={chartConfig[market]?.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
