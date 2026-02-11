// ============================================================================
// Unified Page Registry - CorporatePay + Personal Wallet
// ============================================================================

import { lazy } from "react";

// Page group types
export type PageGroup =
  | "Home"
  | "Wallet"
  | "Corporate"
  | "Checkout Helpers"
  | "Checkout Flows"
  | "Procurement"
  | "Settings"
  | "Support";

// Page definition interface
export interface PageDef {
  id: string;
  path: string;
  group: PageGroup;
  label: string;
  description?: string;
  component: React.ComponentType;
  icon?: React.ReactNode;
  order: number;
}

// Lazy load all pages for code splitting
const Home = lazy(() => import("./home/Home"));
const MobileHome = lazy(() => import("./home/MobileHome"));
const WalletOverview = lazy(() => import("./wallet/WalletOverview"));
const WalletDashboard = lazy(() => import("./wallet/WalletDashboard"));
const AddMoney = lazy(() => import("./wallet/AddMoney"));
const SendMoney = lazy(() => import("./wallet/SendMoney"));
const RequestMoney = lazy(() => import("./wallet/RequestMoney"));
const Withdrawals = lazy(() => import("./wallet/Withdrawals"));
const Beneficiaries = lazy(() => import("./wallet/Beneficiaries"));
const FXExchange = lazy(() => import("./wallet/FXExchange"));
const Earnings = lazy(() => import("./wallet/Earnings"));

// Additional pages that exist but weren't registered
const HubOverview = lazy(() => import("./hub/HubOverview"));
const BudgetLimits = lazy(() => import("./limits/BudgetLimits"));
const NotificationCenter = lazy(() => import("./notifications/NotificationCenter"));
const TransactionDetails = lazy(() => import("./receipts/TransactionDetails"));
const SecurityTrust = lazy(() => import("./security/SecurityTrust"));
const TrustSignals = lazy(() => import("./security/TrustSignals"));
const DeliveryTracking = lazy(() => import("./fulfillment/DeliveryTracking"));
const ChargingCheckout = lazy(() => import("./checkout/ChargingCheckout"));
const ServiceBookingCheckout = lazy(() => import("./checkout/ServiceBookingCheckout"));
const ServiceCheckout = lazy(() => import("./checkout/ServiceCheckout"));
const PolicyCheckResult = lazy(() => import("./compliance/PolicyCheckResult"));
const DisputeReporting = lazy(() => import("./support/DisputeReporting"));

// Corporate pages
const CorporateHub = lazy(() => import("./corporate/CorporateHub"));
const OrgSwitcher = lazy(() => import("./corporate/OrgSwitcher"));
const Policies = lazy(() => import("./corporate/Policies"));
const Limits = lazy(() => import("./corporate/Limits"));
const Requests = lazy(() => import("./corporate/Requests"));
const Receipts = lazy(() => import("./corporate/Receipts"));
const Notifications = lazy(() => import("./corporate/Notifications"));
const Disputes = lazy(() => import("./corporate/Disputes"));
const Preferences = lazy(() => import("./corporate/Preferences"));
const Security = lazy(() => import("./corporate/Security"));

// Checkout helpers
const PaymentMethodSelector = lazy(() => import("./checkout/PaymentMethodSelector"));
const CorporatePayDetails = lazy(() => import("./checkout/CorporatePayDetails"));
const TagsPicker = lazy(() => import("./checkout/TagsPicker"));
const PurposeAttestation = lazy(() => import("./checkout/PurposeAttestation"));
const OutOfPolicy = lazy(() => import("./checkout/OutOfPolicy"));
const ApprovalSubmit = lazy(() => import("./checkout/ApprovalSubmit"));
const ApprovalStatus = lazy(() => import("./checkout/ApprovalStatus"));
const Enforcement = lazy(() => import("./checkout/Enforcement"));

