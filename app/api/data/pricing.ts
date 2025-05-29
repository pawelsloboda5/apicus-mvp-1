/*  ============================================================================
    Apicus – Pricing & Limits (v2025-05-18)
    ----------------------------------------------------------------------------
    Zapier       → billed per "task"
    Make.com     → billed per "operation"
    n8n (cloud)  → billed per "execution"
    This file is tree-shakable and <3 KB gzip.  Import anywhere in the repo.
    ========================================================================= */

/* ---------- Types --------------------------------------------------------- */

export type Unit = "task" | "op" | "exec";

export interface Tier {
  /** Marketing name ("Professional", "Teams", …) */
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
  /** default unit label so callers don't repeat themselves */
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
          "100-task hard stop per month",
          "Zapier automation platform (Zaps, basic Interfaces, basic Tables)",
          "Unlimited Zaps (within task limit)",
          "Two-step Zaps only",
          "AI power-ups"
        ]
      },
      // Professional Tiers
      {
        name: "Professional 750 tasks",
        monthlyUSD: 29.99,
        quota: 750,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email support"
        ]
      },
      {
        name: "Professional 2K tasks",
        monthlyUSD: 73.50,
        quota: 2000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 5K tasks",
        monthlyUSD: 133.50,
        quota: 5000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 10K tasks",
        monthlyUSD: 193.50,
        quota: 10000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 20K tasks",
        monthlyUSD: 283.50,
        quota: 20000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 50K tasks",
        monthlyUSD: 433.50,
        quota: 50000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 100K tasks",
        monthlyUSD: 733.50,
        quota: 100000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      {
        name: "Professional 500K tasks",
        monthlyUSD: 2199,
        quota: 500000,
        unit: "task",
        notes: [
          "Multi-step Zaps",
          "Unlimited Premium apps",
          "Webhooks",
          "Email and live chat support"
        ]
      },
      // Team Tiers
      {
        name: "Team 2K tasks",
        monthlyUSD: 103.50,
        quota: 2000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 5K tasks",
        monthlyUSD: 178.50,
        quota: 5000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 10K tasks",
        monthlyUSD: 253.50,
        quota: 10000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 20K tasks",
        monthlyUSD: 373.50,
        quota: 20000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 50K tasks",
        monthlyUSD: 598.50,
        quota: 50000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 100K tasks",
        monthlyUSD: 898.50,
        quota: 100000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      },
      {
        name: "Team 500K tasks",
        monthlyUSD: 2699,
        quota: 500000,
        unit: "task",
        notes: [
          "Multi-step Zaps", "Unlimited Premium apps", "Webhooks",
          "25 users included", "Shared Zaps and folders", "Shared app connections",
          "SAML SSO", "Premier Support (includes live chat & faster email)"
        ]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.zapier.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("Zapier tier not found: " + tierName);

      // Free tier has a hard stop
      if (tier.name === "Free" && used > tier.quota) {
        return { cost: Infinity, over: Infinity };
      }
      
      // For other tiers, if usage exceeds quota, this specific tier is not suitable.
      // The cheapestOption function will find a higher tier or another platform.
      if (used > tier.quota) {
        return { cost: Infinity, over: Infinity };
      }

      // If usage is within quota, cost is the tier's monthly USD.
      return { cost: tier.monthlyUSD, over: 0 };
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
          "1,000 operations/month",
          "No-code visual workflow builder",
          "2000+ apps",
          "Routers & filters",
          "Customer support",
          "15-minute minimum interval between runs"
        ]
      },
      // Core Tiers
      {
        name: "Core 10K Ops",
        monthlyUSD: 10.59,
        quota: 10_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      {
        name: "Core 20K Ops",
        monthlyUSD: 18.82,
        quota: 20_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      {
        name: "Core 40K Ops",
        monthlyUSD: 34.12,
        quota: 40_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      {
        name: "Core 80K Ops",
        monthlyUSD: 64.71,
        quota: 80_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      {
        name: "Core 150K Ops",
        monthlyUSD: 116.47,
        quota: 150_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      {
        name: "Core 300K Ops",
        monthlyUSD: 214.31,
        quota: 300_000,
        unit: "op",
        notes: [
          "Everything in Free, plus:",
          "Unlimited active scenarios",
          "Scheduled scenarios (down to 1-min)",
          "Increased data transfer limits",
          "Access to Make API"
        ]
      },
      // Pro Tiers
      {
        name: "Pro 10K Ops",
        monthlyUSD: 18.82,
        quota: 10_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      {
        name: "Pro 20K Ops",
        monthlyUSD: 34.12,
        quota: 20_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      {
        name: "Pro 40K Ops",
        monthlyUSD: 62.35,
        quota: 40_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      {
        name: "Pro 80K Ops",
        monthlyUSD: 107.06,
        quota: 80_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      {
        name: "Pro 150K Ops",
        monthlyUSD: 180.53,
        quota: 150_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      {
        name: "Pro 300K Ops",
        monthlyUSD: 315.93,
        quota: 300_000,
        unit: "op",
        notes: [
          "Everything in Core, plus:",
          "Priority scenario execution",
          "Custom variables",
          "Full-text execution log search",
          "Advanced automation (error handling, scheduling)"
        ]
      },
      // Teams Tiers
      {
        name: "Teams 10K Ops",
        monthlyUSD: 34.12,
        quota: 10_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      },
      {
        name: "Teams 20K Ops",
        monthlyUSD: 62.35,
        quota: 20_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      },
      {
        name: "Teams 40K Ops",
        monthlyUSD: 116.47,
        quota: 40_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      },
      {
        name: "Teams 80K Ops",
        monthlyUSD: 203.41,
        quota: 80_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      },
      {
        name: "Teams 150K Ops",
        monthlyUSD: 343.01,
        quota: 150_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      },
      {
        name: "Teams 300K Ops",
        monthlyUSD: 600.26,
        quota: 300_000,
        unit: "op",
        notes: [
          "Everything in Pro, plus:",
          "Teams and team roles",
          "Create and share scenario templates"
        ]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.make.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("Make tier not found: " + tierName);

      // Free tier also has a hard stop per the new pricing data
      if (tier.name === "Free" && used > tier.quota) {
        return { cost: Infinity, over: Infinity };
      }
      
      // For other tiers, if usage exceeds quota, this specific tier is not suitable.
      // The cheapestOption function will find a higher tier or another platform.
      // tier.quota !== 0 check is a safeguard, though we're removing Enterprise (which had quota: 0)
      if (used > tier.quota && tier.quota !== 0) {
        return { cost: Infinity, over: Infinity };
      }

      // If usage is within quota, cost is the tier's monthly USD.
      return { cost: tier.monthlyUSD, over: 0 };
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
          "2.5k workflow executions per month",
          "5 active workflows (unlimited test workflows)",
          "Hosted by n8n",
          "1 shared project",
          "5 concurrent executions",
          "Unlimited users",
          "Forum support"
        ]
      },
      {
        name: "Pro 10k Executions",
        monthlyUSD: 60,
        quota: 10_000,
        unit: "exec",
        notes: [
          "10k workflow executions per month",
          "15 active workflows (unlimited test workflows)",
          "Hosted by n8n",
          "Everything in Starter plan, plus:",
          "3 shared projects",
          "20 concurrent executions",
          "7 days of insights",
          "Admin roles",
          "Global variables",
          "Workflow history",
          "Execution search"
        ]
      },
      {
        name: "Pro 50k Executions",
        monthlyUSD: 144,
        quota: 50_000,
        unit: "exec",
        notes: [
          "50k workflow executions per month",
          "50 active workflows",
          "Hosted by n8n",
          "Includes all features of Pro 10k Executions plan"
        ]
      }
    ],
    cost(tierName, used) {
      const tier = pricing.n8n.tiers.find(t => t.name === tierName);
      if (!tier) throw new Error("n8n tier not found: " + tierName);

      // If an "unlimited" tier (quota: 0) were to exist, its cost is fixed.
      // This check remains for robustness, though current n8n tiers all have quotas.
      if (tier.quota === 0) {
          return { cost: tier.monthlyUSD, over: 0 };
      }

      // If usage exceeds quota, this specific tier is not suitable.
      // Cost becomes Infinity to signal "upgrade required" / unsuitable.
      if (used > tier.quota) {
        return { cost: Infinity, over: Infinity };
      }

      // If usage is within quota, cost is the tier's monthly USD.
      return { cost: tier.monthlyUSD, over: 0 };
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
