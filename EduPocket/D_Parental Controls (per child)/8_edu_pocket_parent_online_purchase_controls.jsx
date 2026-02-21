import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
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
  ContentCopy,
  CreditCard,
  Download,
  Info,
  Lock,
  Refresh,
  Shield,
  ShoppingBag,
  Store,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Online Purchase Controls (Premium)
 * Route: /parent/edupocket/children/:childId/controls/online
 * Includes:
 * - OnlinePaymentsToggle
 * - VirtualCardPanel (one-time, merchant-locked, category locked)
 * - SubscriptionControls (allow recurring, approval required)
 * - State: virtual card provisioning status
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string; currency: "UGX" | "USD" };

type ProvisionStatus = "Not provisioned" | "Provisioning" | "Active" | "Failed" | "Suspended";

type VirtualCardMode = "One-time" | "Merchant-locked" | "Category-locked";

type Category = "Food" | "Books" | "Transport" | "Fees" | "Other";

type VirtualCard = {
  id: string;
  mode: VirtualCardMode;
  masked: string;
  last4: string;
  merchant?: string;
  category?: Category;
  status: "Active" | "Suspended";
  limit: number;
  expires: string; // YYYY-MM
};

type Sub = {
  id: string;
  merchant: string;
  amount: number;
  currency: "UGX" | "USD";
  status: "Active" | "Paused" | "Cancelled";
  nextBill: string; // ISO date
  requiresApproval: boolean;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

const MERCHANTS = ["Campus Bookshop", "School Canteen", "Uniform Store", "Starlight School", "Online Learning Hub"];
const CATEGORIES: Category[] = ["Food", "Books", "Transport", "Fees", "Other"];

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
          styleOverrides: {
            root: { borderRadius: 14, boxShadow: "none" },
          },
        },
      },
    });
  }, [mode]);

  return { theme, mode, setMode };
}

