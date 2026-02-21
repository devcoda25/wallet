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
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Group from "@mui/icons-material/Group";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Download from "@mui/icons-material/Download";
import Info from "@mui/icons-material/Info";
import Phone from "@mui/icons-material/Phone";
import Close from "@mui/icons-material/Close";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Shield from "@mui/icons-material/Shield";
import { useEduWallet } from "../../../context/EduWalletContext";

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Role = "Viewer" | "Approver" | "Funder" | "Admin";

interface Member {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: "Active" | "Pending" | "Revoked";
}

export default function HouseholdManagement() {
    const theme = useTheme();
    const [members, setMembers] = useState<Member[]>([
        { id: "m1", name: "Ronald (You)", email: "ronald@example.com", role: "Admin", status: "Active" },
        { id: "m2", name: "Susan", email: "susan@example.com", role: "Approver", status: "Active" },
        { id: "m3", name: "Daisy", email: "daisy@example.com", role: "Funder", status: "Pending" },
    ]);

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={2.2}>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                            <Box>
                                <Typography variant="h5">Household & Guardians</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage family members and co-guardian permissions.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button variant="outlined" startIcon={<Download />}>Export</Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    sx={{ bgcolor: EVZ.green }}
                                >
                                    Invite Guardian
                                </Button>
                            </Stack>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ overflowX: "auto" }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900 }}>Member</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {members.map((m) => (
                                        <TableRow key={m.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: alpha(EVZ.green, 0.12), color: EVZ.green }}>{m.name[0]}</Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{m.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={m.role} size="small" sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={m.status}
                                                    size="small"
                                                    variant="outlined"
                                                    color={m.status === 'Active' ? 'success' : m.status === 'Pending' ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small">Manage</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>

                <Grid container spacing={2.2}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Approval Routing</Typography>
                                <Typography variant="body2" color="text.secondary">Configure how requests are routed between guardians.</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={2}>
                                    <TextField select fullWidth label="Routing Mode" defaultValue="either">
                                        <MenuItem value="either">Either guardian can approve</MenuItem>
                                        <MenuItem value="both">Both guardians required</MenuItem>
                                    </TextField>
                                    <Button variant="contained" fullWidth sx={{ bgcolor: EVZ.green }}>Save Routing</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Emergency Contacts</Typography>
                                <Typography variant="body2" color="text.secondary">Trusted contacts for urgent incident alerts.</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={1.5}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${alpha(EVZ.ink, 0.1)}`, borderRadius: 4 }}>
                                        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="subtitle2">School Security</Typography>
                                                <Typography variant="caption" color="text.secondary">+256 7xx xxx 333</Typography>
                                            </Box>
                                            <IconButton size="small"><Phone fontSize="small" /></IconButton>
                                        </Stack>
                                    </Box>
                                    <Button variant="outlined" fullWidth startIcon={<Add />}>Add Contact</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}

function Add(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
