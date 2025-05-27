/**
 * ROI calculation utilities
 * Contains functions for calculating various ROI metrics used in the application
 */

import { Node } from "@xyflow/react";
import { NodeType } from "@/lib/types";

/**
 * Calculate the total time value of automation
 * @param runsPerMonth Number of times automation runs per month
 * @param minutesPerRun Minutes saved per run
 * @param hourlyRate Hourly wage rate
 * @param taskMultiplier Task value multiplier
 * @returns The calculated time value in dollars
 */
export function calculateTimeValue(
  runsPerMonth: number,
  minutesPerRun: number,
  hourlyRate: number,
  taskMultiplier: number
): number {
  const totalMinutesPerMonth = runsPerMonth * minutesPerRun;
  const totalHoursPerMonth = totalMinutesPerMonth / 60;
  return totalHoursPerMonth * hourlyRate * taskMultiplier;
}

/**
 * Calculate risk/compliance value of automation
 * @param enabled Whether risk/compliance calculation is enabled
 * @param runsPerMonth Number of times automation runs per month
 * @param riskFrequency Percentage chance of error occurrence
 * @param errorCost Average cost per error
 * @param riskLevel Risk severity level (1-5)
 * @returns The calculated risk value in dollars
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
 * Calculate revenue uplift value of automation
 * @param enabled Whether revenue uplift calculation is enabled
 * @param monthlyVolume Number of opportunities/leads generated monthly
 * @param conversionRate Percentage of leads that convert
 * @param valuePerConversion Average value per successful conversion
 * @returns The calculated revenue value in dollars
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
 * Calculates the platform cost for automation
 * @param platform Automation platform (zapier, make, n8n)
 * @param runsPerMonth Number of runs per month
 * @param pricing Pricing data for platforms
 * @param nodeCount Optional number of nodes to calculate per-node costs
 * @returns Monthly cost in dollars
 */
export function calculatePlatformCost(
  platform: string,
  runsPerMonth: number,
  pricing: Record<string, unknown>,
  nodeCount: number = 0
): number {
  const data = pricing[platform] as { tiers: Array<{ name: string; monthlyUSD: number; quota: number }> };
  const tierName: Record<string, string> = {
    zapier: "Professional",
    make: "Core",
    n8n: "Starter",
  };
  const tier = data.tiers.find((t: { name: string; monthlyUSD: number; quota: number }) => t.name === tierName[platform]) || data.tiers[0];
  
  // Get cost per unit
  const costPerUnit = tier.quota ? tier.monthlyUSD / tier.quota : 0;
  
  // Calculate units used
  let unitsPerRun = 1;
  
  // Adjust based on platform and node count
  if (platform === 'zapier') {
    // In Zapier, each action consumes 1 task
    unitsPerRun = nodeCount || 1;
  } else if (platform === 'make') {
    // In Make, operations can vary by complexity
    unitsPerRun = nodeCount ? nodeCount * 1.2 : 1;
  } else if (platform === 'n8n') {
    // In n8n, executions are per workflow, not per node
    unitsPerRun = 1;
  }
  
  return unitsPerRun * runsPerMonth * costPerUnit;
}

/**
 * Calculate the total ROI value
 * @param timeValue Time savings value
 * @param riskValue Risk reduction value
 * @param revenueValue Revenue uplift value
 * @returns The total value in dollars
 */
export function calculateTotalValue(
  timeValue: number,
  riskValue: number,
  revenueValue: number
): number {
  return timeValue + riskValue + revenueValue;
}

/**
 * Calculate net ROI
 * @param totalValue Total value from automation
 * @param platformCost Cost of automation platform
 * @returns Net ROI in dollars
 */
export function calculateNetROI(
  totalValue: number,
  platformCost: number
): number {
  return totalValue - platformCost;
}

/**
 * Calculate ROI ratio
 * @param totalValue Total value from automation
 * @param platformCost Cost of automation platform
 * @returns ROI ratio as a number
 */
export function calculateROIRatio(
  totalValue: number,
  platformCost: number
): number {
  return platformCost > 0 ? totalValue / platformCost : 0;
}

/**
 * Format ROI ratio for display
 * @param ratio ROI ratio number
 * @returns Formatted ROI ratio string
 */
