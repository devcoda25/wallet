import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  Info,
  Lock,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Currency = "UGX" | "USD" | "CNY" | "KES";

type ContextStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Context =
  | { id: "personal"; kind: "personal"; label: "Personal Wallet"; status: ContextStatus; role: "Owner"; availableByCurrency: Record<Currency, number>; tier: 1 | 2 | 3 }
  | { id: string; kind: "org"; label: string; status: ContextStatus; role: "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner"; availableByCurrency: Record<Currency, number>; approvalsRequired: boolean; policyNote: string };

type MethodKey =
  | "Personal Wallet"
  | "Organization Wallet"
  | "Card"
  | "Bank Transfer"
  | "Mobile Money"
  | "WeChat Pay"
  | "Alipay"
  | "UnionPay";

type Method = {
  key: MethodKey;
  label: string;
  description: string;
  eta: string;
  feeHint: string;
  railsTag?: string;
  icon: React.ReactNode;
  eligible: boolean;
  eligibleHint: string;
  requiresApproval?: boolean;
  policyBanner?: string;
  recommendedScore: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatMoney(amount: number, currency: Currency) {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>
  );
}

function toneForStatus(s: ContextStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Needs verification") return "warn" as const;
  if (s === "Deposit depleted") return "warn" as const;
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
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
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
                {t.kind === "warn" || t.kind === "error" ? <AlertTriangle className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
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
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
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
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function MethodCard({ m, selected, onSelect }: { m: Method; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-3xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50",
        selected ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200",
        !m.eligible && "opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
            {m.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{m.label}</div>
              {m.railsTag ? <Pill label={m.railsTag} tone="info" /> : null}
              {m.requiresApproval ? <Pill label="Approval" tone="warn" /> : null}
              {m.recommendedScore >= 90 ? <Pill label="Recommended" tone="good" /> : null}
            </div>
            <div className="mt-1 text-sm text-slate-600">{m.description}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>ETA {m.eta}</span>
              <span>•</span>
              <span>{m.feeHint}</span>
            </div>
          </div>
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-2xl", m.eligible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
          {m.eligible ? <Check className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
      </div>

      {!m.eligible ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Not available</div>
              <div className="mt-1 text-xs text-amber-800">{m.eligibleHint}</div>
            </div>
          </div>
        </div>
      ) : m.policyBanner ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" />
            <div>{m.policyBanner}</div>
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default function PaymentMethodSelector() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const contexts = useMemo<Context[]>(
    () => [
      {
        id: "personal",
        kind: "personal",
        label: "Personal Wallet",
        status: "Active",
        role: "Owner",
        tier: 1,
        availableByCurrency: { UGX: 1250000, USD: 180.5, CNY: 820, KES: 56300 },
      },
      {
        id: "org_acme",
        kind: "org",
        label: "Acme Group Ltd",
        status: "Active",
        role: "Approver",
        approvalsRequired: true,
        policyNote: "Approvals required above threshold. Policy reasons shown in drawer.",
        availableByCurrency: { UGX: 9800000, USD: 0, CNY: 0, KES: 0 },
      },
      {
        id: "org_khl",
        kind: "org",
        label: "Kampala Holdings",
        status: "Deposit depleted",
        role: "Member",
        approvalsRequired: false,
        policyNote: "Deposit depleted. Organization wallet is paused.",
        availableByCurrency: { UGX: 0, USD: 0, CNY: 0, KES: 0 },
      },
    ],
    []
  );

  const [contextId, setContextId] = useState<string>("personal");
  const ctx = useMemo(() => contexts.find((c) => c.id === contextId) || contexts[0], [contexts, contextId]);

  // Checkout context
  const [module, setModule] = useState("E-Commerce");
  const [amountStr, setAmountStr] = useState("180000");
  const [currency, setCurrency] = useState<Currency>("UGX");

  const amount = useMemo(() => {
    const n = Number(amountStr.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const isChinaCurrency = currency === "CNY";

  const orgAccessAllowed = useMemo(() => {
    if (ctx.kind !== "org") return true;
    return ["Approver", "Finance", "Admin", "Owner"].includes(ctx.role);
  }, [ctx]);

  const orgBlockedReason = useMemo(() => {
    if (ctx.kind !== "org") return null;
    if (!orgAccessAllowed) return "You do not have permission. Request corporate access.";
    if (ctx.status === "Deposit depleted") return "Deposit depleted. Top up organization wallet or use personal methods.";
    if (ctx.status === "Suspended") return "Organization wallet suspended by policy.";
    if (ctx.status === "Needs verification") return "Organization verification required.";
    return null;
  }, [ctx, orgAccessAllowed]);

  const methods = useMemo<Method[]>(() => {
    const personal = contexts.find((c) => c.id === "personal") as Extract<Context, { kind: "personal" }>;

    const personalBalance = personal.availableByCurrency[currency] ?? 0;
    const orgBalance = ctx.availableByCurrency[currency] ?? 0;

    const mPersonalWallet: Method = {
      key: "Personal Wallet",
      label: "Personal Wallet",
      description: "Pay using your wallet balance",
      eta: "Instant",
      feeHint: "Fee: low",
      railsTag: "Wallet",
      icon: <WalletIcon className="h-5 w-5" />,
      eligible: personalBalance >= amount && personal.status === "Active",
      eligibleHint: personalBalance >= amount ? "Personal wallet is available" : "Insufficient personal wallet balance",
      recommendedScore: personalBalance >= amount ? 95 : 40,
      policyBanner: `Available: ${formatMoney(personalBalance, currency)}`,
    };

    const mOrgWallet: Method = {
      key: "Organization Wallet",
      label: "Organization Wallet",
      description: "Pay using organization funding and policies",
      eta: ctx.kind === "org" && ctx.approvalsRequired ? "Approval flow" : "Instant",
      feeHint: "Fee: none",
      railsTag: "Corporate",
      icon: <Building2 className="h-5 w-5" />,
      eligible: ctx.kind === "org" && orgAccessAllowed && ctx.status === "Active" && orgBalance >= amount,
      eligibleHint: orgBlockedReason ?? (orgBalance >= amount ? "Organization wallet is available" : "Insufficient organization balance"),
      requiresApproval: ctx.kind === "org" ? ctx.approvalsRequired : false,
      recommendedScore: ctx.kind === "org" && orgAccessAllowed && ctx.status === "Active" && orgBalance >= amount ? 92 : 30,
      policyBanner: ctx.kind === "org" ? `${ctx.policyNote} • Available: ${formatMoney(orgBalance, currency)}` : "Switch to an org context to use this method",
    };

    const mCard: Method = {
      key: "Card",
      label: "Card",
      description: "Visa, Mastercard, local cards",
      eta: "Instant to 5 minutes",
      feeHint: "Fee: about 1.9%",
      icon: <CreditCard className="h-5 w-5" />,
      eligible: true,
      eligibleHint: "Available",
      recommendedScore: 80,
      policyBanner: "High value payments may require step-up verification.",
    };

    const mBank: Method = {
      key: "Bank Transfer",
      label: "Bank Transfer",
      description: "Lower fees for large payments",
      eta: "1 to 2 hours",
      feeHint: "Fee: low",
      icon: <Banknote className="h-5 w-5" />,
      eligible: true,
      eligibleHint: "Available",
      recommendedScore: amount >= 300000 ? 88 : 70,
      policyBanner: "Use a unique reference for auto matching.",
    };

    const mMoMo: Method = {
      key: "Mobile Money",
      label: "Mobile Money",
      description: "Fast UGX payments",
      eta: "Instant",
      feeHint: "Fee: about 1.2%",
      icon: <WalletIcon className="h-5 w-5" />,
      eligible: currency === "UGX",
      eligibleHint: currency === "UGX" ? "Available for UGX" : "Switch to UGX to use mobile money",
      recommendedScore: currency === "UGX" ? 85 : 10,
      policyBanner: "You will receive a mobile prompt to confirm.",
    };

    const mWeChat: Method = {
      key: "WeChat Pay",
      label: "WeChat Pay",
      description: "QR or in-app flow",
      eta: "Instant to 5 minutes",
      feeHint: "Fee varies",
      railsTag: "China rails",
      icon: <QrCode className="h-5 w-5" />,
      eligible: isChinaCurrency,
      eligibleHint: isChinaCurrency ? "Available for CNY" : "Switch to CNY to enable WeChat Pay",
      recommendedScore: isChinaCurrency ? 90 : 15,
      policyBanner: "Availability depends on provider coverage by region.",
    };

    const mAlipay: Method = {
      key: "Alipay",
      label: "Alipay",
      description: "QR or in-app flow",
      eta: "Instant to 5 minutes",
      feeHint: "Fee varies",
      railsTag: "China rails",
      icon: <QrCode className="h-5 w-5" />,
      eligible: isChinaCurrency,
      eligibleHint: isChinaCurrency ? "Available for CNY" : "Switch to CNY to enable Alipay",
      recommendedScore: isChinaCurrency ? 89 : 15,
      policyBanner: "If not available, use UnionPay or bank transfer.",
    };

    const mUnionPay: Method = {
      key: "UnionPay",
      label: "UnionPay",
      description: "Card rails in China context",
      eta: "Instant to 5 minutes",
      feeHint: "Fee about 1.9%",
      railsTag: "China rails",
      icon: <CreditCard className="h-5 w-5" />,
      eligible: true,
      eligibleHint: "Available",
      recommendedScore: isChinaCurrency ? 86 : 75,
      policyBanner: "Recommended fallback for China wallet coverage gaps.",
    };

    const list: Method[] = [mPersonalWallet, mOrgWallet, mCard, mBank, mMoMo, mWeChat, mAlipay, mUnionPay];

    // rank: recommendedScore then eligibility then speed
    return list
      .map((m) => {
        // apply policy based ranking
        let score = m.recommendedScore;
        if (!m.eligible) score -= 30;
        if (m.key === "Organization Wallet" && ctx.kind === "org" && orgAccessAllowed && ctx.status === "Active") score += 3;
        if ((m.key === "WeChat Pay" || m.key === "Alipay") && !isChinaCurrency) score -= 20;
        return { ...m, recommendedScore: score };
      })
      .sort((a, b) => b.recommendedScore - a.recommendedScore);
  }, [contexts, ctx, currency, amount, isChinaCurrency, orgAccessAllowed, orgBlockedReason]);

  const [selected, setSelected] = useState<MethodKey>("Personal Wallet");

  useEffect(() => {
    // auto-select first eligible recommended
    const best = methods.find((m) => m.eligible);
    if (best) setSelected(best.key);
  }, [methods]);

  const selectedMethod = useMemo(() => methods.find((m) => m.key === selected) || methods[0], [methods, selected]);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [requestUrgency, setRequestUrgency] = useState("Normal");

  const submitRequest = () => {
    if (!requestReason.trim()) {
      toast({ kind: "warn", title: "Reason required" });
      return;
    }
    setRequestOpen(false);
    toast({ kind: "success", title: "Request submitted", message: "You will be notified when approved." });
  };

  const fallbackSuggestions = useMemo(() => {
    const blocked = methods.filter((m) => !m.eligible);
    if (!blocked.length) return [];
    const eligible = methods.filter((m) => m.eligible);
    return eligible.slice(0, 3);
  }, [methods]);

  const canContinue = selectedMethod?.eligible ?? false;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Payment Method Selector</div>
                  <div className="mt-1 text-xs text-slate-500">Choose the best payment method based on cost, ETA, policy, and eligibility</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Context: ${ctx.label}`} tone={ctx.kind === "org" ? "info" : "neutral"} />
                    <Pill label={ctx.status} tone={toneForStatus(ctx.status)} />
                    {ctx.kind === "org" ? <Pill label={`Role: ${ctx.role}`} tone="neutral" /> : <Pill label={`Tier ${ctx.tier}`} tone={ctx.tier >= 2 ? "good" : "warn"} />}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Back", message: "This would return to checkout." })}>
                  <ChevronRight className="h-4 w-4" /> Back
                </Button>
                <Button
                  variant={canContinue ? "primary" : "outline"}
                  disabled={!canContinue}
                  title={!canContinue ? "Selected method not eligible" : "Continue"}
                  onClick={() => toast({ kind: "success", title: "Continue", message: `Selected: ${selectedMethod.label}` })}
                >
                  <ChevronRight className="h-4 w-4" /> Continue
                </Button>
              </div>
            </div>

            {/* Context switch + checkout summary */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Paying as</div>
                <div className="mt-1">
                  <Select value={contextId} onChange={setContextId} options={contexts.map((c) => c.id)} />
                </div>
                {ctx.kind === "org" && !orgAccessAllowed ? (
                  <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4" />
                      <div>
                        <div className="font-semibold">Corporate access required</div>
                        <div className="mt-1 text-xs text-amber-800">Request access to use organization payment methods.</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button variant="accent" onClick={() => setRequestOpen(true)}>
                        <ChevronRight className="h-4 w-4" /> Request access
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <div className="mt-1">
                  <Select value={module} onChange={setModule} options={["E-Commerce", "Services", "EV Charging", "Rides & Logistics", "CorporatePay"]} />
                </div>
                <div className="mt-2 text-xs text-slate-500">Ranking adapts to module policy.</div>
              </div>

              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Amount and currency</div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Input value={amountStr} onChange={setAmountStr} placeholder="180000" />
                  <Select value={currency} onChange={(v) => setCurrency(v as Currency)} options={["UGX", "USD", "CNY", "KES"]} />
                </div>
                <div className="mt-2 text-xs text-slate-500">WeChat Pay and Alipay require CNY.</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                {/* Org vs Personal comparison banner */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Compare contexts</div>
                      <div className="mt-1 text-sm text-slate-600">Personal vs organization availability, approvals, and enforcement</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Pill label={`Selected: ${ctx.kind === "org" ? "Organization" : "Personal"}`} tone={ctx.kind === "org" ? "info" : "neutral"} />
                        <Pill label={`Currency: ${currency}`} tone="neutral" />
                        <Pill label={`Amount: ${formatMoney(amount || 0, currency)}`} tone="neutral" />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setContextId("personal")}>
                        <WalletIcon className="h-4 w-4" /> Personal
                      </Button>
                      <Button variant="outline" onClick={() => setContextId("org_acme")}>
                        <Building2 className="h-4 w-4" /> Org
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Personal</div>
                          <div className="mt-1 text-xs text-slate-500">Tier {(contexts[0] as any).tier}</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">Available {formatMoney((contexts[0] as any).availableByCurrency[currency] ?? 0, currency)}</div>
                          <div className="mt-2 text-xs text-slate-500">Approvals: Not required</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <WalletIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Organization</div>
                          <div className="mt-1 text-xs text-slate-500">Role {(contexts[1] as any).role}</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">Available {formatMoney((contexts[1] as any).availableByCurrency[currency] ?? 0, currency)}</div>
                          <div className="mt-2 text-xs text-slate-500">Approvals: {(contexts[1] as any).approvalsRequired ? "Required" : "Not required"}</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                          <Building2 className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {ctx.kind === "org" && orgBlockedReason ? (
                    <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Organization limitation</div>
                          <div className="mt-1 text-sm text-amber-900">{orgBlockedReason}</div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => setContextId("personal")}>
                              <WalletIcon className="h-4 w-4" /> Use personal
                            </Button>
                            {!orgAccessAllowed ? (
                              <Button variant="accent" onClick={() => setRequestOpen(true)}>
                                <ChevronRight className="h-4 w-4" /> Request access
                              </Button>
                            ) : (
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Top up org", message: "This would open organization top-up request." })}>
                                <ChevronRight className="h-4 w-4" /> Top up org
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Methods list */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Methods</div>
                      <div className="mt-1 text-xs text-slate-500">Ranked by recommendation, cost, ETA, and policy</div>
                    </div>
                    <Pill label={`${methods.length} options`} tone="neutral" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {methods.map((m) => (
                      <MethodCard key={m.key} m={m} selected={selected === m.key} onSelect={() => setSelected(m.key)} />
                    ))}
                  </div>

                  {!canContinue ? (
                    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Selected method is blocked</div>
                          <div className="mt-1 text-sm text-amber-900">{selectedMethod.eligibleHint}</div>
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-700">Suggested alternatives</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {fallbackSuggestions.map((x) => (
                                <Button key={x.key} variant="outline" onClick={() => setSelected(x.key)} className="px-3 py-2">
                                  {x.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right summary */}
              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Selection summary</div>
                      <div className="mt-1 text-xs text-slate-500">What happens if you continue</div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Method</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{selectedMethod.label}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-500">ETA</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{selectedMethod.eta}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-500">Fee</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{selectedMethod.feeHint}</div>
                      </div>
                      <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", selectedMethod.eligible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                        {selectedMethod.eligible ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                    </div>
                    {selectedMethod.requiresApproval ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4" />
                          <div>Approval flow will start before payment is processed.</div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Module</span><span className="font-semibold">{module}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold">{formatMoney(amount || 0, currency)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Context</span><span className="font-semibold">{ctx.label}</span></div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant={canContinue ? "primary" : "outline"}
                      disabled={!canContinue}
                      onClick={() => toast({ kind: "success", title: "Continue", message: `Using ${selectedMethod.label}` })}
                    >
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policy", message: "This would show policy reasons and approvals." })}>
                      <ChevronRight className="h-4 w-4" /> Policy
                    </Button>
                  </div>
                </div>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{
                    background:
                      "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium selection logic</div>
                      <div className="mt-1 text-sm text-slate-600">Recommendations consider cost, ETA, policy, and wallet enforcement.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="WeChat Pay" tone="neutral" />
                        <Pill label="Alipay" tone="neutral" />
                        <Pill label="UnionPay" tone="neutral" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={requestOpen}
        title="Request corporate access"
        subtitle={ctx.kind === "org" ? `Ask for access to ${ctx.label}` : ""}
        onClose={() => setRequestOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Requests are audited.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitRequest}>
                <ChevronRight className="h-4 w-4" /> Submit
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Request</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Reason</div>
                <div className="mt-1"><Input value={requestReason} onChange={setRequestReason} placeholder="Example: Need to approve corporate purchases" /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Urgency</div>
                <div className="mt-1"><Select value={requestUrgency} onChange={setRequestUrgency} options={["Normal", "Urgent"]} /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4" />
                  <div>Admin will assign a role. Your available payment methods will update automatically.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">What happens next</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Request is sent to org Admin</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Role and permissions assigned</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />You get a notification when approved</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
