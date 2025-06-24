"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PanelWrapper } from "../shared/PanelWrapper";
import { Node } from "@xyflow/react";
import { NodeData } from "@/lib/types";

interface DefaultNodePanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function DefaultNodePanel({ node, setNodes }: DefaultNodePanelProps) {
  const nodeData = node.data as NodeData;

  return (
    <PanelWrapper 
      title="Node Configuration"
      description="Configure the basic settings for this node."
    >
      <div className="space-y-4">
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
            value={nodeData?.description || ""}
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

        {nodeData?.customFields && Object.keys(nodeData.customFields).length > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">Custom Fields</Label>
            <div className="space-y-3">
              {Object.entries(nodeData.customFields).map(([key, value]) => (
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
                                    ...nodeData.customFields,
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
      </div>
    </PanelWrapper>
  );
} 