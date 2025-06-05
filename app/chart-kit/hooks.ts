"use client";

import { useMemo } from 'react';
import { Scenario } from '@/lib/types';
import { Node } from '@xyflow/react';
import {
  calculateTimeValue,
  calculatePlatformCost,
  calculateRiskValue,
  calculateRevenueValue,
  calculateROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod,
  pricing
} from '@/lib/roi';

interface RoiMetrics {
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  totalValue: number;
  platformCost: number;
  netROI: number;
  roiRatio: number;
  paybackPeriod: string;
  breakEvenRuns: number;
  isPositiveROI: boolean;
}

/**
 * Hook to calculate real-time ROI metrics based on scenario and nodes
 */
export function useRoiMetrics(scenario: Scenario | null, nodes: Node[]): RoiMetrics | null {
  return useMemo(() => {
    if (!scenario) return null;

    // Calculate time value
    const timeValue = calculateTimeValue(
      scenario.runsPerMonth || 0,
      scenario.minutesPerRun || 0,
      scenario.hourlyRate || 30,
      scenario.taskMultiplier || 1
    );

    // Calculate platform cost
    const platformCost = calculatePlatformCost(
      scenario.platform || 'zapier',
      scenario.runsPerMonth || 0,
      pricing,
      nodes.length
    );

    // Calculate risk value if compliance is enabled
    const riskValue = calculateRiskValue(
      scenario.complianceEnabled || false,
      scenario.runsPerMonth || 0,
      scenario.riskFrequency || 5,
      scenario.errorCost || 500,
      scenario.riskLevel || 3
    );

    // Calculate revenue value if enabled
    const revenueValue = calculateRevenueValue(
      scenario.revenueEnabled || false,
      scenario.monthlyVolume || 0,
      scenario.conversionRate || 0,
      scenario.valuePerConversion || 0
    );

    // Calculate totals
    const totalValue = timeValue + riskValue + revenueValue;
    const netROI = totalValue - platformCost;
    const roiRatio = calculateROIRatio(totalValue, platformCost);
    
    // Calculate payback period
    const paybackDays = calculatePaybackPeriod(platformCost, totalValue);
    const paybackPeriod = formatPaybackPeriod(paybackDays);
    
    // Calculate break-even runs
    const valuePerRun = totalValue / (scenario.runsPerMonth || 1) / 12;
    const costPerRun = platformCost / (scenario.runsPerMonth || 1) / 12;
    const breakEvenRuns = costPerRun > 0 && valuePerRun > costPerRun 
      ? Math.ceil(platformCost / (valuePerRun - costPerRun)) 
      : 0;

    return {
      timeValue,
      riskValue,
      revenueValue,
      totalValue,
      platformCost,
      netROI,
      roiRatio,
      paybackPeriod,
      breakEvenRuns,
      isPositiveROI: netROI > 0
    };
  }, [scenario, nodes.length]); // Only re-calculate when scenario or node count changes
} 