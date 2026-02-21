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
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowForward,
  CheckCircle,
  Close,
  Info,
  Insights,
  Notifications,
  Rule,
  Shield,
  Snooze,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Notifications & Nudges (Per Child) (Premium)
 * Route: /parent/edupocket/children/:childId/controls/notifications
 * Includes:
 * - ParentAlertSettings
 * - StudentAlertSettings (read-only if parent locked)
 * - CoachingInsightsPanel with "apply as rule" shortcuts
 * - State: quiet hours + per-child overrides
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string; currency: "UGX" | "USD" };

type ParentAlertMode = "Every transaction" | "Declines only" | "Approvals only" | "Large transactions";

type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  days: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
};

type StudentAlerts = {
  lowBalance: boolean;
  nearingLimit: boolean;
  approvalsStatus: boolean;
};

type CoachingSuggestion = {
  id: string;
  title: string;
  why: string;
  actionLabel: string;
  routeHint: string;
  severity: "info" | "warning";
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

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

function inQuietHours(now: Date, qh: QuietHours) {
  if (!qh.enabled) return false;
  const day = now.toLocaleDateString(undefined, { weekday: "short" }) as any;
  if (!qh.days.includes(day)) return false;

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    return (h || 0) * 60 + (m || 0);
  };

  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMin(qh.start);
  const end = toMin(qh.end);

  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end; // overnight
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
                <Notifications fontSize="small" />
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

export default function EduPocketChildNotificationsNudges() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  // Parent alerts
  const [parentMode, setParentMode] = useState<ParentAlertMode>("Approvals only");
  const [largeTxnThreshold, setLargeTxnThreshold] = useState(50000);
  const [deviceLogins, setDeviceLogins] = useState(true);
  const [schoolUpdates, setSchoolUpdates] = useState(true);

  // Student alerts
  const [parentLocksStudentAlerts, setParentLocksStudentAlerts] = useState(true);
  const [studentAlerts, setStudentAlerts] = useState<StudentAlerts>({ lowBalance: true, nearingLimit: true, approvalsStatus: true });

  // Quiet hours (global + per child override)
  const [globalQuiet, setGlobalQuiet] = useState<QuietHours>({ enabled: true, start: "20:00", end: "06:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] });
  const [useChildOverride, setUseChildOverride] = useState(false);
  const [childQuiet, setChildQuiet] = useState<QuietHours>({ enabled: true, start: "21:00", end: "06:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] });

  const effectiveQuiet = useMemo(() => (useChildOverride ? childQuiet : globalQuiet), [useChildOverride, childQuiet, globalQuiet]);
  const quietActiveNow = useMemo(() => inQuietHours(new Date(), effectiveQuiet), [effectiveQuiet]);

  const suggestions = useMemo<CoachingSuggestion[]>(
    () => [
      {
        id: "sg1",
        title: "Auto-approve canteen under 10,000",
        why: "Lunch spending is predictable and happens during lunch window.",
        actionLabel: "Apply as rule",
        routeHint: "/parent/edupocket/children/:childId/controls/approvals",
        severity: "info",
      },
      {
        id: "sg2",
        title: "Reduce per-transaction limit for Books",
        why: "A decline pattern suggests attempts above the per-txn cap.",
        actionLabel: "Open limits",
        routeHint: "/parent/edupocket/children/:childId/controls/limits",
        severity: "warning",
      },
      {
        id: "sg3",
        title: "Enable school-only spending",
        why: "Off-campus vendors were used recently outside school hours.",
        actionLabel: "Apply safety rule",
        routeHint: "/parent/edupocket/children/:childId/controls/safety",
        severity: "warning",
      },
    ],
    []
  );

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  useEffect(() => {
    // per-child demo defaults
    setParentMode(childId === "c_1" ? "Approvals only" : "Declines only");
    setLargeTxnThreshold(childId === "c_3" ? 20 : 50000);
    setParentLocksStudentAlerts(true);
    setStudentAlerts({ lowBalance: true, nearingLimit: true, approvalsStatus: true });
    setUseChildOverride(childId === "c_2");
  }, [childId]);

  const save = () => {
    toast("Notification settings saved", "success");
  };

  const applySuggestion = (s: CoachingSuggestion) => {
    if (s.id === "sg1") {
      toast("Rule created (auto-approve canteen under 10,000)", "success");
      return;
    }
    toast(`Navigate: ${s.routeHint}`, "info");
  };

  const studentToggle = (patch: Partial<StudentAlerts>) => {
    if (parentLocksStudentAlerts) return;
    setStudentAlerts((p) => ({ ...p, ...patch }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        title="EduPocket"
        subtitle="Notifications and nudges (per child)"
      >
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Notifications and nudges</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fine tune alerts per child and apply smart coaching rules.
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
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={save}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {quietActiveNow && effectiveQuiet.enabled ? (
                  <Alert severity="info" icon={<Snooze />}>
                    Quiet hours active now. Notifications are recorded but popups are suppressed.
                  </Alert>
                ) : null}

                <Grid container spacing={2.2}>
                  {/* Settings column */}
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Parent alerts</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Choose what the parent gets notified about.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.6}>
                          <TextField select label="Alert mode" value={parentMode} onChange={(e) => setParentMode(e.target.value as any)}>
                            <MenuItem value="Every transaction">Every transaction</MenuItem>
                            <MenuItem value="Declines only">Declines only</MenuItem>
                            <MenuItem value="Approvals only">Approvals only</MenuItem>
                            <MenuItem value="Large transactions">Large transactions</MenuItem>
                          </TextField>

                          {parentMode === "Large transactions" ? (
                            <TextField
                              label="Large transaction threshold"
                              type="number"
                              value={largeTxnThreshold}
                              onChange={(e) => setLargeTxnThreshold(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
                              InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                              helperText="Alerts fire only when amount exceeds this threshold."
                            />
                          ) : null}

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack spacing={1.2}>
                                <ToggleLine label="Device login alerts" checked={deviceLogins} onChange={setDeviceLogins} />
                                <ToggleLine label="School updates" checked={schoolUpdates} onChange={setSchoolUpdates} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Alert severity="info" icon={<Info />}>
                            Approval notifications can be routed to co-guardians via Household settings.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Student alerts</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student-facing alerts (can be locked by the parent).
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  Parent lock
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  When on, student cannot change alert settings.
                                </Typography>
                              </Box>
                              <Switch checked={parentLocksStudentAlerts} onChange={(e) => setParentLocksStudentAlerts(e.target.checked)} />
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            <Stack spacing={1.2}>
                              <ToggleLine
                                label="Low balance warnings"
                                checked={studentAlerts.lowBalance}
                                onChange={(v) => studentToggle({ lowBalance: v })}
                                disabled={parentLocksStudentAlerts}
                              />
                              <ToggleLine
                                label="Nearing limit warnings"
                                checked={studentAlerts.nearingLimit}
                                onChange={(v) => studentToggle({ nearingLimit: v })}
                                disabled={parentLocksStudentAlerts}
                              />
                              <ToggleLine
                                label="Approval status updates"
                                checked={studentAlerts.approvalsStatus}
                                onChange={(v) => studentToggle({ approvalsStatus: v })}
                                disabled={parentLocksStudentAlerts}
                              />
                            </Stack>

                            {parentLocksStudentAlerts ? (
                              <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
                                Student alert settings are locked by the parent.
                              </Alert>
                            ) : null}
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Insights + quiet hours column */}
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Quiet hours</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Global defaults and per-child overrides.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <ToggleLine
                                label="Use per-child override"
                                checked={useChildOverride}
                                onChange={setUseChildOverride}
                                caption="When off, child uses global quiet hours."
                              />
                            </CardContent>
                          </Card>

                          <QuietHoursEditor
                            title={useChildOverride ? "Child quiet hours" : "Global quiet hours"}
                            qh={useChildOverride ? childQuiet : globalQuiet}
                            onChange={(next) => (useChildOverride ? setChildQuiet(next) : setGlobalQuiet(next))}
                            mode={mode}
                          />

                          <Alert severity="info" icon={<Info />}>
                            Quiet hours affect popups only. All events are still logged for audits.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Coaching insights</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Suggested improvements based on behavior.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          {suggestions.map((s) => (
                            <Card
                              key={s.id}
                              variant="outlined"
                              component={motion.div}
                              whileHover={{ y: -2 }}
                              sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(s.severity === "warning" ? EVZ.orange : EVZ.green, 0.22) }}
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
                                        bgcolor: alpha(s.severity === "warning" ? EVZ.orange : EVZ.green, 0.12),
                                        color: s.severity === "warning" ? EVZ.orange : EVZ.green,
                                        border: `1px solid ${alpha(s.severity === "warning" ? EVZ.orange : EVZ.green, 0.22)}`,
                                      }}
                                    >
                                      <Insights fontSize="small" />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                        {s.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {s.why}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Chip
                                    size="small"
                                    label={s.severity === "warning" ? "High impact" : "Suggestion"}
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: alpha(s.severity === "warning" ? EVZ.orange : EVZ.green, 0.10),
                                      color: s.severity === "warning" ? EVZ.orange : EVZ.green,
                                      border: `1px solid ${alpha(s.severity === "warning" ? EVZ.orange : EVZ.green, 0.22)}`,
                                    }}
                                  />
                                </Stack>

                                <Divider sx={{ my: 1.2 }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Rule />}
                                    onClick={() => applySuggestion(s)}
                                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                  >
                                    {s.actionLabel}
                                  </Button>
                                  <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Info />}
                                    onClick={() => toast(`Navigate: ${s.routeHint}`, "info")}
                                    sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                  >
                                    View
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          “Apply as rule” creates controls in Limits, Approvals, Vendors or Safety.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={() => {
                      setParentMode("Approvals only");
                      setLargeTxnThreshold(50000);
                      setDeviceLogins(true);
                      setSchoolUpdates(true);
                      setParentLocksStudentAlerts(true);
                      setStudentAlerts({ lowBalance: true, nearingLimit: true, approvalsStatus: true });
                      setUseChildOverride(false);
                      toast("Reset to defaults", "info");
                    }}
                    sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.2 }}
                  >
                    Reset
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={save}
                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                  >
                    Save settings
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

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
  checked,
  onChange,
  caption,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  caption?: string;
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

function QuietHoursEditor({
  title,
  qh,
  onChange,
  mode,
}: {
  title: string;
  qh: QuietHours;
  onChange: (next: QuietHours) => void;
  mode: "light" | "dark";
}) {
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Suppress popups during quiet hours.
        </Typography>

        <Divider sx={{ my: 1.2 }} />

        <Stack spacing={1.2}>
          <ToggleLine label="Enable quiet hours" checked={qh.enabled} onChange={(v) => onChange({ ...qh, enabled: v })} />

          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start"
                type="time"
                value={qh.start}
                onChange={(e) => onChange({ ...qh, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={!qh.enabled}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End"
                type="time"
                value={qh.end}
                onChange={(e) => onChange({ ...qh, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={!qh.enabled}
              />
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary">
            Days
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => {
              const on = qh.days.includes(d);
              return (
                <Chip
                  key={d}
                  label={d}
                  clickable
                  onClick={() => onChange({ ...qh, days: on ? qh.days.filter((x) => x !== d) : [...qh.days, d] })}
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
        </Stack>
      </CardContent>
    </Card>
  );
}
