import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CreditCard,
  FileText,
  Info,
  MessageSquare,
  Phone,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
  Wallet,
  WifiOff,
  X,
  Users,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type EnforcementState = "Deposit depleted" | "Credit limit exceeded" | "Billing delinquency";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type TransactionContext = {
  orgName: string;
  module: "Rides & Logistics" | "E-Commerce" | "EVs & Charging" | "Other";
  amountUGX: number;
  summary: string;
  createdAt: number;
};

type AdminContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  whatsapp: string;
};

type QueuedItem = {
  id: string;
  createdAt: number;
  title: string;
  module: TransactionContext["module"];
  amountUGX: number;
  note: string;
  attachmentName?: string;
  status: "Queued locally" | "Synced" | "Failed";
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
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
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

function formatStatusTitle(state: EnforcementState) {
  if (state === "Deposit depleted") return "CorporatePay disabled";
  if (state === "Credit limit exceeded") return "CorporatePay paused";
  return "CorporatePay suspended";
}

function formatStatusBody(state: EnforcementState, graceEnabled: boolean, graceMsRemaining: number) {
  if (state === "Deposit depleted") {
    return "Your organization prepaid deposit is depleted. CorporatePay is a hard stop until your admin tops up.";
  }

  if (state === "Credit limit exceeded") {
    return "Your organization credit limit is exceeded. CorporatePay is paused until repayment or admin adjustment.";
  }

  // Billing delinquency
  if (graceEnabled && graceMsRemaining > 0) {
    return `Your organization is past due, but a grace window is active. CorporatePay may continue until grace ends.`;
  }

  return "Your organization has billing delinquency. CorporatePay is suspended until outstanding invoices are resolved.";
}

function severityForState(state: EnforcementState, graceEnabled: boolean, graceMsRemaining: number) {
  if (state === "Deposit depleted") return "bad" as const;
  if (state === "Credit limit exceeded") return "warn" as const;
  if (graceEnabled && graceMsRemaining > 0) return "warn" as const;
  return "bad" as const;
}

export default function UserCorporatePayEnforcementU14() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const [state, setState] = useState<EnforcementState>("Deposit depleted");

  // Premium: grace window
  const [graceEnabled, setGraceEnabled] = useState<boolean>(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 6 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const graceMsRemaining = graceEndAt - nowTick;

  // Premium: offline-friendly queue
  const [policyAllowsQueue, setPolicyAllowsQueue] = useState<boolean>(true);

  const tx: TransactionContext = useMemo(
    () => ({
      orgName: "Acme Group Ltd",
      module: "Rides & Logistics",
      amountUGX: 280000,
      summary: "Premium ride: Office to Airport",
      createdAt: Date.now() - 18 * 60 * 1000,
    }),
    []
  );

  const admin: AdminContact = useMemo(
    () => ({
      name: "Finance Desk",
      role: "Accountant",
      email: "finance@acme.com",
      phone: "+256 700 000 000",
      whatsapp: "+256 700 000 000",
    }),
    []
  );

  const statusTitle = formatStatusTitle(state);
  const statusBody = formatStatusBody(state, graceEnabled && state === "Billing delinquency", graceMsRemaining);
  const statusTone = severityForState(state, graceEnabled && state === "Billing delinquency", graceMsRemaining);

  const showGrace = state === "Billing delinquency" && graceEnabled;
  const graceActive = showGrace && graceMsRemaining > 0;

  const hardStop = state === "Deposit depleted";

  // Queue state
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueDraft, setQueueDraft] = useState<{ title: string; note: string; attachmentName: string }>(() => ({
    title: tx.summary,
    note: "",
    attachmentName: "",
  }));

  const [contactOpen, setContactOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const canQueue = useMemo(() => {
    // Only allow queue when policy allows AND (offline or enforcement blocks corporate)
    return policyAllowsQueue && (!isOnline || state !== "Billing delinquency" || !graceActive);
  }, [policyAllowsQueue, isOnline, state, graceActive]);

  const queueHelp = useMemo(() => {
    if (!policyAllowsQueue) return "Queuing is disabled by your organization policy.";
    if (isOnline) return "Queue creates a local draft and submits when service is restored.";
    return "You are offline. The request will be queued locally and sent when back online.";
  }, [policyAllowsQueue, isOnline]);

  const createQueued = () => {
    if (queueDraft.title.trim().length < 4) {
      toast({ title: "Title required", message: "Add a clearer title.", kind: "warn" });
      return;
    }

    const item: QueuedItem = {
      id: `Q-${Math.random().toString(16).slice(2, 7).toUpperCase()}`,
      createdAt: Date.now(),
      title: queueDraft.title.trim(),
      module: tx.module,
      amountUGX: tx.amountUGX,
      note: queueDraft.note.trim(),
      attachmentName: queueDraft.attachmentName.trim() || undefined,
      status: "Queued locally",
    };

    setQueue((p) => [item, ...p]);
    toast({ title: "Queued", message: `${item.id} saved locally.`, kind: "success" });
    setQueueOpen(false);

    // Simulate sync when online
    if (isOnline) {
      window.setTimeout(() => {
        setQueue((p) => p.map((x) => (x.id === item.id ? { ...x, status: Math.random() < 0.9 ? "Synced" : "Failed" } : x)));
      }, 900);
    }
  };

  const retrySync = (id: string) => {
    if (!isOnline) {
      toast({ title: "Offline", message: "Connect to the internet to retry sync.", kind: "warn" });
      return;
    }
    setQueue((p) => p.map((x) => (x.id === id ? { ...x, status: "Queued locally" } : x)));
    window.setTimeout(() => {
      setQueue((p) => p.map((x) => (x.id === id ? { ...x, status: Math.random() < 0.9 ? "Synced" : "Failed" } : x)));
    }, 900);
    toast({ title: "Retry", message: "Retrying sync.", kind: "info" });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: label, kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const goPersonal = () => {
    toast({ title: "Personal payment", message: "Switching to personal payment method (U7).", kind: "info" });
  };

  const viewStatus = () => {
    toast({ title: "Corporate status", message: "Opening Corporate Limits & Funding (U4).", kind: "info" });
  };

  const refresh = () => {
    toast({ title: "Re-check", message: "Refreshing CorporatePay status.", kind: "info" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Offline banner */}
      {!isOnline ? (
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" /> Offline. Some actions will be queued.
            </div>
            <button className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold hover:bg-white" onClick={() => setQueueOpen(true)} disabled={!canQueue}>
              Queue
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">CorporatePay enforcement</div>
                  <div className="mt-1 text-xs text-slate-500">Professional messages when CorporatePay is paused for finance reasons, with safe fallbacks.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${tx.orgName}`} tone="neutral" />
                    <Pill label={`Module: ${tx.module}`} tone="neutral" />
                    <Pill label={`Attempt: ${formatUGX(tx.amountUGX)}`} tone="neutral" />
                    <Pill label={isOnline ? "Online" : "Offline"} tone={isOnline ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to payment selector (U7).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Back
                </Button>
                <Button variant="outline" onClick={refresh}>
                  <RefreshCcw className="h-4 w-4" /> Re-check
                </Button>
                <Button variant="outline" onClick={() => setWhyOpen(true)}>
                  <Info className="h-4 w-4" /> Why
                </Button>
              </div>
            </div>

            {/* Demo state selector */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="text-xs font-semibold text-slate-600">Enforcement state</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["Deposit depleted", "Credit limit exceeded", "Billing delinquency"] as EnforcementState[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        state === s ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={state === s ? { background: EVZ.green } : undefined}
                      onClick={() => setState(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-500">In production, state comes from CorporatePay enforcement engine.</div>
              </div>
              <div className="md:col-span-5">
                <div className="grid grid-cols-1 gap-2">
                  <Toggle
                    enabled={graceEnabled}
                    onChange={setGraceEnabled}
                    label="Premium: grace window"
                    description="Only relevant for billing delinquency"
                  />
                  <Toggle
                    enabled={policyAllowsQueue}
                    onChange={setPolicyAllowsQueue}
                    label="Premium: offline-friendly queue"
                    description="Allow queue for later approval if policy permits"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title={statusTitle}
                  subtitle={statusBody}
                  right={<Pill label={state} tone={statusTone} />}
                >
                  <div className={cn(
                    "rounded-3xl border p-4",
                    statusTone === "warn" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{tx.summary}</div>
                        <div className="mt-1 text-sm text-slate-700">Attempted {timeAgo(tx.createdAt)}.</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill label={`Module: ${tx.module}`} tone="neutral" />
                          <Pill label={`Amount: ${formatUGX(tx.amountUGX)}`} tone="neutral" />
                          {hardStop ? <Pill label="Hard stop" tone="bad" /> : <Pill label="Temporary" tone="warn" />}
                        </div>
                      </div>
                      <div className={cn(
                        "grid h-11 w-11 place-items-center rounded-2xl",
                        statusTone === "warn" ? "bg-amber-100 text-amber-900" : statusTone === "bad" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {statusTone === "bad" ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                    </div>

                    {/* Grace window */}
                    {showGrace ? (
                      <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm text-slate-800 ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Grace window</div>
                            <div className="mt-1 text-sm text-slate-700">
                              {graceActive ? (
                                <>Grace ends in <span className="font-semibold">{msToFriendly(graceMsRemaining)}</span>.</>
                              ) : (
                                <>Grace window ended. CorporatePay is now suspended.</>
                              )}
                            </div>
                          </div>
                          <Pill label={graceActive ? "Active" : "Ended"} tone={graceActive ? "warn" : "bad"} />
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Premium: organizations can configure grace windows per billing agreement.
                        </div>
                      </div>
                    ) : null}

                    {/* Recommended actions */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <ActionCard
                        icon={<CreditCard className="h-5 w-5" />}
                        title="Pay personally"
                        desc="Use personal wallet, card, or mobile money to proceed now."
                        primary
                        onClick={goPersonal}
                      />
                      <ActionCard
                        icon={<Users className="h-5 w-5" />}
                        title="Contact admin"
                        desc="Notify your organization admin to restore CorporatePay."
                        onClick={() => setContactOpen(true)}
                      />
                      <ActionCard
                        icon={<Wallet className="h-5 w-5" />}
                        title="View corporate status"
                        desc="See caps and funding state without sensitive details."
                        onClick={viewStatus}
                      />
                    </div>

                    {/* Offline-friendly queue */}
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Offline-friendly fallback</div>
                          <div className="mt-1 text-xs text-slate-600">{queueHelp}</div>
                        </div>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setQueueOpen(true)} disabled={!canQueue} title={!canQueue ? "Queue not allowed" : "Queue"}>
                          <Upload className="h-4 w-4" /> Queue
                        </Button>
                      </div>
                      {!policyAllowsQueue ? (
                        <div className="mt-2 text-xs font-semibold text-amber-700">Disabled by policy.</div>
                      ) : null}
                    </div>
                  </div>
                </Section>

                <Section title="Queued requests" subtitle="Premium: drafts queued for later approval" right={<Pill label={`${queue.length}`} tone={queue.length ? "info" : "neutral"} />}>
                  <div className="space-y-2">
                    {queue.map((q) => (
                      <div key={q.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={q.status} tone={q.status === "Synced" ? "good" : q.status === "Failed" ? "bad" : "neutral"} />
                              <Pill label={q.module} tone="neutral" />
                              <Pill label={formatUGX(q.amountUGX)} tone="neutral" />
                              <Pill label={q.id} tone="neutral" />
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{q.title}</div>
                            <div className="mt-1 text-xs text-slate-500">Queued {timeAgo(q.createdAt)}{q.attachmentName ? ` • Attachment: ${q.attachmentName}` : ""}</div>
                            {q.note ? <div className="mt-2 text-sm text-slate-700">{q.note}</div> : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => copyText(q.id, "Queued id copied")}
                              title="Copy id">
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                            {q.status === "Failed" ? (
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => retrySync(q.id)}>
                                <RefreshCcw className="h-4 w-4" /> Retry
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!queue.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No queued requests</div>
                        <div className="mt-1 text-sm text-slate-600">Queue a request when offline or when CorporatePay is unavailable.</div>
                      </div>
                    ) : null}
                  </div>
                </Section>
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="What this means" subtitle="Clear, audit-friendly explanation" right={<Pill label="Core" tone="neutral" />}>
                  <div className="space-y-2">
                    <MiniExplain
                      icon={<Building2 className="h-4 w-4" />}
                      title="CorporatePay is controlled by your organization"
                      desc="Admins control funding models, credit limits, prepaid deposits, and billing compliance."
                    />
                    <MiniExplain
                      icon={<ShieldCheck className="h-4 w-4" />}
                      title="Policy and audit first"
                      desc="Every enforcement decision is logged and can be explained in CorporatePay Admin Console."
                    />
                    <MiniExplain
                      icon={<Wallet className="h-4 w-4" />}
                      title="Personal payment is always a safe fallback"
                      desc="You can complete urgent transactions personally if allowed by your organization."
                    />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    If the transaction is urgent and CorporatePay is blocked, use personal payment or queue for later.
                  </div>
                </Section>

                <Section title="Recommended by state" subtitle="Best next steps" right={<Pill label="Premium" tone="info" />}>
                  <div className="space-y-2">
                    {state === "Deposit depleted" ? (
                      <>
                        <RecoRow title="Ask admin to top up prepaid deposit" desc="CorporatePay resumes after deposit is funded." />
                        <RecoRow title="Switch to personal payment" desc="Use personal methods for urgent needs." />
                        <RecoRow title="Queue requests" desc="Queue and submit later if policy permits." />
                      </>
                    ) : state === "Credit limit exceeded" ? (
                      <>
                        <RecoRow title="Wait for repayment or limit adjustment" desc="Credit becomes available after settlement." />
                        <RecoRow title="Ask admin to switch to wallet model" desc="Wallet pay-as-you-go can restore service." />
                        <RecoRow title="Pay personally" desc="Proceed without corporate funding." />
                      </>
                    ) : (
                      <>
                        <RecoRow title="Resolve overdue invoices" desc="Admins should pay outstanding invoices to remove suspension." />
                        <RecoRow title={graceActive ? "Grace window active" : "No grace window"} desc={graceActive ? `Grace ends in ${msToFriendly(graceMsRemaining)}.` : "CorporatePay is suspended until resolved."} />
                        <RecoRow title="Contact finance admin" desc="Ask them to confirm payment status and timeline." />
                      </>
                    )}
                  </div>
                </Section>

                <Section title="Quick links" subtitle="Common next screens" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => toast({ title: "Limits", message: "Open U4 (demo).", kind: "info" })}>
                      <Wallet className="h-4 w-4" /> Limits
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open U3 (demo).", kind: "info" })}>
                      <ShieldCheck className="h-4 w-4" /> Policies
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Requests", message: "Open U5 (demo).", kind: "info" })}>
                      <FileText className="h-4 w-4" /> My Requests
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 (demo).", kind: "info" })}>
                      <Wallet className="h-4 w-4" /> Receipts
                    </Button>
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={state} tone={statusTone} />
                  <Pill label={isOnline ? "Online" : "Offline"} tone={isOnline ? "good" : "warn"} />
                  {showGrace ? <Pill label={graceActive ? `Grace: ${msToFriendly(graceMsRemaining)}` : "Grace ended"} tone={graceActive ? "warn" : "bad"} /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setContactOpen(true)}>
                    <Phone className="h-4 w-4" /> Contact admin
                  </Button>
                  <Button variant="outline" onClick={goPersonal}>
                    <CreditCard className="h-4 w-4" /> Pay personally
                  </Button>
                  <Button variant={canQueue ? "primary" : "outline"} onClick={() => setQueueOpen(true)} disabled={!canQueue}>
                    <Upload className="h-4 w-4" /> Queue
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U14 CorporatePay Disabled and Enforcement Screens. Core: deposit depleted, credit exceeded, billing delinquency. Fallback: pay personally, contact admin, view corporate status. Premium: grace window and offline queue.
            </div>
          </div>
        </div>
      </div>

      {/* Queue modal */}
      <Modal
        open={queueOpen}
        title="Queue request for later"
        subtitle="Premium: offline-friendly fallback when policy allows"
        onClose={() => setQueueOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setQueueOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createQueued} disabled={!policyAllowsQueue}>
              <Upload className="h-4 w-4" /> Queue
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`Org: ${tx.orgName}`} tone="neutral" />
              <Pill label={`Module: ${tx.module}`} tone="neutral" />
              <Pill label={`Amount: ${formatUGX(tx.amountUGX)}`} tone="neutral" />
              <Pill label={isOnline ? "Online" : "Offline"} tone={isOnline ? "good" : "warn"} />
            </div>
            <div className="mt-3 text-sm text-slate-700">Queued requests are stored locally and synced when possible.</div>
          </div>

          {!policyAllowsQueue ? (
            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Queuing is disabled by policy.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Title</div>
              <input
                value={queueDraft.title}
                onChange={(e) => setQueueDraft((p) => ({ ...p, title: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Short title"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Attachment name (optional)</div>
              <input
                value={queueDraft.attachmentName}
                onChange={(e) => setQueueDraft((p) => ({ ...p, attachmentName: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Example: Quotation.pdf"
              />
              <div className="mt-2 text-xs text-slate-500">In production, this is file upload.</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Note</div>
            <textarea
              value={queueDraft.note}
              onChange={(e) => setQueueDraft((p) => ({ ...p, note: e.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Why should this be queued?"
            />
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            When synced, your queued request becomes a normal approval request visible in My Requests (U5).
          </div>
        </div>
      </Modal>

      {/* Contact admin modal */}
      <Modal
        open={contactOpen}
        title="Contact organization admin"
        subtitle="Use approved channels to restore CorporatePay"
        onClose={() => setContactOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setContactOpen(false)}>Close</Button>
          </div>
        }
        maxW="820px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{admin.name}</div>
                <div className="mt-1 text-sm text-slate-600">Role: {admin.role}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill label={admin.email} tone="neutral" />
                  <Pill label={admin.phone} tone="neutral" />
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => copyText(admin.email, "Email copied")}> <Copy className="h-4 w-4" /> Copy email</Button>
              <Button variant="outline" onClick={() => copyText(admin.whatsapp, "WhatsApp number copied")}> <Copy className="h-4 w-4" /> Copy WhatsApp</Button>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              Suggested message: "CorporatePay is unavailable due to {state}. Please restore funding/compliance or advise timeline."
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Your organization may restrict direct contact. If restricted, use in-app support ticket.
          </div>
        </div>
      </Modal>

      {/* Why modal */}
      <Modal
        open={whyOpen}
        title="Why you are seeing this"
        subtitle="Audit-friendly explanation"
        onClose={() => setWhyOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setWhyOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setWhyOpen(false); viewStatus(); }}>
              <ChevronRight className="h-4 w-4" /> View status
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`State: ${state}`} tone={statusTone} />
              <Pill label={`Org: ${tx.orgName}`} tone="neutral" />
              <Pill label={`Module: ${tx.module}`} tone="neutral" />
              <Pill label={`Amount: ${formatUGX(tx.amountUGX)}`} tone="neutral" />
              <Pill label="Audit linked" tone="info" />
            </div>
            <div className="mt-3 text-sm text-slate-700">
              CorporatePay enforcement protects organizations from unpaid invoices, depleted deposits, and exceeded credit limits. This decision is visible to org admins.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">What you can do now</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {[
                "Pay personally to proceed immediately.",
                "Contact your admin to restore funding or compliance.",
                "Queue a request for later approval if policy permits.",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Some organizations allow a grace window for billing delinquency. That window is shown when active.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-3xl border p-4 text-left shadow-sm transition",
        primary ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-50/70" : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", primary ? "bg-white text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-50 text-slate-700")}>
              {icon}
            </div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
          </div>
          <div className="mt-2 text-sm text-slate-600">{desc}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  );
}

function MiniExplain({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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

function RecoRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}