export function formatROIRatio(ratio: number): string {
  if (ratio > 1000) {
    return `${(Math.round(ratio / 100) / 10).toFixed(1)}k×`;
  } else if (ratio > 100) {
    return `${Math.round(ratio)}×`;
  } else if (ratio > 10) {
    return `${(Math.round(ratio * 10) / 10).toFixed(1)}×`;
  } else {
    return `${(Math.round(ratio * 100) / 100).toFixed(2)}×`;
  }
}

/**
 * Calculate payback period in days
 * @param monthlyCost Monthly cost of automation
 * @param netROI Net monthly ROI
 * @returns Payback period in days
 */
export function calculatePaybackPeriod(
  monthlyCost: number,
  netROI: number
): number {
  return netROI > 0 ? (monthlyCost / netROI * 30) : Infinity;
}

/**
 * Format payback period for display
 * @param days Payback period in days
 * @returns Formatted payback period string
 */
export function formatPaybackPeriod(days: number): string {
  if (days === Infinity) return "Never";
  if (days < 1) return "Immediate";
  if (days < 30) return `${days.toFixed(1)} days`;
  if (days < 365) return `${(days / 30).toFixed(1)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

/**
 * Calculates time savings for a specific node based on its type
 * @param nodeType Type of the node (trigger, action, decision)
 * @param totalMinutesPerRun Total minutes per run of the workflow
 * @param allNodes All nodes in the workflow
 * @param typeFactors Factors to adjust time based on node type
 * @param operationType Optional operation type for further adjustment
 * @returns Estimated minutes saved by this node
 */
export function calculateNodeTimeSavings(
  nodeType: NodeType,
  totalMinutesPerRun: number,
  allNodes: Node[],
  typeFactors: Record<NodeType, number> = {
    trigger: 0.5,
    action: 1.2,
    decision: 0.8,
    group: 0,
  },
  operationType?: string
): number {
  // Base calculation - distribute time based on node type
  const typeFactor = typeFactors[nodeType] || 1;
  
  // Total weight in the workflow
  const totalWeight = allNodes.reduce((total, node) => {
    const type = node.type as NodeType;
    return total + (typeFactors[type] || 1);
  }, 0);
  
  // This node's portion of the total time
  let nodeMinutes = (totalMinutesPerRun * typeFactor) / totalWeight;
  
  // Adjust based on operation type if provided
  if (operationType) {
    // Complex operations (like data transformation) take more time
    if (operationType === "transform" || operationType === "filter") {
      nodeMinutes *= 1.5;
    }
    // Simple operations like basic reads take less time
    else if (operationType === "read" || operationType === "fetch") {
      nodeMinutes *= 0.8;
    }
  }
  
  return nodeMinutes;
}

/**
 * Calculate aggregate ROI metrics for a group of nodes
 * @param nodeIds Array of node IDs in the group
 * @param nodes All nodes in the workflow
 * @param baseParams Base ROI parameters
 * @returns Object with aggregated ROI metrics
 */
export function calculateGroupROI(
  nodeIds: string[],
  nodes: Node[],
  baseParams: {
    runsPerMonth: number;
    minutesPerRun: number;
    hourlyRate: number;
    taskMultiplier: number;
    platform: string;
  },
  pricing: Record<string, unknown>
) {
  const { runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, platform } = baseParams;
  
  // Get all nodes in the group
  const groupNodes = nodes.filter(node => nodeIds.includes(node.id));
  
  // Calculate total time saved by group nodes
  let totalMinutesSaved = 0;
  
  groupNodes.forEach(node => {
    const nodeType = node.type as NodeType;
    const operationType = (node.data as Record<string, unknown>)?.typeOf as string | undefined;
    
    // Calculate this node's time contribution
    const nodeMinutes = calculateNodeTimeSavings(
      nodeType, 
      minutesPerRun,
      nodes,
      {
        trigger: 0.5,
        action: 1.2,
        decision: 0.8,
        group: 0,
      },
      operationType
    );
    
    totalMinutesSaved += nodeMinutes;
  });
  
  // Calculate metrics
  const timeValue = calculateTimeValue(runsPerMonth, totalMinutesSaved, hourlyRate, taskMultiplier);
  const platformCost = calculatePlatformCost(platform, runsPerMonth, pricing, groupNodes.length);
  const netROI = timeValue - platformCost;
  const roiRatio = calculateROIRatio(timeValue, platformCost);
  
  return {
    timeValue,
    platformCost,
    netROI,
    roiRatio,
    totalMinutesSaved,
    nodeCount: groupNodes.length,
  };
} 