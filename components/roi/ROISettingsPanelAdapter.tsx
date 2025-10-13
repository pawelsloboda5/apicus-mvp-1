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
}

/**
 * Adapter component that converts legacy props to new grouped props interface
 */
export function ROISettingsPanel(props: LegacyROISettingsPanelProps) {
  // Convert legacy props to new grouped config
  const config: ROIConfiguration = useMemo(() => ({
    core: {
      runsPerMonth: props.runsPerMonth,
      minutesPerRun: props.minutesPerRun,
      hourlyRate: props.hourlyRate,
      taskType: props.taskType,
      taskMultiplier: props.taskMultiplier,
    },
    compliance: {
      enabled: props.complianceEnabled,
      riskLevel: props.riskLevel,
      riskFrequency: props.riskFrequency,
      errorCost: props.errorCost,
    },
    revenue: {
      enabled: props.revenueEnabled,
      monthlyVolume: props.monthlyVolume,
      conversionRate: props.conversionRate,
      valuePerConversion: props.valuePerConversion,
    },
    factors: {
      positive: [],
      negative: [],
      factorValues: {},
      lockedFactors: {},
      enabledFactors: {},
      confidence: 0,
      generated: false,
    },
  }), [
    props.runsPerMonth,
    props.minutesPerRun,
    props.hourlyRate,
    props.taskType,
    props.taskMultiplier,
    props.complianceEnabled,
    props.riskLevel,
    props.riskFrequency,
    props.errorCost,
    props.revenueEnabled,
    props.monthlyVolume,
    props.conversionRate,
    props.valuePerConversion,
  ]);

  // Handle config changes by calling individual setters
  const handleConfigChange = React.useCallback((partial: Partial<ROIConfiguration>) => {
    if (partial.core) {
      if (partial.core.runsPerMonth !== undefined) props.setRunsPerMonth(partial.core.runsPerMonth);
      if (partial.core.minutesPerRun !== undefined) props.setMinutesPerRun(partial.core.minutesPerRun);
      if (partial.core.hourlyRate !== undefined) props.setHourlyRate(partial.core.hourlyRate);
      if (partial.core.taskType !== undefined) props.setTaskType(partial.core.taskType);
      if (partial.core.taskMultiplier !== undefined) props.setTaskMultiplier(partial.core.taskMultiplier);
    }
    
    if (partial.compliance) {
      if (partial.compliance.enabled !== undefined) props.setComplianceEnabled(partial.compliance.enabled);
      if (partial.compliance.riskLevel !== undefined) props.setRiskLevel(partial.compliance.riskLevel);
      if (partial.compliance.riskFrequency !== undefined) props.setRiskFrequency(partial.compliance.riskFrequency);
      if (partial.compliance.errorCost !== undefined) props.setErrorCost(partial.compliance.errorCost);
    }
    
    if (partial.revenue) {
      if (partial.revenue.enabled !== undefined) props.setRevenueEnabled(partial.revenue.enabled);
      if (partial.revenue.monthlyVolume !== undefined) props.setMonthlyVolume(partial.revenue.monthlyVolume);
      if (partial.revenue.conversionRate !== undefined) props.setConversionRate(partial.revenue.conversionRate);
      if (partial.revenue.valuePerConversion !== undefined) props.setValuePerConversion(partial.revenue.valuePerConversion);
    }
  }, [
    props.setRunsPerMonth,
    props.setMinutesPerRun,
    props.setHourlyRate,
    props.setTaskType,
    props.setTaskMultiplier,
    props.setComplianceEnabled,
    props.setRiskLevel,
    props.setRiskFrequency,
    props.setErrorCost,
    props.setRevenueEnabled,
    props.setMonthlyVolume,
    props.setConversionRate,
    props.setValuePerConversion,
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
