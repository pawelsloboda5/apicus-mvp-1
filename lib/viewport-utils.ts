import { Node, Viewport } from '@xyflow/react';

/**
 * Configuration for viewport initialization
 */
export interface ViewportConfig {
  /** Minimum allowed zoom level (maximum zoom out) */
  minZoom: number;
  /** Maximum allowed zoom level (maximum zoom in) */
  maxZoom: number;
  /** Padding around nodes in pixels */
  padding: number;
  /** Canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Bounding box containing all nodes
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Default node dimensions (for bounding box calculation)
 */
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 80;

/**
 * Calculate bounding box that encompasses all nodes
 */
export function calculateBoundingBox(nodes: Node[]): BoundingBox | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const nodeWidth = (node.width as number) || DEFAULT_NODE_WIDTH;
    const nodeHeight = (node.height as number) || DEFAULT_NODE_HEIGHT;

    const x1 = node.position.x;
    const y1 = node.position.y;
    const x2 = x1 + nodeWidth;
    const y2 = y1 + nodeHeight;

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

/**
 * Calculate zoom level to fit bounding box within canvas
 */
export function calculateZoomToFit(
  boundingBox: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50
): number {
  // Add padding to bounding box dimensions
  const requiredWidth = boundingBox.width + padding * 2;
  const requiredHeight = boundingBox.height + padding * 2;

  // Calculate zoom that fits both width and height
  const zoomX = canvasWidth / requiredWidth;
  const zoomY = canvasHeight / requiredHeight;

  // Use the smaller zoom to ensure both dimensions fit
  return Math.min(zoomX, zoomY);
}

/**
 * Calculate pan offset to center bounding box in canvas
 */
export function calculatePanToCenter(
  boundingBox: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number
): { x: number; y: number } {
  // Calculate the center of the canvas
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // Calculate pan offset to center the bounding box
  const x = canvasCenterX - boundingBox.centerX * zoom;
  const y = canvasCenterY - boundingBox.centerY * zoom;

  return { x, y };
}

/**
 * Check if a node is visible within the current viewport
 */
export function isNodeVisible(
  node: Node,
  pan: { x: number; y: number },
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const nodeWidth = (node.width as number) || DEFAULT_NODE_WIDTH;
  const nodeHeight = (node.height as number) || DEFAULT_NODE_HEIGHT;

  // Calculate node position in viewport coordinates
  const nodeViewportX = node.position.x * zoom + pan.x;
  const nodeViewportY = node.position.y * zoom + pan.y;
  const nodeViewportWidth = nodeWidth * zoom;
  const nodeViewportHeight = nodeHeight * zoom;

  // Check if node is within canvas bounds
  const isXVisible = 
    nodeViewportX + nodeViewportWidth > 0 && 
    nodeViewportX < canvasWidth;
  
  const isYVisible = 
    nodeViewportY + nodeViewportHeight > 0 && 
    nodeViewportY < canvasHeight;

  return isXVisible && isYVisible;
}

/**
 * Adjust pan to ensure a specific node is visible
 */
export function adjustPanToIncludeNode(
  node: Node,
  currentPan: { x: number; y: number },
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 50
): { x: number; y: number } {
  const nodeWidth = (node.width as number) || DEFAULT_NODE_WIDTH;
  const nodeHeight = (node.height as number) || DEFAULT_NODE_HEIGHT;

  let { x: panX, y: panY } = currentPan;

  // Calculate node position in viewport coordinates
  const nodeViewportX = node.position.x * zoom + panX;
  const nodeViewportY = node.position.y * zoom + panY;
  const nodeViewportWidth = nodeWidth * zoom;
  const nodeViewportHeight = nodeHeight * zoom;

  // Adjust pan X if node is outside horizontal bounds
  if (nodeViewportX < margin) {
    // Node is too far left, shift pan right
    panX = margin - node.position.x * zoom;
  } else if (nodeViewportX + nodeViewportWidth > canvasWidth - margin) {
    // Node is too far right, shift pan left
    panX = canvasWidth - margin - nodeViewportWidth - node.position.x * zoom;
  }

  // Adjust pan Y if node is outside vertical bounds
  if (nodeViewportY < margin) {
    // Node is too far up, shift pan down
    panY = margin - node.position.y * zoom;
  } else if (nodeViewportY + nodeViewportHeight > canvasHeight - margin) {
    // Node is too far down, shift pan up
    panY = canvasHeight - margin - nodeViewportHeight - node.position.y * zoom;
  }

  return { x: panX, y: panY };
}

/**
 * Calculate optimal viewport to show all nodes with first node always visible
 * 
 * @param nodes - Array of nodes to display
 * @param config - Viewport configuration
 * @returns Optimal viewport settings (zoom, x, y)
 */
export function calculateOptimalViewport(
  nodes: Node[],
  config: ViewportConfig
): Viewport {
  const { minZoom, maxZoom, padding, canvasWidth, canvasHeight } = config;

  // Default viewport (centered, default zoom)
  const defaultViewport: Viewport = {
    x: 0,
    y: 0,
    zoom: 1,
  };

  // Handle empty nodes
  if (nodes.length === 0) {
    return defaultViewport;
  }

  // Handle single node - center it
  if (nodes.length === 1) {
    const node = nodes[0];
    const nodeWidth = (node.width as number) || DEFAULT_NODE_WIDTH;
    const nodeHeight = (node.height as number) || DEFAULT_NODE_HEIGHT;

    return {
      x: canvasWidth / 2 - node.position.x - nodeWidth / 2,
      y: canvasHeight / 2 - node.position.y - nodeHeight / 2,
      zoom: 1,
    };
  }

  // Calculate bounding box for all nodes
  const boundingBox = calculateBoundingBox(nodes);
  if (!boundingBox) {
    return defaultViewport;
  }

  // Calculate zoom to fit all nodes
  let zoom = calculateZoomToFit(boundingBox, canvasWidth, canvasHeight, padding);

  // Apply universal 25% additional zoom out to ensure all nodes are comfortably visible
  zoom = zoom * 0.75;

  // Clamp zoom to allowed range
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

  // Calculate pan to center bounding box
  let pan = calculatePanToCenter(boundingBox, canvasWidth, canvasHeight, zoom);

  // Ensure first node is visible
  const firstNode = nodes[0];
  if (!isNodeVisible(firstNode, pan, zoom, canvasWidth, canvasHeight)) {
    console.log('⚠️ First node not visible, adjusting pan...');
    pan = adjustPanToIncludeNode(firstNode, pan, zoom, canvasWidth, canvasHeight, padding);
  }

  console.log('📐 Calculated viewport:', {
    zoom: zoom.toFixed(2),
    pan: { x: Math.round(pan.x), y: Math.round(pan.y) },
    nodes: nodes.length,
    boundingBox: {
      width: Math.round(boundingBox.width),
      height: Math.round(boundingBox.height),
    },
  });

  return {
    x: pan.x,
    y: pan.y,
    zoom,
  };
}

/**
 * Calculate adaptive zoom based on number of nodes
 * More nodes = zoom out more, but respect min/max limits
 */
export function calculateAdaptiveZoom(
  nodeCount: number,
  baseZoom: number,
  minZoom: number,
  maxZoom: number
): number {
  // Scale factor based on node count
  // 1-10 nodes: minimal zoom out
  // 10-50 nodes: moderate zoom out
  // 50+ nodes: maximum zoom out
  
  let zoomMultiplier = 1;
  
  if (nodeCount <= 10) {
    zoomMultiplier = 1;
  } else if (nodeCount <= 30) {
    // Linear interpolation between 1 and 0.7
    zoomMultiplier = 1 - ((nodeCount - 10) / 20) * 0.3;
  } else if (nodeCount <= 50) {
    // Linear interpolation between 0.7 and 0.5
    zoomMultiplier = 0.7 - ((nodeCount - 30) / 20) * 0.2;
  } else {
    zoomMultiplier = 0.5;
  }

  const adaptiveZoom = baseZoom * zoomMultiplier;
  return Math.max(minZoom, Math.min(maxZoom, adaptiveZoom));
}
