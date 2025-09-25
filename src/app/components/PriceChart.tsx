"use client";

import React, { useMemo } from "react";
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
import {
  HistoricalDataEntry,
  generateChartConfig,
} from "./shared/chartUtils";

interface PriceChartProps {
  historicalData: HistoricalDataEntry[];
  selectedMarket?: string;
}

export default function PriceChart({
  historicalData,
  selectedMarket,
}: PriceChartProps) {
  // Get all unique markets (safe even if historicalData is empty)
  const allMarkets = Array.from(
    new Set(
      historicalData && historicalData.length > 0
        ? historicalData.flatMap((entry) => Object.keys(entry.data))
        : []
    )
  ).sort();

  // Use provided selected market or fallback to first market
  const marketToShow = selectedMarket || allMarkets[0];

  // Transform data for recharts - move before early return
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    return historicalData.map((entry) => {
      const dataPoint: Record<string, unknown> = {
        time: new Date(entry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        timestamp: entry.timestamp,
      };

      const price = entry.data[marketToShow]?.price;
      dataPoint[marketToShow] = price ? parseFloat(price) : 0;

      return dataPoint;
    });
  }, [historicalData, marketToShow]);

  // Generate chart config
  const chartConfig = useMemo(() => {
    return generateChartConfig([marketToShow]) as ChartConfig;
  }, [marketToShow]);

  // Early return after hooks
  if (!historicalData || historicalData.length === 0) {
    return <div>No price data available</div>;
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardDescription>
          Price data for selected perpetual futures markets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-full">
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
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[180px]"
                  formatter={(value, name) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={
                          {
                            backgroundColor:
                              chartConfig[name as keyof typeof chartConfig]
                                ?.color,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        ${Number(value).toFixed(2)}
                      </div>
                    </>
                  )}
                />
              }
              cursor={false}
            />
            <Line
              dataKey={marketToShow}
              type="monotone"
              stroke={chartConfig[marketToShow]?.color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
