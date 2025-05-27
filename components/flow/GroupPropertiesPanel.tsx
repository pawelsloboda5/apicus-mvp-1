import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Lock, Unlock, Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pricing } from "@/app/api/data/pricing";
import { GroupPropertiesPanelProps, GroupData } from "@/lib/types";
import { calculateGroupROI, formatROIRatio } from "@/lib/roi-utils";

export function GroupPropertiesPanel({
  selectedGroup,
  onClose,
  platform,
  nodes,
  setNodes,
  runsPerMonth,
  minutesPerRun,
  hourlyRate,
  taskMultiplier,
}: GroupPropertiesPanelProps) {
  // Get group data
  const groupData = selectedGroup?.data as GroupData | undefined;
  const groupNodeIds = groupData?.nodes || [] as string[];
  
  // Calculate ROI metrics for this group
  const roiMetrics = calculateGroupROI(
    groupNodeIds,
    nodes,
    {
      runsPerMonth,
      minutesPerRun,
      hourlyRate,
      taskMultiplier,
      platform,
    },
    pricing
  );

  return (
    <Sheet
      open={!!selectedGroup}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Group Properties</SheetTitle>
          <SheetDescription>
            Configure and view ROI metrics for this group of nodes.
          </SheetDescription>
        </SheetHeader>
        {selectedGroup && (
          <div className="p-4 space-y-6">
            {/* Group Type Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="px-2 py-1 rounded-sm text-xs font-medium bg-muted/80 text-foreground">
                GROUP
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {selectedGroup.id}
              </div>
            </div>

            {/* Group Info */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-foreground/80">
                Label
                <Input
                  className="mt-1"
                  value={groupData?.label || ""}
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    setNodes((ns) =>
                      ns.map((n) =>
                        n.id === selectedGroup.id
                          ? { ...n, data: { ...n.data, label: newLabel } }
                          : n
                      )
                    );
                  }}
                />
              </label>
            </div>

            {/* Locked Status */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-foreground/80">Group Locked</label>
              <Button
                size="sm"
                variant={groupData?.isLocked ? "default" : "outline"}
                className="flex items-center gap-1"
                onClick={() => {
                  if (!selectedGroup) return;
                  const newLocked = !groupData?.isLocked;
                  setNodes((ns) =>
                    ns.map((n) =>
                      n.id === selectedGroup.id
                        ? { ...n, data: { ...n.data, isLocked: newLocked } }
                        : n
                    )
                  );
                }}
              >
                {groupData?.isLocked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    <span>Unlocked</span>
                  </>
                )}
              </Button>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Locking a group prevents accidental changes to its contents.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Nodes in Group */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Nodes in Group</h4>
              <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/20 p-2">
                {groupNodeIds.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {groupNodeIds.map((nodeId: string) => {
                      const node = nodes.find((n) => n.id === nodeId);
                      return (
                        <li key={nodeId} className="flex items-center justify-between">
                          <span>{(node?.data?.label as string) || nodeId}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {node?.type as string}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No nodes in this group.</p>
                )}
              </div>
            </div>

            {/* ROI Metrics */}
            <div className="space-y-1 rounded-md bg-muted/50 border p-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                Group ROI Metrics
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Aggregated ROI metrics for all nodes in this group.</p>
                  </TooltipContent>
                </Tooltip>
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="text-muted-foreground">Nodes:</div>
                <div className="font-medium">{roiMetrics.nodeCount}</div>
                
                <div className="text-muted-foreground">Minutes saved/run:</div>
                <div className="font-medium">{roiMetrics.totalMinutesSaved.toFixed(1)} min</div>
                
                <div className="text-muted-foreground">Monthly time saved:</div>
                <div className="font-medium">
                  {((roiMetrics.totalMinutesSaved * runsPerMonth) / 60).toFixed(1)} hours
                </div>
                
                <div className="text-muted-foreground">Time value:</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  ${roiMetrics.timeValue.toFixed(0)}
                </div>
                
                <div className="text-muted-foreground">Platform cost:</div>
                <div className="font-medium text-red-600 dark:text-red-400">
                  ${roiMetrics.platformCost.toFixed(2)}
                </div>
                
                <div className="text-muted-foreground">Net ROI:</div>
                <div className="font-medium">
                  ${roiMetrics.netROI.toFixed(0)}
                </div>
                
                <div className="text-muted-foreground">ROI ratio:</div>
                <div className="font-medium">
                  {formatROIRatio(roiMetrics.roiRatio)}
                </div>
              </div>
            </div>

            {/* Group Size & Position */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Group Dimensions</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <label className="text-muted-foreground">
                  Width
                  <Input
                    className="mt-1"
                    type="number"
                    value={groupData?.width || 300}
                    onChange={(e) => {
                      const width = parseInt(e.target.value);
                      if (!isNaN(width) && width > 0) {
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedGroup.id
                              ? { ...n, data: { ...n.data, width } }
                              : n
                          )
                        );
                      }
                    }}
                  />
                </label>
                
                <label className="text-muted-foreground">
                  Height
                  <Input
                    className="mt-1"
                    type="number"
                    value={groupData?.height || 200}
                    onChange={(e) => {
                      const height = parseInt(e.target.value);
                      if (!isNaN(height) && height > 0) {
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedGroup.id
                              ? { ...n, data: { ...n.data, height } }
                              : n
                          )
                        );
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Canvas Position</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-muted-foreground">X:</div>
                <div className="font-medium">{selectedGroup.position.x}</div>
                
                <div className="text-muted-foreground">Y:</div>
                <div className="font-medium">{selectedGroup.position.y}</div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 