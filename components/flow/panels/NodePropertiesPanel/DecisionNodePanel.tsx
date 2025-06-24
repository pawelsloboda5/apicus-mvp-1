"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PanelWrapper } from "../shared/PanelWrapper";
import { Node } from "@xyflow/react";
import { NodeData } from "@/lib/types";

interface DecisionNodePanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function DecisionNodePanel({ node, setNodes }: DecisionNodePanelProps) {
  const nodeData = node.data as NodeData;

  return (
    <PanelWrapper 
      title="Condition Logic"
      description="Define when to follow the True or False paths."
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
          <Label className="text-sm">Condition Type</Label>
          <Select
            value={nodeData?.conditionType || "comparison"}
            onValueChange={(value) => {
              setNodes((ns) =>
                ns.map((n) =>
                  n.id === node.id
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
                  n.id === node.id
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
                    n.id === node.id
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
                    n.id === node.id
                      ? { ...n, data: { ...n.data, compareValue } }
                      : n
                  )
                );
              }}
            />
          </div>
        )}
        
        <div className="mt-3 text-xs text-muted-foreground rounded-lg bg-muted/30 p-3">
          <p className="mb-1">
            <span className="font-medium text-green-600 dark:text-green-400">True path:</span> Condition is met
          </p>
          <p>
            <span className="font-medium text-red-600 dark:text-red-400">False path:</span> Condition is not met
          </p>
        </div>
      </div>
    </PanelWrapper>
  );
} 