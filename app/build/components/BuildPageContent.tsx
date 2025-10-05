"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  Viewport,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Import our extracted hooks
import { useROI } from "../hooks/useROI";
import { useScenarioManager } from "../hooks/useScenarioManager";
import { useEmailGeneration } from "../hooks/useEmailGeneration";
import { useScenarioInitialization } from "../hooks/useScenarioInitialization";
import { useInitialViewport } from "../hooks/useInitialViewport";

// Import types
import { NodeType, Scenario, NodeData, PlatformType } from "@/lib/types";

// Import constants
import { TASK_TYPE_MULTIPLIERS, BENCHMARKS, CANVAS_CONFIG } from "@/lib/utils/constants";

// Import database and utilities
import { db, createScenario } from "@/lib/db";
import { nanoid } from "nanoid";

// Import components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsBar } from "@/components/flow/StatsBar";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { EmailPreviewNode } from "@/components/flow/EmailPreviewNode";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PixelNode } from "@/components/flow/PixelNode";
import { NodePropertiesPanel } from "@/components/flow/panels/NodePropertiesPanel";
import { GroupPropertiesPanel } from "@/components/flow/GroupPropertiesPanel";
import { EmailNodePropertiesPanel } from "@/components/flow/EmailNodePropertiesPanel";
import { ROISettingsPanel } from "@/components/roi/ROISettingsPanel";
import { ROIReportNode } from "@/components/flow/ROIReportNode";
import { ROINodePropertiesPanel } from "@/components/flow/ROINodePropertiesPanel";
import type { ROIReportNodeData } from "@/components/flow/ROIReportNode";
import { generateRoiNodeWithBusinessImpact } from "@/lib/roi-report-generator";
// dnd-kit
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";

// Import icons
import { Copy, Edit2 as Edit2Icon, Trash2, Check, X } from "lucide-react";

// Dynamic imports for performance
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

