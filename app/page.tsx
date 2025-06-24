"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, BarChart3, Sparkles, Loader2, Calculator, TrendingUp, Target, Rocket, Users, Zap,Crown, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const benefits = [
    {
      title: "Compare ROI across Zapier, Make, and n8n to strengthen your pitch",
      icon: <BarChart3 className="h-12 w-12" />,
    },
    {
      title: "Deliver a polished ROI summary that elevates your proposal above your competition",
      icon: <Crown className="h-12 w-12" />,
    },
    {
      title: "Turn client use cases into automation-ready outlines for Zapier, Make, and n8n",
      icon: <Target className="h-12 w-12" />,
    },
    {
      title: "Project automation ROI with a model designed to handle real-world variables",
      icon: <Calculator className="h-12 w-12" />,
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

  const nextBenefit = () => {
    setCurrentBenefit((prev) => (prev + 1) % benefits.length);
  };

  const prevBenefit = () => {
    setCurrentBenefit((prev) => (prev - 1 + benefits.length) % benefits.length);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      {/* Hero Section */}
      <section className="relative bg-background min-h-screen">
        <div className="relative z-10 px-4 py-20 md:py-32">
          <div className="mx-auto max-w-6xl text-center">
           

            <h1
              className={cn(
                "mx-auto my-15 max-w-4xl text-5xl font-black leading-[1.1] tracking-tight text-foreground md:text-7xl lg:text-8xl",
                mounted && "animate-fade-in"
              )}
            >
              Close More Clients with{" "}
              <span className="text-gradient-orange">ROI-Backed</span>{" "}
              Proposals.
            </h1>

            <p className={cn(
              "mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-muted-foreground md:text-2xl",
              mounted && "animate-fade-in"
            )} style={{ animationDelay: '200ms' }}>
              <span className="text-gradient-orange font-bold">Apicus</span> turns your workflow ideas into ROI reports that help you{" "}
              <span className="text-foreground font-semibold">win clients</span>
            </p>

            {/* CTA Section */}
            <div className={cn(
              "mt-12  flex flex-col items-center gap-6",
              mounted && "animate-fade-in"
            )} style={{ animationDelay: '400ms' }}>

              {/* Primary CTA - Import Workflow */}
              <Button 
                size="lg" 
                onClick={() => setImportDialogOpen(true)}
                className="animate-pulse-glow px-12 py-6 text-xl font-bold shadow-lg"
              >
                <Upload className="mr-3 h-6 w-6" />
                Import from Make, n8n, or Zapier
              </Button>

              <span className="text-sm font-medium text-muted-foreground">or</span>

              {/* Secondary CTA – Generate */}
              <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Describe your client's automation need..."
                  className="flex-1 rounded-xl border-2 border-input bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-40"
                  disabled={searching}
                />
                <Button 
                  type="submit" 
                  disabled={searching} 
                  variant="outline"
                  className="px-6 py-3 font-semibold"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="relative z-10 py-16 flex items-center justify-center" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            The first ROI platform built for
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-2xl font-semibold">
            <span className="text-gradient-orange">consultants</span>
            <span className="text-muted-foreground">,</span>
            <span className="text-gradient-orange">freelancers</span>
            <span className="text-muted-foreground">and</span>
            <span className="text-gradient-orange">agencies</span>
          </div>
        </div>
      </section>

      {/* Benefits Carousel */}
      <section className="relative z-10 py-20 min-h-[50vh]" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="mr-2 h-3 w-3" />
              Benefits
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
              Why Choose Apicus?
            </h2>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={prevBenefit}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-auto max-w-4xl">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg min-h-[300px]">
                  <CardContent className="p-12 text-center">
                    <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {benefits[currentBenefit].icon}
                    </div>
                    <h3 className="text-2xl font-bold leading-relaxed text-foreground">
                      {benefits[currentBenefit].title}
                    </h3>
                  </CardContent>
                </Card>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextBenefit}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
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
                    index === currentBenefit ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 min-h-[50vh]" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StatCard
              number="1,000+"
              label="Apps and pricing entries"
              description="Quickly compare platform costs and uncover cheaper alternatives"
              icon={<Calculator className="h-8 w-8" />}
            />
            <StatCard
              number="70%"
              label="Faster discovery in live sales moments"
              description="Figure out what tools to use - plus instant pricing and ROI"
              icon={<TrendingUp className="h-8 w-8" />}
            />
            <StatCard
              number="7,000+"
              label="Real-world workflows"
              description="Trained on Zapier, n8n and Make templates to help you automate and pitch faster"
              icon={<Zap className="h-8 w-8" />}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 min-h-screen" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
              Apicus Features
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FeatureCard
              icon="📥"
              title="Workflow Import from Make, n8n & Zapier"
              description="Drag-and-drop import of existing workflows with automatic ROI analysis"
              variant="highlight"
            />
            <FeatureCard
              icon="🔥"
              title="Automation ROI Engine"
              description="Calculate precise ROI with real-world variables and industry benchmarks"
            />
            <FeatureCard
              icon="📊"
              title="Client-ready ROI summaries"
              description="Professional reports that win proposals and justify automation investments"
            />
            <FeatureCard
              icon="⚡"
              title="Proposal-focused cost estimator"
              description="Instant pricing data for accurate project quotes and budgets"
            />
            <FeatureCard
              icon="🤖"
              title="Workflow template generator (AI-Powered)"
              description="Generate automation workflows from natural language descriptions"
            />
            <FeatureCard
              icon="📧"
              title="Auto-Generate ROI-Backed client emails"
              description="Turn your ROI analysis into persuasive client communications"
            />
            <FeatureCard
              icon="📋"
              title="Workflow Versioning for client proposals"
              description="Track changes and present multiple scenarios to clients"
            />
            <FeatureCard
              icon="💰"
              title="Live pricing dataset for automation tools"
              description="Always up-to-date pricing information for accurate cost calculations"
            />
          </div>
        </div>
      </section>

      {/* Platform Logos */}
      <section className="relative z-10 py-32" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Import workflows from the tools your clients already use
          </p>
          <div className="flex items-center justify-center gap-12 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-2xl font-bold font-mono tracking-wider text-foreground">ZAPIER</div>
            <div className="text-2xl font-bold font-mono tracking-wider text-foreground">MAKE</div>
            <div className="text-2xl font-bold font-mono tracking-wider text-foreground">N8N</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
          <Badge variant="outline" className="mb-6">
            <Target className="mr-2 h-3 w-3" />
            How It Works
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-16 text-foreground">
            From workflow to signed contract in 4 steps
          </h2>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
            <StepCard
              step="1"
              title="Import your existing workflows"
              description="Drag & drop JSON exports from Make, n8n, or Zapier. Or generate new ones from descriptions."
              icon={<Upload className="h-6 w-6" />}
            />
            <StepCard
              step="2"
              title="Describe your client or workflow goal"
              description="Tell us what kind of business you're pitching or task you want automated – We'll tell you where to start"
              icon={<Target className="h-6 w-6" />}
            />
            <StepCard
              step="3"
              title="Generate a Workflow & ROI"
              description="AI suggests automations and calculates ROI instantly."
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <StepCard
              step="4"
              title="Compare tools & pricing"
              description="Tailor your stack with live pricing and ROI differences."
              icon={<Calculator className="h-6 w-6" />}
            />
            <StepCard
              step="5"
              title="Real-time team collaboration"
              description="Co-edit visual workflows, cold-email templates, and ROI reports with your team."
              icon={<Users className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
            Ready to win more clients?
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Start building ROI-backed proposals today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => setImportDialogOpen(true)} className="animate-pulse-glow px-12 py-6 text-xl font-bold">
              <Upload className="mr-3 h-6 w-6" />
              Import Your Workflow
            </Button>
            <Button size="lg" variant="outline" asChild className="px-12 py-6 text-xl font-bold">
              <Link href="/build">
                <Rocket className="mr-3 h-6 w-6" />
                Start from Scratch
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
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg group">
      <CardContent className="p-8 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <div className="text-4xl font-black font-mono text-foreground mb-2">{number}</div>
        <div className="text-lg font-bold text-foreground mb-3">{label}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, description, variant }: {
  icon: string;
  title: string;
  description: string;
  variant?: "highlight";
}) {
  return (
    <Card className={cn(
      "border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg group",
      variant === "highlight" && "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
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
      <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-xl font-bold group-hover:scale-110 transition-transform">
        {step}
      </div>
      <div className="mb-4 mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
