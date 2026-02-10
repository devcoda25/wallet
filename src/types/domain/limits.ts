
export type BudgetHealth = "Healthy" | "Near limit" | "Blocked";

export type FundingStatus = "Active" | "Low" | "Depleted";

export type EnforcementState = "Active" | "Deposit depleted" | "Billing non-compliance" | "Credit exceeded";

export type ToastKind = "success" | "warn" | "error" | "info";

export interface Toast {
    id: string;
    title: string;
    message?: string;
    kind: ToastKind;
}

export interface Cap {
    limitUGX: number;
    usedUGX: number;
}

export interface WalletFunding {
    enabled: boolean;
    status: FundingStatus;
    balanceMasked: string;
    note: string;
}

export interface CreditFunding {
    enabled: boolean;
    status: FundingStatus;
    limitMasked: string;
    usedMasked: string;
    availableMasked: string;
    note: string;
}

export interface PrepaidFunding {
    enabled: boolean;
    status: FundingStatus;
    runwayDays: number;
    nextTopUpHint: string;
    note: string;
}

export interface FundingModel {
    wallet: WalletFunding;
    credit: CreditFunding;
    prepaid: PrepaidFunding;
}

export type AltModule = "Rides & Logistics" | "E-Commerce" | "EV Charging" | "Other";

export interface Alt {
    id: string;
    module: AltModule;
    title: string;
    desc: string;
    chips: string[];
}

export type Tab = "limits" | "funding" | "premium" | "alternatives";

export interface AuditRef {
    policyId: string;
    eventId: string;
    lastCheckedAt: number;
}

export type Tier = 0 | 1 | 2 | 3;
export type Currency = "UGX" | "USD" | "CNY" | "KES";
export type Rail = "Card" | "Bank Transfer" | "Mobile Money" | "WeChat Pay" | "Alipay" | "UnionPay" | "Wallet" | "China Settlement";
export type LimitWindow = "Daily" | "Weekly" | "Monthly";
export type LimitType = "Deposit" | "Withdraw" | "Transfer";

export interface LimitRow {
    rail: Rail;
    type: LimitType;
    currency: Currency;
    window: LimitWindow;
    limit: number;
    used: number;
    note: string;
}

export type EnforcementFlag = "Risk hold" | "Compliance lock" | "Chargeback risk" | "Deposit depleted" | "Credit exceeded" | "Billing non-compliance";

export interface Enforcement {
    flag: EnforcementFlag;
    severity: "Info" | "Warning" | "Blocked";
    title: string;
    detail: string;
    recommended: Array<{ label: string; action: string }>;
}

export type OrgFundingModel = "Wallet" | "Prepaid" | "Credit" | "Wallet + Credit";
export type OrgStatus = "Active" | "Paused" | "Suspended";
export type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

export interface OrgFunding {
    orgId: string;
    orgName: string;
    role: OrgRole;
    model: OrgFundingModel;
    status: OrgStatus;
    prepaidBalanceUGX?: number;
    creditAvailableUGX?: number;
    creditLimitUGX?: number;
    creditUsedUGX?: number;
    walletAvailableUGX?: number;
    enforcement?: { flag: EnforcementFlag; reason: string };
}

export interface OrgBudget {
    orgId: string;
    orgName: string;
    role: OrgRole;
    groupName: string;
    costCenter: string;
    enforcement: EnforcementState;
    budgetHealth: BudgetHealth;
    caps: { daily: Cap; weekly: Cap; monthly: Cap };
    funding: FundingModel;
    auditRef: AuditRef;
}

export type View = "Personal" | "Organization";
export type OrgTab = "Caps" | "Funding" | "Premium" | "Alternatives";
