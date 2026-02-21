import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Info from "@mui/icons-material/Info";
import Notifications from "@mui/icons-material/Notifications";
import Payments from "@mui/icons-material/Payments";
import Search from "@mui/icons-material/Search";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import { useNavigate, useLocation } from "react-router-dom";
import { useEduWallet } from "../../../context/EduWalletContext";

/**
 * EduWallet Parent — Landing (Premium)
 * Route: /parent/eduwallet
 */

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  ink: "#0B1A17",
} as const;

function fmtMoney(amount: number, currency: string) {
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: 3,
        mb: 0.7,
        border: `1px solid ${active ? alpha(EVZ.green, 0.28) : alpha(EVZ.ink, 0.10)}`,
        bgcolor: active ? alpha(EVZ.green, 0.10) : alpha("#FFFFFF", 0.0),
        "&:hover": { bgcolor: alpha(EVZ.green, active ? 0.12 : 0.06) },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: alpha(active ? EVZ.green : EVZ.ink, active ? 0.14 : 0.06),
            color: active ? EVZ.green : "text.primary",
            border: `1px solid ${alpha(active ? EVZ.green : EVZ.ink, active ? 0.22 : 0.10)}`,
          }}
        >
          {icon}
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 950 }} />
      {typeof badge === "number" && badge > 0 ? (
        <Chip
          size="small"
          label={badge > 99 ? "99+" : badge}
          sx={{
            fontWeight: 950,
            bgcolor: alpha(EVZ.orange, 0.12),
            color: EVZ.orange,
            border: `1px solid ${alpha(EVZ.orange, 0.22)}`,
          }}
        />
      ) : null}
    </ListItemButton>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  loading,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "good" | "warn" | "neutral";
  loading?: boolean;
  onClick?: () => void;
}) {
  const toneColor = tone === "good" ? EVZ.green : tone === "warn" ? EVZ.orange : alpha(EVZ.ink, 0.7);

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden" }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(700px 260px at 15% 0%, ${alpha(toneColor, 0.22)}, transparent 60%)`,
        }}
      />
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.6} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? <Skeleton variant="rounded" height={36} width="70%" /> : <Typography variant="h5">{value}</Typography>}
            {loading ? <Skeleton variant="rounded" height={16} width="85%" /> : <Typography variant="caption" color="text.secondary">{hint}</Typography>}
          </Stack>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(toneColor, 0.12),
              color: toneColor,
              border: `1px solid ${alpha(toneColor, 0.22)}`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function EduWalletLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { children, approvals, alerts } = useEduWallet();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(t);
  }, []);

  const pendingApprovals = useMemo(() => approvals.filter((a) => a.status === "Pending"), [approvals]);
  const alertCount = useMemo(() => alerts.filter((a) => a.severity !== "info").length, [alerts]);

  const totals = useMemo(() => {
    const balancesByCurrency = children.reduce<Record<string, number>>((acc, c) => {
      acc[c.currency] = (acc[c.currency] ?? 0) + c.balance;
      return acc;
    }, {});
    const combined = Object.entries(balancesByCurrency)
      .map(([ccy, amt]) => fmtMoney(amt, ccy))
      .join(" • ");

    const needsConsent = children.filter((c) => c.status === "Needs consent").length;

    return { totalChildren: children.length, combined, needsConsent };
  }, [children]);

  // Determine active tab based on path
  const activeTab = useMemo(() => {
    if (location.pathname.includes("/search")) return "Search";
    if (location.pathname.includes("/notifications")) return "Notifications";
    if (location.pathname.includes("/children")) return "Children";
    return "Landing";
  }, [location.pathname]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
        gap: 2.2,
      }}
    >
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              EduWallet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Entry points
            </Typography>
            <Divider sx={{ my: 1.4 }} />
            <List disablePadding>
              <NavItem icon={<Payments fontSize="small" />} label="Landing" active={activeTab === "Landing"} onClick={() => navigate("/parent/eduwallet")} />
              <NavItem icon={<Search fontSize="small" />} label="Global Search" active={activeTab === "Search"} onClick={() => navigate("/parent/eduwallet/search")} />
              <NavItem
                icon={<Notifications fontSize="small" />}
                label="Notifications"
                active={activeTab === "Notifications"}
                badge={alertCount}
                onClick={() => navigate("/parent/eduwallet/notifications")}
              />
              <NavItem icon={<VerifiedUser fontSize="small" />} label="My Children" active={activeTab === "Children"} onClick={() => navigate("/parent/eduwallet/children")} />
            </List>
            <Divider sx={{ my: 1.4 }} />
            <Alert icon={<Info />} severity="info" sx={{ mb: 0 }}>
              Approvals waiting: <b>{pendingApprovals.length}</b>
            </Alert>
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>EduWallet Overview</Typography>
            <Typography variant="body2" color="text.secondary">Manage your children's school life and spending.</Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            <KpiCard
              label="Total Balance"
              value={totals.combined || "0 UGX"}
              hint={`${totals.totalChildren} accounts`}
              icon={<Payments />}
              tone="good"
              loading={loading}
            />
            <KpiCard
              label="Pending Approvals"
              value={pendingApprovals.length.toString()}
              hint={pendingApprovals.length > 0 ? "Action required" : "All caught up"}
              icon={<VerifiedUser />}
              tone={pendingApprovals.length > 0 ? "warn" : "neutral"}
              loading={loading}
              onClick={() => navigate("/parent/eduwallet/notifications")}
            />
            <KpiCard
              label="Consent Needed"
              value={totals.needsConsent.toString()}
              hint="New accounts"
              icon={<Info />}
              tone={totals.needsConsent > 0 ? "warn" : "neutral"}
              loading={loading}
              onClick={() => navigate("/parent/eduwallet/children")}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
