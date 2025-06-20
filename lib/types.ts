import { Node, Edge, ReactFlowInstance, NodeChange, EdgeChange, Viewport, NodeTypes, EdgeTypes } from "@xyflow/react";

export type NodeType = "trigger" | "action" | "decision" | "group" | "persona" | "industry" | "painpoint" | "metric" | "urgency" | "socialproof" | "objection" | "value";
export type PlatformType = "zapier" | "make" | "n8n";

// App Pricing Data Structure (from appPricingMap in templates)
export interface AppPricingData {
  appId: string;
  appName: string;
  appSlug: string;
  hasFreeTier: boolean;
  hasFreeTrial: boolean;
  currency: string;
  lowestMonthlyPrice: number;
  highestMonthlyPrice: number;
  tierCount: number;
  hasUsageBasedPricing: boolean;
  hasAIFeatures: boolean;
  logoUrl?: string;
  description?: string;
  limits?: {
    users?: string;
    custom_limits?: Record<string, unknown> | null;
  };
  ai_specific_pricing?: {
    has_token_based_pricing: boolean;
    input_token_price: number | null;
    output_token_price: number | null;
    models_pricing: Record<string, {
      input: number;
      output: number;
    }> | null;
    has_inference_pricing: boolean;
    has_fine_tuning_pricing: boolean;
    has_training_pricing: boolean;
    ai_addon_available: boolean;
  };
}

// Template Step from MongoDB
export interface TemplateStep {
  index: number;
  label: string;
  action: string;
  typeOf: string;
  appId: string;
  appName: string;
  appSlug: string;
}

// Template Node (React Flow compatible)
export interface TemplateNode {
  reactFlowId: string;
  type: string;
  label: string;
  platformMeta?: {
    action: string;
    typeOf: string;
    appId: string;
    appSlug: string;
    appName: string;
  };
  data: {
    index: number;
    label: string;
    action: string;
    typeOf: string;
    appId: string;
    appName: string;
    appSlug: string;
  };
  position: {
    x: number;
    y: number;
  };
}

// Template Edge (React Flow compatible)
export interface TemplateEdge {
  reactFlowId: string;
  label: string | null;
  data: {
    source: string;
    target: string;
  };
}

// Complete Template from MongoDB apicus-templates collection
export interface AutomationTemplate {
  _id?: string;
  templateId: string;
  title: string;
  url?: string;
  editorUrl?: string;
  source: string;
  platform?: string;
  richDescription?: string;
  exampleUserPrompts?: string[];
  steps: TemplateStep[];
  appIds: string[];
  appNames: string[];
  stepCount: number;
  firstStepType: string;
  lastStepType: string;
  stepSequence: string[];
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
  embedding?: number[]; // Vector embedding for similarity search (1536 dimensions)
  appPricingMap?: Record<string, AppPricingData>;
  pricingEnrichedAt?: Date;
}

// Template Response (excluding embedding for client responses)
export interface TemplateResponse extends Omit<AutomationTemplate, 'embedding'> {
  mongoId?: string;
}

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
  contextValue?: string;
  contextDetails?: Record<string, unknown>;
  isEmailContext?: boolean;
  
  // Template-derived data
  appId?: string;
  appSlug?: string;
  index?: number;
}

export interface GroupData {
  label: string;
  nodes: string[];
  nodeMap?: Record<string, unknown>;
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
  currentScenario?: unknown;
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
  setDroppableRef?: (ref: HTMLDivElement | null) => void;
  isOver?: boolean;

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
  
  // Props for email regeneration
  handleRegenerateSection?: (nodeId: string, section: string) => void;
}

export interface Scenario {
  id?: number;
  slug: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  platform?: PlatformType;
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
  nodesSnapshot?: unknown[];
  edgesSnapshot?: unknown[];
  viewport?: unknown;
  originalTemplateId?: string;
  searchQuery?: string;
  alternativeTemplatesCache?: unknown[];
  
  // Template pricing data cache
  templatePricingData?: Record<string, AppPricingData>;
  
  // Email personalization fields
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

// Email Preview Node Data
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
  sectionConnections?: Record<string, {
    connectedNodeIds: string[];
    lastContent?: string;
    hasChanges?: boolean;
    regenerateNeeded?: boolean;
  }>;
}

// Analytics Types
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

// API Response Types
export interface TemplateSearchResponse {
  templates: TemplateResponse[];
  searchType: 'cosmos' | 'atlas';
  total?: number;
}

export interface TemplatePricingResponse {
  templateId: string;
  appPricingMap: Record<string, AppPricingData>;
  totalApps: number;
  pricingEnrichedAt?: Date;
}