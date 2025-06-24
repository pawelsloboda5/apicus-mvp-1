import { useDraggable } from "@dnd-kit/core";
import { Sparkles, GitBranch, PlayCircle, Zap, PlusCircle, Trash2, Edit3, Check, X, MailOpen, Menu, ChevronLeft, ChevronRight, GripVertical, Workflow, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem, BarChart3, FileText, Download, Filter, Palette } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS: { type: NodeType; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "action", label: "Action" },
  { type: "decision", label: "Decision" },
  // Group might be removed from draggable items if it's only created via multi-select
  // { type: "group", label: "Group" }, 
];

const EMAIL_CONTEXT_ITEMS: { 
  type: NodeType; 
  label: string; 
  description: string;
  defaultValue: string;
  category: string;
}[] = [
  { 
    type: "persona", 
    label: "Target Persona", 
    description: "Define who the email is for",
    defaultValue: "Marketing Manager",
    category: "audience"
  },
  { 
    type: "industry", 
    label: "Industry Context", 
    description: "Specify the industry vertical",
    defaultValue: "SaaS",
    category: "audience"
  },
  { 
    type: "painpoint", 
    label: "Pain Point", 
    description: "Highlight specific challenges",
    defaultValue: "Manual data entry",
    category: "problem"
  },
  { 
    type: "metric", 
    label: "Success Metric", 
    description: "Define key success indicators",
    defaultValue: "Time saved per week",
    category: "value"
  },
  { 
    type: "urgency", 
    label: "Urgency Factor", 
    description: "Add time-sensitive elements",
    defaultValue: "End of quarter",
    category: "timing"
  },
  { 
    type: "socialproof", 
    label: "Social Proof", 
    description: "Include testimonial or case study",
    defaultValue: "500+ companies automated",
    category: "trust"
  },
  { 
    type: "objection", 
    label: "Objection Handler", 
    description: "Address common concerns",
    defaultValue: "No technical skills needed",
    category: "trust"
  },
  { 
    type: "value", 
    label: "Value Proposition", 
    description: "Emphasize unique benefits",
    defaultValue: "10x faster than competitors",
    category: "value"
  }
];

// Analytics toolbox items placeholder
const ANALYTICS_ITEMS = [
  { icon: BarChart3, label: "Export Chart", description: "Export chart as PNG/SVG" },
  { icon: FileText, label: "Generate Report", description: "Create PDF report" },
  { icon: Download, label: "Export Data", description: "Download CSV data" },
  { icon: Filter, label: "Filter Options", description: "Filter metrics by date" },
  { icon: Palette, label: "Chart Themes", description: "Customize chart colors" },
];

const typeIcon = {
  trigger: PlayCircle,
  action: Sparkles,
  decision: GitBranch,
  group: Zap,
  persona: User,
  industry: Building,
  painpoint: AlertCircle,
  metric: TrendingUp,
  urgency: Clock,
  socialproof: Award,
  objection: Shield,
  value: Gem,
};

interface ToolboxProps {
  onLoadScenario?: (scenarioId: number) => void;
  activeScenarioId?: number | null;
  emailNodes?: Array<{ id: string; title: string; }>;
  onFocusNode?: (nodeId: string) => void;
  isMobile?: boolean;
  selectedNodeType?: NodeType;
  onNodeTypeSelect?: (type: NodeType) => void;
  activeTab?: 'canvas' | 'analytics';
  onActiveTabChange?: (tab: 'canvas' | 'analytics') => void;
}

// Mobile Toolbox Trigger - Bottom positioned with fixed height
export function MobileToolboxTrigger({ 
  onLoadScenario, 
  activeScenarioId, 
  emailNodes, 
  onFocusNode,
  selectedNodeType,
  onNodeTypeSelect 
}: Omit<ToolboxProps, 'isMobile'>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="fixed bottom-4 left-4 z-50 lg:hidden shadow-lg px-4 font-medium"
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
          selectedNodeType={selectedNodeType}
          onNodeTypeSelect={onNodeTypeSelect}
        />
      </SheetContent>
    </Sheet>
  );
}

