# Zapier Pricing Model

Zapier’s plans are usage‐based, keyed to “tasks” (each Zap action that runs counts as one task ). The
current plans are **Free** , **Professional** , **Team** , and **Enterprise**. Free is $0/mo (100 tasks/month) with basic
features. Professional is $19.99/mo (annual billing) or ~$29.99/mo (monthly) and includes multi‐step Zaps,
1‐min polling, webhooks, unlimited Zaps and premium apps. Team is $69/mo (annual) (~$99/mo
monthly) for 25 users with shared apps, folders, SSO, etc. Enterprise is custom‑priced with unlimited users,
annual task pools, and advanced admin controls. Tasks included per plan are roughly: 100 (Free),
~2,000 (Professional), ~50,000 (Team), and >100,000 (Enterprise). All paid plans allow unlimited users
beyond the stated bundle (with additional users added via Team/Ent plans ).

```
Plan Price (mo/yr)
Tasks/
month Users Notes
```
```
Free $0 / free forever 100 1 user
```
```
15-min polls; 2-step Zaps; no
premium apps ; AI helpers
included; 15‑min max polling.
```
```
Professional
```
## ~$29.99/$

```
(mo) or $19.
(yr)
```
```
~2,000 1 user
```
```
Unlimited Zaps; multi-step; 1-min
polls; webhooks and premium
apps enabled ; live chat support
on ≥2,000 task tier.
```
```
Team
~$99/$69 (mo) ~50,
25 users
(unlimited
with add-ons)
```
```
All Pro features plus shared
workspaces, shared connections,
SAML SSO and 25 included seats
; premier support.
```
```
Enterprise
Contact us
(custom)
```
```
Custom
(annual
pool)
```
```
Unlimited
```
```
All Team features plus annualized
tasks (tasks reset yearly instead of
monthly) , advanced security/
admin, TAMS, analytics, etc.
```
```
Overages: Paid plans can enable auto‑purchase of extra tasks. Extra tasks are charged at 1.25× the
plan’s per‑task rate (e.g. Prof. plan effectively ~$0.01/task, so overage ~$0.0125). Auto‑purchase
stops at 3× the plan’s base task limit. If auto‑purchase is disabled, excess tasks are held until the
next cycle.
Cost/Formulas: The effective cost per task ≈ (plan price) ÷ (tasks). E.g. Professional ($19.99/2,000)
≈ $0.01 per task. Each additional Zap action in a multi-step Zap consumes another task. (Zapier
does not count trigger polls as tasks. Also, tasks in unused path branches do not count .)
Limits & Throttling: Zaps are limited to 100 steps per Zap. Instant triggers are rate‑limited to
20,000 calls per 5 minutes per user. Polling triggers on Free/Trial are capped at 200 polls per 10
min per Zap (paid plans have no such cap). Private apps have rate limits (100 requests/min on
Free/Pro, 5,000/min on Team/Ent ). Additionally, Zapier enforces “flood protection” for large
bursts (holding >100 simultaneous triggers for manual replay ).
```
```
1
```
```
2
```
```
3 4
5 6
3
```
```
5 5
```
```
2
7 2
```
```
3 8
3
```
```
9
```
## •

```
10
10
```
## •

```
1
11 1
```
-^12
    13
       14
15
16


# Make.com (Integromat) Pricing Model

Make (formerly Integromat) bills by **operations (ops)**. One operation equals a module action; loops/
iterators can multiply ops (e.g. returning 10 rows uses 10 ops). Current plans are Free, Core, Pro,
Teams, and Enterprise. The Free tier is $0, with **1,000 ops/month** and 15-min execution intervals

. Core is $9/mo (annual) for 10,000 ops; Pro is $16/mo (annual) for **50,000** ops; Teams is $29/mo (annual)
for **100,000** ops (unlimited scenarios, 1-min scheduling). Enterprise is custom (unlimited ops, SSO, audit
logs, 24/7 support, etc.). All paid plans allow unlimited users.

```
Plan
Price
(mo/yr)
```
```
Operations/
month Scenario Features Notes
```
```
Free $0 1,
```
```
No-code builder;
routers/filters; 2 active
scenarios
```
```
15‑min min interval; 2000+
apps; basic support; 5 GB data
transfer cap (monthly).
```
```
Core
```
## $

```
(annual) 10,
```
```
Unlimited scenarios; 1-
min scheduling; basic
CRUD modules
```
```
Includes premium apps; higher
data/data store limits vs Free.
Recommended for solo users.
```
```
Pro
```
## $

