"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Scenario } from '@/lib/types';
import { Node, Edge } from '@xyflow/react';
import { useScenarioMetrics } from '@/lib/db';
import { RoiGauge, WaterfallChart, TrendChart, FlowTimeChart } from '@/app/chart-kit';
import { useRoiMetrics } from '@/app/chart-kit/hooks';
import { transformToFlowTimeData } from '@/lib/chart-utils';
import { captureROISnapshot, shouldCaptureSnapshot } from '@/lib/metrics-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Camera } from 'lucide-react';

interface AnalyticsDashboardProps {
  scenario: Scenario | null;
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
}

export function AnalyticsDashboard({ scenario, nodes, edges, onNodeClick }: AnalyticsDashboardProps) {
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | undefined>();
  const [previousMetrics, setPreviousMetrics] = useState<typeof metrics | null>(null);
  const [previousNodeCount, setPreviousNodeCount] = useState(0);
  
  // Get historical metrics for the scenario
  const historicalMetrics = useScenarioMetrics(scenario?.id);
  
  // Get real-time ROI calculations
  const metrics = useRoiMetrics(scenario, nodes);
  
  // Track metric changes for automatic snapshots
  useEffect(() => {
    if (!scenario || !metrics) return;
    
    const nodeCount = nodes.filter(n => ['trigger', 'action', 'decision'].includes(n.type || '')).length;
    
    // Check if we should capture a snapshot
    if (previousMetrics && shouldCaptureSnapshot(
      previousMetrics ? { ...scenario, netROI: previousMetrics.netROI } as Scenario : null,
      { ...scenario, netROI: metrics.netROI } as Scenario,
      previousNodeCount,
      nodeCount
    )) {
      captureROISnapshot(scenario, nodes, 'major_edit');
    }
    
    setPreviousMetrics(metrics);
    setPreviousNodeCount(nodeCount);
  }, [scenario, metrics, nodes, previousMetrics, previousNodeCount]);
  
  // Manual snapshot handler
  const handleCaptureSnapshot = async () => {
    if (!scenario) return;
    await captureROISnapshot(scenario, nodes, 'manual');
  };
  
  // Export data handler
  const handleExportData = () => {
    if (!metrics || !scenario) return;
    
    const exportData = {
      scenario: {
        name: scenario.name,
        platform: scenario.platform,
        createdAt: new Date(scenario.createdAt).toISOString(),
      },
      metrics: {
        netROI: metrics.netROI,
        roiRatio: metrics.roiRatio,
        timeValue: metrics.timeValue,
        platformCost: metrics.platformCost,
        paybackPeriod: metrics.paybackPeriod,
        breakEvenRuns: metrics.breakEvenRuns,
      },
      workflow: {
        nodeCount: nodes.length,
        steps: nodes.filter(n => ['trigger', 'action', 'decision'].includes(n.type || '')).length,
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name}-roi-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Prepare waterfall data
  const waterfallData = useMemo(() => {
    if (!metrics) return [];
    
    const data = [];
    let runningTotal = 0;
    
    // Time value
    if (metrics.timeValue > 0) {
      data.push({
        label: 'Time Saved',
        value: metrics.timeValue,
        start: runningTotal,
        end: runningTotal + metrics.timeValue,
        category: 'value' as const,
      });
      runningTotal += metrics.timeValue;
    }
    
    // Revenue value
    if (metrics.revenueValue > 0) {
      data.push({
        label: 'Revenue Impact',
        value: metrics.revenueValue,
        start: runningTotal,
        end: runningTotal + metrics.revenueValue,
        category: 'value' as const,
      });
      runningTotal += metrics.revenueValue;
    }
    
    // Risk value
    if (metrics.riskValue > 0) {
      data.push({
        label: 'Risk Mitigation',
        value: metrics.riskValue,
        start: runningTotal,
        end: runningTotal + metrics.riskValue,
        category: 'value' as const,
      });
      runningTotal += metrics.riskValue;
    }
    
    // Platform cost (negative)
    if (metrics.platformCost > 0) {
      data.push({
        label: 'Platform Cost',
        value: -metrics.platformCost,
        start: runningTotal,
        end: runningTotal - metrics.platformCost,
        category: 'cost' as const,
      });
      runningTotal -= metrics.platformCost;
    }
    
    // Net ROI
    data.push({
      label: 'Net ROI',
      value: runningTotal,
      start: 0,
      end: runningTotal,
      category: 'total' as const,
    });
    
    return data;
  }, [metrics]);
  
  // Prepare trend data
  const trendData = useMemo(() => {
    if (!historicalMetrics || historicalMetrics.length === 0) return [];
    
    return historicalMetrics
      .map(snapshot => ({
        date: new Date(snapshot.timestamp),
        value: snapshot.metrics.netROI,
        label: snapshot.trigger,
      }))
      .reverse(); // Show oldest first
  }, [historicalMetrics]);
  
  // Prepare Flow Time data
  const flowTimeData = useMemo(() => {
    if (!scenario || nodes.length === 0) return null;
    
    // Filter to only include workflow nodes (not email context nodes)
    const workflowNodes = nodes.filter(n => ['trigger', 'action', 'decision'].includes(n.type || ''));
    if (workflowNodes.length === 0) return null;
    
    try {
      const data = transformToFlowTimeData(nodes, scenario.minutesPerRun || 0);
      // Validate the returned data
      if (!data || !data.nodes || data.nodes.length === 0) return null;
      return data;
    } catch (error) {
      console.error('Error transforming flow time data:', error);
      return null;
    }
  }, [nodes, scenario]);
  
  const handleFlowNodeClick = (nodeId: string) => {
    setHighlightedNodeId(nodeId);
    onNodeClick?.(nodeId);
  };
  
  if (!scenario || !metrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No scenario loaded</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto p-6 space-y-6 pb-12 min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
              <p className="text-muted-foreground">
                Track and analyze your automation ROI over time
              </p>
            </div>
            {/* Scenario Quick Stats */}
            <div className="hidden xl:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-medium capitalize">{scenario.platform}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Runs/Month</p>
                <p className="font-medium">{scenario.runsPerMonth?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Workflow Steps</p>
                <p className="font-medium">{nodes.filter(n => ['trigger', 'action', 'decision'].includes(n.type || '')).length}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCaptureSnapshot}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Capture
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportData}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* ROI Gauge Card */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>ROI Ratio</CardTitle>
                <CardDescription>Current return on investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <RoiGauge ratio={metrics.roiRatio} size="lg" animate />
                </div>
              </CardContent>
            </Card>
            
            {/* Time Value Card */}
            <Card>
              <CardHeader>
                <CardTitle>Time Value</CardTitle>
                <CardDescription>Monthly time savings value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${metrics.timeValue.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {((scenario.runsPerMonth || 0) * (scenario.minutesPerRun || 0) / 60).toFixed(1)} hours saved
                </p>
              </CardContent>
            </Card>
            
            {/* Platform Cost Card */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Cost</CardTitle>
                <CardDescription>Monthly automation cost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${metrics.platformCost.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {scenario.platform} - {nodes.length} nodes
                </p>
              </CardContent>
            </Card>
            
            {/* Net ROI Card */}
            <Card>
              <CardHeader>
                <CardTitle>Net ROI</CardTitle>
                <CardDescription>Monthly net return</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metrics.isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.netROI.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.paybackPeriod} payback
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Metrics Row */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Revenue Impact */}
            {scenario.revenueEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Impact</CardTitle>
                  <CardDescription>From improved conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    ${metrics.revenueValue.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {scenario.conversionRate}% conversion rate
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Risk Mitigation */}
            {scenario.complianceEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Risk Mitigation</CardTitle>
                  <CardDescription>Compliance value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${metrics.riskValue.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Risk level: {scenario.riskLevel}/3
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Break-even Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Break-even Point</CardTitle>
                <CardDescription>Runs needed to break even</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.breakEvenRuns} runs
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.isPositiveROI ? 'Already profitable' : 'Not yet profitable'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Coming Soon Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* ROI Breakdown Waterfall */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Breakdown</CardTitle>
                <CardDescription>Value sources vs costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {waterfallData.length > 0 ? (
                    <WaterfallChart data={waterfallData} animate />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-muted-foreground">No data to display</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Historical Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Trend</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {trendData.length > 1 ? (
                    <TrendChart data={trendData} animate />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-muted-foreground">
                        {historicalMetrics && historicalMetrics.length > 0 
                          ? `${historicalMetrics.length} snapshot${historicalMetrics.length > 1 ? 's' : ''} recorded - need more data for trend`
                          : 'No historical data yet'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Workflow Analysis - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Time Analysis</CardTitle>
              <CardDescription>Time savings by automation step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {flowTimeData ? (
                  <FlowTimeChart 
                    data={flowTimeData} 
                    animate 
                    onNodeClick={handleFlowNodeClick}
                    highlightedNodeId={highlightedNodeId}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      {nodes.length === 0 
                        ? 'Add nodes to see workflow analysis'
                        : nodes.filter(n => ['trigger', 'action', 'decision'].includes(n.type || '')).length === 0
                        ? 'Add workflow nodes (triggers, actions, or decisions) to see analysis'
                        : 'No workflow data available'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 