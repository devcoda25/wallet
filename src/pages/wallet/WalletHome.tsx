import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    BadgeCheck,
    Bell,
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Globe,
    Home,
    Info,
    Layers,
    Plus,
    Sparkles,
    Timer,
    Wallet as WalletIcon,
    X,
} from "lucide-react";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

type WalletStatus = "Active" | "Needs verification" | "Suspended" | "Deposit depleted";

type WalletContext =
    | { kind: "personal"; id: "personal"; label: "Personal Wallet"; status: WalletStatus }
    | { kind: "org"; id: string; label: string; status: WalletStatus; role: string };

type Currency = "UGX" | "USD" | "CNY" | "KES";

type CurrencyBalance = {
    currency: Currency;
    available: number;
    pending: number;
    reserved: number;
    fxHint?: string;
};

type SnapshotCard = {
    id: string;
    title: string;
    subtitle: string;
    status: WalletStatus;
    role?: string;
    primaryBalanceLabel: string;
    secondaryHint: string;
    lastActiveLabel: string;
    why?: string;
};

type AlertItem = {
    id: string;
    tone: "info" | "warn" | "danger" | "success";
    title: string;
    message: string;
    cta: string;
};

type ModuleInsight = {
    module: "E-Commerce" | "EV Charging" | "Rides" | "Services";
    spendUGX: number;
    earnUGX: number;
    trend: "Up" | "Down" | "Stable";
};

