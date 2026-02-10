import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Filter,
  Hourglass,
  Info,
  Package,
  RefreshCcw,
  Route,
  Search,
  Send,
  Sparkles,
  Timer,
  Upload,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type RequestType = "Ride approval" | "Purchase/Service" | "RFQ/Quote" | "Exception";

type RequestStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Needs changes" | "Expired";

type Severity = "Info" | "Warning" | "Critical";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type AuditRef = { policyId: string; eventId: string; lastCheckedAt: number };

type TimelineItem = {
  id: string;
  ts: number;
  by: string;
  action: string;
  why: string;
  severity: Severity;
};

type Attachment = { id: string; name: string; ts: number };

type RequestRow = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  title: string;
  module: string;
  orgName: string;
  amountUGX: number;
  createdAt: number;
  updatedAt: number;
  approverName?: string;
  dueAt?: number; // SLA
  lastReminderAt?: number;
  purposeTag?: string;
  costCenter?: string;
  vendor?: string;
  marketplace?: string;
  requiredAttachments: string[]; // names of required docs
  attachments: Attachment[];
  note?: string;
  auditRef: AuditRef;
  timeline: TimelineItem[];
};

type TypeFilter = "All" | RequestType;

type StatusFilter = "All" | RequestStatus;

type SortKey = "Updated" | "Created" | "Amount" | "SLA";

type Tab = "list" | "grouping";

