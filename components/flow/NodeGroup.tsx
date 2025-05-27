import React from "react";
import { NodeProps } from "@xyflow/react";
import { calculateTimeValue, calculatePlatformCost } from "@/lib/roi-utils";
import { Lock, Unlock, Calculator } from "lucide-react";
import { pricing } from "@/app/api/data/pricing";
import { cn } from "@/lib/utils";
import { GroupData } from "@/lib/types";

export function NodeGroup({ data, selected }: NodeProps) {
  // Cast data to GroupData type
  const safeData = data as unknown as GroupData;

  const {
    label,
    width,
    height,
    nodes = [] as string[],
    runsPerMonth = 1000,
    hourlyRate = 30,
    taskMultiplier = 1.5,
    platform = "zapier",
    isLocked = false,
    onLockToggle,
    nodeCount = 0,
  } = safeData || {};

  // Calculate aggregate ROI for the group
  const totalMinutesSaved = nodes.reduce((total: number, nodeId: string) => {
    const nodeMap = safeData?.nodeMap || {};
    const node = nodeMap[nodeId];
    if (!node) return total;
    
    // Get the node's time contribution
    const nodeMinutes = node.minuteContribution || 0;
    return total + nodeMinutes;
  }, 0);

  // Calculate time value and platform cost
  const timeValue = calculateTimeValue(runsPerMonth, totalMinutesSaved, hourlyRate, taskMultiplier);
  const platformCost = calculatePlatformCost(platform, runsPerMonth, pricing, nodeCount);
  const netROI = timeValue - platformCost;

  return (
    <div
      className={cn(
        "rounded-md border border-dashed p-0.5",
        "bg-background/50 backdrop-blur-sm",
        selected ? "border-primary border-opacity-70" : "border-muted-foreground border-opacity-30",
        isLocked ? "border-orange-500 dark:border-orange-400 border-opacity-70" : ""
      )}
      style={{
        width: width || 300,
        height: height || 200,
        position: "relative",
      }}
    >
      {/* Group Header */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between rounded-t-md border border-b-0 bg-muted/70 px-2 py-1 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-1 font-medium">
          <Calculator className="h-3 w-3" />
          {label || "Group"}
          <span className="ml-1 text-muted-foreground">({nodeCount} nodes)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ROI Stats */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-green-600 dark:text-green-400">+${timeValue.toFixed(0)}</span>
            <span className="opacity-70">/</span>
            <span className="text-red-600 dark:text-red-400">-${platformCost.toFixed(0)}</span>
            <span className="opacity-30">=</span>
            <span className="font-semibold">${netROI.toFixed(0)}</span>
          </div>
          
          {/* Lock Toggle */}
          <button
            className="cursor-pointer rounded-sm p-1 hover:bg-muted-foreground/10"
            onClick={(e) => {
              e.stopPropagation();
              if (onLockToggle) onLockToggle(!isLocked);
            }}
            title={isLocked ? "Unlock group" : "Lock group"}
          >
            {isLocked ? (
              <Lock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
            ) : (
              <Unlock className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 