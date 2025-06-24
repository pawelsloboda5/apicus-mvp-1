"use client";

import { useCallback, useRef, useState } from 'react';
import { Node, Edge, Connection, addEdge, NodeChange, EdgeChange } from '@xyflow/react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { toast } from 'sonner';
import { NodeType, EmailContextNodeType } from '@/lib/types';
import { 
  DND_CONFIG, 
  CANVAS_CONFIG, 
  NODE_DEFAULTS,
  ERROR_MESSAGES 
} from '@/lib/utils/constants';
import { createNode, createEdge } from '@/lib/flow/node-factory';

export interface UseDragAndDropOptions {
  /** Current nodes array */
  nodes: Node[];
  /** Current edges array */
  edges: Edge[];
  /** Callback fired when nodes change */
  onNodesChange: (changes: NodeChange[]) => void;
  /** Callback fired when edges change */
  onEdgesChange: (changes: EdgeChange[]) => void;
  /** Callback fired when new connection is made */
  onConnect: (connection: Connection) => void;
  /** Canvas viewport for position calculations */
  viewport?: { x: number; y: number; zoom: number };
  /** Enable snap to grid */
  snapToGrid?: boolean;
}

export interface DragState {
  isDragging: boolean;
  draggedNodeType: NodeType | EmailContextNodeType | null;
  draggedItemId: string | null;
  dropPosition: { x: number; y: number } | null;
}

