"use client";

import { HistoricalDataEntry } from "@/app/types/dashboardClient";
import React, { createContext, useContext, ReactNode } from "react";

interface DashboardData {
  currentRates: HistoricalDataEntry;
  allHistoricalData: HistoricalDataEntry[];
  defaultChartMarkets: string[];
  defaultOIMarket: string;
}

interface DashboardDataContextType {
  data: DashboardData | null;
  setData: (data: DashboardData) => void;
}

const DashboardDataContext = createContext<
  DashboardDataContextType | undefined
>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = React.useState<DashboardData | null>(null);

  return (
    <DashboardDataContext.Provider value={{ data, setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider"
    );
  }
  return context;
}
