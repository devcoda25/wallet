// ============================================================================
// Service Booking Checkout Page
// Corporate service bookings with policy enforcement
// ============================================================================

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  CreditCard,
  Shield,
  User,
  Building2,
  Star,
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
  MapPin,
  Wrench,
  Clipboard,
  Users,
  Hammer,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

// Mock data
const SERVICE_CATEGORIES = [
  {
    id: "maintenance",
    name: "Maintenance & Repair",
    icon: "🔧",
    services: [
      { id: "ac-repair", name: "AC Repair", basePrice: 150000, duration: "2-4 hours" },
      { id: "plumbing", name: "Plumbing", basePrice: 100000, duration: "1-3 hours" },
      { id: "electrical", name: "Electrical Work", basePrice: 120000, duration: "2-4 hours" },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning Services",
    icon: "🧹",
    services: [
      { id: "office-cleaning", name: "Office Cleaning", basePrice: 80000, duration: "2-4 hours" },
      { id: "deep-cleaning", name: "Deep Cleaning", basePrice: 200000, duration: "4-8 hours" },
      { id: "post-construction", name: "Post-Construction", basePrice: 350000, duration: "8+ hours" },
    ],
  },
  {
    id: "security",
    name: "Security Services",
    icon: "🛡️",
    services: [
      { id: "guard", name: "Security Guard", basePrice: 50000, duration: "per shift" },
      { id: "event-security", name: "Event Security", basePrice: 150000, duration: "per event" },
      { id: "consultation", name: "Security Assessment", basePrice: 300000, duration: "4-8 hours" },
    ],
  },
  {
    id: "it",
    name: "IT & Technical",
    icon: "💻",
    services: [
      { id: "network-setup", name: "Network Setup", basePrice: 250000, duration: "4-8 hours" },
      { id: "hardware", name: "Hardware Installation", basePrice: 100000, duration: "2-4 hours" },
      { id: "software", name: "Software Configuration", basePrice: 150000, duration: "2-6 hours" },
    ],
  },
];

const PROVIDERS = [
  { id: "p1", name: "TechFix Solutions", rating: 4.9, reviews: 234, priceRange: "$$", verified: true },
  { id: "p2", name: "QuickServe Pros", rating: 4.7, reviews: 189, priceRange: "$", verified: true },
  { id: "p3", name: "Elite Services", rating: 4.8, reviews: 156, priceRange: "$$$", verified: true },
];

const CORPORATE_POLICY = {
  requiresApproval: true,
  maxAmount: 500000,
  requiresTags: true,
  allowedCategories: ["maintenance", "operations", "it", "security", "cleaning"],
  requiresPurpose: true,
  requiresQuote: true,
};

export default function ServiceBooking() {
  const [currentStep, setCurrentStep] = useState<"category" | "service" | "provider" | "details" | "quote" | "policy" | "payment" | "confirm">(
    "category"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [purpose, setPurpose] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("corporate");
  const [isPolicyCompliant, setIsPolicyCompliant] = useState<boolean | null>(null);
  const [quoteApproved, setQuoteApproved] = useState(false);

  // Calculations
  const category = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory);
  const service = category?.services.find((s) => s.id === selectedService);
  const provider = PROVIDERS.find((p) => p.id === selectedProvider);
  const estimatedPrice = service?.basePrice || 0;

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  const timeSlots = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
  ];

  const handlePolicyCheck = () => {
    const isCompliant =
      estimatedPrice <= CORPORATE_POLICY.maxAmount &&
      selectedCategoryTag &&
      selectedTags.length > 0 &&
      quoteApproved;
    setIsPolicyCompliant(!!isCompliant);
  };

  const renderCategorySelection = () => (
    <div className="space-y-6">
      <SectionCard title="Service Category" subtitle="Select a service type">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {SERVICE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentStep("service");
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all hover:scale-105 ${selectedCategory === cat.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <h3 className="font-medium text-gray-900 text-sm">{cat.name}</h3>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderServiceSelection = () => {
    if (!category) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep("category")}>
            ← Back
          </Button>
        </div>

        <SectionCard title={category.name} subtitle="Select a specific service">
          <div className="space-y-3 mt-4">
            {category.services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => {
                  setSelectedService(srv.id);
                  setCurrentStep("provider");
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedService === srv.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{srv.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{srv.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(srv.basePrice)}</p>
                    <Pill label="View Details" tone="neutral" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderProviderSelection = () => {
    if (!service) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep("service")}>
            ← Back
          </Button>
        </div>

        <SectionCard title="Select Provider" subtitle={`${service.name} providers`}>
          <div className="space-y-3 mt-4">
            {PROVIDERS.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id);
                  setCurrentStep("details");
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedProvider === p.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {p.verified && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>⭐ {p.rating}</span>
                        <span>({p.reviews} reviews)</span>
                        <span>•</span>
                        <span>{p.priceRange}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderDetails = () => {
    if (!service || !provider) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep("provider")}>
            ← Back
          </Button>
        </div>

        {/* Service Summary */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-500">{provider.name}</p>
            </div>
            <Pill label={formatCurrency(service.basePrice)} tone="info" />
          </div>
        </div>

        {/* Booking Details */}
        <SectionCard title="Booking Details" subtitle="Schedule your service">
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`p-2 text-xs rounded-lg border-2 transition-all ${selectedTime === slot
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
              <Input
                placeholder="Enter service address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any special instructions for the service provider..."
              />
            </div>
          </div>
        </SectionCard>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setCurrentStep("quote")}
          disabled={!serviceDate || !selectedTime || !address}
          className="w-full flex items-center justify-center gap-2"
        >
          Request Quote <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  const renderQuote = () => {
    if (!service || !provider) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep("details")}>
            ← Back
          </Button>
        </div>

        <SectionCard title="Service Quote" subtitle="Review your service estimate">
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">{service.name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-gray-900">{formatCurrency(service.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="text-gray-900">{formatCurrency(25000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider</span>
                  <span className="text-gray-900">{provider.name}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-blue-600">{formatCurrency(service.basePrice + 25000)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Clipboard className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Quote Pending Approval</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This quote requires manager approval before proceeding with the booking.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quoteApproval"
                checked={quoteApproved}
                onChange={(e) => setQuoteApproved(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="quoteApproval" className="text-sm text-gray-700">
                I acknowledge the quote and approve the charges
              </label>
            </div>
          </div>
        </SectionCard>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setCurrentStep("policy")}
          disabled={!quoteApproved}
          className="w-full flex items-center justify-center gap-2"
        >
          Continue to Policy Check <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  const renderPolicyCheck = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("quote")}>
          ← Back
        </Button>
      </div>

      {/* Corporate Requirements */}
      <SectionCard title="Corporate Requirements" subtitle="Required for business services">
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategoryTag}
              onChange={(e) => setSelectedCategoryTag(e.target.value)}
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
              {["Facilities", "Operations", "IT-Department", "Office-Services", "Maintenance"].map((tag) => (
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

      {/* Policy Verification */}
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
              <span className="text-gray-700">Quote approved</span>
            </div>
            {quoteApproved ? (
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
                  <p className="text-sm text-green-700">This service meets all corporate policy requirements</p>
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
        <Button variant="ghost" onClick={() => setCurrentStep("quote")} className="flex-1">
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

      {/* Payment Method */}
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

      {/* Booking Summary */}
      <SectionCard title="Booking Summary" subtitle="Review your service details">
        <div className="space-y-3 mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Service</span>
            <span className="text-gray-900">{service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Provider</span>
            <span className="text-gray-900">{provider?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="text-gray-900">{serviceDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time</span>
            <span className="text-gray-900">{selectedTime}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(estimatedPrice + 25000)}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <Button variant="primary" size="lg" onClick={() => setCurrentStep("confirm")} className="w-full flex items-center justify-center gap-2">
        Confirm Booking <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
        <p className="text-gray-500 mt-2">Your service booking has been confirmed</p>
      </div>

      <SectionCard title="Booking Details" subtitle="Confirmation #SRV-2024-001234">
        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium text-gray-900">{service?.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-medium text-gray-900">{provider?.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium text-gray-900">
                {serviceDate} at {selectedTime}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(estimatedPrice + 25000)}</p>
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
          <Phone className="w-5 h-5" />
          Contact Provider
        </Button>
        <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Message Support
        </Button>
        <Button variant="ghost" size="lg" className="w-full" onClick={() => window.location.reload()}>
          Book Another Service
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Booking</h1>
          <p className="text-gray-500 mt-1">Book corporate services with policy compliance</p>
        </div>
        <Pill label={currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} tone="info" />
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{
            width:
              currentStep === "category"
                ? "12%"
                : currentStep === "service"
                  ? "25%"
                  : currentStep === "provider"
                    ? "37%"
                    : currentStep === "details"
                      ? "50%"
                      : currentStep === "quote"
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
      {currentStep === "category" && renderCategorySelection()}
      {currentStep === "service" && renderServiceSelection()}
      {currentStep === "provider" && renderProviderSelection()}
      {currentStep === "details" && renderDetails()}
      {currentStep === "quote" && renderQuote()}
      {currentStep === "policy" && renderPolicyCheck()}
      {currentStep === "payment" && renderPayment()}
      {currentStep === "confirm" && renderConfirmation()}
    </div>
  );
}
