# NodePropertiesPanel Refactor Plan

**Goal**: Migrate from monolithic `NodePropertiesPanel.tsx` (1,110 lines) to modular `NodePropertiesPanel/` directory structure

## Current State Analysis

### Monolithic Implementation (`components/flow/NodePropertiesPanel.tsx`)
- **1,110 lines** - violates 200-300 line rule
- **Used by**: `app/build/page.tsx` (line 40)
- **Contains**:
  - Hardcoded EMAIL_CONTEXT_TEMPLATES (lines 38-147)
  - Inline decision logic for all node types
  - Tabs for configuration vs pricing (lines 246-256)
  - Embedded ROI calculations (lines 671-873)
  - All node-specific UI logic in one file

### Modular Implementation (`components/flow/panels/NodePropertiesPanel/`)
- **Used by**: `app/build/components/BuildPageContent.tsx` (line 44)
- **Structure**:
  - `index.tsx` (341 lines) - Main coordinator
  - `TriggerNodePanel.tsx` (164 lines)
  - `ActionNodePanel.tsx` (233 lines) 
  - `DecisionNodePanel.tsx` (150 lines)
  - `EmailContextNodePanel.tsx` (447 lines)
  - `DefaultNodePanel.tsx` (113 lines)

## Migration Strategy

### Phase 1: Feature Parity Analysis ✅
- [x] Identify all features in monolithic version
- [x] Compare with modular version capabilities
- [x] Document missing features and differences

### Phase 2: Feature Migration
- [ ] **Pricing Tab Functionality**
  - Monolithic has full pricing tab with app details (lines 876-1091)
  - Modular version lacks this - needs implementation
  
- [ ] **Email Context Templates**
  - Monolithic has hardcoded templates (lines 38-147)
  - Move to shared constants or external config
  
- [ ] **ROI Calculations**
  - Monolithic has detailed ROI display (lines 671-873)
  - Modular has basic ROI in index.tsx (lines 183-321)
  - Need to enhance modular ROI section

- [ ] **Node Width Recalculation**
  - Monolithic has `recalculateNodeWidth` function (lines 188-212)
  - Modular panels may need this functionality

### Phase 3: Update Imports
- [ ] Update `app/build/page.tsx` to use modular version
- [ ] Search for any other files importing monolithic version
- [ ] Ensure all components use consistent import path

### Phase 4: Testing & Validation
- [ ] Test all node types (trigger, action, decision, email context)
- [ ] Verify ROI calculations work correctly
- [ ] Test pricing tab functionality
- [ ] Validate delete functionality
- [ ] Test email context node configurations

### Phase 5: Cleanup
- [ ] Remove monolithic `NodePropertiesPanel.tsx`
- [ ] Update any documentation references
- [ ] Clean up unused imports

## Technical Considerations

### Shared Dependencies (lib/)
Both implementations use:
- `NodePropertiesPanelProps` from `lib/types.ts`
- `NodeData` interface from `lib/types.ts`
- ROI utilities from `lib/roi-utils.ts`
- Constants from `lib/utils/constants.ts`
- Pricing data from `app/api/data/pricing.ts`

### Architecture Benefits of Modular Approach
1. **Single Responsibility**: Each panel handles one node type
2. **File Size**: All files under 450 lines (target <300)
3. **Maintainability**: Easier to find and modify specific node logic
4. **Extensibility**: Easy to add new node types
5. **Code Organization**: Related functionality grouped together

## Risk Assessment

### Low Risk
- Basic node configuration (label, app details)
- Delete functionality
- Node type switching

### Medium Risk  
- ROI calculations (complex logic)
- Email context templates (large template definitions)

### High Risk
- Pricing tab functionality (complex pricing logic)
- Node width recalculation (visual layout impacts)

## Success Criteria

1. All node types work identically to monolithic version
2. No regression in functionality
3. All files under 300 lines
4. Clean, maintainable code structure
5. Single import path used consistently
6. Zero duplicate code between implementations

## Timeline

**Estimated**: 4-6 hours
- Phase 1: Complete ✅
- Phase 2: 2-3 hours (feature migration)
- Phase 3: 30 minutes (update imports)
- Phase 4: 1-2 hours (testing)
- Phase 5: 30 minutes (cleanup)