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
  Copy,
  Info,
  MapPin,
  Search,
  Sparkles,
  Tag,
  Timer,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";

type Marketplace = "MyLiveDealz" | "EVmart" | "ServiceMart" | "Other";

type EcommerceCategory = "Office supplies" | "Electronics" | "Vehicles" | "Catering" | "Medical" | "Other";

type Req = "Required" | "Optional" | "Not used";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type PickerItem = {
  id: string;
  label: string;
  meta?: string;
  kind?: "default" | "suggested" | "normal";
};

type ValidationLevel = "ok" | "warn" | "block";

type Validation = { level: ValidationLevel; reasons: string[]; suggestions: string[] };

type Suggestion = { id: string; title: string; reason: string; apply: () => void; type: "Policy" | "History" | "Context" | "Safety" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
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
  maxW = "860px",
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

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function PickRow({
  label,
  value,
  hint,
  required,
  onPick,
  locked,
}: {
  label: string;
  value: string;
  hint?: string;
  required?: boolean;
  onPick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50",
        locked && "cursor-not-allowed opacity-70"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-600">{label}</div>
          {required ? <Pill label="Required" tone="warn" /> : <Pill label="Optional" tone="neutral" />}
        </div>
        <div className="mt-1 truncate text-sm font-semibold text-slate-900">{value || "Not set"}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function ListPicker({
  items,
  selectedId,
  onSelect,
  placeholder,
  allowClear,
}: {
  items: PickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = !query
      ? items
      : items.filter((i) => `${i.label} ${i.meta || ""}`.toLowerCase().includes(query));

    // Sort: default then suggested then normal
    const rank = (k?: PickerItem["kind"]) => (k === "default" ? 0 : k === "suggested" ? 1 : 2);
    return filtered.slice().sort((a, b) => rank(a.kind) - rank(b.kind) || a.label.localeCompare(b.label));
  }, [items, q]);

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder || "Search"}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
        {q ? (
          <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {allowClear ? (
          <button
            type="button"
            className={cn(
              "w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold",
              !selectedId ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => onSelect("")}
          >
            Clear selection
          </button>
        ) : null}

        {list.map((i) => {
          const active = i.id === selectedId;
          return (
            <button
              key={i.id}
              type="button"
              className={cn(
                "w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold",
                active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
              onClick={() => onSelect(i.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{i.label}</div>
                    {i.kind === "default" ? <Pill label="Default" tone="info" /> : i.kind === "suggested" ? <Pill label="Suggested" tone="info" /> : null}
                  </div>
                  {i.meta ? <div className="mt-1 text-xs text-slate-500">{i.meta}</div> : null}
                </div>
                {active ? <Check className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
              </div>
            </button>
          );
        })}

        {!list.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No results.</div> : null}
      </div>
    </div>
  );
}

function validateAllocation({
  groupRequired,
  costCenterRequired,
  projectRequired,
  purposeRequired,
  groupId,
  costCenterId,
  projectTagId,
  purposeCodeId,
  moduleCtx,
  marketplace,
  category,
}: {
  groupRequired: boolean;
  costCenterRequired: boolean;
  projectRequired: boolean;
  purposeRequired: boolean;
  groupId: string;
  costCenterId: string;
  projectTagId: string;
  purposeCodeId: string;
  moduleCtx: ModuleKey;
  marketplace: Marketplace;
  category: EcommerceCategory;
}): Validation {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  // Required fields
  if (groupRequired && !groupId) {
    reasons.push("Group is required.");
    suggestions.push("Select a group before continuing.");
    return { level: "block", reasons, suggestions };
  }

  if (costCenterRequired && !costCenterId) {
    reasons.push("Cost center is required.");
    suggestions.push("Select a cost center before continuing.");
    return { level: "block", reasons, suggestions };
  }

  if (projectRequired && !projectTagId) {
    reasons.push("Project tag is required.");
    suggestions.push("Select a project tag before continuing.");
    return { level: "block", reasons, suggestions };
  }

  if (purposeRequired && !purposeCodeId) {
    reasons.push("Purpose code is required.");
    suggestions.push("Select a purpose code.");
    return { level: "block", reasons, suggestions };
  }

  // Prevent misallocation (warnings)
  if (moduleCtx === "E-Commerce") {
    if (category === "Vehicles" && projectTagId && !["proj_capex", "proj_fleet"].includes(projectTagId)) {
      reasons.push("Vehicles should be allocated to CapEx or Fleet project tags.");
      suggestions.push("Change project tag to CapEx or Fleet.");
    }

    if (category === "Medical" && projectTagId && !["proj_health", "proj_ops"].includes(projectTagId)) {
      reasons.push("Medical purchases are usually billed to Health or Operations.");
      suggestions.push("Change project tag to Health or Operations.");
    }

    if (category === "Catering" && purposeCodeId && !["purpose_meeting", "purpose_event"].includes(purposeCodeId)) {
      reasons.push("Catering purchases should use Meeting or Event purpose codes.");
      suggestions.push("Change purpose code to Meeting or Event.");
    }

    if (marketplace === "MyLiveDealz" && purposeCodeId === "purpose_personal") {
      reasons.push("MyLiveDealz corporate purchases should not be tagged as Personal.");
      suggestions.push("Use Office, Project, Meeting, or Campaign purpose.");
    }
  }

  if (moduleCtx === "Rides & Logistics") {
    if (purposeCodeId === "purpose_personal") {
      reasons.push("Corporate rides should not use Personal purpose.");
      suggestions.push("Use Airport, Client meeting, Office commute, or Delivery.");
    }
  }

  const level: ValidationLevel = reasons.length ? "warn" : "ok";
  if (!reasons.length) {
    reasons.push("Allocation looks good.");
    suggestions.push("Continue.");
  }

  return { level, reasons, suggestions };
}

export default function UserCorporateAllocationPickerU9() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Context
  const [orgName, setOrgName] = useState("Acme Group Ltd");
  const [moduleCtx, setModuleCtx] = useState<ModuleKey>("E-Commerce");
  const [marketplace, setMarketplace] = useState<Marketplace>("MyLiveDealz");
  const [category, setCategory] = useState<EcommerceCategory>("Office supplies");

  // Policy (per module)
  const reqs: { group: Req; costCenter: Req; projectTag: Req; purposeCode: Req } = useMemo(() => {
    if (moduleCtx === "Rides & Logistics") return { group: "Optional", costCenter: "Required", projectTag: "Optional", purposeCode: "Required" };
    if (moduleCtx === "EVs & Charging") return { group: "Optional", costCenter: "Required", projectTag: "Optional", purposeCode: "Optional" };
    if (moduleCtx === "E-Commerce") return { group: "Optional", costCenter: "Required", projectTag: "Optional", purposeCode: "Optional" };
    return { group: "Optional", costCenter: "Required", projectTag: "Optional", purposeCode: "Optional" };
  }, [moduleCtx]);

  // Membership and admin defaults
  const membershipGroups: PickerItem[] = useMemo(() => {
    return [
      { id: "grp_ops", label: "Operations", meta: "General operations", kind: "default" },
      { id: "grp_admin", label: "Admin", meta: "Admin and support", kind: "normal" },
      { id: "grp_proc", label: "Procurement", meta: "Vendor and RFQ desk", kind: "normal" },
      { id: "grp_fin", label: "Finance", meta: "Billing and reconciliations", kind: "normal" },
      { id: "grp_sales", label: "Sales", meta: "Sales field ops", kind: "normal" },
    ];
  }, []);

  const userBelongsTo: string[] = useMemo(() => ["grp_ops", "grp_admin"], []); // demo: user has multiple groups

  const groupsForUser = useMemo(() => membershipGroups.filter((g) => userBelongsTo.includes(g.id)), [membershipGroups, userBelongsTo]);

  const costCenters: PickerItem[] = useMemo(() => {
    return [
      { id: "cc_ops_01", label: "OPS-01", meta: "Operations main", kind: "default" },
      { id: "cc_ops_02", label: "OPS-02", meta: "Operations projects", kind: "normal" },
      { id: "cc_adm_02", label: "ADM-02", meta: "Admin", kind: "normal" },
      { id: "cc_fin_01", label: "FIN-01", meta: "Finance", kind: "normal" },
      { id: "cc_sal_03", label: "SAL-03", meta: "Sales travel", kind: "normal" },
    ];
  }, []);

  const projectTags: PickerItem[] = useMemo(() => {
    return [
      { id: "proj_client", label: "Client Onboarding", meta: "Client project", kind: "default" },
      { id: "proj_campaign", label: "Q1 Campaign", meta: "Campaign costs", kind: "normal" },
      { id: "proj_event", label: "Event", meta: "Events and visitor handling", kind: "normal" },
      { id: "proj_maint", label: "Maintenance", meta: "Repairs and upkeep", kind: "normal" },
      { id: "proj_training", label: "Training", meta: "Training and learning", kind: "normal" },
      { id: "proj_capex", label: "CapEx", meta: "High value assets", kind: "normal" },
      { id: "proj_fleet", label: "Fleet", meta: "Vehicles and mobility assets", kind: "normal" },
      { id: "proj_health", label: "Health", meta: "Medical operations", kind: "normal" },
    ];
  }, []);

  const purposeCodes: PickerItem[] = useMemo(() => {
    return [
      { id: "purpose_airport", label: "Airport", meta: "Travel and airport trips", kind: "suggested" },
      { id: "purpose_client", label: "Client meeting", meta: "Meetings and visits", kind: "suggested" },
      { id: "purpose_office", label: "Office", meta: "Office supplies and admin", kind: "normal" },
      { id: "purpose_commute", label: "Office commute", meta: "Home to office", kind: "normal" },
      { id: "purpose_event", label: "Event", meta: "Events and visitors", kind: "normal" },
      { id: "purpose_meeting", label: "Meeting", meta: "Meeting expenses", kind: "normal" },
      { id: "purpose_delivery", label: "Delivery", meta: "Courier and logistics", kind: "normal" },
      { id: "purpose_charging", label: "Charging", meta: "Charging and energy", kind: "normal" },
      { id: "purpose_personal", label: "Personal", meta: "Not recommended for corporate", kind: "normal" },
    ];
  }, []);

  // Admin-defined defaults
  const adminDefaults = useMemo(() => {
    return {
      groupId: groupsForUser[0]?.id || "",
      costCenterId: "cc_ops_01",
      projectTagId: "proj_client",
      purposeCodeId: moduleCtx === "Rides & Logistics" ? "purpose_client" : "purpose_office",
    };
  }, [groupsForUser, moduleCtx]);

  // Selected values
  const [groupId, setGroupId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [projectTagId, setProjectTagId] = useState("");
  const [purposeCodeId, setPurposeCodeId] = useState("");

  // Apply defaults initially and when module changes (best effort)
  useEffect(() => {
    setGroupId((prev) => prev || adminDefaults.groupId);
    setCostCenterId((prev) => prev || adminDefaults.costCenterId);
    setProjectTagId((prev) => prev || adminDefaults.projectTagId);
    setPurposeCodeId((prev) => prev || adminDefaults.purposeCodeId);
  }, [adminDefaults]);

  // Premium: smart suggestions inputs
  const [locationText, setLocationText] = useState("Kampala - Office");
  const [calendarText, setCalendarText] = useState("Client meeting with ABC");
  const [historyLastByModule] = useState<Record<ModuleKey, { projectTagId: string; costCenterId: string }>>({
    "Rides & Logistics": { projectTagId: "proj_client", costCenterId: "cc_sal_03" },
    "E-Commerce": { projectTagId: "proj_campaign", costCenterId: "cc_ops_01" },
    "EVs & Charging": { projectTagId: "proj_fleet", costCenterId: "cc_ops_02" },
    Other: { projectTagId: "proj_maint", costCenterId: "cc_ops_02" },
  });

  const suggestionList = useMemo<Suggestion[]>(() => {
    const sug: Suggestion[] = [];

    const loc = locationText.toLowerCase();
    const cal = calendarText.toLowerCase();

    // History-based
    const h = historyLastByModule[moduleCtx];
    if (h) {
      sug.push({
        id: "hist",
        title: "Use your last allocation for this module",
        reason: "Based on your previous successful transactions.",
        type: "History",
        apply: () => {
          setProjectTagId(h.projectTagId);
          setCostCenterId(h.costCenterId);
          toast({ title: "Applied", message: "Used your last allocation.", kind: "success" });
        },
      });
    }

    // Context-based
    if (loc.includes("airport") || loc.includes("entebbe")) {
      sug.push({
        id: "ctx-airport",
        title: "Set purpose to Airport",
        reason: "Location indicates airport context.",
        type: "Context",
        apply: () => {
          setPurposeCodeId("purpose_airport");
          setProjectTagId((prev) => prev || "proj_event");
          toast({ title: "Applied", message: "Airport purpose selected.", kind: "success" });
        },
      });
    }

    if (cal.includes("client")) {
      sug.push({
        id: "ctx-client",
        title: "Set project to Client Onboarding",
        reason: "Calendar indicates a client meeting.",
        type: "Context",
        apply: () => {
          setProjectTagId("proj_client");
          setPurposeCodeId((prev) => prev || "purpose_client");
          toast({ title: "Applied", message: "Client allocation applied.", kind: "success" });
        },
      });
    }

    if (cal.includes("event") || cal.includes("conference") || cal.includes("training")) {
      sug.push({
        id: "ctx-event",
        title: "Set project to Event or Training",
        reason: "Calendar keyword suggests event or training.",
        type: "Context",
        apply: () => {
          setProjectTagId(cal.includes("training") ? "proj_training" : "proj_event");
          setPurposeCodeId(cal.includes("training") ? "purpose_meeting" : "purpose_event");
          toast({ title: "Applied", message: "Event or training allocation applied.", kind: "success" });
        },
      });
    }

    // Policy and misallocation prevention
    if (moduleCtx === "E-Commerce" && category === "Vehicles") {
      sug.push({
        id: "policy-vehicles",
        title: "Use CapEx or Fleet for vehicles",
        reason: "Prevents misallocation for high-value assets.",
        type: "Safety",
        apply: () => {
          setProjectTagId("proj_capex");
          setPurposeCodeId((prev) => prev || "purpose_office");
          toast({ title: "Applied", message: "CapEx tag applied.", kind: "success" });
        },
      });
    }

    if (moduleCtx === "E-Commerce" && category === "Catering") {
      sug.push({
        id: "policy-catering",
        title: "Use Meeting purpose for catering",
        reason: "Catering should be tied to meeting or event.",
        type: "Safety",
        apply: () => {
          setPurposeCodeId("purpose_meeting");
          setProjectTagId((prev) => prev || "proj_event");
          toast({ title: "Applied", message: "Meeting purpose applied.", kind: "success" });
        },
      });
    }

    return sug.slice(0, 6);
  }, [locationText, calendarText, historyLastByModule, moduleCtx, category, toast]);

  // Add suggested markers into list pickers
  const costCentersWithHints = useMemo(() => {
    const base = costCenters.slice();
    // Mark admin default
    const defIdx = base.findIndex((x) => x.id === adminDefaults.costCenterId);
    if (defIdx >= 0) base[defIdx] = { ...base[defIdx], kind: "default" };

    // Mark suggested based on history
    const h = historyLastByModule[moduleCtx]?.costCenterId;
    const hIdx = base.findIndex((x) => x.id === h);
    if (hIdx >= 0 && base[hIdx].kind !== "default") base[hIdx] = { ...base[hIdx], kind: "suggested" };

    return base;
  }, [costCenters, adminDefaults.costCenterId, historyLastByModule, moduleCtx]);

  const projectTagsWithHints = useMemo(() => {
    const base = projectTags.slice();
    const defIdx = base.findIndex((x) => x.id === adminDefaults.projectTagId);
    if (defIdx >= 0) base[defIdx] = { ...base[defIdx], kind: "default" };

    const h = historyLastByModule[moduleCtx]?.projectTagId;
    const hIdx = base.findIndex((x) => x.id === h);
    if (hIdx >= 0 && base[hIdx].kind !== "default") base[hIdx] = { ...base[hIdx], kind: "suggested" };

    return base;
  }, [projectTags, adminDefaults.projectTagId, historyLastByModule, moduleCtx]);

  // Validation
  const validation = useMemo(() => {
    const groupRequired = reqs.group === "Required";
    const costCenterRequired = reqs.costCenter === "Required";
    const projectRequired = reqs.projectTag === "Required";
    const purposeRequired = reqs.purposeCode === "Required";

    return validateAllocation({
      groupRequired,
      costCenterRequired,
      projectRequired,
      purposeRequired,
      groupId,
      costCenterId,
      projectTagId,
      purposeCodeId,
      moduleCtx,
      marketplace,
      category,
    });
  }, [reqs, groupId, costCenterId, projectTagId, purposeCodeId, moduleCtx, marketplace, category]);

  // Modals
  const [groupOpen, setGroupOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);

  const groupLabel = (id: string) => groupsForUser.find((g) => g.id === id)?.label || "";
  const ccLabel = (id: string) => costCenters.find((c) => c.id === id)?.label || "";
  const projLabel = (id: string) => projectTags.find((p) => p.id === id)?.label || "";
  const purposeLabel = (id: string) => purposeCodes.find((p) => p.id === id)?.label || "";

  const groupValue = groupId ? groupLabel(groupId) : "";
  const ccValue = costCenterId ? ccLabel(costCenterId) : "";
  const projValue = projectTagId ? projLabel(projectTagId) : "";
  const purposeValue = purposeCodeId ? purposeLabel(purposeCodeId) : "";

  const canContinue = validation.level !== "block";

  const statusPill = validation.level === "ok" ? <Pill label="Ready" tone="good" /> : validation.level === "warn" ? <Pill label="Review" tone="warn" /> : <Pill label="Fix required" tone="bad" />;

  const copyAllocation = async () => {
    const text = `Org: ${orgName}\nModule: ${moduleCtx}\nMarketplace: ${marketplace}\nCategory: ${category}\nGroup: ${groupValue || "-"}\nCost center: ${ccValue || "-"}\nProject: ${projValue || "-"}\nPurpose: ${purposeValue || "-"}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Allocation copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const resetToDefaults = () => {
    setGroupId(adminDefaults.groupId);
    setCostCenterId(adminDefaults.costCenterId);
    setProjectTagId(adminDefaults.projectTagId);
    setPurposeCodeId(adminDefaults.purposeCodeId);
    toast({ title: "Defaults", message: "Applied admin defaults.", kind: "info" });
  };

  const continueFlow = () => {
    if (!canContinue) {
      toast({ title: "Missing fields", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }

    if (validation.level === "warn") {
      toast({ title: "Proceeding", message: "Warnings detected. Continue with caution.", kind: "info" });
    } else {
      toast({ title: "Saved", message: "Allocation saved for this checkout.", kind: "success" });
    }

    // Next step
    toast({ title: "Next", message: "Continue to Purpose and Compliance (U10).", kind: "info" });
  };

  const incompatibleHint = validation.level === "warn" ? "Potential misallocation warning" : validation.level === "block" ? "Required fields missing" : "No issues";

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
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Allocation details</div>
                  <div className="mt-1 text-xs text-slate-500">Pick group, cost center, and project tags so billing is accurate.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${orgName}`} tone="neutral" />
                    <Pill label={`Module: ${moduleCtx}`} tone="neutral" />
                    <Pill label={`Marketplace: ${marketplace}`} tone="neutral" />
                    <Pill label={`Category: ${category}`} tone="neutral" />
                    {statusPill}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to CorporatePay details (U8).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={resetToDefaults}>
                  <ClipboardCheck className="h-4 w-4" /> Defaults
                </Button>
                <Button variant="outline" onClick={() => setSmartOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Smart
                </Button>
              </div>
            </div>

            {/* Context controls (demo) */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <select
                  value={moduleCtx}
                  onChange={(e) => {
                    const v = e.target.value as ModuleKey;
                    setModuleCtx(v);
                    // reset marketplace/category for non e-commerce
                    if (v !== "E-Commerce") {
                      setMarketplace("Other");
                      setCategory("Other");
                    }
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other"] as ModuleKey[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={cn("lg:col-span-4", moduleCtx === "E-Commerce" ? "" : "opacity-60")}>
                <div className="text-xs font-semibold text-slate-600">Marketplace</div>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value as Marketplace)}
                  disabled={moduleCtx !== "E-Commerce"}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                    moduleCtx !== "E-Commerce" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                  )}
                >
                  {(["MyLiveDealz", "EVmart", "ServiceMart", "Other"] as Marketplace[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={cn("lg:col-span-4", moduleCtx === "E-Commerce" ? "" : "opacity-60")}>
                <div className="text-xs font-semibold text-slate-600">Category</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EcommerceCategory)}
                  disabled={moduleCtx !== "E-Commerce"}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                    moduleCtx !== "E-Commerce" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                  )}
                >
                  {(["Office supplies", "Electronics", "Vehicles", "Catering", "Medical", "Other"] as EcommerceCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: pickers */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Pick allocation fields"
                  subtitle="Defaults are applied from your organization settings"
                  right={<Pill label="Core" tone="neutral" />}
                >
                  <div className="space-y-2">
                    <PickRow
                      label="Group"
                      value={groupValue || "Not selected"}
                      required={reqs.group === "Required"}
                      hint={groupsForUser.length > 1 ? "You belong to multiple groups" : "Single group"}
                      locked={groupsForUser.length <= 1}
                      onPick={() => {
                        if (groupsForUser.length <= 1) {
                          toast({ title: "Group", message: "You belong to one group only.", kind: "info" });
                          return;
                        }
                        setGroupOpen(true);
                      }}
                    />
                    <PickRow
                      label="Cost center"
                      value={ccValue || "Not selected"}
                      required={reqs.costCenter === "Required"}
                      hint="Used for billing allocation"
                      onPick={() => setCcOpen(true)}
                    />
                    <PickRow
                      label="Project tag"
                      value={projValue || "Not selected"}
                      required={reqs.projectTag === "Required"}
                      hint="Client, event, campaign, project"
                      onPick={() => setProjOpen(true)}
                    />
                    <PickRow
                      label="Purpose code"
                      value={purposeValue || "Not selected"}
                      required={reqs.purposeCode === "Required"}
                      hint="Used for audits and reporting"
                      onPick={() => setPurposeOpen(true)}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Requirements</div>
                          <div className="mt-1 text-xs text-slate-500">Policy driven</div>
                        </div>
                        <Pill label={incompatibleHint} tone={validation.level === "ok" ? "good" : validation.level === "warn" ? "warn" : "bad"} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label={`Group: ${reqs.group}`} tone={reqs.group === "Required" ? "warn" : "neutral"} />
                        <Pill label={`Cost center: ${reqs.costCenter}`} tone={reqs.costCenter === "Required" ? "warn" : "neutral"} />
                        <Pill label={`Project: ${reqs.projectTag}`} tone={reqs.projectTag === "Required" ? "warn" : "neutral"} />
                        <Pill label={`Purpose: ${reqs.purposeCode}`} tone={reqs.purposeCode === "Required" ? "warn" : "neutral"} />
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Some organizations hide thresholds. The UI will still enforce required fields.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allocation summary</div>
                          <div className="mt-1 text-xs text-slate-500">What will be billed</div>
                        </div>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={copyAllocation}>
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        <SummaryRow icon={<Users className="h-4 w-4" />} label="Group" value={groupValue || "-"} />
                        <SummaryRow icon={<Wallet className="h-4 w-4" />} label="Cost center" value={ccValue || "-"} />
                        <SummaryRow icon={<Tag className="h-4 w-4" />} label="Project" value={projValue || "-"} />
                        <SummaryRow icon={<Timer className="h-4 w-4" />} label="Purpose" value={purposeValue || "-"} />
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        If something looks wrong, fix it now. It affects billing and approvals.
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Validation"
                  subtitle="Prevents misallocation and missing required fields"
                  right={<Pill label={validation.level === "ok" ? "OK" : validation.level === "warn" ? "Warning" : "Blocked"} tone={validation.level === "ok" ? "good" : validation.level === "warn" ? "warn" : "bad"} />}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Reasons</div>
                      <ul className="mt-2 space-y-2 text-sm text-slate-700">
                        {validation.reasons.map((r) => (
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
                        {validation.suggestions.map((s) => (
                          <li key={s} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Premium: in production, incompatibilities can be stricter for regulated categories.
                  </div>
                </Section>
              </div>

              {/* Right: premium suggestions */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="Smart suggestions"
                  subtitle="Premium: based on history, location, and calendar"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Location</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{locationText}</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <MapPin className="h-5 w-5" />
                        </div>
                      </div>
                      <input
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                        placeholder="Example: Entebbe Airport"
                      />
                      <div className="mt-2 text-xs text-slate-500">Logic-based. In production, location can come from GPS.</div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Calendar keyword</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{calendarText}</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <Timer className="h-5 w-5" />
                        </div>
                      </div>
                      <input
                        value={calendarText}
                        onChange={(e) => setCalendarText(e.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                        placeholder="Example: Client meeting"
                      />
                      <div className="mt-2 text-xs text-slate-500">Demo input. Phase 2 can use calendar integration.</div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Suggested actions</div>
                          <div className="mt-1 text-xs text-slate-500">One tap to apply</div>
                        </div>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setSmartOpen(true)}>
                          <Sparkles className="h-4 w-4" /> Open
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {suggestionList.map((s) => (
                          <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={s.type} tone={s.type === "Safety" ? "warn" : "info"} />
                                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{s.reason}</div>
                              </div>
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={s.apply}>
                                <ChevronRight className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                        {!suggestionList.length ? (
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            No suggestions right now.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: warnings prevent misallocation for marketplaces and categories.
                    </div>
                  </div>
                </Section>

                <Section title="Defaults" subtitle="Admin-defined and user preferences" right={<Pill label="Core" tone="neutral" />}>
                  <div className="space-y-2">
                    <InfoPillRow label="Admin default group" value={groupLabel(adminDefaults.groupId) || "-"} />
                    <InfoPillRow label="Admin default cost center" value={ccLabel(adminDefaults.costCenterId) || "-"} />
                    <InfoPillRow label="Admin default project" value={projLabel(adminDefaults.projectTagId) || "-"} />
                    <InfoPillRow label="Admin default purpose" value={purposeLabel(adminDefaults.purposeCodeId) || "-"} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={resetToDefaults}>
                      <ClipboardCheck className="h-4 w-4" /> Apply defaults
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast({ title: "Saved", message: "Saved as default for this module (demo).", kind: "success" })}
                      title="In production, this saves to user preferences"
                    >
                      <BadgeCheck className="h-4 w-4" /> Save as default
                    </Button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Defaults are applied on invite acceptance and can be updated by your admin.
                  </div>
                </Section>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Group: ${groupValue || "-"}`} tone="neutral" />
                  <Pill label={`Cost: ${ccValue || "-"}`} tone="neutral" />
                  <Pill label={`Project: ${projValue || "-"}`} tone="neutral" />
                  <Pill label={`Purpose: ${purposeValue || "-"}`} tone="neutral" />
                  {statusPill}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setSmartOpen(true)}>
                    <Sparkles className="h-4 w-4" /> Smart
                  </Button>
                  <Button variant={canContinue ? "primary" : "outline"} onClick={continueFlow} disabled={!canContinue}>
                    <ChevronRight className="h-4 w-4" /> Continue
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U9 Group, Cost Center and Project Tag Picker. Core: choose group, cost center, project and purpose codes. Premium: smart suggestions and misallocation warnings.
            </div>
          </div>
        </div>
      </div>

      {/* Group modal */}
      <Modal
        open={groupOpen}
        title="Select group"
        subtitle="Choose the group (department) for this transaction"
        onClose={() => setGroupOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Close</Button>
          </div>
        }
        maxW="720px"
      >
        <ListPicker
          items={groupsForUser.map((g) => ({ ...g, kind: g.id === adminDefaults.groupId ? "default" : "normal" }))}
          selectedId={groupId}
          onSelect={(id) => {
            setGroupId(id);
            setGroupOpen(false);
            toast({ title: "Group selected", message: groupLabel(id), kind: "success" });
          }}
          placeholder="Search groups"
        />
      </Modal>

      {/* Cost center modal */}
      <Modal
        open={ccOpen}
        title="Select cost center"
        subtitle="Cost center is used for billing allocation"
        onClose={() => setCcOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCcOpen(false)}>Close</Button>
            <Button
              variant="outline"
              onClick={() => {
                setCostCenterId(adminDefaults.costCenterId);
                setCcOpen(false);
                toast({ title: "Default", message: "Applied default cost center.", kind: "info" });
              }}
            >
              <ClipboardCheck className="h-4 w-4" /> Default
            </Button>
          </div>
        }
        maxW="760px"
      >
        <ListPicker
          items={costCentersWithHints}
          selectedId={costCenterId}
          onSelect={(id) => {
            setCostCenterId(id);
            setCcOpen(false);
            toast({ title: "Cost center selected", message: ccLabel(id), kind: "success" });
          }}
          placeholder="Search cost centers"
        />
      </Modal>

      {/* Project modal */}
      <Modal
        open={projOpen}
        title="Select project tag"
        subtitle="Project tags help organize billing (client, event, campaign)"
        onClose={() => setProjOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setProjOpen(false)}>Close</Button>
            <Button
              variant="outline"
              onClick={() => {
                setProjectTagId(adminDefaults.projectTagId);
                setProjOpen(false);
                toast({ title: "Default", message: "Applied default project tag.", kind: "info" });
              }}
            >
              <ClipboardCheck className="h-4 w-4" /> Default
            </Button>
          </div>
        }
        maxW="760px"
      >
        <ListPicker
          items={projectTagsWithHints}
          selectedId={projectTagId}
          onSelect={(id) => {
            setProjectTagId(id);
            setProjOpen(false);
            toast({ title: "Project selected", message: projLabel(id), kind: "success" });
          }}
          placeholder="Search project tags"
          allowClear
        />
      </Modal>

      {/* Purpose modal */}
      <Modal
        open={purposeOpen}
        title="Select purpose code"
        subtitle="Purpose codes improve audit trails and reporting"
        onClose={() => setPurposeOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setPurposeOpen(false)}>Close</Button>
            <Button
              variant="outline"
              onClick={() => {
                setPurposeCodeId(adminDefaults.purposeCodeId);
                setPurposeOpen(false);
                toast({ title: "Default", message: "Applied default purpose.", kind: "info" });
              }}
            >
              <ClipboardCheck className="h-4 w-4" /> Default
            </Button>
          </div>
        }
        maxW="760px"
      >
        <ListPicker
          items={purposeCodes.map((p) => ({ ...p, kind: p.id === adminDefaults.purposeCodeId ? "default" : p.kind }))}
          selectedId={purposeCodeId}
          onSelect={(id) => {
            setPurposeCodeId(id);
            setPurposeOpen(false);
            toast({ title: "Purpose selected", message: purposeLabel(id), kind: "success" });
          }}
          placeholder="Search purpose codes"
          allowClear
        />
      </Modal>

      {/* Smart modal */}
      <Modal
        open={smartOpen}
        title="Smart suggestions"
        subtitle="Premium: one tap apply based on history and context"
        onClose={() => setSmartOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setSmartOpen(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                suggestionList.forEach((s) => s.apply());
                toast({ title: "Applied", message: "Applied available suggestions.", kind: "success" });
              }}
              disabled={!suggestionList.length}
            >
              <Sparkles className="h-4 w-4" /> Apply all
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Context</div>
            <div className="mt-2 text-sm text-slate-700">Location and calendar are used for logic-based suggestions.</div>
            <div className="mt-3 space-y-2">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                <div className="font-semibold text-slate-900">Location</div>
                <div className="mt-1">{locationText}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                <div className="font-semibold text-slate-900">Calendar</div>
                <div className="mt-1">{calendarText}</div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Phase 2 can integrate calendar and location automatically.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Suggestions</div>
            <div className="mt-3 space-y-2">
              {suggestionList.map((s) => (
                <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill label={s.type} tone={s.type === "Safety" ? "warn" : "info"} />
                        <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{s.reason}</div>
                    </div>
                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={s.apply}>
                      <ChevronRight className="h-4 w-4" /> Apply
                    </Button>
                  </div>
                </div>
              ))}
              {!suggestionList.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No suggestions available.</div> : null}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="text-sm font-semibold text-slate-900">{value}</div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </div>
  );
}

function InfoPillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      </div>
      <Pill label="Admin" tone="neutral" />
    </div>
  );
}
