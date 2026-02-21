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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Download from "@mui/icons-material/Download";
import Info from "@mui/icons-material/Info";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import { useEduWallet, Transaction } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function fmtMoney(amount: number, currency: string) {
    try {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
    } catch {
        return `${amount} ${currency}`;
    }
}

export default function ChildActivity() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const { children, transactions } = useEduWallet();

    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 650);
        return () => clearTimeout(t);
    }, [childId]);

    const childTxns = useMemo(() =>
        transactions.filter((t) => t.childId === child.id)
            .filter(t => t.vendor.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()))
            .sort((a, b) => b.at - a.at)
        , [transactions, child.id, q]);

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Activity Hub</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Recent transactions and spending history for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}/activity`)}
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
                                        if (sub === 'activity') return;
                                        const path = sub === 'overview' ? '' : `/${sub}`;
                                        navigate(`/parent/eduwallet/profile/${child.id}${path}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "Activity" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "Activity" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "Activity" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search transactions..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button variant="outlined" startIcon={<Download />}>Export</Button>
                        </Stack>

                        {childTxns.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center', bgcolor: alpha(EVZ.ink, 0.02), borderRadius: 4 }}>
                                <Typography variant="subtitle1" color="text.secondary">No transactions found.</Typography>
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900 }}>Vendor</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {childTxns.map((t) => (
                                        <TableRow key={t.id} hover sx={{ cursor: 'pointer' }}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900 }}>{t.vendor}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={t.category} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900 }}>{fmtMoney(t.amount, t.currency)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={t.status}
                                                    sx={{
                                                        bgcolor: alpha(t.status === 'Approved' ? EVZ.green : EVZ.orange, 0.1),
                                                        color: t.status === 'Approved' ? EVZ.green : EVZ.orange,
                                                        fontWeight: 900
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(t.at).toLocaleDateString()} {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
