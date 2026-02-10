// ============================================================================
// Withdrawals Page - Cash Out / Payouts (w_07)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    ArrowUpRight,
    Banknote,
    Smartphone,
    Building2,
    Check,
    Clock,
    AlertTriangle,
    ChevronRight,
    X,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, TextField, InputAdornment, Chip, Tab, Tabs, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Button as MUIButton } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type PayoutMethod = "bank" | "mobile" | "china";
type PayoutState = "Queued" | "Processing" | "Paid" | "Failed" | "Reversed";

interface Beneficiary {
    id: string;
    label: string;
    type: PayoutMethod;
    currency: string;
    status: "Verified" | "Pending" | "Failed";
    detailsMasked: string;
    cooling: "None" | "Cooling";
}

interface Payout {
    id: string;
    createdAt: string;
    method: PayoutMethod;
    beneficiaryLabel: string;
    amount: number;
    fee: number;
    totalDebit: number;
    eta: string;
    state: PayoutState;
    ref: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMoney(amount: number, currency: string = "UGX"): string {
    const abs = Math.abs(amount);
    const isUGX = currency === "UGX";
    const decimals = isUGX ? 0 : 2;
    const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${currency} ${num}`;
}

function toneForStatus(s: PayoutState): "good" | "info" | "warn" | "bad" {
    if (s === "Paid" || s === "Queued") return "good";
    if (s === "Processing") return "info";
    if (s === "Failed" || s === "Reversed") return "bad";
    return "warn";
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
    const map: Record<string, string> = {
        good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warn: "bg-amber-50 text-amber-800 ring-amber-200",
        bad: "bg-rose-50 text-rose-700 ring-rose-200",
        info: "bg-blue-50 text-blue-700 ring-blue-200",
        neutral: "bg-slate-50 text-slate-700 ring-slate-200",
    };
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                backgroundColor: map[tone]?.split(" ")[0],
                color: map[tone]?.split(" ")[1],
                fontWeight: 600,
                fontSize: "0.75rem",
            }}
        />
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function BeneficiaryRow({
    beneficiary,
    onClick,
    selected,
}: {
    beneficiary: Beneficiary;
    onClick: () => void;
    selected: boolean;
}) {
    const Icon = beneficiary.type === "bank" ? Building2 : beneficiary.type === "mobile" ? Smartphone : Banknote;

    return (
        <ListItem
            button
            onClick={onClick}
            sx={{
                borderRadius: 3,
                border: selected ? "2px solid #10b981" : "1px solid #e2e8f0",
                mb: 1,
                bgcolor: selected ? "#ecfdf5" : "white",
            }}
        >
            <ListItemIcon>
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${beneficiary.type === "bank" ? "bg-blue-50" : "bg-emerald-50"}`}>
                    <Icon className={`h-5 w-5 ${beneficiary.type === "bank" ? "text-blue-600" : "text-emerald-600"}`} />
                </div>
            </ListItemIcon>
            <ListItemText
                primary={beneficiary.label}
                secondary={`${beneficiary.detailsMasked} • ${beneficiary.currency}`}
                primaryTypographyProps={{ fontWeight: 600 }}
            />
            <ListItemSecondaryAction>
                <div className="flex items-center gap-2">
                    <Pill label={beneficiary.status} tone={beneficiary.status === "Verified" ? "good" : "warn"} />
                    {beneficiary.cooling === "Cooling" && <Pill label="Cooling" tone="warn" />}
                </div>
            </ListItemSecondaryAction>
        </ListItem>
    );
}

