"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Node, Edge } from "@xyflow/react";
import { NodeData } from "@/lib/types";
import { markSectionsWithChanges, EmailSectionConnections } from "@/lib/flow-utils";
import { EMAIL_CONTEXT_TEMPLATES, EmailContextTemplate } from "@/lib/utils/constants";

interface EmailContextNodePanelProps {
  node: Node;
  nodes: Node[];
  edges?: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}



export function EmailContextNodePanel({ node, nodes, edges, setNodes }: EmailContextNodePanelProps) {
  // Safely cast node data with fallbacks for required properties
  const nodeData = node.data as unknown as NodeData;
  const nodeType = node.type || "";
  const template = EMAIL_CONTEXT_TEMPLATES[nodeType];

  // Parse stored contextValue for multi-select types
  const parseContextValue = (value: string | string[] | undefined): string[] => {
    if (!value || !nodeType) return [];
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
    // Find connected email preview nodes
    const connectedEmailNodes = edges
      ?.filter((edge: Edge) => edge.source === node.id && edge.data?.isEmailContext)
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
            const updatedConnections = markSectionsWithChanges(currentConnections, node.id);
            
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

  const currentValues = parseContextValue(nodeData?.contextValue);

  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Context Node</CardTitle>
          <p className="text-sm text-muted-foreground">Configure this email context to influence email generation.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unknown email context type: {nodeType}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Context Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">Configure this email context to influence email generation.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
        <Label className="text-sm">Label</Label>
        <Input
          className="mt-1.5"
          value={nodeData?.label || ""}
          onChange={(e) => {
            const newLabel = e.target.value;
            updateEmailContextNode((ns) =>
              ns.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, label: newLabel } }
                  : n
              )
            );
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">{template.label}</Label>
          <Badge variant="outline" className="text-xs">
            {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {template.multiSelect 
            ? "Select all that apply to your email context"
            : "Choose the most relevant option"}
        </p>
        
        {/* Single Select - Dropdown */}
        {!template.multiSelect && (
          <Select
            value={currentValues[0] || ""}
            onValueChange={(value) => {
              updateEmailContextNode((ns) =>
                ns.map((n) =>
                  n.id === node.id
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
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 border rounded-lg p-2">
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
                      updateEmailContextNode((ns) =>
                        ns.map((n) =>
                          n.id === node.id
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
      <div>
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
              updateEmailContextNode((ns) =>
                ns.map((n) =>
                  n.id === node.id
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
              updateEmailContextNode((ns) =>
                ns.map((n) =>
                  n.id === node.id
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
        <div>
          <Label className="text-sm mb-2 block">Current Values</Label>
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
                      updateEmailContextNode((ns) =>
                        ns.map((n) =>
                          n.id === node.id
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
      
      <div className="text-xs text-muted-foreground pt-3 border-t">
        <p className="font-medium mb-1 flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          How this affects emails:
        </p>
        <p>
          {nodeType === "persona" && 
            "Tailors language and messaging to resonate with this specific audience."}
          {nodeType === "industry" && 
            "Uses industry-specific terminology and addresses sector-specific challenges."}
          {nodeType === "painpoint" && 
            "Emphasizes solutions to these specific problems in the email content."}
          {nodeType === "metric" && 
            "Highlights these success metrics prominently in the value proposition."}
          {nodeType === "urgency" && 
            "Creates time-sensitive messaging around this factor."}
          {nodeType === "socialproof" && 
            "Incorporates this credibility element to build trust."}
          {nodeType === "objection" && 
            "Proactively addresses these concerns to reduce friction."}
          {nodeType === "value" && 
            "Emphasizes these specific benefits in the email messaging."}
        </p>
      </div>
      </CardContent>
    </Card>
  );
} 