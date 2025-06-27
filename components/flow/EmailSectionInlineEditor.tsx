"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Edit2, 
  Check, 
  X, 
  ChevronDown,
  Sparkles
} from 'lucide-react';

// Tone and length options for per-section customization
const TONE_OPTIONS = [
  { value: 'professional_warm', label: 'Professional & Warm', icon: '🤝' },
  { value: 'casual_friendly', label: 'Casual & Friendly', icon: '😊' },
  { value: 'direct_results', label: 'Direct & Results-Driven', icon: '🎯' },
  { value: 'consultative_helpful', label: 'Consultative & Helpful', icon: '💡' },
];

const LENGTH_OPTIONS = [
  { value: 'concise', label: 'Concise', icon: '📄' },
  { value: 'standard', label: 'Standard', icon: '📋' },
  { value: 'detailed', label: 'Detailed', icon: '📚' },
];

// Regeneration prompt options per section type
const PROMPT_OPTIONS: Record<string, Array<{ value: string; label: string; description: string }>> = {
  subject: [
    { value: 'roi_subject', label: 'ROI-Focused', description: 'Emphasize return on investment' },
    { value: 'problem_subject', label: 'Problem-Focused', description: 'Start with their pain point' },
    { value: 'outcome_subject', label: 'Outcome-Focused', description: 'Lead with the end result' },
  ],
  hook: [
    { value: 'empathy_hook', label: 'Empathetic & Problem-First', description: 'Show you understand their pain' },
    { value: 'data_hook', label: 'Data-Driven Insight', description: 'Lead with compelling statistics' },
    { value: 'peer_hook', label: 'Peer-to-Peer Advice', description: 'Colleague sharing a discovery' },
  ],
  cta: [
    { value: 'specific_cta', label: 'Specific & Actionable', description: 'Clear next step with details' },
    { value: 'curious_cta', label: 'Curious & Explorative', description: 'Invite them to learn more' },
    { value: 'results_cta', label: 'Results-Focused', description: 'Emphasize the outcome' },
  ],
  offer: [
    { value: 'colleague_offer', label: 'Helpful Colleague', description: 'Friendly, no-pressure help' },
    { value: 'expert_offer', label: 'Expert Guide', description: 'Professional expertise offered' },
    { value: 'partner_offer', label: 'Partnership Approach', description: 'Work together as partners' },
  ],
  ps: [
    { value: 'benefit_ps', label: 'Additional Benefit', description: 'One more compelling reason' },
    { value: 'urgency_ps', label: 'Create Urgency', description: 'Time-sensitive element' },
    { value: 'social_ps', label: 'Social Proof', description: 'Others are doing this' },
  ],
  testimonial: [
    { value: 'peer_testimonial', label: 'Similar Company', description: 'Relatable success story' },
    { value: 'metrics_testimonial', label: 'Impressive Metrics', description: 'Focus on numbers' },
    { value: 'quick_testimonial', label: 'Quick Win Story', description: 'Fast results achieved' },
  ],
  urgency: [
    { value: 'time_urgency', label: 'Limited Time', description: 'Deadline approaching' },
    { value: 'competitive_urgency', label: 'Competitive Edge', description: 'Stay ahead of competitors' },
    { value: 'scarcity_urgency', label: 'Capacity Scarcity', description: 'Limited availability' },
  ],
};

interface EmailSectionInlineEditorProps {
  sectionId: string;
  sectionLabel: string;
  content: string;
  isVisible: boolean;
  isOptional?: boolean;
  connectedNodes?: string[];
  hasChanges?: boolean;
  regenerateNeeded?: boolean;
  onToggleVisibility: (visible: boolean) => void;
  onContentChange: (content: string) => void;
  onRegenerateSection: (promptType: string, tone: string, length: string) => Promise<void>;
  defaultTone?: string;
  defaultLength?: string;
}

