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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pricing } from "@/app/api/data/pricing";
import type { Scenario } from "@/lib/db";
import { PlatformType, ROISettings } from "@/lib/types";
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
    const platformCost = calculatePlatformCost(platform, runsPerMonth, pricing);
    const netROI = calculateNetROI(totalValue, platformCost);
    const roiRatio = calculateROIRatio(totalValue, platformCost);
    const paybackDays = calculatePaybackPeriod(pricing[platform].tiers[0].monthlyUSD, netROI);

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
          ${platformCost.toFixed(2)}
        </div>
        
        <div className="text-muted-foreground font-medium">Net ROI:</div>
        <div className="font-medium">
          ${netROI.toFixed(0)}
        </div>
        
        <div className="text-muted-foreground">ROI Ratio:</div>
        <div className="font-medium">
          {formatROIRatio(roiRatio)}
        </div>
        
        <div className="text-muted-foreground">Payback period:</div>
        <div className="font-medium">
          {formatPaybackPeriod(paybackDays)}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ROI Settings</SheetTitle>
          <SheetDescription>
            Adjust workload and labor assumptions to see live ROI.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Task Type Selector */}
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
                // Auto-update minutes and hourly rate based on benchmarks
                setMinutesPerRun(benchmarks.minutes[value as keyof typeof benchmarks.minutes]);
                setHourlyRate(benchmarks.hourlyRate[value as keyof typeof benchmarks.hourlyRate]);
                updateScenarioROI({ 
                  taskMultiplier: taskTypeMultipliers[value as keyof typeof taskTypeMultipliers],
                  minutesPerRun: benchmarks.minutes[value as keyof typeof benchmarks.minutes],
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
            <div className="text-xs text-muted-foreground">
              Value multiplier: {taskMultiplier}× (calculated from task type)
            </div>
          </div>

          <Separator />

          {/* Time Savings Section */}
          <div>
            <h3 className="text-sm font-medium mb-4">Time Savings</h3>

            {/* Runs per month */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <Label htmlFor="runs" className="font-medium">Runs per Month</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="runs"
                    type="number"
                    min={0}
                    className="w-20"
                    value={runsPerMonth}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRunsPerMonth(v);
                      updateScenarioROI({ runsPerMonth: v });
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>How many times this automation runs each month. More runs = more time saved.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <span>Medium ({benchmarks.runs.medium})</span>
                <span>High ({benchmarks.runs.high})</span>
              </div>
            </div>

            {/* Minutes saved */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="minutes" className="font-medium">Minutes Saved per Run</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="minutes"
                    type="number"
                    min={0}
                    className="w-20"
                    value={minutesPerRun}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMinutesPerRun(v);
                      updateScenarioROI({ minutesPerRun: v });
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>Average time in minutes saved by automating this task once.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Slider
                id="minutes-slider"
                min={0}
                max={30}
                step={0.5}
                value={[minutesPerRun]}
                onValueChange={(values) => {
                  const v = values[0];
                  setMinutesPerRun(v);
                  updateScenarioROI({ minutesPerRun: v });
                }}
              />
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>Quick (1-3 min)</span>
                  <span>Average (5-10 min)</span>
                  <span>Complex (15+ min)</span>
                </div>
                <div>
                  Benchmark for {taskType.replace('_', ' ')}: ~{benchmarks.minutes[taskType as keyof typeof benchmarks.minutes]} min
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Labor Value Section */}
          <div>
            <h3 className="text-sm font-medium mb-4">Labor Value</h3>

            {/* Hourly rate */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <Label htmlFor="hourly" className="font-medium">Hourly Wage ($)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hourly"
                    type="number"
                    min={0}
                    className="w-20"
                    value={hourlyRate}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setHourlyRate(v);
                      updateScenarioROI({ hourlyRate: v });
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>Average hourly cost of the person who would otherwise perform this task manually.</p>
                    </TooltipContent>
                  </Tooltip>
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
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Entry ($15-25)</span>
                <span>Mid ($30-50)</span>
                <span>Senior ($60+)</span>
              </div>
            </div>

            {/* Task multiplier - advanced, shown as disabled slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="mult" className="font-medium">Task Value Multiplier (V*)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{taskMultiplier.toFixed(1)}×</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      <p>Multiplier based on task type and business impact. Higher for revenue-generating or complex tasks.</p>
                      <p className="mt-1">Set automatically based on task type selection.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Standard (1-1.5×)</span>
                <span>Important (1.6-2×)</span>
                <span>Critical (2.1-3×)</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Value Factors (Advanced) */}
          <div>
            <h3 className="text-sm font-medium mb-2">Additional Value Factors</h3>
            <p className="text-xs text-muted-foreground mb-4">These factors can dramatically increase ROI beyond time savings.</p>

            {/* Risk/Compliance Value */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compliance" className="font-medium">Risk/Compliance Value</Label>
                  <p className="text-xs text-muted-foreground">Reduces error rates or regulatory risk</p>
                </div>
                <Switch 
                  id="compliance" 
                  checked={complianceEnabled}
                  onCheckedChange={setComplianceEnabled}
                />
              </div>
              
              {complianceEnabled && (
                <div className="space-y-4 pl-2 border-l-2 border-primary/20 mt-2">
                  {/* Risk Level (1-5) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="risk-level" className="text-sm">Risk Level (1-5)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{riskLevel}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Rate the severity of the risk being mitigated:</p>
                            <p>1 = Minor inconvenience</p>
                            <p>3 = Significant operational impact</p>
                            <p>5 = Major compliance violation or business risk</p>
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
                      onValueChange={(values) => setRiskLevel(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  {/* Risk Frequency (per 100 runs) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="risk-freq" className="text-sm">Error Frequency (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="risk-freq"
                          type="number"
                          min={0}
                          max={100}
                          className="w-16"
                          value={riskFrequency}
                          onChange={(e) => setRiskFrequency(Number(e.target.value))}
                        />
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>How often errors occur without automation (percentage of runs)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="risk-freq-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[riskFrequency]}
                      onValueChange={(values) => setRiskFrequency(values[0])}
                    />
                  </div>
                  
                  {/* Error Cost Estimate */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="error-cost" className="text-sm">Cost per Error ($)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="error-cost"
                          type="number"
                          min={0}
                          className="w-20"
                          value={errorCost}
                          onChange={(e) => setErrorCost(Number(e.target.value))}
                        />
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Estimated financial impact of each error (direct costs, rework, reputation damage, etc.)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="error-cost-slider"
                      min={0}
                      max={2000}
                      step={100}
                      value={[errorCost]}
                      onValueChange={(values) => setErrorCost(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minor ($100)</span>
                      <span>Moderate ($500)</span>
                      <span>Severe ($1000+)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Uplift */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="revenue" className="font-medium">Revenue Uplift</Label>
                  <p className="text-xs text-muted-foreground">Generates leads or increases sales</p>
                </div>
                <Switch 
                  id="revenue" 
                  checked={revenueEnabled}
                  onCheckedChange={setRevenueEnabled}
                />
              </div>
              
              {revenueEnabled && (
                <div className="space-y-4 pl-2 border-l-2 border-primary/20 mt-2">
                  {/* Monthly Volume */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="monthly-volume" className="text-sm">Monthly Volume</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="monthly-volume"
                          type="number"
                          min={0}
                          className="w-20"
                          value={monthlyVolume}
                          onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                        />
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Number of opportunities, leads, or potential conversions this automation generates monthly</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="volume-slider"
                      min={0}
                      max={500}
                      step={10}
                      value={[monthlyVolume]}
                      onValueChange={(values) => setMonthlyVolume(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (10-50)</span>
                      <span>Medium (100-200)</span>
                      <span>High (300+)</span>
                    </div>
                  </div>
                  
                  {/* Conversion Rate */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="conversion-rate" className="text-sm">Conversion Rate (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="conversion-rate"
                          type="number"
                          min={0}
                          max={100}
                          className="w-16"
                          value={conversionRate}
                          onChange={(e) => setConversionRate(Number(e.target.value))}
                        />
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Percentage of leads/opportunities that convert to actual revenue</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="conversion-slider"
                      min={0}
                      max={20}
                      step={0.5}
                      value={[conversionRate]}
                      onValueChange={(values) => setConversionRate(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (1-2%)</span>
                      <span>Average (5-7%)</span>
                      <span>High (10%+)</span>
                    </div>
                  </div>
                  
                  {/* Value per Conversion */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="value-per" className="text-sm">Value per Conversion ($)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="value-per"
                          type="number"
                          min={0}
                          className="w-20"
                          value={valuePerConversion}
                          onChange={(e) => setValuePerConversion(Number(e.target.value))}
                        />
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p>Average revenue value of each successful conversion</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      id="value-slider"
                      min={0}
                      max={1000}
                      step={50}
                      value={[valuePerConversion]}
                      onValueChange={(values) => setValuePerConversion(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low ($50)</span>
                      <span>Medium ($200)</span>
                      <span>High ($500+)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ROI Summary */}
          <div className="space-y-2 rounded-md bg-muted/30 p-3 border">
            <h3 className="text-sm font-medium">ROI Summary</h3>
            
            {renderROISummary()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 