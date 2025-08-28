import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  TrendingUp,
  Clock,
  Target,
  Zap,
  FileJson,
  FileText,
  Copy,
  CheckSquare,
  Code,
  Sparkles,
  Loader2,
  Filter,
  Search,
  FileInput,
  FileOutput,
  Database,
  MessageSquare,
  Wrench,
  Settings,
  Cloud,
  Globe
} from 'lucide-react';
import { WorkflowStep } from '@/app/build/hooks/useROIGeneration';
import { Handle, Position } from '@xyflow/react';
import { pricing } from '@/app/api/data/pricing';
import { calculatePlatformCost } from '@/lib/roi-utils';
import { Node } from '@xyflow/react';
import { NodeData, AppPricingData } from '@/lib/types';
import Image from 'next/image';
import { 
  calculateROIRatio,
  formatROIRatio,
  calculateAppCosts,
} from '@/lib/roi-utils';

export interface ROIReportNodeData {
  nodeTitle?: string;
  isLoading?: boolean;
  
  // Report details
  reportTitle?: string;
  clientName?: string;
  projectName?: string;
  generatedDate?: Date;
  
  // Workflow steps
  workflowSteps?: WorkflowStep[];
  
  // Core metrics
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  platform?: 'zapier' | 'make' | 'n8n';
  
  // Calculated values
  timeValue?: number;
  riskValue?: number;
  revenueValue?: number;
  platformCost?: number;
  netROI?: number;
  roiRatio?: number;
  paybackPeriod?: number;
  
  // Performance metrics
  confidence?: number;
  breakEvenMonth?: number;
  
  // Visual customization
  colorScheme?: 'zapier' | 'make' | 'n8n' | 'custom';
  showPlatformComparison?: boolean;
  showRevenueBreakdown?: boolean;
  
  // Business impact
  businessImpact?: string;
  keyBenefits?: string[];
  
  // Risk & Compliance settings
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  
  // Revenue Uplift settings
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  
  // Task configuration
  taskType?: string;
  taskMultiplier?: number;
  
  // Workflow nodes for apps extraction
  nodes?: Node[];
  
  // Handlers
  onGenerateReport?: () => Promise<void>;
  onRegenerateSection?: (section: string) => Promise<void>;
  
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

interface ROIReportNodeProps {
  id: string;
  data: ROIReportNodeData;
}

// Platform configurations
const PLATFORM_CONFIG = {
  zapier: { 
    name: 'Zapier',
    icon: Zap, 
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  make: { 
    name: 'Make',
    icon: CheckSquare, 
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  n8n: { 
    name: 'n8n',
    icon: Code, 
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  }
};

// Extended fallback icons for different operation types
const getFallbackIcon = (typeOf?: string, action?: string, appName?: string) => {
  // Check app name for specific services
  if (appName?.toLowerCase().includes('gmail')) return MessageSquare;
  if (appName?.toLowerCase().includes('sheets')) return Database;
  if (appName?.toLowerCase().includes('slack')) return MessageSquare;
  if (appName?.toLowerCase().includes('hubspot')) return Database;
  
  // Check typeOf first
  if (typeOf === 'filter') return Filter;
  if (typeOf === 'search') return Search;
  if (typeOf === 'read' || typeOf === 'fetch') return FileInput;
  if (typeOf === 'write' || typeOf === 'create') return FileOutput;
  if (typeOf === 'data_processing' || typeOf === 'transform') return Database;
  if (typeOf === 'messaging' || typeOf === 'send') return MessageSquare;
  if (typeOf === 'webhook') return Globe;
  if (typeOf === 'api') return Cloud;
  
  // Check action as fallback
  if (action?.includes('filter')) return Filter;
  if (action?.includes('search')) return Search;
  if (action?.includes('process')) return Wrench;
  if (action?.includes('config')) return Settings;
  
  // Default to Sparkles
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
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg",
        "bg-muted/30",
        "text-muted-foreground"
      )} style={{ width: size, height: size }}>
        <FallbackIcon className="h-5 w-5" />
      </div>
    );
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted rounded-lg" />
      )}
      <Image
        src={logoUrl}
        alt={appName || 'App logo'}
        width={size}
        height={size}
        className="rounded-lg object-contain"
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        unoptimized // For external URLs
      />
    </div>
  );
};

