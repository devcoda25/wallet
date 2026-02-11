// ============================================================================
// Beneficiaries Page - Payout Methods Management (w_08)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
    Plus,
    Search,
    Filter,
    Banknote,
    Smartphone,
    Building2,
    Edit3,
    Trash2,
    UserCheck,
    ShieldCheck,
} from "lucide-react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    InputAdornment,
    Chip,
    Button as MUIButton,
    Stack,
} from "@mui/material";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

// ============================================================================
// Types
// ============================================================================

type BeneficiaryType = "bank" | "mobile" | "china";
type BeneficiaryStatus = "Verified" | "Pending" | "Failed";
type LabelTag = "Salary" | "Business" | "Personal" | "Savings" | "Other";

interface Beneficiary {
    id: string;
    nickname: string;
    type: BeneficiaryType;
    currency: string;
    status: BeneficiaryStatus;
    detailsMasked: string;
    createdAt: string;
    cooling: "None" | "Cooling";
    labels: LabelTag[];
    isWhitelisted: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
    const map: Record<string, { light: string; dark: string }> = {
        good: { light: "#ecfdf5", dark: "#064e3b" },
        warn: { light: "#fffbeb", dark: "#78350f" },
        bad: { light: "#fff1f2", dark: "#881337" },
        info: { light: "#eff6ff", dark: "#1e3a8a" },
        neutral: { light: "#f8fafc", dark: "#1e293b" },
    };
    const textMap: Record<string, { light: string; dark: string }> = {
        good: { light: "#047857", dark: "#34d399" },
        warn: { light: "#b45309", dark: "#fbbf24" },
        bad: { light: "#e11d48", dark: "#fda4af" },
        info: { light: "#1d4ed8", dark: "#60a5fa" },
        neutral: { light: "#475569", dark: "#cbd5e1" },
    };
    return (
        <Chip
            label={label}
            size="small" className="dark:border dark:border-slate-600"
            sx={{
                backgroundColor: map[tone]?.light,
                color: textMap[tone]?.light,
                fontWeight: 600,
                fontSize: "0.75rem",
                "dark": {
                    backgroundColor: map[tone]?.dark,
                    color: textMap[tone]?.dark,
                },
            }}
        />
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Beneficiaries() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<BeneficiaryType | "all">("all");

    // Mock beneficiaries
    const beneficiaries = useMemo<Beneficiary[]>(
        () => [
            {
                id: "b1",
                nickname: "My MTN",
                type: "mobile",
                currency: "UGX",
                status: "Verified",
                detailsMasked: "****4567",
                createdAt: "2024-01-15",
                cooling: "None",
                labels: ["Personal"],
                isWhitelisted: true,
            },
            {
                id: "b2",
                nickname: "Salary Account",
                type: "bank",
                currency: "UGX",
                status: "Verified",
                detailsMasked: "****3456",
                createdAt: "2024-02-20",
                cooling: "None",
                labels: ["Salary", "Business"],
                isWhitelisted: true,
            },
            {
                id: "b3",
                nickname: "China Office",
                type: "china",
                currency: "CNY",
                status: "Pending",
                detailsMasked: "****8901",
                createdAt: "2024-03-10",
                cooling: "Cooling",
                labels: ["Business"],
                isWhitelisted: false,
            },
        ],
        []
    );

    const filteredBeneficiaries = useMemo(
        () =>
            beneficiaries.filter(
                (b) =>
                    b.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    (filterType === "all" || b.type === filterType)
            ),
        [beneficiaries, searchQuery, filterType]
    );

    const groupedByType = useMemo(
        () => ({
            mobile: filteredBeneficiaries.filter((b) => b.type === "mobile"),
            bank: filteredBeneficiaries.filter((b) => b.type === "bank"),
            china: filteredBeneficiaries.filter((b) => b.type === "china"),
        }),
        [filteredBeneficiaries]
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <SectionCard
                title="Beneficiaries"
                subtitle={`${beneficiaries.length} saved beneficiaries`}
                right={
                    <Button variant="primary">
                        <Plus className="h-4 w-4" /> Add
                    </Button>
                }
            />

            {/* Search and Filter */}
            <div className="mt-4 flex flex-col gap-2">
                <TextField
                    fullWidth
                    placeholder="Search beneficiaries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search className="h-5 w-5 text-slate-400" />
                            </InputAdornment>
                        ),
                    }}
                    variant="outlined"
                />
                <Stack direction="row" spacing={1}>
                    {(["all", "mobile", "bank", "china"] as const).map((type) => (
                        <Chip
                            key={type}
                            label={type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                            onClick={() => setFilterType(type)}
                            variant={filterType === type ? "filled" : "outlined"}
                            color={filterType === type ? "primary" : "default"}
                            sx={{ borderRadius: 2 }}
                        />
                    ))}
                </Stack>
            </div>

            {/* Beneficiary Cards */}
            {filteredBeneficiaries.length > 0 ? (
                <div className="mt-4 space-y-4">
                    {filteredBeneficiaries.map((b) => (
                        <Card key={b.id}>
                            <CardContent>
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`grid h-12 w-12 place-items-center rounded-2xl ${b.type === "bank"
                                                ? "bg-blue-50"
                                                : b.type === "mobile"
                                                    ? "bg-emerald-50"
                                                    : "bg-purple-50"
                                            }`}
                                    >
                                        {b.type === "bank" ? (
                                            <Building2 className="h-6 w-6 text-blue-600" />
                                        ) : b.type === "mobile" ? (
                                            <Smartphone className="h-6 w-6 text-emerald-600" />
                                        ) : (
                                            <Banknote className="h-6 w-6 text-purple-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Typography variant="h6" fontWeight="bold">
                                                {b.nickname}
                                            </Typography>
                                            {b.isWhitelisted && <Pill label="Whitelisted" tone="good" />}
                                        </div>
                                        <Typography variant="body2" color="text.secondary">
                                            {b.detailsMasked} • {b.currency}
                                        </Typography>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <Pill
                                                label={b.status}
                                                tone={b.status === "Verified" ? "good" : "warn"}
                                            />
                                            {b.cooling === "Cooling" && <Pill label="Cooling period" tone="warn" />}
                                            {b.labels.map((label) => (
                                                <Pill key={label} label={label} tone="neutral" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <MUIButton size="small" className="dark:border dark:border-slate-600" startIcon={<Edit3 className="h-4 w-4" />}>
                                            Edit
                                        </MUIButton>
                                        <MUIButton size="small" className="dark:border dark:border-slate-600" color="error" startIcon={<Trash2 className="h-4 w-4" />}>
                                            Delete
                                        </MUIButton>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <SectionCard title="No Beneficiaries" className="mt-4">
                    <div className="py-8 text-center">
                        <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
                        <Typography variant="h6" fontWeight="semibold" sx={{ mt: 2 }}>
                            No beneficiaries found
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {searchQuery
                                ? "Try a different search term"
                                : "Add your first beneficiary to get started"}
                        </Typography>
                    </div>
                </SectionCard>
            )}

            {/* Info Card */}
            <SectionCard title="About Beneficiaries" className="mt-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <UserCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                        <div>
                            <Typography variant="body2" fontWeight="medium">
                                Verification Required
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                All beneficiaries must be verified before first use
                            </Typography>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div>
                            <Typography variant="body2" fontWeight="medium">
                                Whitelisted Beneficiaries
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Whitelisted beneficiaries bypass cooling periods
                            </Typography>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </Box>
    );
}
