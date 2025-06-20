# Pricing-Data Enhancement Ideas (backlog)

*A parking lot of extra concepts beyond Phase 1 scope. Revisit after core integration ships.*

---

## 1  Free-Tier Intelligence
* Show **head-room**: "37 % of free-tier ops used – 630 runs left."
* Predict the **free-tier exhaustion date** using run-rate from last 30 days (`MetricSnapshot`).
* One-click helper "Batch similar steps" (groups identical API calls) to stretch free tier.

## 2  Usage-Based Cost Simulator
* For apps with `hasUsageBasedPricing`, display a mini cost-vs-volume spark-line.
* Interactive slider lets user project growth; ROI/payback update live.

## 3  Tier Recommendation Engine
* Auto-select **lowest viable tier** (free if sufficient, else first tier where limit ≥ unitsUsed).
* Warn when *no* published tier fits → "Enterprise quote required".
* Suggest hybrid approach (e.g. move heavy steps to Make.com) and compute savings.

## 4  Competitive Alternative Picker
* In `NodePropertiesPanel`, add **Alternatives** tab (calls template search with `appSlug:similar`).
* Side-by-side table: price, AI flag, free-tier size.
* Allow in-place swap of the node (updates icon + node data).

## 5  Cost-Aware Canvas Highlights
* Nodes within **10 %** of free-tier limit get an **orange border**.
* Hover tooltip: "Close to limit – consider upgrade or batching".

## 6  Scenario-Level "What-If" Sandbox
* StatsBar toggle → "Simulate growth" dialog (e.g. × 2 runs per month).
* Changes are temporary until user clicks *Apply*; otherwise revert.

## 7  Exportable Cost Deck
* API `/api/report/:scenarioId` returns JSON → server generates PDF/Slides.
* Sections: Current stack cost, Optimised stack, Time savings, Payback curve.

## 8  Granular Savings Metric
* Extend `MetricSnapshot` with `toolSavings` (manual stack – optimised stack).
* StatsBar displays: `45× ROI | $156/mo tool savings | Payback < 1 day`.

## 9  Risk-Aware Cost Flags
* If `hasUsageBasedPricing` & no hard quota → ⚠ badge "uncapped spend".
* Inject footnote in ROI email: "Variable token billing – actual cost may vary."

## 10  Design-System / DX Aids
* Storybook stories for PixelNode pricing states (Free, Paid Low, Paid High, Usage-Based).
* Makes visual tweaks independent of full canvas.

---

**Prioritisation hint** – Ideas #1, #2 and #3 directly improve deal-closing conversations → consider for Phase 2. 