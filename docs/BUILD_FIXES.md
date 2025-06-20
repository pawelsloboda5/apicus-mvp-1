# Build Fixes for Apicus MVP

This document contains fixes for all TypeScript and ESLint errors found during the build process.

## Summary of Issues

- **@typescript-eslint/no-explicit-any**: 47 instances
- **@typescript-eslint/no-unused-vars**: 35 instances  
- **react/no-unescaped-entities**: 4 instances
- **react-hooks/exhaustive-deps**: 4 instances
- **@typescript-eslint/no-require-imports**: 1 instance

## File-by-File Fixes

### 1. `/app/api/openai/generate-email-section/route.ts`

**Error**: Line 58 - Unexpected any
```typescript
// Fix: Replace 'any' with proper type
catch (error: unknown) {
  console.error("/api/openai/generate-email-section error", error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : "Unexpected error" 
  }, { status: 500 });
}
```

### 2. `/app/api/openai/generate-full-email/route.ts`

**Errors**: Lines 28, 34, 86 - Unexpected any
```typescript
// Line 28: Fix roiData type
interface EmailGenerationPayload {
  roiData: Record<string, unknown>; // Replace 'any'
  scenarioName?: string;
  platform?: string;
}

// Line 34: Fix generateSection function parameter
async function generateSection(prompt: string, roiData: Record<string, unknown>, textToRefine?: string) {

// Line 86: Fix error handling
} catch (error: unknown) {
  console.error("/api/openai/generate-full-email error", error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : "Unexpected error during full email generation" 
  }, { status: 500 });
}
```

### 3. `/app/api/openai/route.ts`

**Error**: Line 33 - Unexpected any
```typescript
} catch (error: unknown) {
  console.error("/api/openai error", error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : "Unexpected error" 
  }, { status: 500 });
}
```

### 4. `/app/api/templates/search/route.ts`

**Errors**: Lines 36, 37, 69, 72 - Unexpected any
```typescript
// Lines 36-37: Fix embedding response type
interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

try {
  const resp = await openai.embeddings.create({ input: q, dimensions: 1536 } as any);
  embedding = (resp as EmbeddingResponse).data[0].embedding;
} catch (err) {

// Line 69: Fix results type
let results: Array<{
  templateId: string;
  title: string;
  nodes: unknown;
  edges: unknown;
  source: string;
  platform: string;
  description: string;
}>;

// Line 72: Fix error handling
} catch (err: unknown) {
  if (err instanceof Error && err.message?.includes("cosmosSearch")) {
```

### 5. `/app/build/page.tsx`

**Multiple unused imports and variables - Remove these:**
```typescript
// Remove unused imports:
// ReactFlow, Background, Controls, UISheet, UISheetContent, UISheetHeader, 
// UISheetTitle, UISheetDescription, Input, cn, Edit2Icon, MailOpen, Label,
// Tooltip, TooltipContent, TooltipTrigger, Slider, Separator, Select,
// SelectContent, SelectItem, SelectTrigger, SelectValue, Switch

// Remove unused functions:
// calculateGroupROI, formatROIRatio

// Remove unused variables:
// NodeType, PLATFORMS, initialViewport, setInitialViewport, handleScenarioNameChange

// Fix any types - replace with proper interfaces:
interface TemplateData {
  templateId: string;
  title: string;
  nodes: unknown[];
  edges: unknown[];
  source: string;
  platform: string;
  description: string;
}

// Fix error handling:
} catch (err: unknown) {
  // Handle error appropriately
}

// Fix React Hook dependencies:
// Add missing dependencies or remove unused ones from useCallback arrays
```

### 6. `/app/page.tsx`

**Errors**: Unused imports and variables
```typescript
// Remove unused imports:
// Zap, Clock, DollarSign

// Fix error handling:
} catch (err: unknown) {
  router.push('/build');
}
```

### 7. `/components/flow/AlternativeTemplatesSheet.tsx`

**Errors**: Unused imports and variables
```typescript
// Remove unused imports:
// SheetClose, SheetDescription, XIcon

// Fix unused parameter:
const handleTemplateSelect = (_e: React.MouseEvent) => {
  // Implementation
};
```

### 8. `/components/flow/EmailNodePropertiesPanel.tsx`

**Errors**: Unused imports
```typescript
// Remove unused imports:
// useCallback, ChevronUp
```

### 9. `/components/flow/EmailPreviewNode.tsx`

**Error**: Line 6 - Unexpected any
```typescript
// Replace any with proper type
interface EmailPreviewNodeProps {
  data: {
    label: string;
    [key: string]: unknown;
  };
}
```

### 10. `/components/flow/EmailTemplate.tsx`

