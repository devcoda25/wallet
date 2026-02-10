import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bolt,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  Flame,
  Info,
  Package,
  Percent,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Timer,
  Wallet,
  X,
} from "lucide-react";

import { cn, uid, formatUGX } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/ToastStack";
import { SectionCard as Section } from "@/components/ui/SectionCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { ActionCard } from "@/components/ui/ActionCard";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type PaymentMethod = "CorporatePay" | "Personal Wallet" | "Card" | "Mobile Money";

type CorporateState = "Available" | "Requires approval" | "Not available";

type HoldState = "None" | "Requested" | "Locked" | "Expired";

type DealTier = {
  minQty: number;
  maxQty?: number;
  unitPrice: number;
  label: string;
  badge?: string;
};

type Deal = {
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

type Receipt = {
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

// Local utility functions (kept if not in @/lib/utils)
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTimeLeft(ms: number) {
  const t = Math.max(0, ms);
  const s = Math.floor(t / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const hh = h % 24;
  const mm = m % 60;
  const ss = s % 60;
  if (d > 0) return `${d}d ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Local Pill removed

// Local Button removed

// Local ToastStack removed

// Local Modal removed

// Local components removed (using @/components/ui)

function tierForQty(tiers: DealTier[], qty: number) {
  const q = Math.max(1, qty);
  // find last tier where q >= minQty and (max undefined or q <= max)
  const matches = tiers.filter((t) => q >= t.minQty && (t.maxQty === undefined || q <= t.maxQty));
  if (matches.length) return matches[matches.length - 1];
  // fallback: highest minQty <= q
  const fallback = tiers.filter((t) => q >= t.minQty).sort((a, b) => a.minQty - b.minQty).pop();
  return fallback || tiers[0];
}

export default function UserMyLiveDealzDealCheckoutCorporatePay() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const deal = useMemo<Deal>(() => {
    const now = Date.now();
    return {
      id: "MLD-Deal-8891",
      title: "EV Fleet Charging Credits (Bulk Deal)",
      vendor: "EVzone MyLiveDealz Verified Seller",
      vendorBadge: "Preferred",
      category: "EVs & Charging",
      location: "Kampala, Uganda",
      endsAt: now + 18 * 60 * 1000, // 18 minutes
      stockTotal: 220,
      stockRemaining: 74,
      regularUnitPrice: 120000,
      tiers: [
        { minQty: 1, maxQty: 4, unitPrice: 110000, label: "Retail", badge: "Hot" },
        { minQty: 5, maxQty: 19, unitPrice: 104000, label: "Team", badge: "Save" },
        { minQty: 20, unitPrice: 98000, label: "Corporate", badge: "Best" },
      ],
      shippingUGX: 0,
      policy: { holdSupported: true, minHoldMinutes: 15, maxHoldMinutes: 180 },
    };
  }, []);

  // timer
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const msLeft = deal.endsAt - nowTick;
  const isExpired = msLeft <= 0;
  const lastMinute = msLeft > 0 && msLeft <= 60_000;

  const [qty, setQty] = useState<number>(5);

  // demo stock movement
  const [stockRemaining, setStockRemaining] = useState<number>(deal.stockRemaining);
  useEffect(() => {
    if (isExpired) return;
    // small random decrease every ~6s
    const t = window.setInterval(() => {
      setStockRemaining((s) => {
        if (s <= 1) return s;
        const dec = Math.random() < 0.35 ? 1 : 0;
        return Math.max(0, s - dec);
      });
    }, 6000);
    return () => window.clearInterval(t);
  }, [isExpired]);

  // Pricing
  const tier = useMemo(() => tierForQty(deal.tiers, qty), [deal.tiers, qty]);
  const effectiveUnitPrice = useMemo(() => {
    // If expired and no lock, use regular
    return tier.unitPrice;
  }, [tier.unitPrice]);

  // CorporatePay state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");
  const [corpLinked] = useState(true);
  const [corpEligible] = useState(true);
  const [corpFundingOk, setCorpFundingOk] = useState(true);

  const [costCenter, setCostCenter] = useState("CAPEX-01");
  const [purpose, setPurpose] = useState("Fleet operations");

  const approvalThresholdUGX = 300000; // demo

  // Hold and approval
  const [holdState, setHoldState] = useState<HoldState>("None");
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [approvalId, setApprovalId] = useState<string>("");
  const [approvalStatus, setApprovalStatus] = useState<"None" | "Pending" | "Approved" | "Rejected">("None");

  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const lineSubtotal = useMemo(() => {
    return Math.max(0, qty * effectiveUnitPrice);
  }, [qty, effectiveUnitPrice]);

  const total = useMemo(() => {
    return lineSubtotal + deal.shippingUGX;
  }, [lineSubtotal, deal.shippingUGX]);

  const corporateState = useMemo<CorporateState>(() => {
    if (paymentMethod !== "CorporatePay") return "Available";
    if (!corpLinked) return "Not available";
    if (!corpEligible) return "Not available";
    if (!corpFundingOk) return "Not available";
    if (total > approvalThresholdUGX) return "Requires approval";
    return "Available";
  }, [paymentMethod, corpLinked, corpEligible, corpFundingOk, total]);

  const corporateReason = useMemo(() => {
    if (paymentMethod !== "CorporatePay") return "";
    if (!corpLinked) return "Not linked";
    if (!corpEligible) return "Not eligible";
    if (!corpFundingOk) return "Funding issue";
    if (total > approvalThresholdUGX) return `Above ${formatUGX(approvalThresholdUGX)}`;
    return "";
  }, [paymentMethod, corpLinked, corpEligible, corpFundingOk, total]);

  // Determine if we can price-lock
  const holdSupported = deal.policy.holdSupported;
  const minHold = deal.policy.holdSupported ? deal.policy.minHoldMinutes : 0;
  const maxHold = deal.policy.holdSupported ? deal.policy.maxHoldMinutes : 0;

  const [requestHold, setRequestHold] = useState(true);
  const [requestedHoldMinutes, setRequestedHoldMinutes] = useState<number>(30);

  const canHold = useMemo(() => {
    if (!holdSupported) return { ok: false, reason: "Vendor does not support deal holds" };
    if (isExpired) return { ok: false, reason: "Deal already expired" };
    if (requestedHoldMinutes < minHold) return { ok: false, reason: `Minimum hold is ${minHold} minutes` };
    if (requestedHoldMinutes > maxHold) return { ok: false, reason: `Maximum hold is ${maxHold} minutes` };
    // If deal ends too soon to request hold, still allow a short lock
    return { ok: true, reason: "" };
  }, [holdSupported, isExpired, requestedHoldMinutes, minHold, maxHold]);

  const isLockedPrice = useMemo(() => {
    if (holdState !== "Locked") return false;
    if (!holdUntil) return false;
    return holdUntil > nowTick;
  }, [holdState, holdUntil, nowTick]);

  const effectiveUnitPriceWithExpiry = useMemo(() => {
    if (isExpired && !isLockedPrice) return deal.regularUnitPrice;
    return tier.unitPrice;
  }, [isExpired, isLockedPrice, deal.regularUnitPrice, tier.unitPrice]);

  const subtotalWithExpiry = useMemo(() => qty * effectiveUnitPriceWithExpiry, [qty, effectiveUnitPriceWithExpiry]);
  const totalWithExpiry = useMemo(() => subtotalWithExpiry + deal.shippingUGX, [subtotalWithExpiry, deal.shippingUGX]);

  // Update total used in corporate check
  const totalForPolicy = totalWithExpiry;

  const corporateState2 = useMemo<CorporateState>(() => {
    if (paymentMethod !== "CorporatePay") return "Available";
    if (!corpLinked || !corpEligible || !corpFundingOk) return "Not available";
    if (totalForPolicy > approvalThresholdUGX) return "Requires approval";
    return "Available";
  }, [paymentMethod, corpLinked, corpEligible, corpFundingOk, totalForPolicy]);

  const requiresApproval = paymentMethod === "CorporatePay" && corporateState2 === "Requires approval";

  const mustHaveCorporateFields = paymentMethod === "CorporatePay";
  const corporateFieldsOk = !mustHaveCorporateFields || (!!costCenter.trim() && !!purpose.trim());

  // Deal expiry hold/approval rules message
  const holdRuleMessage = useMemo(() => {
    if (!requiresApproval) return "Approval not required for this cart.";
    if (!holdSupported) return "This deal cannot be price-locked. Pay personally to secure the deal immediately.";
    if (isExpired) return "Deal expired. Corporate approval can proceed at regular pricing if vendor allows.";
    if (lastMinute) return "Deal is ending soon. If you need approval, request a price lock now or pay personally.";
    return "Request a price lock so the deal price remains valid while approval is pending.";
  }, [requiresApproval, holdSupported, isExpired, lastMinute]);

  // Modal
  const [approvalOpen, setApprovalOpen] = useState(false);

  const openApproval = () => {
    if (!corporateFieldsOk) {
      toast({ title: "Missing fields", message: "Set cost center and purpose for CorporatePay.", kind: "warn" });
      return;
    }
    setApprovalOpen(true);
  };

  const submitApproval = () => {
    const id = `APR-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setApprovalId(id);
    setApprovalStatus("Pending");

    // Hold logic
    if (requestHold && canHold.ok) {
      setHoldState("Requested");
      const lock = Math.min(
        deal.endsAt + 60 * 60 * 1000, // vendor may extend after expiry if locked
        Date.now() + requestedHoldMinutes * 60 * 1000
      );
      // Simulate immediate lock success
      setHoldUntil(lock);
      setHoldState("Locked");
      toast({ title: "Price locked", message: `Locked until ${fmtDateTime(lock)}.`, kind: "success" });
    } else {
      setHoldState("None");
      setHoldUntil(null);
    }

    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    setApprovalOpen(false);

    // Simulate approver decision later
    window.setTimeout(() => {
      setApprovalStatus((prev) => {
        if (prev !== "Pending") return prev;
        const approved = Math.random() < 0.65;
        const next = approved ? "Approved" : "Rejected";
        toast({
          title: approved ? "Approved" : "Rejected",
          message: approved ? "Corporate approval granted." : "Approval rejected. You may pay personally.",
          kind: approved ? "success" : "warn",
        });
        return next;
      });
    }, 4200);
  };

  const placeOrderNow = () => {
    if (qty <= 0) {
      toast({ title: "Quantity", message: "Select at least 1.", kind: "warn" });
      return;
    }
    if (qty > stockRemaining) {
      toast({ title: "Not enough stock", message: "Reduce quantity or try another deal.", kind: "warn" });
      return;
    }

    // Corporate immediate path
    if (paymentMethod === "CorporatePay" && !corporateFieldsOk) {
      toast({ title: "Missing fields", message: "Set cost center and purpose.", kind: "warn" });
      return;
    }

    if (paymentMethod === "CorporatePay" && requiresApproval) {
      openApproval();
      return;
    }

    // if deal expired and not locked, proceed at regular price
    const unit = effectiveUnitPriceWithExpiry;
    const sub = qty * unit;
    const tot = sub + deal.shippingUGX;

    setStockRemaining((s) => Math.max(0, s - qty));

    const r: Receipt = {
      id: `RCPT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
      dealId: deal.id,
      title: deal.title,
      vendor: deal.vendor,
      qty,
      unitPrice: unit,
      subtotal: sub,
      shipping: deal.shippingUGX,
      total: tot,
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      costCenter: paymentMethod === "CorporatePay" ? costCenter : undefined,
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
      dealPriceLocked: isLockedPrice,
      lockUntil: isLockedPrice ? holdUntil || undefined : undefined,
      notes: [
        paymentMethod === "CorporatePay" ? "Corporate receipt generated" : "Personal receipt generated",
        isExpired && !isLockedPrice ? "Deal expired: regular pricing used" : "Deal pricing applied",
      ],
    };

    setReceipt(r);
    toast({ title: "Order placed", message: `Receipt ${r.id} created.`, kind: "success" });
  };

  const finalizeAfterApproval = () => {
    if (approvalStatus !== "Approved") {
      toast({ title: "Not approved", message: "Wait for approval or pay personally.", kind: "warn" });
      return;
    }
    // Once approved, order can be placed at locked price if still valid; else regular
    placeOrderNow();
  };

  const reset = () => {
    setReceipt(null);
    setApprovalId("");
    setApprovalStatus("None");
    setHoldState("None");
    setHoldUntil(null);
    toast({ title: "Reset", message: "Checkout reset.", kind: "info" });
  };

  const stockPct = deal.stockTotal <= 0 ? 0 : Math.round(((deal.stockTotal - stockRemaining) / deal.stockTotal) * 100);

  const tierSavings = useMemo(() => {
    const save = Math.max(0, deal.regularUnitPrice - effectiveUnitPriceWithExpiry);
    return save;
  }, [deal.regularUnitPrice, effectiveUnitPriceWithExpiry]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(247,127,0,0.16), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">MyLiveDealz Deal Checkout with CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">Flash timer • Stock counters • Tiered pricing • Deal hold rules • Corporate approvals</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={deal.id} tone="neutral" />
                    <Pill label={deal.category} tone="neutral" />
                    <Pill label={deal.vendorBadge} tone={deal.vendorBadge === "Preferred" ? "info" : deal.vendorBadge === "Allowlisted" ? "good" : "warn"} />
                    <Pill label={isExpired ? "Expired" : "Live"} tone={isExpired ? "bad" : "good"} />
                    {isLockedPrice ? <Pill label={`Locked until ${fmtDateTime(holdUntil!)}`} tone="info" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast({ title: "Share", message: "Share deal link (demo).", kind: "info" })}
                >
                  <ChevronRight className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                {/* Deal card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill label="MyLiveDealz" tone="accent" />
                        <Pill label={deal.location} tone="neutral" />
                        <Pill label={deal.vendorBadge} tone={deal.vendorBadge === "Preferred" ? "info" : deal.vendorBadge === "Allowlisted" ? "good" : "warn"} />
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{deal.title}</div>
                      <div className="mt-1 text-sm text-slate-600">Seller: {deal.vendor}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className={cn(
                          "inline-flex items-center gap-2 rounded-2xl border px-3 py-2",
                          lastMinute ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
                        )}>
                          <Timer className={cn("h-4 w-4", lastMinute ? "text-rose-700" : "text-slate-700")} />
                          <div className={cn("text-sm font-semibold", lastMinute ? "text-rose-800" : "text-slate-900")}>
                            {isExpired ? "Deal ended" : fmtTimeLeft(msLeft)}
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <Package className="h-4 w-4 text-slate-700" />
                          <div className="text-sm font-semibold text-slate-900">Stock {stockRemaining}/{deal.stockTotal}</div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <Percent className="h-4 w-4 text-slate-700" />
                          <div className="text-sm font-semibold text-slate-900">Save {formatUGX(tierSavings)} / unit</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <ProgressBar value={deal.stockTotal - stockRemaining} total={deal.stockTotal} />
                        <div className="mt-2 text-xs text-slate-500">{stockPct}% claimed • Dynamic stock feed (demo)</div>
                      </div>
                    </div>

                    <div className="w-full sm:w-[260px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-600">Quantity</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Button
                            variant="outline"
                            className="px-3 py-2"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            disabled={qty <= 1}
                            title="Decrease"
                          >
                            -
                          </Button>
                          <div className="text-2xl font-semibold text-slate-900">{qty}</div>
                          <Button
                            variant="outline"
                            className="px-3 py-2"
                            onClick={() => setQty((q) => Math.min(999, q + 1))}
                            disabled={qty >= 999}
                            title="Increase"
                          >
                            +
                          </Button>
                        </div>

                        <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <div className="text-xs font-semibold text-slate-600">Your tier</div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">{tier.label}</div>
                            <Pill label={tier.badge || ""} tone={tier.badge ? "accent" : "neutral"} />
                          </div>
                          <div className="mt-2 text-sm text-slate-700">Unit: <span className="font-semibold text-slate-900">{formatUGX(effectiveUnitPriceWithExpiry)}</span></div>
                          {isExpired && !isLockedPrice ? (
                            <div className="mt-2 text-xs font-semibold text-rose-700">Deal expired: regular price used</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tiered pricing */}
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Tiered pricing</div>
                        <div className="mt-1 text-xs text-slate-500">Higher quantity unlocks lower unit price</div>
                      </div>
                      <Pill label="Premium" tone="info" />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                      {deal.tiers.map((t) => {
                        const active = tier.label === t.label;
                        const range = `${t.minQty}+`;
                        const range2 = t.maxQty ? `${t.minQty}-${t.maxQty}` : range;
                        return (
                          <div key={t.label} className={cn("rounded-3xl border p-4", active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                                <div className="mt-1 text-xs text-slate-500">Qty: {range2}</div>
                              </div>
                              {t.badge ? <Pill label={t.badge} tone={active ? "good" : "accent"} /> : null}
                            </div>
                            <div className="mt-3 text-sm text-slate-700">
                              Unit: <span className="font-semibold text-slate-900">{formatUGX(t.unitPrice)}</span>
                            </div>
                            {active ? <div className="mt-2 text-xs font-semibold text-emerald-700">Selected by quantity</div> : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      Regular price: {formatUGX(deal.regularUnitPrice)} • Deal price: {formatUGX(effectiveUnitPriceWithExpiry)}
                    </div>
                  </div>
                </div>

                {/* If approval submitted */}
                {approvalStatus !== "None" ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Corporate approval</div>
                        <div className="mt-1 text-sm text-slate-600">Approval ID: <span className="font-semibold">{approvalId}</span></div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill label={`Status: ${approvalStatus}`} tone={approvalStatus === "Approved" ? "good" : approvalStatus === "Rejected" ? "bad" : "warn"} />
                          <Pill label={`Hold: ${holdState}`} tone={holdState === "Locked" ? "info" : holdState === "Requested" ? "warn" : holdState === "Expired" ? "bad" : "neutral"} />
                          {isLockedPrice && holdUntil ? <Pill label={`Lock until ${fmtDateTime(holdUntil)}`} tone="info" /> : null}
                        </div>
                      </div>
                      <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700" : approvalStatus === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")}>
                        {approvalStatus === "Approved" ? <BadgeCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-600">Deal rule</div>
                        <div className="mt-2 text-sm text-slate-700">{holdRuleMessage}</div>
                        <div className="mt-2 text-xs text-slate-500">If deal expires and you have a lock, locked pricing remains valid until lock expires.</div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-600">Next step</div>
                        <div className="mt-2 text-sm text-slate-700">
                          {approvalStatus === "Pending" ? "Waiting for approver decision." : approvalStatus === "Approved" ? "Finalize checkout." : "Pay personally or modify request."}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="primary" onClick={finalizeAfterApproval} disabled={approvalStatus !== "Approved"}>
                            <ChevronRight className="h-4 w-4" /> Finalize
                          </Button>
                          <Button variant="outline" onClick={() => setPaymentMethod("Personal Wallet")}>
                            <Wallet className="h-4 w-4" /> Pay personally
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Receipt */}
                {receipt ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Receipt</div>
                        <div className="mt-1 text-xs text-slate-500">{receipt.id} • {fmtDateTime(receipt.createdAt)}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill label={receipt.corporate ? "CorporatePay" : "Personal"} tone={receipt.corporate ? "info" : "neutral"} />
                          <Pill label={receipt.dealPriceLocked ? "Deal locked" : "No lock"} tone={receipt.dealPriceLocked ? "info" : "neutral"} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="text-2xl font-semibold text-slate-900">{formatUGX(receipt.total)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Order</div>
                        <div className="mt-2 text-sm text-slate-700">{receipt.title}</div>
                        <div className="mt-1 text-xs text-slate-500">Vendor: {receipt.vendor}</div>
                        <div className="mt-3 space-y-1 text-sm text-slate-700">
                          <div>Qty: <span className="font-semibold">{receipt.qty}</span></div>
                          <div>Unit: <span className="font-semibold">{formatUGX(receipt.unitPrice)}</span></div>
                          <div>Subtotal: <span className="font-semibold">{formatUGX(receipt.subtotal)}</span></div>
                          <div>Shipping: <span className="font-semibold">{formatUGX(receipt.shipping)}</span></div>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Corporate tags</div>
                        <div className="mt-2 text-sm text-slate-700">Payment: <span className="font-semibold">{receipt.paymentMethod}</span></div>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <div>Cost center: <span className="font-semibold">{receipt.costCenter || "-"}</span></div>
                          <div>Purpose: <span className="font-semibold">{receipt.purpose || "-"}</span></div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          Notes:
                          <ul className="mt-2 space-y-1">
                            {receipt.notes.map((n) => (
                              <li key={n}>• {n}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(receipt.id);
                            toast({ title: "Copied", message: "Receipt ID copied.", kind: "success" });
                          } catch {
                            toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" /> Copy ID
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast({ title: "Export", message: "Export receipt PDF (integrate with Print-to-PDF in production).", kind: "info" })}
                      >
                        <Download className="h-4 w-4" /> Export
                      </Button>
                      <Button variant="outline" onClick={reset}>
                        <RefreshCcw className="h-4 w-4" /> New checkout
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                {/* Payment method */}
                <Section
                  title="Payment method"
                  subtitle="CorporatePay appears when you are linked and eligible"
                  right={<Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}
                >
                  <div className="space-y-2">
                    {([
                      { id: "CorporatePay" as const, title: "CorporatePay", sub: "Company-paid with approvals and holds", icon: <Building2 className="h-5 w-5" /> },
                      { id: "Personal Wallet" as const, title: "Personal Wallet", sub: "Pay now to secure the deal", icon: <Wallet className="h-5 w-5" /> },
                      { id: "Card" as const, title: "Card", sub: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
                      { id: "Mobile Money" as const, title: "Mobile Money", sub: "MTN/Airtel", icon: <Bolt className="h-5 w-5" /> },
                    ] as const).map((m) => {
                      const selected = paymentMethod === m.id;
                      const isCorp = m.id === "CorporatePay";
                      const disabled = isCorp && (!corpLinked || !corpEligible || !corpFundingOk);

                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (disabled) {
                              toast({ title: "Unavailable", message: "CorporatePay is not available.", kind: "warn" });
                              return;
                            }
                            setPaymentMethod(m.id);
                            toast({ title: "Selected", message: m.title, kind: "success" });
                          }}
                          className={cn(
                            "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                            selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                            disabled && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
                                {m.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                                  {isCorp ? (
                                    <>
                                      <Pill label={corporateState2} tone={corporateState2 === "Available" ? "good" : corporateState2 === "Requires approval" ? "warn" : "bad"} />
                                      {corporateReason ? <Pill label={corporateReason} tone={corporateState2 === "Not available" ? "bad" : "neutral"} /> : null}
                                    </>
                                  ) : null}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{m.sub}</div>
                              </div>
                            </div>
                            <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                              {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === "CorporatePay" ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                      CorporatePay rule: if approval is required and the deal expires, you can request a price lock (if supported).
                    </div>
                  ) : null}
                </Section>

                {/* Corporate fields */}
                {paymentMethod === "CorporatePay" ? (
                  <Section
                    title="Corporate allocation"
                    subtitle="Required for audit and reporting"
                    right={<Pill label="Required" tone="warn" />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label>
                        <div className="text-xs font-semibold text-slate-600">Cost center</div>
                        <select
                          value={costCenter}
                          onChange={(e) => setCostCenter(e.target.value)}
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                            costCenter.trim() ? "border-slate-200 bg-white text-slate-900" : "border-amber-300 bg-white text-slate-900"
                          )}
                        >
                          {[
                            "CAPEX-01",
                            "OPS-01",
                            "OPS-02",
                            "SAL-03",
                            "FIN-01",
                            "FLEET-01",
                          ].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div className="text-xs font-semibold text-slate-600">Purpose</div>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className={cn(
                            "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                            purpose.trim() ? "border-slate-200 bg-white text-slate-900" : "border-amber-300 bg-white text-slate-900"
                          )}
                        >
                          {[
                            "Fleet operations",
                            "Charging",
                            "Project",
                            "Client meeting",
                            "Event",
                            "Other",
                          ].map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Purpose + cost center help avoid declines and improve invoice line items.
                    </div>
                  </Section>
                ) : null}

                {/* Deal hold rules */}
                {paymentMethod === "CorporatePay" ? (
                  <Section
                    title="Deal expiry hold rules"
                    subtitle="Only relevant when approval is required"
                    right={<Pill label={requiresApproval ? "Applies" : "N/A"} tone={requiresApproval ? "warn" : "neutral"} />}
                  >
                    <div className={cn(
                      "rounded-3xl border p-4",
                      requiresApproval ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Rule</div>
                          <div className="mt-1 text-sm text-slate-700">{holdRuleMessage}</div>
                          {"holdSupported" in deal.policy && deal.policy.holdSupported ? (
                            <div className="mt-2 text-xs text-slate-600">Hold window: {deal.policy.minHoldMinutes}-{deal.policy.maxHoldMinutes} minutes</div>
                          ) : (
                            <div className="mt-2 text-xs text-slate-600">{(deal.policy as any).reason || "Hold not supported"}</div>
                          )}
                        </div>
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", requiresApproval ? "bg-amber-100 text-amber-900" : "bg-slate-50 text-slate-700")}>
                          <Timer className="h-5 w-5" />
                        </div>
                      </div>

                      {requiresApproval ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <label className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Request price lock</div>
                                <div className="mt-1 text-xs text-slate-600">Keep deal price while approval is pending (if supported).</div>
                              </div>
                              <button
                                type="button"
                                className={cn(
                                  "relative h-7 w-12 rounded-full border transition",
                                  requestHold ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                                )}
                                onClick={() => setRequestHold((v) => !v)}
                                aria-label="Toggle hold"
                              >
                                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", requestHold ? "left-[22px]" : "left-1")} />
                              </button>
                            </label>

                            <div className="mt-3">
                              <div className="text-xs font-semibold text-slate-600">Hold minutes</div>
                              <input
                                type="number"
                                value={requestedHoldMinutes}
                                onChange={(e) => setRequestedHoldMinutes(clamp(Number(e.target.value || 0), 1, 9999))}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                              />
                              {!canHold.ok ? <div className="mt-2 text-xs font-semibold text-rose-700">{canHold.reason}</div> : <div className="mt-2 text-xs text-slate-500">Eligible</div>}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Best alternatives</div>
                            <div className="mt-2 text-sm text-slate-700">If hold is not possible, pay personally to secure the deal price immediately.</div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => setPaymentMethod("Personal Wallet")}>
                                <Wallet className="h-4 w-4" /> Pay personally
                              </Button>
                              <Button variant="outline" onClick={() => toast({ title: "Policy", message: "Open policy explanation (demo).", kind: "info" })}>
                                <ShieldCheck className="h-4 w-4" /> Why
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Section>
                ) : null}

                {/* Summary */}
                <Section
                  title="Order summary"
                  subtitle="Totals update with tier and expiry rules"
                  right={<Pill label={isExpired && !isLockedPrice ? "Regular pricing" : "Deal pricing"} tone={isExpired && !isLockedPrice ? "warn" : "accent"} />}
                >
                  <div className="space-y-2">
                    <Row label="Qty" value={`${qty}`} />
                    <Row label="Unit" value={formatUGX(effectiveUnitPriceWithExpiry)} />
                    <Row label="Subtotal" value={formatUGX(subtotalWithExpiry)} emphasize />
                    <Row label="Shipping" value={formatUGX(deal.shippingUGX)} />
                    <Row label="Total" value={formatUGX(totalWithExpiry)} emphasize />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Corporate approval threshold: {formatUGX(approvalThresholdUGX)} • Corporate state: {paymentMethod === "CorporatePay" ? corporateState2 : "Personal"}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant={paymentMethod === "CorporatePay" ? (requiresApproval ? "outline" : "primary") : "primary"}
                      className="w-full"
                      onClick={placeOrderNow}
                      disabled={qty > stockRemaining || (paymentMethod === "CorporatePay" && corporateState2 === "Not available")}
                      title={qty > stockRemaining ? "Insufficient stock" : undefined}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      {paymentMethod === "CorporatePay" ? (requiresApproval ? "Submit for approval" : "Pay with CorporatePay") : "Pay now"}
                    </Button>

                    {paymentMethod === "CorporatePay" && requiresApproval ? (
                      <Button variant="outline" className="w-full" onClick={() => setPaymentMethod("Personal Wallet")}>
                        <Wallet className="h-4 w-4" /> Pay personally to secure
                      </Button>
                    ) : null}

                    {paymentMethod === "CorporatePay" ? (
                      <button
                        type="button"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setCorpFundingOk((v) => !v)}
                      >
                        Toggle funding (demo): {corpFundingOk ? "OK" : "Issue"}
                      </button>
                    ) : null}
                  </div>
                </Section>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U32 MyLiveDealz Deal Checkout (user-side): flash timer, stock counters, tiered pricing, deal expiry hold/approval rules, and CorporatePay controls.
            </div>
          </div>
        </div>
      </div>

      {/* Approval modal */}
      <Modal
        open={approvalOpen}
        title="Submit for CorporatePay approval"
        subtitle="Request approval and optionally lock the deal price"
        onClose={() => setApprovalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitApproval}>
              <ChevronRight className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="960px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={deal.id} tone="neutral" />
              <Pill label={`Total ${formatUGX(totalWithExpiry)}`} tone="neutral" />
              <Pill label={isExpired ? "Expired" : "Live"} tone={isExpired ? "bad" : "good"} />
              {isLockedPrice && holdUntil ? <Pill label={`Already locked until ${fmtDateTime(holdUntil)}`} tone="info" /> : null}
            </div>
            <div className="mt-3 text-sm text-slate-700">
              Corporate tags: <span className="font-semibold">{costCenter}</span> • <span className="font-semibold">{purpose}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Approval reason</div>
              <div className="mt-2 text-sm text-slate-700">
                Amount exceeds threshold ({formatUGX(approvalThresholdUGX)}). This request will route to your approver chain.
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                In production: SLA timers, attachments, and approver comments.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Deal lock</div>
              <div className="mt-2 text-sm text-slate-700">{holdRuleMessage}</div>
              <div className="mt-3 flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Request price lock</div>
                  <div className="mt-1 text-xs text-slate-600">If supported, keeps deal pricing while approval is pending.</div>
                </div>
                <button
                  type="button"
                  className={cn("relative h-7 w-12 rounded-full border transition", requestHold ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                  onClick={() => setRequestHold((v) => !v)}
                  aria-label="Toggle lock"
                >
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", requestHold ? "left-[22px]" : "left-1")} />
                </button>
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-600">Hold minutes</div>
                <input
                  type="number"
                  value={requestedHoldMinutes}
                  onChange={(e) => setRequestedHoldMinutes(clamp(Number(e.target.value || 0), 1, 9999))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
                {!canHold.ok ? <div className="mt-2 text-xs font-semibold text-rose-700">{canHold.reason}</div> : <div className="mt-2 text-xs text-slate-500">Eligible</div>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Tip: if the deal is expiring very soon, paying personally is the fastest way to secure it.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-emerald-900")}>{value}</div>
    </div>
  );
}
