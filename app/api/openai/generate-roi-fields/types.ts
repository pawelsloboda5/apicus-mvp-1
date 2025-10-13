/**
 * Type definitions for the Generate ROI Fields API
 */

export type TaskType = 
  | 'internal_admin' 
  | 'client_communication' 
  | 'data_cleaning' 
  | 'scheduling' 
  | 'reporting' 
  | 'onboarding' 
  | 'cross_platform_sync' 
  | 'outreach' 
  | 'lead_scoring' 
  | 'sales_enablement' 
  | 'revenue_capture' 
  | 'contract_legal' 
  | 'booking_appointment' 
  | 'pipeline_closing';

export type PlatformType = 'zapier' | 'make' | 'n8n';
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise';
export type AutomationMaturity = 'beginner' | 'intermediate' | 'advanced';
export type ConfidenceLevel = 'conservative' | 'moderate' | 'aggressive';

export interface WorkflowStep {
  appId: string;
  appName: string;
  action: string;
  typeOf: string;
  logoUrl?: string;
  index: number;
}

export interface GenerateROIFieldsRequest {
  // Required Context
  taskType: TaskType;
  automationName: string;
  platform: PlatformType;
  
  // Current Metrics
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  currentNetROI?: number;
  
  // Workflow Analysis
  workflowSteps: WorkflowStep[];
  
  // Optional Context
  industry?: string;
  companySize?: CompanySize;
  automationMaturity?: AutomationMaturity;
  
  // Generation Options
  options?: {
    useIndustryBenchmarks?: boolean;
    includeAdvancedFactors?: boolean;
    confidenceLevel?: ConfidenceLevel;
    locale?: string;
  };
}

export type FactorUnit = 'percentage' | 'currency' | 'number' | 'hours' | 'score';
export type ImpactType = 'multiplicative' | 'additive' | 'compound' | 'recurring';
export type BaseMetric = 'time' | 'revenue' | 'risk' | 'cost';
export type FactorCategory = 'time' | 'revenue' | 'quality' | 'scale' | 'cost' | 'risk' | 'maintenance' | 'overhead';
export type FactorPriority = 'high' | 'medium' | 'low';
export type FactorSeverity = 'critical' | 'major' | 'minor';
export type FactorSource = 'ai' | 'benchmark' | 'historical' | 'default';

export interface BaseFactor {
  id: string;
  label: string;
  description: string;
  unit: FactorUnit;
  
  // Values
  defaultValue: number;
  suggestedValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  
  // Impact Calculation
  impactType: ImpactType;
  baseMetric: BaseMetric;
  impactFormula: string;
  estimatedMonthlyImpact: number;
  
  // Metadata
  confidence: number; // 0-100
  source: FactorSource;
  reasoning?: string;
}

export interface PositiveFactor extends BaseFactor {
  category: 'time' | 'revenue' | 'quality' | 'scale';
  industryBenchmark?: number;
  
  // UI Hints
  icon?: string;
  color?: string;
  priority: FactorPriority;
  helpText?: string;
}

export interface NegativeFactor extends BaseFactor {
  category: 'cost' | 'risk' | 'maintenance' | 'overhead';
  mitigationStrategy?: string;
  
  // UI Hints
  icon?: string;
  severity: FactorSeverity;
  canBeEliminated?: boolean;
  alternativeSolutions?: string[];
}

export interface GenerationMetadata {
  model: string;
  temperature: number;
  tokensUsed: number;
  generationTime: number;
  confidenceScore: number;
  dataSources: string[];
  warnings?: string[];
  suggestions?: string[];
}

export interface GenerateROIFieldsResponse {
  success: boolean;
  data: {
    positiveFactors: PositiveFactor[];
    negativeFactors: NegativeFactor[];
    metadata: GenerationMetadata;
  };
  cached?: boolean;
  generatedAt: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
