# Make.com Workflow Import Implementation Plan

## Executive Summary

This document outlines the implementation plan for importing Make.com (formerly Integromat) automation workflows into the Apicus platform. Building on the existing import infrastructure (`lib/import/*`), we'll create a seamless experience for users to migrate their Make.com scenarios while leveraging our ROI calculation capabilities.

## Current State Analysis

### ✅ What's Already Built
1. **Import Infrastructure** (`lib/import/`)
   - Platform detection logic (`detect.ts`)
   - Make.com parser (`parsers/make.ts`)
   - Type definitions and schemas
   - Auto-layout capabilities with Dagre

2. **FlowCanvas Component**
   - React Flow integration
   - Node types: trigger, action, decision, emailPreview, group
   - Edge connection system
   - Real-time ROI calculations

3. **Database Schema** (Dexie/IndexedDB)
   - Scenario storage with import metadata
   - Node and edge persistence
   - Platform-specific data preservation

### 🚧 What Needs Implementation
1. ✅ **API Route** for workflow import - DONE!
2. **UI Components** for file upload/import
3. **Integration** between parser and FlowCanvas
4. ✅ **Enhanced node mapping** for Make.com specific modules - DONE!
5. ✅ **Testing** with real Make.com exports - DONE!

## Technical Architecture

### Data Flow
```
Make.com JSON → API Route → Parser → Transform → FlowCanvas → Dexie DB
```

### API Route Design

```typescript
// app/api/workflows/import/route.ts
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate file
    validateFileSize(file);
    
    // Parse JSON
    const text = await file.text();
    const data = safeJsonParse(text);
    
    // Detect platform
    const platform = detectPlatform(data);
    if (platform !== 'make') {
      throw new ImportError('Not a Make.com workflow', 'INVALID_FORMAT');
    }
    
    // Parse workflow
    const workflow = parseMakeBlueprint(data);
    
    // Add template pricing data if needed
    const enrichedWorkflow = await enrichWithPricingData(workflow);
    
    return NextResponse.json({
      success: true,
      workflow: enrichedWorkflow,
      stats: {
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
        estimatedMinutes: workflow.metadata.estimatedMinutes
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
```

## Implementation Steps

### Phase 1: API Route & Backend (Day 1-2)

#### 1.1 Create Import API Route
```typescript
// app/api/workflows/import/route.ts
- File upload handling
- Platform validation
- Error handling with proper status codes
- Response formatting
```

#### 1.2 Enhance Make.com Parser
```typescript
// lib/import/parsers/make.ts enhancements
- Add support for more module types
- Improve label extraction
- Handle nested routes better
- Add minute contribution estimates
```

#### 1.3 Pricing Data Integration
```typescript
// lib/import/enrichment.ts
async function enrichWithPricingData(workflow: ImportedWorkflow) {
  // Map Make.com apps to our pricing database
  const appMapping = {
    'google-sheets': 'google_sheets',
    'gmail': 'gmail',
    'slack': 'slack',
    // ... more mappings
  };
  
  // Fetch pricing data for detected apps
  const pricingData = await fetchAppPricing(workflow.nodes);
  
  return {
    ...workflow,
    pricingData
  };
}
```

### Phase 2: UI Components (Day 2-3)

