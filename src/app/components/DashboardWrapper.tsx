"use client";

import { createContext, useContext, ReactNode } from "react";
import { HistoricalDataEntry } from "../types/dashboardClient";

interface DashboardContextType {
  historicalData15min?: HistoricalDataEntry[];
  historicalData4hour?: HistoricalDataEntry[];
}

const DashboardContext = createContext<DashboardContextType>({});

export function DashboardProvider({
  children,
  historicalData15min,
  historicalData4hour,
}: {
  children: ReactNode;
  historicalData15min: HistoricalDataEntry[];
  historicalData4hour: HistoricalDataEntry[];
}) {
  return (
    <DashboardContext.Provider
      value={{
        historicalData15min,
        historicalData4hour,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardContext);
}
