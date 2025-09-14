"use client";

import React from "react";
import { TimeFrame } from "../utils/bvb";

interface TimeFrameSelectorProps {
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

export default function TimeFrameSelector({
  selectedTimeFrame,
  onTimeFrameChange
}: TimeFrameSelectorProps) {
  const timeFrameOptions: { value: TimeFrame; label: string; description: string }[] = [
    {
      value: '15min',
      label: '15 Minutes',
      description: 'Show all data points (every 15 minutes)'
    },
    {
      value: '1hour',
      label: '1 Hour',
      description: 'Show first entry of each hour'
    },
    {
      value: '4hour',
      label: '4 Hours',
      description: 'Show first entry every 4 hours'
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Time Frame</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {timeFrameOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeFrameChange(option.value)}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${
              selectedTimeFrame === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-sm opacity-75 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}