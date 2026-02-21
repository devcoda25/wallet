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
import { motion, AnimatePresence } from "framer-motion";
import {
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  CreditCard,
  Download,
  History,
  Info,
  LocalAtm,
  Notifications,
  Payments,
  QrCode2,
  Search,
  Settings,
  Shield,
  School,
  Store,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Landing (Premium)
 * Route: /parent/edupocket
 * Style: CorporatePay / Wallet-grade, parent-friendly
 * Notes:
 * - Single-file runnable page with AppShell + drawers.
 * - Replace mock data & pseudo-QR with your real services.
 */

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  ink: "#0B1A17",
} as const;

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
  guardians: number;
  schoolVerified?: boolean;
};

type Approval = {
  id: string;
  childId: string;
  kind: "Purchase" | "School payment" | "Fund request";
  title: string;
  vendor?: string;
  amount: number;
  currency: "UGX" | "USD";
  at: number;
  status: "Pending" | "Approved" | "Declined";
};

type AlertEvent = {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  body: string;
  at: number;
  childId?: string;
};

type SchoolPayment = {
  id: string;
  childId: string;
  title: string;
  dueAt: number;
  amount: number;
  currency: "UGX" | "USD";
  status: "Due" | "Part-paid" | "Paid";
};

type VendorSpend = {
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Uniforms" | "Other";
  amount: number;
  currency: "UGX" | "USD";
};

type Txn = {
  id: string;
  childId: string;
  vendor: string;
  category: VendorSpend["category"];
  amount: number;
  currency: "UGX" | "USD";
  status: "Approved" | "Declined";
  declineReason?: string;
  at: number;
};

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

function csvSafe(v: any) {
  const t = String(v ?? "");
  if (/[",\n]/.test(t)) return `"${t.replaceAll('"', '""')}"`;
  return t;
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

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: 3,
        mb: 0.7,
        border: `1px solid ${active ? alpha(EVZ.green, 0.28) : alpha(EVZ.ink, 0.10)}`,
        bgcolor: active ? alpha(EVZ.green, 0.10) : alpha("#FFFFFF", 0.0),
        "&:hover": { bgcolor: alpha(EVZ.green, active ? 0.12 : 0.06) },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: alpha(active ? EVZ.green : EVZ.ink, active ? 0.14 : 0.06),
            color: active ? EVZ.green : "text.primary",
            border: `1px solid ${alpha(active ? EVZ.green : EVZ.ink, active ? 0.22 : 0.10)}`,
          }}
        >
          {icon}
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 950 }} />
      {typeof badge === "number" && badge > 0 ? (
        <Chip
          size="small"
          label={badge > 99 ? "99+" : badge}
          sx={{
            fontWeight: 950,
            bgcolor: alpha(EVZ.orange, 0.12),
            color: EVZ.orange,
            border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
          }}
        />
      ) : null}
    </ListItemButton>
  );
}

function AppShell({
  active,
  mode,
  onToggleMode,
  children,
  pendingApprovals,
  alertCount,
}: {
  active: "Landing" | "Search" | "Notifications" | "Children";
  mode: "light" | "dark";
  onToggleMode: () => void;
  pendingApprovals: number;
  alertCount: number;
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
                <VerifiedUser fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  CorporatePay • EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Parent controls & school-safe spending
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
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
          gap: 2.2,
          px: { xs: 2, md: 3 },
          pt: 2.2,
          pb: 6,
          background:
            mode === "dark"
              ? "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.16), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.10), transparent 60%)"
              : "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.14), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.08), transparent 60%)",
        }}
      >
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                EduPocket
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Entry points
              </Typography>
              <Divider sx={{ my: 1.4 }} />
              <List disablePadding>
                <NavItem icon={<Payments fontSize="small" />} label="Landing" active={active === "Landing"} onClick={() => alert("Navigate: /parent/edupocket")} />
                <NavItem icon={<Search fontSize="small" />} label="Global Search" active={active === "Search"} onClick={() => alert("Navigate: /parent/edupocket/search")} />
                <NavItem
                  icon={<Notifications fontSize="small" />}
                  label="Notifications"
                  active={active === "Notifications"}
                  badge={alertCount}
                  onClick={() => alert("Navigate: /parent/edupocket/notifications")}
                />
                <NavItem icon={<VerifiedUser fontSize="small" />} label="My Children" active={active === "Children"} onClick={() => alert("Navigate: /parent/edupocket/children")} />
              </List>
              <Divider sx={{ my: 1.4 }} />
              <Alert icon={<Info />} severity="info" sx={{ mb: 0 }}>
                Approvals waiting: <b>{pendingApprovals}</b>
              </Alert>
            </CardContent>
          </Card>
        </Box>

        <Box>{children}</Box>
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

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  loading,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "good" | "warn" | "neutral";
  loading?: boolean;
  onClick?: () => void;
}) {
  const toneColor = tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : alpha(EVZ.ink, 0.7);

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden" }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(700px 260px at 15% 0%, ${alpha(toneColor, 0.22)}, transparent 60%)`,
        }}
      />
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.6} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? <Skeleton variant="rounded" height={36} width="70%" /> : <Typography variant="h5">{value}</Typography>}
            {loading ? <Skeleton variant="rounded" height={16} width="85%" /> : <Typography variant="caption" color="text.secondary">{hint}</Typography>}
          </Stack>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(toneColor, 0.12),
              color: toneColor,
              border: `1px solid ${alpha(toneColor, 0.22)}`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PseudoQRCode({ value, size = 220 }: { value: string; size?: number }) {
  // Visual placeholder. Replace with real QR lib in integration.
  const grid = 25;
  const cell = Math.floor(size / grid);
  const seed = hashToInt(value);

  const isFinder = (r: number, c: number) => {
    const inTL = r < 7 && c < 7;
    const inTR = r < 7 && c >= grid - 7;
    const inBL = r >= grid - 7 && c < 7;
    return inTL || inTR || inBL;
  };

  const cells: Array<{ r: number; c: number; on: boolean }> = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      let on = false;
      if (isFinder(r, c)) {
        const rr = r % 7;
        const cc = c % 7;
        on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
      } else {
        const n = (seed + r * 97 + c * 193) % 11;
        on = n === 0 || n === 2 || n === 7;
      }
      cells.push({ r, c, on });
    }
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 3,
        border: `1px solid ${alpha(EVZ.ink, 0.12)}`,
        background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,252,251,1) 100%)",
        display: "grid",
        placeItems: "center",
        p: 1.25,
      }}
    >
      <Box sx={{ width: size - 18, height: size - 18, display: "grid", gridTemplateColumns: `repeat(${grid}, ${cell}px)` }}>
        {cells.map((x, idx) => (
          <Box key={idx} sx={{ width: cell, height: cell, bgcolor: x.on ? EVZ.ink : "transparent" }} />
        ))}
      </Box>
    </Box>
  );
}

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
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
    guardians: 1,
  },
];

