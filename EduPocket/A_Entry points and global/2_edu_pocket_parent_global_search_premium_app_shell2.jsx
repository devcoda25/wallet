import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Drawer,
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
  ArrowForward,
  CheckCircle,
  Close,
  Download,
  FilterAlt,
  History,
  Info,
  Link as LinkIcon,
  PinDrop,
  PushPin,
  Search,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Global Search (Premium)
 * Route: /parent/edupocket/search
 * Includes:
 * - Tabs, filters drawer, context-aware details drawer
 * - Saved views with pin-to-sidebar
 * - Export "exactly what I see" toggle
 * - Optional "Explain why it matched" debug chips
 * - Viewer-only permission mode (no exports / no approvals)
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Status = "Approved" | "Declined" | "Pending";

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type Txn = {
  id: string;
  childId: string;
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Fees" | "Other";
  amount: number;
  currency: "UGX" | "USD";
  status: Status;
  at: number;
  ref: string;
  reason?: string;
};

type Vendor = {
  id: string;
  name: string;
  type: "Canteen" | "Bookshop" | "Transport" | "School" | "Other";
  status: "Active" | "Suspended";
};

type PaymentRequest = {
  id: string;
  childId: string;
  title: string;
  amount: number;
  currency: "UGX" | "USD";
  status: Status;
  at: number;
  kind: "School payment" | "Fund request";
};

type Approval = {
  id: string;
  childId: string;
  title: string;
  vendor?: string;
  amount: number;
  currency: "UGX" | "USD";
  status: Status;
  at: number;
};

type ResultKind = "Children" | "Transactions" | "Vendors" | "Payment Requests" | "Approvals";

type SearchFilters = {
  from?: string;
  to?: string;
  childId?: string;
  category?: Txn["category"];
  vendor?: string;
  status?: Status;
};

type MatchReason = "Name" | "School" | "Vendor" | "Reference" | "Category" | "Status";

type SearchResult =
  | { kind: "Children"; key: string; child: Child; score: number; reasons: MatchReason[] }
  | { kind: "Transactions"; key: string; txn: Txn; child: Child; score: number; reasons: MatchReason[] }
  | { kind: "Vendors"; key: string; vendor: Vendor; score: number; reasons: MatchReason[] }
  | { kind: "Payment Requests"; key: string; req: PaymentRequest; child: Child; score: number; reasons: MatchReason[] }
  | { kind: "Approvals"; key: string; appr: Approval; child: Child; score: number; reasons: MatchReason[] };

