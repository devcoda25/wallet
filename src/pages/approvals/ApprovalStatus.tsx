import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Info,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
  ClipboardCheck,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ModuleKey = "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";

type RequestState = "Pending" | "Needs changes" | "Approved" | "Rejected" | "Expired" | "Cancelled" | "Completed";

type ApproverRole = "Manager" | "Procurement" | "Finance" | "CFO" | "CEO" | "Fleet Admin";

type TimelineKind = "Submitted" | "Assigned" | "Reminder" | "Comment" | "Needs changes" | "Resubmitted" | "Approved" | "Rejected" | "Expired" | "Cancelled" | "Completed";

type Channel = "In-app" | "WhatsApp" | "WeChat" | "SMS";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type TimelineItem = {
  id: string;
  ts: number;
  kind: TimelineKind;
  title: string;
  by: string;
  detail: string;
  severity: "Info" | "Warning" | "Critical";
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type Comment = {
  id: string;
  ts: number;
  by: string;
  role: ApproverRole | "System" | "You";
  message: string;
  visibleToUser: boolean;
};

type ReminderLog = {
  id: string;
  ts: number;
  channel: Channel;
  to: string;
  status: "Queued" | "Sent" | "Delivered" | "Failed";
  detail: string;
};

type ChangeRequest = {
  requiredDocs: string[];
  requiredEdits: string[];
  noteFromApprover: string;
};

type ApprovalRouteStep = {
  step: number;
  role: ApproverRole;
  label: string;
  targetSlaHours?: number;
};

type ApprovalRequest = {
  id: string;
  orgName: string;
  module: ModuleKey;
  title: string;
  amountUGX: number;
  currency: "UGX";
  state: RequestState;
  createdAt: number;
  updatedAt: number;
  slaHours: number;
  dueAt: number;
  expiresAt: number;
  triggeredRule: string;
  routing: ApprovalRouteStep[];
  commentsVisible: boolean;
  delegateAllowed: boolean;
  channelRules: {
    inApp: boolean;
    whatsapp: boolean;
    wechat: boolean;
    sms: boolean;
  };
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

function toneForState(s: RequestState) {
  if (s === "Approved" || s === "Completed") return "good" as const;
  if (s === "Pending" || s === "Needs changes") return "warn" as const;
  if (s === "Rejected" || s === "Cancelled") return "bad" as const;
  return "neutral" as const;
}

function toneForSeverity(sev: TimelineItem["severity"]) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
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

function SegButton({ active, label, onClick, badge }: { active: boolean; label: string; onClick: () => void; badge?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
        active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      {label}
      {badge ? <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold">{badge}</span> : null}
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

function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
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
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[10vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[760px]"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-full min-h-0 overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <FileText className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function StatusDot({ state }: { state: RequestState }) {
  const cls =
    state === "Approved" || state === "Completed"
      ? "bg-emerald-500"
      : state === "Pending" || state === "Needs changes"
        ? "bg-amber-500"
        : state === "Rejected" || state === "Cancelled"
          ? "bg-rose-500"
          : "bg-slate-400";
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cls)} />;
}

function computeProgress(state: RequestState) {
  // 0..4
  if (state === "Pending") return 1;
  if (state === "Needs changes") return 2;
  if (state === "Approved") return 3;
  if (state === "Rejected") return 3;
  if (state === "Completed") return 4;
  if (state === "Expired" || state === "Cancelled") return 2;
  return 1;
}

export default function UserPendingApprovalStatusU13() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Seed request
  const seed = useMemo<ApprovalRequest>(() => {
    const now = Date.now();
    const createdAt = now - 28 * 60 * 1000;
    const slaHours = 8;
    return {
      id: "REQ-RIDE-001",
      orgName: "Acme Group Ltd",
      module: "Rides & Logistics",
      title: "Premium ride: Office → Airport",
      amountUGX: 280000,
      currency: "UGX",
      state: "Pending",
      createdAt,
      updatedAt: now - 10 * 60 * 1000,
      slaHours,
      dueAt: createdAt + slaHours * 60 * 60 * 1000,
      expiresAt: createdAt + (slaHours + 24) * 60 * 60 * 1000,
      triggeredRule: "Premium ride amount > UGX 200,000",
      routing: [
        { step: 1, role: "Manager", label: "Your Manager", targetSlaHours: 6 },
        { step: 2, role: "Finance", label: "Finance Desk", targetSlaHours: 8 },
      ],
      commentsVisible: true,
      delegateAllowed: true,
      channelRules: { inApp: true, whatsapp: true, wechat: false, sms: true },
    };
  }, []);

  const [req, setReq] = useState<ApprovalRequest>(seed);

  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    const now = Date.now();
    return [
      {
        id: uid("tl"),
        ts: now - 28 * 60 * 1000,
        kind: "Submitted",
        title: "Submitted",
        by: "You",
        detail: "Request submitted for approval.",
        severity: "Info",
      },
      {
        id: uid("tl"),
        ts: now - 26 * 60 * 1000,
        kind: "Assigned",
        title: "Assigned",
        by: "System",
        detail: "Routed to Manager → Finance.",
        severity: "Info",
      },
      {
        id: uid("tl"),
        ts: now - 10 * 60 * 1000,
        kind: "Comment",
        title: "Viewed",
        by: "Manager",
        detail: "Manager opened the request.",
        severity: "Info",
      },
    ];
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const now = Date.now();
    return [
      {
        id: uid("c"),
        ts: now - 12 * 60 * 1000,
        by: "Manager",
        role: "Manager",
        message: "Please ensure purpose is set to Airport and add any itinerary if available.",
        visibleToUser: true,
      },
      {
        id: uid("c"),
        ts: now - 8 * 60 * 1000,
        by: "System",
        role: "System",
        message: "SLA timer started. Expected decision within 8 hours.",
        visibleToUser: true,
      },
      {
        id: uid("c"),
        ts: now - 7 * 60 * 1000,
        by: "Finance",
        role: "Finance",
        message: "(Internal) If amount increases, ensure CFO is added to routing.",
        visibleToUser: false,
      },
    ];
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [changeReq, setChangeReq] = useState<ChangeRequest | null>(null);

  const [reminders, setReminders] = useState<ReminderLog[]>([]);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<"timeline" | "comments" | "reminders" | "changes">("timeline");

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);

  // Expiry handling
  useEffect(() => {
    if (req.state === "Pending" || req.state === "Needs changes") {
      if (nowTick > req.expiresAt) {
        setReq((p) => ({ ...p, state: "Expired", updatedAt: Date.now() }));
        setTimeline((prev) => [
          ...prev,
          {
            id: uid("tl"),
            ts: Date.now(),
            kind: "Expired",
            title: "Expired",
            by: "System",
            detail: "No decision in time. You can resubmit.",
            severity: "Warning",
          },
        ]);
        toast({ title: "Expired", message: "Request expired. You can resubmit.", kind: "warn" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick]);

  const dueMs = req.dueAt - nowTick;
  const expiryMs = req.expiresAt - nowTick;

  const progress = useMemo(() => computeProgress(req.state), [req.state]);

  const visibleComments = useMemo(() => {
    if (!req.commentsVisible) return comments.filter((c) => c.role === "System" || c.role === "You");
    return comments.filter((c) => c.visibleToUser);
  }, [comments, req.commentsVisible]);

  const hiddenCount = useMemo(() => comments.filter((c) => !c.visibleToUser).length, [comments]);

  // Required docs when changes requested
  const missingDocs = useMemo(() => {
    if (!changeReq) return [];
    return changeReq.requiredDocs.filter((name) => !attachments.some((a) => a.name.toLowerCase().includes(name.toLowerCase())));
  }, [changeReq, attachments]);

  const canResubmit = useMemo(() => {
    if (req.state !== "Needs changes" && req.state !== "Expired") return false;
    if (req.state === "Expired") return true;
    // Needs changes: ensure docs and edits are satisfied
    return missingDocs.length === 0;
  }, [req.state, missingDocs.length]);

  // Modals
  const [reminderOpen, setReminderOpen] = useState(false);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Reminder draft
  const [reminderDraft, setReminderDraft] = useState<{ channel: Channel; to: string }>(() => ({ channel: "In-app", to: "Manager" }));

  // Edit draft
  const [editDraft, setEditDraft] = useState<{ amountUGX: number; note: string }>({ amountUGX: req.amountUGX, note: "" });

  useEffect(() => {
    setEditDraft({ amountUGX: req.amountUGX, note: "" });
  }, [req.amountUGX]);

  const routeText = useMemo(() => req.routing.map((s) => `${s.step}. ${s.role}`).join(" → "), [req.routing]);

  const sendReminder = () => {
    // Validate channel availability
    const allowed =
      (reminderDraft.channel === "In-app" && req.channelRules.inApp) ||
      (reminderDraft.channel === "WhatsApp" && req.channelRules.whatsapp) ||
      (reminderDraft.channel === "WeChat" && req.channelRules.wechat) ||
      (reminderDraft.channel === "SMS" && req.channelRules.sms);

    if (!allowed) {
      toast({ title: "Channel not allowed", message: "This channel is disabled by org rules.", kind: "warn" });
      return;
    }

    const id = uid("rem");
    const base: ReminderLog = {
      id,
      ts: Date.now(),
      channel: reminderDraft.channel,
      to: reminderDraft.to,
      status: "Queued",
      detail: "Reminder queued.",
    };
    setReminders((p) => [base, ...p]);

    // Add timeline entry
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Reminder",
        title: "Reminder sent",
        by: "System",
        detail: `Reminder queued via ${reminderDraft.channel} to ${reminderDraft.to}.`,
        severity: "Info",
      },
    ]);

    toast({ title: "Reminder queued", message: `${reminderDraft.channel} → ${reminderDraft.to}`, kind: "success" });
    setReminderOpen(false);

    // Simulate delivery
    window.setTimeout(() => {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              status: "Sent",
              detail: "Sent to channel provider.",
            }
            : r
        )
      );
    }, 450);

    window.setTimeout(() => {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              status: Math.random() < 0.9 ? "Delivered" : "Failed",
              detail: Math.random() < 0.9 ? "Delivered." : "Delivery failed. Will retry.",
            }
            : r
        )
      );
    }, 1100);
  };

  const requestChanges = () => {
    // This simulates an approver asking for more information
    const cr: ChangeRequest = {
      requiredDocs: req.module === "E-Commerce" ? ["Quotation", "Proforma"] : ["Itinerary"],
      requiredEdits: ["Confirm purpose tag", "Confirm cost center"],
      noteFromApprover: "Please attach the missing document(s) and confirm allocation fields.",
    };

    setChangeReq(cr);
    setReq((p) => ({ ...p, state: "Needs changes", updatedAt: Date.now() }));

    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Needs changes",
        title: "Needs changes",
        by: "Approver",
        detail: "Approver requested changes and documents.",
        severity: "Warning",
      },
    ]);

    setComments((prev) => [
      {
        id: uid("c"),
        ts: Date.now(),
        by: "Manager",
        role: "Manager",
        message: cr.noteFromApprover,
        visibleToUser: true,
      },
      ...prev,
    ]);

    toast({ title: "Needs changes", message: "Approver requested updates.", kind: "warn" });
    setRequestChangesOpen(false);
    setTab("changes");
  };

  const cancelRequest = () => {
    const ok = window.confirm(`Cancel ${req.id}?`);
    if (!ok) return;

    setReq((p) => ({ ...p, state: "Cancelled", updatedAt: Date.now() }));
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Cancelled",
        title: "Cancelled",
        by: "You",
        detail: "Request cancelled by requester.",
        severity: "Warning",
      },
    ]);
    toast({ title: "Cancelled", message: "Request cancelled.", kind: "info" });
  };

  const resubmit = () => {
    if (!canResubmit) {
      toast({ title: "Not ready", message: "Upload required docs or fix requested items first.", kind: "warn" });
      return;
    }

    // Clear change request and move back to pending
    setReq((p) => ({
      ...p,
      state: "Pending",
      updatedAt: Date.now(),
      // Extend due time to simulate new SLA window
      dueAt: Date.now() + p.slaHours * 60 * 60 * 1000,
      expiresAt: Date.now() + (p.slaHours + 24) * 60 * 60 * 1000,
    }));

    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Resubmitted",
        title: "Resubmitted",
        by: "You",
        detail: "Request updated and resubmitted.",
        severity: "Info",
      },
    ]);

    setChangeReq(null);
    toast({ title: "Resubmitted", message: "Back to Pending.", kind: "success" });
    setTab("timeline");
  };

  const complete = () => {
    setReq((p) => ({ ...p, state: "Completed", updatedAt: Date.now() }));
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Completed",
        title: "Completed",
        by: "System",
        detail: "Transaction completed and receipt generated.",
        severity: "Info",
      },
    ]);
    toast({ title: "Completed", message: "Receipt available in U6.", kind: "success" });
  };

  const approve = () => {
    setReq((p) => ({ ...p, state: "Approved", updatedAt: Date.now() }));
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Approved",
        title: "Approved",
        by: "Manager",
        detail: "Approved by Manager. Routed to Finance (if applicable).",
        severity: "Info",
      },
    ]);
    toast({ title: "Approved", message: "Approval granted.", kind: "success" });
  };

  const reject = () => {
    setReq((p) => ({ ...p, state: "Rejected", updatedAt: Date.now() }));
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Rejected",
        title: "Rejected",
        by: "Manager",
        detail: "Rejected by Manager. Reason: Out of policy.",
        severity: "Critical",
      },
    ]);
    toast({ title: "Rejected", message: "Request rejected.", kind: "error" });
  };

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setAttachments((prev) => [...list, ...prev].slice(0, 10));
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Comment",
        title: "Document uploaded",
        by: "You",
        detail: `Uploaded ${list.length} document(s).`,
        severity: "Info",
      },
    ]);
    toast({ title: "Uploaded", message: `${list.length} file(s)`, kind: "success" });
  };

  const addName = () => {
    const name = prompt("Enter attachment name (example: Itinerary.pdf)")?.trim();
    if (!name) return;
    const a: Attachment = { id: uid("att"), name, size: 0, type: "manual", ts: Date.now() };
    setAttachments((p) => [a, ...p].slice(0, 10));
    toast({ title: "Added", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((p) => p.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  const saveEdits = () => {
    const amt = clamp(Number(editDraft.amountUGX || 0), 0, 999999999);
    setReq((p) => ({ ...p, amountUGX: amt, updatedAt: Date.now() }));

    setTimeline((prev) => [
      ...prev,
      {
        id: uid("tl"),
        ts: Date.now(),
        kind: "Comment",
        title: "Request updated",
        by: "You",
        detail: editDraft.note.trim() ? editDraft.note.trim() : "Updated request details.",
        severity: "Info",
      },
    ]);

    toast({ title: "Updated", message: "Changes saved.", kind: "success" });
    setEditOpen(false);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(req.id);
      toast({ title: "Copied", message: "Request ID copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const statusBanner = useMemo(() => {
    if (req.state === "Pending") return { tone: "warn" as const, title: "Pending approval", body: `Expected decision within ${req.slaHours} hours.` };
    if (req.state === "Needs changes") return { tone: "warn" as const, title: "Needs changes", body: "Upload missing documents or edit the request, then resubmit." };
    if (req.state === "Approved") return { tone: "good" as const, title: "Approved", body: "You can now complete the transaction." };
    if (req.state === "Rejected") return { tone: "bad" as const, title: "Rejected", body: "You can edit and resubmit or switch payment." };
    if (req.state === "Expired") return { tone: "neutral" as const, title: "Expired", body: "No decision in time. You can resubmit." };
    if (req.state === "Cancelled") return { tone: "neutral" as const, title: "Cancelled", body: "Request was cancelled." };
    return { tone: "good" as const, title: "Completed", body: "Receipt is available in Corporate Receipts." };
  }, [req.state, req.slaHours]);

  const actionPrimary = useMemo(() => {
    if (req.state === "Approved") return { label: "Complete", onClick: complete, disabled: false };
    if (req.state === "Needs changes" || req.state === "Expired") return { label: "Resubmit", onClick: resubmit, disabled: !canResubmit };
    if (req.state === "Pending") return { label: "Send reminder", onClick: () => setReminderOpen(true), disabled: false };
    return { label: "Back to requests", onClick: () => toast({ title: "My Requests", message: "Open U5 (demo).", kind: "info" }), disabled: false };
  }, [req.state, canResubmit]);

  const availableChannels: Channel[] = useMemo(() => {
    const out: Channel[] = [];
    if (req.channelRules.inApp) out.push("In-app");
    if (req.channelRules.whatsapp) out.push("WhatsApp");
    if (req.channelRules.wechat) out.push("WeChat");
    if (req.channelRules.sms) out.push("SMS");
    return out.length ? out : ["In-app"];
  }, [req.channelRules]);

  useEffect(() => {
    if (!availableChannels.includes(reminderDraft.channel)) {
      setReminderDraft((p) => ({ ...p, channel: availableChannels[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableChannels.join("|")]);

  // Demo controls
  const [demoOpen, setDemoOpen] = useState(false);

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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">Approval status</div>
                    <Pill label={req.state} tone={toneForState(req.state)} />
                    <Pill label={req.module} tone="neutral" />
                    <Pill label={formatUGX(req.amountUGX)} tone="neutral" />
                    <Pill label={req.id} tone="neutral" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {req.title} • Org: {req.orgName}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Rule: ${req.triggeredRule}`} tone="info" />
                    <Pill label={`Routing: ${routeText}`} tone="neutral" />
                    <Pill label={`Updated ${timeAgo(req.updatedAt)}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to Approval Review (U12).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={copyId}>
                  <Copy className="h-4 w-4" /> Copy ID
                </Button>
                <Button variant="outline" onClick={() => setDemoOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Demo
                </Button>
              </div>
            </div>

            <div className={cn(
              "mt-4 rounded-3xl border p-4",
              statusBanner.tone === "good" ? "border-emerald-200 bg-emerald-50" : statusBanner.tone === "warn" ? "border-amber-200 bg-amber-50" : statusBanner.tone === "bad" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{statusBanner.title}</div>
                  <div className="mt-1 text-sm text-slate-700">{statusBanner.body}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`SLA: ${req.slaHours}h`} tone="neutral" />
                    <Pill label={`Due in: ${msToFriendly(dueMs)}`} tone={dueMs <= 0 ? "bad" : dueMs <= 2 * 60 * 60 * 1000 ? "warn" : "info"} />
                    <Pill label={`Expires in: ${msToFriendly(expiryMs)}`} tone={expiryMs <= 0 ? "bad" : "neutral"} />
                    <Pill label={`Comments: ${req.commentsVisible ? "Visible" : "Limited"}`} tone={req.commentsVisible ? "info" : "neutral"} />
                  </div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/60 text-slate-700 ring-1 ring-slate-200">
                  {req.state === "Approved" || req.state === "Completed" ? <BadgeCheck className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SegButton active={tab === "timeline"} label="Timeline" onClick={() => setTab("timeline")} />
              <SegButton active={tab === "comments"} label="Comments" onClick={() => setTab("comments")} badge={String(visibleComments.length)} />
              <SegButton active={tab === "reminders"} label="Reminders" onClick={() => setTab("reminders")} badge={String(reminders.length)} />
              <SegButton active={tab === "changes"} label="Changes" onClick={() => setTab("changes")} badge={changeReq ? "1" : "0"} />

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {req.state === "Pending" ? (
                  <Button variant="outline" onClick={() => setReminderOpen(true)}>
                    <Bell className="h-4 w-4" /> Send reminder
                  </Button>
                ) : null}
                {req.state === "Pending" ? (
                  <Button variant="outline" onClick={() => setRequestChangesOpen(true)}>
                    <MessageSquare className="h-4 w-4" /> Simulate changes
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-4">
                {tab === "timeline" ? (
                  <Section
                    title="Status timeline"
                    subtitle="Submitted → assigned → approved/rejected → completed"
                    right={<Pill label={`${timeline.length} events`} tone="neutral" />}
                  >
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-600">Progress</div>
                        <Pill label={`${progress}/4`} tone="neutral" />
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {["Submitted", "Pending", "Decision", "Completed"].map((label, idx) => {
                          const active = idx + 1 <= progress;
                          return (
                            <div key={label} className={cn("rounded-2xl border p-3", active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                              <div className="flex items-center gap-2">
                                <span className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-300")} />
                                <div className="text-xs font-semibold text-slate-700">{label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Premium: SLA timers and auto-routing are visible to you and audited.
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {timeline
                        .slice()
                        .sort((a, b) => b.ts - a.ts)
                        .map((t) => (
                          <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={t.kind} tone={toneForSeverity(t.severity)} />
                                  <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{fmtDateTime(t.ts)} • {timeAgo(t.ts)} • By {t.by}</div>
                                <div className="mt-2 text-sm text-slate-700">{t.detail}</div>
                              </div>
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                <StatusDot state={req.state} />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {!timeline.length ? <Empty title="No timeline" subtitle="No events recorded." /> : null}
                  </Section>
                ) : null}

                {tab === "comments" ? (
                  <Section
                    title="Approver comments"
                    subtitle={req.commentsVisible ? "Visible comments from approvers" : "Comments are restricted by policy"}
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill label={req.commentsVisible ? "Allowed" : "Restricted"} tone={req.commentsVisible ? "info" : "neutral"} />
                        {!req.commentsVisible && hiddenCount ? <Pill label={`${hiddenCount} hidden`} tone="neutral" /> : null}
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      {visibleComments
                        .slice()
                        .sort((a, b) => b.ts - a.ts)
                        .map((c) => (
                          <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={c.role} tone={c.role === "System" ? "neutral" : "info"} />
                                  <div className="text-sm font-semibold text-slate-900">{c.by}</div>
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{fmtDateTime(c.ts)} • {timeAgo(c.ts)}</div>
                                <div className="mt-2 text-sm text-slate-700">{c.message}</div>
                              </div>
                              <button
                                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(c.message);
                                    toast({ title: "Copied", message: "Comment copied.", kind: "success" });
                                  } catch {
                                    toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                  }
                                }}
                                aria-label="Copy"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                      {!visibleComments.length ? <Empty title="No comments" subtitle="No visible comments for this request." /> : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      If comments are restricted, you will still see clear policy reasons in U11.
                    </div>
                  </Section>
                ) : null}

                {tab === "reminders" ? (
                  <Section
                    title="Reminder logs"
                    subtitle="Premium: in-app + WhatsApp/WeChat/SMS depending on org rules"
                    right={<Pill label={`${reminders.length} logs`} tone="neutral" />}
                  >
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Available channels</div>
                          <div className="mt-1 text-xs text-slate-500">Controlled by org notification rules</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Pill label={req.channelRules.inApp ? "In-app" : "In-app off"} tone={req.channelRules.inApp ? "good" : "neutral"} />
                            <Pill label={req.channelRules.whatsapp ? "WhatsApp" : "WhatsApp off"} tone={req.channelRules.whatsapp ? "good" : "neutral"} />
                            <Pill label={req.channelRules.wechat ? "WeChat" : "WeChat off"} tone={req.channelRules.wechat ? "good" : "neutral"} />
                            <Pill label={req.channelRules.sms ? "SMS" : "SMS off"} tone={req.channelRules.sms ? "good" : "neutral"} />
                          </div>
                        </div>
                        <Button variant="primary" onClick={() => setReminderOpen(true)} disabled={req.state !== "Pending"} title={req.state !== "Pending" ? "Only for pending" : "Send reminder"}>
                          <Bell className="h-4 w-4" /> Send reminder
                        </Button>
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Reminders are logged for audit. Some orgs throttle reminders to prevent spam.
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {reminders.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={r.channel} tone="neutral" />
                                <Pill
                                  label={r.status}
                                  tone={r.status === "Delivered" ? "good" : r.status === "Failed" ? "bad" : r.status === "Sent" ? "info" : "neutral"}
                                />
                                <Pill label={`To: ${r.to}`} tone="neutral" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(r.ts)} • {timeAgo(r.ts)}</div>
                              <div className="mt-2 text-sm text-slate-700">{r.detail}</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                              <Send className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {!reminders.length ? <Empty title="No reminders" subtitle="No reminder logs yet." /> : null}
                    </div>
                  </Section>
                ) : null}

                {tab === "changes" ? (
                  <Section
                    title="Request changes"
                    subtitle="Premium: interactive loop for missing docs and edits"
                    right={<Pill label={changeReq ? "Active" : "None"} tone={changeReq ? "warn" : "neutral"} />}
                  >
                    {!changeReq ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No change request</div>
                        <div className="mt-1 text-sm text-slate-600">If an approver asks for updates, they will appear here.</div>
                        <div className="mt-4">
                          <Button variant="outline" onClick={() => setRequestChangesOpen(true)}>
                            <Sparkles className="h-4 w-4" /> Simulate request changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Approver requested changes</div>
                              <div className="mt-1 text-sm text-slate-700">{changeReq.noteFromApprover}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Required documents</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {changeReq.requiredDocs.map((d) => (
                                <Pill key={d} label={d} tone={missingDocs.includes(d) ? "warn" : "good"} />
                              ))}
                            </div>
                            {missingDocs.length ? (
                              <div className="mt-3 text-sm text-amber-900">Missing: {missingDocs.join(", ")}</div>
                            ) : (
                              <div className="mt-3 text-sm text-emerald-800">All required documents attached.</div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                                <Upload className="h-4 w-4" /> Upload
                              </Button>
                              <Button variant="outline" onClick={addName}>
                                <Paperclip className="h-4 w-4" /> Add name
                              </Button>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Required edits</div>
                            <ul className="mt-2 space-y-2 text-sm text-slate-700">
                              {changeReq.requiredEdits.map((e) => (
                                <li key={e} className="flex items-start gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => setEditOpen(true)}>
                                <RefreshCcw className="h-4 w-4" /> Edit request
                              </Button>
                              <Button variant={canResubmit ? "primary" : "outline"} onClick={resubmit} disabled={!canResubmit}>
                                <ChevronRight className="h-4 w-4" /> Resubmit
                              </Button>
                            </div>
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                              Resubmission creates a new SLA window.
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Attachments</div>
                          <div className="mt-3 space-y-2">
                            {attachments.map((a) => (
                              <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                                  <div className="mt-1 text-xs text-slate-500">{a.type || "unknown"} • {formatBytes(a.size)} • {timeAgo(a.ts)}</div>
                                </div>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                                  <Trash2 className="h-4 w-4" /> Remove
                                </Button>
                              </div>
                            ))}
                            {!attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments added.</div> : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </Section>
                ) : null}

                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="What happens next"
                  subtitle="Understand the flow"
                  right={<Pill label="Core" tone="neutral" />}
                >
                  <div className="space-y-2">
                    <StepCard
                      n={1}
                      title="Submitted"
                      desc="Your request is logged and routed to the approver chain."
                      done={timeline.some((t) => t.kind === "Submitted")}
                    />
                    <StepCard
                      n={2}
                      title="Assigned"
                      desc="System assigns the next approver based on policy."
                      done={timeline.some((t) => t.kind === "Assigned")}
                    />
                    <StepCard
                      n={3}
                      title="Decision"
                      desc="Approved, rejected, or changes requested."
                      done={req.state === "Approved" || req.state === "Rejected" || req.state === "Needs changes"}
                    />
                    <StepCard
                      n={4}
                      title="Complete"
                      desc="On approval, you proceed and a corporate receipt is generated."
                      done={req.state === "Completed"}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    If blocked or rejected, go back to U11 to see alternatives and policy-safe fixes.
                  </div>
                </Section>

                <Section
                  title="Routing"
                  subtitle="Auto-routing info"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="space-y-2">
                    {req.routing.map((s) => (
                      <div key={s.step} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={`Step ${s.step}`} tone="neutral" />
                              <Pill label={s.role} tone="info" />
                              {s.targetSlaHours ? <Pill label={`Target ${s.targetSlaHours}h`} tone="neutral" /> : null}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{s.label}</div>
                            <div className="mt-1 text-xs text-slate-500">Approver identity may be masked by policy.</div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    {req.delegateAllowed ? "Delegation may be allowed for some steps." : "Delegation is disabled by policy."}
                  </div>
                </Section>

                <Section title="Actions" subtitle="Quick actions" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => toast({ title: "My Requests", message: "Open U5 (demo).", kind: "info" })}>
                      <FileText className="h-4 w-4" /> My Requests
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 (demo).", kind: "info" })}>
                      <Wallet className="h-4 w-4" /> Receipts
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Payment", message: "Open U7 (demo).", kind: "info" })}>
                      <Wallet className="h-4 w-4" /> Change payment
                    </Button>
                    <Button variant="danger" onClick={cancelRequest} disabled={req.state === "Cancelled" || req.state === "Completed"}>
                      <Trash2 className="h-4 w-4" /> Cancel
                    </Button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Cancelling is immediate and auditable. Completed items cannot be cancelled.
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={req.state} tone={toneForState(req.state)} />
                  <Pill label={`Due in: ${msToFriendly(dueMs)}`} tone={dueMs <= 0 ? "bad" : dueMs <= 2 * 60 * 60 * 1000 ? "warn" : "info"} />
                  {req.state === "Needs changes" && missingDocs.length ? <Pill label={`Missing docs: ${missingDocs.length}`} tone="warn" /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {req.state === "Pending" ? (
                    <Button variant="outline" onClick={() => setReminderOpen(true)}>
                      <Bell className="h-4 w-4" /> Remind
                    </Button>
                  ) : null}

                  {req.state === "Needs changes" ? (
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  ) : null}

                  {req.state === "Approved" ? (
                    <Button variant="outline" onClick={() => toast({ title: "Proceed", message: "Proceed to checkout completion (demo).", kind: "info" })}>
                      <ChevronRight className="h-4 w-4" /> Proceed
                    </Button>
                  ) : null}

                  <Button variant={actionPrimary.disabled ? "outline" : "primary"} onClick={actionPrimary.onClick} disabled={actionPrimary.disabled}>
                    <ChevronRight className="h-4 w-4" /> {actionPrimary.label}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U13 Pending Approval Status and Timeline. Core: timeline, approver comments, expiry/resubmission, cancel. Premium: multi-channel reminders and interactive request changes loop.
            </div>
          </div>
        </div>
      </div>

      {/* Reminder modal */}
      <Modal
        open={reminderOpen}
        title="Send reminder"
        subtitle="Premium: reminders via in-app and supported channels"
        onClose={() => setReminderOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setReminderOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={sendReminder}>
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Request</div>
                <div className="mt-1 text-sm text-slate-700">{req.id} • {req.module} • {formatUGX(req.amountUGX)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill label={`Due in ${msToFriendly(dueMs)}`} tone={dueMs <= 0 ? "bad" : "warn"} />
                  <Pill label={`Routing: ${routeText}`} tone="neutral" />
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Channel</div>
              <select
                value={reminderDraft.channel}
                onChange={(e) => setReminderDraft((p) => ({ ...p, channel: e.target.value as Channel }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              >
                {availableChannels.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500">Only channels allowed by org rules appear.</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">To</div>
              <select
                value={reminderDraft.to}
                onChange={(e) => setReminderDraft((p) => ({ ...p, to: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              >
                {["Manager", "Finance", "Procurement"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500">System will route to the correct approver for that step.</div>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Reminders are audited and visible to organization admins.
          </div>
        </div>
      </Modal>

      {/* Simulate changes modal */}
      <Modal
        open={requestChangesOpen}
        title="Simulate: approver requests changes"
        subtitle="Premium: request changes loop"
        onClose={() => setRequestChangesOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRequestChangesOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={requestChanges}>
              <AlertTriangle className="h-4 w-4" /> Create change request
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">What will happen</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {[
                "Request status changes to Needs changes.",
                "A checklist of required docs and edits appears in the Changes tab.",
                "User can upload missing docs or edit request and resubmit.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            In production, this is triggered by approver action and includes audit references.
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        title="Edit request"
        subtitle="Update details before resubmitting"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEdits}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Amount</div>
            <input
              type="number"
              value={editDraft.amountUGX}
              onChange={(e) => setEditDraft((p) => ({ ...p, amountUGX: clamp(Number(e.target.value || 0), 0, 999999999) }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
            />
            <div className="mt-2 text-xs text-slate-500">Changing amount may change the approval route.</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Note</div>
            <textarea
              value={editDraft.note}
              onChange={(e) => setEditDraft((p) => ({ ...p, note: e.target.value }))}
              rows={5}
              placeholder="Explain what changed"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Editing is audited. Some changes may require new approvals.
          </div>
        </div>
      </Modal>

      {/* Demo drawer */}
      <Drawer
        open={demoOpen}
        title="Demo controls"
        subtitle="Preview different states"
        onClose={() => setDemoOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDemoOpen(false)}>Close</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setReq((p) => ({ ...p, commentsVisible: !p.commentsVisible }))}>
                <Info className="h-4 w-4" /> Toggle comments visibility
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Set state</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                "Pending",
                "Needs changes",
                "Approved",
                "Rejected",
                "Expired",
                "Cancelled",
                "Completed",
              ] as RequestState[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    req.state === s ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={req.state === s ? { background: EVZ.green } : undefined}
                  onClick={() => {
                    setReq((p) => ({ ...p, state: s, updatedAt: Date.now() }));
                    toast({ title: "State updated", message: s, kind: "info" });
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Simulate decisions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={approve}>
                <BadgeCheck className="h-4 w-4" /> Approve
              </Button>
              <Button variant="danger" onClick={reject}>
                <AlertTriangle className="h-4 w-4" /> Reject
              </Button>
              <Button variant="outline" onClick={() => setReminderOpen(true)}>
                <Bell className="h-4 w-4" /> Reminder
              </Button>
              <Button variant="outline" onClick={() => setRequestChangesOpen(true)}>
                <MessageSquare className="h-4 w-4" /> Changes
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            This drawer is for testing. In production, state changes come from the approval engine.
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function StepCard({ n, title, desc, done }: { n: number; title: string; desc: string; done: boolean }) {
  return (
    <div className={cn("rounded-3xl border p-4", done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: done ? EVZ.green : "#94A3B8" }}>
          <span className="text-sm font-black">{n}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}