#### 2.1 Import Dialog Component
```tsx
// components/workflow/ImportDialog.tsx
export function ImportDialog({ 
  isOpen, 
  onClose, 
  onImportSuccess 
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFile(file);
    setError(null);
    
    // Preview the workflow
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/workflows/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPreview(result.workflow);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to parse workflow file');
    }
  };
  
  const handleImport = async () => {
    if (!preview) return;
    
    setIsImporting(true);
    
    try {
      // Save to Dexie
      const scenarioId = await saveImportedWorkflow(preview);
      
      // Navigate to build page
      onImportSuccess(scenarioId);
    } catch (err) {
      setError('Failed to import workflow');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Make.com Workflow</DialogTitle>
          <DialogDescription>
            Upload your Make.com scenario export to convert it to Apicus format
          </DialogDescription>
        </DialogHeader>
        
        {!preview ? (
          <div className="space-y-4">
            <FileUploadZone 
              onFileSelect={handleFileSelect}
              accept=".json"
              maxSize={10 * 1024 * 1024}
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>How to export from Make.com:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your scenario in Make.com</li>
                <li>Click the three dots menu</li>
                <li>Select "Export Blueprint"</li>
                <li>Save the JSON file</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <WorkflowPreview workflow={preview} />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {preview.metadata.nodeCount} nodes, {preview.metadata.estimatedMinutes} estimated minutes
              </div>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Choose Different File
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? 'Importing...' : 'Import Workflow'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

#### 2.2 Workflow Preview Component
```tsx
// components/workflow/WorkflowPreview.tsx
export function WorkflowPreview({ workflow }: { workflow: ImportedWorkflow }) {
  return (
    <div className="h-[400px] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={workflow.nodes}
        edges={workflow.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag={false}
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

### Phase 3: FlowCanvas Integration (Day 3-4)

#### 3.1 Node Type Enhancement
```typescript
// lib/flow/node-factory.ts
export function createNodeFromImport(
  importedNode: Node,
  platform: 'make' | 'n8n' | 'zapier'
): Node {
  const baseNode = {
    ...importedNode,
    data: {
      ...importedNode.data,
      minuteContribution: estimateNodeMinutes(importedNode, platform),
      isImported: true,
      originalPlatform: platform
    }
  };
  
  // Platform-specific enhancements
  if (platform === 'make' && importedNode.data.platformMeta) {
    const meta = importedNode.data.platformMeta;
    
    // Extract useful Make.com specific data
    if (meta.mapper) {
      baseNode.data.fieldMappings = extractFieldMappings(meta.mapper);
    }
    
    if (meta.parameters) {
      baseNode.data.configuration = meta.parameters;
    }
  }
  
  return baseNode;
}
```

#### 3.2 Import to Scenario Conversion
```typescript
// lib/import/scenario-converter.ts
export async function createScenarioFromImport(
  workflow: ImportedWorkflow,
  name?: string
): Promise<number> {
  const scenario: Partial<Scenario> = {
    name: name || workflow.metadata.originalName,
    platform: 'make', // Default, user can change
    createdAt: Date.now(),
    updatedAt: Date.now(),
    
    // Canvas state
    nodesSnapshot: workflow.nodes,
    edgesSnapshot: workflow.edges,
    viewport: { x: 0, y: 0, zoom: 1 },
    
    // Import metadata
    originalTemplateId: null,
    searchQuery: `Imported from ${workflow.metadata.platform}`,
    
    // ROI defaults (user can configure)
    runsPerMonth: 100,
    minutesPerRun: workflow.metadata.estimatedMinutes || 10,
    hourlyRate: 50,
    taskMultiplier: 1
  };
  
  // Save to Dexie
  return await db.scenarios.add(scenario);
}
```

### Phase 4: Landing Page Integration (Day 4)

#### 4.1 Hero Section Update
```tsx
// app/page.tsx additions
<div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
  <Button size="lg" onClick={() => router.push('/build')}>
    Start Building
  </Button>
  <Button 
    size="lg" 
    variant="outline"
    onClick={() => setImportDialogOpen(true)}
  >
    <Upload className="mr-2 h-4 w-4" />
    Import from Make.com
  </Button>
</div>
```

#### 4.2 Drag & Drop Support
```tsx
// components/layout/DragDropImport.tsx
export function DragDropImport({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/json') {
      // Trigger import flow
      await handleImport(file);
    }
  };
  
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative",
        isDragging && "ring-2 ring-primary ring-opacity-50"
      )}
    >
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Drop your Make.com export here</p>
            <p className="text-sm text-muted-foreground">JSON files only</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// lib/import/parsers/__tests__/make.test.ts
describe('Make.com Parser', () => {
  it('should parse the example High Ticket Sales workflow', async () => {
    const data = await loadFixture('high-ticket-sales.json');
    const result = parseMakeBlueprint(data);
    
    expect(result.nodes).toHaveLength(24); // Based on the example
    expect(result.nodes[0].data.label).toBe('Fetch Dataset Items');
    expect(result.nodes[0].type).toBe('action');
  });
  
  it('should handle router nodes correctly', () => {
    const routerNode = result.nodes.find(n => 
      n.data.platformMeta?.moduleName === 'builtin:BasicRouter'
    );
    
    expect(routerNode?.type).toBe('decision');
  });
  
  it('should preserve module parameters', () => {
    const httpNode = result.nodes.find(n => 
      n.data.platformMeta?.moduleName === 'http:ActionSendData'
    );
    
    expect(httpNode?.data.platformMeta?.mapper).toHaveProperty('url');
  });
});
```

### Integration Tests
```typescript
// app/api/workflows/import/__tests__/route.test.ts
describe('Import API Route', () => {
  it('should successfully import Make.com workflow', async () => {
    const file = new File(
      [JSON.stringify(makeSampleData)],
      'workflow.json',
      { type: 'application/json' }
    );
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await POST(
      new Request('http://localhost:3000/api/workflows/import', {
        method: 'POST',
        body: formData
      })
    );
    
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.workflow).toBeDefined();
    expect(result.stats.nodeCount).toBeGreaterThan(0);
  });
});
```

### E2E Tests
```typescript
// e2e/import-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('should import Make.com workflow via drag and drop', async ({ page }) => {
  await page.goto('/');
  
  // Drag and drop file
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('body').hover();
  
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('./fixtures/make-workflow.json');
  
  // Wait for preview
  await expect(page.locator('[data-testid="workflow-preview"]')).toBeVisible();
  
  // Click import
  await page.click('button:has-text("Import Workflow")');
  
  // Should redirect to build page
  await expect(page).toHaveURL(/\/build/);
  
  // Should show imported nodes
  await expect(page.locator('.react-flow__node')).toHaveCount(24);
});
```

## Error Handling & Edge Cases

### Common Issues & Solutions

1. **Large Files (>10MB)**
   - Solution: Streaming parser implementation
   - User feedback: Progress bar during parsing

2. **Malformed JSON**
   - Solution: Try multiple parsing strategies
   - User feedback: Specific error messages with recovery tips

3. **Unsupported Modules**
   - Solution: Map to generic "action" type
   - User feedback: Warning message with list of unmapped modules

4. **Complex Routing Logic**
   - Solution: Flatten nested routes into decision trees
   - User feedback: Visual indication of simplified areas

5. **Missing Position Data**
   - Solution: Auto-layout with Dagre
   - User feedback: "Positions were automatically calculated"

## Performance Considerations

### Optimization Strategies

1. **Web Worker for Large Files**
```typescript
// lib/import/worker.ts
self.addEventListener('message', async (event) => {
  const { data, platform } = event.data;
  
  try {
    const result = await parseMakeBlueprint(data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});
```

2. **Chunked Processing**
```typescript
// For workflows with >100 nodes
async function parseInChunks(modules: MakeModule[], chunkSize = 50) {
  const chunks = [];
  
  for (let i = 0; i < modules.length; i += chunkSize) {
    const chunk = modules.slice(i, i + chunkSize);
    const parsed = await parseChunk(chunk);
    chunks.push(parsed);
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return mergeChunks(chunks);
}
```

## Success Metrics

### Technical KPIs
- Import success rate: >95%
- Average import time: <3 seconds
- Support for workflows up to 1000 nodes
- Zero data loss during conversion

### User Experience KPIs
- Time from upload to preview: <2 seconds
- Clear error messages: 100% coverage
- Mobile-friendly import: Yes
- Accessibility: WCAG 2.1 AA compliant

## Launch Checklist

### Pre-Launch
- [ ] Test with 50+ real Make.com exports
- [ ] Performance testing with large workflows
- [ ] Error message review with UX team
- [ ] Documentation for common issues
- [ ] Video tutorial creation

### Launch Day
- [ ] Feature flag enabled
- [ ] Monitoring dashboards ready
- [ ] Support team briefed
- [ ] Social media announcements
- [ ] Blog post published

### Post-Launch
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Iterate on parser accuracy
- [ ] Add support for more module types
- [ ] Plan n8n and Zapier support

## Next Steps

1. **Immediate Actions**
   - Create API route for import
   - Build import dialog component
   - Test with the provided High Ticket Sales example

2. **This Week**
   - Complete UI integration
   - Add comprehensive error handling
   - Create test suite

3. **Next Sprint**
   - Launch to beta users
   - Gather feedback
   - Plan n8n and Zapier parsers

## Conclusion

The Make.com import feature leverages our existing infrastructure while providing a seamless migration path for users. By focusing on a robust parser, clear UI, and comprehensive error handling, we can deliver a feature that significantly reduces the barrier to entry for Make.com users wanting to explore Apicus's superior ROI insights.

## Implementation Progress

### ✅ Completed (Phase 1)

1. **API Route (`/api/workflows/import`)**
   - Full POST endpoint implementation
   - Support for both file upload and JSON body
   - Platform detection and validation
   - Error handling with descriptive messages
   - CORS support for cross-origin requests

2. **Type System & Normalization**
   - Comprehensive Make.com to Apicus type mappings
   - Module type detection (trigger, action, decision)
   - App name extraction and formatting
   - Minute contribution estimation
   - Full preservation of Make.com metadata

3. **Pricing Enrichment**
   - MongoDB integration for pricing data
   - App name to pricing slug mapping
   - Cost estimation calculations
   - Optional enrichment via header flag

4. **Documentation**
   - API route documentation in `/api/workflows/import/README.md`
   - Updated API routes overview
   - Test scripts for validation
   - Type definitions for all interfaces

### 🚧 Still Needed (Phase 2+)

1. **UI Components**
   - Import dialog with drag & drop
   - Workflow preview component
   - Progress indicators
   - Error/warning display

2. **FlowCanvas Integration**
   - Save imported workflow to Dexie
   - Load workflow into canvas
   - Handle email nodes and connections
   - ROI calculation integration

3. **Landing Page Integration**
   - Import button in hero section
   - Drag & drop overlay
   - Success animations

4. **Advanced Features**
   - n8n parser implementation
   - Zapier parser implementation
   - Batch import support
   - Export back to original format 