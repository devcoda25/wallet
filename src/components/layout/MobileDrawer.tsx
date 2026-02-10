import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./navigation";

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const location = useLocation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
                    <span className="text-lg font-bold text-slate-900">Menu</span>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
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
                                                onClick={() => {
                                                    navigate(item.path);
                                                    onClose();
                                                }}
                                                className={cn(
                                                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                                                    isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {item.icon}
                                                    {item.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}
