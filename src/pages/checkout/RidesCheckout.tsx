import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Copy,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Package,
  Phone,
  Plus,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
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

type Step = "ride" | "passenger" | "payment" | "review";

type Role = "Employee" | "Travel Coordinator";

type RideCategory = "Standard" | "Premium";

type Region = "Kampala" | "Entebbe" | "Jinja" | "Other";

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

type Shortcut = {
  id: string;
  title: string;
  subtitle: string;
  pickup: string;
  destination: string;
  region: Region;
  approved: boolean;
  defaultPurpose?: string;
  fares: { Standard: number; Premium: number };
};

type PolicyReasonCode =
  | "PROGRAM"
  | "GEO"
  | "TIME"
  | "PURPOSE"
  | "COSTCENTER"
  | "CATEGORY"
  | "THRESHOLD"
  | "LIMIT"
  | "OK";

type PolicyReason = { code: PolicyReasonCode; title: string; detail: string };

type Alternative = {
  id: string;
  title: string;
  desc: string;
  expected: Outcome;
  icon: React.ReactNode;
  patch: Partial<StatePatch>;
};

type CoachTip = {
  id: string;
  title: string;
  desc: string;
  patch?: Partial<StatePatch>;
};

type StatePatch = {
  paymentMethod: PaymentMethod;
  rideCategory: RideCategory;
  region: Region;
  scheduleMode: "Now" | "Schedule";
  timeHHMM: string;
  selectedShortcutId: string;
  pickup: string;
  destination: string;
  purpose: string;
  costCenter: string;
};

type ExceptionDraft = {
  reason: string;
  note: string;
  attachmentName: string;
};

type BulkItem = {
  id: string;
  passengerName: string;
  phone: string;
  routeId: string;
  timeHHMM: string;
  rideCategory: RideCategory;
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

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    warn: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    bad: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-300",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
}

