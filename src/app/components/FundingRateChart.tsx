"use client";

import React, { useState, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import Select, { MultiValue } from "react-select";
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
  FundingRateEntry,
  HistoricalDataEntry,
  SelectOption,
  createSelectOptions,
  createSelectedOptions,
  handleMarketSelectionChange,
  generateChartConfig,
  selectStyles,
} from "./shared/chartUtils";

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
  const selectOptions = useMemo((): SelectOption[] => {
    return createSelectOptions(allMarkets);
  }, [allMarkets]);

  const selectedOptions = useMemo((): SelectOption[] => {
    return createSelectedOptions(selectedMarkets);
  }, [selectedMarkets]);

  // Generate chart config - move before early return
  const chartConfig = useMemo(() => {
    return generateChartConfig(selectedMarkets) as ChartConfig;
  }, [selectedMarkets]);

  // Early return after hooks
  if (!historicalData || historicalData.length === 0) {
    return <div>No funding rate data available</div>;
  }

  // Handle market selection with react-select
  const handleMarketChange = (selectedOptions: MultiValue<SelectOption>) => {
    handleMarketSelectionChange(selectedOptions, setSelectedMarkets);
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
              styles={selectStyles}
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
                            backgroundColor:
                              chartConfig[name as keyof typeof chartConfig]
                                ?.color,
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
