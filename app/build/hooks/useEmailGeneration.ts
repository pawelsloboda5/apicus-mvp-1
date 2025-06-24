"use client";

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  DEFAULT_EMAIL_CONFIG,
  EMAIL_CONTEXT_DEFAULTS,
  API_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '@/lib/utils/constants';

// Define local interfaces for email functionality
export interface EmailTemplate {
  id: string;
  firstName: string;
  yourName: string;
  yourCompany: string;
  yourEmail: string;
  calendlyLink: string;
  pdfLink: string;
  subjectLine: string;
  hookText: string;
  ctaText: string;
  offerText: string;
  psText: string;
  testimonialText: string;
  urgencyText: string;
  lengthOption: 'short' | 'standard' | 'long';
  toneOption: string;
}

export type EmailContextNodeType = 
  | 'persona' 
  | 'industry' 
  | 'painpoint' 
  | 'metric' 
  | 'urgency' 
  | 'socialproof' 
  | 'objection' 
  | 'value';

export type EmailSectionType = 
  | 'subjectLine'
  | 'hookText'
  | 'ctaText'
  | 'offerText'
  | 'psText'
  | 'testimonialText'
  | 'urgencyText';

export interface EmailGenerationParams {
  lengthOption: 'short' | 'standard' | 'long';
  toneOption: string;
  includeUrgency?: boolean;
  includeTestimonial?: boolean;
  customInstructions?: string;
}

export interface UseEmailGenerationOptions {
  /** Initial email template */
  initialTemplate?: EmailTemplate;
  /** Callback fired when email is generated */
  onEmailGenerated?: (email: EmailTemplate) => void;
  /** Callback fired when email section is updated */
  onSectionUpdated?: (section: EmailSectionType, content: string) => void;
}

export interface EmailGenerationState {
  isGenerating: boolean;
  isGeneratingSection: boolean;
  currentTemplate: EmailTemplate;
  generationProgress: number;
  lastGenerated: Date | null;
  error: string | null;
}

export interface EmailContextData {
  persona: string;
  industry: string;
  painpoint: string;
  metric: string;
  urgency: string;
  socialproof: string;
  objection: string;
  value: string;
}

