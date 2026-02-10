import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowLeftRight,
    BadgeCheck,
    CalendarClock,
    Check,
    ChevronRight,
    CircleHelp,
    Copy,
    Download,
    FileText,
    Flag,
    Info,
    Link as LinkIcon,
    Paperclip,
    Receipt,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Timer,
    Trash2,
    Upload,
    Wallet as WalletIcon,
    X,
} from "lucide-react";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

type Currency = "UGX" | "USD" | "CNY" | "KES";
type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed" | "Disputed";

type TimelineStep = {
    key: "Initiated" | "Authorized" | "Pending" | "Posted" | "Settled" | "Failed" | "Reversed";
    when: string;
    state: "done" | "current" | "todo";
};

type Attachment = {
    id: string;
    name: string;
    kind: "Invoice" | "Proof" | "Dispute" | "Other";
    addedAt: string;
};

type ApprovalStep = { who: string; role: string; decision: "Approved" | "Rejected" | "Pending"; when: string };

type Tx = {
    id: string;
    title: string;
    status: TxStatus;
    amount: number;
    currency: Currency;
    counterparty: string;
    method: string;
    module: string;
    fees: number;
    taxes: number;
    fx?: { from: Currency; to: Currency; rate: number; spreadPct: number };
    ledgerRef: string;
    internalRef: string;
    providerRef?: string;
    initiatedAt: string;
    settlementAt?: string;
    auditWhy: string;
    approvals?: ApprovalStep[];
    attachments: Attachment[];
    dispute?: { id: string; status: "Open" | "In review" | "Resolved"; lastUpdate: string };
    reversalAllowed: boolean;
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

function toneForStatus(s: TxStatus) {
    if (s === "Completed") return "good" as const;
    if (s === "Pending") return "warn" as const;
    if (s === "Disputed") return "warn" as const;
    if (s === "Failed") return "bad" as const;
    return "neutral" as const;
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
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 30, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-hidden border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,8,23,0.22)]"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div className="min-w-0">
                                <div className="text-base font-semibold text-slate-900">{title}</div>
                                {subtitle ? <div className="mt-1 truncate text-sm text-slate-600">{subtitle}</div> : null}
                            </div>
                            <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="h-[calc(100vh-140px)] overflow-auto px-5 py-4">{children}</div>
                        {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}

