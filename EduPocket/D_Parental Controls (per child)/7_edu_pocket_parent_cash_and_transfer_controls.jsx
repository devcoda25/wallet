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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  ContactPhone,
  CreditCard,
  Gavel,
  Info,
  Lock,
  PersonAdd,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Cash & Transfer Controls (Premium)
 * Route: /parent/edupocket/children/:childId/controls/transfers
 * Includes:
 * - TransferEnablementToggles
 * - PerTransferLimitEditor
 * - TrustedRecipientsManager
 * - UnknownRecipientBlockToggle
 * - State: recipient verification flows
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string; currency: "UGX" | "USD" };

type RecipientType = "Family" | "Guardian" | "School" | "Vendor";

type RecipientStatus = "Verified" | "Pending" | "Blocked";

type Recipient = {
  id: string;
  name: string;
  type: RecipientType;
  method: "Phone" | "Bank" | "Wallet";
  handle: string;
  status: RecipientStatus;
  createdAt: number;
};

type TransferToggles = {
  p2p: boolean;
  cashOut: boolean;
  bankTransfer: boolean;
};

type LimitModel = {
  perTransfer: number;
  daily: number;
  requireApprovalAbove: number;
};

type VerifyFlow = {
  recipientId: string;
  step: 0 | 1;
  otp: string;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue", currency: "UGX" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West", currency: "UGX" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3", currency: "USD" },
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
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "transparent", backdropFilter: "blur(10px)", borderBottom: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.08)}` }}>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.25,
            background: mode === "dark" ? "linear-gradient(180deg, rgba(7,17,15,0.92) 0%, rgba(7,17,15,0.62) 100%)" : "linear-gradient(180deg, rgba(246,251,249,0.95) 0%, rgba(246,251,249,0.70) 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: alpha(EVZ.green, 0.14), border: `1px solid ${alpha(EVZ.green, 0.25)}`, color: EVZ.green }}>
                <CreditCard fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>EduPocket - Transfers</Typography>
                <Typography variant="caption" color="text.secondary">{childName}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to Controls Home">
                <IconButton onClick={() => alert("Navigate: /parent/edupocket/children/:childId/controls")} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(EVZ.orange, 0.12), color: EVZ.orange, border: `1px solid ${alpha(EVZ.orange, 0.25)}`, fontWeight: 950 }}>R</Avatar>
            </Stack>
          </Stack>
        </Box>
      </AppBar>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 2.2,
          pb: 8,
          background: mode === "dark" ? "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.16), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.10), transparent 60%)" : "radial-gradient(1200px 520px at 20% 0%, rgba(3,205,140,0.14), transparent 65%), radial-gradient(900px 480px at 80% 0%, rgba(247,127,0,0.08), transparent 60%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function num(v: string) {
  const n = parseInt((v || "0").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
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

export default function EduPocketTransferControls() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [toggles, setToggles] = useState<TransferToggles>({ p2p: false, cashOut: false, bankTransfer: false });
  const [unknownBlock, setUnknownBlock] = useState(true);

  const [limits, setLimits] = useState<LimitModel>({ perTransfer: 10000, daily: 20000, requireApprovalAbove: 8000 });

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "r1", name: "Mom (Guardian)", type: "Guardian", method: "Phone", handle: "+256 7xx xxx 111", status: "Verified", createdAt: Date.now() - 5 * 24 * 60 * 60000 },
    { id: "r2", name: "School Bursar", type: "School", method: "Wallet", handle: "SCH-GREENHILL", status: "Verified", createdAt: Date.now() - 12 * 24 * 60 * 60000 },
    { id: "r3", name: "Uncle Ben", type: "Family", method: "Phone", handle: "+256 7xx xxx 222", status: "Pending", createdAt: Date.now() - 20 * 60000 },
  ]);

  const pendingRecipients = useMemo(() => recipients.filter((r) => r.status === "Pending"), [recipients]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<Omit<Recipient, "id" | "createdAt" | "status">>({
    name: "",
    type: "Family",
    method: "Phone",
    handle: "",
  });

  const [verify, setVerify] = useState<VerifyFlow | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const addRecipient = () => {
    if (!addDraft.name.trim() || !addDraft.handle.trim()) {
      toast("Recipient name and destination are required", "warning");
      return;
    }

    const id = `r_${Math.floor(100000 + Math.random() * 899999)}`;
    const newRec: Recipient = {
      id,
      name: addDraft.name.trim(),
      type: addDraft.type,
      method: addDraft.method,
      handle: addDraft.handle.trim(),
      status: "Pending",
      createdAt: Date.now(),
    };

    setRecipients((p) => [newRec, ...p]);
    setAddDialogOpen(false);
    setAddDraft({ name: "", type: "Family", method: "Phone", handle: "" });

    // start verification flow
    setVerify({ recipientId: id, step: 0, otp: "" });
    toast("Recipient added. Verification required.", "warning");
  };

  const startVerify = (id: string) => {
    setVerify({ recipientId: id, step: 0, otp: "" });
  };

  const sendOtp = () => {
    if (!verify) return;
    setVerify((p) => (p ? { ...p, step: 1 } : p));
    toast("OTP sent (simulated)", "info");
  };

  const completeVerify = () => {
    if (!verify) return;
    if (verify.otp.trim().length < 4) {
      toast("Enter OTP", "warning");
      return;
    }

    setRecipients((p) => p.map((r) => (r.id === verify.recipientId ? { ...r, status: "Verified" } : r)));
    toast("Recipient verified", "success");
    setVerify(null);
  };

  const blockRecipient = (id: string) => {
    setRecipients((p) => p.map((r) => (r.id === id ? { ...r, status: "Blocked" } : r)));
    toast("Recipient blocked", "warning");
  };

  const unblockRecipient = (id: string) => {
    setRecipients((p) => p.map((r) => (r.id === id ? { ...r, status: "Verified" } : r)));
    toast("Recipient unblocked", "success");
  };

  const removeRecipient = (id: string) => {
    setRecipients((p) => p.filter((r) => r.id !== id));
    toast("Recipient removed", "info");
  };

  const saveAll = () => {
    if (limits.requireApprovalAbove > limits.perTransfer) {
      toast("Approval threshold cannot exceed per-transfer limit", "warning");
      return;
    }
    toast("Transfer controls saved", "success");
  };

  const viewerBanner = useMemo(() => {
    if (!toggles.p2p && !toggles.cashOut && !toggles.bankTransfer) {
      return "Transfers are disabled. Enable a transfer type to allow outgoing transfers.";
    }
    return null;
  }, [toggles]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} childName={`${child.name} • ${child.school}`}> 
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Cash and transfer controls</Typography>
                    <Typography variant="body2" color="text.secondary">Enable transfers safely and control recipients.</Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} • {c.school}</MenuItem>
                      ))}
                    </TextField>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={saveAll} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>Save</Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Transfer enablement */}
                <Grid container spacing={2.2}>
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Transfer enablement</Typography>
                        <Typography variant="body2" color="text.secondary">Choose which transfer types are allowed.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          <ToggleRow label="Peer-to-peer transfers" checked={toggles.p2p} onChange={(v) => setToggles((p) => ({ ...p, p2p: v }))} />
                          <ToggleRow label="Cash withdrawal" checked={toggles.cashOut} onChange={(v) => setToggles((p) => ({ ...p, cashOut: v }))} />
                          <ToggleRow label="Bank transfers" checked={toggles.bankTransfer} onChange={(v) => setToggles((p) => ({ ...p, bankTransfer: v }))} />

                          {viewerBanner ? (
                            <Alert severity="info" icon={<Info />}>{viewerBanner}</Alert>
                          ) : null}

                          <Divider sx={{ my: 0.6 }} />

                          <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12) }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Block unknown recipients</Typography>
                                  <Typography variant="caption" color="text.secondary">Only allow transfers to trusted recipients.</Typography>
                                </Box>
                                <Switch checked={unknownBlock} onChange={(e) => setUnknownBlock(e.target.checked)} />
                              </Stack>
                            </CardContent>
                          </Card>

                          <Alert severity="info" icon={<Info />}>
                            When unknown recipients are blocked, any new recipient must be verified first.
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Transfer limits</Typography>
                        <Typography variant="body2" color="text.secondary">Caps that apply to all transfer types.</Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Grid container spacing={1.6}>
                          <Grid item xs={12} md={4}>
                            <LimitCard
                              title="Per transfer"
                              currency={child.currency}
                              value={limits.perTransfer}
                              onChange={(v) => setLimits((p) => ({ ...p, perTransfer: v }))}
                              hint="Hard cap for a single transfer"
                              mode={mode}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <LimitCard
                              title="Daily transfers"
                              currency={child.currency}
                              value={limits.daily}
                              onChange={(v) => setLimits((p) => ({ ...p, daily: v }))}
                              hint="Total outgoing cap per day"
                              mode={mode}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <LimitCard
                              title="Approval above"
                              currency={child.currency}
                              value={limits.requireApprovalAbove}
                              onChange={(v) => setLimits((p) => ({ ...p, requireApprovalAbove: v }))}
                              hint="Require guardian approval above this"
                              mode={mode}
                            />
                          </Grid>
                        </Grid>

                        {limits.requireApprovalAbove > limits.perTransfer ? (
                          <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1.6 }}>
                            Approval threshold cannot exceed the per-transfer limit.
                          </Alert>
                        ) : null}

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Transfers can also be restricted by schedules and safety rules (optional).
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Trusted recipients */}
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Trusted recipients</Typography>
                        <Typography variant="body2" color="text.secondary">Manage the allowlist and verification status.</Typography>
                      </Box>
                      <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddDialogOpen(true)} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                        Add recipient
                      </Button>
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <AnimatePresence initial={false}>
                      {pendingRecipients.length ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                          <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 1.2 }}>
                            {pendingRecipients.length} recipient(s) require verification.
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 950 }}>Recipient</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 950 }}>Added</TableCell>
                            <TableCell sx={{ fontWeight: 950 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recipients
                            .slice()
                            .sort((a, b) => (a.status === "Pending" ? -1 : 0) - (b.status === "Pending" ? -1 : 0) || b.createdAt - a.createdAt)
                            .map((r) => (
                              <TableRow key={r.id} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2.5,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: alpha(r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : EVZ.ink, r.status === "Verified" ? 0.12 : r.status === "Blocked" ? 0.12 : 0.06),
                                        color: r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : "text.primary",
                                        border: `1px solid ${alpha(r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : EVZ.ink, r.status === "Verified" ? 0.22 : r.status === "Blocked" ? 0.22 : 0.10)}`,
                                      }}
                                    >
                                      <VerifiedUser fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{r.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{r.handle}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>{r.type}</TableCell>
                                <TableCell>{r.method}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={r.status}
                                    sx={{
                                      fontWeight: 900,
                                      bgcolor: alpha(r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : EVZ.ink, r.status === "Verified" ? 0.12 : r.status === "Blocked" ? 0.12 : 0.06),
                                      color: r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : "text.primary",
                                      border: `1px solid ${alpha(r.status === "Verified" ? EVZ.green : r.status === "Blocked" ? EVZ.orange : EVZ.ink, r.status === "Verified" ? 0.22 : r.status === "Blocked" ? 0.22 : 0.10)}`,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{timeAgo(r.createdAt)}</TableCell>
                                <TableCell>
                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    {r.status === "Pending" ? (
                                      <Button size="small" variant="outlined" onClick={() => startVerify(r.id)} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}>
                                        Verify
                                      </Button>
                                    ) : null}
                                    {r.status === "Blocked" ? (
                                      <Button size="small" variant="outlined" onClick={() => unblockRecipient(r.id)} sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}>
                                        Unblock
                                      </Button>
                                    ) : (
                                      <Button size="small" variant="outlined" onClick={() => blockRecipient(r.id)} sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}>
                                        Block
                                      </Button>
                                    )}
                                    <Button size="small" onClick={() => removeRecipient(r.id)} startIcon={<Close />}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </Box>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Verification is required for new recipients (OTP or bank confirmation, depending on method).
                    </Alert>
                  </CardContent>
                </Card>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={saveAll} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}>
                    Save transfer controls
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<Info />} onClick={() => alert("Open audit logs") } sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary", py: 1.2 }}>
                    View audit
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>

        {/* Add recipient dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Add recipient</Typography>
                <Typography variant="body2" color="text.secondary">New recipients require verification.</Typography>
              </Stack>
              <IconButton onClick={() => setAddDialogOpen(false)}><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              <TextField label="Name" value={addDraft.name} onChange={(e) => setAddDraft((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField select label="Type" value={addDraft.type} onChange={(e) => setAddDraft((p) => ({ ...p, type: e.target.value as any }))} fullWidth>
                <MenuItem value="Family">Family</MenuItem>
                <MenuItem value="Guardian">Guardian</MenuItem>
                <MenuItem value="School">School</MenuItem>
                <MenuItem value="Vendor">Vendor</MenuItem>
              </TextField>
              <TextField select label="Method" value={addDraft.method} onChange={(e) => setAddDraft((p) => ({ ...p, method: e.target.value as any }))} fullWidth>
                <MenuItem value="Phone">Phone</MenuItem>
                <MenuItem value="Wallet">Wallet</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
              </TextField>
              <TextField
                label={addDraft.method === "Phone" ? "Phone number" : addDraft.method === "Wallet" ? "Wallet ID" : "Bank account"}
                value={addDraft.handle}
                onChange={(e) => setAddDraft((p) => ({ ...p, handle: e.target.value }))}
                fullWidth
              />
              <Alert severity="info" icon={<Info />}>
                Verification flows vary by method (OTP, bank confirmation, or wallet ownership).
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={addRecipient} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification flow drawer */}
        <Drawer anchor="right" open={Boolean(verify)} onClose={() => setVerify(null)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
          <Box sx={{ p: 2.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Recipient verification</Typography>
                <Typography variant="body2" color="text.secondary">Confirm ownership before allowing transfers.</Typography>
              </Stack>
              <IconButton onClick={() => setVerify(null)}><Close /></IconButton>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {verify ? (
              <Stack spacing={1.6}>
                <Alert severity="info" icon={<Info />}>
                  This is a simulated flow. In production, OTP/ownership checks happen server-side.
                </Alert>

                {verify.step === 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Step 1: Send OTP</Typography>
                    <Typography variant="caption" color="text.secondary">We will send a code to the recipient destination.</Typography>
                    <Button variant="contained" startIcon={<ContactPhone />} onClick={sendOtp} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Step 2: Confirm OTP</Typography>
                    <TextField
                      label="OTP"
                      value={verify.otp}
                      onChange={(e) => setVerify((p) => (p ? { ...p, otp: (e.target.value || "").replace(/[^0-9]/g, "") } : p))}
                      InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
                    />
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={completeVerify} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                      Verify
                    </Button>
                  </>
                )}

                <Button variant="outlined" startIcon={<Close />} onClick={() => setVerify(null)} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}>
                  Cancel
                </Button>
              </Stack>
            ) : null}
          </Box>
        </Drawer>

        <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
        </Snackbar>
      </AppShell>
    </ThemeProvider>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="body2">{label}</Typography>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Stack>
  );
}

function LimitCard({
  title,
  currency,
  value,
  onChange,
  hint,
  mode,
}: {
  title: string;
  currency: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
  mode: "light" | "dark";
}) {
  return (
    <Card variant="outlined" component={motion.div} whileHover={{ y: -2 }} sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{hint}</Typography>
        <Divider sx={{ my: 1.2 }} />
        <TextField
          value={value}
          onChange={(e) => onChange(num(e.target.value))}
          InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
          fullWidth
        />
      </CardContent>
    </Card>
  );
}

function num(v: string) {
  const n = parseInt((v || "0").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
