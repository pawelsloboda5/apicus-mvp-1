import { Node, Edge } from "@xyflow/react";
import { nanoid } from "nanoid";

/**
 * Adds a new node to the React Flow canvas
 * @param setNodes React Flow node setter function
 * @param currentNodes Current array of nodes
 * @param type Optional node type (defaults to "action")
 * @param position Optional custom position (defaults to random position)
 */
export function handleAddNode(
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  currentNodes: Node[],
  type: "trigger" | "action" | "decision" = "action",
  position?: { x: number; y: number }
) {
  const id = nanoid(6);
  const defaultPosition = {
    x: Math.random() * 400 + 100,
    y: Math.random() * 200 + 100,
  };

  setNodes((nds) => [
    ...nds,
    {
      id,
      type,
      position: position || defaultPosition,
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nds.length + 1}` },
    },
  ]);

  return id;
}

/**
 * Calculates the snap position to the nearest grid point
 * @param x X coordinate
 * @param y Y coordinate
 * @param gridSize Grid size in pixels (default: 8)
 * @returns Object with snapped x and y coordinates
 */
export function snapToGrid(x: number, y: number, gridSize: number = 8) {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

/**
 * Gets a position for a new node that doesn't overlap with existing nodes
 * @param nodes Existing nodes
 * @param nodeWidth Width of the node
 * @param gridSize Grid size for snapping
 * @returns Non-overlapping position snapped to grid
 */
export function getNonOverlappingPosition(
  nodes: Node[],
  nodeWidth: number = 150,
  gridSize: number = 8
) {
  // Start with a base position
  let x = 100;
  let y = 100;
  
  // If there are existing nodes, try to place next to the rightmost node
  if (nodes.length > 0) {
    // Find rightmost node
    const rightmostNode = nodes.reduce((max, node) => 
      node.position.x > max.position.x ? node : max
    , nodes[0]);
    
    // Position to the right of that node
    x = rightmostNode.position.x + nodeWidth + gridSize * 2;
    y = rightmostNode.position.y;
  }
  
  return snapToGrid(x, y);
}

/**
 * Email Context Connection Management
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
 * Updates section connections when an email context node is connected
 * @param currentConnections Current section connections
 * @param section The section being connected to
 * @param nodeId The ID of the connecting node
 * @returns Updated section connections
 */
export function addSectionConnection(
  currentConnections: EmailSectionConnections,
  section: keyof EmailSectionConnections,
  nodeId: string
): EmailSectionConnections {
  const sectionData = currentConnections[section] || { connectedNodeIds: [] };
  
  // Check if already connected
  if (sectionData.connectedNodeIds.includes(nodeId)) {
    return currentConnections;
  }
  
  return {
    ...currentConnections,
    [section]: {
      ...sectionData,
      connectedNodeIds: [...sectionData.connectedNodeIds, nodeId],
      hasChanges: true,
      regenerateNeeded: true,
    }
  };
}

/**
 * Removes a section connection when an edge is deleted
 * @param currentConnections Current section connections
 * @param section The section to disconnect from
 * @param nodeId The ID of the disconnecting node
 * @returns Updated section connections
 */
export function removeSectionConnection(
  currentConnections: EmailSectionConnections,
  section: keyof EmailSectionConnections,
  nodeId: string
): EmailSectionConnections {
  const sectionData = currentConnections[section];
  if (!sectionData) return currentConnections;
  
  const updatedNodeIds = sectionData.connectedNodeIds.filter(id => id !== nodeId);
  
  // If no more connections, remove the section data
  if (updatedNodeIds.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [section]: removed, ...rest } = currentConnections;
    return rest;
  }
  
  return {
    ...currentConnections,
    [section]: {
      ...sectionData,
      connectedNodeIds: updatedNodeIds,
      hasChanges: true,
      regenerateNeeded: true,
    }
  };
}

/**
 * Marks a section as having changes when a connected node is updated
 * @param currentConnections Current section connections
 * @param nodeId The ID of the updated node
 * @returns Updated section connections with marked changes
 */
export function markSectionsWithChanges(
  currentConnections: EmailSectionConnections,
  nodeId: string
): EmailSectionConnections {
  const updatedConnections: EmailSectionConnections = {};
  
  // Check each section for the node connection
  Object.entries(currentConnections).forEach(([section, data]) => {
    if (data && data.connectedNodeIds.includes(nodeId)) {
      updatedConnections[section as keyof EmailSectionConnections] = {
        ...data,
        hasChanges: true,
        regenerateNeeded: true,
      };
    } else if (data) {
      updatedConnections[section as keyof EmailSectionConnections] = data;
    }
  });
  
  return updatedConnections;
}

/**
 * Resets the change flag for a section after regeneration
 * @param currentConnections Current section connections
 * @param section The section that was regenerated
 * @param newContent The new content after regeneration
 * @returns Updated section connections
 */
export function resetSectionChanges(
  currentConnections: EmailSectionConnections,
  section: keyof EmailSectionConnections,
  newContent?: string
): EmailSectionConnections {
  const sectionData = currentConnections[section];
  if (!sectionData) return currentConnections;
  
  return {
    ...currentConnections,
    [section]: {
      ...sectionData,
      hasChanges: false,
      regenerateNeeded: false,
      lastContent: newContent,
    }
  };
}

/**
 * Gets all connected email context nodes for a specific section
 * @param nodes All nodes in the flow
 * @param sectionConnections The section connections
 * @param section The specific section to get nodes for
 * @returns Array of connected email context nodes
 */
export function getConnectedContextNodes(
  nodes: Node[],
  sectionConnections: EmailSectionConnections,
  section: keyof EmailSectionConnections
): Node[] {
  const sectionData = sectionConnections[section];
  if (!sectionData) return [];
  
  return nodes.filter(node => sectionData.connectedNodeIds.includes(node.id));
}

/**
 * Checks if any section needs regeneration
 * @param sectionConnections The section connections
 * @returns True if any section needs regeneration
 */
export function hasAnyRegenerateNeeded(sectionConnections: EmailSectionConnections): boolean {
  return Object.values(sectionConnections).some(
    section => section?.regenerateNeeded === true
  );
}

/**
 * Interface for template node data from MongoDB
 */
interface TemplateNodeData {
  id?: string;
  reactFlowId?: string;
  type?: string;
  position?: { x: number; y: number };
  label?: string;
  data?: Record<string, unknown>;
  platformMeta?: Record<string, unknown>;
}

/**
 * Interface for template edge data from MongoDB
 */
interface TemplateEdgeData {
  id?: string;
  reactFlowId?: string;
  source?: string;
  target?: string;
  type?: string;
  data?: Record<string, unknown>;
  label?: string;
}

/**
 * Transform template nodes from MongoDB format (with reactFlowId) to React Flow format (with id)
 */
export function transformTemplateNodes(nodes: TemplateNodeData[], templateId?: string): Node[] {
  if (!nodes || !Array.isArray(nodes)) return [];
  
  return nodes.map((node, index) => ({
    id: node.id || node.reactFlowId || `node-${templateId || 'template'}-${index}-${nanoid(6)}`,
    type: node.type || 'action',
    position: node.position || { x: 250 * index, y: 200 },
    data: {
      label: node.label || node.data?.label || 'Node',
      ...node.data,
      ...(node.platformMeta || {}),
    }
  }));
}

/**
 * Transform template edges from MongoDB format to React Flow format
 */
export function transformTemplateEdges(edges: TemplateEdgeData[], templateId?: string): Edge[] {
  if (!edges || !Array.isArray(edges)) return [];
  
  return edges.map((edge, index) => ({
    id: edge.id || edge.reactFlowId || `edge-${templateId || 'template'}-${index}-${nanoid(6)}`,
    source: edge.source || (edge.data?.source as string) || '',
    target: edge.target || (edge.data?.target as string) || '',
    type: edge.type || 'custom',
    data: edge.data || {},
    label: edge.label || '',
  }));
} 