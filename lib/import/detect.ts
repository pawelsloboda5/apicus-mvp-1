import { 
  MakeBlueprintSchema, 
  N8nWorkflowSchema, 
  ZapierExportSchema,
  Platform,
  ImportError
} from './types';

// Type guards for platform detection
interface ObjectWithFlow {
  flow: unknown;
}

interface ObjectWithBlueprint {
  blueprint: unknown;
}

interface ObjectWithNodes {
  nodes: unknown;
}

interface ObjectWithConnections {
  connections: unknown;
}

interface ObjectWithZaps {
  zaps: unknown;
}

interface ObjectWithModules {
  name: unknown;
  modules: unknown;
}

interface ObjectWithSteps {
  steps: unknown;
}

interface NodeWithType {
  type: string;
}

interface StepWithType {
  type: string;
}

/**
 * Detects the platform of a workflow JSON file
 * @param data The parsed JSON data
 * @returns The detected platform or null if unknown
 */
export function detectPlatform(data: unknown): Platform | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  try {
    // Check for Make.com blueprint structure
    // Make exports have a "flow" array at the root or inside "blueprint"
    if ('flow' in data && Array.isArray((data as ObjectWithFlow).flow)) {
      // Root level flow array - Make.com blueprint
      const result = MakeBlueprintSchema.safeParse(data);
      if (result.success) return 'make';
    }
    
    if ('blueprint' in data && typeof (data as ObjectWithBlueprint).blueprint === 'object') {
      // Blueprint wrapper - also Make.com
      const blueprint = (data as ObjectWithBlueprint).blueprint;
      const result = MakeBlueprintSchema.safeParse(blueprint);
      if (result.success) return 'make';
    }

    // Check for n8n workflow structure
    // n8n exports have "nodes" array and "connections" object
    if ('nodes' in data && Array.isArray((data as ObjectWithNodes).nodes) && 
        'connections' in data && typeof (data as ObjectWithConnections).connections === 'object') {
      const result = N8nWorkflowSchema.safeParse(data);
      if (result.success) return 'n8n';
    }

    // Check for Zapier export structure
    // Zapier exports have a "zaps" array
    if ('zaps' in data && Array.isArray((data as ObjectWithZaps).zaps)) {
      const result = ZapierExportSchema.safeParse(data);
      if (result.success) return 'zapier';
    }

    // Additional heuristic checks for edge cases
    
    // Make.com alternative format check
    if ('name' in data && 'modules' in data && Array.isArray((data as ObjectWithModules).modules)) {
      // Some Make exports might use "modules" instead of "flow"
      return 'make';
    }

    // n8n alternative check - look for node type patterns
    if ('nodes' in data && Array.isArray((data as ObjectWithNodes).nodes)) {
      const nodes = (data as ObjectWithNodes).nodes as unknown[];
      if (nodes.length > 0 && typeof nodes[0] === 'object' && nodes[0] && 'type' in nodes[0]) {
        const firstNode = nodes[0] as NodeWithType;
        if (typeof firstNode.type === 'string' && firstNode.type.includes('n8n-nodes-')) {
          return 'n8n';
        }
      }
    }

    // Zapier alternative check - look for step structure
    if ('steps' in data && Array.isArray((data as ObjectWithSteps).steps)) {
      const steps = (data as ObjectWithSteps).steps as unknown[];
      if (steps.length > 0 && typeof steps[0] === 'object' && steps[0] && 'type' in steps[0]) {
        const firstStep = steps[0] as StepWithType;
        if (['trigger', 'action', 'filter'].includes(firstStep.type)) {
          return 'zapier';
        }
      }
    }

    return null;
  } catch {
    // If any error occurs during detection, return null
    return null;
  }
}

/**
 * Validates if the file size is within acceptable limits
 * @param file The file to check
 * @param maxSize Maximum allowed size in bytes
 * @throws ImportError if file is too large
 */
export function validateFileSize(file: File, maxSize: number = 10 * 1024 * 1024): void {
  if (file.size > maxSize) {
    throw new ImportError(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      'FILE_TOO_LARGE',
      { fileSize: file.size, maxSize }
    );
  }
}

/**
 * Safely parses JSON with error handling
 * @param text The JSON text to parse
 * @returns Parsed JSON data
 * @throws ImportError if JSON is invalid
 */
export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ImportError(
      'Invalid JSON format. Please ensure the file is a valid JSON export from your automation platform.',
      'INVALID_FORMAT',
      { parseError: error }
    );
  }
} 