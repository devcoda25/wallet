// ============================================================================
// Delivery Checkout Page
// Corporate delivery/shipping with policy enforcement
// ============================================================================

import React, { useState } from "react";
import {
  Package,
  MapPin,
  Clock,
  CreditCard,
  Shield,
  User,
  Building2,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  Tag,
  ArrowRight,
  Phone,
  MessageSquare,
  Wallet,
  Briefcase,
  DollarSign,
  Box,
  Truck,
  Map,
  Navigation,
  Calendar,
  Search,
  Filter,
  Star,
  Send,
  RefreshCw,
  Home,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

// Mock data
const DELIVERY_OPTIONS = [
  {
    id: "same-day",
    name: "Same Day",
    description: "Delivery within today",
    icon: "⚡",
    basePrice: 25000,
    estimatedHours: 4,
    available: true,
  },
  {
    id: "express",
    name: "Express",
    description: "Next day delivery",
    icon: "🚗",
    basePrice: 15000,
    estimatedHours: 24,
    available: true,
  },
  {
    id: "standard",
    name: "Standard",
    description: "3-5 business days",
    icon: "🚐",
    basePrice: 8000,
    estimatedHours: 72,
    available: true,
  },
  {
    id: "economy",
    name: "Economy",
    description: "5-7 business days",
    icon: "📦",
    basePrice: 5000,
    estimatedHours: 120,
    available: true,
  },
];

const PACKAGE_SIZES = [
  { id: "small", name: "Small", dimensions: "Up to 2kg", multiplier: 1.0 },
  { id: "medium", name: "Medium", dimensions: "2-5kg", multiplier: 1.5 },
  { id: "large", name: "Large", dimensions: "5-10kg", multiplier: 2.0 },
  { id: "xl", name: "Extra Large", dimensions: "10-20kg", multiplier: 3.0 },
];

const CARRIERS = [
  { id: "c1", name: "Swift Delivery", rating: 4.8, priceRange: "$$", tracking: true },
  { id: "c2", name: "QuickShip", rating: 4.6, priceRange: "$", tracking: true },
  { id: "c3", name: "Premium Express", rating: 4.9, priceRange: "$$$", tracking: true },
];

const CORPORATE_POLICY = {
  requiresApproval: true,
  maxAmount: 300000,
  requiresTags: true,
  allowedCategories: ["supplies", "documents", "equipment", "samples", "returns"],
  requiresPurpose: true,
};

export default function DeliveryCheckout() {
  const [currentStep, setCurrentStep] = useState<
    "package" | "pickup" | "delivery" | "options" | "details" | "policy" | "payment" | "confirm"
  >("package");
  const [packageSize, setPackageSize] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [purpose, setPurpose] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("corporate");
  const [isPolicyCompliant, setIsPolicyCompliant] = useState<boolean | null>(null);

  // Calculations
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery);
  const size = PACKAGE_SIZES.find((s) => s.id === packageSize);
  const carrier = CARRIERS.find((c) => c.id === selectedCarrier);
  const estimatedPrice = (delivery?.basePrice || 0) * (size?.multiplier || 1);

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  const timeSlots = ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00"];

  const handlePolicyCheck = () => {
    const isCompliant = estimatedPrice <= CORPORATE_POLICY.maxAmount && selectedCategory && selectedTags.length > 0;
    setIsPolicyCompliant(!!isCompliant);
  };

  const renderPackageSelection = () => (
    <div className="space-y-6">
      <SectionCard title="Package Details" subtitle="Select your package size">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {PACKAGE_SIZES.map((size) => (
            <div
              key={size.id}
              onClick={() => setPackageSize(size.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all hover:scale-105 ${packageSize === size.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <Box className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">{size.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{size.dimensions}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Package Description */}
      <SectionCard title="Package Contents" subtitle="Describe what you're shipping">
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contents Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the items in your package..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="fragile" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="fragile" className="text-sm text-gray-700">
              Contains fragile items
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="insurance" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="insurance" className="text-sm text-gray-700">
              Add shipping insurance
            </label>
          </div>
        </div>
      </SectionCard>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setCurrentStep("pickup")}
        disabled={!packageSize}
        className="w-full flex items-center justify-center gap-2"
      >
        Continue to Pickup <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderPickup = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("package")}>
          ← Back
        </Button>
      </div>

      <SectionCard title="Pickup Location" subtitle="Where should we collect the package?">
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
            <Input
              placeholder="Enter pickup address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pickup-same" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="pickup-same" className="text-sm text-gray-700">
              Use saved address
            </label>
          </div>
        </div>
      </SectionCard>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setCurrentStep("delivery")}
        disabled={!pickupAddress || !pickupDate || !pickupTime}
        className="w-full flex items-center justify-center gap-2"
      >
        Continue to Delivery <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderDelivery = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("pickup")}>
          ← Back
        </Button>
      </div>

      <SectionCard title="Delivery Details" subtitle="Where should we deliver the package?">
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <Input
              placeholder="Enter recipient name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input
              placeholder="Enter phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <Input
              placeholder="Enter delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="signature" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="signature" className="text-sm text-gray-700">
              Require signature on delivery
            </label>
          </div>
        </div>
      </SectionCard>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setCurrentStep("options")}
        disabled={!recipientName || !recipientPhone || !deliveryAddress}
        className="w-full flex items-center justify-center gap-2"
      >
        Continue to Delivery Options <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderDeliveryOptions = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("delivery")}>
          ← Back
        </Button>
      </div>

      <SectionCard title="Delivery Speed" subtitle="Choose how fast you need this delivered">
        <div className="space-y-3 mt-4">
          {DELIVERY_OPTIONS.map((option) => (
            <div
              key={option.id}
              onClick={() => setSelectedDelivery(option.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedDelivery === option.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{option.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(option.basePrice * (size?.multiplier || 1))}</p>
                  <Pill label={`~${option.estimatedHours}h`} tone={option.available ? "good" : "bad"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Carrier Selection" subtitle="Choose your delivery carrier">
        <div className="space-y-3 mt-4">
          {CARRIERS.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCarrier(c.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedCarrier === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{c.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>⭐ {c.rating}</span>
                      <span>•</span>
                      <span>{c.priceRange}</span>
                      <span>•</span>
                      <span>{c.tracking ? "Tracking" : "No tracking"}</span>
                    </div>
                  </div>
                </div>
                {selectedCarrier === c.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Estimated Cost */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Estimated Shipping</span>
          <span className="text-xl font-bold text-blue-900">{formatCurrency(estimatedPrice)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setCurrentStep("details")}
        disabled={!selectedDelivery || !selectedCarrier}
        className="w-full flex items-center justify-center gap-2"
      >
        Continue to Details <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("options")}>
          ← Back
        </Button>
      </div>

      {/* Shipping Summary */}
      <SectionCard title="Shipping Summary" subtitle="Review your delivery details">
        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <Box className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Package</p>
              <p className="font-medium text-gray-900">
                {size?.name} ({size?.dimensions})
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p className="font-medium text-gray-900">{pickupAddress}</p>
              <p className="text-sm text-gray-500">
                {pickupDate} {pickupTime}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Delivery</p>
              <p className="font-medium text-gray-900">{recipientName}</p>
              <p className="font-medium text-gray-900">{deliveryAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Delivery</p>
              <p className="font-medium text-gray-900">
                {delivery?.name} via {carrier?.name}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Corporate Requirements */}
      <SectionCard title="Corporate Requirements" subtitle="Required for business deliveries">
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
              {["Operations", "Sales", "Marketing", "Logistics", "Samples", "Supplies"].map((tag) => (
                <div
                  key={tag}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer ${selectedTags.includes(tag)
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

  const renderPolicyCheck = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("details")}>
          ← Back
        </Button>
      </div>

      <SectionCard title="Policy Verification" subtitle="Checking compliance">
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Amount within limit</span>
            </div>
            {estimatedPrice <= CORPORATE_POLICY.maxAmount ? (
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
          className={`p-4 rounded-lg border-2 mt-4 ${isPolicyCompliant ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            }`}
        >
          <div className="flex items-center gap-3">
            {isPolicyCompliant ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Policy Compliant</h4>
                  <p className="text-sm text-green-700">This delivery meets all corporate policy requirements</p>
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
              {paymentMethod === "corporate" && <CheckCircle className="w-5 h-5 text-blue-600" />}
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
              {paymentMethod === "personal" && <CheckCircle className="w-5 h-5 text-blue-600" />}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Cost Breakdown */}
      <SectionCard title="Cost Breakdown" subtitle="Shipping charges">
        <div className="space-y-2 mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery ({delivery?.name})</span>
            <span className="text-gray-900">{formatCurrency(delivery?.basePrice || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Size ({size?.name})</span>
            <span className="text-gray-900">{formatCurrency(estimatedPrice - (delivery?.basePrice || 0))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carrier Fee</span>
            <span className="text-gray-900">{formatCurrency(2000)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(estimatedPrice + 2000)}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <Button variant="primary" size="lg" onClick={() => setCurrentStep("confirm")} className="w-full flex items-center justify-center gap-2">
        Ship Package <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Shipment Created!</h2>
        <p className="text-gray-500 mt-2">Your delivery has been scheduled</p>
      </div>

      <SectionCard title="Shipment Details" subtitle="Tracking #DEL-2024-001234">
        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <Box className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Package</p>
              <p className="font-medium text-gray-900">
                {size?.name} ({size?.dimensions})
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium text-gray-900">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium text-gray-900">{recipientName}</p>
              <p className="text-sm text-gray-500">{deliveryAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Delivery</p>
              <p className="font-medium text-gray-900">
                {delivery?.name} via {carrier?.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(estimatedPrice + 2000)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Policy Compliant</p>
            <p className="text-sm text-green-700">Charged to corporate account</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Track Shipment
        </Button>
        <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Contact Support
        </Button>
        <Button variant="ghost" size="lg" className="w-full" onClick={() => window.location.reload()}>
          Create Another Shipment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Checkout</h1>
          <p className="text-gray-500 mt-1">Ship packages with corporate policy compliance</p>
        </div>
        <Pill
          label={
            currentStep === "package"
              ? "Step 1: Package"
              : currentStep === "pickup"
                ? "Step 2: Pickup"
                : currentStep === "delivery"
                  ? "Step 3: Delivery"
                  : currentStep === "options"
                    ? "Step 4: Options"
                    : currentStep === "details"
                      ? "Step 5: Details"
                      : currentStep === "policy"
                        ? "Step 6: Policy"
                        : currentStep === "payment"
                          ? "Step 7: Payment"
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
              currentStep === "package"
                ? "14%"
                : currentStep === "pickup"
                  ? "25%"
                  : currentStep === "delivery"
                    ? "37%"
                    : currentStep === "options"
                      ? "50%"
                      : currentStep === "details"
                        ? "62%"
                        : currentStep === "policy"
                          ? "75%"
                          : currentStep === "payment"
                            ? "87%"
                            : "100%",
          }}
        />
      </div>

      {/* Step Content */}
      {currentStep === "package" && renderPackageSelection()}
      {currentStep === "pickup" && renderPickup()}
      {currentStep === "delivery" && renderDelivery()}
      {currentStep === "options" && renderDeliveryOptions()}
      {currentStep === "details" && renderDetails()}
      {currentStep === "policy" && renderPolicyCheck()}
      {currentStep === "payment" && renderPayment()}
      {currentStep === "confirm" && renderConfirmation()}
    </div>
  );
}
