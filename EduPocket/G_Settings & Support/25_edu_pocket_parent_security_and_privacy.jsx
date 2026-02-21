import React, { useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
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
  CheckCircle,
  Close,
  ContentCopy,
  Delete,
  Devices,
  Download,
  Fingerprint,
  Info,
  Key,
  Lock,
  PhoneIphone,
  PrivacyTip,
  Security,
  Shield,
  Visibility,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Security & Privacy (Premium)
 * Route: /parent/edupocket/settings/security
 * Includes:
 * - SecuritySettingsPanel (PIN/biometric/2FA)
 * - TrustedDevicesTable (remove device, require re-auth)
 * - DataSharingControls (vendors/school/support)
 * - ConsentLogsViewer + export
 * - Re-auth gating for sensitive actions
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type ReAuthMethod = "PIN" | "Biometric" | "OTP";

type Device = {
  id: string;
  name: string;
  platform: "Android" | "iOS" | "Web" | "Windows" | "Mac";
  lastSeen: string;
  trusted: boolean;
  requireReauth: boolean;
  locationHint?: string;
  current?: boolean;
};

type Sharing = {
  vendor: {
    showPhoto: boolean;
    showSchoolClass: boolean;
    showStream: boolean;
    showStatus: boolean;
    showLimitsSummary: boolean;
  };
  school: {
    seePayments: boolean;
    seeSpendSummaries: boolean;
    seeAttendanceFlags: boolean;
    enforceSchoolVendors: boolean;
  };
  support: {
    accessIncidentLogs: boolean;
    accessConsentLogs: boolean;
    accessDeviceLogs: boolean;
    exportOnRequestOnly: boolean;
  };
};

type ConsentLog = {
  id: string;
  at: number;
  childId: string;
  action: "Consent approved" | "Consent denied" | "Correction requested" | "QR reissued" | "Policy changed";
  actor: string;
  device: string;
  notes?: string;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const DEVICES_SEED: Device[] = [
  { id: "d1", name: "Pixel 8", platform: "Android", lastSeen: "Today", trusted: true, requireReauth: false, locationHint: "Kampala, UG", current: true },
  { id: "d2", name: "iPhone 13", platform: "iOS", lastSeen: "Yesterday", trusted: true, requireReauth: true, locationHint: "Kampala, UG" },
  { id: "d3", name: "Chrome (Windows)", platform: "Windows", lastSeen: "3 days ago", trusted: false, requireReauth: true, locationHint: "Unknown" },
];

const CONSENT_LOGS_SEED: ConsentLog[] = [
  {
    id: "l1",
    at: Date.now() - 3 * 24 * 60 * 60 * 1000,
    childId: "c_1",
    action: "Consent approved",
    actor: "Ronald (Guardian)",
    device: "Pixel 8",
    notes: "Baseline child template applied",
  },
  {
    id: "l2",
    at: Date.now() - 2 * 24 * 60 * 60 * 1000,
    childId: "c_3",
    action: "Correction requested",
    actor: "Ronald (Guardian)",
    device: "Chrome (Windows)",
    notes: "School roster mismatch",
  },
  {
    id: "l3",
    at: Date.now() - 14 * 60 * 60 * 1000,
    childId: "c_2",
    action: "Policy changed",
    actor: "Susan (Co-guardian)",
    device: "iPhone 13",
    notes: "Adjusted schedule controls",
  },
  {
    id: "l4",
    at: Date.now() - 70 * 60 * 1000,
    childId: "c_1",
    action: "QR reissued",
    actor: "Ronald (Guardian)",
    device: "Pixel 8",
    notes: "Lost school ID",
  },
];

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
                <Security fontSize="small" />
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
              <Tooltip title="Back to EduPocket">
                <IconButton
                  onClick={() => alert("Navigate: /parent/edupocket")}
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

export default function EduPocketSecurityPrivacy() {
  const { theme, mode, setMode } = useCorporateTheme();

  // Security settings
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  // Trusted devices
  const [devices, setDevices] = useState<Device[]>(DEVICES_SEED);

  // Data sharing
  const [sharing, setSharing] = useState<Sharing>({
    vendor: {
      showPhoto: true,
      showSchoolClass: true,
      showStream: true,
      showStatus: true,
      showLimitsSummary: false,
    },
    school: {
      seePayments: true,
      seeSpendSummaries: true,
      seeAttendanceFlags: false,
      enforceSchoolVendors: true,
    },
    support: {
      accessIncidentLogs: true,
      accessConsentLogs: true,
      accessDeviceLogs: false,
      exportOnRequestOnly: true,
    },
  });

  // Consent logs
  const [logs] = useState<ConsentLog[]>(CONSENT_LOGS_SEED);
  const [logChild, setLogChild] = useState<string>("");
  const [logAction, setLogAction] = useState<ConsentLog["action"] | "">("");
  const [logFrom, setLogFrom] = useState<string>("");
  const [logTo, setLogTo] = useState<string>("");

  // Dialogs
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);

  // Re-auth gating
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthMethod, setReauthMethod] = useState<ReAuthMethod>("PIN");
  const [reauthCode, setReauthCode] = useState("");
  const [pendingAction, setPendingAction] = useState<null | {
    kind: "RemoveDevice" | "ExportConsent" | "Disable2FA" | "ChangeSharing";
    payload?: any;
  }>(null);

  // Snack
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({
    open: false,
    msg: "",
    sev: "info",
  });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const filteredLogs = useMemo(() => {
    const inRange = (ts: number) => {
      if (!logFrom && !logTo) return true;
      const d = new Date(ts).toISOString().slice(0, 10);
      if (logFrom && d < logFrom) return false;
      if (logTo && d > logTo) return false;
      return true;
    };

    return logs
      .filter((l) => (logChild ? l.childId === logChild : true))
      .filter((l) => (logAction ? l.action === logAction : true))
      .filter((l) => inRange(l.at))
      .sort((a, b) => b.at - a.at);
  }, [logs, logChild, logAction, logFrom, logTo]);

  const openReauth = (action: typeof pendingAction) => {
    setPendingAction(action);
    setReauthMethod(pinEnabled ? "PIN" : biometricEnabled ? "Biometric" : "OTP");
    setReauthCode("");
    setReauthOpen(true);
  };

  const reauthOk = () => {
    // In a real system, this validates against backend.
    if (reauthMethod === "Biometric") return true;
    return reauthCode.trim().length >= 4;
  };

  const confirmReauth = () => {
    if (!pendingAction) return;
    if (!reauthOk()) return toast("Enter a valid verification code", "warning");

    if (pendingAction.kind === "RemoveDevice") {
      const id = pendingAction.payload?.deviceId as string;
      setDevices((p) => p.filter((d) => d.id !== id));
      toast("Device removed", "success");
    }

    if (pendingAction.kind === "ExportConsent") {
      exportConsentLogs();
    }

    if (pendingAction.kind === "Disable2FA") {
      setTwoFAEnabled(false);
      toast("2FA disabled", "warning");
    }

    if (pendingAction.kind === "ChangeSharing") {
      toast("Data sharing updated", "success");
    }

    setPendingAction(null);
    setReauthOpen(false);
    setReauthCode("");
  };

  const exportConsentLogs = () => {
    const rows: string[] = [];
    rows.push(["time", "child", "action", "actor", "device", "notes"].join(","));
    for (const l of filteredLogs) {
      const child = CHILDREN.find((c) => c.id === l.childId)?.name ?? l.childId;
      rows.push([new Date(l.at).toISOString(), child, l.action, l.actor, l.device, l.notes ?? ""].map(csvSafe).join(","));
    }
    downloadText(`edupocket_consent_logs_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  const removeDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device?.current) return toast("You can’t remove the current device from this screen", "warning");
    openReauth({ kind: "RemoveDevice", payload: { deviceId } });
  };

  const toggle2FA = (on: boolean) => {
    if (on) {
      setTwoFADialogOpen(true);
      return;
    }
    // disabling is sensitive
    openReauth({ kind: "Disable2FA" });
  };

  const setSharingSafe = (next: Sharing) => {
    setSharing(next);
    openReauth({ kind: "ChangeSharing" });
  };

  const copySupportScope = async () => {
    const text = JSON.stringify(sharing.support, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied", "success");
    } catch {
      toast("Could not copy", "warning");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        title="EduPocket"
        subtitle="Security and privacy"
      >
        <Container maxWidth="xl" disableGutters>
          <Stack spacing={2.2}>
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Security and privacy</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Protect your parent account, manage trusted devices, and control what others can see.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => openReauth({ kind: "ExportConsent" })}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export consent logs
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => toast("Settings saved", "success")}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2.2}>
              {/* Security settings */}
              <Grid item xs={12} lg={7}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Security settings</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure PIN, biometrics, and two-factor authentication.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.6}>
                      <Grid item xs={12} md={6}>
                        <Tile
                          mode={mode}
                          icon={<Key fontSize="small" />}
                          title="PIN"
                          desc={pinEnabled ? "Enabled" : "Disabled"}
                          tone={pinEnabled ? EVZ.green : EVZ.orange}
                          right={
                            <Switch
                              checked={pinEnabled}
                              onChange={(e) => {
                                setPinEnabled(e.target.checked);
                                toast(e.target.checked ? "PIN enabled" : "PIN disabled", e.target.checked ? "success" : "warning");
                              }}
                            />
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Tile
                          mode={mode}
                          icon={<Fingerprint fontSize="small" />}
                          title="Biometric"
                          desc={biometricEnabled ? "Enabled" : "Disabled"}
                          tone={biometricEnabled ? EVZ.green : alpha(EVZ.ink, 0.7)}
                          right={<Switch checked={biometricEnabled} onChange={(e) => setBiometricEnabled(e.target.checked)} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={12}>
                        <Tile
                          mode={mode}
                          icon={<Security fontSize="small" />}
                          title="Two-factor authentication"
                          desc={twoFAEnabled ? "On" : "Off"}
                          tone={twoFAEnabled ? EVZ.green : EVZ.orange}
                          right={<Switch checked={twoFAEnabled} onChange={(e) => toggle2FA(e.target.checked)} />}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.6 }} />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Button
                        variant="outlined"
                        startIcon={<Key />}
                        onClick={() => setPinDialogOpen(true)}
                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        fullWidth
                      >
                        Set / change PIN
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PhoneIphone />}
                        onClick={() => setTwoFADialogOpen(true)}
                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        fullWidth
                      >
                        Configure 2FA
                      </Button>
                    </Stack>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Sensitive actions require re-authentication (PIN, biometric, or OTP).
                    </Alert>
                  </CardContent>
                </Card>

                {/* Consent logs */}
                <Card sx={{ mt: 2.2 }}>
                  <CardContent>
                    <Typography variant="h6">Consent logs</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Auditable record of under-18 consent and critical changes.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          select
                          label="Child"
                          value={logChild}
                          onChange={(e) => setLogChild(e.target.value)}
                          fullWidth
                        >
                          <MenuItem value="">All</MenuItem>
                          {CHILDREN.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          label="Action"
                          value={logAction}
                          onChange={(e) => setLogAction(e.target.value as any)}
                          fullWidth
                        >
                          <MenuItem value="">All</MenuItem>
                          {([
                            "Consent approved",
                            "Consent denied",
                            "Correction requested",
                            "QR reissued",
                            "Policy changed",
                          ] as const).map((a) => (
                            <MenuItem key={a} value={a}>
                              {a}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={2.5}>
                        <TextField
                          label="From"
                          type="date"
                          value={logFrom}
                          onChange={(e) => setLogFrom(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={2.5}>
                        <TextField
                          label="To"
                          type="date"
                          value={logTo}
                          onChange={(e) => setLogTo(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.6 }} />

                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 950 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Child</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Actor</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Device</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredLogs.slice(0, 25).map((l) => {
                            const child = CHILDREN.find((c) => c.id === l.childId);
                            return (
                              <TableRow key={l.id} hover>
                                <TableCell>{timeAgo(l.at)}</TableCell>
                                <TableCell>{child?.name ?? l.childId}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={l.action}
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: alpha(EVZ.green, 0.10),
                                      color: EVZ.green,
                                      border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{l.actor}</TableCell>
                                <TableCell>{l.device}</TableCell>
                                <TableCell>{l.notes ?? "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>

                    <Divider sx={{ my: 1.6 }} />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => openReauth({ kind: "ExportConsent" })}
                        sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                        fullWidth
                      >
                        Export current view
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => toast("Open full audit viewer", "info")}
                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        fullWidth
                      >
                        Full audit viewer
                      </Button>
                    </Stack>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Export contains only what is visible after filters.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              {/* Privacy + Devices */}
              <Grid item xs={12} lg={5}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Trusted devices</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage devices that can access your parent account.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 950 }}>Device</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Trusted</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Re-auth</TableCell>
                            <TableCell sx={{ fontWeight: 950 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {devices.map((d) => {
                            const tone = d.trusted ? EVZ.green : alpha(EVZ.ink, 0.7);
                            return (
                              <TableRow key={d.id} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2.4,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: alpha(tone, 0.12),
                                        color: tone,
                                        border: `1px solid ${alpha(tone, 0.22)}`,
                                      }}
                                    >
                                      <Devices fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        {d.name}
                                        {d.current ? " (Current)" : ""}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {d.platform} • {d.lastSeen}
                                        {d.locationHint ? ` • ${d.locationHint}` : ""}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Switch
                                    checked={d.trusted}
                                    onChange={(e) =>
                                      setDevices((p) =>
                                        p.map((x) => (x.id === d.id ? { ...x, trusted: e.target.checked } : x))
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Switch
                                    checked={d.requireReauth}
                                    onChange={(e) =>
                                      setDevices((p) =>
                                        p.map((x) => (x.id === d.id ? { ...x, requireReauth: e.target.checked } : x))
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Tooltip title={d.current ? "Can’t remove current device" : "Remove device"}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() => removeDevice(d.id)}
                                        disabled={Boolean(d.current)}
                                        sx={{
                                          border: `1px solid ${alpha(EVZ.orange, 0.35)}`,
                                          color: EVZ.orange,
                                        }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      If a device is lost, remove it and reissue student QR in the child profile.
                    </Alert>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 2.2 }}>
                  <CardContent>
                    <Typography variant="h6">Data sharing</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Control what vendors, schools and support can access.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <SectionHeader icon={<Visibility fontSize="small" />} title="What vendors see" subtitle="Shown during QR scanning before charging." />
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.vendor.showPhoto}
                            onChange={(e) => setSharingSafe({ ...sharing, vendor: { ...sharing.vendor, showPhoto: e.target.checked } })}
                          />
                        }
                        label="Student photo"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.vendor.showSchoolClass}
                            onChange={(e) => setSharingSafe({ ...sharing, vendor: { ...sharing.vendor, showSchoolClass: e.target.checked } })}
                          />
                        }
                        label="School and class"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.vendor.showStream}
                            onChange={(e) => setSharingSafe({ ...sharing, vendor: { ...sharing.vendor, showStream: e.target.checked } })}
                          />
                        }
                        label="Stream (if applicable)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.vendor.showStatus}
                            onChange={(e) => setSharingSafe({ ...sharing, vendor: { ...sharing.vendor, showStatus: e.target.checked } })}
                          />
                        }
                        label="Account status (Active/Paused/Needs consent)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.vendor.showLimitsSummary}
                            onChange={(e) => setSharingSafe({ ...sharing, vendor: { ...sharing.vendor, showLimitsSummary: e.target.checked } })}
                          />
                        }
                        label="Limits summary (optional)"
                      />
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <SectionHeader icon={<School fontSize="small" />} title="What school sees" subtitle="School portal visibility settings." />
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.school.seePayments}
                            onChange={(e) => setSharingSafe({ ...sharing, school: { ...sharing.school, seePayments: e.target.checked } })}
                          />
                        }
                        label="Payments and receipts"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.school.seeSpendSummaries}
                            onChange={(e) => setSharingSafe({ ...sharing, school: { ...sharing.school, seeSpendSummaries: e.target.checked } })}
                          />
                        }
                        label="Spend summaries (by category/vendor)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.school.seeAttendanceFlags}
                            onChange={(e) => setSharingSafe({ ...sharing, school: { ...sharing.school, seeAttendanceFlags: e.target.checked } })}
                          />
                        }
                        label="Attendance flags (optional)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.school.enforceSchoolVendors}
                            onChange={(e) => setSharingSafe({ ...sharing, school: { ...sharing.school, enforceSchoolVendors: e.target.checked } })}
                          />
                        }
                        label="Enforce school-vendor registry"
                      />
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <SectionHeader icon={<PrivacyTip fontSize="small" />} title="Support access" subtitle="Used for investigations and troubleshooting." />
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.support.accessIncidentLogs}
                            onChange={(e) => setSharingSafe({ ...sharing, support: { ...sharing.support, accessIncidentLogs: e.target.checked } })}
                          />
                        }
                        label="Incident logs"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.support.accessConsentLogs}
                            onChange={(e) => setSharingSafe({ ...sharing, support: { ...sharing.support, accessConsentLogs: e.target.checked } })}
                          />
                        }
                        label="Consent logs"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.support.accessDeviceLogs}
                            onChange={(e) => setSharingSafe({ ...sharing, support: { ...sharing.support, accessDeviceLogs: e.target.checked } })}
                          />
                        }
                        label="Device logs"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sharing.support.exportOnRequestOnly}
                            onChange={(e) => setSharingSafe({ ...sharing, support: { ...sharing.support, exportOnRequestOnly: e.target.checked } })}
                          />
                        }
                        label="Export on request only"
                      />
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ContentCopy />}
                        onClick={copySupportScope}
                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                      >
                        Copy support scope
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => openReauth({ kind: "ChangeSharing" })}
                        sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                      >
                        Confirm changes
                      </Button>
                    </Stack>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Changes are logged and may affect vendor verification screens.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" icon={<Info />}>
              Re-auth gating protects sensitive actions: removing devices, disabling 2FA, exporting logs, and changing sharing.
            </Alert>
          </Stack>
        </Container>

        {/* PIN dialog */}
        <Dialog open={pinDialogOpen} onClose={() => setPinDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Set / change PIN</Typography>
                <Typography variant="body2" color="text.secondary">
                  PIN is used to approve sensitive actions.
                </Typography>
              </Stack>
              <IconButton onClick={() => setPinDialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              <TextField label="New PIN" type="password" placeholder="4-6 digits" InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }} />
              <TextField label="Confirm PIN" type="password" placeholder="Repeat" InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }} />
              <Alert severity="info" icon={<Info />}>
                In production, PIN is stored securely and never shown.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPinDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => {
                setPinEnabled(true);
                setPinDialogOpen(false);
                toast("PIN updated", "success");
              }}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 2FA dialog */}
        <Dialog open={twoFADialogOpen} onClose={() => setTwoFADialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Configure 2FA</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an extra layer of protection.
                </Typography>
              </Stack>
              <IconButton onClick={() => setTwoFADialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              <TextField select label="Method" defaultValue="Authenticator app" fullWidth>
                <MenuItem value="Authenticator app">Authenticator app</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
              </TextField>
              <TextField label="Backup phone (optional)" placeholder="+256..." fullWidth />
              <Alert severity="info" icon={<Info />}>
                In production, recovery codes can be generated and stored safely.
              </Alert>
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                    Recovery codes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Save these in a secure place.
                  </Typography>
                  <Divider sx={{ my: 1.2 }} />
                  <Box
                    sx={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'",
                      fontSize: 12,
                      bgcolor: alpha(EVZ.ink, 0.06),
                      border: `1px solid ${alpha(EVZ.ink, 0.10)}`,
                      borderRadius: 2.5,
                      p: 1.2,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    8H9K-2P7Q\n3D5F-9W1Z\n6T8M-4X0A\n1B2C-7N9V
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    startIcon={<ContentCopy />}
                    onClick={() => toast("Recovery codes copied (demo)", "success")}
                    sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                  >
                    Copy
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTwoFADialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => {
                setTwoFAEnabled(true);
                setTwoFADialogOpen(false);
                toast("2FA configured", "success");
              }}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
            >
              Enable
            </Button>
          </DialogActions>
        </Dialog>

        {/* Re-auth dialog */}
        <Dialog open={reauthOpen} onClose={() => setReauthOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Re-authentication</Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirm this sensitive action.
                </Typography>
              </Stack>
              <IconButton onClick={() => setReauthOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              <TextField select label="Method" value={reauthMethod} onChange={(e) => setReauthMethod(e.target.value as any)} fullWidth>
                <MenuItem value="PIN">PIN</MenuItem>
                <MenuItem value="Biometric">Biometric</MenuItem>
                <MenuItem value="OTP">OTP</MenuItem>
              </TextField>

              {reauthMethod === "Biometric" ? (
                <Alert severity="info" icon={<Fingerprint />}>
                  Biometric confirmation is simulated in this canvas.
                </Alert>
              ) : (
                <TextField
                  label={reauthMethod === "PIN" ? "Enter PIN" : "Enter OTP"}
                  value={reauthCode}
                  onChange={(e) => setReauthCode(e.target.value.replace(/[^0-9]/g, ""))}
                  InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
                  helperText={reauthMethod === "OTP" ? "OTP typically arrives via SMS/Email/WhatsApp" : "PIN protects sensitive actions"}
                  fullWidth
                />
              )}

              <Alert severity="info" icon={<Info />}>
                Action: <b>{pendingAction?.kind ?? "—"}</b>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReauthOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={confirmReauth}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3800} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </AppShell>
    </ThemeProvider>
  );
}

function Tile({
  mode,
  icon,
  title,
  desc,
  tone,
  right,
}: {
  mode: "light" | "dark";
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: string;
  right?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.8,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(tone, 0.12),
                color: tone,
                border: `1px solid ${alpha(tone, 0.22)}`,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {desc}
              </Typography>
            </Box>
          </Stack>
          {right}
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
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
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}
