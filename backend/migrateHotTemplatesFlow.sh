#!/bin/bash
# Script to run the complete hot templates migration flow

echo "===== 1. Migrating hot templates ====="
npx ts-node backend/migrateHotTemplates.ts

if [ $? -ne 0 ]; then
  echo "Error during migration. Stopping."
  exit 1
fi

echo ""
echo "===== 2. Enriching templates with React Flow nodes/edges ====="
npx ts-node backend/enrichTemplatesWithFlow.ts

if [ $? -ne 0 ]; then
  echo "Error during enrichment. Stopping."
  exit 1
fi

echo ""
echo "===== 3. Generating vector embeddings ====="
npx ts-node backend/embedTemplateEmbeddings.ts

if [ $? -ne 0 ]; then
  echo "Error during embedding generation. Stopping."
  exit 1
fi

echo ""
echo "===== 4. Checking if vector index exists ====="
# We could add a check here to see if the index exists
# For now, we'll run it regardless (it's idempotent)
npx ts-node backend/createVectorIndex.ts

echo ""
echo "Hot templates migration completed successfully!" 