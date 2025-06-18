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
  taskMultiplier: 1.5,
  taskType: 'general',
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
  general: 1.5,
  admin: 1.3,
  customer_support: 1.7,
  sales: 2.0,
  marketing: 1.8,
  compliance: 2.2,
  operations: 1.6,
  finance: 1.9,
  lead_gen: 2.1,
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
    admin: 4,
    customer_support: 8,
    sales: 10,
    marketing: 15,
    compliance: 12,
    operations: 7,
    finance: 9,
    lead_gen: 6,
    general: 5,
  },
  hourlyRate: {
    admin: 25,
    customer_support: 30,
    sales: 45,
    marketing: 40,
    compliance: 50,
    operations: 35,
    finance: 55,
    lead_gen: 40,
    general: 30,
  },
} as const;

/**
 * Node Configuration
 */
export const NODE_DEFAULTS = {
  width: 150,
  height: 40,
  emailNodeWidth: 700,
  emailNodeHeight: 900,
  groupMinWidth: 200,
  groupMinHeight: 100,
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
  nodeSpacing: 150,
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