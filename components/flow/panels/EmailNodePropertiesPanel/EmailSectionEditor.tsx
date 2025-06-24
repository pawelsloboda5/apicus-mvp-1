"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Wand2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSectionEditorProps {
  sectionName: string;
  fieldKey: string;
  value: string;
  isEnabled?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (checked: boolean) => void;
  onChange: (value: string) => void;
  onGenerateSection: (promptType: string) => void;
  isGenerating: boolean;
  promptOptions: Array<{ label: string; value: string }>;
  selectedLength: string;
  selectedTone: string;
  rows?: number;
  placeholder?: string;
  isSubjectLine?: boolean;
}

export const AI_PROMPT_OPTIONS = {
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

export function EmailSectionEditor({
  sectionName,
  fieldKey,
  value,
  isEnabled = true,
  showToggle = false,
  toggleValue = true,
  onToggleChange,
  onChange,
  onGenerateSection,
  isGenerating,
  promptOptions,
  selectedLength,
  selectedTone,
  rows = 3,
  placeholder,
  isSubjectLine = false,
}: EmailSectionEditorProps) {
  const effectiveEnabled = showToggle ? (toggleValue && isEnabled) : isEnabled;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldKey} className="text-base font-medium">
            {sectionName}
          </Label>
          {showToggle && onToggleChange && (
            <Checkbox
              checked={toggleValue}
              onCheckedChange={(checked) => onToggleChange(!!checked)}
              aria-label={`Enable ${sectionName}`}
            />
          )}
        </div>
        <div className="flex gap-2">
          {/* AI rewrite button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-2 py-1 h-auto text-xs" 
                disabled={isGenerating || !effectiveEnabled}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                <span className="ml-1">Rewrite</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {promptOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={isGenerating}
                  onSelect={() => {
                    const fullPromptType = `${opt.value}_${selectedLength}_${selectedTone}`;
                    onGenerateSection(fullPromptType);
                  }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isSubjectLine ? (
        <Input
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${sectionName}`}
          disabled={isGenerating || !effectiveEnabled}
          className={cn(!effectiveEnabled && "opacity-50")}
        />
      ) : (
        <Textarea
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${sectionName}`}
          rows={rows}
          className={cn("min-h-[60px] resize-none", !effectiveEnabled && "opacity-50")}
          disabled={isGenerating || !effectiveEnabled}
        />
      )}
    </div>
  );
} 