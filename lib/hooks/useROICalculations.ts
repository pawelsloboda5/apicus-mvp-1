/**
 * ROI Calculations Hook
 * Provides standardized ROI calculations for node panels
 */

import { useMemo, useCallback } from "react";
import { Node } from "@xyflow/react";
import { NodeData, NodeType, PlatformType } from "@/lib/types";
import { calculateNodeTimeSavings, calculateROIRatio, formatROIRatio, calculateRiskValue, calculateRevenueValue } from "@/lib/roi-utils";
import { NODE_TIME_FACTORS } from "@/lib/utils/constants";
import { pricing } from "@/app/api/data/pricing";

export interface ROICalculationProps {
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  platform: PlatformType;
  nodes: Node[];
  // Risk & Compliance parameters
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  // Revenue Uplift parameters
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
}

export interface NodeROIData {
  adjustedMinutes: number;
  stepValue: number;
  monthlyCostNode: number;
  appCostForNode: number;
  totalNodeCost: number;
  roiRatioNode: number;
  nodesUsingThisApp: number;
  // Additional value calculations
  riskValue: number;
  revenueValue: number;
  totalValue: number; // stepValue + riskValue + revenueValue
}

export function useROICalculations({
  runsPerMonth,
  minutesPerRun,
  hourlyRate,
  taskMultiplier,
  platform,
  nodes,
  // Risk & Compliance parameters with defaults
  complianceEnabled = false,
  riskLevel = 3,
  riskFrequency = 5,
  errorCost = 100,
  // Revenue Uplift parameters with defaults
  revenueEnabled = false,
  monthlyVolume = 1000,
  conversionRate = 2,
  valuePerConversion = 100,
}: ROICalculationProps) {
  

  
  // Memoize the calculateNodeROI function to ensure proper reactivity
  const calculateNodeROI = useCallback((selectedNode: Node): NodeROIData => {
    const nodeData = selectedNode?.data as unknown as NodeData;
    
    // Calculate time savings
    const adjustedMinutes = calculateNodeTimeSavings(
      selectedNode.type as NodeType, 
      minutesPerRun,
      nodes,
      NODE_TIME_FACTORS,
      nodeData?.typeOf
    );
    
    // Calculate value
    const hourValue = hourlyRate * taskMultiplier;
    const stepValue = (adjustedMinutes / 60) * hourValue * runsPerMonth;
    
    // Calculate platform cost per individual node
    const data = pricing[platform];
    const tierName: Record<string, string> = {
      zapier: "Professional",
      make: "Core", 
      n8n: "Starter"
    };
    const currentTierName = tierName[platform] || Object.values(tierName)[0];
    
    // Automatically select the appropriate tier based on total usage
    let tier;
    if (platform === 'zapier') {
      // Calculate total workflow tasks per month (all nodes × runs)
      const totalTasksPerMonth = runsPerMonth * nodes.length;
      
      // Find the most cost-effective tier that can handle the load
      const professionalTiers = data.tiers.filter((t: { name: string; quota: number }) => 
        t.name.includes("Professional") && t.quota >= totalTasksPerMonth
      ).sort((a: { quota: number }, b: { quota: number }) => a.quota - b.quota);
      
      // Use the smallest tier that fits, or fall back to the default lookup
      tier = professionalTiers[0] || data.tiers.find((t: { name: string; monthlyUSD: number; quota: number }) => 
        t.name.includes(currentTierName)
      ) || data.tiers[0];
    } else {
      tier = data.tiers.find((t: { name: string; monthlyUSD: number; quota: number }) => 
        t.name.includes(currentTierName)
      ) || data.tiers[0];
    }
    
    const costPerUnit = tier.quota ? (tier.monthlyUSD / tier.quota) : 0;
    
    // Calculate cost for THIS individual node only
    let unitsPerRunNode = 1; 
    if (platform === 'zapier') {
      // Each Zapier step = 1 task, regardless of other nodes
      unitsPerRunNode = 1;
    } else if (platform === 'make') {
      // Make pricing varies by operation type
      unitsPerRunNode = selectedNode.type === 'action' ? 1.2 : (selectedNode.type === 'trigger' || selectedNode.type === 'decision' ? 1 : 0.5);
    } else if (platform === 'n8n') {
      // For n8n, each execution covers all nodes, so individual node cost is shared
      // But for individual node view, show the cost AS IF this node ran alone
      unitsPerRunNode = 1;
    }
    
    // Monthly cost for THIS specific node
    const monthlyCostNode = unitsPerRunNode * runsPerMonth * costPerUnit;
    
    // Calculate app cost
    let appCostForNode = 0;
    let nodesUsingThisApp = 1;
    
    if (nodeData?.pricingData && nodeData?.appId) {
      const selectedTier = nodeData.selectedTier || 'default';
      
      if (selectedTier === 'free' || (selectedTier === 'default' && nodeData.pricingData.hasFreeTier)) {
        appCostForNode = 0;
      } else if (selectedTier === 'starter' && nodeData.pricingData.lowestMonthlyPrice !== null && nodeData.pricingData.lowestMonthlyPrice !== undefined) {
        appCostForNode = nodeData.pricingData.lowestMonthlyPrice;
      } else if (selectedTier === 'usage' && nodeData.pricingData.hasUsageBasedPricing) {
        appCostForNode = runsPerMonth * 0.01 * (selectedNode.type === 'action' ? 1.5 : 1);
      } else if (selectedTier === 'custom') {
        appCostForNode = nodeData.pricingData.lowestMonthlyPrice || 100;
      } else {
        appCostForNode = nodeData.pricingData.hasFreeTier ? 0 : (nodeData.pricingData.lowestMonthlyPrice || 0);
      }
      
      // Divide cost by number of nodes using the same app
      nodesUsingThisApp = nodes.filter(n => {
        const data = n.data as Record<string, unknown>;
        return data?.appId === nodeData.appId;
      }).length;
      
      if (nodesUsingThisApp > 1) {
        appCostForNode = appCostForNode / nodesUsingThisApp;
      }
    }
    
    const totalNodeCost = monthlyCostNode + appCostForNode;
    
    // Calculate workflow-level risk and revenue values (distributed across all nodes)
    const workflowNodes = nodes.filter(n => 
      n.type && !['group', 'email', 'emailPreview'].includes(n.type) && 
      !['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(n.type)
    );
    const nodeCount = Math.max(1, workflowNodes.length);
    
    // Risk value distributed per node
    const totalRiskValue = calculateRiskValue(complianceEnabled, runsPerMonth, riskFrequency, errorCost, riskLevel);
    const riskValue = totalRiskValue / nodeCount;
    
    // Revenue value distributed per node  
    const totalRevenueValue = calculateRevenueValue(revenueEnabled, monthlyVolume, conversionRate, valuePerConversion);
    const revenueValue = totalRevenueValue / nodeCount;
    

    
    // Total value for this node
    const totalValue = stepValue + riskValue + revenueValue;
    
    const roiRatioNode = calculateROIRatio(totalValue, monthlyCostNode, appCostForNode);

    return {
      adjustedMinutes,
      stepValue,
      monthlyCostNode,
      appCostForNode,
      totalNodeCost,
      roiRatioNode,
      nodesUsingThisApp,
      riskValue,
      revenueValue,
      totalValue,
    };
  }, [runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, platform, nodes, complianceEnabled, riskLevel, riskFrequency, errorCost, revenueEnabled, monthlyVolume, conversionRate, valuePerConversion]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    calculateNodeROI,
    // Expose individual calculation props for flexibility
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    platform,
    formatROIRatio,
  }), [calculateNodeROI, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, platform]);
}