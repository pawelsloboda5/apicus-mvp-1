"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2 } from 'lucide-react';

interface ImportWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenarioId?: number | null;
}

export function ImportWorkflowDialog({ 
  isOpen, 
  onClose,
  currentScenarioId 
}: ImportWorkflowDialogProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Call import API
      const response = await fetch('/api/workflows/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.template) {
        console.log('[ImportDialog] Import successful, storing template...');
        // Store template in sessionStorage
        sessionStorage.setItem('importedTemplate', JSON.stringify(result.template));
        console.log('[ImportDialog] Template stored in sessionStorage');
        
        // Navigate to build page with import parameter
        const params = new URLSearchParams();
        if (currentScenarioId) {
          params.set('sid', currentScenarioId.toString());
        }
        params.set('import', 'session');
        
        const navigateUrl = `/build?${params.toString()}`;
        console.log('[ImportDialog] Navigating to:', navigateUrl);
        router.push(navigateUrl);
        onClose();
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import workflow');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Workflow</DialogTitle>
          <DialogDescription>
            Upload a workflow JSON file from Make.com, Zapier, or n8n to convert it to Apicus format
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Upload a workflow JSON file from Make.com, Zapier, or n8n
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
              id="workflow-file-input"
            />
            <label htmlFor="workflow-file-input">
              <Button
                variant="outline"
                disabled={isImporting}
                className="mt-4"
                asChild
              >
                <span>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Select File'
                  )}
                </span>
              </Button>
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 