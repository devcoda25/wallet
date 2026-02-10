import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Info,
  Lock,
  MapPin,
  Package,
  RefreshCcw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn, uid, formatUGX, timeAgo } from "@/lib/utils";

// Types
import {
  Tier,
  Currency,
  LimitRow,
  Enforcement,
  OrgFunding,
  BudgetHealth,
  Cap,
  EnforcementState,
  FundingStatus,
  OrgBudget,
  Alt,
  View,
  OrgTab,
  Toast,
  LimitType
} from "@/types/domain/limits";

// UI Components
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToastStack } from "@/components/ui/ToastStack";
import { SegButton } from "@/components/ui/SegButton";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

// Domain Components
import { ProgressRing } from "@/components/domain/limits/ProgressRing";
import { FundingCard } from "@/components/domain/limits/FundingCard";
import { AltCard } from "@/components/domain/limits/AltCard";
import { TinyBar } from "@/components/domain/limits/TinyBar";
import { PatternCard } from "@/components/domain/limits/PatternCard";
import { StatTiny } from "@/components/domain/limits/StatTiny";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

// -- Helpers --
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.round((used / limit) * 100);
}

function formatMoney(amount: number, currency: Currency) {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
}

function toneForFunding(s: FundingStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Low") return "warn" as const;
  return "bad" as const;
}

function toneForEnforcement(s: EnforcementState) {
  if (s === "Active") return "good" as const;
  if (s === "Deposit depleted") return "warn" as const;
  if (s === "Credit exceeded") return "warn" as const;
  return "bad" as const;
}

function toneForHealth(h: BudgetHealth) {
  if (h === "Healthy") return "good" as const;
  if (h === "Near limit") return "warn" as const;
  return "bad" as const;
}

