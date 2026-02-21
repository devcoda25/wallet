import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Badge,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Close from "@mui/icons-material/Close";
import Download from "@mui/icons-material/Download";
import FilterAlt from "@mui/icons-material/FilterAlt";
import Info from "@mui/icons-material/Info";
import Notifications from "@mui/icons-material/Notifications";
import Search from "@mui/icons-material/Search";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import WarningAmber from "@mui/icons-material/WarningAmber";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Delete from "@mui/icons-material/Delete";
import MoreVert from "@mui/icons-material/MoreVert";
import PushPin from "@mui/icons-material/PushPin";
import ReportProblem from "@mui/icons-material/ReportProblem";
import Snooze from "@mui/icons-material/Snooze";
import PlayCircle from "@mui/icons-material/PlayCircle";
import PauseCircle from "@mui/icons-material/PauseCircle";
import Settings from "@mui/icons-material/Settings";
import { useEduWallet, AlertEvent } from "../../../context/EduWalletContext";
import { useNavigate } from "react-router-dom";

/**
 * EduWallet Parent — Notifications Center (Premium)
 * Route: /parent/eduwallet/notifications
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Category = "Approvals" | "Transactions" | "Funding" | "Security" | "School" | "System";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function notifAvatar(n: AlertEvent, theme: any) {
  const isErr = n.severity === "error";
  const isWarn = n.severity === "warning";
  const color = isErr ? "#ff4d4f" : isWarn ? EVZ.orange : EVZ.green;

  return (
    <Avatar
      sx={{
        bgcolor: alpha(color, 0.12),
        color: color,
        border: `1px solid ${alpha(color, 0.22)}`,
      }}
    >
      {isErr ? <ReportProblem /> : isWarn ? <Info /> : <Notifications />}
    </Avatar>
  );
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

const ALL_CATEGORIES: Category[] = ["Approvals", "Transactions", "Funding", "Security", "School", "System"];

export default function EduWalletNotifications() {
  const theme = useTheme();
  // @ts-ignore
  const { alerts, dismissAlert, children } = useEduWallet();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [onlyIncidents, setOnlyIncidents] = useState(false);
  const [live, setLive] = useState(true);

  // Local state for "incidents" which are client-side only marking for now
  const [incidentIds, setIncidentIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!alerts) return [];

    return alerts
      .filter((n: AlertEvent) => {
        if (cat !== "All") {
          // Basic category mapping from title/body since AlertEvent doesn't have category yet
          // In a real app, AlertEvent should have a category field.
          const content = (n.title + n.body).toLowerCase();
          if (cat === "Approvals" && !content.includes("approv")) return false;
          if (cat === "Transactions" && !content.includes("purchase") && !content.includes("transac")) return false;
          if (cat === "Security" && !content.includes("sign-in") && !content.includes("security")) return false;
          // ... simpler mapping for now
        }
        return true;
      })
      .filter((n: AlertEvent) => (onlyIncidents ? incidentIds.has(n.id) : true))
      .filter((n: AlertEvent) => {
        if (!query) return true;
        return `${n.title} ${n.body}`.toLowerCase().includes(query);
      })
      .sort((a: AlertEvent, b: AlertEvent) => b.at - a.at);
  }, [alerts, cat, onlyIncidents, q, incidentIds]);

  const exportLogs = () => {
    const rows = ["id,severity,time,title,body"].join(",");
    const data = filtered.map((n: AlertEvent) =>
      [n.id, n.severity, new Date(n.at).toISOString(), n.title, n.body].map(csvSafe).join(",")
    );
    downloadText(`eduwallet_logs_${new Date().toISOString().slice(0, 10)}.csv`, [rows, ...data].join("\n"));
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr" }, // Full width for now
        gap: 2.2,
      }}
    >
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
            <Box>
              <Typography variant="h5">Notifications</Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time alerts, approvals, security signals and school updates.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={live ? "Pause live stream" : "Resume live stream"}>
                <IconButton onClick={() => setLive(!live)}>
                  {live ? <PauseCircle /> : <PlayCircle />}
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={exportLogs}
                sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}
              >
                Export
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                size="small"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notifications..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<ReportProblem />}
                onClick={() => setOnlyIncidents((v) => !v)}
                color={onlyIncidents ? "warning" : "inherit"}
              >
                {onlyIncidents ? "Incidents Only" : "Show All"}
              </Button>
            </Stack>

            <Tabs
              value={cat}
              onChange={(_, v) => setCat(v)}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              sx={{ "& .MuiTabs-indicator": { bgcolor: EVZ.green } }}
            >
              <Tab value="All" label="All" />
              {ALL_CATEGORIES.map((c) => (
                <Tab key={c} value={c} label={c} />
              ))}
            </Tabs>

            <List>
              {filtered.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No notifications found.
                </Typography>
              ) : (
                filtered.map((n: AlertEvent) => (
                  <ListItemButton
                    key={n.id}
                    sx={{
                      borderRadius: 3,
                      mb: 1,
                      border: `1px solid ${alpha(EVZ.ink, 0.1)}`,
                    }}
                  >
                    <ListItemAvatar>{notifAvatar(n, theme)}</ListItemAvatar>
                    <ListItemText
                      primary={n.title}
                      secondary={
                        <Stack direction="row" spacing={1} component="span" alignItems="center">
                          <Typography variant="caption" component="span">{n.body}</Typography>
                          <Typography variant="caption" color="text.secondary" component="span">\u2022 {timeAgo(n.at)}</Typography>
                        </Stack>
                      }
                    />
                    {/* @ts-ignore */}
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); dismissAlert(n.id); }}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                ))
              )}
            </List>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
