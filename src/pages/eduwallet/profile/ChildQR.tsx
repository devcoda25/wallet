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
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Download from "@mui/icons-material/Download";
import Info from "@mui/icons-material/Info";
import Lock from "@mui/icons-material/Lock";
import Print from "@mui/icons-material/Print";
import QrCode2 from "@mui/icons-material/QrCode2";
import Security from "@mui/icons-material/Security";
import Share from "@mui/icons-material/Share";
import Shield from "@mui/icons-material/Shield";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import WarningAmber from "@mui/icons-material/WarningAmber";
import { useEduWallet, Child } from "../../../context/EduWalletContext";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

function hashToInt(input: string) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

function buildPseudoQrSvg(value: string, size = 260) {
    const grid = 25;
    const seed = hashToInt(value);

    const isFinder = (r: number, c: number) => {
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= grid - 7;
        const inBL = r >= grid - 7 && c < 7;
        return inTL || inTR || inBL;
    };

    const cell = size / grid;
    const rects: string[] = [];
    for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
            let on = false;
            if (isFinder(r, c)) {
                const rr = r % 7;
                const cc = c % 7;
                on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
            } else {
                const n = (seed + r * 97 + c * 193) % 11;
                on = n === 0 || n === 2 || n === 7;
            }
            if (on) rects.push(`<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="${EVZ.ink}"/>`);
        }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="20" ry="20" fill="white"/>
  <g transform="translate(10,10)">
    <rect x="0" y="0" width="${size - 20}" height="${size - 20}" fill="white"/>
    ${rects.join("\n")}
  </g>
</svg>`;
}

export default function ChildQR() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { children } = useEduWallet();

    const child = useMemo(() => children.find((c) => c.id === childId) || children[0], [children, childId]);

    const [qrEnabled, setQrEnabled] = useState(true);
    const [qrMode, setQrMode] = useState<"Static" | "Dynamic">("Dynamic");
    const [rotationMinutes, setRotationMinutes] = useState(30);
    const [token, setToken] = useState<string>(() => `tok_${Math.floor(100000 + Math.random() * 899999)}`);

    const qrPayload = useMemo(() => {
        const base = `eduwallet://student/${child.id}`;
        if (qrMode === "Static") return `${base}?static=1`;
        return `${base}?token=${token}`;
    }, [child.id, qrMode, token]);

    const svg = useMemo(() => buildPseudoQrSvg(qrPayload, 260), [qrPayload]);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) { }
    };

    const rotateNow = () => {
        setToken(`tok_${Math.floor(100000 + Math.random() * 899999)}`);
    };

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">QR / Student ID</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage student QR for scanning and verification for {child.name}.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Switch Child"
                                    value={child.id}
                                    onChange={(e) => navigate(`/parent/eduwallet/profile/${e.target.value}/qr`)}
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
                                        if (sub === 'qr') return;
                                        const path = sub === 'overview' ? '' : `/${sub}`;
                                        navigate(`/parent/eduwallet/profile/${child.id}${path}`);
                                    }}
                                    sx={{
                                        fontWeight: 900,
                                        bgcolor: tab === "QR / ID" ? alpha(EVZ.green, 0.1) : "transparent",
                                        color: tab === "QR / ID" ? EVZ.green : "text.secondary",
                                        border: `1px solid ${tab === "QR / ID" ? alpha(EVZ.green, 0.2) : alpha(EVZ.ink, 0.1)}`,
                                    }}
                                />
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {!qrEnabled && (
                            <Alert severity="warning" icon={<Lock />} sx={{ mb: 2 }}>
                                QR is disabled. Scans will be rejected.
                            </Alert>
                        )}

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} lg={7}>
                                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="h6">QR Generator</Typography>
                                                <Typography variant="body2" color="text.secondary">Payload: {qrPayload}</Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1}>
                                                <Button size="small" variant="outlined" onClick={() => copy(qrPayload)}>Copy</Button>
                                                <Button size="small" variant="outlined" onClick={rotateNow} disabled={!qrEnabled || qrMode !== "Dynamic"}>Rotate</Button>
                                            </Stack>
                                        </Stack>
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ display: 'grid', placeItems: 'center', p: 4, bgcolor: alpha(EVZ.ink, 0.02), borderRadius: 4 }}>
                                            <Box
                                                sx={{ p: 2, bgcolor: 'white', borderRadius: 4, border: `1px solid ${alpha(EVZ.ink, 0.1)}`, display: 'inline-block' }}
                                                dangerouslySetInnerHTML={{ __html: svg }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} lg={5}>
                                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography variant="h6">Security Settings</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Enable QR</Typography>
                                                    <Typography variant="caption" color="text.secondary">Allow vendors to scan this ID</Typography>
                                                </Box>
                                                <Switch checked={qrEnabled} onChange={(e) => setQrEnabled(e.target.checked)} />
                                            </Stack>
                                            <Divider />
                                            <Box>
                                                <Typography variant="subtitle2">QR Mode</Typography>
                                                <TextField
                                                    select
                                                    size="small"
                                                    fullWidth
                                                    sx={{ mt: 1 }}
                                                    value={qrMode}
                                                    onChange={(e) => setQrMode(e.target.value as any)}
                                                >
                                                    <MenuItem value="Static">Static (Persistent)</MenuItem>
                                                    <MenuItem value="Dynamic">Dynamic (Time-based)</MenuItem>
                                                </TextField>
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
