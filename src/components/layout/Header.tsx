import React from "react";
import { Building2, Menu, Search, Bell, ChevronRight, Sun, Moon } from "lucide-react";
import { useThemeToggle } from "@/theme/ThemeContext";

interface HeaderProps {
    onMobileMenuOpen: () => void;
    userName?: string;
}

export function Header({ onMobileMenuOpen, userName = "Alex Doe" }: HeaderProps) {
    const toggleTheme = useThemeToggle();
    const isDark = document.documentElement.classList.contains('dark');

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
            <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-6">

                {/* Logo & Mobile Toggle */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMobileMenuOpen}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">wallet</div>
                            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Workspace</div>
                        </div>
                    </div>
                </div>

                {/* Search Bar (Desktop) */}
                <div className="hidden max-w-md flex-1 px-8 md:block">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search requests, receipts, or policies..."
                            className="h-10 w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="relative rounded-full p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {isDark ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </button>

                    <button className="relative rounded-full p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                    <button className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-1 pr-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400"></div>
                        <span className="hidden text-xs font-semibold text-slate-700 dark:text-slate-300 sm:block">{userName}</span>
                        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>
            </div>
        </header>
    );
}
