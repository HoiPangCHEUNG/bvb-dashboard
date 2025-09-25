"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  timestamp: number;
}

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

interface OpenInterestChartProps {
  historicalData: HistoricalDataEntry[];
  selectedMarket?: string;
}

export default function OpenInterestChart({
  historicalData,
  selectedMarket,
}: OpenInterestChartProps) {
  // Early return if no data
  if (!historicalData || historicalData.length === 0) {
    return <div>No open interest data available</div>;
  }

  // Get all unique markets for fallback
  const allMarkets = Array.from(
    new Set(historicalData.flatMap((entry) => Object.keys(entry.data)))
  ).sort();

  const marketToShow = selectedMarket || allMarkets[0];

  // Prepare chart data
  const chartData = historicalData.map((entry) => {
    const longOI = entry.data[marketToShow]?.longOI || "0";
    const shortOI = entry.data[marketToShow]?.shortOI || "0";

    return {
      time: new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      longOI: parseFloat(longOI) / 1e6, // Convert from smallest unit (6 decimals) to USD
      shortOI: parseFloat(shortOI) / 1e6, // Convert from smallest unit (6 decimals) to USD
    };
  });

  const chartConfig = {
    shortOI: {
      label: "Short OI",
      color: "oklch(0.809 0.105 251.813)",
    },
    longOI: {
      label: "Long OI",
      color: "oklch(0.623 0.214 259.815)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardDescription>
          Open Interest - {marketToShow.replace("perps/", "").toUpperCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow">
        <ChartContainer config={chartConfig} className="w-full h-full">
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
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[180px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={
                          {
                            backgroundColor: `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {(() => {
                          const numValue = Number(value);
                          return numValue >= 1000000
                            ? `$${(numValue / 1000000).toFixed(2)}M`
                            : numValue >= 1000
                            ? `$${(numValue / 1000).toFixed(2)}K`
                            : `$${numValue.toFixed(2)}`;
                        })()}
                      </div>
                      {/* Add total after the last item */}
                      {index === 1 && (
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {(() => {
                              const totalValue =
                                item.payload.longOI + item.payload.shortOI;
                              return totalValue >= 1000000
                                ? `$${(totalValue / 1000000).toFixed(2)}M`
                                : totalValue >= 1000
                                ? `$${(totalValue / 1000).toFixed(2)}K`
                                : `$${totalValue.toFixed(2)}`;
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                />
              }
              cursor={false}
            />
            <Bar dataKey="longOI" fill="var(--color-longOI)" radius={4} />
            <Bar dataKey="shortOI" fill="var(--color-shortOI)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
