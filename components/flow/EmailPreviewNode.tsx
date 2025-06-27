import React, { useState, useRef, useEffect } from 'react';
import { EmailTemplateProps } from './EmailTemplate';
import { EmailSectionInlineEditor } from './EmailSectionInlineEditor';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Mail,
  User,
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';

export interface EmailPreviewNodeData extends EmailTemplateProps {
  nodeTitle?: string;
  isLoading?: boolean;
  globalLengthOption?: 'concise' | 'standard' | 'detailed';
  globalToneOption?: string;
  onRegenerateSection?: (section: string, promptType: string, tone: string, length: 'concise' | 'standard' | 'detailed') => Promise<void>;
  onGenerateFullEmail?: (tone: string, length: 'concise' | 'standard' | 'detailed') => Promise<void>;
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
  // Section-specific settings
  sectionSettings?: {
    [key: string]: { tone: string; length: string };
  };
  [key: string]: unknown;
}

interface EmailPreviewNodeProps {
  id: string;
  data: EmailPreviewNodeData;
}

// Global tone and length options
const GLOBAL_TONE_OPTIONS = [
  { value: 'professional_warm', label: 'Professional & Warm', icon: '🤝' },
  { value: 'casual_friendly', label: 'Casual & Friendly', icon: '😊' },
  { value: 'direct_results', label: 'Direct & Results-Driven', icon: '🎯' },
  { value: 'consultative_helpful', label: 'Consultative & Helpful', icon: '💡' },
];

const GLOBAL_LENGTH_OPTIONS = [
  { value: 'concise', label: 'Concise', icon: '📄' },
  { value: 'standard', label: 'Standard', icon: '📋' },
  { value: 'detailed', label: 'Detailed', icon: '📚' },
];

