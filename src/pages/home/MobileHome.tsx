import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Wallet,
    CreditCard,
    Zap,
    Truck,
    ShoppingCart,
    FileText,
    Shield,
    Bell,
    Settings,
    ArrowRight,
    TrendingUp,
    DollarSign,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SectionCard } from "@/components/ui/SectionCard";

// Quick action items
const QUICK_ACTIONS = [
    { path: "/wallet/add-money", label: "Add Money", icon: Wallet, color: "emerald" },
    { path: "/wallet/send-money", label: "Send", icon: DollarSign, color: "blue" },
    { path: "/flows/ev-charging", label: "EV Charging", icon: Zap, color: "amber" },
    { path: "/flows/rides", label: "Rides", icon: Truck, color: "indigo" },
    { path: "/flows/ecommerce", label: "Shop", icon: ShoppingCart, color: "rose" },
    { path: "/checkout", label: "Pay", icon: CreditCard, color: "violet" },
];

// Service cards
const SERVICES = [
    {
        title: "EV Charging",
        subtitle: "Find charging stations",
        icon: Zap,
        path: "/flows/ev-charging",
        color: "from-amber-500 to-orange-500",
    },
    {
        title: "Rides & Logistics",
        subtitle: "Book rides, send packages",
        icon: Truck,
        path: "/flows/rides",
        color: "from-blue-500 to-indigo-500",
    },
    {
        title: "E-Commerce",
        subtitle: "Shop online securely",
        icon: ShoppingCart,
        path: "/flows/ecommerce",
        color: "from-rose-500 to-pink-500",
    },
    {
        title: "Delivery",
        subtitle: "Send packages",
        icon: FileText,
        path: "/flows/delivery",
        color: "from-emerald-500 to-teal-500",
    },
];

// Recent transactions
const RECENT_TRANSACTIONS = [
    { id: 1, title: "EV Charging", amount: "-UGX 45,000", time: "2h ago", icon: Zap, type: "expense" },
    { id: 2, title: "Received from John", amount: "+UGX 150,000", time: "5h ago", icon: Wallet, type: "income" },
    { id: 3, title: "Rides Fare", amount: "-UGX 25,000", time: "Yesterday", icon: Truck, type: "expense" },
    { id: 4, title: "Refund", amount: "+UGX 12,500", time: "2 days ago", icon: Activity, type: "income" },
];

// Get color classes
function getColorClasses(color: string) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
        rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
        violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    };
    return colors[color] || colors.emerald;
}

export default function MobileHome() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-emerald-100 text-sm font-medium">Welcome back!</p>
                        <h1 className="text-2xl font-bold mt-1">John Doe</h1>
                    </div>
                    <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                    <p className="text-emerald-100 text-sm">Total Balance</p>
                    <h2 className="text-3xl font-bold mt-1">UGX 2,450,000</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="w-4 h-4 text-emerald-200" />
                        <span className="text-emerald-200 text-sm">+12.5% this month</span>
                    </div>
                </div>

                {/* Quick Balance Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-emerald-200 text-xs">Corporate</p>
                        <p className="font-semibold">UGX 1,800,000</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-emerald-200 text-xs">Personal</p>
                        <p className="font-semibold">UGX 650,000</p>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <SectionCard title="Quick Actions" className="overflow-hidden">
                <div className="grid grid-cols-6 gap-2">
                    {QUICK_ACTIONS.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <motion.button
                                key={action.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className={cn("p-3 rounded-xl", getColorClasses(action.color))}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">
                                    {action.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Services Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Services</h2>
                    <button className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        View all <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {SERVICES.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <motion.div
                                key={service.path}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    onClick={() => navigate(service.path)}
                                    className="w-full bg-gradient-to-br rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow text-left"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, ${service.color})`,
                                    }}
                                >
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl w-fit mb-3">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{service.title}</h3>
                                    <p className="text-white/80 text-sm mt-1">{service.subtitle}</p>
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Transactions */}
            <SectionCard title="Recent Transactions" subtitle="Your latest activity">
                <div className="space-y-3 mt-4">
                    {RECENT_TRANSACTIONS.map((tx, index) => {
                        const Icon = tx.icon;
                        return (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <div className={cn(
                                    "p-3 rounded-xl",
                                    tx.type === "income"
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900 dark:text-white">{tx.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{tx.time}</p>
                                </div>
                                <Pill
                                    label={tx.amount}
                                    tone={tx.type === "income" ? "good" : "neutral"}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                <button className="w-full mt-4 py-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    View all transactions
                </button>
            </SectionCard>

            {/* Corporate Quick Access */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">Corporate Account</h3>
                        <p className="text-blue-100 text-sm">ACME Corporation</p>
                    </div>
                    <button
                        onClick={() => navigate("/corporate")}
                        className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                        Open
                    </button>
                </div>
            </motion.div>

            {/* Bottom spacer for nav */}
            <div className="h-4" />
        </div>
    );
}