function toneForProgram(p: CorporateProgramStatus, graceActive: boolean) {
  if (p === "Eligible") return "good" as const;
  if (p === "Billing delinquency" && graceActive) return "warn" as const;
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

function SegButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
        active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
      style={active ? { background: EVZ.green } : undefined}
      onClick={onClick}
    >
      {label}
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

function Stepper({ step, setStep, disabled }: { step: Step; setStep: (s: Step) => void; disabled?: boolean }) {
  const steps: Array<{ k: Step; label: string }> = [
    { k: "ride", label: "Ride" },
    { k: "passenger", label: "Passenger" },
    { k: "payment", label: "Payment" },
    { k: "review", label: "Review" },
  ];

  const idx = steps.findIndex((s) => s.k === step);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const active = s.k === step;
          const done = i < idx;
          return (
            <button
              key={s.k}
              type="button"
              onClick={() => setStep(s.k)}
              disabled={disabled}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                active
                  ? "border-emerald-300 bg-emerald-50"
                  : done
                  ? "border-slate-200 bg-white hover:bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
                disabled && "cursor-not-allowed opacity-70"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Step {i + 1}</div>
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

function PaymentCard({
  id,
  title,
  subtitle,
  icon,
  selected,
  disabled,
  badges,
  foot,
  onSelect,
}: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  badges?: Array<{ label: string; tone?: any }>;
  foot?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
        selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              {badges?.map((b) => (
                <Pill key={`${id}-${b.label}`} label={b.label} tone={b.tone} />
              ))}
            </div>
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          </div>
        </div>
        <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
          {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
        </div>
      </div>
      {foot ? <div className="mt-3">{foot}</div> : null}
    </button>
  );
}

function evaluateRidePolicy(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  region: Region;
  timeHHMM: string;
  rideCategory: RideCategory;
  amountUGX: number;
  approvalThresholdUGX: number;
  perTripLimitUGX: number;
  purposeRequired: boolean;
  costCenterRequired: boolean;
  purpose: string;
  costCenter: string;
}): { outcome: Outcome; reasons: PolicyReason[]; alternatives: Alternative[]; coach: CoachTip[] } {
  const {
    paymentMethod,
    corporateStatus,
    graceActive,
    region,
    timeHHMM,
    rideCategory,
    amountUGX,
    approvalThresholdUGX,
    perTripLimitUGX,
    purposeRequired,
    costCenterRequired,
    purpose,
    costCenter,
  } = args;

  const reasons: PolicyReason[] = [];
  const alternatives: Alternative[] = [];
  const coach: CoachTip[] = [];

  const withinHours = (hhmm: string, start: string, end: string) => hhmm >= start && hhmm <= end;

  // Personal payment bypasses corporate policy
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
    coach.push({ id: "coach-personal", title: "Use CorporatePay for business expenses", desc: "CorporatePay generates corporate receipts and helps your org track spend." });
    return {
      outcome: "Allowed",
      reasons,
      alternatives: [
        {
          id: "alt-corp",
          title: "Switch back to CorporatePay",
          desc: "Use CorporatePay for business spend when eligible.",
          expected: "Approval required",
          icon: <Building2 className="h-4 w-4" />,
          patch: { paymentMethod: "CorporatePay" },
        },
      ],
      coach,
    };
  }

  // Corporate program enforcement
  if (corporateStatus === "Not linked") {
    reasons.push({ code: "PROGRAM", title: "Not linked to an organization", detail: "CorporatePay is only available when you are linked to an organization." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal wallet, card, or mobile money.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Not eligible") {
    reasons.push({ code: "PROGRAM", title: "Not eligible under policy", detail: "Your role or group is not eligible for CorporatePay in this module." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment now.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Deposit depleted") {
    reasons.push({ code: "PROGRAM", title: "Deposit depleted", detail: "Prepaid deposit is depleted. CorporatePay is a hard stop until your admin tops up." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <CreditCard className="h-4 w-4" />,
      patch: { paymentMethod: "Card" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Credit limit exceeded") {
    reasons.push({ code: "PROGRAM", title: "Credit limit exceeded", detail: "Corporate credit limit is exceeded. CorporatePay is paused until repayment or admin adjustment." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Billing delinquency" && !graceActive) {
    reasons.push({ code: "PROGRAM", title: "Billing delinquency", detail: "CorporatePay is suspended due to billing delinquency. Ask admin to resolve invoices." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <CreditCard className="h-4 w-4" />,
      patch: { paymentMethod: "Card" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace window is active. CorporatePay may proceed." });
    coach.push({ id: "coach-grace", title: "Use CorporatePay while grace is active", desc: "Grace windows can end unexpectedly when agreements require enforcement." });
  }

  // Required fields
  if (purposeRequired && !purpose.trim()) {
    reasons.push({ code: "PURPOSE", title: "Purpose required", detail: "Purpose tag is required for corporate rides." });
    alternatives.push({
      id: "alt-purpose",
      title: "Add purpose tag",
      desc: "Select a purpose like Airport, Client meeting, or Office commute.",
      expected: "Allowed",
      icon: <ClipboardCheck className="h-4 w-4" />,
      patch: { purpose: "Client meeting" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (costCenterRequired && !costCenter.trim()) {
    reasons.push({ code: "COSTCENTER", title: "Cost center required", detail: "Cost center is required for billing allocation." });
    alternatives.push({
      id: "alt-cc",
      title: "Select cost center",
      desc: "Pick the cost center assigned by your organization.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { costCenter: "OPS-01" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  // Geo and time
  if (!(region === "Kampala" || region === "Entebbe")) {
    reasons.push({ code: "GEO", title: "Geo restriction", detail: "Corporate rides are limited to approved regions (Kampala and Entebbe)." });
    alternatives.push({
      id: "alt-geo",
      title: "Use approved region",
      desc: "Switch the service region to Kampala or Entebbe.",
      expected: "Allowed",
      icon: <MapPin className="h-4 w-4" />,
      patch: { region: "Kampala" },
    });
  }

  if (!withinHours(timeHHMM, "06:00", "22:00")) {
    reasons.push({ code: "TIME", title: "Outside allowed hours", detail: "Corporate rides are allowed between 06:00 and 22:00." });
    alternatives.push({
      id: "alt-time",
      title: "Schedule within allowed hours",
      desc: "Choose a time between 06:00 and 22:00.",
      expected: "Allowed",
      icon: <Timer className="h-4 w-4" />,
      patch: { timeHHMM: "09:00" },
    });
  }

  // Limits
  if (amountUGX > perTripLimitUGX) {
    reasons.push({ code: "LIMIT", title: "Per-trip limit exceeded", detail: `This ride exceeds the per-trip corporate limit (${formatUGX(perTripLimitUGX)}).` });
    alternatives.push({
      id: "alt-reduce",
      title: "Reduce amount",
      desc: "Use Standard category or adjust route to reduce cost.",
      expected: "Approval required",
      icon: <Route className="h-4 w-4" />,
      patch: { rideCategory: "Standard" },
    });
  }

  // Approval threshold
  if (rideCategory === "Premium" && amountUGX > approvalThresholdUGX) {
    reasons.push({ code: "THRESHOLD", title: "Approval required", detail: `Premium rides above ${formatUGX(approvalThresholdUGX)} require approval.` });
    alternatives.push({
      id: "alt-standard",
      title: "Switch to Standard",
      desc: "Standard rides usually avoid approvals.",
      expected: "Allowed",
      icon: <Route className="h-4 w-4" />,
      patch: { rideCategory: "Standard" },
    });
  }

  // Coach suggestions
  coach.push({ id: "coach-1", title: "Approved route shortcuts", desc: "Use office or airport approved routes for smoother approvals.", patch: { selectedShortcutId: "office_airport" } });
  coach.push({ id: "coach-2", title: "Standard rides are faster", desc: "Standard rides reduce approval overhead.", patch: { rideCategory: "Standard" } });

  // Alternatives always include pay personal
  alternatives.push({
    id: "alt-personal",
    title: "Pay personally",
    desc: "Proceed immediately using personal payment.",
    expected: "Allowed",
    icon: <Wallet className="h-4 w-4" />,
    patch: { paymentMethod: "Personal Wallet" },
  });

  // Decide outcome
  const hasHard = reasons.some((r) => ["GEO", "TIME", "LIMIT"].includes(r.code));
  const needsApproval = reasons.some((r) => r.code === "THRESHOLD") || reasons.some((r) => r.code === "LIMIT");

  if (hasHard) return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };
  if (needsApproval) return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };

  reasons.push({ code: "OK", title: "Within policy", detail: "This corporate ride is within region, hours, and thresholds." });
  return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
}

function dedupeAlts(list: Alternative[]) {
  const seen = new Set<string>();
  const out: Alternative[] = [];
  for (const a of list) {
    const key = `${a.title}|${JSON.stringify(a.patch)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 6);
}

export default function UserRideCheckoutCorporatePayU15() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [step, setStep] = useState<Step>("ride");

  // Demo permission
  const [role, setRole] = useState<Role>("Employee");
  const isCoordinator = role === "Travel Coordinator";

  // CorporatePay eligibility/enforcement (demo inputs)
  const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
  const [graceEnabled, setGraceEnabled] = useState(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 3 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const graceMs = graceEndAt - nowTick;
  const graceActive = corporateStatus === "Billing delinquency" && graceEnabled && graceMs > 0;

  const [approvalThresholdUGX, setApprovalThresholdUGX] = useState<number>(200000);
  const [perTripLimitUGX, setPerTripLimitUGX] = useState<number>(600000);

  // Ride details
  const shortcuts: Shortcut[] = useMemo(
    () => [
      {
        id: "office_airport",
        title: "Office to Airport",
        subtitle: "Approved route shortcut",
        pickup: "Acme HQ, Kampala",
        destination: "Entebbe Airport",
        region: "Entebbe",
        approved: true,
        defaultPurpose: "Airport",
        fares: { Standard: 170000, Premium: 240000 },
      },
      {
        id: "home_office",
        title: "Home to Office",
        subtitle: "Approved commute",
        pickup: "Home",
        destination: "Acme HQ, Kampala",
        region: "Kampala",
        approved: true,
        defaultPurpose: "Office commute",
        fares: { Standard: 60000, Premium: 90000 },
      },
      {
        id: "office_client",
        title: "Office to Client",
        subtitle: "Standard business trip",
        pickup: "Acme HQ, Kampala",
        destination: "Client Site, Kampala",
        region: "Kampala",
        approved: true,
        defaultPurpose: "Client meeting",
        fares: { Standard: 90000, Premium: 140000 },
      },
    ],
    []
  );

  const [selectedShortcutId, setSelectedShortcutId] = useState<string>(shortcuts[0].id);
  const selectedShortcut = useMemo(() => shortcuts.find((s) => s.id === selectedShortcutId) || shortcuts[0], [shortcuts, selectedShortcutId]);

  const [pickup, setPickup] = useState<string>(selectedShortcut.pickup);
  const [destination, setDestination] = useState<string>(selectedShortcut.destination);
  const [region, setRegion] = useState<Region>(selectedShortcut.region);
  const [rideCategory, setRideCategory] = useState<RideCategory>("Premium");

  const [scheduleMode, setScheduleMode] = useState<"Now" | "Schedule">("Now");
  const [timeHHMM, setTimeHHMM] = useState<string>("09:30");

  // Passenger selection
  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    const self: Passenger = { id: "me", name: "You", phone: "+256 700 000 000", type: "Self", group: "Operations", defaultCostCenter: "OPS-01" };
    const e1: Passenger = { id: "emp-1", name: "John S.", phone: "+256 701 000 000", type: "Employee", group: "Sales", defaultCostCenter: "SAL-03" };
    const e2: Passenger = { id: "emp-2", name: "Mary N.", phone: "+256 702 000 000", type: "Employee", group: "Operations", defaultCostCenter: "OPS-02" };
    return [self, e1, e2];
  });
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>("me");
  const selectedPassenger = useMemo(() => passengers.find((p) => p.id === selectedPassengerId) || passengers[0], [passengers, selectedPassengerId]);

  // Corporate allocation fields
  const groupsForUser = useMemo(() => (isCoordinator ? ["Operations", "Admin", "Sales"] : ["Operations", "Admin"]), [isCoordinator]);
  const [group, setGroup] = useState<string>("Operations");

  const costCenters = useMemo(() => {
    const base = [
      { id: "OPS-01", label: "OPS-01" },
      { id: "OPS-02", label: "OPS-02" },
      { id: "ADM-01", label: "ADM-01" },
      { id: "SAL-03", label: "SAL-03" },
      { id: "FIN-01", label: "FIN-01" },
    ];
    return base;
  }, []);

  const [costCenter, setCostCenter] = useState<string>(selectedPassenger.defaultCostCenter || "OPS-01");

  const projectTags = useMemo(
    () => ["Client Onboarding", "Q1 Campaign", "Event", "Fleet", "CapEx", "Unassigned"],
    []
  );
  const [projectTag, setProjectTag] = useState<string>("Client Onboarding");

  const purposeTags = useMemo(
    () => ["Airport", "Client meeting", "Office commute", "Delivery", "Event", "Operations", "Other"],
    []
  );
  const [purpose, setPurpose] = useState<string>(selectedShortcut.defaultPurpose || "Client meeting");
  const [notes, setNotes] = useState<string>("");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");

  // Booking estimate
  const estimateUGX = useMemo(() => {
    // Prefer shortcut fares when they match the current pickup/destination
    const shortcut = selectedShortcut;
    const looksLikeShortcut = pickup === shortcut.pickup && destination === shortcut.destination;
    const base = looksLikeShortcut ? shortcut.fares[rideCategory] : rideCategory === "Premium" ? 140000 : 90000;
    const regionMultiplier = region === "Entebbe" ? 1.15 : region === "Kampala" ? 1 : 1.2;
    const scheduledMultiplier = scheduleMode === "Schedule" ? 1.02 : 1;
    const rough = Math.round(base * regionMultiplier * scheduledMultiplier);
    return clamp(rough, 45000, 950000);
  }, [pickup, destination, selectedShortcut, rideCategory, region, scheduleMode]);

  // Apply shortcut actions
  const applyShortcut = (id: string) => {
    const s = shortcuts.find((x) => x.id === id);
    if (!s) return;
    setSelectedShortcutId(id);
    setPickup(s.pickup);
    setDestination(s.destination);
    setRegion(s.region);
    if (s.defaultPurpose) setPurpose(s.defaultPurpose);
    toast({ title: "Route selected", message: s.title, kind: "success" });
  };

  // When passenger changes, apply default cost center best-effort
  useEffect(() => {
    const def = selectedPassenger?.defaultCostCenter;
    if (def) setCostCenter(def);
  }, [selectedPassengerId]);

  // CorporatePay state on payment card
  const corporateState = useMemo<CorporateState>(() => {
    if (corporateStatus === "Eligible") {
      return rideCategory === "Premium" && estimateUGX > approvalThresholdUGX ? "Requires approval" : "Available";
    }

    if (corporateStatus === "Billing delinquency" && graceActive) {
      return rideCategory === "Premium" && estimateUGX > approvalThresholdUGX ? "Requires approval" : "Available";
    }

    return "Not available";
  }, [corporateStatus, graceActive, rideCategory, estimateUGX, approvalThresholdUGX]);

  const corporateReason = useMemo(() => {
    if (corporateStatus === "Not linked") return "Not linked to an organization";
    if (corporateStatus === "Not eligible") return "Not eligible under policy";
    if (corporateStatus === "Deposit depleted") return "Deposit depleted";
    if (corporateStatus === "Credit limit exceeded") return "Credit limit exceeded";
    if (corporateStatus === "Billing delinquency" && !graceActive) return "Billing delinquency";
    if (corporateStatus === "Billing delinquency" && graceActive) return `Grace active for ${msToFriendly(graceMs)}`;
    return "";
  }, [corporateStatus, graceActive, graceMs]);

  // Policy enforcement in checkout
  const purposeRequired = paymentMethod === "CorporatePay";
  const costCenterRequired = paymentMethod === "CorporatePay";

  const policy = useMemo(() => {
    return evaluateRidePolicy({
      paymentMethod,
      corporateStatus,
      graceActive,
      region,
      timeHHMM,
      rideCategory,
      amountUGX: estimateUGX,
      approvalThresholdUGX,
      perTripLimitUGX,
      purposeRequired,
      costCenterRequired,
      purpose,
      costCenter,
    });
  }, [paymentMethod, corporateStatus, graceActive, region, timeHHMM, rideCategory, estimateUGX, approvalThresholdUGX, perTripLimitUGX, purposeRequired, costCenterRequired, purpose, costCenter]);

  // Navigation validation
  const rideStepOk = pickup.trim().length > 2 && destination.trim().length > 2;
  const passengerStepOk = !!selectedPassengerId;
  const paymentStepOk = paymentMethod !== "CorporatePay" || corporateState !== "Not available";
  const allocationOk = paymentMethod !== "CorporatePay" || (!!purpose.trim() && !!costCenter.trim());

  const canContinueFromStep = useMemo(() => {
    if (step === "ride") return rideStepOk;
    if (step === "passenger") return passengerStepOk;
    if (step === "payment") return paymentStepOk && allocationOk;
    return true;
  }, [step, rideStepOk, passengerStepOk, paymentStepOk, allocationOk]);

  const nextStep = (s: Step): Step => (s === "ride" ? "passenger" : s === "passenger" ? "payment" : s === "payment" ? "review" : "review");
  const prevStep = (s: Step): Step => (s === "review" ? "payment" : s === "payment" ? "passenger" : s === "passenger" ? "ride" : "ride");

  const onContinue = () => {
    if (!canContinueFromStep) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }
    setStep(nextStep(step));
  };

  const onBack = () => setStep(prevStep(step));

  // Review actions
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState<ExceptionDraft>({ reason: "", note: "", attachmentName: "" });

  const [submittedApprovalId, setSubmittedApprovalId] = useState<string>("");

  const openException = () => {
    setExceptionDraft({ reason: "", note: "", attachmentName: "" });
    setExceptionOpen(true);
  };

  const submitException = () => {
    if (exceptionDraft.reason.trim().length < 10) {
      toast({ title: "Reason required", message: "Add a clearer reason (min 10 characters).", kind: "warn" });
      return;
    }
    const id = `EXC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    toast({ title: "Exception requested", message: `Request ${id} created. Track it in My Requests (U5).`, kind: "success" });
    setExceptionOpen(false);
  };

  const submitForApproval = () => {
    const id = `REQ-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setSubmittedApprovalId(id);
    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    toast({ title: "Next", message: "View status in Pending Approval (U13).", kind: "info" });
  };

  const confirmBooking = () => {
    toast({ title: "Booked", message: "Ride booking confirmed.", kind: "success" });
    toast({ title: "Receipt", message: "Corporate receipt will appear in U6 after completion.", kind: "info" });
  };

  const applyPatch = (patch: Partial<StatePatch>) => {
    if (patch.paymentMethod) setPaymentMethod(patch.paymentMethod);
    if (patch.rideCategory) setRideCategory(patch.rideCategory);
    if (patch.region) setRegion(patch.region);
    if (patch.scheduleMode) setScheduleMode(patch.scheduleMode);
    if (patch.timeHHMM) setTimeHHMM(patch.timeHHMM);
    if (patch.pickup) setPickup(patch.pickup);
    if (patch.destination) setDestination(patch.destination);
    if (patch.selectedShortcutId) applyShortcut(patch.selectedShortcutId);
    if (patch.purpose !== undefined) setPurpose(patch.purpose);
    if (patch.costCenter !== undefined) setCostCenter(patch.costCenter);
  };

  // Coordinator premium tools
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitorDraft, setVisitorDraft] = useState<{ name: string; phone: string }>(() => ({ name: "", phone: "" }));

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>(() => [
    { id: uid("b"), passengerName: "Visitor A", phone: "+256 703 000 000", routeId: "office_airport", timeHHMM: "10:00", rideCategory: "Standard" },
    { id: uid("b"), passengerName: "Visitor B", phone: "+256 704 000 000", routeId: "office_airport", timeHHMM: "10:15", rideCategory: "Standard" },
  ]);

  const addVisitor = () => {
    if (!visitorDraft.name.trim() || !visitorDraft.phone.trim()) {
      toast({ title: "Missing", message: "Visitor name and phone are required.", kind: "warn" });
      return;
    }
    const v: Passenger = { id: uid("vis"), name: visitorDraft.name.trim(), phone: visitorDraft.phone.trim(), type: "Visitor", group: "Operations", defaultCostCenter: "OPS-01" };
    setPassengers((p) => [v, ...p]);
    setSelectedPassengerId(v.id);
    setVisitorDraft({ name: "", phone: "" });
    setVisitorOpen(false);
    toast({ title: "Added", message: "Visitor passenger added.", kind: "success" });
  };

  const submitBulk = () => {
    if (!bulkItems.length) {
      toast({ title: "Empty", message: "Add at least one booking.", kind: "warn" });
      return;
    }
    const id = `BULK-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    toast({ title: "Bulk submitted", message: `${id} created with ${bulkItems.length} booking(s).`, kind: "success" });
    toast({ title: "Approvals", message: "Each booking may require approval based on policy.", kind: "info" });
    setBulkOpen(false);
  };

  // Contact admin
  const [contactOpen, setContactOpen] = useState(false);

  const adminContact = useMemo(
    () => ({ name: "Finance Desk", phone: "+256 700 000 000", whatsapp: "+256 700 000 000", email: "finance@acme.com" }),
    []
  );

  const paymentCards = useMemo(
    () => [
      {
        id: "CorporatePay" as const,
        title: "CorporatePay",
        subtitle: "Company-paid with policy and approvals",
        icon: <Building2 className="h-5 w-5" />,
      },
      {
        id: "Personal Wallet" as const,
        title: "Personal Wallet",
        subtitle: "Pay from your personal EVzone wallet",
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        id: "Card" as const,
        title: "Card",
        subtitle: "Visa/Mastercard",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        id: "Mobile Money" as const,
        title: "Mobile Money",
        subtitle: "MTN/Airtel",
        icon: <Phone className="h-5 w-5" />,
      },
    ],
    []
  );

  const corporateBadges = useMemo(() => {
    const b: Array<{ label: string; tone?: any }> = [];
    b.push({ label: corporateState, tone: corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad" });
    if (corporateReason) b.push({ label: corporateReason, tone: corporateState === "Not available" ? "bad" : "neutral" });
    if (paymentMethod === "CorporatePay") b.push({ label: "Selected", tone: "info" });
    return b.slice(0, 3);
  }, [corporateState, corporateReason, paymentMethod]);

  const corporateFoot = useMemo(() => {
    if (corporateState === "Not available") {
      return (
        <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
          CorporatePay is not available. You can pay personally, contact admin, or view corporate status.
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setContactOpen(true);
              }}
            >
              Contact admin
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentMethod("Personal Wallet");
                toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" });
              }}
            >
              Pay personally
            </button>
          </div>
        </div>
      );
    }

    if (corporateState === "Requires approval") {
      return (
        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          This ride will require approval based on policy thresholds. You can still proceed.
        </div>
      );
    }

    return <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">CorporatePay is available for this ride.</div>;
  }, [corporateState]);

  // Step content
  const headerPills = (
    <div className="flex flex-wrap items-center gap-2">
      <Pill label={`Role: ${role}`} tone={isCoordinator ? "info" : "neutral"} />
      <Pill label={`Passenger: ${selectedPassenger.name}`} tone="neutral" />
      <Pill label={`Category: ${rideCategory}`} tone="neutral" />
      <Pill label={`Est: ${formatUGX(estimateUGX)}`} tone="neutral" />
      <Pill label={`Payment: ${paymentMethod}`} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Top bar */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Route className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Rides checkout with CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">Book rides normally. CorporatePay adds policy, purpose, and cost-center controls.</div>
                  <div className="mt-2">{headerPills}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold text-slate-600">Role</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(["Employee", "Travel Coordinator"] as Role[]).map((r) => (
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
                  </div>
                </div>

                <Button variant="outline" onClick={() => toast({ title: "Corporate status", message: "Open U4 (demo).", kind: "info" })}>
                  <Wallet className="h-4 w-4" /> Status
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Payment", message: "Open U7 (demo).", kind: "info" })}>
                  <CreditCard className="h-4 w-4" /> Payment
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
                {step === "ride" ? (
                  <div className="space-y-4">
                    <Section
                      title="Approved route shortcuts"
                      subtitle="Premium: fast, policy-safe routes for office and airport"
                      right={<Pill label="Premium" tone="info" />}
                    >
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {shortcuts.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => applyShortcut(s.id)}
                            className={cn(
                              "min-w-[280px] rounded-3xl border p-4 text-left shadow-sm transition",
                              selectedShortcutId === s.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                                  {s.approved ? <Pill label="Approved" tone="good" /> : <Pill label="Custom" tone="neutral" />}
                                </div>
                                <div className="mt-1 text-xs text-slate-600">{s.subtitle}</div>
                                <div className="mt-3 text-xs text-slate-500">{s.pickup} → {s.destination}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={s.region} tone="neutral" />
                                  <Pill label={`Std ${formatUGX(s.fares.Standard)}`} tone="neutral" />
                                  <Pill label={`Prem ${formatUGX(s.fares.Premium)}`} tone="neutral" />
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Approved shortcuts prefill pickup, destination, region, and a default purpose tag.
                      </div>
                    </Section>

                    <Section title="Ride details" subtitle="Pick pickup, destination, region, time and category" right={<Pill label="Core" tone="neutral" />}>
                      <div className="grid grid-cols-1 gap-4">
                        <label>
                          <div className="text-xs font-semibold text-slate-600">Pickup</div>
                          <input
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              pickup.trim().length > 2 ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                            placeholder="Pickup"
                          />
                        </label>

                        <label>
                          <div className="text-xs font-semibold text-slate-600">Destination</div>
                          <input
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              destination.trim().length > 2 ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                            placeholder="Destination"
                          />
                        </label>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Region</div>
                            <select
                              value={region}
                              onChange={(e) => setRegion(e.target.value as Region)}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              {(["Kampala", "Entebbe", "Jinja", "Other"] as Region[]).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 text-xs text-slate-500">Used for policy checks</div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">Category</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(["Standard", "Premium"] as RideCategory[]).map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setRideCategory(c)}
                                  className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                    rideCategory === c ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                  )}
                                  style={rideCategory === c ? { background: EVZ.green } : undefined}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">When</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(["Now", "Schedule"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setScheduleMode(m)}
                                  className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                    scheduleMode === m ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                  )}
                                  style={scheduleMode === m ? { background: EVZ.green } : undefined}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2">
                              <input
                                type="time"
                                value={timeHHMM}
                                onChange={(e) => setTimeHHMM(e.target.value)}
                                className={cn(
                                  "w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                  scheduleMode === "Schedule" ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700 focus:ring-slate-200"
                                )}
                                disabled={scheduleMode !== "Schedule"}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          Tip: corporate rides are typically allowed between 06:00 and 22:00 in approved regions.
                        </div>
                      </div>
                    </Section>

                    {isCoordinator ? (
                      <Section title="Coordinator tools" subtitle="Premium tools for booking on mobile" right={<Pill label="Premium" tone="info" />}>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setVisitorOpen(true)}
                            className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Visitor ride</div>
                                <div className="mt-1 text-sm text-slate-600">Create a visitor passenger and book.</div>
                              </div>
                              <Users className="h-5 w-5 text-slate-400" />
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBulkOpen(true)}
                            className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Bulk booking</div>
                                <div className="mt-1 text-sm text-slate-600">Book multiple visitors quickly.</div>
                              </div>
                              <ClipboardList className="h-5 w-5 text-slate-400" />
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              toast({ title: "Event manifest", message: "Open event manifest tool (included in Bulk booking modal).", kind: "info" });
                              setBulkOpen(true);
                            }}
                            className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Event manifest</div>
                                <div className="mt-1 text-sm text-slate-600">Import visitor list and schedule rides.</div>
                              </div>
                              <FileText className="h-5 w-5 text-slate-400" />
                            </div>
                          </button>
                        </div>
                      </Section>
                    ) : null}
                  </div>
                ) : null}

                {step === "passenger" ? (
                  <div className="space-y-4">
                    <Section
                      title="Passenger"
                      subtitle={isCoordinator ? "Select self, employee, or visitor" : "Self booking"}
                      right={<Pill label={isCoordinator ? "Coordinator" : "Employee"} tone={isCoordinator ? "info" : "neutral"} />}
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {passengers
                          .filter((p) => (isCoordinator ? true : p.type === "Self"))
                          .map((p) => {
                            const active = p.id === selectedPassengerId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPassengerId(p.id);
                                  toast({ title: "Passenger", message: p.name, kind: "info" });
                                }}
                                className={cn(
                                  "rounded-3xl border p-4 text-left shadow-sm transition hover:bg-slate-50",
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
                          <Button variant="outline" onClick={() => setBulkOpen(true)}>
                            <ClipboardList className="h-4 w-4" /> Bulk booking
                          </Button>
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Booking for others is available for coordinators. Each request is auditable.
                      </div>
                    </Section>
                  </div>
                ) : null}

                {step === "payment" ? (
                  <div className="space-y-4">
                    <Section
                      title="Payment"
                      subtitle="Choose CorporatePay or personal methods"
                      right={<Pill label="Core" tone="neutral" />}
                    >
                      <div className="space-y-2">
                        {paymentCards.map((m) => {
                          const isCorp = m.id === "CorporatePay";
                          const disabled = isCorp ? corporateState === "Not available" : false;

                          const badges = isCorp
                            ? corporateBadges
                            : [
                                ...(paymentMethod === m.id ? [{ label: "Selected", tone: "info" }] : []),
                              ];

                          const foot = isCorp ? corporateFoot : <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">Personal payment does not require corporate approvals.</div>;

                          return (
                            <PaymentCard
                              key={m.id}
                              id={m.id}
                              title={m.title}
                              subtitle={m.subtitle}
                              icon={m.icon}
                              selected={paymentMethod === m.id}
                              disabled={disabled}
                              badges={badges}
                              foot={foot}
                              onSelect={() => {
                                if (disabled) {
                                  toast({ title: "Unavailable", message: "CorporatePay is not available. Choose another method.", kind: "warn" });
                                  return;
                                }
                                setPaymentMethod(m.id);
                                toast({ title: "Payment selected", message: m.title, kind: "success" });
                              }}
                            />
                          );
                        })}
                      </div>
                    </Section>

                    {paymentMethod === "CorporatePay" ? (
                      <Section
                        title="Corporate allocation"
                        subtitle="Purpose and cost center are enforced for corporate rides"
                        right={<Pill label="Required" tone="warn" />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Group</div>
                            <select
                              value={group}
                              onChange={(e) => setGroup(e.target.value)}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              {groupsForUser.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 text-xs text-slate-500">Shown when user belongs to multiple groups</div>
                          </div>

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
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                            {!costCenter.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">Project tag</div>
                            <select
                              value={projectTag}
                              onChange={(e) => setProjectTag(e.target.value)}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              {projectTags.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 text-xs text-slate-500">Optional unless policy requires</div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">Purpose tag</div>
                            <select
                              value={purpose}
                              onChange={(e) => setPurpose(e.target.value)}
                              className={cn(
                                "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                purpose.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                              )}
                            >
                              <option value="">Select</option>
                              {purposeTags.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            {!purpose.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-xs font-semibold text-slate-600">Notes (optional)</div>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={4}
                              placeholder="Optional context for approvers"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                            />
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Purpose and cost center are enforced to keep corporate billing clean.
                        </div>
                      </Section>
                    ) : null}

                    <Section
                      title="CorporatePay status"
                      subtitle="Demo controls for eligibility and enforcement"
                      right={<Pill label={corporateStatus} tone={toneForProgram(corporateStatus, graceActive)} />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Program status</div>
                          <select
                            value={corporateStatus}
                            onChange={(e) => setCorporateStatus(e.target.value as CorporateProgramStatus)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
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
                          <div className="mt-2 text-xs text-slate-500">In production, this comes from CorporatePay funding and compliance.</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Thresholds</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-semibold text-slate-600">Approval threshold</div>
                              <input
                                type="number"
                                value={approvalThresholdUGX}
                                onChange={(e) => setApprovalThresholdUGX(clamp(Number(e.target.value || 0), 0, 999999999))}
                                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                              />
                            </label>
                            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-semibold text-slate-600">Per-trip limit</div>
                              <input
                                type="number"
                                value={perTripLimitUGX}
                                onChange={(e) => setPerTripLimitUGX(clamp(Number(e.target.value || 0), 0, 999999999))}
                                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Premium: grace window</div>
                              <div className="mt-1 text-xs text-slate-600">Only applies to billing delinquency</div>
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                graceEnabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => setGraceEnabled((v) => !v)}
                              aria-label="Toggle grace"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", graceEnabled ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Pill label={graceActive ? `Grace active: ${msToFriendly(graceMs)}` : "Grace inactive"} tone={graceActive ? "warn" : "neutral"} />
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => setGraceEndAt(Date.now() + 3 * 60 * 60 * 1000)}
                            >
                              <Timer className="h-4 w-4" /> Reset grace
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </div>
                ) : null}

                {step === "review" ? (
                  <div className="space-y-4">
                    <Section
                      title="Policy check"
                      subtitle="Out-of-policy explanations and safe alternatives"
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
                                ? "You can proceed."
                                : policy.outcome === "Approval required"
                                ? "Proceed to submit for approval."
                                : "CorporatePay cannot proceed without changes or an exception."}
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
                                    <Pill label={r.code} tone={r.code === "OK" ? "good" : r.code === "THRESHOLD" ? "warn" : r.code === "PROGRAM" && graceActive ? "warn" : r.code === "PROGRAM" ? "bad" : r.code === "TIME" || r.code === "GEO" ? "bad" : "neutral"} />
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
                              <ChevronRight className="h-4 w-4" /> Submit for approval
                            </Button>
                          ) : null}

                          {policy.outcome === "Blocked" ? (
                            <Button variant="outline" onClick={openException}>
                              <AlertTriangle className="h-4 w-4" /> Request exception
                            </Button>
                          ) : null}

                          <Button variant="outline" onClick={() => { setPaymentMethod("Personal Wallet"); toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" }); }}>
                            <Wallet className="h-4 w-4" /> Pay personally
                          </Button>

                          <Button variant="outline" onClick={() => toast({ title: "Policy details", message: "Open policy summary (U3).", kind: "info" })}>
                            <ShieldCheck className="h-4 w-4" /> Policies
                          </Button>
                        </div>

                        {submittedApprovalId ? (
                          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Approval request created: <span className="font-semibold">{submittedApprovalId}</span>. You can track it in Pending Approval (U13).
                          </div>
                        ) : null}
                      </div>
                    </Section>

                    <Section
                      title="Alternatives"
                      subtitle="Fix quickly"
                      right={<Pill label={`${policy.alternatives.length}`} tone="neutral" />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {policy.alternatives.map((a) => (
                          <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">{a.icon}</div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                    <Pill label={a.expected} tone={toneForOutcome(a.expected)} />
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">{a.desc}</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="mt-3">
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  applyPatch(a.patch);
                                  toast({ title: "Applied", message: a.title, kind: "success" });
                                }}
                              >
                                <ChevronRight className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        If you need a one-time override, request an exception.
                      </div>
                    </Section>

                    <Section title="Policy coach" subtitle="Premium: suggestions to reduce approvals" right={<Pill label="Premium" tone="info" />}
                    >
                      <div className="space-y-2">
                        {policy.coach.map((c) => (
                          <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label="Coach" tone="info" />
                                  <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                              </div>
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  if (c.patch) applyPatch(c.patch);
                                  toast({ title: "Coach", message: c.title, kind: "success" });
                                }}
                              >
                                <ChevronRight className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Coach suggestions are logic-based in v1 and become smarter with real history.
                      </div>
                    </Section>
                  </div>
                ) : null}
              </div>

              {/* Summary rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Summary" subtitle="What will be booked" right={<Pill label="Live" tone="good" />}>
                  <div className="space-y-2">
                    <SummaryRow label="Pickup" value={pickup} />
                    <SummaryRow label="Destination" value={destination} />
                    <SummaryRow label="Region" value={region} />
                    <SummaryRow label="When" value={scheduleMode === "Now" ? "Now" : `Scheduled ${timeHHMM}`} />
                    <SummaryRow label="Passenger" value={`${selectedPassenger.name} (${selectedPassenger.type})`} />
                    <SummaryRow label="Category" value={rideCategory} />
                    <SummaryRow label="Estimated" value={formatUGX(estimateUGX)} emphasize />
                    <SummaryRow label="Payment" value={paymentMethod} emphasize={paymentMethod === "CorporatePay"} />

                    {paymentMethod === "CorporatePay" ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Corporate allocation</div>
                            <div className="mt-1 text-xs text-slate-500">Required fields for billing</div>
                          </div>
                          <Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <span className="font-semibold">Group</span>
                            <span>{group || "-"}</span>
                          </div>
                          <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 ring-1", costCenter.trim() ? "bg-slate-50 ring-slate-200" : "bg-amber-50 ring-amber-200")}>
                            <span className="font-semibold">Cost center</span>
                            <span>{costCenter || "Required"}</span>
                          </div>
                          <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 ring-1", purpose.trim() ? "bg-slate-50 ring-slate-200" : "bg-amber-50 ring-amber-200")}>
                            <span className="font-semibold">Purpose</span>
                            <span>{purpose || "Required"}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <span className="font-semibold">Project</span>
                            <span>{projectTag}</span>
                          </div>
                        </div>
                        {corporateState === "Not available" ? (
                          <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                            CorporatePay unavailable: {corporateReason || ""}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      Out-of-policy explanations appear in Review, with alternatives and exception request.
                    </div>
                  </div>
                </Section>

                <Section title="Coordinator features" subtitle="Premium" right={<Pill label="Premium" tone="info" />}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <InfoCard icon={<ClipboardList className="h-4 w-4" />} title="Bulk booking" desc="Create multiple ride requests quickly" />
                    <InfoCard icon={<Users className="h-4 w-4" />} title="Visitor rides" desc="Book for visitors without accounts" />
                    <InfoCard icon={<FileText className="h-4 w-4" />} title="Event manifest" desc="Import visitor list and schedule" />
                    <InfoCard icon={<Route className="h-4 w-4" />} title="Approved routes" desc="Office and airport shortcuts" />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Coordinator tools are available only for eligible roles.
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={`Est: ${formatUGX(estimateUGX)}`} tone="neutral" />
                  <Pill label={`Pay: ${paymentMethod}`} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                  {step === "payment" && paymentMethod === "CorporatePay" ? <Pill label={allocationOk ? "Allocation ok" : "Allocation required"} tone={allocationOk ? "good" : "warn"} /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={onBack} disabled={step === "ride"}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>
                  {step !== "review" ? (
                    <Button variant={canContinueFromStep ? "primary" : "outline"} onClick={onContinue} disabled={!canContinueFromStep}>
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button
                      variant={policy.outcome === "Allowed" ? "primary" : policy.outcome === "Approval required" ? "primary" : "outline"}
                      onClick={() => {
                        if (policy.outcome === "Allowed") confirmBooking();
                        else if (policy.outcome === "Approval required") submitForApproval();
                        else openException();
                      }}
                    >
                      <ChevronRight className="h-4 w-4" /> {policy.outcome === "Allowed" ? "Confirm" : policy.outcome === "Approval required" ? "Submit" : "Exception"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U15 Rides and Logistics Checkout with CorporatePay. Core: CorporatePay selection, purpose enforcement, passenger selection, out-of-policy explanations and exception request. Premium: coordinator tools and approved route shortcuts.
            </div>
          </div>
        </div>
      </div>

      {/* Visitor modal */}
      <Modal
        open={visitorOpen}
        title="Add visitor passenger"
        subtitle="Premium: visitor rides"
        onClose={() => setVisitorOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setVisitorOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addVisitor}>
              <Plus className="h-4 w-4" /> Add visitor
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
            In production, visitor rides can send a link by WhatsApp/SMS to the passenger.
          </div>
        </div>
      </Modal>

      {/* Bulk booking modal */}
      <Modal
        open={bulkOpen}
        title="Bulk booking"
        subtitle="Premium: bulk booking, visitor rides, and event manifest"
        onClose={() => setBulkOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitBulk}>
              <ClipboardList className="h-4 w-4" /> Submit bulk
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Manifest</div>
                <div className="mt-1 text-sm text-slate-600">Add multiple visitors, choose route shortcut, and schedule.</div>
              </div>
              <Pill label="Premium" tone="info" />
            </div>
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              Tip: use Office to Airport route for visitor arrivals.
            </div>
          </div>

          <div className="space-y-2">
            {bulkItems.map((b) => (
              <div key={b.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="text-xs font-semibold text-slate-600">Passenger</div>
                    <input
                      value={b.passengerName}
                      onChange={(e) => setBulkItems((p) => p.map((x) => (x.id === b.id ? { ...x, passengerName: e.target.value } : x)))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                      placeholder="Name"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-xs font-semibold text-slate-600">Phone</div>
                    <input
                      value={b.phone}
                      onChange={(e) => setBulkItems((p) => p.map((x) => (x.id === b.id ? { ...x, phone: e.target.value } : x)))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                      placeholder="+256..."
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-xs font-semibold text-slate-600">Route</div>
                    <select
                      value={b.routeId}
                      onChange={(e) => setBulkItems((p) => p.map((x) => (x.id === b.id ? { ...x, routeId: e.target.value } : x)))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      {shortcuts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Time</div>
                    <input
                      type="time"
                      value={b.timeHHMM}
                      onChange={(e) => setBulkItems((p) => p.map((x) => (x.id === b.id ? { ...x, timeHHMM: e.target.value } : x)))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <div className="text-xs font-semibold text-slate-600">Cat</div>
                    <select
                      value={b.rideCategory}
                      onChange={(e) => setBulkItems((p) => p.map((x) => (x.id === b.id ? { ...x, rideCategory: e.target.value as RideCategory } : x)))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      {(["Standard", "Premium"] as RideCategory[]).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="px-3 py-2 text-xs"
                    onClick={() => setBulkItems((p) => p.filter((x) => x.id !== b.id))}
                    disabled={bulkItems.length <= 1}
                    title={bulkItems.length <= 1 ? "At least one item required" : "Remove"}
                  >
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setBulkItems((p) => [
                  ...p,
                  { id: uid("b"), passengerName: "", phone: "", routeId: "office_airport", timeHHMM: "10:30", rideCategory: "Standard" },
                ])
              }
            >
              <Plus className="h-4 w-4" /> Add row
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const text = prompt("Paste manifest lines: Name, Phone (one per line)")?.trim();
                if (!text) return;
                const lines = text
                  .split(/\n+/)
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .slice(0, 30);
                const parsed: BulkItem[] = lines.map((l) => {
                  const parts = l.split(",").map((x) => x.trim());
                  return {
                    id: uid("b"),
                    passengerName: parts[0] || "Visitor",
                    phone: parts[1] || "",
                    routeId: "office_airport",
                    timeHHMM: "10:00",
                    rideCategory: "Standard",
                  };
                });
                setBulkItems((p) => [...parsed, ...p].slice(0, 30));
                toast({ title: "Manifest imported", message: `${parsed.length} line(s).`, kind: "success" });
              }}
            >
              <Upload className="h-4 w-4" /> Import manifest
            </Button>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: bulk booking uses coordinator permissions and can generate individual approval requests when required.
          </div>
        </div>
      </Modal>

      {/* Contact admin modal */}
      <Modal
        open={contactOpen}
        title="Contact admin"
        subtitle="Use approved channels to restore CorporatePay"
        onClose={() => setContactOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setContactOpen(false)}>Close</Button>
          </div>
        }
        maxW="820px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{adminContact.name}</div>
                <div className="mt-1 text-sm text-slate-600">Email: {adminContact.email}</div>
                <div className="mt-1 text-sm text-slate-600">Phone/WhatsApp: {adminContact.whatsapp}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill label="Billing" tone="neutral" />
                  <Pill label="Funding" tone="neutral" />
                  <Pill label="Enforcement" tone="neutral" />
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(adminContact.email);
                    toast({ title: "Copied", message: "Email copied.", kind: "success" });
                  } catch {
                    toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                  }
                }}
              >
                <Copy className="h-4 w-4" /> Copy email
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(adminContact.whatsapp);
                    toast({ title: "Copied", message: "WhatsApp copied.", kind: "success" });
                  } catch {
                    toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                  }
                }}
              >
                <Copy className="h-4 w-4" /> Copy WhatsApp
              </Button>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              Suggested message: "CorporatePay is unavailable due to {corporateStatus}. Please advise timeline to restore service."
            </div>
          </div>
        </div>
      </Modal>

      {/* Exception modal */}
      <Modal
        open={exceptionOpen}
        title="Request exception"
        subtitle="Creates an approval request when CorporatePay is blocked"
        onClose={() => setExceptionOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExceptionOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitException}>
              <BadgeCheck className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`Amount ${formatUGX(estimateUGX)}`} tone="neutral" />
              <Pill label={`Region ${region}`} tone="neutral" />
              <Pill label={`Time ${scheduleMode === "Now" ? "Now" : timeHHMM}`} tone="neutral" />
              <Pill label={`Category ${rideCategory}`} tone="neutral" />
              <Pill label="Exception" tone="warn" />
            </div>
            <div className="mt-3 text-sm text-slate-700">Explain why you need an exception. Attach evidence if required.</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
              <textarea
                value={exceptionDraft.reason}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, reason: e.target.value }))}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Example: urgent business ride outside allowed hours"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Attachment name (optional)</div>
              <input
                value={exceptionDraft.attachmentName}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, attachmentName: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Example: Itinerary.pdf"
              />
              <div className="mt-2 text-xs text-slate-500">In production, this is file upload (photo/PDF).</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Notes (optional)</div>
            <textarea
              value={exceptionDraft.note}
              onChange={(e) => setExceptionDraft((p) => ({ ...p, note: e.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Extra context"
            />
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Exceptions are audited and may require attachments depending on policy.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}> 
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-emerald-900")}>{value}</div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}
