import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    BadgeCheck,
    Check,
    ChevronRight,
    Info,
    Laptop,
    Lock,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Trash2,
} from "lucide-react";
import { cn, uid } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { ToastStack } from "@/components/ui/ToastStack";
import { Select } from "@/components/ui/Select";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

// -- Types --
type RiskLevel = "Low" | "Medium" | "High";

type Session = {
    id: string;
    device: "Android" | "iPhone" | "Windows" | "Mac";
    label: string;
    lastActive: string;
    location: string;
    ip: string;
    trusted: boolean;
    risk: RiskLevel;
    current: boolean;
};

type LoginEvent = {
    id: string;
    when: string;
    device: string;
    location: string;
    result: "Success" | "Failed";
    risk: RiskLevel;
    reason?: string;
};

type StepUpRule = {
    id: string;
    label: string;
    enabled: boolean;
    note: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function toneForRisk(r: RiskLevel) {
    if (r === "High") return "bad" as const;
    if (r === "Medium") return "warn" as const;
    return "good" as const;
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

function Toggle({ label, desc, value, onChange, tone }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void; tone?: "good" | "warn" | "info" | "neutral" }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{label}</div>
                        <Pill label={value ? "ON" : "OFF"} tone={value ? (tone ?? "good") : "neutral"} />
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{desc}</div>
                </div>
                <Button variant={value ? "primary" : "outline"} className="px-3 py-2 h-auto text-xs" onClick={() => onChange(!value)}>
                    {value ? "Enabled" : "Enable"}
                </Button>
            </div>
        </div>
    );
}

function deviceIcon(d: Session["device"]) {
    if (d === "Android" || d === "iPhone") return <Smartphone className="h-5 w-5" />;
    return <Laptop className="h-5 w-5" />;
}

