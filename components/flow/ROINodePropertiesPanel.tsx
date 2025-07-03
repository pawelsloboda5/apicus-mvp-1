import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROIReportNodeData } from './ROIReportNode';
import { Node } from '@xyflow/react';
import { Loader2, RefreshCw, BarChart3, TrendingUp, DollarSign, Clock, Shield, Target, Info, Calculator, Palette, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ROINodePropertiesPanelProps {
  selectedNode: Node<ROIReportNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<ROIReportNodeData>) => void;
  onGenerateReport: (nodeId: string) => Promise<void>;
  onRegenerateSection: (nodeId: string, section: string) => Promise<void>;
  isGenerating: boolean;
}

const TASK_TYPES = [
  { value: 'general', label: 'General Automation', multiplier: 1.0 },
  { value: 'admin', label: 'Administrative', multiplier: 0.8 },
  { value: 'data_entry', label: 'Data Entry', multiplier: 0.9 },
  { value: 'customer_service', label: 'Customer Service', multiplier: 1.2 },
  { value: 'sales', label: 'Sales Enablement', multiplier: 1.5 },
  { value: 'marketing', label: 'Marketing', multiplier: 1.3 },
  { value: 'finance', label: 'Finance', multiplier: 1.8 },
  { value: 'hr', label: 'Human Resources', multiplier: 1.1 },
  { value: 'it', label: 'IT Operations', multiplier: 1.4 },
  { value: 'compliance', label: 'Compliance/Legal', multiplier: 2.0 },
  { value: 'operations', label: 'Operations', multiplier: 1.1 },
  { value: 'lead_gen', label: 'Lead Generation', multiplier: 1.6 },
];

const COLOR_SCHEMES = [
  { value: 'zapier', label: 'Zapier Orange', preview: '#FF4A00' },
  { value: 'make', label: 'Make Purple', preview: '#6C2BD9' },
  { value: 'n8n', label: 'n8n Pink', preview: '#EA4B71' },
  { value: 'custom', label: 'Professional Blue', preview: '#3B82F6' },
];

