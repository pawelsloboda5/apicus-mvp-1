# ROI Metrics Synchronization Fix

## Problem
The ROI metrics displayed in **StatsBar** and **ROISettingsPanelRefactored** were showing different values because they were using different task-specific factors data sources.

### Root Cause
The `ROISettingsPanelAdapter` was creating a config with **empty task-specific factors** (empty arrays), while the `useROI` hook was receiving the actual task-specific factors from the scenario. This caused the two components to calculate different ROI values.

## Solution

### Changes Made

#### 1. ROISettingsPanelAdapter.tsx
**Added `currentScenario` prop** to pass scenario data to the adapter:
```typescript
interface LegacyROISettingsPanelProps {
  // ... existing props
  currentScenario?: Scenario | null;
}
```

**Extract task-specific factors from scenario**:
```typescript
const taskSpecificFactors = props.currentScenario?.taskSpecificFactors;
```

**Populate config.factors with actual data**:
```typescript
factors: {
  positive: (taskSpecificFactors?.definitions?.positive || []),
  negative: (taskSpecificFactors?.definitions?.negative || []),
  factorValues: {
    ...(taskSpecificFactors?.positive || {}),
    ...(taskSpecificFactors?.negative || {}),
  },
  lockedFactors: {},
  enabledFactors: taskSpecificFactors?.enabled || {},
  confidence: taskSpecificFactors?.confidence || 0,
  generated: !!(taskSpecificFactors?.definitions?.positive?.length || 
                taskSpecificFactors?.definitions?.negative?.length),
}
```

#### 2. BuildPageContent.tsx
**Pass currentScenario to ROISettingsPanel**:
```typescript
<ROISettingsPanel
  // ... existing props
  currentScenario={scenarioManager.scenario}
/>
```

## Data Flow (Now Synchronized)

### StatsBar Metrics Flow
1. `BuildPageContent` creates `useROI` hook with `taskSpecificFactors` from scenario
2. `useROI` calculates centralized metrics using task-specific factors
3. `StatsBar` receives `precomputedMetrics` from `roi.metrics`
4. **Result**: Displays metrics calculated with task-specific factors

### ROISettingsPanelRefactored Metrics Flow
1. `BuildPageContent` passes `currentScenario` to `ROISettingsPanel`
2. `ROISettingsPanelAdapter` extracts task-specific factors from `currentScenario`
3. `ROISettingsPanelRefactored` receives `config` with actual task-specific factors
4. Panel calculates metrics using the same task-specific factors
5. **Result**: Displays metrics calculated with identical task-specific factors

## Key Components

### Both Use Same Calculation Logic
Both components now use `calculateRoiMetrics()` from `lib/roi-metrics.ts` with:
- Same core settings (runs, minutes, hourly rate, multiplier)
- Same compliance/revenue settings
- **Same task-specific factors** (positive, negative, enabled map)

### Factor Filtering Logic (Identical)
Both components filter factors using the same logic:
```typescript
const isEnabled = (id: string) => enabledMap[id] !== false;
const filteredPositive = factors.positive.filter(f => isEnabled(f.id));
const filteredNegative = factors.negative.filter(f => isEnabled(f.id));
```

## Testing Instructions

### 1. Verify Base Metrics Sync
1. Open a scenario with task-specific factors generated
2. Check ROI metrics in **StatsBar** (top bar)
3. Open **ROI Settings Panel** (click ROI Settings button)
4. Verify the ROI Summary shows **identical values**:
   - Net ROI
   - ROI Ratio
   - Time Saved
   - Payback Period

### 2. Verify Factor-Adjusted Metrics
1. In ROI Settings Panel, expand "Task-Specific Optimization Factors"
2. Note the current ROI values
3. Toggle a factor on/off or adjust its value
4. Verify both StatsBar and ROI Panel update with **same new values**

### 3. Verify Real-Time Updates
1. In ROI Settings Panel, change "Runs Per Month"
2. Watch both StatsBar and ROI Panel update simultaneously
3. Both should show **identical ROI metrics**

### 4. Verify Factor Generation
1. Create a new scenario
2. Open ROI Settings Panel
3. Click "Generate Factors"
4. After generation, verify:
   - ROI Panel shows new metrics with factors applied
   - Close the panel
   - StatsBar shows **identical metrics** with factors applied

## Expected Behavior

### Before Fix
- StatsBar: Net ROI = $X (with task-specific factors)
- ROI Panel: Net ROI = $Y (without task-specific factors)
- **Values different** ❌

### After Fix
- StatsBar: Net ROI = $X (with task-specific factors)
- ROI Panel: Net ROI = $X (with same task-specific factors)
- **Values identical** ✅

## Technical Notes

### Why Not Pass Precomputed Metrics?
We considered passing `roi.metrics` directly to ROISettingsPanelRefactored to avoid duplicate calculations. However, the panel uses a reducer for local state management and needs to show real-time updates as users adjust sliders. Passing the same INPUT DATA (task-specific factors) ensures both calculate identical results while maintaining the panel's responsive UX.

