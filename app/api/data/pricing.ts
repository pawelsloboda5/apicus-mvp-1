/*  ============================================================================
    Apicus – Pricing & Limits (v2025-05-18)
    ----------------------------------------------------------------------------
    Zapier       → billed per “task”
    Make.com     → billed per “operation”
    n8n (cloud)  → billed per “execution”
    This file is tree-shakable and <3 KB gzip.  Import anywhere in the repo.
    ========================================================================= */

/* ---------- Types --------------------------------------------------------- */

export type Unit = "task" | "op" | "exec";

export interface Tier {
  /** Marketing name (“Professional”, “Teams”, …) */
  name: string;
  /** Monthly price in USD when billed annually (cloud vendors quote that)   */
  monthlyUSD: number;
  /** Included quota of billing units per month (or per year if annualPool)  */
  quota: number;
  /** tasks | ops | execs                                                    */
  unit: Unit;
  /** $/unit for overage packs OR auto-purchase rate (Zapier/Make)           */
  overageRate?: number;
  /** Zapier Enterprise & Make Enterprise pool tasks annually instead of mo */
  annualPool?: boolean;
  /** Soft or hard caps (app limits, step caps, concurrency, etc.)           */
  notes?: string[];
}

export interface PlatformPricing {
  platform: "zapier" | "make" | "n8n";
  tiers: Tier[];
  /** default unit label so callers don’t repeat themselves */
  unit: Unit;
  /** quick helper to compute monthly cost incl. overage                      */
  cost: (tierName: string, usedUnits: number) => { cost: number; over: number };
}

/* ---------- Data ---------------------------------------------------------- */

export const pricing: Record<"zapier" | "make" | "n8n", PlatformPricing> = {
  zapier: {
    platform: "zapier",
    unit: "task",
    tiers: [
      {
        name: "Free",
        monthlyUSD: 0,
        quota: 100,
        unit: "task",
        notes: [
          "Basic & premium triggers (15-min polling)",
          "2-step Zaps only",
          "100-task hard stop"
        ]
      },
      {
        name: "Professional",
        monthlyUSD: 19.99,
        quota: 2_000,
        unit: "task",
        overageRate: 0.0125, // 1.25× ~$0.01 base rate
        notes: [
          "Unlimited Zaps • Multi-step • 1-min polling • Webhooks",
          "Live chat support when >2 000 tasks",
          "AI Builder included"
        ]
      },
      {
        name: "Team",
        monthlyUSD: 69,
        quota: 50_000,
        unit: "task",
        overageRate: 0.0099,
        notes: [
          "25 seats included • Shared connections/workspaces",
          "SAML SSO • Premier support"
        ]
      },
      {
        name: "Enterprise",
        monthlyUSD: 0, // custom
        quota: 100_000,
        unit: "task",
        annualPool: true,
        overageRate: 0.0085,
        notes: [
          "Annual task pool, resets yearly",
          "Unlimited users • SOC2 • SLA • TAM • Analytics"
        ]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.zapier.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("Zapier tier not found");
      const over = Math.max(0, used - tier.quota);
      const overCost =
        tier.overageRate && over ? over * tier.overageRate : 0;
      return { cost: tier.monthlyUSD + overCost, over: overCost };
    }
  },

  make: {
    platform: "make",
    unit: "op",
    tiers: [
      {
        name: "Free",
        monthlyUSD: 0,
        quota: 1_000,
        unit: "op",
        notes: [
          "2 active scenarios • 15-min scheduling",
          "5 GB data transfer/month"
        ]
      },
      {
        name: "Core",
        monthlyUSD: 9,
        quota: 10_000,
        unit: "op",
        overageRate: 0.0009, // bundle pricing
        notes: ["Unlimited scenarios • 1-min scheduling"]
      },
      {
        name: "Pro",
        monthlyUSD: 16,
        quota: 50_000,
        unit: "op",
        overageRate: 0.00032,
        notes: ["Priority runs • Advanced variables/logs"]
      },
      {
        name: "Teams",
        monthlyUSD: 29,
        quota: 100_000,
        unit: "op",
        overageRate: 0.00029,
        notes: ["Roles & sharing • Unlimited users"]
      },
      {
        name: "Enterprise",
        monthlyUSD: 0, // custom
        quota: 0, // unlimited
        unit: "op",
        notes: ["SSO • Audit logs • 24/7 SLA • Annual ops pool"]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.make.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("Make tier not found");
      const over = Math.max(0, used - tier.quota);
      const overCost =
        tier.overageRate && over ? over * tier.overageRate : 0;
      return { cost: tier.monthlyUSD + overCost, over: overCost };
    }
  },

  n8n: {
    platform: "n8n",
    unit: "exec",
    tiers: [
      {
        name: "Starter",
        monthlyUSD: 24,
        quota: 2_500,
        unit: "exec",
        notes: [
          "5 active workflows • 5 concurrent runs",
          "7-day log retention"
        ]
      },
      {
        name: "Pro",
        monthlyUSD: 60,
        quota: 10_000,
        unit: "exec",
        notes: [
          "15 active workflows • 20 concurrent",
          "14-day logs • RBAC"
        ]
      },
      {
        name: "Pro-50k",
        monthlyUSD: 120,
        quota: 50_000,
        unit: "exec",
        notes: ["50 active workflows • same features as Pro"]
      },
      {
        name: "Enterprise",
        monthlyUSD: 0, // custom
        quota: 0, // unlimited
        unit: "exec",
        notes: [
          "200+ concurrent • 365-day logs • SSO",
          "Dedicated infra/support"
        ]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.n8n.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("n8n tier not found");
      if (tier.quota === 0) return { cost: tier.monthlyUSD, over: 0 }; // unlimited
      const over = Math.max(0, used - tier.quota);
      // n8n has no overage packs; must upgrade
      return {
        cost: tier.monthlyUSD,
        over: over ? Infinity : 0 // signal “upgrade required”
      };
    }
  }
};

/* ---------- Helper: find cheapest platform for a workload -------------- */

export function cheapestOption(
  unitsPerMonth: number,
  platforms: ("zapier" | "make" | "n8n")[] = ["zapier", "make", "n8n"]
) {
  let best:
    | { platform: string; tier: string; monthly: number }
    | undefined;

  platforms.forEach(p => {
    pricing[p].tiers.forEach(t => {
      if (t.quota === 0) return; // unlimited, custom pricing
      const { cost } = pricing[p].cost(t.name, unitsPerMonth);
      if (!best || cost < best.monthly) {
        best = { platform: p, tier: t.name, monthly: cost };
      }
    });
  });

  return best!;
}
