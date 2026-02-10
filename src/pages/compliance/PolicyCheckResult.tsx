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
  Copy,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Package,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Store,
  Timer,
  Upload,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";

type Payment = "CorporatePay" | "Personal";

type Outcome = "Allowed" | "Approval required" | "Blocked";

type RideCategory = "Standard" | "Premium" | "Luxury";

type LocationKey = "Kampala" | "Entebbe" | "Jinja" | "Other";

type Marketplace = "MyLiveDealz" | "EVmart" | "ServiceMart" | "Other";

type EcommerceCategory = "Office supplies" | "Electronics" | "Vehicles" | "Catering" | "Medical" | "Restricted";

type Station = "Kampala CBD" | "Entebbe" | "Other";

type ReasonCode =
  | "GEO"
  | "TIME"
  | "VENDOR"
  | "CATEGORY"
  | "BASKET"
  | "STATION"
  | "THRESHOLD"
  | "CAP"
  | "PROGRAM"
  | "OK";

type Reason = { code: ReasonCode; title: string; detail: string };

type AltAction = {
  id: string;
  title: string;
  desc: string;
  expected: Outcome;
  chip?: string;
  icon: React.ReactNode;
  patch: Partial<Scenario>;
};

type CoachTip = {
  id: string;
  title: string;
  desc: string;
  chip: string;
  patch?: Partial<Scenario>;
};

