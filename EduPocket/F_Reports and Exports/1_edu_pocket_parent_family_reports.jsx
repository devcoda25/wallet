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
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  ArrowForward,
  BarChart,
  Download,
  FilterAlt,
  Info,
  PieChart,
  Print,
  Search,
  Shield,
  TrendingUp,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Family Reports (Premium)
 * Route: /parent/edupocket/reports
 * Includes:
 * - ReportFiltersBar (date range, child, category, vendor)
 * - SpendingBreakdownChart (simple bar breakdown) + SummaryCards
 * - LimitHitsReportTable (table-like cards)
 * - VendorConcentrationTable
 * - TermSummaryPanel
 * - ExportMenu (Print/Save PDF + CSV)
 * - State: Not enough data
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type Category = "Food" | "Books" | "Transport" | "Fees" | "Other";

type TxnStatus = "Approved" | "Declined" | "Pending";

type Txn = {
  id: string;
  at: number;
  childId: string;
  vendor: string;
  category: Category;
  amount: number;
  currency: "UGX" | "USD";
  status: TxnStatus;
  limitHit?: string; // if present, indicates limit rule hit/decline reason
};

type Term = { id: string; name: string; start: string; end: string };

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const VENDORS = ["School Canteen", "Campus Bookshop", "School Transport", "Uniform Store", "Starlight School", "New Snack Kiosk"];
const CATEGORIES: Category[] = ["Food", "Books", "Transport", "Fees", "Other"];

