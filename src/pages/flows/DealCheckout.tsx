// ============================================================================
// Deal Checkout Page
// Corporate deal/promotion checkout with policy enforcement
// ============================================================================

import React, { useState } from "react";
import {
    Tag,
    Percent,
    Clock,
    CreditCard,
    Shield,
    User,
    Building2,
    ChevronRight,
    CheckCircle,
    AlertTriangle,
    FileText,
    ArrowRight,
    Phone,
    MessageSquare,
    Wallet,
    Briefcase,
    DollarSign,
    Calendar,
    Tag as TagIcon,
    Percent as PercentIcon,
    Star,
    Gift,
    TrendingUp,
    Target,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";

interface Deal {
    id: string;
    name: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    expiresAt: string;
    conditions: string[];
    category: string;
}

const AVAILABLE_DEALS: Deal[] = [
    {
        id: "deal1",
        name: "Bulk Office Supplies",
        description: "Get 15% off on bulk office supplies orders over UGX 1,000,000",
        originalPrice: 2000000,
        discountedPrice: 1700000,
        discount: 15,
        expiresAt: "2024-02-28",
        conditions: ["Minimum order: UGX 1,000,000", "Valid for office supplies only", "Cannot combine with other offers"],
        category: "supplies",
    },
    {
        id: "deal2",
        name: "Early Payment Discount",
        description: "Get 5% off when you pay within 7 days of invoice",
        originalPrice: 500000,
        discountedPrice: 475000,
        discount: 5,
        expiresAt: "2024-12-31",
        conditions: ["Valid for invoices under UGX 5,000,000", "Payment must be made within 7 days"],
        category: "payment",
    },
    {
        id: "deal3",
        name: "Corporate Loyalty Reward",
        description: "Earn double loyalty points on all transactions this month",
        originalPrice: 100000,
        discountedPrice: 100000,
        discount: 0,
        expiresAt: "2024-01-31",
        conditions: ["Points credited within 48 hours", "Valid for corporate accounts only"],
        category: "loyalty",
    },
    {
        id: "deal4",
        name: "New Vendor Introduction",
        description: "10% discount on first order from new approved vendors",
        originalPrice: 500000,
        discountedPrice: 450000,
        discount: 10,
        expiresAt: "2024-06-30",
        conditions: ["First order only", "Vendor must be newly approved", "Max discount: UGX 100,000"],
        category: "vendor",
    },
];

const CORPORATE_POLICY = {
    requiresApproval: true,
    maxDiscountPercent: 20,
    requiresTags: true,
    allowedCategories: ["supplies", "services", "equipment", "software"],
    requiresPurpose: true,
};

export default function DealCheckout() {
    const [currentStep, setCurrentStep] = useState<"deal" | "details" | "policy" | "payment" | "confirm">("deal");
    const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [purpose, setPurpose] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("corporate");
    const [isPolicyCompliant, setIsPolicyCompliant] = useState<boolean | null>(null);

    const deal = AVAILABLE_DEALS.find((d) => d.id === selectedDeal);
    const savings = deal ? deal.originalPrice - deal.discountedPrice : 0;

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const handlePolicyCheck = () => {
        const isCompliant =
            deal && deal.discount <= CORPORATE_POLICY.maxDiscountPercent && selectedCategory && selectedTags.length > 0;
        setIsPolicyCompliant(!!isCompliant);
    };

    const renderDealSelection = () => (
        <div className="space-y-6">
            {/* Savings Summary */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100">Available Savings</p>
                        <p className="text-3xl font-bold mt-1">
                            {formatCurrency(AVAILABLE_DEALS.reduce((sum, d) => sum + (d.originalPrice - d.discountedPrice), 0))}
                        </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg">
                        <Gift className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Deals List */}
            <SectionCard title="Available Deals" subtitle="Select a deal to apply">
                <div className="space-y-3 mt-4">
                    {AVAILABLE_DEALS.map((d) => (
                        <div
                            key={d.id}
                            onClick={() => setSelectedDeal(d.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedDeal === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{d.name}</h3>
                                        {d.discount > 0 && (
                                            <Pill
                                                label={`${d.discount}% OFF`}
                                                tone={d.discount > 10 ? "good" : "info"}
                                            />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{d.description}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            Expires: {d.expiresAt}
                                        </span>
                                        <Pill label={d.category} tone="neutral" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Save</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(d.originalPrice - d.discountedPrice)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Price Comparison */}
            {deal && (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Original Price</p>
                            <p className="text-xl font-bold text-gray-400 line-through">{formatCurrency(deal.originalPrice)}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Final Price</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(deal.discountedPrice)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">You Save</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(savings)}</p>
                        </div>
                    </div>
                </div>
            )}

            <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep("details")}
                disabled={!selectedDeal}
                className="w-full flex items-center justify-center gap-2"
            >
                Apply Deal <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );

    const renderDetails = () => {
        if (!deal) return null;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep("deal")}>
                        ← Back
                    </Button>
                </div>

                {/* Deal Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TagIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{deal.name}</h3>
                            <p className="text-sm text-gray-500">{deal.description}</p>
                        </div>
                        <Pill label={`Save ${formatCurrency(savings)}`} tone="good" />
                    </div>
                </div>

                {/* Deal Conditions */}
                <SectionCard title="Deal Conditions" subtitle="Terms and conditions">
                    <ul className="space-y-2 mt-4">
                        {deal.conditions.map((condition, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{condition}</span>
                            </li>
                        ))}
                    </ul>
                </SectionCard>

                {/* Corporate Requirements */}
                <SectionCard title="Corporate Requirements" subtitle="Required for deal application">
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expense Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select category</option>
                                {CORPORATE_POLICY.allowedCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purpose <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Explain the business purpose..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags (Cost Center / Project) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {["Operations", "Marketing", "Sales", "IT-Department", "Office-Services"].map((tag) => (
                                    <div
                                        key={tag}
                                        className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                                            selectedTags.includes(tag)
                                                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                                                : "bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-200"
                                        }`}
                                        onClick={() => {
                                            if (selectedTags.includes(tag)) {
                                                setSelectedTags(selectedTags.filter((t) => t !== tag));
                                            } else {
                                                setSelectedTags([...selectedTags, tag]);
                                            }
                                        }}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep("policy")}
                    disabled={!selectedCategory || !purpose || selectedTags.length === 0}
                    className="w-full flex items-center justify-center gap-2"
                >
                    Check Policy <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        );
    };

    const renderPolicyCheck = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep("details")}>
                    ← Back
                </Button>
            </div>

            <SectionCard title="Policy Verification" subtitle="Checking compliance for deal">
                <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <PercentIcon className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">Discount within limit ({deal?.discount}% ≤ {CORPORATE_POLICY.maxDiscountPercent}%)</span>
                        </div>
                        {deal && deal.discount <= CORPORATE_POLICY.maxDiscountPercent ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">Tags assigned</span>
                        </div>
                        {selectedTags.length > 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">Purpose stated</span>
                        </div>
                        {purpose ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                    </div>
                </div>

                <div
                    className={`p-4 rounded-lg border-2 mt-4 ${
                        isPolicyCompliant ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isPolicyCompliant ? (
                            <>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                                <div>
                                    <h4 className="font-semibold text-green-800">Deal Eligible</h4>
                                    <p className="text-sm text-green-700">This deal meets all corporate policy requirements</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                                <div>
                                    <h4 className="font-semibold text-amber-800">Policy Review Required</h4>
                                    <p className="text-sm text-amber-700">Some requirements need manager approval</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </SectionCard>

            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep("details")} className="flex-1">
                    Back
                </Button>
                <Button variant="primary" size="lg" onClick={() => setCurrentStep("payment")} className="flex-1 flex items-center justify-center gap-2">
                    Continue to Payment <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const renderPayment = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep("policy")}>
                    ← Back
                </Button>
            </div>

            <SectionCard title="Payment Method" subtitle="Select how to pay">
                <div className="space-y-3 mt-4">
                    <div
                        onClick={() => setPaymentMethod("corporate")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMethod === "corporate"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Corporate Account</h4>
                                <p className="text-sm text-gray-500">Charge to corporate expense account</p>
                            </div>
                            {paymentMethod === "corporate" && <CheckCircle className="w-5 h-5 text-blue-600" />}
                        </div>
                    </div>

                    <div
                        onClick={() => setPaymentMethod("personal")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMethod === "personal"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Wallet className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Personal Payment</h4>
                                <p className="text-sm text-gray-500">Pay with personal funds (reimbursement)</p>
                            </div>
                            {paymentMethod === "personal" && <CheckCircle className="w-5 h-5 text-blue-600" />}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Deal Summary */}
            <SectionCard title="Deal Summary" subtitle="Final pricing">
                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Original Price</span>
                        <span className="text-gray-900 line-through">{formatCurrency(deal?.originalPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                        <span>Discount ({deal?.discount}%)</span>
                        <span>-{formatCurrency(savings)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Final Amount</span>
                            <span className="text-blue-600">{formatCurrency(deal?.discountedPrice || 0)}</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <Button variant="primary" size="lg" onClick={() => setCurrentStep("confirm")} className="w-full flex items-center justify-center gap-2">
                Apply Deal <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-6">
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Deal Applied!</h2>
                <p className="text-gray-500 mt-2">Your deal has been successfully applied</p>
            </div>

            <SectionCard title="Deal Confirmation" subtitle="Confirmation #DEAL-2024-001">
                <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                        <TagIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Deal Applied</p>
                            <p className="font-medium text-gray-900">{deal?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <PercentIcon className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Discount</p>
                            <p className="font-medium text-gray-900">
                                {deal?.discount}% off ({formatCurrency(savings)} saved)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Final Amount</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(deal?.discountedPrice || 0)}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800">Deal Activated</p>
                        <p className="text-sm text-green-700">
                            {deal?.conditions[0] || "Deal terms applied successfully"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    View More Deals
                </Button>
                <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Contact Support
                </Button>
                <Button variant="ghost" size="lg" className="w-full" onClick={() => window.location.reload()}>
                    Apply Another Deal
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Deal Checkout</h1>
                    <p className="text-gray-500 mt-1">Apply corporate deals and promotions</p>
                </div>
                <Pill
                    label={
                        currentStep === "deal"
                            ? "Step 1: Deal"
                            : currentStep === "details"
                            ? "Step 2: Details"
                            : currentStep === "policy"
                            ? "Step 3: Policy"
                            : currentStep === "payment"
                            ? "Step 4: Payment"
                            : "Complete"
                    }
                    tone="info"
                />
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                        width:
                            currentStep === "deal"
                                ? "20%"
                                : currentStep === "details"
                                ? "40%"
                                : currentStep === "policy"
                                ? "60%"
                                : currentStep === "payment"
                                ? "80%"
                                : "100%",
                    }}
                />
            </div>

            {/* Step Content */}
            {currentStep === "deal" && renderDealSelection()}
            {currentStep === "details" && renderDetails()}
            {currentStep === "policy" && renderPolicyCheck()}
            {currentStep === "payment" && renderPayment()}
            {currentStep === "confirm" && renderConfirmation()}
        </div>
    );
}
