"use client";

import React, { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, TrendingUp, DollarSign, Calculator, Zap, AlertTriangle, Sparkles, ChevronRight, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { pricing } from "@/app/api/data/pricing";
import type { Scenario } from "@/lib/db";
import { PlatformType } from "@/lib/types";
// ROI utilities are now handled by the useROICalculations hook
import { useROICalculations } from "@/lib/hooks/useROICalculations";
import { calculateRoiMetrics } from "@/lib/roi-metrics";
import { Node } from "@xyflow/react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ROISettingsPanelProps {
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

  nodes?: Node[]; // Add nodes for centralized ROI calculations
}

// Helper function for dynamic minute steps
const getMinuteStep = (currentMinutes: number): number => {
  if (currentMinutes < 1) return 0.1;
  if (currentMinutes < 10) return 0.5;
  return 1;
};

// Platform Pricing Comparison Component
const PlatformComparison = ({ 
  runsPerMonth, 
  stepsPerRun = 5, 
  currentPlatform 
}: { 
  runsPerMonth: number; 
  stepsPerRun?: number; 
  currentPlatform: PlatformType;
}) => {
  const platformData = useMemo(() => {
    const platforms = ['zapier', 'make', 'n8n'] as const;
    
    return platforms.map(platform => {
      const platformPricing = pricing[platform];
      const unitsPerMonth = platform === 'n8n' ? runsPerMonth : runsPerMonth * stepsPerRun;
      
      // Find the cheapest suitable tier
      let selectedTier = platformPricing.tiers[0];
      let totalCost = 0;
      
      for (const tier of platformPricing.tiers) {
        if (tier.quota === 0 || tier.quota >= unitsPerMonth) {
          selectedTier = tier;
          const result = platformPricing.cost(tier.name, unitsPerMonth);
          totalCost = result.cost;
          break;
        }
      }
      
      // Calculate unit cost
      const unitCost = unitsPerMonth > 0 ? totalCost / unitsPerMonth : 0;
      
      return {
        name: platformPricing.platform,
        tier: selectedTier.name,
        totalCost,
        unitCost,
        units: unitsPerMonth,
        unitType: platformPricing.unit,
        color: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6C2BD9' : '#EA4B71',
        isActive: platform === currentPlatform
      };
    });
  }, [runsPerMonth, stepsPerRun, currentPlatform]);

  const maxCost = Math.max(...platformData.map(p => p.totalCost));

  return (
    <div className="grid grid-cols-3 gap-3">
      {platformData.map((platform) => (
        <div 
          key={platform.name}
          className={cn(
            "relative p-4 rounded-lg border transition-all",
            platform.isActive 
              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span 
                className="font-semibold capitalize text-sm" 
                style={{ color: platform.color }}
              >
                {platform.name}
              </span>
              {platform.isActive && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">${platform.totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {platform.tier}
              </div>
              <div className="text-xs text-muted-foreground">
                {platform.units.toLocaleString()} {platform.unitType}s
              </div>
              <div className="text-xs text-muted-foreground">
                ${platform.unitCost.toFixed(4)}/{platform.unitType}
              </div>
            </div>
            
            <Progress 
              value={(platform.totalCost / maxCost) * 100} 
              className="h-2 bg-muted"
              style={{ 
                // @ts-expect-error CSS custom properties are not recognized by TypeScript but are valid CSS
                '--tw-bg-opacity': '1'
              }}
            >
              <div 
                className="h-full transition-all rounded-full"
                style={{ 
                  width: `${(platform.totalCost / maxCost) * 100}%`,
                  backgroundColor: platform.color
                }}
              />
            </Progress>
          </div>
        </div>
      ))}
    </div>
  );
};

export function ROISettingsPanel({
  open,
  onOpenChange,
  platform,
  runsPerMonth,
  setRunsPerMonth,
  minutesPerRun,
  setMinutesPerRun,
  hourlyRate,
  setHourlyRate,
  taskMultiplier,
  setTaskMultiplier,
  taskType,
  setTaskType,
  complianceEnabled,
  setComplianceEnabled,
  revenueEnabled,
  setRevenueEnabled,
  riskLevel,
  setRiskLevel,
  riskFrequency,
  setRiskFrequency,
  errorCost,
  setErrorCost,
  monthlyVolume,
  setMonthlyVolume,
  conversionRate,
  setConversionRate,
  valuePerConversion,
  setValuePerConversion,
  taskTypeMultipliers,
  benchmarks,
  updateScenarioROI,
  onGenerateReport,
  nodes = [],
}: ROISettingsPanelProps) {
  
  // Calculate steps per run based on actual workflow nodes
  const stepsPerRun = useMemo(() => {
    const workflowNodes = nodes.filter(n => 
      n.type && !['group', 'email', 'emailPreview'].includes(n.type) && 
      !['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(n.type)
    );
    return Math.max(1, workflowNodes.length); // At least 1 step
  }, [nodes]);

  // Keep hook available for per-node panels; main summary relies on centralized monthly calculator
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const roiCalculations = useROICalculations({
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    platform,
    nodes,
    complianceEnabled,
    riskLevel,
    riskFrequency,
    errorCost,
    revenueEnabled,
    monthlyVolume,
    conversionRate,
    valuePerConversion,
  });

  const renderROISummary = () => {
    const metrics = calculateRoiMetrics({
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
    }, nodes);

    return (
      <div className="space-y-6">
        {/* Primary Metrics - Enhanced Grid Layout for wider panel */}
        <div className="grid grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-4">
            <div className="relative z-10">
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Monthly Value</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                ${Math.round(metrics.totalValue).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {nodes.filter(n => ['trigger','action','decision'].includes(n.type || '')).length} steps
              </p>
            </div>
            <TrendingUp className="absolute bottom-1 right-1 h-5 w-5 text-green-600/20" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-4">
            <div className="relative z-10">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Net ROI</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                ${Math.round(metrics.netROI).toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {metrics.roiRatio.toFixed(1)}x ratio
              </p>
            </div>
            <DollarSign className="absolute bottom-1 right-1 h-5 w-5 text-blue-600/20" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-4">
            <div className="relative z-10">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Time Saved</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {metrics.timeSavedHours.toFixed(1)}h
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                per month
              </p>
            </div>
            <Clock className="absolute bottom-1 right-1 h-5 w-5 text-purple-600/20" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 p-4">
            <div className="relative z-10">
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Payback</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {metrics.paybackDays > 0 ? metrics.paybackDays.toFixed(0) : '0'}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                days
              </p>
            </div>
            <Calculator className="absolute bottom-1 right-1 h-5 w-5 text-orange-600/20" />
          </div>
        </div>

        {/* ROI Breakdown - Grid Layout */}
        <div className="space-y-4">
          {/* Value Drivers */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Value Drivers</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Time Saved</span>
                  <span className="text-xs font-medium">{metrics.timeSavedHours.toFixed(1)}h/mo</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">
                  +${Math.round(metrics.timeValue).toLocaleString()}
                </div>
              </div>
              
              {complianceEnabled && (
                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-muted-foreground">Risk Reduction</span>
                    <AlertTriangle className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                    +${Math.round(metrics.riskValue).toLocaleString()}
                  </div>
                </div>
              )}
              
              {revenueEnabled && (
                <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-muted-foreground">Revenue Uplift</span>
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-purple-700 dark:text-purple-400">
                    +${Math.round(metrics.revenueValue).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Costs</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <div className="text-xs text-muted-foreground">Platform</div>
                <div className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                  -${metrics.platformCost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{platform}</div>
              </div>
              
              {metrics.appCosts > 0 && (
                <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                  <div className="text-xs text-muted-foreground">App Costs</div>
                  <div className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-400">
                    -${metrics.appCosts.toFixed(2)}
                  </div>
                </div>
              )}
              
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border">
                <div className="text-xs text-muted-foreground">Total Costs</div>
                <div className="mt-1 text-sm font-bold text-red-600 dark:text-red-400">
                  ${metrics.totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">ROI Ratio</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {metrics.roiRatio.toFixed(1)}x
                  </div>
                </div>
                <Calculator className="h-8 w-8 text-primary/20" />
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-300 dark:border-amber-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Payback Period</div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {metrics.paybackDays > 0 ? metrics.paybackDays.toFixed(0) : '0'}
                    <span className="text-sm ml-1">days</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-amber-600/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleMinutesPerRunChange = (value: number) => {
    const newMinutes = Math.max(0.1, value);
    const formattedMinutes = parseFloat(newMinutes.toFixed(1));
    setMinutesPerRun(formattedMinutes);
    updateScenarioROI({ minutesPerRun: formattedMinutes });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[50%] min-w-[768px] overflow-y-auto p-0 bg-white dark:bg-gray-950 data-[state=open]:duration-500"
        style={{ maxWidth: 'none' }}
      >
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Advanced ROI Calculator
          </SheetTitle>
          <SheetDescription className="text-sm">
            Configure your automation metrics to see real-time ROI projections with task-specific factors
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {/* Platform Pricing Comparison - Simplified */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <h3 className="text-base font-semibold">Platform Cost Comparison</h3>
            </div>
            <PlatformComparison 
              runsPerMonth={runsPerMonth} 
              stepsPerRun={stepsPerRun}
              currentPlatform={platform}
            />
            <p className="text-xs text-muted-foreground">
              Based on {runsPerMonth} runs/month with ~{stepsPerRun} steps per workflow
            </p>
          </div>

          {/* Task Configuration - Compact Grid */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Task Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Task Type Selection */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="taskType" className="text-sm font-medium">Task Type</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px]">
                        <p>Select the type of task this automation performs. Each task type has different value multipliers based on business impact.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select 
                    value={taskType} 
                    onValueChange={(value) => {
                      setTaskType(value);
                      setTaskMultiplier(taskTypeMultipliers[value as keyof typeof taskTypeMultipliers]);
                      handleMinutesPerRunChange(benchmarks.minutes[value as keyof typeof benchmarks.minutes]);
                      setHourlyRate(benchmarks.hourlyRate[value as keyof typeof benchmarks.hourlyRate]);
                      updateScenarioROI({ 
                        taskType: value,
                        taskMultiplier: taskTypeMultipliers[value as keyof typeof taskTypeMultipliers],
                        minutesPerRun: parseFloat(benchmarks.minutes[value as keyof typeof benchmarks.minutes].toFixed(1)),
                        hourlyRate: benchmarks.hourlyRate[value as keyof typeof benchmarks.hourlyRate],
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm border shadow-lg">
                      <SelectItem value="general">General Automation</SelectItem>
                      <SelectItem value="admin">Administrative</SelectItem>
                      <SelectItem value="customer_support">Customer Support</SelectItem>
                      <SelectItem value="sales">Sales Enablement</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="compliance">Compliance/Legal</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="lead_gen">Lead Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Task Value Multiplier */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Task Value Multiplier</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={taskMultiplier * 33.33} className="flex-1 h-2 bg-muted [&>div]:bg-primary" />
                      <span className="text-sm font-bold text-primary w-8 text-right">{taskMultiplier}×</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Standard</span>
                      <span>Important</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics - Tiled Layout */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Core Metrics</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Runs per month tile */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Label htmlFor="runs" className="text-sm font-medium">
                      Runs per Month
                    </Label>
                    <Input
                      id="runs"
                      type="number"
                      min={0}
                      className="w-20 text-right tabular-nums h-8 text-sm"
                      value={runsPerMonth}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setRunsPerMonth(v);
                        updateScenarioROI({ runsPerMonth: v });
                      }}
                    />
                  </div>
                  <Slider
                    id="runs-slider"
                    min={0}
                    max={10000}
                    step={100}
                    value={[runsPerMonth]}
                    onValueChange={(values) => {
                      const v = values[0];
                      setRunsPerMonth(v);
                      updateScenarioROI({ runsPerMonth: v });
                    }}
                    className="py-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>10K</span>
                  </div>
                </div>
              </div>

              {/* Minutes saved tile */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Label htmlFor="minutes" className="text-sm font-medium">
                      Minutes Saved / Run
                    </Label>
                    <Input
                      id="minutes"
                      type="number"
                      min={0.1}
                      step={getMinuteStep(minutesPerRun)}
                      className="w-20 text-right tabular-nums h-8 text-sm"
                      value={minutesPerRun}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        handleMinutesPerRunChange(v);
                      }}
                    />
                  </div>
                  <Slider
                    id="minutes-slider"
                    min={0.1}
                    max={60}
                    step={getMinuteStep(minutesPerRun)}
                    value={[minutesPerRun]}
                    onValueChange={(values) => {
                      const v = values[0];
                      handleMinutesPerRunChange(v);
                    }}
                    className="py-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.1</span>
                    <span>60 min</span>
                  </div>
                </div>
              </div>

              {/* Hourly rate tile */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Label htmlFor="hourly" className="text-sm font-medium">
                      Labor Cost / hr
                    </Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-1">$</span>
                      <Input
                        id="hourly"
                        type="number"
                        min={0}
                        className="w-16 text-right tabular-nums h-8 text-sm"
                        value={hourlyRate}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setHourlyRate(v);
                          updateScenarioROI({ hourlyRate: v });
                        }}
                      />
                    </div>
                  </div>
                  <Slider
                    id="hourly-slider"
                    min={15}
                    max={100}
                    step={5}
                    value={[hourlyRate]}
                    onValueChange={(values) => {
                      const v = values[0];
                      setHourlyRate(v);
                      updateScenarioROI({ hourlyRate: v });
                    }}
                    className="py-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$15</span>
                    <span>$100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task-Specific Factors Section - NEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Task-Specific Optimization Factors
              </h3>
              <Badge variant="secondary" className="text-xs">
                {taskType ? taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General'}
              </Badge>
            </div>
            
            {/* Placeholder for future AI-generated factors */}
            <div className="p-4 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/20">
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Task-Specific Factors Coming Soon
                </p>
                <p className="text-xs text-muted-foreground">
                  AI-powered factors tailored to your {taskType || 'automation'} workflow
                </p>
                <Button variant="outline" size="sm" disabled className="mt-2">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Generate Factors
                </Button>
              </div>
            </div>

            {/* Placeholder grid for future factor cards */}
            <div className="hidden">
              <Accordion type="multiple" className="space-y-3">
                {/* Positive Factors */}
                <AccordionItem value="positive-factors" className="border rounded-lg bg-green-50/50 dark:bg-green-950/10">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Value Drivers (6)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Factor cards will go here */}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Negative Factors */}
                <AccordionItem value="negative-factors" className="border rounded-lg bg-red-50/50 dark:bg-red-950/10">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Cost & Risk Factors (4)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Factor cards will go here */}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Advanced Factors Accordion - Simplified */}
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
                      checked={complianceEnabled}
                      onCheckedChange={(checked) => {
                        setComplianceEnabled(checked);
                        updateScenarioROI({ complianceEnabled: checked });
                      }}
                    />
                    <AccordionTrigger className="border-0 p-0 hover:no-underline" />
                  </div>
                </div>
              </div>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* Risk Level */}
                  <div className="space-y-2">
                    <Label className="text-sm">Risk Level (1-5)</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[riskLevel]}
                        onValueChange={(values) => {
                          const v = values[0];
                          setRiskLevel(v);
                          updateScenarioROI({ riskLevel: v });
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-8 text-right">{riskLevel}</span>
                    </div>
                  </div>
                  
                  {/* Risk Frequency */}
                  <div className="space-y-2">
                    <Label className="text-sm">Error Frequency (%)</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[riskFrequency]}
                        onValueChange={(values) => {
                          const v = values[0];
                          setRiskFrequency(v);
                          updateScenarioROI({ riskFrequency: v });
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-right">{riskFrequency}%</span>
                    </div>
                  </div>
                  
                  {/* Error Cost */}
                  <div className="space-y-2">
                    <Label className="text-sm">Cost per Error ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-full"
                      value={errorCost}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setErrorCost(v);
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
                      checked={revenueEnabled}
                      onCheckedChange={(checked) => {
                        setRevenueEnabled(checked);
                        updateScenarioROI({ revenueEnabled: checked });
                      }}
                    />
                    <AccordionTrigger className="border-0 p-0 hover:no-underline" />
                  </div>
                </div>
              </div>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* Monthly Volume */}
                  <div className="space-y-2">
                    <Label className="text-sm">Monthly Volume</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-full"
                      value={monthlyVolume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMonthlyVolume(v);
                        updateScenarioROI({ monthlyVolume: v });
                      }}
                    />
                  </div>
                  
                  {/* Conversion Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm">Conversion Rate (%)</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={0}
                        max={20}
                        step={0.5}
                        value={[conversionRate]}
                        onValueChange={(values) => {
                          const v = values[0];
                          setConversionRate(v);
                          updateScenarioROI({ conversionRate: v });
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-right">{conversionRate}%</span>
                    </div>
                  </div>
                  
                  {/* Value per Conversion */}
                  <div className="space-y-2">
                    <Label className="text-sm">Value per Conversion ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-full"
                      value={valuePerConversion}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setValuePerConversion(v);
                        updateScenarioROI({ valuePerConversion: v });
                      }}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ROI Summary - Simplified */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h3 className="text-base font-semibold mb-4">ROI Summary</h3>
            {renderROISummary()}
          </div>
        </div>
        
        {/* Footer with Generate Report button */}
        <SheetFooter className="p-6 pt-0 border-t">
          <Button
            onClick={() => onGenerateReport?.()}
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