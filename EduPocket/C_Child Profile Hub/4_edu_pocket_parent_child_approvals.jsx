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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowForward,
  Bolt,
  CheckCircle,
  Close,
  Download,
  Gavel,
  Info,
  Notifications,
  ReportProblem,
  Rule,
  Schedule,
  School,
  Settings,
  Shield,
  Store,
  Tune,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Child Approvals (Premium)
 * Route: /parent/edupocket/children/:childId/approvals
 * Includes:
 * - Approvals queue grouped by type: purchases / school / fund / settings-change
 * - ApprovalCard: approve/decline, reason templates, approve once vs always allow (opens RuleBuilderSheet)
 * - Delegation badge (who can approve)
 * - Emergency override (one-time override)
 * - Aging indicators (e.g. waiting 8m)
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  status: "Active" | "Paused" | "Restricted" | "Needs consent";
};

type ApprovalType = "Purchase" | "School" | "Fund" | "Settings";

type ApprovalStatus = "Pending" | "Approved" | "Declined";

type ApprovalItem = {
  id: string;
  childId: string;
  type: ApprovalType;
  title: string;
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Fees" | "Other";
  amount: number;
  currency: "UGX" | "USD";
  requestedAt: number;
  status: ApprovalStatus;
  policyHint?: string;
  declineReason?: string;
  note?: string;
};

type Delegation = {
  label: string;
  role: "Admin" | "Approver" | "Viewer";
  canApprove: boolean;
};

type RuleDraft = {
  scope: "Vendor" | "Category";
  vendor: string;
  category: ApprovalItem["category"];
  autoApproveUnder: number;
  allowedHoursStart: string;
  allowedHoursEnd: string;
  alsoApproveCurrent: boolean;
};

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

function minutesAgo(ts: number) {
  return Math.max(0, Math.floor((Date.now() - ts) / 60000));
}

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
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
                <Gavel fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket - Approvals
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

