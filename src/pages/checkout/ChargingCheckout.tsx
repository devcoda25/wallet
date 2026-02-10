import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Paperclip,
  RefreshCcw,
  Timer,
  Upload,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

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

type Severity = "Info" | "Warning" | "Critical";

type PolicyReason = {
  id: string;
  severity: Severity;
  code: string;
  title: string;
  detail: string;
};

type AuditWhy = {
  summary: string;
  triggers: Array<{ label: string; value: string }>;
  policyPath: Array<{ step: string; detail: string }>;
  audit: Array<{ label: string; value: string }>;
};

type Attachment = { id: string; name: string; size: number; type: string; ts: number };

type StepKey = "Station" | "Plan" | "Allocation" | "Review";

type ConnectorType = "CCS2" | "Type2" | "GB/T";

type TariffModel = "Per kWh" | "Per minute";

type Station = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  openNow: boolean;
  hours: string;
  policyAllowed: boolean;
  connectors: Array<{ type: ConnectorType; available: number; total: number; maxKw: number }>;
  pricePerKwhUGX: number;
  pricePerMinUGX: number;
  idleFeePerMinUGX: number;
  notes: string;
};

type Vehicle = {
  id: string;
  label: string;
  mode: "Personal" | "Fleet";
  connector: ConnectorType;
  batteryKwh: number;
  currentSocPct: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

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

function formatBytes(bytes: number) {
  const b = Math.max(0, bytes || 0);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function msToFriendly(ms: number) {
  if (ms <= 0) return "Overdue";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
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

function Stepper({ steps, active, onJump }: { steps: StepKey[]; active: StepKey; onJump: (k: StepKey) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((s, idx) => {
          const isActive = s === active;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onJump(s)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                isActive ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="text-xs font-semibold text-slate-600">Step {idx + 1}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{s}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function computeCorporateState(args: {
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  outcome: Outcome;
}): CorporateState {
  const { paymentMethod, corporateStatus, graceActive, outcome } = args;
  if (paymentMethod !== "CorporatePay") return "Available";

  const blockedByProgram =
    corporateStatus === "Not linked" ||
    corporateStatus === "Not eligible" ||
    corporateStatus === "Deposit depleted" ||
    corporateStatus === "Credit limit exceeded" ||
    (corporateStatus === "Billing delinquency" && !graceActive);

  if (blockedByProgram) return "Not available";
  if (outcome === "Blocked") return "Not available";
  if (outcome === "Approval required") return "Requires approval";
  return "Available";
}

function evaluateChargingPolicy(args: {
  station: Station;
  vehicle: Vehicle;
  tariff: TariffModel;
  targetKwh: number;
  estMin: number;
  paymentMethod: PaymentMethod;
  corporateStatus: CorporateProgramStatus;
  graceActive: boolean;
  timeAllowed: boolean;
  geoAllowed: boolean;
  costCenter: string;
  projectTag: string;
  purpose: string;
  approvalThresholdUGX: number;
  attachments: Attachment[];
}): {
  outcome: Outcome;
  reasons: PolicyReason[];
  why: AuditWhy;
} {
  const {
    station,
    vehicle,
    tariff,
    targetKwh,
    estMin,
    paymentMethod,
    corporateStatus,
    graceActive,
    timeAllowed,
    geoAllowed,
    costCenter,
    projectTag,
    purpose,
    approvalThresholdUGX,
    attachments,
  } = args;

  const reasons: PolicyReason[] = [];

  // Basic station policy
  if (!station.policyAllowed) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "STATION", title: "Station not allowed", detail: "This station is not permitted under corporate charging policy." });
  }
  if (!geoAllowed) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "GEO", title: "Outside allowed zone", detail: "This station is outside your organization allowed zones." });
  }
  if (!timeAllowed) {
    reasons.push({ id: uid("r"), severity: "Critical", code: "TIME", title: "Outside allowed time", detail: "CorporatePay charging is restricted outside configured time windows." });
  }

  // Connector compatibility
  if (vehicle.connector !== station.connectors.find((c) => c.type === vehicle.connector)?.type) {
    // This check is simplistic; the UI ensures compatibility; keep warning.
    reasons.push({ id: uid("r"), severity: "Warning", code: "CONN", title: "Connector mismatch", detail: "Selected vehicle connector may not match station connector. Please confirm." });
  }

  // Payment
  if (paymentMethod !== "CorporatePay") {
    reasons.push({ id: uid("r"), severity: "Info", code: "PAYMENT", title: "Personal payment selected", detail: "Corporate policy checks do not block personal payments." });
  } else {
    const blockedByProgram =
      corporateStatus === "Not linked" ||
      corporateStatus === "Not eligible" ||
      corporateStatus === "Deposit depleted" ||
      corporateStatus === "Credit limit exceeded" ||
      (corporateStatus === "Billing delinquency" && !graceActive);

    if (corporateStatus === "Billing delinquency" && graceActive) {
      reasons.push({ id: uid("r"), severity: "Warning", code: "PROGRAM", title: "Grace window active", detail: "Billing is past due, but grace window is active." });
    }

    if (blockedByProgram) {
      reasons.push({ id: uid("r"), severity: "Critical", code: "PROGRAM", title: "CorporatePay unavailable", detail: `CorporatePay is unavailable due to: ${corporateStatus}.` });
    }

    // Required allocation fields
    if (!costCenter.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Cost center required", detail: "Select a cost center for charging allocation." });
    if (!purpose.trim()) reasons.push({ id: uid("r"), severity: "Critical", code: "FIELDS", title: "Purpose required", detail: "Select a purpose tag for this charging session." });

    // Project tag optional for charging, but if provided it's included
    if (!projectTag.trim()) {
      reasons.push({ id: uid("r"), severity: "Info", code: "FIELDS", title: "Project tag optional", detail: "Project tag is optional for charging unless org requires it." });
    }
  }

  // Estimate and thresholds
  const estUGX = tariff === "Per kWh" ? Math.round(targetKwh * station.pricePerKwhUGX) : Math.round(estMin * station.pricePerMinUGX);

  if (paymentMethod === "CorporatePay") {
    if (estUGX > approvalThresholdUGX) {
      reasons.push({
        id: uid("r"),
        severity: "Warning",
        code: "AMOUNT",
        title: "Approval required",
        detail: `Estimated cost ${formatUGX(estUGX)} exceeds threshold ${formatUGX(approvalThresholdUGX)}.`,
      });
    }

    // Extra: idle fee warning
    reasons.push({ id: uid("r"), severity: "Info", code: "IDLE", title: "Idle fees may apply", detail: `Idle fee is ${formatUGX(station.idleFeePerMinUGX)}/min after session ends.` });
  }

  // Determine outcome
  const hasCritical = reasons.some((r) => r.severity === "Critical");
  const hasWarning = reasons.some((r) => r.severity === "Warning");

  let outcome: Outcome = "Allowed";
  if (paymentMethod === "CorporatePay") {
    if (hasCritical) outcome = "Blocked";
    else if (hasWarning) outcome = "Approval required";
    else outcome = "Allowed";
  } else {
    // personal payment
    outcome = hasCritical ? "Blocked" : "Allowed";
  }

  const why: AuditWhy = {
    summary: "Charging checkout result is generated from station policy, allocation requirements, and CorporatePay program status.",
    triggers: [
      { label: "Station", value: station.name },
      { label: "Vehicle", value: vehicle.label },
      { label: "Connector", value: vehicle.connector },
      { label: "Tariff", value: tariff },
      { label: "Estimated", value: formatUGX(estUGX) },
      { label: "Payment", value: paymentMethod },
      { label: "Program", value: corporateStatus + (graceActive ? " (grace active)" : "") },
    ],
    policyPath: [
      { step: "Station policy", detail: station.policyAllowed ? "Station allowed" : "Station blocked" },
      { step: "Geo/time", detail: `${geoAllowed ? "Geo ok" : "Geo blocked"}, ${timeAllowed ? "Time ok" : "Time blocked"}` },
      { step: "Allocation", detail: "Cost center and purpose required when CorporatePay is used." },
      { step: "Threshold", detail: `Approval threshold: ${formatUGX(approvalThresholdUGX)}.` },
      { step: "Decision", detail: outcome },
    ],
    audit: [
      { label: "Correlation id", value: "corr_demo_u27" },
      { label: "Policy snapshot", value: "corp.charging.policy.v1" },
      { label: "Timestamp", value: new Date().toISOString() },
    ],
  };

  if (!reasons.length) {
    reasons.push({ id: uid("r"), severity: "Info", code: "OK", title: "Within policy", detail: "This charging session passes current policy checks." });
  }

  // Attachment note (optional)
  if (attachments.length) {
    reasons.push({ id: uid("r"), severity: "Info", code: "ATTACH", title: "Attachments added", detail: "Supporting evidence will be included in audit trail." });
  }

  return { outcome, reasons, why };
}

export default function UserEVChargingCheckoutU27() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const steps: StepKey[] = ["Station", "Plan", "Allocation", "Review"];
  const [step, setStep] = useState<StepKey>("Station");

  // Demo stations
  const stations: Station[] = useMemo(() => {
    return [
      {
        id: "st_kla_12",
        name: "EVzone Charging Hub Kampala Rd 12",
        address: "Plot 12, Kampala Road",
        city: "Kampala",
        country: "Uganda",
        openNow: true,
        hours: "24/7",
        policyAllowed: true,
        connectors: [
          { type: "CCS2", available: 2, total: 3, maxKw: 60 },
          { type: "Type2", available: 1, total: 2, maxKw: 22 },
        ],
        pricePerKwhUGX: 1300,
        pricePerMinUGX: 900,
        idleFeePerMinUGX: 500,
        notes: "Off-peak discounts apply after 22:00.",
      },
      {
        id: "st_ent_air",
        name: "Entebbe Airport Fast Charge",
        address: "Entebbe International Airport",
        city: "Entebbe",
        country: "Uganda",
        openNow: true,
        hours: "06:00–23:00",
        policyAllowed: true,
        connectors: [
          { type: "CCS2", available: 0, total: 2, maxKw: 120 },
          { type: "Type2", available: 1, total: 1, maxKw: 22 },
        ],
        pricePerKwhUGX: 1600,
        pricePerMinUGX: 1100,
        idleFeePerMinUGX: 800,
        notes: "Airport site may require approval above thresholds.",
      },
      {
        id: "st_restricted",
        name: "Private Depot Charger",
        address: "Depot Zone (Restricted)",
        city: "Kampala",
        country: "Uganda",
        openNow: false,
        hours: "08:00–18:00",
        policyAllowed: false,
        connectors: [{ type: "GB/T", available: 1, total: 1, maxKw: 40 }],
        pricePerKwhUGX: 1100,
        pricePerMinUGX: 700,
        idleFeePerMinUGX: 400,
        notes: "Restricted site. Use another station or request exception.",
      },
    ];
  }, []);

  const [stationId, setStationId] = useState<string>(stations[0].id);
  const station = useMemo(() => stations.find((s) => s.id === stationId) || stations[0], [stations, stationId]);

  // Demo vehicles
  const vehicles: Vehicle[] = useMemo(
    () => [
      { id: "veh_personal", label: "Personal EV (CCS2)", mode: "Personal", connector: "CCS2", batteryKwh: 60, currentSocPct: 35 },
      { id: "veh_fleet_01", label: "Fleet Car 01 (CCS2)", mode: "Fleet", connector: "CCS2", batteryKwh: 72, currentSocPct: 40 },
      { id: "veh_fleet_02", label: "Fleet Van (Type2)", mode: "Fleet", connector: "Type2", batteryKwh: 45, currentSocPct: 55 },
    ],
    []
  );
  const [vehicleId, setVehicleId] = useState<string>(vehicles[1].id);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || vehicles[0], [vehicles, vehicleId]);

  // Connector selection
  const stationConnectorOptions = useMemo(() => station.connectors.map((c) => c.type), [station]);
  const [connector, setConnector] = useState<ConnectorType>(vehicle.connector);

  useEffect(() => {
    // Keep connector compatible if possible
    if (stationConnectorOptions.includes(vehicle.connector)) {
      setConnector(vehicle.connector);
    } else if (stationConnectorOptions.includes(connector)) {
      // keep
    } else {
      setConnector(stationConnectorOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, vehicleId]);

  // Charging plan
  const [tariff, setTariff] = useState<TariffModel>("Per kWh");
  const [targetSocPct, setTargetSocPct] = useState<number>(80);
  const [targetKwhOverride, setTargetKwhOverride] = useState<number>(0); // if > 0, use it

  const targetKwh = useMemo(() => {
    if (targetKwhOverride > 0) return targetKwhOverride;
    const neededPct = clamp(targetSocPct - vehicle.currentSocPct, 0, 100);
    return Math.max(0, Math.round((neededPct / 100) * vehicle.batteryKwh));
  }, [targetKwhOverride, targetSocPct, vehicle.currentSocPct, vehicle.batteryKwh]);

  const maxKw = useMemo(() => {
    const c = station.connectors.find((x) => x.type === connector);
    return c?.maxKw || 22;
  }, [station, connector]);

  const estMin = useMemo(() => {
    // Simple estimate: minutes = (kWh / kW) * 60, add 10% overhead
    const base = maxKw > 0 ? (targetKwh / maxKw) * 60 : 0;
    return Math.max(1, Math.round(base * 1.1));
  }, [targetKwh, maxKw]);

  const estCostUGX = useMemo(() => {
    const energyCost = Math.round(targetKwh * station.pricePerKwhUGX);
    const timeCost = Math.round(estMin * station.pricePerMinUGX);
    return tariff === "Per kWh" ? energyCost : timeCost;
  }, [tariff, targetKwh, station.pricePerKwhUGX, estMin, station.pricePerMinUGX]);

  // Allocation
  const costCenters = useMemo(() => ["OPS-01", "FLEET-01", "SAL-03", "FIN-01", "CAPEX-01"], []);
  const projectTags = useMemo(() => ["Fleet", "Operations", "Project", "Client", "Event", "CapEx"], []);
  const purposes = useMemo(() => ["Charging", "Operations", "Client meeting", "Travel", "Training", "Other"], []);

  const [costCenter, setCostCenter] = useState<string>("FLEET-01");
  const [projectTag, setProjectTag] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("Charging");
  const [note, setNote] = useState<string>("");

  // Attachments (optional)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list: Attachment[] = [];
    for (const f of Array.from(files)) {
      list.push({ id: uid("att"), name: f.name, size: f.size, type: f.type || "unknown", ts: Date.now() });
    }
    setAttachments((prev) => [...list, ...prev].slice(0, 10));
    toast({ title: "Attached", message: `${list.length} file(s) added.`, kind: "success" });
  };

  const addAttachmentName = () => {
    const name = prompt("Enter attachment name (example: Vehicle Log.pdf)")?.trim();
    if (!name) return;
    setAttachments((p) => [{ id: uid("att"), name, size: 0, type: "manual", ts: Date.now() }, ...p].slice(0, 10));
    toast({ title: "Attached", message: name, kind: "success" });
  };

  const removeAttachment = (id: string) => {
    setAttachments((p) => p.filter((a) => a.id !== id));
    toast({ title: "Removed", message: "Attachment removed.", kind: "info" });
  };

  // Corporate payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CorporatePay");
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

  // Policy simulation toggles
  const [geoAllowed, setGeoAllowed] = useState(true);
  const [timeAllowed, setTimeAllowed] = useState(true);

  // Approval threshold for charging (demo)
  const approvalThresholdUGX = 150000;

  const policy = useMemo(() => {
    return evaluateChargingPolicy({
      station,
      vehicle,
      tariff,
      targetKwh,
      estMin,
      paymentMethod,
      corporateStatus,
      graceActive,
      timeAllowed,
      geoAllowed,
      costCenter,
      projectTag,
      purpose,
      approvalThresholdUGX,
      attachments,
    });
  }, [station, vehicle, tariff, targetKwh, estMin, paymentMethod, corporateStatus, graceActive, timeAllowed, geoAllowed, costCenter, projectTag, purpose, attachments]);

  const corporateState = useMemo(() => {
    return computeCorporateState({ paymentMethod, corporateStatus, graceActive, outcome: policy.outcome });
  }, [paymentMethod, corporateStatus, graceActive, policy.outcome]);

  // Why modal
  const [whyOpen, setWhyOpen] = useState(false);

  // Start / approval result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { kind: "started" | "approval"; id: string }>(null);

  const canProceed = useMemo(() => {
    if (policy.outcome === "Blocked") return false;
    if (paymentMethod === "CorporatePay" && corporateState === "Not available") return false;
    // Connector availability
    const c = station.connectors.find((x) => x.type === connector);
    if (c && c.available <= 0) return false;
    // Station open
    if (!station.openNow) return false;
    return true;
  }, [policy.outcome, paymentMethod, corporateState, station, connector]);

  const submit = () => {
    if (!canProceed) {
      toast({ title: "Cannot proceed", message: "Fix issues, choose another station or payment method.", kind: "warn" });
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (paymentMethod === "CorporatePay" && policy.outcome === "Approval required") {
        const id = `REQ-CH-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setResult({ kind: "approval", id });
        toast({ title: "Submitted", message: `Approval request ${id} created.`, kind: "success" });
      } else {
        const id = `SESS-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        setResult({ kind: "started", id });
        toast({ title: "Charging started", message: `Session ${id} started.`, kind: "success" });
      }
    }, 900);
  };

  const goNext = () => {
    const idx = steps.indexOf(step);
    setStep(steps[Math.min(steps.length - 1, idx + 1)]);
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    setStep(steps[Math.max(0, idx - 1)]);
  };

  // Step readiness (for visuals)
  const stationOk = station.openNow && station.connectors.some((c) => c.available > 0) && station.policyAllowed && geoAllowed && timeAllowed;
  const planOk = targetKwh > 0 && estMin > 0;
  const allocationOk = paymentMethod !== "CorporatePay" || (!!costCenter.trim() && !!purpose.trim());

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
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">EV Charging checkout</div>
                    <Pill label="U27" tone="neutral" />
                    <Pill label="CorporatePay" tone="info" />
                    <Pill label={station.city} tone="neutral" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Station rules, kWh estimates, policy checks, and corporate receipts.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Outcome: ${policy.outcome}`} tone={policy.outcome === "Allowed" ? "good" : policy.outcome === "Approval required" ? "warn" : "bad"} />
                    <Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                    {paymentMethod === "CorporatePay" ? (
                      <Pill label={`CorporatePay: ${corporateState}`} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Map", message: "Back to station map (demo).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4 rotate-180" /> Map
                </Button>
                <Button variant="outline" onClick={() => setWhyOpen(true)}>
                  <Info className="h-4 w-4" /> Why
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setSubmitting(false);
                    toast({ title: "Reset", message: "Checkout reset (demo).", kind: "info" });
                  }}
                >
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Stepper steps={steps} active={step} onJump={setStep} />
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left */}
              <div className="lg:col-span-7 space-y-4">
                {step === "Station" ? (
                  <>
                    <Section
                      title="Station"
                      subtitle="Select a station and review site rules"
                      right={<Pill label={station.openNow ? "Open" : "Closed"} tone={station.openNow ? "good" : "warn"} />}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Station</div>
                          <select
                            value={stationId}
                            onChange={(e) => {
                              setStationId(e.target.value);
                              setResult(null);
                              toast({ title: "Station", message: "Station changed.", kind: "info" });
                            }}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {stations.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>

                          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{station.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{station.address} • {station.city}, {station.country}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={station.hours} tone="neutral" />
                                  <Pill label={station.policyAllowed ? "Policy allowed" : "Policy blocked"} tone={station.policyAllowed ? "good" : "bad"} />
                                  <Pill label={station.openNow ? "Open now" : "Closed"} tone={station.openNow ? "good" : "warn"} />
                                </div>
                              </div>
                              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <MapPin className="h-6 w-6" />
                              </div>
                            </div>

                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              {station.notes}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Connectors</div>
                          <div className="mt-2 space-y-2">
                            {station.connectors.map((c) => (
                              <div key={c.type} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill label={c.type} tone="neutral" />
                                      <Pill label={`${c.available}/${c.total} available`} tone={c.available > 0 ? "good" : "warn"} />
                                      <Pill label={`${c.maxKw} kW`} tone="info" />
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">Tariffs</div>
                                    <div className="mt-1 text-xs text-slate-600">{formatUGX(station.pricePerKwhUGX)}/kWh or {formatUGX(station.pricePerMinUGX)}/min</div>
                                    <div className="mt-1 text-xs text-slate-500">Idle fee: {formatUGX(station.idleFeePerMinUGX)}/min</div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Policy simulation</div>
                            <div className="mt-1 text-xs text-slate-500">Demo toggles for allowed zone and time window</div>
                          </div>
                          <Pill label="Demo" tone="neutral" />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <ToggleRow label="Within allowed zone" enabled={geoAllowed} onToggle={() => setGeoAllowed((v) => !v)} />
                          <ToggleRow label="Within allowed time" enabled={timeAllowed} onToggle={() => setTimeAllowed((v) => !v)} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button variant="primary" onClick={goNext} disabled={!stationOk} title={!stationOk ? "Station checks must pass" : ""}>
                          <ChevronRight className="h-4 w-4" /> Continue
                        </Button>
                        {!stationOk ? <Pill label="Fix station constraints" tone="warn" /> : <Pill label="Station ok" tone="good" />}
                      </div>
                    </Section>
                  </>
                ) : null}

                {step === "Plan" ? (
                  <Section
                    title="Charging plan"
                    subtitle="Select vehicle, connector, target, and tariff"
                    right={<Pill label={`${targetKwh} kWh`} tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Vehicle</div>
                        <select
                          value={vehicleId}
                          onChange={(e) => {
                            setVehicleId(e.target.value);
                            setResult(null);
                          }}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                        >
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Vehicle details</div>
                              <div className="mt-1 text-xs text-slate-500">Mode: {vehicle.mode} • Battery: {vehicle.batteryKwh} kWh</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill label={`Connector: ${vehicle.connector}`} tone="info" />
                                <Pill label={`SOC: ${vehicle.currentSocPct}%`} tone="neutral" />
                              </div>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <Zap className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-600">Connector</div>
                        <select
                          value={connector}
                          onChange={(e) => {
                            setConnector(e.target.value as ConnectorType);
                            setResult(null);
                          }}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                        >
                          {station.connectors.map((c) => (
                            <option key={c.type} value={c.type}>
                              {c.type} ({c.available}/{c.total} available, {c.maxKw} kW)
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Target</div>
                          <div className="mt-2 grid grid-cols-1 gap-3">
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              If you set SOC target, we estimate kWh based on battery size.
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-600">SOC target: {targetSocPct}%</div>
                              <input
                                type="range"
                                min={vehicle.currentSocPct}
                                max={100}
                                value={targetSocPct}
                                onChange={(e) => {
                                  setTargetSocPct(Number(e.target.value));
                                  setTargetKwhOverride(0);
                                }}
                                className="mt-2 w-full"
                              />
                              <div className="mt-1 text-xs text-slate-500">Current: {vehicle.currentSocPct}%</div>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-slate-600">Or override target kWh</div>
                              <input
                                type="number"
                                value={targetKwhOverride}
                                onChange={(e) => setTargetKwhOverride(Number(e.target.value || 0))}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                placeholder="0"
                              />
                              <div className="mt-1 text-xs text-slate-500">Set to 0 to use SOC estimate.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Tariff</div>
                          <div className="mt-1 text-xs text-slate-500">Choose how the station bills</div>
                        </div>
                        <Pill label={tariff} tone="neutral" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Per kWh", "Per minute"] as TariffModel[]).map((t) => {
                          const active = tariff === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTariff(t)}
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                              style={active ? { background: EVZ.green } : undefined}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <InfoRow label="Estimated kWh" value={`${targetKwh} kWh`} />
                        <InfoRow label="Estimated time" value={`${estMin} min`} />
                        <InfoRow label="Estimated cost" value={formatUGX(estCostUGX)} emphasize={estCostUGX > approvalThresholdUGX} />
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Premium: off-peak suggestions can reduce cost. (Example: after 22:00)
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="primary" onClick={goNext} disabled={!planOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                    </div>
                  </Section>
                ) : null}

                {step === "Allocation" ? (
                  <Section
                    title="Allocation and purpose"
                    subtitle="U9 and U10 behavior: cost center, project tag, purpose and notes"
                    right={<Pill label={paymentMethod === "CorporatePay" ? "Corporate" : "Personal"} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Payment method</div>
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {([
                            { id: "CorporatePay" as const, label: "CorporatePay", desc: "Company-paid with policy and approvals" },
                            { id: "Personal Wallet" as const, label: "Personal Wallet", desc: "Pay personally" },
                            { id: "Card" as const, label: "Card", desc: "Visa/Mastercard" },
                            { id: "Mobile Money" as const, label: "Mobile Money", desc: "MTN/Airtel" },
                          ] as Array<{ id: PaymentMethod; label: string; desc: string }>).map((p) => {
                            const selected = paymentMethod === p.id;
                            const disabled = p.id === "CorporatePay" && corporateState === "Not available";
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) {
                                    toast({ title: "Unavailable", message: "CorporatePay is not available. Use personal payment.", kind: "warn" });
                                    return;
                                  }
                                  setPaymentMethod(p.id);
                                  toast({ title: "Payment", message: p.label, kind: "success" });
                                }}
                                className={cn(
                                  "rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                                  selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
                                  disabled && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                                      {p.id === "CorporatePay" ? (
                                        <Pill label={corporateState} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                                      ) : null}
                                      {selected ? <Pill label="Selected" tone="info" /> : null}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">{p.desc}</div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Corporate status</div>
                              <div className="mt-1 text-xs text-slate-500">Demo controls for program state</div>
                            </div>
                            <Pill label={corporateStatus} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} />
                          </div>

                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-600">Program</div>
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
                          </div>

                          <div className={cn("mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4", corporateStatus !== "Billing delinquency" && "opacity-60")}>
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
                            <div className="mt-2 flex flex-wrap items-center gap-2">
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

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                            If CorporatePay is disabled, the user should fall back to personal payment.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={cn("mt-4 rounded-3xl border border-slate-200 bg-white p-4", paymentMethod !== "CorporatePay" && "opacity-70")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allocation</div>
                          <div className="mt-1 text-xs text-slate-500">When CorporatePay is selected, cost center and purpose are required</div>
                        </div>
                        <Pill label={paymentMethod === "CorporatePay" ? "Required" : "Optional"} tone={paymentMethod === "CorporatePay" ? "warn" : "neutral"} />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Cost center {paymentMethod === "CorporatePay" ? <span className="text-rose-600">*</span> : null}</div>
                          <select
                            value={costCenter}
                            onChange={(e) => setCostCenter(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              paymentMethod === "CorporatePay" && !costCenter.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                            disabled={paymentMethod !== "CorporatePay"}
                          >
                            <option value="">Select</option>
                            {costCenters.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Project tag (optional)</div>
                          <select
                            value={projectTag}
                            onChange={(e) => setProjectTag(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                            disabled={paymentMethod !== "CorporatePay"}
                          >
                            <option value="">None</option>
                            {projectTags.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600">Purpose {paymentMethod === "CorporatePay" ? <span className="text-rose-600">*</span> : null}</div>
                          <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
                              paymentMethod === "CorporatePay" && !purpose.trim() ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
                            )}
                            disabled={paymentMethod !== "CorporatePay"}
                          >
                            <option value="">Select</option>
                            {purposes.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600">Note (recommended)</div>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="Example: fleet charging for operations"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                          disabled={paymentMethod !== "CorporatePay"}
                        />
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Purpose and cost center appear on corporate receipts and invoices.
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button variant="primary" onClick={goNext} disabled={!allocationOk}>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </Button>
                      {!allocationOk ? <Pill label="Allocation required" tone="warn" /> : <Pill label="Ok" tone="good" />}
                    </div>
                  </Section>
                ) : null}

                {step === "Review" ? (
                  <Section
                    title="Review"
                    subtitle="Validate station rules, estimate, payment, and receipt expectations"
                    right={<Pill label={formatUGX(estCostUGX)} tone={estCostUGX > approvalThresholdUGX ? "warn" : "neutral"} />}
                  >
                    <div className={cn(
                      "rounded-3xl border p-4",
                      policy.outcome === "Allowed" ? "border-emerald-200 bg-emerald-50" : policy.outcome === "Approval required" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={policy.outcome} tone={policy.outcome === "Allowed" ? "good" : policy.outcome === "Approval required" ? "warn" : "bad"} />
                            <Pill label={paymentMethod} tone={paymentMethod === "CorporatePay" ? "info" : "neutral"} />
                            {paymentMethod === "CorporatePay" ? <Pill label={`CorporatePay: ${corporateState}`} tone={corporateState === "Available" ? "good" : corporateState === "Requires approval" ? "warn" : "bad"} /> : null}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{station.name}</div>
                          <div className="mt-1 text-sm text-slate-700">{station.address} • {station.city}</div>
                        </div>
                        <div className={cn(
                          "grid h-11 w-11 place-items-center rounded-2xl bg-white ring-1",
                          policy.outcome === "Allowed" ? "text-emerald-700 ring-emerald-200" : policy.outcome === "Approval required" ? "text-amber-900 ring-amber-200" : "text-rose-700 ring-rose-200"
                        )}>
                          {policy.outcome === "Allowed" ? <BadgeCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoRow label="Connector" value={connector} />
                        <InfoRow label="Vehicle" value={vehicle.label} />
                        <InfoRow label="Target" value={`${targetKwh} kWh`} />
                        <InfoRow label="Estimate" value={`${estMin} min`} />
                        <InfoRow label="Tariff" value={tariff} />
                        <InfoRow label="Estimated cost" value={formatUGX(estCostUGX)} emphasize={estCostUGX > approvalThresholdUGX} />
                      </div>

                      <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Receipt will include: station, connector, kWh, time, total, cost center, purpose, vehicle, and session id.
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Policy reasons</div>
                          <div className="mt-1 text-xs text-slate-500">Allowed, warnings, or blocks</div>
                        </div>
                        <Button variant="outline" onClick={() => setWhyOpen(true)}>
                          <Info className="h-4 w-4" /> Why
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {policy.reasons.map((r) => (
                          <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={r.code} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                                  <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                  <Pill label={r.severity} tone={r.severity === "Critical" ? "bad" : r.severity === "Warning" ? "warn" : "neutral"} />
                                </div>
                                <div className="mt-1 text-sm text-slate-700">{r.detail}</div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                        <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Approval required</div>
                              <div className="mt-1 text-sm text-slate-700">Estimated cost exceeds threshold or station rules require approval.</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-900 ring-1 ring-amber-200">
                              <Timer className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            Expected decision: within 8 hours (configurable). Track in U13.
                          </div>
                        </div>
                      ) : null}

                      {policy.outcome === "Blocked" ? (
                        <div className="mt-3 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Fix required</div>
                              <div className="mt-1 text-sm text-slate-700">Change station, adjust time/zone, or pay personally.</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-700 ring-1 ring-rose-200">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPaymentMethod("Personal Wallet");
                                toast({ title: "Payment", message: "Switched to personal wallet.", kind: "info" });
                              }}
                            >
                              <Wallet className="h-4 w-4" /> Pay personally
                            </Button>
                            <Button variant="outline" onClick={() => setStep("Station")}>
                              <ChevronRight className="h-4 w-4 rotate-180" /> Change station
                            </Button>
                            <Button variant="outline" onClick={() => toast({ title: "Support", message: "Open U22 to raise an issue or request exception.", kind: "info" })}>
                              <AlertTriangle className="h-4 w-4" /> Request exception
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Attachments */}
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Attachments (optional)</div>
                          <div className="mt-1 text-xs text-slate-500">Add supporting evidence if needed</div>
                        </div>
                        <Pill label={`${attachments.length}`} tone={attachments.length ? "info" : "neutral"} />
                      </div>

                      <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => addFiles(e.target.files)} />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => fileRef.current?.click()}>
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                        <Button variant="outline" onClick={addAttachmentName}>
                          <Paperclip className="h-4 w-4" /> Add name
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {attachments.map((a) => (
                          <div key={a.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{a.type} • {formatBytes(a.size)} • {timeAgo(a.ts)}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => removeAttachment(a.id)}>
                              <X className="h-4 w-4" /> Remove
                            </Button>
                          </div>
                        ))}
                        {!attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">No attachments.</div> : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={goBack}>
                        <ChevronRight className="h-4 w-4 rotate-180" /> Back
                      </Button>
                      <Button
                        variant={policy.outcome === "Blocked" ? "outline" : "primary"}
                        onClick={submit}
                        disabled={!canProceed || submitting || policy.outcome === "Blocked"}
                        title={!canProceed ? "Resolve issues first" : ""}
                      >
                        {submitting ? (
                          <>
                            <Timer className="h-4 w-4" /> Working…
                          </>
                        ) : paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                          <>
                            <FileText className="h-4 w-4" /> Submit for approval
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" /> Start charging
                          </>
                        )}
                      </Button>
                    </div>

                    {result ? (
                      <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                        {result.kind === "approval" ? (
                          <>
                            <div className="text-sm font-semibold text-slate-900">Submitted for approval</div>
                            <div className="mt-1 text-sm text-slate-700">Request ID: <span className="font-semibold">{result.id}</span>. Track status in U13.</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-slate-900">Charging started</div>
                            <div className="mt-1 text-sm text-slate-700">Session ID: <span className="font-semibold">{result.id}</span>. Receipt will be generated after completion.</div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </Section>
                ) : null}
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Estimate" subtitle="Cost, time, and pricing" right={<Pill label={tariff} tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoRow label="kWh" value={`${targetKwh}`} />
                    <InfoRow label="Minutes" value={`${estMin}`} />
                    <InfoRow label="Cost" value={formatUGX(estCostUGX)} emphasize={paymentMethod === "CorporatePay" && estCostUGX > approvalThresholdUGX} />
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Pricing: {formatUGX(station.pricePerKwhUGX)}/kWh or {formatUGX(station.pricePerMinUGX)}/min. Idle: {formatUGX(station.idleFeePerMinUGX)}/min.
                  </div>
                </Section>

                <Section title="Receipt preview" subtitle="What will be recorded" right={<Pill label="Audit" tone="info" />}>
                  <div className="space-y-2">
                    <InfoRow label="Station" value={station.name} />
                    <InfoRow label="Connector" value={connector} />
                    <InfoRow label="Tariff" value={tariff} />
                    <InfoRow label="kWh" value={`${targetKwh} (est)`} />
                    <InfoRow label="Time" value={`${estMin} min (est)`} />
                    <InfoRow label="Total" value={formatUGX(estCostUGX)} emphasize={paymentMethod === "CorporatePay" && estCostUGX > approvalThresholdUGX} />
                    <InfoRow label="Cost center" value={costCenter || "-"} emphasize={paymentMethod === "CorporatePay" && !costCenter.trim()} />
                    <InfoRow label="Purpose" value={purpose || "-"} emphasize={paymentMethod === "CorporatePay" && !purpose.trim()} />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Receipt becomes available in U6 after session completion.
                  </div>
                </Section>

                <Section title="Readiness" subtitle="What is required to proceed" right={<Pill label={canProceed ? "Ready" : "Fix"} tone={canProceed ? "good" : "warn"} />}>
                  <div className="space-y-2">
                    <ChecklistRow ok={station.openNow} label="Station open" hint={station.hours} />
                    <ChecklistRow ok={station.connectors.some((c) => c.type === connector && c.available > 0)} label="Connector availability" hint={connector} />
                    <ChecklistRow ok={station.policyAllowed && geoAllowed && timeAllowed} label="Station policy" hint="Allowed zone and time" />
                    <ChecklistRow ok={planOk} label="Plan" hint="Target and estimate" />
                    <ChecklistRow ok={allocationOk} label="Allocation" hint={paymentMethod === "CorporatePay" ? "Cost center and purpose" : "Optional"} />
                    <ChecklistRow ok={policy.outcome !== "Blocked"} label="Policy outcome" hint={policy.outcome} />
                  </div>
                </Section>
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="sticky bottom-3 mt-5 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(2,8,23,0.10)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill label={`Step: ${step}`} tone="neutral" />
                  <Pill label={`Estimate: ${formatUGX(estCostUGX)}`} tone={paymentMethod === "CorporatePay" && estCostUGX > approvalThresholdUGX ? "warn" : "neutral"} />
                  <Pill label={`Outcome: ${policy.outcome}`} tone={policy.outcome === "Allowed" ? "good" : policy.outcome === "Approval required" ? "warn" : "bad"} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setWhyOpen(true)}>
                    <Info className="h-4 w-4" /> Why
                  </Button>
                  <Button
                    variant={step === "Review" ? (policy.outcome === "Blocked" ? "outline" : "primary") : "primary"}
                    onClick={() => {
                      if (step === "Review") submit();
                      else goNext();
                    }}
                    disabled={step === "Review" ? submitting || !canProceed || policy.outcome === "Blocked" : false}
                  >
                    {step === "Review" ? (
                      submitting ? (
                        <>
                          <Timer className="h-4 w-4" /> Working…
                        </>
                      ) : paymentMethod === "CorporatePay" && policy.outcome === "Approval required" ? (
                        <>
                          <FileText className="h-4 w-4" /> Submit
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" /> Start
                        </>
                      )
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" /> Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U27 EV Charging Checkout with CorporatePay. Station rules, kWh/time estimates, CorporatePay validation, allocation capture, and receipt preview.
            </div>
          </div>
        </div>
      </div>

      {/* Why modal */}
      <Modal
        open={whyOpen}
        title="Why did I get this result?"
        subtitle="Policy and audit-linked explanation"
        onClose={() => setWhyOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setWhyOpen(false)}>
              Close
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Summary</div>
                <div className="mt-1 text-sm text-slate-700">{policy.why.summary}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600">Triggers</div>
              <div className="mt-3 space-y-2">
                {policy.why.triggers.map((t) => (
                  <div key={t.label} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">{t.label}</div>
                    <div className="text-right">{t.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600">Audit references</div>
              <div className="mt-3 space-y-2">
                {policy.why.audit.map((a) => (
                  <div key={a.label} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">{a.label}</div>
                    <div className="text-right">{a.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Policy decision path</div>
            <div className="mt-3 space-y-2">
              {policy.why.policyPath.map((p, idx) => (
                <div key={`${p.step}-${idx}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.step}</div>
                      <div className="mt-1 text-sm text-slate-600">{p.detail}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Explanations are derived from policy rules and audit triggers.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", emphasize ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("text-sm font-semibold text-slate-900 text-right", emphasize && "text-amber-900")}>{value}</div>
    </div>
  );
}

function ChecklistRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-2xl border px-3 py-2", ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-slate-600">{hint}</div> : null}
      </div>
      {ok ? <Pill label="OK" tone="good" /> : <Pill label="Fix" tone="warn" />}
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="mt-1 text-xs text-slate-600">{enabled ? "On" : "Off"}</div>
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={onToggle}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}
