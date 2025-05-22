"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  useReactFlow,
  IsValidConnection,
  SelectionMode,
  useOnSelectionChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowCanvasProps } from "@/lib/types";

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onMoveEnd,
  onInit,
  nodeTypes,
  edgeTypes,
  defaultViewport,
  setWrapperRef,
}: FlowCanvasProps) {
  // Local state to track selection mode
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.Partial);
  
  // Listen for key presses to toggle selection mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle selection mode with Shift key
      if (event.key === 'Shift') {
        setSelectionMode(SelectionMode.Full);
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setSelectionMode(SelectionMode.Partial);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Function to validate connections
  const isValidConnection: IsValidConnection = (connection) => {
    // Don't allow connections to self
    if (connection.source === connection.target) {
      return false;
    }

    // Find source and target nodes
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    
    // Don't allow connection if nodes don't exist
    if (!sourceNode || !targetNode) {
      return false;
    }
    
    // Prevent connecting to trigger nodes (they can only be at the start)
    if (targetNode.type === 'trigger') {
      return false;
    }
    
    // Prevent connecting to or from group nodes
    if (sourceNode.type === 'group' || targetNode.type === 'group') {
      return false;
    }

    // Check for duplicate connections
    const isDuplicate = edges.some(
      edge => 
        edge.source === connection.source && 
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle
    );
    
    if (isDuplicate) {
      return false;
    }
    
    // Allow connection if validation passes
    return true;
  };

  // Add new edge on connect
  const handleConnect = useCallback((connection: Connection) => {
    // Validate connection
    if (!isValidConnection(connection)) {
      return;
    }
    
    // Add new edge through onEdgesChange
    onEdgesChange([
      {
        type: 'add',
        item: {
          ...connection,
          id: `e-${connection.source}-${connection.target}${connection.sourceHandle ? `-${connection.sourceHandle}` : ''}`,
          // Add additional data for rendering decision edges differently if needed
          data: {
            ...(connection.sourceHandle === 'true' ? { isTrue: true } : {}),
            ...(connection.sourceHandle === 'false' ? { isFalse: true } : {}),
          }
        },
      },
    ]);
  }, [onEdgesChange, edges, nodes]);

  return (
    <div
      ref={setWrapperRef}
      className="flex-grow"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultViewport={defaultViewport}
        onMoveEnd={onMoveEnd}
        snapToGrid
        snapGrid={[8, 8]}
        onInit={onInit}
        isValidConnection={isValidConnection}
        selectionMode={selectionMode}
        multiSelectionKeyCode="Shift"
        className="bg-[linear-gradient(to_right,transparent_49%,theme(colors.border)_50%),linear-gradient(to_bottom,transparent_49%,theme(colors.border)_50%)] bg-[size:1rem_1rem]"
      >
        <Background gap={16} color="var(--border)" />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
} 