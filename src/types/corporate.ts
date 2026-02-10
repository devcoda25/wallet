// ============================================================================
// CorporatePay Types for Organization Features
// ============================================================================

import type { Currency, TxStatus, Severity, PaymentMethod } from "./shared";

// -- Organization Types --

export type OrgMembership = {
    id: string;
    orgName: string;
    role: OrgRole;
    group: string;
    costCenter: string;
    isDefault: boolean;
    eligibility: Eligibility;
    whyUnavailable?: string;
    auditRef?: { policyId: string; eventId: string; lastCheckedAt: number };
    approvalsPending: number;
    groupBudgetHealth: BudgetHealth;
    caps: Caps;
};

export type Eligibility = "Eligible" | "Not eligible" | "Suspended" | "Deposit depleted";

export type OrgRole = "Employee" | "Travel Coordinator" | "Approver" | "Coordinator" | "Admin";

export type BudgetHealth = "Healthy" | "Near limit" | "Blocked";

export type Cap = {
    limitUGX: number;
    usedUGX: number;
};

export type Caps = {
    daily: Cap;
    weekly: Cap;
    monthly: Cap;
};

export type CorporateStatus = "Active" | "Requires approval" | "Disabled";

export type DisableReason = "Deposit depleted" | "Credit exceeded" | "Billing delinquency" | "Not eligible";

// -- Organization --

export type Organization = {
    id: string;
    name: string;
    role: OrgRole;
    group: string;
    status: CorporateStatus;
    disableReason?: DisableReason;
    eligible: boolean;
    costCenter?: string;
    autoApprovalEligible?: boolean;
};

// -- Requests --

export type RequestType = "Ride" | "Purchase" | "Service" | "Charging" | "RFQ" | "Exception";

export type RequestStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Needs changes" | "Expired";

export type AppRequest = {
    id: string;
    ts: number;
    type: RequestType;
    status: RequestStatus;
    title: string;
    amountUGX: number;
    orgId: string;
    module: string;
};

// -- Receipts --

export type ReceiptType = "Ride" | "Order" | "Charging" | "Service" | "Deal";

export type ReceiptStatus = "Ready" | "Refunded" | "Cancelled";

export type ReceiptRow = {
    id: string;
    ts: number;
    type: ReceiptType;
    status: ReceiptStatus;
    title: string;
    amountUGX: number;
    orgId: string;
    module: string;
    purpose?: string;
    costCenter?: string;
    notes?: string[];
};

// -- Policy --

export type PolicyDecision = {
    id: string;
    label: string;
    value: string;
    impact: "Approval" | "Rejection" | "Flag" | "Blocked";
    ref?: { policyId: string; eventId?: string };
};

// -- Approvals --

export type ApprovalStep = {
    who: string;
    role: string;
    decision: "Approved" | "Rejected" | "Pending";
    when?: string;
};

// -- Disputes --

export type DisputeInfo = {
    status: "None" | "Open" | "Resolved" | "Rejected";
    id?: string;
    openedAt?: string;
    lastUpdate?: string;
};

// -- Enforcement --

export type EnforcementSignal = {
    flag: "Limit" | "Fraud" | "Velocity" | "Geo";
    reason: string;
};

// -- Transaction --

export type Tx = {
    id: string;
    createdAtISO: string;
    title: string;
    counterparty: string;
    module: ModuleKey;
    contextId: string;
    type: TxType;
    status: TxStatus;
    method: PaymentMethod;
    currency: Currency;
    amount: number;
    fees: number;
    taxes: number;
    fxRate?: number;
    fxSpreadPct?: number;
    ledgerRef: string;
    internalRef: string;
    providerRef?: string;
    tags?: Record<string, string | undefined>;
    lineItems: LineItem[];
    policyDecisions?: PolicyDecision[];
    approvals?: ApprovalStep[];
    dispute: DisputeInfo;
    enforcement?: EnforcementSignal;
    auditWhy?: string;
    hasDispute?: boolean;
};

export type ModuleKey =
    | "CorporatePay"
    | "E-Commerce"
    | "EV Charging"
    | "Rides & Logistics"
    | "Services"
    | "Shoppable Adz"
    | "Creator"
    | "Wallet"
    | "ServiceMart"
    | "MyLiveDealz"
    | "School & E-Learning"
    | "Medical & Health Care"
    | "Travel & Tourism"
    | "Green Investments"
    | "FaithHub"
    | "Virtual Workspace"
    | "Finance & Payments"
    | "Other";

export type LineItem = {
    label: string;
    qty?: number;
    unitPrice?: number;
    total: number;
    kind: "charge" | "tax" | "fee";
};

export type TxType = "Deposit" | "Withdrawal" | "Payment" | "Refund" | "FX" | "Transfer" | "Settlement" | "Chargeback";

// -- Notifications --

export type NotificationType =
    | "Deposit"
    | "Withdrawal"
    | "Approval update"
    | "Dispute"
    | "Verification"
    | "Low balance"
    | "Provider outage"
    | "Policy change"
    | "Payment method"
    | "Receipt ready"
    | "RFQ update";

export type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";

export type DeliveryStatus = "Queued" | "Sent" | "Delivered" | "Failed";

export type ContextId = "personal" | "org_acme" | "org_khl" | "org_demo";

export type NotificationLink = {
    label: string;
    hint: string;
    to: string;
};

export type WhyInfo = {
    summary: string;
    triggers: Array<{ label: string; value: string }>;
    policyPath: Array<{ step: string; detail: string }>;
    audit: Array<{ label: string; value: string }>;
};

export type DeliveryLog = {
    channel: Channel;
    status: DeliveryStatus;
    at: number;
};

