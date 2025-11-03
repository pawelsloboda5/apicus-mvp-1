# ROI Metrics Synchronization - Data Flow

## Complete Data Flow After Fixes

```
┌─────────────────────────────────────────────────────────────────┐
│                      BuildPageContent                            │
│                                                                  │
│  1. scenarioManager.scenario (from IndexedDB)                   │
│     └── contains: taskSpecificFactors, runs, minutes, etc.      │
│                                                                  │
│  2. useROI hook                                                  │
│     ├── Input: scenario + taskSpecificFactors                   │
│     ├── Calculates: centralized ROI metrics                     │
│     └── Output: roi.metrics + roi.settings                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                    │                              │
                    │                              │
         ┌──────────▼────────────┐    ┌───────────▼────────────┐
         │     StatsBar          │    │  ROISettingsPanel      │
         │                       │    │  (via Adapter)         │
         │  Receives:            │    │                        │
         │  • precomputedMetrics │    │  Receives:             │
         │    (from useROI)      │    │  • config (with        │
         │  • nodes              │    │    taskSpecificFactors)│
         │  • currentScenario    │    │  • currentScenario     │
         │    (for factors)      │    │  • nodes               │
         │                       │    │                        │
         │  Displays:            │    │  ↓ ROISettingsPanelRef │
         │  • Net ROI            │    │                        │
         │  • ROI Ratio          │    │  localConfig state:    │
         │  • Time Saved         │    │  • core (runs, mins)   │
         │  • Payback            │    │  • compliance          │
         │                       │    │  • revenue             │
         │  Uses precomputed ✓   │    │  • factors             │
         │  No recalculation     │    │                        │
         └───────────────────────┘    │  Calculates own        │
                                      │  metrics using same    │
                                      │  inputs as useROI ✓    │
                                      │                        │
                                      │  Displays:             │
                                      │  • Net ROI (identical) │
                                      │  • ROI Ratio (same)    │
                                      │  • Time Saved (same)   │
                                      │  • Payback (same)      │
                                      └────────────────────────┘
```

## Update Flow When User Changes Values

### BEFORE ALL FIXES (Multiple Issues)

**Runs Per Month:**
```
User changes runs in ROI Panel
    │
    ├─► localConfig updated ✓
    │
    ├─► onConfigChange called ✓
    │       │
    │       └─► useROI.setRunsPerMonth ✓
    │               │
    │               ├─► useROI recalculates ✓
    │               └─► StatsBar updates ✓
    │
    └─► Parent sends new config prop back
            │
            └─► ❌ localConfig IGNORES it (out of sync!)
```

**Compliance/Revenue Settings:**
```
User changes risk level in ROI Panel
    │
    ├─► localConfig updated via dispatch ✓
    │
    ├─► ❌ onConfigChange NOT CALLED
    │
    ├─► updateScenarioROI called ✓ (persisted to DB)
    │
    └─► ❌ useROI never recalculates
            │
            └─► ❌ StatsBar shows OLD values (out of sync!)
```

### AFTER ALL FIXES (Perfect Sync)

**Any Setting Change (Runs, Minutes, Risk Level, Revenue, etc.):**
```
User changes ANY value in ROI Panel
    │
    ├─► 1. dispatch() updates localConfig ✓
    │
    ├─► 2. onConfigChange() notifies parent ✓
    │       │
    │       └─► useROI receives update ✓
    │               │
    │               ├─► useROI recalculates with new value ✓
    │               │       │
    │               │       └─► StatsBar receives new precomputedMetrics ✓
    │               │
    │               └─► scenario updated in memory ✓
    │
    ├─► 3. updateScenarioROI() persists to DB ✓
    │
    └─► 4. Parent sends new config prop back
            │
            └─► useEffect detects change (signature check)
                    │
                    ├─► Signature changed? Yes
                    │
                    └─► SYNC_FROM_PARENT ensures localConfig synced ✓
                            │
                            └─► Panel and StatsBar show IDENTICAL values ✓
```

## Key Mechanisms

