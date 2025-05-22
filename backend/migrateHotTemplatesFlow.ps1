# PowerShell script to run the complete hot templates migration flow

Write-Host "===== 1. Migrating hot templates =====" -ForegroundColor Cyan
npx ts-node backend/migrateHotTemplates.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during migration. Stopping." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===== 2. Enriching templates with React Flow nodes/edges =====" -ForegroundColor Cyan
npx ts-node backend/enrichTemplatesWithFlow.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during enrichment. Stopping." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===== 3. Generating vector embeddings =====" -ForegroundColor Cyan
npx ts-node backend/embedTemplateEmbeddings.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during embedding generation. Stopping." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===== 4. Checking if vector index exists =====" -ForegroundColor Cyan
# We could add a check here to see if the index exists
# For now, we'll run it regardless (it's idempotent)
npx ts-node backend/createVectorIndex.ts

Write-Host ""
Write-Host "Hot templates migration completed successfully!" -ForegroundColor Green 