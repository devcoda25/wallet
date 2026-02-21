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
import { motion, AnimatePresence } from "framer-motion";
import {
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  Download,
  Info,
  Lock,
  Payments,
  Schedule,
  Shield,
  Store,
  Tune,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Spending Limits (Premium)
 * Route: /parent/edupocket/children/:childId/controls/limits
 * Includes:
 * - LimitEditor: per txn + daily/weekly/monthly/term/semester
 * - CategoryLimitGrid
 * - VendorLimitTable
 * - TimeWindowLimitEditor with overlap validation
 * - Soft vs Hard toggle
 * - Funding type split toggle (allowance vs top-up)
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

type Enforcement = "Hard" | "Soft";

type PeriodLimits = {
  perTxn: number;
  daily: number;
  weekly: number;
  monthly: number;
  term: number;
  semester: number;
};

type Category = "Food" | "Books" | "Transport" | "Fees" | "Other";

type CategoryLimit = {
  category: Category;
  daily: number;
  weekly: number;
  monthly: number;
};

type VendorLimit = {
  id: string;
  vendor: string;
  registry: "School" | "Off-campus";
  perTxn: number;
  daily: number;
};

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type TimeWindow = {
  id: string;
  name: string;
  days: Day[];
  start: string; // HH:MM
  end: string; // HH:MM
  cap: number;
  enforcement: Enforcement;
  categories: Category[] | "Any";
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
                <Payments fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>EduPocket - Spending Limits</Typography>
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

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

const CATEGORIES: Category[] = ["Food", "Books", "Transport", "Fees", "Other"];

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

function parseTime(t: string) {
  const [h, m] = (t || "00:00").split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function dayIntersect(a: Day[], b: Day[]) {
  const setB = new Set(b);
  return a.some((d) => setB.has(d));
}

function windowsOverlap(a: TimeWindow, b: TimeWindow) {
  if (a.id === b.id) return false;
  if (!dayIntersect(a.days, b.days)) return false;

  const as = parseTime(a.start);
  const ae = parseTime(a.end);
  const bs = parseTime(b.start);
  const be = parseTime(b.end);

  if (as >= ae || bs >= be) return true; // invalid window treated as overlap/invalid

  return as < be && bs < ae;
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

function defaultPeriodLimits(): PeriodLimits {
  return {
    perTxn: 15000,
    daily: 30000,
    weekly: 120000,
    monthly: 350000,
    term: 900000,
    semester: 1500000,
  };
}

function defaultCategoryLimits(): CategoryLimit[] {
  return [
    { category: "Food", daily: 15000, weekly: 60000, monthly: 180000 },
    { category: "Books", daily: 25000, weekly: 80000, monthly: 220000 },
    { category: "Transport", daily: 15000, weekly: 50000, monthly: 140000 },
    { category: "Fees", daily: 0, weekly: 0, monthly: 0 },
    { category: "Other", daily: 10000, weekly: 30000, monthly: 80000 },
  ];
}

function defaultVendorLimits(): VendorLimit[] {
  return [
    { id: "v1", vendor: "School Canteen", registry: "School", perTxn: 10000, daily: 15000 },
    { id: "v2", vendor: "Campus Bookshop", registry: "School", perTxn: 20000, daily: 25000 },
    { id: "v3", vendor: "Uniform Store", registry: "Off-campus", perTxn: 25000, daily: 25000 },
  ];
}

function defaultTimeWindows(): TimeWindow[] {
  return [
    {
      id: "tw1",
      name: "Break time",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "10:00",
      end: "10:30",
      cap: 6000,
      enforcement: "Hard",
      categories: ["Food"],
    },
    {
      id: "tw2",
      name: "Lunch",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "12:00",
      end: "13:30",
      cap: 12000,
      enforcement: "Hard",
      categories: ["Food"],
    },
  ];
}

export default function EduPocketSpendingLimits() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [enforcement, setEnforcement] = useState<Enforcement>("Hard");
  const [splitFundingTypes, setSplitFundingTypes] = useState(false);

  const [limitsBase, setLimitsBase] = useState<PeriodLimits>(defaultPeriodLimits());
  const [limitsAllowance, setLimitsAllowance] = useState<PeriodLimits>({ ...defaultPeriodLimits(), daily: 20000, weekly: 90000 });
  const [limitsTopUp, setLimitsTopUp] = useState<PeriodLimits>({ ...defaultPeriodLimits(), daily: 40000, weekly: 150000 });

  const activeLimits = splitFundingTypes ? limitsAllowance : limitsBase;

  const [activeFundingTab, setActiveFundingTab] = useState<"Allowance" | "TopUp">("Allowance");

  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>(defaultCategoryLimits());
  const [vendorLimits, setVendorLimits] = useState<VendorLimit[]>(defaultVendorLimits());

  const [windows, setWindows] = useState<TimeWindow[]>(defaultTimeWindows());

  const [windowDrawerOpen, setWindowDrawerOpen] = useState(false);
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);

  const [draftWindow, setDraftWindow] = useState<TimeWindow>(() => ({
    id: "",
    name: "",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    start: "10:00",
    end: "10:30",
    cap: 5000,
    enforcement: "Hard",
    categories: "Any",
  }));

  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<VendorLimit>({ id: "", vendor: "", registry: "School", perTxn: 0, daily: 0 });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  // Overlap validation
  const overlapPairs = useMemo(() => {
    const pairs: Array<{ a: TimeWindow; b: TimeWindow }> = [];
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        if (windowsOverlap(windows[i], windows[j])) pairs.push({ a: windows[i], b: windows[j] });
      }
    }
    return pairs;
  }, [windows]);

  const hasOverlap = overlapPairs.length > 0;

  const activeLimitsForTab = useMemo(() => {
    if (!splitFundingTypes) return { tab: "Base" as const, limits: limitsBase };
    return activeFundingTab === "Allowance" ? { tab: "Allowance" as const, limits: limitsAllowance } : { tab: "TopUp" as const, limits: limitsTopUp };
  }, [splitFundingTypes, activeFundingTab, limitsBase, limitsAllowance, limitsTopUp]);

  const setActiveLimits = (patch: Partial<PeriodLimits>) => {
    if (!splitFundingTypes) {
      setLimitsBase((p) => ({ ...p, ...patch }));
      return;
    }
    if (activeFundingTab === "Allowance") setLimitsAllowance((p) => ({ ...p, ...patch }));
    else setLimitsTopUp((p) => ({ ...p, ...patch }));
  };

  const exportAll = () => {
    const rows: string[] = [];
    rows.push(["section", "key", "value"].join(","));

    const pushPeriod = (label: string, l: PeriodLimits) => {
      rows.push(["period", `${label}.perTxn`, String(l.perTxn)].map(csvSafe).join(","));
      rows.push(["period", `${label}.daily`, String(l.daily)].map(csvSafe).join(","));
      rows.push(["period", `${label}.weekly`, String(l.weekly)].map(csvSafe).join(","));
      rows.push(["period", `${label}.monthly`, String(l.monthly)].map(csvSafe).join(","));
      rows.push(["period", `${label}.term`, String(l.term)].map(csvSafe).join(","));
      rows.push(["period", `${label}.semester`, String(l.semester)].map(csvSafe).join(","));
    };

    pushPeriod("base", limitsBase);
    pushPeriod("allowance", limitsAllowance);
    pushPeriod("topup", limitsTopUp);

    for (const c of categoryLimits) {
      rows.push(["category", `${c.category}.daily`, String(c.daily)].map(csvSafe).join(","));
      rows.push(["category", `${c.category}.weekly`, String(c.weekly)].map(csvSafe).join(","));
      rows.push(["category", `${c.category}.monthly`, String(c.monthly)].map(csvSafe).join(","));
    }

    for (const v of vendorLimits) {
      rows.push(["vendor", `${v.vendor}.perTxn`, String(v.perTxn)].map(csvSafe).join(","));
      rows.push(["vendor", `${v.vendor}.daily`, String(v.daily)].map(csvSafe).join(","));
      rows.push(["vendor", `${v.vendor}.registry`, v.registry].map(csvSafe).join(","));
    }

    for (const w of windows) {
      rows.push(["window", `${w.name}.days`, w.days.join("|")].map(csvSafe).join(","));
      rows.push(["window", `${w.name}.time`, `${w.start}-${w.end}`].map(csvSafe).join(","));
      rows.push(["window", `${w.name}.cap`, String(w.cap)].map(csvSafe).join(","));
      rows.push(["window", `${w.name}.enforcement`, w.enforcement].map(csvSafe).join(","));
      rows.push(["window", `${w.name}.categories`, w.categories === "Any" ? "Any" : w.categories.join("|")].map(csvSafe).join(","));
    }

    downloadText(`edupocket_limits_${child.id}_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  // Time window editor validation
  const draftErrors = useMemo(() => {
    const errs: string[] = [];
    const s = parseTime(draftWindow.start);
    const e = parseTime(draftWindow.end);
    if (!draftWindow.name.trim()) errs.push("Window name is required");
    if (!draftWindow.days.length) errs.push("Select at least one day");
    if (s >= e) errs.push("Start time must be before end time");
    if (draftWindow.cap < 0) errs.push("Cap must be >= 0");

    // overlap check against other windows
    const compareWindow: TimeWindow = draftWindow;
    const others = editingWindowId ? windows.filter((w) => w.id !== editingWindowId) : windows;
    const overlaps = others.some((w) => windowsOverlap({ ...compareWindow, id: compareWindow.id || "draft" }, w));
    if (overlaps) errs.push("Overlaps with an existing window");

    return errs;
  }, [draftWindow, windows, editingWindowId]);

  const openNewWindow = () => {
    setEditingWindowId(null);
    setDraftWindow({
      id: "",
      name: "",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "10:00",
      end: "10:30",
      cap: 5000,
      enforcement,
      categories: "Any",
    });
    setWindowDrawerOpen(true);
  };

  const openEditWindow = (id: string) => {
    const w = windows.find((x) => x.id === id);
    if (!w) return;
    setEditingWindowId(id);
    setDraftWindow({ ...w });
    setWindowDrawerOpen(true);
  };

  const saveWindow = () => {
    if (draftErrors.length) return;
    if (editingWindowId) {
      setWindows((p) => p.map((w) => (w.id === editingWindowId ? { ...draftWindow, id: editingWindowId } : w)));
      toast("Window updated", "success");
    } else {
      const id = `tw_${Math.floor(100000 + Math.random() * 899999)}`;
      setWindows((p) => [{ ...draftWindow, id }, ...p]);
      toast("Window added", "success");
    }
    setWindowDrawerOpen(false);
  };

  const deleteWindow = (id: string) => {
    setWindows((p) => p.filter((w) => w.id !== id));
    toast("Window removed", "info");
  };

  const openVendorDrawer = () => {
    setVendorDraft({ id: "", vendor: "", registry: "School", perTxn: 0, daily: 0 });
    setVendorDrawerOpen(true);
  };

  const saveVendor = () => {
    if (!vendorDraft.vendor.trim()) return toast("Vendor name required", "warning");
    const id = `vl_${Math.floor(1000 + Math.random() * 8999)}`;
    setVendorLimits((p) => [{ ...vendorDraft, id }, ...p]);
    setVendorDrawerOpen(false);
    toast("Vendor limit added", "success");
  };

  const updateVendorLimit = (id: string, patch: Partial<VendorLimit>) => {
    setVendorLimits((p) => p.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVendor = (id: string) => {
    setVendorLimits((p) => p.filter((v) => v.id !== id));
    toast("Vendor limit removed", "info");
  };

  const setCategoryLimit = (cat: Category, patch: Partial<CategoryLimit>) => {
    setCategoryLimits((p) => p.map((c) => (c.category === cat ? { ...c, ...patch } : c)));
  };

  const resetAll = () => {
    setEnforcement("Hard");
    setSplitFundingTypes(false);
    setLimitsBase(defaultPeriodLimits());
    setLimitsAllowance({ ...defaultPeriodLimits(), daily: 20000, weekly: 90000 });
    setLimitsTopUp({ ...defaultPeriodLimits(), daily: 40000, weekly: 150000 });
    setCategoryLimits(defaultCategoryLimits());
    setVendorLimits(defaultVendorLimits());
    setWindows(defaultTimeWindows());
    toast("Reset to defaults", "info");
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
                    <Typography variant="h5">Spending limits</Typography>
                    <Typography variant="body2" color="text.secondary">Set limits by period, category, vendor and time windows.</Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} - {c.school}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<Download />} onClick={exportAll} sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}>Export</Button>
                    <Button variant="outlined" startIcon={<Tune />} onClick={resetAll} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}>Reset</Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Soft vs Hard + Funding split */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.22)}` }}>
                              <Lock fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Soft vs Hard</Typography>
                              <Typography variant="caption" color="text.secondary">Hard blocks spending. Soft warns and logs.</Typography>
                            </Box>
                          </Stack>

                          <TextField
                            select
                            label="Enforcement"
                            value={enforcement}
                            onChange={(e) => setEnforcement(e.target.value as Enforcement)}
                            sx={{ minWidth: 160 }}
                          >
                            <MenuItem value="Hard">Hard</MenuItem>
                            <MenuItem value="Soft">Soft</MenuItem>
                          </TextField>
                        </Stack>

                        <Divider sx={{ my: 1.2 }} />

                        <Typography variant="caption" color="text.secondary">
                          Best practice: keep "Hard" for school-day rules and "Soft" for coaching / nudges.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                              <VerifiedUser fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Split by funding type</Typography>
                              <Typography variant="caption" color="text.secondary">Separate limits for allowance vs top-up.</Typography>
                            </Box>
                          </Stack>

                          <Switch checked={splitFundingTypes} onChange={(e) => setSplitFundingTypes(e.target.checked)} />
                        </Stack>

                        <Divider sx={{ my: 1.2 }} />

                        <Typography variant="caption" color="text.secondary">
                          Use split limits to keep allowance disciplined while allowing higher top-ups for fees.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Period limits */}
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Limit editor</Typography>
                        <Typography variant="body2" color="text.secondary">Period limits and per-transaction controls.</Typography>
                      </Box>

                      {splitFundingTypes ? (
                        <Stack direction="row" spacing={1}>
                          {(["Allowance", "TopUp"] as const).map((t) => {
                            const active = activeFundingTab === t;
                            return (
                              <Chip
                                key={t}
                                label={t}
                                clickable
                                onClick={() => setActiveFundingTab(t)}
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
                      ) : null}
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.6}>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Per transaction" currency={child.currency} value={activeLimitsForTab.limits.perTxn} onChange={(v) => setActiveLimits({ perTxn: v })} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Daily" currency={child.currency} value={activeLimitsForTab.limits.daily} onChange={(v) => setActiveLimits({ daily: v })} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Weekly" currency={child.currency} value={activeLimitsForTab.limits.weekly} onChange={(v) => setActiveLimits({ weekly: v })} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Monthly" currency={child.currency} value={activeLimitsForTab.limits.monthly} onChange={(v) => setActiveLimits({ monthly: v })} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Term" currency={child.currency} value={activeLimitsForTab.limits.term} onChange={(v) => setActiveLimits({ term: v })} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <LimitField label="Semester" currency={child.currency} value={activeLimitsForTab.limits.semester} onChange={(v) => setActiveLimits({ semester: v })} />
                      </Grid>
                    </Grid>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Enforcement applies globally. Time windows can override with their own soft/hard mode.
                    </Alert>
                  </CardContent>
                </Card>

                {/* Category limits + vendor limits */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Category limits</Typography>
                        <Typography variant="body2" color="text.secondary">Caps per category (daily/weekly/monthly).</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.2}>
                          {categoryLimits.map((c) => (
                            <Grid key={c.category} item xs={12} md={6}>
                              <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                                <CardContent>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{c.category}</Typography>
                                    <Chip size="small" label={enforcement} sx={{ fontWeight: 900, bgcolor: alpha(enforcement === "Hard" ? EVZ.orange : EVZ.green, 0.10), color: enforcement === "Hard" ? EVZ.orange : EVZ.green, border: `1px solid ${alpha(enforcement === "Hard" ? EVZ.orange : EVZ.green, 0.22)}` }} />
                                  </Stack>
                                  <Divider sx={{ my: 1.2 }} />
                                  <Stack spacing={1}>
                                    <MiniLimit label="Daily" currency={child.currency} value={c.daily} onChange={(v) => setCategoryLimit(c.category, { daily: v })} />
                                    <MiniLimit label="Weekly" currency={child.currency} value={c.weekly} onChange={(v) => setCategoryLimit(c.category, { weekly: v })} />
                                    <MiniLimit label="Monthly" currency={child.currency} value={c.monthly} onChange={(v) => setCategoryLimit(c.category, { monthly: v })} />
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Category caps combine with period limits. The strictest cap wins.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Card>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Vendor limits</Typography>
                            <Typography variant="body2" color="text.secondary">Vendor-specific caps (per txn + daily).</Typography>
                          </Box>
                          <Button variant="contained" startIcon={<Add />} onClick={openVendorDrawer} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                            Add vendor
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        {vendorLimits.length === 0 ? (
                          <Alert severity="info" icon={<Info />}>No vendor limits configured.</Alert>
                        ) : (
                          <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 950 }}>Vendor</TableCell>
                                  <TableCell sx={{ fontWeight: 950 }}>Registry</TableCell>
                                  <TableCell sx={{ fontWeight: 950, textAlign: "right" }}>Per txn</TableCell>
                                  <TableCell sx={{ fontWeight: 950, textAlign: "right" }}>Daily</TableCell>
                                  <TableCell sx={{ fontWeight: 950 }} />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {vendorLimits.map((v) => (
                                  <TableRow key={v.id} hover>
                                    <TableCell>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ width: 34, height: 34, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                                          <Store fontSize="small" />
                                        </Box>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{v.vendor}</Typography>
                                          {v.registry === "Off-campus" ? (
                                            <Chip size="small" label="Off-campus" sx={{ mt: 0.3, fontWeight: 900, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.22)}` }} />
                                          ) : (
                                            <Chip size="small" label="School" sx={{ mt: 0.3, fontWeight: 900, bgcolor: alpha(EVZ.green, 0.10), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }} />
                                          )}
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell>{v.registry}</TableCell>
                                    <TableCell sx={{ textAlign: "right" }}>
                                      <TextField
                                        size="small"
                                        value={v.perTxn}
                                        onChange={(e) => updateVendorLimit(v.id, { perTxn: num(e.target.value) })}
                                        InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                        sx={{ maxWidth: 160 }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: "right" }}>
                                      <TextField
                                        size="small"
                                        value={v.daily}
                                        onChange={(e) => updateVendorLimit(v.id, { daily: num(e.target.value) })}
                                        InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                        sx={{ maxWidth: 160 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button size="small" onClick={() => removeVendor(v.id)} startIcon={<Close />}>
                                        Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        )}

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Vendor limits override category and period limits when stricter.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Time windows */}
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Time window limits</Typography>
                        <Typography variant="body2" color="text.secondary">Caps during specific hours (lunch/break).</Typography>
                      </Box>
                      <Button variant="contained" startIcon={<Add />} onClick={openNewWindow} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                        Add window
                      </Button>
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <AnimatePresence initial={false}>
                      {hasOverlap ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                          <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 1.4 }}>
                            Overlapping windows detected. Overlaps can cause unpredictable outcomes. Fix overlaps before saving.
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Grid container spacing={1.2}>
                      {windows.map((w) => {
                        const age = `${w.start}-${w.end}`;
                        const cats = w.categories === "Any" ? "Any category" : w.categories.join(", ");
                        return (
                          <Grid key={w.id} item xs={12} md={6}>
                            <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(w.enforcement === "Hard" ? EVZ.orange : EVZ.green, 0.20) }}>
                              <CardContent>
                                <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                                      <Schedule fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{w.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{w.days.join(", ")} • {age}</Typography>
                                    </Box>
                                  </Stack>
                                  <Chip size="small" label={w.enforcement} sx={{ fontWeight: 900, bgcolor: alpha(w.enforcement === "Hard" ? EVZ.orange : EVZ.green, 0.10), color: w.enforcement === "Hard" ? EVZ.orange : EVZ.green, border: `1px solid ${alpha(w.enforcement === "Hard" ? EVZ.orange : EVZ.green, 0.22)}` }} />
                                </Stack>

                                <Divider sx={{ my: 1.2 }} />

                                <Typography variant="body2" sx={{ fontWeight: 950 }}>{fmtMoney(w.cap, child.currency)}</Typography>
                                <Typography variant="caption" color="text.secondary">{cats}</Typography>

                                <Divider sx={{ my: 1.2 }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button variant="outlined" startIcon={<Tune />} onClick={() => openEditWindow(w.id)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }} fullWidth>
                                    Edit
                                  </Button>
                                  <Button variant="outlined" startIcon={<Close />} onClick={() => deleteWindow(w.id)} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }} fullWidth>
                                    Remove
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>

                    {windows.length === 0 ? (
                      <Alert severity="info" icon={<Info />} sx={{ mt: 1.4 }}>No time windows configured.</Alert>
                    ) : null}

                    {hasOverlap ? (
                      <Card variant="outlined" sx={{ mt: 1.6, bgcolor: alpha(EVZ.orange, 0.06), borderColor: alpha(EVZ.orange, 0.22) }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Overlap details</Typography>
                          <Typography variant="caption" color="text.secondary">These windows overlap on shared days/time.</Typography>
                          <Divider sx={{ my: 1.2 }} />
                          <Stack spacing={0.8}>
                            {overlapPairs.slice(0, 6).map((p, idx) => (
                              <Typography key={idx} variant="caption" color="text.secondary">
                                • "{p.a.name}" ({p.a.start}-{p.a.end}) overlaps with "{p.b.name}" ({p.b.start}-{p.b.end})
                              </Typography>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : null}
                  </CardContent>
                </Card>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button variant="contained" startIcon={<CheckCircle />} onClick={() => toast("Limits saved", "success")} disabled={hasOverlap} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }} fullWidth>
                    Save limits
                  </Button>
                  <Button variant="outlined" startIcon={<Info />} onClick={() => alert("Open audit logs") } sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }} fullWidth>
                    View audit
                  </Button>
                </Stack>

                {hasOverlap ? (
                  <Alert severity="warning" icon={<WarningAmber />}>Resolve window overlaps to enable saving.</Alert>
                ) : (
                  <Alert severity="info" icon={<Info />}>Limits are enforced using rule priority (System > School > Parent > Student).</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Time window editor drawer */}
      <Drawer anchor="right" open={windowDrawerOpen} onClose={() => setWindowDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 620 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">{editingWindowId ? "Edit" : "Add"} time window</Typography>
              <Typography variant="body2" color="text.secondary">Configure limits for specific hours. Overlaps are not allowed.</Typography>
            </Stack>
            <IconButton onClick={() => setWindowDrawerOpen(false)}><Close /></IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <TextField label="Name" value={draftWindow.name} onChange={(e) => setDraftWindow((p) => ({ ...p, name: e.target.value }))} />

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Days</Typography>
                <Typography variant="caption" color="text.secondary">Choose days this window applies to.</Typography>
                <Divider sx={{ my: 1.2 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Day[]).map((d) => {
                    const on = draftWindow.days.includes(d);
                    return (
                      <Chip
                        key={d}
                        label={d}
                        clickable
                        onClick={() =>
                          setDraftWindow((p) => ({
                            ...p,
                            days: on ? p.days.filter((x) => x !== d) : [...p.days, d],
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

            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Start" type="time" value={draftWindow.start} onChange={(e) => setDraftWindow((p) => ({ ...p, start: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="End" type="time" value={draftWindow.end} onChange={(e) => setDraftWindow((p) => ({ ...p, end: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
            </Grid>

            <TextField
              label="Cap"
              type="number"
              value={draftWindow.cap}
              onChange={(e) => setDraftWindow((p) => ({ ...p, cap: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
              InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
              helperText="Max spend allowed inside this window." 
            />

            <TextField
              select
              label="Enforcement"
              value={draftWindow.enforcement}
              onChange={(e) => setDraftWindow((p) => ({ ...p, enforcement: e.target.value as Enforcement }))}
            >
              <MenuItem value="Hard">Hard (block)</MenuItem>
              <MenuItem value="Soft">Soft (warn)</MenuItem>
            </TextField>

            <TextField
              select
              label="Categories"
              value={draftWindow.categories === "Any" ? "Any" : "Custom"}
              onChange={(e) => {
                const v = e.target.value;
                setDraftWindow((p) => ({ ...p, categories: v === "Any" ? "Any" : ["Food"] }));
              }}
              helperText="Limit applies only to selected categories (optional)."
            >
              <MenuItem value="Any">Any category</MenuItem>
              <MenuItem value="Custom">Choose categories</MenuItem>
            </TextField>

            {draftWindow.categories !== "Any" ? (
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Select categories</Typography>
                  <Divider sx={{ my: 1.2 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {CATEGORIES.map((c) => {
                      const on = (draftWindow.categories as Category[]).includes(c);
                      return (
                        <Chip
                          key={c}
                          label={c}
                          clickable
                          onClick={() =>
                            setDraftWindow((p) => {
                              const cur = p.categories === "Any" ? [] : (p.categories as Category[]);
                              const next = on ? cur.filter((x) => x !== c) : [...cur, c];
                              return { ...p, categories: next.length ? next : [c] };
                            })
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
            ) : null}

            {draftErrors.length ? (
              <Alert severity="warning" icon={<WarningAmber />}>
                <b>Fix these before saving:</b>
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {draftErrors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </Alert>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>No validation issues.</Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button fullWidth variant="outlined" startIcon={<Close />} onClick={() => setWindowDrawerOpen(false)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={saveWindow} disabled={draftErrors.length > 0} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>Save</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Vendor limit add drawer */}
      <Drawer anchor="right" open={vendorDrawerOpen} onClose={() => setVendorDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Add vendor limit</Typography>
              <Typography variant="body2" color="text.secondary">Set stricter caps for specific vendors.</Typography>
            </Stack>
            <IconButton onClick={() => setVendorDrawerOpen(false)}><Close /></IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <TextField label="Vendor name" value={vendorDraft.vendor} onChange={(e) => setVendorDraft((p) => ({ ...p, vendor: e.target.value }))} placeholder="e.g., School Canteen" />
            <TextField select label="Registry" value={vendorDraft.registry} onChange={(e) => setVendorDraft((p) => ({ ...p, registry: e.target.value as any }))}>
              <MenuItem value="School">School</MenuItem>
              <MenuItem value="Off-campus">Off-campus</MenuItem>
            </TextField>
            <TextField label="Per transaction" type="number" value={vendorDraft.perTxn} onChange={(e) => setVendorDraft((p) => ({ ...p, perTxn: num(e.target.value) }))} InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }} />
            <TextField label="Daily" type="number" value={vendorDraft.daily} onChange={(e) => setVendorDraft((p) => ({ ...p, daily: num(e.target.value) }))} InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }} />

            <Alert severity="info" icon={<Info />}>If vendor is off-campus, ensure your Vendor Controls allow it.</Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button fullWidth variant="outlined" startIcon={<Close />} onClick={() => setVendorDrawerOpen(false)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" startIcon={<Add />} onClick={saveVendor} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>Add vendor</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function num(v: string) {
  return Math.max(0, parseInt((v || "0").replace(/[^0-9]/g, ""), 10) || 0);
}

function LimitField({ label, currency, value, onChange }: { label: string; currency: string; value: number; onChange: (v: number) => void }) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <TextField
          value={value}
          onChange={(e) => onChange(num(e.target.value))}
          InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
          fullWidth
          sx={{ mt: 0.8 }}
        />
      </CardContent>
    </Card>
  );
}

function MiniLimit({ label, currency, value, onChange }: { label: string; currency: string; value: number; onChange: (v: number) => void }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <TextField
        size="small"
        value={value}
        onChange={(e) => onChange(num(e.target.value))}
        InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
        sx={{ maxWidth: 170 }}
      />
    </Stack>
  );
}
