"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Viewport,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { db, createScenario } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PixelNode } from "@/components/flow/PixelNode";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import { pointerWithin } from "@dnd-kit/core";
import dynamic from "next/dynamic";
import { pricing } from "../api/data/pricing";
import { Gamepad2, Sword, Coins, HelpCircle, Calculator } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Scenario } from "@/lib/db";
import { nanoid } from "nanoid";
import { useDroppable } from "@dnd-kit/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Import custom components
import { StatsBar } from "@/components/flow/StatsBar";
import { PlatformSwitcher } from "@/components/flow/PlatformSwitcher";
import { NodePropertiesPanel } from "@/components/flow/NodePropertiesPanel";
import { ROISettingsPanel } from "@/components/roi/ROISettingsPanel";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { GroupPropertiesPanel } from "@/components/flow/GroupPropertiesPanel";

// Import utility functions
import { handleAddNode, snapToGrid } from "@/lib/flow-utils";
import { calculateNodeTimeSavings, calculateGroupROI } from "@/lib/roi-utils";
import { NodeType } from "@/lib/types";

const PLATFORMS = ["zapier", "make", "n8n"] as const;

// Disable SSR for Toolbox because dnd-kit generates ids non-deterministically, which causes hydration mismatch warnings.
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

export default function BuildPage() {
  const router = useRouter();
  const params = useSearchParams();
  const scenarioIdParam = params.get("sid");
  const templateIdParam = params.get("tid");
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [platform, setPlatform] = useState<"zapier" | "make" | "n8n">("zapier");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<any>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<any>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialViewport, setInitialViewport] = useState<Viewport | undefined>(undefined);

  // ReactFlow instance & wrapper ref
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // droppable for canvas
  const { setNodeRef: setDroppableRef } = useDroppable({ id: "canvas" });

  // ROI input state (default values will be overwritten by Dexie load)
  const [runsPerMonth, setRunsPerMonth] = useState(1000);
  const [minutesPerRun, setMinutesPerRun] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [taskMultiplier, setTaskMultiplier] = useState(1.5);
  const [taskType, setTaskType] = useState<string>("general");
  const [complianceEnabled, setComplianceEnabled] = useState(false);
  const [revenueEnabled, setRevenueEnabled] = useState(false);
  
  // Risk/Compliance factors
  const [riskLevel, setRiskLevel] = useState(3);
  const [riskFrequency, setRiskFrequency] = useState(5);
  const [errorCost, setErrorCost] = useState(500);

  // Revenue uplift factors
  const [monthlyVolume, setMonthlyVolume] = useState(100);
  const [conversionRate, setConversionRate] = useState(5);
  const [valuePerConversion, setValuePerConversion] = useState(200);

  // Task type multiplier mappings
  const taskTypeMultipliers = {
    general: 1.5,
    admin: 1.3,
    customer_support: 1.7,
    sales: 2.0,
    marketing: 1.8,
    compliance: 2.2,
    operations: 1.6,
    finance: 1.9,
    lead_gen: 2.1,
  };

  // Industry benchmarks
  const benchmarks = {
    runs: {
      low: 100,
      medium: 1000,
      high: 5000,
    },
    minutes: {
      admin: 4,
      customer_support: 8,
      sales: 10,
      marketing: 15,
      compliance: 12,
      operations: 7,
      finance: 9,
      lead_gen: 6,
      general: 5,
    },
    hourlyRate: {
      admin: 25,
      customer_support: 30,
      sales: 45,
      marketing: 40,
      compliance: 50,
      operations: 35,
      finance: 55,
      lead_gen: 40,
      general: 30,
    }
  };

  const updateScenarioROI = useCallback(
    (partial: Partial<Scenario>) => {
      if (!scenarioId) return;
      db.scenarios.update(scenarioId, { updatedAt: Date.now(), ...partial });
    },
    [scenarioId]
  );

  const nodeTypes = {
    trigger: PixelNode,
    action: PixelNode,
    decision: PixelNode,
    group: NodeGroup,
  };

  // Define edge types
  const edgeTypes = {
    custom: CustomEdge,
  };

  // After existing imports, add:
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiSelectionActive, setIsMultiSelectionActive] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Ensure a Scenario exists (one per user for now)
  useEffect(() => {
    async function ensureScenario() {
      if (scenarioIdParam) {
        setScenarioId(Number(scenarioIdParam));
        return;
      }
      const id = await createScenario("Untitled Scenario");
      setScenarioId(id);

      // Preserve any existing query params (e.g. templateId) when we add the new scenarioId
      const query = new URLSearchParams(window.location.search);
      query.set("sid", String(id));

      // If the current URL included a templateId (tid) keep it so the template can be loaded
      if (templateIdParam) {
        query.set("tid", templateIdParam);
      }

      router.replace(`/build?${query.toString()}`);
    }
    ensureScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist platform selection once we have a scenarioId
  useEffect(() => {
    if (!scenarioId) return;
    db.scenarios.update(scenarioId, { platform });
  }, [scenarioId, platform]);

  // Persist nodes when they change
  useEffect(() => {
    if (!scenarioId) return;
    nodes.forEach((n) => {
      db.nodes.put({
        scenarioId,
        reactFlowId: n.id,
        type: (n as any).type ?? "action",
        label: (n as any).data?.label ?? "Node",
        data: n.data,
        position: n.position,
      });
    });
  }, [nodes, scenarioId]);

  // ------------------------------------------------------------------
  // Load stored edges once we have a scenarioId
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!scenarioId) return;
    (async () => {
      const storedEdges = await db.edges
        .where("scenarioId")
        .equals(scenarioId)
        .toArray();
      if (storedEdges.length) {
        setEdges(
          Array.from(
            new Map(
              storedEdges.map((se) => [
                se.reactFlowId,
                {
                  id: se.reactFlowId,
                  source: (se.data as any)?.source,
                  target: (se.data as any)?.target,
                  label: se.label,
                  data: se.data as any,
                },
              ])
            ).values()
          )
        );
      }
    })();
  }, [scenarioId]);

  // ------------------------------------------------------------------
  // Persist edges whenever they change so IndexedDB stays up-to-date
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!scenarioId) return;

    edges.forEach((e) => {
      db.edges.put({
        scenarioId,
        reactFlowId: e.id,
        label: typeof e.label === "string" ? e.label : undefined,
        data: {
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          ...e.data,
        },
      });
    });
  }, [edges, scenarioId]);

  // Load stored data (platform, nodes, viewport)
  useEffect(() => {
    if (!scenarioId) return;
    (async () => {
      const scenario = await db.scenarios.get(scenarioId);
      if (scenario?.platform) setPlatform(scenario.platform);

      if (scenario?.runsPerMonth) setRunsPerMonth(scenario.runsPerMonth);
      if (scenario?.minutesPerRun) setMinutesPerRun(scenario.minutesPerRun);
      if (scenario?.hourlyRate) setHourlyRate(scenario.hourlyRate);
      if (scenario?.taskMultiplier) setTaskMultiplier(scenario.taskMultiplier);

      const storedNodes = await db.nodes
        .where("scenarioId")
        .equals(scenarioId)
        .toArray();
      if (storedNodes.length) {
        setNodes(
          storedNodes.map((sn) => ({
            id: sn.reactFlowId,
            type: sn.type,
            position: sn.position,
            data: sn.data as any,
          }))
        );
      }
    })();
  }, [scenarioId]);

  // Update selected node convenience to handle both nodes and groups
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const selectedGroup = nodes.find((n) => n.id === selectedGroupId && n.type === "group") || null;

  // Add a function to handle node selection with multi-select
  const handleNodeClick = useCallback((evt: React.MouseEvent, node: Node) => {
    // Handle groups separately
    if (node.type === "group") {
      setSelectedGroupId(node.id);
      setSelectedId(null);
      return;
    }
    
    // Check if Shift key is pressed for multi-select
    if (evt.shiftKey) {
      setIsMultiSelectionActive(true);
      setSelectedIds((ids) => {
        if (ids.includes(node.id)) {
          // If already selected, deselect it
          return ids.filter(id => id !== node.id);
        } else {
          // Otherwise add to selection
          return [...ids, node.id];
        }
      });
    } else {
      // Regular single selection
      setSelectedId(node.id);
      setSelectedGroupId(null);
      setSelectedIds([]);
      setIsMultiSelectionActive(false);
    }
  }, []);
  
  // Function to create a group from selected nodes
  const createGroupFromSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    // Find bounding box of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const selectedNodesData: Record<string, any> = {};
    
    selectedIds.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      
      // Update bounding box
      const { x, y } = node.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 150); // Approximate node width
      maxY = Math.max(maxY, y + 40);  // Approximate node height
      
      // Store node minutes contribution
      const nodeType = node.type as any; // Cast to any first to avoid NodeType conflicts
      const operationType = (node.data as any)?.typeOf;
      const nodeMinutes = calculateNodeTimeSavings(
        nodeType,
        minutesPerRun,
        nodes,
        {
          trigger: 0.5,
          action: 1.2,
          decision: 0.8,
        },
        operationType
      );
      
      selectedNodesData[id] = {
        minuteContribution: nodeMinutes,
        ...node.data,
      };
    });
    
    // Add some padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Create group node
    const groupId = `group-${nanoid(6)}`;
    const groupNode = {
      id: groupId,
      type: "group",
      position: { x: minX, y: minY },
      data: {
        label: `Group ${nodes.filter(n => n.type === "group").length + 1}`,
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
        onLockToggle: (locked: boolean) => {
          setNodes(ns => ns.map(n => 
            n.id === groupId 
              ? { ...n, data: { ...n.data, isLocked: locked } } 
              : n
          ));
        },
      },
      // Make the group selectable but not connectable
      selectable: true,
      connectable: false,
    };
    
    // Add group node to the canvas
    setNodes(ns => [...ns, groupNode]);
    
    // Clear selection
    setSelectedIds([]);
    setIsMultiSelectionActive(false);
    
    // Select the new group
    setSelectedGroupId(groupId);
    setSelectedId(null);
  }, [selectedIds, nodes, setNodes, platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier]);
  
  // Function to ungroup
  const ungroupSelection = useCallback(() => {
    if (!selectedGroupId) return;
    
    // Get the group to remove
    const group = nodes.find(n => n.id === selectedGroupId);
    if (!group || group.type !== "group") return;
    
    // Remove the group node
    setNodes(ns => ns.filter(n => n.id !== selectedGroupId));
    
    // Clear group selection
    setSelectedGroupId(null);
  }, [selectedGroupId, nodes, setNodes]);

  // handler to persist viewport
  const handleMoveEnd = (_: any, viewport: Viewport) => {
    if (!scenarioId) return;
    db.scenarios.update(scenarioId, {
      payload: { ...(selectedNode as any)?.payload },
      // store under a reserved key; scenario table accepts additional fields
      viewport,
    } as any);
  };

  // Add new edge on connect
  const handleConnect = React.useCallback((connection: Connection) => {
    setEdges((eds) => {
      const next = addEdge({
        ...connection,
        // Use custom edge type for better visualization
        type: 'custom',
        // Add data to distinguish decision paths
        data: {
          ...(connection.sourceHandle === 'true' ? { isTrue: true } : {}),
          ...(connection.sourceHandle === 'false' ? { isFalse: true } : {}),
        }
      }, eds);
      // Deduplicate by id to avoid React duplicate key errors
      return Array.from(new Map(next.map((e) => [e.id, e])).values());
    });
  }, []);

  const snapToGridModifier = createSnapModifier(8);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      // Accept drop if pointer is within canvas even if collision calc fails
      if (over && over.id !== "canvas") return;
      const type = active.data.current?.nodeType as "trigger" | "action" | "decision" | undefined;
      if (!type || !reactFlowWrapper.current || !rfInstance) return;

      // Calculate drop position
      const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
      const rect = active.rect.current.translated ?? active.rect.current.initial;
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const viewport = (rfInstance as any).getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
      const pos = {
        x: (centerX - wrapperRect.left - viewport.x) / viewport.zoom,
        y: (centerY - wrapperRect.top - viewport.y) / viewport.zoom,
      };

      const snapped = snapToGrid(pos.x, pos.y);

      const newId = nanoid(6);
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type,
          position: snapped,
          data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nds.length + 1}` },
        },
      ]);
    },
    [rfInstance, setNodes]
  );

  /* ---------- ROI Sheet open state ---------- */
  const [roiOpen, setRoiOpen] = useState(false);

  /* -------------------------------------------------------------------- */
  /*  Load template into new scenario (once)                               */
  /* -------------------------------------------------------------------- */
  const templateLoadedRef = useRef(false);
  useEffect(() => {
    if (!templateIdParam || !scenarioId || templateLoadedRef.current) return;

    (async () => {
      try {
        const res = await fetch(`/api/templates/${templateIdParam}`);
        if (!res.ok) throw new Error("Template fetch failed");
        const tpl = await res.json();

        if (Array.isArray(tpl.nodes) && tpl.nodes.length) {
          // Map template nodes/edges to ReactFlow shapes
          setNodes(
            tpl.nodes.map((n: any) => ({
              id: n.reactFlowId,
              type: n.type,
              position: n.position,
              data: n.data,
            }))
          );
        }

        if (Array.isArray(tpl.edges) && tpl.edges.length) {
          setEdges(
            tpl.edges.map((e: any) => ({
              id: e.reactFlowId,
              source: e.data?.source,
              target: e.data?.target,
              label: e.label,
              data: e.data,
            }))
          );
        }

        // Set platform guess from template source if available
        if (tpl.source && ["zapier", "make", "n8n"].includes(tpl.source)) {
          setPlatform(tpl.source);
        }

        templateLoadedRef.current = true;
      } catch (err) {
        console.error(err);
      }
    })();
  }, [templateIdParam, scenarioId, setNodes, setEdges]);

  return (
    <ReactFlowProvider>
      <DndContext
        sensors={sensors}
        modifiers={[snapToGridModifier]}
        onDragEnd={handleDragEnd}
        collisionDetection={pointerWithin}
      >
        <div className="flex h-screen w-full flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b bg-background/60 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">Apicus.io</h1>
              {/* RPG-style dynamic stats bar */}
              <StatsBar 
                platform={platform}
                runsPerMonth={runsPerMonth}
                minutesPerRun={minutesPerRun}
                hourlyRate={hourlyRate}
                taskMultiplier={taskMultiplier}
              />
            </div>
            <div className="flex items-center gap-2">
              <PlatformSwitcher value={platform} onChange={setPlatform} />
              <Button size="icon" variant="ghost" onClick={() => setRoiOpen(true)} title="ROI Settings">
                <Coins className="h-4 w-4" />
              </Button>
              
              {/* Group Controls */}
              {isMultiSelectionActive && selectedIds.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={createGroupFromSelection}
                >
                  <Calculator className="h-3 w-3" />
                  Group ({selectedIds.length})
                </Button>
              )}
              
              {selectedGroupId && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={ungroupSelection}
                >
                  Ungroup
                </Button>
              )}
              
              <Button size="sm" onClick={() => handleAddNode(setNodes, nodes)}>
                + Node
              </Button>
            </div>
          </header>

          {/* Main content row */}
          <div className="flex flex-grow">
            {/* Toolbox Sidebar */}
            <Toolbox />

            {/* Canvas Wrapper */}
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultViewport={initialViewport}
              onMoveEnd={handleMoveEnd}
              onInit={(instance) => setRfInstance(instance as ReactFlowInstance)}
              setWrapperRef={(node) => {
                reactFlowWrapper.current = node;
                setDroppableRef(node);
              }}
            />

            {/* Node Properties Panel */}
            <NodePropertiesPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedId(null)}
              platform={platform}
              nodes={nodes}
              setNodes={setNodes}
              runsPerMonth={runsPerMonth}
              minutesPerRun={minutesPerRun}
              hourlyRate={hourlyRate}
              taskMultiplier={taskMultiplier}
            />
            
            {/* Group Properties Panel */}
            <GroupPropertiesPanel
              selectedGroup={selectedGroup}
              onClose={() => setSelectedGroupId(null)}
              platform={platform}
              nodes={nodes}
              setNodes={setNodes}
              runsPerMonth={runsPerMonth}
              minutesPerRun={minutesPerRun}
              hourlyRate={hourlyRate}
              taskMultiplier={taskMultiplier}
            />
          </div>
        </div>

        {/* ROI Settings Panel */}
        <ROISettingsPanel
          open={roiOpen}
          onOpenChange={setRoiOpen}
          platform={platform}
          runsPerMonth={runsPerMonth}
          setRunsPerMonth={setRunsPerMonth}
          minutesPerRun={minutesPerRun}
          setMinutesPerRun={setMinutesPerRun}
          hourlyRate={hourlyRate}
          setHourlyRate={setHourlyRate}
          taskMultiplier={taskMultiplier}
          setTaskMultiplier={setTaskMultiplier}
          taskType={taskType}
          setTaskType={setTaskType}
          complianceEnabled={complianceEnabled}
          setComplianceEnabled={setComplianceEnabled}
          revenueEnabled={revenueEnabled}
          setRevenueEnabled={setRevenueEnabled}
          riskLevel={riskLevel}
          setRiskLevel={setRiskLevel}
          riskFrequency={riskFrequency}
          setRiskFrequency={setRiskFrequency}
          errorCost={errorCost}
          setErrorCost={setErrorCost}
          monthlyVolume={monthlyVolume}
          setMonthlyVolume={setMonthlyVolume}
          conversionRate={conversionRate}
          setConversionRate={setConversionRate}
          valuePerConversion={valuePerConversion}
          setValuePerConversion={setValuePerConversion}
          taskTypeMultipliers={taskTypeMultipliers}
          benchmarks={benchmarks}
          updateScenarioROI={updateScenarioROI}
        />
      </DndContext>
    </ReactFlowProvider>
  );
} 