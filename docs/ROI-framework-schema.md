ROI Formula (v0.1):

ROI = ((T × H × V*) + R + U − C)

Where:
• T = Time saved per month (hours)
• H = Hourly labor cost
• V* = Task value multiplier
• R = Risk reduction value (optional)
• U = Revenue uplift (optional)
• C = Automation cost (monthly)

---

### Task Value Multiplier (V*)

V* is composed of three parts:

**1. Task Type Base Value**  
Select ONE based on task category:
- 1.0 – Internal task (e.g. notifications, file updates)
- 1.1 – Scheduling, handoffs
- 1.2 – Admin tasks (CRM sync, form transfers)
- 1.3 – Client-facing workflows (check-ins, onboarding)
- 1.4 – Sales/process-driving (inbound lead routing, upsell triggers)
- 1.5 – Revenue-generating automations (bookings, purchases, conversions)

**2. Business Stage Modifier**  
Add based on org size:
- +0.2 – Solo operator
- +0.1 – Small team
- +0.0 – Mid/large org

**3. Leverage Modifier – MVP Heuristic (Reach per Run)**  
Add based on how many people or systems are affected *per run*:
- +0.0 – 1–2 people/systems
- +0.1 – 3–10 people/systems
- +0.2 – 10+ or dynamic scaling

> Final V* = base + stage modifier + leverage modifier  
> V* can exceed 2.0, unless **U (revenue uplift) is active**  
> If U is active, cap V* at 2.0 to prevent double-counting

---

### Revenue Uplift (U)

Only include U if automation directly supports revenue (e.g., outreach, booking, conversion).  
Use these assumptions:
- Conversion rate = 2%
- Value per conversion = $100
- Volume = estimated # of messages, leads, or actions/month  
U = volume × 0.02 × $100  
*If U is used, cap final V* at 2.0*

---

### Risk Reduction (R)

Only include if task prevents errors or compliance issues.  
Use:
- Risk level: 1–5
- Frequency: runs/month
- Cost per error: estimated dollars  
R = risk × frequency × costPerError

---

### Automation Cost (C)

Include:
- Platform fees (Zapier, Make, etc.)
- API/token usage (e.g., OpenAI)
- Any 3rd-party service costs  
Estimate from metadata.

---

### v0.2 Additions (2025-06-18)

1. **Automation Cost Breakdown (C)**
   ```ts
   C = C_platform + C_aiUsage + C_other
   ```
   * **C_platform** – monthly subscription cost of the primary automation platform (Zapier, Make, n8n, etc.). Pulled from `appPricingMap` using the tier that matches quota.
   * **C_aiUsage** – token-based cost for AI calls (OpenAI, Claude, etc.). Calculated as:
     ```
     C_aiUsage = (inputTokens × inputPrice + outputTokens × outputPrice) / 1000
     ```
     Token prices come from `ai_specific_pricing.models_pricing` (see constants.ts).
   * **C_other** – any additional API / SaaS fees provided by the user.

2. **Dynamic Multiplier Cap**
   * If **U (Revenue uplift)** is included, cap final **V\*** at **2.0**.
   * Otherwise cap at **2.4**.

3. **Exposure Flags**
   * `riskEnabled` / `revenueEnabled` booleans stored in scenarios to toggle R and U terms.

4. **Helper Function Signatures** (see `lib/roi-utils.ts`)
   ```ts
   calculateAutomationCost(pricingMap: Record<string, any>, runsPerMonth: number): number;
   calculateAIUsageCost(aiCalls: Array<{ model: string; inputTokens: number; outputTokens: number }>): number;
   ```

---