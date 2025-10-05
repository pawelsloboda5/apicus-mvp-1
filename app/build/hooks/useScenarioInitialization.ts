"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Node, Edge } from '@xyflow/react';
import { Scenario, PlatformType } from '@/lib/types';
import { transformTemplateNodes, transformTemplateEdges } from '@/lib/flow-utils';
import { DEFAULT_TEMPLATE } from '@/lib/templates/default-template';

export interface UseScenarioInitializationOptions {
  /** Scenario ID from URL params */
  scenarioIdParam: string | null;
  /** Template ID from URL params */
  templateIdParam: string | null;
  /** Search query from URL params */
  queryParam: string | null;
  /** Whether to use default template */
  useDefaultTemplate: boolean;
  /** Import parameter from URL */
  importParam: string | null;
  /** Scenario manager instance */
  scenarioManager: {
    scenario: Scenario | null;
    loadScenario: (id: string) => Promise<Scenario | undefined>;
    createScenario: (name: string, templateData?: Partial<Scenario>) => Promise<Scenario>;
  };
}

export interface UseScenarioInitializationReturn {
  /** Whether initialization is in progress */
  isLoading: boolean;
  /** Manually trigger initialization (useful for retry) */
  initialize: () => Promise<void>;
  /** Reset initialization state (useful for testing or force re-init) */
  reset: () => void;
}

/**
 * Helper function to load session-imported template
 */
function loadSessionImportedTemplate(): {
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
  platform: string;
  name: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem('importedTemplate');
  if (!stored) return null;

  try {
    const payload = JSON.parse(stored);
    let nodesSnapshot: Node[] = [];
    let edgesSnapshot: Edge[] = [];
    const platform = payload?.metadata?.platform || payload?.platform || "zapier";

    // If parser returned React Flow nodes directly
    if (Array.isArray(payload?.nodes) && payload.nodes[0]?.id) {
      nodesSnapshot = payload.nodes as Node[];
      edgesSnapshot = (payload.edges as Edge[]) || [];
    }
    // If template uses reactFlowId shape
    else if (Array.isArray(payload?.nodes) && payload.nodes[0]?.reactFlowId) {
      nodesSnapshot = transformTemplateNodes(
        payload.nodes,
        'import',
        (payload?.metadata?.platform || payload?.platform) === 'n8n' ? 'n8n' : 
        (payload?.metadata?.platform || payload?.platform) === 'make' ? 'make' : 'zapier'
      );
      edgesSnapshot = transformTemplateEdges(payload.edges || [], 'import');
    }

    if (nodesSnapshot.length > 0) {
      const name = payload?.metadata?.originalName || payload?.title || "Imported Workflow";
      // Clear after use
      sessionStorage.removeItem('importedTemplate');
      
      return {
        nodesSnapshot,
        edgesSnapshot,
        platform,
        name
      };
    }
  } catch (error) {
    console.error('Failed to parse session import:', error);
  }

  return null;
}

/**
 * Helper function to fetch and transform template data from API
 */
async function loadTemplateData(
  templateIdParam: string,
  loadedTemplateIdRef: React.MutableRefObject<string | null>
): Promise<{
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
  platform: string;
  taskType?: string;
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
  viewport?: unknown;
  name: string;
} | null> {
  // Check if we've already loaded this template to prevent duplicates
  if (loadedTemplateIdRef.current === templateIdParam) {
    console.log('⏭️ Skipping template fetch - already loaded:', templateIdParam);
    return null;
  }

  try {
    console.log('📥 Fetching template:', templateIdParam);
    loadedTemplateIdRef.current = templateIdParam; // Mark as loading

    const response = await fetch(`/api/templates/${templateIdParam}`);
    if (!response.ok) {
      console.error('❌ Failed to load template:', response.statusText);
      toast.error('Failed to load template');
      loadedTemplateIdRef.current = null; // Reset on error so user can retry
      return null;
    }

    const template = await response.json();
    console.log('✅ Template loaded:', template);

    // Transform nodes to have 'id' instead of 'reactFlowId'
    const transformedNodes = transformTemplateNodes(
      template.nodes,
      templateIdParam,
      (template.platform || template.source) === 'n8n' ? 'n8n' : 
      (template.platform || template.source) === 'make' ? 'make' : 'zapier'
    );

    // Transform edges to have proper 'id', 'source', and 'target'
    const transformedEdges = transformTemplateEdges(template.edges, templateIdParam);

    const result = {
      nodesSnapshot: transformedNodes,
      edgesSnapshot: transformedEdges,
      platform: template.platform || template.source || "zapier",
      viewport: template.viewport,
      // Copy other template metadata
      taskType: template.taskType,
      runsPerMonth: template.runsPerMonth,
      minutesPerRun: template.minutesPerRun,
      hourlyRate: template.hourlyRate,
      taskMultiplier: template.taskMultiplier,
      name: template.title || template.templateName || template.name || "Template Scenario"
    };

    console.log('✅ Template data prepared:', result);
    return result;
  } catch (error) {
    console.error('❌ Error loading template:', error);
    toast.error('Error loading template');
    loadedTemplateIdRef.current = null; // Reset on error so user can retry
    return null;
  }
}

/**
 * Custom hook to handle scenario initialization logic
 * Prevents duplicate scenarios/templates and handles various initialization paths
 */
