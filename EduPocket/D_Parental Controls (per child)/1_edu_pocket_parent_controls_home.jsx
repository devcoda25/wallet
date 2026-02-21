import React, { useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowForward,
  CheckCircle,
  Info,
  Lock,
  Notifications,
  Payments,
  Security,
  Settings,
  Shield,
  Store,
  Tune,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Controls Home (Premium)
 * Route: /parent/edupocket/children/:childId/controls
 * Includes:
 * - RulesAtAGlanceGrid (toggle cards)
 * - AgeTemplatePicker (Child/Teen/Young adult/Custom)
 * - RulePriorityExplainer (System > School > Parent > Student)
 * - TestPurchaseSimulator (simulate vendor/category/amount/time -> pass/fail + reason)
 * - State: school policy missing
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  currency: "UGX" | "USD";
};

type AgeTemplate = "Child" | "Teen" | "Young adult" | "Custom";

type RuleToggles = {
  limits: boolean;
  approvals: boolean;
  vendors: boolean;
  schedule: boolean;
  safety: boolean;
  transfers: boolean;
  online: boolean;
  notifications: boolean;
};

type ControlsModel = {
  template: AgeTemplate;
  schoolPolicyConfigured: boolean;
  perTxnLimit: number;
  approvalThreshold: number;
  allowedStart: string;
  allowedEnd: string;
  vendorsMode: "Approved only" | "Allowlist";
  approvedVendors: string[];
  toggles: RuleToggles;
};

type SimInput = {
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Fees" | "Other";
  amount: number;
  time: string;
  isSchoolZone: boolean;
};

type SimResult = {
  status: "PASS" | "NEEDS_APPROVAL" | "BLOCKED";
  reason: string;
  suggestion?: string;
};

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
                <Tune fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket - Controls
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
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

function templateDefaults(t: AgeTemplate): Partial<ControlsModel> {
  if (t === "Child") {
    return { perTxnLimit: 15000, approvalThreshold: 5000, vendorsMode: "Approved only", allowedStart: "07:00", allowedEnd: "18:30" };
  }
  if (t === "Teen") {
    return { perTxnLimit: 30000, approvalThreshold: 15000, vendorsMode: "Approved only", allowedStart: "06:30", allowedEnd: "20:00" };
  }
  if (t === "Young adult") {
    return { perTxnLimit: 60000, approvalThreshold: 30000, vendorsMode: "Allowlist", allowedStart: "06:00", allowedEnd: "21:30" };
  }
  return {};
}

