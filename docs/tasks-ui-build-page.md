# Build Page UI/UX Revamp Plan

## 1. Overview

This document outlines the plan to significantly enhance the User Interface (UI) and User Experience (UX) of the Apicus application's build page (`/build`). The primary goals are to:

*   Make the `StatsBar` more interactive, responsive, and visually clear, especially regarding `runsPerMonth` and platform costs.
*   Improve the responsiveness of the build page header to ensure all controls are accessible on various screen sizes.
*   Introduce an "Alternative Templates" bottom sheet to allow users to explore and switch between different automation solutions.
*   Implement a client-side workflow management system using the `Toolbox` to save and load different scenarios.
*   Update backend APIs and client-side data handling to support these features.

## 2. Phase 1: Core UI Enhancements & Responsiveness

### 2.1. `StatsBar` Revamp (`components/flow/StatsBar.tsx`)

*   **Interactive `runsPerMonth` Input:**
    *   [x] Implement `+` / `-` stepper buttons for quick adjustments to `runsPerMonth` (e.g., dynamic steps: +/- 1 for values < 100, +/- 10 for 100-1000, +/- 100 for >1000).
    *   [x] The `runsPerMonth` displayed number will be clickable, opening a popover (similar to the existing `minutesPerRun` control) for direct numerical input.
    *   [x] State management will use `tempRuns` and `editingRuns` similar to `tempMinutes`.
    *   [x] Changes will trigger the `onUpdateRuns` callback to persist data to Dexie.
*   **Responsive States & Minimalism:**
    *   [x] **Desktop (lg+):** Full text labels for stats, clear icons, and all interactive controls. Detailed platform tier info.
    *   [x] **Tablet (md):** Abbreviated text labels (e.g., "hrs saved" -> "hrs", "monthly value" -> "value"). Icons remain. Interactive controls for `runsPerMonth` and `minutesPerRun` are present. Platform name (e.g., "Zapier") is visible. ROI Ratio and Net Profit are prominent.
    *   [x] **Mobile (sm):** Primarily icons with numerical values. Platform shown as an icon only. ROI Ratio (number only) and Net Profit (number only) are key visible stats. Interactive controls for `runsPerMonth`/`minutesPerRun` might be significantly compacted or hidden behind a small "edit" icon on the respective stat to save space.
    *   [x] Remove any explicit borders around the `StatsBar` component itself. Rely on internal padding, margins, and the visual hierarchy of its elements.
*   **Platform Cost Display:**
    *   [x] Ensure the "Platform Cost" segment clearly displays the calculated cost based on the selected `platform` and `runsPerMonth`.
    *   [x] This segment must update in real-time as `runsPerMonth` or `platform` changes.

### 2.2. Build Page Header Responsiveness (`app/build/page.tsx`)

*   [x] **Integration of Responsive `StatsBar`:** The newly responsive `StatsBar` will be the primary information display in the header.
*   **"More Actions" Dropdown Menu:**
    *   [x] At smaller screen breakpoints (e.g., screen width < `md` or `lg`), the following controls will collapse into a single "More Actions" dropdown menu (using `DropdownMenu` from `shadcn/ui` with an ellipsis or hamburger icon):
        *   `PlatformSwitcher` component.
        *   ROI Settings button (`Coins` icon).
        *   Group / Ungroup buttons (conditionally rendered).
        *   "+ Node" button.
    *   [x] **Order of items in dropdown:** PlatformSwitcher, ROI Settings, Group/Ungroup, +Node.
*   **Persistent Header Elements:**
    *   [x] The "Apicus.io" title/logo.
    *   [x] The (now highly responsive) `StatsBar`.
    *   [x] The "More Actions" dropdown trigger.

## 3. Phase 2: Alternative Templates Bottom Sheet & Workflow Management

### 3.1. API Enhancement for Alternatives (`app/api/templates/search/route.ts`)

*   [x] Modify the `GET` request handler in `/api/templates/search/route.ts`.
*   [x] The vector search parameter `k` (number of nearest neighbors) will be changed from `1` to `6`.
*   [x] The API will return an array of up to 6 template objects.
*   [x] Each template object in the response must include its full `nodes` and `edges` data, `templateId`, `title`, and any other relevant metadata (e.g., `source`, `platform`).

### 3.2. Client-Side Data Handling for Multiple Templates (`lib/db.ts`, `app/build/page.tsx`)