export function useScenarioInitialization({
  scenarioIdParam,
  templateIdParam,
  queryParam,
  useDefaultTemplate,
  importParam,
  scenarioManager,
}: UseScenarioInitializationOptions): UseScenarioInitializationReturn {
  const router = useRouter();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  
  // Guard refs to prevent duplicate initialization
  const hasInitializedRef = useRef(false);
  const initializingRef = useRef(false);
  const loadedTemplateIdRef = useRef<string | null>(null);

  /**
   * Main initialization function
   */
  const initialize = useCallback(async () => {
    // Prevent duplicate initialization
    if (initializingRef.current || hasInitializedRef.current) {
      console.log('🛑 Skipping initialization - already initialized or in progress');
      return;
    }

    initializingRef.current = true;
    setIsLoading(true);

    try {
      // Path 1: Load existing scenario by ID
      if (scenarioIdParam) {
        await scenarioManager.loadScenario(scenarioIdParam);
        hasInitializedRef.current = true;
        return;
      }

      // Path 2: Create new scenario (with optional template data)
      let name = templateIdParam ? "Loading Template..." : 
                  queryParam ? `Search: ${queryParam}` : 
                  "Untitled Scenario";
      
      let templateData: Parameters<typeof scenarioManager.createScenario>[1] = undefined;

      // Handle session import first
      if (!templateIdParam && importParam === "session") {
        const importedData = loadSessionImportedTemplate();
        if (importedData) {
          templateData = {
            nodesSnapshot: importedData.nodesSnapshot,
            edgesSnapshot: importedData.edgesSnapshot,
            platform: importedData.platform as PlatformType,
          };
          name = importedData.name;
        }
      }

      // Use default template if requested
      if (!templateData && useDefaultTemplate) {
        templateData = {
          nodesSnapshot: DEFAULT_TEMPLATE.nodes,
          edgesSnapshot: DEFAULT_TEMPLATE.edges,
          platform: DEFAULT_TEMPLATE.platform,
          runsPerMonth: DEFAULT_TEMPLATE.runsPerMonth,
          minutesPerRun: DEFAULT_TEMPLATE.minutesPerRun,
          hourlyRate: DEFAULT_TEMPLATE.hourlyRate,
          taskMultiplier: DEFAULT_TEMPLATE.taskMultiplier,
          taskType: DEFAULT_TEMPLATE.taskType,
        };
        name = queryParam ? `${queryParam} - ${DEFAULT_TEMPLATE.name}` : DEFAULT_TEMPLATE.name;
      }

      // Load template data if template ID is provided
      if (!templateData && templateIdParam) {
        const loadedTemplate = await loadTemplateData(templateIdParam, loadedTemplateIdRef);
        if (loadedTemplate) {
          templateData = {
            nodesSnapshot: loadedTemplate.nodesSnapshot,
            edgesSnapshot: loadedTemplate.edgesSnapshot,
            platform: loadedTemplate.platform as PlatformType,
            viewport: loadedTemplate.viewport,
            taskType: loadedTemplate.taskType,
            runsPerMonth: loadedTemplate.runsPerMonth,
            minutesPerRun: loadedTemplate.minutesPerRun,
            hourlyRate: loadedTemplate.hourlyRate,
            taskMultiplier: loadedTemplate.taskMultiplier,
          };
          name = loadedTemplate.name;
        }
      }

      // Create the scenario
      const newScenario = await scenarioManager.createScenario(name, templateData);

      // Mark as initialized BEFORE updating URL to prevent re-initialization
      hasInitializedRef.current = true;

      // Update URL with new scenario ID
      const urlQuery = new URLSearchParams(window.location.search);
      urlQuery.set("sid", newScenario.id!.toString());
      urlQuery.delete("import"); // Clean up import param
      if (templateIdParam && !templateData) {
        urlQuery.set("tid", templateIdParam); // Keep tid if template failed to load
      }
      if (queryParam) {
        urlQuery.set("q", queryParam);
      }
      router.replace(`/build?${urlQuery.toString()}`, { scroll: false });

    } catch (error) {
      console.error('Failed to initialize scenario:', error);
      toast.error('Failed to initialize scenario');
      // Reset initialization flags on error so user can retry
      hasInitializedRef.current = false;
      initializingRef.current = false;
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [
    scenarioIdParam,
    templateIdParam,
    queryParam,
    useDefaultTemplate,
    importParam,
    scenarioManager,
    router,
  ]);

  /**
   * Reset initialization state (useful for testing or force re-init)
   */
  const reset = useCallback(() => {
    hasInitializedRef.current = false;
    initializingRef.current = false;
    loadedTemplateIdRef.current = null;
    setIsLoading(false);
  }, []);

  /**
   * Auto-initialize on mount or when scenario ID changes
   */
  useEffect(() => {
    // Only initialize once on mount, or if user explicitly navigates to a different scenario
    const shouldInitialize = !hasInitializedRef.current || 
      (scenarioIdParam && scenarioManager.scenario?.id?.toString() !== scenarioIdParam);
    
    if (shouldInitialize) {
      console.log('🚀 Initializing scenario - hasInitialized:', hasInitializedRef.current, 'scenarioIdParam:', scenarioIdParam);
      initialize();
    }

    // Cleanup function (rarely called for page components)
    return () => {
      // Don't reset on unmount as this is a page component that rarely unmounts
      // The flags will be reset on next mount/navigation naturally
    };
  }, [scenarioIdParam, initialize, scenarioManager.scenario?.id]);

  return {
    isLoading,
    initialize,
    reset,
  };
}