export const ROIReportNode: React.FC<ROIReportNodeProps> = ({ data }) => {
  const { 
    nodeTitle = "ROI Analysis Report", 
    isLoading = false,
    projectName = "Automation Project",
    clientName = "Your Automation Agency",
    generatedDate = new Date(),
    runsPerMonth = 250,
    minutesPerRun = 3,
    hourlyRate = 40,
    platform = 'zapier',
    platformCost = 99,
    netROI = 5000,
    roiRatio = 10,
    paybackPeriod = 7,
    confidence = 85,
    businessImpact = "",
    timeValue = 500,
    riskValue = 0,
    revenueValue = 4500,
    showPlatformComparison = true,
    nodes = [],
  } = data;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(nodeTitle);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [subtitleValue, setSubtitleValue] = useState(clientName);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingImpact, setIsGeneratingImpact] = useState(false);
  const [businessImpactValue, setBusinessImpactValue] = useState(businessImpact);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isPositiveROI = netROI > 0;
  const hoursSaved = (runsPerMonth * minutesPerRun) / 60;
  const weeklyHours = hoursSaved / 4.33; // Convert monthly to weekly
  const breakEvenRuns = platformCost > 0 && timeValue > 0 
    ? Math.ceil(platformCost / (timeValue / runsPerMonth))
    : 0;

  // Extract unique apps with their logos and pricing data
  const uniqueApps = React.useMemo(() => {
    const appsMap = new Map<string, {
      appName: string;
      logoUrl?: string;
      typeOf?: string;
      action?: string;
      appId?: string;
      pricingData?: {
        hasFreeTier?: boolean;
        lowestMonthlyPrice?: number | null;
        priceModelType?: string[];
        isPricingPublic?: boolean;
        hasUsageBasedPricing?: boolean;
        currency?: string;
        appName?: string;
      };
    }>();
    
    if (nodes && nodes.length > 0) {
      nodes.forEach(node => {
        const nodeData = node.data as unknown as NodeData;
        if (nodeData?.appName) {
          appsMap.set(nodeData.appName, {
            appName: nodeData.appName,
            appId: nodeData.appId,
            logoUrl: nodeData.logoUrl,
            typeOf: nodeData.typeOf,
            action: nodeData.action,
            pricingData: nodeData.pricingData,
          });
        }
      });
    }
    return Array.from(appsMap.values());
  }, [nodes]);

  // Calculate app costs
  const appCosts = React.useMemo(() => {
    if (!uniqueApps.length) return 0;
    
    // Create a simplified pricing map from the unique apps
    const simplifiedPricingMap: Record<string, AppPricingData> = {};
    uniqueApps.forEach(app => {
      if (app.appId && app.pricingData) {
        simplifiedPricingMap[app.appId] = {
          appId: app.appId,
          appName: app.appName,
          appSlug: '', // Not needed for cost calculation
          hasFreeTier: app.pricingData.hasFreeTier || false,
          hasFreeTrial: false, // Not available in simplified data
          currency: app.pricingData.currency || 'USD',
          lowestMonthlyPrice: app.pricingData.lowestMonthlyPrice || 0,
          highestMonthlyPrice: 0, // Not available in simplified data
          tierCount: 0, // Not available in simplified data
          hasUsageBasedPricing: app.pricingData.hasUsageBasedPricing || false,
          hasAIFeatures: false, // Not available in simplified data
        };
      }
    });
    
    // Calculate costs for apps that have pricing data
    return calculateAppCosts(simplifiedPricingMap);
  }, [uniqueApps]);

  // Include app costs in total costs
  const totalCosts = platformCost + appCosts;
  const adjustedNetROI = netROI - appCosts; // Adjust net ROI to account for app costs
  const adjustedROIRatio = calculateROIRatio(timeValue + riskValue + revenueValue, platformCost, appCosts);

  // Calculate platform costs for all platforms
  const platformCosts = React.useMemo(() => {
    const platforms = ['zapier', 'make', 'n8n'] as const;
    const nodeCount = nodes?.length || 5; // Default to 5 if no nodes
    
    return platforms.map(p => ({
      platform: p,
      cost: calculatePlatformCost(p, runsPerMonth, pricing, nodeCount)
    }));
  }, [runsPerMonth, nodes]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingSubtitle && subtitleInputRef.current) {
      subtitleInputRef.current.focus();
      subtitleInputRef.current.select();
    }
  }, [editingSubtitle]);

  const handleTitleSave = () => {
    setEditingTitle(false);
  };

  const handleSubtitleSave = () => {
    setEditingSubtitle(false);
  };

  const sanitizeFileName = (name: string) => {
    return name
      .replace(/[^a-z0-9\-\s_]+/gi, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 64) || "roi-report";
  };

  const serializeForJson = () => {
    return {
      ...data,
      generatedAt: new Date().toISOString(),
    };
  };

  const buildExportHtml = () => {
    // Minimal, self-contained HTML using inline styles.
    const title = titleValue || nodeTitle;
    const dateStr = new Date(generatedDate).toLocaleDateString();
    const tpl = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#ffffff; color:#0f172a; margin:24px;}
      .card{max-width:800px; margin:0 auto; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);}
      .section{padding:16px 24px;}
      .row{display:flex; gap:16px;}
      .col{flex:1;}
      .muted{color:#64748b}
      .badge{display:inline-flex; align-items:center; gap:6px; background:#dcfce7; color:#166534; padding:4px 8px; border-radius:9999px; font-size:12px; font-weight:600}
      .metric{font-size:22px; font-weight:800}
      h1{font-size:22px; font-weight:800; margin:0}
      h3{font-size:16px; font-weight:700; margin:12px 0}
      table{width:100%; border-collapse:collapse}
      td,th{padding:6px 4px; text-align:right}
      td.label,th.label{text-align:left; color:#334155}
      .divider{border-top:1px solid #e5e7eb; margin:16px 0}
    </style></head><body>
    <div class="card">
      <div class="section" style="border-bottom:1px solid #e5e7eb">
        <div class="row" style="align-items:center; justify-content:space-between">
          <div>
            <h1>${title}</h1>
            <div class="muted" style="font-size:12px">Generated: ${dateStr}</div>
          </div>
          <div class="row" style="gap:24px">
            <div style="text-align:center"><div class="muted" style="font-size:12px">Total ROI</div><div class="metric">${formatCurrency(netROI)}</div></div>
            <div style="text-align:center"><div class="muted" style="font-size:12px">Monthly Cost</div><div class="metric" style="color:#dc2626">${formatCurrency(platformCost)}</div></div>
            <div style="text-align:center"><div class="muted" style="font-size:12px">Runs/Month</div><div class="metric" style="color:#2563eb">${runsPerMonth.toLocaleString()}</div></div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="row">
          <div class="col">
            <h3>Revenue Breakdown</h3>
            <table>
              <tr><td class="label">Time Savings</td><td>${formatCurrency(timeValue)}</td></tr>
              <tr><td class="label">Revenue Uplift</td><td>${formatCurrency(revenueValue)}</td></tr>
              <tr><td class="label">Risk Reduction</td><td>${formatCurrency(riskValue)}</td></tr>
            </table>
          </div>
          <div class="col">
            <h3>Business Impact</h3>
            <div style="font-size:14px; line-height:1.6; color:#334155">${(businessImpact || '').toString().replace(/</g,'&lt;')}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="row">
          <div class="col">
            <h3>Performance Metrics</h3>
            <table>
              <tr><td class="label">Payback Period</td><td>${paybackPeriod < 30 ? `${Math.ceil(paybackPeriod)} days` : `${(paybackPeriod/30).toFixed(1)} months`}</td></tr>
              <tr><td class="label">Break-even Runs</td><td>${breakEvenRuns}</td></tr>
              <tr><td class="label">Confidence</td><td>${(confidence/100).toFixed(2)}</td></tr>
            </table>
          </div>
          <div class="col">
            <h3>ROI Summary</h3>
            <table>
              <tr><td class="label">Total Value</td><td>${formatCurrency(timeValue + riskValue + revenueValue)}</td></tr>
              <tr><td class="label">Platform Cost</td><td>${formatCurrency(platformCost)}</td></tr>
              <tr><td class="label">Monthly Net ROI</td><td>${formatCurrency(netROI)}</td></tr>
              <tr><td class="label">Annual Net ROI</td><td>${formatCurrency(netROI * 12)}</td></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
    </body></html>`;
    return tpl;
  };

  const handleExport = (format: 'pdf' | 'json' | 'html') => {
    // Exact PDF export: clone the live node DOM and print only that area
    if (format === 'pdf') {
      try {
        const root = rootRef.current;
        if (!root) return;
        const clone = root.cloneNode(true) as HTMLElement;
        clone.style.width = '100%';
        clone.style.maxWidth = '100%';
        clone.style.boxSizing = 'border-box';

        const printRoot = document.createElement('div');
        printRoot.id = 'apicus-print-root';
        printRoot.style.position = 'fixed';
        printRoot.style.inset = '0';
        printRoot.style.background = '#ffffff';
        printRoot.style.zIndex = '2147483647';
        printRoot.style.display = 'flex';
        printRoot.style.alignItems = 'flex-start';
        printRoot.style.justifyContent = 'center';
        printRoot.style.padding = '0';
        printRoot.style.overflow = 'auto';

        const wrapper = document.createElement('div');
        wrapper.style.width = '100%'; // fill page width when printing
        wrapper.style.maxWidth = '100%';
        wrapper.appendChild(clone);
        printRoot.appendChild(wrapper);

        const style = document.createElement('style');
        style.textContent = `
@page {
  size: auto;
  margin: 0.35in;
}
@media print {
  body *:not(#apicus-print-root, #apicus-print-root *) { visibility: hidden !important; }
  #apicus-print-root { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  #apicus-print-root { padding: 0 !important; }
  /* Force node to full width and remove outer border/shadow/radius on export */
  #apicus-print-root .w-\\[800px\\] { width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
}
/* Hide React Flow handles in print */
#apicus-print-root .react-flow__handle { display: none !important; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(printRoot);

        // Give the browser a moment to attach to the DOM and load any images
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            try {
              document.body.removeChild(printRoot);
            } catch {}
            try {
              document.head.removeChild(style);
            } catch {}
          }, 100);
        }, 150);
      } catch (e) {
        console.error('PDF export failed', e);
      }
      return;
    }
    const base = sanitizeFileName(titleValue || nodeTitle || 'roi-report');
    if (format === 'json') {
      try {
        const blob = new Blob([JSON.stringify(serializeForJson(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${base}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('JSON export failed', e);
      }
      return;
    }
    if (format === 'html') {
      try {
        const html = buildExportHtml();
        void navigator.clipboard.writeText(html);
      } catch (e) {
        console.error('Copy HTML failed', e);
      }
      return;
    }
  };

  // Generate title using AI
  const generateTitleAI = async () => {
    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/openai/generate-roi-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'title',
          context: {
            projectName,
            clientName: subtitleValue,
            taskType: data.taskType,
            platform,
            roiRatio,
            paybackDays: paybackPeriod,
            hoursSaved,
            netROI,
            uniqueApps
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate title');
      
      const { content } = await response.json();
      setTitleValue(content);
      
    } catch (error) {
      console.error('Error generating title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Generate business impact using AI
  const generateBusinessImpactAI = async () => {
    setIsGeneratingImpact(true);
    try {
      const response = await fetch('/api/openai/generate-roi-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'businessImpact',
          context: {
            projectName,
            clientName: subtitleValue,
            taskType: data.taskType,
            platform,
            roiRatio,
            paybackDays: paybackPeriod,
            hoursSaved,
            netROI,
            complianceEnabled: data.complianceEnabled,
            revenueEnabled: data.revenueEnabled,
            revenueValue,
            riskValue
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate business impact');
      
      const { content } = await response.json();
      setBusinessImpactValue(content);
      
    } catch (error) {
      console.error('Error generating business impact:', error);
    } finally {
      setIsGeneratingImpact(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="w-[800px] h-[900px] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-slate-600">Generating ROI report...</p>
        </div>
      </div>
    );
  }

  // Calculate percentages for revenue breakdown - always show all 3
  const totalRevenue = timeValue + revenueValue + riskValue;
  const timePercent = totalRevenue > 0 ? (timeValue / totalRevenue) * 100 : 100;
  const revenuePercent = totalRevenue > 0 ? (revenueValue / totalRevenue) * 100 : 0;
  const riskPercent = totalRevenue > 0 ? (riskValue / totalRevenue) * 100 : 0;

  return (
    <div ref={rootRef} className="relative w-[800px] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary"
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary"
        style={{ top: '50%' }}
      />

      <div className="p-6 space-y-5">
        {/* Header Section */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {editingTitle ? (
                      <Input
                        ref={titleInputRef}
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave();
                          if (e.key === 'Escape') {
                            setTitleValue(nodeTitle);
                            setEditingTitle(false);
                          }
                        }}
                        className="h-8 text-2xl font-bold px-2 flex-1"
                      />
                    ) : (
                      <h1 
                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors flex-1"
                        onClick={() => setEditingTitle(true)}
                      >
                        {titleValue}
                      </h1>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={generateTitleAI}
                      disabled={isGeneratingTitle}
                      title="Generate title with AI"
                    >
                      {isGeneratingTitle ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {editingSubtitle ? (
                    <Input
                      ref={subtitleInputRef}
                      value={subtitleValue}
                      onChange={(e) => setSubtitleValue(e.target.value)}
                      onBlur={handleSubtitleSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubtitleSave();
                        if (e.key === 'Escape') {
                          setSubtitleValue(clientName);
                          setEditingSubtitle(false);
                        }
                      }}
                      className="h-6 text-sm font-medium px-2 mt-1"
                      placeholder="Your agency or consultant name"
                    />
                  ) : (
                    <p 
                      className="text-slate-600 text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setEditingSubtitle(true)}
                    >
                      {subtitleValue}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn(
                  "hover:bg-opacity-100",
                  isPositiveROI ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    isPositiveROI ? "bg-green-500" : "bg-red-500"
                  )}></div>
                  {isPositiveROI ? 'Positive ROI' : 'Negative ROI'}
                </Badge>
                <span className="text-xs text-slate-500">Generated: {generatedDate.toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Key Metrics Cards - Better spacing */}
            <div className="flex gap-6 pl-6">
              <div className="text-center">
                <p className="text-xs text-slate-600">Total ROI</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(adjustedNetROI)}</p>
                <p className="text-xs text-slate-500">monthly</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCosts)}</p>
                <p className="text-xs text-slate-500">platform + apps</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600">Runs/Month</p>
                <p className="text-2xl font-bold text-blue-600">{runsPerMonth.toLocaleString()}</p>
                <p className="text-xs text-slate-500">automated</p>
              </div>
            </div>
            
            {/* Export button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-4">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-950 border shadow-md">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-3 w-3 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="h-3 w-3 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy as HTML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Applications Used Section */}
        {uniqueApps.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Applications Used</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {uniqueApps.slice(0, 6).map((app) => (
                <div 
                  key={app.appName} 
                  className={cn(
                    "flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-slate-200",
                    "hover:border-slate-300 transition-colors"
                  )}
                  title={app.appName}
                >
                  <div className={cn(
                    "p-1 rounded-md",
                    "bg-slate-50 dark:bg-slate-800",
                    "border border-slate-100 dark:border-slate-700"
                  )}>
                    <AppLogo 
                      logoUrl={app.logoUrl} 
                      appName={app.appName}
                      typeOf={app.typeOf}
                      action={app.action}
                      size={32}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{app.appName}</span>
                    {app.pricingData && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {app.pricingData.hasFreeTier ? (
                          <span className="text-green-600 font-medium">Free tier</span>
                        ) : app.pricingData.lowestMonthlyPrice ? (
                          <span>From ${app.pricingData.lowestMonthlyPrice}/mo</span>
                        ) : app.pricingData.isPricingPublic === false ? (
                          <span className="text-muted-foreground">Custom pricing</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {uniqueApps.length > 6 && (
                <span className="text-sm text-slate-500 font-medium px-2">
                  +{uniqueApps.length - 6} more
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Avg. processing time: {minutesPerRun < 1 ? `${(minutesPerRun * 60).toFixed(0)} seconds` : `${minutesPerRun} minutes`}
              {breakEvenRuns > 0 && ` • Success rate: ${confidence}%`}
              {appCosts > 0 && ` • Total app costs: ${formatCurrency(appCosts)}/mo`}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Revenue Breakdown - Always show all 3 */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Revenue Breakdown</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                  {timePercent > 0 && <div className="bg-blue-500 transition-all duration-500" style={{ width: `${timePercent}%` }}></div>}
                  {revenuePercent > 0 && <div className="bg-orange-400 transition-all duration-500" style={{ width: `${revenuePercent}%` }}></div>}
                  {riskPercent > 0 && <div className="bg-green-500 transition-all duration-500" style={{ width: `${riskPercent}%` }}></div>}
                </div>
              </div>

              {/* Breakdown Table - Always show all 3 */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Time Savings</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(timeValue)}</span>
                    <span className="text-slate-500 ml-2">{timePercent.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <span className="font-medium">Revenue Uplift</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(revenueValue)}</span>
                    <span className="text-slate-500 ml-2">{revenuePercent.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium">Risk Reduction</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(riskValue)}</span>
                    <span className="text-slate-500 ml-2">{riskPercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <Clock className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Payback Period</p>
                  <p className="text-lg font-bold text-green-600">
                    {paybackPeriod < 30 ? `${Math.ceil(paybackPeriod)} Days` : `${(paybackPeriod / 30).toFixed(1)} Months`}
                  </p>
                </div>
                <div>
                  <Target className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Break-even</p>
                  <p className="text-lg font-bold text-green-600">{breakEvenRuns} runs</p>
                </div>
                <div>
                  <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Confidence</p>
                  <p className="text-lg font-bold text-green-600">{(confidence / 100).toFixed(2)}</p>
                </div>
              </div>
            </Card>

            {/* Platform Comparison - Show all platforms with calculated costs */}
            {showPlatformComparison && (
              <Card className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Platform Comparison</h3>
                <div className="space-y-2">
                  {platformCosts.map(({ platform: p, cost }) => {
                    const config = PLATFORM_CONFIG[p];
                    const isActive = p === platform;
                    return (
                      <div 
                        key={p}
                        className={cn(
                          "flex justify-between items-center p-2 rounded border transition-all",
                          config.bgColor,
                          config.borderColor,
                          isActive && "ring-2 ring-offset-1 ring-primary"
                        )}
                      >
                        <span className="font-medium text-sm">{config.name}</span>
                        <span className={cn("font-bold", config.color)}>
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Business Impact */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Business Impact</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={generateBusinessImpactAI}
                  disabled={isGeneratingImpact}
                  title="Generate with AI"
                >
                  {isGeneratingImpact ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-slate-700 leading-relaxed">
                  {businessImpactValue || businessImpact || `Automate ${projectName} to save ${hoursSaved.toFixed(1)} hours monthly with ${roiRatio.toFixed(1)}x ROI and ${Math.ceil(paybackPeriod)}-day payback.`}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Time Saved Weekly</p>
                    <p className="text-lg font-bold text-blue-600">{weeklyHours.toFixed(2)} hrs</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Hourly Rate</p>
                    <p className="text-lg font-bold text-blue-600">${hourlyRate}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* ROI Summary */}
            <Card className="p-4 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-3">ROI Summary</h3>
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-green-600">{formatROIRatio(adjustedROIRatio)}</p>
                  <p className="text-xs text-slate-600 mt-1">Return on Investment</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Total Value</p>
                    <p className="font-bold text-green-600">{formatCurrency(timeValue + riskValue + revenueValue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Platform Cost</p>
                    <p className="font-bold text-red-600">{formatCurrency(platformCost)}</p>
                  </div>
                  {appCosts > 0 && (
                    <>
                      <div>
                        <p className="text-slate-600">App Costs</p>
                        <p className="font-bold text-red-600">{formatCurrency(appCosts)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Total Costs</p>
                        <p className="font-bold text-red-600">{formatCurrency(totalCosts)}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-slate-600">Monthly Net ROI</p>
                    <p className="font-bold text-green-600">{formatCurrency(adjustedNetROI)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 text-center">
          <p className="text-xs text-slate-500">
            ROI Analysis Report • {projectName} • Confidential
          </p>
        </div>
      </div>
    </div>
  );
}; 