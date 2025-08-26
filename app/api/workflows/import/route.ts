import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, ImportError } from '@/lib/import/detect';
import { parseMakeBlueprint } from '@/lib/import/parsers/make';
import { parseN8nWorkflow } from '@/lib/import/parsers/n8n';

export async function POST(request: NextRequest) {
  try {
    let rawData: unknown;
    
    // Handle both FormData (file upload) and JSON body
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'No file provided',
        }, { status: 400 });
      }
      
      const text = await file.text();
      try {
        rawData = JSON.parse(text);
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Invalid JSON file',
        }, { status: 400 });
      }
      
    } else if (contentType.includes('application/json')) {
      // Direct JSON upload
      const body = await request.json();
      rawData = body.data || body;
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid content type. Expected multipart/form-data or application/json',
      }, { status: 400 });
    }
    
    // Detect platform and parse accordingly
    const platform = detectPlatform(rawData);
    if (!platform) {
      return NextResponse.json({ success: false, error: 'Unsupported or unknown workflow format' }, { status: 400 });
    }

    let imported;
    if (platform === 'make') {
      imported = parseMakeBlueprint(rawData);
    } else if (platform === 'n8n') {
      imported = parseN8nWorkflow(rawData);
    } else {
      return NextResponse.json({ success: false, error: 'Zapier imports not supported yet' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      template: imported,
      stats: {
        platform: imported.metadata.platform,
        nodeCount: imported.metadata.nodeCount,
      }
    });
    
  } catch (error) {
    console.error('Import API error:', error);
    
    if (error instanceof ImportError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to import workflow',
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 