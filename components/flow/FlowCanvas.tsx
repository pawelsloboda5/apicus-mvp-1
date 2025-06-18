"use client";

import React, { useState, useEffect, useOptimistic, startTransition, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Connection,
  IsValidConnection,
  SelectionMode,
  Node,
  Edge,
  useReactFlow,
  EdgeChange,
  ReactFlowProvider,
  Viewport,
  NodeTypes,
  EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowCanvasProps, NodeType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2Icon, RefreshCcw } from "lucide-react";
import { nanoid } from "nanoid";
import { FloatingNodeSelector } from "./FloatingNodeSelector";
import { addSectionConnection, removeSectionConnection, EmailSectionConnections } from "@/lib/flow-utils";

// Floating regenerate buttons component removed - regenerate functionality is now inline within EmailPreviewNode sections

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
  selectedNodeType = 'action',
  onNodeTypeChange,
  handleRegenerateSection,
}: FlowCanvasProps & { 
  isOver?: boolean; 
  setDroppableRef?: (ref: HTMLDivElement | null) => void;
  selectedNodeType?: NodeType;
  onNodeTypeChange?: (type: NodeType) => void;
  handleRegenerateSection?: (
    nodeId: string, 
    section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
    promptType: string,
    currentText: string,
    selectedContextNodes?: string[]
  ) => Promise<void>;
}) {
  // Local state to track selection mode
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.Partial);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get React Flow instance for coordinate conversion
  const { screenToFlowPosition } = useReactFlow();
  
  // State for floating node selector
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  
  // Optimistic state for instant UI feedback
  const [optimisticNodes, addOptimisticNode] = useOptimistic(
    nodes,
    (state, newNode: Node) => [...state, newNode]
  );
  
  const [optimisticEdges, addOptimisticEdge] = useOptimistic(
    edges,
    (state, newEdge: Edge) => [...state, newEdge]
  );
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Track cursor position globally when canvas is active
  useEffect(() => {
    if (isMobile || !isOverCanvas) return;
    
    const handleGlobalPointerMove = (event: PointerEvent) => {
      // Update cursor position even during pan operations
      setCursorPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };
    
    // Use pointer events for better compatibility
    window.addEventListener('pointermove', handleGlobalPointerMove);
    
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
    };
  }, [isMobile, isOverCanvas]);
  
  // Listen for key presses to toggle selection mode (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip keyboard listeners on mobile
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle selection mode with Shift key
      if (event.key === 'Shift') {
        setSelectionMode(SelectionMode.Full);
      }
      
      // Quick create email node with 'E' key
      if (event.key === 'e' || event.key === 'E') {
        // Prevent if user is typing in an input
        if (event.target instanceof HTMLInputElement || 
            event.target instanceof HTMLTextAreaElement) {
          return;
        }
        
        event.preventDefault();
        
        // Get center of viewport or use cursor position
        const position = screenToFlowPosition({
          x: cursorPosition.x,
          y: cursorPosition.y,
        });
        
        // Create a new email preview node
        const newNode: Node = {
          id: `email-${nanoid(6)}`,
          type: 'emailPreview',
          position,
          data: {
            nodeTitle: 'Email Template',
            subjectLine: 'Automate Your [Task] & See ROI',
            hookText: 'I noticed your team still manages [process] manually...',
            ctaText: 'I packaged the ROI analysis and implementation plan:',
            offerText: 'Happy to show you the exact setup in a quick 15-min demo.',
            psText: 'PS - Most teams see results within 48 hours.',
            showSubject: true,
            showHook: true,
            showCTA: true,
            showOffer: true,
            showPS: true,
            showTestimonial: false,
            showUrgency: false,
          },
        };
        
        // Wrap optimistic update in startTransition for React 19 compatibility
        startTransition(() => {
          // Optimistically add the node for instant UI feedback
          addOptimisticNode(newNode);
          
          // Actually add the node through onNodesChange
          onNodesChange([
            {
              type: 'add',
              item: newNode,
            },
          ]);
        });
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
  }, [isMobile, cursorPosition, screenToFlowPosition, onNodesChange]);
  
  // Function to validate connections - no longer wrapped in useCallback
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
    
    // Check if this is an email context connection
    const sourceData = sourceNode.data as { isEmailContext?: boolean; contextType?: string };
    const isEmailContextConnection = sourceData.isEmailContext === true || 
      ['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(sourceNode.type || '');
    
    if (isEmailContextConnection) {
      // Email context nodes can only connect to email preview nodes
      if (targetNode.type !== 'emailPreview') {
        return false;
      }
      
      // Validate that the target handle is a valid email section
      const validSections = ['subject', 'hook', 'cta', 'offer', 'ps', 'testimonial', 'urgency'];
      if (connection.targetHandle) {
        // Handle IDs now have -left or -right suffix, so extract the section name
        const sectionName = connection.targetHandle.replace(/-left$|-right$/, '');
        if (!validSections.includes(sectionName)) {
          return false;
        }
      }
      
      return true;
    }
    
    // Regular connection validation for non-email nodes
    
    // Prevent connecting to trigger nodes (they can only be at the start)
    if (targetNode.type === 'trigger') {
      return false;
    }
    
    // Prevent connecting to email preview nodes from regular nodes
    if (targetNode.type === 'emailPreview') {
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
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    );
    
    if (isDuplicate) {
      return false;
    }
    
    // Allow connection if validation passes
    return true;
  };

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isMobile) {
      setCursorPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  // Handle mouse enter/leave canvas
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsOverCanvas(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOverCanvas(false);
  };

  // Get appropriate data for the selected node type
  const getNodeData = (type: NodeType, count: number) => {
    switch (type) {
      case 'trigger':
        return {
          label: `Trigger ${count}`,
          typeOf: 'webhook',
        };
      case 'action':
        return {
          label: `Action ${count}`,
          appName: 'New Action',
          action: 'configure',
        };
      case 'decision':
        return {
          label: `Decision ${count}`,
          conditionType: 'value',
          operator: 'equals',
        };
      default:
        return {
          label: `Node ${count}`,
        };
    }
  };

  // Handle double-click to add a new node (uses selected type from Toolbox)
  const handlePaneClick = (event: React.MouseEvent) => {
    // Only handle double-clicks
    if (event.detail !== 2) return;
    
    // Prevent default double-click behavior
    event.preventDefault();
    
    // Convert screen coordinates to flow coordinates (accounts for zoom/pan)
    const position = screenToFlowPosition({
      x: event.clientX - 5, // 5px to the left of cursor
      y: event.clientY,
    });
    
    // Create a new node with the selected type from Toolbox
    const newNode: Node = {
      id: `node-${nanoid(6)}`,
      type: selectedNodeType,
      position,
      data: getNodeData(selectedNodeType, nodes.length + 1),
    };
    
    // Wrap optimistic update in startTransition for React 19 compatibility
    startTransition(() => {
      // Optimistically add the node for instant UI feedback
      addOptimisticNode(newNode);
      
      // Actually add the node through onNodesChange
      onNodesChange([
        {
          type: 'add',
          item: newNode,
        },
      ]);
    });
  };

  // Add new edge on connect - also wrap in startTransition
  const handleConnect = (connection: Connection) => {
    // Validate connection
    if (!isValidConnection(connection)) {
      return;
    }
    
    // Check if this is an email context connection
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    const sourceData = sourceNode?.data as { isEmailContext?: boolean; contextType?: string };
    const isEmailContextConnection = sourceData?.isEmailContext === true || 
      ['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(sourceNode?.type || '');
    
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}${connection.sourceHandle ? `-${connection.sourceHandle}` : ''}${connection.targetHandle ? `-${connection.targetHandle}` : ''}`,
      // Add additional data for rendering decision edges differently if needed
      data: {
        ...(connection.sourceHandle === 'true' ? { isTrue: true } : {}),
        ...(connection.sourceHandle === 'false' ? { isFalse: true } : {}),
        ...(isEmailContextConnection ? { isEmailContext: true } : {}),
      }
    };
    
    // Wrap optimistic update in startTransition for React 19 compatibility
    startTransition(() => {
      // Optimistically add the edge for instant UI feedback
      addOptimisticEdge(newEdge);
      
      // Add new edge through onEdgesChange
      onEdgesChange([
        {
          type: 'add',
          item: newEdge,
        },
      ]);
      
      // If this is an email context connection to an email preview node, update the node data
      if (isEmailContextConnection && targetNode?.type === 'emailPreview' && connection.targetHandle) {
        const currentConnections = (targetNode.data as { sectionConnections?: EmailSectionConnections }).sectionConnections || {};
        // Extract section name from handle ID (remove -left or -right suffix)
        const sectionName = connection.targetHandle.replace(/-left$|-right$/, '');
        const updatedConnections = addSectionConnection(
          currentConnections,
          sectionName as keyof EmailSectionConnections,
          connection.source!
        );
        
        // Update the email preview node with new connections
        onNodesChange([{
          id: targetNode.id,
          type: 'replace',
          item: {
            ...targetNode,
            data: {
              ...targetNode.data,
              sectionConnections: updatedConnections
            }
          }
        }]);
        
        // Also update the source node to indicate it's connected
        onNodesChange([{
          id: sourceNode!.id,
          type: 'replace', 
          item: {
            ...sourceNode!,
            data: {
              ...sourceNode!.data,
              isConnectedToEmail: true
            }
          }
        }]);
      }
    });
  };
  
  // Enhanced onEdgesChange to handle email context disconnections
  const handleEdgesChange = (changes: EdgeChange[]) => {
    // Process each change
    changes.forEach(change => {
      if (change.type === 'remove') {
        const edge = edges.find(e => e.id === change.id);
        if (edge && edge.data?.isEmailContext) {
          const targetNode = nodes.find(n => n.id === edge.target);
          const sourceNode = nodes.find(n => n.id === edge.source);
          
          if (targetNode?.type === 'emailPreview' && edge.targetHandle) {
            // Update email preview node to remove connection
            const currentConnections = (targetNode.data as { sectionConnections?: EmailSectionConnections }).sectionConnections || {};
            // Extract section name from handle ID (remove -left or -right suffix)
            const sectionName = edge.targetHandle.replace(/-left$|-right$/, '');
            const updatedConnections = removeSectionConnection(
              currentConnections,
              sectionName as keyof EmailSectionConnections,
              edge.source
            );
            
            onNodesChange([{
              id: targetNode.id,
              type: 'replace',
              item: {
                ...targetNode,
                data: {
                  ...targetNode.data,
                  sectionConnections: updatedConnections
                }
              }
            }]);
          }
          
          // Check if source node still has other email connections
          if (sourceNode) {
            const hasOtherEmailConnections = edges.some(e => 
              e.id !== edge.id && 
              e.source === sourceNode.id && 
              e.data?.isEmailContext
            );
            
            if (!hasOtherEmailConnections) {
              onNodesChange([{
                id: sourceNode.id,
                type: 'replace',
                item: {
                  ...sourceNode,
                  data: {
                    ...sourceNode.data,
                    isConnectedToEmail: false
                  }
                }
              }]);
            }
          }
        }
      }
    });
    
    // Call the original onEdgesChange
    onEdgesChange(changes);
  };

  // Find email preview nodes
  const emailPreviewNodes = optimisticNodes.filter(n => n.type === 'emailPreview');

  // Enhanced node types with callbacks
  const enhancedNodeTypes = useMemo(() => {
    if (!nodeTypes || !handleRegenerateSection) return nodeTypes;
    
    return {
      ...nodeTypes,
      emailPreview: (props: any) => {
        const EmailPreviewComponent = nodeTypes?.emailPreview;
        if (!EmailPreviewComponent) return null;
        
        return React.createElement(EmailPreviewComponent, {
          ...props,
          data: {
            ...props.data,
            onRegenerateSection: (section: string) => handleRegenerateSection(
              props.id, 
              section as 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
              'regenerate', 
              '', 
              []
            ),
          }
        });
      },
    };
  }, [nodeTypes, handleRegenerateSection]);

  return (
    <div
      ref={(node) => {
        setWrapperRef?.(node);
        setDroppableRef?.(node);
      }}
      className={`w-full h-full relative ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scenario Title Display/Edit */}
      {onToggleEditTitle && onScenarioNameChange && onSaveScenarioName && onScenarioNameKeyDown && titleInputRef && (
        <div className={`absolute top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow flex items-center max-w-[calc(100%-40px)] min-w-[200px] ${
          isMobile ? 'left-1/2 transform -translate-x-1/2' : 'left-4'
        }`}> 
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              type="text"
              value={editingScenarioName || ""}
              onChange={(e) => onScenarioNameChange(e.target.value)}
              onBlur={onSaveScenarioName} 
              onKeyDown={onScenarioNameKeyDown}
              className={`font-semibold border-primary focus:ring-primary/50 flex-grow min-w-0 ${
                isMobile ? 'text-base h-9' : 'text-lg h-8'
              }`}
              placeholder="Enter scenario name"
            />
          ) : (
            <h2 
              className={`font-semibold truncate cursor-pointer hover:text-primary transition-colors duration-150 flex-grow min-w-0 ${
                isMobile ? 'text-base' : 'text-lg'
              }`}
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
              className={`ml-2 flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-7 w-7'}`}
              title="Edit scenario name"
            >
              <Edit2Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          )}
        </div>
      )}

      <ReactFlow
        nodes={optimisticNodes}
        edges={optimisticEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={enhancedNodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultViewport={defaultViewport}
        onMoveEnd={onMoveEnd}
        snapToGrid
        snapGrid={[8, 8]}
        onInit={onInit}
        isValidConnection={isValidConnection}
        selectionMode={selectionMode}
        multiSelectionKeyCode={isMobile ? null : "Shift"}
        className="bg-[linear-gradient(to_right,transparent_49%,theme(colors.border)_50%),linear-gradient(to_bottom,transparent_49%,theme(colors.border)_50%)] bg-[size:1rem_1rem]"
        panOnDrag={isMobile ? [1, 2] : true}
        zoomOnScroll={true}
        zoomOnPinch={isMobile}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background gap={16} color="var(--border)" />
        
        {/* Regenerate buttons are now inline within EmailPreviewNode sections */}
        {/* RegenerateButtonsControls component disabled to prevent external floating buttons */}
      </ReactFlow>

      {/* Floating Node Selector - shows current selection from Toolbox */}
      <FloatingNodeSelector
        selectedType={selectedNodeType}
        onTypeChange={onNodeTypeChange || (() => {})}
        cursorPosition={cursorPosition}
        isVisible={isOverCanvas && !isMobile}
      />
    </div>
  );
}