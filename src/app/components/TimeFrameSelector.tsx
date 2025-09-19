"use client";

import React from "react";
import { TimeFrame } from "../../services/bvb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeFrameSelectorProps {
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

export default function TimeFrameSelector({
  selectedTimeFrame,
  onTimeFrameChange,
}: TimeFrameSelectorProps) {
  const timeFrameOptions: {
    value: TimeFrame;
    label: string;
    description: string;
  }[] = [
    {
      value: "15 min",
      label: "15 Minutes",
      description: "Show all data points (every 15 minutes)",
    },
    {
      value: "1 hour",
      label: "1 Hour",
      description: "Show first entry of each hour",
    },
    {
      value: "4 hour",
      label: "4 Hours",
      description: "Show first entry every 4 hours",
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Time Frame</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedTimeFrame}
          onValueChange={(value) => onTimeFrameChange(value as TimeFrame)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {timeFrameOptions.map((option) => (
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
