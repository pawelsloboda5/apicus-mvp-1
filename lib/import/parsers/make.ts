import { nanoid } from 'nanoid';
import { Node, Edge } from '@xyflow/react';
import { 
  ImportedWorkflow, 
  MakeBlueprintSchema, 
  NODE_TYPE_MAP,
  ImportError,
  MAX_NODES
} from '../types';
import { autoLayout } from '../layout';
import { z } from 'zod';

type MakeModule = z.infer<typeof MakeBlueprintSchema>['flow'][0];

/**
 * Parses a Make.com blueprint and converts it to React Flow format
 * @param data The raw Make.com export data
 * @returns ImportedWorkflow with nodes and edges
 */
export function parseMakeBlueprint(data: unknown): ImportedWorkflow {
  try {
    // Handle both root-level and wrapped blueprint formats
    let blueprintData: unknown = data;
    if (typeof data === 'object' && data !== null && 'blueprint' in data) {
      blueprintData = (data as { blueprint: unknown }).blueprint;
    }

    // Validate the schema
    const parseResult = MakeBlueprintSchema.safeParse(blueprintData);
    if (!parseResult.success) {
      throw new ImportError(
        'Invalid Make.com blueprint format',
        'INVALID_FORMAT',
        { zodError: parseResult.error }
      );
    }

    const blueprint = parseResult.data;
    
    // Check node limit
    if (blueprint.flow.length > MAX_NODES) {
      throw new ImportError(
        `Workflow contains ${blueprint.flow.length} nodes, which exceeds the maximum of ${MAX_NODES}`,
        'PARSE_ERROR'
      );
    }

    // Process nodes
    const nodes: Node[] = [];
    const nodeIdMap = new Map<number, string>(); // Make ID -> React Flow ID
    
    blueprint.flow.forEach((module) => {
      const flowId = `node-${nanoid(6)}`;
      nodeIdMap.set(module.id, flowId);
      
      // Determine node type
      const nodeType = getNodeType(module.module);
      
      // Extract position if available
      const position = module.metadata?.designer
        ? { x: module.metadata.designer.x, y: module.metadata.designer.y }
        : { x: 0, y: 0 }; // Will be auto-layouted if all are at 0,0
      
      // Create node data
      const nodeData: Record<string, unknown> = {
        label: getModuleLabel(module),
        appName: extractAppName(module.module),
        action: extractActionName(module.module),
        platformMeta: {
          platform: 'make',
          moduleId: module.id,
          moduleName: module.module,
          parameters: module.parameters,
          mapper: module.mapper,
          version: module.version
        }
      };

      nodes.push({
        id: flowId,
        type: nodeType,
        position,
        data: nodeData
      });

      // Process nested routes (for routers/filters)
      if (module.routes && Array.isArray(module.routes)) {
        module.routes.forEach((route, routeIndex) => {
          if (route.flow && Array.isArray(route.flow)) {
            route.flow.forEach((nestedModule) => {
              const nestedFlowId = `node-${nanoid(6)}`;
              nodeIdMap.set(nestedModule.id, nestedFlowId);
              
              const nestedNodeType = getNodeType(nestedModule.module);
              const nestedPosition = nestedModule.metadata?.designer
                ? { x: nestedModule.metadata.designer.x, y: nestedModule.metadata.designer.y }
                : { x: position.x + 200 * (routeIndex + 1), y: position.y + 100 };

              nodes.push({
                id: nestedFlowId,
                type: nestedNodeType,
                position: nestedPosition,
                data: {
                  label: getModuleLabel(nestedModule),
                  appName: extractAppName(nestedModule.module),
                  action: extractActionName(nestedModule.module),
                  platformMeta: {
                    platform: 'make',
                    moduleId: nestedModule.id,
                    moduleName: nestedModule.module,
                    parameters: nestedModule.parameters,
                    mapper: nestedModule.mapper,
                    version: nestedModule.version,
                    routeIndex
                  }
                }
              });
            });
          }
        });
      }
    });

    // Process edges - Make uses implicit connections based on order
    const edges: Edge[] = [];
    
    // Connect sequential modules
    for (let i = 0; i < blueprint.flow.length - 1; i++) {
      const sourceId = nodeIdMap.get(blueprint.flow[i].id);
      const targetId = nodeIdMap.get(blueprint.flow[i + 1].id);
      
      if (sourceId && targetId) {
        edges.push({
          id: `edge-${nanoid(6)}`,
          source: sourceId,
          target: targetId,
          type: 'custom'
        });
      }
    }

    // Connect router/filter routes
    blueprint.flow.forEach((module) => {
      if (module.routes && Array.isArray(module.routes)) {
        const routerNodeId = nodeIdMap.get(module.id);
        
        module.routes.forEach((route, routeIndex) => {
          if (route.flow && route.flow.length > 0 && routerNodeId) {
            const firstRouteNodeId = nodeIdMap.get(route.flow[0].id);
            if (firstRouteNodeId) {
              edges.push({
                id: `edge-${nanoid(6)}`,
                source: routerNodeId,
                target: firstRouteNodeId,
                type: 'custom',
                label: `Route ${routeIndex + 1}`
              });
            }

            // Connect nodes within the route
            for (let i = 0; i < route.flow.length - 1; i++) {
              const sourceId = nodeIdMap.get(route.flow[i].id);
              const targetId = nodeIdMap.get(route.flow[i + 1].id);
              
              if (sourceId && targetId) {
                edges.push({
                  id: `edge-${nanoid(6)}`,
                  source: sourceId,
                  target: targetId,
                  type: 'custom'
                });
              }
            }
          }
        });
      }
    });

    // Auto-layout if all nodes are at origin
    const needsLayout = nodes.every(node => node.position.x === 0 && node.position.y === 0);
    const finalNodes = needsLayout ? autoLayout(nodes, edges) : nodes;

    return {
      nodes: finalNodes,
      edges,
      metadata: {
        platform: 'make',
        originalName: blueprint.name || 'Imported Make Scenario',
        importDate: Date.now(),
        originalData: data,
        nodeCount: nodes.length,
        estimatedMinutes: estimateWorkflowMinutes(nodes)
      }
    };
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    throw new ImportError(
      'Failed to parse Make.com blueprint',
      'PARSE_ERROR',
      { originalError: error }
    );
  }
}

