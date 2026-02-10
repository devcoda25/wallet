// ============================================================================
// Corporate Hub Page - CorporatePay Overview (U1)
// ============================================================================

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    Wallet,
    FileText,
    CreditCard,
    Bell,
    Settings,
    ShieldCheck,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Check,
    Clock,
    ChevronRight,
} from "lucide-react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    LinearProgress,
} from "@mui/material";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Processing";

interface RequestItem {
    id: string;
    title: string;
    requester: string;
    amount: number;
    currency: string;
    status: RequestStatus;
    date: string;
    category: string;
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
    if (s === "Approved") return "good";
    if (s === "Pending" || s === "Processing") return "info";
    if (s === "Rejected") return "bad";
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

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    tone,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    trend?: "up" | "down";
    tone?: "good" | "warn" | "bad" | "info";
}) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <div className="flex items-start justify-between">
                    <div>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </div>
                    <div
                        className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "good"
                                ? "bg-emerald-50"
                                : tone === "warn"
                                    ? "bg-amber-50"
                                    : tone === "bad"
                                        ? "bg-rose-50"
                                        : "bg-blue-50"
                            }`}
                    >
                        <Icon
                            className={`h-5 w-5 ${tone === "good"
                                    ? "text-emerald-600"
                                    : tone === "warn"
                                        ? "text-amber-600"
                                        : tone === "bad"
                                            ? "text-rose-600"
                                            : "text-blue-600"
                                }`}
                        />
                    </div>
                </div>
                {trend && (
                    <div className="mt-2 flex items-center gap-1">
                        {trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-rose-600" />
                        )}
                        <Typography variant="caption" color={trend === "up" ? "success.main" : "error.main"}>
                            {trend === "up" ? "+12%" : "-8%"} vs last month
                        </Typography>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function BudgetProgress({
    label,
    used,
    limit,
    tone,
}: {
    label: string;
    used: number;
    limit: number;
    tone: "good" | "warn" | "bad";
}) {
    const progress = Math.min(100, (used / limit) * 100);
    const color =
        tone === "bad" ? "#f43f5e" : tone === "warn" ? "#f77f00" : "#03cd8c";

    return (
        <div className="mb-3">
            <div className="flex items-center justify-between">
                <Typography variant="body2" fontWeight="medium">
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {formatMoney(used)} / {formatMoney(limit)}
                </Typography>
            </div>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "slate.100",
                    "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                        borderRadius: 4,
                    },
                }}
            />
        </div>
    );
}

function RequestRow({ request }: { request: RequestItem }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex cursor-pointer items-center gap-4 border-b border-slate-100 py-3 last:border-0 hover:bg-slate-50"
            onClick={() => navigate("/corporate/requests")}
        >
            <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${request.status === "Approved"
                        ? "bg-emerald-50"
                        : request.status === "Pending"
                            ? "bg-amber-50"
                            : "bg-slate-100"
                    }`}
            >
                {request.status === "Approved" ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                ) : request.status === "Pending" ? (
                    <Clock className="h-5 w-5 text-amber-600" />
                ) : (
                    <AlertTriangle className="h-5 w-5 text-slate-600" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <Typography variant="body2" fontWeight="medium" noWrap>
                    {request.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {request.requester} • {request.date}
                </Typography>
            </div>
            <div className="text-right">
                <Typography variant="body2" fontWeight="bold">
                    {formatMoney(request.amount, request.currency)}
                </Typography>
                <Pill label={request.status} tone={toneForStatus(request.status)} />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
    );
}

