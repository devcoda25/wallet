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
  Checkbox,
  Chip,
  Container,
  CssBaseline,
  Divider,
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  Add,
  CheckCircle,
  Close,
  Download,
  FilterAlt,
  PauseCircle,
  PlayCircle,
  QrCode2,
  Search,
  Settings,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - My Children Dashboard (Premium)
 * Route: /parent/edupocket/children
 * Includes:
 * - Search + filters toolbar (status, school, class)
 * - Pending consent section pinned at top
 * - Children grid with premium cards + actions
 * - Optional bulk actions bar (admin guardian only)
 * - Loading skeletons, empty state, export
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
  todaySpend: number;
  weekSpend: number;
  guardians: number;
  schoolVerified?: boolean;
};

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
  children,
}: {
  mode: "light" | "dark";
  onToggleMode: () => void;
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
                  CorporatePay • EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  My Children
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Settings fontSize="small" />
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

function PageHeader({
  title,
  subtitle,
  primary,
  secondary,
}: {
  title: string;
  subtitle: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
      <Box>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {secondary}
        {primary}
      </Stack>
    </Stack>
  );
}

const MOCK_CHILDREN: Child[] = [
  {
    id: "c_1",
    name: "Amina N.",
    school: "Greenhill Academy",
    className: "P6",
    stream: "Blue",
    status: "Active",
    currency: "UGX",
    balance: 68000,
    todaySpend: 9000,
    weekSpend: 24000,
    guardians: 2,
    schoolVerified: true,
  },
  {
    id: "c_2",
    name: "Daniel K.",
    school: "Greenhill Academy",
    className: "S2",
    stream: "West",
    status: "Active",
    currency: "UGX",
    balance: 41000,
    todaySpend: 12000,
    weekSpend: 38000,
    guardians: 1,
  },
  {
    id: "c_3",
    name: "Maya R.",
    school: "Starlight School",
    className: "P3",
    status: "Needs consent",
    currency: "USD",
    balance: 22,
    todaySpend: 0,
    weekSpend: 10,
    guardians: 1,
  },
  {
    id: "c_4",
    name: "Isaac B.",
    school: "Starlight School",
    className: "S1",
    stream: "North",
    status: "Paused",
    currency: "UGX",
    balance: 18000,
    todaySpend: 0,
    weekSpend: 6000,
    guardians: 2,
  },
];

export default function EduPocketMyChildrenDashboard() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [loading, setLoading] = useState(true);
  const [adminGuardian, setAdminGuardian] = useState(true);

  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ChildStatus | "All">("All");
  const [school, setSchool] = useState<string>("");
  const [className, setClassName] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({
    open: false,
    msg: "",
    sev: "info",
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  const schools = useMemo(() => Array.from(new Set(children.map((c) => c.school))).sort(), [children]);
  const classes = useMemo(() => Array.from(new Set(children.map((c) => c.className))).sort(), [children]);

  const consentKids = useMemo(() => children.filter((c) => c.status === "Needs consent"), [children]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return children
      .filter((c) => (status === "All" ? true : c.status === status))
      .filter((c) => (school ? c.school === school : true))
      .filter((c) => (className ? c.className === className : true))
      .filter((c) => {
        if (!query) return true;
        return `${c.name} ${c.school} ${c.className} ${c.stream ?? ""}`.toLowerCase().includes(query);
      });
  }, [children, q, status, school, className]);

  const selectedCount = selectedIds.size;

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkSetStatus = (to: ChildStatus) => {
    if (!adminGuardian) return toast("Admin guardian required for bulk actions", "warning");
    if (selectedIds.size === 0) return;

    setChildren((prev) => prev.map((c) => (selectedIds.has(c.id) ? { ...c, status: to } : c)));
    toast(`Updated ${selectedIds.size} child profile(s)`, "success");
    clearSelection();
  };

  const exportChildren = (subset?: Child[]) => {
    const list = subset ?? filtered;
    const rows: string[] = [];
    rows.push(["id", "name", "school", "class", "stream", "status", "balance", "today", "week", "guardians", "verified"].join(","));
    for (const c of list) {
      rows.push(
        [
          c.id,
          c.name,
          c.school,
          c.className,
          c.stream ?? "",
          c.status,
          fmtMoney(c.balance, c.currency),
          fmtMoney(c.todaySpend, c.currency),
          fmtMoney(c.weekSpend, c.currency),
          String(c.guardians),
          c.schoolVerified ? "yes" : "no",
        ]
          .map(csvSafe)
          .join(",")
      );
    }
    downloadText(`edupocket_children_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  const openAddChild = () => toast("Navigate: /parent/edupocket/children/add", "info");

  const selectedChildren = useMemo(() => children.filter((c) => selectedIds.has(c.id)), [children, selectedIds]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}>
        <Container maxWidth="xl" disableGutters>
          <Stack spacing={2.2}>
            <Card>
              <CardContent>
                <PageHeader
                  title="My Children"
                  subtitle="Manage profiles, QR, approvals, funding, controls and activity."
                  primary={
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={openAddChild}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Add child
                    </Button>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Card
                        variant="outlined"
                        sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <VerifiedUser fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 900 }}>
                            Admin guardian
                          </Typography>
                          <Switch size="small" checked={adminGuardian} onChange={(e) => setAdminGuardian(e.target.checked)} />
                        </Stack>
                      </Card>

                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => exportChildren()}
                        sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                      >
                        Export
                      </Button>
                    </Stack>
                  }
                />

                <Divider sx={{ my: 2 }} />

                {/* Pending consent pinned section */}
                {loading ? (
                  <Skeleton variant="rounded" height={68} />
                ) : consentKids.length > 0 ? (
                  <Card
                    variant="outlined"
                    sx={{
                      bgcolor: alpha(EVZ.orange, 0.06),
                      borderColor: alpha(EVZ.orange, 0.28),
                      mb: 2,
                    }}
                  >
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
                              bgcolor: alpha(EVZ.orange, 0.12),
                              color: EVZ.orange,
                              border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                            }}
                          >
                            <WarningAmber fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Consent required
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {consentKids.length} child profile(s) need guardian consent before activation.
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            onClick={() => toast("Open consent queue", "info")}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                          >
                            Review
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => toast("Resent consent invites", "success")}
                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                          >
                            Resend invites
                          </Button>
                        </Stack>
                      </Stack>

                      <Divider sx={{ my: 1.4 }} />

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {consentKids.map((c) => (
                          <Chip
                            key={c.id}
                            icon={<WarningAmber fontSize="small" />}
                            label={`${c.name} (${c.school})`}
                            sx={{
                              fontWeight: 900,
                              bgcolor: alpha(EVZ.orange, 0.12),
                              color: EVZ.orange,
                              border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                            }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Children toolbar */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                      <TextField
                        fullWidth
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name, school, class or stream"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ width: { xs: "100%", md: "auto" } }}>
                        <TextField
                          select
                          label="Status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="All">All</MenuItem>
                          {(["Active", "Paused", "Restricted", "Needs consent"] as const).map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="School" value={school} onChange={(e) => setSchool(e.target.value)} sx={{ minWidth: 180 }}>
                          <MenuItem value="">All</MenuItem>
                          {schools.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          label="Class"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          sx={{ minWidth: 140 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {classes.map((c) => (
                            <MenuItem key={c} value={c}>
                              {c}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Button
                          variant="outlined"
                          startIcon={<FilterAlt />}
                          onClick={() => toast("Advanced filters open", "info")}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          More
                        </Button>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.4 }} />

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Showing <b>{filtered.length}</b> child profile(s)
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          startIcon={<Close />}
                          onClick={() => {
                            setQ("");
                            setStatus("All");
                            setSchool("");
                            setClassName("");
                            toast("Filters cleared", "info");
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={() => exportChildren(filtered)}
                        >
                          Export filtered
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Bulk actions bar (optional) */}
                {adminGuardian && selectedCount > 0 ? (
                  <Card
                    variant="outlined"
                    sx={{ mt: 2, bgcolor: alpha(EVZ.green, 0.06), borderColor: alpha(EVZ.green, 0.22) }}
                  >
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
                              border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                            }}
                          >
                            <CheckCircle fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Bulk actions
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Selected: {selectedCount}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                            variant="outlined"
                            startIcon={<PauseCircle />}
                            onClick={() => bulkSetStatus("Paused")}
                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                          >
                            Pause
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<PlayCircle />}
                            onClick={() => bulkSetStatus("Active")}
                            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                          >
                            Unpause
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<WarningAmber />}
                            onClick={() => toast("Consent reminder sent", "success")}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                          >
                            Send reminder
                          </Button>
                          <Button variant="outlined" startIcon={<Download />} onClick={() => exportChildren(selectedChildren)}>
                            Export selected
                          </Button>
                          <Button variant="text" startIcon={<Close />} onClick={clearSelection}>
                            Clear
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Children grid */}
                <Box sx={{ mt: 2.2 }}>
                  {loading ? (
                    <Grid container spacing={1.6}>
                      {[0, 1, 2, 3].map((i) => (
                        <Grid key={i} item xs={12} md={6} lg={4}>
                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                            <CardContent>
                              <Stack direction="row" spacing={1.2}>
                                <Skeleton variant="circular" width={46} height={46} />
                                <Stack spacing={0.8} sx={{ flex: 1 }}>
                                  <Skeleton variant="rounded" height={18} width="70%" />
                                  <Skeleton variant="rounded" height={14} width="90%" />
                                  <Skeleton variant="rounded" height={16} width="60%" />
                                </Stack>
                              </Stack>
                              <Divider sx={{ my: 1.4 }} />
                              <Skeleton variant="rounded" height={10} />
                              <Skeleton variant="rounded" height={10} sx={{ mt: 1 }} />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : filtered.length === 0 ? (
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                        bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        No children found
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Try adjusting filters or add a new child profile.
                      </Typography>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.4 }}>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={openAddChild}
                          sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                        >
                          Add child
                        </Button>
                        <Button variant="outlined" startIcon={<Close />} onClick={() => {
                          setQ("");
                          setStatus("All");
                          setSchool("");
                          setClassName("");
                        }}>
                          Reset filters
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Grid container spacing={1.6}>
                      {filtered.map((c) => (
                        <Grid key={c.id} item xs={12} md={6} lg={4}>
                          <ChildCard
                            child={c}
                            mode={mode}
                            selectable={adminGuardian}
                            selected={selectedIds.has(c.id)}
                            onToggleSelect={() => toggleSelect(c.id)}
                            onAction={(action) => {
                              if (action === "QR") toast(`Open QR for ${c.name}`, "info");
                              if (action === "TopUp") toast(`Top up for ${c.name}`, "info");
                              if (action === "Controls") toast(`Open controls for ${c.name}`, "info");
                              if (action === "Activity") toast(`Open activity for ${c.name}`, "info");
                              if (action === "OpenHub") toast(`Open child hub for ${c.name}`, "info");
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </AppShell>

      <Snackbar open={snack.open} autoHideDuration={3400} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function ChildCard({
  child,
  mode,
  selectable,
  selected,
  onToggleSelect,
  onAction,
}: {
  child: Child;
  mode: "light" | "dark";
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onAction: (a: "QR" | "TopUp" | "Controls" | "Activity" | "OpenHub") => void;
}) {
  const statusTone =
    child.status === "Active" ? EVZ.green : child.status === "Paused" ? alpha(EVZ.ink, 0.75) : EVZ.orange;

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      variant="outlined"
      sx={{
        bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
        borderColor: selected ? alpha(EVZ.green, 0.32) : child.status === "Needs consent" ? alpha(EVZ.orange, 0.45) : alpha(EVZ.ink, 0.12),
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(700px 260px at 10% 0%, ${alpha(statusTone, 0.18)}, transparent 60%)`,
        }}
      />

      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          {selectable ? (
            <Tooltip title="Select">
              <Checkbox checked={selected} onChange={onToggleSelect} />
            </Tooltip>
          ) : null}

          <Avatar
            sx={{
              width: 46,
              height: 46,
              bgcolor: alpha(EVZ.green, 0.18),
              color: EVZ.green,
              border: `1px solid ${alpha(EVZ.green, 0.25)}`,
              fontWeight: 950,
            }}
          >
            {child.name.split(" ")[0][0]}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
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

              <Chip
                size="small"
                label={`Guardians: ${child.guardians}`}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                  border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                }}
              />

              {child.schoolVerified ? (
                <Chip
                  size="small"
                  icon={<VerifiedUser fontSize="small" />}
                  label="Verified"
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
          </Box>
        </Stack>

        <Divider sx={{ my: 1.4 }} />

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Balance
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
              {fmtMoney(child.balance, child.currency)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Stack alignItems="flex-end">
              <Typography variant="caption" color="text.secondary">
                Today / Week
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {fmtMoney(child.todaySpend, child.currency)} / {fmtMoney(child.weekSpend, child.currency)}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1.2 }}>
          <Typography variant="caption" color="text.secondary">
            Weekly utilisation
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.round((child.weekSpend / Math.max(1, child.weekSpend + 80000)) * 100))}
            sx={{
              mt: 0.6,
              height: 10,
              borderRadius: 99,
              bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.08),
              "& .MuiLinearProgress-bar": { bgcolor: EVZ.green },
            }}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
        <Button size="small" startIcon={<QrCode2 />} onClick={() => onAction("QR")}>
          QR
        </Button>
        <Button size="small" startIcon={<Download />} onClick={() => onAction("TopUp")}>
          TopUp
        </Button>
        <Button size="small" startIcon={<Settings />} onClick={() => onAction("Controls")}>
          Controls
        </Button>
        <Button size="small" startIcon={<Search />} onClick={() => onAction("Activity")}>
          Activity
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" endIcon={<CheckCircle />} onClick={() => onAction("OpenHub")}>
          Open
        </Button>
      </CardActions>
    </Card>
  );
}
