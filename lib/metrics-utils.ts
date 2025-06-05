import { createMetricSnapshot, MetricSnapshot } from './db';
import { 
  calculateTimeValue, 
  calculatePlatformCost, 
  calculateROIRatio,
  calculateRiskValue,
  calculateRevenueValue,
  pricing 
} from './roi';
import { Scenario } from './types';
import { Node } from '@xyflow/react';

/**
 * Captures a metric snapshot for a scenario
 */
export async function captureROISnapshot(
  scenario: Scenario,
  nodes: Node[],
  trigger: MetricSnapshot['trigger'] = 'manual'
): Promise<number | null> {
  if (!scenario.id) return null;

  // Calculate all ROI metrics
  const timeValue = calculateTimeValue(
    scenario.runsPerMonth || 0,
    scenario.minutesPerRun || 0,
    scenario.hourlyRate || 30,
    scenario.taskMultiplier || 1
  );

  const nodeCount = nodes.length;
  const platformCost = calculatePlatformCost(
    scenario.platform || 'zapier',
    scenario.runsPerMonth || 0,
    pricing,
    nodeCount
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

  // Calculate total value
  const totalValue = timeValue + riskValue + revenueValue;
  const netROI = totalValue - platformCost;
  const roiRatio = calculateROIRatio(totalValue, platformCost);

  // Calculate payback period
  const monthlyROI = netROI / 12;
  let paybackPeriod = 'Immediate';
  if (monthlyROI < 0) {
    paybackPeriod = 'Never';
  } else if (platformCost > 0) {
    const months = Math.ceil(platformCost / monthlyROI);
    if (months > 1) {
      paybackPeriod = `${months} months`;
    }
  }

  // Calculate break-even runs
  const valuePerRun = totalValue / (scenario.runsPerMonth || 1) / 12;
  const costPerRun = platformCost / (scenario.runsPerMonth || 1) / 12;
  const breakEvenRuns = costPerRun > 0 ? Math.ceil(platformCost / (valuePerRun - costPerRun)) : 0;

  // Create the snapshot
  const metrics: MetricSnapshot['metrics'] = {
    netROI,
    roiRatio,
    timeValue,
    riskValue: scenario.complianceEnabled ? riskValue : undefined,
    revenueValue: scenario.revenueEnabled ? revenueValue : undefined,
    platformCost,
    runsPerMonth: scenario.runsPerMonth || 0,
    minutesPerRun: scenario.minutesPerRun || 0,
    hourlyRate: scenario.hourlyRate || 30,
    taskMultiplier: scenario.taskMultiplier || 1,
    taskType: scenario.taskType || 'general',
    totalValue,
    paybackPeriod,
    breakEvenRuns,
  };

  return createMetricSnapshot(scenario.id, metrics, trigger);
}

/**
 * Determines if a snapshot should be captured based on changes
 */
export function shouldCaptureSnapshot(
  prevScenario: Scenario | null,
  currentScenario: Scenario,
  prevNodeCount: number,
  currentNodeCount: number
): boolean {
  if (!prevScenario) return true;

  // Check for significant changes
  const significantChanges = [
    prevScenario.platform !== currentScenario.platform,
    Math.abs((prevScenario.runsPerMonth || 0) - (currentScenario.runsPerMonth || 0)) > 10,
    Math.abs((prevScenario.minutesPerRun || 0) - (currentScenario.minutesPerRun || 0)) > 0.5,
    Math.abs((prevScenario.hourlyRate || 0) - (currentScenario.hourlyRate || 0)) > 5,
    prevScenario.complianceEnabled !== currentScenario.complianceEnabled,
    prevScenario.revenueEnabled !== currentScenario.revenueEnabled,
    Math.abs(prevNodeCount - currentNodeCount) > 2,
  ];

  return significantChanges.some(changed => changed);
}

/**
 * Formats a metric snapshot for display
 */
export function formatMetricSnapshot(snapshot: MetricSnapshot): {
  date: string;
  time: string;
  netROI: string;
  roiRatio: string;
  trigger: string;
} {
  const date = new Date(snapshot.timestamp);
  
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    netROI: `$${snapshot.metrics.netROI.toLocaleString()}`,
    roiRatio: `${snapshot.metrics.roiRatio.toFixed(1)}×`,
    trigger: snapshot.trigger.replace('_', ' '),
  };
} 