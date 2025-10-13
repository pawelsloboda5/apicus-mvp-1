# ROI Settings Panel - Implementation Guide

**Based on:** UI/UX Analysis & Improvement Strategy v1.0  
**Target Completion:** 8 weeks  
**Status:** Ready to begin

---

## Quick Start

This guide provides step-by-step instructions for implementing the UI/UX improvements to the ROI Settings Panel.

### Prerequisites

- Read the full analysis: `ROI_SETTINGS_PANEL_UX_ANALYSIS.md`
- Review existing component: `components/roi/ROISettingsPanel.tsx`
- Review test examples: `components/roi/__tests__/ROISettingsPanel.test.tsx`
- Review improved components: `components/roi/improved/`

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### 1.1 Component Splitting

**Objective:** Break down the 1,389-line component into maintainable pieces.

**Tasks:**

```bash
# Create new directory structure
mkdir -p components/roi/sections
mkdir -p components/roi/inputs
mkdir -p components/roi/hooks
```

**Files to create:**

1. **`ROISettingsPanel.tsx`** (Main orchestrator, ~200 lines)
   - Manages overall state
   - Handles mode switching
   - Coordinates sub-components

2. **`sections/PlatformComparison.tsx`** (Already exists, ~100 lines)
   - Keep as-is, minor styling updates

3. **`sections/TaskConfiguration.tsx`** (~150 lines)
   - Task type selector
   - Task multiplier display
   - Auto-fill logic

4. **`sections/CoreMetrics.tsx`** (~200 lines)
   - Runs per month
   - Minutes per run
   - Hourly rate
   - All with validated inputs

5. **`sections/AIFactorsSection.tsx`** (~250 lines)
   - Factor generation UI
   - Factor cards display
   - Lock/unlock functionality

6. **`sections/ROISummary.tsx`** (~200 lines)
   - Metric cards
   - Breakdown displays
   - Export functionality

**Example refactoring:**

```typescript
// Old (ROISettingsPanel.tsx)
export function ROISettingsPanel({ ...25 props }) {
  // 1,389 lines of code
}

// New (ROISettingsPanel.tsx)
export function ROISettingsPanel({
  open,
  onOpenChange,
  config,
  onConfigChange,
  workflow,
  actions,
  options,
}: ROISettingsPanelProps) {
  const [mode, setMode] = useState<'quick' | 'advanced'>(
    options?.mode || 'quick'
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <ModeToggle mode={mode} onChange={setMode} />
        </SheetHeader>
        
        <SheetBody>
          {mode === 'quick' ? (
            <QuickSetupFlow {...quickProps} />
          ) : (
            <AdvancedSettings {...advancedProps} />
          )}
        </SheetBody>
        
        <SheetFooter>
          <GenerateReportButton onClick={actions.onGenerateReport} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

#### 1.2 Props Refactoring

**Current (25 individual props):**
```typescript
interface ROISettingsPanelProps {
  runsPerMonth: number;
  setRunsPerMonth: (value: number) => void;
  minutesPerRun: number;
  setMinutesPerRun: (value: number) => void;
  // ... 21 more
}
```

**New (4 grouped props):**
```typescript
interface ROISettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  config: ROIConfiguration;
  onConfigChange: (config: Partial<ROIConfiguration>) => void;
  
  workflow: {
    nodes: Node[];
    platform: PlatformType;
  };
  
  actions: {
    onGenerateReport: () => void;
    onSavePreset?: (name: string) => void;
  };
  
  options?: {
    mode?: 'quick' | 'advanced';
    showPlatformComparison?: boolean;
  };
}

interface ROIConfiguration {
  core: {
    runsPerMonth: number;
    minutesPerRun: number;
    hourlyRate: number;
    taskType: string;
    taskMultiplier: number;
  };
  advanced?: {
    compliance?: ComplianceSettings;
    revenue?: RevenueSettings;
  };
}
```

#### 1.3 State Management

**Replace multiple useState with useReducer:**

```typescript
// Create reducer
const roiReducer = (state: ROIState, action: ROIAction): ROIState => {
  switch (action.type) {
    case 'UPDATE_TASK_TYPE':
      return {
        ...state,
        taskType: action.payload,
        // Auto-fill benchmarks
        minutesPerRun: benchmarks.minutes[action.payload],
        hourlyRate: benchmarks.hourlyRate[action.payload],
        taskMultiplier: taskTypeMultipliers[action.payload],
      };
    
    case 'UPDATE_CORE_METRIC':
      return {
        ...state,
        [action.field]: action.value,
      };
    
    default:
      return state;
  }
};

