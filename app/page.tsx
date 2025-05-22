"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Wand2, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  // Small client-only hook to fade-in hero for a touch of delight
  const [mounted, setMounted] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 overflow-hidden">
      {/* Decorative blurred gradient blobs */}
      <GradientBlob className="bg-primary/30 top-[-6rem] left-1/2" />
      <GradientBlob className="bg-secondary/30 bottom-[-8rem] right-1/3" />

      <section className="z-10 text-center space-y-6">
        <h1
          className={cn(
            "max-w-5xl text-5xl font-extrabold leading-tight tracking-tighter sm:text-7xl lg:text-8xl",
            mounted && "animate-fade-in"
          )}
        >
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Quantify Automation ROI
          </span>{" "}
          in Minutes<span className="text-primary">.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Describe a business process and let Apicus suggest the closest ready-made automation—or jump right in and build from scratch.
        </p>

        {/* Business-process query input */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const q = inputRef.current?.value.trim();
            if (!q) return;
            setSearching(true);
            try {
              const res = await fetch(`/api/templates/search?q=${encodeURIComponent(q)}`);
              const data = await res.json();
              if (data.templateId) {
                router.push(`/build?tid=${data.templateId}`);
              } else {
                alert("No matching template found");
              }
            } catch (_err) {
              alert("Search failed. Please try again.");
            } finally {
              setSearching(false);
            }
          }}
          className="relative mx-auto mt-8 flex w-full max-w-xl items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            name="q"
            required
            placeholder="e.g. Send a Slack alert when a Stripe payment fails"
            className="flex-1 rounded-md border px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
            disabled={searching}
          />
          <Button type="submit" size="lg" disabled={searching} className="flex items-center gap-2">
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            {searching ? "Searching…" : "Find Template"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="shadow-lg" asChild>
            <Link href="/build">Start Blank</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section
        id="features"
        className="z-10 mt-24 grid w-full max-w-6xl gap-12 px-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Feature icon={BadgeCheck} title="Smart Defaults" description="AI suggests reasonable numbers even when you're unsure—goodbye blank fields." />
        <Feature icon={Wand2} title="Drag-and-Drop Canvas" description="Visually map your automation in a playful pixel-art editor powered by React Flow." />
        <Feature icon={BarChart3} title="Modular Dashboard" description="Present ROI metrics in movable, resizable widgets styled like Notion blocks." />
        <Feature icon={Sparkles} title="AI Insights" description="Let our agent surface hidden opportunities and scenario projections instantly." />
      </section>

      {/* Subtle animated grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,transparent_49%,theme(colors.border)_50%),linear-gradient(to_bottom,transparent_49%,theme(colors.border)_50%)] bg-[size:2rem_2rem] opacity-[0.05] dark:opacity-[0.08]" />
    </main>
  );
}

function GradientBlob({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute h-72 w-72 rounded-full blur-3xl filter",
        className,
        "animate-blob"
      )}
    />
  );
}

type FeatureProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

function Feature({ icon: Icon, title, description }: FeatureProps) {
  return (
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-background shadow-inner">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold lg:text-xl">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed lg:text-base">
        {description}
      </p>
    </div>
  );
}
