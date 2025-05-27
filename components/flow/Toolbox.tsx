import { useDraggable } from "@dnd-kit/core";
import { Sparkles, PlayCircle, GitBranch, Calculator, ListChecks, Save, PlusCircle, Trash2, Edit3, Check, X, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeType, PlatformType } from "@/lib/types";
import { db, Scenario, createScenario } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const ITEMS: { type: NodeType; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "action", label: "Action" },
  { type: "decision", label: "Decision" },
  // Group might be removed from draggable items if it's only created via multi-select
  // { type: "group", label: "Group" }, 
];

const typeIcon = {
  trigger: PlayCircle,
  action: Sparkles,
  decision: GitBranch,
  group: Calculator, // Kept for potential future use or if group nodes are directly addable
};

interface ToolboxProps {
  onLoadScenario?: (scenarioId: number) => void;
  activeScenarioId?: number | null;
  emailNodes?: Array<{ id: string; title: string; }>;
  onFocusNode?: (nodeId: string) => void;
}

export function Toolbox({ onLoadScenario, activeScenarioId, emailNodes, onFocusNode }: ToolboxProps) {
  const savedScenarios = useLiveQuery(() => db.scenarios.orderBy('updatedAt').reverse().toArray(), []);
  const router = useRouter();
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getPlatformColor = (platform?: PlatformType) => {
    switch (platform) {
      case "zapier": return "bg-orange-500";
      case "make": return "bg-purple-600";
      case "n8n": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const handleAddNewScenario = async () => {
    const newScenarioName = "Untitled Scenario";
    const newId = await createScenario(newScenarioName);
    router.push(`/build?sid=${newId}`);
    if (onLoadScenario) {
      onLoadScenario(newId);
    }
  };

  const handleDeleteScenario = async (scenarioId: number) => {
    await db.scenarios.delete(scenarioId);
    // If the deleted scenario was the active one, navigate to a new or default state
    if (activeScenarioId === scenarioId) {
      const firstScenario = await db.scenarios.orderBy('updatedAt').reverse().first();
      if (firstScenario?.id) {
        router.push(`/build?sid=${firstScenario.id}`);
        if (onLoadScenario) onLoadScenario(firstScenario.id);
      } else {
        // Or create a new one if no scenarios are left
        const newId = await createScenario("Untitled Scenario");
        router.push(`/build?sid=${newId}`);
        if (onLoadScenario) onLoadScenario(newId);
      }
    }
  };

  const handleRenameScenario = (scenario: Scenario) => {
    setEditingScenarioId(scenario.id!);
    setEditingName(scenario.name);
  };

  const handleSaveRename = async (scenarioId: number) => {
    if (editingName.trim() === "") return;
    await db.scenarios.update(scenarioId, { name: editingName.trim(), updatedAt: Date.now() });
    setEditingScenarioId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingScenarioId(null);
    setEditingName("");
  };
  
  useEffect(() => {
    if (editingScenarioId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingScenarioId]);

  const filteredScenarios = savedScenarios?.filter(scenario => {
    // Always show the active scenario, even if it's a new "Untitled Scenario"
    if (scenario.id === activeScenarioId) return true;
    // Show if the name is not "Untitled Scenario"
    if (scenario.name !== "Untitled Scenario") return true;
    // Show if it's an "Untitled Scenario" but has some content (nodes)
    if (scenario.nodesSnapshot && scenario.nodesSnapshot.length > 0) return true;
    // Otherwise, hide default "Untitled Scenarios" that haven't been touched
    return false;
  });

  return (
    <aside className="w-60 border-r bg-muted/40 p-3 flex flex-col">
      <div>
        <h2 className="mb-2 text-sm font-semibold tracking-tight px-1">Toolbox</h2>
        <ul className="space-y-1.5">
          {ITEMS.map((item) => (
            <ToolboxItem key={item.type} {...item} />
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t flex-grow flex flex-col min-h-0">
        <h2 className="mb-2 text-sm font-semibold tracking-tight px-1 flex justify-between items-center">
          My Scenarios
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddNewScenario} title="Add new scenario">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </h2>
        {filteredScenarios && filteredScenarios.length > 0 ? (
          <ul className="space-y-1.5 overflow-y-auto flex-grow pr-1">
            {filteredScenarios.map((scenario) => (
              <li key={scenario.id} className="flex items-center group relative rounded-md hover:bg-muted/80">
                {editingScenarioId === scenario.id ? (
                  <div className="flex items-center w-full p-0.5">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(scenario.id!);
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      className="h-7 text-xs flex-grow px-1 py-0.5 mr-1"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleSaveRename(scenario.id!)} title="Save name">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCancelRename} title="Cancel edit">
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant={activeScenarioId === scenario.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs h-auto py-1.5 px-2 truncate flex-grow"
                    onClick={() => {
                        if (onLoadScenario && scenario.id) {
                            router.push(`/build?sid=${scenario.id}`);
                            onLoadScenario(scenario.id);
                        }
                    }}
                    title={scenario.name}
                  >
                    <span className={cn("mr-2 h-2 w-2 rounded-full shrink-0", getPlatformColor(scenario.platform))} />
                    <span className="truncate flex-grow text-left group-hover:mr-12 transition-all duration-200 ease-in-out">{scenario.name}</span>
                  </Button>
                )}
                {editingScenarioId !== scenario.id && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-muted/80 rounded-r-md">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRenameScenario(scenario)} title="Rename scenario">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete scenario">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the scenario "{scenario.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteScenario(scenario.id!)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground px-1 italic mt-2">No saved scenarios yet. Click '+' to add one.</p>
        )}
      </div>

      {/* Generated Emails Section */}
      {emailNodes && emailNodes.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h2 className="mb-2 text-sm font-semibold tracking-tight px-1">
            Generated Emails
          </h2>
          <ul className="space-y-1.5 overflow-y-auto flex-grow pr-1 max-h-40">
            {emailNodes.map((emailNode) => (
              <li key={emailNode.id} className="flex items-center group relative rounded-md hover:bg-muted/80">
                <Button
                  variant={"ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-1.5 px-2 truncate flex-grow"
                  onClick={() => {
                    if (onFocusNode) {
                      onFocusNode(emailNode.id);
                    }
                  }}
                  title={emailNode.title}
                >
                  <MailOpen className="mr-2 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="truncate flex-grow text-left">
                    {emailNode.title}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

interface ToolboxItemProps {
  type: NodeType;
  label: string;
}

function ToolboxItem({ type, label }: ToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${type}`,
    data: { nodeType: type },
  });

  const Icon = typeIcon[type];

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-1 rounded-sm border bg-background p-1 text-xs shadow-sm",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </li>
  );
} 