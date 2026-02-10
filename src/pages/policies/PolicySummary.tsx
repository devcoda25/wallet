import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Filter,
  Info,
  MapPin,
  MessagesSquare,
  Route,
  Search,
  Settings,
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

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other Service Module";

type Eligibility = "Allowed" | "Approval required" | "Blocked";

type FieldReq = "Required" | "Optional" | "Not applicable";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type PolicyRule = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  bullets: string[];
};

type ModulePolicy = {
  module: ModuleKey;
  summary: string;
  highlights: Array<{ label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }>;
  requiredFields: { purposeTag: FieldReq; costCenter: FieldReq };
  rules: PolicyRule[];
  outOfPolicyExamples: Array<{ title: string; why: string; fix: string }>; // preview cards
};

type Scenario = {
  module: ModuleKey;
  amountUGX: number;
  timeHHMM: string;
  location: "Kampala" | "Entebbe" | "Jinja" | "Other";
  // rides
  rideCategory: "Standard" | "Premium" | "Luxury";
  // e-commerce
  marketplace: "MyLiveDealz" | "EVmart" | "ServiceMart" | "Other";
  vendorApproved: boolean;
  category: "General" | "Restricted";
  // charging
  station: "Kampala CBD" | "Entebbe" | "Other";
  // required fields
  purposeProvided: boolean;
  costCenterProvided: boolean;
};

type SimResult = {
  status: Eligibility;
  reasons: string[];
  suggestions: string[];
  approvalsHint?: string;
};

