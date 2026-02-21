import React, { useEffect, useMemo, useState } from "react";
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
  ArrowForward,
  CheckCircle,
  Close,
  ContentCopy,
  Download,
  Info,
  Lock,
  QrCode2,
  Refresh,
  ReportProblem,
  RotateRight,
  Security,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Child QR / Student ID (Premium)
 * Route: /parent/edupocket/children/:childId/qr
 * Includes:
 * - QRDisplayCard (static/dynamic selector) + copy/share
 * - PrintExportPanel (paper/card/school ID) with Print/Save as PDF
 * - QrSecurityPanel (rotate schedule, disable/reissue)
 * - VerificationPreviewCard (exactly what vendor sees)
 * - LostIdFlowDialog (disable old + create new + log)
 * - States: photo required, QR disabled warning
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
  photoProvided: boolean;
  schoolVerified?: boolean;
};

type QrMode = "Static" | "Dynamic";

type QrEvent = { at: number; actor: string; action: string; note?: string };

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
                <QrCode2 fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket • QR / Student ID
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
              <Tooltip title="Back to child overview">
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
    { key: "QR", label: "QR / Student ID", route: "(this)", icon: <QrCode2 fontSize="small" /> },
    { key: "Activity", label: "Activity", route: "/parent/edupocket/children/:childId/activity", icon: <Security fontSize="small" /> },
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

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildPseudoQrSvg(value: string, size = 260) {
  const grid = 25;
  const seed = hashToInt(value);

  const isFinder = (r: number, c: number) => {
    const inTL = r < 7 && c < 7;
    const inTR = r < 7 && c >= grid - 7;
    const inBL = r >= grid - 7 && c < 7;
    return inTL || inTR || inBL;
  };

  const cell = size / grid;
  const rects: string[] = [];
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
      if (on) rects.push(`<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="${EVZ.ink}"/>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="20" ry="20" fill="white"/>
  <g transform="translate(10,10)">
    <rect x="0" y="0" width="${size - 20}" height="${size - 20}" fill="white"/>
    ${rects.join("\n")}
  </g>
</svg>`;
}

function printQrSheet({ title, child, svg, template }: { title: string; child: Child; svg: string; template: string }) {
  const w = window.open("", "_blank");
  if (!w) return;

  const safeSvg = svg.replaceAll("</script", "</scr" + "ipt");

  w.document.write(`
  <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
        .wrap { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 820px; }
        .card { border: 1px solid #e5e7eb; border-radius: 18px; padding: 18px; }
        .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .meta { color: #374151; font-size: 14px; }
        .small { color: #6b7280; font-size: 12px; }
        .qr { display: flex; justify-content: center; padding: 16px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(3,205,140,0.10); color: #03CD8C; font-weight: 800; font-size: 12px; border: 1px solid rgba(3,205,140,0.25); }
        .footer { font-size: 11px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">
          <div class="row">
            <div>
              <div style="font-size:18px;font-weight:900;">EduPocket Student QR</div>
              <div class="small">Template: ${template}</div>
            </div>
            <div class="badge">For verification + payments</div>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;"/>
          <div class="row">
            <div>
              <div style="font-weight:900;">${child.name}</div>
              <div class="meta">${child.school} • ${child.className}${child.stream ? ` • ${child.stream}` : ""}</div>
              <div class="small">Status: ${child.status}</div>
            </div>
          </div>
          <div class="qr">${safeSvg}</div>
          <div class="footer">
            Tip: Use your browser Print dialog and choose “Save as PDF”.
          </div>
        </div>
      </div>
      <script>window.focus();</script>
    </body>
  </html>`);
  w.document.close();
  w.focus();
  w.print();
}

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", status: "Active", photoProvided: true, schoolVerified: true },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", status: "Active", photoProvided: true },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", status: "Needs consent", photoProvided: false },
];

