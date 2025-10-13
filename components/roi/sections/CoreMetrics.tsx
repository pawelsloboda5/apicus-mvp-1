/**
 * Core Metrics Section Component
 * 
 * Displays the three primary ROI input controls:
 * - Runs per Month
 * - Minutes Saved per Run
 * - Labor Cost per Hour
 * 
 * Uses validated inputs with sliders for intuitive adjustment.
 */

"use client";

import React from 'react';
import { SliderWithValue } from '../inputs/SliderWithValue';

interface CoreMetricsProps {
  runsPerMonth: number;
  onRunsChange: (value: number) => void;
  
  minutesPerRun: number;
  onMinutesChange: (value: number) => void;
  
  hourlyRate: number;
  onHourlyRateChange: (value: number) => void;
  
  className?: string;
}

// Helper function for dynamic minute steps
const getMinuteStep = (currentMinutes: number): number => {
  if (currentMinutes < 1) return 0.1;
  if (currentMinutes < 10) return 0.5;
  return 1;
};

export function CoreMetrics({
  runsPerMonth,
  onRunsChange,
  minutesPerRun,
  onMinutesChange,
  hourlyRate,
  onHourlyRateChange,
  className,
}: CoreMetricsProps) {
  return (
    <div className={className}>
      <h3 className="text-base font-semibold mb-4">Core Metrics</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Runs per month */}
        <div className="p-4 rounded-lg border bg-card">
          <SliderWithValue
            id="runs-per-month"
            label="Runs per Month"
            value={runsPerMonth}
            onChange={onRunsChange}
            min={0}
            max={10000}
            step={100}
            tooltip="How many times will this automation run each month? Examples: Daily task (~30), Per-lead (100-1000), Per-transaction (500-5000)"
            helpText="Number of times this automation executes monthly"
          />
        </div>

        {/* Minutes per run */}
        <div className="p-4 rounded-lg border bg-card">
          <SliderWithValue
            id="minutes-per-run"
            label="Minutes Saved / Run"
            value={minutesPerRun}
            onChange={onMinutesChange}
            min={0.1}
            max={60}
            step={getMinuteStep(minutesPerRun)}
            unit="min"
            tooltip="How many minutes does this automation save each time it runs? Include time to switch contexts and count manual steps eliminated. Don't count waiting/idle time."
            helpText="Time saved each time the automation runs"
          />
        </div>

        {/* Hourly rate */}
        <div className="p-4 rounded-lg border bg-card">
          <SliderWithValue
            id="hourly-rate"
            label="Labor Cost / hr"
            value={hourlyRate}
            onChange={onHourlyRateChange}
            min={15}
            max={100}
            step={5}
            formatValue={(v) => `$${v}`}
            tooltip="The hourly cost of the person performing this task. Consider fully loaded labor costs including benefits."
            helpText="Hourly labor cost for this task"
          />
        </div>
      </div>
    </div>
  );
}