```
(annual) 50,
```
```
Priority execution;
custom variables; full-
text logs; advanced
features
```
```
1-min scheduling; greater
allowances. Suitable for
growing teams.
```
```
Teams
```
## $

```
(annual) 100,
```
```
All Pro + team roles/
templates; shared
scenarios
```
```
Collaboration features;
unlimited users.
```
```
Enterprise
Custom
(annual)
Unlimited
```
```
All Teams + SSO (SAML/
SCIM); audit logs; 24/
SLA; VE team
```
```
Operations overage protection
(auto-exec extra ops) and
annual ops pools; extended
logs.
```
```
Overages: If you exhaust your ops, scenarios pause until next billing cycle. You can buy extra
ops anytime in bundles of 1,000 or 10,000 at the plan’s per‑op rate. (E.g. Core: $9/10,000 ⇒
$0.0009/op; so 1,000 extra ops cost $0.90 .) Extra ops expire with the cycle. Make also offers an
auto‑purchase mode: once all included ops are used, it automatically buys 10,000 more (at the same
per‑op cost) up to a set cap.
Cost/Formulas: Effective cost per op = plan price ÷ ops. For example, Core ($9/10k) ≈ $0.0009 per
op; Pro ($16/50k) ≈ $0.00032/op; Teams ($29/100k) ≈ $0.00029/op. Total cost for a workflow ≈
(#ops in workflow)×(cost/op). Be aware Make charges each module execution, including loops (
items = 10 ops).
Limits & Throttling: Aside from ops, each plan has data allowances (storage and transfer) and
scenario limits. For instance, Free is limited to 5 GB data/month (exceeding it causes runs to fail ).
Free also allows only 2 active scenarios. Polling/webhook triggers have no hard per-minute limits
in paid plans (you can schedule down to 1 min). Private API rate limits apply when calling external
services (see Make dev docs).
```
```
17 18
19 20
21
20
22 23
```
```
21
24 25
```
```
19
```
```
19
```
```
26
```
```
20
```
```
27
```
```
20
```
## •^28

```
29
29
```
```
30
```
-

```
17
```
-
    25
24


# n8n Pricing Model

n8n charges by **workflow executions**. A “full execution” of a workflow (regardless of step count) counts as
one execution. There is no charge for additional steps or operations inside the workflow. n8n offers a
**free self-hosted (Community)** edition (open source, unlimited executions but requires your own hosting),
plus cloud plans: **Starter** , **Pro** , and **Enterprise**.

```
Plan
Price
(mo/yr)
```
```
Executions/
month
```
```
Active
Workflows
```
```
Concurrency /
Projects Notes
```
```
Community
(self-hosted) Free
```
```
Unlimited
(self-
managed)
```
```
Unlimited
```
```
Unlimited (you
control
resources)
```
```
Community features
(no official support;
must self-host).
```
```
Starter
(Cloud)
```
```
$24 / mo
($
annual)
2,500 5 active
```
```
5 concurrent; 1
shared project
```
```
Unlimited steps per
workflow; unlimited
users; 7-day execution
log retention; email/
forum support.
```
```
Pro (Cloud)
```
```
$60 / mo
($
annual) 10,
```
```
15 active
20 concurrent; 3
shared projects
```
```
Everything in Starter,
plus higher
concurrency, 14-day
logs, role-based access
(admin), global
variables. Higher-
tier: 50k exec for $120/
mo (or ~$100 annual)
and 50 workflows.
```
```
Enterprise
```
```
Contact
for
pricing
```
```
Custom
(unlimited
option)
```
```
Custom
```
## 200+

```
concurrent;
unlimited
projects
```
```
All Pro features plus
365-day logs, SSO
(SAML/LDAP),
advanced security
(secret store, log
streaming).
Dedicated support.
```
```
Overages: n8n plans are fixed to the execution quotas above. If you exceed the quota, you must
upgrade to a higher tier. n8n does not auto‑purchase extra executions. For example, once the 2,
execution limit is reached in Starter, workflows will fail until reset or plan change.
Cost/Formulas: Cost per execution ≈ (plan price)/(executions). E.g. Starter is $24/2,500 ≈ $0.
per execution; Pro is $60/10,000 ≈ $0.006 per execution. Notably, adding more steps to a workflow
does not increase cost beyond the execution count. This “execution-centric” model often yields
lower costs for complex workflows.
Limits & Throttling: Starter allows 5 concurrent executions; Pro allows 20; Enterprise 200. Active
workflows (automations) are limited as listed, though you can create unlimited drafts. Webhook and
API triggers operate in real-time (no extra charge). n8n imposes no per-minute polling limit;
```
```
31
```
```
32 33
```
```
32
```
```
34 35
36
```
```
37
```
(^3738)
39 40
41
42
42

