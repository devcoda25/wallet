// ============================================================================
// Security & Trust Page
// Account security settings and activity monitoring
// ============================================================================

import React, { useState } from 'react';
import {
    Shield,
    Lock,
    Smartphone,
    Key,
    Eye,
    EyeOff,
    CheckCircle,
    AlertTriangle,
    Clock,
    MapPin,
    Monitor,
    LogOut,
    RefreshCw,
    Plus,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

// Types
interface Session {
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
}

interface SecurityEvent {
    id: string;
    type: 'login' | 'password_change' | '2fa_change' | 'permission_change';
    description: string;
    timestamp: string;
    status: 'success' | 'failed';
    ip: string;
}

// Sample data
const sampleSessions: Session[] = [
    { id: '1', device: 'Chrome on Windows', location: 'Kampala, Uganda', ip: '102.223.45.67', lastActive: 'Now', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'Kampala, Uganda', ip: '102.223.45.68', lastActive: '2 hours ago', current: false },
    { id: '3', device: 'Firefox on MacOS', location: 'Nairobi, Kenya', ip: '197.232.45.89', lastActive: '1 day ago', current: false },
];

const sampleEvents: SecurityEvent[] = [
    { id: '1', type: 'login', description: 'Successful login', timestamp: '2024-01-15T10:30:00Z', status: 'success', ip: '102.223.45.67' },
    { id: '2', type: 'password_change', description: 'Password changed', timestamp: '2024-01-14T15:00:00Z', status: 'success', ip: '102.223.45.67' },
    { id: '3', type: 'login', description: 'Failed login attempt', timestamp: '2024-01-13T22:15:00Z', status: 'failed', ip: '45.33.128.92' },
    { id: '4', type: '2fa_change', description: '2FA enabled', timestamp: '2024-01-12T09:00:00Z', status: 'success', ip: '102.223.45.67' },
];

export default function Security() {
    const { selectedOrg } = useOrganization();
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    // Get event icon
    const getEventIcon = (type: SecurityEvent['type'], status: SecurityEvent['status']) => {
        const colorClass = status === 'success' ? 'text-green-500' : 'text-red-500';
        switch (type) {
            case 'login':
                return <Monitor className={`w-5 h-5 ${colorClass}`} />;
            case 'password_change':
                return <Key className={`w-5 h-5 ${colorClass}`} />;
            case '2fa_change':
                return <Smartphone className={`w-5 h-5 ${colorClass}`} />;
            case 'permission_change':
                return <Shield className={`w-5 h-5 ${colorClass}`} />;
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security & Trust</h1>
                    <p className="text-gray-500 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Manage your account security
                    </p>
                </div>
            </div>

            {/* Security Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard title="Security Score" subtitle="Overall protection level">
                    <div className="flex items-center justify-center mt-4">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="#e5e7eb"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="#10b981"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray="352"
                                    strokeDashoffset="70"
                                    className="transition-all"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900">80%</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                        <Pill label="Strong" tone="good" />
                    </div>
                </SectionCard>

                <SectionCard title="Active Sessions" subtitle={`${sampleSessions.length} devices`}>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Monitor className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{sampleSessions.length}</p>
                            <p className="text-sm text-gray-500">Logged in devices</p>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Recent Events" subtitle="Last 7 days">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{sampleEvents.filter((e) => e.status === 'success').length}</p>
                            <p className="text-sm text-gray-500">Successful actions</p>
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* Password Security */}
            <SectionCard title="Password Security" subtitle="Last changed 30 days ago">
                <div className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Lock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Password Strength</p>
                                    <p className="text-sm text-gray-500">Use a strong, unique password</p>
                                </div>
                            </div>
                            <Pill label="Strong" tone="good" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    defaultValue="••••••••••••"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Change Password
                    </Button>
                </div>
            </SectionCard>

            {/* Two-Factor Authentication */}
            <SectionCard title="Two-Factor Authentication" subtitle="Additional security layer">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Smartphone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Authenticator App</p>
                            <p className="text-sm text-gray-500">Use an authenticator app for 2FA</p>
                        </div>
                    </div>
                    <Pill label="Enabled" tone="good" />
                </div>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline">Manage 2FA</Button>
                    <Button variant="ghost">Backup Codes</Button>
                </div>
            </SectionCard>

            {/* Active Sessions */}
            <SectionCard title="Active Sessions" subtitle="Manage your logged in devices">
                <div className="space-y-3 mt-4">
                    {sampleSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Monitor className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{session.device}</p>
                                        {session.current && <Pill label="Current" tone="good" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="w-4 h-4" />
                                        <span>{session.location}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{session.ip}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {session.lastActive}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {!session.current && (
                                <Button variant="ghost" className="text-red-600 flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    Revoke
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <Button variant="outline" className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out All Other Sessions
                    </Button>
                </div>
            </SectionCard>

            {/* Security Activity Log */}
            <SectionCard title="Security Activity" subtitle="Recent account activity">
                <div className="space-y-3 mt-4">
                    {sampleEvents.map((event) => (
                        <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {getEventIcon(event.type, event.status)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900">{event.description}</p>
                                    <Pill
                                        label={event.status === 'success' ? 'Success' : 'Failed'}
                                        tone={event.status === 'success' ? 'good' : 'bad'}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTimestamp(event.timestamp)}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{event.ip}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View Full Activity Log
                    </Button>
                </div>
            </SectionCard>

            {/* API Keys */}
            <SectionCard title="API Keys" subtitle="Manage API access">
                <div className="p-4 bg-gray-50 rounded-lg mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Key className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Production API Key</p>
                                <p className="text-sm text-gray-500">Created 60 days ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Pill label="Active" tone="good" />
                            <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="flex items-center gap-2 mt-4">
                    <Plus className="w-4 h-4" />
                    Generate New API Key
                </Button>
            </SectionCard>
        </div>
    );
}
