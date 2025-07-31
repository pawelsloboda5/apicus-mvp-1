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

// Import types
import { NodeType, Scenario, NodeData, PlatformType } from "@/lib/types";

// Import constants
import { TASK_TYPE_MULTIPLIERS, BENCHMARKS, CANVAS_CONFIG } from "@/lib/utils/constants";

// Import utilities
import { transformTemplateNodes, transformTemplateEdges } from "@/lib/flow-utils";
import { formatROIRatio } from "@/lib/roi-utils";

// Import default template
import { DEFAULT_TEMPLATE } from "@/lib/templates/default-template";

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

  // Force light mode
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Canvas state
  const [nodes, setNodes, originalOnNodesChange] = useNodesState<Node>([]);
  
  // Debug wrapper for onNodesChange
  const onNodesChange = useCallback((changes: any) => {
    console.log('🔄 onNodesChange called with changes:', changes);
    originalOnNodesChange(changes);
    console.log('🔄 onNodesChange processed');
  }, [originalOnNodesChange]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEmailNodeId, setSelectedEmailNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');

  // UI state
  const [activeTab, setActiveTab] = useState<'canvas' | 'analytics'>('canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [isROISettingsOpen, setIsROISettingsOpen] = useState(false);
  
  // Scenario editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingName, setEditingName] = useState("");

  // ReactFlow refs
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  
  // Flag to prevent save loops
  const isLoadingScenarioRef = useRef(false);
  const lastSavedNodesRef = useRef<string>("");
  const lastSavedEdgesRef = useRef<string>("");

  // Initialize scenario manager without circular dependency
  const scenarioManager = useScenarioManager({
    initialScenarioId: scenarioIdParam || undefined,
  });

  // Memoize the ROI settings change handler to prevent infinite loops
  const handleROISettingsChange = useCallback((settings: Partial<Scenario>) => {
    if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
      scenarioManager.updateScenario(settings);
    }
  }, [scenarioManager.scenario?.id, scenarioManager.updateScenario]); // Use scenario ID instead of full object

  // Initialize ROI hook
  const roi = useROI({
    initialScenario: scenarioManager.scenario,
    onSettingsChange: handleROISettingsChange,
    nodes,
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
      
      // Update viewport if available
      if (rfInstance && scenario.viewport) {
        rfInstance.setViewport(scenario.viewport as Viewport);
      }
      
      // Delay to ensure state updates are complete
      setTimeout(() => {
        isLoadingScenarioRef.current = false;
      }, 100);
      
    } catch (error) {
      console.error('Failed to load scenario to canvas:', error);
      toast.error('Failed to load scenario');
      isLoadingScenarioRef.current = false;
    }
  }, [setNodes, setEdges, rfInstance]);

  // Load scenario when it changes
  useEffect(() => {
    if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
      console.log('🔄 USEEFFECT TRIGGER: Loading scenario (ID:', scenarioManager.scenario?.id, ')');
      console.log('🔄 USEEFFECT TRIGGER: Nodes in scenario:', scenarioManager.scenario.nodesSnapshot?.length || 0);
      loadScenarioToCanvas(scenarioManager.scenario);
      roi.loadFromScenario(scenarioManager.scenario);
    }
  }, [scenarioManager.scenario?.id, loadScenarioToCanvas, roi.loadFromScenario]); // Only depend on scenario ID, not the full object

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

  // Initialize scenario on mount - memoize the initialization function to prevent infinite loops
  const initializeScenario = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (scenarioIdParam) {
        await scenarioManager.loadScenario(scenarioIdParam);
      } else {
        // Create new scenario
        let name = templateIdParam ? "Loading Template..." : 
                    queryParam ? `Search: ${queryParam}` : 
                    "Untitled Scenario";
        
        let templateData: Parameters<typeof scenarioManager.createScenario>[1] = undefined;
        
        // Use default template if requested
        if (useDefaultTemplate) {
          templateData = {
            nodesSnapshot: DEFAULT_TEMPLATE.nodes,
            edgesSnapshot: DEFAULT_TEMPLATE.edges,
            platform: DEFAULT_TEMPLATE.platform,
            runsPerMonth: DEFAULT_TEMPLATE.runsPerMonth,
            minutesPerRun: DEFAULT_TEMPLATE.minutesPerRun,
            hourlyRate: DEFAULT_TEMPLATE.hourlyRate,
            taskMultiplier: DEFAULT_TEMPLATE.taskMultiplier,
            taskType: DEFAULT_TEMPLATE.taskType,
          };
          name = queryParam ? `${queryParam} - ${DEFAULT_TEMPLATE.name}` : DEFAULT_TEMPLATE.name;
        }
        // Load template data if template ID is provided
        else if (templateIdParam) {
          try {
            const response = await fetch(`/api/templates/${templateIdParam}`);
            if (response.ok) {
              const template = await response.json();
              console.log('Template loaded:', template); // Debug log
              
              // Transform nodes to have 'id' instead of 'reactFlowId'
              const transformedNodes = transformTemplateNodes(template.nodes, templateIdParam);
              
              // Transform edges to have proper 'id', 'source', and 'target'
              const transformedEdges = transformTemplateEdges(template.edges, templateIdParam);
              
              templateData = {
                nodesSnapshot: transformedNodes,
                edgesSnapshot: transformedEdges,
                platform: template.platform || template.source || "zapier",
                viewport: template.viewport,
                // Copy other template metadata
                taskType: template.taskType,
                runsPerMonth: template.runsPerMonth,
                minutesPerRun: template.minutesPerRun,
                hourlyRate: template.hourlyRate,
                taskMultiplier: template.taskMultiplier,
              };
              name = template.title || template.templateName || template.name || "Template Scenario";
              console.log('Template data prepared:', templateData); // Debug log
            } else {
              console.error('Failed to load template:', response.statusText);
              toast.error('Failed to load template');
            }
          } catch (error) {
            console.error('Error loading template:', error);
            toast.error('Error loading template');
          }
        }
        
        const newScenario = await scenarioManager.createScenario(name, templateData);
        
        // Update URL
        const urlQuery = new URLSearchParams(window.location.search);
        urlQuery.set("sid", newScenario.id!.toString());
        if (templateIdParam && !templateData) urlQuery.set("tid", templateIdParam); // Keep tid if template failed to load
        if (queryParam) urlQuery.set("q", queryParam);
        router.replace(`/build?${urlQuery.toString()}`, { scroll: false });
      }
      
    } catch (error) {
      console.error('Failed to initialize scenario:', error);
      toast.error('Failed to initialize scenario');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioIdParam, templateIdParam, queryParam, useDefaultTemplate, scenarioManager.loadScenario, scenarioManager.createScenario, router]);

  // Initialize scenario on mount with stable dependencies
  useEffect(() => {
    initializeScenario();
  }, [initializeScenario]);

  // Save scenario when nodes/edges change
  useEffect(() => {
    if (!scenarioManager.scenario || isLoading || isLoadingScenarioRef.current) {
      return;
    }

    // Filter out temporary nodes that shouldn't be saved to scenario
    const persistentNodes = nodes.filter(node => {
      // Exclude ROI report nodes from being saved to scenario
      // These are temporary visualization nodes that should exist only in the session
      return node.type !== 'roiReport';
    });

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
  }, [nodes, edges, scenarioManager.scenario?.id, scenarioManager, isLoading]); // Minimal deps

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

  const handleStartEdit = useCallback(() => {
    if (scenarioManager.scenario) {
      setIsEditingTitle(true);
      setEditingName(scenarioManager.scenario.name);
    }
  }, [scenarioManager.scenario]);

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
  }, [scenarioManager.scenario?.id, editingName, scenarioManager.loadScenario]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditingName("");
  }, []);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

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
            console.log('📊 BuildPageContent: Received ROI node:', roiNode);
            console.log('📊 BuildPageContent: About to call onNodesChange with add action');
            // Add the ROI report node to the canvas
            onNodesChange([{ type: 'add', item: roiNode }]);
            console.log('📊 BuildPageContent: Called onNodesChange');
          }}
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
                  } else if (node.type === 'emailPreview') {
                    setSelectedEmailNodeId(node.id);
                    setSelectedId(null);
                    setSelectedGroupId(null);
                  } else {
                    setSelectedId(node.id);
                    setSelectedGroupId(null);
                    setSelectedEmailNodeId(null);
                  }
                }}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                selectedNodeType={selectedNodeType}
                onNodeTypeChange={setSelectedNodeType}
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
              onGenerateReport={() => {
                try {
                  console.log('Generate ROI Report clicked');
                  console.log('Current ROI metrics:', roi.metrics);
                  console.log('Current ROI settings:', roi.settings);
                  console.log('Creating ROI Report node...');
                  
                  // Create workflow steps from canvas nodes
                  const workflowSteps = nodes
                    .filter(n => ['trigger', 'action', 'decision'].includes(n.type || ''))
                    .map(node => {
                      const nodeData = node.data as Partial<NodeData>;
                      return {
                        id: node.id,
                        label: nodeData.label || node.type || 'Step',
                        platform: nodeData.appName || roi.settings.platform,
                        description: nodeData.action || nodeData.typeOf || ''
                      };
                    });
                  
                  // Find the optimal position for ROI report to avoid overlap
                  const getOptimalROIPosition = () => {
                    if (!rfInstance?.getViewport()) {
                      return { x: 400, y: 700 };
                    }
                    
                    const viewport = rfInstance.getViewport();
                    const zoom = viewport.zoom || 1;
                    
                    // Find the lowest Y position among existing nodes
                    const maxY = nodes.reduce((max, node) => {
                      return Math.max(max, node.position.y);
                    }, 0);
                    
                    // Place ROI report 300px below the lowest node, or at minimum 600px from top
                    const optimalY = Math.max(maxY + 300, 600);
                    
                    return {
                      x: (window.innerWidth / 2 - 400) / zoom, // Centered horizontally, accounting for ROI report width
                      y: optimalY / zoom
                    };
                  };

                  const center = getOptimalROIPosition();
                
                const newROINode: Node = {
                  id: `roi-${Date.now()}`,
                  type: 'roiReport',
                  position: center,
                  data: {
                    nodeTitle: 'ROI Analysis Report',
                    reportTitle: 'Automation ROI Analysis',
                    projectName: scenarioManager.scenario?.name || 'Automation Project',
                    clientName: 'Your Client',
                    generatedDate: new Date(),
                    platform: roi.settings.platform,
                    runsPerMonth: roi.settings.runsPerMonth,
                    minutesPerRun: roi.settings.minutesPerRun,
                    hourlyRate: roi.settings.hourlyRate,
                    taskMultiplier: roi.settings.taskMultiplier,
                    // Workflow steps
                    workflowSteps,
                    // ROI metrics
                    netROI: roi.metrics.netROI,
                    roiRatio: roi.metrics.roiRatio,
                    paybackPeriod: roi.metrics.paybackDays, // Pass the numeric value, not the formatted string
                    timeValue: roi.metrics.timeValue,
                    platformCost: roi.metrics.platformCost,
                    // Additional settings for advanced calculations
                    riskValue: roi.metrics.riskValue || 0,
                    revenueValue: roi.metrics.revenueValue || 0,
                    complianceEnabled: roi.settings.complianceEnabled,
                    riskLevel: roi.settings.riskLevel,
                    riskFrequency: roi.settings.riskFrequency,
                    errorCost: roi.settings.errorCost,
                    revenueEnabled: roi.settings.revenueEnabled,
                    monthlyVolume: roi.settings.monthlyVolume,
                    conversionRate: roi.settings.conversionRate,
                    valuePerConversion: roi.settings.valuePerConversion,
                    // Visual options
                    colorScheme: roi.settings.platform,
                    showPlatformComparison: true,
                    showRevenueBreakdown: true,
                    // Business impact (will be generated)
                    businessImpact: `This automation will save ${roi.metrics.timeSavedHours.toFixed(1)} hours per month, resulting in ${formatROIRatio(roi.metrics.roiRatio)} return on investment.`,
                    keyBenefits: [
                      `Saves ${roi.metrics.timeSavedHours.toFixed(1)} hours of manual work monthly`,
                      `Delivers ${formatROIRatio(roi.metrics.roiRatio)} ROI with ${roi.metrics.paybackPeriod} payback`,
                      `Reduces operational costs by automating ${roi.settings.runsPerMonth} tasks`,
                    ],
                  },
                };
                
                console.log('Creating new ROI node:', newROINode);
                
                // Add the node to the canvas
                onNodesChange([{ type: 'add', item: newROINode }]);
                
                // Center the camera on the newly created ROI report
                if (rfInstance) {
                  setTimeout(() => {
                    rfInstance.fitBounds({
                      x: center.x - 100,
                      y: center.y - 100,
                      width: 1000, // ROI report width (800px) + padding
                      height: 1000, // ROI report height (~800-900px) + padding
                    }, { padding: 0.1, duration: 800 });
                  }, 100); // Small delay to ensure node is rendered
                }
                
                // Close the ROI settings panel
                setIsROISettingsOpen(false);
                
                // Show success message
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
        )}
      </div>
    </ReactFlowProvider>
  );
} 