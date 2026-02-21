import React, { useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
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
  Close,
  Download,
  Info,
  Layers,
  Notifications,
  School,
  Settings,
  Shield,
  Sparkles,
  Tune,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Family Settings Defaults (Premium)
 * Route: /parent/edupocket/household/defaults
 * Includes:
 * - DefaultTemplatesPanel (baseline rules for new child)
 * - DefaultNotificationPrefsPanel
 * - DefaultCampusPolicyPanel
 * - ApplyDefaultsWizard (optional apply to existing children)
 * - Conflict summary state before applying
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  template: AgeTemplate;
  campusOnly: boolean;
  quietOverride: boolean;
  lockedStudentAlerts: boolean;
};

type AgeTemplate = "Child" | "Teen" | "Young adult" | "Custom";

type DefaultRules = {
  template: AgeTemplate;
  perTxn: number;
  daily: number;
  weekly: number;
  approvalsThreshold: number;
  campusOnly: boolean;
  allowOffCampusVendors: boolean;
  lockStudentAlerts: boolean;
};

type NotificationDefaults = {
  parentMode: "Approvals only" | "Declines only" | "Every transaction" | "Large transactions";
  largeTxnThreshold: number;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  quietDays: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
  studentLowBalance: boolean;
  studentNearingLimit: boolean;
};

type CampusDefaults = {
  campusOnly: boolean;
  allowOffCampusVendors: boolean;
  defaultAllowedCategories: Array<"Food" | "Books" | "Transport" | "Fees" | "Other">;
  offCampusRequiresApproval: boolean;
};

type ApplyScope = "New children only" | "Apply to existing";

type ApplyAreas = {
  rules: boolean;
  notifications: boolean;
  campusPolicy: boolean;
};

type Conflict = {
  childId: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", template: "Child", campusOnly: true, quietOverride: false, lockedStudentAlerts: true },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", template: "Teen", campusOnly: true, quietOverride: true, lockedStudentAlerts: true },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", template: "Custom", campusOnly: false, quietOverride: false, lockedStudentAlerts: false },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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
        MuiButton: { styleOverrides: { root: { borderRadius: 14, boxShadow: "none" } } },
      },
    });
  }, [mode]);
  return { theme, mode, setMode };
}

