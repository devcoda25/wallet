import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
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
  LinearProgress,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  CreditCard,
  Download,
  Info,
  Lock,
  LocalAtm,
  Notifications,
  Payments,
  QrCode2,
  Security,
  Settings,
  Shield,
  Store,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Child Overview (Premium)
 * Route: /parent/edupocket/children/:childId
 * Includes:
 * - ChildHeaderCard (ID summary + status + verified)
 * - BalancePanel (balance + available spend today/week)
 * - PolicySummaryCards (limits, schedule, vendors, approvals)
 * - RecentActivityMiniList
 * - Quick actions row (Freeze, TopUp, ViewQR, ApprovePending)
 * - States: Child paused banner, Consent not complete banner
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type ChildStatus = "Active" | "Paused" | "Restricted" | "Needs consent";

type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  status: ChildStatus;
  currency: "UGX" | "USD";
  balance: number;
  availableToday: number;
  availableWeek: number;
  schoolVerified?: boolean;
  photoProvided: boolean;
};

type Policy = {
  limits: { perTxn: number; daily: number; weekly: number };
  schedule: string;
  vendorsMode: "Approved vendors only" | "Allowlist + Blocklist" | "Open";
  approvals: { mode: "Always" | "Threshold" | "Trusted vendors"; pending: number };
};

type Activity = {
  id: string;
  at: number;
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Fees" | "Other";
  amount: number;
  currency: "UGX" | "USD";
  status: "Approved" | "Declined" | "Pending";
  reason?: string;
};

type ApprovalItem = {
  id: string;
  childId: string;
  title: string;
  vendor: string;
  amount: number;
  currency: "UGX" | "USD";
  at: number;
  status: "Pending" | "Approved" | "Declined";
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
                <VerifiedUser fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket • Child
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
              <Tooltip title="Back to My Children">
                <IconButton onClick={() => alert("Navigate: /parent/edupocket/children")} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
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

function TabsRow({ active }: { active: "Overview" | "QR" | "Activity" | "Approvals" | "Funding" | "Controls" }) {
  const items: Array<{ key: typeof active; label: string; route: string; icon: React.ReactNode }> = [
    { key: "Overview", label: "Overview", route: "(this)", icon: <VerifiedUser fontSize="small" /> },
    { key: "QR", label: "QR / Student ID", route: "/parent/edupocket/children/:childId/qr", icon: <QrCode2 fontSize="small" /> },
    { key: "Activity", label: "Activity", route: "/parent/edupocket/children/:childId/activity", icon: <Store fontSize="small" /> },
    { key: "Approvals", label: "Approvals", route: "/parent/edupocket/children/:childId/approvals", icon: <CheckCircle fontSize="small" /> },
    { key: "Funding", label: "Funding", route: "/parent/edupocket/children/:childId/funding", icon: <Payments fontSize="small" /> },
    { key: "Controls", label: "Controls", route: "/parent/edupocket/children/:childId/controls", icon: <Settings fontSize="small" /> },
  ];

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <Chip
            key={it.key}
            icon={it.icon}
            label={it.label}
            clickable
            onClick={() => alert(`Navigate: ${it.route}`)}
            sx={{
              fontWeight: 900,
              bgcolor: isActive ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, 0.06),
              color: isActive ? EVZ.green : "text.primary",
              border: `1px solid ${alpha(isActive ? EVZ.green : EVZ.ink, isActive ? 0.22 : 0.10)}`,
            }}
          />
        );
      })}
    </Stack>
  );
}

