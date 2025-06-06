# Workflow Import Technical Specification

## Platform Export Format Analysis

### Make.com (Integromat) Blueprint Structure

#### Complete Schema
```typescript
interface MakeBlueprint {
  blueprint: {
    name: string;
    flow: MakeModule[];
    connections: MakeConnection[];
    metadata?: {
      version: number;
      scenario?: {
        status: string;
        schedule: any;
      };
    };
  };
}

interface MakeModule {
  id: number;
  module: string; // e.g., "webhooks:WebHook", "google-sheets:addRow"
  version: number;
  parameters: Record<string, any>;
  mapper: Record<string, any>; // Field mappings
  metadata: {
    designer: {
      x: number;
      y: number;
      name?: string;
    };
    restore?: {
      expect?: any;
    };
    parameters?: boolean;
  };
  flags?: Record<string, boolean>;
}

interface MakeConnection {
  id: number;
  name: string;
  source: number; // Module ID
  target: number; // Module ID
  enabled?: boolean;
}
```

#### Key Parsing Considerations
1. **Module Types**: 
   - Routers = decision nodes
   - Filters = conditions (can be merged with previous node)
   - Aggregators = special action nodes
   - Error handlers = edge metadata

2. **Position Data**: Always in `metadata.designer.x/y`
3. **Connection Logic**: Simple source→target with IDs

### n8n Workflow Structure

#### Complete Schema
```typescript
interface N8nWorkflow {
  id?: string;
  name: string;
  active?: boolean;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: {
    executionOrder?: string;
    errorWorkflow?: string;
  };
  staticData?: any;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface N8nNode {
  id: string; // UUID format
  name: string; // Display name
  type: string; // e.g., "n8n-nodes-base.webhook"
  position: [number, number]; // [x, y]
  typeVersion: number;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
  executeOnce?: boolean;
}

interface N8nConnections {
  [nodeName: string]: {
    main: Array<Array<{
      node: string; // Target node name
      type: string; // Usually "main"
      index: number; // Output index
    }>>;
  };
}
```

#### Key Parsing Considerations
1. **Node Types**:
   - Anything with "Trigger" suffix = trigger node
   - "IF", "Switch" = decision nodes
   - Everything else = action nodes

2. **Connection Complexity**: 
   - Supports multiple outputs (main[0], main[1], etc.)
   - Uses node names, not IDs for connections
   - Need to handle index-based routing

3. **Position Data**: Direct [x, y] array

### Zapier Export Structure

#### Complete Schema
```typescript
interface ZapierExport {
  zaps: ZapierZap[];
  app_connections?: any[];
  export_type: string;
  schema_version: string;
  version: string;
}

interface ZapierZap {
  id: string | number;
  name: string;
  state: "on" | "off";
  steps: ZapierStep[];
  trigger_frequency?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ZapierStep {
  id: string;
  position: number; // 0-based index
  type: "trigger" | "action" | "filter" | "path";
  app: string; // e.g., "webhook", "gmail"
  action: string; // e.g., "catch_hook", "send_email"
  name?: string; // Custom step name
  input?: Record<string, any>; // Step configuration
  sample?: Record<string, any>; // Sample data
}
```

#### Key Parsing Considerations
1. **Linear Structure**: Steps are sequential, no branching info
2. **Position Calculation**: `position * 200` pixels horizontally
3. **Path Steps**: Create branch nodes with multiple outputs
4. **Filter Steps**: Can be inline conditions or separate nodes

## Transformation Logic

### Universal Node ID Generation
```typescript
function generateNodeId(platform: string, originalId: string | number): string {
  return `${platform}_${originalId}`;
}
```

### Position Normalization
```typescript
interface NormalizedPosition {
  x: number;
  y: number;
}

function normalizePosition(
  platform: string,
  nodeData: any,
  index: number
): NormalizedPosition {
  switch (platform) {
    case 'make':
      return {
        x: nodeData.metadata?.designer?.x || index * 200,
        y: nodeData.metadata?.designer?.y || 100
      };
    
    case 'n8n':
      return {
        x: nodeData.position[0],
        y: nodeData.position[1]
      };
    
    case 'zapier':
      return {
        x: index * 200,
        y: 100
      };
    
    default:
      return { x: index * 200, y: 100 };
  }
}
```

