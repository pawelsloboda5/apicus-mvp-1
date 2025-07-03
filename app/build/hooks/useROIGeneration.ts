"use client";

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculatePlatformCost,
  calculateTotalValue,
  calculateNetROI,
  calculateROIRatio,
  formatROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod
} from '@/lib/roi-utils';
import { PlatformType } from '@/lib/types';
import { pricing } from '@/app/api/data/pricing';

// Define interfaces for ROI report functionality
export interface ROIReport {
  id: string;
  reportTitle: string;
  clientName: string;
  projectName: string;
  generatedDate: Date;
  
  // Workflow details
  workflowSteps: WorkflowStep[];
  
  // Core metrics
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  platform: PlatformType;
  
  // Value calculations
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  platformCost: number;
  netROI: number;
  roiRatio: number;
  paybackPeriod: number;
  
  // Performance metrics
  confidence: number;
  breakEvenMonth: number;
  
  // Visual customization
  colorScheme: 'zapier' | 'make' | 'n8n' | 'custom';
  showPlatformComparison: boolean;
  showRevenueBreakdown: boolean;
  
  // Business impact
  businessImpact: string;
  keyBenefits: string[];
  
  // Risk & compliance
  complianceEnabled: boolean;
  riskLevel: number;
  riskFrequency: number;
  errorCost: number;
  
  // Revenue uplift
  revenueEnabled: boolean;
  monthlyVolume: number;
  conversionRate: number;
  valuePerConversion: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  platform?: string;
  icon?: string;
  description?: string;
}

export interface ROIGenerationParams {
  platform: PlatformType;
  taskType: string;
  taskMultiplier: number;
  includeRiskAnalysis?: boolean;
  includeRevenueUplift?: boolean;
  customInstructions?: string;
}

export interface UseROIGenerationOptions {
  initialReport?: ROIReport;
  onReportGenerated?: (report: ROIReport) => void;
  onSectionUpdated?: (section: string, content: unknown) => void;
}

export interface ROIGenerationState {
  isGenerating: boolean;
  isGeneratingSection: boolean;
  currentReport: ROIReport;
  generationProgress: number;
  lastGenerated: Date | null;
  error: string | null;
}

export interface ROIContextData {
  taskType: string;
  industry: string;
  companySize: string;
  currentChallenges: string[];
  automationGoals: string[];
}

// Default report template
const DEFAULT_ROI_REPORT: ROIReport = {
  id: '',
  reportTitle: 'Automation ROI Analysis',
  clientName: '',
  projectName: '',
  generatedDate: new Date(),
  
  workflowSteps: [
    { id: '1', label: 'Trigger', description: 'New form submission' },
    { id: '2', label: 'Process', description: 'Extract and validate data' },
    { id: '3', label: 'Enrich', description: 'Add customer information' },
    { id: '4', label: 'Route', description: 'Send to appropriate team' },
    { id: '5', label: 'Notify', description: 'Update stakeholders' }
  ],
  
  runsPerMonth: 250,
  minutesPerRun: 3,
  hourlyRate: 40,
  platform: 'zapier' as PlatformType,
  
  timeValue: 0,
  riskValue: 0,
  revenueValue: 0,
  platformCost: 0,
  netROI: 0,
  roiRatio: 0,
  paybackPeriod: 0,
  
  confidence: 85,
  breakEvenMonth: 1,
  
  colorScheme: 'zapier',
  showPlatformComparison: true,
  showRevenueBreakdown: true,
  
  businessImpact: 'This automation will transform your workflow efficiency by eliminating manual data entry and reducing errors by 95%. Your team will save 12.5 hours monthly, allowing them to focus on strategic initiatives.',
  keyBenefits: [
    'Save 12.5 hours per month on manual tasks',
    '95% reduction in data entry errors',
    'Real-time processing vs. 24-hour delays',
    'Improved customer satisfaction scores'
  ],
  
  complianceEnabled: false,
  riskLevel: 1,
  riskFrequency: 5,
  errorCost: 100,
  
  revenueEnabled: false,
  monthlyVolume: 1000,
  conversionRate: 2,
  valuePerConversion: 50
};

