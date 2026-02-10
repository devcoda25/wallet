// ============================================================================
// Purpose & Attestation Page
// ============================================================================

import React, { useState } from "react";
import {
    FileText,
    CheckCircle,
    AlertTriangle,
    Shield,
    User,
    Building2,
    Calendar,
    ChevronRight,
    Info,
    MessageSquare,
    Send,
    Clock,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

interface AttestationConfig {
    id: string;
    title: string;
    description: string;
    required: boolean;
    options?: string[];
}

const ATTESTATIONS: AttestationConfig[] = [
    {
        id: "business-purpose",
        title: "Business Purpose",
        description: "Confirm this expense is for legitimate business purposes",
        required: true,
    },
    {
        id: "policy-ack",
        title: "Policy Acknowledgment",
        description: "I acknowledge that this expense complies with company policies",
        required: true,
    },
    {
        id: "approval-if-needed",
        title: "Approval Status",
        description: "If exceeding limits, required approvals have been obtained",
        required: true,
        options: ["Not applicable", "Approved", "Pending approval"],
    },
    {
        id: "documentation",
        title: "Documentation",
        description: "I will attach all required receipts and supporting documents",
        required: true,
    },
    {
        id: "tax-compliance",
        title: "Tax Compliance",
        description: "This expense follows tax compliance requirements",
        required: false,
    },
];

export default function PurposeAttestation() {
    const [attestations, setAttestations] = useState<Record<string, boolean>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [purpose, setPurpose] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const requiredCount = ATTESTATIONS.filter((a) => a.required).length;
    const completedCount = ATTESTATIONS.filter(
        (a) => attestations[a.id] && (a.options ? selectedOptions[a.id] : true)
    ).length;
    const isComplete = completedCount >= requiredCount && purpose.length >= 10;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="space-y-6 p-6">
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Attestation Complete</h2>
                    <p className="text-gray-500 mt-2">Your purpose and attestation has been submitted</p>
                </div>

                <SectionCard title="Submitted Information" subtitle="Confirmation">
                    <div className="space-y-4 mt-4">
                        <div>
                            <p className="text-sm text-gray-500">Business Purpose</p>
                            <p className="font-medium text-gray-900">{purpose}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Attestations</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(attestations)
                                    .filter(([, value]) => value)
                                    .map(([key]) => (
                                        <Pill
                                            key={key}
                                            label={ATTESTATIONS.find((a) => a.id === key)?.title || key}
                                            tone="good"
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                    Submit Another
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Purpose & Attestation</h1>
                <p className="text-gray-500 mt-1">Provide business purpose and acknowledge policies</p>
            </div>

            {/* Progress */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completion Status</span>
                    <span className="text-sm text-gray-500">
                        {completedCount}/{requiredCount} required completed
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-amber-500"
                            }`}
                        style={{ width: `${(completedCount / requiredCount) * 100}%` }}
                    />
                </div>
            </div>

            {/* Business Purpose */}
            <SectionCard title="Business Purpose" subtitle="Describe the purpose of this transaction">
                <div className="space-y-4 mt-4">
                    <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Describe the business purpose of this transaction in detail (minimum 10 characters)..."
                    />
                    <div className="flex items-center justify-between text-sm">
                        <span className={purpose.length >= 10 ? "text-green-600" : "text-gray-500"}>
                            {purpose.length}/10 minimum characters
                        </span>
                    </div>
                </div>
            </SectionCard>

            {/* Attestations */}
            <SectionCard title="Attestations" subtitle="Required acknowledgments">
                <div className="space-y-4 mt-4">
                    {ATTESTATIONS.map((attestation) => (
                        <div
                            key={attestation.id}
                            className={`p-4 rounded-lg border-2 ${attestations[attestation.id]
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id={attestation.id}
                                    checked={attestations[attestation.id] || false}
                                    onChange={(e) =>
                                        setAttestations({
                                            ...attestations,
                                            [attestation.id]: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5 mt-0.5 text-blue-600 rounded"
                                />
                                <div className="flex-1">
                                    <label
                                        htmlFor={attestation.id}
                                        className="font-medium text-gray-900 cursor-pointer"
                                    >
                                        {attestation.title}
                                        {attestation.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1">{attestation.description}</p>
                                    {attestation.options && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attestation.options.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() =>
                                                        setSelectedOptions({
                                                            ...selectedOptions,
                                                            [attestation.id]: option,
                                                        })
                                                    }
                                                    className={`px-3 py-1 text-sm rounded-full border transition-all ${selectedOptions[attestation.id] === option
                                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {attestations[attestation.id] && (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Policy Reminder */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-amber-800">Important Notice</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Providing false or misleading information may result in disciplinary action. Ensure all
                            details are accurate and complete.
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!isComplete || isSubmitting}
                className="w-full flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Clock className="w-5 h-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Submit Attestation
                    </>
                )}
            </Button>
        </div>
    );
}