export default function EduPocketControlsHome() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [model, setModel] = useState<ControlsModel>({
    template: "Child",
    schoolPolicyConfigured: true,
    perTxnLimit: 15000,
    approvalThreshold: 5000,
    allowedStart: "07:00",
    allowedEnd: "18:30",
    vendorsMode: "Approved only",
    approvedVendors: ["School Canteen", "Campus Bookshop", "School Transport"],
    toggles: {
      limits: true,
      approvals: true,
      vendors: true,
      schedule: true,
      safety: true,
      transfers: false,
      online: false,
      notifications: true,
    },
  });

  const [sim, setSim] = useState<SimInput>({
    vendor: "School Canteen",
    category: "Food",
    amount: 6000,
    time: "12:30",
    isSchoolZone: true,
  });
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const vendors = useMemo(() => ["School Canteen", "Campus Bookshop", "School Transport", "Uniform Store", "New Snack Kiosk"], []);

  const applyTemplate = (t: AgeTemplate) => {
    setModel((p) => ({
      ...p,
      template: t,
      ...templateDefaults(t),
    }));
    toast(`Template applied: ${t}`, "success");
  };

  const simulate = () => {
    const schoolMissing = !model.schoolPolicyConfigured;

    // helper time compare
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map((x) => parseInt(x, 10));
      return (h || 0) * 60 + (m || 0);
    };

    const cur = toMin(sim.time);
    const start = toMin(model.allowedStart);
    const end = toMin(model.allowedEnd);

    // schedule gate
    if (model.toggles.schedule) {
      const inWindow = start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
      if (!inWindow) {
        return setSimResult({
          status: "BLOCKED",
          reason: "Outside allowed hours",
          suggestion: `Adjust schedule or try within ${model.allowedStart} to ${model.allowedEnd}.`,
        });
      }
    }

    // vendors gate
    if (model.toggles.vendors) {
      if (model.vendorsMode === "Approved only" && !model.approvedVendors.includes(sim.vendor)) {
        return setSimResult({
          status: "BLOCKED",
          reason: "Vendor not allowed",
          suggestion: "Add vendor to allowlist or switch to allowlist mode.",
        });
      }
    }

    // limits gate
    if (model.toggles.limits) {
      if (sim.amount > model.perTxnLimit) {
        return setSimResult({
          status: "BLOCKED",
          reason: "Exceeds per-transaction limit",
          suggestion: `Increase per-transaction limit or require approval above ${fmtMoney(model.perTxnLimit, child.currency)}.`,
        });
      }
    }

    // approvals gate
    if (model.toggles.approvals) {
      if (sim.amount > model.approvalThreshold) {
        return setSimResult({
          status: "NEEDS_APPROVAL",
          reason: "Requires guardian approval",
          suggestion: "Create an auto-approval rule for this vendor/category or raise the threshold.",
        });
      }
    }

    // safety signal
    if (model.toggles.safety && !sim.isSchoolZone) {
      return setSimResult({
        status: "NEEDS_APPROVAL",
        reason: "Outside school zone",
        suggestion: "Enable school-only spending or set a geofence rule.",
      });
    }

    // school policy note
    if (schoolMissing) {
      return setSimResult({
        status: "PASS",
        reason: "Pass (school rules missing)",
        suggestion: "Configure school rules for better enforcement.",
      });
    }

    return setSimResult({ status: "PASS", reason: "Pass", suggestion: "No action required." });
  };

  const rules = useMemo(
    () => [
      { key: "limits", title: "Spending limits", desc: `Per txn: ${fmtMoney(model.perTxnLimit, child.currency)}`, icon: <Payments fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/limits" },
      { key: "approvals", title: "Approval rules", desc: `Threshold: ${fmtMoney(model.approvalThreshold, child.currency)}`, icon: <VerifiedUser fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/approvals" },
      { key: "vendors", title: "Vendors and categories", desc: model.vendorsMode, icon: <Store fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/vendors" },
      { key: "schedule", title: "Schedule controls", desc: `${model.allowedStart} to ${model.allowedEnd}`, icon: <Settings fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/schedule" },
      { key: "safety", title: "Safety controls", desc: "Geofences and curfews", icon: <Security fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/safety" },
      { key: "transfers", title: "Transfers", desc: "Peer and cash rules", icon: <Payments fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/transfers" },
      { key: "online", title: "Online purchases", desc: "Virtual card and subscriptions", icon: <Lock fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/online" },
      { key: "notifications", title: "Notifications", desc: "Alerts and nudges", icon: <Notifications fontSize="small" />, route: "/parent/edupocket/children/:childId/controls/notifications" },
    ],
    [model, child.currency]
  );

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
                    <Typography variant="h5">Controls</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rules summary, templates and a purchase simulator.
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

                    <Card
                      variant="outlined"
                      sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <VerifiedUser fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                          School rules configured
                        </Typography>
                        <Switch
                          size="small"
                          checked={model.schoolPolicyConfigured}
                          onChange={(e) => setModel((p) => ({ ...p, schoolPolicyConfigured: e.target.checked }))}
                        />
                      </Stack>
                    </Card>
                  </Stack>
                </Stack>

                <Divider />

                <AnimatePresence initial={false}>
                  {!model.schoolPolicyConfigured ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert severity="warning" icon={<WarningAmber />}
                        sx={{ mb: 1.2 }}
                      >
                        School rules not configured. Some enforcement will fall back to parent rules only.
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Age template picker */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                      <Box>
                        <Typography variant="h6">Age template</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quick defaults that you can customize.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(["Child", "Teen", "Young adult", "Custom"] as const).map((t) => {
                          const active = model.template === t;
                          return (
                            <Chip
                              key={t}
                              label={t}
                              clickable
                              onClick={() => applyTemplate(t)}
                              sx={{
                                fontWeight: 900,
                                bgcolor: active ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, 0.06),
                                color: active ? EVZ.green : "text.primary",
                                border: `1px solid ${alpha(active ? EVZ.green : EVZ.ink, active ? 0.22 : 0.10)}`,
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.2 }} />

                    <Typography variant="caption" color="text.secondary">
                      Current defaults: per txn {fmtMoney(model.perTxnLimit, child.currency)} • approval threshold {fmtMoney(model.approvalThreshold, child.currency)} • schedule {model.allowedStart}-{model.allowedEnd}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Rules at a glance */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">Rules at a glance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toggle major rulesets and jump to configuration.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.6}>
                      {rules.map((r) => (
                        <Grid key={r.key} item xs={12} md={6} lg={3}>
                          <RuleTile
                            mode={mode}
                            title={r.title}
                            desc={r.desc}
                            icon={r.icon}
                            enabled={model.toggles[r.key as keyof RuleToggles]}
                            onToggle={(v) => setModel((p) => ({ ...p, toggles: { ...p.toggles, [r.key]: v } }))}
                            onOpen={() => alert(`Navigate: ${r.route}`)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Priority explainer + simulator */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Rule priority</Typography>
                        <Typography variant="body2" color="text.secondary">
                          How decisions are made when rules overlap.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          <PriorityRow label="System safety rules" tone={EVZ.green} desc="Non-negotiable platform protections." />
                          <PriorityRow label="School rules" tone={EVZ.orange} desc="School-wide policies and vendor approvals." />
                          <PriorityRow label="Parent rules" tone={EVZ.green} desc="Your limits, schedules, allowlists and approvals." />
                          <PriorityRow label="Student permissions" tone={alpha(EVZ.ink, 0.7)} desc="What the child can do within above limits." />

                          <Alert severity="info" icon={<Info />}>
                            The strictest rule wins. Example: School allows vendor, parent blocks vendor, result is blocked.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Test purchase simulator</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Simulate a purchase to see pass, needs approval, or blocked.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.2}>
                          <Grid item xs={12} md={6}>
                            <TextField select label="Vendor" value={sim.vendor} onChange={(e) => setSim((p) => ({ ...p, vendor: e.target.value }))} fullWidth>
                              {vendors.map((v) => (
                                <MenuItem key={v} value={v}>
                                  {v}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField select label="Category" value={sim.category} onChange={(e) => setSim((p) => ({ ...p, category: e.target.value as any }))} fullWidth>
                              {(["Food", "Books", "Transport", "Fees", "Other"] as const).map((c) => (
                                <MenuItem key={c} value={c}>
                                  {c}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Amount"
                              type="number"
                              value={sim.amount}
                              onChange={(e) => setSim((p) => ({ ...p, amount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                              InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Time"
                              type="time"
                              value={sim.time}
                              onChange={(e) => setSim((p) => ({ ...p, time: e.target.value }))}
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), height: "100%" }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                      School zone
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Simulate geofence.
                                    </Typography>
                                  </Box>
                                  <Switch checked={sim.isSchoolZone} onChange={(e) => setSim((p) => ({ ...p, isSchoolZone: e.target.checked }))} />
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1.6 }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                          <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={simulate}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Simulate
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => {
                              setSimResult(null);
                              toast("Reset simulator", "info");
                            }}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}
                            fullWidth
                          >
                            Reset
                          </Button>
                        </Stack>

                        <AnimatePresence initial={false}>
                          {simResult ? (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                              <Divider sx={{ my: 1.6 }} />
                              <SimResultCard result={simResult} mode={mode} />
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function RuleTile({
  mode,
  title,
  desc,
  icon,
  enabled,
  onToggle,
  onOpen,
}: {
  mode: "light" | "dark";
  title: string;
  desc: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <Card
      variant="outlined"
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(enabled ? EVZ.green : EVZ.ink, enabled ? 0.12 : 0.06),
                color: enabled ? EVZ.green : "text.primary",
                border: `1px solid ${alpha(enabled ? EVZ.green : EVZ.ink, enabled ? 0.22 : 0.10)}`,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {desc}
              </Typography>
            </Box>
          </Stack>
          <Switch checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        </Stack>

        <Divider sx={{ my: 1.2 }} />

        <Button
          variant="outlined"
          startIcon={<Settings fontSize="small" />}
          onClick={onOpen}
          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
          fullWidth
        >
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}

function PriorityRow({ label, tone, desc }: { label: string; tone: string; desc: string }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
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
                bgcolor: alpha(tone, 0.12),
                color: tone,
                border: `1px solid ${alpha(tone, 0.22)}`,
              }}
            >
              <VerifiedUser fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {desc}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SimResultCard({ result, mode }: { result: SimResult; mode: "light" | "dark" }) {
  const tone = result.status === "PASS" ? EVZ.green : result.status === "NEEDS_APPROVAL" ? EVZ.orange : "#ff4d4f";
  const icon = result.status === "PASS" ? <CheckCircle fontSize="small" /> : result.status === "NEEDS_APPROVAL" ? <VerifiedUser fontSize="small" /> : <Lock fontSize="small" />;

  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.22) }}>
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(tone, 0.12),
              color: tone,
              border: `1px solid ${alpha(tone, 0.22)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              {result.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {result.reason}
            </Typography>
            {result.suggestion ? (
              <Typography variant="caption" color="text.secondary">
                Suggestion: {result.suggestion}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Divider sx={{ my: 1.2 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Tune />}
            onClick={() => alert("Create a rule based on this simulation")}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Create rule from result
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Info />}
            onClick={() => alert("Open controls explanation")}
            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
          >
            Explain
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