export default function SecurityTrust() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = (t: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
        window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
    };

    const [twoFA, setTwoFA] = useState(true);
    const [withdrawalLock, setWithdrawalLock] = useState(true);
    const [newBeneficiaryLock, setNewBeneficiaryLock] = useState(true);
    const [selfHighValueApprovals, setSelfHighValueApprovals] = useState(false);
    const [coolingHours, setCoolingHours] = useState(24);

    const [sessions, setSessions] = useState<Session[]>([
        { id: "S-1", device: "Windows", label: "Chrome on Windows", lastActive: "Now", location: "Kampala, UG", ip: "197.157.xxx.xxx", trusted: true, risk: "Low", current: true },
        { id: "S-2", device: "Android", label: "Android phone", lastActive: "2h ago", location: "Kampala, UG", ip: "102.89.xxx.xxx", trusted: true, risk: "Low", current: false },
        { id: "S-4", device: "iPhone", label: "iPhone", lastActive: "1w ago", location: "Nairobi, KE", ip: "196.201.xxx.xxx", trusted: false, risk: "High", current: false },
    ]);

    const [rules, setRules] = useState<StepUpRule[]>([
        { id: "R-1", label: "New device", enabled: true, note: "Require OTP when signing in from a new device" },
        { id: "R-2", label: "Geo anomaly", enabled: true, note: "Require OTP when location changes significantly" },
        { id: "R-3", label: "High-risk payout", enabled: true, note: "Require OTP for high value payouts" },
    ]);

    const riskScore = useMemo(() => {
        const high = sessions.filter(s => s.risk === "High").length;
        const score = Math.max(0, 30 + high * 20 - (twoFA ? 15 : 0));
        return { score, level: score > 60 ? "High" : score > 30 ? "Medium" : "Low" as RiskLevel };
    }, [sessions, twoFA]);

    const revoke = (id: string) => {
        setSessions(p => p.filter(s => s.id !== id));
        toast({ kind: "success", title: "Session revoked" });
    };

    const toggleTrust = (id: string) => {
        setSessions(p => p.map(s => s.id === id ? { ...s, trusted: !s.trusted } : s));
        toast({ kind: "success", title: "Trust updated" });
    };

    return (
        <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

            <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                    <div className="border-b border-slate-200 px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Security & Trust</div>
                                    <div className="mt-1 text-xs text-slate-500">Prevent account takeover and payout fraud</div>
                                    <div className="mt-2 flex gap-2">
                                        <Pill label={`Risk: ${riskScore.level}`} tone={toneForRisk(riskScore.level)} />
                                        <Pill label={`${sessions.length} Sessions`} tone="neutral" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Audit Log" })}>Audit</Button>
                                <Button variant="primary" onClick={() => toast({ kind: "success", title: "Settings Saved" })}><Sparkles className="h-4 w-4" /> Save</Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-4 py-5 md:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 space-y-4">
                                <Section title="Security Controls" subtitle="Protect payouts and high-risk actions">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Toggle label="2FA" desc="Protect logins and high-risk actions" value={twoFA} onChange={setTwoFA} />
                                        <Toggle label="Withdrawal Lock" desc="Disable withdrawals immediately" value={withdrawalLock} onChange={setWithdrawalLock} tone="info" />
                                        <Toggle label="Beneficiary Lock" desc={`Cooling period: ${coolingHours}h`} value={newBeneficiaryLock} onChange={setNewBeneficiaryLock} tone="warn" />
                                        <div className="p-4 border border-slate-200 rounded-3xl bg-white">
                                            <span className="text-sm font-semibold block mb-2">Cooling Period</span>
                                            <Select value={String(coolingHours)} onChange={e => setCoolingHours(Number(e.target.value))} options={[0, 12, 24, 48].map(h => ({ label: `${h} hours`, value: String(h) }))} />
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Active Sessions" subtitle="Trusted devices and revoked access">
                                    <div className="space-y-2">
                                        {sessions.map(s => (
                                            <div key={s.id} className={cn("p-4 border rounded-3xl bg-white flex justify-between items-center", s.current ? "border-emerald-200 ring-2 ring-emerald-50" : "border-slate-200")}>
                                                <div className="flex gap-3 items-center">
                                                    <div className="p-2 bg-slate-50 rounded-2xl">{deviceIcon(s.device)}</div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{s.label}{s.current && " (Current)"}</div>
                                                        <div className="text-xs text-slate-500">{s.location} • {s.ip}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="px-3 py-1.5 h-auto text-xs" onClick={() => toggleTrust(s.id)}>{s.trusted ? "Untrust" : "Trust"}</Button>
                                                    {!s.current && <Button variant="outline" className="px-3 py-1.5 h-auto text-xs text-rose-600" onClick={() => revoke(s.id)}><Trash2 className="h-3 w-3" /></Button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                <Section title="Step-Up Rules" subtitle="Trigger extra verification for risky events">
                                    <div className="space-y-2">
                                        {rules.map(r => (
                                            <Toggle key={r.id} label={r.label} desc={r.note} value={r.enabled} onChange={() => setRules(p => p.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))} />
                                        ))}
                                    </div>
                                </Section>
                            </div>

                            <div className="lg:col-span-4 space-y-4">
                                <div className={cn("p-5 border rounded-3xl shadow-sm", riskScore.level === "High" ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200")}>
                                    <div className="flex gap-3 items-start">
                                        <div className="p-2 bg-white rounded-2xl shadow-sm"><ShieldAlert className={cn("h-5 w-5", riskScore.level === "High" ? "text-rose-600" : "text-slate-400")} /></div>
                                        <div>
                                            <span className="text-sm font-semibold block">Risk Score: {riskScore.score}</span>
                                            <span className="text-xs text-slate-500">Based on active sessions & 2FA status</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border border-slate-200 rounded-3xl bg-white shadow-sm">
                                    <span className="text-sm font-semibold block mb-4">Emergency Actions</span>
                                    <div className="space-y-2">
                                        <Button variant="accent" className="w-full text-xs" onClick={() => { setWithdrawalLock(true); toast({ kind: "success", title: "Withdrawals Locked" }); }}><Lock className="h-3 w-3" /> Lock Withdrawals</Button>
                                        <Button variant="outline" className="w-full text-xs" onClick={() => { setSessions(p => p.filter(s => s.current)); toast({ kind: "info", title: "Other Sessions Revoked" }); }}>Logout Other Devices</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
