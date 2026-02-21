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
  Add,
  ArrowForward,
  CameraAlt,
  CheckCircle,
  Close,
  Info,
  QrCode2,
  School,
  Security,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Add Child Wizard (Premium)
 * Route: /parent/edupocket/children/add
 * Also works as a drawer-only flow when embedded.
 * Includes:
 * - Stepper: Choose method -> Details -> Review
 * - QR scanner modal (simulated)
 * - Security note card (audited linking)
 * - Invalid code, duplicate link, school invite conflict resolution
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Method = "Create" | "Link" | "ApproveRequest" | "SchoolInvite";

type WizardState = {
  method: Method | null;
  // create
  childName: string;
  dob: string;
  school: string;
  className: string;
  stream: string;
  currency: "UGX" | "USD";
  photoWanted: boolean;
  // code-based
  code: string;
  codeStatus: "idle" | "valid" | "invalid" | "duplicate" | "conflict";
  // conflict resolution
  conflictChoice: "LinkToExisting" | "CreateNew" | null;
  // review
  confirmGuardian: boolean;
};

type ExistingChild = { id: string; name: string; school: string; className: string };

const EXISTING_CHILDREN: ExistingChild[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2" },
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
                <Add fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  CorporatePay • EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add Child
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

export default function EduPocketAddChildWizard() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Choose method", "Details", "Review"];

  const [scannerOpen, setScannerOpen] = useState(false);

  const [state, setState] = useState<WizardState>({
    method: null,
    childName: "",
    dob: "",
    school: "",
    className: "",
    stream: "",
    currency: "UGX",
    photoWanted: true,
    code: "",
    codeStatus: "idle",
    conflictChoice: null,
    confirmGuardian: false,
  });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const set = (patch: Partial<WizardState>) => setState((p) => ({ ...p, ...patch }));

  const canNext = useMemo(() => {
    if (activeStep === 0) return Boolean(state.method);

    if (activeStep === 1) {
      if (state.method === "Create") {
        return state.childName.trim().length >= 2 && Boolean(state.school.trim()) && Boolean(state.className.trim()) && Boolean(state.dob);
      }
      // code-based
      if (!state.code.trim()) return false;
      if (state.codeStatus === "invalid") return false;
      if (state.codeStatus === "duplicate") return true; // allow continue to review
      if (state.codeStatus === "conflict") return Boolean(state.conflictChoice);
      return state.codeStatus === "valid";
    }

    if (activeStep === 2) {
      return state.confirmGuardian;
    }

    return false;
  }, [activeStep, state]);

  const validateCode = (code: string) => {
    const c = code.trim().toUpperCase();
    // Simulated status rules:
    // INVALID -> invalid
    // DUPLICATE -> duplicate (already linked)
    // CONFLICT -> conflict (school invite mismatch)
    // anything else with length >= 6 is valid
    if (!c) return "idle";
    if (c === "INVALID") return "invalid";
    if (c === "DUPLICATE") return "duplicate";
    if (c === "CONFLICT") return "conflict";
    if (c.length >= 6) return "valid";
    return "invalid";
  };

  useEffect(() => {
    if (activeStep !== 1) return;
    if (state.method === "Create") return;
    const status = validateCode(state.code);
    setState((p) => ({ ...p, codeStatus: status }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.code, state.method, activeStep]);

  const next = () => {
    if (!canNext) return;

    if (activeStep === 2) {
      // confirm
      toast("Child flow completed successfully", "success");
      return;
    }

    setActiveStep((s) => Math.min(2, s + 1));
  };

  const back = () => setActiveStep((s) => Math.max(0, s - 1));

  const pickMethod = (m: Method) => {
    set({ method: m, code: "", codeStatus: "idle", conflictChoice: null });
    toast(`Selected method: ${labelMethod(m)}`, "info");
  };

  const onScanResult = (code: string) => {
    set({ code, codeStatus: validateCode(code) });
    setScannerOpen(false);
    toast(`Scanned code: ${code}`, "success");
  };

  const reviewSummary = useMemo(() => {
    if (!state.method) return null;

    if (state.method === "Create") {
      return {
        title: "Create child wallet",
        lines: [
          `Name: ${state.childName || "-"}`,
          `DOB: ${state.dob || "-"}`,
          `School: ${state.school || "-"}`,
          `Class: ${state.className || "-"}${state.stream ? ` • ${state.stream}` : ""}`,
          `Currency: ${state.currency}`,
          `Photo requested: ${state.photoWanted ? "Yes" : "No"}`,
        ],
      };
    }

    const methodTitle =
      state.method === "Link" ? "Link existing child wallet" : state.method === "ApproveRequest" ? "Approve child sign-up request" : "Accept school invite";

    const statusLine =
      state.codeStatus === "valid"
        ? "Code looks valid"
        : state.codeStatus === "duplicate"
        ? "Duplicate: child already linked"
        : state.codeStatus === "conflict"
        ? `Conflict: resolution selected (${state.conflictChoice ?? "none"})`
        : "Invalid";

    return {
      title: methodTitle,
      lines: [`Code: ${state.code || "-"}`, `Validation: ${statusLine}`],
    };
  }, [state]);

  const invalidCode = activeStep === 1 && state.method !== "Create" && state.codeStatus === "invalid";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}>
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                  <Box>
                    <Typography variant="h5">Add child</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create a child wallet, link an existing wallet, approve a request, or accept a school invite.
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<Close />} onClick={() => toast("Navigate back: /parent/edupocket/children", "info")}>
                    Back to My Children
                  </Button>
                </Stack>

                <Divider />

                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Divider />

                <AnimatePresence mode="popLayout">
                  {activeStep === 0 ? (
                    <motion.div key="step0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <StepChooseMethod
                        mode={mode}
                        selected={state.method}
                        onPick={pickMethod}
                      />
                    </motion.div>
                  ) : null}

                  {activeStep === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <StepDetails
                        mode={mode}
                        state={state}
                        set={set}
                        invalidCode={invalidCode}
                        onOpenScanner={() => setScannerOpen(true)}
                      />
                    </motion.div>
                  ) : null}

                  {activeStep === 2 ? (
                    <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <StepReview mode={mode} summary={reviewSummary} state={state} set={set} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Footer actions */}
                <Divider />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems="center" justifyContent="space-between">
                  <Button variant="outlined" onClick={back} disabled={activeStep === 0}>
                    Back
                  </Button>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<Security />}
                      onClick={() => toast("Audit log: linking is recorded", "info")}
                      sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                    >
                      Security note
                    </Button>

                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={next}
                      disabled={!canNext}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                      fullWidth
                    >
                      {activeStep === 2 ? "Finish" : "Continue"}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </AppShell>

      {/* Scanner modal */}
      <QRScannerModal
        open={scannerOpen}
        mode={mode}
        onClose={() => setScannerOpen(false)}
        onPick={onScanResult}
      />

      <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function labelMethod(m: Method) {
  if (m === "Create") return "Create";
  if (m === "Link") return "Link";
  if (m === "ApproveRequest") return "Approve request";
  return "School invite";
}

