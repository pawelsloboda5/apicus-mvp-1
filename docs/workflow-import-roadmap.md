# Workflow JSON Import Feature Roadmap

## Executive Summary

This document outlines the implementation roadmap for enabling Apicus users to import their existing automation workflows from Make.com, n8n, and Zapier. The feature will provide a seamless transition path for users migrating from other platforms while showcasing Apicus's superior ROI calculation capabilities.

## Feature Overview

### Value Proposition
- **Instant Migration**: Users can import existing workflows without manual recreation
- **Platform Agnostic**: Support for all three major automation platforms
- **ROI Discovery**: Immediately see ROI calculations for imported workflows
- **Zero Friction**: Drag-and-drop interface with automatic platform detection

### User Journey
1. User exports workflow JSON from their current platform
2. Drags file onto Apicus landing page or import modal
3. Platform is auto-detected and workflow is parsed
4. Preview shows the imported workflow structure
5. One-click import creates a new scenario with full ROI analysis

## Technical Architecture

### Platform Export Formats

#### Make.com (Integromat)
```json
{
  "blueprint": {
    "name": "My Scenario",
    "flow": [
      {
        "id": 1,
        "module": "webhooks:WebHook",
        "version": 1,
        "parameters": {},
        "mapper": {},
        "metadata": {
          "designer": {
            "x": 0,
            "y": 0
          }
        }
      }
    ],
    "connections": [
      {
        "id": 1,
        "source": 1,
        "target": 2
      }
    ]
  }
}
```

#### n8n
```json
{
  "name": "My Workflow",
  "nodes": [
    {
      "id": "uuid",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "webhook-path"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

#### Zapier
```json
{
  "zaps": [
    {
      "id": "12345678",
      "name": "My Zap",
      "steps": [
        {
          "id": "step_1",
          "type": "trigger",
          "app": "webhook",
          "action": "catch_hook",
          "position": 0
        },
        {
          "id": "step_2",
          "type": "action",
          "app": "gmail",
          "action": "send_email",
          "position": 1
        }
      ]
    }
  ]
}
```

### Data Transformation Pipeline

```typescript
// Type definitions
interface ImportedWorkflow {
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata: {
    platform: 'make' | 'n8n' | 'zapier';
    originalName: string;
    importDate: number;
    originalData?: unknown;
  };
}

// Transformation flow
JSON File → Platform Detection → Schema Validation → 
Node Mapping → Position Calculation → Dexie Storage
```

## Implementation Phases

### Phase 1: Foundation (Week 1)

#### 1.1 Research & Documentation
- [ ] Create sample export files from each platform
- [ ] Document all possible node types and their mappings
- [ ] Identify edge cases and platform limitations
- [ ] Create comprehensive test suite data

#### 1.2 Core Parser Development
```typescript
// lib/import/index.ts
export { detectPlatform } from './detect';
export { parseMakeBlueprint } from './parsers/make';
export { parseN8nWorkflow } from './parsers/n8n';
export { parseZapierExport } from './parsers/zapier';
export { ImportedWorkflow } from './types';
```

#### 1.3 Type Definitions
```typescript
// lib/import/types.ts
import { z } from 'zod';

export const MakeBlueprintSchema = z.object({
  blueprint: z.object({
    name: z.string(),
    flow: z.array(MakeModuleSchema),
    connections: z.array(MakeConnectionSchema)
  })
});

