"use client";

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailPreviewNodeData } from '../../EmailPreviewNode';
import { Node } from '@xyflow/react';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

// Import sub-components
import { EmailSectionEditor, AI_PROMPT_OPTIONS } from './EmailSectionEditor';
import { EmailContextSelector, EmailContextNode } from './EmailContextSelector';
import { EmailDetailsForm } from './EmailDetailsForm';

interface EmailNodePropertiesPanelProps {
  selectedNode: Node<EmailPreviewNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<EmailPreviewNodeData>) => void;
  onGenerateSection: (
    nodeId: string,
    section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
    promptType: string,
    currentText: string,
    selectedContextNodes?: string[]
  ) => Promise<void>;
  isGeneratingAIContent: boolean;
  emailContextNodes?: EmailContextNode[];
}

export function EmailNodePropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onGenerateSection,
  isGeneratingAIContent,
  emailContextNodes,
}: EmailNodePropertiesPanelProps) {
  const [formData, setFormData] = useState<Partial<EmailPreviewNodeData>>({});
  const [selectedLength, setSelectedLength] = useState<'concise' | 'standard' | 'detailed'>('standard');
  const [selectedTone, setSelectedTone] = useState<string>('professional_warm');
  const [selectedContextNodes, setSelectedContextNodes] = useState<Set<string>>(new Set());

  // Initialize selected context nodes with smart defaults
  useEffect(() => {
    if (emailContextNodes && emailContextNodes.length > 0 && selectedContextNodes.size === 0) {
      // Select ALL email context nodes by default
      const allNodeIds = new Set<string>(emailContextNodes.map(n => n.id));
      setSelectedContextNodes(allNodeIds);
    }
  }, [emailContextNodes, selectedContextNodes.size]);

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
      // Set length from node data if available
      if ((selectedNode.data as EmailPreviewNodeData & { lengthOption?: string })?.lengthOption) {
        setSelectedLength((selectedNode.data as EmailPreviewNodeData & { lengthOption?: string }).lengthOption as 'concise' | 'standard' | 'detailed');
      }
      // Set tone from node data if available
      if ((selectedNode.data as EmailPreviewNodeData & { toneOption?: string })?.toneOption) {
        setSelectedTone((selectedNode.data as EmailPreviewNodeData & { toneOption?: string }).toneOption || 'professional_warm');
      }
    } else {
      setFormData({});
    }
  }, [selectedNode]);

  const handleInputChange = (
    field: keyof EmailPreviewNodeData | string,
    value: string | boolean
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update immediately for real-time preview
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { [field]: value });
    }
  };

  const handleGenerateSection = (
    section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency',
    promptType: string
  ) => {
    if (!selectedNode) return;
    
    const fieldMap: Record<string, keyof EmailPreviewNodeData> = {
      subject: 'subjectLine',
      hook: 'hookText',
      cta: 'ctaText',
      offer: 'offerText',
      ps: 'psText',
      testimonial: 'testimonialText',
      urgency: 'urgencyText',
    };
    
    const fieldKey = fieldMap[section];
    const currentText = formData[fieldKey] as string || '';
    
    onGenerateSection(
      selectedNode.id,
      section,
      promptType,
      currentText,
      Array.from(selectedContextNodes)
    );
  };

  if (!selectedNode) {
    return null;
  }

  return (
    <Sheet
      open={!!selectedNode}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent 
        side="right" 
        className="w-[480px] sm:w-[540px] flex flex-col p-0 h-screen max-h-screen overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="text-xl">Edit Email Content</SheetTitle>
          <SheetDescription>
            Modify the details for your generated email. Changes update in real-time.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Email Details Form */}
              <EmailDetailsForm 
                formData={formData}
                onChange={handleInputChange}
              />
              
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-muted-foreground">Email Content (AI Assisted)</h4>
                
                {/* Global Tone Selector */}
                <div className="space-y-2 p-3 bg-muted/20 rounded-md">
                  <Label htmlFor="tone" className="text-sm font-medium">
                    Overall Email Tone
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between" 
                        disabled={isGeneratingAIContent}
                      >
                        <span>{AI_PROMPT_OPTIONS.tone.find(opt => opt.value === selectedTone)?.label || 'Professional & Warm'}</span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {AI_PROMPT_OPTIONS.tone.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          disabled={isGeneratingAIContent}
                          onSelect={() => {
                            setSelectedTone(opt.value);
                            if (selectedNode) {
                              onUpdateNodeData(selectedNode.id, { 
                                ...(selectedNode.data as EmailPreviewNodeData),
                                toneOption: opt.value 
                              } as Partial<EmailPreviewNodeData>);
                            }
                          }}
                        >
                          <Check 
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTone === opt.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sets the overall writing style for all email sections
                  </p>
                </div>

                {/* Global Length Selector */}
                <div className="space-y-2 p-3 bg-muted/20 rounded-md">
                  <Label htmlFor="length" className="text-sm font-medium">
                    Content Length
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between" 
                        disabled={isGeneratingAIContent}
                      >
                        <span>{AI_PROMPT_OPTIONS.length.find(opt => opt.value === selectedLength)?.label || 'Standard'}</span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {AI_PROMPT_OPTIONS.length.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          disabled={isGeneratingAIContent}
                          onSelect={() => {
                            setSelectedLength(opt.value as 'concise' | 'standard' | 'detailed');
                            if (selectedNode) {
                              onUpdateNodeData(selectedNode.id, { 
                                ...(selectedNode.data as EmailPreviewNodeData),
                                lengthOption: opt.value 
                              } as Partial<EmailPreviewNodeData>);
                            }
                          }}
                        >
                          <Check 
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLength === opt.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls the length of generated content sections
                  </p>
                </div>
                
                {/* Email Context Selection */}
                {emailContextNodes && (
                  <EmailContextSelector
                    emailContextNodes={emailContextNodes}
                    selectedContextNodes={selectedContextNodes}
                    onSelectionChange={setSelectedContextNodes}
                  />
                )}
                
                <div className="space-y-6">
                  {/* Core sections */}
                  <EmailSectionEditor
                    sectionName="Subject Line"
                    fieldKey="subjectLine"
                    value={formData.subjectLine || ''}
                    isEnabled={true}
                    showToggle={true}
                    toggleValue={formData.showSubject !== false}
                    onToggleChange={(checked) => handleInputChange('showSubject', checked)}
                    onChange={(value) => handleInputChange('subjectLine', value)}
                    onGenerateSection={(promptType) => handleGenerateSection('subject', promptType)}
                    isGenerating={isGeneratingAIContent}
                    promptOptions={AI_PROMPT_OPTIONS.subject}
                    selectedLength={selectedLength}
                    selectedTone={selectedTone}
                    isSubjectLine={true}
                  />

                  <EmailSectionEditor
                    sectionName="Hook Text"
                    fieldKey="hookText"
                    value={formData.hookText || ''}
                    isEnabled={true}
                    showToggle={true}
                    toggleValue={formData.showHook !== false}
                    onToggleChange={(checked) => handleInputChange('showHook', checked)}
                    onChange={(value) => handleInputChange('hookText', value)}
                    onGenerateSection={(promptType) => handleGenerateSection('hook', promptType)}
                    isGenerating={isGeneratingAIContent}
                    promptOptions={AI_PROMPT_OPTIONS.hook}
                    selectedLength={selectedLength}
                    selectedTone={selectedTone}
                    rows={5}
                  />

                  <EmailSectionEditor
                    sectionName="CTA Text"
                    fieldKey="ctaText"
                    value={formData.ctaText || ''}
                    isEnabled={true}
                    showToggle={true}
                    toggleValue={formData.showCTA !== false}
                    onToggleChange={(checked) => handleInputChange('showCTA', checked)}
                    onChange={(value) => handleInputChange('ctaText', value)}
                    onGenerateSection={(promptType) => handleGenerateSection('cta', promptType)}
                    isGenerating={isGeneratingAIContent}
                    promptOptions={AI_PROMPT_OPTIONS.cta}
                    selectedLength={selectedLength}
                    selectedTone={selectedTone}
                    rows={3}
                  />

                  <EmailSectionEditor
                    sectionName="Offer Text"
                    fieldKey="offerText"
                    value={formData.offerText || ''}
                    isEnabled={true}
                    showToggle={true}
                    toggleValue={formData.showOffer !== false}
                    onToggleChange={(checked) => handleInputChange('showOffer', checked)}
                    onChange={(value) => handleInputChange('offerText', value)}
                    onGenerateSection={(promptType) => handleGenerateSection('offer', promptType)}
                    isGenerating={isGeneratingAIContent}
                    promptOptions={AI_PROMPT_OPTIONS.offer}
                    selectedLength={selectedLength}
                    selectedTone={selectedTone}
                    rows={4}
                  />
                  
                  {/* Optional sections with toggles */}
                  <div className="pt-4 border-t">
                    <h5 className="text-sm font-medium mb-4 text-muted-foreground">Optional Sections</h5>
                    <div className="space-y-6">
                      <EmailSectionEditor
                        sectionName="PS Line"
                        fieldKey="psText"
                        value={formData.psText || ''}
                        isEnabled={true}
                        showToggle={true}
                        toggleValue={formData.showPS !== false}
                        onToggleChange={(checked) => handleInputChange('showPS', checked)}
                        onChange={(value) => handleInputChange('psText', value)}
                        onGenerateSection={(promptType) => handleGenerateSection('ps', promptType)}
                        isGenerating={isGeneratingAIContent}
                        promptOptions={AI_PROMPT_OPTIONS.ps}
                        selectedLength={selectedLength}
                        selectedTone={selectedTone}
                        rows={2}
                      />

                      <EmailSectionEditor
                        sectionName="Testimonial"
                        fieldKey="testimonialText"
                        value={formData.testimonialText || ''}
                        isEnabled={true}
                        showToggle={true}
                        toggleValue={formData.showTestimonial !== false}
                        onToggleChange={(checked) => handleInputChange('showTestimonial', checked)}
                        onChange={(value) => handleInputChange('testimonialText', value)}
                        onGenerateSection={(promptType) => handleGenerateSection('testimonial', promptType)}
                        isGenerating={isGeneratingAIContent}
                        promptOptions={AI_PROMPT_OPTIONS.testimonial}
                        selectedLength={selectedLength}
                        selectedTone={selectedTone}
                        rows={3}
                      />

                      <EmailSectionEditor
                        sectionName="Urgency Line"
                        fieldKey="urgencyText"
                        value={formData.urgencyText || ''}
                        isEnabled={true}
                        showToggle={true}
                        toggleValue={formData.showUrgency !== false}
                        onToggleChange={(checked) => handleInputChange('showUrgency', checked)}
                        onChange={(value) => handleInputChange('urgencyText', value)}
                        onGenerateSection={(promptType) => handleGenerateSection('urgency', promptType)}
                        isGenerating={isGeneratingAIContent}
                        promptOptions={AI_PROMPT_OPTIONS.urgency}
                        selectedLength={selectedLength}
                        selectedTone={selectedTone}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add some bottom padding to ensure last element is fully visible */}
              <div className="h-6"></div>
            </div>
          </ScrollArea>
        </div>
        
        <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 