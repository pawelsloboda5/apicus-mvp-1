# Apicus MVP - Automation ROI Web Application

## Overview

Apicus MVP is a web application designed to help operations managers, automation consultants, and tech-savvy freelancers quickly and clearly justify the ROI of automation projects. It provides an interactive, AI-driven experience to calculate and visualize ROI metrics, enabling users to demonstrate time savings, cost reductions, and business value effectively.

## Features

### 1. AI-Powered ROI Questionnaire
- Conversational AI interface for gathering ROI inputs (Time Saved, Hourly Wage, Task Value Multiplier, Risk/Compliance Value, Revenue Uplift, Automation Cost).
- Dynamic question flow adapting to user inputs.
- Smart defaults and AI-assisted estimations.

### 2. Visual Workflow Builder Canvas
- Interactive node-based workflow builder using React Flow.
- Custom pixel-art styled nodes for a unique, engaging user experience.
- Drag-and-drop functionality with intuitive UI/UX.
- Scenario management: Editable titles, add/delete, implicit saving, and loading of saved scenarios via Toolbox.
- Alternative templates: Display and load alternative workflow templates.
- Responsive UI: Enhanced `StatsBar` and header for various screen sizes.
- Local storage persistence via Dexie.js for scenarios, nodes, edges, and viewport.

### 3. Modular ROI Dashboard
- Notion-inspired modular dashboard for displaying ROI metrics.
- Customizable widgets for Time Savings, Revenue Uplift, Risk Reduction, Automation Cost, Net ROI, and Payback Period.
- AI-driven insights and scenario analysis.

### 4. Automation Template Import & Generation
- 50+ Zapier templates migrated into `apicus-templates` (Azure Cosmos DB for MongoDB vCore).
- Each template is enriched with React-Flow `nodes` / `edges` for 1-click canvas import.
- API returns primary template and up to 5 alternatives with full node/edge data.
- Azure OpenAI embeddings (`text-embedding-3-small`) pre-computed for `title`, `richDescription`, and `exampleUserPrompts`.
- Vector index (`vector-ivf`) created on the `embedding` field – enables sub-100 ms semantic search via `$search.cosmosSearch`.
- `/api/templates/search` endpoint embeds user query on the fly and returns the best matching `templateId` along with alternatives.
- Landing-page form now shows a loading spinner and redirects directly to `/build?tid=…&q=...` where the template and alternatives are processed.

### 5. Performance Optimizations (React 19 & Next.js 15)
- **React Compiler**: Automatic optimizations eliminate the need for manual `useMemo` and `useCallback`
- **Concurrent Rendering**: Enhanced UI responsiveness with React 19's improved concurrent features
- **Streaming SSR**: Faster initial page loads with React 19's streaming capabilities
- **Partial Prerendering (PPR)**: Combines static and dynamic rendering for optimal performance
- **Smart Caching**: Optimized caching defaults with fine-grained control
- **Automatic Batching**: Improved state update performance with React 19

## Tech Stack

- **Framework:** Next.js 15 (App Router) with Turbopack support
- **Language:** TypeScript
- **React:** React 19 with React Compiler (Experimental)
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix UI components)
- **Workflow Canvas:** React Flow v12 (`@xyflow/react`)
- **Drag-and-Drop:** dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`)
- **Local Storage:** Dexie.js (IndexedDB)
- **Database:** Azure Cosmos DB for MongoDB (collection: `apicus-templates`)
- **AI Integration:** Azure OpenAI API
- **State Management:** React hooks with React 19 performance optimizations
- **Performance:** React Compiler, Partial Prerendering, Streaming SSR

## Backend Scripts (`/backend`)

Temporary Node scripts live in the `backend/` folder to seed and maintain the `apicus-templates` collection.

1. **`seedTemplates.ts`** – Converts legacy Zapier template JSON into the new `AutomationTemplate` schema (see `backend/automationTemplateSchema.ts`) and bulk-inserts them into Cosmos DB.
2. **`generateEmbeddings.ts`** – Computes OpenAI embeddings for any templates missing the `embedding` field and updates the documents in place. Designed to run idempotently.

Scripts use environment variables `MONGODB_URI` and `OPENAI_API_KEY`. They are *not* bundled with the client-side code and can be executed locally or via CI.

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd apicus-mvp-1
npm install
```

## Development

Run the development server with Turbopack for enhanced performance:

```bash
npm run dev --turbo
```

Or configure it in package.json:

```json
{
  "scripts": {
    "dev": "next dev --turbo"
  }
}
```

## Performance Features

### React 19 Optimizations
- **React Compiler**: Automatically optimizes components without manual memoization
- **use() Hook**: Efficient data fetching with built-in Suspense support
- **useOptimistic**: Instant UI updates for better perceived performance
- **Enhanced Streaming**: Improved SSR with better streaming capabilities

### Next.js 15 Enhancements
- **Turbopack**: Rust-based bundler for lightning-fast development
- **Partial Prerendering**: Mix static and dynamic content intelligently
- **Static Route Indicator**: Visual feedback for optimization opportunities
- **unstable_after API**: Execute non-critical tasks after response streaming
- **Optimized Bundling**: Better tree-shaking and external package handling