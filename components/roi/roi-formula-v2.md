# Apicus ROI Formula Master v0.2 (Draft)

**Owner:** Apicus ROI Group
**Focus:** Cross-platform automation ROI with optional engineering extension
**Status:** Draft for internal review
**Date:** 2025-08-

## Changelog

```
v0.2: Adds time leakage coefficient, explicit quality dollars, employee retention, product delivery
uplift mapping, optional 36-month NPV with Monte Carlo, and an engineering extension panel.
Clarifies guardrails to prevent double counting. UI help copy and schema deltas included.
v0.1: Original master formula, V* system, explainability features, core schema.
```
## 1. Core ROI Formula (v0.1, retained)

The Apicus ROI formula estimates the value of an automation workflow by combining time savings, revenue
uplift, and risk reduction, then subtracting operational costs:

#### ROI = [(T × H × V*) + R + U] − C

Where: - **T** = Time saved per month (in hours) - **H** = Hourly labor cost - **V** _= Task value multiplier - R = Risk or
compliance reduction value in dollars - U = Revenue uplift in dollars - C_ * = Total monthly cost (platforms, tokens,
services)

### 1.1 Task Value Multiplier V* (retained)

Base multipliers by task type. Use Business Stage Modifier and Leverage guidance below when appropriate.

```
Task Type Multiplier
Internal Admin 1.
```
```
Client Communication 1.
```
```
Data Cleaning or Entry 1.
```
```
Scheduling or Routing 1.
Reporting or Dashboards 1.
```
```
Onboarding or Intake 1.
```
```
Cross-Platform Sync 1.
```
#### •

#### •


```
Task Type Multiplier
Outreach or Follow-up 1.
```
```
Lead Scoring or Qualification 1.
```
```
Sales Enablement 2.
```
```
Revenue Capture 2.
Contract or Legal 2.
```
```
Booking or Appointment Flow 2.
```
```
Pipeline Movement or Closing 2.
```
**Business Stage Modifier**

- Early-stage growth: add 0.2 to 0.5 for outbound, lead gen, or revenue tasks.
- Mid-stage scale: neutral or balanced weighting.
- Late-stage efficiency or compliance: add 0.2 to 0.5 for internal workflows, compliance, reporting, or risk
reduction.
Default is 0 if unspecified.

**Leverage Modifier**
Guiding prompt: How many people or systems does this automation affect per run?
Future empirical score may include: nodes, recipients, data volume, frequency, branching logic.

**Guardrail**
When revenue uplift U is included, cap V* at 2.0 to avoid double counting. Keep this transparent in the
report.

## 2. Attribution and Explainability (retained)

```
Multi-factor ROI breakdown: stack by Time, Uplift, Risk Avoidance, Tool Cost Savings.
Confidence bands and ranges: show low, base, high based on input confidence.
Source of truth tags: user-input, inferred, scraped, default.
Marginal node impact: ROI contribution per node with suggestions.
Narrative summary and attribution trees: plain language and causal mapping.
Backtesting and benchmarks: compare to similar workflows by cohort.
Time-based attribution: when value accrues.
Effort vs ROI heatmap and scenario impact decomposition.
```
#### • • • • • • • •


## 3. Comprehensive Variable Schema (retained excerpt)

Inputs and derived fields used across Input Form, Chrome Extension, ROI Report, Node Detail, and
Benchmark Engine.

```
task_name: string
run_frequency: integer
time_saved_per_run: float (minutes)
hourly_rate: float
task_value_multiplier: float
risk_level: integer 1-
risk_frequency: integer
risk_cost_per_error: float
revenue_volume: integer
conversion_rate: float
value_per_conversion: float
platform_cost: float
token_cost: float
third_party_fees: float
confidence_time, confidence_uplift, confidence_risk: float 0..
source_time, source_uplift, source_risk: enum
workflow_id, node_id, node_type, node_platform, node_run_rate, node_token_usage
node_roi_contribution, node_effort_score
roi_total, roi_breakdown, roi_range, roi_confidence_score, roi_benchmark_percentile
```
Note: The full v0.1 schema remains valid. New fields for v0.2 appear in Section 6.

## 4. v0.2 Additions and Rationale

The following are incremental, optional components that strengthen the model for cross-platform
automation while staying compatible with v0.1.

### 4.1 Time savings leakage coefficient L

**Definition
Leakage (L)** is the fraction of saved time that converts into productive output. It discounts raw time savings
so we do not overstate value.