// Similar schemas for n8n and Zapier
```

### Phase 2: Parser Implementation (Week 1-2)

#### 2.1 Platform Detection
```typescript
export function detectPlatform(data: unknown): Platform | null {
  try {
    // Try parsing with each schema
    if (MakeBlueprintSchema.safeParse(data).success) return 'make';
    if (N8nWorkflowSchema.safeParse(data).success) return 'n8n';
    if (ZapierExportSchema.safeParse(data).success) return 'zapier';
    return null;
  } catch {
    return null;
  }
}
```

#### 2.2 Node Type Mapping
```typescript
const NODE_TYPE_MAP = {
  make: {
    'webhooks:WebHook': 'trigger',
    'router': 'decision',
    'filter': 'decision',
    // ... all other mappings
  },
  n8n: {
    'webhook': 'trigger',
    'if': 'decision',
    'switch': 'decision',
    // ... all other mappings
  },
  zapier: {
    'trigger': 'trigger',
    'filter': 'decision',
    'paths': 'decision',
    // ... all other mappings
  }
};
```

#### 2.3 Position Algorithms
- Make: Use designer.x/y if available, otherwise auto-layout
- n8n: Direct position mapping
- Zapier: Sequential layout (position * spacing)

### Phase 3: UI Implementation (Week 2)

#### 3.1 Import Modal Component
```tsx
// components/ImportWorkflowModal.tsx
export function ImportWorkflowModal({ 
  isOpen, 
  onClose, 
  onImport 
}: ImportModalProps) {
  const [preview, setPreview] = useState<ImportedWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileDrop = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const platform = detectPlatform(data);
      
      if (!platform) {
        throw new Error('Unsupported file format');
      }
      
      const imported = await parseWorkflow(data, platform);
      setPreview(imported);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Render drag-drop zone, preview canvas, and import button
}
```

#### 3.2 Landing Page Integration
- Update hero section with import option
- Add "Import from Make/n8n/Zapier" button
- Create smooth transition to builder with imported data

### Phase 4: Data Integration (Week 2-3)

#### 4.1 Dexie Transaction
```typescript
export async function saveImportedWorkflow(
  workflow: ImportedWorkflow,
  name?: string
): Promise<number> {
  return db.transaction('rw', db.scenarios, db.nodes, db.edges, async () => {
    // Create scenario
    const scenarioId = await db.scenarios.add({
      name: name || workflow.metadata.originalName,
      platform: 'zapier', // Default, user can change
      importedFrom: workflow.metadata.platform,
      importDate: Date.now(),
      // ... other fields
    });
    
    // Bulk insert nodes and edges
    const nodes = workflow.nodes.map(n => ({ ...n, scenarioId }));
    const edges = workflow.edges.map(e => ({ ...e, scenarioId }));
    
    await db.nodes.bulkAdd(nodes);
    await db.edges.bulkAdd(edges);
    
    return scenarioId;
  });
}
```

#### 4.2 Metadata Preservation
- Store original platform data in `platformMeta` field
- Enable future re-export functionality
- Maintain audit trail of imports

### Phase 5: Testing & Polish (Week 3)

#### 5.1 Test Coverage
- Unit tests for each parser function
- Integration tests with real export files
- Edge case handling (malformed JSON, huge files)
- Performance benchmarks

#### 5.2 Error Handling
```typescript
export class ImportError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_FORMAT' | 'UNSUPPORTED_PLATFORM' | 'PARSE_ERROR',
    public details?: unknown
  ) {
    super(message);
  }
}
```

#### 5.3 User Experience Polish
- Progress indicators during parsing
- Helpful error messages with recovery suggestions
- Success animations and statistics
- Keyboard shortcuts for power users

## Launch Strategy

### Soft Launch (Week 4)
1. Enable feature flag for beta users
2. Gather feedback on import accuracy
3. Build library of test cases
4. Create video tutorials

### Full Launch (Week 5)
1. Update landing page messaging
2. Create blog post: "Import Your Workflows in Seconds"
3. Email campaign to existing users
4. Social media showcase

### Post-Launch (Ongoing)
1. Monitor import success rates
2. Add support for additional platforms
3. Build workflow template library from imports
4. Create platform migration guides

## Success Metrics

### Technical Metrics
- Import success rate > 95%
- Processing time < 3 seconds for 99% of workflows
- Zero data loss during import
- Support for workflows up to 1000 nodes

### Business Metrics
- 30% of new users use import feature
- 50% of imported workflows get ROI analysis
- 20% conversion from import to paid features
- Reduced time-to-value from days to minutes

## Risk Mitigation

### Technical Risks
1. **Platform API Changes**: Version detection and graceful degradation
2. **Large File Handling**: Streaming parser for files > 10MB
3. **Browser Compatibility**: Progressive enhancement approach

### Business Risks
1. **Platform Relationships**: Position as complementary, not competitive
2. **Data Privacy**: All processing client-side, no server storage
3. **Feature Adoption**: Strong onboarding and education

## Future Enhancements

### V2 Features
- Two-way sync with original platforms
- Batch import for multiple workflows
- Import history and version control
- AI-powered workflow optimization suggestions

### Platform Expansion
- Power Automate support
- IFTTT import capability
- Custom JSON format support
- API-based direct import

## Conclusion

The workflow import feature represents a significant opportunity to reduce friction for new users and showcase Apicus's unique value proposition. By enabling seamless migration from existing platforms, we can capture users at the moment they're evaluating their automation strategy and immediately demonstrate ROI insights they can't get elsewhere.

This roadmap provides a clear path to implementation while maintaining flexibility for adjustments based on user feedback and technical discoveries during development. 