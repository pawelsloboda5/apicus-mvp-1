"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Trash2, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { pricing } from "@/app/api/data/pricing";
import { NodePropertiesPanelProps, NodeData, NodeType } from "@/lib/types";
import { calculateNodeTimeSavings, calculateROIRatio, formatROIRatio } from "@/lib/roi-utils";
import { markSectionsWithChanges, EmailSectionConnections } from "@/lib/flow-utils";
import { NODE_TIME_FACTORS } from "@/lib/utils/constants";
import { Node, Edge } from "@xyflow/react";

// Template configurations for email context nodes
interface EmailContextTemplate {
  label: string;
  multiSelect?: boolean;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const EMAIL_CONTEXT_TEMPLATES: Record<string, EmailContextTemplate> = {
  persona: {
    label: "Common Personas",
    options: [
      { value: "Marketing Manager", label: "Marketing Manager", description: "Mid-level marketing professional" },
      { value: "Sales Director", label: "Sales Director", description: "Senior sales leadership" },
      { value: "Operations Manager", label: "Operations Manager", description: "Process optimization focused" },
      { value: "Small Business Owner", label: "Small Business Owner", description: "Resource-conscious decision maker" },
      { value: "IT Administrator", label: "IT Administrator", description: "Technical implementation focused" },
      { value: "CEO/Founder", label: "CEO/Founder", description: "Strategic, ROI-focused" },
      { value: "Product Manager", label: "Product Manager", description: "Feature and efficiency focused" },
      { value: "Finance Director", label: "Finance Director", description: "Cost and compliance focused" },
    ]
  },
  industry: {
    label: "Industry Verticals",
    options: [
      { value: "SaaS", label: "SaaS", description: "Software as a Service" },
      { value: "E-commerce", label: "E-commerce", description: "Online retail and marketplaces" },
      { value: "Healthcare", label: "Healthcare", description: "Medical and health services" },
      { value: "Financial Services", label: "Financial Services", description: "Banking, insurance, fintech" },
      { value: "Manufacturing", label: "Manufacturing", description: "Production and supply chain" },
      { value: "Real Estate", label: "Real Estate", description: "Property and realty services" },
      { value: "Education", label: "Education", description: "Schools and learning platforms" },
      { value: "Consulting", label: "Consulting", description: "Professional services" },
    ]
  },
  painpoint: {
    label: "Common Pain Points",
    multiSelect: true,
    options: [
      { value: "Manual data entry", label: "Manual data entry", description: "Repetitive typing and copying" },
      { value: "Slow response times", label: "Slow response times", description: "Delayed customer service" },
      { value: "Data silos", label: "Data silos", description: "Disconnected systems" },
      { value: "Human errors", label: "Human errors", description: "Mistakes in manual processes" },
      { value: "Scaling challenges", label: "Scaling challenges", description: "Can't grow efficiently" },
      { value: "Compliance risks", label: "Compliance risks", description: "Regulatory concerns" },
      { value: "High operational costs", label: "High operational costs", description: "Expensive manual work" },
      { value: "Poor visibility", label: "Poor visibility", description: "Lack of real-time insights" },
    ]
  },
  metric: {
    label: "Success Metrics",
    multiSelect: true,
    options: [
      { value: "Time saved per week", label: "Time saved per week", description: "Hours freed up" },
      { value: "Cost reduction %", label: "Cost reduction %", description: "Operational savings" },
      { value: "Error rate reduction", label: "Error rate reduction", description: "Fewer mistakes" },
      { value: "Customer response time", label: "Customer response time", description: "Faster service" },
      { value: "Revenue per employee", label: "Revenue per employee", description: "Productivity gains" },
      { value: "Process cycle time", label: "Process cycle time", description: "Faster completion" },
      { value: "Customer satisfaction", label: "Customer satisfaction", description: "Happier clients" },
      { value: "ROI percentage", label: "ROI percentage", description: "Return on investment" },
    ]
  },
  urgency: {
    label: "Urgency Factors",
    options: [
      { value: "End of quarter", label: "End of quarter", description: "Q4 deadlines approaching" },
      { value: "Budget season", label: "Budget season", description: "Annual planning time" },
      { value: "Competitor advantage", label: "Competitor advantage", description: "Others are automating" },
      { value: "Regulatory deadline", label: "Regulatory deadline", description: "Compliance requirements" },
      { value: "Scaling rapidly", label: "Scaling rapidly", description: "Growing too fast" },
      { value: "Staff turnover", label: "Staff turnover", description: "Losing institutional knowledge" },
      { value: "Peak season coming", label: "Peak season coming", description: "Busy period ahead" },
      { value: "Cost pressures", label: "Cost pressures", description: "Need to reduce expenses" },
    ]
  },
  socialproof: {
    label: "Social Proof Elements",
    options: [
      { value: "500+ companies automated", label: "500+ companies automated", description: "Large customer base" },
      { value: "98% customer satisfaction", label: "98% customer satisfaction", description: "High approval rating" },
      { value: "$2M+ saved for clients", label: "$2M+ saved for clients", description: "Proven financial impact" },
      { value: "Industry leader trusted", label: "Industry leader trusted", description: "Big name endorsement" },
      { value: "5-star rated solution", label: "5-star rated solution", description: "Top reviews" },
      { value: "Case study available", label: "Case study available", description: "Documented success" },
      { value: "Award-winning platform", label: "Award-winning platform", description: "Industry recognition" },
      { value: "10,000+ workflows built", label: "10,000+ workflows built", description: "Extensive experience" },
    ]
  },
  objection: {
    label: "Common Objections",
    multiSelect: true,
    options: [
      { value: "No technical skills needed", label: "No technical skills needed", description: "Easy to use" },
      { value: "Free trial available", label: "Free trial available", description: "Try before buying" },
      { value: "IT approved solution", label: "IT approved solution", description: "Security cleared" },
      { value: "No coding required", label: "No coding required", description: "Visual builder" },
      { value: "Quick implementation", label: "Quick implementation", description: "Fast setup" },
      { value: "Full support included", label: "Full support included", description: "Help available" },
      { value: "Pay as you grow", label: "Pay as you grow", description: "Flexible pricing" },
      { value: "Data stays secure", label: "Data stays secure", description: "Privacy protected" },
    ]
  },
  value: {
    label: "Value Propositions",
    multiSelect: true,
    options: [
      { value: "10x faster processing", label: "10x faster processing", description: "Speed improvement" },
      { value: "50% cost reduction", label: "50% cost reduction", description: "Major savings" },
      { value: "Zero manual errors", label: "Zero manual errors", description: "Perfect accuracy" },
      { value: "24/7 automation", label: "24/7 automation", description: "Always running" },
      { value: "Instant ROI", label: "Instant ROI", description: "Immediate payback" },
      { value: "Seamless integration", label: "Seamless integration", description: "Works with your tools" },
      { value: "Scale infinitely", label: "Scale infinitely", description: "No growth limits" },
      { value: "Real-time insights", label: "Real-time insights", description: "Live dashboards" },
    ]
  }
};

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
  edges,
}: NodePropertiesPanelProps) {
  const nodeData = selectedNode?.data as NodeData | undefined;
  
  const isEmailContextNode = nodeData?.isEmailContext || [
    "persona", "industry", "painpoint", "metric", 
    "urgency", "socialproof", "objection", "value"
  ].includes(selectedNode?.type || "");
  
  // Parse stored contextValue for multi-select types
  const parseContextValue = (value: string | string[] | undefined, nodeType: string | undefined): string[] => {
    if (!value || !nodeType) return [];
    const template = EMAIL_CONTEXT_TEMPLATES[nodeType as keyof typeof EMAIL_CONTEXT_TEMPLATES];
    if (template?.multiSelect) {
      try {
        if (Array.isArray(value)) return value;
        const parsed = JSON.parse(value as string);
        return Array.isArray(parsed) ? parsed : [value as string];
      } catch {
        return (value as string).split(',').map(v => v.trim()).filter(Boolean);
      }
    }
    return Array.isArray(value) ? value : [value as string];
  };
  
  // Helper function to update email context nodes and mark connected sections
  const updateEmailContextNode = (updater: (nodes: Node[]) => Node[]) => {
    if (!isEmailContextNode || !selectedNode) return;
    
    // Find connected email preview nodes
    const connectedEmailNodes = edges
      ?.filter((edge: Edge) => edge.source === selectedNode.id && edge.data?.isEmailContext)
      ?.map((edge: Edge) => {
        const targetNode = nodes.find((n: Node) => n.id === edge.target);
        return targetNode?.type === 'emailPreview' ? { node: targetNode, targetHandle: edge.targetHandle } : null;
      })
      ?.filter(Boolean) || [];
    
    // Update nodes with change detection
    setNodes((currentNodes: Node[]) => {
      let updatedNodes = updater(currentNodes);
      
      // Mark connected email sections as having changes
      connectedEmailNodes.forEach((connection: { node: Node; targetHandle?: string | null } | null) => {
        if (connection && connection.targetHandle) {
          const emailNode = updatedNodes.find((n: Node) => n.id === connection.node.id);
          if (emailNode) {
            const currentConnections = (emailNode.data as { sectionConnections?: EmailSectionConnections }).sectionConnections || {};
            const updatedConnections = markSectionsWithChanges(currentConnections, selectedNode.id);
            
            updatedNodes = updatedNodes.map((n: Node) => 
              n.id === emailNode.id ? {
                ...n,
                data: {
                  ...n.data,
                  sectionConnections: updatedConnections
                }
              } : n
            );
          }
        }
      });
      
      return updatedNodes;
    });
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    
    // Remove the node from the nodes array
    setNodes((prevNodes) => prevNodes.filter(node => node.id !== selectedNode.id));
    
    // Close the properties panel
    onClose();
  };

  return (
    <Sheet
      open={!!selectedNode}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-[480px] sm:w-[540px] p-0 flex flex-col h-screen">
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <SheetTitle>
            {isEmailContextNode ? 'Email Context Node' : 'Node Properties'}
          </SheetTitle>
          <SheetDescription>
            {isEmailContextNode 
              ? 'Configure this email context to influence email generation.'
              : 'Configure the selected node\'s basic settings.'}
          </SheetDescription>
        </SheetHeader>
        
        {selectedNode && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Node Overview - Simplified */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Overview</h3>
                  <Badge 
                    variant={isEmailContextNode ? "secondary" : "outline"}
                    className={cn(
                      "text-xs",
                      isEmailContextNode && "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                    )}
                  >
                    {selectedNode.type?.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID: {selectedNode.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {isEmailContextNode && 
                      "Email context nodes influence how emails are generated by providing additional context about your target audience, pain points, and value propositions."}
                    {!isEmailContextNode && selectedNode.type === "trigger" && 
                      "Triggers start automation workflows when certain events occur."}
                    {!isEmailContextNode && selectedNode.type === "action" && 
                      "Actions perform operations like creating, updating, or sending data."}
                    {!isEmailContextNode && selectedNode.type === "decision" && 
                      "Decisions branch the workflow based on conditions."}
                  </p>
                </div>
              </div>

              {/* Configuration - No card wrapper */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Configuration</h3>
                
                <div>
                  <Label className="text-sm">Label</Label>
                  <Input
                    className="mt-1.5"
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
                </div>

                {/* Email Context Node Configuration - Simplified */}
                {isEmailContextNode && selectedNode.type && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Context Configuration</h4>
                      <Badge variant="outline" className="text-xs">
                        {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
                      </Badge>
                    </div>
                    
                    {(() => {
                      const template = EMAIL_CONTEXT_TEMPLATES[selectedNode.type];
                      if (!template) return null;
                      
                      const currentValues = parseContextValue(nodeData?.contextValue, selectedNode.type);
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {template.label}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                              {template.multiSelect 
                                ? "Select all that apply to your email context"
                                : "Choose the most relevant option"}
                            </p>
                            
                            {/* Single Select - Dropdown */}
                            {!template.multiSelect && (
                              <Select
                                value={currentValues[0] || ""}
                                onValueChange={(value) => {
                                  setNodes((ns) =>
                                    ns.map((n) =>
                                      n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, contextValue: value } }
                                        : n
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select an option..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {template.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{option.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {option.description}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* Multi Select - Checkboxes */}
                            {template.multiSelect && (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {template.options.map((option) => {
                                  const isChecked = currentValues.includes(option.value);
                                  return (
                                    <label
                                      key={option.value}
                                      className="flex items-start space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          let newValues: string[];
                                          if (checked) {
                                            newValues = [...currentValues, option.value];
                                          } else {
                                            newValues = currentValues.filter(v => v !== option.value);
                                          }
                                          const contextValue = JSON.stringify(newValues);
                                          setNodes((ns) =>
                                            ns.map((n) =>
                                              n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, contextValue } }
                                                : n
                                            )
                                          );
                                        }}
                                        className="mt-0.5"
                                      />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium">{option.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {option.description}
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Custom Value Input */}
                          <div className="pt-3 border-t">
                            <Label className="text-sm">Custom Value (Optional)</Label>
                            <Input
                              className="mt-1.5"
                              placeholder="Add custom value..."
                              value={template.multiSelect ? "" : (
                                template.options.find(o => o.value === currentValues[0])
                                  ? "" 
                                  : currentValues[0] || ""
                              )}
                              onChange={(e) => {
                                const customValue = e.target.value;
                                if (!template.multiSelect) {
                                  setNodes((ns) =>
                                    ns.map((n) =>
                                      n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, contextValue: customValue } }
                                        : n
                                    )
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && template.multiSelect && e.currentTarget.value) {
                                  const customValue = e.currentTarget.value;
                                  const newValues = [...currentValues, customValue];
                                  const contextValue = JSON.stringify(newValues);
                                  setNodes((ns) =>
                                    ns.map((n) =>
                                      n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, contextValue } }
                                        : n
                                    )
                                  );
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            {template.multiSelect && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Press Enter to add custom values
                              </p>
                            )}
                          </div>
                          
                          {/* Current Values Display */}
                          {currentValues.length > 0 && (
                            <div className="pt-3 border-t">
                              <Label className="text-sm mb-2 block">
                                Current Values
                              </Label>
                              <div className="flex flex-wrap gap-1">
                                {currentValues.map((value, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {value}
                                    {template.multiSelect && (
                                      <button
                                        onClick={() => {
                                          const newValues = currentValues.filter(v => v !== value);
                                          const contextValue = newValues.length > 0 
                                            ? JSON.stringify(newValues)
                                            : "";
                                          setNodes((ns) =>
                                            ns.map((n) =>
                                              n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, contextValue } }
                                                : n
                                            )
                                          );
                                        }}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs text-muted-foreground pt-3 border-t">
                            <p className="font-medium mb-1 flex items-center gap-1">
                              <ChevronRight className="h-3 w-3" />
                              How this affects emails:
                            </p>
                            {selectedNode.type === "persona" && 
                              "Tailors language and messaging to resonate with this specific audience."}
                            {selectedNode.type === "industry" && 
                              "Uses industry-specific terminology and addresses sector-specific challenges."}
                            {selectedNode.type === "painpoint" && 
                              "Emphasizes solutions to these specific problems in the email content."}
                            {selectedNode.type === "metric" && 
                              "Highlights these success metrics prominently in the value proposition."}
                            {selectedNode.type === "urgency" && 
                              "Creates time-sensitive messaging around this factor."}
                            {selectedNode.type === "socialproof" && 
                              "Incorporates this credibility element to build trust."}
                            {selectedNode.type === "objection" && 
                              "Proactively addresses these concerns to reduce friction."}
                            {selectedNode.type === "value" && 
                              "Emphasizes these specific benefits in the email messaging."}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Decision Node Condition Settings - Simplified */} 
                {!isEmailContextNode && selectedNode.type === "decision" && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <h4 className="text-sm font-medium">Condition Logic</h4>
                    <p className="text-xs text-muted-foreground">
                      Define when to follow the True or False paths.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Condition Type</Label>
                        <Select
                          value={nodeData?.conditionType || "comparison"}
                          onValueChange={(value) => {
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, conditionType: value } }
                                  : n
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comparison">Value Comparison</SelectItem>
                            <SelectItem value="existence">Value Exists</SelectItem>
                            <SelectItem value="text">Text Match</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Field to Check</Label>
                        <Input
                          className="mt-1.5"
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
                      </div>
                      
                      {(nodeData?.conditionType === "comparison" || !nodeData?.conditionType) && (
                        <div>
                          <Label className="text-sm">Operator</Label>
                          <Select
                            value={nodeData?.operator || "equals"}
                            onValueChange={(value) => {
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedNode.id
                                    ? { ...n, data: { ...n.data, operator: value } }
                                    : n
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals (==)</SelectItem>
                              <SelectItem value="notEquals">Not Equals (!=)</SelectItem>
                              <SelectItem value="greaterThan">Greater Than (&gt;)</SelectItem>
                              <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {nodeData?.conditionType !== "existence" && (
                        <div>
                          <Label className="text-sm">Value to Compare</Label>
                          <Input
                            className="mt-1.5"
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
                  </div>
                )}
              </div>

              {/* App Details - Simplified */}
              {!isEmailContextNode && nodeData?.appName && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">App Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
                </div>
              )}

              {/* ROI Contribution - Simplified without card */}
              {!isEmailContextNode && (
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
                  
                  {(() => {
                    const adjustedMinutes = calculateNodeTimeSavings(
                      selectedNode.type as NodeType, 
                      minutesPerRun,
                      nodes,
                      NODE_TIME_FACTORS,
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
                      unitsPerRunNode = selectedNode.type === 'action' ? 1.2 : (selectedNode.type === 'trigger' || selectedNode.type === 'decision' ? 1 : 0.5);
                    } else if (platform === 'n8n') {
                      unitsPerRunNode = 1 / Math.max(1, nodes.filter(n => n.type !== 'group').length);
                    }
                    const monthlyCostNode = unitsPerRunNode * runsPerMonth * costPerUnit;
                    const roiRatioNode = calculateROIRatio(stepValue, monthlyCostNode);

                    return (
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with Delete Button */}
        <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteNode}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Node
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}