**Placement in formula**
Use **T′ = T × L**. Only the Time component is affected. R and U are unchanged by L.

**When to apply**

- Apply to human time savings in all cases.
- Do not apply to pure machine time unless throughput is staff‑gated.
- If rework minutes are moved into **Q_defects** , remove those minutes from **T** before applying **L**.

#### • • • • • • • • • • • • • • • • • • •


**How to set L**

- Limited adoption or heavy context switching: **0.6–0.**
- Typical team with some process discipline: **0.75–0.**
- High discipline and clear reinvestment of time: **0.9** If unknown, default to **0.75** and show a range in the
report.

**What leakage is not**

- Not a revenue effect. Throughput or reimbursement improvements belong in **U**.
- Not a second risk term. External losses avoided belong in **R_base**.
- Not defect costs. Those belong in **Q_defects**.

**Example**
An automation saves **10 hours/month**. Set **L = 0.7** , **H = $60/hr** , **V** **_= 1.3.
Time dollars = T′ × H × V_** = **(10 × 0.7) × 60 × 1.3 = $546/month**.

### 4.2 Product delivery uplift mapping

Product delivery uplift mapping Optionally include U when there is a defendable linkage between increased
feature velocity and acquisition or retention. Introduce helper inputs: **feature_velocity_delta** and mapping
to either customer acquisition or retention drivers. Keep off by default unless supported by internal data.

### 4.3 Quality improvement as explicit dollars

Add a quality component inside R to avoid double counting with T.

**Q_defects = Δbugs × (cost_per_fix_internal + cost_per_fix_external)**

Guidance: internal costs include remediation, issue management, process disruption, staff burnout, and
support. External costs capture retention or NPS impacts and risk-adjusted catastrophic events.

### 4.4 Employee retention as cost avoidance

Add a retention component inside R when relevant.

**Retention = retention_improvement_rate × turnover_rate × employee_count × replacement_cost**

Use only when HR data exists or can be defensibly estimated.

### 4.5 Advanced multi-period view

Keep the single-period ROI for the main report. Optionally compute 36-month NPV, payback period, and
show a band from Monte Carlo simulation when PERT-style low, mode, high inputs are provided for key
drivers. Do not change base ROI line items.


### 4.6 Adoption and behavior reminders

Surface adoption KPIs and culture notes in the report sidebar. Clarify that automation amplifies behavior
and broken workflows produce negative ROI. Does not alter the formula.

### 4.7 Engineering extension panel (optional)

For developer-heavy orgs, expose a compact input set that translates to the same ROI buckets, without a
separate model: - Release frequency and lead time → potential U and T - MTTR and change failure rate → R
via incident cost reduction - Automated test coverage vs production bugs → Q_defects - Information
retrieval time → T and R

Keep these as inputs that roll up into T, R, U rather than creating parallel math.

## 5. Canonical formula with v0.2 options

We preserve the original structure and insert optional components.

Base (unchanged):
**ROI = [(T × H × V*) + R + U] − C**

With v0.2 options applied:
**ROI_v0.2 = [(T′ × H × V*) + (R_base + Q_defects + Retention) + U] − C**

Where:

- **T′ = T × L**
- **Q_defects = Δbugs × (cost_per_fix_internal + cost_per_fix_external)**
- **Retention = retention_improvement_rate × turnover_rate × employee_count × replacement_cost**

**Guardrails**

- When U is included, cap V _at 2.0.
- Treat quality dollars inside R by default to avoid double counting with T.
- Show sources, ranges, and confidence for each component.
- Keep a single place for revenue to avoid double counting uplift via both V_ and U.

## 5.1 Risk (R) decomposition and calculation

**Structure**
R is composed of three parts: **R = R_base + Q_defects + Retention**.
This section defines **R_base** and the placement rules so we avoid double counting with Time (T) and Uplift
(U).


### 5.1.1 What belongs in R_base

Risk and compliance losses avoided that are **not** already captured as labor time (T) or revenue lift (U): -
**Compliance and legal** : fines, sanctions, consent decrees, licensure risk - **Security and privacy** : breach
response, notifications, forensics, legal exposure - **Operational incidents** : downtime, SLA penalties, service
credits, external rework by vendors or partners - **Safety/adverse events** (healthcare): reportable events,
sentinel events, near-miss programs when monetized - **Fraud/chargebacks** and disputed transactions

### 5.1.2 Calculation pattern

