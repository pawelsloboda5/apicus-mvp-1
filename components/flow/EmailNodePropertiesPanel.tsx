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
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmailPreviewNodeData } from './EmailPreviewNode';
import { Node } from '@xyflow/react';
import { Loader2, Wand2, ChevronDown, Check, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface EmailContextNode {
  id: string;
  type: string;
  label: string;
  value: string | string[];
}

interface EmailNodePropertiesPanelProps {
  selectedNode: Node<EmailPreviewNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<EmailPreviewNodeData>) => void;
  onGenerateSection: (
    nodeId: string,
    section: 'hook' | 'cta' | 'offer' | 'subject' | 'ps' | 'testimonial' | 'urgency'
  ) => Promise<void>;
  isGeneratingAIContent: boolean;
  emailContextNodes?: EmailContextNode[];
}

const AI_PROMPT_OPTIONS = {
  subject: [
    { label: 'ROI-Focused', value: 'roi_subject' },
    { label: 'Problem-Focused', value: 'problem_subject' },
    { label: 'Outcome-Focused', value: 'outcome_subject' },
  ],
  hook: [
    { label: 'Empathetic & Problem-First', value: 'empathy_hook' },
    { label: 'Data-Driven Insight', value: 'data_hook' },
    { label: 'Peer-to-Peer Advice', value: 'peer_hook' },
  ],
  cta: [
    { label: 'Specific & Actionable', value: 'specific_cta' },
    { label: 'Curious & Explorative', value: 'curious_cta' },
    { label: 'Results-Focused', value: 'results_cta' },
  ],
  offer: [
    { label: 'Helpful Colleague', value: 'colleague_offer' },
    { label: 'Expert Guide', value: 'expert_offer' },
    { label: 'Partnership Approach', value: 'partner_offer' },
  ],
  ps: [
    { label: 'Additional Benefit', value: 'benefit_ps' },
    { label: 'Create Urgency', value: 'urgency_ps' },
    { label: 'Social Proof', value: 'social_ps' },
  ],
  testimonial: [
    { label: 'Similar Company', value: 'peer_testimonial' },
    { label: 'Impressive Metrics', value: 'metrics_testimonial' },
    { label: 'Quick Win Story', value: 'quick_testimonial' },
  ],
  urgency: [
    { label: 'Limited Time', value: 'time_urgency' },
    { label: 'Competitive Edge', value: 'competitive_urgency' },
    { label: 'Capacity Scarcity', value: 'scarcity_urgency' },
  ],
  length: [
    { label: 'Concise', value: 'concise' },
    { label: 'Standard', value: 'standard' },
    { label: 'Detailed', value: 'detailed' },
  ],
  tone: [
    { label: 'Professional & Warm', value: 'professional_warm' },
    { label: 'Casual & Friendly', value: 'casual_friendly' },
    { label: 'Direct & Results-Driven', value: 'direct_results' },
    { label: 'Consultative & Helpful', value: 'consultative_helpful' },
  ]
};

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
    field: keyof EmailPreviewNodeData,
    value: string | boolean
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update immediately for real-time preview
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { [field]: value });
    }
  };

  const renderAISection = (
    sectionName: 'Subject Line' | 'Hook Text' | 'CTA Text' | 'Offer Text' | 'PS Line' | 'Testimonial' | 'Urgency Line',
    fieldKey: 'subjectLine' | 'hookText' | 'ctaText' | 'offerText' | 'psText' | 'testimonialText' | 'urgencyText',
    promptKey: 'subject' | 'hook' | 'cta' | 'offer' | 'ps' | 'testimonial' | 'urgency',
    showToggle: boolean = false,
    toggleKey?: 'showSubject' | 'showHook' | 'showCTA' | 'showOffer' | 'showPS' | 'showTestimonial' | 'showUrgency'
  ) => {
    const isEnabled = !toggleKey || formData[toggleKey] !== false;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor={fieldKey} className="text-base font-medium">
              {sectionName}
            </Label>
            {showToggle && toggleKey && (
              <Checkbox
                checked={isEnabled}
                onCheckedChange={(checked) => handleInputChange(toggleKey, !!checked)}
                aria-label={`Enable ${sectionName}`}
              />
            )}
          </div>
          <div className="flex gap-2">
            {/* Length selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-2 py-1 h-auto text-xs" 
                  disabled={isGeneratingAIContent || !isEnabled}
                >
                  {AI_PROMPT_OPTIONS.length.find(opt => opt.value === selectedLength)?.label || 'Standard'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* AI rewrite button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-2 py-1 h-auto text-xs" 
                  disabled={isGeneratingAIContent || !isEnabled}
                >
                  {isGeneratingAIContent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
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
                          promptKey
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
        </div>
        {fieldKey === 'subjectLine' ? (
           <Input
             id={fieldKey}
             value={formData[fieldKey] || ''}
             onChange={(e) => handleInputChange(fieldKey, e.target.value)}
             placeholder={`Enter ${sectionName}`}
             disabled={isGeneratingAIContent || !isEnabled}
             className={cn(!isEnabled && "opacity-50")}
           />
        ) : (
          <Textarea
            id={fieldKey}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={`Enter ${sectionName}`}
            rows={
              fieldKey === 'hookText' ? 5 : 
              fieldKey === 'offerText' ? 4 : 
              (fieldKey === 'psText' || fieldKey === 'urgencyText') ? 2 : 
              3
            }
            className={cn("min-h-[60px] resize-none", !isEnabled && "opacity-50")}
            disabled={isGeneratingAIContent || !isEnabled}
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
              <div>
                <Label htmlFor="nodeTitle" className="text-base font-medium">
                  Node Title on Canvas
                </Label>
                <Input
                  id="nodeTitle"
                  value={formData.nodeTitle || ''}
                  onChange={(e) => handleInputChange('nodeTitle', e.target.value)}
                  placeholder="e.g., Follow-up Email Q1"
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-muted-foreground">Your Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="yourName">Your Name</Label>
                    <Input 
                      id="yourName" 
                      value={formData.yourName || ''} 
                      onChange={(e) => handleInputChange('yourName', e.target.value)} 
                      placeholder="Jane Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yourCompany">Your Company</Label>
                    <Input 
                      id="yourCompany" 
                      value={formData.yourCompany || ''} 
                      onChange={(e) => handleInputChange('yourCompany', e.target.value)} 
                      placeholder="Acme Corp"
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-muted-foreground">Recipient & Links</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="firstName">Recipient First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName || ''} 
                      onChange={(e) => handleInputChange('firstName', e.target.value)} 
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendlyLink">Calendly Link</Label>
                    <Input 
                      id="calendlyLink" 
                      value={formData.calendlyLink || ''} 
                      onChange={(e) => handleInputChange('calendlyLink', e.target.value)} 
                      placeholder="https://calendly.com/your-link"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pdfLink">PDF/Resource Link</Label>
                    <Input 
                      id="pdfLink" 
                      value={formData.pdfLink || ''} 
                      onChange={(e) => handleInputChange('pdfLink', e.target.value)} 
                      placeholder="https://example.com/roi-snapshot.pdf"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
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
                
                {/* Email Context Nodes Selection */}
                {emailContextNodes && emailContextNodes.length > 0 && (
                  <Card className="bg-muted/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Email Context to Include
                        </Label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          <span>{selectedContextNodes.size} selected</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Select which context elements to use when generating email content
                      </p>
                      
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {emailContextNodes.map((node) => {
                          const isSelected = selectedContextNodes.has(node.id);
                          const nodeTypeColors: Record<string, string> = {
                            persona: 'text-purple-600 dark:text-purple-400',
                            industry: 'text-blue-600 dark:text-blue-400',
                            painpoint: 'text-red-600 dark:text-red-400',
                            metric: 'text-green-600 dark:text-green-400',
                            urgency: 'text-orange-600 dark:text-orange-400',
                            socialproof: 'text-cyan-600 dark:text-cyan-400',
                            objection: 'text-amber-600 dark:text-amber-400',
                            value: 'text-emerald-600 dark:text-emerald-400',
                          };
                          
                          return (
                            <label
                              key={node.id}
                              className="flex items-start space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSelection = new Set(selectedContextNodes);
                                  if (checked) {
                                    newSelection.add(node.id);
                                  } else {
                                    newSelection.delete(node.id);
                                  }
                                  setSelectedContextNodes(newSelection);
                                }}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-xs font-medium capitalize",
                                    nodeTypeColors[node.type] || 'text-foreground'
                                  )}>
                                    {node.type}
                                  </span>
                                  <span className="text-sm">{node.label}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {Array.isArray(node.value) 
                                    ? node.value.join(', ').substring(0, 60) + (node.value.join(', ').length > 60 ? '...' : '')
                                    : String(node.value).substring(0, 60) + (String(node.value).length > 60 ? '...' : '')
                                  }
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const allIds = new Set(emailContextNodes.map(n => n.id));
                            setSelectedContextNodes(allIds);
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedContextNodes(new Set())}
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            // Select all nodes as the new smart default
                            const allIds = new Set(emailContextNodes.map(n => n.id));
                            setSelectedContextNodes(allIds);
                          }}
                        >
                          Smart Selection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-6">
                  {/* Core sections */}
                  {renderAISection('Subject Line', 'subjectLine', 'subject', true, 'showSubject')}
                  {renderAISection('Hook Text', 'hookText', 'hook', true, 'showHook')}
                  {renderAISection('CTA Text', 'ctaText', 'cta', true, 'showCTA')}
                  {renderAISection('Offer Text', 'offerText', 'offer', true, 'showOffer')}
                  
                  {/* Optional sections with toggles */}
                  <div className="pt-4 border-t">
                    <h5 className="text-sm font-medium mb-4 text-muted-foreground">Optional Sections</h5>
                    <div className="space-y-6">
                      {renderAISection('PS Line', 'psText', 'ps', true, 'showPS')}
                      {renderAISection('Testimonial', 'testimonialText', 'testimonial', true, 'showTestimonial')}
                      {renderAISection('Urgency Line', 'urgencyText', 'urgency', true, 'showUrgency')}
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