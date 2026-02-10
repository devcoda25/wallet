import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Timer,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Step = "service" | "schedule" | "review" | "receipt";

type PaymentMethod = "CorporatePay" | "Personal Wallet" | "Card" | "Mobile Money";

type CorporateProgramStatus =
  | "Eligible"
  | "Not linked"
  | "Not eligible"
  | "Deposit depleted"
  | "Credit limit exceeded"
  | "Billing delinquency";

type Outcome = "Allowed" | "Approval required" | "Blocked";

type Severity = "Info" | "Warning" | "Critical";

type PolicyReasonCode = "PROGRAM" | "VENDOR" | "CATEGORY" | "AMOUNT" | "TIME" | "LOCATION" | "OK";

type PolicyReason = {
  code: PolicyReasonCode;
  title: string;
  detail: string;
  severity: Severity;
};

type Alternative = {
  id: string;
  title: string;
  desc: string;
  expected: Outcome;
  patch: Partial<Patch>;
};

type Patch = {
  paymentMethod: PaymentMethod;
  vendorId: string;
  slotId: string;
  removeAddonId: string;
  setDurationHours: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type VendorStatus = "Preferred" | "Allowlisted" | "Unapproved" | "Denylisted";

type ServiceCategory =
  | "Installation"
  | "Maintenance"
  | "Repair"
  | "Training"
  | "Consulting"
  | "Delivery/Courier"
  | "Other";

type Vendor = {
  id: string;
  name: string;
  status: VendorStatus;
  rating: number;
  jobsDone: number;
  responseHours: number;
  verified: boolean;
  complianceDocs: Array<{ name: string; status: "Verified" | "Pending" | "Missing" }>;
  baseRegion: string;
  travelRadiusKm: number;
  cancellationPolicy: string;
};

type AddOn = { id: string; label: string; priceUGX: number; risk?: "Low" | "Medium" | "High" };

type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  shortDesc: string;
  basePriceUGX: number;
  priceModel: "Fixed" | "Hourly";
  included: string[];
  exclusions: string[];
  estimatedHours: number;
  addOns: AddOn[];
  requiredFields: {
    onsiteContact: boolean;
    exactAddress: boolean;
    attachments: boolean;
  };
};

type TimeSlot = {
  id: string;
  label: string; // e.g. 09:00–11:00
  startHour: number;
  endHour: number;
  isPopular?: boolean;
};

type Receipt = {
  id: string;
  createdAt: number;
  vendor: string;
  service: string;
  category: ServiceCategory;
  address: string;
  scheduleLabel: string;
  durationHours: number;
  subtotalUGX: number;
  discountUGX: number;
  totalUGX: number;
  paymentMethod: PaymentMethod;
  corporate: boolean;
  costCenter?: string;
  projectTag?: string;
  purpose?: string;
  approvalId?: string;
  holdUntil?: number;
  notes: string[];
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

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
}

function toneForVendor(s: VendorStatus) {
  if (s === "Preferred") return "info" as const;
  if (s === "Allowlisted") return "good" as const;
  if (s === "Unapproved") return "warn" as const;
  return "bad" as const;
}

function toneForSeverity(s: Severity) {
  if (s === "Critical") return "bad" as const;
  if (s === "Warning") return "warn" as const;
  return "neutral" as const;
}

