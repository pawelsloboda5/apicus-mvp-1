/**
 * Maps Make.com workflow JSON to Apicus Template Schema
 * Only includes fields that Apicus needs, drops everything else
 */

interface MakeModule {
  id: number;
  module: string;
  metadata?: {
    designer?: {
      x: number;
      y: number;
    };
  };
  routes?: Array<{
    flow: MakeModule[];
  }>;
}

interface MakeWorkflow {
  name: string;
  flow: MakeModule[];
}

interface ApicusNode {
  reactFlowId: string;
  type: 'trigger' | 'action' | 'decision';
  position: { x: number; y: number };
  data: {
    label: string;
    appName: string;
    action: string;
  };
}

interface ApicusEdge {
  reactFlowId: string;
  source: string;
  target: string;
  type: string;
  data: {
    source: string;
    target: string;
  };
}

interface ApicusTemplate {
  templateId: string;
  title: string;
  platform: string;
  source: string;
  nodes: ApicusNode[];
  edges: ApicusEdge[];
  appIds: string[];
  appNames: string[];
  stepCount: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// App name mappings
const APP_NAME_MAP: Record<string, string> = {
  'apify': 'Apify',
  'http': 'HTTP',
  'regexp': 'Text Parser',
  'anthropic-claude': 'Claude AI',
  'json': 'JSON',
  'builtin': 'Router',
  'anymailfinder': 'Anymail Finder',
  'openai-gpt-3': 'OpenAI',
  'instantly': 'Instantly'
};

export function mapMakeToApicus(makeJson: any): ApicusTemplate {
  const makeWorkflow = makeJson as MakeWorkflow;
  const nodes: ApicusNode[] = [];
  const edges: ApicusEdge[] = [];
  const nodeIdMap = new Map<number, string>();
  const appNamesSet = new Set<string>();
  
  // Process all modules (including nested ones in routes)
  function processModule(module: MakeModule, parentId?: string, routeIndex?: number) {
    const nodeId = `node-${module.id}`;
    nodeIdMap.set(module.id, nodeId);
    
    // Extract app and action from module name
    const [appKey, action] = module.module.split(':');
    const appName = APP_NAME_MAP[appKey] || appKey;
    appNamesSet.add(appName);
    
    // Determine node type
    let nodeType: 'trigger' | 'action' | 'decision' = 'action';
    if (module.module.includes('BasicRouter') || module.module.includes('filter')) {
      nodeType = 'decision';
    } else if (module.id === 1) { // First module is usually trigger
      nodeType = 'trigger';
    }
    
    // Create node
    const node: ApicusNode = {
      reactFlowId: nodeId,
      type: nodeType,
      position: {
        x: module.metadata?.designer?.x || 0,
        y: module.metadata?.designer?.y || 0
      },
      data: {
        label: `${appName}: ${action || 'Action'}`,
        appName: appName,
        action: action || 'Action'
      }
    };
    
    nodes.push(node);
    
    // Process nested routes
    if (module.routes) {
      module.routes.forEach((route, idx) => {
        route.flow.forEach(nestedModule => {
          processModule(nestedModule, nodeId, idx);
        });
      });
    }
  }
  
  // Process all modules
  makeWorkflow.flow.forEach(module => processModule(module));
  
  // Create edges based on sequential flow
  for (let i = 0; i < makeWorkflow.flow.length - 1; i++) {
    const sourceId = nodeIdMap.get(makeWorkflow.flow[i].id);
    const targetId = nodeIdMap.get(makeWorkflow.flow[i + 1].id);
    
    if (sourceId && targetId) {
      edges.push({
        reactFlowId: `edge-${i}`,
        source: sourceId,
        target: targetId,
        type: 'custom',
        data: {
          source: sourceId,
          target: targetId
        }
      });
    }
  }
  
  // Handle router connections
  makeWorkflow.flow.forEach(module => {
    if (module.routes) {
      const routerNodeId = nodeIdMap.get(module.id);
      module.routes.forEach((route, routeIndex) => {
        if (route.flow.length > 0 && routerNodeId) {
          const firstRouteNodeId = nodeIdMap.get(route.flow[0].id);
          if (firstRouteNodeId) {
            edges.push({
              reactFlowId: `edge-route-${module.id}-${routeIndex}`,
              source: routerNodeId,
              target: firstRouteNodeId,
              type: 'custom',
              data: {
                source: routerNodeId,
                target: firstRouteNodeId
              }
            });
          }
          
          // Connect nodes within routes
          for (let i = 0; i < route.flow.length - 1; i++) {
            const sourceId = nodeIdMap.get(route.flow[i].id);
            const targetId = nodeIdMap.get(route.flow[i + 1].id);
            
            if (sourceId && targetId) {
              edges.push({
                reactFlowId: `edge-route-${module.id}-${routeIndex}-${i}`,
                source: sourceId,
                target: targetId,
                type: 'custom',
                data: {
                  source: sourceId,
                  target: targetId
                }
              });
            }
          }
        }
      });
    }
  });
  
  // Create the Apicus template with ONLY required fields
  const apicusTemplate: ApicusTemplate = {
    templateId: `make-import-${Date.now()}`,
    title: makeWorkflow.name || 'Imported Make.com Workflow',
    platform: 'make',
    source: 'make',
    nodes: nodes,
    edges: edges,
    appIds: Array.from(appNamesSet).map(name => name.toLowerCase().replace(/\s+/g, '-')),
    appNames: Array.from(appNamesSet),
    stepCount: nodes.length,
    url: 'https://make.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return apicusTemplate;
} 