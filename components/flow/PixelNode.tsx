"use client";
import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { PlayCircle, Sparkles, GitBranch, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem, MailOpen } from "lucide-react";

export function PixelNode({ data, type, selected }: NodeProps) {
  const Icon = 
    type === "trigger" ? PlayCircle :
    type === "action" ? Sparkles :
    type === "decision" ? GitBranch :
    type === "persona" ? User :
    type === "industry" ? Building :
    type === "painpoint" ? AlertCircle :
    type === "metric" ? TrendingUp :
    type === "urgency" ? Clock :
    type === "socialproof" ? Award :
    type === "objection" ? Shield :
    type === "value" ? Gem :
    Sparkles;

  const nodeData = data as {
    label?: string;
    isEmailContext?: boolean;
    contextValue?: string;
    contextType?: string;
    category?: string;
  };

  const isEmailContext = nodeData.isEmailContext || [
    "persona", "industry", "painpoint", "metric", 
    "urgency", "socialproof", "objection", "value"
  ].includes(type as string);

  const categoryColors = {
    audience: "border-purple-500/50 bg-purple-50 dark:bg-purple-950/20",
    problem: "border-red-500/50 bg-red-50 dark:bg-red-950/20",
    value: "border-green-500/50 bg-green-50 dark:bg-green-950/20",
    timing: "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20",
    trust: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20",
  };

  const iconColors = {
    audience: "text-purple-600 dark:text-purple-400",
    problem: "text-red-600 dark:text-red-400",
    value: "text-green-600 dark:text-green-400",
    timing: "text-orange-600 dark:text-orange-400",
    trust: "text-blue-600 dark:text-blue-400",
  };

  const getCategory = (nodeType: string) => {
    switch(nodeType) {
      case "persona":
      case "industry":
        return "audience";
      case "painpoint":
        return "problem";
      case "metric":
      case "value":
        return "value";
      case "urgency":
        return "timing";
      case "socialproof":
      case "objection":
        return "trust";
      default:
        return null;
    }
  };

  const category = getCategory(type as string);

  return (
    <div
      className={cn(
        "pixel-node group relative",
        "min-w-[150px] rounded-md border-2 shadow-sm",
        "transition-all duration-200",
        selected && "ring-2 ring-primary ring-offset-2",
        isEmailContext 
          ? (category ? categoryColors[category as keyof typeof categoryColors] : "border-gray-300 bg-gray-50 dark:bg-gray-900")
          : (type === "trigger" 
              ? "border-secondary/50 bg-secondary/30" 
              : type === "action" 
              ? "border-primary/50 bg-primary/20" 
              : "border-accent/50 bg-accent/20"
            )
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "!w-2 !h-2 !border-2",
          isEmailContext 
            ? "!bg-purple-400 !border-purple-600"
            : "!bg-primary !border-primary-foreground"
        )}
      />
      
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            isEmailContext 
              ? (category ? iconColors[category as keyof typeof iconColors] : "text-gray-600")
              : "text-foreground"
          )}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{nodeData.label || "Node"}</span>
          {nodeData.contextValue && (
            <span className="text-xs text-muted-foreground truncate mt-0.5">
              {nodeData.contextValue}
            </span>
          )}
        </div>
        {isEmailContext && (
          <div className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white rounded-full p-0.5" title="Email Context Node">
            <MailOpen className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-2 !h-2 !border-2",
          isEmailContext 
            ? "!bg-purple-400 !border-purple-600"
            : "!bg-primary !border-primary-foreground"
        )}
      />
    </div>
  );
} 