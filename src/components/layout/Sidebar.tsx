import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { NAV_SECTIONS } from "./navigation";

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <aside className="hidden lg:block relative">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                <nav className="space-y-8">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item, i) => {
                                    if (item.type === "divider") {
                                        return <hr key={i} className="my-2 border-slate-200" />;
                                    }
                                    if (item.type === "header") {
                                        return (
                                            <h4 key={i} className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                {item.label}
                                            </h4>
                                        );
                                    }
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={cn(
                                                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                                    isActive ? "bg-white text-emerald-600 shadow-sm" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </div>
                                            {item.badge && (
                                                <Pill label={item.badge} tone={isActive ? "info" : "neutral"} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Quick Actions Card */}
                <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                        <Sparkles className="h-5 w-5 text-amber-300" />
                    </div>
                    <h4 className="font-semibold">Premium Features</h4>
                    <p className="mt-1 text-xs text-slate-400 mb-4">Upgrade for policy simulator and AI insights.</p>
                    <button className="w-full rounded-lg bg-white py-2 text-xs font-bold text-slate-900 shadow hover:bg-slate-50 transition-colors">
                        View Plans
                    </button>
                </div>
            </div>
        </aside>
    );
}
