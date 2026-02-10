// ============================================================================
// Approval Status Page
// Pending approval timeline and status tracking
// ============================================================================

import React, { useState } from "react";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    User,
    Building2,
    ChevronRight,
    RefreshCw,
    ExternalLink,
    Calendar,
    DollarSign,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type ApprovalStatus = "pending" | "approved" | "rejected" | "in_review";

interface ApprovalRequest {
    id: string;
    title: string;
    requester: string;
    department: string;
    amount: number;
    status: ApprovalStatus;
    submittedAt: string;
    lastUpdated: string;
    expectedDecision?: string;
    priority: "low" | "medium" | "high" | "urgent";
}

const sampleApprovals: ApprovalRequest[] = [
    {
        id: "APR-001",
        title: "Travel Expense - Q1 Sales Conference",
        requester: "John Doe",
        department: "Sales",
        amount: 2500000,
        status: "pending",
        submittedAt: "2024-01-14T10:30:00Z",
        lastUpdated: "2024-01-14T10:30:00Z",
        expectedDecision: "2024-01-15",
        priority: "high",
    },
    {
        id: "APR-002",
        title: "Office Equipment Purchase",
        requester: "Jane Smith",
        department: "Operations",
        amount: 850000,
        status: "in_review",
        submittedAt: "2024-01-13T14:00:00Z",
        lastUpdated: "2024-01-14T09:15:00Z",
        priority: "medium",
    },
    {
        id: "APR-003",
        title: "Client Entertainment - Vendor Meeting",
        requester: "Mike Johnson",
        department: "Sales",
        amount: 450000,
        status: "approved",
        submittedAt: "2024-01-12T11:00:00Z",
        lastUpdated: "2024-01-13T16:30:00Z",
        priority: "low",
    },
    {
        id: "APR-004",
        title: "Software License Renewal",
        requester: "Sarah Williams",
        department: "IT",
        amount: 3200000,
        status: "rejected",
        submittedAt: "2024-01-10T09:00:00Z",
        lastUpdated: "2024-01-12T14:20:00Z",
        priority: "urgent",
    },
];

export default function ApprovalStatus() {
    const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

    const filteredApprovals = sampleApprovals.filter((approval) => {
        if (selectedTab === "all") return true;
        return approval.status === selectedTab;
    });

    const formatCurrency = (amount: number) => {
        return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusConfig = (status: ApprovalStatus) => {
        switch (status) {
            case "pending":
                return {
                    icon: <Clock className="w-5 h-5" />,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    label: "Pending",
                    tone: "warn" as const,
                };
            case "in_review":
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    label: "In Review",
                    tone: "info" as const,
                };
            case "approved":
                return {
                    icon: <CheckCircle className="w-5 h-5" />,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    border: "border-green-200",
                    label: "Approved",
                    tone: "good" as const,
                };
            case "rejected":
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    label: "Rejected",
                    tone: "bad" as const,
                };
        }
    };

    const getPriorityConfig = (priority: ApprovalRequest["priority"]) => {
        switch (priority) {
            case "urgent":
                return <Pill label="Urgent" tone="bad" />;
            case "high":
                return <Pill label="High" tone="warn" />;
            case "medium":
                return <Pill label="Medium" tone="info" />;
            case "low":
                return <Pill label="Low" tone="neutral" />;
        }
    };

    const stats = {
        pending: sampleApprovals.filter((a) => a.status === "pending" || a.status === "in_review").length,
        approved: sampleApprovals.filter((a) => a.status === "approved").length,
        rejected: sampleApprovals.filter((a) => a.status === "rejected").length,
        total: sampleApprovals.length,
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approval Status</h1>
                    <p className="text-gray-500 mt-1">Track your pending approvals and requests</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SectionCard title="Total Requests" subtitle="All time">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <FileText className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Pending" subtitle="Awaiting decision">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Approved" subtitle="Successfully approved">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Rejected" subtitle="Not approved">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
                    </div>
                </SectionCard>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${selectedTab === tab
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Approval List */}
            <SectionCard title="Approval Requests" subtitle={`${filteredApprovals.length} items`}>
                <div className="space-y-3 mt-4">
                    {filteredApprovals.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No approvals found</p>
                        </div>
                    ) : (
                        filteredApprovals.map((approval) => {
                            const statusConfig = getStatusConfig(approval.status);
                            return (
                                <div
                                    key={approval.id}
                                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                                                {statusConfig.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900">{approval.title}</h3>
                                                    {getPriorityConfig(approval.priority)}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {approval.requester}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {approval.department}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        {formatCurrency(approval.amount)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                    <span>{approval.id}</span>
                                                    <span>Submitted: {formatDate(approval.submittedAt)}</span>
                                                    <span>Updated: {formatDate(approval.lastUpdated)}</span>
                                                    {approval.expectedDecision && (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <Calendar className="w-3 h-3" />
                                                            Expected: {approval.expectedDecision}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Pill label={statusConfig.label} tone={statusConfig.tone} />
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </SectionCard>

            {/* Timeline View */}
            <SectionCard title="Recent Activity" subtitle="Latest approval actions">
                <div className="mt-4 space-y-4">
                    {[
                        { action: "Submitted for approval", item: "Travel Expense - Q1 Sales Conference", time: "2 hours ago", user: "John Doe" },
                        { action: "Approved", item: "Client Entertainment - Vendor Meeting", time: "1 day ago", user: "Manager" },
                        { action: "Returned for revision", item: "Software License Renewal", time: "2 days ago", user: "Finance Team" },
                        { action: "Rejected", item: "Marketing Campaign Request", time: "3 days ago", user: "Director" },
                    ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-900">{activity.action}</p>
                                <p className="text-sm text-gray-500">{activity.item}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {activity.user} • {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
