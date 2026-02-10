// ============================================================================
// Request Money Page - Request Funds from Others (w_06)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Users,
    Phone,
    Mail,
    QrCode,
    Search,
    Clock,
    Check,
    AlertTriangle,
    ChevronRight,
    Share2,
    Copy,
    Link,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, TextField, InputAdornment, Chip, Tab, Tabs, Divider } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type RequestMethod = "phone" | "email" | "qr" | "link";
type RequestStatus = "Pending" | "Paid" | "Expired" | "Cancelled";

interface RequestTemplate {
    id: string;
    name: string;
    amount: number;
    useCount: number;
}

interface RecentRequest {
    id: string;
    date: string;
    requestFrom: string;
    amount: number;
    status: RequestStatus;
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

function toneForStatus(s: RequestStatus): "good" | "info" | "warn" | "bad" {
    if (s === "Paid") return "good";
    if (s === "Pending") return "info";
    if (s === "Expired") return "warn";
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

function RequestMethodCard({
    method,
    selected,
    onClick,
}: {
    method: { id: RequestMethod; label: string; icon: React.ElementType };
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-3 transition ${selected
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-emerald-100" : "bg-slate-100"}`}>
                <method.icon className={`h-5 w-5 ${selected ? "text-emerald-600" : "text-slate-600"}`} />
            </div>
            <span className={`text-xs font-medium ${selected ? "text-emerald-700" : "text-slate-700"}`}>{method.label}</span>
        </button>
    );
}

function TemplateCard({
    template,
    onClick,
}: {
    template: RequestTemplate;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Used {template.useCount} times</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(template.amount)}</div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
        </button>
    );
}

function RecentRequestRow({ item }: { item: RecentRequest }) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.status === "Paid" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}>
                <ArrowDownLeft className={`h-5 w-5 ${item.status === "Paid" ? "text-emerald-600" : "text-amber-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.requestFrom}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.date}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{formatMoney(item.amount)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.ref}</div>
            </div>
            <Pill label={item.status} tone={toneForStatus(item.status)} />
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RequestMoney() {
    const { balances } = useWallet();
    const [tab, setTab] = useState(0);
    const [method, setMethod] = useState<RequestMethod>("phone");
    const [amount, setAmount] = useState("");
    const [requestNote, setRequestNote] = useState("");

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    const requestMethods = useMemo(
        () => [
            { id: "phone" as RequestMethod, label: "Phone", icon: Phone },
            { id: "email" as RequestMethod, label: "Email", icon: Mail },
            { id: "qr" as RequestMethod, label: "QR Code", icon: QrCode },
            { id: "link" as RequestMethod, label: "Share Link", icon: Link },
        ],
        []
    );

    const templates = useMemo(
        () => [
            { id: "t1", name: "Dinner split", amount: 50000, useCount: 12 },
            { id: "t2", name: "Shared ride", amount: 25000, useCount: 8 },
            { id: "t3", name: "Group payment", amount: 100000, useCount: 3 },
        ],
        []
    );

    const recentRequests = useMemo(
        () => [
            {
                id: "r1",
                date: "Today 14:30",
                requestFrom: "John Doe",
                amount: 50000,
                status: "Pending" as RequestStatus,
                ref: "RQ123456",
            },
            {
                id: "r2",
                date: "Yesterday 10:15",
                requestFrom: "Jane Smith",
                amount: 75000,
                status: "Paid" as RequestStatus,
                ref: "RQ123457",
            },
            {
                id: "r3",
                date: "3 days ago",
                requestFrom: "Business Ltd",
                amount: 250000,
                status: "Expired" as RequestStatus,
                ref: "RQ123458",
            },
        ],
        []
    );

    const quickAmounts = [10000, 25000, 50000, 100000, 200000];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Request Money"
                subtitle="Request funds from friends, family, or customers"
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="New Request" icon={<ArrowDownLeft className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="History" icon={<Clock className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {tab === 0 ? (
                <>
                    {/* Request Method */}
                    <SectionCard title="Request Method" subtitle="How do you want to request money?" className="mt-3">
                        <Grid container spacing={2}>
                            {requestMethods.map((m) => (
                                <Grid item xs={6} sm={3} key={m.id}>
                                    <RequestMethodCard method={m} selected={method === m.id} onClick={() => setMethod(m.id)} />
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>

                    {/* Recipient */}
                    <SectionCard title="Recipient" subtitle="Who are you requesting from?" className="mt-3">
                        <TextField
                            fullWidth
                            placeholder={
                                method === "phone"
                                    ? "Enter phone number"
                                    : method === "email"
                                        ? "Enter email address"
                                        : method === "qr"
                                            ? "Show your QR code"
                                            : "Link will be generated automatically"
                            }
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                        />
                        {method === "qr" && (
                            <div className="mt-4 flex justify-center">
                                <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
                                    <QrCode className="h-32 w-32 text-slate-400 mx-auto" />
                                    <Typography variant="body2" color="text.secondary" className="mt-2 text-center">
                                        QR Code will appear here
                                    </Typography>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        <Copy className="h-4 w-4" /> Copy Link
                                    </Button>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* Amount */}
                    <SectionCard title="Amount" subtitle="How much do you want to request?" className="mt-3">
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
                                    label={formatMoney(v)}
                                    onClick={() => setAmount(v.toString())}
                                    variant="outlined"
                                    sx={{ cursor: "pointer" }}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Note */}
                    <SectionCard title="Note" subtitle="Add a message for the recipient (optional)" className="mt-3">
                        <TextField
                            fullWidth
                            placeholder="What's this for?"
                            value={requestNote}
                            onChange={(e) => setRequestNote(e.target.value)}
                            variant="outlined"
                            multiline
                            rows={2}
                        />
                    </SectionCard>

                    {/* Templates */}
                    <SectionCard title="Quick Templates" subtitle="Reuse previous requests" className="mt-3">
                        <div className="space-y-2">
                            {templates.map((t) => (
                                <TemplateCard key={t.id} template={t} onClick={() => setAmount(t.amount.toString())} />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Info Card */}
                    <SectionCard title="Information" className="mt-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <Typography variant="body2" fontWeight="medium">
                                    Request Expiry
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Requests expire after 7 days if not fulfilled
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
                            Send Request {amount ? `for ${formatMoney(parseFloat(amount))}` : ""}
                        </Button>
                    </div>
                </>
            ) : (
                <SectionCard title="Request History" subtitle="Your recent money requests" className="mt-3">
                    <div className="space-y-1">
                        {recentRequests.map((item) => (
                            <RecentRequestRow key={item.id} item={item} />
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Button variant="ghost">View All Requests</Button>
                    </div>
                </SectionCard>
            )}
        </Box>
    );
}
