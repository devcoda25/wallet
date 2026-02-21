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
  Gavel,
  Info,
  LockClock,
  MergeType,
  Notifications,
  Rule,
  Shield,
  Store,
  Tune,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Approval Rules (Premium)
 * Route: /parent/edupocket/children/:childId/controls/approvals
 * Includes:
 * - ApprovalPolicyBuilder: amount/category/vendor/time/location
 * - AutoApproveRulesList: trusted vendors, recurring items
 * - ApprovalWindowSettings: instant-only vs delayed holds
 * - FallbackBehaviorSelector: auto-decline after X minutes, suggest reduced amount
 * - Conflict detector (rule overlap warnings)
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

type Category = "Food" | "Books" | "Transport" | "Fees" | "Other";

type RequireMode = "Always" | "Above amount";

type HoldMode = "Instant" | "Hold";

type FallbackAction = "Auto-decline" | "Suggest reduced";

type ApprovalCore = {
  requireMode: RequireMode;
  amountThreshold: number;
  requireCategories: Category[];
  requireVendors: string[];
  requireOutsideAllowedHours: boolean;
  allowedStart: string;
  allowedEnd: string;
  requireOutsideSchoolZone: boolean;
  // vendor-specific override
  newVendorAlwaysRequiresApproval: boolean;
};

type ApprovalWindowSettings = {
  holdMode: HoldMode;
  holdMaxMinutes: number;
  allowDelayedApproval: boolean;
};

type FallbackSettings = {
  autoDeclineAfterMinutes: number;
  enableAutoDecline: boolean;
  enableSuggestReduced: boolean;
  suggestedAmount: number;
};

type AutoApproveRule = {
  id: string;
  name: string;
  enabled: boolean;
  vendors: string[]; // empty means any
  categories: Category[]; // empty means any
  maxAmount: number;
  allowedStart?: string;
  allowedEnd?: string;
  recurringLabel?: string; // e.g. lunch plan
};

