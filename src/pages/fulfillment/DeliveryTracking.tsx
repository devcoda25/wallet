import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  MessageSquare,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Tab = "Overview" | "Proofs" | "Handover" | "Commissioning" | "Warranty" | "Payments" | "Timeline";

type Currency = "UGX" | "USD";

type ProofStatus = "Pending" | "Uploaded" | "Verified" | "Rejected";

type FulfillmentStage =
  | "Awaiting dispatch"
  | "In transit"
  | "Delivered"
  | "Accepted"
  | "Commissioned"
  | "Warranty active"
  | "Closed";

type ChecklistStatus = "Pending" | "Done";

type DisputeStatus = "Open" | "In review" | "Resolved";

type Severity = "Low" | "Medium" | "High";

type PaymentGate = "Locked" | "Eligible" | "Requested" | "Paid" | "On hold";

type POItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  warrantyMonths: number;
};

type PurchaseOrder = {
  poNumber: string;
  rfqId: string;
  quoteId: string;
  vendorName: string;
  vendorStatus: "Preferred" | "Allowlisted" | "Unapproved";
  currency: Currency;
  createdAt: number;
  expectedDeliveryAt: number;
  deliveryLocation: string;
  costCenter: string;
  group: string;
  capType: "CapEx" | "OpEx";
  projectTag: string;
  items: POItem[];
  shipping: number;
  tax: number;
  notes: string;
};

type Proof = {
  id: string;
  type: "Packing list" | "Delivery note" | "Photos" | "Customs docs" | "Commissioning report" | "Other";
  required: boolean;
  status: ProofStatus;
  fileName?: string;
  uploadedAt?: number;
  verifiedAt?: number;
  rejectedAt?: number;
  note?: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  status: ChecklistStatus;
  note?: string;
};

type AssetRow = {
  id: string;
  assetTag: string;
  serialNo: string;
  condition: "Good" | "Minor issues" | "Damaged";
  accessoriesComplete: boolean;
  accepted: boolean;
};

type Dispute = {
  id: string;
  createdAt: number;
  createdBy: string;
  severity: Severity;
  title: string;
  detail: string;
  status: DisputeStatus;
  vendorNotified: boolean;
  evidenceFiles: string[];
};

type Milestone = {
  id: string;
  label: "Deposit" | "Delivery" | "Commissioning";
  pct: number;
  dueAt: number;
  gate: PaymentGate;
  lastActionAt?: number;
  note?: string;
};

type Event = {
  id: string;
  ts: number;
  title: string;
  detail: string;
  tone: "info" | "good" | "warn" | "bad";
};

