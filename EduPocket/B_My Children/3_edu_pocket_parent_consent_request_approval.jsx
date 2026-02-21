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
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Close,
  ErrorOutline,
  Fingerprint,
  Info,
  Lock,
  PhoneIphone,
  QrCode2,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Consent Request Approval (Premium)
 * Route: /parent/edupocket/consent/:requestId
 * Includes:
 * - Consent summary (child details + photo request + baseline limits preview)
 * - Decision panel (approve / deny / request correction + optional note)
 * - ReAuth gate (PIN / biometric / OTP simulation)
 * - Consent audit trail (device, time, guardian identity)
 * - States: expired request, mismatch with school roster
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type ConsentStatus = "Pending" | "Approved" | "Denied" | "Correction requested";

type ConsentRequest = {
  id: string;
  status: ConsentStatus;
  createdAt: number;
  expiresAt: number;
  child: {
    name: string;
    dob: string;
    school: string;
    className: string;
    stream?: string;
    photoRequested: boolean;
    photoProvided: boolean;
  };
  baselineLimits: {
    perTxn: number;
    daily: number;
    weekly: number;
    categoryCaps: Array<{ category: string; cap: number }>;
    schedule: string;
    approvedVendorsOnly: boolean;
  };
  flags?: {
    rosterMismatch?: boolean;
  };
  audit: Array<{ at: number; actor: string; device: string; action: string }>;
};

type ReAuthMode = "PIN" | "Biometric" | "OTP";

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
                  Consent Request
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
          pb: 7,
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

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

const REQUESTS: Record<string, ConsentRequest> = {
  "REQ-1042": {
    id: "REQ-1042",
    status: "Pending",
    createdAt: Date.now() - 45 * 60000,
    expiresAt: Date.now() + 4 * 60 * 60000,
    child: {
      name: "Maya R.",
      dob: "2015-03-18",
      school: "Starlight School",
      className: "P3",
      stream: "",
      photoRequested: true,
      photoProvided: false,
    },
    baselineLimits: {
      perTxn: 15000,
      daily: 30000,
      weekly: 120000,
      categoryCaps: [
        { category: "Food", cap: 15000 },
        { category: "Books", cap: 25000 },
        { category: "Transport", cap: 15000 },
      ],
      schedule: "Spend allowed 07:00-18:30 on school days",
      approvedVendorsOnly: true,
    },
    audit: [
      { at: Date.now() - 45 * 60000, actor: "Child", device: "Android", action: "Submitted sign-up" },
      { at: Date.now() - 44 * 60000, actor: "System", device: "Server", action: "Consent request created" },
    ],
  },
  expired: {
    id: "expired",
    status: "Pending",
    createdAt: Date.now() - 3 * 24 * 60 * 60000,
    expiresAt: Date.now() - 2 * 24 * 60 * 60000,
    child: {
      name: "Daniel K.",
      dob: "2010-09-02",
      school: "Greenhill Academy",
      className: "S2",
      stream: "West",
      photoRequested: true,
      photoProvided: true,
    },
    baselineLimits: {
      perTxn: 30000,
      daily: 50000,
      weekly: 200000,
      categoryCaps: [
        { category: "Food", cap: 20000 },
        { category: "Books", cap: 40000 },
      ],
      schedule: "Spend allowed 06:30-19:00 daily",
      approvedVendorsOnly: false,
    },
    audit: [
      { at: Date.now() - 3 * 24 * 60 * 60000, actor: "Child", device: "iPhone", action: "Submitted sign-up" },
      { at: Date.now() - 3 * 24 * 60 * 60000 + 3 * 60000, actor: "System", device: "Server", action: "Consent request created" },
    ],
  },
  mismatch: {
    id: "mismatch",
    status: "Pending",
    createdAt: Date.now() - 70 * 60000,
    expiresAt: Date.now() + 2 * 60 * 60000,
    child: {
      name: "Amina N.",
      dob: "2012-01-15",
      school: "Greenhill Academy",
      className: "P6",
      stream: "Blue",
      photoRequested: true,
      photoProvided: true,
    },
    baselineLimits: {
      perTxn: 20000,
      daily: 40000,
      weekly: 150000,
      categoryCaps: [
        { category: "Food", cap: 15000 },
        { category: "Books", cap: 35000 },
      ],
      schedule: "Spend allowed 07:00-18:00 school days",
      approvedVendorsOnly: true,
    },
    flags: { rosterMismatch: true },
    audit: [
      { at: Date.now() - 70 * 60000, actor: "Child", device: "Android", action: "Submitted sign-up" },
      { at: Date.now() - 69 * 60000, actor: "System", device: "Server", action: "Roster mismatch detected" },
      { at: Date.now() - 68 * 60000, actor: "System", device: "Server", action: "Consent request created" },
    ],
  },
};

