# Apicus MVP Task List

This document outlines the tasks required to complete the Apicus MVP project. Tasks are grouped by feature and technology.

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