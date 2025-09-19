"use client";

import React, { useState } from "react";
import Select from "react-select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const labels = historicalData.map((entry) =>
    new Date(entry.timestamp).toLocaleTimeString()
  );

  const longOIData = historicalData.map((entry) => {
    const oi = entry.data[marketToShow]?.longOI || "0";
    return parseFloat(oi) / 1e6; // Convert from smallest unit (6 decimals) to USD
  });

  const shortOIData = historicalData.map((entry) => {
    const oi = entry.data[marketToShow]?.shortOI || "0";
    return parseFloat(oi) / 1e6; // Convert from smallest unit (6 decimals) to USD
  });

  const datasets = [
    {
      label: "Long OI",
      data: longOIData,
      backgroundColor: "rgba(75, 192, 75, 0.6)",
      borderColor: "rgba(75, 192, 75, 1)",
      borderWidth: 1,
    },
    {
      label: "Short OI",
      data: shortOIData,
      backgroundColor: "rgba(255, 99, 99, 0.6)",
      borderColor: "rgba(255, 99, 99, 1)",
      borderWidth: 1,
    },
  ];

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Open Interest - ${marketToShow
          .replace("perps/", "")
          .toUpperCase()}`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (value >= 1000000) {
              return `${label}: $${(value / 1000000).toFixed(2)}M`;
            } else if (value >= 1000) {
              return `${label}: $${(value / 1000).toFixed(2)}K`;
            } else {
              return `${label}: $${value.toFixed(2)}`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Open Interest (USD)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            const numValue = Number(value);
            if (numValue >= 1000000) {
              return "$" + (numValue / 1000000).toFixed(1) + "M";
            } else if (numValue >= 1000) {
              return "$" + (numValue / 1000).toFixed(0) + "K";
            } else {
              return "$" + numValue.toFixed(0);
            }
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
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
      <div style={{ position: "relative", height: "400px", width: "100%" }}>
        <Bar
          options={{ ...options, maintainAspectRatio: false }}
          data={{ labels, datasets }}
        />
      </div>
    </div>
  );
}
