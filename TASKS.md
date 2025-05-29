# Apicus MVP Task List

This document outlines the tasks required to complete the Apicus MVP project. Tasks are grouped by feature and technology.

## Floating Node Selector Feature 4-6hrs ⭐ COMPLETED ✅

### Phase 1: Core UI Components (2hrs) ✅ COMPLETED
- [x] **FloatingNodeSelector Component**: Create new component that follows cursor position
  - [x] Create `components/flow/FloatingNodeSelector.tsx`
  - [x] Position component relative to cursor with 8px offset to bottom-right
  - [x] Handle cursor tracking with `onMouseMove` event on ReactFlow pane
  - [x] Ensure selector only shows when cursor is over canvas (not UI elements)
  - [x] Add smooth transitions for position updates (GPU acceleration)

- [x] **Node Type Icons**: Design and implement icons for each node type
  - [x] Use existing icons from Toolbox: `Play` (Trigger), `Zap` (Action), `GitBranch` (Decision)
  - [x] Size: 16x16px with minimal grey/silver aesthetic
  - [x] Only show currently selected type (minimal design)
  - [x] Add scroll indicators (up/down chevrons) - Removed per design change
  - [x] Implement clean, minimal container layout

- [x] **Visual Indicator**: Show which node type is currently selected
  - [x] Highlight selected icon with grey styling
  - [x] Display node type name in small tooltip below icons - Removed per minimal design
  - [x] Hide selector when cursor leaves canvas area
  - [x] Show keyboard shortcut hints in tooltip - Deferred to Phase 4

### Phase 2: Toolbox Integration (1hr) ✅ COMPLETED
- [x] **Toolbox State Management**: Track selected node type based on user interaction
  - [x] Add `selectedNodeType` and `onNodeTypeSelect` props to Toolbox components
  - [x] Update ToolboxItem to handle click and drag selection
  - [x] Add visual highlighting to selected Toolbox item
  - [x] Persist selection state in parent component
  - [x] Show selection indicator dot on active Toolbox item

- [x] **FlowCanvas Integration**: Connect Toolbox selection to FloatingNodeSelector
  - [x] Accept `selectedNodeType` prop in FlowCanvas
  - [x] Pass selected type to FloatingNodeSelector
  - [x] Remove mouse wheel functionality (conflicts with zoom)
  - [x] Use Toolbox selection as source of truth for node type

### Phase 3: Enhanced Node Creation (1hr) ✅ COMPLETED
- [x] **Dynamic Node Creation**: Use selected type from Toolbox for double-click spawning
  - [x] Replace hardcoded `type: 'action'` with `selectedNodeType`
  - [x] Update node labeling: `Trigger 1`, `Action 1`, `Decision 1`, etc.
  - [x] Add appropriate default data for each node type:
    - Trigger: `{ label: 'Trigger X', typeOf: 'webhook' }`
    - Action: `{ label: 'Action X', appName: 'New Action', action: 'configure' }`
    - Decision: `{ label: 'Decision X', conditionType: 'value', operator: 'equals' }`

- [x] **Visual Feedback**: Enhance interaction experience
  - [x] Node spawns exactly at cursor position (fixed positioning)
  - [x] Uses optimistic updates for instant feedback
  - [x] Properly integrates with React 19's startTransition
  - [x] FloatingNodeSelector follows cursor smoothly
  - [x] Fixed cursor following during canvas panning operations

### Phase 4: Polish & Edge Cases (1-2hrs)
- [ ] **Responsive Behavior**: Handle different screen sizes and zoom levels
  - [ ] Adjust icon size and positioning for mobile devices
  - [ ] Ensure selector works correctly with ReactFlow zoom/pan
  - [ ] Test with different browser zoom levels
  - [ ] Hide selector on very small screens (< 640px width)

- [x] **Edge Case Handling**: Robust cursor tracking and state management
  - [x] Hide selector when cursor over UI elements (automatically handled)
  - [x] Handle cursor leaving window/canvas area gracefully
  - [x] Don't show selector during mobile usage
  - [x] Ensure selection persists across interactions

- [ ] **Keyboard Shortcuts**: Alternative selection method
  - [ ] `T` key for Trigger, `A` key for Action, `D` key for Decision
  - [ ] Show keyboard hints in selector tooltip
  - [ ] Ensure shortcuts work when canvas has focus
  - [ ] Visual feedback when using keyboard shortcuts

- [x] **Performance Optimization**: Ensure smooth cursor following
  - [x] Use CSS transforms instead of position updates
  - [x] Optimize re-renders with proper state management
  - [x] Test performance with 50+ nodes on canvas
  - [x] GPU acceleration for smooth movement

### Phase 5: Testing & Documentation (30mins)
- [ ] **Integration Testing**: Verify all interactions work correctly
  - [x] Test double-click with all node types
  - [x] Verify Toolbox selection updates FloatingNodeSelector
  - [x] Test cursor following accuracy
  - [x] Ensure no conflicts with existing drag/drop

