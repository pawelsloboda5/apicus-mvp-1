/**
 * ROI Summary Section Component
 * 
 * Displays comprehensive ROI metrics including:
 * - Primary metrics (Monthly Value, Net ROI, Time Saved, Payback)
 * - Value drivers breakdown
 * - Factor impacts (if generated)
 * - Cost breakdown
 * - Detailed metrics grid
 */

"use client";

import React from 'react';
import { TrendingUp, DollarSign, Calculator, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ROIMetrics {
  totalValue: number;
  netROI: number;
  timeSavedHours: number;
  paybackDays: number;
  roiRatio: number;
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  platformCost: number;
  appCosts: number;
  totalCost: number;
  breakEvenRuns: number;
  totalPositiveFactorImpact?: number;
  totalNegativeFactorImpact?: number;
  factorBoost?: number;
}

interface ROISummaryProps {
  metrics: ROIMetrics;
  nodes: any[];
  factorsGenerated?: boolean;
  complianceEnabled?: boolean;
  revenueEnabled?: boolean;
  positiveFactorsCount?: number;
  negativeFactorsCount?: number;
  className?: string;
}

export function ROISummary({
  metrics,
  nodes,
  factorsGenerated = false,
  complianceEnabled = false,
  revenueEnabled = false,
  positiveFactorsCount = 0,
  negativeFactorsCount = 0,
  className,
}: ROISummaryProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Metrics - Enhanced Grid Layout */}
      <div className="grid grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-4">
          <div className="relative z-10">
            <p className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
              Monthly Value
              {factorsGenerated && metrics.totalPositiveFactorImpact && (
                <Sparkles className="h-3 w-3 text-green-600" />
              )}
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              ${Math.round(metrics.totalValue).toLocaleString()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {factorsGenerated && metrics.totalPositiveFactorImpact ? (
                <>+${Math.round(metrics.totalPositiveFactorImpact).toLocaleString()} from factors</>
              ) : (
                <>{nodes.filter(n => ['trigger','action','decision'].includes(n.type || '')).length} steps</>
              )}
            </p>
          </div>
          <TrendingUp className="absolute bottom-1 right-1 h-5 w-5 text-green-600/20" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-4">
          <div className="relative z-10">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
              Net ROI
              {factorsGenerated && metrics.factorBoost && metrics.factorBoost > 0 && (
                <Sparkles className="h-3 w-3 text-blue-600" />
              )}
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              ${Math.round(metrics.netROI).toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {metrics.roiRatio.toFixed(1)}x ratio
              {factorsGenerated && metrics.factorBoost && metrics.factorBoost > 0 && (
                <> (+{(metrics.factorBoost * 100).toFixed(0)}%)</>
              )}
            </p>
          </div>
          <DollarSign className="absolute bottom-1 right-1 h-5 w-5 text-blue-600/20" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-4">
          <div className="relative z-10">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Time Saved</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {metrics.timeSavedHours.toFixed(1)}h
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              per month
            </p>
          </div>
          <Clock className="absolute bottom-1 right-1 h-5 w-5 text-purple-600/20" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 p-4">
          <div className="relative z-10">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Payback</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
              {metrics.paybackDays > 0 ? metrics.paybackDays.toFixed(0) : '0'}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              days
            </p>
          </div>
          <Calculator className="absolute bottom-1 right-1 h-5 w-5 text-orange-600/20" />
        </div>
      </div>

      {/* ROI Breakdown */}
      <div className="space-y-4">
        {/* Value Drivers */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Value Drivers
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">Time Saved</span>
                <span className="text-xs font-medium">{metrics.timeSavedHours.toFixed(1)}h/mo</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">
                +${Math.round(metrics.timeValue).toLocaleString()}
              </div>
            </div>
            
            {complianceEnabled && (
              <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Risk Reduction</span>
                  <AlertTriangle className="h-3 w-3 text-blue-500" />
                </div>
                <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                  +${Math.round(metrics.riskValue).toLocaleString()}
                </div>
              </div>
            )}
            
            {revenueEnabled && (
              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Revenue Uplift</span>
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                </div>
                <div className="mt-1 text-sm font-semibold text-purple-700 dark:text-purple-400">
                  +${Math.round(metrics.revenueValue).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Factor Impacts - Show only if factors are generated */}
        {factorsGenerated && metrics.totalPositiveFactorImpact && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              AI Factor Impacts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Factor Boosts</span>
                  <Sparkles className="h-3 w-3 text-green-500" />
                </div>
                <div className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">
                  +${Math.round(metrics.totalPositiveFactorImpact || 0).toLocaleString()}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {positiveFactorsCount} optimizations
                </div>
              </div>
              
              {metrics.totalNegativeFactorImpact !== undefined && metrics.totalNegativeFactorImpact > 0 && (
                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-muted-foreground">Factor Costs</span>
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                    -${Math.round(metrics.totalNegativeFactorImpact || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                    {negativeFactorsCount} risks
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Costs
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <div className="text-xs text-muted-foreground">Platform</div>
              <div className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                -${metrics.platformCost.toFixed(2)}
              </div>
            </div>
            
            {metrics.appCosts > 0 && (
              <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <div className="text-xs text-muted-foreground">App Costs</div>
                <div className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  -${metrics.appCosts.toFixed(2)}
                </div>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border">
              <div className="text-xs text-muted-foreground">Total Costs</div>
              <div className="mt-1 text-sm font-bold text-red-600 dark:text-red-400">
                ${metrics.totalCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive ROI Metrics Grid - 10 boxes */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Detailed ROI Metrics
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {/* Row 1 - Primary Metrics */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="text-xs text-muted-foreground">ROI Ratio</div>
              <div className="text-lg font-bold text-primary">
                {metrics.roiRatio.toFixed(1)}x
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/30 dark:to-green-950/10 border border-green-300 dark:border-green-900">
              <div className="text-xs text-muted-foreground">Net ROI</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                ${Math.round(metrics.netROI).toLocaleString()}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/30 dark:to-blue-950/10 border border-blue-300 dark:border-blue-900">
              <div className="text-xs text-muted-foreground">Total Value</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                ${Math.round(metrics.totalValue).toLocaleString()}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-300 dark:border-amber-900">
              <div className="text-xs text-muted-foreground">Payback</div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {metrics.paybackDays > 0 ? metrics.paybackDays.toFixed(0) : '0'}d
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/10 border border-purple-300 dark:border-purple-900">
              <div className="text-xs text-muted-foreground">Hours Saved</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                {metrics.timeSavedHours.toFixed(1)}h
              </div>
            </div>
            
            {/* Row 2 - Value & Cost Breakdown */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="text-xs text-muted-foreground">Time Value</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                ${Math.round(metrics.timeValue).toLocaleString()}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900">
              <div className="text-xs text-muted-foreground">Risk Value</div>
              <div className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                ${Math.round(metrics.riskValue).toLocaleString()}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
                ${Math.round(metrics.revenueValue).toLocaleString()}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <div className="text-xs text-muted-foreground">Total Cost</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">
                ${metrics.totalCost.toFixed(2)}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border">
              <div className="text-xs text-muted-foreground">Break Even</div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-400">
                {metrics.breakEvenRuns || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
