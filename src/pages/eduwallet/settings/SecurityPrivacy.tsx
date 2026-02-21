import React, { useState } from "react";
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
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Shield from "@mui/icons-material/Shield";
import Lock from "@mui/icons-material/Lock";
import Fingerprint from "@mui/icons-material/Fingerprint";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Notifications from "@mui/icons-material/Notifications";
import Info from "@mui/icons-material/Info";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function SecurityPrivacy() {
    const theme = useTheme();

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Security & Privacy</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage your data, session security, and privacy preferences.
                                </Typography>
                            </Box>

                            <Button variant="contained" startIcon={<Shield />} sx={{ bgcolor: EVZ.green }}>Security Audit</Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">Wallet Protection</Typography>
                                        <Typography variant="body2" color="text.secondary">Enhanced security for funding and withdrawals.</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Biometric Unlock</Typography>
                                                    <Typography variant="caption" color="text.secondary">Require fingerprint/FaceID for large top-ups.</Typography>
                                                </Box>
                                                <Switch defaultChecked />
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Transaction PIN</Typography>
                                                    <Typography variant="caption" color="text.secondary">Require 6-digit PIN for all approvals.</Typography>
                                                </Box>
                                                <Switch defaultChecked />
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">Privacy Settings</Typography>
                                        <Typography variant="body2" color="text.secondary">Control what data is shared with schools and vendors.</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Share Spending Insights</Typography>
                                                    <Typography variant="caption" color="text.secondary">Allow school to see aggregate spending categories.</Typography>
                                                </Box>
                                                <Switch defaultChecked />
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Hidden Balance</Typography>
                                                    <Typography variant="caption" color="text.secondary">Hide wallet balance on the landing page.</Typography>
                                                </Box>
                                                <Switch />
                                            </Stack>
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