export function useEmailGeneration({
  initialTemplate,
  onEmailGenerated,
  onSectionUpdated,
}: UseEmailGenerationOptions = {}) {
  
  const [state, setState] = useState<EmailGenerationState>({
    isGenerating: false,
    isGeneratingSection: false,
    currentTemplate: initialTemplate || {
      id: '',
      ...DEFAULT_EMAIL_CONFIG,
    },
    generationProgress: 0,
    lastGenerated: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Update template field
  const updateTemplate = useCallback(<K extends keyof EmailTemplate>(
    field: K,
    value: EmailTemplate[K]
  ) => {
    setState(prev => ({
      ...prev,
      currentTemplate: {
        ...prev.currentTemplate,
        [field]: value,
      },
      error: null,
    }));
  }, []);

  // Bulk update template
  const updateTemplateFields = useCallback((updates: Partial<EmailTemplate>) => {
    setState(prev => ({
      ...prev,
      currentTemplate: {
        ...prev.currentTemplate,
        ...updates,
      },
      error: null,
    }));
  }, []);

  // Load template
  const loadTemplate = useCallback((template: EmailTemplate) => {
    setState(prev => ({
      ...prev,
      currentTemplate: template,
      error: null,
    }));
  }, []);

  // Generate full email
  const generateFullEmail = useCallback(async (
    contextData: EmailContextData,
    params: EmailGenerationParams
  ) => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      error: null,
    }));

    try {
      // Prepare request payload
      const payload = {
        contextData,
        params,
        template: state.currentTemplate,
      };

      // Show progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          generationProgress: Math.min(prev.generationProgress + 10, 90),
        }));
      }, 500);

      const response = await fetch(API_CONFIG.endpoints.generateEmail, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Email generation failed');
      }

      // Update template with generated content
      const updatedTemplate: EmailTemplate = {
        ...state.currentTemplate,
        ...result.emailContent,
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        currentTemplate: updatedTemplate,
        lastGenerated: new Date(),
        error: null,
      }));

      // Notify callback
      if (onEmailGenerated) {
        onEmailGenerated(updatedTemplate);
      }

      toast.success(SUCCESS_MESSAGES.email.generated);
      
      return updatedTemplate;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.email.generationFailed;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
        error: errorMessage,
      }));

      if (errorName !== 'AbortError') {
        toast.error(errorMessage);
      }

      throw error;
    }
  }, [state.currentTemplate, onEmailGenerated]);

  // Extract context from email nodes
  const extractContextFromNodes = useCallback((nodes: Array<{
    id: string;
    type?: string;
    data?: {
      contextValue?: string | string[];
      [key: string]: unknown;
    };
  }>): EmailContextData => {
    const contextNodes = nodes.filter(node => 
      ['persona', 'industry', 'painpoint', 'metric', 'urgency', 'socialproof', 'objection', 'value']
        .includes(node.type || '')
    );

    const context: EmailContextData = { ...EMAIL_CONTEXT_DEFAULTS };

    contextNodes.forEach(node => {
      const nodeType = node.type as EmailContextNodeType;
      if (node.data?.contextValue && nodeType in context) {
        // Handle both string and array values
        let value = node.data.contextValue;
        if (Array.isArray(value)) {
          // If it's an array (multi-select), join with commas
          value = value.join(', ');
        } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          // If it's a JSON string array, parse it
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              value = parsed.join(', ');
            }
          } catch {
            // Keep original value if parsing fails
          }
        }
        context[nodeType] = value as string;
      }
    });

    return context;
  }, []);

  // Generate specific email section
  const generateEmailSection = useCallback(async (
    section: EmailSectionType,
    contextData: Partial<EmailContextData>,
    customPrompt?: string,
    roiMetrics?: {
      scenarioName?: string;
      platform?: string;
      netROI?: number;
      roiRatio?: number;
      paybackPeriod?: string;
      totalHoursSaved?: number;
      runsPerMonth?: number;
      minutesPerRun?: number;
      hourlyRate?: number;
      taskMultiplier?: number;
    }
  ) => {
    // Cancel any existing section generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isGeneratingSection: true,
      error: null,
    }));

    try {
      // Map section names to API format
      const sectionToApiMap: Record<string, string> = {
        'subjectLine': 'subject',
        'hookText': 'hook',
        'ctaText': 'cta',
        'offerText': 'offer',
        'psText': 'ps',
        'testimonialText': 'testimonial',
        'urgencyText': 'urgency',
      };

      const apiSection = sectionToApiMap[section] || section;

      // Get current content for the section being regenerated
      const currentSectionContent = state.currentTemplate[section] || '';

      // Build ROI data payload that matches API expectations
      // Use default values if roiMetrics is undefined
      const safeRoiMetrics = roiMetrics || {};
      
      const roiData = {
        scenarioName: safeRoiMetrics.scenarioName || 'Email Automation Workflow',
        platform: safeRoiMetrics.platform || 'automation platform',
        netROI: safeRoiMetrics.netROI || 5000,
        roiRatio: safeRoiMetrics.roiRatio || 10,
        paybackPeriod: safeRoiMetrics.paybackPeriod || '2 weeks',
        totalHoursSaved: safeRoiMetrics.totalHoursSaved || ((safeRoiMetrics.runsPerMonth || 250) * (safeRoiMetrics.minutesPerRun || 3)) / 60,
        runsPerMonth: safeRoiMetrics.runsPerMonth || 250,
        emailContext: {
          personas: contextData.persona ? [contextData.persona] : [],
          industries: contextData.industry ? [contextData.industry] : [],
          painPoints: contextData.painpoint ? [contextData.painpoint] : [],
          metrics: contextData.metric ? [contextData.metric] : [],
          urgencyFactors: contextData.urgency ? [contextData.urgency] : [],
          socialProofs: contextData.socialproof ? [contextData.socialproof] : [],
          objections: contextData.objection ? [contextData.objection] : [],
          valueProps: contextData.value ? [contextData.value] : [],
        }
      };

      // Generate appropriate system prompt based on section
      const systemPrompts: Record<string, string> = {
        subject: 'Generate a compelling email subject line for an automation ROI proposal. Focus on specific benefits and metrics. Maximum 8 words.',
        hook: 'Generate an engaging opening hook that identifies with the reader\'s pain point and introduces the automation solution naturally.',
        cta: 'Generate a clear call-to-action that references the ROI data and leads to a PDF download or next step.',
        offer: 'Generate a soft offer for a pilot, demo, or consultation that removes friction and focuses on the reader\'s success.',
        ps: 'Generate a brief PS line that adds urgency, social proof, or a surprising benefit. Keep it under 15 words.',
        testimonial: 'Generate a brief testimonial quote with specific metrics that would resonate with the target persona.',
        urgency: 'Generate a subtle urgency line that creates FOMO without being pushy. Focus on opportunity cost.'
      };

      const systemPrompt = systemPrompts[apiSection] || 'Generate compelling email content based on the provided context.';

      const payload = {
        roiData,
        textToRewrite: currentSectionContent || `[Generate new ${apiSection} content]`,
        systemPrompt,
        lengthOption: state.currentTemplate.lengthOption || 'standard',
        section: apiSection,
        toneOption: state.currentTemplate.toneOption || 'professional_warm',
        previousSections: {}, // Could include other sections for context
      };

      // Debug logging to identify 400 error cause
      console.log('Email section generation payload:', {
        hasRoiData: !!payload.roiData,
        hasTextToRewrite: !!payload.textToRewrite,
        hasSystemPrompt: !!payload.systemPrompt,
        section: payload.section,
        lengthOption: payload.lengthOption,
        toneOption: payload.toneOption,
        roiDataKeys: payload.roiData ? Object.keys(payload.roiData) : [],
        emailContextKeys: payload.roiData?.emailContext ? Object.keys(payload.roiData.emailContext) : [],
      });

      const response = await fetch(API_CONFIG.endpoints.generateSection, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Failed payload:', JSON.stringify(payload, null, 2));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.generatedText) {
        throw new Error('No generated text returned from API');
      }

      // Update template with new section content
      const updatedTemplate = {
        ...state.currentTemplate,
        [section]: result.generatedText,
      };

      setState(prev => ({
        ...prev,
        isGeneratingSection: false,
        currentTemplate: updatedTemplate,
        error: null,
      }));

      // Notify callbacks
      if (onSectionUpdated) {
        onSectionUpdated(section, result.generatedText);
      }

      toast.success(SUCCESS_MESSAGES.email.sectionGenerated);
      
      return result.generatedText;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.email.sectionGenerationFailed;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      setState(prev => ({
        ...prev,
        isGeneratingSection: false,
        error: errorMessage,
      }));

      if (errorName !== 'AbortError') {
        console.error('Email section generation error:', error);
        toast.error(errorMessage);
      }

      throw error;
    }
  }, [state.currentTemplate, onSectionUpdated]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      isGeneratingSection: false,
      generationProgress: 0,
      error: null,
    }));

    toast.info('Generation cancelled');
  }, []);

  // Reset template to defaults
  const resetToDefaults = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTemplate: {
        ...prev.currentTemplate,
        ...DEFAULT_EMAIL_CONFIG,
      },
      error: null,
    }));
  }, []);

  // Validate email template
  const validateTemplate = useCallback((template: EmailTemplate): string[] => {
    const errors: string[] = [];

    if (!template.subjectLine?.trim()) {
      errors.push('Subject line is required');
    }

    if (!template.hookText?.trim()) {
      errors.push('Hook text is required');
    }

    if (!template.ctaText?.trim()) {
      errors.push('CTA text is required');
    }

    if (template.yourEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(template.yourEmail)) {
      errors.push('Invalid email address format');
    }

    if (template.calendlyLink && !template.calendlyLink.startsWith('http')) {
      errors.push('Calendly link must be a valid URL');
    }

    if (template.pdfLink && !template.pdfLink.startsWith('http')) {
      errors.push('PDF link must be a valid URL');
    }

    return errors;
  }, []);

  // Get template character count
  const getCharacterCount = useCallback(() => {
    const template = state.currentTemplate;
    const totalChars = [
      template.subjectLine,
      template.hookText,
      template.ctaText,
      template.offerText,
      template.psText,
      template.testimonialText,
      template.urgencyText,
    ].join('').length;

    return {
      total: totalChars,
      subject: template.subjectLine?.length || 0,
      hook: template.hookText?.length || 0,
      cta: template.ctaText?.length || 0,
      offer: template.offerText?.length || 0,
      ps: template.psText?.length || 0,
      testimonial: template.testimonialText?.length || 0,
      urgency: template.urgencyText?.length || 0,
    };
  }, [state.currentTemplate]);

  // Get email preview HTML
  const getEmailHTML = useCallback(() => {
    const template = state.currentTemplate;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="margin-bottom: 20px;">${template.subjectLine}</h2>
        
        <div style="margin-bottom: 20px;">
          <p>Hi ${template.firstName || '[First Name]'},</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>${template.hookText}</p>
        </div>
        
        ${template.urgencyText ? `
          <div style="margin-bottom: 20px; padding: 10px; background-color: #f0f0f0;">
            <p><strong>${template.urgencyText}</strong></p>
          </div>
        ` : ''}
        
        <div style="margin-bottom: 20px;">
          <p>${template.ctaText}</p>
          ${template.pdfLink ? `<p><a href="${template.pdfLink}" style="color: #0066cc;">Download PDF</a></p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>${template.offerText}</p>
          ${template.calendlyLink ? `<p><a href="${template.calendlyLink}" style="color: #0066cc;">Schedule a call</a></p>` : ''}
        </div>
        
        ${template.testimonialText ? `
          <div style="margin-bottom: 20px; padding: 10px; border-left: 3px solid #0066cc;">
            <p><em>"${template.testimonialText}"</em></p>
          </div>
        ` : ''}
        
        ${template.psText ? `
          <div style="margin-bottom: 20px;">
            <p>${template.psText}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>
          ${template.yourName || '[Your Name]'}<br>
          ${template.yourCompany || '[Your Company]'}<br>
          ${template.yourEmail ? `<a href="mailto:${template.yourEmail}">${template.yourEmail}</a>` : '[Your Email]'}</p>
        </div>
      </div>
    `;
  }, [state.currentTemplate]);

  return {
    // State
    state,
    template: state.currentTemplate,
    isGenerating: state.isGenerating,
    isGeneratingSection: state.isGeneratingSection,
    progress: state.generationProgress,
    error: state.error,
    lastGenerated: state.lastGenerated,
    
    // Template management
    updateTemplate,
    updateTemplateFields,
    loadTemplate,
    resetToDefaults,
    
    // Generation functions
    generateFullEmail,
    generateEmailSection,
    cancelGeneration,
    
    // Utilities
    extractContextFromNodes,
    validateTemplate,
    getCharacterCount,
    getEmailHTML,
  };
} 