"use client";

import React, { useEffect, useState } from "react";
import { Sword } from "lucide-react";
import { pricing } from "@/app/api/data/pricing";
import { StatsBarProps, PlatformType } from "@/lib/types";
import { 
  calculateTimeValue, 
  calculatePlatformCost,
} from "@/lib/roi-utils";

export function StatsBar({
  platform,
  runsPerMonth,
  minutesPerRun,
  hourlyRate,
  taskMultiplier,
}: StatsBarProps) {
  const tierName: Record<PlatformType, string> = {
    zapier: "Professional",
    make: "Core",
    n8n: "Starter",
  };

  const data = pricing[platform];
  const tier = data.tiers.find((t) => t.name === tierName[platform]) || data.tiers[0];

  const costPerUnit = tier.quota
    ? (tier.monthlyUSD / tier.quota).toFixed(4)
    : "—";

  // Use state to implement debouncing of calculations
  const [timeValue, setTimeValue] = useState(0);
  const [platformCost, setPlatformCost] = useState(0);
  const [netROI, setNetROI] = useState(0);
  const [roiRatio, setRoiRatio] = useState(0);

  // Debounce calculations using useEffect and setTimeout
  useEffect(() => {
    // Calculate initial values immediately for quick feedback
    const initialTimeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
    const initialPlatformCost = calculatePlatformCost(platform, runsPerMonth, pricing);
    
    setTimeValue(initialTimeValue);
    setPlatformCost(initialPlatformCost);
    setNetROI(initialTimeValue - initialPlatformCost);
    setRoiRatio(initialPlatformCost ? initialTimeValue / initialPlatformCost : 0);
    
    // Debounce heavy calculations with a timeout
    const debounceTimeout = setTimeout(() => {
      // Recalculate for accuracy (in case initial fast calculation was imprecise)
      const newTimeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
      const newPlatformCost = calculatePlatformCost(platform, runsPerMonth, pricing);
      
      setTimeValue(newTimeValue);
      setPlatformCost(newPlatformCost);
      setNetROI(newTimeValue - newPlatformCost);
      setRoiRatio(newPlatformCost ? newTimeValue / newPlatformCost : 0);
    }, 200); // 200ms debounce delay
    
    // Clean up the timeout on unmount or when dependencies change
    return () => clearTimeout(debounceTimeout);
  }, [platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier]);

  const hoursSaved = (runsPerMonth * minutesPerRun) / 60;

  return (
    <div
      className="flex items-center gap-2 rounded-sm border bg-muted/50 px-2 py-1 text-xs font-mono shadow-inner"
    >
      <Sword className="h-3 w-3 text-primary" />
      <span className="capitalize font-semibold tracking-tight text-foreground">
        {platform}
      </span>
      <span className="opacity-70">•</span>
      <span title="Included quota">
        {tier.quota.toLocaleString()} {data.unit}
      </span>
      <span className="opacity-70">@</span>
      <span>${costPerUnit}/{data.unit}</span>

      {/* Dividers */}
      <span className="opacity-30 mx-1">|</span>

      {/* Value */}
      <span title="Monthly Time Value" className="text-green-600 dark:text-green-400">
        +${timeValue.toFixed(0)}
      </span>
      <span className="opacity-70">/</span>
      <span title="Platform Cost" className="text-red-600 dark:text-red-400">
        -${platformCost.toFixed(0)}
      </span>
      <span className="opacity-30">=</span>
      <span title="Net ROI" className="font-semibold">
        ${netROI.toFixed(0)}
      </span>
    </div>
  );
} 