function Timeline({ steps }: { steps: TimelineStep[] }) {
    return (
        <div className="space-y-3">
            {steps.map((s, idx) => {
                const tone = s.state === "done" ? "bg-emerald-50 text-emerald-700" : s.state === "current" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700";
                return (
                    <div key={s.key} className="flex items-start gap-3">
                        <div className={cn("grid h-9 w-9 place-items-center rounded-2xl", tone)}>
                            {s.state === "done" ? <Check className="h-5 w-5" /> : s.state === "current" ? <Timer className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="text-sm font-semibold text-slate-900">{s.key}</div>
                                <div className="text-xs text-slate-500">{s.when}</div>
                            </div>
                            {idx < steps.length - 1 ? <div className="mt-2 h-6 w-px bg-slate-200 ml-4" /> : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function TransactionDetailsDrawerDemo() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = (t: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
        window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
    };

    const sampleTxs = useMemo<Tx[]>(
        () => [
            {
                id: "TX-9006",
                title: "CorporatePay checkout",
                status: "Pending",
                amount: -540000,
                currency: "UGX",
                counterparty: "Vendor: Acme Supplies",
                method: "Corporate Wallet",
                module: "CorporatePay",
                fees: 0,
                taxes: 0,
                ledgerRef: "LED-33219006",
                internalRef: "EVZ-INT-9006",
                providerRef: "PRV-7006",
                initiatedAt: "Today 07:55",
                auditWhy: "Policy requires 2-step approval above UGX 500,000.",
                approvals: [
                    { who: "Ronald", role: "Approver", decision: "Approved", when: "Today 08:10" },
                    { who: "Finance Desk", role: "Finance", decision: "Pending", when: "Waiting" },
                ],
                attachments: [
                    { id: "ATT-1", name: "Invoice.pdf", kind: "Invoice", addedAt: "Today 08:00" },
                    { id: "ATT-2", name: "Quotation.png", kind: "Proof", addedAt: "Today 08:00" },
                ],
                reversalAllowed: false,
            },
            {
                id: "TX-9005",
                title: "Bank withdrawal",
                status: "Failed",
                amount: -280000,
                currency: "UGX",
                counterparty: "Stanbic",
                method: "Bank Transfer",
                module: "Wallet",
                fees: 2800,
                taxes: 0,
                ledgerRef: "LED-33219005",
                internalRef: "EVZ-INT-9005",
                providerRef: "PRV-7005",
                initiatedAt: "Today 06:40",
                settlementAt: "Today 06:55",
                auditWhy: "Beneficiary name mismatch.",
                attachments: [{ id: "ATT-3", name: "PayoutProof.jpg", kind: "Proof", addedAt: "Today 06:56" }],
                dispute: { id: "DSP-201", status: "Open", lastUpdate: "Today 07:10" },
                reversalAllowed: true,
            },
            {
                id: "TX-9004",
                title: "WeChat Pay top-up",
                status: "Completed",
                amount: 820,
                currency: "CNY",
                counterparty: "WeChat Pay",
                method: "WeChat Pay",
                module: "Wallet",
                fees: 9.84,
                taxes: 0,
                fx: { from: "CNY", to: "UGX", rate: 520, spreadPct: 0.8 },
                ledgerRef: "LED-33219004",
                internalRef: "EVZ-INT-9004",
                providerRef: "PRV-7004",
                initiatedAt: "Yesterday 18:05",
                settlementAt: "Yesterday 18:06",
                auditWhy: "Deposit posted. Funds available.",
                attachments: [],
                reversalAllowed: false,
            },
        ],
        []
    );

    const [open, setOpen] = useState(false);
    const [tx, setTx] = useState<Tx | null>(null);

    const openTx = (t: Tx) => {
        setTx(t);
        setOpen(true);
    };

    const steps = useMemo<TimelineStep[]>(() => {
        if (!tx) return [];

        if (tx.status === "Completed") {
            return [
                { key: "Initiated", when: tx.initiatedAt, state: "done" },
                { key: "Authorized", when: "System", state: "done" },
                { key: "Pending", when: "Clearing", state: "done" },
                { key: "Posted", when: tx.settlementAt ?? "Posted", state: "done" },
                { key: "Settled", when: tx.settlementAt ?? "Settled", state: "current" },
            ];
        }

        if (tx.status === "Pending") {
            return [
                { key: "Initiated", when: tx.initiatedAt, state: "done" },
                { key: "Authorized", when: "Awaiting approvals", state: "current" },
                { key: "Pending", when: "Queued", state: "todo" },
                { key: "Posted", when: "Not yet", state: "todo" },
                { key: "Settled", when: "Not yet", state: "todo" },
            ];
        }

        if (tx.status === "Failed") {
            return [
                { key: "Initiated", when: tx.initiatedAt, state: "done" },
                { key: "Authorized", when: "Approved", state: "done" },
                { key: "Pending", when: "Processing", state: "done" },
                { key: "Failed", when: tx.settlementAt ?? "Failed", state: "current" },
            ];
        }

        if (tx.status === "Reversed") {
            return [
                { key: "Initiated", when: tx.initiatedAt, state: "done" },
                { key: "Authorized", when: "Authorized", state: "done" },
                { key: "Posted", when: tx.settlementAt ?? "Posted", state: "done" },
                { key: "Reversed", when: "Reversal posted", state: "current" },
            ];
        }

        // Disputed
        return [
            { key: "Initiated", when: tx.initiatedAt, state: "done" },
            { key: "Posted", when: tx.settlementAt ?? "Posted", state: "done" },
            { key: "Settled", when: "Settled", state: "done" },
            { key: "Pending", when: "Dispute review", state: "current" },
        ];
    }, [tx]);

    const addAttachment = (kind: Attachment["kind"]) => {
        if (!tx) return;
        const a: Attachment = {
            id: uid("att"),
            name: kind === "Invoice" ? "Invoice.pdf" : kind === "Proof" ? "Proof.png" : kind === "Dispute" ? "DisputeNote.txt" : "File.bin",
            kind,
            addedAt: "Just now",
        };
        setTx((p) => (p ? { ...p, attachments: [a, ...p.attachments] } : p));
        toast({ kind: "success", title: "Attachment added", message: a.name });
    };

    const removeAttachment = (id: string) => {
        if (!tx) return;
        setTx((p) => (p ? { ...p, attachments: p.attachments.filter((a) => a.id !== id) } : p));
        toast({ kind: "info", title: "Removed" });
    };

    const copy = async (txt: string) => {
        try {
            await navigator.clipboard.writeText(txt);
            toast({ kind: "success", title: "Copied" });
        } catch {
            toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
        }
    };

    return (
        <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

            <div className="mx-auto max-w-[1100px] px-4 py-5 md:px-6">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                    <div className="border-b border-slate-200 px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Transaction Details Drawer</div>
                                    <div className="mt-1 text-xs text-slate-500">Deep detail view with timeline, receipt, attachments, actions, and audit</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Pill label="Timeline" tone="neutral" />
                                        <Pill label="Attachments" tone="neutral" />
                                        <Pill label="Audit and why" tone="neutral" />
                                        <Pill label="Disputes" tone="neutral" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Back", message: "This would route back to Transactions & Receipts." })}>
                                    <ChevronRight className="h-4 w-4" /> Back
                                </Button>
                                <Button variant="primary" onClick={() => openTx(sampleTxs[0])}>
                                    <Sparkles className="h-4 w-4" /> Open drawer
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-4 py-5 md:px-6">
                        <div className="grid grid-cols-1 gap-3">
                            {sampleTxs.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => openTx(t)}
                                    className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                                <Pill label={t.status} tone={toneForStatus(t.status)} />
                                                <Pill label={t.module} tone="neutral" />
                                                {t.dispute ? <Pill label="Dispute" tone="warn" /> : null}
                                            </div>
                                            <div className="mt-1 text-sm text-slate-600">{t.counterparty}</div>
                                            <div className="mt-2 text-xs text-slate-500">{t.id} • {t.method}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("text-sm font-semibold", t.amount >= 0 ? "text-emerald-700" : "text-slate-900")}>
                                                {formatMoney(t.amount, t.currency)}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">Fees {formatMoney(t.fees, t.currency)}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Drawer
                open={open}
                title={tx ? tx.title : "Transaction"}
                subtitle={tx ? `${tx.id} • ${tx.module} • ${tx.method}` : ""}
                onClose={() => setOpen(false)}
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Info className="h-4 w-4" /> Actions are recorded for traceability.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                            <Button variant="primary" onClick={() => toast({ kind: "info", title: "Download", message: "This would download receipt PDF." })}>
                                <Download className="h-4 w-4" /> PDF
                            </Button>
                        </div>
                    </div>
                }
            >
                {tx ? (
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Pill label={tx.status} tone={toneForStatus(tx.status)} />
                                        <Pill label={tx.currency} tone="neutral" />
                                        {tx.dispute ? <Pill label={`Dispute: ${tx.dispute.status}`} tone="warn" /> : null}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{tx.counterparty}</div>
                                    <div className="mt-1 text-xs text-slate-500">Ledger {tx.ledgerRef}</div>
                                </div>
                                <div className="text-right">
                                    <div className={cn("text-lg font-semibold", tx.amount >= 0 ? "text-emerald-700" : "text-slate-900")}>
                                        {formatMoney(tx.amount, tx.currency)}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">Fees {formatMoney(tx.fees, tx.currency)} • Taxes {formatMoney(tx.taxes, tx.currency)}</div>
                                </div>
                            </div>

                            {tx.fx ? (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                    <div className="flex items-start gap-2">
                                        <ArrowLeftRight className="mt-0.5 h-4 w-4" />
                                        <div>
                                            FX {tx.fx.from} to {tx.fx.to} • Rate {tx.fx.rate.toLocaleString(undefined, { maximumFractionDigits: 8 })} • Spread {tx.fx.spreadPct}%
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Timeline</div>
                            <div className="mt-3">
                                <Timeline steps={steps} />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">References</div>
                                    <div className="mt-1 text-xs text-slate-500">Internal and provider references</div>
                                </div>
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                    <LinkIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="text-xs font-semibold text-slate-500">Internal</div>
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{tx.internalRef}</div>
                                        <Button variant="outline" className="px-3 py-2" onClick={() => copy(tx.internalRef)}>
                                            <Copy className="h-4 w-4" /> Copy
                                        </Button>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="text-xs font-semibold text-slate-500">Provider</div>
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{tx.providerRef ?? "Not available"}</div>
                                        {tx.providerRef ? (
                                            <Button variant="outline" className="px-3 py-2" onClick={() => copy(tx.providerRef!)}>
                                                <Copy className="h-4 w-4" /> Copy
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Attachments</div>
                                    <div className="mt-1 text-xs text-slate-500">Invoices, proofs, dispute docs</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="px-3 py-2" onClick={() => addAttachment("Invoice")}>
                                        <Paperclip className="h-4 w-4" /> Invoice
                                    </Button>
                                    <Button variant="outline" className="px-3 py-2" onClick={() => addAttachment("Proof")}>
                                        <Paperclip className="h-4 w-4" /> Proof
                                    </Button>
                                    <Button variant="outline" className="px-3 py-2" onClick={() => addAttachment("Dispute")}>
                                        <Paperclip className="h-4 w-4" /> Dispute
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {tx.attachments.length ? (
                                    tx.attachments.map((a) => (
                                        <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                                                        <Pill label={a.kind} tone="neutral" />
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">Added {a.addedAt}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Download", message: "This would download the attachment." })}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" className="px-3 py-2" onClick={() => removeAttachment(a.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No attachments yet.</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Audit and why</div>
                            <div className="mt-2 text-sm text-slate-700">{tx.auditWhy}</div>
                            {tx.approvals?.length ? (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold text-slate-600">Approval chain</div>
                                    <div className="mt-2 space-y-2">
                                        {tx.approvals.map((a, idx) => (
                                            <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{a.who}</div>
                                                    <div className="text-xs text-slate-500">{a.role}</div>
                                                </div>
                                                <div className="text-right">
                                                    <Pill label={a.decision} tone={a.decision === "Approved" ? "good" : a.decision === "Rejected" ? "bad" : "warn"} />
                                                    <div className="mt-1 text-xs text-slate-500">{a.when}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {tx.dispute ? (
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                                        <Flag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Dispute</div>
                                        <div className="mt-1 text-sm text-amber-900">{tx.dispute.id} • {tx.dispute.status} • Last update {tx.dispute.lastUpdate}</div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Button variant="accent" onClick={() => toast({ kind: "info", title: "Open dispute", message: "This would open the dispute thread." })}>
                                                <ChevronRight className="h-4 w-4" /> Open
                                            </Button>
                                            <Button variant="outline" onClick={() => addAttachment("Dispute")}>
                                                <Upload className="h-4 w-4" /> Attach evidence
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                        <CircleHelp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Need help?</div>
                                        <div className="mt-1 text-sm text-slate-600">Open a dispute or report an issue if something looks wrong.</div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open dispute", message: "This would open a dispute workflow." })}>
                                                <ChevronRight className="h-4 w-4" /> Open dispute
                                            </Button>
                                            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Report", message: "This would open a support ticket." })}>
                                                <ChevronRight className="h-4 w-4" /> Report
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Actions</div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Share", message: "This would share a receipt link." })}>
                                    <LinkIcon className="h-4 w-4" /> Share
                                </Button>
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Download", message: "This would download receipt PDF." })}>
                                    <Download className="h-4 w-4" /> PDF
                                </Button>
                                <Button
                                    variant={tx.reversalAllowed ? "outline" : "outline"}
                                    disabled={!tx.reversalAllowed}
                                    title={!tx.reversalAllowed ? "Not allowed for this transaction" : "Request reversal"}
                                    onClick={() => toast({ kind: "info", title: "Reversal", message: "This would request reversal if allowed." })}
                                >
                                    <ChevronRight className="h-4 w-4" /> Reversal
                                </Button>
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Refresh", message: "This would refresh provider status." })}>
                                    <RefreshCcw className="h-4 w-4" /> Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Drawer>
        </div>
    );
}
