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

  // Platform configurations with better contrast
  const platformConfig = {
    zapier: { icon: Zap, color: "bg-orange-600", textColor: "text-white", name: "Zapier" },
    make: { icon: CheckSquare, color: "bg-purple-600", textColor: "text-white", name: "Make" },
    n8n: { icon: Code, color: "bg-red-600", textColor: "text-white", name: "n8n" }
  };

  // Enhanced category colors with better contrast
  const categoryColors = {
    audience: "border-purple-400 bg-purple-100 dark:bg-purple-900/40 dark:border-purple-400",
    problem: "border-red-400 bg-red-100 dark:bg-red-900/40 dark:border-red-400",
    value: "border-green-400 bg-green-100 dark:bg-green-900/40 dark:border-green-400",
    timing: "border-orange-400 bg-orange-100 dark:bg-orange-900/40 dark:border-orange-400",
    trust: "border-blue-400 bg-blue-100 dark:bg-blue-900/40 dark:border-blue-400",
  };

  // Enhanced icon colors for better contrast
  const iconColors = {
    audience: "text-purple-700 dark:text-purple-300",
    problem: "text-red-700 dark:text-red-300",
    value: "text-green-700 dark:text-green-300",
    timing: "text-orange-700 dark:text-orange-300",
    trust: "text-blue-700 dark:text-blue-300",
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
        "pixel-node group relative",
        "min-w-[170px] max-w-[240px] rounded-lg border-2 shadow-md",
        "transition-all duration-200 hover:shadow-lg",
        selected && "ring-2 ring-primary ring-offset-2",
        isConnectedToEmail && "animate-pulse-glow",
        isEmailContext 
          ? (category ? categoryColors[category as keyof typeof categoryColors] : "border-slate-400 bg-slate-100 dark:bg-slate-800 dark:border-slate-500")
          : (type === "trigger" 
              ? "border-green-400 bg-green-50 dark:bg-green-900/30 dark:border-green-400" 
              : type === "action" 
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400" 
              : "border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-400"
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
              "!w-3 !h-3 !border-2",
              "!bg-purple-500 !border-purple-700",
              isConnectedToEmail && "!bg-purple-600 !animate-pulse"
            )}
          />
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "!w-3 !h-3 !border-2",
              "!bg-purple-500 !border-purple-700",
              isConnectedToEmail && "!bg-purple-600 !animate-pulse"
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
              "!w-2 !h-2 !border-2",
              "!bg-primary !border-primary-foreground"
            )}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className={cn(
              "!w-2 !h-2 !border-2",
              "!bg-primary !border-primary-foreground"
            )}
          />
        </>
      )}
      
      {/* Platform indicator badge */}
      {platform && PlatformIcon && !isEmailContext && (
        <div 
          className={cn(
            "absolute -top-2 -right-2 rounded-full p-1.5 shadow-md ring-2 ring-white dark:ring-gray-900",
            platformConfig[platform].color
          )}
          title={`${platformConfig[platform].name} Platform`}
        >
          <PlatformIcon className={cn("h-3 w-3", platformConfig[platform].textColor)} />
        </div>
      )}

      {/* Email context indicator */}
      {isEmailContext && (
        <div className={cn(
          "absolute -top-1.5 -right-1.5 rounded-full p-0.5 shadow-md ring-2 ring-white dark:ring-gray-900",
          isConnectedToEmail ? "bg-purple-700 animate-pulse" : "bg-purple-600"
        )} title={isConnectedToEmail ? "Connected to Email" : "Email Context Node"}>
          {isConnectedToEmail ? <Link2 className="h-2.5 w-2.5 text-white" /> : <MailOpen className="h-2.5 w-2.5 text-white" />}
        </div>
      )}
      
      <div className="flex flex-col p-3 space-y-2.5">
        {/* Header with icon and node type */}
        <div className="flex items-center gap-2">
          <Icon 
            className={cn(
              "h-4 w-4 flex-shrink-0",
              isEmailContext 
                ? (category ? iconColors[category as keyof typeof iconColors] : "text-slate-600 dark:text-slate-400")
                : (type === "trigger" 
                    ? "text-green-700 dark:text-green-300" 
                    : type === "action" 
                    ? "text-blue-700 dark:text-blue-300" 
                    : "text-amber-700 dark:text-amber-300"
                  )
            )}
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {type === "trigger" ? "Trigger" : 
             type === "action" ? "Action" : 
             type === "decision" ? "Decision" : 
             type}
          </span>
        </div>

        {/* App name (prominently displayed) */}
        {nodeData.appName && (
          <div className="font-bold text-base text-slate-900 dark:text-slate-100 truncate leading-tight" title={nodeData.appName}>
            {nodeData.appName}
          </div>
        )}
        
        {/* Node label */}
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate leading-tight" title={nodeData.label || "Node"}>
          {nodeData.label || "Node"}
        </div>

        {/* Action or context value */}
        {(nodeData.action || nodeData.contextValue) && (
          <div className="text-xs text-slate-600 dark:text-slate-300 truncate leading-tight" 
               title={nodeData.action || nodeData.contextValue}>
            {nodeData.action || nodeData.contextValue}
          </div>
        )}

        {/* Type indicator for specific operations */}
        {nodeData.typeOf && (
          <div className="inline-flex">
            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md font-semibold uppercase tracking-wide">
              {nodeData.typeOf}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 