function msToFriendly(ms: number) {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function dedupeAlt(list: Alternative[]) {
  const seen = new Set<string>();
  const out: Alternative[] = [];
  for (const a of list) {
    const key = `${a.title}|${JSON.stringify(a.patch)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 8);
}

function evaluateServicePolicy(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  vendor: Vendor;
  category: ServiceCategory;
  totalUGX: number;
  approvalThresholdUGX: number;
  hardBlockUGX: number;
  unapprovedVendorApprovalUGX: number;
  unapprovedVendorBlockUGX: number;
  selectedSlot: TimeSlot | null;
  workStartHour: number;
  workEndHour: number;
  geoAllowed: boolean;
  requiredFieldsOk: boolean;
}): { outcome: Outcome; reasons: PolicyReason[]; alternatives: Alternative[] } {
  const {
    paymentMethod,
    corporateStatus,
    graceActive,
    vendor,
    category,
    totalUGX,
    approvalThresholdUGX,
    hardBlockUGX,
    unapprovedVendorApprovalUGX,
    unapprovedVendorBlockUGX,
    selectedSlot,
    workStartHour,
    workEndHour,
    geoAllowed,
    requiredFieldsOk,
  } = args;

  const reasons: PolicyReason[] = [];
  const alternatives: Alternative[] = [];

  // Personal payment bypass
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments.", severity: "Info" });
    alternatives.push({
      id: "alt-corp",
      title: "Use CorporatePay instead",
      desc: "Use CorporatePay for business bookings when eligible.",
      expected: "Approval required",
      patch: { paymentMethod: "CorporatePay" },
    });
    return { outcome: "Allowed", reasons, alternatives: dedupeAlt(alternatives) };
  }

  // Corporate program states
  if (corporateStatus === "Not linked") {
    reasons.push({ code: "PROGRAM", title: "Not linked to an organization", detail: "CorporatePay is only available when you are linked to an organization.", severity: "Critical" });
  }
  if (corporateStatus === "Not eligible") {
    reasons.push({ code: "PROGRAM", title: "Not eligible under policy", detail: "Your role or group is not eligible for corporate service bookings.", severity: "Critical" });
  }
  if (corporateStatus === "Deposit depleted") {
    reasons.push({ code: "PROGRAM", title: "Deposit depleted", detail: "Prepaid deposit is depleted. CorporatePay is a hard stop until top-up.", severity: "Critical" });
  }
  if (corporateStatus === "Credit limit exceeded") {
    reasons.push({ code: "PROGRAM", title: "Credit limit exceeded", detail: "Corporate credit limit is exceeded. CorporatePay is paused until repayment or adjustment.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && !graceActive) {
    reasons.push({ code: "PROGRAM", title: "Billing delinquency", detail: "CorporatePay is suspended due to delinquency. Ask admin to resolve invoices.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace is active. CorporatePay may proceed.", severity: "Warning" });
  }

  const blockedByProgram =
    ["Not linked", "Not eligible", "Deposit depleted", "Credit limit exceeded"].includes(corporateStatus) ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (blockedByProgram) {
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed immediately with personal payment.",
      expected: "Allowed",
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives: dedupeAlt(alternatives) };
  }

  // Required fields
  if (!requiredFieldsOk) {
    reasons.push({ code: "OK", title: "Missing booking details", detail: "Complete required booking fields before continuing.", severity: "Critical" });
  }

  // Geo
  if (!geoAllowed) {
    reasons.push({ code: "LOCATION", title: "Outside allowed service area", detail: "This address is outside the allowed service region for corporate bookings.", severity: "Critical" });
  }

  // Slot / work hours
  if (!selectedSlot) {
    reasons.push({ code: "TIME", title: "Schedule required", detail: "Select a booking slot.", severity: "Critical" });
  } else {
    const inHours = selectedSlot.startHour >= workStartHour && selectedSlot.endHour <= workEndHour;
    if (!inHours) {
      reasons.push({
        code: "TIME",
        title: "Outside corporate time window",
        detail: `This slot is outside policy hours (${workStartHour}:00–${workEndHour}:00).`,
        severity: "Warning",
      });
    }
  }

  // Vendor gating
  if (vendor.status === "Denylisted") {
    reasons.push({ code: "VENDOR", title: "Vendor blocked", detail: "Vendor is denylisted for corporate service bookings.", severity: "Critical" });
  }

  // Unapproved vendor thresholds
  if (vendor.status === "Unapproved") {
    if (totalUGX > unapprovedVendorBlockUGX) {
      reasons.push({ code: "VENDOR", title: "High value from unapproved vendor", detail: `Vendor is unapproved and exceeds ${formatUGX(unapprovedVendorBlockUGX)}.`, severity: "Critical" });
    } else if (totalUGX > unapprovedVendorApprovalUGX) {
      reasons.push({ code: "VENDOR", title: "Approval required for unapproved vendor", detail: `Vendor is unapproved. Approval required above ${formatUGX(unapprovedVendorApprovalUGX)}.`, severity: "Warning" });
    }
  }

  // Category restrictions example
  if (category === "Delivery/Courier") {
    reasons.push({ code: "CATEGORY", title: "Category handled in Delivery checkout", detail: "Delivery/Courier should be booked in the Delivery checkout page (U28).", severity: "Warning" });
  }

  // Amount thresholds
  if (totalUGX > hardBlockUGX) {
    reasons.push({ code: "AMOUNT", title: "Amount exceeds hard limit", detail: `Total exceeds hard limit (${formatUGX(hardBlockUGX)}).`, severity: "Critical" });
  } else if (totalUGX > approvalThresholdUGX) {
    reasons.push({ code: "AMOUNT", title: "Approval required", detail: `Total exceeds approval threshold (${formatUGX(approvalThresholdUGX)}).`, severity: "Warning" });
  }

  // Alternatives
  alternatives.push({
    id: "alt-pay-personal",
    title: "Pay personally",
    desc: "Proceed immediately with personal payment.",
    expected: "Allowed",
    patch: { paymentMethod: "Personal Wallet" },
  });

  if (selectedSlot) {
    // nudge to choose a compliant slot
    alternatives.push({
      id: "alt-slot",
      title: "Choose a policy-compliant slot",
      desc: `Pick a slot within ${workStartHour}:00–${workEndHour}:00 for instant approval.`,
      expected: "Allowed",
      patch: {},
    });
  }

  // Determine outcome
  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarn = reasons.some((r) => r.severity === "Warning");
  if (!reasons.length) {
    reasons.push({ code: "OK", title: "Within policy", detail: "Booking is within vendor, time, location, and budget rules.", severity: "Info" });
  }

  if (hasCritical) return { outcome: "Blocked", reasons, alternatives: dedupeAlt(alternatives) };
  if (hasWarn) return { outcome: "Approval required", reasons, alternatives: dedupeAlt(alternatives) };
  return { outcome: "Allowed", reasons, alternatives: dedupeAlt(alternatives) };
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral" | "accent";
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
    { k: "schedule", label: "Schedule" },
    { k: "review", label: "Review" },
    { k: "receipt", label: "Receipt" },
  ];

  const idx = steps.findIndex((s) => s.k === step);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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

export default function UserU29ServicesBookingCheckoutCorporatePay() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const vendors: Vendor[] = useMemo(
    () => [
      {
        id: "v_pref",
        name: "ServiceMart Pro Installers (Preferred)",
        status: "Preferred",
        rating: 4.8,
        jobsDone: 1280,
        responseHours: 2,
        verified: true,
        complianceDocs: [
          { name: "Business license", status: "Verified" },
          { name: "Insurance", status: "Verified" },
          { name: "Safety cert", status: "Verified" },
        ],
        baseRegion: "Kampala",
        travelRadiusKm: 35,
        cancellationPolicy: "Free cancellation up to 6 hours before the appointment.",
      },
      {
        id: "v_allow",
        name: "Kampala Technical Services",
        status: "Allowlisted",
        rating: 4.5,
        jobsDone: 420,
        responseHours: 4,
        verified: true,
        complianceDocs: [
          { name: "Business license", status: "Verified" },
          { name: "Insurance", status: "Pending" },
          { name: "Safety cert", status: "Verified" },
        ],
        baseRegion: "Kampala",
        travelRadiusKm: 25,
        cancellationPolicy: "50% fee if cancelled within 3 hours of the appointment.",
      },
      {
        id: "v_unapproved",
        name: "QuickFix Crew",
        status: "Unapproved",
        rating: 4.2,
        jobsDone: 96,
        responseHours: 8,
        verified: false,
        complianceDocs: [
          { name: "Business license", status: "Pending" },
          { name: "Insurance", status: "Missing" },
          { name: "Safety cert", status: "Pending" },
        ],
        baseRegion: "Wakiso",
        travelRadiusKm: 18,
        cancellationPolicy: "Non-refundable within 2 hours.",
      },
      {
        id: "v_deny",
        name: "Unlicensed Provider",
        status: "Denylisted",
        rating: 3.7,
        jobsDone: 12,
        responseHours: 24,
        verified: false,
        complianceDocs: [
          { name: "Business license", status: "Missing" },
          { name: "Insurance", status: "Missing" },
          { name: "Safety cert", status: "Missing" },
        ],
        baseRegion: "Other",
        travelRadiusKm: 5,
        cancellationPolicy: "N/A",
      },
    ],
    []
  );

  const vendorById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])) as Record<string, Vendor>, [vendors]);

  const service: Service = useMemo(
    () => ({
      id: "svc_install",
      name: "EV Charger Installation (AC) – Site Setup",
      category: "Installation",
      shortDesc: "Professional installation, safety checks, and commissioning for your EV charging point.",
      basePriceUGX: 420000,
      priceModel: "Fixed",
      included: ["Site inspection", "Mounting and wiring", "Basic commissioning", "Safety checklist"],
      exclusions: ["Civil works", "Major rewiring", "Permits and government fees"],
      estimatedHours: 3,
      addOns: [
        { id: "a_fast", label: "Express appointment (within 24h)", priceUGX: 90000, risk: "Medium" },
        { id: "a_cable", label: "Extra cable (up to 10m)", priceUGX: 65000, risk: "Low" },
        { id: "a_training", label: "Onsite team training (30 mins)", priceUGX: 40000, risk: "Low" },
        { id: "a_report", label: "Compliance report pack", priceUGX: 55000, risk: "Low" },
      ],
      requiredFields: { onsiteContact: true, exactAddress: true, attachments: false },
    }),
    []
  );

  const slots: TimeSlot[] = useMemo(
    () => [
      { id: "s1", label: "08:00–10:00", startHour: 8, endHour: 10, isPopular: true },
      { id: "s2", label: "10:00–12:00", startHour: 10, endHour: 12 },
      { id: "s3", label: "13:00–15:00", startHour: 13, endHour: 15, isPopular: true },
      { id: "s4", label: "15:00–17:00", startHour: 15, endHour: 17 },
      { id: "s5", label: "18:00–20:00", startHour: 18, endHour: 20 },
    ],
    []
  );

  const [step, setStep] = useState<Step>("service");

  // Booking selection
  const [vendorId, setVendorId] = useState<string>("v_pref");
  const [addOnIds, setAddOnIds] = useState<string[]>(["a_report"]);
  const [durationHours, setDurationHours] = useState<number>(service.estimatedHours);

  const [dateISO, setDateISO] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [slotId, setSlotId] = useState<string>("s3");

  const [address, setAddress] = useState<string>("Millennium House, Nsambya Road 472, Kampala");
  const [onsiteName, setOnsiteName] = useState<string>("Facility Manager");
  const [onsitePhone, setOnsitePhone] = useState<string>("+256 700 000 000");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");

  const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
  const [graceEnabled, setGraceEnabled] = useState(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 2 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const graceMs = graceEndAt - nowTick;
  const graceActive = corporateStatus === "Billing delinquency" && graceEnabled && graceMs > 0;

  const [costCenter, setCostCenter] = useState<string>("CAPEX-01");
  const [projectTag, setProjectTag] = useState<string>("Fleet refresh");
  const [purpose, setPurpose] = useState<string>("Installation");

  // Pricing
  const selectedAddOns = useMemo(() => service.addOns.filter((a) => addOnIds.includes(a.id)), [service.addOns, addOnIds]);
  const addOnsTotal = useMemo(() => selectedAddOns.reduce((a, x) => a + x.priceUGX, 0), [selectedAddOns]);

  const base = useMemo(() => {
    if (service.priceModel === "Hourly") return durationHours * service.basePriceUGX;
    return service.basePriceUGX;
  }, [service.priceModel, service.basePriceUGX, durationHours]);

  const subtotal = useMemo(() => base + addOnsTotal, [base, addOnsTotal]);
  const discount = useMemo(() => {
    const v = vendorById[vendorId];
    if (!v) return 0;
    // Preferred vendors get small negotiated discount (demo)
    return v.status === "Preferred" ? Math.round(subtotal * 0.01) : 0;
  }, [vendorId, vendorById, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // Policy settings (demo)
  const [workStartHour, setWorkStartHour] = useState<number>(6);
  const [workEndHour, setWorkEndHour] = useState<number>(22);
  const [geoAllowed, setGeoAllowed] = useState<boolean>(true);

  const approvalThresholdUGX = 300000; // typical corporate threshold for service booking
  const hardBlockUGX = 2500000; // hard stop for user checkout; for bigger amounts use RFQ (U30)
  const unapprovedVendorApprovalUGX = 150000;
  const unapprovedVendorBlockUGX = 600000;

  const selectedSlot = useMemo(() => slots.find((s) => s.id === slotId) || null, [slots, slotId]);

  const requiredFieldsOk = useMemo(() => {
    const okContact = !service.requiredFields.onsiteContact || (!!onsiteName.trim() && !!onsitePhone.trim());
    const okAddr = !service.requiredFields.exactAddress || !!address.trim();
    return okContact && okAddr;
  }, [service.requiredFields, onsiteName, onsitePhone, address]);

  const vendor = vendorById[vendorId];

  const policy = useMemo(() => {
    return evaluateServicePolicy({
      paymentMethod,
      corporateStatus,
      graceActive,
      vendor,
      category: service.category,
      totalUGX: total,
      approvalThresholdUGX,
      hardBlockUGX,
      unapprovedVendorApprovalUGX,
      unapprovedVendorBlockUGX,
      selectedSlot,
      workStartHour,
      workEndHour,
      geoAllowed,
      requiredFieldsOk,
    });
  }, [
    paymentMethod,
    corporateStatus,
    graceActive,
    vendor,
    service.category,
    total,
    approvalThresholdUGX,
    hardBlockUGX,
    unapprovedVendorApprovalUGX,
    unapprovedVendorBlockUGX,
    selectedSlot,
    workStartHour,
    workEndHour,
    geoAllowed,
    requiredFieldsOk,
  ]);

  // Approval and reservation (hold)
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalId, setApprovalId] = useState<string>("");
  const [approvalStatus, setApprovalStatus] = useState<"None" | "Pending" | "Approved" | "Rejected">("None");

  const [reserveSlot, setReserveSlot] = useState(true);
  const [reserveMinutes, setReserveMinutes] = useState<number>(90);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);

  const [reasonText, setReasonText] = useState<string>("Project-critical installation. Requesting approval for corporate booking.");
  const [attachmentNames, setAttachmentNames] = useState<string>("SitePhoto.jpg, Requirements.pdf");

  const holdActive = useMemo(() => holdUntil !== null && holdUntil > nowTick, [holdUntil, nowTick]);

  useEffect(() => {
    if (holdUntil && holdUntil <= nowTick) {
      toast({ title: "Hold expired", message: "Slot hold expired. Choose a new slot to continue.", kind: "warn" });
      setHoldUntil(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick]);

  // Receipt
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // Helpers
  const applyPatch = (patch: Partial<Patch>) => {
    if (patch.paymentMethod) setPaymentMethod(patch.paymentMethod);
    if (patch.vendorId) setVendorId(patch.vendorId);
    if (patch.slotId) setSlotId(patch.slotId);
    if (patch.removeAddonId) setAddOnIds((prev) => prev.filter((x) => x !== patch.removeAddonId));
    if (typeof patch.setDurationHours === "number") setDurationHours(clamp(patch.setDurationHours, 1, 16));
  };

  const canContinue = useMemo(() => {
    if (step === "service") return true;
    if (step === "schedule") return !!selectedSlot && !!dateISO;
    if (step === "review") {
      if (paymentMethod === "CorporatePay") return requiredFieldsOk && !!costCenter.trim() && !!purpose.trim();
      return requiredFieldsOk;
    }
    return true;
  }, [step, selectedSlot, dateISO, paymentMethod, requiredFieldsOk, costCenter, purpose]);

  const nextStep = () => {
    if (!canContinue) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }
    setStep((s) => (s === "service" ? "schedule" : s === "schedule" ? "review" : s === "review" ? "receipt" : "receipt"));
  };

  const prevStep = () => {
    setStep((s) => (s === "receipt" ? "review" : s === "review" ? "schedule" : s === "schedule" ? "service" : "service"));
  };

  const openApproval = () => {
    if (!requiredFieldsOk || !costCenter.trim() || !purpose.trim()) {
      toast({ title: "Missing fields", message: "Add required booking fields, cost center, and purpose.", kind: "warn" });
      return;
    }
    setApprovalOpen(true);
  };

  const submitApproval = () => {
    if (reasonText.trim().length < 10) {
      toast({ title: "Reason required", message: "Add a clearer approval reason (min 10 chars).", kind: "warn" });
      return;
    }

    const id = `APR-SVC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setApprovalId(id);
    setApprovalStatus("Pending");

    if (reserveSlot) {
      const lock = Date.now() + clamp(reserveMinutes, 15, 480) * 60 * 1000;
      setHoldUntil(lock);
      toast({ title: "Slot reserved", message: `Reserved until ${fmtDateTime(lock)}.`, kind: "success" });
    } else {
      setHoldUntil(null);
    }

    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    setApprovalOpen(false);

    // Simulate decision
    window.setTimeout(() => {
      setApprovalStatus((prev) => {
        if (prev !== "Pending") return prev;
        const approved = Math.random() < 0.72;
        const next = approved ? "Approved" : "Rejected";
        toast({
          title: approved ? "Approved" : "Rejected",
          message: approved ? "Approval granted. You can confirm booking." : "Approval rejected. You may pay personally.",
          kind: approved ? "success" : "warn",
        });
        return next;
      });
    }, 4200);
  };

  const confirmBooking = () => {
    if (paymentMethod === "CorporatePay") {
      if (policy.outcome === "Blocked") {
        toast({ title: "Blocked", message: "This booking is blocked by policy.", kind: "error" });
        return;
      }

      if (policy.outcome === "Approval required") {
        if (approvalStatus !== "Approved") {
          openApproval();
          return;
        }
      }
    }

    if (holdUntil && holdUntil <= Date.now()) {
      toast({ title: "Hold expired", message: "Reservation expired. Choose a new slot.", kind: "warn" });
      setHoldUntil(null);
      setStep("schedule");
      return;
    }

    const id = `RCPT-SVC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const scheduleLabel = `${dateISO} • ${selectedSlot?.label || "-"}`;

    const r: Receipt = {
      id,
      createdAt: Date.now(),
      vendor: vendor.name,
      service: service.name,
      category: service.category,
      address,
      scheduleLabel,
      durationHours,
      subtotalUGX: subtotal,
      discountUGX: discount,
      totalUGX: total,
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      costCenter: paymentMethod === "CorporatePay" ? costCenter : undefined,
      projectTag: paymentMethod === "CorporatePay" ? projectTag : undefined,
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
      approvalId: paymentMethod === "CorporatePay" ? approvalId || undefined : undefined,
      holdUntil: holdUntil || undefined,
      notes: [
        paymentMethod === "CorporatePay" ? "Corporate receipt generated" : "Personal receipt generated",
        vendor.status === "Preferred" ? "Preferred vendor discount applied" : "Standard pricing",
        holdActive ? "Slot reserved during approval" : "No reservation",
      ],
    };

    setReceipt(r);
    toast({ title: "Booked", message: `Booking confirmed. Receipt ${id}.`, kind: "success" });
    setStep("receipt");
  };

  const reset = () => {
    setReceipt(null);
    setApprovalId("");
    setApprovalStatus("None");
    setHoldUntil(null);
    setStep("service");
    toast({ title: "Reset", message: "Checkout reset.", kind: "info" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1300px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">U29 Services Booking Checkout with CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">ServiceMart bookings: schedule, location, corporate controls, approvals, and reservation holds</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Step: ${step}`} tone="neutral" />
                    <Pill label={`Pay: ${paymentMethod}`} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                    <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                    {paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? <Pill label="Approval may be required" tone="warn" /> : null}
                    {holdActive && holdUntil ? <Pill label={`Reserved ${msToFriendly(holdUntil - nowTick)}`} tone="info" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Exit", message: "Back to ServiceMart listing (demo).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Exit
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open U3 Corporate Policies Summary (demo).", kind: "info" })}>
                  <ShieldCheck className="h-4 w-4" /> Policies
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 Corporate Receipts (demo).", kind: "info" })}>
                  <FileText className="h-4 w-4" /> Receipts
                </Button>
              </div>
            </div>

            {/* Step tabs */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {([
                { k: "service", label: "Service" },
                { k: "schedule", label: "Schedule" },
                { k: "review", label: "Review" },
                { k: "receipt", label: "Receipt" },
              ] as Array<{ k: Step; label: string }>).map((t) => {
                const active = step === t.k;
                return (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setStep(t.k)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="text-xs font-semibold text-slate-600">{t.label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Step</div>
                  </button>
                );
              })}
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
                      title="Service"
                      subtitle="Choose provider and add-ons"
                      right={<Pill label={service.priceModel} tone="neutral" />}
                    >
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label="ServiceMart" tone="accent" />
                              <Pill label={service.category} tone="neutral" />
                              <Pill label={`${service.estimatedHours}h est`} tone="neutral" />
                            </div>
                            <div className="mt-2 text-base font-semibold text-slate-900">{service.name}</div>
                            <div className="mt-1 text-sm text-slate-600">{service.shortDesc}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Base</div>
                            <div className="text-2xl font-semibold text-slate-900">{formatUGX(service.basePriceUGX)}</div>
                            <div className="mt-1 text-xs text-slate-500">{service.priceModel === "Hourly" ? "per hour" : "fixed"}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold text-slate-600">Included</div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {service.included.map((x) => (
                                <li key={x} className="flex items-start gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                                  <span>{x}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold text-slate-600">Not included</div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {service.exclusions.map((x) => (
                                <li key={x} className="flex items-start gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                                  <span>{x}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {service.priceModel === "Hourly" ? (
                          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Estimated duration</div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="range"
                                min={1}
                                max={16}
                                value={durationHours}
                                onChange={(e) => setDurationHours(clamp(Number(e.target.value || 0), 1, 16))}
                                className="w-full"
                              />
                              <Pill label={`${durationHours}h`} tone="info" />
                            </div>
                            <div className="mt-2 text-xs text-slate-500">Hourly pricing recalculates totals.</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Provider</div>
                              <div className="mt-1 text-xs text-slate-500">Vendor allowlist and compliance docs</div>
                            </div>
                            <Pill label={vendor.status} tone={toneForVendor(vendor.status)} />
                          </div>

                          <div className="mt-3 space-y-2">
                            {vendors.map((v) => {
                              const selected = v.id === vendorId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setVendorId(v.id);
                                    toast({ title: "Vendor selected", message: v.name, kind: "success" });
                                  }}
                                  className={cn(
                                    "w-full rounded-3xl border p-4 text-left transition",
                                    selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                        <Pill label={v.status} tone={toneForVendor(v.status)} />
                                        <Pill label={`${v.rating.toFixed(1)}★`} tone="neutral" />
                                        {v.verified ? <Pill label="Verified" tone="good" /> : <Pill label="Unverified" tone="warn" />}
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500">{v.jobsDone} jobs • Responds in {v.responseHours}h • {v.baseRegion}</div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {v.complianceDocs.slice(0, 3).map((d) => (
                                          <Pill
                                            key={`${v.id}-${d.name}`}
                                            label={`${d.name}: ${d.status}`}
                                            tone={d.status === "Verified" ? "good" : d.status === "Pending" ? "warn" : "bad"}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                                      {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Cancellation: {vendor.cancellationPolicy}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Add-ons</div>
                              <div className="mt-1 text-xs text-slate-500">Optional services</div>
                            </div>
                            <Pill label={`${selectedAddOns.length}`} tone="neutral" />
                          </div>

                          <div className="mt-3 space-y-2">
                            {service.addOns.map((a) => {
                              const on = addOnIds.includes(a.id);
                              return (
                                <label key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={on}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAddOnIds((prev) => (checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)));
                                      }}
                                      className="mt-1 h-4 w-4 rounded border-slate-300"
                                    />
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{a.label}</div>
                                        {a.risk ? <Pill label={`Risk ${a.risk}`} tone={a.risk === "High" ? "bad" : a.risk === "Medium" ? "warn" : "good"} /> : null}
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500">{formatUGX(a.priceUGX)}</div>
                                    </div>
                                  </div>
                                  {on ? <Pill label="Added" tone="info" /> : <Pill label="Optional" tone="neutral" />}
                                </label>
                              );
                            })}
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: recommend add-ons based on asset type and past bookings.
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "schedule" ? (
                  <Section
                    title="Schedule"
                    subtitle="Pick date, time slot, and location"
                    right={<Pill label={selectedSlot ? selectedSlot.label : "No slot"} tone={selectedSlot ? "info" : "warn"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">When</div>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label>
                              <div className="text-xs font-semibold text-slate-600">Date</div>
                              <input
                                type="date"
                                value={dateISO}
                                onChange={(e) => setDateISO(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                              />
                            </label>
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Policy hours</div>
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="number"
                                  value={workStartHour}
                                  onChange={(e) => setWorkStartHour(clamp(Number(e.target.value || 0), 0, 23))}
                                  className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                                />
                                <span className="text-sm text-slate-600">to</span>
                                <input
                                  type="number"
                                  value={workEndHour}
                                  onChange={(e) => setWorkEndHour(clamp(Number(e.target.value || 0), 0, 23))}
                                  className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                                />
                                <Pill label="Policy" tone="neutral" />
                              </div>
                              <div className="mt-2 text-xs text-slate-500">Outside policy hours may require approval.</div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm font-semibold text-slate-900">Slots</div>
                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                              {slots.map((s) => {
                                const selected = s.id === slotId;
                                const inPolicy = s.startHour >= workStartHour && s.endHour <= workEndHour;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSlotId(s.id)}
                                    className={cn(
                                      "rounded-3xl border p-4 text-left transition",
                                      selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                                          {s.isPopular ? <Pill label="Popular" tone="accent" /> : null}
                                          {!inPolicy ? <Pill label="Outside policy" tone="warn" /> : <Pill label="Policy OK" tone="good" />}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{vendor.responseHours}h response • {vendor.travelRadiusKm}km radius</div>
                                      </div>
                                      <ChevronRight className="h-5 w-5 text-slate-400" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {holdActive && holdUntil ? (
                            <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">Reservation hold active</div>
                                  <div className="mt-1 text-sm text-slate-700">Slot reserved until {fmtDateTime(holdUntil)}.</div>
                                </div>
                                <Pill label={`Remaining ${msToFriendly(holdUntil - nowTick)}`} tone="info" />
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Where</div>
                          <div className="mt-2 text-xs text-slate-500">Exact address required for dispatch</div>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="md:col-span-2">
                              <div className="text-xs font-semibold text-slate-600">Address</div>
                              <input
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={cn(
                                  "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                  address.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                                )}
                                placeholder="Enter service address"
                              />
                            </label>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-xs font-semibold text-slate-600">Geo policy</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">{geoAllowed ? "Allowed" : "Blocked"}</div>
                                  <div className="mt-1 text-xs text-slate-500">Toggle to simulate policy</div>
                                </div>
                                <button
                                  type="button"
                                  className={cn(
                                    "relative h-7 w-12 rounded-full border transition",
                                    geoAllowed ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                                  )}
                                  onClick={() => setGeoAllowed((v) => !v)}
                                  aria-label="Toggle geo"
                                >
                                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", geoAllowed ? "left-[22px]" : "left-1")} />
                                </button>
                              </div>
                              <div className="mt-3 text-xs text-slate-600">In production: geo-fences and office zones.</div>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold text-slate-600">Map</div>
                              <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                                Map preview placeholder
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Onsite contact</div>
                          <div className="mt-3 grid grid-cols-1 gap-3">
                            <label>
                              <div className="text-xs font-semibold text-slate-600">Name</div>
                              <input
                                value={onsiteName}
                                onChange={(e) => setOnsiteName(e.target.value)}
                                className={cn(
                                  "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                  onsiteName.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                                )}
                              />
                            </label>
                            <label>
                              <div className="text-xs font-semibold text-slate-600">Phone</div>
                              <input
                                value={onsitePhone}
                                onChange={(e) => setOnsitePhone(e.target.value)}
                                className={cn(
                                  "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                  onsitePhone.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                                )}
                              />
                            </label>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Required: onsite contact for dispatch and completion proof.
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Reservation hold (premium)</div>
                          <div className="mt-1 text-xs text-slate-500">Reserve slot while approvals are pending</div>
                          <div className="mt-3 flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Reserve slot</div>
                              <div className="mt-1 text-xs text-slate-600">Holds the slot for a limited time</div>
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                reserveSlot ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => setReserveSlot((v) => !v)}
                              aria-label="Toggle reserve"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", reserveSlot ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                          <div className={cn("mt-3", !reserveSlot && "opacity-60")}>
                            <div className="text-xs font-semibold text-slate-600">Hold minutes</div>
                            <input
                              type="number"
                              value={reserveMinutes}
                              disabled={!reserveSlot}
                              onChange={(e) => setReserveMinutes(clamp(Number(e.target.value || 0), 15, 480))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Section>
                ) : null}

                {step === "review" ? (
                  <>
                    <Section
                      title="Review"
                      subtitle="Corporate tags, policy result, and confirmation"
                      right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                    >
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-7 space-y-4">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Payment method</div>
                            <div className="mt-3 space-y-2">
                              {([
                                { id: "CorporatePay" as const, title: "CorporatePay", sub: "Company-paid with approvals", icon: <Building2 className="h-5 w-5" /> },
                                { id: "Personal Wallet" as const, title: "Personal Wallet", sub: "Pay from personal wallet", icon: <Wallet className="h-5 w-5" /> },
                                { id: "Card" as const, title: "Card", sub: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
                                { id: "Mobile Money" as const, title: "Mobile Money", sub: "MTN/Airtel", icon: <Phone className="h-5 w-5" /> },
                              ] as const).map((m) => {
                                const selected = paymentMethod === m.id;
                                const disabled = m.id === "CorporatePay" && (corporateStatus === "Not linked" || corporateStatus === "Not eligible" || corporateStatus === "Deposit depleted" || corporateStatus === "Credit limit exceeded" || (corporateStatus === "Billing delinquency" && !graceActive));

                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) {
                                        toast({ title: "Unavailable", message: "CorporatePay is not available.", kind: "warn" });
                                        return;
                                      }
                                      setPaymentMethod(m.id);
                                      toast({ title: "Selected", message: m.title, kind: "success" });
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
                                            {m.id === "CorporatePay" ? (
                                              <>
                                                <Pill label={corporateStatus} tone={corporateStatus === "Eligible" ? "good" : graceActive ? "warn" : "bad"} />
                                                {graceActive ? <Pill label={`Grace ${msToFriendly(graceMs)}`} tone="warn" /> : null}
                                              </>
                                            ) : null}
                                          </div>
                                          <div className="mt-1 text-sm text-slate-600">{m.sub}</div>
                                        </div>
                                      </div>
                                      <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                                        {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Demo controls */}
                            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">Demo: Corporate status</div>
                                  <div className="mt-1 text-xs text-slate-600">Switch to test enforcement</div>
                                </div>
                                <Pill label="Demo" tone="neutral" />
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <label>
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
                                </label>

                                <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", corporateStatus !== "Billing delinquency" && "opacity-60")}>
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
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Pill label={graceActive ? `Active ${msToFriendly(graceMs)}` : "Inactive"} tone={graceActive ? "warn" : "neutral"} />
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => setGraceEndAt(Date.now() + 2 * 60 * 60 * 1000)}
                                      disabled={corporateStatus !== "Billing delinquency"}
                                    >
                                      <RefreshCcw className="h-4 w-4" /> Reset
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {paymentMethod === "CorporatePay" ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">Corporate tags</div>
                                  <div className="mt-1 text-xs text-slate-500">Required for billing and reporting</div>
                                </div>
                                <Pill label="Required" tone="warn" />
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <label>
                                  <div className="text-xs font-semibold text-slate-600">Cost center</div>
                                  <select
                                    value={costCenter}
                                    onChange={(e) => setCostCenter(e.target.value)}
                                    className={cn(
                                      "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                                      costCenter.trim() ? "border-slate-200 bg-white text-slate-900" : "border-amber-300 bg-white text-slate-900"
                                    )}
                                  >
                                    {[
                                      "CAPEX-01",
                                      "OPS-01",
                                      "OPS-02",
                                      "SAL-03",
                                      "FIN-01",
                                      "FLEET-01",
                                    ].map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  <div className="text-xs font-semibold text-slate-600">Purpose</div>
                                  <select
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className={cn(
                                      "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                                      purpose.trim() ? "border-slate-200 bg-white text-slate-900" : "border-amber-300 bg-white text-slate-900"
                                    )}
                                  >
                                    {[
                                      "Installation",
                                      "Maintenance",
                                      "Repair",
                                      "Training",
                                      "Project",
                                      "Other",
                                    ].map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="md:col-span-2">
                                  <div className="text-xs font-semibold text-slate-600">Project tag (optional)</div>
                                  <input
                                    value={projectTag}
                                    onChange={(e) => setProjectTag(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                                    placeholder="Client/event/campaign"
                                  />
                                </label>
                              </div>

                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Missing tags can cause declines. CorporatePay receipts include purpose and cost center.
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="lg:col-span-5 space-y-4">
                          <div className={cn(
                            "rounded-3xl border p-4",
                            policy.outcome === "Allowed" ? "border-emerald-200 bg-emerald-50" : policy.outcome === "Approval required" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                          )}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Policy result</div>
                                <div className="mt-1 text-sm text-slate-700">{policy.outcome}</div>
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
                                        <Pill label={r.code} tone={toneForSeverity(r.severity)} />
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
                              {paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                                <Button variant="primary" onClick={openApproval}>
                                  <ChevronRight className="h-4 w-4" /> Submit for approval
                                </Button>
                              ) : null}

                              <Button variant="outline" onClick={() => applyPatch({ paymentMethod: "Personal Wallet" })}>
                                <Wallet className="h-4 w-4" /> Pay personally
                              </Button>
                            </div>

                            {approvalStatus !== "None" ? (
                              <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                Approval: <span className="font-semibold">{approvalId}</span> • Status: <span className="font-semibold">{approvalStatus}</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Alternatives</div>
                            <div className="mt-3 grid grid-cols-1 gap-3">
                              {policy.alternatives.map((a) => (
                                <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                        <Pill label={a.expected} tone={toneForOutcome(a.expected)} />
                                      </div>
                                      <div className="mt-1 text-sm text-slate-600">{a.desc}</div>
                                    </div>
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => applyPatch(a.patch)}>
                                      <ChevronRight className="h-4 w-4" /> Apply
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Confirm</div>
                            <div className="mt-2 text-sm text-slate-600">Confirm booking and generate receipt.</div>
                            <div className="mt-3">
                              <Button variant="primary" className="w-full" onClick={confirmBooking}>
                                <BadgeCheck className="h-4 w-4" /> Confirm booking
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "receipt" ? (
                  <Section title="Receipt" subtitle="Corporate receipt per booking" right={<Pill label={receipt ? receipt.id : "-"} tone={receipt ? "good" : "neutral"} />}>
                    {!receipt ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">No receipt yet.</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={receipt.corporate ? "CorporatePay" : "Personal"} tone={receipt.corporate ? "info" : "neutral"} />
                                {receipt.approvalId ? <Pill label={`Approval ${receipt.approvalId}`} tone="neutral" /> : null}
                                {receipt.holdUntil ? <Pill label={`Hold until ${fmtDateTime(receipt.holdUntil)}`} tone="neutral" /> : null}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{receipt.service}</div>
                              <div className="mt-1 text-xs text-slate-500">Provider: {receipt.vendor}</div>
                              <div className="mt-1 text-xs text-slate-500">Schedule: {receipt.scheduleLabel}</div>
                              <div className="mt-1 text-xs text-slate-500">Address: {receipt.address}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Total</div>
                              <div className="text-2xl font-semibold text-slate-900">{formatUGX(receipt.totalUGX)}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(receipt.createdAt)}</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <InfoRow label="Subtotal" value={formatUGX(receipt.subtotalUGX)} />
                            <InfoRow label="Discount" value={`-${formatUGX(receipt.discountUGX)}`} />
                            <InfoRow label="Payment" value={receipt.paymentMethod} emphasize />
                            <InfoRow label="Duration" value={`${receipt.durationHours}h`} />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Notes:
                            <ul className="mt-2 space-y-1">
                              {receipt.notes.map((n) => (
                                <li key={n}>• {n}</li>
                              ))}
                            </ul>
                          </div>

                          {receipt.corporate ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Cost center: {receipt.costCenter} • Purpose: {receipt.purpose} • Project: {receipt.projectTag || "-"}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(receipt.id);
                                toast({ title: "Copied", message: "Receipt ID copied.", kind: "success" });
                              } catch {
                                toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" /> Copy receipt ID
                          </Button>
                          <Button variant="outline" onClick={() => toast({ title: "Export", message: "Export PDF (use Print-to-PDF in production).", kind: "info" })}>
                            <Download className="h-4 w-4" /> Export
                          </Button>
                          <Button variant="outline" onClick={reset}>
                            <RefreshCcw className="h-4 w-4" /> New booking
                          </Button>
                        </div>
                      </div>
                    )}
                  </Section>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="Summary"
                  subtitle="Live totals and key details"
                  right={<Pill label={formatUGX(total)} tone="neutral" />}
                >
                  <div className="space-y-2">
                    <InfoRow label="Service" value={service.name} />
                    <InfoRow label="Vendor" value={vendor.name} emphasize={vendor.status === "Preferred"} />
                    <InfoRow label="Schedule" value={`${dateISO} • ${selectedSlot?.label || "Select"}`} emphasize={!selectedSlot} />
                    <InfoRow label="Address" value={address || "Required"} emphasize={!address.trim()} />
                    <InfoRow label="Payment" value={paymentMethod} emphasize={paymentMethod === "CorporatePay"} />
                    <InfoRow label="Policy" value={policy.outcome} emphasize={policy.outcome !== "Allowed"} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Base</span>
                      <span className="text-sm font-semibold">{formatUGX(base)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Add-ons</span>
                      <span className="text-sm font-semibold">{formatUGX(addOnsTotal)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Discount</span>
                      <span className="text-sm font-semibold">-{formatUGX(discount)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Total</span>
                      <span className="text-base font-semibold text-slate-900">{formatUGX(total)}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    If total exceeds the approval threshold, CorporatePay may require approval. For very high values, use RFQ.
                  </div>
                </Section>

                <Section title="Approval and hold" subtitle="Only when required" right={<Pill label={approvalStatus === "None" ? "N/A" : approvalStatus} tone={approvalStatus === "Approved" ? "good" : approvalStatus === "Rejected" ? "bad" : approvalStatus === "Pending" ? "warn" : "neutral"} />}>
                  <div className="space-y-2">
                    <InfoRow label="Threshold" value={formatUGX(approvalThresholdUGX)} />
                    <InfoRow label="Requires approval" value={paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? "Yes" : "No"} emphasize={paymentMethod === "CorporatePay" && policy.outcome === "Approval required"} />
                    <InfoRow label="Reservation" value={holdActive && holdUntil ? `Active (${msToFriendly(holdUntil - nowTick)})` : "None"} emphasize={!!holdActive} />
                    {approvalId ? <InfoRow label="Approval ID" value={approvalId} emphasize /> : null}
                  </div>

                  {paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                    <div className="mt-3">
                      <Button variant="primary" className="w-full" onClick={openApproval}>
                        <ChevronRight className="h-4 w-4" /> Submit for approval
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      No approval required for current selection.
                    </div>
                  )}
                </Section>
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                  <Pill label={`Total: ${formatUGX(total)}`} tone="neutral" />
                  {paymentMethod === "CorporatePay" ? <Pill label="CorporatePay" tone="info" /> : <Pill label="Personal" tone="neutral" />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={prevStep} disabled={step === "service"}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>

                  {step !== "receipt" ? (
                    <Button variant={canContinue ? "primary" : "outline"} onClick={nextStep} disabled={!canContinue}>
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={reset}>
                      <RefreshCcw className="h-4 w-4" /> New
                    </Button>
                  )}

                  {step === "review" ? (
                    <Button variant="accent" onClick={confirmBooking}>
                      <BadgeCheck className="h-4 w-4" /> Confirm
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U29 Services Booking Checkout with CorporatePay (ServiceMart). Core: schedule, location, corporate tags, policy check, approvals, reservation hold, and receipt.
            </div>
          </div>
        </div>
      </div>

      {/* Approval modal */}
      <Modal
        open={approvalOpen}
        title="Submit for corporate approval"
        subtitle="Reserve the slot while approval is pending (optional)"
        onClose={() => setApprovalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitApproval}>
              <ChevronRight className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="960px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={service.category} tone="neutral" />
              <Pill label={vendor.status} tone={toneForVendor(vendor.status)} />
              <Pill label={`Total ${formatUGX(total)}`} tone="neutral" />
              <Pill label={`${dateISO} • ${selectedSlot?.label || "-"}`} tone="neutral" />
              {holdActive && holdUntil ? <Pill label={`Reserved ${msToFriendly(holdUntil - nowTick)}`} tone="info" /> : null}
            </div>
            <div className="mt-3 text-sm text-slate-700">
              Corporate tags: <span className="font-semibold">{costCenter}</span> • <span className="font-semibold">{purpose}</span> • <span className="font-semibold">{projectTag || "-"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Reason</div>
              <div className="mt-2 text-xs text-slate-500">Required for audit</div>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                rows={4}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Explain why approval is needed"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Attachments</div>
              <div className="mt-2 text-xs text-slate-500">Optional file names (demo)</div>
              <input
                value={attachmentNames}
                onChange={(e) => setAttachmentNames(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                placeholder="Example: SitePhoto.jpg, Requirements.pdf"
              />
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                In production: file upload + virus scanning + audit links.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Reserve slot</div>
                <div className="mt-1 text-xs text-slate-600">Premium: reserve slot while approval is pending</div>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  reserveSlot ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                )}
                onClick={() => setReserveSlot((v) => !v)}
                aria-label="Toggle reserve"
              >
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", reserveSlot ? "left-[22px]" : "left-1")} />
              </button>
            </div>

            <div className={cn("mt-3", !reserveSlot && "opacity-60")}>
              <div className="text-xs font-semibold text-slate-600">Reserve minutes</div>
              <input
                type="number"
                value={reserveMinutes}
                disabled={!reserveSlot}
                onChange={(e) => setReserveMinutes(clamp(Number(e.target.value || 0), 15, 480))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
              <div className="mt-2 text-xs text-slate-500">Suggested: 60–120 minutes</div>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            SLA, comments, and decision logs are handled in the Approvals Inbox (K) on the admin side.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-emerald-900")}>{value}</div>
    </div>
  );
}
