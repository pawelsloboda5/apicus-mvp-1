# Hot Templates Migration

This directory contains scripts to selectively migrate automation templates that include "hot" apps from the source collection to the target collection.

## Overview

The `migrateHotTemplates.ts` script:

1. Reads a list of "hot" app names from `overlapping_apps_cleaned.csv`
2. For each hot app, finds the 5 templates with the most steps that include the app
3. For each selected template:
   - Transforms and migrates it to the target collection
   - Enriches it with React Flow nodes and edges (inline)
   - Generates vector embeddings for semantic search (inline)
4. Provides a summary of migration results

## Smart Selection Logic

The script implements intelligent template selection:
- For each hot app, only the 5 templates with the most steps are selected
- Templates are sorted by step_count (descending) to prioritize more complex workflows
- The full processing (migration, enrichment, embedding) happens for each template

## Prerequisites

- Node.js (v14+)
- TypeScript
- Access to the MongoDB cluster with source and target collections
- Environment variables properly configured in `.env`

## Required Environment Variables

```
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-... (or AZURE_OPENAI_API_KEY)
```

For Azure OpenAI:
```
AZURE_OPENAI_ENDPOINT=https://...
AZURE_4_1_DEPLOYMENT=...
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

## Running the Scripts

### Complete Migration Flow

```bash
# Run the migration with built-in enrichment and embedding
npm run migrate:hotTemplates

# Create the vector index (if it doesn't exist)
npm run create:vectorIndex

# Or run both steps in sequence
npm run migrate:hotTemplatesFlow
```

This will:
1. Load app names from `overlapping_apps_cleaned.csv`
2. For each app, find the 5 templates with the most steps
3. Migrate, enrich, and embed each template
4. Create the vector index for semantic search

## CSV Format

The `overlapping_apps_cleaned.csv` file should have the following format:

```
App Name
app1
app2
app3
...
```

The first line is a header, and each subsequent line contains a single app name. 