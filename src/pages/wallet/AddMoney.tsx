// ============================================================================
// Add Money Page - Top Up / Fund Wallet (w_05)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    CreditCard,
    Smartphone,
    Building2,
    Phone,
    Clock,
    Check,
    AlertTriangle,
    ArrowDownLeft,
    History,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, TextField, InputAdornment, Chip, Tab, Tabs } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type FundingMethod = "card" | "mobile" | "bank" | "ussd";
type FundingStatus = "Completed" | "Processing" | "Pending" | "Failed";

interface FundingMethodOption {
    id: FundingMethod;
    label: string;
    icon: React.ElementType;
    fee: string;
    processingTime: string;
}

interface FundingHistoryItem {
    id: string;
    date: string;
    method: string;
    amount: number;
    status: FundingStatus;
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

function toneForStatus(s: FundingStatus): "good" | "info" | "warn" | "bad" {
    if (s === "Completed") return "good";
    if (s === "Processing" || s === "Pending") return "info";
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

function MethodCard({
    method,
    selected,
    onClick,
}: {
    method: FundingMethodOption;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-3 transition ${selected
                ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                }`}
        >
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-700"}`}>
                <method.icon className={`h-5 w-5 ${selected ? "text-emerald-600" : "text-slate-600 dark:text-slate-400"}`} />
            </div>
            <div className="text-center">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{method.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{method.fee}</div>
            </div>
        </button>
    );
}

function HistoryRow({ item }: { item: FundingHistoryItem }) {
    const Icon = item.method === "card" ? CreditCard : item.method === "mobile" ? Smartphone : item.method === "bank" ? Building2 : Phone;

    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.method.charAt(0).toUpperCase() + item.method.slice(1)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.date}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-emerald-600">+{formatMoney(item.amount)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.ref}</div>
            </div>
            <Pill label={item.status} tone={toneForStatus(item.status)} />
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AddMoney() {
    const { balances } = useWallet();
    const [tab, setTab] = useState(0);
    const [method, setMethod] = useState<FundingMethod>("card");
    const [amount, setAmount] = useState("");

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    // Funding methods
    const fundingMethods = useMemo<FundingMethodOption[]>(
        () => [
            { id: "card", label: "Bank Card", icon: CreditCard, fee: "1.5%", processingTime: "Instant" },
            { id: "mobile", label: "Mobile Money", icon: Smartphone, fee: "1.0%", processingTime: "Instant" },
            { id: "bank", label: "Bank Transfer", icon: Building2, fee: "Free", processingTime: "1-2 business days" },
            { id: "ussd", label: "USSD", icon: Phone, fee: "0.5%", processingTime: "Instant" },
        ],
        []
    );

    // Quick amount presets
    const quickAmounts = [10000, 20000, 50000, 100000, 200000];

    // Mock funding history
    const history = useMemo<FundingHistoryItem[]>(
        () => [
            {
                id: "f1",
                date: "Today 10:30",
                method: "card",
                amount: 500000,
                status: "Completed",
                ref: "TF123456",
            },
            {
                id: "f2",
                date: "Yesterday 15:45",
                method: "mobile",
                amount: 100000,
                status: "Completed",
                ref: "TF123457",
            },
            {
                id: "f3",
                date: "3 days ago",
                method: "bank",
                amount: 1000000,
                status: "Completed",
                ref: "TF123458",
            },
        ],
        []
    );

    const quickAmountLabels: Record<number, string> = {
        10000: "10K",
        20000: "20K",
        50000: "50K",
        100000: "100K",
        200000: "200K",
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Add Money"
                subtitle={`Available: ${formatMoney(primaryBalance?.available || 0)}`}
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="Add Funds" icon={<ArrowDownLeft className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="History" icon={<History className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {tab === 0 ? (
                <>
                    {/* Funding Methods */}
                    <SectionCard title="Funding Method" subtitle="Choose how you want to add money" className="mt-3">
                        <Grid container spacing={2}>
                            {fundingMethods.map((m) => (
                                <Grid item xs={6} sm={3} key={m.id}>
                                    <MethodCard method={m} selected={method === m.id} onClick={() => setMethod(m.id)} />
                                </Grid>
                            ))}
                        </Grid>
                        <div className="mt-2 flex justify-between text-xs text-slate-500 px-1 dark:text-slate-400">
                            <span>Fee: {fundingMethods.find((m) => m.id === method)?.fee}</span>
                            <span>Processing: {fundingMethods.find((m) => m.id === method)?.processingTime}</span>
                        </div>
                    </SectionCard>

                    {/* Amount */}
                    <SectionCard title="Amount" subtitle="How much do you want to add?" className="mt-3">
                        <TextField
                            fullWidth
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography variant="h5" color="text.secondary">
                                            UGX
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                        />
                        <div className="mt-2 flex flex-wrap gap-1">
                            {quickAmounts.map((v) => (
                                <Chip
                                    key={v}
                                    label={quickAmountLabels[v]}
                                    onClick={() => setAmount(v.toString())}
                                    variant="outlined"
                                    sx={{ cursor: "pointer" }}
                                />
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Processing fee</span>
                                <span className="font-medium">{formatMoney((parseFloat(amount) || 0) * 0.015)}</span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Total to pay</span>
                                <span className="font-semibold">{formatMoney((parseFloat(amount) || 0) * 1.015)}</span>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Info Card */}
                    <SectionCard title="Security Info" className="mt-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Secure Payment
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Your payment is secured with 256-bit SSL encryption
                                </Typography>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Action */}
                    <div className="mt-4">
                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            disabled={!amount || parseFloat(amount) <= 0}
                        >
                            Pay {formatMoney((parseFloat(amount) || 0) * 1.015)}
                        </Button>
                    </div>
                </>
            ) : (
                <SectionCard title="Funding History" subtitle="Your recent money additions" className="mt-3">
                    <div className="space-y-1">
                        {history.map((item) => (
                            <HistoryRow key={item.id} item={item} />
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Button variant="ghost">View All Transactions</Button>
                    </div>
                </SectionCard>
            )}
        </Box>
    );
}
