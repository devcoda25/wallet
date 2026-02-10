import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Info,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ServiceStatus = "Active" | "Past due" | "Suspended";

type FundingMode = "Wallet" | "Credit" | "Prepaid";

type FundingStatus = "Active" | "Low" | "Depleted";

type ValidationStatus = "Ready" | "Approval required" | "Blocked";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type CapType = "Hard" | "Soft";

type Cap = { name: "Daily" | "Weekly" | "Monthly"; type: CapType; limitUGX: number; usedUGX: number };

type ValidationResult = {
  status: ValidationStatus;
  headline: string;
  reasons: string[];
  nextSteps: string[];
  approvalHint?: string;
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

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.round((used / limit) * 100);
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForService(s: ServiceStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Past due") return "warn" as const;
  return "bad" as const;
}

function toneForFunding(s: FundingStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Low") return "warn" as const;
  return "bad" as const;
}

function toneForValidation(s: ValidationStatus) {
  if (s === "Ready") return "good" as const;
  if (s === "Approval required") return "warn" as const;
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

function SheetShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[980px]">
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
        <div className="border-b border-slate-200 px-4 py-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
              </div>
            </div>
            {right}
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-5 md:px-6">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, pill }: { label: string; value: string; pill?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      </div>
      {pill}
    </div>
  );
}

