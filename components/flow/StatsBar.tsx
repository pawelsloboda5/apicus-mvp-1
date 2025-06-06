"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Percent, 
  Plus, 
  MinusIcon, 
  PlusIcon, 
  Coins,
  Mail,
  Loader2,
  Menu,
  Calculator,
  ChevronDown,
  Code,
  CheckSquare,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformType, Scenario } from "@/lib/types";
import { Node } from "@xyflow/react";
import { 
  calculateTimeValue, 
  calculatePlatformCost, 
  pricing, 
  formatROIRatio 
} from "@/lib/roi";

interface StatsBarProps {
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;  onUpdateRuns: (runs: number) => void;
  onUpdateMinutes: (minutes: number) => void;
  nodes?: Node[];
  currentScenario?: Scenario | null;
  
  // New props for integrated controls
  onPlatformChange: (platform: PlatformType) => void;
  onOpenROISettings: () => void;
  onAddNode: () => void;
  onGenerateEmail: () => void;
  isGeneratingEmail?: boolean;
  
  // Group controls
  onCreateGroup?: () => void;
  onUngroup?: () => void;
  selectedIds?: string[];
  selectedGroupId?: string | null;
  isMultiSelectionActive?: boolean;
}

// Platform configurations
const PLATFORM_CONFIG = {
  zapier: { 
    icon: Zap, 
    color: 'bg-orange-500 hover:bg-orange-600', 
    textColor: 'text-orange-600',
    name: 'Zapier'
  },
  make: { 
    icon: CheckSquare, 
    color: 'bg-purple-500 hover:bg-purple-600', 
    textColor: 'text-purple-600',
    name: 'Make'
  },
  n8n: { 
    icon: Code, 
    color: 'bg-red-500 hover:bg-red-600', 
    textColor: 'text-red-600',
    name: 'n8n'
  }
};