const TERMS: Term[] = [
  { id: "t1", name: "Term 1", start: "2026-02-03", end: "2026-05-02" },
  { id: "t2", name: "Term 2", start: "2026-06-01", end: "2026-08-29" },
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

function AppShell({ mode, onToggleMode, children }: { mode: "light" | "dark"; onToggleMode: () => void; children: React.ReactNode }) {
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
                <BarChart fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Family reports and exports
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to landing">
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

function fmtMoney(amount: number, currency: string) {
  const a = Math.round(amount);
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(a)} ${currency}`;
  } catch {
    return `${a} ${currency}`;
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

function iso(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function randChoice<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seededTxns(): Txn[] {
  const out: Txn[] = [];
  const now = Date.now();

  // generate 90 days of sample txns
  for (let i = 0; i < 140; i++) {
    const daysAgo = Math.floor(Math.random() * 95);
    const at = now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 10) * 60 * 60 * 1000;
    const childId = randChoice(CHILDREN).id;
    const vendor = randChoice(VENDORS);
    const category = randChoice(CATEGORIES);
    const currency: Txn["currency"] = childId === "c_3" ? "USD" : "UGX";

    const base = category === "Fees" ? (currency === "USD" ? 12 : 65000) : category === "Books" ? (currency === "USD" ? 6 : 18000) : category === "Transport" ? (currency === "USD" ? 3 : 7000) : category === "Food" ? (currency === "USD" ? 2 : 6000) : (currency === "USD" ? 4 : 12000);

    const amount = Math.max(1, Math.round(base * (0.65 + Math.random() * 0.9)));

    const decline = Math.random() < 0.14;
    const pending = !decline && Math.random() < 0.05;
    const status: TxnStatus = pending ? "Pending" : decline ? "Declined" : "Approved";

    const limitHit =
      status === "Declined"
        ? randChoice([
            "Per-transaction limit",
            "Daily limit",
            "Outside allowed hours",
            "Vendor blocked",
            "Category restricted",
          ])
        : undefined;

    out.push({
      id: `t_${100000 + i}`,
      at,
      childId,
      vendor,
      category,
      amount,
      currency,
      status,
      limitHit,
    });
  }

  return out;
}

function printReport(title: string, meta: string, rowsHtml: string) {
  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(`
  <html>
    <head>
      <title>${title}</title>
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
      <h1>${title}</h1>
      <div class="meta">${meta}</div>
      ${rowsHtml}
      <script>window.focus();</script>
    </body>
  </html>`);

  w.document.close();
  w.focus();
  w.print();
}

export default function EduPocketFamilyReports() {
  const { theme, mode, setMode } = useCorporateTheme();
  const [txns] = useState<Txn[]>(seededTxns());

  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [childId, setChildId] = useState<string>("");
  const [category, setCategory] = useState<Category | "">("");
  const [vendor, setVendor] = useState<string>("");
  const [termId, setTermId] = useState<string>(TERMS[0].id);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return txns
      .filter((t) => (childId ? t.childId === childId : true))
      .filter((t) => (category ? t.category === category : true))
      .filter((t) => (vendor ? t.vendor === vendor : true))
      .filter((t) => {
        if (!from && !to) return true;
        const d = iso(t.at);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .filter((t) => {
        if (!query) return true;
        const childName = CHILDREN.find((c) => c.id === t.childId)?.name ?? "";
        return `${t.vendor} ${t.category} ${t.status} ${t.limitHit ?? ""} ${childName}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.at - a.at);
  }, [txns, q, from, to, childId, category, vendor]);

  const notEnoughData = filtered.length < 8;

  const currency = useMemo(() => {
    // keep it simple: if multiple currencies exist, show "Mixed"
    const set = new Set(filtered.map((t) => t.currency));
    return set.size === 1 ? Array.from(set)[0] : "Mixed";
  }, [filtered]);

  const totals = useMemo(() => {
    const sum = filtered.reduce((acc, t) => acc + (t.currency === "UGX" ? t.amount : 0), 0);
    const sumUsd = filtered.reduce((acc, t) => acc + (t.currency === "USD" ? t.amount : 0), 0);

    const approved = filtered.filter((t) => t.status === "Approved").length;
    const declined = filtered.filter((t) => t.status === "Declined").length;
    const pending = filtered.filter((t) => t.status === "Pending").length;

    const topVendor = Object.entries(
      filtered.reduce<Record<string, number>>((acc, t) => {
        acc[t.vendor] = (acc[t.vendor] ?? 0) + (t.status === "Approved" ? t.amount : 0);
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const limitHits = filtered.filter((t) => Boolean(t.limitHit)).length;

    return { sum, sumUsd, approved, declined, pending, topVendor: topVendor ?? "—", limitHits };
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const totals = CATEGORIES.map((c) => {
      const val = filtered.filter((t) => t.category === c && t.status === "Approved" && t.currency === "UGX").reduce((a, b) => a + b.amount, 0);
      const valUsd = filtered.filter((t) => t.category === c && t.status === "Approved" && t.currency === "USD").reduce((a, b) => a + b.amount, 0);
      return { category: c, ugx: val, usd: valUsd };
    });

    const sumUgx = totals.reduce((a, b) => a + b.ugx, 0);
    const sumUsd = totals.reduce((a, b) => a + b.usd, 0);

    return { rows: totals, sumUgx, sumUsd };
  }, [filtered]);

  const vendorConcentration = useMemo(() => {
    const map = filtered
      .filter((t) => t.status === "Approved")
      .reduce<Record<string, number>>((acc, t) => {
        const key = `${t.vendor} (${t.currency})`;
        acc[key] = (acc[key] ?? 0) + t.amount;
        return acc;
      }, {});

    const rows = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([vendor, amount]) => ({ vendor, amount }));

    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;

    return rows.map((r) => ({ ...r, share: Math.round((r.amount / total) * 100) }));
  }, [filtered]);

  const limitHitsReport = useMemo(() => {
    const hits = filtered.filter((t) => t.status === "Declined" && t.limitHit);
    const map = hits.reduce<Record<string, { hits: number; children: Set<string> }>>((acc, t) => {
      const k = t.limitHit || "Other";
      if (!acc[k]) acc[k] = { hits: 0, children: new Set() };
      acc[k].hits += 1;
      acc[k].children.add(t.childId);
      return acc;
    }, {});

    return Object.entries(map)
      .sort((a, b) => b[1].hits - a[1].hits)
      .map(([rule, v]) => ({ rule, hits: v.hits, children: v.children.size }));
  }, [filtered]);

  const termSummary = useMemo(() => {
    const term = TERMS.find((t) => t.id === termId) ?? TERMS[0];
    const start = term.start;
    const end = term.end;

    const inside = txns.filter((t) => {
      const d = iso(t.at);
      return d >= start && d <= end;
    });

    const sum = inside.filter((t) => t.currency === "UGX" && t.status === "Approved").reduce((a, b) => a + b.amount, 0);
    const sumUsd = inside.filter((t) => t.currency === "USD" && t.status === "Approved").reduce((a, b) => a + b.amount, 0);

    const byChild = CHILDREN.map((c) => {
      const csum = inside.filter((t) => t.childId === c.id && t.status === "Approved" && t.currency === "UGX").reduce((a, b) => a + b.amount, 0);
      const csumUsd = inside.filter((t) => t.childId === c.id && t.status === "Approved" && t.currency === "USD").reduce((a, b) => a + b.amount, 0);
      return { child: c.name, ugx: csum, usd: csumUsd };
    });

    return { term, sum, sumUsd, byChild };
  }, [txns, termId]);

  const exportCsv = () => {
    const rows: string[] = [];
    rows.push(["date", "child", "vendor", "category", "amount", "currency", "status", "limitHit"].join(","));
    for (const t of filtered) {
      const childName = CHILDREN.find((c) => c.id === t.childId)?.name ?? "";
      rows.push([iso(t.at), childName, t.vendor, t.category, String(t.amount), t.currency, t.status, t.limitHit ?? ""].map(csvSafe).join(","));
    }
    downloadText(`edupocket_family_report_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    toast("CSV export ready", "success");
  };

  const exportPdf = () => {
    const meta = `Filters: ${from || "(start)"} to ${to || "(end)"} | Child: ${childId ? CHILDREN.find((c) => c.id === childId)?.name : "All"} | Category: ${category || "All"} | Vendor: ${vendor || "All"}`;

    const rows = filtered
      .slice(0, 120)
      .map((t) => {
        const childName = CHILDREN.find((c) => c.id === t.childId)?.name ?? "";
        return `<tr><td>${iso(t.at)}</td><td>${childName}</td><td>${t.vendor}</td><td>${t.category}</td><td>${t.amount}</td><td>${t.currency}</td><td>${t.status}</td></tr>`;
      })
      .join("\n");

    const table = `
      <table>
        <thead>
          <tr><th>Date</th><th>Child</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Currency</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    printReport("EduPocket Family Report", meta, table);
    toast("Print dialog opened", "info");
  };

  const reset = () => {
    setQ("");
    setFrom("");
    setTo("");
    setChildId("");
    setCategory("");
    setVendor("");
    toast("Filters reset", "info");
  };

  const vendorsInFiltered = useMemo(() => Array.from(new Set(txns.map((t) => t.vendor))).sort(), [txns]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}>
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Family reports</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyze spending patterns, limit hits and vendor concentration.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportCsv}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Print />}
                      onClick={exportPdf}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Print / Save PDF
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Filters bar */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                        <TextField
                          fullWidth
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search vendor, child, rule hit..."
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

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                        <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 220 }}>
                          <MenuItem value="">All children</MenuItem>
                          {CHILDREN.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as any)} sx={{ minWidth: 190 }}>
                          <MenuItem value="">All categories</MenuItem>
                          {CATEGORIES.map((c) => (
                            <MenuItem key={c} value={c}>
                              {c}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} sx={{ minWidth: 240 }}>
                          <MenuItem value="">All vendors</MenuItem>
                          {vendorsInFiltered.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Box sx={{ flex: 1 }} />

                        <Button
                          variant="outlined"
                          startIcon={<FilterAlt />}
                          onClick={reset}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Reset
                        </Button>
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        Showing <b>{filtered.length}</b> transactions.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {notEnoughData ? (
                  <Alert severity="info" icon={<Info />}>
                    Not enough data for strong insights. Add more transactions or widen the date range.
                  </Alert>
                ) : null}

                {/* Summary */}
                <Grid container spacing={1.6}>
                  <Grid item xs={12} md={3}>
                    <SummaryCard
                      mode={mode}
                      icon={<TrendingUp fontSize="small" />}
                      title="Approved spend"
                      value={currency === "Mixed" ? `${fmtMoney(totals.sum, "UGX")} + ${fmtMoney(totals.sumUsd, "USD")}` : currency === "UGX" ? fmtMoney(totals.sum, "UGX") : fmtMoney(totals.sumUsd, "USD")}
                      subtitle="Approved transactions only"
                      tone={EVZ.green}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <SummaryCard
                      mode={mode}
                      icon={<VerifiedUser fontSize="small" />}
                      title="Status counts"
                      value={`${totals.approved} approved / ${totals.declined} declined`}
                      subtitle={`${totals.pending} pending`}
                      tone={totals.declined > 0 ? EVZ.orange : EVZ.green}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <SummaryCard
                      mode={mode}
                      icon={<PieChart fontSize="small" />}
                      title="Top vendor"
                      value={totals.topVendor}
                      subtitle="By approved spend"
                      tone={EVZ.green}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <SummaryCard
                      mode={mode}
                      icon={<WarningAmber fontSize="small" />}
                      title="Limit hits"
                      value={`${totals.limitHits}`}
                      subtitle="Declines with rule hit"
                      tone={totals.limitHits > 0 ? EVZ.orange : EVZ.green}
                    />
                  </Grid>
                </Grid>

                {/* Breakdown chart + tables */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Spending breakdown</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Category split for approved transactions.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {notEnoughData ? (
                          <Alert severity="info" icon={<Info />}>
                            Not enough data to render a meaningful breakdown.
                          </Alert>
                        ) : (
                          <Stack spacing={1.2}>
                            {CATEGORIES.map((c) => {
                              const row = categoryBreakdown.rows.find((r) => r.category === c)!;
                              const denom = currency === "USD" ? categoryBreakdown.sumUsd : categoryBreakdown.sumUgx;
                              const val = currency === "USD" ? row.usd : row.ugx;
                              const pct = Math.round((val / Math.max(1, denom)) * 100);
                              return (
                                <BarRow
                                  key={c}
                                  mode={mode}
                                  label={c}
                                  value={currency === "USD" ? fmtMoney(row.usd, "USD") : fmtMoney(row.ugx, "UGX")}
                                  pct={pct}
                                />
                              );
                            })}
                          </Stack>
                        )}

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          If you operate in multiple currencies, view reports per currency for clarity.
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Limit hits report</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rules that trigger declines most often.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {limitHitsReport.length === 0 ? (
                          <Alert severity="success" icon={<VerifiedUser />}>
                            No limit hits in the filtered period.
                          </Alert>
                        ) : (
                          <Stack spacing={1}>
                            {limitHitsReport.slice(0, 6).map((r) => (
                              <Card
                                key={r.rule}
                                variant="outlined"
                                component={motion.div}
                                whileHover={{ y: -2 }}
                                sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                              >
                                <CardContent>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        {r.rule}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Children affected: {r.children}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      size="small"
                                      label={`${r.hits} hits`}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(EVZ.orange, 0.12),
                                        color: EVZ.orange,
                                        border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                                      }}
                                    />
                                  </Stack>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}

                        <Divider sx={{ my: 1.6 }} />

                        <Button
                          variant="outlined"
                          startIcon={<Info />}
                          onClick={() => toast("Navigate: /parent/edupocket/children/:childId/controls", "info")}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Review controls
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Vendor concentration</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Top vendors by spend share.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        {vendorConcentration.length === 0 ? (
                          <Alert severity="info" icon={<Info />}>
                            No vendor data.
                          </Alert>
                        ) : (
                          <Stack spacing={1}>
                            {vendorConcentration.map((v) => (
                              <Card
                                key={v.vendor}
                                variant="outlined"
                                component={motion.div}
                                whileHover={{ y: -2 }}
                                sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                              >
                                <CardContent>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                        {v.vendor}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Share: {v.share}%
                                      </Typography>
                                    </Box>
                                    <Chip
                                      size="small"
                                      label={`${v.amount}`}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(EVZ.green, 0.10),
                                        color: EVZ.green,
                                        border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                      }}
                                    />
                                  </Stack>
                                  <Divider sx={{ my: 1.2 }} />
                                  <Box
                                    sx={{
                                      height: 10,
                                      borderRadius: 999,
                                      bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10),
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Box sx={{ height: "100%", width: `${Math.min(100, Math.max(2, v.share))}%`, bgcolor: EVZ.green }} />
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Term summary</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Spending summary by academic term.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <TextField select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)} fullWidth>
                          {TERMS.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} ({t.start} to {t.end})
                            </MenuItem>
                          ))}
                        </TextField>

                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              {termSummary.term.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total approved spend
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />

                            <Typography variant="h6">
                              {fmtMoney(termSummary.sum, "UGX")}
                              {termSummary.sumUsd > 0 ? ` + ${fmtMoney(termSummary.sumUsd, "USD")}` : ""}
                            </Typography>

                            <Divider sx={{ my: 1.2 }} />

                            <Typography variant="caption" color="text.secondary">
                              By child
                            </Typography>
                            <Stack spacing={0.8} sx={{ mt: 1 }}>
                              {termSummary.byChild.map((r) => (
                                <Stack key={r.child} direction="row" alignItems="center" justifyContent="space-between">
                                  <Typography variant="caption" color="text.secondary">
                                    {r.child}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                    {fmtMoney(r.ugx, "UGX")}
                                    {r.usd > 0 ? ` + ${fmtMoney(r.usd, "USD")}` : ""}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Use Family Defaults to apply term resets and allowance schedules.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
              {snack.msg}
            </Alert>
          </Snackbar>
        </Container>
      </AppShell>
    </ThemeProvider>
  );
}

function SummaryCard({
  mode,
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  mode: "light" | "dark";
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.18) }}>
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(tone, 0.12),
              color: tone,
              border: `1px solid ${alpha(tone, 0.22)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarRow({ mode, label, value, pct }: { mode: "light" | "dark"; label: string; value: string; pct: number }) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            {value}
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.2 }} />
        <Box sx={{ height: 10, borderRadius: 999, bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10), overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, bgcolor: EVZ.green }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: "block" }}>
          {pct}%
        </Typography>
      </CardContent>
    </Card>
  );
}
