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
  FileText,
  Info,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";

type ApprovalRuleType = "Amount > X" | "Vendor restricted" | "CapEx item" | "Soft cap exceeded";

type ApprovalOutcome = "Approval required" | "Blocked" | "Ready";

type ApproverRole = "Manager" | "Procurement" | "Finance" | "CFO" | "CEO" | "Fleet Admin";

type ApprovalStep = {
  step: number;
  role: ApproverRole;
  nameHint: string; // masked or example
  slaHours?: number;
};

type Rule = {
  id: string;
  title: string;
  type: ApprovalRuleType;
  triggeredBecause: string;
  requiredAttachments: string[];
  noteRequired: boolean;
  holdSupported: boolean;
  slaHours: number;
  routing: ApprovalStep[];
  delegateAllowed: boolean;
  allowedDelegates: Array<{ id: string; name: string; role: ApproverRole }>;
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type SubmitState = "Draft" | "Submitted";

type Delegation = {
  enabled: boolean;
  delegateId: string;
  reason: string;
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

function msToFriendly(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (ms <= 0) return "Overdue";
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

function toneForOutcome(o: ApprovalOutcome) {
  if (o === "Ready") return "good" as const;
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

function ChecklistRow({ ok, label, note }: { ok: boolean; label: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {note ? <div className="mt-1 text-xs text-slate-500">{note}</div> : null}
      </div>
      {ok ? <Pill label="Done" tone="good" /> : <Pill label="Missing" tone="warn" />}
    </div>
  );
}

function AttachmentRow({
  name,
  required,
  present,
  meta,
  onRemove,
}: {
  name: string;
  required: boolean;
  present: boolean;
  meta?: string;
  onRemove?: () => void;
}) {
  return (
    <div className={cn("rounded-3xl border bg-white p-4", present ? "border-emerald-200" : required ? "border-amber-200" : "border-slate-200")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={required ? "Required" : "Optional"} tone={required ? "warn" : "neutral"} />
            <div className="text-sm font-semibold text-slate-900">{name}</div>
            {present ? <Pill label="Attached" tone="good" /> : <Pill label="Not attached" tone={required ? "warn" : "neutral"} />}
          </div>
          {meta ? <div className="mt-2 text-xs text-slate-500">{meta}</div> : null}
        </div>
        {present && onRemove ? (
          <button className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50" onClick={onRemove} aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function UserApprovalReviewSubmitU12() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Demo context
  const [orgName, setOrgName] = useState("Acme Group Ltd");
  const [moduleCtx, setModuleCtx] = useState<ModuleKey>("Rides & Logistics");
  const [amountUGX, setAmountUGX] = useState<number>(280000);

  const rules: Rule[] = useMemo(() => {
    return [
      {
        id: "rule-amount",
        title: "Approval triggered: amount above threshold",
        type: "Amount > X",
        triggeredBecause: "Amount is above UGX 200,000 for this module.",
        requiredAttachments: [],
        noteRequired: true,
        holdSupported: true,
        slaHours: 8,
        routing: [
          { step: 1, role: "Manager", nameHint: "Your Manager", slaHours: 6 },
          { step: 2, role: "Finance", nameHint: "Finance Desk", slaHours: 8 },
        ],
        delegateAllowed: true,
        allowedDelegates: [
          { id: "del-1", name: "Alternate Manager", role: "Manager" },
          { id: "del-2", name: "Ops Supervisor", role: "Manager" },
        ],
      },
      {
        id: "rule-vendor",
        title: "Approval triggered: vendor restricted",
        type: "Vendor restricted",
        triggeredBecause: "Vendor is not on the approved list for corporate purchases.",
        requiredAttachments: ["Quotation", "Proforma"],
        noteRequired: true,
        holdSupported: true,
        slaHours: 8,
        routing: [
          { step: 1, role: "Procurement", nameHint: "Procurement Desk", slaHours: 6 },
          { step: 2, role: "Finance", nameHint: "Finance Desk", slaHours: 8 },
        ],
        delegateAllowed: false,
        allowedDelegates: [],
      },
      {
        id: "rule-capex",
        title: "Approval triggered: CapEx item",
        type: "CapEx item",
        triggeredBecause: "High-value asset should be treated as CapEx and routed to exec chain.",
        requiredAttachments: ["Specs", "Budget justification", "Quotation"],
        noteRequired: true,
        holdSupported: false,
        slaHours: 12,
        routing: [
          { step: 1, role: "Procurement", nameHint: "Procurement Desk", slaHours: 8 },
          { step: 2, role: "CFO", nameHint: "CFO", slaHours: 12 },
          { step: 3, role: "CEO", nameHint: "CEO", slaHours: 12 },
        ],
        delegateAllowed: true,
        allowedDelegates: [
          { id: "del-3", name: "Acting CFO", role: "CFO" },
        ],
      },
      {
        id: "rule-softcap",
        title: "Approval triggered: soft cap exceeded",
        type: "Soft cap exceeded",
        triggeredBecause: "Your group soft cap would be exceeded. Approval is required to proceed.",
        requiredAttachments: [],
        noteRequired: true,
        holdSupported: true,
        slaHours: 8,
        routing: [
          { step: 1, role: "Manager", nameHint: "Your Manager", slaHours: 6 },
          { step: 2, role: "Finance", nameHint: "Finance Desk", slaHours: 8 },
        ],
        delegateAllowed: true,
        allowedDelegates: [
          { id: "del-1", name: "Alternate Manager", role: "Manager" },
        ],
      },
    ];
  }, []);

  const [ruleId, setRuleId] = useState<string>("rule-amount");
  const rule = useMemo(() => rules.find((r) => r.id === ruleId) || rules[0], [rules, ruleId]);

  // Hold/reservation
  const [holdEnabled, setHoldEnabled] = useState<boolean>(true);

  // Notes
  const [note, setNote] = useState<string>("");

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Delegation
  const [delegation, setDelegation] = useState<Delegation>({ enabled: false, delegateId: "", reason: "" });

  // SLA timer
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);

  const createdAt = useMemo(() => Date.now() - 20 * 60 * 1000, []);
  const dueAt = useMemo(() => createdAt + rule.slaHours * 60 * 60 * 1000, [createdAt, rule.slaHours]);
  const dueMs = dueAt - nowTick;

  // Required attachment enforcement
  const missingRequired = useMemo(() => {
    const req = rule.requiredAttachments;
    return req.filter((name) => !attachments.some((a) => a.name.toLowerCase().includes(name.toLowerCase())));
  }, [rule.requiredAttachments, attachments]);

  const noteMissing = rule.noteRequired && note.trim().length < 10;

  const delegateMissing = delegation.enabled && (!delegation.delegateId || delegation.reason.trim().length < 10);

  const outcome: ApprovalOutcome = useMemo(() => {
    if (missingRequired.length > 0) return "Blocked";
    if (noteMissing) return "Blocked";
    if (delegateMissing) return "Blocked";
    return "Approval required";
  }, [missingRequired.length, noteMissing, delegateMissing]);

  const [submitState, setSubmitState] = useState<SubmitState>("Draft");
  const [createdRequestId, setCreatedRequestId] = useState<string>("");

  const canSubmit = submitState === "Draft" && outcome !== "Blocked";

  // Reset dependent states when rule changes
  useEffect(() => {
    setHoldEnabled(rule.holdSupported ? true : false);
    setDelegation({ enabled: false, delegateId: "", reason: "" });
    setNote("");
    setAttachments([]);
    setSubmitState("Draft");
    setCreatedRequestId("");
  }, [rule.id, rule.holdSupported]);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setAttachments((prev) => [...list, ...prev].slice(0, 10));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const addName = () => {
    const name = prompt("Enter attachment name (example: Quotation.pdf)")?.trim();
    if (!name) return;
    const att: Attachment = { id: uid("att"), name, size: 0, type: "manual", ts: Date.now() };
    setAttachments((prev) => [att, ...prev].slice(0, 10));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  const submit = () => {
    if (!canSubmit) {
      toast({ title: "Fix required", message: "Complete required items before submitting.", kind: "warn" });
      return;
    }

    const id = `REQ-${Math.random().toString(16).slice(2, 6).toUpperCase()}${Math.random().toString(16).slice(2, 4).toUpperCase()}`;
    setCreatedRequestId(id);
    setSubmitState("Submitted");

    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    toast({ title: "Next", message: "Track it in My Requests (U5).", kind: "info" });
  };

  const copySummary = async () => {
    const text = `Approval request\nOrg: ${orgName}\nModule: ${moduleCtx}\nAmount: ${formatUGX(amountUGX)}\nRule: ${rule.type}\nTriggered: ${rule.triggeredBecause}\nSLA: ${rule.slaHours}h\nHold: ${holdEnabled ? "Requested" : "No"}\nDelegation: ${delegation.enabled ? `Yes (${delegation.delegateId})` : "No"}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Summary copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  // Modals
  const [routeOpen, setRouteOpen] = useState(false);

  const routeText = useMemo(() => {
    return rule.routing.map((s) => `${s.step}. ${s.role}`).join(" → ");
  }, [rule.routing]);

  const expectedSlaText = useMemo(() => {
    const h = rule.slaHours;
    return `Expected decision within ${h} hour${h === 1 ? "" : "s"}.`;
  }, [rule.slaHours]);

  const holdText = useMemo(() => {
    if (!rule.holdSupported) return "Hold/reservation is not supported for this request type.";
    return holdEnabled
      ? "We will attempt to place a temporary hold/reservation (best effort)."
      : "No hold/reservation will be placed.";
  }, [rule.holdSupported, holdEnabled]);

  const requiredChecklist = useMemo(() => {
    return {
      noteOk: !rule.noteRequired || note.trim().length >= 10,
      attachmentsOk: missingRequired.length === 0,
      delegationOk: !delegation.enabled || (!!delegation.delegateId && delegation.reason.trim().length >= 10),
    };
  }, [rule.noteRequired, note, missingRequired.length, delegation]);

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
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approval required</div>
                  <div className="mt-1 text-xs text-slate-500">Review details, add required info, and submit for approval.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${orgName}`} tone="neutral" />
                    <Pill label={`Module: ${moduleCtx}`} tone="neutral" />
                    <Pill label={`Amount: ${formatUGX(amountUGX)}`} tone="neutral" />
                    <Pill label={rule.type} tone="info" />
                    <Pill label={outcome} tone={toneForOutcome(outcome)} />
                    <Pill label={expectedSlaText} tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to policy check result (U11).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={copySummary}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="outline" onClick={() => setRouteOpen(true)}>
                  <Users className="h-4 w-4" /> Routing
                </Button>
                <Button variant={canSubmit ? "primary" : "outline"} onClick={submit} disabled={!canSubmit} title={!canSubmit ? "Fix required items first" : "Submit"}>
                  <ChevronRight className="h-4 w-4" /> {submitState === "Submitted" ? "Submitted" : "Submit"}
                </Button>
              </div>
            </div>

            {/* Demo: choose rule */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="text-xs font-semibold text-slate-600">Approval rule</div>
                <select
                  value={ruleId}
                  onChange={(e) => setRuleId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.type}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-slate-500">Demo selector: in production, this is set by the policy engine.</div>
              </div>

              <div className="lg:col-span-3">
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <select
                  value={moduleCtx}
                  onChange={(e) => setModuleCtx(e.target.value as ModuleKey)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                >
                  {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other"] as ModuleKey[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Amount</div>
                <input
                  type="number"
                  value={amountUGX}
                  onChange={(e) => setAmountUGX(clamp(Number(e.target.value || 0), 0, 999999999))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Rule triggered"
                  subtitle="Why approval is required"
                  right={<Pill label={rule.type} tone="info" />}
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{rule.title}</div>
                        <div className="mt-1 text-sm text-slate-700">{rule.triggeredBecause}</div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                          Auto-routing: <span className="font-semibold text-slate-900">{routeText}</span>
                          <div className="mt-1 text-slate-600">{expectedSlaText}</div>
                        </div>
                      </div>
                      <div className={cn(
                        "grid h-10 w-10 place-items-center rounded-2xl",
                        outcome === "Blocked" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"
                      )}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <ChecklistRow ok={requiredChecklist.noteOk} label="Notes" note={rule.noteRequired ? "Required (min 10 chars)" : "Optional"} />
                      <ChecklistRow ok={requiredChecklist.attachmentsOk} label="Attachments" note={rule.requiredAttachments.length ? `${rule.requiredAttachments.length} required` : "None"} />
                      <ChecklistRow ok={requiredChecklist.delegationOk} label="Delegation" note={rule.delegateAllowed ? "Optional" : "Not allowed"} />
                      <ChecklistRow ok={true} label="Policy check" note="Completed" />
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Your submit will be audited. Approvers may request changes if details are unclear.
                    </div>
                  </div>
                </Section>

                <Section
                  title="Notes for approver"
                  subtitle="Explain the request clearly"
                  right={<Pill label={rule.noteRequired ? "Required" : "Optional"} tone={rule.noteRequired ? "warn" : "neutral"} />}
                >
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={rule.noteRequired ? "Add a short reason (min 10 characters)" : "Optional note"}
                    rows={4}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
                      noteMissing ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                    )}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill label={`${Math.min(999, note.trim().length)} chars`} tone="neutral" />
                    {noteMissing ? <Pill label="Add more detail" tone="warn" /> : <Pill label="OK" tone="good" />}
                    <Button
                      variant="outline"
                      className="px-3 py-2 text-xs"
                      onClick={() => {
                        const tpl =
                          rule.type === "CapEx item"
                            ? "CapEx request for asset procurement. Specs: {spec}. Business justification: {justification}."
                            : rule.type === "Vendor restricted"
                              ? "Vendor purchase requires approval. Reason: {reason}. Quote attached."
                              : "Approval requested due to threshold. Business reason: {reason}.";
                        setNote((prev) => (prev.trim().length >= 10 ? prev : tpl));
                        toast({ title: "Template", message: "Inserted a policy-safe template.", kind: "info" });
                      }}
                    >
                      <Sparkles className="h-4 w-4" /> Insert template
                    </Button>
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setNote("")}
                      title="Clear note">
                      <X className="h-4 w-4" /> Clear
                    </Button>
                  </div>
                </Section>

                <Section
                  title="Attachments"
                  subtitle="Required attachments are enforced"
                  right={<Pill label={rule.requiredAttachments.length ? `${rule.requiredAttachments.length} required` : "None"} tone={rule.requiredAttachments.length ? "warn" : "neutral"} />}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    <Button variant="outline" onClick={addName}>
                      <Paperclip className="h-4 w-4" /> Add name
                    </Button>
                    <Pill label={`${attachments.length} file(s)`} tone={attachments.length ? "good" : "neutral"} />
                    {missingRequired.length ? <Pill label={`${missingRequired.length} missing`} tone="warn" /> : <Pill label="All required attached" tone="good" />}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {rule.requiredAttachments.map((req) => {
                      const present = attachments.some((a) => a.name.toLowerCase().includes(req.toLowerCase()));
                      const first = attachments.find((a) => a.name.toLowerCase().includes(req.toLowerCase()));
                      return (
                        <AttachmentRow
                          key={req}
                          name={req}
                          required
                          present={present}
                          meta={present && first ? `${first.name} • ${formatBytes(first.size)} • added ${timeAgo(first.ts)}` : ""}
                          onRemove={
                            present && first
                              ? () => {
                                removeAttachment(first.id);
                              }
                              : undefined
                          }
                        />
                      );
                    })}

                    {attachments
                      .filter((a) => !rule.requiredAttachments.some((r) => a.name.toLowerCase().includes(r.toLowerCase())))
                      .map((a) => (
                        <AttachmentRow
                          key={a.id}
                          name={a.name}
                          required={false}
                          present={true}
                          meta={`${a.type || "unknown"} • ${formatBytes(a.size)} • added ${timeAgo(a.ts)}`}
                          onRemove={() => removeAttachment(a.id)}
                        />
                      ))}

                    {!rule.requiredAttachments.length && !attachments.length ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments required for this rule.</div>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Attachments can be photos or PDFs. In production, attachments are encrypted at rest.
                  </div>
                </Section>

                <Section
                  title="Hold or reservation"
                  subtitle="Best-effort hold for applicable modules"
                  right={<Pill label={rule.holdSupported ? (holdEnabled ? "Hold requested" : "No hold") : "Not supported"} tone={rule.holdSupported ? (holdEnabled ? "info" : "neutral") : "neutral"} />}
                >
                  <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !rule.holdSupported && "opacity-70")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Reservation</div>
                        <div className="mt-1 text-sm text-slate-600">{holdText}</div>
                      </div>
                      <button
                        type="button"
                        disabled={!rule.holdSupported}
                        className={cn(
                          "relative h-7 w-12 rounded-full border transition",
                          holdEnabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                          !rule.holdSupported && "cursor-not-allowed"
                        )}
                        onClick={() => setHoldEnabled((v) => !v)}
                        aria-label="Toggle hold"
                      >
                        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", holdEnabled ? "left-[22px]" : "left-1")} />
                      </button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Holds are best-effort and may not be supported by all vendors.
                    </div>
                  </div>
                </Section>
              </div>

              {/* Right */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="SLA and routing"
                  subtitle="Premium: expected decision and auto-routing"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">SLA timer</div>
                        <div className="mt-1 text-sm text-slate-600">Expected decision window</div>
                      </div>
                      <Pill label={msToFriendly(dueMs)} tone={dueMs <= 0 ? "bad" : dueMs <= 2 * 60 * 60 * 1000 ? "warn" : "info"} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Created: {timeAgo(createdAt)} • Expected decision within {rule.slaHours}h.
                    </div>

                    <div className="mt-3 text-xs text-slate-600">Auto-routing</div>
                    <div className="mt-2 space-y-2">
                      {rule.routing.map((s) => (
                        <div key={`${rule.id}-${s.step}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={`Step ${s.step}`} tone="neutral" />
                                <Pill label={s.role} tone="info" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{s.nameHint}</div>
                              {s.slaHours ? <div className="mt-1 text-xs text-slate-500">Target: {s.slaHours}h</div> : null}
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Auto-routing is policy-driven. Some organizations hide approver identities.
                    </div>
                  </div>
                </Section>

                <Section
                  title="Delegate approver"
                  subtitle="Premium: delegation support when allowed"
                  right={<Pill label={rule.delegateAllowed ? "Allowed" : "Not allowed"} tone={rule.delegateAllowed ? "info" : "neutral"} />}
                >
                  <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !rule.delegateAllowed && "opacity-70")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Delegation</div>
                        <div className="mt-1 text-sm text-slate-600">If your manager is away, route to an alternate approver.</div>
                      </div>
                      <button
                        type="button"
                        disabled={!rule.delegateAllowed}
                        className={cn(
                          "relative h-7 w-12 rounded-full border transition",
                          delegation.enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                          !rule.delegateAllowed && "cursor-not-allowed"
                        )}
                        onClick={() => setDelegation((p) => ({ ...p, enabled: !p.enabled }))}
                        aria-label="Toggle delegation"
                      >
                        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", delegation.enabled ? "left-[22px]" : "left-1")} />
                      </button>
                    </div>

                    {delegation.enabled ? (
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Select delegate</div>
                          <select
                            value={delegation.delegateId}
                            onChange={(e) => setDelegation((p) => ({ ...p, delegateId: e.target.value }))}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              delegation.delegateId ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                          >
                            <option value="">Choose a delegate</option>
                            {rule.allowedDelegates.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Delegation reason</div>
                          <textarea
                            value={delegation.reason}
                            onChange={(e) => setDelegation((p) => ({ ...p, reason: e.target.value }))}
                            rows={3}
                            placeholder="Example: manager is on leave, urgent approval"
                            className={cn(
                              "mt-2 w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
                              delegation.reason.trim().length >= 10 ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                          />
                          {delegateMissing ? <div className="mt-1 text-xs font-semibold text-amber-700">Reason and delegate are required.</div> : null}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          Delegation is audited and visible to org admins.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">Delegation is optional.</div>
                    )}
                  </div>
                </Section>

                <Section title="Submit" subtitle="Creates an approval request" right={<Pill label={submitState} tone={submitState === "Submitted" ? "good" : "neutral"} />}>
                  <div className={cn(
                    "rounded-3xl border p-4",
                    outcome === "Blocked" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{submitState === "Submitted" ? "Submitted" : "Ready to submit"}</div>
                        <div className="mt-1 text-sm text-slate-700">
                          {submitState === "Submitted"
                            ? `Request ${createdRequestId} created. Track status in My Requests.`
                            : outcome === "Blocked"
                              ? "Some required items are missing."
                              : "This request will be routed to approvers with SLA tracking."}
                        </div>
                      </div>
                      <Pill label={outcome} tone={toneForOutcome(outcome)} />
                    </div>

                    {outcome === "Blocked" ? (
                      <div className="mt-3 text-sm text-rose-800">
                        {missingRequired.length ? (
                          <div>
                            Missing attachments: <span className="font-semibold">{missingRequired.join(", ")}</span>
                          </div>
                        ) : null}
                        {noteMissing ? <div className="mt-1">Notes are required (min 10 characters).</div> : null}
                        {delegateMissing ? <div className="mt-1">Delegation fields are incomplete.</div> : null}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant={canSubmit ? "primary" : "outline"} onClick={submit} disabled={!canSubmit}>
                        <ChevronRight className="h-4 w-4" /> Submit for approval
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "My Requests", message: "Open U5 (demo).", kind: "info" })}>
                        <FileText className="h-4 w-4" /> My Requests
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Payment", message: "Switch to personal payment (U7).", kind: "info" })}>
                        <Wallet className="h-4 w-4" /> Change payment
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white/60 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Premium: SLA countdown timers and auto-routing analytics are visible in the Admin Console.
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky bottom bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={rule.type} tone="info" />
                  <Pill label={expectedSlaText} tone="neutral" />
                  <Pill label={`Due in: ${msToFriendly(dueMs)}`} tone={dueMs <= 0 ? "bad" : dueMs <= 2 * 60 * 60 * 1000 ? "warn" : "info"} />
                  <Pill label={outcome} tone={toneForOutcome(outcome)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={copySummary}>
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                  <Button variant={canSubmit ? "primary" : "outline"} onClick={submit} disabled={!canSubmit}>
                    <ChevronRight className="h-4 w-4" /> Submit
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U12 Approval Required Review and Submit. Core: approval rule, required attachments enforcement, submit request. Premium: SLA expectations, auto-routing info, delegate approver support.
            </div>
          </div>
        </div>
      </div>

      {/* Routing modal */}
      <Modal
        open={routeOpen}
        title="Routing details"
        subtitle="Premium: auto-routing and SLA targets"
        onClose={() => setRouteOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRouteOpen(false)}>Close</Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Auto-routing</div>
                <div className="mt-1 text-sm text-slate-700">{routeText}</div>
              </div>
              <Pill label={expectedSlaText} tone="info" />
            </div>
          </div>

          <div className="space-y-2">
            {rule.routing.map((s) => (
              <div key={`${rule.id}-modal-${s.step}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={`Step ${s.step}`} tone="neutral" />
                      <Pill label={s.role} tone="info" />
                      {s.slaHours ? <Pill label={`Target ${s.slaHours}h`} tone="neutral" /> : null}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{s.nameHint}</div>
                    <div className="mt-1 text-sm text-slate-600">This step is policy-driven. Identity may be masked for privacy.</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Delegation (if allowed) is always audited and visible to organization admins.
          </div>
        </div>
      </Modal>

    </div>
  );
}