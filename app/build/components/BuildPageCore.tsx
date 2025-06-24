"use client";

/**
 * BuildPageCore - INCOMPLETE REFACTORING
 * 
 * This component is an incomplete attempt to refactor the main build/page.tsx
 * into a more manageable size using React 19 patterns.
 * 
 * TODO: 
 * - Implement all missing handlers (drag/drop, node manipulation, etc.)
 * - Connect alternative templates to UI
 * - Implement ROI calculations and updates
 * - Add email generation functionality
 * - Complete the FlowCanvas integration
 * 
 * For now, the main build/page.tsx is still the production version.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, use, lazy } from "react";
import { useRouter } from "next/navigation";
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
import { db, createScenario, type Scenario } from "@/lib/db";
import { PixelNode } from "@/components/flow/PixelNode";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragStartEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useDroppable } from "@dnd-kit/core";
import { useTheme } from "next-themes";

// Import custom components with Suspense
import { StatsBar } from "@/components/flow/StatsBar";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SuspenseWrapper, DataSuspenseWrapper } from "@/components/ui/suspense-wrapper";

// Utility imports
import { snapToGrid } from "@/lib/flow-utils";
import {
  calculateNodeTimeSavings,
} from "@/lib/roi-utils";
import { PlatformType as LibPlatformType, NodeType, NodeData } from "@/lib/types";
import { captureROISnapshot, shouldCaptureSnapshot } from "@/lib/metrics-utils";
import { cacheTemplatePricingInScenario } from "@/lib/template-pricing-utils";

// Lazy load heavy components with React 19 optimizations
const Toolbox = lazy(() => import("@/components/flow/Toolbox").then(mod => ({ default: mod.Toolbox })));

// Define nodeTypes and edgeTypes outside component for stability
const nodeTypes = {
  trigger: PixelNode,
  action: PixelNode,
  decision: PixelNode,
  group: NodeGroup,
  emailPreview: PixelNode,
  // Email context nodes
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

interface BuildPageCoreProps {
  scenarioIdParam: string | null;
  templateIdParam: string | null;
  queryParam: string | null;
}

// Separate component for scenario management to reduce main component size
function ScenarioLoader({ 
  scenarioIdParam, 
  templateIdParam, 
  queryParam,
  onScenarioLoaded,
  scenarioCreatedRef,
  alternativesFetchedRef,
}: BuildPageCoreProps & {
  onScenarioLoaded: (scenario: Scenario | null, alternatives: Scenario[]) => void;
  scenarioCreatedRef: React.MutableRefObject<boolean>;
  alternativesFetchedRef: React.MutableRefObject<string | null>;
}) {
  const router = useRouter();

  // Create a resource for scenario loading using React 19 patterns
  const scenarioResource = useMemo(() => {
    return (async () => {
      // Check if we're on the client side before accessing IndexedDB
      if (typeof window === 'undefined') {
        return { scenario: null, alternatives: [] as Scenario[] };
      }

      if (!scenarioIdParam && !templateIdParam && !queryParam && !scenarioCreatedRef.current) {
        const id = await createScenario("Untitled Scenario");
        scenarioCreatedRef.current = true;
        const scenario = await db.scenarios.get(id);
        return { scenario: scenario || null, alternatives: [] as Scenario[] };
      }
      let activeScenarioIdToLoad: number | null = scenarioIdParam ? Number(scenarioIdParam) : null;
      let scenarioToLoad: Scenario | undefined;
      let alternativesData: Scenario[] = [];

      if (activeScenarioIdToLoad) {
        scenarioToLoad = await db.scenarios.get(activeScenarioIdToLoad);
      }

      if (!scenarioToLoad) {
        const newName = templateIdParam ? "Loading Template..." : (queryParam ? `Search: ${queryParam}` : "Untitled Scenario");
        const newId = await createScenario(newName);
        activeScenarioIdToLoad = newId;
        scenarioToLoad = await db.scenarios.get(newId);

        const urlQuery = new URLSearchParams(window.location.search);
        urlQuery.set("sid", String(newId));
        if (templateIdParam) urlQuery.set("tid", templateIdParam);
        if (queryParam) urlQuery.set("q", queryParam);
        router.replace(`/build?${urlQuery.toString()}`, { scroll: false });
      }

      // Handle template loading
      if (templateIdParam && scenarioToLoad && activeScenarioIdToLoad && 
          (!scenarioToLoad.nodesSnapshot || scenarioToLoad.nodesSnapshot.length === 0)) {
        try {
          const res = await fetch(`/api/templates/${templateIdParam}`);
          if (res.ok) {
            const templateData = await res.json();
            if (templateData?.nodes && templateData?.edges && activeScenarioIdToLoad) {
              interface TemplateNode {
                reactFlowId: string;
                type: string;
                position: { x: number; y: number };
                data: Record<string, unknown>;
              }
              
              interface TemplateEdge {
                reactFlowId: string;
                label?: string;
                data?: { source: string; target: string };
              }
              
              const updatedScenarioData: Partial<Scenario> = {
                name: templateData.title || scenarioToLoad.name,
                nodesSnapshot: (templateData.nodes as TemplateNode[]).map((n) => ({
                  id: n.reactFlowId, type: n.type, position: n.position, data: n.data,
                })),
                edgesSnapshot: (templateData.edges as TemplateEdge[]).map((e) => ({
                  id: e.reactFlowId, source: e.data?.source, target: e.data?.target, 
                  label: e.label, data: e.data, type: 'custom',
                })),
                platform: (templateData.platform || templateData.source || scenarioToLoad.platform) as LibPlatformType,
                originalTemplateId: templateIdParam,
                searchQuery: queryParam || scenarioToLoad.searchQuery,
                updatedAt: Date.now(),
              };
              await db.scenarios.update(activeScenarioIdToLoad, updatedScenarioData);
              scenarioToLoad = { ...scenarioToLoad, ...updatedScenarioData } as Scenario;
              
              if (templateIdParam) {
                cacheTemplatePricingInScenario(activeScenarioIdToLoad, templateIdParam);
              }
            }
          }
        } catch (error) {
          console.error("Error loading template:", error);
        }
      }

      // Handle alternative templates
      if (queryParam && activeScenarioIdToLoad && scenarioToLoad) {
        try {
          if (alternativesFetchedRef.current === queryParam) {
            // already fetched
          } else {
            const res = await fetch(`/api/templates/search?q=${encodeURIComponent(queryParam)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.templates && Array.isArray(data.templates)) {
                interface AlternativeTemplate {
                  templateId: string;
                  title?: string;
                  platform?: string;
                  source?: string;
                  nodes?: Array<{ reactFlowId?: string; id?: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> }>;
                  edges?: Array<{ reactFlowId?: string; id?: string; source?: string; target?: string; label?: string; data?: Record<string, unknown> }>;
                }
                
                const primaryTemplateIdToExclude = scenarioToLoad.originalTemplateId;
                alternativesData = (data.templates as AlternativeTemplate[])
                  .filter((t) => t.templateId !== primaryTemplateIdToExclude)
                  .slice(0, 5)
                  .map((t) => ({
                    slug: nanoid(8),
                    name: t.title || "Alternative",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    platform: (t.platform || t.source || "zapier") as LibPlatformType,
                    nodesSnapshot: t.nodes?.map((n) => ({ 
                      id: n.reactFlowId || n.id, type: n.type, position: n.position, data: n.data 
                    })) || [],
                    edgesSnapshot: t.edges?.map((e) => ({ 
                      id: e.reactFlowId || e.id, source: e.data?.source || e.source, 
                      target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom' 
                    })) || [],
                    originalTemplateId: t.templateId,
                    searchQuery: queryParam || "",
                    runsPerMonth: 250, minutesPerRun: 3, hourlyRate: 30, taskMultiplier: 1.5, 
                    taskType: "general", complianceEnabled: false, revenueEnabled: false, 
                    riskLevel: 3, riskFrequency: 5, errorCost: 500, monthlyVolume: 100, 
                    conversionRate: 5, valuePerConversion: 200,
                  }));
                alternativesFetchedRef.current = queryParam;
              }
            }
          }
        } catch (error) {
          console.error("Error loading alternatives:", error);
        }
      }

      return { scenario: scenarioToLoad || null, alternatives: alternativesData };
    })();
  }, [scenarioIdParam, templateIdParam, queryParam, router, scenarioCreatedRef, alternativesFetchedRef]);

  // Use React 19's use hook with Suspense
  const { scenario, alternatives } = use(scenarioResource);

  useEffect(() => {
    onScenarioLoaded(scenario, alternatives);
  }, [scenario, alternatives, onScenarioLoaded]);

  return null; // This component only handles data loading
}

export function BuildPageCore({ scenarioIdParam, templateIdParam, queryParam }: BuildPageCoreProps) {
  const { setTheme } = useTheme();
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [, setAlternativeTemplates] = useState<Scenario[]>([]);
  const [platform, setPlatform] = useState<LibPlatformType>("zapier");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, unknown>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<Record<string, unknown>>>([]);
  const [, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ReactFlow instance & wrapper ref
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ 
    id: "canvas",
    data: {
      accepts: ['tool-trigger', 'tool-action', 'tool-decision']
    }
  });

  // Add drag-and-drop handlers migrated from BuildPageContent
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const nodeType = active.data.current?.nodeType as NodeType | undefined;
    if (nodeType) {
      setActiveDragItem({ id: String(active.id), type: nodeType });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      // Clear the active drag item no matter what
      setActiveDragItem(null);
      // Accept drop only if it landed on the canvas (or failed collision but pointer within canvas)
      if (over && over.id !== 'canvas') return;
      const nodeType = active.data.current?.nodeType as NodeType | undefined;
      const isEmailContext = active.data.current?.isEmailContext as boolean;
      const contextValue = active.data.current?.contextValue as string | undefined;
      const category = active.data.current?.category as string | undefined;
      if (!nodeType || !reactFlowWrapper.current || !rfInstance) return;

      setIsManipulatingNodesProgrammatically(true);

      // Calculate drop position relative to current RF viewport
      const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
      const rect = active.rect.current.translated ?? active.rect.current.initial;
      if (!rect) {
        setIsManipulatingNodesProgrammatically(false);
        return;
      }
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const viewport = rfInstance.getViewport();
      const pos = {
        x: (centerX - wrapperRect.left - viewport.x) / viewport.zoom,
        y: (centerY - wrapperRect.top - viewport.y) / viewport.zoom,
      };
      const snapped = snapToGrid(pos.x, pos.y);
      const newId = nanoid(6);
      const newNode = {
        id: newId,
        type: nodeType,
        position: snapped,
        data: isEmailContext ? {
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
          isEmailContext: true,
          contextType: nodeType,
          contextValue: contextValue || '',
          category: category || '',
        } : {
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodes.filter(n => n.type === nodeType).length + 1}`,
          ...(nodeType === 'trigger' && { typeOf: 'webhook' }),
          ...(nodeType === 'action' && { appName: 'New Action', action: 'configure', typeOf: 'data_processing' }),
          ...(nodeType === 'decision' && { conditionType: 'value', operator: 'equals' }),
        },
      } as Node<Record<string, unknown>>;

      setNodes(prev => {
        const updated = [...prev, newNode];
        if (currentScenario?.id && typeof window !== 'undefined') {
          const updatedScenario = { ...currentScenario, nodesSnapshot: updated, updatedAt: Date.now() } as Scenario;
          setCurrentScenario(updatedScenario);
          db.scenarios.update(currentScenario.id!, { nodesSnapshot: updated, updatedAt: Date.now() }).catch(console.error);
        }
        return updated;
      });

      // Clear manipulation flag slightly later to avoid save race
      setTimeout(() => setIsManipulatingNodesProgrammatically(false), 500);
    },
    [currentScenario, nodes, reactFlowWrapper, rfInstance, setNodes]
  );

  // ROI state
  const [runsPerMonth, setRunsPerMonth] = useState(250);
  const [minutesPerRun, setMinutesPerRun] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [taskMultiplier, setTaskMultiplier] = useState(1.5);
  
  // UI state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiSelectionActive, setIsMultiSelectionActive] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [, setSelectedEmailNodeId] = useState<string | null>(null);
  const [isManipulatingNodesProgrammatically, setIsManipulatingNodesProgrammatically] = useState(false);
  const [isGeneratingEmail] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');
  const [activeTab, setActiveTab] = useState<'canvas' | 'analytics'>('canvas');
  const [, setRoiOpen] = useState(false);
  const [, setActiveDragItem] = useState<{ id: string; type: string } | null>(null);

  // Canvas state autosave with debounce + ROI snapshot
  const [previousScenario, setPreviousScenario] = useState<Scenario | null>(null);
  const [previousNodeCount, setPreviousNodeCount] = useState(0);

  // after existing other useState declarations
  const scenarioCreatedRef = useRef(false);
  const alternativesFetchedRef = useRef<string | null>(null);

  // helper to load scenario data into local state
  const loadScenarioDataToState = useCallback((scenario: Scenario | null) => {
    if (!scenario) {
      setNodes([]);
      setEdges([]);
      return;
    }
    setPlatform(scenario.platform || 'zapier');
    setRunsPerMonth(scenario.runsPerMonth || 250);
    setMinutesPerRun(scenario.minutesPerRun || 3);
    setHourlyRate(scenario.hourlyRate || 30);
    setTaskMultiplier(scenario.taskMultiplier || 1.5);
    setNodes(scenario.nodesSnapshot as Node[] || []);
    setEdges(scenario.edgesSnapshot as Edge[] || []);
    if (rfInstance) {
      if (scenario.viewport) {
        rfInstance.setViewport(scenario.viewport as Viewport);
      } else {
        rfInstance.setViewport({ x:0, y:0, zoom:1 });
      }
    }
  }, [rfInstance, setNodes, setEdges]);

  // Force light mode when entering the canvas
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Handle scenario loading completion
  const handleScenarioLoaded = useCallback((scenario: Scenario | null | undefined, alternatives: Scenario[]) => {
    if (scenario) {
      setCurrentScenario(scenario);
      setScenarioId(scenario.id || null);
      setAlternativeTemplates(alternatives);
      setIsLoading(false);
    }
  }, []);

  // Add a function to handle node selection with multi-select
  const handleNodeClick = useCallback((evt: React.MouseEvent, node: Node) => {
    if (node.type === 'group') {
      setSelectedGroupId(node.id);
      setSelectedId(null);
      setSelectedEmailNodeId(null);
      return;
    }
    if (node.type === 'emailPreview') {
      setSelectedEmailNodeId(node.id);
      setSelectedId(null);
      setSelectedGroupId(null);
      setIsMultiSelectionActive(false);
      return;
    }
    if (evt.shiftKey) {
      setIsMultiSelectionActive(true);
      setSelectedIds(ids => ids.includes(node.id) ? ids.filter(id => id !== node.id) : [...ids, node.id]);
    } else {
      setSelectedId(node.id);
      setSelectedGroupId(null);
      setSelectedEmailNodeId(null);
      setSelectedIds([]);
      setIsMultiSelectionActive(false);
    }
  }, []);

  // Function to create a group from selected nodes
  const createGroupFromSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const selectedNodesData: Record<string, { minuteContribution: number; [k:string]: unknown }> = {};
    selectedIds.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const { x, y } = node.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 150);
      maxY = Math.max(maxY, y + 40);
      const nodeType = node.type as NodeType;
      const operationType = (node.data as unknown as NodeData)?.typeOf;
      const nodeMinutes = calculateNodeTimeSavings(
        nodeType,
        minutesPerRun,
        nodes,
        {
          trigger: 0.5,
          action: 1.2,
          decision: 0.8,
          group: 0,
          persona:0,industry:0,painpoint:0,metric:0,urgency:0,socialproof:0,objection:0,value:0,
        },
        operationType
      );
      selectedNodesData[id] = { minuteContribution: nodeMinutes, ...(node.data as object) };
    });
    // Padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    const groupId = `group-${nanoid(6)}`;
    const groupNode = {
      id: groupId,
      type: 'group',
      position: { x: minX, y: minY },
      data: {
        label: `Group ${nodes.filter(n => n.type === 'group').length + 1}`,
        nodes: selectedIds,
        nodeMap: selectedNodesData,
        width: maxX - minX,
        height: maxY - minY,
        runsPerMonth,
        minutesPerRun,
        hourlyRate,
        taskMultiplier,
        platform,
        isLocked: false,
        nodeCount: selectedIds.length,
      },
      selectable: true,
      connectable: false,
    } as Node<Record<string, unknown>>;
    setNodes(ns => [...ns, groupNode]);
    setSelectedIds([]);
    setIsMultiSelectionActive(false);
    setSelectedGroupId(groupId);
    setSelectedId(null);
  }, [selectedIds, nodes, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, platform, setNodes]);

  // Function to ungroup
  const ungroupSelection = useCallback(() => {
    if (!selectedGroupId) return;
    setNodes(ns => ns.filter(n => n.id !== selectedGroupId));
    setSelectedGroupId(null);
  }, [selectedGroupId, setNodes]);

  // handler to persist viewport
  const handleMoveEnd = useCallback((_evt: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    if (!currentScenario?.id || typeof window === 'undefined') return;
    if (JSON.stringify(currentScenario.viewport) === JSON.stringify(viewport)) return;
    const updated = { viewport, updatedAt: Date.now() } as Partial<Scenario>;
    setCurrentScenario(prev => prev ? { ...prev, ...updated } : null);
    db.scenarios.update(currentScenario.id!, updated).catch(console.error);
  }, [currentScenario]);

  // Effect: when scenario or rfInstance ready, load data once
  useEffect(() => {
    if (currentScenario && rfInstance && nodes.length === 0 && edges.length === 0) {
      loadScenarioDataToState(currentScenario);
    }
  }, [currentScenario, rfInstance, nodes.length, edges.length, loadScenarioDataToState]);

  // Canvas autosave
  useEffect(() => {
    if (!currentScenario?.id || !rfInstance || typeof window === 'undefined') return;
    if (isLoading) return;
    if (isManipulatingNodesProgrammatically) return;

    const to = setTimeout(() => {
      if (isManipulatingNodesProgrammatically) return;
      const flowObj = rfInstance.toObject();
      const cleanedNodes = flowObj.nodes.map(n => {
        return n;
      });
      const nodesChanged = JSON.stringify(cleanedNodes) !== JSON.stringify(currentScenario.nodesSnapshot || []);
      const edgesChanged = JSON.stringify(flowObj.edges) !== JSON.stringify(currentScenario.edgesSnapshot || []);
      const viewportChanged = JSON.stringify(flowObj.viewport) !== JSON.stringify(currentScenario.viewport);
      if (!nodesChanged && !edgesChanged && !viewportChanged) return;

      const update: Partial<Scenario> = {
        nodesSnapshot: cleanedNodes,
        edgesSnapshot: flowObj.edges,
        viewport: flowObj.viewport,
        updatedAt: Date.now(),
      };
      setCurrentScenario(prev => {
        setPreviousScenario(prev);
        return prev ? { ...prev, ...update } : null;
      });
      setPreviousNodeCount(cleanedNodes.length);
      db.scenarios.update(currentScenario.id!, update).catch(console.error);
      if (shouldCaptureSnapshot(previousScenario, currentScenario, previousNodeCount, cleanedNodes.length)) {
        captureROISnapshot({ ...currentScenario, ...update } as Scenario, cleanedNodes, 'save').catch(console.error);
      }
    }, 300);
    return () => clearTimeout(to);
  }, [nodes, edges, rfInstance, currentScenario, isLoading, isManipulatingNodesProgrammatically, previousScenario, previousNodeCount]);

  return (
    <ReactFlowProvider>
      <DndContext
        sensors={sensors}
        modifiers={[createSnapModifier(8)]}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-screen w-full flex-col overflow-hidden" data-page="build">
          {/* Data loading with Suspense */}
          <DataSuspenseWrapper skeleton="canvas">
            <ScenarioLoader
              scenarioIdParam={scenarioIdParam}
              templateIdParam={templateIdParam}
              queryParam={queryParam}
              onScenarioLoaded={handleScenarioLoaded}
              scenarioCreatedRef={scenarioCreatedRef}
              alternativesFetchedRef={alternativesFetchedRef}
            />
          </DataSuspenseWrapper>

          {isLoading ? (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-4 text-lg">Loading your automation canvas...</p>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <StatsBar 
                platform={platform}
                runsPerMonth={runsPerMonth}
                minutesPerRun={minutesPerRun}
                hourlyRate={hourlyRate}
                taskMultiplier={taskMultiplier}
                nodes={nodes}
                currentScenario={currentScenario}
                onPlatformChange={setPlatform}
                onOpenROISettings={() => setRoiOpen(true)}
                onUpdateRuns={setRunsPerMonth}
                onUpdateMinutes={setMinutesPerRun}
                onAddNode={() => {
                  // TODO: Implement add node functionality
                  console.log('Add node clicked');
                }}
                onGenerateEmail={() => {
                  // TODO: Implement generate email functionality
                  console.log('Generate email clicked');
                }}
                isGeneratingEmail={isGeneratingEmail}
                onCreateGroup={createGroupFromSelection}
                onUngroup={ungroupSelection}
                selectedIds={selectedIds}
                selectedGroupId={selectedGroupId}
                isMultiSelectionActive={isMultiSelectionActive}
              />

              {/* Main content with lazy loading */}
              <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
                <SuspenseWrapper skeleton="panel" className="hidden lg:block">
                  <Toolbox 
                    activeScenarioId={scenarioId}
                    emailNodes={[]}
                    onFocusNode={() => {}}
                    selectedNodeType={selectedNodeType}
                    onNodeTypeSelect={setSelectedNodeType}
                    activeTab={activeTab}
                    onActiveTabChange={setActiveTab}
                  />
                </SuspenseWrapper>
                
                <div className="flex-1 relative overflow-hidden" style={{ height: '100%', width: '100%' }}>
                  {activeTab === 'canvas' ? (
                    <DataSuspenseWrapper skeleton="canvas" className="absolute inset-0">
                      <FlowCanvas
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        currentScenarioName={currentScenario?.name}
                        selectedNodeType={selectedNodeType}
                        onNodeTypeChange={setSelectedNodeType}
                        defaultViewport={currentScenario?.viewport as Viewport | undefined}
                        onMoveEnd={handleMoveEnd}
                        onInit={(inst) => setRfInstance(inst as ReactFlowInstance)}
                        setWrapperRef={(n) => { reactFlowWrapper.current = n; }}
                        setDroppableRef={setDroppableRef}
                        isOver={isOver}
                      />
                    </DataSuspenseWrapper>
                  ) : (
                    <DataSuspenseWrapper skeleton="card" className="absolute inset-0 overflow-auto">
                      <AnalyticsDashboard scenario={currentScenario} nodes={nodes} />
                    </DataSuspenseWrapper>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DndContext>
    </ReactFlowProvider>
  );
} 