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
import { Gamepad2, Sword, Coins } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Scenario } from "@/lib/db";
import { nanoid } from "nanoid";
import { useDroppable } from "@dnd-kit/core";

const PLATFORMS = ["zapier", "make", "n8n"] as const;

// Disable SSR for Toolbox because dnd-kit generates ids non-deterministically, which causes hydration mismatch warnings.
const Toolbox = dynamic(() => import("@/components/flow/Toolbox").then(mod => mod.Toolbox), {
  ssr: false,
});

export default function BuildPage() {
  const router = useRouter();
  const params = useSearchParams();
  const scenarioIdParam = params.get("sid");
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
  };

  // Ensure a Scenario exists (one per user for now)
  useEffect(() => {
    async function ensureScenario() {
      if (scenarioIdParam) {
        setScenarioId(Number(scenarioIdParam));
        return;
      }
      const id = await createScenario("Untitled Scenario");
      setScenarioId(id);
      router.replace(`/build?sid=${id}`);
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

  // Persist edges when they change
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

  // Selected node convenience
  const selectedNode = nodes.find((n) => n.id === selectedId);

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
      const next = addEdge(connection, eds);
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

      const snapped = {
        x: Math.round(pos.x / 8) * 8,
        y: Math.round(pos.y / 8) * 8,
      };

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

  /* ------------------------------------------------------------ */
  /*  RPG-style Platform Stats Banner                             */
  /* ------------------------------------------------------------ */

  function StatsBar({ p }: { p: "zapier" | "make" | "n8n" }) {
    const tierName: Record<typeof p, string> = {
      zapier: "Professional",
      make: "Core",
      n8n: "Starter",
    } as any;

    const data = pricing[p];
    const tier = data.tiers.find((t) => t.name === tierName[p]) || data.tiers[0];

    const costPerUnit = tier.quota
      ? (tier.monthlyUSD / tier.quota).toFixed(4)
      : "—";

    // ROI calculations
    const costPerUnitNum = tier.quota ? tier.monthlyUSD / tier.quota : 0;
    const platformCost = runsPerMonth * costPerUnitNum;

    const hoursSaved = (runsPerMonth * minutesPerRun) / 60;
    const timeValue = hoursSaved * hourlyRate * taskMultiplier;
    const netROI = timeValue - platformCost;
    const roiRatio = platformCost ? timeValue / platformCost : 0;

    return (
      <div
        className="flex items-center gap-2 rounded-sm border bg-muted/50 px-2 py-1 text-xs font-mono shadow-inner"
      >
        <Sword className="h-3 w-3 text-primary" />
        <span className="capitalize font-semibold tracking-tight text-foreground">
          {p}
        </span>
        <span className="opacity-70">•</span>
        <span title="Included quota">
          {tier.quota.toLocaleString()} {data.unit}
        </span>
        <span className="opacity-70">@</span>
        <span>${costPerUnit}/{data.unit}</span>

        {/* Dividers */}
        <span className="opacity-30 mx-1">|</span>

        {/* Value */}
        <span title="Monthly Time Value" className="text-green-600 dark:text-green-400">
          +${timeValue.toFixed(0)}
        </span>
        <span className="opacity-70">/</span>
        <span title="Platform Cost" className="text-red-600 dark:text-red-400">
          -${platformCost.toFixed(0)}
        </span>
        <span className="opacity-30">=</span>
        <span title="Net ROI" className="font-semibold">
          ${netROI.toFixed(0)}
        </span>
      </div>
    );
  }

  /* ---------- ROI Sheet open state ---------- */
  const [roiOpen, setRoiOpen] = useState(false);

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
              <StatsBar p={platform} />
            </div>
            <div className="flex items-center gap-2">
              <PlatformSwitcher value={platform} onChange={setPlatform} />
              <Button size="icon" variant="ghost" onClick={() => setRoiOpen(true)} title="ROI Settings">
                <Coins className="h-4 w-4" />
              </Button>
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
            <div
              ref={(node) => {
                reactFlowWrapper.current = node;
                setDroppableRef(node);
              }}
              className="flex-grow"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onNodeClick={(_, node) => setSelectedId(node.id)}
                nodeTypes={nodeTypes}
                fitView
                defaultViewport={initialViewport}
                onMoveEnd={handleMoveEnd}
                snapToGrid
                snapGrid={[8, 8]}
                onInit={(instance) => setRfInstance(instance as ReactFlowInstance)}
                className="bg-[linear-gradient(to_right,transparent_49%,theme(colors.border)_50%),linear-gradient(to_bottom,transparent_49%,theme(colors.border)_50%)] bg-[size:1rem_1rem]"
              >
                <Background gap={16} color="var(--border)" />
                <Controls position="bottom-right" />
              </ReactFlow>

              {/* Parameter Sheet */}
              <Sheet
                open={!!selectedNode}
                onOpenChange={(open) => {
                  if (!open) setSelectedId(null);
                }}
              >
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Node Properties</SheetTitle>
                    <SheetDescription>
                      Configure the selected node's basic settings.
                    </SheetDescription>
                  </SheetHeader>
                  {selectedNode && (
                    <div className="p-4 space-y-4">
                      <label className="text-xs font-medium text-foreground/80">
                        Label
                        <Input
                          className="mt-1"
                          value={selectedNode.data?.label ?? ""}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            setNodes((ns: Node<any>[]) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, label: newLabel } }
                                  : n
                              )
                            );
                          }}
                        />
                      </label>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* ROI Settings Sheet */}
        <Sheet open={roiOpen} onOpenChange={setRoiOpen}>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>ROI Settings</SheetTitle>
              <SheetDescription>
                Adjust workload and labor assumptions to see live ROI.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-4">
              {/* Runs per month */}
              <div>
                <Label htmlFor="runs">Runs per Month</Label>
                <Input
                  id="runs"
                  type="number"
                  min={0}
                  value={runsPerMonth}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRunsPerMonth(v);
                    updateScenarioROI({ runsPerMonth: v });
                  }}
                />
              </div>

              {/* Minutes saved */}
              <div>
                <Label htmlFor="minutes">Minutes Saved per Run</Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0}
                  value={minutesPerRun}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMinutesPerRun(v);
                    updateScenarioROI({ minutesPerRun: v });
                  }}
                />
              </div>

              {/* Hourly rate */}
              <div>
                <Label htmlFor="hourly">Hourly Wage ($)</Label>
                <Input
                  id="hourly"
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setHourlyRate(v);
                    updateScenarioROI({ hourlyRate: v });
                  }}
                />
              </div>

              {/* Task multiplier */}
              <div>
                <Label htmlFor="mult">Task Value Multiplier (V*)</Label>
                <Input
                  id="mult"
                  type="number"
                  step={0.1}
                  min={0.5}
                  max={5}
                  value={taskMultiplier}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTaskMultiplier(v);
                    updateScenarioROI({ taskMultiplier: v });
                  }}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </DndContext>
    </ReactFlowProvider>
  );
}

function PlatformSwitcher({
  value,
  onChange,
}: {
  value: "zapier" | "make" | "n8n";
  onChange: (p: "zapier" | "make" | "n8n") => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-md border p-1 bg-muted">
      {PLATFORMS.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === value ? "default" : "ghost"}
          className={cn("capitalize", p === value && "shadow")}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
    </div>
  );
}

function handleAddNode(setNodes: any, currentNodes: Node<any>[]) {
  const id = `n-${currentNodes.length + 1}`;
  setNodes((nds: any[]) => [
    ...nds,
    {
      id,
      type: "action",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
      data: { label: `Node ${nds.length + 1}` },
    },
  ]);
} 