export const EmailPreviewNode: React.FC<EmailPreviewNodeProps> = ({ data }) => {
  const { 
    nodeTitle = "Generated Email Output", 
    isLoading = false, 
    onRegenerateSection,
    onGenerateFullEmail,
    sectionConnections,
    sectionSettings = {},
    globalToneOption = 'professional_warm',
    globalLengthOption = 'standard',
    ...emailProps 
  } = data;

  // State management
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(nodeTitle);
  const [globalTone, setGlobalTone] = useState(globalToneOption);
  const [globalLength, setGlobalLength] = useState<'concise' | 'standard' | 'detailed'>(globalLengthOption);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isGeneratingFullEmail, setIsGeneratingFullEmail] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Details form state
  const [yourName, setYourName] = useState(emailProps.yourName || '');
  const [yourCompany, setYourCompany] = useState(emailProps.yourCompany || '');
  const [yourEmail, setYourEmail] = useState(emailProps.yourEmail || '');
  const [firstName, setFirstName] = useState(emailProps.firstName || '');
  const [calendlyLink, setCalendlyLink] = useState(emailProps.calendlyLink || '');
  const [pdfLink, setPdfLink] = useState(emailProps.pdfLink || '');

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const handleTitleSave = () => {
    setEditingTitle(false);
    // TODO: Update node data with new title
  };

  const handleSectionContentChange = (sectionId: string, content: string) => {
    // TODO: Update node data with new content
    console.log('Section content changed:', sectionId, content);
  };

  const handleSectionRegenerate = async (
    sectionId: string, 
    promptType: string, 
    tone: string, 
    length: string
  ) => {
    if (onRegenerateSection) {
      await onRegenerateSection(sectionId, promptType, tone, length as 'concise' | 'standard' | 'detailed');
    }
  };

  const handleGenerateFullEmail = async () => {
    if (onGenerateFullEmail) {
      setIsGeneratingFullEmail(true);
      try {
        await onGenerateFullEmail(globalTone, globalLength);
      } finally {
        setIsGeneratingFullEmail(false);
      }
    }
  };

  const handleCopyHtml = () => {
    // TODO: Generate and copy HTML
    console.log('Copy HTML');
  };

  const handleDownload = () => {
    // TODO: Generate and download HTML
    console.log('Download HTML');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-[800px] h-[600px] bg-card text-card-foreground border border-border rounded-lg shadow-lg overflow-visible flex flex-col font-sans">
        <div className="p-3 bg-muted/50 border-b border-border text-sm font-semibold text-foreground flex items-center justify-between">
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

  return (
    <div className="relative w-[800px] min-h-[600px] bg-card text-card-foreground border border-border rounded-lg shadow-lg flex flex-col font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="p-3 bg-muted/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {editingTitle ? (
            <Input
              ref={titleInputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setTitleValue(nodeTitle);
                  setEditingTitle(false);
                }
              }}
              className="h-6 text-sm flex-1"
            />
          ) : (
            <h3 
              className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors flex-1"
              onClick={() => setEditingTitle(true)}
            >
              {nodeTitle}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopyHtml}
            title="Copy HTML"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            title="Download HTML"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Global Controls Bar */}
      <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Email Settings:</span>
          
          {/* Global Tone Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                {GLOBAL_TONE_OPTIONS.find(t => t.value === globalTone)?.icon}
                <span className="ml-1">{GLOBAL_TONE_OPTIONS.find(t => t.value === globalTone)?.label}</span>
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-xs">Global Email Tone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GLOBAL_TONE_OPTIONS.map(tone => (
                <DropdownMenuItem
                  key={tone.value}
                  onClick={() => setGlobalTone(tone.value)}
                  className={cn("text-xs", globalTone === tone.value && "font-semibold")}
                >
                  <span className="mr-2">{tone.icon}</span>
                  {tone.label}
                  {globalTone === tone.value && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Length Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                {GLOBAL_LENGTH_OPTIONS.find(l => l.value === globalLength)?.icon}
                <span className="ml-1">{GLOBAL_LENGTH_OPTIONS.find(l => l.value === globalLength)?.label}</span>
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-xs">Global Email Length</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GLOBAL_LENGTH_OPTIONS.map(length => (
                <DropdownMenuItem
                  key={length.value}
                  onClick={() => setGlobalLength(length.value as 'concise' | 'standard' | 'detailed')}
                  className={cn("text-xs", globalLength === length.value && "font-semibold")}
                >
                  <span className="mr-2">{length.icon}</span>
                  {length.label}
                  {globalLength === length.value && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Generate Full Email Button */}
        <Button
          variant="default"
          size="sm"
          className="h-7"
          onClick={handleGenerateFullEmail}
          disabled={isGeneratingFullEmail}
        >
          {isGeneratingFullEmail ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              Generate All Sections
            </>
          )}
        </Button>
      </div>

      {/* Email Sections */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Subject Line */}
        <EmailSectionInlineEditor
          sectionId="subject"
          sectionLabel="Subject Line"
          content={emailProps.subjectLine || ''}
          isVisible={emailProps.showSubject !== false}
          connectedNodes={sectionConnections?.subject?.connectedNodeIds}
          hasChanges={sectionConnections?.subject?.hasChanges}
          regenerateNeeded={sectionConnections?.subject?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle subject:', visible)}
          onContentChange={(content) => handleSectionContentChange('subject', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('subject', promptType, tone, length)}
          defaultTone={sectionSettings?.subject?.tone || globalTone}
          defaultLength={sectionSettings?.subject?.length || globalLength}
        />

        {/* Greeting */}
        <div className="text-sm text-muted-foreground">
          Hi {firstName || '[FIRST NAME]'},
        </div>

        {/* Hook */}
        <EmailSectionInlineEditor
          sectionId="hook"
          sectionLabel="Hook Text"
          content={emailProps.hookText || ''}
          isVisible={emailProps.showHook !== false}
          connectedNodes={sectionConnections?.hook?.connectedNodeIds}
          hasChanges={sectionConnections?.hook?.hasChanges}
          regenerateNeeded={sectionConnections?.hook?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle hook:', visible)}
          onContentChange={(content) => handleSectionContentChange('hook', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('hook', promptType, tone, length)}
          defaultTone={sectionSettings?.hook?.tone || globalTone}
          defaultLength={sectionSettings?.hook?.length || globalLength}
        />

        {/* Testimonial (Optional) */}
        <EmailSectionInlineEditor
          sectionId="testimonial"
          sectionLabel="Testimonial"
          content={emailProps.testimonialText || ''}
          isVisible={emailProps.showTestimonial === true}
          isOptional={true}
          connectedNodes={sectionConnections?.testimonial?.connectedNodeIds}
          hasChanges={sectionConnections?.testimonial?.hasChanges}
          regenerateNeeded={sectionConnections?.testimonial?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle testimonial:', visible)}
          onContentChange={(content) => handleSectionContentChange('testimonial', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('testimonial', promptType, tone, length)}
          defaultTone={sectionSettings?.testimonial?.tone || globalTone}
          defaultLength={sectionSettings?.testimonial?.length || globalLength}
        />

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
        <EmailSectionInlineEditor
          sectionId="cta"
          sectionLabel="Call to Action"
          content={emailProps.ctaText || ''}
          isVisible={emailProps.showCTA !== false}
          connectedNodes={sectionConnections?.cta?.connectedNodeIds}
          hasChanges={sectionConnections?.cta?.hasChanges}
          regenerateNeeded={sectionConnections?.cta?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle cta:', visible)}
          onContentChange={(content) => handleSectionContentChange('cta', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('cta', promptType, tone, length)}
          defaultTone={sectionSettings?.cta?.tone || globalTone}
          defaultLength={sectionSettings?.cta?.length || globalLength}
        />

        {/* Urgency (Optional) */}
        <EmailSectionInlineEditor
          sectionId="urgency"
          sectionLabel="Urgency Line"
          content={emailProps.urgencyText || ''}
          isVisible={emailProps.showUrgency === true}
          isOptional={true}
          connectedNodes={sectionConnections?.urgency?.connectedNodeIds}
          hasChanges={sectionConnections?.urgency?.hasChanges}
          regenerateNeeded={sectionConnections?.urgency?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle urgency:', visible)}
          onContentChange={(content) => handleSectionContentChange('urgency', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('urgency', promptType, tone, length)}
          defaultTone={sectionSettings?.urgency?.tone || globalTone}
          defaultLength={sectionSettings?.urgency?.length || globalLength}
        />

        {/* Offer */}
        <EmailSectionInlineEditor
          sectionId="offer"
          sectionLabel="Offer Text"
          content={emailProps.offerText || ''}
          isVisible={emailProps.showOffer !== false}
          connectedNodes={sectionConnections?.offer?.connectedNodeIds}
          hasChanges={sectionConnections?.offer?.hasChanges}
          regenerateNeeded={sectionConnections?.offer?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle offer:', visible)}
          onContentChange={(content) => handleSectionContentChange('offer', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('offer', promptType, tone, length)}
          defaultTone={sectionSettings?.offer?.tone || globalTone}
          defaultLength={sectionSettings?.offer?.length || globalLength}
        />

        {/* Signature */}
        <div className="mt-6 space-y-1 text-sm">
          <p>Best,</p>
          <p className="font-semibold">{yourName || '[YOUR NAME]'}</p>
          <p className="text-muted-foreground">
            Automation Consultant, {yourCompany || '[YOUR COMPANY]'}<br/>
            <a href={`mailto:${yourEmail}`} className="text-primary">
              {yourEmail || '[YOUR_EMAIL]'}
            </a> | <a href={calendlyLink} className="text-primary">Book 15 min</a>
          </p>
        </div>

        {/* PS (Optional) */}
        <EmailSectionInlineEditor
          sectionId="ps"
          sectionLabel="PS Line"
          content={emailProps.psText || ''}
          isVisible={emailProps.showPS !== false}
          isOptional={true}
          connectedNodes={sectionConnections?.ps?.connectedNodeIds}
          hasChanges={sectionConnections?.ps?.hasChanges}
          regenerateNeeded={sectionConnections?.ps?.regenerateNeeded}
          onToggleVisibility={(visible) => console.log('Toggle ps:', visible)}
          onContentChange={(content) => handleSectionContentChange('ps', content)}
          onRegenerateSection={(promptType, tone, length) => handleSectionRegenerate('ps', promptType, tone, length)}
          defaultTone={sectionSettings?.ps?.tone || globalTone}
          defaultLength={sectionSettings?.ps?.length || globalLength}
        />
      </div>

      {/* Collapsible Details Panel */}
      <div className={cn(
        "border-t bg-muted/30 transition-all duration-300",
        detailsExpanded ? "h-48" : "h-10"
      )}>
        <button
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full p-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            <User className="h-3 w-3" />
            <span>Your Details & Recipient Info</span>
          </div>
          {detailsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        
        {detailsExpanded && (
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">Your Details</h4>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="yourName" className="text-xs w-20">Name:</Label>
                  <Input
                    id="yourName"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="yourCompany" className="text-xs w-20">Company:</Label>
                  <Input
                    id="yourCompany"
                    value={yourCompany}
                    onChange={(e) => setYourCompany(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="yourEmail" className="text-xs w-20">Email:</Label>
                  <Input
                    id="yourEmail"
                    value={yourEmail}
                    onChange={(e) => setYourEmail(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="jane@acme.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">Recipient & Links</h4>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="firstName" className="text-xs w-20">First Name:</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="John"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="calendlyLink" className="text-xs w-20">Calendly:</Label>
                  <Input
                    id="calendlyLink"
                    value={calendlyLink}
                    onChange={(e) => setCalendlyLink(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="https://calendly.com/..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="pdfLink" className="text-xs w-20">PDF Link:</Label>
                  <Input
                    id="pdfLink"
                    value={pdfLink}
                    onChange={(e) => setPdfLink(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="https://example.com/roi.pdf"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreviewNode; 