"use client";
import React, { useRef, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { 
  PlayCircle, Sparkles, GitBranch, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem, MailOpen, Zap, CheckSquare, Code, Link2, CreditCard,
  Filter, Search, FileInput, FileOutput, Database, MessageSquare, Wrench, Settings, Webhook, Globe, Terminal, Layers, Package, Hash, Bot, FileText, FileCode, Activity
} from "lucide-react";
import { calculateNodeWidth, generateContentHash } from "@/lib/utils/constants";
import Image from "next/image";

// Enhanced fallback icons for different operation types
const getFallbackIcon = (typeOf?: string, action?: string, appName?: string) => {
  // Check app name for more specific icons
  const lowerAppName = appName?.toLowerCase() || '';
  if (lowerAppName.includes('http') || lowerAppName.includes('webhook')) return Webhook;
  if (lowerAppName.includes('openai') || lowerAppName.includes('claude') || lowerAppName.includes('gpt')) return Bot;
  if (lowerAppName.includes('database') || lowerAppName.includes('sql')) return Database;
  if (lowerAppName.includes('email') || lowerAppName.includes('gmail') || lowerAppName.includes('outlook')) return MessageSquare;
  if (lowerAppName.includes('sheets') || lowerAppName.includes('excel')) return FileText;
  if (lowerAppName.includes('slack') || lowerAppName.includes('teams')) return Hash;
  if (lowerAppName.includes('api')) return Globe;
  
  // Check typeOf first for more specific matches
  if (typeOf === 'filter') return Filter;
  if (typeOf === 'search') return Search;
  if (typeOf === 'read' || typeOf === 'fetch') return FileInput;
  if (typeOf === 'write' || typeOf === 'create' || typeOf === 'update') return FileOutput;
  if (typeOf === 'data_processing' || typeOf === 'transform' || typeOf === 'parse') return Database;
  if (typeOf === 'messaging' || typeOf === 'send' || typeOf === 'notification') return MessageSquare;
  if (typeOf === 'webhook') return Webhook;
  if (typeOf === 'api' || typeOf === 'request') return Globe;
  if (typeOf === 'script' || typeOf === 'code') return Terminal;
  if (typeOf === 'aggregate' || typeOf === 'merge') return Layers;
  if (typeOf === 'package' || typeOf === 'bundle') return Package;
  
  // Check action as fallback
  if (action?.includes('filter')) return Filter;
  if (action?.includes('search') || action?.includes('find')) return Search;
  if (action?.includes('process') || action?.includes('transform')) return Wrench;
  if (action?.includes('config') || action?.includes('setting')) return Settings;
  if (action?.includes('analyze') || action?.includes('metrics')) return Activity;
  if (action?.includes('generate') || action?.includes('create')) return FileCode;
  
  // Default to Sparkles for generic actions
  return Sparkles;
};

// Logo component with lazy loading and caching
const AppLogo: React.FC<{ 
  logoUrl?: string; 
  appName?: string;
  typeOf?: string;
  action?: string;
  size?: number;
}> = ({ logoUrl, appName, typeOf, action, size = 32 }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const FallbackIcon = getFallbackIcon(typeOf, action, appName);
  
  if (!logoUrl || imageError) {
    return <FallbackIcon className="text-current" style={{ width: size, height: size }} />;
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted rounded-md" />
      )}
      <Image
        src={logoUrl}
        alt={appName || 'App logo'}
        width={size}
        height={size}
        className="rounded-md object-contain"
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        unoptimized // For external URLs
      />
    </div>
  );
};

