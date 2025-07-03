"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Sparkles, Loader2, Calculator, TrendingUp, Target, Rocket, Zap, ChevronLeft, ChevronRight, Upload, ArrowRight, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

// Dynamic import to prevent SSR issues with sessionStorage
const ImportWorkflowDialog = dynamic(
  () => import("@/components/flow/ImportWorkflowDialog").then(mod => mod.ImportWorkflowDialog),
  { ssr: false }
);

// Simple Badge component
function Badge({ 
  variant = "default", 
  className, 
  children, 
  ...props 
}: { 
  variant?: "default" | "secondary" | "outline";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "text-foreground border-border": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [currentBenefit, setCurrentBenefit] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  
  const benefits = [
    {
      title: "Build compelling ROI cases that close deals faster than your competition",
      icon: <TrendingUp className="h-12 w-12" />,
      color: "text-[#F15533]"
    },
    {
      title: "Compare platform costs across Zapier, Make, and n8n with real pricing data",
      icon: <BarChart3 className="h-12 w-12" />,
      color: "text-[#37036A]"
    },
    {
      title: "Transform client pain points into profitable automation proposals",
      icon: <Target className="h-12 w-12" />,
      color: "text-[#F15533]"
    },
    {
      title: "Generate professional reports that justify automation investments",
      icon: <FileText className="h-12 w-12" />,
      color: "text-[#37036A]"
    },
  ];
  
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentBenefit((prev) => (prev + 1) % benefits.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [benefits.length]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) {
      router.push('/build');
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/templates/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        // If search fails, create a new scenario with default template
        router.push(`/build?q=${encodeURIComponent(q)}&default=true`);
        return;
      }
      const data = await res.json();
      
      if (data.templates && data.templates.length > 0) {
        const primaryTemplate = data.templates[0];
        router.push(`/build?tid=${primaryTemplate.templateId}&q=${encodeURIComponent(q)}`);
      } else {
        // No templates found, create with default template
        router.push(`/build?q=${encodeURIComponent(q)}&default=true`);
      }
    } catch {
      router.push('/build');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Create a synthetic form event
      const syntheticEvent = {
        ...e,
        type: 'submit' as const,
        currentTarget: e.currentTarget.form,
        target: e.currentTarget.form,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      } as React.FormEvent;
      handleGenerate(syntheticEvent);
    }
  };

  const nextBenefit = () => {
    setCurrentBenefit((prev) => (prev + 1) % benefits.length);
  };

  const prevBenefit = () => {
    setCurrentBenefit((prev) => (prev - 1 + benefits.length) % benefits.length);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FEFAF0]">
      {/* Hero Section */}
      <section className="relative bg-[#FEFAF0] min-h-screen flex items-center justify-center">
        <div className="relative z-10 w-full px-4 py-12">
          <div className="mx-auto max-w-6xl text-center">
            <h1
              className={cn(
                "mx-auto mb-8 text-5xl font-black leading-[1.1] tracking-tight text-[#1A1A1A] sm:text-6xl md:text-7xl lg:text-8xl",
                mounted && "animate-fade-in"
              )}
            >
              Win More Clients with{" "}
              <span className="text-[#F15533]">Data-Driven</span>{" "}
              Automation Proposals
            </h1>

            <p className={cn(
              "mx-auto mb-12 max-w-3xl text-xl text-[#3C3C3C] leading-relaxed",
              mounted && "animate-fade-in"
            )} style={{ animationDelay: '200ms' }}>
              Build compelling ROI cases, compare platform costs, and close more automation deals with professional reports that justify every dollar invested.
            </p>

            {/* CTA Section */}
            <div className={cn(
              "mt-8 sm:mt-12 flex flex-col items-center gap-8",
              mounted && "animate-fade-in"
            )} style={{ animationDelay: '400ms' }}>

              {/* Primary CTA - Import Workflow */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                  Already have a workflow?
                </h3>
                <p className="text-sm text-[#3C3C3C] mb-4 max-w-md mx-auto">
                  Import your existing JSON exports from automation platforms for instant ROI analysis
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setImportDialogOpen(true)}
                  className="bg-[#F15533] hover:bg-[#D4452A] text-white px-8 py-6 text-xl font-bold shadow-lg rounded-lg"
                >
                  <Upload className="mr-3 h-6 w-6" />
                  Import JSON from Make, n8n, or Zapier
                </Button>
              </div>

              <div className="flex items-center gap-4 w-full max-w-lg">
                <div className="flex-1 h-px bg-[#E2C3B9]"></div>
                <span className="text-sm font-medium text-[#97756B] px-4">or</span>
                <div className="flex-1 h-px bg-[#E2C3B9]"></div>
              </div>

              {/* Secondary CTA – Generate */}
              <div className="text-center w-full max-w-2xl">
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                  Need a new automation workflow?
                </h3>
                <p className="text-sm text-[#3C3C3C] mb-4">
                  Choose from <span className="font-bold text-[#F15533]">2,000+ proven templates</span> based on your description
                </p>
                <form onSubmit={handleGenerate} className="flex flex-col items-center gap-4">
                  <div className="relative w-full">
                    <textarea
                      ref={inputRef}
                      placeholder="Describe what you want to automate (e.g., 'Process invoices from Gmail and update QuickBooks')"
                      className="w-full h-24 border-2 border-[#E2C3B9] bg-white px-6 py-4 pr-16 text-lg font-medium text-[#1A1A1A] placeholder:text-[#97756B] focus:border-[#F15533] focus:outline-none focus:ring-4 focus:ring-[#F15533]/20 resize-none transition-all duration-200 rounded-lg"
                      disabled={searching}
                      rows={3}
                      onKeyDown={handleKeyDown}
                    />
                    <Button
                      type="submit"
                      disabled={searching}
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 bg-[#F15533] hover:bg-[#D4452A]"
                    >
                      {searching ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowRight className="h-6 w-6" />
                      )}
                    </Button>
                    <div className="absolute bottom-2 right-16 text-xs text-[#97756B]">
                      Enter to generate • Shift+Enter for new line
                    </div>
                  </div>
                  <p className="text-xs text-[#97756B] max-w-md">
                    We&apos;ll find the best template from our library and calculate ROI instantly
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 py-16 bg-white border-t border-[#E2C3B9]">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-[#97756B]">
            Supports workflows from the platforms your clients trust
          </p>
          <div className="flex items-center justify-center gap-16 opacity-70">
            <div className="text-3xl font-bold font-mono tracking-wider text-[#1A1A1A]">ZAPIER</div>
            <div className="text-3xl font-bold font-mono tracking-wider text-[#1A1A1A]">MAKE</div>
            <div className="text-3xl font-bold font-mono tracking-wider text-[#1A1A1A]">N8N</div>
          </div>
        </div>
      </section>

      {/* Benefits Carousel */}
      <section className="relative z-10 py-20 bg-[#FEFAF0]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-[#1A1A1A]">
              Why Automation Consultants Choose Apicus
            </h2>
            <p className="text-xl text-[#3C3C3C] max-w-3xl mx-auto">
              The only platform built specifically for professionals who sell automation services
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={prevBenefit}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border-[#E2C3B9]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-auto max-w-4xl">
                <Card className="border-[#E2C3B9] bg-white shadow-sm transition-all hover:shadow-lg min-h-[280px]">
                  <CardContent className="p-12 text-center">
                    <div className={cn("mb-8 inline-flex h-16 w-16 items-center justify-center rounded-lg", benefits[currentBenefit].color)}>
                      {benefits[currentBenefit].icon}
                    </div>
                    <h3 className="text-2xl font-bold leading-relaxed text-[#1A1A1A]">
                      {benefits[currentBenefit].title}
                    </h3>
                  </CardContent>
                </Card>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextBenefit}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border-[#E2C3B9]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Benefit indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {benefits.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBenefit(index)}
                  className={cn(
                    "h-2 w-8 rounded-full transition-all",
                    index === currentBenefit ? "bg-[#F15533]" : "bg-[#D4A597]"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features with Screenshots */}
      <section className="relative z-10 py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6">
              <Sparkles className="mr-2 h-3 w-3" />
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-[#1A1A1A]">
              Everything You Need to Close Automation Deals
            </h2>
            <p className="text-xl text-[#3C3C3C] max-w-3xl mx-auto">
              Professional tools designed specifically for automation consultants and agencies
            </p>
          </div>

          <div className="space-y-20">
            {/* ROI Analysis Feature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-[#1A1A1A]">
                  Professional ROI Analysis
                </h3>
                <p className="text-lg text-[#3C3C3C] mb-6 leading-relaxed">
                  Generate detailed ROI reports that justify automation investments. Compare time savings, 
                  platform costs, and revenue impact with industry-standard calculations that clients trust.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Real-time cost calculations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Multi-platform price comparison</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Client-ready PDF exports</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#F15533]/10 to-[#37036A]/10 rounded-xl p-6 space-y-6">
                  <Image
                    src="/roi-ratio-analytics-dashboard.png"
                    alt="ROI Ratio Dashboard"
                    width={280}
                    height={200}
                    className="rounded-lg shadow-lg mx-auto"
                  />
                  <Image
                    src="/roi-breakdown-analytics-dashboard.png"
                    alt="ROI Breakdown Dashboard"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* Workflow Import Feature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="bg-gradient-to-br from-[#37036A]/10 to-[#F15533]/10 rounded-xl p-8">
                  <Image
                    src="/generated-automation-nodes-transparent-background.png"
                    alt="Workflow Canvas"
                    width={600}
                    height={400}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl font-bold mb-6 text-[#1A1A1A]">
                  Import & Analyze Existing Workflows
                </h3>
                <p className="text-lg text-[#3C3C3C] mb-6 leading-relaxed">
                  Drag and drop JSON exports from Make, n8n, or Zapier. Automatically analyze workflow 
                  complexity, calculate costs, and generate ROI projections for client presentations.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">One-click workflow import</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Automatic cost analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Visual workflow mapping</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional ROI Reports Feature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="bg-gradient-to-br from-[#F15533]/10 to-[#37036A]/10 rounded-xl p-8">
                  <Image
                    src="/roi-report-screenshot.png"
                    alt="Professional ROI Report"
                    width={700}
                    height={500}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl font-bold mb-6 text-[#1A1A1A]">
                  Professional ROI Reports
                </h3>
                <p className="text-lg text-[#3C3C3C] mb-6 leading-relaxed">
                  Generate comprehensive ROI reports that showcase the complete financial impact of automation. 
                  Professional layouts with detailed breakdowns, platform comparisons, and business impact summaries.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Complete financial analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Platform cost comparisons</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#37036A] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Professional presentation format</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Generation Feature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-[#1A1A1A]">
                  ROI-Backed Client Communication
                </h3>
                <p className="text-lg text-[#3C3C3C] mb-6 leading-relaxed">
                  Transform your ROI analysis into persuasive client emails. Generate professional 
                  communications that highlight cost savings and business impact with your branding.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Personalized email templates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">ROI data integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#F15533] rounded-full"></div>
                    <span className="text-[#1A1A1A] font-medium">Professional formatting</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#F15533]/10 to-[#37036A]/10 rounded-xl p-8">
                  <Image
                    src="/email-generated-screenshot.png"
                    alt="Email Generation"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 bg-[#FEFAF0]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Trusted by Automation Professionals</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StatCard
              number="1,000+"
              label="Apps & Pricing Entries"
              description="Comprehensive database of automation tools with real-time pricing data for accurate proposals"
              icon={<Calculator className="h-8 w-8" />}
            />
            <StatCard
              number="70%"
              label="Faster Proposal Creation"
              description="Reduce proposal time from days to hours with automated ROI calculations and templates"
              icon={<Clock className="h-8 w-8" />}
            />
            <StatCard
              number="2,000+"
              label="Proven Templates"
              description="Curated workflow templates from real automation projects across industries"
              icon={<Zap className="h-8 w-8" />}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Badge variant="outline" className="mb-6">
            <Target className="mr-2 h-3 w-3" />
            How It Works
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-[#1A1A1A]">
            From Discovery to Signed Contract
          </h2>
          <p className="text-xl text-[#3C3C3C] mb-16 max-w-3xl mx-auto">
            Streamline your sales process with data-driven automation proposals
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <StepCard
              step="1"
              title="Import or Generate"
              description="Upload JSON from existing workflows or describe your automation needs to find the perfect template"
              icon={<Upload className="h-6 w-6" />}
            />
            <StepCard
              step="2"
              title="Calculate ROI"
              description="Automatic cost analysis across platforms with real-time pricing and time savings calculations"
              icon={<Calculator className="h-6 w-6" />}
            />
            <StepCard
              step="3"
              title="Generate Proposal"
              description="Create professional reports and client communications with your ROI analysis and branding"
              icon={<FileText className="h-6 w-6" />}
            />
            <StepCard
              step="4"
              title="Close the Deal"
              description="Present compelling, data-backed proposals that justify automation investments and close deals"
              icon={<Target className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 bg-[#F15533]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Ready to Win More Automation Deals?
          </h2>
          <p className="text-xl text-white/90 leading-relaxed mb-8">
            Join automation consultants who are closing deals faster with data-driven proposals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => setImportDialogOpen(true)} 
              className="bg-white text-[#F15533] hover:bg-white/90 px-8 py-6 text-xl font-bold"
            >
              <Upload className="mr-3 h-6 w-6" />
              Import Your First Workflow
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-white text-white hover:bg-white hover:text-[#F15533] px-8 py-6 text-xl font-bold"
            >
              <Link href="/build">
                <Rocket className="mr-3 h-6 w-6" />
                Start Building
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Import Dialog */}
      <ImportWorkflowDialog 
        isOpen={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)} 
      />
    </main>
  );
}

function StatCard({ icon, number, label, description }: {
  icon: React.ReactNode;
  number: string;
  label: string;
  description: string;
}) {
  return (
    <Card className="border-[#E2C3B9] bg-white shadow-sm transition-all hover:shadow-lg group">
      <CardContent className="p-8 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center bg-[#F15533]/10 text-[#F15533] group-hover:bg-[#F15533]/20 transition-colors rounded-lg">
          {icon}
        </div>
        <div className="text-4xl font-black font-mono text-[#1A1A1A] mb-2">{number}</div>
        <div className="text-lg font-bold text-[#1A1A1A] mb-3">{label}</div>
        <p className="text-sm text-[#3C3C3C] leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, description, icon }: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center bg-[#F15533] text-white font-mono text-xl font-bold group-hover:scale-110 transition-transform rounded-lg">
        {step}
      </div>
      <div className="mb-4 mx-auto flex h-8 w-8 items-center justify-center bg-[#F15533]/10 text-[#F15533] rounded">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-[#1A1A1A]">{title}</h3>
      <p className="text-sm text-[#3C3C3C] leading-relaxed">{description}</p>
    </div>
  );
}
