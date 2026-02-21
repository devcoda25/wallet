import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import Gavel from "@mui/icons-material/Gavel";
import Info from "@mui/icons-material/Info";
import Notifications from "@mui/icons-material/Notifications";
import Rule from "@mui/icons-material/Rule";
import Settings from "@mui/icons-material/Settings";
import Store from "@mui/icons-material/Store";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import { useEduWallet, Approval } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function fmtMoney(amount: number, currency: string) {
    try {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
    } catch {
        return `${amount} ${currency}`;
    }
}

export default function ChildApprovals() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { children, approvals, approveRequest, declineRequest } = useEduWallet();

    const [loading, setLoading] = useState(true);

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 650);
        return () => clearTimeout(t);
    }, [childId]);

    const childApprovals = useMemo(() => approvals.filter((a) => a.childId === child.id), [approvals, child.id]);
    const pending = useMemo(() => childApprovals.filter(a => a.status === 'Pending'), [childApprovals]);

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Approvals Queue</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Review and manage pending requests for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}/approvals`)}
                                    sx={{ minWidth: 200 }}
                                >
                                    {children.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowForward />}
                                    onClick={() => navigate(`/parent/eduwallet/profile/${child.id}`)}
                                    sx={{ borderColor: alpha(EVZ.ink, 0.2), color: "text.primary" }}
                                >
                                    Overview
                                </Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {["Overview", "QR / ID", "Activity", "Approvals", "Funding", "Controls"].map((tab) => (
                                <Chip
                                    key={tab}
                                    label={tab}
                                    clickable
                                    onClick={() => {
                                        const sub = tab.toLowerCase().split(' ')[0];
                                        if (sub === 'approvals') return;
                                        const path = sub === 'overview' ? '' : `/${sub}`;
                                        navigate(`/parent/eduwallet/profile/${child.id}${path}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "Approvals" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "Approvals" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "Approvals" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {pending.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center', bgcolor: alpha(EVZ.green, 0.05), borderRadius: 4, border: `1px dashed ${alpha(EVZ.green, 0.2)}` }}>
                                <Typography variant="subtitle1" sx={{ color: EVZ.green, fontWeight: 900 }}>All caught up! No pending approvals.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {pending.map((a) => (
                                    <Grid item xs={12} md={6} key={a.id}>
                                        <Card variant="outlined" sx={{ borderRadius: 4 }}>
                                            <CardContent>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={{ p: 1, bgcolor: alpha(EVZ.orange, 0.1), color: EVZ.orange, borderRadius: 2 }}>
                                                        <Notifications fontSize="small" />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{a.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{a.vendor}</Typography>
                                                    </Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{fmtMoney(a.amount, a.currency)}</Typography>
                                                </Stack>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button size="small" variant="outlined" color="inherit" onClick={() => declineRequest(a.id)}>Decline</Button>
                                                    <Button size="small" variant="contained" sx={{ bgcolor: EVZ.green }} onClick={() => approveRequest(a.id)}>Approve</Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
