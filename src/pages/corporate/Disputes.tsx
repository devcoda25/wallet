// ============================================================================
// Disputes & Support Page
// Customer support and dispute resolution
// ============================================================================

import React, { useState } from 'react';
import {
    MessageCircle,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    Search,
    Filter,
    Phone,
    Mail,
    ExternalLink
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

// Types
interface Dispute {
    id: string;
    type: 'charge' | 'refund' | 'fraud' | 'service' | 'other';
    subject: string;
    description: string;
    status: 'open' | 'pending' | 'resolved' | 'closed';
    amount?: number;
    createdAt: string;
    updatedAt: string;
    referenceNumber: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    lastResponse: string;
}

// Sample data
const sampleDisputes: Dispute[] = [
    {
        id: '1',
        type: 'charge',
        subject: 'Unauthorized charge',
        description: 'I noticed an unauthorized charge of $250 on my account from January 10th.',
        status: 'open',
        amount: 250,
        createdAt: '2024-01-14',
        updatedAt: '2024-01-15',
        referenceNumber: 'DSP-2024-001',
    },
    {
        id: '2',
        type: 'refund',
        subject: 'Refund not received',
        description: 'I requested a refund on January 5th but have not received it yet.',
        status: 'pending',
        amount: 150,
        createdAt: '2024-01-05',
        updatedAt: '2024-01-12',
        referenceNumber: 'DSP-2024-002',
    },
    {
        id: '3',
        type: 'service',
        subject: 'Service not as described',
        description: 'The service provided did not match the description on the website.',
        status: 'resolved',
        amount: 500,
        createdAt: '2023-12-20',
        updatedAt: '2024-01-08',
        referenceNumber: 'DSP-2023-089',
    },
];

const sampleTickets: SupportTicket[] = [
    {
        id: '1',
        subject: 'How to update payment methods?',
        status: 'resolved',
        priority: 'low',
        createdAt: '2024-01-13',
        lastResponse: '2024-01-14',
    },
    {
        id: '2',
        subject: 'Cannot access corporate dashboard',
        status: 'in-progress',
        priority: 'high',
        createdAt: '2024-01-15',
        lastResponse: '2024-01-15',
    },
    {
        id: '3',
        subject: 'Question about expense limits',
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15',
        lastResponse: '2024-01-15',
    },
];

export default function Disputes() {
    const { selectedOrg } = useOrganization();
    const [activeTab, setActiveTab] = useState<'disputes' | 'tickets'>('disputes');
    const [searchQuery, setSearchQuery] = useState('');

    // Get status badge
    const getStatusBadge = (status: Dispute['status'] | SupportTicket['status']) => {
        switch (status) {
            case 'open':
                return <Pill label="Open" tone="bad" />;
            case 'pending':
                return <Pill label="Pending" tone="warn" />;
            case 'in-progress':
                return <Pill label="In Progress" tone="info" />;
            case 'resolved':
                return <Pill label="Resolved" tone="good" />;
            case 'closed':
                return <Pill label="Closed" tone="neutral" />;
        }
    };

    // Get priority badge
    const getPriorityBadge = (priority: SupportTicket['priority']) => {
        switch (priority) {
            case 'high':
                return <Pill label="High" tone="bad" />;
            case 'medium':
                return <Pill label="Medium" tone="warn" />;
            case 'low':
                return <Pill label="Low" tone="info" />;
        }
    };

    // Get type icon
    const getTypeIcon = (type: Dispute['type']) => {
        switch (type) {
            case 'charge':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'refund':
                return <Clock className="w-5 h-5 text-amber-500" />;
            case 'fraud':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'service':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            default:
                return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    // Stats
    const openDisputes = sampleDisputes.filter((d) => d.status === 'open').length;
    const pendingDisputes = sampleDisputes.filter((d) => d.status === 'pending').length;
    const resolvedDisputes = sampleDisputes.filter((d) => d.status === 'resolved').length;
    const openTickets = sampleTickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Disputes & Support</h1>
                    <p className="text-gray-500 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Manage disputes and contact support
                    </p>
                </div>
                <Button variant="primary" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Dispute
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SectionCard title="Open Disputes" subtitle="Awaiting review">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{openDisputes}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Pending" subtitle="In review">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{pendingDisputes}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Resolved" subtitle="This month">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{resolvedDisputes}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Open Tickets" subtitle="Support requests">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{openTickets}</p>
                    </div>
                </SectionCard>
            </div>

            {/* Quick Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="tel:+18001234567" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Call Support</p>
                        <p className="text-sm text-gray-500">1-800-123-4567</p>
                    </div>
                </a>
                <a href="mailto:support@corporatepay.com" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Email Us</p>
                        <p className="text-sm text-gray-500">support@corporatepay.com</p>
                    </div>
                </a>
                <a href="#" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <ExternalLink className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Help Center</p>
                        <p className="text-sm text-gray-500">Browse knowledge base</p>
                    </div>
                </a>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('disputes')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'disputes'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Disputes ({sampleDisputes.length})
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'tickets'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Support Tickets ({sampleTickets.length})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search disputes or tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Disputes List */}
            {activeTab === 'disputes' && (
                <SectionCard title="Recent Disputes" subtitle={`${sampleDisputes.length} total`}>
                    <div className="space-y-3">
                        {sampleDisputes.map((dispute) => (
                            <div key={dispute.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            {getTypeIcon(dispute.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900">{dispute.subject}</h3>
                                                {getStatusBadge(dispute.status)}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{dispute.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span>{dispute.referenceNumber}</span>
                                                <span>Created: {dispute.createdAt}</span>
                                                {dispute.amount && (
                                                    <span className="font-medium text-gray-600">${dispute.amount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="text-sm">View Details</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Support Tickets */}
            {activeTab === 'tickets' && (
                <SectionCard title="Support Tickets" subtitle={`${sampleTickets.length} tickets`}>
                    <div className="space-y-3">
                        {sampleTickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <MessageCircle className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                                <span>Ticket #{ticket.id}</span>
                                                <span>Created: {ticket.createdAt}</span>
                                                <span>Last response: {ticket.lastResponse}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(ticket.status)}
                                        <Button variant="outline" className="text-sm">View</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* FAQ Section */}
            <SectionCard title="Common Questions" subtitle="Quick answers to frequently asked questions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">How long does dispute resolution take?</h4>
                        <p className="text-sm text-gray-500 mt-1">Most disputes are resolved within 7-10 business days. Complex cases may take longer.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">What information do I need to provide?</h4>
                        <p className="text-sm text-gray-500 mt-1">Provide transaction details, dates, amounts, and a description of the issue.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">Can I appeal a decision?</h4>
                        <p className="text-sm text-gray-500 mt-1">Yes, you can submit an appeal within 30 days of the resolution.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">How do I check my dispute status?</h4>
                        <p className="text-sm text-gray-500 mt-1">Track all your disputes and tickets in this dashboard. Updates will be posted here.</p>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