// Screen size breakpoints hook
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize('xs');
      else if (width < 640) setScreenSize('sm');
      else if (width < 768) setScreenSize('md');
      else if (width < 1024) setScreenSize('lg');
      else setScreenSize('xl');
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return screenSize;
};

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
  taskMultiplier,  onUpdateRuns,
  onUpdateMinutes,
  nodes,
  onPlatformChange,
  onOpenROISettings,
  onAddNode,
  onGenerateEmail,
  isGeneratingEmail = false,
  onCreateGroup,
  onUngroup,
  selectedIds = [],
  selectedGroupId,
  isMultiSelectionActive = false,
}: StatsBarProps) {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const screenSize = useScreenSize();
  const [timeValue, setTimeValue] = useState(0);
  const [platformCost, setPlatformCost] = useState(0);
  const [netROI, setNetROI] = useState(0);
  const [roiRatio, setRoiRatio] = useState(0);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editingRuns, setEditingRuns] = useState(false);
  const [tempMinutes, setTempMinutes] = useState(minutesPerRun);
  const [tempRuns, setTempRuns] = useState(runsPerMonth);

  // Update temp values when props change
  useEffect(() => {
    setTempMinutes(minutesPerRun);
    setTempRuns(runsPerMonth);
  }, [minutesPerRun, runsPerMonth]);

  // Calculate ROI values
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      const newTimeValue = calculateTimeValue(runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier);
      const nodeCount = nodes?.length || 0;
      const newPlatformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodeCount);
      
      setTimeValue(newTimeValue);
      setPlatformCost(newPlatformCost);
      setNetROI(newTimeValue - newPlatformCost);
      setRoiRatio(newPlatformCost ? newTimeValue / newPlatformCost : 0);
    }, 200);
    
    return () => clearTimeout(debounceTimeout);
  }, [platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, nodes]);

  // Responsive configurations
  const isCompact = screenSize === 'xs' || screenSize === 'sm';
  const isUltraCompact = screenSize === 'xs';
  const showFullLabels = screenSize === 'lg' || screenSize === 'xl';
  const showIcons = !showFullLabels;

  // Platform switcher component
  const PlatformSwitcher = () => {
    const config = PLATFORM_CONFIG[platform];
    const PlatformIcon = config.icon;

    if (isUltraCompact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn("h-10 w-10", config.color, "text-white border-none")}
              onClick={() => {
                const platforms = Object.keys(PLATFORM_CONFIG) as PlatformType[];
                const currentIndex = platforms.indexOf(platform);
                const nextIndex = (currentIndex + 1) % platforms.length;
                onPlatformChange(platforms[nextIndex]);
              }}
            >
              <PlatformIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Platform: {config.name} (click to switch)</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-2">
            <PlatformIcon className="h-4 w-4" />
            {!isCompact && <span className="text-sm">{config.name}</span>}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1">
          <div className="space-y-1">
            {Object.entries(PLATFORM_CONFIG).map(([key, conf]) => {
              const Icon = conf.icon;
              return (
                <Button
                  key={key}
                  variant={platform === key ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onPlatformChange(key as PlatformType)}
                >
                  <Icon className="h-4 w-4" />
                  {conf.name}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Action buttons component
  const ActionButtons = () => {
    if (isUltraCompact) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Menu className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={onAddNode}
              >
                <Plus className="h-4 w-4" />
                Add Node
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onGenerateEmail}
                disabled={isGeneratingEmail}
              >
                {isGeneratingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Generate Email
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onOpenROISettings}
              >
                <Coins className="h-4 w-4" />
                ROI Settings
              </Button>
              {isMounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span>Toggle Theme</span>
                </Button>
              )}
              {isMultiSelectionActive && selectedIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={onCreateGroup}
                >
                  <Calculator className="h-4 w-4" />
                  Group ({selectedIds.length})
                </Button>
              )}
              {selectedGroupId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={onUngroup}
                >
                  Ungroup
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {/* Platform switcher next to Add Node button */}
        <PlatformSwitcher />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={onAddNode}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Node</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={onGenerateEmail}
              disabled={isGeneratingEmail}
            >
              {isGeneratingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Email</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={onOpenROISettings}
            >
              <Coins className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ROI Settings</p>
          </TooltipContent>
        </Tooltip>

        {isMounted && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Theme</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isMultiSelectionActive && selectedIds.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2"
                onClick={onCreateGroup}
              >
                <Calculator className="h-4 w-4" />
                {!isCompact && <span className="text-sm">Group ({selectedIds.length})</span>}
                {isCompact && <Badge variant="secondary" className="text-xs px-2">{selectedIds.length}</Badge>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Group {selectedIds.length} selected nodes</p>
            </TooltipContent>
          </Tooltip>
        )}

        {selectedGroupId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={onUngroup}
              >
                {isCompact ? "Ungroup" : "Ungroup"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ungroup selected group</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };
  // Stat item component
  const StatItem = ({
    label,
    value,
    color,
    isCurrency = false,
    icon: IconComponent,
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
    onIncrement?: () => void;
    onDecrement?: () => void;
    popoverEditConfig?: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      inputValue: number | string;
      onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
      onInputBlur: () => void;
      inputAriaLabel: string;
      helpText?: string;
    };
  }) => {
    let displayValue = "";
    if (label.includes("Minutes")) {
      const numValue = parseFloat(String(value));
      displayValue = isNaN(numValue) ? "0" : (numValue % 1 === 0 ? String(numValue) : numValue.toFixed(1));
    } else {
      displayValue = isCurrency
        ? `$${parseFloat(String(value)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : String(value);
    }

    if (isUltraCompact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center min-w-0">
              {IconComponent && <IconComponent className={cn("h-4 w-4 mb-1", color)} />}
              <span className={cn("text-xs font-mono tabular-nums", color)}>
                {displayValue}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}: {displayValue}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="flex flex-col items-center text-center min-w-0">
        {showIcons && IconComponent && (
          <IconComponent className={cn("h-4 w-4 mb-1", color)} />
        )}
          {showFullLabels && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground whitespace-nowrap mb-1 cursor-help">
                {label}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}: {displayValue}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center gap-1">
          {onDecrement && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onDecrement} 
              className="h-8 w-8"
            >
              <MinusIcon className="h-3 w-3" />
            </Button>
          )}

          {popoverEditConfig ? (
            <Popover open={popoverEditConfig.isOpen} onOpenChange={popoverEditConfig.onOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-base w-auto min-w-[45px] tabular-nums font-semibold"
                  title={`${label}: ${displayValue} (click to edit)`}
                >
                  {displayValue}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-2">
                <Input
                  type="text"
                  inputMode={label.includes("Minutes") ? "decimal" : "numeric"}
                  value={popoverEditConfig.inputValue}
                  onChange={popoverEditConfig.onInputChange}
                  onKeyDown={popoverEditConfig.onInputKeyDown}
                  onBlur={popoverEditConfig.onInputBlur}
                  className="text-center text-sm h-8 tabular-nums"
                  autoFocus
                  aria-label={popoverEditConfig.inputAriaLabel}
                />
                {popoverEditConfig.helpText && (
                  <p className="mt-1 text-xs text-muted-foreground text-center px-1">
                    {popoverEditConfig.helpText}
                  </p>
                )}
              </PopoverContent>
            </Popover>
          ) : (            <span className={cn("font-mono text-base font-semibold tabular-nums", color)}>
              {displayValue}
            </span>
          )}

          {onIncrement && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onIncrement} 
              className="h-8 w-8"
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Input handlers
  const handleMinutesChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === ".") {
      setTempMinutes(val === "." ? 0 : 0);
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
    setTempMinutes(formattedMinutes);
    setEditingMinutes(false);
  };

  const handleMinutesBlur = () => applyTempMinutes();

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyTempMinutes();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTempMinutes(minutesPerRun);
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
    onUpdateRuns(Math.max(1, tempRuns));
    setEditingRuns(false);
  };

  const handleRunsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onUpdateRuns(Math.max(1, tempRuns));
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

  const statsToShow = isUltraCompact 
    ? ['runs', 'minutes', 'roi'] 
    : isCompact 
    ? ['runs', 'minutes', 'value', 'roi']
    : ['runs', 'minutes', 'value', 'cost', 'net', 'roi'];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-background border-b min-h-[64px]">
        {/* Left side - App name */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Apicus.io
          </h1>
        </div>

        {/* Center - Stats */}
        <div className="flex items-center gap-3 md:gap-6 flex-1 justify-center">
          {statsToShow.includes('runs') && (
            <>
              <StatItem
                label="Runs"
                value={runsPerMonth >= 1000 ? `${(runsPerMonth / 1000).toFixed(1)}k` : runsPerMonth}
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
              {!isUltraCompact && <Separator orientation="vertical" className="h-10" />}
            </>
          )}

          {statsToShow.includes('minutes') && (
            <>
              <StatItem
                label="Minutes"
                value={minutesPerRun}
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
              {!isUltraCompact && <Separator orientation="vertical" className="h-10" />}
            </>
          )}

          {statsToShow.includes('value') && (
            <>
              <StatItem
                label="Value"
                value={timeValue.toFixed(0)}
                isCurrency
                icon={TrendingUp}
                color="text-green-600 dark:text-green-400"
              />
              {!isUltraCompact && <Separator orientation="vertical" className="h-10" />}
            </>
          )}

          {statsToShow.includes('cost') && (
            <>
              <StatItem
                label="Cost"
                value={platformCost.toFixed(0)}
                isCurrency
                icon={DollarSign}
                color="text-red-600 dark:text-red-400"
              />
              {!isUltraCompact && <Separator orientation="vertical" className="h-10" />}
            </>
          )}

          {statsToShow.includes('net') && (
            <>
              <StatItem
                label="Net"
                value={netROI.toFixed(0)}
                isCurrency
                icon={ShieldCheck}
                color={netROI >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
              />
              {!isUltraCompact && <Separator orientation="vertical" className="h-10" />}
            </>
          )}

          {statsToShow.includes('roi') && (
            <StatItem
              label="ROI"
              value={formatROIRatio(roiRatio)}
              icon={Percent}
              color={roiRatio >= 1 ? "text-green-600 dark:text-green-400" : "text-amber-500"}
            />
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ActionButtons />
        </div>
      </div>
    </TooltipProvider>
  );
}