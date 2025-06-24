import { Node, Edge } from '@xyflow/react';
import { NodeType, NodeData, GroupData, EmailPreviewNodeData } from '@/lib/types';
import { NODE_DEFAULTS } from '@/lib/utils/constants';

/**
 * Create a new node with the specified type and position
 */
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  nodeCount: number,
  initialData?: Partial<NodeData>
): Node {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const baseNode: Node = {
    id,
    type,
    position,
    data: {
      label: getDefaultLabel(type),
      ...initialData,
    },
  };

  // Set specific dimensions based on node type
  if (type === 'emailPreview') {
    baseNode.style = {
      width: NODE_DEFAULTS.emailNodeWidth,
      height: NODE_DEFAULTS.emailNodeHeight,
    };
  } else if (type === 'group') {
    baseNode.style = {
      width: NODE_DEFAULTS.groupMinWidth,
      height: NODE_DEFAULTS.groupMinHeight,
    };
  } else {
    baseNode.style = {
      width: NODE_DEFAULTS.width,
      height: NODE_DEFAULTS.height,
    };
  }

  return baseNode;
}

/**
 * Create a new edge between two nodes
 */
export function createEdge(sourceId: string, targetId: string): Edge {
  const id = `edge_${sourceId}_${targetId}`;
  
  return {
    id,
    source: sourceId,
    target: targetId,
    type: 'default',
    animated: false,
  };
}

/**
 * Get default label for a node type
 */
function getDefaultLabel(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    trigger: 'New Trigger',
    action: 'New Action',
    decision: 'New Decision',
    group: 'New Group',
    emailPreview: 'Email Preview',
    persona: 'Target Persona',
    industry: 'Industry Context',
    painpoint: 'Pain Point',
    metric: 'Key Metric',
    urgency: 'Urgency Factor',
    socialproof: 'Social Proof',
    objection: 'Common Objection',
    value: 'Value Proposition',
  };

  return labels[type] || 'New Node';
}

/**
 * Create a group node with child nodes
 */
export function createGroupNode(
  position: { x: number; y: number },
  childNodeIds: string[],
  groupName: string = 'New Group'
): Node<GroupData> {
  const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type: 'group',
    position,
    style: {
      width: NODE_DEFAULTS.groupMinWidth,
      height: NODE_DEFAULTS.groupMinHeight,
    },
    data: {
      label: groupName,
      nodes: childNodeIds,
      nodeMap: {},
    },
  };
}

/**
 * Create an email preview node with default email template data
 */
export function createEmailPreviewNode(
  position: { x: number; y: number },
  initialEmailData?: Partial<EmailPreviewNodeData>
): Node<EmailPreviewNodeData> {
  const id = `emailPreview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type: 'emailPreview',
    position,
    style: {
      width: NODE_DEFAULTS.emailNodeWidth,
      height: NODE_DEFAULTS.emailNodeHeight,
    },
    data: {
      nodeTitle: 'Email Preview',
      firstName: '',
      yourName: '',
      yourCompany: '',
      yourEmail: '',
      calendlyLink: '',
      pdfLink: '',
      subjectLine: 'Subject Line Here',
      hookText: 'Hook text goes here...',
      ctaText: 'Call to action...',
      offerText: 'Offer details...',
      psText: 'PS: Additional information...',
      testimonialText: '',
      urgencyText: '',
      showSubject: true,
      showHook: true,
      showCTA: true,
      showOffer: true,
      showPS: true,
      showTestimonial: false,
      showUrgency: false,
      isLoading: false,
      lengthOption: 'standard',
      toneOption: 'professional_warm',
      sectionConnections: {},
      ...initialEmailData,
    },
  };
}

/**
 * Create an email context node (persona, industry, etc.)
 */
export function createEmailContextNode(
  type: 'persona' | 'industry' | 'painpoint' | 'metric' | 'urgency' | 'socialproof' | 'objection' | 'value',
  position: { x: number; y: number },
  contextValue: string = ''
): Node {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type,
    position,
    style: {
      width: NODE_DEFAULTS.width,
      height: NODE_DEFAULTS.height,
    },
    data: {
      label: getDefaultLabel(type),
      contextType: type,
      contextValue,
      isEmailContext: true,
      isConnectedToEmail: false,
    },
  };
}

/**
 * Clone an existing node at a new position
 */
export function cloneNode(originalNode: Node, newPosition: { x: number; y: number }): Node {
  const newId = `${originalNode.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    ...originalNode,
    id: newId,
    position: newPosition,
    selected: false,
    data: {
      ...originalNode.data,
      // Clear any unique identifiers or connections
      isConnectedToEmail: false,
    },
  };
}

/**
 * Get the optimal position for a new node (avoiding overlaps)
 */
export function getOptimalNodePosition(
  existingNodes: Node[],
  preferredPosition?: { x: number; y: number }
): { x: number; y: number } {
  const basePosition = preferredPosition || { x: 100, y: 100 };
  
  // Check if the position is already occupied
  const isPositionOccupied = (pos: { x: number; y: number }) => {
    return existingNodes.some(node => 
      Math.abs(node.position.x - pos.x) < 50 && 
      Math.abs(node.position.y - pos.y) < 50
    );
  };

  let position = { ...basePosition };
  let attempts = 0;
  const maxAttempts = 100;

  // Find an unoccupied position
  while (isPositionOccupied(position) && attempts < maxAttempts) {
    position = {
      x: basePosition.x + (attempts % 10) * 60,
      y: basePosition.y + Math.floor(attempts / 10) * 80,
    };
    attempts++;
  }

  return position;
} 