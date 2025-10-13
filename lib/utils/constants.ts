/**
 * Shared constants for Apicus MVP
 * Centralizes magic numbers, defaults, and configuration values
 */

import { NodeType } from '../types';

/**
 * Default ROI Configuration
 */
export const DEFAULT_ROI_SETTINGS = {
  runsPerMonth: 250,
  minutesPerRun: 3,
  hourlyRate: 30,
  taskMultiplier: 1.0,
  taskType: 'internal_admin',
  complianceEnabled: false,
  riskLevel: 3,
  riskFrequency: 5,
  errorCost: 500,
  revenueEnabled: false,
  monthlyVolume: 100,
  conversionRate: 5,
  valuePerConversion: 200,
} as const;

/**
 * Task Type Multipliers
 */
export const TASK_TYPE_MULTIPLIERS = {
  internal_admin: 1.0,
  client_communication: 1.2,
  data_cleaning: 1.2,
  scheduling: 1.3,
  reporting: 1.3,
  onboarding: 1.5,
  cross_platform_sync: 1.5,
  outreach: 1.6,
  lead_scoring: 1.8,
  sales_enablement: 2.0,
  revenue_capture: 2.2,
  contract_legal: 2.2,
  booking_appointment: 2.3,
  pipeline_closing: 2.5,
} as const;

/**
 * Industry Benchmarks
 */
export const BENCHMARKS = {
  runs: {
    low: 100,
    medium: 1000,
    high: 5000,
  },
  minutes: {
    internal_admin: 3,
    client_communication: 5,
    data_cleaning: 8,
    scheduling: 4,
    reporting: 10,
    onboarding: 15,
    cross_platform_sync: 6,
    outreach: 5,
    lead_scoring: 7,
    sales_enablement: 10,
    revenue_capture: 8,
    contract_legal: 12,
    booking_appointment: 6,
    pipeline_closing: 12,
  },
  hourlyRate: {
    internal_admin: 25,
    client_communication: 30,
    data_cleaning: 25,
    scheduling: 30,
    reporting: 35,
    onboarding: 40,
    cross_platform_sync: 35,
    outreach: 35,
    lead_scoring: 45,
    sales_enablement: 50,
    revenue_capture: 55,
    contract_legal: 60,
    booking_appointment: 40,
    pipeline_closing: 60,
  },
} as const;

/**
 * Node Configuration
 */
export const NODE_DEFAULTS = {
  width: 180,
  height: 40,
  emailNodeWidth: 700,
  emailNodeHeight: 900,
  groupMinWidth: 200,
  groupMinHeight: 100,
  minWidth: 150,
  maxWidth: 500,
  padding: 20,
  iconSize: 32,
  textPadding: 12,
} as const;

/**
 * Width calculation utilities
 */
export const WIDTH_CALCULATION = {
  // Character width estimation (pixels)
  charWidth: 8.5,
  // Font sizes
  primaryFontSize: 16,
  secondaryFontSize: 14,
  // Line height multiplier
  lineHeight: 1.2,
  // Additional padding for badges, icons, etc.
  badgePadding: 30,
  iconPadding: 48,
  pricingPadding: 45,
  // Minimum spacing between elements
  elementSpacing: 12,
} as const;

/**
 * Node Time Savings Factors
 */
export const NODE_TIME_FACTORS: Record<NodeType, number> = {
  trigger: 0.5,
  action: 1.2,
  decision: 0.8,
  group: 0,
  emailPreview: 0,
  // Email context nodes have minimal time impact
  persona: 0,
  industry: 0,
  painpoint: 0,
  metric: 0,
  urgency: 0,
  socialproof: 0,
  objection: 0,
  value: 0,
} as const;

/**
 * Canvas & Layout Configuration
 */
export const CANVAS_CONFIG = {
  gridSize: 8,
  snapTolerance: 8,
  minZoom: 0.1,
  maxZoom: 4,
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  nodeSpacing: 200,          // Increased from 150 for better spacing
  rankSpacing: 250,          // New: spacing between columns/ranks
  nodeGap: 80,              // New: minimum gap between nodes
  verticalGap: 100,         // New: vertical spacing for positioning
  groupPadding: 20,
} as const;

