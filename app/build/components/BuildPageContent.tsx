"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { NodeType, Scenario } from "@/lib/types";

// Import constants
import { TASK_TYPE_MULTIPLIERS, BENCHMARKS } from "@/lib/utils/constants";

// Import utilities
import { transformTemplateNodes, transformTemplateEdges } from "@/lib/flow-utils";

// Import default template
import { DEFAULT_TEMPLATE } from "@/lib/templates/default-template";

// Import components
import { StatsBar } from "@/components/flow/StatsBar";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { EmailPreviewNode } from "@/components/flow/EmailPreviewNode";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PixelNode } from "@/components/flow/PixelNode";
import { NodePropertiesPanel } from "@/components/flow/panels/NodePropertiesPanel";
import { GroupPropertiesPanel } from "@/components/flow/GroupPropertiesPanel";
import { EmailNodePropertiesPanel } from "@/components/flow/panels/EmailNodePropertiesPanel";
import { ROISettingsPanel } from "@/components/roi/ROISettingsPanel";

// Dynamic imports for performance
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

// Node and edge types
const nodeTypes = {
  trigger: PixelNode,
  action: PixelNode,
  decision: PixelNode,
  group: NodeGroup,
  emailPreview: EmailPreviewNode,
  persona: PixelNode,
  industry: PixelNode,
  painpoint: PixelNode,
  metric: PixelNode,
  urgency: PixelNode,
  socialproof: PixelNode,
  objection: PixelNode,
  value: PixelNode,
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

interface NodeData {
  label?: string;
  typeOf?: string;
  contextValue?: string;
}

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEmailNodeId, setSelectedEmailNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');

  // UI state
  const [activeTab, setActiveTab] = useState<'canvas' | 'analytics'>('canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [isROISettingsOpen, setIsROISettingsOpen] = useState(false);

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

  // Initialize ROI hook
  const roi = useROI({
    initialScenario: scenarioManager.scenario,
    onSettingsChange: (settings) => {
      if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
        scenarioManager.updateScenario(settings);
      }
    },
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
          position: { x: 250, y: 200 },
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
      console.log('Loading scenario:', scenarioManager.scenario);
      console.log('Nodes in scenario:', scenarioManager.scenario.nodesSnapshot);
      loadScenarioToCanvas(scenarioManager.scenario);
      roi.loadFromScenario(scenarioManager.scenario);
    }
  }, [scenarioManager.scenario?.id, scenarioManager.scenario, loadScenarioToCanvas, roi]);

  // Initialize email generation hook
  const emailGeneration = useEmailGeneration({
    onEmailGenerated: (email) => {
      // Create or update email preview node
      const emailNode: Node = {
        id: `email-${Date.now()}`,
        type: 'emailPreview',
        position: { x: 400, y: 200 },
        data: {
          ...email,
          nodeTitle: 'Generated Email',
          stats: {
            roiX: roi.metrics.roiRatio,
            payback: roi.metrics.paybackPeriod,
            runs: roi.settings.runsPerMonth,
          },
        },
      };
      
      onNodesChange([{ type: 'add', item: emailNode }]);
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

  // Get selected node
  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const selectedGroup = selectedGroupId ? nodes.find(n => n.id === selectedGroupId) : null;
  const selectedEmailNode = selectedEmailNodeId ? nodes.find(n => n.id === selectedEmailNodeId) : null;

  // Initialize scenario on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeScenario = async () => {
      if (!mounted) return;
      
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
          if (mounted) {
            const urlQuery = new URLSearchParams(window.location.search);
            urlQuery.set("sid", newScenario.id!.toString());
            if (templateIdParam && !templateData) urlQuery.set("tid", templateIdParam); // Keep tid if template failed to load
            if (queryParam) urlQuery.set("q", queryParam);
            router.replace(`/build?${urlQuery.toString()}`, { scroll: false });
          }
        }
        
      } catch (error) {
        console.error('Failed to initialize scenario:', error);
        toast.error('Failed to initialize scenario');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeScenario();
    
    return () => {
      mounted = false;
    };
  }, [scenarioIdParam, templateIdParam, queryParam, useDefaultTemplate, scenarioManager, router]); // Only run once on mount

  // Save scenario when nodes/edges change
  useEffect(() => {
    if (!scenarioManager.scenario || isLoading || isLoadingScenarioRef.current) {
      return;
    }

    // Check if nodes/edges actually changed
    const currentNodesStr = JSON.stringify(nodes);
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
        nodesSnapshot: nodes,
        edgesSnapshot: edges,
      });
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [nodes, edges, scenarioManager.scenario?.id, scenarioManager, isLoading]); // Minimal deps

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
      <div className="h-screen w-full flex flex-col" data-page="build">
        {/* Header */}
        <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {scenarioManager.scenario?.name || "Untitled Scenario"}
            </h1>
            
            {scenarioManager.isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1 rounded ${
                activeTab === 'canvas' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Canvas
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded ${
                activeTab === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'canvas' ? (
          <div className="flex-1 flex">
            {/* Toolbox */}
            <Toolbox 
              onLoadScenario={(id) => scenarioManager.loadScenario(id.toString())}
              activeScenarioId={scenarioManager.scenario?.id as number | null}
              emailNodes={nodes.filter(n => n.type === 'emailPreview').map(n => ({
                id: n.id,
                title: (n.data as EmailNodeData).nodeTitle || 'Email'
              }))}
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

            {/* Main Canvas Area */}
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
                handleRegenerateSection={handleRegenerateSectionSimple}
              />

              {/* Stats Bar */}
              <StatsBar
                platform={roi.settings.platform}
                runsPerMonth={roi.settings.runsPerMonth}
                minutesPerRun={roi.settings.minutesPerRun}
                hourlyRate={roi.settings.hourlyRate}
                taskMultiplier={roi.settings.taskMultiplier}
                onUpdateRuns={roi.setRunsPerMonth}
                onUpdateMinutes={roi.setMinutesPerRun}
                nodes={nodes}
                onPlatformChange={roi.setPlatform}
                onOpenROISettings={() => setIsROISettingsOpen(true)}
                onAddNode={() => {
                  // Add a new node at the center of the viewport
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
                  // Collect context from email context nodes
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
              />
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
                isGeneratingAIContent={emailGeneration.isGeneratingSection}
                emailContextNodes={nodes
                  .filter(n => ['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value'].includes(n.type || ''))
                  .map(n => ({
                    id: n.id,
                    type: n.type || '',
                    label: (n.data as NodeData).label || n.type || '',
                    value: (n.data as NodeData).contextValue || '',
                  }))}
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