function TabsRow({ active }: { active: "Overview" | "QR" | "Activity" | "Approvals" | "Funding" | "Controls" }) {
  const items: Array<{ key: typeof active; label: string; route: string; icon: React.ReactNode }> = [
    { key: "Overview", label: "Overview", route: "/parent/edupocket/children/:childId", icon: <VerifiedUser fontSize="small" /> },
    { key: "QR", label: "QR / Student ID", route: "/parent/edupocket/children/:childId/qr", icon: <Store fontSize="small" /> },
    { key: "Activity", label: "Activity", route: "/parent/edupocket/children/:childId/activity", icon: <Schedule fontSize="small" /> },
    { key: "Approvals", label: "Approvals", route: "(this)", icon: <Gavel fontSize="small" /> },
    { key: "Funding", label: "Funding", route: "/parent/edupocket/children/:childId/funding", icon: <Notifications fontSize="small" /> },
    { key: "Controls", label: "Controls", route: "/parent/edupocket/children/:childId/controls", icon: <Tune fontSize="small" /> },
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

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", status: "Active" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", status: "Active" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", status: "Needs consent" },
];

const REASON_TEMPLATES = [
  "Exceeds per-transaction limit",
  "Exceeds daily limit",
  "Outside allowed hours",
  "Vendor not allowed",
  "Category restricted",
  "Needs more info",
  "Other",
];

const SEED: ApprovalItem[] = [
  {
    id: "p_1",
    childId: "c_1",
    type: "Purchase",
    title: "Bookshop purchase",
    vendor: "Campus Bookshop",
    category: "Books",
    amount: 18000,
    currency: "UGX",
    requestedAt: Date.now() - 18 * 60000,
    status: "Pending",
    policyHint: "Per-transaction limit is 15,000 UGX",
  },
  {
    id: "s_1",
    childId: "c_1",
    type: "School",
    title: "Trip contribution",
    vendor: "Greenhill Academy",
    category: "Fees",
    amount: 55000,
    currency: "UGX",
    requestedAt: Date.now() - 8 * 60000,
    status: "Pending",
    policyHint: "School payment approvals required",
  },
  {
    id: "f_1",
    childId: "c_1",
    type: "Fund",
    title: "Request: lunch allowance",
    vendor: "EduPocket",
    category: "Food",
    amount: 10000,
    currency: "UGX",
    requestedAt: Date.now() - 33 * 60000,
    status: "Pending",
    policyHint: "Daily food cap is 15,000 UGX",
  },
  {
    id: "set_1",
    childId: "c_1",
    type: "Settings",
    title: "Request: increase daily limit",
    vendor: "Controls",
    category: "Other",
    amount: 0,
    currency: "UGX",
    requestedAt: Date.now() - 62 * 60000,
    status: "Pending",
    policyHint: "Student requested higher daily limit",
  },
  {
    id: "p_2",
    childId: "c_2",
    type: "Purchase",
    title: "Snack kiosk purchase",
    vendor: "New Snack Kiosk",
    category: "Food",
    amount: 7000,
    currency: "UGX",
    requestedAt: Date.now() - 5 * 60000,
    status: "Pending",
    policyHint: "New vendor requires approval",
  },
];

export default function EduPocketChildApprovals() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [items, setItems] = useState<ApprovalItem[]>(SEED);

  const [delegation] = useState<Delegation[]>([
    { label: "You", role: "Admin", canApprove: true },
    { label: "Susan (Co-guardian)", role: "Approver", canApprove: true },
    { label: "School Bursar", role: "Viewer", canApprove: false },
  ]);

  const [ruleSheetOpen, setRuleSheetOpen] = useState(false);
  const [ruleTarget, setRuleTarget] = useState<ApprovalItem | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>({
    scope: "Vendor",
    vendor: "",
    category: "Other",
    autoApproveUnder: 10000,
    allowedHoursStart: "07:00",
    allowedHoursEnd: "18:30",
    alsoApproveCurrent: true,
  });

  const [overrideArmed, setOverrideArmed] = useState(false);
  const [overrideMinutesLeft, setOverrideMinutesLeft] = useState(0);
  const [overrideCap, setOverrideCap] = useState(20000);

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  // Countdown for one-time override
  useEffect(() => {
    if (!overrideArmed) return;
    if (overrideMinutesLeft <= 0) {
      setOverrideArmed(false);
      return;
    }

    const t = setInterval(() => {
      setOverrideMinutesLeft((m) => {
        const next = m - 1;
        if (next <= 0) {
          setOverrideArmed(false);
          toast("Emergency override expired", "info");
          return 0;
        }
        return next;
      });
    }, 60000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideArmed]);

  const childItems = useMemo(() => items.filter((x) => x.childId === childId), [items, childId]);

  const grouped = useMemo(() => {
    const pending = childItems.filter((x) => x.status === "Pending");
    const g: Record<ApprovalType, ApprovalItem[]> = { Purchase: [], School: [], Fund: [], Settings: [] };
    for (const it of pending) g[it.type].push(it);
    for (const k of Object.keys(g) as ApprovalType[]) {
      g[k].sort((a, b) => a.requestedAt - b.requestedAt); // oldest first for aging
    }
    return g;
  }, [childItems]);

  const pendingCount = useMemo(() => childItems.filter((x) => x.status === "Pending").length, [childItems]);

  const canCurrentUserApprove = useMemo(() => delegation.some((d) => d.canApprove && d.role !== "Viewer"), [delegation]);

  const exportApprovals = () => {
    const rows: string[] = [];
    rows.push(["id", "type", "title", "vendor", "category", "amount", "currency", "status", "requestedAt", "agingMin", "policyHint"].join(","));
    for (const a of childItems) {
      rows.push(
        [
          a.id,
          a.type,
          a.title,
          a.vendor,
          a.category,
          String(a.amount),
          a.currency,
          a.status,
          new Date(a.requestedAt).toISOString(),
          String(minutesAgo(a.requestedAt)),
          a.policyHint ?? "",
        ]
          .map(csvSafe)
          .join(",")
      );
    }
    downloadText(`edupocket_child_${childId}_approvals_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  const approveOnce = (id: string) => {
    if (!canCurrentUserApprove) return toast("You do not have permission to approve", "warning");
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "Approved" } : x)));
    toast("Approved", "success");
  };

  const decline = (id: string, reason: string, note?: string) => {
    if (!canCurrentUserApprove) return toast("You do not have permission to decline", "warning");
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "Declined", declineReason: reason, note } : x)));
    toast("Declined", "warning");
  };

  const openRuleBuilder = (it: ApprovalItem) => {
    setRuleTarget(it);
    setRuleDraft({
      scope: "Vendor",
      vendor: it.vendor,
      category: it.category,
      autoApproveUnder: Math.max(1000, it.amount || 10000),
      allowedHoursStart: "07:00",
      allowedHoursEnd: "18:30",
      alsoApproveCurrent: true,
    });
    setRuleSheetOpen(true);
  };

  const saveRule = () => {
    if (!ruleTarget) return;

    // Simulate creating a rule.
    toast("Rule created", "success");

    if (ruleDraft.alsoApproveCurrent) {
      approveOnce(ruleTarget.id);
    }

    setRuleSheetOpen(false);
    setRuleTarget(null);
  };

  const armOverride = () => {
    setOverrideArmed(true);
    setOverrideMinutesLeft(15);
    toast("Emergency override armed (15m)", "warning");
  };

  const disarmOverride = () => {
    setOverrideArmed(false);
    setOverrideMinutesLeft(0);
    toast("Emergency override cleared", "info");
  };

  const approveAllInGroup = (type: ApprovalType) => {
    if (!canCurrentUserApprove) return toast("You do not have permission", "warning");
    const ids = grouped[type].map((x) => x.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, status: "Approved" } : x)));
    toast(`Approved ${ids.length} item(s)`, "success");
  };

  const groupsMeta: Array<{ type: ApprovalType; label: string; icon: React.ReactNode }> = [
    { type: "Purchase", label: "Purchases", icon: <Store fontSize="small" /> },
    { type: "School", label: "School", icon: <School fontSize="small" /> },
    { type: "Fund", label: "Funds", icon: <Notifications fontSize="small" /> },
    { type: "Settings", label: "Settings", icon: <Settings fontSize="small" /> },
  ];

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
                    <Typography variant="h5">Approvals</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review pending actions and keep rules consistent.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} - {c.school}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportApprovals}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Bolt />}
                      onClick={() => setOverrideDialogOpen(true)}
                      sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                    >
                      Emergency override
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <TabsRow active="Approvals" />

                <Divider />

                {/* Delegation badge */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
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
                          <VerifiedUser fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            Delegation
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Who can approve for this child.
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {delegation.map((d) => (
                          <Chip
                            key={d.label}
                            size="small"
                            label={`${d.label} (${d.role})`}
                            sx={{
                              fontWeight: 900,
                              bgcolor: alpha(d.canApprove ? EVZ.green : EVZ.ink, d.canApprove ? 0.10 : 0.06),
                              color: d.canApprove ? EVZ.green : "text.primary",
                              border: `1px solid ${alpha(d.canApprove ? EVZ.green : EVZ.ink, d.canApprove ? 0.22 : 0.10)}`,
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.2 }} />

                    <Typography variant="caption" color="text.secondary">
                      Pending approvals: <b>{pendingCount}</b>
                    </Typography>
                  </CardContent>
                </Card>

                {/* Emergency override banner */}
                {overrideArmed ? (
                  <Alert
                    severity="warning"
                    icon={<Bolt />}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={disarmOverride}>
                          Clear
                        </Button>
                      </Stack>
                    }
                  >
                    One-time override armed. Valid for {overrideMinutesLeft} min. Cap: {fmtMoney(overrideCap, "UGX")}.
                  </Alert>
                ) : null}

                {/* Queue */}
                {pendingCount === 0 ? (
                  <Alert severity="success" icon={<CheckCircle />}>
                    No pending approvals.
                  </Alert>
                ) : (
                  <Stack spacing={2.2}>
                    {groupsMeta.map((g) => (
                      <ApprovalGroup
                        key={g.type}
                        mode={mode}
                        label={g.label}
                        icon={g.icon}
                        type={g.type}
                        items={grouped[g.type]}
                        onApproveAll={() => approveAllInGroup(g.type)}
                        canApprove={canCurrentUserApprove}
                        onApproveOnce={approveOnce}
                        onDecline={decline}
                        onAlwaysAllow={openRuleBuilder}
                      />
                    ))}
                  </Stack>
                )}

                <Alert severity="info" icon={<Info />}>
                  "Approve once" affects only this request. "Always allow" creates a rule and can approve this request.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Rule builder sheet */}
      <Drawer anchor="right" open={ruleSheetOpen} onClose={() => setRuleSheetOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 600 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Rule builder</Typography>
              <Typography variant="body2" color="text.secondary">
                Create a rule to reduce approvals while staying safe.
              </Typography>
            </Stack>
            <IconButton onClick={() => setRuleSheetOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {ruleTarget ? (
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Based on
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ruleTarget.title} - {ruleTarget.vendor} - {fmtMoney(ruleTarget.amount, ruleTarget.currency)}
                </Typography>
              </CardContent>
            </Card>
          ) : null}

          <Stack spacing={1.6} sx={{ mt: 2 }}>
            <TextField
              select
              label="Scope"
              value={ruleDraft.scope}
              onChange={(e) => setRuleDraft((p) => ({ ...p, scope: e.target.value as any }))}
            >
              <MenuItem value="Vendor">Vendor</MenuItem>
              <MenuItem value="Category">Category</MenuItem>
            </TextField>

            <TextField
              label="Vendor"
              value={ruleDraft.vendor}
              onChange={(e) => setRuleDraft((p) => ({ ...p, vendor: e.target.value }))}
              disabled={ruleDraft.scope !== "Vendor"}
            />

            <TextField
              select
              label="Category"
              value={ruleDraft.category}
              onChange={(e) => setRuleDraft((p) => ({ ...p, category: e.target.value as any }))}
              disabled={ruleDraft.scope !== "Category"}
            >
              {(["Food", "Books", "Transport", "Fees", "Other"] as const).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Auto-approve under"
              type="number"
              value={ruleDraft.autoApproveUnder}
              onChange={(e) => setRuleDraft((p) => ({ ...p, autoApproveUnder: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">UGX</InputAdornment>,
              }}
              helperText="Transactions above this amount still require approval."
            />

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Allowed hours
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Optional schedule constraint to reduce misuse.
                </Typography>
                <Divider sx={{ my: 1.2 }} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <TextField
                    label="Start"
                    type="time"
                    value={ruleDraft.allowedHoursStart}
                    onChange={(e) => setRuleDraft((p) => ({ ...p, allowedHoursStart: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="End"
                    type="time"
                    value={ruleDraft.allowedHoursEnd}
                    onChange={(e) => setRuleDraft((p) => ({ ...p, allowedHoursEnd: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Also approve current request
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When saving, approve the current request too.
                    </Typography>
                  </Box>
                  <Switch
                    checked={ruleDraft.alsoApproveCurrent}
                    onChange={(e) => setRuleDraft((p) => ({ ...p, alsoApproveCurrent: e.target.checked }))}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Close />}
                onClick={() => setRuleSheetOpen(false)}
                sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Rule />}
                onClick={saveRule}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
              >
                Save rule
              </Button>
            </Stack>

            <Alert severity="info" icon={<Info />}>
              Rule priority: System rules, then School rules, then Parent rules, then Student permissions.
            </Alert>
          </Stack>
        </Box>
      </Drawer>

      {/* Emergency override dialog */}
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Emergency override</Typography>
              <Typography variant="body2" color="text.secondary">
                One-time override for urgent situations.
              </Typography>
            </Stack>
            <IconButton onClick={() => setOverrideDialogOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <Alert severity="warning" icon={<Bolt />}>
              Use only when necessary. This is logged and expires automatically.
            </Alert>

            <TextField
              label="Override cap (UGX)"
              type="number"
              value={overrideCap}
              onChange={(e) => setOverrideCap(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
              helperText="Max amount the override can cover for one transaction."
            />

            <TextField
              label="Duration (minutes)"
              type="number"
              value={15}
              helperText="Fixed to 15 minutes in this demo."
              disabled
            />

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  What happens
                </Typography>
                <Divider sx={{ my: 1.2 }} />
                <Typography variant="caption" color="text.secondary">
                  1) The next blocked purchase can pass once (within cap).
                  <br />
                  2) The override expires in 15 minutes.
                  <br />
                  3) All actions are recorded in audit logs.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
          {overrideArmed ? (
            <Button
              variant="outlined"
              startIcon={<Close />}
              onClick={() => {
                disarmOverride();
                setOverrideDialogOpen(false);
              }}
              sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
            >
              Clear override
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Bolt />}
              onClick={() => {
                armOverride();
                setOverrideDialogOpen(false);
              }}
              sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
            >
              Arm override
            </Button>
          )}
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

function ApprovalGroup({
  mode,
  label,
  icon,
  type,
  items,
  onApproveAll,
  canApprove,
  onApproveOnce,
  onDecline,
  onAlwaysAllow,
}: {
  mode: "light" | "dark";
  label: string;
  icon: React.ReactNode;
  type: ApprovalType;
  items: ApprovalItem[];
  onApproveAll: () => void;
  canApprove: boolean;
  onApproveOnce: (id: string) => void;
  onDecline: (id: string, reason: string, note?: string) => void;
  onAlwaysAllow: (it: ApprovalItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
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
              {icon}
            </Box>
            <Box>
              <Typography variant="h6">{label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {items.length} pending
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={onApproveAll}
              disabled={!canApprove}
              sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
            >
              Approve all
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.6 }} />

        <Grid container spacing={1.6}>
          {items.map((it) => (
            <Grid key={it.id} item xs={12}>
              <ApprovalCard
                mode={mode}
                item={it}
                canApprove={canApprove}
                onApproveOnce={() => onApproveOnce(it.id)}
                onDecline={(reason, note) => onDecline(it.id, reason, note)}
                onAlwaysAllow={() => onAlwaysAllow(it)}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function ApprovalCard({
  mode,
  item,
  canApprove,
  onApproveOnce,
  onDecline,
  onAlwaysAllow,
}: {
  mode: "light" | "dark";
  item: ApprovalItem;
  canApprove: boolean;
  onApproveOnce: () => void;
  onDecline: (reason: string, note?: string) => void;
  onAlwaysAllow: () => void;
}) {
  const ageMin = minutesAgo(item.requestedAt);
  const agingTone = ageMin >= 20 ? EVZ.orange : alpha(EVZ.ink, 0.7);

  const [declineReason, setDeclineReason] = useState(item.declineReason ?? "");
  const [note, setNote] = useState(item.note ?? "");

  useEffect(() => {
    setDeclineReason(item.declineReason ?? "");
    setNote(item.note ?? "");
  }, [item.id, item.declineReason, item.note]);

  const typeIcon =
    item.type === "Purchase" ? <Store fontSize="small" /> : item.type === "School" ? <School fontSize="small" /> : item.type === "Fund" ? <Notifications fontSize="small" /> : <Settings fontSize="small" />;

  return (
    <Card
      variant="outlined"
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
    >
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
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
              {typeIcon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {item.vendor} • {item.category} • {timeAgo(item.requestedAt)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Chip
              size="small"
              label={item.type}
              sx={{
                fontWeight: 900,
                bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
              }}
            />
            <Chip
              size="small"
              label={`Waiting ${ageMin}m`}
              sx={{
                fontWeight: 900,
                bgcolor: alpha(agingTone, 0.12),
                color: agingTone,
                border: `1px solid ${alpha(agingTone, 0.22)}`,
              }}
            />
            {item.amount > 0 ? (
              <Chip
                size="small"
                label={fmtMoney(item.amount, item.currency)}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(EVZ.green, 0.10),
                  color: EVZ.green,
                  border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                }}
              />
            ) : (
              <Chip
                size="small"
                label="No amount"
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(EVZ.ink, 0.06),
                  border: `1px solid ${alpha(EVZ.ink, 0.10)}`,
                }}
              />
            )}
          </Stack>
        </Stack>

        {item.policyHint ? (
          <Alert severity="info" icon={<Info />} sx={{ mt: 1.4 }}>
            {item.policyHint}
          </Alert>
        ) : null}

        <Divider sx={{ my: 1.4 }} />

        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <TextField
              select
              label="Decline reason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              fullWidth
              helperText="Choose a template for fast decisions."
            >
              <MenuItem value="">None</MenuItem>
              {REASON_TEMPLATES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              helperText="Used in audit logs and can be shared with the child." 
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.4 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={onApproveOnce}
            disabled={!canApprove}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.1 }}
          >
            Approve once
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Close />}
            onClick={() => onDecline(declineReason || "Other", note)}
            disabled={!canApprove}
            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.1 }}
          >
            Decline
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 1.2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Rule />}
            onClick={onAlwaysAllow}
            disabled={!canApprove}
            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green, py: 1.1 }}
          >
            Always allow (create rule)
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReportProblem />}
            onClick={() => alert("Open audit and evidence panel")}
            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.1 }}
          >
            Audit / Evidence
          </Button>
        </Stack>

        {!canApprove ? (
          <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
            You currently have viewer-only access.
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
