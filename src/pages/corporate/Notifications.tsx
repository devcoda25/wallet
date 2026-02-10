// ============================================================================
// Notifications Page
// Notification center for corporate users
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    Search,
    Settings,
    AlertCircle,
    FileText,
    DollarSign,
    Clock,
    User
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

// Types
interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    category: 'transaction' | 'policy' | 'budget' | 'approval' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

// Sample data
const sampleNotifications: Notification[] = [
    {
        id: '1',
        type: 'warning',
        category: 'budget',
        title: 'Budget Alert',
        message: 'Your monthly travel budget has reached 85% utilization. Consider reviewing pending requests.',
        timestamp: '2024-01-15T10:30:00Z',
        read: false,
    },
    {
        id: '2',
        type: 'success',
        category: 'transaction',
        title: 'Payment Approved',
        message: 'Your payment request for $2,500 to ABC Suppliers has been approved.',
        timestamp: '2024-01-15T09:15:00Z',
        read: false,
    },
    {
        id: '3',
        type: 'info',
        category: 'policy',
        title: 'Policy Update',
        message: 'The travel expense policy has been updated. Please review the new guidelines.',
        timestamp: '2024-01-14T16:00:00Z',
        read: true,
    },
    {
        id: '4',
        type: 'error',
        category: 'approval',
        title: 'Approval Required',
        message: 'You have 3 pending approval requests requiring your attention.',
        timestamp: '2024-01-14T14:30:00Z',
        read: false,
    },
    {
        id: '5',
        type: 'info',
        category: 'system',
        title: 'Maintenance Scheduled',
        message: 'System maintenance scheduled for Sunday, 2AM-4AM UTC.',
        timestamp: '2024-01-13T12:00:00Z',
        read: true,
    },
    {
        id: '6',
        type: 'success',
        category: 'transaction',
        title: 'Receipt Submitted',
        message: 'Your expense receipt for $150 has been successfully submitted.',
        timestamp: '2024-01-12T11:00:00Z',
        read: true,
    },
];

export default function Notifications() {
    const { selectedOrg } = useOrganization();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return sampleNotifications.filter((notification) => {
            const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notification.message.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !selectedCategory || notification.category === selectedCategory;
            const matchesReadStatus = !showUnreadOnly || !notification.read;
            return matchesSearch && matchesCategory && matchesReadStatus;
        });
    }, [searchQuery, selectedCategory, showUnreadOnly]);

    // Stats
    const unreadCount = sampleNotifications.filter((n) => !n.read).length;
    const totalCount = sampleNotifications.length;

    // Get notification icon
    const getNotificationIcon = (category: Notification['category'], type: Notification['type']) => {
        const iconClass = `w-5 h-5 ${type === 'error' ? 'text-red-500' :
            type === 'warning' ? 'text-amber-500' :
                type === 'success' ? 'text-green-500' : 'text-blue-500'
            }`;

        switch (category) {
            case 'transaction':
                return <DollarSign className={iconClass} />;
            case 'policy':
                return <FileText className={iconClass} />;
            case 'budget':
                return <AlertCircle className={iconClass} />;
            case 'approval':
                return <Check className={iconClass} />;
            case 'system':
                return <Settings className={iconClass} />;
            default:
                return <Bell className={iconClass} />;
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Toggle selection
    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedNotifications);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedNotifications(newSelection);
    };

    // Select all
    const selectAll = () => {
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
        }
    };

    return (
        <div className="space-y-6 p-6 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Stay updated with your account activity
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Pill tone={unreadCount > 0 ? 'warn' : 'good'} label={`${unreadCount} unread`} />
                    <Button variant="outline" className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard title="Total Notifications" subtitle={`${totalCount} messages`}>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Unread" subtitle="Pending attention">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{unreadCount}</p>
                    </div>
                </SectionCard>
                <SectionCard title="Read" subtitle="Viewed messages">
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount - unreadCount}</p>
                    </div>
                </SectionCard>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">All Categories</option>
                        <option value="transaction">Transaction</option>
                        <option value="policy">Policy</option>
                        <option value="budget">Budget</option>
                        <option value="approval">Approval</option>
                        <option value="system">System</option>
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Unread only</span>
                    </label>
                </div>
                <div className="flex gap-2">
                    {selectedNotifications.size > 0 && (
                        <>
                            <Button variant="outline" className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                <CheckCheck className="w-4 h-4" />
                                Mark as Read ({selectedNotifications.size})
                            </Button>
                            <Button variant="ghost" className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <SectionCard title="All Notifications" subtitle={`${filteredNotifications.length} items`}>
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${notification.read
                                        ? 'bg-white dark:bg-gray-800'
                                        : 'bg-blue-50 dark:bg-blue-900/20'
                                    }
                                ${selectedNotifications.has(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.has(notification.id)}
                                    onChange={() => toggleSelection(notification.id)}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                                />
                                <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                                    {getNotificationIcon(notification.category, notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {notification.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{notification.message}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Pill
                                            label={notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                                            tone={notification.type === 'error' ? 'bad' : notification.type === 'warning' ? 'warn' : notification.type === 'success' ? 'good' : 'info'}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