const CHILDREN: Array<{ child: Child; policy: Policy; activity: Activity[]; approvals: ApprovalItem[] }> = [
  {
    child: {
      id: "c_1",
      name: "Amina N.",
      school: "Greenhill Academy",
      className: "P6",
      stream: "Blue",
      status: "Active",
      currency: "UGX",
      balance: 68000,
      availableToday: 22000,
      availableWeek: 74000,
      schoolVerified: true,
      photoProvided: true,
    },
    policy: {
      limits: { perTxn: 15000, daily: 30000, weekly: 120000 },
      schedule: "07:00-18:30 on school days",
      vendorsMode: "Approved vendors only",
      approvals: { mode: "Threshold", pending: 1 },
    },
    activity: [
      { id: "x1", at: Date.now() - 18 * 60000, vendor: "School Canteen", category: "Food", amount: 6000, currency: "UGX", status: "Approved" },
      { id: "x2", at: Date.now() - 2 * 60 * 60000, vendor: "Campus Bookshop", category: "Books", amount: 18000, currency: "UGX", status: "Declined", reason: "Per-transaction limit" },
      { id: "x3", at: Date.now() - 1 * 24 * 60 * 60000, vendor: "School Transport", category: "Transport", amount: 7000, currency: "UGX", status: "Approved" },
    ],
    approvals: [
      { id: "a1", childId: "c_1", title: "Bookshop purchase", vendor: "Campus Bookshop", amount: 18000, currency: "UGX", at: Date.now() - 18 * 60000, status: "Pending" },
    ],
  },
  {
    child: {
      id: "c_2",
      name: "Daniel K.",
      school: "Greenhill Academy",
      className: "S2",
      stream: "West",
      status: "Paused",
      currency: "UGX",
      balance: 41000,
      availableToday: 0,
      availableWeek: 26000,
      schoolVerified: false,
      photoProvided: true,
    },
    policy: {
      limits: { perTxn: 20000, daily: 40000, weekly: 150000 },
      schedule: "06:30-19:00 daily",
      vendorsMode: "Allowlist + Blocklist",
      approvals: { mode: "Trusted vendors", pending: 0 },
    },
    activity: [
      { id: "y1", at: Date.now() - 40 * 60000, vendor: "School Canteen", category: "Food", amount: 12000, currency: "UGX", status: "Declined", reason: "Spending paused" },
      { id: "y2", at: Date.now() - 3 * 24 * 60 * 60000, vendor: "Uniform Store", category: "Other", amount: 15000, currency: "UGX", status: "Approved" },
    ],
    approvals: [],
  },
  {
    child: {
      id: "c_3",
      name: "Maya R.",
      school: "Starlight School",
      className: "P3",
      status: "Needs consent",
      currency: "USD",
      balance: 22,
      availableToday: 0,
      availableWeek: 0,
      schoolVerified: false,
      photoProvided: false,
    },
    policy: {
      limits: { perTxn: 5, daily: 10, weekly: 25 },
      schedule: "Pending consent",
      vendorsMode: "Approved vendors only",
      approvals: { mode: "Always", pending: 2 },
    },
    activity: [],
    approvals: [
      { id: "z1", childId: "c_3", title: "Fund request", vendor: "EduPocket", amount: 10, currency: "USD", at: Date.now() - 25 * 60000, status: "Pending" },
      { id: "z2", childId: "c_3", title: "School trip fee", vendor: "Starlight School", amount: 12, currency: "USD", at: Date.now() - 2 * 60 * 60000, status: "Pending" },
    ],
  },
];

