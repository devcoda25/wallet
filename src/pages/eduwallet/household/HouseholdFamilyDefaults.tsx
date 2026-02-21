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
import Layers from "@mui/icons-material/Layers";
import Settings from "@mui/icons-material/Settings";
import Download from "@mui/icons-material/Download";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Info from "@mui/icons-material/Info";
import School from "@mui/icons-material/School";
import Shield from "@mui/icons-material/Shield";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function HouseholdFamilyDefaults() {
    const theme = useTheme();

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Family Settings Defaults</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Configure baseline rules for new child profiles.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button variant="outlined" startIcon={<Download />}>Export</Button>
                                <Button variant="contained" startIcon={<AutoAwesome />} sx={{ bgcolor: EVZ.green }}>Apply defaults</Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">Default Template</Typography>
                                        <Typography variant="body2" color="text.secondary">Select baseline rules by age group.</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <TextField select fullWidth label="Age Group" defaultValue="child">
                                                <MenuItem value="child">Child (Primary P1-P7)</MenuItem>
                                                <MenuItem value="teen">Teen (Secondary S1-S4)</MenuItem>
                                                <MenuItem value="adult">Young Adult (Senior S5-S6)</MenuItem>
                                            </TextField>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Campus-Only Mode</Typography>
                                                    <Typography variant="caption" color="text.secondary">Restrict to school vendors by default.</Typography>
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
                                        <Typography variant="h6">Notification Presets</Typography>
                                        <Typography variant="body2" color="text.secondary">Baseline alert settings for guardians.</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <TextField select fullWidth label="Alert Frequency" defaultValue="important">
                                                <MenuItem value="all">All Transactions</MenuItem>
                                                <MenuItem value="important">Approvals & Declines</MenuItem>
                                                <MenuItem value="critical">Emergency Only</MenuItem>
                                            </TextField>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">Quiet Hours</Typography>
                                                    <Typography variant="caption" color="text.secondary">Mute non-urgent alerts at night.</Typography>
                                                </Box>
                                                <Switch defaultChecked />
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
