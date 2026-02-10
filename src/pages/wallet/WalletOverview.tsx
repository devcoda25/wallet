// ============================================================================
// Wallet Overview Page - Multi-Wallet Overview (w_01)
// ============================================================================

import React, { useMemo } from "react";
import {
    Wallet,
    ChevronRight,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Building2,
    Smartphone,
    Globe,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, Chip, Divider } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type WalletType = "personal" | "business" | "corporate";

interface WalletInfo {
    id: string;
    name: string;
    type: WalletType;
    currency: string;
    available: number;
    pending: number;
    icon: React.ElementType;
    color: string;
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

function WalletCard({ wallet }: { wallet: WalletInfo }) {
    const Icon = wallet.icon;

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md"
            sx={{
                border: "1px solid #e2e8f0",
                "&:hover": {
                    borderColor: "#10b981",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
                },
            }}
        >
            <CardContent>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${wallet.color}`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <Typography variant="h6" fontWeight="bold">
                                {wallet.name}
                            </Typography>
                            <div className="flex items-center gap-2">
                                <Pill label={wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)} tone="neutral" />
                                <Typography variant="body2" color="text.secondary">
                                    {wallet.currency}
                                </Typography>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <Divider sx={{ my: 2 }} />
                <div className="flex justify-between">
                    <div>
                        <Typography variant="body2" color="text.secondary">
                            Available
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatMoney(wallet.available, wallet.currency)}
                        </Typography>
                    </div>
                    <div className="text-right">
                        <Typography variant="body2" color="text.secondary">
                            Pending
                        </Typography>
                        <Typography variant="h6" fontWeight="semibold" color="text.secondary">
                            {formatMoney(wallet.pending, wallet.currency)}
                        </Typography>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickAction({
    icon: Icon,
    label,
    onClick,
    color,
}: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
        >
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </button>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function WalletOverview() {
    const { balances, kycTier } = useWallet();

    // Aggregate totals
    const totals = useMemo(() => {
        const totalAvailable = balances.reduce((sum, b) => sum + b.available, 0);
        const totalPending = balances.reduce((sum, b) => sum + b.pending, 0);
        const currencies = [...new Set(balances.map((b) => b.currency))];
        return { totalAvailable, totalPending, currencies };
    }, [balances]);

    // Mock wallets (combining real balance data with wallet info)
    const wallets = useMemo<WalletInfo[]>(
        () => [
            {
                id: "w1",
                name: "Personal Wallet",
                type: "personal",
                currency: "UGX",
                available: totals.totalAvailable,
                pending: totals.totalPending,
                icon: Wallet,
                color: "bg-emerald-500",
            },
            {
                id: "w2",
                name: "Business Account",
                type: "business",
                currency: "USD",
                available: 12500,
                pending: 2500,
                icon: Building2,
                color: "bg-blue-500",
            },
            {
                id: "w3",
                name: "Corporate Hub",
                type: "corporate",
                currency: "EUR",
                available: 45000,
                pending: 5000,
                icon: Globe,
                color: "bg-purple-500",
            },
        ],
        [totals]
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Wallet Overview"
                subtitle={`${balances.length} currencies • KYC Tier ${kycTier}`}
            >
                <div className="mt-4 flex flex-wrap gap-2">
                    <Pill label={`Total: ${formatMoney(totals.totalAvailable)}`} tone="good" />
                    <Pill label={`Pending: ${formatMoney(totals.totalPending)}`} tone="info" />
                    <Pill label={`${totals.currencies.length} Currencies`} tone="neutral" />
                </div>
            </SectionCard>

            {/* Quick Actions */}
            <SectionCard title="Quick Actions" className="mt-3">
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <QuickAction
                            icon={ArrowUpRight}
                            label="Send"
                            onClick={() => { }}
                            color="bg-emerald-500"
                        />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <QuickAction
                            icon={ArrowDownLeft}
                            label="Receive"
                            onClick={() => { }}
                            color="bg-blue-500"
                        />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <QuickAction
                            icon={CreditCard}
                            label="Add Money"
                            onClick={() => { }}
                            color="bg-amber-500"
                        />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <QuickAction
                            icon={TrendingUp}
                            label="Invest"
                            onClick={() => { }}
                            color="bg-purple-500"
                        />
                    </Grid>
                </Grid>
            </SectionCard>

            {/* Wallets */}
            <SectionCard title="Your Wallets" subtitle="Manage your wallets" className="mt-3">
                <div className="space-y-4">
                    {wallets.map((wallet) => (
                        <WalletCard key={wallet.id} wallet={wallet} />
                    ))}
                </div>
            </SectionCard>

            {/* Additional Info */}
            <SectionCard title="Wallet Features" subtitle="What's available in your wallets" className="mt-3">
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
                                <Smartphone className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Mobile Money Integration
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Send and receive via MTN, Airtel
                                </Typography>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50">
                                <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Multi-Currency Support
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Hold and exchange USD, EUR, GBP
                                </Typography>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50">
                                <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Business Features
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Team access, approvals, budgets
                                </Typography>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50">
                                <TrendingUp className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Investment Options
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Grow your savings
                                </Typography>
                            </div>
                        </div>
                    </Grid>
                </Grid>
            </SectionCard>

            {/* View All Button */}
            <div className="mt-4">
                <Button variant="outline" className="w-full">
                    View All Wallet Features
                </Button>
            </div>
        </Box>
    );
}
