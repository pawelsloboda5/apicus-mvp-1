/**
 * ROI Settings Panel - Refactored Version
 * 
 * Modern, modular implementation with:
 * - Quick Setup and Advanced modes
 * - Grouped props interface
 * - useReducer state management
 * - Modular component composition
 * - Keyboard shortcuts
 * - Accessibility features
 */

"use client";

import React, { useReducer, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Sparkles, Loader2, RotateCcw, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

// Import our modular components
import { ModeToggle, type ROIMode } from "./ModeToggle";
import { QuickSetupFlow } from "./QuickSetupFlow";
import { PlatformComparison, TaskConfiguration, CoreMetrics, ROISummary } from "./sections";
import type { TaskTypeOption } from "./inputs";
import { FactorCard } from "./FactorCard";
import { useKeyboardShortcuts } from "./hooks";

// Import types
import type { Node } from "@xyflow/react";
import type { Scenario } from "@/lib/db";
import { PlatformType } from "@/lib/types";
import type { NodeData } from "@/lib/types";
import { calculateRoiMetrics } from "@/lib/roi-metrics";
import type { 
  PositiveFactor, 
  NegativeFactor,
  GenerateROIFieldsRequest,
  GenerateROIFieldsResponse,
  WorkflowStep,
  TaskType,
  PlatformType as ROIPlatformType
} from "@/app/api/openai/generate-roi-fields/types";
import type { ROIConfiguration } from "./types";
import { roiReducer } from "./reducer";

export interface ROISettingsPanelRefactoredProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  config: ROIConfiguration;
  onConfigChange: (config: Partial<ROIConfiguration>) => void;
  
  workflow: {
    nodes: Node[];
    platform: PlatformType;
  };
  
  actions: {
    onGenerateReport?: () => void;
  };
  
  options?: {
    mode?: 'quick' | 'advanced';
  };
  
  // Backward compatibility props
  taskTypeMultipliers: Record<string, number>;
  benchmarks: {
    runs: { low: number; medium: number; high: number };
    minutes: Record<string, number>;
    hourlyRate: Record<string, number>;
  };
  updateScenarioROI: (partial: Partial<Scenario>) => void;
}


