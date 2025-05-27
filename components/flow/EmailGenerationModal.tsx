import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailTemplate, EmailTemplateProps } from './EmailTemplate';
import { Scenario, db } from '@/lib/db';
import {
  calculateTimeValue,
  calculatePlatformCost,
  calculateRiskValue,
  calculateRevenueValue,
  calculateTotalValue,
  calculateNetROI,
  calculateROIRatio,
  formatROIRatio,
  calculatePaybackPeriod,
  formatPaybackPeriod
} from '@/lib/roi-utils';
import { pricing } from '@/app/api/data/pricing';
import { Loader2, Wand2 } from 'lucide-react';

interface EmailGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScenario: Scenario | null;
  onScenarioUpdate?: (updatedScenario: Partial<Scenario>) => void;
}

export function EmailGenerationModal({ open, onOpenChange, currentScenario, onScenarioUpdate }: EmailGenerationModalProps) {
  const [firstName, setFirstName] = useState('');
  const [yourName, setYourName] = useState('');
  const [yourCompany, setYourCompany] = useState('');
  const [yourEmail, setYourEmail] = useState('');
  const [calendlyLink, setCalendlyLink] = useState('');
  const [pdfLink, setPdfLink] = useState('');
  const [hookText, setHookText] = useState("I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.");
  const [ctaText, setCtaText] = useState("I packaged the numbers and a quick how it works diagram into a one-page PDF here:");
  const [subjectLine, setSubjectLine] = useState("Streamline Your Workflow & See Immediate ROI");
  const [offerText, setOfferText] = useState("If you'd like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.");
  
  const [stats, setStats] = useState<EmailTemplateProps['stats']>({ roiX: 0, payback: 'N/A', runs: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFullEmail, setIsGeneratingFullEmail] = useState(false);

  const updateScenarioInDb = useCallback((scenarioId: number, dataToUpdate: Partial<Scenario>) => {
    db.scenarios.update(scenarioId, { ...dataToUpdate, updatedAt: Date.now() }).then(() => {
      console.log('Email fields updated in Dexie for scenario:', scenarioId);
      if (onScenarioUpdate) {
          onScenarioUpdate({ ...dataToUpdate, updatedAt: Date.now() });
      }
    }).catch(err => console.error("Failed to update email fields in Dexie:", err));
  }, [onScenarioUpdate]);

  useEffect(() => {
    if (currentScenario && open) {
      const sc = currentScenario;
      setFirstName(sc.emailFirstName || '');
      setYourName(sc.emailYourName || '');
      setYourCompany(sc.emailYourCompany || '');
      setYourEmail(sc.emailYourEmail || '');
      setCalendlyLink(sc.emailCalendlyLink || '');
      setPdfLink(sc.emailPdfLink || '');
      setHookText(sc.emailHookText || "I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.");
      setCtaText(sc.emailCtaText || "I packaged the numbers and a quick how it works diagram into a one-page PDF here:");
      setSubjectLine(sc.emailSubjectLine || "Streamline Your Workflow & See Immediate ROI");
      setOfferText(sc.emailOfferText || "If you'd like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.");

      const timeValue = calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0);
      const riskValue = calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0);
      const revenueValue = calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0);
      const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
      const platformCost = calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0);
      const netROI = calculateNetROI(totalValue, platformCost);
      const roiRatio = calculateROIRatio(totalValue, platformCost);
      
      const platformData = pricing[sc.platform || 'zapier'];
      const baseMonthlyCost = platformData.tiers[0]?.monthlyUSD || platformCost;
      const paybackDays = calculatePaybackPeriod(baseMonthlyCost, netROI);

      setStats({
        roiX: Math.round(roiRatio * 100),
        payback: formatPaybackPeriod(paybackDays),
        runs: sc.runsPerMonth || 0,
      });
    }
  }, [currentScenario, open]);

  const handleFieldChange = <K extends keyof Scenario>(
    field: K, 
    value: Scenario[K],
    updateDirectly: boolean = false
  ) => {
    // Optimistically update local state for instant UI feedback
    if (field === 'emailFirstName') setFirstName(value as string);
    else if (field === 'emailYourName') setYourName(value as string);
    else if (field === 'emailYourCompany') setYourCompany(value as string);
    else if (field === 'emailYourEmail') setYourEmail(value as string);
    else if (field === 'emailCalendlyLink') setCalendlyLink(value as string);
    else if (field === 'emailPdfLink') setPdfLink(value as string);
    else if (field === 'emailHookText') setHookText(value as string);
    else if (field === 'emailCtaText') setCtaText(value as string);
    else if (field === 'emailSubjectLine') setSubjectLine(value as string);
    else if (field === 'emailOfferText') setOfferText(value as string);
    
    if (updateDirectly && currentScenario && currentScenario.id) {
        updateScenarioInDb(currentScenario.id, { [field]: value });
    }
  };

  const handleBlur = <K extends keyof Scenario>(
    field: K,
    value: Scenario[K]
  ) => {
    if (currentScenario && currentScenario.id) {
        updateScenarioInDb(currentScenario.id, { [field]: value });
    }
  };

  const handleAIAssistedEdit = useCallback(async (section: 'hook' | 'cta', promptType: string) => {
    if (!currentScenario || !currentScenario.id) return;
    setIsGenerating(true);
    let currentTextToRewrite = section === 'hook' ? hookText : ctaText;
    try {
      const sc = currentScenario;
      const timeValue = calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0);
      const riskValue = calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0);
      const revenueValue = calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0);
      const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
      const platformCostValue = calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0);
      const netROIValue = calculateNetROI(totalValue, platformCostValue);
      const roiRatioValue = calculateROIRatio(totalValue, platformCostValue);
      const platformData = pricing[sc.platform || 'zapier'];
      const baseMonthlyCost = platformData.tiers[0]?.monthlyUSD || platformCostValue;
      const paybackPeriodDays = calculatePaybackPeriod(baseMonthlyCost, netROIValue);

      const roiDataPayload = {
        scenarioName: sc.name,
        timeValue,
        platformCost: platformCostValue,
        netROI: netROIValue,
        roiRatio: roiRatioValue,
        paybackPeriod: formatPaybackPeriod(paybackPeriodDays),
        runsPerMonth: sc.runsPerMonth,
        minutesPerRun: sc.minutesPerRun,
        platform: sc.platform,
      };

      let systemPrompt = "";
      if (section === 'hook') {
        if (promptType === 'time_cost') systemPrompt = "Rewrite this email hook to emphasize time and direct cost savings.";
        else if (promptType === 'efficiency') systemPrompt = "Rewrite this email hook to highlight improvements in efficiency and productivity.";
        else if (promptType === 'impact_payback') systemPrompt = "Rewrite this email hook to focus on the strategic business impact and rapid payback.";
      } else { // cta
        if (promptType === 'direct_cta') systemPrompt = "Rewrite this CTA to be very direct and action-oriented.";
        else if (promptType === 'soft_cta') systemPrompt = "Rewrite this CTA to be softer and more consultative.";
        else if (promptType === 'value_cta') systemPrompt = "Rewrite this CTA to emphasize the value proposition of clicking the link.";
      }
      
      const response = await fetch('/api/openai/generate-email-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            roiData: roiDataPayload, 
            textToRewrite: currentTextToRewrite, 
            systemPrompt 
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to generate AI content: ${response.status} ${errorBody}`);
      }
      const result = await response.json();
      if (section === 'hook') {
        setHookText(result.generatedText);
        updateScenarioInDb(currentScenario.id, { emailHookText: result.generatedText });
      } else {
        setCtaText(result.generatedText);
        updateScenarioInDb(currentScenario.id, { emailCtaText: result.generatedText });
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      alert(`Error generating content: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  }, [currentScenario, hookText, ctaText, updateScenarioInDb]);
  
  const handleGenerateFullEmail = async () => {
    if (!currentScenario || !currentScenario.id) return;
    setIsGeneratingFullEmail(true);
    try {
      const sc = currentScenario;
      const timeValue = calculateTimeValue(sc.runsPerMonth || 0, sc.minutesPerRun || 0, sc.hourlyRate || 0, sc.taskMultiplier || 0);
      const riskValue = calculateRiskValue(sc.complianceEnabled || false, sc.runsPerMonth || 0, sc.riskFrequency || 0, sc.errorCost || 0, sc.riskLevel || 0);
      const revenueValue = calculateRevenueValue(sc.revenueEnabled || false, sc.monthlyVolume || 0, sc.conversionRate || 0, sc.valuePerConversion || 0);
      const totalValue = calculateTotalValue(timeValue, riskValue, revenueValue);
      const platformCostValue = calculatePlatformCost(sc.platform || 'zapier', sc.runsPerMonth || 0, pricing, sc.nodesSnapshot?.length || 0);
      const netROIValue = calculateNetROI(totalValue, platformCostValue);
      const roiRatioValue = calculateROIRatio(totalValue, platformCostValue);
      const platformData = pricing[sc.platform || 'zapier'];
      const baseMonthlyCost = platformData.tiers[0]?.monthlyUSD || platformCostValue;
      const paybackPeriodDays = calculatePaybackPeriod(baseMonthlyCost, netROIValue);

      const roiDataPayload = {
        scenarioName: sc.name,
        platform: sc.platform,
        timeValue,
        platformCost: platformCostValue,
        netROI: netROIValue,
        roiRatio: roiRatioValue,
        paybackPeriod: formatPaybackPeriod(paybackPeriodDays),
        runsPerMonth: sc.runsPerMonth,
        minutesPerRun: sc.minutesPerRun,
        nodeCount: sc.nodesSnapshot?.length || 0,
      };

      const response = await fetch('/api/openai/generate-full-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roiData: roiDataPayload, scenarioName: sc.name, platform: sc.platform }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to generate full email: ${response.status} ${errorBody}`);
      }
      const result = await response.json();
      
      setSubjectLine(result.subjectLine || subjectLine);
      setHookText(result.hookText || hookText);
      setCtaText(result.ctaText || ctaText);
      setOfferText(result.offerText || offerText);

      updateScenarioInDb(currentScenario.id, {
        emailSubjectLine: result.subjectLine || subjectLine,
        emailHookText: result.hookText || hookText,
        emailCtaText: result.ctaText || ctaText,
        emailOfferText: result.offerText || offerText,
      });

    } catch (error) {
      console.error("Error generating full email:", error);
      alert(`Error generating email: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingFullEmail(false);
    }
  };

  if (!currentScenario && open) { 
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Outreach Email</DialogTitle>
                </DialogHeader>
                <div className="p-6 text-center">Loading scenario data or no scenario selected...</div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  } 
  if (!currentScenario) return null;

  const emailProps: EmailTemplateProps = {
    firstName,
    yourName,
    yourCompany,
    yourEmail,
    calendlyLink,
    pdfLink,
    hookText,
    ctaText,
    subjectLine,
    offerText,
    stats,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Generate Outreach Email</DialogTitle>
          <DialogDescription>
            Preview and customize the ROI-driven email. Use AI to refine key sections or generate the full email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="absolute top-[18px] right-[70px] z-20">
          <Button 
            onClick={handleGenerateFullEmail} 
            disabled={isGeneratingFullEmail || isGenerating}
            size="sm"
          >
            {isGeneratingFullEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Full Email with AI
          </Button>
        </div>

        <div className="flex-grow flex overflow-hidden px-6 pb-6 gap-6 pt-4">
          {/* Left Panel: Inputs & AI Controls */}
          <div className="w-1/3 overflow-y-auto pr-4 space-y-4">
            <h3 className="text-lg font-semibold mb-2">Your Details</h3>
            <div>
              <Label htmlFor="yourName">Your Name</Label>
              <Input id="yourName" value={yourName} 
                     onChange={(e) => handleFieldChange('emailYourName', e.target.value)} 
                     onBlur={(e) => handleBlur('emailYourName', e.target.value)} 
                     placeholder="[YOUR NAME]" />
            </div>
            <div>
              <Label htmlFor="yourCompany">Your Company</Label>
              <Input id="yourCompany" value={yourCompany} 
                     onChange={(e) => handleFieldChange('emailYourCompany', e.target.value)} 
                     onBlur={(e) => handleBlur('emailYourCompany', e.target.value)} 
                     placeholder="[YOUR COMPANY]" />
            </div>
            <div>
              <Label htmlFor="yourEmail">Your Email</Label>
              <Input id="yourEmail" type="email" value={yourEmail} 
                     onChange={(e) => handleFieldChange('emailYourEmail', e.target.value)} 
                     onBlur={(e) => handleBlur('emailYourEmail', e.target.value)} 
                     placeholder="[YOUR_EMAIL]" />
            </div>
            <div>
              <Label htmlFor="calendlyLink">Calendly Link</Label>
              <Input id="calendlyLink" value={calendlyLink} 
                     onChange={(e) => handleFieldChange('emailCalendlyLink', e.target.value)} 
                     onBlur={(e) => handleBlur('emailCalendlyLink', e.target.value)} 
                     placeholder="https://calendly.com/..." />
            </div>

            <h3 className="text-lg font-semibold mb-2 pt-4">Recipient & Links</h3>
             <div>
              <Label htmlFor="firstName">Recipient First Name</Label>
              <Input id="firstName" value={firstName} 
                     onChange={(e) => handleFieldChange('emailFirstName', e.target.value)} 
                     onBlur={(e) => handleBlur('emailFirstName', e.target.value)} 
                     placeholder="[FIRST NAME]" />
            </div>
            <div>
              <Label htmlFor="pdfLink">PDF Link (ROI Snapshot)</Label>
              <Input id="pdfLink" value={pdfLink} 
                     onChange={(e) => handleFieldChange('emailPdfLink', e.target.value)} 
                     onBlur={(e) => handleBlur('emailPdfLink', e.target.value)} 
                     placeholder="https://example.com/roi.pdf" />
            </div>

            <h3 className="text-lg font-semibold mb-2 pt-4">Email Content (AI Assisted)</h3>
            <div>
              <Label htmlFor='subjectLine'>Subject Line</Label>
              <Input id='subjectLine' value={subjectLine} 
                        onChange={(e) => handleFieldChange('emailSubjectLine', e.target.value)} 
                        onBlur={(e) => handleBlur('emailSubjectLine', e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='hookText'>Hook Section</Label>
              <Textarea id='hookText' value={hookText} 
                        onChange={(e) => handleFieldChange('emailHookText', e.target.value)} 
                        onBlur={(e) => handleBlur('emailHookText', e.target.value)} 
                        rows={5}/>
              <div className='flex gap-2 justify-end flex-wrap'>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('hook', 'time_cost')} disabled={isGenerating}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Focus Time/Cost</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('hook', 'efficiency')} disabled={isGenerating}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Focus Efficiency</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('hook', 'impact_payback')} disabled={isGenerating}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Focus Impact</Button>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ctaText'>CTA Section</Label>
              <Textarea id='ctaText' value={ctaText} 
                        onChange={(e) => handleFieldChange('emailCtaText', e.target.value)} 
                        onBlur={(e) => handleBlur('emailCtaText', e.target.value)} 
                        rows={3}/>
              <div className='flex gap-2 justify-end flex-wrap'>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('cta', 'direct_cta')} disabled={isGenerating || isGeneratingFullEmail}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Direct CTA</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('cta', 'soft_cta')} disabled={isGenerating || isGeneratingFullEmail}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Soft CTA</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAIAssistedEdit('cta', 'value_cta')} disabled={isGenerating || isGeneratingFullEmail}>{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Value CTA</Button>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='offerText'>Offer Section</Label>
              <Textarea id='offerText' value={offerText} 
                        onChange={(e) => handleFieldChange('emailOfferText', e.target.value)} 
                        onBlur={(e) => handleBlur('emailOfferText', e.target.value)} 
                        rows={4}/>
            </div>
          </div>

          {/* Right Panel: Email Preview */}
          <div className="w-2/3 flex-shrink-0 bg-muted/30 rounded-md overflow-hidden">
            <EmailTemplate {...emailProps} />
          </div>
        </div>
        
        <DialogFooter className="p-6 pt-0">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 