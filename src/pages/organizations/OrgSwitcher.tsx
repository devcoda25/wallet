import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Lock,
  Mail,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type LinkStatus = "Linked" | "Invited" | "Not linked" | "Pending review";

type Eligibility = "Active" | "Needs verification" | "Suspended" | "Deposit depleted" | "Not eligible";

type Permission = "Pay" | "Request" | "Approve" | "Withdraw" | "View";

type WalletModule = "E-Commerce" | "EV Charging" | "Rides & Logistics" | "Services" | "School" | "Health" | "Travel";

type DomainPolicy = {
  enabled: boolean;
  domains: string[];
  autoJoin: boolean;
  note: string;
};

type OrgMembership = {
  id: string;
  orgName: string;
  domain?: string;
  linkStatus: LinkStatus;
  eligibility: Eligibility;
  role?: OrgRole;
  isDefault?: boolean;
  lastActiveLabel: string;
  whyUnavailable?: string;
  permissions: Permission[];
  requestedAt?: string;

  // U2-relevant additions
  group?: string;
  costCenter?: string;
  autoApprovalEligible?: boolean;
  autoApprovalThresholdUGX?: number;
  revealThreshold?: boolean;
  domainPolicy?: DomainPolicy;
  moduleEnabled?: Record<WalletModule, boolean>; // Corporate wallet availability by module
};

type ServiceModule = "All" | WalletModule;

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type SmartContext = {
  location: "Kampala CBD" | "Entebbe Airport" | "Jinja" | "Other";
  intent: "Work" | "Travel";
  hint: string;
};

type SmartSuggestionTone = "info" | "warn" | "bad";

type SmartSuggestion = {
  signature: string;
  tone: SmartSuggestionTone;
  title: string;
  message: string;
  reason: string;
  suggestedId: string; // "personal" | orgId
  suggestedLabel: string;
  details: string[];
  primaryLabel: string;
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

function domainOf(email: string) {
  const s = email.trim().toLowerCase();
  const idx = s.lastIndexOf("@");
  if (idx < 0) return "";
  return s.slice(idx + 1);
}

function toneForEligibility(e: Eligibility) {
  if (e === "Active") return "good" as const;
  if (e === "Needs verification") return "warn" as const;
  if (e === "Suspended") return "bad" as const;
  if (e === "Deposit depleted") return "warn" as const;
  return "neutral" as const;
}

function toneForLink(s: LinkStatus) {
  if (s === "Linked") return "good" as const;
  if (s === "Invited") return "info" as const;
  if (s === "Pending review") return "warn" as const;
  return "neutral" as const;
}

function pillToneForSmart(t: SmartSuggestionTone) {
  if (t === "bad") return "bad" as const;
  if (t === "warn") return "warn" as const;
  return "info" as const;
}

function bannerTheme(t: SmartSuggestionTone) {
  if (t === "bad") return { border: "border-rose-200", bg: "bg-rose-50", icon: "bg-white text-rose-700" };
  if (t === "warn") return { border: "border-amber-200", bg: "bg-amber-50", icon: "bg-white text-amber-800" };
  return { border: "border-blue-200", bg: "bg-blue-50", icon: "bg-white text-blue-700" };
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>
      {label}
    </span>
  );
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
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
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
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
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
            {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 1,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      {rows > 1 ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
      )}
    </label>
  );
}

function SelectField({
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
  options: string[];
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("block", disabled && "opacity-70")}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-1 w-full rounded-2xl border p-3 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function PermissionChips({ perms }: { perms: Permission[] }) {
  const ordered: Permission[] = ["View", "Pay", "Request", "Approve", "Withdraw"];
  const shown = ordered.filter((p) => perms.includes(p));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((p) => (
        <Pill key={p} label={p} tone={p === "Approve" ? "info" : p === "Withdraw" ? "warn" : "neutral"} />
      ))}
    </div>
  );
}

function ModuleChips({ enabled }: { enabled: Record<WalletModule, boolean> }) {
  const keys = Object.keys(enabled) as WalletModule[];
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => (
        <Pill key={k} label={k} tone={enabled[k] ? "good" : "neutral"} />
      ))}
    </div>
  );
}

function countEnabled(enabled?: Record<WalletModule, boolean>) {
  if (!enabled) return { on: 0, total: 0 };
  const keys = Object.keys(enabled) as WalletModule[];
  const on = keys.filter((k) => enabled[k]).length;
  return { on, total: keys.length };
}

