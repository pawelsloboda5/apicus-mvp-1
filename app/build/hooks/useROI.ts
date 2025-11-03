"use client";

import { useState, useCallback, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { calculateRoiMetrics } from '@/lib/roi-metrics';
// Scenario type already exported in lib/types; avoid duplicate import/name clashes
import type { PositiveFactor, NegativeFactor } from '@/app/api/openai/generate-roi-fields/types';
import { 
  DEFAULT_ROI_SETTINGS,
  TASK_TYPE_MULTIPLIERS,
  BENCHMARKS,
} from '@/lib/utils/constants';
import { PlatformType, Scenario } from '@/lib/types';

// Minimal task-specific factors type used for centralized ROI calculations
export type TaskSpecificFactors = {
  positive: Record<string, number>;
  negative: Record<string, number>;
  definitions: { positive: PositiveFactor[]; negative: NegativeFactor[] };
  confidence: number;
  enabled?: Record<string, boolean>;
} | undefined;

export interface UseROIOptions {
  /** Initial scenario to load ROI settings from */
  initialScenario?: Scenario | null;
  /** Callback fired when ROI settings change */
  onSettingsChange?: (settings: Partial<Scenario>) => void;
  /** Nodes array for platform cost calculation */
  nodes?: Node[];
  /** Optional task specific factors for AI-powered ROI (will be filtered by enabled map if provided) */
  taskSpecificFactors?: TaskSpecificFactors;
}

export interface ROIMetrics {
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  totalValue: number;
  platformCost: number;
  netROI: number;
  roiRatio: number;
  roiRatioFormatted: string;
  paybackDays: number;
  paybackPeriod: string;
  breakEvenRuns: number;
  isPositiveROI: boolean;
  monthlySavings: number;
  yearlySavings: number;
  timeSavedHours: number;
  appCosts?: number;
  totalCost?: number;
  factorBoost?: number;
  totalPositiveFactorImpact?: number;
  totalNegativeFactorImpact?: number;
}

export interface ROIState {
  // Basic settings
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  taskType: string;
  
  // Compliance settings
  complianceEnabled: boolean;
  riskLevel: number;
  riskFrequency: number;
  errorCost: number;
  
  // Revenue settings
  revenueEnabled: boolean;
  monthlyVolume: number;
  conversionRate: number;
  valuePerConversion: number;
}

export function useROI({ 
  initialScenario, 
  onSettingsChange, 
  nodes = [],
  taskSpecificFactors,
}: UseROIOptions = {}) {
  
  // Initialize state from scenario or defaults
  const [roiState, setROIState] = useState<ROIState>(() => ({
    platform: initialScenario?.platform || 'zapier',
    runsPerMonth: initialScenario?.runsPerMonth || DEFAULT_ROI_SETTINGS.runsPerMonth,
    minutesPerRun: initialScenario?.minutesPerRun || DEFAULT_ROI_SETTINGS.minutesPerRun,
    hourlyRate: initialScenario?.hourlyRate || DEFAULT_ROI_SETTINGS.hourlyRate,
    taskMultiplier: initialScenario?.taskMultiplier || DEFAULT_ROI_SETTINGS.taskMultiplier,
    taskType: initialScenario?.taskType || DEFAULT_ROI_SETTINGS.taskType,
    complianceEnabled: initialScenario?.complianceEnabled || DEFAULT_ROI_SETTINGS.complianceEnabled,
    riskLevel: initialScenario?.riskLevel || DEFAULT_ROI_SETTINGS.riskLevel,
    riskFrequency: initialScenario?.riskFrequency || DEFAULT_ROI_SETTINGS.riskFrequency,
    errorCost: initialScenario?.errorCost || DEFAULT_ROI_SETTINGS.errorCost,
    revenueEnabled: initialScenario?.revenueEnabled || DEFAULT_ROI_SETTINGS.revenueEnabled,
    monthlyVolume: initialScenario?.monthlyVolume || DEFAULT_ROI_SETTINGS.monthlyVolume,
    conversionRate: initialScenario?.conversionRate || DEFAULT_ROI_SETTINGS.conversionRate,
    valuePerConversion: initialScenario?.valuePerConversion || DEFAULT_ROI_SETTINGS.valuePerConversion,
  }));

  // Calculate all ROI metrics (centralized, includes platform costs, app costs, and AI factors)
  const metrics = useMemo((): ROIMetrics => {
    // Build filtered task-specific factors payload if provided
    let filteredFactors: {
      positive: Record<string, number>;
      negative: Record<string, number>;
      definitions: { positive: PositiveFactor[]; negative: NegativeFactor[] };
      confidence: number;
    } | undefined;

    if (taskSpecificFactors && taskSpecificFactors.definitions) {
      const enabledMap = (taskSpecificFactors.enabled) || {};
      const isEnabled = (id: string) => enabledMap[id] !== false;

      const positiveDefs = (taskSpecificFactors.definitions.positive as PositiveFactor[] || []).filter(f => isEnabled(f.id));
      const negativeDefs = (taskSpecificFactors.definitions.negative as NegativeFactor[] || []).filter(f => isEnabled(f.id));

      const positiveValues: Record<string, number> = {};
      positiveDefs.forEach(f => {
        const v = (taskSpecificFactors.positive || {})[f.id];
        if (typeof v === 'number') positiveValues[f.id] = v;
      });

      const negativeValues: Record<string, number> = {};
      negativeDefs.forEach(f => {
        const v = (taskSpecificFactors.negative || {})[f.id];
        if (typeof v === 'number') negativeValues[f.id] = v;
      });

      if (positiveDefs.length > 0 || negativeDefs.length > 0) {
        filteredFactors = {
          positive: positiveValues,
          negative: negativeValues,
          definitions: { positive: positiveDefs, negative: negativeDefs },
          confidence: taskSpecificFactors.confidence ?? 0,
        };
      }
    }

    const computed = calculateRoiMetrics({
      platform: roiState.platform,
      runsPerMonth: roiState.runsPerMonth,
      minutesPerRun: roiState.minutesPerRun,
      hourlyRate: roiState.hourlyRate,
      taskMultiplier: roiState.taskMultiplier,
      complianceEnabled: roiState.complianceEnabled,
      riskLevel: roiState.riskLevel,
      riskFrequency: roiState.riskFrequency,
      errorCost: roiState.errorCost,
      revenueEnabled: roiState.revenueEnabled,
      monthlyVolume: roiState.monthlyVolume,
      conversionRate: roiState.conversionRate,
      valuePerConversion: roiState.valuePerConversion,
      taskSpecificFactors: filteredFactors,
    }, nodes);

    const roiRatioFormatted = computed.roiRatio.toFixed(2); // Assuming formatROIRatio is removed
    const paybackPeriod = computed.paybackDays.toFixed(2); // Assuming formatPaybackPeriod is removed

    return {
      timeValue: computed.timeValue,
      riskValue: computed.riskValue,
      revenueValue: computed.revenueValue,
      totalValue: computed.totalValue,
      platformCost: computed.platformCost,
      netROI: computed.netROI,
      roiRatio: computed.roiRatio,
      roiRatioFormatted,
      paybackDays: computed.paybackDays,
      paybackPeriod,
      breakEvenRuns: computed.breakEvenRuns,
      isPositiveROI: computed.netROI > 0,
      monthlySavings: computed.netROI,
      yearlySavings: computed.netROI * 12,
      timeSavedHours: computed.timeSavedHours,
      // Extended fields from centralized calculator
      appCosts: computed.appCosts,
      totalCost: computed.totalCost,
      factorBoost: computed.factorBoost || 0,
      totalPositiveFactorImpact: computed.totalPositiveFactorImpact || 0,
      totalNegativeFactorImpact: computed.totalNegativeFactorImpact || 0,
    } as ROIMetrics;
  }, [roiState, nodes, taskSpecificFactors]);

  // Update individual settings
  const updateSetting = useCallback(<K extends keyof ROIState>(
    key: K,
    value: ROIState[K]
  ) => {
    console.log('🟣 useROI.updateSetting called:', key, '=', value);
    setROIState(prev => {
      const newState = { ...prev, [key]: value };
      
      // Handle task type changes - update multiplier automatically
      // CRITICAL: Only auto-fill if taskType actually changed (not just re-set to same value)
      if (key === 'taskType' && typeof value === 'string' && prev.taskType !== value) {
        console.log('🟣 TaskType changed from', prev.taskType, 'to', value, '- applying auto-fill');
        const multiplier = TASK_TYPE_MULTIPLIERS[value as keyof typeof TASK_TYPE_MULTIPLIERS];
        if (multiplier) {
          newState.taskMultiplier = multiplier;
          // Also update benchmarks
          const benchmark = BENCHMARKS.minutes[value as keyof typeof BENCHMARKS.minutes];
          if (benchmark) {
            newState.minutesPerRun = benchmark;
          }
          const rateBenchmark = BENCHMARKS.hourlyRate[value as keyof typeof BENCHMARKS.hourlyRate];
          if (rateBenchmark) {
            newState.hourlyRate = rateBenchmark;
          }
        }
      } else if (key === 'taskType' && prev.taskType === value) {
        console.log('🟣 TaskType unchanged (', value, ') - skipping auto-fill');
      }
      
      console.log('🟣 useROI new state:', newState);
      return newState;
    });

    // Notify parent of changes
    if (onSettingsChange) {
      console.log('🟣 Calling onSettingsChange with:', { [key]: value });
      onSettingsChange({ [key]: value });
    }
  }, [onSettingsChange]);

  // Bulk update settings
  const updateSettings = useCallback((updates: Partial<ROIState>) => {
    setROIState(prev => ({ ...prev, ...updates }));
    
    if (onSettingsChange) {
      onSettingsChange(updates);
    }
  }, [onSettingsChange]);

  // Load from scenario
  const loadFromScenario = useCallback((scenario: Scenario) => {
    const newState: ROIState = {
      platform: scenario.platform || 'zapier',
      runsPerMonth: scenario.runsPerMonth || DEFAULT_ROI_SETTINGS.runsPerMonth,
      minutesPerRun: scenario.minutesPerRun || DEFAULT_ROI_SETTINGS.minutesPerRun,
      hourlyRate: scenario.hourlyRate || DEFAULT_ROI_SETTINGS.hourlyRate,
      taskMultiplier: scenario.taskMultiplier || DEFAULT_ROI_SETTINGS.taskMultiplier,
      taskType: scenario.taskType || DEFAULT_ROI_SETTINGS.taskType,
      complianceEnabled: scenario.complianceEnabled || DEFAULT_ROI_SETTINGS.complianceEnabled,
      riskLevel: scenario.riskLevel || DEFAULT_ROI_SETTINGS.riskLevel,
      riskFrequency: scenario.riskFrequency || DEFAULT_ROI_SETTINGS.riskFrequency,
      errorCost: scenario.errorCost || DEFAULT_ROI_SETTINGS.errorCost,
      revenueEnabled: scenario.revenueEnabled || DEFAULT_ROI_SETTINGS.revenueEnabled,
      monthlyVolume: scenario.monthlyVolume || DEFAULT_ROI_SETTINGS.monthlyVolume,
      conversionRate: scenario.conversionRate || DEFAULT_ROI_SETTINGS.conversionRate,
      valuePerConversion: scenario.valuePerConversion || DEFAULT_ROI_SETTINGS.valuePerConversion,
    };
    
    setROIState(newState);
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultState: ROIState = {
      platform: 'zapier',
      ...DEFAULT_ROI_SETTINGS,
    };
    
    setROIState(defaultState);
    
    if (onSettingsChange) {
      onSettingsChange(defaultState);
    }
  }, [onSettingsChange]);

  // Apply benchmark for task type
  const applyBenchmark = useCallback((taskType: string) => {
    const updates: Partial<ROIState> = {
      taskType,
      taskMultiplier: TASK_TYPE_MULTIPLIERS[taskType as keyof typeof TASK_TYPE_MULTIPLIERS] || 1.5,
      minutesPerRun: BENCHMARKS.minutes[taskType as keyof typeof BENCHMARKS.minutes] || 5,
      hourlyRate: BENCHMARKS.hourlyRate[taskType as keyof typeof BENCHMARKS.hourlyRate] || 30,
    };
    
    updateSettings(updates);
  }, [updateSettings]);

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({
    // Current state
    settings: roiState,
    metrics,
    
    // Update functions
    updateSetting,
    updateSettings,
    loadFromScenario,
    resetToDefaults,
    applyBenchmark,
    
    // Individual setters for backward compatibility
    setPlatform: (platform: PlatformType) => updateSetting('platform', platform),
    setRunsPerMonth: (runs: number) => updateSetting('runsPerMonth', runs),
    setMinutesPerRun: (minutes: number) => updateSetting('minutesPerRun', minutes),
    setHourlyRate: (rate: number) => updateSetting('hourlyRate', rate),
    setTaskMultiplier: (multiplier: number) => updateSetting('taskMultiplier', multiplier),
    setTaskType: (type: string) => updateSetting('taskType', type),
    setComplianceEnabled: (enabled: boolean) => updateSetting('complianceEnabled', enabled),
    setRiskLevel: (level: number) => updateSetting('riskLevel', level),
    setRiskFrequency: (frequency: number) => updateSetting('riskFrequency', frequency),
    setErrorCost: (cost: number) => updateSetting('errorCost', cost),
    setRevenueEnabled: (enabled: boolean) => updateSetting('revenueEnabled', enabled),
    setMonthlyVolume: (volume: number) => updateSetting('monthlyVolume', volume),
    setConversionRate: (rate: number) => updateSetting('conversionRate', rate),
    setValuePerConversion: (value: number) => updateSetting('valuePerConversion', value),
    
    // Utility getters
    get isCompliance() { return roiState.complianceEnabled; },
    get isRevenue() { return roiState.revenueEnabled; },
    get hasAdvancedFeatures() { return roiState.complianceEnabled || roiState.revenueEnabled; },
  }), [roiState, metrics, updateSetting, updateSettings, loadFromScenario, resetToDefaults, applyBenchmark]);
} 