/**
 * ROI Settings Panel Adapter
 * 
 * Temporary adapter to convert old props interface to new grouped props.
 * This allows gradual migration of parent components.
 * 
 * DEPRECATED: Will be removed in Phase 2 when parent components are updated.
 */

"use client";

import React, { useMemo } from 'react';
import { ROISettingsPanelRefactored } from './ROISettingsPanelRefactored';
import type { Node } from '@xyflow/react';
import type { Scenario } from '@/lib/db';
import type { PlatformType } from '@/lib/types';
import type { ROIConfiguration } from './types';
import type { PositiveFactor, NegativeFactor } from '@/app/api/openai/generate-roi-fields/types';

interface LegacyROISettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformType;
  runsPerMonth: number;
  setRunsPerMonth: (value: number) => void;
  minutesPerRun: number;
  setMinutesPerRun: (value: number) => void;
  hourlyRate: number;
  setHourlyRate: (value: number) => void;
  taskMultiplier: number;
  setTaskMultiplier: (value: number) => void;
  taskType: string;
  setTaskType: (value: string) => void;
  complianceEnabled: boolean;
  setComplianceEnabled: (value: boolean) => void;
  revenueEnabled: boolean;
  setRevenueEnabled: (value: boolean) => void;
  riskLevel: number;
  setRiskLevel: (value: number) => void;
  riskFrequency: number;
  setRiskFrequency: (value: number) => void;
  errorCost: number;
  setErrorCost: (value: number) => void;
  monthlyVolume: number;
  setMonthlyVolume: (value: number) => void;
  conversionRate: number;
  setConversionRate: (value: number) => void;
  valuePerConversion: number;
  setValuePerConversion: (value: number) => void;
  taskTypeMultipliers: Record<string, number>;
  benchmarks: {
    runs: { low: number; medium: number; high: number };
    minutes: Record<string, number>;
    hourlyRate: Record<string, number>;
  };
  updateScenarioROI: (partial: Partial<Scenario>) => void;
  onGenerateReport?: () => void;
  nodes?: Node[];
  currentScenario?: Scenario | null;
}

/**
 * Adapter component that converts legacy props to new grouped props interface
 */
