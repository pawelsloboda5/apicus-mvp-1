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
  return (
    <Sheet
      open={!!selectedNode}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Node Properties</SheetTitle>
          <SheetDescription>
            Configure the selected node's basic settings.
          </SheetDescription>
        </SheetHeader>
        {selectedNode && (
          <div className="p-4 space-y-6">
            {/* Node Type Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "px-2 py-1 rounded-sm text-xs font-medium",
                selectedNode.type === "trigger" ? "bg-secondary/30 text-secondary-foreground" :
                selectedNode.type === "action" ? "bg-muted text-muted-foreground" :
                "bg-primary/20 text-primary"
              )}>
                {String(selectedNode.type).toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {selectedNode.id}
              </div>
            </div>

            {/* Node Type Description */}
            <div className="text-xs text-muted-foreground mb-4">
              {selectedNode.type === "trigger" && 
                "Triggers start automation workflows when certain events occur."}
              {selectedNode.type === "action" && 
                "Actions perform operations like creating, updating, or sending data."}
              {selectedNode.type === "decision" && 
                "Decisions branch the workflow based on conditions."}
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-foreground/80">
                Label
                <Input
                  className="mt-1"
                  value={selectedNode.data?.label || ""}
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
              <div className="space-y-4 rounded-md border p-3">
                <h4 className="text-sm font-medium">Condition Settings</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Configure when to follow the True or False paths
                </p>
                
                {/* Condition Type */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Condition Type
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-1 text-xs"
                      value={selectedNode.data?.conditionType || "comparison"}
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
                
                {/* Field to Check */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Field to Check
                    <Input
                      className="mt-1"
                      placeholder="e.g. data.status or item.price"
                      value={selectedNode.data?.fieldPath || ""}
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
                
                {/* Comparison Operator - Show only for comparison type */}
                {(selectedNode.data?.conditionType === "comparison" || !selectedNode.data?.conditionType) && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">
                      Operator
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-1 text-xs"
                        value={selectedNode.data?.operator || "equals"}
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
                
                {/* Value to Compare - Not needed for existence checks */}
                {selectedNode.data?.conditionType !== "existence" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">
                      Value to Compare
                      <Input
                        className="mt-1"
                        placeholder="e.g. approved or 100"
                        value={selectedNode.data?.compareValue || ""}
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

            {/* App & Step Details */}
            {selectedNode.data?.appName && (
              <div className="space-y-1 rounded-md bg-muted p-3">
                <h4 className="text-sm font-medium">App Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">App:</div>
                  <div className="font-medium">{selectedNode.data.appName}</div>
                  
                  {selectedNode.data.action && (
                    <>
                      <div className="text-muted-foreground">Action:</div>
                      <div className="font-medium">{selectedNode.data.action}</div>
                    </>
                  )}
                  
                  {selectedNode.data.typeOf && (
                    <>
                      <div className="text-muted-foreground">Type:</div>
                      <div className="font-medium capitalize">{selectedNode.data.typeOf}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ROI Contribution */}
            <div className="space-y-1 rounded-md bg-muted/50 border p-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                ROI Contribution
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>This calculation estimates how much time and money this specific step saves within the overall workflow.</p>
                  </TooltipContent>
                </Tooltip>
              </h4>
              <div className="text-xs text-muted-foreground mb-2">
                Estimated time saved by this step:
              </div>
              
              {/* Estimate time saved based on node type and position */}
              {(() => {
                // Use the utility function to calculate time savings
                const adjustedMinutes = calculateNodeTimeSavings(
                  selectedNode.type as NodeType, 
                  minutesPerRun,
                  nodes,
                  {
                    trigger: 0.5,
                    action: 1.2,
                    decision: 0.8
                  },
                  selectedNode.data?.typeOf
                );
                
                // Value calculation
                const hourValue = hourlyRate * taskMultiplier;
                const stepValue = (adjustedMinutes / 60) * hourValue * runsPerMonth;
                
                return (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-muted-foreground flex items-center gap-1">
                      Time per run:
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Estimated based on node type and operation complexity.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="font-medium">{adjustedMinutes.toFixed(1)} min</div>
                    
                    <div className="text-muted-foreground">Monthly runs:</div>
                    <div className="font-medium">{runsPerMonth.toLocaleString()}</div>
                    
                    <div className="text-muted-foreground">Monthly time saved:</div>
                    <div className="font-medium">
                      {((adjustedMinutes * runsPerMonth) / 60).toFixed(1)} hours
                    </div>
                    
                    <div className="text-muted-foreground flex items-center gap-1">
                      Monthly value:
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Calculated as: (Minutes ÷ 60) × ${hourlyRate} × {taskMultiplier} multiplier × {runsPerMonth} runs</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      ${stepValue.toFixed(0)}
                    </div>
                    
                    <div className="text-muted-foreground flex items-center gap-1">
                      Contribution:
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Percentage of total workflow ROI provided by this step.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="font-medium">
                      {Math.round((stepValue / (hourValue * (minutesPerRun / 60) * runsPerMonth)) * 100)}% of total
                    </div>
                    
                    {/* Platform-specific cost */}
                    <div className="text-muted-foreground flex items-center gap-1">
                      {platform} cost:
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Estimated automation platform cost for this node.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="font-medium text-red-600 dark:text-red-400">
                      {(() => {
                        // Get platform pricing info
                        const data = pricing[platform];
                        const tierName = {
                          zapier: "Professional",
                          make: "Core",
                          n8n: "Starter"
                        }[platform];
                        const tier = data.tiers.find(t => t.name === tierName) || data.tiers[0];
                        
                        // Calculate cost per unit
                        const costPerUnit = tier.quota ? (tier.monthlyUSD / tier.quota) : 0;
                        
                        // Units consumed by this node
                        let unitsPerRun = 1; // Default
                        
                        // Adjust based on platform and node type
                        if (platform === 'zapier') {
                          // In Zapier, each action consumes 1 task
                          unitsPerRun = 1;
                        } else if (platform === 'make') {
                          // In Make, operations can multiply in complex nodes
                          unitsPerRun = selectedNode.type === 'action' ? 1.5 : 1;
                        } else if (platform === 'n8n') {
                          // In n8n, executions are per workflow, not per node
                          unitsPerRun = 1 / nodes.length;
                        }
                        
                        // Total cost for this node
                        const monthlyCost = unitsPerRun * runsPerMonth * costPerUnit;
                        
                        return `$${monthlyCost.toFixed(2)}`;
                      })()}
                    </div>
                    
                    {/* ROI Ratio */}
                    <div className="text-muted-foreground flex items-center gap-1">
                      Node ROI Ratio:
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The value generated compared to the cost (higher is better).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="font-medium">
                      {(() => {
                        // Re-use the cost calculation from above
                        const data = pricing[platform];
                        const tierName = {
                          zapier: "Professional",
                          make: "Core",
                          n8n: "Starter"
                        }[platform];
                        const tier = data.tiers.find(t => t.name === tierName) || data.tiers[0];
                        const costPerUnit = tier.quota ? (tier.monthlyUSD / tier.quota) : 0;
                        
                        // Units consumed by this node
                        let unitsPerRun = 1; // Default
                        if (platform === 'zapier') {
                          unitsPerRun = 1;
                        } else if (platform === 'make') {
                          unitsPerRun = selectedNode.type === 'action' ? 1.5 : 1;
                        } else if (platform === 'n8n') {
                          unitsPerRun = 1 / nodes.length;
                        }
                        
                        // Total cost for this node
                        const monthlyCost = unitsPerRun * runsPerMonth * costPerUnit;
                        
                        // Calculate ratio (value ÷ cost)
                        const ratio = calculateROIRatio(stepValue, monthlyCost);
                        
                        // Format based on magnitude
                        return formatROIRatio(ratio);
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Position */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Canvas Position</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-muted-foreground">X:</div>
                <div className="font-medium">{selectedNode.position.x}</div>
                
                <div className="text-muted-foreground">Y:</div>
                <div className="font-medium">{selectedNode.position.y}</div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 