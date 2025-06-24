"use client";
import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { PlayCircle, Sparkles, GitBranch, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem, MailOpen, Zap, CheckSquare, Code, Link2 } from "lucide-react";

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
    appName?: string;
    action?: string;
    typeOf?: string;
    platform?: "zapier" | "make" | "n8n";
    isEmailContext?: boolean;
    contextValue?: string;
    contextType?: string;
    category?: string;
    isConnectedToEmail?: boolean;
  };

  const isEmailContext = nodeData.isEmailContext || [
    "persona", "industry", "painpoint", "metric", 
    "urgency", "socialproof", "objection", "value"
  ].includes(type as string);

  const isConnectedToEmail = nodeData.isConnectedToEmail;

  // Platform configurations with improved colors
  const platformConfig = {
    zapier: { icon: Zap, color: "bg-orange-500", textColor: "text-white", name: "Zapier", borderColor: "ring-orange-500/30" },
    make: { icon: CheckSquare, color: "bg-purple-500", textColor: "text-white", name: "Make", borderColor: "ring-purple-500/30" },
    n8n: { icon: Code, color: "bg-red-500", textColor: "text-white", name: "n8n", borderColor: "ring-red-500/30" }
  };

  // Enhanced category colors with better visual hierarchy
  const categoryColors = {
    audience: "border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-500/50",
    problem: "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-500/50",
    value: "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-500/50",
    timing: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-500/50",
    trust: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500/50",
  };

  // Enhanced icon colors with better contrast
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
  const platform = nodeData.platform;
  const PlatformIcon = platform ? platformConfig[platform]?.icon : null;

  return (
    <div
      className={cn(
        "pixel-node group relative focus-ring",
        "min-w-[180px] max-w-[260px] rounded-xl border-2 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02] cursor-pointer",
        selected && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]",
        isConnectedToEmail && "animate-pulse-glow",
        isEmailContext 
          ? (category ? categoryColors[category as keyof typeof categoryColors] : "border-slate-300 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-500/50")
          : (type === "trigger" 
              ? "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-500/50" 
              : type === "action" 
              ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500/50" 
              : "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/50"
            )
      )}
    >
      {/* Handles for email context nodes - positioned left/right */}
      {isEmailContext ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className={cn(
              "!w-4 !h-4 !border-2 !rounded-full transition-all duration-200",
              "!bg-primary !border-primary/70",
              isConnectedToEmail && "!bg-primary !animate-pulse !scale-110"
            )}
          />
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "!w-4 !h-4 !border-2 !rounded-full transition-all duration-200",
              "!bg-primary !border-primary/70",
              isConnectedToEmail && "!bg-primary !animate-pulse !scale-110"
            )}
          />
        </>
      ) : (
        <>
          {/* Regular nodes keep top/bottom handles */}
          <Handle
            type="target"
            position={Position.Top}
            className={cn(
              "!w-3 !h-3 !border-2 !rounded-full",
              "!bg-primary !border-primary/70"
            )}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className={cn(
              "!w-3 !h-3 !border-2 !rounded-full",
              "!bg-primary !border-primary/70"
            )}
          />
        </>
      )}
      
      {/* Platform indicator badge */}
      {platform && PlatformIcon && !isEmailContext && (
        <div 
          className={cn(
            "absolute -top-2 -right-2 rounded-full p-1.5 shadow-md ring-2 ring-white dark:ring-gray-900 transition-all duration-200",
            platformConfig[platform].color,
            platformConfig[platform].borderColor
          )}
          title={`${platformConfig[platform].name} Platform`}
        >
          <PlatformIcon className={cn("h-3.5 w-3.5", platformConfig[platform].textColor)} />
        </div>
      )}

      {/* Email context indicator */}
      {isEmailContext && (
        <div className={cn(
          "absolute -top-2 -right-2 rounded-full p-1 shadow-md ring-2 ring-white dark:ring-gray-900 transition-all duration-200",
          isConnectedToEmail ? "bg-primary animate-pulse" : "bg-primary/80"
        )} title={isConnectedToEmail ? "Connected to Email" : "Email Context Node"}>
          {isConnectedToEmail ? <Link2 className="h-3 w-3 text-white" /> : <MailOpen className="h-3 w-3 text-white" />}
        </div>
      )}
      
      <div className="flex flex-col p-4 space-y-3">
        {/* Header with icon and node type */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors duration-200",
            isEmailContext 
              ? (category ? "bg-white/60 dark:bg-gray-900/60" : "bg-white/60 dark:bg-gray-900/60")
              : (type === "trigger" 
                  ? "bg-white/60 dark:bg-gray-900/60" 
                  : type === "action" 
                  ? "bg-white/60 dark:bg-gray-900/60" 
                  : "bg-white/60 dark:bg-gray-900/60"
                )
          )}>
            <Icon 
              className={cn(
                "h-5 w-5",
                isEmailContext 
                  ? (category ? iconColors[category as keyof typeof iconColors] : "text-slate-600 dark:text-slate-400")
                  : (type === "trigger" 
                      ? "text-green-600 dark:text-green-400" 
                      : type === "action" 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-amber-600 dark:text-amber-400"
                    )
              )}
            />
          </div>
          <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
            {type === "trigger" ? "Trigger" : 
             type === "action" ? "Action" : 
             type === "decision" ? "Decision" : 
             type}
          </span>
        </div>

        {/* App name (prominently displayed) */}
        {nodeData.appName && (
          <div className="font-display font-bold text-lg text-foreground leading-tight" title={nodeData.appName}>
            {nodeData.appName}
          </div>
        )}
        
        {/* Node label */}
        <div className="font-medium text-sm text-foreground/90 leading-tight" title={nodeData.label || "Node"}>
          {nodeData.label || "Node"}
        </div>

        {/* Action or context value */}
        {(nodeData.action || nodeData.contextValue) && (
          <div className="text-xs text-muted-foreground leading-tight" 
               title={nodeData.action || nodeData.contextValue}>
            {nodeData.action || nodeData.contextValue}
          </div>
        )}

        {/* Type indicator for specific operations */}
        {nodeData.typeOf && (
          <div className="flex">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide bg-muted text-muted-foreground border border-border">
              {nodeData.typeOf}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 