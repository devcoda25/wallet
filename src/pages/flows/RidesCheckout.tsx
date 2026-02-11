// ============================================================================
// Rides Checkout Page
// Corporate rides/logistics checkout with policy enforcement
// ============================================================================

import React, { useState } from "react";
import {
    MapPin,
    Clock,
    CreditCard,
    Shield,
    User,
    Building2,
    Car,
    Navigation,
    Star,
    ChevronRight,
    CheckCircle,
    AlertTriangle,
    FileText,
    Tag,
    Receipt,
    ArrowRight,
    Phone,
    MessageSquare,
    Wallet,
    Briefcase,
    Calendar,
    DollarSign,
    RefreshCw,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

// Mock data
const RIDE_OPTIONS = [
    {
        id: "economy",
        name: "Economy",
        description: "Affordable rides for everyday travel",
        icon: "🚗",
        baseFare: 5000,
        perKm: 2500,
        estimatedTime: "5-10 min",
        available: true,
    },
    {
        id: "premium",
        name: "Premium",
        description: "Comfortable rides with professional drivers",
        icon: "🚙",
        baseFare: 12000,
        perKm: 4500,
        estimatedTime: "3-8 min",
        available: true,
    },
    {
        id: "executive",
        name: "Executive",
        description: "Luxury vehicles for VIP travel",
        icon: "🚐",
        baseFare: 25000,
        perKm: 8000,
        estimatedTime: "5-12 min",
        available: true,
    },
];

const RECENT_DRIVERS = [
    { id: "d1", name: "John K.", rating: 4.9, trips: 2341, avatar: "👤", preferred: true },
    { id: "d2", name: "Sarah M.", rating: 4.8, trips: 1892, avatar: "👩", preferred: false },
    { id: "d3", name: "Mike T.", rating: 4.9, trips: 3102, avatar: "👨", preferred: true },
];

const CORPORATE_POLICY = {
    requiresApproval: true,
    maxAmount: 50000,
    requiresTags: true,
    allowedCategories: ["business", "client", "travel", "errand"],
    requiresPurpose: true,
};

export default function RidesCheckout() {
    const [currentStep, setCurrentStep] = useState<"ride" | "details" | "policy" | "payment" | "confirm">("ride");
    const [selectedRide, setSelectedRide] = useState<string | null>(null);
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [purpose, setPurpose] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("corporate");
    const [isPolicyCompliant, setIsPolicyCompliant] = useState<boolean | null>(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    // Mock calculation
    const distance = 8.5; // km
    const estimatedFare = selectedRide
        ? RIDE_OPTIONS.find((r) => r.id === selectedRide)?.baseFare! +
        distance * RIDE_OPTIONS.find((r) => r.id === selectedRide)?.perKm!
        : 0;

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const handlePolicyCheck = () => {
        // Mock policy check logic
        const isCompliant = !!(estimatedFare <= CORPORATE_POLICY.maxAmount && selectedCategory && selectedTags.length > 0);
        setIsPolicyCompliant(isCompliant);
    };

    const renderRideSelection = () => (
        <div className="space-y-6">
            {/* Location Input */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <Input
                        placeholder="Pickup location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="flex-1 border-none focus:ring-0"
                    />
                </div>
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <Input
                        placeholder="Where to?"
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        className="flex-1 border-none focus:ring-0"
                    />
                </div>
            </div>

            {/* Ride Options */}
            <SectionCard title="Select Ride Type" subtitle="Choose your preferred ride category">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {RIDE_OPTIONS.map((ride) => (
                        <div
                            key={ride.id}
                            onClick={() => setSelectedRide(ride.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRide === ride.id
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                                }`}
                        >
                            <div className="text-3xl mb-2">{ride.icon}</div>
                            <h3 className="font-semibold text-gray-900 dark:text-slate-100">{ride.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{ride.description}</p>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-sm text-gray-600 dark:text-slate-400">
                                    {formatCurrency(ride.baseFare)} base
                                </span>
                                <Pill label={ride.estimatedTime} tone="neutral" />
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Recent Drivers */}
            <SectionCard title="Preferred Drivers" subtitle="Select a preferred driver">
                <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
                    {RECENT_DRIVERS.map((driver) => (
                        <div
                            key={driver.id}
                            onClick={() => setSelectedDriver(driver.id)}
                            className={`flex-shrink-0 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedDriver === driver.id
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{driver.avatar}</div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-gray-900 dark:text-slate-100">{driver.name}</span>
                                        {driver.preferred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                                        <span>⭐ {driver.rating}</span>
                                        <span>{driver.trips} trips</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep("details")}
                disabled={!selectedRide || !pickup || !dropoff}
                className="w-full flex items-center justify-center gap-2"
            >
                Continue to Details <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );

    const renderDetails = () => (
        <div className="space-y-6">
            {/* Trip Summary */}
            <SectionCard title="Trip Details" subtitle="Review your ride information">
                <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Pickup</p>
                            <p className="font-medium text-gray-900">{pickup}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Dropoff</p>
                            <p className="font-medium text-gray-900">{dropoff}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Car className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Ride Type</p>
                            <p className="font-medium text-gray-900">
                                {RIDE_OPTIONS.find((r) => r.id === selectedRide)?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Estimated Distance</p>
                            <p className="font-medium text-gray-900">{distance} km</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Corporate Requirements */}
            <SectionCard title="Corporate Requirements" subtitle="Required for business rides">
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expense Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
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
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                            rows={3}
                            placeholder="Explain the business purpose of this ride..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (Cost Center / Project) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Sales-001", "Marketing", "Operations", "Client-Meeting", "Travel", "Errand"].map((tag) => (
                                <div
                                    key={tag}
                                    className={`px-3 py-1 rounded-full text-sm cursor-pointer ${selectedTags.includes(tag)
                                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
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

            {/* Estimated Cost */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Estimated Fare</span>
                    <span className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(estimatedFare)}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Final fare may vary based on actual route</p>
            </div>

            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep("ride")} className="flex-1">
                    Back
                </Button>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep("policy")}
                    disabled={!selectedCategory || !purpose || selectedTags.length === 0}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    Check Policy <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const renderPolicyCheck = () => (
        <div className="space-y-6">
            {/* Policy Verification */}
            <SectionCard title="Policy Verification" subtitle="Checking compliance for business rides">
                <div className="space-y-4 mt-4">
                    {/* Check Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-700 dark:text-slate-300">Amount within limit</span>
                            </div>
                            {estimatedFare <= CORPORATE_POLICY.maxAmount ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Tag className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-700 dark:text-slate-300">Tags assigned</span>
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

                    {/* Compliance Result */}
                    <div
                        className={`p-4 rounded-lg border-2 ${isPolicyCompliant
                            ? "bg-green-50 border-green-200"
                            : "bg-amber-50 border-amber-200"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {isPolicyCompliant ? (
                                <>
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <div>
                                        <h4 className="font-semibold text-green-800">Policy Compliant</h4>
                                        <p className="text-sm text-green-700">
                                            This ride meets all corporate policy requirements
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-8 h-5 h-8 text-amber-600" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800">Policy Review Required</h4>
                                        <p className="text-sm text-amber-700">
                                            Some requirements need manager approval
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Approval Info if needed */}
            {!isPolicyCompliant && (
                <SectionCard title="Approval Required" subtitle="Next steps for out-of-policy rides">
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                        <h4 className="font-medium text-amber-800 mb-2">Request Exception</h4>
                        <p className="text-sm text-amber-700 mb-3">
                            This ride exceeds the standard policy threshold and requires manager approval.
                        </p>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => setShowPolicyModal(true)}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Request Approval
                        </Button>
                    </div>
                </SectionCard>
            )}

            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep("details")} className="flex-1">
                    Back
                </Button>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep("payment")}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    Continue to Payment <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const renderPayment = () => (
        <div className="space-y-6">
            {/* Payment Method */}
            <SectionCard title="Payment Method" subtitle="Select how to pay for this ride">
                <div className="space-y-3 mt-4">
                    <div
                        onClick={() => setPaymentMethod("corporate")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "corporate"
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
                            {paymentMethod === "corporate" && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                    </div>

                    <div
                        onClick={() => setPaymentMethod("personal")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "personal"
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
                            {paymentMethod === "personal" && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Fare Breakdown */}
            <SectionCard title="Fare Breakdown" subtitle="Estimated charges">
                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Base Fare</span>
                        <span className="text-gray-900">
                            {formatCurrency(RIDE_OPTIONS.find((r) => r.id === selectedRide)?.baseFare || 0)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Distance ({distance} km)</span>
                        <span className="text-gray-900">
                            {formatCurrency(
                                distance * (RIDE_OPTIONS.find((r) => r.id === selectedRide)?.perKm || 0)
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="text-gray-900">{formatCurrency(2000)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Estimated Total</span>
                            <span className="text-blue-600">{formatCurrency(estimatedFare)}</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Policy Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Policy Summary</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Category: {selectedCategory}</li>
                    <li>• Tags: {selectedTags.join(", ")}</li>
                    <li>• Payment: {paymentMethod === "corporate" ? "Corporate Account" : "Personal (Reimbursement)"}</li>
                </ul>
            </div>

            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep("policy")} className="flex-1">
                    Back
                </Button>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep("confirm")}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    Confirm Booking <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ride Booked!</h2>
                <p className="text-gray-500 mt-2">Your corporate ride has been confirmed</p>
            </div>

            {/* Booking Details */}
            <SectionCard title="Booking Details" subtitle="Confirmation #RIDE-2024-001234">
                <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                        <Car className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Vehicle</p>
                            <p className="font-medium text-gray-900">
                                {RIDE_OPTIONS.find((r) => r.id === selectedRide)?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Pickup</p>
                            <p className="font-medium text-gray-900">{pickup}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Dropoff</p>
                            <p className="font-medium text-gray-900">{dropoff}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(estimatedFare)}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Policy Confirmation */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800">Policy Compliant</p>
                        <p className="text-sm text-green-700">
                            This ride has been approved and charged to your corporate account
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contact Driver
                </Button>
                <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message Support
                </Button>
                <Button variant="ghost" size="lg" className="w-full" onClick={() => window.location.reload()}>
                    Book Another Ride
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rides Checkout</h1>
                    <p className="text-gray-500 mt-1">Book a corporate ride with policy compliance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Pill
                        label={
                            currentStep === "ride"
                                ? "Step 1: Ride"
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
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                        width:
                            currentStep === "ride"
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
            {currentStep === "ride" && renderRideSelection()}
            {currentStep === "details" && renderDetails()}
            {currentStep === "policy" && renderPolicyCheck()}
            {currentStep === "payment" && renderPayment()}
            {currentStep === "confirm" && renderConfirmation()}
        </div>
    );
}