export function useROIGeneration({
  initialReport,
  onReportGenerated,
  onSectionUpdated,
}: UseROIGenerationOptions = {}) {
  
  const [state, setState] = useState<ROIGenerationState>({
    isGenerating: false,
    isGeneratingSection: false,
    currentReport: initialReport || DEFAULT_ROI_REPORT,
    generationProgress: 0,
    lastGenerated: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate all ROI metrics
  const calculateMetrics = useCallback(() => {
    const { currentReport } = state;
    
    const timeValue = calculateTimeValue(
      currentReport.runsPerMonth,
      currentReport.minutesPerRun,
      currentReport.hourlyRate,
      1 // taskMultiplier - simplified for now
    );
    
    const riskValue = calculateRiskValue(
      currentReport.complianceEnabled,
      currentReport.runsPerMonth,
      currentReport.riskFrequency,
      currentReport.errorCost,
      currentReport.riskLevel
    );
    
    const revenueValue = calculateRevenueValue(
      currentReport.revenueEnabled,
      currentReport.monthlyVolume,
      currentReport.conversionRate,
      currentReport.valuePerConversion
    );
    
    const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
    const platformCost = calculatePlatformCost(
      currentReport.platform,
      currentReport.runsPerMonth,
      pricing
    );
    const netROI = calculateNetROI(totalValue, platformCost);
    const roiRatio = calculateROIRatio(totalValue, platformCost);
    const paybackPeriod = calculatePaybackPeriod(platformCost, netROI);
    
    // Calculate break-even month
    const breakEvenMonth = netROI > 0 ? Math.ceil(platformCost / netROI) : 12;
    
    return {
      timeValue,
      riskValue,
      revenueValue,
      platformCost,
      netROI,
      roiRatio,
      paybackPeriod,
      breakEvenMonth,
      totalValue
    };
  }, [state]);

  // Update report field
  const updateReport = useCallback(<K extends keyof ROIReport>(
    field: K,
    value: ROIReport[K]
  ) => {
    setState(prev => {
      const updatedReport = {
        ...prev.currentReport,
        [field]: value,
      };
      
      // Recalculate metrics if relevant fields changed
      if (['runsPerMonth', 'minutesPerRun', 'hourlyRate', 'platform', 
           'complianceEnabled', 'riskLevel', 'riskFrequency', 'errorCost',
           'revenueEnabled', 'monthlyVolume', 'conversionRate', 'valuePerConversion'].includes(field)) {
        const metrics = calculateMetrics();
        Object.assign(updatedReport, metrics);
      }
      
      return {
        ...prev,
        currentReport: updatedReport,
        error: null,
      };
    });
  }, [calculateMetrics]);

  // Bulk update report
  const updateReportFields = useCallback((updates: Partial<ROIReport>) => {
    setState(prev => {
      const updatedReport = {
        ...prev.currentReport,
        ...updates,
      };
      
      // Recalculate metrics
      const metrics = calculateMetrics();
      Object.assign(updatedReport, metrics);
      
      return {
        ...prev,
        currentReport: updatedReport,
        error: null,
      };
    });
  }, [calculateMetrics]);

  // Generate full ROI report
  const generateFullReport = useCallback(async (
    contextData: ROIContextData,
    params: ROIGenerationParams
  ) => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      error: null,
    }));

    try {
      // Calculate initial metrics
      const metrics = calculateMetrics();
      
      // Update report with calculated values
      const updatedReport: ROIReport = {
        ...state.currentReport,
        ...metrics,
        platform: params.platform,
        generatedDate: new Date(),
      };
      
      // Generate business impact text based on metrics
      const hoursSaved = (updatedReport.runsPerMonth * updatedReport.minutesPerRun) / 60;
      const errorReduction = updatedReport.complianceEnabled ? 95 : 0;
      
      updatedReport.businessImpact = `This automation will transform your ${contextData.taskType} processes by saving ${hoursSaved.toFixed(1)} hours monthly${errorReduction > 0 ? ` and reducing errors by ${errorReduction}%` : ''}. With a ${formatROIRatio(updatedReport.roiRatio)} ROI and payback in ${formatPaybackPeriod(updatedReport.paybackPeriod)}, this investment delivers immediate value.`;
      
      // Generate key benefits
      updatedReport.keyBenefits = [
        `Save ${hoursSaved.toFixed(1)} hours per month on ${contextData.taskType} tasks`,
        `${formatROIRatio(updatedReport.roiRatio)} return on investment`,
        `Break even in ${formatPaybackPeriod(updatedReport.paybackPeriod)}`,
        `Process ${updatedReport.runsPerMonth} operations monthly with zero manual effort`
      ];
      
      if (updatedReport.complianceEnabled) {
        updatedReport.keyBenefits.push(`${errorReduction}% reduction in compliance errors`);
      }
      
      if (updatedReport.revenueEnabled) {
        updatedReport.keyBenefits.push(`$${updatedReport.revenueValue.toFixed(0)} additional monthly revenue`);
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        currentReport: updatedReport,
        lastGenerated: new Date(),
        error: null,
      }));

      // Notify callback
      if (onReportGenerated) {
        onReportGenerated(updatedReport);
      }

      toast.success('ROI report generated successfully');
      
      return updatedReport;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ROI report generation failed';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
        error: errorMessage,
      }));

      if (errorName !== 'AbortError') {
        toast.error(errorMessage);
      }

      throw error;
    }
  }, [state.currentReport, calculateMetrics, onReportGenerated]);

  // Generate specific report section
  const generateReportSection = useCallback(async (
    section: string,
    customPrompt?: string
  ) => {
    setState(prev => ({
      ...prev,
      isGeneratingSection: true,
      error: null,
    }));

    try {
      // For now, we'll just update the business impact section
      // In a real implementation, this would call an AI API
      if (section === 'businessImpact') {
        const hoursSaved = (state.currentReport.runsPerMonth * state.currentReport.minutesPerRun) / 60;
        const newImpact = customPrompt || 
          `This strategic automation initiative will deliver ${formatROIRatio(state.currentReport.roiRatio)} ROI by streamlining operations and saving ${hoursSaved.toFixed(1)} hours monthly. The solution pays for itself in ${formatPaybackPeriod(state.currentReport.paybackPeriod)}, making it a low-risk, high-impact investment.`;
        
        updateReport('businessImpact', newImpact);
      }

      setState(prev => ({
        ...prev,
        isGeneratingSection: false,
        error: null,
      }));

      if (onSectionUpdated) {
        onSectionUpdated(section, state.currentReport[section as keyof ROIReport]);
      }

      toast.success('Section updated successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Section generation failed';
      
      setState(prev => ({
        ...prev,
        isGeneratingSection: false,
        error: errorMessage,
      }));

      toast.error(errorMessage);
      throw error;
    }
  }, [state.currentReport, updateReport, onSectionUpdated]);

  // Update workflow steps
  const updateWorkflowSteps = useCallback((steps: WorkflowStep[]) => {
    updateReport('workflowSteps', steps);
  }, [updateReport]);

  // Export report
  const exportReport = useCallback((format: 'pdf' | 'json' | 'html' = 'pdf') => {
    const { currentReport } = state;
    
    // In a real implementation, this would generate the actual export
    const reportData = {
      ...currentReport,
      exportDate: new Date(),
      format,
    };
    
    console.log('Exporting report:', reportData);
    toast.success(`Report exported as ${format.toUpperCase()}`);
    
    return reportData;
  }, [state]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const metrics = calculateMetrics();
    setState(prev => ({
      ...prev,
      currentReport: {
        ...DEFAULT_ROI_REPORT,
        ...metrics,
      },
      error: null,
    }));
  }, [calculateMetrics]);

  return {
    // State
    ...state,
    
    // Actions
    updateReport,
    updateReportFields,
    updateWorkflowSteps,
    generateFullReport,
    generateReportSection,
    exportReport,
    resetToDefaults,
    
    // Computed values
    formattedROI: formatROIRatio(state.currentReport.roiRatio),
    formattedPayback: formatPaybackPeriod(state.currentReport.paybackPeriod),
    hoursSaved: (state.currentReport.runsPerMonth * state.currentReport.minutesPerRun) / 60,
  };
} 