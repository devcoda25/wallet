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
    InputAdornment,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CreditCard from "@mui/icons-material/CreditCard";
import Download from "@mui/icons-material/Download";
import Info from "@mui/icons-material/Info";
import LocalAtm from "@mui/icons-material/LocalAtm";
import Payments from "@mui/icons-material/Payments";
import Savings from "@mui/icons-material/Savings";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import { useEduWallet, Child } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function fmtMoney(amount: number, currency: string) {
    try {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
    } catch {
        return `${amount} ${currency}`;
    }
}

export default function ChildFunding() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { children, updateChild } = useEduWallet();

    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState("20000");

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 650);
        return () => clearTimeout(t);
    }, [childId]);

    const handleTopUp = () => {
        const amt = parseInt(topUpAmount, 10);
        if (isNaN(amt) || amt <= 0) return;
        updateChild(child.id, { balance: child.balance + amt });
        setTopUpAmount("0");
    };

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Funding & Allowance</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage funds and scheduled allowances for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}/funding`)}
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
                                        if (sub === 'funding') return;
                                        const path = sub === 'overview' ? '' : `/${sub}`;
                                        navigate(`/parent/eduwallet/profile/${child.id}${path}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "Funding" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "Funding" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "Funding" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ height: '100%', borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography variant="h6">One-Time Top Up</Typography>
                                        <Typography variant="caption" color="text.secondary">Add funds instantly to {child.name}'s wallet.</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <TextField
                                                fullWidth
                                                label="Amount"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start">{child.currency}</InputAdornment> }}
                                            />
                                            <Button variant="contained" fullWidth size="large" sx={{ bgcolor: EVZ.green }} onClick={handleTopUp}>
                                                Send Funds
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ height: '100%', borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography variant="h6">Funding Status</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Current Balance</Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{fmtMoney(child.balance, child.currency)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Default Funding Source</Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CreditCard fontSize="small" color="action" />
                                                    <Typography variant="subtitle2">EVzone Wallet (Verified)</Typography>
                                                </Stack>
                                            </Box>
                                        </Stack>
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