For each named risk event _k_ in a period (e.g., month):
**R_k = baseline_frequency_k × impact_dollars_k × mitigation_rate_k × attributable_share_k**

```
baseline_frequency_k : expected incident count without the automation
impact_dollars_k : average fully loaded cost per incident
mitigation_rate_k : fractional reduction due to the automation or control
attributable_share_k : portion of the reduction credibly caused by this workflow when multiple
controls exist
```
Then: **R_base = Σ R_k**.
If severity varies, split _k_ into tiers (minor, major, critical) with their own impacts and frequencies.

### 5.1.3 Placement rules (to prevent double counting)

```
If the benefit is primarily staff minutes avoided with no external loss avoided → T.
If it reduces external losses or penalties → R_base.
If it reduces defects or errors that create internal/external cost → Q_defects inside R.
If it raises throughput, revenue, or reimbursement → U.
If it reduces employee churn → Retention inside R (workforce cost avoidance).
Customer/patient retention revenue belongs in U , not in Retention.
```
### 5.1.4 Inputs and schema mapping

Use existing v0.1 fields for simple cases, or the structured list below for multiple risks per workflow.

```
Existing single-risk fields: risk_frequency, risk_cost_per_error,
risk_mitigation_rate
New structured list (see Section 6): risk_events[] where each item has
name, baseline_frequency_per_period, impact_dollars, mitigation_rate,
attributable_share, source, confidence
```
Derived reporting fields:

- R_base_dollars (sum of risk_events)
- Q_defects_dollars and Retention_dollars (already defined)
- R_total_dollars = R_base_dollars + Q_defects_dollars + Retention_dollars

#### • • • • • • • • • • • •


### 5.1.5 Mini examples

```
SLA penalties avoided : 4 incidents/month × $2,500 × 0.50 × 0.80 = $4,000/month into R_base.
HIPAA breach expected loss avoided : 0.01 events/month × $500,000 × 0.30 × 0.50 = $1,500/month
into R_base.
Charting defects reduced by 60 per month with $45 internal + $20 external per defect → Q_defects
= 60 × ($45+$20) = $3,900/month inside R.
Claim denials overturned increasing reimbursement belongs in U ; if only internal rework minutes
drop, that portion belongs in T.
```
## 5.2 Quality defects mechanics (Q_defects)

**Goal**
Capture dollars from fewer internal and external defects without double counting with T or U.

**Expanded formula**
For severity tier _s_ (minor, major, critical):
**Q_defects = Σ_s [Δbugs_s × (cost_internal_s + cost_external_s) × detection_rate_s ×
attributable_share_s]**

```
Δbugs_s : reduction in defects per period due to the automation
cost_internal_s : non-time internal costs per defect (tools, triage, management overhead)
cost_external_s : customer or patient-facing costs per defect (refunds, remediation, NPS, risk-
adjusted harms)
detection_rate_s : portion of the reduction we can actually observe
attributable_share_s : fraction of the reduction credibly caused by this workflow given other controls
```
**Interaction with T′**
If you include internal rework minutes as **cost_internal_s** , do not also include those minutes in **T**. Default
handling: deduct rework minutes from **T** before applying leakage, or set **cost_internal_s** to exclude pure
time and keep rework minutes in **T**. Choose one approach only.

**Optional inputs** : rework_minutes_per_defect_s to automatically deduct from **T** when enabled.

## 5.3 Retention mechanics (workforce cost avoidance)

**Monthlyized formula
Retention = [retention_improvement_rate × turnover_rate_annual × employee_count ×
replacement_cost] ÷ 12**

```
replacement_cost includes recruiting, onboarding, training, lost productivity
Keep patient or customer revenue retention in U , not here
```
#### • • • • • • • • • • •


**Healthcare note** : burnout reduction may lower turnover; quantify with HR’s baseline turnover and use
conservative improvement rates.

## 5.4 Reconciliation across T′, R, and U

To prevent double counting, apply in this order: 1) Start with total hours saved from all sources.
2) Subtract defect rework minutes if you are counting those dollars inside **Q_defects**.
3) Apply leakage **L** to arrive at **T′**.
4) Compute **R_base** , **Q_defects** , and **Retention**.
5) Compute **U** only for throughput or reimbursement gains, not cost avoidance.

**Shortcut** : Enable the toggle **“Deduct defect rework from T”** or set **cost_internal** to be time-free; never do
both.

## 5.5 Tail risk modeling (optional)