/**
 * Drag & Drop Configuration
 */
export const DND_CONFIG = {
  activationDistance: 8, // pixels
  touchActivationDistance: 12,
  snapModifierStep: 8,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  toolboxWidth: {
    default: 280,
    collapsed: 48,
    min: 200,
    max: 500,
  },
  panelWidths: {
    nodeProperties: 480,
    groupProperties: 400,
    emailProperties: 540,
    roiSettings: 540,
  },
  mobileBreakpoint: 1024,
  touchTargetSize: 44, // minimum touch target size for mobile
} as const;

/**
 * Animation & Timing
 */
export const ANIMATION_CONFIG = {
  transitionDuration: 300,
  saveDebounceDelay: 300,
  loadingDelay: 100,
  autoSaveInterval: 5000,
} as const;

/**
 * File & Data Limits
 */
export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxNodes: 1000,
  maxScenarioNameLength: 100,
  maxTemplateSearchResults: 50,
  maxAlternativeTemplates: 5,
  maxMetricSnapshots: 100,
} as const;

/**
 * Default Email Configuration
 */
export const DEFAULT_EMAIL_CONFIG = {
  firstName: '',
  yourName: '',
  yourCompany: '',
  yourEmail: '',
  calendlyLink: '',
  pdfLink: '',
  subjectLine: 'Streamline Your Workflow & See Immediate ROI',
  hookText: 'I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.',
  ctaText: 'I packaged the numbers and a quick how it works diagram into a one-page PDF here:',
  offerText: 'If you\'d like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.',
  psText: 'PS - Most teams see results within the first 48 hours of setup.',
  testimonialText: '',
  urgencyText: '',
  lengthOption: 'standard' as const,
  toneOption: 'professional_warm',
} as const;

/**
 * Email Context Templates
 */
export const EMAIL_CONTEXT_DEFAULTS = {
  persona: 'Marketing Manager',
  industry: 'SaaS',
  painpoint: 'Manual data entry',
  metric: 'Time saved per week',
  urgency: 'End of quarter',
  socialproof: '500+ companies automated',
  objection: 'No technical skills needed',
  value: '10x faster than competitors',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  scenario: {
    notFound: 'Scenario not found',
    loadFailed: 'Failed to load scenario',
    saveFailed: 'Failed to save scenario',
    deleteFailed: 'Failed to delete scenario',
  },
  email: {
    generationFailed: 'Failed to generate email content',
    sectionGenerationFailed: 'Failed to generate email section',
    invalidParameters: 'Invalid email parameters provided',
  },
  template: {
    searchFailed: 'Failed to search templates',
    loadFailed: 'Failed to load template',
    invalidFormat: 'Invalid template format',
  },
  roi: {
    calculationFailed: 'Failed to calculate ROI metrics',
    invalidInputs: 'Invalid ROI input parameters',
  },
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  scenario: {
    saved: 'Scenario saved successfully',
    created: 'New scenario created',
    deleted: 'Scenario deleted',
    renamed: 'Scenario renamed',
  },
  email: {
    generated: 'Email generated successfully',
    sectionGenerated: 'Email section updated',
  },
  template: {
    loaded: 'Template loaded successfully',
    imported: 'Workflow imported successfully',
  },
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  endpoints: {
    templates: '/api/templates',
    templateSearch: '/api/templates/search',
    openai: '/api/openai',
    generateEmail: '/api/openai/generate-full-email',
    generateSection: '/api/openai/generate-email-section',
    debug: '/api/debug',
  },
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  emailTemplateDefaults: 'emailTemplateDefaults',
  userPreferences: 'apicus_userPreferences',
  lastScenarioId: 'apicus_lastScenarioId',
  canvasPosition: 'apicus_canvasPosition',
  toolboxWidth: 'apicus_toolboxWidth',
  toolboxCollapsed: 'apicus_toolboxCollapsed',
} as const;

/**
 * Width calculation utilities
 */
