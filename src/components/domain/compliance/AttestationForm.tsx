import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Info,
  MapPin,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Tag,
  Timer,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";

type Req = "Required" | "Optional" | "Not used";

type ValidationLevel = "ok" | "warn" | "block";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Purpose = {
  id: string;
  label: string;
  hint: string;
  tags: string[];
  risk: "Low" | "Medium" | "High";
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type Validation = { level: ValidationLevel; headline: string; reasons: string[]; nextSteps: string[] };

type Template = {
  id: string;
  name: string;
  description: string;
  purposeId: string;
  noteTemplate: string;
  recommendedAttachments: string[];
  requiresCompliance: boolean;
  tags: string[];
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

function ChipButton({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-3xl border p-4 text-left transition",
        active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        {active ? <Check className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
      </div>
    </button>
  );
}

function toneForValidation(level: ValidationLevel) {
  if (level === "ok") return "good" as const;
  if (level === "warn") return "warn" as const;
  return "bad" as const;
}

function computeValidation(args: {
  purposeReq: Req;
  notesReq: Req;
  complianceReq: Req;
  attachmentsReq: Req;
  purposeId: string;
  notes: string;
  complianceChecked: boolean;
  attachments: Attachment[];
  selectedPurposeRisk: Purpose["risk"] | null;
}): Validation {
  const reasons: string[] = [];
  const nextSteps: string[] = [];

  const needPurpose = args.purposeReq === "Required";
  const needNotes = args.notesReq === "Required";
  const needCompliance = args.complianceReq === "Required";
  const needAttachments = args.attachmentsReq === "Required";

  if (needPurpose && !args.purposeId) {
    reasons.push("Purpose tag is required by policy.");
    nextSteps.push("Select a purpose tag before continuing.");
    return { level: "block", headline: "Missing purpose", reasons, nextSteps };
  }

  if (needNotes && args.notes.trim().length < 10) {
    reasons.push("Notes are required (minimum 10 characters)." );
    nextSteps.push("Add a short reason to help approvers and audit trails.");
    return { level: "block", headline: "Missing notes", reasons, nextSteps };
  }

  if (needCompliance && !args.complianceChecked) {
    reasons.push("Compliance confirmation is required.");
    nextSteps.push("Confirm Business use only to proceed.");
    return { level: "block", headline: "Compliance required", reasons, nextSteps };
  }

  if (needAttachments && args.attachments.length === 0) {
    reasons.push("Attachment is required (photo or PDF)." );
    nextSteps.push("Upload at least one attachment.");
    return { level: "block", headline: "Attachment required", reasons, nextSteps };
  }

  // Warnings
  if (args.selectedPurposeRisk === "High") {
    reasons.push("Selected purpose is high sensitivity.");
    nextSteps.push("Double-check cost center and notes before continuing.");
    return { level: "warn", headline: "Review required", reasons, nextSteps };
  }

  if (args.notes.trim().length > 0 && args.notes.trim().length < 10 && args.notesReq !== "Not used") {
    reasons.push("Notes are very short.");
    nextSteps.push("Add more context to reduce approval rework.");
    return { level: "warn", headline: "Consider expanding notes", reasons, nextSteps };
  }

  reasons.push("Purpose and compliance checks look good.");
  nextSteps.push("Continue.");
  return { level: "ok", headline: "Ready", reasons, nextSteps };
}

export default function UserPurposeComplianceAttestationU10() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Context
  const [orgName] = useState("Acme Group Ltd");
  const [moduleCtx, setModuleCtx] = useState<ModuleKey>("Rides & Logistics");

  // Policy toggles (policy-driven)
  const [purposeReq, setPurposeReq] = useState<Req>("Required");
  const [notesReq, setNotesReq] = useState<Req>("Optional");
  const [complianceReq, setComplianceReq] = useState<Req>("Required");
  const [attachmentsReq, setAttachmentsReq] = useState<Req>("Optional");

  // Requirement auto adjustments by module (best-effort defaults)
  useEffect(() => {
    if (moduleCtx === "Rides & Logistics") {
      setPurposeReq("Required");
      setComplianceReq("Required");
      setNotesReq("Optional");
      setAttachmentsReq("Not used");
    } else if (moduleCtx === "E-Commerce") {
      setPurposeReq("Optional");
      setComplianceReq("Required");
      setNotesReq("Optional");
      setAttachmentsReq("Optional");
    } else if (moduleCtx === "EVs & Charging") {
      setPurposeReq("Optional");
      setComplianceReq("Optional");
      setNotesReq("Not used");
      setAttachmentsReq("Not used");
    } else {
      setPurposeReq("Optional");
      setComplianceReq("Optional");
      setNotesReq("Optional");
      setAttachmentsReq("Optional");
    }
  }, [moduleCtx]);

  const purposes: Purpose[] = useMemo(() => {
    return [
      { id: "purpose_airport", label: "Airport", hint: "Airport trip or pickup/drop-off", tags: ["Travel"], risk: "Medium" },
      { id: "purpose_client", label: "Client meeting", hint: "Client visit or onsite meeting", tags: ["Sales"], risk: "Low" },
      { id: "purpose_commute", label: "Office commute", hint: "Home to office commute", tags: ["Commute"], risk: "Low" },
      { id: "purpose_delivery", label: "Delivery", hint: "Courier or parcel delivery", tags: ["Logistics"], risk: "Low" },
      { id: "purpose_event", label: "Event", hint: "Event transport or purchases", tags: ["Event"], risk: "Medium" },
      { id: "purpose_project", label: "Project", hint: "Project-related expenses", tags: ["Project"], risk: "Medium" },
      { id: "purpose_capex", label: "CapEx", hint: "High-value assets and procurement", tags: ["CapEx"], risk: "High" },
      { id: "purpose_personal", label: "Personal", hint: "Not recommended for corporate", tags: ["Personal"], risk: "High" },
    ];
  }, []);

  const templates: Template[] = useMemo(() => {
    return [
      {
        id: "tpl_airport",
        name: "Airport trip",
        description: "Safe template for airport rides or bookings",
        purposeId: "purpose_airport",
        noteTemplate: "Airport trip for business travel. Passenger: {name}. Flight: {flight}.",
        recommendedAttachments: ["Itinerary (optional)", "Meeting agenda (optional)"],
        requiresCompliance: true,
        tags: ["Policy-safe", "Travel"],
      },
      {
        id: "tpl_client",
        name: "Client meeting",
        description: "Template to reduce approval rework",
        purposeId: "purpose_client",
        noteTemplate: "Client meeting with {client}. Location: {address}.",
        recommendedAttachments: ["Meeting invite (optional)"],
        requiresCompliance: true,
        tags: ["Policy-safe", "Sales"],
      },
      {
        id: "tpl_commute",
        name: "Office commute",
        description: "Standard commute purpose",
        purposeId: "purpose_commute",
        noteTemplate: "Office commute for scheduled work day.",
        recommendedAttachments: [],
        requiresCompliance: false,
        tags: ["Commute"],
      },
      {
        id: "tpl_event",
        name: "Event purchase",
        description: "Useful for catering or event bookings",
        purposeId: "purpose_event",
        noteTemplate: "Event expense for {event}. Date: {date}.",
        recommendedAttachments: ["Event plan (optional)", "Quotation (if required)"],
        requiresCompliance: true,
        tags: ["Policy-safe", "Event"],
      },
      {
        id: "tpl_capex",
        name: "CapEx request",
        description: "For high-value assets, pre-fill safer wording",
        purposeId: "purpose_capex",
        noteTemplate: "CapEx request for asset procurement. Specs: {spec}. Business justification: {justification}.",
        recommendedAttachments: ["Quotation (recommended)", "Proforma invoice (recommended)", "Specs (recommended)"],
        requiresCompliance: true,
        tags: ["High value", "Safety"],
      },
    ];
  }, []);

  const [purposeId, setPurposeId] = useState<string>("purpose_client");
  const [notes, setNotes] = useState<string>("");
  const [complianceChecked, setComplianceChecked] = useState<boolean>(false);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selectedPurpose = useMemo(() => purposes.find((p) => p.id === purposeId) || null, [purposes, purposeId]);

  // Auto set compliance when policy requires and template says so
  useEffect(() => {
    if (complianceReq === "Required" && !complianceChecked) {
      // do nothing automatically to keep explicit user action
    }
  }, [complianceReq, complianceChecked]);

  const validation = useMemo(() => {
    return computeValidation({
      purposeReq,
      notesReq,
      complianceReq,
      attachmentsReq,
      purposeId,
      notes,
      complianceChecked,
      attachments,
      selectedPurposeRisk: selectedPurpose?.risk || null,
    });
  }, [purposeReq, notesReq, complianceReq, attachmentsReq, purposeId, notes, complianceChecked, attachments, selectedPurpose]);

  // Premium: validation debounce (real-time feel)
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<Validation>(validation);

  useEffect(() => {
    setValidating(true);
    const t = window.setTimeout(() => {
      setValidated(validation);
      setValidating(false);
    }, 200);
    return () => window.clearTimeout(t);
  }, [validation]);

  const canContinue = !validating && validated.level !== "block";

  const applyTemplate = (tpl: Template) => {
    setPurposeId(tpl.purposeId);

    // Only overwrite notes if empty or short; do not destroy user's long notes.
    setNotes((prev) => (prev.trim().length >= 10 ? prev : tpl.noteTemplate));

    // If template implies compliance and policy requires it, nudge the user.
    if (tpl.requiresCompliance && complianceReq === "Required") {
      toast({ title: "Template applied", message: "Compliance is required. Please confirm Business use only.", kind: "info" });
    } else {
      toast({ title: "Template applied", message: tpl.name, kind: "success" });
    }

    // If template has recommended attachments and policy requires attachments, nudge.
    if (tpl.recommendedAttachments.length && attachmentsReq === "Required" && attachments.length === 0) {
      toast({ title: "Attachments recommended", message: "Upload a photo/PDF if required by policy.", kind: "warn" });
    }
  };

  const addAttachmentFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setAttachments((prev) => [...list, ...prev].slice(0, 10));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  const continueFlow = () => {
    if (!canContinue) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }

    if (validated.level === "warn") {
      toast({ title: "Proceeding", message: "Warnings detected. Continue with caution.", kind: "info" });
    } else {
      toast({ title: "Saved", message: "Purpose and compliance saved.", kind: "success" });
    }

    toast({ title: "Next", message: "Continue to Policy Check Result (U11).", kind: "info" });
  };

  const [templatesOpen, setTemplatesOpen] = useState(false);

  const purposeReqLabel = useMemo(() => (purposeReq === "Required" ? "Required" : purposeReq === "Optional" ? "Optional" : "Not used"), [purposeReq]);
  const notesReqLabel = useMemo(() => (notesReq === "Required" ? "Required" : notesReq === "Optional" ? "Optional" : "Not used"), [notesReq]);
  const complianceReqLabel = useMemo(() => (complianceReq === "Required" ? "Required" : complianceReq === "Optional" ? "Optional" : "Not used"), [complianceReq]);
  const attachReqLabel = useMemo(() => (attachmentsReq === "Required" ? "Required" : attachmentsReq === "Optional" ? "Optional" : "Not used"), [attachmentsReq]);

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
                  <div className="text-sm font-semibold text-slate-900">Purpose and compliance</div>
                  <div className="mt-1 text-xs text-slate-500">Required when policy demands purpose or compliance confirmation.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${orgName}`} tone="neutral" />
                    <Pill label={`Module: ${moduleCtx}`} tone="neutral" />
                    <Pill label={`Purpose: ${purposeReqLabel}`} tone={purposeReq === "Required" ? "warn" : "neutral"} />
                    <Pill label={`Notes: ${notesReqLabel}`} tone={notesReq === "Required" ? "warn" : "neutral"} />
                    <Pill label={`Compliance: ${complianceReqLabel}`} tone={complianceReq === "Required" ? "warn" : "neutral"} />
                    <Pill label={`Attachments: ${attachReqLabel}`} tone={attachmentsReq === "Required" ? "warn" : "neutral"} />
                    <Pill label={validating ? "Validating" : validated.headline} tone={validating ? "info" : toneForValidation(validated.level)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to Allocation Picker (U9).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Templates
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open Corporate Policies Summary (U3).", kind: "info" })}>
                  <Info className="h-4 w-4" /> Policies
                </Button>
              </div>
            </div>

            {/* Demo policy control */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <select
                  value={moduleCtx}
                  onChange={(e) => setModuleCtx(e.target.value as ModuleKey)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Other"] as ModuleKey[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-slate-500">Policy defaults may vary per module.</div>
              </div>

              <div className="lg:col-span-8">
                <div className="text-xs font-semibold text-slate-600">Policy requirements (demo)</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PolicyToggle label="Purpose" value={purposeReq} onChange={setPurposeReq} />
                  <PolicyToggle label="Notes" value={notesReq} onChange={setNotesReq} />
                  <PolicyToggle label="Compliance" value={complianceReq} onChange={setComplianceReq} />
                  <PolicyToggle label="Attachments" value={attachmentsReq} onChange={setAttachmentsReq} />
                </div>
                <div className="mt-2 text-xs text-slate-500">In production, these are driven by org policy and module rules.</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Select purpose tag"
                  subtitle="Purpose tags improve audit trails and reduce approval rework"
                  right={
                    <div className="flex items-center gap-2">
                      <Pill label={purposeReqLabel} tone={purposeReq === "Required" ? "warn" : "neutral"} />
                      {selectedPurpose ? <Pill label={`Risk: ${selectedPurpose.risk}`} tone={selectedPurpose.risk === "High" ? "bad" : selectedPurpose.risk === "Medium" ? "warn" : "good"} /> : null}
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {purposes.map((p) => (
                      <ChipButton
                        key={p.id}
                        active={purposeId === p.id}
                        label={p.label}
                        hint={p.hint}
                        onClick={() => {
                          setPurposeId(p.id);
                          toast({ title: "Purpose selected", message: p.label, kind: "success" });
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Tip: Using "Personal" for corporate spend can trigger declines. Choose a business purpose instead.
                  </div>
                </Section>

                <Section
                  title="Notes"
                  subtitle="Optional notes field (policy-based)"
                  right={<Pill label={notesReqLabel} tone={notesReq === "Required" ? "warn" : "neutral"} />}
                >
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={notesReq === "Not used" ? "Notes are not used for this policy." : "Add short context for the approver or audit trail"}
                    rows={5}
                    disabled={notesReq === "Not used"}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
                      notesReq === "Not used" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                    )}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="px-3 py-2 text-xs"
                      onClick={() => {
                        const tpl = templates.find((t) => t.purposeId === purposeId) || templates[1];
                        setNotes((prev) => (prev.trim().length >= 10 ? prev : tpl.noteTemplate));
                        toast({ title: "Template inserted", message: "Notes template applied.", kind: "info" });
                      }}
                      disabled={notesReq === "Not used"}
                    >
                      <Sparkles className="h-4 w-4" /> Insert template
                    </Button>
                    <Button
                      variant="outline"
                      className="px-3 py-2 text-xs"
                      onClick={() => {
                        setNotes("");
                        toast({ title: "Cleared", message: "Notes cleared.", kind: "info" });
                      }}
                      disabled={notesReq === "Not used"}
                    >
                      <X className="h-4 w-4" /> Clear
                    </Button>
                    <Pill label={`${Math.min(999, notes.trim().length)} chars`} tone="neutral" />
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Premium: use policy-safe templates to reduce approval rework.
                  </div>
                </Section>

                <Section
                  title="Compliance attestation"
                  subtitle="Compliance checkbox when required"
                  right={<Pill label={complianceReqLabel} tone={complianceReq === "Required" ? "warn" : "neutral"} />}
                >
                  <label className={cn("flex items-start gap-3 rounded-3xl border p-4", complianceReq === "Not used" ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white")}>
                    <input
                      type="checkbox"
                      checked={complianceChecked}
                      onChange={(e) => setComplianceChecked(e.target.checked)}
                      disabled={complianceReq === "Not used"}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">Business use only</div>
                      <div className="mt-1 text-sm text-slate-600">
                        I confirm this transaction is for business purposes and follows corporate policy.
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Pill label="Audit logged" tone="info" />
                        <Pill label="Policy enforced" tone="neutral" />
                      </div>
                    </div>
                  </label>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    If your org requires stricter attestations, they can appear here (role-based).
                  </div>
                </Section>

                <Section
                  title="Attachments"
                  subtitle="Premium: attachment capture when required"
                  right={<Pill label={attachReqLabel} tone={attachmentsReq === "Required" ? "warn" : "neutral"} />}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => addAttachmentFiles(e.target.files)}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={attachmentsReq === "Not used"}>
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // fallback demo for environments without file picker
                        const name = prompt("Enter attachment name (example: Quotation.pdf)")?.trim();
                        if (!name) return;
                        const att: Attachment = { id: uid("att"), name, size: 0, type: "manual", ts: Date.now() };
                        setAttachments((p) => [att, ...p].slice(0, 10));
                        toast({ title: "Attached", message: name, kind: "success" });
                      }}
                      disabled={attachmentsReq === "Not used"}
                    >
                      <Paperclip className="h-4 w-4" /> Add name
                    </Button>
                    <Pill label={`${attachments.length} file(s)`} tone={attachments.length ? "good" : "neutral"} />
                  </div>

                  <div className="mt-3 space-y-2">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{a.type || "unknown"} • {formatBytes(a.size)} • Added just now</div>
                        </div>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                    ))}
                    {!attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments added.</div> : null}
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Attachments may be required for high-value items or regulated categories.
                  </div>
                </Section>
              </div>

              {/* Right */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Policy-safe templates" subtitle="Premium: auto-fill reason text" right={<Pill label="Premium" tone="info" />}>
                  <div className="grid grid-cols-1 gap-3">
                    {templates.map((t) => (
                      <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label="Template" tone="info" />
                              {t.tags.slice(0, 2).map((x) => (
                                <Pill key={`${t.id}-${x}`} label={x} tone="neutral" />
                              ))}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{t.name}</div>
                            <div className="mt-1 text-sm text-slate-600">{t.description}</div>
                          </div>
                          <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => applyTemplate(t)}>
                            <ChevronRight className="h-4 w-4" /> Apply
                          </Button>
                        </div>
                        {t.recommendedAttachments.length ? (
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Recommended attachments: <span className="font-semibold">{t.recommendedAttachments.join(", ")}</span>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">No attachments recommended.</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Templates are policy-safe wording. Replace placeholders like {"{client}"} with real details.
                  </div>
                </Section>

                <Section
                  title="Real-time validation"
                  subtitle="Premium: policy + compliance before submit"
                  right={<Pill label={validating ? "Validating" : validated.headline} tone={validating ? "info" : toneForValidation(validated.level)} />}
                >
                  <div
                    className={cn(
                      "rounded-3xl border p-4",
                      validated.level === "ok"
                        ? "border-emerald-200 bg-emerald-50"
                        : validated.level === "warn"
                        ? "border-amber-200 bg-amber-50"
                        : "border-rose-200 bg-rose-50"
                    )}
                  >
                    <div className="text-sm font-semibold text-slate-900">{validated.headline}</div>
                    <div className="mt-2 grid grid-cols-1 gap-3">
                      <div className="rounded-2xl bg-white/60 p-3">
                        <div className="text-xs font-semibold text-slate-600">Reasons</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-800">
                          {validated.reasons.map((r) => (
                            <li key={r} className="flex items-start gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-white/60 p-3">
                        <div className="text-xs font-semibold text-slate-600">Next steps</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-800">
                          {validated.nextSteps.map((s) => (
                            <li key={s} className="flex items-start gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    If validation blocks you, CorporatePay cannot proceed until you complete required fields.
                  </div>
                </Section>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Purpose: ${selectedPurpose?.label || "-"}`} tone="neutral" />
                  <Pill label={`Notes: ${notesReqLabel}`} tone={notesReq === "Required" ? "warn" : "neutral"} />
                  <Pill label={`Compliance: ${complianceChecked ? "Yes" : "No"}`} tone={complianceChecked ? "good" : complianceReq === "Required" ? "warn" : "neutral"} />
                  <Pill label={`Attachments: ${attachments.length}`} tone={attachments.length ? "good" : attachmentsReq === "Required" ? "warn" : "neutral"} />
                  <Pill label={validating ? "Validating" : validated.headline} tone={validating ? "info" : toneForValidation(validated.level)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
                    <Sparkles className="h-4 w-4" /> Templates
                  </Button>
                  <Button variant={canContinue ? "primary" : "outline"} onClick={continueFlow} disabled={!canContinue}>
                    <ChevronRight className="h-4 w-4" /> Continue
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U10 Purpose and Compliance Attestation. Core: purpose selection, optional notes, compliance checkbox. Premium: policy-safe templates and attachment capture.
            </div>
          </div>
        </div>
      </div>

      {/* Templates modal */}
      <Modal
        open={templatesOpen}
        title="Policy-safe templates"
        subtitle="Premium: auto-fill reason text for common types"
        onClose={() => setTemplatesOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTemplatesOpen(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                const t = templates.find((x) => x.purposeId === purposeId) || templates[1];
                applyTemplate(t);
                setTemplatesOpen(false);
              }}
            >
              <Sparkles className="h-4 w-4" /> Apply suggested
            </Button>
          </div>
        }
        maxW="900px"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label="Template" tone="info" />
                    {t.tags.slice(0, 2).map((x) => (
                      <Pill key={`${t.id}-${x}`} label={x} tone="neutral" />
                    ))}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{t.description}</div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">Notes template</div>
                    <div className="mt-1">{t.noteTemplate}</div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">Recommended attachments</div>
                    <div className="mt-1">{t.recommendedAttachments.length ? t.recommendedAttachments.join(", ") : "None"}</div>
                  </div>
                </div>
                <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => applyTemplate(t)}>
                  <ChevronRight className="h-4 w-4" /> Apply
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Replace placeholders like {"{client}"} or {"{flight}"}. Templates are designed to be policy-safe.
        </div>
      </Modal>
    </div>
  );
}

function PolicyToggle({ label, value, onChange }: { label: string; value: Req; onChange: (v: Req) => void }) {
  const options: Req[] = ["Required", "Optional", "Not used"];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={cn(
              "rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
              value === o ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            )}
            style={value === o ? { background: EVZ.green } : undefined}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
