import { MultiValue, StylesConfig } from "react-select";

export interface FundingRateEntry {
  fundingRate: number;
  longOI: string;
  shortOI: string;
  price?: string;
  timestamp: number;
}

export interface HistoricalDataEntry {
  timestamp: number;
  data: Record<string, FundingRateEntry>;
}

export interface SelectOption {
  value: string;
  label: string;
}

export const createSelectOptions = (markets: string[]): SelectOption[] => {
  return markets.map((market) => ({
    value: market,
    label: market.replace("perps/", "").toUpperCase(),
  }));
};

export const createSelectedOptions = (selectedMarkets: string[]): SelectOption[] => {
  return selectedMarkets.map((market) => ({
    value: market,
    label: market.replace("perps/", "").toUpperCase(),
  }));
};

export const handleMarketSelectionChange = (
  selectedOptions: MultiValue<SelectOption>,
  setSelectedMarkets: (markets: string[]) => void
) => {
  const markets = selectedOptions
    ? selectedOptions.map((option) => option.value)
    : [];
  setSelectedMarkets(markets);
};

export const generateChartConfig = (selectedMarkets: string[]) => {
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

  const config: Record<string, { label: string; color: string }> = {};
  selectedMarkets.forEach((market, index) => {
    config[market] = {
      label: market.replace("perps/", "").toUpperCase(),
      color: colors[index % colors.length],
    };
  });

  return config;
};

export const selectStyles: StylesConfig<SelectOption, true> = {
  control: (provided) => ({
    ...provided,
    minHeight: "40px",
    borderColor: "#d1d5db",
    "&:hover": {
      borderColor: "#9ca3af",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#f3f4f6",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#374151",
    fontSize: "14px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    "&:hover": {
      backgroundColor: "#ef4444",
      color: "white",
    },
  }),
};