- [ ] **User Experience Testing**: Validate intuitive usage
  - [ ] Test with users unfamiliar with the feature
  - [ ] Ensure discoverability (Toolbox visual cues are clear)
  - [ ] Verify icons are clearly distinguishable
  - [ ] Check accessibility considerations

- [ ] **Documentation Updates**:
  - [ ] Add feature description to README.md
  - [ ] Update FlowCanvas component documentation
  - [ ] Document Toolbox selection system
  - [ ] Add animated GIF demo for documentation

### Technical Implementation Notes:
```typescript
// Updated approach - no mouse wheel, Toolbox-driven selection
interface ToolboxProps {
  selectedNodeType?: NodeType;
  onNodeTypeSelect?: (type: NodeType) => void;
}

interface FlowCanvasProps {
  selectedNodeType?: NodeType;
  onNodeTypeChange?: (type: NodeType) => void;
}

// Parent component manages selection state
const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('action');
```

### Success Criteria:
- ✅ Icons follow cursor smoothly at 8px offset to bottom-right
- ✅ Toolbox visual highlighting shows current selection
- ✅ Double-click spawns correct node type at cursor position
- ✅ Selector hides appropriately when not over canvas
- ✅ Performance remains smooth with 50+ nodes
- ✅ Works on both desktop and tablet devices
- ✅ Intuitive selection via Toolbox interaction
- ✅ No conflicts with mouse wheel zoom functionality

---

## General Setup 1-2hrs
- [x] Verify and finalize project dependencies and versions
- [x] Configure Tailwind CSS and shadcn/ui properly
- [x] Create a landing page for the homepage 
- [x] Set up Dexie.js for IndexedDB storage (initial schema + helper hooks)
- [x] Configure Responses OpenAI API integration securely via Next.js API routes (edge runtime, `/api/openai`)

## AI-Powered ROI Questionnaire 2-3hrs
- [ ] Design conversational UI using shadcn/ui components
- [ ] Implement dynamic question flow logic
- [ ] Integrate Responses OpenAI for smart defaults and estimations
- [ ] Validate and sanitize user inputs

## Visual Workflow Builder Canvas 2-3hrs
- [x] Set up React Flow v12 with Next.js 15
- [x] Create custom pixel-art/minimalistic styled nodes
- [x] Implement drag-and-drop functionality using dndKit
- [x] Add zoom, pan, and viewport controls
- [x] Implement undo/redo functionality (Basic via Dexie backups and scenario loading)
- [x] Enable JSON export/import and local storage persistence via Dexie.js (scenarios, nodes, edges, viewport)
- [x] Implement connection validation logic

## Node Properties & ROI Integration 2-3hrs
- [x] Type Visualization: Color-code nodes by type (trigger/action/decision) with appropriate icons
- [x] Step Details: Show app name, action type, and position in workflow
- [x] ROI Contribution: Display how each node contributes to overall ROI
- [ ] App Icon Integration: Display app icons from template data (GitHub, Zapier, etc.)
- [x] Step-Specific ROI Impact: Calculate time saved per step based on typical times
- [ ] Interactive Documentation: Links to app documentation or examples
- [x] Step Dependencies: Visualization of data flow between steps (via edges)

## ROI Settings Enhancement 2-3hrs
- [x] Guided Input Experience: Add tooltips/descriptions for each ROI parameter
- [x] Visual Sliders: Convert numeric inputs to sliders with visual feedback
- [x] Benchmarks: Show industry averages for each value (typical rates, times)
- [x] Real-time Calculation Updates: Show how changing values affects overall ROI
- [x] Task Type Selector: Dropdown to select task type that auto-adjusts V* multiplier
- [x] Risk/Compliance Section: Expandable section for R value with toggles
- [x] Revenue Impact Section: Fields for leads, conversion rate, and value
- [x] Scenario Comparison: Save multiple ROI scenarios to compare different assumptions (via Toolbox and Dexie saves)

## Code Organization 1-2hrs
- [x] Extract StatsBar component
- [x] Extract PlatformSwitcher component  
- [x] Extract NodePropertiesPanel component
- [x] Extract ROISettingsPanel component
- [x] Extract FlowCanvas component
- [x] Extract AlternativeTemplatesSheet component
- [x] Implement proper TypeScript interfaces for all components
- [x] Refactor handleAddNode function to a utility file
- [x] Move ROI calculation logic to separate utility functions
- [x] Enhanced "My Scenarios" in Toolbox: Implemented editable titles, add/delete functionality, robust loading, and filtering for untitled scenarios.
- [x] Clean up debugging code and console.log statements from drag-and-drop implementation
- [ ] Create comprehensive end-to-end test suite
- [ ] Add error handling for edge cases (missing data, etc.)

