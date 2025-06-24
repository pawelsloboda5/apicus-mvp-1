import { Node, Edge } from '@xyflow/react';
import { SankeyData, SankeyNode, SankeyLink } from '@/app/chart-kit/SankeyChart';
import { NodeData, NodeType } from '@/lib/types';
import { calculateNodeTimeSavings } from '@/lib/roi-utils';
import { FlowTimeData, FlowNode } from '@/app/chart-kit/FlowTimeChart';
import { NODE_TIME_FACTORS } from '@/lib/utils/constants';

/**
 * Transform React Flow nodes to FlowTimeChart format
 * This creates a simple bar chart visualization of time savings per node
 */
export function transformToFlowTimeData(
  nodes: Node[],
  totalMinutesPerRun: number
): FlowTimeData {
  // Filter out email context nodes and groups
  const flowNodes = nodes.filter(node => {
    const nodeType = node.type as NodeType;
    return ['trigger', 'action', 'decision'].includes(nodeType);
  });

  // Calculate time contributions for each node
  const flowTimeNodes: FlowNode[] = [];
  let totalTime = 0;

  flowNodes.forEach((node, index) => {
    const nodeType = node.type as NodeType;
    const nodeData = node.data as unknown as NodeData;
    const operationType = nodeData?.typeOf;
    
    const timeContribution = calculateNodeTimeSavings(
      nodeType,
      totalMinutesPerRun,
      flowNodes,
      NODE_TIME_FACTORS,
      operationType
    );
    
    totalTime += timeContribution;
    
    flowTimeNodes.push({
      id: node.id,
      name: nodeData?.label || node.id,
      nodeType: node.type as NodeType,
      value: timeContribution,
      position: index,
    });
  });

  // Sort by time contribution (highest first)
  flowTimeNodes.sort((a, b) => b.value - a.value);

  return {
    nodes: flowTimeNodes,
    totalTime,
  };
}

/**
 * Transform React Flow nodes and edges into Sankey chart data format
 * This creates a visualization of time flow through the automation workflow
 */
export function transformToSankeyData(
  nodes: Node[],
  edges: Edge[],
  totalMinutesPerRun: number
): SankeyData {
  // Filter out email context nodes and groups
  const flowNodes = nodes.filter(node => {
    const nodeType = node.type as NodeType;
    return ['trigger', 'action', 'decision'].includes(nodeType);
  });

  // Create a map of node connections
  const nodeConnections = new Map<string, { sources: string[]; targets: string[] }>();
  
  flowNodes.forEach(node => {
    nodeConnections.set(node.id, { sources: [], targets: [] });
  });

  // Build connection relationships
  edges.forEach(edge => {
    const sourceConnection = nodeConnections.get(edge.source);
    const targetConnection = nodeConnections.get(edge.target);
    
    if (sourceConnection && targetConnection) {
      sourceConnection.targets.push(edge.target);
      targetConnection.sources.push(edge.source);
    }
  });

  // Calculate time contributions for each node
  const nodeTimeMap = new Map<string, number>();
  
  flowNodes.forEach(node => {
    const nodeType = node.type as NodeType;
    const nodeData = node.data as unknown as NodeData;
    const operationType = nodeData?.typeOf;
    
    const timeContribution = calculateNodeTimeSavings(
      nodeType,
      totalMinutesPerRun,
      flowNodes,
      NODE_TIME_FACTORS,
      operationType
    );
    
    nodeTimeMap.set(node.id, timeContribution);
  });

  // Create Sankey nodes
  const sankeyNodes: SankeyNode[] = flowNodes.map(node => {
    const nodeData = node.data as unknown as NodeData;
    return {
      id: node.id,
      name: nodeData?.label || node.id,
      nodeType: node.type as NodeType,
      value: nodeTimeMap.get(node.id) || 0,
    };
  });

  // Create Sankey links
  const sankeyLinks: SankeyLink[] = [];
  
  edges.forEach(edge => {
    const sourceTime = nodeTimeMap.get(edge.source);
    const targetTime = nodeTimeMap.get(edge.target);
    
    if (sourceTime !== undefined && targetTime !== undefined) {
      // Use the minimum of source and target time as the flow value
      const flowValue = Math.min(sourceTime, targetTime);
      
      sankeyLinks.push({
        source: edge.source,
        target: edge.target,
        value: flowValue,
      });
    }
  });

  // Sort nodes by their position in the flow (triggers first, then by x position)
  sankeyNodes.sort((a, b) => {
    const nodeA = flowNodes.find(n => n.id === a.id);
    const nodeB = flowNodes.find(n => n.id === b.id);
    
    if (!nodeA || !nodeB) return 0;
    
    // Triggers come first
    if (a.nodeType === 'trigger' && b.nodeType !== 'trigger') return -1;
    if (a.nodeType !== 'trigger' && b.nodeType === 'trigger') return 1;
    
    // Then sort by x position
    return nodeA.position.x - nodeB.position.x;
  });

  return {
    nodes: sankeyNodes,
    links: sankeyLinks,
  };
}

/**
 * Get a color for a node based on its contribution to total time savings
 */
export function getNodeContributionColor(
  nodeTime: number,
  totalTime: number
): string {
  const contribution = nodeTime / totalTime;
  
  if (contribution >= 0.3) return '#22c55e'; // High contribution - green
  if (contribution >= 0.15) return '#3b82f6'; // Medium contribution - blue
  if (contribution >= 0.05) return '#f59e0b'; // Low contribution - amber
  return '#94a3b8'; // Minimal contribution - neutral
} 