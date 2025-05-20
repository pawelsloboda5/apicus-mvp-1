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

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (Radix UI components)
- **Workflow Canvas:** React Flow v12 (`@xyflow/react`)
- **Drag-and-Drop:** dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`)
- **Local Storage:** Dexie.js (IndexedDB)
- **AI Integration:** Azure OpenAI API
- **State Management:** React hooks and Zustand

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

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Project Structure
apicus-mvp-1/
├── app/
│ ├── layout.tsx
│ ├── page.tsx
│ ├── providers.tsx
│ └── globals.css
├── components/
├── lib/
├── hooks/
├── docs/
│ ├── architecture-overview.md
│ ├── canvas-react-flow.md
│ ├── dndKit-canvas-drag-drop.md
│ ├── shadcn-radix-workflow-canvas.md
│ ├── design-system.md
│ ├── tech-stack.md
│ ├── mvp-design.md
│ └── ROI Framework Case Studies.md
├── public/
├── tailwind.config.ts
├── package.json
└── README.md