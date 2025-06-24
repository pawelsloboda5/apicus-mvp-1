// Test script for the workflow import API
// Run with: npx tsx app/api/workflows/import/test-import.ts

import fs from 'fs/promises';
import path from 'path';

async function testImportAPI() {
  try {
    // Read the High Ticket Sales JSON file
    const jsonPath = path.join(
      process.cwd(),
      'lib/types/High Ticket Sales System Companies Hiring for SDRS (1).json'
    );
    
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    // Test 1: Direct JSON upload
    console.log('🧪 Test 1: Direct JSON upload...');
    const response1 = await fetch('http://localhost:3000/api/workflows/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    
    const result1 = await response1.json();
    console.log('Response status:', response1.status);
    console.log('Success:', result1.success);
    
    if (result1.success) {
      console.log('✅ Import successful!');
      console.log('Stats:', result1.stats);
      console.log('Detected apps:', result1.stats?.detectedApps);
      console.log('Warnings:', result1.warnings);
    } else {
      console.log('❌ Import failed:', result1.error);
    }
    
    // Test 2: File upload with pricing enrichment
    console.log('\n🧪 Test 2: File upload with pricing enrichment...');
    const file = new File([jsonData], 'make-workflow.json', { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', file);
    
    const response2 = await fetch('http://localhost:3000/api/workflows/import', {
      method: 'POST',
      headers: {
        'X-Enrich-Pricing': 'true',
      },
      body: formData,
    });
    
    const result2 = await response2.json();
    console.log('Response status:', response2.status);
    console.log('Success:', result2.success);
    
    if (result2.success) {
      console.log('✅ Import with pricing successful!');
      console.log('Has pricing data:', !!result2.workflow?.metadata?.pricingData);
      console.log('Template created:', result2.template?.name);
      
      // Save the result for inspection
      await fs.writeFile(
        'imported-workflow-with-pricing.json',
        JSON.stringify(result2, null, 2)
      );
      console.log('\n📁 Full result saved to: imported-workflow-with-pricing.json');
    } else {
      console.log('❌ Import failed:', result2.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Note: This test requires the Next.js server to be running
console.log('🚀 Testing workflow import API...');
console.log('Make sure your Next.js server is running on http://localhost:3000\n');

testImportAPI(); 