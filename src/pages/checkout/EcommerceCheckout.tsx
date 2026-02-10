import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Wallet,
  X,
  Users,
} from "lucide-react";
import { msToFriendly } from "@/lib/utils";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Step = "cart" | "allocation" | "payment" | "policy" | "receipt";

type Marketplace =
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

type Category = "Office supplies" | "Electronics" | "Catering" | "Vehicles" | "Medical" | "Alcohol" | "Other";

type VendorStatus = "Allowlisted" | "Preferred" | "Unapproved" | "Denylisted";

type PaymentMethod = "CorporatePay" | "Personal Wallet" | "Card" | "Mobile Money";

type CorporateProgramStatus =
  | "Eligible"
  | "Not linked"
  | "Not eligible"
  | "Deposit depleted"
  | "Credit limit exceeded"
  | "Billing delinquency";

type CorporateState = "Available" | "Requires approval" | "Not available";

type Outcome = "Allowed" | "Approval required" | "Blocked";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Vendor = {
  id: string;
  name: string;
  status: VendorStatus;
  categories: Category[];
  notes?: string;
};

type CartItem = {
  id: string;
  name: string;
  marketplace: Marketplace;
  vendorId: string;
  category: Category;
  unitUGX: number;
  qty: number;
  imageHint?: string;
  allocationCostCenter?: string; // used when split allocation
};

type PolicyReasonCode =
  | "PROGRAM"
  | "VENDOR"
  | "CATEGORY"
  | "BASKET"
  | "MARKETPLACE"
  | "ALLOCATION"
  | "THRESHOLD"
  | "RFQ"
  | "OK";

type PolicyReason = { code: PolicyReasonCode; title: string; detail: string; severity: "Info" | "Warning" | "Critical" };

type Alternative = {
  id: string;
  title: string;
  desc: string;
  expected: Outcome;
  icon: React.ReactNode;
  patch: Partial<Patch>;
};

type CoachTip = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  patch?: Partial<Patch>;
};

type Patch = {
  paymentMethod: PaymentMethod;
  removeItemId: string;
  replaceVendor: { itemId: string; newVendorId: string };
  setQty: { itemId: string; qty: number };
  enableSplitAllocation: boolean;
  setGlobalCostCenter: string;
  setPurpose: string;
};

