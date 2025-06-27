/**
 * Consolidated Type definitions for Apicus MVP
 * Single source of truth for all application types
 */

import { Node, Edge, ReactFlowInstance, NodeChange, EdgeChange, Viewport, NodeTypes, EdgeTypes } from "@xyflow/react";

// Re-export chart components for convenience
export {default as ResponsiveChart} from '@/app/chart-kit/ResponsiveChart';
export {colors} from '@/app/chart-kit/colors';

/**
 * Core Application Types
 */
export type NodeType = "trigger" | "action" | "decision" | "group" | "emailPreview" | 
  "persona" | "industry" | "painpoint" | "metric" | "urgency" | "socialproof" | "objection" | "value";

export type PlatformType = "zapier" | "make" | "n8n";

/**
 * Node Data Structures
 */
export interface NodeData {
  label: string;
  appName?: string;
  action?: string;
  typeOf?: string;
  conditionType?: string;
  fieldPath?: string;
  operator?: string;
  compareValue?: string;
  minuteContribution?: number;
  
  // Email context node specific fields
  contextType?: string;
  contextValue?: string | string[];
  contextDetails?: Record<string, unknown>;
  isEmailContext?: boolean;
  category?: string;
  
  // Connection state for email context nodes
  isConnectedToEmail?: boolean;
  
  [key: string]: unknown;
}

export interface GroupData {
  label: string;
  nodes: string[];
  nodeMap?: Record<string, {
    minuteContribution: number;
    [key: string]: unknown;
  }>;
  width?: number;
  height?: number;
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
  platform?: PlatformType;
  isLocked?: boolean;
  onLockToggle?: (locked: boolean) => void;
  nodeCount?: number;
}

/**
 * Email Preview Node Data
 */
export interface EmailPreviewNodeData {
  nodeTitle?: string;
  firstName?: string;
  yourName?: string;
  yourCompany?: string;
  yourEmail?: string;
  calendlyLink?: string;
  pdfLink?: string;
  subjectLine?: string;
  hookText?: string;
  ctaText?: string;
  offerText?: string;
  psText?: string;
  testimonialText?: string;
  urgencyText?: string;
  showSubject?: boolean;
  showHook?: boolean;
  showCTA?: boolean;
  showOffer?: boolean;
  showPS?: boolean;
  showTestimonial?: boolean;
  showUrgency?: boolean;
  stats?: {
    roiX: number;
    payback: string;
    runs: number;
  };
  isLoading?: boolean;
  lengthOption?: 'concise' | 'standard' | 'detailed';
  toneOption?: string;
  onOpenNodeProperties?: () => void;
  onRegenerateSection?: (section: string) => void;
  sectionConnections?: EmailSectionConnections;
  [key: string]: unknown;
}

/**
 * Email Section Connections
 */
export interface EmailSectionConnection {
  connectedNodeIds: string[];
  hasChanges?: boolean;
  regenerateNeeded?: boolean;
  lastContent?: string;
}

export interface EmailSectionConnections {
  subject?: EmailSectionConnection;
  hook?: EmailSectionConnection;
  cta?: EmailSectionConnection;
  offer?: EmailSectionConnection;
  ps?: EmailSectionConnection;
  testimonial?: EmailSectionConnection;
  urgency?: EmailSectionConnection;
}

/**
 * Scenario Definition
 */
export interface Scenario {
  id?: number;
  slug: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  platform?: PlatformType;
  
  // ROI Configuration
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
  taskType?: string;
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  
  // Canvas State
  nodesSnapshot?: unknown[];
  edgesSnapshot?: unknown[];
  viewport?: unknown;
  
  // Template & Search
  originalTemplateId?: string;
  searchQuery?: string;
  alternativeTemplatesCache?: unknown[];
  
  // Email Configuration
  emailFirstName?: string;
  emailYourName?: string;
  emailYourCompany?: string;
  emailYourEmail?: string;
  emailCalendlyLink?: string;
  emailPdfLink?: string;
  emailHookText?: string;
  emailCtaText?: string;
  emailSubjectLine?: string;
  emailOfferText?: string;
  emailPsText?: string;
  emailTestimonialText?: string;
  emailUrgencyText?: string;
}