export function calculateNodeWidth(
  primaryText: string,
  secondaryText?: string,
  hasBadge?: boolean,
  hasIcon?: boolean,
  isEmailContext?: boolean,
  hasPricing?: boolean
): number {
  const { charWidth, badgePadding, iconPadding, pricingPadding, elementSpacing } = WIDTH_CALCULATION;
  const { minWidth, maxWidth, padding } = NODE_DEFAULTS;
  
  // Calculate primary text width with more generous spacing
  const primaryWidth = primaryText.length * charWidth * 1.1; // Add 10% extra for letter spacing
  
  // Calculate secondary text width if present
  const secondaryWidth = secondaryText ? secondaryText.length * charWidth : 0;
  
  // Take the larger of primary or secondary text
  const textWidth = Math.max(primaryWidth, secondaryWidth);
  
  // Add padding and spacing
  let totalWidth = textWidth + (padding * 2);
  
  // Add icon space if present (now larger)
  if (hasIcon) {
    totalWidth += iconPadding;
  }
  
  // Add badge space if present
  if (hasBadge) {
    totalWidth += badgePadding;
  }
  
  // Add pricing space if present
  if (hasPricing) {
    totalWidth += pricingPadding;
  }
  
  // Add extra spacing for email context nodes
  if (isEmailContext) {
    totalWidth += elementSpacing * 2;
  }
  
  // Add minimum padding to ensure text doesn't feel cramped
  totalWidth += elementSpacing;
  
  // Ensure within min/max bounds
  return Math.max(minWidth, Math.min(maxWidth, totalWidth));
}

/**
 * Generate a simple hash for content to detect changes
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Email Context Templates for Email Context Nodes
 */