type Scenario = {
  module: ModuleKey;
  payment: Payment;
  amountUGX: number;
  timeHHMM: string;
  location: LocationKey;
  // rides
  rideCategory: RideCategory;
  // e-commerce
  marketplace: Marketplace;
  vendorApproved: boolean;
  category: EcommerceCategory;
  // charging
  station: Station;
  // meta
  lastPaymentAttempt?: Payment;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type ExceptionDraft = {
  reason: string;
  note: string;
  attachmentName: string;
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
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
}

function toneForReason(code: ReasonCode) {
  if (code === "OK") return "good" as const;
  if (code === "THRESHOLD" || code === "CAP") return "warn" as const;
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
        )}
        onClick={() => onChange(!enabled)}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function evaluatePolicy(s: Scenario): { outcome: Outcome; reasons: Reason[]; alternatives: AltAction[]; coach: CoachTip[] } {
  // Defaults
  const reasons: Reason[] = [];
  const alternatives: AltAction[] = [];
  const coach: CoachTip[] = [];

  // Personal payments bypass corporate policy
  if (s.payment === "Personal") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
    coach.push({ id: "c-back", title: "Switch back to CorporatePay when eligible", desc: "Use CorporatePay for business expenses to keep corporate receipts clean.", chip: "Coach" });
    return {
      outcome: "Allowed",
      reasons,
      alternatives: [
        {
          id: "alt-back-corp",
          title: "Use CorporatePay instead",
          desc: "Switch back to CorporatePay for business spend.",
          expected: "Approval required",
          chip: "Corporate",
          icon: <Building2 className="h-4 w-4" />,
          patch: { payment: "CorporatePay" },
        },
      ],
      coach,
    };
  }

  // If CorporatePay
  // Global rules for demo
  const withinHours = (hhmm: string, start: string, end: string) => {
    return hhmm >= start && hhmm <= end;
  };

  // Common alternative: switch to personal
  const addPersonal = () => {
    alternatives.push({
      id: "alt-personal",
      title: "Use personal payment",
      desc: "Switch to personal wallet/card to proceed immediately.",
      expected: "Allowed",
      chip: "Always available",
      icon: <Wallet className="h-4 w-4" />,
      patch: { payment: "Personal" },
    });
  };

  // Rides
  if (s.module === "Rides & Logistics") {
    // Time window 06:00-22:00
    if (!withinHours(s.timeHHMM, "06:00", "22:00")) {
      reasons.push({ code: "TIME", title: "Outside allowed hours", detail: "Corporate rides are allowed between 06:00 and 22:00." });
      alternatives.push({
        id: "alt-time",
        title: "Schedule within work hours",
        desc: "Pick a time between 06:00 and 22:00.",
        expected: "Allowed",
        chip: "Time",
        icon: <Timer className="h-4 w-4" />,
        patch: { timeHHMM: "09:00" },
      });
    }

    // Geo restriction
    if (!(s.location === "Kampala" || s.location === "Entebbe")) {
      reasons.push({ code: "GEO", title: "Geo restriction", detail: "Corporate rides are limited to approved regions (Kampala and Entebbe)." });
      alternatives.push({
        id: "alt-geo",
        title: "Use approved region",
        desc: "Switch location to Kampala or Entebbe.",
        expected: "Allowed",
        chip: "Geo",
        icon: <MapPin className="h-4 w-4" />,
        patch: { location: "Kampala" },
      });
    }

    // Category
    if (s.rideCategory === "Luxury") {
      reasons.push({ code: "CATEGORY", title: "Luxury not allowed", detail: "Luxury rides are blocked for CorporatePay in this program." });
      alternatives.push({
        id: "alt-cat",
        title: "Switch to Standard",
        desc: "Standard rides are allowed and usually do not require approval.",
        expected: "Allowed",
        chip: "Category",
        icon: <Route className="h-4 w-4" />,
        patch: { rideCategory: "Standard" },
      });
      alternatives.push({
        id: "alt-premium",
        title: "Switch to Premium",
        desc: "Premium rides may require approval above threshold.",
        expected: "Approval required",
        chip: "Category",
        icon: <Route className="h-4 w-4" />,
        patch: { rideCategory: "Premium" },
      });
    }

    // Amount rules
    if (s.amountUGX > 600000) {
      reasons.push({ code: "BASKET", title: "Amount exceeds per-trip limit", detail: "This ride exceeds the allowed per-trip corporate limit." });
      alternatives.push({
        id: "alt-reduce",
        title: "Reduce trip cost",
        desc: "Choose Standard or split the trip if possible.",
        expected: "Approval required",
        chip: "Amount",
        icon: <AlertTriangle className="h-4 w-4" />,
        patch: { rideCategory: "Standard", amountUGX: 200000 },
      });
    } else if (s.rideCategory === "Premium" && s.amountUGX > 200000) {
      reasons.push({ code: "THRESHOLD", title: "Approval required", detail: "Premium rides above UGX 200,000 require approval." });
      alternatives.push({
        id: "alt-std",
        title: "Use Standard to avoid approval",
        desc: "Standard rides usually pass policy checks faster.",
        expected: "Allowed",
        chip: "Avoid approval",
        icon: <Route className="h-4 w-4" />,
        patch: { rideCategory: "Standard" },
      });
      alternatives.push({
        id: "alt-lower",
        title: "Lower the amount",
        desc: "If possible, keep the ride under the approval threshold.",
        expected: "Allowed",
        chip: "Threshold",
        icon: <Timer className="h-4 w-4" />,
        patch: { amountUGX: 190000 },
      });
    }

    // Coach tips
    coach.push({ id: "coach-ride-1", title: "Use Standard rides to avoid approval", desc: "Standard rides are usually policy-safe and faster.", chip: "Policy coach", patch: { rideCategory: "Standard" } });
    coach.push({ id: "coach-ride-2", title: "Add purpose and cost center", desc: "Missing allocation fields can cause rework in approvals.", chip: "Policy coach" });

    addPersonal();

    // Decide outcome
    const hasHard = reasons.some((r) => ["TIME", "GEO", "CATEGORY", "BASKET"].includes(r.code));
    if (hasHard) return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };

    if (reasons.some((r) => r.code === "THRESHOLD")) return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };

    reasons.push({ code: "OK", title: "Within policy", detail: "This ride is within allowed region, hours, and category." });
    return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
  }

  // E-Commerce
  if (s.module === "E-Commerce") {
    if (s.category === "Restricted") {
      reasons.push({ code: "CATEGORY", title: "Restricted category", detail: "This category is blocked for corporate purchases." });
      alternatives.push({
        id: "alt-cat",
        title: "Choose an allowed category",
        desc: "Select a different category or pay personally.",
        expected: "Allowed",
        chip: "Category",
        icon: <Package className="h-4 w-4" />,
        patch: { category: "Office supplies" },
      });
    }

    if (!s.vendorApproved) {
      if (s.amountUGX <= 300000) {
        reasons.push({ code: "VENDOR", title: "Vendor not approved", detail: "Unapproved vendors require approval under low thresholds." });
        alternatives.push({
          id: "alt-vendor",
          title: "Switch to an approved vendor",
          desc: "Approved vendors reduce approvals and rejections.",
          expected: "Allowed",
          chip: "Vendor",
          icon: <Store className="h-4 w-4" />,
          patch: { vendorApproved: true },
        });
      } else {
        reasons.push({ code: "VENDOR", title: "Vendor blocked for this amount", detail: "High-value purchases from unapproved vendors are blocked." });
        alternatives.push({
          id: "alt-rfq",
          title: "Create RFQ for high-value",
          desc: "Use RFQ/Quote flow for high-value assets.",
          expected: "Approval required",
          chip: "RFQ",
          icon: <FileText className="h-4 w-4" />,
          patch: { amountUGX: 950000, vendorApproved: true },
        });
      }
    }

    if (s.marketplace === "MyLiveDealz" && s.amountUGX > 1000000) {
      reasons.push({ code: "THRESHOLD", title: "MyLiveDealz approval threshold", detail: "MyLiveDealz baskets above UGX 1,000,000 require approval." });
      alternatives.push({
        id: "alt-basket",
        title: "Reduce basket size",
        desc: "Keep basket under the threshold to avoid approval.",
        expected: "Allowed",
        chip: "Basket",
        icon: <Package className="h-4 w-4" />,
        patch: { amountUGX: 990000 },
      });
      alternatives.push({
        id: "alt-market",
        title: "Use EVmart instead",
        desc: "EVmart often has lower friction for corporate purchases.",
        expected: "Allowed",
        chip: "Marketplace",
        icon: <Store className="h-4 w-4" />,
        patch: { marketplace: "EVmart" },
      });
    }

    if (s.amountUGX > 2000000) {
      reasons.push({ code: "BASKET", title: "Basket too large", detail: "This basket exceeds the corporate purchase limit." });
      alternatives.push({
        id: "alt-split",
        title: "Split the order",
        desc: "Split into smaller orders or use RFQ/Quote Request.",
        expected: "Approval required",
        chip: "Limit",
        icon: <AlertTriangle className="h-4 w-4" />,
        patch: { amountUGX: 1500000 },
      });
    }

    // Coach
    coach.push({ id: "coach-ec-1", title: "Use approved vendors to avoid approval", desc: "Approved vendors reduce procurement friction.", chip: "Policy coach", patch: { vendorApproved: true } });
    coach.push({ id: "coach-ec-2", title: "Avoid restricted categories", desc: "Restricted items can be blocked even with approvals.", chip: "Policy coach", patch: { category: "Office supplies" } });
    if (s.marketplace === "MyLiveDealz") {
      coach.push({ id: "coach-ec-3", title: "MyLiveDealz tip", desc: "Keep basket under UGX 1,000,000 for faster checkout.", chip: "Policy coach", patch: { amountUGX: 990000 } });
    }

    addPersonal();

    const hasHard = reasons.some((r) => ["CATEGORY", "VENDOR", "BASKET"].includes(r.code)) && !reasons.some((r) => r.code === "THRESHOLD");

    // If restricted category or high-value unapproved vendor or huge basket
    if (reasons.some((r) => r.code === "CATEGORY") || (reasons.some((r) => r.code === "VENDOR") && s.amountUGX > 300000) || reasons.some((r) => r.code === "BASKET" && s.amountUGX > 2000000)) {
      return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };
    }

    if (reasons.some((r) => r.code === "THRESHOLD") || reasons.some((r) => r.code === "VENDOR")) {
      return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };
    }

    reasons.push({ code: "OK", title: "Within policy", detail: "Purchase is within allowed marketplace, vendor rules, and limits." });
    return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
  }

  // EV Charging
  if (s.module === "EVs & Charging") {
    if (s.station === "Other") {
      reasons.push({ code: "STATION", title: "Station not approved", detail: "Corporate charging is limited to approved stations." });
      alternatives.push({
        id: "alt-station",
        title: "Choose an approved station",
        desc: "Select Kampala CBD or Entebbe station.",
        expected: "Allowed",
        chip: "Station",
        icon: <Zap className="h-4 w-4" />,
        patch: { station: "Kampala CBD" },
      });
    }

    if (s.amountUGX > 300000) {
      reasons.push({ code: "BASKET", title: "Per-session limit exceeded", detail: "Charging amount exceeds the allowed per-session limit." });
      alternatives.push({
        id: "alt-lower",
        title: "Reduce charging amount",
        desc: "Lower the session amount or request an exception.",
        expected: "Approval required",
        chip: "Limit",
        icon: <AlertTriangle className="h-4 w-4" />,
        patch: { amountUGX: 150000 },
      });
    } else if (s.amountUGX > 150000) {
      reasons.push({ code: "THRESHOLD", title: "Approval required", detail: "Charging above UGX 150,000 requires approval." });
      alternatives.push({
        id: "alt-avoid",
        title: "Reduce to avoid approval",
        desc: "Keep session at or below UGX 150,000.",
        expected: "Allowed",
        chip: "Threshold",
        icon: <Timer className="h-4 w-4" />,
        patch: { amountUGX: 150000 },
      });
    }

    coach.push({ id: "coach-ch-1", title: "Use approved stations", desc: "Approved stations produce cleaner billing allocation.", chip: "Policy coach", patch: { station: "Kampala CBD" } });
    coach.push({ id: "coach-ch-2", title: "Keep sessions below threshold", desc: "This reduces approval overhead.", chip: "Policy coach", patch: { amountUGX: 150000 } });

    addPersonal();

    if (reasons.some((r) => r.code === "STATION") || reasons.some((r) => r.code === "BASKET" && s.amountUGX > 300000)) {
      return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };
    }
    if (reasons.some((r) => r.code === "THRESHOLD")) return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };

    reasons.push({ code: "OK", title: "Within policy", detail: "Charging request is within allowed stations and limits." });
    return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
  }

  // Other module
  if (s.amountUGX > 1000000) {
    reasons.push({ code: "BASKET", title: "High value request", detail: "High amounts for this module should use RFQ/Quote or exception." });
    alternatives.push({
      id: "alt-rfq",
      title: "Use RFQ/Quote Request",
      desc: "Request quotes for high-value assets.",
      expected: "Approval required",
      chip: "RFQ",
      icon: <FileText className="h-4 w-4" />,
      patch: { amountUGX: 950000 },
    });
  } else if (s.amountUGX > 200000) {
    reasons.push({ code: "THRESHOLD", title: "Approval required", detail: "Amount above UGX 200,000 requires approval for this module." });
    alternatives.push({
      id: "alt-lower",
      title: "Reduce amount",
      desc: "Keep amount under threshold for faster checkout.",
      expected: "Allowed",
      chip: "Threshold",
      icon: <Timer className="h-4 w-4" />,
      patch: { amountUGX: 190000 },
    });
  }

  coach.push({ id: "coach-oth-1", title: "Prefer approved vendors and smaller amounts", desc: "This reduces approvals and declines.", chip: "Policy coach" });
  addPersonal();

  if (reasons.some((r) => r.code === "BASKET")) return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };
  if (reasons.some((r) => r.code === "THRESHOLD")) return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };

  reasons.push({ code: "OK", title: "Within policy", detail: "No blockers detected for this module." });
  return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
}

