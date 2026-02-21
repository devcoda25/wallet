import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  CreditCard,
  Download,
  Info,
  LocalAtm,
  Payments,
  ReceiptLong,
  Savings,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Child Funding (Premium)
 * Route: /parent/edupocket/children/:childId/funding
 * Includes:
 * - FundingOverviewCard
 * - OneTimeTopUpForm
 * - AllowanceScheduler (daily/weekly/monthly/term + holiday skip)
 * - AutoTopUpRules (low balance trigger + monthly cap)
 * - FundingSourcesManager (cards/bank/mobile money) + verification required state
 * - FundingHistoryTable + receipts drawer
 * - SplitTopUpModal (multi-child distribution)
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  currency: "UGX" | "USD";
  balance: number;
};

type SourceType = "Wallet" | "Card" | "Bank" | "Mobile Money";

type SourceStatus = "Verified" | "Verification required";

type FundingSource = {
  id: string;
  type: SourceType;
  label: string;
  masked?: string;
  status: SourceStatus;
  isDefault?: boolean;
};

type AllowanceFrequency = "Daily" | "Weekly" | "Monthly" | "Term";

type AllowancePlan = {
  enabled: boolean;
  frequency: AllowanceFrequency;
  amount: number;
  startDate: string; // YYYY-MM-DD
  weeklyDay: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  monthlyDay: number;
  termStart: string;
  termEnd: string;
  skipHolidays: boolean;
};

type AutoTopUpRule = {
  enabled: boolean;
  threshold: number;
  topUpAmount: number;
  monthlyCap: number;
};

type FundingEventType = "Top up" | "Allowance" | "Auto top-up" | "Refund";

type FundingEvent = {
  id: string;
  at: number;
  type: FundingEventType;
  amount: number;
  currency: "UGX" | "USD";
  sourceLabel: string;
  status: "Completed" | "Pending" | "Failed";
  ref: string;
  receipt?: Array<{ label: string; value: string }>;
};

type SplitMode = "Equal" | "Custom";

type SplitDraft = {
  total: number;
  currency: "UGX" | "USD";
  mode: SplitMode;
  allocations: Record<string, number>; // childId -> amount
};

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function csvSafe(v: any) {
  const t = String(v ?? "");
  if (/[",\n]/.test(t)) return `"${t.replaceAll('"', '""')}"`;
  return t;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function useCorporateTheme() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  const theme = useMemo(() => {
    const isDark = mode === "dark";
    const bg = isDark ? "#07110F" : "#F6FBF9";
    const paper = isDark ? alpha("#081A16", 0.92) : "#FFFFFF";
    const textPrimary = isDark ? "#E9FFF7" : EVZ.ink;
    const textSecondary = isDark ? alpha("#E9FFF7", 0.72) : alpha(EVZ.ink, 0.70);

    return createTheme({
      palette: {
        mode,
        primary: { main: EVZ.green },
        secondary: { main: EVZ.orange },
        background: { default: bg, paper },
        text: { primary: textPrimary, secondary: textSecondary },
        divider: isDark ? alpha("#E9FFF7", 0.12) : alpha(EVZ.ink, 0.10),
      },
      shape: { borderRadius: 18 },
      typography: {
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        h5: { fontWeight: 950, letterSpacing: -0.5 },
        h6: { fontWeight: 900, letterSpacing: -0.28 },
        button: { fontWeight: 900, textTransform: "none" },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              border: `1px solid ${isDark ? alpha("#E9FFF7", 0.10) : alpha(EVZ.ink, 0.10)}`,
              backgroundImage:
                "radial-gradient(900px 420px at 10% 0%, rgba(3,205,140,0.12), transparent 60%), radial-gradient(900px 420px at 90% 0%, rgba(3,205,140,0.10), transparent 55%)",
            },
          },
        },
        MuiButton: {
          styleOverrides: { root: { borderRadius: 14, boxShadow: "none" } },
        },
      },
    });
  }, [mode]);

  return { theme, mode, setMode };
}

