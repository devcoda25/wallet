// ============================================================================
// Wallet Types for Personal Wallet Features
// ============================================================================

import type { Currency, TxStatus, PaymentMethod, PayoutMethod, Severity } from "./shared";

// -- Wallet Context --

export type WalletContext = {
    id: string;
    type: "personal";
    label: string;
    status: WalletStatus;
};

export type WalletStatus = "Active" | "Needs verification" | "Suspended" | "Deposit depleted";

// -- Balances --

export type Balance = {
    currency: Currency;
    symbol: string;
    available: number;
    pending: number;
    reserved: number;
    approxUGX?: number;
};

export type CurrencyBalance = {
    currency: Currency;
    available: number;
    usedUGX: number;
};

// -- Transactions --

export type WalletTransaction = {
    id: string;
    title: string;
    subtitle: string;
    when: string;
    status: TxStatus;
    amount: number;
    currency: Currency;
    direction: "in" | "out";
    module: WalletModule;
    ref: string;
};

export type WalletModule =
    | "E-Commerce"
    | "EV Charging"
    | "Rides"
    | "Services"
    | "Finance"
    | "Creator"
    | "Shoppable Adz"
    | "MyLiveDealz"
    | "Other";

// -- Funding --

export type FundingMethod =
    | "Card"
    | "Bank Transfer"
    | "Mobile Money"
    | "WeChat Pay"
    | "Alipay"
    | "UnionPay"
    | "Other Method"
    | "Voucher";

export type TopUpStatus = "Pending" | "Posted" | "Failed";

export type TopUp = {
    id: string;
    method: FundingMethod;
    amount: number;
    currency: Currency;
    status: TopUpStatus;
    createdAt: string;
    eta: string;
    providerRef?: string;
    internalRef: string;
    fee: number;
    total: number;
    note?: string;
};

// -- Transfers & Requests --

export type TransferMode = "Send" | "Request" | "Split";

export type RecipientType = "EVzone user" | "Phone or Email" | "QR" | "Contacts";

export type TransferStatus = "Draft" | "Pending" | "Completed" | "Failed" | "Reversed";

export type Transfer = {
    id: string;
    mode: TransferMode;
    title: string;
    subtitle: string;
    when: string;
    status: TransferStatus;
    amount: number;
    currency: Currency;
    ref: string;
    why?: string;
};

// -- Payouts --

export type BeneficiaryStatus = "Verified" | "Pending" | "Failed";

export type Beneficiary = {
    id: string;
    label: string;
    type: PayoutMethod;
    currency: Currency;
    status: BeneficiaryStatus;
    detailsMasked: string;
    createdAt: string;
    cooling: "None" | "Cooling";
};

export type PayoutState = "Queued" | "Processing" | "Paid" | "Failed" | "Reversed" | "Canceled";

export type Payout = {
    id: string;
    createdAt: string;
    method: PayoutMethod;
    beneficiaryLabel: string;
    payoutCurrency: Currency;
    sourceCurrency: Currency;
    amount: number;
    fee: number;
    fxFee: number;
    totalDebit: number;
    eta: string;
    state: PayoutState;
    internalRef: string;
    providerRef?: string;
    cancelUntil?: string;
    why?: string;
};

// -- Earnings & Settlement --

export type EarningsSource =
    | "Creator Contracts"
    | "Shoppable Adz"
    | "Marketplace Sales"
    | "Services Bookings"
    | "EV Charging"
    | "Rides & Logistics"
    | "Other";

export type SettlementItem = {
    id: string;
    source: EarningsSource;
    title: string;
    amountUGX: number;
    status: "Pending" | "Cleared";
    expectedDate: string;
    refs: { internal: string; provider?: string };
    withholdingUGX?: number;
};

export type AutoPayoutRule = {
    enabled: boolean;
    schedule: "Daily" | "Weekly" | "Monthly" | "Manual";
    thresholdUGX: number;
    payoutMethod: PayoutMethod;
    payoutCurrency: Currency;
    dayOfWeek?: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
    dayOfMonth?: number;
};

// -- FX & Multi-Currency --

export type QuoteProvider = "EVzone FX" | "Airwallex" | "Local Bank";

export type RateDirection = "Above" | "Below";

export type AlertRule = {
    id: string;
    pair: string;
    direction: RateDirection;
    threshold: number;
    enabled: boolean;
};

export type Conversion = {
    id: string;
    when: string;
    from: Currency;
    to: Currency;
    fromAmount: number;
    toAmount: number;
    rate: number;
    spread: number;
    provider: QuoteProvider;
    receiptId: string;
};

export type SettlementScope = "Beneficiary" | "Organization" | "Module";

export type SettlementRule = {
    id: string;
    scope: SettlementScope;
    target: string;
    currency: Currency;
    note: string;
};

// -- Upcoming Items --

export type UpcomingItem = {
    id: string;
    title: string;
    subtitle: string;
    when: string;
    tone: "info" | "warn" | "good";
    cta: string;
};

// -- Label Tags --

export type LabelTag = "Salary" | "Business" | "Personal" | "China settlement" | "Savings" | "Other";

// -- Default Map --

export type DefaultMap = Record<Currency, string>;