const MOCK_APPROVALS: Approval[] = [
  {
    id: "a_1",
    childId: "c_2",
    kind: "Purchase",
    title: "Bookstore purchase",
    vendor: "Campus Bookshop",
    amount: 18000,
    currency: "UGX",
    at: Date.now() - 18 * 60000,
    status: "Pending",
  },
  {
    id: "a_2",
    childId: "c_1",
    kind: "School payment",
    title: "Trip contribution",
    vendor: "Greenhill Academy",
    amount: 55000,
    currency: "UGX",
    at: Date.now() - 2 * 60 * 60000,
    status: "Pending",
  },
  {
    id: "a_3",
    childId: "c_3",
    kind: "Fund request",
    title: "Request: lunch allowance",
    vendor: "EduPocket",
    amount: 10,
    currency: "USD",
    at: Date.now() - 25 * 60000,
    status: "Pending",
  },
];

const MOCK_ALERTS: AlertEvent[] = [
  {
    id: "n_1",
    severity: "warning",
    title: "Declined: outside allowed hours",
    body: "A purchase attempt was blocked by schedule rules.",
    at: Date.now() - 42 * 60000,
    childId: "c_2",
  },
  {
    id: "n_2",
    severity: "info",
    title: "New device sign-in",
    body: "A new device signed into your parent account.",
    at: Date.now() - 5 * 60 * 60000,
  },
  {
    id: "n_3",
    severity: "info",
    title: "Receipt ready",
    body: "Download the receipt for the last fee payment.",
    at: Date.now() - 1 * 24 * 60 * 60000,
    childId: "c_1",
  },
];

const MOCK_SCHOOL_PAYMENTS: SchoolPayment[] = [
  {
    id: "sp_1",
    childId: "c_1",
    title: "Term 1 activity fee",
    dueAt: Date.now() + 3 * 24 * 60 * 60000,
    amount: 75000,
    currency: "UGX",
    status: "Due",
  },
  {
    id: "sp_2",
    childId: "c_2",
    title: "Sports kit",
    dueAt: Date.now() + 8 * 24 * 60 * 60000,
    amount: 45000,
    currency: "UGX",
    status: "Part-paid",
  },
];

const MOCK_VENDOR_SPEND: VendorSpend[] = [
  { vendor: "School Canteen", category: "Food", amount: 24000, currency: "UGX" },
  { vendor: "Campus Bookshop", category: "Books", amount: 18000, currency: "UGX" },
  { vendor: "School Transport", category: "Transport", amount: 12000, currency: "UGX" },
  { vendor: "Uniform Store", category: "Uniforms", amount: 9000, currency: "UGX" },
];

