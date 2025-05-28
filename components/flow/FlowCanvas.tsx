"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  IsValidConnection,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowCanvasProps } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2Icon } from "lucide-react";

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
  currentScenarioName,
  isEditingTitle,
  editingScenarioName,
  onToggleEditTitle,
  onScenarioNameChange,
  onSaveScenarioName,
  onScenarioNameKeyDown,
  titleInputRef,
  isOver,
  setDroppableRef,
}: FlowCanvasProps & { 
  isOver?: boolean; 
  setDroppableRef?: (ref: HTMLDivElement | null) => void;
}) {
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
  const isValidConnection: IsValidConnection = useCallback((connection) => {
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
  }, [nodes, edges]);

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
  }, [onEdgesChange, isValidConnection]);

  return (
    <div
      ref={(node) => {
        setWrapperRef?.(node);
        setDroppableRef?.(node);
      }}
      className={`flex-grow relative ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      {/* Scenario Title Display/Edit */}
      {onToggleEditTitle && onScenarioNameChange && onSaveScenarioName && onScenarioNameKeyDown && titleInputRef && (
        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow flex items-center max-w-[calc(100%-40px)] min-w-[200px]"> 
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              type="text"
              value={editingScenarioName || ""}
              onChange={(e) => onScenarioNameChange(e.target.value)}
              onBlur={onSaveScenarioName} 
              onKeyDown={onScenarioNameKeyDown}
              className="text-lg font-semibold h-8 border-primary focus:ring-primary/50 flex-grow min-w-0"
              placeholder="Enter scenario name"
            />
          ) : (
            <h2 
              className="text-lg font-semibold truncate cursor-pointer hover:text-primary transition-colors duration-150 flex-grow min-w-0"
              onClick={() => onToggleEditTitle(true)}
              title={currentScenarioName || "Untitled Scenario"}
            >
              {currentScenarioName || "Untitled Scenario"}
            </h2>
          )}
          {!isEditingTitle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onToggleEditTitle(true)} 
              className="ml-2 h-7 w-7 flex-shrink-0"
              title="Edit scenario name"
            >
              <Edit2Icon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

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