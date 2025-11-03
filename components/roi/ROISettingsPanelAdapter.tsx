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
      positive: (taskSpecificFactors?.definitions?.positive || []) as Array<{
        id: string;
        name: string;
        description: string;
        suggestedValue: number;
        estimatedMonthlyImpact: number;
        category: string;
      }>,
      negative: (taskSpecificFactors?.definitions?.negative || []) as Array<{
        id: string;
        name: string;
        description: string;
        suggestedValue: number;
        estimatedMonthlyImpact: number;
        category: string;
      }>,
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
  const handleConfigChange = React.useCallback((partial: Partial<ROIConfiguration>) => {
    if (partial.core) {
      if (partial.core.runsPerMonth !== undefined) setRunsPerMonth(partial.core.runsPerMonth);
      if (partial.core.minutesPerRun !== undefined) setMinutesPerRun(partial.core.minutesPerRun);
      if (partial.core.hourlyRate !== undefined) setHourlyRate(partial.core.hourlyRate);
      if (partial.core.taskType !== undefined) setTaskType(partial.core.taskType);
      if (partial.core.taskMultiplier !== undefined) setTaskMultiplier(partial.core.taskMultiplier);
    }
    
    if (partial.compliance) {
      if (partial.compliance.enabled !== undefined) setComplianceEnabled(partial.compliance.enabled);
      if (partial.compliance.riskLevel !== undefined) setRiskLevel(partial.compliance.riskLevel);
      if (partial.compliance.riskFrequency !== undefined) setRiskFrequency(partial.compliance.riskFrequency);
      if (partial.compliance.errorCost !== undefined) setErrorCost(partial.compliance.errorCost);
    }
    
    if (partial.revenue) {
      if (partial.revenue.enabled !== undefined) setRevenueEnabled(partial.revenue.enabled);
      if (partial.revenue.monthlyVolume !== undefined) setMonthlyVolume(partial.revenue.monthlyVolume);
      if (partial.revenue.conversionRate !== undefined) setConversionRate(partial.revenue.conversionRate);
      if (partial.revenue.valuePerConversion !== undefined) setValuePerConversion(partial.revenue.valuePerConversion);
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