export default function BudgetLimits() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Top-level view
  const [view, setView] = useState<View>("Personal");

  // Personal states
  const [tier, setTier] = useState<Tier>(1);
  const [kycStatus, setKycStatus] = useState<"Not started" | "In review" | "Verified" | "Rejected">("In review");

  const tierInfo = useMemo(() => {
    const map: Record<Tier, { name: string; benefits: string[]; next: string[] }> = {
      0: { name: "Tier 0", benefits: ["View balance and transactions"], next: ["Start KYC"] },
      1: { name: "Tier 1", benefits: ["Basic deposits", "Limited withdrawals", "Standard payouts"], next: ["Upload ID", "Add selfie", "Verify address"] },
      2: { name: "Tier 2", benefits: ["Higher limits", "Instant payouts (eligible)", "Lower FX spread"], next: ["Add proof of address", "Enhanced verification"] },
      3: { name: "Tier 3", benefits: ["Highest limits", "Priority payouts", "Business-grade controls"], next: ["Source of funds", "Enhanced due diligence"] },
    };
    return map[tier];
  }, [tier]);

  const limits = useMemo<LimitRow[]>(
    () => [
      { rail: "Card", type: "Deposit", currency: "UGX", window: "Daily", limit: tier >= 2 ? 5000000 : 2000000, used: 750000, note: "Card deposits can be delayed during provider maintenance." },
      { rail: "Bank Transfer", type: "Deposit", currency: "UGX", window: "Daily", limit: tier >= 2 ? 20000000 : 5000000, used: 1200000, note: "Lower fees. Use unique reference." },
      { rail: "Mobile Money", type: "Deposit", currency: "UGX", window: "Daily", limit: tier >= 2 ? 3000000 : 1500000, used: 300000, note: "UGX only." },
      { rail: "WeChat Pay", type: "Deposit", currency: "CNY", window: "Daily", limit: tier >= 2 ? 8000 : 2000, used: 820, note: "CNY only. Availability depends on region." },
      { rail: "Alipay", type: "Deposit", currency: "CNY", window: "Daily", limit: tier >= 2 ? 8000 : 2000, used: 0, note: "CNY only." },
      { rail: "UnionPay", type: "Deposit", currency: "CNY", window: "Daily", limit: tier >= 2 ? 12000 : 3000, used: 0, note: "CNY supported." },
      { rail: "Bank Transfer", type: "Withdraw", currency: "UGX", window: "Daily", limit: tier >= 2 ? 3000000 : 800000, used: 250000, note: "Name match required." },
      { rail: "Mobile Money", type: "Withdraw", currency: "UGX", window: "Daily", limit: tier >= 2 ? 2000000 : 500000, used: 120000, note: "Instant eligible if Tier 2 and verified beneficiary." },
      { rail: "China Settlement", type: "Withdraw", currency: "CNY", window: "Daily", limit: tier >= 2 ? 10000 : 2500, used: 0, note: "Supported only where available." },
      { rail: "Wallet", type: "Transfer", currency: "UGX", window: "Daily", limit: tier >= 2 ? 5000000 : 1500000, used: 90000, note: "High value transfers may trigger OTP." },
      { rail: "Wallet", type: "Transfer", currency: "USD", window: "Daily", limit: tier >= 2 ? 2000 : 200, used: 0, note: "FX applies if recipient currency differs." },
    ],
    [tier]
  );

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("UGX");
  const [selectedType, setSelectedType] = useState<LimitType | "ALL">("ALL");

  const shownLimits = useMemo(() => {
    return limits
      .filter((l) => l.currency === selectedCurrency)
      .filter((l) => (selectedType === "ALL" ? true : l.type === selectedType));
  }, [limits, selectedCurrency, selectedType]);

  const personalEnforcement = useMemo<Enforcement[]>(
    () => [
      {
        flag: "Chargeback risk",
        severity: "Warning",
        title: "Card deposits may be held",
        detail: "Recent card deposits can trigger payout holds until settlement completes. This reduces chargeback abuse.",
        recommended: [
          { label: "Use bank transfer", action: "Switch to bank transfer for top-ups" },
          { label: "Schedule payout", action: "Schedule withdrawal after settlement" },
        ],
      },
      {
        flag: "Risk hold",
        severity: "Blocked",
        title: "Withdrawal blocked by risk checks",
        detail: "New beneficiary cooling is active or step-up verification is required.",
        recommended: [
          { label: "Verify beneficiary", action: "Complete beneficiary verification" },
          { label: "Use verified method", action: "Switch to a verified beneficiary" },
          { label: "Partial payout", action: "Split into smaller amounts" },
        ],
      },
      {
        flag: "Compliance lock",
        severity: "Warning",
        title: "KYC still in review",
        detail: "Some rails have reduced limits until verification is approved.",
        recommended: [
          { label: "Continue KYC", action: "Upload missing documents" },
          { label: "Use wallet balance", action: "Use wallet payments instead of payouts" },
        ],
      },
    ],
    []
  );

  const orgFundingList = useMemo<OrgFunding[]>(
    () => [
      {
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        role: "Approver",
        model: "Wallet + Credit",
        status: "Active",
        walletAvailableUGX: 9800000,
        creditAvailableUGX: 5000000,
        creditLimitUGX: 10000000,
        creditUsedUGX: 5000000,
        enforcement: { flag: "Risk hold", reason: "Large purchase approvals required above threshold" },
      },
      {
        orgId: "org_khl",
        orgName: "Kampala Holdings",
        role: "Member",
        model: "Prepaid",
        status: "Paused",
        prepaidBalanceUGX: 0,
        enforcement: { flag: "Deposit depleted", reason: "Prepaid deposit is depleted. CorporatePay paused." },
      },
      {
        orgId: "org_demo",
        orgName: "EVzone Demo Org",
        role: "Viewer",
        model: "Credit",
        status: "Suspended",
        creditAvailableUGX: 0,
        creditLimitUGX: 5000000,
        creditUsedUGX: 5400000,
        enforcement: { flag: "Billing non-compliance", reason: "Billing is not compliant with invoicing agreement." },
      },
    ],
    []
  );

  const orgBudgets = useMemo<OrgBudget[]>(
    () => [
      {
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        role: "Approver",
        groupName: "Operations",
        costCenter: "OPS-01",
        enforcement: "Active",
        budgetHealth: "Near limit",
        caps: {
          daily: { limitUGX: 250000, usedUGX: 185000 },
          weekly: { limitUGX: 1200000, usedUGX: 920000 },
          monthly: { limitUGX: 5000000, usedUGX: 4100000 },
        },
        funding: {
          wallet: { enabled: true, status: "Active", balanceMasked: "Sufficient", note: "Company wallet is funded for pay-as-you-go." },
          credit: { enabled: true, status: "Active", limitMasked: "UGX 10M+", usedMasked: "Moderate", availableMasked: "Available", note: "Company credit is available within limits." },
          prepaid: { enabled: true, status: "Low", runwayDays: 3, nextTopUpHint: "Top up recommended", note: "Prepaid deposit is low. Service stops when depleted." },
        },
        auditRef: { policyId: "POL-DEFAULT", eventId: "EVT-OK", lastCheckedAt: Date.now() - 9 * 60 * 1000 },
      },
      {
        orgId: "org_khl",
        orgName: "Kampala Holdings",
        role: "Member",
        groupName: "Travel Desk",
        costCenter: "TRV-02",
        enforcement: "Deposit depleted",
        budgetHealth: "Blocked",
        caps: {
          daily: { limitUGX: 120000, usedUGX: 120000 },
          weekly: { limitUGX: 600000, usedUGX: 600000 },
          monthly: { limitUGX: 2000000, usedUGX: 2000000 },
        },
        funding: {
          wallet: { enabled: true, status: "Active", balanceMasked: "Unknown", note: "Wallet pay-as-you-go may still be enabled for some flows." },
          credit: { enabled: false, status: "Depleted", limitMasked: "Not enabled", usedMasked: "-", availableMasked: "-", note: "Credit line not enabled for this org." },
          prepaid: { enabled: true, status: "Depleted", runwayDays: 0, nextTopUpHint: "Top up required", note: "Prepaid deposit is depleted. CorporatePay is paused." },
        },
        auditRef: { policyId: "POL-FUNDING", eventId: "EVT-DEPOSIT-0", lastCheckedAt: Date.now() - 16 * 60 * 1000 },
      },
      {
        orgId: "org_demo",
        orgName: "EVzone Demo Org",
        role: "Viewer",
        groupName: "Finance",
        costCenter: "FIN-01",
        enforcement: "Billing non-compliance",
        budgetHealth: "Near limit",
        caps: {
          daily: { limitUGX: 200000, usedUGX: 130000 },
          weekly: { limitUGX: 900000, usedUGX: 720000 },
          monthly: { limitUGX: 3000000, usedUGX: 2500000 },
        },
        funding: {
          wallet: { enabled: true, status: "Active", balanceMasked: "Sufficient", note: "Funding seems OK but service may be suspended." },
          credit: { enabled: true, status: "Depleted", limitMasked: "UGX 5M", usedMasked: "High", availableMasked: "Not available", note: "Credit exceeded or invoices overdue." },
          prepaid: { enabled: false, status: "Active", runwayDays: 0, nextTopUpHint: "Not applicable", note: "Prepaid not enabled." },
        },
        auditRef: { policyId: "POL-ENFORCEMENT", eventId: "EVT-SUSPEND", lastCheckedAt: Date.now() - 2 * 60 * 60 * 1000 },
      },
    ],
    []
  );

  const [orgId, setOrgId] = useState<string>(orgBudgets[0].orgId);
  const currentOrgBudget = useMemo(() => orgBudgets.find((o) => o.orgId === orgId) || orgBudgets[0], [orgBudgets, orgId]);
  const currentOrgFunding = useMemo(() => orgFundingList.find((o) => o.orgId === orgId) || orgFundingList[0], [orgFundingList, orgId]);

  const canSeeOrgNumbers = useMemo(() => ["Finance", "Admin", "Owner"].includes(currentOrgFunding.role), [currentOrgFunding.role]);

  const [orgTab, setOrgTab] = useState<OrgTab>("Caps");
  const blockedOrg = currentOrgBudget.enforcement !== "Active";

  const [dayOfMonth, setDayOfMonth] = useState(8);
  const [monthDays, setMonthDays] = useState(30);

  useEffect(() => {
    setDayOfMonth(8);
    setMonthDays(30);
  }, [orgId]);

  const avgDailySpend = useMemo(() => {
    if (dayOfMonth <= 0) return 0;
    return currentOrgBudget.caps.monthly.usedUGX / dayOfMonth;
  }, [currentOrgBudget.caps.monthly.usedUGX, dayOfMonth]);

  const daysToCap = useMemo(() => {
    const remaining = Math.max(0, currentOrgBudget.caps.monthly.limitUGX - currentOrgBudget.caps.monthly.usedUGX);
    if (avgDailySpend <= 0) return Infinity;
    return Math.ceil(remaining / avgDailySpend);
  }, [currentOrgBudget.caps.monthly.limitUGX, currentOrgBudget.caps.monthly.usedUGX, avgDailySpend]);

  const forecastMonthEnd = useMemo(() => {
    if (dayOfMonth <= 0) return currentOrgBudget.caps.monthly.usedUGX;
    return Math.round((currentOrgBudget.caps.monthly.usedUGX / dayOfMonth) * monthDays);
  }, [currentOrgBudget.caps.monthly.usedUGX, dayOfMonth, monthDays]);

  const alternatives: Alt[] = useMemo(
    () => [
      { id: "alt-ride-std", module: "Rides & Logistics", title: "Use Standard rides to reduce approvals", desc: "Standard rides are usually within policy and faster to approve.", chips: ["Standard", "Lower risk", "Faster"] },
      { id: "alt-ride-zones", module: "Rides & Logistics", title: "Stay within approved zones", desc: "Trips in Kampala and Entebbe are more likely to pass policy checks.", chips: ["Geo", "Kampala", "Entebbe"] },
      { id: "alt-ec-vendors", module: "E-Commerce", title: "Use approved vendors", desc: "Approved vendors reduce rejections and avoid extra approvals.", chips: ["Approved vendor", "Procurement"] },
      { id: "alt-ec-categories", module: "E-Commerce", title: "Avoid restricted categories", desc: "Some categories are blocked for corporate purchases.", chips: ["Category policy", "Blocked items"] },
      { id: "alt-ev-approved", module: "EV Charging", title: "Charge at approved stations", desc: "Approved sites are billed cleanly to your cost center.", chips: ["Stations", "Billing"] },
    ],
    []
  );

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<Tier>(2);
  const [whyOpen, setWhyOpen] = useState(false);

  const upgradePath = useMemo(() => {
    if (tier >= 3) return { ready: false, msg: "You already have the highest tier." };
    if (kycStatus === "Verified") return { ready: true, msg: "You can upgrade now." };
    return { ready: true, msg: "Complete verification steps to unlock Tier upgrade." };
  }, [tier, kycStatus]);

  const doUpgrade = () => {
    if (targetTier <= tier) {
      toast({ kind: "warn", title: "Select a higher tier" });
      return;
    }
    setTier(targetTier);
    setKycStatus("Verified");
    setUpgradeOpen(false);
    toast({ kind: "success", title: "Tier upgraded", message: `Now on ${targetTier}` });
  };

  const tierTone = tier >= 2 ? "good" : tier === 1 ? "warn" : "neutral";

  const onOrgAction = (id: string) => {
    const map: Record<string, { title: string; msg: string }> = {
      payment: { title: "Payment methods", msg: "Open Payment Method Selector (deep link)." },
      policies: { title: "Policies", msg: "Open policy explanation (deep link)." },
      requests: { title: "Requests", msg: "Open requests and exceptions (deep link)." },
      exception: { title: "Request exception", msg: "Open exception request workflow." },
      orgfunding: { title: "Funding", msg: "Open org funding request workflow." },
    };
    toast({ kind: "info", title: map[id]?.title || "Action", message: map[id]?.msg || "" });
  };

  const onAltOpen = (a: Alt) => {
    toast({ kind: "info", title: "Alternative", message: `${a.module}: ${a.title}` });
  };

  const onPersonalAction = (id: string) => {
    const map: Record<string, { title: string; msg: string }> = {
      wallet: { title: "Wallet", msg: "Go back to Wallet Home." },
      tx: { title: "Transactions", msg: "Open Transactions & Receipts." },
      verification: { title: "Verification", msg: "Open Verification Center." },
      beneficiaries: { title: "Beneficiaries", msg: "Open Beneficiaries & Payout Methods." },
    };
    toast({ kind: "info", title: map[id]?.title || "Action", message: map[id]?.msg || "" });
  };

  const kycBanner = kycStatus !== "Verified" && view === "Personal";

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Org enforcement banner (sticky) */}
      {view === "Organization" && blockedOrg ? (
        <div className={cn("sticky top-0 z-30 border-b px-4 py-2 text-xs", currentOrgBudget.enforcement === "Billing non-compliance" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {currentOrgBudget.enforcement === "Deposit depleted" ? "Organization wallet is paused due to deposit depletion." : currentOrgBudget.enforcement === "Billing non-compliance" ? "Organization wallet is paused due to billing non-compliance." : "Organization wallet is paused due to credit exceeded."}
            </div>
            <button className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold hover:bg-white" onClick={() => setWhyOpen(true)}>Why</button>
          </div>
        </div>
      ) : null}

      {/* Personal KYC banner */}
      {view === "Personal" && kycBanner ? (
        <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" /> KYC is {kycStatus.toLowerCase()}. Some limits are reduced until verification completes.
            </div>
            <button className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold hover:bg-white" onClick={() => onPersonalAction("verification")}>Continue</button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Limits, Funding Status & Verification</div>
                  <div className="mt-1 text-xs text-slate-500">Personal limits plus corporate budget visibility and enforcement reasons</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`View: ${view}`} tone="info" />
                    {view === "Personal" ? (
                      <>
                        <Pill label={tierInfo.name} tone={tierTone} />
                        <Pill label={`KYC: ${kycStatus}`} tone={kycStatus === "Verified" ? "good" : kycStatus === "Rejected" ? "bad" : "warn"} />
                        <Pill label={`Currency: ${selectedCurrency}`} tone="neutral" />
                      </>
                    ) : (
                      <>
                        <Pill label={`Org: ${currentOrgBudget.orgName}`} tone="neutral" />
                        <Pill label={`Role: ${currentOrgBudget.role}`} tone={currentOrgBudget.role === "Finance" ? "info" : "neutral"} />
                        <Pill label={`Group: ${currentOrgBudget.groupName}`} tone="neutral" />
                        <Pill label={`Cost center: ${currentOrgBudget.costCenter}`} tone="neutral" />
                        <Pill label={`Program: ${currentOrgBudget.enforcement}`} tone={toneForEnforcement(currentOrgBudget.enforcement)} />
                        <Pill label={`Budget: ${currentOrgBudget.budgetHealth}`} tone={toneForHealth(currentOrgBudget.budgetHealth)} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                  <SegButton active={view === "Personal"} label="Personal" onClick={() => setView("Personal")} />
                  <SegButton active={view === "Organization"} label="Organization" onClick={() => setView("Organization")} />
                </div>

                {view === "Organization" && (
                  <div className="min-w-[220px]">
                    <Select
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      options={orgBudgets.map((o) => ({ label: o.orgName, value: o.orgId }))}
                    />
                  </div>
                )}

                <Button variant="outline" onClick={() => (view === "Personal" ? onPersonalAction("wallet") : onOrgAction("payment"))}>
                  <ChevronRight className="h-4 w-4" /> {view === "Personal" ? "Wallet" : "Payment"}
                </Button>
                <Button variant="outline" onClick={() => (view === "Personal" ? onPersonalAction("tx") : onOrgAction("requests"))}>
                  <ChevronRight className="h-4 w-4" /> {view === "Personal" ? "Transactions" : "Requests"}
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "success", title: "Refreshed" })}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
                <Button variant="primary" onClick={() => setUpgradeOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Upgrade
                </Button>
              </div>
            </div>

            {view === "Organization" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(["Caps", "Funding", "Premium", "Alternatives"] as OrgTab[]).map((t) => (
                  <SegButton key={t} active={orgTab === t} label={t} onClick={() => setOrgTab(t)} />
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {view === "Personal" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <SectionCard title="Personal wallet tier" subtitle="KYC status, tier level, and upgrade path" right={<Pill label={tierInfo.name} tone={tierTone} />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Current tier</div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{tierInfo.name}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-500">KYC status</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{kycStatus}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="primary" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
                          <Button variant="outline" onClick={() => onPersonalAction("verification")}>Verification</Button>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Benefits</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {tierInfo.benefits.map((b) => (
                            <li key={b} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={cn("rounded-3xl border p-4", kycStatus === "Verified" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                        <div className="flex items-start gap-3">
                          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", kycStatus === "Verified" ? "bg-white text-emerald-700" : "bg-white text-amber-800")}>
                            {kycStatus === "Verified" ? <BadgeCheck className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Upgrade path</div>
                            <ul className="mt-3 space-y-2 text-sm text-slate-800">
                              {tierInfo.next.map((n) => (
                                <li key={n} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
                                  {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Limits by rail"
                    subtitle="Deposit, withdraw, and transfer limits"
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-[130px]">
                          <Select
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                            options={["UGX", "USD", "CNY", "KES"].map(c => ({ label: c, value: c }))}
                          />
                        </div>
                        <div className="min-w-[130px]">
                          <Select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            options={["ALL", "Deposit", "Withdraw", "Transfer"].map(t => ({ label: t, value: t }))}
                          />
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      {shownLimits.map((l, idx) => {
                        const ratio = l.limit <= 0 ? 0 : l.used / l.limit;
                        const warn = ratio >= 0.85;
                        return (
                          <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{l.type}</div>
                                  <Pill label={l.rail} tone="neutral" />
                                  <Pill label={l.window} tone="neutral" />
                                  <Pill label={l.currency} tone="neutral" />
                                  {warn ? <Pill label="Near limit" tone="warn" /> : <Pill label="OK" tone="good" />}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{l.note}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-slate-900">
                                  {formatMoney(l.used, l.currency)} of {formatMoney(l.limit, l.currency)}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Used</div>
                              </div>
                            </div>
                            <TinyBar value={l.used} max={l.limit} />
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <SectionCard title="Enforcement states" subtitle="Personal risk holds" right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {personalEnforcement.map((e) => {
                        const tone = e.severity === "Blocked" ? "bad" : e.severity === "Warning" ? "warn" : "info";
                        return (
                          <div key={e.flag} className={cn("rounded-3xl border p-4", tone === "bad" ? "border-rose-200 bg-rose-50" : tone === "warn" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50")}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">{e.title}</div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <Pill label={e.flag} tone={tone} />
                                  <Pill label={e.severity} tone={tone} />
                                </div>
                                <div className="mt-2 text-sm text-slate-800">{e.detail}</div>
                              </div>
                              <div className={cn("flex-shrink-0 grid h-10 w-10 place-items-center rounded-2xl bg-white", tone === "bad" ? "text-rose-700" : tone === "warn" ? "text-amber-800" : "text-blue-700")}>
                                {tone === "bad" ? <Lock className="h-5 w-5" /> : tone === "warn" ? <ShieldAlert className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Premium transparency</div>
                        <div className="mt-1 text-sm text-slate-600">Clear limits and enforcement reasons reduce failed payments.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Organization View */
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  {orgTab === "Caps" && (
                    <SectionCard title="Corporate caps" subtitle="Daily, weekly, and monthly caps" right={<Pill label={currentOrgBudget.enforcement} tone={toneForEnforcement(currentOrgBudget.enforcement)} />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <ProgressRing value={pct(currentOrgBudget.caps.daily.usedUGX, currentOrgBudget.caps.daily.limitUGX)} label="Daily" sub={currentOrgBudget.caps.daily.limitUGX ? `${formatUGX(currentOrgBudget.caps.daily.limitUGX - currentOrgBudget.caps.daily.usedUGX)} remaining` : "No cap"} tone={toneForHealth(currentOrgBudget.budgetHealth)} />
                        <ProgressRing value={pct(currentOrgBudget.caps.weekly.usedUGX, currentOrgBudget.caps.weekly.limitUGX)} label="Weekly" sub={currentOrgBudget.caps.weekly.limitUGX ? `${formatUGX(currentOrgBudget.caps.weekly.limitUGX - currentOrgBudget.caps.weekly.usedUGX)} remaining` : "No cap"} tone={toneForHealth(currentOrgBudget.budgetHealth)} />
                        <ProgressRing value={pct(currentOrgBudget.caps.monthly.usedUGX, currentOrgBudget.caps.monthly.limitUGX)} label="Monthly" sub={currentOrgBudget.caps.monthly.limitUGX ? `${formatUGX(currentOrgBudget.caps.monthly.limitUGX - currentOrgBudget.caps.monthly.usedUGX)} remaining` : "No cap"} tone={toneForHealth(currentOrgBudget.budgetHealth)} />
                      </div>
                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="font-semibold text-slate-900">Context: {currentOrgBudget.groupName} - {currentOrgBudget.costCenter}</div>
                        <div className="mt-2 text-sm text-slate-700">
                          {currentOrgBudget.budgetHealth === "Healthy" ? "Budget available. CorporatePay is likely to proceed without extra checks." : currentOrgBudget.budgetHealth === "Near limit" ? "Budget is near limit. Expect more approvals." : "Budget is blocked. CorporatePay may fail."}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {orgTab === "Funding" && (
                    <SectionCard title="Funding model status" subtitle="Core organizational funding status" right={<Pill label="Core" tone="neutral" />}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FundingCard title="Wallet PAYG" icon={<Wallet className="h-5 w-5" />} status={currentOrgBudget.funding.wallet.status} lines={[`Status: ${currentOrgBudget.funding.wallet.balanceMasked}`, currentOrgBudget.funding.wallet.note]} />
                        <FundingCard title="Credit Line" icon={<CreditCard className="h-5 w-5" />} status={currentOrgBudget.funding.credit.status} lines={[`Limit: ${currentOrgBudget.funding.credit.limitMasked}`, currentOrgBudget.funding.credit.note]} />
                        <FundingCard title="Prepaid" icon={<CircleDollarSign className="h-5 w-5" />} status={currentOrgBudget.funding.prepaid.status} lines={[`Runway: ${currentOrgBudget.funding.prepaid.runwayDays}d`, currentOrgBudget.funding.prepaid.note]} />
                      </div>
                    </SectionCard>
                  )}

                  {orgTab === "Premium" && (
                    <SectionCard title="Predictive warnings" subtitle="Forecast month-to-date usage" right={<Pill label="Premium" tone="info" />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <StatTiny title="Avg daily spend" value={formatUGX(avgDailySpend)} icon={<Activity className="h-4 w-4" />} />
                        <StatTiny title="Forecast month-end" value={formatUGX(forecastMonthEnd)} icon={<BarChart3 className="h-4 w-4" />} />
                        <StatTiny title="Days to cap" value={`${daysToCap} day(s)`} icon={<Timer className="h-4 w-4" />} />
                      </div>
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Adjust Model</div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Day of Month" type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} />
                          <Input label="Month Days" type="number" value={monthDays} onChange={(e) => setMonthDays(Number(e.target.value))} />
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {orgTab === "Alternatives" && (
                    <SectionCard title="Budget-safe alternatives" subtitle="Suggestions to reduce declines" right={<Pill label="Premium" tone="info" />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {alternatives.map((a) => <AltCard key={a.id} alt={a} onOpen={onAltOpen} />)}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <PatternCard icon={<Route className="h-4 w-4" />} title="Standard" desc="Prefer Standard rides" />
                        <PatternCard icon={<Package className="h-4 w-4" />} title="Vendors" desc="Use approved sellers" />
                        <PatternCard icon={<MapPin className="h-4 w-4" />} title="Zones" desc="Stay within allowed zones" />
                      </div>
                    </SectionCard>
                  )}
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <SectionCard title="Org summary" subtitle="Audit context" right={<Pill label={currentOrgBudget.role} tone="info" />}>
                    <div className="text-sm font-semibold text-slate-900">{currentOrgBudget.orgName}</div>
                    <div className="mt-1 text-xs text-slate-500">Group {currentOrgBudget.groupName} • CC {currentOrgBudget.costCenter}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill label={currentOrgBudget.enforcement} tone={toneForEnforcement(currentOrgBudget.enforcement)} />
                      <Pill label={currentOrgBudget.budgetHealth} tone={toneForHealth(currentOrgBudget.budgetHealth)} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => onOrgAction("requests")}>Requests</Button>
                      <Button variant="outline" onClick={() => setWhyOpen(true)}>Why</Button>
                      <Button variant={blockedOrg ? "outline" : "primary"} disabled={blockedOrg} onClick={() => onOrgAction("payment")}>Pay</Button>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={whyOpen} title="Why paused" subtitle="Policy & Enforcement details" onClose={() => setWhyOpen(false)} footer={<Button variant="primary" onClick={() => setWhyOpen(false)}>Close</Button>}>
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200">
            <div className="font-semibold text-slate-900">{currentOrgBudget.enforcement}</div>
            <div className="mt-2 text-sm text-slate-700">Audit {currentOrgBudget.auditRef.policyId} • {timeAgo(currentOrgBudget.auditRef.lastCheckedAt)}</div>
          </div>
        </div>
      </Modal>

      <Modal open={upgradeOpen} title="Upgrade Tier" subtitle="Unlock higher limits" onClose={() => setUpgradeOpen(false)} footer={<Button variant="primary" onClick={doUpgrade}>Upgrade</Button>}>
        <div className="space-y-4">
          <Select label="Target Tier" value={String(targetTier)} onChange={(e) => setTargetTier(Number(e.target.value) as Tier)} options={["1", "2", "3"].map(t => ({ label: `Tier ${t}`, value: t }))} />
          <div className="text-sm text-slate-600">{upgradePath.msg}</div>
        </div>
      </Modal>
    </div>
  );
}
