/**
 * ROI Settings Panel - Type Definitions
 * 
 * Centralized type definitions for the refactored ROI Settings Panel.
 */

import type { Node } from '@xyflow/react';
import type { Scenario } from '@/lib/db';
import type { PlatformType } from '@/lib/types';
import type { 
  PositiveFactor, 
  NegativeFactor 
} from '@/app/api/openai/generate-roi-fields/types';

/**
 * Core ROI configuration settings
 */
export interface ROICoreConfig {
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskType: string;
  taskMultiplier: number;
}

/**
 * Risk & Compliance settings
 */
export interface ROIComplianceConfig {
  enabled: boolean;
  riskLevel: number;
  riskFrequency: number;
  errorCost: number;
}

/**
 * Revenue Uplift settings
 */
export interface ROIRevenueConfig {
  enabled: boolean;
  monthlyVolume: number;
  conversionRate: number;
  valuePerConversion: number;
}

/**
 * Task-specific factors
 */
export interface ROITaskFactors {
  positive: PositiveFactor[];
  negative: NegativeFactor[];
  factorValues: Record<string, number>;
  lockedFactors: Record<string, boolean>;
  enabledFactors: Record<string, boolean>;
  confidence: number;
  generated: boolean;
}

/**
 * Complete ROI configuration
 */
export interface ROIConfiguration {
  core: ROICoreConfig;
  compliance: ROIComplianceConfig;
  revenue: ROIRevenueConfig;
  factors: ROITaskFactors;
}

/**
 * Workflow context
 */
export interface ROIWorkflowContext {
  nodes: Node[];
  platform: PlatformType;
}

/**
 * Action handlers
 */
export interface ROIActions {
  onGenerateReport?: () => void;
  onSavePreset?: (name: string) => void;
  onLoadPreset?: (config: ROIConfiguration) => void;
}

/**
 * Display options
 */
export interface ROIDisplayOptions {
  mode?: 'quick' | 'advanced';
  showPlatformComparison?: boolean;
  showAIFactors?: boolean;
}

/**
 * Main component props
 */
export interface ROISettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  config: ROIConfiguration;
  onConfigChange: (config: Partial<ROIConfiguration>) => void;
  
  workflow: ROIWorkflowContext;
  
  actions: ROIActions;
  
  options?: ROIDisplayOptions;
  
  // For backward compatibility (will be removed in Phase 2)
  taskTypeMultipliers: Record<string, number>;
  benchmarks: {
    runs: { low: number; medium: number; high: number };
    minutes: Record<string, number>;
    hourlyRate: Record<string, number>;
  };
  updateScenarioROI: (partial: Partial<Scenario>) => void;
}

/**
 * State actions for useReducer
 */
export type ROIAction =
  | { type: 'UPDATE_CORE'; field: keyof ROICoreConfig; value: number | string }
  | { type: 'UPDATE_TASK_TYPE'; taskType: string; benchmarks: { minutesPerRun: number; hourlyRate: number; taskMultiplier: number } }
  | { type: 'UPDATE_COMPLIANCE'; field: keyof ROIComplianceConfig; value: boolean | number }
  | { type: 'UPDATE_REVENUE'; field: keyof ROIRevenueConfig; value: boolean | number }
  | { type: 'UPDATE_FACTOR_VALUE'; factorId: string; value: number }
  | { type: 'LOCK_FACTOR'; factorId: string }
  | { type: 'TOGGLE_FACTOR'; factorId: string; enabled: boolean }
  | { type: 'SET_FACTORS'; positive: PositiveFactor[]; negative: NegativeFactor[]; confidence: number }
  | { type: 'SET_FACTORS_GENERATING'; generating: boolean }
  | { type: 'LOAD_CONFIG'; config: ROIConfiguration };
