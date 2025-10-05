import { Node } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { ROIReportNodeData } from '@/components/flow/ROIReportNode';
import { 
  formatROIRatio,
} from '@/lib/roi-utils';
import { PlatformType, NodeData } from '@/lib/types';
import { calculateRoiMetrics } from '@/lib/roi-metrics';
import type { PositiveFactor, NegativeFactor } from "@/app/api/openai/generate-roi-fields/types";

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
  // Optional task-specific factors (already filtered/enabled)
  taskSpecificFactors?: {
    positive: Record<string, number>;
    negative: Record<string, number>;
    definitions: { positive: PositiveFactor[]; negative: NegativeFactor[] };
    confidence?: number;
  };
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
    nodes = [],
    taskSpecificFactors,
  } = config;

  // Use unified calculator (includes task-specific factors and app pricing extracted from nodes)
  const computed = calculateRoiMetrics({
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
    taskSpecificFactors: taskSpecificFactors
      ? {
          positive: taskSpecificFactors.positive,
          negative: taskSpecificFactors.negative,
          definitions: taskSpecificFactors.definitions,
          confidence: taskSpecificFactors.confidence ?? 0,
        }
      : undefined,
  }, nodes);
  const timeValue = computed.timeValue;
  const riskValue = computed.riskValue;
  const revenueValue = computed.revenueValue;
  const platformCost = computed.platformCost;
  const appCosts = computed.appCosts;
  const netROI = computed.netROI;
  const roiRatio = computed.roiRatio;
  const totalCosts = computed.totalCost;
  const paybackDays = computed.paybackDays;

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
      appCosts,
      totalCosts,
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

export async function generateRoiNodeWithBusinessImpact(params: {
  projectName?: string;
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  taskType?: string;
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  nodes: Node[];
  currentScenarioName?: string;
  clientName?: string;
}): Promise<Node<ROIReportNodeData>> {
  const {
    projectName,
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    taskType,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
    nodes,
    currentScenarioName,
    clientName,
  } = params;

  // Prepare sanitized nodes for prompt transparency
  const sanitizedNodes = nodes.map(n => {
    const d = n.data as Partial<NodeData> | undefined;
    return {
      id: n.id,
      type: n.type,
      data: {
        label: d?.label,
        appId: d?.appId,
        appName: d?.appName,
        action: d?.action,
        typeOf: d?.typeOf,
        logoUrl: d?.logoUrl,
      }
    };
  });

  let businessImpact: string | undefined;
  try {
    const res = await fetch('/api/openai/generate-roi-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'businessImpact',
        context: {
          projectName: currentScenarioName || projectName || 'Automation Project',
          clientName,
          taskType: taskType || 'general',
          platform,
          runsPerMonth,
          minutesPerRun,
          hourlyRate,
          taskMultiplier,
          complianceEnabled: Boolean(complianceEnabled),
          riskLevel: riskLevel ?? 3,
          riskFrequency: riskFrequency ?? 5,
          errorCost: errorCost ?? 500,
          revenueEnabled: Boolean(revenueEnabled),
          monthlyVolume: monthlyVolume ?? 0,
          conversionRate: conversionRate ?? 0,
          valuePerConversion: valuePerConversion ?? 0,
          workflow: { nodes: sanitizedNodes },
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      businessImpact = data?.content?.trim();
    }
  } catch {
    // ignore AI errors; fall back to default business impact generated in node
  }

  const node = generateROIReportNode({
    projectName: currentScenarioName || projectName,
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    taskType,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
    nodes,
  });

  if (businessImpact) {
    node.data.businessImpact = businessImpact;
  }
  return node;
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