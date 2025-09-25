"use client";

import React from "react";
import { TimeFrame } from "../../services/bvb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Select from "react-select";
import { SelectOption } from "./shared/chartUtils";

interface ControlsSelectorProps {
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  marketOptions: SelectOption[];
}

export default function ControlsSelector({
  selectedTimeFrame,
  onTimeFrameChange,
  selectedMarket,
  onMarketChange,
  marketOptions,
}: ControlsSelectorProps) {
  const updateIntervals: {
    value: TimeFrame;
    label: string;
    description: string;
  }[] = [
    {
      value: "15 min",
      label: "15 Minutes",
      description: "Frequent",
    },
    {
      value: "1 hour",
      label: "1 Hour",
      description: "Normal",
    },
    {
      value: "4 hour",
      label: "4 Hours",
      description: "Default",
    },
  ];

  const selectedOption = selectedMarket
    ? {
        value: selectedMarket,
        label: selectedMarket.replace("perps/", "").toUpperCase(),
      }
    : null;

  const handleMarketChange = (selectedOption: SelectOption | null) => {
    onMarketChange(selectedOption?.value || "");
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold">Time Frame & Market</h2>
          <div className="sm:w-64">
            <Select
              value={selectedOption}
              onChange={handleMarketChange}
              options={marketOptions}
              placeholder="Select market..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable={false}
              isSearchable={true}
              styles={{
                control: (provided) => ({
                  ...provided,
                  fontSize: "14px",
                  fontWeight: "500",
                  minHeight: "38px",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: "14px",
                  fontWeight: "500",
                  color: state.isSelected ? provided.color : "#111827",
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: "#111827",
                  fontSize: "14px",
                  fontWeight: "500",
                }),
              }}
            />
          </div>
        </div>

        <Tabs
          value={selectedTimeFrame}
          onValueChange={(value) => onTimeFrameChange(value as TimeFrame)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {updateIntervals.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto py-3 px-2"
              >
                <div className="text-center w-full">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-75 mt-1 leading-tight">
                    {option.description}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}
