import React from 'react';
import { EmailTemplate, EmailTemplateProps } from './EmailTemplate';

export interface EmailPreviewNodeData extends EmailTemplateProps {
  nodeTitle?: string;
  [key: string]: any; // Add index signature
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
  const { nodeTitle = "Generated Email Output", ...emailProps } = data;

  // The EmailTemplate component itself renders an iframe with srcDoc for the preview.
  // We just need to wrap it in a node structure.
  // Fixed width similar to an email, height can be fixed or adjusted.
  // Let's use a fixed height with internal scrolling in EmailTemplate's iframe.
  return (
    <div className="w-[600px] h-[750px] bg-card text-card-foreground border border-border rounded-lg shadow-lg overflow-hidden flex flex-col font-sans">
      <div className="custom-drag-handle p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground cursor-move">
        {nodeTitle}
      </div>
      <div className="flex-grow overflow-hidden p-1"> {/* Added slight padding around iframe container */}
        <EmailTemplate {...emailProps} />
      </div>
    </div>
  );
};

export default EmailPreviewNode; 