// Checkout flows
const RidesCheckout = lazy(() => import("./flows/RidesCheckout"));
const EVChargingCheckout = lazy(() => import("./flows/EVChargingCheckout"));
const EVChargingReceipt = lazy(() => import("./flows/EVChargingReceipt"));
const EcommerceCheckout = lazy(() => import("./flows/EcommerceCheckout"));
const ServiceBooking = lazy(() => import("./flows/ServiceBooking"));
const DeliveryCheckout = lazy(() => import("./flows/DeliveryCheckout"));
const DealCheckout = lazy(() => import("./flows/DealCheckout"));
const FinalReview = lazy(() => import("./flows/FinalReview"));

// Procurement
const RFQEntry = lazy(() => import("./procurement/RfqEntry"));
const RFQStatus = lazy(() => import("./procurement/RfqStatus"));
const QuoteComparison = lazy(() => import("./procurement/QuoteComparison"));
const QuoteToPO = lazy(() => import("./procurement/QuoteToPo"));
const FulfillmentTracking = lazy(() => import("./procurement/FulfillmentTracking"));

// Unified page registry
export const PAGES: PageDef[] = [
  // ===== HOME =====
  {
    id: "home",
    path: "/home",
    group: "Home",
    label: "Home",
    component: Home,
    order: 0,
  },
  {
    id: "mobile-home",
    path: "/mobile-home",
    group: "Home",
    label: "Mobile Home",
    component: MobileHome,
    order: 1,
  },

  // ===== WALLET =====
  {
    id: "wallet-overview",
    path: "/wallet",
    group: "Wallet",
    label: "Wallet Overview",
    component: WalletOverview,
    order: 10,
  },
  {
    id: "wallet-dashboard",
    path: "/wallet/dashboard",
    group: "Wallet",
    label: "Dashboard",
    component: WalletDashboard,
    order: 11,
  },
  {
    id: "wallet-add-money",
    path: "/wallet/add-money",
    group: "Wallet",
    label: "Add Money",
    component: AddMoney,
    order: 12,
  },
  {
    id: "wallet-send",
    path: "/wallet/send",
    group: "Wallet",
    label: "Send Money",
    component: SendMoney,
    order: 13,
  },
  {
    id: "wallet-request",
    path: "/wallet/request",
    group: "Wallet",
    label: "Request Money",
    component: RequestMoney,
    order: 14,
  },
  {
    id: "wallet-withdraw",
    path: "/wallet/withdraw",
    group: "Wallet",
    label: "Withdrawals",
    component: Withdrawals,
    order: 15,
  },
  {
    id: "wallet-beneficiaries",
    path: "/wallet/beneficiaries",
    group: "Wallet",
    label: "Beneficiaries",
    component: Beneficiaries,
    order: 16,
  },
  {
    id: "wallet-fx",
    path: "/wallet/fx",
    group: "Wallet",
    label: "FX & Currency",
    component: FXExchange,
    order: 17,
  },
  {
    id: "wallet-earnings",
    path: "/wallet/earnings",
    group: "Wallet",
    label: "Earnings & Settlement",
    component: Earnings,
    order: 18,
  },

  // ===== CORPORATE =====
  {
    id: "corporate-hub",
    path: "/corporate",
    group: "Corporate",
    label: "Corporate Hub",
    component: CorporateHub,
    order: 20,
  },
  {
    id: "org-switcher",
    path: "/corporate/organizations",
    group: "Corporate",
    label: "Organization Switcher",
    component: OrgSwitcher,
    order: 21,
  },
  {
    id: "policies",
    path: "/corporate/policies",
    group: "Corporate",
    label: "Policies Summary",
    component: Policies,
    order: 22,
  },
  {
    id: "limits",
    path: "/corporate/limits",
    group: "Corporate",
    label: "Limits & Budget",
    component: Limits,
    order: 23,
  },
  {
    id: "requests",
    path: "/corporate/requests",
    group: "Corporate",
    label: "My Requests",
    component: Requests,
    order: 24,
  },
  {
    id: "receipts",
    path: "/corporate/receipts",
    group: "Corporate",
    label: "Receipts & Activity",
    component: Receipts,
    order: 25,
  },
  {
    id: "notifications",
    path: "/corporate/notifications",
    group: "Corporate",
    label: "Notifications",
    component: Notifications,
    order: 26,
  },
  {
    id: "disputes",
    path: "/corporate/disputes",
    group: "Corporate",
    label: "Disputes & Support",
    component: Disputes,
    order: 27,
  },
  {
    id: "preferences",
    path: "/corporate/preferences",
    group: "Corporate",
    label: "Preferences",
    component: Preferences,
    order: 28,
  },
  {
    id: "security",
    path: "/corporate/security",
    group: "Corporate",
    label: "Security & Trust",
    component: Security,
    order: 29,
  },

  // ===== CHECKOUT HELPERS =====
  {
    id: "payment-methods",
    path: "/checkout/methods",
    group: "Checkout Helpers",
    label: "Payment Method Selector",
    component: PaymentMethodSelector,
    order: 30,
  },
  {
    id: "cp-details",
    path: "/checkout/cp-details",
    group: "Checkout Helpers",
    label: "CorporatePay Details",
    component: CorporatePayDetails,
    order: 31,
  },
  {
    id: "tags",
    path: "/checkout/tags",
    group: "Checkout Helpers",
    label: "Group/Cost Center/Project Tags",
    component: TagsPicker,
    order: 32,
  },
  {
    id: "purpose",
    path: "/checkout/purpose",
    group: "Checkout Helpers",
    label: "Purpose & Attestation",
    component: PurposeAttestation,
    order: 33,
  },
  {
    id: "out-of-policy",
    path: "/checkout/oop",
    group: "Checkout Helpers",
    label: "Out of Policy Result",
    component: OutOfPolicy,
    order: 34,
  },
  {
    id: "approval-submit",
    path: "/checkout/approval",
    group: "Checkout Helpers",
    label: "Approval Review & Submit",
    component: ApprovalSubmit,
    order: 35,
  },
  {
    id: "approval-status",
    path: "/checkout/approval/status",
    group: "Checkout Helpers",
    label: "Pending Approval Timeline",
    component: ApprovalStatus,
    order: 36,
  },
  {
    id: "enforcement",
    path: "/checkout/enforcement",
    group: "Checkout Helpers",
    label: "Enforcement Screens",
    component: Enforcement,
    order: 37,
  },

  // ===== CHECKOUT FLOWS =====
  {
    id: "rides-checkout",
    path: "/checkout/rides",
    group: "Checkout Flows",
    label: "Rides/Logistics Checkout",
    component: RidesCheckout,
    order: 40,
  },
  {
    id: "ev-charging-checkout",
    path: "/checkout/ev",
    group: "Checkout Flows",
    label: "EV Charging Checkout",
    component: EVChargingCheckout,
    order: 41,
  },
  {
    id: "ev-receipt",
    path: "/checkout/ev/receipt",
    group: "Checkout Flows",
    label: "EV Charging Receipt",
    component: EVChargingReceipt,
    order: 42,
  },
  {
    id: "ecommerce-checkout",
    path: "/checkout/ecommerce",
    group: "Checkout Flows",
    label: "E-Commerce Checkout",
    component: EcommerceCheckout,
    order: 43,
  },
  {
    id: "service-booking",
    path: "/checkout/service",
    group: "Checkout Flows",
    label: "Service Booking",
    component: ServiceBooking,
    order: 44,
  },
  {
    id: "delivery-checkout",
    path: "/checkout/delivery",
    group: "Checkout Flows",
    label: "Delivery Checkout",
    component: DeliveryCheckout,
    order: 45,
  },
  {
    id: "deal-checkout",
    path: "/checkout/deal",
    group: "Checkout Flows",
    label: "Deal Checkout",
    component: DealCheckout,
    order: 46,
  },
  {
    id: "final-review",
    path: "/checkout/review",
    group: "Checkout Flows",
    label: "Checkout Summary (Final Review)",
    component: FinalReview,
    order: 47,
  },

  // ===== PROCUREMENT =====
  {
    id: "rfq-entry",
    path: "/procurement/rfq",
    group: "Procurement",
    label: "RFQ Request (Entry)",
    component: RFQEntry,
    order: 50,
  },
  {
    id: "rfq-status",
    path: "/procurement/rfq/:id",
    group: "Procurement",
    label: "RFQ Status Q&A Thread",
    component: RFQStatus,
    order: 51,
  },
  {
    id: "quote-comparison",
    path: "/procurement/quotes",
    group: "Procurement",
    label: "Quotes Comparison",
    component: QuoteComparison,
    order: 52,
  },
  {
    id: "quote-to-po",
    path: "/procurement/po",
    group: "Procurement",
    label: "Quote → PO → Approval Plan",
    component: QuoteToPO,
    order: 53,
  },
  {
    id: "fulfillment",
    path: "/procurement/fulfillment",
    group: "Procurement",
    label: "PO Fulfillment & Tracking",
    component: FulfillmentTracking,
    order: 54,
  },

  // ===== ADDITIONAL REGISTRATIONS =====
  {
    id: "hub-overview",
    path: "/hub",
    group: "Home",
    label: "Hub Overview",
    component: HubOverview,
    order: 5,
  },
  {
    id: "budget-limits",
    path: "/limits/budget",
    group: "Wallet",
    label: "Budget Limits",
    component: BudgetLimits,
    order: 19,
  },
  {
    id: "notification-center",
    path: "/notifications",
    group: "Wallet",
    label: "Notification Center",
    component: NotificationCenter,
    order: 20,
  },
  {
    id: "transaction-details",
    path: "/receipts/:id",
    group: "Wallet",
    label: "Transaction Details",
    component: TransactionDetails,
    order: 21,
  },
  {
    id: "security-trust",
    path: "/security/trust",
    group: "Corporate",
    label: "Security & Trust",
    component: SecurityTrust,
    order: 30,
  },
  {
    id: "trust-signals",
    path: "/security/signals",
    group: "Corporate",
    label: "Trust Signals",
    component: TrustSignals,
    order: 31,
  },
  {
    id: "delivery-tracking",
    path: "/fulfillment/tracking",
    group: "Procurement",
    label: "Delivery Tracking",
    component: DeliveryTracking,
    order: 55,
  },
  {
    id: "charging-checkout",
    path: "/checkout/charging",
    group: "Checkout Flows",
    label: "EV Charging Checkout",
    component: ChargingCheckout,
    order: 48,
  },
  {
    id: "service-booking-checkout",
    path: "/checkout/service-booking",
    group: "Checkout Flows",
    label: "Service Booking",
    component: ServiceBookingCheckout,
    order: 49,
  },
  {
    id: "service-checkout",
    path: "/checkout/service",
    group: "Checkout Flows",
    label: "Service Checkout",
    component: ServiceCheckout,
    order: 50,
  },
  {
    id: "policy-check-result",
    path: "/compliance/policy-result",
    group: "Corporate",
    label: "Policy Check Result",
    component: PolicyCheckResult,
    order: 32,
  },
  {
    id: "dispute-reporting",
    path: "/support/dispute-reporting",
    group: "Support",
    label: "Dispute Reporting",
    component: DisputeReporting,
    order: 60,
  },
];

// Navigation helpers
export const getPageById = (id: string): PageDef | undefined =>
  PAGES.find((page) => page.id === id);

export const getPageByPath = (path: string): PageDef | undefined =>
  PAGES.find((page) => page.path === path);

export const getPagesByGroup = (group: PageGroup): PageDef[] =>
  PAGES.filter((page) => page.group === group).sort((a, b) => a.order - b.order);

export const getAllGroups = (): PageGroup[] =>
  Array.from(new Set(PAGES.map((page) => page.group))) as PageGroup[];

// Search pages by id or label
export const searchPages = (query: string): PageDef[] => {
  const lowerQuery = query.toLowerCase();
  return PAGES.filter(
    (page) =>
      page.id.toLowerCase().includes(lowerQuery) ||
      page.label.toLowerCase().includes(lowerQuery) ||
      page.group.toLowerCase().includes(lowerQuery)
  );
};
