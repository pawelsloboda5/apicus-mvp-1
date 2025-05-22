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
- JSON export/import and local storage persistence via Dexie.js.

### 3. Modular ROI Dashboard
- Notion-inspired modular dashboard for displaying ROI metrics.
- Customizable widgets for Time Savings, Revenue Uplift, Risk Reduction, Automation Cost, Net ROI, and Payback Period.
- AI-driven insights and scenario analysis.

### 4. Automation Template Import & Generation
- 50+ Zapier templates migrated into `apicus-templates` (Azure Cosmos DB for MongoDB vCore).
- Each template is enriched with React-Flow `nodes` / `edges` for 1-click canvas import.
- Azure OpenAI embeddings (`text-embedding-3-small`) pre-computed for `title`, `richDescription`, and `exampleUserPrompts`.
- Vector index (`vector-ivf`) created on the `embedding` field – enables sub-100 ms semantic search via `$search.cosmosSearch`.
- `/api/templates/search` endpoint embeds user query on the fly and returns the best matching `templateId`.
- Landing-page form now shows a loading spinner and redirects directly to `/build?tid=…` where the template is rendered.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (Radix UI components)
- **Workflow Canvas:** React Flow v12 (`@xyflow/react`)
- **Drag-and-Drop:** dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`)
- **Local Storage:** Dexie.js (IndexedDB)
- **Database:** Azure Cosmos DB for MongoDB (collection: `apicus-templates`)
- **AI Integration:** Azure OpenAI API
- **State Management:** React hooks and Zustand

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

Run the development server:

```bash
npm run dev
```