"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Node, ReactFlowInstance } from '@xyflow/react';
import { calculateOptimalViewport, ViewportConfig } from '@/lib/viewport-utils';

export interface UseInitialViewportOptions {
  /** React Flow instance */
  rfInstance: ReactFlowInstance | null;
  /** Nodes to fit in viewport */
  nodes: Node[];
  /** Whether to trigger viewport calculation */
  enabled?: boolean;
  /** Minimum zoom level (default: 0.1) */
  minZoom?: number;
  /** Maximum zoom level (default: 2) */
  maxZoom?: number;
  /** Padding around nodes in pixels (default: 100) */
  padding?: number;
  /** Animation duration in ms (default: 800) */
  duration?: number;
  /** Callback after viewport is set */
  onViewportSet?: () => void;
}

/**
 * Custom hook to initialize and manage optimal viewport for React Flow canvas
 * 
 * Features:
 * - Calculates optimal zoom to fit all nodes
 * - Ensures first node is always visible
 * - Adapts to node count and distribution
 * - Respects zoom limits
 * - Animates viewport transitions
 * 
 * @example
 * ```tsx
 * const { initializeViewport, resetViewport } = useInitialViewport({
 *   rfInstance,
 *   nodes,
 *   enabled: true,
 * });
 * ```
 */
export function useInitialViewport({
  rfInstance,
  nodes,
  enabled = true,
  minZoom = 0.1,
  maxZoom = 2,
  padding = 100,
  duration = 800,
  onViewportSet,
}: UseInitialViewportOptions) {
  
  // Track if viewport has been initialized
  const hasInitializedRef = useRef(false);
  const lastNodeCountRef = useRef(0);

  /**
   * Calculate and apply optimal viewport
   */
  const initializeViewport = useCallback(() => {
    if (!rfInstance || !enabled || nodes.length === 0) {
      return;
    }

    // Get canvas dimensions from the viewport
    const viewport = rfInstance.getViewport();
    const canvasElement = rfInstance.getNodes()[0]?.parentElement?.parentElement;
    
    const canvasWidth = canvasElement?.clientWidth || window.innerWidth;
    const canvasHeight = canvasElement?.clientHeight || window.innerHeight;

    console.log('🎯 Initializing viewport for', nodes.length, 'nodes');

    // Calculate optimal viewport
    const config: ViewportConfig = {
      minZoom,
      maxZoom,
      padding,
      canvasWidth,
      canvasHeight,
    };

    const optimalViewport = calculateOptimalViewport(nodes, config);

    // Apply viewport with animation
    rfInstance.setViewport(optimalViewport, { duration });

    // Mark as initialized
    hasInitializedRef.current = true;
    lastNodeCountRef.current = nodes.length;

    // Trigger callback
    if (onViewportSet) {
      setTimeout(onViewportSet, duration);
    }

    console.log('✅ Viewport initialized:', optimalViewport);
  }, [rfInstance, nodes, enabled, minZoom, maxZoom, padding, duration, onViewportSet]);

  /**
   * Reset viewport to fit all nodes
   * Useful for manual re-centering or after major node changes
   */
  const resetViewport = useCallback(() => {
    hasInitializedRef.current = false;
    initializeViewport();
  }, [initializeViewport]);

  /**
   * Fit viewport to specific nodes
   */
  const fitToNodes = useCallback((nodeIds: string[]) => {
    if (!rfInstance || nodeIds.length === 0) return;

    const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;

    const canvasElement = rfInstance.getNodes()[0]?.parentElement?.parentElement;
    const canvasWidth = canvasElement?.clientWidth || window.innerWidth;
    const canvasHeight = canvasElement?.clientHeight || window.innerHeight;

    const config: ViewportConfig = {
      minZoom,
      maxZoom,
      padding,
      canvasWidth,
      canvasHeight,
    };

    const viewport = calculateOptimalViewport(selectedNodes, config);
    rfInstance.setViewport(viewport, { duration });
  }, [rfInstance, nodes, minZoom, maxZoom, padding, duration]);

  /**
   * Auto-initialize viewport when nodes are first loaded or significantly changed
   */
  useEffect(() => {
    if (!enabled || !rfInstance || nodes.length === 0) {
      return;
    }

    // Initialize on first load
    if (!hasInitializedRef.current) {
      // Small delay to ensure nodes are rendered with dimensions
      const timer = setTimeout(() => {
        initializeViewport();
      }, 100);

      return () => clearTimeout(timer);
    }

    // Re-initialize if node count changed significantly (e.g., template loaded)
    const nodeCountChanged = Math.abs(nodes.length - lastNodeCountRef.current) > 5;
    if (nodeCountChanged) {
      console.log('🔄 Node count changed significantly, re-initializing viewport');
      hasInitializedRef.current = false;
      
      const timer = setTimeout(() => {
        initializeViewport();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [rfInstance, nodes.length, enabled, initializeViewport]);

  /**
   * Reset initialization flag when rfInstance changes
   */
  useEffect(() => {
    if (rfInstance) {
      hasInitializedRef.current = false;
    }
  }, [rfInstance]);

  return {
    /** Manually trigger viewport initialization */
    initializeViewport,
    /** Reset viewport to fit all nodes */
    resetViewport,
    /** Fit viewport to specific nodes */
    fitToNodes,
    /** Whether viewport has been initialized */
    isInitialized: hasInitializedRef.current,
  };
}
