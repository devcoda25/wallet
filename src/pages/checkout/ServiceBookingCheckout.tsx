import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  LifeBuoy,
  MapPin,
  Paperclip,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Step = "service" | "beneficiary" | "requirements" | "payment" | "review" | "status";

type Role = "Employee" | "Coordinator";

type ServiceModule =
  | "Medical & Health Care"
  | "Travel & Tourism"
  | "School & E-Learning"
  | "Virtual Workspace"
  | "FaithHub"
  | "Finance & Payments"
  | "Other Service Module";

type ServiceCategory =
  | "Appointment"
  | "Home Visit"
  | "Travel Booking"
  | "Training"
  | "Workspace Booking"
  | "Consultation"
  | "Other";

type VendorStatus = "Preferred" | "Approved" | "Restricted";

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

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type PassengerType = "Self" | "Employee" | "Visitor";

type Passenger = {
  id: string;
  name: string;
  phone: string;
  type: PassengerType;
  group?: string;
  defaultCostCenter?: string;
};

type Vendor = {
  id: string;
  name: string;
  status: VendorStatus;
  slaConfirmMins: number;
  slaDeliveryHrs: number;
  notes?: string;
};

type Service = {
  id: string;
  module: ServiceModule;
  category: ServiceCategory;
  title: string;
  vendorId: string;
  basePriceUGX: number;
  locationHint: string;
  requiredAttachments: string[]; // policy-driven
  purposeRequired: boolean;
  notesRequired: boolean;
  approvalThresholdUGX: number;
  refundPolicy: string;
  cancellationPolicy: string;
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type PolicyReasonCode = "PROGRAM" | "FIELDS" | "ATTACH" | "VENDOR" | "AMOUNT" | "OK";

type PolicyReason = { code: PolicyReasonCode; title: string; detail: string; severity: "Info" | "Warning" | "Critical" };

type Alternative = {
  id: string;
  title: string;
  desc: string;
  expected: Outcome;
  icon: React.ReactNode;
  apply: () => void;
};

type CoachTip = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  apply?: () => void;
};

type BookingState =
  | "Draft"
  | "Pending approval"
  | "Pending confirmation"
  | "Confirmed"
  | "In progress"
  | "Completed"
  | "Needs changes"
  | "Cancelled"
  | "Refund processing"
  | "Refunded"
  | "SLA breached";

type TimelineItem = { id: string; ts: number; title: string; detail: string; by: string };

type ReceiptRow = {
  receiptId: string;
  orgName: string;
  module: ServiceModule;
  serviceTitle: string;
  vendorName: string;
  bookingId: string;
  createdAt: number;
  scheduledAt: number;
  beneficiary: string;
  paymentMethod: PaymentMethod;
  corporate: boolean;
  purpose?: string;
  costCenter?: string;
  attachmentsCount: number;
  amountUGX: number;
  status: BookingState;
};