## ROI Stats Bar Improvements 1-2hrs
- [x] Visual ROI Breakdown: Graphical representation of ROI components (Basic display in StatsBar and ROISettingsPanel)
- [x] Platform Comparison: Show side-by-side ROI for different platforms (User can switch platforms)
- [ ] Time Period Toggle: Switch between monthly, quarterly, and annual calculations
- [ ] Save/Export Options: Quick buttons to save or share ROI results
- [ ] Payback Period Visualization: Timeline showing when automation pays for itself
- [x] Cost Breakdown: Detailed view of automation costs by component (Platform cost in StatsBar)
- [x] Interactive What-If Scenarios: Quick toggles for scenario testing (Via ROI Settings Panel and alternative templates)

## Modular ROI Dashboard 2-3hrs
- [ ] Design modular dashboard layout inspired by Notion
- [ ] Develop customizable widgets for ROI metrics
- [ ] Integrate AI-driven insights and scenario analysis
- [ ] Implement drag-and-drop or toggle-based module arrangement
- [ ] Ensure state persistence across sessions

## Data Mining 1-2hrs
        - Jake is finding overlapping apps
- [ ] Basic app info for apps that are in make,n8n and zapier. (check current DB for apps to cross-reference)
- [ ] Find price formulas for make, n8n and zapier.

## Automation Template Collection & Semantic Search 2-3hrs
- [x] Design and document `AutomationTemplate` schema (`backend/automationTemplateSchema.ts`).
- [x] Build migration script (`migrateTemplates.ts`) for legacy Zapier templates.
- [x] Enrich templates with React-Flow nodes/edges (`enrichTemplatesWithFlow.ts`).
- [x] Generate OpenAI embeddings (`embedTemplateEmbeddings.ts`).
- [x] Create vector index (`createVectorIndex.ts`) using `cosmosSearchOptions` (IVF, 1536 dims).
- [x] API route `/api/templates/search` – embeds query & returns best template + alternatives.
- [x] Landing page wired to API; redirects to Build canvas with `tid` and `q` params.
- [x] Build canvas loads `tid` param and renders imported template, fetches alternatives based on `q`.

## Landing Page Revamp 1hr
- [x] Add natural-language query textbox and "Find Template" CTA to hero section.
- [x] Style improvements and mobile polish after integration is functional.

## Testing and Quality Assurance 1-5hrs
- [ ] Write unit tests for critical components and logic
- [ ] Perform integration testing for AI and Dexie.js interactions
- [ ] Conduct usability testing for UI/UX improvements
- [ ] Optimize performance for moderate-scale workflows (<100 nodes)

## Documentation
- [x] Update `README.md` regularly with setup and usage instructions
- [x] Maintain detailed documentation for each feature in `/docs`
- [x] Document API endpoints and data structures clearly

## Deployment 30-60mins
- [ ] Configure deployment settings (e.g., Vercel)
- [ ] Set up environment variables securely
- [ ] Deploy initial MVP version
- [ ] Monitor and log application performance and errors

## Post-MVP Considerations
- [ ] Plan for backend integration for multi-device support
- [ ] Explore advanced AI features (e.g., natural language scenario analysis)
- [ ] Consider user authentication and data security enhancements

## Build Page UI/UX Revamp (Detailed in `docs/tasks-ui-build-page.md`)

- **Phase 1: Core UI Enhancements & Responsiveness**
  - [x] `StatsBar` Revamp: Interactive `runsPerMonth`, responsive states (Desktop, Tablet, Mobile), minimalist design, accurate platform cost display.
  - [x] Build Page Header Responsiveness: Implement "More Actions" dropdown for `PlatformSwitcher`, ROI Settings, Group/Ungroup, and `+Node` button on smaller screens.
- **Phase 2: Alternative Templates Bottom Sheet & Workflow Management**
  - [x] API Enhancement: Modify `/api/templates/search` to return primary + 5 alternative templates with full node/edge data.
  - [x] Client-Side Data Handling: Store and manage alternative templates in Dexie (via scenario object and state).
  - [x] `AlternativeTemplatesSheet` UI: Develop new bottom sheet component to display alternatives, with activation handle and "Find New Alternatives" button.
  - [x] Workflow Saving: Implement implicit saving of current canvas state to Dexie before loading new templates/scenarios.
  - [x] `Toolbox` Integration: Add "My Scenarios" section to `Toolbox` to list and load saved scenarios. UI cues for platform.
  - [x] Interaction Flow: Define and implement user flow for selecting an alternative template (save current, load alternative, add both to toolbox).
- **Phase 3: Database & Documentation**
  - [x] Database Indexing: Ensure necessary vector and standard indexes on `apicus-templates` MongoDB collection.
  - [x] Documentation: Keep `docs/tasks-ui-build-page.md` updated. Add code comments.

