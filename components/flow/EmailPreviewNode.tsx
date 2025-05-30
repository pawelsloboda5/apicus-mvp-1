import React from 'react';
import { EmailTemplate, EmailTemplateProps } from './EmailTemplate';

export interface EmailPreviewNodeData extends EmailTemplateProps {
  nodeTitle?: string;
  isLoading?: boolean;
  lengthOption?: 'concise' | 'standard' | 'detailed';
  toneOption?: string;
  onOpenNodeProperties?: () => void;
  [key: string]: unknown; // Replace any with unknown
}

interface EmailPreviewNodeProps {
  id: string;
  data: EmailPreviewNodeData;
  // selected: boolean; // Add if selection styling is needed
  // type: string; // React Flow injects this
  // xPos: number;
  // yPos: number;
  // zIndex: number;
  // isConnectable: boolean;
  // dragHandle?: string;
}

export const EmailPreviewNode: React.FC<EmailPreviewNodeProps> = ({ data }) => {
  const { nodeTitle = "Generated Email Output", isLoading = false, onOpenNodeProperties, ...emailProps } = data;

  // The EmailTemplate component itself renders an iframe with srcDoc for the preview.
  // We just need to wrap it in a node structure.
  // Increased size for better readability and to prevent text cutoff
  return (
    <div className="w-[700px] h-[900px] bg-card text-card-foreground border border-border rounded-lg shadow-lg overflow-hidden flex flex-col font-sans">
      <div className="custom-drag-handle p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground cursor-move flex items-center justify-between">
        <span>{nodeTitle}</span>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span>Generating...</span>
          </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden p-2"> {/* Increased padding for better spacing */}
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                <p>AI is generating your personalized email...</p>
                <p className="text-xs mt-1">This may take a few seconds</p>
              </div>
            </div>
          </div>
        ) : (
          <EmailTemplate {...emailProps} onOpenNodeProperties={onOpenNodeProperties} />
        )}
      </div>
    </div>
  );
};

export default EmailPreviewNode; 