export function PixelNode({ data, type, selected, id }: NodeProps) {
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
    appId?: string;
    calculatedWidth?: number;
    calculatedHeight?: number;
    lastContentHash?: string;
    logoUrl?: string;
    pricingData?: {
      hasFreeTier?: boolean;
      lowestMonthlyPrice?: number | null;
      priceModelType?: string[];
      isPricingPublic?: boolean;
    };
  };

  // DEBUG: Log node data for nodes with appName
  if (nodeData.appName) {
    console.log(`[PixelNode ${id}] Rendering:`, {
      appName: nodeData.appName,
      appId: nodeData.appId,
      logoUrl: nodeData.logoUrl,
      hasPricingData: !!nodeData.pricingData,
      pricingData: nodeData.pricingData
    });
  }

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

  // Calculate dynamic width based on content
  const nodeRef = useRef<HTMLDivElement>(null);
  const [calculatedWidth, setCalculatedWidth] = useState<number>(
    nodeData.calculatedWidth || 180
  );

  useEffect(() => {
    const primaryText = nodeData.appName || nodeData.label || type || '';
    const secondaryText = nodeData.action || nodeData.contextValue || '';
    const contentString = `${primaryText}${secondaryText}${nodeData.typeOf || ''}`;
    const contentHash = generateContentHash(contentString);
    
    // Only recalculate if content has changed
    if (contentHash !== nodeData.lastContentHash) {
      const newWidth = calculateNodeWidth(
        primaryText,
        secondaryText,
        !!nodeData.typeOf,
        true, // All nodes have icons
        isEmailContext,
        !!nodeData.pricingData // Pass hasPricing parameter
      );
      
      setCalculatedWidth(newWidth);
      
      // Update node data with new width and content hash
      // This will be handled by the parent component through a callback
      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
        
        // Dispatch a custom event to notify parent about width change
        const event = new CustomEvent('nodeWidthChanged', {
          detail: {
            nodeId: id,
            width: newWidth,
            height: nodeData.calculatedHeight || 60,
            contentHash
          }
        });
        nodeRef.current.dispatchEvent(event);
      }
    }
  }, [
    nodeData.appName,
    nodeData.label,
    nodeData.action,
    nodeData.contextValue,
    nodeData.typeOf,
    nodeData.lastContentHash,
    nodeData.pricingData, // Add as dependency
    type,
    isEmailContext,
    id
  ]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "pixel-node group relative focus-ring",
        "rounded-xl border-2 shadow-sm transition-all duration-200",
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
      style={{ width: `${calculatedWidth}px` }}
    >
      {/* All nodes now have left/right handles with larger hitboxes */}
      {/* Target handle (left) with invisible expanded hitbox */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "!w-6 !h-6 !border-2 !rounded-full transition-all duration-200 !relative",
            "!bg-primary !border-primary/50 hover:!border-primary hover:!scale-125",
            "after:content-[''] after:absolute after:-inset-2 after:rounded-full",
            isConnectedToEmail && "!bg-primary !animate-pulse !scale-110"
          )}
          style={{ position: 'relative' }}
        />
      </div>
      
      {/* Source handle (right) with invisible expanded hitbox */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "!w-6 !h-6 !border-2 !rounded-full transition-all duration-200 !relative",
            "!bg-primary !border-primary/50 hover:!border-primary hover:!scale-125",
            "after:content-[''] after:absolute after:-inset-2 after:rounded-full",
            isConnectedToEmail && "!bg-primary !animate-pulse !scale-110"
          )}
          style={{ position: 'relative' }}
        />
      </div>
      
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
        {/* Simplified header - only show if email context */}
        {isEmailContext ? (
          <div className="flex items-center gap-2 mb-1">
            <Icon 
              className={cn(
                "h-4 w-4",
                category ? iconColors[category as keyof typeof iconColors] : "text-slate-600 dark:text-slate-400"
              )}
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {type}
            </span>
          </div>
        ) : (
          /* Main content for regular nodes */
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-200 mt-0.5",
              type === "trigger" 
                ? "bg-gradient-to-br from-green-500/20 to-green-600/20 dark:from-green-500/30 dark:to-green-600/30" 
                : type === "action" 
                ? "bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-500/30 dark:to-blue-600/30" 
                : "bg-gradient-to-br from-amber-500/20 to-amber-600/20 dark:from-amber-500/30 dark:to-amber-600/30"
            )}>
              {/* Show app logo if available, otherwise show type icon */}
              {nodeData.appName && nodeData.logoUrl ? (
                <div className={cn(
                  "p-1 rounded-lg",
                  "bg-white/70 dark:bg-black/30",
                  "backdrop-blur-sm",
                  "border border-white/20 dark:border-white/10",
                  "shadow-sm"
                )}>
                  <AppLogo 
                    logoUrl={nodeData.logoUrl} 
                    appName={nodeData.appName}
                    typeOf={nodeData.typeOf}
                    action={nodeData.action}
                    size={32}
                  />
                </div>
              ) : (
                <Icon 
                  className={cn(
                    "h-6 w-6",
                    type === "trigger" 
                      ? "text-green-600 dark:text-green-400" 
                      : type === "action" 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-amber-600 dark:text-amber-400"
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* App name or label as primary text */}
              <div className="font-display font-bold text-base text-foreground leading-tight line-clamp-1" 
                   title={nodeData.appName || nodeData.label || type}>
                {nodeData.appName || nodeData.label || type}
              </div>
              
              {/* Action or secondary info */}
              {nodeData.action && nodeData.appName && (
                <div className="text-sm text-foreground/70 mt-1 line-clamp-1" title={nodeData.action}>
                  {nodeData.action}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email context content */}
        {isEmailContext && (
          <div className="space-y-2">
            <div className="font-medium text-sm text-foreground leading-tight" title={nodeData.label || type}>
              {nodeData.label || type}
            </div>
            {nodeData.contextValue && (
              <div className="text-xs bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-lg font-mono">
                {nodeData.contextValue}
              </div>
            )}
          </div>
        )}

        {/* Bottom section with pricing and type badges */}
        <div className="flex items-center justify-between gap-2">
          {/* Type badge for operations */}
          {nodeData.typeOf && !isEmailContext && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">
              {nodeData.typeOf}
            </span>
          )}
          
          {/* Pricing indicator */}
          {nodeData.pricingData && !isEmailContext && (
            <div className="flex items-center gap-1 ml-auto">
              {nodeData.pricingData.hasFreeTier ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 dark:bg-green-500/20 rounded-full" title="Free tier available">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Free</span>
                </div>
              ) : nodeData.pricingData.lowestMonthlyPrice ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full" 
                     title={`From $${nodeData.pricingData.lowestMonthlyPrice}/mo`}>
                  <span className="text-xs font-medium text-primary">
                    ${nodeData.pricingData.lowestMonthlyPrice}/mo
                  </span>
                </div>
              ) : nodeData.pricingData.isPricingPublic === false ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded-full" title="Custom pricing">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Custom</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 