function SmartSuggestionBanner({
  suggestion,
  onApply,
  onDismiss,
  onOpenSettings,
}: {
  suggestion: SmartSuggestion;
  onApply: () => void;
  onDismiss: () => void;
  onOpenSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const theme = bannerTheme(suggestion.tone);

  useEffect(() => {
    // close details when suggestion changes
    setOpen(false);
  }, [suggestion.signature]);

  return (
    <div className={cn("rounded-3xl border p-4 shadow-sm", theme.border, theme.bg)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", theme.icon)}>
            {suggestion.tone === "bad" ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{suggestion.title}</div>
              <Pill label="Smart suggestion" tone={pillToneForSmart(suggestion.tone)} />
              <Pill label={`Reason: ${suggestion.reason}`} tone="neutral" />
            </div>
            <div className="mt-1 text-sm text-slate-800">{suggestion.message}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill label={`Recommended: ${suggestion.suggestedLabel}`} tone="info" />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70"
                onClick={() => setOpen((p) => !p)}
              >
                <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
                {open ? "Hide details" : "Details"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onApply}>
            <Check className="h-4 w-4" /> {suggestion.primaryLabel}
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" /> Settings
          </Button>
          <Button variant="outline" onClick={onDismiss}>
            <X className="h-4 w-4" /> Dismiss
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-3xl border border-slate-200 bg-white/80 p-4">
              <div className="text-xs font-semibold text-slate-600">Why this appeared</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {suggestion.details.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function WalletSwitcherW02SmartBanner() {
  const MODULES: WalletModule[] = ["E-Commerce", "EV Charging", "Rides & Logistics", "Services", "School", "Health", "Travel"];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Seed orgs combines W02 plus U2-relevant membership details
  const orgsSeed = useMemo<OrgMembership[]>(
    () => [
      {
        id: "ORG-ACME",
        orgName: "Acme Group Ltd",
        domain: "acme.ug",
        linkStatus: "Linked",
        eligibility: "Active",
        role: "Approver",
        isDefault: true,
        lastActiveLabel: "12m ago",
        permissions: ["View", "Pay", "Request", "Approve"],
        group: "Operations",
        costCenter: "OPS-01",
        autoApprovalEligible: true,
        autoApprovalThresholdUGX: 200000,
        revealThreshold: true,
        domainPolicy: { enabled: true, domains: ["acme.ug", "acme.com"], autoJoin: true, note: "Auto-join for verified company domains" },
        moduleEnabled: {
          "E-Commerce": true,
          "EV Charging": true,
          "Rides & Logistics": true,
          Services: true,
          School: true,
          Health: false,
          Travel: true,
        },
      },
      {
        id: "ORG-KHL",
        orgName: "Kampala Holdings",
        domain: "khl.africa",
        linkStatus: "Linked",
        eligibility: "Deposit depleted",
        role: "Member",
        isDefault: false,
        lastActiveLabel: "3h ago",
        whyUnavailable: "Prepaid deposit is depleted. CorporatePay is paused until the organization tops up.",
        permissions: ["View"],
        group: "Travel Desk",
        costCenter: "TRV-02",
        autoApprovalEligible: false,
        revealThreshold: false,
        domainPolicy: { enabled: true, domains: ["khl.africa", "kampalaholdings.com"], autoJoin: false, note: "Domain match requires admin approval" },
        moduleEnabled: {
          "E-Commerce": true,
          "EV Charging": false,
          "Rides & Logistics": true,
          Services: true,
          School: false,
          Health: false,
          Travel: true,
        },
      },
      {
        id: "ORG-DEMO",
        orgName: "EVzone Demo Org",
        domain: "demo.evzone.app",
        linkStatus: "Linked",
        eligibility: "Suspended",
        role: "Viewer",
        isDefault: false,
        lastActiveLabel: "1d ago",
        whyUnavailable: "Billing is not compliant with the invoicing agreement. CorporatePay is suspended.",
        permissions: ["View"],
        group: "Finance",
        costCenter: "FIN-01",
        autoApprovalEligible: true,
        autoApprovalThresholdUGX: 100000,
        revealThreshold: false,
        domainPolicy: { enabled: false, domains: [], autoJoin: false, note: "Invites only" },
        moduleEnabled: {
          "E-Commerce": false,
          "EV Charging": true,
          "Rides & Logistics": true,
          Services: true,
          School: false,
          Health: false,
          Travel: false,
        },
      },
      {
        id: "ORG-INV",
        orgName: "Green Investments Club",
        domain: "greencrowd.io",
        linkStatus: "Invited",
        eligibility: "Needs verification",
        role: "Finance",
        isDefault: false,
        lastActiveLabel: "Invite received",
        whyUnavailable: "KYB verification is required before wallet features are enabled.",
        permissions: ["View"],
        group: "Treasury",
        costCenter: "TRS-01",
        autoApprovalEligible: false,
        revealThreshold: false,
        domainPolicy: { enabled: true, domains: ["greencrowd.io"], autoJoin: false, note: "Invites first, then verification" },
        moduleEnabled: {
          "E-Commerce": true,
          "EV Charging": false,
          "Rides & Logistics": false,
          Services: true,
          School: false,
          Health: false,
          Travel: false,
        },
      },
      {
        id: "ORG-SUP",
        orgName: "Supplier Network Co",
        domain: "supnet.com",
        linkStatus: "Not linked",
        eligibility: "Not eligible",
        isDefault: false,
        lastActiveLabel: "Never",
        whyUnavailable: "You do not have access yet. Request an invite or ask an Admin.",
        permissions: ["View"],
        domainPolicy: { enabled: true, domains: ["supnet.com"], autoJoin: false, note: "Partner directory access requires approval" },
        moduleEnabled: {
          "E-Commerce": true,
          "EV Charging": false,
          "Rides & Logistics": false,
          Services: true,
          School: false,
          Health: false,
          Travel: false,
        },
      },
      {
        id: "ORG-PEND",
        orgName: "City Transport Union",
        domain: "ctu.org",
        linkStatus: "Pending review",
        eligibility: "Not eligible",
        isDefault: false,
        lastActiveLabel: "Requested",
        requestedAt: "Today 10:30",
        whyUnavailable: "Your access request is under review by the organization Admin.",
        permissions: ["View"],
        domainPolicy: { enabled: true, domains: ["ctu.org"], autoJoin: false, note: "Domain match requires approval" },
        moduleEnabled: {
          "E-Commerce": false,
          "EV Charging": true,
          "Rides & Logistics": true,
          Services: true,
          School: false,
          Health: false,
          Travel: true,
        },
      },
    ],
    []
  );

  const [orgs, setOrgs] = useState<OrgMembership[]>(orgsSeed);

  // Active wallet context
  const [activeContextId, setActiveContextId] = useState<string>("personal");

  // Corporate default org (used when modules use DEFAULT)
  const [defaultOrgId, setDefaultOrgId] = useState<string>(orgsSeed.find((o) => o.isDefault)?.id || orgsSeed[0]?.id);

  // Optional: per-module org defaults. "DEFAULT" means use global defaultOrgId.
  const [moduleDefaults, setModuleDefaults] = useState<Record<WalletModule, string | "DEFAULT">>(() =>
    MODULES.reduce((acc, m) => ({ ...acc, [m]: "DEFAULT" }), {} as Record<WalletModule, string | "DEFAULT">)
  );

  const effectiveOrgForModule = (m: WalletModule) => {
    const v = moduleDefaults[m];
    return v === "DEFAULT" ? defaultOrgId : v;
  };

  const moduleDefaultLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MODULES) {
      const oid = effectiveOrgForModule(m);
      const o = orgs.find((x) => x.id === oid);
      map[m] = o ? o.orgName : "-";
    }
    return map as Record<WalletModule, string>;
  }, [MODULES, moduleDefaults, defaultOrgId, orgs]);

  const invites = useMemo(() => orgs.filter((o) => o.linkStatus === "Invited"), [orgs]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LinkStatus>("ALL");

  const filteredOrgs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs
      .filter((o) => (statusFilter === "ALL" ? true : o.linkStatus === statusFilter))
      .filter((o) => (!q ? true : `${o.orgName} ${o.domain ?? ""} ${o.id}`.toLowerCase().includes(q)));
  }, [orgs, query, statusFilter]);

  const activeOrg = useMemo(() => {
    if (activeContextId === "personal") return null;
    return orgs.find((o) => o.id === activeContextId) || null;
  }, [orgs, activeContextId]);

  // Request access modal
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<OrgMembership | null>(null);
  const [reason, setReason] = useState("");
  const [module, setModule] = useState<ServiceModule>("All");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [requestedRole, setRequestedRole] = useState<OrgRole>("Member");

  // Defaults modal
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  // Domain auto-join
  const [userEmail, setUserEmail] = useState("ronald@acme.ug");
  const currentDomain = useMemo(() => domainOf(userEmail), [userEmail]);
  const domainMatches = useMemo(() => {
    const d = currentDomain;
    if (!d) return [] as Array<{ org: OrgMembership; canAutoJoin: boolean; reason: string }>;
    return orgs
      .filter((o) => o.domainPolicy?.enabled)
      .filter((o) => (o.domainPolicy?.domains || []).map((x) => x.toLowerCase()).includes(d))
      .map((o) => ({
        org: o,
        canAutoJoin: Boolean(o.domainPolicy?.autoJoin),
        reason: o.domainPolicy?.autoJoin ? "Auto-join allowed" : "Approval required",
      }));
  }, [orgs, currentDomain]);

  // Smart suggestion settings (moved out of main UI)
  const [smartEnabled, setSmartEnabled] = useState(true);
  const [context, setContext] = useState<SmartContext>({
    location: "Kampala CBD",
    intent: "Work",
    hint: "Normal work context",
  });

  const linkedOrgs = useMemo(() => orgs.filter((o) => o.linkStatus === "Linked"), [orgs]);

  const openWalletAllowed = (o: OrgMembership) => o.linkStatus === "Linked" && o.eligibility === "Active";

  // Compute smart suggestion ONLY when it really matters
  const smartSuggestion = useMemo<SmartSuggestion | null>(() => {
    if (!smartEnabled) return null;

    const activeOrgIsReady =
      activeOrg && activeOrg.linkStatus === "Linked" && activeOrg.eligibility === "Active";

    const activeOrgBlocked = Boolean(activeOrg && (!activeOrgIsReady));

    const travelSignal = context.intent === "Travel" || context.location === "Entebbe Airport";

    const activeTravelReady =
      activeOrgIsReady && Boolean(activeOrg?.moduleEnabled?.Travel);

    const travelCandidates = orgs
      .filter((o) => o.linkStatus === "Linked")
      .filter((o) => o.eligibility === "Active")
      .filter((o) => Boolean(o.moduleEnabled?.Travel));

    const bestTravel = travelCandidates[0] || null;

    // 1) Strong conflict: active org context is blocked
    if (activeOrgBlocked && activeOrg) {
      const bestAlt =
        orgs.find((o) => o.id === defaultOrgId && o.linkStatus === "Linked" && o.eligibility === "Active") ||
        orgs.find((o) => o.linkStatus === "Linked" && o.eligibility === "Active") ||
        null;

      const suggestedId = bestAlt ? bestAlt.id : "personal";
      const suggestedLabel = bestAlt ? bestAlt.orgName : "Personal Wallet";

      const tone: SmartSuggestionTone = activeOrg.eligibility === "Suspended" ? "bad" : "warn";

      return {
        signature: `blocked|${activeOrg.id}|${activeOrg.linkStatus}|${activeOrg.eligibility}|alt:${suggestedId}`,
        tone,
        title: "Wallet context conflict",
        message: `Your current organization wallet is not ready: ${activeOrg.eligibility}. Switching now avoids failed payments and approvals.`,
        reason: activeOrg.eligibility,
        suggestedId,
        suggestedLabel,
        primaryLabel: `Switch to ${suggestedLabel}`,
        details: [
          `Current context: ${activeOrg.orgName} (${activeOrg.eligibility})`,
          activeOrg.whyUnavailable ? `Reason: ${activeOrg.whyUnavailable}` : "Reason: eligibility not Active",
          bestAlt ? `Best alternative: ${bestAlt.orgName} (Active)` : "No active org wallet found, Personal Wallet is safest",
          "This banner appears only when the current context is likely to cause failures.",
        ],
      };
    }

    // 2) High chance mismatch: travel signal + current context is not travel-ready
    if (travelSignal) {
      const currentContextLabel = activeOrg ? activeOrg.orgName : "Personal Wallet";

      // If personal is active, we only show a banner when there's a clearly better org option
      if (activeContextId === "personal" && bestTravel) {
        return {
          signature: `travel|personal|best:${bestTravel.id}|loc:${context.location}|intent:${context.intent}`,
          tone: "info",
          title: "Smart travel suggestion",
          message: `Travel context detected. ${bestTravel.orgName} is enabled for Travel and is Active.`,
          reason: context.location === "Entebbe Airport" ? "Airport detected" : "Travel intent selected",
          suggestedId: bestTravel.id,
          suggestedLabel: bestTravel.orgName,
          primaryLabel: `Switch to ${bestTravel.orgName}`,
          details: [
            `Travel signal: ${context.intent}${context.location === "Entebbe Airport" ? " (airport)" : ""}`,
            `Current context: ${currentContextLabel}`,
            `Suggested: ${bestTravel.orgName} (Active, Travel enabled)`,
            "This banner appears only when travel is detected and a suitable org wallet exists.",
          ],
        };
      }

      // If an org is active but not travel-ready, show suggestion (stronger)
      if (activeOrg && activeOrgIsReady && !activeTravelReady && bestTravel && bestTravel.id !== activeOrg.id) {
        return {
          signature: `travel|org:${activeOrg.id}|best:${bestTravel.id}|loc:${context.location}|intent:${context.intent}`,
          tone: "warn",
          title: "Smart travel suggestion",
          message: `Your current organization wallet is Active but does not have Travel enabled. Switching reduces policy issues during travel flows.`,
          reason: "Travel module mismatch",
          suggestedId: bestTravel.id,
          suggestedLabel: bestTravel.orgName,
          primaryLabel: `Switch to ${bestTravel.orgName}`,
          details: [
            `Travel signal: ${context.intent}${context.location === "Entebbe Airport" ? " (airport)" : ""}`,
            `Current context: ${activeOrg.orgName} (Travel enabled: ${String(Boolean(activeOrg.moduleEnabled?.Travel))})`,
            `Suggested: ${bestTravel.orgName} (Active, Travel enabled)`,
            "This banner appears only when travel is detected and the current org is not suitable.",
          ],
        };
      }

      // Travel detected but no better org: do not show
    }

    return null;
  }, [smartEnabled, activeOrg, activeContextId, orgs, defaultOrgId, context.intent, context.location]);

  const [dismissedSig, setDismissedSig] = useState<string | null>(null);

  const showSmartBanner = Boolean(smartSuggestion && smartSuggestion.signature !== dismissedSig);

  const dismissBanner = () => {
    if (!smartSuggestion) return;
    setDismissedSig(smartSuggestion.signature);
    toast({ kind: "info", title: "Suggestion dismissed" });
  };

  const applySmartSuggestion = () => {
    if (!smartSuggestion) return;
    const id = smartSuggestion.suggestedId;
    if (id === "personal") {
      setActiveContextId("personal");
      toast({ kind: "success", title: "Active context", message: "Personal Wallet" });
      return;
    }
    const org = orgs.find((o) => o.id === id);
    setActiveContextId(id);
    toast({ kind: "success", title: "Active context", message: org ? org.orgName : id });
  };

  const openRequest = (org: OrgMembership) => {
    setRequestTarget(org);
    setReason("");
    setModule("All");
    setUrgency("Normal");
    setRequestedRole("Member");
    setRequestOpen(true);
  };

  const acceptInvite = (orgId: string) => {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
            ...o,
            linkStatus: "Linked",
            eligibility: "Needs verification",
            lastActiveLabel: "Just now",
            whyUnavailable: "Complete verification to enable payments and payouts.",
            permissions: ["View"],
          }
          : o
      )
    );
    toast({ kind: "success", title: "Invite accepted", message: "Organization wallet added. Verification may be required." });
  };

  const declineInvite = (orgId: string) => {
    setOrgs((prev) => prev.filter((o) => o.id !== orgId));
    toast({ kind: "info", title: "Invite declined" });
  };

  const submitRequest = () => {
    if (!requestTarget) return;
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === requestTarget.id
          ? {
            ...o,
            linkStatus: "Pending review",
            requestedAt: "Now",
            lastActiveLabel: "Requested",
            role: o.role ?? requestedRole,
            whyUnavailable: `Access request submitted. Module: ${module}. Urgency: ${urgency}. Requested role: ${requestedRole}.`,
          }
          : o
      )
    );
    setRequestOpen(false);
    toast({ kind: "success", title: "Request submitted", message: "You will be notified when an Admin responds." });
  };

  const doAutoJoin = (orgId: string) => {
    const org = orgs.find((o) => o.id === orgId);
    if (!org) return;

    const dp = org.domainPolicy;
    if (!dp?.enabled) {
      toast({ kind: "warn", title: "Not available", message: "This organization does not support domain auto-join." });
      return;
    }

    if (!dp.autoJoin) {
      toast({ kind: "warn", title: "Approval required", message: "This org requires approval even with domain match." });
      openRequest(org);
      return;
    }

    setOrgs((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
            ...o,
            linkStatus: "Linked",
            eligibility: "Active",
            whyUnavailable: "",
            lastActiveLabel: "Just now",
            role: o.role ?? "Member",
            permissions: o.permissions.length ? o.permissions : ["View", "Pay", "Request"],
          }
          : o
      )
    );

    setActiveContextId(orgId);
    setDefaultOrgId(orgId);
    toast({ kind: "success", title: "Joined", message: `Auto-joined ${org.orgName} using domain policy.` });
  };

  const setDefaultOrg = (orgId: string) => {
    setDefaultOrgId(orgId);
    setOrgs((prev) => prev.map((o) => ({ ...o, isDefault: o.id === orgId })));
    toast({ kind: "success", title: "Default updated", message: "Global default organization updated." });
  };

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Your browser blocked clipboard access." });
    }
  };

  const isOrgSelectable = (o: OrgMembership) =>
    o.linkStatus === "Linked" || o.linkStatus === "Invited" || o.linkStatus === "Pending review" || o.linkStatus === "Not linked";

  const canOpenOrgWallet = (o: OrgMembership) => openWalletAllowed(o);

  const linkedOrgsOnly = useMemo(() => orgs.filter((o) => o.linkStatus === "Linked"), [orgs]);

  // Ensure dismissed banner comes back when conflict changes
  useEffect(() => {
    if (!smartSuggestion) return;
    // if dismissed signature doesn't match current suggestion, let it show
    // (no-op; the computed boolean already handles this)
  }, [smartSuggestion]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wallet Context</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your personal and organization wallets, memberships, and defaults.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setDefaultsOpen(true)}>
              <Settings className="h-4 w-4" /> Defaults
            </Button>
            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Join", message: "Use the Domain tab to find orgs." })}>
              <Plus className="h-4 w-4" /> Join Organization
            </Button>
          </div>
        </div>

        {/* Smart Suggestion Banner */}
        <AnimatePresence>
          {showSmartBanner && smartSuggestion ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <SmartSuggestionBanner
                suggestion={smartSuggestion}
                onApply={applySmartSuggestion}
                onDismiss={dismissBanner}
                onOpenSettings={() => setDefaultsOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main List */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {/* Personal Wallet Card */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-[32px] border p-6 transition-all duration-300",
                  activeContextId === "personal"
                    ? "border-emerald-500/50 bg-white ring-4 ring-emerald-500/10"
                    : "border-slate-200 bg-white hover:border-emerald-200"
                )}
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-[-10px] rounded-full bg-emerald-50 blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                    <WalletIcon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">Personal Wallet</h3>
                      {activeContextId === "personal" ? <Pill label="Active Context" tone="good" /> : null}
                      {defaultOrgId === "personal" ? <Pill label="Global Default" tone="info" /> : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium text-slate-900">UGX 1,540,200</span>
                      <span>•</span>
                      <span>Ronald Richards</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {activeContextId === "personal" ? (
                        <Button disabled className="bg-emerald-50 text-emerald-700">
                          <Check className="h-4 w-4" /> Active
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => { setActiveContextId("personal"); toast({ kind: "success", title: "Active context", message: "Personal Wallet" }); }}>
                          Select
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Top up", message: "Mobile Money, Card, or Bank transfer" })}>
                        Top up
                      </Button>
                      <Button variant="ghost" onClick={() => copy("0771234567")}>
                        <Copy className="h-4 w-4" /> 077...567
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search organizations..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Linked">Linked</option>
                    <option value="Invited">Invites</option>
                    <option value="Not linked">Not linked</option>
                  </select>
                </div>
              </div>

              {/* Organization List */}
              <div className="grid gap-4">
                {filteredOrgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white py-16 text-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-400">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="mt-4 text-base font-semibold text-slate-900">No organizations found</div>
                    <div className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</div>
                    <Button variant="outline" className="mt-6" onClick={() => { setQuery(""); setStatusFilter("ALL"); }}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  filteredOrgs.map((org) => {
                    const isOpen = expanded === org.id;
                    const isActive = activeContextId === org.id;
                    const isDef = defaultOrgId === org.id;
                    const canOpen = canOpenOrgWallet(org);

                    return (
                      <motion.div
                        layout
                        key={org.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "group relative overflow-hidden rounded-[28px] border bg-white transition-all duration-300",
                          isActive
                            ? "border-emerald-500/50 shadow-md ring-4 ring-emerald-500/5 z-10"
                            : "border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-5">
                          <div className={cn(
                            "grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold transition-colors",
                            isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          )}>
                            {org.orgName.charAt(0)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900">{org.orgName}</h4>
                              <Pill label={org.linkStatus} tone={toneForLink(org.linkStatus)} />
                              <Pill label={`Eligible: ${org.eligibility}`} tone={toneForEligibility(org.eligibility)} />
                              {isActive && <Pill label="Active" tone="good" />}
                              {isDef && <Pill label="Default" tone="info" />}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" /> {org.role || "No role"}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" /> {org.domain || "No domain"}
                              </div>
                              {org.group && (
                                <div className="flex items-center gap-1.5">
                                  <Ticket className="h-4 w-4" /> {org.group}
                                </div>
                              )}
                            </div>

                            {/* Eligibility warnings */}
                            {org.whyUnavailable && (
                              <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-xs font-medium text-orange-800">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                {org.whyUnavailable}
                              </div>
                            )}

                            {/* Action Bar */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {isActive ? (
                                <Button disabled className="bg-emerald-50 text-emerald-700">
                                  <Check className="h-4 w-4" /> Selected
                                </Button>
                              ) : (
                                <Button
                                  variant={canOpen ? "primary" : "outline"}
                                  disabled={!canOpen}
                                  onClick={() => {
                                    setActiveContextId(org.id);
                                    toast({ kind: "success", title: "Active context", message: org.orgName });
                                  }}
                                  title={!canOpen ? "Fix eligibility issues first" : "Switch to this wallet"}
                                >
                                  {canOpen ? "Select" : "Unavailable"}
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                onClick={() => setExpanded(isOpen ? null : org.id)}
                                className={cn(isOpen && "bg-slate-100")}
                              >
                                {isOpen ? "Less info" : "More info"}
                                <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                              </Button>

                              {org.linkStatus === "Invited" && (
                                <>
                                  <Button variant="primary" onClick={() => acceptInvite(org.id)}>
                                    Accept Invite
                                  </Button>
                                  <Button variant="danger" onClick={() => declineInvite(org.id)}>
                                    Decline
                                  </Button>
                                </>
                              )}

                              {org.linkStatus === "Not linked" && (
                                <Button variant="outline" onClick={() => openRequest(org)}>
                                  Request Access
                                </Button>
                              )}

                              {org.linkStatus === "Linked" && !isDef && (
                                <Button variant="ghost" onClick={() => setDefaultOrg(org.id)} title="Make default">
                                  Set default
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 bg-slate-50/50 px-5 py-4"
                            >
                              <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Permissions</div>
                                  <div className="mt-2">
                                    <PermissionChips perms={org.permissions} />
                                  </div>

                                  <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Available Modules</div>
                                  <div className="mt-2">
                                    {org.moduleEnabled ? <ModuleChips enabled={org.moduleEnabled} /> : <div className="text-sm text-slate-500">Global only</div>}
                                  </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Organization ID</span>
                                    <span className="font-mono font-medium text-slate-900">{org.id}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Cost center</span>
                                    <span className="font-medium text-slate-900">{org.costCenter || "-"}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Auto-approval</span>
                                    <span className="font-medium text-slate-900">
                                      {org.autoApprovalEligible
                                        ? `Up to ${formatUGX(org.autoApprovalThresholdUGX || 0)}`
                                        : "Not eligible"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Last used</span>
                                    <span className="font-medium text-slate-900">{org.lastActiveLabel}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Joined</span>
                                    <span className="font-medium text-slate-900">{org.requestedAt || "Previously"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end gap-2">
                                <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => toast({ kind: "error", title: "Action unavailable", message: "Contact support to leave an organization." })}>
                                  Leave Organization
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Domain View */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {/* Invites Card (if any) */}
              {invites.length > 0 && (
                <div className="rounded-[32px] border border-blue-200 bg-blue-50 p-6">
                  <div className="flex items-center gap-3 text-blue-800">
                    <Mail className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Pending Invites</h3>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    You have {invites.length} pending invitation{invites.length > 1 ? "s" : ""}.
                  </p>
                  <div className="mt-4 space-y-3">
                    {invites.map((inv) => (
                      <div key={inv.id} className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="font-bold text-slate-900">{inv.orgName}</div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={() => acceptInvite(inv.id)}>
                            Accept
                          </Button>
                          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => declineInvite(inv.id)}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Find by Domain */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Find by Domain</h3>
                  <Info className="h-5 w-5 text-slate-400" />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Your email domain</div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="font-mono text-sm text-slate-600">@{currentDomain}</span>
                    <BadgeCheck className="h-4 w-4 text-emerald-500" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {domainMatches.length > 0 ? (
                      domainMatches.map((m) => (
                        <div key={m.org.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{m.org.orgName}</div>
                                <Pill label={m.reason} tone={m.canAutoJoin ? "good" : "warn"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{m.org.domainPolicy?.note}</div>
                            </div>
                            <Button
                              variant={m.canAutoJoin ? "primary" : "outline"}
                              className="px-3 py-2"
                              onClick={() => (m.canAutoJoin ? doAutoJoin(m.org.id) : openRequest(m.org))}
                            >
                              <ChevronRight className="h-4 w-4" /> {m.canAutoJoin ? "Join" : "Request"}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                        No domain matches. Ask your organization Admin to invite you.
                      </div>
                    )}
                  </div>
                </div>

                {/* Create org wallet CTA */}
                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{
                    background:
                      "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.22), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Create Organization Wallet</div>
                      <div className="mt-1 text-sm text-slate-600">Start KYB onboarding and set up corporate funding, approvals, and policies.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="accent" onClick={() => toast({ kind: "info", title: "Start KYB", message: "Deep link to Admin KYB onboarding." })}>
                          <ChevronRight className="h-4 w-4" /> Start KYB
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Requirements", message: "Explain requirements, tiers, and timelines." })}>
                          <Info className="h-4 w-4" /> Requirements
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium behaviors */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium behavior</div>
                      <div className="mt-1 text-xs text-slate-500">What this screen guarantees</div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Personal Wallet always available
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Clear eligibility and policy signals for org wallets
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Smart suggestion banner only appears when there is a real conflict or high-risk mismatch
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Domain auto-join and request access flows
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request access modal */}
      <Modal
        open={requestOpen}
        title="Request organization access"
        subtitle={requestTarget ? `Ask to join ${requestTarget.orgName}` : ""}
        onClose={() => setRequestOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Requests are audited and sent to org Admins.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitRequest} disabled={!reason.trim()} title={!reason.trim() ? "Add a reason" : "Submit"}>
                <ChevronRight className="h-4 w-4" /> Submit
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Request details</div>
                <div className="mt-1 text-sm text-slate-600">Explain why you need access and what you will use it for.</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <TextField label="Reason" value={reason} onChange={setReason} placeholder="Example: Finance team member handling supplier payouts" rows={4} />
              <SelectField label="Module" value={module} onChange={(v) => setModule(v as ServiceModule)} options={["All", ...MODULES]} />
              <SelectField label="Urgency" value={urgency} onChange={(v) => setUrgency(v as any)} options={["Normal", "Urgent"]} />
              <SelectField label="Requested role" value={requestedRole} onChange={(v) => setRequestedRole(v as OrgRole)} options={["Member", "Approver", "Finance", "Admin", "Owner", "Viewer"]} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">What happens next</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Org Admin receives your request</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Permissions are assigned by role</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />You get notified when approved</li>
            </ul>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Tip</div>
                  <div className="mt-1 text-sm text-slate-600">Keep your EVzone profile details accurate to speed up approval.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Profile", message: "Open profile" })}>
                <ChevronRight className="h-4 w-4" /> Profile
              </Button>
              <Button variant="accent" onClick={() => toast({ kind: "info", title: "Contact Admin", message: "Open org contact methods" })}>
                <ChevronRight className="h-4 w-4" /> Contact Admin
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Defaults modal (U2-inspired) */}
      <Modal
        open={defaultsOpen}
        title="Defaults"
        subtitle="Global default org, per-module defaults, and smart suggestion settings"
        onClose={() => setDefaultsOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Defaults apply at checkout and during approvals.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDefaultsOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDefaultsOpen(false);
                  toast({ kind: "success", title: "Saved", message: "Defaults saved." });
                }}
              >
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Global default organization</div>
            <div className="mt-2 text-sm text-slate-600">Used when module defaults are not overridden.</div>
            <div className="mt-4">
              <SelectField
                label="Default org"
                value={defaultOrgId}
                onChange={(v) => setDefaultOrg(v)}
                options={linkedOrgsOnly.length ? linkedOrgsOnly.map((o) => o.id) : orgs.map((o) => o.id)}
                hint="Org id"
              />
              <div className="mt-2 text-xs text-slate-500">Default: {orgs.find((o) => o.id === defaultOrgId)?.orgName || "-"}</div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4" />
                <div>Use per-module defaults only if you truly need different billing policies per module.</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModuleDefaults(MODULES.reduce((acc, m) => ({ ...acc, [m]: "DEFAULT" }), {} as any));
                  toast({ kind: "info", title: "Reset", message: "Per-module overrides cleared." });
                }}
              >
                <Settings className="h-4 w-4" /> Reset overrides
              </Button>
            </div>

            {/* Smart settings */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Smart suggestions</div>
                  <div className="mt-1 text-xs text-slate-500">Banner appears only when there is a conflict or high-risk mismatch</div>
                </div>
                <Pill label={smartEnabled ? "Enabled" : "Disabled"} tone={smartEnabled ? "info" : "neutral"} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <Button
                  variant={smartEnabled ? "primary" : "outline"}
                  className="justify-between"
                  onClick={() => {
                    setSmartEnabled((v) => !v);
                    toast({ kind: "success", title: "Smart suggestions", message: smartEnabled ? "Disabled" : "Enabled" });
                    setDismissedSig(null);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {smartEnabled ? "Turn off smart suggestions" : "Turn on smart suggestions"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <SelectField
                  label="Intent"
                  value={context.intent}
                  onChange={(v) => {
                    const intent = v as SmartContext["intent"];
                    setContext((p) => ({ ...p, intent }));
                    setDismissedSig(null);
                  }}
                  options={["Work", "Travel"]}
                  hint="Optional"
                  disabled={!smartEnabled}
                />

                <SelectField
                  label="Location"
                  value={context.location}
                  onChange={(v) => {
                    const loc = v as SmartContext["location"];
                    setContext((p) => ({
                      ...p,
                      location: loc,
                      hint: loc === "Entebbe Airport" ? "Airport detected" : loc === "Jinja" ? "Out-of-town travel" : "Normal city context",
                    }));
                    setDismissedSig(null);
                  }}
                  options={["Kampala CBD", "Entebbe Airport", "Jinja", "Other"]}
                  hint="Simulated"
                  disabled={!smartEnabled}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold text-slate-800">How it triggers</div>
                      <div className="mt-1">1) Org context not Active or not Linked, 2) Travel intent with a better Travel-enabled org available.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Per-module defaults</div>
            <div className="mt-2 text-sm text-slate-600">Optional: assign different org defaults per module.</div>

            <div className="mt-4 space-y-2">
              {MODULES.map((m) => (
                <div key={m} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m}</div>
                      <div className="mt-1 text-xs text-slate-500">Effective: {moduleDefaultLabels[m]}</div>
                    </div>
                    <div className="min-w-[260px]">
                      <select
                        value={moduleDefaults[m]}
                        onChange={(e) => {
                          const v = e.target.value as any;
                          setModuleDefaults((p) => ({ ...p, [m]: v }));
                          toast({ kind: "success", title: "Updated", message: `Default set for ${m}.` });
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="DEFAULT">Use global default</option>
                        {linkedOrgsOnly.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.orgName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              If a selected org is not eligible for a module, checkout may fall back to Personal Wallet or request approvals.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
