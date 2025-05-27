import React, { useState } from 'react';
import {
  Sheet, 
  SheetContent,
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, XIcon, RefreshCw, Workflow, Zap, CheckSquare, MessageSquare } from 'lucide-react';
import { type Scenario } from '@/lib/db'; // Assuming Scenario type includes necessary fields for display
import { cn } from '@/lib/utils';

export interface AlternativeTemplateForDisplay extends Partial<Scenario> {
  // Explicitly define fields expected from parent for an alternative template
  templateId?: string; // This should be originalTemplateId from Scenario
  title?: string; // This should be name from Scenario
  platform?: string;
  description?: string;
  nodesCount?: number;
  // Add any other fields needed for quick stats, like primary app icons etc.
}

interface AlternativeTemplatesSheetProps {
  alternatives: AlternativeTemplateForDisplay[];
  currentSearchQuery?: string | null;
  onSelectAlternative: (template: AlternativeTemplateForDisplay) => void;
  onFindNewAlternatives: (query: string) => void;
  isLoadingAlternatives: boolean;
}

const platformIcons: Record<string, React.ElementType> = {
  zapier: Zap,
  make: CheckSquare, // Replace with actual Make icon if available
  n8n: MessageSquare,  // Replace with actual N8N icon if available
  default: Workflow,
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

  const SheetHandle = () => (
    <SheetTrigger asChild>
      <Button 
        variant="ghost" 
        className="w-full h-8 flex items-center justify-center bg-muted/50 hover:bg-muted rounded-t-lg cursor-grab focus-visible:ring-0" 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Collapse alternatives panel" : "Expand alternatives panel"}
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        <span className="ml-2 text-xs font-medium">
          {isExpanded ? 'Hide Alternatives' : alternatives.length > 0 ? `Show ${alternatives.length} Alternatives` : 'No Alternatives Found'}
        </span>
      </Button>
    </SheetTrigger>
  );

  return (
    <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
      {/* Render the handle outside SheetContent if Sheet is controlled by external open state tied to isExpanded */} 
      {/* For this setup, SheetTrigger inside the component seems fine and Sheet manages its open state based on it */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
        <div className={cn("w-full max-w-4xl mx-auto", !isExpanded && "mb-0")}>
          {!isExpanded && <SheetHandle />} {/* Show handle only when collapsed */} 
        </div>
      </div>

      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[50vh] max-h-[600px] min-h-[200px] w-full max-w-4xl mx-auto rounded-t-xl flex flex-col p-0 data-[state=closed]:translate-y-0 data-[state=open]:translate-y-0",
          // Custom transition if needed, though Sheet handles its own.
        )}
        onInteractOutside={(e) => {
            // Allow interaction with elements inside the SheetContent without closing it
            // Default behavior is to close on outside click. This might need adjustment if complex interactions are inside.
        }}
      >
        <SheetHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
          <div className="flex items-center">
            {isExpanded && <SheetHandle />} {/* Show handle inside when expanded to act as collapse button */} 
            <SheetTitle className={cn("ml-2", !isExpanded && "sr-only")}>Alternative Templates</SheetTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => currentSearchQuery && onFindNewAlternatives(currentSearchQuery)}
            disabled={!currentSearchQuery || isLoadingAlternatives}
            className="ml-auto"
          >
            {isLoadingAlternatives ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Find New
          </Button>
        </SheetHeader>
        
        {alternatives.length > 0 ? (
          <ScrollArea className="flex-grow p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alternatives.map((alt, index) => {
                const PlatformIcon = platformIcons[alt.platform?.toLowerCase() || 'default'] || platformIcons.default;
                return (
                  <div
                    key={alt.templateId || index}
                    className={cn(
                      "bg-card border rounded-lg p-3 flex flex-col items-start justify-start text-left hover:shadow-md transition-all duration-150 group relative",
                      expandedCardId === (alt.templateId || String(index)) ? "ring-2 ring-primary shadow-lg" : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      if (expandedCardId === (alt.templateId || String(index))) {
                        // If already expanded, clicking again could be a "select" action or collapse
                        // For now, let's make it so only the button triggers selection.
                        // To collapse on second click: setExpandedCardId(null);
                      } else {
                        setExpandedCardId(alt.templateId || String(index));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary flex-grow pr-2">
                        {alt.title || 'Untitled Alternative'}
                      </h4>
                      <PlatformIcon className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Nodes:</span>
                        <span className="font-medium text-foreground">{alt.nodesCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Platform:</span>
                        <span className="font-medium text-foreground capitalize">{alt.platform || 'Unknown'}</span>
                      </div>
                    </div>

                    {expandedCardId === (alt.templateId || String(index)) && (
                      <div className="mt-3 pt-3 border-t border-dashed w-full space-y-2">
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Trigger:</h5>
                          <p className="text-xs text-muted-foreground">
                            {alt.nodesSnapshot?.find(n => n.type === 'trigger')?.data?.appName || 'N/A'}
                            {' '}
                            <span className="italic">({alt.nodesSnapshot?.find(n => n.type === 'trigger')?.data?.label || 'Unknown Trigger'})</span>
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Apps Involved:</h5>
                          <div className="flex flex-wrap gap-1">
                            {[...new Set(alt.nodesSnapshot?.map(n => n.data?.appName).filter(Boolean) as string[])].slice(0, 5).map(appName => (
                              <span key={appName} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
                                {appName}
                              </span>
                            ))}
                            {(alt.nodesSnapshot?.map(n => n.data?.appName).filter(Boolean) as string[]).length > 5 && (
                               <span className="text-[10px] text-muted-foreground">...and more</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            onSelectAlternative(alt);
                          }}
                        >
                          + Add Automation
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {currentSearchQuery ? 
                (isLoadingAlternatives ? 'Loading alternatives...' : 'No alternative templates found for your query. Try a different search term.') : 
                'Describe your automation in the main search bar to find templates.'
              }
            </p>
          </div>
        )}
        <SheetFooter className="p-4 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
                Found {alternatives.length} alternative(s). Selecting one will save your current work and load the new template.
            </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 