export interface EmailContextTemplate {
  label: string;
  multiSelect?: boolean;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

export const EMAIL_CONTEXT_TEMPLATES: Record<string, EmailContextTemplate> = {
  persona: {
    label: "Common Personas",
    options: [
      { value: "Marketing Manager", label: "Marketing Manager", description: "Mid-level marketing professional" },
      { value: "Sales Director", label: "Sales Director", description: "Senior sales leadership" },
      { value: "Operations Manager", label: "Operations Manager", description: "Process optimization focused" },
      { value: "Small Business Owner", label: "Small Business Owner", description: "Resource-conscious decision maker" },
      { value: "IT Administrator", label: "IT Administrator", description: "Technical implementation focused" },
      { value: "CEO/Founder", label: "CEO/Founder", description: "Strategic, ROI-focused" },
      { value: "Product Manager", label: "Product Manager", description: "Feature and efficiency focused" },
      { value: "Finance Director", label: "Finance Director", description: "Cost and compliance focused" },
    ]
  },
  industry: {
    label: "Industry Verticals",
    options: [
      { value: "SaaS", label: "SaaS", description: "Software as a Service" },
      { value: "E-commerce", label: "E-commerce", description: "Online retail and marketplaces" },
      { value: "Healthcare", label: "Healthcare", description: "Medical and health services" },
      { value: "Financial Services", label: "Financial Services", description: "Banking, insurance, fintech" },
      { value: "Manufacturing", label: "Manufacturing", description: "Production and supply chain" },
      { value: "Real Estate", label: "Real Estate", description: "Property and realty services" },
      { value: "Education", label: "Education", description: "Schools and learning platforms" },
      { value: "Consulting", label: "Consulting", description: "Professional services" },
    ]
  },
  painpoint: {
    label: "Common Pain Points",
    multiSelect: true,
    options: [
      { value: "Manual data entry", label: "Manual data entry", description: "Repetitive typing and copying" },
      { value: "Slow response times", label: "Slow response times", description: "Delayed customer service" },
      { value: "Data silos", label: "Data silos", description: "Disconnected systems" },
      { value: "Human errors", label: "Human errors", description: "Mistakes in manual processes" },
      { value: "Scaling challenges", label: "Scaling challenges", description: "Can't grow efficiently" },
      { value: "Compliance risks", label: "Compliance risks", description: "Regulatory concerns" },
      { value: "High operational costs", label: "High operational costs", description: "Expensive manual work" },
      { value: "Poor visibility", label: "Poor visibility", description: "Lack of real-time insights" },
    ]
  },
  metric: {
    label: "Success Metrics",
    multiSelect: true,
    options: [
      { value: "Time saved per week", label: "Time saved per week", description: "Hours freed up" },
      { value: "Cost reduction %", label: "Cost reduction %", description: "Operational savings" },
      { value: "Error rate reduction", label: "Error rate reduction", description: "Fewer mistakes" },
      { value: "Customer response time", label: "Customer response time", description: "Faster service" },
      { value: "Revenue per employee", label: "Revenue per employee", description: "Productivity gains" },
      { value: "Process cycle time", label: "Process cycle time", description: "Faster completion" },
      { value: "Customer satisfaction", label: "Customer satisfaction", description: "Happier clients" },
      { value: "ROI percentage", label: "ROI percentage", description: "Return on investment" },
    ]
  },
  urgency: {
    label: "Urgency Factors",
    options: [
      { value: "End of quarter", label: "End of quarter", description: "Q4 deadlines approaching" },
      { value: "Budget season", label: "Budget season", description: "Annual planning time" },
      { value: "Competitor advantage", label: "Competitor advantage", description: "Others are automating" },
      { value: "Regulatory deadline", label: "Regulatory deadline", description: "Compliance requirements" },
      { value: "Scaling rapidly", label: "Scaling rapidly", description: "Growing too fast" },
      { value: "Staff turnover", label: "Staff turnover", description: "Losing institutional knowledge" },
      { value: "Peak season coming", label: "Peak season coming", description: "Busy period ahead" },
      { value: "Cost pressures", label: "Cost pressures", description: "Need to reduce expenses" },
    ]
  },
  socialproof: {
    label: "Social Proof Elements",
    options: [
      { value: "500+ companies automated", label: "500+ companies automated", description: "Large customer base" },
      { value: "98% customer satisfaction", label: "98% customer satisfaction", description: "High approval rating" },
      { value: "$2M+ saved for clients", label: "$2M+ saved for clients", description: "Proven financial impact" },
      { value: "Industry leader trusted", label: "Industry leader trusted", description: "Big name endorsement" },
      { value: "5-star rated solution", label: "5-star rated solution", description: "Top reviews" },
      { value: "Case study available", label: "Case study available", description: "Documented success" },
      { value: "Award-winning platform", label: "Award-winning platform", description: "Industry recognition" },
      { value: "10,000+ workflows built", label: "10,000+ workflows built", description: "Extensive experience" },
    ]
  },
  objection: {
    label: "Common Objections",
    multiSelect: true,
    options: [
      { value: "No technical skills needed", label: "No technical skills needed", description: "Easy to use" },
      { value: "Free trial available", label: "Free trial available", description: "Try before buying" },
      { value: "IT approved solution", label: "IT approved solution", description: "Security cleared" },
      { value: "No coding required", label: "No coding required", description: "Visual builder" },
      { value: "Quick implementation", label: "Quick implementation", description: "Fast setup" },
      { value: "Full support included", label: "Full support included", description: "Help available" },
      { value: "Pay as you grow", label: "Pay as you grow", description: "Flexible pricing" },
      { value: "Data stays secure", label: "Data stays secure", description: "Privacy protected" },
    ]
  },
  value: {
    label: "Value Propositions",
    multiSelect: true,
    options: [
      { value: "10x faster processing", label: "10x faster processing", description: "Speed improvement" },
      { value: "50% cost reduction", label: "50% cost reduction", description: "Major savings" },
      { value: "Zero manual errors", label: "Zero manual errors", description: "Perfect accuracy" },
      { value: "24/7 automation", label: "24/7 automation", description: "Always running" },
      { value: "Instant ROI", label: "Instant ROI", description: "Immediate payback" },
      { value: "Seamless integration", label: "Seamless integration", description: "Works with your tools" },
      { value: "Scale infinitely", label: "Scale infinitely", description: "No growth limits" },
      { value: "Real-time insights", label: "Real-time insights", description: "Live dashboards" },
    ]
  }
} as const; 