// ============================================================================
// Home Page - Unified Landing for Personal Wallet + CorporatePay
// ============================================================================

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet as WalletIcon,
  ChevronRight,
  Layers,
  Check,
  X,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Globe,
  ShoppingCart,
  Zap,
  Car,
  Building2,
} from "lucide-react";
import { Box, Typography, Card, CardContent, Grid, Button as MUIButton } from "@mui/material";
import { useWallet } from "@/context/WalletContext";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types (mirrored from w_01 for wallet cards)
// ============================================================================

type WalletStatus = "Active" | "Needs verification" | "Suspended" | "Deposit depleted";

interface SnapshotCard {
  id: string;
  title: string;
  subtitle: string;
  status: WalletStatus;
  role?: string;
  primaryBalanceLabel: string;
  secondaryHint: string;
  lastActiveLabel: string;
  why?: string;
}

interface AlertItem {
  id: string;
  tone: "info" | "warn" | "danger" | "success";
  title: string;
  message: string;
  cta: string;
}

interface LastAction {
  type: "Withdrawal" | "Top up" | "Approval";
  title: string;
  subtitle: string;
  status: "Pending" | "Needs action";
  nextStep: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMoney(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
}

function toneForStatus(s: WalletStatus): "good" | "warn" | "bad" | "info" {
  if (s === "Active") return "good";
  if (s === "Needs verification") return "warn";
  if (s === "Suspended") return "bad";
  return "warn";
}

function toneForAlert(t: AlertItem["tone"]): "good" | "warn" | "bad" | "info" {
  if (t === "success") return "good";
  if (t === "warn") return "warn";
  if (t === "danger") return "bad";
  return "info";
}

// ============================================================================
// Sub-Components
// ============================================================================

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${map[tone]}`}>
      {label}
    </span>
  );
}

function WalletCard({
  card,
  isActive,
  onOpen,
  onSetActive,
}: {
  card: SnapshotCard;
  isActive: boolean;
  onOpen: () => void;
  onSetActive: () => void;
}) {
  return (
    <motion.div
      layout
      className={`rounded-3xl border bg-white p-4 shadow-sm ${isActive ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{card.title}</div>
            <Pill label={card.status} tone={toneForStatus(card.status)} />
            {card.role && <Pill label={`Role: ${card.role}`} tone="neutral" />}
            {isActive && <Pill label="Current" tone="info" />}
          </div>
          <div className="mt-1 text-xs text-slate-500">{card.subtitle}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
          <WalletIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-500">Available</div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            {card.primaryBalanceLabel}
          </div>
          <div className="mt-1 text-xs text-slate-500">{card.secondaryHint}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-500">Last active</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{card.lastActiveLabel}</div>
          <div className="mt-1 text-xs text-slate-500">
            {card.why ? card.why : "Ready for payments and payouts"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant={isActive ? "primary" : "outline"} onClick={onSetActive}>
          {isActive ? <Check className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
          {isActive ? "Active context" : "Set as active"}
        </Button>
        <Button variant="outline" onClick={onOpen}>
          <ChevronRight className="h-4 w-4" /> Open
        </Button>
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  icon: Icon,
  label,
  onClick,
  color = "bg-slate-50",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Card
      sx={{
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
        transition: "background-color 0.2s",
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: "center", py: 2.5 }}>
        <div className={`mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
          <Icon className="h-6 w-6 text-slate-700" />
        </div>
        <Typography fontWeight="medium" variant="body2">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function AlertBanner({ alert, onCta }: { alert: AlertItem; onCta: () => void }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    bad: "bg-rose-50 border-rose-200 text-rose-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${map[alert.tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <div className="font-semibold">{alert.title}</div>
            <div className="mt-1 text-sm opacity-90">{alert.message}</div>
          </div>
        </div>
        <MUIButton size="small" variant="outlined" onClick={onCta}>
          {alert.cta}
        </MUIButton>
      </div>
    </div>
  );
}

function ContinueCard({ action, onClick }: { action: LastAction; onClick: () => void }) {
  const statusColor = action.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";
  const Icon = action.type === "Withdrawal" ? ArrowUpRight : action.type === "Top up" ? ArrowDownLeft : CreditCard;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${statusColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{action.title}</div>
        <div className="text-sm text-slate-500">{action.subtitle}</div>
        <div className="mt-1 text-xs text-slate-500">Next: {action.nextStep}</div>
      </div>
      <MUIButton size="small" variant="outlined" onClick={onClick}>
        Continue
      </MUIButton>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Home() {
  const navigate = useNavigate();
  const { balances, addToast } = useWallet();
  const { organizations, selectedOrg } = useOrganization();

  // Local state for wallet cards
  const [activeContextId, setActiveContextId] = useState<string>("personal");

  // Build wallet cards from context data
  const walletCards = useMemo<SnapshotCard[]>(() => {
    const cards: SnapshotCard[] = [
      {
        id: "personal",
        title: "Personal Wallet",
        subtitle: "Your EVzone wallet across all modules",
        status: "Active",
        primaryBalanceLabel: formatMoney(balances.find((b) => b.currency === "UGX")?.available || 0, "UGX"),
        secondaryHint: `${balances.length} currencies enabled`,
        lastActiveLabel: "Just now",
      },
    ];

    // Add corporate wallets
    organizations.forEach((org) => {
      cards.push({
        id: org.id,
        title: org.name,
        subtitle: `Corporate wallet • ${org.group}`,
        status: org.status === "Disabled" ? "Deposit depleted" : org.status === "Active" ? "Active" : "Needs verification",
        role: org.role,
        primaryBalanceLabel: formatMoney(5000000, "UGX"), // Mock balance
        secondaryHint: org.autoApprovalEligible ? "Auto-approval enabled" : "Approval required",
        lastActiveLabel: "2h ago",
        why: org.status === "Disabled" ? "CorporatePay paused until deposit is topped up" : undefined,
      });
    });

    return cards;
  }, [balances, organizations]);

  const activeContext = useMemo(() => walletCards.find((c) => c.id === activeContextId) || walletCards[0], [walletCards, activeContextId]);

  // Mock alerts
  const alerts = useMemo<AlertItem[]>(() => {
    if (selectedOrg?.status === "Disabled") {
      return [
        {
          id: "alert_1",
          tone: "warn",
          title: "Deposit depleted",
          message: "Top up your corporate wallet to resume payments",
          cta: "Add funds",
        },
      ];
    }
    return [];
  }, [selectedOrg]);

  // Mock continue actions
  const continueActions = useMemo<LastAction[]>(() => {
    // Mock pending withdrawal
    return [
      {
        type: "Withdrawal",
        title: "Withdrawal to MTN Mobile Money",
        subtitle: "UGX 250,000 • Pending approval",
        status: "Pending",
        nextStep: "Approve in pending requests",
      },
    ];
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome Back
      </Typography>

      {/* Wallet Cards */}
      <SectionCard
        title="Your Wallets"
        subtitle="Personal and corporate wallets"
        className="mt-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {walletCards.map((card) => (
            <WalletCard
              key={card.id}
              card={card}
              isActive={activeContext?.id === card.id}
              onOpen={() => {
                if (card.id === "personal") {
                  navigate("/wallet/dashboard");
                } else {
                  navigate("/corporate/hub");
                }
              }}
              onSetActive={() => setActiveContextId(card.id)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onCta={() => navigate("/wallet/add-money")}
            />
          ))}
        </div>
      )}

      {/* Continue Actions */}
      {continueActions.length > 0 && (
        <SectionCard title="Continue" subtitle="Pending actions" className="mt-4">
          <div className="space-y-3">
            {continueActions.map((action, i) => (
              <ContinueCard
                key={i}
                action={action}
                onClick={() => navigate("/corporate/requests")}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight="bold" gutterBottom className="mt-6">
        Quick Actions
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={ArrowDownLeft}
            label="Add Money"
            onClick={() => navigate("/wallet/add-money")}
            color="bg-emerald-50 text-emerald-700"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={ArrowUpRight}
            label="Send"
            onClick={() => navigate("/wallet/send")}
            color="bg-blue-50 text-blue-700"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={Globe}
            label="FX"
            onClick={() => navigate("/wallet/fx")}
            color="bg-purple-50 text-purple-700"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={Building2}
            label="Corporate"
            onClick={() => navigate("/corporate/hub")}
            color="bg-slate-50"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={ShoppingCart}
            label="Shop"
            onClick={() => navigate("/flows/ecommerce")}
            color="bg-orange-50 text-orange-700"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <QuickActionCard
            icon={Zap}
            label="EV Charge"
            onClick={() => navigate("/flows/charging")}
            color="bg-yellow-50 text-yellow-700"
          />
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: "primary.main", color: "white" }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Personal Wallet
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatMoney(balances.find((b) => b.currency === "UGX")?.available || 0, "UGX")}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {formatMoney(balances.find((b) => b.currency === "USD")?.available || 0, "USD")} USD
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: selectedOrg ? "success.main" : "warning.main",
              color: "white",
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                CorporatePay
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {selectedOrg?.name || "No Organization Selected"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {selectedOrg ? "✓ Eligible" : "⚠ Not Eligible"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Placeholder */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No recent transactions
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
