"use client";

import { useState, useCallback, useMemo } from 'react';
import { Node } from '@xyflow/react';
import {
  calculateTimeValue,
  calculatePlatformCost,
  calculateRiskValue,
  calculateRevenueValue,
  calculateTotalValue,
  calculateNetROI,
  calculateROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod,
  formatROIRatio,
} from '@/lib/roi-utils';
import { pricing } from '@/app/api/data/pricing';
import { 
  DEFAULT_ROI_SETTINGS,
  TASK_TYPE_MULTIPLIERS,
  BENCHMARKS,
} from '@/lib/utils/constants';
import { PlatformType, Scenario } from '@/lib/types';

export interface UseROIOptions {
  /** Initial scenario to load ROI settings from */
  initialScenario?: Scenario | null;
  /** Callback fired when ROI settings change */
  onSettingsChange?: (settings: Partial<Scenario>) => void;
  /** Nodes array for platform cost calculation */
  nodes?: Node[];
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
  nodes = [] 
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

  // Calculate all ROI metrics
  const metrics = useMemo((): ROIMetrics => {
    const timeValue = calculateTimeValue(
      roiState.runsPerMonth,
      roiState.minutesPerRun,
      roiState.hourlyRate,
      roiState.taskMultiplier
    );

    const riskValue = calculateRiskValue(
      roiState.complianceEnabled,
      roiState.runsPerMonth,
      roiState.riskFrequency,
      roiState.errorCost,
      roiState.riskLevel
    );

    const revenueValue = calculateRevenueValue(
      roiState.revenueEnabled,
      roiState.monthlyVolume,
      roiState.conversionRate,
      roiState.valuePerConversion
    );

    const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
    
    const platformCost = calculatePlatformCost(
      roiState.platform,
      roiState.runsPerMonth,
      pricing,
      nodes.length
    );

    const netROI = calculateNetROI(totalValue, platformCost);
    const roiRatio = calculateROIRatio(totalValue, platformCost);
    const paybackDays = calculatePaybackPeriod(platformCost, netROI);

    // Additional derived metrics
    const timeSavedHours = (roiState.runsPerMonth * roiState.minutesPerRun) / 60;
    const monthlySavings = netROI;
    const yearlySavings = netROI * 12;
    const breakEvenRuns = platformCost > 0 && totalValue > platformCost 
      ? Math.ceil(platformCost / ((totalValue / roiState.runsPerMonth) - (platformCost / roiState.runsPerMonth)))
      : 0;

    return {
      timeValue,
      riskValue,
      revenueValue,
      totalValue,
      platformCost,
      netROI,
      roiRatio,
      roiRatioFormatted: formatROIRatio(roiRatio),
      paybackDays,
      paybackPeriod: formatPaybackPeriod(paybackDays),
      breakEvenRuns,
      isPositiveROI: netROI > 0,
      monthlySavings,
      yearlySavings,
      timeSavedHours,
    };
  }, [roiState, nodes.length]);

  // Update individual settings
  const updateSetting = useCallback(<K extends keyof ROIState>(
    key: K,
    value: ROIState[K]
  ) => {
    setROIState(prev => {
      const newState = { ...prev, [key]: value };
      
      // Handle task type changes - update multiplier automatically
      if (key === 'taskType' && typeof value === 'string') {
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
      }
      
      return newState;
    });

    // Notify parent of changes
    if (onSettingsChange) {
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

  return {
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
  };
} 