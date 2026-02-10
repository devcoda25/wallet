// ============================================================================
// Organization Context - CorporatePay State Management
// ============================================================================

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type {
    Organization,
    Eligibility,
    BudgetHealth,
    Caps,
    Cap,
    PolicyDecision,
    OrgRole,
} from "@/types/corporate";

// -- Default Values --

const DEFAULT_ORGANIZATIONS: Organization[] = [
    {
        id: "org_acme",
        name: "Acme Group Ltd",
        role: "Employee",
        group: "Sales",
        status: "Active",
        eligible: true,
        costCenter: "SAL-03",
        autoApprovalEligible: false,
    },
    {
        id: "org_hosp",
        name: "City Hospital",
        role: "Coordinator",
        group: "Operations",
        status: "Disabled",
        disableReason: "Deposit depleted",
        eligible: true,
        costCenter: "OPS-01",
        autoApprovalEligible: true,
    },
    {
        id: "org_tour",
        name: "TourCo Ltd",
        role: "Employee",
        group: "Travel",
        status: "Requires approval",
        eligible: true,
        costCenter: "TRV-01",
        autoApprovalEligible: true,
    },
];

function calculateCaps(): Caps {
    return {
        daily: { limitUGX: 250000, usedUGX: 185000 },
        weekly: { limitUGX: 1200000, usedUGX: 920000 },
        monthly: { limitUGX: 5000000, usedUGX: 4100000 },
    };
}

// -- Context Interface --

interface OrganizationState {
    // Organizations
    organizations: Organization[];
    setOrganizations: (orgs: Organization[]) => void;
    addOrganization: (org: Organization) => void;
    removeOrganization: (id: string) => void;

    // Selected organization
    selectedOrgId: string | null;
    setSelectedOrgId: (id: string | null) => void;
    selectedOrg: Organization | null;

    // Computed state
    isEligible: boolean;
    eligibility: Eligibility;
    budgetHealth: BudgetHealth;
    caps: Caps;
    role: OrgRole | undefined;

    // Policy
    policyDecisions: PolicyDecision[];
    setPolicyDecisions: (decisions: PolicyDecision[]) => void;

    // Actions
    switchOrganization: (id: string) => void;
    refreshEligibility: () => void;
}

// -- Context --

const OrganizationContext = createContext<OrganizationState | null>(null);

// -- Provider --

interface OrganizationProviderProps {
    children: React.ReactNode;
    initialOrganizations?: Organization[];
}

export function OrganizationProvider({
    children,
    initialOrganizations = DEFAULT_ORGANIZATIONS,
}: OrganizationProviderProps) {
    const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
        initialOrganizations[0]?.id || null
    );
    const [policyDecisions, setPolicyDecisions] = useState<PolicyDecision[]>([]);

    const selectedOrg = useMemo(
        () => organizations.find((o) => o.id === selectedOrgId) || null,
        [organizations, selectedOrgId]
    );

    const isEligible = useMemo(
        () => (selectedOrg?.eligible ?? true) && selectedOrg?.status !== "Disabled",
        [selectedOrg]
    );

    const eligibility = useMemo((): Eligibility => {
        if (!selectedOrg) return "Not eligible";
        if (selectedOrg.status === "Disabled") return "Deposit depleted";
        if (!selectedOrg.eligible) return "Not eligible";
        return "Eligible";
    }, [selectedOrg]);

    const budgetHealth = useMemo((): BudgetHealth => {
        const caps = calculateCaps();
        const usage = caps.monthly.usedUGX / caps.monthly.limitUGX;
        if (usage >= 0.9) return "Blocked";
        if (usage >= 0.8) return "Near limit";
        return "Healthy";
    }, []);

    const caps = useMemo(() => calculateCaps(), []);

    const role = useMemo(() => selectedOrg?.role, [selectedOrg]);

    const addOrganization = useCallback((org: Organization) => {
        setOrganizations((prev) => [...prev, org]);
    }, []);

    const removeOrganization = useCallback((id: string) => {
        setOrganizations((prev) => prev.filter((o) => o.id !== id));
    }, []);

    const switchOrganization = useCallback((id: string) => {
        setSelectedOrgId(id);
    }, []);

    const refreshEligibility = useCallback(() => {
        // In production, this would call an API
        console.log("Refreshing eligibility...");
    }, []);

    const value: OrganizationState = useMemo(
        () => ({
            organizations,
            setOrganizations,
            addOrganization,
            removeOrganization,
            selectedOrgId,
            setSelectedOrgId,
            selectedOrg,
            isEligible,
            eligibility,
            budgetHealth,
            caps,
            role,
            policyDecisions,
            setPolicyDecisions,
            switchOrganization,
            refreshEligibility,
        }),
        [
            organizations,
            selectedOrgId,
            selectedOrg,
            isEligible,
            eligibility,
            budgetHealth,
            caps,
            role,
            policyDecisions,
            switchOrganization,
            refreshEligibility,
        ]
    );

    return (
        <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
    );
}

// -- Hook --

export function useOrganization(): OrganizationState {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error("useOrganization must be used within an OrganizationProvider");
    }
    return context;
}

// -- Selectors --

export function useCurrentOrganization(): Organization | null {
    const { selectedOrg } = useOrganization();
    return selectedOrg;
}

export function useOrganizationEligibility(): Eligibility {
    const { eligibility } = useOrganization();
    return eligibility;
}

export function useOrganizationCaps(): Caps {
    const { caps } = useOrganization();
    return caps;
}

export function useIsOrganizationEligible(): boolean {
    const { isEligible } = useOrganization();
    return isEligible;
}

export function useOrganizationBudgetHealth(): BudgetHealth {
    const { budgetHealth } = useOrganization();
    return budgetHealth;
}

function pct(used: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.round((used / limit) * 100);
}

export function useCapPercentage(): {
    daily: number;
    weekly: number;
    monthly: number;
} {
    const { caps } = useOrganization();
    return {
        daily: pct(caps.daily.usedUGX, caps.daily.limitUGX),
        weekly: pct(caps.weekly.usedUGX, caps.weekly.limitUGX),
        monthly: pct(caps.monthly.usedUGX, caps.monthly.limitUGX),
    };
}
