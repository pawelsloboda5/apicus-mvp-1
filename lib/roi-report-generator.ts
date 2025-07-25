import { Node } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { ROIReportNodeData } from '@/components/flow/ROIReportNode';
import { 
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculatePlatformCost,
  calculateNetROI,
  calculateROIRatio,
  calculatePaybackPeriod,
  formatROIRatio,
  calculateAppCosts,
} from '@/lib/roi-utils';
import { pricing } from '@/app/api/data/pricing';
import { PlatformType, NodeData, AppPricingData } from '@/lib/types';

interface ROIGeneratorConfig {
  // Position
  position?: { x: number; y: number };
  
  // Basic info
  projectName?: string;
  clientName?: string;
  
  // ROI Settings
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  taskType?: string;
  
  // Advanced settings
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  
  // Workflow nodes for analysis
  nodes: Node[];
}

export function generateROIReportNode(config: ROIGeneratorConfig): Node<ROIReportNodeData> {
  const {
    position = { x: 400, y: 200 },
    projectName = 'Automation Project',
    clientName = '',
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    taskType = 'general',
    complianceEnabled = false,
    riskLevel = 3,
    riskFrequency = 5,
    errorCost = 500,
    revenueEnabled = false,
    monthlyVolume = 100,
    conversionRate = 5,
    valuePerConversion = 200,
    nodes = []
  } = config;

  // Extract app pricing data from nodes
  const appPricingMap: Record<string, AppPricingData> = {};
  const uniqueApps = new Set<string>();
  
  nodes.forEach(node => {
    const nodeData = node.data as Partial<NodeData>;
    if (nodeData?.appId && nodeData?.pricingData) {
      uniqueApps.add(nodeData.appId);
      if (!appPricingMap[nodeData.appId]) {
        appPricingMap[nodeData.appId] = {
          appId: nodeData.appId,
          appName: nodeData.appName || '',
          appSlug: '',
          hasFreeTier: nodeData.pricingData.hasFreeTier || false,
          hasFreeTrial: false,
          currency: nodeData.pricingData.currency || 'USD',
          lowestMonthlyPrice: nodeData.pricingData.lowestMonthlyPrice || 0,
          highestMonthlyPrice: 0,
          tierCount: 0,
          hasUsageBasedPricing: nodeData.pricingData.hasUsageBasedPricing || false,
          hasAIFeatures: false,
        };
      }
    }
  });

  // Calculate all ROI values
  const timeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
  const riskValue = calculateRiskValue(complianceEnabled, runsPerMonth, riskFrequency, errorCost, riskLevel);
  const revenueValue = calculateRevenueValue(revenueEnabled, monthlyVolume, conversionRate, valuePerConversion);
  
  const platformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodes.length);
  const appCosts = calculateAppCosts(appPricingMap);
  const totalValue = timeValue + riskValue + revenueValue;
  const netROI = calculateNetROI(totalValue, platformCost, appCosts);
  const roiRatio = calculateROIRatio(totalValue, platformCost, appCosts);
  const totalCosts = platformCost + appCosts;
  const paybackDays = calculatePaybackPeriod(totalCosts, netROI);

  // Extract workflow steps from nodes
  const workflowSteps = nodes
    .filter(n => ['trigger', 'action', 'decision'].includes(n.type || ''))
    .slice(0, 5) // Limit to 5 steps for display
    .map((node, index) => {
      const nodeData = node.data as Partial<NodeData>;
      return {
        id: node.id,
        label: nodeData.label || `${node.type} ${index + 1}`,
        platform: nodeData.appName || platform,
        icon: node.type === 'trigger' ? 'PlayCircle' : 
              node.type === 'decision' ? 'GitBranch' : 'Zap',
        description: nodeData.action || nodeData.typeOf || ''
      };
    });

  // Generate business impact text (max 30 words for API)
  const hoursSaved = (runsPerMonth * minutesPerRun) / 60;
  const businessImpact = `Save ${hoursSaved.toFixed(1)} hours monthly with ${formatROIRatio(roiRatio)} ROI. ${complianceEnabled ? 'Reduce errors by 95%. ' : ''}${revenueEnabled ? `Generate $${revenueValue.toFixed(0)} additional revenue. ` : ''}Payback in ${Math.ceil(paybackDays)} days.${appCosts > 0 ? ` Total costs: $${totalCosts.toFixed(0)}/mo.` : ''}`;

  // Generate key benefits
  const keyBenefits = [
    `Save ${hoursSaved.toFixed(1)} hours per month on manual tasks`,
    `${formatROIRatio(roiRatio)} return on investment`,
    `Break even in ${Math.ceil(paybackDays)} days`,
    `Process ${runsPerMonth} operations monthly with zero manual effort`
  ];
  
  if (complianceEnabled && riskValue > 0) {
    keyBenefits.push(`Prevent ${((runsPerMonth * riskFrequency) / 100).toFixed(0)} errors monthly`);
  }
  
  if (revenueEnabled && revenueValue > 0) {
    keyBenefits.push(`Generate $${revenueValue.toFixed(0)} additional monthly revenue`);
  }
  
  if (appCosts > 0) {
    keyBenefits.push(`Total platform & app costs: $${totalCosts.toFixed(0)}/month`);
  }

  // Create the ROI report node
  const roiNode: Node<ROIReportNodeData> = {
    id: `roi-report-${nanoid(6)}`,
    type: 'roiReport',
    position,
    data: {
      // Header
      nodeTitle: 'ROI Analysis Report',
      reportTitle: 'Automation ROI Analysis',
      projectName,
      clientName,
      generatedDate: new Date(),
      
      // Workflow
      workflowSteps,
      
      // Core metrics
      runsPerMonth,
      minutesPerRun,
      hourlyRate,
      platform,
      
      // Calculated values
      timeValue,
      riskValue,
      revenueValue,
      platformCost,
      netROI,
      roiRatio,
      paybackPeriod: paybackDays,
      
      // Performance metrics
      confidence: calculateConfidenceScore(roiRatio, paybackDays),
      breakEvenMonth: paybackDays > 30 ? Math.ceil(paybackDays / 30) : 1,
      
      // Visual settings
      colorScheme: platform,
      showPlatformComparison: true,
      showRevenueBreakdown: true,
      
      // Business impact
      businessImpact,
      keyBenefits,
      
      // Risk & Compliance
      complianceEnabled,
      riskLevel,
      riskFrequency,
      errorCost,
      
      // Revenue
      revenueEnabled,
      monthlyVolume,
      conversionRate,
      valuePerConversion,
      
      // Task config
      taskMultiplier,
      taskType,
      
      // Pass nodes for apps extraction
      nodes,
    },
    draggable: true,
    selectable: true,
  };

  return roiNode;
}

// Helper function to calculate confidence score
function calculateConfidenceScore(roiRatio: number, paybackDays: number): number {
  let score = 50; // Base score
  
  // ROI ratio contribution (up to 30 points)
  if (roiRatio > 10) score += 30;
  else if (roiRatio > 5) score += 20;
  else if (roiRatio > 2) score += 10;
  else if (roiRatio > 1) score += 5;
  
  // Payback period contribution (up to 20 points)
  if (paybackDays < 7) score += 20;
  else if (paybackDays < 30) score += 15;
  else if (paybackDays < 90) score += 10;
  else if (paybackDays < 180) score += 5;
  
  return Math.min(score, 95); // Cap at 95%
} 