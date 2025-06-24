import { parseMakeBlueprint } from '@/lib/import/parsers/make';
import { createApicusTemplate } from './types';
import fs from 'fs';
import path from 'path';

async function testMakeImport() {
  try {
    // Read the Make.com JSON file
    const jsonPath = path.join(process.cwd(), 'lib/types/High Ticket Sales System Companies Hiring for SDRS (1).json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log('Testing Make.com import...');
    console.log('Workflow name:', jsonData.name);
    console.log('Number of modules:', jsonData.flow?.length || 0);
    
    // Parse the Make blueprint
    const workflow = parseMakeBlueprint(jsonData);
    console.log('\nParsed workflow:');
    console.log('- Nodes:', workflow.nodes.length);
    console.log('- Edges:', workflow.edges.length);
    console.log('- Platform:', workflow.metadata.platform);
    
    // Create Apicus template
    const template = createApicusTemplate(workflow);
    console.log('\nCreated template:');
    console.log('- Template ID:', template.templateId);
    console.log('- Title:', template.title);
    console.log('- Node count:', template.nodes.length);
    console.log('- Edge count:', template.edges.length);
    console.log('- App names:', template.appNames);
    
    // Verify node structure
    if (template.nodes.length > 0) {
      console.log('\nFirst node structure:');
      console.log(JSON.stringify(template.nodes[0], null, 2));
    }
    
    // Verify edge structure
    if (template.edges.length > 0) {
      console.log('\nFirst edge structure:');
      console.log(JSON.stringify(template.edges[0], null, 2));
    }
    
    console.log('\n✅ Import test completed successfully!');
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testMakeImport(); 