function TogglePill({ enabled, label, onToggle }: { enabled: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
        enabled ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

function validate({
  serviceStatus,
  fundingMode,
  walletStatus,
  creditStatus,
  prepaidStatus,
  prepaidRunwayDays,
  amountUGX,
  approvalThresholdUGX,
  caps,
  costCenterProvided,
  purposeProvided,
  requireCostCenter,
  requirePurpose,
}: {
  serviceStatus: ServiceStatus;
  fundingMode: FundingMode;
  walletStatus: FundingStatus;
  creditStatus: FundingStatus;
  prepaidStatus: FundingStatus;
  prepaidRunwayDays: number;
  amountUGX: number;
  approvalThresholdUGX: number;
  caps: Cap[];
  costCenterProvided: boolean;
  purposeProvided: boolean;
  requireCostCenter: boolean;
  requirePurpose: boolean;
}): ValidationResult {
  const reasons: string[] = [];
  const nextSteps: string[] = [];

  // Service status
  if (serviceStatus === "Suspended") {
    reasons.push("CorporatePay is suspended due to billing non-compliance.");
    nextSteps.push("Use personal payment or contact your organization admin.");
    return { status: "Blocked", headline: "CorporatePay suspended", reasons, nextSteps };
  }

  // Funding
  if (fundingMode === "Wallet" && walletStatus === "Depleted") {
    reasons.push("Corporate wallet funding is not available.");
    nextSteps.push("Switch to personal payment or ask admin to add funds.");
    return { status: "Blocked", headline: "Wallet unavailable", reasons, nextSteps };
  }

  if (fundingMode === "Credit" && creditStatus === "Depleted") {
    reasons.push("Corporate credit is not available (limit exceeded or paused).");
    nextSteps.push("Wait for repayment/limit adjustment or switch payment method.");
    return { status: "Blocked", headline: "Credit unavailable", reasons, nextSteps };
  }

  if (fundingMode === "Prepaid" && (prepaidStatus === "Depleted" || prepaidRunwayDays <= 0)) {
    reasons.push("Prepaid deposit is depleted. CorporatePay stops when deposit runs out.");
    nextSteps.push("Wait for top-up, or switch to personal payment.");
    return { status: "Blocked", headline: "Deposit depleted", reasons, nextSteps };
  }

  // Required fields
  if (requireCostCenter && !costCenterProvided) {
    reasons.push("Cost center is required by policy.");
    nextSteps.push("Select a cost center before submitting.");
    return { status: "Blocked", headline: "Missing cost center", reasons, nextSteps };
  }

  if (requirePurpose && !purposeProvided) {
    reasons.push("Purpose tag is required by policy.");
    nextSteps.push("Add a purpose tag like Airport, Client meeting, or Office.");
    return { status: "Blocked", headline: "Missing purpose tag", reasons, nextSteps };
  }

  // Caps
  for (const c of caps) {
    if (c.limitUGX <= 0) continue;
    const remaining = Math.max(0, c.limitUGX - c.usedUGX);
    if (amountUGX > remaining) {
      if (c.type === "Hard") {
        reasons.push(`${c.name} hard cap would be exceeded (${formatUGX(remaining)} remaining).`);
        nextSteps.push("Reduce amount or request an exception.");
        return { status: "Blocked", headline: "Cap exceeded", reasons, nextSteps };
      }
      reasons.push(`${c.name} soft cap would be exceeded (${formatUGX(remaining)} remaining).`);
      nextSteps.push("Submit for approval or request an exception.");
      return {
        status: "Approval required",
        headline: "Approval required due to cap",
        reasons,
        nextSteps,
        approvalHint: "Likely approver: Manager → Finance depending on org workflow.",
      };
    }
  }

  // Approval threshold
  if (amountUGX > approvalThresholdUGX) {
    reasons.push(`Amount is above approval threshold (${formatUGX(approvalThresholdUGX)}).`);
    nextSteps.push("Submit for approval. You can track it in My Requests.");
    return {
      status: "Approval required",
      headline: "Approval required",
      reasons,
      nextSteps,
      approvalHint: "Likely approver: Manager (and Finance if high-value).",
    };
  }

  // Past due is not blocked, but warn
  if (serviceStatus === "Past due") {
    reasons.push("Account is past due. Organization may be in grace window.");
    nextSteps.push("Proceed now, but expect enforcement if not resolved.");
    return {
      status: "Ready",
      headline: "Ready to proceed",
      reasons,
      nextSteps,
    };
  }

  reasons.push("Policy, funding, and caps checks passed.");
  nextSteps.push("Confirm CorporatePay to continue.");
  return { status: "Ready", headline: "Ready to proceed", reasons, nextSteps };
}

export default function UserCorporatePayDetailsSheetU8() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Context (demo)
  const [orgName, setOrgName] = useState("Acme Group Ltd");
  const [moduleCtx, setModuleCtx] = useState<"Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other">("Rides & Logistics");
  const [amountUGX, setAmountUGX] = useState<number>(180000);

  // Service status
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("Active");

  // Funding model
  const [fundingMode, setFundingMode] = useState<FundingMode>("Prepaid");
  const [walletStatus, setWalletStatus] = useState<FundingStatus>("Active");
  const [walletMasked, setWalletMasked] = useState("Sufficient");

  const [creditStatus, setCreditStatus] = useState<FundingStatus>("Active");
  const [creditRemainingMasked, setCreditRemainingMasked] = useState("Available");

  const [prepaidStatus, setPrepaidStatus] = useState<FundingStatus>("Low");
  const [prepaidRunwayDays, setPrepaidRunwayDays] = useState<number>(3);

  // Policy inputs
  const [approvalThresholdUGX, setApprovalThresholdUGX] = useState<number>(200000);
  const [thresholdVisible, setThresholdVisible] = useState(true);
  const [requireCostCenter, setRequireCostCenter] = useState(true);
  const [requirePurpose, setRequirePurpose] = useState(moduleCtx === "Rides & Logistics");

  useEffect(() => {
    setRequirePurpose(moduleCtx === "Rides & Logistics");
  }, [moduleCtx]);

  const [costCenterProvided, setCostCenterProvided] = useState(true);
  const [purposeProvided, setPurposeProvided] = useState(true);

  // Caps (user side)
  const [caps, setCaps] = useState<Cap[]>([
    { name: "Daily", type: "Hard", limitUGX: 250000, usedUGX: 185000 },
    { name: "Weekly", type: "Soft", limitUGX: 1200000, usedUGX: 920000 },
    { name: "Monthly", type: "Soft", limitUGX: 5000000, usedUGX: 4100000 },
  ]);

  const depositStopWarning = useMemo(() => fundingMode === "Prepaid" && prepaidRunwayDays <= 3, [fundingMode, prepaidRunwayDays]);

  // Premium: "real-time" validation (simulated debounce)
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult>(() => ({ status: "Ready", headline: "Ready", reasons: [], nextSteps: [] }));

  const computed = useMemo(() => {
    return validate({
      serviceStatus,
      fundingMode,
      walletStatus,
      creditStatus,
      prepaidStatus,
      prepaidRunwayDays,
      amountUGX,
      approvalThresholdUGX,
      caps,
      costCenterProvided,
      purposeProvided,
      requireCostCenter,
      requirePurpose,
    });
  }, [serviceStatus, fundingMode, walletStatus, creditStatus, prepaidStatus, prepaidRunwayDays, amountUGX, approvalThresholdUGX, caps, costCenterProvided, purposeProvided, requireCostCenter, requirePurpose]);

  useEffect(() => {
    setValidating(true);
    const t = window.setTimeout(() => {
      setResult(computed);
      setValidating(false);
    }, 220);
    return () => window.clearTimeout(t);
  }, [computed]);

  const canConfirm = !validating && result.status !== "Blocked";

  const primaryLabel = useMemo(() => {
    if (validating) return "Validating";
    if (result.status === "Blocked") return "Fix issues";
    if (result.status === "Approval required") return "Submit for approval";
    return "Confirm CorporatePay";
  }, [validating, result.status]);

  const onConfirm = () => {
    if (validating) {
      toast({ title: "Validating", message: "Please wait for validation to complete.", kind: "info" });
      return;
    }

    if (result.status === "Blocked") {
      toast({ title: "Blocked", message: "CorporatePay cannot be used for this transaction.", kind: "warn" });
      return;
    }

    if (result.status === "Approval required") {
      toast({ title: "Submitted", message: "Approval request created. Track it in My Requests (U5).", kind: "success" });
      return;
    }

    toast({ title: "Confirmed", message: "CorporatePay confirmed. Continue to checkout fields.", kind: "success" });
  };

  const [whyMaskOpen, setWhyMaskOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Top helper banner for deposit */}
      {depositStopWarning ? (
        <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Prepaid deposit is low. CorporatePay stops when deposit runs out.
            </div>
            <button className="rounded-2xl bg-white/60 px-3 py-2 text-xs font-semibold hover:bg-white" onClick={() => setExplainOpen(true)}>
              Details
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[980px] px-4 py-6 md:px-6">
        <SheetShell
          title="CorporatePay details"
          subtitle="Review funding, service status, and validation before confirming"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to payment selector (U7).", kind: "info" })}>
                <ChevronRight className="h-4 w-4 rotate-180" /> Back
              </Button>
              <Button variant="outline" onClick={() => setExplainOpen(true)}>
                <Info className="h-4 w-4" /> What happens
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Main */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Service status</div>
                    <div className="mt-1 text-xs text-slate-500">Affects whether CorporatePay can proceed</div>
                  </div>
                  <Pill label={serviceStatus} tone={toneForService(serviceStatus)} />
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                  {serviceStatus === "Active"
                    ? "CorporatePay is active for this organization."
                    : serviceStatus === "Past due"
                      ? "Organization is past due. You may be in a grace window."
                      : "CorporatePay is suspended for this organization until billing is resolved."}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(["Active", "Past due", "Suspended"] as ServiceStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        serviceStatus === s ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={serviceStatus === s ? { background: EVZ.green } : undefined}
                      onClick={() => setServiceStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Funding details</div>
                    <div className="mt-1 text-xs text-slate-500">Balances are masked for privacy</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setWhyMaskOpen(true)}>
                      <Info className="h-4 w-4" /> Masking
                    </Button>
                    <Pill label={fundingMode} tone="neutral" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FundingTile
                    title="Wallet"
                    icon={<Wallet className="h-4 w-4" />}
                    active={fundingMode === "Wallet"}
                    status={walletStatus}
                    value={walletMasked}
                    note="Pay-as-you-go"
                    onPick={() => setFundingMode("Wallet")}
                  />
                  <FundingTile
                    title="Credit"
                    icon={<CreditCard className="h-4 w-4" />}
                    active={fundingMode === "Credit"}
                    status={creditStatus}
                    value={creditRemainingMasked}
                    note="Within limit"
                    onPick={() => setFundingMode("Credit")}
                  />
                  <FundingTile
                    title="Prepaid"
                    icon={<CircleDollarSign className="h-4 w-4" />}
                    active={fundingMode === "Prepaid"}
                    status={prepaidStatus}
                    value={`${prepaidRunwayDays} day(s) runway`}
                    note="Stops if depleted"
                    onPick={() => setFundingMode("Prepaid")}
                  />
                </div>

                {fundingMode === "Prepaid" ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Warning: CorporatePay stops when the prepaid deposit runs out.
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <ControlSelect
                    label="Wallet status"
                    value={walletStatus}
                    onChange={(v) => setWalletStatus(v as FundingStatus)}
                    options={["Active", "Low", "Depleted"]}
                    hint="Demo"
                  />
                  <ControlSelect
                    label="Credit status"
                    value={creditStatus}
                    onChange={(v) => setCreditStatus(v as FundingStatus)}
                    options={["Active", "Low", "Depleted"]}
                    hint="Demo"
                  />
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Prepaid runway</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={prepaidRunwayDays}
                        onChange={(e) => setPrepaidRunwayDays(clamp(Number(e.target.value || 0), 0, 365))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                      <Pill label="days" tone="neutral" />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Demo value</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Real-time validation</div>
                    <div className="mt-1 text-xs text-slate-500">Premium: policy + funding + caps before final submit</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {validating ? <Pill label="Validating" tone="info" /> : <Pill label={result.status} tone={toneForValidation(result.status)} />}
                  </div>
                </div>

                <div className={cn(
                  "mt-3 rounded-2xl p-3 ring-1",
                  result.status === "Ready" ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : result.status === "Approval required" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-rose-50 text-rose-900 ring-rose-200"
                )}>
                  <div className="text-sm font-semibold">{result.headline}</div>
                  {result.approvalHint ? <div className="mt-1 text-sm">{result.approvalHint}</div> : null}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Reasons</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {result.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Next steps</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {result.nextSteps.map((s) => (
                        <li key={s} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                  Note: some thresholds may be hidden by your organization.
                </div>
              </div>
            </div>

            {/* Side */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Transaction</div>
                    <div className="mt-1 text-xs text-slate-500">Preview what will be billed</div>
                  </div>
                  <Pill label={moduleCtx} tone="neutral" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <InfoRow label="Organization" value={orgName} pill={<Pill label="Linked" tone="info" />} />
                  <InfoRow label="Amount" value={formatUGX(amountUGX)} pill={<Pill label="Estimate" tone="neutral" />} />
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Module</div>
                    <select
                      value={moduleCtx}
                      onChange={(e) => setModuleCtx(e.target.value as any)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other"] as const).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 text-xs text-slate-500">Purpose is required for rides by default.</div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Estimated amount</div>
                    <input
                      type="number"
                      value={amountUGX}
                      onChange={(e) => setAmountUGX(clamp(Number(e.target.value || 0), 0, 999999999))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Policy fields</div>
                    <div className="mt-1 text-xs text-slate-500">Required fields for this checkout</div>
                  </div>
                  <Pill label="Core" tone="neutral" />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <TogglePill enabled={requireCostCenter} label={`Cost center ${requireCostCenter ? "required" : "optional"}`} onToggle={() => setRequireCostCenter((v) => !v)} />
                  <TogglePill enabled={requirePurpose} label={`Purpose ${requirePurpose ? "required" : "optional"}`} onToggle={() => setRequirePurpose((v) => !v)} />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                    Cost center provided
                    <input type="checkbox" checked={costCenterProvided} onChange={(e) => setCostCenterProvided(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  </label>
                  <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                    Purpose tag provided
                    <input type="checkbox" checked={purposeProvided} onChange={(e) => setPurposeProvided(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  </label>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                  In production, these fields are collected before final submission.
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">User caps (preview)</div>
                    <div className="mt-1 text-xs text-slate-500">Used in real-time validation</div>
                  </div>
                  <Pill label="Core" tone="neutral" />
                </div>

                <div className="mt-3 space-y-2">
                  {caps.map((c) => {
                    const p = pct(c.usedUGX, c.limitUGX);
                    const remaining = Math.max(0, c.limitUGX - c.usedUGX);
                    const warn = p >= 80 && p < 100;
                    const danger = p >= 100;
                    return (
                      <div key={c.name} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{c.name} cap</div>
                            <div className="mt-1 text-xs text-slate-500">{c.type} cap</div>
                          </div>
                          <Pill label={`${p}%`} tone={danger ? "bad" : warn ? "warn" : "neutral"} />
                        </div>
                        <div className="mt-3 text-sm text-slate-700">
                          Remaining: <span className="font-semibold text-slate-900">{formatUGX(remaining)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className={cn(
                              "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                              c.type === "Hard" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-700 ring-slate-200"
                            )}
                            onClick={() => setCaps((prev) => prev.map((x) => (x.name === c.name ? { ...x, type: x.type === "Hard" ? "Soft" : "Hard" } : x)))}
                          >
                            Toggle cap type
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                            onClick={() => setCaps((prev) => prev.map((x) => (x.name === c.name ? { ...x, usedUGX: clamp(x.usedUGX + 25000, 0, x.limitUGX * 2) } : x)))}
                          >
                            +25k used
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="sticky bottom-3 mt-4 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={`Funding: ${fundingMode}`} tone="neutral" />
                <Pill label={`Service: ${serviceStatus}`} tone={toneForService(serviceStatus)} />
                {thresholdVisible ? <Pill label={`Approval > ${formatUGX(approvalThresholdUGX)}`} tone="neutral" /> : <Pill label="Approval threshold hidden" tone="info" />}
                <Pill label={validating ? "Validating" : result.status} tone={validating ? "info" : toneForValidation(result.status)} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setExplainOpen(true)}>
                  <Info className="h-4 w-4" /> Details
                </Button>
                <Button variant={canConfirm ? "primary" : "outline"} onClick={onConfirm} disabled={!canConfirm} title={!canConfirm ? "Fix issues first" : "Confirm"}>
                  <ChevronRight className="h-4 w-4" /> {primaryLabel}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            U8 CorporatePay Details Sheet. Core: funding info (masked), service status, deposit warning. Premium: real-time validation before submit.
          </div>
        </SheetShell>
      </div>

      {/* Masking modal */}
      <Modal
        open={whyMaskOpen}
        title="Why are balances masked?"
        subtitle="Privacy and corporate controls"
        onClose={() => setWhyMaskOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setWhyMaskOpen(false)}>Close</Button>
          </div>
        }
        maxW="760px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Masked finance data</div>
            <div className="mt-2 text-sm text-slate-700">
              CorporatePay shows only what you need to complete checkout. Company balances and credit terms may be restricted by policy.
            </div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            If you need detailed balances, your Finance/Admin team can view them in the CorporatePay Admin Console.
          </div>
        </div>
      </Modal>

      {/* What happens modal */}
      <Modal
        open={explainOpen}
        title="What will happen next"
        subtitle="Before you confirm"
        onClose={() => setExplainOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExplainOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setExplainOpen(false); toast({ title: "Continue", message: "Back to details sheet.", kind: "info" }); }}>
              <ChevronRight className="h-4 w-4" /> Continue
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Flow</div>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                "Validate policy, funding and caps for this checkout.",
                "If approval is required, create an approval request you can track in My Requests.",
                "If approved (or not required), the transaction proceeds and a corporate receipt is created.",
                "Receipts include purpose/cost center when allowed by policy.",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Recommended</div>
            <div className="mt-2 text-sm text-slate-700">
              Add purpose tags and confirm cost center to reduce declines and speed up approvals.
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            When using prepaid deposit, services stop when deposit is depleted.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FundingTile({
  title,
  icon,
  active,
  status,
  value,
  note,
  onPick,
}: {
  title: string;
  icon: React.ReactNode;
  active: boolean;
  status: FundingStatus;
  value: string;
  note: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
        active ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill label={status} tone={toneForFunding(status)} />
          </div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", active ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </button>
  );
}

function ControlSelect({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
