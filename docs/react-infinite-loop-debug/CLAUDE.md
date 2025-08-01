# React Infinite Loop Debug Session - Claude Tracking

## Issue Summary
**Error**: React Maximum update depth exceeded (Error #185) in production
**Location**: Build page template generation flow
**Console Message**: "Added default trigger node since scenario was empty"

## Current Status: ✅ MINIMAL FIX IMPLEMENTED - TESTING REQUIRED

### Analysis Progress
- ✅ **Identified Error Type**: React Error #185 - Maximum call stack size exceeded
- ✅ **Located Error Source**: `app/build/components/BuildPageContent.tsx` line 183 console log
- ✅ **Found Problematic useEffect**: Lines 211-218 with circular dependencies
- ⚠️ **User Reverted Changes**: User has reverted the recommended fixes back to original problematic code
- ✅ **Analyzed ROI Hook**: `useROI.loadFromScenario` only updates local state, not a direct cause
- ✅ **Identified Save Loop**: Lines 496-531 save effect triggers `scenarioManager.updateScenario`
- ✅ **Applied Minimal Fix**: Fixed all 4 problematic dependency arrays
- 🔄 **Current Status**: Ready for testing - fixes should eliminate infinite loop

### Key Findings

#### Root Cause Identified
The infinite loop is in `BuildPageContent.tsx` useEffect (lines 211-218):
```javascript
useEffect(() => {
  if (scenarioManager.scenario && !isLoadingScenarioRef.current) {
    loadScenarioToCanvas(scenarioManager.scenario);
    roi.loadFromScenario(scenarioManager.scenario);
  }
}, [scenarioManager.scenario?.id, loadScenarioToCanvas, roi, scenarioManager.scenario]); // ← PROBLEM HERE
```

**The Issue**: `scenarioManager.scenario` in dependency array creates circular updates:
1. useEffect triggers on scenario change
2. `loadScenarioToCanvas` calls `setNodes`/`setEdges` (lines 190-191)
3. Save effect (lines 497-531) triggers and calls `scenarioManager.updateScenario` (line 524)
4. This creates new scenario object reference via `updateScenario` → `setState`
5. useEffect triggers again → infinite loop

#### Detailed Circular Dependency Chain

**Primary Loop**:
```
useEffect[scenarioManager.scenario] 
  → loadScenarioToCanvas(scenario)
    → setNodes(loadedNodes) + setEdges(loadedEdges)
      → Save useEffect[nodes, edges, scenarioManager] triggers
        → scenarioManager.updateScenario({nodesSnapshot, edgesSnapshot})
          → useScenarioManager.updateScenario()
            → setState(prev => ({...prev, currentScenario: updatedScenario}))
              → New scenario object reference created
                → useEffect[scenarioManager.scenario] triggers again
```

**ROI Hook Analysis**:
- `roi.loadFromScenario()` only calls `setROIState()` internally (line 224)
- Does NOT trigger scenario updates or cause loops
- The `roi` dependency in useEffect is problematic because it's the entire hook object
- Should be `roi.loadFromScenario` specifically

**Save Effect Analysis** (lines 497-531):
- Triggers on `[nodes, edges, scenarioManager.scenario?.id, scenarioManager, isLoading]`
- Having `scenarioManager` as dependency is dangerous - it's the entire hook object
- Should only depend on `scenarioManager.updateScenario` function
- The `scenarioManager.scenario?.id` dependency is also risky when combined with others

#### Applied Fixes (Minimal Changes)

**✅ FIXED: Main useEffect (lines 211-218)**
```javascript
// BEFORE: [scenarioManager.scenario?.id, loadScenarioToCanvas, roi, scenarioManager.scenario]
// AFTER:  [scenarioManager.scenario?.id, loadScenarioToCanvas, roi.loadFromScenario]
// REMOVED: scenarioManager.scenario (circular reference)
// CHANGED: roi → roi.loadFromScenario (specific function)
```

**✅ FIXED: Save Effect (line 531)**
```javascript
// BEFORE: [nodes, edges, scenarioManager.scenario?.id, scenarioManager, isLoading]
// AFTER:  [nodes, edges, scenarioManager.updateScenario, isLoading]
// REMOVED: scenarioManager.scenario?.id, scenarioManager (circular references)
// CHANGED: to specific updateScenario function only
```

**✅ FIXED: handleROISettingsChange (line 158)**
```javascript
// BEFORE: [scenarioManager]
// AFTER:  [scenarioManager.updateScenario]
// CHANGED: to specific function instead of entire hook object
```

**✅ FIXED: loadScenarioToCanvas (line 208)**
```javascript
// BEFORE: [setNodes, setEdges, rfInstance]
// AFTER:  []
// REMOVED: all dependencies since scenario is passed as parameter
```

### Next Steps - TESTING PHASE
1. **✅ COMPLETE: Applied minimal dependency fixes**
2. **🔄 TESTING REQUIRED**: Verify template generation flow works without infinite loops
3. **🔄 MONITORING**: Watch for console errors and performance issues
4. **📋 VALIDATION**: Test all template generation scenarios:
   - Home page → Auth → Template generation
   - Query-based template generation
   - Template ID-based generation
   - Default template usage

### Expected Results
- **No more React Error #185** in production
- **No infinite console logs** ("Added default trigger node..." should appear only once)
- **Template generation completes successfully** without crashes
- **Normal performance** without excessive re-renders

### Files to Analyze
- `app/build/components/BuildPageContent.tsx` (main problem)
- `app/build/hooks/useScenarioManager.ts` (scenario state management)
- `app/build/hooks/useEmailGeneration.ts` (potential related issues)
- `components/flow/panels/NodePropertiesPanel/index.tsx` (user's current file)

### Solution Strategy
Need to provide multiple approaches since user reverted the initial fix:

#### 1. **IMMEDIATE FIX** (Emergency Production Relief)
**Target**: Fix only the circular dependency with minimal code changes
- Remove `scenarioManager.scenario` from useEffect dependencies
- Fix callback dependencies to be more specific
- Add additional loading guards

#### 2. **COMPREHENSIVE FIX** (Recommended Long-term)
**Target**: Restructure the flow to prevent similar issues
- Separate loading state from scenario updates
- Use loading state machine pattern
- Implement proper dependency isolation
- Add comprehensive loading guards

#### 3. **ARCHITECTURAL REFACTOR** (Future-proof)
**Target**: Redesign component architecture to eliminate circular dependencies
- Extract scenario loading to a separate context/hook
- Use React Query for data fetching
- Implement proper suspense boundaries
- Separate UI state from data state

## Notes
- Production environment shows minified error, making debugging harder
- Error occurs specifically during template generation after authentication
- The console log "Added default trigger node since scenario was empty" is the key marker
- User is currently focused on `components/flow/panels/NodePropertiesPanel/index.tsx`