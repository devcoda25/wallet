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
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  GpsFixed,
  Info,
  Lock,
  Map,
  MyLocation,
  Notifications,
  Place,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Safety Controls (Premium)
 * Route: /parent/edupocket/children/:childId/controls/safety
 * Includes:
 * - GeoFenceManager (zones + map placeholder)
 * - ZoneAlertsToggle
 * - SchoolOnlySpendingToggle
 * - CurfewControl (soft vs hard)
 * - DeviceSafetyOptions (biometric required to show QR)
 * - State: location permission guidance
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type ZoneType = "School" | "Home" | "Custom";

type Zone = {
  id: string;
  name: string;
  type: ZoneType;
  radiusM: number;
  lat: number;
  lng: number;
  address?: string;
  spendingAllowed: boolean;
};

type CurfewMode = "Soft" | "Hard";

type Permission = "Granted" | "Denied" | "Prompt";

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
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
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "transparent", backdropFilter: "blur(10px)", borderBottom: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.08)}` }}>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.25,
            background: mode === "dark" ? "linear-gradient(180deg, rgba(7,17,15,0.92) 0%, rgba(7,17,15,0.62) 100%)" : "linear-gradient(180deg, rgba(246,251,249,0.95) 0%, rgba(246,251,249,0.70) 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.14), border: `1px solid ${alpha(EVZ.green, 0.25)}`, color: EVZ.green }}>
                <GpsFixed fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>EduPocket - Safety</Typography>
                <Typography variant="caption" color="text.secondary">{childName}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to Controls Home">
                <IconButton onClick={() => alert("Navigate: /parent/edupocket/children/:childId/controls")} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.25)}`, fontWeight: 950 }}>R</Avatar>
            </Stack>
          </Stack>
        </Box>
      </AppBar>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 2.2,
          pb: 8,
          background: mode === "dark" ? "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.16), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.10), transparent 60%)" : "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.14), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.08), transparent 60%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function num(v: string, fallback = 0) {
  const n = parseInt((v || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

export default function EduPocketSafetyControls() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [permission, setPermission] = useState<Permission>("Granted");

  const [zones, setZones] = useState<Zone[]>([
    { id: "z1", name: "School", type: "School", radiusM: 220, lat: 0.312, lng: 32.581, address: "Greenhill Campus", spendingAllowed: true },
    { id: "z2", name: "Home", type: "Home", radiusM: 140, lat: 0.298, lng: 32.571, address: "Nsambya", spendingAllowed: false },
  ]);

  const [zoneAlerts, setZoneAlerts] = useState({ enter: true, exit: true });
  const [schoolOnlySpending, setSchoolOnlySpending] = useState(true);

  const [curfewEnabled, setCurfewEnabled] = useState(true);
  const [curfewStart, setCurfewStart] = useState("20:00");
  const [curfewEnd, setCurfewEnd] = useState("06:00");
  const [curfewMode, setCurfewMode] = useState<CurfewMode>("Hard");
  const [allowSchoolDuringCurfew, setAllowSchoolDuringCurfew] = useState(true);

  const [requireBiometricForQr, setRequireBiometricForQr] = useState(true);
  const [requireTrustedDevice, setRequireTrustedDevice] = useState(true);

  const [zoneDrawerOpen, setZoneDrawerOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneDraft, setZoneDraft] = useState<Zone>({ id: "", name: "", type: "Custom", radiusM: 200, lat: 0.3, lng: 32.58, spendingAllowed: false });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const hasSchoolZone = useMemo(() => zones.some((z) => z.type === "School"), [zones]);

  const locationGuidance = useMemo(() => {
    if (permission === "Granted") return null;
    if (permission === "Prompt") return "Location permission is not granted yet. Ask the student device to allow location for stronger safety rules.";
    return "Location permission is denied. Geofences and zone alerts will not work until enabled.";
  }, [permission]);

  const curfewValid = useMemo(() => {
    const toMin = (t: string) => {
      const [h, m] = (t || "00:00").split(":").map((x) => parseInt(x, 10));
      return (h || 0) * 60 + (m || 0);
    };
    const s = toMin(curfewStart);
    const e = toMin(curfewEnd);
    return s !== e;
  }, [curfewStart, curfewEnd]);

  const openNewZone = () => {
    setEditingZoneId(null);
    setZoneDraft({ id: "", name: "", type: "Custom", radiusM: 200, lat: 0.3, lng: 32.58, address: "", spendingAllowed: false });
    setZoneDrawerOpen(true);
  };

  const editZone = (id: string) => {
    const z = zones.find((x) => x.id === id);
    if (!z) return;
    setEditingZoneId(id);
    setZoneDraft({ ...z });
    setZoneDrawerOpen(true);
  };

  const saveZone = () => {
    if (!zoneDraft.name.trim()) return toast("Zone name is required", "warning");
    if (zoneDraft.radiusM < 30) return toast("Radius is too small", "warning");

    if (editingZoneId) {
      setZones((p) => p.map((z) => (z.id === editingZoneId ? { ...zoneDraft, id: editingZoneId } : z)));
      toast("Zone updated", "success");
    } else {
      const id = `z_${Math.floor(100000 + Math.random() * 899999)}`;
      setZones((p) => [{ ...zoneDraft, id }, ...p]);
      toast("Zone added", "success");
    }
    setZoneDrawerOpen(false);
  };

  const removeZone = (id: string) => {
    setZones((p) => p.filter((z) => z.id !== id));
    toast("Zone removed", "info");
  };

  const saveAll = () => {
    if (schoolOnlySpending && !hasSchoolZone) {
      toast("Add a School zone first", "warning");
      return;
    }
    if (curfewEnabled && !curfewValid) {
      toast("Curfew start and end cannot be the same", "warning");
      return;
    }
    toast("Safety controls saved", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} childName={`${child.name} • ${child.school}`}> 
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Safety controls</Typography>
                    <Typography variant="body2" color="text.secondary">Geofences, curfews, alerts and device security.</Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} • {c.school}</MenuItem>
                      ))}
                    </TextField>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={saveAll} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>Save</Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Location permission guidance */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                          <MyLocation fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Location permission</Typography>
                          <Typography variant="caption" color="text.secondary">Required for geofences and zone alerts.</Typography>
                        </Box>
                      </Stack>

                      <TextField select label="Permission" value={permission} onChange={(e) => setPermission(e.target.value as any)} sx={{ minWidth: 180 }}>
                        <MenuItem value="Granted">Granted</MenuItem>
                        <MenuItem value="Prompt">Prompt</MenuItem>
                        <MenuItem value="Denied">Denied</MenuItem>
                      </TextField>
                    </Stack>

                    {locationGuidance ? (
                      <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                        {locationGuidance}
                        <div style={{ marginTop: 6 }}>
                          Guidance: On the student device, enable Location permissions and allow precise location where possible.
                        </div>
                      </Alert>
                    ) : (
                      <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 1.2 }}>
                        Location permission is granted.
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Grid container spacing={2.2}>
                  {/* GeoFence manager */}
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Geofence zones</Typography>
                            <Typography variant="body2" color="text.secondary">Define zones and spending behavior.</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button variant="contained" startIcon={<Add />} onClick={openNewZone} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                              Add zone
                            </Button>
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.2}>
                          {zones.map((z) => (
                            <Grid key={z.id} item xs={12} md={6}>
                              <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                                <CardContent>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(z.type === "School" ? EVZ.green : EVZ.orange, 0.12), color: z.type === "School" ? EVZ.green : EVZ.orange, border: `1px solid ${alpha(z.type === "School" ? EVZ.green : EVZ.orange, 0.22)}` }}>
                                        <Place fontSize="small" />
                                      </Box>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>{z.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {z.type} • {z.radiusM}m
                                          {z.address ? ` • ${z.address}` : ""}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    <Chip
                                      size="small"
                                      label={z.spendingAllowed ? "Spend allowed" : "Spend blocked"}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(z.spendingAllowed ? EVZ.green : EVZ.orange, 0.10),
                                        color: z.spendingAllowed ? EVZ.green : EVZ.orange,
                                        border: `1px solid ${alpha(z.spendingAllowed ? EVZ.green : EVZ.orange, 0.22)}`,
                                      }}
                                    />
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Typography variant="caption" color="text.secondary">Lat/Lng</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{z.lat.toFixed(3)}, {z.lng.toFixed(3)}</Typography>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <Button fullWidth variant="outlined" onClick={() => editZone(z.id)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}>
                                      Edit
                                    </Button>
                                    <Button fullWidth variant="outlined" startIcon={<Close />} onClick={() => removeZone(z.id)} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>

                        {zones.length === 0 ? (
                          <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>No zones configured.</Alert>
                        ) : null}

                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06), border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}` }}>
                                <Map fontSize="small" />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Map preview</Typography>
                                <Typography variant="caption" color="text.secondary">Map is optional. This is a placeholder in the canvas.</Typography>
                              </Box>
                              <Button onClick={() => toast("Open map", "info")}>Open</Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Safety toggles */}
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Safety switches</Typography>
                        <Typography variant="body2" color="text.secondary">Alerts, school-only spending, curfews and device protection.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.4}>
                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Zone alerts</Typography>
                                  <Typography variant="caption" color="text.secondary">Notify on entering/leaving key zones.</Typography>
                                </Box>
                                <Chip size="small" label={permission === "Granted" ? "Active" : "Needs permission"} sx={{ fontWeight: 900 }} />
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Stack spacing={1}>
                                <ToggleLine label="Alert on enter" checked={zoneAlerts.enter} onChange={(v) => setZoneAlerts((p) => ({ ...p, enter: v }))} />
                                <ToggleLine label="Alert on exit" checked={zoneAlerts.exit} onChange={(v) => setZoneAlerts((p) => ({ ...p, exit: v }))} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <ToggleLine
                                label="School-only spending"
                                caption="Allow spending only inside the School zone."
                                checked={schoolOnlySpending}
                                onChange={(v) => setSchoolOnlySpending(v)}
                              />

                              {schoolOnlySpending && !hasSchoolZone ? (
                                <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                                  School-only is on, but no School zone exists. Add a School zone to enforce this.
                                </Alert>
                              ) : null}
                            </CardContent>
                          </Card>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Curfew</Typography>
                                  <Typography variant="caption" color="text.secondary">Lock spending during curfew hours.</Typography>
                                </Box>
                                <Switch checked={curfewEnabled} onChange={(e) => setCurfewEnabled(e.target.checked)} />
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Stack spacing={1.2}>
                                <Grid container spacing={1.2}>
                                  <Grid item xs={6}>
                                    <TextField label="Start" type="time" value={curfewStart} onChange={(e) => setCurfewStart(e.target.value)} InputLabelProps={{ shrink: true }} disabled={!curfewEnabled} fullWidth />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField label="End" type="time" value={curfewEnd} onChange={(e) => setCurfewEnd(e.target.value)} InputLabelProps={{ shrink: true }} disabled={!curfewEnabled} fullWidth />
                                  </Grid>
                                </Grid>

                                <TextField select label="Mode" value={curfewMode} onChange={(e) => setCurfewMode(e.target.value as any)} disabled={!curfewEnabled}>
                                  <MenuItem value="Soft">Soft (warn + log)</MenuItem>
                                  <MenuItem value="Hard">Hard (block)</MenuItem>
                                </TextField>

                                <ToggleLine
                                  label="Allow school purchases during curfew"
                                  checked={allowSchoolDuringCurfew}
                                  onChange={(v) => setAllowSchoolDuringCurfew(v)}
                                  disabled={!curfewEnabled}
                                />

                                {!curfewValid && curfewEnabled ? (
                                  <Alert severity="warning" icon={<WarningAmber />}>Curfew start and end cannot be the same.</Alert>
                                ) : null}

                                <Chip
                                  size="small"
                                  icon={<Lock fontSize="small" />}
                                  label={curfewEnabled ? `Curfew ${curfewStart} → ${curfewEnd} (${curfewMode})` : "Curfew off"}
                                  sx={{ fontWeight: 900 }}
                                />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Device safety</Typography>
                              <Typography variant="caption" color="text.secondary">Reduce QR misuse with device requirements.</Typography>
                              <Divider sx={{ my: 1.2 }} />

                              <Stack spacing={1}>
                                <ToggleLine
                                  label="Biometric required to show student QR"
                                  checked={requireBiometricForQr}
                                  onChange={(v) => setRequireBiometricForQr(v)}
                                />
                                <ToggleLine
                                  label="Trusted devices only"
                                  caption="Untrusted devices must re-auth before sensitive actions."
                                  checked={requireTrustedDevice}
                                  onChange={(v) => setRequireTrustedDevice(v)}
                                />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={saveAll}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Save safety
                          </Button>

                          <Alert severity="info" icon={<Info />}>
                            Safety rules are strongest when location permission is granted and School zone is configured.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Container>

        {/* Zone editor drawer */}
        <Drawer anchor="right" open={zoneDrawerOpen} onClose={() => setZoneDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
          <Box sx={{ p: 2.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">{editingZoneId ? "Edit" : "Add"} zone</Typography>
                <Typography variant="body2" color="text.secondary">Create a geofence for alerts and restrictions.</Typography>
              </Stack>
              <IconButton onClick={() => setZoneDrawerOpen(false)}><Close /></IconButton>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.6}>
              <TextField label="Name" value={zoneDraft.name} onChange={(e) => setZoneDraft((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField select label="Type" value={zoneDraft.type} onChange={(e) => setZoneDraft((p) => ({ ...p, type: e.target.value as any }))} fullWidth>
                <MenuItem value="School">School</MenuItem>
                <MenuItem value="Home">Home</MenuItem>
                <MenuItem value="Custom">Custom</MenuItem>
              </TextField>

              <TextField
                label="Radius (m)"
                type="number"
                value={zoneDraft.radiusM}
                onChange={(e) => setZoneDraft((p) => ({ ...p, radiusM: Math.max(30, num(e.target.value, 200)) }))}
                fullWidth
              />

              <Grid container spacing={1.2}>
                <Grid item xs={6}>
                  <TextField
                    label="Latitude"
                    value={String(zoneDraft.lat)}
                    onChange={(e) => setZoneDraft((p) => ({ ...p, lat: parseFloat(e.target.value || "0") || 0 }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Longitude"
                    value={String(zoneDraft.lng)}
                    onChange={(e) => setZoneDraft((p) => ({ ...p, lng: parseFloat(e.target.value || "0") || 0 }))}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField label="Address (optional)" value={zoneDraft.address ?? ""} onChange={(e) => setZoneDraft((p) => ({ ...p, address: e.target.value }))} fullWidth />

              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Spending allowed in zone</Typography>
                      <Typography variant="caption" color="text.secondary">If off, transactions inside the zone can be blocked.</Typography>
                    </Box>
                    <Switch checked={zoneDraft.spendingAllowed} onChange={(e) => setZoneDraft((p) => ({ ...p, spendingAllowed: e.target.checked }))} />
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info" icon={<Info />}>
                In production, coordinates come from map selection or saved places.
              </Alert>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button fullWidth variant="outlined" startIcon={<Close />} onClick={() => setZoneDrawerOpen(false)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>Cancel</Button>
                <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={saveZone} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>Save zone</Button>
              </Stack>
            </Stack>
          </Box>
        </Drawer>

        <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
        </Snackbar>
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
          <Typography variant="caption" color="text.secondary">{caption}</Typography>
        ) : null}
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </Stack>
  );
}
