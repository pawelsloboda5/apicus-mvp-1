"use client";

import React from "react";
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
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const renderROISummary = () => {
    const timeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
    const riskValue = calculateRiskValue(complianceEnabled, runsPerMonth, riskFrequency, errorCost, riskLevel);
    const revenueValue = calculateRevenueValue(revenueEnabled, monthlyVolume, conversionRate, valuePerConversion);
    const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
    const platformCostVal = calculatePlatformCost(platform, runsPerMonth, pricing); // Renamed to avoid conflict
    const netROIValue = calculateNetROI(totalValue, platformCostVal); // Renamed
    const roiRatioValue = calculateROIRatio(totalValue, platformCostVal); // Renamed
    const paybackDays = calculatePaybackPeriod(pricing[platform].tiers[0].monthlyUSD, netROIValue);

    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">Hours saved monthly:</div>
        <div className="font-medium">{(runsPerMonth * minutesPerRun / 60).toFixed(1)} hours</div>
        
        <div className="text-muted-foreground">Time value:</div>
        <div className="font-medium text-green-600 dark:text-green-400">
          ${timeValue.toFixed(0)}
        </div>
        
        {complianceEnabled && (
          <>
            <div className="text-muted-foreground">Risk reduction value:</div>
            <div className="font-medium text-green-600 dark:text-green-400">
              ${riskValue.toFixed(0)}
            </div>
          </>
        )}
        
        {revenueEnabled && (
          <>
            <div className="text-muted-foreground">Revenue uplift:</div>
            <div className="font-medium text-green-600 dark:text-green-400">
              ${revenueValue.toFixed(0)}
            </div>
          </>
        )}
        
        <div className="text-muted-foreground font-medium">Total value:</div>
        <div className="font-medium text-green-600 dark:text-green-400">
          ${totalValue.toFixed(0)}
        </div>
        
        <div className="text-muted-foreground">Platform cost:</div>
        <div className="font-medium text-red-600 dark:text-red-400">
          ${platformCostVal.toFixed(2)}
        </div>
        
        <div className="text-muted-foreground font-medium">Net ROI:</div>
        <div className="font-medium">
          ${netROIValue.toFixed(0)}
        </div>
        
        <div className="text-muted-foreground">ROI Ratio:</div>
        <div className="font-medium">
          {formatROIRatio(roiRatioValue)}
        </div>
        
        <div className="text-muted-foreground">Payback period:</div>
        <div className="font-medium">
          {formatPaybackPeriod(paybackDays)}
        </div>
      </div>
    );
  };

  const handleMinutesPerRunChange = (value: number) => {
    const newMinutes = Math.max(0.1, value); // Ensure minimum of 0.1
    const formattedMinutes = parseFloat(newMinutes.toFixed(1));
    setMinutesPerRun(formattedMinutes);
    updateScenarioROI({ minutesPerRun: formattedMinutes });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>ROI Settings</SheetTitle>
          <SheetDescription>
            Adjust workload and labor assumptions to see live ROI.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-6">
          {/* Task Type Selector Card */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                    taskType: value, // also save taskType to scenario
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
              <div className="text-xs text-muted-foreground pt-2"> 
                Value multiplier: <span className="font-semibold">{taskMultiplier.toFixed(1)}×</span> (from task type)
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="mult" className="font-medium">Task Value Multiplier (V*)</Label>
                <div className="flex items-center gap-2">
                   <Tooltip>
                    <TooltipTrigger asChild>
                       <Slider
                        id="mult-slider"
                        min={1}
                        max={3}
                        step={0.1}
                        disabled 
                        value={[taskMultiplier]}
                        onValueChange={(values) => {
                          const v = values[0];
                          setTaskMultiplier(v);
                          updateScenarioROI({ taskMultiplier: v });
                        }}
                      />
                    </TooltipTrigger>
                     <TooltipContent className="max-w-[280px]">
                      <p>Multiplier based on task type and business impact. Higher for revenue-generating or complex tasks.</p>
                      <p className="mt-1">Set automatically based on task type selection.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Standard (1-1.5×)</span>
                  <span>Important (1.6-2×)</span>
                  <span>Critical (2.1-3×)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Core Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Runs per month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="runs" className="font-medium">Runs per Month</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        id="runs"
                        type="number"
                        min={0}
                        className="w-24 text-right tabular-nums"
                        value={runsPerMonth}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setRunsPerMonth(v);
                          updateScenarioROI({ runsPerMonth: v });
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>How many times this automation runs each month. More runs = more time saved.</p>
                    </TooltipContent>
                  </Tooltip>
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
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low ({benchmarks.runs.low})</span>
                  <span>Med ({benchmarks.runs.medium})</span>
                  <span>High ({benchmarks.runs.high})</span>
                </div>
              </div>

              {/* Minutes saved */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="minutes" className="font-medium">Minutes Saved / Run</Label>
                  <Tooltip>
                     <TooltipTrigger asChild>
                      <Input
                        id="minutes"
                        type="number"
                        min={0.1}
                        step={getMinuteStep(minutesPerRun)}
                        className="w-24 text-right tabular-nums"
                        value={minutesPerRun}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          handleMinutesPerRunChange(v);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>Average time in minutes saved by automating this task once.</p>
                    </TooltipContent>
                  </Tooltip>
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
                />
                <div className="text-xs text-muted-foreground">
                  <div className="flex justify-between mb-1">
                    <span>Quick (0.1-3 min)</span>
                    <span>Avg (3-10 min)</span>
                    <span>Complex (10+ min)</span>
                  </div>
                  <div>
                    Benchmark for {taskType.replace('_', ' ')}: 
                    { (benchmarks.minutes[taskType as keyof typeof benchmarks.minutes] % 1 === 0) ?
                       benchmarks.minutes[taskType as keyof typeof benchmarks.minutes] :
                       benchmarks.minutes[taskType as keyof typeof benchmarks.minutes].toFixed(1)
                    } min
                  </div>
                </div>
              </div>

              {/* Hourly rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="hourly" className="font-medium">Hourly Wage ($)</Label>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        id="hourly"
                        type="number"
                        min={0}
                        className="w-24 text-right tabular-nums"
                        value={hourlyRate}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setHourlyRate(v);
                          updateScenarioROI({ hourlyRate: v });
                        }}
                      />
                    </TooltipTrigger>
                     <TooltipContent className="max-w-[280px]">
                      <p>Average hourly cost of the person who would otherwise perform this task manually.</p>
                    </TooltipContent>
                  </Tooltip>
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
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Entry ($15-25)</span>
                  <span>Mid ($30-50)</span>
                  <span>Senior ($60+)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Factors Accordion */}
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="risk-compliance">
              <div className="border rounded-lg">
                <div className="flex items-center justify-between p-4">
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
                    <AccordionTrigger className="border-0 p-0 hover:no-underline">
                      {/* Remove the div content from here since it's now outside */}
                    </AccordionTrigger>
                  </div>
                </div>
                <AccordionContent className="pt-0 px-4 pb-4 space-y-6">
                  {/* Risk Level (1-5) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="risk-level" className="text-sm">Risk Level (1-5)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">{riskLevel}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Rate the severity of the risk being mitigated:</p>
                            <ul className="list-disc pl-4 mt-1">
                              <li>1 = Minor inconvenience</li>
                              <li>3 = Sig. operational impact</li>
                              <li>5 = Major compliance/business risk</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="risk-level-slider"
                      min={1}
                      max={5}
                      step={1}
                      value={[riskLevel]}
                      onValueChange={(values) => {
                        const v = values[0];
                        setRiskLevel(v);
                        updateScenarioROI({ riskLevel: v });
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  {/* Risk Frequency (%) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="risk-freq" className="text-sm">Error Frequency (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="risk-freq"
                            type="number"
                            min={0}
                            max={100}
                            className="w-20 text-right tabular-nums"
                            value={riskFrequency}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setRiskFrequency(v);
                              updateScenarioROI({ riskFrequency: v });
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px]">
                          <p>How often errors occur without automation (percentage of runs).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      id="risk-freq-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[riskFrequency]}
                      onValueChange={(values) => {
                          const v = values[0];
                          setRiskFrequency(v);
                          updateScenarioROI({ riskFrequency: v });
                      }}
                    />
                  </div>
                  
                  {/* Error Cost Estimate */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="error-cost" className="text-sm">Cost per Error ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="error-cost"
                            type="number"
                            min={0}
                            className="w-24 text-right tabular-nums"
                            value={errorCost}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setErrorCost(v);
                              updateScenarioROI({ errorCost: v });
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px]">
                          <p>Estimated financial impact of each error (direct costs, rework, reputation damage, etc.)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      id="error-cost-slider"
                      min={0}
                      max={2000}
                      step={100}
                      value={[errorCost]}
                      onValueChange={(values) => {
                          const v = values[0];
                          setErrorCost(v);
                          updateScenarioROI({ errorCost: v });
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minor ($100)</span>
                      <span>Mod ($500)</span>
                      <span>Severe ($1k+)</span>
                    </div>
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>

            <AccordionItem value="revenue-uplift">
              <div className="border rounded-lg">
                <div className="flex items-center justify-between p-4">
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
                    <AccordionTrigger className="border-0 p-0 hover:no-underline">
                      {/* Remove the div content from here since it's now outside */}
                    </AccordionTrigger>
                  </div>
                </div>
                <AccordionContent className="pt-0 px-4 pb-4 space-y-6">
                  {/* Monthly Volume */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="monthly-volume" className="text-sm">Monthly Volume</Label>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Input
                                id="monthly-volume"
                                type="number"
                                min={0}
                                className="w-24 text-right tabular-nums"
                                value={monthlyVolume}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setMonthlyVolume(v);
                                  updateScenarioROI({ monthlyVolume: v });
                                }}
                              />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                              <p>Number of opportunities, leads, or potential conversions this automation generates monthly.</p>
                          </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      id="volume-slider"
                      min={0}
                      max={500}
                      step={10}
                      value={[monthlyVolume]}
                      onValueChange={(values) => {
                          const v = values[0];
                          setMonthlyVolume(v);
                          updateScenarioROI({ monthlyVolume: v });
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (10-50)</span>
                      <span>Med (100-200)</span>
                      <span>High (300+)</span>
                    </div>
                  </div>
                  
                  {/* Conversion Rate */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="conversion-rate" className="text-sm">Conversion Rate (%)</Label>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Input
                                id="conversion-rate"
                                type="number"
                                min={0}
                                max={100}
                                className="w-20 text-right tabular-nums"
                                value={conversionRate}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setConversionRate(v);
                                  updateScenarioROI({ conversionRate: v });
                                }}
                              />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                              <p>Percentage of leads/opportunities that convert to actual revenue.</p>
                          </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      id="conversion-slider"
                      min={0}
                      max={20} // Max 20% seems reasonable for a slider
                      step={0.5}
                      value={[conversionRate]}
                      onValueChange={(values) => {
                          const v = values[0];
                          setConversionRate(v);
                          updateScenarioROI({ conversionRate: v });
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (1-2%)</span>
                      <span>Avg (5-7%)</span>
                      <span>High (10%+)</span>
                    </div>
                  </div>
                  
                  {/* Value per Conversion */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="value-per" className="text-sm">Value per Conversion ($)</Label>
                       <Tooltip>
                          <TooltipTrigger asChild>
                              <Input
                                id="value-per"
                                type="number"
                                min={0}
                                className="w-24 text-right tabular-nums"
                                value={valuePerConversion}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setValuePerConversion(v);
                                  updateScenarioROI({ valuePerConversion: v });
                                }}
                              />
                          </TooltipTrigger>
                           <TooltipContent className="max-w-[280px]">
                              <p>Average revenue value of each successful conversion.</p>
                          </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      id="value-slider"
                      min={0}
                      max={1000}
                      step={50}
                      value={[valuePerConversion]}
                      onValueChange={(values) => {
                          const v = values[0];
                          setValuePerConversion(v);
                          updateScenarioROI({ valuePerConversion: v });
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low ($50)</span>
                      <span>Med ($200)</span>
                      <span>High ($500+)</span>
                    </div>
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          </Accordion>

          {/* ROI Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {renderROISummary()}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}