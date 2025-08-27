import { Node } from "@xyflow/react";
import { PlatformType, AppPricingData, NodeData } from "@/lib/types";
import {
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculatePlatformCost,
  calculateNetROI,
  calculateROIRatio,
  calculatePaybackPeriod,
  calculateAppCosts,
} from "@/lib/roi-utils";
import { pricing } from "@/app/api/data/pricing";

export interface RoiSettings {
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  // Optional advanced factors
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
}

export interface RoiComputed {
  // Value breakdown (monthly only)
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  totalValue: number;

  // Costs (monthly only)
  platformCost: number;
  appCosts: number;
  totalCost: number;

  // Outcomes (monthly only)
  netROI: number;
  roiRatio: number;
  paybackDays: number;
  breakEvenRuns: number;
  timeSavedHours: number;
}

// Build an AppPricingData map from nodes if available
function extractAppPricingFromNodes(nodes: Node[]): Record<string, AppPricingData> {
  const map: Record<string, AppPricingData> = {};
  nodes.forEach(n => {
    const d = n.data as Partial<NodeData> | undefined;
    const appId = d?.appId as string | undefined;
    const pd = d?.pricingData as Partial<AppPricingData> | undefined;
    if (!appId || !pd) return;
    if (!map[appId]) {
      map[appId] = {
        appId,
        appName: d?.appName || "",
        appSlug: "",
        hasFreeTier: Boolean(pd.hasFreeTier),
        hasFreeTrial: Boolean(pd.hasFreeTrial),
        currency: pd.currency || "USD",
        lowestMonthlyPrice: pd.lowestMonthlyPrice || 0,
        highestMonthlyPrice: pd.highestMonthlyPrice || 0,
        tierCount: pd.tierCount || 0,
        hasUsageBasedPricing: Boolean(pd.hasUsageBasedPricing),
        hasAIFeatures: Boolean(pd.hasAIFeatures),
      } as AppPricingData;
    }
  });
  return map;
}

export function calculateRoiMetrics(
  settings: RoiSettings,
  nodes: Node[] = [],
  appPricingMap?: Record<string, AppPricingData>
): RoiComputed {
  const {
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    complianceEnabled = false,
    riskLevel = 3,
    riskFrequency = 5,
    errorCost = 100,
    revenueEnabled = false,
    monthlyVolume = 0,
    conversionRate = 0,
    valuePerConversion = 0,
  } = settings;

  // Core values (monthly)
  const timeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
  const riskValue = calculateRiskValue(complianceEnabled, runsPerMonth, riskFrequency, errorCost, riskLevel);
  const revenueValue = calculateRevenueValue(revenueEnabled, monthlyVolume, conversionRate, valuePerConversion);
  const totalValue = timeValue + riskValue + revenueValue;

  // Costs (monthly)
  const platformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodes.length || 5);
  const appPricing = appPricingMap || extractAppPricingFromNodes(nodes);
  const appCosts = calculateAppCosts(appPricing);
  const totalCost = platformCost + appCosts;

  // Outcomes (monthly)
  const netROI = calculateNetROI(totalValue, platformCost, appCosts);
  const roiRatio = calculateROIRatio(totalValue, platformCost, appCosts);
  const paybackDays = calculatePaybackPeriod(totalCost, netROI);
  const timeSavedHours = (runsPerMonth * minutesPerRun) / 60;
  const breakEvenRuns = totalCost > 0 && totalValue > totalCost
    ? Math.ceil(totalCost / ((totalValue / Math.max(1, runsPerMonth)) - (totalCost / Math.max(1, runsPerMonth))))
    : 0;

  return {
    timeValue,
    riskValue,
    revenueValue,
    totalValue,
    platformCost,
    appCosts,
    totalCost,
    netROI,
    roiRatio,
    paybackDays,
    breakEvenRuns,
    timeSavedHours,
  };
}


