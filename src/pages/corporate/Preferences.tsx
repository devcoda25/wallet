// ============================================================================
// Preferences Page
// User preferences and settings
// ============================================================================

import React, { useState } from 'react';
import {
    Bell,
    Globe,
    Moon,
    Sun,
    Shield,
    Mail,
    Smartphone,
    Eye,
    EyeOff,
    Save,
    RefreshCw
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

export default function Preferences() {
    const { selectedOrg } = useOrganization();
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [transactionAlerts, setTransactionAlerts] = useState(true);
    const [budgetAlerts, setBudgetAlerts] = useState(true);
    const [policyUpdates, setPolicyUpdates] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [compactView, setCompactView] = useState(false);
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('UTC');
    const [currency, setCurrency] = useState('USD');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSaving(false);
    };

    const handleReset = () => {
        setEmailNotifications(true);
        setPushNotifications(true);
        setSmsNotifications(false);
        setTransactionAlerts(true);
        setBudgetAlerts(true);
        setPolicyUpdates(true);
        setMarketingEmails(false);
        setDarkMode(false);
        setCompactView(false);
        setLanguage('en');
        setTimezone('UTC');
        setCurrency('USD');
    };

    return (
        <div className="space-y-6 p-6 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Preferences</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOrg ? `${selectedOrg.name} - ` : ''}Customize your experience
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                        <RefreshCw className="w-4 h-4" />
                        Reset to Default
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Notification Settings */}
            <SectionCard title="Notification Preferences" subtitle="Choose how you want to be notified">
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPushNotifications(!pushNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">SMS Notifications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive text messages for important alerts</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSmsNotifications(!smsNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsNotifications ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Alert Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={transactionAlerts}
                                onChange={(e) => setTransactionAlerts(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Transaction Alerts</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about transactions</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={budgetAlerts}
                                onChange={(e) => setBudgetAlerts(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Budget Alerts</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Budget limit warnings</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={policyUpdates}
                                onChange={(e) => setPolicyUpdates(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Policy Updates</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Company policy changes</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={marketingEmails}
                                onChange={(e) => setMarketingEmails(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Marketing Emails</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Promotions and news</p>
                            </div>
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* Display Settings */}
            <SectionCard title="Display Settings" subtitle="Customize the look and feel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {darkMode ? (
                                    <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                ) : (
                                    <Sun className="w-5 h-5 text-amber-500" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {compactView ? (
                                    <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                ) : (
                                    <Eye className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Compact View</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Show more content with less spacing</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCompactView(!compactView)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${compactView ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactView ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        >
                            <option value="UTC">UTC</option>
                            <option value="EST">Eastern Time</option>
                            <option value="PST">Pacific Time</option>
                            <option value="GMT">GMT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="UGX">UGX (USh)</option>
                        </select>
                    </div>
                </div>
            </SectionCard>

            {/* Security Settings */}
            <SectionCard title="Security Preferences" subtitle="Additional security options">
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                            </div>
                        </div>
                        <Pill label="Enabled" tone="good" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Biometric Login</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Use fingerprint or face recognition</p>
                            </div>
                        </div>
                        <Button variant="outline" className="text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Login Alerts</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified of new sign-ins</p>
                            </div>
                        </div>
                        <Pill label="Enabled" tone="good" />
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
