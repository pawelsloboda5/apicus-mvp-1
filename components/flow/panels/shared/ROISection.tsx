/**
 * Shared ROI Section Component
 * Provides consistent ROI display across all node panels
 */

import React from "react";
import { Node } from "@xyflow/react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useROICalculations, NodeROIData } from "@/lib/hooks/useROICalculations";

interface ROISectionProps {
  node: Node;
  roiCalculations: ReturnType<typeof useROICalculations>;
  showDetailedBreakdown?: boolean;
  showAppCosts?: boolean;
}

export function ROISection({ 
  node, 
  roiCalculations, 
  showDetailedBreakdown = true,
  showAppCosts = true 
}: ROISectionProps) {
  const roiData = roiCalculations.calculateNodeROI(node);
  const { 
    adjustedMinutes, 
    stepValue, 
    monthlyCostNode, 
    appCostForNode, 
    totalNodeCost, 
    roiRatioNode,
    nodesUsingThisApp 
  } = roiData;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">ROI Contribution</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>This calculation estimates how much time and money this specific step saves within the overall workflow.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-sm text-muted-foreground">
        Estimated financial impact of this automation step.
      </p>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-muted-foreground flex items-center gap-1">
          Time Saved / run:
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Estimated based on node type and operation complexity.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="font-medium tabular-nums">{adjustedMinutes.toFixed(1)} min</div>
        
        <div className="text-muted-foreground">Monthly runs:</div>
        <div className="font-medium tabular-nums">{roiCalculations.runsPerMonth.toLocaleString()}</div>
        
        <div className="text-muted-foreground">Monthly time saved:</div>
        <div className="font-medium tabular-nums">
          {((adjustedMinutes * roiCalculations.runsPerMonth) / 60).toFixed(1)} hrs
        </div>
        
        <div className="text-muted-foreground flex items-center gap-1">
          Monthly value:
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p>Time Value Calculation:</p>
              <p>({adjustedMinutes.toFixed(1)} min / 60) × ${roiCalculations.hourlyRate.toFixed(2)}/hr × {roiCalculations.taskMultiplier.toFixed(1)}x multiplier × {roiCalculations.runsPerMonth.toLocaleString()} runs</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="font-medium text-green-600 dark:text-green-400 tabular-nums">
          ${stepValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
        </div>
        
        {showDetailedBreakdown && (
          <>
            <div className="text-muted-foreground flex items-center gap-1">
              Contribution:
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of total workflow time value provided by this step.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-medium tabular-nums">
              {Math.round((stepValue / Math.max(1, (roiCalculations.hourlyRate * roiCalculations.taskMultiplier * (roiCalculations.minutesPerRun / 60) * roiCalculations.runsPerMonth))) * 100)}% of total
            </div>
          </>
        )}
        
        <div className="text-muted-foreground flex items-center gap-1">
          {roiCalculations.platform} cost:
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Estimated platform cost attributed to this node for the month.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="font-medium text-red-600 dark:text-red-400 tabular-nums">
          ${monthlyCostNode.toFixed(2)}
        </div>
        
        {showAppCosts && appCostForNode > 0 && (
          <>
            <div className="text-muted-foreground flex items-center gap-1">
              App cost:
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated {(node.data as any)?.appName || 'app'} cost based on selected tier.</p>
                  {nodesUsingThisApp > 1 && (
                    <p className="mt-1">Cost divided by {nodesUsingThisApp} nodes using this app.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-medium text-red-600 dark:text-red-400 tabular-nums">
              ${appCostForNode.toFixed(2)}
            </div>
          </>
        )}
        
        <div className="text-muted-foreground">Total costs:</div>
        <div className="font-medium text-red-600 dark:text-red-400 tabular-nums">
          ${totalNodeCost.toFixed(2)}
        </div>
        
        <div className="text-muted-foreground flex items-center gap-1">
          Node ROI Ratio:
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Value generated by this node vs. its total cost (Value / Cost).</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="font-medium tabular-nums">
          {roiCalculations.formatROIRatio(roiRatioNode)}
        </div>
      </div>
    </div>
  );
}