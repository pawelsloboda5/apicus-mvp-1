"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Sheet as UISheet,
  SheetContent as UISheetContent,
  SheetHeader as UISheetHeader,
  SheetTitle as UISheetTitle,
  SheetDescription as UISheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { db, createScenario, type Scenario } from "@/lib/db";
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
import { Coins, Calculator, Loader2, MoreHorizontal, Edit2Icon, Mail, MailOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { nanoid } from "nanoid";
import { useDroppable } from "@dnd-kit/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import custom components
import { StatsBar } from "@/components/flow/StatsBar";
import { PlatformSwitcher } from "@/components/flow/PlatformSwitcher";
import { NodePropertiesPanel } from "@/components/flow/NodePropertiesPanel";
import { ROISettingsPanel } from "@/components/roi/ROISettingsPanel";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { GroupPropertiesPanel } from "@/components/flow/GroupPropertiesPanel";
import { AlternativeTemplatesSheet, type AlternativeTemplateForDisplay } from "@/components/flow/AlternativeTemplatesSheet";
import { EmailPreviewNode, type EmailPreviewNodeData } from "@/components/flow/EmailPreviewNode";
import { EmailNodePropertiesPanel } from "@/components/flow/EmailNodePropertiesPanel";

// Import utility functions
import { handleAddNode, snapToGrid } from "@/lib/flow-utils";
import {
  calculateNodeTimeSavings,
  calculateGroupROI,
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculateTotalValue,
  calculatePlatformCost,
  calculateNetROI,
  calculateROIRatio,
  formatROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod
} from "@/lib/roi-utils";
import { NodeType, PlatformType as LibPlatformType } from "@/lib/types";

const PLATFORMS = ["zapier", "make", "n8n"] as const;

// Disable SSR for Toolbox because dnd-kit generates ids non-deterministically, which causes hydration mismatch warnings.
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

// Define nodeTypes and edgeTypes outside the component function for stability
const nodeTypes = {
  trigger: PixelNode,
  action: PixelNode,
  decision: PixelNode,
  group: NodeGroup,
  emailPreview: EmailPreviewNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function BuildPage() {
  const router = useRouter();
  const params = useSearchParams();
  const scenarioIdParam = params.get("sid");
  const templateIdParam = params.get("tid");
  const queryParam = params.get("q");

  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [alternativeTemplates, setAlternativeTemplates] = useState<Scenario[]>([]);
  const [platform, setPlatform] = useState<LibPlatformType>("zapier");
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

  // ROI input state (will be loaded from currentScenario)
  const [runsPerMonth, setRunsPerMonth] = useState(250);
  const [minutesPerRun, setMinutesPerRun] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [taskMultiplier, setTaskMultiplier] = useState(1.5);
  const [taskType, setTaskType] = useState<string>("general");
  const [complianceEnabled, setComplianceEnabled] = useState(false);
  const [revenueEnabled, setRevenueEnabled] = useState(false);
  const [riskLevel, setRiskLevel] = useState(3);
  const [riskFrequency, setRiskFrequency] = useState(5);
  const [errorCost, setErrorCost] = useState(500);
  const [monthlyVolume, setMonthlyVolume] = useState(100);
  const [conversionRate, setConversionRate] = useState(5);
  const [valuePerConversion, setValuePerConversion] = useState(200);
  
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  // const [emailModalOpen, setEmailModalOpen] = useState(false); // Commented out

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

  const [isLoading, setIsLoading] = useState(true);

  // After existing imports, add:
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiSelectionActive, setIsMultiSelectionActive] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEmailNodeId, setSelectedEmailNodeId] = useState<string | null>(null);
  const [isManipulatingNodesProgrammatically, setIsManipulatingNodesProgrammatically] = useState(false);
  const [isGeneratingAIContent, setIsGeneratingAIContent] = useState(false);

  // State for screen size detection for responsive header
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingScenarioName, setEditingScenarioName] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint for shadcn
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (currentScenario) {
      setEditingScenarioName(currentScenario.name);
    }
  }, [currentScenario]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleScenarioNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingScenarioName(event.target.value);
  };

  const saveScenarioName = async () => {
    if (currentScenario && currentScenario.id && editingScenarioName.trim() !== "") {
      const newName = editingScenarioName.trim();
      await db.scenarios.update(currentScenario.id, { name: newName, updatedAt: Date.now() });
      setCurrentScenario(prev => prev ? { ...prev, name: newName, updatedAt: Date.now() } : null);
    }
    setIsEditingTitle(false);
  };

  const handleScenarioNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      saveScenarioName();
    } else if (event.key === 'Escape') {
      setEditingScenarioName(currentScenario?.name || "");
      setIsEditingTitle(false);
    }
  };

  // Function to load scenario data into page state (ROI inputs, nodes, edges, etc.)
  const loadScenarioDataToState = useCallback((scenario: Scenario | null | undefined) => {
    console.log("[loadScenarioDataToState] Loading scenario:", scenario?.id);
    if (!scenario) {
      setNodes([]);
      setEdges([]);
      // Reset ROI inputs to default if needed
      setRunsPerMonth(250);
      setMinutesPerRun(3);
      setHourlyRate(30);
      setTaskMultiplier(1.5);
      setTaskType("general");
      setComplianceEnabled(false);
      setRevenueEnabled(false);
      setRiskLevel(3);
      setRiskFrequency(5);
      setErrorCost(500);
      setMonthlyVolume(100);
      setConversionRate(5);
      setValuePerConversion(200);
      setPlatform("zapier");
      if (rfInstance) rfInstance.setViewport({ x: 0, y: 0, zoom: 1});
      setCurrentScenario(null); // Explicitly set currentScenario to null
      return;
    }

    setPlatform(scenario.platform || "zapier");
    setRunsPerMonth(scenario.runsPerMonth || 250);
    setMinutesPerRun(scenario.minutesPerRun || 3);
    setHourlyRate(scenario.hourlyRate || 30);
    setTaskMultiplier(scenario.taskMultiplier || 1.5);
    setTaskType(scenario.taskType || "general");
    setComplianceEnabled(scenario.complianceEnabled || false);
    setRevenueEnabled(scenario.revenueEnabled || false);
    setRiskLevel(scenario.riskLevel || 3);
    setRiskFrequency(scenario.riskFrequency || 5);
    setErrorCost(scenario.errorCost || 500);
    setMonthlyVolume(scenario.monthlyVolume || 100);
    setConversionRate(scenario.conversionRate || 5);
    setValuePerConversion(scenario.valuePerConversion || 200);

    setNodes(scenario.nodesSnapshot || []);
    console.log("[loadScenarioDataToState] Setting nodes from snapshot:", scenario.nodesSnapshot);
    setEdges(scenario.edgesSnapshot || []);
    console.log("[loadScenarioDataToState] Setting edges from snapshot:", scenario.edgesSnapshot);
    if (rfInstance && scenario.viewport) {
      rfInstance.setViewport(scenario.viewport);
    } else if (rfInstance) {
      // Default viewport if none in scenario
      rfInstance.setViewport({ x: 0, y: 0, zoom: 1});
    }
    setCurrentScenario(scenario);
  }, [rfInstance, setNodes, setEdges]);

  // Persist relevant parts of currentScenario when ROI inputs change
  const updateCurrentScenarioROI = useCallback(
    (partial: Partial<Scenario>) => {
      if (!currentScenario || !currentScenario.id) return;
      const updatedFields = { ...partial, updatedAt: Date.now() };
      setCurrentScenario(prev => prev ? { ...prev, ...updatedFields } : null);
      db.scenarios.update(currentScenario.id, updatedFields);
    },
    [currentScenario]
  );

  // Ensure a Scenario exists (or load existing one)
  useEffect(() => {
    setIsLoading(true);
    async function manageScenario() {
      console.log("[manageScenario] Start. sid:", scenarioIdParam, "tid:", templateIdParam, "q:", queryParam);
      let activeScenarioIdToLoad: number | null = scenarioIdParam ? Number(scenarioIdParam) : null;
      let scenarioToLoad: Scenario | undefined;
      let primaryTemplateData: any = null;

      if (activeScenarioIdToLoad) {
        scenarioToLoad = await db.scenarios.get(activeScenarioIdToLoad);
      }

      if (scenarioToLoad) {
        setScenarioId(activeScenarioIdToLoad);
      } else {
        // No valid sid or scenario not found, create a new one
        const newName = templateIdParam ? "Loading Template..." : (queryParam ? `Search: ${queryParam}` : "Untitled Scenario");
        const newId = await createScenario(newName);
        setScenarioId(newId);
        activeScenarioIdToLoad = newId;
        scenarioToLoad = await db.scenarios.get(newId); // Fetch the newly created scenario

        const urlQuery = new URLSearchParams(window.location.search);
        urlQuery.set("sid", String(newId));
        if (templateIdParam) urlQuery.set("tid", templateIdParam);
        if (queryParam) urlQuery.set("q", queryParam); // Persist q
        // Only replace history if scenarioIdParam was missing or invalid
        if (!scenarioIdParam || scenarioIdParam !== String(newId)) {
            router.replace(`/build?${urlQuery.toString()}`, { scroll: false });
        }
      }
      
      // Moved setCurrentScenario and template loading logic to after this block
      // to ensure scenarioId state is set first.

      // Fetch primary template if tid is present AND scenario lacks nodes/edges (i.e., needs initialization)
      if (templateIdParam && scenarioToLoad && activeScenarioIdToLoad && (!scenarioToLoad.nodesSnapshot || scenarioToLoad.nodesSnapshot.length === 0)) {
        console.log("[manageScenario] Scenario lacks nodes, attempting to initialize from templateId:", templateIdParam);
        try {
          const res = await fetch(`/api/templates/${templateIdParam}`);
          if (!res.ok) throw new Error("Primary template fetch failed");
          primaryTemplateData = await res.json();
          console.log("[manageScenario] Fetched primary template:", primaryTemplateData);

          if (primaryTemplateData && primaryTemplateData.nodes && primaryTemplateData.edges) {
            const updatedScenarioData: Partial<Scenario> = {
              name: primaryTemplateData.title || scenarioToLoad.name,
              nodesSnapshot: primaryTemplateData.nodes.map((n: any) => ({
                id: n.reactFlowId, type: n.type, position: n.position, data: n.data,
              })),
              edgesSnapshot: primaryTemplateData.edges.map((e: any) => ({
                id: e.reactFlowId, source: e.data?.source, target: e.data?.target, label: e.label, data: e.data, type: 'custom',
              })),
              platform: primaryTemplateData.platform || primaryTemplateData.source || scenarioToLoad.platform,
              originalTemplateId: templateIdParam,
              searchQuery: queryParam || scenarioToLoad.searchQuery,
              updatedAt: Date.now(),
            };
            console.log("[manageScenario] Updating DB with primary template data:", updatedScenarioData);
            await db.scenarios.update(activeScenarioIdToLoad!, updatedScenarioData);
            scenarioToLoad = { ...scenarioToLoad, ...updatedScenarioData } as Scenario;
            console.log("[manageScenario] scenarioToLoad after merging primary template:", scenarioToLoad);
          }
        } catch (err) {
          console.error("Error fetching primary template:", err);
          // Potentially update scenario name to indicate error or use default
          if (activeScenarioIdToLoad) { // Ensure activeScenarioId is not null
            await db.scenarios.update(activeScenarioIdToLoad, { name: scenarioToLoad?.name || "Error Loading Template" });
          }
        }
      } else if (templateIdParam && scenarioToLoad) {
        console.log("[manageScenario] Scenario already has nodes/edges, skipping template initialization for tid:", templateIdParam);
      }
      
      // Set currentScenario here after all potential modifications
      // This will trigger the useEffect that depends on currentScenario to load data to state
      setCurrentScenario(scenarioToLoad || null); 

      // Fetch alternative templates if queryParam exists
      if (queryParam && activeScenarioIdToLoad && scenarioToLoad) {
        try {
          const res = await fetch(`/api/templates/search?q=${encodeURIComponent(queryParam)}`);
          if (!res.ok) throw new Error("Alternative templates fetch failed");
          const data = await res.json();
          if (data.templates && Array.isArray(data.templates)) {
            const primaryTemplateIdToExclude = scenarioToLoad.originalTemplateId;
            // Map API results to Scenario-like objects for the state
            const scenariosFromTemplates: Scenario[] = data.templates
              .filter((t: any) => t.templateId !== primaryTemplateIdToExclude)
              .slice(0, 5)
              .map((t: any) => ({
                slug: nanoid(8), // Generate a new slug for this representation
                name: t.title || "Alternative",
                createdAt: Date.now(), // Set creation/update times
                updatedAt: Date.now(),
                platform: t.platform || t.source || "zapier",
                nodesSnapshot: t.nodes?.map((n: any) => ({ id: n.reactFlowId || n.id, type: n.type, position: n.position, data: n.data })) || [],
                edgesSnapshot: t.edges?.map((e: any) => ({ id: e.reactFlowId || e.id, source: e.data?.source || e.source, target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom' })) || [],
                originalTemplateId: t.templateId,
                searchQuery: queryParam || "", // Use queryParam here
                // description: t.description, // Scenario type doesn't have description by default
                // Explicitly add any other Scenario fields if needed, otherwise they are undefined
                // Default ROI params for these Scenario-like objects if not provided by template
                runsPerMonth: 250, minutesPerRun: 3, hourlyRate: 30, taskMultiplier: 1.5, taskType: "general",
                complianceEnabled: false, revenueEnabled: false, riskLevel:3, riskFrequency:5, errorCost:500, monthlyVolume:100, conversionRate:5, valuePerConversion:200, 
              }));        

            setAlternativeTemplates(scenariosFromTemplates); // This should now be compatible with Scenario[]

            const alternativesCache: any[] = scenariosFromTemplates.map(s => ({
              templateId: s.originalTemplateId,
              title: s.name,
              platform: s.platform,
              // description: s.description, // Not on Scenario type by default
              nodesCount: s.nodesSnapshot?.length || 0,
            }));

            if (scenarioToLoad && scenarioToLoad.id) {
              await db.scenarios.update(scenarioToLoad.id, { alternativeTemplatesCache: alternativesCache, updatedAt: Date.now(), searchQuery: queryParam });
              setCurrentScenario(prev => prev ? ({...prev, alternativeTemplatesCache: alternativesCache, searchQuery: queryParam }) : null);
            }
          }
        } catch (err) {
          console.error("Error in handleFindNewAlternatives:", err);
          setAlternativeTemplates([]); // Clear on error
          if (scenarioToLoad && scenarioToLoad.id) {
            // Corrected variable name here
            await db.scenarios.update(scenarioToLoad.id, { alternativeTemplatesCache: [], updatedAt: Date.now() });
             setCurrentScenario(prev => prev ? ({...prev, alternativeTemplatesCache: [] }) : null);
          }
        }
      }
      setIsLoading(false);
    }
    manageScenario();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdParam, templateIdParam, queryParam]); // Removed router from dependencies

  // Load scenario data once rfInstance is available AND currentScenario is set
  useEffect(() => {
    if (rfInstance && currentScenario) {
      console.log("[useEffect currentScenario] Loading data for scenario:", currentScenario.id, currentScenario.name);
      loadScenarioDataToState(currentScenario);
    } else if (rfInstance && !currentScenario && scenarioId) {
      // This case handles when scenarioId is set (e.g. by handleLoadScenario)
      // but currentScenario hasn't been fetched and set yet in the main useEffect.
      // Or if currentScenario was cleared.
      if (isManipulatingNodesProgrammatically) return; // Guard against re-loading while programmatically changing nodes
      console.log(`[useEffect currentScenario] currentScenario is null, but scenarioId exists: ${scenarioId} . Attempting to load from DB.`);
      db.scenarios.get(scenarioId).then(fetchedScenario => {
        if (fetchedScenario) {
          setCurrentScenario(fetchedScenario); // This will re-trigger this effect
        } else {
          // Handle case where scenarioId is invalid or scenario deleted elsewhere
          console.warn(`[useEffect currentScenario] Scenario with id ${scenarioId} not found in DB.`);
          // Potentially create a new one or load a default.
          // For now, let's clear the canvas.
          loadScenarioDataToState(null); 
          router.replace('/build'); // Navigate to a clean build page
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfInstance, currentScenario, scenarioId, loadScenarioDataToState, router, isManipulatingNodesProgrammatically]); // loadScenarioDataToState and router were already here

  // Canvas State Sync Effect (Saving nodes/edges/viewport to Dexie for the currentScenario.id)
  useEffect(() => {
    if (!currentScenario || !currentScenario.id || !rfInstance) return;
    // Avoid saving an empty canvas over a loaded scenario during the initial loading phase
    if (isLoading && (nodes.length === 0 && edges.length === 0 && !currentScenario.nodesSnapshot?.length)) return;

    const flowObject = rfInstance.toObject();
    
    // Determine if there has been a meaningful change to content or viewport
    const nodesChanged = JSON.stringify(flowObject.nodes) !== JSON.stringify(currentScenario.nodesSnapshot || []);
    const edgesChanged = JSON.stringify(flowObject.edges) !== JSON.stringify(currentScenario.edgesSnapshot || []);
    const viewportChanged = JSON.stringify(flowObject.viewport) !== JSON.stringify(currentScenario.viewport);

    const hasContentChanged = nodesChanged || edgesChanged || viewportChanged;

    const updatePayload: Partial<Scenario> = {
        nodesSnapshot: flowObject.nodes,
        edgesSnapshot: flowObject.edges,
        viewport: flowObject.viewport,
    };

    // Only update the timestamp if there was an actual change to the flow content or viewport.
    // Other updates to `updatedAt` (e.g., renaming, ROI param changes) are handled by their specific functions.
    if (hasContentChanged) {
        console.log("[Canvas Sync] Content changed, updating timestamp for scenario:", currentScenario.id);
        updatePayload.updatedAt = Date.now();
    } else {
        console.log("[Canvas Sync] No content change detected, saving snapshots without updating timestamp for scenario:", currentScenario.id);
    }
    
    // Persist the snapshots. If updatedAt is in updatePayload, it gets updated too.
    db.scenarios.update(currentScenario.id, updatePayload).catch(err => {
        console.error("Failed to update scenario in Dexie from canvas sync:", err);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, rfInstance, currentScenario, isLoading]); // currentScenario is the key addition for comparison

  // Update selected node convenience to handle both nodes and groups
  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedGroup = nodes.find((n) => n.id === selectedGroupId && n.type === "group") || null;
  const selectedEmailNode = nodes.find((n) => n.id === selectedEmailNodeId && n.type === "emailPreview") as Node<EmailPreviewNodeData> | null;

  // Add a function to handle node selection with multi-select
  const handleNodeClick = useCallback((evt: React.MouseEvent, node: Node) => {
    // Handle groups separately
    if (node.type === "group") {
      setSelectedGroupId(node.id);
      setSelectedId(null);
      setSelectedEmailNodeId(null);
      return;
    }
    // Handle Email Preview Node selection
    if (node.type === "emailPreview") {
      setSelectedEmailNodeId(node.id);
      setSelectedId(null);
      setSelectedGroupId(null);
      setIsMultiSelectionActive(false);
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
      setSelectedEmailNodeId(null);
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
          group: 0,
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
      },
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
  const handleMoveEnd = (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    if (!currentScenario || !currentScenario.id) return;
    // Only save viewport if it's different from the stored one to avoid rapid updates
    if (JSON.stringify(currentScenario.viewport) !== JSON.stringify(viewport)) {
      const updatedFields = { viewport, updatedAt: Date.now() };
      setCurrentScenario(prev => prev ? { ...prev, ...updatedFields } : null);
      db.scenarios.update(currentScenario.id, updatedFields);
    }
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

  // Function to save the current canvas state as a new scenario
  const saveCurrentWorkflowAsScenario = useCallback(async (name?: string): Promise<number> => {
    if (!rfInstance) {
      console.error("ReactFlow instance not available for saving.");
      throw new Error("ReactFlow instance not available");
    }
    const flowObject = rfInstance.toObject();

    const scenarioToSave: Omit<Scenario, 'id' | 'slug' | 'createdAt'> = {
      name: name || currentScenario?.name || `Saved Scenario ${new Date().toLocaleTimeString()}`,
      updatedAt: Date.now(),
      platform: platform,
      runsPerMonth: runsPerMonth,
      minutesPerRun: minutesPerRun,
      hourlyRate: hourlyRate,
      taskMultiplier: taskMultiplier,
      taskType: taskType,
      complianceEnabled: complianceEnabled,
      riskLevel: riskLevel,
      riskFrequency: riskFrequency,
      errorCost: errorCost,
      revenueEnabled: revenueEnabled,
      monthlyVolume: monthlyVolume,
      conversionRate: conversionRate,
      valuePerConversion: valuePerConversion,
      nodesSnapshot: flowObject.nodes,
      edgesSnapshot: flowObject.edges,
      viewport: flowObject.viewport,
      originalTemplateId: currentScenario?.originalTemplateId, // Preserve if based on a template
      searchQuery: currentScenario?.searchQuery, // Preserve original query
      // alternativeTemplatesCache: currentScenario?.alternativeTemplatesCache, // Preserve alternatives if any
    };
    
    // Create a new slug for the new scenario if it's a "Save As" type operation
    // Or reuse if updating an existing currentScenario by creating a *new* record from it.
    const newScenarioId = await db.scenarios.add({
        slug: nanoid(8),
        createdAt: Date.now(),
        ...scenarioToSave
    } as Scenario); // Cast to Scenario to satisfy Dexie's add method requiring all non-optional fields

    console.log("Workflow saved as new scenario ID:", newScenarioId);
    // TODO: Update the "My Scenarios" list in Toolbox (will require passing a callback or using a global state/event)
    return newScenarioId;
  }, [rfInstance, platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, taskType, complianceEnabled, riskLevel, riskFrequency, errorCost, revenueEnabled, monthlyVolume, conversionRate, valuePerConversion, currentScenario]);

  const handleFindNewAlternatives = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch) {
      console.error("[handleFindNewAlternatives] Query is missing.");
      return;
    }
    if (!currentScenario || !currentScenario.id) {
        console.error("[handleFindNewAlternatives] Current scenario or ID missing.");
        return;
    }
    setIsLoadingAlternatives(true); // Correct usage
    try {
        const res = await fetch(`/api/templates/search?q=${encodeURIComponent(queryToSearch)}`);
        if (!res.ok) throw new Error(`Alt templates fetch failed: ${res.status}`);
        const data = await res.json();
        let newAltsState: Scenario[] = [];
        let altsCacheForDb: any[] = [];

        if (data.templates && Array.isArray(data.templates)) {
            const primaryId = currentScenario.originalTemplateId;
            newAltsState = data.templates.filter((t: any) => t.templateId !== primaryId).slice(0, 5).map((t: any) => ({
                slug: nanoid(8), name: t.title || "Alternative", createdAt: Date.now(), updatedAt: Date.now(),
                platform: t.platform || t.source || "zapier",
                nodesSnapshot: t.nodes?.map((n: any) => ({ id: n.reactFlowId || n.id, type: n.type, position: n.position, data: n.data })) || [],
                edgesSnapshot: t.edges?.map((e: any) => ({ id: e.reactFlowId || e.id, source: e.data?.source || e.source, target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom' })) || [],
                originalTemplateId: t.templateId, 
                searchQuery: queryToSearch, // Use queryToSearch from parameter
                runsPerMonth: 250, minutesPerRun: 3, hourlyRate: 30, taskMultiplier: 1.5, taskType: "general",
                complianceEnabled: false, revenueEnabled: false, riskLevel:3, riskFrequency:5, errorCost:500, monthlyVolume:100, conversionRate:5, valuePerConversion:200, 
            } as Scenario));
            altsCacheForDb = newAltsState.map(s => ({ 
                templateId: s.originalTemplateId, title: s.name, platform: s.platform, 
                nodesCount: s.nodesSnapshot?.length || 0, 
                description: (s as any).description // If original template had description, pass it
            }));
        }
        setAlternativeTemplates(newAltsState);
        // Ensure currentScenario.id is valid before update
        if (currentScenario && currentScenario.id) {
            await db.scenarios.update(currentScenario.id, { alternativeTemplatesCache: altsCacheForDb, updatedAt: Date.now(), searchQuery: queryToSearch });
            setCurrentScenario(prev => prev ? ({ ...prev, alternativeTemplatesCache: altsCacheForDb, searchQuery: queryToSearch }) : null);
        }
    } catch (err) {
        console.error("Error in handleFindNewAlternatives:", err);
        setAlternativeTemplates([]);
        if (currentScenario && currentScenario.id) {
            await db.scenarios.update(currentScenario.id, { alternativeTemplatesCache: [], updatedAt: Date.now() });
            setCurrentScenario(prev => prev ? ({ ...prev, alternativeTemplatesCache: [] }) : null);
        }
    } finally {
        setIsLoadingAlternatives(false); // Correct usage
    }
}, [currentScenario]);

  const handleSelectAlternative = useCallback(async (alternativeData: AlternativeTemplateForDisplay) => {
    const fullAlternativeScenario = alternativeTemplates.find(s => s.originalTemplateId === alternativeData.templateId);

    if (!currentScenario || !currentScenario.id || !fullAlternativeScenario || !fullAlternativeScenario.originalTemplateId) {
        console.error("Cannot select alt: missing current scenario/ID or full alt data/ID.");
        return;
    }
    setIsLoading(true);
    await saveCurrentWorkflowAsScenario(`Backup of ${currentScenario.name}`);
    const newCreatedScenarioId = await createScenario(fullAlternativeScenario.name || `Loaded: ${fullAlternativeScenario.originalTemplateId}`); // Define newCreatedScenarioId
    
    const scenarioUpdateData: Partial<Scenario> = {
        name: fullAlternativeScenario.name || `Loaded: ${fullAlternativeScenario.originalTemplateId}`,
        nodesSnapshot: fullAlternativeScenario.nodesSnapshot || [], edgesSnapshot: fullAlternativeScenario.edgesSnapshot || [],
        platform: fullAlternativeScenario.platform as LibPlatformType || "zapier", originalTemplateId: fullAlternativeScenario.originalTemplateId,
        searchQuery: fullAlternativeScenario.searchQuery || currentScenario.searchQuery,
        runsPerMonth: fullAlternativeScenario.runsPerMonth || 250, minutesPerRun: fullAlternativeScenario.minutesPerRun || 3,
        hourlyRate: fullAlternativeScenario.hourlyRate || 30, taskMultiplier: fullAlternativeScenario.taskMultiplier || 1.5,
        taskType: fullAlternativeScenario.taskType || "general", complianceEnabled: fullAlternativeScenario.complianceEnabled || false,
        revenueEnabled: fullAlternativeScenario.revenueEnabled || false, riskLevel: fullAlternativeScenario.riskLevel || 3,
        riskFrequency: fullAlternativeScenario.riskFrequency || 5, errorCost: fullAlternativeScenario.errorCost || 500,
        monthlyVolume: fullAlternativeScenario.monthlyVolume || 100, conversionRate: fullAlternativeScenario.conversionRate || 5,
        valuePerConversion: fullAlternativeScenario.valuePerConversion || 200,
        updatedAt: Date.now(), alternativeTemplatesCache: [],
    };
    await db.scenarios.update(newCreatedScenarioId, scenarioUpdateData); // Use newCreatedScenarioId
    router.replace(`/build?sid=${newCreatedScenarioId}&tid=${fullAlternativeScenario.originalTemplateId}&q=${encodeURIComponent(scenarioUpdateData.searchQuery || '')}`, { scroll: false }); // Use newCreatedScenarioId
  }, [currentScenario, saveCurrentWorkflowAsScenario, router, alternativeTemplates]);

  const handleLoadScenario = useCallback(async (idToLoad: number) => {
    console.log(`[handleLoadScenario] Attempting to load scenario ID: ${idToLoad}`);
    setIsLoading(true);
    const scenarioFromDb = await db.scenarios.get(idToLoad);
    if (scenarioFromDb) {
      setScenarioId(idToLoad); // Update the active scenarioId state
      setCurrentScenario(scenarioFromDb); // This will trigger the useEffect to call loadScenarioDataToState
      // router.replace(`/build?sid=${idToLoad}`, { scroll: false }); // URL is already updated by Toolbox
    } else {
      console.error(`[handleLoadScenario] Scenario with ID ${idToLoad} not found.`);
      // Handle error: maybe load a default scenario or clear canvas
      loadScenarioDataToState(null); // Clear canvas
      // Potentially create a new scenario if the loaded one is gone
      const newId = await createScenario("Untitled Scenario");
      router.replace(`/build?sid=${newId}`);
      setScenarioId(newId);
      const newScenario = await db.scenarios.get(newId);
      if (newScenario) {
        setCurrentScenario(newScenario);
      } else {
        // This case should be very rare (failed to create/fetch new scenario)
        console.error("[handleLoadScenario] Failed to create or fetch a new fallback scenario.");
        // Fallback to a completely blank state without setting currentScenario
        loadScenarioDataToState(null);
      }
    }
    setIsLoading(false);
  }, [loadScenarioDataToState, router]);

  const focusOnNode = useCallback((nodeId: string) => {
    if (!rfInstance) return;
    const node = rfInstance.getNode(nodeId);
    if (node) {
      const nodeWidth = node.width || (node.type === 'emailPreview' ? 600 : 150); // Adjusted for email node
      const nodeHeight = node.height || (node.type === 'emailPreview' ? 750 : 40); // Adjusted for email node
      const x = node.position.x + nodeWidth / 2;
      const y = node.position.y + nodeHeight / 2;
      // rfInstance.setCenter(x, y, { zoom: rfInstance.getZoom(), duration: 600 });
      // A slightly more focused zoom might be better:
      rfInstance.fitBounds(
        { x: node.position.x, y: node.position.y, width: nodeWidth, height: nodeHeight },
        { padding: 0.2, duration: 600 }
      );
    }
  }, [rfInstance]);

  const emailNodesForToolbox = useMemo(() => {
    const filtered = nodes
      .filter(node => node.type === 'emailPreview')
      .map(node => ({ 
        id: node.id, 
        title: (node.data as EmailPreviewNodeData)?.nodeTitle || `Email: ${node.id}`
      }));
    console.log("[BuildPage] emailNodesForToolbox updated:", filtered);
    return filtered;
  }, [nodes]);

  // ADD THE HANDLER FUNCTION HERE
  const handleGenerateEmailOnCanvas = useCallback(async () => {
    if (!currentScenario || !currentScenario.id || !rfInstance) {
      console.error("[BuildPage] Scenario or ReactFlow instance not available for email generation.", { currentScenario, rfInstance });
      alert("Cannot generate email: Scenario data or flow instance is missing.");
      return;
    }

    setIsLoading(true);
    console.log("[BuildPage] Starting email generation on canvas for scenario:", currentScenario.name);

    try {
      setIsManipulatingNodesProgrammatically(true);
      const sc = currentScenario;
      const roiDataPayload = { /* ... (same as before, ensure all fields are correct) ... */
        scenarioName: sc.name,
        platform: sc.platform,
        timeValue: calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0),
        platformCost: calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0),
        netROI: calculateNetROI(calculateTotalValue(calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0), calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0), calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0)), calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0)),
        roiRatio: calculateROIRatio(calculateTotalValue(calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0), calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0), calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0)), calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0)),
        paybackPeriod: formatPaybackPeriod(calculatePaybackPeriod(pricing[sc.platform || 'zapier'].tiers[0]?.monthlyUSD || calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0), calculateNetROI(calculateTotalValue(calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0), calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0), calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0)), calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0)))),
        runsPerMonth: sc.runsPerMonth,
        minutesPerRun: sc.minutesPerRun,
        nodeCount: sc.nodesSnapshot?.length || 0,
      };

      const response = await fetch('/api/openai/generate-full-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roiData: roiDataPayload, scenarioName: sc.name, platform: sc.platform }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to generate full email content: ${response.status} ${errorBody}`);
      }
      const emailTexts = await response.json();
      console.log("[BuildPage] Received email texts from API:", emailTexts);

      // Prepare updated email fields for the scenario
      const updatedEmailFields: Partial<Scenario> = {
        emailSubjectLine: emailTexts.subjectLine || sc.emailSubjectLine,
        emailHookText: emailTexts.hookText || sc.emailHookText,
        emailCtaText: emailTexts.ctaText || sc.emailCtaText,
        emailOfferText: emailTexts.offerText || sc.emailOfferText,
        // updatedAt will be set in the comprehensive update below
      };

      let finalNodesList: Node<any>[] = [];

      // Use functional update for setNodes to ensure atomicity and get the latest state for snapshotting
      setNodes(currentNodesState => {
        // Filter out any existing email preview nodes
        const nodesWithoutOldEmail = currentNodesState.filter(n => n.type !== 'emailPreview');

        // Determine position for the new email node based on the filtered list
        let emailNodeX = 50;
        let emailNodeY = -800;
        const baseNodesForPositioning = nodesWithoutOldEmail;

        if (baseNodesForPositioning.length > 0) {
          const firstNode = baseNodesForPositioning.find(n => n.type === 'trigger') || baseNodesForPositioning[0];
          if (firstNode) {
            emailNodeX = firstNode.position.x;
            emailNodeY = firstNode.position.y - 800; // Position above the first node
          } else {
            // Fallback if no trigger/first node, though less likely with actual scenarios
            const avgX = baseNodesForPositioning.reduce((sum, node) => sum + node.position.x, 0) / baseNodesForPositioning.length;
            const avgY = baseNodesForPositioning.reduce((sum, node) => sum + node.position.y, 0) / baseNodesForPositioning.length;
            emailNodeX = avgX;
            emailNodeY = avgY - 800;
          }
        }       
        const snappedPos = snapToGrid(emailNodeX, emailNodeY);

        const newEmailNodeId = `email-preview-${nanoid(6)}`;
        const newEmailNodeToAdd: Node<EmailPreviewNodeData, 'emailPreview'> = {
          id: newEmailNodeId,
          type: 'emailPreview',
          position: snappedPos,
          data: {
            nodeTitle: `Email for: ${sc.name || 'Scenario'}`, // Updated title
            firstName: sc.emailFirstName || '[FIRST NAME]',
            yourName: sc.emailYourName || '[YOUR NAME]',
            yourCompany: sc.emailYourCompany || '[YOUR COMPANY]',
            yourEmail: sc.emailYourEmail || '[YOUR_EMAIL]',
            calendlyLink: sc.emailCalendlyLink || 'https://calendly.com/your-link',
            pdfLink: sc.emailPdfLink || 'https://example.com/roi.pdf',
            subjectLine: emailTexts.subjectLine || sc.emailSubjectLine || 'Streamline Your Workflow & See Immediate ROI',
            hookText: emailTexts.hookText || sc.emailHookText || 'Default hook text...',
            ctaText: emailTexts.ctaText || sc.emailCtaText || 'Default CTA text...',
            offerText: emailTexts.offerText || sc.emailOfferText || 'Default offer text...',
            stats: { 
              roiX: Math.round((roiDataPayload.roiRatio || 0) * 100),
              payback: roiDataPayload.paybackPeriod,
              runs: roiDataPayload.runsPerMonth || 0,
            }
          },
          draggable: true,
          selectable: true,
        };
        finalNodesList = [...nodesWithoutOldEmail, newEmailNodeToAdd];
        console.log("[BuildPage] Constructed finalNodesList inside setNodes callback:", finalNodesList.length);
        return finalNodesList; // This updates React Flow's internal state
      });

      // Now, explicitly update the currentScenario state and Dexie 
      // with BOTH email text AND the new nodesSnapshot.
      const comprehensiveScenarioUpdate: Partial<Scenario> = {
        ...updatedEmailFields,
        nodesSnapshot: finalNodesList, // Use the definitive list of nodes captured from setNodes' functional update
        updatedAt: Date.now(), // Single update timestamp for this operation
      };

      await db.scenarios.update(sc.id!, comprehensiveScenarioUpdate);
      setCurrentScenario(prev => prev ? { ...prev, ...comprehensiveScenarioUpdate } : null);
      console.log("[BuildPage] Scenario updated in DB and local state with new email texts AND new nodesSnapshot.");

      // The canvas sync useEffect will still run when `nodes` or `currentScenario` changes.
      // The `isManipulatingNodesProgrammatically` flag protects the `loadScenarioDataToState` useEffect.

      setTimeout(() => { // Fit view after state updates have likely propagated
        if (rfInstance) {
          console.log("[BuildPage] Calling fitView on rfInstance after adding email node.");
          rfInstance.fitView({ padding: 0.15, includeHiddenNodes: false, duration: 600 });
          
          // After fitView, the viewport has changed. We should save this new viewport.
          const newViewport = rfInstance.getViewport();
          const viewportUpdatePayload: Partial<Scenario> = { viewport: newViewport, updatedAt: Date.now() };
          db.scenarios.update(sc.id!, viewportUpdatePayload);
          setCurrentScenario(prev => prev ? { ...prev, ...viewportUpdatePayload } : null);
          console.log("[BuildPage] Updated scenario with new viewport after fitView.");

        } else {
          console.warn("[BuildPage] rfInstance not available for fitView call after adding email node.");
        }
      }, 250); // Slightly longer timeout to ensure DOM update and rfInstance is ready

    } catch (error) {
      console.error("[BuildPage] Error generating email on canvas:", error);
      alert(`Error generating email on canvas: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setIsManipulatingNodesProgrammatically(false);
      console.log("[BuildPage] Finished email generation attempt.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScenario, rfInstance, setNodes, setIsLoading, setCurrentScenario]); // Removed `nodes` from here as direct dep, it's accessed via functional update to setNodes

  const handleUpdateEmailNodeData = useCallback((nodeId: string, data: Partial<EmailPreviewNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId && node.type === 'emailPreview'
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
    // This change will eventually be picked up by the canvas sync effect to update Dexie
  }, [setNodes]);

  const handleGenerateEmailSectionAI = useCallback(
    async (
      nodeId: string,
      section: 'hook' | 'cta' | 'offer' | 'subject',
      promptType: string, // This will be like 'time_cost_hook', 'direct_cta' etc.
      currentText: string
    ) => {
      if (!currentScenario) {
        alert("No active scenario selected.");
        return;
      }
      setIsGeneratingAIContent(true);
      try {
        const sc = currentScenario;
        const timeValue = calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0);
        const riskValue = calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0);
        const revenueValue = calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0);
        const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
        const platformCostValue = calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0);
        const netROIValue = calculateNetROI(totalValue, platformCostValue);
        const roiRatioValue = calculateROIRatio(totalValue, platformCostValue);
        const platformData = pricing[sc.platform || 'zapier'];
        const baseMonthlyCost = platformData.tiers[0]?.monthlyUSD || platformCostValue;
        const paybackPeriodDays = calculatePaybackPeriod(baseMonthlyCost, netROIValue);

        const roiDataPayload = {
          scenarioName: sc.name,
          timeValue,
          platformCost: platformCostValue,
          netROI: netROIValue,
          roiRatio: roiRatioValue,
          paybackPeriod: formatPaybackPeriod(paybackPeriodDays),
          runsPerMonth: sc.runsPerMonth,
          minutesPerRun: sc.minutesPerRun,
          platform: sc.platform,
          nodeCount: sc.nodesSnapshot?.length || 0,
        };

        // Map promptType (e.g., 'time_cost_hook') to a more general system prompt for the API
        let systemPrompt = "Rewrite the following email section."; // Default
        if (promptType.includes('subject')) systemPrompt = `Rewrite this email subject line. Style: ${promptType.split('_')[0]}.`;
        else if (promptType.includes('hook')) systemPrompt = `Rewrite this email hook section. Style: ${promptType.split('_')[0]}.`;
        else if (promptType.includes('cta')) systemPrompt = `Rewrite this email CTA section. Style: ${promptType.split('_')[0]}.`;
        else if (promptType.includes('offer')) systemPrompt = `Rewrite this email offer section. Style: ${promptType.split('_')[0]}.`;
        
        const response = await fetch('/api/openai/generate-email-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roiData: roiDataPayload,
            textToRewrite: currentText,
            systemPrompt,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`AI section generation failed: ${response.status} ${errorBody}`);
        }
        const result = await response.json();
        
        // Update the specific field in the email node's data
        const fieldToUpdate = section === 'subject' ? 'subjectLine' : section + 'Text';
        handleUpdateEmailNodeData(nodeId, { [fieldToUpdate]: result.generatedText });

      } catch (error) {
        console.error("Error generating AI content for email node:", error);
        alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsGeneratingAIContent(false);
      }
    },
    [currentScenario, handleUpdateEmailNodeData]
  );

  // Moved the loading return to before the main return, after all hooks
  if (isLoading && !currentScenario && !scenarioIdParam) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your automation canvas...</p>
      </div>
    );
  }

  console.log("[BuildPage Render] Passing to FlowCanvas - Nodes:", nodes.length, "Edges:", edges.length);

  return (
    <ReactFlowProvider>
      <DndContext
        sensors={sensors}
        modifiers={[snapToGridModifier]}
        onDragEnd={handleDragEnd}
        collisionDetection={pointerWithin}
      >
        <div className="flex h-screen w-full flex-col overflow-hidden" data-page="build">
          {/* Header */}
          <header className="flex items-center justify-between border-b bg-background/60 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Apicus.io</h1>
              {!isMobileOrTablet && (
                <StatsBar 
                  platform={platform}
                  runsPerMonth={runsPerMonth}
                  minutesPerRun={minutesPerRun}
                  hourlyRate={hourlyRate}
                  taskMultiplier={taskMultiplier}
                  onUpdateMinutes={(minutes) => {
                    setMinutesPerRun(minutes);
                    updateCurrentScenarioROI({ minutesPerRun: minutes });
                  }}
                  onUpdateRuns={(runs) => {
                    setRunsPerMonth(runs);
                    updateCurrentScenarioROI({ runsPerMonth: runs });
                  }}
                  nodes={nodes} // Pass nodes for platform cost calculation
                  currentScenario={currentScenario} // Pass currentScenario for risk/revenue values
                />
              )}
            </div>
            {isMobileOrTablet ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <PlatformSwitcher value={platform} onChange={(newPlatform) => {
                        setPlatform(newPlatform);
                        updateCurrentScenarioROI({ platform: newPlatform });
                    }} />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoiOpen(true)}>
                    <Coins className="mr-2 h-4 w-4" />
                    ROI Settings
                  </DropdownMenuItem>
                  {isMultiSelectionActive && selectedIds.length > 0 && (
                    <DropdownMenuItem onClick={createGroupFromSelection}>
                      <Calculator className="mr-2 h-4 w-4" />
                      Group ({selectedIds.length})
                    </DropdownMenuItem>
                  )}
                  {selectedGroupId && (
                    <DropdownMenuItem onClick={ungroupSelection}>
                      {/* Add appropriate icon for ungroup if available */}
                      Ungroup
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAddNode(setNodes, nodes)}>
                    + Add Node
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateEmailOnCanvas}>
                    <Mail className="mr-2 h-4 w-4" />
                    Generate Email on Canvas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <PlatformSwitcher value={platform} onChange={(newPlatform) => {
                    setPlatform(newPlatform);
                    updateCurrentScenarioROI({ platform: newPlatform });
                }} />
                <Button size="icon" variant="ghost" onClick={() => setRoiOpen(true)} title="ROI Settings">
                  <Coins className="h-4 w-4" />
                </Button>
                
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
                <Button size="sm" variant="outline" onClick={handleGenerateEmailOnCanvas} title="Generate Email on Canvas">
                    <Mail className="mr-2 h-4 w-4" />
                    Email to Canvas
                </Button>
              </div>
            )}
          </header>

          {/* Mobile/Tablet StatsBar (below header) */}
          {isMobileOrTablet && (
            <div className="px-4 py-2 border-b bg-background/60 backdrop-blur">
              <StatsBar 
                platform={platform}
                runsPerMonth={runsPerMonth}
                minutesPerRun={minutesPerRun}
                hourlyRate={hourlyRate}
                taskMultiplier={taskMultiplier}
                onUpdateMinutes={(minutes) => {
                  setMinutesPerRun(minutes);
                  updateCurrentScenarioROI({ minutesPerRun: minutes });
                }}
                onUpdateRuns={(runs) => {
                  setRunsPerMonth(runs);
                  updateCurrentScenarioROI({ runsPerMonth: runs });
                }}
                nodes={nodes}
                currentScenario={currentScenario}
              />
            </div>
          )}

          {/* Main content row */}
          <div className="flex flex-grow relative">
            <Toolbox 
              onLoadScenario={handleLoadScenario} 
              activeScenarioId={scenarioId} 
              emailNodes={emailNodesForToolbox} // Pass email nodes
              onFocusNode={focusOnNode} // Pass focus callback
            />
            
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultViewport={currentScenario?.viewport || { x:0, y:0, zoom:1}}
              onMoveEnd={handleMoveEnd}
              onInit={(instance) => setRfInstance(instance as ReactFlowInstance)}
              setWrapperRef={(node) => {
                reactFlowWrapper.current = node;
                setDroppableRef(node);
              }}
              // Title editing props
              currentScenarioName={currentScenario?.name}
              isEditingTitle={isEditingTitle}
              editingScenarioName={editingScenarioName}
              onToggleEditTitle={setIsEditingTitle}
              onScenarioNameChange={setEditingScenarioName}
              onSaveScenarioName={saveScenarioName}
              onScenarioNameKeyDown={handleScenarioNameKeyDown}
              titleInputRef={titleInputRef}
            />
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
            <EmailNodePropertiesPanel
              selectedNode={selectedEmailNode}
              onClose={() => setSelectedEmailNodeId(null)}
              onUpdateNodeData={handleUpdateEmailNodeData}
              onGenerateSection={handleGenerateEmailSectionAI}
              isGeneratingAIContent={isGeneratingAIContent}
            />
          </div>
        </div>

        <ROISettingsPanel
          open={roiOpen}
          onOpenChange={setRoiOpen}
          platform={platform}
          runsPerMonth={runsPerMonth}
          setRunsPerMonth={(value) => { setRunsPerMonth(value); updateCurrentScenarioROI({ runsPerMonth: value }); }}
          minutesPerRun={minutesPerRun}
          setMinutesPerRun={(value) => { setMinutesPerRun(value); updateCurrentScenarioROI({ minutesPerRun: value }); }}
          hourlyRate={hourlyRate}
          setHourlyRate={(value) => { setHourlyRate(value); updateCurrentScenarioROI({ hourlyRate: value }); }}
          taskMultiplier={taskMultiplier}
          setTaskMultiplier={(value) => { setTaskMultiplier(value); updateCurrentScenarioROI({ taskMultiplier: value }); }}
          taskType={taskType}
          setTaskType={(value) => { setTaskType(value); updateCurrentScenarioROI({ taskMultiplier: taskTypeMultipliers[value as keyof typeof taskTypeMultipliers] }); }}
          complianceEnabled={complianceEnabled}
          setComplianceEnabled={(value) => { setComplianceEnabled(value); updateCurrentScenarioROI({ complianceEnabled: value }); }}
          revenueEnabled={revenueEnabled}
          setRevenueEnabled={(value) => { setRevenueEnabled(value); updateCurrentScenarioROI({ revenueEnabled: value }); }}
          riskLevel={riskLevel}
          setRiskLevel={(value) => { setRiskLevel(value); updateCurrentScenarioROI({ riskLevel: value }); }}
          riskFrequency={riskFrequency}
          setRiskFrequency={(value) => { setRiskFrequency(value); updateCurrentScenarioROI({ riskFrequency: value }); }}
          errorCost={errorCost}
          setErrorCost={(value) => { setErrorCost(value); updateCurrentScenarioROI({ errorCost: value }); }}
          monthlyVolume={monthlyVolume}
          setMonthlyVolume={(value) => { setMonthlyVolume(value); updateCurrentScenarioROI({ monthlyVolume: value }); }}
          conversionRate={conversionRate}
          setConversionRate={(value) => { setConversionRate(value); updateCurrentScenarioROI({ conversionRate: value }); }}
          valuePerConversion={valuePerConversion}
          setValuePerConversion={(value) => { setValuePerConversion(value); updateCurrentScenarioROI({ valuePerConversion: value }); }}
          taskTypeMultipliers={taskTypeMultipliers}
          benchmarks={benchmarks}
          updateScenarioROI={updateCurrentScenarioROI}
        />
        <AlternativeTemplatesSheet 
          alternatives={alternativeTemplates.map(altScenario => ({
              templateId: altScenario.originalTemplateId,
              title: altScenario.name,
              platform: altScenario.platform as string,
              description: (altScenario as any).description,
              nodesCount: altScenario.nodesSnapshot?.length || 0,
              ...altScenario 
          } as AlternativeTemplateForDisplay))}
          currentSearchQuery={currentScenario?.searchQuery}
          onSelectAlternative={handleSelectAlternative}
          onFindNewAlternatives={handleFindNewAlternatives}
          isLoadingAlternatives={isLoadingAlternatives}
        />
      </DndContext>
    </ReactFlowProvider>
  );
} 