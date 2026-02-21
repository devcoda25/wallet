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
    ListItemButton,
    ListItemText,
    ListItemSecondaryAction,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Help from "@mui/icons-material/Help";
import Forum from "@mui/icons-material/Forum";
import LiveHelp from "@mui/icons-material/LiveHelp";
import MenuBook from "@mui/icons-material/MenuBook";
import ContactSupport from "@mui/icons-material/ContactSupport";
import Send from "@mui/icons-material/Send";
import Info from "@mui/icons-material/Info";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

export default function HelpSupport() {
    const theme = useTheme();

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Help & Support</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Find answers, read guides, or contact our support team.
                                </Typography>
                            </Box>

                            <Button variant="contained" startIcon={<Forum />} sx={{ bgcolor: EVZ.green }}>Start Live Chat</Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.2}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" sx={{ mb: 1.5 }}>Frequently Asked Questions</Typography>
                                <Stack spacing={1.2}>
                                    {[
                                        "How do I top up my child's wallet?",
                                        "What happens if a card is lost?",
                                        "How do I set daily spending limits?",
                                        "Can I withdraw funds back to my mobile money?"
                                    ].map((q, i) => (
                                        <Card key={i} variant="outlined" sx={{ borderRadius: 4 }}>
                                            <ListItemButton component="div">
                                                <ListItemText primary={q} primaryTypographyProps={{ fontWeight: 600 }} />
                                                <Help sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            </ListItemButton>
                                        </Card>
                                    ))}
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ bgcolor: alpha(EVZ.green, 0.05), border: `1px solid ${alpha(EVZ.green, 0.2)}` }}>
                                    <CardContent>
                                        <Typography variant="h6">Contact Us</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Average response time: 5 minutes</Typography>
                                        <Stack spacing={1.5}>
                                            <Button fullWidth variant="outlined" startIcon={<ContactSupport />}>Email Support</Button>
                                            <Button fullWidth variant="outlined" startIcon={<MenuBook />}>User Manual</Button>
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
