import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";

/**
 * EmailTemplate – renders a live preview **and** produces a raw HTML string
 * that can be pasted into Gmail's HTML editor.
 *
 * All props have sensible placeholders, so you can drop <EmailTemplate />
 * into any page (e.g., a modal) and bind them to form fields.
 */
export interface EmailTemplateProps {
  firstName?: string;
  yourName?: string;
  yourCompany?: string;
  yourEmail?: string;
  calendlyLink?: string;
  pdfLink?: string;
  hookText?: string; // Added for dynamic hook section
  ctaText?: string; // Added for dynamic CTA section
  subjectLine?: string; // New: For the email subject
  offerText?: string; // New: For the offer paragraph
  stats?: {
    roiX?: number;      // e.g. 45
    payback?: string;   // e.g. "< 1 day"
    runs?: number;      // e.g. 290
  };
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  firstName = "[FIRST NAME]",
  yourName = "[YOUR NAME]",
  yourCompany = "[YOUR COMPANY]",
  yourEmail = "[YOUR_EMAIL]",
  calendlyLink = "https://calendly.com/your-link",
  pdfLink = "https://example.com/your-roi-snapshot.pdf",
  hookText = "I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.",
  ctaText = "I packaged the numbers and a quick how it works diagram into a one-page PDF here:",
  subjectLine = "Automate Your [Task] & See ROI", // New default
  offerText = "If you'd like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.", // New default
  stats = { roiX: 0, payback: "N/A", runs: 0 },
}) => {
  // Build the raw HTML only once per prop‑set
  const rawHtml = useMemo(() => {
    return `<!-- === Begin cold‑outreach email === -->
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:20px 0;">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e1e1e1;">
        <tr>
          <td style="background:#3B82F6;color:#ffffff;padding:16px 20px;border-top-left-radius:8px;border-top-right-radius:8px;">
            <h2 style="margin:0;font-size:18px;font-weight:bold;">${subjectLine}</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 4px 20px;">
            <p style="margin:0;font-size:14px;color:#333333;">Hi ${firstName},</p>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 20px 14px 20px;">
            <p style="margin:0;font-size:14px;color:#333333;line-height:1.4;">
              ${hookText}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background:#f1f5ff;border-radius:6px;padding:10px;">
                  <span style="font-size:16px;font-weight:bold;color:#3B82F6;">${stats.roiX && stats.roiX > 0 ? `${stats.roiX}×` : 'N/A'}</span><br>
                  <span style="font-size:11px;color:#555555;">Projected ROI</span>
                </td>
                <td width="8"></td>
                <td align="center" style="background:#f1f5ff;border-radius:6px;padding:10px;">
                  <span style="font-size:16px;font-weight:bold;color:#3B82F6;">${stats.payback || 'N/A'}</span><br>
                  <span style="font-size:11px;color:#555555;">Payback period</span>
                </td>
                <td width="8"></td>
                <td align="center" style="background:#f1f5ff;border-radius:6px;padding:10px;">
                  <span style="font-size:16px;font-weight:bold;color:#3B82F6;">${stats.runs || 0}</span><br>
                  <span style="font-size:11px;color:#555555;">Runs / month</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <p style="margin:0;font-size:14px;color:#333333;line-height:1.4;">
              ${ctaText}<br>
              <a href="${pdfLink}" style="color:#3B82F6;text-decoration:none;font-weight:bold;">Download the ROI snapshot →</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 20px 14px 20px;">
            <p style="margin:0;font-size:14px;color:#333333;line-height:1.4;">
              ${offerText}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 20px 20px 20px;">
            <p style="margin:0;font-size:14px;color:#333333;">
              Best,<br><br>
              <strong>${yourName}</strong><br>
              Automation Consultant, <strong>${yourCompany}</strong><br>
              <a href="mailto:${yourEmail}" style="color:#3B82F6;text-decoration:none;">${yourEmail}</a> &nbsp;|&nbsp; <a href="${calendlyLink}" style="color:#3B82F6;text-decoration:none;">Book 15 min</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f6f7fb;border-bottom-left-radius:8px;border-bottom-right-radius:8px;padding:10px 20px;font-size:10px;color:#888888;text-align:center;">
            Generated with Apicus • ${new Date().toLocaleDateString()}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- === End email === -->`;
  }, [firstName, yourName, yourCompany, yourEmail, calendlyLink, pdfLink, hookText, ctaText, subjectLine, offerText, stats]);

  // Copy helper
  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawHtml).then(() => {
      alert("HTML copied! Paste it into Gmail → <> editor.");
    });
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col">
      {/* Interactive buttons */}
      <div className="flex gap-2 bg-background py-2 z-10 border-b mb-2 flex-shrink-0">
        <Button onClick={copyToClipboard} size="sm" className="text-xs">Copy HTML</Button>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(rawHtml)}`}
          download="Apicus_ROI_Email.html"
          className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3"
        >
          Download
        </a>
      </div>

      {/* Live preview via iframe - optimized for canvas display */}
      <div className="flex-grow min-h-0">
        <iframe
            title="Email preview"
            srcDoc={rawHtml}
            className="w-full h-full border rounded-lg shadow-sm bg-white"
            sandbox="allow-same-origin"
            style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
};

export default EmailTemplate; 