type ReceiptRow = {
  id: string;
  orgName: string;
  orderId: string;
  createdAt: number;
  paymentMethod: PaymentMethod;
  corporate: boolean;
  marketplaceSummary: string;
  vendorSummary: string;
  purpose?: string;
  globalCostCenter?: string;
  splitAllocation: boolean;
  items: Array<{
    name: string;
    marketplace: Marketplace;
    vendor: string;
    category: Category;
    unitUGX: number;
    qty: number;
    lineUGX: number;
    costCenter?: string;
  }>;
  subtotalUGX: number;
  discountUGX: number;
  totalUGX: number;
  notes?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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

function escapeHtml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportReceiptToPrint(receipt: ReceiptRow) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  const rows = receipt.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:800;">${escapeHtml(i.name)}</div>
            <div style="color:#64748b;font-size:12px; margin-top:4px;">
              ${escapeHtml(i.marketplace)} • ${escapeHtml(i.vendor)} • ${escapeHtml(i.category)}
              ${receipt.splitAllocation ? ` • Cost center: ${escapeHtml(i.costCenter || "-")}` : ""}
            </div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
            ${escapeHtml(String(i.qty))} × ${escapeHtml(formatUGX(i.unitUGX))}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right; font-weight:800;">
            ${escapeHtml(formatUGX(i.lineUGX))}
          </td>
        </tr>
      `
    )
    .join("\n");

  w.document.write(`
    <html>
      <head>
        <title>${escapeHtml(receipt.orderId)} - Receipt</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          h2{font-size:14px; margin:16px 0 8px;}
          table{width:100%; border-collapse:collapse;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          .total{font-size:18px; font-weight:900;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">${receipt.corporate ? "CorporatePay" : "Personal"}</div>
            <h1 style="margin-top:10px;">Order receipt</h1>
            <div class="muted" style="margin-top:6px;">Order: ${escapeHtml(receipt.orderId)} • Receipt: ${escapeHtml(receipt.id)}</div>
            <div class="muted" style="margin-top:6px;">Org: ${escapeHtml(receipt.orgName)} • ${escapeHtml(fmtDateTime(receipt.createdAt))}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Total</div>
            <div class="total">${escapeHtml(formatUGX(receipt.totalUGX))}</div>
            <div class="muted" style="margin-top:6px;">Payment: ${escapeHtml(receipt.paymentMethod)}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Marketplaces</div>
              <div style="font-weight:800;">${escapeHtml(receipt.marketplaceSummary)}</div>
            </div>
            <div>
              <div class="muted">Vendors</div>
              <div style="font-weight:800;">${escapeHtml(receipt.vendorSummary)}</div>
            </div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div>
              <div class="muted">Purpose</div>
              <div style="font-weight:800;">${escapeHtml(receipt.purpose || "-")}</div>
            </div>
            <div>
              <div class="muted">Cost center</div>
              <div style="font-weight:800;">${escapeHtml(receipt.globalCostCenter || (receipt.splitAllocation ? "Split" : "-"))}</div>
            </div>
            <div>
              <div class="muted">Allocation</div>
              <div style="font-weight:800;">${receipt.splitAllocation ? "Multi-cost-center" : "Single"}</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Item</th>
                <th style="text-align:right; padding:8px 0; color:#64748b; font-size:12px;">Qty × Unit</th>
                <th style="text-align:right; padding:8px 0; color:#64748b; font-size:12px;">Line</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="row" style="margin-top:12px;">
            <div class="muted">Subtotal</div>
            <div style="font-weight:800;">${escapeHtml(formatUGX(receipt.subtotalUGX))}</div>
          </div>
          <div class="row" style="margin-top:8px;">
            <div class="muted">Discount</div>
            <div style="font-weight:800;">-${escapeHtml(formatUGX(receipt.discountUGX))}</div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div style="font-weight:900;">Total</div>
            <div style="font-weight:900;">${escapeHtml(formatUGX(receipt.totalUGX))}</div>
          </div>

          ${receipt.notes ? `<div class="muted" style="margin-top:12px;">Notes: ${escapeHtml(receipt.notes)}</div>` : ""}

          <div class="muted" style="margin-top:12px;">Export: use Print and select “Save as PDF”.</div>
        </div>

        <div class="no-print" style="margin-top:14px;">
          <button onclick="window.print()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:white; font-weight:800; cursor:pointer;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:800; cursor:pointer; margin-left:8px;">Close</button>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral" | "accent";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
    >
      {children}
    </button>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700",
                  t.kind === "warn" && "bg-amber-50 text-amber-800",
                  t.kind === "error" && "bg-rose-50 text-rose-700",
                  t.kind === "info" && "bg-blue-50 text-blue-700"
                )}
              >
                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message ? <div className="mt-0.5 text-sm text-slate-600">{t.message}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "920px",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function toneForOutcome(o: Outcome) {
  if (o === "Allowed") return "good" as const;
  if (o === "Approval required") return "warn" as const;
  return "bad" as const;
}

function vendorTone(s: VendorStatus) {
  if (s === "Preferred") return "info" as const;
  if (s === "Allowlisted") return "good" as const;
  if (s === "Unapproved") return "warn" as const;
  return "bad" as const;
}

function chooseBestApprovedVendor(vendors: Vendor[], category: Category) {
  const preferred = vendors.find((v) => (v.status === "Preferred" || v.status === "Allowlisted") && v.categories.includes(category));
  return preferred || vendors.find((v) => (v.status === "Preferred" || v.status === "Allowlisted"));
}

function evaluateEcomPolicy(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  items: CartItem[];
  vendorsById: Record<string, Vendor>;
  restrictedCategories: Category[];
  basketApprovalUGX: number;
  basketBlockUGX: number;
  myliveApprovalUGX: number;
  myliveBlockUGX: number;
  unapprovedVendorApprovalUGX: number;
  unapprovedVendorBlockUGX: number;
  splitAllowed: boolean;
  splitEnabled: boolean;
  globalCostCenter: string;
  purpose: string;
  purposeRequired: boolean;
  costCenterRequired: boolean;
  strictAllocationForCapex: boolean;
}): { outcome: Outcome; reasons: PolicyReason[]; alternatives: Alternative[]; coach: CoachTip[] } {
  const {
    paymentMethod,
    corporateStatus,
    graceActive,
    items,
    vendorsById,
    restrictedCategories,
    basketApprovalUGX,
    basketBlockUGX,
    myliveApprovalUGX,
    myliveBlockUGX,
    unapprovedVendorApprovalUGX,
    unapprovedVendorBlockUGX,
    splitAllowed,
    splitEnabled,
    globalCostCenter,
    purpose,
    purposeRequired,
    costCenterRequired,
    strictAllocationForCapex,
  } = args;

  const reasons: PolicyReason[] = [];
  const alternatives: Alternative[] = [];
  const coach: CoachTip[] = [];

  const subtotal = items.reduce((a, i) => a + i.unitUGX * i.qty, 0);
  const myliveSubtotal = items
    .filter((i) => i.marketplace === "MyLiveDealz")
    .reduce((a, i) => a + i.unitUGX * i.qty, 0);

  const byVendor: Record<string, number> = {};
  for (const i of items) byVendor[i.vendorId] = (byVendor[i.vendorId] || 0) + i.unitUGX * i.qty;

  // Personal payment bypasses corporate policy
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments.", severity: "Info" });
    alternatives.push({
      id: "alt-corp",
      title: "Use CorporatePay instead",
      desc: "Use CorporatePay for business purchases when eligible.",
      expected: "Approval required",
      icon: <Building2 className="h-4 w-4" />,
      patch: { paymentMethod: "CorporatePay" },
    });
    coach.push({
      id: "coach-corp",
      title: "Corporate receipts become cleaner",
      desc: "CorporatePay receipts include purpose and cost center for audits.",
      icon: <ReceiptIcon />,
    });
    return { outcome: "Allowed", reasons, alternatives, coach };
  }

  // Corporate enforcement states
  if (corporateStatus === "Not linked") {
    reasons.push({ code: "PROGRAM", title: "Not linked to an organization", detail: "CorporatePay is only available when you are linked to an organization.", severity: "Critical" });
  }
  if (corporateStatus === "Not eligible") {
    reasons.push({ code: "PROGRAM", title: "Not eligible under policy", detail: "Your role or group is not eligible for CorporatePay in e-commerce.", severity: "Critical" });
  }
  if (corporateStatus === "Deposit depleted") {
    reasons.push({ code: "PROGRAM", title: "Deposit depleted", detail: "Prepaid deposit is depleted. CorporatePay is a hard stop until top-up.", severity: "Critical" });
  }
  if (corporateStatus === "Credit limit exceeded") {
    reasons.push({ code: "PROGRAM", title: "Credit limit exceeded", detail: "Corporate credit limit is exceeded. CorporatePay is paused until repayment or adjustment.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && !graceActive) {
    reasons.push({ code: "PROGRAM", title: "Billing delinquency", detail: "CorporatePay is suspended due to delinquency. Ask admin to resolve invoices.", severity: "Critical" });
  }
  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace is active. CorporatePay may proceed.", severity: "Warning" });
  }

  const blockedByProgram = ["Not linked", "Not eligible", "Deposit depleted", "Credit limit exceeded"].includes(corporateStatus) || (corporateStatus === "Billing delinquency" && !graceActive);
  if (blockedByProgram) {
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed immediately with personal payment.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    coach.push({ id: "coach-admin", title: "Contact admin", desc: "Ask your admin to restore CorporatePay funding/compliance.", icon: <Users className="h-4 w-4" /> });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  // Allocation requirements
  if (splitEnabled && !splitAllowed) {
    reasons.push({ code: "ALLOCATION", title: "Split allocation not allowed", detail: "Your organization policy does not allow multi-cost-center carts.", severity: "Critical" });
    alternatives.push({
      id: "alt-disable-split",
      title: "Use single cost center",
      desc: "Turn off split allocation and assign one cost center.",
      expected: "Allowed",
      icon: <Tag className="h-4 w-4" />,
      patch: { enableSplitAllocation: false },
    });
  }

  if (costCenterRequired) {
    if (!splitEnabled && !globalCostCenter.trim()) {
      reasons.push({ code: "ALLOCATION", title: "Cost center required", detail: "A cost center is required for corporate orders.", severity: "Critical" });
      alternatives.push({
        id: "alt-cc",
        title: "Select cost center",
        desc: "Choose a cost center for this order.",
        expected: "Allowed",
        icon: <Tag className="h-4 w-4" />,
        patch: { setGlobalCostCenter: "OPS-01" },
      });
    }

    if (splitEnabled) {
      const missing = items.filter((i) => !i.allocationCostCenter || !i.allocationCostCenter.trim());
      if (missing.length) {
        reasons.push({
          code: "ALLOCATION",
          title: "Missing cost center on some items",
          detail: `Assign cost centers to ${missing.length} item(s) before continuing.`,
          severity: "Critical",
        });
      }
    }
  }

  if (purposeRequired && !purpose.trim()) {
    reasons.push({ code: "ALLOCATION", title: "Purpose required", detail: "Purpose is required for this corporate purchase.", severity: "Critical" });
    alternatives.push({
      id: "alt-purpose",
      title: "Add purpose",
      desc: "Set purpose like Project, Event, or Office supplies.",
      expected: "Allowed",
      icon: <Info className="h-4 w-4" />,
      patch: { setPurpose: "Office supplies" },
    });
  }

  // Category restrictions
  const restricted = items.filter((i) => restrictedCategories.includes(i.category));
  for (const i of restricted) {
    reasons.push({
      code: "CATEGORY",
      title: "Restricted category",
      detail: `${i.category} is not allowed for CorporatePay purchases.`,
      severity: "Critical",
    });
    alternatives.push({
      id: `alt-remove-${i.id}`,
      title: `Remove ${i.category} item`,
      desc: "Remove restricted item to proceed with CorporatePay.",
      expected: "Approval required",
      icon: <Trash2 className="h-4 w-4" />,
      patch: { removeItemId: i.id },
    });
  }

  // Vendor allowlist/denylist
  const denyVendorItems = items.filter((i) => vendorsById[i.vendorId]?.status === "Denylisted");
  for (const i of denyVendorItems) {
    const v = vendorsById[i.vendorId];
    reasons.push({
      code: "VENDOR",
      title: "Vendor blocked",
      detail: `${v?.name || "Vendor"} is denylisted for corporate purchases.`,
      severity: "Critical",
    });
    alternatives.push({
      id: `alt-remove-vendor-${i.id}`,
      title: "Remove item from blocked vendor",
      desc: "Remove this item or switch to an approved vendor.",
      expected: "Approval required",
      icon: <Trash2 className="h-4 w-4" />,
      patch: { removeItemId: i.id },
    });
  }

  // Unapproved vendor thresholds
  for (const [vendorId, vTotal] of Object.entries(byVendor)) {
    const v = vendorsById[vendorId];
    if (!v) continue;
    if (v.status === "Unapproved") {
      if (vTotal > unapprovedVendorBlockUGX) {
        reasons.push({
          code: "VENDOR",
          title: "High-value from unapproved vendor",
          detail: `${v.name} is unapproved and the vendor subtotal exceeds ${formatUGX(unapprovedVendorBlockUGX)}.`,
          severity: "Critical",
        });
      } else if (vTotal > unapprovedVendorApprovalUGX) {
        reasons.push({
          code: "VENDOR",
          title: "Approval required for unapproved vendor",
          detail: `${v.name} is unapproved. This purchase requires approval.`,
          severity: "Warning",
        });
      }
    }
  }

  // Basket size limits
  if (subtotal > basketBlockUGX) {
    reasons.push({
      code: "BASKET",
      title: "Basket too large",
      detail: `Basket exceeds hard limit (${formatUGX(basketBlockUGX)}).`,
      severity: "Critical",
    });
  } else if (subtotal > basketApprovalUGX) {
    reasons.push({
      code: "BASKET",
      title: "Basket requires approval",
      detail: `Basket exceeds approval threshold (${formatUGX(basketApprovalUGX)}).`,
      severity: "Warning",
    });
  }

  // MyLiveDealz thresholds
  if (myliveSubtotal > 0) {
    if (myliveSubtotal > myliveBlockUGX) {
      reasons.push({
        code: "MARKETPLACE",
        title: "MyLiveDealz hard limit",
        detail: `MyLiveDealz subtotal exceeds hard limit (${formatUGX(myliveBlockUGX)}).`,
        severity: "Critical",
      });
    } else if (myliveSubtotal > myliveApprovalUGX) {
      reasons.push({
        code: "MARKETPLACE",
        title: "MyLiveDealz requires approval",
        detail: `MyLiveDealz subtotal exceeds approval threshold (${formatUGX(myliveApprovalUGX)}).`,
        severity: "Warning",
      });
    }
  }

  // CapEx / RFQ signal
  const capexItems = items.filter((i) => i.category === "Vehicles");
  if (capexItems.length) {
    const capexTotal = capexItems.reduce((a, i) => a + i.unitUGX * i.qty, 0);
    reasons.push({
      code: "RFQ",
      title: "CapEx item detected",
      detail: `Vehicles/CapEx items are best handled through RFQ/Quote flow (CapEx total ${formatUGX(capexTotal)}).`,
      severity: capexTotal > 2_000_000 ? "Warning" : "Info",
    });
    coach.push({
      id: "coach-rfq",
      title: "Use RFQ for high-value assets",
      desc: "Request quotes, compare offers, and convert to a purchase order.",
      icon: <FileText className="h-4 w-4" />,
    });
  }

  // Allocation strictness for CapEx
  if (strictAllocationForCapex && capexItems.length) {
    const badAlloc = capexItems.filter((i) => {
      const cc = splitEnabled ? i.allocationCostCenter : globalCostCenter;
      return cc && !["CAPEX-01", "FLEET-01"].includes(cc);
    });
    if (badAlloc.length) {
      reasons.push({
        code: "ALLOCATION",
        title: "CapEx allocation mismatch",
        detail: `CapEx items should use CAPEX-01 or FLEET-01 cost centers.`,
        severity: "Warning",
      });
    }
  }

  // Premium coach: preferred vendor nudge
  const needsVendorHelp = items
    .map((i) => ({ i, v: vendorsById[i.vendorId] }))
    .filter(({ v }) => v && (v.status === "Unapproved" || v.status === "Denylisted"));

  if (needsVendorHelp.length) {
    coach.push({
      id: "coach-vendor",
      title: "Use approved vendors for instant approval",
      desc: "Switching to preferred/allowlisted vendors reduces approvals and rejections.",
      icon: <Store className="h-4 w-4" />,
    });
  }

  // Always include personal fallback alternative
  alternatives.push({
    id: "alt-pay-personal",
    title: "Pay personally",
    desc: "Proceed immediately using personal payment.",
    expected: "Allowed",
    icon: <Wallet className="h-4 w-4" />,
    patch: { paymentMethod: "Personal Wallet" },
  });

  // Basket reduction alternative
  if (subtotal > basketApprovalUGX) {
    alternatives.push({
      id: "alt-reduce",
      title: "Reduce basket size",
      desc: "Lower quantities or remove low-priority items to avoid approval.",
      expected: "Allowed",
      icon: <Package className="h-4 w-4" />,
      patch: {},
    });
  }

  // If any unapproved vendor: suggest switching to preferred vendor
  for (const { i, v } of needsVendorHelp) {
    if (!v) continue;
    const best = chooseBestApprovedVendor(Object.values(vendorsById), i.category);
    if (!best) continue;
    if (best.id === i.vendorId) continue;
    alternatives.push({
      id: `alt-switch-${i.id}`,
      title: `Switch vendor for “${i.name}”`,
      desc: `Use ${best.name} to reduce approvals.",`,
      expected: "Allowed",
      icon: <Store className="h-4 w-4" />,
      patch: { replaceVendor: { itemId: i.id, newVendorId: best.id } },
    });
  }

  // Determine outcome
  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarn = reasons.some((r) => r.severity === "Warning");

  // If nothing flagged
  if (!reasons.length) {
    reasons.push({ code: "OK", title: "Within policy", detail: "Order is within vendor, category, and budget rules.", severity: "Info" });
  }

  if (hasCritical) return { outcome: "Blocked", reasons, alternatives: dedupeAlt(alternatives), coach };
  if (hasWarn) return { outcome: "Approval required", reasons, alternatives: dedupeAlt(alternatives), coach };
  return { outcome: "Allowed", reasons, alternatives: dedupeAlt(alternatives), coach };
}

function dedupeAlt(list: Alternative[]) {
  const seen = new Set<string>();
  const out: Alternative[] = [];
  for (const a of list) {
    const key = `${a.title}|${JSON.stringify(a.patch)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 8);
}

function ReceiptIcon() {
  return <Receipt className="h-4 w-4" />;
}

function Receipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 7.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 11h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function UserECommerceCheckoutCorporatePayU17() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [step, setStep] = useState<Step>("cart");

  // Premium policy toggles
  const [splitAllowed, setSplitAllowed] = useState(true);
  const [splitEnabled, setSplitEnabled] = useState(true);
  const [strictAllocationForCapex, setStrictAllocationForCapex] = useState(true);

  // Corporate status (demo)
  const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
  const [graceEnabled, setGraceEnabled] = useState(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 3 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const graceMs = graceEndAt - nowTick;
  const graceActive = corporateStatus === "Billing delinquency" && graceEnabled && graceMs > 0;

  // Policy thresholds
  const [basketApprovalUGX, setBasketApprovalUGX] = useState(800000);
  const [basketBlockUGX, setBasketBlockUGX] = useState(2000000);
  const [myliveApprovalUGX, setMyliveApprovalUGX] = useState(700000);
  const [myliveBlockUGX, setMyliveBlockUGX] = useState(1500000);
  const [unapprovedVendorApprovalUGX, setUnapprovedVendorApprovalUGX] = useState(150000);
  const [unapprovedVendorBlockUGX, setUnapprovedVendorBlockUGX] = useState(300000);

  // Payment + allocation
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");
  const [globalCostCenter, setGlobalCostCenter] = useState("OPS-01");
  const [purpose, setPurpose] = useState("Office supplies");
  const [notes, setNotes] = useState("");

  const costCenters = useMemo(() => ["OPS-01", "OPS-02", "SAL-03", "FIN-01", "CAPEX-01", "FLEET-01"], []);
  const purposeTags = useMemo(() => ["Office supplies", "Project", "Client meeting", "Event", "Catering", "Fleet operations", "CapEx", "Other"], []);

  // Vendor directory
  const vendors: Vendor[] = useMemo(
    () => [
      {
        id: "v_pref_office",
        name: "EVzone Office Supplies (Preferred)",
        status: "Preferred",
        categories: ["Office supplies"],
        notes: "Instant approval for most items",
      },
      {
        id: "v_allow_catering",
        name: "Kampala Catering Co",
        status: "Allowlisted",
        categories: ["Catering"],
        notes: "Allowlisted vendor",
      },
      {
        id: "v_unapproved_tech",
        name: "TechHub Uganda",
        status: "Unapproved",
        categories: ["Electronics"],
        notes: "Requires approval; high value can be blocked",
      },
      {
        id: "v_pref_tech",
        name: "EVzone Preferred Tech",
        status: "Preferred",
        categories: ["Electronics"],
        notes: "Preferred vendor; lower friction",
      },
      {
        id: "v_deny_party",
        name: "Party Store Ltd",
        status: "Denylisted",
        categories: ["Alcohol", "Other"],
        notes: "Blocked for corporate",
      },
      {
        id: "v_allow_vehicle",
        name: "EVmart Dealer Network",
        status: "Allowlisted",
        categories: ["Vehicles"],
        notes: "CapEx items usually require RFQ",
      },
    ],
    []
  );

  const vendorsById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])) as Record<string, Vendor>, [vendors]);

  // Cart
  const [items, setItems] = useState<CartItem[]>(() => [
    {
      id: "i_paper",
      name: "A4 Printer Paper (Box)",
      marketplace: "ServiceMart",
      vendorId: "v_pref_office",
      category: "Office supplies",
      unitUGX: 32000,
      qty: 10,
      allocationCostCenter: "OPS-01",
    },
    {
      id: "i_catering",
      name: "Catering Package (Meeting)",
      marketplace: "ServiceMart",
      vendorId: "v_allow_catering",
      category: "Catering",
      unitUGX: 250000,
      qty: 1,
      allocationCostCenter: "ADM-01" as any,
    },
    {
      id: "i_whiskey",
      name: "Whiskey Gift Pack",
      marketplace: "MyLiveDealz",
      vendorId: "v_deny_party",
      category: "Alcohol",
      unitUGX: 180000,
      qty: 1,
      allocationCostCenter: "OPS-01",
    },
    {
      id: "i_laptop",
      name: "Laptop Bundle (Work)",
      marketplace: "GadgetMart",
      vendorId: "v_unapproved_tech",
      category: "Electronics",
      unitUGX: 250000,
      qty: 1,
      allocationCostCenter: "SAL-03",
    },
  ]);

  // Fix bad ADM-01 default; keep cost center list strict
  useEffect(() => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.allocationCostCenter && !costCenters.includes(i.allocationCostCenter)) {
          return { ...i, allocationCostCenter: "OPS-01" };
        }
        return i;
      })
    );
  }, [costCenters]);

  const restrictedCategories: Category[] = useMemo(() => ["Alcohol"], []);

  const subtotalUGX = useMemo(() => items.reduce((a, i) => a + i.unitUGX * i.qty, 0), [items]);

  const marketplaceSummary = useMemo(() => {
    const set = new Set(items.map((i) => i.marketplace));
    return Array.from(set).join(", ") || "-";
  }, [items]);

  const vendorSummary = useMemo(() => {
    const set = new Set(items.map((i) => vendorsById[i.vendorId]?.name || "Vendor"));
    return Array.from(set).slice(0, 3).join(", ") + (set.size > 3 ? ` +${set.size - 3}` : "");
  }, [items, vendorsById]);

  const purposeRequired = useMemo(() => {
    // Best-practice: purpose required for MyLiveDealz or Catering
    const hasMyLive = items.some((i) => i.marketplace === "MyLiveDealz");
    const hasCatering = items.some((i) => i.category === "Catering");
    return paymentMethod === "CorporatePay" && (hasMyLive || hasCatering);
  }, [items, paymentMethod]);

  const costCenterRequired = paymentMethod === "CorporatePay";

  const policy = useMemo(() => {
    return evaluateEcomPolicy({
      paymentMethod,
      corporateStatus,
      graceActive,
      items,
      vendorsById,
      restrictedCategories,
      basketApprovalUGX,
      basketBlockUGX,
      myliveApprovalUGX,
      myliveBlockUGX,
      unapprovedVendorApprovalUGX,
      unapprovedVendorBlockUGX,
      splitAllowed,
      splitEnabled,
      globalCostCenter,
      purpose,
      purposeRequired,
      costCenterRequired,
      strictAllocationForCapex,
    });
  }, [
    paymentMethod,
    corporateStatus,
    graceActive,
    items,
    vendorsById,
    restrictedCategories,
    basketApprovalUGX,
    basketBlockUGX,
    myliveApprovalUGX,
    myliveBlockUGX,
    unapprovedVendorApprovalUGX,
    unapprovedVendorBlockUGX,
    splitAllowed,
    splitEnabled,
    globalCostCenter,
    purpose,
    purposeRequired,
    costCenterRequired,
    strictAllocationForCapex,
  ]);

  const corporateState = useMemo<CorporateState>(() => {
    if (paymentMethod !== "CorporatePay") return "Available";

    const blockedByProgram = ["Not linked", "Not eligible", "Deposit depleted", "Credit limit exceeded"].includes(corporateStatus) || (corporateStatus === "Billing delinquency" && !graceActive);
    if (blockedByProgram) return "Not available";

    if (policy.outcome === "Approval required") return "Requires approval";
    if (policy.outcome === "Blocked") return "Not available";
    return "Available";
  }, [paymentMethod, corporateStatus, graceActive, policy.outcome]);

  const corporateReason = useMemo(() => {
    if (corporateStatus === "Not linked") return "Not linked";
    if (corporateStatus === "Not eligible") return "Not eligible";
    if (corporateStatus === "Deposit depleted") return "Deposit depleted";
    if (corporateStatus === "Credit limit exceeded") return "Credit exceeded";
    if (corporateStatus === "Billing delinquency" && !graceActive) return "Suspended";
    if (corporateStatus === "Billing delinquency" && graceActive) return `Grace ${msToFriendly(graceMs)}`;
    return "";
  }, [corporateStatus, graceActive, graceMs]);

  // Steps validation
  const allocationOk = useMemo(() => {
    if (paymentMethod !== "CorporatePay") return true;

    if (splitEnabled) {
      if (!splitAllowed) return false;
      const missing = items.some((i) => !i.allocationCostCenter || !i.allocationCostCenter.trim());
      if (missing) return false;
    } else {
      if (!globalCostCenter.trim()) return false;
    }

    if (purposeRequired && !purpose.trim()) return false;
    return true;
  }, [paymentMethod, splitEnabled, splitAllowed, items, globalCostCenter, purposeRequired, purpose]);

  // Premium allocation summary
  const allocationSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of items) {
      const cc = splitEnabled ? i.allocationCostCenter || "Unassigned" : globalCostCenter || "Unassigned";
      map[cc] = (map[cc] || 0) + i.unitUGX * i.qty;
    }
    return Object.entries(map)
      .map(([k, v]) => ({ costCenter: k, total: v }))
      .sort((a, b) => b.total - a.total);
  }, [items, splitEnabled, globalCostCenter]);

  // Apply patch helpers
  const applyPatch = (patch: Partial<Patch>) => {
    if (patch.paymentMethod) setPaymentMethod(patch.paymentMethod);

    if (typeof patch.enableSplitAllocation === "boolean") {
      setSplitEnabled(patch.enableSplitAllocation);
      toast({ title: "Allocation", message: patch.enableSplitAllocation ? "Split allocation enabled" : "Split allocation disabled", kind: "info" });
    }

    if (patch.setGlobalCostCenter !== undefined) setGlobalCostCenter(patch.setGlobalCostCenter);
    if (patch.setPurpose !== undefined) setPurpose(patch.setPurpose);

    if (patch.removeItemId) {
      setItems((prev) => prev.filter((x) => x.id !== patch.removeItemId));
      toast({ title: "Removed", message: "Item removed from cart.", kind: "info" });
    }

    if (patch.setQty) {
      setItems((prev) =>
        prev.map((x) => (x.id === patch.setQty?.itemId ? { ...x, qty: clamp(patch.setQty.qty, 0, 999) } : x)).filter((x) => x.qty > 0)
      );
      toast({ title: "Updated", message: "Quantity updated.", kind: "success" });
    }

    if (patch.replaceVendor) {
      const { itemId, newVendorId } = patch.replaceVendor;
      setItems((prev) => prev.map((x) => (x.id === itemId ? { ...x, vendorId: newVendorId } : x)));
      toast({ title: "Vendor changed", message: "Item vendor updated.", kind: "success" });
    }
  };

  // Navigation
  const nextStep = (s: Step): Step => (s === "cart" ? "allocation" : s === "allocation" ? "payment" : s === "payment" ? "policy" : s === "policy" ? "receipt" : "receipt");
  const prevStep = (s: Step): Step => (s === "receipt" ? "policy" : s === "policy" ? "payment" : s === "payment" ? "allocation" : s === "allocation" ? "cart" : "cart");

  const canContinue = useMemo(() => {
    if (step === "cart") return items.length > 0;
    if (step === "allocation") return allocationOk;
    if (step === "payment") {
      if (paymentMethod === "CorporatePay") return corporateState !== "Not available" && allocationOk;
      return true;
    }
    if (step === "policy") return true;
    return true;
  }, [step, items.length, allocationOk, paymentMethod, corporateState]);

  const onContinue = () => {
    if (!canContinue) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }
    setStep(nextStep(step));
  };

  const onBack = () => setStep(prevStep(step));

  // Approval + receipt states
  const [approvalId, setApprovalId] = useState<string>("");
  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);

  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState({ reason: "", attachmentName: "", note: "" });

  const [splitAllocPolicyAllows, setSplitAllocPolicyAllows] = useState(true);
  useEffect(() => {
    // tie to splitAllowed, but keep separate toggle
    setSplitAllocPolicyAllows(splitAllowed);
  }, [splitAllowed]);

  const submitApproval = () => {
    const id = `REQ-EC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setApprovalId(id);
    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    toast({ title: "Track", message: "Track status in U13 Pending Approval (demo).", kind: "info" });
  };

  const placeOrder = () => {
    const orderId = `ORD-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const receiptId = `RCPT-EC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    const lineItems = items.map((i) => ({
      name: i.name,
      marketplace: i.marketplace,
      vendor: vendorsById[i.vendorId]?.name || "Vendor",
      category: i.category,
      unitUGX: i.unitUGX,
      qty: i.qty,
      lineUGX: i.unitUGX * i.qty,
      costCenter: paymentMethod === "CorporatePay" ? (splitEnabled ? i.allocationCostCenter : globalCostCenter) : undefined,
    }));

    const subtotal = lineItems.reduce((a, x) => a + x.lineUGX, 0);
    const discount = paymentMethod === "CorporatePay" && items.some((i) => vendorsById[i.vendorId]?.status === "Preferred") ? Math.round(subtotal * 0.01) : 0;
    const total = Math.max(0, subtotal - discount);

    const r: ReceiptRow = {
      id: receiptId,
      orgName: "Acme Group Ltd",
      orderId,
      createdAt: Date.now(),
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      marketplaceSummary,
      vendorSummary,
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
      globalCostCenter: paymentMethod === "CorporatePay" ? (splitEnabled ? undefined : globalCostCenter) : undefined,
      splitAllocation: paymentMethod === "CorporatePay" ? splitEnabled : false,
      items: lineItems,
      subtotalUGX: subtotal,
      discountUGX: discount,
      totalUGX: total,
      notes: notes.trim() || undefined,
    };

    setReceipt(r);
    toast({ title: "Order placed", message: `${orderId} created.`, kind: "success" });
    setStep("receipt");
  };

  const requestException = () => {
    setExceptionDraft({ reason: "", attachmentName: "", note: "" });
    setExceptionOpen(true);
  };

  const submitException = () => {
    if (exceptionDraft.reason.trim().length < 10) {
      toast({ title: "Reason required", message: "Add a clearer reason (min 10 characters).", kind: "warn" });
      return;
    }
    const id = `EXC-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    toast({ title: "Exception requested", message: `Exception ${id} created. Track in My Requests (U5).`, kind: "success" });
    setExceptionOpen(false);
  };

  const paymentCards = useMemo(
    () => [
      { id: "CorporatePay" as const, title: "CorporatePay", sub: "Company-paid with policy and approvals", icon: <Building2 className="h-5 w-5" /> },
      { id: "Personal Wallet" as const, title: "Personal Wallet", sub: "Pay from your personal EVzone wallet", icon: <Wallet className="h-5 w-5" /> },
      { id: "Card" as const, title: "Card", sub: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
      { id: "Mobile Money" as const, title: "Mobile Money", sub: "MTN/Airtel", icon: <PhoneSvg className="h-5 w-5" /> },
    ],
    []
  );

  const corporateDisabled = paymentMethod === "CorporatePay" && corporateState === "Not available";

  // Preferred vendor nudges
  const vendorNudges = useMemo(() => {
    const nudges: Array<{ itemId: string; title: string; desc: string; newVendorId: string }> = [];
    for (const i of items) {
      const v = vendorsById[i.vendorId];
      if (!v) continue;
      if (v.status === "Unapproved" || v.status === "Denylisted") {
        const best = chooseBestApprovedVendor(vendors, i.category);
        if (best && best.id !== i.vendorId) {
          nudges.push({
            itemId: i.id,
            title: `Use ${best.name}`,
            desc: "Preferred/allowlisted vendors can unlock instant approval.",
            newVendorId: best.id,
          });
        }
      }
    }
    return nudges.slice(0, 4);
  }, [items, vendorsById, vendors]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">E‑Commerce checkout with CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">Buy from marketplaces (including MyLiveDealz) with vendor, category, and basket controls.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Step: ${step}`} tone="neutral" />
                    <Pill label={`Items: ${items.length}`} tone="neutral" />
                    <Pill label={`Subtotal: ${formatUGX(subtotalUGX)}`} tone="neutral" />
                    <Pill label={`Pay: ${paymentMethod}`} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                    <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Back", message: "Back to marketplace home (demo).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Exit
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 Corporate Receipts (demo).", kind: "info" })}>
                  <ReceiptIcon /> Receipts
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open U3 Corporate Policies Summary (demo).", kind: "info" })}>
                  <ShieldCheck className="h-4 w-4" /> Policies
                </Button>
              </div>
            </div>

            {/* Step tabs */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {([
                { k: "cart", label: "Cart" },
                { k: "allocation", label: "Allocation" },
                { k: "payment", label: "Payment" },
                { k: "policy", label: "Policy" },
                { k: "receipt", label: "Receipt" },
              ] as Array<{ k: Step; label: string }>).map((t) => {
                const active = step === t.k;
                return (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setStep(t.k)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="text-xs font-semibold text-slate-600">{t.label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Step</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                {step === "cart" ? (
                  <>
                    <Section
                      title="Cart"
                      subtitle="Vendor allowlist/denylist and category restrictions are enforced for CorporatePay"
                      right={<Pill label={marketplaceSummary} tone="neutral" />}
                    >
                      <div className="space-y-2">
                        {items.map((i) => {
                          const v = vendorsById[i.vendorId];
                          const line = i.unitUGX * i.qty;
                          const restricted = restrictedCategories.includes(i.category);
                          return (
                            <div key={i.id} className={cn("rounded-3xl border bg-white p-4", restricted ? "border-rose-200" : "border-slate-200")}>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{i.name}</div>
                                    <Pill label={i.marketplace} tone={i.marketplace === "MyLiveDealz" ? "accent" : "neutral"} />
                                    <Pill label={i.category} tone={restricted ? "bad" : "neutral"} />
                                    {v ? <Pill label={v.status} tone={vendorTone(v.status)} /> : null}
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">Vendor: {v?.name || "Vendor"}</div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Pill label={`${i.qty} × ${formatUGX(i.unitUGX)}`} tone="neutral" />
                                    <Pill label={`Line: ${formatUGX(line)}`} tone="neutral" />
                                    {paymentMethod === "CorporatePay" && splitEnabled ? <Pill label={`CC: ${i.allocationCostCenter || "Unassigned"}`} tone={i.allocationCostCenter ? "info" : "warn"} /> : null}
                                  </div>

                                  {restricted && paymentMethod === "CorporatePay" ? (
                                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                                      Restricted category for CorporatePay. Remove this item or pay personally.
                                    </div>
                                  ) : null}

                                  {v?.status === "Unapproved" ? (
                                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                      Vendor is unapproved. Purchase may require approval.
                                    </div>
                                  ) : null}

                                  {v?.status === "Denylisted" ? (
                                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                                      Vendor is denylisted for CorporatePay. Remove or switch vendor.
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                    <div className="text-[11px] font-semibold text-slate-600">Qty</div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <button
                                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-800 hover:bg-slate-50"
                                        onClick={() => applyPatch({ setQty: { itemId: i.id, qty: i.qty - 1 } })}
                                        aria-label="Decrease"
                                      >
                                        -
                                      </button>
                                      <div className="w-10 text-center text-sm font-semibold text-slate-900">{i.qty}</div>
                                      <button
                                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-800 hover:bg-slate-50"
                                        onClick={() => applyPatch({ setQty: { itemId: i.id, qty: i.qty + 1 } })}
                                        aria-label="Increase"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => applyPatch({ removeItemId: i.id })}>
                                    <Trash2 className="h-4 w-4" /> Remove
                                  </Button>
                                </div>
                              </div>

                              {/* Preferred vendor nudge */}
                              {vendorNudges.some((n) => n.itemId === i.id) ? (
                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold">Preferred vendor available</div>
                                      <div className="mt-1">
                                        {vendorNudges.find((n) => n.itemId === i.id)?.title} • {vendorNudges.find((n) => n.itemId === i.id)?.desc}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        const n = vendorNudges.find((x) => x.itemId === i.id);
                                        if (!n) return;
                                        applyPatch({ replaceVendor: { itemId: i.id, newVendorId: n.newVendorId } });
                                      }}
                                    >
                                      <Store className="h-4 w-4" /> Switch
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}

                        {!items.length ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                              <Package className="h-6 w-6" />
                            </div>
                            <div className="mt-3 text-sm font-semibold text-slate-900">Your cart is empty</div>
                            <div className="mt-1 text-sm text-slate-600">Add items to proceed.</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Subtotal</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(subtotalUGX)}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Pill label={`Basket approval > ${formatUGX(basketApprovalUGX)}`} tone="neutral" />
                            <Pill label={`Basket hard stop > ${formatUGX(basketBlockUGX)}`} tone="neutral" />
                          </div>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Premium: split allocation</div>
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Multi-cost-center cart</div>
                              <div className="mt-1 text-xs text-slate-600">Assign cost centers per item if policy allows.</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Pill label={splitAllowed ? "Allowed" : "Not allowed"} tone={splitAllowed ? "good" : "warn"} />
                                <Pill label={splitEnabled ? "Enabled" : "Disabled"} tone={splitEnabled ? "info" : "neutral"} />
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!splitAllowed}
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                splitEnabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                                !splitAllowed && "cursor-not-allowed opacity-60"
                              )}
                              onClick={() => {
                                if (!splitAllowed) return;
                                setSplitEnabled((v) => !v);
                                toast({ title: "Split allocation", message: !splitEnabled ? "Enabled" : "Disabled", kind: "info" });
                              }}
                              aria-label="Toggle split allocation"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", splitEnabled ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Premium: split allocation can reduce chargeback complexity and improve reporting.
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "allocation" ? (
                  <>
                    <Section
                      title="Allocation"
                      subtitle="Split allocation is premium. Cost centers are required for CorporatePay"
                      right={<Pill label={splitEnabled ? "Split" : "Single"} tone={splitEnabled ? "info" : "neutral"} />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Split allocation</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">Multi-cost-center cart</div>
                              <div className="mt-1 text-xs text-slate-500">Only works if policy allows</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill label={splitAllowed ? "Allowed" : "Not allowed"} tone={splitAllowed ? "good" : "warn"} />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Enable split allocation</div>
                              <div className="mt-1 text-xs text-slate-600">Assign cost center per cart item</div>
                            </div>
                            <button
                              type="button"
                              disabled={!splitAllowed}
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                splitEnabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
                                !splitAllowed && "cursor-not-allowed opacity-60"
                              )}
                              onClick={() => {
                                if (!splitAllowed) return;
                                setSplitEnabled((v) => !v);
                              }}
                              aria-label="Toggle split"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", splitEnabled ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            If split is disabled, you must assign one cost center for the entire order.
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-600">Purpose tag</div>
                          <div className="mt-1 text-xs text-slate-500">{purposeRequired ? "Required" : "Optional"} (policy-driven)</div>
                          <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className={cn(
                              "mt-3 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              purposeRequired && !purpose.trim() ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          >
                            <option value="">Select purpose</option>
                            {purposeTags.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          {purposeRequired && !purpose.trim() ? <div className="mt-2 text-xs font-semibold text-amber-700">Purpose is required</div> : null}

                          <div className="mt-4 text-xs font-semibold text-slate-600">Notes (optional)</div>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Optional context for approvers or audit"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                      </div>

                      {!splitEnabled ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-600">Global cost center</div>
                          <select
                            value={globalCostCenter}
                            onChange={(e) => setGlobalCostCenter(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              paymentMethod === "CorporatePay" && !globalCostCenter.trim() ? "border-amber-300 bg-white text-slate-900 focus:ring-amber-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                          >
                            <option value="">Select</option>
                            {costCenters.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          {!globalCostCenter.trim() && paymentMethod === "CorporatePay" ? <div className="mt-2 text-xs font-semibold text-amber-700">Cost center required</div> : null}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Per-item cost centers</div>
                          <div className="mt-1 text-xs text-slate-500">Premium: split cart allocation (policy-gated)</div>
                          <div className="mt-3 space-y-2">
                            {items.map((i) => (
                              <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">{i.marketplace} • {vendorsById[i.vendorId]?.name || "Vendor"} • {i.category}</div>
                                  </div>
                                  <div className="min-w-[220px]">
                                    <div className="text-xs font-semibold text-slate-600">Cost center</div>
                                    <select
                                      value={i.allocationCostCenter || ""}
                                      onChange={(e) =>
                                        setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, allocationCostCenter: e.target.value } : x)))
                                      }
                                      className={cn(
                                        "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                        i.allocationCostCenter ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                                      )}
                                    >
                                      <option value="">Select</option>
                                      {costCenters.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                    {!i.allocationCostCenter ? <div className="mt-2 text-xs font-semibold text-amber-700">Required</div> : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Allocation summary:
                            <div className="mt-2 flex flex-wrap gap-2">
                              {allocationSummary.map((x) => (
                                <Pill key={x.costCenter} label={`${x.costCenter}: ${formatUGX(x.total)}`} tone={x.costCenter === "Unassigned" ? "warn" : "neutral"} />
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: multi-cost-center cart split enables departmental chargeback.
                          </div>
                        </div>
                      )}
                    </Section>

                    <Section
                      title="Premium: preferred vendor nudges"
                      subtitle="Use approved vendor for instant approval"
                      right={<Pill label="Premium" tone="info" />}
                    >
                      <div className="space-y-2">
                        {vendorNudges.map((n) => (
                          <div key={n.itemId} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                                <div className="mt-1 text-sm text-slate-600">{n.desc}</div>
                              </div>
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                onClick={() => applyPatch({ replaceVendor: { itemId: n.itemId, newVendorId: n.newVendorId } })}
                              >
                                <Store className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                        {!vendorNudges.length ? (
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No vendor nudges right now.</div>
                        ) : null}
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "payment" ? (
                  <>
                    <Section title="Payment method" subtitle="CorporatePay option at checkout" right={<Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}>
                      <div className="space-y-2">
                        {paymentCards.map((m) => {
                          const selected = paymentMethod === m.id;
                          const isCorp = m.id === "CorporatePay";
                          const disabled = isCorp && corporateState === "Not available";

                          const badges = isCorp
                            ? [
                              { label: corporateState, tone: corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad" },
                              ...(corporateReason ? [{ label: corporateReason, tone: corporateState === "Not available" ? "bad" : "neutral" }] : []),
                            ]
                            : [];

                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                if (disabled) {
                                  toast({ title: "Unavailable", message: "CorporatePay is not available. Choose another method.", kind: "warn" });
                                  return;
                                }
                                setPaymentMethod(m.id);
                                toast({ title: "Payment selected", message: m.title, kind: "success" });
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
                                      {badges.map((b) => (
                                        <Pill key={`${m.id}-${b.label}`} label={b.label} tone={b.tone as any} />
                                      ))}
                                      {selected ? <Pill label="Selected" tone="info" /> : null}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600">{m.sub}</div>
                                  </div>
                                </div>
                                <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                                  {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                </div>
                              </div>

                              {isCorp ? (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                  {corporateState === "Not available"
                                    ? "CorporatePay is not available due to policy/funding. Use personal payment or contact admin."
                                    : corporateState === "Requires approval"
                                      ? "This cart will require approval under current policy."
                                      : "CorporatePay is available for this checkout."}
                                </div>
                              ) : (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">Personal payment does not require corporate approvals.</div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {paymentMethod === "CorporatePay" ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Corporate allocation (quick check)</div>
                              <div className="mt-1 text-xs text-slate-500">Purpose and cost center appear on receipts</div>
                            </div>
                            <Pill label={allocationOk ? "OK" : "Missing"} tone={allocationOk ? "good" : "warn"} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Pill label={`Purpose: ${purpose || (purposeRequired ? "Required" : "Optional")}`} tone={purpose ? "neutral" : purposeRequired ? "warn" : "neutral"} />
                            <Pill label={splitEnabled ? "Split allocation" : `Cost center: ${globalCostCenter || "Required"}`} tone={splitEnabled ? "info" : globalCostCenter ? "neutral" : "warn"} />
                          </div>
                        </div>
                      ) : null}
                    </Section>

                    <Section title="Corporate program status" subtitle="Demo controls" right={<Pill label={corporateStatus} tone={corporateStatus === "Eligible" ? "good" : graceActive ? "warn" : "bad"} />}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Status</div>
                          <select
                            value={corporateStatus}
                            onChange={(e) => setCorporateStatus(e.target.value as CorporateProgramStatus)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {([
                              "Eligible",
                              "Not linked",
                              "Not eligible",
                              "Deposit depleted",
                              "Credit limit exceeded",
                              "Billing delinquency",
                            ] as CorporateProgramStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <div className="mt-2 text-xs text-slate-500">Billing delinquency can show a grace window.</div>
                        </div>

                        <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", corporateStatus !== "Billing delinquency" && "opacity-60")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Grace window</div>
                              <div className="mt-1 text-xs text-slate-500">Premium</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={graceEnabled}
                              disabled={corporateStatus !== "Billing delinquency"}
                              onChange={(e) => setGraceEnabled(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-300"
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Pill label={graceActive ? `Active ${msToFriendly(graceMs)}` : "Inactive"} tone={graceActive ? "warn" : "neutral"} />
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => setGraceEndAt(Date.now() + 3 * 60 * 60 * 1000)}
                              disabled={corporateStatus !== "Billing delinquency"}
                            >
                              <RefreshCcw className="h-4 w-4" /> Reset
                            </Button>
                          </div>
                        </div>

                        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-600">Premium: split allocation policy</div>
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Allow multi-cost-center carts</div>
                              <div className="mt-1 text-xs text-slate-600">If disabled, split allocation must be off</div>
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                splitAllowed ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => {
                                setSplitAllowed((v) => !v);
                                if (splitAllowed) setSplitEnabled(false);
                              }}
                              aria-label="Toggle split allowed"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", splitAllowed ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "policy" ? (
                  <>
                    <Section
                      title="Policy result"
                      subtitle="Out-of-policy explanations + alternatives + exception request"
                      right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                    >
                      <div
                        className={cn(
                          "rounded-3xl border p-4",
                          policy.outcome === "Allowed"
                            ? "border-emerald-200 bg-emerald-50"
                            : policy.outcome === "Approval required"
                              ? "border-amber-200 bg-amber-50"
                              : "border-rose-200 bg-rose-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {policy.outcome === "Allowed" ? "Allowed" : policy.outcome === "Approval required" ? "Approval required" : "Blocked"}
                            </div>
                            <div className="mt-1 text-sm text-slate-700">
                              {policy.outcome === "Allowed"
                                ? "You can place this order now."
                                : policy.outcome === "Approval required"
                                  ? "Submit for approval, then place the order after approval."
                                  : "CorporatePay cannot proceed without changes or an exception."}
                            </div>
                          </div>
                          <div className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            policy.outcome === "Allowed" ? "bg-emerald-100 text-emerald-800" : policy.outcome === "Approval required" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"
                          )}>
                            {policy.outcome === "Allowed" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {policy.reasons.map((r) => (
                            <div key={`${r.code}-${r.title}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={r.code} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                  </div>
                                  <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {policy.outcome === "Allowed" ? (
                            <Button variant="primary" onClick={placeOrder}>
                              <ChevronRight className="h-4 w-4" /> Place order
                            </Button>
                          ) : null}

                          {policy.outcome === "Approval required" ? (
                            <Button variant="primary" onClick={submitApproval}>
                              <FileText className="h-4 w-4" /> Submit for approval
                            </Button>
                          ) : null}

                          {policy.outcome === "Blocked" ? (
                            <Button variant="outline" onClick={requestException}>
                              <AlertTriangle className="h-4 w-4" /> Request exception
                            </Button>
                          ) : null}

                          <Button
                            variant="outline"
                            onClick={() => {
                              setPaymentMethod("Personal Wallet");
                              toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" });
                            }}
                          >
                            <Wallet className="h-4 w-4" /> Pay personally
                          </Button>
                        </div>

                        {approvalId ? (
                          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Approval request created: <span className="font-semibold">{approvalId}</span>. Track in U13.
                          </div>
                        ) : null}
                      </div>
                    </Section>

                    <Section
                      title="Alternatives"
                      subtitle="Fix quickly"
                      right={<Pill label={`${policy.alternatives.length}`} tone="neutral" />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {policy.alternatives.map((a) => (
                          <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">{a.icon}</div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                    <Pill label={a.expected} tone={toneForOutcome(a.expected)} />
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">{a.desc}</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="mt-3">
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  applyPatch(a.patch);
                                }}
                              >
                                <ChevronRight className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Premium: preferred vendor nudges can unlock instant approvals.
                      </div>
                    </Section>

                    <Section title="Policy coach" subtitle="Premium: guidance and best practices" right={<Pill label="Premium" tone="info" />}>
                      <div className="space-y-2">
                        {policy.coach.map((c) => (
                          <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label="Coach" tone="info" />
                                  <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                              </div>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  if (c.patch) applyPatch(c.patch);
                                  else toast({ title: "Tip", message: c.desc, kind: "info" });
                                }}
                              >
                                <Sparkles className="h-4 w-4" /> Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                        {!policy.coach.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No coach tips.</div> : null}
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "receipt" ? (
                  <Section
                    title="Corporate receipt"
                    subtitle="Receipt per order (print / save as PDF)"
                    right={<Pill label={receipt ? receipt.orderId : "No order"} tone={receipt ? "good" : "neutral"} />}
                  >
                    {!receipt ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                        No receipt yet. Place an order to generate a receipt.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={receipt.corporate ? "CorporatePay" : "Personal"} tone={receipt.corporate ? "info" : "neutral"} />
                                <Pill label={receipt.marketplaceSummary} tone="neutral" />
                                <Pill label={receipt.vendorSummary} tone="neutral" />
                                <Pill label={receipt.splitAllocation ? "Multi-cost-center" : "Single"} tone={receipt.splitAllocation ? "info" : "neutral"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">Order {receipt.orderId}</div>
                              <div className="mt-1 text-xs text-slate-500">Receipt {receipt.id} • {fmtDateTime(receipt.createdAt)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Total</div>
                              <div className="text-2xl font-semibold text-slate-900">{formatUGX(receipt.totalUGX)}</div>
                              <div className="mt-1 text-xs text-slate-500">Payment: {receipt.paymentMethod}</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <InfoCell label="Purpose" value={receipt.purpose || "-"} />
                            <InfoCell label="Cost center" value={receipt.globalCostCenter || (receipt.splitAllocation ? "Split" : "-")} />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Items</div>
                          <div className="mt-3 space-y-2">
                            {receipt.items.map((i, idx) => (
                              <div key={`${i.name}-${idx}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {i.marketplace} • {i.vendor} • {i.category}
                                      {receipt.splitAllocation ? ` • CC: ${i.costCenter || "-"}` : ""}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <Pill label={`${i.qty} × ${formatUGX(i.unitUGX)}`} tone="neutral" />
                                      <Pill label={`Line: ${formatUGX(i.lineUGX)}`} tone="neutral" />
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                            Subtotal: <span className="font-semibold text-slate-900">{formatUGX(receipt.subtotalUGX)}</span>
                            <span className="mx-2">•</span>
                            Discount: <span className="font-semibold text-slate-900">-{formatUGX(receipt.discountUGX)}</span>
                            <span className="mx-2">•</span>
                            Total: <span className="font-semibold text-slate-900">{formatUGX(receipt.totalUGX)}</span>
                          </div>

                          {receipt.notes ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Notes: {receipt.notes}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
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
                            <Copy className="h-4 w-4" /> Copy receipt ID
                          </Button>
                          <Button variant="outline" onClick={() => exportReceiptToPrint(receipt)}>
                            <Download className="h-4 w-4" /> Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setReceipt(null);
                              setApprovalId("");
                              setStep("cart");
                              toast({ title: "New order", message: "Back to cart.", kind: "info" });
                            }}
                          >
                            <RefreshCcw className="h-4 w-4" /> New order
                          </Button>
                        </div>
                      </div>
                    )}
                  </Section>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Summary" subtitle="Live totals and key controls" right={<Pill label={formatUGX(subtotalUGX)} tone="neutral" />}>
                  <div className="space-y-2">
                    <InfoRow label="Marketplaces" value={marketplaceSummary} />
                    <InfoRow label="Vendors" value={vendorSummary} />
                    <InfoRow label="Payment" value={paymentMethod} emphasize={paymentMethod === "CorporatePay"} />
                    <InfoRow label="Split allocation" value={splitEnabled ? "Enabled" : "Disabled"} emphasize={splitEnabled} />
                    <InfoRow label="Purpose" value={purpose || (purposeRequired ? "Required" : "Optional")} emphasize={purposeRequired && !purpose.trim()} />
                    <InfoRow label="Policy" value={policy.outcome} emphasize={policy.outcome !== "Allowed"} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Tip: prefer allowlisted vendors to avoid approvals.
                  </div>
                </Section>

                <Section title="Premium features" subtitle="Toggle and preview" right={<Pill label="Premium" tone="info" />}>
                  <div className="space-y-3">
                    <ToggleRow
                      label="Split allocation"
                      desc="Multi-cost-center cart split"
                      enabled={splitEnabled}
                      disabled={!splitAllowed}
                      onToggle={() => setSplitEnabled((v) => !v)}
                      badge={splitAllowed ? "Allowed" : "Blocked"}
                    />
                    <ToggleRow
                      label="Strict CapEx allocation"
                      desc="Warn if CapEx items not on CAPEX-01/FLEET-01"
                      enabled={strictAllocationForCapex}
                      onToggle={() => setStrictAllocationForCapex((v) => !v)}
                      badge="Best practice"
                    />

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-600">Basket thresholds</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Approval</div>
                          <input
                            type="number"
                            value={basketApprovalUGX}
                            onChange={(e) => setBasketApprovalUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Hard stop</div>
                          <input
                            type="number"
                            value={basketBlockUGX}
                            onChange={(e) => setBasketBlockUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-600">MyLiveDealz thresholds</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Approval</div>
                          <input
                            type="number"
                            value={myliveApprovalUGX}
                            onChange={(e) => setMyliveApprovalUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Hard stop</div>
                          <input
                            type="number"
                            value={myliveBlockUGX}
                            onChange={(e) => setMyliveBlockUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-600">Unapproved vendor thresholds</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Approval</div>
                          <input
                            type="number"
                            value={unapprovedVendorApprovalUGX}
                            onChange={(e) => setUnapprovedVendorApprovalUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                        <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-600">Hard stop</div>
                          <input
                            type="number"
                            value={unapprovedVendorBlockUGX}
                            onChange={(e) => setUnapprovedVendorBlockUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="CorporatePay state" subtitle="Availability at checkout" right={<Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Reason</div>
                    <div className="mt-1 text-sm text-slate-600">{corporateReason || "Eligible"}</div>
                    <div className="mt-3 text-xs text-slate-500">If CorporatePay is unavailable, use U14 enforcement screens.</div>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => toast({ title: "Enforcement", message: "Open U14 (demo).", kind: "info" })}>
                        <AlertTriangle className="h-4 w-4" /> Enforcement
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={`Subtotal: ${formatUGX(subtotalUGX)}`} tone="neutral" />
                  <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                  {paymentMethod === "CorporatePay" ? <Pill label={allocationOk ? "Allocation OK" : "Allocation missing"} tone={allocationOk ? "good" : "warn"} /> : <Pill label="Personal" tone="info" />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={onBack} disabled={step === "cart"}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>
                  {step !== "receipt" ? (
                    <Button variant={canContinue ? "primary" : "outline"} onClick={onContinue} disabled={!canContinue}>
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setStep("cart")}>
                      <RefreshCcw className="h-4 w-4" /> Back to cart
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U17 E‑Commerce Checkout with CorporatePay. Core: CorporatePay option, vendor allow/deny, category restrictions, basket limits, corporate receipt per order. Premium: preferred vendor nudges and split allocation.
            </div>
          </div>
        </div>
      </div>

      {/* Exception modal */}
      <Modal
        open={exceptionOpen}
        title="Request exception"
        subtitle="Creates an approval request for an override"
        onClose={() => setExceptionOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExceptionOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitException}>
              <BadgeCheck className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`Subtotal ${formatUGX(subtotalUGX)}`} tone="neutral" />
              <Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
              <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
            </div>
            <div className="mt-3 text-sm text-slate-700">Explain why you need an exception and attach evidence if required.</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
              <textarea
                value={exceptionDraft.reason}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, reason: e.target.value }))}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Example: urgent purchase for client delivery"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Attachment name (optional)</div>
              <input
                value={exceptionDraft.attachmentName}
                onChange={(e) => setExceptionDraft((p) => ({ ...p, attachmentName: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Example: Quotation.pdf"
              />
              <div className="mt-2 text-xs text-slate-500">In production, this is file upload (photo/PDF).</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Notes (optional)</div>
            <textarea
              value={exceptionDraft.note}
              onChange={(e) => setExceptionDraft((p) => ({ ...p, note: e.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Extra context"
            />
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Exceptions are audited and may require higher-level approvals depending on amount and category.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-amber-900")}>{value}</div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  enabled,
  onToggle,
  disabled,
  badge,
}: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", disabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{label}</div>
            {badge ? <Pill label={badge} tone="neutral" /> : null}
          </div>
          <div className="mt-1 text-xs text-slate-600">{desc}</div>
        </div>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "relative h-7 w-12 rounded-full border transition",
            enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
            disabled && "cursor-not-allowed"
          )}
          onClick={() => {
            if (disabled) return;
            onToggle();
          }}
          aria-label={label}
        >
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
        </button>
      </div>
    </div>
  );
}

function PhoneSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7.5 3.5h9A2.5 2.5 0 0 1 19 6v12a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6A2.5 2.5 0 0 1 7.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 6.8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18.3h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
