import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Flag,
  Globe,
  Info,
  Layers,
  MessageSquare,
  Printer,
  Receipt,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Timer,
  Truck,
  Tv,
  Video,
  Wallet as WalletIcon,
  Wrench,
  Zap,
  X,
} from "lucide-react";

import { cn, uid } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/ToastStack";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Currency = "UGX" | "USD" | "CNY" | "KES";
type TxStatus = "Completed" | "Pending" | "Failed" | "Reversed" | "Disputed";
type TxType = "Deposit" | "Withdrawal" | "Payment" | "Refund" | "FX" | "Transfer" | "Settlement" | "Chargeback";
type MethodKey = "Wallet" | "Card" | "Bank Transfer" | "Mobile Money" | "WeChat Pay" | "Alipay" | "UnionPay" | "China Settlement" | "Other";
type ModuleKey = "CorporatePay" | "E-Commerce" | "EV Charging" | "Rides & Logistics" | "Services" | "Shoppable Adz" | "Creator" | "Wallet";
type DateRange = "7D" | "30D" | "90D" | "YTD";
type Severity = "Info" | "Warning" | "Critical";
type ExportFormat = "CSV" | "Statement PDF" | "Forensics ZIP";

type WalletContext = {
  id: string;
  label: string;
  type: "Personal" | "Organization";
  role?: string;
};

type PolicyDecision = {
  id: string;
  label: string; // e.g. "Spending limit"
  value: string; // e.g. "Approved (UGX 50k < 500k)"
  impact: "Approval" | "Rejection" | "Flag" | "Blocked";
  ref?: { policyId: string; eventId?: string };
};

type LineItem = {
  label: string;
  qty?: number;
  unitPrice?: number;
  total: number;
  kind: "charge" | "tax" | "fee";
};

type ApprovalStep = {
  who: string;
  role: string;
  decision: "Approved" | "Rejected" | "Pending";
  when?: string;
};

type DisputeInfo = {
  status: "None" | "Open" | "Resolved" | "Rejected";
  id?: string;
  openedAt?: string;
  lastUpdate?: string;
};

type EnforcementSignal = {
  flag: "Limit" | "Fraud" | "Velocity" | "Geo";
  reason: string;
};

type Tx = {
  id: string;
  createdAtISO: string;
  title: string;
  counterparty: string;
  module: ModuleKey; // The product module that generated this
  contextId: string; // personal or org_id
  type: TxType;
  status: TxStatus;
  method: MethodKey;
  currency: Currency;
  amount: number; // + for credit, - for debit
  fees: number;
  taxes: number;
  fxRate?: number;
  fxSpreadPct?: number;

  // Refs
  ledgerRef: string;
  internalRef: string;
  providerRef?: string;

  // Rich data
  tags?: Record<string, string | undefined>; // e.g. { "project": "Site A", "costCenter": "marketing" }
  lineItems: LineItem[];
  policyDecisions?: PolicyDecision[];
  approvals?: ApprovalStep[];
  dispute: DisputeInfo;
  enforcement?: EnforcementSignal;

  // Audit
  auditWhy?: string; // Explainable reason for state
  hasDispute?: boolean; // quick flag
};

type ActivityEvent = {
  id: string;
  tsISO: string;
  module: string;
  contextId: string;
  title: string;
  message: string;
  severity: Severity;
  actionLabel?: string;
  actionUrl?: string;
  txId?: string; // link to receipt
};

type Filters = {
  q: string;
  contextId: string;
  type: "ALL" | TxType;
  status: "ALL" | TxStatus;
  module: "ALL" | ModuleKey;
  method: "ALL" | MethodKey;
  currency: "ALL" | Currency;
  dateRange: DateRange;
  disputeOnly: boolean;
};

type ActivityFilters = {
  q: string;
  contextId: string;
  module: "ALL" | ModuleKey;
  severity: "ALL" | Severity;
  dateRange: DateRange;
};