function dedupeAlts(list: AltAction[]) {
  const seen = new Set<string>();
  const out: AltAction[] = [];
  for (const a of list) {
    const key = `${a.title}|${JSON.stringify(a.patch)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function diffScenario(prev: Scenario, cur: Scenario) {
  const changes: Array<{ field: string; from: string; to: string; impact: "Improved" | "Worse" | "Neutral" }> = [];

  const add = (field: string, from: any, to: any, impact: "Improved" | "Worse" | "Neutral") => {
    if (String(from) === String(to)) return;
    changes.push({ field, from: String(from), to: String(to), impact });
  };

  // heuristics
  const isImprovement = (field: string, from: any, to: any) => {
    if (field === "Vendor approved") return from === false && to === true;
    if (field === "Ride category") return from === "Luxury" && (to === "Standard" || to === "Premium");
    if (field === "Location") return (from === "Other" || from === "Jinja") && (to === "Kampala" || to === "Entebbe");
    if (field === "Time") return from < "06:00" || from > "22:00" ? to >= "06:00" && to <= "22:00" : false;
    if (field === "Payment") return from === "CorporatePay" && to === "Personal";
    if (field === "Amount") return Number(to) < Number(from);
    return false;
  };

  const isWorse = (field: string, from: any, to: any) => {
    if (field === "Vendor approved") return from === true && to === false;
    if (field === "Ride category") return (from === "Standard" || from === "Premium") && to === "Luxury";
    if (field === "Location") return (from === "Kampala" || from === "Entebbe") && (to === "Other" || to === "Jinja");
    if (field === "Payment") return from === "Personal" && to === "CorporatePay";
    if (field === "Amount") return Number(to) > Number(from);
    return false;
  };

  const pushChange = (field: string, from: any, to: any) => {
    const impact = isImprovement(field, from, to) ? "Improved" : isWorse(field, from, to) ? "Worse" : "Neutral";
    add(field, from, to, impact);
  };

  pushChange("Module", prev.module, cur.module);
  pushChange("Payment", prev.payment, cur.payment);
  pushChange("Amount", prev.amountUGX, cur.amountUGX);
  pushChange("Time", prev.timeHHMM, cur.timeHHMM);
  pushChange("Location", prev.location, cur.location);

  if (cur.module === "Rides & Logistics" || prev.module === "Rides & Logistics") pushChange("Ride category", prev.rideCategory, cur.rideCategory);
  if (cur.module === "E-Commerce" || prev.module === "E-Commerce") {
    pushChange("Marketplace", prev.marketplace, cur.marketplace);
    pushChange("Vendor approved", prev.vendorApproved, cur.vendorApproved);
    pushChange("Category", prev.category, cur.category);
  }
  if (cur.module === "EVs & Charging" || prev.module === "EVs & Charging") pushChange("Station", prev.station, cur.station);

  return changes;
}

export default function UserPolicyCheckResultU11() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [scenario, setScenario] = useState<Scenario>(() => ({
    module: "Rides & Logistics",
    payment: "CorporatePay",
    amountUGX: 280000,
    timeHHMM: "02:30",
    location: "Jinja",
    rideCategory: "Luxury",
    marketplace: "MyLiveDealz",
    vendorApproved: false,
    category: "Office supplies",
    station: "Other",
  }));

  // Previous attempt (for conflict summary)
  const [previousAttempt, setPreviousAttempt] = useState<Scenario>(() => ({
    module: "Rides & Logistics",
    payment: "CorporatePay",
    amountUGX: 420000,
    timeHHMM: "02:10",
    location: "Other",
    rideCategory: "Luxury",
    marketplace: "MyLiveDealz",
    vendorApproved: false,
    category: "Restricted",
    station: "Other",
  }));

  const evald = useMemo(() => evaluatePolicy(scenario), [scenario]);

  const conflict = useMemo(() => diffScenario(previousAttempt, scenario), [previousAttempt, scenario]);

  const primaryCta = useMemo(() => {
    if (scenario.payment === "Personal") return { label: "Continue (Personal)", disabled: false, kind: "primary" as const };
    if (evald.outcome === "Allowed") return { label: "Continue (CorporatePay)", disabled: false, kind: "primary" as const };
    if (evald.outcome === "Approval required") return { label: "Submit for approval", disabled: false, kind: "primary" as const };
    return { label: "Request exception", disabled: false, kind: "outline" as const };
  }, [scenario.payment, evald.outcome]);

  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState<ExceptionDraft>({ reason: "", note: "", attachmentName: "" });

  const openException = () => {
    setExceptionDraft({ reason: "", note: "", attachmentName: "" });
    setExceptionOpen(true);
  };

  const submitException = () => {
    if (exceptionDraft.reason.trim().length < 10) {
      toast({ title: "Reason required", message: "Add a clearer reason (min 10 characters).", kind: "warn" });
      return;
    }
    toast({ title: "Exception requested", message: "Approval request created. Track it in My Requests (U5).", kind: "success" });
    setExceptionOpen(false);
  };

  const applyAlt = (a: AltAction) => {
    setScenario((p) => ({ ...p, ...a.patch }));
    toast({ title: "Applied", message: a.title, kind: "success" });
  };

  const applyCoach = (c: CoachTip) => {
    if (!c.patch) {
      toast({ title: "Tip", message: c.desc, kind: "info" });
      return;
    }
    setScenario((p) => ({ ...p, ...c.patch }));
    toast({ title: "Coach applied", message: c.title, kind: "success" });
  };

  const copySummary = async () => {
    const text = `Outcome: ${evald.outcome}\nModule: ${scenario.module}\nPayment: ${scenario.payment}\nAmount: ${formatUGX(scenario.amountUGX)}\nTime: ${scenario.timeHHMM}\nLocation: ${scenario.location}\nReasons:\n- ${evald.reasons.map((r) => `${r.title}: ${r.detail}`).join("\n- ")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Policy check summary copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const continueFlow = () => {
    if (scenario.payment === "Personal") {
      toast({ title: "Continue", message: "Proceed with personal payment.", kind: "success" });
      return;
    }
    if (evald.outcome === "Allowed") {
      toast({ title: "Continue", message: "Proceed to checkout completion.", kind: "success" });
      return;
    }
    if (evald.outcome === "Approval required") {
      toast({ title: "Approval", message: "Proceed to approval-required review (U12).", kind: "info" });
      return;
    }
    openException();
  };

  const [showCoach, setShowCoach] = useState(true);
  const [showConflict, setShowConflict] = useState(true);

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
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Policy check result</div>
                  <div className="mt-1 text-xs text-slate-500">If something violates policy, we explain why and offer safe alternatives.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Module: ${scenario.module}`} tone="neutral" />
                    <Pill label={`Payment: ${scenario.payment}`} tone={scenario.payment === "CorporatePay" ? "info" : "neutral"} />
                    <Pill label={`Amount: ${formatUGX(scenario.amountUGX)}`} tone="neutral" />
                    <Pill label={evald.outcome} tone={toneForOutcome(evald.outcome)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to Purpose & Compliance (U10).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={copySummary}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Payment", message: "Open payment methods (U7).", kind: "info" })}>
                  <Wallet className="h-4 w-4" /> Payment
                </Button>
                <Button variant={primaryCta.kind} onClick={continueFlow}>
                  <ChevronRight className="h-4 w-4" /> {primaryCta.label}
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: result + alternatives */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Result"
                  subtitle="Clear reasons and what you can do next"
                  right={<Pill label={evald.outcome} tone={toneForOutcome(evald.outcome)} />}
                >
                  <div
                    className={cn(
                      "rounded-3xl border p-4",
                      evald.outcome === "Allowed"
                        ? "border-emerald-200 bg-emerald-50"
                        : evald.outcome === "Approval required"
                        ? "border-amber-200 bg-amber-50"
                        : "border-rose-200 bg-rose-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {evald.outcome === "Allowed"
                            ? "Allowed"
                            : evald.outcome === "Approval required"
                            ? "Approval required"
                            : "Blocked"}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {evald.outcome === "Allowed"
                            ? "You can proceed. CorporatePay should work for this request."
                            : evald.outcome === "Approval required"
                            ? "You can proceed, but an approver decision is required."
                            : "CorporatePay cannot proceed without changes or an exception."}
                        </div>
                      </div>
                      <div className={cn(
                        "grid h-10 w-10 place-items-center rounded-2xl",
                        evald.outcome === "Allowed" ? "bg-emerald-100 text-emerald-800" : evald.outcome === "Approval required" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"
                      )}>
                        {evald.outcome === "Allowed" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {evald.reasons.map((r) => (
                        <div key={`${r.code}-${r.title}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={r.code} tone={toneForReason(r.code)} />
                                <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open policy summary (U3).", kind: "info" })}>
                      <ShieldCheck className="h-4 w-4" /> Policy details
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Requests", message: "Open My Requests (U5).", kind: "info" })}>
                      <FileText className="h-4 w-4" /> My Requests
                    </Button>
                    <Button
                      variant={evald.outcome === "Blocked" ? "primary" : "outline"}
                      onClick={openException}
                      title="Creates an approval request"
                    >
                      <AlertTriangle className="h-4 w-4" /> Request exception
                    </Button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    If you switch to personal payment, CorporatePay policy checks will not block you.
                  </div>
                </Section>

                <Section
                  title="Allowed alternatives"
                  subtitle="Fix the issue quickly"
                  right={<Pill label={`${evald.alternatives.length}`} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {evald.alternatives.map((a) => (
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
                              {a.chip ? <div className="mt-2"><Pill label={a.chip} tone="info" /></div> : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => applyAlt(a)}>
                            <ChevronRight className="h-4 w-4" /> Apply
                          </Button>
                          <Button
                            variant="outline"
                            className="px-3 py-2 text-xs"
                            onClick={() => toast({ title: "Preview", message: "Applied alternatives will re-run policy check automatically.", kind: "info" })}
                          >
                            <Info className="h-4 w-4" /> Preview
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!evald.alternatives.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center md:col-span-2">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <ClipboardCheck className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No alternatives needed</div>
                        <div className="mt-1 text-sm text-slate-600">You are within policy.</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Premium: policy coach can suggest the best alternative to avoid approvals.
                  </div>
                </Section>

                <Section
                  title="Policy coach"
                  subtitle="Premium suggestions to reduce declines and approvals"
                  right={
                    <button
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        showCoach ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={showCoach ? { background: EVZ.green } : undefined}
                      onClick={() => setShowCoach((v) => !v)}
                    >
                      {showCoach ? "Hide" : "Show"}
                    </button>
                  }
                >
                  <AnimatePresence initial={false}>
                    {showCoach ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                        <div className="space-y-2">
                          {evald.coach.map((c) => (
                            <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label="Premium" tone="info" />
                                    <Pill label={c.chip} tone="neutral" />
                                    <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => applyCoach(c)}>
                                    <ChevronRight className="h-4 w-4" /> Apply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          Coach suggestions are logic-based in v1. They become smarter with real history and org allowlists.
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Section>

                <Section
                  title="Conflict resolution summary"
                  subtitle="Premium: what changed from last time"
                  right={
                    <button
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        showConflict ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={showConflict ? { background: EVZ.green } : undefined}
                      onClick={() => setShowConflict((v) => !v)}
                    >
                      {showConflict ? "Hide" : "Show"}
                    </button>
                  }
                >
                  <AnimatePresence initial={false}>
                    {showConflict ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label="Premium" tone="info" />
                                <Pill label={`Changes: ${conflict.length}`} tone={conflict.length ? "warn" : "good"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">Summary</div>
                              <div className="mt-1 text-sm text-slate-600">We compare your previous attempt to the current request.</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setPreviousAttempt(scenario);
                                  toast({ title: "Baseline updated", message: "Current request saved as baseline.", kind: "success" });
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4" /> Set baseline
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setScenario(previousAttempt);
                                  toast({ title: "Reverted", message: "Switched back to previous attempt.", kind: "info" });
                                }}
                              >
                                <RefreshCcw className="h-4 w-4" /> Revert
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {conflict.map((c) => (
                              <div key={`${c.field}-${c.from}-${c.to}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill label={c.impact} tone={c.impact === "Improved" ? "good" : c.impact === "Worse" ? "bad" : "neutral"} />
                                      <div className="text-sm font-semibold text-slate-900">{c.field}</div>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-700">
                                      From <span className="font-semibold">{c.from}</span> to <span className="font-semibold">{c.to}</span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </div>
                            ))}
                            {!conflict.length ? (
                              <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">No changes from last attempt.</div>
                            ) : null}
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: conflict resolution helps you avoid repeating the same out-of-policy mistakes.
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Section>
              </div>

              {/* Right: scenario controls */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Demo scenario" subtitle="Adjust inputs to see different policy outcomes" right={<Pill label="Demo" tone="info" />}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                      label="Module"
                      value={scenario.module}
                      onChange={(v) => setScenario((p) => ({ ...p, module: v as ModuleKey }))}
                      options={[
                        { value: "Rides & Logistics", label: "Rides & Logistics" },
                        { value: "E-Commerce", label: "E-Commerce" },
                        { value: "EVs & Charging", label: "EVs & Charging" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                    <Select
                      label="Payment"
                      value={scenario.payment}
                      onChange={(v) => setScenario((p) => ({ ...p, payment: v as Payment }))}
                      options={[
                        { value: "CorporatePay", label: "CorporatePay" },
                        { value: "Personal", label: "Personal" },
                      ]}
                    />

                    <Field
                      label="Amount"
                      type="number"
                      value={scenario.amountUGX}
                      onChange={(v) => setScenario((p) => ({ ...p, amountUGX: clamp(Number(v || 0), 0, 999999999) }))}
                      hint="UGX"
                    />

                    <Field
                      label="Time"
                      type="time"
                      value={scenario.timeHHMM}
                      onChange={(v) => setScenario((p) => ({ ...p, timeHHMM: v }))}
                      hint="HH:MM"
                    />

                    <Select
                      label="Location"
                      value={scenario.location}
                      onChange={(v) => setScenario((p) => ({ ...p, location: v as LocationKey }))}
                      options={[
                        { value: "Kampala", label: "Kampala" },
                        { value: "Entebbe", label: "Entebbe" },
                        { value: "Jinja", label: "Jinja" },
                        { value: "Other", label: "Other" },
                      ]}
                    />

                    <div className={cn(scenario.module === "Rides & Logistics" ? "" : "opacity-60")}>
                      <Select
                        label="Ride category"
                        value={scenario.rideCategory}
                        onChange={(v) => setScenario((p) => ({ ...p, rideCategory: v as RideCategory }))}
                        options={[
                          { value: "Standard", label: "Standard" },
                          { value: "Premium", label: "Premium" },
                          { value: "Luxury", label: "Luxury" },
                        ]}
                        disabled={scenario.module !== "Rides & Logistics"}
                      />
                    </div>

                    <div className={cn(scenario.module === "E-Commerce" ? "" : "opacity-60")}>
                      <Select
                        label="Marketplace"
                        value={scenario.marketplace}
                        onChange={(v) => setScenario((p) => ({ ...p, marketplace: v as Marketplace }))}
                        options={[
                          { value: "MyLiveDealz", label: "MyLiveDealz" },
                          { value: "EVmart", label: "EVmart" },
                          { value: "ServiceMart", label: "ServiceMart" },
                          { value: "Other", label: "Other" },
                        ]}
                        disabled={scenario.module !== "E-Commerce"}
                      />
                    </div>

                    <div className={cn(scenario.module === "E-Commerce" ? "" : "opacity-60")}>
                      <Select
                        label="Category"
                        value={scenario.category}
                        onChange={(v) => setScenario((p) => ({ ...p, category: v as EcommerceCategory }))}
                        options={[
                          { value: "Office supplies", label: "Office supplies" },
                          { value: "Electronics", label: "Electronics" },
                          { value: "Vehicles", label: "Vehicles" },
                          { value: "Catering", label: "Catering" },
                          { value: "Medical", label: "Medical" },
                          { value: "Restricted", label: "Restricted" },
                        ]}
                        disabled={scenario.module !== "E-Commerce"}
                      />
                    </div>

                    <div className={cn(scenario.module === "E-Commerce" ? "" : "opacity-60")}>
                      <Toggle
                        enabled={scenario.vendorApproved}
                        onChange={(v) => setScenario((p) => ({ ...p, vendorApproved: v }))}
                        label="Vendor approved"
                        description="Only relevant for E-Commerce"
                      />
                    </div>

                    <div className={cn(scenario.module === "EVs & Charging" ? "" : "opacity-60")}>
                      <Select
                        label="Charging station"
                        value={scenario.station}
                        onChange={(v) => setScenario((p) => ({ ...p, station: v as Station }))}
                        options={[
                          { value: "Kampala CBD", label: "Kampala CBD" },
                          { value: "Entebbe", label: "Entebbe" },
                          { value: "Other", label: "Other" },
                        ]}
                        disabled={scenario.module !== "EVs & Charging"}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setScenario((p) => ({ ...p, payment: "CorporatePay" }))}>
                      <Building2 className="h-4 w-4" /> Try CorporatePay
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScenario((p) => ({
                          ...p,
                          module: "Rides & Logistics",
                          payment: "CorporatePay",
                          amountUGX: 160000,
                          timeHHMM: "09:30",
                          location: "Kampala",
                          rideCategory: "Standard",
                        }));
                        toast({ title: "Scenario", message: "Loaded a policy-safe scenario.", kind: "success" });
                      }}
                    >
                      <ClipboardCheck className="h-4 w-4" /> Load safe
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScenario((p) => ({
                          ...p,
                          module: "E-Commerce",
                          payment: "CorporatePay",
                          amountUGX: 1250000,
                          marketplace: "MyLiveDealz",
                          vendorApproved: false,
                          category: "Office supplies",
                        }));
                        toast({ title: "Scenario", message: "Loaded an out-of-policy scenario.", kind: "info" });
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" /> Load blocked
                    </Button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    In production, this page is auto-generated after U10. The right panel here is for testing.
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky action bar (mobile friendly) */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={evald.outcome} tone={toneForOutcome(evald.outcome)} />
                  <Pill label={`Payment: ${scenario.payment}`} tone={scenario.payment === "CorporatePay" ? "info" : "neutral"} />
                  <Pill label={`Amount: ${formatUGX(scenario.amountUGX)}`} tone="neutral" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => toast({ title: "Switch", message: "Open payment selector (U7).", kind: "info" })}>
                    <Wallet className="h-4 w-4" /> Change payment
                  </Button>
                  <Button variant={primaryCta.kind} onClick={continueFlow}>
                    <ChevronRight className="h-4 w-4" /> {primaryCta.label}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U11 Policy Check Result and Out-of-Policy Screen. Core: clear reasons, alternatives, request exception. Premium: policy coach and conflict resolution summary.
            </div>
          </div>
        </div>
      </div>

      {/* Exception modal */}
      <Modal
        open={exceptionOpen}
        title="Request exception"
        subtitle="Creates an approval request when CorporatePay is blocked or needs override"
        onClose={() => setExceptionOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExceptionOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitException}>
              <BadgeCheck className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`Module: ${scenario.module}`} tone="neutral" />
              <Pill label={`Payment: ${scenario.payment}`} tone={scenario.payment === "CorporatePay" ? "info" : "neutral"} />
              <Pill label={`Amount: ${formatUGX(scenario.amountUGX)}`} tone="neutral" />
              <Pill label={evald.outcome} tone={toneForOutcome(evald.outcome)} />
            </div>
            <div className="mt-3 text-sm text-slate-700">Explain why you need an exception. Attach evidence if required.</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
              <textarea
                value={exceptionDraft.reason}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Example: urgent client trip outside work hours"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">Attachment name (optional)</div>
              <input
                value={exceptionDraft.attachmentName}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, attachmentName: e.target.value }))}
                placeholder="Example: Itinerary.pdf"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <div className="mt-3 text-xs text-slate-500">In production, this is file upload (photo/PDF) integrated with U10 attachments.</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Notes (optional)</div>
            <textarea
              value={exceptionDraft.note}
              onChange={(e) => setExceptionDraft((p) => ({ ...p, note: e.target.value }))}
              placeholder="Extra context for approver"
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Exceptions are audited and may require attachments depending on the module and amount.
          </div>
        </div>
      </Modal>
    </div>
  );
}
