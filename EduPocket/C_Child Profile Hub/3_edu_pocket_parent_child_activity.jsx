import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
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
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowForward,
  AttachFile,
  CheckCircle,
  Close,
  Download,
  ErrorOutline,
  Info,
  OfflineBolt,
  ReportProblem,
  Search,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Child Activity (Premium)
 * Route: /parent/edupocket/children/:childId/activity
 * Includes:
 * - TransactionsToolbar: date/vendor/category/status + export
 * - Responsive transactions table (desktop) and cards (mobile)
 * - TransactionDetailsDrawer: receipt/notes/decline reasons/location
 * - DisputeWizard: reason, evidence, timeline, submit
 * - InsightsTagStrip
 * - States: no transactions, offline data warning
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string; currency: "UGX" | "USD" };

type TxnStatus = "Approved" | "Declined" | "Pending";

type Category = "Food" | "Books" | "Transport" | "Fees" | "Other";

type Txn = {
  id: string;
  childId: string;
  vendor: string;
  category: Category;
  amount: number;
  currency: "UGX" | "USD";
  status: TxnStatus;
  at: number;
  ref: string;
  reason?: string;
  location?: string;
  notes?: string;
  receipt?: { lines: Array<{ label: string; value: string }>; total: string };
  dispute?: { status: "Open" | "Resolved"; createdAt: number; reason: string };
};

type DisputeDraft = {
  reason: string;
  details: string;
  attachments: File[];
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
                <VerifiedUser fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket • Activity
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
                <IconButton onClick={() => alert("Navigate: /parent/edupocket/children/:childId")} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
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

function TabsRow({ active }: { active: "Overview" | "QR" | "Activity" | "Approvals" | "Funding" | "Controls" }) {
  const items: Array<{ key: typeof active; label: string; route: string; icon: React.ReactNode }> = [
    { key: "Overview", label: "Overview", route: "/parent/edupocket/children/:childId", icon: <VerifiedUser fontSize="small" /> },
    { key: "QR", label: "QR / Student ID", route: "/parent/edupocket/children/:childId/qr", icon: <Info fontSize="small" /> },
    { key: "Activity", label: "Activity", route: "(this)", icon: <Search fontSize="small" /> },
    { key: "Approvals", label: "Approvals", route: "/parent/edupocket/children/:childId/approvals", icon: <CheckCircle fontSize="small" /> },
    { key: "Funding", label: "Funding", route: "/parent/edupocket/children/:childId/funding", icon: <Download fontSize="small" /> },
    { key: "Controls", label: "Controls", route: "/parent/edupocket/children/:childId/controls", icon: <Shield fontSize="small" /> },
  ];

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <Chip
            key={it.key}
            icon={it.icon}
            label={it.label}
            clickable
            onClick={() => alert(`Navigate: ${it.route}`)}
            sx={{
              fontWeight: 900,
              bgcolor: isActive ? alpha(EVZ.green, 0.12) : alpha(EVZ.ink, 0.06),
              color: isActive ? EVZ.green : "text.primary",
              border: `1px solid ${alpha(isActive ? EVZ.green : EVZ.ink, isActive ? 0.22 : 0.10)}`,
            }}
          />
        );
      })}
    </Stack>
  );
}

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
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

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
];

const SEED_TXNS: Txn[] = [
  {
    id: "t_1",
    childId: "c_1",
    vendor: "School Canteen",
    category: "Food",
    amount: 6000,
    currency: "UGX",
    status: "Approved",
    at: Date.now() - 45 * 60000,
    ref: "TXN-91302",
    location: "Greenhill Campus",
    receipt: {
      lines: [
        { label: "Item", value: "Lunch" },
        { label: "Qty", value: "1" },
        { label: "Method", value: "EduPocket QR" },
      ],
      total: "6,000 UGX",
    },
  },
  {
    id: "t_2",
    childId: "c_1",
    vendor: "Campus Bookshop",
    category: "Books",
    amount: 18000,
    currency: "UGX",
    status: "Declined",
    at: Date.now() - 18 * 60000,
    ref: "TXN-91303",
    reason: "Per-transaction limit",
    location: "Greenhill Campus",
    notes: "Attempted to buy a set of books",
  },
  {
    id: "t_3",
    childId: "c_1",
    vendor: "School Transport",
    category: "Transport",
    amount: 7000,
    currency: "UGX",
    status: "Approved",
    at: Date.now() - 1 * 24 * 60 * 60000,
    ref: "TXN-91304",
    location: "Pickup Gate",
  },
  {
    id: "t_4",
    childId: "c_2",
    vendor: "Uniform Store",
    category: "Other",
    amount: 15000,
    currency: "UGX",
    status: "Approved",
    at: Date.now() - 3 * 24 * 60 * 60000,
    ref: "TXN-91305",
  },
];

