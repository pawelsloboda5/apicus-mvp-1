"use client";

import { Suspense } from 'react';
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
import { db, createScenario, type Scenario } from "@/lib/db";
import { PixelNode } from "@/components/flow/PixelNode";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import dynamic from "next/dynamic";
import { pricing } from "../api/data/pricing";
import { Loader2, PlayCircle, Sparkles, GitBranch, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem } from "lucide-react";
import { nanoid } from "nanoid";
import { useDroppable } from "@dnd-kit/core";
import { useTheme } from "next-themes";

// Import custom components
import { StatsBar } from "@/components/flow/StatsBar";
import { NodePropertiesPanel } from "@/components/flow/NodePropertiesPanel";
import { ROISettingsPanel } from "@/components/roi/ROISettingsPanel";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { NodeGroup } from "@/components/flow/NodeGroup";
import { GroupPropertiesPanel } from "@/components/flow/GroupPropertiesPanel";
import { AlternativeTemplatesSheet, type AlternativeTemplateForDisplay } from "@/components/flow/AlternativeTemplatesSheet";
import { EmailPreviewNode, type EmailPreviewNodeData } from "@/components/flow/EmailPreviewNode";
// EmailNodePropertiesPanel removed - using inline editing
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

// Import utility functions
import { snapToGrid } from "@/lib/flow-utils";
import {
  calculateNodeTimeSavings,
  calculateTimeValue,
  calculateRiskValue,
  calculateRevenueValue,
  calculateTotalValue,
  calculatePlatformCost,
  calculateNetROI,
  calculateROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod
} from "@/lib/roi-utils";
import { PlatformType as LibPlatformType, NodeType, NodeData } from "@/lib/types";
import { captureROISnapshot, shouldCaptureSnapshot } from "@/lib/metrics-utils";

// Import the mobile toolbox trigger
const MobileToolboxTrigger = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.MobileToolboxTrigger), {
  ssr: false,
});

// Import the mobile alternative templates button
const MobileAlternativeTemplatesButton = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.MobileAlternativeTemplatesButton), {
  ssr: false,
});

// Import ROI Report Node
import { ROIReportNode } from "@/components/flow/ROIReportNode";

// Disable SSR for Toolbox because dnd-kit generates ids non-deterministically, which causes hydration mismatch warnings.
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

// nodeTypes will be created inside the component to have access to handlers

const edgeTypes = {
  custom: CustomEdge,
};