### Factor Persistence
Both components persist changes to the scenario database via `updateScenarioROI()`, ensuring task-specific factors remain synchronized across:
- Current session
- Scenario switches
- Page refreshes

## Additional Fix: Bidirectional Sync

### Problem 2: Panel Gets Out of Sync
After fixing the task-specific factors, there was still a sync issue: when changing "runs per month" in the ROI Panel, the StatsBar would update but then get out of sync because the panel's `localConfig` state didn't sync back when parent props changed.

### Root Cause
The panel uses `useReducer` with local state initialized from props, but there was **no useEffect to sync incoming prop changes back to local state**. This created a one-way data flow issue.

### Solution: SYNC_FROM_PARENT Action

**Added new reducer action** (`components/roi/types.ts`):
```typescript
| { type: 'SYNC_FROM_PARENT'; core: ROICoreConfig; compliance: ROIComplianceConfig; revenue: ROIRevenueConfig };
```

**Implemented reducer handler** (`components/roi/reducer.ts`):
```typescript
case 'SYNC_FROM_PARENT':
  // Sync core settings from parent without touching factors
  return {
    ...state,
    core: action.core,
    compliance: action.compliance,
    revenue: action.revenue,
    // Preserve factors - they might be being edited in the panel
  };
```

**Added sync effect** (`components/roi/ROISettingsPanelRefactored.tsx`):
```typescript
React.useEffect(() => {
  const configSignature = JSON.stringify({
    core: config.core,
    compliance: config.compliance,
    revenue: config.revenue,
  });
  
  // Only sync if the core config actually changed (ignore factors to prevent loops)
  if (configSignature !== lastSyncedConfigRef.current) {
    lastSyncedConfigRef.current = configSignature;
    
    // Bulk update local state to match incoming props (preserves factors)
    dispatch({
      type: 'SYNC_FROM_PARENT',
      core: config.core,
      compliance: config.compliance,
      revenue: config.revenue,
    });
  }
}, [config]);
```

### Why This Works
1. **Signature-based detection**: Only syncs when actual values change (prevents unnecessary updates)
2. **Preserves factors**: Factors aren't synced from parent, so user edits are preserved
3. **Efficient bulk update**: Single dispatch instead of multiple updates
4. **Prevents circular deps**: Uses ref-based signature tracking to avoid infinite loops

## Additional Fix: Missing onConfigChange Calls

### Problem 3: Compliance & Revenue Settings Don't Update StatsBar
After fixing the bidirectional sync, there was still an issue: changing compliance or revenue settings (risk level, error cost, conversion rate, etc.) in the panel didn't update the StatsBar.

### Root Cause
The inline handlers for compliance and revenue settings were calling:
1. ✅ `dispatch()` - Updates local panel state
2. ✅ `updateScenarioROI()` - Persists to database

But they were **missing**:
3. ❌ `onConfigChange()` - Notify parent (useROI hook)

Without calling `onConfigChange`, the parent `useROI` hook never recalculated metrics, so StatsBar never received updates!

### Solution: Add onConfigChange to All Handlers

**Before (missing onConfigChange)**:
```typescript
onCheckedChange={(checked) => {
  dispatch({ type: 'UPDATE_COMPLIANCE', field: 'enabled', value: checked });
  updateScenarioROI({ complianceEnabled: checked });
}}
```

**After (complete sync)**:
```typescript
onCheckedChange={(checked) => {
  dispatch({ type: 'UPDATE_COMPLIANCE', field: 'enabled', value: checked });
  onConfigChangeRef.current({
    compliance: { ...localConfigRef.current.compliance, enabled: checked }
  });
  updateScenarioROI({ complianceEnabled: checked });
}}
```

**Fixed all 8 inline handlers**:
- ✅ Compliance enabled toggle
- ✅ Risk level slider
- ✅ Risk frequency slider
- ✅ Error cost input
- ✅ Revenue enabled toggle
- ✅ Monthly volume input
- ✅ Conversion rate slider
- ✅ Value per conversion input

### Why This Completes the Sync
Now ALL handlers follow the same pattern:
1. Update local state (`dispatch`)
2. Notify parent (`onConfigChange`) → triggers useROI recalculation → StatsBar updates
3. Persist to DB (`updateScenarioROI`)

## Files Modified
1. `components/roi/ROISettingsPanelAdapter.tsx` - Extract and pass task-specific factors
2. `app/build/components/BuildPageContent.tsx` - Pass currentScenario to panel
3. `components/roi/types.ts` - Add SYNC_FROM_PARENT action type
4. `components/roi/reducer.ts` - Implement SYNC_FROM_PARENT handler
5. `components/roi/ROISettingsPanelRefactored.tsx` - Add bidirectional sync logic + fix all inline handlers

## Related Components
- `app/build/hooks/useROI.ts` - Centralized ROI state and metrics
- `components/flow/StatsBar.tsx` - Top bar ROI display
- `components/roi/ROISettingsPanelRefactored.tsx` - ROI settings side panel
- `lib/roi-metrics.ts` - Core ROI calculation engine

