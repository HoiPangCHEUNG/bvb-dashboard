"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Funding Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Funding Rate (Annual %)</TableHead>
              <TableHead>Long OI</TableHead>
              <TableHead>Short OI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top10Markets.map((market, index) => {
              const rate = currentRates[market];
              return (
                <TableRow key={market}>
                  <TableCell className="font-bold">#{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {market.replace("perps/", "").toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rate.fundingRate > 0 ? "default" : "destructive"}
                      className={
                        rate.fundingRate > 0
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }
                    >
                      {rate.fundingRate > 0 ? "+" : ""}
                      {rate.fundingRate.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatOI(rate.longOI)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatOI(rate.shortOI)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}