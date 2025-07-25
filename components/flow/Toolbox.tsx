import { useDraggable } from "@dnd-kit/core";
import { Sparkles, GitBranch, PlayCircle, Zap, PlusCircle, Trash2, Edit3, Check, X, MailOpen, Menu, ChevronLeft, ChevronRight, GripVertical, Workflow, User, Building, AlertCircle, TrendingUp, Clock, Award, Shield, Gem, BarChart3, FileText, Download, Filter, Palette, Mail, Copy, Search, Import, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeType, PlatformType } from "@/lib/types";
import { db, Scenario, createScenario } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlternativeTemplateForDisplay } from "./AlternativeTemplatesSheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateResponse } from "@/lib/types";

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
  emailPreview: Mail,
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
      <SheetContent side="bottom" className="h-[35vh] lg:hidden max-h-[350px] min-h-[250px] bg-white dark:bg-gray-950">
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
        "border-r bg-muted/30 flex flex-col transition-all duration-300 relative h-full",
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

      {/* Tabs - Header Section (5%) */}
      {!isCollapsed && onActiveTabChange && (
        <div className="flex-shrink-0 p-4 pb-3 border-b">
          <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as 'canvas' | 'analytics')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canvas" className="font-medium">Canvas</TabsTrigger>
              <TabsTrigger value="analytics" className="font-medium">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main Content Area with Fixed Grid Layout */}
      <div className={cn(
        "flex-1 overflow-hidden", 
        isCollapsed ? 'hidden' : 'grid',
        !isCollapsed && "grid-rows-[minmax(0,1fr)]"
      )}
      style={{
        display: isCollapsed ? 'none' : 'grid',
        gridTemplateRows: activeTab === 'canvas' 
          ? '30% 12% 40% 18%' // Email Context (30%), Basic Nodes (12%), Scenarios (40%), Emails (18%)
          : '1fr', // Analytics takes full space
      }}
      >
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

  const getPlatformColor = (platform?: PlatformType) => {
    switch (platform) {
      case "zapier": return "bg-orange-500";
      case "make": return "bg-purple-500";
      case "n8n": return "bg-red-500";
      default: return "bg-muted-foreground";
    }
  };

  const handleAddNewScenario = () => {
    setNewScenarioModalOpen(true);
  };

  const handleCreateFromScratch = async () => {
    const newScenarioName = "Untitled Scenario";
    const newId = await createScenario(newScenarioName);
    setNewScenarioModalOpen(false);
    setPromptInput("");
    router.push(`/build?sid=${newId}`);
    if (onLoadScenario) {
      onLoadScenario(newId);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleGenerateFromPrompt = async () => {
    if (!promptInput.trim()) return;
    
    setIsGeneratingFromPrompt(true);
    try {
      // For now, create a scenario with the prompt as the name
      // Later this could call an AI API to generate the workflow
      const scenarioName = promptInput.trim();
      const newId = await createScenario(scenarioName);
      setNewScenarioModalOpen(false);
      setPromptInput("");
      router.push(`/build?sid=${newId}`);
      if (onLoadScenario) {
        onLoadScenario(newId);
      }
      if (isMobile && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to generate scenario from prompt:', error);
    } finally {
      setIsGeneratingFromPrompt(false);
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

  const handleDuplicateScenario = async (scenario: Scenario) => {
    const duplicateName = `${scenario.name} (Copy)`;
    const newId = await db.scenarios.add({
      name: duplicateName,
      slug: nanoid(8), // Generate a new slug for the duplicate
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
      if (onLoadScenario) onLoadScenario(newId);
    }
  };

  // Template search dialog state
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TemplateResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'all' | 'zapier' | 'make' | 'n8n'>('all');
  
  // New scenario modal state
  const [newScenarioModalOpen, setNewScenarioModalOpen] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  
  // Debounce search to avoid too many API calls
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Template search functionality
  const performTemplateSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/templates/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search templates');
      }

      setSearchResults(data.templates || []);
    } catch (error) {
      console.error('Template search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search templates');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchInputChange = (value: string) => {
    setTemplateSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performTemplateSearch(value);
    }, 500); // 500ms debounce
  };

  // Create scenario from template
  const handleCreateFromTemplate = async (template: TemplateResponse) => {
    try {
      // Create a new scenario with the template data
      const newId = await db.scenarios.add({
        name: template.title || 'Untitled Scenario',
        slug: nanoid(8),
        platform: template.platform as PlatformType | undefined,
        nodesSnapshot: template.nodes,
        edgesSnapshot: template.edges,
        originalTemplateId: template.templateId,
        searchQuery: templateSearchQuery,
        templatePricingData: template.appPricingMap,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      if (newId && typeof newId === 'number') {
        setTemplateSearchOpen(false);
        setTemplateSearchQuery('');
        setSearchResults([]);
        router.push(`/build?sid=${newId}`);
        if (onLoadScenario) onLoadScenario(newId);
      }
    } catch (error) {
      console.error('Failed to create scenario from template:', error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
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
    <>
      {isMobile ? (
        // Mobile layout - keep existing implementation
        <div className={cn("flex flex-col h-full overflow-hidden p-4")}>
          <SheetHeader className="px-0 pb-4 shrink-0">
            <SheetTitle className="text-lg font-display">Toolbox</SheetTitle>
          </SheetHeader>
          
          {/* Mobile content - simplified for now */}
          {activeTab === 'canvas' && (
            <>
              <div className="shrink-0 mb-6">
                <ul className="grid grid-cols-3 gap-2">
                  {ITEMS.map((item) => (
                    <ToolboxItem 
                      key={item.type} 
                      {...item} 
                      isMobile={true}
                      isSelected={selectedNodeType === item.type}
                      onSelect={onNodeTypeSelect}
                    />
                  ))}
                </ul>
              </div>
              
              <div className="flex-grow min-h-0">
                <h2 className="mb-4 text-base font-display font-semibold tracking-tight px-1">My Scenarios</h2>
                {/* Mobile scenarios list */}
              </div>
            </>
          )}
        </div>
      ) : (
        // Desktop layout with fixed grid
        <>
          {activeTab === 'canvas' ? (
            // Canvas mode with 4 sections
            <>
              {/* Section 1: Email Context (30%) */}
              <div className="overflow-hidden flex flex-col p-4 border-b">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h2 className="text-sm font-display font-semibold tracking-tight">Email Context</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-3 shrink-0">
                  Drag these nodes to influence email generation
                </p>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {EMAIL_CONTEXT_ITEMS.slice(0, 4).map((item) => (
                      <EmailContextToolboxItem
                        key={item.type}
                        {...item}
                        isSelected={selectedNodeType === item.type}
                        onSelect={onNodeTypeSelect}
                      />
                    ))}
                  </div>
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground px-1 py-2">
                      Show more context nodes ({EMAIL_CONTEXT_ITEMS.length - 4} more)
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {EMAIL_CONTEXT_ITEMS.slice(4).map((item) => (
                        <EmailContextToolboxItem
                          key={item.type}
                          {...item}
                          isSelected={selectedNodeType === item.type}
                          onSelect={onNodeTypeSelect}
                        />
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              {/* Section 2: Basic Nodes (12%) */}
              <div className="p-4 border-b flex flex-col">
                <h2 className="mb-2 text-sm font-display font-semibold tracking-tight text-muted-foreground shrink-0">
                  Basic Nodes
                </h2>
                <ul className="flex gap-2 flex-1 items-center">
                  {ITEMS.map((item) => (
                    <ToolboxItem 
                      key={item.type} 
                      {...item} 
                      isMobile={false}
                      isSelected={selectedNodeType === item.type}
                      onSelect={onNodeTypeSelect}
                      compact={true}
                    />
                  ))}
                </ul>
              </div>

              {/* Section 3: My Scenarios (40%) */}
              <div className="overflow-hidden flex flex-col p-4 border-b">
                {/* Action Bar */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h2 className="text-sm font-display font-semibold tracking-tight">
                    My Scenarios
                    {filteredScenarios && ` (${filteredScenarios.length})`}
                  </h2>
                </div>
                <div className="flex gap-2 mb-3 shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddNewScenario}
                    className="h-8 text-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    New
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleAddNewScenario}
                  >
                    <Import className="h-3.5 w-3.5 mr-1" />
                    Import
                  </Button>
                  <Dialog open={templateSearchOpen} onOpenChange={setTemplateSearchOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <Search className="h-3.5 w-3.5 mr-1" />
                        Search
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-white dark:bg-gray-950">
                      <DialogHeader>
                        <DialogTitle>Search Templates</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Search for automation templates..."
                          value={templateSearchQuery}
                          onChange={(e) => handleSearchInputChange(e.target.value)}
                          className="mb-4"
                          autoFocus
                        />
                        
                        {isSearching && (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        )}
                        
                        {searchError && (
                          <div className="text-center text-destructive py-4">
                            <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                            <p className="text-sm">{searchError}</p>
                          </div>
                        )}
                        
                        {!isSearching && !searchError && searchResults.length === 0 && templateSearchQuery && (
                          <div className="text-center text-muted-foreground py-8">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No templates found for "{templateSearchQuery}"</p>
                            <p className="text-xs mt-1">Try different keywords or browse all templates</p>
                          </div>
                        )}
                        
                        {searchResults.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-display font-semibold tracking-tight">
                                Found {searchResults.length} template{searchResults.length !== 1 ? 's' : ''}
                              </h3>
                              <select
                                value={selectedPlatformFilter}
                                onChange={(e) => setSelectedPlatformFilter(e.target.value as any)}
                                className="text-xs border rounded px-2 py-1"
                                disabled
                              >
                                <option value="all">All Platforms</option>
                                <option value="zapier">Zapier</option>
                                <option value="make">Make.com</option>
                                <option value="n8n">n8n</option>
                              </select>
                            </div>
                            
                            <ScrollArea className="h-[400px] pr-4">
                              <div className="space-y-3">
                                {searchResults.map((template) => (
                                  <div
                                    key={template.templateId}
                                    className="group relative p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                                    onClick={() => handleCreateFromTemplate(template)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-display font-semibold text-sm line-clamp-1">
                                            {template.title || 'Untitled Template'}
                                          </h4>
                                          <Badge variant="outline" className="text-xs shrink-0">
                                            {template.platform?.toUpperCase() || 'UNKNOWN'}
                                          </Badge>
                                        </div>
                                        
                                        {template.richDescription && (
                                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                            {template.richDescription}
                                          </p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Workflow className="h-3 w-3" />
                                            {template.stepCount || template.nodes?.length || 0} steps
                                          </span>
                                          {template.appNames && template.appNames.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Zap className="h-3 w-3" />
                                              {template.appNames.slice(0, 3).join(', ')}
                                              {template.appNames.length > 3 && ` +${template.appNames.length - 3}`}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCreateFromTemplate(template);
                                        }}
                                      >
                                        Use Template
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        
                        {!isSearching && !templateSearchQuery && (
                          <div className="text-center text-muted-foreground py-12">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">Search for automation templates</p>
                            <p className="text-xs mt-1">Try "email marketing", "lead generation", or "data sync"</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* New Scenario Modal */}
                <Dialog open={newScenarioModalOpen} onOpenChange={(open) => {
                  setNewScenarioModalOpen(open);
                  if (!open) {
                    setPromptInput("");
                    setIsGeneratingFromPrompt(false);
                  }
                }}>
                  <DialogContent className="sm:max-w-[500px] bg-white dark:bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-display font-semibold">Create New Automation</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Generate a workflow from a prompt or start building from scratch
                      </p>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                      {/* AI Generation Option */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">Generate with AI</h3>
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Describe the automation you want to build... e.g., 'Send a welcome email when someone signs up and add them to a CRM'"
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            className="min-h-[100px] resize-none"
                            disabled={isGeneratingFromPrompt}
                          />
                          <Button
                            onClick={handleGenerateFromPrompt}
                            disabled={!promptInput.trim() || isGeneratingFromPrompt}
                            className="w-full font-medium"
                          >
                            {isGeneratingFromPrompt ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Automation
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">OR</span>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>

                      {/* Manual Creation Option */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">Start from Scratch</h3>
                        <Button
                          variant="outline"
                          onClick={handleCreateFromScratch}
                          className="w-full font-medium"
                          disabled={isGeneratingFromPrompt}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Blank Automation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Scenarios List */}
                <div className="flex-1 overflow-hidden">
                  {filteredScenarios && filteredScenarios.length > 0 ? (
                    <ScrollArea className="h-full">
                      <ul className="space-y-1 pr-2">
                        {filteredScenarios.map((scenario) => (
                          <li key={scenario.id} className="group relative">
                            {editingScenarioId === scenario.id ? (
                              <div className="flex items-center p-1.5 rounded-lg bg-muted/60">
                                <Input
                                  ref={inputRef}
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(scenario.id!);
                                    if (e.key === 'Escape') handleCancelRename();
                                  }}
                                  className="h-7 text-sm flex-grow px-2 py-1 mr-1"
                                />
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleSaveRename(scenario.id!)} title="Save name">
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelRename} title="Cancel edit">
                                  <X className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center group rounded-lg hover:bg-muted/60 transition-colors duration-200">
                                <Button
                                  variant={activeScenarioId === scenario.id ? "secondary" : "ghost"}
                                  size="sm"
                                  className="flex-1 justify-start text-sm h-8 px-2 py-1 font-medium overflow-hidden"
                                  onClick={() => handleScenarioClick(scenario.id!)}
                                >
                                  <span className={cn("mr-2 h-2.5 w-2.5 rounded-full shrink-0", getPlatformColor(scenario.platform))} />
                                  <span className="truncate pr-8">{scenario.name}</span>
                                </Button>
                                
                                {/* Always visible action menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 shrink-0 mr-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleDuplicateScenario(scenario)}>
                                      <Copy className="h-3.5 w-3.5 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRenameScenario(scenario)}>
                                      <Edit3 className="h-3.5 w-3.5 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteScenario(scenario.id!)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground italic text-center">
                        No saved scenarios yet.<br/>Click '+ New' to create one.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Generated Emails (18%) */}
              <div className="overflow-hidden flex flex-col p-4">
                <h2 className="mb-3 text-sm font-display font-semibold tracking-tight shrink-0 text-muted-foreground">
                  Generated Emails
                </h2>
                <div className="flex-1 overflow-hidden">
                  {emailNodes && emailNodes.length > 0 ? (
                    <ScrollArea className="h-full">
                      <ul className="space-y-1 pr-2">
                        {emailNodes.map((emailNode) => (
                          <li key={emailNode.id} className="group relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm h-8 px-2 py-1 font-medium hover:bg-muted/60"
                              onClick={() => handleEmailNodeClick(emailNode.id)}
                            >
                              <MailOpen className="mr-2 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">{emailNode.title}</span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground italic text-center">
                        No emails generated yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Analytics mode - takes full space
            <div className="p-4 overflow-y-auto h-full">
              <h2 className="mb-4 text-base font-display font-semibold tracking-tight">Analytics Tools</h2>
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
          )}
        </>
      )}
    </>
  );
}

// Props for ToolboxItem component
interface ToolboxItemProps {
  type: NodeType;
  label: string;
  isMobile?: boolean;
  isSelected?: boolean;
  onSelect?: (type: NodeType) => void;
  compact?: boolean;
}

// Updated ToolboxItem for better visual design
function ToolboxItem({ type, label, isMobile = false, isSelected = false, onSelect, compact = false }: ToolboxItemProps) {
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

  if (compact) {
    return (
      <li
        ref={setNodeRef}
        {...attributes}
        {...enhancedListeners}
        className={cn(
          "cursor-grab rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 relative group",
          "p-3 flex flex-col items-center justify-center gap-1.5",
          isDragging && "opacity-50 scale-95",
          isSelected 
            ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]" 
            : "bg-background hover:bg-muted/60 border-border hover:border-primary/30"
        )}
        data-testid={`toolbox-item-${type}`}
        onClick={handleClick}
      >
        <Icon className={cn(
          "h-5 w-5",
          isSelected && "text-primary"
        )} />
        <span className={cn(
          "text-xs font-medium text-center",
          isSelected && "text-primary"
        )}>
          {label}
        </span>
        
        {isSelected && !isDragging && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-background" />
        )}
      </li>
    );
  }

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
    audience: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-500/30",
    problem: "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-500/30",
    value: "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-500/30",
    timing: "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-500/30",
    trust: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-500/30",
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
        "flex cursor-grab items-center gap-2 rounded-lg border p-3 shadow-sm hover:shadow-md transition-all duration-200 relative group",
        categoryColors[category as keyof typeof categoryColors] || "bg-background",
        isDragging && "opacity-50 scale-95",
        isSelected && "ring-2 ring-primary scale-[1.02]"
      )}
      onClick={handleClick}
      title={`${label}: ${description}`}
    >
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0",
        iconColors[category as keyof typeof iconColors] || "text-foreground"
      )} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs truncate">{label}</div>
      </div>
      
      {isSelected && !isDragging && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-background" />
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
      <SheetContent side="bottom" className="h-[60vh] lg:hidden bg-white dark:bg-gray-950">
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