// Base node types (without callback dependencies)
const baseNodeTypes = {
  trigger: PixelNode,
  action: PixelNode,
  decision: PixelNode,
  group: NodeGroup,
  persona: PixelNode,
  industry: PixelNode,
  painpoint: PixelNode,
  metric: PixelNode,
  urgency: PixelNode,
  socialproof: PixelNode,
  objection: PixelNode,
  value: PixelNode,
  roiReport: ROIReportNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface EmailNodeData {
  nodeTitle?: string;
  subjectLine?: string;
  hookText?: string;
  ctaText?: string;
  offerText?: string;
  psText?: string;
  testimonialText?: string;
  urgencyText?: string;
  sectionConnections?: Record<string, { connectedNodeIds: string[] }>;
}

// NodeData interface is now imported from lib/types.ts

export function BuildPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTheme } = useTheme();

  // URL parameters
  const scenarioIdParam = params.get("sid");
  const templateIdParam = params.get("tid");
  const queryParam = params.get("q");
  const useDefaultTemplate = params.get("default") === "true";
  const importParam = params.get("import");

  // Force light mode
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Canvas state
  const [nodes, setNodes, originalOnNodesChange] = useNodesState<Node>([]);
  
  // Debug wrapper for onNodesChange
  const onNodesChange = useCallback((changes: Parameters<typeof originalOnNodesChange>[0]) => {
    console.log('🔄 onNodesChange called with changes:', changes);
    originalOnNodesChange(changes);
    console.log('🔄 onNodesChange processed');
  }, [originalOnNodesChange]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEmailNodeId, setSelectedEmailNodeId] = useState<string | null>(null);
  const [selectedROINodeId, setSelectedROINodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');

  // UI state
  const [activeTab, setActiveTab] = useState<'canvas' | 'analytics'>('canvas');
  const [isROISettingsOpen, setIsROISettingsOpen] = useState(false);
  
  // Scenario editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingName, setEditingName] = useState("");

  // ReactFlow refs
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);

  // dnd-kit sensors and canvas droppable setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: "canvas" });
  
  // Flag to prevent save loops
  const isLoadingScenarioRef = useRef(false);
  const lastSavedNodesRef = useRef<string>("");
  const lastSavedEdgesRef = useRef<string>("");

  // Initialize scenario manager without circular dependency
  const scenarioManager = useScenarioManager({
    initialScenarioId: scenarioIdParam || undefined,
  });

  // Handle scenario initialization with duplicate prevention
  const { isLoading } = useScenarioInitialization({
    scenarioIdParam,
    templateIdParam,
    queryParam,
    useDefaultTemplate,
    importParam,
    scenarioManager,
  });

  // Memoize the ROI settings change handler to prevent infinite loops
  const handleROISettingsChange = useCallback((settings: Partial<Scenario>) => {
    if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
      scenarioManager.updateScenario(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioManager.updateScenario]); // scenarioManager.scenario intentionally omitted to prevent infinite loops

  // Initialize ROI hook
  const roi = useROI({
    initialScenario: scenarioManager.scenario,
    onSettingsChange: handleROISettingsChange,
    nodes,
  });

  // Initialize viewport management - fits all nodes with first node always visible
  const { initializeViewport, resetViewport, fitToNodes } = useInitialViewport({
    rfInstance,
    nodes,
    enabled: !isLoading, // Only enable after loading complete
    minZoom: 0.1,
    maxZoom: 2,
    padding: 100,
    duration: 800,
  });

  // Load scenario data to canvas - stable callback
  const loadScenarioToCanvas = useCallback((scenario: Scenario) => {
    try {
      isLoadingScenarioRef.current = true;
      
      let loadedNodes = (scenario.nodesSnapshot as Node[] || []);
      const loadedEdges = (scenario.edgesSnapshot as Edge[] || []);
      
      // If no nodes, add a default trigger node to show something on canvas
      if (loadedNodes.length === 0) {
        loadedNodes = [{
          id: 'default-trigger',
          type: 'trigger',
          position: { x: CANVAS_CONFIG.rankSpacing, y: 200 },
          data: { label: 'Start Here', typeOf: 'webhook' }
        }];
        console.log('Added default trigger node since scenario was empty');
      }
      
      // Store the loaded state to prevent re-saving
      lastSavedNodesRef.current = JSON.stringify(loadedNodes);
      lastSavedEdgesRef.current = JSON.stringify(loadedEdges);
      
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      
      // Note: Viewport is now handled by useInitialViewport hook
      // which automatically calculates optimal zoom to fit all nodes
      // while ensuring the first node is always visible
      
      // Delay to ensure state updates are complete
      setTimeout(() => {
        isLoadingScenarioRef.current = false;
      }, 100);
      
    } catch (error) {
      console.error('Failed to load scenario to canvas:', error);
      toast.error('Failed to load scenario');
      isLoadingScenarioRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps intentional - scenario passed as parameter, setNodes/setEdges are stable refs

  // Load scenario when it changes
  useEffect(() => {
    if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
      console.log('🔄 USEEFFECT TRIGGER: Loading scenario (ID:', scenarioManager.scenario?.id, ')');
      console.log('🔄 USEEFFECT TRIGGER: Nodes in scenario:', scenarioManager.scenario.nodesSnapshot?.length || 0);
      loadScenarioToCanvas(scenarioManager.scenario);
      roi.loadFromScenario(scenarioManager.scenario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [scenarioManager.scenario?.id, loadScenarioToCanvas, roi.loadFromScenario]); // scenarioManager.scenario intentionally omitted to prevent infinite loops

  // Initialize email generation hook
  const emailGeneration = useEmailGeneration({
    onEmailGenerated: (email) => {
      // Find the highest Y position (lowest Y value) among all nodes
      const highestY = nodes.length > 0 
        ? Math.min(...nodes.map(node => node.position.y))
        : 200;
      
      // Position email node 1,000px above the highest node
      const emailPosition = {
        x: CANVAS_CONFIG.nodeSpacing * 2,
        y: highestY - 1000
      };
      
      // Update the loading email node with generated content
      const emailNode: Node = {
        id: `email-${Date.now()}`,
        type: 'emailPreview',
        position: emailPosition,
        data: {
          ...email,
          nodeTitle: 'Generated Email',
          isLoading: false, // Turn off loading state
          stats: {
            roiX: roi.metrics.roiRatio,
            payback: roi.metrics.paybackPeriod,
            runs: roi.settings.runsPerMonth,
          },
        },
      };
      
      // Replace loading node or add new one
      setNodes(prevNodes => {
        const loadingNodeIndex = prevNodes.findIndex(n => n.data?.isLoading && n.type === 'emailPreview');
        if (loadingNodeIndex >= 0) {
          // Replace loading node
          const newNodes = [...prevNodes];
          newNodes[loadingNodeIndex] = { ...emailNode, id: prevNodes[loadingNodeIndex].id };
          return newNodes;
        } else {
          // Add new node
          return [...prevNodes, emailNode];
        }
      });
      
      // Zoom IN and focus on the email node with closer view
      setTimeout(() => {
        if (rfInstance) {
          rfInstance.setCenter(emailPosition.x + 400, emailPosition.y + 300, { zoom: 1.2, duration: 800 });
        }
      }, 100);
      
      toast.success('Email generated successfully!');
    },
  });

  // Handle regenerating individual email sections
  const handleRegenerateSection = useCallback(async (
    nodeId: string, 
    section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
    promptType: string,
    currentText: string,
    selectedContextNodes?: string[]
  ): Promise<void> => {
    try {
      // Find the email node
      const emailNode = nodes.find(n => n.id === nodeId && n.type === 'emailPreview');
      if (!emailNode) return;

      // Use selectedContextNodes if provided, otherwise try to get from connections
      let contextNodes: typeof nodes = [];
      
      if (selectedContextNodes && selectedContextNodes.length > 0) {
        // Use explicitly selected context nodes
        contextNodes = nodes.filter(n => selectedContextNodes.includes(n.id));
      } else {
        // Fallback to connected nodes (legacy behavior)
        const sectionConnections = (emailNode.data as EmailNodeData).sectionConnections || {};
        const sectionConnection = sectionConnections[section];
        
        if (sectionConnection?.connectedNodeIds) {
          contextNodes = nodes.filter(n => 
            sectionConnection.connectedNodeIds.includes(n.id)
          );
        }
      }

      // Extract context from context nodes
      const contextData = emailGeneration.extractContextFromNodes(contextNodes);

      // Map section names from API format to EmailSectionType format
      const sectionToFieldMap: Record<string, string> = {
        subject: 'subjectLine',
        hook: 'hookText', 
        cta: 'ctaText',
        offer: 'offerText',
        ps: 'psText',
        testimonial: 'testimonialText',
        urgency: 'urgencyText',
      };

      const fieldName = sectionToFieldMap[section];
      if (!fieldName) {
        toast.error(`Unknown section: ${section}`);
        return;
      }

      // Generate the section with proper typing
      const newContent = await emailGeneration.generateEmailSection(
        fieldName as 'subjectLine' | 'hookText' | 'ctaText' | 'offerText' | 'psText' | 'testimonialText' | 'urgencyText',
        contextData,
        `regenerate_${section}`,
        {
          scenarioName: scenarioManager.scenario?.name || 'Untitled Scenario',
          platform: roi.settings.platform,
          netROI: roi.metrics.netROI,
          roiRatio: roi.metrics.roiRatio,
          paybackPeriod: roi.metrics.paybackPeriod,
          totalHoursSaved: roi.metrics.timeSavedHours,
          runsPerMonth: roi.settings.runsPerMonth,
          minutesPerRun: roi.settings.minutesPerRun,
          hourlyRate: roi.settings.hourlyRate,
          taskMultiplier: roi.settings.taskMultiplier,
        }
      );

      // Update the email node with the new content
      setNodes(nodes => nodes.map(n => 
        n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            [fieldName]: newContent,
          }
        } : n
      ));

      toast.success(`${section} section updated successfully!`);
    } catch (error) {
      console.error('Failed to regenerate section:', error);
      toast.error('Failed to regenerate section');
    }
  }, [nodes, emailGeneration, setNodes, scenarioManager.scenario?.name, roi.metrics.netROI, roi.metrics.roiRatio, roi.metrics.paybackPeriod, roi.metrics.timeSavedHours, roi.settings.platform, roi.settings.runsPerMonth, roi.settings.minutesPerRun, roi.settings.hourlyRate, roi.settings.taskMultiplier]);

  // Simplified wrapper for FlowCanvas (only nodeId and section)
  const handleRegenerateSectionSimple = useCallback(async (
    nodeId: string,
    section: string
  ): Promise<void> => {
    // Call the full function with default values
    await handleRegenerateSection(
      nodeId, 
      section as 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
      'regenerate_standard_professional_warm', // default prompt type
      '', // current text (will be extracted from node)
      [] // no selected context nodes
    );
  }, [handleRegenerateSection]);

  // Create nodeTypes with stable EmailPreviewNode that uses a ref for the callback
  const regenerationCallbackRef = useRef(handleRegenerateSectionSimple);
  
  // Update the ref when callback changes
  useEffect(() => {
    regenerationCallbackRef.current = handleRegenerateSectionSimple;
  }, [handleRegenerateSectionSimple]);
  
  // Create nodeTypes using useMemo with stable references
  const nodeTypes = useMemo(() => ({
    ...baseNodeTypes,
    emailPreview: (props: { id: string; data: Record<string, unknown> }) => (
      <EmailPreviewNode 
        {...props} 
        data={{
          ...props.data, 
          onRegenerateSection: (section: string) => regenerationCallbackRef.current(props.id, section)
        }} 
      />
    ),
  }), []); // Empty deps array since we use refs for dynamic behavior

  // Get selected node
  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const selectedGroup = selectedGroupId ? nodes.find(n => n.id === selectedGroupId) : null;
  const selectedEmailNode = selectedEmailNodeId ? nodes.find(n => n.id === selectedEmailNodeId) : null;
  const selectedROINode = selectedROINodeId ? nodes.find(n => n.id === selectedROINodeId) : null;

  // Save scenario when nodes/edges change
  useEffect(() => {
    if (!scenarioManager.scenario || isLoading || isLoadingScenarioRef.current) {
      return;
    }

    // Persist all nodes, including ROI report nodes, so reports remain across scenario switches
    const persistentNodes = nodes;

    // Check if persistent nodes/edges actually changed
    const currentNodesStr = JSON.stringify(persistentNodes);
    const currentEdgesStr = JSON.stringify(edges);
    
    if (currentNodesStr === lastSavedNodesRef.current && 
        currentEdgesStr === lastSavedEdgesRef.current) {
      return; // No changes, skip save
    }

    // Update last saved refs
    lastSavedNodesRef.current = currentNodesStr;
    lastSavedEdgesRef.current = currentEdgesStr;

    // Debounce the save
    const saveTimer = setTimeout(() => {
      scenarioManager.updateScenario({
        nodesSnapshot: persistentNodes, // Save only persistent nodes
        edgesSnapshot: edges,
      });
    }, 500);

    return () => clearTimeout(saveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, scenarioManager.updateScenario, isLoading]); // scenarioManager intentionally omitted to prevent infinite save loops

  // Scenario management handlers
  const handleDuplicateScenario = useCallback(async () => {
    if (!scenarioManager.scenario) return;
    
    try {
      const scenario = scenarioManager.scenario;
      const duplicateName = `${scenario.name} (Copy)`;
      const newId = await db.scenarios.add({
        name: duplicateName,
        slug: nanoid(8),
        platform: scenario.platform,
        nodesSnapshot: scenario.nodesSnapshot,
        edgesSnapshot: scenario.edgesSnapshot,
        viewport: scenario.viewport,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Copy all ROI data
        runsPerMonth: scenario.runsPerMonth,
        minutesPerRun: scenario.minutesPerRun,
        hourlyRate: scenario.hourlyRate,
        taskMultiplier: scenario.taskMultiplier,
        taskType: scenario.taskType,
        complianceEnabled: scenario.complianceEnabled,
        riskLevel: scenario.riskLevel,
        riskFrequency: scenario.riskFrequency,
        errorCost: scenario.errorCost,
        revenueEnabled: scenario.revenueEnabled,
        monthlyVolume: scenario.monthlyVolume,
        conversionRate: scenario.conversionRate,
        valuePerConversion: scenario.valuePerConversion,
        // Copy template data
        originalTemplateId: scenario.originalTemplateId,
        searchQuery: scenario.searchQuery,
        templatePricingData: scenario.templatePricingData,
      });
      
      if (newId && typeof newId === 'number') {
        router.push(`/build?sid=${newId}`);
        toast.success(`Scenario duplicated as "${duplicateName}"`);
      }
    } catch (error) {
      console.error('Failed to duplicate scenario:', error);
      toast.error('Failed to duplicate scenario');
    }
  }, [scenarioManager.scenario, router]);

  const handleDeleteScenario = useCallback(async () => {
    if (!scenarioManager.scenario?.id) return;
    
    try {
      await db.scenarios.delete(scenarioManager.scenario.id);
      
      // Navigate to first available scenario or create new one
      const firstScenario = await db.scenarios.orderBy('updatedAt').reverse().first();
      if (firstScenario?.id) {
        router.push(`/build?sid=${firstScenario.id}`);
      } else {
        // Create a new scenario if none exist
        const newId = await createScenario("Untitled Scenario");
        router.push(`/build?sid=${newId}`);
      }
      
      toast.success('Scenario deleted');
    } catch (error) {
      console.error('Failed to delete scenario:', error);
      toast.error('Failed to delete scenario');
    }
  }, [scenarioManager.scenario?.id, router]);

  const handleStartEdit = () => {
    if (scenarioManager.scenario) {
      setIsEditingTitle(true);
      setEditingName(scenarioManager.scenario.name);
    }
  };

  const handleSaveEdit = useCallback(async () => {
    if (!scenarioManager.scenario?.id || !editingName.trim()) return;
    
    try {
      await db.scenarios.update(scenarioManager.scenario.id, { 
        name: editingName.trim(), 
        updatedAt: Date.now() 
      });
      
      // Update the scenario manager's current scenario
      await scenarioManager.loadScenario(scenarioManager.scenario.id.toString());
      
      setIsEditingTitle(false);
      setEditingName("");
      toast.success('Scenario name updated');
    } catch (error) {
      console.error('Failed to update scenario name:', error);
      toast.error('Failed to update scenario name');
    }
  }, [editingName, scenarioManager]);

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditingName("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle drop from Toolbox into canvas
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.id !== 'canvas') return;

    const nodeType = active.data.current?.nodeType as NodeType | undefined;
    const isEmailContext = active.data.current?.isEmailContext as boolean | undefined;
    const contextValue = active.data.current?.contextValue as string | undefined;
    const category = active.data.current?.category as string | undefined;

    if (!nodeType || !reactFlowWrapperRef.current || !rfInstance) return;

    const wrapperRect = reactFlowWrapperRef.current.getBoundingClientRect();
    const rect = active.rect.current.translated ?? active.rect.current.initial;
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const viewport = rfInstance.getViewport();
    const pos = {
      x: (centerX - wrapperRect.left - viewport.x) / viewport.zoom,
      y: (centerY - wrapperRect.top - viewport.y) / viewport.zoom,
    };
    const snapped = {
      x: Math.round(pos.x / 8) * 8,
      y: Math.round(pos.y / 8) * 8,
    };

    const labelBase = `${nodeType.charAt(0).toUpperCase()}${nodeType.slice(1)}`;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: snapped,
      data: isEmailContext
        ? {
            label: labelBase,
            isEmailContext: true,
            contextType: nodeType,
            contextValue: contextValue || '',
            category: category || '',
          }
        : {
            label: labelBase,
            ...(nodeType === 'trigger' && { typeOf: 'webhook' }),
            ...(nodeType === 'action' && { appName: 'New Action', action: 'configure', typeOf: 'data_processing' }),
            ...(nodeType === 'decision' && { conditionType: 'value', operator: 'equals' }),
          },
    };

    onNodesChange([{ type: 'add', item: newNode }]);
  }, [onNodesChange, rfInstance]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scenario...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <DndContext
        sensors={sensors}
        modifiers={[createSnapModifier(8)]}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
      <div className="flex-1 flex flex-col" data-page="build">
        {/* StatsBar */}
        <StatsBar
          platform={roi.settings.platform as PlatformType}
          runsPerMonth={roi.settings.runsPerMonth}
          minutesPerRun={roi.settings.minutesPerRun}
          hourlyRate={roi.settings.hourlyRate}
          taskMultiplier={roi.settings.taskMultiplier}
          nodes={nodes}
          currentScenario={scenarioManager.scenario}
          complianceEnabled={roi.settings.complianceEnabled}
          riskLevel={roi.settings.riskLevel}
          riskFrequency={roi.settings.riskFrequency}
          errorCost={roi.settings.errorCost}
          revenueEnabled={roi.settings.revenueEnabled}
          monthlyVolume={roi.settings.monthlyVolume}
          conversionRate={roi.settings.conversionRate}
          valuePerConversion={roi.settings.valuePerConversion}
          onUpdateRuns={roi.setRunsPerMonth}
          onUpdateMinutes={roi.setMinutesPerRun}
          onPlatformChange={roi.setPlatform}
          onOpenROISettings={() => setIsROISettingsOpen(true)}
          onAddNode={() => {
            const center = rfInstance?.getViewport() 
              ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
              : { x: 300, y: 300 };
            
            const newNode: Node = {
              id: `node-${Date.now()}`,
              type: selectedNodeType,
              position: center,
              data: { label: `New ${selectedNodeType}` },
            };
            
            onNodesChange([{ type: 'add', item: newNode }]);
          }}
          onGenerateEmail={() => {
            // Find the highest Y position (lowest Y value) among all nodes for positioning
            const highestY = nodes.length > 0 
              ? Math.min(...nodes.map(node => node.position.y))
              : 200;
            
            // Position email node 1,000px above the highest node
            const emailPosition = {
              x: CANVAS_CONFIG.nodeSpacing * 2,
              y: highestY - 1000
            };
            
            // Immediately create loading email node
            const loadingEmailNode: Node = {
              id: `email-loading-${Date.now()}`,
              type: 'emailPreview',
              position: emailPosition,
              data: {
                nodeTitle: 'Generating Email...',
                isLoading: true,
                subjectLine: '',
                hookText: '',
                ctaText: '',
                offerText: '',
                psText: '',
                testimonialText: '',
                urgencyText: '',
                stats: {
                  roiX: roi.metrics.roiRatio,
                  payback: roi.metrics.paybackPeriod,
                  runs: roi.settings.runsPerMonth,
                },
              },
            };
            
            // Add loading node immediately
            onNodesChange([{ type: 'add', item: loadingEmailNode }]);
            
            // Zoom IN and focus on the loading email node
            setTimeout(() => {
              if (rfInstance) {
                rfInstance.setCenter(emailPosition.x + 400, emailPosition.y + 300, { zoom: 1.2, duration: 800 });
              }
            }, 50);
            
            // Start email generation
            const contextData = emailGeneration.extractContextFromNodes(nodes);
            emailGeneration.generateFullEmail(contextData, {
              lengthOption: 'standard',
              toneOption: 'professional_warm',
            });
          }}
          isGeneratingEmail={emailGeneration.isGenerating}
          selectedIds={[]}
          selectedGroupId={null}
          isMultiSelectionActive={false}
          onGenerateROIReport={(roiNode) => {
            // Compute position: below the lowest node by a generous gap and horizontally centered
            const ROI_WIDTH = 1024;
            const ROI_HEIGHT = 1448;
            const VERTICAL_GAP = 400;

            const viewport = rfInstance?.getViewport();
            const zoom = viewport?.zoom || 1;
            const worldCenterX = ((window.innerWidth / 2) - (viewport?.x || 0)) / zoom;
            const maxY = nodes.length ? Math.max(...nodes.map(n => n.position.y)) : 0;
            const position = {
              x: Math.round(worldCenterX - ROI_WIDTH / 2),
              y: Math.round(maxY + VERTICAL_GAP),
            };

            // Place the node then fit the viewport to its exact bounds
            roiNode.position = position;
            onNodesChange([{ type: 'add', item: roiNode }]);

            setTimeout(() => {
              if (rfInstance) {
                rfInstance.fitBounds({ x: position.x, y: position.y, width: ROI_WIDTH, height: ROI_HEIGHT }, { padding: 0.02, duration: 800 });
              }
            }, 80);
          }}
          isAnalyticsView={activeTab === 'analytics'}
          onGoBackToCanvas={() => setActiveTab('canvas')}
        />

        {/* Content */}
        {activeTab === 'canvas' ? (
          <div className="flex-1 flex">
            {/* Toolbox */}
            <Toolbox 
              onLoadScenario={(id) => scenarioManager.loadScenario(id.toString())}
              activeScenarioId={scenarioManager.scenario?.id as number | null}
              emailNodes={nodes.filter(n => n.type === 'emailPreview').map(n => {
                const emailData = n.data as Partial<EmailNodeData>;
                return {
                  id: n.id,
                  title: emailData.nodeTitle || 'Email'
                };
              })}
              onFocusNode={(nodeId) => {
                const node = nodes.find(n => n.id === nodeId);
                if (node && rfInstance) {
                  rfInstance.fitBounds({ 
                    x: node.position.x - 100, 
                    y: node.position.y - 100,
                    width: 300,
                    height: 300
                  });
                }
              }}
              selectedNodeType={selectedNodeType}
              onNodeTypeSelect={setSelectedNodeType}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
            />

            {/* Main Canvas Area with Title */}
            <div className="flex-1 flex flex-col">
              {/* Compact Title Bar */}
              <div className="bg-white border-b px-4 py-1.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
                  {isEditingTitle ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      className="h-6 text-sm font-medium flex-1 min-w-0"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-sm font-medium text-muted-foreground truncate">
                      {scenarioManager.scenario?.name || "Untitled Scenario"}
                    </h2>
                  )}
                  {scenarioManager.isSaving && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Saving...</span>
                  )}
                </div>
                
                {/* Scenario Actions */}
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDuplicateScenario}
                    className="h-6 px-2 text-xs hover:bg-muted"
                    title="Duplicate scenario"
                    disabled={!scenarioManager.scenario}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  {isEditingTitle ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleSaveEdit}
                        className="h-6 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                        title="Save changes"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                        title="Cancel editing"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-6 px-2 text-xs hover:bg-muted"
                      title="Edit scenario name"
                      disabled={!scenarioManager.scenario}
                    >
                      <Edit2Icon className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDeleteScenario}
                    className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    title="Delete scenario"
                    disabled={!scenarioManager.scenario?.id}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 relative overflow-hidden">
              <FlowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(event, node) => {
                  if (node.type === 'group') {
                    setSelectedGroupId(node.id);
                    setSelectedId(null);
                    setSelectedEmailNodeId(null);
                    setSelectedROINodeId(null);
                  } else if (node.type === 'emailPreview') {
                    setSelectedEmailNodeId(node.id);
                    setSelectedId(null);
                    setSelectedGroupId(null);
                    setSelectedROINodeId(null);
                  } else if (node.type === 'roiReport') {
                    // Do not open ROI panel on single click
                    setSelectedId(null);
                    setSelectedGroupId(null);
                    setSelectedEmailNodeId(null);
                    // Keep selectedROINodeId unchanged until double-click
                  } else {
                    setSelectedId(node.id);
                    setSelectedGroupId(null);
                    setSelectedEmailNodeId(null);
                    setSelectedROINodeId(null);
                  }
                }}
                onNodeDoubleClick={(event, node) => {
                  if (node.type === 'roiReport') {
                    setSelectedROINodeId(node.id);
                    setSelectedId(null);
                    setSelectedGroupId(null);
                    setSelectedEmailNodeId(null);
                  }
                }}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                selectedNodeType={selectedNodeType}
                onNodeTypeChange={setSelectedNodeType}
                setWrapperRef={(n) => { reactFlowWrapperRef.current = n; }}
                setDroppableRef={setDroppableRef}
                isOver={isOver}
              />
              </div>
            </div>

            {/* Property Panels */}
            {selectedNode && (
              <NodePropertiesPanel
                selectedNode={selectedNode}
                onClose={() => setSelectedId(null)}
                platform={roi.settings.platform}
                nodes={nodes}
                setNodes={setNodes}
                runsPerMonth={roi.settings.runsPerMonth}
                minutesPerRun={roi.settings.minutesPerRun}
                hourlyRate={roi.settings.hourlyRate}
                taskMultiplier={roi.settings.taskMultiplier}
                edges={edges}
                // Risk & Compliance parameters
                complianceEnabled={roi.settings.complianceEnabled}
                riskLevel={roi.settings.riskLevel}
                riskFrequency={roi.settings.riskFrequency}
                errorCost={roi.settings.errorCost}
                // Revenue Uplift parameters
                revenueEnabled={roi.settings.revenueEnabled}
                monthlyVolume={roi.settings.monthlyVolume}
                conversionRate={roi.settings.conversionRate}
                valuePerConversion={roi.settings.valuePerConversion}
              />
            )}

            {selectedGroup && (
              <GroupPropertiesPanel
                selectedGroup={selectedGroup}
                onClose={() => setSelectedGroupId(null)}
                platform={roi.settings.platform}
                nodes={nodes}
                setNodes={setNodes}
                runsPerMonth={roi.settings.runsPerMonth}
                minutesPerRun={roi.settings.minutesPerRun}
                hourlyRate={roi.settings.hourlyRate}
                taskMultiplier={roi.settings.taskMultiplier}
              />
            )}

            {selectedEmailNode && (
              <EmailNodePropertiesPanel
                selectedNode={selectedEmailNode as Node}
                onClose={() => setSelectedEmailNodeId(null)}
                onUpdateNodeData={(nodeId, data) => {
                  setNodes(nodes => nodes.map(n => 
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                  ));
                }}
                onGenerateSection={handleRegenerateSection}
                onDeleteNode={(nodeId) => {
                  // Remove the email node from the canvas
                  setNodes(nodes => nodes.filter(n => n.id !== nodeId));
                  // Close the panel
                  setSelectedEmailNodeId(null);
                }}
                isGeneratingAIContent={emailGeneration.isGeneratingSection}
                emailContextNodes={nodes
                  .filter(n => ['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(n.type || ''))
                  .map(n => {
                    const nodeData = n.data as Partial<NodeData>;
                    return {
                      id: n.id,
                      type: n.type || '',
                      label: nodeData.label || n.type || '',
                      value: nodeData.contextValue || '',
                    };
                  })}
              />
            )}

            {selectedROINode && (
              <ROINodePropertiesPanel
                selectedNode={selectedROINode as unknown as Node<ROIReportNodeData>}
                onClose={() => setSelectedROINodeId(null)}
                onUpdateNodeData={(nodeId, data) => {
                  setNodes(nodes => nodes.map(n => 
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                  ));
                }}
                onGenerateReport={async () => { /* handled elsewhere */ }}
                onRegenerateSection={async () => { /* handled elsewhere */ }}
                isGenerating={false}
              />
            )}

            {/* ROI Settings Panel */}
            <ROISettingsPanel
              open={isROISettingsOpen}
              onOpenChange={setIsROISettingsOpen}
              platform={roi.settings.platform}
              runsPerMonth={roi.settings.runsPerMonth}
              setRunsPerMonth={roi.setRunsPerMonth}
              minutesPerRun={roi.settings.minutesPerRun}
              setMinutesPerRun={roi.setMinutesPerRun}
              hourlyRate={roi.settings.hourlyRate}
              setHourlyRate={roi.setHourlyRate}
              taskMultiplier={roi.settings.taskMultiplier}
              setTaskMultiplier={roi.setTaskMultiplier}
              taskType={roi.settings.taskType}
              setTaskType={roi.setTaskType}
              complianceEnabled={roi.settings.complianceEnabled}
              setComplianceEnabled={roi.setComplianceEnabled}
              revenueEnabled={roi.settings.revenueEnabled}
              setRevenueEnabled={roi.setRevenueEnabled}
              riskLevel={roi.settings.riskLevel}
              setRiskLevel={roi.setRiskLevel}
              riskFrequency={roi.settings.riskFrequency}
              setRiskFrequency={roi.setRiskFrequency}
              errorCost={roi.settings.errorCost}
              setErrorCost={roi.setErrorCost}
              monthlyVolume={roi.settings.monthlyVolume}
              setMonthlyVolume={roi.setMonthlyVolume}
              conversionRate={roi.settings.conversionRate}
              setConversionRate={roi.setConversionRate}
              valuePerConversion={roi.settings.valuePerConversion}
              setValuePerConversion={roi.setValuePerConversion}
              taskTypeMultipliers={TASK_TYPE_MULTIPLIERS}
              benchmarks={BENCHMARKS}
              updateScenarioROI={(updates) => scenarioManager.updateScenario(updates)}
              nodes={nodes}
              onGenerateReport={async () => {
                try {
                  // Determine placement similar to StatsBar path
                  const ROI_WIDTH = 1024;
                  const ROI_HEIGHT = 1448;
                  const VERTICAL_GAP = 400;

                  const viewport = rfInstance?.getViewport();
                  const zoom = viewport?.zoom || 1;
                  const worldCenterX = ((window.innerWidth / 2) - (viewport?.x || 0)) / zoom;
                  const maxY = nodes.reduce((max, node) => Math.max(max, node.position.y), 0);
                  const position = { x: Math.round(worldCenterX - ROI_WIDTH / 2), y: Math.round(maxY + VERTICAL_GAP) };

                  const node = await generateRoiNodeWithBusinessImpact({
                    currentScenarioName: scenarioManager.scenario?.name,
                    platform: roi.settings.platform,
                    runsPerMonth: roi.settings.runsPerMonth,
                    minutesPerRun: roi.settings.minutesPerRun,
                    hourlyRate: roi.settings.hourlyRate,
                    taskMultiplier: roi.settings.taskMultiplier,
                    taskType: roi.settings.taskType,
                    complianceEnabled: roi.settings.complianceEnabled,
                    riskLevel: roi.settings.riskLevel,
                    riskFrequency: roi.settings.riskFrequency,
                    errorCost: roi.settings.errorCost,
                    revenueEnabled: roi.settings.revenueEnabled,
                    monthlyVolume: roi.settings.monthlyVolume,
                    conversionRate: roi.settings.conversionRate,
                    valuePerConversion: roi.settings.valuePerConversion,
                    nodes,
                  });
                  node.position = position;
                  onNodesChange([{ type: 'add', item: node }]);
                  if (rfInstance) {
                    setTimeout(() => {
                      rfInstance.fitBounds({ x: position.x, y: position.y, width: ROI_WIDTH, height: ROI_HEIGHT }, { padding: 0.02, duration: 800 });
                    }, 100);
                  }
                  setIsROISettingsOpen(false);
                  toast.success('ROI Report generated successfully!');
                } catch (error) {
                  console.error('Error generating ROI report:', error);
                  toast.error('Failed to generate ROI report');
                }
              }}
            />
          </div>
        ) : (
          // Analytics Dashboard
          <div className="flex-1 relative">
            <div className="absolute inset-0 overflow-auto">
              <AnalyticsDashboard
                scenario={scenarioManager.scenario}
                nodes={nodes}
                onNodeClick={(nodeId) => {
                  // Focus on node in canvas when clicked in analytics
                  setActiveTab('canvas');
                  const node = nodes.find(n => n.id === nodeId);
                  if (node && rfInstance) {
                    rfInstance.fitBounds({ 
                      x: node.position.x - 100, 
                      y: node.position.y - 100,
                      width: 300,
                      height: 300
                    });
                  }
                  setSelectedId(nodeId);
                }}
              />
            </div>
          </div>
        )}
      </div>
      </DndContext>
    </ReactFlowProvider>
  );
} 