export default function EduPocketChildQrStudentId() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [qrEnabled, setQrEnabled] = useState(true);
  const [qrMode, setQrMode] = useState<QrMode>("Dynamic");

  const [rotationMinutes, setRotationMinutes] = useState(30);
  const [token, setToken] = useState<string>(() => `tok_${Math.floor(100000 + Math.random() * 899999)}`);

  const [template, setTemplate] = useState<"Paper" | "Card" | "School ID">("School ID");

  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [audit, setAudit] = useState<QrEvent[]>([
    { at: Date.now() - 60 * 60000, actor: "System", action: "QR issued" },
    { at: Date.now() - 8 * 60000, actor: "Guardian", action: "Rotated QR token", note: "Scheduled rotation" },
  ]);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  useEffect(() => {
    // reset per-child demo state
    setQrEnabled(true);
    setQrMode(child.status === "Needs consent" ? "Static" : "Dynamic");
    setRotationMinutes(30);
    setToken(`tok_${Math.floor(100000 + Math.random() * 899999)}`);
    setAudit([
      { at: Date.now() - 90 * 60000, actor: "System", action: "QR issued" },
      { at: Date.now() - 14 * 60000, actor: "Guardian", action: "Viewed QR", note: "Preview" },
    ]);
  }, [childId, child.status]);

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const qrPayload = useMemo(() => {
    const base = `edupocket://student/${child.id}`;
    if (qrMode === "Static") return `${base}?static=1`;
    return `${base}?token=${token}`;
  }, [child.id, qrMode, token]);

  const svg = useMemo(() => buildPseudoQrSvg(qrPayload, 260), [qrPayload]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Could not copy", "warning");
    }
  };

  const rotateNow = () => {
    const newTok = `tok_${Math.floor(100000 + Math.random() * 899999)}`;
    setToken(newTok);
    setAudit((p) => [{ at: Date.now(), actor: "Guardian", action: "Rotated QR token", note: `Manual rotate (${rotationMinutes}m schedule)` }, ...p]);
    toast("QR rotated", "success");
  };

  const disableQr = () => {
    setQrEnabled(false);
    setAudit((p) => [{ at: Date.now(), actor: "Guardian", action: "QR disabled", note: "Temporarily disabled" }, ...p]);
    toast("QR disabled", "warning");
  };

  const enableQr = () => {
    setQrEnabled(true);
    setAudit((p) => [{ at: Date.now(), actor: "Guardian", action: "QR enabled" }, ...p]);
    toast("QR enabled", "success");
  };

  const reissueQr = () => {
    const newTok = `tok_${Math.floor(100000 + Math.random() * 899999)}`;
    setToken(newTok);
    setQrEnabled(true);
    setAudit((p) => [{ at: Date.now(), actor: "Guardian", action: "QR reissued", note: "Old QR invalidated" }, ...p]);
    toast("QR reissued", "success");
  };

  const confirmLostId = () => {
    setLostDialogOpen(false);
    reissueQr();
  };

  const photoWarning = !child.photoProvided;

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
                    <Typography variant="h5">QR / Student ID</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage student QR for scanning, printing and verification.
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
                    <Button
                      variant="outlined"
                      startIcon={<ArrowForward />}
                      onClick={() => alert("Navigate: /parent/edupocket/children/:childId")}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Overview
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <TabsRow active="QR" />

                <Divider />

                <AnimatePresence initial={false}>
                  {photoWarning ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 1.2 }}>
                        Photo required for verification. Vendors must see a student photo before charging.
                      </Alert>
                    </motion.div>
                  ) : null}

                  {!qrEnabled ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert
                        severity="warning"
                        icon={<Lock />}
                        action={
                          <Button size="small" onClick={enableQr}>
                            Enable
                          </Button>
                        }
                        sx={{ mb: 1.2 }}
                      >
                        QR is disabled. Scans will be rejected until re-enabled.
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    {/* QR display */}
                    <Card component={motion.div} whileHover={{ y: -2 }}>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">QR display</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Choose static (print) or dynamic (rotating) QR.
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              icon={<VerifiedUser fontSize="small" />}
                              label={child.schoolVerified ? "School verified" : "Not verified"}
                              sx={{
                                fontWeight: 900,
                                bgcolor: alpha(child.schoolVerified ? EVZ.green : EVZ.orange, 0.10),
                                color: child.schoolVerified ? EVZ.green : EVZ.orange,
                                border: `1px solid ${alpha(child.schoolVerified ? EVZ.green : EVZ.orange, 0.22)}`,
                              }}
                            />
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.6}>
                          <Grid item xs={12} md={5}>
                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  QR mode
                                </Typography>
                                <TextField
                                  select
                                  value={qrMode}
                                  onChange={(e) => setQrMode(e.target.value as any)}
                                  fullWidth
                                  sx={{ mt: 0.8 }}
                                >
                                  <MenuItem value="Static">Static</MenuItem>
                                  <MenuItem value="Dynamic">Dynamic</MenuItem>
                                </TextField>

                                <Divider sx={{ my: 1.2 }} />

                                <Typography variant="caption" color="text.secondary">
                                  Payload
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, wordBreak: "break-all" }}>
                                  {qrPayload}
                                </Typography>

                                <Divider sx={{ my: 1.2 }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button
                                    variant="outlined"
                                    startIcon={<ContentCopy />}
                                    onClick={() => copy(qrPayload)}
                                    sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                    fullWidth
                                  >
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    startIcon={<QrCode2 />}
                                    onClick={() => copy(`Share: ${qrPayload}`)}
                                    sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                    fullWidth
                                  >
                                    Share
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>

                          <Grid item xs={12} md={7}>
                            <Card
                              variant="outlined"
                              sx={{
                                bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72),
                                display: "grid",
                                placeItems: "center",
                                p: 2,
                                minHeight: 350,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 280,
                                  height: 280,
                                  borderRadius: 3,
                                  border: `1px solid ${alpha(EVZ.ink, 0.12)}`,
                                  background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,252,251,1) 100%)",
                                  display: "grid",
                                  placeItems: "center",
                                  p: 1,
                                }}
                              >
                                <Box
                                  sx={{ width: 260, height: 260 }}
                                  dangerouslySetInnerHTML={{ __html: svg }}
                                />
                              </Box>

                              <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                                <Button
                                  variant="contained"
                                  startIcon={<Download />}
                                  onClick={() => printQrSheet({ title: "EduPocket QR", child, svg, template })}
                                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                >
                                  Print / Save as PDF
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<Download />}
                                  onClick={() => downloadText(`edupocket_qr_${child.id}.svg`, svg)}
                                  sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                                >
                                  Download SVG
                                </Button>
                              </Stack>
                            </Card>
                          </Grid>
                        </Grid>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Vendors see the verification preview below before charging.
                        </Alert>
                      </CardContent>
                    </Card>

                    {/* Print & export */}
                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Print & export</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Choose a template for paper, card, or school ID.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                          <TextField select label="Template" value={template} onChange={(e) => setTemplate(e.target.value as any)} sx={{ minWidth: 220 }}>
                            <MenuItem value="Paper">Paper print</MenuItem>
                            <MenuItem value="Card">Card print</MenuItem>
                            <MenuItem value="School ID">School ID integration</MenuItem>
                          </TextField>
                          <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => printQrSheet({ title: "EduPocket QR", child, svg, template })}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                          >
                            Print / Save as PDF
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => downloadText(`edupocket_id_card_${child.id}.txt`, buildIdCardText(child, qrPayload, template))}
                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                          >
                            Export ID data
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Notes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Schools or parents can print the QR on paper/card or embed it into school IDs.
                            </Typography>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={5}>
                    {/* Security panel */}
                    <Card>
                      <CardContent>
                        <Typography variant="h6">QR security</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rotate, disable, or reissue the QR.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                  QR enabled
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Disable if an ID is lost or compromised.
                                </Typography>
                              </Box>
                              <Switch checked={qrEnabled} onChange={(e) => (e.target.checked ? enableQr() : disableQr())} />
                            </Stack>
                          </CardContent>
                        </Card>

                        <Divider sx={{ my: 1.6 }} />

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack spacing={1.2}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                    Rotation schedule
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Applies to Dynamic mode.
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  icon={<RotateRight fontSize="small" />}
                                  label={qrMode === "Dynamic" ? `Every ${rotationMinutes}m` : "Static"}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                    border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                  }}
                                />
                              </Stack>

                              <TextField
                                label="Rotate every (minutes)"
                                type="number"
                                value={rotationMinutes}
                                onChange={(e) => setRotationMinutes(Math.max(5, Math.min(240, parseInt(e.target.value || "30", 10) || 30)))}
                                InputProps={{ inputProps: { min: 5, max: 240 } }}
                              />

                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={<Refresh />}
                                  onClick={rotateNow}
                                  disabled={!qrEnabled || qrMode !== "Dynamic"}
                                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                >
                                  Rotate now
                                </Button>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  startIcon={<ReportProblem />}
                                  onClick={() => setLostDialogOpen(true)}
                                  sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                >
                                  Lost ID
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>

                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1}>
                          <Button
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={disableQr}
                            disabled={!qrEnabled}
                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                            fullWidth
                          >
                            Disable QR
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={reissueQr}
                            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                            fullWidth
                          >
                            Reissue QR
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Audit log
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          QR lifecycle events for investigations.
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />

                        <Stack spacing={1}>
                          {audit.slice(0, 6).map((e, idx) => (
                            <Card key={idx} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2.4,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: alpha(EVZ.green, 0.12),
                                        color: EVZ.green,
                                        border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                      }}
                                    >
                                      <Security fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        {e.action}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {e.actor}{e.note ? ` • ${e.note}` : ""}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Chip
                                    size="small"
                                    label={timeAgo(e.at)}
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                                      border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                                    }}
                                  />
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Verification preview */}
                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Typography variant="h6">Verification preview</Typography>
                        <Typography variant="body2" color="text.secondary">
                          This is exactly what a vendor sees before charging.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Card
                          variant="outlined"
                          component={motion.div}
                          whileHover={{ y: -2 }}
                          sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                        >
                          <CardContent>
                            <Stack direction="row" spacing={1.4} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 64,
                                  height: 64,
                                  bgcolor: alpha(EVZ.green, 0.18),
                                  color: EVZ.green,
                                  border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                                  fontWeight: 950,
                                }}
                              >
                                {child.name.split(" ")[0][0]}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 950 }} noWrap>
                                  {child.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {child.school}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {child.className}{child.stream ? ` • ${child.stream}` : ""}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={child.status}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha(child.status === "Active" ? EVZ.green : EVZ.orange, 0.12),
                                  color: child.status === "Active" ? EVZ.green : EVZ.orange,
                                  border: `1px solid ${alpha(child.status === "Active" ? EVZ.green : EVZ.orange, 0.22)}`,
                                }}
                              />
                            </Stack>

                            <Divider sx={{ my: 1.2 }} />

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip
                                size="small"
                                icon={<VerifiedUser fontSize="small" />}
                                label={child.photoProvided ? "Photo match required" : "Photo missing"}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha(child.photoProvided ? EVZ.green : EVZ.orange, 0.10),
                                  color: child.photoProvided ? EVZ.green : EVZ.orange,
                                  border: `1px solid ${alpha(child.photoProvided ? EVZ.green : EVZ.orange, 0.22)}`,
                                }}
                              />
                              <Chip
                                size="small"
                                icon={<Security fontSize="small" />}
                                label={qrEnabled ? "QR valid" : "QR disabled"}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha(qrEnabled ? EVZ.green : EVZ.orange, 0.10),
                                  color: qrEnabled ? EVZ.green : EVZ.orange,
                                  border: `1px solid ${alpha(qrEnabled ? EVZ.green : EVZ.orange, 0.22)}`,
                                }}
                              />
                            </Stack>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Lost ID dialog */}
      <Dialog open={lostDialogOpen} onClose={() => setLostDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Lost ID / QR compromised</Typography>
              <Typography variant="body2" color="text.secondary">
                Disable the old QR and issue a new one.
              </Typography>
            </Stack>
            <IconButton onClick={() => setLostDialogOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1 }}>
            This action invalidates the old QR permanently and creates a new QR.
          </Alert>
          <Divider sx={{ my: 1.2 }} />
          <TextField
            label="Reason (optional)"
            placeholder="e.g., ID lost at school"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLostDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={confirmLostId}
            sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
          >
            Reissue QR
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3400} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function buildIdCardText(child: Child, payload: string, template: string) {
  return [
    "EduPocket Student ID Export",
    `Template: ${template}`,
    "",
    `Name: ${child.name}`,
    `School: ${child.school}`,
    `Class: ${child.className}`,
    `Stream: ${child.stream ?? ""}`,
    `Status: ${child.status}`,
    "",
    `QR Payload: ${payload}`,
  ].join("\n");
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
