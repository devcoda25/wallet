import React, { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    LinearProgress,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    MenuItem,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Switch,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Add from "@mui/icons-material/Add";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import Download from "@mui/icons-material/Download";
import FilterAlt from "@mui/icons-material/FilterAlt";
import PauseCircle from "@mui/icons-material/PauseCircle";
import PlayCircle from "@mui/icons-material/PlayCircle";
import QrCode2 from "@mui/icons-material/QrCode2";
import Search from "@mui/icons-material/Search";
import Settings from "@mui/icons-material/Settings";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import WarningAmber from "@mui/icons-material/WarningAmber";
import { useEduWallet, Child, ChildStatus } from "../../../context/EduWalletContext";
import { useNavigate } from "react-router-dom";

/**
 * EduWallet Parent - My Children Dashboard (Premium)
 * Route: /parent/eduwallet/children
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function fmtMoney(amount: number, currency: string) {
    try {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
    } catch {
        return `${amount} ${currency}`;
    }
}

function csvSafe(v: any) {
    const t = String(v ?? "");
    if (/[",\n]/.test(t)) return `"${t.replaceAll('"', '""')}"`;
    return t;
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

export default function ChildrenDashboard() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { children, updateChild } = useEduWallet();

    const [loading, setLoading] = useState(true);
    const [adminGuardian, setAdminGuardian] = useState(true);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState<ChildStatus | "All">("All");
    const [school, setSchool] = useState<string>("");
    const [className, setClassName] = useState<string>("");

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 750);
        return () => clearTimeout(t);
    }, []);

    const schools = useMemo(() => Array.from(new Set(children.map((c) => c.school))).sort(), [children]);
    const classes = useMemo(() => Array.from(new Set(children.map((c) => c.className))).sort(), [children]);

    const consentKids = useMemo(() => children.filter((c) => c.status === "Needs consent"), [children]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return children
            .filter((c) => (status === "All" ? true : c.status === status))
            .filter((c) => (school ? c.school === school : true))
            .filter((c) => (className ? c.className === className : true))
            .filter((c) => {
                if (!query) return true;
                return `${c.name} ${c.school} ${c.className} ${c.stream ?? ""}`.toLowerCase().includes(query);
            });
    }, [children, q, status, school, className]);

    const selectedCount = selectedIds.size;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const bulkSetStatus = (to: ChildStatus) => {
        if (!adminGuardian) return;
        if (selectedIds.size === 0) return;

        selectedIds.forEach(id => updateChild(id, { status: to }));
        clearSelection();
    };

    const exportChildren = (subset?: Child[]) => {
        const list = subset ?? filtered;
        const rows: string[] = [];
        rows.push(["id", "name", "school", "class", "stream", "status", "balance", "guardians", "verified"].join(","));
        for (const c of list) {
            rows.push(
                [
                    c.id,
                    c.name,
                    c.school,
                    c.className,
                    c.stream ?? "",
                    c.status,
                    fmtMoney(c.balance, c.currency),
                    String(c.guardians),
                    c.schoolVerified ? "yes" : "no",
                ]
                    .map(csvSafe)
                    .join(",")
            );
        }
        downloadText(`eduwallet_children_${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"));
    };

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">My Children</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage profiles, QR, approvals, funding, controls and activity.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Card
                                    variant="outlined"
                                    sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <VerifiedUser fontSize="small" />
                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                            Admin guardian
                                        </Typography>
                                        <Switch size="small" checked={adminGuardian} onChange={(e) => setAdminGuardian(e.target.checked)} />
                                    </Stack>
                                </Card>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => navigate("/parent/eduwallet/children/add")}
                                    sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
                                >
                                    Add child
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Download />}
                                    onClick={() => exportChildren()}
                                    sx={{ borderColor: alpha(EVZ.green, 0.35), color: EVZ.green }}
                                >
                                    Export
                                </Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {consentKids.length > 0 && (
                            <Card
                                variant="outlined"
                                sx={{
                                    bgcolor: alpha(EVZ.orange, 0.06),
                                    borderColor: alpha(EVZ.orange, 0.28),
                                    mb: 2,
                                }}
                            >
                                <CardContent>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
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
                                                <WarningAmber fontSize="small" />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                                    Consent required
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {consentKids.length} child profile(s) need guardian consent.
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate("/parent/eduwallet/children/consent")}
                                            sx={{ bgcolor: EVZ.green }}
                                        >
                                            Review
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search children..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    select
                                    size="small"
                                    label="Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="All">All</MenuItem>
                                    {["Active", "Paused", "Restricted", "Needs consent"].map((s) => (
                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                        </Stack>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <Grid item xs={12} md={6} lg={4} key={i}>
                                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                                    </Grid>
                                ))
                            ) : filtered.map((c) => (
                                <Grid item xs={12} md={6} lg={4} key={c.id}>
                                    <ChildCard
                                        child={c}
                                        selectable={adminGuardian}
                                        selected={selectedIds.has(c.id)}
                                        onToggleSelect={() => toggleSelect(c.id)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}

function ChildCard({ child, selectable, selected, onToggleSelect }: { child: Child, selectable: boolean, selected: boolean, onToggleSelect: () => void }) {
    const navigate = useNavigate();
    const statusColor = child.status === "Active" ? EVZ.green : child.status === "Paused" ? alpha(EVZ.ink, 0.4) : EVZ.orange;

    return (
        <Card variant="outlined" sx={{ borderRadius: 4, position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, bgcolor: statusColor }} />
            <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {selectable && <Checkbox size="small" checked={selected} onChange={onToggleSelect} />}
                    <Avatar sx={{ bgcolor: alpha(EVZ.green, 0.1), color: EVZ.green, fontWeight: 900 }}>{child.name[0]}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap>{child.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{child.school} • {child.className}</Typography>
                    </Box>
                    <Chip size="small" label={child.status} sx={{ bgcolor: alpha(statusColor, 0.1), color: statusColor, fontWeight: 900 }} />
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between">
                    <Box>
                        <Typography variant="caption" color="text.secondary">Balance</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{fmtMoney(child.balance, child.currency)}</Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">Daily Spend</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{fmtMoney(child.todaySpend, child.currency)}</Typography>
                    </Box>
                </Stack>

                <Box sx={{ mt: 1.5 }}>
                    <LinearProgress
                        variant="determinate"
                        value={45}
                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(EVZ.ink, 0.05), "& .MuiLinearProgress-bar": { bgcolor: statusColor } }}
                    />
                </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button size="small" onClick={() => navigate(`/parent/eduwallet/profile/${child.id}`)}>View Profile</Button>
                <Button size="small" onClick={() => navigate(`/parent/eduwallet/profile/${child.id}/qr`)}>Student ID</Button>
            </CardActions>
        </Card>
    );
}