type LastAction =
    | {
        type: "Withdrawal";
        title: string;
        subtitle: string;
        status: "Pending" | "Needs action";
        nextStep: string;
    }
    | {
        type: "Top up";
        title: string;
        subtitle: string;
        status: "Pending" | "Needs action";
        nextStep: string;
    }
    | {
        type: "Approval";
        title: string;
        subtitle: string;
        status: "Pending" | "Needs action";
        nextStep: string;
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

function toneForStatus(s: WalletStatus) {
    if (s === "Active") return "good" as const;
    if (s === "Needs verification") return "warn" as const;
    if (s === "Suspended") return "bad" as const;
    return "warn" as const;
}

function toneForAlert(t: AlertItem["tone"]) {
    if (t === "success") return "good" as const;
    if (t === "warn") return "warn" as const;
    if (t === "danger") return "bad" as const;
    return "info" as const;
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
    const map: Record<string, string> = {
        good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        warn: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        bad: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
        info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
        neutral: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-300",
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
    const base =
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
    const variants: Record<string, string> = {
        primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200 dark:opacity-90",
        accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200 dark:opacity-90",
        outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-700",
        danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50",
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
                            <button
                                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                                onClick={() => onDismiss(t.id)}
                                aria-label="Dismiss"
                            >
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

function BottomSheet({
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
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[980px] overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-[0_-30px_90px_rgba(2,8,23,0.22)]"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div>
                                <div className="text-base font-semibold text-slate-900">{title}</div>
                                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
                            </div>
                            <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="max-h-[65vh] overflow-auto px-5 py-4">{children}</div>
                        {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}

function TinyBar({ value, max, tone }: { value: number; max: number; tone: "good" | "warn" | "bad" | "info" }) {
    const width = max <= 0 ? 0 : Math.max(2, Math.min(100, Math.round((value / max) * 100)));
    const color =
        tone === "bad" ? "#F43F5E" : tone === "warn" ? EVZ.orange : tone === "info" ? "#2563EB" : EVZ.green;
    return (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
        </div>
    );
}

function WalletCard({
    card,
    isActive,
    onOpen,
    onSetActive,
}: {
    card: SnapshotCard;
    isActive: boolean;
    onOpen: () => void;
    onSetActive: () => void;
}) {
    return (
        <motion.div
            layout
            className={cn(
                "rounded-3xl border bg-white p-4 shadow-sm",
                isActive ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{card.title}</div>
                        <Pill label={card.status} tone={toneForStatus(card.status)} />
                        {card.role ? <Pill label={`Role: ${card.role}`} tone="neutral" /> : null}
                        {isActive ? <Pill label="Current" tone="info" /> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{card.subtitle}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                    <WalletIcon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-500">Available</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{card.primaryBalanceLabel}</div>
                    <div className="mt-1 text-xs text-slate-500">{card.secondaryHint}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-500">Last active</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{card.lastActiveLabel}</div>
                    <div className="mt-1 text-xs text-slate-500">{card.why ? card.why : "Ready for payments and payouts"}</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant={isActive ? "primary" : "outline"} onClick={onSetActive}>
                    {isActive ? <Check className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                    {isActive ? "Active context" : "Set as active"}
                </Button>
                <Button variant="outline" onClick={onOpen}>
                    <ChevronRight className="h-4 w-4" /> Open
                </Button>
            </div>
        </motion.div>
    );
}

// Bottom Navigation Bar for Mobile
function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
    const navItems = [
        { id: "home", label: "Home", icon: Home },
        { id: "wallet", label: "Wallet", icon: WalletIcon },
        { id: "add", label: "Add", icon: Plus },
        { id: "activity", label: "Activity", icon: Activity },
        { id: "profile", label: "Profile", icon: Bell },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-2 pb-6 md:hidden">
            <div className="flex items-center justify-between gap-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all",
                                isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                                    isActive ? "bg-emerald-50" : ""
                                )}
                            >
                                <Icon className={cn("h-6 w-6", isActive && "h-7 w-7")} />
                            </div>
                            <span className={cn("text-xs font-medium", isActive && "text-emerald-600")}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function WalletHomeHub() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = (t: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
        window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
    };

    // Mock: User's organization eligibility (in production, this would come from the backend)
    const [hasOrgAccess, setHasOrgAccess] = useState(false);

    const allWalletCards = useMemo<SnapshotCard[]>(() => [
        {
            id: "personal",
            title: "Personal Wallet",
            subtitle: "Your EVzone wallet across all modules",
            status: "Active" as const,
            primaryBalanceLabel: "UGX 1,250,000",
            secondaryHint: "Multi-currency enabled",
            lastActiveLabel: "2m ago",
        },
        {
            id: "org_1",
            title: "Acme Group Ltd",
            subtitle: "Corporate wallet",
            status: "Active" as const,
            role: "Approver",
            primaryBalanceLabel: "UGX 9,800,000",
            secondaryHint: "Prepaid + invoices enabled",
            lastActiveLabel: "12m ago",
        },
        {
            id: "org_2",
            title: "Kampala Holdings",
            subtitle: "Corporate wallet",
            status: "Deposit depleted" as const,
            role: "Member",
            primaryBalanceLabel: "UGX 0",
            secondaryHint: "Top-up required",
            lastActiveLabel: "3h ago",
            why: "CorporatePay paused until deposit is topped up",
        },
        {
            id: "org_3",
            title: "EVzone Demo Org",
            subtitle: "Corporate wallet",
            status: "Suspended" as const,
            role: "Viewer",
            primaryBalanceLabel: "UGX 2,100,000",
            secondaryHint: "Policy enforcement",
            lastActiveLabel: "1d ago",
            why: "Billing not compliant with invoicing agreement",
        },
    ], []);

    // Filter wallet cards based on org access
    const walletCards = useMemo<SnapshotCard[]>(() => {
        if (hasOrgAccess) {
            return allWalletCards;
        }
        // Only show personal wallet by default
        return allWalletCards.filter(c => c.id === "personal");
    }, [allWalletCards, hasOrgAccess]);

    const contexts = useMemo<WalletContext[]>(() => {
        const personal = walletCards.find((c) => c.id === "personal")!;
        const orgs = walletCards.filter((c) => c.id !== "personal");
        return [
            { kind: "personal" as const, id: "personal", label: "Personal Wallet" as const, status: personal.status },
            ...orgs.map((o) => ({ kind: "org" as const, id: o.id, label: o.title, status: o.status, role: o.role || "Member" })),
        ];
    }, [walletCards]);

    const [activeContextId, setActiveContextId] = useState<string>("personal");
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const [currOpen, setCurrOpen] = useState(false);
    const [continueOpen, setContinueOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("home");

    const activeContext = useMemo(() => contexts.find((c) => c.id === activeContextId) || contexts[0], [contexts, activeContextId]);

    const balances = useMemo<CurrencyBalance[]>(
        () => [
            { currency: "UGX", available: 1250000, pending: 320000, reserved: 150000, fxHint: "Primary" },
            { currency: "USD", available: 180.5, pending: 20.0, reserved: 0, fxHint: "For cross-border" },
            { currency: "CNY", available: 820.0, pending: 0, reserved: 15.5, fxHint: "China rails" },
            { currency: "KES", available: 56300, pending: 0, reserved: 0, fxHint: "Regional" },
        ],
        []
    );

    const alertsSeed = useMemo<AlertItem[]>(
        () => [
            {
                id: "a1",
                tone: "warn",
                title: "Verification required",
                message: "Complete personal KYC to unlock higher withdrawal limits and instant payouts.",
                cta: "Start verification",
            },
            {
                id: "a2",
                tone: "danger",
                title: "Failed payout",
                message: "One mobile money payout failed due to name mismatch. Update beneficiary details to retry.",
                cta: "Review payout",
            },
            {
                id: "a3",
                tone: "info",
                title: "Provider notice",
                message: "Some card top-ups may be delayed for 30 to 60 minutes due to provider maintenance.",
                cta: "View status",
            },
        ],
        []
    );

    const [alerts, setAlerts] = useState<AlertItem[]>(alertsSeed);

    const moduleInsights = useMemo<ModuleInsight[]>(
        () => [
            { module: "E-Commerce", spendUGX: 820000, earnUGX: 120000, trend: "Up" },
            { module: "EV Charging", spendUGX: 120000, earnUGX: 0, trend: "Stable" },
            { module: "Rides", spendUGX: 450000, earnUGX: 0, trend: "Up" },
            { module: "Services", spendUGX: 210000, earnUGX: 680000, trend: "Down" },
        ],
        []
    );

    const [insightMode, setInsightMode] = useState<"Spend" | "Earnings">("Spend");

    const maxInsight = useMemo(() => {
        const values = moduleInsights.map((m) => (insightMode === "Spend" ? m.spendUGX : m.earnUGX));
        return Math.max(1, ...values);
    }, [moduleInsights, insightMode]);

    const lastAction = useMemo<LastAction>(
        () => ({
            type: "Withdrawal",
            title: "Continue your withdrawal",
            subtitle: "UGX 280,000 to Mobile Money (MTN)",
            status: "Needs action",
            nextStep: "Confirm beneficiary name and retry payout",
        }),
        []
    );

    const isBlocked = useMemo(() => {
        const s = activeContext.status;
        return s === "Suspended" || s === "Deposit depleted";
    }, [activeContext.status]);

    const needsVerification = activeContext.status === "Needs verification";

    const actionHint = useMemo(() => {
        if (activeContext.status === "Suspended") return "This wallet is suspended";
        if (activeContext.status === "Deposit depleted") return "Deposit depleted. Top up required";
        if (activeContext.status === "Needs verification") return "Verification required for some actions";
        return "Ready";
    }, [activeContext.status]);

    const actionGuard = (name: string) => {
        if (isBlocked) {
            toast({ kind: "warn", title: "Action unavailable", message: actionHint });
            return false;
        }
        if (needsVerification && (name === "Withdraw" || name === "Exchange")) {
            toast({ kind: "warn", title: "Verification required", message: "Complete verification to use this action." });
            return false;
        }
        return true;
    };

    const headerRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 md:hidden backdrop-blur">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: EVZ.green }}>
                            <WalletIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-base font-semibold text-slate-900">Wallet</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <span>{activeContext.label}</span>
                                <span>•</span>
                                <span className={cn(
                                    activeContext.status === "Active" ? "text-emerald-600" :
                                        activeContext.status === "Needs verification" ? "text-amber-600" : "text-rose-600"
                                )}>{activeContext.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toast({ kind: "info", title: "Notifications", message: "This would open notifications." })}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
                        >
                            <Bell className="h-5 w-5 text-slate-600" />
                        </button>
                        <button
                            onClick={() => {
                                if (!hasOrgAccess) {
                                    toast({ kind: "info", title: "Corporate Hub", message: "This would navigate to the Corporate Hub." });
                                    setHasOrgAccess(true);
                                } else {
                                    setSwitcherOpen(true);
                                }
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
                        >
                            <Building2 className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="mx-auto max-w-[1100px] px-4 py-5 md:px-6 hidden md:block">
                {/* Header */}
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                    <div className="border-b border-slate-200 px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                                    <WalletIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Wallet</div>
                                    <div className="mt-1 text-xs text-slate-500">wallet.evzone.app • Personal and organization wallets</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Pill label={`Context: ${activeContext.label}`} tone="neutral" />
                                        <Pill label={activeContext.status} tone={toneForStatus(activeContext.status)} />
                                        {activeContext.kind === "org" ? <Pill label={`Role: ${activeContext.role}`} tone="neutral" /> : <Pill label="Individual" tone="neutral" />}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-wrap items-center gap-2">
                                {!hasOrgAccess ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            toast({ kind: "info", title: "Corporate Hub", message: "This would navigate to the Corporate Hub. Linking your organization..." });
                                            setHasOrgAccess(true);
                                        }}
                                        title="Switch to Corporate Hub"
                                    >
                                        <Building2 className="h-4 w-4" /> Corporate Hub
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setSwitcherOpen(true)} title="Switch wallet context">
                                        <Building2 className="h-4 w-4" /> Switch
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => toast({ kind: "info", title: "Opening transactions", message: "This would route to the Transactions page." })}
                                >
                                    <Activity className="h-4 w-4" /> Transactions
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        if (!actionGuard("Pay")) return;
                                        toast({ kind: "success", title: "Pay", message: "This would open a cross-module checkout selector." });
                                    }}
                                    title={isBlocked ? actionHint : "Pay with wallet"}
                                    disabled={isBlocked}
                                >
                                    <CreditCard className="h-4 w-4" /> Pay
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-[1100px] px-4 py-4 md:px-6 md:py-5">
                {/* Mobile Quick Actions */}
                <div className="mb-4 grid grid-cols-4 gap-2 md:hidden">
                    <button
                        onClick={() => toast({ kind: "success", title: "Add Money", message: "This would open the Add Money flow." })}
                        className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 p-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700">Add</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!actionGuard("Send")) return;
                            toast({ kind: "success", title: "Send", message: "This would open send money." });
                        }}
                        className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">Send</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!actionGuard("Request")) return;
                            toast({ kind: "success", title: "Request", message: "This would open request money." });
                        }}
                        className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                            <ArrowDownLeft className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">Request</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!actionGuard("Withdraw")) return;
                            toast({ kind: "success", title: "Withdraw", message: "This would open the withdrawal flow." });
                        }}
                        className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">Withdraw</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Left */}
                    <div className="space-y-4 lg:col-span-8">
                        <Section
                            title="Wallet snapshot"
                            subtitle={hasOrgAccess ? "Personal wallet plus linked organizations" : "Your personal wallet"}
                            right={<Pill label={`${walletCards.length} wallet${walletCards.length !== 1 ? 's' : ''}`} tone="neutral" />}
                        >
                            {!hasOrgAccess ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {walletCards.map((c) => (
                                            <WalletCard
                                                key={c.id}
                                                card={c}
                                                isActive={activeContextId === c.id}
                                                onSetActive={() => {
                                                    setActiveContextId(c.id);
                                                    toast({ kind: "success", title: "Active context updated", message: `Now using ${c.title}.` });
                                                }}
                                                onOpen={() => toast({ kind: "info", title: "Open wallet", message: `This would navigate into ${c.title}.` })}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-8 w-8 text-slate-400" />
                                            <div className="text-sm font-medium text-slate-700">Link your organization</div>
                                            <div className="text-xs text-slate-500">Access corporate wallets, invoices, and team management</div>
                                            <Button
                                                variant="outline"
                                                className="mt-2"
                                                onClick={() => {
                                                    toast({ kind: "info", title: "Link Organization", message: "This would open the organization linking flow." });
                                                    setHasOrgAccess(true);
                                                }}
                                            >
                                                <ChevronRight className="h-4 w-4" /> Link Organization
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {walletCards.map((c) => (
                                        <WalletCard
                                            key={c.id}
                                            card={c}
                                            isActive={activeContextId === c.id}
                                            onSetActive={() => {
                                                setActiveContextId(c.id);
                                                toast({ kind: "success", title: "Active context updated", message: `Now using ${c.title}.` });
                                            }}
                                            onOpen={() => toast({ kind: "info", title: "Open wallet", message: `This would navigate into ${c.title}.` })}
                                        />
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section
                            title="Continue last action"
                            subtitle="Jump back to the last pending workflow"
                            right={<Pill label={lastAction.status} tone={lastAction.status === "Pending" ? "info" : "warn"} />}
                        >
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", lastAction.status === "Pending" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800")}>
                                            <Timer className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{lastAction.title}</div>
                                            <div className="mt-1 text-sm text-slate-600">{lastAction.subtitle}</div>
                                            <div className="mt-2 text-xs text-slate-500">Next step: {lastAction.nextStep}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" onClick={() => setContinueOpen(true)}>
                                            <ChevronRight className="h-4 w-4" /> View details
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                setContinueOpen(true);
                                                toast({ kind: "info", title: "Continuing workflow", message: "This would route to the relevant flow screen." });
                                            }}
                                        >
                                            <Sparkles className="h-4 w-4" /> Continue
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section
                            title="Cross-module insights"
                            subtitle="Your spend and earnings across EVzone modules"
                            right={
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={insightMode === "Spend" ? "primary" : "outline"}
                                        onClick={() => setInsightMode("Spend")}
                                        className="px-3 py-2"
                                    >
                                        Spend
                                    </Button>
                                    <Button
                                        variant={insightMode === "Earnings" ? "accent" : "outline"}
                                        onClick={() => setInsightMode("Earnings")}
                                        className="px-3 py-2"
                                    >
                                        Earnings
                                    </Button>
                                </div>
                            }
                        >
                            <div className="space-y-3">
                                {moduleInsights.map((m) => {
                                    const value = insightMode === "Spend" ? m.spendUGX : m.earnUGX;
                                    const tone = insightMode === "Spend" ? (m.module === "Services" ? "warn" : "good") : m.module === "Services" ? "good" : "info";
                                    return (
                                        <div key={m.module} className="rounded-3xl border border-slate-200 bg-white p-4">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-semibold text-slate-900">{m.module}</div>
                                                        <Pill label={`Trend: ${m.trend}`} tone={m.trend === "Up" ? "good" : m.trend === "Down" ? "warn" : "neutral"} />
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">Last 30 days</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-slate-900">{formatMoney(value, "UGX")}</div>
                                                    <div className="mt-1 text-xs text-slate-500">{insightMode === "Spend" ? "Spent" : "Earned"}</div>
                                                </div>
                                            </div>
                                            <TinyBar value={value} max={maxInsight} tone={tone} />
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    </div>

                    {/* Right */}
                    <div className="space-y-4 lg:col-span-4">
                        <Section
                            title="Quick actions"
                            subtitle="Context-aware wallet actions"
                            right={<Pill label={actionHint} tone={isBlocked ? "warn" : "good"} />}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!actionGuard("Add money")) return;
                                        toast({ kind: "success", title: "Add money", message: "This would open the top-up flow." });
                                    }}
                                >
                                    <BadgeCheck className="h-4 w-4" /> Add
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!actionGuard("Withdraw")) return;
                                        toast({ kind: "success", title: "Withdraw", message: "This would open the withdrawal flow." });
                                    }}
                                >
                                    <ArrowUpRight className="h-4 w-4" /> Withdraw
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!actionGuard("Send")) return;
                                        toast({ kind: "success", title: "Send", message: "This would open send money." });
                                    }}
                                >
                                    <ArrowUpRight className="h-4 w-4" /> Send
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!actionGuard("Request")) return;
                                        toast({ kind: "success", title: "Request", message: "This would open request money." });
                                    }}
                                >
                                    <ArrowDownLeft className="h-4 w-4" /> Request
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!actionGuard("Exchange")) return;
                                        toast({ kind: "success", title: "Exchange", message: "This would open FX conversion." });
                                    }}
                                >
                                    <ArrowLeftRight className="h-4 w-4" /> Exchange
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => toast({ kind: "info", title: "Open transfers", message: "This would open transfers for your selected context." })}
                                >
                                    <Layers className="h-4 w-4" /> More
                                </Button>
                            </div>

                            {needsVerification ? (
                                <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    <div className="flex items-start gap-2">
                                        <Info className="mt-0.5 h-4 w-4" />
                                        <div>
                                            <div className="font-semibold">Some actions are locked</div>
                                            <div className="mt-1 text-xs text-amber-800">Complete verification to unlock withdrawals and FX.</div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </Section>

                        <Section
                            title="Multi-currency"
                            subtitle="Balances by currency"
                            right={
                                <Button variant="outline" onClick={() => setCurrOpen(true)} className="px-3 py-2">
                                    <Globe className="h-4 w-4" /> View
                                </Button>
                            }
                        >
                            <div className="space-y-2">
                                {balances.slice(0, 3).map((b) => (
                                    <div key={b.currency} className="rounded-3xl border border-slate-200 bg-white p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-semibold text-slate-900">{b.currency}</div>
                                                    {b.fxHint ? <Pill label={b.fxHint} tone={b.fxHint === "Primary" ? "info" : "neutral"} /> : null}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">Available</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-slate-900">{formatMoney(b.available, b.currency)}</div>
                                                <div className="mt-1 text-xs text-slate-500">Pending {formatMoney(b.pending, b.currency)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="w-full rounded-3xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                    onClick={() => setCurrOpen(true)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> Other currencies
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                    </div>
                                </button>
                            </div>
                        </Section>

                        <Section
                            title="Smart alerts"
                            subtitle="Important updates across wallets"
                            right={<Pill label={`${alerts.length}`} tone={alerts.length ? "warn" : "neutral"} />}
                        >
                            <div className="space-y-2">
                                {alerts.length ? (
                                    alerts.map((a) => (
                                        <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                                        <Pill label={a.tone.toUpperCase()} tone={toneForAlert(a.tone)} />
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-600">{a.message}</div>
                                                </div>
                                                <div className={cn("grid h-9 w-9 place-items-center rounded-2xl", a.tone === "danger" ? "bg-rose-50 text-rose-700" : a.tone === "warn" ? "bg-amber-50 text-amber-800" : a.tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
                                                    {a.tone === "danger" ? <AlertTriangle className="h-4 w-4" /> : a.tone === "warn" ? <Bell className="h-4 w-4" /> : a.tone === "success" ? <BadgeCheck className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <Button
                                                    variant={a.tone === "danger" ? "danger" : a.tone === "warn" ? "accent" : "outline"}
                                                    onClick={() => toast({ kind: "info", title: a.cta, message: "This would open the relevant workflow." })}
                                                >
                                                    <ChevronRight className="h-4 w-4" /> {a.cta}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setAlerts((p) => p.filter((x) => x.id !== a.id));
                                                        toast({ kind: "success", title: "Alert dismissed" });
                                                    }}
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                                                <BadgeCheck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">All caught up</div>
                                                <div className="mt-1 text-sm text-slate-600">No critical wallet alerts right now.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>
                    </div>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">Premium routing-ready</div>
                                <div className="mt-1 text-sm text-slate-600">
                                    This hub is designed to plug into your existing CorporatePay navigation and deep links.
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => toast({ kind: "info", title: "Open wallet switcher", message: "Use this as a global switcher entry point." })}
                            >
                                <Building2 className="h-4 w-4" /> Wallet switcher
                            </Button>
                            <Button
                                variant="accent"
                                onClick={() => toast({ kind: "success", title: "Open settings", message: "This would route to Wallet Settings and Security." })}
                            >
                                <ChevronRight className="h-4 w-4" /> Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={switcherOpen}
                title="Switch wallet"
                subtitle="Choose Personal Wallet or an organization wallet"
                onClose={() => setSwitcherOpen(false)}
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Info className="h-4 w-4" /> Your permissions depend on your organization role.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setSwitcherOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    toast({ kind: "success", title: "Context saved", message: `Active context: ${activeContext.label}` });
                                    setSwitcherOpen(false);
                                }}
                            >
                                <Sparkles className="h-4 w-4" /> Done
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-2">
                    {contexts.map((c) => (
                        <button
                            type="button"
                            key={c.id}
                            onClick={() => setActiveContextId(c.id)}
                            className={cn(
                                "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                                activeContextId === c.id ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                                        <Pill label={c.status} tone={toneForStatus(c.status)} />
                                        {c.kind === "org" ? <Pill label={`Role: ${c.role}`} tone="neutral" /> : <Pill label="Individual" tone="neutral" />}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">{c.kind === "org" ? "Organization wallet" : "Personal wallet"}</div>
                                </div>
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                    {c.kind === "org" ? <Building2 className="h-5 w-5" /> : <WalletIcon className="h-5 w-5" />}
                                </div>
                            </div>

                            {c.status !== "Active" ? (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                        <div>
                                            <div className="font-semibold text-slate-800">Context signals</div>
                                            <div className="mt-1">Some actions may be limited for this wallet context.</div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </button>
                    ))}
                </div>
            </Modal>

            <BottomSheet
                open={currOpen}
                title="Other currencies"
                subtitle="View and manage multi-currency balances"
                onClose={() => setCurrOpen(false)}
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Globe className="h-4 w-4" /> FX conversions and settlement preferences live here.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setCurrOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    toast({ kind: "success", title: "Open FX", message: "This would open the FX conversion page." });
                                    setCurrOpen(false);
                                }}
                            >
                                <ArrowLeftRight className="h-4 w-4" /> Convert
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {balances.map((b) => (
                        <div key={b.currency} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-900">{b.currency}</div>
                                        {b.fxHint ? <Pill label={b.fxHint} tone={b.fxHint === "Primary" ? "info" : "neutral"} /> : null}
                                    </div>
                                    <div className="mt-2 text-xs font-semibold text-slate-500">Available</div>
                                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{formatMoney(b.available, b.currency)}</div>
                                </div>
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                    <Globe className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="text-xs font-semibold text-slate-500">Pending</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(b.pending, b.currency)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="text-xs font-semibold text-slate-500">Reserved</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(b.reserved, b.currency)}</div>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => toast({ kind: "info", title: "Set primary currency", message: `${b.currency} would be set as primary display currency.` })}
                                >
                                    <ChevronRight className="h-4 w-4" /> Set primary
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => toast({ kind: "info", title: "Open settlement", message: "This would open settlement currency preferences." })}
                                >
                                    <Globe className="h-4 w-4" /> Settlement
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </BottomSheet>

            <Modal
                open={continueOpen}
                title="Continue workflow"
                subtitle="Resume the last pending action with audit-ready steps"
                onClose={() => setContinueOpen(false)}
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Info className="h-4 w-4" /> Every step is logged for traceability.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setContinueOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    toast({ kind: "success", title: "Workflow resumed", message: "This would route to the next step screen." });
                                    setContinueOpen(false);
                                }}
                            >
                                <Sparkles className="h-4 w-4" /> Continue
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{lastAction.type}</div>
                                <div className="mt-1 text-sm text-slate-600">{lastAction.subtitle}</div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Pill label={lastAction.status} tone={lastAction.status === "Pending" ? "info" : "warn"} />
                                    <Pill label={`Context: ${activeContext.label}`} tone="neutral" />
                                </div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-800">
                                <Timer className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                            <div className="font-semibold">Next step</div>
                            <div className="mt-1 text-sm text-slate-600">{lastAction.nextStep}</div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">What happens next</div>
                                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                    <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Confirm beneficiary details</li>
                                    <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Retry payout through your selected provider</li>
                                    <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Record outcome with receipt and references</li>
                                </ul>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => toast({ kind: "info", title: "Open beneficiaries", message: "This would open Beneficiaries and Payout Methods." })}
                                    >
                                        <ChevronRight className="h-4 w-4" /> Beneficiaries
                                    </Button>
                                    <Button
                                        variant="accent"
                                        onClick={() => toast({ kind: "success", title: "Retry payout", message: "This would retry the payout with step-up verification." })}
                                    >
                                        <ArrowUpRight className="h-4 w-4" /> Retry
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Mobile Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={(tab) => {
                setActiveTab(tab);
                if (tab === "wallet") {
                    setSwitcherOpen(true);
                } else if (tab === "add") {
                    toast({ kind: "success", title: "Add Money", message: "This would open the Add Money flow." });
                } else if (tab === "activity") {
                    toast({ kind: "info", title: "Activity", message: "This would open the Transactions page." });
                } else if (tab === "profile") {
                    toast({ kind: "info", title: "Profile", message: "This would open your Profile settings." });
                }
            }} />
        </div>
    );
}