function AppShell({
  mode,
  onToggleMode,
  title,
  subtitle,
  children,
}: {
  mode: "light" | "dark";
  onToggleMode: () => void;
  title: string;
  subtitle: string;
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
                <CreditCard fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  {title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to Controls Home">
                <IconButton
                  onClick={() => alert("Navigate: /parent/edupocket/children/:childId/controls")}
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

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

function randDigits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function makeMasked(last4: string) {
  return `**** **** **** ${last4}`;
}

function safeCopy(text: string, onOk: () => void, onFail: () => void) {
  navigator.clipboard
    .writeText(text)
    .then(onOk)
    .catch(onFail);
}

export default function EduPocketOnlinePurchaseControls() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [virtualCardSupported, setVirtualCardSupported] = useState(true);
  const [provisionStatus, setProvisionStatus] = useState<ProvisionStatus>("Not provisioned");
  const [simulateProvisionFail, setSimulateProvisionFail] = useState(false);

  const [revealSensitive, setRevealSensitive] = useState(false);
  const [activeCards, setActiveCards] = useState<VirtualCard[]>([]);

  const [createMode, setCreateMode] = useState<VirtualCardMode>("One-time");
  const [draftLimit, setDraftLimit] = useState(10000);
  const [draftMerchant, setDraftMerchant] = useState(MERCHANTS[0]);
  const [draftCategory, setDraftCategory] = useState<Category>("Books");

  const [allowRecurring, setAllowRecurring] = useState(false);
  const [recurringRequireApproval, setRecurringRequireApproval] = useState(true);

  const [subs, setSubs] = useState<Sub[]>([
    { id: "s1", merchant: "Online Learning Hub", amount: 10, currency: "USD", status: "Active", nextBill: "2026-03-01", requiresApproval: true },
    { id: "s2", merchant: "Starlight School", amount: 50000, currency: "UGX", status: "Paused", nextBill: "2026-02-25", requiresApproval: true },
  ]);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  // Provisioning simulation
  useEffect(() => {
    if (provisionStatus !== "Provisioning") return;
    const t = setTimeout(() => {
      if (simulateProvisionFail) {
        setProvisionStatus("Failed");
        toast("Virtual card provisioning failed", "warning");
      } else {
        setProvisionStatus("Active");
        toast("Virtual card is ready", "success");
      }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provisionStatus]);

  useEffect(() => {
    // reset per child for demo
    setOnlineEnabled(childId === "c_1");
    setVirtualCardSupported(true);
    setProvisionStatus(childId === "c_1" ? "Active" : "Not provisioned");
    setActiveCards(
      childId === "c_1"
        ? [
            { id: "vc1", mode: "Merchant-locked", masked: makeMasked("4421"), last4: "4421", merchant: "Campus Bookshop", status: "Active", limit: 20000, expires: "2026-12" },
            { id: "vc2", mode: "One-time", masked: makeMasked("0193"), last4: "0193", status: "Suspended", limit: 10000, expires: "2026-02" },
          ]
        : []
    );
    setAllowRecurring(childId === "c_1");
    setRecurringRequireApproval(true);
  }, [childId]);

  const canUseCardPanel = onlineEnabled && virtualCardSupported;

  const statusTone = useMemo(() => {
    if (provisionStatus === "Active") return EVZ.green;
    if (provisionStatus === "Provisioning") return EVZ.orange;
    if (provisionStatus === "Failed") return EVZ.orange;
    if (provisionStatus === "Suspended") return EVZ.orange;
    return alpha(EVZ.ink, 0.7);
  }, [provisionStatus]);

  const provision = () => {
    if (!virtualCardSupported) return toast("Virtual card not supported", "warning");
    if (!onlineEnabled) return toast("Enable online payments first", "warning");
    setProvisionStatus("Provisioning");
    toast("Provisioning virtual card...", "info");
  };

  const retryProvision = () => {
    setProvisionStatus("Provisioning");
    toast("Retrying provisioning...", "info");
  };

  const suspendAll = () => {
    setProvisionStatus("Suspended");
    setActiveCards((p) => p.map((c) => ({ ...c, status: "Suspended" })));
    toast("Virtual cards suspended", "warning");
  };

  const resumeAll = () => {
    setProvisionStatus("Active");
    setActiveCards((p) => p.map((c) => ({ ...c, status: "Active" })));
    toast("Virtual cards resumed", "success");
  };

  const createCard = () => {
    if (!canUseCardPanel) {
      return toast("Enable online payments and provision virtual card first", "warning");
    }
    if (provisionStatus !== "Active") {
      return toast("Virtual card is not ready", "warning");
    }

    const last4 = randDigits(4);
    const expires = `${new Date().getFullYear() + 1}-12`;

    const card: VirtualCard = {
      id: `vc_${Math.floor(100000 + Math.random() * 899999)}`,
      mode: createMode,
      masked: makeMasked(last4),
      last4,
      merchant: createMode === "Merchant-locked" ? draftMerchant : undefined,
      category: createMode === "Category-locked" ? draftCategory : undefined,
      status: "Active",
      limit: draftLimit,
      expires,
    };

    setActiveCards((p) => [card, ...p]);
    toast("Virtual card created", "success");
  };

  const toggleCard = (id: string) => {
    setActiveCards((p) =>
      p.map((c) => (c.id === id ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" } : c))
    );
  };

  const deleteCard = (id: string) => {
    setActiveCards((p) => p.filter((c) => c.id !== id));
    toast("Card removed", "info");
  };

  const copyCard = (last4: string) => {
    const full = `4111 1111 1111 ${last4}`; // demo only
    safeCopy(
      full,
      () => toast("Card number copied", "success"),
      () => toast("Could not copy", "warning")
    );
  };

  const updateSub = (id: string, patch: Partial<Sub>) => {
    setSubs((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const exportSettings = () => {
    const rows: string[] = [];
    rows.push(["child", "onlineEnabled", "virtualCardSupported", "provisionStatus", "allowRecurring", "recurringApproval"].join(","));
    rows.push([
      child.name,
      String(onlineEnabled),
      String(virtualCardSupported),
      provisionStatus,
      String(allowRecurring),
      String(recurringRequireApproval),
    ].join(","));
    rows.push("");
    rows.push(["cards", "count"].join(","));
    rows.push(["cards", String(activeCards.length)].join(","));
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edupocket_online_${child.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export ready", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        title="EduPocket"
        subtitle="Online purchase controls"
      >
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Online purchase controls</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage online payments, virtual cards and subscriptions.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 280 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} • {c.school}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportSettings}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => toast("Saved", "success")}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Online payments toggle */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.6,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(EVZ.green, 0.12),
                            color: EVZ.green,
                            border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                          }}
                        >
                          <Lock fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                            Online payments
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            If off, all online purchases will be blocked.
                          </Typography>
                        </Box>
                      </Stack>

                      <Switch checked={onlineEnabled} onChange={(e) => setOnlineEnabled(e.target.checked)} />
                    </Stack>

                    <Divider sx={{ my: 1.2 }} />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Child: <b>{child.name}</b> • {child.school} • {child.className}
                        {child.stream ? ` • ${child.stream}` : ""}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          icon={<VerifiedUser fontSize="small" />}
                          label={onlineEnabled ? "Enabled" : "Disabled"}
                          sx={{
                            fontWeight: 900,
                            bgcolor: alpha(onlineEnabled ? EVZ.green : EVZ.orange, 0.10),
                            color: onlineEnabled ? EVZ.green : EVZ.orange,
                            border: `1px solid ${alpha(onlineEnabled ? EVZ.green : EVZ.orange, 0.22)}`,
                          }}
                        />
                        <Card
                          variant="outlined"
                          sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                              Virtual card supported
                            </Typography>
                            <Switch size="small" checked={virtualCardSupported} onChange={(e) => setVirtualCardSupported(e.target.checked)} />
                          </Stack>
                        </Card>
                      </Stack>
                    </Stack>

                    {!onlineEnabled ? (
                      <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                        Online purchases are currently blocked.
                      </Alert>
                    ) : null}
                    {!virtualCardSupported ? (
                      <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
                        Virtual cards are not supported on this wallet. You can still allow online payments via approved merchants.
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>

                <Grid container spacing={2.2}>
                  {/* Virtual card panel */}
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Virtual card</Typography>
                            <Typography variant="body2" color="text.secondary">
                              One-time, merchant-locked and category-locked options.
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              label={provisionStatus}
                              sx={{
                                fontWeight: 900,
                                bgcolor: alpha(statusTone, 0.12),
                                color: statusTone,
                                border: `1px solid ${alpha(statusTone, 0.22)}`,
                              }}
                            />
                            <Card
                              variant="outlined"
                              sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                  Sim fail
                                </Typography>
                                <Switch size="small" checked={simulateProvisionFail} onChange={(e) => setSimulateProvisionFail(e.target.checked)} />
                              </Stack>
                            </Card>
                            {provisionStatus === "Not provisioned" ? (
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={provision}
                                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                disabled={!canUseCardPanel}
                              >
                                Provision
                              </Button>
                            ) : null}
                            {provisionStatus === "Failed" ? (
                              <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={retryProvision}
                                sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                              >
                                Retry
                              </Button>
                            ) : null}
                            {provisionStatus === "Active" ? (
                              <Button
                                variant="outlined"
                                startIcon={<Lock />}
                                onClick={suspendAll}
                                sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                              >
                                Suspend
                              </Button>
                            ) : null}
                            {provisionStatus === "Suspended" ? (
                              <Button
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={resumeAll}
                                sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                              >
                                Resume
                              </Button>
                            ) : null}
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        {!virtualCardSupported ? (
                          <Alert severity="info" icon={<Info />}>
                            Virtual cards are not supported for this child wallet.
                          </Alert>
                        ) : provisionStatus === "Not provisioned" ? (
                          <Alert severity="info" icon={<Info />}>
                            Provision a virtual card to create card tokens.
                          </Alert>
                        ) : provisionStatus === "Provisioning" ? (
                          <Alert severity="warning" icon={<WarningAmber />}>
                            Provisioning in progress...
                          </Alert>
                        ) : null}

                        <Grid container spacing={1.6} sx={{ mt: 0.2 }}>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  Create card
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Choose a mode and limit.
                                </Typography>

                                <Divider sx={{ my: 1.2 }} />

                                <Stack spacing={1.2}>
                                  <TextField select label="Mode" value={createMode} onChange={(e) => setCreateMode(e.target.value as any)}>
                                    <MenuItem value="One-time">One-time</MenuItem>
                                    <MenuItem value="Merchant-locked">Merchant-locked</MenuItem>
                                    <MenuItem value="Category-locked">Category-locked</MenuItem>
                                  </TextField>

                                  {createMode === "Merchant-locked" ? (
                                    <TextField select label="Merchant" value={draftMerchant} onChange={(e) => setDraftMerchant(e.target.value)}>
                                      {MERCHANTS.map((m) => (
                                        <MenuItem key={m} value={m}>
                                          {m}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  ) : null}

                                  {createMode === "Category-locked" ? (
                                    <TextField select label="Category" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value as any)}>
                                      {CATEGORIES.map((c) => (
                                        <MenuItem key={c} value={c}>
                                          {c}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  ) : null}

                                  <TextField
                                    label="Limit"
                                    type="number"
                                    value={draftLimit}
                                    onChange={(e) => setDraftLimit(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
                                    InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                  />

                                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                    <CardContent>
                                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                            Reveal sensitive
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Shows demo full card values.
                                          </Typography>
                                        </Box>
                                        <Switch checked={revealSensitive} onChange={(e) => setRevealSensitive(e.target.checked)} />
                                      </Stack>
                                    </CardContent>
                                  </Card>

                                  <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={createCard}
                                    disabled={!canUseCardPanel || provisionStatus !== "Active"}
                                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                                    fullWidth
                                  >
                                    Create card
                                  </Button>

                                  {!onlineEnabled ? (
                                    <Alert severity="warning" icon={<WarningAmber />}>
                                      Enable online payments to use virtual cards.
                                    </Alert>
                                  ) : null}
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  Active cards
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Manage existing tokens.
                                </Typography>

                                <Divider sx={{ my: 1.2 }} />

                                {activeCards.length === 0 ? (
                                  <Alert severity="info" icon={<Info />}>
                                    No virtual cards created.
                                  </Alert>
                                ) : (
                                  <Stack spacing={1.2}>
                                    {activeCards.map((c) => (
                                      <Card
                                        key={c.id}
                                        variant="outlined"
                                        component={motion.div}
                                        whileHover={{ y: -2 }}
                                        sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}
                                      >
                                        <CardContent>
                                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                              <Box
                                                sx={{
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 2.5,
                                                  display: "grid",
                                                  placeItems: "center",
                                                  bgcolor: alpha(c.status === "Active" ? EVZ.green : EVZ.orange, 0.12),
                                                  color: c.status === "Active" ? EVZ.green : EVZ.orange,
                                                  border: `1px solid ${alpha(c.status === "Active" ? EVZ.green : EVZ.orange, 0.22)}`,
                                                }}
                                              >
                                                <CreditCard fontSize="small" />
                                              </Box>
                                              <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                                  {c.mode}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                  {c.masked} • Expires {c.expires}
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.6 }}>
                                                  {c.merchant ? (
                                                    <Chip size="small" icon={<Store fontSize="small" />} label={c.merchant} sx={{ fontWeight: 900 }} />
                                                  ) : null}
                                                  {c.category ? (
                                                    <Chip size="small" icon={<ShoppingBag fontSize="small" />} label={c.category} sx={{ fontWeight: 900 }} />
                                                  ) : null}
                                                  <Chip size="small" label={`Limit: ${fmtMoney(c.limit, child.currency)}`} sx={{ fontWeight: 900 }} />
                                                </Stack>
                                              </Box>
                                            </Stack>

                                            <Chip
                                              size="small"
                                              label={c.status}
                                              sx={{
                                                fontWeight: 900,
                                                bgcolor: alpha(c.status === "Active" ? EVZ.green : EVZ.orange, 0.12),
                                                color: c.status === "Active" ? EVZ.green : EVZ.orange,
                                                border: `1px solid ${alpha(c.status === "Active" ? EVZ.green : EVZ.orange, 0.22)}`,
                                              }}
                                            />
                                          </Stack>

                                          <Divider sx={{ my: 1.2 }} />

                                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              startIcon={<Lock />}
                                              onClick={() => toggleCard(c.id)}
                                              sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                            >
                                              {c.status === "Active" ? "Suspend" : "Resume"}
                                            </Button>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              startIcon={<Close />}
                                              onClick={() => deleteCard(c.id)}
                                              sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                            >
                                              Remove
                                            </Button>
                                          </Stack>

                                          <Divider sx={{ my: 1.2 }} />

                                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              startIcon={<ContentCopy />}
                                              onClick={() => copyCard(c.last4)}
                                              sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                              disabled={!revealSensitive}
                                            >
                                              Copy full number
                                            </Button>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              startIcon={<Info />}
                                              onClick={() => toast("Open card audit", "info")}
                                              sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                            >
                                              Audit
                                            </Button>
                                          </Stack>

                                          {!revealSensitive ? (
                                            <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
                                              Full card number is hidden. Enable “Reveal sensitive” to copy (demo).
                                            </Alert>
                                          ) : null}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Stack>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Virtual cards are controlled by parent rules. Merchants still see the EduPocket verification step in person.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Subscription controls */}
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Subscriptions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Control recurring payments and approvals.
                        </Typography>

                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  Allow recurring
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  If off, all subscriptions are blocked.
                                </Typography>
                              </Box>
                              <Switch checked={allowRecurring} onChange={(e) => setAllowRecurring(e.target.checked)} />
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  Approval required
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Require approval for recurring charges.
                                </Typography>
                              </Box>
                              <Switch
                                checked={recurringRequireApproval}
                                onChange={(e) => setRecurringRequireApproval(e.target.checked)}
                                disabled={!allowRecurring}
                              />
                            </Stack>
                          </CardContent>
                        </Card>

                        {!allowRecurring ? (
                          <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                            Subscriptions are blocked.
                          </Alert>
                        ) : null}

                        <Divider sx={{ my: 1.6 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Current subscriptions
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Only shown to guardians. Students see limited info.
                        </Typography>

                        <Divider sx={{ my: 1.2 }} />

                        <Stack spacing={1.2}>
                          {subs.map((s) => {
                            const tone = s.status === "Active" ? EVZ.green : s.status === "Paused" ? alpha(EVZ.ink, 0.7) : EVZ.orange;
                            return (
                              <Card
                                key={s.id}
                                variant="outlined"
                                component={motion.div}
                                whileHover={{ y: -2 }}
                                sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.22) }}
                              >
                                <CardContent>
                                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                        {s.merchant}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" noWrap>
                                        {fmtMoney(s.amount, s.currency)} • Next bill {s.nextBill}
                                      </Typography>
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
                                        <Chip size="small" label={s.status} sx={{ fontWeight: 900 }} />
                                        <Chip
                                          size="small"
                                          icon={<VerifiedUser fontSize="small" />}
                                          label={s.requiresApproval || recurringRequireApproval ? "Approval required" : "Auto"}
                                          sx={{
                                            fontWeight: 900,
                                            bgcolor: alpha(EVZ.green, 0.10),
                                            color: EVZ.green,
                                            border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                          }}
                                        />
                                      </Stack>
                                    </Box>

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<Info />}
                                      onClick={() => toast("Open subscription details", "info")}
                                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                    >
                                      Details
                                    </Button>
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    {s.status !== "Cancelled" ? (
                                      <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Lock />}
                                        onClick={() => updateSub(s.id, { status: s.status === "Active" ? "Paused" : "Active" })}
                                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                        disabled={!allowRecurring}
                                      >
                                        {s.status === "Active" ? "Pause" : "Resume"}
                                      </Button>
                                    ) : null}
                                    <Button
                                      fullWidth
                                      variant="outlined"
                                      startIcon={<Close />}
                                      onClick={() => updateSub(s.id, { status: "Cancelled" })}
                                      sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                    >
                                      Cancel
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Stack>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Recurring approvals can be routed to co-guardians in Household settings.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Alert severity="info" icon={<Info />}>
                  Provisioning status is shown above. In production, provisioning is handled by the issuer and may take a few minutes.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Container>

        <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </AppShell>
    </ThemeProvider>
  );
}
