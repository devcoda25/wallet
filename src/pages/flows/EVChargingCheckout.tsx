// ============================================================================
// EV Charging Checkout Page
// Corporate EV charging session with policy enforcement
// ============================================================================

import React, { useState } from "react";
import {
    Battery,
    BatteryCharging,
    Zap,
    MapPin,
    Clock,
    CreditCard,
    Shield,
    User,
    Building2,
    Plug,
    Bolt,
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
    Timer,
    Thermometer,
    Home,
    Briefcase as Work,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

// Mock data
const CHARGING_STATIONS = [
    {
        id: "cs1",
        name: "City Mall Station",
        address: "Plot 45, Kampala Road",
        distance: 0.8,
        available: 4,
        total: 6,
        plugs: [
            { type: "CCS", power: "150kW", available: 2, pricePerKwh: 850 },
            { type: "AC Type 2", power: "22kW", available: 2, pricePerKwh: 650 },
        ],
        rating: 4.8,
        amenities: ["WiFi", "Cafe", "Restroom"],
    },
    {
        id: "cs2",
        name: "Office Park Charger",
        address: "Tech Park, Bugolobi",
        distance: 2.3,
        available: 2,
        total: 4,
        plugs: [
            { type: "CCS", power: "150kW", available: 1, pricePerKwh: 800 },
            { type: "AC Type 2", power: "22kW", available: 1, pricePerKwh: 600 },
        ],
        rating: 4.9,
        amenities: ["WiFi", "Parking"],
    },
    {
        id: "cs3",
        name: "Hotel Grand Station",
        address: "Grand Hotel Premises",
        distance: 3.1,
        available: 0,
        total: 3,
        plugs: [
            { type: "CCS", power: "150kW", available: 0, pricePerKwh: 900 },
            { type: "AC Type 2", power: "22kW", available: 0, pricePerKwh: 700 },
        ],
        rating: 4.6,
        amenities: ["WiFi", "Restaurant", "Lounge"],
    },
];

const CHARGING_SPEEDS = [
    { id: "fast", name: "Fast Charge", description: "10-80% in 25-40 min", power: "150kW DC", multiplier: 1.5 },
    { id: "standard", name: "Standard", description: "0-100% in 4-6 hours", power: "22kW AC", multiplier: 1.0 },
    { id: "slow", name: "Slow/AC", description: "Overnight charging", power: "7kW AC", multiplier: 0.7 },
];

const CORPORATE_POLICY = {
    requiresApproval: true,
    maxAmount: 100000,
    requiresTags: true,
    allowedCategories: ["business", "travel", "commute", "operations"],
    requiresPurpose: true,
    maxKwhPerMonth: 500,
};

export default function EVChargingCheckout() {
    const [currentStep, setCurrentStep] = useState<"location" | "station" | "details" | "policy" | "payment" | "confirm">(
        "location"
    );
    const [selectedStation, setSelectedStation] = useState<string | null>(null);
    const [selectedPlug, setSelectedPlug] = useState<{ type: string; power: string; price: number } | null>(null);
    const [selectedSpeed, setSelectedSpeed] = useState<string>("standard");
    const [currentBattery, setCurrentBattery] = useState(35);
    const [targetBattery, setTargetBattery] = useState(80);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [purpose, setPurpose] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("corporate");
    const [isPolicyCompliant, setIsPolicyCompliant] = useState<boolean | null>(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    // Calculations
    const station = CHARGING_STATIONS.find((s) => s.id === selectedStation);
    const kwhNeeded = ((targetBattery - currentBattery) / 100) * 60; // Assume 60kWh battery
    const chargingTime =
        selectedSpeed === "fast"
            ? Math.round(((targetBattery - currentBattery) / 80) * 30)
            : selectedSpeed === "standard"
                ? Math.round(((targetBattery - currentBattery) / 80) * 300)
                : Math.round(((targetBattery - currentBattery) / 80) * 600);

    const estimatedCost = kwhNeeded * (selectedPlug?.price || 0);

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handlePolicyCheck = () => {
        const isCompliant = Boolean(
            estimatedCost <= CORPORATE_POLICY.maxAmount && selectedCategory && selectedTags.length > 0
        );
        setIsPolicyCompliant(isCompliant);
    };

    const renderLocationSelection = () => (
        <div className="space-y-6">
            {/* Current Location */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Location</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Detecting location...</p>
                    </div>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Quick Location Buttons */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                        setSelectedStation("cs1");
                        setCurrentStep("station");
                    }}
                >
                    <Home className="w-4 h-4" />
                    Near Me
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                        setSelectedStation("cs2");
                        setCurrentStep("station");
                    }}
                >
                    <Work className="w-4 h-4" />
                    Work
                </Button>
            </div>

            {/* Map Placeholder */}
            <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Map View</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Showing charging stations nearby</p>
                </div>
            </div>

            {/* Nearby Stations */}
            <SectionCard title="Nearby Stations" subtitle={`${CHARGING_STATIONS.length} stations found`}>
                <div className="space-y-3 mt-4">
                    {CHARGING_STATIONS.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => {
                                if (s.available > 0) {
                                    setSelectedStation(s.id);
                                    setCurrentStep("station");
                                }
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${s.available > 0
                                    ? "border-gray-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-500"
                                    : "border-gray-100 dark:border-slate-700 opacity-50"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</h3>
                                        {s.available > 0 ? (
                                            <Pill label={`${s.available}/${s.total} available`} tone="good" />
                                        ) : (
                                            <Pill label="Full" tone="bad" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.address}</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{s.distance} km away</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                            ⭐ {s.rating}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {s.amenities.slice(0, 3).map((amenity) => (
                                                <Pill key={amenity} label={amenity} tone="neutral" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {s.available > 0 && <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );

    const renderStationSelection = () => {
        if (!station) return null;

        return (
            <div className="space-y-6">
                {/* Station Header */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <BatteryCharging className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{station.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{station.address}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {station.rating}
                                </span>
                                <Pill label={`${station.distance} km`} tone="neutral" />
                                <Pill label={`${station.available}/${station.total} available`} tone="good" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plug Types */}
                <SectionCard title="Available Chargers" subtitle="Select a plug type">
                    <div className="space-y-3 mt-4">
                        {station.plugs.map((plug) => (
                            <div
                                key={plug.type}
                                onClick={() =>
                                    plug.available > 0 &&
                                    setSelectedPlug({ type: plug.type, power: plug.power, price: plug.pricePerKwh })
                                }
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlug?.type === plug.type
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                        : plug.available > 0
                                            ? "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600"
                                            : "border-gray-100 dark:border-slate-700 opacity-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                            <Plug className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{plug.type}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{plug.power}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(plug.pricePerKwh)}/kWh
                                        </p>
                                        <Pill
                                            label={`${plug.available} available`}
                                            tone={plug.available > 0 ? "good" : "bad"}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Charging Speed */}
                <SectionCard title="Charging Speed" subtitle="Choose charging speed">
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {CHARGING_SPEEDS.map((speed) => (
                            <div
                                key={speed.id}
                                onClick={() => setSelectedSpeed(speed.id)}
                                className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${selectedSpeed === speed.id
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                        : "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600"
                                    }`}
                            >
                                <Bolt className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{speed.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{speed.power}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{speed.description}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Battery Range */}
                <SectionCard title="Charging Range" subtitle="Set your battery level">
                    <div className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{currentBattery}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentBattery}
                            onChange={(e) => setCurrentBattery(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{targetBattery}%</span>
                        </div>
                        <input
                            type="range"
                            min={currentBattery + 10}
                            max="100"
                            value={targetBattery}
                            onChange={(e) => setTargetBattery(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Energy needed</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{kwhNeeded.toFixed(1)} kWh</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600 dark:text-gray-400">Estimated time</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatTime(chargingTime)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600 dark:text-gray-400">Estimated cost</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(estimatedCost)}</span>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setCurrentStep("location")} className="flex-1">
                        Back
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setCurrentStep("details")}
                        disabled={!selectedPlug}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        Continue <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderDetails = () => (
        <div className="space-y-6">
            {/* Charging Summary */}
            <SectionCard title="Charging Session" subtitle="Review your charging details">
                <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Station</p>
                            <p className="font-medium text-gray-900">{station?.name}</p>
                            <p className="text-sm text-gray-500">{station?.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Plug className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Charger</p>
                            <p className="font-medium text-gray-900">
                                {selectedPlug?.type} - {selectedPlug?.power}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Battery className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Range</p>
                            <p className="font-medium text-gray-900">
                                {currentBattery}% → {targetBattery}% ({kwhNeeded.toFixed(1)} kWh)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Timer className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium text-gray-900">{formatTime(chargingTime)}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Corporate Requirements */}
            <SectionCard title="Corporate Requirements" subtitle="Required for business charging">
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
                            {["Sales-001", "Operations", "Fleet", "Travel", "Commute"].map((tag) => (
                                <Pill
                                    key={tag}
                                    label={tag}
                                    tone={selectedTags.includes(tag) ? "info" : "neutral"}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (selectedTags.includes(tag)) {
                                            setSelectedTags(selectedTags.filter((t) => t !== tag));
                                        } else {
                                            setSelectedTags([...selectedTags, tag]);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Estimated Cost */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">Estimated Cost</span>
                    <span className="text-xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(estimatedCost)}</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {kwhNeeded.toFixed(1)} kWh @ {selectedPlug?.price} UGX/kWh
                </p>
            </div>

            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep("station")} className="flex-1">
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
            <SectionCard title="Policy Verification" subtitle="Checking compliance for EV charging">
                <div className="space-y-4 mt-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">Amount within limit</span>
                            </div>
                            {estimatedCost <= CORPORATE_POLICY.maxAmount ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">Tags assigned</span>
                            </div>
                            {selectedTags.length > 0 ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">Purpose stated</span>
                            </div>
                            {purpose ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                    </div>

                    <div
                        className={`p-4 rounded-lg border-2 ${isPolicyCompliant ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800" : "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {isPolicyCompliant ? (
                                <>
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    <div>
                                        <h4 className="font-semibold text-green-800 dark:text-green-200">Policy Compliant</h4>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            This charging session meets all corporate policy requirements
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">Policy Review Required</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            Some requirements need manager approval
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {!isPolicyCompliant && (
                <SectionCard title="Approval Required" subtitle="Next steps for out-of-policy">
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Request Exception</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                            This session exceeds the standard policy threshold and requires approval.
                        </p>
                        <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowPolicyModal(true)}>
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
            <SectionCard title="Payment Method" subtitle="Select how to pay">
                <div className="space-y-3 mt-4">
                    <div
                        onClick={() => setPaymentMethod("corporate")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "corporate"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Corporate Account</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Charge to corporate account</p>
                            </div>
                            {paymentMethod === "corporate" && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        </div>
                    </div>

                    <div
                        onClick={() => setPaymentMethod("personal")}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "personal"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Personal Payment</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pay with personal funds (reimbursement)</p>
                            </div>
                            {paymentMethod === "personal" && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Cost Breakdown */}
            <SectionCard title="Cost Breakdown" subtitle="Estimated charges">
                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Energy ({kwhNeeded.toFixed(1)} kWh)</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatCurrency(kwhNeeded * (selectedPlug?.price || 0))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatCurrency(2000)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 dark:border-slate-700">
                        <div className="flex justify-between font-semibold">
                            <span className="text-gray-900 dark:text-gray-100">Estimated Total</span>
                            <span className="text-blue-600 dark:text-blue-400">{formatCurrency(estimatedCost)}</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

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
                    Start Charging <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-6">
            {/* Success */}
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BatteryCharging className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Charging Started!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Your charging session has begun</p>
            </div>

            {/* Session Details */}
            <SectionCard title="Session Details" subtitle="Session #EV-2024-001234">
                <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Station</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{station?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Plug className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Charger</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {selectedPlug?.type} - {selectedPlug?.power}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Timer className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Est. Time Remaining</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatTime(chargingTime)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Cost</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(estimatedCost)}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Policy Confirmation */}
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Policy Compliant</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Charged to corporate account</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contact Station
                </Button>
                <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message Support
                </Button>
                <Button variant="ghost" size="lg" className="w-full" onClick={() => window.location.reload()}>
                    New Session
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">EV Charging</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Find and use corporate EV charging stations</p>
                </div>
                <Pill
                    label={
                        currentStep === "location"
                            ? "Step 1: Location"
                            : currentStep === "station"
                                ? "Step 2: Station"
                                : currentStep === "details"
                                    ? "Step 3: Details"
                                    : currentStep === "policy"
                                        ? "Step 4: Policy"
                                        : currentStep === "payment"
                                            ? "Step 5: Payment"
                                            : "Complete"
                    }
                    tone="info"
                />
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                        width:
                            currentStep === "location"
                                ? "17%"
                                : currentStep === "station"
                                    ? "33%"
                                    : currentStep === "details"
                                        ? "50%"
                                        : currentStep === "policy"
                                            ? "67%"
                                            : currentStep === "payment"
                                                ? "83%"
                                                : "100%",
                    }}
                />
            </div>

            {/* Step Content */}
            {currentStep === "location" && renderLocationSelection()}
            {currentStep === "station" && renderStationSelection()}
            {currentStep === "details" && renderDetails()}
            {currentStep === "policy" && renderPolicyCheck()}
            {currentStep === "payment" && renderPayment()}
            {currentStep === "confirm" && renderConfirmation()}
        </div>
    );
}
