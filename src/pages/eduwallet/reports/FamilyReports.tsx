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
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import BarChart from "@mui/icons-material/BarChart";
import PieChart from "@mui/icons-material/PieChart";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Download from "@mui/icons-material/Download";
import Print from "@mui/icons-material/Print";
import FilterAlt from "@mui/icons-material/FilterAlt";
import Info from "@mui/icons-material/Info";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function FamilyReports() {
    const theme = useTheme();

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Family Reports</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Analyze spending patterns and household trends.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button variant="outlined" startIcon={<Download />}>Export CSV</Button>
                                <Button variant="contained" startIcon={<Print />} sx={{ bgcolor: EVZ.green }}>Print PDF</Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">Total Spending (Term)</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>UGX 450,000</Typography>
                                        <Chip label="+12% from last term" size="small" color="success" />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">Top Category</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>Food & Cafe</Typography>
                                        <Typography variant="caption" color="text.secondary">45% of total spend</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">Limit Hits</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>8 Declines</Typography>
                                        <Typography variant="caption" color="text.secondary">Mostly per-txn limits</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, p: 3, bgcolor: alpha(EVZ.green, 0.05), borderRadius: 4, textAlign: 'center' }}>
                            <BarChart sx={{ fontSize: 60, color: EVZ.green, mb: 1.5 }} />
                            <Typography variant="h6">Spending Visualizations</Typography>
                            <Typography variant="body2" color="text.secondary">Detailed charts and breakdowns will appear here as transaction history grows.</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
