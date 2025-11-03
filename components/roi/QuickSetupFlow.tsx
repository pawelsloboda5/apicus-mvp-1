/**
 * Quick Setup Flow - Simplified ROI Configuration
 * 
 * This component provides a streamlined interface for quickly configuring
 * ROI settings without overwhelming users with advanced options.
 * 
 * Features:
 * - Step-by-step wizard approach
 * - Smart defaults based on task type
 * - Real-time ROI preview
 * - Progressive disclosure of complexity
 * - AI factor generation promotion
 */

"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatNumberMax2 } from '@/lib/utils';
import type { PlatformType } from '@/lib/types';

interface QuickSetupFlowProps {
  // Task configuration
  taskType: string;
  onTaskTypeChange: (type: string) => void;
  
  // Core metrics
  runsPerMonth: number;
  onRunsChange: (runs: number) => void;
  
  minutesPerRun: number;
  onMinutesChange: (minutes: number) => void;
  
  hourlyRate: number;
  onHourlyRateChange: (rate: number) => void;
  
  // Platform
  platform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
  
  // ROI preview data
  roiPreview: {
    monthlyValue: number;
    netROI: number;
    timeSaved: number;
    paybackDays: number;
  };
  
  // AI factors
  onGenerateFactors: () => void;
  isGeneratingFactors: boolean;
  
  // Navigation
  onSwitchToAdvanced: () => void;
}

const taskTypes = [
  { value: 'internal_admin', label: 'Internal Admin', description: 'Documentation, filing, basic tasks', multiplier: 1.0 },
  { value: 'client_communication', label: 'Client Communication', description: 'Emails, scheduling, follow-ups', multiplier: 1.2 },
  { value: 'data_cleaning', label: 'Data Cleaning', description: 'Data entry, validation, cleanup', multiplier: 1.2 },
  { value: 'lead_scoring', label: 'Lead Scoring', description: 'CRM updates, qualification', multiplier: 1.8 },
  { value: 'sales_enablement', label: 'Sales Enablement', description: 'Pipeline management, proposals', multiplier: 2.0 },
];

const platforms: { value: PlatformType; label: string; color: string; description: string }[] = [
  { value: 'zapier', label: 'Zapier', color: '#FF4A00', description: 'Most popular, easy to use' },
  { value: 'make', label: 'Make', color: '#6C2BD9', description: 'Visual, powerful features' },
  { value: 'n8n', label: 'n8n', color: '#EA4B71', description: 'Open source, flexible' },
];