export function useDragAndDrop({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  viewport = CANVAS_CONFIG.defaultViewport,
  snapToGrid = true,
}: UseDragAndDropOptions) {
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNodeType: null,
    draggedItemId: null,
    dropPosition: null,
  });

  const dragOverlayRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvasPosition = useCallback((x: number, y: number) => {
    const canvasX = (x - viewport.x) / viewport.zoom;
    const canvasY = (y - viewport.y) / viewport.zoom;
    
    if (snapToGrid) {
      return {
        x: Math.round(canvasX / CANVAS_CONFIG.gridSize) * CANVAS_CONFIG.gridSize,
        y: Math.round(canvasY / CANVAS_CONFIG.gridSize) * CANVAS_CONFIG.gridSize,
      };
    }
    
    return { x: canvasX, y: canvasY };
  }, [viewport, snapToGrid]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const nodeType = active.data.current?.nodeType as NodeType | EmailContextNodeType;
    
    if (!nodeType) return;

    setDragState({
      isDragging: true,
      draggedNodeType: nodeType,
      draggedItemId: active.id as string,
      dropPosition: null,
    });
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { delta } = event;
    
    if (dragState.isDragging && delta) {
      setDragState(prev => ({
        ...prev,
        dropPosition: {
          x: delta.x,
          y: delta.y,
        },
      }));
    }
  }, [dragState.isDragging]);

  // Handle drag end - create new node
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over, delta } = event;
    
    if (!dragState.draggedNodeType || !delta) {
      setDragState({
        isDragging: false,
        draggedNodeType: null,
        draggedItemId: null,
        dropPosition: null,
      });
      return;
    }

    try {
      // Check if dropping over canvas or another droppable area
      const canDropOnCanvas = over?.id === 'canvas' || !over;
      
      if (canDropOnCanvas) {
        // Calculate drop position
        const dropPosition = screenToCanvasPosition(delta.x, delta.y);
        
        // Create new node
        const newNode = createNode(
          dragState.draggedNodeType,
          dropPosition,
          nodes.length
        );

        // Add node to canvas
        onNodesChange([
          {
            type: 'add',
            item: newNode,
          }
        ]);

        toast.success('Node added to canvas');
      }
    } catch (error) {
      console.error('Failed to create node:', error);
      toast.error(ERROR_MESSAGES.scenario.saveFailed);
    } finally {
      setDragState({
        isDragging: false,
        draggedNodeType: null,
        draggedItemId: null,
        dropPosition: null,
      });
    }
  }, [
    dragState.draggedNodeType,
    screenToCanvasPosition,
    nodes.length,
    onNodesChange,
  ]);

  // Handle node connections
  const handleConnect = useCallback((params: Connection) => {
    try {
      const newEdge = createEdge(params.source!, params.target!);
      onConnect(params);
      toast.success('Nodes connected');
    } catch (error) {
      console.error('Failed to connect nodes:', error);
      toast.error('Failed to connect nodes');
    }
  }, [onConnect]);

  // Handle node deletion
  const deleteNode = useCallback((nodeId: string) => {
    try {
      onNodesChange([
        {
          type: 'remove',
          id: nodeId,
        }
      ]);

      // Also remove connected edges
      const connectedEdges = edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      
      if (connectedEdges.length > 0) {
        onEdgesChange(
          connectedEdges.map(edge => ({
            type: 'remove',
            id: edge.id,
          }))
        );
      }

      toast.success('Node deleted');
    } catch (error) {
      console.error('Failed to delete node:', error);
      toast.error('Failed to delete node');
    }
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  // Handle edge deletion
  const deleteEdge = useCallback((edgeId: string) => {
    try {
      onEdgesChange([
        {
          type: 'remove',
          id: edgeId,
        }
      ]);
      toast.success('Connection removed');
    } catch (error) {
      console.error('Failed to delete edge:', error);
      toast.error('Failed to remove connection');
    }
  }, [onEdgesChange]);

  // Duplicate node
  const duplicateNode = useCallback((nodeId: string) => {
    try {
      const nodeToDuplicate = nodes.find(n => n.id === nodeId);
      if (!nodeToDuplicate) return;

      const newNode = createNode(
        nodeToDuplicate.type as NodeType,
        {
          x: nodeToDuplicate.position.x + CANVAS_CONFIG.nodeSpacing,
          y: nodeToDuplicate.position.y + CANVAS_CONFIG.nodeSpacing,
        },
        nodes.length,
        { ...nodeToDuplicate.data }
      );

      onNodesChange([
        {
          type: 'add',
          item: newNode,
        }
      ]);

      toast.success('Node duplicated');
    } catch (error) {
      console.error('Failed to duplicate node:', error);
      toast.error('Failed to duplicate node');
    }
  }, [nodes, onNodesChange]);

  // Move nodes by delta
  const moveNodes = useCallback((nodeIds: string[], delta: { x: number; y: number }) => {
    try {
      const changes: NodeChange[] = nodeIds.map(id => ({
        type: 'position',
        id,
        position: {
          x: (nodes.find(n => n.id === id)?.position.x || 0) + delta.x,
          y: (nodes.find(n => n.id === id)?.position.y || 0) + delta.y,
        },
      }));

      onNodesChange(changes);
    } catch (error) {
      console.error('Failed to move nodes:', error);
      toast.error('Failed to move nodes');
    }
  }, [nodes, onNodesChange]);

  // Select multiple nodes
  const selectNodes = useCallback((nodeIds: string[]) => {
    const changes: NodeChange[] = nodes.map(node => ({
      type: 'select',
      id: node.id,
      selected: nodeIds.includes(node.id),
    }));

    onNodesChange(changes);
  }, [nodes, onNodesChange]);

  // Get selected nodes
  const getSelectedNodes = useCallback(() => {
    return nodes.filter(node => node.selected);
  }, [nodes]);

  // Align nodes
  const alignNodes = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 2) return;

    try {
      let changes: NodeChange[] = [];

      switch (alignment) {
        case 'left':
          const leftX = Math.min(...selectedNodes.map(n => n.position.x));
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, x: leftX },
          }));
          break;

        case 'center':
          const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, x: avgX },
          }));
          break;

        case 'right':
          const rightX = Math.max(...selectedNodes.map(n => n.position.x));
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, x: rightX },
          }));
          break;

        case 'top':
          const topY = Math.min(...selectedNodes.map(n => n.position.y));
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, y: topY },
          }));
          break;

        case 'middle':
          const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, y: avgY },
          }));
          break;

        case 'bottom':
          const bottomY = Math.max(...selectedNodes.map(n => n.position.y));
          changes = selectedNodes.map(n => ({
            type: 'position' as const,
            id: n.id,
            position: { ...n.position, y: bottomY },
          }));
          break;
      }

      onNodesChange(changes);
      toast.success(`Nodes aligned ${alignment}`);
    } catch (error) {
      console.error('Failed to align nodes:', error);
      toast.error('Failed to align nodes');
    }
  }, [getSelectedNodes, onNodesChange]);

  // Distribute nodes
  const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 3) return;

    try {
      const sortedNodes = [...selectedNodes].sort((a, b) => 
        direction === 'horizontal' 
          ? a.position.x - b.position.x 
          : a.position.y - b.position.y
      );

      const first = sortedNodes[0];
      const last = sortedNodes[sortedNodes.length - 1];
      const totalDistance = direction === 'horizontal' 
        ? last.position.x - first.position.x
        : last.position.y - first.position.y;
      
      const step = totalDistance / (sortedNodes.length - 1);

      const changes: NodeChange[] = sortedNodes.map((node, index) => ({
        type: 'position',
        id: node.id,
        position: direction === 'horizontal'
          ? { ...node.position, x: first.position.x + (step * index) }
          : { ...node.position, y: first.position.y + (step * index) },
      }));

      onNodesChange(changes);
      toast.success(`Nodes distributed ${direction}ly`);
    } catch (error) {
      console.error('Failed to distribute nodes:', error);
      toast.error('Failed to distribute nodes');
    }
  }, [getSelectedNodes, onNodesChange]);

  return {
    // State
    dragState,
    
    // Event handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleConnect,
    
    // Node operations
    deleteNode,
    deleteEdge,
    duplicateNode,
    moveNodes,
    selectNodes,
    alignNodes,
    distributeNodes,
    
    // Utilities
    screenToCanvasPosition,
    getSelectedNodes,
    
    // Refs
    dragOverlayRef,
  };
} 