// Use in component
const [state, dispatch] = useReducer(roiReducer, initialState);
```

#### 1.4 Validation Framework

**Create validation hooks:**

```typescript
// hooks/useROIValidation.ts
export function useROIValidation(field: string, value: number) {
  return useMemo(() => {
    const rules = roiValidationRules[field];
    if (!rules) return { valid: true, severity: null };
    
    // Apply validation logic
    // ... (see ValidatedInput.tsx example)
    
    return validationResult;
  }, [field, value]);
}

// Usage in component
const runsValidation = useROIValidation('runsPerMonth', runsPerMonth);
```

#### 1.5 Accessibility Foundation

**Add ARIA labels to all inputs:**

```typescript
<Input
  id="runs-per-month"
  type="number"
  value={runsPerMonth}
  onChange={handleChange}
  aria-label="Runs per month"
  aria-describedby="runs-help runs-validation"
  aria-invalid={hasError}
  aria-required="true"
/>
<p id="runs-help" className="text-sm text-muted-foreground">
  Number of times this automation will run each month
</p>
{error && (
  <p id="runs-validation" role="alert" className="text-sm text-destructive">
    {error}
  </p>
)}
```

---

### Phase 2: Quick Setup Mode (Week 3)

#### 2.1 Create QuickSetupFlow Component

See `components/roi/improved/QuickSetupFlow.tsx` for full implementation.

**Key features:**
- 3-step wizard interface
- Auto-fill on task type selection
- Real-time ROI preview
- AI factors promotion (prominent CTA)
- Condensed summary

**Integration:**

```typescript
// In ROISettingsPanel.tsx
{mode === 'quick' && (
  <QuickSetupFlow
    taskType={config.core.taskType}
    onTaskTypeChange={(type) => handleConfigChange({ core: { taskType: type } })}
    runsPerMonth={config.core.runsPerMonth}
    onRunsChange={(runs) => handleConfigChange({ core: { runsPerMonth: runs } })}
    // ... other props
    roiPreview={{
      monthlyValue: metrics.totalValue,
      netROI: metrics.netROI,
      timeSaved: metrics.timeSavedHours,
      paybackDays: metrics.paybackDays,
    }}
    onGenerateFactors={actions.onGenerateFactors}
    isGeneratingFactors={isGeneratingFactors}
    onSwitchToAdvanced={() => setMode('advanced')}
  />
)}
```

#### 2.2 Mode Toggle Component

```typescript
// components/roi/ModeToggle.tsx
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onChange('quick')}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'quick'
            ? "bg-background shadow-sm"
            : "hover:bg-background/50"
        )}
      >
        Quick Setup
      </button>
      <button
        onClick={() => onChange('advanced')}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'advanced'
            ? "bg-background shadow-sm"
            : "hover:bg-background/50"
        )}
      >
        Advanced
      </button>
    </div>
  );
}
```

---

### Phase 3: Visual Enhancements (Week 4)

#### 3.1 Apply New Color System

**Update globals.css:**

```css
/* ROI-specific color tokens */
:root {
  --roi-positive: var(--success);
  --roi-positive-bg: hsl(var(--success) / 0.1);
  --roi-positive-border: hsl(var(--success) / 0.3);
  
  --roi-negative: var(--destructive);
  --roi-negative-bg: hsl(var(--destructive) / 0.1);
  --roi-negative-border: hsl(var(--destructive) / 0.3);
  
  --roi-neutral: var(--primary);
  --roi-neutral-bg: hsl(var(--primary) / 0.1);
  --roi-neutral-border: hsl(var(--primary) / 0.3);
  
  --roi-ai: var(--secondary);
  --roi-ai-bg: hsl(var(--secondary) / 0.1);
  --roi-ai-border: hsl(var(--secondary) / 0.3);
}
```

**Use in components:**

```typescript
<Card className="bg-[var(--roi-positive-bg)] border-[var(--roi-positive-border)]">
  <div className="text-[var(--roi-positive)]">
    ${positiveValue.toLocaleString()}
  </div>
