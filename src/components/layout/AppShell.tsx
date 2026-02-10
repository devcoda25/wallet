import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  Lock,
  Menu,
  MessageSquare,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Timer,
  Users,
  Wallet,
  X,
  Check,
  Download,
  Car,
  Zap,
} from "lucide-react";

import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/ToastStack";
import { SectionCard as Card } from "@/components/ui/SectionCard";
import { StatCard as Metric } from "@/components/ui/StatCard";
import { cn, uid, formatUGX, timeAgo } from "@/lib/utils";
import {
  RouteKey,
  Org,
  AppRequest,
  ReceiptRow,
  Notif,
  SearchItem,
  Toast,
  CorporateStatus,
  RequestType,
  RequestStatus,
  ReceiptType,
  ReceiptStatus,
} from "@/types/types";


const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

function fmtDateTime(ts: number | string) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function statusTone(status: CorporateStatus): "good" | "warn" | "bad" {
  if (status === "Active") return "good";
  if (status === "Requires approval") return "warn";
  return "bad";
}

function statusCopy(org: Org) {
  if (org.status === "Disabled") return org.disableReason ? `Disabled: ${org.disableReason}` : "Disabled";
  return org.status;
}

function IconForRoute({ route }: { route: RouteKey }) {
  const cls = "h-4 w-4";
  switch (route) {
    case "hub":
      return <Home className={cls} />;
    case "orgs":
      return <Users className={cls} />;
    case "policies":
      return <ShieldCheck className={cls} />;
    case "limits":
      return <Wallet className={cls} />;
    case "requests":
      return <Ticket className={cls} />;
    case "receipts":
      return <FileText className={cls} />;
    case "payment_methods":
      return <CreditCard className={cls} />;
    case "tags":
      return <Tag className={cls} />;
    case "attestation":
      return <ClipboardCheck className={cls} />;
    case "policy_result":
      return <AlertTriangle className={cls} />;
    case "approval_submit":
      return <ChevronRight className={cls} />;
    case "approval_status":
      return <Timer className={cls} />;
    case "enforcement":
      return <Lock className={cls} />;
    case "flows_services":
      return <CalendarClock className={cls} />;
    case "flows_mylivedealz":
      return <Sparkles className={cls} />;
    case "flows_ecommerce":
      return <LayoutGrid className={cls} />;
    case "flows_charging":
      return <Zap className={cls} />;
    case "flows_rides":
      return <Car className={cls} />;
    case "notifications":
      return <Bell className={cls} />;
    default:
      return <Home className={cls} />;
  }
}