const MOCK_TXNS: Txn[] = [
  { id: "t1", childId: "c_2", vendor: "School Canteen", category: "Food", amount: 12000, currency: "UGX", status: "Declined", declineReason: "Daily limit reached", at: Date.now() - 2 * 60 * 60000 },
  { id: "t2", childId: "c_2", vendor: "School Canteen", category: "Food", amount: 8000, currency: "UGX", status: "Declined", declineReason: "Outside allowed hours", at: Date.now() - 44 * 60000 },
  { id: "t3", childId: "c_1", vendor: "Campus Bookshop", category: "Books", amount: 5000, currency: "UGX", status: "Approved", at: Date.now() - 5 * 60 * 60000 },
];

const MOCK_UPDATES = [
  {
    id: "u1",
    title: "Smart approval rules",
    body: "Create auto-approvals for trusted vendors and stricter controls for new merchants.",
  },
  {
    id: "u2",
    title: "Print-ready student QR",
    body: "Export a student QR to print or embed in school IDs (lost ID reissue supported).",
  },
  {
    id: "u3",
    title: "School payments shortcuts",
    body: "Pay fees, trips and school items directly from your preferred funding source.",
  },
];

export default function EduPocketParentLandingPremium() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [loading, setLoading] = useState(true);

  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS);
  const [schoolPayments] = useState<SchoolPayment[]>(MOCK_SCHOOL_PAYMENTS);
  const [vendorSpend] = useState<VendorSpend[]>(MOCK_VENDOR_SPEND);
  const [txns] = useState<Txn[]>(MOCK_TXNS);
  const [updates, setUpdates] = useState(MOCK_UPDATES);

  const [drawer, setDrawer] = useState<null | "add" | "topup" | "approve">(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrChildId, setQrChildId] = useState(children[0]?.id ?? "");

  const [topupChildId, setTopupChildId] = useState(children[0]?.id ?? "");
  const [topupAmount, setTopupAmount] = useState("20000");
  const [topupSource, setTopupSource] = useState("EVzone Pay Wallet");

  const [addMode, setAddMode] = useState<"Create" | "Link existing" | "Approve request" | "School invite">("Create");
  const [addCode, setAddCode] = useState("");

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(t);
  }, []);

  const pendingApprovals = useMemo(() => approvals.filter((a) => a.status === "Pending"), [approvals]);
  const pendingCount = pendingApprovals.length;

  const alertCount = useMemo(() => alerts.filter((a) => a.severity !== "info").length, [alerts]);

  const totals = useMemo(() => {
    const balancesByCurrency = children.reduce<Record<string, number>>((acc, c) => {
      acc[c.currency] = (acc[c.currency] ?? 0) + c.balance;
      return acc;
    }, {});
    const combined = Object.entries(balancesByCurrency)
      .map(([ccy, amt]) => fmtMoney(amt, ccy))
      .join(" • ");

    const needsConsent = children.filter((c) => c.status === "Needs consent").length;

    return { totalChildren: children.length, combined, needsConsent };
  }, [children]);

  const insightStrip = useMemo(() => {
    // Top vendor (by spend)
    const byVendor = vendorSpend.reduce<Record<string, number>>((acc, v) => {
      const key = `${v.vendor}__${v.currency}`;
      acc[key] = (acc[key] ?? 0) + v.amount;
      return acc;
    }, {});
    const topVendor = Object.entries(byVendor)
      .map(([k, amt]) => ({ vendor: k.split("__")[0], currency: k.split("__")[1], amt }))
      .sort((a, b) => b.amt - a.amt)[0];

    // Top decline reason
    const declines = txns.filter((t) => t.status === "Declined");
    const byReason = declines.reduce<Record<string, number>>((acc, t) => {
      const r = t.declineReason ?? "Declined";
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
    const topDecline = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0];

    // Oldest approval age
    const oldest = pendingApprovals.map((a) => a.at).sort((a, b) => a - b)[0];
    const oldestMin = oldest ? Math.max(1, Math.floor((Date.now() - oldest) / 60000)) : 0;

    return {
      topVendor: topVendor ? `${topVendor.vendor} (${fmtMoney(topVendor.amt, topVendor.currency)})` : "—",
      topDecline: topDecline ? `${topDecline[0]} (${topDecline[1]})` : "—",
      approvalsAging: pendingApprovals.length ? `${oldestMin} min oldest` : "No pending",
    };
  }, [pendingApprovals, txns, vendorSpend]);

  const topVendors = useMemo(() => {
    const byVendor = vendorSpend.reduce<Record<string, number>>((acc, v) => {
      const key = `${v.vendor}__${v.currency}`;
      acc[key] = (acc[key] ?? 0) + v.amount;
      return acc;
    }, {});
    const list = Object.entries(byVendor)
      .map(([k, amount]) => {
        const [vendor, currency] = k.split("__");
        return { vendor, currency, amount };
      })
      .sort((a, b) => b.amount - a.amount);
    const max = Math.max(1, ...list.map((x) => x.amount));
    return { list, max };
  }, [vendorSpend]);

  const selectedQrChild = useMemo(() => children.find((c) => c.id === qrChildId) ?? children[0], [children, qrChildId]);
  const selectedTopupChild = useMemo(() => children.find((c) => c.id === topupChildId) ?? children[0], [children, topupChildId]);

  const closeDrawer = () => setDrawer(null);

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const exportSnapshot = () => {
    const rows: string[] = [];
    rows.push(["child", "school", "class", "status", "balance"].join(","));
    for (const c of children) {
      rows.push([c.name, c.school, c.className, c.status, fmtMoney(c.balance, c.currency)].map(csvSafe).join(","));
    }
    rows.push("");
    rows.push(["approval_id", "child", "kind", "title", "amount", "status", "age"].join(","));
    for (const a of approvals) {
      const child = children.find((x) => x.id === a.childId)?.name ?? "";
      rows.push([a.id, child, a.kind, a.title, fmtMoney(a.amount, a.currency), a.status, timeAgo(a.at)].map(csvSafe).join(","));
    }

    downloadText(`edupocket_parent_snapshot_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("Snapshot exported", "success");
  };

  const approveItem = (id: string, decision: "Approved" | "Declined") => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: decision } : a)));
    toast(decision === "Approved" ? "Approved" : "Declined", decision === "Approved" ? "success" : "warning");
  };

  const doTopUp = () => {
    if (!selectedTopupChild) return;
    const amt = Math.max(0, parseInt(topupAmount || "0", 10) || 0);
    if (amt <= 0) return toast("Enter a valid amount", "warning");

    setChildren((prev) => prev.map((c) => (c.id === selectedTopupChild.id ? { ...c, balance: c.balance + amt } : c)));
    toast(`Top up sent to ${selectedTopupChild.name}`, "success");
    setDrawer(null);
  };

  const doAddChild = () => {
    if (addMode === "Create") {
      const id = `c_${Math.floor(Math.random() * 9999)}`;
      setChildren((p) => [
        {
          id,
          name: "New Child",
          school: "Select school",
          className: "—",
          status: "Needs consent",
          currency: "UGX",
          balance: 0,
          todaySpend: 0,
          guardians: 1,
        },
        ...p,
      ]);
      toast("Child created. Consent required to activate.", "info");
      setDrawer(null);
      return;
    }

    if (!addCode.trim()) return toast("Enter a code or scan a QR", "warning");

    toast(`${addMode} request submitted`, "success");
    setAddCode("");
    setDrawer(null);
  };

  const needsConsentBanner = totals.needsConsent > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        active="Landing"
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        pendingApprovals={pendingCount}
        alertCount={alertCount}
      >
        <Container maxWidth={false} disableGutters>
          <Stack spacing={2.2}>
            <Card>
              <CardContent>
                <PageHeader
                  title="EduPocket"
                  subtitle="Quick control center for children, approvals and school spending."
                  primary={
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setDrawer("add")}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Add child
                    </Button>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={exportSnapshot}
                        sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                      >
                        Export snapshot
                      </Button>
                      <Tooltip title="Open Global Search">
                        <IconButton
                          onClick={() => toast("Navigate: /parent/edupocket/search", "info")}
                          sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}
                        >
                          <Search fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open Notifications">
                        <IconButton
                          onClick={() => toast("Navigate: /parent/edupocket/notifications", "info")}
                          sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}
                        >
                          <Badge color="secondary" badgeContent={Math.min(99, alertCount)}>
                            <Notifications fontSize="small" />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />

                <Divider sx={{ my: 2 }} />

                {needsConsentBanner ? (
                  <Alert
                    severity="warning"
                    icon={<WarningAmber />}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => toast("Open consent queue", "info")}>
                          Review
                        </Button>
                        <Button size="small" onClick={() => toast("Resend consent invites", "info")}>
                          Resend
                        </Button>
                      </Stack>
                    }
                    sx={{ mb: 2 }}
                  >
                    {totals.needsConsent} child account(s) need guardian consent.
                  </Alert>
                ) : null}

                {/* KPI grid */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} md={3}>
                    <KpiCard
                      label="Total children"
                      value={String(totals.totalChildren)}
                      hint={`${totals.needsConsent} need consent`}
                      icon={<VerifiedUser fontSize="small" />}
                      tone={totals.needsConsent > 0 ? "warn" : "good"}
                      loading={loading}
                      onClick={() => toast("Open My Children", "info")}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <KpiCard
                      label="Combined balances"
                      value={totals.combined || "0"}
                      hint="Grouped by currency"
                      icon={<CreditCard fontSize="small" />}
                      tone="good"
                      loading={loading}
                      onClick={() => setDrawer("topup")}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <KpiCard
                      label="Pending approvals"
                      value={String(pendingCount)}
                      hint="Purchases, fees, fund requests"
                      icon={<CheckCircle fontSize="small" />}
                      tone={pendingCount > 0 ? "warn" : "neutral"}
                      loading={loading}
                      onClick={() => setDrawer("approve")}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <KpiCard
                      label="Recent alerts"
                      value={String(alerts.length)}
                      hint={`${alertCount} require attention`}
                      icon={<WarningAmber fontSize="small" />}
                      tone={alertCount > 0 ? "warn" : "neutral"}
                      loading={loading}
                      onClick={() => toast("Open Notifications", "info")}
                    />
                  </Grid>
                </Grid>

                {/* Insight strip */}
                <Card
                  variant="outlined"
                  sx={{ mt: 2.2, bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                >
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
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
                          <Info fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                            Insights
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Fast signals to reduce mistakes and keep spending on track.
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          label={`Top vendor: ${insightStrip.topVendor}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.green, 0.10), border: `1px solid ${alpha(EVZ.green, 0.22)}` }}
                        />
                        <Chip
                          size="small"
                          label={`Top decline: ${insightStrip.topDecline}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.orange, 0.10), border: `1px solid ${alpha(EVZ.orange, 0.22)}` }}
                        />
                        <Chip
                          size="small"
                          label={`Approvals aging: ${insightStrip.approvalsAging}`}
                          sx={{ fontWeight: 900, bgcolor: alpha(EVZ.ink, 0.06), border: `1px solid ${alpha(EVZ.ink, 0.12)}` }}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Quick actions */}
                <Card sx={{ mt: 2.2 }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Quick actions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fast daily actions that still respect controls.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => toast("Open School Payments", "info")}
                          startIcon={<School />}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          School
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => toast("Open Vendor Summary", "info")}
                          startIcon={<Store />}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Vendors
                        </Button>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1.4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setDrawer("add")}
                          sx={{ bgcolor: EVZ.green, py: 1.2, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                        >
                          Add child
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Payments />}
                          onClick={() => setDrawer("topup")}
                          sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green, py: 1.2 }}
                        >
                          Top up
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          onClick={() => setDrawer("approve")}
                          sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.2 }}
                        >
                          Approve
                          {pendingCount > 0 ? (
                            <Chip
                              size="small"
                              label={pendingCount}
                              sx={{ ml: 1, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, fontWeight: 900 }}
                            />
                          ) : null}
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<QrCode2 />}
                          onClick={() => {
                            setQrChildId(children[0]?.id ?? "");
                            setQrOpen(true);
                          }}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}
                        >
                          View QR
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* 2-column content */}
                <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">My children</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tap a child for QR, funding, controls and activity.
                            </Typography>
                          </Box>
                          <Button endIcon={<ArrowForward />} onClick={() => toast("Navigate: /parent/edupocket/children", "info")}>
                            View all
                          </Button>
                        </Stack>
                        <Divider sx={{ my: 2 }} />

                        {loading ? (
                          <Grid container spacing={1.4}>
                            {[0, 1, 2, 3].map((i) => (
                              <Grid item xs={12} md={6} key={i}>
                                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                  <CardContent>
                                    <Stack direction="row" spacing={1.2}>
                                      <Skeleton variant="circular" width={46} height={46} />
                                      <Stack spacing={0.8} sx={{ flex: 1 }}>
                                        <Skeleton variant="rounded" width="60%" height={18} />
                                        <Skeleton variant="rounded" width="80%" height={14} />
                                        <Skeleton variant="rounded" width="50%" height={18} />
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        ) : children.length === 0 ? (
                          <Box
                            sx={{
                              p: 2.2,
                              borderRadius: 3,
                              border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                              bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              No children added
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Add your first child to start managing approvals, QR and limits.
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<Add />}
                              onClick={() => setDrawer("add")}
                              sx={{ mt: 1.2, bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                            >
                              Add child
                            </Button>
                          </Box>
                        ) : (
                          <Grid container spacing={1.4}>
                            {children.map((c) => (
                              <Grid item xs={12} md={6} key={c.id}>
                                <Card
                                  variant="outlined"
                                  component={motion.div}
                                  whileHover={{ y: -2 }}
                                  sx={{
                                    bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                                    borderColor:
                                      c.status === "Needs consent" ? alpha(EVZ.orange, 0.45) : alpha(EVZ.ink, 0.12),
                                  }}
                                >
                                  <CardContent>
                                    <Stack direction="row" spacing={1.4} alignItems="center">
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
                                        {c.name.split(" ")[0][0]}
                                      </Avatar>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                          <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
                                            {c.name}
                                          </Typography>
                                          <Chip
                                            size="small"
                                            label={c.status}
                                            sx={{
                                              fontWeight: 900,
                                              bgcolor:
                                                c.status === "Active"
                                                  ? alpha(EVZ.green, 0.12)
                                                  : c.status === "Paused"
                                                  ? alpha(EVZ.ink, 0.06)
                                                  : c.status === "Restricted"
                                                  ? alpha(EVZ.orange, 0.12)
                                                  : alpha(EVZ.orange, 0.12),
                                              color:
                                                c.status === "Active"
                                                  ? EVZ.green
                                                  : c.status === "Paused"
                                                  ? "text.primary"
                                                  : EVZ.orange,
                                              border: `1px solid ${alpha(
                                                c.status === "Active" ? EVZ.green : c.status === "Paused" ? EVZ.ink : EVZ.orange,
                                                0.22
                                              )}`,
                                            }}
                                          />
                                          {c.schoolVerified ? (
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
                                          {c.school} • {c.className}
                                          {c.stream ? ` • ${c.stream}` : ""}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Guardians: {c.guardians}
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
                                          {fmtMoney(c.balance, c.currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Stack alignItems="flex-end">
                                          <Typography variant="caption" color="text.secondary">
                                            Today
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                            {fmtMoney(c.todaySpend, c.currency)}
                                          </Typography>
                                        </Stack>
                                      </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 1.1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Daily utilisation
                                      </Typography>
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.min(100, Math.round((c.todaySpend / Math.max(1, c.todaySpend + 20000)) * 100))}
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
                                    <Button size="small" startIcon={<QrCode2 />} onClick={() => (setQrChildId(c.id), setQrOpen(true))}>
                                      QR
                                    </Button>
                                    <Button size="small" startIcon={<Payments />} onClick={() => (setTopupChildId(c.id), setDrawer("topup"))}>
                                      Top up
                                    </Button>
                                    <Box sx={{ flex: 1 }} />
                                    <Button size="small" endIcon={<ArrowForward />} onClick={() => toast("Open child hub", "info")}>
                                      Open
                                    </Button>
                                  </CardActions>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </CardContent>
                    </Card>

                    {/* Shortcuts */}
                    <Grid container spacing={2.2} sx={{ mt: 0.2 }}>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="h6">School payments</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Fees, trips and school items.
                                </Typography>
                              </Box>
                              <Button endIcon={<ArrowForward />} onClick={() => toast("Open School Payments", "info")}>
                                Open
                              </Button>
                            </Stack>
                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={1.2}>
                              {schoolPayments.map((p) => {
                                const child = children.find((c) => c.id === p.childId);
                                const dueInDays = Math.ceil((p.dueAt - Date.now()) / (24 * 60 * 60000));
                                return (
                                  <Card
                                    key={p.id}
                                    variant="outlined"
                                    sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}
                                  >
                                    <CardContent>
                                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                            {p.title}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" noWrap>
                                            {child?.name ?? "Student"} • Due in {Math.max(0, dueInDays)} day(s)
                                          </Typography>
                                        </Box>
                                        <Chip
                                          size="small"
                                          label={p.status}
                                          sx={{
                                            fontWeight: 900,
                                            bgcolor:
                                              p.status === "Paid"
                                                ? alpha(EVZ.green, 0.12)
                                                : p.status === "Part-paid"
                                                ? alpha(EVZ.orange, 0.12)
                                                : alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                            color:
                                              p.status === "Paid" ? EVZ.green : p.status === "Part-paid" ? EVZ.orange : "text.primary",
                                            border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                          }}
                                        />
                                      </Stack>

                                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                                          {fmtMoney(p.amount, p.currency)}
                                        </Typography>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          startIcon={<LocalAtm />}
                                          onClick={() => toast("Payment flow opens", "info")}
                                          sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                        >
                                          Pay
                                        </Button>
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="h6">Vendor spending</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Where money is going this week.
                                </Typography>
                              </Box>
                              <Button endIcon={<ArrowForward />} onClick={() => toast("Open Vendor Summary", "info")}>
                                Open
                              </Button>
                            </Stack>
                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={1.4}>
                              {topVendors.list.slice(0, 4).map((v) => (
                                <Box key={`${v.vendor}_${v.currency}`}>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }} noWrap>
                                      {v.vendor}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {fmtMoney(v.amount, v.currency)}
                                    </Typography>
                                  </Stack>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, Math.round((v.amount / topVendors.max) * 100))}
                                    sx={{
                                      mt: 0.8,
                                      height: 10,
                                      borderRadius: 99,
                                      bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.08),
                                      "& .MuiLinearProgress-bar": { bgcolor: EVZ.orange },
                                    }}
                                  />
                                </Box>
                              ))}

                              <Card
                                variant="outlined"
                                sx={{
                                  bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                                  borderColor: alpha(EVZ.green, 0.22),
                                }}
                              >
                                <CardContent>
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
                                      <History fontSize="small" />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        Spending insights
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Detect spikes, repeated declines and unusual vendor patterns.
                                      </Typography>
                                    </Box>
                                    <Button endIcon={<ArrowForward />} onClick={() => toast("Open insights", "info")}>
                                      View
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    {/* Approvals queue */}
                    <Card>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Approvals queue</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Approve quickly or create rules.
                            </Typography>
                          </Box>
                          <Button endIcon={<ArrowForward />} onClick={() => setDrawer("approve")}>
                            Manage
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {loading ? (
                          <Stack spacing={1.2}>
                            {[0, 1, 2].map((i) => (
                              <Card key={i} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                <CardContent>
                                  <Skeleton variant="rounded" height={18} width="70%" />
                                  <Skeleton variant="rounded" height={14} width="90%" sx={{ mt: 1 }} />
                                  <Skeleton variant="rounded" height={34} width="100%" sx={{ mt: 1.4 }} />
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        ) : pendingApprovals.length === 0 ? (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                              bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              No approvals waiting
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Auto-approvals can reduce friction for trusted vendors.
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={1.2}>
                            {pendingApprovals.slice(0, 4).map((a) => {
                              const child = children.find((c) => c.id === a.childId);
                              return (
                                <Card
                                  key={a.id}
                                  variant="outlined"
                                  sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}
                                >
                                  <CardContent>
                                    <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                        <Avatar
                                          sx={{
                                            width: 38,
                                            height: 38,
                                            bgcolor: alpha(EVZ.orange, 0.12),
                                            color: EVZ.orange,
                                            border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                                            fontWeight: 950,
                                          }}
                                        >
                                          {a.kind === "Purchase" ? "P" : a.kind === "School payment" ? "S" : "F"}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                            {a.title}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" noWrap>
                                            {child?.name ?? "Student"} • {a.vendor ?? ""} • {timeAgo(a.at)}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                      <Stack spacing={0.2} alignItems="flex-end">
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                          {fmtMoney(a.amount, a.currency)}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label="Pending"
                                          sx={{
                                            fontWeight: 900,
                                            bgcolor: alpha(EVZ.orange, 0.12),
                                            color: EVZ.orange,
                                            border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                                          }}
                                        />
                                      </Stack>
                                    </Stack>

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.2 }}>
                                      <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<CheckCircle />}
                                        onClick={() => approveItem(a.id, "Approved")}
                                        sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Close />}
                                        onClick={() => approveItem(a.id, "Declined")}
                                        sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                      >
                                        Decline
                                      </Button>
                                    </Stack>

                                    <Button
                                      size="small"
                                      startIcon={<Info />}
                                      onClick={() => toast("Open details + rule options", "info")}
                                      sx={{ mt: 1, color: "text.primary" }}
                                    >
                                      Details & rule options
                                    </Button>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {pendingApprovals.length > 4 ? (
                              <Button onClick={() => setDrawer("approve")} endIcon={<ArrowForward />}>
                                View {pendingApprovals.length - 4} more
                              </Button>
                            ) : null}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>

                    {/* What's new */}
                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">What’s new</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Updates and new capabilities.
                            </Typography>
                          </Box>
                          <Button endIcon={<ArrowForward />} onClick={() => toast("Open updates feed", "info")}>
                            Open
                          </Button>
                        </Stack>
                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1.2}>
                          <AnimatePresence initial={false}>
                            {updates.map((u) => (
                              <motion.div
                                key={u.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                              >
                                <Card
                                  variant="outlined"
                                  sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}
                                >
                                  <CardContent>
                                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
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
                                        <Info fontSize="small" />
                                      </Box>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                          {u.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {u.body}
                                        </Typography>
                                      </Box>
                                      <IconButton
                                        onClick={() => setUpdates((p) => p.filter((x) => x.id !== u.id))}
                                        aria-label="dismiss"
                                      >
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {updates.length === 0 ? (
                            <Alert severity="success" icon={<CheckCircle />}>
                              You’re up to date.
                            </Alert>
                          ) : null}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </AppShell>

      {/* QR Dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Student QR</Typography>
              <Typography variant="body2" color="text.secondary">
                Share, copy or print for school IDs.
              </Typography>
            </Stack>
            <IconButton onClick={() => setQrOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField select label="Child" value={qrChildId} onChange={(e) => setQrChildId(e.target.value)} fullWidth>
              {children.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} • {c.school}
                </MenuItem>
              ))}
            </TextField>

            {selectedQrChild ? (
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Stack direction="row" spacing={1.4} alignItems="center">
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
                      {selectedQrChild.name.split(" ")[0][0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
                        {selectedQrChild.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {selectedQrChild.school} • {selectedQrChild.className}
                        {selectedQrChild.stream ? ` • ${selectedQrChild.stream}` : ""}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={selectedQrChild.status}
                      sx={{
                        fontWeight: 900,
                        bgcolor:
                          selectedQrChild.status === "Active"
                            ? alpha(EVZ.green, 0.12)
                            : selectedQrChild.status === "Paused"
                            ? alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06)
                            : alpha(EVZ.orange, 0.12),
                        color:
                          selectedQrChild.status === "Active"
                            ? EVZ.green
                            : selectedQrChild.status === "Paused"
                            ? "text.primary"
                            : EVZ.orange,
                        border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <PseudoQRCode value={`edupocket:${qrChildId}:school:${selectedQrChild?.school ?? ""}`} />
            </Box>

            <Alert severity="info" icon={<Info />}>
              Vendor verification shows the student photo, school, class and stream before charging.
            </Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<QrCode2 />}
                onClick={() => toast("Opened full screen QR", "info")}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
              >
                Open full screen
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={() => toast("Print/export flow", "info")}
                sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
              >
                Print / Export
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Add Child Drawer */}
      <Drawer anchor="right" open={drawer === "add"} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Add child</Typography>
              <Typography variant="body2" color="text.secondary">
                Create, link, approve consent, or accept a school invite.
              </Typography>
            </Stack>
            <IconButton onClick={closeDrawer}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <TextField select label="Method" value={addMode} onChange={(e) => setAddMode(e.target.value as any)}>
              <MenuItem value="Create">Create child wallet</MenuItem>
              <MenuItem value="Link existing">Link existing child wallet</MenuItem>
              <MenuItem value="Approve request">Approve child sign-up request</MenuItem>
              <MenuItem value="School invite">Accept school invite</MenuItem>
            </TextField>

            <AnimatePresence mode="popLayout">
              {addMode === "Create" ? (
                <motion.div key="create" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Create a new child profile
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        You’ll set initial limits after creation. Consent is required to activate.
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <TextField
                    label="Invite code / QR code"
                    value={addCode}
                    onChange={(e) => setAddCode(e.target.value)}
                    placeholder="Paste code or scan a QR"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCode2 fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Use the code from your child’s app or the school invite."
                  />
                  <Alert severity="info" icon={<Info />} sx={{ mt: 1.4 }}>
                    Linking is logged (device + time) for audit and support.
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={doAddChild}
              sx={{ bgcolor: EVZ.green, py: 1.2, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
              fullWidth
            >
              Continue
            </Button>

            <Button
              variant="outlined"
              startIcon={<QrCode2 />}
              onClick={() => toast("Scan QR from camera", "info")}
              sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}
              fullWidth
            >
              Scan a QR instead
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Top Up Drawer */}
      <Drawer anchor="right" open={drawer === "topup"} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: "100%", sm: 540 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Top up a child</Typography>
              <Typography variant="body2" color="text.secondary">
                Add funds instantly. Spending still respects controls.
              </Typography>
            </Stack>
            <IconButton onClick={closeDrawer}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <TextField select label="Child" value={topupChildId} onChange={(e) => setTopupChildId(e.target.value)}>
              {children.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} • {c.school}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Amount"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value.replace(/[^0-9]/g, ""))}
              InputProps={{
                startAdornment: <InputAdornment position="start">{selectedTopupChild?.currency ?? "UGX"}</InputAdornment>,
              }}
              helperText="You can also set recurring allowance in Child Funding."
            />

            <TextField select label="Funding source" value={topupSource} onChange={(e) => setTopupSource(e.target.value)}>
              <MenuItem value="EVzone Pay Wallet">EVzone Pay Wallet</MenuItem>
              <MenuItem value="CorporatePay Wallet">CorporatePay Wallet</MenuItem>
              <MenuItem value="Bank / Card">Bank / Card</MenuItem>
              <MenuItem value="Mobile Money">Mobile Money</MenuItem>
            </TextField>

            <Alert severity="info" icon={<Info />}>
              Controls like limits and schedules still apply after top up.
            </Alert>

            <Button
              variant="contained"
              startIcon={<Payments />}
              onClick={doTopUp}
              sx={{ bgcolor: EVZ.green, py: 1.2, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
              fullWidth
            >
              Send top up
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Approvals Drawer */}
      <Drawer anchor="right" open={drawer === "approve"} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Approvals center</Typography>
              <Typography variant="body2" color="text.secondary">
                Approve quickly or create rules to reduce friction.
              </Typography>
            </Stack>
            <IconButton onClick={closeDrawer}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.2}>
            {pendingApprovals.length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                No pending approvals right now.
              </Alert>
            ) : null}

            {pendingApprovals.map((a) => {
              const child = children.find((c) => c.id === a.childId);
              return (
                <Card key={a.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: alpha(EVZ.orange, 0.12),
                            color: EVZ.orange,
                            border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                            fontWeight: 950,
                          }}
                        >
                          {a.kind === "Purchase" ? "P" : a.kind === "School payment" ? "S" : "F"}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                            {a.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {child?.name ?? "Student"} • {a.vendor ?? ""} • {timeAgo(a.at)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack spacing={0.2} alignItems="flex-end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          {fmtMoney(a.amount, a.currency)}
                        </Typography>
                        <Chip
                          size="small"
                          label={a.kind}
                          sx={{
                            fontWeight: 900,
                            bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                            border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => approveItem(a.id, "Approved")}
                        sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Close />}
                        onClick={() => approveItem(a.id, "Declined")}
                        sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                      >
                        Decline
                      </Button>
                    </Stack>

                    <Divider sx={{ my: 1.4 }} />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Shield />}
                        onClick={() => toast("Open rule builder", "info")}
                        sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                      >
                        Create rule
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Info />}
                        onClick={() => toast("Open approval details", "info")}
                        sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                      >
                        View details
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            <Divider sx={{ my: 1.2 }} />
            <Button startIcon={<Download />} onClick={exportSnapshot}>
              Export approvals + snapshot
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={3200} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