function MethodCard({
  icon,
  title,
  desc,
  selected,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  tone: "good" | "warn" | "neutral";
}) {
  const color = tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : alpha(EVZ.ink, 0.7);
  return (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: "pointer",
        bgcolor: alpha("#FFFFFF", 0.72),
        borderColor: selected ? alpha(EVZ.green, 0.35) : alpha(EVZ.ink, 0.12),
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(color as any, 0.12),
              color,
              border: `1px solid ${alpha(color as any, 0.22)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {desc}
            </Typography>
          </Box>
          {selected ? (
            <Chip
              size="small"
              icon={<CheckCircle fontSize="small" />}
              label="Selected"
              sx={{ fontWeight: 900, bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green, border: `1px solid ${alpha(EVZ.green, 0.22)}` }}
            />
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function StepChooseMethod({
  mode,
  selected,
  onPick,
}: {
  mode: "light" | "dark";
  selected: Method | null;
  onPick: (m: Method) => void;
}) {
  return (
    <Stack spacing={1.6}>
      <Alert severity="info" icon={<Info />}>
        Choose a method. Linking actions are audited (device, time, guardian identity).
      </Alert>

      <Grid container spacing={1.6}>
        <Grid item xs={12} md={6}>
          <MethodCard
            icon={<Add fontSize="small" />}
            title="Create child wallet"
            desc="Create a new child profile. Consent is required to activate."
            selected={selected === "Create"}
            onClick={() => onPick("Create")}
            tone="good"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MethodCard
            icon={<QrCode2 fontSize="small" />}
            title="Link existing child"
            desc="Use an invite code or scan a QR from the child or school."
            selected={selected === "Link"}
            onClick={() => onPick("Link")}
            tone="neutral"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MethodCard
            icon={<VerifiedUser fontSize="small" />}
            title="Approve sign-up request"
            desc="A child tried to sign up. Review and approve consent."
            selected={selected === "ApproveRequest"}
            onClick={() => onPick("ApproveRequest")}
            tone="warn"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MethodCard
            icon={<School fontSize="small" />}
            title="Accept school invite"
            desc="Link a student from a school roster invite."
            selected={selected === "SchoolInvite"}
            onClick={() => onPick("SchoolInvite")}
            tone="neutral"
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
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
              <Security fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                Security note
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Linking and approvals are captured in audit logs for investigations and support.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function StepDetails({
  mode,
  state,
  set,
  invalidCode,
  onOpenScanner,
}: {
  mode: "light" | "dark";
  state: WizardState;
  set: (p: Partial<WizardState>) => void;
  invalidCode: boolean;
  onOpenScanner: () => void;
}) {
  if (!state.method) {
    return (
      <Alert severity="warning" icon={<WarningAmber />}>
        Choose a method first.
      </Alert>
    );
  }

  const codeHelp =
    state.codeStatus === "valid"
      ? "Code looks valid"
      : state.codeStatus === "duplicate"
      ? "Duplicate: this child is already linked"
      : state.codeStatus === "conflict"
      ? "Conflict: school roster mismatch. Choose a resolution"
      : invalidCode
      ? "Invalid code. Try again"
      : "";

  return (
    <Stack spacing={1.6}>
      {state.method === "Create" ? (
        <>
          <Alert severity="info" icon={<Info />}>
            Create a new child profile. Consent is required for activation.
          </Alert>

          <Grid container spacing={1.6}>
            <Grid item xs={12} md={6}>
              <TextField label="Child name" value={state.childName} onChange={(e) => set({ childName: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date of birth"
                type="date"
                value={state.dob}
                onChange={(e) => set({ dob: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="School" value={state.school} onChange={(e) => set({ school: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Class" value={state.className} onChange={(e) => set({ className: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Stream (optional)" value={state.stream} onChange={(e) => set({ stream: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Currency" value={state.currency} onChange={(e) => set({ currency: e.target.value as any })} fullWidth>
                <MenuItem value="UGX">UGX</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), height: "100%" }}>
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
                        <CameraAlt fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          Photo request
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vendors verify identity by viewing the student photo.
                        </Typography>
                      </Box>
                    </Stack>
                    <Switch checked={state.photoWanted} onChange={(e) => set({ photoWanted: e.target.checked })} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Alert severity="info" icon={<Info />}>
            Enter a code or scan a QR. Try: <b>INVALID</b>, <b>DUPLICATE</b>, <b>CONFLICT</b> for demo states.
          </Alert>

          <TextField
            label="Invite code or QR code"
            value={state.code}
            onChange={(e) => set({ code: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCode2 />
                </InputAdornment>
              ),
            }}
            error={invalidCode}
            helperText={codeHelp}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button
              variant="outlined"
              startIcon={<CameraAlt />}
              onClick={onOpenScanner}
              sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
              fullWidth
            >
              Scan QR
            </Button>
            <Button
              variant="outlined"
              startIcon={<Security />}
              onClick={() => alert("Audit details")}
              sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
              fullWidth
            >
              Linking is audited
            </Button>
          </Stack>

          {state.codeStatus === "duplicate" ? (
            <Card variant="outlined" sx={{ bgcolor: alpha(EVZ.orange, 0.06), borderColor: alpha(EVZ.orange, 0.28) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Duplicate child already linked
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The code belongs to a child already linked to your account.
                </Typography>
                <Divider sx={{ my: 1.4 }} />
                <Stack spacing={1}>
                  {EXISTING_CHILDREN.map((c) => (
                    <Chip key={c.id} label={`${c.name} • ${c.school} • ${c.className}`} sx={{ fontWeight: 900 }} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {state.codeStatus === "conflict" ? (
            <Card variant="outlined" sx={{ bgcolor: alpha(EVZ.orange, 0.06), borderColor: alpha(EVZ.orange, 0.28) }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  School invite conflict resolution
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The invite does not match an existing roster record. Choose how to proceed.
                </Typography>

                <Divider sx={{ my: 1.4 }} />

                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={6}>
                    <Card
                      component={motion.div}
                      whileHover={{ y: -2 }}
                      variant="outlined"
                      onClick={() => set({ conflictChoice: "LinkToExisting" })}
                      sx={{
                        cursor: "pointer",
                        bgcolor: alpha("#FFFFFF", 0.72),
                        borderColor: state.conflictChoice === "LinkToExisting" ? alpha(EVZ.green, 0.35) : alpha(EVZ.ink, 0.12),
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
                            <VerifiedUser fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Link to an existing child
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Select the correct child already in your account.
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card
                      component={motion.div}
                      whileHover={{ y: -2 }}
                      variant="outlined"
                      onClick={() => set({ conflictChoice: "CreateNew" })}
                      sx={{
                        cursor: "pointer",
                        bgcolor: alpha("#FFFFFF", 0.72),
                        borderColor: state.conflictChoice === "CreateNew" ? alpha(EVZ.green, 0.35) : alpha(EVZ.ink, 0.12),
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
                              bgcolor: alpha(EVZ.orange, 0.12),
                              color: EVZ.orange,
                              border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                            }}
                          >
                            <Add fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                              Create a new child profile
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Create and request correction from the school.
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {state.conflictChoice === "LinkToExisting" ? (
                  <Box sx={{ mt: 1.6 }}>
                    <TextField select label="Select child" fullWidth defaultValue={EXISTING_CHILDREN[0].id}>
                      {EXISTING_CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} • {c.school} • {c.className}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <SecurityNoteCard mode={mode} />
        </>
      )}
    </Stack>
  );
}

function StepReview({
  mode,
  summary,
  state,
  set,
}: {
  mode: "light" | "dark";
  summary: { title: string; lines: string[] } | null;
  state: WizardState;
  set: (p: Partial<WizardState>) => void;
}) {
  if (!summary) {
    return (
      <Alert severity="warning" icon={<WarningAmber />}>
        Missing information.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.6}>
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
              <CheckCircle fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6">Review</Typography>
              <Typography variant="body2" color="text.secondary">
                Confirm details before finalizing.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 1.4 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
            {summary.title}
          </Typography>

          <Stack spacing={0.6} sx={{ mt: 1.2 }}>
            {summary.lines.map((l, idx) => (
              <Typography key={idx} variant="body2">
                {l}
              </Typography>
            ))}
          </Stack>

          <Divider sx={{ my: 1.4 }} />

          <Alert severity="info" icon={<Info />}>
            Final actions are recorded in audit logs (device, time, guardian identity).
          </Alert>

          <Divider sx={{ my: 1.4 }} />

          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
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
                      Guardian confirmation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      I am authorized to manage this child account.
                    </Typography>
                  </Box>
                </Stack>
                <Switch checked={state.confirmGuardian} onChange={(e) => set({ confirmGuardian: e.target.checked })} />
              </Stack>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <SecurityNoteCard mode={mode} />
    </Stack>
  );
}

function SecurityNoteCard({ mode }: { mode: "light" | "dark" }) {
  return (
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
              bgcolor: alpha(EVZ.orange, 0.12),
              color: EVZ.orange,
              border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
            }}
          >
            <Security fontSize="small" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              Security note
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Linking and approvals are logged for compliance. You can export audit trails for investigations.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QRScannerModal({
  open,
  mode,
  onClose,
  onPick,
}: {
  open: boolean;
  mode: "light" | "dark";
  onClose: () => void;
  onPick: (code: string) => void;
}) {
  const demoCodes = ["REQ-1042", "SCH-88A21", "DUPLICATE", "INVALID", "CONFLICT"];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.2}>
            <Typography variant="h6">Scan QR</Typography>
            <Typography variant="body2" color="text.secondary">
              Camera scanning is simulated in this canvas.
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.6}>
          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
            <CardContent>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(EVZ.green, 0.12),
                    color: EVZ.green,
                    border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                  }}
                >
                  <CameraAlt />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                    Scanner preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Select a demo code below.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="caption" color="text.secondary">
            Demo codes
          </Typography>
          <Grid container spacing={1.2}>
            {demoCodes.map((c) => (
              <Grid item xs={12} sm={6} key={c}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<QrCode2 />}
                  onClick={() => onPick(c)}
                  sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", justifyContent: "flex-start" }}
                >
                  {c}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" icon={<Info />}>
            In production: use a real QR scanner (device camera) and validate codes server-side.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
