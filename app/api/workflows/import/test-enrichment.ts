import { enrichWithPricingData } from './enrichment';
import { ImportedWorkflow } from '@/lib/import/types';
import { Node } from '@xyflow/react';

// Interface for workflow node with proper typing
interface WorkflowNodeWithAppData extends Node {
  data: {
    label: string;
    appName: string;
    action: string;
    [key: string]: unknown;
  };
}

// Interface for pricing data structure
interface PricingData {
  appName: string;
  appSlug: string;
  hasFreeTier: boolean;
  lowestMonthlyPrice: number | null;
  highestMonthlyPrice: number | null;
  tierCount: number;
  priceModelType: string[];
  [key: string]: unknown;
}

// Test workflow with various app names
const testWorkflow: ImportedWorkflow = {
  nodes: [
    {
      id: 'node-1',
      type: 'action',
      position: { x: 0, y: 0 },
      data: {
        label: 'Send Slack Message',
        appName: 'Slack',
        action: 'Send Message',
      }
    },
    {
      id: 'node-2', 
      type: 'action',
      position: { x: 200, y: 0 },
      data: {
        label: 'Update Google Sheet',
        appName: 'Google Sheets',
        action: 'Update Row',
      }
    },
    {
      id: 'node-3',
      type: 'action', 
      position: { x: 400, y: 0 },
      data: {
        label: 'Send with Claude',
        appName: 'Claude AI',
        action: 'Generate Text',
      }
    },
    {
      id: 'node-4',
      type: 'action',
      position: { x: 600, y: 0 },
      data: {
        label: 'HTTP Request',
        appName: 'HTTP',
        action: 'Make Request',
      }
    }
  ],
  edges: [],
  metadata: {
    platform: 'make',
    originalName: 'Test Workflow',
    importDate: Date.now(),
    nodeCount: 4,
    estimatedMinutes: 10
  }
};

async function testEnrichment() {
  console.log('Testing enrichment with automatic slug conversion...\n');
  
  console.log('Original app names:');
  testWorkflow.nodes.forEach((node) => {
    const typedNode = node as WorkflowNodeWithAppData;
    console.log(`- ${typedNode.data.appName}`);
  });
  
  try {
    const enrichedWorkflow = await enrichWithPricingData(testWorkflow);
    
    console.log('\n✅ Enrichment successful!');
    console.log('\nPricing data found:');
    
    const pricingData = enrichedWorkflow.metadata.pricingData;
    if (pricingData && typeof pricingData === 'object') {
      Object.values(pricingData).forEach((pricing) => {
        const typedPricing = pricing as PricingData;
        console.log(`\n📦 ${typedPricing.appName} (${typedPricing.appSlug})`);
        console.log(`   - Has free tier: ${typedPricing.hasFreeTier ? '✅' : '❌'}`);
        console.log(`   - Price range: $${typedPricing.lowestMonthlyPrice || 0} - $${typedPricing.highestMonthlyPrice || '?'}/month`);
        console.log(`   - Tiers: ${typedPricing.tierCount}`);
        console.log(`   - Pricing model: ${typedPricing.priceModelType.join(', ')}`);
      });
    } else {
      console.log('❌ No pricing data found');
    }
    
    console.log(`\n📅 Enriched at: ${enrichedWorkflow.metadata.pricingEnrichedAt}`);
    
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
  }
  
  process.exit(0);
}

// Run the test
testEnrichment(); 