type PolicyChange = {
  id: string;
  ts: number;
  title: string;
  modules: ModuleKey[];
  summary: string;
  whyItMattersredacts: string;
  whatToDo: string;
  read: boolean;
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

function toneForEligibility(s: Eligibility) {
  if (s === "Allowed") return "good" as const;
  if (s === "Approval required") return "warn" as const;
  return "bad" as const;
}

function toneForFieldReq(r: FieldReq) {
  if (r === "Required") return "warn" as const;
  if (r === "Optional") return "neutral" as const;
  return "info" as const;
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

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={() => onChange(!enabled)}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <div>
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
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
      />
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

function evaluateScenario(s: Scenario, policy: Record<ModuleKey, ModulePolicy>): SimResult {
  const p = policy[s.module];
  const reasons: string[] = [];
  const suggestions: string[] = [];

  // Required fields
  const needPurpose = p.requiredFields.purposeTag === "Required";
  const needCostCenter = p.requiredFields.costCenter === "Required";

  if (needCostCenter && !s.costCenterProvided) {
    reasons.push("Cost center is required by policy.");
    suggestions.push("Select a cost center (or switch org) before checkout.");
    return { status: "Blocked", reasons, suggestions };
  }

  if (needPurpose && !s.purposeProvided) {
    reasons.push("Purpose tag is required by policy.");
    suggestions.push("Add a purpose tag like Airport, Client meeting, or Office commute.");
    return { status: "Blocked", reasons, suggestions };
  }

  // Module rules
  const amount = s.amountUGX;
  const time = s.timeHHMM || "00:00";

  const withinHours = (start: string, end: string) => {
    // naive HH:MM compare
    return time >= start && time <= end;
  };

  if (s.module === "Rides & Logistics") {
    // time window 06:00-22:00
    if (!withinHours("06:00", "22:00")) {
      reasons.push("Ride requested outside allowed hours (06:00–22:00).");
      suggestions.push("Choose a time within working hours, or request an exception if urgent.");
      return { status: "Blocked", reasons, suggestions };
    }

    // geo restriction
    if (!(s.location === "Kampala" || s.location === "Entebbe")) {
      reasons.push("Ride location is outside allowed regions.");
      suggestions.push("Use an allowed region or switch to personal payment.");
      return { status: "Blocked", reasons, suggestions };
    }

    // category
    if (s.rideCategory === "Luxury") {
      reasons.push("Luxury category is not allowed for CorporatePay in this org.");
      suggestions.push("Switch to Standard or Premium.");
      return { status: "Blocked", reasons, suggestions };
    }

    // approval thresholds
    if (s.rideCategory === "Premium" && amount > 200000) {
      reasons.push("Premium rides above UGX 200,000 require approval.");
      suggestions.push("Submit for approval or switch to Standard.");
      return {
        status: "Approval required",
        reasons,
        suggestions,
        approvalsHint: "Likely approver: Manager → Finance (if above higher threshold).",
      };
    }

    if (amount > 600000) {
      reasons.push("High-value ride exceeds the allowed per-trip limit.");
      suggestions.push("Split the trip, use Standard category, or request an exception.");
      return { status: "Blocked", reasons, suggestions };
    }

    return { status: "Allowed", reasons: ["Ride is within allowed categories, region, and time."], suggestions: ["Proceed with CorporatePay at checkout."] };
  }

  if (s.module === "E-Commerce") {
    // restricted categories
    if (s.category === "Restricted") {
      reasons.push("This category is restricted for corporate purchases.");
      suggestions.push("Choose a different product category or pay personally.");
      return { status: "Blocked", reasons, suggestions };
    }

    // vendor allowlist
    if (!s.vendorApproved) {
      if (amount <= 300000) {
        reasons.push("Vendor is not on the approved list.");
        suggestions.push("Use an approved vendor or request approval.");
        return {
          status: "Approval required",
          reasons,
          suggestions,
          approvalsHint: "Approver: Procurement or Manager depending on your org setup.",
        };
      }
      reasons.push("Unapproved vendor for high amount.");
      suggestions.push("Use an approved vendor or create an RFQ for high-value purchase.");
      return { status: "Blocked", reasons, suggestions };
    }

    // marketplace guidance
    if (s.marketplace === "MyLiveDealz" && amount > 1000000) {
      reasons.push("MyLiveDealz purchases above UGX 1,000,000 require approval.");
      suggestions.push("Submit for approval or reduce basket size.");
      return { status: "Approval required", reasons, suggestions, approvalsHint: "Approver: Procurement → Finance." };
    }

    if (amount > 2000000) {
      reasons.push("Basket size exceeds the corporate purchase limit.");
      suggestions.push("Use RFQ/Quote Request for high-value assets.");
      return { status: "Blocked", reasons, suggestions };
    }

    return { status: "Allowed", reasons: ["Purchase is within allowed marketplace, vendor, and limits."], suggestions: ["Proceed with CorporatePay at checkout."] };
  }

  if (s.module === "EVs & Charging") {
    // allowed stations
    if (s.station === "Other") {
      reasons.push("Charging station is outside your allowed sites.");
      suggestions.push("Select an approved station or pay personally.");
      return { status: "Blocked", reasons, suggestions };
    }

    if (amount > 300000) {
      reasons.push("Charging amount exceeds the allowed per-session limit.");
      suggestions.push("Reduce session amount or request an exception.");
      return { status: "Blocked", reasons, suggestions };
    }

    if (amount > 150000) {
      reasons.push("Charging above UGX 150,000 requires approval.");
      suggestions.push("Submit for approval or reduce amount.");
      return { status: "Approval required", reasons, suggestions, approvalsHint: "Approver: Manager or Fleet admin depending on org." };
    }

    return { status: "Allowed", reasons: ["Charging request is within allowed sites and limits."], suggestions: ["Proceed with CorporatePay."] };
  }

  // Other module fallback
  if (amount > 1000000) {
    reasons.push("High amount for this module requires an RFQ or exception.");
    suggestions.push("Use RFQ/Quote Request or request an exception.");
    return { status: "Blocked", reasons, suggestions };
  }

  if (amount > 200000) {
    reasons.push("Amount above UGX 200,000 requires approval for this module.");
    suggestions.push("Submit for approval.");
    return { status: "Approval required", reasons, suggestions, approvalsHint: "Approver: Manager." };
  }

  return { status: "Allowed", reasons: ["This module uses the org default policy. No blockers detected."], suggestions: ["Proceed."] };
}

export default function UserCorporatePoliciesSummaryU3() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [orgName, setOrgName] = useState("Acme Group Ltd");

  const policy: Record<ModuleKey, ModulePolicy> = useMemo(() => {
    const rides: ModulePolicy = {
      module: "Rides & Logistics",
      summary: "Standard and Premium rides within allowed regions and hours. Premium above threshold requires approval.",
      highlights: [
        { label: "Standard allowed", tone: "good" },
        { label: "Premium allowed", tone: "info" },
        { label: "Luxury blocked", tone: "bad" },
        { label: "Hours 06:00–22:00", tone: "neutral" },
        { label: "Geo: Kampala/Entebbe", tone: "neutral" },
      ],
      requiredFields: { purposeTag: "Required", costCenter: "Required" },
      rules: [
        {
          id: "rides-1",
          title: "Allowed ride categories",
          summary: "Standard and Premium are allowed. Luxury is blocked.",
          tags: ["categories", "rides"],
          bullets: [
            "Standard: allowed",
            "Premium: allowed, approval above UGX 200,000",
            "Luxury: blocked",
          ],
        },
        {
          id: "rides-2",
          title: "Time window",
          summary: "CorporatePay rides are allowed between 06:00 and 22:00.",
          tags: ["time", "rides"],
          bullets: [
            "Allowed: 06:00–22:00",
            "Outside hours: blocked (use exception if urgent)",
          ],
        },
        {
          id: "rides-3",
          title: "Geo rules",
          summary: "Trips must be within allowed regions.",
          tags: ["geo", "rides"],
          bullets: [
            "Allowed: Kampala, Entebbe",
            "Outside regions: blocked",
          ],
        },
      ],
      outOfPolicyExamples: [
        { title: "Ride at 02:30", why: "Outside allowed hours.", fix: "Schedule within 06:00–22:00 or request exception." },
        { title: "Luxury category selected", why: "Luxury is blocked.", fix: "Switch to Standard or Premium." },
        { title: "Ride to a non-approved region", why: "Geo restriction.", fix: "Use Kampala/Entebbe or pay personally." },
      ],
    };

    const ecommerce: ModulePolicy = {
      module: "E-Commerce",
      summary: "Approved vendors and allowed marketplaces. MyLiveDealz has higher approval thresholds.",
      highlights: [
        { label: "Approved vendors", tone: "good" },
        { label: "Restricted categories blocked", tone: "bad" },
        { label: "MyLiveDealz threshold", tone: "warn" },
      ],
      requiredFields: { purposeTag: "Optional", costCenter: "Required" },
      rules: [
        {
          id: "ec-1",
          title: "Allowed marketplaces",
          summary: "Corporate purchases can be restricted by marketplace.",
          tags: ["marketplaces", "ecommerce"],
          bullets: [
            "MyLiveDealz: allowed, approvals above UGX 1,000,000",
            "EVmart / ServiceMart: allowed",
            "Other marketplaces: may be disabled by admin",
          ],
        },
        {
          id: "ec-2",
          title: "Vendor allowlist",
          summary: "Some vendors require approval or are blocked.",
          tags: ["vendors", "ecommerce"],
          bullets: [
            "Approved vendors: allowed",
            "Unapproved vendors: approval required (low amounts) or blocked (high amounts)",
          ],
        },
        {
          id: "ec-3",
          title: "Category restrictions",
          summary: "Restricted categories are blocked for corporate purchases.",
          tags: ["categories", "ecommerce"],
          bullets: [
            "Restricted category: blocked",
            "General category: allowed within limits",
          ],
        },
      ],
      outOfPolicyExamples: [
        { title: "Alcohol category", why: "Restricted category.", fix: "Choose an allowed category or pay personally." },
        { title: "Unapproved vendor UGX 900,000", why: "High amount + unapproved vendor.", fix: "Use approved vendor or RFQ." },
        { title: "MyLiveDealz basket UGX 1,500,000", why: "Approval required.", fix: "Submit for approval or reduce basket." },
      ],
    };

    const charging: ModulePolicy = {
      module: "EVs & Charging",
      summary: "Charging allowed at approved stations with per-session limits and optional approvals above threshold.",
      highlights: [
        { label: "Approved stations", tone: "good" },
        { label: "Session limit", tone: "neutral" },
        { label: "Approval above UGX 150,000", tone: "warn" },
      ],
      requiredFields: { purposeTag: "Optional", costCenter: "Required" },
      rules: [
        {
          id: "ch-1",
          title: "Allowed stations",
          summary: "Corporate charging can be limited by site.",
          tags: ["stations", "charging"],
          bullets: [
            "Allowed: Kampala CBD, Entebbe",
            "Other: blocked",
          ],
        },
        {
          id: "ch-2",
          title: "Charging limits",
          summary: "Per-session amount can require approval.",
          tags: ["limits", "charging"],
          bullets: [
            "≤ UGX 150,000: allowed",
            "> UGX 150,000: approval required",
            "> UGX 300,000: blocked",
          ],
        },
      ],
      outOfPolicyExamples: [
        { title: "Station not approved", why: "Outside allowed sites.", fix: "Choose an approved station." },
        { title: "Charge UGX 450,000", why: "Exceeds per-session limit.", fix: "Reduce amount or request exception." },
        { title: "Missing cost center", why: "Cost center required.", fix: "Select cost center before checkout." },
      ],
    };

    const other: ModulePolicy = {
      module: "Other Service Module",
      summary: "Uses org defaults. High amounts may require approval or RFQ.",
      highlights: [
        { label: "Org defaults", tone: "neutral" },
        { label: "Approval above UGX 200,000", tone: "warn" },
        { label: "RFQ above UGX 1,000,000", tone: "info" },
      ],
      requiredFields: { purposeTag: "Optional", costCenter: "Required" },
      rules: [
        {
          id: "oth-1",
          title: "Default handling",
          summary: "If a module is not explicitly configured, defaults apply.",
          tags: ["defaults"],
          bullets: [
            "≤ UGX 200,000: allowed",
            "> UGX 200,000: approval required",
            "> UGX 1,000,000: blocked and require RFQ/exception",
          ],
        },
      ],
      outOfPolicyExamples: [
        { title: "Service request UGX 1,200,000", why: "High amount.", fix: "Use RFQ/Quote Request." },
        { title: "Missing cost center", why: "Required.", fix: "Pick a cost center." },
        { title: "Urgent request without purpose", why: "Optional but recommended.", fix: "Add purpose to speed up approvals." },
      ],
    };

    return {
      "Rides & Logistics": rides,
      "E-Commerce": ecommerce,
      "EVs & Charging": charging,
      "Other Service Module": other,
    };
  }, []);

  const [tab, setTab] = useState<"modules" | "fields" | "simulator" | "digest">("modules");
  const [q, setQ] = useState("");

  // Accordion open state
  const [openModule, setOpenModule] = useState<ModuleKey>("Rides & Logistics");

  // Premium simulator
  const [scenario, setScenario] = useState<Scenario>(() => ({
    module: "Rides & Logistics",
    amountUGX: 120000,
    timeHHMM: "09:30",
    location: "Kampala",
    rideCategory: "Standard",
    marketplace: "MyLiveDealz",
    vendorApproved: true,
    category: "General",
    station: "Kampala CBD",
    purposeProvided: true,
    costCenterProvided: true,
  }));
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  // Premium digest
  const [digest, setDigest] = useState<PolicyChange[]>(() => {
    const now = Date.now();
    return [
      {
        id: "chg-001",
        ts: now - 6 * 60 * 60 * 1000,
        title: "Premium rides threshold updated",
        modules: ["Rides & Logistics"],
        summary: "Premium rides above UGX 200,000 now require approval.",
        whyItMattersredacts: "To reduce out-of-policy spend and improve chargeback accuracy.",
        whatToDo: "Use Standard where possible, or submit Premium rides for approval.",
        read: false,
      },
      {
        id: "chg-002",
        ts: now - 2 * 24 * 60 * 60 * 1000,
        title: "MyLiveDealz high-value approvals",
        modules: ["E-Commerce"],
        summary: "MyLiveDealz baskets above UGX 1,000,000 require approval.",
        whyItMattersredacts: "To improve procurement control for promotional marketplaces.",
        whatToDo: "Reduce basket size or submit an approval request.",
        read: true,
      },
      {
        id: "chg-003",
        ts: now - 5 * 24 * 60 * 60 * 1000,
        title: "Charging station allowlist",
        modules: ["EVs & Charging"],
        summary: "Corporate charging is limited to approved stations.",
        whyItMattersredacts: "To support approved site billing and cost allocation.",
        whatToDo: "Choose Kampala CBD or Entebbe stations for CorporatePay.",
        read: true,
      },
    ];
  });
  const [digestFilter, setDigestFilter] = useState<"All" | ModuleKey>("All");

  const policyList = useMemo(() => {
    const modules: ModuleKey[] = ["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other Service Module"];
    const query = q.trim().toLowerCase();

    if (!query) return modules;

    return modules.filter((m) => {
      const p = policy[m];
      if (m.toLowerCase().includes(query)) return true;
      if (p.summary.toLowerCase().includes(query)) return true;
      if (p.rules.some((r) => r.title.toLowerCase().includes(query) || r.summary.toLowerCase().includes(query) || r.tags.join(" ").toLowerCase().includes(query))) return true;
      return false;
    });
  }, [q, policy]);

  const filteredDigest = useMemo(() => {
    const list = digest.slice().sort((a, b) => b.ts - a.ts);
    if (digestFilter === "All") return list;
    return list.filter((d) => d.modules.includes(digestFilter));
  }, [digest, digestFilter]);

  const unreadCount = useMemo(() => digest.filter((d) => !d.read).length, [digest]);

  const requiredMatrix = useMemo(() => {
    const modules: ModuleKey[] = ["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other Service Module"];
    return modules.map((m) => ({
      module: m,
      purposeTag: policy[m].requiredFields.purposeTag,
      costCenter: policy[m].requiredFields.costCenter,
    }));
  }, [policy]);

  const runSim = () => {
    const res = evaluateScenario(scenario, policy);
    setSimResult(res);
    toast({ title: "Simulated", message: `Result: ${res.status}`, kind: res.status === "Allowed" ? "success" : res.status === "Approval required" ? "warn" : "error" });
  };

  const markAllRead = () => {
    setDigest((prev) => prev.map((d) => ({ ...d, read: true })));
    toast({ title: "Updated", message: "Marked all changes as read.", kind: "success" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1100px] px-4 py-5 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Corporate policies</div>
                  <div className="mt-1 text-xs text-slate-500">Understand what is allowed so you do not get blocked at checkout.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${orgName}`} tone="neutral" />
                    <Pill label="User view" tone="info" />
                    <Pill label={`Changes: ${unreadCount} unread`} tone={unreadCount ? "warn" : "good"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to CorporatePay Hub (U1).", kind: "info" })}>
                  <Sparkles className="h-4 w-4" /> Hub
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Org switcher", message: "Open org switcher (U2).", kind: "info" })}>
                  <Building2 className="h-4 w-4" /> Org
                </Button>
                <Button variant="primary" onClick={() => toast({ title: "Use CorporatePay", message: "Open payment methods (U7).", kind: "info" })}>
                  <Wallet className="h-4 w-4" /> Use
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              <SegButton active={tab === "modules"} label="Modules" onClick={() => setTab("modules")} />
              <SegButton active={tab === "fields"} label="Required fields" onClick={() => setTab("fields")} />
              <SegButton active={tab === "simulator"} label="Simulator" onClick={() => setTab("simulator")} />
              <SegButton active={tab === "digest"} label="Change digest" onClick={() => setTab("digest")} />
            </div>

            {/* Search */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <div className="text-xs font-semibold text-slate-600">Search policies</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search: rides, geo, marketplace, approvals..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="md:col-span-4">
                <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Tip: Add purpose tags and correct cost center to avoid declines.
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "modules" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <Section title="Policy summaries" subtitle="Per module" right={<Pill label={`${policyList.length} modules`} tone="neutral" />}>
                    <div className="space-y-2">
                      {policyList.map((m) => {
                        const p = policy[m];
                        const isOpen = openModule === m;
                        return (
                          <div key={m} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                            <button
                              type="button"
                              className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                              onClick={() => setOpenModule(isOpen ? ("Rides & Logistics" as ModuleKey) : m)}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{m}</div>
                                  {p.highlights.slice(0, 3).map((h) => (
                                    <Pill key={h.label} label={h.label} tone={h.tone || "neutral"} />
                                  ))}
                                  <Pill label={`Purpose: ${p.requiredFields.purposeTag}`} tone={toneForFieldReq(p.requiredFields.purposeTag)} />
                                  <Pill label={`Cost center: ${p.requiredFields.costCenter}`} tone={toneForFieldReq(p.requiredFields.costCenter)} />
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{p.summary}</div>
                              </div>
                              <ChevronDown className={cn("h-5 w-5 text-slate-500 transition", isOpen ? "rotate-180" : "rotate-0")} />
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                >
                                  <div className="border-t border-slate-200 px-5 py-4">
                                    <div className="grid grid-cols-1 gap-3">
                                      {p.rules.map((r) => (
                                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                              <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                              <div className="mt-1 text-sm text-slate-600">{r.summary}</div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              {r.tags.slice(0, 3).map((t) => (
                                                <Pill key={t} label={t} tone="neutral" />
                                              ))}
                                            </div>
                                          </div>
                                          <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {r.bullets.map((b) => (
                                              <li key={b} className="flex items-start gap-2">
                                                <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                                                <span>{b}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                      {!policyList.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No results</div>
                          <div className="mt-1 text-sm text-slate-600">Try another keyword.</div>
                        </div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section
                    title="Required fields"
                    subtitle="What you must provide at checkout"
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {requiredMatrix.map((r) => (
                        <div key={r.module} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{r.module}</div>
                              <div className="mt-1 text-xs text-slate-500">Checkout fields</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Pill label={`Purpose: ${r.purposeTag}`} tone={toneForFieldReq(r.purposeTag)} />
                            <Pill label={`Cost center: ${r.costCenter}`} tone={toneForFieldReq(r.costCenter)} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      Tip: Cost center is usually required for accurate billing allocation.
                    </div>
                  </Section>

                  <Section
                    title="Out-of-policy examples"
                    subtitle="Preview what would be blocked"
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {policy[openModule].outOfPolicyExamples.map((ex) => (
                        <div key={ex.title} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{ex.title}</div>
                              <div className="mt-1 text-sm text-slate-600">Why: {ex.why}</div>
                              <div className="mt-2 text-sm text-slate-700">Fix: {ex.fix}</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      These examples update when policies change.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "fields" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section title="Required fields by module" subtitle="What is required at checkout" right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Purpose tag</th>
                            <th className="px-4 py-3 font-semibold">Cost center</th>
                            <th className="px-4 py-3 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requiredMatrix.map((r) => (
                            <tr key={r.module} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{r.module}</td>
                              <td className="px-4 py-3"><Pill label={r.purposeTag} tone={toneForFieldReq(r.purposeTag)} /></td>
                              <td className="px-4 py-3"><Pill label={r.costCenter} tone={toneForFieldReq(r.costCenter)} /></td>
                              <td className="px-4 py-3 text-slate-700">
                                {r.purposeTag === "Required" ? "Add purpose to avoid declines" : r.purposeTag === "Optional" ? "Recommended for faster approvals" : "Not used"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      If required fields are missing, CorporatePay will be blocked and you will be asked to complete them.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Quick tips" subtitle="Avoid getting blocked" right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      <Tip icon={<ClipboardCheck className="h-4 w-4" />} title="Always pick the right org" desc="If you belong to multiple orgs, switch org before checkout." />
                      <Tip icon={<Timer className="h-4 w-4" />} title="Stay within allowed hours" desc="Some modules enforce time windows (example rides)." />
                      <Tip icon={<MapPin className="h-4 w-4" />} title="Use allowed regions" desc="Geo restrictions can block rides and service requests." />
                      <Tip icon={<FileText className="h-4 w-4" />} title="Use purpose tags" desc="Purpose tags speed up approvals and improve reporting." />
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "simulator" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <Section title="Personal policy simulator" subtitle="Premium: test a scenario before checkout" right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Select
                        label="Module"
                        value={scenario.module}
                        onChange={(v) => setScenario((p) => ({ ...p, module: v as ModuleKey }))}
                        options={[
                          { value: "Rides & Logistics", label: "Rides & Logistics" },
                          { value: "E-Commerce", label: "E-Commerce" },
                          { value: "EVs & Charging", label: "EVs & Charging" },
                          { value: "Other Service Module", label: "Other Service Module" },
                        ]}
                        hint="Simulate rules"
                      />
                      <NumberField
                        label="Amount"
                        value={scenario.amountUGX}
                        onChange={(v) => setScenario((p) => ({ ...p, amountUGX: clamp(v, 0, 999999999) }))}
                        hint="UGX"
                      />

                      <Select
                        label="Location"
                        value={scenario.location}
                        onChange={(v) => setScenario((p) => ({ ...p, location: v as any }))}
                        options={[
                          { value: "Kampala", label: "Kampala" },
                          { value: "Entebbe", label: "Entebbe" },
                          { value: "Jinja", label: "Jinja" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                      <Field
                        label="Time"
                        value={scenario.timeHHMM}
                        onChange={(v) => setScenario((p) => ({ ...p, timeHHMM: v }))}
                        type="time"
                        hint="HH:MM"
                      />

                      {/* Rides-only */}
                      <div className={cn(scenario.module === "Rides & Logistics" ? "" : "opacity-60")}>
                        <Select
                          label="Ride category"
                          value={scenario.rideCategory}
                          onChange={(v) => setScenario((p) => ({ ...p, rideCategory: v as any }))}
                          options={[
                            { value: "Standard", label: "Standard" },
                            { value: "Premium", label: "Premium" },
                            { value: "Luxury", label: "Luxury" },
                          ]}
                          hint={scenario.module === "Rides & Logistics" ? "" : "Only for rides"}
                        />
                      </div>

                      {/* E-commerce-only */}
                      <div className={cn(scenario.module === "E-Commerce" ? "" : "opacity-60")}>
                        <Select
                          label="Marketplace"
                          value={scenario.marketplace}
                          onChange={(v) => setScenario((p) => ({ ...p, marketplace: v as any }))}
                          options={[
                            { value: "MyLiveDealz", label: "MyLiveDealz" },
                            { value: "EVmart", label: "EVmart" },
                            { value: "ServiceMart", label: "ServiceMart" },
                            { value: "Other", label: "Other" },
                          ]}
                          hint={scenario.module === "E-Commerce" ? "" : "Only for E-Commerce"}
                        />
                      </div>

                      <div className={cn(scenario.module === "E-Commerce" ? "" : "opacity-60")}>
                        <Select
                          label="Category"
                          value={scenario.category}
                          onChange={(v) => setScenario((p) => ({ ...p, category: v as any }))}
                          options={[
                            { value: "General", label: "General" },
                            { value: "Restricted", label: "Restricted" },
                          ]}
                          hint={scenario.module === "E-Commerce" ? "" : "Only for E-Commerce"}
                        />
                      </div>

                      <div className={cn(scenario.module === "EVs & Charging" ? "" : "opacity-60")}>
                        <Select
                          label="Charging station"
                          value={scenario.station}
                          onChange={(v) => setScenario((p) => ({ ...p, station: v as any }))}
                          options={[
                            { value: "Kampala CBD", label: "Kampala CBD" },
                            { value: "Entebbe", label: "Entebbe" },
                            { value: "Other", label: "Other" },
                          ]}
                          hint={scenario.module === "EVs & Charging" ? "" : "Only for charging"}
                        />
                      </div>

                      <Toggle
                        enabled={scenario.vendorApproved}
                        onChange={(v) => setScenario((p) => ({ ...p, vendorApproved: v }))}
                        label="Vendor approved"
                        description="Only relevant for E-Commerce"
                      />

                      <Toggle
                        enabled={scenario.purposeProvided}
                        onChange={(v) => setScenario((p) => ({ ...p, purposeProvided: v }))}
                        label="Purpose tag provided"
                        description="Required for some modules"
                      />

                      <Toggle
                        enabled={scenario.costCenterProvided}
                        onChange={(v) => setScenario((p) => ({ ...p, costCenterProvided: v }))}
                        label="Cost center provided"
                        description="Usually required"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={runSim}>
                        <Sparkles className="h-4 w-4" /> Simulate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setScenario((p) => ({ ...p, amountUGX: 120000, location: "Kampala", timeHHMM: "09:30", rideCategory: "Standard", vendorApproved: true, category: "General", station: "Kampala CBD", purposeProvided: true, costCenterProvided: true }));
                          setSimResult(null);
                          toast({ title: "Reset", message: "Scenario reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: the simulator is explainable. It tells you why you might be blocked before you reach checkout.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section
                    title="Result"
                    subtitle="Outcome of your scenario"
                    right={simResult ? <Pill label={simResult.status} tone={toneForEligibility(simResult.status)} /> : <Pill label="Not run" tone="neutral" />}
                  >
                    {simResult ? (
                      <div className="space-y-3">
                        <div className={cn(
                          "rounded-3xl border p-4",
                          simResult.status === "Allowed" ? "border-emerald-200 bg-emerald-50" : simResult.status === "Approval required" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                        )}>
                          <div className="text-sm font-semibold text-slate-900">{simResult.status}</div>
                          {simResult.approvalsHint ? <div className="mt-1 text-sm text-slate-700">{simResult.approvalsHint}</div> : null}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Reasons</div>
                          <ul className="mt-2 space-y-2 text-sm text-slate-700">
                            {simResult.reasons.map((r) => (
                              <li key={r} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Suggestions</div>
                          <ul className="mt-2 space-y-2 text-sm text-slate-700">
                            {simResult.suggestions.map((s) => (
                              <li key={s} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button variant="primary" onClick={() => toast({ title: "Proceed", message: "Open checkout with CorporatePay (demo).", kind: "info" })}>
                            <Wallet className="h-4 w-4" /> Proceed
                          </Button>
                          <Button variant="outline" onClick={() => toast({ title: "Exception", message: "Open approval request (U12).", kind: "info" })}>
                            <AlertTriangle className="h-4 w-4" /> Request exception
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">Run a simulation</div>
                        <div className="mt-1 text-sm text-slate-600">Test a scenario and see if it will be allowed.</div>
                      </div>
                    )}
                  </Section>

                  <Section title="Policy reference" subtitle="Where this comes from" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Policies are configured by your organization admin. Some thresholds may be hidden.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "digest" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Policy change digest"
                    subtitle="Premium: personalized, readable changes"
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill label={`Unread ${unreadCount}`} tone={unreadCount ? "warn" : "good"} />
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={markAllRead}>
                          <Check className="h-4 w-4" /> Mark all read
                        </Button>
                      </div>
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <SegButton active={digestFilter === "All"} label="All" onClick={() => setDigestFilter("All")} />
                      {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other Service Module"] as ModuleKey[]).map((m) => (
                        <SegButton key={m} active={digestFilter === m} label={m} onClick={() => setDigestFilter(m)} />
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredDigest.map((c) => (
                        <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={c.read ? "Read" : "Unread"} tone={c.read ? "neutral" : "warn"} />
                                {c.modules.map((m) => (
                                  <Pill key={`${c.id}-${m}`} label={m} tone="neutral" />
                                ))}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{c.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(c.ts)} • {timeAgo(c.ts)}</div>
                              <div className="mt-2 text-sm text-slate-700">{c.summary}</div>
                              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                                <div className="font-semibold text-slate-900">Why it matters</div>
                                <div className="mt-1">{c.whyItMattersredacts}</div>
                              </div>
                              <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                                <div className="font-semibold">What to do</div>
                                <div className="mt-1">{c.whatToDo}</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setDigest((prev) => prev.map((x) => (x.id === c.id ? { ...x, read: !x.read } : x)));
                                  toast({ title: "Updated", message: c.read ? "Marked unread" : "Marked read", kind: "info" });
                                }}
                              >
                                <Check className="h-4 w-4" /> Toggle
                              </Button>
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setOpenModule(c.modules[0]);
                                  setTab("modules");
                                  toast({ title: "Opened", message: "Jumped to module policy.", kind: "success" });
                                }}
                              >
                                <ChevronRight className="h-4 w-4" /> View policy
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!filteredDigest.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No changes</div>
                          <div className="mt-1 text-sm text-slate-600">No policy changes match your filter.</div>
                        </div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Premium digest rules" subtitle="How this is personalized" right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Tip icon={<Filter className="h-4 w-4" />} title="Only relevant changes" desc="Digest shows items affecting your org, role, and modules you use." />
                      <Tip icon={<MessagesSquare className="h-4 w-4" />} title="Readable language" desc="No legal jargon. Explains impact and what to do." />
                      <Tip icon={<FileText className="h-4 w-4" />} title="Audit-friendly" desc="Every change can link to an audit record in admin console." />
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: digests can be delivered to Email/WhatsApp/WeChat/SMS as configured by the org.
                    </div>
                  </Section>

                  <Section title="Preferences" subtitle="Optional" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={() => toast({ title: "Notifications", message: "Open preferences (U23).", kind: "info" })}>
                        <Settings className="h-4 w-4" /> Digest preferences
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Support", message: "Open disputes/support (U22).", kind: "info" })}>
                        <MessagesSquare className="h-4 w-4" /> Help
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile bottom nav */}
          <div className="border-t border-slate-200 bg-white/70 px-3 py-2 md:hidden">
            <div className="grid grid-cols-4 gap-2">
              <MobileTab label="Modules" active={tab === "modules"} icon={<ShieldCheck className="h-5 w-5" />} onClick={() => setTab("modules")} />
              <MobileTab label="Fields" active={tab === "fields"} icon={<ClipboardCheck className="h-5 w-5" />} onClick={() => setTab("fields")} />
              <MobileTab label="Sim" active={tab === "simulator"} icon={<Sparkles className="h-5 w-5" />} onClick={() => setTab("simulator")} />
              <MobileTab label="Digest" active={tab === "digest"} icon={<FileText className="h-5 w-5" />} onClick={() => setTab("digest")} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white/60 px-4 py-5 text-xs text-slate-500 md:px-6">
            U3 Corporate Policies Summary. Core: per-module policy summaries, required fields, out-of-policy examples. Premium: policy simulator and change digest.
          </div>
        </div>
      </div>
    </div>
  );
}

function Tip({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
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

function MobileTab({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
        active ? "text-white" : "text-slate-700 hover:bg-slate-100"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      <div className={cn("relative", active ? "text-white" : "text-slate-700")}>{icon}</div>
      <div className="leading-none">{label}</div>
    </button>
  );
}
