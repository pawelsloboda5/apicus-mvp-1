"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Node } from "@xyflow/react";
import { NodeData } from "@/lib/types";

interface DefaultNodePanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function DefaultNodePanel({ node, setNodes }: DefaultNodePanelProps) {
  // Safely cast node data with fallbacks for required properties
  const nodeData = node.data as unknown as NodeData;
  // Access generic node data for properties not in NodeData interface
  const genericNodeData = node.data as Record<string, unknown>;
  
  // Check if custom fields exist and are valid
  const hasCustomFields = Boolean(
    genericNodeData.customFields && 
    typeof genericNodeData.customFields === 'object' && 
    genericNodeData.customFields !== null &&
    Object.keys(genericNodeData.customFields as Record<string, unknown>).length > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Node Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">Configure the basic settings for this node.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Label</Label>
          <Input
            className="mt-1.5"
            value={nodeData?.label || ""}
            onChange={(e) => {
              const newLabel = e.target.value;
              setNodes((ns) =>
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
          <Label className="text-sm">Description (Optional)</Label>
          <Input
            className="mt-1.5"
            placeholder="Add a description for this node..."
            value={(genericNodeData.description as string) || ""}
            onChange={(e) => {
              const description = e.target.value;
              setNodes((ns) =>
                ns.map((n) =>
                  n.id === node.id
                    ? { ...n, data: { ...n.data, description } }
                    : n
                )
              );
            }}
          />
        </div>

        {hasCustomFields && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">Custom Fields</Label>
            <div className="space-y-3">
              {Object.entries(genericNodeData.customFields as Record<string, unknown>).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    className="mt-1"
                    value={String(value)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setNodes((ns) =>
                        ns.map((n) =>
                          n.id === node.id
                            ? { 
                                ...n, 
                                data: { 
                                  ...n.data, 
                                  customFields: {
                                    ...(genericNodeData.customFields as Record<string, unknown>),
                                    [key]: newValue
                                  }
                                } 
                              }
                            : n
                        )
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 