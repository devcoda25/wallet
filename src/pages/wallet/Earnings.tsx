// ============================================================================
// Earnings Page - Earnings & Settlement Center (w_04)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    DollarSign,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Check,
    AlertTriangle,
    ChevronRight,
    Building2,
    Wallet,
    RefreshCw,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, Chip, Tab, Tabs, LinearProgress } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type EarningsStatus = "Available" | "Pending" | "Processing" | "Settled";

interface EarningsSource {
    id: string;
    name: string;
    type: "service" | "sale" | "commission" | "refund";
    amount: number;
    date: string;
    status: EarningsStatus;
    ref: string;
}

interface Settlement {
    id: string;
    date: string;
    amount: number;
    fee: number;
    status: "Processing" | "Completed" | "Failed";
    destination: string;
    ref: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMoney(amount: number, currency: string = "UGX"): string {
    const abs = Math.abs(amount);
    const isUGX = currency === "UGX";
    const decimals = isUGX ? 0 : 2;
    const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${currency} ${num}`;
}

function toneForStatus(s: EarningsStatus): "good" | "info" | "warn" | "bad" {
    if (s === "Available") return "good";
    if (s === "Pending") return "info";
    if (s === "Processing") return "warn";
    return "bad";
}

function toneForSettlement(s: "Processing" | "Completed" | "Failed"): "info" | "good" | "bad" {
    if (s === "Completed") return "good";
    if (s === "Processing") return "info";
    return "bad";
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
            size="small" className="dark:border dark:border-slate-600"
            sx={{
                backgroundColor: map[tone]?.light,
                color: textMap[tone]?.light,
                fontWeight: 600,
                fontSize: "0.75rem",
                "dark": {
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

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    tone,
}: {
    label: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    tone: "good" | "info" | "warn";
}) {
    const colorClasses: Record<string, string> = {
        good: "bg-emerald-50 text-emerald-700",
        info: "bg-blue-50 text-blue-700",
        warn: "bg-amber-50 text-amber-800",
    };

    return (
        <Card>
            <CardContent>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs font-semibold text-slate-500">{label}</div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
                        <div className="mt-1 text-xs text-slate-600">{subtitle}</div>
                    </div>
                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${colorClasses[tone]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EarningsRow({ item }: { item: EarningsSource }) {
    const Icon = item.type === "service" ? RefreshCw : item.type === "sale" ? DollarSign : item.type === "commission" ? TrendingUp : ArrowDownLeft;

    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">{item.date} • {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-emerald-600">+{formatMoney(item.amount)}</div>
                <div className="text-xs text-slate-500">{item.ref}</div>
            </div>
            <Pill label={item.status} tone={toneForStatus(item.status)} />
        </div>
    );
}

function SettlementRow({ item }: { item: Settlement }) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.status === "Completed" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <ArrowUpRight className={`h-5 w-5 ${item.status === "Completed" ? "text-emerald-600" : "text-amber-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{item.destination}</div>
                <div className="text-xs text-slate-500">{item.date} • Fee: {formatMoney(item.fee)}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">{formatMoney(item.amount)}</div>
                <div className="text-xs text-slate-500">{item.ref}</div>
            </div>
            <Pill label={item.status} tone={toneForSettlement(item.status)} />
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Earnings() {
    const { balances } = useWallet();
    const [tab, setTab] = useState(0);

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    // Mock earnings data
    const earnings = useMemo<EarningsSource[]>(
        () => [
            {
                id: "e1",
                name: "Service booking payment",
                type: "service",
                amount: 150000,
                date: "Today",
                status: "Available",
                ref: "ERN123456",
            },
            {
                id: "e2",
                name: "Product sale #1234",
                type: "sale",
                amount: 85000,
                date: "Today",
                status: "Pending",
                ref: "ERN123457",
            },
            {
                id: "e3",
                name: "Affiliate commission",
                type: "commission",
                amount: 25000,
                date: "Yesterday",
                status: "Available",
                ref: "ERN123458",
            },
            {
                id: "e4",
                name: "Service booking payment",
                type: "service",
                amount: 200000,
                date: "Yesterday",
                status: "Processing",
                ref: "ERN123459",
            },
        ],
        []
    );

    // Mock settlements
    const settlements = useMemo<Settlement[]>(
        () => [
            {
                id: "s1",
                date: "Today 10:30",
                amount: 500000,
                fee: 2500,
                status: "Processing",
                destination: "Stanbic Bank ****3456",
                ref: "STL123456",
            },
            {
                id: "s2",
                date: "Yesterday",
                amount: 350000,
                fee: 1750,
                status: "Completed",
                destination: "MTN Mobile Money ****4567",
                ref: "STL123457",
            },
            {
                id: "s3",
                date: "3 days ago",
                amount: 750000,
                fee: 3750,
                status: "Completed",
                destination: "Stanbic Bank ****3456",
                ref: "STL123458",
            },
        ],
        []
    );

    const totals = useMemo(() => {
        const available = earnings.filter((e) => e.status === "Available").reduce((sum, e) => sum + e.amount, 0);
        const pending = earnings.filter((e) => e.status === "Pending").reduce((sum, e) => sum + e.amount, 0);
        const processing = earnings.filter((e) => e.status === "Processing").reduce((sum, e) => sum + e.amount, 0);
        return { available, pending, processing, total: available + pending + processing };
    }, [earnings]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Earnings & Settlement"
                subtitle="Track your income and withdrawals"
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="Earnings" icon={<DollarSign className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="Settlements" icon={<Building2 className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        label="Available"
                        value={formatMoney(totals.available)}
                        subtitle="Ready to withdraw"
                        icon={Check}
                        tone="good"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        label="Pending"
                        value={formatMoney(totals.pending)}
                        subtitle="Processing"
                        icon={Clock}
                        tone="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        label="In Transit"
                        value={formatMoney(totals.processing)}
                        subtitle="Being settled"
                        icon={RefreshCw}
                        tone="warn"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        label="Total Earnings"
                        value={formatMoney(totals.total)}
                        subtitle="All time"
                        icon={TrendingUp}
                        tone="good"
                    />
                </Grid>
            </Grid>

            {tab === 0 ? (
                <>
                    {/* Earnings Breakdown */}
                    <SectionCard title="Earnings Breakdown" subtitle="This period's income" className="mt-3">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Typography variant="body2" color="text.secondary">
                                    Progress to next payout
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {formatMoney(totals.available)} / {formatMoney(1000000)}
                                </Typography>
                            </div>
                            <LinearProgress
                                variant="determinate"
                                value={(totals.available / 1000000) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <div className="text-xs text-slate-500">
                                {formatMoney(1000000 - totals.available)} more to reach minimum for free transfer
                            </div>
                        </div>
                    </SectionCard>

                    {/* Recent Earnings */}
                    <SectionCard title="Recent Earnings" subtitle="Your latest income" className="mt-3">
                        <div className="space-y-1">
                            {earnings.map((item) => (
                                <EarningsRow key={item.id} item={item} />
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <Button variant="ghost">View All Earnings</Button>
                        </div>
                    </SectionCard>
                </>
            ) : (
                <>
                    {/* Settlement Settings */}
                    <SectionCard title="Settlement Settings" subtitle="Manage your payout preferences" className="mt-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
                                        <Wallet className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Default Payout Method</div>
                                        <div className="text-xs text-slate-500">Stanbic Bank ****3456</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Settlement Schedule</div>
                                        <div className="text-xs text-slate-500">Daily at 4:00 PM</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </SectionCard>

                    {/* Recent Settlements */}
                    <SectionCard title="Recent Settlements" subtitle="Your payout history" className="mt-3">
                        <div className="space-y-1">
                            {settlements.map((item) => (
                                <SettlementRow key={item.id} item={item} />
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <Button variant="ghost">View All Settlements</Button>
                        </div>
                    </SectionCard>
                </>
            )}
        </Box>
    );
}
