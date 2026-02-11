// ============================================================================
// FX Exchange Page - Multi-Currency Exchange (w_09)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    ArrowLeftRight,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    ChevronDown,
    RefreshCw,
    DollarSign,
    Euro,
    PoundSterling,
    JapaneseYen,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, Chip, Tab, Tabs, TextField, InputAdornment } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type Currency = "UGX" | "USD" | "EUR" | "GBP" | "CNY";
type ExchangeStatus = "Completed" | "Pending" | "Processing";

interface ExchangeRate {
    from: Currency;
    to: Currency;
    rate: number;
    change24h: number;
}

interface ExchangeHistoryItem {
    id: string;
    date: string;
    fromCurrency: Currency;
    fromAmount: number;
    toCurrency: Currency;
    toAmount: number;
    rate: number;
    status: ExchangeStatus;
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

function toneForStatus(s: ExchangeStatus): "good" | "info" | "warn" {
    if (s === "Completed") return "good";
    if (s === "Processing") return "info";
    return "warn";
}

function getCurrencyFlag(currency: Currency): string {
    const flags: Record<Currency, string> = {
        UGX: "🇺🇬",
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        CNY: "🇨🇳",
    };
    return flags[currency];
}

function getCurrencyIcon(currency: Currency) {
    switch (currency) {
        case "USD": return DollarSign;
        case "EUR": return Euro;
        case "GBP": return PoundSterling;
        case "CNY": return JapaneseYen;
        default: return DollarSign;
    }
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

function RateCard({
    from,
    to,
    rate,
    change24h,
    onClick,
    selected,
}: {
    from: Currency;
    to: Currency;
    rate: number;
    change24h: number;
    onClick: () => void;
    selected: boolean;
}) {
    const fromIcon = getCurrencyIcon(from);
    const toIcon = getCurrencyIcon(to);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${selected
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm">
                        {getCurrencyFlag(from)}
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm">
                        {getCurrencyFlag(to)}
                    </div>
                </div>
                <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900">{from} → {to}</div>
                    <div className="text-xs text-slate-500">1 {from} = {rate.toFixed(4)} {to}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${change24h >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">{Math.abs(change24h).toFixed(2)}%</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
        </button>
    );
}

function ExchangeRow({ item }: { item: ExchangeHistoryItem }) {
    const fromIcon = getCurrencyIcon(item.fromCurrency);
    const toIcon = getCurrencyIcon(item.toCurrency);

    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                    {formatMoney(item.fromAmount, item.fromCurrency)} → {formatMoney(item.toAmount, item.toCurrency)}
                </div>
                <div className="text-xs text-slate-500">
                    {item.date} • Rate: {item.rate.toFixed(4)}
                </div>
            </div>
            <div className="text-right">
                <Pill label={item.status} tone={toneForStatus(item.status)} />
                <div className="mt-1 text-xs text-slate-500">{item.ref}</div>
            </div>
        </div>
    );
}

function CurrencyBalanceCard({
    currency,
    available,
    flag,
}: {
    currency: Currency;
    available: number;
    flag: string;
}) {
    const Icon = getCurrencyIcon(currency);

    return (
        <Card variant="outlined">
            <CardContent>
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
                        <span className="text-lg">{flag}</span>
                    </div>
                    <div className="flex-1">
                        <Typography variant="body2" color="text.secondary">
                            {currency}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                            {formatMoney(available, currency)}
                        </Typography>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FXExchange() {
    const { balances } = useWallet();
    const [tab, setTab] = useState(0);
    const [fromCurrency, setFromCurrency] = useState<Currency>("UGX");
    const [toCurrency, setToCurrency] = useState<Currency>("USD");
    const [amount, setAmount] = useState("");
    const [selectedRate, setSelectedRate] = useState(0);

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    // Mock exchange rates
    const exchangeRates = useMemo<ExchangeRate[]>(
        () => [
            { from: "UGX", to: "USD", rate: 0.00027, change24h: 0.12 },
            { from: "UGX", to: "EUR", rate: 0.00025, change24h: -0.05 },
            { from: "UGX", to: "GBP", rate: 0.00021, change24h: 0.08 },
            { from: "UGX", to: "CNY", rate: 0.00195, change24h: 0.02 },
            { from: "USD", to: "UGX", rate: 3700.0, change24h: -0.12 },
            { from: "USD", to: "EUR", rate: 0.92, change24h: 0.03 },
            { from: "EUR", to: "USD", rate: 1.09, change24h: -0.03 },
            { from: "EUR", to: "UGX", rate: 4050.0, change24h: 0.05 },
        ],
        []
    );

    // Mock exchange history
    const history = useMemo<ExchangeHistoryItem[]>(
        () => [
            {
                id: "ex1",
                date: "Today 10:30",
                fromCurrency: "UGX",
                fromAmount: 1000000,
                toCurrency: "USD",
                toAmount: 270.27,
                rate: 0.00027,
                status: "Completed",
                ref: "EX123456",
            },
            {
                id: "ex2",
                date: "Yesterday 15:45",
                fromCurrency: "USD",
                fromAmount: 500,
                toCurrency: "UGX",
                toAmount: 1850000,
                rate: 3700.0,
                status: "Completed",
                ref: "EX123457",
            },
            {
                id: "ex3",
                date: "3 days ago",
                fromCurrency: "EUR",
                fromAmount: 200,
                toCurrency: "UGX",
                toAmount: 810000,
                rate: 4050.0,
                status: "Completed",
                ref: "EX123458",
            },
        ],
        []
    );

    // Get selected rate
    const currentRate = useMemo(
        () => exchangeRates.find((r) => r.from === fromCurrency && r.to === toCurrency)?.rate || 0,
        [exchangeRates, fromCurrency, toCurrency]
    );

    // Calculate converted amount
    const convertedAmount = useMemo(
        () => (parseFloat(amount) || 0) * currentRate,
        [amount, currentRate]
    );

    // Fee calculation (0.5% for FX)
    const fee = useMemo(() => (parseFloat(amount) || 0) * 0.005, [amount]);

    const currencies: Currency[] = ["UGX", "USD", "EUR", "GBP", "CNY"];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="FX & Currency"
                subtitle="Exchange between currencies"
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="Exchange" icon={<ArrowLeftRight className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="History" icon={<Clock className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {tab === 0 ? (
                <>
                    {/* Currency Balances */}
                    <SectionCard title="Your Balances" subtitle="Available for exchange" className="mt-3">
                        <Grid container spacing={2}>
                            {currencies.map((currency) => {
                                const balance = balances.find((b) => b.currency === currency);
                                return (
                                    <Grid item xs={6} sm={4} key={currency}>
                                        <CurrencyBalanceCard
                                            currency={currency}
                                            available={balance?.available || 0}
                                            flag={getCurrencyFlag(currency)}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </SectionCard>

                    {/* Exchange Pair */}
                    <SectionCard title="Exchange Pair" subtitle="Select currencies to exchange" className="mt-3">
                        <div className="space-y-2">
                            {exchangeRates.slice(0, 4).map((rate) => (
                                <RateCard
                                    key={`${rate.from}-${rate.to}`}
                                    from={rate.from}
                                    to={rate.to}
                                    rate={rate.rate}
                                    change24h={rate.change24h}
                                    selected={fromCurrency === rate.from && toCurrency === rate.to}
                                    onClick={() => {
                                        setFromCurrency(rate.from);
                                        setToCurrency(rate.to);
                                    }}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Amount */}
                    <SectionCard title="Amount" subtitle={`Exchange ${fromCurrency} to ${toCurrency}`} className="mt-3">
                        <div className="flex items-center gap-4">
                            <TextField
                                fullWidth
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <span className="text-lg">{getCurrencyFlag(fromCurrency)}</span>
                                        </InputAdornment>
                                    ),
                                }}
                                variant="outlined"
                            />
                            <ArrowLeftRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <TextField
                                fullWidth
                                type="number"
                                placeholder="0"
                                value={convertedAmount.toFixed(2)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <span className="text-lg">{getCurrencyFlag(toCurrency)}</span>
                                        </InputAdornment>
                                    ),
                                }}
                                variant="outlined"
                                disabled
                            />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                            <span>Rate: 1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency}</span>
                            <span>Fee: {formatMoney(fee, fromCurrency)}</span>
                        </div>
                    </SectionCard>

                    {/* Quick Amounts */}
                    <SectionCard title="Quick Select" className="mt-3">
                        <div className="flex flex-wrap gap-2">
                            {[25, 50, 75, 100].map((pct) => (
                                <Chip
                                    key={pct}
                                    label={`${pct}%`}
                                    onClick={() => {
                                        const balance = balances.find((b) => b.currency === fromCurrency);
                                        if (balance) {
                                            setAmount(((balance.available * pct) / 100).toString());
                                        }
                                    }}
                                    variant="outlined"
                                    sx={{ cursor: "pointer" }}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Info Card */}
                    <SectionCard title="Rate Info" className="mt-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Exchange Rate Fluctuations
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Rates may change during the exchange process
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
                            Exchange {formatMoney(parseFloat(amount) || 0, fromCurrency)} → {formatMoney(convertedAmount, toCurrency)}
                        </Button>
                    </div>
                </>
            ) : (
                <SectionCard title="Exchange History" subtitle="Your currency exchanges" className="mt-3">
                    <div className="space-y-1">
                        {history.map((item) => (
                            <ExchangeRow key={item.id} item={item} />
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Button variant="ghost">View All Exchanges</Button>
                    </div>
                </SectionCard>
            )}
        </Box>
    );
}
