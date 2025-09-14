"use client";

import React from "react";

interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  timestamp: number;
}

interface TopFundingRatesTableProps {
  currentRates: Record<string, FundingRateEntry>;
}

export default function TopFundingRatesTable({
  currentRates,
}: TopFundingRatesTableProps) {
  // Get top 10 markets by absolute funding rate, filtering out zero total OI markets
  const top10Markets = Object.entries(currentRates)
    .filter(([_, rate]) => {
      const totalOI = parseFloat(rate.longOI) + parseFloat(rate.shortOI);
      return totalOI > 0;
    })
    .sort((a, b) => Math.abs(b[1].fundingRate) - Math.abs(a[1].fundingRate))
    .slice(0, 10)
    .map(([market]) => market);

  const formatOI = (oiString: string) => {
    const value = parseInt(oiString) / 1e6;
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top 10 Funding Rates
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Funding Rate (Annual %)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Long OI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short OI
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {top10Markets.map((market, index) => {
              const rate = currentRates[market];
              return (
                <tr key={market}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {market.replace("perps/", "").toUpperCase()}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      rate.fundingRate > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {rate.fundingRate > 0 ? "+" : ""}
                    {rate.fundingRate.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatOI(rate.longOI)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatOI(rate.shortOI)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}