**Errors**: Unused variables
```typescript
// Remove unused props or mark as used:
// onEditHook, onEditCTA - either remove or implement
```

### 11. `/components/flow/FlowCanvas.tsx`

**Errors**: Unused imports and missing dependencies
```typescript
// Remove unused imports:
// addEdge, Edge, Node, ReactFlowInstance, useReactFlow, useOnSelectionChange

// Fix useCallback dependency:
const handleConnect = useCallback((params: Connection) => {
  // Implementation
}, [isValidConnection]); // Add missing dependency
```

### 12. `/components/flow/GroupPropertiesPanel.tsx`

**Error**: Unused import
```typescript
// Remove unused import:
// Calculator
```

### 13. `/components/flow/NodeGroup.tsx`

**Errors**: Unused variables
```typescript
// Remove or use these variables:
// minutesPerRun, roiRatio
```

### 14. `/components/flow/NodePropertiesPanel.tsx`

**Errors**: Unescaped entities and any type
```typescript
// Fix unescaped apostrophe on line 44:
<span>Don&apos;t see your app?</span>

// Fix any type on line 294:
interface AppData {
  id: string;
  name: string;
  [key: string]: unknown;
}
```

### 15. `/components/flow/PixelNode.tsx`

**Errors**: Unused imports
```typescript
// Remove unused imports:
// JSX, NodeData
```

### 16. `/components/flow/StatsBar.tsx`

**Errors**: Multiple unused imports and variables
```typescript
// Remove all unused imports and variables:
// Calculator, Sparkles, Plus, Minus, Edit3, Scenario, Node
// calculateROIRatio, calculateRiskValue, calculateRevenueValue, 
// calculateTotalValue, calculateNetROI, calculatePaybackPeriod
// StatsBarExtendedProps, currentScenario, tier, isLoaded, emailModalOpen
```

### 17. `/components/flow/Toolbox.tsx`

**Errors**: Unused imports and unescaped entities
```typescript
// Remove unused imports:
// ListChecks, Save

// Fix unescaped quotes on lines 196 and 213:
<span>Use &quot;smart&quot; defaults</span>
<span>Don&apos;t worry</span>
```

### 18. `/components/roi/ROISettingsPanel.tsx`

**Errors**: Unused imports
```typescript
// Remove unused imports:
// Separator, CardDescription
```

### 19. `/lib/db.ts`

**Errors**: Multiple any types and require import
```typescript
// Replace any types with proper interfaces:
interface DatabaseConfig {
  [key: string]: unknown;
}

// Replace require with import:
import { MongoClient } from 'mongodb';

// Remove unused eslint-disable directive
```

### 20. `/lib/flow-utils.ts`

**Error**: Unused variable
```typescript
// Remove unused variable:
// nodeHeight
```

### 21. `/lib/mongo.ts`

**Error**: Line 4 - Unexpected any
```typescript
// Fix global type:
interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
```

### 22. `/lib/roi-utils.ts`

**Errors**: Multiple any types and unused variables
```typescript
// Replace any types with proper interfaces:
interface ROIData {
  [key: string]: unknown;
}

interface NodeData {
  [key: string]: unknown;
}

// Remove unused variable:
// typeCounts
```

### 23. `/lib/types/index.ts`

**Errors**: Multiple any types
```typescript
// Replace all any types with proper interfaces:
interface NodeData {
  [key: string]: unknown;
}

interface EdgeData {
  [key: string]: unknown;
}

interface TemplateData {
  [key: string]: unknown;
}
```

### 24. `/lib/types.ts`

**Errors**: Unused import and any types
```typescript
// Remove unused import:
// Connection

// Replace any types with proper interfaces:
interface FlowData {
  [key: string]: unknown;
}

interface NodeProps {
  [key: string]: unknown;
}
```

## Implementation Strategy

1. **Phase 1**: Fix all `@typescript-eslint/no-explicit-any` errors by creating proper type interfaces
2. **Phase 2**: Remove all unused imports and variables
3. **Phase 3**: Fix React-specific issues (unescaped entities, hook dependencies)
4. **Phase 4**: Address require imports and other miscellaneous issues

## Notes

- Consider creating a shared types file for common interfaces
- Some unused variables might be intentionally kept for future features - review before removing
- The `any` types should be replaced with proper TypeScript interfaces for better type safety
- React Hook dependency warnings should be carefully reviewed to avoid breaking functionality

## Estimated Impact

- **Build time**: Should improve significantly
- **Type safety**: Much improved with proper interfaces
- **Code maintainability**: Better with removed unused code
- **Bundle size**: Slightly smaller with removed unused imports 