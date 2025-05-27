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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailPreviewNodeData } from './EmailPreviewNode';
import { Node } from '@xyflow/react';
import { Loader2, Wand2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmailNodePropertiesPanelProps {
  selectedNode: Node<EmailPreviewNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<EmailPreviewNodeData>) => void;
  onGenerateSection: (
    nodeId: string,
    section: 'hook' | 'cta' | 'offer' | 'subject',
    promptType: string,
    currentText: string
  ) => Promise<void>; // Returns a promise to handle loading state
  isGeneratingAIContent: boolean;
}

const AI_PROMPT_OPTIONS = {
  subject: [
    { label: 'More Intriguing', value: 'intriguing_subject' },
    { label: 'Benefit-Oriented', value: 'benefit_subject' },
    { label: 'Urgency-Driven', value: 'urgency_subject' },
  ],
  hook: [
    { label: 'Focus Time/Cost Savings', value: 'time_cost_hook' },
    { label: 'Highlight Efficiency', value: 'efficiency_hook' },
    { label: 'Emphasize Strategic Impact', value: 'impact_hook' },
  ],
  cta: [
    { label: 'Direct & Action-Oriented', value: 'direct_cta' },
    { label: 'Softer & Consultative', value: 'soft_cta' },
    { label: 'Value-Driven Link', value: 'value_cta' },
  ],
  offer: [
    { label: 'Low-Commitment Pilot', value: 'pilot_offer' },
    { label: 'Personalized Demo', value: 'demo_offer' },
    { label: 'Resource/Guide Offer', value: 'resource_offer' },
  ],
};

export function EmailNodePropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onGenerateSection,
  isGeneratingAIContent,
}: EmailNodePropertiesPanelProps) {
  const [formData, setFormData] = useState<Partial<EmailPreviewNodeData>>({});

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
    } else {
      setFormData({});
    }
  }, [selectedNode]);

  const handleInputChange = (
    field: keyof EmailPreviewNodeData,
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update immediately for real-time preview
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { [field]: value });
    }
  };

  // Remove handleBlur function since we're updating in real-time

  const renderAISection = (
    sectionName: 'Subject Line' | 'Hook Text' | 'CTA Text' | 'Offer Text',
    fieldKey: 'subjectLine' | 'hookText' | 'ctaText' | 'offerText',
    promptKey: 'subject' | 'hook' | 'cta' | 'offer'
  ) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldKey} className="text-base font-medium">
            {sectionName}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2 px-2 py-1 h-auto text-xs" disabled={isGeneratingAIContent}>
                {isGeneratingAIContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                <span className="ml-1">Rewrite</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {AI_PROMPT_OPTIONS[promptKey].map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={isGeneratingAIContent}
                  onSelect={() => {
                    if (selectedNode) {
                      onGenerateSection(
                        selectedNode.id,
                        promptKey,
                        opt.value,
                        formData[fieldKey] || ''
                      );
                    }
                  }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {fieldKey === 'subjectLine' ? (
           <Input
             id={fieldKey}
             value={formData[fieldKey] || ''}
             onChange={(e) => handleInputChange(fieldKey, e.target.value)}
             placeholder={`Enter ${sectionName}`}
             disabled={isGeneratingAIContent}
           />
        ) : (
          <Textarea
            id={fieldKey}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={`Enter ${sectionName}`}
            rows={fieldKey === 'hookText' ? 5 : (fieldKey === 'offerText' ? 4 : 3)}
            className="min-h-[80px]"
            disabled={isGeneratingAIContent}
          />
        )}
      </div>
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
      <SheetContent side="right" className="w-[480px] sm:w-[540px] flex flex-col p-0 max-h-screen">
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="text-xl">Edit Email Content</SheetTitle>
          <SheetDescription>
            Modify the details for your generated email. Changes update in real-time.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-6">
            <div>
              <Label htmlFor="nodeTitle" className="text-base font-medium">Node Title on Canvas</Label>
              <Input
                id="nodeTitle"
                value={formData.nodeTitle || ''}
                onChange={(e) => handleInputChange('nodeTitle', e.target.value)}
                placeholder="e.g., Follow-up Email Q1"
              />
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-base font-semibold text-muted-foreground">Your Details</h4>
              <div>
                <Label htmlFor="yourName">Your Name</Label>
                <Input 
                  id="yourName" 
                  value={formData.yourName || ''} 
                  onChange={(e) => handleInputChange('yourName', e.target.value)} 
                  placeholder="Jane Doe" 
                />
              </div>
              <div>
                <Label htmlFor="yourCompany">Your Company</Label>
                <Input 
                  id="yourCompany" 
                  value={formData.yourCompany || ''} 
                  onChange={(e) => handleInputChange('yourCompany', e.target.value)} 
                  placeholder="Acme Corp" 
                />
              </div>
              <div>
                <Label htmlFor="yourEmail">Your Email</Label>
                <Input 
                  id="yourEmail" 
                  type="email" 
                  value={formData.yourEmail || ''} 
                  onChange={(e) => handleInputChange('yourEmail', e.target.value)} 
                  placeholder="jane@acme.com" 
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-base font-semibold text-muted-foreground">Recipient & Links</h4>
              <div>
                <Label htmlFor="firstName">Recipient First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName || ''} 
                  onChange={(e) => handleInputChange('firstName', e.target.value)} 
                  placeholder="John" 
                />
              </div>
              <div>
                <Label htmlFor="calendlyLink">Calendly Link</Label>
                <Input 
                  id="calendlyLink" 
                  value={formData.calendlyLink || ''} 
                  onChange={(e) => handleInputChange('calendlyLink', e.target.value)} 
                  placeholder="https://calendly.com/your-link" 
                />
              </div>
              <div>
                <Label htmlFor="pdfLink">PDF/Resource Link</Label>
                <Input 
                  id="pdfLink" 
                  value={formData.pdfLink || ''} 
                  onChange={(e) => handleInputChange('pdfLink', e.target.value)} 
                  placeholder="https://example.com/roi-snapshot.pdf" 
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <h4 className="text-base font-semibold text-muted-foreground">Email Content (AI Assisted)</h4>
              {renderAISection('Subject Line', 'subjectLine', 'subject')}
              {renderAISection('Hook Text', 'hookText', 'hook')}
              {renderAISection('CTA Text', 'ctaText', 'cta')}
              {renderAISection('Offer Text', 'offerText', 'offer')}
            </div>
          </div>
        </ScrollArea>
        
        <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}