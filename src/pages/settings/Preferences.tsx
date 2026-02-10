import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  Check,
  ChevronRight,
  Globe,
  Settings,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { cn, uid } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { ToastStack } from "@/components/ui/ToastStack";
import { Select } from "@/components/ui/Select";
import { SectionCard as Section } from "@/components/ui/SectionCard";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

// -- Types --
type Currency = "UGX" | "USD" | "CNY" | "KES";
type ModuleKey = "E-Commerce" | "Services" | "EV Charging" | "Rides & Logistics" | "CorporatePay" | "Shoppable Adz" | "Creator";
type PaymentMethod = "Personal Wallet" | "Organization Wallet" | "Card" | "Bank Transfer" | "Mobile Money" | "WeChat Pay" | "Alipay" | "UnionPay";
type PayoutMethod = "Bank" | "Mobile Money" | "China Settlement";
type Digest = "Off" | "Daily" | "Weekly";

type WorkProfile = {
  enabled: boolean;
  name: string;
  timezone: string;
  quietHours: string;
  workingDays: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
  workingHours: string;
  autoApplyToOrg: boolean;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

// Local Section removed (using @/components/ui/SectionCard)

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</div>
        </div>
        <Button variant={value ? "primary" : "outline"} className="px-3 py-2" onClick={() => onChange(!value)}>
          {value ? "ON" : "OFF"}
        </Button>
      </div>
    </div>
  );
}

export default function Preferences() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const modules: ModuleKey[] = ["E-Commerce", "Services", "EV Charging", "Rides & Logistics", "CorporatePay", "Shoppable Adz", "Creator"];
  const paymentMethods: PaymentMethod[] = ["Personal Wallet", "Organization Wallet", "Card", "Bank Transfer", "Mobile Money", "WeChat Pay", "Alipay", "UnionPay"];

  const [defaultPaymentByModule, setDefaultPaymentByModule] = useState<Record<ModuleKey, PaymentMethod>>({
    "E-Commerce": "Personal Wallet",
    Services: "Personal Wallet",
    "EV Charging": "Personal Wallet",
    "Rides & Logistics": "Mobile Money",
    CorporatePay: "Organization Wallet",
    "Shoppable Adz": "Personal Wallet",
    Creator: "Personal Wallet",
  });

  const payoutMethods: PayoutMethod[] = ["Mobile Money", "Bank", "China Settlement"];
  const [defaultPayoutMethod, setDefaultPayoutMethod] = useState<PayoutMethod>("Mobile Money");
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("UGX");
  const [digest, setDigest] = useState<Digest>("Daily");
  const [quietHours, setQuietHours] = useState("22:00 to 07:00");
  const [walletToggles, setWalletToggles] = useState({
    lowBalanceAlerts: true,
    payoutFailureAlerts: true,
    approvalAlerts: true,
    fxRateAlerts: false,
  });

  const [workProfile, setWorkProfile] = useState<WorkProfile>({
    enabled: true,
    name: "Work mode",
    timezone: "Africa/Kampala",
    quietHours: "21:00 to 06:00",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    workingHours: "09:00 to 18:00",
    autoApplyToOrg: true,
  });

  const [dirty, setDirty] = useState(false);

  const save = () => {
    setDirty(false);
    toast({ kind: "success", title: "Preferences saved" });
  };

  return (
    <div className="min-h-screen dark:bg-slate-900" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preferences</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Personalize wallet defaults and notifications across EVzone</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Wallet" })} className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Wallet</Button>
                <Button variant="primary" onClick={save}><Sparkles className="h-4 w-4" /> Save</Button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section title="Payment Defaults" subtitle="Default method used at checkout per module">
                  <div className="space-y-2">
                    {modules.map(m => (
                      <div key={m} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-800 gap-3">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m}</span>
                        <Select value={defaultPaymentByModule[m]} onChange={e => { setDefaultPaymentByModule(p => ({ ...p, [m]: e.target.value as any })); setDirty(true); }} options={paymentMethods.map(pm => ({ label: pm, value: pm }))} className="w-full sm:w-auto sm:min-w-[240px]" />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Payout & Display" subtitle="Configure currency and withdrawal defaults">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select label="Default Payout Method" value={defaultPayoutMethod} onChange={e => { setDefaultPayoutMethod(e.target.value as any); setDirty(true); }} options={payoutMethods.map(p => ({ label: p, value: p }))} />
                    <Select label="Display Currency" value={displayCurrency} onChange={e => { setDisplayCurrency(e.target.value as any); setDirty(true); }} options={["UGX", "USD", "CNY", "KES"].map(c => ({ label: c, value: c }))} />
                  </div>
                </Section>

                <Section title="Wallet Notifications" subtitle="Toggles and digest rules">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select label="Digest Frequency" value={digest} onChange={e => { setDigest(e.target.value as any); setDirty(true); }} options={["Off", "Daily", "Weekly"].map(d => ({ label: d, value: d }))} />
                    <Select label="Quiet Hours" value={quietHours} onChange={e => { setQuietHours(e.target.value); setDirty(true); }} options={["Off", "22:00 to 07:00", "21:00 to 06:00"].map(q => ({ label: q, value: q }))} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Toggle label="Low balance alerts" desc="Notify when deposits are low" value={walletToggles.lowBalanceAlerts} onChange={v => { setWalletToggles(p => ({ ...p, lowBalanceAlerts: v })); setDirty(true); }} />
                    <Toggle label="Approval alerts" desc="Notify for pending approvals" value={walletToggles.approvalAlerts} onChange={v => { setWalletToggles(p => ({ ...p, approvalAlerts: v })); setDirty(true); }} />
                  </div>
                </Section>

                <Section title="Work Profile" subtitle="Automatic scheduling for notifications">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable profile schedule</span>
                    <Button variant={workProfile.enabled ? "primary" : "outline"} onClick={() => { setWorkProfile(p => ({ ...p, enabled: !p.enabled })); setDirty(true); }}>{workProfile.enabled ? "ON" : "OFF"}</Button>
                  </div>
                  {workProfile.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                      <Select label="Timezone" value={workProfile.timezone} onChange={e => { setWorkProfile(p => ({ ...p, timezone: e.target.value })); setDirty(true); }} options={["Africa/Kampala", "UTC", "Asia/Shanghai"].map(t => ({ label: t, value: t }))} />
                      <Select label="Working Hours" value={workProfile.workingHours} onChange={e => { setWorkProfile(p => ({ ...p, workingHours: e.target.value })); setDirty(true); }} options={["09:00 to 18:00", "08:00 to 17:00"].map(h => ({ label: h, value: h }))} />
                    </div>
                  )}
                </Section>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden" style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.15), transparent)" }}>
                  <div className="flex gap-3 items-center">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Premium personalization</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl text-xs border border-slate-100 dark:border-slate-700 italic text-slate-600 dark:text-slate-400">Your defaults apply everywhere in the EVzone ecosystem.</div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Pill label="Per-module" tone="neutral" />
                      <Pill label="Schedules" tone="neutral" />
                      <Pill label="FX alerts" tone="neutral" />
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-800 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Preview</div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-Commerce Default</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{defaultPaymentByModule["E-Commerce"]}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Default Payout</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{defaultPayoutMethod}</div>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full mt-4" onClick={save}><BadgeCheck className="h-4 w-4" /> Save All Settings</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
