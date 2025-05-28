/**
 * ROI calculation utilities and pricing data
 */

import { PlatformType } from "@/lib/types";

// Pricing data for all platforms
export const pricing = {
  zapier: {
    unit: "tasks",
    tiers: [
      { name: "Free", monthlyUSD: 0, quota: 100 },
      { name: "Starter", monthlyUSD: 19.99, quota: 750 },
      { name: "Professional", monthlyUSD: 49, quota: 2000 },
      { name: "Team", monthlyUSD: 69, quota: 50000 },
      { name: "Company", monthlyUSD: 103.50, quota: 100000 },
    ],
  },
  make: {
    unit: "operations",
    tiers: [
      { name: "Free", monthlyUSD: 0, quota: 1000 },
      { name: "Core", monthlyUSD: 9, quota: 10000 },
      { name: "Pro", monthlyUSD: 16, quota: 10000 },
      { name: "Teams", monthlyUSD: 29, quota: 10000 },
      { name: "Enterprise", monthlyUSD: 99, quota: 10000 },
    ],
  },
  n8n: {
    unit: "executions",
    tiers: [
      { name: "Community", monthlyUSD: 0, quota: 999999 },
      { name: "Starter", monthlyUSD: 20, quota: 5000 },
      { name: "Pro", monthlyUSD: 50, quota: 10000 },
      { name: "Enterprise", monthlyUSD: 500, quota: 100000 },
    ],
  },
};

/**
 * Calculate the total time value of automation
 */
export function calculateTimeValue(
  runsPerMonth: number,
  minutesPerRun: number,
  hourlyRate: number,
  taskMultiplier: number = 1
): number {
  const totalMinutesPerMonth = runsPerMonth * minutesPerRun;
  const totalHoursPerMonth = totalMinutesPerMonth / 60;
  return totalHoursPerMonth * hourlyRate * taskMultiplier;
}

/**
 * Calculate platform cost based on usage and pricing tiers
 */
export function calculatePlatformCost(
  platform: PlatformType,
  runsPerMonth: number,
  pricingData: typeof pricing,
  nodeCount: number = 1
): number {
  const platformData = pricingData[platform];
  if (!platformData) return 0;

  // Define tier preferences for each platform
  const tierPreferences: Record<PlatformType, string> = {
    zapier: "Professional",
    make: "Core", 
    n8n: "Starter",
  };

  // Find the preferred tier or fall back to first tier
  const preferredTier = tierPreferences[platform];
  const tier = platformData.tiers.find(t => t.name === preferredTier) || platformData.tiers[0];
  
  if (!tier || tier.quota === 0) return tier?.monthlyUSD || 0;

  // Calculate units used based on platform
  let unitsPerRun = 1;
  
  switch (platform) {
    case 'zapier':
      // Each action step consumes 1 task
      unitsPerRun = Math.max(1, nodeCount);
      break;
    case 'make':
      // Operations can vary by complexity, estimate 1.2x nodes
      unitsPerRun = Math.max(1, Math.ceil(nodeCount * 1.2));
      break;
    case 'n8n':
      // Executions are per workflow run, not per node
      unitsPerRun = 1;
      break;
  }

  const totalUnitsUsed = unitsPerRun * runsPerMonth;
  
  // Check if usage exceeds quota
  if (totalUnitsUsed <= tier.quota) {
    return tier.monthlyUSD;
  }

  // Find appropriate tier for usage or calculate overage
  const suitableTier = platformData.tiers.find(t => t.quota >= totalUnitsUsed);
  if (suitableTier) {
    return suitableTier.monthlyUSD;
  }

  // If no tier fits, use highest tier + estimated overage
  const highestTier = platformData.tiers[platformData.tiers.length - 1];
  const overageUnits = totalUnitsUsed - highestTier.quota;
  const overageRate = highestTier.monthlyUSD / highestTier.quota;
  
  return highestTier.monthlyUSD + (overageUnits * overageRate);
}

/**
 * Calculate risk/compliance value
 */
export function calculateRiskValue(
  enabled: boolean,
  runsPerMonth: number,
  riskFrequency: number,
  errorCost: number,
  riskLevel: number
): number {
  if (!enabled) return 0;
  return (runsPerMonth * (riskFrequency / 100) * errorCost * (riskLevel / 3));
}

/**
 * Calculate revenue uplift value
 */
export function calculateRevenueValue(
  enabled: boolean,
  monthlyVolume: number,
  conversionRate: number,
  valuePerConversion: number
): number {
  if (!enabled) return 0;
  return (monthlyVolume * (conversionRate / 100) * valuePerConversion);
}

/**
 * Calculate net ROI
 */
export function calculateNetROI(
  totalValue: number,
  platformCost: number
): number {
  return totalValue - platformCost;
}

/**
 * Calculate ROI ratio
 */
export function calculateROIRatio(
  totalValue: number,
  platformCost: number
): number {
  return platformCost > 0 ? totalValue / platformCost : 0;
}

/**
 * Format ROI ratio for display
 */
export function formatROIRatio(ratio: number): string {
  if (ratio >= 1000) {
    return `${(ratio / 1000).toFixed(1)}k×`;
  } else if (ratio >= 100) {
    return `${Math.round(ratio)}×`;
  } else if (ratio >= 10) {
    return `${ratio.toFixed(1)}×`;
  } else if (ratio >= 1) {
    return `${ratio.toFixed(2)}×`;
  } else {
    return `${ratio.toFixed(2)}×`;
  }
}

/**
 * Calculate payback period in days
 */
export function calculatePaybackPeriod(
  monthlyCost: number,
  monthlyValue: number
): number {
  const monthlyROI = monthlyValue - monthlyCost;
  return monthlyROI > 0 ? (monthlyCost / monthlyROI * 30) : Infinity;
}

/**
 * Format payback period for display
 */
export function formatPaybackPeriod(days: number): string {
  if (days === Infinity) return "Never";
  if (days < 1) return "Immediate";
  if (days < 30) return `${Math.round(days)} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

/**
 * Get benchmark data for different task types
 */
export const taskTypeMultipliers = {
  general: 1.0,
  admin: 1.2,
  data_entry: 1.1,
  customer_service: 1.3,
  sales: 1.5,
  marketing: 1.4,
  finance: 1.6,
  hr: 1.3,
  it: 1.7,
};

/**
 * Industry benchmarks for validation
 */
export const benchmarks = {
  hourlyRates: {
    min: 15,
    avg: 35,
    max: 150,
  },
  minutesPerRun: {
    min: 0.1,
    avg: 5,
    max: 120,
  },
  runsPerMonth: {
    min: 1,
    avg: 500,
    max: 50000,
  },
};