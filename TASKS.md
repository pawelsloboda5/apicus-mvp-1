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
- [ ] Implement undo/redo functionality
- [x] Enable JSON export/import and local storage persistence via Dexie.js
- [ ] Implement connection validation logic

## Node Properties & ROI Integration 2-3hrs
- [x] Type Visualization: Color-code nodes by type (trigger/action/decision) with appropriate icons
- [x] Step Details: Show app name, action type, and position in workflow
- [x] ROI Contribution: Display how each node contributes to overall ROI
- [ ] App Icon Integration: Display app icons from template data (GitHub, Zapier, etc.)
- [x] Step-Specific ROI Impact: Calculate time saved per step based on typical times
- [ ] Interactive Documentation: Links to app documentation or examples
- [ ] Step Dependencies: Visualization of data flow between steps

## ROI Settings Enhancement 2-3hrs
- [x] Guided Input Experience: Add tooltips/descriptions for each ROI parameter
- [x] Visual Sliders: Convert numeric inputs to sliders with visual feedback
- [x] Benchmarks: Show industry averages for each value (typical rates, times)
- [x] Real-time Calculation Updates: Show how changing values affects overall ROI
- [x] Task Type Selector: Dropdown to select task type that auto-adjusts V* multiplier
- [x] Risk/Compliance Section: Expandable section for R value with toggles
- [x] Revenue Impact Section: Fields for leads, conversion rate, and value
- [ ] Scenario Comparison: Save multiple ROI scenarios to compare different assumptions

## Code Organization 1-2hrs
- [x] Extract StatsBar component
- [x] Extract PlatformSwitcher component  
- [x] Extract NodePropertiesPanel component
- [x] Extract ROISettingsPanel component
- [x] Extract FlowCanvas component
- [x] Implement proper TypeScript interfaces for all components
- [x] Refactor handleAddNode function to a utility file
- [x] Move ROI calculation logic to separate utility functions
- [ ] Create comprehensive end-to-end test suite
- [ ] Add error handling for edge cases (missing data, etc.)

## ROI Stats Bar Improvements 1-2hrs
- [ ] Visual ROI Breakdown: Graphical representation of ROI components
- [ ] Platform Comparison: Show side-by-side ROI for different platforms
- [ ] Time Period Toggle: Switch between monthly, quarterly, and annual calculations
- [ ] Save/Export Options: Quick buttons to save or share ROI results
- [ ] Payback Period Visualization: Timeline showing when automation pays for itself
- [ ] Cost Breakdown: Detailed view of automation costs by component
- [ ] Interactive What-If Scenarios: Quick toggles for scenario testing

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
- [x] API route `/api/templates/search` – embeds query & returns best template.
- [x] Landing page wired to API; redirects to Build canvas.
- [x] Build canvas loads `tid` param and renders imported template.

## Landing Page Revamp 1hr
- [x] Add natural-language query textbox and "Find Template" CTA to hero section.
- [ ] Style improvements and mobile polish after integration is functional.

## Testing and Quality Assurance 1-5hrs
- [ ] Write unit tests for critical components and logic
- [ ] Perform integration testing for AI and Dexie.js interactions
- [ ] Conduct usability testing for UI/UX improvements
- [ ] Optimize performance for moderate-scale workflows (<100 nodes)

## Documentation
- [ ] Update `README.md` regularly with setup and usage instructions
- [ ] Maintain detailed documentation for each feature in `/docs`
- [ ] Document API endpoints and data structures clearly

## Deployment 30-60mins
- [ ] Configure deployment settings (e.g., Vercel)
- [ ] Set up environment variables securely
- [ ] Deploy initial MVP version
- [ ] Monitor and log application performance and errors

## Post-MVP Considerations
- [ ] Plan for backend integration for multi-device support
- [ ] Explore advanced AI features (e.g., natural language scenario analysis)
- [ ] Consider user authentication and data security enhancements