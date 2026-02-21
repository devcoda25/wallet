import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
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
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Close,
  Download,
  ErrorOutline,
  FilterAlt,
  Info,
  Notifications,
  PauseCircle,
  PlayCircle,
  ReportProblem,
  Search,
  Settings,
  Shield,
  Snooze,
  SupportAgent,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Notifications Center (Premium)
 * Route: /parent/edupocket/notifications
 * Includes:
 * - Quiet hours banner
 * - Per-child/per-category preferences
 * - Export incident logs
 * - Mark as incident + notes + pinned incidents
 * - Escalate to support (creates a support ticket with export attachment)
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Category = "Approvals" | "Transactions" | "Funding" | "Security" | "School" | "System";

type Severity = "info" | "warning" | "error";

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type Notif = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  body: string;
  at: number;
  childId?: string;
  status: "Unread" | "Read";
  meta?: Record<string, string>;
};

type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  days: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
};

type Prefs = {
  global: Record<Category, boolean>;
  perChild: Record<string, Record<Category, boolean>>;
};

type SupportTicket = {
  id: string;
  subject: string;
  summary: string;
  includeExport: boolean;
  createdAt: number;
};

const ALL_CATEGORIES: Category[] = ["Approvals", "Transactions", "Funding", "Security", "School", "System"];

function fmtDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function severityTone(sev: Severity) {
  if (sev === "error") return "#ff4d4f";
  if (sev === "warning") return EVZ.orange;
  return EVZ.green;
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

  // supports overnight
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end;
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
        sx={{
          bgcolor: "transparent",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.08)}`,
        }}
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
                  CorporatePay • EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Notifications Center
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
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
          pb: 6,
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
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

function makeId(prefix: string) {
  return `${prefix}_${Math.floor(Math.random() * 999999)}`;
}

function seedNotifications(): Notif[] {
  const now = Date.now();
  return [
    {
      id: "n_1",
      category: "Transactions",
      severity: "warning",
      title: "Declined: outside allowed hours",
      body: "A purchase attempt was blocked by schedule rules.",
      at: now - 42 * 60000,
      childId: "c_2",
      status: "Unread",
      meta: { reason: "Schedule block", vendor: "School Canteen" },
    },
    {
      id: "n_2",
      category: "Security",
      severity: "info",
      title: "New device sign-in",
      body: "A new device signed into your parent account.",
      at: now - 5 * 60 * 60000,
      status: "Unread",
      meta: { device: "Android • Kampala, UG" },
    },
    {
      id: "n_3",
      category: "Approvals",
      severity: "info",
      title: "Approval needed: Bookstore purchase",
      body: "Daniel K. is attempting a purchase at Campus Bookshop.",
      at: now - 18 * 60000,
      childId: "c_2",
      status: "Unread",
      meta: { amount: "18,000 UGX", vendor: "Campus Bookshop" },
    },
    {
      id: "n_4",
      category: "School",
      severity: "info",
      title: "Fee reminder: Term activity fee",
      body: "Payment due in 3 days. Tap to pay or set a reminder.",
      at: now - 7 * 60 * 60000,
      childId: "c_1",
      status: "Read",
      meta: { amount: "75,000 UGX", due: "In 3 days" },
    },
    {
      id: "n_5",
      category: "Funding",
      severity: "info",
      title: "Funds request: lunch allowance",
      body: "Maya R. requested additional funds.",
      at: now - 24 * 60000,
      childId: "c_3",
      status: "Unread",
      meta: { amount: "10 USD" },
    },
  ];
}

function defaultPrefs(children: Child[]): Prefs {
  const global: Prefs["global"] = {
    Approvals: true,
    Transactions: true,
    Funding: true,
    Security: true,
    School: true,
    System: true,
  };
  const perChild: Prefs["perChild"] = {};
  for (const c of children) perChild[c.id] = { ...global };
  return { global, perChild };
}

export default function EduPocketParentNotificationsPremium() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [notifs, setNotifs] = useState<Notif[]>(seedNotifications());
  const [selectedId, setSelectedId] = useState<string | null>(notifs[0]?.id ?? null);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyIncidents, setOnlyIncidents] = useState(false);

  const [prefs, setPrefs] = useState<Prefs>(() => defaultPrefs(CHILDREN));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [live, setLive] = useState(true);

  const [quiet, setQuiet] = useState<QuietHours>({
    enabled: true,
    start: "20:00",
    end: "06:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  });

  const [incidentIds, setIncidentIds] = useState<Set<string>>(new Set());
  const [incidentNotes, setIncidentNotes] = useState<Record<string, string>>({});

  const [supportOpen, setSupportOpen] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  const nowDate = useMemo(() => new Date(), []);
  const quietActiveNow = useMemo(() => inQuietHours(new Date(), quiet), [quiet]);

  const selected = useMemo(() => notifs.find((n) => n.id === selectedId) ?? null, [notifs, selectedId]);

  const counts = useMemo(() => {
    const by: Record<string, { total: number; unread: number }> = { All: { total: notifs.length, unread: 0 } };
    for (const c of ALL_CATEGORIES) by[c] = { total: 0, unread: 0 };

    for (const n of notifs) {
      by.All.unread += n.status === "Unread" ? 1 : 0;
      by[n.category].total += 1;
      by[n.category].unread += n.status === "Unread" ? 1 : 0;
    }

    return by;
  }, [notifs]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();

    return notifs
      .filter((n) => (cat === "All" ? true : n.category === cat))
      .filter((n) => (onlyUnread ? n.status === "Unread" : true))
      .filter((n) => (onlyIncidents ? incidentIds.has(n.id) : true))
      .filter((n) => {
        if (!query) return true;
        const child = n.childId ? CHILDREN.find((c) => c.id === n.childId)?.name ?? "" : "";
        return `${n.title} ${n.body} ${n.category} ${child}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const ai = incidentIds.has(a.id) ? 1 : 0;
        const bi = incidentIds.has(b.id) ? 1 : 0;
        if (ai !== bi) return bi - ai; // incidents first
        return b.at - a.at;
      });
  }, [notifs, cat, onlyUnread, onlyIncidents, q, incidentIds]);

  // Live simulation
  useEffect(() => {
    if (!live) return;

    const t = setInterval(() => {
      const now = new Date();
      const isQuiet = inQuietHours(now, quiet);

      const sample: Array<() => Notif> = [
        () => ({
          id: makeId("n"),
          category: "Transactions",
          severity: Math.random() < 0.2 ? "warning" : "info",
          title: Math.random() < 0.2 ? "Declined: daily limit reached" : "Purchase completed",
          body: Math.random() < 0.2 ? "A transaction was blocked due to spending rules." : "A student purchase was completed successfully.",
          at: Date.now(),
          childId: Math.random() < 0.8 ? (Math.random() < 0.5 ? "c_1" : "c_2") : undefined,
          status: "Unread",
          meta: { quiet: isQuiet ? "true" : "false" },
        }),
        () => ({
          id: makeId("n"),
          category: "Approvals",
          severity: "info",
          title: "Approval needed: new vendor",
          body: "A purchase needs your approval (new vendor not in allowlist).",
          at: Date.now(),
          childId: "c_2",
          status: "Unread",
          meta: { vendor: "New Snack Kiosk", amount: "7,000 UGX" },
        }),
        () => ({
          id: makeId("n"),
          category: "Security",
          severity: Math.random() < 0.15 ? "error" : "info",
          title: Math.random() < 0.15 ? "Suspicious sign-in attempt" : "Security check complete",
          body: Math.random() < 0.15 ? "We blocked a risky login attempt." : "All good. Your session is protected.",
          at: Date.now(),
          status: "Unread",
          meta: { ip: "102.89.xxx.xxx" },
        }),
      ];

      const n = sample[Math.floor(Math.random() * sample.length)]();

      // apply preferences
      const allowGlobal = prefs.global[n.category] ?? true;
      const allowChild = n.childId ? prefs.perChild[n.childId]?.[n.category] ?? true : true;
      if (!allowGlobal || !allowChild) return;

      setNotifs((prev) => [n, ...prev].slice(0, 250));

      // toast only if not in quiet hours
      if (!isQuiet) {
        setSnack({
          open: true,
          msg: `${n.category}: ${n.title}`,
          sev: n.severity === "error" ? "error" : n.severity === "warning" ? "warning" : "info",
        });
      }

      setSelectedId((cur) => cur ?? n.id);
    }, 6500);

    return () => clearInterval(t);
  }, [live, prefs, quiet]);

  const markAllRead = () => {
    setNotifs((p) => p.map((n) => ({ ...n, status: "Read" })));
    setSnack({ open: true, msg: "Marked all as read", sev: "success" });
  };

  const markSelectedRead = () => {
    if (!selected) return;
    setNotifs((p) => p.map((n) => (n.id === selected.id ? { ...n, status: "Read" } : n)));
  };

  const snoozeSelected = () => {
    if (!selected) return;
    setSnack({ open: true, msg: "Snoozed. You’ll be reminded later.", sev: "info" });
  };

  const toggleIncident = (id: string) => {
    setIncidentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSupport = () => {
    if (!selected) return;
    setSupportOpen(true);
    setTicket(null);
  };

  const createTicket = (subject: string, summary: string, includeExport: boolean) => {
    const t: SupportTicket = {
      id: `TCK-${Math.floor(100000 + Math.random() * 899999)}`,
      subject,
      summary,
      includeExport,
      createdAt: Date.now(),
    };
    setTicket(t);
    setSnack({ open: true, msg: `Support ticket created: ${t.id}`, sev: "success" });
  };

  const exportLogs = (opts: { from?: string; to?: string; category?: Category | "All"; childId?: string | ""; includeRead: boolean }) => {
    const rows: string[] = [];
    rows.push(["id", "category", "severity", "status", "time", "child", "title", "body", "incident", "incident_note"].join(","));

    const inRange = (ts: number) => {
      if (!opts.from && !opts.to) return true;
      const iso = new Date(ts).toISOString().slice(0, 10);
      if (opts.from && iso < opts.from) return false;
      if (opts.to && iso > opts.to) return false;
      return true;
    };

    for (const n of notifs) {
      if (!inRange(n.at)) continue;
      if (opts.category && opts.category !== "All" && n.category !== opts.category) continue;
      if (opts.childId && n.childId !== opts.childId) continue;
      if (!opts.includeRead && n.status === "Read") continue;

      const child = n.childId ? CHILDREN.find((c) => c.id === n.childId)?.name ?? "" : "";
      const inc = incidentIds.has(n.id) ? "yes" : "no";
      const note = incidentNotes[n.id] ?? "";

      rows.push([n.id, n.category, n.severity, n.status, new Date(n.at).toISOString(), child, n.title, n.body, inc, note].map(csvSafe).join(","));
    }

    downloadText(`edupocket_incident_logs_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    setSnack({ open: true, msg: "Export ready", sev: "success" });
  };

  const unreadTotal = counts.All.unread;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}>
        <Container maxWidth="xl" sx={{ pt: 0 }}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                <Box>
                  <Typography variant="h5">Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time alerts, approvals, security signals and school updates.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={live ? "Pause live" : "Resume live"}>
                    <IconButton
                      onClick={() => setLive((v) => !v)}
                      sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}
                    >
                      {live ? <PauseCircle fontSize="small" /> : <PlayCircle fontSize="small" />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Settings">
                    <IconButton
                      onClick={() => setSettingsOpen(true)}
                      sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}
                    >
                      <Settings fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => setExportOpen(true)}
                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                  >
                    Export
                  </Button>
                </Stack>
              </Stack>

              {quietActiveNow && quiet.enabled ? (
                <Alert severity="info" icon={<Snooze />} sx={{ mt: 2 }}>
                  Quiet hours active now. Alerts are recorded but popups are suppressed.
                </Alert>
              ) : null}

              <Divider sx={{ my: 2 }} />

              <Stack direction={{ xs: "column", lg: "row" }} spacing={2.2} alignItems="flex-start">
                {/* List column */}
                <Card sx={{ flex: 1, width: "100%" }}>
                  <CardContent>
                    <Stack spacing={1.4}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                        <TextField
                          fullWidth
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search notifications..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                            ),
                          }}
                          helperText={
                            unreadTotal > 0
                              ? `${unreadTotal} unread • Live ${live ? "on" : "paused"} • Quiet hours ${quiet.enabled ? "enabled" : "off"}`
                              : `All caught up • Live ${live ? "on" : "paused"}`
                          }
                        />

                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                          <Button
                            variant="outlined"
                            startIcon={<FilterAlt />}
                            onClick={() => setOnlyUnread((v) => !v)}
                            sx={{ borderColor: alpha(EVZ.ink, mode === "dark" ? 0.30 : 0.18), color: "text.primary" }}
                          >
                            {onlyUnread ? "Unread" : "All"}
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<ReportProblem />}
                            onClick={() => setOnlyIncidents((v) => !v)}
                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                          >
                            {onlyIncidents ? "Incidents" : "All"}
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={markAllRead}
                            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                          >
                            Mark read
                          </Button>
                        </Stack>
                      </Stack>

                      <Tabs
                        value={cat}
                        onChange={(_, v) => setCat(v)}
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                        sx={{
                          "& .MuiTab-root": { fontWeight: 950 },
                          "& .MuiTabs-indicator": { bgcolor: EVZ.green, height: 3, borderRadius: 99 },
                        }}
                      >
                        <Tab
                          value="All"
                          label={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <span>All</span>
                              <Badge color="secondary" badgeContent={counts.All.unread} />
                            </Stack>
                          }
                        />
                        {ALL_CATEGORIES.map((c) => (
                          <Tab
                            key={c}
                            value={c}
                            label={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <span>{c}</span>
                                {counts[c].unread > 0 ? <Badge color="secondary" badgeContent={counts[c].unread} /> : null}
                              </Stack>
                            }
                          />
                        ))}
                      </Tabs>

                      <Divider />

                      {filtered.length === 0 ? (
                        <Box
                          sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                            bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            No notifications match
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Try clearing filters or searching different keywords.
                          </Typography>
                        </Box>
                      ) : (
                        <List disablePadding>
                          {filtered.map((n) => (
                            <ListItemButton
                              key={n.id}
                              onClick={() => {
                                setSelectedId(n.id);
                                if (n.status === "Unread") markSelectedRead();
                              }}
                              selected={n.id === selectedId}
                              sx={{
                                borderRadius: 3,
                                mb: 1,
                                border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.10)}`,
                                bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.68),
                                overflow: "hidden",
                                "&.Mui-selected": {
                                  borderColor: alpha(EVZ.green, 0.28),
                                  bgcolor: alpha(EVZ.green, 0.08),
                                },
                              }}
                              component={motion.div}
                              whileHover={{ y: -2 }}
                            >
                              <ListItemAvatar>{notifAvatar(n)}</ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography sx={{ fontWeight: 950 }} noWrap>
                                      {n.title}
                                    </Typography>
                                    {n.status === "Unread" ? (
                                      <Chip
                                        size="small"
                                        label="New"
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha(EVZ.orange, 0.12),
                                          color: EVZ.orange,
                                          border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                                        }}
                                      />
                                    ) : null}
                                    {incidentIds.has(n.id) ? (
                                      <Chip
                                        size="small"
                                        icon={<ReportProblem fontSize="small" />}
                                        label="Incident"
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha("#ff4d4f", 0.12),
                                          color: "#ff4d4f",
                                          border: `1px solid ${alpha("#ff4d4f", 0.22)}`,
                                        }}
                                      />
                                    ) : null}
                                  </Stack>
                                }
                                secondary={
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {n.category} • {timeAgo(n.at)}
                                    </Typography>
                                    {n.childId ? (
                                      <Chip
                                        size="small"
                                        label={CHILDREN.find((c) => c.id === n.childId)?.name ?? "Student"}
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                                          border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                        }}
                                      />
                                    ) : null}
                                  </Stack>
                                }
                              />
                              <Chip
                                size="small"
                                label={n.severity}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha(severityTone(n.severity), 0.12),
                                  color: severityTone(n.severity),
                                  border: `1px solid ${alpha(severityTone(n.severity), 0.22)}`,
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Details + Quick controls */}
                <Stack spacing={2.2} sx={{ width: { xs: "100%", lg: 460 }, flexShrink: 0 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Selected</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                        Actionable context and next steps.
                      </Typography>
                      <Divider sx={{ my: 2 }} />

                      {selected ? (
                        <NotifDetails
                          notif={selected}
                          child={selected.childId ? CHILDREN.find((c) => c.id === selected.childId) : undefined}
                          mode={mode}
                          isIncident={incidentIds.has(selected.id)}
                          incidentNote={incidentNotes[selected.id] ?? ""}
                          onToggleIncident={() => toggleIncident(selected.id)}
                          onNoteChange={(val) => setIncidentNotes((p) => ({ ...p, [selected.id]: val }))}
                          onApprove={() => setSnack({ open: true, msg: "Approved", sev: "success" })}
                          onDecline={() => setSnack({ open: true, msg: "Declined", sev: "warning" })}
                          onSnooze={snoozeSelected}
                          onEscalate={openSupport}
                        />
                      ) : (
                        <Alert severity="info" icon={<Info />}>
                          Select a notification from the list.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6">Quick controls</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                        Fast actions for high-risk situations.
                      </Typography>
                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1.2}>
                        <QuickControl
                          icon={<WarningAmber fontSize="small" />}
                          title="Emergency lock"
                          desc="Pause all student spending instantly."
                          cta="Activate"
                          tone="warn"
                          onClick={() => setSnack({ open: true, msg: "Emergency lock activated", sev: "warning" })}
                        />
                        <QuickControl
                          icon={<CheckCircle fontSize="small" />}
                          title="Smart rules"
                          desc="Create allowlists and auto-approvals for trusted vendors."
                          cta="Open"
                          tone="good"
                          onClick={() => setSnack({ open: true, msg: "Rule builder opens", sev: "info" })}
                        />
                        <QuickControl
                          icon={<Snooze fontSize="small" />}
                          title="Quiet hours"
                          desc="Reduce interruptions, keep audit logs."
                          cta="Configure"
                          tone="neutral"
                          onClick={() => setSettingsOpen(true)}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Settings Drawer */}
      <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Notification preferences</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure alerts per child and per category.
              </Typography>
            </Stack>
            <IconButton onClick={() => setSettingsOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2.2}>
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Global categories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  If off, notifications in that category won’t appear.
                </Typography>
                <Divider sx={{ my: 1.4 }} />

                <Stack spacing={1}>
                  {ALL_CATEGORIES.map((c) => (
                    <FormControlLabel
                      key={c}
                      control={
                        <Switch
                          checked={prefs.global[c]}
                          onChange={(e) =>
                            setPrefs((p) => ({
                              ...p,
                              global: { ...p.global, [c]: e.target.checked },
                            }))
                          }
                        />
                      }
                      label={<Typography variant="body2">{c}</Typography>}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Per child controls
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fine tune notifications for each child.
                </Typography>

                <Divider sx={{ my: 1.4 }} />

                <Stack spacing={1.4}>
                  {CHILDREN.map((child) => (
                    <Card key={child.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: alpha(EVZ.green, 0.16),
                                color: EVZ.green,
                                border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                                fontWeight: 950,
                              }}
                            >
                              {child.name.split(" ")[0][0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                {child.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {child.school} • {child.className}
                              </Typography>
                            </Box>
                          </Stack>
                          <Button
                            size="small"
                            onClick={() => setPrefs((p) => ({ ...p, perChild: { ...p.perChild, [child.id]: { ...p.global } } }))}
                          >
                            Apply global
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.4 }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          {ALL_CATEGORIES.map((c) => (
                            <FormControlLabel
                              key={`${child.id}_${c}`}
                              control={
                                <Checkbox
                                  checked={prefs.perChild[child.id]?.[c] ?? true}
                                  onChange={(e) =>
                                    setPrefs((p) => ({
                                      ...p,
                                      perChild: {
                                        ...p.perChild,
                                        [child.id]: { ...p.perChild[child.id], [c]: e.target.checked },
                                      },
                                    }))
                                  }
                                />
                              }
                              label={<Typography variant="caption">{c}</Typography>}
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Quiet hours
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  During quiet hours, alerts are recorded but not pushed as popups.
                </Typography>

                <Divider sx={{ my: 1.4 }} />

                <FormControlLabel
                  control={<Switch checked={quiet.enabled} onChange={(e) => setQuiet((p) => ({ ...p, enabled: e.target.checked }))} />}
                  label={<Typography variant="body2">Enable quiet hours</Typography>}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 1.2 }}>
                  <TextField
                    label="Start"
                    type="time"
                    value={quiet.start}
                    onChange={(e) => setQuiet((p) => ({ ...p, start: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="End"
                    type="time"
                    value={quiet.end}
                    onChange={(e) => setQuiet((p) => ({ ...p, end: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>

                <Divider sx={{ my: 1.4 }} />

                <Typography variant="caption" color="text.secondary">
                  Days
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => {
                    const on = quiet.days.includes(d);
                    return (
                      <Chip
                        key={d}
                        label={d}
                        clickable
                        onClick={() =>
                          setQuiet((p) => ({
                            ...p,
                            days: on ? p.days.filter((x) => x !== d) : [...p.days, d],
                          }))
                        }
                        sx={{
                          fontWeight: 900,
                          bgcolor: on ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                          color: on ? EVZ.green : "text.primary",
                          border: `1px solid ${alpha(on ? EVZ.green : EVZ.ink, on ? 0.22 : mode === "dark" ? 0.25 : 0.10)}`,
                        }}
                      />
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => {
                  setSettingsOpen(false);
                  setSnack({ open: true, msg: "Preferences saved", sev: "success" });
                }}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
              >
                Save
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Close />}
                onClick={() => setPrefs(defaultPrefs(CHILDREN))}
                sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.2 }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} mode={mode} onExport={exportLogs} />

      {/* Support drawer */}
      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        mode={mode}
        selected={selected}
        child={selected?.childId ? CHILDREN.find((c) => c.id === selected.childId) : undefined}
        isIncident={selected ? incidentIds.has(selected.id) : false}
        incidentNote={selected ? incidentNotes[selected.id] ?? "" : ""}
        onCreateTicket={createTicket}
      />

      <Snackbar open={snack.open} autoHideDuration={4200} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function QuickControl({
  icon,
  title,
  desc,
  cta,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  tone: "good" | "warn" | "neutral";
  onClick: () => void;
}) {
  const color = tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(color as any, 0.25) }}>
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
                bgcolor: alpha(color as any, 0.12),
                color,
                border: `1px solid ${alpha(color as any, 0.22)}`,
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
          <Button onClick={onClick}>{cta}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function notifAvatar(n: Notif) {
  const tone = severityTone(n.severity);
  const icon =
    n.severity === "error" ? <ErrorOutline fontSize="small" /> : n.severity === "warning" ? <WarningAmber fontSize="small" /> : <Info fontSize="small" />;

  return (
    <Avatar sx={{ bgcolor: alpha(tone, 0.14), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}>
      {icon}
    </Avatar>
  );
}

function NotifDetails({
  notif,
  child,
  mode,
  isIncident,
  incidentNote,
  onToggleIncident,
  onNoteChange,
  onApprove,
  onDecline,
  onSnooze,
  onEscalate,
}: {
  notif: Notif;
  child?: Child;
  mode: "light" | "dark";
  isIncident: boolean;
  incidentNote: string;
  onToggleIncident: () => void;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onDecline: () => void;
  onSnooze: () => void;
  onEscalate: () => void;
}) {
  const tone = severityTone(notif.severity);
  const subtle = alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72);

  const showApprovalActions = notif.category === "Approvals" || notif.category === "Funding";

  return (
    <Stack spacing={1.6}>
      <Card variant="outlined" sx={{ bgcolor: subtle, borderColor: alpha(tone, 0.25) }}>
        <CardContent>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                {notif.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notif.category} • {fmtDate(notif.at)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={notif.severity}
                sx={{ fontWeight: 900, bgcolor: alpha(tone, 0.12), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}
              />
              <Tooltip title={isIncident ? "Unmark incident" : "Mark as incident"}>
                <IconButton onClick={onToggleIncident}>
                  <ReportProblem fontSize="small" color={isIncident ? "error" : "inherit"} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.4 }} />

          <Typography variant="body2">{notif.body}</Typography>

          {child ? (
            <Box sx={{ mt: 1.4 }}>
              <Chip
                size="small"
                label={`${child.name} • ${child.school} • ${child.className}${child.stream ? ` • ${child.stream}` : ""}`}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                  border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                }}
              />
            </Box>
          ) : null}

          {notif.meta ? (
            <Box sx={{ mt: 1.4 }}>
              <Typography variant="caption" color="text.secondary">
                Details
              </Typography>
              <Stack spacing={0.6} sx={{ mt: 0.6 }}>
                {Object.entries(notif.meta).map(([k, v]) => (
                  <Stack key={k} direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      {k}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                      {v}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : null}

          {isIncident ? (
            <Box sx={{ mt: 1.4 }}>
              <TextField
                label="Incident notes"
                value={incidentNote}
                onChange={(e) => onNoteChange(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Add context for support and audit..."
              />
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Snooze />}
          onClick={onSnooze}
          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.1 }}
        >
          Snooze
        </Button>

        {showApprovalActions ? (
          <>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={onApprove}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.1 }}
            >
              Approve
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Close />}
              onClick={onDecline}
              sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.1 }}
            >
              Decline
            </Button>
          </>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<Info />}
            onClick={() => alert("Open related page")}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.1 }}
          >
            Open
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SupportAgent />}
          onClick={onEscalate}
          sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green, py: 1.1 }}
        >
          Escalate to support
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ReportProblem />}
          onClick={onToggleIncident}
          sx={{ borderColor: alpha("#ff4d4f", 0.35), color: "#ff4d4f", py: 1.1 }}
        >
          {isIncident ? "Unmark incident" : "Mark as incident"}
        </Button>
      </Stack>

      <Alert severity="info" icon={<Info />}>
        Incident logs are exportable for support investigations.
      </Alert>
    </Stack>
  );
}

function SupportDrawer({
  open,
  onClose,
  mode,
  selected,
  child,
  isIncident,
  incidentNote,
  onCreateTicket,
}: {
  open: boolean;
  onClose: () => void;
  mode: "light" | "dark";
  selected: Notif | null;
  child?: Child;
  isIncident: boolean;
  incidentNote: string;
  onCreateTicket: (subject: string, summary: string, includeExport: boolean) => void;
}) {
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [includeExport, setIncludeExport] = useState(true);

  useEffect(() => {
    if (!open) return;
    const baseSubject = selected ? `EduPocket Incident: ${selected.title}` : "EduPocket Support";
    const baseSummary = selected
      ? `Notification: ${selected.title}\nCategory: ${selected.category}\nSeverity: ${selected.severity}\nTime: ${fmtDate(selected.at)}\nChild: ${child?.name ?? "—"}\n\nDetails: ${selected.body}\n\nIncident: ${isIncident ? "Yes" : "No"}\nIncident note: ${incidentNote || "—"}`
      : "";

    setSubject(baseSubject);
    setSummary(baseSummary);
    setIncludeExport(true);
  }, [open, selected, child, isIncident, incidentNote]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
      <Box sx={{ p: 2.2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.2}>
            <Typography variant="h6">Escalate to support</Typography>
            <Typography variant="body2" color="text.secondary">
              Create a ticket with context and optional export attachment.
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.6}>
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth />
          <TextField label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth multiline minRows={6} />

          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                    Attach incident export
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Includes logs for audit and investigation.
                  </Typography>
                </Box>
                <Switch checked={includeExport} onChange={(e) => setIncludeExport(e.target.checked)} />
              </Stack>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            startIcon={<SupportAgent />}
            onClick={() => onCreateTicket(subject, summary, includeExport)}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
            fullWidth
          >
            Create ticket
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

function ExportDialog({
  open,
  onClose,
  mode,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  mode: "light" | "dark";
  onExport: (opts: { from?: string; to?: string; category?: Category | "All"; childId?: string | ""; includeRead: boolean }) => void;
}) {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [childId, setChildId] = useState<string>("");
  const [includeRead, setIncludeRead] = useState(true);

  useEffect(() => {
    if (!open) return;
    setFrom("");
    setTo("");
    setCategory("All");
    setChildId("");
    setIncludeRead(true);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.2}>
            <Typography variant="h6">Export incident logs</Typography>
            <Typography variant="body2" color="text.secondary">
              Download/share logs for support and audits.
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.6} sx={{ mt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>

          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as any)} fullWidth>
            <MenuItem value="All">All categories</MenuItem>
            {ALL_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} fullWidth>
            <MenuItem value="">All children</MenuItem>
            {CHILDREN.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel control={<Switch checked={includeRead} onChange={(e) => setIncludeRead(e.target.checked)} />} label={<Typography variant="body2">Include read notifications</Typography>} />

          <Alert severity="info" icon={<Info />}>
            Exported logs include timestamps, categories, severity, child context, incident flags and notes.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => {
            onExport({ from: from || undefined, to: to || undefined, category, childId: childId || undefined, includeRead });
            onClose();
          }}
          sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function csvSafe(s: any) {
  const t = String(s ?? "");
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
