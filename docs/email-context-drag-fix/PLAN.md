# Email Context Node Drag & Drop Fix - Implementation Plan

## Overview
Fix the issue where email context nodes cannot be dragged from the Toolbox to the FlowCanvas.

## Problem Statement
Users cannot drag email context nodes (persona, industry, painpoint, metric, urgency, socialproof, objection, value) from the Toolbox to the canvas. The drag operation starts but the drop is rejected.

## Root Cause
The droppable canvas area in `BuildPageCore.tsx` only accepts basic node types (`tool-trigger`, `tool-action`, `tool-decision`) but not email context node types.

## Solution Architecture

```mermaid
graph TD
    A[Toolbox Email Context Items] -->|useDraggable| B[Drag Start]
    B -->|data: {nodeType, isEmailContext}| C[DndContext]
    C -->|Check accepts array| D{Canvas Droppable}
    D -->|❌ Rejects| E[Drop Fails]
    D -->|✅ Accepts| F[handleDragEnd]
    F -->|isEmailContext=true| G[Create Email Context Node]
    G --> H[Add to Canvas]
    
    style E fill:#ffcccc
    style G fill:#ccffcc
    style H fill:#ccffcc
```

## Implementation Steps

### Step 1: Update Droppable Accepts Array
**File**: `app/build/components/BuildPageCore.tsx`
**Lines**: 286-291

**Current Code**:
```typescript
const { setNodeRef: setDroppableRef, isOver } = useDroppable({ 
  id: "canvas",
  data: {
    accepts: ['tool-trigger', 'tool-action', 'tool-decision']
  }
});
```

**Fixed Code**:
```typescript
const { setNodeRef: setDroppableRef, isOver } = useDroppable({ 
  id: "canvas",
  data: {
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
  }
});
```

### Step 2: Verify Data Flow
**File**: `components/flow/Toolbox.tsx`
**Component**: `EmailContextToolboxItem`

**Draggable Configuration**:
```typescript
const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: `tool-context-${type}`,  // ✅ Matches expected pattern
  data: { 
    nodeType: type,             // ✅ Contains node type
    isEmailContext: true,       // ✅ Marks as email context
    contextValue: defaultValue, // ✅ Contains default value
    category                    // ✅ Contains category
  },
});
```

### Step 3: Test Drop Handler Logic
**File**: `app/build/components/BuildPageCore.tsx`
**Function**: `handleDragEnd`

**Email Context Node Creation** (lines 337-348):
```typescript
data: isEmailContext ? {
  label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
  isEmailContext: true,
  contextType: nodeType,
  contextValue: contextValue || '',
  category: category || '',
} : {
  // ... regular node handling
}
```

## File Structure

```
docs/email-context-drag-fix/
├── CLAUDE.md           # Context and analysis
├── PLAN.md            # This implementation plan
└── [future test results]

app/build/components/
├── BuildPageCore.tsx   # ✅ Main fix location
└── BuildPageContent.tsx

components/flow/
├── Toolbox.tsx        # ✅ Already correct
├── FlowCanvas.tsx     # ✅ Already handles connections
└── PixelNode.tsx      # ✅ Already renders email context

lib/
├── types/index.ts     # ✅ Already defines types
└── flow/
    └── node-factory.ts # ✅ Already has creation logic
```

## Testing Checklist

- [ ] Email context nodes can be dragged from toolbox
- [ ] Canvas accepts the drop (visual feedback)
- [ ] Nodes are created at correct position
- [ ] Nodes have correct data structure:
  - [ ] `isEmailContext: true`
  - [ ] `contextType` matches node type
  - [ ] `contextValue` has default value
  - [ ] `category` is set correctly
- [ ] Nodes render with correct styling
- [ ] Nodes can connect to email preview nodes
- [ ] Regular nodes still work normally

## Verification Steps

1. **Visual Test**: Drag each email context node type from toolbox to canvas
2. **Data Test**: Inspect created nodes in React DevTools
3. **Connection Test**: Try connecting email context nodes to email preview nodes
4. **Regression Test**: Verify basic nodes (trigger, action, decision) still work

## Success Criteria

✅ **Primary Goal**: Email context nodes can be successfully dragged from toolbox to canvas
✅ **Secondary Goal**: No regression in existing drag & drop functionality  
✅ **Tertiary Goal**: All 8 email context node types work correctly

## Risk Assessment

**Low Risk** - The fix is isolated to the droppable accepts array. The drop handler already supports email context nodes, so this is purely a filter issue.

**Rollback Plan** - If issues arise, simply revert the accepts array to the original 3 values.