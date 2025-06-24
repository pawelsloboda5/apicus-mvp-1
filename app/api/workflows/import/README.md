# Workflow Import API

This API endpoint allows importing automation workflows from various platforms into Apicus format.

## Supported Platforms

- ✅ **Make.com** (Integromat) - Fully supported
- 🚧 **n8n** - Coming soon
- 🚧 **Zapier** - Coming soon

## Endpoint

```
POST /api/workflows/import
```

## Request Formats

### Option 1: File Upload (Recommended)

```typescript
const formData = new FormData();
formData.append('file', file); // File object from <input type="file">

const response = await fetch('/api/workflows/import', {
  method: 'POST',
  headers: {
    'X-Enrich-Pricing': 'true' // Optional: Add pricing data
  },
  body: formData
});
```

### Option 2: JSON Body

```typescript
const response = await fetch('/api/workflows/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Enrich-Pricing': 'true' // Optional
  },
  body: JSON.stringify({
    data: makeWorkflowJson // The raw Make.com export
  })
});
```

## Response Format

```typescript
interface ImportResponse {
  success: boolean;
  workflow?: ImportedWorkflow;
  template?: AlternativeTemplate;
  stats?: {
    nodeCount: number;
    edgeCount: number;
    estimatedMinutes: number;
    detectedApps: string[];
  };
  error?: string;
  warnings?: string[];
}
```

## Make.com Module Mappings

The following Make.com modules are recognized and mapped:

### Triggers
- `webhooks:WebHook` → Webhook trigger
- `webhook` → Webhook trigger

### Decisions
- `builtin:BasicRouter` → Router/Decision node
- `router` → Decision node
- `filter` → Decision node
- `flow-control` → Decision node

### Actions
- `http:ActionSendData` → HTTP Request
- `json:ParseJSON` → JSON Parser
- `anthropic-claude:createAMessage` → Claude AI
- `openai-gpt-3:CreateCompletion` → OpenAI
- `anymailfinder:*` → Anymail Finder
- `instantly:addLeadToCampaign` → Instantly
- `apify:fetchDatasetItems` → Apify
- `regexp:HTMLToText` → Text Parser
- And many more...

## Pricing Enrichment

When `X-Enrich-Pricing: true` header is set, the API will:

1. Detect apps used in the workflow
2. Query MongoDB for pricing data
3. Add pricing information to the response

Currently supported apps for pricing:
- HTTP Request
- Claude AI
- OpenAI
- Google Sheets
- Gmail
- Slack
- Airtable
- Notion
- HubSpot
- Salesforce
- And more...

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Invalid request (bad file, unsupported platform, etc.)
- `500` - Server error

Error response format:
```json
{
  "success": false,
  "error": "Error message",
  "warnings": ["Optional warnings"]
}
```

## Usage Example

```typescript
// React component example
function ImportWorkflow() {
  const [importing, setImporting] = useState(false);
  
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/workflows/import', {
        method: 'POST',
        headers: {
          'X-Enrich-Pricing': 'true'
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Import successful!');
        console.log(`Imported ${result.stats.nodeCount} nodes`);
        console.log(`Detected apps: ${result.stats.detectedApps.join(', ')}`);
        
        // Use the imported workflow
        // result.workflow - normalized workflow data
        // result.template - ready-to-use template
      } else {
        console.error('Import failed:', result.error);
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept=".json"
        onChange={handleFileSelect}
        disabled={importing}
      />
      {importing && <p>Importing...</p>}
    </div>
  );
}
```

## Testing

To test the API:

1. Use the test script:
   ```bash
   npx tsx app/api/workflows/import/test-import.ts
   ```

2. Or use the parser test directly:
   ```bash
   npx tsx lib/templates/test-make-parser.ts
   ```

3. Or use curl:
   ```bash
   curl -X POST http://localhost:3000/api/workflows/import \
     -H "X-Enrich-Pricing: true" \
     -F "file=@path/to/make-workflow.json"
   ```

## Limitations

- Maximum file size: 10MB
- Maximum nodes: 1000
- Only Make.com is currently supported
- Complex routing logic may need manual adjustment after import 