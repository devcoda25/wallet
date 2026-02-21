import React, { useEffect, useMemo, useState } from "react";
import {
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
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Gavel from "@mui/icons-material/Gavel";
import Lock from "@mui/icons-material/Lock";
import Notifications from "@mui/icons-material/Notifications";
import Rule from "@mui/icons-material/Rule";
import Schedule from "@mui/icons-material/Schedule";
import Security from "@mui/icons-material/Security";
import Shield from "@mui/icons-material/Shield";
import Store from "@mui/icons-material/Store";
import Tune from "@mui/icons-material/Tune";
import { useEduWallet } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function ChildControls() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { children } = useEduWallet();

    const [loading, setLoading] = useState(true);

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 650);
        return () => clearTimeout(t);
    }, [childId]);

    const controlGroups = [
        { title: "Spending Limits", icon: <Gavel fontSize="small" />, desc: "Daily cap, per-transaction limit, and auto-refill.", route: "/limits" },
        { title: "Approval Rules", icon: <Rule fontSize="small" />, desc: "Set what needs your permission vs. what is auto-allowed.", route: "/rules" },
        { title: "Vendor & Category", icon: <Store fontSize="small" />, desc: "Restrict specific shops or categories like snacks.", route: "/vendors" },
        { title: "Schedule", icon: <Schedule fontSize="small" />, desc: "Limit card/QR use to school hours or specific days.", route: "/schedule" },
        { title: "Safety & Online", icon: <Security fontSize="small" />, desc: "Toggle online purchases and international use.", route: "/safety" },
        { title: "Nudges & Alerts", icon: <Notifications fontSize="small" />, desc: "Real-time alerts for spending or limit approaches.", route: "/nudges" },
    ];

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Parental Controls</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Configure limits, rules, and safety settings for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}/controls`)}
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
                                        if (sub === 'controls') return;
                                        const path = sub === 'overview' ? '' : `/${sub}`;
                                        navigate(`/parent/eduwallet/profile/${child.id}${path}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "Controls" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "Controls" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "Controls" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                            {controlGroups.map((g) => (
                                <Grid item xs={12} sm={6} md={4} key={g.title}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            height: '100%',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                borderColor: EVZ.green,
                                                bgcolor: alpha(EVZ.green, 0.02),
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                <Box sx={{ p: 1, bgcolor: alpha(EVZ.green, 0.1), color: EVZ.green, borderRadius: 2 }}>
                                                    {g.icon}
                                                </Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{g.title}</Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">{g.desc}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(EVZ.orange, 0.05), borderRadius: 4, border: `1px solid ${alpha(EVZ.orange, 0.1)}` }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, bgcolor: alpha(EVZ.orange, 0.1), color: EVZ.orange, borderRadius: 3 }}>
                                    <Lock />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Master Lock</Typography>
                                    <Typography variant="caption" color="text.secondary">Instantly pause all card and QR activities for this child.</Typography>
                                </Box>
                                <Switch color="warning" />
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