type Conflict = {
  id: string;
  title: string;
  detail: string;
  severity: "warning" | "info";
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

const CATEGORIES: Category[] = ["Food", "Books", "Transport", "Fees", "Other"];

const VENDORS = ["School Canteen", "Campus Bookshop", "School Transport", "Uniform Store", "New Snack Kiosk", "Starlight School"];

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
                <Gavel fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>EduPocket - Approval Rules</Typography>
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

function parseTime(t: string) {
  const [h, m] = (t || "00:00").split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function windowsOverlap(startA: string, endA: string, startB: string, endB: string) {
  const aS = parseTime(startA);
  const aE = parseTime(endA);
  const bS = parseTime(startB);
  const bE = parseTime(endB);
  if (aS >= aE || bS >= bE) return true;
  return aS < bE && bS < aE;
}

function intersect<T>(a: T[], b: T[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function EduPocketApprovalRules() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [core, setCore] = useState<ApprovalCore>({
    requireMode: "Above amount",
    amountThreshold: 15000,
    requireCategories: ["Fees"],
    requireVendors: ["New Snack Kiosk"],
    requireOutsideAllowedHours: true,
    allowedStart: "07:00",
    allowedEnd: "18:30",
    requireOutsideSchoolZone: true,
    newVendorAlwaysRequiresApproval: true,
  });

  const [windowSettings, setWindowSettings] = useState<ApprovalWindowSettings>({
    holdMode: "Hold",
    holdMaxMinutes: 10,
    allowDelayedApproval: true,
  });

  const [fallback, setFallback] = useState<FallbackSettings>({
    enableAutoDecline: true,
    autoDeclineAfterMinutes: 10,
    enableSuggestReduced: true,
    suggestedAmount: 10000,
  });

  const [autoRules, setAutoRules] = useState<AutoApproveRule[]>([
    {
      id: "ar1",
      name: "Canteen lunch under 10k",
      enabled: true,
      vendors: ["School Canteen"],
      categories: ["Food"],
      maxAmount: 10000,
      allowedStart: "11:30",
      allowedEnd: "14:00",
      recurringLabel: "Lunch plan",
    },
    {
      id: "ar2",
      name: "Transport rides",
      enabled: true,
      vendors: ["School Transport"],
      categories: ["Transport"],
      maxAmount: 8000,
    },
  ]);

  const [autoRuleDrawerOpen, setAutoRuleDrawerOpen] = useState(false);
  const [editAutoRuleId, setEditAutoRuleId] = useState<string | null>(null);
  const [autoDraft, setAutoDraft] = useState<AutoApproveRule>({
    id: "",
    name: "",
    enabled: true,
    vendors: [],
    categories: [],
    maxAmount: 10000,
    allowedStart: "",
    allowedEnd: "",
    recurringLabel: "",
  });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const conflicts = useMemo((): Conflict[] => {
    const out: Conflict[] = [];

    for (const ar of autoRules.filter((r) => r.enabled)) {
      const vendorsOverlap = ar.vendors.length === 0 || core.requireVendors.length === 0 ? [] : intersect(ar.vendors, core.requireVendors);
      const catOverlap = ar.categories.length === 0 || core.requireCategories.length === 0 ? [] : intersect(ar.categories, core.requireCategories);

      // time overlap (if both specify time windows)
      const arHasTime = Boolean(ar.allowedStart && ar.allowedEnd);
      const coreHasTime = core.requireOutsideAllowedHours;
      const timeConflict = arHasTime && coreHasTime ? windowsOverlap(ar.allowedStart!, ar.allowedEnd!, core.allowedStart, core.allowedEnd) : false;

      // amount conflict
      let amountConflict = false;
      if (core.requireMode === "Always") amountConflict = true;
      if (core.requireMode === "Above amount" && ar.maxAmount >= core.amountThreshold) amountConflict = true;

      // conflict if any of these are true, in a meaningful scope
      const scopeConflict =
        (ar.vendors.length ? ar.vendors.some((v) => core.requireVendors.includes(v)) : false) ||
        (ar.categories.length ? ar.categories.some((c) => core.requireCategories.includes(c)) : false) ||
        (core.requireMode === "Always" || core.requireMode === "Above amount");

      if (amountConflict && scopeConflict) {
        const overlaps: string[] = [];
        if (vendorsOverlap.length) overlaps.push(`Vendor overlap: ${vendorsOverlap.join(", ")}`);
        if (catOverlap.length) overlaps.push(`Category overlap: ${catOverlap.join(", ")}`);
        if (timeConflict) overlaps.push("Time overlap with allowed-hours rule");

        out.push({
          id: `c_${ar.id}`,
          title: `Potential conflict with auto-approve rule: ${ar.name}`,
          detail:
            overlaps.length
              ? overlaps.join(" • ")
              : "Auto-approve may allow transactions that the core policy requires approval for.",
          severity: "warning",
        });
      }

      // invalid time window
      if (arHasTime && parseTime(ar.allowedStart!) >= parseTime(ar.allowedEnd!)) {
        out.push({
          id: `t_${ar.id}`,
          title: `Invalid time window in ${ar.name}`,
          detail: "Start must be before end.",
          severity: "warning",
        });
      }
    }

    // core schedule validity
    if (core.requireOutsideAllowedHours && parseTime(core.allowedStart) >= parseTime(core.allowedEnd)) {
      out.push({ id: "core_time", title: "Invalid allowed-hours window", detail: "Start must be before end.", severity: "warning" });
    }

    // fallback conflict: if hold is disabled but auto-decline enabled, it's meaningless
    if (windowSettings.holdMode === "Instant" && fallback.enableAutoDecline) {
      out.push({
        id: "fb_hold",
        title: "Auto-decline is enabled but approvals are instant-only",
        detail: "Auto-decline only applies when you hold transactions for approval.",
        severity: "info",
      });
    }

    return out;
  }, [autoRules, core, windowSettings.holdMode, fallback.enableAutoDecline]);

  const hasWarnings = conflicts.some((c) => c.severity === "warning");

  const openNewAutoRule = () => {
    setEditAutoRuleId(null);
    setAutoDraft({
      id: "",
      name: "",
      enabled: true,
      vendors: [],
      categories: [],
      maxAmount: 10000,
      allowedStart: "",
      allowedEnd: "",
      recurringLabel: "",
    });
    setAutoRuleDrawerOpen(true);
  };

  const openEditAutoRule = (id: string) => {
    const r = autoRules.find((x) => x.id === id);
    if (!r) return;
    setEditAutoRuleId(id);
    setAutoDraft({ ...r });
    setAutoRuleDrawerOpen(true);
  };

  const autoDraftErrors = useMemo(() => {
    const errs: string[] = [];
    if (!autoDraft.name.trim()) errs.push("Rule name is required");
    if (autoDraft.maxAmount <= 0) errs.push("Max amount must be > 0");
    if ((autoDraft.allowedStart && !autoDraft.allowedEnd) || (!autoDraft.allowedStart && autoDraft.allowedEnd)) errs.push("Provide both start and end times");
    if (autoDraft.allowedStart && autoDraft.allowedEnd) {
      if (parseTime(autoDraft.allowedStart) >= parseTime(autoDraft.allowedEnd)) errs.push("Start must be before end");
    }
    return errs;
  }, [autoDraft]);

  const saveAutoRule = () => {
    if (autoDraftErrors.length) return;

    if (editAutoRuleId) {
      setAutoRules((p) => p.map((r) => (r.id === editAutoRuleId ? { ...autoDraft, id: editAutoRuleId } : r)));
      toast("Auto-approve rule updated", "success");
    } else {
      const id = `ar_${Math.floor(100000 + Math.random() * 899999)}`;
      setAutoRules((p) => [{ ...autoDraft, id }, ...p]);
      toast("Auto-approve rule added", "success");
    }

    setAutoRuleDrawerOpen(false);
  };

  const removeAutoRule = (id: string) => {
    setAutoRules((p) => p.filter((r) => r.id !== id));
    toast("Rule removed", "info");
  };

  const saveAll = () => {
    if (hasWarnings) return toast("Resolve conflicts before saving", "warning");
    toast("Approval rules saved", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} childName={child.name}>
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Approval rules</Typography>
                    <Typography variant="body2" color="text.secondary">Require approvals intelligently and reduce friction with auto-approvals.</Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} - {c.school}</MenuItem>
                      ))}
                    </TextField>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={saveAll} disabled={hasWarnings} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                      Save
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <AnimatePresence initial={false}>
                  {conflicts.length ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Card variant="outlined" sx={{ bgcolor: alpha(EVZ.orange, 0.06), borderColor: alpha(EVZ.orange, 0.22) }}>
                        <CardContent>
                          <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.22)}` }}>
                                <WarningAmber fontSize="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Conflict detector</Typography>
                                <Typography variant="caption" color="text.secondary">Rule overlaps or invalid settings detected.</Typography>
                              </Box>
                            </Stack>
                            <Chip size="small" label={`${conflicts.length} issue(s)`} sx={{ fontWeight: 900 }} />
                          </Stack>

                          <Divider sx={{ my: 1.2 }} />

                          <Stack spacing={0.8}>
                            {conflicts.slice(0, 8).map((c) => (
                              <Alert key={c.id} severity={c.severity === "warning" ? "warning" : "info"} icon={<Info />}>
                                <b>{c.title}</b>
                                <div style={{ marginTop: 4 }}>{c.detail}</div>
                              </Alert>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    {/* Policy builder */}
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Approval policy builder</Typography>
                        <Typography variant="body2" color="text.secondary">Define when approvals are required.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.6}>
                          <TextField select label="Base policy" value={core.requireMode} onChange={(e) => setCore((p) => ({ ...p, requireMode: e.target.value as any }))}>
                            <MenuItem value="Always">Require approval always</MenuItem>
                            <MenuItem value="Above amount">Require approval above threshold</MenuItem>
                          </TextField>

                          <TextField
                            label="Threshold"
                            type="number"
                            value={core.amountThreshold}
                            onChange={(e) => setCore((p) => ({ ...p, amountThreshold: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                            disabled={core.requireMode !== "Above amount"}
                            InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                            helperText="If base policy is threshold-based, approvals trigger above this amount."
                          />

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.2} alignItems="center">
                                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                                    <LockClock fontSize="small" />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Time and location conditions</Typography>
                                    <Typography variant="caption" color="text.secondary">Require approval outside allowed hours or outside school zone.</Typography>
                                  </Box>
                                </Stack>
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Stack spacing={1.2}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Typography variant="body2">Require approval outside allowed hours</Typography>
                                  <Switch checked={core.requireOutsideAllowedHours} onChange={(e) => setCore((p) => ({ ...p, requireOutsideAllowedHours: e.target.checked }))} />
                                </Stack>

                                <Grid container spacing={1.2}>
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      label="Allowed start"
                                      type="time"
                                      value={core.allowedStart}
                                      onChange={(e) => setCore((p) => ({ ...p, allowedStart: e.target.value }))}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!core.requireOutsideAllowedHours}
                                      fullWidth
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      label="Allowed end"
                                      type="time"
                                      value={core.allowedEnd}
                                      onChange={(e) => setCore((p) => ({ ...p, allowedEnd: e.target.value }))}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!core.requireOutsideAllowedHours}
                                      fullWidth
                                    />
                                  </Grid>
                                </Grid>

                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Typography variant="body2">Require approval outside school zone</Typography>
                                  <Switch checked={core.requireOutsideSchoolZone} onChange={(e) => setCore((p) => ({ ...p, requireOutsideSchoolZone: e.target.checked }))} />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>

                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                              <MultiSelectChipBox<Category>
                                title="Require approval for categories"
                                subtitle="These categories always require approval"
                                options={CATEGORIES}
                                selected={core.requireCategories}
                                onChange={(next) => setCore((p) => ({ ...p, requireCategories: next }))}
                                mode={mode}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <MultiSelectChipBox<string>
                                title="Require approval for vendors"
                                subtitle="These vendors always require approval"
                                options={VENDORS}
                                selected={core.requireVendors}
                                onChange={(next) => setCore((p) => ({ ...p, requireVendors: next }))}
                                mode={mode}
                              />
                            </Grid>
                          </Grid>

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>New vendor protection</Typography>
                                  <Typography variant="caption" color="text.secondary">Require approval the first time a new vendor is used.</Typography>
                                </Box>
                                <Switch checked={core.newVendorAlwaysRequiresApproval} onChange={(e) => setCore((p) => ({ ...p, newVendorAlwaysRequiresApproval: e.target.checked }))} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Alert severity="info" icon={<Info />}>
                            Tip: keep base approvals threshold higher, then use auto-approve rules for trusted vendors.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Window settings + fallback */}
                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Approval window and fallback</Typography>
                        <Typography variant="body2" color="text.secondary">Control how long approvals wait and what happens if you don’t respond.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.6}>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Approval window</Typography>
                                <Typography variant="caption" color="text.secondary">Instant or hold for approval.</Typography>
                                <Divider sx={{ my: 1.2 }} />

                                <TextField select label="Mode" value={windowSettings.holdMode} onChange={(e) => setWindowSettings((p) => ({ ...p, holdMode: e.target.value as any }))} fullWidth>
                                  <MenuItem value="Instant">Instant-only</MenuItem>
                                  <MenuItem value="Hold">Hold (pending)</MenuItem>
                                </TextField>

                                <TextField
                                  label="Max hold minutes"
                                  type="number"
                                  value={windowSettings.holdMaxMinutes}
                                  onChange={(e) => setWindowSettings((p) => ({ ...p, holdMaxMinutes: Math.max(1, Math.min(60, parseInt(e.target.value || "10", 10) || 10)) }))}
                                  disabled={windowSettings.holdMode !== "Hold"}
                                  sx={{ mt: 1.2 }}
                                  fullWidth
                                />

                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.2 }}>
                                  <Typography variant="body2">Allow delayed approvals</Typography>
                                  <Switch checked={windowSettings.allowDelayedApproval} onChange={(e) => setWindowSettings((p) => ({ ...p, allowDelayedApproval: e.target.checked }))} disabled={windowSettings.holdMode !== "Hold"} />
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Fallback behavior</Typography>
                                <Typography variant="caption" color="text.secondary">What happens if you don’t approve in time.</Typography>
                                <Divider sx={{ my: 1.2 }} />

                                <Stack spacing={1.2}>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2">Auto-decline after</Typography>
                                    <Switch checked={fallback.enableAutoDecline} onChange={(e) => setFallback((p) => ({ ...p, enableAutoDecline: e.target.checked }))} disabled={windowSettings.holdMode !== "Hold"} />
                                  </Stack>

                                  <TextField
                                    label="Minutes"
                                    type="number"
                                    value={fallback.autoDeclineAfterMinutes}
                                    onChange={(e) => setFallback((p) => ({ ...p, autoDeclineAfterMinutes: Math.max(1, Math.min(60, parseInt(e.target.value || "10", 10) || 10)) }))}
                                    disabled={!fallback.enableAutoDecline || windowSettings.holdMode !== "Hold"}
                                    fullWidth
                                  />

                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2">Suggest reduced amount</Typography>
                                    <Switch checked={fallback.enableSuggestReduced} onChange={(e) => setFallback((p) => ({ ...p, enableSuggestReduced: e.target.checked }))} />
                                  </Stack>

                                  <TextField
                                    label="Suggested amount"
                                    type="number"
                                    value={fallback.suggestedAmount}
                                    onChange={(e) => setFallback((p) => ({ ...p, suggestedAmount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                                    disabled={!fallback.enableSuggestReduced}
                                    InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                    fullWidth
                                  />
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    {/* Auto approve rules */}
                    <Card>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Auto-approve rules</Typography>
                            <Typography variant="body2" color="text.secondary">Trusted vendors and recurring items.</Typography>
                          </Box>
                          <Button variant="contained" startIcon={<Add />} onClick={openNewAutoRule} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                            Add rule
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        {autoRules.length === 0 ? (
                          <Alert severity="info" icon={<Info />}>No auto-approve rules yet.</Alert>
                        ) : (
                          <Stack spacing={1.2}>
                            {autoRules.map((r) => (
                              <Card key={r.id} variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                                <CardContent>
                                  <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                                        <Rule fontSize="small" />
                                      </Box>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>{r.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          Max: {fmtMoney(r.maxAmount, child.currency)}
                                          {r.allowedStart && r.allowedEnd ? ` • ${r.allowedStart}-${r.allowedEnd}` : ""}
                                          {r.recurringLabel ? ` • ${r.recurringLabel}` : ""}
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Switch checked={r.enabled} onChange={(e) => setAutoRules((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: e.target.checked } : x)))} />
                                      <Button size="small" onClick={() => openEditAutoRule(r.id)}>Edit</Button>
                                    </Stack>
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" icon={<Store fontSize="small" />} label={r.vendors.length ? r.vendors.join(", ") : "Any vendor"} sx={{ fontWeight: 900 }} />
                                    <Chip size="small" icon={<Tune fontSize="small" />} label={r.categories.length ? r.categories.join(", ") : "Any category"} sx={{ fontWeight: 900 }} />
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <Button variant="outlined" startIcon={<Close />} onClick={() => removeAutoRule(r.id)} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }} fullWidth>
                                      Remove
                                    </Button>
                                    <Button variant="outlined" startIcon={<Info />} onClick={() => alert("Preview rule evaluation") } sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }} fullWidth>
                                      Preview
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Auto-approve reduces approvals but can conflict with strict policies. Review conflicts above.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={saveAll} disabled={hasWarnings} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>
                    Save rules
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<Info />} onClick={() => alert("Open audit logs") } sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>
                    View audit
                  </Button>
                </Stack>

                {hasWarnings ? (
                  <Alert severity="warning" icon={<WarningAmber />}>Resolve warnings to enable saving.</Alert>
                ) : (
                  <Alert severity="success" icon={<CheckCircle />}>No conflicts detected.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Auto-approve rule drawer */}
      <Drawer anchor="right" open={autoRuleDrawerOpen} onClose={() => setAutoRuleDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 620 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">{editAutoRuleId ? "Edit" : "Add"} auto-approve rule</Typography>
              <Typography variant="body2" color="text.secondary">Trusted vendors and recurring items. Keep it safe.</Typography>
            </Stack>
            <IconButton onClick={() => setAutoRuleDrawerOpen(false)}><Close /></IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <TextField label="Rule name" value={autoDraft.name} onChange={(e) => setAutoDraft((p) => ({ ...p, name: e.target.value }))} />

            <TextField
              label="Max amount"
              type="number"
              value={autoDraft.maxAmount}
              onChange={(e) => setAutoDraft((p) => ({ ...p, maxAmount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
              InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
              helperText="Auto-approve applies only under this amount."
            />

            <MultiSelectChipBox<string>
              title="Vendors"
              subtitle="Leave empty for any vendor"
              options={VENDORS}
              selected={autoDraft.vendors}
              onChange={(next) => setAutoDraft((p) => ({ ...p, vendors: next }))}
              mode={mode}
            />

            <MultiSelectChipBox<Category>
              title="Categories"
              subtitle="Leave empty for any category"
              options={CATEGORIES}
              selected={autoDraft.categories}
              onChange={(next) => setAutoDraft((p) => ({ ...p, categories: next }))}
              mode={mode}
            />

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Optional time window</Typography>
                <Typography variant="caption" color="text.secondary">Restrict auto-approvals to specific hours.</Typography>
                <Divider sx={{ my: 1.2 }} />
                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Start" type="time" value={autoDraft.allowedStart || ""} onChange={(e) => setAutoDraft((p) => ({ ...p, allowedStart: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="End" type="time" value={autoDraft.allowedEnd || ""} onChange={(e) => setAutoDraft((p) => ({ ...p, allowedEnd: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <TextField label="Recurring label (optional)" value={autoDraft.recurringLabel || ""} onChange={(e) => setAutoDraft((p) => ({ ...p, recurringLabel: e.target.value }))} placeholder="e.g., Lunch plan" />

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Enabled</Typography>
                    <Typography variant="caption" color="text.secondary">Disable without deleting.</Typography>
                  </Box>
                  <Switch checked={autoDraft.enabled} onChange={(e) => setAutoDraft((p) => ({ ...p, enabled: e.target.checked }))} />
                </Stack>
              </CardContent>
            </Card>

            {autoDraftErrors.length ? (
              <Alert severity="warning" icon={<WarningAmber />}>
                <b>Fix these:</b>
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {autoDraftErrors.map((e, idx) => (<li key={idx}>{e}</li>))}
                </ul>
              </Alert>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>No validation issues.</Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button fullWidth variant="outlined" startIcon={<Close />} onClick={() => setAutoRuleDrawerOpen(false)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" startIcon={<Rule />} onClick={saveAutoRule} disabled={autoDraftErrors.length > 0} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>Save</Button>
            </Stack>

            <Alert severity="info" icon={<Info />}>After saving, re-check conflicts and adjust thresholds if needed.</Alert>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function MultiSelectChipBox<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onChange,
  mode,
}: {
  title: string;
  subtitle: string;
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
  mode: "light" | "dark";
}) {
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        <Divider sx={{ my: 1.2 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {options.map((o) => {
            const on = selected.includes(o);
            return (
              <Chip
                key={o}
                label={o}
                clickable
                onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
                sx={{
                  fontWeight: 900,
                  bgcolor: on ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                  color: on ? EVZ.green : "text.primary",
                  border: `1px solid ${alpha(on ? EVZ.green : EVZ.ink, on ? 0.22 : mode === "dark" ? 0.25 : 0.10)}`,
                }}
              />
            );
          })}
          {selected.length ? (
            <Button size="small" startIcon={<Close />} onClick={() => onChange([])}>
              Clear
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