export function EmailSectionInlineEditor({
  sectionId,
  sectionLabel,
  content,
  isVisible,
  isOptional = false,
  connectedNodes = [],
  hasChanges = false,
  regenerateNeeded = false,
  onToggleVisibility,
  onContentChange,
  onRegenerateSection,
  defaultTone = 'professional_warm',
  defaultLength = 'standard',
}: EmailSectionInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(content);
  const [sectionTone, setSectionTone] = useState(defaultTone);
  const [sectionLength, setSectionLength] = useState(defaultLength);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditingContent(content);
  }, [content]);

  const handleSave = () => {
    onContentChange(editingContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingContent(content);
    setIsEditing(false);
  };

  const handleRegenerate = async (promptType: string) => {
    setIsRegenerating(true);
    try {
      // Combine prompt type with section-specific tone and length
      const fullPromptType = `${promptType}_${sectionLength}_${sectionTone}`;
      await onRegenerateSection(fullPromptType, sectionTone, sectionLength);
    } finally {
      setIsRegenerating(false);
    }
  };

  const promptOptions = PROMPT_OPTIONS[sectionId] || [];
  const isConnected = connectedNodes.length > 0;
  const showUpdateBadge = hasChanges || regenerateNeeded;

  return (
    <div className={cn(
      "group relative border rounded-lg transition-all",
      !isVisible && "opacity-50",
      isEditing && "ring-2 ring-primary",
      showUpdateBadge && "border-orange-400 bg-orange-50/50",
      !showUpdateBadge && isConnected && "border-green-400 bg-green-50/30",
      !showUpdateBadge && !isConnected && "border-gray-200"
    )}>
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <button
          onClick={() => onToggleVisibility(!isVisible)}
          className="hover:bg-muted rounded p-1"
          title={isVisible ? "Hide section" : "Show section"}
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        
        <span className="font-medium text-sm flex-1">{sectionLabel}</span>
        
        {isOptional && (
          <Badge variant="outline" className="text-xs">Optional</Badge>
        )}
        
        {isConnected && (
          <Badge variant="secondary" className="text-xs">
            {connectedNodes.length} connected
          </Badge>
        )}
        
        {showUpdateBadge && (
          <Badge variant="default" className="bg-orange-500 text-xs animate-pulse">
            Update available
          </Badge>
        )}
        
        {/* Section-specific tone/length selectors */}
        <div className="flex items-center gap-1">
          {/* Tone selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                {TONE_OPTIONS.find(t => t.value === sectionTone)?.icon}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Section Tone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TONE_OPTIONS.map(tone => (
                <DropdownMenuItem
                  key={tone.value}
                  onClick={() => setSectionTone(tone.value)}
                  className={cn("text-xs", sectionTone === tone.value && "font-semibold")}
                >
                  <span className="mr-2">{tone.icon}</span>
                  {tone.label}
                  {sectionTone === tone.value && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Length selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                {LENGTH_OPTIONS.find(l => l.value === sectionLength)?.icon}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Section Length</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LENGTH_OPTIONS.map(length => (
                <DropdownMenuItem
                  key={length.value}
                  onClick={() => setSectionLength(length.value)}
                  className={cn("text-xs", sectionLength === length.value && "font-semibold")}
                >
                  <span className="mr-2">{length.icon}</span>
                  {length.label}
                  {sectionLength === length.value && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2"
                disabled={!isVisible}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={!isVisible || isRegenerating}
                  >
                    {isRegenerating ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs">
                    Regenerate with {TONE_OPTIONS.find(t => t.value === sectionTone)?.label} tone
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {promptOptions.map(prompt => (
                    <DropdownMenuItem
                      key={prompt.value}
                      onClick={() => handleRegenerate(prompt.value)}
                      disabled={isRegenerating}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="font-medium text-sm">{prompt.label}</div>
                      <div className="text-xs text-muted-foreground">{prompt.description}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-7 px-2 text-green-600"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2 text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Section Content */}
      {isVisible && (
        <div className="p-3">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
                if (e.key === 'Enter' && e.ctrlKey) handleSave();
              }}
            />
          ) : (
            <div 
              className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted/50 rounded p-2 -m-2"
              onClick={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      )}
      
      {/* Loading overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Regenerating...</span>
          </div>
        </div>
      )}
      
      {/* Connection handles for email context nodes */}
      {isVisible && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id={`${sectionId}-left`}
            className={cn(
              "!w-3 !h-3 !border-2",
              isConnected 
                ? "!bg-green-500 !border-green-600" 
                : "!bg-gray-400 !border-gray-500"
            )}
            style={{ top: '50%' }}
          />
          <Handle
            type="target"
            position={Position.Right}
            id={`${sectionId}-right`}
            className={cn(
              "!w-3 !h-3 !border-2",
              isConnected 
                ? "!bg-green-500 !border-green-600" 
                : "!bg-gray-400 !border-gray-500"
            )}
            style={{ top: '50%' }}
          />
        </>
      )}
    </div>
  );
} 