/**
 * Alternative Template for Search Results
 */
export interface AlternativeTemplate {
  id: string;
  name: string;
  description?: string;
  platform: PlatformType;
  nodes: Node[];
  edges: Edge[];
  templateId?: string;
  sourceUrl?: string;
  category?: string;
  tags?: string[];
  estimatedMinutes?: number;
}

/**
 * ROI Calculation Types
 */
export interface ROISettings {
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  taskType: string;
  complianceEnabled: boolean;
  revenueEnabled: boolean;
  riskLevel: number;
  riskFrequency: number;
  errorCost: number;
  monthlyVolume: number;
  conversionRate: number;
  valuePerConversion: number;
}

export interface ROICalculation {
  timeValue: number;
  riskValue: number;
  revenueValue: number;
  totalValue: number;
  platformCost: number;
  netROI: number;
  roiRatio: number;
  paybackPeriod: number;
}

/**
 * Analytics & Metrics
 */
export interface MetricSnapshot {
  id?: number;
  scenarioId: number;
  timestamp: number;
  metrics: {
    netROI: number;
    roiRatio: number;
    timeValue: number;
    riskValue?: number;
    revenueValue?: number;
    platformCost: number;
    runsPerMonth: number;
    minutesPerRun: number;
    hourlyRate: number;
    taskMultiplier: number;
    taskType: string;
    totalValue: number;
    paybackPeriod?: string;
    breakEvenRuns?: number;
  };
  trigger: 'manual' | 'save' | 'platform_change' | 'major_edit' | 'scheduled';
}

/**
 * Pricing Types
 */
export interface PricingTier {
  name: string;
  monthlyUSD: number;
  quota: number;
}

export interface PlatformPricing {
  unit: string;
  tiers: PricingTier[];
  cost?: (tierName: string, usedUnits: number) => { cost: number; over: number };
}

export interface PricingData {
  zapier: PlatformPricing;
  make: PlatformPricing;
  n8n: PlatformPricing;
}

/**
 * Template Data for Scenario Creation
 */
export interface TemplateData {
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
  platform?: PlatformType;
  viewport?: Viewport;
  taskType?: string;
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
}

/**
 * Component Props Interfaces
 */
export interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  platform: PlatformType;
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  edges?: Edge[];
}

export interface GroupPropertiesPanelProps {
  selectedGroup: Node | null;
  onClose: () => void;
  platform: PlatformType;
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
}

export interface StatsBarProps {
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  onUpdateRuns: (runs: number) => void;
  onUpdateMinutes: (minutes: number) => void;
  nodes?: Node[];
  currentScenario?: Scenario;
  
  // Additional control handlers
  onPlatformChange?: (platform: PlatformType) => void;
  onOpenROISettings?: () => void;
  onAddNode?: () => void;
  onGenerateEmail?: () => void;
  isGeneratingEmail?: boolean;
  onCreateGroup?: () => void;
  onUngroup?: () => void;
  selectedIds?: string[];
  selectedGroupId?: string | null;
  isMultiSelectionActive?: boolean;
}

export interface PlatformSwitcherProps {
  value: PlatformType;
  onChange: (platform: PlatformType) => void;
}

export interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onMoveEnd?: (event: MouseEvent | TouchEvent | null, viewport: Viewport) => void;
  onInit?: (instance: ReactFlowInstance) => void;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  defaultViewport?: Viewport;
  setWrapperRef?: (ref: HTMLDivElement | null) => void;

  // Props for scenario title editing
  currentScenarioName?: string;
  isEditingTitle?: boolean;
  editingScenarioName?: string;
  onToggleEditTitle?: (editing: boolean) => void;
  onScenarioNameChange?: (newName: string) => void;
  onSaveScenarioName?: () => void;
  onScenarioNameKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
  
  // Props for floating node selector
  selectedNodeType?: NodeType;
  onNodeTypeChange?: (type: NodeType) => void;
}

export interface PixelNodeProps {
  data: NodeData;
  selected: boolean;
  type: NodeType;
} 