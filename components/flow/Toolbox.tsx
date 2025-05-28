import { useDraggable } from "@dnd-kit/core";
import { Sparkles, GitBranch, PlayCircle, Zap, PlusCircle, Trash2, Edit3, Check, X, MailOpen, Menu, ChevronLeft, ChevronRight, GripVertical, Workflow } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlternativeTemplateForDisplay } from "./AlternativeTemplatesSheet";

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
  group: Zap, // Kept for potential future use or if group nodes are directly addable
};

interface ToolboxProps {
  onLoadScenario?: (scenarioId: number) => void;
  activeScenarioId?: number | null;
  emailNodes?: Array<{ id: string; title: string; }>;
  onFocusNode?: (nodeId: string) => void;
  isMobile?: boolean;
}

// Mobile Toolbox Trigger Button Component
// Mobile Toolbox Trigger - Bottom positioned with fixed height
export function MobileToolboxTrigger({ onLoadScenario, activeScenarioId, emailNodes, onFocusNode }: Omit<ToolboxProps, 'isMobile'>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="fixed bottom-4 left-4 z-50 lg:hidden shadow-lg px-4"
          title="Open Toolbox"
        >
          <Menu className="h-4 w-4 mr-2" />
          Toolbox
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[35vh] lg:hidden max-h-[350px] min-h-[250px]">
        <ToolboxContent 
          onLoadScenario={onLoadScenario}
          activeScenarioId={activeScenarioId}
          emailNodes={emailNodes}
          onFocusNode={onFocusNode}
          isMobile={true}
          onClose={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// Desktop Toolbox with Resizable and Collapsible functionality
export function Toolbox({ onLoadScenario, activeScenarioId, emailNodes, onFocusNode }: ToolboxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(280); // Default width - increased from 240
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(200, e.clientX), 500); // Min 200px, Max 500px
    setWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside 
      className={`border-r bg-muted/40 flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-12' : ''
      }`}
      style={{ width: isCollapsed ? '48px' : `${width}px` }}
    >
      {/* Collapse/Expand Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-6 w-6"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Toolbox" : "Collapse Toolbox"}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-hidden ${isCollapsed ? 'hidden' : 'block'}`}>
        <ToolboxContent 
          onLoadScenario={onLoadScenario}
          activeScenarioId={activeScenarioId}
          emailNodes={emailNodes}
          onFocusNode={onFocusNode}
          isMobile={false}
        />
      </div>

      {/* Collapsed Icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4">
          <div className="p-2 rounded-md bg-background border">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="p-2 rounded-md bg-background border">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div className="p-2 rounded-md bg-background border">
            <GitBranch className="h-5 w-5" />
          </div>
        </div>
      )}
    </aside>
  );
}

// Update ToolboxContent to handle larger desktop size
function ToolboxContent({ 
  onLoadScenario, 
  activeScenarioId, 
  emailNodes, 
  onFocusNode, 
  isMobile = false,
  onClose 
}: ToolboxProps & { onClose?: () => void }) {
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
    if (isMobile && onClose) {
      onClose();
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
    if (isMobile && onClose) {
      onClose();
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

  const handleScenarioClick = (scenarioId: number) => {
    if (onLoadScenario) {
      router.push(`/build?sid=${scenarioId}`);
      onLoadScenario(scenarioId);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleEmailNodeClick = (nodeId: string) => {
    if (onFocusNode) {
      onFocusNode(nodeId);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };  const content = (
    <div className={cn("flex flex-col h-full overflow-hidden", isMobile ? "p-4" : "p-4")}>
      {isMobile && (
        <SheetHeader className="px-0 pb-4 shrink-0">
          <SheetTitle className="text-lg">Toolbox</SheetTitle>
        </SheetHeader>
      )}
      
      {/* Section 1: Node Types - Fixed height, always visible */}
      <div className="shrink-0 mb-4">
        {!isMobile && <h2 className="mb-3 text-base font-semibold tracking-tight px-1">Node Types</h2>}
        <ul className={cn("space-y-2", isMobile && "grid grid-cols-3 gap-3")}>
          {ITEMS.map((item) => (
            <ToolboxItem key={item.type} {...item} isMobile={isMobile} />
          ))}
        </ul>
      </div>
      
      {/* Section 2: My Scenarios - Fixed height with scrolling */}
      <div className={cn("border-t pt-4 flex flex-col h-[40vh]", isMobile ? "flex-grow min-h-0" : "flex-shrink-0")}>
        <h2 className="mb-3 text-base font-semibold tracking-tight px-1 flex justify-between items-center shrink-0">
          My Scenarios
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddNewScenario} title="Add new scenario">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </h2>
        {filteredScenarios && filteredScenarios.length > 0 ? (
          <div className={cn("overflow-hidden", isMobile ? "flex-1 min-h-0" : "h-[40vh]")}>
            <ScrollArea className="h-full pr-1">
              <ul className="space-y-2 pb-2">
                {filteredScenarios.map((scenario) => (
                  <li key={scenario.id} className="flex items-center group relative rounded-md hover:bg-muted/80">
                    {editingScenarioId === scenario.id ? (
                      <div className="flex items-center w-full p-1">
                        <Input
                          ref={inputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(scenario.id!);
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          className="h-8 text-sm flex-grow px-2 py-1 mr-1"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleSaveRename(scenario.id!)} title="Save name">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelRename} title="Cancel edit">
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant={activeScenarioId === scenario.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-sm h-auto py-2 px-3 truncate flex-grow"
                        onClick={() => handleScenarioClick(scenario.id!)}
                        title={scenario.name}
                      >
                        <span className={cn("mr-3 h-2.5 w-2.5 rounded-full shrink-0", getPlatformColor(scenario.platform))} />
                        <span className="truncate flex-grow text-left group-hover:mr-16 transition-all duration-200 ease-in-out">{scenario.name}</span>
                      </Button>
                    )}
                    
                    {editingScenarioId !== scenario.id && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-muted/80 rounded-r-md">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRenameScenario(scenario)} title="Rename scenario">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete scenario">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the scenario &quot;{scenario.name}&quot;.
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
            </ScrollArea>
          </div>
        ) : (
          <div className={cn("flex items-center px-1", isMobile ? "h-[80px]" : "h-[180px]")}>
            <p className="text-sm text-muted-foreground italic">No saved scenarios yet. Click &apos;+&apos; to add one.</p>
          </div>
        )}
      </div>

      {/* Section 3: Generated Emails - Fixed height with scrolling, always shown on desktop */}
      {!isMobile && (
        <div className="border-t pt-4 flex flex-col flex-shrink-0">
          <h2 className="mb-3 text-base font-semibold tracking-tight px-1 shrink-0">
            Generated Emails
          </h2>
          <div className="overflow-hidden h-[20vh]">
            <ScrollArea className="h-full pr-1">
              {emailNodes && emailNodes.length > 0 ? (
                <ul className="space-y-2 pb-2">
                  {emailNodes.map((emailNode) => (
                    <li key={emailNode.id} className="flex items-center group relative rounded-md hover:bg-muted/80">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm h-auto py-2 px-3 truncate flex-grow"
                        onClick={() => handleEmailNodeClick(emailNode.id)}
                        title={emailNode.title}
                      >
                        <MailOpen className="mr-3 h-4 w-4 shrink-0 text-blue-500" />
                        <span className="truncate flex-grow text-left">
                          {emailNode.title}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground italic text-center">
                    No emails generated yet.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
      
      {/* Section 3: Generated Emails - Mobile version only shows when emails exist */}
      {isMobile && emailNodes && emailNodes.length > 0 && (
        <div className="border-t pt-4 flex flex-col min-h-0">
          <h2 className="mb-3 text-base font-semibold tracking-tight px-1 shrink-0">
            Generated Emails
          </h2>
          <div className="overflow-hidden max-h-24">
            <ScrollArea className="h-full pr-1">
              <ul className="space-y-2 pb-2">
                {emailNodes.map((emailNode) => (
                  <li key={emailNode.id} className="flex items-center group relative rounded-md hover:bg-muted/80">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm h-auto py-2 px-3 truncate flex-grow"
                      onClick={() => handleEmailNodeClick(emailNode.id)}
                      title={emailNode.title}
                    >
                      <MailOpen className="mr-3 h-4 w-4 shrink-0 text-blue-500" />
                      <span className="truncate flex-grow text-left">
                        {emailNode.title}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );

  return content;
}

// Props for ToolboxItem component
interface ToolboxItemProps {
  type: NodeType;
  label: string;
  isMobile?: boolean;
}

// Update ToolboxItem for larger desktop size
function ToolboxItem({ type, label, isMobile = false }: ToolboxItemProps) {
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
        "flex cursor-grab items-center gap-2 rounded-md border bg-background shadow-sm hover:shadow-md transition-shadow",
        isMobile ? "p-3 text-base justify-center flex-col" : "p-3 text-sm",
        isDragging && "opacity-50"
      )}
      data-testid={`toolbox-item-${type}`}
    >
      <Icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
      <span className={cn(isMobile && "text-center mt-1")}>{label}</span>
    </li>
  );
}

// Add this new component to Toolbox.tsx
export function MobileAlternativeTemplatesButton({ 
  alternatives, 
  currentSearchQuery, 
  onSelectAlternative, 
  onFindNewAlternatives, 
  isLoadingAlternatives 
}: {
  alternatives: AlternativeTemplateForDisplay[];
  currentSearchQuery?: string | null;
  onSelectAlternative: (template: AlternativeTemplateForDisplay) => void;
  onFindNewAlternatives: (query: string) => void;
  isLoadingAlternatives: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg px-3 py-2 h-auto flex flex-col items-center gap-1"
          title="Alternative Templates"
        >
          <Workflow className="h-4 w-4" />
          <span className="text-xs font-medium">
            {alternatives.length > 0 ? `${alternatives.length} Alt` : 'Alt'}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] lg:hidden">
        <div className="flex flex-col h-full">
          {/* Add proper SheetHeader and SheetTitle for accessibility */}
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">Alternative Templates</SheetTitle>
            {currentSearchQuery && (
              <p className="text-sm text-muted-foreground">
                Based on your search: &apos;{currentSearchQuery}&apos;
              </p>
            )}
          </SheetHeader>
          
          {alternatives.length > 0 ? (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 gap-4">                {alternatives.map((alt, index) => {
                  // Extract key information
                  const triggerNode = alt.nodesSnapshot?.find((n: Record<string, unknown>) => n.type === 'trigger');
                  const uniqueApps = [...new Set(alt.nodesSnapshot?.map((n: Record<string, unknown>) => (n.data as Record<string, unknown>)?.appName).filter(Boolean))];
                  
                  return (
                    <div
                      key={alt.templateId || index}
                      className="bg-card border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1 line-clamp-2">
                            {alt.title || 'Untitled Alternative'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>{alt.nodesCount ?? 0} nodes</span>
                            <span className="capitalize">{alt.platform || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {(alt.platform || 'Unknown').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {triggerNode && (
                          <div className="text-xs">                            <span className="font-medium text-muted-foreground">Trigger: </span>
                            <span>
                              {`${(triggerNode.data as Record<string, unknown>)?.appName || 'Unknown'} - ${(triggerNode.data as Record<string, unknown>)?.label || 'Unknown Trigger'}`}
                            </span>
                          </div>
                        )}
                        {uniqueApps.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Apps: </span>
                            <span>
                              {uniqueApps.slice(0, 3).join(', ')}
                              {uniqueApps.length > 3 && ` +${uniqueApps.length - 3} more`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          onSelectAlternative(alt);
                          setIsOpen(false);
                        }}
                      >
                        Use This Template
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isLoadingAlternatives ? 'Loading alternatives...' : 'No alternative templates found.'}
              </p>
            </div>
          )}
          
          {/* Footer with action button */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => currentSearchQuery && onFindNewAlternatives(currentSearchQuery)}
              disabled={!currentSearchQuery || isLoadingAlternatives}
            >
              {isLoadingAlternatives ? 'Loading...' : 'Find More Alternatives'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}