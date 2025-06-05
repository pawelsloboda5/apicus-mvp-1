import { Node, Edge, ReactFlowInstance, NodeChange, EdgeChange, Viewport, NodeTypes, EdgeTypes } from "@xyflow/react";

export type NodeType = "trigger" | "action" | "decision" | "group" | "persona" | "industry" | "painpoint" | "metric" | "urgency" | "socialproof" | "objection" | "value";
export type PlatformType = "zapier" | "make" | "n8n";

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