type SavedView = {
  id: string;
  name: string;
  description: string;
  filters: Partial<Filters>;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type DisputeDraft = {
  txId: string;
  issueType: "Unauthorized transaction" | "Wrong amount" | "Payout not received" | "Refund request" | "Other";
  message: string;
  attachmentName: string;
  channel: "In-app" | "Email" | "WhatsApp" | "WeChat";
};

// Utils
// Local utility functions (kept if not in @/lib/utils)

function formatMoney(amount: number, currency: string) {
  const v = Math.abs(amount);
  const s = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${s}`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function parseISO(s: string) {
  return new Date(s).getTime();
}

function toneForTxStatus(s: TxStatus) {
  if (s === "Completed") return "good" as const;
  if (s === "Pending") return "warn" as const;
  if (s === "Failed") return "bad" as const;
  if (s === "Reversed") return "info" as const;
  if (s === "Disputed") return "warn" as const;
  return "neutral" as const;
}

function toneForDecision(i: PolicyDecision["impact"]) {
  if (i === "Approval") return "good" as const;
  if (i === "Rejection" || i === "Blocked") return "bad" as const;
  if (i === "Flag") return "warn" as const;
  return "neutral" as const;
}

function toneForDispute(s: DisputeInfo["status"]) {
  if (s === "Open") return "warn" as const;
  if (s === "Resolved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  return "neutral" as const;
}

function toneForSeverity(s: Severity) {
  if (s === "Info") return "good" as const;
  if (s === "Warning") return "warn" as const;
  if (s === "Critical") return "bad" as const;
  return "neutral" as const;
}

function methodBadge(m: MethodKey): { label?: string; tone: "info" | "neutral" | "good" | "warn" } {
  if (m === "WeChat Pay" || m === "Alipay" || m === "UnionPay") return { label: "China Rails", tone: "info" };
  if (m === "China Settlement") return { label: "CN Settlement", tone: "good" };
  return { tone: "neutral" };
}

function iconForModule(m: string) {
  switch (m) {
    case "CorporatePay":
      return <Briefcase className="h-4 w-4" />;
    case "E-Commerce":
      return <Tag className="h-4 w-4" />;
    case "EV Charging":
      return <Zap className="h-4 w-4" />;
    case "Rides & Logistics":
      return <Truck className="h-4 w-4" />;
    case "Services":
      return <Wrench className="h-4 w-4" />;
    case "Shoppable Adz":
      return <Tv className="h-4 w-4" />;
    case "Creator":
      return <Video className="h-4 w-4" />;
    default:
      return <Layers className="h-4 w-4" />;
  }
}

// Local UI components removed (using @/components/ui)

function SegButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-semibold transition",
        active ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {label}
    </button>
  );
}

// Local ToastStack removed

// Local Modal removed

function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
                <div>
                  <div className="text-xl font-bold tracking-tight text-slate-900">{title}</div>
                  {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
                </div>
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50 px-6 py-6">{children}</div>
              {footer ? <div className="border-t border-slate-200 bg-white px-6 py-4">{footer}</div> : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function TagChips({ tags }: { tags?: Record<string, string | undefined> }) {
  if (!tags || !Object.keys(tags).length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {Object.entries(tags).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
          <span className="text-slate-400">{k}:</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

function DecisionList({ decisions }: { decisions?: PolicyDecision[] }) {
  if (!decisions?.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {decisions.map((d) => (
        <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{d.label}</div>
              <div className="text-xs text-slate-500">{d.value}</div>
            </div>
            <Pill label={d.impact} tone={toneForDecision(d.impact)} />
          </div>
          {d.ref ? (
            <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              Policy {d.ref.policyId}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------------------------------------
   MAIN COMPONENT
   ----------------------------------------------------------------------------------------------- */
export default function ReceiptsListW10() {
  const [tab, setTab] = useState<"transactions" | "activity">("transactions");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("t");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  };

  // Seed contexts
  const contexts: WalletContext[] = [
    { id: "personal", label: "Personal Wallet", type: "Personal" },
    { id: "org_acme", label: "Acme Group Ltd", type: "Organization", role: "Approver" },
    { id: "org_khl", label: "Kampala Holdings", type: "Organization", role: "Member" },
  ];

  // Seed transactions
  const seedTxs = useMemo<Tx[]>(
    () => [
      {
        id: "TX-9001",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        title: "Car maintenance",
        counterparty: "Spark Auto Garage",
        module: "Services",
        contextId: "personal",
        type: "Payment",
        status: "Completed",
        method: "Mobile Money",
        currency: "UGX",
        amount: -150000,
        fees: 2500,
        taxes: 0,
        ledgerRef: "LED-33219001",
        internalRef: "EVZ-INT-9001",
        providerRef: "MM-8822100",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Full service", total: 120000, kind: "charge" }, { label: "Oil filter", total: 30000, kind: "charge" }],
        auditWhy: "User authorized via PIN",
        tags: { vehicle: "UBB 123A", mileage: "12000km" },
        policyDecisions: [],
      },
      {
        id: "TX-9002",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        title: "Product sales",
        counterparty: "Various customers",
        module: "Shoppable Adz",
        contextId: "personal",
        type: "Settlement",
        status: "Pending",
        method: "Wallet",
        currency: "UGX",
        amount: 450000,
        fees: 4500,
        taxes: 0,
        ledgerRef: "LED-33219002",
        internalRef: "EVZ-INT-9002",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Ad campaign revenue", total: 450000, kind: "charge" }],
        auditWhy: "Aggregated settlement pending clearance",
        tags: { campaign: "Summer Sale 2025" },
      },
      {
        id: "TX-9003",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
        title: "Debit card top-up",
        counterparty: "Visa •••• 4242",
        module: "Wallet",
        contextId: "personal",
        type: "Deposit",
        status: "Completed",
        method: "Card",
        currency: "USD",
        amount: 200,
        fees: 5.2,
        taxes: 0,
        fxRate: 3750,
        fxSpreadPct: 1.2,
        ledgerRef: "LED-33219003",
        internalRef: "EVZ-INT-9003",
        providerRef: "STR-112200",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Wallet funding", total: 200, kind: "charge" }],
        auditWhy: "3DSecure passed",
        policyDecisions: [{ id: "PD-101", label: "Fraud check", value: "Low risk score", impact: "Approval", ref: { policyId: "POL-SEC" } }],
      },
      {
        id: "TX-9004",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        title: "Supplier payment",
        counterparty: "Shenzhen Electronics",
        module: "CorporatePay",
        contextId: "org_acme",
        type: "Payment",
        status: "Completed",
        method: "WeChat Pay",
        currency: "CNY",
        amount: -3500,
        fees: 35,
        taxes: 0,
        fxRate: 520,
        ledgerRef: "LED-33219004",
        internalRef: "EVZ-INT-9004",
        providerRef: "WX-998822",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Batch components", total: 3500, kind: "charge" }],
        auditWhy: "Approved by Finance Manager",
        tags: { costCenter: "Hardware", project: "Proto V2" },
        approvals: [
          { who: "System", role: "Policy Engine", decision: "Approved", when: "4h ago" },
          { who: "Sarah M.", role: "Finance Approver", decision: "Approved", when: "4h ago" },
        ],
        policyDecisions: [
          { id: "PD-102", label: "Intl Transfer", value: "CNY allowed", impact: "Approval", ref: { policyId: "POL-CNY" } },
          { id: "PD-103", label: "Spend limit", value: "3500 < 5000 CNY", impact: "Approval", ref: { policyId: "POL-LIM" } },
        ],
      },
      {
        id: "TX-9005",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 410).toISOString(),
        title: "Refund to bank",
        counterparty: "Stanbic Bank",
        module: "Wallet",
        contextId: "personal",
        type: "Withdrawal",
        status: "Failed",
        method: "Bank Transfer",
        currency: "UGX",
        amount: -500000,
        fees: 0,
        taxes: 0,
        ledgerRef: "LED-33219005",
        internalRef: "EVZ-INT-9005",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Withdrawal", total: 500000, kind: "charge" }],
        auditWhy: "Bank rejected: Name mismatch",
        enforcement: { flag: "Fraud", reason: "Beneficiary name mismatch" },
        policyDecisions: [
          { id: "PD-104", label: "Name Match", value: "Match failed", impact: "Blocked", ref: { policyId: "POL-KYC" } },
        ],
      },
      {
        id: "TX-9006",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 610).toISOString(),
        title: "Team lunch",
        counterparty: "Cafe Javas",
        module: "CorporatePay",
        contextId: "org_acme",
        type: "Payment",
        status: "Pending",
        method: "Mobile Money",
        currency: "UGX",
        amount: -250000,
        fees: 1000,
        taxes: 0,
        ledgerRef: "LED-33219006",
        internalRef: "EVZ-INT-9006",
        providerRef: "MM-PENDING",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Catering", total: 250000, kind: "charge" }],
        auditWhy: "Pending approval from High Value Approver",
        tags: { costCenter: "HR", event: "Team Building" },
        approvals: [
          { who: "System", role: "Policy Engine", decision: "Approved", when: "10h ago" },
          { who: "Pending", role: "Manager", decision: "Pending" },
        ],
        policyDecisions: [
          { id: "PD-105", label: "Merchant Category", value: "Food & Dining allowed", impact: "Approval", ref: { policyId: "POL-MCC" } },
          { id: "PD-106", label: "Threshold", value: "> 200k requires approval", impact: "Flag", ref: { policyId: "POL-THR" } },
        ],
      },
      {
        id: "TX-9007",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 950).toISOString(),
        title: "Monthly subscription",
        counterparty: "Adobe Creative Cloud",
        module: "E-Commerce",
        contextId: "personal",
        type: "Payment",
        status: "Completed",
        method: "Card",
        currency: "USD",
        amount: -54.99,
        fees: 0,
        taxes: 0,
        ledgerRef: "LED-33219007",
        internalRef: "EVZ-INT-9007",
        providerRef: "STR-SUB-991",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Creative Cloud All Apps", total: 54.99, kind: "charge" }],
        auditWhy: "Recurring subscription charged",
        tags: { type: "Subscription" },
      },
      {
        id: "TX-9008",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 980).toISOString(),
        title: "Refund",
        counterparty: "Marketplace order",
        module: "E-Commerce",
        contextId: "personal",
        type: "Refund",
        status: "Disputed",
        method: "Wallet",
        currency: "UGX",
        amount: 42000,
        fees: 0,
        taxes: 0,
        ledgerRef: "LED-33219008",
        internalRef: "EVZ-INT-9008",
        providerRef: "PRV-7008",
        hasDispute: true,
        dispute: { status: "Open", id: "DSP-2001", openedAt: "Yesterday", lastUpdate: "Awaiting evidence" },
        lineItems: [{ label: "Refund for returned item", qty: 1, total: 42000, kind: "charge" }],
        auditWhy: "Dispute opened by buyer. Awaiting evidence.",
        tags: { purpose: "Return" },
        policyDecisions: [
          { id: "PD-109", label: "Dispute", value: "Dispute is open. Evidence required", impact: "Approval", ref: { policyId: "POL-DSP", eventId: "EV-9008" } },
        ],
      },
      {
        id: "TX-9009",
        createdAtISO: new Date(Date.now() - 1000 * 60 * 1480).toISOString(),
        title: "Organization wallet blocked",
        counterparty: "CorporatePay",
        module: "CorporatePay",
        contextId: "org_khl",
        type: "Payment",
        status: "Failed",
        method: "Wallet",
        currency: "UGX",
        amount: -180000,
        fees: 0,
        taxes: 0,
        ledgerRef: "LED-33219009",
        internalRef: "EVZ-INT-9009",
        providerRef: "PRV-7009",
        hasDispute: false,
        dispute: { status: "None" },
        lineItems: [{ label: "Order attempt", qty: 1, total: 180000, kind: "charge" }],
        auditWhy: "Deposit depleted. Organization wallet is paused.",
        enforcement: { flag: "Limit", reason: "Deposit depleted" },
        tags: { purpose: "Travel procurement", costCenter: "TRV-02" },
        policyDecisions: [
          { id: "PD-110", label: "Funding", value: "Deposit depleted blocks CorporatePay payments", impact: "Blocked", ref: { policyId: "POL-FUND", eventId: "EV-9009" } },
        ],
      },
    ],
    []
  );

  const [txs, setTxs] = useState<Tx[]>(seedTxs);

  const seedEvents = useMemo<ActivityEvent[]>(
    () => [
      {
        id: "EV-1",
        tsISO: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        module: "Services",
        contextId: "personal",
        title: "Payment completed",
        message: "Service booking was paid successfully.",
        severity: "Info",
        txId: "TX-9001",
      },
      {
        id: "EV-2",
        tsISO: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        module: "Shoppable Adz",
        contextId: "personal",
        title: "Settlement pending",
        message: "Earnings settlement is pending in the next clearing batch.",
        severity: "Info",
        txId: "TX-9002",
      },
      {
        id: "EV-3",
        tsISO: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
        module: "Wallet",
        contextId: "personal",
        title: "Deposit posted",
        message: "Card top-up posted and is available.",
        severity: "Info",
        txId: "TX-9003",
      },
      {
        id: "EV-4",
        tsISO: new Date(Date.now() - 1000 * 60 * 410).toISOString(),
        module: "Wallet",
        contextId: "personal",
        title: "Withdrawal failed",
        message: "Bank withdrawal failed due to beneficiary name mismatch.",
        severity: "Warning",
        txId: "TX-9005",
      },
      {
        id: "EV-5",
        tsISO: new Date(Date.now() - 1000 * 60 * 610).toISOString(),
        module: "CorporatePay",
        contextId: "org_acme",
        title: "Approval required",
        message: "CorporatePay payment is pending approval (threshold rule).",
        severity: "Warning",
        txId: "TX-9006",
      },
      {
        id: "EV-6",
        tsISO: new Date(Date.now() - 1000 * 60 * 970).toISOString(),
        module: "E-Commerce",
        contextId: "personal",
        title: "Dispute opened",
        message: "Refund dispute is open and awaiting evidence.",
        severity: "Warning",
        txId: "TX-9008",
      },
      {
        id: "EV-7",
        tsISO: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
        module: "CorporatePay",
        contextId: "org_khl",
        title: "Corporate wallet blocked",
        message: "Deposit depleted. Organization wallet is paused.",
        severity: "Critical",
        txId: "TX-9009",
      },
    ],
    []
  );

  const [events, setEvents] = useState<ActivityEvent[]>(seedEvents);

  const defaultFilters: Filters = useMemo(
    () => ({
      q: "",
      contextId: "ALL",
      type: "ALL",
      status: "ALL",
      module: "ALL",
      method: "ALL",
      currency: "ALL",
      dateRange: "30D",
      disputeOnly: false,
    }),
    []
  );

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const defaultActivityFilters: ActivityFilters = useMemo(
    () => ({ q: "", contextId: "ALL", module: "ALL", severity: "ALL", dateRange: "30D" }),
    []
  );
  const [activityFilters, setActivityFilters] = useState<ActivityFilters>(defaultActivityFilters);

  const savedViewsSeed = useMemo<SavedView[]>(
    () => [
      { id: "SV-1", name: "My withdrawals", description: "All withdrawals across contexts", filters: { type: "Withdrawal", status: "ALL", contextId: "ALL" } },
      { id: "SV-2", name: "China rails", description: "WeChat Pay, Alipay, UnionPay", filters: { method: "WeChat Pay", currency: "CNY" } },
      { id: "SV-3", name: "Pending settlements", description: "Settlements still processing", filters: { type: "Settlement", status: "Pending" } },
      { id: "SV-4", name: "CorporatePay approvals", description: "Pending corporate approvals", filters: { module: "CorporatePay", status: "Pending" } },
    ],
    []
  );

  const [views, setViews] = useState<SavedView[]>(savedViewsSeed);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const applyView = (v: SavedView) => {
    setFilters((p) => ({ ...p, ...v.filters }));
    setActiveViewId(v.id);
    toast({ kind: "success", title: "View applied", message: v.name });
  };

  const clearView = () => {
    setActiveViewId(null);
    setFilters(defaultFilters);
    toast({ kind: "info", title: "Filters reset" });
  };

  const rangeMs = (r: DateRange) => {
    if (r === "7D") return 7 * 24 * 60 * 60 * 1000;
    if (r === "30D") return 30 * 24 * 60 * 60 * 1000;
    if (r === "90D") return 90 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1).getTime();
    return Date.now() - start;
  };

  const filteredTxs = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const now = Date.now();
    const since = now - rangeMs(filters.dateRange);

    return txs
      .filter((t) => parseISO(t.createdAtISO) >= since)
      .filter((t) => (filters.contextId === "ALL" ? true : t.contextId === filters.contextId))
      .filter((t) => (filters.type === "ALL" ? true : t.type === filters.type))
      .filter((t) => (filters.status === "ALL" ? true : t.status === filters.status))
      .filter((t) => (filters.module === "ALL" ? true : t.module === filters.module))
      .filter((t) => (filters.method === "ALL" ? true : t.method === filters.method))
      .filter((t) => (filters.currency === "ALL" ? true : t.currency === filters.currency))
      .filter((t) => (!filters.disputeOnly ? true : t.hasDispute || t.status === "Disputed" || t.dispute.status === "Open"))
      .filter((t) => {
        if (!q) return true;
        const blob = `${t.id} ${t.title} ${t.counterparty} ${t.module} ${t.method} ${t.currency} ${t.type} ${t.status} ${t.tags?.purpose ?? ""} ${t.tags?.costCenter ?? ""}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => parseISO(b.createdAtISO) - parseISO(a.createdAtISO));
  }, [txs, filters]);

  const filteredEvents = useMemo(() => {
    const q = activityFilters.q.trim().toLowerCase();
    const now = Date.now();
    const since = now - rangeMs(activityFilters.dateRange);

    return events
      .filter((e) => parseISO(e.tsISO) >= since)
      .filter((e) => (activityFilters.contextId === "ALL" ? true : e.contextId === activityFilters.contextId))
      .filter((e) => (activityFilters.module === "ALL" ? true : e.module === activityFilters.module))
      .filter((e) => (activityFilters.severity === "ALL" ? true : e.severity === activityFilters.severity))
      .filter((e) => {
        if (!q) return true;
        const blob = `${e.title} ${e.message} ${e.module} ${e.contextId} ${e.txId ?? ""}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => parseISO(b.tsISO) - parseISO(a.tsISO));
  }, [events, activityFilters]);

  const totals = useMemo(() => {
    const byCurrency: Record<string, { in: number; out: number; net: number }> = {};
    for (const t of filteredTxs) {
      const key = t.currency;
      if (!byCurrency[key]) byCurrency[key] = { in: 0, out: 0, net: 0 };
      if (t.amount >= 0) byCurrency[key].in += t.amount;
      else byCurrency[key].out += Math.abs(t.amount);
      byCurrency[key].net += t.amount;
    }
    return byCurrency;
  }, [filteredTxs]);

  const txStats = useMemo(() => {
    const pending = filteredTxs.filter((t) => t.status === "Pending").length;
    const failed = filteredTxs.filter((t) => t.status === "Failed").length;
    const disputed = filteredTxs.filter((t) => t.status === "Disputed" || t.dispute.status === "Open").length;
    return { pending, failed, disputed };
  }, [filteredTxs]);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("CSV");
  const [exportIncludeLedger, setExportIncludeLedger] = useState(true);
  const [exportIncludeReceipts, setExportIncludeReceipts] = useState(true);
  const [exportIncludePolicy, setExportIncludePolicy] = useState(true);
  const [exportIncludeTags, setExportIncludeTags] = useState(true);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("Saved view");

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<Tx | null>(null);

  const [showTags, setShowTags] = useState(true);
  const [showPolicy, setShowPolicy] = useState(true);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeDraft, setDisputeDraft] = useState<DisputeDraft>({
    txId: "",
    issueType: "Wrong amount",
    message: "",
    attachmentName: "",
    channel: "In-app",
  });

  const openTx = (t: Tx) => {
    setActiveTx(t);
    setDrawerOpen(true);
  };

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

  const createSavedView = () => {
    if (!saveName.trim()) {
      toast({ kind: "warn", title: "Name required" });
      return;
    }
    const v: SavedView = {
      id: uid("sv"),
      name: saveName.trim(),
      description: saveDesc.trim() || "Saved view",
      filters: { ...filters },
    };
    setViews((p) => [v, ...p]);
    setActiveViewId(v.id);
    setSaveOpen(false);
    toast({ kind: "success", title: "View saved", message: v.name });
  };

  const exportNow = () => {
    setExportOpen(false);
    toast({
      kind: "success",
      title: "Export started",
      message: `${exportFormat} • ${filters.dateRange} • ${filteredTxs.length} transactions`,
    });
  };

  const contextLabel = (id: string) => contexts.find((c) => c.id === id)?.label || id;

  const methods: MethodKey[] = ["Wallet", "Card", "Bank Transfer", "Mobile Money", "WeChat Pay", "Alipay", "UnionPay", "China Settlement", "Other"];
  const modules: ModuleKey[] = ["E-Commerce", "EV Charging", "Rides & Logistics", "Services", "CorporatePay", "Shoppable Adz", "Creator", "Wallet"];
  const types: TxType[] = ["Deposit", "Withdrawal", "Payment", "Refund", "FX", "Transfer", "Settlement", "Chargeback"];
  const statuses: TxStatus[] = ["Completed", "Pending", "Failed", "Reversed", "Disputed"];

  const submitDispute = () => {
    if (!disputeDraft.txId) {
      toast({ kind: "warn", title: "Missing transaction" });
      return;
    }
    if (!disputeDraft.message.trim()) {
      toast({ kind: "warn", title: "Message required" });
      return;
    }

    const dspId = `DSP-${Math.floor(2000 + Math.random() * 900)}`;

    setTxs((prev) =>
      prev.map((t) =>
        t.id === disputeDraft.txId
          ? {
            ...t,
            hasDispute: true,
            status: t.status === "Completed" ? "Disputed" : t.status,
            dispute: { status: "Open", id: dspId, openedAt: "Just now", lastUpdate: "Submitted" },
            policyDecisions: [
              ...(t.policyDecisions || []),
              {
                id: `PD-${Math.floor(300 + Math.random() * 900)}`,
                label: "Dispute opened",
                value: `Issue type: ${disputeDraft.issueType}`,
                impact: "Approval",
                ref: { policyId: "POL-DSP", eventId: dspId },
              },
            ],
          }
          : t
      )
    );

    setEvents((prev) => [
      {
        id: uid("EV"),
        tsISO: new Date().toISOString(),
        module: activeTx?.module || "Wallet",
        contextId: activeTx?.contextId || "personal",
        title: "Dispute submitted",
        message: `Dispute submitted via ${disputeDraft.channel}. ${disputeDraft.issueType}.`,
        severity: "Warning",
        txId: disputeDraft.txId,
      },
      ...prev,
    ]);

    setDisputeOpen(false);
    toast({ kind: "success", title: "Dispute submitted", message: dspId });
  };

  const openDisputeModal = (t: Tx) => {
    setDisputeDraft({ txId: t.id, issueType: "Wrong amount", message: "", attachmentName: "", channel: "In-app" });
    setDisputeOpen(true);
  };

  const refresh = () => {
    toast({ kind: "success", title: "Refreshed", message: "Latest transactions synced." });
  };

  const openLinkedTxFromEvent = (ev: ActivityEvent) => {
    if (!ev.txId) return;
    const t = txs.find((x) => x.id === ev.txId);
    if (!t) {
      toast({ kind: "warn", title: "Not found", message: "Transaction not found." });
      return;
    }
    setTab("transactions");
    openTx(t);
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Transactions & Receipts</div>
                  <div className="mt-1 text-xs text-slate-500">Receipt-grade details, activity feed, tags, policy reasons, and disputes</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Tab: ${tab === "transactions" ? "Transactions" : "Activity"}`} tone="info" />
                    <Pill label={`Range: ${tab === "transactions" ? filters.dateRange : activityFilters.dateRange}`} tone="neutral" />
                    <Pill label={filters.contextId === "ALL" ? "All wallets" : contextLabel(filters.contextId)} tone="neutral" />
                    <Pill label={filters.disputeOnly ? "Disputes only" : "All items"} tone={filters.disputeOnly ? "warn" : "neutral"} />
                    {activeViewId ? (
                      <Pill label={`View: ${views.find((v) => v.id === activeViewId)?.name ?? ""}`} tone="info" />
                    ) : (
                      <Pill label="No saved view" tone="neutral" />
                    )}
                    {txStats.pending ? <Pill label={`Pending ${txStats.pending}`} tone="warn" /> : null}
                    {txStats.failed ? <Pill label={`Failed ${txStats.failed}`} tone="warn" /> : null}
                    {txStats.disputed ? <Pill label={`Disputes ${txStats.disputed}`} tone="warn" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                  <SegButton active={tab === "transactions"} label="Transactions" onClick={() => setTab("transactions")} />
                  <SegButton active={tab === "activity"} label="Activity" onClick={() => setTab("activity")} />
                </div>

                <Button variant="outline" onClick={refresh}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>

                <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                  <Filter className="h-4 w-4" /> Filters
                </Button>
                <Button variant="outline" onClick={() => setExportOpen(true)}>
                  <ArrowDownToLine className="h-4 w-4" /> Export
                </Button>
                <Button variant="primary" onClick={() => setSaveOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Save view
                </Button>
              </div>
            </div>

            {/* Saved views */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {views.slice(0, 8).map((v) => (
                <Button key={v.id} variant={activeViewId === v.id ? "primary" : "outline"} className="px-3 py-2" onClick={() => applyView(v)} title={v.description}>
                  {v.name}
                </Button>
              ))}
              <Button variant="outline" className="px-3 py-2" onClick={clearView}>
                Reset
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="space-y-4 lg:col-span-8">
                {/* Transactions */}
                {tab === "transactions" ? (
                  <>
                    <Section
                      title="Search and quick filters"
                      subtitle="Unified filters plus optional tags and policy decision visibility"
                      right={<Pill label={`${filteredTxs.length} result(s)`} tone={filteredTxs.length ? "neutral" : "warn"} />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-5">
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                            <Search className="h-4 w-4 text-slate-500" />
                            <input
                              value={filters.q}
                              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                              placeholder="Search by id, counterparty, module, tags"
                              className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Select value={filters.contextId} onChange={(v) => setFilters((p) => ({ ...p, contextId: v }))} options={["ALL", ...contexts.map((c) => c.id)]} />
                        </div>

                        <div className="md:col-span-2">
                          <Select value={filters.type} onChange={(v) => setFilters((p) => ({ ...p, type: v as any }))} options={["ALL", ...types]} />
                        </div>

                        <div className="md:col-span-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {(["7D", "30D", "90D", "YTD"] as DateRange[]).map((r) => (
                              <Button key={r} variant={filters.dateRange === r ? "primary" : "outline"} className="px-3 py-2" onClick={() => setFilters((p) => ({ ...p, dateRange: r }))}>
                                {r}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="md:col-span-12">
                          <div className="flex flex-wrap items-center gap-2">
                            <Select value={filters.status} onChange={(v) => setFilters((p) => ({ ...p, status: v as any }))} options={["ALL", ...statuses]} />
                            <Select value={filters.module} onChange={(v) => setFilters((p) => ({ ...p, module: v as any }))} options={["ALL", ...modules]} />
                            <Select value={filters.method} onChange={(v) => setFilters((p) => ({ ...p, method: v as any }))} options={["ALL", ...methods]} />
                            <Select value={filters.currency} onChange={(v) => setFilters((p) => ({ ...p, currency: v as any }))} options={["ALL", "UGX", "USD", "CNY", "KES"]} />

                            <Button
                              variant={filters.disputeOnly ? "accent" : "outline"}
                              className="px-3 py-2"
                              onClick={() => setFilters((p) => ({ ...p, disputeOnly: !p.disputeOnly }))}
                              title="Show disputed items"
                            >
                              <Flag className="h-4 w-4" /> {filters.disputeOnly ? "Disputes" : "All"}
                            </Button>

                            <Button variant={showTags ? "primary" : "outline"} className="px-3 py-2" onClick={() => setShowTags((p) => !p)} title="Toggle tags">
                              <Tag className="h-4 w-4" /> Tags
                            </Button>

                            <Button variant={showPolicy ? "primary" : "outline"} className="px-3 py-2" onClick={() => setShowPolicy((p) => !p)} title="Toggle policy decisions">
                              <ShieldCheck className="h-4 w-4" /> Policy
                            </Button>

                            <Button variant="outline" className="px-3 py-2" onClick={() => setExportOpen(true)}>
                              <ArrowDownToLine className="h-4 w-4" /> Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Section>

                    <Section
                      title="Transaction list"
                      subtitle="Tap a row for receipt details, policy reasons, tags, and dispute workflows"
                      right={<Pill label={Object.keys(totals).length ? "Totals available" : ""} tone="neutral" />}
                    >
                      <div className="space-y-2">
                        {filteredTxs.map((t) => {
                          const badge = methodBadge(t.method);
                          return (
                            <button key={t.id} type="button" onClick={() => openTx(t)} className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                    <Pill label={t.status} tone={toneForTxStatus(t.status)} />
                                    <Pill label={t.type} tone="neutral" />
                                    <Pill label={t.module} tone="neutral" />
                                    <Pill label={contextLabel(t.contextId)} tone={t.contextId === "personal" ? "neutral" : "info"} />
                                    {badge.label ? <Pill label={badge.label} tone={badge.tone} /> : null}
                                    {t.dispute.status !== "None" ? <Pill label={`Dispute: ${t.dispute.status}`} tone={toneForDispute(t.dispute.status)} /> : null}
                                    {t.enforcement ? <Pill label={`${t.enforcement.flag}`} tone="warn" /> : null}
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">{t.counterparty}</div>
                                  <div className="mt-2 text-xs text-slate-500">{formatWhen(t.createdAtISO)} • {t.method} • {t.currency}</div>
                                  {showTags ? <TagChips tags={t.tags} /> : null}
                                  {showPolicy && t.policyDecisions?.length ? (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      {t.policyDecisions.slice(0, 2).map((d) => (
                                        <Pill key={d.id} label={`${d.label}: ${d.impact}`} tone={toneForDecision(d.impact)} />
                                      ))}
                                      {t.policyDecisions.length > 2 ? <Pill label={`+${t.policyDecisions.length - 2} more`} tone="neutral" /> : null}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="text-right">
                                  <div className={cn("text-sm font-semibold", t.amount >= 0 ? "text-emerald-700" : "text-slate-900")}>
                                    {formatMoney(t.amount, t.currency)}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">Fees {formatMoney(t.fees, t.currency)}</div>
                                </div>
                              </div>

                              {t.enforcement ? (
                                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    <div>
                                      <div className="font-semibold">Enforcement signal</div>
                                      <div className="mt-1 text-xs text-amber-800">{t.enforcement.flag}: {t.enforcement.reason}</div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {(t.dispute.status === "Open" || t.status === "Disputed") ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="accent"
                                    className="px-3 py-2"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openDisputeModal(t);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" /> Add evidence
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toast({ kind: "info", title: "Support", message: "This would open the dispute thread." });
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4" /> View thread
                                  </Button>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}

                        {!filteredTxs.length ? (
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No transactions match your filters.</div>
                        ) : null}
                      </div>
                    </Section>
                  </>
                ) : null}

                {/* Activity */}
                {tab === "activity" ? (
                  <>
                    <Section
                      title="Activity feed"
                      subtitle="Approvals, deposits, payouts, disputes, verification, and enforcement signals"
                      right={<Pill label={`${filteredEvents.length} event(s)`} tone={filteredEvents.length ? "neutral" : "warn"} />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                            <Search className="h-4 w-4 text-slate-500" />
                            <input
                              value={activityFilters.q}
                              onChange={(e) => setActivityFilters((p) => ({ ...p, q: e.target.value }))}
                              placeholder="Search activity"
                              className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Select value={activityFilters.contextId} onChange={(v) => setActivityFilters((p) => ({ ...p, contextId: v }))} options={["ALL", ...contexts.map((c) => c.id)]} />
                        </div>
                        <div className="md:col-span-2">
                          <Select value={activityFilters.module} onChange={(v) => setActivityFilters((p) => ({ ...p, module: v as any }))} options={["ALL", ...modules]} />
                        </div>
                        <div className="md:col-span-2">
                          <Select value={activityFilters.severity} onChange={(v) => setActivityFilters((p) => ({ ...p, severity: v as any }))} options={["ALL", "Info", "Warning", "Critical"]} />
                        </div>
                        <div className="md:col-span-12">
                          <div className="flex flex-wrap items-center gap-2">
                            {(["7D", "30D", "90D", "YTD"] as DateRange[]).map((r) => (
                              <Button key={r} variant={activityFilters.dateRange === r ? "primary" : "outline"} className="px-3 py-2" onClick={() => setActivityFilters((p) => ({ ...p, dateRange: r }))}>
                                {r}
                              </Button>
                            ))}
                            <Button variant="outline" className="px-3 py-2" onClick={() => setActivityFilters(defaultActivityFilters)}>
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {filteredEvents.map((e) => (
                          <div key={e.id} className={cn("rounded-3xl border p-4", e.severity === "Critical" ? "border-rose-200 bg-rose-50" : e.severity === "Warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50")}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                                    {iconForModule(e.module)}
                                    {e.module}
                                  </div>
                                  <Pill label={e.severity} tone={toneForSeverity(e.severity)} />
                                  <Pill label={contextLabel(e.contextId)} tone={e.contextId === "personal" ? "neutral" : "info"} />
                                  <Pill label={formatWhen(e.tsISO)} tone="neutral" />
                                  {e.txId ? <Pill label={e.txId} tone="neutral" /> : null}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{e.title}</div>
                                <div className="mt-1 text-sm text-slate-700">{e.message}</div>
                                <div className="mt-2 text-xs text-slate-500">{formatDateTime(e.tsISO)}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {e.txId ? (
                                  <Button variant="outline" onClick={() => openLinkedTxFromEvent(e)}>
                                    <ChevronRight className="h-4 w-4" /> Open receipt
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}

                        {!filteredEvents.length ? (
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No activity events match your filters.</div>
                        ) : null}
                      </div>
                    </Section>
                  </>
                ) : null}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 lg:col-span-4">
                {tab === "transactions" ? (
                  <>
                    <Section title="Totals" subtitle="Per currency totals for current results" right={<Pill label={filters.dateRange} tone="neutral" />}>
                      <div className="space-y-2">
                        {Object.keys(totals).length ? (
                          Object.entries(totals).map(([cur, v]) => (
                            <div key={cur} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{cur}</div>
                                    <Pill label="Net" tone="neutral" />
                                  </div>
                                  <div className="mt-2 text-xs text-slate-500">In {formatMoney(v.in, cur as Currency)}</div>
                                  <div className="mt-1 text-xs text-slate-500">Out {formatMoney(v.out, cur as Currency)}</div>
                                </div>
                                <div className="text-right">
                                  <div className={cn("text-sm font-semibold", v.net >= 0 ? "text-emerald-700" : "text-slate-900")}>
                                    {formatMoney(v.net, cur as Currency)}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">Net</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No totals for empty results.</div>
                        )}
                      </div>
                    </Section>

                    <Section title="Export center" subtitle="CSV, statement PDF, or forensics pack" right={<Pill label="Premium" tone="info" />}>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Export</div>
                            <div className="mt-1 text-sm text-slate-600">Choose format, range, and scope</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Pill label={`Format: ${exportFormat}`} tone="neutral" />
                              <Pill label={`Items: ${filteredTxs.length}`} tone={filteredTxs.length ? "good" : "neutral"} />
                            </div>
                          </div>
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <ArrowDownToLine className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => { setExportFormat("CSV"); setExportOpen(true); }}>
                            <ArrowDownToLine className="h-4 w-4" /> CSV
                          </Button>
                          <Button variant="outline" onClick={() => { setExportFormat("Statement PDF"); setExportOpen(true); }}>
                            <FileText className="h-4 w-4" /> Statement
                          </Button>
                          <Button variant="outline" onClick={() => { setExportFormat("Forensics ZIP"); setExportOpen(true); }}>
                            <ShieldCheck className="h-4 w-4" /> Forensics
                          </Button>
                          <Button variant="primary" onClick={() => setExportOpen(true)}>
                            <ChevronRight className="h-4 w-4" /> Open
                          </Button>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : (
                  <>
                    <Section title="Activity summary" subtitle="What changed recently" right={<Pill label={activityFilters.dateRange} tone="neutral" />}>
                      <div className="grid grid-cols-2 gap-2">
                        <KPI label="Events" value={String(filteredEvents.length)} tone="neutral" />
                        <KPI label="Warnings" value={String(filteredEvents.filter((e) => e.severity === "Warning").length)} tone="warn" />
                        <KPI label="Critical" value={String(filteredEvents.filter((e) => e.severity === "Critical").length)} tone="bad" />
                        <KPI label="Linked" value={String(filteredEvents.filter((e) => Boolean(e.txId)).length)} tone="info" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "This would export activity feed." })}>
                          <ChevronRight className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Notifications", message: "Open wallet notifications." })}>
                          <ChevronRight className="h-4 w-4" /> Notifications
                        </Button>
                      </div>
                    </Section>

                    <div
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      style={{
                        background:
                          "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Premium activity</div>
                          <div className="mt-1 text-xs text-slate-500">
                            You have 3 new premium insights available this week regarding your spending patterns.
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="ghost" className="h-auto p-0 text-xs text-slate-600 hover:text-slate-900">
                          View insights <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer: Transaction Details */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Transaction details"
        subtitle={activeTx?.id ?? ""}
        footer={
          <div className="flex w-full items-center gap-3">
            <Button className="w-full flex-1" onClick={() => toast({ kind: "info", title: "Wait", message: "Download logic placeholder." })}>
              <Download className="h-4 w-4" /> Receipt
            </Button>
            <Button
              variant="danger"
              className="w-full flex-1"
              onClick={() => {
                if (activeTx) openDisputeModal(activeTx);
              }}
              disabled={activeTx?.status === "Failed" || activeTx?.status === "Reversed"}
            >
              <AlertTriangle className="h-4 w-4" /> Report
            </Button>
          </div>
        }
      >
        {activeTx ? (
          <div className="space-y-6">
            {/* Amount Hero */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  activeTx.amount >= 0 ? "text-emerald-600" : "text-slate-900"
                )}
              >
                {formatMoney(activeTx.amount, activeTx.currency)}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-500">{activeTx.status}</div>
              <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500">
                <div>
                  <div className="mb-1 font-semibold text-slate-400">FEES</div>
                  {formatMoney(activeTx.fees, activeTx.currency)}
                </div>
                <div>
                  <div className="mb-1 font-semibold text-slate-400">TAXES</div>
                  {formatMoney(activeTx.taxes, activeTx.currency)}
                </div>
                <div>
                  <div className="mb-1 font-semibold text-slate-400">TOTAL</div>
                  {formatMoney(Math.abs(activeTx.amount) + activeTx.fees + activeTx.taxes, activeTx.currency)}
                </div>
              </div>
            </div>

            {/* Core Info */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-900">General Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Counterparty</span>
                  <span className="font-medium text-slate-900">{activeTx.counterparty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">{formatDateTime(activeTx.createdAtISO)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-slate-900">{activeTx.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900">{activeTx.providerRef || activeTx.internalRef}</span>
                    <button onClick={() => copyText(activeTx.providerRef || activeTx.internalRef)}>
                      <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Line Items</h3>
              <div className="space-y-3">
                {activeTx.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-500">{item.qty}x</span>
                      <span className="text-slate-700">{item.label}</span>
                    </div>
                    <span className="font-medium text-slate-900">{formatMoney(item.total, activeTx.currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enforcement / Policy */}
            {(activeTx.enforcement || activeTx.policyDecisions?.length) ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-900">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Compliance & Policy</h3>
                </div>

                {activeTx.enforcement ? (
                  <div className="mt-3 rounded-2xl bg-white/60 p-3 text-sm text-amber-900">
                    <div className="font-semibold">Enforcement Action</div>
                    <div>{activeTx.enforcement.flag}: {activeTx.enforcement.reason}</div>
                  </div>
                ) : null}

                <DecisionList decisions={activeTx.policyDecisions} />
              </div>
            ) : null}

            {/* Dispute Status */}
            {(activeTx.dispute.status !== "None" || activeTx.hasDispute) ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Dispute</h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-rose-800">Status</span>
                  <Pill label={activeTx.dispute.status} tone={toneForDispute(activeTx.dispute.status)} />
                </div>
                <div className="mt-2 text-sm text-rose-700">
                  ID: {activeTx.dispute.id} • Opened {activeTx.dispute.openedAt}
                </div>
              </div>
            ) : null}

            {/* Tags */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Tags & Metadata</h3>
                <Button variant="ghost" className="h-auto p-0 text-xs" onClick={() => toast({ kind: "info", title: "Tags", message: "Edit tags placeholder" })}>
                  Edit
                </Button>
              </div>
              <TagChips tags={activeTx.tags} />
              <div className="mt-4 text-xs text-slate-400">
                Ledger Ref: {activeTx.ledgerRef}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Export Modal */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Data"
        subtitle="Download receipts and reports"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={exportNow}>
              <Download className="h-4 w-4" /> Download {exportFormat}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm">
                {exportFormat === "CSV" ? <ArrowDownToLine className="h-5 w-5 text-slate-600" /> : null}
                {exportFormat === "Statement PDF" ? <FileText className="h-5 w-5 text-slate-600" /> : null}
                {exportFormat === "Forensics ZIP" ? <ShieldCheck className="h-5 w-5 text-slate-600" /> : null}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{exportFormat} Export</div>
                <div className="text-sm text-slate-500">
                  {filteredTxs.length} transactions selected from {filters.dateRange} range.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Include Ledger References</span>
              <input
                type="checkbox"
                checked={exportIncludeLedger}
                onChange={(e) => setExportIncludeLedger(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Include Receipt Attachments</span>
              <input
                type="checkbox"
                checked={exportIncludeReceipts}
                onChange={(e) => setExportIncludeReceipts(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Include Policy Decisions</span>
              <input
                type="checkbox"
                checked={exportIncludePolicy}
                onChange={(e) => setExportIncludePolicy(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Include User Tags</span>
              <input
                type="checkbox"
                checked={exportIncludeTags}
                onChange={(e) => setExportIncludeTags(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>
      </Modal>

      {/* Save View Modal */}
      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save View"
        subtitle="Create a quick shortcut for these filters"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createSavedView}>
              Save View
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">View Name</label>
            <Input value={saveName} onChange={setSaveName} placeholder="e.g. My withdrawals" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Description (Optional)</label>
            <Input value={saveDesc} onChange={setSaveDesc} placeholder="e.g. All withdrawals across contexts" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Filter className="h-3 w-3" />
              Current Filters to Save
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill label={`Range: ${filters.dateRange}`} tone="neutral" />
              {filters.contextId !== "ALL" ? <Pill label={`Context: ${contextLabel(filters.contextId)}`} tone="info" /> : null}
              {filters.type !== "ALL" ? <Pill label={`Type: ${filters.type}`} tone="neutral" /> : null}
              {filters.status !== "ALL" ? <Pill label={`Status: ${filters.status}`} tone="neutral" /> : null}
              {filters.module !== "ALL" ? <Pill label={`Module: ${filters.module}`} tone="neutral" /> : null}
              {filters.currency !== "ALL" ? <Pill label={`Currency: ${filters.currency}`} tone="neutral" /> : null}
            </div>
          </div>
        </div>
      </Modal>

      {/* Filter Modal (Mobile/Tablet) */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="All Filters"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setFilters(defaultFilters)}>
              Reset
            </Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>
              Show Results
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Date Range</label>
              <Select value={filters.dateRange} onChange={(v) => setFilters((p) => ({ ...p, dateRange: v as any }))} options={["7D", "30D", "90D", "YTD"]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Wallet Context</label>
              <Select value={filters.contextId} onChange={(v) => setFilters((p) => ({ ...p, contextId: v }))} options={["ALL", ...contexts.map((c) => c.id)]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
              <Select value={filters.status} onChange={(v) => setFilters((p) => ({ ...p, status: v as any }))} options={["ALL", ...statuses]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Transaction Type</label>
              <Select value={filters.type} onChange={(v) => setFilters((p) => ({ ...p, type: v as any }))} options={["ALL", ...types]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Product Module</label>
              <Select value={filters.module} onChange={(v) => setFilters((p) => ({ ...p, module: v as any }))} options={["ALL", ...modules]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Currency</label>
              <Select value={filters.currency} onChange={(v) => setFilters((p) => ({ ...p, currency: v as any }))} options={["ALL", "UGX", "USD", "CNY", "KES"]} />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.disputeOnly}
                onChange={(e) => setFilters((p) => ({ ...p, disputeOnly: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">Show disputes only</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="Open Dispute"
        subtitle="Submit a claim for this transaction"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDisputeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitDispute}>
              Submit Dispute
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-blue-700" />
              <div className="text-sm text-blue-800">
                Disputes are handled by the EVZone Fair Play Team. You will receive an update within 24 hours.
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Issue Type</label>
            <Select
              value={disputeDraft.issueType}
              onChange={(v) => setDisputeDraft((p) => ({ ...p, issueType: v as any }))}
              options={["Unauthorized transaction", "Wrong amount", "Payout not received", "Refund request", "Other"]}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Explanation</label>
            <textarea
              value={disputeDraft.message}
              onChange={(e) => setDisputeDraft((p) => ({ ...p, message: e.target.value }))}
              placeholder="Please describe the issue..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Preferred Channel</label>
            <Select
              value={disputeDraft.channel}
              onChange={(v) => setDisputeDraft((p) => ({ ...p, channel: v as any }))}
              options={["In-app", "Email", "WhatsApp", "WeChat"]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KPI({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const bg = tone === "good" ? "bg-emerald-50" : tone === "warn" ? "bg-amber-50" : tone === "bad" ? "bg-rose-50" : tone === "info" ? "bg-blue-50" : "bg-slate-50";
  const fg = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-800" : tone === "bad" ? "text-rose-700" : tone === "info" ? "text-blue-700" : "text-slate-700";
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg, fg)}>
          <BadgeCheck className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

