/**
 * Enhanced Default Factors for ROI Calculations
 * Research-based defaults for all 14 task types
 * 
 * @see ROI_DEFAULTS_RESEARCH.md for methodology and rationale
 * @version 2.0
 * @lastUpdated 2025-10-05
 */

import { TaskType, PositiveFactor, NegativeFactor } from './types';

/**
 * Helper function to create standardized positive factors
 */
function createPositiveFactor(
  id: string,
  label: string,
  description: string,
  category: 'time' | 'revenue' | 'quality' | 'scale',
  suggestedValue: number,
  minValue: number,
  maxValue: number,
  step: number,
  unit: 'percentage' | 'currency' | 'number' | 'hours' | 'score',
  impactMultiplier: number,
  baseTimeValue: number,
  confidence: number,
  icon?: string,
  color?: string,
  priority?: 'high' | 'medium' | 'low'
): PositiveFactor {
  return {
    id,
    label,
    description,
    category,
    unit,
    defaultValue: suggestedValue,
    suggestedValue,
    minValue,
    maxValue,
    step,
    impactType: 'multiplicative',
    baseMetric: category === 'revenue' ? 'revenue' : 'time',
    impactFormula: `timeValue × (value/100)`,
    estimatedMonthlyImpact: baseTimeValue * impactMultiplier,
    confidence,
    source: 'default',
    icon: icon || 'TrendingUp',
    color: color || 'blue',
    priority: priority || 'medium',
  };
}

/**
 * Helper function to create standardized negative factors
 */
function createNegativeFactor(
  id: string,
  label: string,
  description: string,
  category: 'cost' | 'risk' | 'maintenance' | 'overhead',
  suggestedValue: number,
  minValue: number,
  maxValue: number,
  step: number,
  unit: 'percentage' | 'currency' | 'number' | 'hours' | 'score',
  estimatedImpact: number,
  hourlyRate: number,
  confidence: number,
  severity: 'critical' | 'major' | 'minor'
): NegativeFactor {
  return {
    id,
    label,
    description,
    category,
    unit,
    defaultValue: suggestedValue,
    suggestedValue,
    minValue,
    maxValue,
    step,
    impactType: 'additive',
    baseMetric: 'cost',
    impactFormula: category === 'maintenance' ? `value × hourlyRate` : `value`,
    estimatedMonthlyImpact: estimatedImpact,
    confidence,
    source: 'default',
    icon: 'AlertTriangle',
    severity,
    canBeEliminated: category === 'cost',
  };
}

