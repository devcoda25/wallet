import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Download,
  FileText,
  Info,
  Mail,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { cn, uid, timeAgo } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { ToastStack } from "@/components/ui/ToastStack";
import { SegButton } from "@/components/ui/SegButton";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

// -- Types --
type Severity = "Info" | "Warning" | "Critical" | "Success";

type ModuleKey =
  | "Wallet"
  | "CorporatePay"
  | "E-Commerce"
  | "Services"
  | "EV Charging"
  | "Rides & Logistics"
  | "Shoppable Adz"
  | "School & E-Learning"
  | "Medical & Health Care"
  | "Travel & Tourism"
  | "Green Investments"
  | "FaithHub"
  | "Virtual Workspace"
  | "Finance & Payments"
  | "Other";

type NotificationType =
  | "Deposit"
  | "Withdrawal"
  | "Approval update"
  | "Dispute"
  | "Verification"
  | "Low balance"
  | "Provider outage"
  | "Policy change"
  | "Payment method"
  | "Receipt ready"
  | "RFQ update";

type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";
type DeliveryStatus = "Queued" | "Sent" | "Delivered" | "Failed";
type ContextId = "personal" | "org_acme" | "org_khl" | "org_demo";
type NotificationLink = { label: string; hint: string; to: string };

type WhyInfo = {
  summary: string;
  triggers: Array<{ label: string; value: string }>;
  policyPath: Array<{ step: string; detail: string }>;
  audit: Array<{ label: string; value: string }>;
};

type DeliveryLog = { channel: Channel; status: DeliveryStatus; at: number };

type Notification = {
  id: string;
  ts: number;
  severity: Severity;
  module: ModuleKey;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actor: string;
  contextId: ContextId;
  links: NotificationLink[];
  why: WhyInfo;
  delivery?: DeliveryLog[];
};

type DigestFrequency = "Daily" | "Weekly";

type DigestSettings = {
  enabled: boolean;
  frequency: DigestFrequency;
  timeHHMM: string;
  channels: Record<Channel, boolean>;
  smartGrouping: boolean;
  includeLowSeverity: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };
type Tab = "Feed" | "Digests";

// -- Helpers --
function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function bucket(ts: number) {
  const ageMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (ageMs < day) return "Today";
  if (ageMs < 2 * day) return "Yesterday";
  if (ageMs < 7 * day) return "This week";
  return "Older";
}

function toneForSeverity(s: Severity) {
  if (s === "Critical") return "bad" as const;
  if (s === "Warning") return "warn" as const;
  if (s === "Success") return "good" as const;
  return "info" as const;
}