function parseHash(hash: string): { route: RouteKey; id?: string; tab?: string } {
  const raw = (hash || "").replace(/^#/, "");
  const [path, query] = raw.split("?");
  const seg = path.split("/").filter(Boolean);

  const route = (seg[1] as RouteKey) || "hub";
  const id = seg[2];

  let tab: string | undefined = undefined;
  if (query) {
    const params = new URLSearchParams(query);
    tab = params.get("tab") || undefined;
  }

  const allowed: RouteKey[] = [
    "hub",
    "orgs",
    "policies",
    "limits",
    "requests",
    "receipts",
    "payment_methods",
    "tags",
    "attestation",
    "policy_result",
    "approval_submit",
    "approval_status",
    "enforcement",
    "flows_services",
    "flows_mylivedealz",
    "flows_ecommerce",
    "flows_charging",
    "flows_rides",
    "notifications",
  ];

  return { route: allowed.includes(route) ? route : "hub", id, tab };
}

function setHash(path: string) {
  window.location.hash = path;
}

function StatusBanner({
  tone,
  title,
  desc,
  onAction,
}: {
  tone: "good" | "warn" | "bad";
  title: string;
  desc: string;
  onAction?: () => void;
}) {
  const bg =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50"
        : "border-rose-200 bg-rose-50";

  return (
    <div className={cn("rounded-[28px] border p-4", bg)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-700">{desc}</div>
        </div>
        {onAction ? (
          <Button variant="outline" onClick={onAction}>
            <ChevronRight className="h-4 w-4" /> Help
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function UserCorporatePayAppShellV2() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Orgs (U2)
  const [orgs, setOrgs] = useState<Org[]>(() => [
    { id: "org_acme", name: "Acme Group Ltd", role: "Employee", group: "Sales", status: "Active", eligible: true, costCenter: "SAL-03", autoApprovalEligible: false },
    { id: "org_hosp", name: "City Hospital", role: "Coordinator", group: "Operations", status: "Disabled", disableReason: "Deposit depleted", eligible: true, costCenter: "OPS-01", autoApprovalEligible: true },
    { id: "org_tour", name: "TourCo Ltd", role: "Employee", group: "Travel", status: "Requires approval", eligible: true, costCenter: "TRV-01", autoApprovalEligible: true },
  ]);

  const [activeOrgId, setActiveOrgId] = useState<string>("org_acme");
  const activeOrg = useMemo(() => orgs.find((o) => o.id === activeOrgId) || orgs[0], [orgs, activeOrgId]);

  // Sample user-side data
  const requests: AppRequest[] = useMemo(() => {
    const now = Date.now();
    return [
      { id: "REQ-3F9A", ts: now - 35 * 60 * 1000, type: "Ride", status: "Approved", title: "Ride: Kampala CBD → Entebbe Airport", amountUGX: 240000, orgId: "org_acme", module: "Rides & Logistics" },
      { id: "REQ-SVC-7B12", ts: now - 3 * 60 * 60 * 1000, type: "Service", status: "Pending", title: "Service booking approval: Charger installation", amountUGX: 535000, orgId: "org_acme", module: "ServiceMart" },
      { id: "REQ-MDL-2A11", ts: now - 5 * 60 * 60 * 1000, type: "Purchase", status: "Pending", title: "MyLiveDealz approval: Charging credits bulk deal", amountUGX: 520000, orgId: "org_tour", module: "MyLiveDealz" },
    ];
  }, []);


  const receipts: ReceiptRow[] = useMemo(() => {
    const now = Date.now();
    return [
      { id: "RCPT-CH-9C2A", ts: now - 12 * 60 * 1000, type: "Charging", status: "Ready", title: "Charging receipt: Kampala Rd 12", amountUGX: 78000, orgId: "org_acme", module: "EVs & Charging", purpose: "Charging", costCenter: "FLEET-01" },
      { id: "RCPT-RIDE-1A2B", ts: now - 6 * 60 * 60 * 1000, type: "Ride", status: "Ready", title: "Ride receipt: CBD → Airport", amountUGX: 240000, orgId: "org_acme", module: "Rides & Logistics", purpose: "Airport", costCenter: "OPS-01" },
      { id: "RCPT-SVC-3D90", ts: now - 20 * 60 * 60 * 1000, type: "Service", status: "Cancelled", title: "Service: EV charger install", amountUGX: 535000, orgId: "org_acme", module: "ServiceMart", purpose: "Installation", costCenter: "CAPEX-01" },
      { id: "RCPT-MDL-0B21", ts: now - 28 * 60 * 60 * 1000, type: "Deal", status: "Ready", title: "MyLiveDealz deal: Charging credits", amountUGX: 490000, orgId: "org_tour", module: "MyLiveDealz", purpose: "Operations", costCenter: "TRV-01" },
    ];
  }, []);

  const notifs: Notif[] = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: "N-1011",
        ts: now - 18 * 60 * 1000,
        severity: "Warning",
        title: "Approval pending",
        message: "Your ServiceMart booking requires approval. A slot hold is active.",
        module: "ServiceMart",
        orgId: "org_acme",
        why: {
          summary: "Amount exceeded the auto-approval threshold.",
          triggers: [
            { label: "Rule", value: "amount > UGX 300,000" },
            { label: "Chain", value: "Manager → Finance" },
          ],
          audit: [
            { label: "Request id", value: "REQ-SVC-7B12" },
            { label: "Correlation", value: "corr_7d19" },
          ],
        },
      },
      {
        id: "N-1005",
        ts: now - 2 * 60 * 60 * 1000,
        severity: "Critical",
        title: "CorporatePay paused",
        message: "CorporatePay is disabled for City Hospital due to deposit depletion.",
        module: "CorporatePay",
        orgId: "org_hosp",
        why: {
          summary: "Prepaid deposit is depleted. CorporatePay is a hard stop until top-up.",
          triggers: [
            { label: "Funding", value: "Prepaid" },
            { label: "Event", value: "deposit.depleted" },
          ],
          audit: [
            { label: "Org", value: "City Hospital" },
            { label: "Correlation", value: "corr_2b10" },
          ],
        },
      },
    ];
  }, []);

  // Router
  const [route, setRoute] = useState<RouteKey>("hub");
  const [routeId, setRouteId] = useState<string | undefined>(undefined);
  const [routeTab, setRouteTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    const apply = () => {
      const p = parseHash(window.location.hash);
      setRoute(p.route);
      setRouteId(p.id);
      setRouteTab(p.tab);
    };
    window.addEventListener("hashchange", apply);
    if (!window.location.hash) setHash("/corp/hub");
    apply();
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const navigate = (r: RouteKey, id?: string, tab?: string) => {
    const base = `/corp/${r}${id ? `/${id}` : ""}`;
    const q = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    setHash(base + q);
  };


  // Status banner
  const statusBanner = useMemo(() => {
    if (!activeOrg.eligible) {
      return { tone: "bad" as const, title: "CorporatePay not eligible", desc: "You are not eligible for CorporatePay in this organization." };
    }
    if (activeOrg.status === "Disabled") {
      return {
        tone: "bad" as const,
        title: "CorporatePay disabled",
        desc: activeOrg.disableReason ? `Reason: ${activeOrg.disableReason}. Use personal payment or contact admin.` : "CorporatePay is disabled.",
      };
    }
    if (activeOrg.status === "Requires approval") {
      return { tone: "warn" as const, title: "Approvals may be required", desc: "Some actions will require approval. Use Requests to track progress." };
    }
    return { tone: "good" as const, title: "CorporatePay active", desc: "CorporatePay appears as a payment option at checkout when eligible under policy." };
  }, [activeOrg]);


  // Page rendering
  const activeOrgRequests = useMemo(() => requests.filter((r) => r.orgId === activeOrg.id), [requests, activeOrg.id]);
  const activeOrgReceipts = useMemo(() => receipts.filter((r) => r.orgId === activeOrg.id), [receipts, activeOrg.id]);
  const activeOrgNotifs = useMemo(() => notifs.filter((n) => n.orgId === activeOrg.id), [notifs, activeOrg.id]);

  const page = (
    <div className="space-y-4">
      <StatusBanner
        tone={statusBanner.tone}
        title={statusBanner.title}
        desc={statusBanner.desc}
        onAction={() => navigate("enforcement")}
      />

      {route === "hub" ? (
        <U1Hub
          org={activeOrg}
          requests={activeOrgRequests}
          receipts={activeOrgReceipts}
          notifs={activeOrgNotifs}
          onGo={(r, id) => navigate(r, id)}
        />
      ) : null}

      {route === "orgs" ? (
        <U2Orgs orgs={orgs} activeOrgId={activeOrgId} onSwitch={(id) => setActiveOrgId(id)} onGo={(r) => navigate(r)} />
      ) : null}

      {route === "policies" ? <U3Policies org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "limits" ? <U4Limits org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "requests" ? (
        <U5Requests org={activeOrg} requests={activeOrgRequests} selectedId={routeId} onOpen={(id) => navigate("requests", id)} />
      ) : null}

      {route === "receipts" ? (
        <U6Receipts org={activeOrg} receipts={activeOrgReceipts} selectedId={routeId} onOpen={(id) => navigate("receipts", id)} />
      ) : null}

      {route === "payment_methods" ? <U7PaymentMethods org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "tags" ? <U9Tags org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "attestation" ? <U10Attestation org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "policy_result" ? <U11OutOfPolicy onGo={(r) => navigate(r)} /> : null}

      {route === "approval_submit" ? <U12ApprovalSubmit onGo={(r) => navigate(r)} /> : null}

      {route === "approval_status" ? <U13ApprovalStatus onGo={(r) => navigate(r)} /> : null}

      {route === "enforcement" ? <U14Enforcement org={activeOrg} onGo={(r) => navigate(r)} /> : null}

      {route === "flows_services" ? <FlowStub title="U29 Services Booking Checkout" desc="Use the U29 canvas as the page component in your codebase. This shell wires the route and navigation." onGo={(r) => navigate(r)} /> : null}

      {route === "flows_mylivedealz" ? <FlowStub title="U32 MyLiveDealz Deal Checkout" desc="Use the U32 MyLiveDealz canvas as the page component. This shell wires the route and nav." onGo={(r) => navigate(r)} /> : null}

      {route === "flows_ecommerce" ? <FlowStub title="U17 E-Commerce Checkout" desc="Use the U17 canvas as the page component. This shell wires the route and nav." onGo={(r) => navigate(r)} /> : null}

      {route === "flows_charging" ? <FlowStub title="U27 EV Charging Checkout" desc="Use the U27 canvas as the page component. This shell wires the route and nav." onGo={(r) => navigate(r)} /> : null}

      {route === "flows_rides" ? <FlowStub title="U15 Rides Checkout" desc="Use the U15 canvas as the page component. This shell wires the route and nav." onGo={(r) => navigate(r)} /> : null}

      {route === "notifications" ? (
        <NotificationsPage org={activeOrg} items={activeOrgNotifs} onGo={(r, id) => navigate(r, id)} />
      ) : null}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      {page}
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <LayoutGrid className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function U1Hub({
  org,
  requests,
  receipts,
  notifs,
  onGo,
}: {
  org: Org;
  requests: AppRequest[];
  receipts: ReceiptRow[];
  notifs: Notif[];
  onGo: (r: RouteKey, id?: string) => void;
}) {
  const pending = requests.filter((r) => r.status === "Pending").length;
  const latestReceipt = receipts.slice().sort((a, b) => b.ts - a.ts)[0] || null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Pending" value={String(pending)} sub="Approvals pending" tone={pending ? "warn" : "good"} icon={<Ticket className="h-5 w-5" />} />
        <Metric title="Receipts" value={String(receipts.length)} sub="Corporate receipts" tone="neutral" icon={<FileText className="h-5 w-5" />} />
        <Metric title="Membership" value={org.group} sub={`Role: ${org.role}`} tone="info" icon={<Users className="h-5 w-5" />} />
      </div>

      <Card title="Quick actions" subtitle="Jump to the pages that matter">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <QuickLink title="Payment methods" desc="Select CorporatePay at checkout" onClick={() => onGo("payment_methods")} />
          <QuickLink title="Policies summary" desc="Avoid declines at checkout" onClick={() => onGo("policies")} />
          <QuickLink title="My requests" desc="Approvals, exceptions, RFQs" onClick={() => onGo("requests")} />
          <QuickLink title="Receipts" desc="Export and dispute" onClick={() => onGo("receipts")} />
          <QuickLink title="Book a service" desc="ServiceMart booking (U29)" onClick={() => onGo("flows_services")} />
          <QuickLink title="MyLiveDealz checkout" desc="Deals + approval holds (U32)" onClick={() => onGo("flows_mylivedealz")} />
        </div>

        {latestReceipt ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            Latest receipt: <span className="font-semibold">{latestReceipt.id}</span> • {latestReceipt.title} • {formatUGX(latestReceipt.amountUGX)}
            <button
              className="ml-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
              onClick={() => onGo("receipts", latestReceipt.id)}
              type="button"
            >
              Open
            </button>
          </div>
        ) : null}
      </Card>

      <Card title="Eligibility" subtitle="What changed for you">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniStat title="Active org" value={org.name} />
          <MiniStat title="Cost center" value={org.costCenter || "Not set"} />
          <MiniStat title="Auto-approval" value={org.autoApprovalEligible ? "Eligible" : "Not eligible"} />
        </div>

        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          CorporatePay appears as a payment method at checkout only when your org is active and you are eligible.
        </div>
      </Card>

      <Card title="Recent alerts" subtitle="Approvals, payments, policy changes" right={<Pill label={String(notifs.length)} tone="neutral" />}>
        <div className="space-y-2">
          {notifs
            .slice()
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 4)
            .map((n) => (
              <div key={n.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={n.severity} tone={n.severity === "Critical" ? "bad" : n.severity === "Warning" ? "warn" : "info"} />
                      <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{timeAgo(n.ts)} • {n.module}</div>
                    <div className="mt-2 text-sm text-slate-700">{n.message}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            ))}
          {!notifs.length ? <Empty title="No alerts" subtitle="You are all set." /> : null}
        </div>
      </Card>
    </div>
  );
}

function QuickLink({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{desc}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900 truncate">{value}</div>
    </div>
  );
}

function U2Orgs({
  orgs,
  activeOrgId,
  onSwitch,
  onGo,
}: {
  orgs: Org[];
  activeOrgId: string;
  onSwitch: (id: string) => void;
  onGo: (r: RouteKey) => void;
}) {
  const active = orgs.find((o) => o.id === activeOrgId) || orgs[0];

  return (
    <div className="space-y-4">
      <Card title="Organization switcher" subtitle="Switch your default org and view membership details" right={<Pill label={`Active: ${active.name}`} tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orgs.map((o) => {
            const selected = o.id === activeOrgId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSwitch(o.id)}
                className={cn(
                  "rounded-3xl border p-4 text-left transition",
                  selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{o.name}</div>
                      <Pill label={statusCopy(o)} tone={statusTone(o.status)} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Role: {o.role} • Group: {o.group}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill label={`Cost center: ${o.costCenter || "-"}`} tone="neutral" />
                      <Pill label={o.autoApprovalEligible ? "Auto-approval eligible" : "Auto-approval off"} tone={o.autoApprovalEligible ? "good" : "neutral"} />
                    </div>
                  </div>
                  <div className={cn("grid h-8 w-8 place-items-center rounded-2xl", selected ? "bg-white" : "bg-slate-100")}>
                    {selected ? <BadgeCheck className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          Premium: domain-based auto-join and smart prompts can be implemented here.
        </div>
      </Card>

      <Card title="Membership card" subtitle="What CorporatePay changes for you">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniStat title="Role" value={active.role} />
          <MiniStat title="Group" value={active.group} />
          <MiniStat title="Corporate status" value={statusCopy(active)} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          <QuickLink title="Payment methods" desc="Use CorporatePay at checkout" onClick={() => onGo("payment_methods")} />
          <QuickLink title="Limits" desc="Your caps and funding status" onClick={() => onGo("limits")} />
        </div>
      </Card>
    </div>
  );
}

function U3Policies({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const [sim, setSim] = useState({ module: "ServiceMart", amount: 520000, hour: 19, vendor: "Preferred" as "Preferred" | "Allowlisted" | "Unapproved" });
  const simOutcome = useMemo(() => {
    // simple logic-based simulator (premium placeholder)
    if (org.status === "Disabled") return { out: "Blocked" as const, why: "CorporatePay disabled for this org" };
    if (sim.vendor === "Unapproved" && sim.amount > 600000) return { out: "Blocked" as const, why: "High value with unapproved vendor" };
    if (sim.amount > 300000) return { out: "Approval" as const, why: "Amount above threshold" };
    if (sim.hour < 6 || sim.hour > 22) return { out: "Approval" as const, why: "Outside work hours" };
    return { out: "Allowed" as const, why: "Within policy" };
  }, [org.status, sim.amount, sim.hour, sim.vendor]);

  return (
    <div className="space-y-4">
      <Card title="Corporate Policies Summary (User View)" subtitle="Understand what is allowed before checkout" right={<Pill label="U3" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PolicyCard title="Rides & Logistics" bullets={["Ride categories allowed by org", "Geo/time rules", "Purpose required"]} />
          <PolicyCard title="E-Commerce" bullets={["Allowed marketplaces", "Vendor allowlist/denylist", "Basket limits"]} />
          <PolicyCard title="EVs & Charging" bullets={["Allowed stations/zones", "Session caps", "Receipt tags"]} />
          <PolicyCard title="ServiceMart bookings" bullets={["Approved vendors", "Work hours", "Approval thresholds"]} />
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Premium: policy change digests and a full policy simulator can be layered on top.
        </div>
      </Card>

      <Card title="Policy simulator (premium)" subtitle="If I do X, will it be allowed?" right={<Pill label={simOutcome.out === "Allowed" ? "Allowed" : simOutcome.out === "Approval" ? "Approval" : "Blocked"} tone={simOutcome.out === "Allowed" ? "good" : simOutcome.out === "Approval" ? "warn" : "bad"} />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Module</div>
            <select value={sim.module} onChange={(e) => setSim((p) => ({ ...p, module: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {[
                "Rides & Logistics",
                "ServiceMart",
                "MyLiveDealz",
                "EVs & Charging",
                "EVmart",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Amount</div>
            <input type="number" value={sim.amount} onChange={(e) => setSim((p) => ({ ...p, amount: Number(e.target.value || 0) }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Hour</div>
            <input type="number" min={0} max={23} value={sim.hour} onChange={(e) => setSim((p) => ({ ...p, hour: Number(e.target.value || 0) }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Vendor</div>
            <select value={sim.vendor} onChange={(e) => setSim((p) => ({ ...p, vendor: e.target.value as any }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {(["Preferred", "Allowlisted", "Unapproved"] as const).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
          Reason: <span className="font-semibold">{simOutcome.why}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onGo("payment_methods")}>
            <CreditCard className="h-4 w-4" /> Payment methods
          </Button>
          <Button variant="outline" onClick={() => onGo("policy_result")}>
            <AlertTriangle className="h-4 w-4" /> View out-of-policy screen
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PolicyCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function U4Limits({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const [caps] = useState({ daily: 250000, weekly: 1200000, monthly: 4200000 });
  const [used] = useState({ daily: 120000, weekly: 840000, monthly: 2650000 });

  const capPct = (u: number, a: number) => (a <= 0 ? 0 : Math.round((u / a) * 100));

  const funding = useMemo(() => {
    if (org.status === "Disabled" && org.disableReason === "Deposit depleted") return { tone: "bad" as const, title: "Deposit depleted", desc: "CorporatePay is disabled until the org tops up." };
    if (org.status === "Disabled") return { tone: "bad" as const, title: "CorporatePay disabled", desc: "CorporatePay is not available." };
    return { tone: "good" as const, title: "Funding healthy", desc: "Wallet/credit/deposit status is OK." };
  }, [org.status, org.disableReason]);

  return (
    <div className="space-y-4">
      <Card title="Corporate limits and budget visibility" subtitle="View your caps and program funding status" right={<Pill label="U4" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LimitRing title="Daily cap" used={used.daily} cap={caps.daily} />
          <LimitRing title="Weekly cap" used={used.weekly} cap={caps.weekly} />
          <LimitRing title="Monthly cap" used={used.monthly} cap={caps.monthly} />
        </div>

        <div className={cn("mt-4 rounded-3xl border p-4", funding.tone === "good" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{funding.title}</div>
              <div className="mt-1 text-sm text-slate-700">{funding.desc}</div>
            </div>
            <Pill label={funding.tone === "good" ? "Active" : "Stopped"} tone={funding.tone === "good" ? "good" : "bad"} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Premium: predictive warnings and budget-safe alternatives can be shown before checkout.
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onGo("payment_methods")}>
            <CreditCard className="h-4 w-4" /> Payment methods
          </Button>
          <Button variant="outline" onClick={() => onGo("requests")}>
            <Ticket className="h-4 w-4" /> View requests
          </Button>
        </div>
      </Card>

      <Card title="Policy-based messaging" subtitle="Clear enforcement states">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StateCard title="Deposit depleted" desc="Hard stop" tone="bad" />
          <StateCard title="Credit exceeded" desc="Hard stop" tone="bad" />
          <StateCard title="Billing delinquency" desc="Pause unless grace active" tone="warn" />
        </div>
      </Card>
    </div>
  );
}

function LimitRing({ title, used, cap }: { title: string; used: number; cap: number }) {
  const pct = cap <= 0 ? 0 : Math.round((used / cap) * 100);
  const tone = pct >= 100 ? "bad" : pct >= 80 ? "warn" : "good";
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * c;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(used)} / {formatUGX(cap)}</div>
          <div className="mt-1"><Pill label={`${pct}%`} tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"} /></div>
        </div>
        <div className="relative grid place-items-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={r} stroke={tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : "#e11d48"} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
          </svg>
          <div className="absolute text-sm font-semibold text-slate-900">{Math.min(100, pct)}%</div>
        </div>
      </div>
    </div>
  );
}

function StateCard({ title, desc, tone }: { title: string; desc: string; tone: "good" | "warn" | "bad" }) {
  return (
    <div className={cn("rounded-3xl border p-5 shadow-sm", tone === "good" ? "border-emerald-200 bg-emerald-50" : tone === "warn" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-700">{desc}</div>
        </div>
        <Pill label={tone === "good" ? "OK" : tone === "warn" ? "Attention" : "Stopped"} tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"} />
      </div>
    </div>
  );
}

function U5Requests({
  org,
  requests,
  selectedId,
  onOpen,
}: {
  org: Org;
  requests: AppRequest[];
  selectedId?: string;
  onOpen: (id: string) => void;
}) {
  const [type, setType] = useState<RequestType | "All">("All");
  const [status, setStatus] = useState<RequestStatus | "All">("All");

  const filtered = useMemo(() => {
    return requests
      .filter((r) => (type === "All" ? true : r.type === type))
      .filter((r) => (status === "All" ? true : r.status === status))
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [requests, type, status]);

  const selected = selectedId ? requests.find((r) => r.id === selectedId) || null : null;

  return (
    <div className="space-y-4">
      <Card title="My Requests" subtitle="Approvals, RFQs, and exceptions" right={<Pill label={org.name} tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Type</div>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {(["All", "Ride", "Service", "Purchase", "Charging", "RFQ", "Exception"] as const).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {(["All", "Draft", "Pending", "Approved", "Rejected", "Needs changes", "Expired"] as const).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Count</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{filtered.length}</div>
            <div className="mt-1 text-xs text-slate-500">Filtered</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onOpen(r.id)}
              className={cn(
                "w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50",
                selectedId === r.id && "bg-emerald-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={r.type} tone="neutral" />
                    <Pill label={r.status} tone={r.status === "Approved" ? "good" : r.status === "Pending" ? "warn" : r.status === "Rejected" ? "bad" : "neutral"} />
                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{timeAgo(r.ts)} • {r.module} • {formatUGX(r.amountUGX)}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </button>
          ))}
          {!filtered.length ? <Empty title="No requests" subtitle="You have no matching requests." /> : null}
        </div>
      </Card>

      {selected ? (
        <Card title="Request detail" subtitle="Audit-linked summary" right={<Pill label={selected.id} tone="neutral" />}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MiniStat title="Type" value={selected.type} />
            <MiniStat title="Status" value={selected.status} />
            <MiniStat title="Amount" value={formatUGX(selected.amountUGX)} />
            <MiniStat title="Module" value={selected.module} />
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            Timeline: Submitted → Assigned → Decision → Completed. In production, this links to U13 for full timeline.
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function U6Receipts({
  org,
  receipts,
  selectedId,
  onOpen,
}: {
  org: Org;
  receipts: ReceiptRow[];
  selectedId?: string;
  onOpen: (id: string) => void;
}) {
  const [type, setType] = useState<ReceiptType | "All">("All");
  const filtered = useMemo(() => {
    return receipts
      .filter((r) => (type === "All" ? true : r.type === type))
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [receipts, type]);

  const selected = selectedId ? receipts.find((r) => r.id === selectedId) || null : null;

  return (
    <div className="space-y-4">
      <Card title="Corporate Receipts" subtitle="Receipts for company-paid activity" right={<Pill label={org.name} tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Type</div>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {(["All", "Ride", "Order", "Charging", "Service", "Deal"] as const).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Count</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{filtered.length}</div>
            <div className="mt-1 text-xs text-slate-500">Filtered</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Export</div>
            <div className="mt-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="h-4 w-4" /> Print / PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onOpen(r.id)}
              className={cn(
                "w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50",
                selectedId === r.id && "bg-emerald-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={r.type} tone="neutral" />
                    <Pill label={r.status} tone={r.status === "Ready" ? "good" : r.status === "Cancelled" ? "warn" : "neutral"} />
                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{timeAgo(r.ts)} • {r.module} • {formatUGX(r.amountUGX)}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </button>
          ))}
          {!filtered.length ? <Empty title="No receipts" subtitle="You have no receipts for this filter." /> : null}
        </div>
      </Card>

      {selected ? (
        <Card title="Receipt detail" subtitle="Transparency for internal audits" right={<Pill label={selected.id} tone="neutral" />}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MiniStat title="Type" value={selected.type} />
            <MiniStat title="Status" value={selected.status} />
            <MiniStat title="Amount" value={formatUGX(selected.amountUGX)} />
            <MiniStat title="Module" value={selected.module} />
            <MiniStat title="Purpose" value={selected.purpose || "-"} />
            <MiniStat title="Cost center" value={selected.costCenter || "-"} />
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            Premium: explain-charge drilldown and dispute flow can be linked here.
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function U7PaymentMethods({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const [defaultMethod, setDefaultMethod] = useState<"Personal" | "Corporate">("Corporate");

  const corpAvailable = org.status === "Active" && org.eligible;
  const corpState = !org.eligible ? "Not available" : org.status === "Disabled" ? "Not available" : org.status === "Requires approval" ? "Requires approval" : "Available";

  return (
    <div className="space-y-4">
      <Card title="Payment Method Selector" subtitle="CorporatePay appears when linked, eligible, and funded" right={<Pill label="U7" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PayCard
            title="CorporatePay"
            desc={corpAvailable ? "Company-paid with approvals and policies" : `Unavailable: ${statusCopy(org)}`}
            selected={defaultMethod === "Corporate"}
            disabled={!corpAvailable}
            badge={corpState}
            onClick={() => setDefaultMethod("Corporate")}
            icon={<Building2 className="h-5 w-5" />}
          />
          <PayCard
            title="Personal payments"
            desc="Wallet / card / mobile money"
            selected={defaultMethod === "Personal"}
            badge="Always available"
            onClick={() => setDefaultMethod("Personal")}
            icon={<Wallet className="h-5 w-5" />}
          />
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          U8 CorporatePay Details Sheet can be shown as a bottom sheet before final submit.
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onGo("tags")}>
            <Tag className="h-4 w-4" /> Tags
          </Button>
          <Button variant="outline" onClick={() => onGo("attestation")}>
            <ClipboardCheck className="h-4 w-4" /> Purpose
          </Button>
          <Button variant="outline" onClick={() => onGo("approval_submit")}>
            <ChevronRight className="h-4 w-4" /> Approval submit
          </Button>
        </div>
      </Card>

      <Card title="CorporatePay Details (U8)" subtitle="Funding state and validation" right={<Pill label="U8" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniStat title="Funding" value={org.status === "Disabled" ? "Stopped" : "Wallet/Credit/Prepaid"} />
          <MiniStat title="Service status" value={statusCopy(org)} />
          <MiniStat title="Masked balance" value="UGX •••••" />
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Premium: run real-time validation check (policy + funding + caps) before final submit.
        </div>
      </Card>
    </div>
  );
}

function PayCard({
  title,
  desc,
  badge,
  selected,
  disabled,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  badge: string;
  selected: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
        selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <Pill label={badge} tone={badge.includes("Unavailable") || badge === "Not available" ? "bad" : badge === "Requires approval" ? "warn" : "neutral"} />
            </div>
            <div className="mt-1 text-sm text-slate-600">{desc}</div>
          </div>
        </div>
        <div className={cn("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white")}>
          {selected ? <Check className="h-4 w-4 text-emerald-700" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
        </div>
      </div>
    </button>
  );
}

function U9Tags({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const [group, setGroup] = useState(org.group);
  const [costCenter, setCostCenter] = useState(org.costCenter || "CAPEX-01");
  const [projectTag, setProjectTag] = useState("Fleet refresh");

  return (
    <div className="space-y-4">
      <Card title="Group, Cost Center & Project Tags" subtitle="These tags are required for correct billing" right={<Pill label="U9" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Group</div>
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {["Operations", "Sales", "Finance", "Admin", "Procurement"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Cost center</div>
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {["CAPEX-01", "OPS-01", "SAL-03", "FIN-01", "FLEET-01", "TRV-01"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Project tag</div>
            <input value={projectTag} onChange={(e) => setProjectTag(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
          </label>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          Premium: suggest tags based on history, location, or calendar keywords.
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onGo("attestation")}>
            <ClipboardCheck className="h-4 w-4" /> Purpose
          </Button>
          <Button variant="outline" onClick={() => onGo("payment_methods")}>
            <CreditCard className="h-4 w-4" /> Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}

function U10Attestation({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const [purpose, setPurpose] = useState("Client meeting");
  const [notes, setNotes] = useState("");
  const [attest, setAttest] = useState(false);
  const [attachment, setAttachment] = useState("");

  const ok = purpose.trim().length > 0 && attest;

  return (
    <div className="space-y-4">
      <Card title="Purpose & Compliance Attestation" subtitle="Required when policy demands purpose" right={<Pill label="U10" tone="neutral" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Purpose</div>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none">
              {["Airport", "Client meeting", "Office commute", "Project", "Charging", "Other"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Attachment (optional)</div>
            <input value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="Example: ApprovalLetter.pdf" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
            <div className="mt-2 text-xs text-slate-500">In production, this is file upload.</div>
          </label>
        </div>

        <label className="mt-2 block rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-600">Notes (optional)</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none" placeholder="Extra context" />
        </label>

        <label className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Attestation</div>
            <div className="mt-1 text-xs text-slate-600">I confirm this is business use only.</div>
          </div>
          <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300" />
        </label>

        <div className={cn("rounded-2xl p-3 text-xs ring-1", ok ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-amber-200")}>
          {ok ? "Ready." : "Select purpose and confirm attestation."}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onGo("tags")}>
            <Tag className="h-4 w-4" /> Tags
          </Button>
          <Button variant="primary" onClick={() => onGo("approval_submit")} disabled={!ok}>
            <ChevronRight className="h-4 w-4" /> Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

function U11OutOfPolicy({ onGo }: { onGo: (r: RouteKey) => void }) {
  return (
    <div className="space-y-4">
      <Card title="Out of policy" subtitle="Clear reason and safe alternatives" right={<Pill label="U11" tone="neutral" />}>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Blocked</div>
              <div className="mt-1 text-sm text-slate-700">Vendor is denylisted for corporate purchases.</div>
            </div>
            <Pill label="Vendor blocked" tone="bad" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <QuickLink title="Use approved vendor" desc="Switch to preferred seller for instant approval" onClick={() => onGo("flows_ecommerce")} />
          <QuickLink title="Pay personally" desc="Proceed immediately with personal payment" onClick={() => onGo("payment_methods")} />
          <QuickLink title="Request exception" desc="Submit approval request to override" onClick={() => onGo("approval_submit")} />
          <QuickLink title="Review policies" desc="See what is allowed" onClick={() => onGo("policies")} />
        </div>

        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Premium: show conflict resolution summary explaining what changed from last time.
        </div>
      </Card>
    </div>
  );
}

function U12ApprovalSubmit({ onGo }: { onGo: (r: RouteKey) => void }) {
  const [reason, setReason] = useState("This booking is required for operations.");
  const [attachments, setAttachments] = useState("SitePhoto.jpg, Requirements.pdf");
  const [reserve, setReserve] = useState(true);
  const [minutes, setMinutes] = useState(90);
  const [submitted, setSubmitted] = useState(false);
  const [approvalId, setApprovalId] = useState<string>("");

  const submit = () => {
    if (reason.trim().length < 10) return;
    const id = `APR-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    setApprovalId(id);
    setSubmitted(true);
  };

  return (
    <div className="space-y-4">
      <Card title="Approval Required" subtitle="Review and submit" right={<Pill label="U12" tone="neutral" />}>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Rule triggered</div>
              <div className="mt-1 text-sm text-slate-700">Amount exceeds threshold. Attachments required above threshold.</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill label="SLA: 8 hours" tone="neutral" />
                <Pill label="Routing: Manager + Finance" tone="neutral" />
              </div>
            </div>
            <Pill label="Approval" tone="warn" />
          </div>
        </div>

        <label className="block rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none" />
          {reason.trim().length < 10 ? <div className="mt-2 text-xs font-semibold text-rose-700">Write a clearer reason (min 10 chars).</div> : null}
        </label>

        <label className="block rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-600">Attachments (optional)</div>
          <input value={attachments} onChange={(e) => setAttachments(e.target.value)} placeholder="Comma-separated file names" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
          <div className="mt-2 text-xs text-slate-500">In production, upload files with audit links.</div>
        </label>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Reserve slot (premium)</div>
              <div className="mt-1 text-xs text-slate-600">Hold the booking slot while approval is pending.</div>
            </div>
            <button
              type="button"
              className={cn("relative h-7 w-12 rounded-full border transition", reserve ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
              onClick={() => setReserve((v) => !v)}
              aria-label="Toggle reserve"
            >
              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", reserve ? "left-[22px]" : "left-1")} />
            </button>
          </div>
          <div className={cn("mt-3", !reserve && "opacity-60")}>
            <div className="text-xs font-semibold text-slate-600">Hold minutes</div>
            <input type="number" value={minutes} disabled={!reserve} onChange={(e) => setMinutes(Math.max(15, Math.min(480, Number(e.target.value || 0))))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
            <div className="mt-2 text-xs text-slate-500">Suggested: 60–120 minutes</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={submit} disabled={reason.trim().length < 10}>
            <ChevronRight className="h-4 w-4" /> Submit
          </Button>
          <Button variant="outline" onClick={() => onGo("policy_result")}>
            <AlertTriangle className="h-4 w-4" /> Out-of-policy
          </Button>
        </div>

        {submitted ? (
          <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
            Submitted: <span className="font-semibold">{approvalId}</span>. Reserve: {reserve ? `${minutes} minutes` : "off"}.
            <button type="button" className="ml-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50" onClick={() => onGo("approval_status")}>Open status</button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function U13ApprovalStatus({ onGo }: { onGo: (r: RouteKey) => void }) {
  const [status, setStatus] = useState<"Submitted" | "Assigned" | "Approved" | "Rejected">("Submitted");
  const [ts] = useState<number>(() => Date.now() - 18 * 60 * 1000);

  useEffect(() => {
    // simple progression (demo)
    const t = window.setTimeout(() => {
      setStatus((s) => (s === "Submitted" ? "Assigned" : s === "Assigned" ? "Approved" : s));
    }, 3600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4">
      <Card title="Pending approval" subtitle="Track status and timeline" right={<Pill label="U13" tone="neutral" />}>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Status: {status}</div>
              <div className="mt-1 text-xs text-slate-500">Submitted {fmtDateTime(ts)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill label="SLA 8h" tone="neutral" />
                <Pill label="Approvers: Manager + Finance" tone="neutral" />
              </div>
            </div>
            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", status === "Approved" ? "bg-emerald-50 text-emerald-700" : status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")}>
              {status === "Approved" ? <BadgeCheck className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            <TimelineStep label="Submitted" done={true} />
            <TimelineStep label="Assigned" done={status !== "Submitted"} />
            <TimelineStep label="Decision" done={status === "Approved" || status === "Rejected"} />
            <TimelineStep label="Completed" done={status === "Approved"} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => onGo("requests")}>
              <Ticket className="h-4 w-4" /> My requests
            </Button>
            <Button variant="outline" onClick={() => onGo("flows_services")}>
              <CalendarClock className="h-4 w-4" /> Back to booking
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Premium: push reminders via WhatsApp/WeChat/SMS depending on org rules.
        </div>
      </Card>
    </div>
  );
}

function TimelineStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-3 py-2", done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className={cn("mt-1 text-sm font-semibold", done ? "text-emerald-800" : "text-slate-700")}>{done ? "Done" : "Pending"}</div>
    </div>
  );
}

function U14Enforcement({ org, onGo }: { org: Org; onGo: (r: RouteKey) => void }) {
  const state = useMemo(() => {
    if (org.status !== "Disabled") return "Active";
    return org.disableReason || "Disabled";
  }, [org.status, org.disableReason]);

  return (
    <div className="space-y-4">
      <Card title="CorporatePay enforcement" subtitle="Professional message and fallback" right={<Pill label="U14" tone="neutral" />}>
        <div className={cn(
          "rounded-3xl border p-4",
          org.status === "Disabled" ? "border-rose-200 bg-rose-50" : org.status === "Requires approval" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
        )}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">State: {state}</div>
              <div className="mt-1 text-sm text-slate-700">
                {org.status === "Disabled"
                  ? "CorporatePay is paused for this org. You can pay personally or contact your admin."
                  : org.status === "Requires approval"
                    ? "CorporatePay is active but approvals may be required."
                    : "CorporatePay is active."}
              </div>
            </div>
            <Pill label={org.status} tone={statusTone(org.status)} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => onGo("payment_methods")}>
              <Wallet className="h-4 w-4" /> Pay personally
            </Button>
            <Button variant="outline" onClick={() => onGo("orgs")}>
              <Users className="h-4 w-4" /> Contact admin
            </Button>
            <Button variant="outline" onClick={() => onGo("limits")}>
              <Lock className="h-4 w-4" /> View status
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          Premium: grace window messaging and offline-friendly queuing can be layered on top.
        </div>
      </Card>
    </div>
  );
}

function FlowStub({ title, desc, onGo }: { title: string; desc: string; onGo: (r: RouteKey) => void }) {
  return (
    <div className="space-y-4">
      <Card title={title} subtitle={desc} right={<Pill label="Wired" tone="good" />}>
        <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          This AppShell is responsible for navigation and route wiring. In your real codebase, import the page component generated in the corresponding canvas and mount it here.
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          <QuickLink title="Payment methods" desc="CorporatePay availability" onClick={() => onGo("payment_methods")} />
          <QuickLink title="Approval status" desc="Track approvals" onClick={() => onGo("approval_status")} />
          <QuickLink title="Policies" desc="Avoid declines" onClick={() => onGo("policies")} />
          <QuickLink title="Out of policy" desc="See reasons and alternatives" onClick={() => onGo("policy_result")} />
        </div>
      </Card>
    </div>
  );
}

function NotificationsPage({
  org,
  items,
  onGo,
}: {
  org: Org;
  items: Notif[];
  onGo: (r: RouteKey, id?: string) => void;
}) {
  const [selected, setSelected] = useState<Notif | null>(null);

  return (
    <div className="space-y-4">
      <Card title="Notifications" subtitle="Approvals, policy, funding alerts" right={<Pill label={org.name} tone="neutral" />}>
        <div className="space-y-2">
          {items
            .slice()
            .sort((a, b) => b.ts - a.ts)
            .map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelected(n)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={n.severity} tone={n.severity === "Critical" ? "bad" : n.severity === "Warning" ? "warn" : "info"} />
                      <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{timeAgo(n.ts)} • {n.module}</div>
                    <div className="mt-2 text-sm text-slate-700">{n.message}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </button>
            ))}
          {!items.length ? <Empty title="No notifications" subtitle="All clear." /> : null}
        </div>
      </Card>

      <Modal
        open={!!selected}
        title={selected?.title || "Notification"}
        subtitle={selected ? fmtDateTime(selected.ts) : undefined}
        onClose={() => setSelected(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="outline" onClick={() => onGo("requests")}>Open requests</Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={selected.severity} tone={selected.severity === "Critical" ? "bad" : selected.severity === "Warning" ? "warn" : "info"} />
                <Pill label={selected.module} tone="neutral" />
              </div>
              <div className="mt-2 text-sm text-slate-700">{selected.message}</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Why did I get this?</div>
              <div className="mt-1 text-xs text-slate-500">Audit-linked explanation</div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">{selected.why.summary}</div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {selected.why.triggers.map((t) => (
                  <div key={t.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-xs font-semibold text-slate-500">{t.label}</div>
                    <div className="text-sm font-semibold text-slate-900">{t.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Premium: create rule from this event, snooze, assign, resolve.
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
