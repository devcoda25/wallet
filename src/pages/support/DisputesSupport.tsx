import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    BadgeCheck,
    Building2,
    Check,
    ChevronRight,
    Clock,
    FileText,
    Flag,
    Headphones,
    Info,
    MessageCircle,
    Phone,
    Search,
    ShieldCheck,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { cn, uid } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { ToastStack } from "@/components/ui/ToastStack";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

// -- Types --
type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";
type DisputeType = "Unauthorized transaction" | "Wrong amount" | "Payout not received" | "Refund request" | "Chargeback";
type ContextId = "personal" | "org_acme" | "org_khl";
type ModuleKey = "Wallet" | "CorporatePay" | "E-Commerce" | "Services" | "EV Charging" | "Rides & Logistics";
type TicketStatus = "Open" | "In review" | "Awaiting user" | "Resolved" | "Escalated";

type Ticket = {
    id: string;
    title: string;
    type: DisputeType;
    contextId: ContextId;
    module: ModuleKey;
    status: TicketStatus;
    createdAt: string;
    lastUpdate: string;
    sla: { target: string; remaining: string; breached: boolean };
    escalationPath: string;
    channels: Channel[];
    txRef?: string;
    autoSuggested: boolean;
    messages: Array<{ who: string; when: string; text: string }>;
    attachments: Array<{ id: string; name: string; kind: "Receipt" | "Proof" | "Chat" | "Other"; when: string }>;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function toneForStatus(s: TicketStatus) {
    if (s === "Resolved") return "good" as const;
    if (s === "Escalated") return "warn" as const;
    if (s === "Open" || s === "In review") return "info" as const;
    return "neutral" as const;
}

export default function DisputesSupport() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = (t: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
        window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
    };

    const seed = useMemo<Ticket[]>(
        () => [
            {
                id: "DSP-201",
                title: "Payout not received",
                type: "Payout not received",
                contextId: "personal",
                module: "Wallet",
                status: "Open",
                createdAt: "Today 07:10",
                lastUpdate: "10m ago",
                sla: { target: "4h", remaining: "3h 20m", breached: false },
                escalationPath: "EVzone Support → Provider",
                channels: ["In-app", "WhatsApp"],
                txRef: "TX-9005",
                autoSuggested: true,
                messages: [
                    { who: "System", when: "Today 07:10", text: "We noticed a payout failure and suggested opening a dispute." },
                    { who: "User", when: "Today 07:12", text: "My payout did not arrive. Please assist." },
                ],
                attachments: [{ id: "A1", name: "Receipt.pdf", kind: "Receipt", when: "Today 07:12" }],
            },
            {
                id: "DSP-202",
                title: "Wrong amount",
                type: "Wrong amount",
                contextId: "org_acme",
                module: "CorporatePay",
                status: "In review",
                createdAt: "Yesterday",
                lastUpdate: "2h ago",
                sla: { target: "8h", remaining: "1h 10m", breached: false },
                escalationPath: "Org Admin → EVzone Support → Vendor",
                channels: ["In-app", "Email"],
                txRef: "TX-9006",
                autoSuggested: false,
                messages: [
                    { who: "User", when: "Yesterday", text: "The invoice total does not match the approved quote." },
                    { who: "EVzone Support", when: "2h ago", text: "We are verifying the vendor invoice and approval chain." },
                ],
                attachments: [
                    { id: "A2", name: "Invoice.pdf", kind: "Receipt", when: "Yesterday" },
                    { id: "A3", name: "Quote.png", kind: "Proof", when: "Yesterday" },
                ],
            },
            {
                id: "DSP-203",
                title: "Unauthorized transaction",
                type: "Unauthorized transaction",
                contextId: "personal",
                module: "E-Commerce",
                status: "Escalated",
                createdAt: "Last week",
                lastUpdate: "Yesterday",
                sla: { target: "24h", remaining: "Breached", breached: true },
                escalationPath: "EVzone Support → Risk Desk",
                channels: ["In-app", "Email", "SMS"],
                txRef: "TX-8801",
                autoSuggested: true,
                messages: [
                    { who: "System", when: "Last week", text: "Suspicious pattern detected. We suggested a dispute." },
                    { who: "User", when: "Last week", text: "I did not authorize this purchase." },
                    { who: "EVzone Support", when: "Yesterday", text: "Case escalated to Risk Desk due to SLA breach." },
                ],
                attachments: [{ id: "A4", name: "ChatLog.txt", kind: "Chat", when: "Last week" }],
            },
        ],
        []
    );

    const [tickets, setTickets] = useState(seed);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"ALL" | TicketStatus>("ALL");
    const [type, setType] = useState<"ALL" | DisputeType>("ALL");
    const [context, setContext] = useState<"ALL" | ContextId>("ALL");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tickets.filter((t) => {
            const qOk = !q || `${t.id} ${t.title} ${t.type} ${t.txRef ?? ""}`.toLowerCase().includes(q);
            const sOk = status === "ALL" ? true : t.status === status;
            const tOk = type === "ALL" ? true : t.type === type;
            const cOk = context === "ALL" ? true : t.contextId === context;
            return qOk && sOk && tOk && cOk;
        });
    }, [tickets, query, status, type, context]);

    const [active, setActive] = useState<Ticket | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const openTicket = (t: Ticket) => {
        setActive(t);
        setDetailOpen(true);
    };

    const addAttachment = (kind: Ticket["attachments"][number]["kind"]) => {
        if (!active) return;
        const a = { id: uid("att"), name: kind === "Proof" ? "Proof.png" : kind === "Receipt" ? "Receipt.pdf" : kind === "Chat" ? "Chat.txt" : "File.bin", kind, when: "Just now" };
        setTickets((p) => p.map((x) => (x.id === active.id ? { ...x, attachments: [a, ...x.attachments] } : x)));
        setActive((p) => (p ? { ...p, attachments: [a, ...p.attachments] } : p));
        toast({ kind: "success", title: "Attachment added", message: a.name });
    };

    const sendMessage = (text: string) => {
        if (!active || !text.trim()) return;
        const msg = { who: "User", when: "Just now", text: text.trim() };
        setTickets((p) => p.map((x) => (x.id === active.id ? { ...x, messages: [...x.messages, msg], lastUpdate: "Just now" } : x)));
        setActive((p) => (p ? { ...p, messages: [...p.messages, msg], lastUpdate: "Just now" } : p));
        toast({ kind: "success", title: "Message sent" });
    };

    const [newMsg, setNewMsg] = useState("");

    const createOpen = useMemo(() => {
        const breached = tickets.some((t) => t.sla.breached);
        const payoutFailed = tickets.some((t) => t.type === "Payout not received" && (t.status === "Open" || t.status === "Escalated"));
        return breached || payoutFailed;
    }, [tickets]);

    const createTicket = () => {
        const t: Ticket = {
            id: `DSP-${Math.floor(300 + Math.random() * 900)}`,
            title: "Refund request",
            type: "Refund request",
            contextId: "personal",
            module: "E-Commerce",
            status: "Open",
            createdAt: "Just now",
            lastUpdate: "Just now",
            sla: { target: "24h", remaining: "23h 59m", breached: false },
            escalationPath: "EVzone Support → Vendor",
            channels: ["In-app", "Email", "WhatsApp"],
            txRef: "TX-9010",
            autoSuggested: false,
            messages: [{ who: "User", when: "Just now", text: "I would like a refund." }],
            attachments: [],
        };
        setTickets((p) => [t, ...p]);
        toast({ kind: "success", title: "Ticket created", message: t.id });
    };

    return (
        <div className="min-h-screen dark:bg-slate-900" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

            <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)] dark:border-slate-700 dark:bg-slate-800">
                    {/* Header */}
                    <div className="border-b border-slate-200 px-4 py-4 md:px-6 dark:border-slate-700">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white dark:opacity-90" style={{ background: EVZ.green }}>
                                    <Flag className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Disputes & Support</div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">One ticketing workflow for wallet and checkout issues</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Wallet", message: "Back to Home." })}>
                                    <ChevronRight className="h-4 w-4" /> Wallet
                                </Button>
                                <Button variant="primary" onClick={createTicket}>
                                    <ChevronRight className="h-4 w-4" /> New ticket
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div className="md:col-span-5">
                                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticket id, tx ref, title" />
                            </div>
                            <div className="md:col-span-2">
                                <Select value={status} onChange={(e) => setStatus(e.target.value as any)} options={["ALL", "Open", "In review", "Awaiting user", "Resolved", "Escalated"].map(s => ({ label: s, value: s }))} />
                            </div>
                            <div className="md:col-span-3">
                                <Select value={type} onChange={(e) => setType(e.target.value as any)} options={["ALL", "Unauthorized transaction", "Wrong amount", "Payout not received", "Refund request", "Chargeback"].map(t => ({ label: t, value: t }))} />
                            </div>
                            <div className="md:col-span-2">
                                <Select value={context} onChange={(e) => setContext(e.target.value as any)} options={["ALL", "personal", "org_acme", "org_khl"].map(c => ({ label: c, value: c }))} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-4 py-5 md:px-6 dark:bg-slate-900">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="space-y-4 lg:col-span-8">
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tickets</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">SLA tracking and escalation included</div>
                                        </div>
                                        <Pill label={`${filtered.length}`} tone="neutral" />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {filtered.map((t) => (
                                            <button key={t.id} type="button" onClick={() => openTicket(t)} className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</div>
                                                            <Pill label={t.status} tone={toneForStatus(t.status)} />
                                                            <Pill label={t.contextId} tone={t.contextId === "personal" ? "neutral" : "info"} />
                                                            {t.sla.breached ? <Pill label="SLA breached" tone="bad" /> : <Pill label={`SLA ${t.sla.remaining}`} tone="neutral" />}
                                                        </div>
                                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.id}{t.txRef ? ` • Tx ${t.txRef}` : ""}</div>
                                                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Created {t.createdAt} • Last update {t.lastUpdate}</div>
                                                    </div>
                                                    <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", t.sla.breached ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300")}>
                                                        {t.sla.breached ? <AlertTriangle className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {!filtered.length && <div className="p-4 text-sm text-slate-600">No tickets found.</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 lg:col-span-4">
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Escalation path</div>
                                    <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                        <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-3xl dark:border-slate-700">
                                            <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                            <div>
                                                <div className="font-semibold dark:text-slate-200">Org Admin</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">First line for corporate issues</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-3xl">
                                            <Headphones className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                            <div>
                                                <div className="font-semibold dark:text-slate-200">EVzone Support</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Global support desk</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal open={detailOpen} title={active?.title || ""} onClose={() => setDetailOpen(false)}>
                {active && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="p-4 border border-slate-200 rounded-3xl bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">SLA Tracking</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Target: {active.sla.target} • Remaining: {active.sla.remaining}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Attachments</div>
                                {active.attachments.map(a => (
                                    <div key={a.id} className="p-3 border border-slate-200 rounded-2xl flex justify-between items-center text-sm dark:border-slate-700">
                                        <span className="dark:text-slate-200">{a.name}</span>
                                        <Button variant="outline" className="px-2 py-1 h-auto text-xs dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">View</Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => addAttachment("Proof")} className="text-xs dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><Upload className="h-3 w-3" /> Proof</Button>
                                    <Button variant="outline" onClick={() => addAttachment("Receipt")} className="text-xs dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><Upload className="h-3 w-3" /> Receipt</Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Conversation</div>
                            <div className="space-y-2 max-h-[300px] overflow-auto">
                                {active.messages.map((m, i) => (
                                    <div key={i} className="p-3 border border-slate-200 rounded-2xl bg-white text-sm dark:border-slate-700 dark:bg-slate-800">
                                        <div className="flex justify-between mb-1 opacity-60 dark:text-slate-400"><span>{m.who}</span> <span>{m.when}</span></div>
                                        <div className="dark:text-slate-200">{m.text}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message" />
                                <Button variant="primary" onClick={() => { sendMessage(newMsg); setNewMsg(""); }}><MessageCircle className="h-4 w-4" /> Send</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
