"use client";

import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

  // Early return after hooks
  if (!historicalData || historicalData.length === 0) {
    return <div>No funding rate data available</div>;
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

  const marketsToShow = selectedMarkets;

  // Prepare chart data
  const labels = historicalData.map((entry) =>
    new Date(entry.timestamp).toLocaleTimeString()
  );

  const datasets = marketsToShow.map((market, index) => {
    const data = historicalData.map(
      (entry) => entry.data[market]?.fundingRate || 0
    );

    // Generate distinct colors for each market
    const colors = [
      { border: "rgb(255, 99, 132)", bg: "rgba(255, 99, 132, 0.2)" }, // Red
      { border: "rgb(54, 162, 235)", bg: "rgba(54, 162, 235, 0.2)" }, // Blue
      { border: "rgb(255, 206, 86)", bg: "rgba(255, 206, 86, 0.2)" }, // Yellow
      { border: "rgb(75, 192, 192)", bg: "rgba(75, 192, 192, 0.2)" }, // Teal
      { border: "rgb(153, 102, 255)", bg: "rgba(153, 102, 255, 0.2)" }, // Purple
      { border: "rgb(255, 159, 64)", bg: "rgba(255, 159, 64, 0.2)" }, // Orange
      { border: "rgb(199, 199, 199)", bg: "rgba(199, 199, 199, 0.2)" }, // Grey
      { border: "rgb(83, 102, 255)", bg: "rgba(83, 102, 255, 0.2)" }, // Indigo
      { border: "rgb(255, 99, 255)", bg: "rgba(255, 99, 255, 0.2)" }, // Pink
      { border: "rgb(99, 255, 132)", bg: "rgba(99, 255, 132, 0.2)" }, // Green
    ];

    const colorSet = colors[index % colors.length];

    return {
      label: market.replace("perps/", "").toUpperCase(),
      data,
      borderColor: colorSet.border,
      backgroundColor: colorSet.bg,
      tension: 0.1,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    };
  });

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Funding Rates Over Time (Annual %)",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y.toFixed(2);
            return `${label}: ${value}%`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Funding Rate (Annual %)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            return Number(value).toFixed(2) + "%";
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
      <div style={{ position: "relative", height: "400px", width: "100%" }}>
        <Line
          options={{ ...options, maintainAspectRatio: false }}
          data={{ labels, datasets }}
        />
      </div>
    </div>
  );
}
