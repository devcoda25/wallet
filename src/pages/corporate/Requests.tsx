// ============================================================================
// Requests Page - My Requests & Approvals (U5)
// ============================================================================

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Plus,
    Search,
    Filter,
    Check,
    Clock,
    X,
    AlertTriangle,
    ChevronRight,
    CreditCard,
    Calendar,
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
    Button as MUIButton,
    LinearProgress,
} from "@mui/material";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Processing";
type RequestCategory = "Travel" | "Operations" | "Supplies" | "Services" | "Other";

interface RequestItem {
    id: string;
    title: string;
    description: string;
    requester: string;
    amount: number;
    currency: string;
    status: RequestStatus;
    date: string;
    category: RequestCategory;
    dueDate?: string;
    costCenter?: string;
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

function RequestCard({ request, onClick }: { request: RequestItem; onClick: () => void }) {
    const navigate = useNavigate();

    const statusIcon =
        request.status === "Approved" ? (
            <Check className="h-5 w-5 text-emerald-600" />
        ) : request.status === "Rejected" ? (
            <X className="h-5 w-5 text-rose-600" />
        ) : request.status === "Processing" ? (
            <Clock className="h-5 w-5 text-blue-600" />
        ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
        );

    const statusBg =
        request.status === "Approved"
            ? "bg-emerald-50"
            : request.status === "Rejected"
                ? "bg-rose-50"
                : request.status === "Processing"
                    ? "bg-blue-50"
                    : "bg-amber-50";

    return (
        <Card sx={{ mb: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} onClick={onClick}>
            <CardContent>
                <div className="flex items-start gap-4">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${statusBg}`}>
                        {statusIcon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <Typography variant="h6" fontWeight="bold">
                                {request.title}
                            </Typography>
                            <Pill label={request.status} tone={toneForStatus(request.status)} />
                        </div>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {request.description}
                        </Typography>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Typography variant="body2" fontWeight="bold">
                                {formatMoney(request.amount, request.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                • {request.requester}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                • {request.date}
                            </Typography>
                            {request.costCenter && (
                                <Chip label={request.costCenter} size="small" variant="outlined" />
                            )}
                        </div>
                        {request.dueDate && request.status === "Pending" && (
                            <div className="mt-2 flex items-center gap-1 text-amber-600">
                                <Calendar className="h-4 w-4" />
                                <Typography variant="caption">Due: {request.dueDate}</Typography>
                            </div>
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Requests() {
    const navigate = useNavigate();
    const { role, caps } = useOrganization();
    const [tab, setTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");

    // Mock requests
    const requests = useMemo<RequestItem[]>(
        () => [
            {
                id: "r1",
                title: "Travel reimbursement - Client meeting",
                description: "Travel expenses for meeting with Acme Corp",
                requester: "John Doe",
                amount: 450000,
                currency: "UGX",
                status: "Pending",
                date: "Today",
                category: "Travel",
                dueDate: "Tomorrow",
                costCenter: "SAL-03",
            },
            {
                id: "r2",
                title: "Office supplies purchase",
                description: "Printer paper, toners, and stationery",
                requester: "Jane Smith",
                amount: 125000,
                currency: "UGX",
                status: "Approved",
                date: "Yesterday",
                category: "Supplies",
                costCenter: "OPS-01",
            },
            {
                id: "r3",
                title: "Software subscription",
                description: "Annual license for design software",
                requester: "Bob Wilson",
                amount: 890000,
                currency: "UGX",
                status: "Processing",
                date: "2 days ago",
                category: "Services",
                costCenter: "IT-02",
            },
            {
                id: "r4",
                title: "Team lunch - Q1 review",
                description: "Catering for quarterly team review meeting",
                requester: "Alice Brown",
                amount: 350000,
                currency: "UGX",
                status: "Rejected",
                date: "3 days ago",
                category: "Operations",
                costCenter: "HR-01",
            },
            {
                id: "r5",
                title: "Flight booking - Conference",
                description: "Flight to Kampala for tech conference",
                requester: "Charlie Davis",
                amount: 1200000,
                currency: "UGX",
                status: "Pending",
                date: "Today",
                category: "Travel",
                dueDate: "In 5 days",
                costCenter: "TRV-01",
            },
        ],
        []
    );

    const filteredRequests = useMemo(
        () =>
            requests.filter(
                (r) =>
                    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (statusFilter === "all" || r.status === statusFilter)
            ),
        [requests, searchQuery, statusFilter]
    );

    const pendingCount = requests.filter((r) => r.status === "Pending").length;
    const approvedCount = requests.filter((r) => r.status === "Approved").length;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="My Requests"
                subtitle={`${role || "Employee"} view`}
                right={
                    <Button variant="primary" onClick={() => navigate("/checkout/payment-method")}>
                        <Plus className="h-4 w-4" /> New Request
                    </Button>
                }
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab
                        value={0}
                        label="All"
                        icon={<FileText className="h-4 w-4" />}
                        iconPosition="start"
                    />
                    <Tab
                        value={1}
                        label={`Pending (${pendingCount})`}
                        icon={<Clock className="h-4 w-4" />}
                        iconPosition="start"
                    />
                    <Tab
                        value={2}
                        label={`Approved (${approvedCount})`}
                        icon={<Check className="h-4 w-4" />}
                        iconPosition="start"
                    />
                </Tabs>
            </SectionCard>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Pending Approval
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {pendingCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Total Amount
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {formatMoney(requests.reduce((sum, r) => sum + r.amount, 0))}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Monthly Limit Used
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {Math.round((caps.monthly.usedUGX / caps.monthly.limitUGX) * 100)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(caps.monthly.usedUGX / caps.monthly.limitUGX) * 100}
                                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                This Month
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {requests.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                requests submitted
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Search and Filter */}
            <div className="mt-4 flex flex-col gap-2">
                <TextField
                    fullWidth
                    placeholder="Search requests..."
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
                    {(["all", "Pending", "Approved", "Rejected", "Processing"] as const).map((status) => (
                        <Chip
                            key={status}
                            label={status === "all" ? "All" : status}
                            onClick={() => setStatusFilter(status as RequestStatus | "all")}
                            variant={statusFilter === status ? "filled" : "outlined"}
                            color={statusFilter === status ? "primary" : "default"}
                            sx={{ borderRadius: 2 }}
                        />
                    ))}
                </div>
            </div>

            {/* Request List */}
            <SectionCard title="Requests" subtitle={`${filteredRequests.length} requests`} className="mt-4">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            onClick={() => navigate(`/corporate/requests/${request.id}`)}
                        />
                    ))
                ) : (
                    <div className="py-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-300" />
                        <Typography variant="h6" fontWeight="semibold" sx={{ mt: 2 }}>
                            No requests found
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {searchQuery
                                ? "Try a different search term"
                                : "Create your first request to get started"}
                        </Typography>
                        {!searchQuery && (
                            <Button variant="primary" className="mt-2" onClick={() => navigate("/checkout/payment-method")}>
                                <Plus className="h-4 w-4" /> New Request
                            </Button>
                        )}
                    </div>
                )}
            </SectionCard>
        </Box>
    );
}
