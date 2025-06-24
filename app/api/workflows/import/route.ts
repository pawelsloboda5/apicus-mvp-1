import { NextRequest, NextResponse } from 'next/server';
import { mapMakeToApicus } from './make-to-apicus-mapper';

export async function POST(request: NextRequest) {
  try {
    let makeJson: any;
    
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
        makeJson = JSON.parse(text);
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Invalid JSON file',
        }, { status: 400 });
      }
      
    } else if (contentType.includes('application/json')) {
      // Direct JSON upload
      const body = await request.json();
      makeJson = body.data || body;
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid content type. Expected multipart/form-data or application/json',
      }, { status: 400 });
    }
    
    // Check if it's a Make.com workflow
    if (!makeJson.flow || !Array.isArray(makeJson.flow)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Make.com workflow format. Expected a "flow" array.',
      }, { status: 400 });
    }
    
    // Convert to Apicus template schema
    const template = mapMakeToApicus(makeJson);
    
    // Return only the template
    return NextResponse.json({
      success: true,
      template,
      stats: {
        nodeCount: template.nodes.length,
        edgeCount: template.edges.length,
        detectedApps: template.appNames,
      }
    });
    
  } catch (error) {
    console.error('Import API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to import workflow',
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 