import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Info,
  MapPin,
  Package,
  Paperclip,
  RefreshCcw,
  ShieldCheck,
  Timer,
  Upload,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type StepKey = "Delivery details" | "Vendor and service" | "Allocation" | "Proof requirements" | "Review";

type DeliveryType = "Documents" | "Parcel" | "Electronics" | "Medical" | "Food" | "Other";

type DeliverySpeed = "Standard" | "Express" | "Same-day";

type VehicleClass = "Bike" | "Car" | "Van";

type ProofType = "Pickup photo" | "Drop-off photo" | "Recipient signature" | "ID check";

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

type Severity = "Info" | "Warning" | "Critical";

type PolicyReason = {
  id: string;
  severity: Severity;
  code: string;
  title: string;
  detail: string;
};

type AuditWhy = {
  summary: string;
  triggers: Array<{ label: string; value: string }>;
  policyPath: Array<{ step: string; detail: string }>;
  audit: Array<{ label: string; value: string }>;
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type VendorPolicy = "Allowed" | "Restricted" | "Blocked";

type Vendor = {
  id: string;
  name: string;
  policy: VendorPolicy;
  notes: string;
  capabilities: Array<"Bike" | "Car" | "Van" | "Same-day" | "Express">;
  proofDefaults: ProofType[];
};

type DeliveryModel = {
  pickup: string;
  dropoff: string;
  distanceKm: number;
  weightKg: number;
  declaredValueUGX: number;
  packageType: DeliveryType;
  fragile: boolean;
  insurance: boolean;
  schedule: "Now" | "Scheduled";
  scheduledAt: string;
  speed: DeliverySpeed;
  vehicleClass: VehicleClass;
  vendorId: string;
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceEnabled: boolean;
  graceEndAt: number;
  // allocation
  costCenter: string;
  projectTag: string;
  purpose: string;
  notes: string;
  // proof
  proof: Record<ProofType, boolean>;
  // attachments (optional)
  attachments: Attachment[];
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

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
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  t.kind === "warn" && "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                  t.kind === "error" && "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                  t.kind === "info" && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</div>
                {t.message ? <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{t.message}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
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
          <motion.div className="fixed inset-0 z-40 bg-black/35 dark:bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)] dark:border-slate-700 dark:bg-slate-800"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4 dark:bg-slate-900">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-700">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800")}>
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-amber-900 dark:text-amber-100")}>{value}</div>
    </div>
  );
}

function ChecklistRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30")}>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{hint}</div> : null}
      </div>
      {ok ? <Pill label="OK" tone="good" /> : <Pill label="Fix" tone="warn" />}
    </div>
  );
}

function Stepper({ steps, active, onJump }: { steps: StepKey[]; active: StepKey; onJump: (k: StepKey) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {steps.map((s, idx) => {
          const isActive = s === active;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onJump(s)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                isActive ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              )}
            >
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Step {idx + 1}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{s}</div>
            </button>
          );
        })}
      </div>
    </div>
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

function estimateDeliveryCostUGX(args: {
  distanceKm: number;
  weightKg: number;
  declaredValueUGX: number;
  speed: DeliverySpeed;
  vehicleClass: VehicleClass;
  insurance: boolean;
}): { base: number; distanceFee: number; weightFee: number; insuranceFee: number; multiplier: number; total: number } {
  const base = 8000;
  const distanceFee = Math.round(Math.max(0, args.distanceKm) * 1200);
  const weightFee = Math.round(Math.max(0, args.weightKg) * 250);

  const speedMult = args.speed === "Standard" ? 1 : args.speed === "Express" ? 1.4 : 1.8;
  const vehicleMult = args.vehicleClass === "Bike" ? 1 : args.vehicleClass === "Car" ? 1.25 : 1.6;
  const multiplier = speedMult * vehicleMult;

  const subtotal = Math.round((base + distanceFee + weightFee) * multiplier);
  const insuranceFee = args.insurance ? Math.round(Math.max(0, args.declaredValueUGX) * 0.01) : 0;
  const total = subtotal + insuranceFee;

  return { base, distanceFee, weightFee, insuranceFee, multiplier: Math.round(multiplier * 100) / 100, total };
}

function requiredProofFor(args: { type: DeliveryType; valueUGX: number; speed: DeliverySpeed }): ProofType[] {
  const required: ProofType[] = [];

  // Always require at least drop-off photo for corporate
  required.push("Drop-off photo");

  if (args.type === "Medical") {
    required.push("Recipient signature");
    required.push("ID check");
  }

  if (args.type === "Electronics") {
    required.push("Recipient signature");
  }

  if (args.valueUGX >= 500000) {
    if (!required.includes("Recipient signature")) required.push("Recipient signature");
  }

  if (args.valueUGX >= 1500000) {
    if (!required.includes("Pickup photo")) required.push("Pickup photo");
  }

  if (args.speed === "Same-day") {
    // reduce disputes: pickup photo
    if (!required.includes("Pickup photo")) required.push("Pickup photo");
  }

  return required;
}

