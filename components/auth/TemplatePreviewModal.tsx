"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Zap,
  Building,
  Users,
  BarChart3,
  Shield
} from "lucide-react";
import Image from "next/image";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateData?: {
    title?: string;
    platform?: string;
    apps?: string[];
    estimatedROI?: number;
    timesSaved?: number;
    description?: string;
    nodesCount?: number;
  };
  searchQuery?: string;
}

export function TemplatePreviewModal({ 
  isOpen, 
  onClose, 
  templateData,
  searchQuery 
}: TemplatePreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server side
  if (!mounted || !isOpen) return null;

  const {
    title = "Professional Automation Workflow",
    platform = "zapier",
    apps = ["Gmail", "Slack", "Google Sheets"],
    estimatedROI = 340,
    timesSaved = 15,
    description = "Streamline your workflow with this proven automation template",
    nodesCount = 8
  } = templateData || {};

  const handleSignIn = () => {
    // Store template generation intent before sign-in
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const templateIntent = {
        templateData,
        searchQuery,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingTemplateGeneration', JSON.stringify(templateIntent));
    }
    
    signIn("google");
  };

  // Platform colors and styling
  const platformStyles = {
    zapier: {
      color: "#F15533",
      bgColor: "bg-[#F15533]",
      textColor: "text-[#F15533]",
      borderColor: "border-[#F15533]"
    },
    n8n: {
      color: "#FF6B35",
      bgColor: "bg-[#FF6B35]", 
      textColor: "text-[#FF6B35]",
      borderColor: "border-[#FF6B35]"
    },
    make: {
      color: "#6366F1",
      bgColor: "bg-[#6366F1]",
      textColor: "text-[#6366F1]",
      borderColor: "border-[#6366F1]"
    }
  };

  const currentStyle = platformStyles[platform as keyof typeof platformStyles] || platformStyles.zapier;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentStyle.bgColor}`}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Template Preview</h2>
              <p className="text-sm text-[#3C3C3C]">
                {searchQuery ? `Found for: "${searchQuery}"` : "Perfect automation workflow"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Template Title */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-[#1A1A1A]">{title}</h3>
            <p className="text-[#3C3C3C] leading-relaxed">{description}</p>
          </div>

          {/* Platform Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 ${currentStyle.borderColor} ${currentStyle.textColor} font-medium capitalize`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {platform} Platform
            </Badge>
          </div>

          {/* Apps Grid */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Building className="h-4 w-4" />
              Connected Apps ({apps.length})
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {apps.slice(0, 6).map((app, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-[#FEFAF0] rounded-lg border border-[#E2C3B9]"
                >
                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                    <Building className="h-3 w-3 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A] truncate">{app}</span>
                </div>
              ))}
              {apps.length > 6 && (
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-500">+{apps.length - 6} more</span>
                </div>
              )}
            </div>
          </div>

          {/* ROI Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#FEFAF0] rounded-lg border border-[#E2C3B9]">
              <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${currentStyle.textColor}`} />
              <div className="text-2xl font-bold text-[#1A1A1A]">{estimatedROI}%</div>
              <div className="text-sm text-[#3C3C3C]">Est. ROI</div>
            </div>
            <div className="text-center p-4 bg-[#FEFAF0] rounded-lg border border-[#E2C3B9]">
              <Clock className={`h-6 w-6 mx-auto mb-2 ${currentStyle.textColor}`} />
              <div className="text-2xl font-bold text-[#1A1A1A]">{timesSaved}h</div>
              <div className="text-sm text-[#3C3C3C]">Saved/Month</div>
            </div>
            <div className="text-center p-4 bg-[#FEFAF0] rounded-lg border border-[#E2C3B9]">
              <BarChart3 className={`h-6 w-6 mx-auto mb-2 ${currentStyle.textColor}`} />
              <div className="text-2xl font-bold text-[#1A1A1A]">{nodesCount}</div>
              <div className="text-sm text-[#3C3C3C]">Steps</div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What You'll Get
            </h4>
            <div className="space-y-2">
              {[
                "Complete workflow template with all connections",
                "Professional ROI analysis and cost breakdown", 
                "Email templates for client presentations",
                "Step-by-step implementation guide"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${currentStyle.bgColor} flex items-center justify-center`}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-[#3C3C3C]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-[#F15533] to-[#37036A] rounded-lg p-6 text-center text-white">
            <h4 className="font-bold text-lg mb-2">Ready to Build This Automation?</h4>
            <p className="text-white/90 mb-4 text-sm">
              Sign in to access the full workflow builder, customize this template, and generate professional ROI reports.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleSignIn}
                size="lg"
                className="w-full bg-white text-[#1A1A1A] hover:bg-gray-100 font-bold"
              >
                <Users className="h-5 w-5 mr-2" />
                Sign in with Google to Continue
              </Button>
              
              <p className="text-white/70 text-xs">
                Free account • No credit card required • Professional reports in minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}