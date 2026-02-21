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
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Receipt from "@mui/icons-material/Receipt";
import Description from "@mui/icons-material/Description";
import Download from "@mui/icons-material/Download";
import Search from "@mui/icons-material/Search";
import Visibility from "@mui/icons-material/Visibility";
import FilterList from "@mui/icons-material/FilterList";
import Info from "@mui/icons-material/Info";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function HouseholdReceipts() {
    const theme = useTheme();

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Receipts & Documents</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Access digital receipts and termly spending exports.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button variant="outlined" startIcon={<FilterList />}>Filter</Button>
                                <Button variant="contained" startIcon={<Download />} sx={{ bgcolor: EVZ.green }}>Bulk Download</Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <TextField
                            fullWidth
                            placeholder="Search by vendor or date..."
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />

                        <List>
                            {[1, 2, 3].map((i) => (
                                <Card key={i} variant="outlined" sx={{ mb: 1.5, borderRadius: 4 }}>
                                    <ListItem secondaryAction={
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small"><Visibility /></IconButton>
                                            <IconButton size="small"><Download /></IconButton>
                                        </Stack>
                                    }>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: alpha(EVZ.green, 0.1), color: EVZ.green }}>
                                                <Receipt />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`School Canteen Receipt #${1024 + i}`}
                                            secondary={`Feb ${12 + i}, 2026 • UGX 12,500`}
                                            primaryTypographyProps={{ fontWeight: 700 }}
                                        />
                                    </ListItem>
                                </Card>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
}
