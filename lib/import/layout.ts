import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { LayoutConfig } from './types';

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 40;
const DECISION_NODE_WIDTH = 100;
const DECISION_NODE_HEIGHT = 60;

/**
 * Automatically layouts nodes using dagre when positions are missing
 * @param nodes Array of nodes to layout
 * @param edges Array of edges connecting the nodes
 * @param config Layout configuration
 * @returns Nodes with updated positions
 */
export function autoLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = {
    direction: 'LR',
    nodeSpacing: 100,
    rankSpacing: 150,
    animate: false
  }
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set graph properties
  dagreGraph.setGraph({
    rankdir: config.direction,
    nodesep: config.nodeSpacing,
    ranksep: config.rankSpacing,
    marginx: 50,
    marginy: 50
  });
  
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    const width = node.type === 'decision' ? DECISION_NODE_WIDTH : DEFAULT_NODE_WIDTH;
    const height = node.type === 'decision' ? DECISION_NODE_HEIGHT : DEFAULT_NODE_HEIGHT;
    
    dagreGraph.setNode(node.id, { 
      width, 
      height,
      // Preserve existing position if available
      x: node.position?.x,
      y: node.position?.y
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Update node positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Only update position if it was calculated by dagre
    if (nodeWithPosition && (nodeWithPosition.x !== undefined && nodeWithPosition.y !== undefined)) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (nodeWithPosition.width / 2),
          y: nodeWithPosition.y - (nodeWithPosition.height / 2)
        }
      };
    }
    
    // Return original node if position wasn't calculated
    return node;
  });
}

/**
 * Creates a sequential layout for step-based workflows (like Zapier)
 * @param nodes Array of nodes to layout
 * @param direction Layout direction
 * @param spacing Spacing between nodes
 * @returns Nodes with updated positions
 */
export function sequentialLayout(
  nodes: Node[],
  direction: 'horizontal' | 'vertical' = 'horizontal',
  spacing: number = 150
): Node[] {
  let currentX = 0;
  let currentY = 0;
  
  return nodes.map((node) => {
    const position = {
      x: currentX,
      y: currentY
    };
    
    if (direction === 'horizontal') {
      currentX += spacing;
    } else {
      currentY += spacing;
    }
    
    return {
      ...node,
      position
    };
  });
}

/**
 * Groups nodes that are connected in a flow and applies layout to each group
 * Useful for workflows with multiple disconnected flows
 * @param nodes Array of all nodes
 * @param edges Array of all edges
 * @param config Layout configuration
 * @returns Nodes with updated positions
 */
export function layoutGroups(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = {
    direction: 'LR',
    nodeSpacing: 100,
    rankSpacing: 150,
    animate: false
  }
): Node[] {
  // Create adjacency map
  const adjacencyMap = new Map<string, Set<string>>();
  
  // Initialize all nodes in the map
  nodes.forEach(node => {
    adjacencyMap.set(node.id, new Set());
  });
  
  // Build adjacency relationships
  edges.forEach(edge => {
    adjacencyMap.get(edge.source)?.add(edge.target);
    adjacencyMap.get(edge.target)?.add(edge.source);
  });
  
  // Find connected components
  const visited = new Set<string>();
  const groups: Node[][] = [];
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const group: Node[] = [];
      const queue = [node.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        const currentNode = nodes.find(n => n.id === currentId);
        if (currentNode) group.push(currentNode);
        
        // Add connected nodes to queue
        adjacencyMap.get(currentId)?.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        });
      }
      
      if (group.length > 0) {
        groups.push(group);
      }
    }
  });
  
  // Layout each group separately
  let offsetX = 0;
  let offsetY = 0;
  const layoutMargin = 200;
  
  const allLayoutedNodes: Node[] = [];
  
  groups.forEach((group) => {
    // Get edges for this group
    const groupNodeIds = new Set(group.map(n => n.id));
    const groupEdges = edges.filter(edge => 
      groupNodeIds.has(edge.source) && groupNodeIds.has(edge.target)
    );
    
    // Layout the group
    const layoutedGroup = autoLayout(group, groupEdges, config);
    
    // Find bounds of the group
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    layoutedGroup.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + DEFAULT_NODE_WIDTH);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + DEFAULT_NODE_HEIGHT);
    });
    
    // Apply offset to avoid overlap
    const offsettedGroup = layoutedGroup.map(node => ({
      ...node,
      position: {
        x: node.position.x - minX + offsetX,
        y: node.position.y - minY + offsetY
      }
    }));
    
    allLayoutedNodes.push(...offsettedGroup);
    
    // Update offset for next group
    if (config.direction === 'LR' || config.direction === 'TB') {
      offsetY += (maxY - minY) + layoutMargin;
    } else {
      offsetX += (maxX - minX) + layoutMargin;
    }
  });
  
  return allLayoutedNodes;
} 