export default function EduPocketChildOverview() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState("c_1");

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [freezeConfirmOpen, setFreezeConfirmOpen] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("20000");
  const [topUpSource, setTopUpSource] = useState("EVzone Pay Wallet");

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const bundle = useMemo(() => CHILDREN.find((x) => x.child.id === childId) ?? CHILDREN[0], [childId]);

  const [child, setChild] = useState<Child>(bundle.child);
  const [policy, setPolicy] = useState<Policy>(bundle.policy);
  const [activity, setActivity] = useState<Activity[]>(bundle.activity);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(bundle.approvals);

  useEffect(() => {
    // When child selection changes, load new bundle
    setLoading(true);
    const t = setTimeout(() => {
      const b = CHILDREN.find((x) => x.child.id === childId) ?? CHILDREN[0];
      setChild(b.child);
      setPolicy(b.policy);
      setActivity(b.activity);
      setApprovals(b.approvals);
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [childId]);

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const statusTone =
    child.status === "Active" ? EVZ.green : child.status === "Paused" ? alpha(EVZ.ink, 0.75) : EVZ.orange;

  const pausedBanner = child.status === "Paused" || child.status === "Restricted";
  const consentBanner = child.status === "Needs consent";

  const doFreezeToggle = () => {
    if (child.status === "Active") {
      setFreezeConfirmOpen(true);
      return;
    }

    // Unpause
    setChild((p) => ({ ...p, status: "Active" }));
    toast("Spending resumed", "success");
  };

  const confirmFreeze = () => {
    setFreezeConfirmOpen(false);
    setChild((p) => ({ ...p, status: "Paused" }));
    toast("Spending paused", "warning");
  };

  const doTopUp = () => {
    const amt = Math.max(0, parseInt(topupSanitize(topUpAmount), 10) || 0);
    if (amt <= 0) return toast("Enter a valid amount", "warning");

    setChild((p) => ({ ...p, balance: p.balance + amt }));
    toast(`Top up sent (${fmtMoney(amt, child.currency)})`, "success");
    setTopUpOpen(false);
  };

  const approveItem = (id: string, decision: "Approved" | "Declined") => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: decision } : a)));
    toast(decision === "Approved" ? "Approved" : "Declined", decision === "Approved" ? "success" : "warning");
  };

  const exportSnapshot = () => {
    const rows: string[] = [];
    rows.push(["child", "school", "class", "status", "balance", "availableToday", "availableWeek"].join(","));
    rows.push([child.name, child.school, child.className, child.status, fmtMoney(child.balance, child.currency), fmtMoney(child.availableToday, child.currency), fmtMoney(child.availableWeek, child.currency)].join(","));
    rows.push("");
    rows.push(["policy", "perTxn", "daily", "weekly", "schedule", "vendorsMode", "approvalsMode", "pendingApprovals"].join(","));
    rows.push([
      "policy",
      String(policy.limits.perTxn),
      String(policy.limits.daily),
      String(policy.limits.weekly),
      policy.schedule,
      policy.vendorsMode,
      policy.approvals.mode,
      String(policy.approvals.pending),
    ].join(","));
    downloadText(`edupocket_child_${child.id}_overview_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} childName={child.name}>
        <Container maxWidth="xl" disableGutters>
          <Stack spacing={2.2}>
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Child Overview</Typography>
                    <Typography variant="body2" color="text.secondary">
                      High-level view of identity, balance, controls and recent activity.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField
                      select
                      label="Child"
                      value={childId}
                      onChange={(e) => setChildId(e.target.value)}
                      sx={{ minWidth: 260 }}
                    >
                      {CHILDREN.map((b) => (
                        <MenuItem key={b.child.id} value={b.child.id}>
                          {b.child.name} • {b.child.school}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportSnapshot}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <TabsRow active="Overview" />

                <Divider sx={{ my: 2 }} />

                {/* State banners */}
                <AnimatePresence initial={false}>
                  {pausedBanner ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert
                        severity="warning"
                        icon={<Lock />}
                        action={
                          <Button size="small" onClick={doFreezeToggle}>
                            Resume
                          </Button>
                        }
                        sx={{ mb: 1.6 }}
                      >
                        Spending is currently paused for this child.
                      </Alert>
                    </motion.div>
                  ) : null}

                  {consentBanner ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert
                        severity="info"
                        icon={<Info />}
                        action={
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => toast("Open consent flow", "info")}>
                              Review
                            </Button>
                            <Button size="small" onClick={() => toast("Resend consent invite", "success")}>
                              Resend
                            </Button>
                          </Stack>
                        }
                        sx={{ mb: 1.6 }}
                      >
                        Consent not complete. Transactions may be blocked until guardian approval is done.
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Header card + Balance panel */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    <Card
                      variant="outlined"
                      sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                      component={motion.div}
                      whileHover={{ y: -2 }}
                    >
                      <CardContent>
                        {loading ? (
                          <>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Skeleton variant="circular" width={56} height={56} />
                              <Stack spacing={0.8} sx={{ flex: 1 }}>
                                <Skeleton variant="rounded" width="60%" height={18} />
                                <Skeleton variant="rounded" width="80%" height={14} />
                              </Stack>
                            </Stack>
                            <Divider sx={{ my: 1.6 }} />
                            <Skeleton variant="rounded" height={46} />
                          </>
                        ) : (
                          <>
                            <Stack direction="row" spacing={1.4} alignItems="center" justifyContent="space-between">
                              <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: alpha(EVZ.green, 0.18),
                                    color: EVZ.green,
                                    border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                                    fontWeight: 950,
                                  }}
                                >
                                  {child.name.split(" ")[0][0]}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography variant="h6" noWrap>
                                      {child.name}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={child.status}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(statusTone, 0.12),
                                        color: statusTone,
                                        border: `1px solid ${alpha(statusTone, 0.22)}`,
                                      }}
                                    />
                                    {child.schoolVerified ? (
                                      <Chip
                                        size="small"
                                        icon={<VerifiedUser fontSize="small" />}
                                        label="School verified"
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha(EVZ.green, 0.10),
                                          color: EVZ.green,
                                          border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                        }}
                                      />
                                    ) : null}
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {child.school} • {child.className}
                                    {child.stream ? ` • ${child.stream}` : ""}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.6 }}>
                                    <Chip
                                      size="small"
                                      icon={<Security fontSize="small" />}
                                      label={child.photoProvided ? "Photo on file" : "Photo missing"}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(child.photoProvided ? EVZ.green : EVZ.orange, 0.10),
                                        color: child.photoProvided ? EVZ.green : EVZ.orange,
                                        border: `1px solid ${alpha(child.photoProvided ? EVZ.green : EVZ.orange, 0.22)}`,
                                      }}
                                    />
                                    <Chip
                                      size="small"
                                      icon={<QrCode2 fontSize="small" />}
                                      label="Student QR enabled"
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                        border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                      }}
                                    />
                                  </Stack>
                                </Box>
                              </Stack>

                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  startIcon={<QrCode2 />}
                                  onClick={() => setQrOpen(true)}
                                  sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                >
                                  View QR
                                </Button>
                                <Button
                                  variant="contained"
                                  startIcon={<Payments />}
                                  onClick={() => setTopUpOpen(true)}
                                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                >
                                  Top up
                                </Button>
                              </Stack>
                            </Stack>

                            <Divider sx={{ my: 1.6 }} />

                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  icon={<Notifications fontSize="small" />}
                                  size="small"
                                  label={`${policy.approvals.pending} pending approvals`}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(policy.approvals.pending > 0 ? EVZ.orange : EVZ.green, 0.10),
                                    color: policy.approvals.pending > 0 ? EVZ.orange : EVZ.green,
                                    border: `1px solid ${alpha(policy.approvals.pending > 0 ? EVZ.orange : EVZ.green, 0.22)}`,
                                  }}
                                />
                                <Chip
                                  icon={<Store fontSize="small" />}
                                  size="small"
                                  label={`Vendors: ${policy.vendorsMode}`}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                    border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                  }}
                                />
                                <Chip
                                  icon={<Settings fontSize="small" />}
                                  size="small"
                                  label={`Schedule: ${policy.schedule}`}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                    border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                  }}
                                />
                              </Stack>

                              <Button endIcon={<ArrowForward />} onClick={() => toast("Open controls", "info")}>
                                Review controls
                              </Button>
                            </Stack>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    <Card component={motion.div} whileHover={{ y: -2 }}>
                      <CardContent>
                        <Typography variant="h6">Balance</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Current balance and safe spend availability.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {loading ? (
                          <>
                            <Skeleton variant="rounded" height={30} width="55%" />
                            <Skeleton variant="rounded" height={18} width="70%" sx={{ mt: 1.2 }} />
                            <Skeleton variant="rounded" height={12} sx={{ mt: 2 }} />
                            <Skeleton variant="rounded" height={12} sx={{ mt: 1 }} />
                          </>
                        ) : (
                          <>
                            <Typography variant="h5">{fmtMoney(child.balance, child.currency)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Updated just now • Funding source: {topUpSource}
                            </Typography>

                            <Divider sx={{ my: 1.4 }} />

                            <Grid container spacing={1.2}>
                              <Grid item xs={6}>
                                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                                  <CardContent>
                                    <Typography variant="caption" color="text.secondary">
                                      Available today
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 950, mt: 0.2 }}>
                                      {fmtMoney(child.availableToday, child.currency)}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={6}>
                                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                                  <CardContent>
                                    <Typography variant="caption" color="text.secondary">
                                      Available this week
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 950, mt: 0.2 }}>
                                      {fmtMoney(child.availableWeek, child.currency)}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>

                            <Box sx={{ mt: 1.6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Daily utilisation (relative)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, Math.round(((policy.limits.daily - child.availableToday) / Math.max(1, policy.limits.daily)) * 100))}
                                sx={{
                                  mt: 0.7,
                                  height: 10,
                                  borderRadius: 99,
                                  bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.08),
                                  "& .MuiLinearProgress-bar": { bgcolor: EVZ.green },
                                }}
                              />
                            </Box>

                            <Box sx={{ mt: 1.3 }}>
                              <Typography variant="caption" color="text.secondary">
                                Weekly utilisation (relative)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, Math.round(((policy.limits.weekly - child.availableWeek) / Math.max(1, policy.limits.weekly)) * 100))}
                                sx={{
                                  mt: 0.7,
                                  height: 10,
                                  borderRadius: 99,
                                  bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.08),
                                  "& .MuiLinearProgress-bar": { bgcolor: EVZ.orange },
                                }}
                              />
                            </Box>
                          </>
                        )}
                      </CardContent>

                      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
                        <Button startIcon={<LocalAtm />} onClick={() => setTopUpOpen(true)}>
                          Top up
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button endIcon={<ArrowForward />} onClick={() => toast("Open funding", "info")}>
                          Funding
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>

                {/* Policy summary + recent activity */}
                <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Policy summary</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Key highlights from the rule set.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {loading ? (
                          <Grid container spacing={1.2}>
                            {[0, 1, 2, 3].map((i) => (
                              <Grid key={i} item xs={12} md={6}>
                                <Skeleton variant="rounded" height={92} />
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                              <PolicyCard
                                icon={<CreditCard fontSize="small" />}
                                title="Limits"
                                lines={[`Per txn: ${fmtMoney(policy.limits.perTxn, child.currency)}`, `Daily: ${fmtMoney(policy.limits.daily, child.currency)}`, `Weekly: ${fmtMoney(policy.limits.weekly, child.currency)}`]}
                                cta="Edit"
                                onClick={() => toast("Open limits", "info")}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <PolicyCard
                                icon={<Settings fontSize="small" />}
                                title="Schedule"
                                lines={[policy.schedule, "Controls apply during off-hours"]}
                                cta="Edit"
                                onClick={() => toast("Open schedule", "info")}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <PolicyCard
                                icon={<Store fontSize="small" />}
                                title="Vendors"
                                lines={[policy.vendorsMode, "Block risky categories and vendors"]}
                                cta="Review"
                                onClick={() => toast("Open vendors", "info")}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <PolicyCard
                                icon={<Notifications fontSize="small" />}
                                title="Approvals"
                                lines={[`Mode: ${policy.approvals.mode}`, `Pending: ${policy.approvals.pending}`]}
                                cta="Open"
                                onClick={() => setApproveOpen(true)}
                                tone={policy.approvals.pending > 0 ? "warn" : "good"}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Recent activity</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Latest transactions and events.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {loading ? (
                          <Stack spacing={1}>
                            {[0, 1, 2].map((i) => (
                              <Skeleton key={i} variant="rounded" height={62} />
                            ))}
                          </Stack>
                        ) : activity.length === 0 ? (
                          <Box
                            sx={{
                              p: 2.2,
                              borderRadius: 3,
                              border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                              bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              No activity yet
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Transactions will appear here once the child starts spending.
                            </Typography>
                          </Box>
                        ) : (
                          <List disablePadding>
                            {activity.slice(0, 5).map((a) => {
                              const tone = a.status === "Approved" ? EVZ.green : a.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7);
                              return (
                                <ListItemButton
                                  key={a.id}
                                  sx={{
                                    borderRadius: 3,
                                    mb: 1,
                                    border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.10)}`,
                                    bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.68),
                                  }}
                                  component={motion.div}
                                  whileHover={{ y: -2 }}
                                  onClick={() => toast("Open transaction details", "info")}
                                >
                                  <ListItemAvatar>
                                    <Avatar
                                      sx={{
                                        bgcolor: alpha(tone, 0.14),
                                        color: tone,
                                        border: `1px solid ${alpha(tone, 0.22)}`,
                                      }}
                                    >
                                      {a.category[0]}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Typography sx={{ fontWeight: 950 }} noWrap>
                                          {a.vendor}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label={a.status}
                                          sx={{
                                            fontWeight: 900,
                                            bgcolor: alpha(tone, 0.12),
                                            color: tone,
                                            border: `1px solid ${alpha(tone, 0.22)}`,
                                          }}
                                        />
                                      </Stack>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {a.category} • {fmtMoney(a.amount, a.currency)} • {timeAgo(a.at)}
                                        {a.reason ? ` • ${a.reason}` : ""}
                                      </Typography>
                                    }
                                  />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        )}
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
                        <Button endIcon={<ArrowForward />} onClick={() => alert("Navigate: /parent/edupocket/children/:childId/activity")}>
                          View activity
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>

                {/* Quick actions row */}
                <Card sx={{ mt: 2.2 }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Quick actions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fast actions for daily operations.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          variant="outlined"
                          startIcon={<Lock />}
                          onClick={doFreezeToggle}
                          sx={{ borderColor: alpha(EVZ.orange, 0.55), color: pausedBanner ? EVZ.green : EVZ.orange }}
                        >
                          {child.status === "Active" ? "Freeze" : "Resume"}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Payments />}
                          onClick={() => setTopUpOpen(true)}
                          sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                        >
                          Top up
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<QrCode2 />}
                          onClick={() => setQrOpen(true)}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          View QR
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => setApproveOpen(true)}
                          sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                        >
                          Approve pending
                          {approvals.filter((a) => a.status === "Pending").length > 0 ? (
                            <Chip
                              size="small"
                              label={approvals.filter((a) => a.status === "Pending").length}
                              sx={{ ml: 1, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, fontWeight: 900 }}
                            />
                          ) : null}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </AppShell>

      {/* Freeze confirm */}
      <Dialog open={freezeConfirmOpen} onClose={() => setFreezeConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Freeze spending</Typography>
              <Typography variant="body2" color="text.secondary">
                This pauses all purchases until you resume.
              </Typography>
            </Stack>
            <IconButton onClick={() => setFreezeConfirmOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<WarningAmber />}
            sx={{ mt: 1 }}
          >
            Freezing is immediate. Vendors will see “spending paused” if they attempt a charge.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreezeConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Lock />}
            onClick={confirmFreeze}
            sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
          >
            Freeze
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top up drawer */}
      <Drawer anchor="right" open={topUpOpen} onClose={() => setTopUpOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 540 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Top up</Typography>
              <Typography variant="body2" color="text.secondary">
                Add funds instantly. Controls still apply.
              </Typography>
            </Stack>
            <IconButton onClick={() => setTopUpOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Recipient
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {child.name} • {child.school} • {child.className}
                </Typography>
              </CardContent>
            </Card>

            <TextField
              label="Amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(topupSanitize(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment>,
              }}
              helperText="You can set scheduled allowances in Funding."
            />

            <TextField select label="Funding source" value={topUpSource} onChange={(e) => setTopUpSource(e.target.value)}>
              <MenuItem value="EVzone Pay Wallet">EVzone Pay Wallet</MenuItem>
              <MenuItem value="CorporatePay Wallet">CorporatePay Wallet</MenuItem>
              <MenuItem value="Bank / Card">Bank / Card</MenuItem>
              <MenuItem value="Mobile Money">Mobile Money</MenuItem>
            </TextField>

            <Button
              variant="contained"
              startIcon={<LocalAtm />}
              onClick={doTopUp}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
              fullWidth
            >
              Send top up
            </Button>

            <Alert severity="info" icon={<Info />}>
              Limits, schedules and approvals can still block purchases.
            </Alert>
          </Stack>
        </Box>
      </Drawer>

      {/* Approvals drawer */}
      <Drawer anchor="right" open={approveOpen} onClose={() => setApproveOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Pending approvals</Typography>
              <Typography variant="body2" color="text.secondary">
                Approve quickly or create rules.
              </Typography>
            </Stack>
            <IconButton onClick={() => setApproveOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.2}>
            {approvals.filter((a) => a.status === "Pending").length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                No approvals waiting.
              </Alert>
            ) : (
              approvals
                .filter((a) => a.status === "Pending")
                .map((a) => (
                  <Card key={a.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                    <CardContent>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                            {a.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {a.vendor} • {timeAgo(a.at)}
                          </Typography>
                        </Box>
                        <Stack spacing={0.2} alignItems="flex-end">
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            {fmtMoney(a.amount, a.currency)}
                          </Typography>
                          <Chip
                            size="small"
                            label="Pending"
                            sx={{
                              fontWeight: 900,
                              bgcolor: alpha(EVZ.orange, 0.12),
                              color: EVZ.orange,
                              border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                            }}
                          />
                        </Stack>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => approveItem(a.id, "Approved")}
                          sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                        >
                          Approve
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={() => approveItem(a.id, "Declined")}
                          sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                        >
                          Decline
                        </Button>
                      </Stack>

                      <Divider sx={{ my: 1.2 }} />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Shield />}
                          onClick={() => toast("Open rule builder", "info")}
                          sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                        >
                          Create rule
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Info />}
                          onClick={() => toast("Open approval details", "info")}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Details
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
            )}

            <Divider sx={{ my: 1.2 }} />
            <Button
              startIcon={<Download />}
              onClick={() => {
                const rows = approvals.map((a) => [a.id, a.title, a.vendor, fmtMoney(a.amount, a.currency), a.status].join(","));
                downloadText(`edupocket_child_${child.id}_approvals.csv`, ["id,title,vendor,amount,status", ...rows].join("\n"));
                toast("Approvals exported", "success");
              }}
            >
              Export approvals
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* QR dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Student QR</Typography>
              <Typography variant="body2" color="text.secondary">
                Use this for verification and payments.
              </Typography>
            </Stack>
            <IconButton onClick={() => setQrOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" icon={<Info />}>
            This page is a preview. The full QR experience is in “QR / Student ID”.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(EVZ.green, 0.12),
                      color: EVZ.green,
                      border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                    }}
                  >
                    <QrCode2 fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      {child.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {child.school} • {child.className}{child.stream ? ` • ${child.stream}` : ""}
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 1.2 }} />
                <Typography variant="caption" color="text.secondary">
                  QR deep link
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  edupocket://student/{child.id}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Done</Button>
          <Button
            variant="contained"
            startIcon={<ArrowForward />}
            onClick={() => alert("Navigate: /parent/edupocket/children/:childId/qr")}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Open full QR page
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3400} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function PolicyCard({
  icon,
  title,
  lines,
  cta,
  onClick,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  cta: string;
  onClick: () => void;
  tone?: "good" | "warn" | "neutral";
}) {
  const color = tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  return (
    <Card
      variant="outlined"
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(color as any, 0.18) }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(color as any, 0.12),
                color,
                border: `1px solid ${alpha(color as any, 0.22)}`,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lines[0]}
              </Typography>
            </Box>
          </Stack>
          <Button size="small" onClick={onClick} endIcon={<ArrowForward />}>
            {cta}
          </Button>
        </Stack>

        <Divider sx={{ my: 1.2 }} />

        <Stack spacing={0.4}>
          {lines.slice(1).map((l, idx) => (
            <Typography key={idx} variant="caption" color="text.secondary">
              {l}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function topupSanitize(v: string) {
  return (v || "").replace(/[^0-9]/g, "");
}
