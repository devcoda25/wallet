// ============================================================================
// Final Review Page
// Checkout Summary (Final Review)
// ============================================================================

import React, { useState } from "react";
import {
    CheckCircle,
    CreditCard,
    Shield,
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    Package,
    Truck,
    User,
    Building2,
    FileText,
    Tag,
    ChevronRight,
    Edit,
    Printer,
    Download,
    Share2,
    ArrowRight,
    AlertTriangle,
    Star,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface CheckoutSummary {
    orderId: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    paymentMethod: string;
    deliveryAddress: string;
    deliveryDate: string;
    policyStatus: "compliant" | "pending" | "review";
    tags: string[];
}

const MOCK_SUMMARY: CheckoutSummary = {
    orderId: "ORD-2024-123456",
    items: [
        { id: "1", name: "Office Supplies - Printer Paper (5 reams)", quantity: 2, price: 25000 },
        { id: "2", name: "Printer Ink Cartridge - Black", quantity: 1, price: 45000 },
        { id: "3", name: "USB Flash Drive 64GB", quantity: 3, price: 35000 },
        { id: "4", name: "Notebook A4 (pack of 12)", quantity: 5, price: 15000 },
    ],
    subtotal: 275000,
    tax: 27500,
    shipping: 15000,
    discount: 0,
    total: 317500,
    paymentMethod: "Corporate Account - Stanbic",
    deliveryAddress: "Plot 45, Kampala Road, Kampala",
    deliveryDate: "2024-01-20",
    policyStatus: "compliant",
    tags: ["Operations", "Office Supplies"],
};

export default function FinalReview() {
    const [summary, setSummary] = useState<CheckoutSummary>(MOCK_SUMMARY);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const handleProcessPayment = async () => {
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessing(false);
        setIsComplete(true);
    };

    if (isComplete) {
        return (
            <div className="space-y-6 p-6">
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Order Confirmed!</h2>
                    <p className="text-gray-500 mt-2">
                        Your order #{summary.orderId} has been successfully placed
                    </p>
                </div>

                <SectionCard title="Order Confirmation" subtitle={`Confirmation #${summary.orderId}`}>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Payment Successful</p>
                                <p className="text-sm text-gray-500">
                                    {formatCurrency(summary.total)} charged to corporate account
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Estimated Delivery</p>
                                <p className="text-sm text-gray-500">{summary.deliveryDate}</p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                </div>

                <Button variant="primary" size="lg" className="w-full" onClick={() => window.location.reload()}>
                    Place Another Order
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Final Review</h1>
                    <p className="text-gray-500 mt-1">Review your order before confirming</p>
                </div>
                <Pill
                    label={summary.policyStatus === "compliant" ? "Policy Compliant" : summary.policyStatus === "pending" ? "Pending" : "Under Review"}
                    tone={summary.policyStatus === "compliant" ? "good" : summary.policyStatus === "pending" ? "warn" : "bad"}
                />
            </div>

            {/* Order Items */}
            <SectionCard title="Order Items" subtitle={`${summary.items.length} items`}>
                <div className="space-y-3 mt-4">
                    {summary.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Order Summary */}
            <SectionCard title="Order Summary" subtitle="Charges breakdown">
                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(summary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tax (10%)</span>
                        <span className="text-gray-900">{formatCurrency(summary.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">{formatCurrency(summary.shipping)}</span>
                    </div>
                    {summary.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(summary.discount)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span className="text-blue-600">{formatCurrency(summary.total)}</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Delivery Info */}
            <SectionCard title="Delivery Details" subtitle="Where your order will be sent">
                <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Delivery Address</p>
                            <p className="font-medium text-gray-900">{summary.deliveryAddress}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Estimated Delivery</p>
                            <p className="font-medium text-gray-900">{summary.deliveryDate}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Policy & Tags */}
            <SectionCard title="Corporate Policy" subtitle="Approval and tagging">
                <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                        <Shield
                            className={`w-5 h-5 mt-0.5 ${summary.policyStatus === "compliant"
                                    ? "text-green-600"
                                    : summary.policyStatus === "pending"
                                        ? "text-amber-600"
                                        : "text-red-600"
                                }`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Policy Status</p>
                            <p className="font-medium text-gray-900">
                                {summary.policyStatus === "compliant"
                                    ? "Compliant - No issues found"
                                    : summary.policyStatus === "pending"
                                        ? "Pending - Awaiting approval"
                                        : "Under Review - Contact manager"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Tags</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {summary.tags.map((tag) => (
                                    <Pill key={tag} label={tag} tone="neutral" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Payment Method */}
            <SectionCard title="Payment Method" subtitle="How you'll pay">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div>
                            <p className="font-medium text-gray-900">{summary.paymentMethod}</p>
                            <p className="text-sm text-gray-500">Corporate Account</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
            </SectionCard>

            {/* Warnings */}
            {summary.policyStatus !== "compliant" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-800">Action Required</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                {summary.policyStatus === "pending"
                                    ? "This order is pending manager approval. You may still proceed, but the order will be held until approved."
                                    : "This order requires manager review before processing. Please contact your manager."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit */}
            <Button
                variant="primary"
                size="lg"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Clock className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        Process Payment {formatCurrency(summary.total)} <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </Button>

            <p className="text-xs text-center text-gray-400">
                By confirming, you agree to the terms and conditions
            </p>
        </div>
    );
}
