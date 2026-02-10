// ============================================================================
// Out of Policy Page
// Policy violation handling and next steps
// ============================================================================

import React, { useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    ShieldAlert,
    Shield,
    FileText,
    RefreshCw,
    ArrowRight,
    HelpCircle,
    MessageSquare,
    Clock,
    Check,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type ViolationType = "hard_block" | "soft_block" | "restriction";

export default function OutOfPolicy() {
    const [isRequestingApproval, setIsRequestingApproval] = useState(false);

    // Sample out-of-policy scenarios
    const scenarios: Array<{
        id: string;
        title: string;
        type: ViolationType;
        policy: string;
        message: string;
        resolution: string;
        canOverride: boolean;
    }> = [
            {
                id: "1",
                title: "Amount Exceeds Approval Threshold",
                type: "soft_block",
                policy: "SPENDING-002",
                message: "Transaction amount of UGX 2,500,000 exceeds the approval threshold of UGX 1,000,000 for your role.",
                resolution: "Manager approval required before proceeding",
                canOverride: false,
            },
            {
                id: "2",
                title: "Vendor Not Approved",
                type: "hard_block",
                policy: "VENDOR-001",
                message: "This vendor is not in the approved vendor list for your organization.",
                resolution: "Request vendor approval or select an approved vendor",
                canOverride: false,
            },
            {
                id: "3",
                title: "Category Restricted",
                type: "restriction",
                policy: "CATEGORY-003",
                message: "Expenses in the 'Entertainment' category require additional documentation.",
                resolution: "Upload required documentation or select a different category",
                canOverride: false,
            },
            {
                id: "4",
                title: "Budget Depleted",
                type: "hard_block",
                policy: "BUDGET-001",
                message: "The monthly budget for this cost center has been fully utilized.",
                resolution: "Request budget increase from finance team",
                canOverride: false,
            },
        ];

    const getViolationConfig = (type: ViolationType) => {
        switch (type) {
            case "hard_block":
                return {
                    icon: <ShieldAlert className="w-12 h-12" />,
                    iconColor: "text-red-600",
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                    badge: <Pill label="Hard Block" tone="bad" />,
                };
            case "soft_block":
                return {
                    icon: <AlertTriangle className="w-12 h-12" />,
                    iconColor: "text-amber-600",
                    bgColor: "bg-amber-50",
                    borderColor: "border-amber-200",
                    badge: <Pill label="Soft Block" tone="warn" />,
                };
            case "restriction":
                return {
                    icon: <Shield className="w-12 h-12" />,
                    iconColor: "text-blue-600",
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                    badge: <Pill label="Restriction" tone="info" />,
                };
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Out of Policy</h1>
                    <p className="text-gray-500 mt-1">Policy violations and resolution options</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${getViolationConfig("hard_block").bgColor} ${getViolationConfig("hard_block").borderColor}`}>
                    <div className="flex items-center gap-3">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-red-700">Hard Blocks</p>
                            <p className="text-2xl font-bold text-red-700">2</p>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-lg border ${getViolationConfig("soft_block").bgColor} ${getViolationConfig("soft_block").borderColor}`}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        <div>
                            <p className="text-sm font-medium text-amber-700">Soft Blocks</p>
                            <p className="text-2xl font-bold text-amber-700">3</p>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-lg border ${getViolationConfig("restriction").bgColor} ${getViolationConfig("restriction").borderColor}`}>
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-blue-700">Restrictions</p>
                            <p className="text-2xl font-bold text-blue-700">1</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Violation Scenarios */}
            <SectionCard title="Policy Violations" subtitle="Common out-of-policy scenarios">
                <div className="space-y-4 mt-4">
                    {scenarios.map((scenario) => {
                        const config = getViolationConfig(scenario.type);
                        return (
                            <div key={scenario.id} className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg bg-white shadow-sm ${config.iconColor}`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
                                            {config.badge}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{scenario.message}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            <FileText className="w-3 h-3" />
                                            <span>Policy: {scenario.policy}</span>
                                        </div>
                                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                            <p className="text-sm">
                                                <span className="font-medium">Resolution:</span> {scenario.resolution}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Request Approval Flow */}
            <SectionCard title="Request Exception" subtitle="Request approval for out-of-policy transactions">
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Submit Approval Request</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Exception</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Explain why this transaction should be approved despite policy violation..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documentation</label>
                            <input
                                type="file"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setIsRequestingApproval(true)}
                            className="flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Submit Request
                        </Button>
                    </div>
                </div>
            </SectionCard>

            {/* Policy Education */}
            <SectionCard title="Understanding Policy Violations" subtitle="Learn about policy enforcement">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Hard Blocks</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Transactions that cannot proceed without explicit approval or correction. These violate fundamental policy rules.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Soft Blocks</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Transactions that require approval but can proceed with manager authorization. These are above standard thresholds.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Restrictions</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Additional requirements that must be met before proceeding. May include documentation or special approval.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Need Help?</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Contact your finance team or policy administrator for guidance on policy compliance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Review Transaction
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Policy Guide
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact Support
                </Button>
            </div>
        </div>
    );
}
