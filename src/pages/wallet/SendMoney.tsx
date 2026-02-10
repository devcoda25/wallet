// ============================================================================
// Send Money Page - Send/Transfer/Request (w_06)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    Users,
    Phone,
    Mail,
    QrCode,
    Search,
    Clock,
    Check,
    AlertTriangle,
    ChevronRight,
    Copy,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, TextField, InputAdornment, Chip, Tab, Tabs } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type Mode = "Send" | "Request" | "Split";
type RecipientType = "phone" | "email" | "qr" | "contacts";
type Status = "Draft" | "Pending" | "Completed" | "Failed";

interface Recipient {
    id: string;
    name: string;
    type: RecipientType;
    identifier: string;
    avatar?: string;
}

interface ActivityItem {
    id: string;
    mode: Mode;
    title: string;
    subtitle: string;
    when: string;
    status: Status;
    amount: number;
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
    const sign = amount < 0 ? "-" : "";
    return `${sign}${currency} ${num}`;
}

function toneForStatus(s: Status): "good" | "info" | "warn" | "bad" {
    if (s === "Completed") return "good";
    if (s === "Pending") return "info";
    if (s === "Failed") return "bad";
    return "warn";
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
        <Chip
            label={label}
            size="small"
            sx={{
                backgroundColor: map[tone]?.split(" ")[0],
                color: map[tone]?.split(" ")[1],
                fontWeight: 600,
                fontSize: "0.75rem",
            }}
        />
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function RecipientCard({
    recipient,
    onClick,
    selected,
}: {
    recipient: Recipient;
    onClick: () => void;
    selected: boolean;
}) {
    const Icon = recipient.type === "phone" ? Phone : recipient.type === "email" ? Mail : recipient.type === "qr" ? QrCode : Users;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
                <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">{recipient.name}</div>
                <div className="text-xs text-slate-500">{recipient.identifier}</div>
            </div>
            {selected && <Check className="h-5 w-5 text-emerald-600" />}
        </button>
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const Icon = item.mode === "Send" ? ArrowUpRight : item.mode === "Request" ? ArrowDownLeft : ArrowLeftRight;
    const amountColor = item.mode === "Send" ? "text-slate-900" : "text-emerald-600";

    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.mode === "Send" ? "bg-slate-100" : "bg-emerald-50"}`}>
                <Icon className={`h-5 w-5 ${item.mode === "Send" ? "text-slate-600" : "text-emerald-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
                <div className="truncate text-xs text-slate-500">{item.subtitle}</div>
            </div>
            <div className="text-right">
                <div className={`text-sm font-semibold ${amountColor}`}>
                    {item.mode === "Send" ? "-" : "+"}{formatMoney(item.amount)}
                </div>
                <div className="text-xs text-slate-500">{item.when}</div>
            </div>
            <Pill label={item.status} tone={toneForStatus(item.status)} />
        </div>
    );
}