type Group = {
  key: string;
  label: string;
  type: RequestType;
  module: string;
  count: number;
  ids: string[];
  sampleTitles: string[];
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
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (ms <= 0) return "Overdue";
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function toneForStatus(s: RequestStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Pending") return "warn" as const;
  if (s === "Needs changes") return "warn" as const;
  if (s === "Rejected") return "bad" as const;
  if (s === "Expired") return "neutral" as const;
  return "neutral" as const;
}

function toneForType(t: RequestType) {
  if (t === "Ride approval") return "info" as const;
  if (t === "Purchase/Service") return "neutral" as const;
  if (t === "RFQ/Quote") return "info" as const;
  return "warn" as const;
}

function iconForType(t: RequestType) {
  if (t === "Ride approval") return <Route className="h-4 w-4" />;
  if (t === "Purchase/Service") return <Package className="h-4 w-4" />;
  if (t === "RFQ/Quote") return <FileText className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
}

function toneForSeverity(sev: Severity) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
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
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
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
        <ClipboardList className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function SummaryCard({ icon, title, value, sub, tone = "neutral" }: { icon: React.ReactNode; title: string; value: string; sub: string; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const bg =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800"
      : tone === "bad"
      ? "bg-rose-50 text-rose-700"
      : tone === "info"
      ? "bg-blue-50 text-blue-700"
      : "bg-slate-50 text-slate-700";
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-600">{sub}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
      </div>
    </div>
  );
}

function RequestCard({
  r,
  now,
  onOpen,
  onCancel,
  onReminder,
  onAttach,
  onResubmit,
}: {
  r: RequestRow;
  now: number;
  onOpen: () => void;
  onCancel: () => void;
  onReminder: () => void;
  onAttach: () => void;
  onResubmit: () => void;
}) {
  const dueMs = r.dueAt ? r.dueAt - now : null;
  const dueLabel = dueMs !== null ? msToFriendly(dueMs) : null;
  const overdue = dueMs !== null && dueMs <= 0;

  const missingDocs = r.requiredAttachments.filter((req) => !r.attachments.some((a) => a.name.toLowerCase().includes(req.toLowerCase())));
  const needsDocs = r.status === "Needs changes" && missingDocs.length > 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <button type="button" className="text-left" onClick={onOpen}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={r.type} tone={toneForType(r.type)} />
            <Pill label={r.status} tone={toneForStatus(r.status)} />
            {r.status === "Pending" && dueLabel ? <Pill label={overdue ? `Overdue` : `Due in ${dueLabel}`} tone={overdue ? "bad" : "warn"} /> : null}
            {r.lastReminderAt ? <Pill label={`Reminder sent ${timeAgo(r.lastReminderAt)}`} tone="info" /> : null}
            {needsDocs ? <Pill label="Missing documents" tone="warn" /> : null}
            <Pill label={r.id} tone="neutral" />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{r.title}</div>
          <div className="mt-1 text-sm text-slate-600">{r.module}{r.marketplace ? ` • ${r.marketplace}` : ""}{r.vendor ? ` • ${r.vendor}` : ""}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{formatUGX(r.amountUGX)}</span>
            <span>•</span>
            <span>Org: {r.orgName}</span>
            <span>•</span>
            <span>Updated {timeAgo(r.updatedAt)}</span>
            {r.approverName ? (
              <>
                <span>•</span>
                <span>Approver: {r.approverName}</span>
              </>
            ) : null}
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="px-3 py-2 text-xs" onClick={onOpen}>
            <ChevronRight className="h-4 w-4" /> Open
          </Button>

          {r.status === "Pending" ? (
            <Button variant="outline" className="px-3 py-2 text-xs" onClick={onReminder}>
              <Send className="h-4 w-4" /> Nudge
            </Button>
          ) : null}

          {r.status === "Needs changes" ? (
            <Button variant="outline" className="px-3 py-2 text-xs" onClick={onAttach}>
              <Upload className="h-4 w-4" /> Attach
            </Button>
          ) : null}

          {r.status === "Needs changes" || r.status === "Rejected" ? (
            <Button variant="primary" className="px-3 py-2 text-xs" onClick={onResubmit}>
              <RefreshCcw className="h-4 w-4" /> Resubmit
            </Button>
          ) : null}

          {r.status === "Draft" || r.status === "Pending" ? (
            <Button variant="danger" className="px-3 py-2 text-xs" onClick={onCancel}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GroupCard({ g, onView, onClone }: { g: Group; onView: () => void; onClone: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill label="Premium" tone="info" />
            <Pill label={g.type} tone={toneForType(g.type)} />
            <Pill label={g.module} tone="neutral" />
            <Pill label={`${g.count} request(s)`} tone={g.count >= 3 ? "warn" : "neutral"} />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{g.label}</div>
          <div className="mt-1 text-sm text-slate-600">{g.sampleTitles.join(" • ")}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="px-3 py-2 text-xs" onClick={onView}>
            <ChevronRight className="h-4 w-4" /> View
          </Button>
          <Button variant="primary" className="px-3 py-2 text-xs" onClick={onClone}>
            <Copy className="h-4 w-4" /> Clone
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UserCorporateRequestsU5() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const seedRequests = useMemo<RequestRow[]>(() => {
    const now = Date.now();
    const mkAudit = (policyId: string, eventId: string, minsAgo: number): AuditRef => ({ policyId, eventId, lastCheckedAt: now - minsAgo * 60 * 1000 });

    const mkTimeline = (items: Array<Pick<TimelineItem, "by" | "action" | "why" | "severity"> & { minsAgo: number }>): TimelineItem[] =>
      items
        .map((x) => ({
          id: uid("TL"),
          ts: now - x.minsAgo * 60 * 1000,
          by: x.by,
          action: x.action,
          why: x.why,
          severity: x.severity,
        }))
        .sort((a, b) => a.ts - b.ts);

    return [
      {
        id: "REQ-RIDE-001",
        type: "Ride approval",
        status: "Pending",
        title: "Premium ride: Office → Airport",
        module: "Rides & Logistics",
        orgName: "Acme Group Ltd",
        amountUGX: 280000,
        createdAt: now - 150 * 60 * 1000,
        updatedAt: now - 40 * 60 * 1000,
        approverName: "Manager",
        dueAt: now + 3 * 60 * 60 * 1000,
        purposeTag: "Airport",
        costCenter: "OPS-01",
        vendor: "EVzone Rides",
        requiredAttachments: [],
        attachments: [],
        note: "Client meeting at Entebbe",
        auditRef: mkAudit("POL-RIDES-OPS", "EVT-901", 7),
        timeline: mkTimeline([
          { minsAgo: 150, by: "You", action: "Submitted request", why: "Premium ride above threshold", severity: "Info" },
          { minsAgo: 120, by: "System", action: "Assigned approver", why: "Rule: amount > UGX 200,000", severity: "Info" },
          { minsAgo: 40, by: "Manager", action: "Viewed", why: "Pending decision", severity: "Info" },
        ]),
      },
      {
        id: "REQ-RIDE-002",
        type: "Ride approval",
        status: "Pending",
        title: "Premium ride: Office → Client site",
        module: "Rides & Logistics",
        orgName: "Acme Group Ltd",
        amountUGX: 240000,
        createdAt: now - 9 * 60 * 60 * 1000,
        updatedAt: now - 5 * 60 * 60 * 1000,
        approverName: "Manager",
        dueAt: now + 1 * 60 * 60 * 1000,
        purposeTag: "Client meeting",
        costCenter: "OPS-01",
        vendor: "EVzone Rides",
        requiredAttachments: [],
        attachments: [],
        auditRef: mkAudit("POL-RIDES-OPS", "EVT-902", 18),
        timeline: mkTimeline([
          { minsAgo: 540, by: "You", action: "Submitted request", why: "Premium ride", severity: "Info" },
          { minsAgo: 520, by: "System", action: "Assigned approver", why: "Rule triggered", severity: "Info" },
        ]),
      },
      {
        id: "REQ-EC-003",
        type: "Purchase/Service",
        status: "Needs changes",
        title: "MyLiveDealz purchase: Office supplies bundle",
        module: "E-Commerce",
        marketplace: "MyLiveDealz",
        orgName: "Acme Group Ltd",
        amountUGX: 1200000,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 60 * 60 * 1000,
        approverName: "Procurement",
        dueAt: now + 6 * 60 * 60 * 1000,
        purposeTag: "Office",
        costCenter: "OPS-01",
        vendor: "MyLiveDealz Seller",
        requiredAttachments: ["Proforma", "Quotation"],
        attachments: [{ id: uid("ATT"), name: "Proforma Invoice.pdf", ts: now - 4 * 60 * 60 * 1000 }],
        note: "Need quotation for procurement verification",
        auditRef: mkAudit("POL-EC-MYLIVE", "EVT-903", 45),
        timeline: mkTimeline([
          { minsAgo: 2880, by: "You", action: "Submitted request", why: "Basket > UGX 1,000,000", severity: "Info" },
          { minsAgo: 2000, by: "Procurement", action: "Needs changes", why: "Attach missing quotation", severity: "Warning" },
          { minsAgo: 240, by: "You", action: "Uploaded document", why: "Added proforma invoice", severity: "Info" },
        ]),
      },
      {
        id: "REQ-RFQ-004",
        type: "RFQ/Quote",
        status: "Pending",
        title: "RFQ: Company vehicle (SUV)",
        module: "Procurement",
        orgName: "Acme Group Ltd",
        amountUGX: 25000000,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 12 * 60 * 60 * 1000,
        approverName: "Finance",
        dueAt: now + 10 * 60 * 60 * 1000,
        purposeTag: "Operations",
        costCenter: "OPS-01",
        vendor: "Multiple vendors",
        requiredAttachments: ["Specs", "Budget justification"],
        attachments: [
          { id: uid("ATT"), name: "Vehicle Specs.pdf", ts: now - 4 * 24 * 60 * 60 * 1000 },
          { id: uid("ATT"), name: "Budget Justification.docx", ts: now - 4 * 24 * 60 * 60 * 1000 },
        ],
        auditRef: mkAudit("POL-RFQ", "EVT-904", 120),
        timeline: mkTimeline([
          { minsAgo: 7200, by: "You", action: "Created RFQ", why: "CapEx item", severity: "Info" },
          { minsAgo: 7000, by: "System", action: "Approval required", why: "CapEx workflow", severity: "Warning" },
          { minsAgo: 900, by: "Finance", action: "Viewed", why: "Pending decision", severity: "Info" },
        ]),
      },
      {
        id: "REQ-EXC-005",
        type: "Exception",
        status: "Approved",
        title: "Exception: Monthly cap increase (UGX 500,000)",
        module: "CorporatePay",
        orgName: "Acme Group Ltd",
        amountUGX: 500000,
        createdAt: now - 6 * 24 * 60 * 60 * 1000,
        updatedAt: now - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        approverName: "Org Admin",
        purposeTag: "Project",
        costCenter: "OPS-01",
        requiredAttachments: ["Reason"],
        attachments: [{ id: uid("ATT"), name: "Exception Reason.txt", ts: now - 6 * 24 * 60 * 60 * 1000 }],
        auditRef: mkAudit("POL-EXC", "EVT-905", 260),
        timeline: mkTimeline([
          { minsAgo: 8640, by: "You", action: "Requested exception", why: "Near cap", severity: "Warning" },
          { minsAgo: 8400, by: "Org Admin", action: "Approved", why: "Business justification accepted", severity: "Info" },
        ]),
      },
      {
        id: "REQ-EC-006",
        type: "Purchase/Service",
        status: "Draft",
        title: "Service booking: Office catering",
        module: "Services",
        orgName: "Acme Group Ltd",
        amountUGX: 380000,
        createdAt: now - 3 * 60 * 60 * 1000,
        updatedAt: now - 3 * 60 * 60 * 1000,
        purposeTag: "Meeting",
        costCenter: "OPS-01",
        requiredAttachments: [],
        attachments: [],
        note: "Draft request to be submitted",
        auditRef: mkAudit("POL-SVC", "EVT-906", 40),
        timeline: mkTimeline([{ minsAgo: 180, by: "You", action: "Saved draft", why: "Not submitted yet", severity: "Info" }]),
      },
      {
        id: "REQ-RIDE-007",
        type: "Ride approval",
        status: "Rejected",
        title: "Luxury ride request",
        module: "Rides & Logistics",
        orgName: "Acme Group Ltd",
        amountUGX: 420000,
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
        updatedAt: now - 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        approverName: "Manager",
        purposeTag: "Client",
        costCenter: "OPS-01",
        requiredAttachments: [],
        attachments: [],
        auditRef: mkAudit("POL-RIDES-OPS", "EVT-907", 1000),
        timeline: mkTimeline([
          { minsAgo: 11520, by: "You", action: "Submitted request", why: "Luxury category", severity: "Warning" },
          { minsAgo: 11280, by: "Manager", action: "Rejected", why: "Luxury is out of policy", severity: "Critical" },
        ]),
      },
      {
        id: "REQ-EXC-008",
        type: "Exception",
        status: "Expired",
        title: "Exception: Travel outside geo fence",
        module: "Travel & Tourism",
        orgName: "Acme Group Ltd",
        amountUGX: 0,
        createdAt: now - 14 * 24 * 60 * 60 * 1000,
        updatedAt: now - 12 * 24 * 60 * 60 * 1000,
        approverName: "Manager",
        purposeTag: "Travel",
        costCenter: "OPS-01",
        requiredAttachments: ["Itinerary"],
        attachments: [],
        auditRef: mkAudit("POL-GEO", "EVT-908", 2000),
        timeline: mkTimeline([
          { minsAgo: 20160, by: "You", action: "Requested exception", why: "Outside allowed region", severity: "Warning" },
          { minsAgo: 17280, by: "System", action: "Expired", why: "No decision within SLA", severity: "Warning" },
        ]),
      },
    ];
  }, []);

  const [rows, setRows] = useState<RequestRow[]>(seedRequests);

  const [tab, setTab] = useState<Tab>("list");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("Updated");
  const [q, setQ] = useState("");

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);

  const counts = useMemo(() => {
    const pending = rows.filter((r) => r.status === "Pending").length;
    const needs = rows.filter((r) => r.status === "Needs changes").length;
    const approved30 = rows.filter((r) => r.status === "Approved").length;
    const drafts = rows.filter((r) => r.status === "Draft").length;
    return { pending, needs, approved30, drafts, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((r) => (typeFilter === "All" ? true : r.type === typeFilter))
      .filter((r) => (statusFilter === "All" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!query) return true;
        const blob = `${r.id} ${r.title} ${r.type} ${r.status} ${r.module} ${r.marketplace || ""} ${r.vendor || ""} ${r.orgName} ${r.approverName || ""}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => {
        if (sortKey === "Created") return b.createdAt - a.createdAt;
        if (sortKey === "Amount") return b.amountUGX - a.amountUGX;
        if (sortKey === "SLA") {
          const ad = a.dueAt ?? Number.MAX_SAFE_INTEGER;
          const bd = b.dueAt ?? Number.MAX_SAFE_INTEGER;
          return ad - bd;
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [rows, typeFilter, statusFilter, sortKey, q]);

  // Premium smart grouping
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      const key = `${r.type}|${r.module}|${r.vendor || "-"}|${r.marketplace || "-"}`;
      const label = `${r.type} • ${r.module}${r.vendor ? ` • ${r.vendor}` : ""}${r.marketplace ? ` • ${r.marketplace}` : ""}`;
      const g = map.get(key);
      if (!g) {
        map.set(key, {
          key,
          label,
          type: r.type,
          module: r.module,
          count: 1,
          ids: [r.id],
          sampleTitles: [r.title],
        });
      } else {
        g.count += 1;
        g.ids.push(r.id);
        if (g.sampleTitles.length < 2 && !g.sampleTitles.includes(r.title)) g.sampleTitles.push(r.title);
      }
    }
    return Array.from(map.values())
      .filter((g) => g.count >= 2)
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => (activeId ? rows.find((r) => r.id === activeId) || null : null), [rows, activeId]);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<{ title: string; amountUGX: number; note: string; purposeTag: string; costCenter: string }>(
    { title: "", amountUGX: 0, note: "", purposeTag: "", costCenter: "" }
  );

  const openDetails = (id: string) => {
    setActiveId(id);
    setDrawerOpen(true);
  };

  const addTimeline = (id: string, item: Omit<TimelineItem, "id" | "ts"> & { ts?: number }) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              updatedAt: Date.now(),
              timeline: [...r.timeline, { id: uid("TL"), ts: item.ts ?? Date.now(), by: item.by, action: item.action, why: item.why, severity: item.severity }].sort(
                (a, b) => a.ts - b.ts
              ),
            }
          : r
      )
    );
  };

  const updateRequest = (id: string, patch: Partial<RequestRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r)));
  };

  const cancelRequest = (id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const ok = window.confirm(`Cancel ${id}? This will mark it as Expired.`);
    if (!ok) return;
    updateRequest(id, { status: "Expired" });
    addTimeline(id, { by: "You", action: "Cancelled", why: "Cancelled by requester", severity: "Warning" });
    toast({ title: "Cancelled", message: `${id} marked as Expired.`, kind: "info" });
  };

  const openEdit = (r: RequestRow) => {
    setEditDraft({
      title: r.title,
      amountUGX: r.amountUGX,
      note: r.note || "",
      purposeTag: r.purposeTag || "",
      costCenter: r.costCenter || "",
    });
    setEditOpen(true);
  };

  const saveEditResubmit = () => {
    if (!active) return;
    const title = editDraft.title.trim();
    if (title.length < 4) {
      toast({ title: "Title required", message: "Provide a clearer title.", kind: "warn" });
      return;
    }
    if (editDraft.amountUGX < 0) {
      toast({ title: "Invalid amount", message: "Amount cannot be negative.", kind: "warn" });
      return;
    }

    updateRequest(active.id, {
      title,
      amountUGX: editDraft.amountUGX,
      note: editDraft.note,
      purposeTag: editDraft.purposeTag,
      costCenter: editDraft.costCenter,
      status: "Pending",
      dueAt: Date.now() + 8 * 60 * 60 * 1000,
      lastReminderAt: undefined,
    });

    addTimeline(active.id, { by: "You", action: "Resubmitted", why: "Updated details and resubmitted", severity: "Info" });
    toast({ title: "Resubmitted", message: "Request moved to Pending.", kind: "success" });
    setEditOpen(false);
  };

  const attachDocument = (id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const name = prompt("Enter attachment name (example: Quotation.pdf)")?.trim();
    if (!name) return;
    const att: Attachment = { id: uid("ATT"), name, ts: Date.now() };
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, attachments: [att, ...x.attachments], updatedAt: Date.now() } : x)));
    addTimeline(id, { by: "You", action: "Uploaded document", why: name, severity: "Info" });
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const sendReminder = (id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    if (r.status !== "Pending") {
      toast({ title: "Not pending", message: "Reminders can only be sent for pending requests.", kind: "warn" });
      return;
    }
    updateRequest(id, { lastReminderAt: Date.now() });
    addTimeline(id, { by: "System", action: "Reminder sent", why: `Nudged ${r.approverName || "approver"}`, severity: "Info" });
    toast({ title: "Reminder sent", message: `Sent to ${r.approverName || "approver"}.`, kind: "success" });
  };

  const cloneRequest = (sourceId: string) => {
    const src = rows.find((x) => x.id === sourceId);
    if (!src) return;
    const now = Date.now();
    const id = `REQ-CLONE-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const cloned: RequestRow = {
      ...src,
      id,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
      dueAt: undefined,
      lastReminderAt: undefined,
      attachments: [],
      timeline: [
        {
          id: uid("TL"),
          ts: now,
          by: "You",
          action: "Cloned draft",
          why: `Cloned from ${src.id}`,
          severity: "Info",
        },
      ],
      auditRef: { ...src.auditRef, eventId: `EVT-CLONE-${Math.random().toString(16).slice(2, 6)}`, lastCheckedAt: now },
    };

    setRows((prev) => [cloned, ...prev]);
    toast({ title: "Cloned", message: `Created draft ${id}.`, kind: "success" });
    setTab("list");
    setTypeFilter(src.type);
    setStatusFilter("Draft");
    setQ(id);
  };

  const openGroupView = (g: Group) => {
    setTab("list");
    setTypeFilter(g.type);
    setStatusFilter("All");
    setQ("");
    toast({ title: "Filtered", message: `Showing ${g.type} requests.`, kind: "info" });
  };

  const activeMissingDocs = useMemo(() => {
    if (!active) return [];
    return active.requiredAttachments.filter((req) => !active.attachments.some((a) => a.name.toLowerCase().includes(req.toLowerCase())));
  }, [active]);

  const activeDue = useMemo(() => {
    if (!active?.dueAt) return null;
    const ms = active.dueAt - nowTick;
    return { ms, label: msToFriendly(ms), overdue: ms <= 0 };
  }, [active?.dueAt, nowTick]);

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
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">My Requests</div>
                  <div className="mt-1 text-xs text-slate-500">Unified list for approvals, purchases, RFQs, and exceptions.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Total ${counts.total}`} tone="neutral" />
                    <Pill label={`Pending ${counts.pending}`} tone={counts.pending ? "warn" : "good"} />
                    <Pill label={`Needs changes ${counts.needs}`} tone={counts.needs ? "warn" : "good"} />
                    <Pill label={`Draft ${counts.drafts}`} tone={counts.drafts ? "info" : "neutral"} />
                    <Pill label="CorporatePay" tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "CorporatePay Hub", message: "Back to U1 (demo).", kind: "info" })}>
                  <Sparkles className="h-4 w-4" /> Hub
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Payment methods", message: "Open U7 (demo).", kind: "info" })}>
                  <Wallet className="h-4 w-4" /> Payment
                </Button>
                <Button variant="primary" onClick={() => toast({ title: "Create", message: "Requests are typically created at checkout. This button is a shortcut in production.", kind: "info" })}>
                  <ChevronRight className="h-4 w-4" /> New request
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              <SegButton active={tab === "list"} label="List" onClick={() => setTab("list")} />
              <SegButton active={tab === "grouping"} label="Smart grouping" onClick={() => setTab("grouping")} />
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search id, title, approver, vendor..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-6">
                <div className="text-xs font-semibold text-slate-600">Filters</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["All", "Ride approval", "Purchase/Service", "RFQ/Quote", "Exception"] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        typeFilter === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={typeFilter === t ? { background: EVZ.green } : undefined}
                      onClick={() => setTypeFilter(t)}
                    >
                      {t}
                    </button>
                  ))}

                  <Select
                    label="Status"
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as StatusFilter)}
                    options={[
                      { value: "All", label: "All statuses" },
                      { value: "Draft", label: "Draft" },
                      { value: "Pending", label: "Pending" },
                      { value: "Approved", label: "Approved" },
                      { value: "Rejected", label: "Rejected" },
                      { value: "Needs changes", label: "Needs changes" },
                      { value: "Expired", label: "Expired" },
                    ]}
                    hint=""
                  />

                  <Select
                    label="Sort"
                    value={sortKey}
                    onChange={(v) => setSortKey(v as SortKey)}
                    options={[
                      { value: "Updated", label: "Updated" },
                      { value: "Created", label: "Created" },
                      { value: "Amount", label: "Amount" },
                      { value: "SLA", label: "SLA" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {/* Summary */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SummaryCard icon={<Hourglass className="h-5 w-5" />} title="Pending" value={`${counts.pending}`} sub="Awaiting approval" tone={counts.pending ? "warn" : "good"} />
              <SummaryCard icon={<Upload className="h-5 w-5" />} title="Needs changes" value={`${counts.needs}`} sub="Missing info/docs" tone={counts.needs ? "warn" : "good"} />
              <SummaryCard icon={<BadgeCheck className="h-5 w-5" />} title="Approved" value={`${counts.approved30}`} sub="Recent approvals" tone={counts.approved30 ? "good" : "neutral"} />
              <SummaryCard icon={<ClipboardList className="h-5 w-5" />} title="Drafts" value={`${counts.drafts}`} sub="Not submitted" tone={counts.drafts ? "info" : "neutral"} />
            </div>

            {tab === "list" ? (
              <div className="mt-4 space-y-4">
                <Section
                  title="Requests"
                  subtitle="Tap a request to see timeline, audit reference, and actions"
                  right={<Pill label={`${filtered.length} shown`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {filtered.map((r) => (
                      <RequestCard
                        key={r.id}
                        r={r}
                        now={nowTick}
                        onOpen={() => openDetails(r.id)}
                        onCancel={() => cancelRequest(r.id)}
                        onReminder={() => sendReminder(r.id)}
                        onAttach={() => attachDocument(r.id)}
                        onResubmit={() => {
                          openDetails(r.id);
                          setTimeout(() => {
                            const rr = rows.find((x) => x.id === r.id);
                            if (rr) openEdit(rr);
                          }, 0);
                        }}
                      />
                    ))}
                    {!filtered.length ? <Empty title="No requests" subtitle="Try a different filter or search." /> : null}
                  </div>
                </Section>

                <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Premium: smart grouping can help you clone common requests and send SLA nudges.
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <Section
                  title="Smart grouping"
                  subtitle="Premium: group similar requests and clone them"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <GroupCard key={g.key} g={g} onView={() => openGroupView(g)} onClone={() => cloneRequest(g.ids[0])} />
                    ))}
                    {!groups.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No groups yet</div>
                        <div className="mt-1 text-sm text-slate-600">As you create more similar requests, groups will appear here.</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Smart grouping uses type + module + vendor/marketplace as the grouping key.
                  </div>
                </Section>
              </div>
            )}

            {/* Mobile footer */}
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-2 lg:hidden">
              <div className="grid grid-cols-4 gap-2">
                <MobileTab label="List" active={tab === "list"} icon={<ClipboardList className="h-5 w-5" />} onClick={() => setTab("list")} badge={counts.pending ? `${counts.pending}` : undefined} />
                <MobileTab label="Groups" active={tab === "grouping"} icon={<Sparkles className="h-5 w-5" />} onClick={() => setTab("grouping")} />
                <MobileTab label="Filters" icon={<Filter className="h-5 w-5" />} onClick={() => toast({ title: "Filters", message: "Use filters at top of page.", kind: "info" })} />
                <MobileTab label="New" icon={<ChevronRight className="h-5 w-5" />} onClick={() => toast({ title: "Create", message: "Requests are created at checkout.", kind: "info" })} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white/60 px-4 py-5 text-xs text-slate-500 md:px-6">
            U5 Corporate Requests. Core: list + type filters + statuses + timeline + cancel/resubmit/attach. Premium: smart grouping + SLA countdown + nudges.
          </div>
        </div>
      </div>

      {/* Details drawer */}
      <Drawer
        open={drawerOpen}
        title={active ? `${active.id} • ${active.title}` : "Request"}
        subtitle={active ? `${active.type} • ${active.status} • Updated ${timeAgo(active.updatedAt)}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          active ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">All actions are logged and auditable in CorporatePay.</div>
              <div className="flex flex-wrap items-center gap-2">
                {active.status === "Pending" ? (
                  <Button variant="outline" onClick={() => sendReminder(active.id)}>
                    <Send className="h-4 w-4" /> Send reminder
                  </Button>
                ) : null}
                {(active.status === "Needs changes" || active.status === "Rejected") ? (
                  <Button variant="primary" onClick={() => openEdit(active)}>
                    <RefreshCcw className="h-4 w-4" /> Modify & resubmit
                  </Button>
                ) : null}
                {(active.status === "Draft" || active.status === "Pending") ? (
                  <Button variant="danger" onClick={() => cancelRequest(active.id)}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {active ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={active.type} tone={toneForType(active.type)} />
                <Pill label={active.status} tone={toneForStatus(active.status)} />
                {activeDue ? <Pill label={activeDue.overdue ? "Overdue" : `Due in ${activeDue.label}`} tone={activeDue.overdue ? "bad" : "warn"} /> : null}
                {active.marketplace ? <Pill label={active.marketplace} tone="neutral" /> : null}
                <Pill label={formatUGX(active.amountUGX)} tone="neutral" />
                {active.lastReminderAt ? <Pill label={`Reminder sent ${timeAgo(active.lastReminderAt)}`} tone="info" /> : null}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Module:</span> {active.module}
                {active.vendor ? <span>{` • `}<span className="font-semibold">Vendor:</span> {active.vendor}</span> : null}
              </div>
              <div className="mt-2 text-xs text-slate-500">Created {fmtDateTime(active.createdAt)} • Updated {fmtDateTime(active.updatedAt)}</div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoTile label="Organization" value={active.orgName} icon={<Sparkles className="h-4 w-4" />} />
                <InfoTile label="Approver" value={active.approverName || "-"} icon={<BadgeCheck className="h-4 w-4" />} />
                <InfoTile label="Purpose" value={active.purposeTag || "-"} icon={<Info className="h-4 w-4" />} />
                <InfoTile label="Cost center" value={active.costCenter || "-"} icon={<Wallet className="h-4 w-4" />} />
              </div>

              {active.note ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">{active.note}</div> : null}

              {active.status === "Needs changes" && activeMissingDocs.length ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Missing documents: <span className="font-semibold">{activeMissingDocs.join(", ")}</span>
                  <div className="mt-2">
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => attachDocument(active.id)}>
                      <Upload className="h-4 w-4" /> Attach now
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <Section title="Attachments" subtitle="Documents and evidence" right={<Pill label={`${active.attachments.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {active.attachments.map((a) => (
                  <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                        <div className="mt-1 text-xs text-slate-500">Added {timeAgo(a.ts)}</div>
                      </div>
                      <Pill label="Attached" tone="good" />
                    </div>
                  </div>
                ))}
                {!active.attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments yet.</div> : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => attachDocument(active.id)}>
                  <Upload className="h-4 w-4" /> Add attachment
                </Button>
              </div>
            </Section>

            <Section title="Timeline" subtitle="Who, when, and why" right={<Pill label={`${active.timeline.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {active.timeline
                  .slice()
                  .sort((a, b) => b.ts - a.ts)
                  .map((t) => (
                    <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={t.severity} tone={toneForSeverity(t.severity)} />
                            <div className="text-sm font-semibold text-slate-900">{t.action}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{fmtDateTime(t.ts)} • {timeAgo(t.ts)} • By {t.by}</div>
                          <div className="mt-2 text-sm text-slate-700">{t.why}</div>
                        </div>
                        <button
                          className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(`${t.action}: ${t.why}`);
                              toast({ title: "Copied", message: "Timeline entry copied.", kind: "success" });
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
              </div>
            </Section>

            <Section title="Audit reference" subtitle="Policy and event reference for support" right={<Pill label="Core" tone="neutral" />}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Policy: ${active.auditRef.policyId}`} tone="neutral" />
                  <Pill label={`Event: ${active.auditRef.eventId}`} tone="neutral" />
                  <Pill label={`Checked: ${timeAgo(active.auditRef.lastCheckedAt)}`} tone="neutral" />
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  This reference helps your org admin and EVzone Support explain decisions and enforcement.
                </div>
              </div>
            </Section>

            <Section title="Premium actions" subtitle="Smart grouping and SLA nudges" right={<Pill label="Premium" tone="info" />}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => cloneRequest(active.id)}>
                  <Copy className="h-4 w-4" /> Clone request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (active.status !== "Pending") {
                      toast({ title: "Nudge", message: "Nudges apply to Pending requests.", kind: "info" });
                      return;
                    }
                    sendReminder(active.id);
                  }}
                >
                  <Send className="h-4 w-4" /> Send SLA nudge
                </Button>
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Nudges are logged. In production, they can also notify approvers via Email/WhatsApp/WeChat/SMS based on org rules.
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Edit/Resubmit modal */}
      <Modal
        open={editOpen}
        title="Modify and resubmit"
        subtitle="Update details, then resubmit for approval"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEditResubmit}>
              <RefreshCcw className="h-4 w-4" /> Resubmit
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" value={editDraft.title} onChange={(v) => setEditDraft((p) => ({ ...p, title: v }))} placeholder="Request title" />
          <Field
            label="Amount"
            value={String(editDraft.amountUGX)}
            onChange={(v) => setEditDraft((p) => ({ ...p, amountUGX: Number(v || 0) }))}
            placeholder="0"
            hint="UGX"
            type="number"
          />
          <Field label="Purpose tag" value={editDraft.purposeTag} onChange={(v) => setEditDraft((p) => ({ ...p, purposeTag: v }))} placeholder="Airport, Client meeting, Office" />
          <Field label="Cost center" value={editDraft.costCenter} onChange={(v) => setEditDraft((p) => ({ ...p, costCenter: v }))} placeholder="OPS-01" />
          <div className="md:col-span-2">
            <Field label="Note" value={editDraft.note} onChange={(v) => setEditDraft((p) => ({ ...p, note: v }))} placeholder="Add context for approver" />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            If your org requires attachments, add them in the request details before resubmitting.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

function MobileTab({
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
        active ? "text-white" : "text-slate-700 hover:bg-slate-100"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      <div className={cn("relative", active ? "text-white" : "text-slate-700")}>{icon}</div>
      <div className="leading-none">{label}</div>
      {badge ? <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badge}</span> : null}
    </button>
  );
}
