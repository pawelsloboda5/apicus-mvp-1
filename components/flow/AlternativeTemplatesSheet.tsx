import React, { useState } from 'react';
import {
  Sheet, 
  SheetContent,
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, RefreshCw, Workflow, Zap, CheckSquare, ArrowRight, Clock, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Node } from '@xyflow/react';

export interface AlternativeTemplateForDisplay {
  templateId?: string;
  title?: string;
  platform?: "zapier" | "make" | "n8n";
  description?: string;
  nodesCount?: number;
  nodesSnapshot?: Node[];
  edgesSnapshot?: unknown[];
}

interface AlternativeTemplatesSheetProps {
  alternatives: AlternativeTemplateForDisplay[];
  currentSearchQuery?: string | null;
  onSelectAlternative: (template: AlternativeTemplateForDisplay) => void;
  onFindNewAlternatives: (query: string) => void;
  isLoadingAlternatives: boolean;
}

const platformConfig = {
  zapier: { icon: Zap, color: 'bg-orange-500', textColor: 'text-orange-600' },
  make: { icon: CheckSquare, color: 'bg-purple-500', textColor: 'text-purple-600' },
  n8n: { icon: Code, color: 'bg-red-500', textColor: 'text-red-600' },
  default: { icon: Workflow, color: 'bg-gray-500', textColor: 'text-gray-600' },
};

