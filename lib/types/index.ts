/**
 * Type definitions for Apicus MVP
 */

import { Node, Edge } from "@xyflow/react";

/**
 * Node data structure
 */
export interface NodeData {
  label: string;
  appName?: string;
  action?: string;
  typeOf?: string;
  [key: string]: unknown;
}

/**
 * Platform types supported in the application
 */
export type PlatformType = "zapier" | "make" | "n8n";

/**
 * Node types supported in the application
 */
export type NodeType = "trigger" | "action" | "decision";

/**
 * ROI calculation related types
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

/**
 * Pricing tier structure
 */
export interface PricingTier {
  name: string;
  monthlyUSD: number;
  quota: number;
}

/**
 * Platform pricing structure
 */
export interface PlatformPricing {
  unit: string;
  tiers: PricingTier[];
}

/**
 * Pricing data structure
 */
export interface PricingData {
  zapier: PlatformPricing;
  make: PlatformPricing;
  n8n: PlatformPricing;
}

/**
 * ROI calculation results
 */
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
 * Props for the StatsBar component
 */
export interface StatsBarProps {
  platform: PlatformType;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
}

/**
 * Props for the PlatformSwitcher component
 */
export interface PlatformSwitcherProps {
  value: PlatformType;
  onChange: (platform: PlatformType) => void;
}

/**
 * Props for the NodePropertiesPanel component
 */
export interface NodePropertiesPanelProps {
  selectedNode: Node<NodeData> | undefined;
  onClose: () => void;
  platform: PlatformType;
  nodes: Node<NodeData>[];
  setNodes: (updater: (nodes: Node<NodeData>[]) => Node<NodeData>[]) => void;
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
}

/**
 * Props for the FlowCanvas component
 */
export interface FlowCanvasProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: (changes: unknown) => void;
  onEdgesChange: (changes: unknown) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onMoveEnd: (viewport: unknown, event?: unknown) => void;
  onInit: (instance: unknown) => void;
  nodeTypes: Record<string, React.ComponentType<unknown>>;
  edgeTypes?: Record<string, React.ComponentType<unknown>>;
  defaultViewport?: { x: number; y: number; zoom: number };
  setWrapperRef: (ref: HTMLDivElement | null) => void;
}

/**
 * Props for the PixelNode component
 */
export interface PixelNodeProps {
  data: NodeData;
  selected: boolean;
  type: NodeType;
} 