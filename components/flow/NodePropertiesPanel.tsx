"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pricing } from "@/app/api/data/pricing";
import { NodePropertiesPanelProps, NodeData, NodeType } from "@/lib/types";
import { calculateNodeTimeSavings, calculateROIRatio, formatROIRatio } from "@/lib/roi-utils";

export function NodePropertiesPanel({
  selectedNode,
  onClose,
  platform,
  nodes,
  setNodes,
  runsPerMonth,
  minutesPerRun,
  hourlyRate,
  taskMultiplier,
}: NodePropertiesPanelProps) {
  const nodeData = selectedNode?.data as NodeData | undefined;

  return (
    <Sheet
      open={!!selectedNode}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>Node Properties</SheetTitle>
          <SheetDescription>
            Configure the selected node&apos;s basic settings.
          </SheetDescription>
        </SheetHeader>
        {selectedNode && (
          <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-var(--header-height,69px))]">
            {/* Node Overview Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Overview</CardTitle>
                <div className={cn(
                  "px-2 py-1 rounded-sm text-xs font-medium",
                  selectedNode.type === "trigger" ? "bg-secondary/30 text-secondary-foreground" :
                  selectedNode.type === "action" ? "bg-muted text-muted-foreground" :
                  "bg-primary/20 text-primary"
                )}>
                  {String(selectedNode.type).toUpperCase()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-1">
                  ID: {selectedNode.id}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedNode.type === "trigger" && 
                    "Triggers start automation workflows when certain events occur."}
                  {selectedNode.type === "action" && 
                    "Actions perform operations like creating, updating, or sending data."}
                  {selectedNode.type === "decision" && 
                    "Decisions branch the workflow based on conditions."}
                </p>
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground/80">
                    Label
                    <Input
                      className="mt-1"
                      value={nodeData?.label || ""}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, label: newLabel } }
                              : n
                          )
                        );
                      }}
                    />
                  </label>
                </div>

                {/* Decision Node Condition Settings */} 
                {selectedNode.type === "decision" && (
                  <div className="space-y-4 rounded-md border p-3 bg-muted/20">
                    <h4 className="text-sm font-medium">Condition Logic</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Define when to follow the True or False paths.
                    </p>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium">
                        Condition Type
                        <select
                          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs h-8"
                          value={nodeData?.conditionType || "comparison"}
                          onChange={(e) => {
                            const conditionType = e.target.value;
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, conditionType } }
                                  : n
                              )
                            );
                          }}
                        >
                          <option value="comparison">Value Comparison</option>
                          <option value="existence">Value Exists</option>
                          <option value="text">Text Match</option>
                        </select>
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium">
                        Field to Check
                        <Input
                          className="mt-1"
                          placeholder="e.g. data.status or item.price"
                          value={nodeData?.fieldPath || ""}
                          onChange={(e) => {
                            const fieldPath = e.target.value;
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, fieldPath } }
                                  : n
                              )
                            );
                          }}
                        />
                      </label>
                    </div>
                    
                    {(nodeData?.conditionType === "comparison" || !nodeData?.conditionType) && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Operator
                          <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs h-8"
                            value={nodeData?.operator || "equals"}
                            onChange={(e) => {
                              const operator = e.target.value;
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedNode.id
                                    ? { ...n, data: { ...n.data, operator } }
                                    : n
                                )
                              );
                            }}
                          >
                            <option value="equals">Equals (==)</option>
                            <option value="notEquals">Not Equals (!=)</option>
                            <option value="greaterThan">Greater Than (&gt;)</option>
                            <option value="lessThan">Less Than (&lt;)</option>
                            <option value="contains">Contains</option>
                          </select>
                        </label>
                      </div>
                    )}
                    
                    {nodeData?.conditionType !== "existence" && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Value to Compare
                          <Input
                            className="mt-1"
                            placeholder="e.g. approved or 100"
                            value={nodeData?.compareValue || ""}
                            onChange={(e) => {
                              const compareValue = e.target.value;
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedNode.id
                                    ? { ...n, data: { ...n.data, compareValue } }
                                    : n
                                )
                              );
                            }}
                          />
                        </label>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-green-600 dark:text-green-400">True path:</span> Condition is met
                      </p>
                      <p>
                        <span className="font-medium text-red-600 dark:text-red-400">False path:</span> Condition is not met
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* App Details Card */}
            {nodeData?.appName && (
              <Card>
                <CardHeader>
                  <CardTitle>App Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="text-muted-foreground">App:</div>
                    <div className="font-medium break-all">{String(nodeData.appName)}</div>
                    
                    {nodeData.action && (
                      <>
                        <div className="text-muted-foreground">Action:</div>
                        <div className="font-medium break-all">{String(nodeData.action)}</div>
                      </>
                    )}
                    
                    {nodeData.typeOf && (
                      <>
                        <div className="text-muted-foreground">Type:</div>
                        <div className="font-medium capitalize break-all">{String(nodeData.typeOf)}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ROI Contribution Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle>
                        ROI Contribution
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>This calculation estimates how much time and money this specific step saves within the overall workflow.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <CardDescription className="text-xs pt-1">
                    Estimated financial impact of this automation step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const adjustedMinutes = calculateNodeTimeSavings(
                    selectedNode.type as NodeType, 
                    minutesPerRun,
                    nodes,
                    {
                      trigger: 0.5,
                      action: 1.2,
                      decision: 0.8,
                      group: 0,
                    },
                    nodeData?.typeOf
                  );
                  
                  const hourValue = hourlyRate * taskMultiplier;
                  const stepValue = (adjustedMinutes / 60) * hourValue * runsPerMonth;
                  
                  const data = pricing[platform];
                  const tierName: Record<string, string> = {
                    zapier: "Professional",
                    make: "Core",
                    n8n: "Starter"
                  };
                  const currentTierName = tierName[platform] || Object.values(tierName)[0];
                  const tier = data.tiers.find((t: { name: string; monthlyUSD: number; quota: number }) => t.name === currentTierName) || data.tiers[0];
                  const costPerUnit = tier.quota ? (tier.monthlyUSD / tier.quota) : 0;
                  
                  let unitsPerRunNode = 1; 
                  if (platform === 'zapier') {
                    unitsPerRunNode = 1;
                  } else if (platform === 'make') {
                    unitsPerRunNode = selectedNode.type === 'action' ? 1.2 : (selectedNode.type === 'trigger' || selectedNode.type === 'decision' ? 1 : 0.5); // Example: actions more, others less
                  } else if (platform === 'n8n') {
                    unitsPerRunNode = 1 / Math.max(1, nodes.filter(n => n.type !== 'group').length); // Distribute cost among non-group nodes
                  }
                  const monthlyCostNode = unitsPerRunNode * runsPerMonth * costPerUnit;
                  const roiRatioNode = calculateROIRatio(stepValue, monthlyCostNode);

                  return (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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
                      <div className="font-medium tabular-nums">{runsPerMonth.toLocaleString()}</div>
                      
                      <div className="text-muted-foreground">Monthly time saved:</div>
                      <div className="font-medium tabular-nums">
                        {((adjustedMinutes * runsPerMonth) / 60).toFixed(1)} hrs
                      </div>
                      
                      <div className="text-muted-foreground flex items-center gap-1">
                        Monthly value:
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px]">
                            <p>Time Value Calculation:</p>
                            <p>({adjustedMinutes.toFixed(1)} min / 60) &times; ${hourlyRate.toFixed(2)}/hr &times; {taskMultiplier.toFixed(1)}x multiplier &times; {runsPerMonth.toLocaleString()} runs</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                        ${stepValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </div>
                      
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
                        {Math.round((stepValue / Math.max(1, (hourlyRate * taskMultiplier * (minutesPerRun / 60) * runsPerMonth))) * 100)}% of total
                      </div>
                      
                      <div className="text-muted-foreground flex items-center gap-1">
                        {platform} cost:
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
                      
                      <div className="text-muted-foreground flex items-center gap-1">
                        Node ROI Ratio:
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Value generated by this node vs. its cost (Value / Cost).</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="font-medium tabular-nums">
                        {formatROIRatio(roiRatioNode)}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 