export function ROISettingsPanel(props: LegacyROISettingsPanelProps) {
  const {
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskType,
    taskMultiplier,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
    setRunsPerMonth,
    setMinutesPerRun,
    setHourlyRate,
    setTaskType,
    setTaskMultiplier,
    setComplianceEnabled,
    setRiskLevel,
    setRiskFrequency,
    setErrorCost,
    setRevenueEnabled,
    setMonthlyVolume,
    setConversionRate,
    setValuePerConversion,
  } = props;
  
  // Track previous prop values to detect actual changes
  const prevPropsRef = React.useRef({
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskType,
    taskMultiplier,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
  });
  
  // Extract task-specific factors from scenario
  const taskSpecificFactors = props.currentScenario?.taskSpecificFactors as {
    positive?: Record<string, number>;
    negative?: Record<string, number>;
    definitions?: {
      positive?: Array<{ id: string; name: string; description: string; suggestedValue: number; estimatedMonthlyImpact: number; category: string }>;
      negative?: Array<{ id: string; name: string; description: string; suggestedValue: number; estimatedMonthlyImpact: number; category: string }>;
    };
    enabled?: Record<string, boolean>;
    confidence?: number;
    generatedAt?: number;
  } | undefined;

  // Convert legacy props to new grouped config with task-specific factors from scenario
  const config: ROIConfiguration = useMemo(() => ({
    core: {
      runsPerMonth,
      minutesPerRun,
      hourlyRate,
      taskType,
      taskMultiplier,
    },
    compliance: {
      enabled: complianceEnabled,
      riskLevel,
      riskFrequency,
      errorCost,
    },
    revenue: {
      enabled: revenueEnabled,
      monthlyVolume,
      conversionRate,
      valuePerConversion,
    },
    factors: {
      positive: (taskSpecificFactors?.definitions?.positive || []) as unknown as PositiveFactor[],
      negative: (taskSpecificFactors?.definitions?.negative || []) as unknown as NegativeFactor[],
      factorValues: {
        ...(taskSpecificFactors?.positive || {}),
        ...(taskSpecificFactors?.negative || {}),
      },
      lockedFactors: {},
      enabledFactors: taskSpecificFactors?.enabled || {},
      confidence: taskSpecificFactors?.confidence || 0,
      generated: !!(taskSpecificFactors?.definitions?.positive?.length || taskSpecificFactors?.definitions?.negative?.length),
    },
  }), [
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskType,
    taskMultiplier,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
    taskSpecificFactors,
  ]);

  // Handle config changes by calling individual setters
  // CRITICAL: Only call setters for fields that actually changed from PREVIOUS PROPS
  // This prevents triggering auto-fill logic in useROI (e.g., taskType auto-fills minutes)
  const handleConfigChange = React.useCallback((partial: Partial<ROIConfiguration>) => {
    const prev = prevPropsRef.current;
    
    if (partial.core) {
      if (partial.core.runsPerMonth !== undefined && partial.core.runsPerMonth !== prev.runsPerMonth) {
        setRunsPerMonth(partial.core.runsPerMonth);
        prev.runsPerMonth = partial.core.runsPerMonth;
      }
      if (partial.core.minutesPerRun !== undefined && partial.core.minutesPerRun !== prev.minutesPerRun) {
        setMinutesPerRun(partial.core.minutesPerRun);
        prev.minutesPerRun = partial.core.minutesPerRun;
      }
      if (partial.core.hourlyRate !== undefined && partial.core.hourlyRate !== prev.hourlyRate) {
        setHourlyRate(partial.core.hourlyRate);
        prev.hourlyRate = partial.core.hourlyRate;
      }
      if (partial.core.taskType !== undefined && partial.core.taskType !== prev.taskType) {
        setTaskType(partial.core.taskType);
        prev.taskType = partial.core.taskType;
      }
      if (partial.core.taskMultiplier !== undefined && partial.core.taskMultiplier !== prev.taskMultiplier) {
        setTaskMultiplier(partial.core.taskMultiplier);
        prev.taskMultiplier = partial.core.taskMultiplier;
      }
    }
    
    if (partial.compliance) {
      if (partial.compliance.enabled !== undefined && partial.compliance.enabled !== prev.complianceEnabled) {
        setComplianceEnabled(partial.compliance.enabled);
        prev.complianceEnabled = partial.compliance.enabled;
      }
      if (partial.compliance.riskLevel !== undefined && partial.compliance.riskLevel !== prev.riskLevel) {
        setRiskLevel(partial.compliance.riskLevel);
        prev.riskLevel = partial.compliance.riskLevel;
      }
      if (partial.compliance.riskFrequency !== undefined && partial.compliance.riskFrequency !== prev.riskFrequency) {
        setRiskFrequency(partial.compliance.riskFrequency);
        prev.riskFrequency = partial.compliance.riskFrequency;
      }
      if (partial.compliance.errorCost !== undefined && partial.compliance.errorCost !== prev.errorCost) {
        setErrorCost(partial.compliance.errorCost);
        prev.errorCost = partial.compliance.errorCost;
      }
    }
    
    if (partial.revenue) {
      if (partial.revenue.enabled !== undefined && partial.revenue.enabled !== prev.revenueEnabled) {
        setRevenueEnabled(partial.revenue.enabled);
        prev.revenueEnabled = partial.revenue.enabled;
      }
      if (partial.revenue.monthlyVolume !== undefined && partial.revenue.monthlyVolume !== prev.monthlyVolume) {
        setMonthlyVolume(partial.revenue.monthlyVolume);
        prev.monthlyVolume = partial.revenue.monthlyVolume;
      }
      if (partial.revenue.conversionRate !== undefined && partial.revenue.conversionRate !== prev.conversionRate) {
        setConversionRate(partial.revenue.conversionRate);
        prev.conversionRate = partial.revenue.conversionRate;
      }
      if (partial.revenue.valuePerConversion !== undefined && partial.revenue.valuePerConversion !== prev.valuePerConversion) {
        setValuePerConversion(partial.revenue.valuePerConversion);
        prev.valuePerConversion = partial.revenue.valuePerConversion;
      }
    }
  }, [
    setRunsPerMonth,
    setMinutesPerRun,
    setHourlyRate,
    setTaskType,
    setTaskMultiplier,
    setComplianceEnabled,
    setRiskLevel,
    setRiskFrequency,
    setErrorCost,
    setRevenueEnabled,
    setMonthlyVolume,
    setConversionRate,
    setValuePerConversion,
  ]);

  return (
    <ROISettingsPanelRefactored
      open={props.open}
      onOpenChange={props.onOpenChange}
      config={config}
      onConfigChange={handleConfigChange}
      workflow={{
        nodes: props.nodes || [],
        platform: props.platform,
      }}
      actions={{
        onGenerateReport: props.onGenerateReport,
      }}
      taskTypeMultipliers={props.taskTypeMultipliers}
      benchmarks={props.benchmarks}
      updateScenarioROI={props.updateScenarioROI}
    />
  );
}
