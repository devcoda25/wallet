// ============================================================================
// E-Commerce Checkout Page
// Multi-step checkout for e-commerce purchases with policy enforcement
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeftRight,
    BadgeCheck,
    Building2,
    Calendar,
    Check,
    ChevronRight,
    CreditCard,
    Eye,
    FileText,
    Gift,
    Info,
    MapPin,
    Package,
    Phone,
    Receipt,
    RefreshCcw,
    ShieldCheck,
    ShoppingBag,
    Truck,
    User,
    X,
} from "lucide-react";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

type PaymentMethod = "CorporatePay" | "Personal Wallet" | "Card" | "Mobile Money";

type CorporateProgramStatus =
    | "Eligible"
    | "Not linked"
    | "Not eligible"
    | "Deposit depleted"
    | "Credit limit exceeded"
    | "Billing delinquency";

type CorporateState = "Available" | "Requires approval" | "Not available";

type Outcome = "Allowed" | "Approval required" | "Blocked";

type Severity = "Info" | "Warning" | "Critical";

type PolicyReason = {
    id: string;
    severity: Severity;
    code: string;
    title: string;
    detail: string;
};

type AuditWhy = {
    summary: string;
    triggers: Array<{ label: string; value: string }>;
    policyPath: Array<{ step: string; detail: string }>;
    audit: Array<{ label: string; value: string }>;
};

type StepKey = "Cart" | "Delivery" | "Payment" | "Review";

type CartItem = {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPriceUGX: number;
    image?: string;
    sku: string;
    category: string;
};

