import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Fingerprint,
  Globe,
  Info,
  Laptop,
  Lock,
  Monitor,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Risk = "Low" | "Medium" | "High";

type DeviceType = "Mobile" | "Laptop" | "Desktop";

type Device = {
  id: string;
  label: string;
  type: DeviceType;
  os: string;
  browser: string;
  lastSeenAt: number;
  location: { city: string; country: string; ip: string };
  trusted: boolean;
  trustExpiresAt?: number;
  sessionActive: boolean;
  risk: Risk;
};

type AuthMethod = "Password" | "SSO";

type StepUpMethod = "None" | "MFA" | "OTP";

type LoginStatus = "Success" | "Failed";

type LoginEvent = {
  id: string;
  ts: number;
  status: LoginStatus;
  deviceId: string;
  deviceLabel: string;
  location: { city: string; country: string; ip: string };
  authMethod: AuthMethod;
  stepUp: StepUpMethod;
  risk: Risk;
  reasonCodes: string[];
};

type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Policy = {
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

type StepUpContext = {
  pendingLogin: Omit<LoginEvent, "id" | "stepUp" | "status">;
  required: boolean;
  reasons: string[];
};

type WhyBody = {
  summary: string;
  triggers: Array<{ label: string; value: string }>;
  policyPath: Array<{ step: string; detail: string }>;
  audit: Array<{ label: string; value: string }>;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function toneForRisk(r: Risk) {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
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

function deviceIcon(type: DeviceType) {
  if (type === "Mobile") return <Smartphone className="h-5 w-5" />;
  if (type === "Laptop") return <Laptop className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function exportSecurityReportToPrint(args: {
  devices: Device[];
  logins: LoginEvent[];
  mfaEnabled: boolean;
  trustedCount: number;
  policy: Policy;
}) {
  const w = window.open("", "_blank", "width=920,height=760");
  if (!w) return;

  const deviceRows = args.devices
    .slice()
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map(
      (d) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:800;">${escapeHtml(d.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.type)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.location.city)}, ${escapeHtml(d.location.country)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.trusted ? "Trusted" : "Not trusted")}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(new Date(d.lastSeenAt).toLocaleString())}</td>
      </tr>
    `
    )
    .join("\n");

  const loginRows = args.logins
    .slice(0, 12)
    .map(
      (l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:800;">${escapeHtml(l.status)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.deviceLabel)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.location.city)}, ${escapeHtml(l.location.country)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.stepUp)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(new Date(l.ts).toLocaleString())}</td>
      </tr>
    `
    )
    .join("\n");

  w.document.write(`
    <html>
      <head>
        <title>Security Report</title>
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
          @media print { .no-print { display:none; } body{padding:0;} }
        </style>
      </head>
      <body>
        <div class="row" style="align-items:flex-start;">
          <div>
            <div class="pill" style="background: rgba(3,205,140,0.12); color:#065f46;">CorporatePay</div>
            <h1 style="margin-top:10px;">Security & Trust Report</h1>
            <div class="muted" style="margin-top:6px;">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">MFA</div>
            <div style="font-weight:900;">${args.mfaEnabled ? "Enabled" : "Not enabled"}</div>
            <div class="muted" style="margin-top:6px;">Trusted devices: ${escapeHtml(String(args.trustedCount))}</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <div class="row">
            <div>
              <div class="muted">Policy</div>
              <div style="font-weight:800;">Step-up: ${args.policy.stepUpEnabled ? "On" : "Off"} • Trusted devices: ${args.policy.allowTrustedDevices ? "On" : "Off"}</div>
            </div>
            <div>
              <div class="muted">Channels</div>
              <div style="font-weight:800;">${escapeHtml(Object.entries(args.policy.allowedChannels).filter(([, v]) => v).map(([k]) => k).join(", ") || "In-app")}</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Devices</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Device</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Type</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Location</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Trust</th>
                <th style="text-align:right; padding:8px 0; color:#64748b; font-size:12px;">Last seen</th>
              </tr>
            </thead>
            <tbody>
              ${deviceRows}
            </tbody>
          </table>
        </div>

        <div class="card" style="margin-top:18px;">
          <h2>Recent logins</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Status</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Device</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Location</th>
                <th style="text-align:left; padding:8px 0; color:#64748b; font-size:12px;">Step-up</th>
                <th style="text-align:right; padding:8px 0; color:#64748b; font-size:12px;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${loginRows}
            </tbody>
          </table>
          <div class="muted" style="margin-top:10px;">Use Print and select “Save as PDF”.</div>
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

function escapeHtml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function evalRisk(args: {
  lastSuccess: LoginEvent | null;
  deviceKnown: boolean;
  city: string;
  country: string;
  ts: number;
}): { risk: Risk; codes: string[] } {
  const codes: string[] = [];
  if (!args.deviceKnown) codes.push("new_device");

  if (args.lastSuccess) {
    if (args.lastSuccess.location.country !== args.country) codes.push("new_country");
    else if (args.lastSuccess.location.city !== args.city) codes.push("new_city");

    const diffMs = Math.abs(args.ts - args.lastSuccess.ts);
    if (diffMs < 2 * 60 * 60 * 1000 && args.lastSuccess.location.country !== args.country) {
      codes.push("impossible_travel");
    }
  }

  const risk: Risk = codes.includes("impossible_travel") ? "High" : codes.length >= 2 ? "Medium" : codes.length === 1 ? "Medium" : "Low";
  return { risk, codes };
}

function shouldStepUp(policy: Policy, codes: string[]): boolean {
  if (!policy.stepUpEnabled) return false;
  if (!policy.allowRiskStepUp) return false;
  if (codes.includes("new_country") && policy.allowGeoStepUp) return true;
  if (codes.includes("new_city") && policy.allowGeoStepUp) return true;
  if (codes.includes("new_device") && policy.allowNewDeviceStepUp) return true;
  if (codes.includes("impossible_travel") && policy.allowImpossibleTravelStepUp) return true;
  return false;
}

export default function UserSecurityTrustSignalsU24() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [policy, setPolicy] = useState<Policy>(() => ({
    mfaSupported: true,
    stepUpEnabled: true,
    allowTrustedDevices: true,
    trustExpiryDays: 30,
    maxTrustedDevices: 5,
    allowRiskStepUp: true,
    allowGeoStepUp: true,
    allowNewDeviceStepUp: true,
    allowImpossibleTravelStepUp: true,
    allowSessionManagement: true,
    allowedChannels: { "In-app": true, Email: true, WhatsApp: true, WeChat: false, SMS: true },
  }));

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [devices, setDevices] = useState<Device[]>(() => {
    const now = Date.now();
    return [
      {
        id: "dev_phone",
        label: "Pixel 8 Pro",
        type: "Mobile",
        os: "Android 14",
        browser: "Chrome",
        lastSeenAt: now - 18 * 60 * 1000,
        location: { city: "Kampala", country: "Uganda", ip: "197.239.1.10" },
        trusted: true,
        trustExpiresAt: now + 24 * 24 * 60 * 60 * 1000,
        sessionActive: true,
        risk: "Low",
      },
      {
        id: "dev_laptop",
        label: "MacBook Pro",
        type: "Laptop",
        os: "macOS",
        browser: "Chrome",
        lastSeenAt: now - 2 * 24 * 60 * 60 * 1000,
        location: { city: "Kampala", country: "Uganda", ip: "197.239.1.11" },
        trusted: true,
        trustExpiresAt: now + 11 * 24 * 60 * 60 * 1000,
        sessionActive: false,
        risk: "Low",
      },
      {
        id: "dev_desktop",
        label: "Windows Desktop",
        type: "Desktop",
        os: "Windows 11",
        browser: "Edge",
        lastSeenAt: now - 14 * 24 * 60 * 60 * 1000,
        location: { city: "Wuxi", country: "China", ip: "58.208.22.9" },
        trusted: false,
        sessionActive: false,
        risk: "Medium",
      },
    ];
  });

  const [logins, setLogins] = useState<LoginEvent[]>(() => {
    const now = Date.now();
    return [
      {
        id: uid("login"),
        ts: now - 18 * 60 * 1000,
        status: "Success",
        deviceId: "dev_phone",
        deviceLabel: "Pixel 8 Pro",
        location: { city: "Kampala", country: "Uganda", ip: "197.239.1.10" },
        authMethod: "Password",
        stepUp: "None",
        risk: "Low",
        reasonCodes: [],
      },
      {
        id: uid("login"),
        ts: now - 2 * 24 * 60 * 60 * 1000,
        status: "Success",
        deviceId: "dev_laptop",
        deviceLabel: "MacBook Pro",
        location: { city: "Kampala", country: "Uganda", ip: "197.239.1.11" },
        authMethod: "SSO",
        stepUp: "MFA",
        risk: "Medium",
        reasonCodes: ["new_device"],
      },
      {
        id: uid("login"),
        ts: now - 3 * 24 * 60 * 60 * 1000,
        status: "Failed",
        deviceId: "dev_desktop",
        deviceLabel: "Windows Desktop",
        location: { city: "Wuxi", country: "China", ip: "58.208.22.9" },
        authMethod: "Password",
        stepUp: "None",
        risk: "High",
        reasonCodes: ["new_country", "new_device"],
      },
    ];
  });

  const lastSuccess = useMemo(() => {
    return logins
      .slice()
      .filter((l) => l.status === "Success")
      .sort((a, b) => b.ts - a.ts)[0] || null;
  }, [logins]);

  const trustedCount = useMemo(() => devices.filter((d) => d.trusted).length, [devices]);

  // Why modal
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyTitle, setWhyTitle] = useState("");
  const [whyBody, setWhyBody] = useState<WhyBody | null>(null);

  const openWhy = (title: string, body: WhyBody) => {
    setWhyTitle(title);
    setWhyBody(body);
    setWhyOpen(true);
  };

  // Step-up modal
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpCtx, setStepUpCtx] = useState<StepUpContext | null>(null);
  const [otp, setOtp] = useState("");
  const [trustThisDevice, setTrustThisDevice] = useState(true);

  const nowTick = useMemo(() => Date.now(), [logins.length, devices.length]);

  // Simulate logins
  const createLoginAttempt = (args: {
    deviceId?: string;
    deviceLabel: string;
    location: { city: string; country: string; ip: string };
    authMethod: AuthMethod;
    knownDevice: boolean;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
  }) => {
    const ts = Date.now();

    const riskEval = evalRisk({
      lastSuccess,
      deviceKnown: args.knownDevice,
      city: args.location.city,
      country: args.location.country,
      ts,
    });

    const pending: Omit<LoginEvent, "id" | "stepUp" | "status"> = {
      ts,
      deviceId: args.deviceId || "pending",
      deviceLabel: args.deviceLabel,
      location: args.location,
      authMethod: args.authMethod,
      risk: riskEval.risk,
      reasonCodes: riskEval.codes,
    };

    const requiresStepUp = shouldStepUp(policy, riskEval.codes);

    // If device is new, create it now as pending
    if (!args.knownDevice) {
      const newDevId = uid("dev");
      setDevices((prev) => [
        {
          id: newDevId,
          label: args.deviceLabel,
          type: args.deviceType || "Laptop",
          os: args.os || "Unknown",
          browser: args.browser || "Browser",
          lastSeenAt: ts,
          location: args.location,
          trusted: false,
          sessionActive: false,
          risk: riskEval.risk,
        },
        ...prev,
      ]);

      pending.deviceId = newDevId;
    }

    if (requiresStepUp) {
      setStepUpCtx({ pendingLogin: pending, required: true, reasons: riskEval.codes });
      setOtp("");
      setTrustThisDevice(true);
      setStepUpOpen(true);
      toast({ title: "Step-up required", message: "Additional verification is needed.", kind: "warn" });
      return;
    }

    // Finalize success
    finalizeLogin({ pending, stepUp: "None", status: "Success" });
  };

  const finalizeLogin = (args: { pending: Omit<LoginEvent, "id" | "stepUp" | "status">; stepUp: StepUpMethod; status: LoginStatus }) => {
    const id = uid("login");
    const event: LoginEvent = { id, ...args.pending, stepUp: args.stepUp, status: args.status };
    setLogins((prev) => [event, ...prev].slice(0, 30));

    // Update device
    setDevices((prev) =>
      prev.map((d) =>
        d.id === args.pending.deviceId
          ? {
            ...d,
            lastSeenAt: args.pending.ts,
            location: args.pending.location,
            sessionActive: args.status === "Success",
            risk: args.pending.risk,
          }
          : d
      )
    );

    toast({ title: args.status === "Success" ? "Login recorded" : "Login failed", message: `${args.pending.deviceLabel} • ${args.pending.location.city}`, kind: args.status === "Success" ? "success" : "warn" });
  };

  const verifyStepUp = (method: StepUpMethod) => {
    if (!stepUpCtx) return;

    // If MFA required but not enabled, block
    if (method === "MFA" && !mfaEnabled) {
      toast({ title: "Enable MFA", message: "MFA is not enabled on your account.", kind: "warn" });
      return;
    }

    // OTP validation (demo)
    if (method === "OTP") {
      const cleaned = otp.replace(/\s/g, "");
      if (cleaned.length < 6) {
        toast({ title: "OTP required", message: "Enter a 6-digit code.", kind: "warn" });
        return;
      }
    }

    // Trust device if chosen and allowed
    if (trustThisDevice && policy.allowTrustedDevices) {
      setDevices((prev) => {
        const currentTrusted = prev.filter((d) => d.trusted);
        const target = prev.find((d) => d.id === stepUpCtx.pendingLogin.deviceId);
        if (!target) return prev;

        if (!target.trusted && currentTrusted.length >= policy.maxTrustedDevices) {
          toast({ title: "Trusted device limit", message: `You can trust up to ${policy.maxTrustedDevices} devices. Untrust one to continue.`, kind: "warn" });
          return prev;
        }

        const expiresAt = Date.now() + policy.trustExpiryDays * 24 * 60 * 60 * 1000;
        return prev.map((d) => (d.id === target.id ? { ...d, trusted: true, trustExpiresAt: expiresAt } : d));
      });
    }

    finalizeLogin({ pending: stepUpCtx.pendingLogin, stepUp: method, status: "Success" });
    setStepUpOpen(false);
    setStepUpCtx(null);
  };

  const enableMFA = () => {
    if (!policy.mfaSupported) {
      toast({ title: "Not supported", message: "MFA is not available for this program.", kind: "warn" });
      return;
    }
    setMfaEnabled(true);
    const codes = Array.from({ length: 8 }).map(() => Math.random().toString(16).slice(2, 6).toUpperCase() + "-" + Math.random().toString(16).slice(2, 6).toUpperCase());
    setBackupCodes(codes);
    toast({ title: "MFA enabled", message: "Backup codes generated.", kind: "success" });
  };

  const regenerateBackupCodes = () => {
    if (!mfaEnabled) {
      toast({ title: "Enable MFA", message: "Backup codes require MFA.", kind: "warn" });
      return;
    }
    const codes = Array.from({ length: 8 }).map(() => Math.random().toString(16).slice(2, 6).toUpperCase() + "-" + Math.random().toString(16).slice(2, 6).toUpperCase());
    setBackupCodes(codes);
    toast({ title: "Backup codes", message: "New codes generated.", kind: "success" });
  };

  const revokeDeviceSession = (id: string) => {
    if (!policy.allowSessionManagement) {
      toast({ title: "Not allowed", message: "Session management is disabled by policy.", kind: "warn" });
      return;
    }
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, sessionActive: false } : d)));
    toast({ title: "Session revoked", message: "Device signed out.", kind: "info" });
  };

  const toggleTrust = (id: string) => {
    if (!policy.allowTrustedDevices) {
      toast({ title: "Disabled by policy", message: "Trusted device controls are disabled.", kind: "warn" });
      return;
    }
    setDevices((prev) => {
      const d = prev.find((x) => x.id === id);
      if (!d) return prev;
      if (!d.trusted) {
        const count = prev.filter((x) => x.trusted).length;
        if (count >= policy.maxTrustedDevices) {
          toast({ title: "Limit reached", message: `Max trusted devices is ${policy.maxTrustedDevices}.`, kind: "warn" });
          return prev;
        }
        const expiresAt = Date.now() + policy.trustExpiryDays * 24 * 60 * 60 * 1000;
        toast({ title: "Trusted", message: `Trusted for ${policy.trustExpiryDays} days.`, kind: "success" });
        return prev.map((x) => (x.id === id ? { ...x, trusted: true, trustExpiresAt: expiresAt } : x));
      }
      toast({ title: "Untrusted", message: "Device trust removed.", kind: "info" });
      return prev.map((x) => (x.id === id ? { ...x, trusted: false, trustExpiresAt: undefined } : x));
    });
  };

  const securityReminders = useMemo(() => {
    const list: Array<{ title: string; desc: string; tone: "good" | "warn" | "neutral"; action?: () => void; actionLabel?: string }>
      = [];

    if (policy.mfaSupported && !mfaEnabled) {
      list.push({
        title: "Enable MFA",
        desc: "Add an authenticator to protect corporate activity.",
        tone: "warn",
        action: enableMFA,
        actionLabel: "Enable",
      });
    }

    if (mfaEnabled && !backupCodes.length) {
      list.push({
        title: "Generate backup codes",
        desc: "Keep codes somewhere safe in case you lose your device.",
        tone: "warn",
        action: regenerateBackupCodes,
        actionLabel: "Generate",
      });
    }

    if (policy.allowTrustedDevices && trustedCount === 0) {
      list.push({
        title: "Trust a device",
        desc: "Trusted devices reduce step-up prompts.",
        tone: "neutral",
      });
    }

    const failedRecent = logins.some((l) => l.status === "Failed" && Date.now() - l.ts < 7 * 24 * 60 * 60 * 1000);
    if (failedRecent) {
      list.push({
        title: "Review recent failed logins",
        desc: "If this was not you, change your password and revoke sessions.",
        tone: "warn",
        action: () => toast({ title: "Tip", message: "Change password from account settings (demo).", kind: "info" }),
        actionLabel: "Learn",
      });
    }

    if (!list.length) {
      list.push({
        title: "All good",
        desc: "Your account security posture looks healthy.",
        tone: "good",
      });
    }

    return list;
  }, [policy.mfaSupported, policy.allowTrustedDevices, trustedCount, mfaEnabled, backupCodes.length, logins]);

  const [loginFilter, setLoginFilter] = useState<LoginStatus | "All">("All");
  const [deviceFilter, setDeviceFilter] = useState<string>("All");

  const filteredLogins = useMemo(() => {
    return logins
      .filter((l) => (loginFilter === "All" ? true : l.status === loginFilter))
      .filter((l) => (deviceFilter === "All" ? true : l.deviceId === deviceFilter))
      .slice(0, 20);
  }, [logins, loginFilter, deviceFilter]);

  const trustExpiryText = (d: Device) => {
    if (!d.trusted) return "Not trusted";
    if (!d.trustExpiresAt) return "Trusted";
    const ms = d.trustExpiresAt - Date.now();
    return ms <= 0 ? "Expired" : `Expires in ${msToFriendly(ms)}`;
  };

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
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">Security and trust</div>
                    <Pill label="U24" tone="neutral" />
                    <Pill label="User view" tone="info" />
                    <Pill label={policy.stepUpEnabled ? "Step-up on" : "Step-up off"} tone={policy.stepUpEnabled ? "info" : "neutral"} />
                    <Pill label={policy.allowTrustedDevices ? "Trusted devices" : "Trust disabled"} tone={policy.allowTrustedDevices ? "good" : "neutral"} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Login history, device history, and corporate-grade trust signals.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={mfaEnabled ? "MFA enabled" : policy.mfaSupported ? "MFA available" : "MFA not supported"} tone={mfaEnabled ? "good" : policy.mfaSupported ? "warn" : "neutral"} />
                    <Pill label={`Trusted: ${trustedCount}/${policy.maxTrustedDevices}`} tone={trustedCount ? "neutral" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    exportSecurityReportToPrint({
                      devices,
                      logins,
                      mfaEnabled,
                      trustedCount,
                      policy,
                    })
                  }
                >
                  <Download className="h-4 w-4" /> Export report
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Preferences", message: "Open U23 CorporatePay Preferences (demo).", kind: "info" })}>
                  <ChevronRight className="h-4 w-4" /> Preferences
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main */}
              <div className="lg:col-span-7 space-y-4">
                <Section
                  title="Account security"
                  subtitle="Core: reminders and basic security posture"
                  right={<Pill label={mfaEnabled ? "Stronger" : "Basic"} tone={mfaEnabled ? "good" : "warn"} />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">MFA</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">{mfaEnabled ? "Enabled" : policy.mfaSupported ? "Not enabled" : "Not supported"}</div>
                          <div className="mt-1 text-xs text-slate-500">Authenticator + backup codes</div>
                        </div>
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", mfaEnabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                          <Lock className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label={policy.mfaSupported ? "Supported" : "Not supported"} tone={policy.mfaSupported ? "neutral" : "warn"} />
                        <Pill label={mfaEnabled ? "Active" : "Inactive"} tone={mfaEnabled ? "good" : "warn"} />
                      </div>

                      <div className="mt-3">
                        {!mfaEnabled ? (
                          <Button variant="primary" onClick={enableMFA} disabled={!policy.mfaSupported}>
                            <ChevronRight className="h-4 w-4" /> Enable MFA
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={regenerateBackupCodes}>
                            <RefreshCcw className="h-4 w-4" /> Regenerate backup codes
                          </Button>
                        )}
                      </div>

                      {mfaEnabled && backupCodes.length ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">Backup codes</div>
                              <div className="mt-1 text-xs text-slate-500">Store safely. Each code can be used once.</div>
                            </div>
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(backupCodes.join("\n"));
                                  toast({ title: "Copied", message: "Backup codes copied.", kind: "success" });
                                } catch {
                                  toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {backupCodes.slice(0, 6).map((c) => (
                              <div key={c} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">
                                {c}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Reminders</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">{securityReminders[0]?.title || ""}</div>
                          <div className="mt-1 text-xs text-slate-500">Policy-aware suggestions</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <Bell className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {securityReminders.map((r) => (
                          <div key={r.title} className={cn("rounded-3xl border p-4", r.tone === "good" ? "border-emerald-200 bg-emerald-50" : r.tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                                <div className="mt-1 text-sm text-slate-700">{r.desc}</div>
                              </div>
                              {r.action ? (
                                <Button variant={r.tone === "warn" ? "accent" : "outline"} className="px-3 py-2 text-xs" onClick={r.action}>
                                  <ChevronRight className="h-4 w-4" /> {r.actionLabel || "Open"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        CorporatePay uses policy-based controls. Some settings may be locked by your organization.
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Premium: risk-based step-up prompts"
                  subtitle="Simulate new device/geo events to see step-up behavior"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                      onClick={() =>
                        createLoginAttempt({
                          deviceId: "dev_phone",
                          deviceLabel: "Pixel 8 Pro",
                          location: { city: "Kampala", country: "Uganda", ip: "197.239.1.10" },
                          authMethod: "Password",
                          knownDevice: true,
                        })
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Known device</div>
                          <div className="mt-1 text-xs text-slate-600">Should pass without step-up (usually)</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Smartphone className="h-5 w-5" />
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                      onClick={() =>
                        createLoginAttempt({
                          deviceLabel: "New Laptop",
                          location: { city: "Kampala", country: "Uganda", ip: "197.239.1.99" },
                          authMethod: "SSO",
                          knownDevice: false,
                          deviceType: "Laptop",
                          os: "Windows 11",
                          browser: "Chrome",
                        })
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">New device</div>
                          <div className="mt-1 text-xs text-slate-600">Triggers step-up if enabled</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-800">
                          <Laptop className="h-5 w-5" />
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                      onClick={() =>
                        createLoginAttempt({
                          deviceId: "dev_phone",
                          deviceLabel: "Pixel 8 Pro",
                          location: { city: "Nairobi", country: "Kenya", ip: "41.90.1.2" },
                          authMethod: "Password",
                          knownDevice: true,
                        })
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">New country</div>
                          <div className="mt-1 text-xs text-slate-600">Risk-based step-up prompt</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                          <Globe className="h-5 w-5" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                    Policy toggles (demo):
                    <div className="mt-2 flex flex-wrap gap-2">
                      <TogglePill label="Step-up" on={policy.stepUpEnabled} onClick={() => setPolicy((p) => ({ ...p, stepUpEnabled: !p.stepUpEnabled }))} />
                      <TogglePill label="Geo" on={policy.allowGeoStepUp} onClick={() => setPolicy((p) => ({ ...p, allowGeoStepUp: !p.allowGeoStepUp }))} />
                      <TogglePill label="New device" on={policy.allowNewDeviceStepUp} onClick={() => setPolicy((p) => ({ ...p, allowNewDeviceStepUp: !p.allowNewDeviceStepUp }))} />
                      <TogglePill label="Impossible travel" on={policy.allowImpossibleTravelStepUp} onClick={() => setPolicy((p) => ({ ...p, allowImpossibleTravelStepUp: !p.allowImpossibleTravelStepUp }))} />
                      <TogglePill label="Trusted devices" on={policy.allowTrustedDevices} onClick={() => setPolicy((p) => ({ ...p, allowTrustedDevices: !p.allowTrustedDevices }))} />
                    </div>
                  </div>
                </Section>

                <Section
                  title="Login history"
                  subtitle="Core: review recent logins by device and location"
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={loginFilter}
                        onChange={(e) => setLoginFilter(e.target.value as any)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      >
                        {(["All", "Success", "Failed"] as Array<LoginStatus | "All">).map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                      <select
                        value={deviceFilter}
                        onChange={(e) => setDeviceFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      >
                        <option value="All">All devices</option>
                        {devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                >
                  <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Device</th>
                          <th className="px-4 py-3 font-semibold">Location</th>
                          <th className="px-4 py-3 font-semibold">Step-up</th>
                          <th className="px-4 py-3 font-semibold">Risk</th>
                          <th className="px-4 py-3 font-semibold text-right">Time</th>
                          <th className="px-4 py-3 font-semibold text-right">Why</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogins.map((l) => (
                          <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              <Pill label={l.status} tone={l.status === "Success" ? "good" : "bad"} />
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{l.deviceLabel}</td>
                            <td className="px-4 py-3 text-slate-700">{l.location.city}, {l.location.country}</td>
                            <td className="px-4 py-3"><Pill label={l.stepUp} tone={l.stepUp === "None" ? "neutral" : "info"} /></td>
                            <td className="px-4 py-3"><Pill label={l.risk} tone={toneForRisk(l.risk)} /></td>
                            <td className="px-4 py-3 text-right text-slate-600">{timeAgo(l.ts)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                                onClick={() =>
                                  openWhy("Why this login was flagged", {
                                    summary: l.reasonCodes.length
                                      ? "This login triggered risk signals and may require step-up verification."
                                      : "This login did not trigger risk signals.",
                                    triggers: [
                                      { label: "Device", value: l.deviceLabel },
                                      { label: "Location", value: `${l.location.city}, ${l.location.country}` },
                                      { label: "Signals", value: l.reasonCodes.join(", ") || "none" },
                                      { label: "Step-up", value: l.stepUp },
                                    ],
                                    policyPath: [
                                      { step: "Signals", detail: "Detect new device, new geo, and improbable travel." },
                                      { step: "Policy", detail: `Step-up enabled: ${policy.stepUpEnabled ? "Yes" : "No"}. Trusted devices: ${policy.allowTrustedDevices ? "Yes" : "No"}.` },
                                      { step: "Decision", detail: l.stepUp === "None" ? "No step-up required." : `Step-up required via ${l.stepUp}.` },
                                    ],
                                    audit: [
                                      { label: "Login id", value: l.id },
                                      { label: "Correlation id", value: "corr_login_demo" },
                                      { label: "IP", value: l.location.ip },
                                    ],
                                  })
                                }
                              >
                                <Info className="h-4 w-4" /> Why
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filteredLogins.length ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                              No logins match the current filters.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section
                  title="Devices and trusted devices"
                  subtitle="Premium: manage trusted devices if web access exists"
                  right={<Pill label={policy.allowTrustedDevices ? "Enabled" : "Disabled"} tone={policy.allowTrustedDevices ? "good" : "neutral"} />}
                >
                  <div className="space-y-2">
                    {devices
                      .slice()
                      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
                      .map((d) => (
                        <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", d.trusted ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
                                  {deviceIcon(d.type)}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{d.label}</div>
                                    <Pill label={d.trusted ? "Trusted" : "Not trusted"} tone={d.trusted ? "good" : "neutral"} />
                                    <Pill label={d.risk} tone={toneForRisk(d.risk)} />
                                    {d.sessionActive ? <Pill label="Active" tone="info" /> : <Pill label="Inactive" tone="neutral" />}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{d.os} • {d.browser}</div>
                                  <div className="mt-1 text-xs text-slate-500">{d.location.city}, {d.location.country} • {timeAgo(d.lastSeenAt)}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill label={trustExpiryText(d)} tone={d.trusted ? "info" : "neutral"} />
                                    <Pill label={`IP: ${d.location.ip}`} tone="neutral" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleTrust(d.id)}>
                                <Fingerprint className="h-4 w-4" /> {d.trusted ? "Untrust" : "Trust"}
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => revokeDeviceSession(d.id)}
                                disabled={!policy.allowSessionManagement}
                                title={!policy.allowSessionManagement ? "Disabled by policy" : ""}
                              >
                                <Lock className="h-4 w-4" /> Revoke
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setDevices((prev) => prev.filter((x) => x.id !== d.id));
                                  toast({ title: "Removed", message: "Device removed (demo).", kind: "info" });
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {!policy.allowTrustedDevices ? (
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Trusted device controls are disabled by policy.
                    </div>
                  ) : null}
                </Section>
              </div>

              {/* Right rail */}
              <div className="lg:col-span-5 space-y-4">
                <Section
                  title="Trust signals"
                  subtitle="What CorporatePay uses to protect corporate spending"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <SignalCard
                      icon={<Fingerprint className="h-5 w-5" />}
                      title="Trusted devices"
                      desc="Trust devices with expiry to reduce step-up prompts."
                      pill={<Pill label={policy.allowTrustedDevices ? "On" : "Off"} tone={policy.allowTrustedDevices ? "good" : "neutral"} />}
                    />
                    <SignalCard
                      icon={<Globe className="h-5 w-5" />}
                      title="Geo checks"
                      desc="Detect new city/country and prompt for verification."
                      pill={<Pill label={policy.allowGeoStepUp ? "On" : "Off"} tone={policy.allowGeoStepUp ? "good" : "neutral"} />}
                    />
                    <SignalCard
                      icon={<Lock className="h-5 w-5" />}
                      title="Step-up prompts"
                      desc="Require MFA or OTP based on risk signals."
                      pill={<Pill label={policy.stepUpEnabled ? "Enabled" : "Disabled"} tone={policy.stepUpEnabled ? "info" : "neutral"} />}
                    />
                    <SignalCard
                      icon={<Clock className="h-5 w-5" />}
                      title="Session management"
                      desc="Revoke sessions on suspicious activity (policy-controlled)."
                      pill={<Pill label={policy.allowSessionManagement ? "On" : "Off"} tone={policy.allowSessionManagement ? "good" : "neutral"} />}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                    Note: In production, some signals can be enhanced with device fingerprints and anomaly scoring.
                  </div>
                </Section>

                <Section
                  title="Quick links"
                  subtitle="Related pages"
                  right={<Pill label="Core" tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => toast({ title: "Notifications", message: "Open U21 Corporate Notifications Center (demo).", kind: "info" })}>
                      <Bell className="h-4 w-4" /> Notifications
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Preferences", message: "Open U23 CorporatePay Preferences (demo).", kind: "info" })}>
                      <ChevronRight className="h-4 w-4" /> Preferences
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Support", message: "Open U22 Issues and Support (demo).", kind: "info" })}>
                      <AlertTriangle className="h-4 w-4" /> Support
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Policies", message: "Open U3 Policies Summary (demo).", kind: "info" })}>
                      <ShieldCheck className="h-4 w-4" /> Policies
                    </Button>
                  </div>
                </Section>

                <Section
                  title="Why did I get this?"
                  subtitle="Audit-friendly explanations"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Step-up prompts are triggered by risk signals like new device, new geo, or improbable travel.
                  </div>
                  <div className="mt-3 text-xs text-slate-600">Open a login entry and tap “Why”.</div>
                </Section>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              U24 Security and Trust Signals. Core: login/device history and reminders. Premium: risk-based step-up prompts and trusted device controls.
            </div>
          </div>
        </div>
      </div>

      {/* Step-up modal */}
      <Modal
        open={stepUpOpen}
        title="Step-up verification"
        subtitle="Premium: risk-based prompt (new device/geo)"
        onClose={() => {
          setStepUpOpen(false);
          setStepUpCtx(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setStepUpOpen(false);
                setStepUpCtx(null);
                toast({ title: "Cancelled", message: "Login not recorded.", kind: "info" });
              }}
            >
              Cancel
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => verifyStepUp("OTP")}>
                <ChevronRight className="h-4 w-4" /> Verify with OTP
              </Button>
              <Button variant="primary" onClick={() => verifyStepUp("MFA")} disabled={!mfaEnabled} title={!mfaEnabled ? "Enable MFA first" : ""}>
                <Lock className="h-4 w-4" /> Approve with MFA
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        {stepUpCtx ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Why you are seeing this</div>
                  <div className="mt-1 text-sm text-slate-700">Risk signals were detected and policy requires verification.</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stepUpCtx.reasons.length ? stepUpCtx.reasons.map((r) => <Pill key={r} label={r} tone="warn" />) : <Pill label="none" tone="neutral" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Login details</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow label="Device" value={stepUpCtx.pendingLogin.deviceLabel} />
                <InfoRow label="Location" value={`${stepUpCtx.pendingLogin.location.city}, ${stepUpCtx.pendingLogin.location.country}`} />
                <InfoRow label="IP" value={stepUpCtx.pendingLogin.location.ip} />
                <InfoRow label="Auth" value={stepUpCtx.pendingLogin.authMethod} />
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                Recommended: MFA. Fallback: OTP.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">OTP fallback</div>
              <div className="mt-1 text-xs text-slate-500">Enter a 6-digit code (demo)</div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !policy.allowTrustedDevices && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Trust this device</div>
                  <div className="mt-1 text-xs text-slate-600">If enabled, trust expires in {policy.trustExpiryDays} days. Limited to {policy.maxTrustedDevices} devices.</div>
                </div>
                <input
                  type="checkbox"
                  checked={trustThisDevice}
                  onChange={(e) => setTrustThisDevice(e.target.checked)}
                  disabled={!policy.allowTrustedDevices}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
              </div>
              {!policy.allowTrustedDevices ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">Trusted device controls are disabled by policy.</div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Need MFA?</div>
              <div className="mt-1 text-sm text-slate-600">Enable MFA to reduce risk and approvals friction for corporate actions.</div>
              <div className="mt-3">
                <Button variant="primary" onClick={enableMFA} disabled={!policy.mfaSupported || mfaEnabled}>
                  <ChevronRight className="h-4 w-4" /> {mfaEnabled ? "MFA enabled" : "Enable MFA"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Why modal */}
      <Modal
        open={whyOpen}
        title={whyTitle}
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
        {whyBody ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Why did I get this?</div>
                  <div className="mt-1 text-sm text-slate-700">{whyBody.summary}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-600">Triggers</div>
                <div className="mt-3 space-y-2">
                  {whyBody.triggers.map((t) => (
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
                  {whyBody.audit.map((a) => (
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
                {whyBody.policyPath.map((p, idx) => (
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
                These explanations are derived from policy rules and audit triggers to reduce confusion.
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function TogglePill({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
        on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
      style={on ? { background: EVZ.green } : undefined}
      aria-label={label}
    >
      {label}: {on ? "On" : "Off"}
    </button>
  );
}

function SignalCard({ icon, title, desc, pill }: { icon: React.ReactNode; title: string; desc: string; pill: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        {pill}
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 text-right">{value}</div>
    </div>
  );
}
