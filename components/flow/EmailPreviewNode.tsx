import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { EmailTemplate, EmailTemplateProps } from './EmailTemplate';
import { cn } from '@/lib/utils';

export interface EmailPreviewNodeData extends EmailTemplateProps {
  nodeTitle?: string;
  isLoading?: boolean;
  lengthOption?: 'concise' | 'standard' | 'detailed';
  toneOption?: string;
  onOpenNodeProperties?: () => void;
  onRegenerateSection?: (section: string) => void;
  // Email section connections
  sectionConnections?: {
    subject?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    hook?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    cta?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    offer?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    ps?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    testimonial?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
    urgency?: { connectedNodeIds: string[]; hasChanges?: boolean; regenerateNeeded?: boolean };
  };
  [key: string]: unknown;
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

// Email section component with handle
const EmailSection: React.FC<{
  sectionId: string;
  title: string;
  content: string | undefined;
  isVisible: boolean;
  isOptional?: boolean;
  connectedNodes?: string[];
  hasChanges?: boolean;
  regenerateNeeded?: boolean;
  onRegenerate?: () => void;
  className?: string;
  isSubject?: boolean;
}> = ({ sectionId, title, content, isVisible, isOptional = false, connectedNodes = [], hasChanges = false, regenerateNeeded = false, onRegenerate, className, isSubject = false }) => {
  if (!isVisible || !content) return null;

  // Debug logging
  console.log(`[EmailSection ${sectionId}]`, {
    connectedNodes: connectedNodes.length,
    hasChanges,
    regenerateNeeded,
    hasOnRegenerate: !!onRegenerate,
    showButton: connectedNodes.length > 0 && !!onRegenerate
  });

  const sectionContent = isSubject ? (
    <div className={cn(
      "relative bg-primary text-primary-foreground p-4 rounded-t-lg overflow-visible",
      hasChanges && "ring-2 ring-orange-400 ring-inset",
      className
    )}>
      {/* Left handle - positioned to extend outside */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${sectionId}-left`}
        className={cn(
          "!absolute !w-6 !h-6 !border-[3px] !-left-3 !z-50",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-125 transition-transform cursor-crosshair",
          "shadow-[0_0_0_3px_rgba(168,85,247,0.2)] hover:shadow-[0_0_0_5px_rgba(168,85,247,0.4)]"
        )}
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      {/* Right handle - positioned to extend outside */}
      <Handle
        type="target"
        position={Position.Right}
        id={`${sectionId}-right`}
        className={cn(
          "!absolute !w-6 !h-6 !border-[3px] !-right-3 !z-50",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-125 transition-transform cursor-crosshair",
          "shadow-[0_0_0_3px_rgba(168,85,247,0.2)] hover:shadow-[0_0_0_5px_rgba(168,85,247,0.4)]"
        )}
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{content}</h2>
      </div>
    </div>
  ) : (
    <div className={cn(
      "relative p-4 border-l-2 overflow-visible",
      hasChanges ? "border-orange-400 bg-orange-50/50" : "border-transparent",
      className
    )}>
      {/* Left handle - positioned to extend outside */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${sectionId}-left`}
        className={cn(
          "!absolute !w-6 !h-6 !border-[3px] !-left-3 !z-50",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-125 transition-transform cursor-crosshair",
          "shadow-[0_0_0_3px_rgba(168,85,247,0.2)] hover:shadow-[0_0_0_5px_rgba(168,85,247,0.4)]"
        )}
        style={{ 
          top: isOptional ? '12px' : '50%',
          transform: isOptional ? 'none' : 'translateY(-50%)'
        }}
      />
      {/* Right handle - positioned to extend outside */}
      <Handle
        type="target"
        position={Position.Right}
        id={`${sectionId}-right`}
        className={cn(
          "!absolute !w-6 !h-6 !border-[3px] !-right-3 !z-50",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-125 transition-transform cursor-crosshair",
          "shadow-[0_0_0_3px_rgba(168,85,247,0.2)] hover:shadow-[0_0_0_5px_rgba(168,85,247,0.4)]"
        )}
        style={{ 
          top: isOptional ? '12px' : '50%',
          transform: isOptional ? 'none' : 'translateY(-50%)'
        }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {title && <h3 className="text-xs font-semibold text-muted-foreground mb-1">{title}</h3>}
          <div 
            className="text-sm text-foreground" 
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );

  return sectionContent;
};

export const EmailPreviewNode: React.FC<EmailPreviewNodeProps> = ({ data }) => {
  const { 
    nodeTitle = "Generated Email Output", 
    isLoading = false, 
    onOpenNodeProperties,
    onRegenerateSection,
    sectionConnections,
    ...emailProps 
  } = data;

  // Loading state
  if (isLoading) {
    return (
      <div className="w-[700px] h-[900px] bg-card text-card-foreground border border-border rounded-lg shadow-lg overflow-visible flex flex-col font-sans">
        <div className="custom-drag-handle p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground cursor-move flex items-center justify-between">
          <span>{nodeTitle}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span>Generating...</span>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
            <div className="text-sm text-muted-foreground">
              <p>AI is generating your personalized email...</p>
              <p className="text-xs mt-1">This may take a few seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Email preview with sections
  return (
    <div className="relative w-[700px] h-[900px] bg-card text-card-foreground border border-border rounded-lg shadow-lg flex flex-col font-sans" style={{ overflow: 'visible' }}>
      <div className="custom-drag-handle p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground cursor-move">
        <span>{nodeTitle}</span>
      </div>
      
      <div className="flex-grow overflow-y-auto relative">
        <div className="bg-white relative" style={{ overflow: 'visible' }}>
          {/* Subject Line */}
          <EmailSection
            sectionId="subject"
            title=""
            content={emailProps.subjectLine}
            isVisible={emailProps.showSubject !== false}
            connectedNodes={sectionConnections?.subject?.connectedNodeIds}
            hasChanges={sectionConnections?.subject?.hasChanges}
            regenerateNeeded={sectionConnections?.subject?.regenerateNeeded}
            onRegenerate={onRegenerateSection ? () => onRegenerateSection('subject') : undefined}
            isSubject={true}
          />
          
          {/* Email Body */}
          <div className="p-6 space-y-4 overflow-visible">
            {/* Greeting */}
            <p className="text-sm">Hi {emailProps.firstName || '[FIRST NAME]'},</p>
            
            {/* Hook */}
            <EmailSection
              sectionId="hook"
              title=""
              content={emailProps.hookText}
              isVisible={emailProps.showHook !== false}
              connectedNodes={sectionConnections?.hook?.connectedNodeIds}
              hasChanges={sectionConnections?.hook?.hasChanges}
              regenerateNeeded={sectionConnections?.hook?.regenerateNeeded}
              onRegenerate={onRegenerateSection ? () => onRegenerateSection('hook') : undefined}
              className="-mx-6 px-6"
            />
            
            {/* Testimonial */}
            {emailProps.showTestimonial && emailProps.testimonialText && (
              <EmailSection
                sectionId="testimonial"
                title=""
                content={`<div class="bg-muted/20 border-l-4 border-primary p-3 italic">${emailProps.testimonialText}</div>`}
                isVisible={true}
                isOptional={true}
                connectedNodes={sectionConnections?.testimonial?.connectedNodeIds}
                hasChanges={sectionConnections?.testimonial?.hasChanges}
                regenerateNeeded={sectionConnections?.testimonial?.regenerateNeeded}
                onRegenerate={onRegenerateSection ? () => onRegenerateSection('testimonial') : undefined}
                className="-mx-6 px-6"
              />
            )}
            
            {/* ROI Stats */}
            {emailProps.stats && (
              <div className="flex justify-center gap-3 my-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{emailProps.stats.roiX || 0}×</div>
                  <div className="text-xs text-muted-foreground">ROI</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{emailProps.stats.payback || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">Payback</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{emailProps.stats.runs || 0}</div>
                  <div className="text-xs text-muted-foreground">Runs/mo</div>
                </div>
              </div>
            )}
            
            {/* CTA */}
            <EmailSection
              sectionId="cta"
              title=""
              content={emailProps.ctaText ? `${emailProps.ctaText}<br/><a href="${emailProps.pdfLink}" class="text-primary font-bold">Download the ROI snapshot →</a>` : undefined}
              isVisible={emailProps.showCTA !== false}
              connectedNodes={sectionConnections?.cta?.connectedNodeIds}
              hasChanges={sectionConnections?.cta?.hasChanges}
              regenerateNeeded={sectionConnections?.cta?.regenerateNeeded}
              onRegenerate={onRegenerateSection ? () => onRegenerateSection('cta') : undefined}
              className="-mx-6 px-6"
            />
            
            {/* Urgency */}
            {emailProps.showUrgency && emailProps.urgencyText && (
              <EmailSection
                sectionId="urgency"
                title=""
                content={`<div class="text-center text-destructive font-medium">${emailProps.urgencyText}</div>`}
                isVisible={true}
                isOptional={true}
                connectedNodes={sectionConnections?.urgency?.connectedNodeIds}
                hasChanges={sectionConnections?.urgency?.hasChanges}
                regenerateNeeded={sectionConnections?.urgency?.regenerateNeeded}
                onRegenerate={onRegenerateSection ? () => onRegenerateSection('urgency') : undefined}
                className="-mx-6 px-6"
              />
            )}
            
            {/* Offer */}
            <EmailSection
              sectionId="offer"
              title=""
              content={emailProps.offerText}
              isVisible={emailProps.showOffer !== false}
              connectedNodes={sectionConnections?.offer?.connectedNodeIds}
              hasChanges={sectionConnections?.offer?.hasChanges}
              regenerateNeeded={sectionConnections?.offer?.regenerateNeeded}
              onRegenerate={onRegenerateSection ? () => onRegenerateSection('offer') : undefined}
              className="-mx-6 px-6"
            />
            
            {/* Signature */}
            <div className="mt-6 space-y-1 text-sm">
              <p>Best,</p>
              <p className="font-semibold">{emailProps.yourName || '[YOUR NAME]'}</p>
              <p className="text-muted-foreground">
                Automation Consultant, {emailProps.yourCompany || '[YOUR COMPANY]'}<br/>
                <a href={`mailto:${emailProps.yourEmail}`} className="text-primary">
                  {emailProps.yourEmail || '[YOUR_EMAIL]'}
                </a> | <a href={emailProps.calendlyLink} className="text-primary">Book 15 min</a>
              </p>
            </div>
            
            {/* PS */}
            {emailProps.showPS && emailProps.psText && (
              <EmailSection
                sectionId="ps"
                title=""
                content={`<i class="text-muted-foreground">${emailProps.psText}</i>`}
                isVisible={true}
                isOptional={true}
                connectedNodes={sectionConnections?.ps?.connectedNodeIds}
                hasChanges={sectionConnections?.ps?.hasChanges}
                regenerateNeeded={sectionConnections?.ps?.regenerateNeeded}
                onRegenerate={onRegenerateSection ? () => onRegenerateSection('ps') : undefined}
                className="-mx-6 px-6 pt-4 border-t"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewNode; 