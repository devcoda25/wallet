// ============================================================================
// Wallet Dashboard Page - Personal Wallet Dashboard (w_03)
// ============================================================================

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wallet as WalletIcon,
    ChevronRight,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    AlertTriangle,
    Check,
    CreditCard,
    ArrowLeftRight,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed";

interface Tx {
    id: string;
    title: string;
    subtitle: string;
    when: string;
    status: TxStatus;
    amount: number;
    direction: "in" | "out";
    module: "E-Commerce" | "EV Charging" | "Rides" | "Services" | "Finance";
}

interface UpcomingItem {
    id: string;
    title: string;
    subtitle: string;
    when: string;
    tone: "info" | "warn" | "good";
    cta: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMoney(amount: number, currency: string = "UGX"): string {
    const abs = Math.abs(amount);
    const isUGX = currency === "UGX";
    const decimals = isUGX ? 0 : 2;
    const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const sign = amount < 0 ? "-" : "";
    return `${sign}${currency} ${num}`;
}

function toneForStatus(s: TxStatus): "good" | "info" | "warn" | "bad" {
    if (s === "Completed") return "good";
    if (s === "Pending") return "info";
    if (s === "Failed") return "bad";
    return "warn";
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
    const map: Record<string, { light: string; dark: string }> = {
        good: { light: "#ecfdf5", dark: "#064e3b" },
        warn: { light: "#fffbeb", dark: "#78350f" },
        bad: { light: "#fff1f2", dark: "#881337" },
        info: { light: "#eff6ff", dark: "#1e3a8a" },
        neutral: { light: "#f8fafc", dark: "#1e293b" },
    };
    const textMap: Record<string, { light: string; dark: string }> = {
        good: { light: "#047857", dark: "#34d399" },
        warn: { light: "#b45309", dark: "#fbbf24" },
        bad: { light: "#e11d48", dark: "#fda4af" },
        info: { light: "#1d4ed8", dark: "#60a5fa" },
        neutral: { light: "#475569", dark: "#cbd5e1" },
    };
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                backgroundColor: map[tone]?.light,
                color: textMap[tone]?.light,
                fontWeight: 600,
                fontSize: "0.75rem",
                "@media (prefers-color-scheme: dark)": {
                    backgroundColor: map[tone]?.dark,
                    color: textMap[tone]?.dark,
                },
            }}
        />
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatTile({
    label,
    value,
    hint,
    tone,
    icon: Icon,
}: {
    label: string;
    value: string;
    hint: string;
    tone: "good" | "info" | "warn" | "bad";
    icon: React.ElementType;
}) {
    const bg =
        tone === "good"
            ? "bg-emerald-50 text-emerald-700"
            : tone === "warn"
                ? "bg-amber-50 text-amber-800"
                : tone === "bad"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-blue-50 text-blue-700";

    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</div>
                    </div>
                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${bg}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TxRow({ tx }: { tx: Tx }) {
    const Icon = tx.direction === "in" ? ArrowDownLeft : ArrowUpRight;
    const amountColor = tx.direction === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100";

    return (
        <div className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tx.direction === "in" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-700"}`}>
                <Icon className={`h-5 w-5 ${tx.direction === "in" ? "text-emerald-600" : "text-slate-600 dark:text-slate-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.title}</div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">{tx.subtitle}</div>
            </div>
            <div className="text-right">
                <div className={`text-sm font-semibold ${amountColor}`}>
                    {tx.direction === "out" ? "-" : "+"}{formatMoney(tx.amount)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{tx.when}</div>
            </div>
            <Pill label={tx.status} tone={toneForStatus(tx.status)} />
        </div>
    );
}

function UpcomingCard({ item }: { item: UpcomingItem }) {
    const Icon = item.tone === "warn" ? AlertTriangle : item.tone === "good" ? Check : Clock;

    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className={`grid h-8 w-8 place-items-center rounded-xl ${item.tone === "warn" ? "bg-amber-50 dark:bg-amber-900/30" : item.tone === "good" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-blue-50 dark:bg-blue-900/30"
                }`}>
                <Icon className={`h-4 w-4 ${item.tone === "warn" ? "text-amber-600" : item.tone === "good" ? "text-emerald-600" : "text-blue-600"
                    }`} />
            </div>
            <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.when}</div>
            </div>
            <Button variant="ghost" size="sm">
                {item.cta}
            </Button>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function WalletDashboard() {
    const navigate = useNavigate();
    const { balances, kycTier } = useWallet();

    const totals = useMemo(() => {
        const primary = balances.find((b) => b.currency === "UGX");
        return {
            availableUGX: primary?.available || 0,
            pendingUGX: primary?.pending || 0,
            reservedUGX: primary?.reserved || 0,
        };
    }, [balances]);

    // Mock upcoming items
    const upcoming = useMemo<UpcomingItem[]>(() => [
        {
            id: "up1",
            title: "Scheduled withdrawal",
            subtitle: "UGX 450,000 to Bank Account",
            when: "Tomorrow 09:00",
            tone: "info",
            cta: "Manage",
        },
        {
            id: "up2",
            title: "Recurring top-up",
            subtitle: "UGX 50,000 every Monday",
            when: "Next run: Monday",
            tone: "good",
            cta: "Edit",
        },
        {
            id: "up3",
            title: "Verification pending",
            subtitle: "Upload ID to unlock higher limits",
            when: "Action required",
            tone: "warn",
            cta: "Complete",
        },
    ], []);

    // Mock transactions
    const txSeed = useMemo<Tx[]>(() => [
        {
            id: "t1",
            title: "Service booking payment",
            subtitle: "Home solar audit",
            when: "Today 11:18",
            status: "Completed",
            amount: 68000,
            direction: "out",
            module: "Services",
        },
        {
            id: "t2",
            title: "Creator earnings",
            subtitle: "Shoppable Adz commission",
            when: "Today 09:40",
            status: "Pending",
            amount: 120000,
            direction: "in",
            module: "Finance",
        },
        {
            id: "t3",
            title: "Top-up",
            subtitle: "Card deposit",
            when: "Yesterday 18:05",
            status: "Completed",
            amount: 300000,
            direction: "in",
            module: "Finance",
        },
        {
            id: "t4",
            title: "EV charging",
            subtitle: "Session at Nsambya",
            when: "Yesterday 07:24",
            status: "Completed",
            amount: 18000,
            direction: "out",
            module: "EV Charging",
        },
        {
            id: "t5",
            title: "Rides",
            subtitle: "Office to airport",
            when: "3 days ago",
            status: "Completed",
            amount: 42000,
            direction: "out",
            module: "Rides",
        },
    ], []);

    const [filter, setFilter] = useState<"All" | "In" | "Out" | "Pending">("All");
    const filteredTx = useMemo(() => {
        if (filter === "All") return txSeed;
        if (filter === "Pending") return txSeed.filter((t) => t.status === "Pending");
        if (filter === "In") return txSeed.filter((t) => t.direction === "in");
        return txSeed.filter((t) => t.direction === "out");
    }, [filter, txSeed]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Personal Wallet"
                subtitle="Your main wallet for payments, earnings, and payouts"
            >
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Pill label={`KYC: Tier ${kycTier}`} tone={kycTier >= 2 ? "good" : "warn"} />
                    <Pill label={`Available: ${formatMoney(totals.availableUGX)}`} tone="neutral" />
                    <Pill label={`Pending: ${formatMoney(totals.pendingUGX)}`} tone="info" />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button variant="outline" onClick={() => navigate("/home")}>
                        <ChevronRight className="h-4 w-4" /> Wallet Home
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/settings/security")}>
                        <ShieldCheck className="h-4 w-4" /> Security
                    </Button>
                </div>
            </SectionCard>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile
                        label="Available"
                        value={formatMoney(totals.availableUGX)}
                        hint="Ready to use"
                        tone="good"
                        icon={WalletIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile
                        label="Pending"
                        value={formatMoney(totals.pendingUGX)}
                        hint="Processing"
                        tone="info"
                        icon={Clock}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile
                        label="Reserved"
                        value={formatMoney(totals.reservedUGX)}
                        hint="On hold"
                        tone="warn"
                        icon={CreditCard}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile
                        label="Total Currencies"
                        value={balances.length.toString()}
                        hint="Multi-currency wallet"
                        tone="info"
                        icon={ArrowLeftRight}
                    />
                </Grid>
            </Grid>

            {/* Upcoming & Quick Actions */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                    <SectionCard title="Upcoming" subtitle="Scheduled actions">
                        <div className="space-y-2">
                            {upcoming.map((item) => (
                                <UpcomingCard key={item.id} item={item} />
                            ))}
                        </div>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} md={8}>
                    <SectionCard
                        title="Recent Transactions"
                        subtitle={`${filteredTx.length} transactions`}
                        right={
                            <div className="flex gap-1">
                                {(["All", "In", "Out", "Pending"] as const).map((f) => (
                                    <Button
                                        key={f}
                                        variant={filter === f ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setFilter(f)}
                                    >
                                        {f}
                                    </Button>
                                ))}
                            </div>
                        }
                    >
                        <div className="space-y-1">
                            {filteredTx.map((tx) => (
                                <TxRow key={tx.id} tx={tx} />
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <Button variant="ghost" onClick={() => navigate("/wallet/transactions")}>
                                View All Transactions
                            </Button>
                        </div>
                    </SectionCard>
                </Grid>
            </Grid>

            {/* Multi-Currency Overview */}
            <div className="mt-3">
                <SectionCard title="All Currencies" subtitle="Your wallet balances across currencies">
                    <Grid container spacing={2}>
                        {balances.map((balance) => (
                            <Grid item xs={6} sm={3} key={balance.currency}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: "center" }}>
                                        <Typography variant="h5" fontWeight="bold">
                                            {formatMoney(balance.available, balance.currency)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {balance.currency}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {balance.pending > 0 ? `Pending: ${formatMoney(balance.pending, balance.currency)}` : "Available"}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </SectionCard>
            </div>
        </Box>
    );
}
