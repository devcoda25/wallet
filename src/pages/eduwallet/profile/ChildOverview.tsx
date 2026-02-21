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
    LinearProgress,
    Stack,
    Skeleton,
    Typography,
    Tooltip,
    MenuItem,
    TextField,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Info from "@mui/icons-material/Info";
import Lock from "@mui/icons-material/Lock";
import Notifications from "@mui/icons-material/Notifications";
import Payments from "@mui/icons-material/Payments";
import Schedule from "@mui/icons-material/Schedule";
import Security from "@mui/icons-material/Security";
import Settings from "@mui/icons-material/Settings";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import WarningAmber from "@mui/icons-material/WarningAmber";
import Bolt from "@mui/icons-material/Bolt";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Refresh from "@mui/icons-material/Refresh";
import Share from "@mui/icons-material/Share";
import CreditCard from "@mui/icons-material/CreditCard";
import Add from "@mui/icons-material/Add";
import Store from "@mui/icons-material/Store";
import AccountBalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import History from "@mui/icons-material/History";
import Insights from "@mui/icons-material/Insights";
import ArrowBack from "@mui/icons-material/ArrowBack";
import MoreVert from "@mui/icons-material/MoreVert";
import Edit from "@mui/icons-material/Edit";
import QrCode2 from "@mui/icons-material/QrCode2";
import Download from "@mui/icons-material/Download";
import Print from "@mui/icons-material/Print";
import { useEduWallet, Child, ChildStatus } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function fmtMoney(amount: number, currency: string) {
    try {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
    } catch {
        return `${amount} ${currency}`;
    }
}

export default function ChildOverview() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { children, approvals, alerts, updateChild } = useEduWallet();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 650);
        return () => clearTimeout(t);
    }, [childId]);

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    const statusTone = child.status === "Active" ? EVZ.green : child.status === "Paused" ? alpha(EVZ.ink, 0.75) : EVZ.orange;

    const childApprovals = useMemo(() => approvals.filter(a => a.childId === child.id), [approvals, child.id]);
    const pendingApprovalsCount = childApprovals.filter(a => a.status === "Pending").length;

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Child Overview</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    High-level view of identity, balance, and activity for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}`)}
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
                                    startIcon={<Download />}
                                    sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                >
                                    Export
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
                                        if (sub === 'overview') return;
                                        navigate(`/parent/eduwallet/profile/${child.id}/${sub}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "Overview" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "Overview" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "Overview" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {child.status === "Paused" && (
                            <Alert severity="warning" icon={<Lock />} sx={{ mb: 2 }}>
                                Spending is paused for this child.
                            </Alert>
                        )}

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} lg={7}>
                                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(EVZ.green, 0.1), color: EVZ.green, fontSize: '1.5rem', fontWeight: 900 }}>
                                                {child.name[0]}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="h6">{child.name}</Typography>
                                                    <Chip size="small" label={child.status} sx={{ bgcolor: alpha(statusTone, 0.1), color: statusTone, fontWeight: 900 }} />
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary">{child.school} • {child.className}</Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" startIcon={<QrCode2 />} onClick={() => navigate(`/parent/eduwallet/profile/${child.id}/qr`)}>QR</Button>
                                                <Button variant="contained" sx={{ bgcolor: EVZ.green }}>Top Up</Button>
                                            </Stack>
                                        </Stack>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack direction="row" spacing={2}>
                                            <Chip icon={<Notifications fontSize="small" />} label={`${pendingApprovalsCount} Pending Approvals`} size="small" />
                                            <Chip icon={<Store fontSize="small" />} label="Approved Vendors Only" size="small" />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} lg={5}>
                                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">Current Balance</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>{fmtMoney(child.balance, child.currency)}</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">Daily Limit</Typography>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{fmtMoney(30000, child.currency)}</Typography>
                                            </Grid>
                                            <Grid item xs={6} textAlign="right">
                                                <Typography variant="caption" color="text.secondary">Used Today</Typography>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{fmtMoney(child.todaySpend, child.currency)}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Box sx={{ mt: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(child.todaySpend / 30000) * 100}
                                                sx={{ height: 8, borderRadius: 4, bgcolor: alpha(EVZ.ink, 0.05), "& .MuiLinearProgress-bar": { bgcolor: statusTone } }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
