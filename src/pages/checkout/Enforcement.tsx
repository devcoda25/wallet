// ============================================================================
// Enforcement Page
// Policy enforcement and blocking screens
// ============================================================================

import React, { useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Info,
    RefreshCw,
    ArrowRight,
    FileText,
    Building2,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type EnforcementType = "blocked" | "warning" | "info";

interface EnforcementConfig {
    type: EnforcementType;
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    bgColor: string;
}

export default function Enforcement() {
    const [isLoading, setIsLoading] = useState(false);

    // Sample enforcement scenarios
    const enforcementScenarios: Array<{
        id: string;
        title: string;
        type: EnforcementType;
        message: string;
        policy: string;
        help: string;
    }> = [
        {
            id: "1",
            title: "Vendor Not Approved",
            type: "blocked",
            message: "This vendor is not in your organization's approved vendor list.",
            policy: "PROCUREMENT-001",
            help: "Contact your procurement team to add this vendor to the approved list.",
        },
        {
            id: "2",
            title: "Category Restricted",
            type: "warning",
            message: "This expense category requires pre-approval for amounts above UGX 500,000.",
            policy: "SPENDING-003",
            help: "Submit a spending request for approval before proceeding.",
        },
        {
            id: "3",
            title: "Budget Exceeded",
            type: "blocked",
            message: "Your department's monthly budget has been fully utilized.",
            policy: "BUDGET-002",
            help: "Request a budget increase from your finance team.",
        },
        {
            id: "4",
            title: "Outside Operating Hours",
            type: "info",
            message: "Corporate spending is restricted outside business hours (8 AM - 6 PM).",
            policy: "TIME-001",
            help: "Schedule this transaction for the next business day.",
        },
    ];

    const getEnforcementConfig = (type: EnforcementType): EnforcementConfig => {
        switch (type) {
            case "blocked":
                return {
                    type: "blocked",
                    title: "Transaction Blocked",
                    icon: <ShieldAlert className="w-12 h-12" />,
                    iconColor: "text-red-600",
                    bgColor: "bg-red-50",
                };
            case "warning":
                return {
                    type: "warning",
                    title: "Attention Required",
                    icon: <AlertTriangle className="w-12 h-12" />,
                    iconColor: "text-amber-600",
                    bgColor: "bg-amber-50",
                };
            case "info":
                return {
                    type: "info",
                    title: "Information",
                    icon: <Info className="w-12 h-12" />,
                    iconColor: "text-blue-600",
                    bgColor: "bg-blue-50",
                };
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enforcement</h1>
                    <p className="text-gray-500 mt-1">Policy enforcement and blocking screens</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard title="Blocked" subtitle="Transactions denied">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">3</p>
                    </div>
                </SectionCard>
                <SectionCard title="Warnings" subtitle="Requires attention">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">5</p>
                    </div>
                </SectionCard>
                <SectionCard title="Info" subtitle="Advisory messages">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">2</p>
                    </div>
                </SectionCard>
            </div>

            {/* Enforcement Scenarios */}
            <SectionCard title="Enforcement Scenarios" subtitle="How different policy violations are handled">
                <div className="space-y-4 mt-4">
                    {enforcementScenarios.map((scenario) => {
                        const config = getEnforcementConfig(scenario.type);
                        return (
                            <div key={scenario.id} className={`p-4 rounded-lg ${config.bgColor}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg bg-white shadow-sm ${config.iconColor}`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
                                            <Pill
                                                label={scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)}
                                                tone={
                                                    scenario.type === "blocked"
                                                        ? "bad"
                                                        : scenario.type === "warning"
                                                        ? "warn"
                                                        : "info"
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{scenario.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {scenario.policy}
                                            </span>
                                        </div>
                                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Help:</span> {scenario.help}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Policy Reference */}
            <SectionCard title="Policy Enforcement Reference" subtitle="Common enforcement patterns">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Shield className="w-5 h-5 text-gray-600" />
                            <h4 className="font-medium text-gray-900">Hard Blocks</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li>• Program not eligible</li>
                            <li>• Vendor denylisted</li>
                            <li>• Budget exhausted</li>
                            <li>• Hard threshold exceeded</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck className="w-5 h-5 text-gray-600" />
                            <h4 className="font-medium text-gray-900">Soft Blocks (Warnings)</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li>• Approval threshold</li>
                            <li>• Vendor restricted</li>
                            <li>• Missing allocation</li>
                            <li>• Unusual pattern detected</li>
                        </ul>
                    </div>
                </div>
            </SectionCard>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Policy
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Policy Guide
                </Button>
            </div>
        </div>
    );
}
