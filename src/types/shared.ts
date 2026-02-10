// ============================================================================
// Shared Types for Unified Wallet App
// ============================================================================

// -- Currency & Money --

export type Currency = "UGX" | "USD" | "CNY" | "KES";

export function formatMoney(amount: number, currency: Currency): string {
    const abs = Math.abs(amount);
    const isUGX = currency === "UGX";
    const decimals = isUGX ? 0 : 2;
    const num = abs.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    const sign = amount < 0 ? "-" : "";
    return `${sign}${currency} ${num}`;
}

export function formatUGX(amount: number): string {
    const abs = Math.abs(amount);
    const num = abs.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const sign = amount < 0 ? "-" : "";
    return `${sign}UGX ${num}`;
}

// -- Toast & Notifications --

export type ToastKind = "success" | "warn" | "error" | "info";

export type Toast = {
    id: string;
    title: string;
    message?: string;
    kind: ToastKind;
};

// -- Common Status Types --

export type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed" | "Disputed";
export type TxType = "Deposit" | "Withdrawal" | "Payment" | "Refund" | "FX" | "Transfer" | "Settlement" | "Chargeback";
export type Severity = "Info" | "Warning" | "Critical";

// -- Pagination & Filters --

export type DateRange = "7D" | "30D" | "90D" | "YTD";

// -- Payment Methods --

export type PaymentMethod =
    | "CorporatePay"
    | "Personal Wallet"
    | "Card"
    | "Mobile Money"
    | "Bank Transfer"
    | "WeChat Pay"
    | "Alipay"
    | "UnionPay"
    | "Organization Wallet";

export type PayoutMethod = "Bank" | "Mobile Money" | "China Settlement";

// -- UI Primitives --

export type PillTone = "good" | "warn" | "bad" | "info" | "neutral" | "accent";
export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";

// -- Date Utilities --

export function timeAgo(ts: number): string {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
}

export function msToFriendly(ms: number): string {
    if (ms <= 0) return "0m";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
}

export function fmtDateTime(ts: number | string): string {
    return new Date(ts).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
