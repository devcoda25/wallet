// ============================================================================
// Receipts Page - Transaction History (U6)
// ============================================================================

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Search,
    Filter,
    Download,
    ChevronRight,
    Check,
    Clock,
    X,
    AlertTriangle,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
} from "lucide-react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    InputAdornment,
    Chip,
    Tab,
    Tabs,
} from "@mui/material";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed";
type TxType = "Payment" | "Refund" | "Top-up" | "Withdrawal" | "Transfer";

interface ReceiptItem {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    status: TxStatus;
    type: TxType;
    date: string;
    ref: string;
    merchant?: string;
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

function ReceiptRow({ receipt }: { receipt: ReceiptItem }) {
    const navigate = useNavigate();

    const icon =
        receipt.type === "Payment" || receipt.type === "Withdrawal" ? (
            <ArrowUpRight className="h-5 w-5 text-slate-600" />
        ) : receipt.type === "Refund" || receipt.type === "Top-up" ? (
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
        ) : (
            <CreditCard className="h-5 w-5 text-blue-600" />
        );

    const bg =
        receipt.type === "Payment" || receipt.type === "Withdrawal"
            ? "bg-slate-100"
            : receipt.type === "Refund" || receipt.type === "Top-up"
                ? "bg-emerald-50"
                : "bg-blue-50";

    return (
        <div
            className="flex cursor-pointer items-center gap-4 border-b border-slate-100 py-3 last:border-0 hover:bg-slate-50"
            onClick={() => navigate(`/receipts/${receipt.id}`)}
        >
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${bg}`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <Typography variant="body2" fontWeight="medium" noWrap>
                    {receipt.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {receipt.date} • {receipt.ref}
                </Typography>
            </div>
            <div className="text-right">
                <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={receipt.type === "Payment" || receipt.type === "Withdrawal" ? "text.primary" : "success.main"}
                >
                    {receipt.type === "Payment" || receipt.type === "Withdrawal" ? "-" : "+"}
                    {formatMoney(receipt.amount, receipt.currency)}
                </Typography>
                <Pill label={receipt.status} tone={toneForStatus(receipt.status)} />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Receipts() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");

    // Mock receipts
    const receipts = useMemo<ReceiptItem[]>(
        () => [
            {
                id: "t1",
                title: "Uber ride",
                description: "Office to airport",
                amount: 42000,
                currency: "UGX",
                status: "Completed",
                type: "Payment",
                date: "Today 14:30",
                ref: "TX123456",
                merchant: "Uber",
            },
            {
                id: "t2",
                title: "Grocery store",
                description: "Weekly supplies",
                amount: 85000,
                currency: "UGX",
                status: "Completed",
                type: "Payment",
                date: "Today 11:15",
                ref: "TX123457",
                merchant: "Shoprite",
            },
            {
                id: "t3",
                title: "Salary deposit",
                description: "Monthly salary",
                amount: 2500000,
                currency: "UGX",
                status: "Completed",
                type: "Top-up",
                date: "Yesterday",
                ref: "TX123458",
            },
            {
                id: "t4",
                title: "Refund - Damaged item",
                description: "Returned shoes",
                amount: 35000,
                currency: "UGX",
                status: "Completed",
                type: "Refund",
                date: "2 days ago",
                ref: "TX123459",
            },
            {
                id: "t5",
                title: "ATM withdrawal",
                description: "Cash withdrawal",
                amount: 200000,
                currency: "UGX",
                status: "Completed",
                type: "Withdrawal",
                date: "3 days ago",
                ref: "TX123460",
            },
            {
                id: "t6",
                title: "Pending transaction",
                description: "Pending approval",
                amount: 150000,
                currency: "UGX",
                status: "Pending",
                type: "Payment",
                date: "4 days ago",
                ref: "TX123461",
            },
            {
                id: "t7",
                title: "Failed transaction",
                description: "Insufficient funds",
                amount: 50000,
                currency: "UGX",
                status: "Failed",
                type: "Payment",
                date: "5 days ago",
                ref: "TX123462",
            },
        ],
        []
    );

    const filteredReceipts = useMemo(
        () =>
            receipts.filter(
                (r) =>
                    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.ref.toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (statusFilter === "all" || r.status === statusFilter)
            ),
        [receipts, searchQuery, statusFilter]
    );

    const totalSpent = useMemo(
        () =>
            filteredReceipts
                .filter((r) => r.type === "Payment" || r.type === "Withdrawal")
                .reduce((sum, r) => sum + r.amount, 0),
        [filteredReceipts]
    );

    const completedCount = filteredReceipts.filter((r) => r.status === "Completed").length;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Receipts"
                subtitle={`${receipts.length} total transactions`}
                right={
                    <Button variant="outline">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                }
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="All" icon={<FileText className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="Completed" icon={<Check className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={2} label="Pending" icon={<Clock className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Total Spent
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {formatMoney(totalSpent)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Completed
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {completedCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Pending
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {receipts.filter((r) => r.status === "Pending").length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                This Month
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {receipts.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Search and Filter */}
            <div className="mt-4 flex flex-col gap-2">
                <TextField
                    fullWidth
                    placeholder="Search receipts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search className="h-5 w-5 text-slate-400" />
                            </InputAdornment>
                        ),
                    }}
                    variant="outlined"
                />
                <div className="flex gap-1 flex-wrap">
                    {(["all", "Completed", "Pending", "Failed"] as const).map((status) => (
                        <Chip
                            key={status}
                            label={status === "all" ? "All" : status}
                            onClick={() => setStatusFilter(status as TxStatus | "all")}
                            variant={statusFilter === status ? "filled" : "outlined"}
                            color={statusFilter === status ? "primary" : "default"}
                            sx={{ borderRadius: 2 }}
                        />
                    ))}
                </div>
            </div>

            {/* Receipt List */}
            <SectionCard title="Transactions" subtitle={`${filteredReceipts.length} results`} className="mt-4">
                {filteredReceipts.length > 0 ? (
                    filteredReceipts.map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} />)
                ) : (
                    <div className="py-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-300" />
                        <Typography variant="h6" fontWeight="semibold" sx={{ mt: 2 }}>
                            No receipts found
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {searchQuery ? "Try a different search term" : "Your transactions will appear here"}
                        </Typography>
                    </div>
                )}
            </SectionCard>
        </Box>
    );
}