function PayoutCard({ payout }: { payout: Payout }) {
    const Icon = payout.method === "bank" ? Building2 : payout.method === "mobile" ? Smartphone : Banknote;

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${payout.state === "Failed" ? "bg-rose-50" : "bg-slate-50"}`}>
                <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
                <div className="font-semibold text-slate-900">{payout.beneficiaryLabel}</div>
                <div className="text-sm text-slate-500">
                    {formatMoney(payout.amount)} • {payout.createdAt}
                </div>
                <div className="text-xs text-slate-400">Fee: {formatMoney(payout.fee)} • ETA: {payout.eta}</div>
            </div>
            <div className="text-right">
                <Pill label={payout.state} tone={toneForStatus(payout.state)} />
                <div className="mt-1 text-xs text-slate-500">{payout.ref}</div>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Withdrawals() {
    const { balances } = useWallet();
    const [tab, setTab] = useState(0);
    const [method, setMethod] = useState<PayoutMethod>("mobile");
    const [amount, setAmount] = useState("");

    const primaryBalance = balances.find((b) => b.currency === "UGX");

    // Mock beneficiaries
    const beneficiaries = useMemo<Beneficiary[]>(
        () => [
            {
                id: "b1",
                label: "MTN Mobile Money",
                type: "mobile",
                currency: "UGX",
                status: "Verified",
                detailsMasked: "****4567",
                cooling: "None",
            },
            {
                id: "b2",
                label: "Airtel Money",
                type: "mobile",
                currency: "UGX",
                status: "Verified",
                detailsMasked: "****8901",
                cooling: "None",
            },
            {
                id: "b3",
                label: "Stanbic Bank",
                type: "bank",
                currency: "UGX",
                status: "Verified",
                detailsMasked: "****3456",
                cooling: "None",
            },
        ],
        []
    );

    // Mock payouts
    const payouts = useMemo<Payout[]>(
        () => [
            {
                id: "p1",
                createdAt: "Today 10:30",
                method: "mobile",
                beneficiaryLabel: "MTN Mobile Money",
                amount: 250000,
                fee: 2500,
                totalDebit: 252500,
                eta: "Instant",
                state: "Paid",
                ref: "PO123456",
            },
            {
                id: "p2",
                createdAt: "Yesterday 15:45",
                method: "bank",
                beneficiaryLabel: "Stanbic Bank",
                amount: 1000000,
                fee: 5000,
                totalDebit: 1005000,
                eta: "1-2 business days",
                state: "Processing",
                ref: "PO123457",
            },
        ],
        []
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Withdraw Funds"
                subtitle={`Available: ${formatMoney(primaryBalance?.available || 0)}`}
            >
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }} variant="fullWidth">
                    <Tab value={0} label="Withdraw" icon={<ArrowUpRight className="h-4 w-4" />} iconPosition="start" />
                    <Tab value={1} label="History" icon={<Clock className="h-4 w-4" />} iconPosition="start" />
                </Tabs>
            </SectionCard>

            {tab === 0 ? (
                <>
                    {/* Payout Methods */}
                    <SectionCard title="Payout Method" subtitle="Choose where to send your money" className="mt-3">
                        <Grid container spacing={2}>
                            {[
                                { id: "mobile", label: "Mobile Money", icon: Smartphone },
                                { id: "bank", label: "Bank Transfer", icon: Building2 },
                                { id: "china", label: "China Settlement", icon: Banknote },
                            ].map((m) => (
                                <Grid item xs={4} key={m.id}>
                                    <button
                                        type="button"
                                        onClick={() => setMethod(m.id as PayoutMethod)}
                                        className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-3 transition ${method === m.id
                                            ? "border-emerald-300 bg-emerald-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                    >
                                        <m.icon className={`h-6 w-6 ${method === m.id ? "text-emerald-600" : "text-slate-600"}`} />
                                        <span className="text-xs font-medium text-slate-700">{m.label}</span>
                                    </button>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>

                    {/* Beneficiaries */}
                    <SectionCard title="Beneficiary" subtitle="Choose where to withdraw to" className="mt-3">
                        <List>
                            {beneficiaries.map((b) => (
                                <BeneficiaryRow
                                    key={b.id}
                                    beneficiary={b}
                                    selected={false}
                                    onClick={() => { }}
                                />
                            ))}
                        </List>
                        <MUIButton variant="outlined" fullWidth sx={{ mt: 2, borderRadius: 3 }}>
                            + Add New Beneficiary
                        </MUIButton>
                    </SectionCard>

                    {/* Amount */}
                    <SectionCard title="Amount" subtitle="How much do you want to withdraw?" className="mt-3">
                        <TextField
                            fullWidth
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography variant="h5" color="text.secondary">
                                            UGX
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                        />
                        <div className="mt-2 flex flex-wrap gap-1">
                            {[50000, 100000, 200000, 500000].map((v) => (
                                <Chip
                                    key={v}
                                    label={formatMoney(v)}
                                    onClick={() => setAmount(v.toString())}
                                    variant="outlined"
                                    sx={{ cursor: "pointer" }}
                                />
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Withdrawal fee</span>
                                <span className="font-medium">{formatMoney(2500)}</span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                                <span className="text-slate-500">Total debit</span>
                                <span className="font-semibold">{formatMoney((parseFloat(amount) || 0) + 2500)}</span>
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-slate-400">
                                <span>ETA</span>
                                <span>{method === "mobile" ? "Instant" : "1-2 business days"}</span>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Action */}
                    <div className="mt-4">
                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            disabled={!amount || parseFloat(amount) <= 0}
                        >
                            Withdraw {formatMoney(parseFloat(amount) || 0)}
                        </Button>
                    </div>
                </>
            ) : (
                <SectionCard title="Payout History" subtitle="Your recent withdrawals" className="mt-3">
                    <div className="space-y-3">
                        {payouts.map((p) => (
                            <PayoutCard key={p.id} payout={p} />
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Button variant="ghost">View All Payouts</Button>
                    </div>
                </SectionCard>
            )}
        </Box>
    );
}