### App Name Extraction
```typescript
function extractAppName(platform: string, nodeData: any): string {
  switch (platform) {
    case 'make':
      // "google-sheets:addRow" → "Google Sheets"
      const [app] = nodeData.module.split(':');
      return app.split('-').map(capitalize).join(' ');
    
    case 'n8n':
      // "n8n-nodes-base.googleSheets" → "Google Sheets"
      const type = nodeData.type.replace('n8n-nodes-base.', '');
      return type.replace(/([A-Z])/g, ' $1').trim();
    
    case 'zapier':
      // Direct app name, just capitalize
      return nodeData.app.split('_').map(capitalize).join(' ');
  }
}
```

### Edge Cases & Error Handling

#### Common Issues
1. **Circular Dependencies**: Detect and break cycles
2. **Missing Connections**: Create placeholder edges
3. **Invalid Positions**: Auto-layout with Dagre
4. **Unknown Node Types**: Default to "action"
5. **Large Workflows**: Chunk processing for >100 nodes

#### Validation Rules
```typescript
const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxNodes: 1000,
  maxEdges: 5000,
  maxImportTime: 30000, // 30 seconds
};

function validateImport(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Size checks
  const size = JSON.stringify(data).length;
  if (size > LIMITS.maxFileSize) {
    errors.push(`File too large: ${(size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Structure checks
  if (!data || typeof data !== 'object') {
    errors.push('Invalid JSON structure');
  }
  
  // Platform-specific validation
  const platform = detectPlatform(data);
  if (!platform) {
    errors.push('Unrecognized workflow format');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

## Auto-Layout Algorithm

For platforms without position data (Zapier) or when positions are corrupted:

```typescript
import dagre from 'dagre';

function autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const g = new dagre.graphlib.Graph();
  
  g.setGraph({
    rankdir: 'LR',
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50
  });
  
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes
  nodes.forEach(node => {
    g.setNode(node.reactFlowId, {
      width: 150,
      height: 60
    });
  });
  
  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  // Calculate layout
  dagre.layout(g);
  
  // Update positions
  return nodes.map(node => {
    const { x, y } = g.node(node.reactFlowId);
    return {
      ...node,
      position: { x: x - 75, y: y - 30 } // Center based on node size
    };
  });
}
```

## Performance Optimizations

### Streaming Parser for Large Files
```typescript
async function* parseJSONStream(stream: ReadableStream): AsyncGenerator<any> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Try to parse complete JSON objects from buffer
      const objects = extractCompleteObjects(buffer);
      for (const obj of objects) {
        yield obj;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### Web Worker for Heavy Processing
```typescript
// import-worker.ts
self.addEventListener('message', async (event) => {
  const { data, platform } = event.data;
  
  try {
    const result = await parseWorkflow(data, platform);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

// Main thread
const worker = new Worker('/import-worker.js');
worker.postMessage({ data: jsonData, platform });
worker.onmessage = (event) => {
  if (event.data.success) {
    // Handle successful import
  }
};
```

## Testing Strategy

### Test Data Structure
```
test-data/
├── make/
│   ├── simple-webhook-to-sheets.json
│   ├── complex-router-workflow.json
│   └── error-handler-example.json
├── n8n/
│   ├── basic-http-workflow.json
│   ├── multi-branch-if-node.json
│   └── loop-with-pagination.json
└── zapier/
    ├── linear-email-automation.json
    ├── paths-branching-example.json
    └── multi-step-formatter.json
```

### Unit Test Example
```typescript
describe('Workflow Import Parsers', () => {
  describe('Make.com Parser', () => {
    it('should parse simple webhook to sheets workflow', async () => {
      const data = await loadTestData('make/simple-webhook-to-sheets.json');
      const result = parseMakeBlueprint(data, 1);
      
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].type).toBe('trigger');
      expect(result.nodes[1].type).toBe('action');
      expect(result.edges).toHaveLength(1);
    });
    
    it('should handle router nodes as decisions', async () => {
      const data = await loadTestData('make/complex-router-workflow.json');
      const result = parseMakeBlueprint(data, 1);
      
      const routerNode = result.nodes.find(n => n.type === 'decision');
      expect(routerNode).toBeDefined();
      expect(routerNode?.data.label).toContain('Router');
    });
  });
});
```

This technical specification provides the detailed implementation guidance needed for building robust parsers for each platform's export format. 