import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { cn, uid, formatUGX, timeAgo } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/ToastStack";
import { SectionCard as Section } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ActionCard } from "@/components/ui/ActionCard";
import { MiniList } from "@/components/ui/MiniList";
import { ProgressBar } from "@/components/ui/ProgressBar";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type Eligibility = "Eligible" | "Not eligible" | "Suspended" | "Deposit depleted";

type OrgRole = "Employee" | "Travel Coordinator" | "Approver";

type BudgetHealth = "Healthy" | "Near limit" | "Blocked";

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Cap = { limitUGX: number; usedUGX: number };

type OrgMembership = {
  id: string;
  orgName: string;
  role: OrgRole;
  group: string;
  costCenter: string;
  isDefault: boolean;
  eligibility: Eligibility;
  whyUnavailable?: string;
  auditRef?: { policyId: string; eventId: string; lastCheckedAt: number };
  approvalsPending: number;
  groupBudgetHealth: BudgetHealth;
  caps: { daily: Cap; weekly: Cap; monthly: Cap };
};

type Insight = {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
};

type TopItem = { name: string; value: string; hint?: string };

type NextBest = { id: string; title: string; desc: string; done: boolean; cta: string };

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.round((used / limit) * 100);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toneForEligibility(e: Eligibility) {
  if (e === "Eligible") return "good" as const;
  if (e === "Not eligible") return "neutral" as const;
  if (e === "Suspended") return "bad" as const;
  return "warn" as const;
}

function toneForBudgetHealth(h: BudgetHealth) {
  if (h === "Healthy") return "good" as const;
  if (h === "Near limit") return "warn" as const;
  return "bad" as const;
}

// Local UI components removed (using @/components/ui)