type Warranty = {
  startAt?: number;
  endAt?: number;
  startsOn: "Acceptance" | "Commissioning";
  registrationId?: string;
  provider: string;
  contact: string;
  coverageSummary: string;
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

function formatMoney(n: number, ccy: Currency) {
  const v = Math.round(Number(n || 0));
  return `${ccy} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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

function daysBetween(aTs: number, bTs: number) {
  return Math.round((bTs - aTs) / (24 * 60 * 60 * 1000));
}

function msToFriendly(ms: number) {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function pillToneForTone(t: Event["tone"]) {
  if (t === "good") return "good" as const;
  if (t === "warn") return "warn" as const;
  if (t === "bad") return "bad" as const;
  return "info" as const;
}

function toneForProof(s: ProofStatus) {
  if (s === "Verified") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  if (s === "Uploaded") return "info" as const;
  return "warn" as const;
}

function toneForGate(g: PaymentGate) {
  if (g === "Paid") return "good" as const;
  if (g === "Eligible") return "info" as const;
  if (g === "Requested") return "warn" as const;
  if (g === "On hold") return "bad" as const;
  return "neutral" as const;
}

function toneForStage(s: FulfillmentStage) {
  if (s === "Closed") return "neutral" as const;
  if (s === "Warranty active") return "good" as const;
  if (s === "Commissioned") return "good" as const;
  if (s === "Accepted") return "good" as const;
  if (s === "Delivered") return "info" as const;
  if (s === "In transit") return "info" as const;
  return "warn" as const;
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
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

function exportToPrint(title: string, html: string) {
  const w = window.open("", "_blank", "width=980,height=820");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .muted{color:#64748b; font-size:12px;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:16px;}
          table{width:100%; border-collapse:collapse;}
          th,td{padding:10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:left;}
          th{color:#475569; font-size:11px;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:800;}
          .total{font-size:18px; font-weight:900;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        ${html}
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

function escapeHtml(str: string | number | undefined | null) {
  const s = String(str || "");
  return s.replace(/[&<>"']/g, (m) => {
    const map: any = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[m] || m;
  });
}

export default function CorporatePayU32POFulfillmentDeliveryTracking() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<Tab>("Overview");

  const po = useMemo<PurchaseOrder>(() => {
    const createdAt = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const expectedDeliveryAt = createdAt + 18 * 24 * 60 * 60 * 1000;
    return {
      poNumber: "PO-2026-0007",
      rfqId: "RFQ-VEH-2026-014",
      quoteId: "Q-VEH-01",
      vendorName: "EVmart Dealer Network",
      vendorStatus: "Preferred",
      currency: "UGX",
      createdAt,
      expectedDeliveryAt,
      deliveryLocation: "Kampala, Uganda",
      costCenter: "CAPEX-01",
      group: "Operations",
      capType: "CapEx",
      projectTag: "Fleet refresh",
      items: [
        { id: "i1", name: "EV Vehicle (Corporate Spec)", qty: 2, unitPrice: 98000000, warrantyMonths: 24 },
      ],
      shipping: 3500000,
      tax: 0,
      notes: "Include commissioning checklist before final payment.",
    };
  }, []);

  const poSubtotal = useMemo(() => po.items.reduce((a, i) => a + i.qty * i.unitPrice, 0), [po.items]);
  const poTotal = useMemo(() => poSubtotal + po.shipping + po.tax, [poSubtotal, po.shipping, po.tax]);

  // Fulfillment state
  const [stage, setStage] = useState<FulfillmentStage>("In transit");
  const [dispatchAt, setDispatchAt] = useState<number>(Date.now() - 24 * 60 * 60 * 1000);
  const [deliveredAt, setDeliveredAt] = useState<number | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<number | null>(null);
  const [commissionedAt, setCommissionedAt] = useState<number | null>(null);

  const [policy, setPolicy] = useState({
    requireVerifiedProofs: true,
    requireCommissioningForWarranty: true,
    warrantyStartsOn: "Commissioning" as Warranty["startsOn"],
    gateDeliveryPaymentOnAcceptance: true,
    gateFinalPaymentOnCommissioning: true,
  });

  // Proofs
  const [proofs, setProofs] = useState<Proof[]>(() => [
    { id: uid("pf"), type: "Packing list", required: true, status: "Uploaded", fileName: "PackingList.pdf", uploadedAt: Date.now() - 20 * 60 * 60 * 1000 },
    { id: uid("pf"), type: "Delivery note", required: true, status: "Pending" },
    { id: uid("pf"), type: "Photos", required: true, status: "Pending" },
    { id: uid("pf"), type: "Customs docs", required: false, status: "Pending" },
  ]);

  const [proofDraft, setProofDraft] = useState<{ type: Proof["type"]; fileName: string; note: string }>({
    type: "Delivery note",
    fileName: "",
    note: "",
  });

  // Handover checklist
  const [handoverChecklist, setHandoverChecklist] = useState<ChecklistItem[]>(() => [
    { id: uid("hc"), label: "Record serial numbers", required: true, status: "Pending" },
    { id: uid("hc"), label: "Inspect physical condition", required: true, status: "Pending" },
    { id: uid("hc"), label: "Accessories and manuals delivered", required: true, status: "Pending" },
    { id: uid("hc"), label: "Safety and compliance docs received", required: true, status: "Pending" },
    { id: uid("hc"), label: "Acceptance sign-off captured", required: true, status: "Pending" },
  ]);

  const [assets, setAssets] = useState<AssetRow[]>(() => [
    { id: uid("as"), assetTag: "EV-001", serialNo: "SN-EV-AX12", condition: "Good", accessoriesComplete: true, accepted: false },
    { id: uid("as"), assetTag: "EV-002", serialNo: "SN-EV-AX13", condition: "Good", accessoriesComplete: true, accepted: false },
  ]);

  // Commissioning
  const [commissionChecklist, setCommissionChecklist] = useState<ChecklistItem[]>(() => [
    { id: uid("cc"), label: "Power-on test", required: true, status: "Pending" },
    { id: uid("cc"), label: "Software/firmware updated", required: true, status: "Pending" },
    { id: uid("cc"), label: "Safety checks passed", required: true, status: "Pending" },
    { id: uid("cc"), label: "User training delivered", required: false, status: "Pending" },
    { id: uid("cc"), label: "Commissioning report uploaded", required: true, status: "Pending" },
  ]);

  // Warranty
  const [warranty, setWarranty] = useState<Warranty>(() => ({
    startsOn: "Commissioning",
    provider: "EVmart Dealer Network",
    contact: "support@vendor.com",
    coverageSummary: "Battery and drivetrain coverage. Terms in Warranty.pdf",
  }));

  // Disputes
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeDraft, setDisputeDraft] = useState<{ severity: Severity; title: string; detail: string; evidence: string }>({
    severity: "Medium",
    title: "",
    detail: "",
    evidence: "",
  });

  // Milestones and gating
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return [
      { id: uid("ms"), label: "Deposit", pct: 20, dueAt: now - 2 * day, gate: "Paid", lastActionAt: now - 2 * day, note: "Deposit paid" },
      { id: uid("ms"), label: "Delivery", pct: 60, dueAt: now + 10 * day, gate: "Locked" },
      { id: uid("ms"), label: "Commissioning", pct: 20, dueAt: now + 20 * day, gate: "Locked" },
    ];
  });

  // Timeline
  const [events, setEvents] = useState<Event[]>(() => {
    const now = Date.now();
    return [
      { id: uid("ev"), ts: now - 24 * 60 * 60 * 1000, title: "Dispatched", detail: "Vendor marked items as dispatched.", tone: "info" },
      { id: uid("ev"), ts: now - 3 * 24 * 60 * 60 * 1000, title: "PO created", detail: `${po.poNumber} created from quote ${po.quoteId}.`, tone: "info" },
      { id: uid("ev"), ts: now - 3 * 24 * 60 * 60 * 1000, title: "Quote selected", detail: "Preferred quote selected and converted to PO.", tone: "info" },
    ];
  });

  const addEvent = (e: Omit<Event, "id">) => setEvents((p) => [{ id: uid("ev"), ...e }, ...p]);

  // Derived checks
  const requiredProofs = useMemo(() => proofs.filter((p) => p.required), [proofs]);
  const requiredProofsSatisfied = useMemo(() => {
    if (!requiredProofs.length) return true;
    return requiredProofs.every((p) => (policy.requireVerifiedProofs ? p.status === "Verified" : p.status === "Uploaded" || p.status === "Verified"));
  }, [requiredProofs, policy.requireVerifiedProofs]);

  const handoverChecklistSatisfied = useMemo(() => {
    return handoverChecklist.filter((c) => c.required).every((c) => c.status === "Done");
  }, [handoverChecklist]);

  const assetsAccepted = useMemo(() => assets.length > 0 && assets.every((a) => a.accepted), [assets]);

  const commissioningSatisfied = useMemo(() => {
    return commissionChecklist.filter((c) => c.required).every((c) => c.status === "Done");
  }, [commissionChecklist]);

  const canMarkDelivered = useMemo(() => stage === "In transit" || stage === "Awaiting dispatch", [stage]);
  const canAccept = useMemo(() => stage === "Delivered" && requiredProofsSatisfied && handoverChecklistSatisfied && assetsAccepted, [stage, requiredProofsSatisfied, handoverChecklistSatisfied, assetsAccepted]);
  const canCommission = useMemo(() => (stage === "Accepted" || stage === "Delivered") && commissioningSatisfied, [stage, commissioningSatisfied]);

  const computedWarrantyStart = useMemo(() => {
    if (policy.warrantyStartsOn === "Acceptance") return acceptedAt;
    return commissionedAt;
  }, [policy.warrantyStartsOn, acceptedAt, commissionedAt]);

  const warrantyMonths = useMemo(() => {
    // Use the max warranty months across items
    return Math.max(...po.items.map((i) => i.warrantyMonths));
  }, [po.items]);

  const warrantyEnd = useMemo(() => {
    if (!computedWarrantyStart) return null;
    const d = new Date(computedWarrantyStart);
    d.setMonth(d.getMonth() + warrantyMonths);
    return d.getTime();
  }, [computedWarrantyStart, warrantyMonths]);

  // Keep warranty state in sync
  useEffect(() => {
    setWarranty((w) => ({
      ...w,
      startsOn: policy.warrantyStartsOn,
      startAt: computedWarrantyStart || undefined,
      endAt: warrantyEnd || undefined,
    }));
  }, [policy.warrantyStartsOn, computedWarrantyStart, warrantyEnd]);

  // Update milestone gating based on stage and policy
  useEffect(() => {
    setMilestones((prev) => {
      const next = prev.map((m) => ({ ...m }));

      const deliveryOk = stage === "Delivered" || stage === "Accepted" || stage === "Commissioned" || stage === "Warranty active" || stage === "Closed";
      const acceptedOk = stage === "Accepted" || stage === "Commissioned" || stage === "Warranty active" || stage === "Closed";
      const commissionedOk = stage === "Commissioned" || stage === "Warranty active" || stage === "Closed";

      for (const m of next) {
        if (m.label === "Deposit") continue;

        if (m.label === "Delivery") {
          if (m.gate === "Paid") continue;
          const eligible = policy.gateDeliveryPaymentOnAcceptance ? acceptedOk : deliveryOk;
          if (eligible && (m.gate === "Locked" || m.gate === "On hold")) m.gate = "Eligible";
          if (!eligible && m.gate === "Eligible") m.gate = "Locked";
        }

        if (m.label === "Commissioning") {
          if (m.gate === "Paid") continue;
          const eligible = policy.gateFinalPaymentOnCommissioning ? commissionedOk : acceptedOk;
          if (eligible && (m.gate === "Locked" || m.gate === "On hold")) m.gate = "Eligible";
          if (!eligible && m.gate === "Eligible") m.gate = "Locked";
        }
      }

      return next;
    });
  }, [stage, policy.gateDeliveryPaymentOnAcceptance, policy.gateFinalPaymentOnCommissioning]);

  // Actions
  const addProof = () => {
    if (!proofDraft.fileName.trim()) {
      toast({ title: "File name required", message: "Add a file name (simulated upload).", kind: "warn" });
      return;
    }

    setProofs((p) => [
      {
        id: uid("pf"),
        type: proofDraft.type,
        required: proofDraft.type === "Packing list" || proofDraft.type === "Delivery note" || proofDraft.type === "Photos",
        status: "Uploaded",
        fileName: proofDraft.fileName.trim(),
        uploadedAt: Date.now(),
        note: proofDraft.note.trim() || undefined,
      },
      ...p,
    ]);

    addEvent({ ts: Date.now(), title: "Proof uploaded", detail: `${proofDraft.type} uploaded (${proofDraft.fileName.trim()}).`, tone: "info" });
    toast({ title: "Uploaded", message: "Proof uploaded.", kind: "success" });
    setProofDraft({ type: proofDraft.type, fileName: "", note: "" });
  };

  const verifyProof = (id: string) => {
    setProofs((p) => p.map((x) => (x.id === id ? { ...x, status: "Verified", verifiedAt: Date.now() } : x)));
    addEvent({ ts: Date.now(), title: "Proof verified", detail: `Proof ${id} verified.`, tone: "good" });
    toast({ title: "Verified", message: "Proof marked verified.", kind: "success" });
  };

  const rejectProof = (id: string) => {
    setProofs((p) => p.map((x) => (x.id === id ? { ...x, status: "Rejected", rejectedAt: Date.now(), note: "Rejected (demo)" } : x)));
    addEvent({ ts: Date.now(), title: "Proof rejected", detail: `Proof ${id} rejected.`, tone: "warn" });
    toast({ title: "Rejected", message: "Proof rejected.", kind: "warn" });
  };

  const markDelivered = () => {
    const now = Date.now();
    setDeliveredAt(now);
    setStage("Delivered");
    addEvent({ ts: now, title: "Delivered", detail: "Shipment delivered to site.", tone: "info" });
    toast({ title: "Delivered", message: "Marked as delivered.", kind: "success" });
  };

  const acceptDelivery = () => {
    if (!canAccept) {
      toast({
        title: "Cannot accept",
        message: "Complete required proofs, checklist and asset acceptance.",
        kind: "warn",
      });
      return;
    }

    const now = Date.now();
    setAcceptedAt(now);
    setStage("Accepted");
    addEvent({ ts: now, title: "Accepted", detail: "Handover accepted and signed.", tone: "good" });
    toast({ title: "Accepted", message: "Handover accepted.", kind: "success" });
  };

  const markCommissioned = () => {
    if (!canCommission) {
      toast({ title: "Cannot commission", message: "Complete required commissioning checklist first.", kind: "warn" });
      return;
    }

    const now = Date.now();
    setCommissionedAt(now);
    setStage("Commissioned");
    addEvent({ ts: now, title: "Commissioned", detail: "Commissioning completed.", tone: "good" });
    toast({ title: "Commissioned", message: "Commissioning marked complete.", kind: "success" });

    // Warranty start auto if configured
    if (policy.warrantyStartsOn === "Commissioning") {
      setStage("Warranty active");
      addEvent({ ts: now, title: "Warranty started", detail: "Warranty started on commissioning.", tone: "good" });
    }
  };

  const startWarrantyManually = () => {
    const now = Date.now();
    if (policy.requireCommissioningForWarranty && !commissionedAt) {
      toast({ title: "Commissioning required", message: "Policy requires commissioning before warranty starts.", kind: "warn" });
      return;
    }
    setWarranty((w) => ({ ...w, startAt: now, endAt: (() => { const d = new Date(now); d.setMonth(d.getMonth() + warrantyMonths); return d.getTime(); })() }));
    setStage("Warranty active");
    addEvent({ ts: now, title: "Warranty started", detail: "Warranty started manually.", tone: "good" });
    toast({ title: "Warranty", message: "Warranty started.", kind: "success" });
  };

  const registerWarranty = () => {
    const id = `WR-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setWarranty((w) => ({ ...w, registrationId: id }));
    addEvent({ ts: Date.now(), title: "Warranty registered", detail: `Warranty registration ${id} created.`, tone: "info" });
    toast({ title: "Registered", message: "Warranty registered.", kind: "success" });
  };

  const requestMilestoneRelease = (id: string) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, gate: "Requested", lastActionAt: Date.now(), note: "Requested release" } : m)));
    addEvent({ ts: Date.now(), title: "Milestone requested", detail: `Requested payment release for milestone ${id}.`, tone: "info" });
    toast({ title: "Requested", message: "Payment release requested.", kind: "success" });
  };

  const markMilestonePaid = (id: string) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, gate: "Paid", lastActionAt: Date.now(), note: "Paid" } : m)));
    addEvent({ ts: Date.now(), title: "Milestone paid", detail: `Milestone ${id} marked as paid.`, tone: "good" });
    toast({ title: "Paid", message: "Milestone marked paid.", kind: "success" });

    // If final milestone paid, close PO
    const next = milestones.map((m) => (m.id === id ? { ...m, gate: "Paid" as const } : m));
    const allPaid = next.every((m) => m.gate === "Paid");
    if (allPaid) {
      setStage("Closed");
      addEvent({ ts: Date.now(), title: "Closed", detail: "All milestones paid. PO closed.", tone: "info" });
      toast({ title: "Closed", message: "PO closed.", kind: "success" });
    }
  };

  const openDispute = () => {
    setDisputeDraft({ severity: "Medium", title: "", detail: "", evidence: "" });
    setDisputeOpen(true);
  };

  const submitDispute = () => {
    if (disputeDraft.title.trim().length < 4 || disputeDraft.detail.trim().length < 10) {
      toast({ title: "More detail needed", message: "Add a clearer title and detail.", kind: "warn" });
      return;
    }

    const d: Dispute = {
      id: `DSP-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
      createdBy: "Warehouse",
      severity: disputeDraft.severity,
      title: disputeDraft.title.trim(),
      detail: disputeDraft.detail.trim(),
      status: "Open",
      vendorNotified: true,
      evidenceFiles: disputeDraft.evidence.trim() ? disputeDraft.evidence.split(",").map((x) => x.trim()).filter(Boolean) : [],
    };

    setDisputes((p) => [d, ...p]);

    // Put gates on hold
    setMilestones((prev) => prev.map((m) => (m.gate === "Eligible" || m.gate === "Requested" ? { ...m, gate: "On hold", note: `On hold due to dispute ${d.id}` } : m)));

    addEvent({ ts: Date.now(), title: "Dispute opened", detail: `${d.id} opened. Payments placed on hold.",`, tone: "warn" });
    toast({ title: "Dispute opened", message: "Payments moved to On hold.", kind: "warn" });
    setDisputeOpen(false);
  };

  // Helpers for UI
  const stageProgressPct = useMemo(() => {
    const order: FulfillmentStage[] = ["Awaiting dispatch", "In transit", "Delivered", "Accepted", "Commissioned", "Warranty active", "Closed"];
    const idx = order.indexOf(stage);
    return Math.round(((idx + 1) / order.length) * 100);
  }, [stage]);

  const lateDelivery = useMemo(() => {
    if (!deliveredAt) return false;
    return deliveredAt > po.expectedDeliveryAt;
  }, [deliveredAt, po.expectedDeliveryAt]);

  const expectedInMs = useMemo(() => po.expectedDeliveryAt - Date.now(), [po.expectedDeliveryAt]);

  const deliveryHeadline = useMemo(() => {
    if (stage === "Delivered" || stage === "Accepted" || stage === "Commissioned" || stage === "Warranty active" || stage === "Closed") {
      return deliveredAt ? `Delivered on ${fmtDate(deliveredAt)}` : "Delivered";
    }
    if (stage === "In transit") return `ETA ${fmtDate(po.expectedDeliveryAt)} (${expectedInMs > 0 ? msToFriendly(expectedInMs) : "past"})`;
    return "Awaiting dispatch";
  }, [stage, deliveredAt, po.expectedDeliveryAt, expectedInMs]);

  const enforcement = useMemo(() => {
    const hasOpenDispute = disputes.some((d) => d.status !== "Resolved");
    if (hasOpenDispute) return { state: "Hold" as const, detail: "Payments are on hold due to an open dispute." };
    if (lateDelivery) return { state: "Warn" as const, detail: "Delivery is past the expected date. Audit tracking active." };
    return { state: "OK" as const, detail: "All systems green. Milestones will release as gates are met." };
  }, [disputes, lateDelivery]);

  const exportHandoverPack = () => {
    const proofLines = proofs
      .slice()
      .reverse()
      .map((p) => `
        <tr>
          <td>${escapeHtml(p.type)}</td>
          <td>${escapeHtml(p.required ? "Required" : "Optional")}</td>
          <td>${escapeHtml(p.status)}</td>
          <td>${escapeHtml(p.fileName || "-")}</td>
        </tr>
      `)
      .join("\n");

    const checklistLines = handoverChecklist
      .map((c) => `
        <tr>
          <td>${escapeHtml(c.label)}</td>
          <td>${escapeHtml(c.required ? "Required" : "Optional")}</td>
          <td>${escapeHtml(c.status)}</td>
        </tr>
      `)
      .join("\n");

    const assetLines = assets
      .map((a) => `
        <tr>
          <td>${escapeHtml(a.assetTag)}</td>
          <td>${escapeHtml(a.serialNo)}</td>
          <td>${escapeHtml(a.condition)}</td>
          <td>${escapeHtml(a.accessoriesComplete ? "Yes" : "No")}</td>
          <td>${escapeHtml(a.accepted ? "Accepted" : "Pending")}</td>
        </tr>
      `)
      .join("\n");

    const html = `
      <div class="row" style="display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; align-items:flex-start;">
        <div>
          <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">Handover pack</div>
          <h1 style="margin-top:10px;">${escapeHtml(po.poNumber)} • ${escapeHtml(po.vendorName)}</h1>
          <div class="muted" style="margin-top:6px;">Delivery: ${escapeHtml(po.deliveryLocation)} • Cost center: ${escapeHtml(po.costCenter)} • ${escapeHtml(po.capType)}</div>
        </div>
        <div style="text-align:right;">
          <div class="muted">PO Total</div>
          <div class="total">${escapeHtml(formatMoney(poTotal, po.currency))}</div>
          <div class="muted" style="margin-top:6px;">Stage: ${escapeHtml(stage)}</div>
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="muted">Proofs</div>
        <table>
          <thead>
            <tr><th>Type</th><th>Required</th><th>Status</th><th>File</th></tr>
          </thead>
          <tbody>
            ${proofLines}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="muted">Handover checklist</div>
        <table>
          <thead>
            <tr><th>Item</th><th>Required</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${checklistLines}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="muted">Assets</div>
        <table>
          <thead>
            <tr><th>Tag</th><th>Serial</th><th>Condition</th><th>Accessories</th><th>Accepted</th></tr>
          </thead>
          <tbody>
            ${assetLines}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="muted">Commissioning and warranty</div>
        <div style="margin-top:8px; font-weight:800;">Commissioned: ${escapeHtml(commissionedAt ? fmtDateTime(commissionedAt) : "Not yet")}</div>
        <div class="muted" style="margin-top:6px;">Warranty starts on: ${escapeHtml(policy.warrantyStartsOn)}</div>
        <div class="muted" style="margin-top:6px;">Warranty start: ${escapeHtml(warranty.startAt ? fmtDateTime(warranty.startAt) : "Not started")}</div>
        <div class="muted" style="margin-top:6px;">Warranty end: ${escapeHtml(warranty.endAt ? fmtDateTime(warranty.endAt) : "-")}</div>
      </div>
    `;

    exportToPrint(`${po.poNumber} - Handover Pack`, html);
    toast({ title: "Export", message: "Print dialog opened. Use Save as PDF.", kind: "info" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">U32 PO Fulfillment and Delivery Tracking</div>
                  <div className="mt-1 text-xs text-slate-500">Proofs, handover checklist, commissioning, and warranty start. Links to milestone payment gating.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={po.poNumber} tone="neutral" />
                    <Pill label={po.capType} tone={po.capType === "CapEx" ? "info" : "neutral"} />
                    <Pill label={po.vendorName} tone={po.vendorStatus === "Preferred" ? "info" : "neutral"} />
                    <Pill label={`Total: ${formatMoney(poTotal, po.currency)}`} tone="neutral" />
                    <Pill label={`Stage: ${stage}`} tone={toneForStage(stage)} />
                    {lateDelivery ? <Pill label="Late delivery" tone="warn" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportHandoverPack}>
                  <Download className="h-4 w-4" /> Export handover pack
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Notify", message: "Vendor notified (demo).", kind: "info" })}>
                  <Bell className="h-4 w-4" /> Notify vendor
                </Button>
                <Button variant={canMarkDelivered ? "primary" : "outline"} onClick={markDelivered} disabled={!canMarkDelivered}>
                  <ChevronRight className="h-4 w-4" /> Mark delivered
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(["Overview", "Proofs", "Handover", "Commissioning", "Warranty", "Payments", "Timeline"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t ? { background: EVZ.green } : undefined}
                >
                  {t}
                </button>
              ))}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <div className="font-semibold">Delivery</div>
                  <div className="mt-1">{deliveryHeadline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-8 space-y-4">
                {tab === "Overview" ? (
                  <>
                    <Section
                      title="Fulfillment progress"
                      subtitle="This is the post-PO execution layer that makes milestone payments safe."
                      right={<Pill label={`${stageProgressPct}%`} tone="info" />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className={cn("rounded-3xl border p-4", requiredProofsSatisfied ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Proofs</div>
                              <div className="mt-1 text-sm text-slate-700">
                                {requiredProofsSatisfied ? "Ready" : "Missing or unverified"}
                              </div>
                              <div className="mt-2 text-xs text-slate-600">Required proofs: {requiredProofs.length}</div>
                            </div>
                            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", requiredProofsSatisfied ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                              {requiredProofsSatisfied ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                            </div>
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" className="w-full" onClick={() => setTab("Proofs")}> <ChevronRight className="h-4 w-4" /> Manage proofs</Button>
                          </div>
                        </div>

                        <div className={cn("rounded-3xl border p-4", handoverChecklistSatisfied && assetsAccepted ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Handover</div>
                              <div className="mt-1 text-sm text-slate-700">{handoverChecklistSatisfied && assetsAccepted ? "Ready" : "Pending"}</div>
                              <div className="mt-2 text-xs text-slate-600">Assets accepted: {assets.filter((a) => a.accepted).length}/{assets.length}</div>
                            </div>
                            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", handoverChecklistSatisfied && assetsAccepted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                              {handoverChecklistSatisfied && assetsAccepted ? <BadgeCheck className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setTab("Handover")}>
                              <ChevronRight className="h-4 w-4" /> Checklist
                            </Button>
                            <Button variant={canAccept ? "primary" : "outline"} className="flex-1" onClick={acceptDelivery} disabled={!canAccept}>
                              <BadgeCheck className="h-4 w-4" /> Accept
                            </Button>
                          </div>
                        </div>

                        <div className={cn("rounded-3xl border p-4", commissioningSatisfied ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Commissioning</div>
                              <div className="mt-1 text-sm text-slate-700">{commissioningSatisfied ? "Ready" : "Pending"}</div>
                              <div className="mt-2 text-xs text-slate-600">Policy: warranty starts on {policy.warrantyStartsOn}</div>
                            </div>
                            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", commissioningSatisfied ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                              {commissioningSatisfied ? <BadgeCheck className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setTab("Commissioning")}>
                              <ChevronRight className="h-4 w-4" /> Checklist
                            </Button>
                            <Button variant={canCommission ? "primary" : "outline"} className="flex-1" onClick={markCommissioned} disabled={!canCommission}>
                              <Wrench className="h-4 w-4" /> Mark complete
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "mt-4 rounded-3xl border p-4",
                        enforcement.state === "OK" ? "border-emerald-200 bg-emerald-50" : enforcement.state === "Hold" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Enforcement</div>
                            <div className="mt-1 text-sm text-slate-700">{enforcement.detail}</div>
                            <div className="mt-2 text-xs text-slate-600">
                              Delivery milestone gate: {policy.gateDeliveryPaymentOnAcceptance ? "requires acceptance" : "requires delivery"}. Final milestone gate: {policy.gateFinalPaymentOnCommissioning ? "requires commissioning" : "requires acceptance"}.
                            </div>
                          </div>
                          <Pill label={enforcement.state} tone={enforcement.state === "OK" ? "good" : enforcement.state === "Hold" ? "warn" : "bad"} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => setTab("Payments")}> <Wallet className="h-4 w-4" /> View payment gates</Button>
                          <Button variant="outline" onClick={openDispute}> <AlertTriangle className="h-4 w-4" /> Raise issue</Button>
                          <Button variant="outline" onClick={() => setTab("Timeline")}> <ChevronRight className="h-4 w-4" /> Timeline</Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-7">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">PO summary</div>
                                <div className="mt-1 text-xs text-slate-500">What was ordered</div>
                              </div>
                              <Pill label={po.capType} tone={po.capType === "CapEx" ? "info" : "neutral"} />
                            </div>
                            <div className="mt-3 space-y-2">
                              {po.items.map((i) => (
                                <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                                      <div className="mt-1 text-xs text-slate-500">Qty {i.qty} • Warranty {i.warrantyMonths} months</div>
                                    </div>
                                    <Pill label={formatMoney(i.qty * i.unitPrice, po.currency)} tone="neutral" />
                                  </div>
                                </div>
                              ))}
                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">Shipping</span>
                                  <span className="font-semibold">{formatMoney(po.shipping, po.currency)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="font-semibold">Tax</span>
                                  <span className="font-semibold">{formatMoney(po.tax, po.currency)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="font-black">Total</span>
                                  <span className="font-black">{formatMoney(poTotal, po.currency)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                              Delivery location: {po.deliveryLocation} • Cost center: {po.costCenter} • Project: {po.projectTag}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-5">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Warranty</div>
                                <div className="mt-1 text-xs text-slate-500">Start and end are triggered by acceptance/commissioning</div>
                              </div>
                              <Pill label={warranty.startAt ? "Active" : "Not started"} tone={warranty.startAt ? "good" : "warn"} />
                            </div>
                            <div className="mt-3 space-y-2">
                              <InfoRow label="Starts on" value={policy.warrantyStartsOn} emphasize />
                              <InfoRow label="Start date" value={warranty.startAt ? fmtDateTime(warranty.startAt) : "Not started"} />
                              <InfoRow label="End date" value={warranty.endAt ? fmtDateTime(warranty.endAt) : "-"} />
                              <InfoRow label="Registration" value={warranty.registrationId || "Not registered"} emphasize={!warranty.registrationId} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => setTab("Warranty")}>
                                <ChevronRight className="h-4 w-4" /> Warranty details
                              </Button>
                              <Button variant="primary" onClick={registerWarranty} disabled={!!warranty.registrationId}>
                                <ClipboardCheck className="h-4 w-4" /> Register
                              </Button>
                            </div>
                            {!warranty.startAt ? (
                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Warranty starts automatically when the start condition is met.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {tab === "Proofs" ? (
                  <Section
                    title="Proofs"
                    subtitle="Upload and verify proofs before handover acceptance."
                    right={<Pill label={policy.requireVerifiedProofs ? "Require verified" : "Uploaded ok"} tone="info" />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Add proof</div>
                              <div className="mt-1 text-xs text-slate-500">Simulated upload by file name</div>
                            </div>
                            <Pill label="Core" tone="neutral" />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Type</div>
                              <select
                                value={proofDraft.type}
                                onChange={(e) => setProofDraft((p) => ({ ...p, type: e.target.value as any }))}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                              >
                                {(["Packing list", "Delivery note", "Photos", "Customs docs", "Commissioning report", "Other"] as Proof["type"][]).map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-600">File name</div>
                              <input
                                value={proofDraft.fileName}
                                onChange={(e) => setProofDraft((p) => ({ ...p, fileName: e.target.value }))}
                                placeholder="Example: DeliveryNote.pdf"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <div className="text-xs font-semibold text-slate-600">Note (optional)</div>
                              <input
                                value={proofDraft.note}
                                onChange={(e) => setProofDraft((p) => ({ ...p, note: e.target.value }))}
                                placeholder="Optional"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="primary" onClick={addProof}>
                              <Upload className="h-4 w-4" /> Upload
                            </Button>
                            <button
                              type="button"
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                policy.requireVerifiedProofs ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                              style={policy.requireVerifiedProofs ? { background: EVZ.green } : undefined}
                              onClick={() => setPolicy((p) => ({ ...p, requireVerifiedProofs: !p.requireVerifiedProofs }))}
                            >
                              {policy.requireVerifiedProofs ? "Verified required" : "Uploaded ok"}
                            </button>
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Required proofs: Packing list, Delivery note, Photos.
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5">
                        <div className={cn("rounded-3xl border p-4", requiredProofsSatisfied ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Readiness</div>
                              <div className="mt-1 text-sm text-slate-700">{requiredProofsSatisfied ? "Ready for handover" : "Not ready"}</div>
                            </div>
                            <Pill label={requiredProofsSatisfied ? "OK" : "Missing"} tone={requiredProofsSatisfied ? "good" : "warn"} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {requiredProofs.map((p) => (
                              <Pill key={p.id} label={`${p.type}: ${p.status}`} tone={toneForProof(p.status)} />
                            ))}
                          </div>
                          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Policy: {policy.requireVerifiedProofs ? "All required proofs must be verified." : "Uploaded proofs are sufficient."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-[860px] w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Required</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">File</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proofs.map((p) => (
                            <tr key={p.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-900">{p.type}</td>
                              <td className="px-4 py-3">
                                <Pill label={p.required ? "Required" : "Optional"} tone={p.required ? "info" : "neutral"} />
                              </td>
                              <td className="px-4 py-3">
                                <Pill label={p.status} tone={toneForProof(p.status)} />
                              </td>
                              <td className="px-4 py-3 text-slate-700">{p.fileName || "-"}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{p.uploadedAt ? fmtDateTime(p.uploadedAt) : "-"}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => verifyProof(p.id)} disabled={p.status === "Verified"}>
                                    <BadgeCheck className="h-4 w-4" /> Verify
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectProof(p.id)} disabled={p.status === "Rejected"}>
                                    <AlertTriangle className="h-4 w-4" /> Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Best practice: verify proofs before accepting handover. This prevents payment release errors.
                    </div>
                  </Section>
                ) : null}

                {tab === "Handover" ? (
                  <Section
                    title="Handover checklist"
                    subtitle="Acceptance sign-off is the gating event for delivery milestone payments."
                    right={<Pill label={canAccept ? "Ready" : "Pending"} tone={canAccept ? "good" : "warn"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Checklist</div>
                              <div className="mt-1 text-xs text-slate-500">All required items must be done</div>
                            </div>
                            <Pill label={`${handoverChecklist.filter((c) => c.status === "Done").length}/${handoverChecklist.length}`} tone="neutral" />
                          </div>

                          <div className="mt-3 space-y-2">
                            {handoverChecklist.map((c) => (
                              <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill label={c.required ? "Required" : "Optional"} tone={c.required ? "info" : "neutral"} />
                                      <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                                    </div>
                                    {c.note ? <div className="mt-1 text-xs text-slate-500">{c.note}</div> : null}
                                  </div>
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                      c.status === "Done" ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                    )}
                                    style={c.status === "Done" ? { background: EVZ.green } : undefined}
                                    onClick={() =>
                                      setHandoverChecklist((p) => p.map((x) => (x.id === c.id ? { ...x, status: x.status === "Done" ? "Pending" : "Done" } : x)))
                                    }
                                  >
                                    {c.status}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Proofs gating: {requiredProofsSatisfied ? "OK" : "Not ready"}. Acceptance requires assets accepted and checklist complete.
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant={canAccept ? "primary" : "outline"} onClick={acceptDelivery} disabled={!canAccept}>
                              <BadgeCheck className="h-4 w-4" /> Accept handover
                            </Button>
                            <Button variant="outline" onClick={openDispute}>
                              <AlertTriangle className="h-4 w-4" /> Raise issue
                            </Button>
                            <Button variant="outline" onClick={exportHandoverPack}>
                              <Download className="h-4 w-4" /> Export
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Assets</div>
                              <div className="mt-1 text-xs text-slate-500">Serial numbers and acceptance per asset</div>
                            </div>
                            <Pill label={assetsAccepted ? "All accepted" : "Pending"} tone={assetsAccepted ? "good" : "warn"} />
                          </div>

                          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            <table className="min-w-[760px] w-full text-left text-sm">
                              <thead className="bg-slate-50 text-xs text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Asset</th>
                                  <th className="px-4 py-3 font-semibold">Serial</th>
                                  <th className="px-4 py-3 font-semibold">Condition</th>
                                  <th className="px-4 py-3 font-semibold">Accessories</th>
                                  <th className="px-4 py-3 font-semibold">Accepted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {assets.map((a) => (
                                  <tr key={a.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-semibold text-slate-900">{a.assetTag}</td>
                                    <td className="px-4 py-3">
                                      <input
                                        value={a.serialNo}
                                        onChange={(e) => setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, serialNo: e.target.value } : x)))}
                                        className="w-44 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={a.condition}
                                        onChange={(e) => setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, condition: e.target.value as any } : x)))}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                                      >
                                        {(["Good", "Minor issues", "Damaged"] as AssetRow["condition"][]).map((c) => (
                                          <option key={c} value={c}>
                                            {c}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3">
                                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={a.accessoriesComplete}
                                          onChange={(e) => setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, accessoriesComplete: e.target.checked } : x)))}
                                          className="h-4 w-4 rounded border-slate-300"
                                        />
                                        Complete
                                      </label>
                                    </td>
                                    <td className="px-4 py-3">
                                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={a.accepted}
                                          onChange={(e) => setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, accepted: e.target.checked } : x)))}
                                          className="h-4 w-4 rounded border-slate-300"
                                        />
                                        Accepted
                                      </label>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Tip: mark "Damaged" assets and raise a dispute before accepting the handover.
                          </div>
                        </div>

                        {disputes.length ? (
                          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Open disputes</div>
                                <div className="mt-1 text-xs text-slate-600">These disputes can hold payment releases</div>
                              </div>
                              <Pill label={`${disputes.filter((d) => d.status !== "Resolved").length}`} tone="warn" />
                            </div>
                            <div className="mt-3 space-y-2">
                              {disputes.slice(0, 2).map((d) => (
                                <div key={d.id} className="rounded-3xl border border-amber-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Pill label={d.severity} tone={d.severity === "High" ? "bad" : d.severity === "Medium" ? "warn" : "neutral"} />
                                        <Pill label={d.status} tone={d.status === "Resolved" ? "good" : "warn"} />
                                        <div className="text-sm font-semibold text-slate-900">{d.title}</div>
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500">{fmtDateTime(d.createdAt)} • {d.createdBy}</div>
                                      <div className="mt-2 text-sm text-slate-700">{d.detail}</div>
                                      {d.evidenceFiles.length ? <div className="mt-2 text-xs text-slate-500">Evidence: {d.evidenceFiles.join(", ")}</div> : null}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Section>
                ) : null}

                {tab === "Commissioning" ? (
                  <Section
                    title="Commissioning"
                    subtitle="Commissioning confirmation unlocks final milestone payment and can start warranty."
                    right={<Pill label={commissioningSatisfied ? "Ready" : "Pending"} tone={commissioningSatisfied ? "good" : "warn"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Checklist</div>
                              <div className="mt-1 text-xs text-slate-500">Complete required items then mark commissioned</div>
                            </div>
                            <Pill label={`${commissionChecklist.filter((c) => c.status === "Done").length}/${commissionChecklist.length}`} tone="neutral" />
                          </div>

                          <div className="mt-3 space-y-2">
                            {commissionChecklist.map((c) => (
                              <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill label={c.required ? "Required" : "Optional"} tone={c.required ? "info" : "neutral"} />
                                      <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                      c.status === "Done" ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                    )}
                                    style={c.status === "Done" ? { background: EVZ.green } : undefined}
                                    onClick={() =>
                                      setCommissionChecklist((p) => p.map((x) => (x.id === c.id ? { ...x, status: x.status === "Done" ? "Pending" : "Done" } : x)))
                                    }
                                  >
                                    {c.status}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant={canCommission ? "primary" : "outline"} onClick={markCommissioned} disabled={!canCommission}>
                              <Wrench className="h-4 w-4" /> Mark commissioned
                            </Button>
                            <Button variant="outline" onClick={() => {
                              // Add commissioning report proof
                              setProofDraft({ type: "Commissioning report", fileName: "CommissioningReport.pdf", note: "Uploaded from commissioning" });
                              addProof();
                              setCommissionChecklist((p) => p.map((x) => (x.label === "Commissioning report uploaded" ? { ...x, status: "Done" } : x)));
                            }}>
                              <Upload className="h-4 w-4" /> Upload report
                            </Button>
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            If your policy requires commissioning before warranty starts, warranty remains inactive until commissioned.
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Policy</div>
                              <div className="mt-1 text-xs text-slate-500">Premium controls</div>
                            </div>
                            <Pill label="Premium" tone="info" />
                          </div>

                          <div className="mt-3 space-y-2">
                            <ToggleRow
                              label="Require commissioning for warranty"
                              value={policy.requireCommissioningForWarranty}
                              onToggle={() => setPolicy((p) => ({ ...p, requireCommissioningForWarranty: !p.requireCommissioningForWarranty }))}
                            />
                            <ToggleRow
                              label="Warranty starts on commissioning"
                              value={policy.warrantyStartsOn === "Commissioning"}
                              onToggle={() => setPolicy((p) => ({ ...p, warrantyStartsOn: p.warrantyStartsOn === "Commissioning" ? "Acceptance" : "Commissioning" }))}
                              hint={`Current: ${policy.warrantyStartsOn}`}
                            />
                            <ToggleRow
                              label="Gate final payment on commissioning"
                              value={policy.gateFinalPaymentOnCommissioning}
                              onToggle={() => setPolicy((p) => ({ ...p, gateFinalPaymentOnCommissioning: !p.gateFinalPaymentOnCommissioning }))}
                            />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            These policy toggles affect payment eligibility and warranty start.
                          </div>
                        </div>
                      </div>
                    </div>
                  </Section>
                ) : null}

                {tab === "Warranty" ? (
                  <Section
                    title="Warranty"
                    subtitle="Warranty start is triggered by acceptance or commissioning, based on policy."
                    right={<Pill label={warranty.startAt ? "Active" : "Not started"} tone={warranty.startAt ? "good" : "warn"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Warranty details</div>
                              <div className="mt-1 text-xs text-slate-500">Coverage and registration</div>
                            </div>
                            <Pill label={`${warrantyMonths} months`} tone="neutral" />
                          </div>
                          <div className="mt-3 space-y-2">
                            <InfoRow label="Provider" value={warranty.provider} emphasize />
                            <InfoRow label="Contact" value={warranty.contact} />
                            <InfoRow label="Starts on" value={warranty.startsOn} emphasize />
                            <InfoRow label="Start" value={warranty.startAt ? fmtDateTime(warranty.startAt) : "Not started"} />
                            <InfoRow label="End" value={warranty.endAt ? fmtDateTime(warranty.endAt) : "-"} />
                            <InfoRow label="Registration" value={warranty.registrationId || "Not registered"} emphasize={!warranty.registrationId} />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Coverage: {warranty.coverageSummary}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="primary" onClick={registerWarranty} disabled={!!warranty.registrationId}>
                              <ClipboardCheck className="h-4 w-4" /> Register warranty
                            </Button>
                            <Button variant="outline" onClick={startWarrantyManually} disabled={!!warranty.startAt}>
                              <BadgeCheck className="h-4 w-4" /> Start warranty
                            </Button>
                            <Button variant="outline" onClick={() => toast({ title: "Claim", message: "Warranty claims workflow can be added as a separate page.", kind: "info" })}>
                              <ChevronRight className="h-4 w-4" /> Warranty claims
                            </Button>
                          </div>

                          {!warranty.startAt ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Warranty will start automatically when the configured trigger is met.
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="lg:col-span-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Warranty start trigger</div>
                              <div className="mt-1 text-xs text-slate-500">Policy driven</div>
                            </div>
                            <Pill label="Premium" tone="info" />
                          </div>

                          <div className="mt-3 space-y-2">
                            <ToggleRow
                              label="Start on commissioning"
                              value={policy.warrantyStartsOn === "Commissioning"}
                              onToggle={() => setPolicy((p) => ({ ...p, warrantyStartsOn: p.warrantyStartsOn === "Commissioning" ? "Acceptance" : "Commissioning" }))}
                              hint={`Current: ${policy.warrantyStartsOn}`}
                            />
                            <ToggleRow
                              label="Require commissioning before warranty"
                              value={policy.requireCommissioningForWarranty}
                              onToggle={() => setPolicy((p) => ({ ...p, requireCommissioningForWarranty: !p.requireCommissioningForWarranty }))}
                            />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Practical best practice: start warranty at commissioning for complex assets.
                          </div>
                        </div>

                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Asset register hooks</div>
                          <div className="mt-1 text-xs text-slate-500">Premium</div>
                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Premium: sync accepted assets into an Asset Register with QR codes and warranty metadata.
                          </div>
                        </div>
                      </div>
                    </div>
                  </Section>
                ) : null}

                {tab === "Payments" ? (
                  <Section
                    title="Milestone payment gates"
                    subtitle="Payments are released only when fulfillment checkpoints are met."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-[820px] w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Milestone</th>
                                <th className="px-4 py-3 font-semibold">Percent</th>
                                <th className="px-4 py-3 font-semibold">Amount</th>
                                <th className="px-4 py-3 font-semibold">Eligibility</th>
                                <th className="px-4 py-3 font-semibold">Gate</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {milestones.map((m) => {
                                const amount = Math.round((m.pct / 100) * poTotal);
                                const eligibleText =
                                  m.label === "Deposit"
                                    ? "PO approved"
                                    : m.label === "Delivery"
                                      ? policy.gateDeliveryPaymentOnAcceptance
                                        ? "Delivered + Accepted"
                                        : "Delivered"
                                      : policy.gateFinalPaymentOnCommissioning
                                        ? "Commissioned"
                                        : "Accepted";

                                const eligibleNow = m.gate === "Eligible" || m.gate === "Requested" || m.gate === "Paid";

                                return (
                                  <tr key={m.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-semibold text-slate-900">{m.label}</td>
                                    <td className="px-4 py-3">{m.pct}%</td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(amount, po.currency)}</td>
                                    <td className="px-4 py-3 text-slate-700">{eligibleText}</td>
                                    <td className="px-4 py-3">
                                      <Pill label={m.gate} tone={toneForGate(m.gate)} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {m.gate === "Eligible" ? (
                                          <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => requestMilestoneRelease(m.id)}>
                                            <ChevronRight className="h-4 w-4" /> Request
                                          </Button>
                                        ) : null}

                                        {m.gate === "Requested" ? (
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => markMilestonePaid(m.id)}>
                                            <BadgeCheck className="h-4 w-4" /> Mark paid
                                          </Button>
                                        ) : null}

                                        {m.gate === "Paid" ? (
                                          <Pill label={m.lastActionAt ? `Paid ${fmtDate(m.lastActionAt)}` : "Paid"} tone="good" />
                                        ) : null}

                                        {!eligibleNow && m.label !== "Deposit" ? (
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setTab(m.label === "Delivery" ? "Handover" : "Commissioning")}>
                                            <ChevronRight className="h-4 w-4" /> View gate
                                          </Button>
                                        ) : null}

                                        {m.gate === "On hold" ? (
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: "Hold", message: "Resolve disputes to unlock.", kind: "warn" })}>
                                            <Info className="h-4 w-4" /> Why
                                          </Button>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          U32 gates payments using objective fulfillment checkpoints. This prevents releasing funds without acceptance.
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Policy gates</div>
                              <div className="mt-1 text-xs text-slate-500">Premium</div>
                            </div>
                            <Pill label="Premium" tone="info" />
                          </div>

                          <div className="mt-3 space-y-2">
                            <ToggleRow
                              label="Gate delivery payment on acceptance"
                              value={policy.gateDeliveryPaymentOnAcceptance}
                              onToggle={() => setPolicy((p) => ({ ...p, gateDeliveryPaymentOnAcceptance: !p.gateDeliveryPaymentOnAcceptance }))}
                            />
                            <ToggleRow
                              label="Gate final payment on commissioning"
                              value={policy.gateFinalPaymentOnCommissioning}
                              onToggle={() => setPolicy((p) => ({ ...p, gateFinalPaymentOnCommissioning: !p.gateFinalPaymentOnCommissioning }))}
                            />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Premium: add penalties and SLA enforcement when vendor misses delivery windows.
                          </div>
                        </div>

                        <div className={cn(
                          "rounded-3xl border p-4",
                          enforcement.state === "OK" ? "border-emerald-200 bg-emerald-50" : enforcement.state === "Hold" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                        )}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Enforcement</div>
                              <div className="mt-1 text-sm text-slate-700">{enforcement.detail}</div>
                            </div>
                            <Pill label={enforcement.state} tone={enforcement.state === "OK" ? "good" : enforcement.state === "Hold" ? "warn" : "bad"} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={openDispute}><AlertTriangle className="h-4 w-4" /> Raise issue</Button>
                            <Button variant="outline" onClick={() => setTab("Timeline")}><ChevronRight className="h-4 w-4" /> Audit</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Section>
                ) : null}

                {tab === "Timeline" ? (
                  <Section
                    title="Timeline"
                    subtitle="Audit-friendly event log across delivery, handover, commissioning, warranty, and payments."
                    right={<Pill label={`${events.length} events`} tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {events
                        .slice()
                        .sort((a, b) => b.ts - a.ts)
                        .map((e) => (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={e.title} tone={pillToneForTone(e.tone)} />
                                  <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{fmtDateTime(e.ts)}</div>
                                <div className="mt-2 text-sm text-slate-700">{e.detail}</div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: export a tamper-evident audit pack combining proofs, sign-offs, and payment events.
                    </div>
                  </Section>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-4 space-y-4">
                <Section title="PO summary" subtitle="Key fields" right={<Pill label="Live" tone="good" />}>
                  <div className="space-y-2">
                    <InfoRow label="PO" value={po.poNumber} emphasize />
                    <InfoRow label="RFQ" value={po.rfqId} />
                    <InfoRow label="Quote" value={po.quoteId} />
                    <InfoRow label="Vendor" value={po.vendorName} emphasize />
                    <InfoRow label="Location" value={po.deliveryLocation} />
                    <InfoRow label="Expected" value={fmtDate(po.expectedDeliveryAt)} />
                    <InfoRow label="Cost center" value={po.costCenter} emphasize />
                    <InfoRow label="Project" value={po.projectTag} />
                    <InfoRow label="Stage" value={stage} emphasize />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Shipment: {stage === "In transit" ? "In transit" : deliveredAt ? `Delivered ${fmtDateTime(deliveredAt)}` : "-"}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => setTab("Handover")}>
                      <ClipboardCheck className="h-4 w-4" /> Handover
                    </Button>
                    <Button variant="outline" onClick={() => setTab("Payments")}>
                      <Wallet className="h-4 w-4" /> Payments
                    </Button>
                  </div>
                </Section>

                <Section title="Quick gates" subtitle="What blocks payment" right={<Pill label="Core" tone="neutral" />}>
                  <div className="space-y-2">
                    <GateRow ok={requiredProofsSatisfied} label={policy.requireVerifiedProofs ? "Required proofs verified" : "Required proofs uploaded"} />
                    <GateRow ok={handoverChecklistSatisfied} label="Handover checklist complete" />
                    <GateRow ok={assetsAccepted} label="Assets accepted" />
                    <GateRow ok={commissioningSatisfied} label="Commissioning checklist complete" />
                    <GateRow ok={!!warranty.startAt} label="Warranty started" />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Delivery milestone depends on acceptance. Final milestone depends on commissioning.
                  </div>
                </Section>

                <Section title="Open disputes" subtitle="Payment holds" right={<Pill label={`${disputes.filter((d) => d.status !== "Resolved").length}`} tone={disputes.some((d) => d.status !== "Resolved") ? "warn" : "neutral"} />}>
                  {disputes.length ? (
                    <div className="space-y-2">
                      {disputes.slice(0, 3).map((d) => (
                        <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={d.id} tone="neutral" />
                                <Pill label={d.severity} tone={d.severity === "High" ? "bad" : d.severity === "Medium" ? "warn" : "neutral"} />
                                <Pill label={d.status} tone={d.status === "Resolved" ? "good" : "warn"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{d.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(d.createdAt)}</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">No disputes.</div>
                  )}

                  <div className="mt-3">
                    <Button variant="outline" className="w-full" onClick={openDispute}>
                      <AlertTriangle className="h-4 w-4" /> Raise issue
                    </Button>
                  </div>
                </Section>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U32 PO Fulfillment and Delivery Tracking: proofs, handover checklist, commissioning, warranty start, and milestone payment gating.
            </div>
          </div>
        </div>
      </div>

      {/* Dispute modal */}
      <Modal
        open={disputeOpen}
        title="Raise issue / dispute"
        subtitle="Creates a hold on milestone release until resolved"
        onClose={() => setDisputeOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitDispute}>
              <AlertTriangle className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={po.poNumber} tone="neutral" />
              <Pill label={po.vendorName} tone="neutral" />
              <Pill label={stage} tone={toneForStage(stage)} />
            </div>
            <div className="mt-3 text-sm text-slate-700">Best practice: attach evidence and be specific about acceptance issues.</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Severity</div>
              <select
                value={disputeDraft.severity}
                onChange={(e) => setDisputeDraft((p) => ({ ...p, severity: e.target.value as any }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                {(["Low", "Medium", "High"] as Severity[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Evidence files (comma separated)</div>
              <input
                value={disputeDraft.evidence}
                onChange={(e) => setDisputeDraft((p) => ({ ...p, evidence: e.target.value }))}
                placeholder="Example: Photo1.jpg, DeliveryNote.pdf"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Title</div>
            <input
              value={disputeDraft.title}
              onChange={(e) => setDisputeDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="Example: Missing accessories for EV-002"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Detail</div>
            <textarea
              value={disputeDraft.detail}
              onChange={(e) => setDisputeDraft((p) => ({ ...p, detail: e.target.value }))}
              rows={4}
              placeholder="Describe what happened, what is missing, and what resolution you expect."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Submitting a dispute sets payment milestones to "On hold" until resolved.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ToggleRow({ label, value, onToggle, hint }: { label: string; value: boolean; onToggle: () => void; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", value ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={onToggle}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", value ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function GateRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      {ok ? <Pill label="OK" tone="good" /> : <Pill label="Missing" tone="warn" />}
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-emerald-900")}>{value}</div>
    </div>
  );
}