function QuickActionCard({
    title,
    subtitle,
    icon: Icon,
    onClick,
    color = "bg-slate-50",
}: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    onClick: () => void;
    color?: string;
}) {
    return (
        <Card
            sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
            onClick={onClick}
        >
            <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                <div className={`mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
                    <Icon className="h-6 w-6 text-slate-700" />
                </div>
                <Typography fontWeight="medium" variant="body2">
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CorporateHub() {
    const navigate = useNavigate();
    const { selectedOrg, isEligible, eligibility, budgetHealth, caps, role } = useOrganization();

    // Mock requests
    const recentRequests = useMemo<RequestItem[]>(
        () => [
            {
                id: "r1",
                title: "Travel reimbursement",
                requester: "John Doe",
                amount: 450000,
                currency: "UGX",
                status: "Pending",
                date: "Today",
                category: "Travel",
            },
            {
                id: "r2",
                title: "Office supplies",
                requester: "Jane Smith",
                amount: 125000,
                currency: "UGX",
                status: "Approved",
                date: "Yesterday",
                category: "Operations",
            },
            {
                id: "r3",
                title: "Client meeting",
                requester: "Bob Wilson",
                amount: 89000,
                currency: "UGX",
                status: "Processing",
                date: "2 days ago",
                category: "Travel",
            },
        ],
        []
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title={selectedOrg?.name || "CorporatePay"}
                subtitle={`${role || "Member"} • ${selectedOrg?.group || "No group"}`}
                right={
                    <div className="flex items-center gap-2">
                        <Pill label={eligibility} tone={eligibility === "Eligible" ? "good" : "warn"} />
                    </div>
                }
            >
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => navigate("/corporate/org-switcher")}>
                        <Building2 className="h-4 w-4" /> Switch Organization
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/corporate/policies")}>
                        <ShieldCheck className="h-4 w-4" /> Policies
                    </Button>
                </div>
            </SectionCard>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Monthly Spend"
                        value={formatMoney(caps.monthly.usedUGX)}
                        subtitle="of {formatMoney(caps.monthly.limitUGX)} limit"
                        icon={Wallet}
                        trend="up"
                        tone={budgetHealth === "Blocked" ? "bad" : budgetHealth === "Near limit" ? "warn" : "good"}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Requests"
                        value="3"
                        subtitle="awaiting approval"
                        icon={Clock}
                        tone="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="This Month"
                        value="12"
                        subtitle="transactions"
                        icon={FileText}
                        trend="up"
                        tone="good"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Budget Health"
                        value={budgetHealth}
                        subtitle="remaining budget"
                        icon={TrendingUp}
                        tone={budgetHealth === "Blocked" ? "bad" : budgetHealth === "Near limit" ? "warn" : "good"}
                    />
                </Grid>
            </Grid>

            {/* Budget Overview */}
            <SectionCard title="Budget Overview" subtitle="Your spending limits this period" className="mt-4">
                <BudgetProgress
                    label="Daily"
                    used={caps.daily.usedUGX}
                    limit={caps.daily.limitUGX}
                    tone={caps.daily.usedUGX / caps.daily.limitUGX >= 0.9 ? "bad" : caps.daily.usedUGX / caps.daily.limitUGX >= 0.8 ? "warn" : "good"}
                />
                <BudgetProgress
                    label="Weekly"
                    used={caps.weekly.usedUGX}
                    limit={caps.weekly.limitUGX}
                    tone={caps.weekly.usedUGX / caps.weekly.limitUGX >= 0.9 ? "bad" : caps.weekly.usedUGX / caps.weekly.limitUGX >= 0.8 ? "warn" : "good"}
                />
                <BudgetProgress
                    label="Monthly"
                    used={caps.monthly.usedUGX}
                    limit={caps.monthly.limitUGX}
                    tone={caps.monthly.usedUGX / caps.monthly.limitUGX >= 0.9 ? "bad" : caps.monthly.usedUGX / caps.monthly.limitUGX >= 0.8 ? "warn" : "good"}
                />
            </SectionCard>

            {/* Quick Actions */}
            <Typography variant="h6" fontWeight="bold" gutterBottom className="mt-4">
                Quick Actions
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="New Request"
                        subtitle="Submit expense"
                        icon={FileText}
                        onClick={() => navigate("/corporate/requests")}
                        color="bg-blue-50"
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="Receipts"
                        subtitle="View all"
                        icon={CreditCard}
                        onClick={() => navigate("/corporate/receipts")}
                        color="bg-emerald-50"
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="Limits"
                        subtitle="Manage caps"
                        icon={Wallet}
                        onClick={() => navigate("/corporate/limits")}
                        color="bg-purple-50"
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="Notifications"
                        subtitle="View alerts"
                        icon={Bell}
                        onClick={() => navigate("/corporate/notifications")}
                        color="bg-amber-50"
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="Policies"
                        subtitle="View rules"
                        icon={ShieldCheck}
                        onClick={() => navigate("/corporate/policies")}
                        color="bg-slate-50"
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <QuickActionCard
                        title="Settings"
                        subtitle="Configure"
                        icon={Settings}
                        onClick={() => navigate("/corporate/preferences")}
                        color="bg-slate-50"
                    />
                </Grid>
            </Grid>

            {/* Recent Requests */}
            <SectionCard
                title="Recent Requests"
                subtitle="Your recent payment requests"
                className="mt-4"
                right={
                    <Button variant="ghost" onClick={() => navigate("/corporate/requests")}>
                        View All
                    </Button>
                }
            >
                {recentRequests.map((request) => (
                    <RequestRow key={request.id} request={request} />
                ))}
            </SectionCard>
        </Box>
    );
}