## •

## •

```
31
```
## •^42


```
scheduling can run as fast as the concurrency allows. There are no hidden quotas on API calls inside
a workflow beyond your plan’s execution count.
```
# Comparison Highlights

```
Billing Units: Zapier charges per “action” (task) that runs; Make charges per module operation
executed; n8n charges per full workflow execution. Thus, a 5-step Zap uses 5 tasks in Zapier (5×
cost), whereas the same sequence in n8n is 1 execution (1× cost). Make will count each
module run (iterators multiply ops).
Multi-step Workflows: Zapier’s multi-step Zaps each consume multiple tasks. Make similarly
charges for each module (so 5 modules = 5 ops). n8n does not charge extra for more steps; cost only
reflects the number of executions.
Overages: Zapier and Make allow pay‑per‑use overages: Zapier at a premium task rate , Make by
purchasing extra ops. n8n requires plan upgrade (no extra execution packs).
Teams/Users: Zapier Free/Pro are single‑user; Team/Ent allow 25+ unlimited users (extra seats cost
on Team plan). Make and n8n include unlimited users in all paid tiers (Make Teams adds roles; n8n
Pro adds admin roles).
Advanced Features: Webhooks and API integration are premium on Zapier (Pro+) ; Make
includes webhooks on all plans; n8n has webhooks built in. Zapier’s AI tools (AI Builder, code steps,
chatbots) are available on all plans. n8n’s AI integrations (OpenAI nodes) have no additional cost
beyond the execution count. Data‑heavy tasks on Make consume data quotas (5 GB on Free) ;
Zapier has no data cap but will throttle bursty triggers. All platforms offer 1‑min minimum
scheduling on paid plans (Zapier/Make) and have limits on parallel executions (Zapier: max 1 active
Zap run per flow per account; Make: queues runs; n8n: defined concurrency).
Hidden Limits: Zapier caps each Zap at 100 steps. Make’s free tier caps scenarios (2 active) and
data. n8n’s active-workflow cap is enforced per plan. Be mindful of per-minute API rate limits of
connected apps, which affect all three.
```
**Sources:** Official pricing pages and documentation for each platform , supplemented by help
articles and vendor blogs. These detail plan costs, task/op/execution limits, overage
charges, and usage rules.

## •

```
31 1
17
```
-^1

```
31
```
-^10
    29
-

```
3 36
```
-^43

```
25
16
```
## •^12

```
5 19 32
10 29 31 6
```

How to select your Zapier plan – Zapier
https://help.zapier.com/hc/en-us/articles/16051471305357-How-to-select-your-Zapier-plan

Plans & Pricing | Zapier
https://zapier.com/pricing

Understanding Zapier Pricing and Zap Limits for Automation Efficiency
https://www.switchlabs.dev/resources/understanding-zapier-pricing-and-zap-limits-for-automation-efficiency

How pay-per-task billing works in Zapier – Zapier
https://help.zapier.com/hc/en-us/articles/

How is task usage measured in Zapier? – Zapier
https://help.zapier.com/hc/en-us/articles/8496196837261-How-is-task-usage-measured-in-Zapier

Zap limits – Zapier
https://help.zapier.com/hc/en-us/articles/8496181445261-Zap-limits

Operations - Help Center
https://help.make.com/operations

Pricing & Subscription Packages | Make
https://www.make.com/en/pricing

How much does it cost to use Make? | PassKit Support Center
https://help.passkit.com/en/articles/8570231-how-much-does-it-cost-to-use-make

Data transfer limit - Features - Make Community
https://community.make.com/t/data-transfer-limit/

Operations Exhausted - How To - Make Community
https://community.make.com/t/operations-exhausted/

Extra operations - Help Center
https://help.make.com/extra-operations

n8n Execution Advantage: An overview of our unique pricing model – n8n Blog
https://blog.n8n.io/n8n-execution-advantage/

n8n Plans and Pricing - n8n.io
https://n8n.io/pricing/

```
1
```
```
2 3 4 5 9 43
```
```
6 7 8
```
```
10
```
```
11
```
```
12 13 14 15 16
```
```
17 18
```
```
19 21 22 23 26 27
```
```
20 24
```
```
25
```
```
28
```
```
29 30
```
```
31
```
```
32 33 34 35 36 37 38 39 40 41 42
```