export default function UserCorporatePayHubU1() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgsSeed: OrgMembership[] = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: "ORG-1",
        orgName: "Acme Group Ltd",
        role: "Employee",
        group: "Operations",
        costCenter: "OPS-01",
        isDefault: true,
        eligibility: "Eligible",
        approvalsPending: 2,
        groupBudgetHealth: "Near limit",
        caps: {
          daily: { limitUGX: 250000, usedUGX: 185000 },
          weekly: { limitUGX: 1200000, usedUGX: 920000 },
          monthly: { limitUGX: 5000000, usedUGX: 4100000 },
        },
        auditRef: { policyId: "POL-RIDES-OPS", eventId: "EVT-23910", lastCheckedAt: now - 7 * 60 * 1000 },
      },
      {
        id: "ORG-2",
        orgName: "Kampala Holdings",
        role: "Travel Coordinator",
        group: "Admin",
        costCenter: "ADM-02",
        isDefault: false,
        eligibility: "Deposit depleted",
        whyUnavailable: "Prepaid deposit is depleted. CorporatePay is paused until the organization tops up.",
        approvalsPending: 0,
        groupBudgetHealth: "Blocked",
        caps: {
          daily: { limitUGX: 0, usedUGX: 0 },
          weekly: { limitUGX: 0, usedUGX: 0 },
          monthly: { limitUGX: 0, usedUGX: 0 },
        },
        auditRef: { policyId: "POL-FUNDING", eventId: "EVT-23911", lastCheckedAt: now - 22 * 60 * 1000 },
      },
      {
        id: "ORG-3",
        orgName: "EVzone Demo Org",
        role: "Approver",
        group: "Finance",
        costCenter: "FIN-01",
        isDefault: false,
        eligibility: "Suspended",
        whyUnavailable: "Billing is not compliant with the invoicing agreement. CorporatePay is suspended for this organization.",
        approvalsPending: 7,
        groupBudgetHealth: "Blocked",
        caps: {
          daily: { limitUGX: 300000, usedUGX: 120000 },
          weekly: { limitUGX: 1500000, usedUGX: 620000 },
          monthly: { limitUGX: 6000000, usedUGX: 2100000 },
        },
        auditRef: { policyId: "POL-ENFORCEMENT", eventId: "EVT-23912", lastCheckedAt: now - 55 * 60 * 1000 },
      },
    ];
  }, []);

  const [orgs, setOrgs] = useState<OrgMembership[]>(orgsSeed);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => orgsSeed.find((o) => o.isDefault)?.id || orgsSeed[0].id);

  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const activeOrg = useMemo(() => orgs.find((o) => o.id === activeOrgId) || orgs[0], [orgs, activeOrgId]);

  const isAvailable = activeOrg.eligibility === "Eligible";

  const nearCap = useMemo(() => {
    const m = activeOrg.caps.monthly;
    if (!m.limitUGX) return false;
    return pct(m.usedUGX, m.limitUGX) >= 80;
  }, [activeOrg]);

  const insights: Insight[] = useMemo(() => {
    // Privacy-safe aggregation: no personal-level details, only categories and patterns
    return [
      { label: "Top category", value: "Rides & Logistics", sub: "Last 30 days", icon: <Route className="h-5 w-5" /> },
      { label: "Top vendor", value: "EVzone Rides", sub: "Last 30 days", icon: <Users className="h-5 w-5" /> },
      { label: "Top route", value: "Office → Airport", sub: "Frequent pattern", icon: <MapPin className="h-5 w-5" /> },
      { label: "Approvals", value: `${activeOrg.approvalsPending}`, sub: "Pending now", icon: <ClipboardList className="h-5 w-5" /> },
    ];
  }, [activeOrg.approvalsPending]);

  const topCategories: TopItem[] = useMemo(() => {
    return [
      { name: "Rides & Logistics", value: "UGX 2,180,000", hint: "Includes corporate rides" },
      { name: "E-Commerce", value: "UGX 1,120,000", hint: "Includes MyLiveDealz" },
      { name: "EVs & Charging", value: "UGX 610,000", hint: "Charging sessions and credits" },
    ];
  }, []);

  const topRoutes: TopItem[] = useMemo(() => {
    return [
      { name: "Office → Airport", value: "12 trips" },
      { name: "Office → Client site", value: "9 trips" },
      { name: "Home → Office", value: "7 trips" },
    ];
  }, []);

  const topVendors: TopItem[] = useMemo(() => {
    return [
      { name: "EVzone Rides", value: "UGX 1,540,000" },
      { name: "MyLiveDealz Seller", value: "UGX 680,000" },
      { name: "EVzone Charging", value: "UGX 410,000" },
    ];
  }, []);

  const [nextBest, setNextBest] = useState<NextBest[]>(() => [
    {
      id: "nba-1",
      title: "Set your default purpose tag",
      desc: "Purpose tags reduce declines and speed up approvals.",
      done: false,
      cta: "Set now",
    },
    {
      id: "nba-2",
      title: "Confirm your cost center",
      desc: "Using the wrong cost center can trigger rejections.",
      done: true,
      cta: "View",
    },
    {
      id: "nba-3",
      title: "Request exception if urgent",
      desc: "If you are near cap, request an exception instead of switching to personal payment.",
      done: false,
      cta: "Request",
    },
  ]);

  const smartGuidance = useMemo(() => {
    if (!isAvailable) {
      const base = activeOrg.eligibility === "Deposit depleted" ? "CorporatePay is paused due to funding." : activeOrg.eligibility === "Suspended" ? "CorporatePay is suspended for this organization." : "CorporatePay is not available for this organization.";
      return {
        title: "CorporatePay unavailable",
        message: `${base} You can pay personally, switch organization, or contact your admin.`,
        tone: "warn" as const,
      };
    }

    if (nearCap) {
      return {
        title: "Near your monthly cap",
        message: "You are close to your monthly limit. Consider requesting an exception, or use personal payment if it is not a business expense.",
        tone: "warn" as const,
      };
    }

    return {
      title: "All set",
      message: "CorporatePay is available. Add purpose tags to speed up approvals and keep receipts clean.",
      tone: "good" as const,
    };
  }, [activeOrg.eligibility, isAvailable, nearCap]);

  const openAction = (id: string) => {
    const map: Record<string, { title: string; msg: string }> = {
      use: { title: "Use CorporatePay", msg: "Open Payment Methods selector." },
      requests: { title: "View Requests", msg: "Open My Requests." },
      receipts: { title: "Corporate Receipts", msg: "Open Corporate Receipts." },
      policies: { title: "Policies summary", msg: "Open Policies Summary." },
    };
    const t = map[id];
    toast({ title: t?.title || "Action", message: t?.msg || "", kind: "info" });
  };

  const setDefaultOrg = (id: string) => {
    setOrgs((prev) => prev.map((o) => ({ ...o, isDefault: o.id === id })));
    setActiveOrgId(id);
    toast({ title: "Default organization", message: "Updated your default organization.", kind: "success" });
  };

  const toggleNextBest = (id: string) => {
    setNextBest((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  };

  const caps = activeOrg.caps;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1100px] px-4 py-5 md:px-6">
        {/* Header */}
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">Hub overview for your corporate payments</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${activeOrg.orgName}`} tone="neutral" />
                    <Pill label={activeOrg.eligibility} tone={toneForEligibility(activeOrg.eligibility)} />
                    <Pill label={`Role: ${activeOrg.role}`} tone="neutral" />
                    <Pill label={`Group: ${activeOrg.group}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOrgPickerOpen(true)}
                  title="Switch organization"
                >
                  <Building2 className="h-4 w-4" />
                  Switch org
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openAction("policies")}
                  title="Policies summary"
                >
                  <ShieldCheck className="h-4 w-4" /> Policies
                </Button>
                <Button
                  variant="primary"
                  onClick={() => openAction("use")}
                  disabled={!isAvailable}
                  title={!isAvailable ? "CorporatePay unavailable" : "Use CorporatePay"}
                >
                  <CreditCard className="h-4 w-4" /> Use CorporatePay
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left */}
              <div className="lg:col-span-8 space-y-4">
                {/* Eligibility + why */}
                <Section
                  title="Eligibility status"
                  subtitle="What is available for you in this organization"
                  right={<Pill label={activeOrg.eligibility} tone={toneForEligibility(activeOrg.eligibility)} />}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Status</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">{activeOrg.eligibility}</div>
                          <div className="mt-1 text-sm text-slate-600">{isAvailable ? "CorporatePay is available at checkout." : "CorporatePay is not available right now."}</div>
                        </div>
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                          {isAvailable ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label={`Cost center: ${activeOrg.costCenter}`} tone="neutral" />
                        <Pill label={`Budget: ${activeOrg.groupBudgetHealth}`} tone={toneForBudgetHealth(activeOrg.groupBudgetHealth)} />
                      </div>

                      {!isAvailable ? (
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          {activeOrg.whyUnavailable || "CorporatePay is unavailable. Contact your admin."}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setWhyOpen((v) => !v)}>
                          <Info className="h-4 w-4" /> Why
                        </Button>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setAuditOpen(true)}>
                          <FileText className="h-4 w-4" /> Audit
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-2 text-xs"
                          onClick={() => toast({ title: "Request access", message: "Creates request for org admin (demo).", kind: "info" })}
                        >
                          <Users className="h-4 w-4" /> Request access
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Smart guidance</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">{smartGuidance.title}</div>
                          <div className="mt-1 text-sm text-slate-600">{smartGuidance.message}</div>
                        </div>
                        <div
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            smartGuidance.tone === "good" ? "bg-emerald-50 text-emerald-700" : smartGuidance.tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-700"
                          )}
                        >
                          <Sparkles className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <Button variant="primary" onClick={() => openAction("use")} disabled={!isAvailable}>
                          <CreditCard className="h-4 w-4" /> Use CorporatePay
                        </Button>
                        <Button variant="outline" onClick={() => openAction("requests")}>
                          <ClipboardList className="h-4 w-4" /> View Requests
                        </Button>
                        <Button variant="outline" onClick={() => toast({ title: "Exception", message: "Open request exception flow (U12).", kind: "info" })}>
                          <AlertTriangle className="h-4 w-4" /> Request exception
                        </Button>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        Premium tip: purpose tags and correct cost center reduce declines.
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {whyOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white"
                      >
                        <div className="border-b border-slate-200 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">Why CorporatePay is {isAvailable ? "available" : "unavailable"}</div>
                            <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={() => setWhyOpen(false)} aria-label="Close">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-4 text-sm text-slate-700">
                          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                            <div className="font-semibold text-slate-900">Explanation</div>
                            <div className="mt-2">
                              {isAvailable
                                ? "You are linked to an active organization, within your caps, and the organization is funded. CorporatePay will show as a payment option at checkout."
                                : activeOrg.whyUnavailable || "CorporatePay is unavailable due to eligibility or funding policy."}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Pill label={`Policy: ${activeOrg.auditRef?.policyId || "-"}`} tone="neutral" />
                              <Pill label={`Event: ${activeOrg.auditRef?.eventId || "-"}`} tone="neutral" />
                              <Pill label={`Checked: ${activeOrg.auditRef ? timeAgo(activeOrg.auditRef.lastCheckedAt) : "-"}`} tone="neutral" />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <ListRow
                              title="Switch organization"
                              subtitle="Use a different linked org"
                              right={<Building2 className="h-4 w-4 text-slate-600" />}
                              onClick={() => setOrgPickerOpen(true)}
                            />
                            <ListRow
                              title="Pay personally"
                              subtitle="Use personal payment method"
                              right={<Wallet className="h-4 w-4 text-slate-600" />}
                              onClick={() => toast({ title: "Personal payment", message: "Opens payment methods (demo).", kind: "info" })}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Section>

                {/* Quick actions */}
                <Section title="Quick actions" subtitle="Fast navigation" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ActionCard
                      title="Use CorporatePay"
                      desc="Select CorporatePay during checkout"
                      icon={<CreditCard className="h-5 w-5" />}
                      onClick={() => openAction("use")}
                      disabled={!isAvailable}
                    />
                    <ActionCard
                      title="View Requests"
                      desc="See approvals, exceptions, RFQs"
                      icon={<ClipboardList className="h-5 w-5" />}
                      onClick={() => openAction("requests")}
                    />
                    <ActionCard
                      title="Corporate Receipts"
                      desc="Receipts and corporate activity"
                      icon={<FileText className="h-5 w-5" />}
                      onClick={() => openAction("receipts")}
                    />
                    <ActionCard
                      title="Policies summary"
                      desc="See what is allowed"
                      icon={<ShieldCheck className="h-5 w-5" />}
                      onClick={() => openAction("policies")}
                    />
                  </div>
                </Section>

                {/* Snapshot widgets */}
                <Section title="Snapshot" subtitle="Caps, budgets, and approvals" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <StatCard icon={<Timer className="h-5 w-5" />} title="Daily cap" value={`${pct(caps.daily.usedUGX, caps.daily.limitUGX)}%`} sub={caps.daily.limitUGX ? `${formatUGX(caps.daily.usedUGX)} / ${formatUGX(caps.daily.limitUGX)}` : "No cap"} tone={caps.daily.limitUGX && pct(caps.daily.usedUGX, caps.daily.limitUGX) >= 80 ? "warn" : "neutral"} />
                    <StatCard icon={<Activity className="h-5 w-5" />} title="Weekly cap" value={`${pct(caps.weekly.usedUGX, caps.weekly.limitUGX)}%`} sub={caps.weekly.limitUGX ? `${formatUGX(caps.weekly.usedUGX)} / ${formatUGX(caps.weekly.limitUGX)}` : "No cap"} tone={caps.weekly.limitUGX && pct(caps.weekly.usedUGX, caps.weekly.limitUGX) >= 80 ? "warn" : "neutral"} />
                    <StatCard icon={<BarChart3 className="h-5 w-5" />} title="Monthly cap" value={`${pct(caps.monthly.usedUGX, caps.monthly.limitUGX)}%`} sub={caps.monthly.limitUGX ? `${formatUGX(caps.monthly.usedUGX)} / ${formatUGX(caps.monthly.limitUGX)}` : "No cap"} tone={caps.monthly.limitUGX && pct(caps.monthly.usedUGX, caps.monthly.limitUGX) >= 80 ? "warn" : "neutral"} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Monthly usage</div>
                          <div className="mt-1 text-xs text-slate-500">Your monthly cap usage</div>
                        </div>
                        <Pill label={nearCap ? "Near cap" : "Normal"} tone={nearCap ? "warn" : "good"} />
                      </div>
                      <div className="mt-4">
                        <ProgressBar value={caps.monthly.usedUGX} total={caps.monthly.limitUGX} labelLeft="Monthly" labelRight={`${formatUGX(caps.monthly.limitUGX - caps.monthly.usedUGX)} remaining`} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Group budget health</div>
                          <div className="mt-1 text-xs text-slate-500">View-only status</div>
                        </div>
                        <Pill label={activeOrg.groupBudgetHealth} tone={toneForBudgetHealth(activeOrg.groupBudgetHealth)} />
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        {activeOrg.groupBudgetHealth === "Healthy"
                          ? "Your group has budget available."
                          : activeOrg.groupBudgetHealth === "Near limit"
                            ? "Your group budget is near limit. Approvals may be required more often."
                            : "Your group budget is blocked. CorporatePay may fail at checkout."}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openAction("requests")}>
                          <ClipboardList className="h-4 w-4" /> View requests
                        </Button>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: "Contact admin", message: "Creates a message to org admin (demo).", kind: "info" })}>
                          <Users className="h-4 w-4" /> Contact admin
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Approvals pending: <span className="font-semibold text-slate-900">{activeOrg.approvalsPending}</span>. Some approvals can be auto-approved under thresholds.
                  </div>
                </Section>

                {/* Premium: insights */}
                <Section title="Personal usage insights" subtitle="Privacy-safe aggregation" right={<Pill label="Premium" tone="info" />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {insights.map((s) => (
                      <StatCard key={s.label} icon={s.icon} title={s.label} value={s.value} sub={s.sub} tone="neutral" />
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <MiniList title="Top categories" items={topCategories} icon={<BarChart3 className="h-4 w-4" />} />
                    </div>
                    <div className="lg:col-span-4">
                      <MiniList title="Top routes" items={topRoutes} icon={<Route className="h-4 w-4" />} />
                    </div>
                    <div className="lg:col-span-4">
                      <MiniList title="Top vendors" items={topVendors} icon={<Users className="h-4 w-4" />} />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Privacy note: insights are aggregated to avoid exposing sensitive details.
                  </div>
                </Section>

                {/* Premium: next best actions */}
                <Section title="Next best actions" subtitle="Premium nudges to reduce declines" right={<Pill label="Premium" tone="info" />}>
                  <div className="space-y-2">
                    {nextBest.map((n) => (
                      <div key={n.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={n.done ? "Done" : "Pending"} tone={n.done ? "good" : "warn"} />
                              <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{n.desc}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleNextBest(n.id)}>
                              <Check className="h-4 w-4" /> Toggle
                            </Button>
                            <Button
                              variant={n.done ? "outline" : "primary"}
                              className="px-3 py-2 text-xs"
                              onClick={() => toast({ title: n.cta, message: "This would open the relevant setup screen.", kind: "info" })}
                            >
                              <ChevronRight className="h-4 w-4" /> {n.cta}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Right rail */}
              <div className="lg:col-span-4 space-y-4">
                <Section title="Linked organizations" subtitle="Switch and set default" right={<Pill label={`${orgs.length}`} tone="neutral" />}>
                  <div className="space-y-2">
                    {orgs.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={cn(
                          "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                          o.id === activeOrgId ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                        )}
                        onClick={() => setActiveOrgId(o.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{o.orgName}</div>
                              {o.isDefault ? <Pill label="Default" tone="info" /> : null}
                              <Pill label={o.eligibility} tone={toneForEligibility(o.eligibility)} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{o.role} • {o.group} • {o.costCenter}</div>
                            <div className="mt-2 text-xs text-slate-600">Approvals pending: <span className="font-semibold">{o.approvalsPending}</span></div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            className="px-3 py-2 text-xs"
                            onClick={(e) => {
                              e?.stopPropagation();
                              setDefaultOrg(o.id);
                            }}
                          >
                            <BadgeCheck className="h-4 w-4" /> Set default
                          </Button>
                          <Button
                            variant="outline"
                            className="px-3 py-2 text-xs"
                            onClick={(e) => {
                              e?.stopPropagation();
                              toast({ title: "Membership", message: "Open membership details (U2).", kind: "info" });
                            }}
                          >
                            <Users className="h-4 w-4" /> Membership
                          </Button>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    Tip: if you belong to multiple orgs, choose the correct org before checkout.
                  </div>
                </Section>

                <Section title="Shortcuts" subtitle="Common screens" right={<Pill label="Core" tone="neutral" />}>
                  <div className="space-y-2">
                    <ListRow
                      title="Payment methods"
                      subtitle="CorporatePay appears here"
                      right={<CreditCard className="h-4 w-4 text-slate-600" />}
                      onClick={() => toast({ title: "Payment methods", message: "Open U7 (demo).", kind: "info" })}
                    />
                    <ListRow
                      title="Requests"
                      subtitle="Approvals, exceptions, RFQs"
                      right={<ClipboardList className="h-4 w-4 text-slate-600" />}
                      onClick={() => openAction("requests")}
                    />
                    <ListRow
                      title="Corporate receipts"
                      subtitle="Receipts and history"
                      right={<FileText className="h-4 w-4 text-slate-600" />}
                      onClick={() => openAction("receipts")}
                    />
                    <ListRow
                      title="Preferences"
                      subtitle="Default org and notifications"
                      right={<Settings className="h-4 w-4 text-slate-600" />}
                      onClick={() => toast({ title: "Preferences", message: "Open U23 (demo).", kind: "info" })}
                    />
                  </div>
                </Section>
              </div>
            </div>

            {/* Mobile footer bar */}
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-2 lg:hidden">
              <div className="grid grid-cols-4 gap-2">
                <MobileTab label="Hub" active icon={<Sparkles className="h-5 w-5" />} onClick={() => toast({ title: "Hub", message: "Already here.", kind: "info" })} />
                <MobileTab label="Requests" icon={<ClipboardList className="h-5 w-5" />} onClick={() => openAction("requests")} badge={activeOrg.approvalsPending ? `${activeOrg.approvalsPending}` : undefined} />
                <MobileTab label="Wallet" icon={<Wallet className="h-5 w-5" />} onClick={() => toast({ title: "Wallet", message: "Open Wallet module (demo).", kind: "info" })} />
                <MobileTab label="More" icon={<ChevronDown className="h-5 w-5" />} onClick={() => setOrgPickerOpen(true)} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white/60 px-4 py-5 text-xs text-slate-500 md:px-6">
            U1 CorporatePay Hub (Overview). Core: org linking, eligibility, quick actions, caps, group health, approvals. Premium: insights and next best actions.
          </div>
        </div>
      </div>

      {/* Org picker modal */}
      <Modal
        open={orgPickerOpen}
        title="Switch organization"
        subtitle="Select which organization CorporatePay should use"
        onClose={() => setOrgPickerOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setOrgPickerOpen(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                const cur = orgs.find((o) => o.id === activeOrgId);
                if (cur) setDefaultOrg(cur.id);
                setOrgPickerOpen(false);
              }}
            >
              <BadgeCheck className="h-4 w-4" /> Set selected as default
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {orgs.map((o) => (
            <button
              key={o.id}
              type="button"
              className={cn(
                "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                o.id === activeOrgId ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
              )}
              onClick={() => setActiveOrgId(o.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{o.orgName}</div>
                    {o.isDefault ? <Pill label="Default" tone="info" /> : null}
                    <Pill label={o.eligibility} tone={toneForEligibility(o.eligibility)} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{o.role} • {o.group} • {o.costCenter}</div>
                  {!isAvailable && o.whyUnavailable ? <div className="mt-2 text-xs text-slate-600">{o.whyUnavailable}</div> : null}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Audit modal */}
      <Modal
        open={auditOpen}
        title="Policy and audit reference"
        subtitle="This explains the policy decision used for eligibility"
        onClose={() => setAuditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAuditOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={activeOrg.eligibility} tone={toneForEligibility(activeOrg.eligibility)} />
            <Pill label={`Policy: ${activeOrg.auditRef?.policyId || "-"}`} tone="neutral" />
            <Pill label={`Event: ${activeOrg.auditRef?.eventId || "-"}`} tone="neutral" />
          </div>
          <div className="mt-3 text-sm text-slate-700">
            This reference can be used by your admin or EVzone Support to explain why CorporatePay is available or blocked for you.
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            Last checked: {activeOrg.auditRef ? timeAgo(activeOrg.auditRef.lastCheckedAt) : "-"}
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Audit-linked explanations should be visible and readable, without exposing sensitive internal finance data.
        </div>
      </Modal>
    </div>
  );
}

// Local ActionCard and MiniList removed

function MobileTab({ label, icon, active, onClick, badge }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void; badge?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
        active ? "text-white" : "text-slate-700 hover:bg-slate-100"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      <div className={cn("relative", active ? "text-white" : "text-slate-700")}>{icon}</div>
      <div className="leading-none">{label}</div>
      {badge ? <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badge}</span> : null}
    </button>
  );
}