export function ROINodePropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onGenerateReport,
  onRegenerateSection,
  isGenerating,
}: ROINodePropertiesPanelProps) {
  const [formData, setFormData] = useState<Partial<ROIReportNodeData>>({});
  const [selectedTaskType, setSelectedTaskType] = useState('general');
  const [taskMultiplier, setTaskMultiplier] = useState(1.0);

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
      
      // Set task type and multiplier if available
      if (selectedNode.data.taskType) {
        setSelectedTaskType(selectedNode.data.taskType);
        const task = TASK_TYPES.find(t => t.value === selectedNode.data.taskType);
        if (task) {
          setTaskMultiplier(task.multiplier);
        }
      }
      
      // Set color scheme
      const currentPlatform = selectedNode.data.platform || 'zapier';
      if (selectedNode.data.colorScheme) {
        setFormData(prev => ({ ...prev, colorScheme: selectedNode.data.colorScheme }));
      } else {
        setFormData(prev => ({ ...prev, colorScheme: currentPlatform }));
      }
    } else {
      setFormData({});
      setSelectedTaskType('general');
      setTaskMultiplier(1.0);
    }
  }, [selectedNode]);

  const handleInputChange = (
    field: keyof ROIReportNodeData,
    value: string | number | boolean | Date
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update immediately for real-time preview
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { [field]: value });
    }
  };

  const handleTaskTypeChange = (value: string) => {
    setSelectedTaskType(value);
    const task = TASK_TYPES.find(t => t.value === value);
    if (task) {
      setTaskMultiplier(task.multiplier);
      // Update task type and multiplier in form data
      handleInputChange('taskType', value);
      handleInputChange('taskMultiplier', task.multiplier);
      
      // Update hourly rate based on task type
      const baseHourlyRate = formData.hourlyRate || 40;
      const adjustedRate = Math.round(baseHourlyRate * task.multiplier);
      handleInputChange('hourlyRate', adjustedRate);
    }
  };

  const handleGenerateReport = async () => {
    if (selectedNode) {
      await onGenerateReport(selectedNode.id);
    }
  };

  const handleRegenerateSection = async (section: string) => {
    if (selectedNode) {
      await onRegenerateSection(selectedNode.id, section);
    }
  };

  const renderTooltip = (content: string) => (
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-3 w-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px]">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  if (!selectedNode) {
    return null;
  }

  return (
    <Sheet
      open={!!selectedNode}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent 
        side="right" 
        className="w-[480px] sm:w-[540px] flex flex-col p-0 h-screen max-h-screen overflow-hidden bg-white dark:bg-gray-950"
      >
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            ROI Report Settings
          </SheetTitle>
          <SheetDescription>
            Configure your ROI report settings and customize the presentation
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  {/* Node Title */}
                  <div className="space-y-2">
                    <Label htmlFor="nodeTitle">Node Title on Canvas</Label>
                    <Input
                      id="nodeTitle"
                      value={formData.nodeTitle || ''}
                      onChange={(e) => handleInputChange('nodeTitle', e.target.value)}
                      placeholder="e.g., Q1 ROI Analysis"
                    />
                  </div>

                  {/* Report Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Report Details</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reportTitle">Report Title</Label>
                      <Input
                        id="reportTitle"
                        value={formData.reportTitle || ''}
                        onChange={(e) => handleInputChange('reportTitle', e.target.value)}
                        placeholder="Automation ROI Analysis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName || ''}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Acme Corporation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={formData.projectName || ''}
                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                        placeholder="Lead Processing Automation"
                      />
                    </div>
                  </div>

                  {/* Workflow Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Workflow Configuration</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="platform">Platform</Label>
                        {renderTooltip('Select the automation platform for cost calculations')}
                      </div>
                      <Select 
                        value={formData.platform || 'zapier'} 
                        onValueChange={(value: 'zapier' | 'make' | 'n8n') => handleInputChange('platform', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zapier">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF4A00' }} />
                              Zapier
                            </div>
                          </SelectItem>
                          <SelectItem value="make">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6C2BD9' }} />
                              Make
                            </div>
                          </SelectItem>
                          <SelectItem value="n8n">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EA4B71' }} />
                              n8n
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="taskType">Task Type</Label>
                        {renderTooltip('Different task types have different value multipliers')}
                      </div>
                      <Select 
                        value={selectedTaskType} 
                        onValueChange={handleTaskTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_TYPES.map(task => (
                            <SelectItem key={task.value} value={task.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{task.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {task.multiplier}x
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-6 mt-6">
                  {/* Core Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Core Metrics</h4>
                    
                    {/* Runs per month */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="runsPerMonth">Runs per Month</Label>
                        <Input
                          id="runsPerMonth"
                          type="number"
                          className="w-24 text-right"
                          value={formData.runsPerMonth || 250}
                          onChange={(e) => handleInputChange('runsPerMonth', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Slider
                        value={[formData.runsPerMonth || 250]}
                        onValueChange={(values) => handleInputChange('runsPerMonth', values[0])}
                        min={0}
                        max={10000}
                        step={50}
                      />
                    </div>

                    {/* Minutes per run */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="minutesPerRun">Minutes Saved per Run</Label>
                        <Input
                          id="minutesPerRun"
                          type="number"
                          className="w-24 text-right"
                          value={formData.minutesPerRun || 3}
                          onChange={(e) => handleInputChange('minutesPerRun', parseFloat(e.target.value) || 0)}
                          step="0.5"
                        />
                      </div>
                      <Slider
                        value={[formData.minutesPerRun || 3]}
                        onValueChange={(values) => handleInputChange('minutesPerRun', values[0])}
                        min={0.5}
                        max={60}
                        step={0.5}
                      />
                    </div>

                    {/* Hourly rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          className="w-24 text-right"
                          value={formData.hourlyRate || 40}
                          onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Slider
                        value={[formData.hourlyRate || 40]}
                        onValueChange={(values) => handleInputChange('hourlyRate', values[0])}
                        min={15}
                        max={200}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Adjusted by task multiplier: {taskMultiplier}x
                      </p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Performance Metrics</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="confidence">Confidence Level (%)</Label>
                        <Input
                          id="confidence"
                          type="number"
                          className="w-24 text-right"
                          value={formData.confidence || 85}
                          onChange={(e) => handleInputChange('confidence', parseInt(e.target.value) || 0)}
                          min={0}
                          max={100}
                        />
                      </div>
                      <Slider
                        value={[formData.confidence || 85]}
                        onValueChange={(values) => handleInputChange('confidence', values[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 mt-6">
                  {/* Risk & Compliance */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">Risk & Compliance</h4>
                      <Switch
                        checked={formData.complianceEnabled || false}
                        onCheckedChange={(checked) => handleInputChange('complianceEnabled', checked)}
                      />
                    </div>
                    
                    {formData.complianceEnabled && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="riskLevel">Risk Level</Label>
                            <span className="text-xs text-muted-foreground">
                              {formData.riskLevel || 1} / 5
                            </span>
                          </div>
                          <Slider
                            value={[formData.riskLevel || 1]}
                            onValueChange={(values) => handleInputChange('riskLevel', values[0])}
                            min={1}
                            max={5}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="errorCost">Cost per Error ($)</Label>
                          <Input
                            id="errorCost"
                            type="number"
                            value={formData.errorCost || 100}
                            onChange={(e) => handleInputChange('errorCost', parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="riskFrequency">Error Frequency (%)</Label>
                          <Input
                            id="riskFrequency"
                            type="number"
                            value={formData.riskFrequency || 5}
                            onChange={(e) => handleInputChange('riskFrequency', parseInt(e.target.value) || 0)}
                            min={0}
                            max={100}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Revenue Uplift */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">Revenue Uplift</h4>
                      <Switch
                        checked={formData.revenueEnabled || false}
                        onCheckedChange={(checked) => handleInputChange('revenueEnabled', checked)}
                      />
                    </div>
                    
                    {formData.revenueEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="monthlyVolume">Monthly Volume</Label>
                          <Input
                            id="monthlyVolume"
                            type="number"
                            value={formData.monthlyVolume || 1000}
                            onChange={(e) => handleInputChange('monthlyVolume', parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="conversionRate">Conversion Rate Increase (%)</Label>
                          <Input
                            id="conversionRate"
                            type="number"
                            value={formData.conversionRate || 2}
                            onChange={(e) => handleInputChange('conversionRate', parseFloat(e.target.value) || 0)}
                            step="0.1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="valuePerConversion">Value per Conversion ($)</Label>
                          <Input
                            id="valuePerConversion"
                            type="number"
                            value={formData.valuePerConversion || 50}
                            onChange={(e) => handleInputChange('valuePerConversion', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="visual" className="space-y-6 mt-6">
                  {/* Color Scheme */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Color Scheme</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {COLOR_SCHEMES.map(scheme => (
                        <button
                          key={scheme.value}
                          onClick={() => handleInputChange('colorScheme', scheme.value as 'zapier' | 'make' | 'n8n' | 'custom')}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            formData.colorScheme === scheme.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-md"
                              style={{ backgroundColor: scheme.preview }}
                            />
                            <span className="text-sm font-medium">{scheme.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Display Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showPlatformComparison">Show Platform Comparison</Label>
                        <p className="text-xs text-muted-foreground">Display cost comparison across platforms</p>
                      </div>
                      <Switch
                        id="showPlatformComparison"
                        checked={formData.showPlatformComparison !== false}
                        onCheckedChange={(checked) => handleInputChange('showPlatformComparison', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showRevenueBreakdown">Show Revenue Breakdown</Label>
                        <p className="text-xs text-muted-foreground">Display detailed revenue visualization</p>
                      </div>
                      <Switch
                        id="showRevenueBreakdown"
                        checked={formData.showRevenueBreakdown !== false}
                        onCheckedChange={(checked) => handleInputChange('showRevenueBreakdown', checked)}
                      />
                    </div>
                  </div>

                  {/* Business Impact */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">Business Impact</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateSection('businessImpact')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="ml-1">Regenerate</span>
                      </Button>
                    </div>
                    
                    <Textarea
                      value={formData.businessImpact || ''}
                      onChange={(e) => handleInputChange('businessImpact', e.target.value)}
                      placeholder="Describe the business impact of this automation..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate ROI Report
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 