export default function EduPocketChildActivity() {
  const { theme, mode, setMode } = useCorporateTheme();
  const isDesktop = useMediaQuery("(min-width: 900px)");

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [txns, setTxns] = useState<Txn[]>(SEED_TXNS);

  // filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [vendor, setVendor] = useState<string>("");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<TxnStatus | "">("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeStep, setDisputeStep] = useState(0);
  const [disputeDraft, setDisputeDraft] = useState<DisputeDraft>({ reason: "", details: "", attachments: [] });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const childTxns = useMemo(() => txns.filter((t) => t.childId === childId), [txns, childId]);

  const vendors = useMemo(() => Array.from(new Set(childTxns.map((t) => t.vendor))).sort(), [childTxns]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return childTxns
      .filter((t) => {
        if (!query) return true;
        return `${t.vendor} ${t.category} ${t.status} ${t.ref} ${t.reason ?? ""}`.toLowerCase().includes(query);
      })
      .filter((t) => {
        if (!from && !to) return true;
        const iso = new Date(t.at).toISOString().slice(0, 10);
        if (from && iso < from) return false;
        if (to && iso > to) return false;
        return true;
      })
      .filter((t) => (vendor ? t.vendor === vendor : true))
      .filter((t) => (category ? t.category === category : true))
      .filter((t) => (status ? t.status === status : true))
      .sort((a, b) => b.at - a.at);
  }, [childTxns, q, from, to, vendor, category, status]);

  const selectedTxn = useMemo(() => filtered.find((t) => t.id === selectedTxnId) ?? childTxns.find((t) => t.id === selectedTxnId) ?? null, [filtered, childTxns, selectedTxnId]);

  const insights = useMemo(() => {
    // repeat spending
    const byVendor = childTxns.reduce<Record<string, number>>((acc, t) => {
      acc[t.vendor] = (acc[t.vendor] ?? 0) + 1;
      return acc;
    }, {});
    const repeat = Object.entries(byVendor).sort((a, b) => b[1] - a[1])[0];

    // new vendor (recent)
    const sorted = childTxns.slice().sort((a, b) => b.at - a.at);
    const mostRecentVendor = sorted[0]?.vendor;

    // limit hit pattern
    const declines = childTxns.filter((t) => t.status === "Declined");
    const byReason = declines.reduce<Record<string, number>>((acc, t) => {
      const r = t.reason ?? "Declined";
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
    const topReason = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0];

    return {
      repeatVendor: repeat ? `${repeat[0]} (${repeat[1]})` : "—",
      newVendor: mostRecentVendor ?? "—",
      limitHit: topReason ? `${topReason[0]} (${topReason[1]})` : "—",
    };
  }, [childTxns]);

  const openDetails = (id: string) => {
    setSelectedTxnId(id);
    setDetailsOpen(true);
  };

  const exportCsv = (list: Txn[]) => {
    const rows: string[] = [];
    rows.push(["id", "time", "vendor", "category", "amount", "currency", "status", "ref", "reason", "location"].join(","));
    for (const t of list) {
      rows.push([t.id, new Date(t.at).toISOString(), t.vendor, t.category, String(t.amount), t.currency, t.status, t.ref, t.reason ?? "", t.location ?? ""].map(csvSafe).join(","));
    }
    downloadText(`edupocket_child_${childId}_transactions_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Export ready", "success");
  };

  const exportPrint = (list: Txn[]) => {
    const w = window.open("", "_blank");
    if (!w) return;

    const rows = list
      .map((t) => `<tr><td>${new Date(t.at).toLocaleString()}</td><td>${t.vendor}</td><td>${t.category}</td><td>${t.amount}</td><td>${t.currency}</td><td>${t.status}</td><td>${t.ref}</td></tr>`)
      .join("\n");

    w.document.write(`
    <html>
      <head>
        <title>EduPocket Transactions</title>
        <style>
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
          h1 { font-size: 18px; margin: 0 0 8px; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
          th { background: #f9fafb; text-align: left; }
        </style>
      </head>
      <body>
        <h1>EduPocket Transactions</h1>
        <div class="meta">Child: ${child.name} • ${child.school} • ${child.className}</div>
        <table>
          <thead>
            <tr><th>Time</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Currency</th><th>Status</th><th>Ref</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <script>window.focus();</script>
      </body>
    </html>`);

    w.document.close();
    w.focus();
    w.print();
  };

  const openDispute = () => {
    if (!selectedTxn) return;
    setDisputeDraft({ reason: "", details: "", attachments: [] });
    setDisputeStep(0);
    setDisputeOpen(true);
  };

  const submitDispute = () => {
    if (!selectedTxn) return;
    if (!disputeDraft.reason.trim()) return toast("Select a reason", "warning");

    setTxns((prev) =>
      prev.map((t) =>
        t.id === selectedTxn.id
          ? {
              ...t,
              dispute: { status: "Open", createdAt: Date.now(), reason: disputeDraft.reason },
            }
          : t
      )
    );

    setDisputeOpen(false);
    toast("Dispute submitted", "success");
  };

  const offlineBanner = offline;

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
                    <Typography variant="h5">Activity</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transactions, receipts, disputes and audit signals.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} • {c.school}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Card
                      variant="outlined"
                      sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OfflineBolt fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                          Offline
                        </Typography>
                        <Switch size="small" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
                      </Stack>
                    </Card>

                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => exportCsv(filtered)}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => exportPrint(filtered)}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Print / Save PDF
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <TabsRow active="Activity" />

                <Divider />

                <AnimatePresence initial={false}>
                  {offlineBanner ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert severity="warning" icon={<OfflineBolt />} sx={{ mb: 1.2 }}>
                        Offline mode: data may be stale and exports may be incomplete.
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Insights */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
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
                            border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                          }}
                        >
                          <Info fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            Insights
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quick tags to guide decisions.
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          label={`Repeat spending: ${insights.repeatVendor}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.green, 0.10), border: `1px solid ${alpha(EVZ.green, 0.22)}` }}
                        />
                        <Chip
                          size="small"
                          label={`New vendor: ${insights.newVendor}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.ink, 0.06), border: `1px solid ${alpha(EVZ.ink, 0.12)}` }}
                        />
                        <Chip
                          size="small"
                          label={`Limit hits: ${insights.limitHit}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.orange, 0.10), border: `1px solid ${alpha(EVZ.orange, 0.22)}` }}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Toolbar */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack spacing={1.4}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                        <TextField
                          fullWidth
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search vendor, category, status, reference..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                            ),
                          }}
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ width: { xs: "100%", md: "auto" } }}>
                          <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                          <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Stack>
                      </Stack>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                        <TextField select label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} sx={{ minWidth: 220 }}>
                          <MenuItem value="">All vendors</MenuItem>
                          {vendors.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as any)} sx={{ minWidth: 180 }}>
                          <MenuItem value="">All categories</MenuItem>
                          {(["Food", "Books", "Transport", "Fees", "Other"] as const).map((c) => (
                            <MenuItem key={c} value={c}>
                              {c}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)} sx={{ minWidth: 160 }}>
                          <MenuItem value="">Any</MenuItem>
                          {(["Approved", "Declined", "Pending"] as const).map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Box sx={{ flex: 1 }} />

                        <Button
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={() => {
                            setQ("");
                            setFrom("");
                            setTo("");
                            setVendor("");
                            setCategory("");
                            setStatus("");
                            toast("Filters cleared", "info");
                          }}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Clear
                        </Button>
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        Showing <b>{filtered.length}</b> transaction(s)
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Table or cards */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">Transactions</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click any row/card to open details.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    {loading ? (
                      <Grid container spacing={1.2}>
                        {[0, 1, 2].map((i) => (
                          <Grid key={i} item xs={12}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                                  <Box sx={{ height: 14, bgcolor: alpha(EVZ.ink, 0.08), borderRadius: 2 }} />
                                  <Box sx={{ height: 14, bgcolor: alpha(EVZ.ink, 0.08), borderRadius: 2 }} />
                                  <Box sx={{ height: 14, bgcolor: alpha(EVZ.ink, 0.08), borderRadius: 2 }} />
                                </Box>
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
                          No transactions
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Try adjusting filters or check back later.
                        </Typography>
                      </Box>
                    ) : isDesktop ? (
                      <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 950 }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Vendor</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 950, textAlign: "right" }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Ref</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filtered.map((t) => (
                              <TableRow
                                key={t.id}
                                hover
                                onClick={() => openDetails(t.id)}
                                style={{ cursor: "pointer" }}
                              >
                                <TableCell>{new Date(t.at).toLocaleString()}</TableCell>
                                <TableCell>{t.vendor}</TableCell>
                                <TableCell>{t.category}</TableCell>
                                <TableCell sx={{ textAlign: "right", fontWeight: 950 }}>
                                  {fmtMoney(t.amount, t.currency)}
                                </TableCell>
                                <TableCell>
                                  <StatusChip status={t.status} reason={t.reason} />
                                </TableCell>
                                <TableCell>{t.ref}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    ) : (
                      <Stack spacing={1.2}>
                        {filtered.map((t) => (
                          <Card
                            key={t.id}
                            variant="outlined"
                            component={motion.div}
                            whileHover={{ y: -2 }}
                            onClick={() => openDetails(t.id)}
                            sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), cursor: "pointer" }}
                          >
                            <CardContent>
                              <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: alpha(t.status === "Approved" ? EVZ.green : t.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7), 0.14),
                                      color: t.status === "Approved" ? EVZ.green : t.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7),
                                      border: `1px solid ${alpha(t.status === "Approved" ? EVZ.green : t.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7), 0.22)}`,
                                      fontWeight: 950,
                                    }}
                                  >
                                    {t.category[0]}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                      {t.vendor}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {t.category} • {new Date(t.at).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Stack spacing={0.2} alignItems="flex-end">
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                    {fmtMoney(t.amount, t.currency)}
                                  </Typography>
                                  <StatusChip status={t.status} reason={t.reason} compact />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Details drawer */}
      <Drawer anchor="right" open={detailsOpen} onClose={() => setDetailsOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Transaction details</Typography>
              <Typography variant="body2" color="text.secondary">
                Receipt, notes, reasons and disputes.
              </Typography>
            </Stack>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {selectedTxn ? (
            <Stack spacing={1.6}>
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">{selectedTxn.vendor}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTxn.category} • {new Date(selectedTxn.at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack spacing={0.4} alignItems="flex-end">
                      <Typography variant="h6">{fmtMoney(selectedTxn.amount, selectedTxn.currency)}</Typography>
                      <StatusChip status={selectedTxn.status} reason={selectedTxn.reason} />
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.4 }} />

                  <MetaRow label="Reference" value={selectedTxn.ref} />
                  <MetaRow label="Location" value={selectedTxn.location ?? "—"} />
                  <MetaRow label="Reason" value={selectedTxn.reason ?? "—"} />
                </CardContent>
              </Card>

              {selectedTxn.receipt ? (
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Receipt
                    </Typography>
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      {selectedTxn.receipt.lines.map((l, idx) => (
                        <MetaRow key={idx} label={l.label} value={l.value} />
                      ))}
                      <Divider sx={{ my: 0.8 }} />
                      <MetaRow label="Total" value={selectedTxn.receipt.total} strong />
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {selectedTxn.notes ? (
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Notes
                    </Typography>
                    <Divider sx={{ my: 1.2 }} />
                    <Typography variant="body2">{selectedTxn.notes}</Typography>
                  </CardContent>
                </Card>
              ) : null}

              {selectedTxn.dispute ? (
                <Alert severity="info" icon={<ReportProblem />}>
                  Dispute: {selectedTxn.dispute.status} • {timeAgo(selectedTxn.dispute.createdAt)} • {selectedTxn.dispute.reason}
                </Alert>
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ReportProblem />}
                  onClick={openDispute}
                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                  disabled={Boolean(selectedTxn.dispute)}
                >
                  Dispute
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => exportCsv([selectedTxn])}
                  sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                >
                  Export
                </Button>
              </Stack>

              <Alert severity="info" icon={<Info />}>
                Disputes are tracked with a timeline and can include attachments.
              </Alert>
            </Stack>
          ) : (
            <Alert severity="info" icon={<Info />}>
              Select a transaction.
            </Alert>
          )}
        </Box>
      </Drawer>

      {/* Dispute Wizard */}
      <Drawer anchor="right" open={disputeOpen} onClose={() => setDisputeOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 600 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Dispute wizard</Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a dispute for investigation.
              </Typography>
            </Stack>
            <IconButton onClick={() => setDisputeOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stepper activeStep={disputeStep} alternativeLabel>
            {["Reason", "Evidence", "Review"].map((s) => (
              <Step key={s}>
                <StepLabel>{s}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Divider sx={{ my: 2 }} />

          <AnimatePresence mode="popLayout">
            {disputeStep === 0 ? (
              <motion.div key="s0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Stack spacing={1.4}>
                  <TextField
                    select
                    label="Reason"
                    value={disputeDraft.reason}
                    onChange={(e) => setDisputeDraft((p) => ({ ...p, reason: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Wrong amount">Wrong amount</MenuItem>
                    <MenuItem value="Duplicate charge">Duplicate charge</MenuItem>
                    <MenuItem value="Not my child">Not my child</MenuItem>
                    <MenuItem value="Vendor issue">Vendor issue</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>

                  <TextField
                    label="Details"
                    value={disputeDraft.details}
                    onChange={(e) => setDisputeDraft((p) => ({ ...p, details: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Add additional context for support and audit."
                  />

                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => setDisputeStep(1)}
                    disabled={!disputeDraft.reason}
                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                  >
                    Continue
                  </Button>
                </Stack>
              </motion.div>
            ) : null}

            {disputeStep === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Stack spacing={1.4}>
                  <Alert severity="info" icon={<Info />}>
                    Add optional evidence: screenshots, receipts, messages.
                  </Alert>

                  <Button
                    variant="outlined"
                    startIcon={<AttachFile />}
                    component="label"
                    sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                  >
                    Attach files
                    <input
                      hidden
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setDisputeDraft((p) => ({ ...p, attachments: [...p.attachments, ...files] }));
                      }}
                    />
                  </Button>

                  {disputeDraft.attachments.length ? (
                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Attachments
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />
                        <Stack spacing={0.6}>
                          {disputeDraft.attachments.map((f, idx) => (
                            <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                {f.name}
                              </Typography>
                              <Button size="small" onClick={() => setDisputeDraft((p) => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}>
                                Remove
                              </Button>
                            </Stack>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  ) : null}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button variant="outlined" onClick={() => setDisputeStep(0)} fullWidth>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={() => setDisputeStep(2)}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                      fullWidth
                    >
                      Review
                    </Button>
                  </Stack>
                </Stack>
              </motion.div>
            ) : null}

            {disputeStep === 2 ? (
              <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Stack spacing={1.4}>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Review
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <MetaRow label="Reason" value={disputeDraft.reason} />
                      <MetaRow label="Attachments" value={`${disputeDraft.attachments.length}`} />
                      <Divider sx={{ my: 1.2 }} />
                      <Typography variant="caption" color="text.secondary">
                        Details
                      </Typography>
                      <Typography variant="body2">{disputeDraft.details || "—"}</Typography>

                      <Divider sx={{ my: 1.2 }} />
                      <Alert severity="info" icon={<Info />}>
                        Timeline: Submitted → Under review → Resolution.
                      </Alert>
                    </CardContent>
                  </Card>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button variant="outlined" onClick={() => setDisputeStep(1)} fullWidth>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<ReportProblem />}
                      onClick={submitDispute}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                      fullWidth
                    >
                      Submit dispute
                    </Button>
                  </Stack>
                </Stack>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Box>
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={3400} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function StatusChip({ status, reason, compact }: { status: TxnStatus; reason?: string; compact?: boolean }) {
  const tone = status === "Approved" ? EVZ.green : status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  return (
    <Chip
      size="small"
      label={compact ? status : reason ? `${status} • ${reason}` : status}
      sx={{
        fontWeight: 900,
        bgcolor: alpha(tone, 0.12),
        color: tone,
        border: `1px solid ${alpha(tone, 0.22)}`,
      }}
    />
  );
}

function MetaRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: strong ? 950 : 900 }}>
        {value}
      </Typography>
    </Stack>
  );
}