function QuickRecipient({
    name,
    identifier,
    onClick,
}: {
    name: string;
    identifier: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
        >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <span className="text-lg font-semibold">{name.charAt(0)}</span>
            </div>
            <div className="text-center">
                <div className="text-sm font-semibold text-slate-900">{name}</div>
                <div className="text-xs text-slate-500">{identifier}</div>
            </div>
        </button>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SendMoney() {
    const { balances } = useWallet();
    const [mode, setMode] = useState<Mode>("Send");
    const [amount, setAmount] = useState("");
    const [recipientType, setRecipientType] = useState<RecipientType>("phone");
    const [searchQuery, setSearchQuery] = useState("");

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    // Mock recipients
    const recipients = useMemo<Recipient[]>(
        () => [
            { id: "r1", name: "Phone Number", type: "phone", identifier: "Enter phone number" },
            { id: "r2", name: "Email Address", type: "email", identifier: "Enter email address" },
            { id: "r3", name: "QR Code", type: "qr", identifier: "Scan recipient's QR" },
            { id: "r4", name: "Contacts", type: "contacts", identifier: "Choose from contacts" },
        ],
        []
    );

    // Mock quick recipients
    const quickRecipients = useMemo<Recipient[]>(
        () => [
            { id: "q1", name: "John Doe", type: "phone", identifier: "+256 701 234 567" },
            { id: "q2", name: "Jane Smith", type: "phone", identifier: "+256 702 345 678" },
            { id: "q3", name: "Business Ltd", type: "phone", identifier: "+256 703 456 789" },
        ],
        []
    );

    // Mock activity
    const activity = useMemo<ActivityItem[]>(
        () => [
            {
                id: "a1",
                mode: "Send",
                title: "Transfer to John Doe",
                subtitle: "UGX 150,000 • Ref: TX123456",
                when: "Today 14:30",
                status: "Completed",
                amount: 150000,
                ref: "TX123456",
            },
            {
                id: "a2",
                mode: "Request",
                title: "Request from Jane Smith",
                subtitle: "UGX 50,000 • Ref: TX123457",
                when: "Yesterday 10:15",
                status: "Pending",
                amount: 50000,
                ref: "TX123457",
            },
            {
                id: "a3",
                mode: "Send",
                title: "Transfer to Business Ltd",
                subtitle: "UGX 500,000 • Ref: TX123458",
                when: "3 days ago",
                status: "Completed",
                amount: 500000,
                ref: "TX123458",
            },
        ],
        []
    );

    const filteredQuickRecipients = useMemo(
        () => quickRecipients.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [quickRecipients, searchQuery]
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title={`${mode} Money`}
                subtitle={`Available: ${formatMoney(primaryBalance?.available || 0)}`}
            >
                <Tabs
                    value={mode}
                    onChange={(_, v) => setMode(v as Mode)}
                    sx={{ mt: 2 }}
                    variant="fullWidth"
                >
                    <Tab value="Send" label="Send" icon={<ArrowUpRight className="h-4 w-4" />} iconPosition="start" />
                    <Tab value="Request" label="Request" icon={<ArrowDownLeft className="h-4 w-4" />} iconPosition="start" />
                    <Tab value="Split" label="Split" icon={<ArrowLeftRight className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {/* Recipient Selection */}
            <SectionCard title="Recipient" subtitle="How do you want to send money?" className="mt-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {recipients.map((r) => (
                        <RecipientCard
                            key={r.id}
                            recipient={r}
                            selected={recipientType === r.type}
                            onClick={() => setRecipientType(r.type)}
                        />
                    ))}
                </div>

                <div className="mt-4">
                    <TextField
                        fullWidth
                        placeholder={
                            recipientType === "phone"
                                ? "Enter phone number"
                                : recipientType === "email"
                                    ? "Enter email address"
                                    : recipientType === "qr"
                                        ? "Scan QR code"
                                        : "Search contacts"
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </InputAdornment>
                            ),
                        }}
                        variant="outlined"
                        size="medium"
                    />
                </div>

                {/* Quick Recipients */}
                <div className="mt-4">
                    <Typography variant="subtitle2" fontWeight="semibold" gutterBottom>
                        Quick Send
                    </Typography>
                    <div className="grid grid-cols-3 gap-2">
                        {filteredQuickRecipients.map((r) => (
                            <QuickRecipient
                                key={r.id}
                                name={r.name}
                                identifier={r.identifier}
                                onClick={() => { }}
                            />
                        ))}
                    </div>
                </div>
            </SectionCard>

            {/* Amount */}
            <SectionCard title="Amount" subtitle="How much do you want to send?" className="mt-3">
                <div className="flex items-center gap-2">
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
                        size="medium"
                    />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {[10000, 20000, 50000, 100000, 200000].map((v) => (
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

            {/* Action */}
            <div className="mt-4">
                <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    disabled={!amount || parseFloat(amount) <= 0}
                >
                    {mode === "Send" ? `Send ${formatMoney(parseFloat(amount) || 0)}` : `Request ${formatMoney(parseFloat(amount) || 0)}`}
                </Button>
            </div>

            {/* Recent Activity */}
            <SectionCard title="Recent Activity" subtitle="Your recent transfers and requests" className="mt-4">
                <div className="space-y-1">
                    {activity.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <Button variant="ghost">View All Activity</Button>
                </div>
            </SectionCard>
        </Box>
    );
}
