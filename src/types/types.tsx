import React from "react";

// -- Shared Core Types --

export type Currency = "UGX" | "USD" | "CNY" | "KES";

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

export type Toast = {
    id: string;
    title: string;
    message?: string;
    kind: "success" | "warn" | "error" | "info";
};

export type Severity = "Info" | "Warning" | "Critical";

export type DateRange = "7D" | "30D" | "90D" | "YTD";

// -- Transactional Types --

export type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed" | "Disputed";

export type TxType = "Deposit" | "Withdrawal" | "Payment" | "Refund" | "FX" | "Transfer" | "Settlement" | "Chargeback";

export type MethodKey =
    | "Wallet"
    | "Card"
    | "Bank Transfer"
    | "Mobile Money"
    | "WeChat Pay"
    | "Alipay"
    | "UnionPay"
    | "China Settlement"
    | "Other"
    | "CorporatePay"
    | "Personal Wallet"
    | "Organization Wallet";

export type ExportFormat = "CSV" | "Statement PDF" | "Forensics ZIP";

// -- Hub & Organization Types --

export type Eligibility = "Eligible" | "Not eligible" | "Suspended" | "Deposit depleted";

export type OrgRole = "Employee" | "Travel Coordinator" | "Approver" | "Coordinator";

export type BudgetHealth = "Healthy" | "Near limit" | "Blocked";

export type Cap = {
    limitUGX: number;
    usedUGX: number;
};

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
    caps: { daily: Cap; weekly: Cap; monthly: Cap };
};

// -- Domain Objects --

export type LineItem = {
    label: string;
    qty?: number;
    unitPrice?: number;
    total: number;
    kind: "charge" | "tax" | "fee";
};

export type PolicyDecision = {
    id: string;
    label: string;
    value: string;
    impact: "Approval" | "Rejection" | "Flag" | "Blocked";
    ref?: { policyId: string; eventId?: string };
};

export type ApprovalStep = {
    who: string;
    role: string;
    decision: "Approved" | "Rejected" | "Pending";
    when?: string;
};

export type DisputeInfo = {
    status: "None" | "Open" | "Resolved" | "Rejected";
    id?: string;
    openedAt?: string;
    lastUpdate?: string;
};

export type EnforcementSignal = {
    flag: "Limit" | "Fraud" | "Velocity" | "Geo";
    reason: string;
};