export type AppNotification = {
    id: string;
    ts: number;
    severity: Severity;
    module: ModuleKey;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    actor: string;
    contextId: ContextId;
    links: NotificationLink[];
};

// -- Activity --

export type ActivityEvent = {
    id: string;
    tsISO: string;
    module: string;
    contextId: string;
    title: string;
    message: string;
    severity: Severity;
    actionLabel?: string;
    actionUrl?: string;
    txId?: string;
};

// -- Checkout Types --

export type CheckoutStep = "cart" | "allocation" | "payment" | "policy" | "receipt";

export type Marketplace =
    | "MyLiveDealz"
    | "ServiceMart"
    | "EVmart"
    | "GadgetMart"
    | "LivingMart"
    | "StyleMart"
    | "EduMart"
    | "HealthMart"
    | "PropertyMart"
    | "GeneratMart"
    | "ExpressMart"
    | "FaithMart"
    | "Other Marketplace";

export type Category =
    | "Office supplies"
    | "Electronics"
    | "Catering"
    | "Vehicles"
    | "Medical"
    | "Alcohol"
    | "Other";

export type VendorStatus = "Allowlisted" | "Preferred" | "Unapproved" | "Denylisted";

export type Vendor = {
    id: string;
    name: string;
    status: VendorStatus;
    categories: Category[];
    notes?: string;
};

export type CorporateProgramStatus =
    | "Eligible"
    | "Not linked"
    | "Not eligible"
    | "Deposit depleted"
    | "Credit limit exceeded"
    | "Billing delinquency";

export type CorporateState = "Available" | "Requires approval" | "Not available";

export type Outcome = "Allowed" | "Approval required" | "Blocked";

export type CartItem = {
    id: string;
    name: string;
    marketplace: Marketplace;
    vendorId: string;
    category: Category;
    unitUGX: number;
    qty: number;
    imageHint?: string;
    allocationCostCenter?: string;
};

export type PolicyReasonCode =
    | "PROGRAM"
    | "VENDOR"
    | "CATEGORY"
    | "BASKET"
    | "MARKETPLACE"
    | "ALLOCATION"
    | "THRESHOLD"
    | "RFQ"
    | "OK";

export type PolicyReason = {
    code: PolicyReasonCode;
    title: string;
    detail: string;
    severity: "Info" | "Warning" | "Critical";
};

export type Deal = {
    id: string;
    title: string;
    vendor: string;
    vendorBadge: "Preferred" | "Allowlisted" | "Unapproved";
    category: string;
    location: string;
    endsAt: number;
    stockTotal: number;
    stockRemaining: number;
    regularUnitPrice: number;
    tiers: DealTier[];
    shippingUGX: number;
    policy:
    | { holdSupported: true; minHoldMinutes: number; maxHoldMinutes: number }
    | { holdSupported: false; reason: string };
};

export type DealTier = {
    minQty: number;
    maxQty?: number;
    unitPrice: number;
    label: string;
    badge?: string;
};

// -- Procurement Types --

export type RFQStatus = "Draft" | "Open" | "Clarification" | "Evaluating" | "Awarded" | "Closed";

export type QuoteStatus = "Pending" | "Submitted" | "Shortlisted" | "Rejected" | "Accepted";

export type POStatus = "Draft" | "Approved" | "Partially Fulfilled" | "Fulfilled" | "Cancelled";

export type RFQ = {
    id: string;
    title: string;
    description: string;
    orgId: string;
    status: RFQStatus;
    createdAt: number;
    deadline: number;
    specifications: string;
    attachments: Attachment[];
    costCenter?: string;
    projectTag?: string;
};

export type RFQThread = {
    id: string;
    rfqId: string;
    messages: ThreadMessage[];
    vendors: string[];
    status: RFQStatus;
};

export type ThreadMessage = {
    id: string;
    sender: string;
    senderType: "buyer" | "vendor" | "admin";
    content: string;
    attachments: Attachment[];
    timestamp: number;
};

export type Quote = {
    id: string;
    vendorId: string;
    vendorName: string;
    rfqId: string;
    amountUGX: number;
    leadTime: string;
    status: QuoteStatus;
    submittedAt: number;
    validUntil: number;
    terms: string;
};

export type PurchaseOrder = {
    id: string;
    rfqId: string;
    quoteId: string;
    vendorId: string;
    vendorName: string;
    amountUGX: number;
    status: POStatus;
    createdAt: number;
    milestones: POMilestone[];
};

export type POMilestone = {
    id: string;
    description: string;
    amountUGX: number;
    dueDate: number;
    status: "Pending" | "Paid" | "Released";
    proof?: string;
};

export type Fulfillment = {
    id: string;
    poId: string;
    status: "Ordered" | "Shipped" | "In Transit" | "Delivered" | "Installed";
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: number;
    actualDelivery?: number;
    proofs: Attachment[];
};

export type Attachment = {
    id: string;
    name: string;
    size: number;
    type: string;
    ts: number;
    url?: string;
};

// -- Procurement Step Types --

export type RFQStep = "Basics" | "Specs" | "Delivery" | "Allocation" | "Review";

export type TemplateId = "Vehicle" | "Equipment" | "Electronics" | "Other";

export type Intent = "CapEx" | "OpEx" | "Not sure";

export type SpecField = {
    key: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: "text" | "number" | "select";
    options?: string[];
};

export type SpecRow = {
    id: string;
    k: string;
    v: string;
};

// -- Insight Types --

export type Insight = {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
};

export type TopItem = {
    name: string;
    value: string;
    hint?: string;
};

export type NextBest = {
    id: string;
    title: string;
    desc: string;
    done: boolean;
    cta: string;
};