## Email Generation Feature (New)
- [ ] Design UI for email generation button and preview modal in `StatsBar.tsx` and `FlowCanvas.tsx`.
- [ ] Create `EmailTemplate.tsx` component for rendering and generating HTML email.
- [ ] Implement OpenAI API call to populate email content based on ROI data and scenario.
- [ ] Allow user to edit sections of the email using predefined prompts and AI assistance.
- [ ] Add functionality to copy HTML and download email template.
- [ ] Document email generation feature in `README.md` and relevant task files.

## React 19 & Next.js 15 Performance Optimization (NEW PRIORITY) 4-6hrs

### React 19 Integration
- [ ] Update to React 19 stable release (currently on RC)
- [ ] Enable React Compiler in `next.config.ts` with `experimental.reactCompiler`
- [ ] Install and configure `babel-plugin-react-compiler`
- [ ] Audit and remove unnecessary `useMemo`, `useCallback`, and `React.memo` usage
- [ ] Replace `useContext` with new `use()` hook where applicable
- [ ] Implement `useOptimistic` for instant UI updates in:
  - [ ] Node creation/deletion operations
  - [ ] Scenario saving feedback
  - [ ] Template loading states
- [ ] Update form handling with new Actions API and `useActionState`
- [ ] Implement `useFormStatus` for better form state management
- [ ] Leverage improved hydration error debugging
- [ ] Update component refs to use new prop syntax (remove `forwardRef`)

### React 19 Performance Quick Wins ✨
- [x] **Remove `useCallback` from FlowCanvas.tsx** - React Compiler handles this automatically
- [ ] **Remove all `React.memo()` wrappers** - No longer needed with React Compiler
- [ ] **Delete unnecessary `useCallback` in event handlers** throughout codebase
- [ ] **Add `export const experimental_ppr = true`** to `/build` page for Partial Prerendering
- [ ] **Wrap heavy components in `<Suspense>` boundaries**:
  - [ ] FlowCanvas component
  - [ ] ROISettingsPanel component
  - [ ] Toolbox component
  - [ ] AlternativeTemplatesSheet component
- [ ] **Implement `useOptimistic` for instant feedback**:
  - [x] Edge creation in FlowCanvas (basic implementation)
  - [ ] Node creation/deletion
  - [ ] Scenario saving
  - [ ] ROI settings updates
- [ ] **Use new `use()` hook for data fetching**:
  - [ ] Template fetching
  - [ ] Scenario loading
  - [ ] Alternative templates loading
- [ ] **Convert forms to Server Actions**:
  - [ ] ROI settings form
  - [ ] Email generation form
  - [ ] Scenario management
- [ ] **Add streaming SSR with Suspense**:
  - [ ] Build page initial load
  - [ ] Template search results
  - [ ] ROI calculations

### Next.js 15 Performance Features
- [ ] Implement Partial Prerendering (PPR):
  - [ ] Add `experimental.ppr: 'incremental'` to config
  - [ ] Identify static vs dynamic components in workflow builder
  - [ ] Wrap dynamic components with Suspense boundaries
  - [ ] Add `export const experimental_ppr = true` to optimized pages
- [ ] Configure `unstable_after` API:
  - [ ] Move analytics tracking to post-response
  - [ ] Defer non-critical logging operations
  - [ ] Implement background template caching
- [ ] Optimize caching strategy:
  - [ ] Review and update fetch caching (now uncached by default)
  - [ ] Configure `staleTimes` for client router cache
  - [ ] Implement explicit caching for static data
- [ ] Bundle optimization:
  - [ ] Configure `bundlePagesRouterDependencies`
  - [ ] Set up `serverExternalPackages` for excluded packages
  - [ ] Analyze bundle size with new optimizations

### Performance Monitoring & Testing
- [ ] Set up performance monitoring:
  - [ ] Implement Web Vitals tracking
  - [ ] Add performance marks for key operations
  - [ ] Monitor React Compiler optimization impact
- [ ] Performance testing:
  - [ ] Run Lighthouse audits before/after optimizations
  - [ ] Test with React DevTools Profiler
  - [ ] Verify PPR performance gains
- [ ] Create performance dashboard:
  - [ ] Track key metrics (FCP, LCP, TTI, CLS)
  - [ ] Monitor bundle size changes
  - [ ] Log build/compile time improvements

### Migration & Compatibility
- [ ] Update dependencies for React 19 compatibility
- [ ] Test third-party library compatibility
- [ ] Update TypeScript types for React 19
- [ ] Document breaking changes and migration steps
- [ ] Create rollback plan if issues arise

### Documentation
- [ ] Update README with performance features
- [ ] Document React Compiler configuration
- [ ] Create performance optimization guide
- [ ] Add troubleshooting section for common issues
- [ ] Update contributing guidelines with performance best practices