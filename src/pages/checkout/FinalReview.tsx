import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  MapPin,
  Package,
  Paperclip,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Timer,
  Upload,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Scenario = "Ride" | "EV Charging" | "E-Commerce" | "Service Booking";

type PaymentMethod = "CorporatePay" | "Personal Wallet" | "Card" | "Mobile Money";

type CorporateProgramStatus =
  | "Eligible"
  | "Not linked"
  | "Not eligible"
  | "Deposit depleted"
  | "Credit limit exceeded"
  | "Billing delinquency";

type CorporateState = "Available" | "Requires approval" | "Not available";

type Outcome = "Allowed" | "Approval required" | "Blocked";

type ReasonSeverity = "Info" | "Warning" | "Critical";

type PolicyReason = {
  id: string;
  severity: ReasonSeverity;
  title: string;
  detail: string;
  code: string;
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type QuoteRule = {
  id: string;
  name: string;
  triggered: boolean;
  detail: string;
};

type AuditWhy = {
  summary: string;
  triggers: Array<{ label: string; value: string }>;
  policyPath: Array<{ step: string; detail: string }>;
  audit: Array<{ label: string; value: string }>;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type LineItem = { id: string; name: string; qty: number; priceUGX: number };

type SummaryModel = {
  scenario: Scenario;
  title: string;
  vendor: string;
  module: string;
  amountUGX: number;
  locationLabel: string;
  scheduleLabel?: string;
  details: Array<{ label: string; value: string }>;
  lineItems?: LineItem[];
  holdInfo?: { label: string; detail: string };
  policyHints: { purposeRequired: boolean; costCenterRequired: boolean; projectRequired: boolean; attachmentsRequired: boolean; attestationRequired: boolean };
  approvalThresholdUGX: number;
  hardBlockThresholdUGX: number;
  vendorRestricted: boolean;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatBytes(bytes: number) {
  const b = Math.max(0, bytes || 0);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function msToFriendly(ms: number) {
  if (ms <= 0) return "Overdue";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    warn: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    bad: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    accent: "bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-300",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200 dark:opacity-90",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200 dark:opacity-90",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-700",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
    >
      {children}
    </button>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700",
                  t.kind === "warn" && "bg-amber-50 text-amber-800",
                  t.kind === "error" && "bg-rose-50 text-rose-700",
                  t.kind === "info" && "bg-blue-50 text-blue-700"
                )}
              >
                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message ? <div className="mt-0.5 text-sm text-slate-600">{t.message}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "920px",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
}

function computeCorporateState(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  outcome: Outcome;
}): CorporateState {
  const { paymentMethod, corporateStatus, graceActive, outcome } = args;

  if (paymentMethod !== "CorporatePay") return "Available";

  const blockedByProgram =
    corporateStatus === "Not linked" ||
    corporateStatus === "Not eligible" ||
    corporateStatus === "Deposit depleted" ||
    corporateStatus === "Credit limit exceeded" ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (blockedByProgram) return "Not available";
  if (outcome === "Blocked") return "Not available";
  if (outcome === "Approval required") return "Requires approval";
  return "Available";
}

function evaluatePolicy(args: {
  model: SummaryModel;
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  costCenter: string;
  projectTag: string;
  purpose: string;
  attested: boolean;
  attachments: Attachment[];
  notes: string;
}): {
  outcome: Outcome;
  reasons: PolicyReason[];
  rule: QuoteRule;
  why: AuditWhy;
} {
  const { model, paymentMethod, corporateStatus, graceActive, costCenter, projectTag, purpose, attested, attachments, notes } = args;

  const reasons: PolicyReason[] = [];

  // Personal payment bypass
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ id: uid("r"), severity: "Info", code: "PAYMENT", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
    const why: AuditWhy = {
      summary: "Corporate checks are advisory because personal payment is selected.",
      triggers: [
        { label: "Payment method", value: paymentMethod },
        { label: "CorporatePay", value: "Not used" },
      ],
      policyPath: [{ step: "Checkout", detail: "Personal payment selected so corporate rules do not enforce." }],
      audit: [{ label: "Correlation id", value: "corr_demo_personal" }],
    };
    return {
      outcome: "Allowed",
      reasons,
      rule: { id: "RULE", name: "Approval rule", triggered: false, detail: "No approval required for personal payment." },
      why,
    };
  }

  // Program enforcement
  const blockedByProgram =
    corporateStatus === "Not linked" ||
    corporateStatus === "Not eligible" ||
    corporateStatus === "Deposit depleted" ||
    corporateStatus === "Credit limit exceeded" ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ id: uid("r"), severity: "Warning", code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace window is active." });
  }

  if (blockedByProgram) {
    reasons.push({
      id: uid("r"),
      severity: "Critical",
      code: "PROGRAM",
      title: "CorporatePay not available",
      detail: `CorporatePay is unavailable due to program status: ${corporateStatus}.`,
    });
  }

  // Required fields
  if (model.policyHints.costCenterRequired && !costCenter.trim()) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Cost center required", detail: "Select a cost center to allocate this transaction." });
  }
  if (model.policyHints.projectRequired && !projectTag.trim()) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Project tag required", detail: "Select a project tag for reporting and chargeback." });
  }
  if (model.policyHints.purposeRequired && !purpose.trim()) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Purpose required", detail: "Select a purpose tag to comply with policy." });
  }

  if (model.policyHints.attestationRequired && !attested) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "ATTEST", title: "Attestation required", detail: "Confirm business use or compliance acknowledgment to proceed." });
  }

  // Attachment enforcement
  if (model.policyHints.attachmentsRequired && attachments.length === 0) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "ATTACH", title: "Evidence required", detail: "Upload the required evidence before submitting." });
  }

  // Vendor restriction
  if (model.vendorRestricted) {
    reasons.push({ id: uid("r"), severity: "Warning", code: "VENDOR", title: "Vendor restricted", detail: "This vendor requires approval for corporate spend." });
  }

  // Approval threshold
  const overApproval = model.amountUGX > model.approvalThresholdUGX;
  const overHardBlock = model.amountUGX > model.hardBlockThresholdUGX;

  if (overHardBlock) {
    reasons.push({
      id: uid("r"),
      severity: "Critical",
      code: "AMOUNT",
      title: "Hard stop threshold",
      detail: `Amount exceeds the hard stop threshold ${formatUGX(model.hardBlockThresholdUGX)} and must go through RFQ or special approval path.`,
    });
  } else if (overApproval) {
    reasons.push({
      id: uid("r"),
      severity: "Warning",
      code: "AMOUNT",
      title: "Approval required",
      detail: `Amount exceeds ${formatUGX(model.approvalThresholdUGX)}. Approval is required before proceeding.`,
    });
  }

  // Notes recommendation
  if (!notes.trim() && (overApproval || model.vendorRestricted)) {
    reasons.push({ id: uid("r"), severity: "Info", code: "NOTE", title: "Add a note", detail: "Add context to speed up approvals and reduce rework." });
  }

  // Determine outcome
  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarning = reasons.some((r) => r.severity === "Warning");

  let outcome: Outcome = "Allowed";
  if (blockedByProgram) outcome = "Blocked";
  else if (hasCritical) outcome = "Blocked";
  else if (hasWarning) outcome = "Approval required";

  const rule: QuoteRule = {
    id: "APPR-RULE",
    name: "Approval rule",
    triggered: outcome === "Approval required",
    detail:
      outcome === "Approval required"
        ? overApproval
          ? `Amount > ${formatUGX(model.approvalThresholdUGX)} requires manager approval, then Finance.`
          : model.vendorRestricted
            ? "Restricted vendor requires Procurement approval."
            : "Policy requires approval."
        : "No approval required.",
  };

  const why: AuditWhy = {
    summary: "This result is generated from policy checks for CorporatePay.",
    triggers: [
      { label: "Payment method", value: "CorporatePay" },
      { label: "Program status", value: corporateStatus + (graceActive ? " (grace active)" : "") },
      { label: "Module", value: model.module },
      { label: "Vendor", value: model.vendor },
      { label: "Amount", value: formatUGX(model.amountUGX) },
    ],
    policyPath: [
      { step: "Eligibility", detail: "User is linked and eligible for CorporatePay under the selected organization." },
      { step: "Allocation", detail: "Cost center, project, and purpose are enforced when required." },
      { step: "Risk and limits", detail: "Thresholds and vendor restrictions decide approvals." },
      { step: "Decision", detail: outcome === "Allowed" ? "Allowed" : outcome === "Approval required" ? "Approval required" : "Blocked" },
    ],
    audit: [
      { label: "Correlation id", value: "corr_demo_u26" },
      { label: "Policy snapshot", value: "corp.policy.v1" },
      { label: "Timestamp", value: new Date().toISOString() },
    ],
  };

  if (!reasons.length) {
    reasons.push({ id: uid("r"), severity: "Info", code: "OK", title: "Within policy", detail: "This request passes current policy checks." });
  }

  return { outcome, reasons, rule, why };
}

