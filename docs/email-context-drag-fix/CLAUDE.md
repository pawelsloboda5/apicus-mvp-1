# Email Context Node Drag & Drop Fix - Context & Analysis

## Issue Summary
Email context nodes (persona, industry, painpoint, metric, urgency, socialproof, objection, value) can't be dragged from the Toolbox to the canvas. The drag starts but the drop fails.

## Root Cause Analysis

### ✅ Email Context Nodes Are Properly Defined
**Location**: Multiple files define email context nodes:

1. **Node Types** (`lib/types/index.ts:15-16`):
   ```typescript
   export type NodeType = "trigger" | "action" | "decision" | "group" | "emailPreview" | 
     "persona" | "industry" | "painpoint" | "metric" | "urgency" | "socialproof" | "objection" | "value";
   ```

2. **Email Context Items** (`components/flow/Toolbox.tsx:47-110`):
   ```typescript
   const EMAIL_CONTEXT_ITEMS: { 
     type: NodeType; 
     label: string; 
     description: string;
     defaultValue: string;
     category: string;
   }[] = [
     { type: "persona", label: "Target Persona", ... },
     { type: "industry", label: "Industry Context", ... },
     // ... 8 total items
   ];
   ```

3. **Node Factory** (`lib/flow/node-factory.ts:162-185`):
   ```typescript
   export function createEmailContextNode(
     type: 'persona' | 'industry' | 'painpoint' | 'metric' | 'urgency' | 'socialproof' | 'objection' | 'value',
     position: { x: number; y: number },
     contextValue: string = ''
   ): Node
   ```

### ✅ Draggable Components Are Implemented
**Location**: `components/flow/Toolbox.tsx:1223-1314`

The `EmailContextToolboxItem` component properly implements `useDraggable`:
```typescript
const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: `tool-context-${type}`,
  data: { 
    nodeType: type,
    isEmailContext: true,
    contextValue: defaultValue,
    category
  },
});
```

### ❌ Droppable Area Doesn't Accept Email Context Nodes
**Location**: `app/build/components/BuildPageCore.tsx:286-291`

**THE PROBLEM** - The droppable canvas only accepts basic node types:
```typescript
const { setNodeRef: setDroppableRef, isOver } = useDroppable({ 
  id: "canvas",
  data: {
    accepts: ['tool-trigger', 'tool-action', 'tool-decision']  // ❌ Missing email context types!
  }
});
```

### ✅ Drop Handler Supports Email Context Nodes
**Location**: `app/build/components/BuildPageCore.tsx:337-348`

The `handleDragEnd` function already has logic to handle email context nodes:
```typescript
data: isEmailContext ? {
  label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
  isEmailContext: true,
  contextType: nodeType,
  contextValue: contextValue || '',
  category: category || '',
} : {
  // ... regular node data
}
```

## Key Insights

1. **Email context nodes are fully defined** in the type system and node factory
2. **Draggable implementation is correct** with proper data payload
3. **Drop handler already supports email context nodes** with special data structure
4. **The issue is the droppable filter** - it rejects email context nodes before they reach the drop handler

## Files That Need Changes

1. **`app/build/components/BuildPageCore.tsx`** - Update droppable accepts array
2. **Test files** - Verify the fix works

## Implementation Results

### ✅ FIXED: Updated Droppable Accepts Array
**File**: `app/build/components/BuildPageCore.tsx:286-304`

**Before**:
```typescript
accepts: ['tool-trigger', 'tool-action', 'tool-decision']
```

**After**:
```typescript
accepts: [
  'tool-trigger', 
  'tool-action', 
  'tool-decision',
  // Email context node types
  'tool-context-persona',
  'tool-context-industry', 
  'tool-context-painpoint',
  'tool-context-metric',
  'tool-context-urgency',
  'tool-context-socialproof',
  'tool-context-objection',
  'tool-context-value'
]
```

### ✅ Build Status
- Build passes successfully with no errors
- No TypeScript compilation issues
- No linting errors introduced

### ✅ Ready for Testing

The fix is now complete and ready for user testing. Email context nodes should now be draggable from the Toolbox to the canvas.