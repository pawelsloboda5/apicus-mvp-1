## 1 Initial Canvas Scaffold  (1 hr)
- [x] Create `/build` route (client component) wrapped in `<ReactFlowProvider>`.
- [x] Add full-screen container with neutral retro grid background.
- [x] Implement **Platform Switcher** (Zapier / Make / n8n) – minimal `SegmentControl` in header storing choice in Dexie `scenario.platform`.
- [x] Persist viewport & platform to Dexie on change.

## 2 Node & Edge Schema  (1 hr)
- [x] Extend `FlowNode` & `FlowEdge` types in `lib/db.ts` to include `type`, `label`, `platformMeta`.
- [x] Migration path ⇒ bump Dexie version to 2 (and 3) with upgrade logic.

## 3 Custom Node Components  (2 hrs)
- [x] Base **PixelNode**: 16×16 icon + label, neutral colors.
- [ ] **DecisionNode** (branch/filter) with two output handles.
- [ ] **TriggerNode** & **ActionNode** colour-coded subtly via CSS vars.
- [x] Parameter side-panel stub (slide-in `<Sheet>` powered by shadcn) that shows selected node props; writes edits back to Dexie.

## 4 Drag & Drop + Interaction  (1.5 hrs)
- [ ] Enable dnd-kit import from **Toolbox** sidebar → canvas (copy behaviour).
- [ ] Constrain drag to 8 px grid (`createSnapModifier(8)`).
- [ ] Connection validation: prevent cycles & duplicate edges; enforce one inbound on Trigger.
- [ ] Zoom / pan controls via `<Controls />`; add custom "Fit" button.

## 11 HUD & ROI Controls  (new)
- [x] RPG-style Platform Stats HUD in header (quota & cost auto-switch).
- [ ] ROI Settings Sheet with editable runs/month, wage, task multiplier, live calculations. 