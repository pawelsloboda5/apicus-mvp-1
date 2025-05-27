# Visual Workflow Builder Canvas – Detailed Task Breakdown

This document enumerates every sub-task required to ship the first-pass Visual Workflow Builder.  Each item is written so that it can be checked off independently in Git commits / PR titles.

---
## 0 Tech & Architectural Decisions  (½ hr)
- [x] Confirm React Flow v12 + `@xyflow/react` licences & bundle size are acceptable.
- [ ] Decide OCR stack for screenshot import → **Tesseract.js** proof-of-concept, or serverless Vision API stub (design for swap-out).
- [x] Agree on neutral light/dark pixel-art palette (design tokens already in `globals.css`).
- [ ] (Nice-to-have) Offload OpenCV + Tesseract processing to a dedicated Web Worker so the UI thread stays responsive.

---
## 1 Initial Canvas Scaffold  (1 hr)
- [x] Create `/build` route (client component) wrapped in `<ReactFlowProvider>`.
- [x] Add full-screen container with neutral retro grid background.
- [x] Implement **Platform Switcher** (Zapier / Make / n8n) – minimal `SegmentControl` in header storing choice in Dexie `scenario.platform`.
- [x] Persist viewport & platform to Dexie on change.
- [x] Enable JSON export/import and local storage persistence via Dexie.js (template import implemented via `tid` param, scenarios, nodes, edges, viewport).

---
## 2 Node & Edge Schema  (1 hr)
- [x] Extend `FlowNode` & `FlowEdge` types in `lib/db.ts` to include `type`, `label`, `platformMeta`.
- [x] Migration path ⇒ bump Dexie version to 2 with upgrade logic. (Multiple versions up to 5 now)

---
## 3 Custom Node Components  (2 hrs)
- [x] Base **PixelNode**: 16×16 icon + label, neutral colors.
- [x] **DecisionNode** (branch/filter) with two output handles. (Implemented via PixelNode handles)
- [x] **TriggerNode** & **ActionNode** colour-coded subtly via CSS vars.
- [x] Parameter side-panel stub (slide-in `<Sheet>` powered by shadcn) that shows selected node props; writes edits back to Dexie.
- [x] GroupNode for grouping multiple nodes.
### Completed
- [x] Base **PixelNode** component implementation & registration.
- [x] Selected-node `<Sheet>` parameter panel (`NodePropertiesPanel`).
- [x] Group Properties Panel (`GroupPropertiesPanel`).
- [x] Colour variants (trigger/action/decision).
- [x] DecisionNode with dual output handles (Implemented via PixelNode handles).

---
## 4 Drag & Drop + Interaction  (1.5 hrs)
- [x] Enable dnd-kit import from **Toolbox** sidebar → canvas (copy behaviour).
- [x] Constrain drag to 8 px grid (`createSnapModifier(8)`).
- [x] Connection validation: prevent cycles & duplicate edges; enforce one inbound on Trigger.
- [x] Zoom / pan controls via `<Controls />`; add custom "Fit" button.
- [x] Multi-select nodes with Shift key.
- [x] Group/Ungroup selected nodes.

---
## 5 Live Task/Op/Exec Estimator  (1 hr)
- [x] Derive **tasks per run** heuristics per node type (config file).
- [x] Compute estimated cost on every `nodes/edges` change using `pricing.ts` helper and selected platform.
- [x] Toast / banner displaying "≈ $12.34 / month at 1 000 runs". (Implemented in `StatsBar`)

---
## 6 Screenshot → Flow OCR  (Spike 2 hrs)
- [ ] Drag-or-upload PNG ⇒ canvas drop-zone.
- [ ] Feed image to Tesseract.js, extract text blocks.
- [ ] Heuristic parser maps *"Gmail – Send Email"* strings to toolbox node IDs.
- [ ] Auto-layout imported nodes linearly; highlight areas needing manual fix.
- [ ] Flag if confidence < 60 % and show fallback "Couldn't parse – build manually".

---
## 7 Persistence & Auto-Save  (0.5 hr)
- [x] Subscribe to `onNodesChange`, `onEdgesChange` → throttle → Dexie `nodesSnapshot` / `edgesSnapshot` in `scenario` table.
- [x] Store `updatedAt` on every write for future sync.
- [x] Implicit save of current workflow to Dexie before loading alternatives or new scenarios.
- [x] Load scenarios from Dexie via Toolbox.

---
## 8 Platform Colour Accent  (0.5 hr)
- [x] On platform switch, set CSS class on `<body>`: `.zapier`, `.make`, `.n8n`.
- [x] Map classes to accent vars (`--primary`, `--platform-ring`).

---
## 9 Code Modularization (1 hr)
- [x] Extract core canvas functionality into dedicated `FlowCanvas` component
- [x] Extract `NodePropertiesPanel` component for node editing
- [x] Extract `StatsBar` component for ROI statistics display
- [x] Extract `PlatformSwitcher` component for platform selection
- [x] Extract `ROISettingsPanel` component for ROI configuration
- [x] Extract `Toolbox` component.
- [x] Extract `AlternativeTemplatesSheet` component.
- [x] Create types directory with shared interfaces (`lib/types.ts` and `lib/types/index.ts` - needs consolidation).
- [x] Move utility functions (like node creation, ROI calcs) to utils folder (`lib/flow-utils.ts`, `lib/roi-utils.ts`).
- [x] Split ROI calculation logic into separate utility functions (`lib/roi-utils.ts`).
- [x] Improve TypeScript type safety across all components (Ongoing, fixed specific errors).

---
## 10 Quality & Polish  (1 hr)
- [x] Keyboard accessibility (arrow move selected node, Delete key removes). (Basic React Flow a11y)
- [ ] Basic unit tests: Dexie write/read; cost estimator.
- [ ] Storybook stories for PixelNode variants.
- [x] Error handling for edge cases (missing data, API failures, etc.) (Basic error handling in place, can be improved).
- [x] Visual feedback during async operations (loading states for templates and scenarios).

---
## 11 Deferred (Post-MVP)  
- Undo/Redo stack (React Flow Pro or custom snapshots).
- Mini-map / overview panel.
- Real API import (Zapier/N8n JSON).
- Advanced node search and filtering.
- Export workflow as image or PDF.

---
*Est. total ⏲️ ≈ 10-12 dev hours.* 