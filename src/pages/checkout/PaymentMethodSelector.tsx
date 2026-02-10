// ============================================================================
// Payment Method Selector Page
// ============================================================================

import React, { useState } from "react";
import {
    CreditCard,
    Building2,
    Wallet,
    Smartphone,
    Banknote,
    CheckCircle,
    ChevronRight,
    Plus,
    Trash2,
    Edit,
    Star,
    Shield,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";

interface PaymentMethod {
    id: string;
    type: "card" | "bank" | "mobile";
    name: string;
    lastFour?: string;
    expiry?: string;
    isDefault: boolean;
}

export default function PaymentMethodSelector() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        {
            id: "pm1",
            type: "card",
            name: "Visa ending in 4242",
            lastFour: "4242",
            expiry: "12/25",
            isDefault: true,
        },
        {
            id: "pm2",
            type: "bank",
            name: "Corporate Account - Stanbic",
            isDefault: false,
        },
        {
            id: "pm3",
            type: "mobile",
            name: "MTN Mobile Money",
            isDefault: false,
        },
    ]);

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const getTypeIcon = (type: PaymentMethod["type"]) => {
        switch (type) {
            case "card":
                return <CreditCard className="w-5 h-5 text-blue-600" />;
            case "bank":
                return <Building2 className="w-5 h-5 text-gray-600" />;
            case "mobile":
                return <Smartphone className="w-5 h-5 text-amber-600" />;
        }
    };

    const getTypeLabel = (type: PaymentMethod["type"]) => {
        switch (type) {
            case "card":
                return "Credit/Debit Card";
            case "bank":
                return "Bank Account";
            case "mobile":
                return "Mobile Money";
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
                    <p className="text-gray-500 mt-1">Manage your saved payment methods</p>
                </div>
                <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Method
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard title="Total Methods" subtitle="Saved options">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{paymentMethods.length}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Default" subtitle="Primary method">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Star className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 truncate max-w-[200px]">
                            {paymentMethods.find((m) => m.isDefault)?.name}
                        </p>
                    </div>
                </SectionCard>
                <SectionCard title="Corporate" subtitle="Business accounts">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {paymentMethods.filter((m) => m.type === "bank").length}
                        </p>
                    </div>
                </SectionCard>
            </div>

            {/* Payment Methods List */}
            <SectionCard title="Your Payment Methods" subtitle={`${paymentMethods.length} methods saved`}>
                <div className="space-y-3 mt-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMethod === method.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg">{getTypeIcon(method.type)}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{method.name}</h3>
                                            {method.isDefault && <Pill label="Default" tone="good" />}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {getTypeLabel(method.type)}
                                            {method.lastFour && ` •••• ${method.lastFour}`}
                                            {method.expiry && ` • Exp: ${method.expiry}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPaymentMethods(paymentMethods.filter((m) => m.id !== method.id));
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {selectedMethod === method.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Security Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-800">Secure Payment Processing</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            All payment information is encrypted and securely stored. We never store your full card
                            details.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    variant="primary"
                    disabled={!selectedMethod}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    Use Selected Method <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setShowAddModal(true)}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Method
                </Button>
            </div>
        </div>
    );
}
