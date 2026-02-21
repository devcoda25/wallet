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
  Download,
  Group,
  Info,
  PersonAdd,
  Phone,
  Shield,
  VerifiedUser,
  WarningAmber,
} from "@mui/icons-material";

/**
 * EduPocket Parent - Household & Co-Guardians (Premium)
 * Route: /parent/edupocket/household
 * Includes:
 * - HouseholdMembersTable
 * - InviteGuardianFlow
 * - RoleSelector (Viewer / Approver / Funder / Admin)
 * - ApprovalRoutingBuilder (either guardian, both required above threshold)
 * - EmergencyContactsManager
 * - States: pending invites, revoked access
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Role = "Viewer" | "Approver" | "Funder" | "Admin";

type MemberStatus = "Active" | "Pending invite" | "Revoked";

type Member = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: MemberStatus;
  lastActive: string;
};

type ApprovalRoutingMode = "Either can approve" | "Both required above threshold";

type Routing = {
  mode: ApprovalRoutingMode;
  bothRequiredThreshold: number;
};

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

type InviteDraft = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  message: string;
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
                <Group fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                  EduPocket
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Household and co-guardians
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                <IconButton onClick={onToggleMode} sx={{ border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.28 : 0.12)}` }}>
                  <Shield fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Go to My Children">
                <IconButton
                  onClick={() => alert("Navigate: /parent/edupocket/children")}
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

function roleCaps(role: Role) {
  if (role === "Viewer") return ["View children", "View transactions", "No approvals", "No funding"];
  if (role === "Approver") return ["Approve/decline", "Create rules", "View transactions", "No funding"];
  if (role === "Funder") return ["Top up", "Manage sources", "View balances", "No approvals"];
  return ["Full access", "Manage roles", "Approve/decline", "Funding", "Audit exports"];
}

function toneForStatus(status: MemberStatus) {
  if (status === "Active") return EVZ.green;
  if (status === "Pending invite") return EVZ.orange;
  return alpha(EVZ.ink, 0.7);
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

export default function EduPocketHouseholdCoGuardians() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [members, setMembers] = useState<Member[]>([
    { id: "m1", name: "Ronald (You)", email: "ronald@example.com", phone: "+256 7xx xxx 000", role: "Admin", status: "Active", lastActive: "Today" },
    { id: "m2", name: "Susan (Co-guardian)", email: "susan@example.com", phone: "+256 7xx xxx 111", role: "Approver", status: "Active", lastActive: "Yesterday" },
    { id: "m3", name: "Daisy", email: "daisy@example.com", phone: "+256 7xx xxx 222", role: "Funder", status: "Pending invite", lastActive: "—" },
    { id: "m4", name: "Old Guardian", email: "old@example.com", role: "Viewer", status: "Revoked", lastActive: "3 months ago" },
  ]);

  const [routing, setRouting] = useState<Routing>({ mode: "Either can approve", bothRequiredThreshold: 20000 });

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "e1", name: "School Security", relation: "School", phone: "+256 7xx xxx 333" },
    { id: "e2", name: "Aunt Mary", relation: "Family", phone: "+256 7xx xxx 444" },
  ]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteStep, setInviteStep] = useState(0);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft>({
    name: "",
    email: "",
    phone: "",
    role: "Viewer",
    message: "Hi! I’d like to invite you as a co-guardian on EduPocket.",
  });

  const [contactOpen, setContactOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState<EmergencyContact>({ id: "", name: "", relation: "Family", phone: "" });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({ open: false, msg: "", sev: "info" });
  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  const pendingInvites = useMemo(() => members.filter((m) => m.status === "Pending invite").length, [members]);
  const revoked = useMemo(() => members.filter((m) => m.status === "Revoked").length, [members]);

  const updateRole = (id: string, role: Role) => {
    setMembers((p) => p.map((m) => (m.id === id ? { ...m, role } : m)));
    toast("Role updated", "success");
  };

  const revoke = (id: string) => {
    setMembers((p) => p.map((m) => (m.id === id ? { ...m, status: "Revoked" } : m)));
    toast("Access revoked", "warning");
  };

  const restore = (id: string) => {
    setMembers((p) => p.map((m) => (m.id === id ? { ...m, status: "Active" } : m)));
    toast("Access restored", "success");
  };

  const resendInvite = (id: string) => {
    toast("Invite resent", "success");
  };

  const nextInvite = () => {
    if (inviteStep === 0) {
      if (!inviteDraft.name.trim() || !inviteDraft.email.trim()) return toast("Name and email are required", "warning");
    }
    setInviteStep((s) => Math.min(2, s + 1));
  };

  const backInvite = () => setInviteStep((s) => Math.max(0, s - 1));

  const sendInvite = () => {
    const id = `m_${Math.floor(100000 + Math.random() * 899999)}`;
    const m: Member = {
      id,
      name: inviteDraft.name.trim(),
      email: inviteDraft.email.trim(),
      phone: inviteDraft.phone.trim() || undefined,
      role: inviteDraft.role,
      status: "Pending invite",
      lastActive: "—",
    };
    setMembers((p) => [m, ...p]);
    setInviteOpen(false);
    setInviteStep(0);
    setInviteDraft({ name: "", email: "", phone: "", role: "Viewer", message: "Hi! I’d like to invite you as a co-guardian on EduPocket." });
    toast("Invite sent", "success");
  };

  const addContact = () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) return toast("Contact name and phone are required", "warning");
    const id = `e_${Math.floor(100000 + Math.random() * 899999)}`;
    setContacts((p) => [{ ...contactDraft, id }, ...p]);
    setContactDraft({ id: "", name: "", relation: "Family", phone: "" });
    setContactOpen(false);
    toast("Emergency contact added", "success");
  };

  const removeContact = (id: string) => {
    setContacts((p) => p.filter((c) => c.id !== id));
    toast("Emergency contact removed", "info");
  };

  const exportHousehold = () => {
    const rows: string[] = [];
    rows.push(["name", "email", "role", "status"].join(","));
    for (const m of members) rows.push([m.name, m.email, m.role, m.status].map(csvSafe).join(","));
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edupocket_household_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export ready", "success");
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
                    <Typography variant="h5">Household and co-guardians</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invite family members, assign roles, and configure approval routing.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportHousehold}
                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={() => setInviteOpen(true)}
                      sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                    >
                      Invite guardian
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={`${pendingInvites} pending invite(s)`}
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha(EVZ.orange, 0.12),
                        color: EVZ.orange,
                        border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${revoked} revoked`}
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha(EVZ.ink, mode === "dark" ? 0.22 : 0.06),
                        border: `1px solid ${alpha(EVZ.ink, mode === "dark" ? 0.25 : 0.10)}`,
                      }}
                    />
                  </Stack>

                  <Button
                    variant="outlined"
                    startIcon={<Info />}
                    onClick={() => toast("Open audit logs", "info")}
                    sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                  >
                    View audit
                  </Button>
                </Stack>

                <Grid container spacing={2.2}>
                  {/* Members */}
                  <Grid item xs={12} lg={7}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Household members</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Roles control approvals, funding and admin access.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Box sx={{ overflowX: "auto" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 950 }}>Member</TableCell>
                                <TableCell sx={{ fontWeight: 950 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 950 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 950 }}>Last active</TableCell>
                                <TableCell sx={{ fontWeight: 950 }} />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {members.map((m) => {
                                const tone = toneForStatus(m.status);
                                return (
                                  <TableRow key={m.id} hover>
                                    <TableCell>
                                      <Stack direction="row" spacing={1.2} alignItems="center">
                                        <Box
                                          sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 2.5,
                                            display: "grid",
                                            placeItems: "center",
                                            bgcolor: alpha(tone, 0.12),
                                            color: tone,
                                            border: `1px solid ${alpha(tone, 0.22)}`,
                                            fontWeight: 950,
                                          }}
                                        >
                                          {m.name.split(" ")[0][0]}
                                        </Box>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                            {m.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {m.email}
                                            {m.phone ? ` • ${m.phone}` : ""}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        select
                                        size="small"
                                        value={m.role}
                                        onChange={(e) => updateRole(m.id, e.target.value as Role)}
                                        disabled={m.status !== "Active" || m.role === "Admin"}
                                        sx={{ minWidth: 160 }}
                                      >
                                        {(["Viewer", "Approver", "Funder", "Admin"] as const).map((r) => (
                                          <MenuItem key={r} value={r}>
                                            {r}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </TableCell>

                                    <TableCell>
                                      <Chip
                                        size="small"
                                        label={m.status}
                                        sx={{
                                          fontWeight: 900,
                                          bgcolor: alpha(tone, 0.12),
                                          color: tone,
                                          border: `1px solid ${alpha(tone, 0.22)}`,
                                        }}
                                      />
                                    </TableCell>

                                    <TableCell>{m.lastActive}</TableCell>

                                    <TableCell>
                                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        {m.status === "Pending invite" ? (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => resendInvite(m.id)}
                                            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                          >
                                            Resend
                                          </Button>
                                        ) : null}
                                        {m.status === "Revoked" ? (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => restore(m.id)}
                                            sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                          >
                                            Restore
                                          </Button>
                                        ) : (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => revoke(m.id)}
                                            sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                            disabled={m.role === "Admin"}
                                          >
                                            Revoke
                                          </Button>
                                        )}
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Admin role is protected. Use a second admin only when necessary.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Routing + emergency contacts */}
                  <Grid item xs={12} lg={5}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Approval routing</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Define how approvals are processed.
                        </Typography>
                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          <TextField
                            select
                            label="Routing mode"
                            value={routing.mode}
                            onChange={(e) => setRouting((p) => ({ ...p, mode: e.target.value as any }))}
                          >
                            <MenuItem value="Either can approve">Either guardian can approve</MenuItem>
                            <MenuItem value="Both required above threshold">Both required above threshold</MenuItem>
                          </TextField>

                          {routing.mode === "Both required above threshold" ? (
                            <TextField
                              label="Threshold"
                              type="number"
                              value={routing.bothRequiredThreshold}
                              onChange={(e) => setRouting((p) => ({ ...p, bothRequiredThreshold: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
                              InputProps={{ startAdornment: <InputAdornment position="start">UGX</InputAdornment> }}
                              helperText="Approvals above this require both guardians."
                            />
                          ) : null}

                          <Alert severity="info" icon={<Info />}>
                            Routing affects Purchase, Funding and Online approvals.
                          </Alert>

                          <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={() => toast("Routing saved", "success")}
                            sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) }, py: 1.2 }}
                            fullWidth
                          >
                            Save routing
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2.2 }}>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">Emergency contacts</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Used for urgent incidents (school, fraud, safety).
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setContactOpen(true)}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                          >
                            Add
                          </Button>
                        </Stack>

                        <Divider sx={{ my: 1.6 }} />

                        <Stack spacing={1.2}>
                          {contacts.map((c) => (
                            <Card
                              key={c.id}
                              variant="outlined"
                              component={motion.div}
                              whileHover={{ y: -2 }}
                              sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}
                            >
                              <CardContent>
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                      {c.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {c.relation} • {c.phone}
                                    </Typography>
                                  </Box>
                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<Phone />}
                                      onClick={() => toast(`Calling ${c.phone} (demo)`, "info")}
                                      sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                    >
                                      Call
                                    </Button>
                                    <Button size="small" startIcon={<Close />} onClick={() => removeContact(c.id)}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>

                        <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                          Emergency contacts can receive incident exports from Notifications Center.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Container>

        {/* Invite flow drawer */}
        <Drawer anchor="right" open={inviteOpen} onClose={() => setInviteOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 600 } } }}>
          <Box sx={{ p: 2.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Invite co-guardian</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add a trusted person to manage the child wallet.
                </Typography>
              </Stack>
              <IconButton onClick={() => setInviteOpen(false)}>
                <Close />
              </IconButton>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stepper activeStep={inviteStep} alternativeLabel>
              {["Details", "Role", "Review"].map((s) => (
                <Step key={s}>
                  <StepLabel>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ my: 2 }} />

            {inviteStep === 0 ? (
              <Stack spacing={1.4}>
                <TextField label="Full name" value={inviteDraft.name} onChange={(e) => setInviteDraft((p) => ({ ...p, name: e.target.value }))} />
                <TextField label="Email" value={inviteDraft.email} onChange={(e) => setInviteDraft((p) => ({ ...p, email: e.target.value }))} />
                <TextField label="Phone (optional)" value={inviteDraft.phone} onChange={(e) => setInviteDraft((p) => ({ ...p, phone: e.target.value }))} />
                <TextField label="Message" value={inviteDraft.message} onChange={(e) => setInviteDraft((p) => ({ ...p, message: e.target.value }))} multiline minRows={3} />
              </Stack>
            ) : null}

            {inviteStep === 1 ? (
              <Stack spacing={1.4}>
                <TextField select label="Role" value={inviteDraft.role} onChange={(e) => setInviteDraft((p) => ({ ...p, role: e.target.value as Role }))}>
                  {(["Viewer", "Approver", "Funder", "Admin"] as const).map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>

                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                      Role capabilities
                    </Typography>
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.6}>
                      {roleCaps(inviteDraft.role).map((c, idx) => (
                        <Typography key={idx} variant="body2">
                          • {c}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Alert severity="info" icon={<Info />}>
                  Best practice: give only the permissions needed.
                </Alert>
              </Stack>
            ) : null}

            {inviteStep === 2 ? (
              <Stack spacing={1.4}>
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", 0.72) }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Review</Typography>
                    <Divider sx={{ my: 1.2 }} />
                    <Typography variant="body2"><b>Name:</b> {inviteDraft.name || "—"}</Typography>
                    <Typography variant="body2"><b>Email:</b> {inviteDraft.email || "—"}</Typography>
                    <Typography variant="body2"><b>Role:</b> {inviteDraft.role}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><b>Message:</b></Typography>
                    <Typography variant="body2" color="text.secondary">{inviteDraft.message || "—"}</Typography>
                  </CardContent>
                </Card>

                <Alert severity="warning" icon={<WarningAmber />}>
                  Invites are logged. Revoked users lose access immediately.
                </Alert>
              </Stack>
            ) : null}

            <Divider sx={{ my: 2 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button fullWidth variant="outlined" startIcon={<ArrowForward />} onClick={backInvite} disabled={inviteStep === 0}>
                Back
              </Button>
              {inviteStep < 2 ? (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={nextInvite}
                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={sendInvite}
                  sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                >
                  Send invite
                </Button>
              )}
            </Stack>
          </Box>
        </Drawer>

        {/* Add emergency contact dialog */}
        <Dialog open={contactOpen} onClose={() => setContactOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Add emergency contact</Typography>
                <Typography variant="body2" color="text.secondary">Used for urgent incidents and safety escalations.</Typography>
              </Stack>
              <IconButton onClick={() => setContactOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.4} sx={{ mt: 1 }}>
              <TextField label="Name" value={contactDraft.name} onChange={(e) => setContactDraft((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField label="Relation" value={contactDraft.relation} onChange={(e) => setContactDraft((p) => ({ ...p, relation: e.target.value }))} fullWidth />
              <TextField label="Phone" value={contactDraft.phone} onChange={(e) => setContactDraft((p) => ({ ...p, phone: e.target.value }))} fullWidth />
              <Alert severity="info" icon={<Info />}>In production, you can also add email contacts and call routing.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addContact}
              sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </AppShell>
    </ThemeProvider>
  );
}

function csvSafe(v: any) {
  const t = String(v ?? "");
  if (/[",\n]/.test(t)) return `"${t.replaceAll('"', '""')}"`;
  return t;
}
