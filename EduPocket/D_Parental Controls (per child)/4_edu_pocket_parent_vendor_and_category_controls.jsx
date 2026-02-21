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
  Info,
  Lock,
  Map,
  Search,
  Shield,
  ShoppingBag,
  Store,
  Tune,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Vendor & Category Controls (Premium)
 * Route: /parent/edupocket/children/:childId/controls/vendors
 * Includes:
 * - VendorAllowBlockManager (search + allow/block + off-campus label)
 * - CategoryAllowBlockManager
 * - CampusOnlyModeToggle
 * - PerCategoryTimeRules
 * - ProductRestrictionEditor (only if vendor supports catalog)
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

type VendorStatus = "Allowed" | "Blocked" | "Neutral";

type Registry = "School" | "Off-campus";

type Vendor = {
  id: string;
  name: string;
  category: Category;
  registry: Registry;
  status: VendorStatus;
  supportsCatalog: boolean;
  catalog?: string[];
  blockedProducts?: string[];
};

type CategoryState = {
  category: Category;
  allowed: boolean;
  timeRuleEnabled: boolean;
  start: string;
  end: string;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

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
                <Store fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>EduPocket - Vendors</Typography>
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

function validTimeWindow(start: string, end: string) {
  return parseTime(start) < parseTime(end);
}

export default function EduPocketVendorCategoryControls() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [campusOnly, setCampusOnly] = useState(true);

  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "v1",
      name: "School Canteen",
      category: "Food",
      registry: "School",
      status: "Allowed",
      supportsCatalog: true,
      catalog: ["Lunch", "Water", "Soda", "Energy drink", "Snacks"],
      blockedProducts: ["Energy drink"],
    },
    {
      id: "v2",
      name: "Campus Bookshop",
      category: "Books",
      registry: "School",
      status: "Allowed",
      supportsCatalog: true,
      catalog: ["Exercise book", "Pens", "Textbook set", "Markers"],
      blockedProducts: [],
    },
    { id: "v3", name: "School Transport", category: "Transport", registry: "School", status: "Allowed", supportsCatalog: false },
    { id: "v4", name: "Uniform Store", category: "Other", registry: "Off-campus", status: "Neutral", supportsCatalog: false },
    { id: "v5", name: "New Snack Kiosk", category: "Food", registry: "Off-campus", status: "Blocked", supportsCatalog: false },
  ]);

  const [vendorTab, setVendorTab] = useState<"All" | "Allowed" | "Blocked">("All");
  const [vendorSearch, setVendorSearch] = useState("");

  const [categories, setCategories] = useState<CategoryState[]>([
    { category: "Food", allowed: true, timeRuleEnabled: true, start: "10:00", end: "14:00" },
    { category: "Books", allowed: true, timeRuleEnabled: false, start: "07:00", end: "18:30" },
    { category: "Transport", allowed: true, timeRuleEnabled: false, start: "06:30", end: "19:00" },
    { category: "Fees", allowed: true, timeRuleEnabled: false, start: "07:00", end: "18:30" },
    { category: "Other", allowed: true, timeRuleEnabled: false, start: "07:00", end: "18:30" },
  ]);

  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [productVendorId, setProductVendorId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [newBlockedItem, setNewBlockedItem] = useState("");

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();

    return vendors
      .filter((v) => {
        if (vendorTab === "Allowed") return v.status === "Allowed";
        if (vendorTab === "Blocked") return v.status === "Blocked";
        return true;
      })
      .filter((v) => {
        if (!q) return true;
        return `${v.name} ${v.category} ${v.registry}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // keep school vendors first
        if (a.registry !== b.registry) return a.registry === "School" ? -1 : 1;
        // then allowed first
        const rank = (s: VendorStatus) => (s === "Allowed" ? 0 : s === "Neutral" ? 1 : 2);
        return rank(a.status) - rank(b.status);
      });
  }, [vendors, vendorTab, vendorSearch]);

  const counts = useMemo(() => {
    return {
      allowed: vendors.filter((v) => v.status === "Allowed").length,
      blocked: vendors.filter((v) => v.status === "Blocked").length,
      all: vendors.length,
      offCampus: vendors.filter((v) => v.registry === "Off-campus").length,
    };
  }, [vendors]);

  const selectedVendor = useMemo(() => vendors.find((v) => v.id === productVendorId) ?? null, [vendors, productVendorId]);

  const displayedCatalog = useMemo(() => {
    if (!selectedVendor?.catalog) return [];
    const q = productSearch.trim().toLowerCase();
    return selectedVendor.catalog.filter((p) => (q ? p.toLowerCase().includes(q) : true));
  }, [selectedVendor, productSearch]);

  const campusOnlyWarning = useMemo(() => {
    if (!campusOnly) return null;
    const offCampusAllowed = vendors.some((v) => v.registry === "Off-campus" && v.status === "Allowed");
    if (offCampusAllowed) return "Campus-only mode is ON but some off-campus vendors are allowed.";
    return null;
  }, [campusOnly, vendors]);

  const categoryTimeErrors = useMemo(() => {
    const errs: string[] = [];
    for (const c of categories) {
      if (c.timeRuleEnabled && !validTimeWindow(c.start, c.end)) {
        errs.push(`${c.category}: start must be before end`);
      }
    }
    return errs;
  }, [categories]);

  const setVendorStatus = (id: string, status: VendorStatus) => {
    setVendors((p) => p.map((v) => (v.id === id ? { ...v, status } : v)));
    toast(`Vendor set to ${status}`, status === "Blocked" ? "warning" : "success");
  };

  const openProductRestrictions = (id: string) => {
    const v = vendors.find((x) => x.id === id);
    if (!v?.supportsCatalog) {
      toast("This vendor does not support item catalogs", "info");
      return;
    }
    setProductVendorId(id);
    setProductSearch("");
    setNewBlockedItem("");
    setProductDrawerOpen(true);
  };

  const toggleBlockedProduct = (product: string) => {
    if (!selectedVendor) return;
    const blocked = new Set(selectedVendor.blockedProducts ?? []);
    if (blocked.has(product)) blocked.delete(product);
    else blocked.add(product);

    setVendors((p) => p.map((v) => (v.id === selectedVendor.id ? { ...v, blockedProducts: Array.from(blocked) } : v)));
  };

  const addBlockedProduct = () => {
    if (!selectedVendor) return;
    const item = newBlockedItem.trim();
    if (!item) return;

    const blocked = new Set(selectedVendor.blockedProducts ?? []);
    blocked.add(item);

    // add into catalog if it doesn't exist so it can be seen
    const cat = new Set(selectedVendor.catalog ?? []);
    cat.add(item);

    setVendors((p) => p.map((v) => (v.id === selectedVendor.id ? { ...v, blockedProducts: Array.from(blocked), catalog: Array.from(cat) } : v)));

    setNewBlockedItem("");
    toast("Blocked item added", "success");
  };

  const toggleCategoryAllowed = (cat: Category, allowed: boolean) => {
    setCategories((p) => p.map((c) => (c.category === cat ? { ...c, allowed } : c)));
  };

  const setCategoryTime = (cat: Category, patch: Partial<CategoryState>) => {
    setCategories((p) => p.map((c) => (c.category === cat ? { ...c, ...patch } : c)));
  };

  const saveAll = () => {
    if (categoryTimeErrors.length) return toast("Fix category time rule errors", "warning");
    if (campusOnlyWarning) return toast("Resolve campus-only conflicts", "warning");
    toast("Vendor and category controls saved", "success");
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
                    <Typography variant="h5">Vendor and category controls</Typography>
                    <Typography variant="body2" color="text.secondary">Allowlist/blocklist vendors, block categories, and set time rules.</Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} - {c.school}</MenuItem>
                      ))}
                    </TextField>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={saveAll} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>Save</Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Campus only */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.6, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}>
                          <Map fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Campus-only mode</Typography>
                          <Typography variant="caption" color="text.secondary">Only allow school registry vendors (recommended for younger students).</Typography>
                        </Box>
                      </Stack>
                      <Switch checked={campusOnly} onChange={(e) => setCampusOnly(e.target.checked)} />
                    </Stack>

                    {campusOnlyWarning ? (
                      <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                        {campusOnlyWarning}
                      </Alert>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.2, display: "block" }}>
                        Off-campus vendors: {counts.offCampus}. Allowed: {counts.allowed}. Blocked: {counts.blocked}.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    {/* Vendor allow/block manager */}
                    <Card>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Vendors</Typography>
                            <Typography variant="body2" color="text.secondary">Allowlist / blocklist with search.</Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                              label={`All (${counts.all})`}
                              clickable
                              onClick={() => setVendorTab("All")}
                              sx={{ fontWeight: 900, bgcolor: vendorTab === "All" ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, 0.06), color: vendorTab === "All" ? EVZ.green : "text.primary" }}
                            />
                            <Chip
                              label={`Allowed (${counts.allowed})`}
                              clickable
                              onClick={() => setVendorTab("Allowed")}
                              sx={{ fontWeight: 900, bgcolor: vendorTab === "Allowed" ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, 0.06), color: vendorTab === "Allowed" ? EVZ.green : "text.primary" }}
                            />
                            <Chip
                              label={`Blocked (${counts.blocked})`}
                              clickable
                              onClick={() => setVendorTab("Blocked")}
                              sx={{ fontWeight: 900, bgcolor: vendorTab === "Blocked" ? alpha(EVZ.orange, 0.12) : alpha(EVZ.ink, 0.06), color: vendorTab === "Blocked" ? EVZ.orange : "text.primary" }}
                            />
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <TextField
                          fullWidth
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="Search vendors"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                            ),
                          }}
                        />

                        <Divider sx={{ my: 1.6 }} />

                        {filteredVendors.length === 0 ? (
                          <Alert severity="info" icon={<Info />}>No vendors match.</Alert>
                        ) : (
                          <Stack spacing={1.2}>
                            {filteredVendors.map((v) => (
                              <VendorCard
                                key={v.id}
                                mode={mode}
                                vendor={v}
                                campusOnly={campusOnly}
                                onAllow={() => setVendorStatus(v.id, "Allowed")}
                                onBlock={() => setVendorStatus(v.id, "Blocked")}
                                onNeutral={() => setVendorStatus(v.id, "Neutral")}
                                onProducts={() => openProductRestrictions(v.id)}
                              />
                            ))}
                          </Stack>
                        )}

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Off-campus vendors are labelled. Campus-only mode blocks them unless explicitly allowed.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    {/* Category manager */}
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Categories</Typography>
                        <Typography variant="body2" color="text.secondary">Allow/block spending categories.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          {categories.map((c) => (
                            <Card key={c.category} variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(c.allowed ? EVZ.green : EVZ.orange, 0.12), color: c.allowed ? EVZ.green : EVZ.orange, border: `1px solid ${alpha(c.allowed ? EVZ.green : EVZ.orange, 0.22)}` }}>
                                      <Tune fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{c.category}</Typography>
                                      <Typography variant="caption" color="text.secondary">{c.allowed ? "Allowed" : "Blocked"}</Typography>
                                    </Box>
                                  </Stack>

                                  <Switch checked={c.allowed} onChange={(e) => toggleCategoryAllowed(c.category, e.target.checked)} />
                                </Stack>

                                <Divider sx={{ my: 1.2 }} />

                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Typography variant="body2">Time rule</Typography>
                                  <Switch checked={c.timeRuleEnabled} onChange={(e) => setCategoryTime(c.category, { timeRuleEnabled: e.target.checked })} />
                                </Stack>

                                <Grid container spacing={1.2} sx={{ mt: 0.8 }}>
                                  <Grid item xs={6}>
                                    <TextField
                                      label="Start"
                                      type="time"
                                      value={c.start}
                                      onChange={(e) => setCategoryTime(c.category, { start: e.target.value })}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!c.timeRuleEnabled}
                                      fullWidth
                                    />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField
                                      label="End"
                                      type="time"
                                      value={c.end}
                                      onChange={(e) => setCategoryTime(c.category, { end: e.target.value })}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!c.timeRuleEnabled}
                                      fullWidth
                                    />
                                  </Grid>
                                </Grid>

                                {!validTimeWindow(c.start, c.end) && c.timeRuleEnabled ? (
                                  <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.2 }}>
                                    Start must be before end.
                                  </Alert>
                                ) : null}
                              </CardContent>
                            </Card>
                          ))}

                          {categoryTimeErrors.length ? (
                            <Alert severity="warning" icon={<WarningAmber />}>Fix category time rule errors before saving.</Alert>
                          ) : (
                            <Alert severity="info" icon={<Info />}>Per-category time rules restrict when certain categories can be spent.</Alert>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={saveAll} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>
                    Save controls
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<Info />} onClick={() => alert("Open audit logs") } sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>
                    View audit
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Product restriction editor */}
      <Drawer anchor="right" open={productDrawerOpen} onClose={() => setProductDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 620 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Product restrictions</Typography>
              <Typography variant="body2" color="text.secondary">Block specific items for a catalog-enabled vendor.</Typography>
            </Stack>
            <IconButton onClick={() => setProductDrawerOpen(false)}><Close /></IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {selectedVendor ? (
            <Stack spacing={1.6}>
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{selectedVendor.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedVendor.registry} • {selectedVendor.category}</Typography>
                  <Divider sx={{ my: 1.2 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={`Status: ${selectedVendor.status}`} sx={{ fontWeight: 900 }} />
                    <Chip size="small" label={`Blocked items: ${(selectedVendor.blockedProducts ?? []).length}`} sx={{ fontWeight: 900 }} />
                  </Stack>
                </CardContent>
              </Card>

              <TextField
                fullWidth
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />

              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Catalog</Typography>
                  <Typography variant="caption" color="text.secondary">Toggle items to block or allow.</Typography>
                  <Divider sx={{ my: 1.2 }} />

                  {displayedCatalog.length === 0 ? (
                    <Alert severity="info" icon={<Info />}>No items match.</Alert>
                  ) : (
                    <Stack spacing={1}>
                      {displayedCatalog.map((p) => {
                        const blocked = (selectedVendor.blockedProducts ?? []).includes(p);
                        return (
                          <Card key={p} variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.2} alignItems="center">
                                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(blocked ? EVZ.orange : EVZ.green, 0.12), color: blocked ? EVZ.orange : EVZ.green, border: `1px solid ${alpha(blocked ? EVZ.orange : EVZ.green, 0.22)}` }}>
                                    <ShoppingBag fontSize="small" />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{p}</Typography>
                                    <Typography variant="caption" color="text.secondary">{blocked ? "Blocked" : "Allowed"}</Typography>
                                  </Box>
                                </Stack>
                                <Button
                                  variant={blocked ? "contained" : "outlined"}
                                  onClick={() => toggleBlockedProduct(p)}
                                  sx={blocked ? { bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } } : { borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                >
                                  {blocked ? "Unblock" : "Block"}
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Add blocked item</Typography>
                  <Typography variant="caption" color="text.secondary">Use this when the vendor adds new products.</Typography>
                  <Divider sx={{ my: 1.2 }} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <TextField value={newBlockedItem} onChange={(e) => setNewBlockedItem(e.target.value)} placeholder="e.g., Energy drink" fullWidth />
                    <Button variant="contained" startIcon={<Add />} onClick={addBlockedProduct} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                      Add
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info" icon={<Info />}>Product restrictions apply only if the vendor supports item catalogs.</Alert>
            </Stack>
          ) : (
            <Alert severity="info" icon={<Info />}>Select a vendor.</Alert>
          )}
        </Box>
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function VendorCard({
  mode,
  vendor,
  campusOnly,
  onAllow,
  onBlock,
  onNeutral,
  onProducts,
}: {
  mode: "light" | "dark";
  vendor: Vendor;
  campusOnly: boolean;
  onAllow: () => void;
  onBlock: () => void;
  onNeutral: () => void;
  onProducts: () => void;
}) {
  const tone = vendor.status === "Allowed" ? EVZ.green : vendor.status === "Blocked" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  const offCampus = vendor.registry === "Off-campus";

  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.22) }}>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha(tone, 0.12), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}>
              <Store fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>{vendor.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {vendor.category} • {vendor.registry}
                {offCampus ? " • Off-campus" : ""}
                {vendor.supportsCatalog ? " • Catalog" : ""}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.6 }}>
                <Chip size="small" label={`Status: ${vendor.status}`} sx={{ fontWeight: 900, bgcolor: alpha(tone, 0.10), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }} />
                {offCampus ? (
                  <Chip size="small" label="Off-campus" sx={{ fontWeight: 900, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.22)}` }} />
                ) : (
                  <Chip size="small" label="School registry" sx={{ fontWeight: 900, bgcolor: alpha(EVZ.green, 0.10), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }} />
                )}
                {campusOnly && offCampus ? (
                  <Chip size="small" icon={<Lock fontSize="small" />} label="Campus-only risk" sx={{ fontWeight: 900, bgcolor: alpha(EVZ.orange, 0.10), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.22)}` }} />
                ) : null}
              </Stack>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <Button variant="outlined" onClick={onAllow} sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }} fullWidth>Allow</Button>
            <Button variant="outlined" onClick={onBlock} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }} fullWidth>Block</Button>
            <Button variant="outlined" onClick={onNeutral} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }} fullWidth>Neutral</Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.2 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Tune />}
            onClick={() => alert("Open vendor details / evidence")}
            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
          >
            Details
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShoppingBag />}
            onClick={onProducts}
            disabled={!vendor.supportsCatalog}
            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
          >
            Product restrictions
          </Button>
        </Stack>

        {offCampus ? (
          <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
            This vendor is not in the school registry and may be treated as off-campus.
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
