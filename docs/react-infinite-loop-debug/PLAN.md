# React Infinite Loop Fix - Analysis & Solution Plan

## Problem Statement
React Error #185 (Maximum update depth exceeded) occurs in production when generating templates on the build page after user authentication. The error creates an infinite render loop that crashes the application.

## Analysis Plan

### Phase 1: Complete Dependency Mapping
**Objective**: Map all useEffect dependencies and callback chains to identify circular references

#### 1.1 Primary Problem File Analysis
- **File**: `app/build/components/BuildPageContent.tsx`
- **Focus Areas**:
  - All useEffect hooks (lines 111, 210, 382, 491, 496)
  - Callback dependencies in useCallback hooks
  - State update chains
  - Cross-hook dependencies

#### 1.2 Scenario Management Analysis
- **File**: `app/build/hooks/useScenarioManager.ts`
- **Focus Areas**:
  - `updateScenario` function and its side effects
  - Auto-save timeout logic
  - State management patterns
  - onScenarioChange callback usage

#### 1.3 ROI Hook Analysis
- **File**: `app/build/hooks/useROI.ts` (if exists)
- **Focus Areas**:
  - `loadFromScenario` function
  - `onSettingsChange` callback
  - How it interacts with scenario updates

#### 1.4 Email Generation Analysis
- **File**: `app/build/hooks/useEmailGeneration.ts`
- **Focus Areas**:
  - Template loading triggers
  - State updates that might affect scenario
  - Any scenario dependencies

### Phase 2: Identify All Circular Dependency Patterns

#### 2.1 Primary Loop (Already Identified)
```
useEffect[scenarioManager.scenario] → loadScenarioToCanvas → setNodes → saveEffect → updateScenario → scenario change → useEffect[scenarioManager.scenario]
```

#### 2.2 Secondary Loops to Check
- ROI settings updates triggering scenario updates
- Template loading affecting scenario state
- Node/edge changes triggering multiple effects
- Callback re-creation causing effect retriggering

#### 2.3 Production vs Development Differences
- Minification effects
- React optimization differences
- Timing differences in production

### Phase 3: Solution Approaches

#### 3.1 Minimal Fix (Quick Solution) ⚡ IMMEDIATE
**Target**: Fix only the immediate circular dependency
**Files**: `app/build/components/BuildPageContent.tsx`
**Changes**:
```javascript
// FIX 1: Remove circular dependency from main useEffect (line 218)
}, [scenarioManager.scenario?.id, loadScenarioToCanvas, roi.loadFromScenario]); 
// REMOVED: scenarioManager.scenario, CHANGED: roi → roi.loadFromScenario

// FIX 2: Fix save effect dependencies (line 531)
}, [nodes, edges, scenarioManager.updateScenario, isLoading]); 
// REMOVED: scenarioManager.scenario?.id, scenarioManager, CHANGED: to updateScenario only

// FIX 3: Fix callback dependencies (line 158)
}, [scenarioManager.updateScenario]); 
// REMOVED: scenarioManager, CHANGED: to specific function

// FIX 4: Fix loadScenarioToCanvas callback (line 208)
}, []); 
// EMPTY: since scenario is passed as parameter, no need for external deps
```

#### 3.2 Comprehensive Fix (Recommended) 🔧 SPRINT
**Target**: Restructure the entire flow to prevent similar issues
**Files**: `app/build/components/BuildPageContent.tsx`, `app/build/hooks/useScenarioManager.ts`

**Changes**:
1. **Loading State Machine**:
```javascript
const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

// Replace isLoadingScenarioRef with proper state machine
const loadScenarioToCanvas = useCallback((scenario: Scenario) => {
  if (loadingState === 'loading') return; // Prevent concurrent loads
  
  setLoadingState('loading');
  // ... loading logic
  setLoadingState('loaded');
}, [loadingState]);
```

2. **Separate Loading Effects**:
```javascript
// Separate scenario ID changes from scenario loading
useEffect(() => {
  if (scenarioManager.scenario?.id && loadingState === 'idle') {
    setLoadingState('loading');
  }
}, [scenarioManager.scenario?.id, loadingState]);

// Handle loading when state changes
useEffect(() => {
  if (loadingState === 'loading' && scenarioManager.scenario) {
    loadScenarioToCanvas(scenarioManager.scenario);
    roi.loadFromScenario(scenarioManager.scenario);
  }
}, [loadingState, scenarioManager.scenario?.id]); // Only depend on ID
```

3. **Debounced Save with Loading Guards**:
```javascript
const debouncedSave = useMemo(() => 
  debounce((updates: Partial<Scenario>) => {
    if (loadingState !== 'loading') {
      scenarioManager.updateScenario(updates);
    }
  }, 500), [scenarioManager.updateScenario, loadingState]
);
```

