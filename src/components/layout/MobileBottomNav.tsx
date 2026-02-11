import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Navigation icons
import {
    Home,
    Wallet,
    CreditCard,
    FileText,
    Settings,
    Zap,
    Truck,
    ShoppingCart,
    Shield,
    Bell,
    ChevronUp,
} from "lucide-react";

// Navigation items for bottom bar
const BOTTOM_NAV_ITEMS = [
    { path: "/home", label: "Home", icon: Home },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/checkout", label: "Pay", icon: CreditCard },
    { path: "/services", label: "Services", icon: Zap },
    { path: "/settings", label: "Settings", icon: Settings },
];

// Extended navigation for services submenu
const SERVICES_ITEMS = [
    { path: "/flows/ev-charging", label: "EV Charging", icon: Zap },
    { path: "/flows/rides", label: "Rides", icon: Truck },
    { path: "/flows/ecommerce", label: "Shopping", icon: ShoppingCart },
    { path: "/flows/delivery", label: "Delivery", icon: Truck },
];

interface MobileBottomNavProps {
    className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showServices, setShowServices] = React.useState(false);

    // Check if current route is a checkout/flow page
    const isFlowPage = location.pathname.startsWith("/flows/") ||
        location.pathname.startsWith("/checkout/");

    // Don't show bottom nav on checkout/flow pages
    if (isFlowPage) {
        return null;
    }

    return (
        <>
            {/* Services Popover */}
            <AnimatePresence>
                {showServices && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowServices(false)}
                        />

                        {/* Services Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Services</h3>
                                    <button
                                        onClick={() => setShowServices(false)}
                                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-700"
                                    >
                                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {SERVICES_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;

                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setShowServices(false);
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                                                    isActive
                                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-3 rounded-full",
                                                    isActive
                                                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                                                        : "bg-slate-100 dark:bg-slate-700"
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Corporate Link */}
                            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                                <button
                                    onClick={() => {
                                        navigate("/corporate");
                                        setShowServices(false);
                                    }}
                                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-slate-900 dark:text-white">Corporate</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Business accounts</p>
                                    </div>
                                    <ChevronUp className="w-4 h-4 text-slate-400 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 safe-area-pb",
                    "bg-white dark:bg-slate-800",
                    "border-t border-slate-200 dark:border-slate-700",
                    "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)]",
                    "flex items-center justify-around py-2 px-2",
                    className
                )}
            >
                {BOTTOM_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/");

                    // Special handling for Services
                    if (item.path === "/services") {
                        return (
                            <button
                                key={item.path}
                                onClick={() => setShowServices(true)}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                                    "text-slate-500 dark:text-slate-400"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full transition-colors",
                                    showServices
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                        : "text-slate-500 dark:text-slate-400"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>

                                {/* Active indicator */}
                                {showServices && (
                                    <span className="absolute bottom-0 w-1 h-1 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                                isActive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                isActive
                                    ? "bg-emerald-50 dark:bg-emerald-900/30"
                                    : "text-slate-500 dark:text-slate-400"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>

                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 w-1 h-1 rounded-full bg-emerald-500"
                                />
                            )}
                        </button>
                    );
                })}
            </motion.nav>

            {/* Safe area spacer */}
            <div className="h-16" />
        </>
    );
}

// Import AnimatePresence and motion from framer-motion
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