type Dispute = {
  id: string;
  createdAt: number;
  reason: string;
  note: string;
  attachmentName?: string;
  status: "Open" | "In review" | "Resolved";
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function formatBytes(bytes: number) {
  const b = Math.max(0, bytes || 0);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral" | "accent";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
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
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
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
  maxW = "900px",
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
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
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

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

function Stepper({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const steps: Array<{ k: Step; label: string }> = [
    { k: "service", label: "Service" },
    { k: "beneficiary", label: "Beneficiary" },
    { k: "requirements", label: "Requirements" },
    { k: "payment", label: "Payment" },
    { k: "review", label: "Review" },
    { k: "status", label: "Status" },
  ];

  const idx = steps.findIndex((s) => s.k === step);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {steps.map((s, i) => {
          const active = s.k === step;
          const done = i < idx;
          return (
            <button
              key={s.k}
              type="button"
              onClick={() => setStep(s.k)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Step {i + 1}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{s.label}</div>
                </div>
                {active ? <ChevronRight className="h-5 w-5 text-emerald-700" /> : done ? <BadgeCheck className="h-5 w-5 text-emerald-700" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function computeCorporateState(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  requiresApproval: boolean;
  blockedByPolicy: boolean;
}): CorporateState {
  const { paymentMethod, corporateStatus, graceActive, requiresApproval, blockedByPolicy } = args;

  if (paymentMethod !== "CorporatePay") return "Available";

  const blockedByProgram =
    corporateStatus === "Not linked" ||
    corporateStatus === "Not eligible" ||
    corporateStatus === "Deposit depleted" ||
    corporateStatus === "Credit limit exceeded" ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (blockedByProgram) return "Not available";
  if (blockedByPolicy) return "Not available";
  if (requiresApproval) return "Requires approval";
  return "Available";
}

function evaluateServicePolicy(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  service: Service;
  vendor: Vendor;
  amountUGX: number;
  costCenter: string;
  purpose: string;
  attachments: Attachment[];
  splitAllowed: boolean;
  role: Role;
  beneficiary: Passenger;
}): { outcome: Outcome; reasons: PolicyReason[]; alternatives: Alternative[]; coach: CoachTip[] } {
  const {
    paymentMethod,
    corporateStatus,
    graceActive,
    service,
    vendor,
    amountUGX,
    costCenter,
    purpose,
    attachments,
    role,
    beneficiary,
  } = args;

  const reasons: PolicyReason[] = [];
  const alternatives: Alternative[] = [];
  const coach: CoachTip[] = [];

  // Personal payment bypass
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments.", severity: "Info" });
    coach.push({ id: "coach-corp", title: "Use CorporatePay for audit-ready receipts", desc: "CorporatePay receipts include purpose, cost center, and booking metadata.", icon: <Building2 className="h-4 w-4" /> });
    return { outcome: "Allowed", reasons, alternatives, coach };
  }

  // Program enforcement
  if (corporateStatus === "Not linked") {
    reasons.push({ code: "PROGRAM", title: "Not linked", detail: "CorporatePay is only available when you are linked to an organization.", severity: "Critical" });
  }
  if (corporateStatus === "Not eligible") {
    reasons.push({ code: "PROGRAM", title: "Not eligible", detail: "Your role or group is not eligible under policy for this module.", severity: "Critical" });
  }
  if (corporateStatus === "Deposit depleted") {
    reasons.push({ code: "PROGRAM", title: "Deposit depleted", detail: "Prepaid deposit is depleted. CorporatePay stops until admin tops up.", severity: "Critical" });
  }
  if (corporateStatus === "Credit limit exceeded") {
    reasons.push({ code: "PROGRAM", title: "Credit limit exceeded", detail: "Corporate credit limit exceeded. CorporatePay is paused.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && !graceActive) {
    reasons.push({ code: "PROGRAM", title: "Billing delinquency", detail: "CorporatePay is suspended due to delinquency.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ code: "PROGRAM", title: "Grace window active", detail: "Billing is past due but grace window is active.", severity: "Warning" });
  }

  const blockedByProgram =
    corporateStatus === "Not linked" ||
    corporateStatus === "Not eligible" ||
    corporateStatus === "Deposit depleted" ||
    corporateStatus === "Credit limit exceeded" ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (blockedByProgram) {
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed immediately using personal payment.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      apply: () => { },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  // Vendor status
  if (vendor.status === "Restricted") {
    reasons.push({ code: "VENDOR", title: "Vendor restricted", detail: "This vendor requires approval for corporate bookings.", severity: "Warning" });
    coach.push({ id: "coach-vendor", title: "Prefer approved vendors", desc: "Approved or preferred vendors reduce approval friction.", icon: <ShieldCheck className="h-4 w-4" /> });
  }

  // Required fields
  if (!costCenter.trim()) {
    reasons.push({ code: "FIELDS", title: "Cost center required", detail: "Cost center is required for corporate billing allocation.", severity: "Critical" });
  }

  if (service.purposeRequired && !purpose.trim()) {
    reasons.push({ code: "FIELDS", title: "Purpose required", detail: "Purpose tag is required by policy for this service.", severity: "Critical" });
  }

  // Attachment enforcement
  if (service.requiredAttachments.length) {
    const hasAny = attachments.length > 0;
    if (!hasAny) {
      reasons.push({
        code: "ATTACH",
        title: "Attachment required",
        detail: `Upload: ${service.requiredAttachments.join(", ")}.`,
        severity: "Critical",
      });
    }
  }

  // Amount thresholds
  if (amountUGX > service.approvalThresholdUGX) {
    reasons.push({ code: "AMOUNT", title: "Approval required", detail: `Amount above ${formatUGX(service.approvalThresholdUGX)} requires approval.`, severity: "Warning" });
  }

  // Coach
  if (role === "Coordinator" && beneficiary.type !== "Self") {
    coach.push({
      id: "coach-bookfor",
      title: "Book for others is audited",
      desc: "Add a clear purpose and attach supporting documents to reduce rework.",
      icon: <Users className="h-4 w-4" />,
    });
  }

  if (service.module === "Travel & Tourism") {
    coach.push({
      id: "coach-travel",
      title: "Use policy-safe templates",
      desc: "Travel bookings are smoother when itinerary or invitation is attached.",
      icon: <FileText className="h-4 w-4" />,
    });
  }

  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarning = reasons.some((r) => r.severity === "Warning");

  if (!reasons.length) {
    reasons.push({ code: "OK", title: "Within policy", detail: "Service booking passes current policy checks.", severity: "Info" });
  }

  // Alternatives (local suggestions)
  if (!purpose.trim() && service.purposeRequired) {
    alternatives.push({
      id: "alt-purpose",
      title: "Add purpose",
      desc: "Select a purpose tag to proceed.",
      expected: "Allowed",
      icon: <ClipboardCheck className="h-4 w-4" />,
      apply: () => { },
    });
  }

  if (!costCenter.trim()) {
    alternatives.push({
      id: "alt-cc",
      title: "Select cost center",
      desc: "Choose a cost center for billing allocation.",
      expected: "Allowed",
      icon: <Tag className="h-4 w-4" />,
      apply: () => { },
    });
  }

  alternatives.push({
    id: "alt-pay",
    title: "Pay personally",
    desc: "Proceed immediately using personal payment.",
    expected: "Allowed",
    icon: <Wallet className="h-4 w-4" />,
    apply: () => { },
  });

  if (hasCritical) return { outcome: "Blocked", reasons, alternatives, coach };
  if (hasWarning) return { outcome: "Approval required", reasons, alternatives, coach };
  return { outcome: "Allowed", reasons, alternatives, coach };
}

function exportReceiptToPrint(receipt: ReceiptRow) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  w.document.write(`
    <html>
      <head>
        <title>${receipt.receiptId} - Receipt</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          .total{font-size:18px; font-weight:900;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">${receipt.corporate ? "CorporatePay" : "Personal"}</div>
            <h1 style="margin-top:10px;">Service receipt</h1>
            <div class="muted" style="margin-top:6px;">Receipt: ${receipt.receiptId} • Booking: ${receipt.bookingId}</div>
            <div class="muted" style="margin-top:6px;">Org: ${receipt.orgName} • ${new Date(receipt.createdAt).toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Total</div>
            <div class="total">${formatUGX(receipt.amountUGX)}</div>
            <div class="muted" style="margin-top:6px;">Payment: ${receipt.paymentMethod}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Module</div>
              <div style="font-weight:800;">${receipt.module}</div>
            </div>
            <div>
              <div class="muted">Vendor</div>
              <div style="font-weight:800;">${receipt.vendorName}</div>
            </div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div>
              <div class="muted">Service</div>
              <div style="font-weight:800;">${receipt.serviceTitle}</div>
            </div>
            <div>
              <div class="muted">Beneficiary</div>
              <div style="font-weight:800;">${receipt.beneficiary}</div>
            </div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div>
              <div class="muted">Scheduled</div>
              <div style="font-weight:800;">${new Date(receipt.scheduledAt).toLocaleString()}</div>
            </div>
            <div>
              <div class="muted">Attachments</div>
              <div style="font-weight:800;">${receipt.attachmentsCount}</div>
            </div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div>
              <div class="muted">Cost center</div>
              <div style="font-weight:800;">${receipt.costCenter || "-"}</div>
            </div>
            <div>
              <div class="muted">Purpose</div>
              <div style="font-weight:800;">${receipt.purpose || "-"}</div>
            </div>
          </div>
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

function Tag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3.5 12.2V6.8A3.3 3.3 0 0 1 6.8 3.5h5.4a2 2 0 0 1 1.4.6l7.9 7.9a2 2 0 0 1 0 2.8l-6.7 6.7a2 2 0 0 1-2.8 0l-7.9-7.9a2 2 0 0 1-.6-1.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M7.5 7.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function UserServiceBookingCheckoutU18() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [step, setStep] = useState<Step>("service");
  const [role, setRole] = useState<Role>("Employee");
  const isCoordinator = role === "Coordinator";

  const modules: ServiceModule[] = useMemo(
    () => ["Medical & Health Care", "Travel & Tourism", "School & E-Learning", "Virtual Workspace", "FaithHub", "Finance & Payments", "Other Service Module"],
    []
  );

  const vendors: Vendor[] = useMemo(
    () => [
      { id: "v_hosp", name: "City Hospital", status: "Approved", slaConfirmMins: 60, slaDeliveryHrs: 24, notes: "Medical appointment confirmations within 1 hour" },
      { id: "v_travel", name: "EVzone Travel Partner", status: "Preferred", slaConfirmMins: 45, slaDeliveryHrs: 6, notes: "Preferred travel agent" },
      { id: "v_school", name: "EVzone School Provider", status: "Approved", slaConfirmMins: 120, slaDeliveryHrs: 48, notes: "Enrollment confirmations within 2 hours" },
      { id: "v_workspace", name: "Workspace Rooms Uganda", status: "Approved", slaConfirmMins: 30, slaDeliveryHrs: 2, notes: "Meeting rooms with fast confirmation" },
      { id: "v_faith", name: "FaithHub Partners", status: "Restricted", slaConfirmMins: 90, slaDeliveryHrs: 12, notes: "Restricted vendor, may require approval" },
      { id: "v_fin", name: "Finance Services Desk", status: "Restricted", slaConfirmMins: 120, slaDeliveryHrs: 24, notes: "Finance services are high sensitivity" },
    ],
    []
  );

  const vendorsById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])) as Record<string, Vendor>, [vendors]);

  const services: Service[] = useMemo(
    () => [
      {
        id: "svc_doc",
        module: "Medical & Health Care",
        category: "Appointment",
        title: "Doctor appointment booking",
        vendorId: "v_hosp",
        basePriceUGX: 80000,
        locationHint: "Kampala",
        requiredAttachments: ["Doctor referral letter (if applicable)", "ID (optional)"],
        purposeRequired: true,
        notesRequired: false,
        approvalThresholdUGX: 200000,
        cancellationPolicy: "Free cancellation within 30 minutes. After that, vendor may charge a fee.",
        refundPolicy: "Refunds processed within 3 to 5 business days if eligible.",
      },
      {
        id: "svc_home",
        module: "Medical & Health Care",
        category: "Home Visit",
        title: "Home healthcare visit",
        vendorId: "v_hosp",
        basePriceUGX: 220000,
        locationHint: "Kampala",
        requiredAttachments: ["Doctor letter", "Patient notes (optional)"],
        purposeRequired: true,
        notesRequired: true,
        approvalThresholdUGX: 150000,
        cancellationPolicy: "Free cancellation within 1 hour. After dispatch, cancellation may be denied.",
        refundPolicy: "Refunds depend on dispatch status and may be partial.",
      },
      {
        id: "svc_flight",
        module: "Travel & Tourism",
        category: "Travel Booking",
        title: "Flight booking assistance",
        vendorId: "v_travel",
        basePriceUGX: 250000,
        locationHint: "Multi-city",
        requiredAttachments: ["Itinerary or invitation", "Passport bio page (optional)"],
        purposeRequired: true,
        notesRequired: true,
        approvalThresholdUGX: 200000,
        cancellationPolicy: "Depends on airline rules. Changes may incur fees.",
        refundPolicy: "Refund timelines vary by airline. Receipts include policy references.",
      },
      {
        id: "svc_training",
        module: "School & E-Learning",
        category: "Training",
        title: "Enroll in a corporate training course",
        vendorId: "v_school",
        basePriceUGX: 120000,
        locationHint: "Online",
        requiredAttachments: ["Employee ID (optional)"],
        purposeRequired: false,
        notesRequired: false,
        approvalThresholdUGX: 250000,
        cancellationPolicy: "Cancel before course starts for a full refund.",
        refundPolicy: "Refunds may be prorated after course start.",
      },
      {
        id: "svc_room",
        module: "Virtual Workspace",
        category: "Workspace Booking",
        title: "Meeting room booking",
        vendorId: "v_workspace",
        basePriceUGX: 150000,
        locationHint: "Kampala CBD",
        requiredAttachments: ["Meeting agenda (optional)"],
        purposeRequired: false,
        notesRequired: false,
        approvalThresholdUGX: 200000,
        cancellationPolicy: "Free cancellation within 2 hours. Late cancellation may incur fee.",
        refundPolicy: "Refunds processed within 2 to 3 business days.",
      },
      {
        id: "svc_faith",
        module: "FaithHub",
        category: "Consultation",
        title: "Community session booking",
        vendorId: "v_faith",
        basePriceUGX: 100000,
        locationHint: "Kampala",
        requiredAttachments: [],
        purposeRequired: false,
        notesRequired: false,
        approvalThresholdUGX: 120000,
        cancellationPolicy: "Cancellation allowed up to 24 hours before.",
        refundPolicy: "Refunds depend on session rules.",
      },
      {
        id: "svc_fin",
        module: "Finance & Payments",
        category: "Other",
        title: "Corporate finance service request",
        vendorId: "v_fin",
        basePriceUGX: 300000,
        locationHint: "Kampala",
        requiredAttachments: ["Quotation or scope", "Approval memo (optional)"],
        purposeRequired: true,
        notesRequired: true,
        approvalThresholdUGX: 150000,
        cancellationPolicy: "Depends on service scope. Cancellation may be denied once work starts.",
        refundPolicy: "Refunds are evaluated case by case.",
      },
    ],
    []
  );

  const [module, setModule] = useState<ServiceModule>("Travel & Tourism");
  const [serviceId, setServiceId] = useState<string>(() => services.find((s) => s.module === "Travel & Tourism")?.id || services[0].id);
  const service = useMemo(() => services.find((s) => s.id === serviceId) || services[0], [services, serviceId]);
  const vendor = useMemo(() => vendorsById[service.vendorId], [vendorsById, service.vendorId]);

  useEffect(() => {
    const first = services.find((s) => s.module === module);
    if (first) setServiceId(first.id);
  }, [module, services]);

  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const scheduledAt = useMemo(() => new Date(`${scheduledDate}T${scheduledTime}:00`).getTime(), [scheduledDate, scheduledTime]);

  // Beneficiaries
  const [passengers, setPassengers] = useState<Passenger[]>(() => [
    { id: "me", name: "You", phone: "+256 700 000 000", type: "Self", group: "Operations", defaultCostCenter: "OPS-01" },
    { id: "emp-1", name: "John S.", phone: "+256 701 000 000", type: "Employee", group: "Sales", defaultCostCenter: "SAL-03" },
    { id: "emp-2", name: "Mary N.", phone: "+256 702 000 000", type: "Employee", group: "Operations", defaultCostCenter: "OPS-02" },
  ]);
  const [beneficiaryId, setBeneficiaryId] = useState<string>("me");
  const beneficiary = useMemo(() => passengers.find((p) => p.id === beneficiaryId) || passengers[0], [passengers, beneficiaryId]);

  // Allocation
  const costCenters = useMemo(() => ["OPS-01", "OPS-02", "SAL-03", "ADM-01", "FIN-01", "CAPEX-01", "FLEET-01"], []);
  const purposeTags = useMemo(() => ["Client meeting", "Training", "Travel", "Medical", "Workspace", "Operations", "Other"], []);

  const [costCenter, setCostCenter] = useState<string>(beneficiary.defaultCostCenter || "OPS-01");
  const [purpose, setPurpose] = useState<string>(service.purposeRequired ? "Travel" : "");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    // Best-effort defaults when service changes
    if (service.module === "Travel & Tourism") setPurpose((p) => p || "Travel");
    if (service.module === "Medical & Health Care") setPurpose((p) => p || "Medical");
    if (service.module === "Virtual Workspace") setPurpose((p) => p || "Workspace");
  }, [service.module]);

  useEffect(() => {
    const def = beneficiary.defaultCostCenter;
    if (def) setCostCenter(def);
  }, [beneficiaryId]);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addAttachmentFiles = (files: FileList | null) => {
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
    const att: Attachment = { id: uid("att"), name, size: 0, type: "manual", ts: Date.now() };
    setAttachments((p) => [att, ...p].slice(0, 10));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((p) => p.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  // Payment
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

  const amountUGX = useMemo(() => {
    // Simple estimate: base + multiplier for coordinator and for some categories
    const base = service.basePriceUGX;
    const coord = isCoordinator && beneficiary.type !== "Self" ? 1.05 : 1;
    const med = service.module === "Medical & Health Care" && service.category === "Home Visit" ? 1.1 : 1;
    return Math.round(base * coord * med);
  }, [service.basePriceUGX, isCoordinator, beneficiary.type, service.module, service.category]);

  // Policy
  const policy = useMemo(() => {
    return evaluateServicePolicy({
      paymentMethod,
      corporateStatus,
      graceActive,
      service,
      vendor,
      amountUGX,
      costCenter,
      purpose,
      attachments,
      splitAllowed: false,
      role,
      beneficiary,
    });
  }, [paymentMethod, corporateStatus, graceActive, service, vendor, amountUGX, costCenter, purpose, attachments, role, beneficiary]);

  const corporateState = useMemo(() => {
    const requiresApproval = policy.outcome === "Approval required";
    const blockedByPolicy = policy.outcome === "Blocked";
    return computeCorporateState({
      paymentMethod,
      corporateStatus,
      graceActive,
      requiresApproval,
      blockedByPolicy,
    });
  }, [paymentMethod, corporateStatus, graceActive, policy.outcome]);

  // Booking status and SLA tracking
  const [bookingState, setBookingState] = useState<BookingState>("Draft");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);

  const [autoDisputeEnabled, setAutoDisputeEnabled] = useState(true);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  const bookingCreatedAt = useMemo(() => Date.now(), []);
  const confirmDueAt = useMemo(() => bookingCreatedAt + vendor.slaConfirmMins * 60 * 1000, [bookingCreatedAt, vendor.slaConfirmMins]);
  const deliveryDueAt = useMemo(() => bookingCreatedAt + vendor.slaDeliveryHrs * 60 * 60 * 1000, [bookingCreatedAt, vendor.slaDeliveryHrs]);

  const confirmMs = confirmDueAt - nowTick;
  const deliveryMs = deliveryDueAt - nowTick;

  // Demo controls (simulate vendor actions)
  const simulateConfirm = () => {
    setBookingState((p) => (p === "Pending confirmation" ? "Confirmed" : p));
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), title: "Confirmed", detail: "Vendor confirmed the booking.", by: "Vendor" },
    ]);
    toast({ title: "Confirmed", message: "Vendor confirmed.", kind: "success" });
  };

  const simulateComplete = () => {
    setBookingState("Completed");
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), title: "Completed", detail: "Service delivered and completed.", by: "Vendor" },
    ]);
    toast({ title: "Completed", message: "Service completed.", kind: "success" });
  };

  const simulateBreach = () => {
    setBookingState("SLA breached");
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), title: "SLA breached", detail: "Vendor SLA breached for this booking.", by: "System" },
    ]);
    toast({ title: "SLA breached", message: "SLA breach detected.", kind: "warn" });

    if (autoDisputeEnabled && !dispute) {
      const d: Dispute = {
        id: `DSP-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
        createdAt: Date.now(),
        reason: "Vendor SLA breached",
        note: "Auto-created dispute because vendor SLA was breached.",
        status: "Open",
      };
      setDispute(d);
      setTimeline((prev) => [
        ...prev,
        { id: uid("tl"), ts: Date.now(), title: "Dispute opened", detail: `Dispute ${d.id} opened automatically.`, by: "System" },
      ]);
      toast({ title: "Dispute opened", message: `Auto dispute ${d.id} created.`, kind: "info" });
    }
  };

  // Booking actions
  const submitForApproval = () => {
    const id = `REQ-SVC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setBookingState("Pending approval");
    setTimeline([
      { id: uid("tl"), ts: Date.now(), title: "Submitted", detail: `Approval request ${id} created.`, by: "You" },
      { id: uid("tl"), ts: Date.now(), title: "Pending approval", detail: "Waiting for approver decision.", by: "System" },
    ]);
    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    toast({ title: "Track", message: "Track status in U13 Pending Approval (demo).", kind: "info" });
    setStep("status");
  };

  const confirmBooking = () => {
    const bookingId = `BKG-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setBookingState("Pending confirmation");
    setTimeline([
      { id: uid("tl"), ts: Date.now(), title: "Booked", detail: `Booking ${bookingId} created.`, by: "You" },
      { id: uid("tl"), ts: Date.now(), title: "Pending confirmation", detail: `Vendor SLA confirmation within ${vendor.slaConfirmMins} minutes.`, by: "System" },
    ]);

    const r: ReceiptRow = {
      receiptId: `RCPT-SVC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      orgName: "Acme Group Ltd",
      module: service.module,
      serviceTitle: service.title,
      vendorName: vendor.name,
      bookingId,
      createdAt: Date.now(),
      scheduledAt,
      beneficiary: `${beneficiary.name} (${beneficiary.type})`,
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
      costCenter: paymentMethod === "CorporatePay" ? costCenter : undefined,
      attachmentsCount: attachments.length,
      amountUGX,
      status: "Pending confirmation",
    };
    setReceipt(r);

    toast({ title: "Booked", message: "Service booking created.", kind: "success" });
    setStep("status");
  };

  const cancelBooking = () => {
    const ok = window.confirm("Cancel this booking?");
    if (!ok) return;
    setBookingState("Cancelled");
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), title: "Cancelled", detail: "Booking cancelled by requester.", by: "You" },
      { id: uid("tl"), ts: Date.now(), title: "Refund processing", detail: "Refund requested (if eligible).", by: "System" },
    ]);
    setBookingState("Refund processing");
    toast({ title: "Cancelled", message: "Cancellation requested.", kind: "info" });

    window.setTimeout(() => {
      setBookingState("Refunded");
      setTimeline((prev) => [
        ...prev,
        { id: uid("tl"), ts: Date.now(), title: "Refunded", detail: "Refund completed.", by: "System" },
      ]);
      toast({ title: "Refunded", message: "Refund completed (simulated).", kind: "success" });
    }, 1200);
  };

  const openDispute = () => {
    const reason = prompt("Dispute reason (example: service not delivered)")?.trim();
    if (!reason) return;
    const note = prompt("Add details (optional)")?.trim() || "";
    const attachmentName = prompt("Attachment name (optional)")?.trim() || "";

    const d: Dispute = {
      id: `DSP-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
      reason,
      note,
      attachmentName: attachmentName || undefined,
      status: "Open",
    };

    setDispute(d);
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), title: "Dispute opened", detail: `Dispute ${d.id} opened.`, by: "You" },
    ]);
    toast({ title: "Dispute opened", message: d.id, kind: "info" });
  };

  // Visitor modal
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitorDraft, setVisitorDraft] = useState<{ name: string; phone: string }>({ name: "", phone: "" });

  const addVisitor = () => {
    if (!visitorDraft.name.trim() || !visitorDraft.phone.trim()) {
      toast({ title: "Missing", message: "Visitor name and phone are required.", kind: "warn" });
      return;
    }
    const v: Passenger = {
      id: uid("vis"),
      name: visitorDraft.name.trim(),
      phone: visitorDraft.phone.trim(),
      type: "Visitor",
      group: "Operations",
      defaultCostCenter: "OPS-01",
    };
    setPassengers((p) => [v, ...p]);
    setBeneficiaryId(v.id);
    setVisitorDraft({ name: "", phone: "" });
    setVisitorOpen(false);
    toast({ title: "Added", message: "Visitor added.", kind: "success" });
  };

  // Step validation
  const serviceOk = !!serviceId;
  const beneficiaryOk = !!beneficiaryId;
  const requirementsOk = useMemo(() => {
    if (paymentMethod !== "CorporatePay") return true;
    if (!costCenter.trim()) return false;
    if (service.purposeRequired && !purpose.trim()) return false;
    if (service.notesRequired && notes.trim().length < 10) return false;
    if (service.requiredAttachments.length && attachments.length === 0) return false;
    return true;
  }, [paymentMethod, costCenter, service.purposeRequired, purpose, service.notesRequired, notes, service.requiredAttachments.length, attachments.length]);

  const paymentOk = useMemo(() => {
    if (paymentMethod !== "CorporatePay") return true;
    return corporateState !== "Not available";
  }, [paymentMethod, corporateState]);

  const canContinue = useMemo(() => {
    if (step === "service") return serviceOk;
    if (step === "beneficiary") return beneficiaryOk;
    if (step === "requirements") return requirementsOk;
    if (step === "payment") return paymentOk && requirementsOk;
    if (step === "review") return true;
    return true;
  }, [step, serviceOk, beneficiaryOk, requirementsOk, paymentOk]);

  const nextStep = (s: Step): Step => (s === "service" ? "beneficiary" : s === "beneficiary" ? "requirements" : s === "requirements" ? "payment" : s === "payment" ? "review" : s === "review" ? "status" : "status");
  const prevStep = (s: Step): Step => (s === "status" ? "review" : s === "review" ? "payment" : s === "payment" ? "requirements" : s === "requirements" ? "beneficiary" : s === "beneficiary" ? "service" : "service");

  const onContinue = () => {
    if (!canContinue) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }
    setStep(nextStep(step));
  };

  const onBack = () => setStep(prevStep(step));

  // Payment cards
  const paymentCards = useMemo(
    () => [
      { id: "CorporatePay" as const, title: "CorporatePay", sub: "Company-paid with policy and approvals", icon: <Building2 className="h-5 w-5" /> },
      { id: "Personal Wallet" as const, title: "Personal Wallet", sub: "Pay from your personal EVzone wallet", icon: <Wallet className="h-5 w-5" /> },
      { id: "Card" as const, title: "Card", sub: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
      { id: "Mobile Money" as const, title: "Mobile Money", sub: "MTN/Airtel", icon: <PhoneSvg className="h-5 w-5" /> },
    ],
    []
  );

  // Template helpers
  const applyTemplate = (tpl: "Travel" | "Medical" | "Workspace" | "Training") => {
    const map: Record<string, { purpose: string; note: string }> = {
      Travel: { purpose: "Travel", note: "Travel booking for business trip. Attach itinerary or invitation." },
      Medical: { purpose: "Medical", note: "Medical booking for business purpose. Attach doctor letter if applicable." },
      Workspace: { purpose: "Workspace", note: "Meeting room booking for business meeting. Add agenda if available." },
      Training: { purpose: "Training", note: "Training enrollment for employee upskilling." },
    };
    setPurpose(map[tpl].purpose);
    setNotes((prev) => (prev.trim().length >= 10 ? prev : map[tpl].note));
    toast({ title: "Template applied", message: tpl, kind: "success" });
  };

  const headerPills = (
    <div className="flex flex-wrap items-center gap-2">
      <Pill label={`Role: ${role}`} tone={isCoordinator ? "info" : "neutral"} />
      <Pill label={`Module: ${service.module}`} tone="neutral" />
      <Pill label={`Vendor: ${vendor.name}`} tone={vendor.status === "Preferred" ? "info" : vendor.status === "Approved" ? "good" : "warn"} />
      <Pill label={`Amount: ${formatUGX(amountUGX)}`} tone="neutral" />
      <Pill label={`Pay: ${paymentMethod}`} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
    </div>
  );

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
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Service booking checkout with CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">One checkout experience across Health, Travel, School, Workspace, and more.</div>
                  <div className="mt-2">{headerPills}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["Employee", "Coordinator"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      toast({ title: "Role", message: r, kind: "info" });
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                      role === r ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    )}
                    style={role === r ? { background: EVZ.green } : undefined}
                  >
                    {r}
                  </button>
                ))}
                <Button variant="outline" onClick={() => toast({ title: "CorporatePay Hub", message: "Open U1 (demo).", kind: "info" })}>
                  <Sparkles className="h-4 w-4" /> Hub
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open U3 (demo).", kind: "info" })}>
                  <ShieldCheck className="h-4 w-4" /> Policies
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Stepper step={step} setStep={setStep} />
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                {step === "service" ? (
                  <>
                    <Section
                      title="Choose module and service"
                      subtitle="Select a service and schedule. Policy requirements update automatically."
                      right={<Pill label="Core" tone="neutral" />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Service module</div>
                          <select
                            value={module}
                            onChange={(e) => setModule(e.target.value as ServiceModule)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            {modules.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Service</div>
                          <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            {services
                              .filter((s) => s.module === module)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Vendor</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{vendor.name}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Pill label={vendor.status} tone={vendor.status === "Preferred" ? "info" : vendor.status === "Approved" ? "good" : "warn"} />
                            <Pill label={`Confirm SLA ${vendor.slaConfirmMins}m`} tone="neutral" />
                            <Pill label={`Delivery SLA ${vendor.slaDeliveryHrs}h`} tone="neutral" />
                          </div>
                          {vendor.notes ? <div className="mt-2 text-xs text-slate-500">{vendor.notes}</div> : null}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Price</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(amountUGX)}</div>
                          <div className="mt-2 text-xs text-slate-600">Base: {formatUGX(service.basePriceUGX)} • Category: {service.category}</div>
                          <div className="mt-2 text-xs text-slate-600">Location: {service.locationHint}</div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Schedule</div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                            />
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                            />
                          </div>
                          <div className="mt-2 text-xs text-slate-500">Scheduled: {fmtDateTime(scheduledAt)}</div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Policy-driven fields vary by module. Travel and Medical typically require purpose and supporting documents.
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "beneficiary" ? (
                  <Section
                    title="Beneficiary"
                    subtitle={isCoordinator ? "Book for yourself, employees, or visitors" : "Self booking"}
                    right={<Pill label={isCoordinator ? "Premium" : "Core"} tone={isCoordinator ? "info" : "neutral"} />}
                  >
                    <div className="space-y-2">
                      {passengers
                        .filter((p) => (isCoordinator ? true : p.type === "Self"))
                        .map((p) => {
                          const active = p.id === beneficiaryId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setBeneficiaryId(p.id);
                                toast({ title: "Beneficiary", message: p.name, kind: "info" });
                              }}
                              className={cn(
                                "w-full rounded-3xl border p-4 text-left shadow-sm transition hover:bg-slate-50",
                                active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                                    <Pill label={p.type} tone={p.type === "Visitor" ? "warn" : "neutral"} />
                                    {p.group ? <Pill label={p.group} tone="neutral" /> : null}
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">{p.phone}</div>
                                  <div className="mt-2 text-xs text-slate-500">Default cost center: {p.defaultCostCenter || "-"}</div>
                                </div>
                                {active ? <Check className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    {isCoordinator ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => setVisitorOpen(true)}>
                          <Plus className="h-4 w-4" /> Add visitor
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toast({ title: "Bulk booking", message: "Premium bulk booking can reuse U15 style manifest (optional).", kind: "info" })}
                        >
                          <Users className="h-4 w-4" /> Bulk booking
                        </Button>
                      </div>
                    ) : null}

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      Book-for-others is premium and always audited.
                    </div>
                  </Section>
                ) : null}

                {step === "requirements" ? (
                  <>
                    <Section
                      title="Policy requirements"
                      subtitle="Purpose, cost center, and attachments are enforced by policy"
                      right={<Pill label={paymentMethod === "CorporatePay" ? "Corporate" : "Personal"} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Cost center</div>
                          <select
                            value={costCenter}
                            onChange={(e) => setCostCenter(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              costCenter.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                          >
                            <option value="">Select</option>
                            {costCenters.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          {!costCenter.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Purpose tag</div>
                          <div className="mt-1 text-xs text-slate-500">{service.purposeRequired ? "Required" : "Optional"}</div>
                          <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              service.purposeRequired && !purpose.trim() ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          >
                            <option value="">Select</option>
                            {purposeTags.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          {service.purposeRequired && !purpose.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label="Templates" tone="info" />
                            <button
                              type="button"
                              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                              onClick={() => applyTemplate("Travel")}
                            >
                              Travel
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                              onClick={() => applyTemplate("Medical")}
                            >
                              Medical
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                              onClick={() => applyTemplate("Workspace")}
                            >
                              Workspace
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                              onClick={() => applyTemplate("Training")}
                            >
                              Training
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">Notes</div>
                          <div className="mt-1 text-xs text-slate-500">{service.notesRequired ? "Required (min 10 chars)" : "Optional"}</div>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Add context for approvals and audits"
                            className={cn(
                              "mt-2 w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
                              service.notesRequired && notes.trim().length < 10 ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          />
                          {service.notesRequired && notes.trim().length < 10 ? <div className="mt-1 text-xs font-semibold text-amber-700">Add more detail</div> : null}
                        </div>
                      </div>
                    </Section>

                    <Section
                      title="Attachments"
                      subtitle="Policy-driven: doctor letter, itinerary, permission letter, agenda, etc."
                      right={<Pill label={service.requiredAttachments.length ? "Required" : "Optional"} tone={service.requiredAttachments.length ? "warn" : "neutral"} />}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => addAttachmentFiles(e.target.files)}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => fileRef.current?.click()}>
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                        <Button variant="outline" onClick={addAttachmentName}>
                          <Paperclip className="h-4 w-4" /> Add name
                        </Button>
                        <Pill label={`${attachments.length} file(s)`} tone={attachments.length ? "good" : service.requiredAttachments.length ? "warn" : "neutral"} />
                      </div>

                      {service.requiredAttachments.length ? (
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Required: <span className="font-semibold">{service.requiredAttachments.join(", ")}</span>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No required attachments for this service.</div>
                      )}

                      <div className="mt-3 space-y-2">
                        {attachments.map((a) => (
                          <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{a.type || "unknown"} • {formatBytes(a.size)} • {timeAgo(a.ts)}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                              <Trash2 className="h-4 w-4" /> Remove
                            </Button>
                          </div>
                        ))}
                        {!attachments.length ? (
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments added.</div>
                        ) : null}
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "payment" ? (
                  <>
                    <Section
                      title="Payment"
                      subtitle="CorporatePay appears as a payment option when eligible"
                      right={<Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />}
                    >
                      <div className="space-y-2">
                        {paymentCards.map((m) => {
                          const selected = paymentMethod === m.id;
                          const isCorp = m.id === "CorporatePay";
                          const disabled = isCorp && corporateState === "Not available";

                          const badges = isCorp
                            ? [
                              { label: corporateState, tone: corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad" },
                              ...(corporateStatus === "Billing delinquency" && graceActive ? [{ label: `Grace ${msToFriendly(graceMs)}`, tone: "warn" }] : []),
                            ]
                            : [];

                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                if (disabled) {
                                  toast({ title: "Unavailable", message: "CorporatePay is not available. Choose another method.", kind: "warn" });
                                  return;
                                }
                                setPaymentMethod(m.id);
                                toast({ title: "Payment selected", message: m.title, kind: "success" });
                              }}
                              className={cn(
                                "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                                selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                                disabled && "cursor-not-allowed opacity-60"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
                                    {m.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                                      {badges.map((b) => (
                                        <Pill key={`${m.id}-${b.label}`} label={b.label} tone={b.tone as any} />
                                      ))}
                                      {selected ? <Pill label="Selected" tone="info" /> : null}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600">{m.sub}</div>
                                  </div>
                                </div>
                                <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                                  {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                </div>
                              </div>

                              {isCorp ? (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                  {corporateState === "Not available"
                                    ? "CorporatePay is unavailable due to policy or funding. Use personal payment or contact admin."
                                    : corporateState === "Requires approval"
                                      ? `Approval may be required above ${formatUGX(service.approvalThresholdUGX)}.`
                                      : "CorporatePay is available for this booking."}
                                </div>
                              ) : (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">Personal payment does not require corporate approvals.</div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {paymentMethod === "CorporatePay" ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Corporate program status</div>
                              <div className="mt-1 text-xs text-slate-500">Demo control</div>
                            </div>
                            <Pill label={corporateStatus} tone={corporateStatus === "Eligible" ? "good" : graceActive ? "warn" : "bad"} />
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
                            If CorporatePay is unavailable due to funding, show enforcement screens (U14).
                          </div>
                        </div>
                      ) : null}
                    </Section>

                    <Section title="SLA and dispute automation" subtitle="Premium: SLA tracking + dispute automation hooks" right={<Pill label="Premium" tone="info" />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">SLA timers</div>
                              <div className="mt-1 text-xs text-slate-500">Shown after booking</div>
                            </div>
                            <Timer className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              Confirm due: <span className="font-semibold">{msToFriendly(confirmMs)}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              Delivery due: <span className="font-semibold">{msToFriendly(deliveryMs)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Auto dispute hook</div>
                              <div className="mt-1 text-xs text-slate-500">Create dispute if SLA breached</div>
                            </div>
                            <button
                              type="button"
                              className={cn("relative h-7 w-12 rounded-full border transition", autoDisputeEnabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                              onClick={() => setAutoDisputeEnabled((v) => !v)}
                              aria-label="Toggle auto dispute"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", autoDisputeEnabled ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: dispute automation hooks can open a ticket when vendor SLA breaches.
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "review" ? (
                  <>
                    <Section
                      title="Policy check"
                      subtitle="Explains if the booking is allowed, needs approval, or blocked"
                      right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                    >
                      <div
                        className={cn(
                          "rounded-3xl border p-4",
                          policy.outcome === "Allowed"
                            ? "border-emerald-200 bg-emerald-50"
                            : policy.outcome === "Approval required"
                              ? "border-amber-200 bg-amber-50"
                              : "border-rose-200 bg-rose-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {policy.outcome === "Allowed" ? "Allowed" : policy.outcome === "Approval required" ? "Approval required" : "Blocked"}
                            </div>
                            <div className="mt-1 text-sm text-slate-700">
                              {policy.outcome === "Allowed"
                                ? "You can confirm this booking now."
                                : policy.outcome === "Approval required"
                                  ? "Submit for approval before booking is processed."
                                  : "Fix required items or switch to personal payment."}
                            </div>
                          </div>
                          <div className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            policy.outcome === "Allowed" ? "bg-emerald-100 text-emerald-800" : policy.outcome === "Approval required" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"
                          )}>
                            {policy.outcome === "Allowed" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {policy.reasons.map((r) => (
                            <div key={`${r.code}-${r.title}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={r.code} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                  </div>
                                  <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {policy.outcome === "Allowed" ? (
                            <Button variant="primary" onClick={confirmBooking}>
                              <ChevronRight className="h-4 w-4" /> Confirm booking
                            </Button>
                          ) : null}

                          {policy.outcome === "Approval required" ? (
                            <Button variant="primary" onClick={submitForApproval}>
                              <FileText className="h-4 w-4" /> Submit for approval
                            </Button>
                          ) : null}

                          {policy.outcome === "Blocked" ? (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPaymentMethod("Personal Wallet");
                                toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" });
                              }}
                            >
                              <Wallet className="h-4 w-4" /> Pay personally
                            </Button>
                          ) : null}

                          <Button variant="outline" onClick={() => toast({ title: "Exception", message: "Open exception request.", kind: "info" })}>
                            <AlertTriangle className="h-4 w-4" /> Request exception
                          </Button>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          Receipts, cancellations, refunds, and disputes are tracked in the Status step.
                        </div>
                      </div>
                    </Section>

                    <Section title="Service policies" subtitle="Cancellation and refunds" right={<Pill label="Core" tone="neutral" />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Cancellation policy</div>
                          <div className="mt-2 text-sm text-slate-600">{service.cancellationPolicy}</div>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Refund policy</div>
                          <div className="mt-2 text-sm text-slate-600">{service.refundPolicy}</div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "status" ? (
                  <>
                    <Section
                      title="Status and receipt"
                      subtitle="Track booking status, cancellations, refunds, and disputes"
                      right={<Pill label={bookingState} tone={bookingState === "Completed" || bookingState === "Confirmed" ? "good" : bookingState === "SLA breached" ? "bad" : bookingState.includes("Pending") ? "warn" : "neutral"} />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Timeline</div>
                              <div className="mt-1 text-xs text-slate-500">Submitted → confirmed → completed</div>
                            </div>
                            <Timer className="h-5 w-5 text-slate-400" />
                          </div>

                          <div className="mt-3 space-y-2">
                            {timeline
                              .slice()
                              .sort((a, b) => b.ts - a.ts)
                              .map((t) => (
                                <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                      <div className="mt-1 text-xs text-slate-500">{fmtDateTime(t.ts)} • {timeAgo(t.ts)} • {t.by}</div>
                                      <div className="mt-2 text-sm text-slate-700">{t.detail}</div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                  </div>
                                </div>
                              ))}

                            {!timeline.length ? (
                              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                                No status yet. Confirm booking or submit for approval.
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button variant="outline" onClick={simulateConfirm} disabled={bookingState !== "Pending confirmation"}>
                              <BadgeCheck className="h-4 w-4" /> Simulate confirm
                            </Button>
                            <Button variant="outline" onClick={simulateComplete} disabled={bookingState !== "Confirmed" && bookingState !== "In progress"}>
                              <ChevronRight className="h-4 w-4" /> Simulate complete
                            </Button>
                            <Button variant="outline" onClick={simulateBreach}>
                              <AlertTriangle className="h-4 w-4" /> Simulate SLA breach
                            </Button>
                            <Button variant="danger" onClick={cancelBooking} disabled={bookingState === "Cancelled" || bookingState === "Refund processing" || bookingState === "Refunded" || bookingState === "Completed"}>
                              <Trash2 className="h-4 w-4" /> Cancel
                            </Button>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: dispute automation hook is available if vendor SLA breaches.
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Receipt</div>
                              <div className="mt-1 text-xs text-slate-500">Corporate receipt per booking</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <ReceiptSvg className="h-5 w-5" />
                            </div>
                          </div>

                          {receipt ? (
                            <div className="mt-3 space-y-3">
                              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={receipt.corporate ? "CorporatePay" : "Personal"} tone={receipt.corporate ? "info" : "neutral"} />
                                  <Pill label={receipt.module} tone="neutral" />
                                  <Pill label={receipt.receiptId} tone="neutral" />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{receipt.serviceTitle}</div>
                                <div className="mt-1 text-sm text-slate-600">Vendor: {receipt.vendorName}</div>
                                <div className="mt-2 text-xs text-slate-500">Scheduled: {fmtDateTime(receipt.scheduledAt)}</div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <InfoCell label="Beneficiary" value={receipt.beneficiary} />
                                  <InfoCell label="Amount" value={formatUGX(receipt.amountUGX)} />
                                  <InfoCell label="Cost center" value={receipt.costCenter || "-"} />
                                  <InfoCell label="Purpose" value={receipt.purpose || "-"} />
                                </div>
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                  Attachments: {receipt.attachmentsCount}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(receipt.receiptId);
                                      toast({ title: "Copied", message: "Receipt ID copied.", kind: "success" });
                                    } catch {
                                      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                    }
                                  }}
                                >
                                  <Copy className="h-4 w-4" /> Copy ID
                                </Button>
                                <Button variant="outline" onClick={() => exportReceiptToPrint(receipt)}>
                                  <Download className="h-4 w-4" /> Export PDF
                                </Button>
                                <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 Corporate Receipts (demo).", kind: "info" })}>
                                  <ReceiptSvg className="h-4 w-4" /> View receipts
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                              No receipt yet. Confirm booking to generate receipt.
                            </div>
                          )}

                          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Disputes</div>
                                <div className="mt-1 text-xs text-slate-500">Premium: dispute automation hooks</div>
                              </div>
                              <Pill label={dispute ? dispute.status : "None"} tone={dispute ? (dispute.status === "Resolved" ? "good" : "warn") : "neutral"} />
                            </div>
                            {dispute ? (
                              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                                <div className="font-semibold text-slate-900">{dispute.id}</div>
                                <div className="mt-1">{dispute.reason}</div>
                                {dispute.attachmentName ? <div className="mt-1 text-xs text-slate-500">Attachment: {dispute.attachmentName}</div> : null}
                                <div className="mt-1 text-xs text-slate-500">Opened {timeAgo(dispute.createdAt)}</div>
                              </div>
                            ) : (
                              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">No disputes.</div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={openDispute}>
                                <LifeBuoy className="h-4 w-4" /> Open dispute
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (!dispute) {
                                    toast({ title: "No dispute", message: "Open a dispute first.", kind: "info" });
                                    return;
                                  }
                                  setDispute((p) => (p ? { ...p, status: "Resolved" } : p));
                                  toast({ title: "Resolved", message: "Dispute resolved (simulated).", kind: "success" });
                                }}
                              >
                                <BadgeCheck className="h-4 w-4" /> Mark resolved
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                        Service status and receipts are also visible to your organization admins in CorporatePay.
                      </div>
                    </Section>
                  </>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Summary" subtitle="Live checkout summary" right={<Pill label={formatUGX(amountUGX)} tone="neutral" />}>
                  <div className="space-y-2">
                    <InfoRow label="Module" value={service.module} />
                    <InfoRow label="Service" value={service.title} />
                    <InfoRow label="Vendor" value={`${vendor.name} (${vendor.status})`} emphasize={vendor.status === "Restricted"} />
                    <InfoRow label="Schedule" value={fmtDateTime(scheduledAt)} />
                    <InfoRow label="Beneficiary" value={`${beneficiary.name} (${beneficiary.type})`} emphasize={isCoordinator && beneficiary.type !== "Self"} />
                    <InfoRow label="Payment" value={paymentMethod} emphasize={paymentMethod === "CorporatePay"} />
                    {paymentMethod === "CorporatePay" ? (
                      <>
                        <InfoRow label="Corporate state" value={corporateState} emphasize={corporateState !== "Available"} />
                        <InfoRow label="Cost center" value={costCenter || "Required"} emphasize={!costCenter.trim()} />
                        <InfoRow label="Purpose" value={purpose || (service.purposeRequired ? "Required" : "Optional")} emphasize={service.purposeRequired && !purpose.trim()} />
                        <InfoRow label="Attachments" value={`${attachments.length}`} emphasize={service.requiredAttachments.length > 0 && attachments.length === 0} />
                      </>
                    ) : null}
                    <InfoRow label="Policy outcome" value={policy.outcome} emphasize={policy.outcome !== "Allowed"} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Tip: attach supporting documents to reduce approval rework.
                  </div>
                </Section>

                <Section title="SLA tracking" subtitle="Premium" right={<Pill label="Premium" tone="info" />}>
                  <div className="grid grid-cols-1 gap-2">
                    <MiniKPI label="Confirm SLA" value={`${vendor.slaConfirmMins} min`} icon={<Timer className="h-4 w-4" />} />
                    <MiniKPI label="Delivery SLA" value={`${vendor.slaDeliveryHrs} hr`} icon={<CalendarClock className="h-4 w-4" />} />
                    <MiniKPI label="Confirm due" value={msToFriendly(confirmMs)} icon={<Timer className="h-4 w-4" />} />
                    <MiniKPI label="Delivery due" value={msToFriendly(deliveryMs)} icon={<CalendarClock className="h-4 w-4" />} />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Premium: dispute automation can open a case if SLA breaches.
                  </div>
                </Section>

                <Section title="Quick links" subtitle="Common next pages" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => toast({ title: "My Requests", message: "Open U5 (demo).", kind: "info" })}>
                      <FileText className="h-4 w-4" /> My Requests
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 (demo).", kind: "info" })}>
                      <ReceiptSvg className="h-4 w-4" /> Receipts
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Corporate status", message: "Open U4 (demo).", kind: "info" })}>
                      <Wallet className="h-4 w-4" /> Corporate status
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Support", message: "Open support flow (U14/AA).", kind: "info" })}>
                      <LifeBuoy className="h-4 w-4" /> Support
                    </Button>
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky bottom bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={`Amount: ${formatUGX(amountUGX)}`} tone="neutral" />
                  <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                  {step === "payment" && paymentMethod === "CorporatePay" ? <Pill label={requirementsOk ? "Requirements OK" : "Requirements missing"} tone={requirementsOk ? "good" : "warn"} /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={onBack} disabled={step === "service"}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>

                  {step !== "status" ? (
                    <Button variant={canContinue ? "primary" : "outline"} onClick={onContinue} disabled={!canContinue}>
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setStep("review")}>
                      <ChevronRight className="h-4 w-4 rotate-180" /> Back to review
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U18 Service Booking Checkout: CorporatePay option, policy-driven fields (purpose, cost center, attachments), receipts and status, cancellations/refunds, and premium SLA + dispute automation hooks.
            </div>
          </div>
        </div>
      </div>

      {/* Visitor modal */}
      <Modal
        open={visitorOpen}
        title="Add visitor"
        subtitle="Premium: book for visitors"
        onClose={() => setVisitorOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setVisitorOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addVisitor}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        }
        maxW="760px"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Name</div>
            <input
              value={visitorDraft.name}
              onChange={(e) => setVisitorDraft((p) => ({ ...p, name: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Visitor name"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Phone</div>
            <input
              value={visitorDraft.phone}
              onChange={(e) => setVisitorDraft((p) => ({ ...p, phone: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="+256..."
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            Visitor bookings are auditable. In production, a link can be sent by WhatsApp/SMS.
          </div>
        </div>
      </Modal>
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

function MiniKPI({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function ReceiptSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 7.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 11h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhoneSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.5 3.5h9A2.5 2.5 0 0 1 19 6v12a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6A2.5 2.5 0 0 1 7.5 3.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 6.8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18.3h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
