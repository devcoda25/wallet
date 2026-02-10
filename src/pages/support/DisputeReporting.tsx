import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Info,
  LifeBuoy,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Timer,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type ModuleKey =
  | "Rides & Logistics"
  | "E-Commerce"
  | "EVs & Charging"
  | "Services";

type ReceiptType = "Ride" | "Order" | "Charging" | "Service";

type ReceiptStatus = "Completed" | "Cancelled" | "Refunded" | "In progress" | "Failed";

type SLAStatus = "On track" | "At risk" | "Breached" | "N/A";

type IssueCategory =
  | "Wrong amount"
  | "Service not delivered"
  | "Damaged item"
  | "Charging issue"
  | "Ride issue"
  | "Safety concern"
  | "Refund request"
  | "Payment/CorporatePay"
  | "Other";

type Severity = "Low" | "Medium" | "High";

type TicketStatus =
  | "Draft"
  | "Submitted"
  | "Acknowledged"
  | "In review"
  | "Waiting on vendor"
  | "Proposed resolution"
  | "Resolved"
  | "Closed";

type EscalationTarget = "Corporate Admin" | "EVzone Support" | "Vendor";

type Channel = "In-app" | "WhatsApp" | "WeChat";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  ts: number;
  scope: "Ticket" | "Message";
};

type Receipt = {
  id: string;
  module: ModuleKey;
  type: ReceiptType;
  title: string;
  vendor: string;
  amountUGX: number;
  status: ReceiptStatus;
  createdAt: number;
  sla?: {
    status: SLAStatus;
    dueAt?: number;
    completedAt?: number;
    breachedReason?: string;
  };
  meta: {
    purpose?: string;
    costCenter?: string;
    stationOrRoute?: string;
    orderNo?: string;
  };
};

type TimelineEvent = {
  id: string;
  ts: number;
  status: TicketStatus;
  title: string;
  detail: string;
  by: string;
};

type Message = {
  id: string;
  ts: number;
  by: string;
  role: "You" | "Corporate Admin" | "EVzone Support" | "Vendor" | "System";
  text: string;
  attachments?: Attachment[];
  mirrored?: Array<{ channel: Channel; status: "Queued" | "Sent" | "Delivered" | "Failed"; at: number }>;
};

type Ticket = {
  id: string;
  receiptId: string;
  module: ModuleKey;
  category: IssueCategory;
  severity: Severity;
  summary: string;
  detail: string;
  desiredResolution: "Refund" | "Adjustment" | "Redo" | "Support" | "Other";
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  assignedTo: EscalationTarget;
  escalationPath: EscalationTarget[];
  policyReason: string;
  attachments: Attachment[];
  decisionDeadlineAt?: number;
};

