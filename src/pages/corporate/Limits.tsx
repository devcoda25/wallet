// ============================================================================
// Limits & Budget Page
// Corporate spending limits and budget tracking
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    Wallet
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';

// Types
interface LimitCategory {
    id: string;
    name: string;
    spent: number;
    limit: number;
    period: 'daily' | 'weekly' | 'monthly' | 'annual';
    trend: number; // percentage change
}

interface BudgetAlert {
    id: string;
    category: string;
    message: string;
    severity: 'warning' | 'danger' | 'info';
    date: string;
}

// Sample data
const sampleLimits: LimitCategory[] = [
    { id: '1', name: 'Travel & Transport', spent: 12500, limit: 20000, period: 'monthly', trend: 12 },
    { id: '2', name: 'Office Supplies', spent: 3200, limit: 5000, period: 'monthly', trend: -5 },
    { id: '3', name: 'Client Entertainment', spent: 8500, limit: 10000, period: 'monthly', trend: 25 },
    { id: '4', name: 'Software & Tools', spent: 15000, limit: 20000, period: 'monthly', trend: 8 },
    { id: '5', name: 'Training & Development', spent: 4500, limit: 15000, period: 'annual', trend: 0 },
];

const sampleAlerts: BudgetAlert[] = [
    { id: '1', category: 'Client Entertainment', message: '85% of monthly budget consumed', severity: 'warning', date: '2024-01-15' },
    { id: '2', category: 'Travel & Transport', message: 'Approaching monthly limit', severity: 'info', date: '2024-01-14' },
];

export default function Limits() {
    const { selectedOrg } = useOrganization();
    const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('monthly');
    const [showAddLimit, setShowAddLimit] = useState(false);

    // Filter and sort limits
    const filteredLimits = useMemo(() => {
        return sampleLimits
            .filter(l => l.period === selectedPeriod)
            .sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit));
    }, [selectedPeriod]);

    // Stats
    const totalSpent = filteredLimits.reduce((sum, l) => sum + l.spent, 0);
    const totalLimit = filteredLimits.reduce((sum, l) => sum + l.limit, 0);
    const overallUsage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    // Get status color
    const getUsageColor = (percentage: number): 'good' | 'warn' | 'bad' => {
        if (percentage >= 90) return 'bad';
        if (percentage >= 70) return 'warn';
        return 'good';
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="space-y-6 p-6 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Limits & Budget</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Manage spending limits and budgets
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowAddLimit(true)}
                    className="flex items-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Set New Limit
                </Button>
            </div>

            {/* Overall Budget Summary */}
            <SectionCard title="Overall Budget Usage" subtitle="Current month">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overall Budget Usage</h2>
                    <Pill label={`${Math.round(overallUsage)}% Used`} tone={getUsageColor(overallUsage) as 'good' | 'warn' | 'bad'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <ProgressBar
                            value={overallUsage}
                            total={100}
                            showDetails={false}
                            formatValue={(v) => `${Math.round(v)}%`}
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatCurrency(totalSpent)} spent</span>
                            <span>{formatCurrency(totalLimit)} total limit</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                <Wallet className="w-5 h-5" />
                                <span className="text-sm">Remaining</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalLimit - totalSpent)}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Period Filter */}
            <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'annual'] as const).map((period) => (
                    <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedPeriod === period
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                ))}
            </div>

            {/* Alerts Section */}
            {sampleAlerts.length > 0 && (
                <SectionCard title="Budget Alerts" subtitle={`${sampleAlerts.length} active alerts`}>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Budget Alerts</h2>
                    <div className="space-y-3">
                        {sampleAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-start gap-3 p-3 rounded-lg ${
                                    alert.severity === 'danger'
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : alert.severity === 'warning'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    }`}
                            >
                                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                                    alert.severity === 'danger'
                                    ? 'text-red-500 dark:text-red-400'
                                    : alert.severity === 'warning'
                                        ? 'text-amber-500 dark:text-amber-400'
                                        : 'text-blue-500 dark:text-blue-400'
                                    }`} />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{alert.category}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{alert.date}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Limits by Category */}
            <SectionCard title="Limits by Category" subtitle={`${filteredLimits.length} categories`}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Limits by Category</h2>
                <div className="space-y-4">
                    {filteredLimits.map((limit) => {
                        const percentage = (limit.spent / limit.limit) * 100;
                        const remaining = limit.limit - limit.spent;

                        return (
                            <div key={limit.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{limit.name}</h3>
                                        <Pill label={`${Math.round(percentage)}%`} tone={getUsageColor(percentage) as 'good' | 'warn' | 'bad'} />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            {limit.trend > 0 ? (
                                                <TrendingUp className="w-4 h-4 text-red-500 dark:text-red-400" />
                                            ) : limit.trend < 0 ? (
                                                <TrendingDown className="w-4 h-4 text-green-500 dark:text-green-400" />
                                            ) : null}
                                            {limit.trend > 0 ? '+' : ''}{limit.trend}%
                                        </span>
                                        <span className="capitalize">{limit.period}</span>
                                    </div>
                                </div>

                                <ProgressBar
                                    value={percentage}
                                    total={100}
                                    showDetails={false}
                                />

                                <div className="flex justify-between mt-2 text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {formatCurrency(limit.spent)} of {formatCurrency(limit.limit)}
                                    </span>
                                    <span className={`font-medium ${
                                        remaining < 0 
                                            ? 'text-red-500 dark:text-red-400' 
                                            : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {remaining >= 0 ? formatCurrency(remaining) + ' left' : formatCurrency(Math.abs(remaining)) + ' over'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center justify-center gap-2 p-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                    <DollarSign className="w-5 h-5" />
                    Request Budget Increase
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2 p-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                    <Clock className="w-5 h-5" />
                    View Spending History
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2 p-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                    <CheckCircle className="w-5 h-5" />
                    Approve Pending Requests
                </Button>
            </div>
        </div>
    );
}
