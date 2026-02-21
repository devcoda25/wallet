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
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  Add,
  ArrowForward,
  Badge,
  CheckCircle,
  Close,
  ContentCopy,
  Download,
  Gavel,
  Help,
  Info,
  Lock,
  Phone,
  QrCode2,
  ReportProblem,
  Search,
  Security,
  Shield,
  SupportAgent,
  Timeline,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent — Help & Support (Premium)
 * Route: /parent/edupocket/support
 * Includes:
 * - HelpCenterHome (FAQ tiles)
 * - ContactSupportForm
 * - FraudReportWizard
 * - DisputeResolutionCenter (cases + timeline + attachments)
 * - LostIdHelpFlow (reissue QR guidance)
 * - States: ticket created confirmation + follow-up actions
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type HelpArea = "Help Center" | "Contact Support" | "Fraud Report" | "Disputes" | "Lost ID";

type FaqTile = {
  id: string;
  title: string;
  desc: string;
  area: string;
  faqs: Array<{ q: string; a: string }>;
};

type Ticket = {
  id: string;
  type: "Support" | "Fraud" | "Dispute";
  subject: string;
  childId?: string;
  status: "Created" | "In review" | "Resolved";
  createdAt: number;
};

type Case = {
  id: string;
  type: "Dispute" | "Fraud";
  title: string;
  status: "Open" | "Under review" | "Resolved";
  childId?: string;
  createdAt: number;
  timeline: Array<{ at: number; who: string; text: string }>;
  attachments: string[];
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const HELP_TILES: FaqTile[] = [
  {
    id: "h1",
    title: "Approvals and rules",
    desc: "How approvals work and how to reduce friction.",
    area: "Controls",
    faqs: [
      { q: "Why did a transaction go to approvals?", a: "It can be due to a threshold, a restricted category, a new vendor, or spending outside allowed hours." },
      { q: "How can I reduce approvals?", a: "Use trusted vendor auto-approvals and set sensible thresholds." },
      { q: "Can a co-guardian approve?", a: "Yes. Configure roles and approval routing in Household." },
    ],
  },
  {
    id: "h2",
    title: "QR and student verification",
    desc: "Scanning, printing, and lost ID handling.",
    area: "QR / ID",
    faqs: [
      { q: "What does a vendor see when scanning?", a: "A verification preview: student photo, name, school/class, and status, based on your privacy settings." },
      { q: "Can I print the QR on an ID card?", a: "Yes. Use the QR page to export templates for paper, card, or school ID integration." },
      { q: "What if the ID is lost?", a: "Disable and reissue the QR, then print a new ID." },
    ],
  },
  {
    id: "h3",
    title: "Funding and allowances",
    desc: "Top ups, schedules, and verification.",
    area: "Funding",
    faqs: [
      { q: "Why is my funding source blocked?", a: "It may require verification before use. Verify via OTP or linkage." },
      { q: "How do I schedule allowance?", a: "Use the Funding page to set daily/weekly/monthly/term schedules." },
      { q: "Can I split a top up across children?", a: "Yes. Use the split top up modal in Funding." },
    ],
  },
  {
    id: "h4",
    title: "Security and privacy",
    desc: "Devices, 2FA, and data sharing.",
    area: "Security",
    faqs: [
      { q: "How do I remove a device?", a: "Open Security & Privacy, locate the device, and remove it. Re-auth is required." },
      { q: "Can I limit what vendors see?", a: "Yes. Data sharing controls define what vendors/school/support can access." },
      { q: "Where are consent logs?", a: "Security & Privacy includes consent logs with export." },
    ],
  },
  {
    id: "h5",
    title: "Disputes and fraud",
    desc: "Report issues and track timelines.",
    area: "Cases",
    faqs: [
      { q: "How do I dispute a transaction?", a: "Open Disputes, select the case, add details and attachments, then submit." },
      { q: "How do I report a suspicious vendor?", a: "Use Fraud Report wizard and attach evidence." },
      { q: "Will I get a case ID?", a: "Yes. Ticket IDs are created and can be tracked." },
    ],
  },
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
                <SupportAgent fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Help and support
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to EduPocket">
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

function makeId(prefix: string) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`;
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

export default function EduPocketHelpSupport() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [tab, setTab] = useState<HelpArea>("Help Center");

  // Help center
  const [helpSearch, setHelpSearch] = useState("");
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [activeTileId, setActiveTileId] = useState<string | null>(null);

  const activeTile = useMemo(() => HELP_TILES.find((t) => t.id === activeTileId) ?? null, [activeTileId]);

  // Support ticket
  const [supportChildId, setSupportChildId] = useState<string>("");
  const [supportTopic, setSupportTopic] = useState("Approvals");
  const [supportPriority, setSupportPriority] = useState("Normal");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  // Fraud wizard
  const [fraudOpen, setFraudOpen] = useState(false);
  const [fraudStep, setFraudStep] = useState(0);
  const [fraudType, setFraudType] = useState("Suspicious vendor");
  const [fraudDetails, setFraudDetails] = useState("");
  const [fraudEvidence, setFraudEvidence] = useState<File[]>([]);

  // Cases
  const [cases, setCases] = useState<Case[]>([
    {
      id: "CASE-11821",
      type: "Dispute",
      title: "Dispute: Campus Bookshop charge",
      status: "Open",
      childId: "c_2",
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      timeline: [
        { at: Date.now() - 3 * 24 * 60 * 60 * 1000, who: "Parent", text: "Case created" },
        { at: Date.now() - 2 * 24 * 60 * 60 * 1000, who: "Support", text: "Requested receipt and vendor notes" },
      ],
      attachments: ["receipt.png"],
    },
    {
      id: "CASE-11902",
      type: "Fraud",
      title: "Suspicious sign-in attempt",
      status: "Under review",
      createdAt: Date.now() - 18 * 60 * 60 * 1000,
      timeline: [
        { at: Date.now() - 18 * 60 * 60 * 1000, who: "System", text: "Risky login attempt blocked" },
        { at: Date.now() - 17 * 60 * 60 * 1000, who: "Parent", text: "Fraud report submitted" },
      ],
      attachments: [],
    },
  ]);
  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const activeCase = useMemo(() => cases.find((c) => c.id === activeCaseId) ?? null, [cases, activeCaseId]);

  const [caseUpdate, setCaseUpdate] = useState("");

  // Lost ID
  const [lostChildId, setLostChildId] = useState("c_1");
  const [lostStep, setLostStep] = useState(0);

  // Ticket confirmation dialog
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);

  // Snack
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const helpTilesFiltered = useMemo(() => {
    const q = helpSearch.trim().toLowerCase();
    if (!q) return HELP_TILES;
    return HELP_TILES.filter((t) => `${t.title} ${t.desc} ${t.area} ${t.faqs.map((f) => f.q).join(" ")}`.toLowerCase().includes(q));
  }, [helpSearch]);

  const openTile = (id: string) => {
    setActiveTileId(id);
    setFaqDrawerOpen(true);
  };

  const submitSupportTicket = () => {
    if (!supportSubject.trim() || !supportMessage.trim()) return toast("Subject and message are required", "warning");

    const t: Ticket = {
      id: makeId("TKT"),
      type: "Support",
      subject: supportSubject.trim(),
      childId: supportChildId || undefined,
      status: "Created",
      createdAt: Date.now(),
    };

    setLastTicket(t);
    setTicketDialogOpen(true);
    toast("Ticket created", "success");

    // reset form
    setSupportSubject("");
    setSupportMessage("");
  };

  const submitFraud = () => {
    if (!fraudDetails.trim()) return toast("Add details", "warning");

    const t: Ticket = {
      id: makeId("FRD"),
      type: "Fraud",
      subject: fraudType,
      status: "Created",
      createdAt: Date.now(),
    };

    setLastTicket(t);
    setTicketDialogOpen(true);

    setCases((p) => [
      {
        id: makeId("CASE"),
        type: "Fraud",
        title: `Fraud: ${fraudType}`,
        status: "Open",
        createdAt: Date.now(),
        timeline: [
          { at: Date.now(), who: "Parent", text: "Fraud report submitted" },
          { at: Date.now(), who: "System", text: includeDiagnostics ? "Diagnostic pack attached" : "No diagnostics attached" },
        ],
        attachments: fraudEvidence.map((f) => f.name),
      },
      ...p,
    ]);

    setFraudOpen(false);
    setFraudStep(0);
    setFraudType("Suspicious vendor");
    setFraudDetails("");
    setFraudEvidence([]);

    toast("Fraud report submitted", "success");
  };

  const openCase = (id: string) => {
    setActiveCaseId(id);
    setCaseDrawerOpen(true);
  };

  const addCaseUpdate = () => {
    if (!activeCase) return;
    if (!caseUpdate.trim()) return toast("Write an update", "warning");

    setCases((p) =>
      p.map((c) =>
        c.id === activeCase.id
          ? { ...c, timeline: [{ at: Date.now(), who: "Parent", text: caseUpdate.trim() }, ...c.timeline] }
          : c
      )
    );

    setCaseUpdate("");
    toast("Update posted", "success");
  };

  const startLostId = () => {
    setLostStep(0);
    toast("Follow the steps to reissue QR", "info");
  };

  const finishLostId = () => {
    const t: Ticket = {
      id: makeId("QR"),
      type: "Support",
      subject: "Lost ID / QR reissue",
      childId: lostChildId,
      status: "Created",
      createdAt: Date.now(),
    };

    setLastTicket(t);
    setTicketDialogOpen(true);
    toast("QR reissue completed", "success");
  };

  const exportDiagnosticPack = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: "Demo diagnostic pack: includes device + consent + incident summaries.",
      suggestedNext: ["Export consent logs", "Export incident logs", "Attach relevant receipt"],
    };
    downloadText(`edupocket_diagnostic_pack_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
    toast("Diagnostic pack downloaded", "success");
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
                    <Typography variant="h5">Help and support</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get answers fast, contact support, report fraud, and track disputes.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportDiagnosticPack}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Diagnostic pack
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<ReportProblem />}
                      onClick={() => {
                        setFraudOpen(true);
                        setFraudStep(0);
                      }}
                      sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
                    >
                      Report fraud
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

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
                  {(["Help Center", "Contact Support", "Fraud Report", "Disputes", "Lost ID"] as HelpArea[]).map((t) => (
                    <Tab key={t} label={t} value={t} />
                  ))}
                </Tabs>

                <Divider />

                {/* Help Center */}
                {tab === "Help Center" ? (
                  <Stack spacing={1.6}>
                    <TextField
                      value={helpSearch}
                      onChange={(e) => setHelpSearch(e.target.value)}
                      placeholder="Search FAQs"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Grid container spacing={1.6}>
                      {helpTilesFiltered.map((t) => (
                        <Grid item xs={12} md={6} lg={4} key={t.id}>
                          <Card
                            variant="outlined"
                            component={motion.div}
                            whileHover={{ y: -2 }}
                            sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                          >
                            <CardContent>
                              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }} noWrap>
                                    {t.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {t.desc}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={t.area}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(EVZ.green, 0.10),
                                    color: EVZ.green,
                                    border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                                  }}
                                />
                              </Stack>

                              <Divider sx={{ my: 1.2 }} />

                              <Button
                                variant="contained"
                                startIcon={<Help />}
                                onClick={() => openTile(t.id)}
                                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                fullWidth
                              >
                                Open
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Alert severity="info" icon={<Info />}>
                      If you still need help, use “Contact Support” or “Report fraud”.
                    </Alert>
                  </Stack>
                ) : null}

                {/* Contact Support */}
                {tab === "Contact Support" ? (
                  <Grid container spacing={2.2}>
                    <Grid item xs={12} lg={7}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">Contact support</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Submit a ticket with context. You’ll get a ticket ID instantly.
                          </Typography>
                          <Divider sx={{ my: 1.6 }} />

                          <Stack spacing={1.2}>
                            <TextField select label="Child (optional)" value={supportChildId} onChange={(e) => setSupportChildId(e.target.value)}>
                              <MenuItem value="">None</MenuItem>
                              {CHILDREN.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                  {c.name}
                                </MenuItem>
                              ))}
                            </TextField>

                            <Grid container spacing={1.2}>
                              <Grid item xs={12} md={6}>
                                <TextField select label="Topic" value={supportTopic} onChange={(e) => setSupportTopic(e.target.value)} fullWidth>
                                  {[
                                    "Approvals",
                                    "Funding",
                                    "QR / Student ID",
                                    "Vendor spending",
                                    "School payments",
                                    "Security",
                                    "Other",
                                  ].map((t) => (
                                    <MenuItem key={t} value={t}>
                                      {t}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField select label="Priority" value={supportPriority} onChange={(e) => setSupportPriority(e.target.value)} fullWidth>
                                  {[
                                    "Low",
                                    "Normal",
                                    "High",
                                    "Urgent",
                                  ].map((p) => (
                                    <MenuItem key={p} value={p}>
                                      {p}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            </Grid>

                            <TextField label="Subject" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} fullWidth />
                            <TextField
                              label="Message"
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              multiline
                              minRows={5}
                              placeholder="Describe what happened. Include vendor, time, and any decline reason."
                              fullWidth
                            />

                            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                      Include diagnostics
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Attaches a safe support pack (logs and metadata).
                                    </Typography>
                                  </Box>
                                  <Chip
                                    size="small"
                                    label={includeDiagnostics ? "On" : "Off"}
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: alpha(includeDiagnostics ? EVZ.green : EVZ.orange, 0.10),
                                      color: includeDiagnostics ? EVZ.green : EVZ.orange,
                                      border: `1px solid ${alpha(includeDiagnostics ? EVZ.green : EVZ.orange, 0.22)}`,
                                    }}
                                    onClick={() => setIncludeDiagnostics((v) => !v)}
                                  />
                                </Stack>
                              </CardContent>
                            </Card>

                            <Button
                              variant="contained"
                              startIcon={<SupportAgent />}
                              onClick={submitSupportTicket}
                              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            >
                              Create ticket
                            </Button>
                          </Stack>

                          <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                            Tip: Export incident logs from Notifications Center to strengthen investigations.
                          </Alert>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">Quick links</Typography>
                          <Typography variant="body2" color="text.secondary">Common support destinations.</Typography>
                          <Divider sx={{ my: 1.6 }} />

                          <Stack spacing={1.2}>
                            <QuickLink mode={mode} icon={<Security fontSize="small" />} title="Security and privacy" desc="Devices, 2FA, consent logs." onClick={() => toast("Navigate: /parent/edupocket/settings/security", "info")} />
                            <QuickLink mode={mode} icon={<QrCode2 fontSize="small" />} title="QR / Student ID" desc="Print, rotate, reissue." onClick={() => toast("Navigate: /parent/edupocket/children/:childId/qr", "info")} />
                            <QuickLink mode={mode} icon={<Gavel fontSize="small" />} title="Approvals" desc="Pending approvals and rules." onClick={() => toast("Navigate: /parent/edupocket/children/:childId/approvals", "info")} />
                            <QuickLink mode={mode} icon={<WarningAmber fontSize="small" />} title="Fraud report" desc="Report suspicious activity." onClick={() => setFraudOpen(true)} />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                ) : null}

                {/* Fraud Report */}
                {tab === "Fraud Report" ? (
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Fraud report</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start a fraud report with evidence and tracking.
                      </Typography>
                      <Divider sx={{ my: 1.6 }} />

                      <Button
                        variant="contained"
                        startIcon={<ReportProblem />}
                        onClick={() => {
                          setFraudOpen(true);
                          setFraudStep(0);
                        }}
                        sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
                      >
                        Open wizard
                      </Button>

                      <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                        Fraud reports create a case and can trigger emergency locks.
                      </Alert>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Disputes */}
                {tab === "Disputes" ? (
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Dispute resolution center</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track open cases, timelines and attachments.
                      </Typography>
                      <Divider sx={{ my: 1.6 }} />

                      <Grid container spacing={1.6}>
                        {cases.map((c) => {
                          const tone = c.status === "Resolved" ? EVZ.green : c.status === "Under review" ? alpha(EVZ.ink, 0.7) : EVZ.orange;
                          const childName = c.childId ? CHILDREN.find((x) => x.id === c.childId)?.name : "—";
                          return (
                            <Grid item xs={12} md={6} key={c.id}>
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
                                        {c.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" noWrap>
                                        {c.type} • {childName} • {timeAgo(c.createdAt)}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      size="small"
                                      label={c.status}
                                      sx={{
                                        fontWeight: 900,
                                        bgcolor: alpha(tone, 0.12),
                                        color: tone,
                                        border: `1px solid ${alpha(tone, 0.22)}`,
                                      }}
                                    />
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" icon={<Timeline fontSize="small" />} label={`${c.timeline.length} updates`} sx={{ fontWeight: 900 }} />
                                    <Chip size="small" icon={<Download fontSize="small" />} label={`${c.attachments.length} attachments`} sx={{ fontWeight: 900 }} />
                                  </Stack>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Button
                                    variant="contained"
                                    startIcon={<Info />}
                                    onClick={() => openCase(c.id)}
                                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                    fullWidth
                                  >
                                    Open case
                                  </Button>

                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                    Case ID: {c.id}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>

                      <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                        Add new updates and attachments inside the case drawer.
                      </Alert>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Lost ID */}
                {tab === "Lost ID" ? (
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Lost ID help flow</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reissue student QR and print a new card safely.
                      </Typography>
                      <Divider sx={{ my: 1.6 }} />

                      <Stack spacing={1.4}>
                        <TextField select label="Child" value={lostChildId} onChange={(e) => setLostChildId(e.target.value)}>
                          {CHILDREN.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name} • {c.school}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Stepper activeStep={lostStep} alternativeLabel>
                          {["Confirm loss", "Disable old QR", "Issue new QR", "Print / share"].map((s) => (
                            <Step key={s}>
                              <StepLabel>{s}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>

                        <Alert severity="info" icon={<Info />}>
                          Schools or parents can print QR codes on paper/card or integrate into school IDs.
                        </Alert>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={() => {
                              startLostId();
                              setLostStep(0);
                            }}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                          >
                            Start
                          </Button>

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={() => {
                              if (lostStep < 3) setLostStep((s) => s + 1);
                              else finishLostId();
                            }}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                          >
                            {lostStep < 3 ? "Next" : "Finish"}
                          </Button>
                        </Stack>

                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Guidance
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            <Typography variant="body2">1) Disable old QR to prevent misuse.</Typography>
                            <Typography variant="body2">2) Reissue a new QR and log the action.</Typography>
                            <Typography variant="body2">3) Print a new card or share the QR securely.</Typography>
                            <Typography variant="body2">4) Consider enabling biometric to show QR on student device.</Typography>
                          </CardContent>
                        </Card>

                        <Alert severity="warning" icon={<WarningAmber />}>
                          If you suspect fraud, use the Fraud Report wizard and activate an emergency lock.
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          {/* FAQ Drawer */}
          <Drawer anchor="right" open={faqDrawerOpen} onClose={() => setFaqDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}>
            <Box sx={{ p: 2.2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Help Center</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTile?.title ?? ""}
                  </Typography>
                </Stack>
                <IconButton onClick={() => setFaqDrawerOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {activeTile ? (
                <Stack spacing={1.2}>
                  {activeTile.faqs.map((f, idx) => (
                    <Card key={idx} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          {f.q}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                          {f.a}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}

                  <Divider sx={{ my: 1.2 }} />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SupportAgent />}
                      onClick={() => {
                        setFaqDrawerOpen(false);
                        setTab("Contact Support");
                        toast("Switched to Contact Support", "info");
                      }}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Contact support
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportDiagnosticPack}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Diagnostic pack
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  Select a help topic.
                </Alert>
              )}
            </Box>
          </Drawer>

          {/* Fraud Wizard */}
          <Dialog open={fraudOpen} onClose={() => setFraudOpen(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Fraud report wizard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Report suspicious activity with evidence.
                  </Typography>
                </Stack>
                <IconButton onClick={() => setFraudOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stepper activeStep={fraudStep} alternativeLabel>
                  {["Type", "Details", "Evidence", "Review"].map((s) => (
                    <Step key={s}>
                      <StepLabel>{s}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {fraudStep === 0 ? (
                  <Stack spacing={1.2}>
                    <TextField select label="Fraud type" value={fraudType} onChange={(e) => setFraudType(e.target.value)}>
                      {["Suspicious vendor", "Unauthorized login", "Stolen student ID", "Duplicate charge", "Other"].map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Alert severity="info" icon={<Info />}>
                      For stolen ID, also use the Lost ID flow to reissue QR.
                    </Alert>
                  </Stack>
                ) : null}

                {fraudStep === 1 ? (
                  <Stack spacing={1.2}>
                    <TextField
                      label="Details"
                      value={fraudDetails}
                      onChange={(e) => setFraudDetails(e.target.value)}
                      multiline
                      minRows={5}
                      placeholder="Add vendor name, time, amount, what happened, and what you want us to do."
                    />
                    <Alert severity="info" icon={<Info />}>
                      Include as much context as possible.
                    </Alert>
                  </Stack>
                ) : null}

                {fraudStep === 2 ? (
                  <Stack spacing={1.2}>
                    <Button variant="outlined" component="label" startIcon={<Add />} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}>
                      Attach evidence
                      <input
                        hidden
                        type="file"
                        multiple
                        onChange={(e) => setFraudEvidence(Array.from(e.target.files ?? []))}
                      />
                    </Button>

                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Attachments
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />
                        {fraudEvidence.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            No files attached.
                          </Typography>
                        ) : (
                          <Stack spacing={0.6}>
                            {fraudEvidence.map((f, idx) => (
                              <Typography key={idx} variant="caption" sx={{ fontWeight: 900 }}>
                                • {f.name}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>

                    <Alert severity="info" icon={<Info />}>
                      Evidence improves resolution speed.
                    </Alert>
                  </Stack>
                ) : null}

                {fraudStep === 3 ? (
                  <Stack spacing={1.2}>
                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Review
                        </Typography>
                        <Divider sx={{ my: 1.2 }} />
                        <Typography variant="body2"><b>Type:</b> {fraudType}</Typography>
                        <Typography variant="body2"><b>Evidence:</b> {fraudEvidence.length} file(s)</Typography>
                        <Divider sx={{ my: 1.2 }} />
                        <Typography variant="caption" color="text.secondary">Details</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{fraudDetails || "—"}</Typography>
                      </CardContent>
                    </Card>

                    <Alert severity="warning" icon={<WarningAmber />}>
                      Fraud reports are logged and may trigger protective actions.
                    </Alert>
                  </Stack>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFraudOpen(false)}>Close</Button>
              <Button onClick={() => setFraudStep((s) => Math.max(0, s - 1))} disabled={fraudStep === 0}>
                Back
              </Button>
              {fraudStep < 3 ? (
                <Button
                  variant="contained"
                  onClick={() => setFraudStep((s) => Math.min(3, s + 1))}
                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<ReportProblem />}
                  onClick={submitFraud}
                  sx={{ bgcolor: EVZ.orange, ":hover": { bgcolor: alpha(EVZ.orange, 0.92) } }}
                >
                  Submit
                </Button>
              )}
            </DialogActions>
          </Dialog>

          {/* Case Drawer */}
          <Drawer anchor="right" open={caseDrawerOpen} onClose={() => setCaseDrawerOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 620 } } }}>
            <Box sx={{ p: 2.2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Case</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeCase?.id ?? ""}
                  </Typography>
                </Stack>
                <IconButton onClick={() => setCaseDrawerOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {activeCase ? (
                <Stack spacing={1.6}>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                        {activeCase.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activeCase.type} • {activeCase.status} • Created {timeAgo(activeCase.createdAt)}
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" icon={<Timeline fontSize="small" />} label={`${activeCase.timeline.length} timeline items`} sx={{ fontWeight: 900 }} />
                        <Chip size="small" icon={<Download fontSize="small" />} label={`${activeCase.attachments.length} attachment(s)`} sx={{ fontWeight: 900 }} />
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Timeline
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <Stack spacing={1}>
                        {activeCase.timeline
                          .slice()
                          .sort((a, b) => b.at - a.at)
                          .map((t, idx) => (
                            <Card key={idx} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  {timeAgo(t.at)} • {t.who}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                  {t.text}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Add update
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <TextField
                        value={caseUpdate}
                        onChange={(e) => setCaseUpdate(e.target.value)}
                        placeholder="Add an update for the case"
                        multiline
                        minRows={3}
                        fullWidth
                      />
                      <Divider sx={{ my: 1.2 }} />
                      <Button
                        variant="contained"
                        startIcon={<Timeline />}
                        onClick={addCaseUpdate}
                        sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                        fullWidth
                      >
                        Post update
                      </Button>
                    </CardContent>
                  </Card>

                  <Alert severity="info" icon={<Info />}>
                    Attachments can be added via the Fraud wizard or by contacting support.
                  </Alert>
                </Stack>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  Select a case.
                </Alert>
              )}
            </Box>
          </Drawer>

          {/* Ticket created confirmation */}
          <Dialog open={ticketDialogOpen} onClose={() => setTicketDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.2}>
                  <Typography variant="h6">Ticket created</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your request has been submitted.
                  </Typography>
                </Stack>
                <IconButton onClick={() => setTicketDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {lastTicket ? (
                <Stack spacing={1.2} sx={{ mt: 1 }}>
                  <Alert severity="success" icon={<CheckCircle />}>
                    Ticket ID: <b>{lastTicket.id}</b>
                  </Alert>
                  <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Next steps
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />
                      <Typography variant="body2">1) Keep the ticket ID for tracking.</Typography>
                      <Typography variant="body2">2) Export incident logs if needed.</Typography>
                      <Typography variant="body2">3) Attach receipts/documents for faster resolution.</Typography>
                    </CardContent>
                  </Card>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(lastTicket.id);
                          toast("Ticket ID copied", "success");
                        } catch {
                          toast("Could not copy", "warning");
                        }
                      }}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Copy ID
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Download />}
                      onClick={exportDiagnosticPack}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Diagnostic pack
                    </Button>
                  </Stack>

                  <Button
                    variant="outlined"
                    startIcon={<Info />}
                    onClick={() => toast("Navigate: /parent/edupocket/documents", "info")}
                    sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                  >
                    Attach documents
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  No ticket.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTicketDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snack.open} autoHideDuration={3800} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
              {snack.msg}
            </Alert>
          </Snackbar>
        </Container>
      </AppShell>
    </ThemeProvider>
  );
}

function QuickLink({
  mode,
  icon,
  title,
  desc,
  onClick,
}: {
  mode: "light" | "dark";
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
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
                bgcolor: alpha(EVZ.green, 0.12),
                color: EVZ.green,
                border: `1px solid ${alpha(EVZ.green, 0.22)}`,
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
          <Button onClick={onClick}>Open</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