export type Tx = {
    id: string;
    createdAtISO: string;
    title: string;
    counterparty: string;
    module: ModuleKey;
    contextId: string;
    type: TxType;
    status: TxStatus;
    method: MethodKey;
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

// -- Checkout & Deals --

export type PaymentMethod =
    | "CorporatePay"
    | "Personal Wallet"
    | "Card"
    | "Mobile Money"
    | "Organization Wallet"
    | "Bank Transfer"
    | "WeChat Pay"
    | "Alipay"
    | "UnionPay";

export type PayoutMethod = "Bank" | "Mobile Money" | "China Settlement";

export type CorporateState = "Available" | "Requires approval" | "Not available";

export type HoldState = "None" | "Requested" | "Locked" | "Expired";

export type DealTier = {
    minQty: number;
    maxQty?: number;
    unitPrice: number;
    label: string;
    badge?: string;
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

export type Receipt = {
    id: string;
    createdAt: number;
    dealId: string;
    title: string;
    vendor: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: PaymentMethod;
    corporate: boolean;
    costCenter?: string;
    purpose?: string;
    dealPriceLocked: boolean;
    lockUntil?: number;
    notes: string[];
};

// -- Preferences --

export type Digest = "Off" | "Daily" | "Weekly";

export type WorkProfile = {
    enabled: boolean;
    name: string;
    timezone: string;
    quietHours: string;
    workingDays: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
    workingHours: string;
    autoApplyToOrg: boolean;
};

// -- Hub Specific --

export type Insight = {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
};

export type TopItem = { name: string; value: string; hint?: string };

export type NextBest = { id: string; title: string; desc: string; done: boolean; cta: string };

// -- AppShell & Navigation Types --

export type RouteKey =
    | "hub"
    | "orgs"
    | "policies"
    | "limits"
    | "requests"
    | "receipts"
    | "payment_methods"
    | "tags"
    | "attestation"
    | "policy_result"
    | "approval_submit"
    | "approval_status"
    | "enforcement"
    | "flows_services"
    | "flows_mylivedealz"
    | "flows_ecommerce"
    | "flows_charging"
    | "flows_rides"
    | "notifications";

export type CorporateStatus = "Active" | "Requires approval" | "Disabled";

export type DisableReason = "Deposit depleted" | "Credit exceeded" | "Billing delinquency" | "Not eligible";

export type Org = {
    id: string;
    name: string;
    role: "Employee" | "Coordinator" | "Approver";
    group: string;
    status: CorporateStatus;
    disableReason?: DisableReason;
    eligible: boolean;
    costCenter?: string;
    autoApprovalEligible?: boolean;
};

export type RequestType = "Ride" | "Purchase" | "Service" | "Charging" | "RFQ" | "Exception";

export type RequestStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Needs changes" | "Expired";

export type ReceiptType = "Ride" | "Order" | "Charging" | "Service" | "Deal";

export type ReceiptStatus = "Ready" | "Refunded" | "Cancelled";

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

export type Notif = {
    id: string;
    ts: number;
    severity: Severity;
    title: string;
    message: string;
    module: string;
    orgId: string;
    why: {
        summary: string;
        triggers: Array<{ label: string; value: string }>;
        audit: Array<{ label: string; value: string }>;
    };
};

export type SearchItem =
    | { kind: "page"; id: string; title: string; subtitle: string; route: string }
    | { kind: "request"; id: string; title: string; subtitle: string; route: string }
    | { kind: "receipt"; id: string; title: string; subtitle: string; route: string };


// -- Shared UI Prop Types --

export type PillTone = "good" | "warn" | "bad" | "info" | "neutral" | "accent";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";

export type ToastKind = "success" | "warn" | "error" | "info";

// -- Receipts & Wallet Context --

export type WalletContext = {
    id: string;
    label: string;
    type: "Personal" | "Organization";
    role?: string;
};

// -- Security & Trust Types --

export type Risk = "Low" | "Medium" | "High";

export type DeviceType = "Mobile" | "Laptop" | "Desktop" | "Android" | "iPhone" | "Windows" | "Mac";

export type Device = {
    id: string;
    label: string;
    type: DeviceType;
    os?: string;
    browser?: string;
    lastSeenAt: number | string;
    location: { city: string; country: string; ip: string } | string;
    trusted: boolean;
    trustExpiresAt?: number;
    sessionActive: boolean;
    risk: Risk;
    current?: boolean;
};

export type AuthMethod = "Password" | "SSO";

export type StepUpMethod = "None" | "MFA" | "OTP";

export type LoginStatus = "Success" | "Failed";

export type LoginEvent = {
    id: string;
    ts: number | string;
    status: LoginStatus | string;
    deviceId?: string;
    deviceLabel: string;
    location: { city: string; country: string; ip: string } | string;
    authMethod?: AuthMethod;
    stepUp?: StepUpMethod;
    risk: Risk;
    reasonCodes?: string[];
    reason?: string;
    when?: string;
    result?: "Success" | "Failed";
};

export type SecurityPolicy = {
    mfaSupported: boolean;
    stepUpEnabled: boolean;
    allowTrustedDevices: boolean;
    trustExpiryDays: number;
    maxTrustedDevices: number;
    allowRiskStepUp: boolean;
    allowGeoStepUp: boolean;
    allowNewDeviceStepUp: boolean;
    allowImpossibleTravelStepUp: boolean;
    allowSessionManagement: boolean;
    allowedChannels: Record<Channel, boolean>;
};

export type StepUpContext = {
    pendingLogin: Omit<LoginEvent, "id" | "stepUp" | "status">;
    required: boolean;
    reasons: string[];
};

export type StepUpRule = {
    id: string;
    label: string;
    enabled: boolean;
    note: string;
};

export type TrustSummary = {
    summary: string;
    triggers: Array<{ label: string; value: string }>;
    policyPath: Array<{ step: string; detail: string }>;
    audit: Array<{ label: string; value: string }>;
};

// -- Layout & Sidebar Types --

export type NavItem = { label: string; path: string; icon: React.ReactNode; badge?: string };

export type NavMenuItem =
    | { type?: undefined; label: string; path: string; icon: React.ReactNode; badge?: string }
    | { type: "divider" }
    | { type: "header"; label: string };

export type NavSection = { title: string; items: NavMenuItem[] };

// -- Notification Types --

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

export type NotificationLink = { label: string; hint: string; to: string };

export type WhyInfo = {
    summary: string;
    triggers: Array<{ label: string; value: string }>;
    policyPath: Array<{ step: string; detail: string }>;
    audit: Array<{ label: string; value: string }>;
};

export type DeliveryLog = { channel: Channel; status: DeliveryStatus; at: number };

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
    why: WhyInfo;
    delivery?: DeliveryLog[];
};

export type DigestFrequency = "Daily" | "Weekly";

export type DigestSettings = {
    enabled: boolean;
    frequency: DigestFrequency;
    timeHHMM: string;
    channels: Record<Channel, boolean>;
    smartGrouping: boolean;
    includeLowSeverity: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
};

export type NotificationTab = "Feed" | "Digests";

// -- Request & Approval Detailed Types --

export type AuditRef = { policyId: string; eventId: string; lastCheckedAt: number };

export type TimelineItem = {
    id: string;
    ts: number;
    by: string;
    action: string;
    why: string;
    severity: Severity;
};

export type Attachment = { id: string; name: string; ts: number };

export type DetailedRequest = {
    id: string;
    type: RequestType | string;
    status: RequestStatus;
    title: string;
    module: string;
    orgName: string;
    amountUGX: number;
    createdAt: number;
    updatedAt: number;
    approverName?: string;
    dueAt?: number;
    lastReminderAt?: number;
    purposeTag?: string;
    costCenter?: string;
    vendor?: string;
    marketplace?: string;
    requiredAttachments: string[];
    attachments: Attachment[];
    note?: string;
    auditRef: AuditRef;
    timeline: TimelineItem[];
};

export type TypeFilter = "All" | RequestType | string;

export type StatusFilter = "All" | RequestStatus;

export type SortKey = "Updated" | "Created" | "Amount" | "SLA";

export type RequestGroup = {
    key: string;
    label: string;
    type: RequestType | string;
    module: string;
    count: number;
    ids: string[];
    sampleTitles: string[];
};
