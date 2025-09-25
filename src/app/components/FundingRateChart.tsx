"use client";

import React, { useState, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import Select from "react-select";
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
  timestamp: number;
}

interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

interface FundingRateChartProps {
  historicalData: HistoricalDataEntry[];
  initialSelectedMarkets?: string[];
}

export default function FundingRateChart({
  historicalData,
  initialSelectedMarkets,
}: FundingRateChartProps) {
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
        time: new Date(entry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        timestamp: entry.timestamp,
      };

      selectedMarkets.forEach((market) => {
        dataPoint[market] = entry.data[market]?.fundingRate || 0;
      });

      return dataPoint;
    });
  }, [historicalData, selectedMarkets]);

  // Prepare options for react-select
  const selectOptions = useMemo(() => {
    return allMarkets.map((market) => ({
      value: market,
      label: market.replace("perps/", "").toUpperCase(),
    }));
  }, [allMarkets]);

  const selectedOptions = useMemo(() => {
    return selectedMarkets.map((market) => ({
      value: market,
      label: market.replace("perps/", "").toUpperCase(),
    }));
  }, [selectedMarkets]);

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
    return <div>No funding rate data available</div>;
  }

  // Handle market selection with react-select
  const handleMarketChange = (selectedOptions: any) => {
    const markets = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    setSelectedMarkets(markets);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardDescription>
          Annualized funding rates for selected perpetual futures markets.
        </CardDescription>
        <div className="mt-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Markets
            </label>
            <Select
              isMulti
              value={selectedOptions}
              onChange={handleMarketChange}
              options={selectOptions}
              placeholder="Select markets..."
              className="basic-multi-select"
              classNamePrefix="select"
              closeMenuOnSelect={false}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    borderColor: '#9ca3af',
                  },
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: '#f3f4f6',
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: '#374151',
                  fontSize: '14px',
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  '&:hover': {
                    backgroundColor: '#ef4444',
                    color: 'white',
                  },
                }),
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full">
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
              tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
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
                            backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {Number(value).toFixed(2)}%
                      </div>
                    </>
                  )}
                />
              }
              cursor={false}
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