type SavedView = {
  id: string;
  name: string;
  tab: ResultKind | "All";
  q: string;
  filters: SearchFilters;
  pinned?: boolean;
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

function norm(s: string) {
  return (s || "").toLowerCase().trim();
}

function scoreMatch(text: string, query: string) {
  const t = norm(text);
  const q = norm(query);
  if (!q) return 0.1;
  if (t === q) return 10;
  if (t.startsWith(q)) return 6;
  if (t.includes(q)) return 3;
  const parts = q.split(/\s+/).filter(Boolean);
  const hit = parts.every((p) => t.includes(p));
  return hit ? 2 : 0;
}

function inDateRange(ts: number, from?: string, to?: string) {
  if (!from && !to) return true;
  const iso = new Date(ts).toISOString().slice(0, 10);
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
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
        h6: { fontWeight: 900, letterSpacing: -0.28 },
        h5: { fontWeight: 950, letterSpacing: -0.5 },
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
        bgcolor: active ? alpha(EVZ.green, 0.10) : "transparent",
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
  mode,
  onToggleMode,
  pinnedViews,
  children,
}: {
  mode: "light" | "dark";
  onToggleMode: () => void;
  pinnedViews: Array<{ id: string; name: string; onClick: () => void }>;
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
                <Search fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  CorporatePay • EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Global Search
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
                Navigation
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Entry points
              </Typography>
              <Divider sx={{ my: 1.4 }} />
              <List disablePadding>
                <NavItem icon={<VerifiedUser fontSize="small" />} label="Landing" onClick={() => alert("Navigate: /parent/edupocket")} />
                <NavItem icon={<Search fontSize="small" />} label="Global Search" active onClick={() => {}} />
                <NavItem icon={<Info fontSize="small" />} label="Notifications" onClick={() => alert("Navigate: /parent/edupocket/notifications")} />
              </List>

              {pinnedViews.length ? (
                <>
                  <Divider sx={{ my: 1.4 }} />
                  <Typography variant="caption" color="text.secondary">
                    Pinned views
                  </Typography>
                  <Stack spacing={0.8} sx={{ mt: 1 }}>
                    {pinnedViews.map((v) => (
                      <Button
                        key={v.id}
                        variant="outlined"
                        startIcon={<PushPin />}
                        onClick={v.onClick}
                        sx={{
                          justifyContent: "flex-start",
                          borderColor: alpha(EVZ.green, 0.30),
                          color: EVZ.green,
                        }}
                      >
                        {v.name}
                      </Button>
                    ))}
                  </Stack>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Box>

        <Box>{children}</Box>
      </Box>
    </Box>
  );
}

const MOCK_CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const MOCK_VENDORS: Vendor[] = [
  { id: "v_1", name: "School Canteen", type: "Canteen", status: "Active" },
  { id: "v_2", name: "Campus Bookshop", type: "Bookshop", status: "Active" },
  { id: "v_3", name: "School Transport", type: "Transport", status: "Active" },
  { id: "v_4", name: "Greenhill Academy", type: "School", status: "Active" },
  { id: "v_5", name: "Uniform Store", type: "Other", status: "Active" },
];

const now = Date.now();
const MOCK_TXNS: Txn[] = [
  { id: "t_1", childId: "c_1", vendor: "School Canteen", category: "Food", amount: 6000, currency: "UGX", status: "Approved", at: now - 45 * 60000, ref: "TXN-91302" },
  { id: "t_2", childId: "c_2", vendor: "Campus Bookshop", category: "Books", amount: 18000, currency: "UGX", status: "Pending", at: now - 18 * 60000, ref: "TXN-91303" },
  { id: "t_3", childId: "c_2", vendor: "School Canteen", category: "Food", amount: 12000, currency: "UGX", status: "Declined", at: now - 2 * 60 * 60000, ref: "TXN-91304", reason: "Daily limit reached" },
  { id: "t_4", childId: "c_3", vendor: "Starlight School", category: "Fees", amount: 10, currency: "USD", status: "Approved", at: now - 1 * 24 * 60 * 60000, ref: "TXN-91305" },
];

const MOCK_REQUESTS: PaymentRequest[] = [
  { id: "r_1", childId: "c_1", title: "Trip contribution", amount: 55000, currency: "UGX", status: "Pending", at: now - 2 * 60 * 60000, kind: "School payment" },
  { id: "r_2", childId: "c_3", title: "Request: lunch allowance", amount: 10, currency: "USD", status: "Pending", at: now - 24 * 60000, kind: "Fund request" },
];

const MOCK_APPROVALS: Approval[] = [
  { id: "a_1", childId: "c_2", title: "Bookstore purchase", vendor: "Campus Bookshop", amount: 18000, currency: "UGX", status: "Pending", at: now - 18 * 60000 },
  { id: "a_2", childId: "c_1", title: "School fee payment", vendor: "Greenhill Academy", amount: 75000, currency: "UGX", status: "Approved", at: now - 3 * 24 * 60 * 60000 },
];

export default function EduPocketParentGlobalSearchPremium() {
  const { theme, mode, setMode } = useCorporateTheme();

  // Permission simulation: Admin vs Viewer
  const [viewerOnly, setViewerOnly] = useState(false);

  const [tab, setTab] = useState<ResultKind | "All">("All");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [details, setDetails] = useState<SearchResult | null>(null);

  const [debugMatch, setDebugMatch] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportExact, setExportExact] = useState(true);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { id: "sv1", name: "Declines", tab: "Transactions", q: "", filters: { status: "Declined" }, pinned: true },
    { id: "sv2", name: "Pending approvals", tab: "Approvals", q: "", filters: { status: "Pending" }, pinned: false },
  ]);

  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const hasCmd = e.metaKey || e.ctrlKey;
      if (isK && hasCmd) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pinnedViews = useMemo(() => savedViews.filter((v) => v.pinned), [savedViews]);

  const results = useMemo(() => {
    const query = q;

    const out: SearchResult[] = [];

    // children
    for (const c of MOCK_CHILDREN) {
      const reasons: MatchReason[] = [];
      const sName = scoreMatch(c.name, query);
      const sSchool = scoreMatch(c.school, query);
      const sClass = scoreMatch(c.className + " " + (c.stream ?? ""), query);
      const score = Math.max(sName, sSchool, sClass);
      if (score <= 0) continue;
      if (sName >= 3) reasons.push("Name");
      if (sSchool >= 3) reasons.push("School");
      if (sClass >= 3) reasons.push("Category");
      out.push({ kind: "Children", key: c.id, child: c, score, reasons: reasons.length ? reasons : ["Name"] });
    }

    // transactions
    for (const t of MOCK_TXNS) {
      const c = MOCK_CHILDREN.find((x) => x.id === t.childId);
      if (!c) continue;

      if (!inDateRange(t.at, filters.from, filters.to)) continue;
      if (filters.childId && filters.childId !== t.childId) continue;
      if (filters.category && filters.category !== t.category) continue;
      if (filters.vendor && norm(filters.vendor) !== norm(t.vendor)) continue;
      if (filters.status && filters.status !== t.status) continue;

      const reasons: MatchReason[] = [];
      const sVendor = scoreMatch(t.vendor, query);
      const sRef = scoreMatch(t.ref, query);
      const sCat = scoreMatch(t.category, query);
      const sStatus = scoreMatch(t.status, query);
      const sChild = scoreMatch(c.name + " " + c.school, query);
      const score = Math.max(sVendor, sRef, sCat, sStatus, sChild);
      if (score <= 0) continue;
      if (sVendor >= 3) reasons.push("Vendor");
      if (sRef >= 3) reasons.push("Reference");
      if (sCat >= 3) reasons.push("Category");
      if (sStatus >= 3) reasons.push("Status");
      if (sChild >= 3) reasons.push("Name");

      out.push({ kind: "Transactions", key: t.id, txn: t, child: c, score, reasons: reasons.length ? reasons : ["Vendor"] });
    }

    // vendors
    for (const v of MOCK_VENDORS) {
      if (filters.vendor && norm(filters.vendor) !== norm(v.name)) continue;
      const reasons: MatchReason[] = [];
      const sName = scoreMatch(v.name, query);
      const sType = scoreMatch(v.type, query);
      const sStatus = scoreMatch(v.status, query);
      const score = Math.max(sName, sType, sStatus);
      if (score <= 0) continue;
      if (sName >= 3) reasons.push("Vendor");
      if (sType >= 3) reasons.push("Category");
      if (sStatus >= 3) reasons.push("Status");
      out.push({ kind: "Vendors", key: v.id, vendor: v, score, reasons: reasons.length ? reasons : ["Vendor"] });
    }

    // requests
    for (const r of MOCK_REQUESTS) {
      const c = MOCK_CHILDREN.find((x) => x.id === r.childId);
      if (!c) continue;
      if (!inDateRange(r.at, filters.from, filters.to)) continue;
      if (filters.childId && filters.childId !== r.childId) continue;
      if (filters.status && filters.status !== r.status) continue;

      const reasons: MatchReason[] = [];
      const sTitle = scoreMatch(r.title, query);
      const sKind = scoreMatch(r.kind, query);
      const sChild = scoreMatch(c.name + " " + c.school, query);
      const sStatus = scoreMatch(r.status, query);
      const score = Math.max(sTitle, sKind, sChild, sStatus);
      if (score <= 0) continue;
      if (sTitle >= 3) reasons.push("Name");
      if (sKind >= 3) reasons.push("Category");
      if (sStatus >= 3) reasons.push("Status");
      out.push({ kind: "Payment Requests", key: r.id, req: r, child: c, score, reasons: reasons.length ? reasons : ["Name"] });
    }

    // approvals
    for (const a of MOCK_APPROVALS) {
      const c = MOCK_CHILDREN.find((x) => x.id === a.childId);
      if (!c) continue;

      if (!inDateRange(a.at, filters.from, filters.to)) continue;
      if (filters.childId && filters.childId !== a.childId) continue;
      if (filters.vendor && a.vendor && norm(filters.vendor) !== norm(a.vendor)) continue;
      if (filters.status && filters.status !== a.status) continue;

      const reasons: MatchReason[] = [];
      const sTitle = scoreMatch(a.title, query);
      const sVendor = scoreMatch(a.vendor ?? "", query);
      const sStatus = scoreMatch(a.status, query);
      const sChild = scoreMatch(c.name + " " + c.school, query);
      const score = Math.max(sTitle, sVendor, sStatus, sChild);
      if (score <= 0) continue;
      if (sTitle >= 3) reasons.push("Name");
      if (sVendor >= 3) reasons.push("Vendor");
      if (sStatus >= 3) reasons.push("Status");
      out.push({ kind: "Approvals", key: a.id, appr: a, child: c, score, reasons: reasons.length ? reasons : ["Name"] });
    }

    const filtered = tab === "All" ? out : out.filter((r) => r.kind === tab);
    filtered.sort((a, b) => b.score - a.score);
    return filtered.slice(0, 50);
  }, [q, tab, filters]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { All: results.length };
    for (const k of ["Children", "Transactions", "Vendors", "Payment Requests", "Approvals"] as const) {
      base[k] = results.filter((r) => r.kind === k).length;
    }
    return base;
  }, [results]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (filters.from) chips.push({ key: "from", label: `From: ${filters.from}`, onClear: () => setFilters((f) => ({ ...f, from: undefined })) });
    if (filters.to) chips.push({ key: "to", label: `To: ${filters.to}`, onClear: () => setFilters((f) => ({ ...f, to: undefined })) });
    if (filters.childId) {
      const child = MOCK_CHILDREN.find((c) => c.id === filters.childId);
      chips.push({ key: "childId", label: `Child: ${child?.name ?? ""}`, onClear: () => setFilters((f) => ({ ...f, childId: undefined })) });
    }
    if (filters.category) chips.push({ key: "category", label: `Category: ${filters.category}`, onClear: () => setFilters((f) => ({ ...f, category: undefined })) });
    if (filters.vendor) chips.push({ key: "vendor", label: `Vendor: ${filters.vendor}`, onClear: () => setFilters((f) => ({ ...f, vendor: undefined })) });
    if (filters.status) chips.push({ key: "status", label: `Status: ${filters.status}`, onClear: () => setFilters((f) => ({ ...f, status: undefined })) });
    return chips;
  }, [filters]);

  const saveCurrent = () => {
    if (viewerOnly) {
      setSnack({ open: true, msg: "Viewer access: you can’t save views", sev: "warning" });
      return;
    }

    const name = prompt("Name this view", "My saved search")?.trim();
    if (!name) return;
    const id = `sv_${Math.floor(Math.random() * 9999)}`;
    setSavedViews((p) => [{ id, name, tab, q, filters, pinned: false }, ...p]);
    setSnack({ open: true, msg: "Saved view created", sev: "success" });
  };

  const applySaved = (id: string) => {
    const v = savedViews.find((x) => x.id === id);
    if (!v) return;
    setTab(v.tab);
    setQ(v.q);
    setFilters(v.filters);
    setSnack({ open: true, msg: `Loaded view: ${v.name}`, sev: "info" });
  };

  const togglePin = (id: string) => {
    setSavedViews((p) => p.map((v) => (v.id === id ? { ...v, pinned: !v.pinned } : v)));
  };

  const shareLink = async () => {
    const payload = { tab, q, filters };
    const link = `edupocket://search?state=${encodeURIComponent(btoa(JSON.stringify(payload)))}`;

    try {
      await navigator.clipboard.writeText(link);
      setSnack({ open: true, msg: "Share link copied", sev: "success" });
    } catch {
      setSnack({ open: true, msg: "Could not copy link", sev: "warning" });
    }
  };

  const exportResults = () => {
    if (viewerOnly) {
      setSnack({ open: true, msg: "Viewer access: export disabled", sev: "warning" });
      return;
    }
    setExportOpen(true);
  };

  const doExport = () => {
    const rows: string[] = [];
    rows.push(["kind", "id", "title", "child", "amount", "currency", "status", "time", "match_reasons"].join(","));

    const exportList = exportExact ? results : results; // Placeholder: in real app, use dataset + filters if not exact.

    for (const r of exportList) {
      const reasons = r.reasons?.join("|") ?? "";

      if (r.kind === "Children") {
        rows.push(["child", r.child.id, r.child.name, "", "", "", "", "", reasons].map(csvSafe).join(","));
      }
      if (r.kind === "Vendors") {
        rows.push(["vendor", r.vendor.id, r.vendor.name, "", "", "", r.vendor.status, "", reasons].map(csvSafe).join(","));
      }
      if (r.kind === "Transactions") {
        rows.push([
          "txn",
          r.txn.id,
          `${r.txn.vendor} (${r.txn.category})`,
          r.child.name,
          String(r.txn.amount),
          r.txn.currency,
          r.txn.status,
          new Date(r.txn.at).toISOString(),
          reasons,
        ].map(csvSafe).join(","));
      }
      if (r.kind === "Payment Requests") {
        rows.push([
          "request",
          r.req.id,
          r.req.title,
          r.child.name,
          String(r.req.amount),
          r.req.currency,
          r.req.status,
          new Date(r.req.at).toISOString(),
          reasons,
        ].map(csvSafe).join(","));
      }
      if (r.kind === "Approvals") {
        rows.push([
          "approval",
          r.appr.id,
          r.appr.title,
          r.child.name,
          String(r.appr.amount),
          r.appr.currency,
          r.appr.status,
          new Date(r.appr.at).toISOString(),
          reasons,
        ].map(csvSafe).join(","));
      }
    }

    downloadText(`edupocket_search_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    setSnack({ open: true, msg: "Export ready", sev: "success" });
    setExportOpen(false);
  };

  const empty = results.length === 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        pinnedViews={pinnedViews.map((v) => ({ id: v.id, name: v.name, onClick: () => applySaved(v.id) }))}
      >
        <Container maxWidth={false} disableGutters>
          <Stack spacing={2.2}>
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                  <Box>
                    <Typography variant="h5">Global Search</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search children, transactions, vendors, requests and approvals. (Ctrl/Cmd + K)
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormViewerToggle viewerOnly={viewerOnly} onToggle={setViewerOnly} />

                    <Button
                      variant="outlined"
                      startIcon={<FilterAlt />}
                      onClick={() => setFiltersOpen(true)}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Filters
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<History />}
                      onClick={saveCurrent}
                      sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                    >
                      Save view
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      onClick={shareLink}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Share link
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={exportResults}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Export
                    </Button>
                  </Stack>
                </Stack>

                {viewerOnly ? (
                  <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
                    Viewer access enabled: exporting, saving and approval actions are disabled.
                  </Alert>
                ) : null}

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.4}>
                  <TextField
                    fullWidth
                    inputRef={(el) => (searchRef.current = el)}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by child, vendor, reference, category, status..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title="Explain why it matched">
                              <Chip
                                size="small"
                                clickable
                                icon={<Info fontSize="small" />}
                                label={debugMatch ? "Match explain: ON" : "Match explain: OFF"}
                                onClick={() => setDebugMatch((v) => !v)}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                                  border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                }}
                              />
                            </Tooltip>
                          </Stack>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Use tabs and filters to narrow down."
                  />

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {activeFilterChips.length === 0 ? (
                      <Chip
                        size="small"
                        label="No filters applied"
                        sx={{
                          fontWeight: 900,
                          bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                          border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                        }}
                      />
                    ) : (
                      activeFilterChips.map((c) => (
                        <Chip
                          key={c.key}
                          size="small"
                          label={c.label}
                          onDelete={c.onClear}
                          sx={{
                            fontWeight: 900,
                            bgcolor: alpha(EVZ.green, 0.12),
                            color: EVZ.green,
                            border: `1px solid ${alpha(EVZ.green, 0.24)}`,
                          }}
                        />
                      ))
                    )}
                    {(activeFilterChips.length > 0 || q) && (
                      <Button
                        size="small"
                        startIcon={<Close />}
                        onClick={() => {
                          setQ("");
                          setFilters({});
                          setTab("All");
                          setSnack({ open: true, msg: "Cleared search", sev: "info" });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </Stack>

                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons
                    allowScrollButtonsMobile
                    sx={{
                      "& .MuiTab-root": { fontWeight: 950 },
                      "& .MuiTabs-indicator": { bgcolor: EVZ.green, height: 3, borderRadius: 99 },
                    }}
                  >
                    <Tab value="All" label={`All (${counts.All ?? 0})`} />
                    <Tab value="Children" label={`Children (${counts.Children ?? 0})`} />
                    <Tab value="Transactions" label={`Transactions (${counts.Transactions ?? 0})`} />
                    <Tab value="Vendors" label={`Vendors (${counts.Vendors ?? 0})`} />
                    <Tab value="Payment Requests" label={`Payment Requests (${counts["Payment Requests"] ?? 0})`} />
                    <Tab value="Approvals" label={`Approvals (${counts.Approvals ?? 0})`} />
                  </Tabs>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={2.2} alignItems="flex-start">
              <Card sx={{ flex: 1, width: "100%" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.2}>
                      <Typography variant="h6">Results</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {empty ? "No matches" : `Showing ${results.length} match(es)`}
                      </Typography>
                    </Stack>
                    <Button
                      variant="outlined"
                      startIcon={<FilterAlt />}
                      onClick={() => setFiltersOpen(true)}
                      sx={{ borderColor: alpha(EVZ.ink, mode === "dark" ? 0.30 : 0.18), color: "text.primary" }}
                    >
                      Filters
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {empty ? (
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px dashed ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.15)}`,
                        bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70),
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Try a broader search
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Use names, vendor names, references (TXN-xxxx), categories or statuses.
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          onClick={() => {
                            setTab("Transactions");
                            setFilters({ status: "Declined" });
                          }}
                          startIcon={<WarningAmber />}
                        >
                          Show declines
                        </Button>
                        <Button
                          onClick={() => {
                            setTab("Approvals");
                            setFilters({ status: "Pending" });
                          }}
                          startIcon={<Info />}
                        >
                          Pending approvals
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {results.map((r) => (
                        <ListItemButton
                          key={r.key}
                          onClick={() => setDetails(r)}
                          sx={{
                            borderRadius: 3,
                            mb: 1,
                            border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.10)}`,
                            bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.68),
                          }}
                          component={motion.div}
                          whileHover={{ y: -2 }}
                        >
                          <ListItemAvatar>{renderAvatar(r)}</ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography sx={{ fontWeight: 950 }} noWrap>
                                  {renderPrimary(r)}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={r.kind}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(EVZ.green, 0.12),
                                    color: EVZ.green,
                                    border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                  }}
                                />
                                {debugMatch ? <MatchReasons reasons={r.reasons} /> : null}
                              </Stack>
                            }
                            secondary={renderSecondary(r)}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              <Stack spacing={2.2} sx={{ width: { xs: "100%", lg: 420 }, flexShrink: 0 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">Saved views</Typography>
                      <Button size="small" onClick={saveCurrent} startIcon={<History />} sx={{ color: EVZ.orange }}>
                        Save
                      </Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                      One-tap search presets. Pin important ones to the sidebar.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {savedViews
                        .slice()
                        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                        .map((v) => (
                          <Card key={v.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                    {v.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {v.tab} • {Object.keys(v.filters).length ? "Filtered" : "No filters"}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Tooltip title={v.pinned ? "Unpin" : "Pin to sidebar"}>
                                    <IconButton onClick={() => togglePin(v.id)}>
                                      {v.pinned ? <PushPin fontSize="small" /> : <PinDrop fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                  <Button size="small" onClick={() => applySaved(v.id)}>
                                    Load
                                  </Button>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6">Quick suggestions</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                      Useful searches in a parent workflow.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      <Suggestion
                        title="All declines"
                        desc="Adjust limits or vendor rules quickly."
                        onClick={() => {
                          setTab("Transactions");
                          setQ("");
                          setFilters({ status: "Declined" });
                        }}
                        icon={<WarningAmber fontSize="small" />}
                      />
                      <Suggestion
                        title="Pending approvals"
                        desc="Open items waiting for your action."
                        onClick={() => {
                          setTab("Approvals");
                          setQ("");
                          setFilters({ status: "Pending" });
                        }}
                        icon={<Info fontSize="small" />}
                      />
                      <Suggestion
                        title="School fees"
                        desc="Search fee payments and requests across children."
                        onClick={() => {
                          setTab("Transactions");
                          setQ("fees");
                          setFilters({ category: "Fees" });
                        }}
                        icon={<CheckCircle fontSize="small" />}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </AppShell>

      {/* Filters Drawer */}
      <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 540 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Filters</Typography>
              <Typography variant="body2" color="text.secondary">
                Narrow results using child, vendor, category, status and date range.
              </Typography>
            </Stack>
            <IconButton onClick={() => setFiltersOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.6}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                label="From"
                type="date"
                value={filters.from ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="To"
                type="date"
                value={filters.to ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              select
              label="Child"
              value={filters.childId ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, childId: e.target.value || undefined }))}
              fullWidth
            >
              <MenuItem value="">All children</MenuItem>
              {MOCK_CHILDREN.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} • {c.school}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Category"
              value={filters.category ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, category: (e.target.value as any) || undefined }))}
              fullWidth
            >
              <MenuItem value="">All categories</MenuItem>
              {(["Food", "Books", "Transport", "Fees", "Other"] as const).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vendor"
              value={filters.vendor ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value || undefined }))}
              fullWidth
            >
              <MenuItem value="">All vendors</MenuItem>
              {MOCK_VENDORS.map((v) => (
                <MenuItem key={v.id} value={v.name}>
                  {v.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={filters.status ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as any) || undefined }))}
              fullWidth
            >
              <MenuItem value="">Any status</MenuItem>
              {(["Approved", "Declined", "Pending"] as const).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <Alert severity="info" icon={<Info />}>
              Filters apply across all result types. Use tabs to focus.
            </Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => {
                  setFiltersOpen(false);
                  setSnack({ open: true, msg: "Filters applied", sev: "success" });
                }}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
              >
                Apply
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Close />}
                onClick={() => setFilters({})}
                sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.2 }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Details Drawer */}
      <Drawer anchor="right" open={Boolean(details)} onClose={() => setDetails(null)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Context-aware actions.
              </Typography>
            </Stack>
            <IconButton onClick={() => setDetails(null)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {details ? <DetailsPanel details={details} mode={mode} viewerOnly={viewerOnly} /> : null}
        </Box>
      </Drawer>

      {/* Export Drawer */}
      <Drawer anchor="right" open={exportOpen} onClose={() => setExportOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
        <Box sx={{ p: 2.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Export</Typography>
              <Typography variant="body2" color="text.secondary">
                Download a CSV for reporting and audits.
              </Typography>
            </Stack>
            <IconButton onClick={() => setExportOpen(false)}>
              <Close />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.4}>
            <Alert severity="info" icon={<Info />}>
              Export defaults to "exactly what I see" (current query, filters and tab).
            </Alert>

            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Export exactly what I see
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uses the current on-screen results.
                    </Typography>
                  </Box>
                  <Switch checked={exportExact} onChange={(e) => setExportExact(e.target.checked)} />
                </Stack>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={doExport}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
              fullWidth
            >
              Export CSV
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

function FormViewerToggle({ viewerOnly, onToggle }: { viewerOnly: boolean; onToggle: (v: boolean) => void }) {
  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <VerifiedUser fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 900 }}>
          Viewer
        </Typography>
        <Switch size="small" checked={viewerOnly} onChange={(e) => onToggle(e.target.checked)} />
      </Stack>
    </Card>
  );
}

function Suggestion({ title, desc, onClick, icon }: { title: string; desc: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <Card
      variant="outlined"
      component={motion.div}
      whileHover={{ y: -2 }}
      onClick={onClick}
      sx={{
        bgcolor: alpha("#FFFFFF", 0.72),
        borderColor: alpha(EVZ.ink, 0.10),
        cursor: "pointer",
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
              border: `1px solid ${alpha(EVZ.green, 0.22)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {desc}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  return (
    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
      {reasons.slice(0, 3).map((r) => (
        <Chip
          key={r}
          size="small"
          label={r}
          sx={{
            fontWeight: 900,
            bgcolor: alpha(EVZ.ink, 0.06),
            border: `1px solid ${alpha(EVZ.ink, 0.10)}`,
          }}
        />
      ))}
    </Stack>
  );
}

function renderAvatar(r: SearchResult) {
  if (r.kind === "Children") {
    return (
      <Avatar sx={{ bgcolor: alpha(EVZ.green, 0.16), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.25)}` }}>
        {r.child.name.split(" ")[0][0]}
      </Avatar>
    );
  }

  if (r.kind === "Vendors") {
    return (
      <Avatar sx={{ bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.25)}` }}>
        V
      </Avatar>
    );
  }

  if (r.kind === "Transactions") {
    const tone = r.txn.status === "Approved" ? EVZ.green : r.txn.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.65);
    return (
      <Avatar sx={{ bgcolor: alpha(tone, 0.14), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}>
        T
      </Avatar>
    );
  }

  if (r.kind === "Payment Requests") {
    return (
      <Avatar sx={{ bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.25)}` }}>
        R
      </Avatar>
    );
  }

  return (
    <Avatar sx={{ bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.25)}` }}>
      A
    </Avatar>
  );
}

function renderPrimary(r: SearchResult) {
  if (r.kind === "Children") return `${r.child.name} • ${r.child.school}`;
  if (r.kind === "Vendors") return `${r.vendor.name} • ${r.vendor.type}`;
  if (r.kind === "Transactions") return `${r.txn.vendor} • ${r.txn.category} • ${fmtMoney(r.txn.amount, r.txn.currency)}`;
  if (r.kind === "Payment Requests") return `${r.req.title} • ${fmtMoney(r.req.amount, r.req.currency)}`;
  return `${r.appr.title} • ${fmtMoney(r.appr.amount, r.appr.currency)}`;
}

function renderSecondary(r: SearchResult) {
  if (r.kind === "Children") return `${r.child.className}${r.child.stream ? ` • ${r.child.stream}` : ""}`;
  if (r.kind === "Vendors") return `${r.vendor.status}`;
  if (r.kind === "Transactions") return `${r.child.name} • ${r.txn.status} • ${timeAgo(r.txn.at)} • ${r.txn.ref}${r.txn.reason ? ` • ${r.txn.reason}` : ""}`;
  if (r.kind === "Payment Requests") return `${r.child.name} • ${r.req.kind} • ${r.req.status} • ${timeAgo(r.req.at)}`;
  return `${r.child.name} • ${r.appr.status} • ${timeAgo(r.appr.at)}`;
}

function DetailsPanel({ details, mode, viewerOnly }: { details: SearchResult; mode: "light" | "dark"; viewerOnly: boolean }) {
  const subtle = alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72);

  const actionBtn = (label: string, onClick: () => void, tone: "primary" | "secondary" | "neutral" = "primary", disabled?: boolean) => {
    const sx =
      tone === "primary"
        ? { bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }
        : tone === "secondary"
        ? { borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }
        : { borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" };

    return (
      <Button fullWidth disabled={disabled} variant={tone === "primary" ? "contained" : "outlined"} onClick={onClick} sx={{ py: 1.1, ...sx }}>
        {label}
      </Button>
    );
  };

  const disabledByRole = viewerOnly;

  if (details.kind === "Children") {
    return (
      <Stack spacing={1.6}>
        <Card variant="outlined" sx={{ bgcolor: subtle }}>
          <CardContent>
            <Typography variant="h6">{details.child.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {details.child.school} • {details.child.className}
              {details.child.stream ? ` • ${details.child.stream}` : ""}
            </Typography>
          </CardContent>
        </Card>

        {disabledByRole ? (
          <Alert severity="info" icon={<Info />}>
            Viewer access: actions are limited.
          </Alert>
        ) : null}

        <Stack spacing={1.1}>
          {actionBtn("Open child hub", () => alert("Open child hub"), "primary", false)}
          {actionBtn("View student QR", () => alert("Open QR"), "neutral", false)}
          {actionBtn("Review controls", () => alert("Open controls"), "secondary", false)}
        </Stack>
      </Stack>
    );
  }

  if (details.kind === "Vendors") {
    return (
      <Stack spacing={1.6}>
        <Card variant="outlined" sx={{ bgcolor: subtle }}>
          <CardContent>
            <Typography variant="h6">{details.vendor.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {details.vendor.type} • {details.vendor.status}
            </Typography>
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="caption" color="text.secondary">
              Vendor actions affect where children can spend.
            </Typography>
          </CardContent>
        </Card>

        {disabledByRole ? (
          <Alert severity="info" icon={<Info />}>
            Viewer access: allow/block changes are disabled.
          </Alert>
        ) : null}

        <Stack spacing={1.1}>
          {actionBtn("Open vendor summary", () => alert("Open vendor"), "primary", false)}
          {actionBtn("Filter transactions by vendor", () => alert("Filter"), "neutral", false)}
          {actionBtn("Allow/Block vendor", () => alert("Rules"), "secondary", disabledByRole)}
        </Stack>
      </Stack>
    );
  }

  if (details.kind === "Transactions") {
    const tone = details.txn.status === "Approved" ? EVZ.green : details.txn.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7);
    return (
      <Stack spacing={1.6}>
        <Card variant="outlined" sx={{ bgcolor: subtle, borderColor: alpha(tone, 0.25) }}>
          <CardContent>
            <Typography variant="h6">{details.txn.vendor}</Typography>
            <Typography variant="body2" color="text.secondary">
              {details.txn.category} • {details.child.name} • {timeAgo(details.txn.at)}
            </Typography>
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="h5">{fmtMoney(details.txn.amount, details.txn.currency)}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
              <Chip
                size="small"
                label={details.txn.status}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(tone, 0.12),
                  color: tone,
                  border: `1px solid ${alpha(tone, 0.22)}`,
                }}
              />
              <Chip
                size="small"
                label={details.txn.ref}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(EVZ.ink, 0.06),
                  border: `1px solid ${alpha(EVZ.ink, 0.10)}`,
                }}
              />
              {details.txn.reason ? (
                <Chip
                  size="small"
                  label={details.txn.reason}
                  sx={{
                    fontWeight: 900,
                    bgcolor: alpha(EVZ.orange, 0.10),
                    border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                    color: EVZ.orange,
                  }}
                />
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={1.1}>
          {actionBtn("View receipt", () => alert("Receipt"), "primary", disabledByRole)}
          {actionBtn("Dispute transaction", () => alert("Dispute"), "secondary", disabledByRole)}
          {actionBtn("Export this transaction", () => alert("Export one"), "neutral", disabledByRole)}
        </Stack>

        {disabledByRole ? (
          <Alert severity="info" icon={<Info />}>
            Viewer access: exporting and disputes are disabled.
          </Alert>
        ) : null}
      </Stack>
    );
  }

  if (details.kind === "Payment Requests") {
    const tone = details.req.status === "Approved" ? EVZ.green : details.req.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7);
    return (
      <Stack spacing={1.6}>
        <Card variant="outlined" sx={{ bgcolor: subtle, borderColor: alpha(tone, 0.25) }}>
          <CardContent>
            <Typography variant="h6">{details.req.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {details.child.name} • {details.req.kind} • {timeAgo(details.req.at)}
            </Typography>
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="h5">{fmtMoney(details.req.amount, details.req.currency)}</Typography>
            <Chip
              size="small"
              label={details.req.status}
              sx={{ mt: 1.2, fontWeight: 900, bgcolor: alpha(tone, 0.12), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}
            />
          </CardContent>
        </Card>

        <Stack spacing={1.1}>
          {details.req.status === "Pending" ? actionBtn("Approve", () => alert("Approve"), "primary", disabledByRole) : null}
          {details.req.status === "Pending" ? actionBtn("Decline", () => alert("Decline"), "secondary", disabledByRole) : null}
          {actionBtn("Open child funding", () => alert("Funding"), "neutral", false)}
        </Stack>
      </Stack>
    );
  }

  // approvals
  const tone = details.appr.status === "Approved" ? EVZ.green : details.appr.status === "Declined" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  return (
    <Stack spacing={1.6}>
      <Card variant="outlined" sx={{ bgcolor: subtle, borderColor: alpha(tone, 0.25) }}>
        <CardContent>
          <Typography variant="h6">{details.appr.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {details.child.name} • {details.appr.vendor ?? ""} • {timeAgo(details.appr.at)}
          </Typography>
          <Divider sx={{ my: 1.4 }} />
          <Typography variant="h5">{fmtMoney(details.appr.amount, details.appr.currency)}</Typography>
          <Chip
            size="small"
            label={details.appr.status}
            sx={{ mt: 1.2, fontWeight: 900, bgcolor: alpha(tone, 0.12), color: tone, border: `1px solid ${alpha(tone, 0.22)}` }}
          />
        </CardContent>
      </Card>

      <Stack spacing={1.1}>
        {details.appr.status === "Pending" ? actionBtn("Approve", () => alert("Approve"), "primary", disabledByRole) : null}
        {details.appr.status === "Pending" ? actionBtn("Decline", () => alert("Decline"), "secondary", disabledByRole) : null}
        {actionBtn("Create a rule for this vendor", () => alert("Rule"), "neutral", disabledByRole)}
      </Stack>

      {disabledByRole ? (
        <Alert severity="info" icon={<Info />}>
          Viewer access: approval actions are disabled.
        </Alert>
      ) : null}
    </Stack>
  );
}