/**
 * Determines the node type based on Make module name
 */
function getNodeType(moduleName: string): 'trigger' | 'action' | 'decision' {
  const nodeTypeMap = NODE_TYPE_MAP.make;
  
  // Check exact matches first
  if (moduleName in nodeTypeMap) {
    return nodeTypeMap[moduleName as keyof typeof nodeTypeMap] as 'trigger' | 'action' | 'decision';
  }
  
  // Check for partial matches
  const lowerModuleName = moduleName.toLowerCase();
  if (lowerModuleName.includes('webhook') || lowerModuleName.includes('watch')) {
    return 'trigger';
  }
  if (lowerModuleName.includes('router') || lowerModuleName.includes('filter') || lowerModuleName.includes('switch')) {
    return 'decision';
  }
  
  // Default to action
  return 'action';
}

/**
 * Extracts a user-friendly label from the module name
 */
function getModuleLabel(module: MakeModule): string {
  const parts = module.module.split(':');
  if (parts.length > 1) {
    return parts[1].replace(/([A-Z])/g, ' $1').trim();
  }
  return module.module;
}

/**
 * Extracts the app name from the module identifier
 */
function extractAppName(moduleName: string): string {
  const parts = moduleName.split(':');
  if (parts.length > 0) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  return 'Unknown';
}

/**
 * Extracts the action name from the module identifier
 */
function extractActionName(moduleName: string): string {
  const parts = moduleName.split(':');
  if (parts.length > 1) {
    return parts[1];
  }
  return moduleName;
}

/**
 * Estimates workflow execution time based on node count and types
 */
function estimateWorkflowMinutes(nodes: Node[]): number {
  let minutes = 0;
  
  nodes.forEach(node => {
    switch (node.type) {
      case 'trigger':
        minutes += 0.5;
        break;
      case 'decision':
        minutes += 1;
        break;
      case 'action':
        minutes += 2;
        break;
      default:
        minutes += 1;
    }
  });
  
  return Math.round(minutes * 10) / 10;
} 