function evaluateDeliveryPolicy(args: {
  model: DeliveryModel;
  vendor: Vendor;
  estTotalUGX: number;
  approvalThresholdUGX: number;
  highValueThresholdUGX: number;
  geoAllowed: boolean;
  timeAllowed: boolean;
  requiredProof: ProofType[];
}): { outcome: Outcome; reasons: PolicyReason[]; why: AuditWhy } {
  const { model, vendor, estTotalUGX, approvalThresholdUGX, highValueThresholdUGX, geoAllowed, timeAllowed, requiredProof } = args;

  const reasons: PolicyReason[] = [];

  // Basic delivery details
  if (!model.pickup.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Pickup required", detail: "Enter pickup location." });
  if (!model.dropoff.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Drop-off required", detail: "Enter drop-off location." });
  if (model.distanceKm <= 0) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Distance required", detail: "Enter an estimated distance (km)." });

  // Geo/time controls
  if (!geoAllowed) reasons.push({ id: uid("r"), severity: "Critical", code: "GEO", title: "Outside allowed zone", detail: "Delivery route is outside corporate allowed zones." });
  if (!timeAllowed) reasons.push({ id: uid("r"), severity: "Critical", code: "TIME", title: "Outside allowed time", detail: "Corporate deliveries are restricted outside time windows." });

  // Vendor policy
  if (vendor.policy === "Blocked") {
    reasons.push({ id: uid("r"), severity: "Critical", code: "VENDOR", title: "Vendor blocked", detail: "This vendor is blocked by corporate policy." });
  } else if (vendor.policy === "Restricted") {
    reasons.push({ id: uid("r"), severity: "Warning", code: "VENDOR", title: "Vendor restricted", detail: "This vendor requires Procurement approval." });
  }

  // Proof requirements (must be selected)
  for (const p of requiredProof) {
    if (!model.proof[p]) {
      reasons.push({ id: uid("r"), severity: "Critical", code: "PROOF", title: "Proof requirement missing", detail: `Enable required proof: ${p}.` });
    }
  }

  // Corporate program enforcement
  if (model.paymentMethod === "CorporatePay") {
    const blockedByProgram =
      model.corporateStatus === "Not linked" ||
      model.corporateStatus === "Not eligible" ||
      model.corporateStatus === "Deposit depleted" ||
      model.corporateStatus === "Credit limit exceeded" ||
      (model.corporateStatus === "Billing delinquency" && !(model.graceEnabled && model.graceEndAt > Date.now()));

    if (model.corporateStatus === "Billing delinquency" && model.graceEnabled && model.graceEndAt > Date.now()) {
      reasons.push({ id: uid("r"), severity: "Warning", code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace window is active." });
    }

    if (blockedByProgram) {
      reasons.push({ id: uid("r"), severity: "Critical", code: "PROGRAM", title: "CorporatePay unavailable", detail: `CorporatePay is unavailable due to: ${model.corporateStatus}.` });
    }

    // Allocation
    if (!model.costCenter.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "ALLOC", title: "Cost center required", detail: "Select a cost center for corporate allocation." });
    if (!model.purpose.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "ALLOC", title: "Purpose required", detail: "Select a purpose tag for corporate compliance." });

    if (!model.projectTag.trim()) {
      reasons.push({ id: uid("r"), severity: "Info", code: "ALLOC", title: "Project tag optional", detail: "Project tag is optional unless your org enforces it." });
    }

    // Thresholds
    if (estTotalUGX > approvalThresholdUGX) {
      reasons.push({ id: uid("r"), severity: "Warning", code: "AMOUNT", title: "Approval required", detail: `Estimated cost ${formatUGX(estTotalUGX)} exceeds threshold ${formatUGX(approvalThresholdUGX)}.` });
    }

    if (model.declaredValueUGX >= highValueThresholdUGX) {
      reasons.push({ id: uid("r"), severity: "Warning", code: "VALUE", title: "High-value delivery", detail: `Declared value ${formatUGX(model.declaredValueUGX)} triggers additional scrutiny and may require approval.` });
    }

    if (!model.notes.trim() && (estTotalUGX > approvalThresholdUGX || vendor.policy !== "Allowed" || model.declaredValueUGX >= highValueThresholdUGX)) {
      reasons.push({ id: uid("r"), severity: "Info", code: "NOTE", title: "Add a note", detail: "Add context to speed up approvals and reduce rework." });
    }
  } else {
    reasons.push({ id: uid("r"), severity: "Info", code: "PAYMENT", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
  }

  // Outcome
  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarning = reasons.some((r) => r.severity === "Warning");

  let outcome: Outcome = "Allowed";
  if (model.paymentMethod === "CorporatePay") {
    if (hasCritical) outcome = "Blocked";
    else if (hasWarning) outcome = "Approval required";
    else outcome = "Allowed";
  } else {
    outcome = hasCritical ? "Blocked" : "Allowed";
  }

  const why: AuditWhy = {
    summary: "Delivery checkout result is computed from vendor policy, proof requirements, allocation rules, and CorporatePay program status.",
    triggers: [
      { label: "Vendor", value: vendor.name + ` (${vendor.policy})` },
      { label: "Type", value: model.packageType },
      { label: "Speed", value: model.speed },
      { label: "Vehicle", value: model.vehicleClass },
      { label: "Est cost", value: formatUGX(estTotalUGX) },
      { label: "Payment", value: model.paymentMethod },
      { label: "Program", value: model.corporateStatus },
    ],
    policyPath: [
      { step: "Route controls", detail: `${geoAllowed ? "Geo ok" : "Geo blocked"}, ${timeAllowed ? "Time ok" : "Time blocked"}.` },
      { step: "Vendor policy", detail: vendor.policy === "Allowed" ? "Allowed" : vendor.policy === "Restricted" ? "Approval required" : "Blocked" },
      { step: "Proof", detail: `Required proofs: ${requiredProof.join(", ")}.` },
      { step: "Allocation", detail: model.paymentMethod === "CorporatePay" ? "Cost center and purpose required." : "Not required" },
      { step: "Thresholds", detail: `Approval threshold: ${formatUGX(approvalThresholdUGX)}.` },
      { step: "Decision", detail: outcome },
    ],
    audit: [
      { label: "Correlation id", value: "corr_demo_u28" },
      { label: "Policy snapshot", value: "corp.delivery.policy.v1" },
      { label: "Timestamp", value: new Date().toISOString() },
    ],
  };

  if (!reasons.length) {
    reasons.push({ id: uid("r"), severity: "Info", code: "OK", title: "Within policy", detail: "This delivery passes current policy checks." });
  }

  return { outcome, reasons, why };
}

function exportReviewToPrint(args: {
  model: DeliveryModel;
  vendor: Vendor;
  est: { base: number; distanceFee: number; weightFee: number; insuranceFee: number; multiplier: number; total: number };
  outcome: Outcome;
  requiredProof: ProofType[];
}) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  const proofRows = args.requiredProof
    .map((p) => `<li>${escapeHtml(p)}: ${args.model.proof[p] ? "Enabled" : "Missing"}</li>`)
    .join("\n");

  const attRows = args.model.attachments
    .map((a) => `<li>${escapeHtml(a.name)} (${escapeHtml(formatBytes(a.size))})</li>`)
    .join("\n");

  w.document.write(`
    <html>
      <head>
        <title>Delivery checkout summary</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          h2{font-size:14px; margin:16px 0 8px;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          ul{margin:0; padding-left:18px;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">CorporatePay</div>
            <h1 style="margin-top:10px;">Delivery checkout</h1>
            <div class="muted" style="margin-top:6px;">Vendor: ${escapeHtml(args.vendor.name)} • Outcome: ${escapeHtml(args.outcome)}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Estimated total</div>
            <div style="font-weight:900; font-size:18px;">${escapeHtml(formatUGX(args.est.total))}</div>
            <div class="muted" style="margin-top:6px;">Payment: ${escapeHtml(args.model.paymentMethod)}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Delivery</h2>
          <div class="muted">Pickup: ${escapeHtml(args.model.pickup || "-")}</div>
          <div class="muted">Drop-off: ${escapeHtml(args.model.dropoff || "-")}</div>
          <div class="muted" style="margin-top:6px;">Distance: ${escapeHtml(String(args.model.distanceKm))} km • Weight: ${escapeHtml(String(args.model.weightKg))} kg</div>
          <div class="muted" style="margin-top:6px;">Type: ${escapeHtml(args.model.packageType)} • Value: ${escapeHtml(formatUGX(args.model.declaredValueUGX))}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Pricing</h2>
          <div class="muted">Base: ${escapeHtml(formatUGX(args.est.base))} • Distance: ${escapeHtml(formatUGX(args.est.distanceFee))} • Weight: ${escapeHtml(formatUGX(args.est.weightFee))}</div>
          <div class="muted" style="margin-top:6px;">Multiplier: ${escapeHtml(String(args.est.multiplier))} • Insurance: ${escapeHtml(formatUGX(args.est.insuranceFee))}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Allocation</h2>
          <div class="muted">Cost center: ${escapeHtml(args.model.costCenter || "-")} • Project: ${escapeHtml(args.model.projectTag || "-")} • Purpose: ${escapeHtml(args.model.purpose || "-")}</div>
          <div class="muted" style="margin-top:6px;">Notes: ${escapeHtml(args.model.notes || "-")}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Proof requirements</h2>
          <ul>${proofRows || "<li>(none)</li>"}</ul>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Attachments</h2>
          <ul>${attRows || "<li>(none)</li>"}</ul>
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

export default function UserDeliveryCheckoutU28() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const steps: StepKey[] = ["Delivery details", "Vendor and service", "Allocation", "Proof requirements", "Review"];
  const [step, setStep] = useState<StepKey>("Delivery details");

  const vendors: Vendor[] = useMemo(
    () => [
      {
        id: "v_evz",
        name: "EVzone Courier",
        policy: "Allowed",
        notes: "Preferred vendor. Instant approvals under threshold.",
        capabilities: ["Bike", "Car", "Van", "Express", "Same-day"],
        proofDefaults: ["Drop-off photo", "Recipient signature"],
      },
      {
        id: "v_partner_a",
        name: "Partner Express A",
        policy: "Restricted",
        notes: "Restricted vendor. Procurement approval required.",
        capabilities: ["Bike", "Car", "Express"],
        proofDefaults: ["Drop-off photo", "Pickup photo"],
      },
      {
        id: "v_med",
        name: "Medical Logistics Desk",
        policy: "Allowed",
        notes: "Medical-only lanes. Strong proof requirements.",
        capabilities: ["Car", "Van", "Same-day"],
        proofDefaults: ["Drop-off photo", "Recipient signature", "ID check"],
      },
      {
        id: "v_blocked",
        name: "Unverified Courier",
        policy: "Blocked",
        notes: "Blocked by policy.",
        capabilities: ["Bike"],
        proofDefaults: ["Drop-off photo"],
      },
    ],
    []
  );

  const DELIVERY_TYPES: DeliveryType[] = ["Documents", "Parcel", "Electronics", "Medical", "Food", "Other"];
  const SPEEDS: DeliverySpeed[] = ["Standard", "Express", "Same-day"];
  const VEHICLES: VehicleClass[] = ["Bike", "Car", "Van"];

  const COST_CENTERS = ["OPS-01", "SAL-03", "FIN-01", "FLEET-01", "CAPEX-01"];
  const PROJECT_TAGS = ["Project", "Client", "Event", "Fleet", "CapEx", "Operations"];
  const PURPOSES = ["Documents", "Client meeting", "Operations", "Medical", "Training", "Other"];

  const [geoAllowed, setGeoAllowed] = useState(true);
  const [timeAllowed, setTimeAllowed] = useState(true);

  const [model, setModel] = useState<DeliveryModel>(() => ({
    pickup: "Kampala CBD",
    dropoff: "Ntinda",
    distanceKm: 9,
    weightKg: 2,
    declaredValueUGX: 350000,
    packageType: "Documents",
    fragile: false,
    insurance: false,
    schedule: "Now",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    speed: "Standard",
    vehicleClass: "Bike",
    vendorId: "v_evz",
    paymentMethod: "CorporatePay",
    corporateStatus: "Eligible",
    graceEnabled: true,
    graceEndAt: Date.now() + 4 * 60 * 60 * 1000,
    costCenter: "OPS-01",
    projectTag: "Project",
    purpose: "Documents",
    notes: "",
    proof: {
      "Pickup photo": false,
      "Drop-off photo": true,
      "Recipient signature": false,
      "ID check": false,
    },
    attachments: [],
  }));

  const vendor = useMemo(() => vendors.find((v) => v.id === model.vendorId) || vendors[0], [vendors, model.vendorId]);

  // When package type changes to Medical, prefer medical vendor
  useEffect(() => {
    if (model.packageType === "Medical" && model.vendorId !== "v_med") {
      setModel((p) => ({ ...p, vendorId: "v_med", vehicleClass: "Van", purpose: "Medical" }));
    }
  }, [model.packageType]);

  // Estimate
  const est = useMemo(() => {
    return estimateDeliveryCostUGX({
      distanceKm: model.distanceKm,
      weightKg: model.weightKg,
      declaredValueUGX: model.declaredValueUGX,
      speed: model.speed,
      vehicleClass: model.vehicleClass,
      insurance: model.insurance,
    });
  }, [model.distanceKm, model.weightKg, model.declaredValueUGX, model.speed, model.vehicleClass, model.insurance]);

  // Proof requirements
  const requiredProof = useMemo(() => {
    // vendor defaults + policy requirements
    const req = requiredProofFor({ type: model.packageType, valueUGX: model.declaredValueUGX, speed: model.speed });
    // ensure vendor defaults are included for corporate proof
    for (const p of vendor.proofDefaults) {
      if (!req.includes(p)) req.push(p);
    }
    // de-duplicate
    return Array.from(new Set(req));
  }, [model.packageType, model.declaredValueUGX, model.speed, vendor.proofDefaults]);

  // Ensure required proof cannot be turned off
  useEffect(() => {
    setModel((p) => {
      const next = { ...p, proof: { ...p.proof } };
      let changed = false;
      for (const r of requiredProof) {
        if (!next.proof[r]) {
          next.proof[r] = true;
          changed = true;
        }
      }
      return changed ? next : p;
    });
  }, [requiredProof.join("|")]);

  // Program grace
  const graceMs = model.graceEndAt - Date.now();
  const graceActive = model.corporateStatus === "Billing delinquency" && model.graceEnabled && graceMs > 0;

  // Policy evaluation
  const approvalThresholdUGX = 200000;
  const highValueThresholdUGX = 1000000;

  const policy = useMemo(() => {
    return evaluateDeliveryPolicy({
      model,
      vendor,
      estTotalUGX: est.total,
      approvalThresholdUGX,
      highValueThresholdUGX,
      geoAllowed,
      timeAllowed,
      requiredProof,
    });
  }, [model, vendor, est.total, geoAllowed, timeAllowed, requiredProof]);

  const corporateState = useMemo(() => {
    return computeCorporateState({ paymentMethod: model.paymentMethod, corporateStatus: model.corporateStatus, graceActive, outcome: policy.outcome });
  }, [model.paymentMethod, model.corporateStatus, graceActive, policy.outcome]);

  // Attachments
  const fileRef = useRef<HTMLInputElement | null>(null);
  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setModel((p) => ({ ...p, attachments: [...list, ...p.attachments].slice(0, 10) }));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const addAttachmentName = () => {
    const name = prompt("Enter attachment name (example: Invoice.pdf)")?.trim();
    if (!name) return;
    setModel((p) => ({ ...p, attachments: [{ id: uid("att"), name, size: 0, type: "manual", ts: Date.now() }, ...p.attachments].slice(0, 10) }));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setModel((p) => ({ ...p, attachments: p.attachments.filter((a) => a.id !== id) }));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  // Why modal
  const [whyOpen, setWhyOpen] = useState(false);

  // Handoff modal
  const [handoffOpen, setHandoffOpen] = useState(false);

  // Submission simulation
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { kind: "created" | "approval"; id: string }>(null);

  // Step readiness
  const detailsOk = !!model.pickup.trim() && !!model.dropoff.trim() && model.distanceKm > 0;
  const vendorOk = vendor.policy !== "Blocked";
  const allocationOk = model.paymentMethod !== "CorporatePay" || (!!model.costCenter.trim() && !!model.purpose.trim());
  const proofOk = requiredProof.every((p) => model.proof[p]);

  const canProceed = useMemo(() => {
    if (!detailsOk) return false;
    if (!vendorOk) return false;
    if (!proofOk) return false;
    if (model.paymentMethod === "CorporatePay" && corporateState === "Not available") return false;
    if (policy.outcome === "Blocked") return false;
    return true;
  }, [detailsOk, vendorOk, proofOk, model.paymentMethod, corporateState, policy.outcome]);

  const goNext = () => {
    const idx = steps.indexOf(step);
    setStep(steps[Math.min(steps.length - 1, idx + 1)]);
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    setStep(steps[Math.max(0, idx - 1)]);
  };

  const proceedToU26 = () => {
    if (!canProceed) {
      toast({ title: "Fix required", message: "Resolve issues before final review.", kind: "warn" });
      return;
    }
    setHandoffOpen(true);
  };

  const submit = () => {
    if (!canProceed) {
      toast({ title: "Cannot submit", message: "Fix issues or change payment/vendor.", kind: "warn" });
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (model.paymentMethod === "CorporatePay" && policy.outcome === "Approval required") {
        const id = `REQ-DLV-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setResult({ kind: "approval", id });
        toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
      } else {
        const id = `DLV-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setResult({ kind: "created", id });
        toast({ title: "Order created", message: `Delivery ${id} created.`, kind: "success" });
      }
    }, 900);
  };

  // Helpers
  const setProof = (p: ProofType, on: boolean) => {
    if (requiredProof.includes(p) && !on) {
      toast({ title: "Required", message: `${p} is required by policy.`, kind: "warn" });
      return;
    }
    setModel((prev) => ({ ...prev, proof: { ...prev.proof, [p]: on } }));
  };

  const recommendedAlternatives = useMemo(() => {
    const alts: string[] = [];
    if (vendor.policy === "Blocked") alts.push("Choose an allowed vendor");
    if (model.paymentMethod === "CorporatePay" && corporateState === "Not available") alts.push("Switch to personal payment");
    if (!geoAllowed) alts.push("Use an allowed route/zone");
    if (!timeAllowed) alts.push("Schedule within allowed time window");
    if (est.total > approvalThresholdUGX && model.paymentMethod === "CorporatePay") alts.push("Use Standard speed or Bike to reduce cost");
    if (model.declaredValueUGX >= highValueThresholdUGX) alts.push("Add a note and ensure signature proof is enabled");
    return Array.from(new Set(alts)).slice(0, 5);
  }, [vendor.policy, model.paymentMethod, corporateState, geoAllowed, timeAllowed, est.total, model.declaredValueUGX]);

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
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">Delivery checkout</div>
                    <Pill label="U28" tone="neutral" />
                    <Pill label="Rides & Logistics" tone="neutral" />
                    <Pill label={model.paymentMethod} tone={model.paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                    {model.paymentMethod === "CorporatePay" ? (
                      <Pill label={`CorporatePay: ${corporateState}`} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Corporate courier checkout with policy allowlists, proof requirements, approvals, and final review handoff to U26.</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setWhyOpen(true)}>
                  <Info className="h-4 w-4" /> Why
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setSubmitting(false);
                    toast({ title: "Reset", message: "Checkout reset (demo).", kind: "info" });
                  }}
                >
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
                <Button variant="outline" onClick={() => exportReviewToPrint({ model, vendor, est, outcome: policy.outcome, requiredProof })}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Stepper steps={steps} active={step} onJump={setStep} />
            </div>

            {/* Outcome banner */}
            <div
              className={cn(
                "mt-4 rounded-[22px] border p-4",
                policy.outcome === "Allowed" ? "border-emerald-200 bg-emerald-50" : policy.outcome === "Approval required" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={`Outcome: ${policy.outcome}`} tone={toneForOutcome(policy.outcome)} />
                    <Pill label={`Est: ${formatUGX(est.total)}`} tone={est.total > approvalThresholdUGX ? "warn" : "neutral"} />
                    <Pill label={`Vendor: ${vendor.policy}`} tone={vendor.policy === "Allowed" ? "good" : vendor.policy === "Restricted" ? "warn" : "bad"} />
                    <Pill label={`Proof required: ${requiredProof.length}`} tone="neutral" />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{vendor.name}</div>
                  <div className="mt-1 text-sm text-slate-700">{vendor.notes}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={proceedToU26}>
                    <ChevronRight className="h-4 w-4" /> Final review (U26)
                  </Button>
                  <Button
                    variant={policy.outcome === "Blocked" ? "outline" : "primary"}
                    onClick={submit}
                    disabled={submitting || !canProceed || policy.outcome === "Blocked"}
                    title={!canProceed ? "Resolve issues first" : ""}
                  >
                    {submitting ? (
                      <>
                        <Timer className="h-4 w-4" /> Working…
                      </>
                    ) : model.paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                      <>
                        <FileText className="h-4 w-4" /> Submit for approval
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="h-4 w-4" /> Place delivery
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {recommendedAlternatives.length ? (
                <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">Suggestions</div>
                  <ul className="mt-2 space-y-1">
                    {recommendedAlternatives.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                {step === "Delivery details" ? (
                  <Section
                    title="Delivery details"
                    subtitle="Pickup, drop-off, package type/value, and schedule"
                    right={<Pill label={model.schedule} tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Pickup</div>
                        <input
                          value={model.pickup}
                          onChange={(e) => setModel((p) => ({ ...p, pickup: e.target.value }))}
                          placeholder="Pickup location"
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                            model.pickup.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-rose-300 bg-white text-slate-900 focus:ring-rose-100"
                          )}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Drop-off</div>
                        <input
                          value={model.dropoff}
                          onChange={(e) => setModel((p) => ({ ...p, dropoff: e.target.value }))}
                          placeholder="Drop-off location"
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                            model.dropoff.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-rose-300 bg-white text-slate-900 focus:ring-rose-100"
                          )}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Distance (km)</div>
                        <input
                          type="number"
                          value={model.distanceKm}
                          onChange={(e) => setModel((p) => ({ ...p, distanceKm: Number(e.target.value || 0) }))}
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                            model.distanceKm > 0 ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-rose-300 bg-white text-slate-900 focus:ring-rose-100"
                          )}
                        />
                        <div className="mt-1 text-xs text-slate-500">Best-effort estimate without map. In production use map distance.</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Weight (kg)</div>
                        <input
                          type="number"
                          value={model.weightKg}
                          onChange={(e) => setModel((p) => ({ ...p, weightKg: Number(e.target.value || 0) }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Package type</div>
                        <select
                          value={model.packageType}
                          onChange={(e) => setModel((p) => ({ ...p, packageType: e.target.value as DeliveryType }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                        >
                          {DELIVERY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Declared value (UGX)</div>
                        <input
                          type="number"
                          value={model.declaredValueUGX}
                          onChange={(e) => setModel((p) => ({ ...p, declaredValueUGX: Number(e.target.value || 0) }))}
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                            model.declaredValueUGX >= highValueThresholdUGX ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                          )}
                        />
                        <div className="mt-1 text-xs text-slate-500">High-value may require approvals and extra proof.</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <input
                          type="checkbox"
                          checked={model.fragile}
                          onChange={(e) => setModel((p) => ({ ...p, fragile: e.target.checked }))}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Fragile</div>
                          <div className="mt-1 text-xs text-slate-600">Handle with care (affects vendor selection and proof).</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <input
                          type="checkbox"
                          checked={model.insurance}
                          onChange={(e) => setModel((p) => ({ ...p, insurance: e.target.checked }))}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Insurance</div>
                          <div className="mt-1 text-xs text-slate-600">Adds 1% of declared value to estimate.</div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Schedule</div>
                          <div className="mt-1 text-xs text-slate-500">Now or scheduled delivery</div>
                        </div>
                        <Pill label={model.schedule} tone="neutral" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Now", "Scheduled"] as Array<DeliveryModel["schedule"]>).map((s) => {
                          const active = model.schedule === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setModel((p) => ({ ...p, schedule: s }))}
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                              style={active ? { background: EVZ.green } : undefined}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      {model.schedule === "Scheduled" ? (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-600">Scheduled time</div>
                          <input
                            type="datetime-local"
                            value={model.scheduledAt}
                            onChange={(e) => setModel((p) => ({ ...p, scheduledAt: e.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={goNext} disabled={!detailsOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                      {!detailsOk ? <Pill label="Complete required fields" tone="warn" /> : <Pill label="Ok" tone="good" />}
                    </div>
                  </Section>
                ) : null}

                {step === "Vendor and service" ? (
                  <Section
                    title="Vendor and service"
                    subtitle="Choose courier, speed, and vehicle class (policy allowlist)"
                    right={<Pill label={vendor.policy} tone={vendor.policy === "Allowed" ? "good" : vendor.policy === "Restricted" ? "warn" : "bad"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Vendor</div>
                        <div className="mt-2 space-y-2">
                          {vendors.map((v) => {
                            const selected = v.id === model.vendorId;
                            const disabled = v.policy === "Blocked";
                            return (
                              <button
                                key={v.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) {
                                    toast({ title: "Blocked", message: "Vendor blocked by policy.", kind: "warn" });
                                    return;
                                  }
                                  setModel((p) => ({ ...p, vendorId: v.id }));
                                }}
                                className={cn(
                                  "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                                  selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                                  disabled && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                      <Pill label={v.policy} tone={v.policy === "Allowed" ? "good" : v.policy === "Restricted" ? "warn" : "bad"} />
                                      {selected ? <Pill label="Selected" tone="info" /> : null}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">{v.notes}</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {v.capabilities.slice(0, 4).map((c) => (
                                        <Pill key={c} label={c} tone="neutral" />
                                      ))}
                                      {v.capabilities.length > 4 ? <Pill label="+more" tone="neutral" /> : null}
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-600">Service options</div>
                        <div className="mt-2 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Speed</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {SPEEDS.map((s) => {
                              const active = model.speed === s;
                              const disabled =
                                (s === "Express" && !vendor.capabilities.includes("Express")) ||
                                (s === "Same-day" && !vendor.capabilities.includes("Same-day"));
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    if (disabled) {
                                      toast({ title: "Not supported", message: "Selected vendor does not support this speed.", kind: "warn" });
                                      return;
                                    }
                                    setModel((p) => ({ ...p, speed: s }));
                                  }}
                                  className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                    active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                                    disabled && "cursor-not-allowed opacity-60"
                                  )}
                                  style={active ? { background: EVZ.green } : undefined}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-4 text-sm font-semibold text-slate-900">Vehicle class</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {VEHICLES.map((v) => {
                              const active = model.vehicleClass === v;
                              const disabled = !vendor.capabilities.includes(v);
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    if (disabled) {
                                      toast({ title: "Not supported", message: "Vendor does not support this vehicle class.", kind: "warn" });
                                      return;
                                    }
                                    setModel((p) => ({ ...p, vehicleClass: v }));
                                  }}
                                  className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                    active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                                    disabled && "cursor-not-allowed opacity-60"
                                  )}
                                  style={active ? { background: EVZ.green } : undefined}
                                >
                                  {v}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Estimate: base {formatUGX(est.base)} + distance {formatUGX(est.distanceFee)} + weight {formatUGX(est.weightFee)}
                            <div className="mt-1">Multiplier: {est.multiplier} • Insurance: {formatUGX(est.insuranceFee)} • Total: <span className="font-semibold">{formatUGX(est.total)}</span></div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Policy simulation</div>
                              <div className="mt-1 text-xs text-slate-500">Demo toggles for zone/time</div>
                            </div>
                            <Pill label="Demo" tone="neutral" />
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <ToggleRow label="Within allowed zone" enabled={geoAllowed} onToggle={() => setGeoAllowed((v) => !v)} />
                            <ToggleRow label="Within allowed time" enabled={timeAllowed} onToggle={() => setTimeAllowed((v) => !v)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="primary" onClick={goNext} disabled={!vendorOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                      {!vendorOk ? <Pill label="Choose allowed vendor" tone="warn" /> : <Pill label="Ok" tone="good" />}
                    </div>
                  </Section>
                ) : null}

                {step === "Allocation" ? (
                  <Section
                    title="Allocation"
                    subtitle="Cost center and purpose required for CorporatePay"
                    right={
                      <Pill label={model.paymentMethod} tone={model.paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Payment method</div>
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {([
                            { id: "CorporatePay" as const, label: "CorporatePay", desc: "Company-paid with policy and approvals" },
                            { id: "Personal Wallet" as const, label: "Personal Wallet", desc: "Pay personally" },
                            { id: "Card" as const, label: "Card", desc: "Visa/Mastercard" },
                            { id: "Mobile Money" as const, label: "Mobile Money", desc: "MTN/Airtel" },
                          ] as Array<{ id: PaymentMethod; label: string; desc: string }>).map((p) => {
                            const selected = model.paymentMethod === p.id;
                            const disabled = p.id === "CorporatePay" && corporateState === "Not available";
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) {
                                    toast({ title: "Unavailable", message: "CorporatePay is not available. Use personal payment.", kind: "warn" });
                                    return;
                                  }
                                  setModel((prev) => ({ ...prev, paymentMethod: p.id }));
                                }}
                                className={cn(
                                  "rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                                  selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                                  disabled && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                                      {p.id === "CorporatePay" ? (
                                        <Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                                      ) : null}
                                      {selected ? <Pill label="Selected" tone="info" /> : null}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">{p.desc}</div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", model.paymentMethod !== "CorporatePay" && "opacity-70")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Corporate program status</div>
                              <div className="mt-1 text-xs text-slate-500">Demo controls</div>
                            </div>
                            <Pill label={model.corporateStatus} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                          </div>

                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-600">Status</div>
                            <select
                              value={model.corporateStatus}
                              onChange={(e) => setModel((p) => ({ ...p, corporateStatus: e.target.value as CorporateProgramStatus }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                              disabled={model.paymentMethod !== "CorporatePay"}
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

                          <div className={cn("mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4", model.corporateStatus !== "Billing delinquency" && "opacity-60")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-600">Grace window</div>
                                <div className="mt-1 text-xs text-slate-500">Premium</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={model.graceEnabled}
                                disabled={model.paymentMethod !== "CorporatePay" || model.corporateStatus !== "Billing delinquency"}
                                onChange={(e) => setModel((p) => ({ ...p, graceEnabled: e.target.checked }))}
                                className="mt-1 h-4 w-4 rounded border-slate-300"
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Pill label={graceActive ? `Active ${msToFriendly(graceMs)}` : "Inactive"} tone={graceActive ? "warn" : "neutral"} />
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => setModel((p) => ({ ...p, graceEndAt: Date.now() + 4 * 60 * 60 * 1000 }))}
                                disabled={model.paymentMethod !== "CorporatePay" || model.corporateStatus !== "Billing delinquency"}
                              >
                                <RefreshCcw className="h-4 w-4" /> Reset
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={cn("mt-4 rounded-3xl border border-slate-200 bg-white p-4", model.paymentMethod !== "CorporatePay" && "opacity-60")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allocation fields</div>
                          <div className="mt-1 text-xs text-slate-500">Cost center and purpose required for CorporatePay</div>
                        </div>
                        <Pill label={model.paymentMethod === "CorporatePay" ? "Required" : "Optional"} tone={model.paymentMethod === "CorporatePay" ? "warn" : "neutral"} />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Cost center {model.paymentMethod === "CorporatePay" ? <span className="text-rose-600">*</span> : null}</div>
                          <select
                            value={model.costCenter}
                            onChange={(e) => setModel((p) => ({ ...p, costCenter: e.target.value }))}
                            disabled={model.paymentMethod !== "CorporatePay"}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              model.paymentMethod === "CorporatePay" && !model.costCenter.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          >
                            <option value="">Select</option>
                            {COST_CENTERS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Project tag (optional)</div>
                          <select
                            value={model.projectTag}
                            onChange={(e) => setModel((p) => ({ ...p, projectTag: e.target.value }))}
                            disabled={model.paymentMethod !== "CorporatePay"}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            <option value="">None</option>
                            {PROJECT_TAGS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Purpose {model.paymentMethod === "CorporatePay" ? <span className="text-rose-600">*</span> : null}</div>
                          <select
                            value={model.purpose}
                            onChange={(e) => setModel((p) => ({ ...p, purpose: e.target.value }))}
                            disabled={model.paymentMethod !== "CorporatePay"}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              model.paymentMethod === "CorporatePay" && !model.purpose.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          >
                            <option value="">Select</option>
                            {PURPOSES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600">Notes (recommended)</div>
                        <textarea
                          value={model.notes}
                          onChange={(e) => setModel((p) => ({ ...p, notes: e.target.value }))}
                          rows={3}
                          placeholder="Add context for approvers and audit"
                          disabled={model.paymentMethod !== "CorporatePay"}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="primary" onClick={goNext} disabled={!allocationOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                      {!allocationOk ? <Pill label="Cost center and purpose required" tone="warn" /> : <Pill label="Ok" tone="good" />}
                    </div>
                  </Section>
                ) : null}

                {step === "Proof requirements" ? (
                  <Section
                    title="Proof requirements"
                    subtitle="Policy-driven proofs (photo/signature/ID)"
                    right={<Pill label={`${requiredProof.length} required`} tone={requiredProof.length ? "info" : "neutral"} />}
                  >
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Required proofs</div>
                          <div className="mt-1 text-xs text-slate-500">Required proofs are auto-enabled and cannot be disabled.</div>
                        </div>
                        <Pill label={model.packageType} tone="neutral" />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {requiredProof.map((p) => (
                          <Pill key={p} label={p} tone="warn" />
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {(["Pickup photo", "Drop-off photo", "Recipient signature", "ID check"] as ProofType[]).map((p) => {
                          const required = requiredProof.includes(p);
                          const enabled = model.proof[p];
                          return (
                            <div key={p} className={cn("rounded-3xl border border-slate-200 bg-white p-4", required && "bg-amber-50")}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{p}</div>
                                    {required ? <Pill label="Required" tone="warn" /> : <Pill label="Optional" tone="neutral" />}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-600">{proofHint(p)}</div>
                                </div>
                                <button
                                  type="button"
                                  className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                                  onClick={() => setProof(p, !enabled)}
                                  aria-label={p}
                                >
                                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Proofs are captured by the courier and attached to the delivery record for audit.
                      </div>
                    </div>

                    <Section title="Attachments" subtitle="Optional supporting documents" right={<Pill label={`${model.attachments.length}`} tone={model.attachments.length ? "info" : "neutral"} />}>
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
                        {model.attachments.map((a) => (
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
                        {!model.attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments.</div> : null}
                      </div>
                    </Section>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="primary" onClick={goNext} disabled={!proofOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                      {!proofOk ? <Pill label="Enable required proofs" tone="warn" /> : <Pill label="Ok" tone="good" />}
                    </div>
                  </Section>
                ) : null}

                {step === "Review" ? (
                  <Section
                    title="Review"
                    subtitle="Approval path, receipt expectation, and final review handoff"
                    right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                  >
                    <div className={cn(
                      "rounded-3xl border p-4",
                      policy.outcome === "Allowed" ? "border-emerald-200 bg-emerald-50" : policy.outcome === "Approval required" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                            <Pill label={`Est: ${formatUGX(est.total)}`} tone={est.total > approvalThresholdUGX ? "warn" : "neutral"} />
                            <Pill label={model.speed} tone="neutral" />
                            <Pill label={model.vehicleClass} tone="neutral" />
                            <Pill label={model.packageType} tone="neutral" />
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{model.pickup} → {model.dropoff}</div>
                          <div className="mt-1 text-sm text-slate-700">Vendor: {vendor.name} • Payment: {model.paymentMethod}</div>
                        </div>
                        <div className={cn(
                          "grid h-11 w-11 place-items-center rounded-2xl bg-white ring-1",
                          policy.outcome === "Allowed" ? "text-emerald-700 ring-emerald-200" : policy.outcome === "Approval required" ? "text-amber-900 ring-amber-200" : "text-rose-700 ring-rose-200"
                        )}>
                          {policy.outcome === "Allowed" ? <BadgeCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoRow label="Distance" value={`${model.distanceKm} km`} />
                        <InfoRow label="Weight" value={`${model.weightKg} kg`} />
                        <InfoRow label="Declared value" value={formatUGX(model.declaredValueUGX)} emphasize={model.declaredValueUGX >= highValueThresholdUGX} />
                        <InfoRow label="Insurance" value={model.insurance ? "On" : "Off"} />
                      </div>

                      <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Receipt will include: pickup, drop-off, distance, package type/value, proof requirements, vendor, cost center, purpose, project tag, and delivery id.
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Policy reasons</div>
                          <div className="mt-1 text-xs text-slate-500">Explains approval requirements or blocks</div>
                        </div>
                        <Button variant="outline" onClick={() => setWhyOpen(true)}>
                          <Info className="h-4 w-4" /> Why
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
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

                      {model.paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                        <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Approval path</div>
                              <div className="mt-1 text-sm text-slate-700">Manager approval then Finance. Procurement approval if vendor is restricted.</div>
                              <div className="mt-2 text-xs text-slate-600">Expected decision within 8 hours (configurable).</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-900 ring-1 ring-amber-200">
                              <Timer className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Tip: add notes and attachments to reduce rework.
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="outline" onClick={proceedToU26}>
                        <ChevronRight className="h-4 w-4" /> Open U26 final review
                      </Button>
                      <Button
                        variant={policy.outcome === "Blocked" ? "outline" : "primary"}
                        onClick={submit}
                        disabled={submitting || !canProceed || policy.outcome === "Blocked"}
                      >
                        {submitting ? (
                          <>
                            <Timer className="h-4 w-4" /> Working…
                          </>
                        ) : model.paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                          <>
                            <FileText className="h-4 w-4" /> Submit for approval
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="h-4 w-4" /> Place delivery
                          </>
                        )}
                      </Button>
                    </div>

                    {result ? (
                      <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                        {result.kind === "approval" ? (
                          <>
                            <div className="text-sm font-semibold text-slate-900">Submitted for approval</div>
                            <div className="mt-1 text-sm text-slate-700">Request ID: <span className="font-semibold">{result.id}</span>. Track status in U13 and view in U5.</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-slate-900">Delivery created</div>
                            <div className="mt-1 text-sm text-slate-700">Delivery ID: <span className="font-semibold">{result.id}</span>. Receipt will be generated on completion.</div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </Section>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Estimate" subtitle="How the price is computed" right={<Pill label={formatUGX(est.total)} tone={est.total > approvalThresholdUGX ? "warn" : "neutral"} />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoRow label="Base" value={formatUGX(est.base)} />
                    <InfoRow label="Distance" value={formatUGX(est.distanceFee)} />
                    <InfoRow label="Weight" value={formatUGX(est.weightFee)} />
                    <InfoRow label="Insurance" value={formatUGX(est.insuranceFee)} emphasize={model.insurance} />
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Multiplier: {est.multiplier} (speed + vehicle). Total: <span className="font-semibold">{formatUGX(est.total)}</span>.
                  </div>
                </Section>

                <Section title="Receipt preview" subtitle="Corporate audit fields" right={<Pill label="Audit" tone="info" />}>
                  <div className="space-y-2">
                    <InfoRow label="Vendor" value={vendor.name} />
                    <InfoRow label="Pickup" value={model.pickup || "-"} emphasize={!model.pickup.trim()} />
                    <InfoRow label="Drop-off" value={model.dropoff || "-"} emphasize={!model.dropoff.trim()} />
                    <InfoRow label="Type" value={model.packageType} />
                    <InfoRow label="Declared value" value={formatUGX(model.declaredValueUGX)} emphasize={model.declaredValueUGX >= highValueThresholdUGX} />
                    <InfoRow label="Cost center" value={model.costCenter || "-"} emphasize={model.paymentMethod === "CorporatePay" && !model.costCenter.trim()} />
                    <InfoRow label="Purpose" value={model.purpose || "-"} emphasize={model.paymentMethod === "CorporatePay" && !model.purpose.trim()} />
                    <InfoRow label="Proof" value={requiredProof.join(", ")} />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Receipt becomes available in U6 after completion.
                  </div>
                </Section>

                <Section title="Readiness" subtitle="What is required" right={<Pill label={canProceed ? "Ready" : "Fix"} tone={canProceed ? "good" : "warn"} />}>
                  <div className="space-y-2">
                    <ChecklistRow ok={detailsOk} label="Delivery details" hint="Pickup, drop-off, distance" />
                    <ChecklistRow ok={vendorOk} label="Vendor" hint={vendor.policy} />
                    <ChecklistRow ok={geoAllowed && timeAllowed} label="Route controls" hint="Geo and time" />
                    <ChecklistRow ok={proofOk} label="Proof requirements" hint={`${requiredProof.length} required`} />
                    <ChecklistRow ok={allocationOk} label="Allocation" hint={model.paymentMethod === "CorporatePay" ? "Cost center and purpose" : "Optional"} />
                    <ChecklistRow ok={policy.outcome !== "Blocked"} label="Policy outcome" hint={policy.outcome} />
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={`Est: ${formatUGX(est.total)}`} tone={est.total > approvalThresholdUGX ? "warn" : "neutral"} />
                  <Pill label={`Outcome: ${policy.outcome}`} tone={toneForOutcome(policy.outcome)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setWhyOpen(true)}>
                    <Info className="h-4 w-4" /> Why
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (step === "Review") proceedToU26();
                      else goNext();
                    }}
                  >
                    <ChevronRight className="h-4 w-4" /> {step === "Review" ? "Final review" : "Next"}
                  </Button>
                  <Button
                    variant={step === "Review" ? (policy.outcome === "Blocked" ? "outline" : "primary") : "primary"}
                    onClick={() => {
                      if (step === "Review") submit();
                      else goNext();
                    }}
                    disabled={step === "Review" ? submitting || !canProceed || policy.outcome === "Blocked" : false}
                  >
                    {step === "Review" ? (
                      submitting ? (
                        <>
                          <Timer className="h-4 w-4" /> Working…
                        </>
                      ) : model.paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                        <>
                          <FileText className="h-4 w-4" /> Submit
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="h-4 w-4" /> Place
                        </>
                      )
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U28 Delivery Checkout with CorporatePay. Covers delivery details, vendor allowlist selection, proof requirements, allocation enforcement, approval path, and U26 final review handoff.
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
              Explanations are derived from policy rules and audit triggers.
            </div>
          </div>
        </div>
      </Modal>

      {/* Handoff modal */}
      <Modal
        open={handoffOpen}
        title="Proceed to final review (U26)"
        subtitle="We will pass this delivery payload into the universal CorporatePay checkout summary"
        onClose={() => setHandoffOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setHandoffOpen(false)}>
              Back
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast({ title: "U26", message: "Open U26 canvas to complete final confirmation.", kind: "info" });
                }}
              >
                <ChevronRight className="h-4 w-4" /> Open U26
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setHandoffOpen(false);
                  toast({ title: "Handoff", message: "Payload prepared for U26 (demo).", kind: "success" });
                }}
              >
                <BadgeCheck className="h-4 w-4" /> Continue
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Delivery payload preview</div>
            <div className="mt-1 text-xs text-slate-600">U26 will run the final validation and confirmation.</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoRow label="Vendor" value={vendor.name} />
              <InfoRow label="Estimate" value={formatUGX(est.total)} emphasize={est.total > approvalThresholdUGX} />
              <InfoRow label="Pickup" value={model.pickup} />
              <InfoRow label="Drop-off" value={model.dropoff} />
              <InfoRow label="Type" value={model.packageType} />
              <InfoRow label="Declared value" value={formatUGX(model.declaredValueUGX)} emphasize={model.declaredValueUGX >= highValueThresholdUGX} />
              <InfoRow label="Payment" value={model.paymentMethod} emphasize={model.paymentMethod === "CorporatePay" && corporateState !== "Available"} />
              <InfoRow label="Outcome" value={policy.outcome} emphasize={policy.outcome !== "Allowed"} />
              <InfoRow label="Cost center" value={model.costCenter || "-"} emphasize={model.paymentMethod === "CorporatePay" && !model.costCenter.trim()} />
              <InfoRow label="Purpose" value={model.purpose || "-"} emphasize={model.paymentMethod === "CorporatePay" && !model.purpose.trim()} />
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              U26 is the universal final confirmation step shared across rides, charging, e-commerce, and services.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="mt-1 text-xs text-slate-600">{enabled ? "On" : "Off"}</div>
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={onToggle}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function proofHint(p: ProofType) {
  if (p === "Pickup photo") return "Courier captures photo at pickup.";
  if (p === "Drop-off photo") return "Courier captures photo at delivery.";
  if (p === "Recipient signature") return "Recipient signs on delivery.";
  return "Recipient ID is checked and recorded.";
}