export default function EduPocketConsentApproval() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [requestId, setRequestId] = useState<string>("REQ-1042");
  const [data, setData] = useState<ConsentRequest>(REQUESTS["REQ-1042"]);

  const [decisionNote, setDecisionNote] = useState<string>("");

  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthMode, setReauthMode] = useState<ReAuthMode>("PIN");
  const [reauthValue, setReauthValue] = useState("");

  const [pendingAction, setPendingAction] = useState<null | "Approve" | "Deny" | "RequestCorrection">(null);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  useEffect(() => {
    const d = REQUESTS[requestId] ?? REQUESTS["REQ-1042"];
    setData(d);
    setDecisionNote("");
    // reset reauth
    setReauthMode("PIN");
    setReauthValue("");
    setPendingAction(null);
    setReauthOpen(false);
  }, [requestId]);

  const isExpired = Date.now() > data.expiresAt;
  const rosterMismatch = Boolean(data.flags?.rosterMismatch);

  const statusTone =
    data.status === "Approved" ? EVZ.green : data.status === "Denied" ? EVZ.orange : data.status === "Correction requested" ? EVZ.orange : alpha(EVZ.ink, 0.7);

  const startAction = (a: "Approve" | "Deny" | "RequestCorrection") => {
    if (isExpired) return toast("This request has expired", "warning");

    if (rosterMismatch && a !== "RequestCorrection") {
      return toast("Roster mismatch detected. Request correction before approval.", "warning");
    }

    setPendingAction(a);
    setReauthOpen(true);
  };

  const completeAction = () => {
    // simulate reauth check
    if (reauthMode === "PIN" && reauthValue.trim().length < 4) return toast("Enter a valid PIN", "warning");
    if (reauthMode === "OTP" && reauthValue.trim().length < 4) return toast("Enter the OTP", "warning");

    if (!pendingAction) return;

    setData((p) => {
      const next: ConsentRequest = {
        ...p,
        status:
          pendingAction === "Approve"
            ? "Approved"
            : pendingAction === "Deny"
            ? "Denied"
            : "Correction requested",
        audit: [
          ...p.audit,
          {
            at: Date.now(),
            actor: "Guardian",
            device: reauthMode === "Biometric" ? "Biometric" : reauthMode,
            action:
              pendingAction === "Approve"
                ? "Approved consent"
                : pendingAction === "Deny"
                ? "Denied consent"
                : "Requested correction",
          },
        ],
      };
      return next;
    });

    toast(
      pendingAction === "Approve"
        ? "Consent approved"
        : pendingAction === "Deny"
        ? "Consent denied"
        : "Correction requested",
      pendingAction === "Approve" ? "success" : "warning"
    );

    setReauthOpen(false);
    setReauthValue("");
    setPendingAction(null);
  };

  const steps = useMemo(() => {
    if (isExpired) return ["Request", "Expired"];
    return ["Request", "Decision", "Complete"];
  }, [isExpired]);

  const activeStep = useMemo(() => {
    if (isExpired) return 1;
    if (data.status === "Pending") return 1;
    return 2;
  }, [data.status, isExpired]);

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
                    <Typography variant="h5">Consent request</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review a child request and grant guardian consent for EduPocket.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      select
                      label="Request ID"
                      value={requestId}
                      onChange={(e) => setRequestId(e.target.value)}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="REQ-1042">REQ-1042 (normal)</MenuItem>
                      <MenuItem value="mismatch">mismatch (roster mismatch)</MenuItem>
                      <MenuItem value="expired">expired (expired request)</MenuItem>
                    </TextField>
                    <Button variant="outlined" startIcon={<Close />} onClick={() => toast("Navigate: /parent/edupocket/children", "info")}>
                      Back
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((s) => (
                    <Step key={s}>
                      <StepLabel>{s}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Divider />

                {isExpired ? (
                  <Alert severity="warning" icon={<WarningAmber />}>
                    This consent request has expired. Ask the child to re-initiate the consent flow.
                  </Alert>
                ) : rosterMismatch ? (
                  <Alert severity="warning" icon={<WarningAmber />}>
                    School roster mismatch detected. Request correction before approval.
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<Info />}>
                    Consent is required for under-18 accounts. Actions are logged for audit.
                  </Alert>
                )}

                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={7}>
                    <ConsentSummaryCard data={data} mode={mode} statusTone={statusTone} isExpired={isExpired} rosterMismatch={rosterMismatch} />
                  </Grid>
                  <Grid item xs={12} lg={5}>
                    <ConsentDecisionPanel
                      mode={mode}
                      data={data}
                      decisionNote={decisionNote}
                      setDecisionNote={setDecisionNote}
                      isExpired={isExpired}
                      rosterMismatch={rosterMismatch}
                      onApprove={() => startAction("Approve")}
                      onDeny={() => startAction("Deny")}
                      onRequestCorrection={() => startAction("RequestCorrection")}
                    />
                    <Box sx={{ mt: 2.2 }}>
                      <ConsentAuditTrail mode={mode} audit={data.audit} />
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* ReAuth Gate */}
      <Dialog open={reauthOpen} onClose={() => setReauthOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.2}>
              <Typography variant="h6">Re-authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                Confirm this action using PIN, biometric, or OTP.
              </Typography>
            </Stack>
            <IconButton onClick={() => setReauthOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.6} sx={{ mt: 1 }}>
            <TextField select label="Method" value={reauthMode} onChange={(e) => setReauthMode(e.target.value as any)} fullWidth>
              <MenuItem value="PIN">PIN</MenuItem>
              <MenuItem value="Biometric">Biometric</MenuItem>
              <MenuItem value="OTP">OTP</MenuItem>
            </TextField>

            {reauthMode === "Biometric" ? (
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                <CardContent>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.6,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(EVZ.green, 0.12),
                        color: EVZ.green,
                        border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                      }}
                    >
                      <Fingerprint />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                        Biometric confirmation
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Simulated here. In production, use device biometrics.
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <TextField
                label={reauthMode === "PIN" ? "Enter PIN" : "Enter OTP"}
                value={reauthValue}
                onChange={(e) => setReauthValue(e.target.value.replace(/[^0-9]/g, ""))}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {reauthMode === "PIN" ? <Lock /> : <PhoneIphone />}
                    </InputAdornment>
                  ),
                }}
                helperText={reauthMode === "OTP" ? "OTP is typically delivered via SMS, Email, or WhatsApp" : "PIN protects sensitive actions"}
              />
            )}

            <Alert severity="info" icon={<Info />}>
              Action: <b>{pendingAction ?? "-"}</b>. This will be recorded in the consent audit trail.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReauthOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={completeAction}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3800} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function ConsentSummaryCard({
  data,
  mode,
  statusTone,
  isExpired,
  rosterMismatch,
}: {
  data: ConsentRequest;
  mode: "light" | "dark";
  statusTone: string;
  isExpired: boolean;
  rosterMismatch: boolean;
}) {
  const currency = "UGX";

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar
              sx={{
                width: 52,
                height: 52,
                bgcolor: alpha(EVZ.green, 0.18),
                color: EVZ.green,
                border: `1px solid ${alpha(EVZ.green, 0.25)}`,
                fontWeight: 950,
              }}
            >
              {data.child.name.split(" ")[0][0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{data.child.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.child.school} • {data.child.className}
                {data.child.stream ? ` • ${data.child.stream}` : ""}
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={isExpired ? "Expired" : data.status}
            sx={{
              fontWeight: 900,
              bgcolor: alpha(statusTone, 0.12),
              color: statusTone,
              border: `1px solid ${alpha(statusTone, 0.22)}`,
            }}
          />
        </Stack>

        <Divider sx={{ my: 1.6 }} />

        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Child details
                </Typography>
                <Divider sx={{ my: 1.2 }} />
                <Stack spacing={0.6}>
                  <MetaRow label="DOB" value={data.child.dob} />
                  <MetaRow label="Created" value={timeAgo(data.createdAt)} />
                  <MetaRow label="Expires" value={isExpired ? "Expired" : timeAgo(data.expiresAt)} />
                </Stack>

                <Divider sx={{ my: 1.2 }} />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    icon={<QrCode2 fontSize="small" />}
                    label="QR will be generated after approval"
                    sx={{ fontWeight: 900 }}
                  />
                  {rosterMismatch ? (
                    <Chip
                      size="small"
                      icon={<WarningAmber fontSize="small" />}
                      label="Roster mismatch"
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha(EVZ.orange, 0.12),
                        color: EVZ.orange,
                        border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                      }}
                    />
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Photo verification
                </Typography>
                <Divider sx={{ my: 1.2 }} />
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.6,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(data.child.photoProvided ? EVZ.green : EVZ.orange, 0.12),
                      color: data.child.photoProvided ? EVZ.green : EVZ.orange,
                      border: `1px solid ${alpha(data.child.photoProvided ? EVZ.green : EVZ.orange, 0.22)}`,
                    }}
                  >
                    {data.child.photoProvided ? <CheckCircle fontSize="small" /> : <ErrorOutline fontSize="small" />}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      {data.child.photoProvided ? "Photo provided" : "Photo missing"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Vendors display the student photo before charging.
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.2 }} />

                <Chip
                  size="small"
                  label={data.child.photoRequested ? "Photo required" : "Photo optional"}
                  sx={{
                    fontWeight: 900,
                    bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.20 : 0.06),
                    border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.6 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
          Baseline limits preview
        </Typography>
        <Typography variant="caption" color="text.secondary">
          These are starter limits. You can adjust them later in Parental Controls.
        </Typography>

        <Divider sx={{ my: 1.2 }} />

        <Grid container spacing={1.2}>
          <Grid item xs={12} md={4}>
            <LimitTile label="Per transaction" value={fmtMoney(data.baselineLimits.perTxn, currency)} mode={mode} />
          </Grid>
          <Grid item xs={12} md={4}>
            <LimitTile label="Daily" value={fmtMoney(data.baselineLimits.daily, currency)} mode={mode} />
          </Grid>
          <Grid item xs={12} md={4}>
            <LimitTile label="Weekly" value={fmtMoney(data.baselineLimits.weekly, currency)} mode={mode} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.2 }} />

        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              Category caps
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sample caps that can be tightened per vendor and schedule.
            </Typography>
            <Divider sx={{ my: 1.2 }} />
            <Stack spacing={0.6}>
              {data.baselineLimits.categoryCaps.map((c) => (
                <MetaRow key={c.category} label={c.category} value={fmtMoney(c.cap, currency)} />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Divider sx={{ my: 1.2 }} />

        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              Policy notes
            </Typography>
            <Divider sx={{ my: 1.2 }} />
            <Stack spacing={0.6}>
              <MetaRow label="Schedule" value={data.baselineLimits.schedule} />
              <MetaRow label="Approved vendors only" value={data.baselineLimits.approvedVendorsOnly ? "Yes" : "No"} />
            </Stack>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function ConsentDecisionPanel({
  mode,
  data,
  decisionNote,
  setDecisionNote,
  isExpired,
  rosterMismatch,
  onApprove,
  onDeny,
  onRequestCorrection,
}: {
  mode: "light" | "dark";
  data: ConsentRequest;
  decisionNote: string;
  setDecisionNote: (v: string) => void;
  isExpired: boolean;
  rosterMismatch: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onRequestCorrection: () => void;
}) {
  const disabled = isExpired || data.status !== "Pending";

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Decision</Typography>
        <Typography variant="body2" color="text.secondary">
          Approve, deny, or request correction.
        </Typography>

        <Divider sx={{ my: 1.6 }} />

        {isExpired ? (
          <Alert severity="warning" icon={<WarningAmber />}>
            This request is expired.
          </Alert>
        ) : rosterMismatch ? (
          <Alert severity="warning" icon={<WarningAmber />}>
            Roster mismatch detected. Request correction before approval.
          </Alert>
        ) : null}

        <TextField
          label="Decision note (optional)"
          value={decisionNote}
          onChange={(e) => setDecisionNote(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder="Add a short reason or instruction for the child or school"
          sx={{ mt: 1.6 }}
        />

        <Divider sx={{ my: 1.6 }} />

        <Stack spacing={1.2}>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={onApprove}
            disabled={disabled || rosterMismatch}
            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.15 }}
            fullWidth
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            startIcon={<Close />}
            onClick={onDeny}
            disabled={disabled}
            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange, py: 1.15 }}
            fullWidth
          >
            Deny
          </Button>
          <Button
            variant="outlined"
            startIcon={<WarningAmber />}
            onClick={onRequestCorrection}
            disabled={disabled}
            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.15 }}
            fullWidth
          >
            Request correction
          </Button>
        </Stack>

        <Divider sx={{ my: 1.6 }} />

        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
          <CardContent>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2.6,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(EVZ.green, 0.12),
                  color: EVZ.green,
                  border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                }}
              >
                <Lock fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Re-authentication required
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sensitive actions require PIN, OTP, or biometric confirmation.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function ConsentAuditTrail({ mode, audit }: { mode: "light" | "dark"; audit: ConsentRequest["audit"] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Audit trail</Typography>
        <Typography variant="body2" color="text.secondary">
          Device, time and actor details.
        </Typography>
        <Divider sx={{ my: 1.6 }} />

        <Stack spacing={1}>
          {audit
            .slice()
            .sort((a, b) => b.at - a.at)
            .map((e, idx) => (
              <Card key={idx} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
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
                        <VerifiedUser fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          {e.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {e.actor} • {e.device}
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
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 900 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function LimitTile({ label, value, mode }: { label: string; value: string; mode: "light" | "dark" }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 950, mt: 0.2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
