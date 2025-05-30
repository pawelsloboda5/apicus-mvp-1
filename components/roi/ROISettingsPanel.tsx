"use client";

import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, TrendingUp, DollarSign, Calculator, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { pricing } from "@/app/api/data/pricing";
import type { Scenario } from "@/lib/db";
import { PlatformType } from "@/lib/types";
import {
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculatePlatformCost,
  calculateTotalValue,
  calculateNetROI,
  calculateROIRatio,
  formatROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod
} from "@/lib/roi-utils";
import { Progress } from "@/components/ui/progress";
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
    <div className="space-y-3">
      {platformData.map((platform) => (
        <div 
          key={platform.name}
          className={cn(
            "relative p-3 rounded-lg border transition-all",
            platform.isActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="font-semibold capitalize" 
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
              <div className="text-xs text-muted-foreground">
                {platform.tier} • {platform.units.toLocaleString()} {platform.unitType}s/mo
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${platform.totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                ${platform.unitCost.toFixed(4)}/{platform.unitType}
              </div>
            </div>
          </div>
          
          <Progress 
            value={(platform.totalCost / maxCost) * 100} 
            className="h-1.5"
            style={{ 
              // @ts-expect-error CSS custom properties are not recognized by TypeScript but are valid CSS
              '--progress-background': platform.color
             
            }}
          />
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
}: ROISettingsPanelProps) {
  
  const [stepsPerRun] = useState(5); // Average steps per workflow

  const renderROISummary = () => {
    const timeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
    const riskValue = calculateRiskValue(complianceEnabled, runsPerMonth, riskFrequency, errorCost, riskLevel);
    const revenueValue = calculateRevenueValue(revenueEnabled, monthlyVolume, conversionRate, valuePerConversion);
    const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
    const platformCostVal = calculatePlatformCost(platform, runsPerMonth, pricing);
    const netROIValue = calculateNetROI(totalValue, platformCostVal);
    const roiRatioValue = calculateROIRatio(totalValue, platformCostVal);
    const paybackDays = calculatePaybackPeriod(platformCostVal, netROIValue);

    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Value</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalValue.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 opacity-20" />
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net ROI</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${netROIValue.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-20" />
            </div>
          </div>
        </div>

        {/* ROI Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Time saved monthly</span>
            <span className="font-medium">{(runsPerMonth * minutesPerRun / 60).toFixed(1)} hours</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Time value</span>
            <span className="font-medium text-green-600 dark:text-green-400">+${timeValue.toFixed(0)}</span>
          </div>
          
          {complianceEnabled && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Risk reduction</span>
              <span className="font-medium text-green-600 dark:text-green-400">+${riskValue.toFixed(0)}</span>
            </div>
          )}
          
          {revenueEnabled && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Revenue uplift</span>
              <span className="font-medium text-green-600 dark:text-green-400">+${revenueValue.toFixed(0)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Platform cost</span>
            <span className="font-medium text-red-600 dark:text-red-400">-${platformCostVal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 font-medium">
            <span>ROI Ratio</span>
            <span className="text-lg">{formatROIRatio(roiRatioValue)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Payback period</span>
            <span className="font-medium">{formatPaybackPeriod(paybackDays)}</span>
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
      <SheetContent side="right" className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            ROI Calculator
          </SheetTitle>
          <SheetDescription>
            Configure your automation metrics to see real-time ROI projections
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

          {/* Task Configuration - Simplified */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Task Configuration</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="taskType" className="font-medium">Task Type</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
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
            
            <div className="space-y-2">
              <Label className="text-sm">Task Value Multiplier</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={taskMultiplier * 33.33} className="h-2" />
                </div>
                <span className="text-sm font-medium w-10 text-right">{taskMultiplier}×</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Standard</span>
                <span>Important</span>
                <span>Critical</span>
              </div>
            </div>
          </div>

          {/* Core Metrics - Simplified */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold">Core Metrics</h3>
            
            {/* Runs per month */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="runs" className="font-medium">Runs per Month</Label>
                <Input
                  id="runs"
                  type="number"
                  min={0}
                  className="w-24 text-right tabular-nums h-9"
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
                className="py-2"
              />
            </div>

            {/* Minutes saved */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="minutes" className="font-medium">Minutes Saved / Run</Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0.1}
                  step={getMinuteStep(minutesPerRun)}
                  className="w-24 text-right tabular-nums h-9"
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
                className="py-2"
              />
            </div>

            {/* Hourly rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="hourly" className="font-medium">Labor Costs Per hr ($)</Label>
                <Input
                  id="hourly"
                  type="number"
                  min={0}
                  className="w-24 text-right tabular-nums h-9"
                  value={hourlyRate}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setHourlyRate(v);
                    updateScenarioROI({ hourlyRate: v });
                  }}
                />
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
                className="py-2"
              />
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
      </SheetContent>
    </Sheet>
  );
}