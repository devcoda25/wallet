// ============================================================================
// Approval Submit Page
// Submit and review approval requests
// ============================================================================

import React, { useState } from "react";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    User,
    Building2,
    Calendar,
    DollarSign,
    MessageSquare,
    Paperclip,
    Send,
    Clock,
    Check,
    Shield,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type ApprovalAction = "approve" | "reject" | "request_info" | "delegate";

interface PendingApproval {
    id: string;
    title: string;
    requester: string;
    department: string;
    amount: number;
    submittedAt: string;
    priority: "low" | "medium" | "high" | "urgent";
    description: string;
    attachments: number;
    policyNotes?: string;
}

export default function ApprovalSubmit() {
    const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
    const [action, setAction] = useState<ApprovalAction | null>(null);
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pendingApprovals: PendingApproval[] = [
        {
            id: "APR-001",
            title: "Travel Expense - Q1 Sales Conference",
            requester: "John Doe",
            department: "Sales",
            amount: 2500000,
            submittedAt: "2024-01-14T10:30:00Z",
            priority: "high",
            description: "Requesting approval for travel expenses to attend the Q1 Sales Conference in Nairobi. Includes flight, accommodation, and per diem.",
            attachments: 3,
            policyNotes: "Amount exceeds standard travel policy threshold by UGX 500,000",
        },
        {
            id: "APR-002",
            title: "Office Equipment Purchase",
            requester: "Jane Smith",
            department: "Operations",
            amount: 850000,
            submittedAt: "2024-01-13T14:00:00Z",
            priority: "medium",
            description: "Purchase of new laptops for the design team. Required for upcoming project launch.",
            attachments: 2,
        },
        {
            id: "APR-003",
            title: "Client Entertainment - Vendor Meeting",
            requester: "Mike Johnson",
            department: "Sales",
            amount: 450000,
            submittedAt: "2024-01-12T11:00:00Z",
            priority: "low",
            description: "Business dinner with potential vendor to discuss partnership opportunities.",
            attachments: 1,
        },
    ];

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

    const getPriorityConfig = (priority: PendingApproval["priority"]) => {
        switch (priority) {
            case "urgent":
                return { label: "Urgent", tone: "bad" as const };
            case "high":
                return { label: "High", tone: "warn" as const };
            case "medium":
                return { label: "Medium", tone: "info" as const };
            case "low":
                return { label: "Low", tone: "neutral" as const };
        }
    };

    const handleAction = async (actionType: ApprovalAction) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setAction(null);
        setSelectedApproval(null);
        setComments("");
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approval Review</h1>
                    <p className="text-gray-500 mt-1">Review and approve pending requests</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SectionCard title="Pending" subtitle="Awaiting your action">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-amber-700">{pendingApprovals.length}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Urgent" subtitle="High priority items">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-700">
                            {pendingApprovals.filter((a) => a.priority === "high" || a.priority === "urgent").length}
                        </p>
                    </div>
                </SectionCard>
                <SectionCard title="Total Value" subtitle="Pending approvals">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-700">
                            {formatCurrency(pendingApprovals.reduce((sum, a) => sum + a.amount, 0))}
                        </p>
                    </div>
                </SectionCard>
                <SectionCard title="Completed" subtitle="This week">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-700">12</p>
                    </div>
                </SectionCard>
            </div>

            {/* Approval List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Pending Approvals" subtitle={`${pendingApprovals.length} items`}>
                    <div className="space-y-3 mt-4">
                        {pendingApprovals.map((approval) => {
                            const priority = getPriorityConfig(approval.priority);
                            return (
                                <div
                                    key={approval.id}
                                    onClick={() => setSelectedApproval(approval.id)}
                                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                                        selectedApproval === approval.id
                                            ? "bg-blue-50 border border-blue-200"
                                            : "bg-gray-50 hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900">{approval.title}</h3>
                                                <Pill label={priority.label} tone={priority.tone} />
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
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm font-medium text-gray-900">
                                                <span>{formatCurrency(approval.amount)}</span>
                                                <span className="flex items-center gap-1 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(approval.submittedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* Approval Details */}
                <div>
                    {selectedApproval ? (
                        <SectionCard
                            title="Approval Details"
                            subtitle={
                                pendingApprovals.find((a) => a.id === selectedApproval)?.id || ""
                            }
                        >
                            {(() => {
                                const approval = pendingApprovals.find((a) => a.id === selectedApproval);
                                if (!approval) return null;

                                return (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{approval.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Amount</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatCurrency(approval.amount)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Priority</p>
                                                <Pill
                                                    label={getPriorityConfig(approval.priority).label}
                                                    tone={getPriorityConfig(approval.priority).tone}
                                                />
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Requester</p>
                                                <p className="font-medium text-gray-900">{approval.requester}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Department</p>
                                                <p className="font-medium text-gray-900">{approval.department}</p>
                                            </div>
                                        </div>

                                        {approval.policyNotes && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">Policy Notes</p>
                                                        <p className="text-sm text-amber-700">{approval.policyNotes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Paperclip className="w-4 h-4" />
                                            <span>{approval.attachments} attachment(s)</span>
                                        </div>

                                        {/* Actions */}
                                        {!action && (
                                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                                <Button
                                                    variant="primary"
                                                    onClick={() => setAction("approve")}
                                                    className="flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAction("request_info")}
                                                    className="flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Request Info
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setAction("reject")}
                                                    className="flex items-center justify-center gap-2 text-red-600"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {/* Action Form */}
                                        {action && (
                                            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                                                <h4 className="font-medium text-gray-900">
                                                    {action === "approve"
                                                        ? "Approve Request"
                                                        : action === "reject"
                                                        ? "Reject Request"
                                                        : "Request Additional Information"}
                                                </h4>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Comments
                                                    </label>
                                                    <textarea
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={3}
                                                        placeholder={
                                                            action === "approve"
                                                                ? "Add any notes for the requester..."
                                                                : "Please provide a reason..."
                                                        }
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant={action === "approve" ? "primary" : "danger"}
                                                        onClick={() => handleAction(action)}
                                                        disabled={isSubmitting}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        {isSubmitting ? "Submitting..." : "Confirm"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setAction(null);
                                                            setComments("");
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </SectionCard>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Select an approval to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-800">Approval Guidelines</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                            <li>• Verify the request aligns with company policy</li>
                            <li>• Check for sufficient budget allocation</li>
                            <li>• Ensure appropriate documentation is attached</li>
                            <li>• Consider the request urgency and business impact</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
