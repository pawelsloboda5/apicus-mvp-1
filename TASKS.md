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
- [ ] Set up React Flow v12 with Next.js 15
- [ ] Create custom pixel-art/minimalistic styled nodes
- [ ] Implement drag-and-drop functionality using dndKit
- [ ] Add zoom, pan, and viewport controls
- [ ] Implement undo/redo functionality
- [ ] Enable JSON export/import and local storage persistence via Dexie.js
- [ ] Implement connection validation logic

## Modular ROI Dashboard 2-3hrs
- [ ] Design modular dashboard layout inspired by Notion
- [ ] Develop customizable widgets for ROI metrics
- [ ] Integrate AI-driven insights and scenario analysis
- [ ] Implement drag-and-drop or toggle-based module arrangement
- [ ] Ensure state persistence across sessions

## Data Mining 1-2hrs
        - Jake is finding overlapping apps
- [] Basic app info for apps that are in make,n8n and zapier. (check current DB for apps to cross-reference)
- [] Find price formulas for make, n8n and zapier.

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