function AppShell({
  mode,
  onToggleMode,
  childName,
  children,
}: {
  mode: "light" | "dark";
  onToggleMode: () => void;
  childName: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "transparent", backdropFilter: "blur(10px)", borderBottom: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.08)}` }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.25,
            background:
              mode === "dark"
                ? "linear-gradient(180deg, rgba(7,17,15,0.92) 0%, rgba(7,17,15,0.62) 100%)"
                : "linear-gradient(180deg, rgba(246,251,249,0.95) 0%, rgba(246,251,249,0.70) 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(EVZ.green, 0.14),
                  border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                  color: EVZ.green,
                }}
              >
                <Payments fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket - Funding
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {childName}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to overview">
                <IconButton
                  onClick={() => alert("Navigate: /parent/edupocket/children/:childId")}
                  sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}
                >
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Tooltip>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: alpha(EVZ.orange, 0.12),
                  color: EVZ.orange,
                  border: `1px solid ${alpha(EVZ.orange, 0.25)}`,
                  fontWeight: 950,
                }}
              >
                R
              </Avatar>
            </Stack>
          </Stack>
        </Box>
      </AppBar>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 2.2,
          pb: 8,
          background:
            mode === "dark"
              ? "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.16), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.10), transparent 60%)"
              : "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.14), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.08), transparent 60%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX", balance: 68000 },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX", balance: 41000 },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD", balance: 22 },
];

const SEED_SOURCES: FundingSource[] = [
  { id: "src_wallet", type: "Wallet", label: "EVzone Pay Wallet", status: "Verified", isDefault: true },
  { id: "src_card", type: "Card", label: "Visa", masked: "**** 4421", status: "Verification required" },
  { id: "src_mm", type: "Mobile Money", label: "MTN MoMo", masked: "+256 7xx xxx 321", status: "Verified" },
];

const todayIso = new Date().toISOString().slice(0, 10);

const SEED_ALLOWANCE: AllowancePlan = {
  enabled: true,
  frequency: "Weekly",
  amount: 15000,
  startDate: todayIso,
  weeklyDay: "Mon",
  monthlyDay: 1,
  termStart: todayIso,
  termEnd: todayIso,
  skipHolidays: true,
};

const SEED_AUTOTOPUP: AutoTopUpRule = {
  enabled: true,
  threshold: 15000,
  topUpAmount: 30000,
  monthlyCap: 200000,
};

const SEED_HISTORY: FundingEvent[] = [
  {
    id: "h1",
    at: Date.now() - 45 * 60000,
    type: "Top up",
    amount: 20000,
    currency: "UGX",
    sourceLabel: "EVzone Pay Wallet",
    status: "Completed",
    ref: "FND-90121",
    receipt: [
      { label: "Method", value: "Wallet transfer" },
      { label: "Reference", value: "FND-90121" },
      { label: "Status", value: "Completed" },
    ],
  },
  {
    id: "h2",
    at: Date.now() - 2 * 24 * 60 * 60000,
    type: "Allowance",
    amount: 15000,
    currency: "UGX",
    sourceLabel: "Scheduled allowance",
    status: "Completed",
    ref: "FND-90003",
  },
];

export default function EduPocketChildFunding() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const [children, setChildren] = useState<Child[]>(CHILDREN);

  const child = useMemo(() => children.find((c) => c.id === childId) ?? children[0], [children, childId]);

  const [sources, setSources] = useState<FundingSource[]>(SEED_SOURCES);
  const [allowance, setAllowance] = useState<AllowancePlan>(SEED_ALLOWANCE);
  const [autoRule, setAutoRule] = useState<AutoTopUpRule>(SEED_AUTOTOPUP);
  const [history, setHistory] = useState<FundingEvent[]>(SEED_HISTORY);

  const [amount, setAmount] = useState("20000");
  const [sourceId, setSourceId] = useState("src_wallet");

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<SourceType>("Card");
  const [newSourceLabel, setNewSourceLabel] = useState("Visa");
  const [newSourceMasked, setNewSourceMasked] = useState("**** 0000");

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyTargetId, setVerifyTargetId] = useState<string | null>(null);

  const [splitOpen, setSplitOpen] = useState(false);
  const [splitDraft, setSplitDraft] = useState<SplitDraft>(() => {
    const total = 60000;
    const currency = "UGX" as const;
    const allocations: Record<string, number> = {};
    const per = Math.floor(total / children.length);
    for (const c of children) allocations[c.id] = per;
    return { total, currency, mode: "Equal", allocations };
  });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  useEffect(() => {
    // reset split draft when children set changes
    setSplitDraft((p) => {
      const allocations: Record<string, number> = { ...p.allocations };
      for (const c of children) {
        if (allocations[c.id] == null) allocations[c.id] = 0;
      }
      for (const k of Object.keys(allocations)) {
        if (!children.some((c) => c.id === k)) delete allocations[k];
      }
      return { ...p, allocations };
    });
  }, [children]);

  const selectedSource = useMemo(() => sources.find((s) => s.id === sourceId) ?? sources[0], [sources, sourceId]);
  const defaultSource = useMemo(() => sources.find((s) => s.isDefault) ?? sources[0], [sources]);

  const verificationRequired = selectedSource?.status === "Verification required";

  const nextAllowanceDates = useMemo(() => {
    if (!allowance.enabled) return [] as string[];
    const start = allowance.startDate ? new Date(allowance.startDate + "T00:00:00") : new Date();

    const dowMap: Record<AllowancePlan["weeklyDay"], number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

    const out: string[] = [];
    let cur = new Date(Math.max(Date.now(), start.getTime()));

    const push = (d: Date) => out.push(d.toISOString().slice(0, 10));

    for (let i = 0; i < 3; i++) {
      const d = new Date(cur);
      if (allowance.frequency === "Daily") {
        d.setDate(d.getDate() + (i === 0 ? 1 : 1));
        push(d);
        cur = d;
        continue;
      }
      if (allowance.frequency === "Weekly") {
        // next specified weekday
        const target = dowMap[allowance.weeklyDay];
        const day = d.getDay();
        let add = target - day;
        if (add <= 0) add += 7;
        d.setDate(d.getDate() + add);
        push(d);
        cur = d;
        continue;
      }
      if (allowance.frequency === "Monthly") {
        const next = new Date(d);
        next.setMonth(next.getMonth() + 1);
        next.setDate(Math.min(28, Math.max(1, allowance.monthlyDay || 1)));
        push(next);
        cur = next;
        continue;
      }
      // Term: use weekly schedule inside term as a demo
      const next = new Date(d);
      next.setDate(next.getDate() + 7);
      push(next);
      cur = next;
    }

    return out;
  }, [allowance]);

  const sendTopUp = () => {
    const amt = Math.max(0, parseInt((amount || "").replace(/[^0-9]/g, ""), 10) || 0);
    if (amt <= 0) return toast("Enter a valid amount", "warning");

    if (verificationRequired) {
      toast("Funding source verification required", "warning");
      setVerifyTargetId(selectedSource?.id ?? null);
      setVerifyDialogOpen(true);
      return;
    }

    // apply
    setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, balance: c.balance + amt } : c)));

    const ev: FundingEvent = {
      id: `h_${Math.floor(100000 + Math.random() * 899999)}`,
      at: Date.now(),
      type: "Top up",
      amount: amt,
      currency: child.currency,
      sourceLabel: selectedSource?.label ?? "Source",
      status: "Completed",
      ref: `FND-${Math.floor(10000 + Math.random() * 89999)}`,
      receipt: [
        { label: "Child", value: child.name },
        { label: "Source", value: selectedSource?.label ?? "" },
        { label: "Reference", value: "Generated" },
        { label: "Status", value: "Completed" },
      ],
    };

    setHistory((p) => [ev, ...p]);
    toast("Top up sent", "success");
  };

  const openReceipt = (id: string) => {
    setSelectedReceiptId(id);
    setReceiptOpen(true);
  };

  const selectedReceipt = useMemo(() => history.find((h) => h.id === selectedReceiptId) ?? null, [history, selectedReceiptId]);

  const exportHistory = () => {
    const rows: string[] = [];
    rows.push(["time", "type", "amount", "currency", "source", "status", "ref"].join(","));
    for (const h of history) {
      rows.push([new Date(h.at).toISOString(), h.type, String(h.amount), h.currency, h.sourceLabel, h.status, h.ref].map(csvSafe).join(","));
    }
    downloadText(`edupocket_child_${childId}_funding_history_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  const setDefaultSource = (id: string) => {
    setSources((p) => p.map((s) => ({ ...s, isDefault: s.id === id })));
    toast("Default source updated", "success");
  };

  const openVerify = (id: string) => {
    setVerifyTargetId(id);
    setVerifyDialogOpen(true);
  };

  const verifyNow = () => {
    if (!verifyTargetId) return;
    setSources((p) => p.map((s) => (s.id === verifyTargetId ? { ...s, status: "Verified" } : s)));
    toast("Source verified", "success");
    setVerifyDialogOpen(false);
    setVerifyTargetId(null);
  };

  const addSource = () => {
    const id = `src_${Math.floor(1000 + Math.random() * 8999)}`;
    const src: FundingSource = {
      id,
      type: newSourceType,
      label: newSourceLabel,
      masked: newSourceMasked,
      status: "Verification required",
      isDefault: false,
    };
    setSources((p) => [src, ...p]);
    setAddSourceOpen(false);
    toast("Source added. Verification required.", "warning");
  };

  const openSplit = () => {
    const total = 60000;
    const allocations: Record<string, number> = {};
    const per = Math.floor(total / children.length);
    for (const c of children) allocations[c.id] = per;
    setSplitDraft({ total, currency: child.currency, mode: "Equal", allocations });
    setSplitOpen(true);
  };

  const applySplit = () => {
    const totalAllocated = Object.values(splitDraft.allocations).reduce((a, b) => a + b, 0);
    if (totalAllocated !== splitDraft.total) {
      return toast("Allocations must equal total", "warning");
    }

    // enforce verification
    if (verificationRequired) {
      toast("Funding source verification required", "warning");
      setVerifyTargetId(selectedSource?.id ?? null);
      setVerifyDialogOpen(true);
      return;
    }

    setChildren((prev) =>
      prev.map((c) => {
        const add = splitDraft.allocations[c.id] ?? 0;
        return add > 0 ? { ...c, balance: c.balance + add } : c;
      })
    );

    setHistory((p) => [
      {
        id: `h_${Math.floor(100000 + Math.random() * 899999)}`,
        at: Date.now(),
        type: "Top up",
        amount: splitDraft.total,
        currency: splitDraft.currency,
        sourceLabel: `${selectedSource?.label ?? "Source"} (split)`,
        status: "Completed",
        ref: `FND-${Math.floor(10000 + Math.random() * 89999)}`,
      },
      ...p,
    ]);

    setSplitOpen(false);
    toast("Split top up sent", "success");
  };

  const applyAllowance = () => {
    toast("Allowance schedule saved", "success");
  };

  const applyAutoTopUp = () => {
    toast("Auto top-up rule saved", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} childName={child.name}>
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                  <Box>
                    <Typography variant="h5">Funding</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Top ups, allowances, auto top-up rules and receipts.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {children.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} - {c.school}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportHistory}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Savings />}
                      onClick={openSplit}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Split top up
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Overview */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={6}>
                    <Card component={motion.div} whileHover={{ y: -2 }}>
                      <CardContent>
                        <Typography variant="h6">Funding overview</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Current wallet balance and funding posture.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Balance
                            </Typography>
                            <Typography variant="h5">{fmtMoney(child.balance, child.currency)}</Typography>
                          </Box>
                          <Chip
                            size="small"
                            icon={<CreditCard fontSize="small" />}
                            label={`Default source: ${defaultSource?.label ?? "-"}`}
                            sx={{
                              fontWeight: 900,
                              bgcolor: alpha(EVZ.green, 0.10),
                              color: EVZ.green,
                              border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                            }}
                          />
                        </Stack>

                        <Divider sx={{ my: 1.4 }} />

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                          <Card variant="outlined" sx={{ flex: 1, bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Typography variant="caption" color="text.secondary">
                                Allowance
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                                {allowance.enabled ? `${fmtMoney(allowance.amount, child.currency)} ${allowance.frequency}` : "Off"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Next: {allowance.enabled ? nextAllowanceDates[0] ?? "-" : "-"}
                              </Typography>
                            </CardContent>
                          </Card>
                          <Card variant="outlined" sx={{ flex: 1, bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Typography variant="caption" color="text.secondary">
                                Auto top-up
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                                {autoRule.enabled ? "On" : "Off"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Trigger: &lt; {fmtMoney(autoRule.threshold, child.currency)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Stack>

                        <Divider sx={{ my: 1.4 }} />

                        <Alert severity="info" icon={<Info />}>
                          Funding actions are logged and receipts are available for downloads.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Card component={motion.div} whileHover={{ y: -2 }}>
                      <CardContent>
                        <Typography variant="h6">One-time top up</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add funds instantly using a verified source.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {verificationRequired ? (
                          <Alert
                            severity="warning"
                            icon={<WarningAmber />}
                            action={
                              <Button size="small" onClick={() => openVerify(selectedSource.id)}>
                                Verify
                              </Button>
                            }
                            sx={{ mb: 1.6 }}
                          >
                            Funding source verification required for {selectedSource.label}.
                          </Alert>
                        ) : null}

                        <Stack spacing={1.4}>
                          <TextField
                            label="Amount"
                            value={amount}
                            onChange={(e) => setAmount((e.target.value || "").replace(/[^0-9]/g, ""))}
                            InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                          />

                          <TextField select label="Source" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                            {sources.map((s) => (
                              <MenuItem key={s.id} value={s.id}>
                                {s.label}{s.masked ? ` (${s.masked})` : ""} - {s.status}
                              </MenuItem>
                            ))}
                          </TextField>

                          <Button
                            variant="contained"
                            startIcon={<LocalAtm />}
                            onClick={sendTopUp}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Send top up
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setAddSourceOpen(true)}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                            fullWidth
                          >
                            Add funding source
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Allowance + auto top-up */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Allowance scheduler</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Schedule pocket money by day, week, month, or term.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.4}>
                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                    Allowance enabled
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Turn off if you prefer manual top-ups.
                                  </Typography>
                                </Box>
                                <Switch checked={allowance.enabled} onChange={(e) => setAllowance((p) => ({ ...p, enabled: e.target.checked }))} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                select
                                label="Frequency"
                                value={allowance.frequency}
                                onChange={(e) => setAllowance((p) => ({ ...p, frequency: e.target.value as any }))}
                                fullWidth
                              >
                                {(["Daily", "Weekly", "Monthly", "Term"] as const).map((f) => (
                                  <MenuItem key={f} value={f}>
                                    {f}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Amount"
                                value={allowance.amount}
                                onChange={(e) => setAllowance((p) => ({ ...p, amount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                                InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Start date"
                                type="date"
                                value={allowance.startDate}
                                onChange={(e) => setAllowance((p) => ({ ...p, startDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                              />
                            </Grid>
                          </Grid>

                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                select
                                label="Weekly day"
                                value={allowance.weeklyDay}
                                onChange={(e) => setAllowance((p) => ({ ...p, weeklyDay: e.target.value as any }))}
                                disabled={allowance.frequency !== "Weekly" && allowance.frequency !== "Term"}
                                fullWidth
                              >
                                {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => (
                                  <MenuItem key={d} value={d}>
                                    {d}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Monthly day"
                                type="number"
                                value={allowance.monthlyDay}
                                onChange={(e) => setAllowance((p) => ({ ...p, monthlyDay: Math.min(28, Math.max(1, parseInt(e.target.value || "1", 10) || 1)) }))}
                                disabled={allowance.frequency !== "Monthly"}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), height: "100%" }}>
                                <CardContent>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        Skip holidays
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Use holiday calendar rules.
                                      </Typography>
                                    </Box>
                                    <Switch checked={allowance.skipHolidays} onChange={(e) => setAllowance((p) => ({ ...p, skipHolidays: e.target.checked }))} />
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>

                          {allowance.frequency === "Term" ? (
                            <Grid container spacing={1.2}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Term start"
                                  type="date"
                                  value={allowance.termStart}
                                  onChange={(e) => setAllowance((p) => ({ ...p, termStart: e.target.value }))}
                                  InputLabelProps={{ shrink: true }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Term end"
                                  type="date"
                                  value={allowance.termEnd}
                                  onChange={(e) => setAllowance((p) => ({ ...p, termEnd: e.target.value }))}
                                  InputLabelProps={{ shrink: true }}
                                  fullWidth
                                />
                              </Grid>
                            </Grid>
                          ) : null}

                          <Card variant="outlined" sx={{ bgcolor: alpha(EVZ.green, 0.06), borderColor: alpha(EVZ.green, 0.22) }}>
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                Next runs
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Preview next 3 allowance dates.
                              </Typography>
                              <Divider sx={{ my: 1.2 }} />
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {nextAllowanceDates.length ? (
                                  nextAllowanceDates.map((d) => (
                                    <Chip key={d} size="small" label={d} sx={{ fontWeight: 900 }} />
                                  ))
                                ) : (
                                  <Chip size="small" label="Allowance off" sx={{ fontWeight: 900 }} />
                                )}
                              </Stack>
                            </CardContent>
                          </Card>

                          <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={applyAllowance}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Save allowance
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Auto top-up rules</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Keep balance above a threshold.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.4}>
                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                    Auto top-up enabled
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Triggers when balance is low.
                                  </Typography>
                                </Box>
                                <Switch checked={autoRule.enabled} onChange={(e) => setAutoRule((p) => ({ ...p, enabled: e.target.checked }))} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <TextField
                            label="Trigger below"
                            type="number"
                            value={autoRule.threshold}
                            onChange={(e) => setAutoRule((p) => ({ ...p, threshold: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                            InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                          />

                          <TextField
                            label="Top-up amount"
                            type="number"
                            value={autoRule.topUpAmount}
                            onChange={(e) => setAutoRule((p) => ({ ...p, topUpAmount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                            InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                          />

                          <TextField
                            label="Monthly cap"
                            type="number"
                            value={autoRule.monthlyCap}
                            onChange={(e) => setAutoRule((p) => ({ ...p, monthlyCap: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                            InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                          />

                          <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={applyAutoTopUp}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Save auto top-up
                          </Button>

                          <Alert severity="info" icon={<Info />}>
                            Auto top-up uses the selected default source and respects monthly cap.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Funding sources</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage cards, banks and mobile money.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          {sources.map((s) => (
                            <Card key={s.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 2.5,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: alpha(EVZ.green, 0.12),
                                        color: EVZ.green,
                                        border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                      }}
                                    >
                                      <CreditCard fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        {s.label}{s.masked ? ` (${s.masked})` : ""}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {s.type} • {s.status}
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {s.isDefault ? (
                                      <Chip
                                        size="small"
                                        label="Default"
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha(EVZ.green, 0.10),
                                          color: EVZ.green,
                                          border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                        }}
                                      />
                                    ) : (
                                      <Button size="small" onClick={() => setDefaultSource(s.id)}>
                                        Set default
                                      </Button>
                                    )}

                                    {s.status === "Verification required" ? (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => openVerify(s.id)}
                                        sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                      >
                                        Verify
                                      </Button>
                                    ) : null}
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}

                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setAddSourceOpen(true)}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                            fullWidth
                          >
                            Add source
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* History */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">Funding history</Typography>
                    <Typography variant="body2" color="text.secondary">
                      All top-ups and scheduled transfers with receipts.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    {history.length === 0 ? (
                      <Alert severity="info" icon={<Info />}>
                        No funding history yet.
                      </Alert>
                    ) : (
                      <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 950 }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Type</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Source</TableCell>
                              <TableCell sx={{ fontWeight: 950, textAlign: "right" }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Ref</TableCell>
                              <TableCell sx={{ fontWeight: 950 }} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {history
                              .slice()
                              .sort((a, b) => b.at - a.at)
                              .map((h) => (
                                <TableRow key={h.id} hover>
                                  <TableCell>{new Date(h.at).toLocaleString()}</TableCell>
                                  <TableCell>{h.type}</TableCell>
                                  <TableCell>{h.sourceLabel}</TableCell>
                                  <TableCell sx={{ textAlign: "right", fontWeight: 950 }}>
                                    {fmtMoney(h.amount, h.currency)}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={h.status}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(h.status === "Completed" ? EVZ.green : EVZ.orange, 0.12),
                                        color: h.status === "Completed" ? EVZ.green : EVZ.orange,
                                        border: `1px solid ${alpha(h.status === "Completed" ? EVZ.green : EVZ.orange, 0.22)}`,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{h.ref}</TableCell>
                                  <TableCell>
                                    <Button size="small" startIcon={<ReceiptLong />} onClick={() => openReceipt(h.id)}>
                                      Receipt
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
                    <Button startIcon={<Download />} onClick={exportHistory}>
                      Export history
                    </Button>
                  </CardActions>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Receipt drawer */}
      <Drawer anchor="right" open={receiptOpen} onClose={() => setReceiptOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 540 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Receipt</Typography>
              <Typography variant="body2" color="text.secondary">
                Details and references.
              </Typography>
            </Stack>
            <IconButton onClick={() => setReceiptOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {selectedReceipt ? (
            <Stack spacing={1.2}>
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                    {selectedReceipt.type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(selectedReceipt.at).toLocaleString()} • {selectedReceipt.ref}
                  </Typography>
                  <Divider sx={{ my: 1.2 }} />
                  <Typography variant="h6">{fmtMoney(selectedReceipt.amount, selectedReceipt.currency)}</Typography>
                  <Chip
                    size="small"
                    label={selectedReceipt.status}
                    sx={{
                      mt: 1,
                      fontWeight: 900,
                      bgcolor: alpha(selectedReceipt.status === "Completed" ? EVZ.green : EVZ.orange, 0.12),
                      color: selectedReceipt.status === "Completed" ? EVZ.green : EVZ.orange,
                      border: `1px solid ${alpha(selectedReceipt.status === "Completed" ? EVZ.green : EVZ.orange, 0.22)}`,
                    }}
                  />
                </CardContent>
              </Card>

              {selectedReceipt.receipt ? (
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Receipt lines
                    </Typography>
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      {selectedReceipt.receipt.map((l, idx) => (
                        <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            {l.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900 }}>
                            {l.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  No line items were recorded for this receipt.
                </Alert>
              )}

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  const text = JSON.stringify(selectedReceipt, null, 2);
                  downloadText(`receipt_${selectedReceipt.ref}.json`, text);
                  toast("Receipt downloaded", "success");
                }}
                sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
              >
                Download receipt
              </Button>
            </Stack>
          ) : (
            <Alert severity="info" icon={<Info />}>
              Select a receipt.
            </Alert>
          )}
        </Box>
      </Drawer>

      {/* Add source dialog */}
      <Dialog open={addSourceOpen} onClose={() => setAddSourceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Add funding source</Typography>
              <Typography variant="body2" color="text.secondary">
                New sources require verification.
              </Typography>
            </Stack>
            <IconButton onClick={() => setAddSourceOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.6} sx={{ mt: 1 }}>
            <TextField select label="Type" value={newSourceType} onChange={(e) => setNewSourceType(e.target.value as any)}>
              {(["Wallet", "Card", "Bank", "Mobile Money"] as const).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Label" value={newSourceLabel} onChange={(e) => setNewSourceLabel(e.target.value)} />
            <TextField label="Masked / Identifier" value={newSourceMasked} onChange={(e) => setNewSourceMasked(e.target.value)} />
            <Alert severity="info" icon={<Info />}>
              Verification may require OTP, small charge verification, or bank linkage.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSourceOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={addSource}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Verify funding source</Typography>
              <Typography variant="body2" color="text.secondary">
                Required before using this source.
              </Typography>
            </Stack>
            <IconButton onClick={() => setVerifyDialogOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <Alert severity="warning" icon={<WarningAmber />}>
              This is a simulated verification flow.
            </Alert>
            <TextField label="OTP" placeholder="Enter OTP" />
            <TextField label="Note" placeholder="Optional note" />
            <Alert severity="info" icon={<Info />}>
              In production: verify via OTP, bank linkage, or wallet KYC.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={verifyNow}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>

      {/* Split top up dialog */}
      <Dialog open={splitOpen} onClose={() => setSplitOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Split top up</Typography>
              <Typography variant="body2" color="text.secondary">
                Distribute one payment to multiple children.
              </Typography>
            </Stack>
            <IconButton onClick={() => setSplitOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.6} sx={{ mt: 1 }}>
            <Grid container spacing={1.2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Total"
                  type="number"
                  value={splitDraft.total}
                  onChange={(e) => {
                    const total = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                    setSplitDraft((p) => ({ ...p, total }));
                  }}
                  InputProps={{ startAdornment: <InputAdornment position="start">{splitDraft.currency}</InputAdornment> }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select label="Mode" value={splitDraft.mode} onChange={(e) => {
                  const modeSel = e.target.value as SplitMode;
                  setSplitDraft((p) => {
                    if (modeSel === "Equal") {
                      const per = Math.floor(p.total / children.length);
                      const allocations: Record<string, number> = {};
                      for (const c of children) allocations[c.id] = per;
                      return { ...p, mode: modeSel, allocations };
                    }
                    return { ...p, mode: modeSel };
                  });
                }} fullWidth>
                  <MenuItem value="Equal">Equal</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select label="Source" value={sourceId} onChange={(e) => setSourceId(e.target.value)} fullWidth>
                  {sources.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.label} - {s.status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              Allocations
            </Typography>

            <Grid container spacing={1.2}>
              {children.map((c) => (
                <Grid key={c.id} item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.school} • {c.className}
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <TextField
                        label="Amount"
                        type="number"
                        value={splitDraft.allocations[c.id] ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                          setSplitDraft((p) => ({ ...p, allocations: { ...p.allocations, [c.id]: val } }));
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start">{splitDraft.currency}</InputAdornment> }}
                        disabled={splitDraft.mode === "Equal"}
                        fullWidth
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert severity="info" icon={<Info />}>
              Total allocations must equal the total amount.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Savings />}
            onClick={applySplit}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Send split top up
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