// Move the main component logic into a separate component
function BuildPageContent() {
  const router = useRouter();
  const params = useSearchParams(); // This is now inside Suspense
  const scenarioIdParam = params.get("sid");
  const templateIdParam = params.get("tid");
  const queryParam = params.get("q");
  const importParam = params.get("import");
  const { setTheme } = useTheme();

  // Force light mode when entering the canvas
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [alternativeTemplates, setAlternativeTemplates] = useState<Scenario[]>([]);
  const [platform, setPlatform] = useState<LibPlatformType>("zapier");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, unknown>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<Record<string, unknown>>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ReactFlow instance & wrapper ref
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // droppable for canvas
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ 
    id: "canvas",
    data: {
      accepts: ['tool-trigger', 'tool-action', 'tool-decision']
    }
  });

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
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure client-side only operations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // After existing imports, add:
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiSelectionActive, setIsMultiSelectionActive] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // Removed selectedEmailNodeId - no longer needed with inline editing
  const [isManipulatingNodesProgrammatically, setIsManipulatingNodesProgrammatically] = useState(false);
  // Removed isGeneratingAIContent - no longer needed with inline editing
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Add state for selected node type
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<'canvas' | 'analytics'>('canvas');
  
  // Add state for tracking previous scenario for metric comparison
  const [previousScenario, setPreviousScenario] = useState<Scenario | null>(null);
  const [previousNodeCount, setPreviousNodeCount] = useState<number>(0);
  
  // Track previous scenario ID for preventing unnecessary reloads
  const prevScenarioIdRef = useRef<number | null>(null);

  // State for drag and drop
  const [activeDragItem, setActiveDragItem] = useState<{ id: string; type: string } | null>(null);
  // State for screen size detection for responsive header
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingScenarioName, setEditingScenarioName] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
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

  // Add event listener for email node properties button clicks
  useEffect(() => {
    // Email node properties handling removed - using inline editing now
  }, []);
  
  // Add keyboard shortcuts for tab switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl + number combinations
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setActiveTab('canvas');
            break;
          case '2':
            event.preventDefault();
            setActiveTab('analytics');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const saveScenarioName = async () => {
    if (currentScenario && currentScenario.id && editingScenarioName.trim() !== "") {
      const newName = editingScenarioName.trim();
      // Add type guard here
      if (currentScenario.id) {
        await db.scenarios.update(currentScenario.id, { name: newName, updatedAt: Date.now() });
        setCurrentScenario(prev => prev ? { ...prev, name: newName, updatedAt: Date.now() } : null);
      }
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

    const loadedNodes = (scenario.nodesSnapshot as Node<Record<string, unknown>>[] || []).map(node => {
      // Don't add functions to node data as they can't be saved to IndexedDB
      // The click handling should be done at the component level instead
      return node;
    });
    
    setNodes(loadedNodes);
    setEdges(scenario.edgesSnapshot as Edge<Record<string, unknown>>[] || []);
    if (rfInstance && scenario.viewport) {
      rfInstance.setViewport(scenario.viewport as Viewport);
    } else if (rfInstance) {
      // Default viewport if none in scenario
      rfInstance.setViewport({ x: 0, y: 0, zoom: 1});
    }
    setCurrentScenario(scenario);
  }, [rfInstance, setNodes, setEdges]);

  // Persist relevant parts of currentScenario when ROI inputs change
  const updateCurrentScenarioROI = useCallback(
    async (partial: Partial<Scenario>) => {
      if (!currentScenario || !currentScenario.id) return;
      
      const scenarioId = currentScenario.id; // Capture ID for closure
      
      // Check if we should capture a snapshot
      const updatedScenario = { ...currentScenario, ...partial };
      const currentNodeCount = nodes.length;
      
      if (shouldCaptureSnapshot(previousScenario, updatedScenario, previousNodeCount, currentNodeCount)) {
        // Determine trigger type
        let trigger: 'manual' | 'save' | 'platform_change' | 'major_edit' = 'major_edit';
        if (partial.platform && partial.platform !== currentScenario.platform) {
          trigger = 'platform_change';
        }
        
        // Capture the snapshot
        await captureROISnapshot(updatedScenario, nodes, trigger);
      }
      
      // Update state - BUT USE A TIMEOUT TO BREAK THE SYNC CYCLE
      const updatedFields = { ...partial, updatedAt: Date.now() };
      
      // Use setTimeout to avoid synchronous state updates that cause loops
      setTimeout(() => {
        setCurrentScenario(prev => {
          setPreviousScenario(prev); // Track previous state
          return prev ? { ...prev, ...updatedFields } : null;
        });
        setPreviousNodeCount(currentNodeCount);
      }, 0);
      
      // Persist to database immediately (don't wait for state update)
      db.scenarios.update(scenarioId, updatedFields);
    },
    [currentScenario, nodes, previousScenario, previousNodeCount]
  );

  // Ensure a Scenario exists (or load existing one)
  useEffect(() => {
    // Skip on server-side rendering or before mount
    if (typeof window === 'undefined' || !isMounted) {
      return;
    }
    
    setIsLoading(true);
    async function manageScenario() {
      console.log('[Build] manageScenario called with params:', {
        scenarioIdParam,
        templateIdParam,
        queryParam,
        importParam
      });
      
      let activeScenarioIdToLoad: number | null = scenarioIdParam ? Number(scenarioIdParam) : null;
      let scenarioToLoad: Scenario | undefined;
      let primaryTemplateData: {
        title?: string;
        nodes?: Array<{
          reactFlowId: string;
          type: string;
          position: { x: number; y: number };
          data: Record<string, unknown>;
        }>;
        edges?: Array<{
          reactFlowId: string;
          data?: { source?: string; target?: string };
          label?: string;
        }>;
        platform?: string;
        source?: string;
      } | null = null;

      if (activeScenarioIdToLoad) {
        scenarioToLoad = await db.scenarios.get(activeScenarioIdToLoad);
      }

      if (scenarioToLoad) {
        setScenarioId(activeScenarioIdToLoad);
      } else {
        // No valid sid or scenario not found, create a new one
        const newName = templateIdParam ? "Loading Template..." : (queryParam ? `Search: ${queryParam}` : (importParam === 'session' ? "Imported Workflow" : "Untitled Scenario"));
        const newId = await createScenario(newName);
        setScenarioId(newId);
        activeScenarioIdToLoad = newId;
        
        // If importing, set platform to 'make' 
        if (importParam === 'session') {
          await db.scenarios.update(newId, { platform: 'make' });
        }
        
        scenarioToLoad = await db.scenarios.get(newId); // Fetch the newly created scenario

        const urlQuery = new URLSearchParams(window.location.search);
        urlQuery.set("sid", String(newId));
        if (templateIdParam) urlQuery.set("tid", templateIdParam);
        if (queryParam) urlQuery.set("q", queryParam); // Persist q
        // Don't remove import param yet - it's needed for processing
        // Only replace history if scenarioIdParam was missing or invalid
        if (!scenarioIdParam || scenarioIdParam !== String(newId)) {
            router.replace(`/build?${urlQuery.toString()}`, { scroll: false });
        }
      }
      
      // Moved setCurrentScenario and template loading logic to after this block
      // to ensure scenarioId state is set first.
      
      console.log('[Import] Current state:', {
        importParam,
        scenarioIdParam,
        activeScenarioIdToLoad,
        hasNodes: scenarioToLoad?.nodesSnapshot?.length || 0
      });

      // Handle imported workflow from sessionStorage
      if (importParam === 'session' && scenarioToLoad && activeScenarioIdToLoad && (!scenarioToLoad.nodesSnapshot || scenarioToLoad.nodesSnapshot.length === 0)) {
        console.log('[Import] Checking for imported template in sessionStorage...');
        try {
          // Ensure we're on the client side before accessing sessionStorage
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const importedTemplateStr = sessionStorage.getItem('importedTemplate');
            if (importedTemplateStr) {
              console.log('[Import] Found template in sessionStorage, parsing...');
              primaryTemplateData = JSON.parse(importedTemplateStr);
              console.log('[Import] Parsed template:', primaryTemplateData);
              sessionStorage.removeItem('importedTemplate'); // Clean up
            } else {
              console.log('[Import] No template found in sessionStorage');
            }
          }
        } catch (err) {
          console.error('Failed to load imported template:', err);
        }
      }

      // Fetch primary template if tid is present AND scenario lacks nodes/edges (i.e., needs initialization)
      else if (templateIdParam && scenarioToLoad && activeScenarioIdToLoad && (!scenarioToLoad.nodesSnapshot || scenarioToLoad.nodesSnapshot.length === 0)) {
        try {
          const res = await fetch(`/api/templates/${templateIdParam}`);
          if (!res.ok) throw new Error("Primary template fetch failed");
          primaryTemplateData = await res.json();

          if (primaryTemplateData && primaryTemplateData.nodes && primaryTemplateData.edges && activeScenarioIdToLoad) {
            const updatedScenarioData: Partial<Scenario> = {
              name: primaryTemplateData.title || scenarioToLoad.name,
              nodesSnapshot: primaryTemplateData.nodes.map((n) => ({
                id: n.reactFlowId, type: n.type, position: n.position, data: n.data,
              })),
              edgesSnapshot: primaryTemplateData.edges.map((e) => ({
                id: e.reactFlowId, source: e.data?.source, target: e.data?.target, label: e.label, data: e.data, type: 'custom',
              })),
              platform: (primaryTemplateData.platform || primaryTemplateData.source || scenarioToLoad.platform) as LibPlatformType,
              originalTemplateId: templateIdParam,
              searchQuery: queryParam || scenarioToLoad.searchQuery,
              updatedAt: Date.now(),
            };
            await db.scenarios.update(activeScenarioIdToLoad, updatedScenarioData);
            scenarioToLoad = { ...scenarioToLoad, ...updatedScenarioData } as Scenario;
          }
        } catch {
          // Fix this too
          if (activeScenarioIdToLoad) {
            await db.scenarios.update(activeScenarioIdToLoad, { name: scenarioToLoad?.name || "Error Loading Template" });
          }
        }
      } else if (templateIdParam && scenarioToLoad) {
      }
      
      // Process primaryTemplateData if it was loaded from import
      if (primaryTemplateData && primaryTemplateData.nodes && primaryTemplateData.edges && activeScenarioIdToLoad) {
        console.log('[Import] Processing imported template data...');
        
        // Define proper types for template data
        interface TemplateNode {
          reactFlowId: string;
          type: string;
          position: { x: number; y: number };
          data: Record<string, unknown>;
        }
        
        interface TemplateEdge {
          reactFlowId: string;
          data?: { source?: string; target?: string };
          source?: string;
          target?: string;
          label?: string;
        }
        
        interface TemplateDataWithId {
          title?: string;
          nodes?: TemplateNode[];
          edges?: TemplateEdge[];
          platform?: string;
          source?: string;
          templateId?: string;
        }
        
        const updatedScenarioData: Partial<Scenario> = {
          name: primaryTemplateData.title || scenarioToLoad?.name || "Imported Workflow",
          nodesSnapshot: primaryTemplateData.nodes.map((n: TemplateNode) => ({
            id: n.reactFlowId, type: n.type, position: n.position, data: n.data,
          })),
          edgesSnapshot: primaryTemplateData.edges.map((e: TemplateEdge) => ({
            id: e.reactFlowId, source: e.data?.source || e.source, target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom',
          })),
          platform: (primaryTemplateData.platform || primaryTemplateData.source || scenarioToLoad?.platform || "make") as LibPlatformType,
          originalTemplateId: (primaryTemplateData as TemplateDataWithId).templateId || importParam || undefined,
          searchQuery: queryParam || scenarioToLoad?.searchQuery,
          updatedAt: Date.now(),
        };
        console.log('[Import] Updating scenario with:', updatedScenarioData);
        await db.scenarios.update(activeScenarioIdToLoad, updatedScenarioData);
        scenarioToLoad = { ...scenarioToLoad, ...updatedScenarioData } as Scenario;
        
        // Clean up the URL after successful import
        if (importParam === 'session') {
          const cleanUrl = new URLSearchParams(window.location.search);
          cleanUrl.delete("import");
          router.replace(`/build?${cleanUrl.toString()}`, { scroll: false });
        }
      }
      
      // Set currentScenario here after all potential modifications
      // This will trigger the useEffect that depends on currentScenario to load data to state
      setCurrentScenario(scenarioToLoad || null); 

      // Fetch alternative templates if queryParam exists
      if (queryParam && activeScenarioIdToLoad && scenarioToLoad) {
        try {
          const res = await fetch(`/api/templates/search?q=${encodeURIComponent(queryParam)}`);
          if (!res.ok) throw new Error("Alternative templates fetch failed");
          const data: {
            templates?: Array<{
              templateId: string;
              title?: string;
              platform?: string;
              source?: string;
              nodes?: Array<{
                reactFlowId?: string;
                id?: string;
                type: string;
                position: { x: number; y: number };
                data: Record<string, unknown>;
              }>;
              edges?: Array<{
                reactFlowId?: string;
                id?: string;
                source?: string;
                target?: string;
                label?: string;
                data?: Record<string, unknown>;
              }>;
              description?: string;
            }>;
          } = await res.json();
          if (data.templates && Array.isArray(data.templates)) {
            const primaryTemplateIdToExclude = scenarioToLoad.originalTemplateId;
            // Map API results to Scenario-like objects for the state
            const scenariosFromTemplates: Scenario[] = data.templates
              .filter((t: { templateId: string }) => t.templateId !== primaryTemplateIdToExclude)
              .slice(0, 5)
              .map((t: {
                templateId: string;
                title?: string;
                platform?: string;
                source?: string;
                nodes?: Array<{
                  reactFlowId?: string;
                  id?: string;
                  type: string;
                  position: { x: number; y: number };
                  data: Record<string, unknown>;
                }>;
                edges?: Array<{
                  reactFlowId?: string;
                  id?: string;
                  source?: string;
                  target?: string;
                  label?: string;
                  data?: Record<string, unknown>;
                }>;
                description?: string;
              }) => ({
                slug: nanoid(8), // Generate a new slug for this representation
                name: t.title || "Alternative",
                createdAt: Date.now(), // Set creation/update times
                updatedAt: Date.now(),
                platform: (t.platform || t.source || "zapier") as LibPlatformType,
                nodesSnapshot: t.nodes?.map((n) => ({ id: n.reactFlowId || n.id, type: n.type, position: n.position, data: n.data })) || [],
                edgesSnapshot: t.edges?.map((e) => ({ id: e.reactFlowId || e.id, source: e.data?.source || e.source, target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom' })) || [],
                originalTemplateId: t.templateId,
                searchQuery: queryParam || "", // Use queryParam here
                // description: t.description, // Scenario type doesn't have description by default
                // Explicitly add any other Scenario fields if needed, otherwise they are undefined
                // Default ROI params for these Scenario-like objects if not provided by template
                runsPerMonth: 250, minutesPerRun: 3, hourlyRate: 30, taskMultiplier: 1.5, taskType: "general",
                complianceEnabled: false, revenueEnabled: false, riskLevel:3, riskFrequency:5, errorCost:500, monthlyVolume:100, conversionRate:5, valuePerConversion:200, 
              }));        

            setAlternativeTemplates(scenariosFromTemplates); // This should now be compatible with Scenario[]

            const altsCacheForDb: Array<{
              templateId?: string;
              title: string;
              platform: string;
              nodesCount: number;
              description?: string;
            }> = scenariosFromTemplates.map(s => ({
              templateId: s.originalTemplateId,
              title: s.name,
              platform: s.platform || 'zapier',
              nodesCount: s.nodesSnapshot?.length || 0,
              description: (s as { description?: string }).description
            }));

            if (scenarioToLoad && scenarioToLoad.id) {
              await db.scenarios.update(scenarioToLoad.id, { alternativeTemplatesCache: altsCacheForDb, updatedAt: Date.now(), searchQuery: queryParam });
              // Don't update state here - let the main setCurrentScenario at the end handle it
            }
          }
        } catch {
          setAlternativeTemplates([]); // Clear on error
          if (scenarioToLoad && scenarioToLoad.id) {
            // Corrected variable name here
            await db.scenarios.update(scenarioToLoad.id, { alternativeTemplatesCache: [], updatedAt: Date.now() });
            // Don't update state here - let the main setCurrentScenario at the end handle it
          }
        }
      }
      setIsLoading(false);
    }
    manageScenario();
  }, [scenarioIdParam, templateIdParam, queryParam, router, importParam, isMounted]); // Added router and isMounted to dependencies

  // Load scenario data once rfInstance is available AND currentScenario is set
  useEffect(() => {
    if (rfInstance && currentScenario) {
      // Don't reload if we're in the middle of programmatic node manipulation
      if (isManipulatingNodesProgrammatically) {
        return;
      }
      
      // Check if this is just an ROI update (not a scenario switch or initial load)
      const isScenarioSwitch = prevScenarioIdRef.current !== currentScenario.id;
      prevScenarioIdRef.current = currentScenario.id || null;
      
      // Only load scenario data if:
      // 1. It's a scenario switch (different ID)
      // 2. Or nodes are empty (initial load)
      // 3. Or there's no nodes/edges in memory but scenario has them
      const shouldLoadFromDb = isScenarioSwitch || 
        (nodes.length === 0 && edges.length === 0 && currentScenario.nodesSnapshot && currentScenario.nodesSnapshot.length > 0);
      
      if (shouldLoadFromDb) {
        loadScenarioDataToState(currentScenario);
      } else {
        // Just update ROI parameters without touching nodes/edges
        setPlatform(currentScenario.platform || "zapier");
        setRunsPerMonth(currentScenario.runsPerMonth || 250);
        setMinutesPerRun(currentScenario.minutesPerRun || 3);
        setHourlyRate(currentScenario.hourlyRate || 30);
        setTaskMultiplier(currentScenario.taskMultiplier || 1.5);
        setTaskType(currentScenario.taskType || "general");
        setComplianceEnabled(currentScenario.complianceEnabled || false);
        setRevenueEnabled(currentScenario.revenueEnabled || false);
        setRiskLevel(currentScenario.riskLevel || 3);
        setRiskFrequency(currentScenario.riskFrequency || 5);
        setErrorCost(currentScenario.errorCost || 500);
        setMonthlyVolume(currentScenario.monthlyVolume || 100);
        setConversionRate(currentScenario.conversionRate || 5);
        setValuePerConversion(currentScenario.valuePerConversion || 200);
      }
    } else if (rfInstance && !currentScenario && scenarioId) {
      if (isManipulatingNodesProgrammatically) {
        return; // Guard against re-loading while programmatically changing nodes
      }
      db.scenarios.get(scenarioId).then(fetchedScenario => {
        if (fetchedScenario) {
          setCurrentScenario(fetchedScenario); // This will re-trigger this effect
        } else {
          // Handle case where scenarioId is invalid or scenario deleted elsewhere
          loadScenarioDataToState(null); 
          router.replace('/build'); // Navigate to a clean build page
        }
      });
    }
  }, [rfInstance, currentScenario, scenarioId, loadScenarioDataToState, router, isManipulatingNodesProgrammatically, nodes.length, edges.length]);

  // Canvas State Sync Effect (Saving nodes/edges/viewport to Dexie for the currentScenario.id)
  useEffect(() => {
    if (!currentScenario || !currentScenario.id || !rfInstance) return;
    // Avoid saving an empty canvas over a loaded scenario during the initial loading phase
    if (isLoading && (nodes.length === 0 && edges.length === 0 && !currentScenario.nodesSnapshot?.length)) return;
    // Don't save if we're manipulating nodes programmatically
    if (isManipulatingNodesProgrammatically) {
      return;
    }

    // Debounce the save operation to prevent rapid saves during node manipulation
    const saveTimeout = setTimeout(() => {
      // Double-check the manipulation flag after timeout
      if (isManipulatingNodesProgrammatically) {
        return;
      }
      
      const flowObject = rfInstance.toObject();
      
      // Clean function references from nodes before saving
      const cleanedNodes = flowObject.nodes.map(node => {
        if (node.type === 'emailPreview' && node.data && typeof node.data === 'object') {
          // Remove non-serializable properties like functions
          const nodeData = node.data as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { onOpenNodeProperties, ...cleanData } = nodeData;
          return { ...node, data: cleanData };
        }
        if (node.type === 'roiReport' && node.data && typeof node.data === 'object') {
          // Remove non-serializable properties like functions from ROI report nodes
          const nodeData = node.data as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { onGenerateReport, onRegenerateSection, ...cleanData } = nodeData;
          return { ...node, data: cleanData };
        }
        return node;
      });
      
      // Determine if there has been a meaningful change to content or viewport
      const nodesChanged = JSON.stringify(cleanedNodes) !== JSON.stringify(currentScenario.nodesSnapshot || []);
      const edgesChanged = JSON.stringify(flowObject.edges) !== JSON.stringify(currentScenario.edgesSnapshot || []);
      const viewportChanged = JSON.stringify(flowObject.viewport) !== JSON.stringify(currentScenario.viewport);

      const hasContentChanged = nodesChanged || edgesChanged || viewportChanged;

      if (hasContentChanged && currentScenario.id) {
        const scenarioId = currentScenario.id; // Capture ID for database update
        const updatePayload: Partial<Scenario> = {
          nodesSnapshot: cleanedNodes,
          edgesSnapshot: flowObject.edges,
          viewport: flowObject.viewport,
          updatedAt: Date.now(),
        };

        // DON'T update local state here - it causes circular updates!
        // Just persist to database
        db.scenarios.update(scenarioId, updatePayload).catch(() => {
          console.warn("Failed to save scenario state");
        });
        
        // Capture metric snapshot for significant changes
        if (nodesChanged || edgesChanged) {
          const updatedScenario = { ...currentScenario, ...updatePayload };
          captureROISnapshot(updatedScenario, cleanedNodes, 'save').catch(console.error);
        }
      }
    }, 300);

    return () => clearTimeout(saveTimeout);
  }, [nodes, edges, rfInstance, currentScenario, isLoading, isManipulatingNodesProgrammatically]);

  // Update selected node convenience to handle both nodes and groups
  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedGroup = nodes.find((n) => n.id === selectedGroupId && n.type === "group") || null;
  // Removed selectedEmailNode - no longer needed with inline editing

  // Add a function to handle node selection with multi-select
  const handleNodeClick = useCallback((evt: React.MouseEvent, node: Node) => {
    // Handle groups separately
    if (node.type === "group") {
      setSelectedGroupId(node.id);
      setSelectedId(null);
      // Removed setSelectedEmailNodeId - no longer needed
      return;
    }
    // Handle Email Preview Node selection - DO NOT open panel anymore
    if (node.type === "emailPreview") {
      // Email node editing is now inline, no panel needed
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
      // Removed setSelectedEmailNodeId - no longer needed
      setSelectedIds([]);
      setIsMultiSelectionActive(false);
    }
  }, []);
  
  // Function to create a group from selected nodes
  const createGroupFromSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    // Find bounding box of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const selectedNodesData: Record<string, {
      minuteContribution: number;
      [key: string]: unknown;
    }> = {};
    
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
      const nodeType = node.type as NodeType; // Cast to NodeType instead of any
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
          emailPreview: 0,
          // Email context nodes
          persona: 0,
          industry: 0,
          painpoint: 0,
          metric: 0,
          urgency: 0,
          socialproof: 0,
          objection: 0,
          value: 0,
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
      // Add type guard here
      if (currentScenario.id) {
        db.scenarios.update(currentScenario.id, updatedFields);
      }
    }
  };

  const snapToGridModifier = createSnapModifier(8);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const nodeType = active.data.current?.nodeType;
    
    if (nodeType) {
      setActiveDragItem({ id: String(active.id), type: nodeType });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      
      // Clear the active drag item
      setActiveDragItem(null);
      
      // Accept drop if pointer is within canvas even if collision calc fails
      if (over && over.id !== "canvas") {
        return;
      }
      
      const nodeType = active.data.current?.nodeType as NodeType;
      const isEmailContext = active.data.current?.isEmailContext as boolean;
      const contextValue = active.data.current?.contextValue as string;
      const category = active.data.current?.category as string;
      
      if (!nodeType || !reactFlowWrapper.current || !rfInstance) {
        return;
      }

      // Set manipulation flag to prevent state conflicts
      setIsManipulatingNodesProgrammatically(true);

      // Calculate drop position
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
          contextValue: contextValue || "",
          category: category || "",
        } : { 
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodes.filter(n => n.type === nodeType).length + 1}`,
          ...(nodeType === 'trigger' && { typeOf: 'webhook' }),
          ...(nodeType === 'action' && { 
            appName: 'New Action',
            action: 'configure',
            typeOf: 'data_processing' 
          }),
          ...(nodeType === 'decision' && { 
            conditionType: 'value',
            operator: 'equals' 
          }),
        },
      };
      
      // Update nodes state
      setNodes((nds) => [...nds, newNode]);
      
      // Update currentScenario and database AFTER setNodes (not inside it)
      if (currentScenario && currentScenario.id) {
        const scenarioId = currentScenario.id; // Capture id to satisfy TypeScript
        // Use setTimeout to delay the updates and avoid state update loops
        setTimeout(() => {
          const updatedNodes = [...nodes, newNode];
          const updatedScenario = {
            ...currentScenario,
            nodesSnapshot: updatedNodes,
            updatedAt: Date.now(),
          };
          setCurrentScenario(updatedScenario);
          // Also update the database
          db.scenarios.update(scenarioId, {
            nodesSnapshot: updatedNodes,
            updatedAt: Date.now(),
          }).catch(console.error);
        }, 0);
      }

      // Clear manipulation flag after a short delay
      setTimeout(() => {
        setIsManipulatingNodesProgrammatically(false);
      }, 500);
    },
    [rfInstance, setNodes, currentScenario, setCurrentScenario, nodes]
  );

  /* ---------- ROI Sheet open state ---------- */
  const [roiOpen, setRoiOpen] = useState(false);

  // Function to save the current canvas state as a new scenario
  const saveCurrentWorkflowAsScenario = useCallback(async (name?: string): Promise<number> => {
    if (!rfInstance) {
      throw new Error("ReactFlow instance not available for saving.");
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
    };
    
    // Create a new slug for the new scenario if it's a "Save As" type operation
    // Or reuse if updating an existing currentScenario by creating a *new* record from it.
    const newScenarioId = await db.scenarios.add({
        slug: nanoid(8),
        createdAt: Date.now(),
        ...scenarioToSave
    } as Scenario); // Cast to Scenario to satisfy Dexie's add method requiring all non-optional fields

    return newScenarioId;
  }, [rfInstance, platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, taskType, complianceEnabled, riskLevel, riskFrequency, errorCost, revenueEnabled, monthlyVolume, conversionRate, valuePerConversion, currentScenario]);

  const handleFindNewAlternatives = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch) {
      return;
    }
    if (!currentScenario || !currentScenario.id) {
        return;
    }
    setIsLoadingAlternatives(true); // Correct usage
    try {
        const res = await fetch(`/api/templates/search?q=${encodeURIComponent(queryToSearch)}`);
        if (!res.ok) throw new Error(`Alt templates fetch failed: ${res.status}`);
        const data: {
          templates?: Array<{
            templateId: string;
            title?: string;
            platform?: string;
            source?: string;
            nodes?: Array<{
              reactFlowId: string;
              id?: string;
              type: string;
              position: { x: number; y: number };
              data: Record<string, unknown>;
            }>;
            edges?: Array<{
              reactFlowId: string;
              id?: string;
              source?: string;
              target?: string;
              label?: string;
              data?: Record<string, unknown>;
            }>;
            description?: string;
          }>;
        } = await res.json();
        let newAltsState: Scenario[] = [];
        let altsCacheForDb: Array<{
          templateId?: string;
          title: string;
          platform: string;
          nodesCount: number;
          description?: string;
        }> = [];

        if (data.templates && Array.isArray(data.templates)) {
            const primaryId = currentScenario.originalTemplateId;
            newAltsState = data.templates.filter((t) => t.templateId !== primaryId).slice(0, 5).map((t) => ({
                slug: nanoid(8), name: t.title || "Alternative", createdAt: Date.now(), updatedAt: Date.now(),
                platform: (t.platform || t.source || "zapier") as LibPlatformType,
                nodesSnapshot: t.nodes?.map((n) => ({ id: n.reactFlowId || n.id, type: n.type, position: n.position, data: n.data })) || [],
                edgesSnapshot: t.edges?.map((e) => ({ id: e.reactFlowId || e.id, source: e.data?.source || e.source, target: e.data?.target || e.target, label: e.label, data: e.data, type: 'custom' })) || [],
                originalTemplateId: t.templateId, 
                searchQuery: queryToSearch, // Use queryToSearch from parameter
                runsPerMonth: 250, minutesPerRun: 3, hourlyRate: 30, taskMultiplier: 1.5, taskType: "general",
                complianceEnabled: false, revenueEnabled: false, riskLevel:3, riskFrequency:5, errorCost:500, monthlyVolume:100, conversionRate:5, valuePerConversion:200, 
            } as Scenario));
            altsCacheForDb = newAltsState.map(s => ({ 
                templateId: s.originalTemplateId, 
                title: s.name, 
                platform: s.platform || 'zapier', 
                nodesCount: s.nodesSnapshot?.length || 0, 
                description: (s as { description?: string }).description
            }));
        }
        setAlternativeTemplates(newAltsState);
        // Ensure currentScenario.id is valid before update
        if (currentScenario && currentScenario.id) {
            const scenarioId = currentScenario.id; // Capture ID
            await db.scenarios.update(scenarioId, { alternativeTemplatesCache: altsCacheForDb, updatedAt: Date.now(), searchQuery: queryToSearch });
            // Don't update state here - it causes circular updates!
        }
    } catch {
        setAlternativeTemplates([]);
        if (currentScenario && currentScenario.id) {
            const scenarioId = currentScenario.id; // Capture ID
            await db.scenarios.update(scenarioId, { alternativeTemplatesCache: [], updatedAt: Date.now() });
            // Don't update state here - it causes circular updates!
        }
    } finally {
        setIsLoadingAlternatives(false); // Correct usage
    }
}, [currentScenario]);

  const handleSelectAlternative = useCallback(async (alternativeData: AlternativeTemplateForDisplay) => {
    const fullAlternativeScenario = alternativeTemplates.find(s => s.originalTemplateId === alternativeData.templateId);

    if (!currentScenario || !currentScenario.id || !fullAlternativeScenario || !fullAlternativeScenario.originalTemplateId) {
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
    setIsLoading(true);
    const scenarioFromDb = await db.scenarios.get(idToLoad);
    if (scenarioFromDb) {
      setScenarioId(idToLoad); // Update the active scenarioId state
      setCurrentScenario(scenarioFromDb); // This will trigger the useEffect to call loadScenarioDataToState
    } else {
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
        title: (node.data as unknown as EmailPreviewNodeData)?.nodeTitle || `Email: ${node.id}`
      }));
    return filtered;
  }, [nodes]);

  // Removed emailContextNodes - no longer needed with inline editing

  // ADD THE HANDLER FUNCTION HERE
  const handleGenerateEmailOnCanvas = useCallback(async () => {
    if (!currentScenario || !currentScenario.id || !rfInstance) {
      alert("Cannot generate email: Scenario data or flow instance is missing.");
      return;
    }

    setIsGeneratingEmail(true);

    try {
      setIsManipulatingNodesProgrammatically(true);
      const sc = currentScenario;

      // Check for template defaults from localStorage
      let templateDefaults: {
        subjectLine?: string;
        hookText?: string;
        toneOption?: string;
        templateType?: string;
      } = {};
      
      try {
        const stored = localStorage.getItem('emailTemplateDefaults');
        if (stored) {
          templateDefaults = JSON.parse(stored);
          // Clear it after reading
          localStorage.removeItem('emailTemplateDefaults');
        }
      } catch {
        // Ignore localStorage errors
      }

      // Collect email context nodes
      const emailContextNodes = nodes.filter(node => {
        const nodeData = node.data as unknown as NodeData;
        return nodeData.isEmailContext || (node.type && [
          "persona", "industry", "painpoint", "metric", 
          "urgency", "socialproof", "objection", "value"
        ].includes(node.type));
      });

      // Build email context object
      const emailContext: Record<string, string[]> = {
        personas: [],
        industries: [],
        painPoints: [],
        metrics: [],
        urgencyFactors: [],
        socialProofs: [],
        objections: [],
        valueProps: [],
      };

      emailContextNodes.forEach(node => {
        const nodeData = node.data as unknown as NodeData;
        const contextValue = nodeData.contextValue || nodeData.label || "";
        const nodeType = node.type || "";
        
        switch(nodeType) {
          case "persona":
            emailContext.personas.push(contextValue as string);
            break;
          case "industry":
            emailContext.industries.push(contextValue as string);
            break;
          case "painpoint":
            emailContext.painPoints.push(contextValue as string);
            break;
          case "metric":
            emailContext.metrics.push(contextValue as string);
            break;
          case "urgency":
            emailContext.urgencyFactors.push(contextValue as string);
            break;
          case "socialproof":
            emailContext.socialProofs.push(contextValue as string);
            break;
          case "objection":
            emailContext.objections.push(contextValue as string);
            break;
          case "value":
            emailContext.valueProps.push(contextValue as string);
            break;
        }
      });

      // Find optimal position for email node to avoid overlaps
      // Find optimal position for email node to avoid overlaps
      const findOptimalEmailPosition = (existingNodes: Node<Record<string, unknown>>[]) => {
        const emailNodeWidth = 700; // Increased width for better display
        const emailNodeHeight = 900; // Increased height for better display
        const padding = 50;

        // Filter out existing email nodes for positioning calculation
        const nonEmailNodes = existingNodes.filter(n => n.type !== 'emailPreview');
        
        if (nonEmailNodes.length === 0) {
          // No nodes exist, place at origin with some offset
          return snapToGrid(100, 100);
        }

        // Calculate bounding box of existing nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nonEmailNodes.forEach(node => {
          const nodeWidth = node.width || 150;
          const nodeHeight = node.height || 40;
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });

        // Try positions: above, left, right, below
        const candidatePositions = [
          // Above the workflow
          { x: minX, y: minY - emailNodeHeight - padding },
          // Left of the workflow
          { x: minX - emailNodeWidth - padding, y: minY },
          // Right of the workflow
          { x: maxX + padding, y: minY },
          // Below the workflow
          { x: minX, y: maxY + padding }
        ];

        // Check for overlaps and return first non-overlapping position
        for (const pos of candidatePositions) {
          const hasOverlap = nonEmailNodes.some(node => {
            const nodeWidth = node.width || 150;
            const nodeHeight = node.height || 40;
            return !(
              pos.x + emailNodeWidth < node.position.x ||
              pos.x > node.position.x + nodeWidth ||
              pos.y + emailNodeHeight < node.position.y ||
              pos.y > node.position.y + nodeHeight
            );
          });
          
          if (!hasOverlap) {
            return snapToGrid(pos.x, pos.y);
          }
        }

        // Fallback: place above with extra spacing
        return snapToGrid(minX, minY - emailNodeHeight - padding * 2);
      };

      // Create immediate loading email node
      const loadingEmailNodeId = `email-preview-${nanoid(6)}`;
      let loadingEmailNode: Node<EmailPreviewNodeData, 'emailPreview'>;

      setNodes(currentNodesState => {
        // Remove any existing email preview nodes
        const nodesWithoutOldEmail = currentNodesState.filter(n => n.type !== 'emailPreview');
        
        const optimalPosition = findOptimalEmailPosition(nodesWithoutOldEmail);

        loadingEmailNode = {
          id: loadingEmailNodeId,
          type: 'emailPreview',
          position: optimalPosition,
          data: {
            nodeTitle: `Generating Email for: ${sc.name || 'Scenario'}...`,
            firstName: sc.emailFirstName || '[FIRST NAME]',
            yourName: sc.emailYourName || '[YOUR NAME]',
            yourCompany: sc.emailYourCompany || '[YOUR COMPANY]',
            yourEmail: sc.emailYourEmail || '[YOUR_EMAIL]',
            calendlyLink: sc.emailCalendlyLink || 'https://calendly.com/your-link',
            pdfLink: sc.emailPdfLink || 'https://example.com/roi.pdf',
            subjectLine: templateDefaults.subjectLine || 'Generating subject line...',
            hookText: templateDefaults.hookText || 'AI is crafting your personalized hook text...',
            ctaText: 'Generating compelling call-to-action...',
            offerText: 'Creating your value proposition...',
            stats: { 
              roiX: 0,
              payback: 'Calculating...',
              runs: sc.runsPerMonth || 0,
            },
            isLoading: true, // Add loading flag
            // Remove onRegenerateSection - can't persist functions
            sectionConnections: {}, // Initialize empty section connections
          },
          draggable: true,
          selectable: true,
        };

        return [...nodesWithoutOldEmail, loadingEmailNode];
      });

      // Focus on the loading email node
      setTimeout(() => {
        if (rfInstance && loadingEmailNode) {
          rfInstance.fitBounds(
            { 
              x: loadingEmailNode.position.x, 
              y: loadingEmailNode.position.y, 
              width: 700, 
              height: 900 
            },
            { padding: 0.1, duration: 600 }
          );
        }
      }, 100);

      // Extract workflow information with non-default labels
      const workflowSteps = nodes
        .filter(node => {
          // Filter out nodes with default labels and email context nodes
          const defaultLabels = [
            /^Trigger \d+$/,
            /^Action \d+$/,
            /^Decision \d+$/,
            /^Group \d+$/,
          ];
          const nodeData = node.data as unknown as NodeData;
          const label = nodeData?.label || '';
          return !defaultLabels.some(pattern => pattern.test(label)) && !nodeData.isEmailContext;
        })
        .map(node => {
          const nodeData = node.data as unknown as NodeData;
          return {
            type: node.type || 'unknown',
            label: nodeData?.label || '',
            appName: nodeData?.appName,
            action: nodeData?.action,
          };
        });

      // Get unique apps from workflow
      const uniqueApps = [...new Set(
        nodes
          .map(node => (node.data as unknown as NodeData)?.appName)
          .filter(Boolean)
      )] as string[];

      // Calculate all ROI values
      const timeValue = calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0);
      const riskValue = calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0);
      const revenueValue = calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0);
      const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
      const platformCost = calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0);
      const netROI = calculateNetROI(totalValue, platformCost);
      const roiRatio = calculateROIRatio(totalValue, platformCost);
      const paybackDays = calculatePaybackPeriod(platformCost, netROI);
      const paybackPeriod = formatPaybackPeriod(paybackDays);

      // Build comprehensive payload
      const comprehensivePayload = {
        // Core scenario data
        scenarioName: sc.name,
        platform: sc.platform,
        taskType: sc.taskType || 'general',
        
        // Basic metrics
        runsPerMonth: sc.runsPerMonth,
        minutesPerRun: sc.minutesPerRun,
        hourlyRate: sc.hourlyRate,
        taskMultiplier: sc.taskMultiplier,
        
        // Calculated ROI values
        timeValue,
        platformCost,
        netROI,
        roiRatio,
        paybackPeriod,
        
        // Revenue metrics (if enabled)
        revenueEnabled: sc.revenueEnabled,
        monthlyVolume: sc.monthlyVolume,
        conversionRate: sc.conversionRate,
        valuePerConversion: sc.valuePerConversion,
        revenueValue,
        
        // Compliance metrics (if enabled)
        complianceEnabled: sc.complianceEnabled,
        riskLevel: sc.riskLevel,
        riskFrequency: sc.riskFrequency,
        errorCost: sc.errorCost,
        riskValue,
        
        // Workflow information
        workflowSteps,
        totalSteps: nodes.filter(n => n.type !== 'group' && !(n.data as unknown as NodeData).isEmailContext).length,
        uniqueApps,
        
        // Email context from nodes
        emailContext,
        
        // Default to standard length and professional_warm tone for initial generation
        lengthOption: 'standard' as const,
        toneOption: templateDefaults.toneOption || 'professional_warm',
        
        // Enable all sections by default for initial generation
        enabledSections: {
          subject: true,
          hook: true,
          cta: true,
          offer: true,
          ps: true,
          testimonial: false, // Disabled by default
          urgency: false, // Disabled by default
        }
      };

      const response = await fetch('/api/openai/generate-full-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comprehensivePayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to generate full email content: ${response.status} ${errorBody}`);
      }
      const emailTexts = await response.json();

      // Update the loading node with generated content
      setNodes(currentNodesState => {
        return currentNodesState.map(node => {
          if (node.id === loadingEmailNodeId && node.type === 'emailPreview') {
            return {
              ...node,
              data: {
                ...node.data,
                nodeTitle: `Email for: ${sc.name || 'Scenario'}`,
                subjectLine: emailTexts.subjectLine || sc.emailSubjectLine || 'Streamline Your Workflow & See Immediate ROI',
                hookText: emailTexts.hookText || sc.emailHookText || 'Default hook text...',
                ctaText: emailTexts.ctaText || sc.emailCtaText || 'Default CTA text...',
                offerText: emailTexts.offerText || sc.emailOfferText || 'Default offer text...',
                psText: emailTexts.psText || sc.emailPsText || 'PS - Most teams see results within 48 hours.',
                testimonialText: emailTexts.testimonialText || sc.emailTestimonialText || '',
                urgencyText: emailTexts.urgencyText || sc.emailUrgencyText || '',
                showPS: true, // Show PS by default
                showTestimonial: false, // Hidden by default
                showUrgency: false, // Hidden by default
                stats: { 
                  roiX: Math.round(roiRatio * 10) / 10,
                  payback: paybackPeriod,
                  runs: sc.runsPerMonth || 0,
                },
                isLoading: false, // Remove loading flag
                lengthOption: 'standard', // Store current length option
                toneOption: 'professional_warm', // Store current tone option
                // Remove onRegenerateSection - can't persist functions
                sectionConnections: node.data.sectionConnections || {}, // Preserve existing connections
              }
            };
          }
          return node;
        });
      });

      // Wait a moment for the nodes state to update, then save everything together
      setTimeout(async () => {
        if (!rfInstance || !sc.id) return;
        
        // Get the current flow state including our updated email node
        const flowObject = rfInstance.toObject();
        
        // Clean function references from nodes before saving
        const cleanedNodes = flowObject.nodes.map(node => {
          if (node.type === 'emailPreview' && node.data && typeof node.data === 'object') {
            // Remove non-serializable properties like functions
            const nodeData = node.data as Record<string, unknown>;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onOpenNodeProperties, ...cleanData } = nodeData;
            return { ...node, data: cleanData };
          }
          if (node.type === 'roiReport' && node.data && typeof node.data === 'object') {
            // Remove non-serializable properties like functions from ROI report nodes
            const nodeData = node.data as Record<string, unknown>;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onGenerateReport, onRegenerateSection, ...cleanData } = nodeData;
            return { ...node, data: cleanData };
          }
          return node;
        });
        
        // Update scenario with BOTH email fields AND the current nodes snapshot
        const comprehensiveUpdate: Partial<Scenario> = {
          emailSubjectLine: emailTexts.subjectLine || sc.emailSubjectLine,
          emailHookText: emailTexts.hookText || sc.emailHookText,
          emailCtaText: emailTexts.ctaText || sc.emailCtaText,
          emailOfferText: emailTexts.offerText || sc.emailOfferText,
          emailPsText: emailTexts.psText || sc.emailPsText,
          emailTestimonialText: emailTexts.testimonialText || sc.emailTestimonialText,
          emailUrgencyText: emailTexts.urgencyText || sc.emailUrgencyText,
          nodesSnapshot: cleanedNodes, // Use cleaned nodes
          edgesSnapshot: flowObject.edges, // Include current edges
          viewport: flowObject.viewport, // Include current viewport
          updatedAt: Date.now(),
        };

        await db.scenarios.update(sc.id, comprehensiveUpdate);
        setCurrentScenario(prev => prev ? { ...prev, ...comprehensiveUpdate } : null);
      }, 100); // Small delay to ensure nodes state has updated

    } catch (error) {
      // Update the loading node to show error state
      setNodes(currentNodesState => {
        return currentNodesState.map(node => {
          if (node.type === 'emailPreview' && node.data.isLoading) {
            return {
              ...node,
              data: {
                ...node.data,
                nodeTitle: 'Error generating email',
                subjectLine: 'Error occurred',
                hookText: `Error: ${error instanceof Error ? error.message : String(error)}`,
                ctaText: 'Please try again',
                offerText: 'Click the Generate Email button to retry',
                isLoading: false,
              }
            };
          }
          return node;
        });
      });

      // Also save the error state to prevent node disappearing
      setTimeout(async () => {
        if (!rfInstance || !currentScenario?.id) return;
        const flowObject = rfInstance.toObject();
        
        // Clean function references from nodes before saving
        const cleanedNodes = flowObject.nodes.map(node => {
          if (node.type === 'emailPreview' && node.data && typeof node.data === 'object') {
            // Remove non-serializable properties like functions
            const nodeData = node.data as Record<string, unknown>;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onOpenNodeProperties, ...cleanData } = nodeData;
            return { ...node, data: cleanData };
          }
          if (node.type === 'roiReport' && node.data && typeof node.data === 'object') {
            // Remove non-serializable properties like functions from ROI report nodes
            const nodeData = node.data as Record<string, unknown>;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onGenerateReport, onRegenerateSection, ...cleanData } = nodeData;
            return { ...node, data: cleanData };
          }
          return node;
        });
        
        const errorUpdate: Partial<Scenario> = {
          nodesSnapshot: cleanedNodes,
          edgesSnapshot: flowObject.edges,
          viewport: flowObject.viewport,
          updatedAt: Date.now(),
        };
        await db.scenarios.update(currentScenario.id, errorUpdate);
        setCurrentScenario(prev => prev ? { ...prev, ...errorUpdate } : null);
      }, 100);
    } finally {
      setIsGeneratingEmail(false);
      // Keep the manipulation flag active a bit longer to ensure our save completes
      setTimeout(() => {
        setIsManipulatingNodesProgrammatically(false);
      }, 500);
    }
  }, [currentScenario, rfInstance, setNodes, setCurrentScenario, nodes]);

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
      section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
      promptType: string, // This will be like 'time_cost_hook_standard_professional_warm', etc.
      currentText: string,
      selectedContextNodes?: string[]
    ) => {
      if (!currentScenario) {
        alert("No active scenario selected.");
        return;
      }
      try {
        const sc = currentScenario;
        
        // Extract length option and tone from promptType
        const parts = promptType.split('_');
        const toneOption = parts[parts.length - 1] + '_' + parts[parts.length - 2]; // e.g., 'professional_warm'
        const lengthOption = parts[parts.length - 3] as 'concise' | 'standard' | 'detailed';
        const actualPromptType = parts.slice(0, -3).join('_');
        
        // Calculate all ROI values
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

        // Collect email context from selected nodes
        const emailContext: Record<string, string[]> = {
          personas: [],
          industries: [],
          painPoints: [],
          metrics: [],
          urgencyFactors: [],
          socialProofs: [],
          objections: [],
          valueProps: [],
        };

        if (selectedContextNodes && selectedContextNodes.length > 0) {
          const contextNodes = nodes.filter(node => selectedContextNodes.includes(node.id));
          
          contextNodes.forEach(node => {
            const nodeData = node.data as unknown as NodeData;
            const contextValue = nodeData.contextValue || nodeData.label || "";
            const nodeType = node.type || "";
            
            // Parse the value if it's JSON (for multi-select values)
            let values: string[] = [];
            try {
              const parsed = JSON.parse(contextValue as string);
              values = Array.isArray(parsed) ? parsed : [contextValue as string];
            } catch {
              values = [contextValue as string];
            }
            
            switch(nodeType) {
              case "persona":
                emailContext.personas.push(...values);
                break;
              case "industry":
                emailContext.industries.push(...values);
                break;
              case "painpoint":
                emailContext.painPoints.push(...values);
                break;
              case "metric":
                emailContext.metrics.push(...values);
                break;
              case "urgency":
                emailContext.urgencyFactors.push(...values);
                break;
              case "socialproof":
                emailContext.socialProofs.push(...values);
                break;
              case "objection":
                emailContext.objections.push(...values);
                break;
              case "value":
                emailContext.valueProps.push(...values);
                break;
            }
          });
        }

        // Extract workflow information with non-default labels
        const workflowSteps = nodes
          .filter(node => {
            const defaultLabels = [
              /^Trigger \d+$/,
              /^Action \d+$/,
              /^Decision \d+$/,
              /^Group \d+$/,
            ];
            const nodeData = node.data as unknown as NodeData;
            const label = nodeData?.label || '';
            return !defaultLabels.some(pattern => pattern.test(label));
          })
          .map(node => {
            const nodeData = node.data as unknown as NodeData;
            return {
              type: node.type || 'unknown',
              label: nodeData?.label || '',
              appName: nodeData?.appName,
              action: nodeData?.action,
            };
          });

        // Get unique apps from workflow
        const uniqueApps = [...new Set(
          nodes
            .map(node => (node.data as unknown as NodeData)?.appName)
            .filter(Boolean)
        )] as string[];

        // Build comprehensive ROI payload
        const roiDataPayload = {
          // Core scenario data
          scenarioName: sc.name,
          platform: sc.platform,
          taskType: sc.taskType || 'general',
          
          // Basic metrics
          runsPerMonth: sc.runsPerMonth,
          minutesPerRun: sc.minutesPerRun,
          hourlyRate: sc.hourlyRate,
          taskMultiplier: sc.taskMultiplier,
          
          // Calculated ROI values
          timeValue,
          platformCost: platformCostValue,
          netROI: netROIValue,
          roiRatio: roiRatioValue,
          paybackPeriod: formatPaybackPeriod(paybackPeriodDays),
          
          // Time saved calculations
          totalHoursSaved: ((sc.runsPerMonth || 0) * (sc.minutesPerRun || 0)) / 60,
          dailyTimeSaved: ((sc.runsPerMonth || 0) * (sc.minutesPerRun || 0)) / 60 / 30,
          
          // Revenue metrics (if enabled)
          ...(sc.revenueEnabled && {
            revenueMetrics: {
              monthlyVolume: sc.monthlyVolume || 0,
              conversionRate: sc.conversionRate || 0,
              valuePerConversion: sc.valuePerConversion || 0,
              totalRevenueImpact: revenueValue,
              additionalConversions: ((sc.monthlyVolume || 0) * ((sc.conversionRate || 0) / 100))
            }
          }),
          
          // Compliance metrics (if enabled)
          ...(sc.complianceEnabled && {
            complianceMetrics: {
              riskLevel: sc.riskLevel || 0,
              riskFrequency: sc.riskFrequency || 0,
              errorCost: sc.errorCost || 0,
              totalRiskMitigation: riskValue,
              errorsPreventedMonthly: ((sc.runsPerMonth || 0) * ((sc.riskFrequency || 0) / 100))
            }
          }),
          
          // Workflow context
          workflowSummary: {
            totalSteps: nodes.filter(n => n.type !== 'group').length,
            uniqueApps,
            keySteps: workflowSteps.slice(0, 5),
            automationType: workflowSteps[0]?.appName || 'Custom Workflow'
          },
          
          // Email context from selected nodes
          ...(selectedContextNodes && selectedContextNodes.length > 0 && { emailContext })
        };

        // Get the current email node to extract previous sections
        const emailNode = nodes.find(n => n.id === nodeId && n.type === 'emailPreview');
        const emailData = emailNode?.data as EmailPreviewNodeData | undefined;
        
        const previousSections: Record<string, string> = {};
        if (emailData) {
          if (section !== 'subject' && emailData.subjectLine) {
            previousSections.subjectLine = emailData.subjectLine;
          }
          if ((section === 'cta' || section === 'offer' || section === 'ps' || section === 'testimonial' || section === 'urgency') && emailData.hookText) {
            previousSections.hookText = emailData.hookText;
          }
          if ((section === 'offer' || section === 'ps' || section === 'testimonial' || section === 'urgency') && emailData.ctaText) {
            previousSections.ctaText = emailData.ctaText;
          }
          if ((section === 'ps' || section === 'testimonial' || section === 'urgency') && emailData.offerText) {
            previousSections.offerText = emailData.offerText;
          }
        }

        // Map promptType to a more descriptive system prompt with tone awareness
        let systemPrompt = "Rewrite the following email section.";
        
        // Add tone-specific instructions
        const toneInstructions = {
          'professional_warm': 'Use a professional yet warm and approachable tone.',
          'casual_friendly': 'Write in a casual, friendly tone like talking to a colleague over coffee.',
          'direct_results': 'Be direct and results-focused, emphasizing concrete outcomes.',
          'consultative_helpful': 'Take a consultative approach, positioning yourself as a helpful advisor.'
        };
        
        const toneGuidance = toneInstructions[toneOption as keyof typeof toneInstructions] || toneInstructions['professional_warm'];
        
        if (actualPromptType.includes('subject')) {
          systemPrompt = `Rewrite this email subject line. Style: ${actualPromptType.split('_')[0]}. ${toneGuidance}`;
        } else if (actualPromptType.includes('hook')) {
          const style = actualPromptType.replace('_hook', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this email hook section with focus on: ${style}. ${toneGuidance}`;
        } else if (actualPromptType.includes('cta')) {
          const style = actualPromptType.replace('_cta', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this email CTA section. Style: ${style}. ${toneGuidance}`;
        } else if (actualPromptType.includes('offer')) {
          const style = actualPromptType.replace('_offer', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this email offer section. Type: ${style}. ${toneGuidance}`;
        } else if (actualPromptType.includes('ps')) {
          const style = actualPromptType.replace('_ps', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this PS line. Style: ${style}. ${toneGuidance}`;
        } else if (actualPromptType.includes('testimonial')) {
          const style = actualPromptType.replace('_testimonial', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this testimonial quote. Style: ${style}. ${toneGuidance}`;
        } else if (actualPromptType.includes('urgency')) {
          const style = actualPromptType.replace('_urgency', '').replace(/_/g, ' ');
          systemPrompt = `Rewrite this urgency line. Style: ${style}. ${toneGuidance}`;
        }
        
        const response = await fetch('/api/openai/generate-email-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roiData: roiDataPayload,
            textToRewrite: currentText,
            systemPrompt,
            lengthOption,
            section,
            previousSections,
            toneOption,
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
        alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [currentScenario, handleUpdateEmailNodeData, nodes]
  );

  // Create refs to store the latest callback implementations
  // This allows nodeTypes to remain stable while callbacks can change
  const emailCallbacksRef = useRef({
    handleGenerateEmailSectionAI,
    handleUpdateEmailNodeData,
    handleGenerateEmailOnCanvas
  });

  // Update the ref when callbacks change
  useEffect(() => {
    emailCallbacksRef.current = {
      handleGenerateEmailSectionAI,
      handleUpdateEmailNodeData,
      handleGenerateEmailOnCanvas
    };
  }, [handleGenerateEmailSectionAI, handleUpdateEmailNodeData, handleGenerateEmailOnCanvas]);

  // Create stable wrapper for EmailPreviewNode that uses the ref
  const EmailPreviewNodeWrapper = useCallback((props: { id: string; data: EmailPreviewNodeData }) => {
    const emailData = props.data as EmailPreviewNodeData;
    const nodeId = props.id;
    
    return (
      <EmailPreviewNode 
        {...props} 
        data={{
          ...props.data,
          onRegenerateSection: async (section: string, promptType: string, tone: string, length: 'concise' | 'standard' | 'detailed') => {
            // Get current text for the section
            const fieldKey = section === 'subject' ? 'subjectLine' : `${section}Text` as keyof EmailPreviewNodeData;
            const currentText = String(emailData?.[fieldKey] || '');
            
            // Get connected context nodes for this section
            const sectionConnection = emailData.sectionConnections?.[section as keyof typeof emailData.sectionConnections];
            const selectedContextNodes = sectionConnection?.connectedNodeIds || [];
            
            // Build the full prompt type with tone and length
            const fullPromptType = `${promptType}_${length}_${tone}`;
            
            // Call the generation function using the ref
            await emailCallbacksRef.current.handleGenerateEmailSectionAI(
              nodeId,
              section as 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
              fullPromptType,
              currentText,
              selectedContextNodes
            );
          },
          onGenerateFullEmail: async (tone: string, length: 'concise' | 'standard' | 'detailed') => {
            // Update node with tone/length settings using the ref
            emailCallbacksRef.current.handleUpdateEmailNodeData(nodeId, { 
              toneOption: tone,
              lengthOption: length 
            });
            
            // Call the full email generation using the ref
            await emailCallbacksRef.current.handleGenerateEmailOnCanvas();
          }
        }} 
      />
    );
  }, []); // Empty deps array - this wrapper never changes

  // Create nodeTypes with stable references - no dependencies needed
  const nodeTypes = useMemo(() => ({
    trigger: PixelNode,
    action: PixelNode,
    decision: PixelNode,
    group: NodeGroup,
    emailPreview: EmailPreviewNodeWrapper,
    // Email context nodes
    persona: PixelNode,
    industry: PixelNode,
    painpoint: PixelNode,
    metric: PixelNode,
    urgency: PixelNode,
    socialproof: PixelNode,
    objection: PixelNode,
    value: PixelNode,
    // ROI Report node
    roiReport: ROIReportNode,
  }), [EmailPreviewNodeWrapper]); // Only depends on the stable wrapper

  // Removed handleRegenerateSection - now handled by inline editors

  // Moved the loading return to before the main return, after all hooks
  if (isLoading && !currentScenario && !scenarioIdParam) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your automation canvas...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <DndContext
        sensors={sensors}
        modifiers={[snapToGridModifier]}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        collisionDetection={pointerWithin}
      >
        <div className="flex h-screen w-full flex-col overflow-hidden" data-page="build">
          {/* Remove the header completely - StatsBar now contains app name */}
          
          {/* Integrated Stats Bar with all controls */}
          <StatsBar 
            platform={platform}
            runsPerMonth={runsPerMonth}
            minutesPerRun={minutesPerRun}
            hourlyRate={hourlyRate}
            taskMultiplier={taskMultiplier}
            taskType={taskType}
            onUpdateMinutes={(minutes) => {
              setMinutesPerRun(minutes);
              // Delay the ROI update to avoid sync loops
              setTimeout(() => {
                updateCurrentScenarioROI({ minutesPerRun: minutes });
              }, 0);
            }}
            onUpdateRuns={(runs) => {
              setRunsPerMonth(runs);
              // Delay the ROI update to avoid sync loops
              setTimeout(() => {
                updateCurrentScenarioROI({ runsPerMonth: runs });
              }, 0);
            }}
            nodes={nodes}
            currentScenario={currentScenario}
            
            // Integrated control handlers
            onPlatformChange={(newPlatform) => {
              setPlatform(newPlatform);
              // Delay the ROI update to avoid sync loops
              setTimeout(() => {
                updateCurrentScenarioROI({ platform: newPlatform });
              }, 0);
            }}
            onOpenROISettings={() => setRoiOpen(true)}
            onGenerateROIReport={(roiNode) => {
              // Calculate optimal position based on visible nodes
              if (rfInstance) {
                const viewport = rfInstance.getViewport();
                
                // Calculate viewport bounds manually
                const viewportBounds = {
                  x: -viewport.x / viewport.zoom,
                  y: -viewport.y / viewport.zoom,
                  width: window.innerWidth / viewport.zoom,
                  height: window.innerHeight / viewport.zoom
                };
                
                // Get all nodes visible in current viewport
                const visibleNodes = nodes.filter(node => {
                  // Check if node is within viewport bounds
                  const nodeRight = node.position.x + (node.width || 150);
                  const nodeBottom = node.position.y + (node.height || 40);
                  
                  return node.position.x < viewportBounds.x + viewportBounds.width &&
                         nodeRight > viewportBounds.x &&
                         node.position.y < viewportBounds.y + viewportBounds.height &&
                         nodeBottom > viewportBounds.y;
                });
                
                // If there are visible nodes, position below the lowest one
                if (visibleNodes.length > 0) {
                  // Find the node with maximum Y position (furthest down)
                  let maxY = -Infinity;
                  let totalX = 0;
                  
                  visibleNodes.forEach(node => {
                    const nodeBottom = node.position.y + (node.height || 40);
                    if (nodeBottom > maxY) {
                      maxY = nodeBottom;
                    }
                    totalX += node.position.x + ((node.width || 150) / 2);
                  });
                  
                  // Calculate center X position of visible nodes
                  const centerX = totalX / visibleNodes.length;
                  
                  // Position ROI report below the lowest node with 100px spacing
                  roiNode.position = {
                    x: centerX - 350, // Center the 700px wide ROI report
                    y: maxY + 100     // 100px below the lowest visible node
                  };
                } else {
                  // No visible nodes, use viewport center
                  const centerX = viewportBounds.x + viewportBounds.width / 2;
                  const centerY = viewportBounds.y + viewportBounds.height / 2;
                  
                  roiNode.position = {
                    x: centerX - 350, // Center the 700px wide ROI report
                    y: centerY - 450  // Center vertically (900px height / 2)
                  };
                }
              }
              
              // Add the ROI report node to the canvas
              setNodes((nds) => [...nds, roiNode]);
              
              // Focus on the new node with animation
              if (rfInstance && roiNode) {
                setTimeout(() => {
                  // Fit the view to show both the automation and the ROI report
                  const padding = 0.15;
                  const nodesToFit = [...nodes, roiNode];
                  
                  if (nodesToFit.length > 1) {
                    // Calculate bounds that include all nodes
                    let minX = Infinity, minY = Infinity;
                    let maxX = -Infinity, maxY = -Infinity;
                    
                    nodesToFit.forEach(node => {
                      const nodeWidth = node.type === 'roiReport' ? 700 : (node.width || 150);
                      const nodeHeight = node.type === 'roiReport' ? 900 : (node.height || 40);
                      
                      minX = Math.min(minX, node.position.x);
                      minY = Math.min(minY, node.position.y);
                      maxX = Math.max(maxX, node.position.x + nodeWidth);
                      maxY = Math.max(maxY, node.position.y + nodeHeight);
                    });
                    
                    // Fit bounds to show all nodes with the ROI report
                    rfInstance.fitBounds(
                      {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                      },
                      { padding, duration: 800 }
                    );
                  } else {
                    // Just focus on the ROI report
                    rfInstance.fitBounds(
                      {
                        x: roiNode.position.x,
                        y: roiNode.position.y,
                        width: 700,
                        height: 900
                      },
                      { padding, duration: 800 }
                    );
                  }
                }, 100);
              }
            }}
            onAddNode={() => {
              console.log("Add Node button clicked"); // Debug log
              setIsManipulatingNodesProgrammatically(true);
              
              if (!rfInstance) {
                console.error("ReactFlow instance not available");
                setIsManipulatingNodesProgrammatically(false);
                return;
              }

              try {
                // Create a new node with proper positioning
                const newId = nanoid(6);
                const viewport = rfInstance.getViewport();
                
                // Position new node in the center of the current view
                const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
                const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
                
                const snapped = snapToGrid(centerX, centerY);
                
                const newNode = {
                  id: newId,
                  type: selectedNodeType,
                  position: snapped,
                  data: { 
                    label: `${selectedNodeType.charAt(0).toUpperCase() + selectedNodeType.slice(1)} ${nodes.filter(n => n.type === selectedNodeType).length + 1}`,
                    ...(selectedNodeType === 'trigger' && { typeOf: 'webhook' }),
                    ...(selectedNodeType === 'action' && { 
                      appName: 'New Action',
                      action: 'configure',
                      typeOf: 'data_processing' 
                    }),
                    ...(selectedNodeType === 'decision' && { 
                      conditionType: 'value',
                      operator: 'equals' 
                    }),
                  },
                };
                
                console.log("Adding new node:", newNode); // Debug log
                
                // Update nodes state
                setNodes((nds) => [...nds, newNode]);
                
                // Update currentScenario and database AFTER setNodes (not inside it)
                if (currentScenario && currentScenario.id) {
                  const scenarioId = currentScenario.id; // Capture id to satisfy TypeScript
                  // Use setTimeout to ensure state update happens after setNodes completes
                  setTimeout(() => {
                    const updatedNodes = [...nodes, newNode];
                    const updatedScenario = {
                      ...currentScenario,
                      nodesSnapshot: updatedNodes,
                      updatedAt: Date.now(),
                    };
                    setCurrentScenario(updatedScenario);
                    // Also update the database
                    db.scenarios.update(scenarioId, {
                      nodesSnapshot: updatedNodes,
                      updatedAt: Date.now(),
                    }).catch(console.error);
                  }, 0);
                }
              } catch (error) {
                console.error("Error adding node:", error);
              }
              
              // Clear manipulation flag after a short delay
              setTimeout(() => {
                setIsManipulatingNodesProgrammatically(false);
              }, 500);
            }}
            onGenerateEmail={handleGenerateEmailOnCanvas}
            isGeneratingEmail={isGeneratingEmail}
            
            // Group controls
            onCreateGroup={createGroupFromSelection}
            onUngroup={ungroupSelection}
            selectedIds={selectedIds}
            selectedGroupId={selectedGroupId}
            isMultiSelectionActive={isMultiSelectionActive}
          />

          {/* Main layout with toolbox and content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Toolbox */}
            <div className="hidden lg:block">
              <Toolbox 
                onLoadScenario={handleLoadScenario} 
                activeScenarioId={scenarioId} 
                emailNodes={emailNodesForToolbox}
                onFocusNode={focusOnNode}
                selectedNodeType={selectedNodeType}
                onNodeTypeSelect={setSelectedNodeType}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
              />
            </div>
            
            {/* Content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'canvas' ? (
                <div className={`flex h-full relative ${isOver ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                  <FlowCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultViewport={currentScenario?.viewport as Viewport || { x:0, y:0, zoom:1}}
                    onMoveEnd={handleMoveEnd}
                    onInit={(instance) => setRfInstance(instance as ReactFlowInstance)}
                    setWrapperRef={(node) => {
                      reactFlowWrapper.current = node;
                    }}
                    setDroppableRef={setDroppableRef}
                    isOver={isOver}
                    currentScenarioName={currentScenario?.name}
                    isEditingTitle={isEditingTitle}
                    editingScenarioName={editingScenarioName}
                    onToggleEditTitle={setIsEditingTitle}
                    onScenarioNameChange={setEditingScenarioName}
                    onSaveScenarioName={saveScenarioName}
                    onScenarioNameKeyDown={handleScenarioNameKeyDown}
                    titleInputRef={titleInputRef}
                    selectedNodeType={selectedNodeType}
                    onNodeTypeChange={setSelectedNodeType}
                  />

                  {/* Property Panels - existing code... */}
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
                  {/* EmailNodePropertiesPanel removed - using inline editing now */}
                </div>
              ) : (
                <AnalyticsDashboard scenario={currentScenario} nodes={nodes} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Toolbox */}
        {activeTab === 'canvas' && (
          <div className="lg:hidden">
            <MobileToolboxTrigger
              onLoadScenario={handleLoadScenario} 
              activeScenarioId={scenarioId} 
              emailNodes={emailNodesForToolbox}
              onFocusNode={focusOnNode}
              selectedNodeType={selectedNodeType}
              onNodeTypeSelect={setSelectedNodeType}
            />
          </div>
        )}

        {/* Mobile Alternative Templates Button */}
        {activeTab === 'canvas' && (
          <div className="lg:hidden">
            <MobileAlternativeTemplatesButton
              alternatives={alternativeTemplates.map(altScenario => ({
                  templateId: altScenario.originalTemplateId,
                  title: altScenario.name,
                  platform: altScenario.platform as string,
                  description: (altScenario as { description?: string }).description,
                  nodesCount: altScenario.nodesSnapshot?.length || 0,
                  ...altScenario 
              } as AlternativeTemplateForDisplay))}
              currentSearchQuery={currentScenario?.searchQuery}
              onSelectAlternative={handleSelectAlternative}
              onFindNewAlternatives={handleFindNewAlternatives}
              isLoadingAlternatives={isLoadingAlternatives}
            />
          </div>
        )}

        {/* Desktop Alternative Templates Sheet - Outside tabs */}
        <div className="hidden lg:block">
          <AlternativeTemplatesSheet 
            alternatives={alternativeTemplates.map(altScenario => ({
                templateId: altScenario.originalTemplateId,
                title: altScenario.name,
                platform: altScenario.platform as string,
                description: (altScenario as { description?: string }).description,
                nodesCount: altScenario.nodesSnapshot?.length || 0,
                ...altScenario 
            } as AlternativeTemplateForDisplay))}
            currentSearchQuery={currentScenario?.searchQuery}
            onSelectAlternative={handleSelectAlternative}
            onFindNewAlternatives={handleFindNewAlternatives}
            isLoadingAlternatives={isLoadingAlternatives}
          />
        </div>

        {/* Modals and other components... */}
        <ROISettingsPanel
          open={roiOpen}
          onOpenChange={setRoiOpen}
          platform={platform}
          runsPerMonth={runsPerMonth}
          setRunsPerMonth={(value) => {
            setRunsPerMonth(value);
            setTimeout(() => updateCurrentScenarioROI({ runsPerMonth: value }), 0);
          }}
          minutesPerRun={minutesPerRun}
          setMinutesPerRun={(value) => {
            setMinutesPerRun(value);
            setTimeout(() => updateCurrentScenarioROI({ minutesPerRun: value }), 0);
          }}
          hourlyRate={hourlyRate}
          setHourlyRate={(value) => {
            setHourlyRate(value);
            setTimeout(() => updateCurrentScenarioROI({ hourlyRate: value }), 0);
          }}
          taskMultiplier={taskMultiplier}
          setTaskMultiplier={(value) => {
            setTaskMultiplier(value);
            setTimeout(() => updateCurrentScenarioROI({ taskMultiplier: value }), 0);
          }}
          taskType={taskType}
          setTaskType={(value) => {
            setTaskType(value);
            setTimeout(() => updateCurrentScenarioROI({ taskMultiplier: taskTypeMultipliers[value as keyof typeof taskTypeMultipliers] }), 0);
          }}
          complianceEnabled={complianceEnabled}
          setComplianceEnabled={(value) => {
            setComplianceEnabled(value);
            setTimeout(() => updateCurrentScenarioROI({ complianceEnabled: value }), 0);
          }}
          revenueEnabled={revenueEnabled}
          setRevenueEnabled={(value) => {
            setRevenueEnabled(value);
            setTimeout(() => updateCurrentScenarioROI({ revenueEnabled: value }), 0);
          }}
          riskLevel={riskLevel}
          setRiskLevel={(value) => {
            setRiskLevel(value);
            setTimeout(() => updateCurrentScenarioROI({ riskLevel: value }), 0);
          }}
          riskFrequency={riskFrequency}
          setRiskFrequency={(value) => {
            setRiskFrequency(value);
            setTimeout(() => updateCurrentScenarioROI({ riskFrequency: value }), 0);
          }}
          errorCost={errorCost}
          setErrorCost={(value) => {
            setErrorCost(value);
            setTimeout(() => updateCurrentScenarioROI({ errorCost: value }), 0);
          }}
          monthlyVolume={monthlyVolume}
          setMonthlyVolume={(value) => {
            setMonthlyVolume(value);
            setTimeout(() => updateCurrentScenarioROI({ monthlyVolume: value }), 0);
          }}
          conversionRate={conversionRate}
          setConversionRate={(value) => {
            setConversionRate(value);
            setTimeout(() => updateCurrentScenarioROI({ conversionRate: value }), 0);
          }}
          valuePerConversion={valuePerConversion}
          setValuePerConversion={(value) => {
            setValuePerConversion(value);
            setTimeout(() => updateCurrentScenarioROI({ valuePerConversion: value }), 0);
          }}
          taskTypeMultipliers={taskTypeMultipliers}
          benchmarks={benchmarks}
          updateScenarioROI={updateCurrentScenarioROI}
        />

        {/* Drag overlay */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="bg-gray-800 text-white text-xs font-mono rounded px-2 py-1 shadow-lg opacity-80">
              <div className="flex items-center gap-1">
                {activeDragItem.type === 'trigger' && <PlayCircle className="h-4 w-4" />}
                {activeDragItem.type === 'action' && <Sparkles className="h-4 w-4" />}
                {activeDragItem.type === 'decision' && <GitBranch className="h-4 w-4" />}
                {activeDragItem.type === 'persona' && <User className="h-4 w-4" />}
                {activeDragItem.type === 'industry' && <Building className="h-4 w-4" />}
                {activeDragItem.type === 'painpoint' && <AlertCircle className="h-4 w-4" />}
                {activeDragItem.type === 'metric' && <TrendingUp className="h-4 w-4" />}
                {activeDragItem.type === 'urgency' && <Clock className="h-4 w-4" />}
                {activeDragItem.type === 'socialproof' && <Award className="h-4 w-4" />}
                {activeDragItem.type === 'objection' && <Shield className="h-4 w-4" />}
                {activeDragItem.type === 'value' && <Gem className="h-4 w-4" />}
                <span>{activeDragItem.type.charAt(0).toUpperCase() + activeDragItem.type.slice(1)}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ReactFlowProvider>
  );
}

// Main component with Suspense wrapper
export default function BuildPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading automation canvas...</p>
      </div>
    }>
      <BuildPageContent />
    </Suspense>
  );
}