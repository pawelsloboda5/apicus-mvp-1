"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function TestImportPage() {
  const [status, setStatus] = useState<string>('');
  const router = useRouter();
  
  const testImport = async () => {
    setStatus('Starting import test...');
    
    try {
      // Use the actual High Ticket Sales JSON that was successfully imported
      const testJson = {
        "name": "High Ticket Sales System Companies Hiring For SDRS",
        "flow": [
          {
            "id": 1,
            "module": "apify:fetchDatasetItems",
            "metadata": {
              "designer": { "x": 0, "y": 150 }
            }
          },
          {
            "id": 4,
            "module": "http:ActionSendData",
            "metadata": {
              "designer": { "x": 300, "y": 150 }
            }
          },
          {
            "id": 5,
            "module": "regexp:HTMLToText",
            "metadata": {
              "designer": { "x": 600, "y": 150 }
            }
          }
        ]
      };
      
      // Call the import API
      const response = await fetch('/api/workflows/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testJson),
      });
      
      const result = await response.json();
      console.log('[TestImport] API Response:', result);
      setStatus('API Response: ' + JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Store in sessionStorage
        sessionStorage.setItem('importedTemplate', JSON.stringify(result.template));
        setStatus(prev => prev + '\n\nStored in sessionStorage. Redirecting...');
        
        // Navigate to build page
        setTimeout(() => {
          router.push('/build?import=session');
        }, 1000);
      }
    } catch (error) {
      console.error('[TestImport] Error:', error);
      setStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const checkSessionStorage = () => {
    const stored = sessionStorage.getItem('importedTemplate');
    if (stored) {
      setStatus('SessionStorage contains: ' + stored.substring(0, 200) + '...');
    } else {
      setStatus('SessionStorage is empty');
    }
  };
  
  const manualStoreTemplate = () => {
    // Manually store the successful response you showed
    const templateData = {
      "templateId": "make-import-1750725267715",
      "title": "High Ticket Sales System Companies Hiring For SDRS",
      "platform": "make",
      "source": "make",
      "nodes": [
        {
          "reactFlowId": "node-1",
          "type": "trigger",
          "position": { "x": 0, "y": 150 },
          "data": {
            "label": "Apify: fetchDatasetItems",
            "appName": "Apify",
            "action": "fetchDatasetItems"
          }
        },
        {
          "reactFlowId": "node-4",
          "type": "action",
          "position": { "x": 300, "y": 150 },
          "data": {
            "label": "HTTP: ActionSendData",
            "appName": "HTTP",
            "action": "ActionSendData"
          }
        }
      ],
      "edges": [
        {
          "reactFlowId": "edge-0",
          "source": "node-1",
          "target": "node-4",
          "type": "custom",
          "data": {
            "source": "node-1",
            "target": "node-4"
          }
        }
      ]
    };
    
    sessionStorage.setItem('importedTemplate', JSON.stringify(templateData));
    setStatus('Manually stored template in sessionStorage. Now navigate to /build?import=session');
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Test Page</h1>
      
      <div className="space-y-4">
        <Button onClick={testImport}>
          Test Import Flow
        </Button>
        
        <Button onClick={checkSessionStorage} variant="outline">
          Check SessionStorage
        </Button>
        
        <Button onClick={manualStoreTemplate} variant="outline">
          Manually Store Test Template
        </Button>
        
        <Button onClick={() => router.push('/build')} variant="outline">
          Go to Build Page
        </Button>
        
        <Button onClick={() => router.push('/build?import=session')} variant="outline">
          Go to Build with Import
        </Button>
        
        <Button 
          onClick={() => {
            sessionStorage.clear();
            setStatus('SessionStorage cleared');
          }} 
          variant="destructive"
        >
          Clear SessionStorage
        </Button>
      </div>
      
      {status && (
        <pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {status}
        </pre>
      )}
    </div>
  );
} 