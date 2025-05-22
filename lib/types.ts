import { Node, Edge, ReactFlowInstance, Connection, NodeChange, EdgeChange, Viewport } from "@xyflow/react";

export type NodeType = "trigger" | "action" | "decision" | "group";
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
}

export interface GroupData {
  label: string;
  nodes: string[];
  nodeMap?: Record<string, any>;
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
  onMoveEnd?: (event: React.MouseEvent, viewport: Viewport) => void;
  onInit?: (instance: ReactFlowInstance) => void;
  nodeTypes?: Record<string, React.ComponentType<any>>;
  edgeTypes?: Record<string, React.ComponentType<any>>;
  defaultViewport?: Viewport;
  setWrapperRef?: (ref: HTMLDivElement | null) => void;
} 