function AppShell({ mode, onToggleMode, children }: { mode: "light" | "dark"; onToggleMode: () => void; children: React.ReactNode }) {
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
                <Layers fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Family Settings Defaults
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Household">
                <IconButton
                  onClick={() => alert("Navigate: /parent/edupocket/household")}
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

function fmtMoney(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

function templateDefaults(t: AgeTemplate): Pick<DefaultRules, "perTxn" | "daily" | "weekly" | "approvalsThreshold" | "campusOnly" | "allowOffCampusVendors" | "lockStudentAlerts"> {
  if (t === "Child") {
    return { perTxn: 15000, daily: 30000, weekly: 120000, approvalsThreshold: 5000, campusOnly: true, allowOffCampusVendors: false, lockStudentAlerts: true };
  }
  if (t === "Teen") {
    return { perTxn: 30000, daily: 60000, weekly: 240000, approvalsThreshold: 15000, campusOnly: true, allowOffCampusVendors: true, lockStudentAlerts: true };
  }
  if (t === "Young adult") {
    return { perTxn: 60000, daily: 120000, weekly: 480000, approvalsThreshold: 30000, campusOnly: false, allowOffCampusVendors: true, lockStudentAlerts: false };
  }
  // Custom keeps current values
  return { perTxn: 20000, daily: 40000, weekly: 150000, approvalsThreshold: 10000, campusOnly: true, allowOffCampusVendors: false, lockStudentAlerts: true };
}

export default function EduPocketFamilyDefaults() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [defaults, setDefaults] = useState<DefaultRules>(() => ({ template: "Child", ...templateDefaults("Child") }));
  const [notifDefaults, setNotifDefaults] = useState<NotificationDefaults>({
    parentMode: "Approvals only",
    largeTxnThreshold: 50000,
    quietHoursEnabled: true,
    quietStart: "20:00",
    quietEnd: "06:00",
    quietDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    studentLowBalance: true,
    studentNearingLimit: true,
  });

  const [campusDefaults, setCampusDefaults] = useState<CampusDefaults>({
    campusOnly: true,
    allowOffCampusVendors: false,
    defaultAllowedCategories: ["Food", "Books", "Transport", "Fees"],
    offCampusRequiresApproval: true,
  });

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyScope, setApplyScope] = useState<ApplyScope>("New children only");
  const [applyAreas, setApplyAreas] = useState<ApplyAreas>({ rules: true, notifications: true, campusPolicy: true });
  const [selectedChildren, setSelectedChildren] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const c of CHILDREN) m[c.id] = true;
    return m;
  });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const conflicts = useMemo<Conflict[]>(() => {
    if (applyScope !== "Apply to existing") return [];
    const out: Conflict[] = [];

    const selectedIds = Object.entries(selectedChildren)
      .filter(([, v]) => v)
      .map(([id]) => id);

    for (const c of CHILDREN.filter((x) => selectedIds.includes(x.id))) {
      if (applyAreas.rules) {
        if (c.template === "Custom") {
          out.push({
            childId: c.id,
            severity: "warning",
            title: "Custom rules will be overwritten",
            detail: `${c.name} currently has Custom rules. Applying defaults will replace custom values.`,
          });
        }
        if (defaults.template !== c.template) {
          out.push({
            childId: c.id,
            severity: "info",
            title: "Template change",
            detail: `Template will change from ${c.template} to ${defaults.template}.`,
          });
        }
      }

      if (applyAreas.campusPolicy) {
        if (c.campusOnly !== campusDefaults.campusOnly) {
          out.push({
            childId: c.id,
            severity: "info",
            title: "Campus policy change",
            detail: `Campus-only will change from ${c.campusOnly ? "On" : "Off"} to ${campusDefaults.campusOnly ? "On" : "Off"}.`,
          });
        }
      }

      if (applyAreas.notifications) {
        if (c.lockedStudentAlerts !== defaults.lockStudentAlerts) {
          out.push({
            childId: c.id,
            severity: "info",
            title: "Student alerts lock change",
            detail: `Student alert lock will change from ${c.lockedStudentAlerts ? "On" : "Off"} to ${defaults.lockStudentAlerts ? "On" : "Off"}.`,
          });
        }
      }
    }

    return out;
  }, [applyScope, applyAreas, selectedChildren, defaults.template, campusDefaults.campusOnly, defaults.lockStudentAlerts]);

  const warningCount = conflicts.filter((c) => c.severity === "warning").length;

  const resetDefaults = () => {
    const base = { template: "Child" as AgeTemplate, ...templateDefaults("Child") };
    setDefaults(base);
    setNotifDefaults({
      parentMode: "Approvals only",
      largeTxnThreshold: 50000,
      quietHoursEnabled: true,
      quietStart: "20:00",
      quietEnd: "06:00",
      quietDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      studentLowBalance: true,
      studentNearingLimit: true,
    });
    setCampusDefaults({
      campusOnly: true,
      allowOffCampusVendors: false,
      defaultAllowedCategories: ["Food", "Books", "Transport", "Fees"],
      offCampusRequiresApproval: true,
    });
    toast("Defaults reset", "info");
  };

  const saveDefaults = () => {
    toast("Defaults saved", "success");
  };

  const openWizard = () => {
    setApplyOpen(true);
    setApplyStep(0);
    setApplyScope("New children only");
    setApplyAreas({ rules: true, notifications: true, campusPolicy: true });
    const m: Record<string, boolean> = {};
    for (const c of CHILDREN) m[c.id] = true;
    setSelectedChildren(m);
  };

  const next = () => {
    if (applyStep === 0 && applyScope === "Apply to existing") {
      const selectedAny = Object.values(selectedChildren).some(Boolean);
      if (!selectedAny) return toast("Select at least one child", "warning");
    }
    if (applyStep === 1 && warningCount > 0) {
      // allow continue but warn
      toast("Review warnings carefully before applying", "warning");
    }
    setApplyStep((s) => Math.min(2, s + 1));
  };

  const back = () => setApplyStep((s) => Math.max(0, s - 1));

  const apply = () => {
    toast("Defaults applied", "success");
    setApplyOpen(false);
  };

  const exportDefaults = () => {
    const payload = {
      defaults,
      notifications: notifDefaults,
      campusPolicy: campusDefaults,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edupocket_family_defaults_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export ready", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}>
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Family defaults</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set baseline rules that apply to new children. Optionally apply to existing children.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportDefaults}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={resetDefaults}
                      sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Sparkles />}
                      onClick={openWizard}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Apply defaults
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={saveDefaults}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Grid container spacing={2.2}>
                  {/* Default templates */}
                  <Grid item xs={12} lg={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Default templates</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Baseline rules for any new child profile.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.6}>
                          <TextField
                            select
                            label="Template"
                            value={defaults.template}
                            onChange={(e) => {
                              const t = e.target.value as AgeTemplate;
                              setDefaults((p) => ({ ...p, template: t, ...templateDefaults(t) }));
                              toast(`Template set: ${t}`, "success");
                            }}
                          >
                            {(["Child", "Teen", "Young adult", "Custom"] as const).map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </TextField>

                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                              <NumberField label="Per transaction" value={defaults.perTxn} onChange={(v) => setDefaults((p) => ({ ...p, perTxn: v }))} prefix="UGX" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <NumberField label="Daily" value={defaults.daily} onChange={(v) => setDefaults((p) => ({ ...p, daily: v }))} prefix="UGX" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <NumberField label="Weekly" value={defaults.weekly} onChange={(v) => setDefaults((p) => ({ ...p, weekly: v }))} prefix="UGX" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <NumberField label="Approval threshold" value={defaults.approvalsThreshold} onChange={(v) => setDefaults((p) => ({ ...p, approvalsThreshold: v }))} prefix="UGX" />
                            </Grid>
                          </Grid>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack spacing={1.1}>
                                <ToggleLine
                                  label="Campus-only"
                                  caption="New children default to school-vendor only."
                                  checked={defaults.campusOnly}
                                  onChange={(v) => setDefaults((p) => ({ ...p, campusOnly: v }))}
                                />
                                <ToggleLine
                                  label="Allow off-campus vendors"
                                  caption="If on, off-campus vendors may be allowed (still controlled by vendor rules)."
                                  checked={defaults.allowOffCampusVendors}
                                  onChange={(v) => setDefaults((p) => ({ ...p, allowOffCampusVendors: v }))}
                                  disabled={defaults.campusOnly}
                                />
                                <ToggleLine
                                  label="Lock student alert settings"
                                  caption="Student cannot edit low-balance and limit alerts."
                                  checked={defaults.lockStudentAlerts}
                                  onChange={(v) => setDefaults((p) => ({ ...p, lockStudentAlerts: v }))}
                                />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Alert severity="info" icon={<Info />}>
                            Rule priority: System rules, then School rules, then Parent defaults, then Student permissions.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Default notifications */}
                  <Grid item xs={12} lg={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Default notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Baseline alert preferences applied to new children.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.6}>
                          <TextField
                            select
                            label="Parent alert mode"
                            value={notifDefaults.parentMode}
                            onChange={(e) => setNotifDefaults((p) => ({ ...p, parentMode: e.target.value as any }))}
                          >
                            {(["Approvals only", "Declines only", "Every transaction", "Large transactions"] as const).map((m) => (
                              <MenuItem key={m} value={m}>
                                {m}
                              </MenuItem>
                            ))}
                          </TextField>

                          {notifDefaults.parentMode === "Large transactions" ? (
                            <NumberField
                              label="Large transaction threshold"
                              value={notifDefaults.largeTxnThreshold}
                              onChange={(v) => setNotifDefaults((p) => ({ ...p, largeTxnThreshold: v }))}
                              prefix="UGX"
                            />
                          ) : null}

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                Quiet hours defaults
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Applied to children unless a child override is set.
                              </Typography>
                              <Divider sx={{ my: 1.2 }} />
                              <ToggleLine
                                label="Enable quiet hours"
                                checked={notifDefaults.quietHoursEnabled}
                                onChange={(v) => setNotifDefaults((p) => ({ ...p, quietHoursEnabled: v }))}
                              />
                              <Grid container spacing={1.2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="Start"
                                    type="time"
                                    value={notifDefaults.quietStart}
                                    onChange={(e) => setNotifDefaults((p) => ({ ...p, quietStart: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    disabled={!notifDefaults.quietHoursEnabled}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="End"
                                    type="time"
                                    value={notifDefaults.quietEnd}
                                    onChange={(e) => setNotifDefaults((p) => ({ ...p, quietEnd: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    disabled={!notifDefaults.quietHoursEnabled}
                                  />
                                </Grid>
                              </Grid>
                              <Divider sx={{ my: 1.2 }} />
                              <Typography variant="caption" color="text.secondary">
                                Days
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
                                {DAYS.map((d) => {
                                  const on = notifDefaults.quietDays.includes(d);
                                  return (
                                    <Chip
                                      key={d}
                                      label={d}
                                      clickable
                                      onClick={() =>
                                        setNotifDefaults((p) => ({
                                          ...p,
                                          quietDays: on ? p.quietDays.filter((x) => x !== d) : [...p.quietDays, d],
                                        }))
                                      }
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: on ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                        color: on ? EVZ.green : "text.primary",
                                        border: `1px solid ${alpha(on ? EVZ.green : EVZ.ink, on ? 0.22 : mode === "dark" ? 0.25 : 0.10)}`,
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            </CardContent>
                          </Card>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                Student alerts defaults
                              </Typography>
                              <Divider sx={{ my: 1.2 }} />
                              <Stack spacing={1.1}>
                                <ToggleLine
                                  label="Low balance warnings"
                                  checked={notifDefaults.studentLowBalance}
                                  onChange={(v) => setNotifDefaults((p) => ({ ...p, studentLowBalance: v }))}
                                />
                                <ToggleLine
                                  label="Nearing limit warnings"
                                  checked={notifDefaults.studentNearingLimit}
                                  onChange={(v) => setNotifDefaults((p) => ({ ...p, studentNearingLimit: v }))}
                                />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Alert severity="info" icon={<Info />}>
                            Quiet hours suppress popups only. Notifications remain in logs.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Campus policy panel */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">Default campus policy</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applies when a new child is created or linked.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={2.2}>
                      <Grid item xs={12} lg={6}>
                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
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
                                <School fontSize="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                                  Campus policy
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Control off-campus vendors and approvals.
                                </Typography>
                              </Box>
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            <Stack spacing={1.1}>
                              <ToggleLine
                                label="Campus-only mode"
                                checked={campusDefaults.campusOnly}
                                onChange={(v) => setCampusDefaults((p) => ({ ...p, campusOnly: v }))}
                              />
                              <ToggleLine
                                label="Allow off-campus vendors"
                                checked={campusDefaults.allowOffCampusVendors}
                                onChange={(v) => setCampusDefaults((p) => ({ ...p, allowOffCampusVendors: v }))}
                                disabled={campusDefaults.campusOnly}
                              />
                              <ToggleLine
                                label="Off-campus requires approval"
                                checked={campusDefaults.offCampusRequiresApproval}
                                onChange={(v) => setCampusDefaults((p) => ({ ...p, offCampusRequiresApproval: v }))}
                                disabled={!campusDefaults.allowOffCampusVendors}
                              />
                            </Stack>

                            <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
                              Off-campus vendors can still be blocked individually in Vendor Controls.
                            </Alert>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} lg={6}>
                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                              Default allowed categories
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Categories not selected are blocked by default for new children.
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {(["Food", "Books", "Transport", "Fees", "Other"] as const).map((c) => {
                                const on = campusDefaults.defaultAllowedCategories.includes(c);
                                return (
                                  <Chip
                                    key={c}
                                    label={c}
                                    clickable
                                    onClick={() =>
                                      setCampusDefaults((p) => ({
                                        ...p,
                                        defaultAllowedCategories: on
                                          ? p.defaultAllowedCategories.filter((x) => x !== c)
                                          : [...p.defaultAllowedCategories, c],
                                      }))
                                    }
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: on ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                      color: on ? EVZ.green : "text.primary",
                                      border: `1px solid ${alpha(on ? EVZ.green : EVZ.ink, on ? 0.22 : mode === "dark" ? 0.25 : 0.10)}`,
                                    }}
                                  />
                                );
                              })}
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            <Typography variant="caption" color="text.secondary">
                              Current: <b>{campusDefaults.defaultAllowedCategories.length}</b> allowed
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Alert severity="info" icon={<Info />}>
                  Tip: keep defaults conservative. You can loosen them per child after onboarding.
                </Alert>
              </Stack>
            </CardContent>
          </Card>

          {/* Apply Defaults Wizard */}
          <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Apply defaults wizard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Apply defaults to existing children (optional).
                  </Typography>
                </Stack>
                <IconButton onClick={() => setApplyOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stepper activeStep={applyStep} alternativeLabel>
                  {["Scope", "Conflict summary", "Apply"].map((s) => (
                    <Step key={s}>
                      <StepLabel>{s}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {applyStep === 0 ? (
                  <Stack spacing={1.6}>
                    <TextField select label="Scope" value={applyScope} onChange={(e) => setApplyScope(e.target.value as any)}>
                      <MenuItem value="New children only">New children only</MenuItem>
                      <MenuItem value="Apply to existing">Apply to existing children</MenuItem>
                    </TextField>

                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Areas to apply
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />
                        <Stack spacing={0.8}>
                          <FormControlLabel control={<Checkbox checked={applyAreas.rules} onChange={(e) => setApplyAreas((p) => ({ ...p, rules: e.target.checked }))} />} label="Rules (limits + approvals baseline)" />
                          <FormControlLabel control={<Checkbox checked={applyAreas.notifications} onChange={(e) => setApplyAreas((p) => ({ ...p, notifications: e.target.checked }))} />} label="Notifications" />
                          <FormControlLabel control={<Checkbox checked={applyAreas.campusPolicy} onChange={(e) => setApplyAreas((p) => ({ ...p, campusPolicy: e.target.checked }))} />} label="Campus policy" />
                        </Stack>
                      </CardContent>
                    </Card>

                    {applyScope === "Apply to existing" ? (
                      <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            Select children
                          </Typography>
                          <Divider sx={{ my: 1.2 }} />
                          <Stack spacing={0.8}>
                            {CHILDREN.map((c) => (
                              <FormControlLabel
                                key={c.id}
                                control={
                                  <Checkbox
                                    checked={Boolean(selectedChildren[c.id])}
                                    onChange={(e) => setSelectedChildren((p) => ({ ...p, [c.id]: e.target.checked }))}
                                  />
                                }
                                label={`${c.name} (${c.school} • ${c.className})`}
                              />
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert severity="info" icon={<Info />}>
                        This will only affect new child accounts going forward.
                      </Alert>
                    )}

                    <Alert severity="info" icon={<Info />}>
                      Next you will review a conflict summary before applying.
                    </Alert>
                  </Stack>
                ) : null}

                {applyStep === 1 ? (
                  <Stack spacing={1.6}>
                    {applyScope === "New children only" ? (
                      <Alert severity="success" icon={<CheckCircle />}>
                        No conflicts. Defaults will apply to new children only.
                      </Alert>
                    ) : (
                      <>
                        <Card variant="outlined" sx={{ bgcolor: alpha(EVZ.orange, 0.06), borderColor: alpha(EVZ.orange, 0.22) }}>
                          <CardContent>
                            <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                              <Stack direction="row" spacing={1.2} alignItems="center">
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2.6,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha(EVZ.orange, 0.12),
                                    color: EVZ.orange,
                                    border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                                  }}
                                >
                                  <WarningAmber fontSize="small" />
                                </Box>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                                    Conflict summary
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Review changes before applying.
                                  </Typography>
                                </Box>
                              </Stack>
                              <Chip size="small" label={`${conflicts.length} issue(s)`} sx={{ fontWeight: 900 }} />
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            {conflicts.length === 0 ? (
                              <Alert severity="success" icon={<CheckCircle />}>
                                No conflicts detected.
                              </Alert>
                            ) : (
                              <Stack spacing={1}>
                                {conflicts.slice(0, 10).map((c) => {
                                  const tone = c.severity === "warning" ? EVZ.orange : EVZ.green;
                                  const childName = CHILDREN.find((x) => x.id === c.childId)?.name ?? "Child";
                                  return (
                                    <Card key={`${c.childId}_${c.title}`} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.22) }}>
                                      <CardContent>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                          {childName}: {c.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {c.detail}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </Stack>
                            )}

                            <Divider sx={{ my: 1.2 }} />

                            <Alert severity={warningCount > 0 ? "warning" : "info"} icon={<Info />}>
                              {warningCount > 0
                                ? "Warnings indicate custom settings may be overwritten."
                                : "No critical conflicts. You can proceed."}
                            </Alert>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </Stack>
                ) : null}

                {applyStep === 2 ? (
                  <Stack spacing={1.6}>
                    <Alert severity="info" icon={<Info />}>
                      You are about to apply defaults.
                    </Alert>

                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Summary
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />
                        <Typography variant="body2">
                          Scope: <b>{applyScope}</b>
                        </Typography>
                        <Typography variant="body2">
                          Areas: <b>{Object.entries(applyAreas).filter(([, v]) => v).map(([k]) => k).join(", ") || "None"}</b>
                        </Typography>
                        {applyScope === "Apply to existing" ? (
                          <Typography variant="body2">
                            Children: <b>{Object.entries(selectedChildren).filter(([, v]) => v).length}</b> selected
                          </Typography>
                        ) : null}
                        <Divider sx={{ my: 1.2 }} />
                        <Alert severity={warningCount > 0 ? "warning" : "success"} icon={warningCount > 0 ? <WarningAmber /> : <CheckCircle />}>
                          {warningCount > 0
                            ? "Some children have custom settings that will be overwritten."
                            : "No critical conflicts detected."}
                        </Alert>
                      </CardContent>
                    </Card>

                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={apply}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                      fullWidth
                    >
                      Apply now
                    </Button>

                    <Alert severity="info" icon={<Info />}>
                      Actions are logged. You can roll back by re-applying a different default set.
                    </Alert>
                  </Stack>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApplyOpen(false)}>Close</Button>
              <Button onClick={back} disabled={applyStep === 0}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={next}
                disabled={applyStep === 2}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
              >
                Continue
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
              {snack.msg}
            </Alert>
          </Snackbar>
        </Container>
      </AppShell>
    </ThemeProvider>
  );
}

function ToggleLine({
  label,
  caption,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  caption?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Box>
        <Typography variant="body2">{label}</Typography>
        {caption ? (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        ) : null}
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </Stack>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix: string;
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
      InputProps={{ startAdornment: <InputAdornment position="start">{prefix}</InputAdornment> }}
      fullWidth
    />
  );
}
