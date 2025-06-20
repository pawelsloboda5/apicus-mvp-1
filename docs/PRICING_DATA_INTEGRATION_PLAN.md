# Pricing Data Integration Plan (v1.0)

*(all monetary values are handled **in USD**)*

---

## Phase 0 — Data Validation (quick wins)

1. **E2E smoke tests** (Cypress / Playwright)
   * Load 3–4 random templates.
   * Assert that `scenario.templatePricingData` is **non-empty** after `cacheTemplatePricingInScenario()` resolves.

2. **Dexie migration (v9)**
   * On DB open, scan `scenarios` where `originalTemplateId` **exists** **and** `templatePricingData` is missing/empty.
   * In **development** emit `console.warn('[pricing] missing templatePricingData for scenario', id)`.
   * No-op in production to avoid user noise.

---

## Phase 1 — Surface Pricing Where It Matters  
*(no separate "App Card" nodes – keep canvas clean)*

### A. PixelNode visual cues
| Condition                                            | Badge text  | Style        |
|------------------------------------------------------|-------------|--------------|
| `isWithinFreeTier(pricingData, runsPerMonth)`        | **Free**    | green pill   |
| `monthlyCost > 0`                                    | `$<price>/mo` | slate pill  |

* Tooltip → tier name + "Free trial ✓" if `freeTrialPeriodDays ≥ 1`.

### B. NodePropertiesPanel additions
* Insert a **Pricing** block under the existing *App Details*.
  ```
  Tier:    Pro            Free trial: 30 days
  Price:   $8.75 / mo     Quota: 90 days history
  Limits:  Users ∞  |  Storage 90d  |  Integrations 10
  ```
* "Compare tiers" button – small sheet re-using `PlatformComparison` UI from `ROISettingsPanel` **plus** a *Tier Selector* dropdown:
  * Default = first tier with `monthly_price === 0` (or the lowest‐cost paid tier if none are free).
  * On change →
    * Persist `selectedTierName` in the node's `data` and mirror to `scenario.nodesSnapshot`.
    * Trigger cost/badge/ROI recalculation in real-time.
* If an app exposes numeric limits (`operations`, `api_calls`, `storage`, `integrations`, `users`) display them for the **currently selected tier**.
* **Usage-Based Pricing**  
  *When `hasUsageBasedPricing === true`*
  * Show a table of `usageBasedPricing` metrics (e.g. `$0.002 / message`).
  * Display a small ℹ tooltip explaining that monthly cost will scale with volume and is **not** included in the flat `$x/mo` badge.

### C. ROI maths (`lib/roi-utils.calculatePlatformCost`)
1. New optional param: `appPricingMap?: Record<string, AppPricingData>`.
2. Logic:
   ```ts
   if (platform === 'zapier' || platform === 'make' || platform === 'n8n') {
     // keep existing behaviour
   } else {
     // custom stack → sum of lowestMonthlyPrice for each paid app
     cost = Σ lowestMonthlyPrice;
   }
   ```
3. **Per-app node multiplier**
   * Count how many nodes refer to the same app.
   * When the app exposes numeric `operations` or `api_calls`, compute  
     `unitsUsed = runsPerMonth × nodeCountForApp` and compare against the **current tier's** limit.  
     Flag "Over quota – upgrade suggested" if `unitsUsed > limit`.
4. Return `{ cost, breakdown: { zapier: 283, slack: 8.75, phantomBuster: 30 } }` so UI can render
   `Zapier $283 + Slack $8.75 + PhantomBuster $30`.

### D. Email components  
*(deferred – will be implemented after Phase 1 ships)*

---

## Phase 3 — Cost Insights & Dashboards
1. **Insights accordion** in `ROISettingsPanel`
   * Use `generateTemplatePricingInsights()` to show free-tier coverage, AI-enabled apps, etc.
2. **MetricSnapshot**
   * Persist `totalMonthlyCost` alongside existing ROI metrics to allow historical charts.
3. **Scenario report endpoint**
   * `/api/report/:scenarioId` returns JSON with ROI + cost breakdown (foundation for PDFs / client dashboards).

---

## Live-Update Behaviours
* Editing **Runs / Minutes** in ROI panel triggers real-time:
  * Recompute cost badges (Free ⇄ $x/mo).
  * Re-evaluate free-tier coverage and over-quota warnings.
  * Refresh ROI & Cost panels.

---

## Implementation Decisions / Answers to Open Questions
| Topic | Decision |
|-------|----------|
| Multiple nodes of same app | **Do not** multiply platform subscription – instead multiply *per-run* units (`operations`, `api_calls`) by node count. |
| Usage-based pricing | If `hasUsageBasedPricing === true` display the rate table and note that variable cost is **excluded** from flat cost calculation. Future work: simulate cost based on volume sliders. |
| Free-tier recomputation | Yes – re-run logic whenever **Runs per Month** changes. |
| Currency | Hard-code **USD** until multi-currency workstream begins. |

---

### File / Component Checklist
* `lib/roi-utils.ts` – extend `calculatePlatformCost`, return breakdown.
* `components/flow/PixelNode.tsx` – add badge + tooltip.
* `components/flow/NodePropertiesPanel.tsx` – pricing block & tier comparison sheet.
* `components/roi/ROISettingsPanel.tsx` – display cost breakdown & insights.
* `lib/db.ts` – Dexie v9 migration logic.
* `tests/pricing.spec.(ts|js)` – new Cypress/Playwright smoke test.

---

**Next step → start Phase 0 implementation once this plan is merged.** 