### 1. Task-Specific Factors Sync
```typescript
// ROISettingsPanelAdapter.tsx
const taskSpecificFactors = props.currentScenario?.taskSpecificFactors;

const config = {
  // ...
  factors: {
    positive: taskSpecificFactors?.definitions?.positive || [],
    negative: taskSpecificFactors?.definitions?.negative || [],
    factorValues: { ...taskSpecificFactors?.positive, ...taskSpecificFactors?.negative },
    enabledFactors: taskSpecificFactors?.enabled || {},
    // ...
  }
};
```

### 2. Bidirectional Sync
```typescript
// ROISettingsPanelRefactored.tsx
React.useEffect(() => {
  const configSignature = JSON.stringify({
    core: config.core,
    compliance: config.compliance,
    revenue: config.revenue,
  });
  
  if (configSignature !== lastSyncedConfigRef.current) {
    lastSyncedConfigRef.current = configSignature;
    dispatch({
      type: 'SYNC_FROM_PARENT',
      core: config.core,
      compliance: config.compliance,
      revenue: config.revenue,
    });
  }
}, [config]);
```

### 3. Signature-Based Change Detection
```typescript
// Only syncs when VALUES change, not on every render
const configSignature = JSON.stringify({
  core: config.core,
  compliance: config.compliance,
  revenue: config.revenue,
});

if (configSignature !== lastSyncedConfigRef.current) {
  // Values changed, sync them
}
```

## Synchronization Guarantees

### What Gets Synced
✓ Runs per month
✓ Minutes per run
✓ Hourly rate
✓ Task multiplier
✓ Task type
✓ Compliance settings
✓ Revenue settings
✓ Task-specific factor definitions
✓ Task-specific factor values
✓ Task-specific factor enabled states

### What Gets Preserved
✓ Local factor edits (until saved)
✓ Locked factor states
✓ Panel UI state (accordions, mode, etc.)

## Testing Scenarios

### Scenario 1: Change runs in StatsBar
1. User clicks +/- on runs in StatsBar
2. StatsBar updates immediately (uses precomputed metrics)
3. ROI Panel receives new config via props
4. SYNC_FROM_PARENT updates panel's localConfig
5. Panel recalculates and displays same values as StatsBar ✓

### Scenario 2: Change runs in ROI Panel
1. User adjusts runs slider in ROI Panel
2. localConfig updates via dispatch
3. onConfigChange calls useROI.setRunsPerMonth
4. useROI recalculates centralized metrics
5. StatsBar receives new precomputedMetrics
6. Parent sends updated config back to panel
7. SYNC_FROM_PARENT ensures localConfig stays in sync ✓

### Scenario 3: Generate AI factors
1. User clicks "Generate Factors" in ROI Panel
2. API returns new factor definitions
3. Panel updates localConfig.factors
4. updateScenarioROI persists to database
5. Metrics recalculate with new factors
6. Both StatsBar and Panel show updated ROI with factors applied ✓

### Scenario 4: Toggle factor on/off
1. User toggles a factor in ROI Panel
2. localConfig.factors.enabledFactors updates
3. Metrics recalculate (filtering disabled factors)
4. Panel shows updated metrics
5. updateScenarioROI persists enabled state
6. StatsBar receives updated metrics from useROI ✓

## Performance Optimizations

### 1. Single Calculation Source
- useROI calculates metrics once
- StatsBar uses precomputed values
- No duplicate calculations

### 2. Efficient Sync
- Signature-based change detection
- Bulk updates via SYNC_FROM_PARENT
- Ref-based tracking prevents infinite loops

### 3. Selective Syncing
- Only syncs core/compliance/revenue
- Preserves local factor edits
- Avoids unnecessary re-renders

## Edge Cases Handled

### ✓ Rapid Changes
Signature comparison prevents sync thrashing

### ✓ Scenario Switching
Both components reload from new scenario data

### ✓ Factor Generation During Edits
Factors are preserved if user is editing them

### ✓ External Updates
Panel syncs when parent updates from any source

### ✓ Circular Dependencies
Ref-based tracking and signature comparison prevent loops