function exportReviewToPrint(args: {
  model: SummaryModel;
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  corporateState: CorporateState;
  outcome: Outcome;
  costCenter: string;
  projectTag: string;
  purpose: string;
  notes: string;
  attachments: Attachment[];
}) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  const li = args.model.lineItems
    ? args.model.lineItems
      .map((x) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(x.name)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0; text-align:center;">${x.qty}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0; text-align:right; font-weight:800;">${escapeHtml(formatUGX(x.priceUGX))}</td></tr>`)
      .join("\n")
    : "";

  const details = args.model.details
    .map((d) => `<div style="display:flex; justify-content:space-between; gap:16px; padding:6px 0; border-bottom:1px dashed #e2e8f0;"><div style="color:#64748b; font-size:12px;">${escapeHtml(d.label)}</div><div style="font-weight:800;">${escapeHtml(d.value)}</div></div>`)
    .join("\n");

  const atts = args.attachments
    .map((a) => `<li>${escapeHtml(a.name)} (${escapeHtml(formatBytes(a.size))})</li>`)
    .join("\n");

  w.document.write(`
    <html>
      <head>
        <title>CorporatePay checkout summary</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          h2{font-size:14px; margin:16px 0 8px;}
          table{width:100%; border-collapse:collapse;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">CorporatePay</div>
            <h1 style="margin-top:10px;">Checkout summary</h1>
            <div class="muted" style="margin-top:6px;">Scenario: ${escapeHtml(args.model.scenario)} • Module: ${escapeHtml(args.model.module)}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Total</div>
            <div style="font-weight:900; font-size:18px;">${escapeHtml(formatUGX(args.model.amountUGX))}</div>
            <div class="muted" style="margin-top:6px;">Payment: ${escapeHtml(args.paymentMethod)} • Corporate: ${escapeHtml(args.corporateState)}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Title</div>
              <div style="font-weight:900;">${escapeHtml(args.model.title)}</div>
              <div class="muted" style="margin-top:6px;">Vendor: ${escapeHtml(args.model.vendor)}</div>
              <div class="muted" style="margin-top:6px;">Location: ${escapeHtml(args.model.locationLabel)}</div>
            </div>
            <div>
              <div class="muted">Outcome</div>
              <div style="font-weight:900;">${escapeHtml(args.outcome)}</div>
              <div class="muted" style="margin-top:6px;">Program: ${escapeHtml(args.corporateStatus)}</div>
            </div>
          </div>

          <h2>Details</h2>
          ${details}

          ${args.model.lineItems ? `<h2>Items</h2><table><thead><tr><th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Item</th><th style="text-align:center; padding:8px 0; color:#64748b; font-size:12px;">Qty</th><th style="text-align:right; padding:8px 0; color:#64748b; font-size:12px;">Price</th></tr></thead><tbody>${li}</tbody></table>` : ""}
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Allocation</h2>
          <div class="muted">Cost center: ${escapeHtml(args.costCenter || "-")} • Project: ${escapeHtml(args.projectTag || "-")} • Purpose: ${escapeHtml(args.purpose || "-")}</div>
          <div class="muted" style="margin-top:6px;">Notes: ${escapeHtml(args.notes || "-")}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Attachments</h2>
          <ul style="margin:0; padding-left:18px;">${atts || "<li>(none)</li>"}</ul>
        </div>

        <div class="no-print" style="margin-top:14px;">
          <button onclick="window.print()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:white; font-weight:800; cursor:pointer;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:800; cursor:pointer; margin-left:8px;">Close</button>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
}

function escapeHtml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardIconForScenario(s: Scenario) {
  if (s === "Ride") return <Users className="h-5 w-5" />;
  if (s === "EV Charging") return <Zap className="h-5 w-5" />;
  if (s === "E-Commerce") return <ShoppingCart className="h-5 w-5" />;
  return <CalendarClock className="h-5 w-5" />;
}

function outcomeIcon(o: Outcome) {
  if (o === "Allowed") return <BadgeCheck className="h-5 w-5" />;
  return <AlertTriangle className="h-5 w-5" />;
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-amber-900")}>{value}</div>
    </div>
  );
}

function ChecklistRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-slate-600">{hint}</div> : null}
      </div>
      {ok ? <Pill label="OK" tone="good" /> : <Pill label="Fix" tone="warn" />}
    </div>
  );
}

export default function UserCheckoutSummaryU26() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Demo scenario selection
  const [scenario, setScenario] = useState<Scenario>("Ride");

  const scenarios: SummaryModel[] = useMemo(
    () => [
      {
        scenario: "Ride",
        title: "Ride: Kampala CBD to Entebbe Airport",
        vendor: "EVzone Rides",
        module: "Rides & Logistics",
        amountUGX: 240000,
        locationLabel: "Pickup: Kampala CBD • Drop-off: Entebbe Airport",
        scheduleLabel: "Now",
        details: [
          { label: "Passenger", value: "You" },
          { label: "Ride category", value: "Standard" },
          { label: "Trip purpose", value: "Airport" },
          { label: "ETA", value: "18 min" },
        ],
        holdInfo: { label: "Driver dispatch", detail: "We will request a driver after confirmation." },
        policyHints: { purposeRequired: true, costCenterRequired: true, projectRequired: true, attachmentsRequired: false, attestationRequired: false },
        approvalThresholdUGX: 200000,
        hardBlockThresholdUGX: 5000000,
        vendorRestricted: false,
      },
      {
        scenario: "EV Charging",
        title: "Charging session: Kampala Rd 12",
        vendor: "EVzone Charging Hub",
        module: "EVs & Charging",
        amountUGX: 78000,
        locationLabel: "Station: Kampala Rd 12 • Connector: CCS2",
        scheduleLabel: "Start now",
        details: [
          { label: "Estimated kWh", value: "18 kWh" },
          { label: "Estimated time", value: "34 min" },
          { label: "Vehicle", value: "Fleet car 01" },
          { label: "Tariff", value: "Per kWh" },
        ],
        holdInfo: { label: "Session validation", detail: "A quick policy check runs before you start charging." },
        policyHints: { purposeRequired: true, costCenterRequired: true, projectRequired: false, attachmentsRequired: false, attestationRequired: false },
        approvalThresholdUGX: 150000,
        hardBlockThresholdUGX: 5000000,
        vendorRestricted: false,
      },
      {
        scenario: "E-Commerce",
        title: "Order checkout: Laptop bundle",
        vendor: "EVzone Preferred Tech",
        module: "E-Commerce",
        amountUGX: 2600000,
        locationLabel: "Delivery: Plot 12, Nkrumah Road, Kampala",
        scheduleLabel: "Delivery in 3 to 7 days",
        details: [
          { label: "Marketplace", value: "GadgetMart" },
          { label: "Shipping", value: "Standard" },
          { label: "Return policy", value: "7 days" },
          { label: "Order type", value: "Corporate" },
        ],
        lineItems: [
          { id: "li1", name: "Enterprise Laptop", qty: 1, priceUGX: 2300000 },
          { id: "li2", name: "USB-C Dock", qty: 1, priceUGX: 300000 },
        ],
        holdInfo: { label: "Stock hold", detail: "Items can be reserved for 15 minutes while you confirm." },
        policyHints: { purposeRequired: true, costCenterRequired: true, projectRequired: true, attachmentsRequired: false, attestationRequired: false },
        approvalThresholdUGX: 1200000,
        hardBlockThresholdUGX: 10000000,
        vendorRestricted: true,
      },
      {
        scenario: "Service Booking",
        title: "Service booking: Flight booking assistance",
        vendor: "EVzone Travel Partner",
        module: "Travel & Tourism",
        amountUGX: 250000,
        locationLabel: "Service location: Online",
        scheduleLabel: "Scheduled for tomorrow 10:00",
        details: [
          { label: "Service type", value: "Travel booking" },
          { label: "SLA", value: "Confirm within 45 min" },
          { label: "Cancellation", value: "Depends on airline" },
          { label: "Service policy", value: "Evidence required" },
        ],
        holdInfo: { label: "Vendor confirmation", detail: "Booking is queued for confirmation after approval if required." },
        policyHints: { purposeRequired: true, costCenterRequired: true, projectRequired: true, attachmentsRequired: true, attestationRequired: true },
        approvalThresholdUGX: 200000,
        hardBlockThresholdUGX: 5000000,
        vendorRestricted: false,
      },
    ],
    []
  );

  const model = useMemo(() => scenarios.find((s) => s.scenario === scenario) || scenarios[0], [scenarios, scenario]);

  // Payment and program state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");
  const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
  const [graceEnabled, setGraceEnabled] = useState(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 4 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const graceMs = graceEndAt - nowTick;
  const graceActive = corporateStatus === "Billing delinquency" && graceEnabled && graceMs > 0;

  // Allocation fields
  const costCenters = useMemo(() => ["OPS-01", "SAL-03", "FIN-01", "CAPEX-01", "FLEET-01"], []);
  const projectTags = useMemo(() => ["Project", "Client", "Event", "Fleet", "CapEx", "Operations"], []);
  const purposes = useMemo(() => ["Airport", "Client meeting", "Travel", "Charging", "Operations", "Training", "Other"], []);

  const [costCenter, setCostCenter] = useState<string>("OPS-01");
  const [projectTag, setProjectTag] = useState<string>("Project");
  const [purpose, setPurpose] = useState<string>(model.scenario === "EV Charging" ? "Charging" : model.scenario === "Ride" ? "Airport" : "Project");
  const [notes, setNotes] = useState<string>("");
  const [attested, setAttested] = useState<boolean>(false);

  useEffect(() => {
    // Best-effort defaults per scenario
    if (model.scenario === "EV Charging") setPurpose("Charging");
    if (model.scenario === "Ride") setPurpose("Airport");
    if (model.scenario === "E-Commerce") setPurpose("Project");
    if (model.scenario === "Service Booking") setPurpose("Travel");

    // Reset attestation when scenario changes
    setAttested(false);

    // Clear notes for demo
    setNotes("");
  }, [model.scenario]);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setAttachments((prev) => [...list, ...prev].slice(0, 10));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const addAttachmentName = () => {
    const name = prompt("Enter attachment name (example: Itinerary.pdf)")?.trim();
    if (!name) return;
    setAttachments((p) => [{ id: uid("att"), name, size: 0, type: "manual", ts: Date.now() }, ...p].slice(0, 10));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((p) => p.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  // Policy evaluation
  const policy = useMemo(() => {
    return evaluatePolicy({
      model,
      paymentMethod,
      corporateStatus,
      graceActive,
      costCenter,
      projectTag,
      purpose,
      attested,
      attachments,
      notes,
    });
  }, [model, paymentMethod, corporateStatus, graceActive, costCenter, projectTag, purpose, attested, attachments, notes]);

  const corporateState = useMemo(() => {
    return computeCorporateState({ paymentMethod, corporateStatus, graceActive, outcome: policy.outcome });
  }, [paymentMethod, corporateStatus, graceActive, policy.outcome]);

  // Why modal
  const [whyOpen, setWhyOpen] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);

  // Validation checklist
  const checks = useMemo(() => {
    const list: Array<{ ok: boolean; label: string; hint?: string }> = [];

    const corpOk = paymentMethod !== "CorporatePay" || corporateState !== "Not available";
    list.push({ ok: corpOk, label: "Payment availability", hint: paymentMethod === "CorporatePay" ? `CorporatePay: ${corporateState}` : "Personal payment" });

    if (paymentMethod === "CorporatePay") {
      if (model.policyHints.costCenterRequired) list.push({ ok: !!costCenter.trim(), label: "Cost center", hint: "Required for allocation" });
      if (model.policyHints.projectRequired) list.push({ ok: !!projectTag.trim(), label: "Project tag", hint: "Required for reporting" });
      if (model.policyHints.purposeRequired) list.push({ ok: !!purpose.trim(), label: "Purpose", hint: "Required by policy" });
      if (model.policyHints.attachmentsRequired) list.push({ ok: attachments.length > 0, label: "Evidence", hint: "Required attachments" });
      if (model.policyHints.attestationRequired) list.push({ ok: attested, label: "Attestation", hint: "Business use or compliance" });
    }

    list.push({ ok: policy.outcome !== "Blocked", label: "Policy outcome", hint: policy.outcome });

    return list;
  }, [paymentMethod, corporateState, model.policyHints, costCenter, projectTag, purpose, attachments.length, attested, policy.outcome]);

  const isValid = useMemo(() => checks.every((c) => c.ok), [checks]);

  // Submit behavior
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | { kind: "confirmed" | "approval"; id: string }>(null);

  const submit = () => {
    if (!isValid) {
      toast({ title: "Fix required", message: "Complete required fields before submitting.", kind: "warn" });
      setEditOpen(true);
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (policy.outcome === "Approval required" && paymentMethod === "CorporatePay") {
        const id = `REQ-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setSubmitResult({ kind: "approval", id });
        toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
      } else {
        const id = `OK-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setSubmitResult({ kind: "confirmed", id });
        toast({ title: "Confirmed", message: `Confirmed ${id}.`, kind: "success" });
      }
    }, 900);
  };

  const reset = () => {
    setSubmitResult(null);
    setSubmitting(false);
    setAttachments([]);
    setNotes("");
    setAttested(false);
    toast({ title: "Reset", message: "Ready for another review.", kind: "info" });
  };

  const topTone = toneForOutcome(policy.outcome);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  {cardIconForScenario(model.scenario)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">CorporatePay checkout summary</div>
                    <Pill label="U26" tone="neutral" />
                    <Pill label="Final review" tone="info" />
                    <Pill label={model.module} tone="neutral" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Universal final step for rides, charging, e-commerce, and services.</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                  Scenario
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value as Scenario)}
                    className="ml-2 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 outline-none"
                  >
                    {scenarios.map((s) => (
                      <option key={s.scenario} value={s.scenario}>
                        {s.scenario}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="outline" onClick={() => exportReviewToPrint({ model, paymentMethod, corporateStatus, corporateState, outcome: policy.outcome, costCenter, projectTag, purpose, notes, attachments })}>
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>

            {/* Outcome banner */}
            <div
              className={cn(
                "mt-4 rounded-[22px] border p-4",
                policy.outcome === "Allowed"
                  ? "border-emerald-200 bg-emerald-50"
                  : policy.outcome === "Approval required"
                    ? "border-amber-200 bg-amber-50"
                    : "border-rose-200 bg-rose-50"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1",
                      policy.outcome === "Allowed"
                        ? "text-emerald-700 ring-emerald-200"
                        : policy.outcome === "Approval required"
                          ? "text-amber-900 ring-amber-200"
                          : "text-rose-700 ring-rose-200"
                    )}
                  >
                    {outcomeIcon(policy.outcome)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={policy.outcome} tone={topTone} />
                      <Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                      {paymentMethod === "CorporatePay" ? (
                        <Pill
                          label={`CorporatePay: ${corporateState}`}
                          tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"}
                        />
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{model.title}</div>
                    <div className="mt-1 text-sm text-slate-700">{model.vendor} • {model.locationLabel}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setWhyOpen(true)}>
                    <Info className="h-4 w-4" /> Why
                  </Button>
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <ChevronRight className="h-4 w-4" /> Edit details
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Summary"
                  subtitle="Item or service, vendor, schedule and totals"
                  right={<Pill label={formatUGX(model.amountUGX)} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoRow label="Module" value={model.module} />
                    <InfoRow label="Vendor" value={model.vendor} />
                    <InfoRow label="Location" value={model.locationLabel} />
                    <InfoRow label="Schedule" value={model.scheduleLabel || "-"} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {model.details.map((d) => (
                      <div key={d.label} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500">{d.label}</div>
                        <div className="text-sm font-semibold text-slate-900 text-right">{d.value}</div>
                      </div>
                    ))}
                  </div>

                  {model.lineItems?.length ? (
                    <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold text-center">Qty</th>
                            <th className="px-4 py-3 font-semibold text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.lineItems.map((li) => (
                            <tr key={li.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{li.name}</td>
                              <td className="px-4 py-3 text-center text-slate-700">{li.qty}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatUGX(li.priceUGX)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {model.holdInfo ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      <span className="font-semibold text-slate-900">{model.holdInfo.label}:</span> {model.holdInfo.detail}
                    </div>
                  ) : null}
                </Section>

                <Section
                  title="Payment"
                  subtitle="Selected method and CorporatePay state"
                  right={<Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {([
                      { id: "CorporatePay" as const, label: "CorporatePay", desc: "Company-paid with policy and approvals", icon: <Building2 className="h-5 w-5" /> },
                      { id: "Personal Wallet" as const, label: "Personal Wallet", desc: "Pay from your personal wallet", icon: <Wallet className="h-5 w-5" /> },
                      { id: "Card" as const, label: "Card", desc: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
                      { id: "Mobile Money" as const, label: "Mobile Money", desc: "MTN/Airtel", icon: <Wallet className="h-5 w-5" /> },
                    ] as Array<{ id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }>).map((p) => {
                      const selected = paymentMethod === p.id;
                      const disabled = p.id === "CorporatePay" && corporateState === "Not available";
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (disabled) {
                              toast({ title: "Unavailable", message: "CorporatePay is not available. Choose another method.", kind: "warn" });
                              return;
                            }
                            setPaymentMethod(p.id);
                            toast({ title: "Payment", message: p.label, kind: "success" });
                          }}
                          className={cn(
                            "rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                            selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                            disabled && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
                                {p.icon}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                                  {p.id === "CorporatePay" ? (
                                    <Pill
                                      label={corporateState}
                                      tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"}
                                    />
                                  ) : null}
                                  {selected ? <Pill label="Selected" tone="info" /> : null}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{p.desc}</div>
                              </div>
                            </div>
                            <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                              {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                            </div>
                          </div>

                          {p.id === "CorporatePay" ? (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              Program status: <span className="font-semibold text-slate-900">{corporateStatus}</span>
                              {corporateStatus === "Billing delinquency" ? (
                                <div className="mt-1">Grace: {graceActive ? <span className="font-semibold">Active {msToFriendly(graceMs)}</span> : <span className="font-semibold">Inactive</span>}</div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">Personal payment does not require corporate approval.</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Demo control: corporate program status */}
                  {paymentMethod === "CorporatePay" ? (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Corporate program status</div>
                          <div className="mt-1 text-xs text-slate-500">Demo controls</div>
                        </div>
                        <Pill label={corporateStatus} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Status</div>
                          <select
                            value={corporateStatus}
                            onChange={(e) => setCorporateStatus(e.target.value as CorporateProgramStatus)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {([
                              "Eligible",
                              "Not linked",
                              "Not eligible",
                              "Deposit depleted",
                              "Credit limit exceeded",
                              "Billing delinquency",
                            ] as CorporateProgramStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={cn("rounded-3xl border border-slate-200 bg-white p-3", corporateStatus !== "Billing delinquency" && "opacity-60")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Grace window</div>
                              <div className="mt-1 text-xs text-slate-500">Premium</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={graceEnabled}
                              disabled={corporateStatus !== "Billing delinquency"}
                              onChange={(e) => setGraceEnabled(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-300"
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Pill label={graceActive ? `Active ${msToFriendly(graceMs)}` : "Inactive"} tone={graceActive ? "warn" : "neutral"} />
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => setGraceEndAt(Date.now() + 4 * 60 * 60 * 1000)}
                              disabled={corporateStatus !== "Billing delinquency"}
                            >
                              <RefreshCcw className="h-4 w-4" /> Reset
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        If CorporatePay is disabled, the user can pay personally or contact admin.
                      </div>
                    </div>
                  ) : null}
                </Section>

                <Section
                  title="Policy check"
                  subtitle="Pass, warnings, or blocked"
                  right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                >
                  <div className="space-y-2">
                    {policy.reasons.map((r) => (
                      <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={r.code} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                              <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                              <Pill label={r.severity} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Approval banner */}
                  {paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label="Approval required" tone="warn" />
                            <Pill label="Rule" tone="neutral" />
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{policy.rule.detail}</div>
                          <div className="mt-1 text-sm text-slate-700">Expected decision: within 8 hours (configurable). Approver chain: Manager then Finance.</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-900 ring-1 ring-amber-200">
                          <Timer className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Tip: add a note and attach supporting evidence to reduce rework.
                      </div>
                    </div>
                  ) : null}

                  {/* Blocked guidance */}
                  {policy.outcome === "Blocked" ? (
                    <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">You cannot submit yet</div>
                          <div className="mt-1 text-sm text-slate-700">Fix missing requirements, switch payment method, or request exception.</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-700 ring-1 ring-rose-200">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPaymentMethod("Personal Wallet");
                            toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" });
                          }}
                        >
                          <Wallet className="h-4 w-4" /> Pay personally
                        </Button>
                        <Button variant="outline" onClick={() => toast({ title: "Exception", message: "Create exception request.", kind: "info" })}>
                          <AlertTriangle className="h-4 w-4" /> Request exception
                        </Button>
                        <Button variant="outline" onClick={() => setEditOpen(true)}>
                          <ChevronRight className="h-4 w-4" /> Fix details
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Section>
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="Allocation"
                  subtitle="Cost center, project tag, and purpose"
                  right={
                    <Pill
                      label={paymentMethod === "CorporatePay" ? "Corporate" : "Personal"}
                      tone={paymentMethod === "CorporatePay" ? "info" : "neutral"}
                    />
                  }
                >
                  <div className="space-y-2">
                    <InfoRow label="Cost center" value={costCenter || "Required"} emphasize={paymentMethod === "CorporatePay" && model.policyHints.costCenterRequired && !costCenter.trim()} />
                    <InfoRow label="Project tag" value={projectTag || (model.policyHints.projectRequired ? "Required" : "Optional")} emphasize={paymentMethod === "CorporatePay" && model.policyHints.projectRequired && !projectTag.trim()} />
                    <InfoRow label="Purpose" value={purpose || (model.policyHints.purposeRequired ? "Required" : "Optional")} emphasize={paymentMethod === "CorporatePay" && model.policyHints.purposeRequired && !purpose.trim()} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    These fields appear on corporate receipts and invoices.
                  </div>

                  <div className="mt-3">
                    <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                      <ChevronRight className="h-4 w-4" /> Edit allocation
                    </Button>
                  </div>
                </Section>

                <Section
                  title="Attachments"
                  subtitle={model.policyHints.attachmentsRequired ? "Required" : "Optional"}
                  right={<Pill label={`${attachments.length}`} tone={attachments.length ? "info" : model.policyHints.attachmentsRequired ? "warn" : "neutral"} />}
                >
                  <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => addFiles(e.target.files)} />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    <Button variant="outline" onClick={addAttachmentName}>
                      <Paperclip className="h-4 w-4" /> Add name
                    </Button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{a.type} • {formatBytes(a.size)} • {timeAgo(a.ts)}</div>
                        </div>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                          <X className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                    ))}
                    {!attachments.length ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        No attachments.
                      </div>
                    ) : null}
                  </div>

                  {model.policyHints.attachmentsRequired ? (
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Evidence is required for this service. Attach itinerary, letter, or document.
                    </div>
                  ) : null}
                </Section>

                <Section title="Last-step validation" subtitle="We run one final check before submitting" right={<Pill label={isValid ? "Ready" : "Fix required"} tone={isValid ? "good" : "warn"} />}>
                  <div className="space-y-2">
                    {checks.map((c) => (
                      <ChecklistRow key={c.label} ok={c.ok} label={c.label} hint={c.hint} />
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    If CorporatePay becomes unavailable, the app should offer personal payment as a fallback.
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Outcome: ${policy.outcome}`} tone={toneForOutcome(policy.outcome)} />
                  <Pill label={`Total: ${formatUGX(model.amountUGX)}`} tone="neutral" />
                  {paymentMethod === "CorporatePay" ? <Pill label={`CorporatePay: ${corporateState}`} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} /> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to checkout steps (demo).", kind: "info" })}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <ChevronRight className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant={policy.outcome === "Blocked" ? "outline" : "primary"}
                    onClick={submit}
                    disabled={submitting || policy.outcome === "Blocked"}
                    title={policy.outcome === "Blocked" ? "Fix issues first" : ""}
                  >
                    {submitting ? (
                      <>
                        <Timer className="h-4 w-4" /> Working…
                      </>
                    ) : paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                      <>
                        <FileText className="h-4 w-4" /> Submit for approval
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="h-4 w-4" /> Confirm
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {submitResult ? (
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                  {submitResult.kind === "approval" ? (
                    <div>
                      <div className="font-semibold">Submitted for approval</div>
                      <div className="mt-1">Request ID: <span className="font-semibold">{submitResult.id}</span>. Track status in U13 and view in U5.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">Confirmed</div>
                      <div className="mt-1">Confirmation ID: <span className="font-semibold">{submitResult.id}</span>. Receipt will be generated in U6.</div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U26 CorporatePay Checkout Summary. Universal final confirmation step for rides, charging, e-commerce, and services, with policy checks, approvals, attachments, and final validation.
            </div>
          </div>
        </div>
      </div>

      {/* Why modal */}
      <Modal
        open={whyOpen}
        title="Why did I get this result?"
        subtitle="Policy and audit-linked explanation"
        onClose={() => setWhyOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setWhyOpen(false)}>
              Close
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Summary</div>
                <div className="mt-1 text-sm text-slate-700">{policy.why.summary}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600">Triggers</div>
              <div className="mt-3 space-y-2">
                {policy.why.triggers.map((t) => (
                  <div key={t.label} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">{t.label}</div>
                    <div className="text-right">{t.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600">Audit references</div>
              <div className="mt-3 space-y-2">
                {policy.why.audit.map((a) => (
                  <div key={a.label} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">{a.label}</div>
                    <div className="text-right">{a.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Policy decision path</div>
            <div className="mt-3 space-y-2">
              {policy.why.policyPath.map((p, idx) => (
                <div key={`${p.step}-${idx}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.step}</div>
                      <div className="mt-1 text-sm text-slate-600">{p.detail}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              This explanation is derived from policy rules and audit triggers.
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        title="Edit checkout details"
        subtitle="Purpose, allocation, notes, and attestation"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditOpen(false);
                toast({ title: "Updated", message: "Changes saved for this checkout.", kind: "success" });
              }}
            >
              <Check className="h-4 w-4" /> Save
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Allocation</div>
            <div className="mt-1 text-xs text-slate-500">Required fields are enforced by policy</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Cost center {model.policyHints.costCenterRequired ? <span className="text-rose-600">*</span> : null}</div>
                <select
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                    model.policyHints.costCenterRequired && !costCenter.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                  )}
                >
                  <option value="">Select</option>
                  {costCenters.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Project tag {model.policyHints.projectRequired ? <span className="text-rose-600">*</span> : null}</div>
                <select
                  value={projectTag}
                  onChange={(e) => setProjectTag(e.target.value)}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                    model.policyHints.projectRequired && !projectTag.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                  )}
                >
                  <option value="">Select</option>
                  {projectTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Purpose {model.policyHints.purposeRequired ? <span className="text-rose-600">*</span> : null}</div>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                    model.policyHints.purposeRequired && !purpose.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                  )}
                >
                  <option value="">Select</option>
                  {purposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Notes</div>
            <div className="mt-1 text-xs text-slate-500">Recommended when approvals may be required</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add context for approvers and audit"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {model.policyHints.attestationRequired ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Attestation</div>
                  <div className="mt-1 text-xs text-slate-500">Required by policy for this service</div>
                </div>
                <Pill label={attested ? "Accepted" : "Required"} tone={attested ? "good" : "warn"} />
              </div>
              <label className="mt-3 flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Business use only</div>
                  <div className="mt-1 text-xs text-slate-600">I confirm this request is business-related and complies with company policy.</div>
                </div>
              </label>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              No attestation required for this scenario.
            </div>
          )}

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            If the request triggers approval, it will appear in U5 and U13 for tracking.
          </div>
        </div>
      </Modal>
    </div>
  );
}