export function AlternativeTemplatesSheet({
  alternatives,
  currentSearchQuery,
  onSelectAlternative,
  onFindNewAlternatives,
  isLoadingAlternatives,
}: AlternativeTemplatesSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const ExpandHandle = () => (
    <SheetTrigger asChild>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-40 lg:block hidden">
        <Button 
          variant="outline" 
          className="rounded-t-lg rounded-b-none border-b-0 bg-background/95 backdrop-blur-sm shadow-lg px-6 py-2 h-auto"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            {alternatives.length > 0 
              ? `Alternative${alternatives.length !== 1 ? 's' : ''} Available` 
              : 'No Alternatives Found'
            }
          </span>
          {alternatives.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {alternatives.length}
            </Badge>
          )}
        </Button>
      </div>
    </SheetTrigger>
  );

  return (
    <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
      {!isExpanded && <ExpandHandle />}

      <SheetContent 
        side="bottom" 
        className="h-[65vh] max-h-[700px] min-h-[400px] w-full max-w-6xl mx-auto rounded-t-xl flex flex-col p-0 border-x bg-white dark:bg-gray-950"
      >
        {/* Proper SheetHeader with required SheetTitle */}
        <SheetHeader className="px-6 py-4 border-b bg-background/95 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Workflow className="h-6 w-6 text-primary" />
              <div>
                <SheetTitle className="text-xl">Alternative Templates</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentSearchQuery && `Based on your search: "${currentSearchQuery}"`}
                </p>
              </div>
            </div>
            
            {/* Move collapse button to header */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => currentSearchQuery && onFindNewAlternatives(currentSearchQuery)}
                disabled={!currentSearchQuery || isLoadingAlternatives}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingAlternatives && "animate-spin")} />
                Find More
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Hide
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        {alternatives.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alternatives.map((alt, index) => {
                    const platform = alt.platform?.toLowerCase() || 'default';
                    const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.default;
                    const PlatformIcon = config.icon;
                    const isCardExpanded = expandedCardId === (alt.templateId || String(index));
                    
                    // Extract key information
                    const triggerNode = alt.nodesSnapshot?.find(n => n.type === 'trigger');
                    const actionNodes = alt.nodesSnapshot?.filter(n => n.type === 'action') || [];
                    const uniqueApps = [...new Set(alt.nodesSnapshot?.map(n => (n.data as Record<string, unknown>)?.appName).filter(Boolean) as string[])];                    // Helper function to safely get node data
                    const getNodeData = (node: Record<string, unknown>, field: string): string => {
                      const value = (node?.data as Record<string, unknown>)?.[field];
                      return typeof value === 'string' ? value : String(value ?? 'Unknown');
                    };

                    return (
                      <div
                        key={alt.templateId || index}
                        className={cn(
                          "bg-card border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md",
                          isCardExpanded ? "ring-2 ring-primary shadow-lg" : "hover:border-muted-foreground/20"
                        )}
                      >
                        {/* Card Header */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => {
                            const newExpandedId = isCardExpanded ? null : (alt.templateId || String(index));
                            setExpandedCardId(newExpandedId);
                            
                            // Scroll the expanded card into view after a short delay
                            if (newExpandedId) {
                              setTimeout(() => {
                                const cardElement = document.querySelector(`[data-card-id="${newExpandedId}"]`);
                                if (cardElement) {
                                  cardElement.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'center' 
                                  });
                                }
                              }, 150);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-base leading-tight pr-2 line-clamp-2">
                              {alt.title || 'Untitled Alternative'}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className={cn("p-1.5 rounded-md", config.color)}>
                                <PlatformIcon className="h-4 w-4 text-white" />
                              </div>
                              {/* Expand/Collapse indicator */}
                              <div className="p-1">
                                {isCardExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{alt.nodesCount ?? 0} steps</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Workflow className="h-3 w-3" />
                              <span className="capitalize">{alt.platform || 'Unknown'}</span>
                            </div>
                          </div>

                          {/* Platform Badge */}
                          <Badge variant="outline" className={cn("text-xs", config.textColor)}>
                            {(alt.platform || 'Unknown').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Expanded Content */}
                        {isCardExpanded && (
                          <div 
                            className="border-t bg-muted/30"
                            data-card-id={alt.templateId || String(index)}
                          >
                            <div className="p-4 space-y-4">
                              {/* Flow Preview */}
                              <div>
                                <h5 className="text-sm font-semibold mb-2 text-foreground">Automation Flow</h5>
                                <div className="space-y-2">
                                  {triggerNode && (
                                    <div className="flex items-start gap-2 text-sm">
                                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                                      <div className="min-w-0 flex-1">
                                        <span className="font-medium">Trigger: </span>
                                        <span className="text-muted-foreground break-words">
                                          {getNodeData(triggerNode, 'appName')} - {getNodeData(triggerNode, 'label')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {actionNodes.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                      <span className="font-medium">Actions:</span>
                                      <span className="text-muted-foreground">
                                        {actionNodes.length} step{actionNodes.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Apps Involved */}
                              {uniqueApps.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2 text-foreground">Apps Involved</h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {uniqueApps.slice(0, 6).map(appName => (
                                      <Badge key={appName} variant="secondary" className="text-xs">
                                        {appName}
                                      </Badge>
                                    ))}
                                    {uniqueApps.length > 6 && (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        +{uniqueApps.length - 6} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Button - This is now visible when expanded! */}
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full flex items-center justify-center gap-2 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectAlternative(alt);
                                  setIsExpanded(false); // Close the sheet after selection
                                }}
                              >
                                <span>Use This Template</span>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Add some bottom padding to ensure last cards are fully visible */}
                <div className="h-4"></div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-muted/50 rounded-full p-6 mb-4">
              <Workflow className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Alternatives Found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {currentSearchQuery ? 
                (isLoadingAlternatives ? 
                  'Searching for alternative templates...' : 
                  'No alternative templates found for your search. Try different keywords or create your own automation.'
                ) : 
                'Describe your automation needs in the search to discover alternative templates.'
              }
            </p>
            {currentSearchQuery && !isLoadingAlternatives && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => onFindNewAlternatives(currentSearchQuery)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Search Again
              </Button>
            )}
          </div>
        )}
        
        <SheetFooter className="px-6 py-4 border-t bg-muted/20 flex-shrink-0">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <span>
              {alternatives.length > 0 
                ? `Found ${alternatives.length} alternative template${alternatives.length !== 1 ? 's' : ''}`
                : 'No alternatives available'
              }
            </span>
            <span className="text-right">
              Selecting a template will save your current work and load the new automation
            </span>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}