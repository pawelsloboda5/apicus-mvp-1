"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Clock, Zap, MinusIcon, PlusIcon, ShieldCheck, Percent, Mail } from "lucide-react";
import { pricing } from "@/app/api/data/pricing";
import { StatsBarProps } from "@/lib/types";
import { 
  calculateTimeValue, 
  calculatePlatformCost,
  formatROIRatio
} from "@/lib/roi-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Helper function for dynamic minute steps
const getMinuteStep = (currentMinutes: number): number => {
  if (currentMinutes < 1) return 0.1;
  if (currentMinutes < 10) return 0.5;
  return 1;
};

export function StatsBar({
  platform,
  runsPerMonth,
  minutesPerRun,
  hourlyRate,
  taskMultiplier,
  onUpdateRuns,
  onUpdateMinutes,
  nodes,
}: StatsBarProps) {
  const [timeValue, setTimeValue] = useState(0);
  const [platformCost, setPlatformCost] = useState(0);
  const [netROI, setNetROI] = useState(0);
  const [roiRatio, setRoiRatio] = useState(0);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editingRuns, setEditingRuns] = useState(false);
  const [tempMinutes, setTempMinutes] = useState(minutesPerRun);
  const [tempRuns, setTempRuns] = useState(runsPerMonth);

  useEffect(() => {
    setTempMinutes(minutesPerRun);
    setTempRuns(runsPerMonth);
  }, [minutesPerRun, runsPerMonth]);

  useEffect(() => {
    const initialTimeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
    const nodeCount = nodes?.length || 0;
    const initialPlatformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodeCount);
    
    setTimeValue(initialTimeValue);
    setPlatformCost(initialPlatformCost);
    setNetROI(initialTimeValue - initialPlatformCost);
    setRoiRatio(initialPlatformCost ? initialTimeValue / initialPlatformCost : 0);
    
    const debounceTimeout = setTimeout(() => {
      const newTimeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
      const newPlatformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodeCount);
      
      setTimeValue(newTimeValue);
      setPlatformCost(newPlatformCost);
      setNetROI(newTimeValue - newPlatformCost);
      setRoiRatio(newPlatformCost ? newTimeValue / newPlatformCost : 0);
    }, 200);
    
    return () => clearTimeout(debounceTimeout);
  }, [platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, nodes]);

  const handleMinutesChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === ".") { // Allow clearing or starting with a decimal
      setTempMinutes(val === "." ? 0. : 0);
      return;
    }
    const parsedVal = parseFloat(val);
    if (!isNaN(parsedVal) && parsedVal >= 0) {
      setTempMinutes(parsedVal);
    } 
  };

  const applyTempMinutes = () => {
    let newMinutes = parseFloat(String(tempMinutes));
    if (isNaN(newMinutes) || newMinutes < 0.1) {
      newMinutes = 0.1;
    }
    const formattedMinutes = parseFloat(newMinutes.toFixed(1));
    onUpdateMinutes(formattedMinutes);
    setTempMinutes(formattedMinutes); // Sync tempMinutes with the applied value
    setEditingMinutes(false);
  };

  const handleMinutesBlur = () => {
    applyTempMinutes();
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyTempMinutes();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTempMinutes(minutesPerRun); // Revert to original prop value
      setEditingMinutes(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const incrementMinutes = () => {
    const step = getMinuteStep(tempMinutes);
    const newValue = parseFloat(Math.max(0.1, tempMinutes + step).toFixed(1));
    setTempMinutes(newValue);
    onUpdateMinutes(newValue);
  };

  const decrementMinutes = () => {
    const step = getMinuteStep(tempMinutes);
    const newValue = parseFloat(Math.max(0.1, tempMinutes - step).toFixed(1));
    setTempMinutes(newValue);
    onUpdateMinutes(newValue);
  };

  const handleRunsChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setTempRuns(val);
    } else if (e.target.value === "") {
      setTempRuns(0);
    }
  };

  const handleRunsBlur = () => {
    onUpdateRuns(Math.max(1, tempRuns)); // Ensure min 1 run
    setEditingRuns(false);
  };

  const handleRunsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onUpdateRuns(Math.max(1, tempRuns)); // Ensure min 1 run
      setEditingRuns(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTempRuns(runsPerMonth);
      setEditingRuns(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const getRunStep = (currentRuns: number) => {
    if (currentRuns < 100) return 1;
    if (currentRuns < 1000) return 10;
    return 100;
  };

  const incrementRuns = () => {
    const step = getRunStep(tempRuns);
    const newValue = Math.max(1, tempRuns + step);
    setTempRuns(newValue);
    onUpdateRuns(newValue);
  };

  const decrementRuns = () => {
    const step = getRunStep(tempRuns);
    const newValue = Math.max(1, tempRuns - step);
    setTempRuns(newValue);
    onUpdateRuns(newValue);
  };

  const StatItem = ({
    label,
    value,
    unit,
    color,
    isCurrency = false,
    icon: IconComponent,
    desktopOnlyLabel = false,
    tabletHidden = false,
    onIncrement,
    onDecrement,
    popoverEditConfig
  }: {
    label: string;
    value: number | string;
    unit?: string;
    color?: string;
    isCurrency?: boolean;
    icon?: React.ElementType;
    desktopOnlyLabel?: boolean;
    tabletHidden?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
    popoverEditConfig?: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      inputValue: number | string; // Allow string for temp input like "0."
      onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
      onInputBlur: () => void;
      inputAriaLabel: string;
      helpText?: string;
    };
  }) => {
    let displayValue = "";
    if (label === "Mins Saved / Run") {
      const numValue = parseFloat(String(value));
      displayValue = isNaN(numValue) ? "0" : (numValue % 1 === 0 ? String(numValue) : numValue.toFixed(1));
    } else {
      displayValue = isCurrency
        ? `$${parseFloat(String(value)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : String(value);
    }

    const displayUnit = unit && typeof value === 'number' && value === 1 && unit.endsWith('s') ? unit.slice(0, -1) : unit;

    return (
      <div className={cn("flex flex-col items-center text-center", tabletHidden && "hidden md:flex")}>
        {IconComponent && <IconComponent className={cn("h-5 w-5 mb-1 md:hidden", color)} />}
        <div className={cn(
          "text-xs text-muted-foreground whitespace-nowrap", 
          desktopOnlyLabel ? "hidden md:inline" : "inline",
          (label === "Time Value" || label === "Platform Cost" || label === "Net ROI" || label === "ROI Ratio") && "md:text-sm"
        )}>{label}</div>
        <div className="flex items-center gap-1">
          {onDecrement && (
            <Button variant="ghost" size="icon" onClick={onDecrement} className="h-6 w-6">
              <MinusIcon className="h-3 w-3" />
            </Button>
          )}

          {popoverEditConfig ? (
            <Popover open={popoverEditConfig.isOpen} onOpenChange={popoverEditConfig.onOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-xs w-auto min-w-[40px] tabular-nums font-semibold"
                  title={`${label}: ${label === "Mins Saved / Run" ? displayValue + (displayUnit || '') : displayValue} (click to edit)`}
                >
                  {label === "Runs / Mo" && typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(1)}k` :
                   label === "Mins Saved / Run" ? `${displayValue}${displayUnit || ''}` :
                   displayValue}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-2">
                <Input
                  type="text" // Use text to allow temporary invalid states like "0."
                  inputMode={label === "Mins Saved / Run" ? "decimal" : "numeric"}
                  step={label === "Mins Saved / Run" ? getMinuteStep(parseFloat(String(value))) : undefined}
                  value={popoverEditConfig.inputValue}
                  onChange={popoverEditConfig.onInputChange}
                  onKeyDown={popoverEditConfig.onInputKeyDown}
                  onBlur={popoverEditConfig.onInputBlur}
                  className="text-center text-sm h-8 tabular-nums"
                  autoFocus
                  aria-label={popoverEditConfig.inputAriaLabel}
                />
                {popoverEditConfig.helpText && <p className="mt-1 text-xs text-muted-foreground text-center px-1">{popoverEditConfig.helpText}</p>}
              </PopoverContent>
            </Popover>
          ) : (
            <span className={cn(
              "font-pixel text-lg font-semibold tabular-nums", 
              color,
              (label === "Time Value" || label === "Platform Cost" || label === "Net ROI" || label === "ROI Ratio") && "text-xl md:text-2xl"
            )}>{displayValue}</span>
          )}

          {onIncrement && (
            <Button variant="ghost" size="icon" onClick={onIncrement} className="h-6 w-6">
              <PlusIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
        {displayUnit && !(label === "Mins Saved / Run" && popoverEditConfig) && (
             <div className={cn("text-[10px] text-muted-foreground md:hidden lg:inline", desktopOnlyLabel ? "hidden md:inline" : "inline")}>{displayUnit}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto p-1 md:p-2 bg-transparent rounded-lg">
      <StatItem
        label="Runs / Mo"
        value={runsPerMonth}
        unit="runs"
        icon={Zap}
        color="text-primary"
        onIncrement={incrementRuns}
        onDecrement={decrementRuns}
        popoverEditConfig={{
          isOpen: editingRuns,
          onOpenChange: setEditingRuns,
          inputValue: tempRuns,
          onInputChange: handleRunsChangeInput,
          onInputKeyDown: handleRunsKeyDown,
          onInputBlur: handleRunsBlur,
          inputAriaLabel: "Edit runs per month",
          helpText: "Number of automation runs per month."
        }}
      />
      <Separator orientation="vertical" className="h-10 hidden md:block" />
      <StatItem
        label="Mins Saved / Run"
        value={minutesPerRun}
        unit="m" // Changed unit to 'm' for consistency with display
        icon={Clock}
        color="text-primary"
        onIncrement={incrementMinutes}
        onDecrement={decrementMinutes}
        popoverEditConfig={{
          isOpen: editingMinutes,
          onOpenChange: setEditingMinutes,
          inputValue: tempMinutes,
          onInputChange: handleMinutesChangeInput,
          onInputKeyDown: handleMinutesKeyDown,
          onInputBlur: handleMinutesBlur,
          inputAriaLabel: "Edit average minutes saved per run",
          helpText: "Minutes saved per run (e.g., 0.5, 5)."
        }}
      />
      <Separator orientation="vertical" className="h-10" />
      <StatItem
        label="Time Value"
        value={timeValue.toFixed(0)}
        isCurrency
        icon={TrendingUp}
        desktopOnlyLabel
        color="text-green-600 dark:text-green-400"
      />
      <Separator orientation="vertical" className="h-10 hidden md:block" />
      <StatItem
        label="Platform Cost"
        value={platformCost.toFixed(0)}
        isCurrency
        icon={DollarSign}
        desktopOnlyLabel
        tabletHidden
        color="text-red-600 dark:text-red-400"
      />
      <Separator orientation="vertical" className="h-10 hidden md:block" />
      <StatItem
        label="Net ROI"
        value={netROI.toFixed(0)}
        isCurrency
        icon={ShieldCheck}
        color={netROI >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
      />
      <Separator orientation="vertical" className="h-10 hidden sm:block" />
      <StatItem
        label="ROI Ratio"
        value={formatROIRatio(roiRatio)}
        icon={Percent}
        color={roiRatio >= 1 ? "text-green-600 dark:text-green-400" : "text-amber-500"}
      />
      <Separator orientation="vertical" className="h-10 hidden sm:block" />
    </div>
  );
} 