"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Sparkles, Loader2, Calculator, TrendingUp, Target, Rocket, Zap, ChevronLeft, ChevronRight, Upload, ArrowRight, Clock, FileText, ChevronDown, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

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

// Header component with auth buttons
function Header() {
  const { data: session, status } = useSession();
  
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-[#1A1A1A]">
          Apicus
        </div>
        
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-[#3C3C3C]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[#3C3C3C]">
                <User className="h-4 w-4" />
                {session.user?.name || session.user?.email}
              </div>
              <Button 
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="border-[#E2C3B9] text-[#3C3C3C] hover:bg-[#F15533] hover:text-white hover:border-[#F15533]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
              <Link href="/build">
                <Button 
                  size="sm"
                  className="bg-[#F15533] hover:bg-[#D4452A] text-white"
                >
                  Go to Builder
                </Button>
              </Link>
            </div>
          ) : (
            <Button 
              onClick={() => signIn("google")}
              className="bg-[#F15533] hover:bg-[#D4452A] text-white"
            >
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

type PlatformType = "zapier" | "n8n";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [currentBenefit, setCurrentBenefit] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("zapier");
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
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

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPlatformDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [platformDropdownOpen]);

  // Platform theme configuration
  const platformThemes = {
    zapier: {
      primary: "#F15533",
      primaryHover: "#D4452A",
      primaryLight: "#F15533/20",
      border: "#E2C3B9",
      text: "#F15533"
    },
    n8n: {
      primary: "#FF6B35", 
      primaryHover: "#E55A2B",
      primaryLight: "#FF6B35/20",
      border: "#FFB4A1",
      text: "#FF6B35"
    }
  };

  const currentTheme = platformThemes[selectedPlatform];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) {
      router.push(`/build?platform=${selectedPlatform}`);
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/templates/search?q=${encodeURIComponent(q)}&platform=${selectedPlatform}`);
      if (!res.ok) {
        // If search fails, create a new scenario with default template
        router.push(`/build?q=${encodeURIComponent(q)}&default=true&platform=${selectedPlatform}`);
        return;
      }
      const data = await res.json();
      
      if (data.templates && data.templates.length > 0) {
        // Navigate to build page with the first template
        const template = data.templates[0];
        router.push(`/build?tid=${template.templateId}&q=${encodeURIComponent(q)}&platform=${selectedPlatform}`);
      } else {
        // No templates found, go to build with default template
        router.push(`/build?q=${encodeURIComponent(q)}&default=true&platform=${selectedPlatform}`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to build page with query and default template
      router.push(`/build?q=${encodeURIComponent(q)}&default=true&platform=${selectedPlatform}`);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate(e as unknown as React.FormEvent);
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
      <Header />
      
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
                  Choose from <span className="font-bold" style={{ color: currentTheme.text }}>2,000+ proven templates</span> based on your description
                </p>
                <form onSubmit={handleGenerate} className="flex flex-col items-center gap-4">
                  {/* Platform Selector */}
                  <div ref={dropdownRef} className="relative w-full max-w-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPlatformDropdownOpen(!platformDropdownOpen);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15533]"
                      style={{ 
                        borderColor: currentTheme.border,
                        color: currentTheme.text 
                      }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        Platform: <span className="capitalize font-bold">{selectedPlatform}</span>
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        platformDropdownOpen && "rotate-180"
                      )} />
                    </button>
                    
                    {platformDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {(["zapier", "n8n"] as PlatformType[]).map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedPlatform(platform);
                              setPlatformDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg capitalize font-medium",
                              selectedPlatform === platform && "bg-gray-50"
                            )}
                            style={{ 
                              color: platformThemes[platform].text 
                            }}
                          >
                            {platform}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input Field */}
                  <div className="w-full max-w-2xl">
                    <textarea
                      ref={inputRef}
                      placeholder="Describe what you want to automate (e.g., 'Process invoices from Gmail and update QuickBooks')"
                      className="w-full p-4 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15533] transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ borderColor: currentTheme.border }}
                      rows={3}
                      onKeyDown={handleKeyDown}
                    />
                    <p className="text-xs text-[#97756B] mt-2 text-left">
                      Enter to generate • Shift+Enter for new line
                    </p>
                  </div>

                  {/* Generate Button */}
                  <Button 
                    type="submit" 
                    disabled={searching}
                    size="lg"
                    className="px-8 py-4 text-lg font-bold shadow-lg rounded-lg transition-all duration-200 transform hover:scale-105"
                    style={{ 
                      backgroundColor: currentTheme.primary,
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.primaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.primary;
                    }}
                  >
                    {searching ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Finding templates...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-6 w-6" />
                        We'll find the best template & calculate ROI instantly
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#F15533' }}></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#37036A' }}></div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#1A1A1A] mb-6">
              Close More Automation Deals
            </h2>
            <p className="text-xl text-[#3C3C3C] max-w-3xl mx-auto leading-relaxed">
              Stop losing deals to competitors with better proposals. Apicus helps automation consultants build data-driven cases that clients can't refuse.
            </p>
          </div>
          
          {/* Animated Benefit Showcase */}
          <div className="relative h-80 overflow-hidden rounded-xl bg-gradient-to-br from-[#FEFAF0] to-[#F8F2E8] shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className={cn(
                  "mb-6 flex justify-center transition-all duration-500",
                  benefits[currentBenefit].color
                )}>
                  {benefits[currentBenefit].icon}
                </div>
                <h3 className="text-2xl font-bold text-[#1A1A1A] leading-tight">
                  {benefits[currentBenefit].title}
                </h3>
              </div>
            </div>
            
            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {benefits.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBenefit(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === currentBenefit 
                      ? "bg-[#F15533] scale-110" 
                      : "bg-[#E2C3B9] hover:bg-[#D4A597]"
                  )}
                />
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevBenefit}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="h-6 w-6 text-[#1A1A1A]" />
            </button>
            <button
              onClick={nextBenefit}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="h-6 w-6 text-[#1A1A1A]" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#37036A]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard 
              icon={<Calculator className="h-12 w-12" />}
              number="2,000+"
              label="Proven Templates"
              description="Automation workflows across all major platforms"
            />
            <StatCard 
              icon={<TrendingUp className="h-12 w-12" />}
              number="340%"
              label="Average ROI"
              description="Calculated across client implementations"
            />
            <StatCard 
              icon={<Rocket className="h-12 w-12" />}
              number="< 5 min"
              label="Time to Proposal"
              description="From description to professional ROI report"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#1A1A1A] mb-6">
              How Apicus Works
            </h2>
            <p className="text-xl text-[#3C3C3C] max-w-3xl mx-auto">
              From client brief to professional proposal in minutes, not hours
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              step="01"
              title="Describe the Automation"
              description="Tell us what your client wants to automate in plain English"
              icon={<FileText className="h-8 w-8" />}
            />
            <StepCard 
              step="02"
              title="We Find the Best Template"
              description="Our AI matches you with proven workflows from our 2,000+ template library"
              icon={<Sparkles className="h-8 w-8" />}
            />
            <StepCard 
              step="03"
              title="Get Professional ROI Report"
              description="Download a beautiful report with ROI calculations, cost comparisons, and implementation timeline"
              icon={<BarChart3 className="h-8 w-8" />}
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#37036A] to-[#4B1D7A]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            Stop Losing Deals to Better Proposals
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join automation consultants who close 3x more deals with data-driven ROI cases that clients trust.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => setImportDialogOpen(true)}
              className="bg-[#F15533] hover:bg-[#D4452A] text-white px-8 py-6 text-xl font-bold shadow-lg"
            >
              <Upload className="mr-3 h-6 w-6" />
              Start with Your Workflow
            </Button>
            <span className="text-white/70 text-sm">or</span>
            <Button 
              size="lg"
              onClick={() => inputRef.current?.focus()}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#37036A] px-8 py-6 text-xl font-bold"
            >
              <Sparkles className="mr-3 h-6 w-6" />
              Generate New Proposal
            </Button>
          </div>

          <p className="text-white/60 text-sm mt-8">
            No credit card required • Professional reports in minutes
          </p>
        </div>
      </section>

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
    <div className="text-white">
      <div className="mb-4 flex justify-center text-[#D4A597]">
        {icon}
      </div>
      <div className="text-4xl font-black mb-2">{number}</div>
      <div className="text-xl font-bold mb-2">{label}</div>
      <div className="text-white/80">{description}</div>
    </div>
  );
}

function StepCard({ step, title, description, icon }: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-8 border-2 border-[#E2C3B9] hover:border-[#F15533] transition-all duration-300 hover:shadow-lg group">
      <CardContent className="p-0">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F15533] text-white flex items-center justify-center text-2xl font-black mb-4 group-hover:scale-110 transition-transform duration-300">
            {step}
          </div>
          <div className="text-[#F15533] mb-4 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{title}</h3>
        <p className="text-[#3C3C3C] leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}