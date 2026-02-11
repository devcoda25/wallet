// ============================================================================
// Organization Switcher Page
// Switch between organizations and manage memberships
// ============================================================================

import React, { useState } from 'react';
import {
    Building2,
    Users,
    Shield,
    CheckCircle,
    ChevronRight,
    Star,
    Settings,
    Plus,
    Search,
    Crown,
    Briefcase
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

// Types
interface OrganizationCardProps {
    id: string;
    name: string;
    role: string;
    group: string;
    status: 'Active' | 'Disabled' | 'Requires approval';
    isDefault?: boolean;
    isSelected?: boolean;
    onSelect: () => void;
}

function OrganizationCard({ id, name, role, group, status, isDefault, isSelected, onSelect }: OrganizationCardProps) {
    return (
        <div
            onClick={onSelect}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-slate-800'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <Building2 className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{name}</h3>
                            {isDefault && (
                                <Pill label="Default" tone="accent" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <Briefcase className="w-4 h-4" />
                            <span>{group}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span>{role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Pill
                        label={status}
                        tone={status === 'Active' ? 'good' : status === 'Disabled' ? 'bad' : 'warn'}
                    />
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
            </div>
        </div>
    );
}

export default function OrgSwitcher() {
    const { selectedOrg, organizations, switchOrganization, selectedOrgId } = useOrganization();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter organizations
    const filteredOrganizations = organizations.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.group.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeOrgs = filteredOrganizations.filter((org) => org.status === 'Active');
    const inactiveOrgs = filteredOrganizations.filter((org) => org.status !== 'Active');

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Organization Switcher</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Switch between your organizations or manage memberships
                    </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2 border-slate-300 dark:border-slate-600">
                    <Plus className="w-4 h-4" />
                    Add Organization
                </Button>
            </div>

            {/* Current Organization */}
            {selectedOrg && (
                <SectionCard title="Current Organization" subtitle="You are currently viewing">
                    <div className="flex items-center gap-4 p-4 mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedOrg.name}</h2>
                                <Pill
                                    label={selectedOrg.role}
                                    tone="info"
                                />
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    {selectedOrg.group}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shield className="w-4 h-4" />
                                    Cost Center: {selectedOrg.costCenter}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                            <Pill
                                label={selectedOrg.status}
                                tone={selectedOrg.status === 'Active' ? 'good' : 'warn'}
                            />
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Active Organizations */}
            <SectionCard title="Active Organizations" subtitle={`${activeOrgs.length} available`}>
                <div className="space-y-3 mt-4">
                    {activeOrgs.map((org) => (
                        <OrganizationCard
                            key={org.id}
                            id={org.id}
                            name={org.name}
                            role={org.role}
                            group={org.group}
                            status={org.status as 'Active' | 'Disabled' | 'Requires approval'}
                            isSelected={org.id === selectedOrgId}
                            onSelect={() => switchOrganization(org.id)}
                        />
                    ))}
                    {activeOrgs.length === 0 && (
                        <div className="text-center py-8">
                            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No active organizations found</p>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* Inactive Organizations */}
            {inactiveOrgs.length > 0 && (
                <SectionCard title="Inactive Organizations" subtitle={`${inactiveOrgs.length} unavailable`}>
                    <div className="space-y-3 mt-4">
                        {inactiveOrgs.map((org) => (
                            <OrganizationCard
                                key={org.id}
                                id={org.id}
                                name={org.name}
                                role={org.role}
                                group={org.group}
                                status={org.status as 'Active' | 'Disabled' | 'Requires approval'}
                                isSelected={org.id === selectedOrgId}
                                onSelect={() => { }}
                            />
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Organization Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeOrgs.length}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{inactiveOrgs.length}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Members</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{organizations.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <SectionCard title="Quick Actions" subtitle="Common organization tasks">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <div className="text-left">
                            <p className="font-medium text-slate-900 dark:text-slate-100">Set as Default</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Make this your primary organization</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Settings className="w-5 h-5 text-slate-500" />
                        <div className="text-left">
                            <p className="font-medium text-slate-900 dark:text-slate-100">Organization Settings</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manage organization details</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                            <p className="font-medium text-slate-900 dark:text-slate-100">Manage Members</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Add or remove team members</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        <div className="text-left">
                            <p className="font-medium text-slate-900 dark:text-slate-100">Roles & Permissions</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configure access levels</p>
                        </div>
                    </Button>
                </div>
            </SectionCard>

            {/* Need Help */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-amber-900 dark:text-amber-100">Need help with organization access?</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            If you need access to an organization that's not listed here, please contact your organization administrator or our support team.
                        </p>
                        <Button variant="outline" className="mt-3 text-sm border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


