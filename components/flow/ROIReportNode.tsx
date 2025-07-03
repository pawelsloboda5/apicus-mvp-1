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
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Check,
  Zap,
  FileJson,
  FileText,
  Copy,
  PlayCircle,
  GitBranch,
  ChevronRight,
  CheckSquare,
  Code,
  Sparkles,
  Loader2
} from 'lucide-react';
import { WorkflowStep } from '@/app/build/hooks/useROIGeneration';
import { Handle, Position } from '@xyflow/react';
import { pricing } from '@/app/api/data/pricing';
import { calculatePlatformCost } from '@/lib/roi-utils';
import { Node } from '@xyflow/react';

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

export const ROIReportNode: React.FC<ROIReportNodeProps> = ({ id, data }) => {
  const { 
    nodeTitle = "ROI Analysis Report", 
    isLoading = false,
    reportTitle,
    projectName = "Automation Project",
    clientName = "Your Automation Agency",
    generatedDate = new Date(),
    workflowSteps = [],
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

  const isPositiveROI = netROI > 0;
  const hoursSaved = (runsPerMonth * minutesPerRun) / 60;
  const weeklyHours = hoursSaved / 4.33; // Convert monthly to weekly
  const breakEvenRuns = platformCost > 0 && timeValue > 0 
    ? Math.ceil(platformCost / (timeValue / runsPerMonth))
    : 0;

  // Extract unique apps from nodes
  const uniqueApps = React.useMemo(() => {
    const apps = new Set<string>();
    if (nodes && nodes.length > 0) {
      nodes.forEach(node => {
        if (node.data && (node.data as any).appName) {
          apps.add((node.data as any).appName);
        }
      });
    }
    return Array.from(apps);
  }, [nodes]);

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

  const handleExport = (format: 'pdf' | 'json' | 'html') => {
    console.log(`Export as ${format}`);
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
    <div className="relative w-[800px] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
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
                <p className="text-2xl font-bold text-green-600">{formatCurrency(netROI)}</p>
                <p className="text-xs text-slate-500">monthly</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(platformCost)}</p>
                <p className="text-xs text-slate-500">platform + API</p>
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
              <DropdownMenuContent align="end">
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
            <div className="flex items-center gap-2 flex-wrap">
              {uniqueApps.slice(0, 4).map((app) => (
                <div key={app} className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200">
                  <span className="text-sm font-medium">{app}</span>
                </div>
              ))}
              {uniqueApps.length > 4 && (
                <span className="text-sm text-slate-500 font-medium">
                  +{uniqueApps.length - 4} more
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Avg. processing time: {minutesPerRun < 1 ? `${(minutesPerRun * 60).toFixed(0)} seconds` : `${minutesPerRun} minutes`}
              {breakEvenRuns > 0 && ` • Success rate: ${confidence}%`}
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Revenue Impact:</span>
                  <span className="font-bold text-green-600">+{formatCurrency(timeValue + revenueValue + riskValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Platform Cost:</span>
                  <span className="font-bold text-red-600">-{formatCurrency(platformCost)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Net Monthly ROI:</span>
                  <span className={cn("font-bold", isPositiveROI ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(netROI)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Annual Projection:</span>
                  <span>{formatCurrency(netROI * 12)}</span>
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