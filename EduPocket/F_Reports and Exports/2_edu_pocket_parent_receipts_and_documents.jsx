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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  ArrowForward,
  ContentCopy,
  Download,
  FilePresent,
  Info,
  Print,
  Refresh,
  Search,
  Shield,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Receipts & Documents (Premium)
 * Route: /parent/edupocket/documents
 * Includes:
 * - DocumentSearchBar (type/date/child)
 * - DocumentList
 * - DocumentViewerDrawer
 * - ShareDownloadActions
 * - States: retention note + regeneration flow
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type DocType = "Statement" | "School receipt" | "Funding receipt" | "Confirmation";

type Doc = {
  id: string;
  type: DocType;
  title: string;
  childId?: string;
  amount?: number;
  currency?: "UGX" | "USD";
  createdAt: number;
  retentionDays: number;
  status: "Ready" | "Expired" | "Regenerating";
  meta?: Record<string, string>;
  content: string;
  version: number;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const TYPES: DocType[] = ["Statement", "School receipt", "Funding receipt", "Confirmation"];

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
                <FilePresent fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Receipts and documents
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

function iso(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
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

function fmtMoney(amount?: number, currency?: string) {
  if (amount == null || !currency) return "—";
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

function retentionLeftDays(doc: Doc) {
  const expiresAt = doc.createdAt + doc.retentionDays * 24 * 60 * 60 * 1000;
  const left = Math.floor((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  return left;
}

function seedDocs(): Doc[] {
  const now = Date.now();
  const mk = (p: Partial<Doc>): Doc => ({
    id: p.id || `d_${Math.floor(100000 + Math.random() * 899999)}`,
    type: p.type || "Confirmation",
    title: p.title || "Document",
    childId: p.childId,
    amount: p.amount,
    currency: p.currency,
    createdAt: p.createdAt || now,
    retentionDays: p.retentionDays ?? 90,
    status: p.status || "Ready",
    meta: p.meta,
    content: p.content || "Document content preview.",
    version: p.version ?? 1,
  });

  return [
    mk({
      id: "d1",
      type: "Statement",
      title: "Monthly statement (Jan 2026)",
      childId: "c_1",
      createdAt: now - 12 * 24 * 60 * 60 * 1000,
      retentionDays: 90,
      meta: { period: "2026-01-01 to 2026-01-31", format: "PDF" },
      content: "Statement summary: Approved spend, declines, top vendors, and balances.",
    }),
    mk({
      id: "d2",
      type: "School receipt",
      title: "Term activity fee receipt",
      childId: "c_1",
      amount: 75000,
      currency: "UGX",
      createdAt: now - 7 * 24 * 60 * 60 * 1000,
      retentionDays: 180,
      meta: { school: "Greenhill Academy", ref: "SCH-88421" },
      content: "Receipt: Term activity fee paid. Includes reference and payer details.",
    }),
    mk({
      id: "d3",
      type: "Funding receipt",
      title: "Top up confirmation",
      childId: "c_2",
      amount: 20000,
      currency: "UGX",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      retentionDays: 90,
      meta: { source: "EVzone Pay Wallet", ref: "FND-90121" },
      content: "Funding receipt: Top up completed.",
    }),
    mk({
      id: "d4",
      type: "Confirmation",
      title: "Consent approval confirmation",
      childId: "c_3",
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      retentionDays: 365,
      meta: { action: "Consent approved", actor: "Guardian" },
      content: "Consent was approved. This record is stored for audit purposes.",
    }),
    // Expired (outside retention)
    mk({
      id: "d5",
      type: "Statement",
      title: "Monthly statement (Aug 2025)",
      childId: "c_2",
      createdAt: now - 140 * 24 * 60 * 60 * 1000,
      retentionDays: 90,
      status: "Expired",
      meta: { period: "2025-08-01 to 2025-08-31", format: "PDF" },
      content: "This statement is outside retention and needs regeneration.",
      version: 1,
    }),
  ];
}

function printDoc(title: string, body: string, meta: Record<string, string>) {
  const w = window.open("", "_blank");
  if (!w) return;

  const metaHtml = Object.entries(meta)
    .map(([k, v]) => `<div><b>${k}</b>: ${v}</div>`)
    .join("");

  w.document.write(`
  <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        .meta { color: #374151; font-size: 12px; margin-bottom: 16px; }
        .content { font-size: 13px; line-height: 1.45; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">${metaHtml}</div>
      <div class="content">${body.replaceAll("\n", "<br/>")}</div>
      <script>window.focus();</script>
    </body>
  </html>`);

  w.document.close();
  w.focus();
  w.print();
}

export default function EduPocketDocuments() {
  const { theme, mode, setMode } = useCorporateTheme();
  const [docs, setDocs] = useState<Doc[]>(seedDocs());

  const [q, setQ] = useState("");
  const [type, setType] = useState<DocType | "">("");
  const [childId, setChildId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selected = useMemo(() => docs.find((d) => d.id === openId) ?? null, [docs, openId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return docs
      .filter((d) => (type ? d.type === type : true))
      .filter((d) => (childId ? d.childId === childId : true))
      .filter((d) => {
        if (!from && !to) return true;
        const di = iso(d.createdAt);
        if (from && di < from) return false;
        if (to && di > to) return false;
        return true;
      })
      .filter((d) => {
        if (!query) return true;
        const child = d.childId ? CHILDREN.find((c) => c.id === d.childId)?.name ?? "" : "";
        return `${d.title} ${d.type} ${child} ${d.status}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [docs, q, type, childId, from, to]);

  const retentionNote = useMemo(() => {
    const expired = docs.filter((d) => d.status === "Expired").length;
    return expired > 0 ? `${expired} document(s) are outside retention and need regeneration.` : "All documents are within retention.";
  }, [docs]);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const openDoc = (id: string) => {
    setOpenId(id);
    setDrawerOpen(true);
  };

  const copyLink = async (d: Doc) => {
    const link = `edupocket://documents/${d.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied", "success");
    } catch {
      toast("Could not copy", "warning");
    }
  };

  const downloadJson = (d: Doc) => {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.type.toLowerCase().replaceAll(" ", "_")}_${d.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Downloaded", "success");
  };

  const regenerate = (d: Doc) => {
    setDocs((prev) =>
      prev.map((x) =>
        x.id === d.id
          ? { ...x, status: "Regenerating", content: "Regenerating document...", meta: { ...x.meta, regen: "In progress" } }
          : x
      )
    );

    setTimeout(() => {
      setDocs((prev) =>
        prev.map((x) => {
          if (x.id !== d.id) return x;
          const nextVersion = (x.version ?? 1) + 1;
          return {
            ...x,
            status: "Ready",
            createdAt: Date.now(),
            version: nextVersion,
            meta: { ...x.meta, regen: "Completed", version: String(nextVersion) },
            content: `Regenerated document (v${nextVersion}).\n\nIncludes updated data as of ${new Date().toLocaleString()}.`,
          };
        })
      );
      toast("Document regenerated", "success");
    }, 1200);
  };

  const resetFilters = () => {
    setQ("");
    setType("");
    setChildId("");
    setFrom("");
    setTo("");
    toast("Filters reset", "info");
  };

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
                    <Typography variant="h5">Receipts and documents</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Statements, confirmations and school receipts with retention handling.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={resetFilters}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => toast("Bulk export (demo)", "info")}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Export
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Alert severity={docs.some((d) => d.status === "Expired") ? "warning" : "success"} icon={docs.some((d) => d.status === "Expired") ? <WarningAmber /> : <Info />}>
                  {retentionNote}
                </Alert>

                {/* Search bar */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack spacing={1.2}>
                      <TextField
                        fullWidth
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search documents"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                        <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as any)} sx={{ minWidth: 220 }}>
                          <MenuItem value="">All types</MenuItem>
                          {TYPES.map((t) => (
                            <MenuItem key={t} value={t}>
                              {t}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 240 }}>
                          <MenuItem value="">All children</MenuItem>
                          {CHILDREN.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                        <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />

                        <Box sx={{ flex: 1 }} />

                        <Typography variant="caption" color="text.secondary">
                          {filtered.length} result(s)
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Document list */}
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
                      No documents found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try adjusting filters.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.6}>
                    {filtered.map((d) => {
                      const childName = d.childId ? CHILDREN.find((c) => c.id === d.childId)?.name : "—";
                      const left = retentionLeftDays(d);
                      const isExpired = d.status === "Expired" || left < 0;
                      const tone = isExpired ? EVZ.orange : EVZ.green;

                      return (
                        <Grid item xs={12} md={6} lg={4} key={d.id}>
                          <Card
                            variant="outlined"
                            component={motion.div}
                            whileHover={{ y: -2 }}
                            sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: alpha(tone, 0.18) }}
                          >
                            <CardContent>
                              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                    {d.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {d.type} • {childName}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={d.status}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(tone, 0.12),
                                    color: tone,
                                    border: `1px solid ${alpha(tone, 0.22)}`,
                                  }}
                                />
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                {fmtMoney(d.amount, d.currency)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created {timeAgo(d.createdAt)} • v{d.version}
                              </Typography>

                              <Divider sx={{ my: 1.2 }} />

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip size="small" label={`Retention: ${d.retentionDays}d`} sx={{ fontWeight: 900 }} />
                                <Chip
                                  size="small"
                                  label={isExpired ? "Expired" : `${Math.max(0, left)}d left`}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(isExpired ? EVZ.orange : EVZ.green, 0.10),
                                    color: isExpired ? EVZ.orange : EVZ.green,
                                    border: `1px solid ${alpha(isExpired ? EVZ.orange : EVZ.green, 0.22)}`,
                                  }}
                                />
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Button
                                variant="contained"
                                startIcon={<FilePresent />}
                                onClick={() => openDoc(d.id)}
                                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                fullWidth
                              >
                                View
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Viewer Drawer */}
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
            <Box sx={{ p: 2.2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Document viewer</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Preview, download and share.
                  </Typography>
                </Stack>
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {selected ? (
                <Stack spacing={1.6}>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                        {selected.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selected.type} • {selected.childId ? CHILDREN.find((c) => c.id === selected.childId)?.name : "—"} • v{selected.version}
                      </Typography>

                      <Divider sx={{ my: 1.2 }} />

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={selected.status} sx={{ fontWeight: 900 }} />
                        <Chip size="small" label={`Created: ${iso(selected.createdAt)}`} sx={{ fontWeight: 900 }} />
                        <Chip size="small" label={`Retention: ${selected.retentionDays}d`} sx={{ fontWeight: 900 }} />
                      </Stack>

                      <Divider sx={{ my: 1.2 }} />

                      {selected.meta ? (
                        <Stack spacing={0.6}>
                          {Object.entries(selected.meta).map(([k, v]) => (
                            <Stack key={k} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                              <Typography variant="caption" color="text.secondary">
                                {k}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                {v}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No metadata.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Retention / regeneration state */}
                  {selected.status === "Expired" || retentionLeftDays(selected) < 0 ? (
                    <Alert severity="warning" icon={<WarningAmber />}>
                      This document is outside the retention window. You can regenerate a fresh copy.
                    </Alert>
                  ) : (
                    <Alert severity="info" icon={<Info />}>
                      Retention is active. This document will remain available until it expires.
                    </Alert>
                  )}

                  {selected.status === "Regenerating" ? (
                    <Alert severity="info" icon={<Info />}>
                      Regenerating in progress...
                    </Alert>
                  ) : null}

                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Preview
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {selected.content}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Share / download actions */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => copyLink(selected)}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Copy link
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => downloadJson(selected)}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Download
                    </Button>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Print />}
                      onClick={() =>
                        printDoc(selected.title, selected.content, {
                          Type: selected.type,
                          Child: selected.childId ? CHILDREN.find((c) => c.id === selected.childId)?.name ?? "" : "—",
                          Created: iso(selected.createdAt),
                          Version: String(selected.version),
                        })
                      }
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Print / Save PDF
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => regenerate(selected)}
                      sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                      disabled={selected.status === "Regenerating"}
                    >
                      Regenerate
                    </Button>
                  </Stack>

                  <Alert severity="info" icon={<Info />}>
                    Regeneration creates a new version with updated data and a new retention window.
                  </Alert>
                </Stack>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  Select a document.
                </Alert>
              )}
            </Box>
          </Drawer>

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

function CloseIcon() {
  return <span style={{ display: "inline-block", width: 22, textAlign: "center" }}>×</span>;
}
