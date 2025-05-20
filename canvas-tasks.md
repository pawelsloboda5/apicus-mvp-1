# Visual Workflow Builder Canvas – Detailed Task Breakdown

This document enumerates every sub-task required to ship the first-pass Visual Workflow Builder.  Each item is written so that it can be checked off independently in Git commits / PR titles.

---
## 0 Tech & Architectural Decisions  (½ hr)
- [ ] Confirm React Flow v12 + `@xyflow/react` licences & bundle size are acceptable.
- [ ] Decide OCR stack for screenshot import → **Tesseract.js** proof-of-concept, or serverless Vision API stub (design for swap-out).
- [ ] Agree on neutral light/dark pixel-art palette (design tokens already in `globals.css`).
- [ ] (Nice-to-have) Offload OpenCV + Tesseract processing to a dedicated Web Worker so the UI thread stays responsive.

---
## 1 Initial Canvas Scaffold  (1 hr)
- [ ] Create `/build` route (client component) wrapped in `<ReactFlowProvider>`.
- [ ] Add full-screen container with neutral retro grid background.
- [ ] Implement **Platform Switcher** (Zapier / Make / n8n) – minimal `SegmentControl` in header storing choice in Dexie `scenario.platform`.
- [x] Persist viewport & platform to Dexie on change.

---
## 2 Node & Edge Schema  (1 hr)
- [ ] Extend `FlowNode` & `FlowEdge` types in `lib/db.ts` to include `type`, `label`, `platformMeta`.
- [ ] Migration path ⇒ bump Dexie version to 2 with upgrade logic.

---
## 3 Custom Node Components  (2 hrs)
- [ ] Base **PixelNode**: 16×16 icon + label, neutral colors.
- [ ] **DecisionNode** (branch/filter) with two output handles.
- [ ] **TriggerNode** & **ActionNode** colour-coded subtly via CSS vars.
- [x] Parameter side-panel stub (slide-in `<Sheet>` powered by shadcn) that shows selected node props; writes edits back to Dexie.
### In progress
- [x] Base **PixelNode** component implementation & registration (icons & strict typing lint fix pending)
- [x] Selected-node `<Sheet>` parameter panel
- [ ] Colour variants (trigger/action/decision)
- [ ] DecisionNode with dual output handles

---
## 4 Drag & Drop + Interaction  (1.5 hrs)
- [ ] Enable dnd-kit import from **Toolbox** sidebar → canvas (copy behaviour).
- [ ] Constrain drag to 8 px grid (`createSnapModifier(8)`).
- [ ] Connection validation: prevent cycles & duplicate edges; enforce one inbound on Trigger.
- [ ] Zoom / pan controls via `<Controls />`; add custom "Fit" button.

---
## 5 Live Task/Op/Exec Estimator  (1 hr)
- [ ] Derive **tasks per run** heuristics per node type (config file).
- [ ] Compute estimated cost on every `nodes/edges` change using `pricing.ts` helper and selected platform.
- [ ] Toast / banner displaying "≈ $12.34 / month at 1 000 runs".

---
## 6 Screenshot → Flow OCR  (Spike 2 hrs)
- [ ] Drag-or-upload PNG ⇒ canvas drop-zone.
- [ ] Feed image to Tesseract.js, extract text blocks.
- [ ] Heuristic parser maps *"Gmail – Send Email"* strings to toolbox node IDs.
- [ ] Auto-layout imported nodes linearly; highlight areas needing manual fix.
- [ ] Flag if confidence < 60 % and show fallback "Couldn't parse – build manually".

---
## 7 Persistence & Auto-Save  (0.5 hr)
- [ ] Subscribe to `onNodesChange`, `onEdgesChange` → throttle → Dexie `nodes` / `edges` tables.
- [ ] Store `updatedAt` on every write for future sync.

---
## 8 Platform Colour Accent  (0.5 hr)
- [ ] On platform switch, set CSS class on `<body>`: `.zapier`, `.make`, `.n8n`.
- [ ] Map classes to accent vars (`--primary`, `--platform-ring`).

---
## 9 Quality & Polish  (1 hr)
- [ ] Keyboard accessibility (arrow move selected node, Delete key removes).
- [ ] Basic unit tests: Dexie write/read; cost estimator.
- [ ] Storybook stories for PixelNode variants.

---
## 10 Deferred (Post-MVP)  
- Undo/Redo stack (React Flow Pro or custom snapshots).
- Mini-map / overview panel.
- Real API import (Zapier/N8n JSON).

---
*Est. total ⏲️ ≈ 10-12 dev hours.* 