#### 3.3 Architectural Refactor (Long-term) 🏗️ EPIC
**Target**: Redesign the component architecture
**Files**: New context/hooks, refactored components

**Changes**:
1. **Scenario Context Provider**:
```javascript
// New: contexts/ScenarioContext.tsx
const ScenarioContext = createContext();

export function ScenarioProvider({ children }) {
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Isolated loading logic
  const loadScenario = useCallback(async (id: string) => {
    setIsLoading(true);
    const loaded = await db.scenarios.get(id);
    setScenario(loaded);
    setIsLoading(false);
  }, []);
  
  return (
    <ScenarioContext.Provider value={{ scenario, isLoading, loadScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}
```

2. **Separate Canvas Hook**:
```javascript
// New: hooks/useCanvas.ts
export function useCanvas(scenario: Scenario | null) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  
  // Only load when scenario ID changes, not the entire object
  useEffect(() => {
    if (scenario?.id) {
      loadScenarioToCanvas(scenario);
    }
  }, [scenario?.id]); // Only depend on ID
  
  // Separate save logic with its own state
  const saveScenario = useMemo(() => 
    debounce((updates) => {
      // Direct database save without triggering scenario state
      db.scenarios.update(scenario.id, updates);
    }, 500), [scenario?.id]
  );
  
  return { nodes, edges, setNodes, setEdges, saveScenario };
}
```

3. **React Query Integration** (Optional):
```javascript
// Use React Query for data fetching
const { data: scenario, isLoading } = useQuery({
  queryKey: ['scenario', scenarioId],
  queryFn: () => db.scenarios.get(scenarioId),
  enabled: !!scenarioId,
});

// Mutations for updates
const updateScenarioMutation = useMutation({
  mutationFn: (updates) => db.scenarios.update(scenarioId, updates),
  onSuccess: () => queryClient.invalidateQueries(['scenario', scenarioId]),
});
```

### Phase 4: Testing Strategy

#### 4.1 Test Cases to Verify
1. **Template Generation Flow**:
   - Navigate from home page after auth
   - Generate template with query
   - Generate template with template ID
   - Generate default template

2. **Edge Cases**:
   - Empty scenarios
   - Failed template loads
   - Network errors during generation
   - Multiple rapid template generations

3. **Performance Tests**:
   - Check for memory leaks
   - Monitor render cycles
   - Verify cleanup functions work

#### 4.2 Debug Tools
- Add render counting to suspect components
- Add console logs for state transitions
- Use React DevTools Profiler
- Monitor useEffect execution order

### Phase 5: Implementation Steps

#### 5.1 Immediate Fix (Emergency)
1. Apply minimal dependency array fix
2. Add loading state guards
3. Test basic functionality
4. Deploy to production

#### 5.2 Comprehensive Fix (Sprint)
1. Implement proper loading state machine
2. Refactor callback dependencies
3. Add comprehensive tests
4. Performance optimization
5. Code review and deployment

#### 5.3 Long-term Refactor (Epic)
1. Design new architecture
2. Implement data fetching layer
3. Migrate components incrementally
4. Add proper error boundaries
5. Performance monitoring

## Files to Analyze in Detail

### Priority 1 (Immediate)
1. `app/build/components/BuildPageContent.tsx`
2. `app/build/hooks/useScenarioManager.ts`

### Priority 2 (Soon)
3. `app/build/hooks/useEmailGeneration.ts`
4. `lib/db.ts` (scenario update functions)
5. `app/build/hooks/useROI.ts`

### Priority 3 (Later)
6. `components/flow/FlowCanvas.tsx`
7. `app/page.tsx` (authentication flow)
8. Related React Flow components

## Success Criteria

### Immediate Success
- [ ] No more React Error #185 in production
- [ ] Template generation works without crashes
- [ ] No infinite console logs

### Short-term Success
- [ ] Stable performance in all template generation scenarios
- [ ] Clean state management without circular dependencies
- [ ] Proper loading states and error handling

### Long-term Success
- [ ] Maintainable code architecture
- [ ] Performance optimizations
- [ ] Comprehensive test coverage
- [ ] Monitoring and alerting for similar issues

## Risk Assessment

### High Risk
- Changing core scenario management could break other features
- Template loading is critical user flow
- Production debugging is limited

### Medium Risk
- State management changes might have unexpected side effects
- React Flow integration complexity
- Database update patterns

### Low Risk
- Adding debug logging
- Improving error boundaries
- Performance monitoring additions

## Next Actions
1. Run detailed analysis of all identified files
2. Create minimal fix first for immediate relief
3. Plan comprehensive solution for next sprint
4. Set up monitoring to prevent similar issues