export function QuickSetupFlow({
  taskType,
  onTaskTypeChange,
  runsPerMonth,
  onRunsChange,
  minutesPerRun,
  onMinutesChange,
  hourlyRate,
  onHourlyRateChange,
  platform,
  onPlatformChange,
  roiPreview,
  onGenerateFactors,
  isGeneratingFactors,
  onSwitchToAdvanced,
}: QuickSetupFlowProps) {
  const selectedTaskType = taskTypes.find(t => t.value === taskType);
  // selectedPlatform no longer needed; platform is rendered directly where needed

  return (
    <div className="space-y-6">
      {/* Header with mode switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick Setup</h3>
          <p className="text-sm text-muted-foreground">
            Get started in 3 simple steps
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onSwitchToAdvanced}
          className="text-primary"
        >
          Switch to Advanced
        </Button>
      </div>

      {/* Step 1: Task Type Selection */}
      <Card className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">What type of task are you automating?</h4>
            <p className="text-xs text-muted-foreground">
              This helps us suggest realistic values
            </p>
          </div>
        </div>

        <Select value={taskType} onValueChange={onTaskTypeChange}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select a task type" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm">
            {taskTypes.map(type => (
              <SelectItem 
                key={type.value} 
                value={type.value}
                className="py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {type.multiplier}× value
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTaskType && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {selectedTaskType.label} selected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Value multiplier: <strong>{selectedTaskType.multiplier}×</strong> - 
                  This task type is {
                    selectedTaskType.multiplier >= 2 ? 'highly valuable' :
                    selectedTaskType.multiplier >= 1.5 ? 'valuable' :
                    'standard'
                  } for business impact
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Step 2: Volume & Time */}
      <Card className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">How often will this run?</h4>
            <p className="text-xs text-muted-foreground">
              Adjust the frequency and time saved per run
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Runs per month */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Runs per Month</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base font-bold px-3">
                  {runsPerMonth.toLocaleString()}
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      How many times will this automation run each month?
                      <br /><br />
                      <strong>Examples:</strong>
                      <br />• Daily task: ~30 runs
                      <br />• Per-lead: 100-1000 runs
                      <br />• Per-transaction: 500-5000 runs
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Slider
              min={10}
              max={5000}
              step={10}
              value={[runsPerMonth]}
              onValueChange={([value]) => onRunsChange(value)}
              className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10/month (occasional)</span>
              <span>5,000/month (high volume)</span>
            </div>
          </div>

          {/* Minutes per run */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Minutes Saved per Run</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base font-bold px-3">
                  {minutesPerRun} min
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      How many minutes does this automation save each time it runs?
                      <br /><br />
                      <strong>Tips:</strong>
                      <br />• Include time to switch contexts
                      <br />• Count manual steps eliminated
                      <br />• Don&apos;t count waiting/idle time
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Slider
              min={0.5}
              max={60}
              step={0.5}
              value={[minutesPerRun]}
              onValueChange={([value]) => onMinutesChange(value)}
              className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30 seconds</span>
              <span>1 hour</span>
            </div>
          </div>

          {/* Hourly rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Labor Cost / hr</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base font-bold px-3">
                  ${hourlyRate}
                </Badge>
              </div>
            </div>
            <Slider
              min={10}
              max={300}
              step={1}
              value={[hourlyRate]}
              onValueChange={([value]) => onHourlyRateChange(value)}
              className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$10/hr</span>
              <span>$300/hr</span>
            </div>
          </div>

          {/* Real-time calculation preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                Time Saved Monthly
              </div>
              <div className="text-lg font-bold text-success">
                {formatNumberMax2((runsPerMonth * minutesPerRun) / 60)}h
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                Time Value
              </div>
              <div className="text-lg font-bold text-primary">
                ${Math.round((runsPerMonth * minutesPerRun * hourlyRate) / 60).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 3: Platform */}
      <Card className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            3
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Which platform will you use?</h4>
            <p className="text-xs text-muted-foreground">
              Compare costs across automation platforms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {platforms.map((p) => (
            <button
              key={p.value}
              onClick={() => onPlatformChange(p.value)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                "hover:border-primary/50 hover:shadow-md",
                platform === p.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span 
                    className="font-semibold text-base"
                    style={{ color: p.color }}
                  >
                    {p.label}
                  </span>
                  {platform === p.value && (
                    <Badge className="text-xs">Selected</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.description}
                </p>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">Est. cost</div>
                  <div className="text-lg font-bold">
                    $--/mo
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* AI Factors Promotion - Prominent CTA */}
      <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-semibold text-lg">
                Get AI-Powered ROI Factors
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Generate intelligent, task-specific optimization factors tailored to your 
                <strong> {selectedTaskType?.label || 'workflow'}</strong>.
                These factors can increase your ROI projection by 20-40%.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onGenerateFactors}
                disabled={isGeneratingFactors}
                size="lg"
                className="bg-secondary hover:bg-secondary/90"
              >
                {isGeneratingFactors ? (
                  <>
                    <div className="h-4 w-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Factors
                  </>
                )}
              </Button>
              <div className="text-xs text-muted-foreground">
                Takes 5-10 seconds
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ROI Summary - Condensed */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              ROI Summary
            </h4>
            <Badge variant="outline" className="text-sm">
              Real-time preview
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background border">
              <div className="text-xs text-muted-foreground mb-1">
                Monthly Value
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${roiPreview.monthlyValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total automation value
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="text-xs text-muted-foreground mb-1">
                Net ROI
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${roiPreview.netROI.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                After platform costs
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="text-xs text-muted-foreground mb-1">
                Time Saved
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumberMax2(roiPreview.timeSaved)}h
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Per month
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="text-xs text-muted-foreground mb-1">
                Payback Period
              </div>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {roiPreview.paybackDays > 0 ? `${formatNumberMax2(roiPreview.paybackDays)}d` : 'Immediate'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Break-even time
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Tip:</strong> Generate AI factors above to uncover 20-40% more ROI potential
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
