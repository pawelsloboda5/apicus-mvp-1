**T (Time saved per month)**

- **Inputs needed:**

  - *Runs per month* (manual input or inferred from integration
    metadata)

  - *Time saved per run* (user input or estimated via task type)

- **UI handling:**

  - Input box: \"How many times does this automation run each month?\"

  - Prompt/AI assist: \"Roughly how long does this task take a person
    manually?\"

  - Optional: Show benchmarks by task type as a guide (e.g., "Invoice
    data entry: avg. 4 min")

**H (Hourly wage)**

- **UI handling:**

  - Input box with default (\$30/hr pre-filled)

  - Optional: Dropdown by role (e.g., Admin, Sales, Dev) to map to
    market rates

  - AI assistant could ask: "What's the average hourly cost for this
    task in your business?"

**V\* (Task value multiplier)**

- **UI handling:**

  - Dropdown: "What type of task is this?" → maps to Base V

  - Dropdown or toggle: Business stage (Solo, Small Team, etc.)

  - Optional: "How many people/systems are affected per run?" → maps to
    leverage heuristic

  - Later: AI assistant could infer based on workflow description

**R (Risk/Compliance Value)**

- **UI handling:**

  - Toggle: "Does this automation reduce error or compliance risk?"

  - If yes: Show slider or input for Risk Level (1--5), Frequency, and
    Error Cost Estimate

  - Optional: AI assistant could suggest risk profiles based on task
    type/industry

**U (Revenue Uplift)**

- **UI handling:**

  - Toggle: "Does this workflow drive revenue (e.g., lead gen, sales)?"

  - If yes: Show three inputs:

    - Monthly Volume

    - Conversion Rate

    - Value per Conversion

  - Defaults can be shown for each with tooltips

**C (Automation Cost)**

- **UI handling:**

  - Can be auto-filled from connected tool pricing models

  - Manual override option for accuracy

  - Optional: Breakdown by platform/tool (Zapier, OpenAI, etc.)

![A screenshot of a computer AI-generated content may be
incorrect.](media/image1.png){width="6.5in"
height="1.4277777777777778in"}

**CASE STUDY: Job Scraping / Filtering for Recruiting Firm**

![A screenshot of a computer AI-generated content may be
incorrect.](media/image2.png){width="6.027777777777778in"
height="4.625in"}

**2. Apicus ROI Formula Calculation**

**Inputs:**

T = 33.33 hours/month

H = \$30/hour

V\* = 1.8 (base) + 0.1 (stage) + 0.2 (leverage) = 2.1

R = \$0

U = 300 hires × \$800 = \$240,000

C = \$36.11

**Calculations:**

Time Value = T × H × V\*

= 33.33 × 30 × 2.1 = \$2,099.79

Total Value = Time Value + R + U

= \$2,099.79 + 0 + \$240,000 = \$242,099.79

Net ROI = Total Value -- C

= \$242,099.79 -- \$36.11 = \$242,063.68

ROI Ratio = Total Value / C

= \$242,099.79 / \$36.11 ≈ 6,701×

**Administrative**

1.  **Invoice Extraction & Entry (e.g., PDF to QuickBooks)**

    - Task: Admin

    - Tool: Make or Zapier

    - Goal: Reduce manual data entry time

**Customer Support**

2.  **Auto-Reply + Ticket Routing via Email Parser**

    - Task: Customer Support

    - Tool: Zapier + Gmail + Helpdesk (e.g., Zendesk)

    - Goal: Faster response and classification

**Compliance**

3.  **Contract Deadline Monitoring and Escalation**

    - Task: Compliance / Legal

    - Tool: Airtable + Slack alerts

    - Goal: Avoid missed milestones and fines

**Marketing**

4.  **Weekly Social Post Scheduling via Notion**

    - Task: Marketing

    - Tool: Make + Notion + LinkedIn/Twitter

    - Goal: Save time and increase consistency

**Sales Enablement**

5.  **Personalized Follow-Up Email Generator using AI**

    - Task: Sales

    - Tool: Zapier + OpenAI + Gmail

    - Goal: Improve reply rate and close deals

**Lead Generation**

6.  **Cold Outreach Campaign with Enrichment**

    - Task: Lead Gen

    - Tool: Instantly + Apollo + OpenAI

    - Goal: Scaled outbound with context

**Operations**

7.  **Daily Report Compilation from Multiple Sources**

    - Task: Internal Ops

    - Tool: Make + Google Sheets + Slack

    - Goal: Reduce time and improve clarity

**Finance**

8.  **Monthly Reconciliation Check and Flagging**

    - Task: Finance / Internal Ops

    - Tool: Airtable + Email + Google Sheets

    - Goal: Catch mismatches before closing

**Client Intake**

9.  **Form → Intake Parser → CRM Entry + Acknowledgement Email**

    - Task: Admin + Lead Gen

    - Tool: Typeform + Make + HubSpot + Gmail

    - Goal: Reduce response time and improve tracking

**AI Receptionist**

10. **Voice Bot That Routes Inbound Leads**

- Task: Customer Support + Sales

- Tool: Twilio + Whisper + OpenAI + CRM

- Goal: Save time and prevent missed inquiries
