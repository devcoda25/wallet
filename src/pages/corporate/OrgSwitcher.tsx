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
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Building2 className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{name}</h3>
                            {isDefault && (
                                <Pill label="Default" tone="accent" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Briefcase className="w-4 h-4" />
                            <span>{group}</span>
                            <span className="text-gray-300">|</span>
                            <span>{role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Pill
                        label={status}
                        tone={status === 'Active' ? 'good' : status === 'Disabled' ? 'bad' : 'warn'}
                    />
                    <ChevronRight className="w-5 h-5 text-gray-400" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Organization Switcher</h1>
                    <p className="text-gray-500 mt-1">
                        Switch between your organizations or manage memberships
                    </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Organization
                </Button>
            </div>

            {/* Current Organization */}
            {selectedOrg && (
                <SectionCard title="Current Organization" subtitle="You are currently viewing">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mt-4">
                        <div className="p-4 bg-blue-100 rounded-lg">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900">{selectedOrg.name}</h2>
                                <Pill
                                    label={selectedOrg.role}
                                    tone="info"
                                />
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
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
                            <p className="text-sm text-gray-500">Status</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No active organizations found</p>
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
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-xl font-bold text-gray-900">{activeOrgs.length}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Shield className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Inactive</p>
                            <p className="text-xl font-bold text-gray-900">{inactiveOrgs.length}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Members</p>
                            <p className="text-xl font-bold text-gray-900">{organizations.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <SectionCard title="Quick Actions" subtitle="Common organization tasks">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Set as Default</p>
                            <p className="text-sm text-gray-500">Make this your primary organization</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Organization Settings</p>
                            <p className="text-sm text-gray-500">Manage organization details</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Manage Members</p>
                            <p className="text-sm text-gray-500">Add or remove team members</p>
                        </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4 h-auto">
                        <Shield className="w-5 h-5 text-green-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Roles & Permissions</p>
                            <p className="text-sm text-gray-500">Configure access levels</p>
                        </div>
                    </Button>
                </div>
            </SectionCard>

            {/* Need Help */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-amber-800">Need help with organization access?</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            If you need access to an organization that's not listed here, please contact your organization administrator or our support team.
                        </p>
                        <Button variant="outline" className="mt-3 text-sm">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
