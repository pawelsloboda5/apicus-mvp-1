"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Wand2, BarChart3, Sparkles, Loader2, Calculator, Zap, TrendingUp, Clock, DollarSign, ArrowRight, Lightbulb, Target, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Simple Badge component since it doesn't exist
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "text-foreground": variant === "outline",
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
        console.error("API search error:", res.status, await res.text());
        router.push(`/build?q=${encodeURIComponent(q)}`);
        return;
      }
      const data = await res.json();
      
      if (data.templates && data.templates.length > 0) {
        const primaryTemplate = data.templates[0];
        console.log("Primary template found:", primaryTemplate.templateId, "for query:", q);
        router.push(`/build?tid=${primaryTemplate.templateId}&q=${encodeURIComponent(q)}`);
      } else {
        console.log("No template found for query:", q);
        router.push(`/build?q=${encodeURIComponent(q)}`);
      }
    } catch (err) {
      console.error("Error during template search/redirect:", err);
      router.push('/build');
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <GradientBlob className="bg-primary/20 top-[-10rem] left-1/4 animate-float" />
      <GradientBlob className="bg-accent/20 bottom-[-12rem] right-1/4 animate-float" style={{ animationDelay: '1s' }} />

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-20 md:py-32">
        <div className="mx-auto max-w-6xl text-center">
          {/* Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              "mb-6 font-pixel text-xs tracking-wide animate-pixel-shimmer",
              mounted && "animate-fade-in"
            )}
          >
            <Sparkles className="mr-2 h-3 w-3" />
            AI-Powered ROI Calculator
          </Badge>

          {/* Main Headline */}
          <h1
            className={cn(
              "mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl",
              mounted && "animate-fade-in"
            )}
          >
            Prove Automation ROI{" "}
            <span className="text-gradient font-pixel">in Minutes</span>
          </h1>

          {/* ROI Examples */}
          <div className={cn(
            "mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-4 text-sm",
            mounted && "animate-fade-in"
          )} style={{ animationDelay: '200ms' }}>
            <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2">
              <span className="font-pixel text-success">6,700× ROI</span> <span className="text-success/80">in 30 days</span>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
              <span className="text-foreground">Save </span><span className="font-pixel text-primary">33 hrs/month</span>
            </div>
            <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
              <span className="font-pixel text-warning">$2,100</span> <span className="text-warning/80">monthly value</span>
            </div>
          </div>

          <p className={cn(
            "mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl",
            mounted && "animate-fade-in"
          )} style={{ animationDelay: '400ms' }}>
            Build visual workflows, calculate precise ROI, and justify automation projects with AI-powered insights. No spreadsheets, no guesswork.
          </p>

          {/* Generate Form */}
          <form
            onSubmit={handleGenerate}
            className={cn(
              "relative mx-auto mt-10 flex w-full max-w-xl items-center gap-3",
              mounted && "animate-fade-in"
            )}
            style={{ animationDelay: '600ms' }}
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Describe your automation (e.g., Invoice processing from email to QuickBooks)"
                className="w-full rounded-lg border-2 border-input bg-background px-4 py-4 text-base shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-40"
                disabled={searching}
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={searching} 
              className="animate-pulse-glow px-8 py-4 text-base font-semibold shadow-lg"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </form>

          <div className={cn(
            "mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row",
            mounted && "animate-fade-in"
          )} style={{ animationDelay: '800ms' }}>
            <Button variant="ghost" asChild>
              <Link href="/build" className="text-muted-foreground hover:text-foreground">
                Or start with a blank canvas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard
              icon={<Calculator className="h-8 w-8" />}
              number="1,000+"
              label="Apps Database"
              description="Pre-loaded with pricing data from Zapier, Make, and n8n"
            />
            <StatCard
              icon={<TrendingUp className="h-8 w-8" />}
              number="70%"
              label="Faster ROI Analysis"
              description="Skip the spreadsheets. Get precise calculations instantly"
            />
            <StatCard
              icon={<Lightbulb className="h-8 w-8" />}
              number="7,000+"
              label="Workflow Templates"
              description="Trained on real automations from top platforms"
            />
          </div>
        </div>
      </section>

      {/* Platform Logos */}
      <section className="relative z-10 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Built for the tools you already use
          </p>
          <div className="flex items-center justify-center gap-12 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-2xl font-bold font-pixel">ZAPIER</div>
            <div className="text-2xl font-bold font-pixel">MAKE</div>
            <div className="text-2xl font-bold font-pixel">N8N</div>
          </div>
        </div>
      </section>

      {/* ROI Case Studies */}
      <section className="relative z-10 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Real ROI Results
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See how automation projects deliver measurable value
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <ROICard
              title="Invoice Processing"
              time="33 hours/month saved"
              cost="$25/month"
              roi="6,700× return"
              description="Automated invoice data extraction and QuickBooks entry"
              platform="Make"
            />
            <ROICard
              title="Lead Qualification"
              time="45 hours/month saved"
              cost="$50/month"
              roi="2,340× return"
              description="Automated lead scoring and CRM updates from web forms"
              platform="Zapier"
            />
            <ROICard
              title="Report Generation"
              time="28 hours/month saved"
              cost="$15/month"
              roi="4,200× return"
              description="Automated weekly reports from multiple data sources"
              platform="n8n"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need for ROI analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Wand2 className="h-8 w-8 text-primary" />}
              title="Visual Workflow Builder"
              description="Drag-and-drop canvas with pixel-perfect nodes. Design automations visually."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-primary" />}
              title="Real-Time ROI Calculation"
              description="See time saved, costs, and ROI update instantly as you build."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="AI-Powered Insights"
              description="Smart defaults, recommendations, and natural language explanations."
            />
            <FeatureCard
              icon={<BadgeCheck className="h-8 w-8 text-primary" />}
              title="Multi-Platform Support"
              description="Compare costs across Zapier, Make, and n8n in real-time."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground mb-16">
            From idea to ROI report in three simple steps
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="Describe Your Process"
              description="Tell our AI what you want to automate, or choose from 7,000+ templates"
              icon={<Target className="h-6 w-6" />}
            />
            <StepCard
              step="2"
              title="Build Visually"
              description="Design your workflow on our pixel-art canvas with drag-and-drop simplicity"
              icon={<Wand2 className="h-6 w-6" />}
            />
            <StepCard
              step="3"
              title="Get ROI Results"
              description="Receive detailed analysis, cost breakdowns, and presentation-ready reports"
              icon={<BarChart3 className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Ready to prove your automation ROI?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of automation experts who use Apicus to justify their projects
          </p>
          <Button size="lg" asChild className="animate-pulse-glow px-8 py-4 text-lg font-semibold">
            <Link href="/build">
              <Rocket className="mr-2 h-5 w-5" />
              Start Building
            </Link>
          </Button>
        </div>
      </section>

      {/* Subtle pixel grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_49%,theme(colors.border)_50%),linear-gradient(to_bottom,transparent_49%,theme(colors.border)_50%)] bg-[size:2rem_2rem] opacity-[0.02] dark:opacity-[0.05]" />
    </main>
  );
}

function GradientBlob({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "absolute h-96 w-96 rounded-full blur-3xl filter",
        className
      )}
      {...props}
    />
  );
}

function StatCard({ icon, number, label, description }: {
  icon: React.ReactNode;
  number: string;
  label: string;
  description: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg">
      <CardContent className="p-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="text-3xl font-bold font-pixel text-foreground">{number}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ROICard({ title, time, cost, roi, description, platform }: {
  title: string;
  time: string;
  cost: string;
  roi: string;
  description: string;
  platform: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline" className="font-pixel text-xs">{platform}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Saved:</span>
            <span className="font-medium text-success">{time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Cost:</span>
            <span className="font-medium">{cost}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">ROI:</span>
            <span className="font-bold font-pixel text-success">{roi}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg">
      <CardContent className="p-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
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
    <div className="relative">
      <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-pixel text-xl font-bold">
        {step}
      </div>
      <div className="mb-4 mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