// Desktop Toolbox with Resizable and Collapsible functionality
export function Toolbox({ 
  onLoadScenario, 
  activeScenarioId, 
  emailNodes, 
  onFocusNode,
  selectedNodeType,
  onNodeTypeSelect,
  activeTab = 'canvas',
  onActiveTabChange
}: ToolboxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(300); // Increased default width
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(240, e.clientX), 500); // Min 240px, Max 500px
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
      className={cn(
        "border-r bg-muted/30 flex flex-col transition-all duration-300 relative",
        isCollapsed ? 'w-12' : ''
      )}
      style={{ width: isCollapsed ? '48px' : `${width}px` }}
    >
      {/* Collapse/Expand Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-10 h-7 w-7 bg-background/80 backdrop-blur-sm border border-border/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Toolbox" : "Collapse Toolbox"}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group transition-colors duration-200"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Tabs - Always visible at top */}
      {!isCollapsed && onActiveTabChange && (
        <div className="p-4 pb-3">
          <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as 'canvas' | 'analytics')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canvas" className="font-medium">Canvas</TabsTrigger>
              <TabsTrigger value="analytics" className="font-medium">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Content */}
      <div className={cn("flex-1 overflow-hidden", isCollapsed ? 'hidden' : 'block')}>
        <ToolboxContent 
          onLoadScenario={onLoadScenario}
          activeScenarioId={activeScenarioId}
          emailNodes={emailNodes}
          onFocusNode={onFocusNode}
          isMobile={false}
          selectedNodeType={selectedNodeType}
          onNodeTypeSelect={onNodeTypeSelect}
          activeTab={activeTab}
        />
      </div>

      {/* Collapsed Icons */}
      {isCollapsed && activeTab === 'canvas' && (
        <div className="flex flex-col items-center py-4 gap-3">
          {ITEMS.map((item) => {
            const Icon = typeIcon[item.type];
            const isSelected = selectedNodeType === item.type;
            
            return (
              <div 
                key={item.type}
                className={cn(
                  "p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105",
                  isSelected 
                    ? "bg-primary border-primary text-primary-foreground shadow-md" 
                    : "bg-background hover:bg-muted border-border"
                )}
                onClick={() => onNodeTypeSelect?.(item.type)}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsed Analytics Icons */}
      {isCollapsed && activeTab === 'analytics' && (
        <div className="flex flex-col items-center py-4 gap-3">
          {ANALYTICS_ITEMS.slice(0, 3).map((item) => {
            const Icon = item.icon;
            
            return (
              <div 
                key={item.label}
                className="p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 bg-background hover:bg-muted border-border"
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
          })}
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
  onClose,
  selectedNodeType,
  onNodeTypeSelect,
  activeTab = 'canvas'
}: ToolboxProps & { onClose?: () => void }) {
  const savedScenarios = useLiveQuery(() => db.scenarios.orderBy('updatedAt').reverse().toArray(), []);
  const router = useRouter();
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmailContextNodes, setShowEmailContextNodes] = useState(false);

  const getPlatformColor = (platform?: PlatformType) => {
    switch (platform) {
      case "zapier": return "bg-orange-500";
      case "make": return "bg-purple-500";
      case "n8n": return "bg-red-500";
      default: return "bg-muted-foreground";
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
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", isMobile ? "p-4" : "px-4 pb-4")}>
      {isMobile && (
        <SheetHeader className="px-0 pb-4 shrink-0">
          <SheetTitle className="text-lg font-display">Toolbox</SheetTitle>
        </SheetHeader>
      )}
      
      {/* Canvas Mode Content */}
      {activeTab === 'canvas' && (
        <>
          {/* Section 1: Node Types - Fixed height, always visible */}
          <div className="shrink-0 mb-6">
            {!isMobile && <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1">Node Types</h2>}
            <ul className={cn("space-y-3", isMobile && "grid grid-cols-3 gap-3")}>
              {ITEMS.map((item) => (
                <ToolboxItem 
                  key={item.type} 
                  {...item} 
                  isMobile={isMobile}
                  isSelected={selectedNodeType === item.type}
                  onSelect={onNodeTypeSelect}
                />
              ))}
            </ul>
          </div>
          
          {/* NEW Section: Email Context Nodes - Desktop only */}
          {!isMobile && (
            <div className="border-t pt-6 mb-6">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-base font-display font-semibold tracking-tight">Email Context Nodes</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailContextNodes(!showEmailContextNodes)}
                  className="h-7 px-3 text-xs font-medium"
                >
                  {showEmailContextNodes ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {showEmailContextNodes && (
                <>
                  <p className="text-xs text-muted-foreground mb-4 px-1 leading-relaxed">
                    Add these special nodes to influence how emails are generated
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {EMAIL_CONTEXT_ITEMS.map((item) => (
                      <EmailContextToolboxItem
                        key={item.type}
                        {...item}
                        isSelected={selectedNodeType === item.type}
                        onSelect={onNodeTypeSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Analytics Mode Content */}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Tools */}
          <div className="shrink-0 mb-6">
            <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1">Analytics Tools</h2>
            <div className="space-y-2">
              {ANALYTICS_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-auto py-3 px-3 hover:bg-muted/80"
                    disabled
                  >
                    <Icon className="h-4 w-4 mr-3 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Metrics Summary - Placeholder */}
          <div className="border-t pt-6 mb-6">
            <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1">Quick Stats</h2>
            <div className="space-y-3 px-1">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Snapshots Taken</span>
                <span className="text-sm font-semibold font-mono">0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Charts Created</span>
                <span className="text-sm font-semibold font-mono">2</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Last Export</span>
                <span className="text-sm font-semibold font-mono">Never</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Section 2: My Scenarios - Fixed height with scrolling */}
      <div className={cn("border-t pt-6 flex flex-col h-[40vh]", isMobile ? "flex-grow min-h-0" : "flex-shrink-0")}>
        <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1 flex justify-between items-center shrink-0">
          My Scenarios
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddNewScenario} title="Add new scenario">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </h2>
        {filteredScenarios && filteredScenarios.length > 0 ? (
          <div className={cn("overflow-hidden", isMobile ? "flex-1 min-h-0" : "h-[40vh]")}>
            <ScrollArea className="h-full pr-1">
              <ul className="space-y-2 pb-2">
                {filteredScenarios.map((scenario) => (
                  <li key={scenario.id} className="flex items-center group relative rounded-lg hover:bg-muted/60 transition-colors duration-200">
                    {editingScenarioId === scenario.id ? (
                      <div className="flex items-center w-full p-2">
                        <Input
                          ref={inputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(scenario.id!);
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          className="h-8 text-sm flex-grow px-2 py-1 mr-2"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSaveRename(scenario.id!)} title="Save name">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCancelRename} title="Cancel edit">
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant={activeScenarioId === scenario.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-sm h-auto py-3 px-3 truncate flex-grow font-medium hover:bg-muted/80"
                        onClick={() => handleScenarioClick(scenario.id!)}
                        title={scenario.name}
                      >
                        <span className={cn("mr-3 h-3 w-3 rounded-full shrink-0", getPlatformColor(scenario.platform))} />
                        <span className="truncate flex-grow text-left group-hover:mr-16 transition-all duration-200 ease-in-out">{scenario.name}</span>
                      </Button>
                    )}
                    
                    {editingScenarioId !== scenario.id && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm rounded-md">
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

      {/* Section 3: Generated Emails - Fixed height with scrolling, always shown on desktop - Only in Canvas mode */}
      {!isMobile && activeTab === 'canvas' && (
        <div className="border-t pt-6 flex flex-col flex-shrink-0">
          <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1 shrink-0">
            Generated Emails
          </h2>
          <div className="overflow-hidden h-[20vh]">
            <ScrollArea className="h-full pr-1">
              {emailNodes && emailNodes.length > 0 ? (
                <ul className="space-y-2 pb-2">
                  {emailNodes.map((emailNode) => (
                    <li key={emailNode.id} className="flex items-center group relative rounded-lg hover:bg-muted/60 transition-colors duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm h-auto py-3 px-3 truncate flex-grow font-medium hover:bg-muted/80"
                        onClick={() => handleEmailNodeClick(emailNode.id)}
                        title={emailNode.title}
                      >
                        <MailOpen className="mr-3 h-4 w-4 shrink-0 text-primary" />
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
      
      {/* Section 3: Generated Emails - Mobile version only shows when emails exist - Only in Canvas mode */}
      {isMobile && emailNodes && emailNodes.length > 0 && activeTab === 'canvas' && (
        <div className="border-t pt-6 flex flex-col min-h-0">
          <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1 shrink-0">
            Generated Emails
          </h2>
          <div className="overflow-hidden max-h-24">
            <ScrollArea className="h-full pr-1">
              <ul className="space-y-2 pb-2">
                {emailNodes.map((emailNode) => (
                  <li key={emailNode.id} className="flex items-center group relative rounded-lg hover:bg-muted/60 transition-colors duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm h-auto py-3 px-3 truncate flex-grow font-medium hover:bg-muted/80"
                      onClick={() => handleEmailNodeClick(emailNode.id)}
                      title={emailNode.title}
                    >
                      <MailOpen className="mr-3 h-4 w-4 shrink-0 text-primary" />
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
}

// Props for ToolboxItem component
interface ToolboxItemProps {
  type: NodeType;
  label: string;
  isMobile?: boolean;
  isSelected?: boolean;
  onSelect?: (type: NodeType) => void;
}

// Updated ToolboxItem for better visual design
function ToolboxItem({ type, label, isMobile = false, isSelected = false, onSelect }: ToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${type}`,
    data: { nodeType: type },
  });

  const Icon = typeIcon[type];

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're in the middle of dragging
    if (isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(type);
  };

  // Create enhanced listeners that also trigger selection
  const enhancedListeners = React.useMemo(() => {
    if (!listeners) return {};
    
    return {
      ...listeners,
      onMouseDown: (e: React.MouseEvent) => {
        // Select the node type when drag starts
        onSelect?.(type);
        // Call the original onMouseDown from dnd-kit
        if (listeners.onMouseDown) {
          listeners.onMouseDown(e as unknown as MouseEvent);
        }
      },
      onTouchStart: (e: React.TouchEvent) => {
        // Select the node type when touch drag starts  
        onSelect?.(type);
        // Call the original onTouchStart from dnd-kit
        if (listeners.onTouchStart) {
          listeners.onTouchStart(e as unknown as TouchEvent);
        }
      }
    };
  }, [listeners, onSelect, type]);

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...enhancedListeners}
      className={cn(
        "flex cursor-grab items-center gap-3 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 relative group",
        isMobile ? "p-4 text-base justify-center flex-col" : "p-4 text-sm",
        isDragging && "opacity-50 scale-95",
        isSelected 
          ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]" 
          : "bg-background hover:bg-muted/60 border-border hover:border-primary/30"
      )}
      data-testid={`toolbox-item-${type}`}
      onClick={handleClick}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors duration-200",
        isSelected ? "bg-primary/20" : "bg-muted/60 group-hover:bg-muted"
      )}>
        <Icon className={cn(
          isMobile ? "h-6 w-6" : "h-5 w-5",
          isSelected && "text-primary"
        )} />
      </div>
      <span className={cn(
        "font-medium",
        isMobile && "text-center mt-1",
        isSelected && "text-primary font-semibold"
      )}>
        {label}
      </span>
      
      {isSelected && !isDragging && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
      )}
    </li>
  );
}

// New component for Email Context nodes with improved design
interface EmailContextToolboxItemProps {
  type: NodeType;
  label: string;
  description: string;
  defaultValue: string;
  category: string;
  isSelected?: boolean;
  onSelect?: (type: NodeType) => void;
}

function EmailContextToolboxItem({ 
  type, 
  label, 
  description, 
  defaultValue,
  category,
  isSelected = false, 
  onSelect 
}: EmailContextToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-context-${type}`,
    data: { 
      nodeType: type,
      isEmailContext: true,
      contextValue: defaultValue,
      category
    },
  });

  const Icon = typeIcon[type];

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(type);
  };

  const enhancedListeners = React.useMemo(() => {
    if (!listeners) return {};
    
    return {
      ...listeners,
      onMouseDown: (e: React.MouseEvent) => {
        onSelect?.(type);
        if (listeners.onMouseDown) {
          listeners.onMouseDown(e as unknown as MouseEvent);
        }
      },
      onTouchStart: (e: React.TouchEvent) => {
        onSelect?.(type);
        if (listeners.onTouchStart) {
          listeners.onTouchStart(e as unknown as TouchEvent);
        }
      }
    };
  }, [listeners, onSelect, type]);

  const categoryColors = {
    audience: "border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-500/50",
    problem: "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-500/50",
    value: "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-500/50",
    timing: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-500/50",
    trust: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500/50",
  };

  const iconColors = {
    audience: "text-purple-600 dark:text-purple-400",
    problem: "text-red-600 dark:text-red-400",
    value: "text-green-600 dark:text-green-400",
    timing: "text-orange-600 dark:text-orange-400",
    trust: "text-blue-600 dark:text-blue-400",
  };

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...enhancedListeners}
      className={cn(
        "flex cursor-grab items-start gap-3 rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all duration-200 relative group",
        categoryColors[category as keyof typeof categoryColors] || "bg-background",
        isDragging && "opacity-50 scale-95",
        isSelected && "ring-2 ring-primary scale-[1.02]"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors duration-200 bg-white/60 dark:bg-gray-900/60"
      )}>
        <Icon className={cn(
          "h-5 w-5 flex-shrink-0",
          iconColors[category as keyof typeof iconColors] || "text-foreground"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</div>
        <div className="text-xs text-foreground/80 mt-2 font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md inline-block">
          &quot;{defaultValue}&quot;
        </div>
      </div>
      
      {isSelected && !isDragging && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
      )}
    </li>
  );
}

// Updated mobile alternative templates button
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
          className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg px-3 py-2 h-auto flex flex-col items-center gap-1 font-medium"
          title="Alternative Templates"
        >
          <Workflow className="h-4 w-4" />
          <span className="text-xs">
            {alternatives.length > 0 ? `${alternatives.length} Alt` : 'Alt'}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] lg:hidden">
        <div className="flex flex-col h-full">
          {/* Add proper SheetHeader and SheetTitle for accessibility */}
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-display">Alternative Templates</SheetTitle>
            {currentSearchQuery && (
              <p className="text-sm text-muted-foreground">
                Based on your search: &apos;{currentSearchQuery}&apos;
              </p>
            )}
          </SheetHeader>
          
          {alternatives.length > 0 ? (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 gap-4">
                {alternatives.map((alt, index) => {
                  // Extract key information
                  const triggerNode = alt.nodesSnapshot?.find((n: Record<string, unknown>) => n.type === 'trigger');
                  const uniqueApps = [...new Set(alt.nodesSnapshot?.map((n: Record<string, unknown>) => (n.data as Record<string, unknown>)?.appName).filter(Boolean))];
                  
                  return (
                    <div
                      key={alt.templateId || index}
                      className="bg-card border rounded-xl p-4 space-y-3 hover:bg-muted/30 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-display font-semibold text-base mb-1 line-clamp-2">
                            {alt.title || 'Untitled Alternative'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="font-mono">{alt.nodesCount ?? 0} nodes</span>
                            <span className="capitalize">{alt.platform || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs font-medium">
                            {(alt.platform || 'Unknown').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {triggerNode && (
                          <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Trigger: </span>
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
                        className="w-full font-medium"
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
              className="w-full font-medium"
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