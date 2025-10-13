/**
 * Default factors for each task type
 * Used as fallback when AI generation fails or for testing
 * 
 * **BACKUP FILE** - Original version before enhancement
 * @version 1.0
 * @date 2025-10-05
 */

import { TaskType, PositiveFactor, NegativeFactor } from './types';

export function getDefaultFactors(
  taskType: TaskType, 
  runsPerMonth: number, 
  hourlyRate: number
): { 
  positiveFactors: PositiveFactor[]; 
  negativeFactors: NegativeFactor[]; 
  tokensUsed: number;
} {
  const baseTimeValue = (runsPerMonth * 5 * hourlyRate) / 60; // Assuming 5 min per run baseline
  
  const defaultPositiveFactors: Record<TaskType, PositiveFactor[]> = {
    internal_admin: [
      {
        id: 'pf_process_standardization',
        category: 'time',
        label: 'Process Standardization',
        description: 'Consistent execution reduces variations and rework',
        unit: 'percentage',
        defaultValue: 15,
        suggestedValue: 20,
        minValue: 0,
        maxValue: 50,
        step: 5,
        impactType: 'multiplicative',
        baseMetric: 'time',
        impactFormula: 'timeValue × (1 + value/100)',
        estimatedMonthlyImpact: baseTimeValue * 0.15,
        confidence: 75,
        source: 'default',
        reasoning: 'Standard processes typically save 15-20% in execution time',
        industryBenchmark: 18,
        icon: 'Settings',
        color: 'blue',
        priority: 'high',
        helpText: 'How much more efficient the standardized process becomes'
      },
      {
        id: 'pf_data_accuracy',
        category: 'quality',
        label: 'Data Accuracy Improvement',
        description: 'Reduction in data entry errors and inconsistencies',
        unit: 'percentage',
        defaultValue: 20,
        suggestedValue: 25,
        minValue: 0,
        maxValue: 40,
        step: 5,
        impactType: 'additive',
        baseMetric: 'risk',
        impactFormula: '$500 × value',
        estimatedMonthlyImpact: 500 * 0.2,
        confidence: 80,
        source: 'default',
        icon: 'CheckCircle',
        color: 'green',
        priority: 'high'
      },
      {
        id: 'pf_completion_rate',
        category: 'quality',
        label: 'Task Completion Rate',
        description: 'Percentage of tasks completed successfully',
        unit: 'percentage',
        defaultValue: 95,
        suggestedValue: 98,
        minValue: 50,
        maxValue: 100,
        step: 1,
        impactType: 'multiplicative',
        baseMetric: 'revenue',
        impactFormula: 'revenue × (value/100)',
        estimatedMonthlyImpact: 1000,
        confidence: 85,
        source: 'default',
        icon: 'Target',
        color: 'green',
        priority: 'medium'
      },
      {
        id: 'pf_workflow_visibility',
        category: 'time',
        label: 'Workflow Visibility',
        description: 'Better tracking and monitoring capabilities',
        unit: 'score',
        defaultValue: 7,
        suggestedValue: 8,
        minValue: 1,
        maxValue: 10,
        step: 1,
        impactType: 'multiplicative',
        baseMetric: 'time',
        impactFormula: 'timeValue × (value/10 × 0.2)',
        estimatedMonthlyImpact: baseTimeValue * 0.14,
        confidence: 70,
        source: 'default',
        icon: 'Eye',
        color: 'blue',
        priority: 'low'
      },
      {
        id: 'pf_automation_reliability',
        category: 'quality',
        label: 'Automation Reliability',
        description: 'Consistent performance without failures',
        unit: 'percentage',
        defaultValue: 98,
        suggestedValue: 99,
        minValue: 80,
        maxValue: 100,
        step: 1,
        impactType: 'multiplicative',
        baseMetric: 'time',
        impactFormula: 'totalValue × (value/100)',
        estimatedMonthlyImpact: baseTimeValue * 0.98,
        confidence: 90,
        source: 'default',
        icon: 'Shield',
        color: 'green',
        priority: 'high'
      },
      {
        id: 'pf_integration_efficiency',
        category: 'scale',
        label: 'Integration Efficiency',
        description: 'Seamless connection between systems',
        unit: 'percentage',
        defaultValue: 25,
        suggestedValue: 30,
        minValue: 0,
        maxValue: 50,
        step: 5,
        impactType: 'multiplicative',
        baseMetric: 'time',
        impactFormula: 'timeValue × (1 + value/100)',
        estimatedMonthlyImpact: baseTimeValue * 0.25,
        confidence: 75,
        source: 'default',
        icon: 'Link',
        color: 'purple',
        priority: 'medium'
      }
    ],
    client_communication: [], // Will be filled with similar pattern
    data_cleaning: [],
    scheduling: [],
    reporting: [],
    onboarding: [],
    cross_platform_sync: [],
    outreach: [],
    lead_scoring: [],
    sales_enablement: [],
    revenue_capture: [],
    contract_legal: [],
    booking_appointment: [],
    pipeline_closing: []
  };
  
  const defaultNegativeFactors: Record<TaskType, NegativeFactor[]> = {
    internal_admin: [
      {
        id: 'nf_maintenance_hours',
        category: 'maintenance',
        label: 'Maintenance Hours',
        description: 'Monthly time spent maintaining the automation',
        unit: 'hours',
        defaultValue: 2,
        suggestedValue: 2,
        minValue: 0,
        maxValue: 10,
        step: 0.5,
        impactType: 'additive',
        baseMetric: 'cost',
        impactFormula: 'cost + (value × hourlyRate)',
        estimatedMonthlyImpact: -(2 * hourlyRate),
        confidence: 80,
        source: 'default',
        reasoning: 'Most automations require 1-3 hours monthly maintenance',
        mitigationStrategy: 'Build robust error handling and monitoring',
        icon: 'Wrench',
        severity: 'minor',
        canBeEliminated: false,
        alternativeSolutions: ['Automated monitoring', 'Proactive maintenance schedule']
      },
      {
        id: 'nf_system_downtime',
        category: 'risk',
        label: 'System Downtime',
        description: 'Revenue loss from automation failures',
        unit: 'percentage',
        defaultValue: 0.5,
        suggestedValue: 0.3,
        minValue: 0,
        maxValue: 5,
        step: 0.1,
        impactType: 'multiplicative',
        baseMetric: 'revenue',
        impactFormula: 'revenue × (value/100)',
        estimatedMonthlyImpact: -(1000 * 0.005),
        confidence: 70,
        source: 'default',
        mitigationStrategy: 'Implement redundancy and failover systems',
        icon: 'AlertCircle',
        severity: 'major',
        canBeEliminated: false,
        alternativeSolutions: ['Backup workflows', 'Manual override options']
      },
      {
        id: 'nf_training_requirements',
        category: 'overhead',
        label: 'Training Requirements',
        description: 'Initial and ongoing training costs',
        unit: 'hours',
        defaultValue: 4,
        suggestedValue: 3,
        minValue: 0,
        maxValue: 20,
        step: 1,
        impactType: 'additive',
        baseMetric: 'cost',
        impactFormula: 'cost + (value × hourlyRate × 0.5)',
        estimatedMonthlyImpact: -(4 * hourlyRate * 0.5),
        confidence: 75,
        source: 'default',
        mitigationStrategy: 'Create comprehensive documentation and videos',
        icon: 'GraduationCap',
        severity: 'minor',
        canBeEliminated: false,
        alternativeSolutions: ['Self-service documentation', 'Peer training']
      },
      {
        id: 'nf_tool_subscription',
        category: 'cost',
        label: 'Tool Subscription Costs',
        description: 'Additional software and service fees',
        unit: 'currency',
        defaultValue: 50,
        suggestedValue: 50,
        minValue: 0,
        maxValue: 500,
        step: 25,
        impactType: 'additive',
        baseMetric: 'cost',
        impactFormula: 'cost + value',
        estimatedMonthlyImpact: -50,
        confidence: 90,
        source: 'default',
        reasoning: 'Average cost for additional tools and services',
        icon: 'CreditCard',
        severity: 'major',
        canBeEliminated: true,
        alternativeSolutions: ['Free tier options', 'Open source alternatives']
      }
    ],
    client_communication: [],
    data_cleaning: [],
    scheduling: [],
    reporting: [],
    onboarding: [],
    cross_platform_sync: [],
    outreach: [],
    lead_scoring: [],
    sales_enablement: [],
    revenue_capture: [],
    contract_legal: [],
    booking_appointment: [],
    pipeline_closing: []
  };
  
  // For now, return internal_admin factors for all types as fallback
  // In production, each task type would have specific factors
  const positiveFactors = defaultPositiveFactors[taskType] || defaultPositiveFactors.internal_admin;
  const negativeFactors = defaultNegativeFactors[taskType] || defaultNegativeFactors.internal_admin;
  
  return {
    positiveFactors,
    negativeFactors,
    tokensUsed: 0 // No tokens used for defaults
  };
}