*   **Dexie Storage:**
    *   [x] When templates are fetched (either from an initial `tid` in the URL or through user action):
        *   [x] The primary template will be loaded onto the canvas.
        *   [x] The 5 alternative templates will be stored in Dexie. (Implemented by storing simplified cache in `Scenario.alternativeTemplatesCache` and full data in `alternativeTemplates` state variable in `app/build/page.tsx`).
*   **State Management:** 
    *   [x] `app/build/page.tsx` will manage the state for the currently displayed list of alternatives (full data stored in `alternativeTemplates` state variable).

### 3.3. Alternative Templates Bottom Sheet UI (New Component: `components/flow/AlternativeTemplatesSheet.tsx`)

*   **Appearance & Activation:**
    *   [x] A drawer/sheet component that slides up from the bottom of the `FlowCanvas`.
    *   [x] Initial state: Covers ~1/8th of the screen height, displaying only a grab handle or an "arrow up" icon.
    *   [x] Expanded state: Clicking/dragging the handle expands the sheet to cover 33-50% of the `FlowCanvas` height.
    *   [x] The sheet is populated with alternatives when the `build` page loads based on an initial template search (from homepage).
*   **Content:**
    *   [x] A scrollable list displaying the 5 alternative templates.
    *   [x] Each list item will show "quick stats":
        *   [x] Template Title.
        *   [x] Platform icon (if available, or inferred).
        *   [x] Number of nodes (as a complexity indicator).
        *   [x] Potentially a primary app icon or a short description (Description removed for cleaner UI, app icon not implemented).
    *   [x] A button: "Find New Alternatives" – This button will trigger a new API call to `/api/templates/search`, re-using the *original search query text* (the one that led to the current set of displayed templates). The results will refresh the list in the bottom sheet.
*   **Dismissal:**
    *   [x] Ability to drag down or click an 'X' to close/minimize the sheet.

### 3.4. Workflow Management: Saving Current Canvas & Toolbox Integration

*   **New "Saved Scenarios" Section in `Toolbox.tsx`:**
    *   [x] A new collapsible section will be added to the `Toolbox`, titled "My Scenarios" or "Saved Workflows."
    *   [x] This section will list scenarios that the user has explicitly or implicitly saved during the session.
    *   [x] **Scenario Display and Filtering**: Scenarios are fetched from Dexie. Only scenarios that are not named "Untitled Scenario", or are "Untitled Scenario" but have nodes, or are the currently active scenario will be displayed. This prevents a long list of empty, unused untitled scenarios.
    *   [x] **Editable Titles**: Scenario titles are editable in place. Clicking a title converts it to an input field; changes are saved on Enter/blur or by clicking a save icon.
    *   [x] **Add Scenario**: A '+' button allows users to create a new "Untitled Scenario", which is then immediately loaded.
    *   [x] **Delete Scenario**: A trash icon (visible on hover) allows deletion of a scenario with a confirmation dialog. If the active scenario is deleted, the next available one is loaded or a new one is created.
*   **Saving Mechanism (Client-Side in Dexie):**
    *   [x] **Implicit Save:** Before a new template is loaded onto the canvas (either from the "Alternative Templates Bottom Sheet" or by clicking a saved scenario in the toolbox), the *entire current state of the canvas* must be captured and saved as a distinct "scenario" in Dexie's `scenarios` table (or a similar dedicated table).
    *   [x] **Data to Save:** This includes `nodes`, `edges`, current `platform`, all ROI input values (`runsPerMonth`, `minutesPerRun`, `hourlyRate`, `taskMultiplier`, `taskType`, `complianceEnabled`, `revenueEnabled`, and their sub-fields like `riskLevel`, `errorCost`, etc.), and `viewport`.
    *   [x] **Scenario Naming:**
        *   [x] If the current canvas content originated from a template, use that template's title as the default name (e.g., "Copy of Invoice Processing" or "Backup of Original Name").
        *   [x] If it's a modified workflow or started from blank, use a generic name like "Untitled Workflow [N]" or "Untitled Scenario".
        *   [x] Consider allowing users to rename saved scenarios later (Implemented - titles are editable).
*   **Loading Scenarios from `Toolbox.tsx`:**
    *   [x] Clicking a scenario listed in the "My Scenarios" section of the `Toolbox` will:
        1.  [x] Update the URL with the selected scenario's ID (`sid`).
        2.  [x] Trigger the `onLoadScenario` callback in the parent `build` page.
        3.  [x] The `build` page will then fetch the complete scenario data from Dexie (nodes, edges, ROI parameters, viewport).
        4.  [x] The fetched data is applied to the `build` page's state, refreshing the canvas and all related UI elements (StatsBar, ROI Settings Panel).
        5.  [x] The parent `build` page is responsible for robustly handling the loading, including updating its `scenarioId` and `currentScenario` states to reflect the newly loaded scenario.