type Policy = {
  allowDirectEVzoneEscalation: boolean;
  allowWhatsAppMirror: boolean;
  allowWeChatMirror: boolean;
  autoSuggestDisputeOnSLABreach: boolean;
  mirrorRequiresConsent: boolean;
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

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForSeverity(s: Severity) {
  if (s === "High") return "bad" as const;
  if (s === "Medium") return "warn" as const;
  return "neutral" as const;
}

function toneForSLA(s: SLAStatus) {
  if (s === "Breached") return "bad" as const;
  if (s === "At risk") return "warn" as const;
  if (s === "On track") return "good" as const;
  return "neutral" as const;
}

function toneForTicketStatus(s: TicketStatus) {
  if (s === "Resolved" || s === "Closed") return "good" as const;
  if (s === "Submitted" || s === "Acknowledged" || s === "In review" || s === "Waiting on vendor" || s === "Proposed resolution") return "warn" as const;
  return "neutral" as const;
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

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <LifeBuoy className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.75c-5.11 0-9.25 4.03-9.25 9 0 1.58.43 3.06 1.19 4.36L2.5 21.25l5.33-1.39c1.28.7 2.75 1.1 4.17 1.1 5.11 0 9.25-4.03 9.25-9s-4.14-9-9.25-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.9c.3-.7.55-.7.96-.7.15 0 .34 0 .52.02.2.01.45.02.68.48.28.56.92 1.93 1 2.07.08.14.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.32.38-.46.51-.15.14-.3.29-.13.57.17.28.76 1.23 1.64 2 1.13.98 2.09 1.29 2.38 1.43.3.14.47.12.64-.07.18-.2.73-.84.92-1.13.2-.29.4-.24.67-.15.28.1 1.74.8 2.04.95.3.14.5.22.57.34.07.12.07.7-.17 1.37-.25.67-1.43 1.28-1.96 1.35-.48.06-1.08.09-1.75-.11-.41-.13-.95-.31-1.65-.61-2.9-1.22-4.79-4.2-4.93-4.4-.13-.2-1.15-1.51-1.15-2.88 0-1.37.72-2.04.97-2.32Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WeChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.7 4.2c-3.6 0-6.5 2.4-6.5 5.3 0 1.6.9 3 2.3 4l-.6 2 2.1-1c.8.2 1.7.4 2.7.4 3.6 0 6.5-2.4 6.5-5.3s-2.-5.4-6.5-5.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M14.6 11.4c-3.3 0-6 2.1-6 4.8 0 2.6 2.7 4.8 6 4.8.8 0 1.6-.1 2.3-.3l1.9.9-.5-1.8c1.1-.9 1.8-2.1 1.8-3.6 0-2.7-2.7-4.8-6-4.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7.2 8.2h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 8.2h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 15.3h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 15.3h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function exportTicketToPrint(ticket: Ticket, receipt: Receipt | null, timeline: TimelineEvent[], messages: Message[]) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  const tl = timeline
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((t) => `<li><b>${escapeHtml(t.status)}</b> • ${escapeHtml(new Date(t.ts).toLocaleString())} • ${escapeHtml(t.detail)}</li>`)
    .join("\n");

  const msg = messages
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((m) => `<li><b>${escapeHtml(m.role)}</b> • ${escapeHtml(new Date(m.ts).toLocaleString())}<br/>${escapeHtml(m.text)}</li>`)
    .join("\n");

  w.document.write(`
    <html>
      <head>
        <title>${escapeHtml(ticket.id)} - Ticket</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          h2{font-size:14px; margin:16px 0 8px;}
          ul{margin:0; padding-left:18px;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">Corporate Support</div>
            <h1 style="margin-top:10px;">Issue Ticket</h1>
            <div class="muted" style="margin-top:6px;">Ticket: ${escapeHtml(ticket.id)} • Status: ${escapeHtml(ticket.status)} • ${escapeHtml(new Date(ticket.createdAt).toLocaleString())}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Assigned to</div>
            <div style="font-weight:800;">${escapeHtml(ticket.assignedTo)}</div>
            <div class="muted" style="margin-top:6px;">Severity: ${escapeHtml(ticket.severity)} • Category: ${escapeHtml(ticket.category)}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Summary</div>
              <div style="font-weight:900;">${escapeHtml(ticket.summary)}</div>
            </div>
          </div>
          <div style="margin-top:10px; color:#334155;">${escapeHtml(ticket.detail)}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Receipt</h2>
          <div class="muted">${receipt ? `${escapeHtml(receipt.module)} • ${escapeHtml(receipt.type)} • ${escapeHtml(receipt.vendor)} • ${escapeHtml(String(receipt.amountUGX))}` : "(not available)"}</div>
          <div class="muted" style="margin-top:6px;">Purpose: ${escapeHtml(receipt?.meta.purpose || "-")} • Cost center: ${escapeHtml(receipt?.meta.costCenter || "-")}</div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Timeline</h2>
          <ul>${tl}</ul>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Conversation</h2>
          <ul>${msg}</ul>
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

export default function UserIssueDisputesSupportU22() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const policy: Policy = useMemo(
    () => ({
      allowDirectEVzoneEscalation: true,
      allowWhatsAppMirror: true,
      allowWeChatMirror: false,
      autoSuggestDisputeOnSLABreach: true,
      mirrorRequiresConsent: true,
    }),
    []
  );

  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);

  const receipts: Receipt[] = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: "RCPT-RIDE-1A2B",
        module: "Rides & Logistics",
        type: "Ride",
        title: "Kampala CBD → Entebbe Airport",
        vendor: "EVzone Rides",
        amountUGX: 240000,
        status: "Completed",
        createdAt: now - 6 * 60 * 60 * 1000,
        sla: { status: "N/A" },
        meta: { purpose: "Airport", costCenter: "OPS-01", stationOrRoute: "Approved route" },
      },
      {
        id: "RCPT-ORD-9C33",
        module: "E-Commerce",
        type: "Order",
        title: "Laptop Bundle (Enterprise)",
        vendor: "EVzone Preferred Tech",
        amountUGX: 2600000,
        status: "In progress",
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        sla: { status: "At risk", dueAt: now + 3 * 60 * 60 * 1000, breachedReason: "Delivery window nearing" },
        meta: { purpose: "Project", costCenter: "SAL-03", orderNo: "ORD-7F21" },
      },
      {
        id: "RCPT-CH-8E11",
        module: "EVs & Charging",
        type: "Charging",
        title: "Charging session",
        vendor: "EVzone Charging Hub",
        amountUGX: 78000,
        status: "Completed",
        createdAt: now - 14 * 60 * 60 * 1000,
        sla: { status: "N/A" },
        meta: { purpose: "Charging", costCenter: "FLEET-01", stationOrRoute: "Kampala Rd 12" },
      },
      {
        id: "RCPT-SVC-3D90",
        module: "Services",
        type: "Service",
        title: "Flight booking assistance",
        vendor: "EVzone Travel Partner",
        amountUGX: 250000,
        status: "Failed",
        createdAt: now - 20 * 60 * 60 * 1000,
        sla: { status: "Breached", dueAt: now - 6 * 60 * 60 * 1000, completedAt: undefined, breachedReason: "Vendor did not confirm within SLA" },
        meta: { purpose: "Travel", costCenter: "SAL-03" },
      },
    ];
  }, []);

  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleKey | "All">("All");

  const filteredReceipts = useMemo(() => {
    const query = q.trim().toLowerCase();
    return receipts
      .filter((r) => (moduleFilter === "All" ? true : r.module === moduleFilter))
      .filter((r) => {
        if (!query) return true;
        const hay = `${r.id} ${r.module} ${r.type} ${r.title} ${r.vendor}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [receipts, q, moduleFilter]);

  const [selectedReceiptId, setSelectedReceiptId] = useState<string>(receipts[0].id);
  const selectedReceipt = useMemo(() => receipts.find((r) => r.id === selectedReceiptId) || receipts[0], [receipts, selectedReceiptId]);

  // Auto-suggest dispute
  const slaSuggest = useMemo(() => {
    const sla = selectedReceipt.sla;
    if (!policy.autoSuggestDisputeOnSLABreach) return null;
    if (!sla || sla.status !== "Breached") return null;
    return {
      title: "SLA breach detected",
      desc: sla.breachedReason || "Vendor SLA breached. You can raise a dispute.",
    };
  }, [selectedReceipt, policy.autoSuggestDisputeOnSLABreach]);

  // Report flow
  const [view, setView] = useState<"report" | "ticket">("report");

  const [category, setCategory] = useState<IssueCategory>("Service not delivered");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [summary, setSummary] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const [desiredResolution, setDesiredResolution] = useState<Ticket["desiredResolution"]>("Support");

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | null, scope: Attachment["scope"]) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now(), scope });
    }
    setAttachments((p) => [...list, ...p].slice(0, 12));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const addAttachmentName = () => {
    const name = prompt("Enter evidence name (example: Photo.jpg)")?.trim();
    if (!name) return;
    setAttachments((p) => [{ id: uid("att"), name, size: 0, type: "manual", ts: Date.now(), scope: "Ticket" as const }, ...p].slice(0, 12));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((p) => p.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Evidence removed.", kind: "info" });
  };

  // Ticket state
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Premium chat mirroring
  const [mirrorWhatsApp, setMirrorWhatsApp] = useState(false);
  const [mirrorWeChat, setMirrorWeChat] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Ticket composer
  const [msgText, setMsgText] = useState("");
  const [msgAttach, setMsgAttach] = useState<Attachment[]>([]);
  const msgFileRef = useRef<HTMLInputElement | null>(null);

  const addMsgFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now(), scope: "Message" });
    }
    setMsgAttach((p) => [...list, ...p].slice(0, 5));
    toast({ title: "Attached", message: `${list.length} file(s) attached to message.`, kind: "success" });
  };

  const removeMsgAttach = (id: string) => setMsgAttach((p) => p.filter((a) => a.id !== id));

  // Policy-based escalation
  const computedEscalation = useMemo(() => {
    const sev = severity;
    const cat = category;

    const path: EscalationTarget[] = [];
    let assigned: EscalationTarget = "Corporate Admin";
    let reason = "Default escalation to Corporate Admin for corporate purchases and audits.";

    // Safety and platform faults go to EVzone support first
    if (cat === "Safety concern") {
      assigned = "EVzone Support";
      path.push("EVzone Support", "Corporate Admin");
      reason = "Safety issues are escalated to EVzone Support immediately, with corporate visibility.";
    } else if (cat === "Payment/CorporatePay") {
      assigned = "Corporate Admin";
      path.push("Corporate Admin", "EVzone Support");
      reason = "Payment and CorporatePay issues route to Corporate Admin first, then EVzone Support if needed.";
    } else if (sev === "High") {
      assigned = policy.allowDirectEVzoneEscalation ? "EVzone Support" : "Corporate Admin";
      path.push(assigned, assigned === "EVzone Support" ? "Corporate Admin" : "EVzone Support");
      reason = "High severity issues escalate faster and may involve EVzone Support depending on org policy.";
    } else {
      path.push("Corporate Admin", "Vendor", "EVzone Support");
      reason = "Most operational disputes start with Corporate Admin and Vendor, then EVzone Support for platform-level issues.";
    }

    // Policy gating: direct EVzone escalation
    if (!policy.allowDirectEVzoneEscalation && assigned === "EVzone Support") {
      assigned = "Corporate Admin";
      reason = "Org policy does not allow direct escalation to EVzone Support. Corporate Admin must escalate.";
      path.length = 0;
      path.push("Corporate Admin", "EVzone Support");
    }

    return { assigned, path, reason };
  }, [category, severity, policy.allowDirectEVzoneEscalation]);

  const ticketDeadline = useMemo(() => {
    // Best-effort: create decision deadline 24h for high severity, 48h for medium, 72h for low
    const hrs = severity === "High" ? 24 : severity === "Medium" ? 48 : 72;
    return Date.now() + hrs * 60 * 60 * 1000;
  }, [severity]);

  const deadlineMs = (ticket?.decisionDeadlineAt || ticketDeadline) - nowTick;

  useEffect(() => {
    // Suggest defaults based on receipt type
    const r = selectedReceipt;
    if (r.type === "Ride") {
      setCategory((p) => (p === "Service not delivered" ? "Ride issue" : p));
    }
    if (r.type === "Charging") {
      setCategory((p) => (p === "Service not delivered" ? "Charging issue" : p));
    }
    if (r.type === "Order") {
      setCategory((p) => (p === "Service not delivered" ? "Damaged item" : p));
    }
    if (r.type === "Service") {
      setCategory((p) => (p === "Damaged item" ? "Service not delivered" : p));
    }

    if (!summary.trim()) {
      setSummary(`${r.type} issue for ${r.vendor}`);
    }

    // If SLA breached, prefill dispute
    if (slaSuggest && policy.autoSuggestDisputeOnSLABreach) {
      setCategory("Service not delivered");
      setSeverity("High");
      setDesiredResolution("Redo");
      setDetail((prev) => prev.trim() ? prev : `SLA breach detected: ${slaSuggest.desc}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReceiptId]);

  const resetReport = () => {
    setView("report");
    setTicket(null);
    setTimeline([]);
    setMessages([]);
    setAttachments([]);
    setMsgAttach([]);
    setMsgText("");
    setMirrorWhatsApp(false);
    setMirrorWeChat(false);
    setConsentGiven(false);
    toast({ title: "Reset", message: "Ready for a new issue report.", kind: "info" });
  };

  const submitTicket = () => {
    if (!summary.trim() || detail.trim().length < 10) {
      toast({ title: "Fix required", message: "Summary and details are required (min 10 characters).", kind: "warn" });
      return;
    }

    // Mirror consent gating
    if (policy.mirrorRequiresConsent && (mirrorWhatsApp || mirrorWeChat) && !consentGiven) {
      toast({ title: "Consent required", message: "Accept consent to mirror chat to external channels.", kind: "warn" });
      return;
    }

    const id = `TCK-${Math.random().toString(16).slice(2, 6).toUpperCase()}${Math.random().toString(16).slice(2, 4).toUpperCase()}`;
    const created = Date.now();

    const t: Ticket = {
      id,
      receiptId: selectedReceipt.id,
      module: selectedReceipt.module,
      category,
      severity,
      summary: summary.trim(),
      detail: detail.trim(),
      desiredResolution,
      status: category === "Safety concern" || severity === "High" ? "Submitted" : "Submitted",
      createdAt: created,
      updatedAt: created,
      assignedTo: computedEscalation.assigned,
      escalationPath: computedEscalation.path,
      policyReason: computedEscalation.reason,
      attachments,
      decisionDeadlineAt: ticketDeadline,
    };

    const baseTimeline: TimelineEvent[] = [
      { id: uid("tl"), ts: created, status: "Submitted", title: "Submitted", detail: `Ticket ${id} submitted from receipt ${selectedReceipt.id}.`, by: "You" },
      { id: uid("tl"), ts: created + 30 * 1000, status: "Acknowledged", title: "Acknowledged", detail: `Assigned to ${t.assignedTo}.`, by: "System" },
    ];

    const baseMessages: Message[] = [
      {
        id: uid("m"),
        ts: created + 20 * 1000,
        by: "System",
        role: "System",
        text: `Ticket created. Assigned to ${t.assignedTo}.`,
      },
      {
        id: uid("m"),
        ts: created + 45 * 1000,
        by: t.assignedTo,
        role: t.assignedTo,
        text: "We have received your issue. Please share any additional evidence if needed.",
      },
    ];

    setTicket(t);
    setTimeline(baseTimeline);
    setMessages(baseMessages);
    setView("ticket");

    toast({ title: "Submitted", message: `Ticket ${id} created.`, kind: "success" });
  };

  const sendMessage = () => {
    if (!ticket) return;
    if (msgText.trim().length < 2 && !msgAttach.length) {
      toast({ title: "Empty", message: "Write a message or attach evidence.", kind: "warn" });
      return;
    }

    const id = uid("m");

    const mirrorLogs: Message["mirrored"] = [];
    const pushMirror = (channel: Channel) => {
      mirrorLogs.push({ channel, status: "Queued", at: Date.now() });
      // Simulate deliver
      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            const next = (m.mirrored || []).map((d) =>
              d.channel === channel && d.status === "Queued" ? { ...d, status: "Sent" as const, at: Date.now() } : d
            );
            return { ...m, mirrored: next };
          })
        );
      }, 450);
      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            const next = (m.mirrored || []).map((d) => {
              if (d.channel !== channel) return d;
              if (d.status !== "Sent") return d;
              return { ...d, status: (Math.random() < 0.9 ? "Delivered" : "Failed") as "Delivered" | "Failed", at: Date.now() };
            });
            return { ...m, mirrored: next };
          })
        );
      }, 1100);
    };

    if (mirrorWhatsApp) pushMirror("WhatsApp");
    if (mirrorWeChat) pushMirror("WeChat");

    // In-app always
    mirrorLogs.push({ channel: "In-app", status: "Delivered", at: Date.now() });

    const msg: Message = {
      id,
      ts: Date.now(),
      by: "You",
      role: "You",
      text: msgText.trim() || "(attachment)",
      attachments: msgAttach.length ? msgAttach : undefined,
      mirrored: mirrorLogs,
    };

    setMessages((prev) => [...prev, msg]);
    setMsgText("");
    setMsgAttach([]);

    // Timeline
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), status: ticket.status, title: "Message sent", detail: "Requester posted an update.", by: "You" },
    ]);

    // Simulate agent response
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid("m"),
          ts: Date.now(),
          by: ticket.assignedTo,
          role: ticket.assignedTo,
          text: "Thanks. We are reviewing and will update you shortly.",
        },
      ]);
      setTimeline((prev) => [
        ...prev,
        { id: uid("tl"), ts: Date.now(), status: "In review", title: "In review", detail: `Case is being reviewed by ${ticket.assignedTo}.`, by: "System" },
      ]);
      setTicket((p) => (p ? { ...p, status: "In review", updatedAt: Date.now() } : p));
    }, 900);

    toast({ title: "Sent", message: "Message posted.", kind: "success" });
  };

  const escalate = (to: EscalationTarget) => {
    if (!ticket) return;

    if (to === "EVzone Support" && !policy.allowDirectEVzoneEscalation) {
      toast({ title: "Blocked", message: "Org policy does not allow direct EVzone escalation.", kind: "warn" });
      return;
    }

    setTicket((p) => (p ? { ...p, assignedTo: to, updatedAt: Date.now() } : p));
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), status: ticket.status, title: "Escalated", detail: `Escalated to ${to}.`, by: "System" },
    ]);
    setMessages((prev) => [
      ...prev,
      {
        id: uid("m"),
        ts: Date.now(),
        by: "System",
        role: "System",
        text: `Escalation applied: ${to} is now assigned.`,
      },
    ]);
    toast({ title: "Escalated", message: `Assigned to ${to}.`, kind: "info" });
  };

  const resolveTicket = () => {
    if (!ticket) return;
    setTicket((p) => (p ? { ...p, status: "Resolved", updatedAt: Date.now() } : p));
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), status: "Resolved", title: "Resolved", detail: "Resolution proposed and marked resolved (demo).", by: ticket.assignedTo },
    ]);
    setMessages((prev) => [
      ...prev,
      { id: uid("m"), ts: Date.now(), by: ticket.assignedTo, role: ticket.assignedTo, text: "We have applied a resolution. Please confirm if this solves your issue." },
    ]);
    toast({ title: "Resolved", message: "Ticket resolved (demo).", kind: "success" });
  };

  const closeTicket = () => {
    if (!ticket) return;
    setTicket((p) => (p ? { ...p, status: "Closed", updatedAt: Date.now() } : p));
    setTimeline((prev) => [
      ...prev,
      { id: uid("tl"), ts: Date.now(), status: "Closed", title: "Closed", detail: "Ticket closed by requester (demo).", by: "You" },
    ]);
    toast({ title: "Closed", message: "Ticket closed.", kind: "info" });
  };

  const deadlineTone = useMemo(() => {
    if (deadlineMs <= 0) return "bad" as const;
    if (deadlineMs <= 6 * 60 * 60 * 1000) return "warn" as const;
    return "info" as const;
  }, [deadlineMs]);

  const canEnableWhatsApp = policy.allowWhatsAppMirror;
  const canEnableWeChat = policy.allowWeChatMirror;

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
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">Issue Reporting, Disputes & Support</div>
                    <Pill label="U22" tone="neutral" />
                    {ticket ? <Pill label={`Ticket ${ticket.id}`} tone={toneForTicketStatus(ticket.status)} /> : <Pill label="Report from receipt" tone="info" />}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Raise issues from receipts, attach evidence, track timelines, and escalate via policy.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`View: ${view === "report" ? "Report" : "Ticket"}`} tone="neutral" />
                    <Pill label={`Module: ${selectedReceipt.module}`} tone="neutral" />
                    <Pill label={`Receipt: ${selectedReceipt.id}`} tone="neutral" />
                    {selectedReceipt.sla?.status ? <Pill label={`SLA: ${selectedReceipt.sla.status}`} tone={toneForSLA(selectedReceipt.sla.status)} /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Notifications", message: "Open U21 Notifications Center (demo).", kind: "info" })}>
                  <Bell className="h-4 w-4" /> Notifications
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 Corporate Receipts (demo).", kind: "info" })}>
                  <FileText className="h-4 w-4" /> Receipts
                </Button>
                <Button variant="outline" onClick={resetReport}>
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
                {ticket ? (
                  <Button
                    variant="outline"
                    onClick={() => exportTicketToPrint(ticket, selectedReceipt, timeline, messages)}
                  >
                    <Download className="h-4 w-4" /> Export
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: receipt picker */}
              <div className="lg:col-span-4 space-y-4">
                <Section
                  title="Select receipt"
                  subtitle="Report issues from a receipt"
                  right={<Pill label={`${filteredReceipts.length}`} tone="neutral" />}
                >
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search receipts"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                      {q ? (
                        <button className="rounded-xl p-1 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-600">Module</div>
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value as any)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      <option value="All">All</option>
                      {(["Rides & Logistics", "E-Commerce", "EVs & Charging", "Services"] as ModuleKey[]).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 space-y-2">
                    {filteredReceipts.map((r) => {
                      const active = r.id === selectedReceiptId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedReceiptId(r.id);
                            toast({ title: "Receipt selected", message: r.id, kind: "info" });
                          }}
                          className={cn(
                            "w-full rounded-3xl border p-4 text-left shadow-sm transition hover:bg-slate-50",
                            active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900 truncate">{r.title}</div>
                                <Pill label={r.type} tone="neutral" />
                                <Pill label={r.module} tone={r.module === "E-Commerce" ? "neutral" : "neutral"} />
                                {r.sla?.status ? <Pill label={`SLA: ${r.sla.status}`} tone={toneForSLA(r.sla.status)} /> : null}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{r.vendor} • {fmtDateTime(r.createdAt)}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill label={formatUGX(r.amountUGX)} tone="neutral" />
                                <Pill label={r.status} tone={r.status === "Failed" ? "bad" : r.status === "In progress" ? "warn" : "neutral"} />
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </button>
                      );
                    })}
                    {!filteredReceipts.length ? <EmptyState title="No receipts" subtitle="Try changing filters." /> : null}
                  </div>
                </Section>

                <Section title="Auto-detection" subtitle="Premium" right={<Pill label="Premium" tone="info" />}>
                  {slaSuggest ? (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-700 ring-1 ring-rose-200">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{slaSuggest.title}</div>
                          <div className="mt-1 text-sm text-slate-700">{slaSuggest.desc}</div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              variant="primary"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setView("report");
                                setCategory("Service not delivered");
                                setSeverity("High");
                                setDesiredResolution("Redo");
                                setSummary(`SLA breach: ${selectedReceipt.title}`);
                                setDetail(`Detected SLA breach: ${selectedReceipt.sla?.breachedReason || "Vendor missed SLA"}. Please investigate and propose resolution.`);
                                toast({ title: "Suggested dispute", message: "Form prefilled.", kind: "success" });
                              }}
                            >
                              <ChevronRight className="h-4 w-4" /> Raise dispute
                            </Button>
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => toast({ title: "SLA", message: "This suggestion is logic-based and improves with vendor SLA data.", kind: "info" })}
                            >
                              <Info className="h-4 w-4" /> Why
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                      No SLA breach detected for the selected receipt.
                    </div>
                  )}
                </Section>
              </div>

              {/* Main: report/ticket */}
              <div className="lg:col-span-8 space-y-4">
                {view === "report" ? (
                  <>
                    <Section
                      title="Report an issue"
                      subtitle="Core: report from receipt, attach evidence, and submit into the support pipeline"
                      right={<Pill label="Core" tone="neutral" />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Category</div>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as IssueCategory)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {([
                              "Wrong amount",
                              "Service not delivered",
                              "Damaged item",
                              "Charging issue",
                              "Ride issue",
                              "Safety concern",
                              "Refund request",
                              "Payment/CorporatePay",
                              "Other",
                            ] as IssueCategory[]).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2 text-xs text-slate-500">Used to route escalation and SLAs.</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Severity</div>
                          <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as Severity)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {(["Low", "Medium", "High"] as Severity[]).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Pill label={severity} tone={toneForSeverity(severity)} />
                            <Pill label={`Assigned: ${computedEscalation.assigned}`} tone="info" />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">Summary</div>
                          <input
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Short summary"
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              summary.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">Details</div>
                          <textarea
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            rows={5}
                            placeholder="Describe what happened (min 10 chars)"
                            className={cn(
                              "mt-2 w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
                              detail.trim().length >= 10 ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                            )}
                          />
                          {detail.trim().length < 10 ? <div className="mt-1 text-xs font-semibold text-amber-700">Add more detail</div> : null}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Desired resolution</div>
                          <select
                            value={desiredResolution}
                            onChange={(e) => setDesiredResolution(e.target.value as any)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {(["Refund", "Adjustment", "Redo", "Support", "Other"] as Ticket["desiredResolution"][]).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2 text-xs text-slate-500">Used to propose a resolution faster.</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Escalation (policy)</div>
                          <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Assigned to</div>
                                <div className="mt-1 text-sm text-slate-700">{computedEscalation.assigned}</div>
                                <div className="mt-2 text-xs text-slate-600">{computedEscalation.reason}</div>
                              </div>
                              <Pill label="Policy" tone="info" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {computedEscalation.path.map((p) => (
                                <Pill key={p} label={p} tone="neutral" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Evidence</div>
                            <div className="mt-1 text-xs text-slate-500">Attach screenshots, PDFs, photos, and documents</div>
                          </div>
                          <Pill label={`${attachments.length} file(s)`} tone={attachments.length ? "info" : "neutral"} />
                        </div>

                        <input
                          ref={fileRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => addFiles(e.target.files, "Ticket")}
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => fileRef.current?.click()}>
                            <Upload className="h-4 w-4" /> Upload
                          </Button>
                          <Button variant="outline" onClick={addAttachmentName}>
                            <Paperclip className="h-4 w-4" /> Add name
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          {attachments.map((a) => (
                            <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{a.type} • {formatBytes(a.size)} • {timeAgo(a.ts)}</div>
                              </div>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                                <Trash2 className="h-4 w-4" /> Remove
                              </Button>
                            </div>
                          ))}
                          {!attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No evidence attached.</div> : null}
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Premium: chat mirroring</div>
                            <div className="mt-1 text-xs text-slate-500">Optional WhatsApp/WeChat mirroring (policy-controlled)</div>
                          </div>
                          <Pill label="Premium" tone="info" />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !canEnableWhatsApp && "opacity-60")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp mirroring
                                </div>
                                <div className="mt-1 text-xs text-slate-600">{canEnableWhatsApp ? "Allowed" : "Disabled by policy"}</div>
                              </div>
                              <button
                                type="button"
                                disabled={!canEnableWhatsApp}
                                className={cn(
                                  "relative h-7 w-12 rounded-full border transition",
                                  mirrorWhatsApp ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                                  !canEnableWhatsApp && "cursor-not-allowed"
                                )}
                                onClick={() => {
                                  if (!canEnableWhatsApp) return;
                                  setMirrorWhatsApp((v) => !v);
                                }}
                                aria-label="Toggle WhatsApp"
                              >
                                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", mirrorWhatsApp ? "left-[22px]" : "left-1")} />
                              </button>
                            </div>
                          </div>

                          <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !canEnableWeChat && "opacity-60")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <WeChatIcon className="h-4 w-4" /> WeChat mirroring
                                </div>
                                <div className="mt-1 text-xs text-slate-600">{canEnableWeChat ? "Allowed" : "Disabled by policy"}</div>
                              </div>
                              <button
                                type="button"
                                disabled={!canEnableWeChat}
                                className={cn(
                                  "relative h-7 w-12 rounded-full border transition",
                                  mirrorWeChat ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                                  !canEnableWeChat && "cursor-not-allowed"
                                )}
                                onClick={() => {
                                  if (!canEnableWeChat) return;
                                  setMirrorWeChat((v) => !v);
                                }}
                                aria-label="Toggle WeChat"
                              >
                                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", mirrorWeChat ? "left-[22px]" : "left-1")} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {policy.mirrorRequiresConsent ? (
                          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <label className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={consentGiven}
                                onChange={(e) => setConsentGiven(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-slate-300"
                              />
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Consent for external mirroring</div>
                                <div className="mt-1 text-xs text-slate-600">
                                  If enabled, messages may be mirrored to external channels and logged for audit.
                                </div>
                              </div>
                            </label>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button variant="primary" onClick={submitTicket}>
                          <ChevronRight className="h-4 w-4" /> Submit ticket
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toast({ title: "Help", message: "Support is available 24/7 for safety and critical issues (demo).", kind: "info" })}
                        >
                          <HelpCircle className="h-4 w-4" /> Help
                        </Button>
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Escalation is policy-based. Corporate Admin and EVzone Support actions are audit logged.
                      </div>
                    </Section>
                  </>
                ) : null}

                {view === "ticket" && ticket ? (
                  <>
                    <Section
                      title="Ticket"
                      subtitle="Core: track status with timeline"
                      right={<Pill label={ticket.status} tone={toneForTicketStatus(ticket.status)} />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoRow label="Ticket" value={ticket.id} />
                        <InfoRow label="Assigned to" value={ticket.assignedTo} />
                        <InfoRow label="Category" value={ticket.category} />
                        <InfoRow label="Severity" value={ticket.severity} emphasize={ticket.severity === "High"} />
                        <InfoRow label="Receipt" value={ticket.receiptId} />
                        <InfoRow label="Module" value={ticket.module} />
                        <InfoRow label="Created" value={fmtDateTime(ticket.createdAt)} />
                        <InfoRow label="Updated" value={fmtDateTime(ticket.updatedAt)} />
                      </div>

                      <div className={cn(
                        "mt-4 rounded-3xl border p-4",
                        deadlineTone === "bad" ? "border-rose-200 bg-rose-50" : deadlineTone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label="Decision deadline" tone={deadlineTone === "bad" ? "bad" : deadlineTone === "warn" ? "warn" : "info"} />
                              <div className="text-sm font-semibold text-slate-900">{deadlineMs <= 0 ? "Deadline passed" : `Due in ${msToFriendly(deadlineMs)}`}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-600">{fmtDateTime(ticket.decisionDeadlineAt || ticketDeadline)} • Premium: reminders via U21 digests and channels</div>
                          </div>
                          <div className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            deadlineTone === "bad" ? "bg-rose-50 text-rose-700" : deadlineTone === "warn" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-700"
                          )}>
                            <Timer className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Escalation path</div>
                            <div className="mt-1 text-xs text-slate-500">Policy: {ticket.policyReason}</div>
                          </div>
                          <Pill label="Policy" tone="info" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ticket.escalationPath.map((p) => (
                            <Pill key={p} label={p} tone="neutral" />
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => escalate("Corporate Admin")}>
                            <Building2 className="h-4 w-4" /> Escalate to corporate
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => escalate("EVzone Support")}
                            disabled={!policy.allowDirectEVzoneEscalation}
                            title={!policy.allowDirectEVzoneEscalation ? "Disabled by policy" : ""}
                          >
                            <ShieldCheck className="h-4 w-4" /> Escalate to EVzone
                          </Button>
                          <Button variant="outline" onClick={() => escalate("Vendor")}>
                            <MessageSquare className="h-4 w-4" /> Escalate to vendor
                          </Button>
                        </div>
                      </div>
                    </Section>

                    <Section
                      title="Timeline"
                      subtitle="Track status changes"
                      right={<Pill label={`${timeline.length} events`} tone="neutral" />}
                    >
                      <div className="space-y-2">
                        {timeline
                          .slice()
                          .sort((a, b) => b.ts - a.ts)
                          .map((t) => (
                            <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={t.status} tone={toneForTicketStatus(t.status)} />
                                    <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{fmtDateTime(t.ts)} • {timeAgo(t.ts)} • {t.by}</div>
                                  <div className="mt-2 text-sm text-slate-700">{t.detail}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </Section>

                    <Section
                      title="Chat"
                      subtitle="Premium: in-app chat with optional WhatsApp/WeChat mirroring"
                      right={<Pill label="Premium" tone="info" />}
                    >
                      <div className="space-y-2">
                        {messages
                          .slice()
                          .sort((a, b) => a.ts - b.ts)
                          .map((m) => (
                            <div key={m.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill
                                      label={m.role}
                                      tone={m.role === "You" ? "good" : m.role === "EVzone Support" ? "info" : m.role === "Corporate Admin" ? "neutral" : m.role === "Vendor" ? "warn" : "neutral"}
                                    />
                                    <div className="text-sm font-semibold text-slate-900">{m.by}</div>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{fmtDateTime(m.ts)} • {timeAgo(m.ts)}</div>
                                  <div className="mt-2 text-sm text-slate-700">{m.text}</div>

                                  {m.attachments?.length ? (
                                    <div className="mt-3 space-y-2">
                                      {m.attachments.map((a) => (
                                        <div key={a.id} className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                          <div className="font-semibold text-slate-900">{a.name}</div>
                                          <div className="mt-1 text-slate-500">{a.type} • {formatBytes(a.size)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}

                                  {m.mirrored?.length ? (
                                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Pill label="Delivery" tone="neutral" />
                                        {m.mirrored.map((d) => (
                                          <Pill
                                            key={`${m.id}-${d.channel}`}
                                            label={`${d.channel}: ${d.status}`}
                                            tone={d.status === "Delivered" ? "good" : d.status === "Failed" ? "bad" : d.status === "Sent" ? "info" : "neutral"}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                <button
                                  className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(m.text);
                                      toast({ title: "Copied", message: "Message copied.", kind: "success" });
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

                        {!messages.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">No messages yet.</div> : null}
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Send a message</div>
                            <div className="mt-1 text-xs text-slate-500">In-app chat is always available. External mirroring is policy-controlled.</div>
                          </div>
                          <Pill label={`${msgAttach.length} attachment(s)`} tone={msgAttach.length ? "info" : "neutral"} />
                        </div>

                        <textarea
                          value={msgText}
                          onChange={(e) => setMsgText(e.target.value)}
                          rows={4}
                          placeholder="Write your message"
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                        />

                        <input
                          ref={msgFileRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => addMsgFiles(e.target.files)}
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => msgFileRef.current?.click()}>
                            <Upload className="h-4 w-4" /> Attach
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const name = prompt("Attachment name (optional)")?.trim();
                              if (!name) return;
                              setMsgAttach((p) => [{ id: uid("att"), name, size: 0, type: "manual", ts: Date.now(), scope: "Message" as const }, ...p].slice(0, 5));
                              toast({ title: "Attached", message: name, kind: "success" });
                            }}
                          >
                            <Paperclip className="h-4 w-4" /> Add name
                          </Button>

                          <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Pill label={mirrorWhatsApp ? "WhatsApp on" : "WhatsApp off"} tone={mirrorWhatsApp ? "good" : "neutral"} />
                            <Pill label={mirrorWeChat ? "WeChat on" : "WeChat off"} tone={mirrorWeChat ? "good" : "neutral"} />
                          </div>
                        </div>

                        {msgAttach.length ? (
                          <div className="mt-3 space-y-2">
                            {msgAttach.map((a) => (
                              <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                                  <div className="mt-1 text-xs text-slate-500">{a.type} • {formatBytes(a.size)}</div>
                                </div>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeMsgAttach(a.id)}>
                                  <X className="h-4 w-4" /> Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="primary" onClick={sendMessage}>
                            <Send className="h-4 w-4" /> Send
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setMsgText("");
                              setMsgAttach([]);
                              toast({ title: "Cleared", message: "Draft cleared.", kind: "info" });
                            }}
                          >
                            <RefreshCcw className="h-4 w-4" /> Clear
                          </Button>
                          <Button variant="outline" onClick={resolveTicket}>
                            <BadgeCheck className="h-4 w-4" /> Mark resolved
                          </Button>
                          <Button variant="outline" onClick={closeTicket} disabled={ticket.status !== "Resolved"} title={ticket.status !== "Resolved" ? "Resolve first" : ""}>
                            <ChevronRight className="h-4 w-4" /> Close
                          </Button>
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: chat can mirror to WhatsApp/WeChat when allowed by policy and consented.
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U22 Issue Reporting, Disputes & Support. Core: report from receipt, attach evidence, track ticket timeline, escalate to Corporate Admin or EVzone Support by policy. Premium: SLA breach suggestions and in-app chat with optional WhatsApp/WeChat mirroring.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-amber-900")}>{value}</div>
    </div>
  );
}