For low-frequency, high-impact events use expected loss per month: - **R_tail = (annual_probability ×
expected_impact × mitigation_rate × attributable_share) ÷ 12**
Or with frequency–severity modeling: - **R_tail = (λ_annual ÷ 12) × E[severity] × mitigation_rate ×
attributable_share**

When Advanced view is on, also show a 1-year 95th percentile loss band for stress testing. Keep **R_tail**
inside **R_base**.

## 5.6 Quick reference: R variables and units

```
Symbol Meaning Unit
```
```
R_base External losses avoided $/month
Q_defects Defect-related dollars avoided $/month
```
```
Retention Workforce cost avoidance $/month
```
```
T′ Realized time savings after leakage hours/month
```
```
L Leakage factor 0..
mitigation_rate Fractional reduction from this workflow 0..
```
```
attributable_share Share of benefit credited to this workflow 0..
```
```
detection_rate Portion of events we can observe 0..
```

## 5.7 Summary of R components

R is the sum of three distinct variables: - **R_base** : external risk and compliance losses avoided - **Q_defects** :
defect-related dollars avoided, internal and external - **Retention** : workforce cost avoidance from reduced
turnover

This expanded view ensures leakage, defects, and retention are modeled consistently without overlap with
T or U. Provide clear inputs for each, report them separately, and show the combined **R_total**.

## 6. Schema deltas for v0.

New optional inputs. All are nullable and default to off.

```
leakage_factor : float 0..1. Applies to time savings.
bug_reduction_per_period : float.
cost_per_fix_internal : float.
cost_per_fix_external : float.
retention_improvement_rate : float.
turnover_rate : float.
employee_count : integer.
replacement_cost : float.
feature_velocity_delta : float. Link to acquisition or retention fields.
npv_view_enabled : boolean.
pert_inputs : dict for low, mode, high on selected variables.
```
Derived or reporting fields:

- **T_prime_hours**
- **Q_defects_dollars**
- **Retention_dollars**
- **npv_36_months**
- **payback_months**

No removals or renames from v0.1.

## 7. UI help copy (concise)

```
Leakage factor L: Use 0.6 to 0.9 unless you have adoption data. Not all saved time converts to
output.
Quality dollars: Include bug reduction and internal or external cost per fix. Keep quality inside Risk
to avoid double counting time.
Retention: Only include if HR can estimate replacement costs and turnover.
Delivery velocity: Only include Uplift if you can empirically link feature velocity to acquisition or
retention.
```
#### • • • • • • • • • • • • • • •


```
NPV and payback: Turn on when modeling a program or portfolio. Single workflow view stays single
period by default.
```
## 8. Worked example structure (templates)

1) Time savings with leakage

- Inputs: time_saved_per_run, run_frequency, hourly_rate, V _, leakage_factor
- Calculation: T_hours = time_saved_per_run × run_frequency ÷ 60; T′ = T_hours × leakage_factor; Time dollars = T′
× H × V_

2) Quality defects reduction

- Inputs: bug_reduction_per_period, cost_per_fix_internal, cost_per_fix_external
- Calculation: Q_defects = bug_reduction_per_period × (cost_per_fix_internal + cost_per_fix_external)

3) Retention

- Inputs: retention_improvement_rate, turnover_rate, employee_count, replacement_cost
- Calculation: Retention = retention_improvement_rate × turnover_rate × employee_count ×
replacement_cost

4) Delivery velocity

- Inputs: feature_velocity_delta and a mapping to acquisition or retention
- Calculation: include in U only when linkage is verified.

5) Optional NPV

- Inputs: pert_inputs for key variables
- Calculation: run Monte Carlo to produce npv_36_months and payback_months. Keep in an Advanced tab.

## 9. Governance and adoption notes

```
Tools amplify behavior. Eliminate broken workflows rather than layering automation on top.
Measure adoption and leading indicators alongside output KPIs.
Use Value Stream Mapping to select the first five metrics to track.
Establish success criteria for the metrics initiative itself (frequency of actionable insights,
interpretability, and decision impact).
```
## 10. Appendix: v0.1 content retained

This draft carries forward the full intent and constructs of the v0.1 document, including V* system,
explainability features, cohort benchmarking, time-based attribution, effort vs ROI heatmaps, and the
comprehensive variable schema. Any sections not reproduced verbatim above are unchanged by v0.2 and
remain authoritative.

#### •

#### •

#### •

#### •

#### •


