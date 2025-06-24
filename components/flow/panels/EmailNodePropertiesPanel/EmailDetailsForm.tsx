"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EmailDetailsFormProps {
  formData: {
    nodeTitle?: string;
    yourName?: string;
    yourCompany?: string;
    yourEmail?: string;
    firstName?: string;
    calendlyLink?: string;
    pdfLink?: string;
  };
  onChange: (field: string, value: string) => void;
}

export function EmailDetailsForm({ formData, onChange }: EmailDetailsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="nodeTitle" className="text-base font-medium">
          Node Title on Canvas
        </Label>
        <Input
          id="nodeTitle"
          value={formData.nodeTitle || ''}
          onChange={(e) => onChange('nodeTitle', e.target.value)}
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
              onChange={(e) => onChange('yourName', e.target.value)} 
              placeholder="Jane Doe"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="yourCompany">Your Company</Label>
            <Input 
              id="yourCompany" 
              value={formData.yourCompany || ''} 
              onChange={(e) => onChange('yourCompany', e.target.value)} 
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
              onChange={(e) => onChange('yourEmail', e.target.value)} 
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
              onChange={(e) => onChange('firstName', e.target.value)} 
              placeholder="John"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="calendlyLink">Calendly Link</Label>
            <Input 
              id="calendlyLink" 
              value={formData.calendlyLink || ''} 
              onChange={(e) => onChange('calendlyLink', e.target.value)} 
              placeholder="https://calendly.com/your-link"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pdfLink">PDF/Resource Link</Label>
            <Input 
              id="pdfLink" 
              value={formData.pdfLink || ''} 
              onChange={(e) => onChange('pdfLink', e.target.value)} 
              placeholder="https://example.com/roi-snapshot.pdf"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 