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

  const showRegenerateButton = connectedNodes.length > 0 && !!onRegenerate;
  const shouldShowButton = showRegenerateButton && (regenerateNeeded || hasChanges);

  const sectionContent = isSubject ? (
    <div className={cn(
      "relative bg-primary text-primary-foreground p-4 rounded-t-lg group",
      hasChanges && "ring-2 ring-orange-400 ring-inset",
      regenerateNeeded && "ring-2 ring-orange-500 ring-inset bg-orange-600",
      className
    )}>
      {/* Connection handles positioned within the node */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${sectionId}-left`}
        className={cn(
          "!absolute !w-4 !h-4 !border-2 !left-2 !z-10",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-110 transition-transform cursor-crosshair",
          "shadow-sm hover:shadow-md"
        )}
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id={`${sectionId}-right`}
        className={cn(
          "!absolute !w-4 !h-4 !border-2 !right-2 !z-10",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-110 transition-transform cursor-crosshair",
          "shadow-sm hover:shadow-md"
        )}
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      
      {/* Content layout with regenerate button inline */}
      <div className="flex items-center gap-2 pl-8 pr-8">
        {shouldShowButton && (
          <button
            onClick={onRegenerate}
            className={cn(
              "flex-shrink-0 transition-all duration-200",
              "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md",
              "bg-white/20 hover:bg-white/30 border border-white/30",
              "text-white hover:text-white",
              "shadow-sm hover:shadow-md",
              regenerateNeeded ? [
                "opacity-100 bg-orange-500 hover:bg-orange-600 animate-pulse",
                "border-orange-400 text-white font-bold",
                "shadow-lg hover:shadow-xl"
              ] : [
                "opacity-0 group-hover:opacity-100"
              ]
            )}
            title={regenerateNeeded ? "Section needs updating due to context changes" : "Regenerate this section"}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {regenerateNeeded ? 'Update Now' : 'Regenerate'}
          </button>
        )}
        <h2 className="text-lg font-bold flex-1">{content}</h2>
      </div>
    </div>
  ) : (
    <div className={cn(
      "relative p-4 border-l-2 group",
      hasChanges ? "border-orange-400 bg-orange-50/50" : "border-transparent",
      regenerateNeeded && "border-orange-500 bg-orange-100/70",
      className
    )}>
      {/* Connection handles positioned within the node */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${sectionId}-left`}
        className={cn(
          "!absolute !w-4 !h-4 !border-2 !left-2 !z-10",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-110 transition-transform cursor-crosshair",
          "shadow-sm hover:shadow-md"
        )}
        style={{ 
          top: isOptional ? '16px' : '50%',
          transform: isOptional ? 'none' : 'translateY(-50%)'
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id={`${sectionId}-right`}
        className={cn(
          "!absolute !w-4 !h-4 !border-2 !right-2 !z-10",
          isOptional ? "!bg-purple-400 !border-purple-600" : "!bg-purple-500 !border-purple-700",
          connectedNodes.length > 0 && "!bg-purple-600 animate-pulse",
          "hover:!scale-110 transition-transform cursor-crosshair",
          "shadow-sm hover:shadow-md"
        )}
        style={{ 
          top: isOptional ? '16px' : '50%',
          transform: isOptional ? 'none' : 'translateY(-50%)'
        }}
      />
      
      {/* Content layout with regenerate button inline */}
      <div className="flex items-start gap-2 pl-8 pr-8">
        {shouldShowButton && (
          <button
            onClick={onRegenerate}
            className={cn(
              "flex-shrink-0 mt-0.5 transition-all duration-200",
              "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md",
              "bg-secondary hover:bg-secondary/80 border border-border",
              "text-secondary-foreground hover:text-secondary-foreground",
              "shadow-sm hover:shadow-md",
              regenerateNeeded ? [
                "opacity-100 bg-orange-100 hover:bg-orange-200 border-orange-300",
                "text-orange-800 animate-pulse font-bold",
                "shadow-lg hover:shadow-xl"
              ] : [
                "opacity-0 group-hover:opacity-100"
              ]
            )}
            title={regenerateNeeded ? "Section needs updating due to context changes" : "Regenerate this section"}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {regenerateNeeded ? 'Update Now' : 'Regenerate'}
          </button>
        )}
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

  // Check if any sections need regeneration
  const sectionsNeedingRegeneration = sectionConnections ? 
    Object.entries(sectionConnections).filter(([_, connection]) => connection?.regenerateNeeded).length 
    : 0;

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
    <div className="relative w-[700px] h-[900px] bg-card text-card-foreground border border-border rounded-lg shadow-lg flex flex-col font-sans overflow-hidden">
      <div className="custom-drag-handle p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground cursor-move flex items-center justify-between">
        <span>{nodeTitle}</span>
        
        {/* Regeneration indicator */}
        {sectionsNeedingRegeneration > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-300 rounded-md text-orange-800">
              <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs font-medium">
                {sectionsNeedingRegeneration} section{sectionsNeedingRegeneration > 1 ? 's' : ''} need updating
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow overflow-y-auto relative">
        <div className="bg-white relative">
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
          <div className="p-6 space-y-4">
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