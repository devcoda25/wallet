// ============================================================================
// Policies Summary Page
// Company policies and compliance rules
// ============================================================================

import React, { useState } from 'react';
import {
    FileText,
    Shield,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

// Types
interface Policy {
    id: string;
    title: string;
    description: string;
    category: 'spending' | 'approval' | 'compliance' | 'security';
    status: 'active' | 'pending' | 'deprecated';
    lastUpdated: string;
    requiresAttention: boolean;
}

interface ComplianceItem {
    id: string;
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'pending';
    details: string;
}

// Sample data
const samplePolicies: Policy[] = [
    {
        id: '1',
        title: 'Travel Expense Policy',
        description: 'All travel expenses must be pre-approved for trips over $500. Receipts required for expenses over $50.',
        category: 'spending',
        status: 'active',
        lastUpdated: '2024-01-10',
        requiresAttention: false,
    },
    {
        id: '2',
        title: 'Approval Workflow for Large Transactions',
        description: 'Transactions exceeding $5,000 require dual approval from department head and finance.',
        category: 'approval',
        status: 'active',
        lastUpdated: '2024-01-08',
        requiresAttention: true,
    },
    {
        id: '3',
        title: 'Data Security & Privacy',
        description: 'All financial data must be encrypted at rest and in transit. Multi-factor authentication required.',
        category: 'security',
        status: 'active',
        lastUpdated: '2024-01-05',
        requiresAttention: false,
    },
    {
        id: '4',
        title: 'Expense Categorization',
        description: 'All expenses must be categorized according to the corporate chart of accounts.',
        category: 'compliance',
        status: 'active',
        lastUpdated: '2024-01-02',
        requiresAttention: false,
    },
    {
        id: '5',
        title: 'Vendor Management Policy',
        description: 'New vendors must be vetted and added to the approved vendor list before processing payments.',
        category: 'compliance',
        status: 'pending',
        lastUpdated: '2023-12-20',
        requiresAttention: false,
    },
];

const sampleCompliance: ComplianceItem[] = [
    { id: '1', requirement: 'Expense Receipt Compliance', status: 'compliant', details: '98% of expenses have proper receipts' },
    { id: '2', requirement: 'Approval Workflow Compliance', status: 'compliant', details: 'All transactions properly approved' },
    { id: '3', requirement: 'Budget Utilization', status: 'pending', details: 'Reviewing Q1 budget allocations' },
    { id: '4', requirement: 'Vendor Verification', status: 'non-compliant', details: '3 vendors pending verification' },
];

export default function Policies() {
    const { selectedOrg } = useOrganization();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

    // Filter policies
    const filteredPolicies = samplePolicies.filter((policy) => {
        const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            policy.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || policy.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get status badge
    const getStatusBadge = (status: Policy['status'], requiresAttention: boolean) => {
        if (requiresAttention) {
            return <Pill label="Needs Attention" tone="warn" />;
        }
        switch (status) {
            case 'active':
                return <Pill label="Active" tone="good" />;
            case 'pending':
                return <Pill label="Pending" tone="info" />;
            case 'deprecated':
                return <Pill label="Deprecated" tone="bad" />;
        }
    };

    // Get category icon
    const getCategoryIcon = (category: Policy['category']) => {
        switch (category) {
            case 'spending':
                return <FileText className="w-5 h-5 text-blue-500" />;
            case 'approval':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'compliance':
                return <Shield className="w-5 h-5 text-purple-500" />;
            case 'security':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    // Get compliance status badge
    const getComplianceBadge = (status: ComplianceItem['status']) => {
        switch (status) {
            case 'compliant':
                return <Pill label="Compliant" tone="good" />;
            case 'pending':
                return <Pill label="Pending" tone="warn" />;
            case 'non-compliant':
                return <Pill label="Non-Compliant" tone="bad" />;
        }
    };

    return (
        <div className="space-y-6 p-6 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Policies Summary</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Company policies and compliance status
                    </p>
                </div>
                <Button variant="primary" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Download Policy Guide
                </Button>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Compliant</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">2</p>
                        </div>
                    </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">1</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Non-Compliant</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">1</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Policies</p>
                            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{samplePolicies.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search policies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">All Categories</option>
                        <option value="spending">Spending</option>
                        <option value="approval">Approval</option>
                        <option value="compliance">Compliance</option>
                        <option value="security">Security</option>
                    </select>
                </div>
            </div>

            {/* Policies List */}
            <SectionCard title="Company Policies" subtitle={`${filteredPolicies.length} policies`}>
                <div className="space-y-3">
                    {filteredPolicies.map((policy) => (
                        <div key={policy.id}>
                            <div
                                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    {getCategoryIcon(policy.category)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{policy.title}</h3>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(policy.status, policy.requiresAttention)}
                                            <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${expandedPolicy === policy.id ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{policy.description}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Last updated: {policy.lastUpdated}</p>
                                </div>
                            </div>
                            {expandedPolicy === policy.id && (
                                <div className="mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Policy Details</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{policy.description}</p>
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="outline" className="text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">View Full Policy</Button>
                                        <Button variant="ghost" className="text-sm dark:text-gray-300">Acknowledge</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Compliance Checklist */}
            <SectionCard title="Compliance Checklist" subtitle="Current compliance status">
                <div className="space-y-3">
                    {sampleCompliance.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.status === 'compliant' ? 'bg-green-100 dark:bg-green-900/30' :
                                        item.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                    }`}>
                                    {item.status === 'compliant' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : item.status === 'pending' ? (
                                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.requirement}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.details}</p>
                                </div>
                            </div>
                            {getComplianceBadge(item.status)}
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