type DeliveryAddress = {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    instructions?: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

function Button({
    variant = "outline",
    className,
    children,
    onClick,
    disabled,
    title,
    style,
}: {
    variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
    style?: React.CSSProperties;
}) {
    const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
    const variants: Record<string, string> = {
        primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
        accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
        outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
        danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
    };
    const buttonStyle = style || (variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined);

    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            style={buttonStyle}
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

function Stepper({ steps, active, onJump }: { steps: StepKey[]; active: StepKey; onJump: (k: StepKey) => void }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {steps.map((s, idx) => {
                    const isActive = s === active;
                    const stepIdx = steps.indexOf(s);
                    const isCompleted = steps.indexOf(active) > stepIdx;
                    return (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onJump(s)}
                            className={cn(
                                "rounded-2xl border px-3 py-3 text-left transition",
                                isActive ? "border-emerald-300 bg-emerald-50" : isCompleted ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                                        isActive ? "bg-emerald-500 text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                                </div>
                                <div className="text-xs font-semibold text-slate-600">{s}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function computeCorporateState(args: {
    paymentMethod: PaymentMethod;
    corporateStatus: CorporateProgramStatus;
    graceActive: boolean;
    outcome: Outcome;
}): CorporateState {
    const { paymentMethod, corporateStatus, graceActive, outcome } = args;
    if (paymentMethod !== "CorporatePay") return "Available";

    const blockedByProgram =
        corporateStatus === "Not linked" ||
        corporateStatus === "Not eligible" ||
        corporateStatus === "Deposit depleted" ||
        corporateStatus === "Credit limit exceeded" ||
        (corporateStatus === "Billing delinquency" && !graceActive);

    if (blockedByProgram) return "Not available";
    if (outcome === "Blocked") return "Not available";
    if (outcome === "Approval required") return "Requires approval";
    return "Available";
}

function evaluateCheckoutPolicy(args: {
    cartTotalUGX: number;
    paymentMethod: PaymentMethod;
    corporateStatus: CorporateProgramStatus;
    graceActive: boolean;
    hasCostCenter: boolean;
    hasPurpose: boolean;
    hasProjectTag: boolean;
    approvalThresholdUGX: number;
}): {
    outcome: Outcome;
    reasons: PolicyReason[];
    why: AuditWhy;
} {
    const { cartTotalUGX, paymentMethod, corporateStatus, graceActive, hasCostCenter, hasPurpose, hasProjectTag, approvalThresholdUGX } = args;

    const reasons: PolicyReason[] = [];

    // Payment method checks
    if (paymentMethod !== "CorporatePay") {
        reasons.push({ id: uid("r"), severity: "Info", code: "PAYMENT", title: "Personal payment selected", detail: "Corporate policy checks do not apply to personal payments." });
    } else {
        const blockedByProgram =
            corporateStatus === "Not linked" ||
            corporateStatus === "Not eligible" ||
            corporateStatus === "Deposit depleted" ||
            corporateStatus === "Credit limit exceeded" ||
            (corporateStatus === "Billing delinquency" && !graceActive);

        if (corporateStatus === "Billing delinquency" && graceActive) {
            reasons.push({ id: uid("r"), severity: "Warning", code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace window is active." });
        }

        if (blockedByProgram) {
            reasons.push({ id: uid("r"), severity: "Critical", code: "PROGRAM", title: "CorporatePay unavailable", detail: `CorporatePay is unavailable due to: ${corporateStatus}.` });
        }

        // Required allocation fields
        if (!hasCostCenter) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Cost center required", detail: "Select a cost center for purchase allocation." });
        if (!hasPurpose) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Purpose required", detail: "Select a purpose tag for this purchase." });
        if (!hasProjectTag) reasons.push({ id: uid("r"), severity: "Info", code: "FIELDS", title: "Project tag optional", detail: "Project tag is optional unless your organization requires it." });
    }

    // Amount checks
    if (paymentMethod === "CorporatePay" && cartTotalUGX > approvalThresholdUGX) {
        reasons.push({
            id: uid("r"),
            severity: "Warning",
            code: "AMOUNT",
            title: "Approval required",
            detail: `Cart total ${formatUGX(cartTotalUGX)} exceeds threshold ${formatUGX(approvalThresholdUGX)}.`,
        });
    }

    // Determine outcome
    const hasCritical = reasons.some((r) => r.severity === "Critical");
    const hasWarning = reasons.some((r) => r.severity === "Warning");

    let outcome: Outcome = "Allowed";
    if (paymentMethod === "CorporatePay") {
        if (hasCritical) outcome = "Blocked";
        else if (hasWarning) outcome = "Approval required";
        else outcome = "Allowed";
    } else {
        outcome = hasCritical ? "Blocked" : "Allowed";
    }

    const why: AuditWhy = {
        summary: "E-commerce checkout result is generated from cart policy, allocation requirements, and CorporatePay program status.",
        triggers: [
            { label: "Cart total", value: formatUGX(cartTotalUGX) },
            { label: "Payment", value: paymentMethod },
            { label: "Program", value: corporateStatus + (graceActive ? " (grace active)" : "") },
            { label: "Threshold", value: formatUGX(approvalThresholdUGX) },
        ],
        policyPath: [
            { step: "Payment method", detail: paymentMethod === "CorporatePay" ? "CorporatePay selected" : "Personal payment" },
            { step: "Program status", detail: corporateStatus },
            { step: "Allocation", detail: hasCostCenter && hasPurpose ? "Complete" : "Missing required fields" },
            { step: "Decision", detail: outcome },
        ],
        audit: [
            { label: "Correlation id", value: `corr_ecom_${Date.now().toString(36)}` },
            { label: "Policy snapshot", value: "corp.ecommerce.policy.v1" },
            { label: "Timestamp", value: new Date().toISOString() },
        ],
    };

    if (!reasons.length) {
        reasons.push({ id: uid("r"), severity: "Info", code: "OK", title: "Within policy", detail: "This purchase passes current policy checks." });
    }

    return { outcome, reasons, why };
}

// Mock data
const mockCartItems: CartItem[] = [
    {
        id: "item1",
        name: "Office Ergonomic Chair",
        description: "High-back mesh chair with lumbar support",
        quantity: 2,
        unitPriceUGX: 450000,
        sku: "FURN-CHAIR-001",
        category: "Furniture",
    },
    {
        id: "item2",
        name: "Standing Desk Converter",
        description: "Adjustable sit-stand desk riser",
        quantity: 1,
        unitPriceUGX: 680000,
        sku: "FURN-DESK-002",
        category: "Furniture",
    },
    {
        id: "item3",
        name: "Wireless Keyboard & Mouse Combo",
        description: "Logitech MX Keys + MX Master 3",
        quantity: 5,
        unitPriceUGX: 185000,
        sku: "ELEC-KB-MS-003",
        category: "Electronics",
    },
];

const mockAddresses: DeliveryAddress[] = [
    {
        name: "Main Office",
        phone: "+256 701 234 567",
        address: "Plot 12, Kampala Road",
        city: "Kampala",
        country: "Uganda",
        instructions: "Delivery to reception, call 15 min before",
    },
    {
        name: "Warehouse",
        phone: "+256 702 345 678",
        address: "Industrial Area, Block B",
        city: "Kampala",
        country: "Uganda",
    },
];

const mockCostCenters = [
    { code: "CC-001", name: "Engineering" },
    { code: "CC-002", name: "Marketing" },
    { code: "CC-003", name: "Operations" },
    { code: "CC-004", name: "General Admin" },
];

const mockPurposes = [
    { code: "PUR-001", name: "Office Supplies" },
    { code: "PUR-002", name: "Equipment" },
    { code: "PUR-003", name: "Furniture" },
    { code: "PUR-004", name: "IT Infrastructure" },
];

const mockProjectTags = [
    { code: "PROJ-001", name: "Q1 Office Setup" },
    { code: "PROJ-002", name: "Remote Work Initiative" },
    { code: "PROJ-003", name: "None" },
];

export default function EcommerceCheckout() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = (t: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
        window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
    };

    const steps: StepKey[] = ["Cart", "Delivery", "Payment", "Review"];
    const [activeStep, setActiveStep] = useState<StepKey>("Cart");

    // Cart state
    const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);

    // Delivery state
    const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress>(mockAddresses[0]);
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");
    const [selectedCostCenter, setSelectedCostCenter] = useState("");
    const [selectedPurpose, setSelectedPurpose] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
    const [graceActive] = useState(false);
    const [approvalThresholdUGX] = useState(5000000);

    // Review state
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyResult, setPolicyResult] = useState<ReturnType<typeof evaluateCheckoutPolicy> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);

    // Computed values
    const subtotalUGX = cartItems.reduce((sum, item) => sum + item.unitPriceUGX * item.quantity, 0);
    const shippingUGX = 25000;
    const taxUGX = Math.round(subtotalUGX * 0.18);
    const totalUGX = subtotalUGX + shippingUGX + taxUGX;

    const { outcome: policyOutcome, reasons: policyReasons, why: policyWhy } = useMemo(
        () =>
            evaluateCheckoutPolicy({
                cartTotalUGX: totalUGX,
                paymentMethod,
                corporateStatus,
                graceActive,
                hasCostCenter: !!selectedCostCenter,
                hasPurpose: !!selectedPurpose,
                hasProjectTag: !!selectedProject,
                approvalThresholdUGX,
            }),
        [totalUGX, paymentMethod, corporateStatus, graceActive, selectedCostCenter, selectedPurpose, selectedProject, approvalThresholdUGX]
    );

    const corporateState = useMemo(
        () =>
            computeCorporateState({
                paymentMethod,
                corporateStatus,
                graceActive,
                outcome: policyOutcome,
            }),
        [paymentMethod, corporateStatus, graceActive, policyOutcome]
    );

    const handleQuantityChange = (itemId: string, delta: number) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
            ).filter((item) => item.quantity > 0)
        );
    };

    const handleRemoveItem = (itemId: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        toast({ kind: "info", title: "Item removed", message: "Item has been removed from cart." });
    };

    const handleProceedToPayment = () => {
        if (cartItems.length === 0) {
            toast({ kind: "warn", title: "Cart empty", message: "Add items to your cart before proceeding." });
            return;
        }
        setActiveStep("Payment");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleProceedToReview = () => {
        setActiveStep("Review");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePlaceOrder = () => {
        setIsProcessing(true);

        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            setSuccessModalOpen(true);
            toast({ kind: "success", title: "Order placed", message: "Your order has been successfully submitted." });
        }, 2000);
    };

    const handleViewPolicy = () => {
        setPolicyResult({ outcome: policyOutcome, reasons: policyReasons, why: policyWhy });
        setPolicyModalOpen(true);
    };

    const canProceed = () => {
        if (activeStep === "Cart") return cartItems.length > 0;
        if (activeStep === "Payment") {
            if (paymentMethod === "CorporatePay") {
                return selectedCostCenter && selectedPurpose && corporateState !== "Not available";
            }
            return true;
        }
        return true;
    };

    return (
        <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.12), rgba(255,255,255,0))" }}>
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
                {/* Header */}
                <div className="mb-6 rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-slate-900">E-Commerce Checkout</div>
                                <div className="mt-1 text-sm text-slate-500">Complete your purchase with policy enforcement</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="px-4 py-4 md:px-6">
                        <Stepper steps={steps} active={activeStep} onJump={(s) => setActiveStep(s)} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {/* Cart Step */}
                            {activeStep === "Cart" && (
                                <motion.div
                                    key="cart"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-slate-600" />
                                                <div className="text-lg font-semibold text-slate-900">Shopping Cart</div>
                                            </div>
                                            <Pill label={`${cartItems.length} items`} tone="neutral" />
                                        </div>

                                        {cartItems.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
                                                <div className="mt-4 text-lg font-semibold text-slate-900">Your cart is empty</div>
                                                <div className="mt-2 text-sm text-slate-500">Add items to continue with checkout</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {cartItems.map((item) => (
                                                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                                                                    <Pill label={item.category} tone="neutral" />
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-500">SKU: {item.sku}</div>
                                                                <div className="mt-2 text-sm text-slate-600">{item.description}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-semibold text-slate-900">{formatUGX(item.unitPriceUGX)}</div>
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuantityChange(item.id, -1)}
                                                                        className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <div className="w-8 text-center text-sm font-semibold">{item.quantity}</div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuantityChange(item.id, 1)}
                                                                        className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                                                            <div className="text-xs text-slate-500">
                                                                Subtotal: {formatUGX(item.unitPriceUGX * item.quantity)}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-sm text-rose-600 hover:text-rose-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Continue Button */}
                                    <div className="flex justify-end">
                                        <Button
                                            variant="primary"
                                            onClick={handleProceedToPayment}
                                            disabled={cartItems.length === 0}
                                        >
                                            Continue to Payment <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Delivery Step */}
                            {activeStep === "Delivery" && (
                                <motion.div
                                    key="delivery"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-slate-600" />
                                                <div className="text-lg font-semibold text-slate-900">Delivery Address</div>
                                            </div>
                                            <Button variant="outline" onClick={() => setAddressModalOpen(true)}>
                                                <MapPin className="h-4 w-4" /> Change
                                            </Button>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-slate-900">{selectedAddress.name}</div>
                                                        <Pill label="Default" tone="info" />
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-600">{selectedAddress.address}</div>
                                                    <div className="mt-1 text-sm text-slate-600">
                                                        {selectedAddress.city}, {selectedAddress.country}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                                                        <Phone className="h-3 w-3" /> {selectedAddress.phone}
                                                    </div>
                                                    {selectedAddress.instructions && (
                                                        <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800">
                                                            <Info className="mr-1 inline h-3 w-3" />
                                                            {selectedAddress.instructions}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Options */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-slate-600" />
                                            <div className="text-lg font-semibold text-slate-900">Delivery Options</div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            {[
                                                { name: "Standard Delivery", time: "3-5 business days", price: "Free", icon: Truck },
                                                { name: "Express Delivery", time: "1-2 business days", price: "UGX 50,000", icon: Package },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.name}
                                                    type="button"
                                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                                                            <opt.icon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{opt.name}</div>
                                                            <div className="mt-1 text-xs text-slate-500">{opt.time}</div>
                                                            <div className="mt-1 text-sm font-medium text-slate-900">{opt.price}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Payment Step */}
                            {activeStep === "Payment" && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {/* Payment Method Selection */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-slate-600" />
                                                <div className="text-lg font-semibold text-slate-900">Payment Method</div>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            {(["CorporatePay", "Personal Wallet", "Card", "Mobile Money"] as PaymentMethod[]).map((pm) => (
                                                <button
                                                    key={pm}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(pm)}
                                                    className={cn(
                                                        "rounded-2xl border p-4 text-left transition",
                                                        paymentMethod === pm
                                                            ? "border-emerald-300 bg-emerald-50"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "grid h-10 w-10 place-items-center rounded-2xl",
                                                                pm === "CorporatePay" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                                            )}
                                                        >
                                                            {pm === "CorporatePay" ? <Building2 className="h-5 w-5" /> : pm === "Personal Wallet" ? <Receipt className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{pm}</div>
                                                            {pm === "CorporatePay" && (
                                                                <div className="mt-1 text-xs">
                                                                    <span className={cn("inline-flex rounded px-1.5 py-0.5", corporateStatus === "Eligible" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                                                        {corporateStatus}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {paymentMethod === pm && (
                                                            <div className="ml-auto">
                                                                <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                                                                    <Check className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CorporatePay Allocation */}
                                    {paymentMethod === "CorporatePay" && (
                                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4 flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-slate-600" />
                                                <div className="text-lg font-semibold text-slate-900">Cost Allocation</div>
                                                <Pill label="Required" tone="warn" />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">Cost Center</label>
                                                    <select
                                                        value={selectedCostCenter}
                                                        onChange={(e) => setSelectedCostCenter(e.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                                                    >
                                                        <option value="">Select cost center...</option>
                                                        {mockCostCenters.map((cc) => (
                                                            <option key={cc.code} value={cc.code}>
                                                                {cc.code} - {cc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">Purpose</label>
                                                    <select
                                                        value={selectedPurpose}
                                                        onChange={(e) => setSelectedPurpose(e.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                                                    >
                                                        <option value="">Select purpose...</option>
                                                        {mockPurposes.map((p) => (
                                                            <option key={p.code} value={p.code}>
                                                                {p.code} - {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">Project Tag (Optional)</label>
                                                    <select
                                                        value={selectedProject}
                                                        onChange={(e) => setSelectedProject(e.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                                                    >
                                                        <option value="">Select project (optional)...</option>
                                                        {mockProjectTags.map((p) => (
                                                            <option key={p.code} value={p.code}>
                                                                {p.code} - {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">Approval Threshold</label>
                                                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                                        <Info className="h-4 w-4 text-slate-500" />
                                                        <span className="text-sm text-slate-700">{formatUGX(approvalThresholdUGX)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Policy Summary */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5 text-slate-600" />
                                                <div className="text-lg font-semibold text-slate-900">Policy Status</div>
                                            </div>
                                            <Button variant="outline" onClick={handleViewPolicy}>
                                                <Eye className="h-4 w-4" /> View Details
                                            </Button>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2">
                                                <Pill
                                                    label={policyOutcome}
                                                    tone={policyOutcome === "Allowed" ? "good" : policyOutcome === "Approval required" ? "warn" : "bad"}
                                                />
                                                {policyReasons.some((r) => r.severity === "Critical") && (
                                                    <Pill label="Action Required" tone="bad" />
                                                )}
                                            </div>
                                            {policyReasons.length > 0 && (
                                                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                                                    {policyReasons.slice(0, 3).map((r) => (
                                                        <li key={r.id} className="flex items-start gap-2">
                                                            <AlertTriangle
                                                                className={cn(
                                                                    "mt-0.5 h-4 w-4 flex-shrink-0",
                                                                    r.severity === "Critical" ? "text-rose-500" : r.severity === "Warning" ? "text-amber-500" : "text-blue-500"
                                                                )}
                                                            />
                                                            <span>{r.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Review Step */}
                            {activeStep === "Review" && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {/* Order Summary */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Receipt className="h-5 w-5 text-slate-600" />
                                            <div className="text-lg font-semibold text-slate-900">Order Summary</div>
                                        </div>

                                        <div className="space-y-3">
                                            {cartItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{item.name}</div>
                                                        <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                                                    </div>
                                                    <div className="font-semibold text-slate-900">{formatUGX(item.unitPriceUGX * item.quantity)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 border-t border-slate-200 pt-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Subtotal</span>
                                                <span className="font-medium text-slate-900">{formatUGX(subtotalUGX)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Shipping</span>
                                                <span className="font-medium text-slate-900">{formatUGX(shippingUGX)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Tax (18%)</span>
                                                <span className="font-medium text-slate-900">{formatUGX(taxUGX)}</span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                                                <span className="text-lg font-semibold text-slate-900">Total</span>
                                                <span className="text-lg font-semibold text-slate-900" style={{ color: EVZ.green }}>
                                                    {formatUGX(totalUGX)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-slate-600" />
                                            <div className="text-lg font-semibold text-slate-900">Payment Details</div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="rounded-xl bg-slate-50 p-4">
                                                <div className="text-xs text-slate-500">Payment Method</div>
                                                <div className="mt-1 font-medium text-slate-900">{paymentMethod}</div>
                                            </div>
                                            {paymentMethod === "CorporatePay" && (
                                                <>
                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <div className="text-xs text-slate-500">Cost Center</div>
                                                        <div className="mt-1 font-medium text-slate-900">{selectedCostCenter}</div>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <div className="text-xs text-slate-500">Purpose</div>
                                                        <div className="mt-1 font-medium text-slate-900">{selectedPurpose}</div>
                                                    </div>
                                                    {selectedProject && (
                                                        <div className="rounded-xl bg-slate-50 p-4">
                                                            <div className="text-xs text-slate-500">Project Tag</div>
                                                            <div className="mt-1 font-medium text-slate-900">{selectedProject}</div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery Details */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-slate-600" />
                                            <div className="text-lg font-semibold text-slate-900">Delivery Details</div>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{selectedAddress.name}</div>
                                                    <div className="mt-1 text-sm text-slate-600">{selectedAddress.address}</div>
                                                    <div className="mt-1 text-sm text-slate-600">
                                                        {selectedAddress.city}, {selectedAddress.country}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex items-center justify-between">
                            {activeStep !== "Cart" && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const idx = steps.indexOf(activeStep);
                                        if (idx > 0) setActiveStep(steps[idx - 1]);
                                    }}
                                >
                                    Back
                                </Button>
                            )}

                            <div className="ml-auto flex gap-2">
                                {activeStep === "Cart" && (
                                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Continue shopping", message: "This would open the store." })}>
                                        <ShoppingBag className="h-4 w-4" /> Continue Shopping
                                    </Button>
                                )}

                                {activeStep === "Delivery" && (
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setActiveStep("Payment");
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                    >
                                        Continue <ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}

                                {activeStep === "Payment" && (
                                    <Button
                                        variant="primary"
                                        onClick={handleProceedToReview}
                                        disabled={!canProceed()}
                                    >
                                        Review Order <ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}

                                {activeStep === "Review" && (
                                    <Button
                                        variant="primary"
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing || policyOutcome === "Blocked"}
                                        style={{ background: policyOutcome === "Approval required" ? EVZ.orange : EVZ.green }}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCcw className="h-4 w-4 animate-spin" /> Processing...
                                            </>
                                        ) : policyOutcome === "Approval required" ? (
                                            <>
                                                <BadgeCheck className="h-4 w-4" /> Submit for Approval
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" /> Place Order
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary Card (sticky on desktop) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                                <Gift className="h-5 w-5 text-slate-600" />
                                <div className="text-lg font-semibold text-slate-900">Order Summary</div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Items ({cartItems.length})</span>
                                    <span className="font-medium text-slate-900">{formatUGX(subtotalUGX)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Shipping</span>
                                    <span className="font-medium text-slate-900">{formatUGX(shippingUGX)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Tax</span>
                                    <span className="font-medium text-slate-900">{formatUGX(taxUGX)}</span>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-slate-900">Total</span>
                                    <span className="text-lg font-semibold text-slate-900" style={{ color: EVZ.green }}>
                                        {formatUGX(totalUGX)}
                                    </span>
                                </div>
                            </div>

                            {/* Policy Status */}
                            <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-slate-600" />
                                    <span className="text-sm font-medium text-slate-700">Policy Check</span>
                                </div>
                                <div className="mt-2">
                                    <Pill
                                        label={policyOutcome}
                                        tone={policyOutcome === "Allowed" ? "good" : policyOutcome === "Approval required" ? "warn" : "bad"}
                                    />
                                </div>
                                {policyOutcome === "Approval required" && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        This order will be submitted for manager approval before processing.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Policy Modal */}
            <Modal
                open={policyModalOpen}
                title="Policy Evaluation Result"
                subtitle="Detailed policy check results"
                onClose={() => setPolicyModalOpen(false)}
                maxW="720px"
            >
                {policyResult && (
                    <div className="space-y-6">
                        {/* Outcome */}
                        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                            <div
                                className={cn(
                                    "grid h-12 w-12 place-items-center rounded-2xl",
                                    policyResult.outcome === "Allowed" ? "bg-emerald-100 text-emerald-700" : policyResult.outcome === "Approval required" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                )}
                            >
                                {policyResult.outcome === "Allowed" ? <Check className="h-6 w-6" /> : <BadgeCheck className="h-6 w-6" />}
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-slate-900">{policyResult.outcome}</div>
                                <div className="text-sm text-slate-600">{policyResult.why.summary}</div>
                            </div>
                        </div>

                        {/* Reasons */}
                        <div>
                            <div className="mb-3 text-sm font-semibold text-slate-700">Policy Reasons</div>
                            <div className="space-y-2">
                                {policyResult.reasons.map((r) => (
                                    <div
                                        key={r.id}
                                        className={cn(
                                            "flex items-start gap-3 rounded-xl p-3",
                                            r.severity === "Critical" ? "bg-rose-50" : r.severity === "Warning" ? "bg-amber-50" : "bg-blue-50"
                                        )}
                                    >
                                        <AlertTriangle
                                            className={cn(
                                                "mt-0.5 h-5 w-5 flex-shrink-0",
                                                r.severity === "Critical" ? "text-rose-600" : r.severity === "Warning" ? "text-amber-600" : "text-blue-600"
                                            )}
                                        />
                                        <div>
                                            <div className="font-medium text-slate-900">{r.title}</div>
                                            <div className="mt-1 text-sm text-slate-600">{r.detail}</div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Pill label={r.code} tone="neutral" />
                                                <Pill label={r.severity} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "info"} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why Section */}
                        <div>
                            <div className="mb-3 text-sm font-semibold text-slate-700">Audit Trail</div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500">Triggers</div>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {policyResult.why.triggers.map((t) => (
                                            <div key={t.label} className="rounded-lg bg-slate-50 p-2">
                                                <div className="text-xs text-slate-500">{t.label}</div>
                                                <div className="text-sm font-medium text-slate-900">{t.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-xs text-slate-500">Policy Path</div>
                                    <div className="mt-2 space-y-2">
                                        {policyResult.why.policyPath.map((p, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                <span className="text-sm text-slate-600">{p.step}:</span>
                                                <span className="text-sm font-medium text-slate-900">{p.detail}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500">Audit</div>
                                    <div className="mt-2 space-y-1">
                                        {policyResult.why.audit.map((a) => (
                                            <div key={a.label} className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">{a.label}</span>
                                                <span className="font-mono text-slate-900">{a.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Success Modal */}
            <Modal
                open={successModalOpen}
                title="Order Placed Successfully!"
                subtitle="Your order has been submitted"
                onClose={() => setSuccessModalOpen(false)}
                maxW="520px"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="h-10 w-10" />
                        </div>
                        <div className="mt-4 text-xl font-semibold text-slate-900">Thank you for your order!</div>
                        <div className="mt-2 text-center text-sm text-slate-600">
                            {policyOutcome === "Approval required"
                                ? "Your order has been submitted for manager approval. You'll receive a notification once approved."
                                : "Your order has been confirmed and will be processed shortly."}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-500">Order Number</div>
                                <div className="mt-1 font-mono text-sm font-medium text-slate-900">ORD-{Date.now().toString(36).toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Total</div>
                                <div className="mt-1 font-semibold text-slate-900">{formatUGX(totalUGX)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Payment</div>
                                <div className="mt-1 text-sm font-medium text-slate-900">{paymentMethod}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Status</div>
                                <div className="mt-1">
                                    <Pill label={policyOutcome === "Approval required" ? "Pending Approval" : "Confirmed"} tone={policyOutcome === "Approval required" ? "warn" : "good"} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => toast({ kind: "info", title: "Order details", message: "This would open order details." })}
                            className="flex-1"
                        >
                            <Receipt className="h-4 w-4" /> View Order
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setSuccessModalOpen(false);
                                setCartItems([]);
                                setActiveStep("Cart");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                toast({ kind: "success", title: "New order", message: "Start shopping for your next order." });
                            }}
                            className="flex-1"
                        >
                            <ShoppingBag className="h-4 w-4" /> Continue Shopping
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
