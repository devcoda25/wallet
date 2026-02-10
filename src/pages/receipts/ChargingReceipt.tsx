import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BatteryCharging,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  Leaf,
  MapPin,
  Receipt,
  RefreshCcw,
  Sparkles,
  Timer,
  Wallet,
  Zap,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Mode = "session" | "credits";

type Step = "station" | "details" | "vehicle" | "payment" | "result";

type Zone = "Kampala CBD" | "Entebbe" | "Jinja" | "Other";

type ModuleKey = "EVs & Charging";

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

type Station = {
  id: string;
  name: string;
  zone: Zone;
  address: string;
  approvedForCorporate: boolean;
  pricePerKwhUGX: number;
  idleFeePerMinUGX: number;
  connectorTypes: Array<"CCS2" | "Type2" | "GB/T" | "Swap">;
  notes?: string;
};

type VehicleType = "EV Car" | "EV Van" | "E-Bike";

type Vehicle = {
  id: string;
  label: string;
  plate: string;
  type: VehicleType;
  isFleet: boolean;
  batteryKwh: number;
  defaultCostCenter?: string;
  allowedCostCenters?: string[]; // if set, must match
};

type ReceiptRow = {
  id: string;
  orgName: string;
  module: ModuleKey;
  kind: "Charging session" | "Charging credits";
  stationName: string;
  stationZone: Zone;
  stationAddress: string;
  vehicleLabel?: string;
  kwh: number;
  minutes: number;
  startedAt: number;
  endedAt: number;
  pricePerKwhUGX: number;
  multiplierLabel: string;
  multiplier: number;
  energyCostUGX: number;
  idleFeeUGX: number;
  discountUGX: number;
  totalUGX: number;
  paymentMethod: PaymentMethod;
  corporate: boolean;
  costCenter?: string;
  purpose?: string;
};

type PolicyReasonCode =
  | "PROGRAM"
  | "STATION"
  | "ZONE"
  | "COSTCENTER"
  | "PURPOSE"
  | "VEHICLE"
  | "THRESHOLD"
  | "LIMIT"
  | "OK";

type PolicyReason = { code: PolicyReasonCode; title: string; detail: string };

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
  stationId: string;
  zone: Zone;
  scheduleMode: "Now" | "Schedule";
  scheduleTimeHHMM: string;
  kwhTarget: number;
  paymentMethod: PaymentMethod;
  costCenter: string;
  purpose: string;
  vehicleId: string;
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

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function parseHHMM(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}

function isOffPeak(hhmm: string) {
  // Off-peak window: 22:00–06:00
  const { h, m } = parseHHMM(hhmm);
  const minutes = h * 60 + m;
  return minutes >= 22 * 60 || minutes < 6 * 60;
}

function nextOffPeakStartHHMM(now: Date) {
  const h = now.getHours();
  // if before 22:00, next is 22:00; else next is 22:00 tomorrow
  if (h < 22) return "22:00";
  return "22:00";
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>
  );
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

function SegButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
        active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
      style={active ? { background: EVZ.green } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function exportReceiptToPrint(receipt: ReceiptRow) {
  const w = window.open("", "_blank", "width=880,height=740");
  if (!w) return;

  const tagCostCenter = receipt.costCenter ? receipt.costCenter : "-";
  const tagPurpose = receipt.purpose ? receipt.purpose : "-";

  w.document.write(`
    <html>
      <head>
        <title>${escapeHtml(receipt.id)} - Receipt</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:24px; color:#0f172a;}
          .card{border:1px solid #e2e8f0; border-radius:18px; padding:18px;}
          .row{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;}
          .muted{color:#64748b; font-size:12px;}
          h1{font-size:18px; margin:0;}
          h2{font-size:14px; margin:16px 0 8px;}
          table{width:100%; border-collapse:collapse;}
          .pill{display:inline-block; padding:6px 10px; border-radius:999px; background:#f1f5f9; font-size:12px; font-weight:600;}
          .total{font-size:18px; font-weight:800;}
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">CorporatePay</div>
            <h1 style="margin-top:8px;">${escapeHtml(receipt.kind)}</h1>
            <div class="muted" style="margin-top:6px;">${escapeHtml(receipt.stationName)} • ${escapeHtml(receipt.stationZone)} • ${escapeHtml(receipt.stationAddress)}</div>
            <div class="muted" style="margin-top:6px;">Receipt ID: ${escapeHtml(receipt.id)} • Org: ${escapeHtml(receipt.orgName)}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Total</div>
            <div class="total">${escapeHtml(formatUGX(receipt.totalUGX))}</div>
            <div class="muted" style="margin-top:6px;">Payment: ${escapeHtml(receipt.paymentMethod)}${receipt.corporate ? " (Corporate)" : ""}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Session</div>
              <div style="font-weight:700;">${escapeHtml(fmtDateTime(receipt.startedAt))} → ${escapeHtml(fmtDateTime(receipt.endedAt))}</div>
            </div>
            <div>
              <div class="muted">Energy</div>
              <div style="font-weight:700;">${escapeHtml(String(receipt.kwh))} kWh</div>
            </div>
            <div>
              <div class="muted">Duration</div>
              <div style="font-weight:700;">${escapeHtml(String(receipt.minutes))} min</div>
            </div>
          </div>
          <div class="row" style="margin-top:12px;">
            <div>
              <div class="muted">Cost center</div>
              <div style="font-weight:700;">${escapeHtml(tagCostCenter)}</div>
            </div>
            <div>
              <div class="muted">Purpose</div>
              <div style="font-weight:700;">${escapeHtml(tagPurpose)}</div>
            </div>
            <div>
              <div class="muted">Vehicle</div>
              <div style="font-weight:700;">${escapeHtml(receipt.vehicleLabel || "-")}</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Charges</h2>
          <table>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Energy (${escapeHtml(formatUGX(receipt.pricePerKwhUGX))}/kWh × ${escapeHtml(String(receipt.kwh))} × ${escapeHtml(receipt.multiplierLabel)})</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatUGX(receipt.energyCostUGX))}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Idle fee</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatUGX(receipt.idleFeeUGX))}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Discount</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">-${escapeHtml(formatUGX(receipt.discountUGX))}</td>
            </tr>
            <tr>
              <td style="padding:12px 0; font-weight:800;">Total</td>
              <td style="padding:12px 0; font-weight:800; text-align:right;">${escapeHtml(formatUGX(receipt.totalUGX))}</td>
            </tr>
          </table>
          <div class="muted" style="margin-top:10px;">Export: use the Print dialog and select “Save as PDF”.</div>
        </div>

        <div class="no-print" style="margin-top:14px;">
          <button onclick="window.print()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:white; font-weight:700; cursor:pointer;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding:10px 14px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700; cursor:pointer; margin-left:8px;">Close</button>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
}

function escapeHtml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function evaluateChargingPolicy(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  station: Station | null;
  allowedZones: Zone[];
  scheduleHHMM: string;
  kwhTarget: number;
  estimateUGX: number;
  approvalThresholdUGX: number;
  perSessionLimitUGX: number;
  purposeRequired: boolean;
  costCenterRequired: boolean;
  purpose: string;
  costCenter: string;
  fleetEnabled: boolean;
  vehicleRequired: boolean;
  vehicle: Vehicle | null;
}): { outcome: Outcome; reasons: PolicyReason[]; alternatives: Alternative[]; coach: CoachTip[] } {
  const {
    paymentMethod,
    corporateStatus,
    graceActive,
    station,
    allowedZones,
    scheduleHHMM,
    kwhTarget,
    estimateUGX,
    approvalThresholdUGX,
    perSessionLimitUGX,
    purposeRequired,
    costCenterRequired,
    purpose,
    costCenter,
    fleetEnabled,
    vehicleRequired,
    vehicle,
  } = args;

  const reasons: PolicyReason[] = [];
  const alternatives: Alternative[] = [];
  const coach: CoachTip[] = [];

  // Personal payments bypass corporate policy
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ code: "OK", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
    coach.push({
      id: "coach-personal",
      title: "Use CorporatePay for business charging",
      desc: "CorporatePay produces corporate receipts with purpose and cost center for audit.",
      icon: <Building2 className="h-4 w-4" />,
    });
    return {
      outcome: "Allowed",
      reasons,
      alternatives: [
        {
          id: "alt-corp",
          title: "Switch back to CorporatePay",
          desc: "Use CorporatePay for business charging when eligible.",
          expected: "Approval required",
          icon: <Building2 className="h-4 w-4" />,
          patch: { paymentMethod: "CorporatePay" },
        },
      ],
      coach,
    };
  }

  // Corporate program enforcement
  if (corporateStatus === "Not linked") {
    reasons.push({ code: "PROGRAM", title: "Not linked to an organization", detail: "CorporatePay is only available when you are linked to an organization." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal wallet, card, or mobile money.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Not eligible") {
    reasons.push({ code: "PROGRAM", title: "Not eligible under policy", detail: "Your role or group is not eligible for CorporatePay in charging." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <CreditCard className="h-4 w-4" />,
      patch: { paymentMethod: "Card" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Deposit depleted") {
    reasons.push({ code: "PROGRAM", title: "Deposit depleted", detail: "Prepaid deposit is depleted. CorporatePay stops until your admin tops up." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Credit limit exceeded") {
    reasons.push({ code: "PROGRAM", title: "Credit limit exceeded", detail: "Corporate credit limit is exceeded. CorporatePay is paused until repayment or admin adjustment." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <CreditCard className="h-4 w-4" />,
      patch: { paymentMethod: "Card" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Billing delinquency" && !graceActive) {
    reasons.push({ code: "PROGRAM", title: "Billing delinquency", detail: "CorporatePay is suspended due to billing delinquency. Ask admin to resolve invoices." });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed with personal payment.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { paymentMethod: "Personal Wallet" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (corporateStatus === "Billing delinquency" && graceActive) {
    reasons.push({ code: "PROGRAM", title: "Grace window active", detail: "Billing is past due but grace is active. CorporatePay may proceed." });
    coach.push({
      id: "coach-grace",
      title: "Use CorporatePay while grace is active",
      desc: "Grace windows can end when billing agreements require enforcement.",
      icon: <Clock className="h-4 w-4" />,
    });
  }

  // Station policy
  if (!station) {
    reasons.push({ code: "STATION", title: "Station required", detail: "Select a charging station to proceed." });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (!station.approvedForCorporate) {
    reasons.push({ code: "STATION", title: "Station not approved", detail: "This station is not approved for corporate charging." });
    const approvedAlt = args.allowedZones.length ? args.allowedZones[0] : "Kampala CBD";
    alternatives.push({
      id: "alt-zone",
      title: "Choose an approved site",
      desc: `Switch to an approved zone like ${approvedAlt}.`,
      expected: "Allowed",
      icon: <MapPin className="h-4 w-4" />,
      patch: { zone: approvedAlt },
    });
  }

  if (!allowedZones.includes(station.zone)) {
    reasons.push({ code: "ZONE", title: "Zone restriction", detail: `Corporate charging is restricted to: ${allowedZones.join(", ")}.` });
    alternatives.push({
      id: "alt-zone2",
      title: "Switch to allowed zone",
      desc: "Select a station in an allowed zone.",
      expected: "Allowed",
      icon: <MapPin className="h-4 w-4" />,
      patch: { zone: allowedZones[0] || "Kampala CBD" },
    });
  }

  // Required fields
  if (costCenterRequired && !costCenter.trim()) {
    reasons.push({ code: "COSTCENTER", title: "Cost center required", detail: "Cost center is required for corporate billing allocation." });
    alternatives.push({
      id: "alt-cc",
      title: "Select cost center",
      desc: "Choose your cost center to proceed.",
      expected: "Allowed",
      icon: <Wallet className="h-4 w-4" />,
      patch: { costCenter: "OPS-01" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (purposeRequired && !purpose.trim()) {
    reasons.push({ code: "PURPOSE", title: "Purpose required", detail: "Purpose tag is required for corporate charging." });
    alternatives.push({
      id: "alt-purpose",
      title: "Add purpose",
      desc: "Choose a purpose like Charging, Fleet operations, or Project.",
      expected: "Allowed",
      icon: <Info className="h-4 w-4" />,
      patch: { purpose: "Charging" },
    });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  // Fleet allocation rules
  if (fleetEnabled && vehicleRequired && !vehicle) {
    reasons.push({ code: "VEHICLE", title: "Fleet vehicle required", detail: "Your organization requires a vehicle selection for corporate charging." });
    return { outcome: "Blocked", reasons, alternatives, coach };
  }

  if (fleetEnabled && vehicle && vehicle.allowedCostCenters && vehicle.allowedCostCenters.length) {
    if (costCenter && !vehicle.allowedCostCenters.includes(costCenter)) {
      reasons.push({
        code: "VEHICLE",
        title: "Vehicle allocation rule",
        detail: `Selected vehicle requires one of: ${vehicle.allowedCostCenters.join(", ")}.`,
      });
      alternatives.push({
        id: "alt-cc-vehicle",
        title: "Switch to allowed cost center",
        desc: "Choose a cost center that matches this vehicle rule.",
        expected: "Allowed",
        icon: <Wallet className="h-4 w-4" />,
        patch: { costCenter: vehicle.allowedCostCenters[0] },
      });
    }
  }

  // Session limits
  if (estimateUGX > perSessionLimitUGX) {
    reasons.push({
      code: "LIMIT",
      title: "Per-session limit exceeded",
      detail: `This session exceeds the corporate limit (${formatUGX(perSessionLimitUGX)}).`,
    });
    alternatives.push({
      id: "alt-reduce",
      title: "Reduce kWh",
      desc: "Lower the kWh target to stay within limits.",
      expected: "Approval required",
      icon: <Zap className="h-4 w-4" />,
      patch: { kwhTarget: Math.max(5, Math.floor(kwhTarget * 0.6)) },
    });
    alternatives.push({
      id: "alt-personal",
      title: "Pay personally",
      desc: "Proceed immediately using personal payment.",
      expected: "Allowed",
      icon: <CreditCard className="h-4 w-4" />,
      patch: { paymentMethod: "Card" },
    });
  }

  // Approval threshold
  if (estimateUGX > approvalThresholdUGX) {
    reasons.push({
      code: "THRESHOLD",
      title: "Approval required",
      detail: `Charging sessions above ${formatUGX(approvalThresholdUGX)} require approval.`,
    });
    alternatives.push({
      id: "alt-reduce2",
      title: "Reduce to avoid approval",
      desc: "Lower kWh target or schedule off-peak to reduce cost.",
      expected: "Allowed",
      icon: <Sparkles className="h-4 w-4" />,
      patch: { kwhTarget: Math.max(5, Math.floor(kwhTarget * 0.8)) },
    });
  }

  // Coach tips: off-peak
  const off = isOffPeak(scheduleHHMM);
  if (!off) {
    coach.push({
      id: "coach-offpeak",
      title: "Save money off-peak",
      desc: "Schedule after 22:00 to get off-peak pricing.",
      icon: <Leaf className="h-4 w-4" />,
      patch: { scheduleMode: "Schedule", scheduleTimeHHMM: "22:00" },
    });
  }
  coach.push({
    id: "coach-station",
    title: "Prefer approved sites",
    desc: "Approved stations reduce declines and approval friction.",
    icon: <MapPin className="h-4 w-4" />,
  });

  // Always allow personal fallback
  alternatives.push({
    id: "alt-pay-personal",
    title: "Pay personally",
    desc: "Proceed using personal payment method.",
    expected: "Allowed",
    icon: <Wallet className="h-4 w-4" />,
    patch: { paymentMethod: "Personal Wallet" },
  });

  // Decide outcome
  const hard = reasons.some((r) => ["STATION", "ZONE", "LIMIT", "VEHICLE"].includes(r.code));
  if (hard) return { outcome: "Blocked", reasons, alternatives: dedupeAlts(alternatives), coach };
  if (reasons.some((r) => r.code === "THRESHOLD")) return { outcome: "Approval required", reasons, alternatives: dedupeAlts(alternatives), coach };

  reasons.push({ code: "OK", title: "Within policy", detail: "Charging request is within station, zone, and funding rules." });
  return { outcome: "Allowed", reasons, alternatives: dedupeAlts(alternatives), coach };
}

function dedupeAlts(list: Alternative[]) {
  const seen = new Set<string>();
  const out: Alternative[] = [];
  for (const a of list) {
    const key = `${a.title}|${JSON.stringify(a.patch)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 6);
}

export default function UserChargingCheckoutU16() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [mode, setMode] = useState<Mode>("session");
  const [step, setStep] = useState<Step>("station");

  const stations: Station[] = useMemo(
    () => [
      {
        id: "st_kla",
        name: "EVzone Charging Hub",
        zone: "Kampala CBD",
        address: "Kampala Rd 12, Kampala",
        approvedForCorporate: true,
        pricePerKwhUGX: 2800,
        idleFeePerMinUGX: 250,
        connectorTypes: ["CCS2", "Type2"],
        notes: "Fast chargers available",
      },
      {
        id: "st_ent",
        name: "Entebbe Airport Site",
        zone: "Entebbe",
        address: "Airport Rd, Entebbe",
        approvedForCorporate: true,
        pricePerKwhUGX: 3000,
        idleFeePerMinUGX: 300,
        connectorTypes: ["CCS2", "Type2"],
        notes: "Ideal for airport trips",
      },
      {
        id: "st_jin",
        name: "Partner Station Jinja",
        zone: "Jinja",
        address: "Main St, Jinja",
        approvedForCorporate: false,
        pricePerKwhUGX: 3200,
        idleFeePerMinUGX: 350,
        connectorTypes: ["CCS2"],
        notes: "Not approved for CorporatePay",
      },
      {
        id: "st_oth",
        name: "Unknown Station",
        zone: "Other",
        address: "Unknown address",
        approvedForCorporate: false,
        pricePerKwhUGX: 3400,
        idleFeePerMinUGX: 400,
        connectorTypes: ["Type2"],
        notes: "Requires approval / not supported",
      },
    ],
    []
  );

  const vehicles: Vehicle[] = useMemo(
    () => [
      {
        id: "veh_my",
        label: "My EV",
        plate: "-",
        type: "EV Car",
        isFleet: false,
        batteryKwh: 60,
      },
      {
        id: "veh_fleet_1",
        label: "Fleet EV-01 Toyota bZ4X",
        plate: "UAX 123A",
        type: "EV Car",
        isFleet: true,
        batteryKwh: 71,
        defaultCostCenter: "FLEET-01",
        allowedCostCenters: ["FLEET-01", "OPS-01"],
      },
      {
        id: "veh_fleet_2",
        label: "Fleet Van EV-02",
        plate: "UAY 448B",
        type: "EV Van",
        isFleet: true,
        batteryKwh: 88,
        defaultCostCenter: "FLEET-01",
        allowedCostCenters: ["FLEET-01"],
      },
      {
        id: "veh_bike",
        label: "E-Bike Swap-02",
        plate: "EB-02",
        type: "E-Bike",
        isFleet: true,
        batteryKwh: 2,
        defaultCostCenter: "OPS-02",
        allowedCostCenters: ["OPS-02"],
      },
    ],
    []
  );

  const allowedZones: Zone[] = useMemo(() => ["Kampala CBD", "Entebbe"], []);

  const [zoneFilter, setZoneFilter] = useState<Zone | "All">("All");
  const filteredStations = useMemo(() => {
    if (zoneFilter === "All") return stations;
    return stations.filter((s) => s.zone === zoneFilter);
  }, [stations, zoneFilter]);

  // Corporate status (demo)
  const [corporateStatus, setCorporateStatus] = useState<CorporateProgramStatus>("Eligible");
  const [graceEnabled, setGraceEnabled] = useState(true);
  const [graceEndAt, setGraceEndAt] = useState<number>(() => Date.now() + 4 * 60 * 60 * 1000);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const graceMs = graceEndAt - nowTick;
  const graceActive = corporateStatus === "Billing delinquency" && graceEnabled && graceMs > 0;

  // Premium fleet enablement (org setting)
  const [fleetEnabled, setFleetEnabled] = useState(true);
  const [fleetVehicleRequired, setFleetVehicleRequired] = useState(true);

  // Session configuration
  const [stationId, setStationId] = useState(stations[0].id);
  const station = useMemo(() => stations.find((s) => s.id === stationId) || null, [stations, stationId]);

  const [scheduleMode, setScheduleMode] = useState<"Now" | "Schedule">("Now");
  const [scheduleTimeHHMM, setScheduleTimeHHMM] = useState(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  });

  const effectiveHHMM = scheduleMode === "Now" ? scheduleTimeHHMM : scheduleTimeHHMM;

  const [kwhTarget, setKwhTarget] = useState<number>(18);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");

  const costCenters = useMemo(() => ["OPS-01", "OPS-02", "SAL-03", "FLEET-01"], []);
  const purposeTags = useMemo(() => ["Charging", "Fleet operations", "Project", "Delivery", "Operations", "Other"], []);

  const [costCenter, setCostCenter] = useState<string>("OPS-01");
  const [purpose, setPurpose] = useState<string>("Charging");

  const [vehicleId, setVehicleId] = useState<string>(vehicles[0].id);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicles, vehicleId]);

  // If fleet vehicle selected, best-effort apply default cost center
  useEffect(() => {
    if (!fleetEnabled) return;
    if (!vehicle) return;
    if (vehicle.defaultCostCenter) setCostCenter(vehicle.defaultCostCenter);
  }, [fleetEnabled, vehicleId]);

  // Pricing multipliers
  const offPeak = isOffPeak(effectiveHHMM);
  const multiplier = offPeak ? 0.88 : 1.0;
  const multiplierLabel = offPeak ? "Off-peak" : "Peak";

  // Estimate
  const estimateUGX = useMemo(() => {
    if (!station) return 0;
    const energy = station.pricePerKwhUGX * kwhTarget * multiplier;
    // idle fee is unknown at start; estimate small
    const idleEstimate = 0;
    // discount if off-peak already in multiplier; add an extra corporate sustainability discount for corporate sessions (small)
    const discount = paymentMethod === "CorporatePay" && offPeak ? Math.round(energy * 0.02) : 0;
    const total = Math.round(energy + idleEstimate - discount);
    return clamp(total, 0, 9_999_999);
  }, [station, kwhTarget, multiplier, paymentMethod, offPeak]);

  // Credits purchase flow (mode=credits)
  const [creditAmountUGX, setCreditAmountUGX] = useState<number>(200000);

  // Policy thresholds
  const [approvalThresholdUGX, setApprovalThresholdUGX] = useState<number>(150000);
  const [perSessionLimitUGX, setPerSessionLimitUGX] = useState<number>(300000);

  const corporateState = useMemo<CorporateState>(() => {
    if (paymentMethod !== "CorporatePay") return "Available";

    if (corporateStatus === "Eligible") return estimateUGX > approvalThresholdUGX ? "Requires approval" : "Available";
    if (corporateStatus === "Billing delinquency" && graceActive) return estimateUGX > approvalThresholdUGX ? "Requires approval" : "Available";
    return "Not available";
  }, [paymentMethod, corporateStatus, graceActive, estimateUGX, approvalThresholdUGX]);

  const corporateReason = useMemo(() => {
    if (corporateStatus === "Not linked") return "Not linked";
    if (corporateStatus === "Not eligible") return "Not eligible";
    if (corporateStatus === "Deposit depleted") return "Deposit depleted";
    if (corporateStatus === "Credit limit exceeded") return "Credit exceeded";
    if (corporateStatus === "Billing delinquency" && !graceActive) return "Suspended";
    if (corporateStatus === "Billing delinquency" && graceActive) return `Grace ${msToFriendly(graceMs)}`;
    return "";
  }, [corporateStatus, graceActive, graceMs]);

  const purposeRequired = paymentMethod === "CorporatePay";
  const costCenterRequired = paymentMethod === "CorporatePay";

  const policy = useMemo(() => {
    return evaluateChargingPolicy({
      paymentMethod,
      corporateStatus,
      graceActive,
      station,
      allowedZones,
      scheduleHHMM: effectiveHHMM,
      kwhTarget,
      estimateUGX,
      approvalThresholdUGX,
      perSessionLimitUGX,
      purposeRequired,
      costCenterRequired,
      purpose,
      costCenter,
      fleetEnabled,
      vehicleRequired: fleetEnabled && fleetVehicleRequired && paymentMethod === "CorporatePay",
      vehicle: fleetEnabled ? vehicle : null,
    });
  }, [
    paymentMethod,
    corporateStatus,
    graceActive,
    station,
    allowedZones,
    effectiveHHMM,
    kwhTarget,
    estimateUGX,
    approvalThresholdUGX,
    perSessionLimitUGX,
    purposeRequired,
    costCenterRequired,
    purpose,
    costCenter,
    fleetEnabled,
    fleetVehicleRequired,
    vehicle,
  ]);

  // Off-peak suggestions
  const offPeakSuggestion = useMemo(() => {
    if (offPeak) return null;
    const next = nextOffPeakStartHHMM(new Date());
    const savingsPct = 12; // showcase premium
    const saved = Math.round((estimateUGX * savingsPct) / 100);
    return { next, savingsPct, savedUGX: saved };
  }, [offPeak, estimateUGX]);

  // Receipt state
  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);

  const applyPatch = (p: Partial<Patch>) => {
    if (p.zone) {
      // find first station in zone
      const s = stations.find((x) => x.zone === p.zone && x.approvedForCorporate) || stations.find((x) => x.zone === p.zone) || null;
      if (s) setStationId(s.id);
      setZoneFilter(p.zone);
    }
    if (p.stationId) setStationId(p.stationId);
    if (p.scheduleMode) setScheduleMode(p.scheduleMode);
    if (p.scheduleTimeHHMM) setScheduleTimeHHMM(p.scheduleTimeHHMM);
    if (typeof p.kwhTarget === "number") setKwhTarget(clamp(p.kwhTarget, 2, 120));
    if (p.paymentMethod) setPaymentMethod(p.paymentMethod);
    if (typeof p.costCenter === "string") setCostCenter(p.costCenter);
    if (typeof p.purpose === "string") setPurpose(p.purpose);
    if (p.vehicleId) setVehicleId(p.vehicleId);
  };

  const canGoNext = useMemo(() => {
    if (mode === "credits") {
      // Keep it simple for credits
      if (step !== "payment") return true;
      if (paymentMethod === "CorporatePay") return corporateState !== "Not available" && !!purpose.trim() && !!costCenter.trim();
      return true;
    }

    if (step === "station") return !!station;
    if (step === "details") return kwhTarget >= 2 && kwhTarget <= 120;
    if (step === "vehicle") {
      if (!fleetEnabled) return true;
      if (!fleetVehicleRequired) return true;
      return !!vehicle;
    }
    if (step === "payment") {
      if (paymentMethod === "CorporatePay") {
        if (corporateState === "Not available") return false;
        if (!purpose.trim() || !costCenter.trim()) return false;
        if (fleetEnabled && fleetVehicleRequired && !vehicle) return false;
      }
      return true;
    }
    return true;
  }, [mode, step, station, kwhTarget, fleetEnabled, fleetVehicleRequired, vehicle, paymentMethod, corporateState, purpose, costCenter]);

  const nextStep = (s: Step): Step => (s === "station" ? "details" : s === "details" ? "vehicle" : s === "vehicle" ? "payment" : s === "payment" ? "result" : "result");
  const prevStep = (s: Step): Step => (s === "result" ? "payment" : s === "payment" ? "vehicle" : s === "vehicle" ? "details" : s === "details" ? "station" : "station");

  const goNext = () => {
    if (!canGoNext) {
      toast({ title: "Fix required", message: "Complete required fields before continuing.", kind: "warn" });
      return;
    }
    setStep(nextStep(step));
  };

  const goBack = () => setStep(prevStep(step));

  // Submit actions
  const [approvalId, setApprovalId] = useState<string>("");

  const submitForApproval = () => {
    const id = `REQ-CH-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setApprovalId(id);
    toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
    toast({ title: "Track", message: "Track status in U13 Pending Approval (demo).", kind: "info" });
  };

  function msToFriendly(ms: number) {
    if (ms < 0) return "0s";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  function toneForOutcome(o: Outcome) {
    switch (o) {
      case "Allowed": return "good";
      case "Approval required": return "warn";
      case "Blocked": return "bad";
      default: return "neutral";
    }
  }

  const startSession = () => {
    if (!station) return;

    // Create simulated receipt
    const start = Date.now();
    const minutes = clamp(Math.round(kwhTarget * (vehicle?.type === "E-Bike" ? 6 : 3)), 5, 240);
    const end = start + minutes * 60 * 1000;

    const energyCost = Math.round(station.pricePerKwhUGX * kwhTarget * multiplier);
    const idleFee = 0;
    const discount = paymentMethod === "CorporatePay" && offPeak ? Math.round(energyCost * 0.02) : 0;
    const total = Math.max(0, energyCost + idleFee - discount);

    const r: ReceiptRow = {
      id: `RCPT-CH-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      orgName: "Acme Group Ltd",
      module: "EVs & Charging",
      kind: "Charging session",
      stationName: station.name,
      stationZone: station.zone,
      stationAddress: station.address,
      vehicleLabel: fleetEnabled ? (vehicle ? `${vehicle.label} (${vehicle.plate})` : undefined) : undefined,
      kwh: kwhTarget,
      minutes,
      startedAt: start,
      endedAt: end,
      pricePerKwhUGX: station.pricePerKwhUGX,
      multiplierLabel,
      multiplier,
      energyCostUGX: energyCost,
      idleFeeUGX: idleFee,
      discountUGX: discount,
      totalUGX: total,
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      costCenter: paymentMethod === "CorporatePay" ? costCenter : undefined,
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
    };

    setReceipt(r);
    toast({ title: "Session started", message: "Charging session started (simulated).", kind: "success" });
  };

  const buyCredits = () => {
    if (!station) return;
    const now = Date.now();
    const minutes = 0;
    const kwh = 0;
    const total = clamp(creditAmountUGX, 0, 9_999_999);

    const r: ReceiptRow = {
      id: `RCPT-CR-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      orgName: "Acme Group Ltd",
      module: "EVs & Charging",
      kind: "Charging credits",
      stationName: station.name,
      stationZone: station.zone,
      stationAddress: station.address,
      kwh,
      minutes,
      startedAt: now,
      endedAt: now,
      pricePerKwhUGX: station.pricePerKwhUGX,
      multiplierLabel: "N/A",
      multiplier: 1,
      energyCostUGX: total,
      idleFeeUGX: 0,
      discountUGX: 0,
      totalUGX: total,
      paymentMethod,
      corporate: paymentMethod === "CorporatePay",
      costCenter: paymentMethod === "CorporatePay" ? costCenter : undefined,
      purpose: paymentMethod === "CorporatePay" ? purpose : undefined,
    };

    setReceipt(r);
    toast({ title: "Credits purchased", message: "Charging credits purchased (simulated).", kind: "success" });
  };

  const resetFlow = () => {
    setReceipt(null);
    setApprovalId("");
    setStep("station");
    toast({ title: "Reset", message: "Checkout reset.", kind: "info" });
  };

  // Mode switching
  useEffect(() => {
    setReceipt(null);
    setApprovalId("");
    setStep("station");
  }, [mode]);

  // Convenient step labels
  const stepLabel = (s: Step) => (s === "station" ? "Station" : s === "details" ? "Details" : s === "vehicle" ? "Vehicle" : s === "payment" ? "Payment" : "Result");

  const leftHeader = (
    <div>
      <div className="text-sm font-semibold text-slate-900">EV Charging with CorporatePay</div>
      <div className="mt-1 text-xs text-slate-500">Start a charge or buy credits with policy, allocation, and receipts.</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Pill label={`Mode: ${mode === "session" ? "Session" : "Credits"}`} tone="neutral" />
        <Pill label={`Step: ${stepLabel(step)}`} tone="neutral" />
        <Pill label={`Zone allowlist: ${allowedZones.join(", ")}`} tone="info" />
        <Pill label={offPeak ? "Off-peak" : "Peak"} tone={offPeak ? "good" : "neutral"} />
      </div>
    </div>
  );

  const rightHeader = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => toast({ title: "CorporatePay Hub", message: "Open U1 (demo).", kind: "info" })}>
        <Sparkles className="h-4 w-4" /> Hub
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open U6 (demo).", kind: "info" })}>
        <Receipt className="h-4 w-4" /> Receipts
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Payment methods", message: "Open U7 (demo).", kind: "info" })}>
        <CreditCard className="h-4 w-4" /> Payment
      </Button>
    </div>
  );

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
                  <BatteryCharging className="h-6 w-6" />
                </div>
                {leftHeader}
              </div>
              {rightHeader}
            </div>

            {/* Mode tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SegButton active={mode === "session"} label="Start session" onClick={() => setMode("session")} />
              <SegButton active={mode === "credits"} label="Buy credits" onClick={() => setMode("credits")} />

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={resetFlow}>
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>

            {/* Step tabs */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {(["station", "details", "vehicle", "payment", "result"] as Step[]).map((k) => {
                const active = step === k;
                return (
                  <button
                    key={k}
                    type="button"
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() => setStep(k)}
                  >
                    <div className="text-xs font-semibold text-slate-600">{stepLabel(k)}</div>
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
                {step === "station" ? (
                  <Section
                    title="Select station"
                    subtitle="Station/site policy enforcement (allowed zones)"
                    right={<Pill label={station ? station.zone : "-"} tone={station && allowedZones.includes(station.zone) ? "good" : "warn"} />}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        Zone
                      </div>
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value as any)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                      >
                        <option value="All">All</option>
                        {(["Kampala CBD", "Entebbe", "Jinja", "Other"] as Zone[]).map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>

                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Pill label={`Allowed: ${allowedZones.join(", ")}`} tone="info" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredStations.map((s) => {
                        const active = s.id === stationId;
                        const allowed = allowedZones.includes(s.zone) && s.approvedForCorporate;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setStationId(s.id);
                              toast({ title: "Station selected", message: s.name, kind: "success" });
                            }}
                            className={cn(
                              "w-full rounded-3xl border p-4 text-left shadow-sm transition hover:bg-slate-50",
                              active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                  <Pill label={s.zone} tone={allowedZones.includes(s.zone) ? "info" : "neutral"} />
                                  <Pill label={s.approvedForCorporate ? "Approved" : "Not approved"} tone={s.approvedForCorporate ? "good" : "warn"} />
                                  {allowed ? <Pill label="Corporate allowed" tone="good" /> : <Pill label="Corporate restricted" tone="warn" />}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{s.address}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <Pill label={`${formatUGX(s.pricePerKwhUGX)}/kWh`} tone="neutral" />
                                  <Pill label={`Idle ${formatUGX(s.idleFeePerMinUGX)}/min`} tone="neutral" />
                                  <Pill label={`Connectors: ${s.connectorTypes.join(", ")}`} tone="neutral" />
                                </div>
                                {s.notes ? <div className="mt-2 text-xs text-slate-500">{s.notes}</div> : null}
                              </div>
                              {active ? <Check className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Corporate charging may be restricted by zone allowlists and station approvals.
                    </div>
                  </Section>
                ) : null}

                {step === "details" ? (
                  <div className="space-y-4">
                    <Section
                      title="Session details"
                      subtitle="Set kWh target and scheduling. Premium: off-peak savings coach."
                      right={<Pill label={offPeak ? "Off-peak pricing" : "Peak pricing"} tone={offPeak ? "good" : "neutral"} />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-600">kWh target</div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <input
                              type="range"
                              min={2}
                              max={120}
                              value={kwhTarget}
                              onChange={(e) => setKwhTarget(clamp(Number(e.target.value || 0), 2, 120))}
                              className="w-full"
                            />
                            <Pill label={`${kwhTarget} kWh`} tone="neutral" />
                          </div>
                          <div className="mt-2 text-xs text-slate-500">Use higher kWh for longer trips. Fleet policies may apply.</div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            Estimate: <span className="font-semibold text-slate-900">{formatUGX(estimateUGX)}</span>
                            {station ? (
                              <>
                                <div className="mt-1">Rate: {formatUGX(station.pricePerKwhUGX)}/kWh • {multiplierLabel} ({multiplier}×)</div>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-600">Schedule</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {(["Now", "Schedule"] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setScheduleMode(m)}
                                className={cn(
                                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                  scheduleMode === m ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                )}
                                style={scheduleMode === m ? { background: EVZ.green } : undefined}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3">
                            <input
                              type="time"
                              value={scheduleTimeHHMM}
                              onChange={(e) => setScheduleTimeHHMM(e.target.value)}
                              className={cn(
                                "w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                scheduleMode === "Schedule" ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700 focus:ring-slate-200"
                              )}
                              disabled={scheduleMode !== "Schedule"}
                            />
                            <div className="mt-1 text-xs text-slate-500">Used for pricing suggestions and policy checks.</div>
                          </div>

                          {offPeakSuggestion ? (
                            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold">Smart off-peak suggestion</div>
                                  <div className="mt-1">Schedule at {offPeakSuggestion.next} to save ~{offPeakSuggestion.savingsPct}% (≈ {formatUGX(offPeakSuggestion.savedUGX)}).</div>
                                </div>
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    setScheduleMode("Schedule");
                                    setScheduleTimeHHMM(offPeakSuggestion.next);
                                    toast({ title: "Scheduled", message: `Off-peak at ${offPeakSuggestion.next}`, kind: "success" });
                                  }}
                                >
                                  <Leaf className="h-4 w-4" /> Apply
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                              Off-peak is active. You are already saving compared to peak hours.
                            </div>
                          )}
                        </div>
                      </div>
                    </Section>

                    <Section
                      title="Premium controls"
                      subtitle="Fleet vehicle selector and allocation rules"
                      right={<Pill label="Premium" tone="info" />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Fleet features enabled</div>
                            <div className="mt-1 text-xs text-slate-600">Org can enable fleet vehicle selection for charging allocation.</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={fleetEnabled}
                            onChange={(e) => setFleetEnabled(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                        </label>

                        <label className={cn("flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4", !fleetEnabled && "opacity-60")}>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Vehicle required</div>
                            <div className="mt-1 text-xs text-slate-600">When enabled, charging requires vehicle selection under CorporatePay.</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={fleetVehicleRequired}
                            onChange={(e) => setFleetVehicleRequired(e.target.checked)}
                            disabled={!fleetEnabled}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                        </label>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Allocation rule example: some fleet vehicles can only be charged under specific cost centers.
                      </div>
                    </Section>
                  </div>
                ) : null}

                {step === "vehicle" ? (
                  <Section
                    title="Vehicle"
                    subtitle="Premium: select fleet vehicle for allocation rules"
                    right={<Pill label={fleetEnabled ? "Fleet enabled" : "Fleet off"} tone={fleetEnabled ? "info" : "neutral"} />}
                  >
                    {!fleetEnabled ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                        Fleet vehicle selection is disabled by your organization.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-3">
                          {vehicles.map((v) => {
                            const active = v.id === vehicleId;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setVehicleId(v.id);
                                  toast({ title: "Vehicle selected", message: `${v.label} (${v.plate})`, kind: "success" });
                                }}
                                className={cn(
                                  "rounded-3xl border p-4 text-left shadow-sm transition hover:bg-slate-50",
                                  active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{v.label}</div>
                                      <Pill label={v.type} tone="neutral" />
                                      <Pill label={v.isFleet ? "Fleet" : "Personal"} tone={v.isFleet ? "info" : "neutral"} />
                                      <Pill label={`${v.batteryKwh} kWh`} tone="neutral" />
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600">Plate: {v.plate}</div>
                                    {v.allowedCostCenters?.length ? (
                                      <div className="mt-2 text-xs text-slate-500">Allowed cost centers: {v.allowedCostCenters.join(", ")}</div>
                                    ) : (
                                      <div className="mt-2 text-xs text-slate-500">No special allocation rules</div>
                                    )}
                                  </div>
                                  {active ? <Check className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          If this vehicle has cost center rules, mismatches will be flagged and may block CorporatePay.
                        </div>
                      </>
                    )}
                  </Section>
                ) : null}

                {step === "payment" ? (
                  <div className="space-y-4">
                    <Section
                      title="Payment method"
                      subtitle="CorporatePay option at payment step"
                      right={<Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}
                    >
                      <div className="space-y-2">
                        {([
                          { id: "CorporatePay" as const, title: "CorporatePay", sub: "Company-paid with policy and approvals", icon: <Building2 className="h-5 w-5" /> },
                          { id: "Personal Wallet" as const, title: "Personal Wallet", sub: "Pay from personal EVzone wallet", icon: <Wallet className="h-5 w-5" /> },
                          { id: "Card" as const, title: "Card", sub: "Visa/Mastercard", icon: <CreditCard className="h-5 w-5" /> },
                          { id: "Mobile Money" as const, title: "Mobile Money", sub: "MTN/Airtel", icon: <PhoneIcon /> },
                        ] as const).map((m) => {
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
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600">{m.sub}</div>
                                  </div>
                                </div>
                                <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
                                  {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                </div>
                              </div>

                              {isCorp ? (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                                  {corporateState === "Not available"
                                    ? "CorporatePay is disabled for finance reasons. Use personal payment or contact your admin."
                                    : corporateState === "Requires approval"
                                      ? `Approval will be required above ${formatUGX(approvalThresholdUGX)}.`
                                      : "CorporatePay is available for this session."}
                                </div>
                              ) : (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                                  Personal payment does not require corporate approvals.
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Section>

                    {paymentMethod === "CorporatePay" ? (
                      <Section
                        title="Corporate allocation"
                        subtitle="Purpose and cost center are required for corporate charging receipts"
                        right={<Pill label="Required" tone="warn" />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Cost center</div>
                            <select
                              value={costCenter}
                              onChange={(e) => setCostCenter(e.target.value)}
                              className={cn(
                                "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                costCenter.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                              )}
                            >
                              <option value="">Select</option>
                              {costCenters.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            {!costCenter.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">Purpose tag</div>
                            <select
                              value={purpose}
                              onChange={(e) => setPurpose(e.target.value)}
                              className={cn(
                                "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                                purpose.trim() ? "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100" : "border-amber-300 bg-white text-slate-900 focus:ring-amber-100"
                              )}
                            >
                              <option value="">Select</option>
                              {purposeTags.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                            {!purpose.trim() ? <div className="mt-1 text-xs font-semibold text-amber-700">Required</div> : null}
                          </div>

                          {fleetEnabled ? (
                            <div className={cn("md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200")}>
                              Fleet allocation is enabled. Vehicle selection may be required by org policy.
                            </div>
                          ) : null}

                          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            These fields will appear on your corporate receipt (kWh, time, station, cost center, purpose).
                          </div>
                        </div>
                      </Section>
                    ) : null}

                    <Section
                      title="Policy preview"
                      subtitle="Out-of-policy explanations and safe alternatives"
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
                                ? "You can proceed."
                                : policy.outcome === "Approval required"
                                  ? "Submit for approval before charging."
                                  : "CorporatePay cannot proceed without changes or exception."}
                            </div>
                          </div>
                          <div className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            policy.outcome === "Allowed" ? "bg-emerald-100 text-emerald-800" : policy.outcome === "Approval required" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"
                          )}>
                            {policy.outcome === "Allowed" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {policy.reasons.map((r) => (
                            <div key={`${r.code}-${r.title}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={r.code} tone={r.code === "OK" ? "good" : r.code === "THRESHOLD" ? "warn" : r.code === "PROGRAM" && graceActive ? "warn" : r.code === "PROGRAM" ? "bad" : r.code === "LIMIT" ? "bad" : "neutral"} />
                                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                  </div>
                                  <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Alternatives</div>
                            <div className="mt-3 space-y-2">
                              {policy.alternatives.map((a) => (
                                <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
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
                                  </div>
                                  <div className="mt-3">
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        applyPatch(a.patch);
                                        toast({ title: "Applied", message: a.title, kind: "success" });
                                      }}
                                    >
                                      <ChevronRight className="h-4 w-4" /> Apply
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {!policy.alternatives.length ? (
                                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No alternatives needed.</div>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Policy coach</div>
                            <div className="mt-3 space-y-2">
                              {policy.coach.map((c) => (
                                <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{c.icon}</div>
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                                        <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <Button
                                      variant="primary"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        if (c.patch) applyPatch(c.patch);
                                        toast({ title: "Coach", message: c.title, kind: "success" });
                                      }}
                                    >
                                      <Sparkles className="h-4 w-4" /> Apply
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {!policy.coach.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No tips.</div> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </div>
                ) : null}

                {step === "result" ? (
                  <div className="space-y-4">
                    <Section
                      title="Result"
                      subtitle="Start session, submit for approval, or view receipt"
                      right={<Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Action</div>
                              <div className="mt-1 text-sm text-slate-600">Based on policy outcome</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                              <Zap className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {policy.outcome === "Allowed" ? (
                              <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => {
                                  if (mode === "credits") buyCredits();
                                  else startSession();
                                }}
                              >
                                <BatteryCharging className="h-4 w-4" /> {mode === "credits" ? "Buy credits" : "Start charging"}
                              </Button>
                            ) : null}

                            {policy.outcome === "Approval required" ? (
                              <Button variant="primary" className="w-full" onClick={submitForApproval}>
                                <FileText className="h-4 w-4" /> Submit for approval
                              </Button>
                            ) : null}

                            {policy.outcome === "Blocked" ? (
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => toast({ title: "Exception", message: "Open exception request.", kind: "info" })}
                              >
                                <AlertTriangle className="h-4 w-4" /> Request exception
                              </Button>
                            ) : null}

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setPaymentMethod("Personal Wallet");
                                toast({ title: "Switched", message: "Personal wallet selected.", kind: "info" });
                              }}
                            >
                              <Wallet className="h-4 w-4" /> Pay personally
                            </Button>
                          </div>

                          {approvalId ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Approval created: <span className="font-semibold">{approvalId}</span>. Track in U13.
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Receipt</div>
                              <div className="mt-1 text-sm text-slate-600">Session receipt includes kWh, time, station, cost center, and purpose.</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <Receipt className="h-5 w-5" />
                            </div>
                          </div>

                          {receipt ? (
                            <div className="mt-3 space-y-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={receipt.kind} tone="info" />
                                  <Pill label={receipt.stationZone} tone={allowedZones.includes(receipt.stationZone) ? "good" : "neutral"} />
                                  <Pill label={receipt.paymentMethod} tone={receipt.corporate ? "info" : "neutral"} />
                                  <Pill label={receipt.id} tone="neutral" />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{receipt.stationName}</div>
                                <div className="mt-1 text-sm text-slate-600">{receipt.stationAddress}</div>
                                <div className="mt-2 text-xs text-slate-500">{fmtDateTime(receipt.startedAt)} • {timeAgo(receipt.startedAt)}</div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <InfoCell label="kWh" value={`${receipt.kwh}`} />
                                  <InfoCell label="Minutes" value={`${receipt.minutes}`} />
                                  <InfoCell label="Cost center" value={receipt.costCenter || "-"} />
                                  <InfoCell label="Purpose" value={receipt.purpose || "-"} />
                                </div>
                                {receipt.vehicleLabel ? (
                                  <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">Vehicle: {receipt.vehicleLabel}</div>
                                ) : null}

                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                                  Total: <span className="font-semibold text-slate-900">{formatUGX(receipt.totalUGX)}</span>
                                </div>
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
                                  <Copy className="h-4 w-4" /> Copy ID
                                </Button>
                                <Button variant="outline" onClick={() => exportReceiptToPrint(receipt)}>
                                  <Download className="h-4 w-4" /> Export PDF
                                </Button>
                                <Button variant="outline" onClick={() => toast({ title: "Receipts", message: "Open Corporate Receipts.", kind: "info" })} >
                                  <Receipt className="h-4 w-4" /> View receipts
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                              No receipt yet. Start a session or buy credits to generate a receipt.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                        Tip: Enforcing purpose + cost center improves ESG and audit reporting.
                      </div>
                    </Section>
                  </div>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="Charging summary"
                  subtitle="Live estimate and context"
                  right={<Pill label={formatUGX(mode === "credits" ? creditAmountUGX : estimateUGX)} tone="neutral" />}
                >
                  <div className="space-y-2">
                    <SummaryRow label="Station" value={station ? `${station.name} (${station.zone})` : "-"} />
                    <SummaryRow label="Schedule" value={scheduleMode === "Now" ? "Now" : `Scheduled ${scheduleTimeHHMM}`} />
                    <SummaryRow label="Pricing" value={station ? `${formatUGX(station.pricePerKwhUGX)}/kWh • ${multiplierLabel}` : "-"} />
                    {mode === "session" ? <SummaryRow label="kWh target" value={`${kwhTarget} kWh`} /> : <SummaryRow label="Credits" value={formatUGX(creditAmountUGX)} />}
                    <SummaryRow label="Payment" value={paymentMethod} emphasize={paymentMethod === "CorporatePay"} />
                    {paymentMethod === "CorporatePay" ? (
                      <>
                        <SummaryRow label="Corporate state" value={`${corporateState}${corporateReason ? ` • ${corporateReason}` : ""}`} />
                        <SummaryRow label="Cost center" value={costCenter || "Required"} emphasize={!costCenter.trim()} />
                        <SummaryRow label="Purpose" value={purpose || "Required"} emphasize={!purpose.trim()} />
                      </>
                    ) : null}
                    {fleetEnabled && vehicle ? <SummaryRow label="Vehicle" value={`${vehicle.label} (${vehicle.plate})`} /> : null}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Policy outcome: <span className="font-semibold text-slate-900">{policy.outcome}</span>
                  </div>
                </Section>

                <Section title="Demo controls" subtitle="Preview policy states" right={<Pill label="Demo" tone="info" />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Corporate status</div>
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
                      <div className="mt-2 text-xs text-slate-500">Billing delinquency can show grace messaging.</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-600">Grace window</div>
                      <div className={cn("mt-2 rounded-3xl border border-slate-200 bg-white p-3", corporateStatus !== "Billing delinquency" && "opacity-60")}>
                        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                          Enabled
                          <input
                            type="checkbox"
                            checked={graceEnabled}
                            onChange={(e) => setGraceEnabled(e.target.checked)}
                            disabled={corporateStatus !== "Billing delinquency"}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill label={graceActive ? `Active ${msToFriendly(graceMs)}` : "Inactive"} tone={graceActive ? "warn" : "neutral"} />
                          <Button
                            variant="outline"
                            className="px-3 py-2 text-xs"
                            onClick={() => setGraceEndAt(Date.now() + 4 * 60 * 60 * 1000)}
                            disabled={corporateStatus !== "Billing delinquency"}
                          >
                            <Timer className="h-4 w-4" /> Reset
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-600">Approval threshold</div>
                      <input
                        type="number"
                        value={approvalThresholdUGX}
                        onChange={(e) => setApprovalThresholdUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-600">Per-session limit</div>
                      <input
                        type="number"
                        value={perSessionLimitUGX}
                        onChange={(e) => setPerSessionLimitUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    {mode === "credits" ? (
                      <div className="md:col-span-2">
                        <div className="text-xs font-semibold text-slate-600">Credit amount</div>
                        <input
                          type="number"
                          value={creditAmountUGX}
                          onChange={(e) => setCreditAmountUGX(clamp(Number(e.target.value || 0), 0, 9_999_999))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                        />
                      </div>
                    ) : null}
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${stepLabel(step)}`} tone="neutral" />
                  <Pill label={`Estimate: ${formatUGX(mode === "credits" ? creditAmountUGX : estimateUGX)}`} tone="neutral" />
                  <Pill label={policy.outcome} tone={toneForOutcome(policy.outcome)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={goBack} disabled={step === "station"}>
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back
                  </Button>
                  {step !== "result" ? (
                    <Button variant={canGoNext ? "primary" : "outline"} onClick={goNext} disabled={!canGoNext}>
                      <ChevronRight className="h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button
                      variant={policy.outcome === "Allowed" ? "primary" : policy.outcome === "Approval required" ? "primary" : "outline"}
                      onClick={() => {
                        if (policy.outcome === "Allowed") {
                          if (mode === "credits") buyCredits();
                          else startSession();
                        } else if (policy.outcome === "Approval required") {
                          submitForApproval();
                        } else {
                          toast({ title: "Exception", message: "Open exception request.", kind: "info" });
                        }
                      }}
                    >
                      <ChevronRight className="h-4 w-4" /> {policy.outcome === "Allowed" ? (mode === "credits" ? "Buy" : "Start") : policy.outcome === "Approval required" ? "Submit" : "Exception"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U16 EV Charging Session Payment and Receipt. Core: CorporatePay option, station allowlists, and receipt fields. Premium: off-peak suggestions and fleet vehicle allocation rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
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

function PhoneIcon() {
  return <PhoneSvg className="h-5 w-5" />;
}

function PhoneSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
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