*   **Visual Cues in `Toolbox.tsx`:**
    *   [x] Each saved scenario in the list could display its name and perhaps a small platform icon (e.g., Zapier orange dot, Make purple dot).

### 3.5. Interaction: Loading an Alternative Template from Bottom Sheet

*   When a user clicks on an alternative template in the `AlternativeTemplatesSheet.tsx`:
    1.  [x] **Save Current:** The current canvas state (nodes, edges, ROI params, etc.) is implicitly saved as a new entry in the "My Scenarios" list in the `Toolbox` (using the naming convention above).
    2.  [x] **Load Alternative:** The selected alternative template's `nodes` and `edges` are loaded onto the main canvas.
    3.  [x] **Apply Parameters:** Its associated `platform` (if defined in the template) and default/template-defined ROI parameters are applied. If no specific ROI params are in the template, general defaults will be used.
    4.  [x] **Add to Toolbox:** The newly loaded workflow (which was an alternative) is also added as an entry to the "My Scenarios" list in the `Toolbox`, using its original template title.

## 4. Phase 3: Database & Documentation

### 4.1. Database Indexing (Backend Task)

*   [x] Review and ensure appropriate indexes are created on the Azure Cosmos DB (MongoDB) collection `apicus-templates`.
*   **Required Indexes:**
    *   [x] A vector index on the `embedding` field (e.g., `cosmosSearch` or `vectorSearch` compatible index).
    *   [x] A standard index on `templateId` for efficient direct lookups by `app/api/templates/[templateId]/route.ts`.
    *   [x] Potentially indexes on other queryable metadata if used for filtering in the future.

### 4.2. Documentation Updates

*   [x] Update `TASKS.md` to reflect these new detailed tasks and phases.
*   [x] This file (`docs/tasks-ui-build-page.md`) will serve as the primary reference for this UI/UX revamp effort.
*   [x] Update any relevant comments in the codebase as components are refactored.

## 5. Technical Considerations

*   [x] **State Management:** Heavy reliance on Dexie.js for client-side persistence of multiple scenarios. The `app/build/page.tsx` component will manage the "active" scenario, syncing it with Dexie.
*   [x] **Unique IDs:** Ensure robust generation of unique IDs for new scenarios saved in Dexie.
*   **Performance:**
    *   [x] Initial load of 6 templates (primary + 5 alternatives) with full node/edge data needs to be monitored. If payload is too large, consider fetching only metadata for alternatives initially, and full data on demand (e.g., when sheet is expanded or an item is hovered). (Full data is fetched, performance seems acceptable for MVP).
    *   [x] Dexie operations should be efficient. Batch updates if necessary. (Current operations are not heavily batched but perform adequately for now).
*   [x] **UI Component Library:** Continue leveraging `shadcn/ui` for consistency.
*   [x] **Error Handling:** Implement robust error handling for API calls and Dexie operations. (Basic error handling implemented, can be improved).

## 6. UI Mockups/Flow Descriptions (Placeholder)

*(This section would typically include visual mockups of the new StatsBar states, the "More Actions" dropdown, the Alternative Templates Bottom Sheet, and the "My Scenarios" section in the Toolbox. Detailed user flow diagrams for saving/loading scenarios would also be beneficial.)*

*   **StatsBar Responsive States:**
    *   Mockup for Mobile (icons, compact numbers).
    *   Mockup for Tablet (abbreviated text, controls).
    *   Mockup for Desktop (full view).
*   **Header with "More Actions" Dropdown:**
    *   Mockup showing the collapsed state on a smaller screen.
*   **Alternative Templates Bottom Sheet:**
    *   Mockup of minimized state (handle/arrow).
    *   Mockup of expanded state with list of templates and "quick stats."
*   **Toolbox "My Scenarios" Section:**
    *   Mockup showing the list of saved scenarios.
*   **User Flow: Switching Templates:**
    *   Diagram: User clicks alternative -> current saved to toolbox -> alternative loaded -> alternative added to toolbox.
*   **User Flow: Loading from Toolbox:**
    *   Diagram: User clicks saved scenario in toolbox -> current saved to toolbox -> clicked scenario loaded.

This plan provides a comprehensive roadmap for the build page UI/UX revamp. 