function iconForType(t: NotificationType) {
  if (t === "Approval update") return <BadgeCheck className="h-5 w-5" />;
  if (t === "Policy change") return <ShieldCheck className="h-5 w-5" />;
  if (t === "Payment method") return <Wallet className="h-5 w-5" />;
  if (t === "Receipt ready") return <FileText className="h-5 w-5" />;
  if (t === "RFQ update") return <MessageSquare className="h-5 w-5" />;
  if (t === "Provider outage") return <AlertTriangle className="h-5 w-5" />;
  if (t === "Verification") return <ShieldCheck className="h-5 w-5" />;
  if (t === "Low balance") return <AlertTriangle className="h-5 w-5" />;
  if (t === "Deposit") return <Download className="h-5 w-5" />;
  if (t === "Withdrawal") return <Download className="h-5 w-5" />;
  if (t === "Dispute") return <MessageSquare className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export function ToggleRow({ label, desc, enabled, onToggle, disabled }: { label: string; desc: string; enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", disabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
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
          onClick={onToggle}
        >
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const MODULES: ModuleKey[] = [
    "CorporatePay",
    "Wallet",
    "Rides & Logistics",
    "E-Commerce",
    "EV Charging",
    "Services",
    "Shoppable Adz",
    "School & E-Learning",
    "Medical & Health Care",
    "Travel & Tourism",
    "Green Investments",
    "FaithHub",
    "Virtual Workspace",
    "Finance & Payments",
    "Other",
  ];

  const [tab, setTab] = useState<Tab>("Feed");
  const [items, setItems] = useState<Notification[]>(() => {
    const now = Date.now();
    return [
      {
        id: "N-1001",
        ts: now - 10 * 60 * 1000,
        severity: "Warning",
        module: "Wallet",
        type: "Withdrawal",
        title: "Withdrawal failed",
        message: "UGX payout failed due to beneficiary name mismatch.",
        read: false,
        actor: "Provider",
        contextId: "personal",
        links: [
          { label: "Fix beneficiary", hint: "Open Beneficiaries & Payout Methods", to: "W08" },
          { label: "Retry payout", hint: "Open Withdraw / Cash Out", to: "W07" },
        ],
        why: {
          summary: "You initiated a withdrawal. The provider returned a failure code due to name mismatch.",
          triggers: [
            { label: "Event", value: "payout.failed" },
            { label: "Rail", value: "Bank Transfer" },
            { label: "Check", value: "beneficiary.nameMatch" },
          ],
          policyPath: [
            { step: "Risk checks", detail: "Bank payouts require beneficiary name match." },
            { step: "Provider response", detail: "Name mismatch. Payout not processed." },
            { step: "Next step", detail: "Update beneficiary and retry." },
          ],
          audit: [
            { label: "Payout id", value: "PO-3101" },
            { label: "Correlation id", value: "corr_87911" },
            { label: "Ledger ref", value: "LED-33219005" },
          ],
        },
        delivery: [
          { channel: "In-app", status: "Delivered", at: now - 10 * 60 * 1000 },
          { channel: "Email", status: "Sent", at: now - 9 * 60 * 1000 },
          { channel: "WhatsApp", status: "Delivered", at: now - 9 * 60 * 1000 + 30 * 1000 },
        ],
      },
      {
        id: "N-1002",
        ts: now - 55 * 60 * 1000,
        severity: "Info",
        module: "CorporatePay",
        type: "Approval update",
        title: "Approval needed",
        message: "CorporatePay purchase requires finance approval.",
        read: false,
        actor: "Policy engine",
        contextId: "org_acme",
        links: [
          { label: "Open approvals", hint: "Open Approvals Inbox", to: "W24" },
          { label: "View policy", hint: "Open Policy Builder", to: "W22" },
        ],
        why: {
          summary: "Policy threshold triggered maker-checker approvals.",
          triggers: [
            { label: "Rule", value: "amount > UGX 500,000" },
            { label: "Scope", value: "CorporatePay" },
            { label: "Approval", value: "Finance required" },
          ],
          policyPath: [
            { step: "Policy check", detail: "In policy for vendor and category." },
            { step: "Threshold", detail: "Amount exceeds approval threshold." },
            { step: "Routing", detail: "Sent to finance approval queue." },
          ],
          audit: [
            { label: "Request id", value: "REQ-3F9A" },
            { label: "Decision id", value: "DEC-19B2" },
            { label: "Correlation id", value: "corr_0c22" },
          ],
        },
        delivery: [
          { channel: "In-app", status: "Delivered", at: now - 55 * 60 * 1000 },
          { channel: "Email", status: "Sent", at: now - 54 * 60 * 1000 },
        ],
      },
      {
        id: "N-1003",
        ts: now - 2 * 60 * 60 * 1000,
        severity: "Success",
        module: "Wallet",
        type: "Deposit",
        title: "Deposit posted",
        message: "Card top-up UGX 300,000 is now available.",
        read: true,
        actor: "Provider",
        contextId: "personal",
        links: [{ label: "View receipt", hint: "Open Transactions & Receipts", to: "W10" }],
        why: {
          summary: "Provider confirmed the deposit and ledger posted the funds.",
          triggers: [
            { label: "Event", value: "deposit.posted" },
            { label: "Rail", value: "Card" },
            { label: "Ledger", value: "posted" },
          ],
          policyPath: [
            { step: "Authorization", detail: "Card deposit authorized." },
            { step: "Settlement", detail: "Deposit posted to ledger." },
            { step: "Availability", detail: "Funds available for checkout." },
          ],
          audit: [
            { label: "Deposit id", value: "TX-9003" },
            { label: "Provider ref", value: "PRV-7003" },
            { label: "Correlation id", value: "corr_7003" },
          ],
        },
      },
      {
        id: "N-1004",
        ts: now - 28 * 60 * 60 * 1000,
        severity: "Warning",
        module: "Wallet",
        type: "Verification",
        title: "Verification required",
        message: "Complete KYC to increase withdrawal limits.",
        read: true,
        actor: "Compliance",
        contextId: "personal",
        links: [{ label: "Start verification", hint: "Open Limits, Funding Status & Verification", to: "W13" }],
        why: {
          summary: "Your tier is not high enough for requested limits.",
          triggers: [
            { label: "Tier", value: "Tier 1" },
            { label: "Action", value: "withdrawal" },
            { label: "Requirement", value: "KYC" },
          ],
          policyPath: [
            { step: "Limit check", detail: "Requested withdrawal exceeds tier limit." },
            { step: "Compliance", detail: "KYC required to upgrade tier." },
            { step: "User action", detail: "Upload missing documents." },
          ],
          audit: [
            { label: "Policy", value: "POL-KYC" },
            { label: "Event", value: "EVT-KYC-REQ" },
          ],
        },
        delivery: [
          { channel: "In-app", status: "Delivered", at: now - 28 * 60 * 60 * 1000 },
          { channel: "Email", status: "Delivered", at: now - 28 * 60 * 60 * 1000 + 60 * 1000 },
          { channel: "SMS", status: "Sent", at: now - 28 * 60 * 60 * 1000 + 2 * 60 * 1000 },
        ],
      }
    ];
  });

  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState<Severity | "All">("All");
  const [module, setModule] = useState<ModuleKey | "All">("All");
  const [context, setContext] = useState<ContextId | "All">("All");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const unreadCount = useMemo(() => items.filter((x) => !x.read).length, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((n) => (unreadOnly ? !n.read : true))
      .filter((n) => (severity === "All" ? true : n.severity === severity))
      .filter((n) => (module === "All" ? true : n.module === module))
      .filter((n) => (context === "All" ? true : n.contextId === context))
      .filter((n) => {
        if (!query) return true;
        const hay = `${n.title} ${n.message} ${n.type} ${n.module} ${n.actor}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => b.ts - a.ts);
  }, [items, q, severity, module, context, unreadOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of filtered) {
      const k = bucket(n.ts);
      map.set(k, [...(map.get(k) ?? []), n]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const [openId, setOpenId] = useState<string | null>(null);
  const selected = useMemo(() => items.find((x) => x.id === openId) || null, [items, openId]);

  const markRead = (id: string, read: boolean) => {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, read } : x)));
  };

  const markAllRead = () => {
    setItems((p) => p.map((x) => ({ ...x, read: true })));
    toast({ title: "Done", message: "All marked as read.", kind: "success" });
  };

  const clearRead = () => {
    setItems((p) => p.filter((x) => !x.read));
    toast({ title: "Cleared", message: "Read notifications removed.", kind: "info" });
  };

  const [digest, setDigest] = useState<DigestSettings>({
    enabled: true,
    frequency: "Daily",
    timeHHMM: "18:00",
    channels: { "In-app": true, Email: true, WhatsApp: true, WeChat: false, SMS: false },
    smartGrouping: true,
    includeLowSeverity: true,
    quietHoursEnabled: true,
    quietStart: "22:00",
    quietEnd: "06:00",
  });

  const nextDigestEta = useMemo(() => {
    const [hh, mm] = digest.timeHHMM.split(":").map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(hh || 18, mm || 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + (digest.frequency === "Daily" ? 1 : 7));
    }
    return { at: next.getTime(), ms: next.getTime() - now.getTime() };
  }, [digest]);

  const digestPreview = useMemo(() => {
    const base = items.filter((n) => (digest.includeLowSeverity ? true : n.severity !== "Info"));
    const grouped: Record<string, Notification[]> = {};
    const keyOf = (n: Notification) => (digest.smartGrouping ? n.type : `${n.type}:${n.module}`);
    for (const n of base) {
      const k = keyOf(n);
      grouped[k] = [...(grouped[k] || []), n];
    }
    return Object.entries(grouped).map(([k, list]) => ({
      key: k,
      title: k.split(":")[0],
      moduleHint: k.split(":")[1] || "Multiple",
      count: list.length,
      severity: list.some(x => x.severity === "Critical") ? "Critical" : list.some(x => x.severity === "Warning") ? "Warning" : "Info",
      newest: Math.max(...list.map(x => x.ts)),
    })).sort((a, b) => b.newest - a.newest).slice(0, 10);
  }, [items, digest]);

  const toggleUnreadOnly = () => setUnreadOnly(v => !v);

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
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">Notifications Center</div>
                    <Pill label={`Unread: ${unreadCount}`} tone={unreadCount ? "warn" : "neutral"} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Wallet events, approvals, policy changes, and smart digests.</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                  <SegButton active={tab === "Feed"} label="Feed" onClick={() => setTab("Feed")} />
                  <SegButton active={tab === "Digests"} label="Digests" onClick={() => setTab("Digests")} />
                </div>
                {tab === "Feed" && (
                  <>
                    <Button variant="outline" onClick={markAllRead}><Check className="h-4 w-4" /> Mark all read</Button>
                    <Button variant="outline" onClick={clearRead}><Trash2 className="h-4 w-4" /> Clear read</Button>
                  </>
                )}
                <Button variant="outline" onClick={() => toast({ title: "Refreshed", kind: "success" })}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
              </div>
            </div>

            {tab === "Feed" && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications" />
                </div>
                <div className="md:col-span-3">
                  <Select value={severity} onChange={(e) => setSeverity(e.target.value as any)} options={["All", "Info", "Success", "Warning", "Critical"].map(s => ({ label: s, value: s }))} />
                </div>
                <div className="md:col-span-3">
                  <Select value={module} onChange={(e) => setModule(e.target.value as any)} options={["All", ...MODULES].map(m => ({ label: m, value: m }))} />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <span className="text-xs font-semibold text-slate-600">Unread only</span>
                  <button onClick={toggleUnreadOnly} className={cn("relative h-7 w-12 rounded-full border transition", unreadOnly ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}>
                    <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", unreadOnly ? "left-[22px]" : "left-1")} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "Feed" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-3">
                  {grouped.length ? grouped.map(([g, list]) => (
                    <div key={g} className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500">{g}</div>
                      {list.map((n) => (
                        <div key={n.id} className={cn("rounded-3xl border bg-white p-4 shadow-sm", !n.read ? "border-emerald-200" : "border-slate-200")}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", n.severity === "Critical" ? "bg-rose-50 text-rose-700" : n.severity === "Warning" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700")}>
                                {iconForType(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-sm font-semibold text-slate-900 truncate">{n.title}</div>
                                  <Pill label={n.severity} tone={toneForSeverity(n.severity)} />
                                  <Pill label={n.module} tone="neutral" />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{timeAgo(n.ts)} • {n.actor}</div>
                                <div className="mt-2 text-sm text-slate-700">{n.message}</div>
                                <div className="mt-3 flex gap-2">
                                  {n.links.map(l => <Button key={l.label} variant="outline" className="px-3 py-1.5 text-xs" onClick={() => toast({ title: l.label, kind: "info" })}>{l.label}</Button>)}
                                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => { setOpenId(n.id); markRead(n.id, true); }}><Info className="h-4 w-4" /> Why?</Button>
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => markRead(n.id, !n.read)}>{n.read ? "Unread" : "Read"}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                      No notifications found
                    </div>
                  )}
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Quick actions</div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline">Approvals</Button>
                      <Button variant="outline">Receipts</Button>
                      <Button variant="outline">Policies</Button>
                      <Button variant="outline">Limits</Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Digest settings</div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ToggleRow label="Enable digests" desc="Daily/Weekly summaries" enabled={digest.enabled} onToggle={() => setDigest(p => ({ ...p, enabled: !p.enabled }))} />
                    <ToggleRow label="Smart grouping" desc="Group by alert type" enabled={digest.smartGrouping} onToggle={() => setDigest(p => ({ ...p, smartGrouping: !p.smartGrouping }))} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Select label="Frequency" value={digest.frequency} onChange={e => setDigest(p => ({ ...p, frequency: e.target.value as any }))} options={["Daily", "Weekly"].map(f => ({ label: f, value: f }))} />
                    <Input label="Time" type="time" value={digest.timeHHMM} onChange={e => setDigest(p => ({ ...p, timeHHMM: e.target.value }))} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Digest preview</div>
                  <div className="mt-4 space-y-2">
                    {digestPreview.map(g => (
                      <div key={g.key} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl bg-slate-50">
                        <div className="text-sm font-semibold">{g.title} ({g.count})</div>
                        <Pill label={g.severity} tone={toneForSeverity(g.severity as any)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!selected} title={selected?.title || ""} onClose={() => setOpenId(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="text-sm font-semibold text-slate-900">Why did I get this?</div>
              <div className="mt-2 text-sm text-slate-700">{selected.why.summary}</div>
              <div className="mt-4 space-y-2">
                {selected.why.triggers.map(t => (
                  <div key={t.label} className="flex justify-between text-xs py-1 border-b border-slate-200">
                    <span className="font-semibold">{t.label}</span>
                    <span>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