export function getDefaultFactors(
  taskType: TaskType,
  runsPerMonth: number,
  hourlyRate: number
): {
  positiveFactors: PositiveFactor[];
  negativeFactors: NegativeFactor[];
  tokensUsed: number;
} {
  const baseTimeValue = (runsPerMonth * 5 * hourlyRate) / 60; // 5 min baseline per run

  /**
   * TASK TYPE: INTERNAL ADMIN (Multiplier: 1.0x)
   * Basic administrative tasks with foundational improvements
   */
  const internal_admin_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_process_standardization',
      'Process Standardization',
      'Consistent execution reduces variations and rework by 15-20%',
      'time',
      18,
      0,
      50,
      5,
      'percentage',
      0.18,
      baseTimeValue,
      80,
      'Settings',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_data_accuracy',
      'Data Entry Accuracy',
      'Automation reduces manual data entry errors by 25-35%',
      'quality',
      28,
      0,
      50,
      5,
      'percentage',
      0.28,
      baseTimeValue,
      85,
      'CheckCircle',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_task_completion_rate',
      'Task Completion Rate',
      'Automated tasks complete successfully 97-99% of the time',
      'quality',
      98,
      90,
      100,
      1,
      'percentage',
      0.05,
      baseTimeValue,
      88,
      'Target',
      'green',
      'medium'
    ),
  ];

  const internal_admin_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_maintenance_hours',
      'Monthly Maintenance',
      'Routine maintenance and monitoring (1-2 hours/month)',
      'maintenance',
      1.5,
      0,
      10,
      0.5,
      'hours',
      -(1.5 * hourlyRate),
      hourlyRate,
      82,
      'minor'
    ),
    createNegativeFactor(
      'nf_tool_costs',
      'Additional Tool Costs',
      'Supplementary software or service subscriptions',
      'cost',
      35,
      0,
      200,
      25,
      'currency',
      -35,
      hourlyRate,
      90,
      'major'
    ),
  ];

  /**
   * TASK TYPE: CLIENT COMMUNICATION (Multiplier: 1.2x)
   * Customer-facing communication automation
   */
  const client_communication_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_response_speed',
      'Response Time Improvement',
      'Automated responses are 40-60% faster than manual',
      'time',
      48,
      0,
      80,
      5,
      'percentage',
      0.48,
      baseTimeValue,
      82,
      'Zap',
      'purple',
      'high'
    ),
    createPositiveFactor(
      'pf_message_consistency',
      'Message Consistency',
      'Standardized messaging improves brand consistency by 30-45%',
      'quality',
      35,
      0,
      60,
      5,
      'percentage',
      0.35,
      baseTimeValue,
      78,
      'MessageSquare',
      'blue',
      'medium'
    ),
    createPositiveFactor(
      'pf_customer_satisfaction',
      'Customer Satisfaction Gain',
      'Faster, more consistent communication increases satisfaction scores',
      'quality',
      22,
      0,
      50,
      5,
      'percentage',
      0.22,
      baseTimeValue,
      75,
      'Heart',
      'red',
      'medium'
    ),
  ];

  const client_communication_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_maintenance_hours',
      'Template Updates',
      'Updating message templates and workflows (2-3 hours/month)',
      'maintenance',
      2.5,
      0,
      10,
      0.5,
      'hours',
      -(2.5 * hourlyRate),
      hourlyRate,
      80,
      'minor'
    ),
    createNegativeFactor(
      'nf_monitoring_overhead',
      'Quality Monitoring',
      'Regular review of automated communications',
      'overhead',
      45,
      0,
      150,
      25,
      'currency',
      -45,
      hourlyRate,
      75,
      'minor'
    ),
  ];

  /**
   * TASK TYPE: DATA CLEANING (Multiplier: 1.2x)
   * Data quality and transformation processes
   */
  const data_cleaning_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_data_quality',
      'Data Quality Improvement',
      'Automated cleaning catches 35-50% more errors than manual review',
      'quality',
      40,
      0,
      70,
      5,
      'percentage',
      0.40,
      baseTimeValue,
      86,
      'Database',
      'cyan',
      'high'
    ),
    createPositiveFactor(
      'pf_processing_speed',
      'Processing Speed Gain',
      'Automated data cleaning is 50-70% faster than manual',
      'time',
      58,
      0,
      90,
      5,
      'percentage',
      0.58,
      baseTimeValue,
      88,
      'Zap',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_data_standardization',
      'Format Standardization',
      'Consistent data formats reduce downstream processing time',
      'scale',
      28,
      0,
      50,
      5,
      'percentage',
      0.28,
      baseTimeValue,
      82,
      'Grid',
      'indigo',
      'medium'
    ),
  ];

  const data_cleaning_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_rule_maintenance',
      'Cleaning Rule Updates',
      'Maintaining and updating data cleaning rules (2-3 hours/month)',
      'maintenance',
      2.5,
      0,
      10,
      0.5,
      'hours',
      -(2.5 * hourlyRate),
      hourlyRate,
      84,
      'minor'
    ),
    createNegativeFactor(
      'nf_edge_case_handling',
      'Edge Case Manual Review',
      'Manual intervention for complex or unusual data patterns',
      'overhead',
      40,
      0,
      150,
      25,
      'currency',
      -40,
      hourlyRate,
      78,
      'minor'
    ),
  ];

  /**
   * TASK TYPE: SCHEDULING (Multiplier: 1.3x)
   * Resource allocation and appointment management
   */
  const scheduling_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_scheduling_efficiency',
      'Scheduling Efficiency',
      'Automated scheduling reduces booking time by 45-65%',
      'time',
      52,
      0,
      80,
      5,
      'percentage',
      0.52,
      baseTimeValue,
      84,
      'Calendar',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_conflict_reduction',
      'Double-Booking Prevention',
      'Real-time availability checking eliminates 70-90% of conflicts',
      'quality',
      78,
      0,
      95,
      5,
      'percentage',
      0.35,
      baseTimeValue,
      90,
      'Shield',
      'red',
      'high'
    ),
    createPositiveFactor(
      'pf_resource_utilization',
      'Resource Utilization',
      'Optimized scheduling improves resource usage by 25-35%',
      'scale',
      28,
      0,
      50,
      5,
      'percentage',
      0.28,
      baseTimeValue,
      80,
      'Users',
      'purple',
      'medium'
    ),
  ];

  const scheduling_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_calendar_sync',
      'Calendar Integration',
      'Maintaining integrations across multiple calendar systems',
      'maintenance',
      2,
      0,
      8,
      0.5,
      'hours',
      -(2 * hourlyRate),
      hourlyRate,
      82,
      'minor'
    ),
    createNegativeFactor(
      'nf_subscription_costs',
      'Scheduling Platform Costs',
      'Premium scheduling software subscription fees',
      'cost',
      60,
      0,
      200,
      25,
      'currency',
      -60,
      hourlyRate,
      92,
      'major'
    ),
  ];

  /**
   * TASK TYPE: REPORTING (Multiplier: 1.3x)
   * Analytics and dashboard generation
   */
  const reporting_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_report_generation_speed',
      'Report Generation Speed',
      'Automated reports generate 60-80% faster than manual compilation',
      'time',
      68,
      0,
      90,
      5,
      'percentage',
      0.68,
      baseTimeValue,
      88,
      'FileText',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_data_accuracy',
      'Reporting Accuracy',
      'Automated data aggregation reduces calculation errors by 45-60%',
      'quality',
      50,
      0,
      80,
      5,
      'percentage',
      0.50,
      baseTimeValue,
      86,
      'CheckCircle',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_realtime_insights',
      'Real-Time Insights',
      'Up-to-date data enables 30-45% faster decision-making',
      'scale',
      35,
      0,
      60,
      5,
      'percentage',
      0.35,
      baseTimeValue,
      78,
      'TrendingUp',
      'purple',
      'medium'
    ),
  ];

  const reporting_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_report_maintenance',
      'Report Template Updates',
      'Updating report structures and data sources (2-4 hours/month)',
      'maintenance',
      3,
      0,
      10,
      0.5,
      'hours',
      -(3 * hourlyRate),
      hourlyRate,
      84,
      'minor'
    ),
    createNegativeFactor(
      'nf_bi_tool_costs',
      'BI Tool Subscriptions',
      'Business intelligence and visualization platform costs',
      'cost',
      75,
      0,
      300,
      25,
      'currency',
      -75,
      hourlyRate,
      90,
      'major'
    ),
  ];

  /**
   * TASK TYPE: ONBOARDING (Multiplier: 1.5x)
   * Employee and customer onboarding workflows
   */
  const onboarding_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_onboarding_speed',
      'Time-to-Productivity',
      'Automated onboarding reduces ramp-up time by 40-55%',
      'time',
      45,
      0,
      75,
      5,
      'percentage',
      0.45,
      baseTimeValue,
      82,
      'Rocket',
      'orange',
      'high'
    ),
    createPositiveFactor(
      'pf_completion_rate',
      'Onboarding Completion Rate',
      'Structured workflows increase completion rates by 35-50%',
      'quality',
      40,
      0,
      70,
      5,
      'percentage',
      0.40,
      baseTimeValue,
      80,
      'Target',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_consistency',
      'Process Consistency',
      'Standardized onboarding ensures uniform experience for all users',
      'quality',
      48,
      0,
      75,
      5,
      'percentage',
      0.48,
      baseTimeValue,
      85,
      'Users',
      'blue',
      'medium'
    ),
  ];

  const onboarding_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_content_updates',
      'Content Maintenance',
      'Updating onboarding materials and workflows (3-4 hours/month)',
      'maintenance',
      3.5,
      0,
      12,
      0.5,
      'hours',
      -(3.5 * hourlyRate),
      hourlyRate,
      78,
      'minor'
    ),
    createNegativeFactor(
      'nf_platform_costs',
      'Onboarding Platform',
      'Learning management or onboarding platform subscription',
      'cost',
      85,
      0,
      300,
      25,
      'currency',
      -85,
      hourlyRate,
      88,
      'major'
    ),
  ];

  /**
   * TASK TYPE: CROSS-PLATFORM SYNC (Multiplier: 1.5x)
   * Data synchronization across multiple systems
   */
  const cross_platform_sync_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_sync_efficiency',
      'Sync Time Reduction',
      'Automated sync is 70-90% faster than manual data transfer',
      'time',
      78,
      0,
      95,
      5,
      'percentage',
      0.78,
      baseTimeValue,
      90,
      'RefreshCw',
      'cyan',
      'high'
    ),
    createPositiveFactor(
      'pf_data_consistency',
      'Cross-System Consistency',
      'Real-time sync ensures 50-70% better data consistency',
      'quality',
      58,
      0,
      85,
      5,
      'percentage',
      0.58,
      baseTimeValue,
      84,
      'Database',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_integration_coverage',
      'System Integration Coverage',
      'Connecting multiple systems improves workflow efficiency by 35-50%',
      'scale',
      40,
      0,
      70,
      5,
      'percentage',
      0.40,
      baseTimeValue,
      82,
      'Link',
      'purple',
      'medium'
    ),
  ];

  const cross_platform_sync_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_integration_maintenance',
      'API Integration Maintenance',
      'Maintaining multiple API connections (3-5 hours/month)',
      'maintenance',
      4,
      0,
      12,
      0.5,
      'hours',
      -(4 * hourlyRate),
      hourlyRate,
      86,
      'major'
    ),
    createNegativeFactor(
      'nf_api_costs',
      'API Usage Fees',
      'Third-party API call charges and premium tier costs',
      'cost',
      90,
      0,
      400,
      25,
      'currency',
      -90,
      hourlyRate,
      90,
      'major'
    ),
  ];

  /**
   * TASK TYPE: OUTREACH (Multiplier: 1.6x)
   * Marketing and sales outreach campaigns
   */
  const outreach_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_outreach_volume',
      'Contact Volume Increase',
      'Automation enables 60-85% more outreach contacts per period',
      'scale',
      70,
      0,
      120,
      5,
      'percentage',
      0.70,
      baseTimeValue,
      82,
      'Users',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_personalization',
      'Personalization at Scale',
      'Dynamic personalization improves engagement by 35-55%',
      'quality',
      42,
      0,
      75,
      5,
      'percentage',
      0.42,
      baseTimeValue,
      78,
      'Heart',
      'red',
      'high'
    ),
    createPositiveFactor(
      'pf_response_rate',
      'Response Rate Improvement',
      'Optimized timing and messaging increases responses by 25-40%',
      'revenue',
      30,
      0,
      60,
      5,
      'percentage',
      0.30,
      baseTimeValue,
      75,
      'MessageCircle',
      'green',
      'medium'
    ),
  ];

  const outreach_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_campaign_management',
      'Campaign Optimization',
      'Regular campaign testing and optimization (3-5 hours/month)',
      'maintenance',
      4,
      0,
      15,
      0.5,
      'hours',
      -(4 * hourlyRate),
      hourlyRate,
      80,
      'minor'
    ),
    createNegativeFactor(
      'nf_email_platform_costs',
      'Email/CRM Platform',
      'Marketing automation and email platform costs',
      'cost',
      120,
      0,
      500,
      25,
      'currency',
      -120,
      hourlyRate,
      92,
      'major'
    ),
  ];

  /**
   * TASK TYPE: LEAD SCORING (Multiplier: 1.8x)
   * Automated lead qualification and prioritization
   */
  const lead_scoring_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_qualification_accuracy',
      'Lead Qualification Accuracy',
      'ML-based scoring improves lead quality identification by 45-65%',
      'quality',
      52,
      0,
      85,
      5,
      'percentage',
      0.52,
      baseTimeValue,
      84,
      'Target',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_sales_efficiency',
      'Sales Team Efficiency',
      'Prioritized leads increase sales productivity by 40-60%',
      'time',
      48,
      0,
      80,
      5,
      'percentage',
      0.48,
      baseTimeValue,
      82,
      'TrendingUp',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_conversion_rate',
      'Conversion Rate Lift',
      'Better-qualified leads convert at 30-50% higher rates',
      'revenue',
      38,
      0,
      70,
      5,
      'percentage',
      0.38,
      baseTimeValue,
      80,
      'DollarSign',
      'green',
      'high'
    ),
  ];

  const lead_scoring_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_model_tuning',
      'Scoring Model Refinement',
      'Regular model tuning and criteria updates (4-6 hours/month)',
      'maintenance',
      5,
      0,
      15,
      0.5,
      'hours',
      -(5 * hourlyRate),
      hourlyRate,
      82,
      'major'
    ),
    createNegativeFactor(
      'nf_data_enrichment',
      'Data Enrichment Costs',
      'Third-party data enrichment and lead intelligence services',
      'cost',
      150,
      0,
      600,
      50,
      'currency',
      -150,
      hourlyRate,
      88,
      'major'
    ),
  ];

  /**
   * TASK TYPE: SALES ENABLEMENT (Multiplier: 2.0x)
   * Sales process automation and support
   */
  const sales_enablement_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_deal_velocity',
      'Deal Velocity Increase',
      'Streamlined processes accelerate deal cycles by 35-55%',
      'time',
      42,
      0,
      75,
      5,
      'percentage',
      0.42,
      baseTimeValue,
      82,
      'Zap',
      'purple',
      'high'
    ),
    createPositiveFactor(
      'pf_sales_productivity',
      'Sales Rep Productivity',
      'Automation frees up 40-60% more time for selling activities',
      'time',
      48,
      0,
      80,
      5,
      'percentage',
      0.48,
      baseTimeValue,
      85,
      'Users',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_win_rate',
      'Win Rate Improvement',
      'Better enablement and follow-up increases win rates by 25-40%',
      'revenue',
      30,
      0,
      60,
      5,
      'percentage',
      0.30,
      baseTimeValue,
      78,
      'Trophy',
      'gold',
      'high'
    ),
  ];

  const sales_enablement_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_content_management',
      'Sales Content Updates',
      'Maintaining sales collateral and playbooks (4-6 hours/month)',
      'maintenance',
      5,
      0,
      15,
      0.5,
      'hours',
      -(5 * hourlyRate),
      hourlyRate,
      80,
      'minor'
    ),
    createNegativeFactor(
      'nf_enablement_platform',
      'Sales Enablement Platform',
      'CRM extensions and sales enablement software',
      'cost',
      180,
      0,
      700,
      50,
      'currency',
      -180,
      hourlyRate,
      90,
      'major'
    ),
  ];

  /**
   * TASK TYPE: REVENUE CAPTURE (Multiplier: 2.2x)
   * Direct revenue generation and payment processing
   */
  const revenue_capture_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_transaction_speed',
      'Transaction Processing Speed',
      'Automated processing reduces transaction time by 50-75%',
      'time',
      60,
      0,
      90,
      5,
      'percentage',
      0.60,
      baseTimeValue,
      88,
      'Zap',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_payment_success_rate',
      'Payment Success Rate',
      'Optimized flows increase successful payments by 15-30%',
      'revenue',
      20,
      0,
      50,
      5,
      'percentage',
      0.20,
      baseTimeValue,
      85,
      'CreditCard',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_upsell_capture',
      'Upsell Opportunity Capture',
      'Automated prompts increase upsell conversion by 25-45%',
      'revenue',
      32,
      0,
      65,
      5,
      'percentage',
      0.32,
      baseTimeValue,
      78,
      'TrendingUp',
      'purple',
      'high'
    ),
  ];

  const revenue_capture_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_payment_monitoring',
      'Transaction Monitoring',
      'Fraud prevention and payment reconciliation (4-6 hours/month)',
      'maintenance',
      5,
      0,
      15,
      0.5,
      'hours',
      -(5 * hourlyRate),
      hourlyRate,
      84,
      'major'
    ),
    createNegativeFactor(
      'nf_payment_processing_fees',
      'Payment Gateway Fees',
      'Transaction fees and payment processor charges',
      'cost',
      200,
      0,
      800,
      50,
      'currency',
      -200,
      hourlyRate,
      95,
      'critical'
    ),
  ];

  /**
   * TASK TYPE: CONTRACT/LEGAL (Multiplier: 2.2x)
   * Contract management and legal document automation
   */
  const contract_legal_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_contract_cycle_time',
      'Contract Cycle Time',
      'Automated workflows reduce contract cycle time by 45-70%',
      'time',
      55,
      0,
      85,
      5,
      'percentage',
      0.55,
      baseTimeValue,
      84,
      'FileText',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_compliance_accuracy',
      'Compliance Accuracy',
      'Template-based contracts ensure 60-85% fewer compliance issues',
      'quality',
      70,
      0,
      95,
      5,
      'percentage',
      0.70,
      baseTimeValue,
      88,
      'Shield',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_risk_reduction',
      'Legal Risk Reduction',
      'Standardized terms and audit trails reduce risk exposure by 50-75%',
      'quality',
      60,
      0,
      90,
      5,
      'percentage',
      0.60,
      baseTimeValue,
      82,
      'AlertTriangle',
      'red',
      'high'
    ),
  ];

  const contract_legal_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_template_updates',
      'Legal Template Maintenance',
      'Updating templates for regulatory changes (5-8 hours/month)',
      'maintenance',
      6.5,
      0,
      20,
      0.5,
      'hours',
      -(6.5 * hourlyRate),
      hourlyRate,
      86,
      'major'
    ),
    createNegativeFactor(
      'nf_contract_platform',
      'Contract Management System',
      'Enterprise contract lifecycle management platform',
      'cost',
      250,
      0,
      1000,
      50,
      'currency',
      -250,
      hourlyRate,
      92,
      'critical'
    ),
  ];

  /**
   * TASK TYPE: BOOKING/APPOINTMENT (Multiplier: 2.3x)
   * High-conversion booking and appointment flows
   */
  const booking_appointment_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_booking_conversion',
      'Booking Conversion Rate',
      'Frictionless booking increases conversion by 35-60%',
      'revenue',
      45,
      0,
      80,
      5,
      'percentage',
      0.45,
      baseTimeValue,
      82,
      'Calendar',
      'green',
      'high'
    ),
    createPositiveFactor(
      'pf_no_show_reduction',
      'No-Show Reduction',
      'Automated reminders reduce no-shows by 40-65%',
      'quality',
      50,
      0,
      80,
      5,
      'percentage',
      0.50,
      baseTimeValue,
      85,
      'CheckCircle',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_booking_speed',
      'Booking Completion Speed',
      '24/7 instant booking is 70-90% faster than manual coordination',
      'time',
      78,
      0,
      95,
      5,
      'percentage',
      0.78,
      baseTimeValue,
      88,
      'Zap',
      'purple',
      'high'
    ),
  ];

  const booking_appointment_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_availability_management',
      'Availability Management',
      'Managing complex scheduling rules and exceptions (3-5 hours/month)',
      'maintenance',
      4,
      0,
      15,
      0.5,
      'hours',
      -(4 * hourlyRate),
      hourlyRate,
      78,
      'minor'
    ),
    createNegativeFactor(
      'nf_booking_platform',
      'Booking System Costs',
      'Premium booking and appointment management platform',
      'cost',
      150,
      0,
      600,
      50,
      'currency',
      -150,
      hourlyRate,
      90,
      'major'
    ),
  ];

  /**
   * TASK TYPE: PIPELINE CLOSING (Multiplier: 2.5x)
   * Deal closing and pipeline acceleration
   */
  const pipeline_closing_positive: PositiveFactor[] = [
    createPositiveFactor(
      'pf_close_rate',
      'Close Rate Improvement',
      'Automated follow-up and urgency triggers increase close rates by 30-50%',
      'revenue',
      38,
      0,
      70,
      5,
      'percentage',
      0.38,
      baseTimeValue,
      80,
      'Target',
      'gold',
      'high'
    ),
    createPositiveFactor(
      'pf_sales_cycle_reduction',
      'Sales Cycle Reduction',
      'Streamlined closing process reduces cycle time by 40-65%',
      'time',
      50,
      0,
      80,
      5,
      'percentage',
      0.50,
      baseTimeValue,
      82,
      'Clock',
      'blue',
      'high'
    ),
    createPositiveFactor(
      'pf_deal_size_increase',
      'Average Deal Size Increase',
      'Strategic upselling at close increases deal value by 20-35%',
      'revenue',
      25,
      0,
      55,
      5,
      'percentage',
      0.25,
      baseTimeValue,
      75,
      'DollarSign',
      'green',
      'high'
    ),
  ];

  const pipeline_closing_negative: NegativeFactor[] = [
    createNegativeFactor(
      'nf_workflow_optimization',
      'Closing Workflow Optimization',
      'Fine-tuning triggers and sequences (5-7 hours/month)',
      'maintenance',
      6,
      0,
      20,
      0.5,
      'hours',
      -(6 * hourlyRate),
      hourlyRate,
      80,
      'major'
    ),
    createNegativeFactor(
      'nf_advanced_crm_costs',
      'Advanced CRM Features',
      'Enterprise sales automation and AI-powered insights',
      'cost',
      280,
      0,
      1200,
      50,
      'currency',
      -280,
      hourlyRate,
      92,
      'critical'
    ),
  ];

  // Map all factors by task type
  const defaultPositiveFactors: Record<TaskType, PositiveFactor[]> = {
    internal_admin: internal_admin_positive,
    client_communication: client_communication_positive,
    data_cleaning: data_cleaning_positive,
    scheduling: scheduling_positive,
    reporting: reporting_positive,
    onboarding: onboarding_positive,
    cross_platform_sync: cross_platform_sync_positive,
    outreach: outreach_positive,
    lead_scoring: lead_scoring_positive,
    sales_enablement: sales_enablement_positive,
    revenue_capture: revenue_capture_positive,
    contract_legal: contract_legal_positive,
    booking_appointment: booking_appointment_positive,
    pipeline_closing: pipeline_closing_positive,
  };

  const defaultNegativeFactors: Record<TaskType, NegativeFactor[]> = {
    internal_admin: internal_admin_negative,
    client_communication: client_communication_negative,
    data_cleaning: data_cleaning_negative,
    scheduling: scheduling_negative,
    reporting: reporting_negative,
    onboarding: onboarding_negative,
    cross_platform_sync: cross_platform_sync_negative,
    outreach: outreach_negative,
    lead_scoring: lead_scoring_negative,
    sales_enablement: sales_enablement_negative,
    revenue_capture: revenue_capture_negative,
    contract_legal: contract_legal_negative,
    booking_appointment: booking_appointment_negative,
    pipeline_closing: pipeline_closing_negative,
  };

  // Return factors for the requested task type with fallback
  const positiveFactors = defaultPositiveFactors[taskType] || defaultPositiveFactors.internal_admin;
  const negativeFactors = defaultNegativeFactors[taskType] || defaultNegativeFactors.internal_admin;

  return {
    positiveFactors,
    negativeFactors,
    tokensUsed: 0, // No AI tokens used for default factors
  };
}
