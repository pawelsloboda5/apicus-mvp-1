import { Node } from "@xyflow/react";
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
 * @param nodeHeight Height of the node
 * @param gridSize Grid size for snapping
 * @returns Non-overlapping position snapped to grid
 */
export function getNonOverlappingPosition(
  nodes: Node[],
  nodeWidth: number = 150,
  nodeHeight: number = 40,
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