</Card>
```

#### 3.2 Typography Standardization

**Replace inconsistent font sizes:**

```typescript
// Before: Mix of text-xs, text-sm, text-base, text-lg, text-2xl
// After: Consistent hierarchy

<h2 className="text-lg font-semibold">Section Title</h2>
<h3 className="text-base font-semibold">Subsection</h3>
<p className="text-sm text-muted-foreground">Helper text</p>
<span className="text-xs text-muted-foreground">Label</span>
```

#### 3.3 Spacing Standardization

**Use consistent spacing scale:**

```typescript
// Vertical spacing between sections
<div className="space-y-6">  {/* 24px between major sections */}
  <Section1 />
  <Section2 />
</div>

// Spacing within cards
<Card className="p-6 space-y-4">  {/* 24px padding, 16px between items */}
  <Item1 />
  <Item2 />
</Card>

// Tight spacing for related items
<div className="space-y-2">  {/* 8px for tightly related items */}
  <Label />
  <Input />
</div>
```

#### 3.4 Add Animations

```css
/* Smooth value updates */
@keyframes value-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.roi-value-updated {
  animation: value-pulse 300ms ease-in-out;
}

/* Fade in new sections */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

.roi-section-enter {
  animation: fade-in 300ms ease-out;
}
```

---

### Phase 4: Advanced Features (Week 5)

#### 4.1 Advanced Settings Accordion

```typescript
// components/roi/AdvancedSettings.tsx
export function AdvancedSettings({ config, onChange }: AdvancedSettingsProps) {
  return (
    <Accordion type="multiple" defaultValue={[]}>
      <AccordionItem value="core-metrics">
        <AccordionTrigger>Core Metrics</AccordionTrigger>
        <AccordionContent>
          <CoreMetricsDetailed config={config.core} onChange={onChange} />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="task-factors">
        <AccordionTrigger>Task-Specific Factors</AccordionTrigger>
        <AccordionContent>
          <AIFactorsSection {...factorProps} />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="compliance">
        <AccordionTrigger>Risk & Compliance</AccordionTrigger>
        <AccordionContent>
          <ComplianceSettings config={config.advanced?.compliance} onChange={onChange} />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="revenue">
        <AccordionTrigger>Revenue Uplift</AccordionTrigger>
        <AccordionContent>
          <RevenueSettings config={config.advanced?.revenue} onChange={onChange} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

#### 4.2 Preset System

```typescript
// hooks/useROIPresets.ts
export function useROIPresets() {
  const [presets, setPresets] = useState<ROIPreset[]>([]);

  const savePreset = useCallback((name: string, config: ROIConfiguration) => {
    const preset: ROIPreset = {
      id: generateId(),
      name,
      config,
      createdAt: Date.now(),
    };
    
    setPresets(prev => [...prev, preset]);
    
    // Persist to localStorage
    localStorage.setItem('roi-presets', JSON.stringify([...presets, preset]));
  }, [presets]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    return preset?.config;
  }, [presets]);

  return { presets, savePreset, loadPreset };
}

// Usage
const { presets, savePreset, loadPreset } = useROIPresets();

<Button onClick={() => savePreset('My Workflow', config)}>
  Save Preset
</Button>

<Select onValueChange={(id) => {
  const config = loadPreset(id);
  if (config) onConfigChange(config);
}}>
  {presets.map(preset => (
    <SelectItem key={preset.id} value={preset.id}>
      {preset.name}
    </SelectItem>
  ))}
</Select>
```

---

### Phase 5: Responsive & Accessibility (Week 6)

#### 5.1 Responsive Layout

**Update SheetContent:**

```typescript
<SheetContent 
  side={isMobile ? "bottom" : "right"}
  className={cn(
    // Mobile: Full screen bottom sheet
    "w-full h-[90vh] rounded-t-2xl",
    "data-[state=open]:slide-in-from-bottom",
    
    // Tablet: 80% width right panel
    "md:w-[80%] md:h-full md:rounded-none",
    "md:data-[state=open]:slide-in-from-right",
    
    // Desktop: 50% width, min 768px
    "lg:w-[50%] lg:min-w-[768px]",
    
    // Overflow
    "overflow-y-auto p-0"
  )}
>
```

**Responsive grids:**

```typescript
// Platform comparison
<div className={cn(
  "grid gap-3",
  "grid-cols-1",        // Mobile: stack
  "sm:grid-cols-2",     // Tablet: 2 columns
  "lg:grid-cols-3"      // Desktop: 3 columns
)}>

// Core metrics
<div className={cn(
  "grid gap-4",
  "grid-cols-1",        // Mobile: stack
  "md:grid-cols-2",     // Tablet: 2 columns
  "lg:grid-cols-3"      // Desktop: 3 columns
)}>

// ROI summary
<div className={cn(
  "grid gap-3",
  "grid-cols-2",        // Mobile: 2 columns
  "md:grid-cols-4"      // Desktop: 4 columns
)}>
```

#### 5.2 Complete ARIA Implementation

**Fieldsets for grouped inputs:**

```typescript
<fieldset className="space-y-4">
  <legend className="text-base font-semibold mb-4">
    Core Metrics
  </legend>
  
  <ValidatedInput
    id="runs-per-month"
    label="Runs per Month"
    value={runsPerMonth}
    onChange={setRunsPerMonth}
    validation={roiValidationRules.runsPerMonth}
    required
  />
  
  {/* More inputs... */}
</fieldset>
```

**Live regions for dynamic updates:**

```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {roiUpdated && `ROI updated: $${netROI.toLocaleString()} per month`}
  {factorsGenerated && `AI factors generated successfully. ${positiveFactors.length} value drivers and ${negativeFactors.length} risk factors added.`}
  {validationError && `Error: ${validationError}`}
</div>
```

#### 5.3 Keyboard Navigation

**Add keyboard shortcuts:**

```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + G: Generate AI Factors
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        handlers.onGenerateFactors?.();
      }
      
      // Cmd/Ctrl + R: Generate Report
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handlers.onGenerateReport?.();
      }
      
      // Escape: Close panel
      if (e.key === 'Escape') {
        handlers.onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// Usage
useKeyboardShortcuts({
  onGenerateFactors: generateFactors,
  onGenerateReport: actions.onGenerateReport,
  onClose: () => onOpenChange(false),
});
```

**Tab order management:**

```typescript
// Ensure logical tab order
<div className="space-y-4">
  <Input id="input-1" tabIndex={1} />
  <Input id="input-2" tabIndex={2} />
  <Button tabIndex={3}>Next</Button>
</div>

// Skip links for long forms
<a
  href="#roi-summary"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50"
>
  Skip to ROI Summary
</a>
```

---

### Phase 6: Testing & Polish (Week 7)

#### 6.1 Unit Tests

**Run tests:**

```bash
npm test components/roi/__tests__/ROISettingsPanel.test.tsx
```

**Check coverage:**

```bash
npm test -- --coverage --collectCoverageFrom="components/roi/**/*.{ts,tsx}"
```

**Target coverage:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 85%
- Lines: > 80%

#### 6.2 Integration Tests

```typescript
// __tests__/integration/roi-flow.test.tsx
describe('Complete ROI Configuration Flow', () => {
  it('should complete quick setup and generate report', async () => {
    const user = userEvent.setup();
    render(<ROISettingsPanel {...defaultProps} />);
    
    // 1. Select task type
    await user.click(screen.getByRole('combobox', { name: /task type/i }));
    await user.click(screen.getByText('Client Communication'));
    
    // 2. Adjust runs
    const runsSlider = screen.getByRole('slider', { name: /runs/i });
    fireEvent.change(runsSlider, { target: { value: '1000' } });
    
    // 3. Select platform
    await user.click(screen.getByText('Zapier'));
    
    // 4. Generate factors
    await user.click(screen.getByRole('button', { name: /generate factors/i }));
    await waitFor(() => {
      expect(screen.getByText(/value drivers/i)).toBeInTheDocument();
    });
    
    // 5. Generate report
    await user.click(screen.getByRole('button', { name: /generate report/i }));
    expect(defaultProps.onGenerateReport).toHaveBeenCalled();
  });
});
```

#### 6.3 Accessibility Audit

**Run automated tests:**

```bash
npm test -- --testPathPattern="accessibility"
```

**Manual testing checklist:**

- [ ] Screen reader announces all updates
- [ ] All inputs have labels
- [ ] Error messages are announced
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are 44x44px minimum
- [ ] No keyboard traps

**Use axe DevTools:**

```typescript
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<ROISettingsPanel {...defaultProps} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 6.4 Performance Optimization

**Memoize expensive calculations:**

```typescript
const roiMetrics = useMemo(() => {
  return calculateRoiMetrics({
    platform,
    runsPerMonth,
    minutesPerRun,
    hourlyRate,
    taskMultiplier,
    // ... other params
  }, nodes);
}, [platform, runsPerMonth, minutesPerRun, hourlyRate, taskMultiplier, nodes]);
```

**Debounce rapid input changes:**

```typescript
const debouncedUpdateROI = useMemo(
  () => debounce((config: ROIConfiguration) => {
    updateScenarioROI(config);
  }, 300),
  [updateScenarioROI]
);
```

**Lazy load AI factors:**

```typescript
const AIFactorsSection = lazy(() => import('./sections/AIFactorsSection'));

{showAIFactors && (
  <Suspense fallback={<Skeleton className="h-64" />}>
    <AIFactorsSection {...props} />
  </Suspense>
)}
```

---

### Phase 7: Documentation & Handoff (Week 8)

#### 7.1 Component Documentation

Create comprehensive JSDoc:

```typescript
/**
 * ROI Settings Panel - Advanced ROI Calculator
 * 
 * A comprehensive side panel for configuring automation ROI metrics
 * with support for quick setup and advanced configuration modes.
 * 
 * @example
 * ```tsx
 * <ROISettingsPanel
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   config={roiConfig}
 *   onConfigChange={handleConfigChange}
 *   workflow={{ nodes, platform: 'zapier' }}
 *   actions={{
 *     onGenerateReport: handleGenerateReport,
 *     onSavePreset: handleSavePreset
 *   }}
 *   options={{ mode: 'quick' }}
 * />
 * ```
 * 
 * @component
 * @see {@link ROIConfiguration} for configuration options
 * @see {@link ROI_SETTINGS_PANEL_UX_ANALYSIS.md} for design decisions
 */
export function ROISettingsPanel(props: ROISettingsPanelProps) {
  // ...
}
```

#### 7.2 Storybook Stories

```typescript
// ROISettingsPanel.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ROISettingsPanel } from './ROISettingsPanel';

const meta: Meta<typeof ROISettingsPanel> = {
  title: 'Components/ROI/SettingsPanel',
  component: ROISettingsPanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ROISettingsPanel>;

export const QuickMode: Story = {
  args: {
    open: true,
    config: defaultConfig,
    workflow: { nodes: mockNodes, platform: 'zapier' },
    options: { mode: 'quick' },
  },
};

export const AdvancedMode: Story = {
  args: {
    ...QuickMode.args,
    options: { mode: 'advanced' },
  },
};

export const WithAIFactors: Story = {
  args: {
    ...QuickMode.args,
    config: {
      ...defaultConfig,
      advanced: {
        taskSpecificFactors: mockGeneratedFactors,
      },
    },
  },
};
```

#### 7.3 Migration Guide

**For developers updating existing code:**

```markdown
# Migration Guide: ROI Settings Panel v2

## Breaking Changes

### Props Interface
The component now uses grouped props instead of individual props.

**Before:**
```typescript
<ROISettingsPanel
  runsPerMonth={500}
  setRunsPerMonth={setRuns}
  minutesPerRun={5}
  setMinutesPerRun={setMinutes}
  // ... 21 more props
/>
```

**After:**
```typescript
<ROISettingsPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  config={{
    core: {
      runsPerMonth: 500,
      minutesPerRun: 5,
      // ... grouped config
    }
  }}
  onConfigChange={handleConfigChange}
  workflow={{ nodes, platform }}
  actions={{ onGenerateReport }}
/>
```

### State Management
Update your state management to use the new grouped config.

**Before:**
```typescript
const [runsPerMonth, setRunsPerMonth] = useState(500);
const [minutesPerRun, setMinutesPerRun] = useState(5);
// ... many more useState
```

**After:**
```typescript
const [config, setConfig] = useState<ROIConfiguration>({
  core: {
    runsPerMonth: 500,
    minutesPerRun: 5,
    // ... grouped state
  }
});

const handleConfigChange = (partial: Partial<ROIConfiguration>) => {
  setConfig(prev => deepMerge(prev, partial));
};
```

## New Features

### Quick Setup Mode
Users can now quickly configure ROI settings with a simplified 3-step wizard.

### Input Validation
All inputs now have real-time validation with helpful error/warning messages.

### Keyboard Shortcuts
- `Cmd/Ctrl + G`: Generate AI factors
- `Cmd/Ctrl + R`: Generate report
- `Esc`: Close panel

### Preset System
Users can save and load configuration presets.

## Upgrade Steps

1. Update props interface
2. Migrate state management
3. Update parent component handlers
4. Test accessibility
5. Update tests
6. Deploy
```

---

## Testing Checklist

Use this checklist before marking implementation complete:

### Functionality
- [ ] Quick mode displays all 3 steps
- [ ] Advanced mode shows all sections
- [ ] Mode toggle works
- [ ] Task type selection auto-fills values
- [ ] All inputs update state correctly
- [ ] Sliders sync with inputs
- [ ] Platform comparison shows correct costs
- [ ] AI factor generation works
- [ ] Factors can be locked/unlocked
- [ ] ROI summary updates in real-time
- [ ] Generate report button works
- [ ] Preset save/load works

### Validation
- [ ] All inputs validate on blur
- [ ] Error messages display correctly
- [ ] Warning messages display correctly
- [ ] Invalid inputs prevent progression
- [ ] Realistic ranges are shown

### Accessibility
- [ ] All inputs have labels
- [ ] ARIA attributes present
- [ ] Keyboard navigation works
- [ ] Screen reader announces updates
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are 44x44px
- [ ] No keyboard traps

### Responsive
- [ ] Works on mobile (< 640px)
- [ ] Works on tablet (640-1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Touch interactions work
- [ ] Gestures work (swipe to close)

### Performance
- [ ] No unnecessary re-renders
- [ ] Calculations are debounced
- [ ] Large components lazy loaded
- [ ] Memory leaks fixed

### Visual
- [ ] Colors match design system
- [ ] Typography consistent
- [ ] Spacing consistent
- [ ] Animations smooth
- [ ] Dark mode works

---

## Support & Resources

### Documentation
- Full analysis: `ROI_SETTINGS_PANEL_UX_ANALYSIS.md`
- Test examples: `__tests__/ROISettingsPanel.test.tsx`
- Example components: `improved/` directory

### Getting Help
- Design questions: Check Figma designs
- Technical questions: Review implementation examples
- Accessibility: Run axe DevTools audit

### Useful Commands

```bash
# Run tests
npm test components/roi

# Run tests with coverage
npm test -- --coverage components/roi

# Run accessibility tests
npm test -- --testPathPattern="accessibility"

# Start Storybook
npm run storybook

# Lint
npm run lint components/roi

# Type check
npx tsc --noEmit
```

---

## Success Criteria

Implementation is complete when:

1. ✅ All 25 unit tests pass
2. ✅ Code coverage > 80%
3. ✅ Accessibility audit passes (0 violations)
4. ✅ All responsive breakpoints work
5. ✅ Performance metrics meet targets
6. ✅ Documentation complete
7. ✅ User testing feedback positive
8. ✅ Stakeholder approval obtained

---

**Last Updated:** October 5, 2025  
**Version:** 1.0