export function ROISettingsPanelRefactored({
  open,
  onOpenChange,
  config,
  onConfigChange,
  workflow,
  actions,
  options,
  taskTypeMultipliers,
  benchmarks,
  updateScenarioROI,
}: ROISettingsPanelRefactoredProps) {
  // Mode state
  const [mode, setMode] = React.useState<ROIMode>(options?.mode || 'advanced'); // Default to advanced to preserve current behavior
  
  // Local state with reducer - DO NOT sync back to parent to avoid circular dependency
  const [localConfig, dispatch] = useReducer(roiReducer, config);
  
  // AI factor generation state
  const [isGeneratingFactors, setIsGeneratingFactors] = React.useState(false);
  
  // Refs for persistence and avoiding circular dependencies
  const updateScenarioROIRef = React.useRef(updateScenarioROI);
  const lastPersistedSignatureRef = React.useRef<string>("");
  const onConfigChangeRef = React.useRef(onConfigChange);
  const localConfigRef = React.useRef(localConfig);
  const lastSyncedConfigRef = React.useRef<string>("");
  
  React.useEffect(() => { 
    updateScenarioROIRef.current = updateScenarioROI;
    onConfigChangeRef.current = onConfigChange;
    localConfigRef.current = localConfig;
  }, [updateScenarioROI, onConfigChange, localConfig]);

  // Sync incoming config prop changes to localConfig (parent → child)
  // This ensures the panel stays in sync with external changes (e.g., from StatsBar)
  // IMPORTANT: Only sync when config prop changes, NOT when localConfig changes (to allow user edits)
  React.useEffect(() => {
    // Use ref to get current localConfig without adding it as dependency
    const current = localConfigRef.current;
    
    // Field-by-field comparison to only update what changed
    if (config.core.runsPerMonth !== current.core.runsPerMonth) {
      dispatch({ type: 'UPDATE_CORE', field: 'runsPerMonth', value: config.core.runsPerMonth });
    }
    if (config.core.minutesPerRun !== current.core.minutesPerRun) {
      dispatch({ type: 'UPDATE_CORE', field: 'minutesPerRun', value: config.core.minutesPerRun });
    }
    if (config.core.hourlyRate !== current.core.hourlyRate) {
      dispatch({ type: 'UPDATE_CORE', field: 'hourlyRate', value: config.core.hourlyRate });
    }
    if (config.core.taskMultiplier !== current.core.taskMultiplier) {
      dispatch({ type: 'UPDATE_CORE', field: 'taskMultiplier', value: config.core.taskMultiplier });
    }
    if (config.core.taskType !== current.core.taskType) {
      dispatch({ type: 'UPDATE_CORE', field: 'taskType', value: config.core.taskType });
    }
    
    // Compliance fields
    if (config.compliance.enabled !== current.compliance.enabled) {
      dispatch({ type: 'UPDATE_COMPLIANCE', field: 'enabled', value: config.compliance.enabled });
    }
    if (config.compliance.riskLevel !== current.compliance.riskLevel) {
      dispatch({ type: 'UPDATE_COMPLIANCE', field: 'riskLevel', value: config.compliance.riskLevel });
    }
    if (config.compliance.riskFrequency !== current.compliance.riskFrequency) {
      dispatch({ type: 'UPDATE_COMPLIANCE', field: 'riskFrequency', value: config.compliance.riskFrequency });
    }
    if (config.compliance.errorCost !== current.compliance.errorCost) {
      dispatch({ type: 'UPDATE_COMPLIANCE', field: 'errorCost', value: config.compliance.errorCost });
    }
    
    // Revenue fields
    if (config.revenue.enabled !== current.revenue.enabled) {
      dispatch({ type: 'UPDATE_REVENUE', field: 'enabled', value: config.revenue.enabled });
    }
    if (config.revenue.monthlyVolume !== current.revenue.monthlyVolume) {
      dispatch({ type: 'UPDATE_REVENUE', field: 'monthlyVolume', value: config.revenue.monthlyVolume });
    }
    if (config.revenue.conversionRate !== current.revenue.conversionRate) {
      dispatch({ type: 'UPDATE_REVENUE', field: 'conversionRate', value: config.revenue.conversionRate });
    }
    if (config.revenue.valuePerConversion !== current.revenue.valuePerConversion) {
      dispatch({ type: 'UPDATE_REVENUE', field: 'valuePerConversion', value: config.revenue.valuePerConversion });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]); // Only depend on config prop, NOT localConfig

  // NOTE: We do NOT sync localConfig back to parent automatically
  // This would cause circular dependency: localConfig → onConfigChange → parent setters → new props → new config → localConfig → loop!
  // Instead, updates happen directly via handlers that call both dispatch AND onConfigChange

  // Calculate steps per run
  const stepsPerRun = useMemo(() => {
    const workflowNodes = workflow.nodes.filter(n => 
      n.type && !['group', 'email', 'emailPreview'].includes(n.type) && 
      !['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(n.type)
    );
    return Math.max(1, workflowNodes.length);
  }, [workflow.nodes]);

  // Build task type options
  const taskTypeOptions: TaskTypeOption[] = useMemo(() => [
    { value: 'internal_admin', label: 'Internal Admin', description: 'Documentation, filing, basic tasks', multiplier: 1.0 },
    { value: 'client_communication', label: 'Client Communication', description: 'Emails, scheduling, follow-ups', multiplier: 1.2 },
    { value: 'data_cleaning', label: 'Data Cleaning or Entry', description: 'Data entry, validation, cleanup', multiplier: 1.2 },
    { value: 'scheduling', label: 'Scheduling or Routing', description: 'Calendar, appointments, routing', multiplier: 1.3 },
    { value: 'reporting', label: 'Reporting or Dashboards', description: 'Reports, analytics, dashboards', multiplier: 1.3 },
    { value: 'onboarding', label: 'Onboarding or Intake', description: 'Client onboarding, intake forms', multiplier: 1.5 },
    { value: 'cross_platform_sync', label: 'Cross-Platform Sync', description: 'Data sync between platforms', multiplier: 1.5 },
    { value: 'outreach', label: 'Outreach or Follow-up', description: 'Outbound campaigns, follow-ups', multiplier: 1.6 },
    { value: 'lead_scoring', label: 'Lead Scoring or Qualification', description: 'CRM scoring, qualification', multiplier: 1.8 },
    { value: 'sales_enablement', label: 'Sales Enablement', description: 'Pipeline management, proposals', multiplier: 2.0 },
    { value: 'revenue_capture', label: 'Revenue Capture', description: 'Payment processing, invoicing', multiplier: 2.2 },
    { value: 'contract_legal', label: 'Contract or Legal', description: 'Contracts, legal documents', multiplier: 2.2 },
    { value: 'booking_appointment', label: 'Booking or Appointment Flow', description: 'Booking systems, scheduling', multiplier: 2.3 },
    { value: 'pipeline_closing', label: 'Pipeline Movement or Closing', description: 'Deal closing, pipeline', multiplier: 2.5 },
  ], []);

  // Generate AI factors
  const generateFactors = useCallback(async () => {
    setIsGeneratingFactors(true);
    try {
      // Prepare workflow steps
      const workflowSteps: WorkflowStep[] = workflow.nodes
        .filter(n => n.type && ['trigger', 'action', 'decision'].includes(n.type))
        .map((node, index) => {
          const nodeData = node.data as Partial<NodeData> | undefined;
          return {
            appId: nodeData?.appId || 'unknown',
            appName: nodeData?.appName || nodeData?.label || 'Unknown App',
            action: nodeData?.action || nodeData?.typeOf || node.type || 'process',
            typeOf: nodeData?.typeOf || node.type || 'action',
            logoUrl: nodeData?.logoUrl,
            index
          };
        });

      // Calculate current metrics
      const metrics = calculateRoiMetrics({
        platform: workflow.platform,
        runsPerMonth: localConfig.core.runsPerMonth,
        minutesPerRun: localConfig.core.minutesPerRun,
        hourlyRate: localConfig.core.hourlyRate,
        taskMultiplier: localConfig.core.taskMultiplier,
        complianceEnabled: localConfig.compliance.enabled,
        riskLevel: localConfig.compliance.riskLevel,
        riskFrequency: localConfig.compliance.riskFrequency,
        errorCost: localConfig.compliance.errorCost,
        revenueEnabled: localConfig.revenue.enabled,
        monthlyVolume: localConfig.revenue.monthlyVolume,
        conversionRate: localConfig.revenue.conversionRate,
        valuePerConversion: localConfig.revenue.valuePerConversion,
      }, workflow.nodes);

      const request: GenerateROIFieldsRequest = {
        taskType: (localConfig.core.taskType as TaskType) || 'internal_admin',
        automationName: `${localConfig.core.taskType} Automation Workflow`,
        platform: workflow.platform as ROIPlatformType,
        runsPerMonth: localConfig.core.runsPerMonth,
        minutesPerRun: localConfig.core.minutesPerRun,
        hourlyRate: localConfig.core.hourlyRate,
        taskMultiplier: localConfig.core.taskMultiplier,
        currentNetROI: metrics.netROI,
        workflowSteps,
        industry: undefined,
        companySize: 'medium',
        automationMaturity: 'intermediate',
        options: {
          useIndustryBenchmarks: true,
          includeAdvancedFactors: false,
          confidenceLevel: 'moderate'
        }
      };

      const response = await fetch('/api/openai/generate-roi-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate factors: ${response.statusText}`);
      }

      const data: GenerateROIFieldsResponse = await response.json();
      
      if (data.success) {
        // Merge with locked factors
        const prevPosMap = new Map(localConfig.factors.positive.map(f => [f.id, f]));
        const prevNegMap = new Map(localConfig.factors.negative.map(f => [f.id, f]));

        const mergedPositive: PositiveFactor[] = data.data.positiveFactors.map(f => {
          return localConfig.factors.lockedFactors[f.id] && prevPosMap.has(f.id) ? prevPosMap.get(f.id)! : f;
        });
        const mergedNegative: NegativeFactor[] = data.data.negativeFactors.map(f => {
          return localConfig.factors.lockedFactors[f.id] && prevNegMap.has(f.id) ? prevNegMap.get(f.id)! : f;
        });

        // Append locked factors not in response
        localConfig.factors.positive.forEach(f => {
          if (localConfig.factors.lockedFactors[f.id] && !mergedPositive.find(x => x.id === f.id)) {
            mergedPositive.push(f);
          }
        });
        localConfig.factors.negative.forEach(f => {
          if (localConfig.factors.lockedFactors[f.id] && !mergedNegative.find(x => x.id === f.id)) {
            mergedNegative.push(f);
          }
        });

        dispatch({
          type: 'SET_FACTORS',
          positive: mergedPositive,
          negative: mergedNegative,
          confidence: data.data.metadata.confidenceScore,
        });

        // Persist to scenario
        if (updateScenarioROI) {
          const newValues: Record<string, number> = {};
          mergedPositive.forEach(f => {
            newValues[f.id] = localConfig.factors.factorValues[f.id] ?? f.suggestedValue;
          });
          mergedNegative.forEach(f => {
            newValues[f.id] = localConfig.factors.factorValues[f.id] ?? f.suggestedValue;
          });

          updateScenarioROI({
            taskSpecificFactors: {
              positive: Object.fromEntries(mergedPositive.map(f => [f.id, newValues[f.id]])),
              negative: Object.fromEntries(mergedNegative.map(f => [f.id, newValues[f.id]])),
              definitions: {
                positive: mergedPositive,
                negative: mergedNegative
              },
              generatedAt: Date.now(),
              confidence: data.data.metadata.confidenceScore
            }
          } as unknown as Partial<Scenario>);
        }

        toast.success('AI factors generated successfully!');
      }
    } catch (error) {
      console.error('Error generating factors:', error);
      toast.error('Failed to generate factors');
    } finally {
      setIsGeneratingFactors(false);
    }
  }, [localConfig, workflow, updateScenarioROI]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onGenerateFactors: generateFactors,
    onGenerateReport: actions.onGenerateReport,
    onClose: () => onOpenChange(false),
    onQuickMode: () => setMode('quick'),
  });

  // Handle task type change with auto-fill
  const handleTaskTypeChange = useCallback((taskType: string) => {
    const minutesPerRun = benchmarks.minutes[taskType as keyof typeof benchmarks.minutes] || 5;
    const hourlyRate = benchmarks.hourlyRate[taskType as keyof typeof benchmarks.hourlyRate] || 30;
    const taskMultiplier = taskTypeMultipliers[taskType as keyof typeof taskTypeMultipliers] || 1.0;
    
    // Update local state
    dispatch({
      type: 'UPDATE_TASK_TYPE',
      taskType,
      benchmarks: { minutesPerRun, hourlyRate, taskMultiplier },
    });
    
    // Sync to parent via onConfigChange (for adapter to call individual setters)
    onConfigChangeRef.current({
      core: { 
        taskType, 
        minutesPerRun: parseFloat(minutesPerRun.toFixed(1)), 
        hourlyRate, 
        taskMultiplier,
        runsPerMonth: localConfig.core.runsPerMonth, // Include to satisfy type
      }
    });
    
    // Also persist to database
    updateScenarioROI({ 
      taskType,
      minutesPerRun: parseFloat(minutesPerRun.toFixed(1)),
      hourlyRate,
      taskMultiplier,
    });
  }, [benchmarks, taskTypeMultipliers, updateScenarioROI, localConfig.core.runsPerMonth]);

  // Handle core metric changes - use refs to avoid dependency issues
  const handleRunsChange = useCallback((value: number) => {
    // Update local state
    dispatch({ type: 'UPDATE_CORE', field: 'runsPerMonth', value });
    // Sync to parent - get current values from ref and update the specific field
    const currentCore = localConfigRef.current.core;
    onConfigChangeRef.current({ 
      core: { 
        runsPerMonth: value,
        minutesPerRun: currentCore.minutesPerRun,
        hourlyRate: currentCore.hourlyRate,
        taskMultiplier: currentCore.taskMultiplier,
        taskType: currentCore.taskType,
      }
    });
    // Persist to database
    updateScenarioROI({ runsPerMonth: value });
  }, [updateScenarioROI]);

  const handleMinutesChange = useCallback((value: number) => {
    const formatted = parseFloat(Math.max(0.1, value).toFixed(1));
    console.log('🔵 handleMinutesChange called with:', value, 'formatted:', formatted);
    
    // Update local state
    dispatch({ type: 'UPDATE_CORE', field: 'minutesPerRun', value: formatted });
    
    // Sync to parent - get current values from ref and update the specific field
    const currentCore = localConfigRef.current.core;
    const configUpdate = { 
      core: { 
        runsPerMonth: currentCore.runsPerMonth,
        minutesPerRun: formatted,
        hourlyRate: currentCore.hourlyRate,
        taskMultiplier: currentCore.taskMultiplier,
        taskType: currentCore.taskType,
      }
    };
    console.log('🔵 Calling onConfigChange with:', configUpdate);
    console.log('🔵 onConfigChangeRef.current exists?', !!onConfigChangeRef.current);
    console.log('🔵 onConfigChangeRef.current type:', typeof onConfigChangeRef.current);
    if (onConfigChangeRef.current) {
      try {
        console.log('🔵 About to call onConfigChangeRef.current...');
        onConfigChangeRef.current(configUpdate);
        console.log('🔵 onConfigChangeRef.current call completed successfully');
      } catch (error) {
        console.error('❌ Error calling onConfigChangeRef.current:', error);
      }
    } else {
      console.error('❌ onConfigChangeRef.current is undefined!');
    }
    
    // Persist to database
    console.log('🔵 Calling updateScenarioROI with:', { minutesPerRun: formatted });
    updateScenarioROI({ minutesPerRun: formatted });
  }, [updateScenarioROI]);

  const handleHourlyRateChange = useCallback((value: number) => {
    // Update local state
    dispatch({ type: 'UPDATE_CORE', field: 'hourlyRate', value });
    // Sync to parent - get current values from ref and update the specific field
    const currentCore = localConfigRef.current.core;
    onConfigChangeRef.current({ 
      core: { 
        runsPerMonth: currentCore.runsPerMonth,
        minutesPerRun: currentCore.minutesPerRun,
        hourlyRate: value,
        taskMultiplier: currentCore.taskMultiplier,
        taskType: currentCore.taskType,
      }
    });
    // Persist to database
    updateScenarioROI({ hourlyRate: value });
  }, [updateScenarioROI]);

  // Calculate ROI metrics
  const metrics = useMemo(() => {
    const isEnabled = (id: string) => localConfig.factors.enabledFactors[id] !== false;
    const filteredPositive = localConfig.factors.positive.filter(f => isEnabled(f.id));
    const filteredNegative = localConfig.factors.negative.filter(f => isEnabled(f.id));
    const filteredValuesPositive = Object.fromEntries(
      filteredPositive.map(f => [f.id, localConfig.factors.factorValues[f.id] ?? f.suggestedValue])
    );
    const filteredValuesNegative = Object.fromEntries(
      filteredNegative.map(f => [f.id, localConfig.factors.factorValues[f.id] ?? f.suggestedValue])
    );

    return calculateRoiMetrics({
      platform: workflow.platform,
      runsPerMonth: localConfig.core.runsPerMonth,
      minutesPerRun: localConfig.core.minutesPerRun,
      hourlyRate: localConfig.core.hourlyRate,
      taskMultiplier: localConfig.core.taskMultiplier,
      complianceEnabled: localConfig.compliance.enabled,
      riskLevel: localConfig.compliance.riskLevel,
      riskFrequency: localConfig.compliance.riskFrequency,
      errorCost: localConfig.compliance.errorCost,
      revenueEnabled: localConfig.revenue.enabled,
      monthlyVolume: localConfig.revenue.monthlyVolume,
      conversionRate: localConfig.revenue.conversionRate,
      valuePerConversion: localConfig.revenue.valuePerConversion,
      taskSpecificFactors: localConfig.factors.generated && (filteredPositive.length > 0 || filteredNegative.length > 0) ? {
        positive: filteredValuesPositive,
        negative: filteredValuesNegative,
        definitions: {
          positive: filteredPositive,
          negative: filteredNegative,
        },
        confidence: localConfig.factors.confidence
      } : undefined,
    }, workflow.nodes);
  }, [localConfig, workflow]);

  // Persist factors to scenario
  React.useEffect(() => {
    if (!updateScenarioROIRef.current) return;
    if (localConfig.factors.positive.length === 0 && localConfig.factors.negative.length === 0) return;
    
    const isEnabled = (id: string) => localConfig.factors.enabledFactors[id] !== false;
    const filteredPositive = localConfig.factors.positive.filter(f => isEnabled(f.id));
    const filteredNegative = localConfig.factors.negative.filter(f => isEnabled(f.id));
    const valuesPositive = Object.fromEntries(
      filteredPositive.map(f => [f.id, (localConfig.factors.factorValues[f.id] ?? f.suggestedValue)])
    );
    const valuesNegative = Object.fromEntries(
      filteredNegative.map(f => [f.id, (localConfig.factors.factorValues[f.id] ?? f.suggestedValue)])
    );
    
    const payload = {
      positive: valuesPositive,
      negative: valuesNegative,
      definitions: {
        positive: localConfig.factors.positive,
        negative: localConfig.factors.negative,
      },
      enabled: localConfig.factors.enabledFactors,
      confidence: localConfig.factors.confidence,
    };
    
    const signature = JSON.stringify(payload);
    if (signature === lastPersistedSignatureRef.current) return;
    
    lastPersistedSignatureRef.current = signature;
    updateScenarioROIRef.current({
      taskSpecificFactors: payload
    } as unknown as Partial<Scenario>);
  }, [localConfig.factors]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[50%] min-w-[768px] overflow-y-auto p-0 bg-white dark:bg-gray-950 data-[state=open]:duration-500"
        style={{ maxWidth: 'none' }}
      >
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Advanced ROI Calculator
            </SheetTitle>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <SheetDescription className="text-sm">
            Configure your automation metrics to see real-time ROI projections with task-specific factors
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {mode === 'quick' ? (
            /* Quick Setup Mode */
            <QuickSetupFlow
              taskType={localConfig.core.taskType}
              onTaskTypeChange={handleTaskTypeChange}
              runsPerMonth={localConfig.core.runsPerMonth}
              onRunsChange={handleRunsChange}
              minutesPerRun={localConfig.core.minutesPerRun}
              onMinutesChange={handleMinutesChange}
              hourlyRate={localConfig.core.hourlyRate}
              onHourlyRateChange={handleHourlyRateChange}
              platform={workflow.platform}
              onPlatformChange={() => {}} // Platform change handled at parent level
              roiPreview={{
                monthlyValue: metrics.totalValue,
                netROI: metrics.netROI,
                timeSaved: metrics.timeSavedHours,
                paybackDays: metrics.paybackDays,
              }}
              onGenerateFactors={generateFactors}
              isGeneratingFactors={isGeneratingFactors}
              onSwitchToAdvanced={() => setMode('advanced')}
            />
          ) : (
            /* Advanced Mode - Current Layout */
            <>
              {/* Platform Pricing Comparison */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Platform Cost Comparison</h3>
                </div>
                <PlatformComparison 
                  runsPerMonth={localConfig.core.runsPerMonth} 
                  stepsPerRun={stepsPerRun}
                  currentPlatform={workflow.platform}
                />
                <p className="text-xs text-muted-foreground">
                  Based on {localConfig.core.runsPerMonth} runs/month with ~{stepsPerRun} steps per workflow
                </p>
              </div>

              {/* Task Configuration */}
              <TaskConfiguration
                taskType={localConfig.core.taskType}
                onTaskTypeChange={handleTaskTypeChange}
                taskMultiplier={localConfig.core.taskMultiplier}
                taskTypeOptions={taskTypeOptions}
              />

              {/* Core Metrics */}
              <CoreMetrics
                runsPerMonth={localConfig.core.runsPerMonth}
                onRunsChange={handleRunsChange}
                minutesPerRun={localConfig.core.minutesPerRun}
                onMinutesChange={handleMinutesChange}
                hourlyRate={localConfig.core.hourlyRate}
                onHourlyRateChange={handleHourlyRateChange}
              />

              {/* Task-Specific Factors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Task-Specific Optimization Factors
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {localConfig.core.taskType ? localConfig.core.taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General'}
                    </Badge>
                    {localConfig.factors.generated && localConfig.factors.confidence > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {localConfig.factors.confidence}% confidence
                      </Badge>
                    )}
                  </div>
                </div>
                
                {!localConfig.factors.generated ? (
                  /* Generation prompt */
                  <div className="p-4 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/20">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Generate AI-Powered ROI Factors
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get intelligent, task-specific factors tailored to your {localConfig.core.taskType || 'automation'} workflow
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={generateFactors}
                        disabled={isGeneratingFactors}
                      >
                        {isGeneratingFactors ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-2" />
                            Generate Factors
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display generated factors */
                  <Accordion type="multiple" defaultValue={["positive-factors", "negative-factors"]} className="space-y-3">
                    {/* Positive Factors */}
                    {localConfig.factors.positive.length > 0 && (
                      <AccordionItem value="positive-factors" className="border rounded-lg bg-green-50/50 dark:bg-green-950/10">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Value Drivers ({localConfig.factors.positive.length})</span>
                            {localConfig.factors.positive.length > 0 && (
                              <span className="text-xs text-green-600 ml-2">
                                +${localConfig.factors.positive.reduce((sum, f) => {
                                  const value = localConfig.factors.factorValues[f.id] ?? f.suggestedValue;
                                  const ratio = value / f.suggestedValue;
                                  return sum + Math.round(f.estimatedMonthlyImpact * ratio);
                                }, 0).toLocaleString()}/mo
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            {localConfig.factors.positive.map(factor => (
                              <FactorCard
                                key={factor.id}
                                factor={factor}
                                value={localConfig.factors.factorValues[factor.id] ?? factor.suggestedValue}
                                onChange={(value) => dispatch({ type: 'UPDATE_FACTOR_VALUE', factorId: factor.id, value })}
                                onReset={() => dispatch({ type: 'UPDATE_FACTOR_VALUE', factorId: factor.id, value: factor.suggestedValue })}
                                variant="positive"
                                locked={!!localConfig.factors.lockedFactors[factor.id]}
                                onToggleLock={() => dispatch({ type: 'LOCK_FACTOR', factorId: factor.id })}
                                enabled={localConfig.factors.enabledFactors[factor.id] !== false}
                                onEnabledChange={(checked) => dispatch({ type: 'TOGGLE_FACTOR', factorId: factor.id, enabled: checked })}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {/* Negative Factors */}
                    {localConfig.factors.negative.length > 0 && (
                      <AccordionItem value="negative-factors" className="border rounded-lg bg-red-50/50 dark:bg-red-950/10">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Cost & Risk Factors ({localConfig.factors.negative.length})</span>
                            {localConfig.factors.negative.length > 0 && (
                              <span className="text-xs text-red-600 ml-2">
                                ${Math.abs(localConfig.factors.negative.reduce((sum, f) => {
                                  const value = localConfig.factors.factorValues[f.id] ?? f.suggestedValue;
                                  const ratio = value / f.suggestedValue;
                                  return sum + Math.round(f.estimatedMonthlyImpact * ratio);
                                }, 0)).toLocaleString()}/mo
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            {localConfig.factors.negative.map(factor => (
                              <FactorCard
                                key={factor.id}
                                factor={factor}
                                value={localConfig.factors.factorValues[factor.id] ?? factor.suggestedValue}
                                onChange={(value) => dispatch({ type: 'UPDATE_FACTOR_VALUE', factorId: factor.id, value })}
                                onReset={() => dispatch({ type: 'UPDATE_FACTOR_VALUE', factorId: factor.id, value: factor.suggestedValue })}
                                variant="negative"
                                locked={!!localConfig.factors.lockedFactors[factor.id]}
                                onToggleLock={() => dispatch({ type: 'LOCK_FACTOR', factorId: factor.id })}
                                enabled={localConfig.factors.enabledFactors[factor.id] !== false}
                                onEnabledChange={(checked) => dispatch({ type: 'TOGGLE_FACTOR', factorId: factor.id, enabled: checked })}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {/* Regenerate button */}
                    {localConfig.factors.generated && (
                      <div className="flex justify-center pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={generateFactors}
                          disabled={isGeneratingFactors}
                        >
                          {isGeneratingFactors ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-2" />
                              Regenerate Factors
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Accordion>
                )}
              </div>

              {/* Advanced Factors Accordion */}
              <Accordion type="multiple" className="w-full space-y-3">
                <AccordionItem value="risk-compliance" className="border rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium">Risk & Compliance</span>
                        <span className="text-xs text-muted-foreground font-normal">Error reduction & regulatory adherence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="compliance" 
                          checked={localConfig.compliance.enabled}
                          onCheckedChange={(checked) => {
                            dispatch({ type: 'UPDATE_COMPLIANCE', field: 'enabled', value: checked });
                            onConfigChangeRef.current({
                              compliance: { ...localConfigRef.current.compliance, enabled: checked }
                            });
                            updateScenarioROI({ complianceEnabled: checked });
                          }}
                        />
                        <AccordionTrigger className="border-0 p-0 hover:no-underline" />
                      </div>
                    </div>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Risk Level (1-5)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[localConfig.compliance.riskLevel]}
                            onValueChange={(values) => {
                              const v = values[0];
                              dispatch({ type: 'UPDATE_COMPLIANCE', field: 'riskLevel', value: v });
                              onConfigChangeRef.current({
                                compliance: { ...localConfigRef.current.compliance, riskLevel: v }
                              });
                              updateScenarioROI({ riskLevel: v });
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-8 text-right">{localConfig.compliance.riskLevel}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Error Frequency (%)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[localConfig.compliance.riskFrequency]}
                            onValueChange={(values) => {
                              const v = values[0];
                              dispatch({ type: 'UPDATE_COMPLIANCE', field: 'riskFrequency', value: v });
                              onConfigChangeRef.current({
                                compliance: { ...localConfigRef.current.compliance, riskFrequency: v }
                              });
                              updateScenarioROI({ riskFrequency: v });
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">{localConfig.compliance.riskFrequency}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Cost per Error ($)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-full"
                          value={localConfig.compliance.errorCost}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            dispatch({ type: 'UPDATE_COMPLIANCE', field: 'errorCost', value: v });
                            onConfigChangeRef.current({
                              compliance: { ...localConfigRef.current.compliance, errorCost: v }
                            });
                            updateScenarioROI({ errorCost: v });
                          }}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="revenue-uplift" className="border rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium">Revenue Uplift</span>
                        <span className="text-xs text-muted-foreground font-normal">Lead generation & sales conversion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="revenue" 
                          checked={localConfig.revenue.enabled}
                          onCheckedChange={(checked) => {
                            dispatch({ type: 'UPDATE_REVENUE', field: 'enabled', value: checked });
                            onConfigChangeRef.current({
                              revenue: { ...localConfigRef.current.revenue, enabled: checked }
                            });
                            updateScenarioROI({ revenueEnabled: checked });
                          }}
                        />
                        <AccordionTrigger className="border-0 p-0 hover:no-underline" />
                      </div>
                    </div>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Monthly Volume</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-full"
                          value={localConfig.revenue.monthlyVolume}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            dispatch({ type: 'UPDATE_REVENUE', field: 'monthlyVolume', value: v });
                            onConfigChangeRef.current({
                              revenue: { ...localConfigRef.current.revenue, monthlyVolume: v }
                            });
                            updateScenarioROI({ monthlyVolume: v });
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Conversion Rate (%)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={0}
                            max={20}
                            step={0.5}
                            value={[localConfig.revenue.conversionRate]}
                            onValueChange={(values) => {
                              const v = values[0];
                              dispatch({ type: 'UPDATE_REVENUE', field: 'conversionRate', value: v });
                              onConfigChangeRef.current({
                                revenue: { ...localConfigRef.current.revenue, conversionRate: v }
                              });
                              updateScenarioROI({ conversionRate: v });
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">{localConfig.revenue.conversionRate}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Value per Conversion ($)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-full"
                          value={localConfig.revenue.valuePerConversion}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            dispatch({ type: 'UPDATE_REVENUE', field: 'valuePerConversion', value: v });
                            onConfigChangeRef.current({
                              revenue: { ...localConfigRef.current.revenue, valuePerConversion: v }
                            });
                            updateScenarioROI({ valuePerConversion: v });
                          }}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* ROI Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="text-base font-semibold mb-4">ROI Summary</h3>
                <ROISummary
                  metrics={metrics}
                  nodes={workflow.nodes}
                  factorsGenerated={localConfig.factors.generated}
                  complianceEnabled={localConfig.compliance.enabled}
                  revenueEnabled={localConfig.revenue.enabled}
                  positiveFactorsCount={localConfig.factors.positive.length}
                  negativeFactorsCount={localConfig.factors.negative.length}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <SheetFooter className="p-6 pt-0 border-t">
          <Button
            onClick={() => actions.onGenerateReport?.()}
            className="w-full"
            size="lg"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Generate ROI Report
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
